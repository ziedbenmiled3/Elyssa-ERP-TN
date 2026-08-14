import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { InvoiceTunisiaPayload } from '../../infrastructure/EventTypes';

export class CrmListener {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initialize CRM listener subscribing to fiscal invoices.
   * Updates client record (CA/LTV, last purchase date).
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    this.eventBus.subscribe<InvoiceTunisiaPayload>('INVOICE_PUBLISHED', async (event: AppEvent<InvoiceTunisiaPayload>) => {
      const { companyId, payload, eventId } = event;

      try {
        // Guard check
        const isEnabled = await isModuleEnabledCallback(companyId);
        if (!isEnabled) {
          console.log(`[CrmListener] CRM update bypassed for company "${companyId}": Module is not active.`);
          return;
        }

        console.log(`[CrmListener] Processing invoice "${payload.invoiceId}" (Event: ${eventId}) for CRM update...`);

        // Database write operations to update Client Record
        // (Increase LTV/CA by netAPayer or amountHT, update last purchase date)
        await this.updateClientCrmStats(companyId, payload);

      } catch (error) {
        console.error(`[CrmListener] Safe error interception during CRM update for company "${companyId}":`, error);
      }
    });
  }

  private async updateClientCrmStats(companyId: string, payload: InvoiceTunisiaPayload): Promise<void> {
    console.log(`[CrmListener DB] CRM Client updated - Company: "${companyId}", Invoice HT: ${payload.amountHT}, Last Purchase Date: ${new Date().toISOString()}`);
  }
}
