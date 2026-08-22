// src/services/hrSyncService.ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service de Synchronisation Transverse RH & Référentiel des 6 Pôles - Elyssa ERP
 * Assure la propagation d'état en temps réel, le routage opérationnel par métier
 * et l'harmonisation des 6 Pôles & Services dans tout l'écosystème Elyssa ERP.
 */

import { Employee, PerformanceContract, KPIItem, WorkContract, AbsenceRecord, Payslip, CompanyLocation, RHPoleKey } from '../types';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { computeTunisianPayroll } from './taxCalculations';

export interface HREmployeeEventDetail {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  employee: Employee;
  tenantId: string;
  timestamp: number;
}

// ----------------------------------------------------
// 1. Référentiel Unifié des 6 Pôles RH & Services
// ----------------------------------------------------

export interface RHPoleInfo {
  key: RHPoleKey;
  label: string;
  shortName: string;
  description: string;
  departments: string[];
  colorBadge: string;
  borderBadge: string;
  bgBadge: string;
  textBadge: string;
  bgLight: string;
  iconName: string;
}

export const UNIFIED_RH_POLES: Record<RHPoleKey, RHPoleInfo> = {
  DIRECTION_IT: {
    key: 'DIRECTION_IT',
    label: 'Direction Générale, IT/DSI & Juridique',
    shortName: 'Direction & IT',
    description: 'Direction Générale, IT/DSI, Juridique',
    departments: ['Direction Générale', 'IT / DSI', 'Juridique & Conformité', 'Audit Interne', 'Développement ERP'],
    colorBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    borderBadge: 'border-purple-300 text-purple-700 bg-purple-50',
    bgBadge: 'bg-purple-50',
    textBadge: 'text-purple-700',
    bgLight: 'bg-purple-500/10 text-purple-600',
    iconName: 'Building'
  },
  FINANCE_COMPTA: {
    key: 'FINANCE_COMPTA',
    label: 'Direction Financière, Trésorerie & Fiscalité',
    shortName: 'Finance & Compta',
    description: 'Direction Financière, Trésorerie, Fiscalité',
    departments: ['Finance & Recouvrement', 'Comptabilité & Rapprochement', 'Trésorerie & Fiscalité', 'Contrôle de Gestion'],
    colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderBadge: 'border-emerald-300 text-emerald-700 bg-emerald-50',
    bgBadge: 'bg-emerald-50',
    textBadge: 'text-emerald-700',
    bgLight: 'bg-emerald-500/10 text-emerald-600',
    iconName: 'DollarSign'
  },
  VENTES_COMMERCE: {
    key: 'VENTES_COMMERCE',
    label: 'Force de Vente, ADV & Caisse POS',
    shortName: 'Ventes & Commerce',
    description: 'Force de Vente, ADV, Caisse POS',
    departments: ['Commercial & Ventes', 'ADV / Facturation', 'Caisse & POS', 'Grands Comptes / Export', 'Van Sales'],
    colorBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    borderBadge: 'border-blue-300 text-blue-700 bg-blue-50',
    bgBadge: 'bg-blue-50',
    textBadge: 'text-blue-700',
    bgLight: 'bg-blue-500/10 text-blue-600',
    iconName: 'TrendingUp'
  },
  RH_SOCIAL: {
    key: 'RH_SOCIAL',
    label: 'Direction RH, Paie, Pointage & HSE',
    shortName: 'RH & Social',
    description: 'Direction RH, Paie, Pointage & HSE',
    departments: ['Ressources Humaines & Paie', 'Pointage & Présences', 'HSE & Sécurité au Travail', 'Recrutement & Formation'],
    colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    borderBadge: 'border-amber-300 text-amber-700 bg-amber-50',
    bgBadge: 'bg-amber-50',
    textBadge: 'text-amber-700',
    bgLight: 'bg-amber-500/10 text-amber-600',
    iconName: 'Users'
  },
  LOGISTIQUE_TRANSPORT: {
    key: 'LOGISTIQUE_TRANSPORT',
    label: 'Expéditions/Tournées, Entrepôt/Stocks & Transit',
    shortName: 'Logistique & Transport',
    description: 'Expéditions/Tournées, Entrepôt/Stocks, Achats, Transit',
    departments: ['Expéditions & Tournées', 'Entrepôt & Stocks', 'Achats & Approvisionnement', 'Transit & Douane', 'Parc Auto & Flotte'],
    colorBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderBadge: 'border-indigo-300 text-indigo-700 bg-indigo-50',
    bgBadge: 'bg-indigo-50',
    textBadge: 'text-indigo-700',
    bgLight: 'bg-indigo-500/10 text-indigo-600',
    iconName: 'Truck'
  },
  PRODUCTION_INDUSTRIE: {
    key: 'PRODUCTION_INDUSTRIE',
    label: 'GPAO/Ateliers, Assemblage & Maintenance',
    shortName: 'Production & Industrie',
    description: 'GPAO/Ateliers, Assemblage, Maintenance',
    departments: ['GPAO & Planning', 'Atelier d\'Assemblage', 'Maintenance Industrielle', 'Contrôle Qualité & Laboratoire'],
    colorBadge: 'bg-orange-50 text-orange-700 border-orange-200',
    borderBadge: 'border-orange-300 text-orange-700 bg-orange-50',
    bgBadge: 'bg-orange-50',
    textBadge: 'text-orange-700',
    bgLight: 'bg-orange-500/10 text-orange-600',
    iconName: 'Factory'
  }
};

export const UNIFIED_RH_POLES_LIST: RHPoleInfo[] = Object.values(UNIFIED_RH_POLES);

export function getPoleInfo(poleKeyOrName?: string): RHPoleInfo {
  if (!poleKeyOrName) return UNIFIED_RH_POLES.DIRECTION_IT;
  if (poleKeyOrName in UNIFIED_RH_POLES) {
    return UNIFIED_RH_POLES[poleKeyOrName as RHPoleKey];
  }
  const key = matchPoleKey(poleKeyOrName);
  return UNIFIED_RH_POLES[key];
}

export function matchPoleKey(str?: string): RHPoleKey {
  if (!str) return 'DIRECTION_IT';
  const clean = str.toUpperCase().trim();
  if (clean in UNIFIED_RH_POLES) return clean as RHPoleKey;

  const low = str.toLowerCase();
  if (low.includes('prod') || low.includes('gpao') || low.includes('atelier') || low.includes('usinage') || low.includes('maintenance')) {
    return 'PRODUCTION_INDUSTRIE';
  }
  if (low.includes('logist') || low.includes('transport') || low.includes('chauffeur') || low.includes('livr') || low.includes('tourn') || low.includes('stock') || low.includes('entrepot') || low.includes('achat') || low.includes('transit') || low.includes('flotte')) {
    return 'LOGISTIQUE_TRANSPORT';
  }
  if (low.includes('vent') || low.includes('commerc') || low.includes('caisse') || low.includes('pos') || low.includes('client') || low.includes('adv') || low.includes('van sales')) {
    return 'VENTES_COMMERCE';
  }
  if (low.includes('rh') || low.includes('ressource') || low.includes('humain') || low.includes('paie') || low.includes('social') || low.includes('pointage') || low.includes('hse') || low.includes('recrutement')) {
    return 'RH_SOCIAL';
  }
  if (low.includes('financ') || low.includes('compt') || low.includes('tresor') || low.includes('fiscal') || low.includes('recouvr') || low.includes('rapproch') || low.includes('banque')) {
    return 'FINANCE_COMPTA';
  }
  return 'DIRECTION_IT';
}

export function getEmployeePole(emp?: Partial<Employee>): RHPoleKey {
  if (!emp) return 'DIRECTION_IT';
  if (emp.pole && emp.pole in UNIFIED_RH_POLES) return emp.pole as RHPoleKey;
  const combo = `${emp.pole || ''} ${emp.department || ''} ${emp.jobTitle || ''} ${emp.role || ''}`;
  return matchPoleKey(combo);
}

// ----------------------------------------------------
// 2. Helpers de Qualification Métier & Rôle
// ----------------------------------------------------

export function isDriverOrDelivery(emp: Partial<Employee>): boolean {
  if (!emp) return false;
  const job = (emp.jobTitle || '').toLowerCase();
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();
  
  return (
    job.includes('chauffeur') ||
    job.includes('livreur') ||
    job.includes('conducteur') ||
    job.includes('transport') ||
    job.includes('van sales') ||
    role.includes('chauffeur') ||
    role.includes('livreur') ||
    role.includes('conducteur') ||
    dept.includes('transport') ||
    (dept.includes('logistique') && (job.includes('agent') || job.includes('terrain') || job.includes('livr')))
  );
}

export function isWarehouseOrPicking(emp: Partial<Employee>): boolean {
  if (!emp) return false;
  const pole = (emp.pole || '').toString().toUpperCase();
  const job = (emp.jobTitle || '').toLowerCase();
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();

  // 1. Exclure formellement les profils de Direction, Finance, RH et Informatique
  const isExcludedRole = 
    job.includes('directeur') ||
    job.includes('directrice') ||
    job.includes('gérant') ||
    job.includes('gerant') ||
    job.includes('gérance') ||
    job.includes('gerance') ||
    job.includes('fondateur') ||
    job.includes('président') ||
    job.includes('president') ||
    job.includes('daf') ||
    job.includes('finance') ||
    job.includes('financier') ||
    job.includes('comptable') ||
    job.includes('comptabilité') ||
    job.includes('comptabilite') ||
    job.includes('ressources humaines') ||
    job.includes('paie') ||
    job.includes('rh') ||
    job.includes('recrutement') ||
    job.includes('développeur') ||
    job.includes('developpeur') ||
    job.includes('ingénieur logiciel') ||
    job.includes('dsi') ||
    job.includes('it ') ||
    job.includes('informatique') ||
    job.includes('juridique') ||
    job.includes('avocat') ||
    job.includes('audit');

  const isExcludedPoleOrDept =
    pole === 'DIRECTION_IT' ||
    pole === 'FINANCE_COMPTA' ||
    pole === 'RH_SOCIAL' ||
    dept.includes('direction') ||
    dept.includes('finance') ||
    dept.includes('comptab') ||
    dept.includes('ressources humaines') ||
    dept.includes('rh') ||
    dept.includes('it') ||
    dept.includes('dsi') ||
    dept.includes('juridique');

  // Si le profil correspond à une exclusion formelle et n'a pas explicitement un titre logistique
  if ((isExcludedRole || isExcludedPoleOrDept) && 
      !job.includes('magasinier') && 
      !job.includes('préparateur') && 
      !job.includes('preparateur') && 
      !job.includes('dépôt') && 
      !job.includes('depot') && 
      !job.includes('chauffeur') && 
      !job.includes('livreur') && 
      !job.includes('cariste') && 
      !job.includes('picking')) {
    return false;
  }

  // 2. Inclusions strictes : Pôle LOGISTIQUE_TRANSPORT ou PRODUCTION_INDUSTRIE,
  // ou poste contenant Magasinier, Préparateur, Dépôt, Logistique, Chauffeur, Opérateur
  const isAllowedPole = pole === 'LOGISTIQUE_TRANSPORT' || pole === 'PRODUCTION_INDUSTRIE';
  const isAllowedJobOrRole = 
    job.includes('magasinier') ||
    job.includes('préparateur') ||
    job.includes('preparateur') ||
    job.includes('dépôt') ||
    job.includes('depot') ||
    job.includes('logistique') ||
    job.includes('chauffeur') ||
    job.includes('livreur') ||
    job.includes('opérateur') ||
    job.includes('operateur') ||
    job.includes('cariste') ||
    job.includes('manutention') ||
    job.includes('gestionnaire de stock') ||
    job.includes('picking') ||
    role.includes('magasinier') ||
    role.includes('préparateur') ||
    role.includes('chauffeur') ||
    role.includes('logistique') ||
    role.includes('opérateur') ||
    dept.includes('magasin') ||
    dept.includes('dépôt') ||
    dept.includes('logistique') ||
    dept.includes('expédition') ||
    dept.includes('expedition');

  return isAllowedPole || isAllowedJobOrRole;
}

export function isProductionOrWorkshop(emp: Partial<Employee>): boolean {
  if (!emp) return false;
  const job = (emp.jobTitle || '').toLowerCase();
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();

  return (
    job.includes('opérateur') ||
    job.includes('operateur') ||
    job.includes('technicien') ||
    job.includes('chef d\'atelier') ||
    job.includes('chef datelier') ||
    job.includes('production') ||
    job.includes('gpao') ||
    job.includes('fabrication') ||
    job.includes('usinage') ||
    job.includes('contremaître') ||
    job.includes('contremaitre') ||
    job.includes('qualité atelier') ||
    job.includes('maintenance') ||
    role.includes('opérateur') ||
    role.includes('technicien') ||
    dept.includes('production') ||
    dept.includes('gpao') ||
    dept.includes('atelier') ||
    dept.includes('fabrication')
  );
}

export function isSalesOrCommercial(emp: Partial<Employee>): boolean {
  if (!emp) return false;
  const job = (emp.jobTitle || '').toLowerCase();
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();

  return (
    job.includes('commercial') ||
    job.includes('vente') ||
    job.includes('clientèle') ||
    job.includes('clientele') ||
    job.includes('technico-commercial') ||
    job.includes('affaires') ||
    job.includes('délégué') ||
    job.includes('delegue') ||
    job.includes('distributeur') ||
    job.includes('chargé de compte') ||
    job.includes('prospecteur') ||
    role.includes('commercial') ||
    role.includes('vendeur') ||
    dept.includes('commercial') ||
    dept.includes('vente') ||
    dept.includes('distribution')
  );
}

// ----------------------------------------------------
// 3. Référentiel Démo Standard (7 Collaborateurs, 7 Contrats, 3 Absences, 7 Bulletins, 3 Sites)
// ----------------------------------------------------

export const DEMO_HR_COMPANY_LOCATIONS: CompanyLocation[] = [
  {
    id: 'loc-siege-tunis',
    tenantId: 'company_demo',
    name: 'Siège Principal (Tunis Charguia)',
    lat: 36.8450,
    lng: 10.2050,
    radius: 200,
    isMaman: true,
    type: 'HQ',
    code: 'SIEGE-TUNIS',
    address: 'Zone Industrielle Charguia 1, 2035 Tunis',
    managerName: 'Meriam Doudou (Direction Générale)',
    is_demo: true
  },
  {
    id: 'loc-agence-sousse',
    tenantId: 'company_demo',
    name: 'Agence Sousse (Bd 14 Janvier)',
    lat: 35.8256,
    lng: 10.6369,
    radius: 150,
    isMaman: false,
    type: 'Agency',
    code: 'AGENCE-SOUSSE',
    address: 'Boulevard 14 Janvier, 4000 Sousse',
    managerName: 'Mohamed Ali Gharbi (Commercial Centre)',
    is_demo: true
  },
  {
    id: 'loc-depot-sfax',
    tenantId: 'company_demo',
    name: 'Dépôt & Succursale Sfax (Zone Poudrière)',
    lat: 34.7405,
    lng: 10.7603,
    radius: 250,
    isMaman: false,
    type: 'Warehouse',
    code: 'DEPOT-SFAX',
    address: 'Zone Industrielle Poudrière 1, 3000 Sfax',
    managerName: 'Hamza Ben Salem (Logistique & Dépôt)',
    is_demo: true
  }
];

export const DEMO_HR_EMPLOYEES: Employee[] = [
  // 1. DIRECTION GÉNÉRALE & IT (3)
  {
    id: 'demo-emp_0',
    tenantId: 'company_demo',
    matricule: 'EMP-0000',
    name: 'Meriam Doudou',
    email: 'm.doudou@elyssa-erp.tn',
    jobTitle: 'Gérante / Direction Générale',
    department: 'Direction Générale',
    pole: 'DIRECTION_IT',
    branchId: 'loc-siege-tunis',
    ssn: '10019283-01',
    cnssNumber: '10019283-01',
    cin: '04123456',
    rib: '03001010015920038000',
    baseSalary: 4500.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2022-01-01',
    hireDate: '2022-01-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_5',
    tenantId: 'company_demo',
    matricule: 'EMP-0005',
    name: 'Sami Mansour',
    email: 's.mansour@elyssa-erp.tn',
    jobTitle: 'DSI / Lead Dév ERP',
    department: 'IT / DSI',
    pole: 'DIRECTION_IT',
    branchId: 'loc-siege-tunis',
    ssn: '11049382-77',
    cnssNumber: '11049382-77',
    cin: '05123456',
    rib: '14102030048592837410',
    baseSalary: 3980.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-01-10',
    hireDate: '2025-01-10',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_11',
    tenantId: 'company_demo',
    matricule: 'EMP-0011',
    name: 'Yassine Ayari',
    email: 'y.ayari@elyssa-erp.tn',
    jobTitle: 'Technicien Support IT & Réseaux',
    department: 'IT / DSI',
    pole: 'DIRECTION_IT',
    branchId: 'loc-siege-tunis',
    ssn: '11948302-12',
    cnssNumber: '11948302-12',
    cin: '09876543',
    rib: '03001010015920038111',
    baseSalary: 1650.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-03-01',
    hireDate: '2025-03-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },

  // 2. FINANCE, TRÉSORERIE & FISCALITÉ (3)
  {
    id: 'demo-emp_1',
    tenantId: 'company_demo',
    matricule: 'EMP-0001',
    name: 'Khaled Ben Amor',
    email: 'k.benamor@elyssa-erp.tn',
    jobTitle: 'Directeur Financier / DAF',
    department: 'Finance & Recouvrement',
    pole: 'FINANCE_COMPTA',
    branchId: 'loc-siege-tunis',
    ssn: '14839211-92',
    cnssNumber: '14839211-92',
    cin: '08912345',
    rib: '03001010015920038472',
    baseSalary: 3160.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2023-01-15',
    hireDate: '2023-01-15',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_2',
    tenantId: 'company_demo',
    matricule: 'EMP-0002',
    name: 'Ines Dridi',
    email: 'i.dridi@elyssa-erp.tn',
    jobTitle: 'Comptable & Trésorière / Rapprochement',
    department: 'Comptabilité & Rapprochement',
    pole: 'FINANCE_COMPTA',
    branchId: 'loc-siege-tunis',
    ssn: '20943810-18',
    cnssNumber: '20943810-18',
    cin: '07123456',
    rib: '08102030026710048259',
    baseSalary: 2100.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2024-03-10',
    hireDate: '2024-03-10',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_12',
    tenantId: 'company_demo',
    matricule: 'EMP-0012',
    name: 'Cyrine Khelifi',
    email: 'c.khelifi@elyssa-erp.tn',
    jobTitle: 'Aide-Comptable / Facturation & Fournisseurs',
    department: 'Comptabilité & Rapprochement',
    pole: 'FINANCE_COMPTA',
    branchId: 'loc-siege-tunis',
    ssn: '20943810-99',
    cnssNumber: '20943810-99',
    cin: '07891234',
    rib: '08102030026710048122',
    baseSalary: 1450.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-02-01',
    hireDate: '2025-02-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },

  // 3. RESSOURCES HUMAINES & SOCIAL (2)
  {
    id: 'demo-emp_4',
    tenantId: 'company_demo',
    matricule: 'EMP-0004',
    name: 'Amel Ben Soltane',
    email: 'a.bensoltane@elyssa-erp.tn',
    jobTitle: 'Responsable RH & Juridique Social',
    department: 'Ressources Humaines & Paie',
    pole: 'RH_SOCIAL',
    branchId: 'loc-siege-tunis',
    ssn: '19483029-45',
    cnssNumber: '19483029-45',
    cin: '06123456',
    rib: '05201040059283749501',
    baseSalary: 2530.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_3',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-11-01',
    hireDate: '2024-11-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_13',
    tenantId: 'company_demo',
    matricule: 'EMP-0013',
    name: 'Tarek Mabrouk',
    email: 't.mabrouk@elyssa-erp.tn',
    jobTitle: 'Gestionnaire Paie, Pointage & HSE',
    department: 'Ressources Humaines & Paie',
    pole: 'RH_SOCIAL',
    branchId: 'loc-siege-tunis',
    ssn: '19483029-77',
    cnssNumber: '19483029-77',
    cin: '06789123',
    rib: '05201040059283749513',
    baseSalary: 1700.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2025-01-15',
    hireDate: '2025-01-15',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },

  // 4. FORCE DE VENTE, ADV & CAISSE POS (4)
  {
    id: 'demo-emp_3',
    tenantId: 'company_demo',
    matricule: 'EMP-0003',
    name: 'Mohamed Ali Gharbi',
    email: 'm.gharbi@elyssa-erp.tn',
    jobTitle: 'Responsable Ventes Terrain & Grands Comptes',
    department: 'Commercial & Ventes',
    pole: 'VENTES_COMMERCE',
    branchId: 'loc-agence-sousse',
    ssn: '12554739-44',
    cnssNumber: '12554739-44',
    cin: '06543210',
    rib: '12004050037840059341',
    baseSalary: 1690.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2025-06-18',
    hireDate: '2025-06-18',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_14',
    tenantId: 'company_demo',
    matricule: 'EMP-0014',
    name: 'Anis Jlassi',
    email: 'a.jlassi@elyssa-erp.tn',
    jobTitle: 'Commercial B2B Régional Sahel',
    department: 'Commercial & Ventes',
    pole: 'VENTES_COMMERCE',
    branchId: 'loc-agence-sousse',
    ssn: '12554739-88',
    cnssNumber: '12554739-88',
    cin: '06543999',
    rib: '12004050037840059314',
    baseSalary: 1500.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-02-01',
    hireDate: '2025-02-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_15',
    tenantId: 'company_demo',
    matricule: 'EMP-0015',
    name: 'Olfa Belhadj',
    email: 'o.belhadj@elyssa-erp.tn',
    jobTitle: 'Chargée ADV & Relations Clients',
    department: 'ADV / Facturation',
    pole: 'VENTES_COMMERCE',
    branchId: 'loc-siege-tunis',
    ssn: '12554739-15',
    cnssNumber: '12554739-15',
    cin: '06543115',
    rib: '12004050037840059315',
    baseSalary: 1450.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2024-09-01',
    hireDate: '2024-09-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_16',
    tenantId: 'company_demo',
    matricule: 'EMP-0016',
    name: 'Mariem Mahfoudh',
    email: 'm.mahfoudh@elyssa-erp.tn',
    jobTitle: 'Hôtesse de Caisse & Vente Showroom',
    department: 'Caisse & POS',
    pole: 'VENTES_COMMERCE',
    branchId: 'loc-siege-tunis',
    ssn: '12554739-16',
    cnssNumber: '12554739-16',
    cin: '06543116',
    rib: '12004050037840059316',
    baseSalary: 1250.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-01-05',
    hireDate: '2025-01-05',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },

  // 5. SUPPLY CHAIN, QUAI & FLOTTE AUTOMOBILE (5)
  {
    id: 'demo-emp_17',
    tenantId: 'company_demo',
    matricule: 'EMP-0017',
    name: 'Nader Chaabane',
    email: 'n.chaabane@elyssa-erp.tn',
    jobTitle: 'Responsable Logistique, Flotte & Dispatching',
    department: 'Expéditions & Tournées',
    pole: 'LOGISTIQUE_TRANSPORT',
    branchId: 'loc-depot-sfax',
    ssn: '16928301-17',
    cnssNumber: '16928301-17',
    cin: '08812317',
    rib: '08102030026710048117',
    baseSalary: 2300.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2023-04-01',
    hireDate: '2023-04-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_10',
    tenantId: 'company_demo',
    matricule: 'EMP-0010',
    name: 'Riadh Bouazizi',
    email: 'r.bouazizi@elyssa-erp.tn',
    jobTitle: 'Chef de Quai & Magasinier Principal',
    department: 'Entrepôt & Stocks',
    pole: 'LOGISTIQUE_TRANSPORT',
    branchId: 'loc-depot-sfax',
    ssn: '18492019-88',
    cnssNumber: '18492019-88',
    cin: '09123456',
    rib: '08102030026710048611',
    baseSalary: 1560.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2024-05-01',
    hireDate: '2024-05-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_18',
    tenantId: 'company_demo',
    matricule: 'EMP-0018',
    name: 'Karim Zribi',
    email: 'k.zribi@elyssa-erp.tn',
    jobTitle: 'Agent Préparateur de Commandes / Picking',
    department: 'Entrepôt & Stocks',
    pole: 'LOGISTIQUE_TRANSPORT',
    branchId: 'loc-depot-sfax',
    ssn: '18492019-18',
    cnssNumber: '18492019-18',
    cin: '09123418',
    rib: '08102030026710048618',
    baseSalary: 1200.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-01-10',
    hireDate: '2025-01-10',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_6',
    tenantId: 'company_demo',
    matricule: 'EMP-0006',
    name: 'Hamza Ben Salem',
    email: 'h.bensalem@elyssa-erp.tn',
    jobTitle: 'Chauffeur-Livreur Principal / Isuzu D-Max',
    department: 'Expéditions & Tournées',
    pole: 'LOGISTIQUE_TRANSPORT',
    branchId: 'loc-siege-tunis',
    ssn: '16928301-22',
    cnssNumber: '16928301-22',
    cin: '08812345',
    rib: '08102030026710048102',
    baseSalary: 1450.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-02-15',
    hireDate: '2024-02-15',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_19',
    tenantId: 'company_demo',
    matricule: 'EMP-0019',
    name: 'Bilal Zouari',
    email: 'b.zouari@elyssa-erp.tn',
    jobTitle: 'Chauffeur-Livreur Poids Lourds / Tournées Régionales',
    department: 'Expéditions & Tournées',
    pole: 'LOGISTIQUE_TRANSPORT',
    branchId: 'loc-depot-sfax',
    ssn: '16928301-19',
    cnssNumber: '16928301-19',
    cin: '08812319',
    rib: '08102030026710048119',
    baseSalary: 1400.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-07-01',
    hireDate: '2024-07-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },

  // 6. PRODUCTION USINE, GPAO & MAINTENANCE (5)
  {
    id: 'demo-emp_7',
    tenantId: 'company_demo',
    matricule: 'EMP-0007',
    name: 'Jalel Ben Ali',
    email: 'j.benali@elyssa-erp.tn',
    jobTitle: 'Responsable Usine & Chef Ligne Extrusion',
    department: 'GPAO & Planning',
    pole: 'PRODUCTION_INDUSTRIE',
    branchId: 'loc-depot-sfax',
    ssn: '15829401-33',
    cnssNumber: '15829401-33',
    cin: '07891234',
    rib: '08102030026710048399',
    baseSalary: 2150.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2023-05-01',
    hireDate: '2023-05-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_8',
    tenantId: 'company_demo',
    matricule: 'EMP-0008',
    name: 'Mourad Trabelsi',
    email: 'm.trabelsi@elyssa-erp.tn',
    jobTitle: "Chef d'Atelier Assemblage Outillage",
    department: "Atelier d'Assemblage",
    pole: 'PRODUCTION_INDUSTRIE',
    branchId: 'loc-siege-tunis',
    ssn: '13928405-55',
    cnssNumber: '13928405-55',
    cin: '04987654',
    rib: '03001010015920038821',
    baseSalary: 2220.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2023-09-01',
    hireDate: '2023-09-01',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_9',
    tenantId: 'company_demo',
    matricule: 'EMP-0009',
    name: 'Sofiene Sassi',
    email: 's.sassi@elyssa-erp.tn',
    jobTitle: 'Superviseur Équipe Nuit Extrusion',
    department: 'GPAO & Planning',
    pole: 'PRODUCTION_INDUSTRIE',
    branchId: 'loc-depot-sfax',
    ssn: '17928394-11',
    cnssNumber: '17928394-11',
    cin: '08345678',
    rib: '08102030026710048502',
    baseSalary: 2150.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-01-15',
    hireDate: '2024-01-15',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_20',
    tenantId: 'company_demo',
    matricule: 'EMP-0020',
    name: 'Bilel Hamdi',
    email: 'b.hamdi@elyssa-erp.tn',
    jobTitle: 'Opérateur Machine Extrusion & Plasturgie',
    department: "Atelier d'Assemblage",
    pole: 'PRODUCTION_INDUSTRIE',
    branchId: 'loc-depot-sfax',
    ssn: '17928394-20',
    cnssNumber: '17928394-20',
    cin: '08345620',
    rib: '08102030026710048520',
    baseSalary: 1300.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-01-20',
    hireDate: '2025-01-20',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  },
  {
    id: 'demo-emp_21',
    tenantId: 'company_demo',
    matricule: 'EMP-0021',
    name: 'Hassen Gharbi',
    email: 'h.gharbi@elyssa-erp.tn',
    jobTitle: 'Technicien Maintenance Industrielle & Étalonnage',
    department: 'Maintenance Industrielle',
    pole: 'PRODUCTION_INDUSTRIE',
    branchId: 'loc-depot-sfax',
    ssn: '17928394-21',
    cnssNumber: '17928394-21',
    cin: '08345621',
    rib: '08102030026710048521',
    baseSalary: 1750.000,
    transportAllowance: 0,
    presenceAllowance: 0,
    otherAllowances: 0,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-06-15',
    hireDate: '2024-06-15',
    contractType: 'CDI',
    company: 'Elyssa Demo Group',
    companyId: 'company_demo',
    is_demo: true
  }
];

export const DEMO_HR_WORK_CONTRACTS: WorkContract[] = DEMO_HR_EMPLOYEES.map(emp => ({
  id: `ct-demo-${emp.matricule || emp.id}`,
  tenantId: emp.tenantId || 'company_demo',
  employeeId: emp.id,
  employeeName: emp.name,
  contractType: 'CDI',
  startDate: emp.hiringDate || emp.hireDate || '2024-01-01',
  trialPeriodMonths: 3,
  baseSalary: emp.baseSalary,
  status: 'Signed',
  dutiesDescription: `Poste de ${emp.jobTitle} - Pôle ${emp.pole} au sein d'Elyssa ERP Group.`,
  generatedAt: emp.hiringDate || '2024-01-01',
  signedAt: emp.hiringDate || '2024-01-02'
}));

export const DEMO_HR_ABSENCES: AbsenceRecord[] = [
  {
    id: 'abs-demo-1',
    tenantId: 'company_demo',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi',
    type: 'PaidLeave',
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    daysCount: 5,
    isDeductibleFromSalary: false,
    deductionAmount: 0,
    status: 'Approved',
    description: 'Congé annuel payé - Solde estival validé par la direction commerciale'
  },
  {
    id: 'abs-demo-2',
    tenantId: 'company_demo',
    employeeId: 'demo-emp_6',
    employeeName: 'Hamza Ben Salem',
    type: 'SickLeave',
    startDate: '2026-08-03',
    endDate: '2026-08-05',
    daysCount: 3,
    isDeductibleFromSalary: false,
    deductionAmount: 0,
    status: 'Approved',
    description: 'Arrêt maladie justifié (Certificat médical fourni, prise en charge CNSS conforme)'
  }
];

export function generateDemoPayslips(employeesList: Employee[] = DEMO_HR_EMPLOYEES, currentMonth: string = '2026-08'): Payslip[] {
  return employeesList.map(emp => {
    const childrenCount = emp.familySituation === 'Married_1' ? 1 
      : emp.familySituation === 'Married_2' ? 2 
      : emp.familySituation === 'Married_3' ? 3 
      : emp.familySituation === 'Married_4_Plus' ? 4 : 0;
    
    const isHead = emp.isChefDeFamille ?? (emp.familySituation?.startsWith('Married') || false);

    const calc = computeTunisianPayroll({
      baseSalary: emp.baseSalary,
      transportAllowance: emp.transportAllowance || 0,
      presenceAllowance: emp.presenceAllowance || 0,
      otherAllowances: emp.otherAllowances || 0,
      childrenCount,
      isHeadOfFamily: isHead
    });

    const allowancesTotal = (emp.transportAllowance || 0) + (emp.presenceAllowance || 0) + (emp.otherAllowances || 0);

    return {
      id: `ps-demo-${emp.id}-${currentMonth}`,
      tenantId: emp.tenantId || 'company_demo',
      employeeId: emp.id,
      employeeName: emp.name,
      month: currentMonth,
      baseSalary: emp.baseSalary,
      grossSalary: calc.grossSalary,
      cnssEmployee: calc.cnssEmployee,
      cnssEmployer: calc.cnssEmployer,
      professionalExpenses: Number(Math.min(calc.taxableGross * 12 * 0.10, 2000) / 12),
      familyDeduction: Number(((isHead ? 300 : 0) + childrenCount * 100) / 12),
      taxableIncome: calc.taxableGross,
      irpp: calc.irppMonthly,
      css: calc.cssMonthly,
      netSalary: calc.netSalary,
      allowancesPaid: allowancesTotal,
      status: 'Paid',
      paidDate: `${currentMonth}-28`,
      paymentMethod: 'Virement',
      bankAccountId: 'ba_1'
    };
  });
}

export const DEMO_HR_PAYSLIPS: Payslip[] = generateDemoPayslips(DEMO_HR_EMPLOYEES, '2026-08');

// ----------------------------------------------------
// 4. Génération Automatique des Contrats MPO
// ----------------------------------------------------

export function generateDefaultKPIsForEmployee(emp: Employee): KPIItem[] {
  const isDriver = isDriverOrDelivery(emp);
  const isWarehouse = isWarehouseOrPicking(emp);
  const isProduction = isProductionOrWorkshop(emp);
  const isSales = isSalesOrCommercial(emp);

  if (isSales) {
    return [
      {
        id: `kpi_sales_ca_${Date.now()}_1`,
        title: 'Chiffre d\'Affaires Réalisé & Facturation',
        weight_percent: 40,
        target_value: 50000,
        current_value: 48500,
        unit: 'TND',
        data_source: 'auto_pos_sales'
      },
      {
        id: `kpi_sales_prospect_${Date.now()}_2`,
        title: 'Nouveaux Clients & Visites Terrain Actives',
        weight_percent: 30,
        target_value: 15,
        current_value: 14,
        unit: 'Visites',
        data_source: 'manual_manager'
      },
      {
        id: `kpi_sales_recouv_${Date.now()}_3`,
        title: 'Taux de Recouvrement des Créances Clients',
        weight_percent: 30,
        target_value: 95,
        current_value: 92,
        unit: '%',
        data_source: 'manual_manager'
      }
    ];
  }

  if (isDriver) {
    return [
      {
        id: `kpi_drv_ontime_${Date.now()}_1`,
        title: 'Ponctualité & Taux de Réussite des Livraisons',
        weight_percent: 40,
        target_value: 98,
        current_value: 96,
        unit: '%',
        data_source: 'auto_deliveries'
      },
      {
        id: `kpi_drv_safety_${Date.now()}_2`,
        title: 'Conformité Véhicule & Zéro Incident Parc Auto',
        weight_percent: 30,
        target_value: 100,
        current_value: 100,
        unit: '%',
        data_source: 'manual_manager'
      },
      {
        id: `kpi_drv_conso_${Date.now()}_3`,
        title: 'Optimisation Carburant & Éco-Conduite',
        weight_percent: 30,
        target_value: 90,
        current_value: 88,
        unit: 'Score',
        data_source: 'manual_manager'
      }
    ];
  }

  if (isWarehouse) {
    return [
      {
        id: `kpi_wh_picking_${Date.now()}_1`,
        title: 'Délai Moyen de Préparation de Commandes (SLA Quai)',
        weight_percent: 40,
        target_value: 95,
        current_value: 94,
        unit: '%',
        data_source: 'auto_picking'
      },
      {
        id: `kpi_wh_accuracy_${Date.now()}_2`,
        title: 'Exactitude des Inventaires & Zéro Écart de Stock',
        weight_percent: 35,
        target_value: 99,
        current_value: 98.5,
        unit: '%',
        data_source: 'manual_manager'
      },
      {
        id: `kpi_wh_sec_${Date.now()}_3`,
        title: 'Conformité Sécurité Dépôt & Propreté',
        weight_percent: 25,
        target_value: 100,
        current_value: 100,
        unit: '%',
        data_source: 'manual_manager'
      }
    ];
  }

  if (isProduction) {
    return [
      {
        id: `kpi_prod_trs_${Date.now()}_1`,
        title: 'Taux de Rendement Synthétique (TRS / OEE)',
        weight_percent: 45,
        target_value: 85,
        current_value: 82,
        unit: '%',
        data_source: 'manual_manager'
      },
      {
        id: `kpi_prod_waste_${Date.now()}_2`,
        title: 'Taux de Rebut & Conformité Qualité Pièces',
        weight_percent: 30,
        target_value: 98,
        current_value: 97.5,
        unit: '%',
        data_source: 'manual_manager'
      },
      {
        id: `kpi_prod_delai_${Date.now()}_3`,
        title: 'Respect du Planning des Ordres de Fabrication (OF)',
        weight_percent: 25,
        target_value: 95,
        current_value: 94,
        unit: '%',
        data_source: 'manual_manager'
      }
    ];
  }

  return [
    {
      id: `kpi_gen_delai_${Date.now()}_1`,
      title: 'Exécution des Tâches Opérationnelles & Clôtures',
      weight_percent: 40,
      target_value: 95,
      current_value: 92,
      unit: '%',
      data_source: 'manual_manager'
    },
    {
      id: `kpi_gen_qual_${Date.now()}_2`,
      title: 'Qualité des Livrables & Conformité Procédures',
      weight_percent: 35,
      target_value: 90,
      current_value: 90,
      unit: '%',
      data_source: 'manual_manager'
    },
    {
      id: `kpi_gen_pres_${Date.now()}_3`,
      title: 'Assiduité & Ponctualité Pointage Biométrique',
      weight_percent: 25,
      target_value: 98,
      current_value: 96,
      unit: '%',
      data_source: 'manual_manager'
    }
  ];
}

export function autoCreateOrUpdatePerformanceContract(emp: Employee, tenantId: string): PerformanceContract {
  const currentYear = new Date().getFullYear();
  const kpiItems = generateDefaultKPIsForEmployee(emp);
  const poleKey = getEmployeePole(emp);
  const poleInfo = UNIFIED_RH_POLES[poleKey];

  const baseSal = Number(emp.baseSalary || 1500) + 
                  Number(emp.transportAllowance || 0) + 
                  Number(emp.presenceAllowance || 0) + 
                  Number(emp.otherAllowances || 0);
  const primeTarget = Math.max(250, Math.round((baseSal * 0.18) / 10) * 10);
  const calculatedPrime = Math.round(primeTarget * 0.923 * 100) / 100;

  const contract: PerformanceContract = {
    id: `mpo_${emp.id}_${currentYear}`,
    tenantId: tenantId || emp.tenantId || 'company_demo',
    employee_id: emp.id,
    employee_name: emp.name,
    department: emp.department || poleInfo.departments[0],
    pole: poleInfo.shortName,
    role: emp.jobTitle || 'Collaborateur Elyssa ERP',
    period: 'annuel',
    year: currentYear,
    status: 'valide_signe',
    prime_target_tnd: primeTarget,
    calculated_prime_tnd: calculatedPrime,
    achievement_rate: 92.3,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90,
      prime_entreprise: Math.round(primeTarget * 0.7 * 0.9 * 100) / 100,
      weight_direction: 20,
      rate_direction: 94,
      prime_direction: Math.round(primeTarget * 0.2 * 0.94 * 100) / 100,
      weight_personnel: 10,
      rate_personnel: 96,
      prime_personnel: Math.round(primeTarget * 0.1 * 0.96 * 100) / 100,
      formula_string: `(${primeTarget} TND × 70% × 90%) + (${primeTarget} TND × 20% × 94%) + (${primeTarget} TND × 10% × 96%) = ${calculatedPrime.toFixed(2)} TND`
    },
    kpis: kpiItems,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: `Contrat MPO initialisé automatiquement par la RH Elyssa ERP sous le Pôle ${poleInfo.shortName} pour ${emp.name} (${emp.jobTitle}).`,
    is_demo: true,
    is_demo_data: true
  };

  // Synchronisation avec localStorage
  try {
    const storageKey = `carthage_mpo_contracts_${tenantId || 'company_demo'}`;
    const raw = localStorage.getItem(storageKey);
    let list: PerformanceContract[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    const index = list.findIndex(c => c.employee_id === emp.id && c.year === currentYear);
    if (index >= 0) {
      list[index] = { ...list[index], ...contract, kpis: list[index].kpis || contract.kpis };
    } else {
      list.push(contract);
    }
    localStorage.setItem(storageKey, JSON.stringify(list));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elyssa_mpo_contract_created', { detail: contract }));
    }

    // Async Cloud write if online
    if (tenantId) {
      setDoc(doc(db, 'company_erp_data', tenantId, 'performance_contracts', contract.id), contract, { merge: true })
        .catch(err => console.warn('Erreur sync MPO Firestore:', err));
    }
  } catch (err) {
    console.warn('Erreur sauvegarde locale MPO:', err);
  }

  return contract;
}

// ----------------------------------------------------
// 5. Initialisation du Profil de Pointage Biométrique
// ----------------------------------------------------

export function autoRegisterAttendanceProfile(emp: Employee, tenantId: string) {
  try {
    const storageKey = `elyssa_attendance_settings_${tenantId || 'global'}`;
    const raw = localStorage.getItem(storageKey);
    let settings = raw ? JSON.parse(raw) : { employees: [] };
    if (!settings.employees || !Array.isArray(settings.employees)) {
      settings.employees = [];
    }

    const existingIndex = settings.employees.findIndex((e: any) => e.id === emp.id);
    const profile = {
      id: emp.id,
      matricule: emp.matricule || `EMP-${emp.id.slice(-4)}`,
      name: emp.name,
      jobTitle: emp.jobTitle,
      department: emp.department,
      pole: getEmployeePole(emp),
      branchId: emp.branchId || 'loc-siege-tunis',
      pinCode: '1234',
      requiresLocation: true,
      requiresPhoto: false,
      status: 'ACTIVE'
    };

    if (existingIndex >= 0) {
      settings.employees[existingIndex] = { ...settings.employees[existingIndex], ...profile };
    } else {
      settings.employees.push(profile);
    }

    localStorage.setItem(storageKey, JSON.stringify(settings));

    // Cloud sync to public attendance settings
    if (tenantId) {
      setDoc(doc(db, 'company_erp_data', tenantId, 'attendance_settings', 'public_config'), {
        updatedAt: new Date().toISOString(),
        employees: settings.employees
      }, { merge: true }).catch(err => console.warn('Erreur sync pointage Firestore:', err));
    }
  } catch (err) {
    console.warn('Erreur initialisation profil pointage:', err);
  }
}

// ----------------------------------------------------
// 6. Enregistrement Agent Flotte Mobile & Terrain
// ----------------------------------------------------

export function autoRegisterMobileFieldAgent(emp: Employee, tenantId: string) {
  if (!isDriverOrDelivery(emp) && !isSalesOrCommercial(emp)) return;

  try {
    const storageKey = `elyssa_mobile_agents_${tenantId || 'global'}`;
    const raw = localStorage.getItem(storageKey);
    let list: any[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const existingIndex = list.findIndex(a => a.id === emp.id);
    const agentData = {
      id: emp.id,
      matricule: emp.matricule,
      name: emp.name,
      jobTitle: emp.jobTitle,
      department: emp.department,
      pole: getEmployeePole(emp),
      branchId: emp.branchId || 'loc-siege-tunis',
      phone: emp.phone || '+216 -- --- ---',
      role: isDriverOrDelivery(emp) ? 'CHAUFFEUR_LIVREUR' : 'COMMERCIAL_TERRAIN',
      status: 'ACTIF',
      lastActive: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...agentData };
    } else {
      list.push(agentData);
    }

    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (err) {
    console.warn('Erreur enregistrement agent mobile:', err);
  }
}

// ----------------------------------------------------
// 7. Dispatch Centralisé de l'Événement RH Transverse
// ----------------------------------------------------

export function dispatchHREmployeeEvent(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  employee: Employee,
  tenantId: string = 'company_parent'
) {
  const detail: HREmployeeEventDetail = {
    action,
    employee,
    tenantId,
    timestamp: Date.now()
  };

  // Traitements automatiques lors de l'ajout ou la mise à jour
  if (action === 'CREATE' || action === 'UPDATE') {
    // 1. MPO / Contrat de Performance
    autoCreateOrUpdatePerformanceContract(employee, tenantId);

    // 2. Profil de Pointage Biométrique
    autoRegisterAttendanceProfile(employee, tenantId);

    // 3. Agent Mobile de Terrain (si Chauffeur / Commercial)
    autoRegisterMobileFieldAgent(employee, tenantId);
  }

  // Émission d'un CustomEvent global dans le navigateur
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('elyssa_hr_employee_synced', { detail }));
    window.dispatchEvent(new CustomEvent(`elyssa_employee_${action.toLowerCase()}`, { detail }));
  }

  console.log(`📡 [RH Synchronizer] Événement transverse dispatché: ${action} pour ${employee.name} (${employee.jobTitle}) [Tenant: ${tenantId}]`);
}
