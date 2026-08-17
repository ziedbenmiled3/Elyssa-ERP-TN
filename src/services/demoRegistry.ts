/**
 * Elyssa ERP - Registre Global de Démonstration (34 Modules)
 * Contient les jeux de données d'essai structurés précisément par catégorie, module et onglet.
 */

import { db } from '../utils/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

export interface DemoModuleDefinition {
  id: string;
  number: number;
  name: string;
  category: 'HR_FIELD' | 'LOGISTICS_INDUSTRY' | 'SALES_CLIENTS' | 'FINANCE_GOVERNANCE' | 'FLEET_ASSETS_SECURITY' | 'BI_STRATEGY';
  tabs: Array<{
    tabName: string;
    collections: string[];
  }>;
}

export const ERP_MODULES_CATALOG: DemoModuleDefinition[] = [
  // SECTION I: RESSOURCES HUMAINES & TERRAIN
  {
    id: 'collaborators_mgmt',
    number: 1,
    name: 'Gestion des Collaborateurs',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Collaborateurs / Fiches', collections: ['collaborators'] },
      { tabName: 'Affectations & Structures', collections: ['org_structures', 'department_assignments'] }
    ]
  },
  {
    id: 'time_attendance',
    number: 2,
    name: 'Pointage & Temps de Travail',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Synthèse RH & Alertes', collections: ['biometric_alerts', 'geofence_anomalies'] },
      { tabName: 'Registre & Feuilles de Temps', collections: ['timesheets', 'attendance_logs'] },
      { tabName: 'Badgeuse Virtuelle / PWA', collections: ['virtual_clock_events'] }
    ]
  },
  {
    id: 'mpo_performance',
    number: 3,
    name: 'Contrats d\'Objectifs & Performance (MPO/OKR)',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Tableau de Bord Global', collections: ['mpo_contracts', 'performance_metrics'] },
      { tabName: 'Contrats Individuels', collections: ['employee_objectives', 'prime_calculations'] }
    ]
  },
  {
    id: 'payroll_taxes',
    number: 4,
    name: 'Paie & Déclarations Fiscales / Sociales',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Bulletins de Paie', collections: ['payroll_slips'] },
      { tabName: 'Déclarations CNSS / IRPP', collections: ['cnss_declarations', 'irpp_records'] }
    ]
  },
  {
    id: 'mobile_fleet_field',
    number: 5,
    name: 'Flotte Mobile & Suivi Terrain',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Terminaux Affectés', collections: ['mobile_devices'] },
      { tabName: 'Suivi Sessions & GPS', collections: ['field_sessions', 'gps_breadcrumbs'] },
      { tabName: 'Validation Commandes Offline', collections: ['offline_orders_sync'] }
    ]
  },

  // SECTION II: LOGISTIQUE, ACHATS, STOCKS & INDUSTRIE
  {
    id: 'stocks_suppliers',
    number: 6,
    name: 'Stocks & Fournisseurs',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'Répertoire Articles & Matières', collections: ['inventory_items', 'stock_categories'] },
      { tabName: 'Niveaux Critiques & Alertes', collections: ['stock_threshold_alerts'] },
      { tabName: 'Valorisation de Stock', collections: ['stock_valuations'] }
    ]
  },
  {
    id: 'purchasing_procurement',
    number: 7,
    name: 'Gestion des Achats & Approvisionnements',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'Bons de Commande Fournisseurs', collections: ['purchase_orders'] },
      { tabName: 'Demandes d\'Achat Internes', collections: ['purchase_requests'] },
      { tabName: 'Évaluation Fournisseurs', collections: ['suppliers_registry', 'vendor_ratings'] }
    ]
  },
  {
    id: 'picking_warehouse',
    number: 8,
    name: 'Gestion des Préparations & Entrepôts (Picking)',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'En Attente / En Cours', collections: ['warehouse_pickings', 'picking_lists'] },
      { tabName: 'Prêts au Quai & Alertes', collections: ['dock_alerts', 'warehouse_locations'] }
    ]
  },
  {
    id: 'shipments_dispatch',
    number: 9,
    name: 'Expéditions & Tournées',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'File d\'Attente & Multi-Canaux', collections: ['shipment_queues'] },
      { tabName: 'Configuration Tournées', collections: ['dispatch_tours', 'tour_manifests'] },
      { tabName: 'Clôture de Caisse Soirée', collections: ['driver_cash_settlements'] }
    ]
  },
  {
    id: 'production_gpao',
    number: 10,
    name: 'Production & GPAO (TRS)',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'Ordres de Fabrication (OF)', collections: ['manufacturing_orders'] },
      { tabName: 'Nomenclatures (BOM)', collections: ['production_boms'] },
      { tabName: 'Atelier & Performance TRS', collections: ['workcenter_performance'] }
    ]
  },
  {
    id: 'transit_international',
    number: 11,
    name: 'Transit & Logistique Internationale',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'Suivi Dossiers Imports/Exports', collections: ['transit_folders'] },
      { tabName: 'Coût de Revient Consolidé', collections: ['landed_cost_calculations'] },
      { tabName: 'Réglementation & Liasse Douane', collections: ['customs_declarations', 'customs_documents_eur1'] }
    ]
  },
  {
    id: 'letters_of_credit',
    number: 12,
    name: 'Lettres de Crédit (Crédocs Bancaires)',
    category: 'LOGISTICS_INDUSTRY',
    tabs: [
      { tabName: 'Registre Crédocs Émis/Actifs', collections: ['letters_of_credit'] },
      { tabName: 'Dossiers SWIFT & Suivi Banque', collections: ['swift_messages', 'bank_covenants'] }
    ]
  },

  // SECTION III: ACTIVITÉ COMMERCIALE, VENTES & CLIENTS
  {
    id: 'billing_recovery',
    number: 13,
    name: 'Facturation & Recouvrement',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Factures Clients & Avoirs', collections: ['invoices', 'credit_notes'] },
      { tabName: 'Échéancier & Relances Recouvrement', collections: ['aging_balances', 'recovery_actions'] }
    ]
  },
  {
    id: 'clients_crm',
    number: 14,
    name: 'Fiches Clients & CRM',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Répertoire Comptes Clients', collections: ['clients_directory'] },
      { tabName: 'Engagements & Plafonds Crédit', collections: ['client_credit_limits'] }
    ]
  },
  {
    id: 'smart_pos',
    number: 15,
    name: 'Caisse Intelligente (POS)',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Sessions & Tickets Caisse', collections: ['pos_sessions', 'pos_receipts'] },
      { tabName: 'Mouvements & Fond de Caisse', collections: ['cash_drawer_logs'] }
    ]
  },
  {
    id: 'client_portal',
    number: 16,
    name: 'Portail Client Extérieur',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Accès & Identifiants Portails', collections: ['client_portal_users'] },
      { tabName: 'Commandes Directes & Téléchargements', collections: ['portal_order_requests'] }
    ]
  },
  {
    id: 'field_reports',
    number: 17,
    name: 'Rapports Terrain & Hebdo',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Rapports de Visite Commerciaux', collections: ['field_visit_reports'] },
      { tabName: 'Questionnaires & Feedback', collections: ['survey_responses'] }
    ]
  },
  {
    id: 'communication_hub',
    number: 18,
    name: 'Hub de Communication',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Campagnes SMS/Email', collections: ['marketing_campaigns'] },
      { tabName: 'Historique des Échanges', collections: ['communication_threads'] }
    ]
  },
  {
    id: 'complaints_sav',
    number: 19,
    name: 'Suivi des Réclamations & SAV',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Tickets SAV Ouverts/Clos', collections: ['support_tickets'] },
      { tabName: 'RMA & Retours Marchandises', collections: ['merchandise_returns'] }
    ]
  },
  {
    id: 'e_storefront',
    number: 20,
    name: 'E-Boutique & Storefront (SaaS E-Commerce)',
    category: 'SALES_CLIENTS',
    tabs: [
      { tabName: 'Catalogue Public / Vitrine', collections: ['ecommerce_products', 'store_categories'] },
      { tabName: 'Commandes Web & Paniers Abandonnés', collections: ['web_orders', 'abandoned_carts'] },
      { tabName: 'Transport & Paiements', collections: ['store_shipping_zones', 'payment_gateway_configs'] }
    ]
  },

  // SECTION IV: FINANCE, COMPTABILITÉ & GOUVERNANCE
  {
    id: 'general_accounting',
    number: 21,
    name: 'Comptabilité Générale & Trésorerie',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Plan Comptable & Journaux', collections: ['accounting_journals', 'general_ledger'] },
      { tabName: 'Écritures & Rapprochement', collections: ['journal_entries', 'bank_reconciliations'] }
    ]
  },
  {
    id: 'tej_cimf',
    number: 22,
    name: 'Intégration TEJ (CIMF)',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Certificats RS Émis / Reçus', collections: ['tej_certificates', 'qrc_tax_records'] },
      { tabName: 'Télédéclarations Validées', collections: ['tej_teletransmissions'] }
    ]
  },
  {
    id: 'accountant_portal',
    number: 23,
    name: 'Espace Expert-Comptable',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Portefeuille Dossiers Clients', collections: ['accountant_client_files'] },
      { tabName: 'Télétransmissions Groupées', collections: ['batch_fiscal_filings'] }
    ]
  },
  {
    id: 'treasury_checks_effects',
    number: 24,
    name: 'Trésorerie, Effets & Chèques',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Chèques à Encaisser / Émis', collections: ['treasury_checks'] },
      { tabName: 'Effets de Commerce & Traites', collections: ['treasury_effects'] },
      { tabName: 'Prévisions & Cash Flow', collections: ['cash_forecasts'] }
    ]
  },
  {
    id: 'fixed_assets',
    number: 25,
    name: 'Immobilisations & Amortissements',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Inventaire Permanent Actifs', collections: ['fixed_assets'] },
      { tabName: 'Tableaux d\'Amortissement', collections: ['depreciation_schedules'] },
      { tabName: 'Plus-Values & Cessions Immos', collections: ['asset_disposals'] }
    ]
  },
  {
    id: 'investments_portfolio',
    number: 26,
    name: 'Bourse & Investissements',
    category: 'FINANCE_GOVERNANCE',
    tabs: [
      { tabName: 'Portefeuille Titres & SICAV', collections: ['security_portfolio'] },
      { tabName: 'Plus-Values & Dividendes', collections: ['dividend_records'] }
    ]
  },

  // SECTION V: PARC, MATÉRIEL, SÉCURITÉ & SECRÉTARIAT
  {
    id: 'fleet_vehicles_mgmt',
    number: 27,
    name: 'Gestion de Parc Auto & Flotte',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Le Parc Auto', collections: ['fleet_vehicles'] },
      { tabName: 'Ordres de Mission', collections: ['fleet_missions'] },
      { tabName: 'Factures & Bons (Carburant, Péages, M.O.)', collections: ['fleet_expenses'] },
      { tabName: 'Sinistres, Enquêtes & Sanctions', collections: ['fleet_accidents'] }
    ]
  },
  {
    id: 'hardware_equipment_mgmt',
    number: 28,
    name: 'Gestion du Parc d\'Actifs & Matériels',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Inventaire Matériels & Équipements', collections: ['fleet_inventory'] },
      { tabName: 'Maintenance & Affectations', collections: ['equipment_maintenance'] }
    ]
  },
  {
    id: 'ged_documents',
    number: 29,
    name: 'GED (Gestion Électronique des Documents)',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Pièces Justificatives Collaborateurs', collections: ['ged_documents'] },
      { tabName: 'Contrats & Fiches Numérisées', collections: ['scanned_archives'] }
    ]
  },
  {
    id: 'company_transfer_audits',
    number: 30,
    name: 'Module de Suivi des Actes & Cession d\'Entreprise',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Registre Général d\'Audit d\'Actes', collections: ['audit_logs', 'cession_events'] },
      { tabName: 'Évaluation Patrimoniale & Valorisation', collections: ['valuation_metrics'] }
    ]
  },
  {
    id: 'legal_secretariat',
    number: 31,
    name: 'Secrétariat Juridique & Registre Légal',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Procès-Verbaux (PV d\'AGO/AGE)', collections: ['legal_minutes'] },
      { tabName: 'Registre des Actionnaires', collections: ['shareholders_registry'] }
    ]
  },
  {
    id: 'saas_licenses_mgmt',
    number: 32,
    name: 'Espace Client & Gestion des Packs SaaS',
    category: 'FLEET_ASSETS_SECURITY',
    tabs: [
      { tabName: 'Souscriptions & Licences', collections: ['client_subscriptions'] },
      { tabName: 'Modules Activés / Restreints', collections: ['tenant_module_permissions'] }
    ]
  },

  // SECTION VI: PILOTAGE, STRATÉGIE & IA
  {
    id: 'bi_copilot_kpi',
    number: 33,
    name: 'Tableau de Bord Décisionnel & BI Copilot',
    category: 'BI_STRATEGY',
    tabs: [
      { tabName: 'KPIs Stratégiques', collections: ['bi_kpi_snapshots'] },
      { tabName: 'Recommandations IA', collections: ['ai_insights_logs'] }
    ]
  },
  {
    id: 'business_plan_strategy',
    number: 34,
    name: 'Business Plan Stratégique & Opportunités',
    category: 'BI_STRATEGY',
    tabs: [
      { tabName: 'Projections Financières', collections: ['bp_projections'] },
      { tabName: 'Pipe d\'Opportunités', collections: ['strategic_opportunities'] }
    ]
  }
];

/**
 * RAW FIXTURE GENERATOR PER COLLECTION
 */
export function generateRawDemoFixtures(): Record<string, any[]> {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  return {
    // 1. Collaborateurs
    collaborators: [
      {
        id: 'COL-HAMZA-01',
        name: 'Hamza Ben Salem',
        email: 'h.bensalem@elyssa-erp.tn',
        phone: '+216 98 123 456',
        role: 'Chauffeur / Livreur Express',
        department: 'Logistique & Expéditions',
        status: 'Active',
        license_status: 'Active',
        assigned_module: 'livraison',
        hireDate: '2022-03-01'
      },
      {
        id: 'COL-SAMI-01',
        name: 'Sami Cherif',
        email: 's.cherif@elyssa-erp.tn',
        phone: '+216 97 234 567',
        role: 'Commercial Itinérant',
        department: 'Ventes & Commercial Terrain',
        status: 'Active',
        license_status: 'Active',
        assigned_module: 'vente',
        hireDate: '2021-06-15'
      },
      {
        id: 'COL-MOUNIR-01',
        name: 'Mounir Karray',
        email: 'm.karray@elyssa-erp.tn',
        phone: '+216 95 345 678',
        role: 'Chef de Caisse / Vendeur POS',
        department: 'Magasin & Showroom POS',
        status: 'Active',
        license_status: 'Active',
        assigned_module: 'vente',
        hireDate: '2023-01-10'
      }
    ],
    org_structures: [
      { id: 'ORG-01', code: 'DIR-GEN', name: 'Direction Générale Elyssa ERP', parentId: null, level: 1, manager: 'Super Admin Elyssa' },
      { id: 'ORG-02', code: 'DEP-RH', name: 'Département Ressources Humaines', parentId: 'ORG-01', level: 2, manager: 'Sonia Trabelsi' },
      { id: 'ORG-03', code: 'DEP-LOG', name: 'Direction Logistique & Exploitation', parentId: 'ORG-01', level: 2, manager: 'Hamza Ben Salem' }
    ],
    department_assignments: [
      { id: 'ASS-01', collaboratorId: 'COL-HAMZA-01', departmentId: 'ORG-03', position: 'Chauffeur Principal', assignedAt: '2022-03-01' },
      { id: 'ASS-02', collaboratorId: 'COL-SAMI-01', departmentId: 'ORG-01', position: 'Senior Sales Representative', assignedAt: '2021-06-15' }
    ],

    // 2. Pointage & Temps de Travail
    biometric_alerts: [
      { id: 'BIO-ALT-01', collaboratorId: 'COL-HAMZA-01', collaboratorName: 'Hamza Ben Salem', alertType: 'Retard > 15min', timestamp: now, status: 'Sous_Examen', matchScore: 0.94 },
      { id: 'BIO-ALT-02', collaboratorId: 'COL-SAMI-01', collaboratorName: 'Sami Cherif', alertType: 'Emplacement GPS Inhabituel', timestamp: now, status: 'Justifie', matchScore: 0.99 }
    ],
    geofence_anomalies: [
      { id: 'GEO-01', collaboratorId: 'COL-SAMI-01', collaboratorName: 'Sami Cherif', distanceMeters: 450, zoneName: 'Agence Sousse Centre', detectedAt: now }
    ],
    timesheets: [
      { id: 'TS-2026-W33-01', collaboratorId: 'COL-HAMZA-01', weekNumber: 33, year: 2026, totalHours: 42, overtimeHours: 2, status: 'Valide' },
      { id: 'TS-2026-W33-02', collaboratorId: 'COL-SAMI-01', weekNumber: 33, year: 2026, totalHours: 40, overtimeHours: 0, status: 'En_Attente' }
    ],
    attendance_logs: [
      { id: 'ATT-LOG-01', collaboratorId: 'COL-HAMZA-01', collaboratorName: 'Hamza Ben Salem', clockTime: now, type: 'IN', method: 'facial', location: 'Dépôt Central Charguia' },
      { id: 'ATT-LOG-02', collaboratorId: 'COL-MOUNIR-01', collaboratorName: 'Mounir Karray', clockTime: now, type: 'IN', method: 'virtual_pwa', location: 'Showroom Tunis Bourguiba' }
    ],
    virtual_clock_events: [
      { id: 'PWA-EVT-01', deviceId: 'DEV-MOBILE-01', agentId: 'COL-HAMZA-01', eventType: 'CHECK_IN', gpsCoordinates: { lat: 36.843, lng: 10.21 }, timestamp: now }
    ],

    // 3. Contrats d'Objectifs & Performance (MPO/OKR)
    mpo_contracts: [
      { id: 'MPO-2026-001', title: 'MPO Alignement Logistique Q3 2026', department: 'Logistique', totalBudgetTnd: 25000, targetScorePercentage: 92, status: 'En_Cours', startDate: '2026-07-01', endDate: '2026-09-30' },
      { id: 'MPO-2026-002', title: 'MPO Expansions Ventes Terrain Sousse', department: 'Ventes', totalBudgetTnd: 40000, targetScorePercentage: 95, status: 'Actif', startDate: '2026-07-01', endDate: '2026-09-30' }
    ],
    performance_metrics: [
      { id: 'PERF-MET-01', contractId: 'MPO-2026-001', metricName: 'Taux de Livraison Réussie dans les Délais (OTIF)', weight: 40, achievedValue: 94.5, targetValue: 95.0, unit: '%' }
    ],
    employee_objectives: [
      { id: 'OBJ-01', employeeId: 'COL-SAMI-01', objectiveTitle: 'Atteindre 150K TND de Ventes Terrain', weightPercentage: 50, currentProgressPercentage: 78, bonusEligibleTnd: 1200 }
    ],
    prime_calculations: [
      { id: 'PRIME-01', employeeId: 'COL-SAMI-01', period: '2026-07', baseBonusTnd: 1200, PerformanceCoefficient: 1.15, finalBonusTnd: 1380, calculatedAt: dateStr }
    ],

    // 4. Paie & Déclarations Fiscales / Sociales
    payroll_slips: [
      { id: 'PAY-2026-07-01', employeeId: 'COL-HAMZA-01', employeeName: 'Hamza Ben Salem', period: '2026-07', grossSalary: 1850, cnssEmployeeDeduction: 170.015, irppDeduction: 142.50, netSalary: 1537.485, status: 'Paye' },
      { id: 'PAY-2026-07-02', employeeId: 'COL-SAMI-01', employeeName: 'Sami Cherif', period: '2026-07', grossSalary: 2450, cnssEmployeeDeduction: 225.155, irppDeduction: 210.00, netSalary: 2014.845, status: 'Paye' }
    ],
    cnss_declarations: [
      { id: 'CNSS-2026-Q2', quarter: 'Q2-2026', totalEmployeesCount: 18, totalGrossWages: 38400, cnssEmployerContribution: 6362.88, cnssEmployeeContribution: 3525.12, status: 'Teledeclare', submissionDate: '2026-07-14' }
    ],
    irpp_records: [
      { id: 'IRPP-2026-07', month: '2026-07', totalTaxableWages: 32000, totalIrppWithheld: 3850, CSSContribution: 320, status: 'Cloture' }
    ],

    // 5. Flotte Mobile & Suivi Terrain
    mobile_devices: [
      { id: 'DEV-ISUZU-01', name: 'Terminal Zebra TC26 Chauffeur', serialNumber: 'ZBR-90812-TN', assignedAgent: 'Hamza Ben Salem', status: 'Active', batteryLevel: 88, lastSync: now },
      { id: 'DEV-COM-02', name: 'Tablette Samsung Active Pro Commercial', serialNumber: 'SAM-44210-TN', assignedAgent: 'Sami Cherif', status: 'Active', batteryLevel: 94, lastSync: now }
    ],
    field_sessions: [
      { id: 'SESS-FIELD-01', agentName: 'Hamza Ben Salem', deviceId: 'DEV-ISUZU-01', startTime: now, status: 'IN_PROGRESS', activeTour: 'TOUR-2026-0881', totalVisitsCompleted: 4 }
    ],
    gps_breadcrumbs: [
      { id: 'GPS-01', sessionId: 'SESS-FIELD-01', lat: 36.852, lng: 10.22, speedKmh: 45, timestamp: now, locationLabel: 'Autoroute A1 Tunis-Hammamet' }
    ],
    offline_orders_sync: [
      { id: 'OFF-SYNC-01', deviceId: 'DEV-COM-02', orderRef: 'OFF-2026-991', clientName: 'Établissements Trabelsi Sousse', amountTtc: 3689, syncStatus: 'SYNCHRONIZED', syncedAt: now }
    ],

    // 6. Stocks & Fournisseurs
    inventory_items: [
      { id: 'PROD-CIM-50', sku: 'CIM-50', name: 'Ciment Portland Super CPJ45 (Sac 50kg)', category: 'Gros Œuvre', unitPrice: 14.50, costPrice: 11.20, stockQuantity: 1200, minStockLevel: 300, unit: 'Sac', warehouse: 'Dépôt Central Charguia' },
      { id: 'PROD-PEI-SAT', sku: 'PEI-SAT', name: 'Peinture Satino-Vinylique Blanche 15L', category: 'Finition', unitPrice: 85.00, costPrice: 62.00, stockQuantity: 180, minStockLevel: 40, unit: 'Pot', warehouse: 'Magasin Tunis Bourguiba' }
    ],
    stock_categories: [
      { id: 'CAT-GROS-OEUVRE', name: 'Gros Œuvre & BTP', itemsCount: 42, defaultVatRate: 19 },
      { id: 'CAT-FINITION', name: 'Peinture & Finitions', itemsCount: 28, defaultVatRate: 19 }
    ],
    stock_threshold_alerts: [
      { id: 'ALT-STK-01', itemSku: 'PEI-SAT', itemName: 'Peinture Satino-Vinylique Blanche 15L', currentStock: 18, minThreshold: 40, severity: 'HIGH', warehouseName: 'Magasin Tunis Bourguiba' }
    ],
    stock_valuations: [
      { id: 'VAL-2026-Q2', valuationMethod: 'PMP', totalItemsCount: 1840, totalValuationTnd: 485000, evaluatedAt: dateStr }
    ],

    // 7. Gestion des Achats & Approvisionnements
    purchase_orders: [
      { id: 'PO-2026-041', supplierName: 'Les Ciments de Bizerte', totalAmountHt: 14200, vatAmount: 2698, totalAmountTtc: 16898, status: 'LIVRE', poDate: dateStr, expectedDeliveryDate: '2026-08-25' }
    ],
    purchase_requests: [
      { id: 'DA-2026-018', requesterName: 'Hamza Ben Salem', department: 'Logistique', itemDescription: '30 Sangles d Arrimagement Poids Lourd 5T', estimatedCostTnd: 1800, approvalStatus: 'APPROUVE', requestedAt: dateStr }
    ],
    suppliers_registry: [
      { id: 'SUP-CIMENT-BIZERTE', name: 'Les Ciments de Bizerte', taxId: '0001890/A/P/000', email: 'commercial@cimentsbizerte.tn', phone: '+216 72 431 100', ratingScore: 4.8, status: 'Agréé' }
    ],
    vendor_ratings: [
      { id: 'RAT-01', supplierId: 'SUP-CIMENT-BIZERTE', qualityScore: 98, deliveryTimeScore: 94, priceScore: 90, overallScore: 94, evaluatedBy: 'Responsable Achats' }
    ],

    // 8. Gestion des Préparations & Entrepôts (Picking)
    warehouse_pickings: [
      { id: 'PICK-2026-881-1', pickingRef: 'BC-881-A', warehouseId: 'WH-CHARGUIA-01', warehouseName: 'Dépôt Central Charguia', itemsCount: 2, status: 'TERMINE', operatorName: 'Hamza Ben Salem', updatedAt: now },
      { id: 'PICK-2026-881-2', pickingRef: 'BC-881-B', warehouseId: 'WH-TUNIS-02', warehouseName: 'Magasin Tunis Bourguiba', itemsCount: 2, status: 'PRET_CHARGEMENT', operatorName: 'Mounir Karray', updatedAt: now }
    ],
    picking_lists: [
      { id: 'PL-01', pickingId: 'PICK-2026-881-1', itemSku: 'CIM-50', qtyRequested: 40, qtyPicked: 40, binLocation: 'Allée A-04' }
    ],
    dock_alerts: [
      { id: 'DOCK-ALT-01', dockNumber: 'Quai #1 Charguia', alertType: 'Camion en attente de chargement', vehicleRef: 'TN-210-9842', estimatedDelayMinutes: 10, createdAt: now }
    ],
    warehouse_locations: [
      { id: 'WH-LOC-01', code: 'WH-CHARGUIA-01', name: 'Dépôt Central Charguia', totalSlots: 450, occupiedSlots: 320, temperatureControlled: false }
    ],

    // 9. Expéditions & Tournées
    shipment_queues: [
      { id: 'SHIP-Q-01', invoiceRef: 'FAC-2026-0881', clientName: 'Société du Sahel Distribution', destinationCity: 'Sousse', totalWeightKg: 2850, priority: 'HAUTE', status: 'EN_TRANSIT' }
    ],
    dispatch_tours: [
      { id: 'DISP-TOUR-881', tourNumber: 'TR-2026-0881', driverName: 'Hamza Ben Salem', vehicleName: 'Camion Isuzu D-Max [TN-210-9842]', stopsCount: 2, totalAmountTtc: 11662, status: 'EN_COURS' }
    ],
    tour_manifests: [
      { id: 'MAN-881', tourId: 'DISP-TOUR-881', manifestNumber: 'MNF-2026-0881', generatedAt: now, totalPackages: 55, securitySealCode: 'SEAL-881-TN' }
    ],
    driver_cash_settlements: [
      { id: 'CASH-SET-01', driverName: 'Hamza Ben Salem', tourRef: 'TR-2026-0881', cashCollectedTnd: 11662, checksCollectedTnd: 0, status: 'EN_ATTENTE_VERIFICATION' }
    ],

    // 10. Production & GPAO (TRS)
    manufacturing_orders: [
      { id: 'OF-2026-004', orderNumber: 'OF-2026-004', productSku: 'DISJ-16', productName: 'Disjoncteur Divisionnaire 16A', targetQuantity: 1000, producedQuantity: 850, status: 'EN_COURS', startDate: dateStr }
    ],
    production_boms: [
      { id: 'BOM-DISJ-16', productSku: 'DISJ-16', bomVersion: 'v2.1', rawMaterials: [{ sku: 'CU-CAT', qtyPerUnit: 0.05, unit: 'Kg' }, { sku: 'PVC-GRA', qtyPerUnit: 0.08, unit: 'Kg' }] }
    ],
    workcenter_performance: [
      { id: 'TRS-LINE-01', workcenterName: 'Ligne d Assemblage Électrique A1', availabilityRate: 92.5, performanceRate: 94.0, qualityRate: 98.8, overallTrsPercentage: 85.9, measuredAt: dateStr }
    ],

    // 11. Transit & Logistique Internationale
    transit_folders: [
      { id: 'TR-IMP-2026-012', folderRef: 'IMP-2026-012', supplierName: 'Bosch Tools Germany', originCountry: 'Allemagne', portOfDischarge: 'Port de Radès', customsBureau: 'Radès Port 10B', status: 'DEDOUANEMENT_EN_COURS' }
    ],
    customs_declarations: [
      { id: 'CUST-DEC-012', folderRef: 'IMP-2026-012', declarationType: 'C100 - Mise à la Consommation', totalCustomsDutyTnd: 4850, vatAmountTnd: 9215, liquidationDate: dateStr }
    ],
    landed_cost_calculations: [
      { id: 'LC-CALC-012', folderRef: 'IMP-2026-012', fobPriceEur: 24000, freightTnd: 3800, insuranceTnd: 450, customsDutiesTnd: 4850, finalLandedCostPerUnitTnd: 38.50 }
    ],
    customs_documents_eur1: [
      { id: 'EUR1-012', documentNumber: 'EUR1-TN-2026-9812', certificateStatus: 'VALIDATED_BY_DOUANE', issuedAt: dateStr }
    ],

    // 12. Lettres de Crédit (Crédocs Bancaires)
    letters_of_credit: [
      { id: 'LC-2026-008', lcNumber: 'LC-BIAT-2026-008', bankName: 'BIAT - Banque Internationale Arabe de Tunisie', beneficiary: 'Bosch Tools Germany Gmbh', amountEur: 24000, expiryDate: '2026-10-15', status: 'OPEN_AND_CONFIRMED' }
    ],
    swift_messages: [
      { id: 'SWIFT-700-01', messageType: 'MT700 Issue of a Documentary Credit', senderBic: 'BIATTNTTXXX', receiverBic: 'COMMDEFFXXX', reference: 'LC-BIAT-2026-008', timestamp: now }
    ],
    bank_covenants: [
      { id: 'COV-BIAT-01', bankName: 'BIAT', covenantType: 'Couverture L/C Minimum 110%', thresholdPercentage: 110, currentStatus: 'CONFORME' }
    ],

    // 13. Facturation & Recouvrement
    invoices: [
      { id: 'FAC-2026-0881', invoiceNumber: 'FAC-2026-0881', clientName: 'Société du Sahel Distribution', amountHt: 9800, vatAmount: 1862, amountTtc: 11662, amountNetToPay: 11515, status: 'Unpaid', delivery_status: 'en_transit', issuedDate: now },
      { id: 'FAC-2026-0900', invoiceNumber: 'FAC-2026-0900', clientName: 'Grands Travaux du Sud - GTS', amountHt: 20882.35, vatAmount: 3967.65, amountTtc: 24850, amountNetToPay: 24536.76, status: 'Unpaid', delivery_status: 'en_attente', issuedDate: now }
    ],
    credit_notes: [
      { id: 'AVR-2026-003', creditNoteNumber: 'AVR-2026-003', originalInvoiceRef: 'FAC-2026-0740', clientName: 'Société du Sahel Distribution', amountTtc: 450, reason: 'Avoir sur casse emballage transport', status: 'VALIDE' }
    ],
    aging_balances: [
      { id: 'AGB-01', clientName: 'Société du Sahel Distribution', totalDueTnd: 11662, currentTnd: 11662, overdue30DaysTnd: 0, overdue60DaysTnd: 0, overdue90DaysTnd: 0 }
    ],
    recovery_actions: [
      { id: 'REC-ACT-01', clientName: 'Société Carthage Cement', stepType: 'RELANCE_AMICALE_TEL', scheduledDate: dateStr, status: 'REALISE', notes: 'Confirmation du virement pour la semaine prochaine' }
    ],

    // 14. Fiches Clients & CRM
    clients_directory: [
      { id: 'CLI-01', name: 'Poulina Group Holding', email: 'contact@poulina.com.tn', phone: '+216 71 130 000', sector: 'Agro-alimentaire & Distribution', status: 'Active', category: 'Local' },
      { id: 'CLI-02', name: 'Société du Sahel Distribution', email: 'achats@sahel-distribution.tn', phone: '+216 73 300 210', sector: 'Distribution Matériaux', status: 'Active', category: 'Local' }
    ],
    client_credit_limits: [
      { id: 'CRE-CLI-01', clientId: 'CLI-02', clientName: 'Société du Sahel Distribution', creditLimitTnd: 50000, currentOutstandingTnd: 11662, remainingCreditTnd: 38338, status: 'AUTORISE' }
    ],

    // 15. Caisse Intelligente (POS)
    pos_sessions: [
      { id: 'POS-SESS-104', registerName: 'Caisse #1 Showroom Tunis', cashierName: 'Mounir Karray', openingBalanceTnd: 350, currentCashTnd: 10465, status: 'OPEN', openedAt: now }
    ],
    pos_receipts: [
      { id: 'POS-REC-104', ticketNumber: 'TK-2026-0104', totalTtc: 10115, paymentMethod: 'ESPECES', itemsCount: 1, cashierName: 'Mounir Karray', timestamp: now }
    ],
    cash_drawer_logs: [
      { id: 'LOG-POS-01', sessionId: 'POS-SESS-104', actionType: 'FOND_DE_CAISSE_INITIAL', amountTnd: 350, note: 'Ouverture de caisse matinée', timestamp: now }
    ],

    // 16. Portail Client Extérieur
    client_portal_users: [
      { id: 'PORT-USR-01', clientName: 'Société du Sahel Distribution', userEmail: 'achats@sahel-distribution.tn', role: 'Acheteur Agréé', status: 'ACTIF', lastLoginAt: now }
    ],
    portal_order_requests: [
      { id: 'PORT-ORD-881', requestNumber: 'PORT-2026-881', clientName: 'Société du Sahel Distribution', itemsCount: 4, totalEstimatedTtc: 11662, status: 'CONVERTED_TO_INVOICE' }
    ],

    // 17. Rapports Terrain & Hebdo
    field_visit_reports: [
      { id: 'REP-VIS-01', agentName: 'Sami Cherif', clientName: 'Établissements Trabelsi Sousse', visitPurpose: 'Proprosition Nouveaux Produits Finition', outcome: 'Commande Conclue', reportDate: dateStr }
    ],
    survey_responses: [
      { id: 'SURV-01', clientName: 'Société du Sahel Distribution', satisfactionScore: 9, deliverySpeedRating: 'Excellente', feedbackComment: 'Service de livraison multi-dépôt très fluide.' }
    ],

    // 18. Hub de Communication
    marketing_campaigns: [
      { id: 'CAMP-2026-03', title: 'Offre Spéciale Peinture & BTP Été 2026', channel: 'EMAIL_AND_SMS', targetCount: 450, sentCount: 450, openRatePercentage: 42.8, status: 'TERMINE' }
    ],
    communication_threads: [
      { id: 'COMM-881', threadSubject: 'Suivi de commande #FAC-2026-0881', clientEmail: 'achats@sahel-distribution.tn', messagesCount: 3, lastUpdated: now }
    ],

    // 19. Suivi des Réclamations & SAV
    support_tickets: [
      { id: 'TCK-SAV-012', ticketNumber: 'SAV-2026-012', clientName: 'Grands Travaux du Sud - GTS', issueCategory: 'Retard de Livraison partiel', priority: 'HAUTE', status: 'EN_COURS_TRAITEMENT', assignedTo: 'Responsable Logistique' }
    ],
    merchandise_returns: [
      { id: 'RMA-2026-004', rmaRef: 'RMA-2026-004', clientName: 'Société du Sahel Distribution', itemSku: 'PEI-SAT', returnedQty: 2, conditionStatus: 'EMBALLAGE_ENDOMMAGE', refundStatus: 'AVOIR_GENERE' }
    ],

    // 20. E-Boutique & Storefront (SaaS E-Commerce)
    ecommerce_products: [
      { id: 'ECOMM-PROD-01', sku: 'PEI-SAT', title: 'Peinture Satino-Vinylique Blanche 15L - Spéciale Façade', webPriceTnd: 85.00, isFeatured: true, stockStatus: 'EN_STOCK' },
      { id: 'ECOMM-PROD-02', sku: 'ROB-LAI', title: 'Robinet Mélangeur Évier Laiton Chromé SOPAL', webPriceTnd: 65.00, isFeatured: true, stockStatus: 'EN_STOCK' }
    ],
    store_categories: [
      { id: 'STORE-CAT-01', title: 'Outillage & Sanitaire Pro', slug: 'outillage-sanitaire', activeItemsCount: 15 }
    ],
    web_orders: [
      { id: 'WEB-ORD-881', webOrderRef: 'WEB-2026-881', customerEmail: 'achats@sahel-distribution.tn', grandTotalTnd: 11662, paymentStatus: 'PAYE_EN_LIGNE', orderStatus: 'EN_COURS_DE_LIVRAISON' }
    ],
    abandoned_carts: [
      { id: 'CART-AB-01', sessionIp: '197.28.12.90', customerEmail: 'prospect.btp@gmail.com', itemsCount: 3, cartValueTnd: 420.00, abandonedAt: now }
    ],
    store_shipping_zones: [
      { id: 'ZONE-TUNISIA-ALL', zoneName: 'Toute la Tunisie (Grand Tunis, Sahel, Sfax & Sud)', baseShippingCostTnd: 15.00, freeShippingThresholdTnd: 500.00 }
    ],
    payment_gateway_configs: [
      { id: 'PAY-GW-CLICKTOPAY', providerName: 'ClicToPay SMT Tunisie', currency: 'TND', isTestMode: false, isEnabled: true }
    ],

    // 21. Comptabilité Générale & Trésorerie
    accounting_journals: [
      { id: 'JRN-VT', code: 'VT', name: 'Journal des Ventes', type: 'VENTES' },
      { id: 'JRN-AC', code: 'AC', name: 'Journal des Achats', type: 'ACHATS' },
      { id: 'JRN-BQ', code: 'BQ', name: 'Journal de Banque (BIAT)', type: 'BANQUE' },
      { id: 'JRN-CA', code: 'CA', name: 'Journal de Caisse Showroom', type: 'CAISSE' }
    ],
    general_ledger: [
      { id: 'GL-411000', accountCode: '411000', accountLabel: 'Clients - Ventes de Biens et Services', totalDebit: 48200, totalCredit: 24500, balance: 23700 }
    ],
    journal_entries: [
      { id: 'ECR-VT-2026-0881', journalCode: 'VT', entryDate: dateStr, label: 'Facture N° FAC-2026-0881 - Sahel Distribution', debit: 11662, credit: 11662, status: 'COMPTABILISE' }
    ],
    bank_reconciliations: [
      { id: 'REC-BQ-2026-07', bankAccount: 'BIAT - Compte Courant 080001290381', statementDate: dateStr, bookBalanceTnd: 142500, bankStatementBalanceTnd: 142500, isReconciled: true }
    ],

    // 22. Intégration TEJ (CIMF)
    tej_certificates: [
      { id: 'TEJ-RS-2026-041', certificateNumber: 'RS-2026-00041', vendorTaxId: '0001890/A/P/000', vendorName: 'Les Ciments de Bizerte', grossAmountTnd: 14200, withholdingRatePercentage: 1.5, withholdingAmountTnd: 213, qrcCodeData: 'https://tej.tn/qrc/RS-2026-00041', status: 'VALIDATED_CIMF' }
    ],
    qrc_tax_records: [
      { id: 'QRC-REC-01', certificateRef: 'RS-2026-00041', digitalSignatureHash: 'a8f9c12b7e88901a23c45d6e7f8a9b0c', verifiedByCimf: true }
    ],
    tej_teletransmissions: [
      { id: 'TEJ-TEL-2026-Q2', submissionBatchRef: 'BATCH-TEJ-2026-Q2', totalCertificatesCount: 14, totalWithholdingTnd: 3850, transmissionStatus: 'ACCEPTE_SANS_ANOMALIE', transmissionDate: '2026-07-15' }
    ],

    // 23. Espace Expert-Comptable
    accountant_client_files: [
      { id: 'ACC-FILE-01', companyName: 'Elyssa ERP - Société Inter-Affaires S.A.', taxRegistrationNumber: '1234567/A/M/000', fiscalYear: 2026, closureMonth: 12, auditStatus: 'A_JOUR' }
    ],
    batch_fiscal_filings: [
      { id: 'BATCH-FISCAL-2026-07', declarationType: 'Déclaration Mensuelle d Impôts (DMI)', monthPeriod: '2026-07', status: 'PAYE_ET_TELETRANSMIS', totalTaxPaidTnd: 8450 }
    ],

    // 24. Trésorerie, Effets & Chèques
    treasury_checks: [
      { id: 'CHK-2026-901', checkNumber: 'CH-9081234', bankName: 'STB - Société Tunisienne de Banque', drawerName: 'Société du Sahel Distribution', amountTnd: 11662, dueDate: dateStr, status: 'A_ENCAISSER' }
    ],
    treasury_effects: [
      { id: 'EFF-2026-402', effectNumber: 'TR-881234', bankName: 'Attijari Bank', acceptorName: 'Grands Travaux du Sud - GTS', amountTnd: 24850, maturityDate: '2026-09-30', status: 'PORTFEUILLE' }
    ],
    cash_forecasts: [
      { id: 'FCST-2026-W34', weekPeriod: 'Semaine 34 - 2026', expectedInflowsTnd: 85000, expectedOutflowsTnd: 42000, netForecastCashTnd: 43000 }
    ],

    // 25. Immobilisations & Amortissements
    fixed_assets: [
      { id: 'AST-CAMION-01', assetCode: 'IMM-2022-004', designation: 'Camion Isuzu D-Max Poids Lourd', acquisitionDate: '2022-03-01', acquisitionCostTnd: 85000, depreciationMethod: 'LINEAIRE', durationYears: 5, accumulatedDepreciationTnd: 59500, netBookValueTnd: 25500 },
      { id: 'AST-LOG-01', assetCode: 'IMM-2024-001', designation: 'Serveurs & Infrastructure Cloud Elyssa', acquisitionDate: '2024-01-10', acquisitionCostTnd: 32000, depreciationMethod: 'DEGRESSIF', durationYears: 3, accumulatedDepreciationTnd: 21333, netBookValueTnd: 10667 }
    ],
    depreciation_schedules: [
      { id: 'SCHED-AST-CAMION-01', assetCode: 'IMM-2022-004', fiscalYear: 2026, annuityTnd: 17000, startBookValueTnd: 42500, endBookValueTnd: 25500 }
    ],
    asset_disposals: [
      { id: 'DISP-AST-2025-01', assetCode: 'IMM-2018-002', designation: 'Ancien Fourgon Citroën Berlingo', disposalDate: '2025-11-20', salePriceTnd: 12000, netBookValueTnd: 0, capitalGainTnd: 12000 }
    ],

    // 26. Bourse & Investissements
    security_portfolio: [
      { id: 'SEC-01', titleName: 'SICAV Rendement BIAT', quantity: 250, purchaseUnitPriceTnd: 100.00, currentMarketPriceTnd: 108.50, totalValuationTnd: 27125, unrealizedGainTnd: 2125 }
    ],
    dividend_records: [
      { id: 'DIV-2026-01', securityName: 'SICAV Rendement BIAT', distributionDate: dateStr, totalDividendPaidTnd: 1250, withholdingTaxTnd: 125 }
    ],

    // 27. Gestion de Parc Auto & Flotte
    fleet_vehicles: [
      { id: 'FLEET-ISUZU-01', vehicleName: 'Camion Isuzu D-Max', plateNumber: 'TN-210-9842', category: 'Utilitaire', mileageKm: 48500, assignedDriver: 'Hamza Ben Salem', status: 'DISPONIBLE' },
      { id: 'FLEET-PARTNER-02', vehicleName: 'Fourgon Peugeot Partner', plateNumber: 'TN-198-4431', category: 'Utilitaire', mileageKm: 22100, assignedDriver: 'Sami Cherif', status: 'DISPONIBLE' }
    ],
    fleet_missions: [
      { id: 'MIS-2026-0881', missionRef: 'OM-2026-0881', driverName: 'Hamza Ben Salem', vehiclePlate: 'TN-210-9842', destinationCity: 'Sousse', departureDate: dateStr, status: 'EN_COURS' }
    ],
    fleet_expenses: [
      { id: 'EXP-FUEL-01', expenseType: 'CARBURANT_AGIL', vehiclePlate: 'TN-210-9842', amountTnd: 180, liters: 82, receiptRef: 'BON-AGIL-90812', date: dateStr }
    ],
    fleet_accidents: [
      { id: 'ACC-2026-01', vehiclePlate: 'TN-198-4431', incidentDate: '2026-05-14', driverName: 'Sami Cherif', description: 'Accrochage rétroviseur sur parking', insuranceClaimStatus: 'INDEMNISE' }
    ],

    // 28. Gestion du Parc d'Actifs & Matériels
    fleet_inventory: [
      { id: 'EQP-TC26-01', itemName: 'Terminal ZEBRA TC26 Tactile Pro', serialReference: 'ZBR-90812-TN', category: 'Matériel Informatique Mobile', status: 'Assigned', assignedTo: 'Hamza Ben Salem' },
      { id: 'EQP-IMPR-02', itemName: 'Imprimante Thermique Portable Bixolon', serialReference: 'BIX-77123-TN', category: 'Périphérique Terrain', status: 'Assigned', assignedTo: 'Hamza Ben Salem' }
    ],
    equipment_maintenance: [
      { id: 'MAINT-01', equipmentId: 'EQP-TC26-01', maintenanceType: 'PREVENTIVE', providerName: 'Zebra Service Tunisia', costTnd: 120, performedAt: dateStr, status: 'CLOTURE' }
    ],

    // 29. GED (Gestion Électronique des Documents)
    ged_documents: [
      { id: 'GED-DOC-01', title: 'Permis de Conduire Poids Lourd - Hamza Ben Salem', category: 'RH_JUSTIFICATIF', fileType: 'PDF', fileSizeKb: 840, uploadedAt: dateStr },
      { id: 'GED-DOC-02', title: 'Carte Grise Camion TN-210-9842', category: 'FLOTTE_LEGAL', fileType: 'PDF', fileSizeKb: 1250, uploadedAt: dateStr }
    ],
    scanned_archives: [
      { id: 'ARCH-01', documentTitle: 'Contrat de Bail Dépôt Central Charguia', boxArchiveRef: 'BOX-2022-A14', scanResolutionDpi: 300, archivedAt: '2022-03-01' }
    ],

    // 30. Module de Suivi des Actes & Cession d'Entreprise
    audit_logs: [
      { id: 'AUD-LOG-01', actorEmail: 'admin@elyssa.pro', action: 'CREATION_ACTE_CESSION', targetEntity: 'Cession Filiale Agro', timestamp: now, ipAddress: '197.28.10.12' }
    ],
    cession_events: [
      { id: 'CES-EVT-01', eventName: 'Audit Dataroom Cession Filiale Sousse', milestoneStatus: 'TERMINE', eventDate: dateStr, leadAuditor: 'Cabinet Tunisie Audit & Conseil' }
    ],
    valuation_metrics: [
      { id: 'VAL-MET-01', valuationModel: 'MULTIPLE_EBITDA', evaluatedEbitdaTnd: 450000, multipleFactor: 6.5, calculatedEnterpriseValueTnd: 2925000, calculatedAt: dateStr }
    ],

    // 31. Secrétariat Juridique & Registre Légal
    legal_minutes: [
      { id: 'PV-AGO-2026', meetingType: 'AGO - Assemblée Générale Ordinaire', meetingDate: '2026-06-15', location: 'Siège Social Elyssa ERP Tunis', quorumPercentage: 100, approvalStatus: 'ADOPTE_A_L_UNANIMITED' }
    ],
    shareholders_registry: [
      { id: 'SHR-01', shareholderName: 'Elyssa Entreprises Holding S.A.', sharesCount: 10000, nominalValueTnd: 100, totalCapitalTnd: 1000000, ownershipPercentage: 100 }
    ],

    // 32. Espace Client & Gestion des Packs SaaS
    client_subscriptions: [
      { id: 'SUB-ELYSSA-ENT', planName: 'Pack Elyssa Enterprise Unlimited 34 Modules', maxUsers: 50, activeLicensesCount: 18, renewalDate: '2027-06-24', status: 'ACTIVE' }
    ],
    tenant_module_permissions: [
      { id: 'PERM-01', moduleId: 'ALL_34_MODULES', accessLevel: 'FULL_READ_WRITE', isEnabled: true }
    ],

    // 33. Tableau de Bord Décisionnel & BI Copilot
    bi_kpi_snapshots: [
      { id: 'KPI-SNAP-01', monthlyRevenueTnd: 148500, grossMarginPercentage: 32.4, activeClientsCount: 42, otifDeliveryPercentage: 94.5, capturedAt: dateStr }
    ],
    ai_insights_logs: [
      { id: 'AI-INS-01', insightCategory: 'OPTIMISATION_STOCKS', recommendationText: 'Le niveau du produit Peinture Satino-Vinylique 15L est sous le seuil critique à Tunis. Suggérer un réapprovisionnement de 50 pots.', confidenceScore: 0.96, generatedAt: now }
    ],

    // 34. Business Plan Stratégique & Opportunités
    bp_projections: [
      { id: 'BP-2027', fiscalYear: 2027, projectedRevenueTnd: 2400000, projectedEbitdaTnd: 580000, plannedRndInvestmentTnd: 180000 }
    ],
    strategic_opportunities: [
      { id: 'OPP-01', opportunityTitle: 'Contrat Cadre BTP Ministère de l Équipement', estimatedValueTnd: 650000, probabilityPercentage: 75, currentStage: 'SOUMISSION_OFFRE_TECHNIQUE' }
    ]
  };
}

/**
 * Returns a dictionary of all demo data records decorated with required metadata
 * { ...record, companyId: tenantId, isDemo: true, is_demo: true, seededAt: new Date().toISOString() }
 */
export function getFlattenedDemoRegistry(tenantId: string): Record<string, any[]> {
  const normalizedTenantId = (tenantId || 'Inter-Affaires').trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const now = new Date().toISOString();
  const rawFixtures = generateRawDemoFixtures();

  const formatted: Record<string, any[]> = {};

  Object.keys(rawFixtures).forEach(colName => {
    formatted[colName] = rawFixtures[colName].map(item => ({
      ...item,
      companyId: normalizedTenantId,
      company_id: normalizedTenantId,
      isDemo: true,
      is_demo: true,
      seededAt: now
    }));
  });

  // Alias Mappings for full backward compatibility across all modules
  formatted.clients = formatted.clients_directory;
  formatted.products = formatted.inventory_items;
  formatted.employees = formatted.collaborators;
  formatted.nomenclatures = formatted.production_boms;
  formatted.manufacturingOrders = formatted.manufacturing_orders;
  formatted.purchaseRequisitions = formatted.purchase_requests;
  formatted.purchaseOrders = formatted.purchase_orders;
  formatted.assets = formatted.fixed_assets;
  formatted.vehicles = formatted.fleet_vehicles;
  formatted.missions = formatted.fleet_missions;
  formatted.expenses = formatted.fleet_expenses;
  formatted.incidents = formatted.fleet_accidents;
  formatted.importFolders = formatted.transit_folders;
  formatted.transit_dossiers = formatted.transit_folders;
  formatted.cheques_effects = formatted.treasury_checks;
  formatted.bank_transactions = formatted.journal_entries;
  formatted.caisse_transactions = formatted.pos_receipts;

  return formatted;
}

/**
 * Seeding direct sur Firestore client pour l'ensemble des 34 modules
 */
export async function seedAllDemoModulesToFirestore(tenantId: string): Promise<Record<string, number>> {
  const companyId = (tenantId || 'Inter-Affaires').trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fullData = getFlattenedDemoRegistry(companyId);
  const report: Record<string, number> = {};

  if (!db) {
    console.warn('[seedAllDemoModulesToFirestore] Firestore DB instance non initialisée.');
    return report;
  }

  for (const colName of Object.keys(fullData)) {
    const items = fullData[colName];
    if (!items || items.length === 0) continue;

    try {
      // Chunk writes by 400 documents
      for (let i = 0; i < items.length; i += 400) {
        const chunk = items.slice(i, i + 400);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const docId = String(item.id || `demo-${colName}-${Math.random().toString(36).substring(2, 9)}`);
          const tenantSubDocRef = doc(db, 'company_erp_data', companyId, colName, docId);
          batch.set(tenantSubDocRef, item, { merge: true });

          // If top-level collection exists for mobile or HR, also seed top-level
          if (['collaborators', 'mobile_devices', 'field_sessions', 'fleet_inventory', 'attendance_logs', 'mpo_contracts', 'performance_contracts'].includes(colName)) {
            const rootDocRef = doc(db, colName, docId);
            batch.set(rootDocRef, item, { merge: true });
          }
        });

        await batch.commit();
      }

      report[colName] = items.length;
    } catch (err) {
      console.warn(`[seedAllDemoModulesToFirestore] Erreur lors de l'écriture pour ${colName}:`, err);
    }
  }

  // Update parent tenant metadata
  try {
    const tenantDocRef = doc(db, 'company_erp_data', companyId);
    await setDoc(tenantDocRef, {
      hasLoadedTrialDemo: true,
      demoPurged: false,
      isPurged: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {}

  return report;
}
