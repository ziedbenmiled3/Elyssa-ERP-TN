export interface ErpModuleItem {
  id: string;
  code: string;
  title: string;
  category: 'OPÉRATIONS & FINANCE' | 'RH & MANAGEMENT' | 'COMMERCIAL & CRM' | 'LOGISTIQUE';
  description: string;
  priceMonthlyTnd: number;
  currency: string;
  isPopular?: boolean;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMING_SOON';
  features: string[];
  iconName: string;
}

export interface ErpPackItem {
  id: string;
  name: string;
  badge?: string;
  priceMonthlyTnd: number;
  billingText: string;
  description: string;
  includedModules: string[];
  maxUsers: number;
  maxFieldAgents: number;
  mobileFleetStatus: 'OPTION' | 'INCLUDED_5_SEATS' | 'INCLUDED_UNLIMITED';
  features: string[];
  isRecommended?: boolean;
}

export const ELYSSA_ERP_MODULES_CATALOG: ErpModuleItem[] = [
  {
    id: 'mod-11-mobile-fleet',
    code: 'MOD-11',
    title: 'Flotte Mobile & Suivi Terrain',
    category: 'OPÉRATIONS & FINANCE',
    description: 'Application PWA Offline-First pour les commerciaux (Van Sales) et chefs de chantiers. Géofencing dynamique, pointage biométrique par IA, et gestion des stocks itinérants.',
    priceMonthlyTnd: 39,
    currency: 'TND',
    isPopular: true,
    status: 'AVAILABLE',
    iconName: 'Smartphone',
    features: [
      'Pointage biométrique IA (Gemini Vision facial recognition)',
      'Géofencing GPS dynamique multi-sites & chantiers',
      'Mode Van Sales & Bons de livraison hors-ligne',
      'Synchronisation bidirectionnelle Firestore en tâche de fond',
      'Arbitrage & alertes de sécurité pour le responsable RH'
    ]
  },
  {
    id: 'mod-01-finance-accounting',
    code: 'MOD-01',
    title: 'Comptabilité & Facturation Générale',
    category: 'OPÉRATIONS & FINANCE',
    description: 'Facturation conforme aux normes tunisiennes (TTN/TEJ), devis, avoirs et états financiers en temps réel.',
    priceMonthlyTnd: 49,
    currency: 'TND',
    status: 'ACTIVE',
    iconName: 'Building2',
    features: [
      'Factures & Avoirs réglementaires TTN',
      'Déclaration de TVA, IRPP & bilan',
      'Rapprochement bancaire automatisé'
    ]
  },
  {
    id: 'mod-02-rh-attendance',
    code: 'MOD-02',
    title: 'RH, Paie Tunisie & Pointage Central',
    category: 'RH & MANAGEMENT',
    description: 'Suivi des temps de travail, plannings de roulement, calcul automatique des fiches de paie (IRPP/CNSS) et gestion des absences.',
    priceMonthlyTnd: 29,
    currency: 'TND',
    status: 'ACTIVE',
    iconName: 'Users',
    features: [
      'Calcul Fiche de Paie conforme CNSS 2026',
      'Pointage horaire & Feuilles de temps',
      'Export Sage & Télédéclaration CNSS'
    ]
  },
  {
    id: 'mod-03-commercial-inventory',
    code: 'MOD-03',
    title: 'Gestion Commerciale & Stocks Multi-Dépôts',
    category: 'COMMERCIAL & CRM',
    description: 'Bons de commande, gestion de stock en temps réel, inventaires valorisés FIFO et suivi du catalogue produits.',
    priceMonthlyTnd: 39,
    currency: 'TND',
    status: 'ACTIVE',
    iconName: 'Truck',
    features: [
      'Gestion commerciale & Bons de livraison',
      'Multi-dépôts & Valorisation de stock',
      'Alertes de réapprovisionnement automatique'
    ]
  }
];

export const ELYSSA_ERP_PACKS_CATALOG: ErpPackItem[] = [
  {
    id: 'pack-essentiel',
    name: 'Pack ESSENTIEL',
    priceMonthlyTnd: 99,
    billingText: 'DT / mois HT',
    description: 'Pour les PME souhaitant digitaliser leur gestion comptable, commerciale et RH au bureau.',
    includedModules: ['MOD-01', 'MOD-02', 'MOD-03'],
    maxUsers: 5,
    maxFieldAgents: 0,
    mobileFleetStatus: 'OPTION',
    features: [
      'Modules inclus : MOD-01 Compta, MOD-02 RH & MOD-03 Ventes',
      '5 Utilisateurs Web inclus',
      'Flotte Mobile MOD-11 disponible à la carte (39 DT/mois par agent)'
    ],
    isRecommended: false
  },
  {
    id: 'pack-pro-terrain',
    name: 'Pack PRO TERRAIN',
    badge: 'LE PLUS POPULAIRE',
    priceMonthlyTnd: 199,
    billingText: 'DT / mois HT',
    description: 'L\'offre idéale pour les entreprises avec équipes sur le terrain (livreurs, commerciaux, chantiers).',
    includedModules: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-11'],
    maxUsers: 15,
    maxFieldAgents: 5,
    mobileFleetStatus: 'INCLUDED_5_SEATS',
    features: [
      'Tous les modules essentiels (MOD-01, MOD-02, MOD-03)',
      'Module Flotte Mobile & Suivi Terrain (MOD-11) INCLUS',
      '15 Utilisateurs Web + 5 Licences Terrain Mobile Incluses',
      'Biométrie IA Gemini & Géofencing GPS en temps réel',
      'Agents terrain supplémentaires à 29 DT/mois (au lieu de 39 DT)'
    ],
    isRecommended: true
  },
  {
    id: 'pack-enterprise',
    name: 'Pack ENTERPRISE',
    priceMonthlyTnd: 399,
    billingText: 'DT / mois HT',
    description: 'Pour les grands groupes et flotte étendue nécessitant un suivi sur-mesure et un accompagnement dédié.',
    includedModules: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-11'],
    maxUsers: 50,
    maxFieldAgents: 25,
    mobileFleetStatus: 'INCLUDED_UNLIMITED',
    features: [
      'Accès illimité à l\'ensemble de la suite Elyssa ERP',
      '50 Utilisateurs Web + 25 Licences Terrain Mobile Incluses',
      'Intégration sur-mesure & API Webhooks dédiées',
      'Support prioritaire 24/7 & Chef de projet dédié',
      'SLA 99.9% de disponibilité garantie'
    ],
    isRecommended: false
  }
];

