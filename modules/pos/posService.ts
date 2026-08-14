import { EventBus, AppEvent } from '../../infrastructure/EventBus';

export interface PosItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PosSalePayload {
  ticketId: string;
  amountTtc: number;
  paymentMethod: 'cash' | 'check' | 'card';
  items: PosItem[];
}

export class PosService {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Validates and completes a POS sale.
   * Completely decoupled from stock state updates by design.
   */
  public async completeSale(companyId: string, saleData: Omit<PosSalePayload, 'ticketId'>): Promise<string> {
    const ticketId = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`[POS] Saving ticket ${ticketId} for company: "${companyId}" to local DB...`);
    
    // Construct standard transactional payload
    const saleEvent: AppEvent<PosSalePayload> = {
      eventId: `EV-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      eventType: 'POS_SALE_COMPLETED',
      timestamp: new Date().toISOString(),
      companyId: companyId,
      payload: {
        ticketId,
        ...saleData
      }
    };

    // Emit event asynchronously; does not wait for database locks or stock decs.
    this.eventBus.publish(saleEvent);

    return ticketId;
  }
}
