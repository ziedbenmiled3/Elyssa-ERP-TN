import { appStorage } from './storageAdapter';
import { injectDemoData, purgeDemoData } from './demoRegistry';
import { computeInvoiceTaxes } from './taxCalculations';
import { purgeTenantData as purgeAllDemoData } from './demoDataService';
import { AUTHORIZED_COMPANIES, CompanyTenant } from '../types';

export { AUTHORIZED_COMPANIES, type CompanyTenant };

export type SaasPackType = 'FREE_TRIAL' | 'COMMERCE_POS' | 'LOGISTICS_WMS' | 'FULL_INDUSTRIAL' | 'CUSTOM';

export interface SaasPackConfig {
  id: SaasPackType;
  name: string;
  priceTND: number;
  allowedModules: string[];
}

export const SAAS_PACKS: Record<SaasPackType, SaasPackConfig> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: 'Essai Découverte (14 Jours)',
    priceTND: 0,
    allowedModules: ['*'] // Accès complet aux 34 modules en simulation
  },
  COMMERCE_POS: {
    id: 'COMMERCE_POS',
    name: 'Pack Négoce & Point de Vente',
    priceTND: 120,
    allowedModules: ['dashboard', 'pos', 'sales', 'inventory', 'clients', 'treasury']
  },
  LOGISTICS_WMS: {
    id: 'LOGISTICS_WMS',
    name: 'Pack Logistique, Flotte & Dépôts',
    priceTND: 250,
    allowedModules: ['dashboard', 'inventory', 'warehouse', 'dispatch', 'fleet', 'purchases']
  },
  FULL_INDUSTRIAL: {
    id: 'FULL_INDUSTRIAL',
    name: 'Pack Intégral Industrie & ERP',
    priceTND: 490,
    allowedModules: ['*']
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Pack Sur-Mesure / À la Carte',
    priceTND: 0,
    allowedModules: []
  }
};

export function registerNewTrialTenant(tenantId: string, tenantName: string): void {
  // 1. Déclarer le tenant client en mode ESSAI
  const clientTenant = {
    id: tenantId,
    name: tenantName,
    activePack: 'FREE_TRIAL',
    allowedModules: ['*'],
    status: 'TRIAL',
    createdAt: new Date().toISOString()
  };
  appStorage.setItem(`elyssa_tenant_meta_${tenantId}`, JSON.stringify(clientTenant));

  // 2. Injecter le jeu de démo pour exploration immédiate
  injectDemoData(tenantId);
}

export function activateClientPack(
  clientTenantId: string,
  clientTenantName: string,
  packType: SaasPackType,
  customModules?: string[]
): void {
  const pack = SAAS_PACKS[packType];
  const activeModules = packType === 'CUSTOM' ? (customModules || []) : pack.allowedModules;

  // 1. PURGE RADICALE : Retrait automatique des données démo du client
  purgeAllDemoData(clientTenantId);

  // 2. VERROUILLAGE DES MODULES & STATUT PRODUCTION
  const updatedTenant = {
    id: clientTenantId,
    name: clientTenantName,
    activePack: packType,
    allowedModules: activeModules,
    status: 'ACTIVE_PAID',
    activatedAt: new Date().toISOString()
  };
  appStorage.setItem(`elyssa_tenant_meta_${clientTenantId}`, JSON.stringify(updatedTenant));

  // 3. COMPTABILISATION AUTOMATIQUE CHEZ INTER-AFFAIRES (PARENT)
  if (pack.priceTND > 0) {
    const parentInvoicesRaw = appStorage.getItem('carthage_invoices');
    const parentInvoices = parentInvoicesRaw ? JSON.parse(parentInvoicesRaw) : [];

    const taxCalc = computeInvoiceTaxes({
      amountHT: pack.priceTND,
      vatRate: 19,
      applyTimbre: true,
      applyWithholding: false
    });

    const saasInvoice = {
      id: `INV-SAAS-${Date.now()}`,
      companyId: 'company_parent',
      clientName: clientTenantName,
      clientTenantId: clientTenantId,
      invoiceNumber: `LIC-${new Date().getFullYear()}-${String(parentInvoices.length + 1).padStart(4, '0')}`,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      description: `Abonnement Licence SaaS - ${pack.name}`,
      accountCode: '706', // Prestations de services
      amountHT: taxCalc.amountHT,
      vatRate: taxCalc.vatRate,
      vatAmount: taxCalc.vatAmount,
      timbreFiscal: taxCalc.timbreFiscal,
      amountTTC: taxCalc.amountTTC,
      withholdingAmount: taxCalc.withholdingAmount,
      amountNetToPay: taxCalc.amountNetToPay,
      status: 'Paid',
      isDemo: false
    };

    appStorage.setItem('carthage_invoices', JSON.stringify([saasInvoice, ...parentInvoices]));
  }

  // 4. Notification de rechargement réactif de l'UI
  window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId: clientTenantId } }));
}

export function getTenantMeta(tenantId: string) {
  const raw = appStorage.getItem(`elyssa_tenant_meta_${tenantId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
