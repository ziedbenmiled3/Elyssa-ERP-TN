import { InvoiceListener } from '../modules/billing/invoiceListener';
import { ComptaListener } from '../modules/accounting/comptaListener';
import { StockListener } from '../modules/stocks/stockListener';
import { PayrollListener } from '../modules/hr/payrollListener';
import { TreasuryService } from '../modules/finance/treasuryService';
import { CrmListener } from '../modules/crm/crmListener';

/**
 * Resend API configuration pulled securely from environment variables.
 * Never hardcode secrets in source files.
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

/**
 * Registry of active SaaS module subscriptions for simulated enterprise validation.
 * In a production multi-tenant database, this mapping is queried in real-time or cached.
 */
export const mockEnterpriseSubscriptions: Record<string, string[]> = {
  'company-trial-tunis': [
    'CAISSE_POS', 
    'STOCKS_FOURNISSEURS', 
    'FACTURATION_RECOUVREMENT',
    'GESTION_PAIE_RH'
  ],
  'company-full-sfax': [
    'CAISSE_POS', 
    'STOCKS_FOURNISSEURS', 
    'FACTURATION_RECOUVREMENT', 
    'COMPTABILITE_TRESORERIE',
    'GESTION_PAIE_RH',
    'IMPORT_EXPORT_LOGISTIQUE',
    'CRM_RELATION_CLIENT'
  ],
  'company-minimal-kef': [
    'CAISSE_POS'
  ]
};

/**
 * Bootstrap and wire up all decoupled asynchronous domain event listeners at server launch.
 * This establishes the fully decoupled, zero-dependency, event-driven pipelines.
 */
export function bootstrapListeners(): void {
  console.log('[BOOTSTRAP] Wiring Elyssa ERP async local Event listeners...');

  // 1. Instantiate Core Modules listeners
  const stockListener = new StockListener();
  const invoiceListener = new InvoiceListener();
  const comptaListener = new ComptaListener();
  const payrollListener = new PayrollListener();
  const treasuryService = new TreasuryService();
  const crmListener = new CrmListener();

  // Helper check function to fetch module active state dynamically
  const isModuleActive = (companyId: string, requiredModule: string): boolean => {
    // Falls back to true if no context exists or defaults to mock list
    const subscriptions = mockEnterpriseSubscriptions[companyId] || [];
    const active = subscriptions.includes(requiredModule);
    console.log(`[BOOTSTRAP VERIFIER] Checking license - Company: "${companyId}", Module: "${requiredModule}" -> Active: ${active}`);
    return active;
  };

  // 2. Initialize Stock Listener with its specific subscription check: STOCKS_FOURNISSEURS
  stockListener.init((companyId: string) => {
    return isModuleActive(companyId, 'STOCKS_FOURNISSEURS');
  });

  // 3. Initialize Invoice/Billing Listener with subscription check: FACTURATION_RECOUVREMENT
  invoiceListener.init((companyId: string) => {
    return isModuleActive(companyId, 'FACTURATION_RECOUVREMENT');
  });

  // 4. Initialize Accounting/NCT Listener with subscription check: COMPTABILITE_TRESORERIE
  comptaListener.init((companyId: string) => {
    return isModuleActive(companyId, 'COMPTABILITE_TRESORERIE');
  });

  // 5. Initialize Payroll/HR Listener with subscription check: GESTION_PAIE_RH
  payrollListener.init((companyId: string) => {
    return isModuleActive(companyId, 'GESTION_PAIE_RH');
  });

  // 6. Initialize Treasury predictive listeners with subscription check: COMPTABILITE_TRESORERIE
  treasuryService.init((companyId: string) => {
    return isModuleActive(companyId, 'COMPTABILITE_TRESORERIE');
  });

  // 7. Initialize CRM Listener with subscription check
  crmListener.init((companyId: string) => {
    return isModuleActive(companyId, 'CRM_RELATION_CLIENT'); // or whatever module name fits, like FACTURATION_RECOUVREMENT or a specific CRM module
  });

  console.log('[BOOTSTRAP] All async domain Event loops and listeners bound successfully.');
}
