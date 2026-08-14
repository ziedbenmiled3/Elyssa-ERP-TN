import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockListener } from '../../../modules/stocks/stockListener';
import { EventBus } from '../../../infrastructure/EventBus';

describe('StockListener', () => {
  let eventBus: EventBus;
  let stockListener: StockListener;
  
  beforeEach(() => {
    // Reset EventBus singleton for clean state
    // @ts-ignore
    EventBus.instance = undefined;
    eventBus = EventBus.getInstance();
    stockListener = new StockListener();
    
    // Mock the private methods to track calls
    vi.spyOn(stockListener as any, 'incrementProductStockAndCMUP').mockResolvedValue(undefined);
    vi.spyOn(stockListener as any, 'decrementProductStock').mockResolvedValue(undefined);
  });

  it('devrait intercepter IMPORT_DOSSIER_CLOSED et incrémenter le stock si le module est actif', async () => {
    const isModuleEnabledCallback = vi.fn().mockReturnValue(true);
    stockListener.init(isModuleEnabledCallback);
    
    const payload = {
      dossierId: 'DOS-123',
      items: [
        { productId: 'P1', qty: 100, landedCostUnitPrice: 15.5 },
        { productId: 'P2', qty: 50, landedCostUnitPrice: 10.1234 }
      ]
    };

    await eventBus.publish({
      eventId: 'evt-1',
      eventType: 'IMPORT_DOSSIER_CLOSED',
      companyId: 'comp-1',
      timestamp: new Date().toISOString(),
      payload
    });
    
    // Pause pour laisser l'event loop consommer l'événement asynchrone
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(isModuleEnabledCallback).toHaveBeenCalledWith('comp-1');
    expect((stockListener as any).incrementProductStockAndCMUP).toHaveBeenCalledTimes(2);
    expect((stockListener as any).incrementProductStockAndCMUP).toHaveBeenCalledWith('comp-1', 'P1', 100, 15.5);
    expect((stockListener as any).incrementProductStockAndCMUP).toHaveBeenCalledWith('comp-1', 'P2', 50, 10.1234);
  });

  it('devrait ignorer IMPORT_DOSSIER_CLOSED si le module n\'est pas actif', async () => {
    const isModuleEnabledCallback = vi.fn().mockReturnValue(false);
    stockListener.init(isModuleEnabledCallback);
    
    const payload = {
      dossierId: 'DOS-124',
      items: [
        { productId: 'P1', qty: 100, landedCostUnitPrice: 15.5 }
      ]
    };

    await eventBus.publish({
      eventId: 'evt-2',
      eventType: 'IMPORT_DOSSIER_CLOSED',
      companyId: 'comp-2',
      timestamp: new Date().toISOString(),
      payload
    });
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(isModuleEnabledCallback).toHaveBeenCalledWith('comp-2');
    expect((stockListener as any).incrementProductStockAndCMUP).not.toHaveBeenCalled();
  });

  it('devrait gérer un dossier sans articles (cas limite)', async () => {
    const isModuleEnabledCallback = vi.fn().mockReturnValue(true);
    stockListener.init(isModuleEnabledCallback);
    
    const payload = {
      dossierId: 'DOS-EMPTY',
      items: []
    };

    await eventBus.publish({
      eventId: 'evt-3',
      eventType: 'IMPORT_DOSSIER_CLOSED',
      companyId: 'comp-1',
      timestamp: new Date().toISOString(),
      payload
    });
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect((stockListener as any).incrementProductStockAndCMUP).not.toHaveBeenCalled();
  });
});
