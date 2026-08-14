import { EventBus, AppEvent } from '../../infrastructure/EventBus';
import { PayrollService, PayrollInput } from './payrollService';

export interface TimeSheetMonthlyPayload {
  collaboratorId: string;
  collaboratorName: string;
  baseMonthlyGross: number;
  totalApprovedHours: number;
  standardHours: number; // e.g. 173 hours
  overtimeHours: number; // calculated hours to add as bonus
  isMarried: boolean;
  numberOfKids: number;
  kidsInUniversity: number;
}

export class PayrollListener {
  private eventBus: EventBus;
  private payrollService: PayrollService;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.payrollService = new PayrollService();
  }

  /**
   * Subscribes to attendance/timesheet validated events to compile the official payroll slip.
   */
  public init(isModuleEnabledCallback: (companyId: string) => boolean | Promise<boolean>): void {
    this.eventBus.subscribe<TimeSheetMonthlyPayload>('TIME_SHEET_MONTHLY_VALIDATED', async (event: AppEvent<TimeSheetMonthlyPayload>) => {
      const { companyId, payload, eventId } = event;

      try {
        const isEnabled = await isModuleEnabledCallback(companyId);
        if (!isEnabled) {
          console.log(`[PayrollListener] Skipping payroll for company "${companyId}": 'GESTION_PAIE_RH' module is inactive.`);
          return;
        }

        console.log(`[PayrollListener] Timesheet received for collaborator ${payload.collaboratorId} (Event: ${eventId}). Compiling pay slip...`);

        // Compute hourly rate and overtime bonus under Tunisian Labour Code rules:
        // Overtime is usually paid at standard rate + 75% or 100% depending on status. Let's apply a 1.75 multiplier.
        const hourlyRate = payload.baseMonthlyGross / payload.standardHours;
        const overtimeBonus = payload.overtimeHours * hourlyRate * 1.75;
        
        const calculatedGross = payload.baseMonthlyGross + overtimeBonus;

        const payrollInput: PayrollInput = {
          grossSalary: calculatedGross,
          isMarried: payload.isMarried,
          numberOfKids: payload.numberOfKids,
          kidsInUniversity: payload.kidsInUniversity
        };

        const calculatedSlip = this.payrollService.calculatePayroll(payrollInput);

        const payrollGeneratedPayload = {
          slipId: `SLIP-${Date.now()}-${payload.collaboratorId}`,
          collaboratorId: payload.collaboratorId,
          collaboratorName: payload.collaboratorName,
          baseGross: payload.baseMonthlyGross,
          overtimeBonus: Math.round(overtimeBonus * 1000) / 1000,
          ...calculatedSlip
        };

        const payrollEvent: AppEvent<typeof payrollGeneratedPayload> = {
          eventId: `EV-PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          eventType: 'PAYROLL_GENERATED',
          timestamp: new Date().toISOString(),
          companyId,
          payload: payrollGeneratedPayload
        };

        // Publish to bus so treasury planning can track salaries and accounting ledger can book entries
        this.eventBus.publish(payrollEvent);

      } catch (error) {
        console.error(`[PayrollListener] Failed safely to calculate pay slip for company "${companyId}":`, error);
      }
    });
  }
}
