/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Elyssa ERP Suite - Référentiel Démo Unique (Bac à Sable Commercial)
 * Tous les objets portent rigoureusement tenantId: 'company_demo' et is_demo: true.
 */

import {
  Product,
  Client,
  Invoice,
  Vehicle,
  MissionOrder,
  ManufacturingOrder,
  ImportFolder,
  BankAccount,
  CollaboratorAccount,
  Supplier,
  StockMovement,
  Nomenclature,
  GedDocument,
  BankTransaction,
  TaxDeclaration,
  YearEndClosing,
  VisitReport,
  Complaint,
  PerformanceContract,
  LCRequest,
  DeliveryTour,
  PickingOrder,
  Employee,
  WorkContract,
  AbsenceRecord,
  Payslip,
  CompanyLocation
} from '../types';
import { DEFAULT_DEMO_PERFORMANCE_CONTRACTS } from '../services/performanceContractService';
import {
  DEMO_HR_EMPLOYEES,
  DEMO_HR_WORK_CONTRACTS,
  DEMO_HR_ABSENCES,
  DEMO_HR_PAYSLIPS,
  DEMO_HR_COMPANY_LOCATIONS
} from '../services/hrSyncService';

export const DEMO_TENANT_ID = 'company_demo';

export interface DemoUniverseType {
  tenantId: string;
  is_demo: boolean;
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  missions: MissionOrder[];
  manufacturingOrders: ManufacturingOrder[];
  importFolders: ImportFolder[];
  bankAccounts: BankAccount[];
  collaborators: CollaboratorAccount[];
  employees?: Employee[];
  contracts?: WorkContract[];
  workContracts?: WorkContract[];
  absences?: AbsenceRecord[];
  payslips?: Payslip[];
  companyLocations?: CompanyLocation[];
  suppliers?: Supplier[];
  stockMovements?: StockMovement[];
  nomenclatures?: Nomenclature[];
  documents?: GedDocument[];
  bankTransactions?: BankTransaction[];
  taxDeclarations?: TaxDeclaration[];
  yearEndClosings?: YearEndClosing[];
  visitReports?: VisitReport[];
  complaints?: Complaint[];
  performanceContracts?: PerformanceContract[];
  lcRequests?: LCRequest[];
  deliveryTours?: DeliveryTour[];
  pickingOrders?: PickingOrder[];
}

export const DEMO_UNIVERSE: DemoUniverseType = {
  tenantId: DEMO_TENANT_ID,
  is_demo: true,

  // 1. PRODUCTS (6 articles clés dont 2 en alerte critique / rupture)
  products: [
    {
      id: "demo-prod_1",
      tenantId: DEMO_TENANT_ID,
      sku: "CIM-CPJ45",
      name: "Ciment CPJ 45 (Sac 50kg)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      stockLevel: 1200,
      stockQuantity: 1200,
      minStockLevel: 300,
      unitPrice: 14.500,
      costPrice: 11.200,
      marginPercentage: 29.46,
      unit: "Sac",
      supplierId: "demo-sup_1",
      supplierName: "Les Ciments de Bizerte",
      createdDate: "2026-01-15",
      warehouseId: "WH-RADES-01",
      warehouse_location: "Dépôt Central Radès",
      is_demo: true
    },
    {
      id: "demo-prod_2",
      tenantId: DEMO_TENANT_ID,
      sku: "FER-BETON-12",
      name: "Rond à béton Ø12mm (Barre 12m)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      stockLevel: 850,
      stockQuantity: 850,
      minStockLevel: 200,
      unitPrice: 28.000,
      costPrice: 21.000,
      marginPercentage: 33.33,
      unit: "Barre",
      supplierId: "demo-sup_2",
      supplierName: "EL FOULADH Menzel Bourguiba",
      createdDate: "2026-01-15",
      warehouseId: "WH-RADES-01",
      warehouse_location: "Dépôt Central Radès",
      is_demo: true
    },
    {
      id: "demo-prod_3",
      tenantId: DEMO_TENANT_ID,
      sku: "PNT-BLA-15L",
      name: "Peinture Blanche 15L",
      category: "Finition & Décoration",
      type: "PRODUIT_FINI",
      stockLevel: 180,
      stockQuantity: 180,
      minStockLevel: 40,
      unitPrice: 85.000,
      costPrice: 62.000,
      marginPercentage: 37.10,
      unit: "Pot",
      supplierId: "demo-sup_3",
      supplierName: "Astral Tunisie",
      createdDate: "2026-02-01",
      warehouseId: "WH-TUNIS-02",
      warehouse_location: "Magasin Principal Tunis",
      is_demo: true
    },
    {
      id: "demo-prod_4",
      tenantId: DEMO_TENANT_ID,
      sku: "OUT-PRO-230",
      name: "Outillage pro (Meuleuse & Découpe 230mm)",
      category: "Outillage Pro",
      type: "PRODUIT_FINI",
      stockLevel: 95,
      stockQuantity: 95,
      minStockLevel: 20,
      unitPrice: 145.000,
      costPrice: 105.000,
      marginPercentage: 38.10,
      unit: "Unité",
      supplierId: "demo-sup_4",
      supplierName: "Bosch Tunisie Tools",
      createdDate: "2026-02-10",
      warehouseId: "WH-TUNIS-02",
      warehouse_location: "Magasin Principal Tunis",
      is_demo: true
    },
    {
      id: "demo-prod_5",
      tenantId: DEMO_TENANT_ID,
      sku: "PLA-BA13-30",
      name: "Plaques de Plâtre BA13 Standard (120x300cm)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      stockLevel: 0,
      stockQuantity: 0,
      minStockLevel: 50,
      unitPrice: 26.000,
      costPrice: 18.500,
      marginPercentage: 40.54,
      unit: "Plaque",
      supplierId: "demo-sup_5",
      supplierName: "Knauf Tunisie",
      createdDate: "2026-03-01",
      warehouseId: "WH-CHARGUIA-02",
      warehouse_location: "Entrepôt Central - Charguia II",
      is_demo: true
    },
    {
      id: "demo-prod_6",
      tenantId: DEMO_TENANT_ID,
      sku: "COL-CAR-25",
      name: "Mortier Colle C2TE Haute Performance (Sac 25kg)",
      category: "Finition & Décoration",
      type: "PRODUIT_FINI",
      stockLevel: 12,
      stockQuantity: 12,
      minStockLevel: 40,
      unitPrice: 21.000,
      costPrice: 14.200,
      marginPercentage: 47.89,
      unit: "Sac",
      supplierId: "demo-sup_6",
      supplierName: "Sika Tunisie",
      createdDate: "2026-03-10",
      warehouseId: "WH-SFAX-01",
      warehouse_location: "Dépôt Régional - Sfax",
      is_demo: true
    }
  ],

  // 2. CLIENTS (3 fiches tunisiennes)
  clients: [
    {
      id: "demo-cli_1",
      tenantId: DEMO_TENANT_ID,
      name: "Société Tunisienne de Construction (STC)",
      email: "contact@stc-btp.tn",
      phone: "+216 71 200 300",
      address: "Zone Industrielle Charguia II, Tunis",
      category: "BTP & Gros Œuvre",
      sector: "Construction & Travaux Publics",
      revenuePotential: 250000,
      status: "Active",
      createdDate: "2026-01-10",
      matriculeFiscal: "1029384/A/M/000",
      notes: "Grand compte BTP historique. Facturation régulière et chantiers structurants.",
      engagements: [
        {
          id: "demo-eng_1_1",
          tenantId: DEMO_TENANT_ID,
          title: "Approvisionnement Ciment & Fer sous 48h",
          description: "Livraison directe sur chantier Charguia et Radès.",
          dueDate: "2026-08-30",
          status: "Met",
          is_demo: true
        }
      ],
      is_demo: true
    },
    {
      id: "demo-cli_2",
      tenantId: DEMO_TENANT_ID,
      name: "Comptoir du Centre",
      email: "achats@comptoir-centre.tn",
      phone: "+216 73 300 400",
      address: "Avenue Léopold Senghor, Sousse",
      category: "Distribution & Négoce",
      sector: "Quincaillerie & Second Œuvre",
      revenuePotential: 180000,
      status: "Active",
      createdDate: "2026-02-15",
      matriculeFiscal: "1483920/B/P/000",
      notes: "Négociant grossiste réputé dans la région du Sahel.",
      engagements: [
        {
          id: "demo-eng_2_1",
          tenantId: DEMO_TENANT_ID,
          title: "Livraison Tournée Sahel",
          description: "Acheminement hebdomadaire outillage pro et peinture.",
          dueDate: "2026-09-10",
          status: "Pending",
          is_demo: true
        }
      ],
      is_demo: true
    },
    {
      id: "demo-cli_3",
      tenantId: DEMO_TENANT_ID,
      name: "Afrique Bâtiment",
      email: "direction@afrique-batiment.com",
      phone: "+216 74 400 500",
      address: "Route de Gabès Km 3, Sfax",
      category: "Entreprise Générale BTP",
      sector: "Génie Civil & Voirie",
      revenuePotential: 320000,
      status: "Active",
      createdDate: "2026-03-01",
      matriculeFiscal: "0948201/C/N/000",
      notes: "Client d'envergure régionale. Dossier de recouvrement actif en cours de relance.",
      engagements: [
        {
          id: "demo-eng_3_1",
          tenantId: DEMO_TENANT_ID,
          title: "Plan d'apurement créance échue",
          description: "Règlement échelonné prévu fin de mois.",
          dueDate: "2026-07-01",
          status: "Delayed",
          is_demo: true
        }
      ],
      is_demo: true
    }
  ],

  // 3. INVOICES (3 factures : payée, en cours, échue avec historique)
  invoices: [
    {
      id: "demo-inv_1",
      tenantId: DEMO_TENANT_ID,
      invoiceNumber: "FAC-2026-001",
      clientId: "demo-cli_1",
      clientName: "Société Tunisienne de Construction (STC)",
      amountHT: 10000.000,
      vatRate: 19,
      vatAmount: 1900.000,
      withholdingTaxRate: 1.5,
      withholdingAmount: 150.000,
      amountNetToPay: 11750.000,
      amountTTC: 11900.000,
      status: "Paid",
      issuedDate: "2026-07-15",
      dueDate: "2026-07-15",
      collectedAmount: 11750.000,
      withholdingCertificateReceived: true,
      delivery_status: "livre",
      delivery_address: "Zone Industrielle Charguia II, Tunis",
      sales_channel: "web",
      warehouse_location: "Dépôt Central Radès",
      items: [
        { code: "CIM-CPJ45", description: "Ciment CPJ 45 (Sac 50kg)", quantity: 400, unitPrice: 14.500, totalTTC: 6902.000 },
        { code: "FER-BETON-12", description: "Rond à béton Ø12mm", quantity: 150, unitPrice: 28.000, totalTTC: 4998.000 }
      ],
      recouvrementSteps: [],
      is_demo: true
    },
    {
      id: "demo-inv_2",
      tenantId: DEMO_TENANT_ID,
      invoiceNumber: "FAC-2026-002",
      clientId: "demo-cli_2",
      clientName: "Comptoir du Centre",
      amountHT: 8500.000,
      vatRate: 19,
      vatAmount: 1615.000,
      withholdingTaxRate: 1.5,
      withholdingAmount: 127.500,
      amountNetToPay: 9987.500,
      amountTTC: 10115.000,
      status: "Unpaid",
      issuedDate: "2026-08-10",
      dueDate: "2026-09-10",
      collectedAmount: 0,
      withholdingCertificateReceived: false,
      delivery_status: "en_attente",
      delivery_address: "Avenue Léopold Senghor, Sousse",
      sales_channel: "pos",
      warehouse_location: "Magasin Principal Tunis",
      items: [
        { code: "PNT-BLA-15L", description: "Peinture Blanche 15L", quantity: 60, unitPrice: 85.000, totalTTC: 6069.000 },
        { code: "OUT-PRO-230", description: "Outillage pro (Meuleuse 230mm)", quantity: 20, unitPrice: 145.000, totalTTC: 4046.000 }
      ],
      recouvrementSteps: [],
      is_demo: true
    },
    {
      id: "demo-inv_3",
      tenantId: DEMO_TENANT_ID,
      invoiceNumber: "FAC-2026-003",
      clientId: "demo-cli_3",
      clientName: "Afrique Bâtiment",
      amountHT: 14200.000,
      vatRate: 19,
      vatAmount: 2698.000,
      withholdingTaxRate: 1.5,
      withholdingAmount: 213.000,
      amountNetToPay: 16685.000,
      amountTTC: 16898.000,
      status: "Unpaid",
      issuedDate: "2026-06-01",
      dueDate: "2026-07-01",
      collectedAmount: 0,
      withholdingCertificateReceived: false,
      delivery_status: "livre",
      delivery_address: "Route de Gabès Km 3, Sfax",
      sales_channel: "field_sales",
      warehouse_location: "Dépôt Central Radès",
      items: [
        { code: "FER-BETON-12", description: "Rond à béton Ø12mm (Barre 12m)", quantity: 300, unitPrice: 28.000, totalTTC: 9996.000 },
        { code: "CIM-CPJ45", description: "Ciment CPJ 45 (Sac 50kg)", quantity: 400, unitPrice: 14.500, totalTTC: 6902.000 }
      ],
      recouvrementSteps: [
        {
          id: "step_1",
          tenantId: DEMO_TENANT_ID,
          date: "2026-07-05",
          type: "Email",
          actionType: "Email",
          note: "Relance amiable niveau 1 transmise au service comptable.",
          notes: "Relance amiable niveau 1 transmise au service comptable.",
          performedBy: "Khaled Ben Amor"
        },
        {
          id: "step_2",
          tenantId: DEMO_TENANT_ID,
          date: "2026-07-20",
          type: "Call",
          actionType: "Call",
          note: "Appel téléphonique au DAF d'Afrique Bâtiment, promesse de virement fin de mois.",
          notes: "Appel téléphonique au DAF d'Afrique Bâtiment, promesse de virement fin de mois.",
          performedBy: "Khaled Ben Amor"
        }
      ],
      is_demo: true
    }
  ],

  // 4. VEHICLES (3 véhicules du parc)
  vehicles: [
    {
      id: "demo-v_1",
      tenantId: DEMO_TENANT_ID,
      brand: "Peugeot",
      model: "Partner",
      registrationNumber: "228 TUN 4091",
      purchaseDate: "2024-03-12",
      purchasePrice: 62000.000,
      status: "Active",
      assignedToEmployeeId: "demo-emp_6",
      assignedEmployeeName: "Hamza Ben Salem",
      is_demo: true
    },
    {
      id: "demo-v_2",
      tenantId: DEMO_TENANT_ID,
      brand: "Isuzu",
      model: "D-Max",
      registrationNumber: "240 TN 8812",
      purchaseDate: "2024-02-10",
      purchasePrice: 72000.000,
      status: "Active",
      assignedToEmployeeId: "demo-emp_6",
      assignedEmployeeName: "Hamza Ben Salem",
      is_demo: true
    },
    {
      id: "demo-v_3",
      tenantId: DEMO_TENANT_ID,
      brand: "Citroën",
      model: "C-Élysée",
      registrationNumber: "215 TUN 9811",
      purchaseDate: "2023-01-15",
      purchasePrice: 48000.000,
      status: "Active",
      assignedToEmployeeId: "demo-emp_3",
      assignedEmployeeName: "Mohamed Ali Gharbi",
      is_demo: true
    }
  ],

  // 5. MISSIONS (2 ordres de mission rattachés aux collaborateurs)
  missions: [
    {
      id: "demo-mission_1",
      tenantId: DEMO_TENANT_ID,
      employeeId: "demo-emp_6",
      employeeName: "Hamza Ben Salem",
      vehicleId: "demo-v_2",
      vehicleLabel: "Isuzu D-Max (240 TN 8812)",
      transportType: "CompanyCar",
      destination: "Tunis / Sfax",
      purpose: "Livraison Client Poulina - Tunis/Sfax",
      departureDateTime: "2026-08-10T07:30",
      returnDateTime: "2026-08-10T19:00",
      status: "Approved",
      allowancesGranted: 60.000,
      totalAdvance: 60.000,
      totalExpenses: 35.000,
      netBalanceToSettle: -25.000,
      expenses: [
        {
          id: "demo-me_mo1_1",
          tenantId: DEMO_TENANT_ID,
          category: "Food",
          description: "Repas et frais déplacement livraison Poulina",
          amount: 35.000,
          invoiceNumber: "RE_SFAX_88",
          date: "2026-08-10"
        }
      ],
      is_demo: true
    },
    {
      id: "demo-mission_2",
      tenantId: DEMO_TENANT_ID,
      employeeId: "demo-emp_3",
      employeeName: "Mohamed Ali Gharbi",
      vehicleId: "demo-v_3",
      vehicleLabel: "Citroën C-Élysée (215 TUN 9811)",
      transportType: "CompanyCar",
      destination: "Sousse",
      purpose: "Prospection Sousse & Négociation Grands Comptes",
      departureDateTime: "2026-08-10T08:00",
      returnDateTime: "2026-08-10T18:00",
      status: "Approved",
      allowancesGranted: 50.000,
      totalAdvance: 50.000,
      totalExpenses: 30.000,
      netBalanceToSettle: -20.000,
      expenses: [
        {
          id: "demo-me_mo2_1",
          tenantId: DEMO_TENANT_ID,
          category: "Food",
          description: "Déjeuner client prospection commerciale Sousse",
          amount: 30.000,
          invoiceNumber: "RE_SOUSSE_12",
          date: "2026-08-10"
        }
      ],
      is_demo: true
    }
  ],

  // 6. MANUFACTURING ORDERS (2 OFs cohérents : Tunis Assemblage B & Sfax Extrusion A)
  manufacturingOrders: [
    {
      id: "demo-mo_1",
      tenantId: DEMO_TENANT_ID,
      nomenclatureId: "demo-nom_1",
      productName: "Outillage pro (Pack Chantier 230mm)",
      quantityToProduce: 100,
      quantityProduced: 45,
      quantityScrapped: 2,
      advancement: 45,
      startDate: "2026-08-15",
      endDate: "2026-08-30",
      assignedLine: "Ligne Assemblage B (Tunis)",
      assignedTeam: "Équipe Matin (Chef : J. Ben Ali)",
      status: "En cours",
      importFolderId: "demo-imp_1",
      notes: "OF Actif Outillage pro (Pack Chantier 230mm) - 45% d'avancement, 45 unités terminées, 2 rebuts. Liaison transit IMP-RADES-2026-081.",
      customsStatusOverride: "Released"
    },
    {
      id: "demo-mo_2",
      tenantId: DEMO_TENANT_ID,
      nomenclatureId: "demo-nom_2",
      productName: "Tube PVC Haute Pression PN16 D63 (Barre 4m)",
      quantityToProduce: 250,
      quantityProduced: 0,
      quantityScrapped: 0,
      advancement: 0,
      startDate: "2026-08-25",
      endDate: "2026-09-05",
      assignedLine: "Ligne Extrusion A (Sfax)",
      assignedTeam: "Équipe Après-midi (Chef : M. Trabelsi)",
      status: "Planifié",
      notes: "OF Planifié Tube PVC PN16 D63 (Barre 4m) - Début prévu le 25/08/2026. Dépendance matière : Résine PVC S-67."
    }
  ],

  // 7. IMPORT FOLDERS (IMP-RADES-2026-081 en douane Radès avec devises et coûts calculés sans NaN)
  importFolders: [
    {
      id: "demo-imp_1",
      tenantId: DEMO_TENANT_ID,
      reference: "IMP-RADES-2026-081",
      folderType: "Import",
      supplierName: "Marseille Chimie & Outillage SAS",
      originCountry: "France",
      incoterm: "FOB",
      portOfArrival: "Radès",
      transitterName: "Société Tunisienne de Transit & Logistique (STTL)",
      status: "Customs",
      creationDate: "2026-08-01",
      estimatedArrivalDate: "2026-08-28",
      currency: "EUR",
      exchangeRate: 3.42,
      items: [
        {
          id: "demo-item_1",
          tenantId: DEMO_TENANT_ID,
          productName: "Matières premières & Outillage haute résistance",
          quantity: 500,
          fobUnitPrice: 32.7,
          foreignCurrencyRate: 3.42,
          customsDutyRate: 15,
          vatRate: 19
        }
      ],
      freightCostTND: 4200.000,
      customsDutiesTND: 8150.000,
      transitterFeesTND: 1200.000,
      handlingFeesTND: 850.000,
      insuranceCostTND: 650.000,
      otherFeesTND: 300.000
    }
  ],

  // 8. BANK ACCOUNTS (Registre multi-comptes trésorerie : banques, caisses et épargne)
  bankAccounts: [
    {
      id: "demo-ba_1",
      tenantId: DEMO_TENANT_ID,
      bankName: "BIAT - Courant Commercial",
      accountNumber: "03001010015920038472",
      type: "COURANT",
      accountTypeCategory: "COURANT",
      sceAccount: "5321",
      initialBalance: 145250.620,
      currentBalance: 145250.620,
      currency: "TND",
      status: "Active",
      is_demo: true
    },
    {
      id: "demo-ba_2",
      tenantId: DEMO_TENANT_ID,
      bankName: "Attijari Bank - Exploitation",
      accountNumber: "04019110024810041233",
      type: "COURANT",
      accountTypeCategory: "COURANT",
      sceAccount: "5322",
      initialBalance: 19750.000,
      currentBalance: 19750.000,
      currency: "TND",
      status: "Active",
      is_demo: true
    },
    {
      id: "demo-ba_3",
      tenantId: DEMO_TENANT_ID,
      bankName: "BIAT Bourse - Compte Titres",
      accountNumber: "03001010015920038499",
      type: "TITRES",
      accountTypeCategory: "TITRES",
      isBvmtDedicated: true,
      notes: "Compte de règlement dédié BVMT & Tunisie Clearing",
      initialBalance: 12500.000,
      currentBalance: 12500.000,
      currency: "TND",
      status: "Active",
      is_demo: true
    },
    {
      id: "demo-ba_4",
      tenantId: DEMO_TENANT_ID,
      bankName: "Caisse Principale (Siège)",
      accountNumber: "CAISSE-SIEGE-5411",
      type: "CAISSE",
      accountTypeCategory: "CAISSE",
      sceAccount: "5411",
      initialBalance: 3450.000,
      currentBalance: 3450.000,
      currency: "TND",
      status: "Active",
      is_demo: true
    },
    {
      id: "demo-ba_5",
      tenantId: DEMO_TENANT_ID,
      bankName: "Compte Épargne & DAT",
      accountNumber: "03001010099988812345",
      type: "EPARGNE",
      accountTypeCategory: "EPARGNE",
      sceAccount: "5313",
      interestRate: "6.5%",
      initialBalance: 50000.000,
      currentBalance: 50000.000,
      currency: "TND",
      status: "Active",
      is_demo: true
    }
  ],

  // 9. COLLABORATORS (7 collaborateurs démo clés)
  collaborators: [
    {
      id: "demo-emp_0",
      tenantId: DEMO_TENANT_ID,
      name: "Meriam Doudou",
      email: "m.doudou@elyssa-erp.tn",
      role: "DG",
      status: "Active",
      jobTitle: "Gérante / Direction Générale",
      matricule: "EMP-0000",
      phone: "+216 71 862 100",
      structureType: "Direction",
      structureName: "Direction Générale",
      createdDate: "2022-01-01",
      assignedTasks: [
        {
          id: "task-0-1",
          tenantId: DEMO_TENANT_ID,
          title: "Revue stratégique trimestrielle",
          description: "Analyse des performances multi-agences et validation des budgets.",
          dueDate: "2026-08-31",
          priority: "High",
          status: "In_Progress",
          createdDate: "2026-08-01"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_1",
      tenantId: DEMO_TENANT_ID,
      name: "Khaled Ben Amor",
      email: "k.benamor@elyssa-erp.tn",
      role: "Director",
      status: "Active",
      jobTitle: "Directeur Financier & Recouvrement",
      matricule: "EMP-0001",
      phone: "+216 71 862 101",
      structureType: "Direction",
      structureName: "Direction Financière",
      createdDate: "2023-01-15",
      assignedTasks: [
        {
          id: "task-1-1",
          tenantId: DEMO_TENANT_ID,
          title: "Suivi du dossier de recouvrement Afrique Bâtiment",
          description: "Relance créance échue FAC-2026-003.",
          dueDate: "2026-08-25",
          priority: "High",
          status: "In_Progress",
          createdDate: "2026-08-05"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_2",
      tenantId: DEMO_TENANT_ID,
      name: "Ines Dridi",
      email: "i.dridi@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Responsable Rapprochement & Trésorerie",
      matricule: "EMP-0002",
      phone: "+216 71 862 102",
      structureType: "Service",
      structureName: "Service Comptabilité & Trésorerie",
      createdDate: "2024-03-10",
      assignedTasks: [
        {
          id: "task-2-1",
          tenantId: DEMO_TENANT_ID,
          title: "Rapprochement bancaire mensuel BIAT",
          description: "Pointage des opérations d'encaissement et commissions.",
          dueDate: "2026-08-28",
          priority: "Medium",
          status: "Pending",
          createdDate: "2026-08-10"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_3",
      tenantId: DEMO_TENANT_ID,
      name: "Mohamed Ali Gharbi",
      email: "m.gharbi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chargé Clientèle / Ventes Grands Comptes",
      matricule: "EMP-0003",
      phone: "+216 71 862 103",
      structureType: "Service",
      structureName: "Service Commercial",
      createdDate: "2025-06-18",
      assignedTasks: [
        {
          id: "task-3-1",
          tenantId: DEMO_TENANT_ID,
          title: "Prospection région Sousse & Sahel",
          description: "Visites commerciales et préparation des devis.",
          dueDate: "2026-08-26",
          priority: "Medium",
          status: "In_Progress",
          createdDate: "2026-08-12"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_4",
      tenantId: DEMO_TENANT_ID,
      name: "Amel Ben Soltane",
      email: "a.bensoltane@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Responsable Ressources Humaines",
      matricule: "EMP-0004",
      phone: "+216 71 862 104",
      structureType: "Direction",
      structureName: "Direction RH",
      createdDate: "2024-11-01",
      assignedTasks: [
        {
          id: "task-4-1",
          tenantId: DEMO_TENANT_ID,
          title: "Clôture de la paie et déclarations CNSS",
          description: "Génération des fiches de paie et calcul des primes de performance.",
          dueDate: "2026-08-29",
          priority: "High",
          status: "Pending",
          createdDate: "2026-08-15"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_5",
      tenantId: DEMO_TENANT_ID,
      name: "Sami Mansour",
      email: "s.mansour@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Développeur ERP Principal & IT",
      matricule: "EMP-0005",
      phone: "+216 71 862 105",
      structureType: "Service",
      structureName: "Support & Infrastructure IT",
      createdDate: "2025-01-10",
      assignedTasks: [
        {
          id: "task-5-1",
          tenantId: DEMO_TENANT_ID,
          title: "Maintenance et monitoring de la plateforme",
          description: "Contrôle de l'intégrité des bases et synchronisation temps réel.",
          dueDate: "2026-08-30",
          priority: "Low",
          status: "In_Progress",
          createdDate: "2026-08-01"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_6",
      tenantId: DEMO_TENANT_ID,
      name: "Hamza Ben Salem",
      email: "h.bensalem@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chauffeur Livreur / Logistique & Flotte",
      matricule: "EMP-0006",
      phone: "+216 71 862 106",
      structureType: "Entrepôt",
      structureName: "Entrepôt Central Radès",
      createdDate: "2025-02-01",
      assignedTasks: [
        {
          id: "task-6-1",
          tenantId: DEMO_TENANT_ID,
          title: "Tournée livraison Radès - Sfax",
          description: "Livraison matériaux sur chantiers clients.",
          dueDate: "2026-08-24",
          priority: "Medium",
          status: "Completed",
          createdDate: "2026-08-10"
        }
      ],
      isDemo: true
    }
  ],

  // Données complémentaires pour la cohérence globale
  suppliers: [
    {
      id: "demo-sup_1",
      tenantId: DEMO_TENANT_ID,
      name: "Les Ciments de Bizerte",
      contactName: "Moncef Ben Salah",
      email: "commercial@ciments-bizerte.tn",
      phone: "+216 72 431 500",
      address: "Baie de Sebra, Bizerte",
      category: "Matériaux de Construction",
      paymentTerms: "60 jours fin de mois",
      rating: 4.8,
      is_demo: true
    },
    {
      id: "demo-sup_2",
      tenantId: DEMO_TENANT_ID,
      name: "EL FOULADH Menzel Bourguiba",
      contactName: "Tarak Mansouri",
      email: "ventes@elfouladh.com.tn",
      phone: "+216 72 460 200",
      address: "Zone Industrielle El Fouladh, Menzel Bourguiba",
      category: "Sidérurgie & Métallurgie",
      paymentTerms: "45 jours fin de mois",
      rating: 4.6,
      is_demo: true
    },
    {
      id: "demo-sup_3",
      tenantId: DEMO_TENANT_ID,
      name: "Astral Tunisie",
      contactName: "Hichem Jaziri",
      email: "commandes@astral.tn",
      phone: "+216 71 430 100",
      address: "Zone Industrielle Megrine, Ben Arous",
      category: "Peintures & Revêtements",
      paymentTerms: "30 jours",
      rating: 4.7,
      is_demo: true
    },
    {
      id: "demo-sup_4",
      tenantId: DEMO_TENANT_ID,
      name: "Bosch Tunisie Tools",
      contactName: "Slimane Chahed",
      email: "pro@bosch-tools.tn",
      phone: "+216 71 880 900",
      address: "Zone Industrielle Charguia I, Tunis",
      category: "Outillage Professionnel",
      paymentTerms: "30 jours fin de mois",
      rating: 4.9,
      is_demo: true
    },
    {
      id: "demo-sup_5",
      tenantId: DEMO_TENANT_ID,
      name: "Knauf Tunisie",
      contactName: "Mehdi Trabelsi",
      email: "contact@knauf.tn",
      phone: "+216 71 940 300",
      address: "Zone Industrielle Charguia II, Tunis",
      category: "Plaques & Systèmes Plâtre",
      paymentTerms: "30 jours",
      rating: 4.8,
      is_demo: true
    },
    {
      id: "demo-sup_6",
      tenantId: DEMO_TENANT_ID,
      name: "Sika Tunisie",
      contactName: "Anis Khemir",
      email: "commandes@tn.sika.com",
      phone: "+216 70 022 700",
      address: "Zone Industrielle Ksar Saïd, Manouba",
      category: "Colles & Chimie du Bâtiment",
      paymentTerms: "45 jours fin de mois",
      rating: 4.9,
      is_demo: true
    }
  ],

  nomenclatures: [
    {
      id: "demo-nom_1",
      tenantId: DEMO_TENANT_ID,
      productName: "Outillage pro (Pack Chantier 230mm)",
      category: "Outillage Pro",
      estimatedTimeMinutes: 25,
      laborCostPerUnit: 4.500,
      materials: [
        {
          id: "demo-rm_1",
          tenantId: DEMO_TENANT_ID,
          name: "Meuleuse d'angle Pro 230mm",
          quantityNeeded: 1,
          unit: "Pcs",
          unitCost: 85.000,
          importFolderId: "demo-imp_1"
        },
        {
          id: "demo-rm_2",
          tenantId: DEMO_TENANT_ID,
          name: "Disque diamanté béton armé Ø230",
          quantityNeeded: 2,
          unit: "Pcs",
          unitCost: 10.000
        }
      ]
    },
    {
      id: "demo-nom_2",
      tenantId: DEMO_TENANT_ID,
      productName: "Tube PVC Haute Pression PN16 D63 (Barre 4m)",
      category: "Conduits & Plasturgie",
      estimatedTimeMinutes: 18,
      laborCostPerUnit: 3.200,
      materials: [
        {
          id: "demo-rm_3",
          tenantId: DEMO_TENANT_ID,
          name: "Résine PVC S-67",
          quantityNeeded: 4.8,
          unit: "kg",
          unitCost: 3.400
        },
        {
          id: "demo-rm_4",
          tenantId: DEMO_TENANT_ID,
          name: "Stabilisant thermique Ca/Zn",
          quantityNeeded: 0.15,
          unit: "kg",
          unitCost: 12.500
        },
        {
          id: "demo-rm_5",
          tenantId: DEMO_TENANT_ID,
          name: "Colorant & Masterbatch Gris",
          quantityNeeded: 0.08,
          unit: "kg",
          unitCost: 8.200
        }
      ]
    }
  ],

  // 12. GED & PIÈCES JUSTIFICATIVES
  documents: [
    {
      id: "demo-doc_1",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      name: "Contrat_Cadre_STC_2026.pdf",
      type: "Contract",
      fileSize: "245 KB",
      fileType: "application/pdf",
      uploadDate: "2026-01-15",
      linkedToType: "Client",
      linkedToId: "demo-cli_1",
      linkedToName: "Société Tunisienne de Construction (STC)",
      description: "Contrat cadre d'approvisionnement annuel chantiers BTP",
      version: 1,
      uploadedBy: "Khaled Ben Amor"
    },
    {
      id: "demo-doc_2",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      name: "Attestation_Assurance_Flotte_STAR.pdf",
      type: "Other",
      fileSize: "180 KB",
      fileType: "application/pdf",
      uploadDate: "2026-02-01",
      linkedToType: "Employee",
      linkedToId: "demo-emp_6",
      linkedToName: "Hamza Ben Salem",
      description: "Police d'assurance flotte et responsabilité civile STAR Assurances",
      version: 1,
      uploadedBy: "Amel Ben Soltane"
    },
    {
      id: "demo-doc_3",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      name: "Rapport_Audit_Qualite_Usine.pdf",
      type: "Report",
      fileSize: "520 KB",
      fileType: "application/pdf",
      uploadDate: "2026-03-10",
      linkedToType: "Employee",
      linkedToId: "demo-emp_0",
      linkedToName: "Meriam Doudou",
      description: "Rapport d'audit et certification conformité processus de fabrication",
      version: 1,
      uploadedBy: "Meriam Doudou"
    }
  ],

  // 13. COMPTABILITÉ, TRÉSORERIE & FISCALITÉ
  bankTransactions: [
    {
      id: "demo-tx_1",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      accountId: "demo-ba_1",
      accountName: "BIAT - Compte Courant Entreprise",
      date: "2026-07-20",
      type: "In",
      amount: 11750,
      method: "Virement",
      reference: "VIR-STC-2026-081",
      beneficiaryOrIssuer: "Société Tunisienne de Construction (STC)",
      category: "Vente",
      description: "Règlement facture FAC-2026-001 par virement bancaire",
      status: "Cleared"
    },
    {
      id: "demo-tx_2",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      accountId: "demo-ba_1",
      accountName: "BIAT - Compte Courant Entreprise",
      date: "2026-08-05",
      type: "Out",
      amount: 4500,
      method: "Virement",
      reference: "VIR-CIM-BIZERTE-092",
      beneficiaryOrIssuer: "Les Ciments de Bizerte",
      category: "Achat Fournisseur",
      description: "Acompte approvisionnement ciment Portland CPJ45",
      status: "Cleared"
    },
    {
      id: "demo-tx_3",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      accountId: "demo-ba_1",
      accountName: "BIAT - Compte Courant Entreprise",
      date: "2026-08-12",
      type: "In",
      amount: 12500,
      method: "Virement",
      reference: "LCN-POULINA-2026",
      beneficiaryOrIssuer: "POULINA GROUP HOLDING",
      category: "Vente",
      description: "Encaissement LCN commande agro-industrielle",
      status: "Cleared"
    },
    {
      id: "demo-tx_4",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      accountId: "demo-ba_1",
      accountName: "BIAT - Compte Courant Entreprise",
      date: "2026-08-14",
      type: "Out",
      amount: 8250,
      method: "Traite",
      reference: "TR-FOULADH-882",
      dueDate: "2026-09-30",
      beneficiaryOrIssuer: "EL FOULADH Menzel Bourguiba",
      category: "Achat Fournisseur",
      description: "Traite fournisseur à 45 jours - rond à béton Ø12",
      status: "Pending"
    },
    {
      id: "demo-tx_5",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      accountId: "demo-ba_1",
      accountName: "BIAT - Compte Courant Entreprise",
      date: "2026-08-10",
      type: "In",
      amount: 9987.5,
      method: "Cheque",
      reference: "CHQ-CC-7731",
      dueDate: "2026-09-15",
      beneficiaryOrIssuer: "Comptoir du Centre",
      category: "Vente",
      description: "Chèque client en portefeuille pour règlement FAC-2026-002",
      status: "Pending"
    }
  ],

  taxDeclarations: [
    {
      id: "demo-tax_1",
      tenantId: DEMO_TENANT_ID,
      year: 2026,
      period: "M07",
      periodLabel: "Juillet 2026",
      tvaCollected: 19200,
      tvaDeductible: 11400,
      tvaDue: 7800,
      withholdingPaid: 450,
      withholdingCollected: 1200,
      corporateTaxEstimate: 0,
      totalAmountPaid: 9000,
      status: "Validated",
      filedDate: "2026-08-18"
    }
  ],

  yearEndClosings: [
    {
      id: "demo-yec_1",
      tenantId: DEMO_TENANT_ID,
      year: 2025,
      closingDate: "2026-03-31",
      closedBy: "Khaled Ben Amor (DAF)",
      revenues: 1250000,
      expenses: 1083000,
      ebitda: 167000,
      corporateTax: 25000,
      netIncome: 142000,
      status: "Closed",
      notes: "Exercice 2025 clôturé, audité et certifié conforme par le commissaire aux comptes.",
      isLocked: true
    }
  ],

  // 14. RAPPORTS DE VISITE & RÉCLAMATIONS CLIENTS
  visitReports: [
    {
      id: "demo-vr_1",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_1",
      clientName: "Société Tunisienne de Construction (STC)",
      date: "2026-08-12",
      purpose: "Négociation approvisionnement nouveau chantier Charguia II",
      summary: "Entretien avec le directeur technique. Validation des besoins sur 40 tonnes de ciment CPJ45 et 15 tonnes de fer à béton.",
      actionPoints: [
        "Établir devis formel avec remise volume",
        "Planifier première livraison fin août",
        "Coordonner avec le service logistique pour passage camion"
      ],
      aiAnalyzed: true,
      aiInsights: "Opportunité commerciale à forte rentabilité. Client historique fidèle.",
      author: "Mohamed Ali Gharbi"
    },
    {
      id: "demo-vr_2",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_2",
      clientName: "Comptoir du Centre",
      date: "2026-08-14",
      purpose: "Revue de stock quincaillerie et présentation gamme peinture Astral",
      summary: "Visite du dépôt central à Sousse. Réapprovisionnement régulier outillage pro et intégration des peintures dans le showroom.",
      actionPoints: [
        "Transmettre catalogue outillage pro 2026",
        "Programmer passage chauffeur Hamza pour tournée Sahel",
        "Mettre en place présentoir PLV"
      ],
      aiAnalyzed: true,
      aiInsights: "Client stratégique dans le Sahel. Potentiel de hausse du panier moyen de 15%.",
      author: "Mohamed Ali Gharbi"
    }
  ],

  complaints: [
    {
      id: "demo-rec_1",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_1",
      clientName: "Société Tunisienne de Construction (STC)",
      subject: "Retard partiel sur livraison ciment CPJ45",
      description: "Livraison reçue avec 24h de décalage par rapport au planning chantier.",
      status: "Resolved",
      priority: "Medium",
      assignedDepartment: "Logistics",
      investigationDetails: "Problème d'embouteillage et de rotation des véhicules sur l'axe Radès-Charguia.",
      resolutionNotes: "Livraison prioritaire effectuée dès le lendemain matin avec bonification commerciale accordée.",
      createdDate: "2026-08-02",
      resolvedDate: "2026-08-04"
    },
    {
      id: "demo-rec_2",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_3",
      clientName: "Afrique Bâtiment",
      subject: "Demande d'échéancier et révision des pénalités",
      description: "Contestation des pénalités de retard suite à un décalage de trésorerie sur marché public.",
      status: "In_Investigation",
      priority: "High",
      assignedDepartment: "Finance",
      investigationDetails: "Dossier transmis au DAF Khaled Ben Amor pour négociation d'un rééchelonnement à l'amiable.",
      createdDate: "2026-08-08"
    }
  ],

  // 15. PERFORMANCE RH / MPO & OKR
  performanceContracts: DEFAULT_DEMO_PERFORMANCE_CONTRACTS,

  // 16. LETTRES DE CRÉDIT & COMMERCE EXTÉRIEUR
  lcRequests: [
    {
      id: "demo-lc_1",
      tenantId: DEMO_TENANT_ID,
      is_demo: true,
      importFolderId: "demo-imp_1",
      folderType: "Import",
      lcReference: "BIAT-CDOC-2026-0819",
      proformaInvoiceRef: "PI-MARSEILLE-2026-07",
      proformaInvoiceDate: "2026-07-28",
      issuingBank: "BIAT (Banque Internationale Arabe de Tunisie)",
      beneficiaryName: "Marseille Chimie & Outillage SAS",
      beneficiaryAddress: "Port Autonome de Marseille, France",
      advisingBank: "BNP Paribas Marseille",
      amount: 16350,
      currency: "EUR",
      paymentTerms: "At Sight",
      expiryDate: "2026-10-31",
      shipmentDeadline: "2026-09-15",
      portOfLoading: "Port de Marseille",
      portOfDischarge: "Radès",
      status: "Opened",
      requiredDocuments: [
        "Connaissement maritime (Bill of Lading)",
        "Facture commerciale visée",
        "Certificat d'origine EUR.1",
        "Liste de colisage"
      ],
      additionalConditions: "Paiement irrévocable et confirmé à vue sur présentation des documents conformes en douane Radès.",
      creationDate: "2026-08-05"
    }
  ],

  // 17. DISPATCHING & TOURNÉES DE LIVRAISON
  deliveryTours: [
    {
      id: "demo-tour_1",
      tenantId: DEMO_TENANT_ID,
      tour_number: "TRN-2026-042",
      driver_id: "demo-emp_6",
      driver_name: "Hamza Ben Salem",
      vehicle_id: "demo-v_2",
      vehicle_name: "Isuzu D-Max 240 TN 8812",
      pickup_warehouse: "Dépôt Central Radès",
      warehouse_location: "Dépôt Central Radès",
      status: "en_cours",
      total_weight_kg: 450,
      vehicle_max_payload_kg: 1285,
      payload_ratio_percent: 35.0,
      created_at: "2026-08-14T08:30:00.000Z",
      notes: "Tournée Express Tunis -> Sousse -> Sfax (Charge: 35% / 450 kg)",
      orders: [
        {
          order_id: "CMD-2026-101",
          client_name: "SOCIÉTÉ TUNISIENNE DE CONSTRUCTION (STC)",
          address: "Tunis -> Sousse -> Sfax",
          amount_ttc: 4998,
          amount_ht: 4200,
          delivery_status: "en_transit",
          sales_channel: "web",
          warehouse_location: "Dépôt Central Radès (Quai 2)",
          dock_number: "Quai 2",
          estimatedWeightKg: 450
        }
      ]
    }
  ],

  pickingOrders: [
    {
      id: "demo-pick_1",
      tenantId: DEMO_TENANT_ID,
      orderId: "CMD-2026-101",
      clientName: "SOCIÉTÉ TUNISIENNE DE CONSTRUCTION (STC)",
      deliveryAddress: "Z.I. Ben Arous, Rue 8600, Tunis",
      warehouseId: "wh_central",
      warehouseName: "Dépôt Central Radès",
      dockNumber: "Quai 2 - Dépôt Central Radès",
      status: "pret_chargement",
      createdAt: "2026-08-14T07:45:00.000Z",
      preparedAt: "2026-08-14T08:15:00.000Z",
      preparedBy: "Mounir Sfaxi (Chef Dépôt Radès)",
      totalAmountTTC: 4998,
      items: [
        {
          productId: "demo-prod_1",
          productName: "Ciment Portland & Adjuvants BTP (12 articles - 450 kg)",
          quantity: 12,
          warehouseName: "Dépôt Central Radès"
        }
      ]
    }
  ],

  // 12. RESSOURCES HUMAINES & MULTI-SITES SYNCHRONISÉS
  employees: DEMO_HR_EMPLOYEES,
  contracts: DEMO_HR_WORK_CONTRACTS,
  workContracts: DEMO_HR_WORK_CONTRACTS,
  absences: DEMO_HR_ABSENCES,
  payslips: DEMO_HR_PAYSLIPS,
  companyLocations: DEMO_HR_COMPANY_LOCATIONS
};
