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
    role: 'Fondateur & Super Admin',
    department: 'Direction Générale',
    pin_code: '123456',
    is_super_admin: true
  },
  {
    id: 'MGR-FIN-01',
    name: 'Ines Dridi',
    role: 'Chef Comptable',
    department: 'Finance & Comptabilité',
    pin_code: '222333'
  },
  {
    id: 'MGR-FIN-02',
    name: 'Mohamed Ali Gharbi',
    role: 'Responsable Recouvrement',
    department: 'Finance & Comptabilité',
    pin_code: '222444'
  },
  {
    id: 'MGR-RH-01',
    name: 'Sami Mansour',
    role: 'Directeur RH',
    department: 'Ressources Humaines',
    pin_code: '555111',
    is_super_admin: true
  },
  {
    id: 'MGR-RH-02',
    name: 'Rim Oueslati',
    role: 'Responsable Paie',
    department: 'Ressources Humaines',
    pin_code: '555222'
  },
  {
    id: 'MGR-ACH-01',
    name: 'Nizar Trabelsi',
    role: 'Responsable Achats',
    department: 'Achats & Production',
    pin_code: '666111'
  },
  {
    id: 'MGR-PROD-01',
    name: 'Bochra Belkachi',
    role: 'Chef de Production',
    department: 'Achats & Production',
    pin_code: '666222'
  },
  {
    id: 'MGR-LOG-01',
    name: 'Kamel Trad',
    role: 'Directeur Logistique',
    department: 'Logistique & Expéditions',
    pin_code: '444444'
  },
  {
    id: 'MGR-LOG-02',
    name: 'Mounir Sfaxi',
    role: 'Chef Dépôt',
    department: 'Logistique & Expéditions',
    pin_code: '444555'
  },
  {
    id: 'MGR-COM-01',
    name: 'Sami Cherif',
    role: 'Commercial Itinérant',
    department: 'Ventes & Commercial Terrain',
    pin_code: '333333'
  },
  {
    id: 'MGR-POS-01',
    name: 'Mounir Karray',
    role: 'Chef de Caisse / Vendeur POS',
    department: 'Magasin & Showroom POS',
    pin_code: '555555'
  }
];

export const DEFAULT_DEMO_PERFORMANCE_CONTRACTS: PerformanceContract[] = [
  // 1. Finance - Ines Dridi
  {
    id: 'perf-contract-ines-dridi',
    employee_id: 'EMP-FIN-01',
    employee_name: 'Ines Dridi',
    department: 'Finance & Comptabilité',
    role: 'Chef Comptable',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 500,
    calculated_prime_tnd: 475.00,
    achievement_rate: 95.0,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 315.00,
      weight_direction: 20,
      rate_direction: 95.0,
      prime_direction: 95.00,
      weight_personnel: 10,
      rate_personnel: 100.0,
      prime_personnel: 50.00,
      formula_string: '(500 TND × 70% × 90%) + (500 TND × 20% × 95%) + (500 TND × 10% × 100%) = 475.00 TND'
    },
    kpis: [
      {
        id: 'kpi-ines-1',
        title: 'Délais Clôture Comptable Mensuelle (J+5)',
        weight_percent: 60,
        target_value: 5,
        current_value: 4,
        unit: 'Jours',
        data_source: 'manual_manager',
        notes: 'Clôture et transmission des balances mensuelles avant le 5 du mois suivant.'
      },
      {
        id: 'kpi-ines-2',
        title: 'Déclarations Fiscales & TEJ sans Pénalités',
        weight_percent: 40,
        target_value: 100,
        current_value: 100,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Génération des certificats de retenue à la source TEJ et déclaration mensuelle.'
      }
    ]
  },
  // 2. Finance - Mohamed Ali Gharbi
  {
    id: 'perf-contract-mohamed-ali-gharbi',
    employee_id: 'EMP-FIN-02',
    employee_name: 'Mohamed Ali Gharbi',
    department: 'Finance & Comptabilité',
    role: 'Responsable Recouvrement',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 400,
    calculated_prime_tnd: 368.00,
    achievement_rate: 92.0,
    status: 'en_attente_signature',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 252.00,
      weight_direction: 20,
      rate_direction: 95.0,
      prime_direction: 76.00,
      weight_personnel: 10,
      rate_personnel: 100.0,
      prime_personnel: 40.00,
      formula_string: '(400 TND × 70% × 90%) + (400 TND × 20% × 95%) + (400 TND × 10% × 100%) = 368.00 TND'
    },
    kpis: [
      {
        id: 'kpi-mohamed-1',
        title: 'Taux de Recouvrement Créances Client (> 90%)',
        weight_percent: 70,
        target_value: 90,
        current_value: 92,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Recouvrement des factures échues à 30 jours.'
      },
      {
        id: 'kpi-mohamed-2',
        title: 'Apurement Créances Ancienneté > 60j (TND)',
        weight_percent: 30,
        target_value: 15000,
        current_value: 14200,
        unit: 'TND',
        data_source: 'manual_manager',
        notes: 'Montant encaissé sur le portefeuille des créances douteuses.'
      }
    ]
  },
  // 3. RH - Rim Oueslati
  {
    id: 'perf-contract-rim-oueslati',
    employee_id: 'EMP-RH-02',
    employee_name: 'Rim Oueslati',
    department: 'Ressources Humaines',
    role: 'Responsable Paie',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 350,
    calculated_prime_tnd: 331.10,
    achievement_rate: 94.6,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 220.50,
      weight_direction: 20,
      rate_direction: 98.0,
      prime_direction: 68.60,
      weight_personnel: 10,
      rate_personnel: 100.0,
      prime_personnel: 42.00,
      formula_string: '(350 TND × 70% × 90%) + (350 TND × 20% × 98%) + (350 TND × 10% × 100%) = 331.10 TND'
    },
    kpis: [
      {
        id: 'kpi-rim-1',
        title: 'Délais Validation Paie & Télé-déclaration CNSS',
        weight_percent: 60,
        target_value: 3,
        current_value: 2,
        unit: 'Jours',
        data_source: 'manual_manager',
        notes: 'Génération et télétransmission de la paie avant la fin de mois.'
      },
      {
        id: 'kpi-rim-2',
        title: 'Zéro Erreur sur Fiches de Paie & Primes',
        weight_percent: 40,
        target_value: 100,
        current_value: 99,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Exactitude des retenues IRPP et cotisations sociales.'
      }
    ]
  },
  // 4. Achats - Nizar Trabelsi
  {
    id: 'perf-contract-nizar-trabelsi',
    employee_id: 'EMP-ACH-01',
    employee_name: 'Nizar Trabelsi',
    department: 'Achats & Production',
    role: 'Responsable Achats',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 450,
    calculated_prime_tnd: 418.50,
    achievement_rate: 93.0,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 283.50,
      weight_direction: 20,
      rate_direction: 90.0,
      prime_direction: 81.00,
      weight_personnel: 10,
      rate_personnel: 120.0,
      prime_personnel: 54.00,
      formula_string: '(450 TND × 70% × 90%) + (450 TND × 20% × 90%) + (450 TND × 10% × 120%) = 418.50 TND'
    },
    kpis: [
      {
        id: 'kpi-nizar-1',
        title: 'Optimisation Coûts Achats & RFA Fournisseurs (%)',
        weight_percent: 60,
        target_value: 8,
        current_value: 8.5,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Remises de fin d année et renégociation des tarifs matières.'
      },
      {
        id: 'kpi-nizar-2',
        title: 'Conformité Commandes Fournisseurs',
        weight_percent: 40,
        target_value: 98,
        current_value: 97,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Taux d expédition conforme en qualité et quantité.'
      }
    ]
  },
  // 5. Production - Bochra Belkachi
  {
    id: 'perf-contract-bochra-belkachi',
    employee_id: 'EMP-PROD-01',
    employee_name: 'Bochra Belkachi',
    department: 'Achats & Production',
    role: 'Chef de Production',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 400,
    calculated_prime_tnd: 364.00,
    achievement_rate: 91.0,
    status: 'brouillon',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 252.00,
      weight_direction: 20,
      rate_direction: 90.0,
      prime_direction: 72.00,
      weight_personnel: 10,
      rate_personnel: 100.0,
      prime_personnel: 40.00,
      formula_string: '(400 TND × 70% × 90%) + (400 TND × 20% × 90%) + (400 TND × 10% × 100%) = 364.00 TND'
    },
    kpis: [
      {
        id: 'kpi-bochra-1',
        title: 'Taux de Rendement Synthétique TRS Lignes (%)',
        weight_percent: 70,
        target_value: 85,
        current_value: 86.5,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Disponibilité et cadence des lignes de conditionnement.'
      },
      {
        id: 'kpi-bochra-2',
        title: 'Taux de Rebuts & Non-Conformités (< 2%)',
        weight_percent: 30,
        target_value: 2,
        current_value: 1.8,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Contrôle qualité en fin de chaîne d assemblage.'
      }
    ]
  },
  // 6. Logistique - Kamel Trad / Mounir Sfaxi
  {
    id: 'perf-contract-mounir-sfaxi',
    employee_id: 'EMP-LOG-02',
    employee_name: 'Mounir Sfaxi',
    department: 'Logistique & Expéditions',
    role: 'Chef Dépôt',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 350,
    calculated_prime_tnd: 320.60,
    achievement_rate: 91.6,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 220.50,
      weight_direction: 20,
      rate_direction: 91.0,
      prime_direction: 63.70,
      weight_personnel: 10,
      rate_personnel: 104.0,
      prime_personnel: 36.40,
      formula_string: '(350 TND × 70% × 90%) + (350 TND × 20% × 91%) + (350 TND × 10% × 104%) = 320.60 TND'
    },
    kpis: [
      {
        id: 'kpi-mounir-sfaxi-1',
        title: 'Fiabilité Inventaire Stock Dépôt (%)',
        weight_percent: 60,
        target_value: 99,
        current_value: 99.2,
        unit: '%',
        data_source: 'auto_picking',
        notes: 'Concordance entre le stock physique et la comptabilité stock ERP.'
      },
      {
        id: 'kpi-mounir-sfaxi-2',
        title: 'Délais Préparation Bons de Picking (min)',
        weight_percent: 40,
        target_value: 45,
        current_value: 40,
        unit: 'min',
        data_source: 'manual_manager',
        notes: 'Temps moyen de préparation d une commande au quai.'
      }
    ]
  },
  // 7. Commercial - Sami Cherif
  {
    id: 'perf-contract-sami-cherif',
    employee_id: 'EMP-COM-01',
    employee_name: 'Sami Cherif',
    department: 'Ventes & Commercial Terrain',
    role: 'Commercial Itinérant',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 450,
    calculated_prime_tnd: 421.11,
    achievement_rate: 93.58,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 283.50,
      weight_direction: 20,
      rate_direction: 93.6,
      prime_direction: 84.24,
      weight_personnel: 10,
      rate_personnel: 96.38,
      prime_personnel: 43.37,
      formula_string: '(450 TND × 70% × 90.0%) + (450 TND × 20% × 93.6%) + (450 TND × 10% × 96.4%) = 411.11 TND'
    },
    kpis: [
      {
        id: 'kpi-sami-1',
        title: "Chiffre d'Affaires Ventes Terrain (TND)",
        weight_percent: 70,
        target_value: 25000,
        current_value: 24850,
        unit: 'TND',
        data_source: 'auto_pos_sales',
        notes: "Objectif de chiffre d'affaires facturé sur le secteur Sud (Sousse / Sfax)."
      },
      {
        id: 'kpi-sami-2',
        title: 'Prospection Nouveaux Clients Actifs',
        weight_percent: 30,
        target_value: 10,
        current_value: 8,
        unit: 'Clients',
        data_source: 'manual_manager',
        notes: 'Nombre de comptes B2B ayant passé au moins 1 commande au cours du mois.'
      }
    ]
  },
  // 8. Logistique - Hamza Ben Salem
  {
    id: 'perf-contract-hamza-bensalem',
    employee_id: 'EMP-LIV-01',
    employee_name: 'Hamza Ben Salem',
    department: 'Logistique & Expéditions',
    role: 'Chauffeur / Livreur Express',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 300,
    calculated_prime_tnd: 271.80,
    achievement_rate: 90.6,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 189.00,
      weight_direction: 20,
      rate_direction: 91.0,
      prime_direction: 54.60,
      weight_personnel: 10,
      rate_personnel: 94.0,
      prime_personnel: 28.20,
      formula_string: '(300 TND × 70% × 90.0%) + (300 TND × 20% × 91.0%) + (300 TND × 10% × 94.0%) = 271.80 TND'
    },
    kpis: [
      {
        id: 'kpi-hamza-1',
        title: 'Livraisons réussies sans réclamation',
        weight_percent: 80,
        target_value: 30,
        current_value: 27,
        unit: 'Livraisons',
        data_source: 'auto_deliveries',
        notes: 'Nombre de livraisons validées avec émargement client sans réserve.'
      },
      {
        id: 'kpi-hamza-2',
        title: 'Ponctualité & Chargement au Quai',
        weight_percent: 20,
        target_value: 100,
        current_value: 95,
        unit: '%',
        data_source: 'manual_manager',
        notes: 'Respect des créneaux de chargement aux quais de Charguia II.'
      }
    ]
  },
  // 9. POS - Mounir Karray
  {
    id: 'perf-contract-mounir-karray',
    employee_id: 'EMP-POS-01',
    employee_name: 'Mounir Karray',
    department: 'Magasin & Showroom POS',
    role: 'Chef de Caisse / Vendeur POS',
    period: 'mensuel',
    year: 2026,
    month: 8,
    month_name: 'Août 2026',
    prime_target_tnd: 250,
    calculated_prime_tnd: 228.20,
    achievement_rate: 91.28,
    status: 'valide_signe',
    signed_at: '2026-08-01T08:00:00.000Z',
    is_demo: true,
    tripartite_config: {
      weight_entreprise: 70,
      weight_direction: 20,
      weight_personnel: 10,
      company_achievement_rate: 90
    },
    tripartite_breakdown: {
      weight_entreprise: 70,
      rate_entreprise: 90.0,
      prime_entreprise: 157.50,
      weight_direction: 20,
      rate_direction: 92.0,
      prime_direction: 46.00,
      weight_personnel: 10,
      rate_personnel: 92.0,
      prime_personnel: 24.70,
      formula_string: '(250 TND × 70% × 90.0%) + (250 TND × 20% × 92.0%) + (250 TND × 10% × 92.0%) = 228.20 TND'
    },
    kpis: [
      {
        id: 'kpi-mounir-1',
        title: "Chiffre d'Affaires Caisse POS (TND)",
        weight_percent: 100,
        target_value: 15000,
        current_value: 13800,
        unit: 'TND',
        data_source: 'auto_pos_sales',
        notes: 'Volume d encaissement comptant et vente directe en magasin principal.'
      }
    ]
  }
];

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
