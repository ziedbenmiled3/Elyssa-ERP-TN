import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { InvoiceTunisiaPayload } from '../../infrastructure/EventTypes';

export interface CommercialEffect {
  id: string;
  type: 'cheque' | 'traite';
  number: string;
  issuer: string;
  bank: string; // e.g. BIAT, UIB
  amount: number;
  dueDate: string; // ISO date string
  status: 'pending' | 'cashed' | 'returned';
}

export interface CashFlowProjection {
  days30: number; // expected balance in 30 days
  days60: number; // expected balance in 60 days
  days90: number; // expected balance in 90 days
  auditedAgiosTnd: number; // estimated agios/interest deducted based on TMM
}

export class TreasuryService {
  private eventBus: EventBus;
  private currentTMM: number = 0.0800; // TMM currently set at 8.00% under BCT guidelines
  private plannedInflows: Array<{ amount: number; date: Date }> = [];
  private plannedOutflows: Array<{ amount: number; date: Date }> = [];
  private effectsInVault: CommercialEffect[] = [];

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initializes listeners to build cash projections from invoice receivables and payroll disbursements.
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    
    // 1. Listen to INVOICE_PUBLISHED to schedule incoming sales collections (Expected 30-day corporate delay)
    this.eventBus.subscribe<InvoiceTunisiaPayload>('INVOICE_PUBLISHED', async (event: AppEvent<InvoiceTunisiaPayload>) => {
      const { companyId, payload } = event;
      try {
        if (!await isModuleEnabledCallback(companyId)) return;

        // Schedule an inflow in 30 days
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 30);

        this.plannedInflows.push({
          amount: payload.netAPayer,
          date: scheduledDate
        });

        console.log(`[TreasuryService] Logged planned inflow of ${payload.netAPayer} TND for company "${companyId}" scheduled on ${scheduledDate.toDateString()}`);
      } catch (err) {
        console.error('[TreasuryService] Safe error tracking invoice inflow:', err);
      }
    });

    // 2. Listen to PAYROLL_GENERATED to schedule salary mass outflows (Expected immediate 5-day cycle)
    this.eventBus.subscribe<any>('PAYROLL_GENERATED', async (event: AppEvent<any>) => {
      const { companyId, payload } = event;
      try {
        if (!await isModuleEnabledCallback(companyId)) return;

        // Salary pay outs typically execute on month ends (within 5 days from generation)
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 5);

        this.plannedOutflows.push({
          amount: payload.totalEmployerCost,
          date: scheduledDate
        });

        console.log(`[TreasuryService] Logged planned payroll outflow of ${payload.totalEmployerCost} TND for company "${companyId}" scheduled on ${scheduledDate.toDateString()}`);
      } catch (err) {
        console.error('[TreasuryService] Safe error tracking payroll outflow:', err);
      }
    });
  }

  /**
   * Register a check or commercial draft ("Traite") in the vault.
   */
  public registerEffectInVault(effect: CommercialEffect): void {
    this.effectsInVault.push(effect);
    console.log(`[Treasury Vault] Registered ${effect.type} No ${effect.number} - Amount: ${effect.amount} TND, Due Date: ${effect.dueDate}`);
  }

  /**
   * Generates a 30/60/90 days predictive cash flow statement.
   * Runs an audit on banking conditions (calculates agios on drafts using BCT TMM + commercial bank margins e.g., 2%).
   */
  public simulateCashFlow(initialBalance: number): CashFlowProjection {
    const round3 = (val: number) => Math.round(val * 1000) / 1000;
    const now = new Date();

    let inflow30 = 0, inflow60 = 0, inflow90 = 0;
    let outflow30 = 0, outflow60 = 0, outflow90 = 0;
    let totalAgios = 0;

    const bankMargin = 0.02; // Standard Tunisian commercial bank margin (e.g. 2% above TMM)
    const effectiveDiscountRate = this.currentTMM + bankMargin; // Total agio rate = 10%

    // 1. Process planned inflows
    for (const flow of this.plannedInflows) {
      const diffDays = Math.ceil((flow.date.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) inflow30 += flow.amount;
      else if (diffDays <= 60) inflow60 += flow.amount;
      else if (diffDays <= 90) inflow90 += flow.amount;
    }

    // 2. Process planned outflows
    for (const flow of this.plannedOutflows) {
      const diffDays = Math.ceil((flow.date.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) outflow30 += flow.amount;
      else if (diffDays <= 60) outflow60 += flow.amount;
      else if (diffDays <= 90) outflow90 += flow.amount;
    }

    // 3. Process vault drafts and checks
    for (const effect of this.effectsInVault) {
      if (effect.status !== 'pending') continue;

      const dueDateObj = new Date(effect.dueDate);
      const diffDays = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let expectedValue = effect.amount;

      // Under the Tunisian Code of Commerce, drafts ("traites") discounted before maturity suffer agio reductions
      if (effect.type === 'traite' && diffDays > 0) {
        // Calculate commercial discount (agio): Amount * Rate * (Days / 360)
        const daysToMaturity = Math.max(diffDays, 10); // Standard bank minimum 10 days
        const agio = effect.amount * effectiveDiscountRate * (daysToMaturity / 360);
        totalAgios += agio;
        expectedValue -= agio;
      }

      if (diffDays <= 30) inflow30 += expectedValue;
      else if (diffDays <= 60) inflow60 += expectedValue;
      else if (diffDays <= 90) inflow90 += expectedValue;
    }

    const projected30 = initialBalance + inflow30 - outflow30;
    const projected60 = projected30 + inflow60 - outflow60;
    const projected90 = projected60 + inflow90 - outflow90;

    return {
      days30: round3(projected30),
      days60: round3(projected60),
      days90: round3(projected90),
      auditedAgiosTnd: round3(totalAgios)
    };
  }
}
