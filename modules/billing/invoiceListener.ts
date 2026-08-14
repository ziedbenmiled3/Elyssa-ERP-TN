import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { PosSalePayload } from '../pos/posService';
import { InvoiceTunisiaPayload } from '../../infrastructure/EventTypes';

export class InvoiceListener {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initialize billing subscription to POS sale events.
   * Ensures absolute protection against service crashes if 'FACTURATION_RECOUVREMENT' is disabled.
   * @param isModuleEnabledCallback Async or sync callback to determine subscription activation status
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    this.eventBus.subscribe<PosSalePayload>('POS_SALE_COMPLETED', async (event: AppEvent<PosSalePayload>) => {
      const { companyId, payload, eventId } = event;

      try {
        // 1. Guard check: is FACTURATION_RECOUVREMENT active?
        const isEnabled = await isModuleEnabledCallback(companyId);
        if (!isEnabled) {
          console.log(`[InvoiceListener] Billing skipped for company "${companyId}": 'FACTURATION_RECOUVREMENT' module is not active.`);
          return;
        }

        console.log(`[InvoiceListener] Processing POS sale event "${eventId}" to generate Tunisian Invoice...`);

        // 2. Perform compliant Tunisian fiscal calculations
        // We extract HT from the incoming POS ticket TTC. Let's assume standard TVA 19% for retail products.
        // Formula: HT = TTC_raw / 1.19
        const rawTTC = payload.amountTtc;
        const rateTVA = 0.19; // 19% Tunisian standard rate
        
        // Accurate decimal roundings to 3 millimes (Tunisian Dinar format: 3 decimal places)
        const amountHT = Math.round((rawTTC / (1 + rateTVA)) * 1000) / 1000;
        const tvaAmount = Math.round((amountHT * rateTVA) * 1000) / 1000;
        
        // Optional FODEC (1% on HT) - let's set to 0.000 for standard retail, but calculate if requested
        const fodecAmount = 0; 
        
        // Tunisian Fiscal Timbre is 1.000 TND (1 Dinar)
        const timbreFiscal = 1.000;

        // Invoice TTC calculation = HT + TVA + FODEC + Timbre
        const amountTTC = Math.round((amountHT + tvaAmount + fodecAmount + timbreFiscal) * 1000) / 1000;

        // Apply Retenue à la source (1.5% on HT) if invoice exceeds 1000 TND (Tunisian Law threshold for state/corporate clients)
        // For standard POS retail it might be false, but let's implement the calculation rules dynamically:
        const retenueSourceApplied = amountHT >= 1000.000;
        const retenueSourceAmount = retenueSourceApplied 
          ? Math.round((amountHT * 0.015) * 1000) / 1000 
          : 0.000;

        const netAPayer = Math.round((amountTTC - retenueSourceAmount) * 1000) / 1000;

        const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const invoicePayload: InvoiceTunisiaPayload = {
          invoiceId,
          ticketId: payload.ticketId,
          customerMatriculeFiscal: "1234567/A/M/000", // Standard placeholder conforming to Tunisian system rules
          amountHT,
          fodecAmount,
          tvaDetails: [
            { rate: 19, amount: tvaAmount }
          ],
          timbreFiscal,
          amountTTC,
          retenueSourceApplied,
          retenueSourceAmount,
          netAPayer
        };

        const invoiceEvent: AppEvent<InvoiceTunisiaPayload> = {
          eventId: `EV-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          eventType: 'INVOICE_PUBLISHED',
          timestamp: new Date().toISOString(),
          companyId,
          payload: invoicePayload
        };

        // 3. Publish the enriched event to the Bus to feed down-stream accounting & audit components asynchronously
        this.eventBus.publish(invoiceEvent);

      } catch (error) {
        // Enclosed in an absolute safe try-catch wrapper to guarantee complete isolation of the POS service
        console.error(`[InvoiceListener] Fatal error while executing billing conversion for company "${companyId}":`, error);
      }
    });
  }
}
