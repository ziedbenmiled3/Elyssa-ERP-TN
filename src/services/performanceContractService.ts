import { db } from '../utils/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { PerformanceContract, KPIItem, Payslip, Invoice, DeliveryTour, TripartiteWeightingConfig, TripartiteBreakdown, Employee } from '../types';
import { getEmployeePole, getPoleInfo, matchPoleKey, DEMO_HR_EMPLOYEES } from './hrSyncService';

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

export const DEFAULT_DEMO_PERFORMANCE_CONTRACTS: PerformanceContract[] = generateTenantDemoPerformanceContracts('company_demo');

/**
 * Returns dynamic MPO managers based on the active user session and tenant employees
 */
export function getTenantMpoManagers(
  tenantId?: string,
  currentUser?: { email?: string; name?: string; role?: string; department?: string; structure?: string } | null,
  employees: any[] = []
): MPOManager[] {
  const isMD = tenantId === 'MD' || tenantId?.toLowerCase().includes('md') || tenantId === 'company_demo';
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
        else if (dept.includes('Prod') || dept.includes('GPAO') || dept.includes('Atelier') || job.includes('équipe')) pin = '666111';
        else if (dept.includes('Achat')) pin = '666111';

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
      { id: 'MGR-FIN', name: 'Ines Dridi', role: 'Responsable Pôle Finance', department: 'Finance & Compta', pin_code: '222333' },
      { id: 'MGR-RH', name: 'Amel Ben Soltane', role: 'Responsable Pôle RH', department: 'RH & Social', pin_code: '555111' },
      { id: 'MGR-COM', name: 'Mohamed Ali Gharbi', role: 'Responsable Pôle Commercial', department: 'Ventes & Commerce', pin_code: '333333' },
      { id: 'MGR-LOG', name: 'Hamza Ben Salem', role: 'Responsable Pôle Logistique', department: 'Logistique & Transport', pin_code: '444444' },
      { id: 'MGR-PROD', name: 'Jalel Ben Ali', role: 'Responsable Pôle Production', department: 'Production & Industrie', pin_code: '666111' }
    );
  }

  return list;
}

/**
 * Generate default KPIs tailored by pole and job role
 */
export function generateDefaultKPIsForEmp(emp: any, poleKey: string, dept: string, job: string): KPIItem[] {
  const nameLower = (emp.name || '').toLowerCase();
  const jobLower = (job || '').toLowerCase();
  const deptLower = (dept || '').toLowerCase();
  const id = emp.id || `emp_${Date.now()}`;

  if (poleKey === 'PRODUCTION_INDUSTRIE' || deptLower.includes('prod') || deptLower.includes('gpao') || deptLower.includes('atelier') || deptLower.includes('industrie')) {
    if (nameLower.includes('jalel') || nameLower.includes('extrusion') || jobLower.includes('extrusion')) {
      return [
        { id: `kpi-${id}-1`, title: 'Respect Planning GPAO & Ordres de Fabrication Extrusion (%)', weight_percent: 60, target_value: 100, current_value: 96, unit: '%', data_source: 'manual_manager' },
        { id: `kpi-${id}-2`, title: 'Réduction du Taux de Rebuts & Chutes Matières (%)', weight_percent: 40, target_value: 2.0, current_value: 1.8, unit: '%', data_source: 'manual_manager' }
      ];
    }
    if (nameLower.includes('mourad') || nameLower.includes('assemblage') || jobLower.includes('assemblage')) {
      return [
        { id: `kpi-${id}-1`, title: 'Rendement & Productivité Ligne d’Assemblage (%)', weight_percent: 60, target_value: 100, current_value: 97, unit: '%', data_source: 'manual_manager' },
        { id: `kpi-${id}-2`, title: 'Zéro Non-Conformité Qualité & Respect Normes Sécurité', weight_percent: 40, target_value: 100, current_value: 99, unit: '%', data_source: 'manual_manager' }
      ];
    }
    if (nameLower.includes('sofiene') || nameLower.includes('nuit') || jobLower.includes('nuit')) {
      return [
        { id: `kpi-${id}-1`, title: 'Continuité de Marche & Cadence Poste de Nuit (%)', weight_percent: 60, target_value: 100, current_value: 95, unit: '%', data_source: 'manual_manager' },
        { id: `kpi-${id}-2`, title: 'Sécurité Postes & Pointage Équipe Nuit (%)', weight_percent: 40, target_value: 100, current_value: 98, unit: '%', data_source: 'manual_manager' }
      ];
    }
    return [
      { id: `kpi-${id}-1`, title: 'Respect des Délais de Fabrication & Ordres GPAO (%)', weight_percent: 60, target_value: 100, current_value: 96, unit: '%', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Conformité Qualité & Taux de Disponibilité Machines (%)', weight_percent: 40, target_value: 98, current_value: 97, unit: '%', data_source: 'manual_manager' }
    ];
  }

  if (poleKey === 'LOGISTIQUE_TRANSPORT' || deptLower.includes('logis') || deptLower.includes('exped') || deptLower.includes('stock') || jobLower.includes('livr') || jobLower.includes('chauf') || jobLower.includes('magasin')) {
    if (nameLower.includes('riadh') || nameLower.includes('bouazizi') || jobLower.includes('magasin') || jobLower.includes('stock') || jobLower.includes('picking')) {
      return [
        { id: `kpi-${id}-1`, title: 'Vitesse & Exactitude Préparation Commandes Picking (%)', weight_percent: 70, target_value: 100, current_value: 98, unit: '%', data_source: 'manual_manager' },
        { id: `kpi-${id}-2`, title: 'Inventaire Tournant & Zéro Écart de Stock (%)', weight_percent: 30, target_value: 100, current_value: 97, unit: '%', data_source: 'manual_manager' }
      ];
    }
    if (nameLower.includes('hamza') || nameLower.includes('salem') || jobLower.includes('livr') || jobLower.includes('chauff')) {
      return [
        { id: `kpi-${id}-1`, title: 'Livraisons Réussies sans Réclamation (Livraisons)', weight_percent: 80, target_value: 30, current_value: 28, unit: 'Livraisons', data_source: 'auto_deliveries' },
        { id: `kpi-${id}-2`, title: 'Ponctualité & Éco-conduite Flotte (%)', weight_percent: 20, target_value: 100, current_value: 96, unit: '%', data_source: 'manual_manager' }
      ];
    }
    return [
      { id: `kpi-${id}-1`, title: 'Taux de Service Logistique & Respect Délais (%)', weight_percent: 70, target_value: 100, current_value: 97, unit: '%', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Conformité Réception & Rangement Stock (%)', weight_percent: 30, target_value: 100, current_value: 96, unit: '%', data_source: 'manual_manager' }
    ];
  }

  if (poleKey === 'VENTES_COMMERCE' || deptLower.includes('vent') || deptLower.includes('commer') || jobLower.includes('commer') || jobLower.includes('chargé clientèle')) {
    return [
      { id: `kpi-${id}-1`, title: "Chiffre d'Affaires Ventes Facturées (TND)", weight_percent: 70, target_value: 25000, current_value: 24850, unit: 'TND', data_source: 'auto_pos_sales' },
      { id: `kpi-${id}-2`, title: 'Prospection Nouveaux Clients Terrain (Clients)', weight_percent: 30, target_value: 10, current_value: 9, unit: 'Clients', data_source: 'manual_manager' }
    ];
  }

  if (poleKey === 'FINANCE_COMPTA' || deptLower.includes('finan') || deptLower.includes('compta') || jobLower.includes('financ') || jobLower.includes('rapproch')) {
    if (nameLower.includes('khaled') || jobLower.includes('directeur')) {
      return [
        { id: `kpi-${id}-1`, title: 'Taux de Recouvrement Factures Échues (%)', weight_percent: 60, target_value: 95, current_value: 94, unit: '%', data_source: 'manual_manager' },
        { id: `kpi-${id}-2`, title: 'Rapprochement Bancaire & Justification Soldes (%)', weight_percent: 40, target_value: 100, current_value: 98, unit: '%', data_source: 'manual_manager' }
      ];
    }
    return [
      { id: `kpi-${id}-1`, title: 'Pointage & Lettrage Factures Fournisseurs (%)', weight_percent: 60, target_value: 100, current_value: 98, unit: '%', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Zéro Écart Journalier de Caisse (Jours)', weight_percent: 40, target_value: 30, current_value: 29, unit: 'Jours', data_source: 'manual_manager' }
    ];
  }

  if (poleKey === 'RH_SOCIAL' || deptLower.includes('rh') || deptLower.includes('ressour') || jobLower.includes('rh') || jobLower.includes('paie')) {
    return [
      { id: `kpi-${id}-1`, title: 'Clôture Paie & Déclarations CNSS dans les Délais (Jours)', weight_percent: 60, target_value: 3, current_value: 2, unit: 'Jours', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Conformité Contrats & Registre RH (%)', weight_percent: 40, target_value: 100, current_value: 99, unit: '%', data_source: 'manual_manager' }
    ];
  }

  if (nameLower.includes('meriam') || jobLower.includes('gérante') || jobLower.includes('générale')) {
    return [
      { id: `kpi-${id}-1`, title: 'Croissance Chiffre d’Affaires & Marge Nette Global (%)', weight_percent: 60, target_value: 20, current_value: 19.2, unit: '%', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Taux de Rétention & Satisfaction Grands Comptes (%)', weight_percent: 40, target_value: 98, current_value: 98.5, unit: '%', data_source: 'manual_manager' }
    ];
  }

  if (nameLower.includes('sami') || jobLower.includes('dev') || jobLower.includes('dsi') || jobLower.includes('it')) {
    return [
      { id: `kpi-${id}-1`, title: 'Disponibilité & Stabilité Infrastructure ERP (%)', weight_percent: 60, target_value: 99.5, current_value: 99.9, unit: '%', data_source: 'manual_manager' },
      { id: `kpi-${id}-2`, title: 'Déploiement & Automatisation Modules MPO (Modules)', weight_percent: 40, target_value: 5, current_value: 5, unit: 'Modules', data_source: 'manual_manager' }
    ];
  }

  return [
    { id: `kpi-${id}-1`, title: 'Objectif Opérationnel de Service (%)', weight_percent: 60, target_value: 100, current_value: 96, unit: '%', data_source: 'manual_manager' },
    { id: `kpi-${id}-2`, title: 'Qualité d’Exécution & Rigueur Procédures (%)', weight_percent: 40, target_value: 100, current_value: 98, unit: '%', data_source: 'manual_manager' }
  ];
}

/**
 * Automatically creates or synchronizes an MPO/OKR contract for a single employee
 */
export function syncEmployeeWithMpoContract(
  emp: Employee | any,
  existingContracts: PerformanceContract[] = [],
  tenantId: string = 'company_demo'
): { contract: PerformanceContract; isNew: boolean } {
  const currentYear = new Date().getFullYear();
  const existing = existingContracts.find(
    c => c.employee_id === emp.id || (c.employee_name && c.employee_name.toLowerCase() === (emp.name || '').toLowerCase())
  );

  const poleKey = getEmployeePole(emp);
  const poleInfo = getPoleInfo(poleKey);
  const shortPole = poleInfo.shortName;
  const dept = emp.department || poleInfo.departments[0];
  const jobTitle = emp.jobTitle || 'Collaborateur Elyssa ERP';

  if (existing) {
    // Already has a contract, ensure pole and department are harmonized
    const healedContract: PerformanceContract = {
      ...existing,
      pole: existing.pole || shortPole,
      department: existing.department || dept,
      status: existing.status || 'valide_signe'
    };
    return { contract: healedContract, isNew: false };
  }

  // Calculate target bonus: ~15% to 20% of gross salary
  const brut = Number(emp.baseSalary || 1500) + 
               Number(emp.transportAllowance || 0) + 
               Number(emp.presenceAllowance || 0) + 
               Number(emp.otherAllowances || 0);
  
  const primeTarget = Math.max(250, Math.round((brut * 0.18) / 10) * 10);
  const kpis = generateDefaultKPIsForEmp(emp, poleKey, dept, jobTitle);

  // Calculate individual weighted rate
  let totalWeightedScore = 0;
  let totalWeight = 0;
  kpis.forEach(k => {
    const target = k.target_value > 0 ? k.target_value : 1;
    const rate = k.current_value / target;
    const kpiRatePercent = Math.min(rate * 100, 150);
    totalWeightedScore += (kpiRatePercent * (k.weight_percent / 100));
    totalWeight += k.weight_percent;
  });
  const indRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 96.0;

  const tripartite = computeTripartiteBreakdown(
    primeTarget,
    indRate,
    dept,
    DEFAULT_TRIPARTITE_CONFIG
  );

  const newContract: PerformanceContract = {
    id: `perf-${emp.id}-${currentYear}-08`,
    tenantId: tenantId || emp.tenantId || 'company_demo',
    employee_id: emp.id,
    employee_name: emp.name,
    department: dept,
    pole: shortPole,
    role: jobTitle,
    period: 'mensuel',
    year: currentYear,
    month: 8,
    month_name: 'Août 2026',
    kpis,
    prime_target_tnd: primeTarget,
    calculated_prime_tnd: tripartite.calculated_prime_tnd,
    achievement_rate: tripartite.overall_achievement_rate,
    tripartite_config: tripartite.tripartite_config,
    tripartite_breakdown: tripartite.tripartite_breakdown,
    status: 'valide_signe',
    signed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: `Contrat MPO/OKR généré automatiquement par la passerelle RH Elyssa ERP pour ${emp.name} (${jobTitle}).`,
    is_demo: true,
    is_demo_data: true
  };

  return { contract: newContract, isNew: true };
}

/**
 * Synchronizes all employees with MPO contracts, creating missing ones automatically
 */
export function syncAllEmployeesWithMpoContracts(
  employees: Employee[] = [],
  existingContracts: PerformanceContract[] = [],
  tenantId: string = 'company_demo'
): { contracts: PerformanceContract[]; updatedCount: number } {
  let updatedCount = 0;
  const contractsMap = new Map<string, PerformanceContract>();

  // Load existing contracts
  (existingContracts || []).forEach(c => {
    if (c.employee_id) contractsMap.set(c.employee_id, c);
  });

  const sourceEmployees = (Array.isArray(employees) && employees.length > 0)
    ? employees
    : DEMO_HR_EMPLOYEES;

  sourceEmployees.forEach(emp => {
    const existing = contractsMap.get(emp.id);
    if (!existing) {
      const { contract } = syncEmployeeWithMpoContract(emp, existingContracts, tenantId);
      contractsMap.set(emp.id, contract);
      updatedCount++;
    } else {
      const poleKey = getEmployeePole(emp);
      const poleInfo = getPoleInfo(poleKey);
      if (!existing.pole || existing.pole !== poleInfo.shortName) {
        contractsMap.set(emp.id, {
          ...existing,
          pole: poleInfo.shortName,
          department: existing.department || poleInfo.departments[0]
        });
        updatedCount++;
      }
    }
  });

  return {
    contracts: Array.from(contractsMap.values()),
    updatedCount
  };
}

/**
 * Dynamically generates realistic MPO/OKR demo contracts assigned directly to tenant collaborators
 */
export function generateTenantDemoPerformanceContracts(
  tenantId: string = 'company_demo',
  employees: any[] = [],
  _activeManagerName?: string
): PerformanceContract[] {
  const targetEmployees = (Array.isArray(employees) && employees.length > 0)
    ? employees
    : DEMO_HR_EMPLOYEES;

  const contracts: PerformanceContract[] = [];

  targetEmployees.forEach((emp, index) => {
    const poleKey = getEmployeePole(emp);
    const poleInfo = getPoleInfo(poleKey);
    const shortPole = poleInfo.shortName;
    const assignedDept = emp.department || poleInfo.departments[0];
    const jobTitle = emp.jobTitle || 'Collaborateur';

    let primeTarget = 350;
    const nameLower = (emp.name || '').toLowerCase();

    if (nameLower.includes('meriam')) primeTarget = 650;
    else if (nameLower.includes('khaled')) primeTarget = 500;
    else if (nameLower.includes('sami')) primeTarget = 600;
    else if (nameLower.includes('amel')) primeTarget = 400;
    else if (nameLower.includes('ines')) primeTarget = 350;
    else if (nameLower.includes('gharbi')) primeTarget = 450;
    else if (nameLower.includes('jalel')) primeTarget = 350;
    else if (nameLower.includes('mourad')) primeTarget = 350;
    else if (nameLower.includes('sofiene')) primeTarget = 350;
    else if (nameLower.includes('salem')) primeTarget = 250;
    else if (nameLower.includes('bouazizi')) primeTarget = 250;
    else {
      const base = Number(emp.baseSalary || 1500);
      primeTarget = Math.max(250, Math.round((base * 0.18) / 10) * 10);
    }

    const kpis = generateDefaultKPIsForEmp(emp, poleKey, assignedDept, jobTitle);

    let totalWeightedScore = 0;
    let totalWeight = 0;
    kpis.forEach(k => {
      const target = k.target_value > 0 ? k.target_value : 1;
      const rate = k.current_value / target;
      const kpiRatePercent = Math.min(rate * 100, 150);
      totalWeightedScore += (kpiRatePercent * (k.weight_percent / 100));
      totalWeight += k.weight_percent;
    });
    const individualRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 96.0;

    const tripartite = computeTripartiteBreakdown(
      primeTarget,
      individualRate,
      assignedDept,
      DEFAULT_TRIPARTITE_CONFIG
    );

    const signedAt = new Date(Date.now() - (index + 1) * 86400000 * 2).toISOString();

    const contractObj: PerformanceContract = {
      id: `perf-${emp.id}-2026-08`,
      tenantId,
      employee_id: emp.id,
      employee_name: emp.name,
      department: assignedDept,
      pole: shortPole,
      role: jobTitle,
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
      status: 'valide_signe',
      signed_at: signedAt,
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
    else if (deptLower.includes('rh') || deptLower.includes('ressour') || deptLower.includes('social')) rateDir = 98.0;
    else if (deptLower.includes('it') || deptLower.includes('direct') || deptLower.includes('tech')) rateDir = 99.0;
    else if (deptLower.includes('logis') || deptLower.includes('exped') || deptLower.includes('transport')) rateDir = 91.0;
    else if (deptLower.includes('prod') || deptLower.includes('gpao') || deptLower.includes('atelier') || deptLower.includes('industrie')) rateDir = 94.0;
    else if (deptLower.includes('achat') || deptLower.includes('appro')) rateDir = 90.0;
    else if (deptLower.includes('magasin') || deptLower.includes('pos') || deptLower.includes('caisse')) rateDir = 92.0;
    else rateDir = 93.0;
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
