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
    name: 'Direction Générale',
    role: 'Directeur Général / Super Admin',
    department: 'Direction Générale',
    pin_code: '123456',
    is_super_admin: true
  }
];

export const DEFAULT_DEMO_PERFORMANCE_CONTRACTS: PerformanceContract[] = generateTenantDemoPerformanceContracts('MD');

/**
 * Returns dynamic MPO managers based on the active user session and tenant employees
 */
export function getTenantMpoManagers(
  tenantId?: string,
  currentUser?: { email?: string; name?: string; role?: string; department?: string; structure?: string } | null,
  employees: any[] = []
): MPOManager[] {
  const isMD = tenantId === 'MD' || tenantId?.toLowerCase().includes('md');
  const defaultAdminName = isMD ? 'Meriam Doudou' : (tenantId === 'Inter-Affaires' ? 'MED ZIED BEN MILED' : 'Direction Générale');
  
  const currentMgrName = currentUser?.name || defaultAdminName;
  const currentMgrRole = currentUser?.role === 'SuperAdmin' 
    ? 'Directeur Général / Super Admin' 
    : (currentUser?.role || (isMD ? 'Directeur Général / Gérante' : 'Directeur Général'));
  const currentMgrDept = currentUser?.department || currentUser?.structure || 'Direction Générale';
  const isSuper = !currentUser || currentUser.role === 'SuperAdmin' || currentUser.role === 'Dirigeant' || currentUser.role === 'DG' || currentUser.role === 'Admin' || currentUser.role === 'Directeur';

  const list: MPOManager[] = [
    {
      id: 'MGR-ACTIVE-USER',
      name: currentMgrName,
      role: currentMgrRole,
      department: currentMgrDept,
      pin_code: '123456',
      is_super_admin: isSuper
    }
  ];

  if (Array.isArray(employees) && employees.length > 0) {
    employees.forEach(emp => {
      const job = (emp.jobTitle || '').toLowerCase();
      const dept = emp.department || '';
      if (
        job.includes('directeur') || 
        job.includes('responsable') || 
        job.includes('chef') || 
        job.includes('lead') || 
        job.includes('manager')
      ) {
        let pin = '123456';
        if (dept.includes('Finan') || job.includes('financ')) pin = '222333';
        else if (dept.includes('RH') || dept.includes('Ressour') || job.includes('rh')) pin = '555111';
        else if (dept.includes('Vente') || dept.includes('Commer') || job.includes('commer')) pin = '333333';
        else if (dept.includes('Logist') || job.includes('livreur') || job.includes('logist')) pin = '444444';
        else if (dept.includes('Achat') || dept.includes('Prod')) pin = '666111';

        list.push({
          id: `MGR-EMP-${emp.id}`,
          name: emp.name,
          role: emp.jobTitle || 'Responsable de Pôle',
          department: dept || 'Pôle Opérationnel',
          pin_code: pin,
          is_super_admin: false
        });
      }
    });
  }

  // Fallback defaults if no departmental managers found
  if (list.length === 1) {
    list.push(
      { id: 'MGR-FIN', name: 'Ines Dridi', role: 'Responsable Pôle Finance', department: 'Finance', pin_code: '222333' },
      { id: 'MGR-RH', name: 'Amel Ben Soltane', role: 'Responsable Pôle RH', department: 'RH', pin_code: '555111' },
      { id: 'MGR-COM', name: 'Mohamed Ali Gharbi', role: 'Responsable Pôle Commercial', department: 'Ventes', pin_code: '333333' },
      { id: 'MGR-LOG', name: 'Hamza Ben Salem', role: 'Responsable Pôle Logistique', department: 'Logistique', pin_code: '444444' }
    );
  }

  return list;
}

/**
 * Dynamically generates realistic MPO/OKR demo contracts assigned directly to tenant collaborators
 */
export function generateTenantDemoPerformanceContracts(
  tenantId: string = 'MD',
  employees: any[] = [],
  _activeManagerName?: string
): PerformanceContract[] {
  // If no employees are provided, use standard 7 collaborators for the tenant
  const targetEmployees = (Array.isArray(employees) && employees.length > 0)
    ? employees
    : [
        { id: 'demo-emp_0', name: 'Meriam Doudou', jobTitle: 'Gérante / Direction Générale', department: 'Direction & IT', pole: 'Direction & IT' },
        { id: 'demo-emp_1', name: 'Khaled Ben Amor', jobTitle: 'Directeur Financier & Recouvrement', department: 'Finance', pole: 'Finance' },
        { id: 'demo-emp_2', name: 'Ines Dridi', jobTitle: 'Responsable Rapprochement', department: 'Finance', pole: 'Finance' },
        { id: 'demo-emp_3', name: 'Mohamed Ali Gharbi', jobTitle: 'Chargé Clientèle / Ventes', department: 'Ventes', pole: 'Ventes' },
        { id: 'demo-emp_4', name: 'Amel Ben Soltane', jobTitle: 'Responsable Ressources Humaines', department: 'RH', pole: 'RH' },
        { id: 'demo-emp_5', name: 'Sami Mansour', jobTitle: 'Développeur ERP Principal', department: 'Direction & IT', pole: 'Direction & IT' },
        { id: 'demo-emp_6', name: 'Hamza Ben Salem', jobTitle: 'Chauffeur Livreur / Logistique', department: 'Logistique', pole: 'Logistique' }
      ];

  const contracts: PerformanceContract[] = [];

  targetEmployees.forEach((emp, index) => {
    const nameLower = (emp.name || '').toLowerCase();
    const deptLower = (emp.department || '').toLowerCase();
    const jobLower = (emp.jobTitle || '').toLowerCase();

    let primeTarget = 450;
    let kpis: KPIItem[] = [];
    let status: 'brouillon' | 'en_attente_signature' | 'valide_signe' = 'valide_signe';
    let signedAt: string | undefined = new Date(Date.now() - (index + 1) * 86400000 * 3).toISOString();

    let assignedPole = 'Direction & IT';
    let assignedDept = 'Direction & IT';

    if (nameLower.includes('meriam') || nameLower.includes('doudou') || jobLower.includes('gérante') || jobLower.includes('direction générale')) {
      assignedPole = 'Direction & IT';
      assignedDept = 'Direction Générale';
      primeTarget = 650;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Croissance Chiffre d’Affaires & Marge Nette Global (%)',
          weight_percent: 60,
          target_value: 20,
          current_value: 19.2,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Taux de Rétention & Satisfaction Grands Comptes',
          weight_percent: 40,
          target_value: 98,
          current_value: 98.5,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (nameLower.includes('khaled') || nameLower.includes('amor') || jobLower.includes('directeur financier') || (deptLower.includes('finan') && jobLower.includes('directeur'))) {
      assignedPole = 'Finance';
      assignedDept = 'Finance';
      primeTarget = 500;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Taux de Recouvrement Factures Échues (%)',
          weight_percent: 60,
          target_value: 95,
          current_value: 94,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Rapprochement Bancaire & Justification Soldes',
          weight_percent: 40,
          target_value: 100,
          current_value: 98,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (nameLower.includes('ines') || nameLower.includes('dridi') || jobLower.includes('rapprochement') || (deptLower.includes('finan') && !jobLower.includes('directeur'))) {
      assignedPole = 'Finance';
      assignedDept = 'Finance';
      primeTarget = 350;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Pointage & Lettrage Factures Fournisseurs',
          weight_percent: 60,
          target_value: 100,
          current_value: 98,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Zéro Écart Journalier de Caisse',
          weight_percent: 40,
          target_value: 30,
          current_value: 29,
          unit: 'Jours',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (nameLower.includes('amel') || nameLower.includes('soltane') || deptLower.includes('rh') || deptLower.includes('ressour') || jobLower.includes('rh')) {
      assignedPole = 'RH';
      assignedDept = 'RH';
      primeTarget = 400;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Clôture Paie & Déclarations CNSS dans les Délais',
          weight_percent: 60,
          target_value: 3,
          current_value: 2,
          unit: 'Jours',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Conformité Contrats & Registre RH',
          weight_percent: 40,
          target_value: 100,
          current_value: 99,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (nameLower.includes('gharbi') || nameLower.includes('cherif') || nameLower.includes('mohamed') || deptLower.includes('vente') || deptLower.includes('commer') || jobLower.includes('commer')) {
      assignedPole = 'Ventes';
      assignedDept = 'Ventes';
      primeTarget = 450;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: "Chiffre d'Affaires Ventes Facturées (TND)",
          weight_percent: 70,
          target_value: 25000,
          current_value: 24850,
          unit: 'TND',
          data_source: 'auto_pos_sales'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Prospection Nouveaux Clients Terrain',
          weight_percent: 30,
          target_value: 10,
          current_value: 9,
          unit: 'Clients',
          data_source: 'manual_manager'
        }
      ];
      status = index % 2 === 0 ? 'en_attente_signature' : 'valide_signe';
      if (status === 'en_attente_signature') signedAt = undefined;
    } else if (nameLower.includes('mansour') || nameLower.includes('sami') || deptLower.includes('tech') || deptLower.includes('it') || jobLower.includes('dév') || jobLower.includes('dev')) {
      assignedPole = 'Direction & IT';
      assignedDept = 'Direction & IT';
      primeTarget = 500;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Disponibilité & Stabilité Infrastructure ERP',
          weight_percent: 60,
          target_value: 99.5,
          current_value: 99.9,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Déploiement & Automatisation Modules MPO',
          weight_percent: 40,
          target_value: 5,
          current_value: 5,
          unit: 'Modules',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (nameLower.includes('salem') || nameLower.includes('hamza') || nameLower.includes('trad') || deptLower.includes('logis') || deptLower.includes('exped') || jobLower.includes('livr') || jobLower.includes('chauff')) {
      assignedPole = 'Logistique';
      assignedDept = 'Logistique';
      primeTarget = 300;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Livraisons Réussies sans Réclamation',
          weight_percent: 80,
          target_value: 30,
          current_value: 28,
          unit: 'Livraisons',
          data_source: 'auto_deliveries'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Ponctualité & Entretien Véhicule',
          weight_percent: 20,
          target_value: 100,
          current_value: 96,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else if (deptLower.includes('achat') || deptLower.includes('prod') || jobLower.includes('achat')) {
      assignedPole = 'Achats';
      assignedDept = 'Achats';
      primeTarget = 450;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Optimisation Coûts Achats & RFA (%)',
          weight_percent: 60,
          target_value: 8,
          current_value: 8.2,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Conformité Délais Commandes Fournisseurs',
          weight_percent: 40,
          target_value: 98,
          current_value: 97,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    } else {
      assignedPole = emp.pole || emp.department || 'Direction & IT';
      assignedDept = emp.department || assignedPole;
      primeTarget = 350;
      kpis = [
        {
          id: `kpi-${emp.id}-1`,
          title: 'Objectif Opérationnel de Service',
          weight_percent: 60,
          target_value: 100,
          current_value: 96,
          unit: '%',
          data_source: 'manual_manager'
        },
        {
          id: `kpi-${emp.id}-2`,
          title: 'Qualité d’Exécution & Rigueur Procédures',
          weight_percent: 40,
          target_value: 100,
          current_value: 98,
          unit: '%',
          data_source: 'manual_manager'
        }
      ];
      status = 'valide_signe';
    }

    // Compute individual rate
    let totalWeightedScore = 0;
    let totalWeight = 0;
    kpis.forEach(k => {
      const target = k.target_value > 0 ? k.target_value : 1;
      const rate = k.current_value / target;
      const kpiRatePercent = Math.min(rate * 100, 150);
      totalWeightedScore += (kpiRatePercent * (k.weight_percent / 100));
      totalWeight += k.weight_percent;
    });
    const individualRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 0;

    const tripartite = computeTripartiteBreakdown(
      primeTarget,
      individualRate,
      assignedDept,
      DEFAULT_TRIPARTITE_CONFIG
    );

    const contractObj: PerformanceContract = {
      id: `perf-${emp.id}-2026-08`,
      tenantId,
      employee_id: emp.id,
      employee_name: emp.name,
      department: assignedDept,
      pole: assignedPole,
      role: emp.jobTitle || 'Collaborateur',
      period: 'mensuel',
      year: 2026,
      month: 8,
      month_name: 'Août 2026',
      kpis,
      prime_target_tnd: primeTarget,
      calculated_prime_tnd: tripartite.calculated_prime_tnd,
      achievement_rate: tripartite.overall_achievement_rate,
      tripartite_config: tripartite.tripartite_config,
      tripartite_breakdown: tripartite.tripartite_breakdown,
      status,
      ...(signedAt ? { signed_at: signedAt } : {}),
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
      is_demo_data: true
    };

    contracts.push(contractObj);
  });

  return contracts;
}

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
    if (deptLower.includes('vent') || deptLower.includes('commer')) rateDir = 93.6;
    else if (deptLower.includes('finan') || deptLower.includes('compta')) rateDir = 95.0;
    else if (deptLower.includes('rh') || deptLower.includes('ressour')) rateDir = 98.0;
    else if (deptLower.includes('it') || deptLower.includes('direct') || deptLower.includes('tech')) rateDir = 99.0;
    else if (deptLower.includes('logis') || deptLower.includes('exped')) rateDir = 91.0;
    else if (deptLower.includes('achat') || deptLower.includes('appro')) rateDir = 90.0;
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
 * Recursively strips undefined keys for Firestore compatibility
 */
function cleanUndefinedForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        res[key] = cleanUndefinedForFirestore(val);
      }
    }
    return res as unknown as T;
  }
  return obj;
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
      const cleanData = cleanUndefinedForFirestore(contract);
      await setDoc(docRef, cleanData, { merge: true });
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
