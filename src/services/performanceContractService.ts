import { db } from '../utils/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { PerformanceContract, KPIItem, Payslip, Invoice, DeliveryTour, TripartiteWeightingConfig, TripartiteBreakdown } from '../types';

export const DEFAULT_TRIPARTITE_CONFIG: TripartiteWeightingConfig = {
  weight_entreprise: 70,
  weight_direction: 20,
  weight_personnel: 10,
  company_achievement_rate: 90
};

export interface MPOManager {
  id: string;
  name: string;
  role: string;
  department: string;
  pin_code: string;
  is_super_admin?: boolean;
}

export const DEMO_MPO_MANAGERS: MPOManager[] = [
  {
    id: 'MGR-SUPERADMIN',
    name: 'MED ZIED BEN MILED',
    role: 'Directeur Général / Super Admin',
    department: 'Direction Générale',
    pin_code: '123456',
    is_super_admin: true
  }
];

export const DEFAULT_DEMO_PERFORMANCE_CONTRACTS: PerformanceContract[] = [];

/**
 * Computes Tripartite breakdown details
 */
export function computeTripartiteBreakdown(
  primeTarget: number,
  individualRate: number,
  department: string,
  config?: TripartiteWeightingConfig,
  customCompanyRate?: number,
  customDeptRate?: number
): {
  tripartite_config: TripartiteWeightingConfig;
  tripartite_breakdown: TripartiteBreakdown;
  calculated_prime_tnd: number;
  overall_achievement_rate: number;
} {
  const wEnt = config?.weight_entreprise ?? 70;
  const wDir = config?.weight_direction ?? 20;
  const wInd = config?.weight_personnel ?? 10;

  const rateEnt = customCompanyRate ?? config?.company_achievement_rate ?? 90;

  let rateDir = customDeptRate;
  if (rateDir === undefined) {
    const deptLower = (department || '').toLowerCase();
    if (deptLower.includes('ventes') || deptLower.includes('commer')) rateDir = 93.6;
    else if (deptLower.includes('logis') || deptLower.includes('exped')) rateDir = 91.0;
    else if (deptLower.includes('magasin') || deptLower.includes('pos') || deptLower.includes('caisse')) rateDir = 92.0;
    else rateDir = 90.0;
  }

  const rateInd = Math.round(individualRate * 100) / 100;

  const primeEnt = Math.round((primeTarget * (wEnt / 100) * (rateEnt / 100)) * 100) / 100;
  const primeDir = Math.round((primeTarget * (wDir / 100) * (rateDir / 100)) * 100) / 100;
  const primeInd = Math.round((primeTarget * (wInd / 100) * (rateInd / 100)) * 100) / 100;

  const totalPrime = Math.round((primeEnt + primeDir + primeInd) * 100) / 100;

  const overallRate = Math.round(
    ((wEnt / 100) * rateEnt + (wDir / 100) * rateDir + (wInd / 100) * rateInd) * 100
  ) / 100;

  const formulaStr = `(${primeTarget} TND × ${wEnt}% × ${rateEnt}%) + (${primeTarget} TND × ${wDir}% × ${rateDir}%) + (${primeTarget} TND × ${wInd}% × ${rateInd}%) = ${totalPrime.toFixed(2)} TND`;

  const tripartite_config: TripartiteWeightingConfig = {
    weight_entreprise: wEnt,
    weight_direction: wDir,
    weight_personnel: wInd,
    company_achievement_rate: rateEnt
  };

  const tripartite_breakdown: TripartiteBreakdown = {
    weight_entreprise: wEnt,
    rate_entreprise: rateEnt,
    prime_entreprise: primeEnt,

    weight_direction: wDir,
    rate_direction: rateDir,
    prime_direction: primeDir,

    weight_personnel: wInd,
    rate_personnel: rateInd,
    prime_personnel: primeInd,

    formula_string: formulaStr
  };

  return {
    tripartite_config,
    tripartite_breakdown,
    calculated_prime_tnd: totalPrime,
    overall_achievement_rate: overallRate
  };
}

/**
 * Re-computes KPI rates, weighted total achievement rate, and calculated prime for a contract
 */
export function recalculateContractMetrics(
  contract: PerformanceContract,
  invoices: Invoice[] = [],
  deliveryTours: DeliveryTour[] = [],
  globalTripartiteConfig?: TripartiteWeightingConfig
): PerformanceContract {
  const updatedKpis = contract.kpis.map(kpi => {
    let currentVal = kpi.current_value;

    if (kpi.data_source === 'auto_pos_sales') {
      const empInvoices = invoices.filter(inv => {
        const isEmployee = 
          inv.commercial_id === contract.employee_id ||
          inv.seller_id === contract.employee_id ||
          (inv.commercial_name && inv.commercial_name.toLowerCase().includes(contract.employee_name.toLowerCase())) ||
          (inv.seller_name && inv.seller_name.toLowerCase().includes(contract.employee_name.toLowerCase()));
        return isEmployee;
      });

      if (empInvoices.length > 0) {
        const totalSales = empInvoices.reduce((sum, inv) => sum + (inv.amountTTC || inv.amountHT || 0), 0);
        currentVal = Math.round(totalSales * 100) / 100;
      }
    } else if (kpi.data_source === 'auto_deliveries') {
      let deliveredCount = 0;
      deliveryTours.forEach(tour => {
        if (
          tour.driver_id === contract.employee_id ||
          (tour.driver_name && tour.driver_name.toLowerCase().includes(contract.employee_name.toLowerCase()))
        ) {
          if (tour.orders) {
            tour.orders.forEach(ord => {
              if (ord.delivery_status === 'livre') deliveredCount += 1;
            });
          }
        }
      });

      if (deliveredCount > 0) {
        currentVal = deliveredCount;
      }
    }

    return {
      ...kpi,
      current_value: currentVal
    };
  });

  // Calculate individual KPI weighted achievement rate (%)
  let totalWeightedScore = 0;
  let totalWeight = 0;

  updatedKpis.forEach(kpi => {
    const target = kpi.target_value > 0 ? kpi.target_value : 1;
    const rateRatio = kpi.current_value / target;
    const kpiRatePercent = Math.min(rateRatio * 100, 150);
    totalWeightedScore += (kpiRatePercent * (kpi.weight_percent / 100));
    totalWeight += kpi.weight_percent;
  });

  const individualRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 0;

  // Tripartite Calculation
  const activeConfig = contract.tripartite_config || globalTripartiteConfig || DEFAULT_TRIPARTITE_CONFIG;
  const tripartiteRes = computeTripartiteBreakdown(
    contract.prime_target_tnd,
    individualRate,
    contract.department,
    activeConfig
  );

  return {
    ...contract,
    kpis: updatedKpis,
    achievement_rate: tripartiteRes.overall_achievement_rate,
    calculated_prime_tnd: tripartiteRes.calculated_prime_tnd,
    tripartite_config: tripartiteRes.tripartite_config,
    tripartite_breakdown: tripartiteRes.tripartite_breakdown,
    updated_at: new Date().toISOString()
  };
}

/**
 * Saves or updates a performance contract in Firestore & localStorage
 */
export async function savePerformanceContract(
  tenantId: string,
  contract: PerformanceContract
): Promise<void> {
  try {
    if (db) {
      const docRef = doc(db, 'company_erp_data', tenantId, 'performance_contracts', contract.id);
      await setDoc(docRef, contract, { merge: true });
    }
  } catch (err) {
    console.error('Error saving performance contract to Firestore:', err);
  }
}

/**
 * Deletes a performance contract from Firestore
 */
export async function deletePerformanceContract(
  tenantId: string,
  contractId: string
): Promise<void> {
  try {
    if (db) {
      const docRef = doc(db, 'company_erp_data', tenantId, 'performance_contracts', contractId);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.error('Error deleting performance contract from Firestore:', err);
  }
}

/**
 * Transmits / injects calculated prime into employee payslip in payroll
 */
export function injectPrimeIntoPayroll(
  contract: PerformanceContract,
  existingPayslips: Payslip[]
): Payslip[] {
  const monthKey = contract.year && contract.month 
    ? `${contract.year}-${String(contract.month).padStart(2, '0')}`
    : '2026-08';

  const primeAmount = contract.calculated_prime_tnd;
  const note = `Prime MPO/OKR (${contract.achievement_rate}% d'atteinte - ${contract.month_name || monthKey})`;

  let updated = false;
  const updatedPayslips = existingPayslips.map(ps => {
    if (ps.employeeId === contract.employee_id && ps.month === monthKey) {
      updated = true;
      const newGross = ps.baseSalary + (ps.allowancesPaid || 0) + primeAmount;
      const newNet = ps.netSalary + primeAmount;
      return {
        ...ps,
        performancePrime: primeAmount,
        performancePrimeNote: note,
        grossSalary: newGross,
        netSalary: newNet
      };
    }
    return ps;
  });

  // If no payslip existed for this employee and month, create a draft payslip
  if (!updated) {
    const baseSal = 1500;
    const newPayslip: Payslip = {
      id: `ps-${contract.employee_id}-${monthKey}-${Date.now()}`,
      employeeId: contract.employee_id,
      employeeName: contract.employee_name,
      month: monthKey,
      baseSalary: baseSal,
      grossSalary: baseSal + primeAmount,
      cnssEmployee: Math.round(baseSal * 0.0918 * 100) / 100,
      cnssEmployer: Math.round(baseSal * 0.1707 * 100) / 100,
      professionalExpenses: Math.round(baseSal * 0.1 * 100) / 100,
      familyDeduction: 100,
      taxableIncome: Math.round(baseSal * 0.85 * 100) / 100,
      irpp: Math.round(baseSal * 0.08 * 100) / 100,
      css: 15,
      netSalary: Math.round((baseSal - (baseSal * 0.0918) - (baseSal * 0.08) + primeAmount) * 100) / 100,
      allowancesPaid: 0,
      performancePrime: primeAmount,
      performancePrimeNote: note,
      status: 'Draft',
      paymentMethod: 'Virement'
    };
    return [newPayslip, ...existingPayslips];
  }

  return updatedPayslips;
}
