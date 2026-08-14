import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { PosSalePayload } from '../pos/posService';

export interface ImportDossierClosedPayload {
  dossierId: string;
  items: Array<{
    productId: string;
    qty: number;
    landedCostUnitPrice: number;
  }>;
}

export class StockListener {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Binds to POS event hooks.
   * If the client's stock module is inactive/unsubscribed, gracefully bypasses decrementing inventory.
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    this.eventBus.subscribe<PosSalePayload>('POS_SALE_COMPLETED', async (event: AppEvent<PosSalePayload>) => {
      const { companyId, payload } = event;

      // Check module subscription gate
      const isEnabled = await isModuleEnabledCallback(companyId);
      if (!isEnabled) {
        console.log(`[StockListener] Stock decrement skipped for company "${companyId}": STOCKS_FOURNISSEURS module not active.`);
        return;
      }

      console.log(`[StockListener] Decoupled inventory update started for ticket: ${payload.ticketId}`);
      
      for (const item of payload.items) {
        try {
          await this.decrementProductStock(companyId, item.productId, item.quantity);
        } catch (err) {
          console.error(`[StockListener] Error updating stock for product ${item.productId}:`, err);
        }
      }
    });

    this.eventBus.subscribe<ImportDossierClosedPayload>('IMPORT_DOSSIER_CLOSED', async (event: AppEvent<ImportDossierClosedPayload>) => {
      const { companyId, payload } = event;

      // Check module subscription gate
      const isEnabled = await isModuleEnabledCallback(companyId);
      if (!isEnabled) {
        console.log(`[StockListener] Stock increment skipped for company "${companyId}": STOCKS_FOURNISSEURS module not active.`);
        return;
      }

      console.log(`[StockListener] Import closed. Updating inventory & CMUP for dossier: ${payload.dossierId}`);
      
      for (const item of payload.items) {
        try {
          await this.incrementProductStockAndCMUP(companyId, item.productId, item.qty, item.landedCostUnitPrice);
        } catch (err) {
          console.error(`[StockListener] Error updating stock/CMUP for product ${item.productId}:`, err);
        }
      }
    });
  }

  private async decrementProductStock(companyId: string, productId: string, qty: number): Promise<void> {
    // Database write operations for stock inventory reduction
    console.log(`[StockListener DB] Product stock update - Company: "${companyId}", Product: "${productId}", ReducedQty: ${qty}`);
  }

  private async incrementProductStockAndCMUP(companyId: string, productId: string, qty: number, newUnitPrice: number): Promise<void> {
    // Database write operations for stock inventory addition & CMUP recalculation
    console.log(`[StockListener DB] Product stock increment - Company: "${companyId}", Product: "${productId}", AddedQty: ${qty}, NewLandedCost: ${newUnitPrice}`);
  }
}
