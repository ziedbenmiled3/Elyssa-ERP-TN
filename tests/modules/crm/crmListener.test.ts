import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmListener } from '../../../modules/crm/crmListener';
import { EventBus } from '../../../infrastructure/EventBus';

describe('CrmListener', () => {
  let eventBus: EventBus;
  let crmListener: CrmListener;
  
  beforeEach(() => {
    // Réinitialise le singleton pour chaque test
    // @ts-ignore
    EventBus.instance = undefined;
    eventBus = EventBus.getInstance();
    crmListener = new CrmListener();
    
    // Mocker la méthode de BDD pour tester les appels
    vi.spyOn(crmListener as any, 'updateClientCrmStats').mockResolvedValue(undefined);
  });

  it('devrait actualiser les stats CRM à la réception de INVOICE_PUBLISHED', async () => {
    const isModuleEnabledCallback = vi.fn().mockReturnValue(true);
    crmListener.init(isModuleEnabledCallback);
    
    const payload = {
      invoiceId: 'INV-001',
      customerMatriculeFiscal: '12345',
      amountHT: 1500,
      amountTTC: 1785,
      netAPayer: 1785,
      fodecAmount: 0,
      tvaDetails: [],
      timbreFiscal: 1,
      retenueSourceApplied: false,
      retenueSourceAmount: 0
    };

    await eventBus.publish({
      eventId: 'evt-crm-1',
      eventType: 'INVOICE_PUBLISHED',
      companyId: 'comp-1',
      timestamp: new Date().toISOString(),
      payload
    });
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(isModuleEnabledCallback).toHaveBeenCalledWith('comp-1');
    expect((crmListener as any).updateClientCrmStats).toHaveBeenCalledTimes(1);
    expect((crmListener as any).updateClientCrmStats).toHaveBeenCalledWith('comp-1', payload);
  });

  it('ne devrait pas actualiser les stats CRM si le module n\'est pas actif (Multi-tenant)', async () => {
    const isModuleEnabledCallback = vi.fn().mockReturnValue(false); // Inactif
    crmListener.init(isModuleEnabledCallback);
    
    const payload = {
      invoiceId: 'INV-002',
      customerMatriculeFiscal: '12345',
      amountHT: 2500,
      amountTTC: 2975,
      netAPayer: 2975,
      fodecAmount: 0,
      tvaDetails: [],
      timbreFiscal: 1,
      retenueSourceApplied: false,
      retenueSourceAmount: 0
    };

    await eventBus.publish({
      eventId: 'evt-crm-2',
      eventType: 'INVOICE_PUBLISHED',
      companyId: 'comp-inactive',
      timestamp: new Date().toISOString(),
      payload
    });
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(isModuleEnabledCallback).toHaveBeenCalledWith('comp-inactive');
    expect((crmListener as any).updateClientCrmStats).not.toHaveBeenCalled();
  });
});
