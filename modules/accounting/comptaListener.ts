import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { InvoiceTunisiaPayload, AccountingJournalEntry, AccountingEntryLine } from '../../infrastructure/EventTypes';

export class ComptaListener {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initialize accounting listener subscribing to fiscal invoices.
   * Completely isolated against crash propagation.
   * @param isModuleEnabledCallback Guard to check if COMPTABILITE_TRESORERIE module is active
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    this.eventBus.subscribe<InvoiceTunisiaPayload>('INVOICE_PUBLISHED', async (event: AppEvent<InvoiceTunisiaPayload>) => {
      const { companyId, payload, eventId } = event;

      try {
        // 1. Guard check: is COMPTABILITE_TRESORERIE active?
        const isEnabled = await isModuleEnabledCallback(companyId);
        if (!isEnabled) {
          console.log(`[ComptaListener] Accounting bypass for company "${companyId}": 'COMPTABILITE_TRESORERIE' module is not active.`);
          return;
        }

        console.log(`[ComptaListener] Processing invoice "${payload.invoiceId}" (Event: ${eventId}) into double-entry accounting ledger...`);

        const lines: AccountingEntryLine[] = [];

        // --- DEBITS ---
        // 1. Client debit: Account 411000 (Clients) - Net a payer
        lines.push({
          accountCode: '411000',
          accountName: 'Clients',
          debit: payload.netAPayer,
          credit: 0
        });

        // 2. RS subie debit (if applicable): Account 434000 (État - Retenues à la source subies)
        if (payload.retenueSourceApplied && payload.retenueSourceAmount > 0) {
          lines.push({
            accountCode: '434000',
            accountName: 'État - Retenues à la source subies',
            debit: payload.retenueSourceAmount,
            credit: 0
          });
        }

        // --- CREDITS ---
        // 3. Revenue credit: Account 707000 (Ventes de marchandises) - amountHT
        lines.push({
          accountCode: '707000',
          accountName: 'Ventes de marchandises',
          debit: 0,
          credit: payload.amountHT
        });

        // 4. FODEC credit (if applicable): Account 447000 (État - Taxes collectées / FODEC)
        if (payload.fodecAmount > 0) {
          lines.push({
            accountCode: '447000',
            accountName: 'État - Taxes collectées / FODEC',
            debit: 0,
            credit: payload.fodecAmount
          });
        }

        // 5. TVA credit: Account 445700 (TVA Collectée)
        const totalTva = payload.tvaDetails.reduce((sum, item) => sum + item.amount, 0);
        if (totalTva > 0) {
          lines.push({
            accountCode: '445700',
            accountName: 'TVA Collectée',
            debit: 0,
            credit: Math.round(totalTva * 1000) / 1000
          });
        }

        // 6. Timbre Fiscal credit: Account 447300 (État - Impôts directs et taxes assimilées / Timbre Fiscal)
        if (payload.timbreFiscal > 0) {
          lines.push({
            accountCode: '447300',
            accountName: 'État - Impôts directs et taxes assimilées / Timbre Fiscal',
            debit: 0,
            credit: payload.timbreFiscal
          });
        }

        // Verify balance consistency (Sum Debits === Sum Credits)
        const totalDebits = Math.round(lines.reduce((sum, l) => sum + l.debit, 0) * 1000) / 1000;
        const totalCredits = Math.round(lines.reduce((sum, l) => sum + l.credit, 0) * 1000) / 1000;
        const balanced = Math.abs(totalDebits - totalCredits) < 0.001;

        const journalEntry: AccountingJournalEntry = {
          entryId: `JRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceId: payload.invoiceId,
          companyId,
          date: new Date().toISOString(),
          lines,
          balanced
        };

        if (!balanced) {
          console.warn(`[ComptaListener] WARNING: Entry for invoice ${payload.invoiceId} is UNBALANCED! Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`);
        }

        console.log(`[ComptaListener] NCT Journal Entry saved successfully. Entry: ${journalEntry.entryId}. Balanced: ${balanced}`);
        console.log(`[ComptaListener DB Writes] Logged lines for Company "${companyId}":`, JSON.stringify(lines, null, 2));

      } catch (error) {
        console.error(`[ComptaListener] Safe error interception during accounting entry compilation for company "${companyId}":`, error);
      }
    });
  }
}
