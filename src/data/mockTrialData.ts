/**
 * Elyssa ERP - Jeux de Données Démo Spécialisés pour le Mode Essai (Trial)
 * 
 * Contient les fixtures démo pour les modules en mode essai :
 * 1. Pointage & Présence (5 entrées horodatées du jour pour les 5 salariés RH)
 * 2. Flotte & MDM (2 terminaux mobiles configurés : PDA Zebra & Tablette Samsung)
 * 3. Préparations & WMS (3 bons de picking avec statuts et articles)
 * 4. Trésorerie & Portefeuille (3 chèques en coffre et 2 traites)
 * 5. Espace Expert-Comptable (3 dossiers clients d'exemple avec statut fiscal/TEJ)
 */

import { AttendanceRecord } from '../components/AttendanceManager';
import { FleetInventoryItem, MobileDevice, PickingOrder, FieldSession, MobileOrder, ChantierReport, FieldAgentLicense, TenantSubscription } from '../types/mobileTerrain';
import { ClientDossier, CabinetDocument } from '../components/AccountantPortal';
import { AdminSettings } from '../types';

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// ==========================================
// 0. PARAMÈTRES FISCAUX ET IDENTITÉ TENANT "MD" (Mode Démo / Essai)
// ==========================================
export const TRIAL_MD_COMPANY_SETTINGS: Partial<AdminSettings> = {
  companyName: "MD",
  legalForm: "SARL",
  shareCapital: 100000,
  rneNumber: "1458932/A",
  companyMF: "1458932/A/M/000",
  legalRepresentative: "Meriam Doudou",
  companyAddress: "Rue du Lac Windermere, Les Berges du Lac 2, Tunis 1053",
  cityZipCode: "Tunis 1053",
  companyPhone: "+216 71 862 100",
  companyEmail: "contact@md-commerce.tn",
  website: "https://md-commerce.tn"
};

// ==========================================
// 0b. LICENCES MOBILE TERRAIN (7 Collaborateurs Réels du Tenant MD)
// ==========================================
export const TRIAL_FIELD_AGENT_LICENSES: (FieldAgentLicense & { specializationBadge?: string })[] = [
  {
    agentId: 'demo-emp_1',
    agentName: 'Meriam Doudou',
    email: 'm.doudou@elyssa-erp.tn',
    role: 'Gérante / Direction Générale',
    department: 'Direction Générale',
    hasMobileLicense: false,
    specializationBadge: 'Direction Générale'
  },
  {
    agentId: 'demo-emp_2',
    agentName: 'Khaled Ben Amor',
    email: 'k.benamor@elyssa-erp.tn',
    role: 'Directeur Financier',
    department: 'Finance & Comptabilité',
    hasMobileLicense: false,
    specializationBadge: 'Finance'
  },
  {
    agentId: 'demo-emp_3',
    agentName: 'Ines Dridi',
    email: 'i.dridi@elyssa-erp.tn',
    role: 'Responsable Rapprochement',
    department: 'Finance & Trésorerie',
    hasMobileLicense: false,
    specializationBadge: 'Trésorerie'
  },
  {
    agentId: 'demo-emp_4',
    agentName: 'Mohamed Ali Gharbi',
    email: 'm.gharbi@elyssa-erp.tn',
    role: 'Chargé Clientèle / Ventes',
    department: 'Ventes & Commercial',
    hasMobileLicense: true,
    assignedAt: '2026-01-15',
    lastMobileSync: '2026-08-20 10:35',
    specializationBadge: 'Force de Vente / Van Sales'
  },
  {
    agentId: 'demo-emp_5',
    agentName: 'Amel Ben Soltane',
    email: 'a.bensoltane@elyssa-erp.tn',
    role: 'Responsable RH',
    department: 'Ressources Humaines',
    hasMobileLicense: false,
    specializationBadge: 'Ressources Humaines'
  },
  {
    agentId: 'demo-emp_6',
    agentName: 'Sami Mansour',
    email: 's.mansour@elyssa-erp.tn',
    role: 'Développeur Principal',
    department: 'Direction & IT',
    hasMobileLicense: false,
    specializationBadge: 'IT & Systèmes'
  },
  {
    agentId: 'demo-emp_7',
    agentName: 'Hamza Ben Salem',
    email: 'h.bensalem@elyssa-erp.tn',
    role: 'Chauffeur Livreur / Logistique',
    department: 'Logistique & Transport',
    hasMobileLicense: true,
    assignedAt: '2026-02-10',
    lastMobileSync: '2026-08-20 10:28',
    specializationBadge: 'Logistique & Expéditions'
  }
];

export const TRIAL_TENANT_SUBSCRIPTION: TenantSubscription = {
  tenantId: 'MD',
  plan: 'TRIAL',
  activeModules: [
    'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', 
    'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10', 'MOD-11'
  ],
  quotas: {
    maxUsers: 25,
    maxFieldAgents: 5, // 5 licences terrain en mode essai (2 actives = 40%)
    monthlyBiometricVerifications: 500
  },
  addOnPricing: {
    mobileFleetActive: true,
    pricePerExtraFieldAgent: 39
  }
};

// ==========================================
// 1. POINTAGE & PRÉSENCE (7 Salariés)
// ==========================================
export const TRIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-canonical-emp_0',
    employeeId: 'demo-emp_0',
    employeeName: 'Meriam Doudou',
    jobTitle: 'Gérante / Direction Générale',
    date: getTodayDate(),
    clockIn: '07:50',
    clockOut: '18:30',
    location: 'Elyssa HQ - Direction Générale, Tunis',
    status: 'Present',
    overtimeHours: 1.0,
    notes: 'Badgeage biométrique Direction Générale',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_1',
    employeeId: 'demo-emp_1',
    employeeName: 'Khaled Ben Amor',
    jobTitle: 'Directeur Financier & Recouvrement',
    date: getTodayDate(),
    clockIn: '08:00',
    clockOut: '17:30',
    location: 'Elyssa HQ - Direction Financière, Tunis',
    status: 'Present',
    overtimeHours: 0.5,
    notes: 'Pointage terminal biométrique principal',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_2',
    employeeId: 'demo-emp_2',
    employeeName: 'Ines Dridi',
    jobTitle: 'Responsable Rapprochement',
    date: getTodayDate(),
    clockIn: '08:15',
    clockOut: '17:00',
    location: 'Elyssa HQ - Service Rapprochement, Tunis',
    status: 'Late',
    overtimeHours: 0,
    notes: 'Retard de 15 minutes justifié (embouteillage GP9 - anomalie simulée)',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_3',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi',
    jobTitle: 'Chargé Clientèle / Ventes',
    date: getTodayDate(),
    clockIn: '07:55',
    clockOut: '18:15',
    location: 'En Clientèle / Déplacement Terrain (Tunis & Banlieue)',
    status: 'Present',
    overtimeHours: 1.25,
    notes: 'Pointage mobile géolocalisé via Tablette Commerciale',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_4',
    employeeId: 'demo-emp_4',
    employeeName: 'Amel Ben Soltane',
    jobTitle: 'Responsable Ressources Humaines',
    date: getTodayDate(),
    clockIn: '08:02',
    clockOut: '17:05',
    location: 'Elyssa HQ - Direction RH, Tunis',
    status: 'Present',
    overtimeHours: 0,
    notes: 'Badgeage badge virtuel NFC',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_5',
    employeeId: 'demo-emp_5',
    employeeName: 'Sami Mansour',
    jobTitle: 'Développeur ERP Principal',
    date: getTodayDate(),
    clockIn: '07:58',
    clockOut: '17:45',
    location: 'Télétravail / Home Office & IT Lab',
    status: 'Present',
    overtimeHours: 0.75,
    notes: 'Pointage portail web collaborateur',
    isApproved: true
  },
  {
    id: 'att-canonical-emp_6',
    employeeId: 'demo-emp_6',
    employeeName: 'Hamza Ben Salem',
    jobTitle: 'Chauffeur Livreur / Logistique',
    date: getTodayDate(),
    clockIn: '07:45',
    clockOut: '16:30',
    location: 'Dépôt & Hub Logistique / En Tournée Express',
    status: 'Present',
    overtimeHours: 0.5,
    notes: 'Pointage terminal mobile durci Zebra TC57',
    isApproved: true
  }
];

// ==========================================
// 2. FLOTTE & PARC D'ACTIFS (4 Actifs Démo : 2 Terminaux + 1 Serveur IT + 1 Ligne Industrielle)
// ==========================================
export const TRIAL_FLEET_INVENTORY: FleetInventoryItem[] = [
  {
    id: 'trial-fleet-dev-1',
    tenantId: 'Inter-Affaires',
    category: 'Terminal Mobile',
    fleet_park: 'Flotte Commerciale & Vente',
    device_name: 'Samsung Galaxy Tab Active 4 Pro',
    serial_reference: 'SAM-TAB4-TN-00345',
    status: 'Assigned',
    assignedTo: 'Mohamed Ali Gharbi',
    assignedDriver: 'Mohamed Ali Gharbi',
    registeredAt: '2026-01-15',
    mileage: 0,
    maxPayloadKg: 0,
    acquisitionCost: 1850.000,
    sceAccount: '222',
    immobCode: 'IMM-2026-008',
    location: 'Flotte Commerciale & Vente'
  },
  {
    id: 'trial-fleet-dev-2',
    tenantId: 'Inter-Affaires',
    category: 'Terminal Mobile',
    fleet_park: 'Flotte Logistique',
    device_name: 'Zebra TC57 Touch Computer',
    serial_reference: 'ZEB-TC57-TN-00812',
    status: 'Assigned',
    assignedTo: 'Hamza Ben Salem',
    assignedDriver: 'Hamza Ben Salem',
    registeredAt: '2026-02-10',
    mileage: 0,
    maxPayloadKg: 0,
    acquisitionCost: 2400.000,
    sceAccount: '222',
    immobCode: 'IMM-2026-009',
    location: 'Flotte Logistique'
  },
  {
    id: 'trial-fleet-srv-3',
    tenantId: 'Inter-Affaires',
    category: 'Infrastructure IT',
    fleet_park: 'Parc Siège & IT',
    device_name: 'Serveurs Dell PowerEdge & Baie SAN',
    serial_reference: 'SRV-DELL-PE-SAN-2025',
    status: 'Assigned',
    assignedTo: 'Sami Mansour (DSI)',
    assignedDriver: 'Sami Mansour (DSI)',
    registeredAt: '2025-01-20',
    mileage: 0,
    maxPayloadKg: 0,
    acquisitionCost: 28500.000,
    sceAccount: '222',
    immobCode: 'IMM-2025-001',
    location: 'Siège Tunis Charguia'
  },
  {
    id: 'trial-fleet-mach-4',
    tenantId: 'Inter-Affaires',
    category: 'Machine Industrielle / GPAO',
    fleet_park: 'Parc Industriel Usine',
    device_name: 'Ligne de Conditionnement Semi-Automatique',
    serial_reference: 'LCOND-GPAO-TUNIS-01',
    status: 'Assigned',
    assignedTo: 'Chef d\'Atelier',
    assignedDriver: 'Chef d\'Atelier',
    registeredAt: '2023-09-15',
    mileage: 0,
    maxPayloadKg: 0,
    acquisitionCost: 145000.000,
    sceAccount: '223',
    immobCode: 'IMM-2023-004',
    location: 'Atelier Usine Tunis'
  }
];

export const TRIAL_MOBILE_DEVICES: MobileDevice[] = [
  {
    id: 'trial-fleet-dev-1',
    tenantId: 'Inter-Affaires',
    agentId: 'demo-emp_4',
    agentName: 'Mohamed Ali Gharbi',
    deviceModel: 'Samsung Galaxy Tab Active 4 Pro',
    assigned_module: 'vente',
    imeiOrUuid: '359102847102988',
    lastSync: `${getTodayDate()}T09:15:00`,
    status: 'ACTIVE',
    batteryLevel: 94,
    appVersion: 'v2.4.0-pro',
    macAddress: 'A4:C3:F0:12:34:56',
    phoneNumber: '+216 23 700 800'
  },
  {
    id: 'trial-fleet-dev-2',
    tenantId: 'Inter-Affaires',
    agentId: 'demo-emp_7',
    agentName: 'Hamza Ben Salem',
    deviceModel: 'Zebra TC57 Touch Computer',
    assigned_module: 'livraison',
    imeiOrUuid: '358291048592077',
    lastSync: `${getTodayDate()}T08:30:00`,
    status: 'ACTIVE',
    batteryLevel: 88,
    appVersion: 'v2.4.0-pro',
    macAddress: '70:3A:51:B2:89:10',
    phoneNumber: '+216 29 881 200'
  }
];

// ==========================================
// 2b. SESSIONS TERRAIN ACTIVES (1 Session Démo Active Hamza Ben Salem Ben Arous / Radès + 1 Vente)
// ==========================================
export const TRIAL_FIELD_SESSIONS: FieldSession[] = [
  {
    id: 'trial-sess-02',
    tenantId: 'Inter-Affaires',
    agentId: 'demo-emp_7',
    agentName: 'Hamza Ben Salem',
    type: 'CHANTIER',
    vehicleId: 'demo-v_2',
    checkIn: {
      timestamp: `${getTodayDate()}T07:45:00`,
      lat: 36.7538,
      lng: 10.2289,
      address: 'Z.I. Ben Arous / Radès Port (Tournée Ben Arous / Radès)',
      geofenceValid: true,
      verificationMode: 'CHANTIER'
    },
    status: 'OPEN',
    notes: 'Tournée Ben Arous / Radès - Expéditions et livraisons logistiques programmées.'
  },
  {
    id: 'trial-sess-01',
    tenantId: 'Inter-Affaires',
    agentId: 'demo-emp_4',
    agentName: 'Mohamed Ali Gharbi',
    type: 'VAN_SALES',
    vehicleId: 'demo-v_3',
    checkIn: {
      timestamp: `${getTodayDate()}T08:15:00`,
      lat: 36.8065,
      lng: 10.1815,
      address: 'Grand Tunis (Vente & Prospection Commerciale)',
      geofenceValid: true,
      verificationMode: 'VAN_SALES'
    },
    status: 'OPEN',
    notes: 'Tournée de prospection et vente directe Grand Tunis.'
  }
];

// ==========================================
// 2c. COMMANDES OFFLINE (1 Validée + 1 En attente)
// ==========================================
export const TRIAL_MOBILE_ORDERS: MobileOrder[] = [
  {
    id: 'trial-ord-01',
    tenantId: 'Inter-Affaires',
    localUuid: 'UUID-OFFLINE-ORD-101',
    agentId: 'demo-emp_4',
    agentName: 'Mohamed Ali Gharbi',
    clientId: 'cli-001',
    clientName: 'SOCIÉTÉ TUNISIENNE DE CONSTRUCTION (STC)',
    items: [
      { articleId: 'p1', label: 'Bonde de douche sortie verticale D90', qty: 10, unitPrice: 28.500, total: 285.000, productName: 'Bonde de douche sortie verticale D90', quantity: 10, unitPriceHT: 28.500 }
    ],
    totalHT: 285.000,
    totalTTC: 339.150,
    paymentStatus: 'PAID',
    paymentMethod: 'CHECK',
    status: 'VALIDATED',
    createdAt: `${getTodayDate()}T09:10:00`
  },
  {
    id: 'trial-ord-02',
    tenantId: 'Inter-Affaires',
    localUuid: 'UUID-OFFLINE-ORD-102',
    agentId: 'demo-emp_4',
    agentName: 'Mohamed Ali Gharbi',
    clientId: 'cli-002',
    clientName: 'Quincaillerie Générale de l\'Ariana',
    items: [
      { articleId: 'p2', label: 'Siphon de sol inox brossé 15x15cm', qty: 8, unitPrice: 42.000, total: 336.000, productName: 'Siphon de sol inox brossé 15x15cm', quantity: 8, unitPriceHT: 42.000 }
    ],
    totalHT: 336.000,
    totalTTC: 399.840,
    paymentStatus: 'PENDING',
    paymentMethod: 'CASH',
    status: 'PENDING_VALIDATION',
    createdAt: `${getTodayDate()}T10:15:00`
  }
];

// ==========================================
// 2d. RAPPORTS DE CHANTIER / TOURNÉE (1 Rapport Démo)
// ==========================================
export const TRIAL_CHANTIER_REPORTS: ChantierReport[] = [
  {
    id: 'trial-rep-01',
    tenantId: 'Inter-Affaires',
    chantierId: 'TOUR-DEPOT-01',
    chantierName: 'Tournée Dépôt & Hub Charguia II / Expéditions Nord',
    chefChantierId: 'demo-emp_7',
    chefChantierName: 'Hamza Ben Salem',
    date: '2026-08-20T10:20:00',
    workersPresent: 3,
    materialsConsumed: [
      { articleId: 'p1', articleName: 'Bonde de douche sortie verticale D90', qty: 12, unit: 'pcs' }
    ],
    photoUrls: [],
    notes: 'Tournée matinale exécutée conformément au planning. 12 colis livrés, bon d\'émargement numérisé sans réserve.',
    status: 'PENDING'
  }
];

// ==========================================
// 3. PRÉPARATIONS & PICKING (3 Bons de Picking)
// ==========================================
export const TRIAL_PICKING_ORDERS: PickingOrder[] = [
  {
    id: 'trial-pick-1',
    orderId: 'CMD-2026-101',
    tenantId: 'Inter-Affaires',
    clientName: 'Poulina Group Holding',
    deliveryAddress: 'Zone Industrielle Megrine, Ben Arous',
    warehouseId: 'wh_charguia',
    warehouseName: 'Entrepôt Central - Charguia II',
    dockNumber: 'Quai 1 (Expédition Nord)',
    status: 'en_cours',
    createdAt: getTodayDate() + ' 08:30',
    preparedAt: undefined,
    preparedBy: 'Saber H. (Chef Magasinier)',
    notes: 'Priorité Haute - Livraison urgente avant 14h',
    items: [
      { productId: 'p1', productName: 'Bonde de douche sortie verticale D90', quantity: 25, warehouseName: 'Charguia II', unitPrice: 28.500 },
      { productId: 'p2', productName: 'Siphon de sol inox brossé 15x15cm', quantity: 15, warehouseName: 'Charguia II', unitPrice: 42.000 },
      { productId: 'p3', productName: 'Mitigeur lavabo chromé céramique', quantity: 10, warehouseName: 'Charguia II', unitPrice: 135.000 }
    ],
    totalAmountTTC: 2697.500
  },
  {
    id: 'trial-pick-2',
    orderId: 'CMD-2026-102',
    tenantId: 'Inter-Affaires',
    clientName: 'SOPAL S.A.',
    deliveryAddress: 'Zone Industrielle Poudrière 2, Sfax',
    warehouseId: 'wh_sfax',
    warehouseName: 'Dépôt Régional - Sfax',
    dockNumber: 'Quai 2 (Colisage Régional)',
    status: 'en_attente',
    createdAt: getTodayDate() + ' 09:15',
    preparedAt: undefined,
    preparedBy: 'Mehdi B. (Préparateur)',
    notes: 'En attente de consolidation quai',
    items: [
      { productId: 'p4', productName: 'Robinet flotteur silencieux 3/8"', quantity: 40, warehouseName: 'Sfax', unitPrice: 18.200 },
      { productId: 'p5', productName: 'Mécanisme WC double poussoir à câble', quantity: 30, warehouseName: 'Sfax', unitPrice: 34.000 }
    ],
    totalAmountTTC: 2080.000
  },
  {
    id: 'trial-pick-3',
    orderId: 'CMD-2026-103',
    tenantId: 'Inter-Affaires',
    clientName: 'Société Chimique Alkimia',
    deliveryAddress: 'Zone Portuaire Gabès',
    warehouseId: 'wh_charguia',
    warehouseName: 'Entrepôt Central - Charguia II',
    dockNumber: 'Quai 3 (Départ Sud)',
    status: 'pret_chargement',
    createdAt: getTodayDate() + ' 07:45',
    preparedAt: getTodayDate() + ' 10:15',
    preparedBy: 'Saber H. (Chef Magasinier)',
    notes: 'Contrôlé et palettisé - Prêt au chargement camion',
    items: [
      { productId: 'p6', productName: 'Tube PVC pression PN16 D63 (barre 4m)', quantity: 50, warehouseName: 'Charguia II', unitPrice: 48.000 },
      { productId: 'p7', productName: 'Vanne à boisseau sphérique PVC D63', quantity: 12, warehouseName: 'Charguia II', unitPrice: 75.000 }
    ],
    totalAmountTTC: 3927.000
  }
];

// ==========================================
// 4. TRÉSORERIE : 3 CHÈQUES & 2 TRAITES EN COFFRE
// ==========================================
export interface TrialTreasuryItem {
  id: string;
  type: 'Chèque reçu' | 'Chèque émis' | 'Traite reçue' | 'Traite émise';
  referenceNumber: string;
  bankName: string;
  dueDate: string;
  drawerName: string;
  amount: number;
  status: 'En coffre' | 'Remis à l\'encaissement' | 'Payé / Honoré' | 'Impayé / Rejeté';
  notes?: string;
}

export const TRIAL_TREASURY_ITEMS: TrialTreasuryItem[] = [
  // 3 Chèques en coffre
  {
    id: 'trial-chq-1',
    type: 'Chèque reçu',
    referenceNumber: 'CHQ-BIAT-884920',
    bankName: 'BIAT',
    dueDate: '2026-07-15',
    drawerName: 'Poulina Group Holding',
    amount: 14500.000,
    status: 'En coffre',
    notes: 'Règlement Facture FA-2026-088 - En attente date d\'échéance'
  },
  {
    id: 'trial-chq-2',
    type: 'Chèque reçu',
    referenceNumber: 'CHQ-ATB-194022',
    bankName: 'ATB',
    dueDate: '2026-07-20',
    drawerName: 'SOPAL S.A.',
    amount: 8250.000,
    status: 'En coffre',
    notes: 'Acompte Commande CMD-2026-102 - Consigné au coffre'
  },
  {
    id: 'trial-chq-3',
    type: 'Chèque émis',
    referenceNumber: 'CHQ-STB-004921',
    bankName: 'STB',
    dueDate: '2026-06-30',
    drawerName: 'STEG S.A. (Bénéficiaire)',
    amount: 2340.000,
    status: 'En coffre',
    notes: 'Paiement redevance haute tension trimestrielle - À remettre'
  },
  // 2 Traites (LCN) en coffre
  {
    id: 'trial-trt-1',
    type: 'Traite reçue',
    referenceNumber: 'TRT-UBCI-99201',
    bankName: 'UBCI',
    dueDate: '2026-08-31',
    drawerName: 'Société Chimique Alkimia',
    amount: 28000.000,
    status: 'En coffre',
    notes: 'LCN 90 jours fin de mois - Domiciliation bancaire UBCI Charguia'
  },
  {
    id: 'trial-trt-2',
    type: 'Traite émise',
    referenceNumber: 'TRT-BH-77491',
    bankName: 'BH Bank',
    dueDate: '2026-07-31',
    drawerName: 'Fournisseur Tunisie Plastiques (Bénéficiaire)',
    amount: 11200.000,
    status: 'En coffre',
    notes: 'Effet de commerce à payer - Acceptée et signée'
  }
];

// ==========================================
// 5. ESPACE EXPERT-COMPTABLE (3 Dossiers Clients)
// ==========================================
export const TRIAL_ACCOUNTANT_DOSSIERS: ClientDossier[] = [
  {
    id: 'trial-dossier-1',
    name: 'Société Franco-Tunisienne d\'Électronique (SFE S.A.R.L)',
    mf: '0482910/A/M/000',
    tenant_id: 'tenant_sfe_demo',
    legalForm: 'SARL',
    sector: 'Industrie & Composants Électroniques',
    fiscalYear: '2026',
    unprocessedDocs: 2,
    tejStatus: 'validated',
    cnssStatus: 'validated',
    tvaG50Status: 'validated',
    quarterlyRevenue: 345000.000,
    lastSyncDate: getTodayDate() + ' 09:30'
  },
  {
    id: 'trial-dossier-2',
    name: 'Sfax Distribution & Logistique (S.U.A.R.L)',
    mf: '1294820/B/P/000',
    tenant_id: 'tenant_sfax_dist_demo',
    legalForm: 'SUARL',
    sector: 'Commerce de Gros & Distribution',
    fiscalYear: '2026',
    unprocessedDocs: 5,
    tejStatus: 'pending',
    cnssStatus: 'validated',
    tvaG50Status: 'pending',
    quarterlyRevenue: 185000.000,
    lastSyncDate: getTodayDate() + ' 10:15'
  },
  {
    id: 'trial-dossier-3',
    name: 'Bâtiment & Travaux du Sahel (S.A)',
    mf: '0892019/C/A/000',
    tenant_id: 'tenant_bt_sahel_demo',
    legalForm: 'SA',
    sector: 'BTP & Promotion Immobilière',
    fiscalYear: '2026',
    unprocessedDocs: 8,
    tejStatus: 'validated',
    cnssStatus: 'late',
    tvaG50Status: 'validated',
    quarterlyRevenue: 890000.000,
    lastSyncDate: getTodayDate() + ' 08:45'
  }
];

export const TRIAL_CABINET_DOCUMENTS: CabinetDocument[] = [
  {
    id: 'trial-doc-1',
    title: 'Liasse Fiscale Exercice 2025 - SFE SARL (Certifiée)',
    clientName: 'Société Franco-Tunisienne d\'Électronique (SFE S.A.R.L)',
    category: 'Liasse Fiscale',
    uploadDate: '2026-05-15',
    fileSize: '4.8 MB',
    author: 'Cabinet',
    isSigned: true
  },
  {
    id: 'trial-doc-2',
    title: 'Déclaration Mensuelle G50 & Retenue à la Source (Mai 2026)',
    clientName: 'Sfax Distribution & Logistique (S.U.A.R.L)',
    category: 'Attestation Fiscale / CNSS',
    uploadDate: '2026-06-18',
    fileSize: '1.2 MB',
    author: 'Client',
    isSigned: false
  },
  {
    id: 'trial-doc-3',
    title: 'Procès-Verbal d\'Assemblée Générale Ordinaire 2025',
    clientName: 'Bâtiment & Travaux du Sahel (S.A)',
    category: 'PV dAG',
    uploadDate: '2026-06-10',
    fileSize: '2.5 MB',
    author: 'Cabinet',
    isSigned: true
  }
];
