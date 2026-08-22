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
  assets?: any[];
  fleetInventory?: any[];
  purchaseOrders?: any[];
  purchaseRequisitions?: any[];
}

export const DEMO_UNIVERSE: DemoUniverseType = {
  tenantId: DEMO_TENANT_ID,
  is_demo: true,

  // 1. PRODUCTS (Articles typés avec emplacements précis)
  products: [
    {
      id: "demo-prod_1",
      tenantId: DEMO_TENANT_ID,
      sku: "CIM-CPJ45",
      name: "Ciment CPJ 45 (Sac 50kg)",
      category: "Gros Œuvre",
      type: "NEGOCE_LOCAL",
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
      warehouseId: "loc-depot-rades",
      warehouse_location: "Dépôt Central Radès",
      aisle: "Allée A",
      shelf: "Rayon 01 - Étagère 1",
      bin: "Casier C-01",
      is_demo: true
    },
    {
      id: "demo-prod_2",
      tenantId: DEMO_TENANT_ID,
      sku: "FER-BETON-12",
      name: "Rond à béton Ø12mm (Barre 12m)",
      category: "Gros Œuvre",
      type: "NEGOCE_LOCAL",
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
      warehouseId: "loc-depot-rades",
      warehouse_location: "Dépôt Central Radès",
      aisle: "Zone Extérieure",
      shelf: "Parc Ferraille",
      bin: "Rack F-12",
      is_demo: true
    },
    {
      id: "demo-prod_3",
      tenantId: DEMO_TENANT_ID,
      sku: "PNT-BLA-15L",
      name: "Peinture Blanche 15L",
      category: "Finition & Décoration",
      type: "NEGOCE_LOCAL",
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
      warehouseId: "loc-siege-tunis",
      warehouse_location: "Magasin Principal Tunis",
      aisle: "Allée B",
      shelf: "Rayon 03 - Étagère 2",
      bin: "Casier P-04",
      is_demo: true
    },
    {
      id: "demo-prod_4",
      tenantId: DEMO_TENANT_ID,
      sku: "OUT-PRO-230",
      name: "Outillage pro (Pack Chantier 230mm)",
      category: "Outillage Pro",
      type: "PRODUIT_FABRIQUE",
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
      warehouseId: "loc-siege-tunis",
      warehouse_location: "Magasin Principal Tunis",
      aisle: "Allée C",
      shelf: "Rayon 02 - Étagère 3",
      bin: "Casier O-23",
      is_demo: true
    },
    {
      id: "demo-prod_5",
      tenantId: DEMO_TENANT_ID,
      sku: "PLA-BA13-30",
      name: "Plaques de Plâtre BA13 Standard (120x300cm)",
      category: "Gros Œuvre",
      type: "NEGOCE_LOCAL",
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
      warehouseId: "loc-charguia",
      warehouse_location: "Entrepôt Charguia II - Tunis",
      aisle: "Allée D",
      shelf: "Rayon 01 - Zone Plaques",
      bin: "Casier K-01",
      is_demo: true
    },
    {
      id: "demo-prod_6",
      tenantId: DEMO_TENANT_ID,
      sku: "COL-CAR-25",
      name: "Mortier Colle C2TE Haute Performance (Sac 25kg)",
      category: "Finition & Décoration",
      type: "NEGOCE_LOCAL",
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
      warehouseId: "loc-depot-sfax",
      warehouse_location: "Dépôt Régional - Sfax",
      aisle: "Allée S",
      shelf: "Rayon 02 - Étagère 1",
      bin: "Casier S-10",
      is_demo: true
    },
    {
      id: "demo-prod_7",
      tenantId: DEMO_TENANT_ID,
      sku: "MP-IMP-MEUL-230",
      name: "Composant Meuleuse d'Angle 230mm (MP Import)",
      category: "Matières Premières",
      type: "MATIERE_IMPORTEE",
      stockLevel: 55,
      stockQuantity: 55,
      minStockLevel: 20,
      unitPrice: 110.000,
      costPrice: 75.000,
      marginPercentage: 46.67,
      unit: "Unité",
      supplierId: "demo-sup_import",
      supplierName: "Marseille Chimie & Outillage SAS",
      createdDate: "2026-03-15",
      warehouseId: "loc-siege-tunis",
      warehouse_location: "Magasin Principal Tunis",
      aisle: "Quai MP",
      shelf: "Rayon I1",
      bin: "Casier MP-01",
      is_demo: true
    },
    {
      id: "demo-prod_8",
      tenantId: DEMO_TENANT_ID,
      sku: "MP-PVC-S67",
      name: "Résine PVC Grade S-67 (Sac 25kg)",
      category: "Matières Premières",
      type: "MATIERE_IMPORTEE",
      stockLevel: 400,
      stockQuantity: 400,
      minStockLevel: 100,
      unitPrice: 45.000,
      costPrice: 32.000,
      marginPercentage: 40.63,
      unit: "Sac",
      supplierId: "demo-sup_import",
      supplierName: "Marseille Chimie & Outillage SAS",
      createdDate: "2026-03-15",
      warehouseId: "loc-depot-sfax",
      warehouse_location: "Dépôt Régional - Sfax",
      aisle: "Silo & Quai MP",
      shelf: "Rayon P01",
      bin: "Silo S-03",
      is_demo: true
    },
    {
      id: "demo-prod_9",
      tenantId: DEMO_TENANT_ID,
      sku: "FAB-PVC-PN16-63",
      name: "Tube PVC Haute Pression PN16 D63 (Barre 4m)",
      category: "Plomberie & Réseaux",
      type: "PRODUIT_FABRIQUE",
      stockLevel: 120,
      stockQuantity: 120,
      minStockLevel: 30,
      unitPrice: 34.000,
      costPrice: 22.500,
      marginPercentage: 51.11,
      unit: "Barre",
      supplierId: "demo-sup_4",
      supplierName: "Elyssa Fabrication Interne",
      createdDate: "2026-03-20",
      warehouseId: "loc-depot-sfax",
      warehouse_location: "Dépôt Régional - Sfax",
      aisle: "Rack Extrusion",
      shelf: "Rayon Tubulure",
      bin: "Casier TP-16",
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
    },
    {
      id: "demo-cli_4",
      tenantId: DEMO_TENANT_ID,
      name: "SOPAL S.A. (Sfax)",
      email: "contact@sopal.com.tn",
      phone: "+216 74 675 000",
      address: "Route de Gabès Km 3.5, Sfax",
      category: "Industrie & Équipement",
      sector: "Robinetterie & Réseaux Fluides",
      revenuePotential: 290000,
      status: "Active",
      createdDate: "2026-03-10",
      matriculeFiscal: "0892341/D/P/000",
      notes: "Partenaire industriel et client grand compte sur le pôle Sud Sfax.",
      engagements: [
        {
          id: "demo-eng_4_1",
          tenantId: DEMO_TENANT_ID,
          title: "Règlement encaissement en attente & approvisionnement",
          description: "Pointage de la traite échue et validation du planning de livraison tubes.",
          dueDate: "2026-08-25",
          status: "Pending",
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

  // 4. VEHICLES (3 véhicules du parc synchronisés SCE compte 224)
  vehicles: [
    {
      id: "demo-v_1",
      tenantId: DEMO_TENANT_ID,
      brand: "Peugeot",
      model: "Partner",
      registrationNumber: "228 TN 4091",
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
      registrationNumber: "215 TN 9811",
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
      vehicleLabel: "Citroën C-Élysée (215 TN 9811)",
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
      id: "demo-ba_pos_caisse",
      tenantId: DEMO_TENANT_ID,
      bankName: "Caisse Point de Vente (5412)",
      accountNumber: "CAISSE-POS-5412",
      type: "CAISSE",
      accountTypeCategory: "CAISSE",
      sceAccount: "5412",
      initialBalance: 375.500,
      currentBalance: 375.500,
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

  // 9. COLLABORATORS (22 collaborateurs démo sur 6 pôles)
  collaborators: [
    // Pôle 1: Direction Générale & IT (3)
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
      id: "demo-emp_5",
      tenantId: DEMO_TENANT_ID,
      name: "Sami Mansour",
      email: "s.mansour@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "DSI / Lead Dév ERP",
      matricule: "EMP-0005",
      phone: "+216 71 862 105",
      structureType: "Direction",
      structureName: "Direction IT & DSI",
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
      id: "demo-emp_11",
      tenantId: DEMO_TENANT_ID,
      name: "Yassine Ayari",
      email: "y.ayari@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Technicien Support IT & Réseaux",
      matricule: "EMP-0011",
      phone: "+216 71 862 111",
      structureType: "Service",
      structureName: "Support & Infrastructure IT",
      createdDate: "2025-03-01",
      assignedTasks: [],
      isDemo: true
    },

    // Pôle 2: Finance, Trésorerie & Fiscalité (3)
    {
      id: "demo-emp_1",
      tenantId: DEMO_TENANT_ID,
      name: "Khaled Ben Amor",
      email: "k.benamor@elyssa-erp.tn",
      role: "Director",
      status: "Active",
      jobTitle: "Directeur Financier / DAF",
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
      jobTitle: "Comptable & Trésorière / Rapprochement",
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
      id: "demo-emp_12",
      tenantId: DEMO_TENANT_ID,
      name: "Cyrine Khelifi",
      email: "c.khelifi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Aide-Comptable / Facturation & Fournisseurs",
      matricule: "EMP-0012",
      phone: "+216 71 862 112",
      structureType: "Service",
      structureName: "Service Comptabilité & Facturation",
      createdDate: "2025-02-01",
      assignedTasks: [],
      isDemo: true
    },

    // Pôle 3: Ressources Humaines & Social (2)
    {
      id: "demo-emp_4",
      tenantId: DEMO_TENANT_ID,
      name: "Amel Ben Soltane",
      email: "a.bensoltane@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Responsable RH & Juridique Social",
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
      id: "demo-emp_13",
      tenantId: DEMO_TENANT_ID,
      name: "Tarek Mabrouk",
      email: "t.mabrouk@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Gestionnaire Paie, Pointage & HSE",
      matricule: "EMP-0013",
      phone: "+216 71 862 113",
      structureType: "Service",
      structureName: "Service Paie & Pointage",
      createdDate: "2025-01-15",
      assignedTasks: [],
      isDemo: true
    },

    // Pôle 4: Force de Vente, ADV & Caisse POS (4)
    {
      id: "demo-emp_3",
      tenantId: DEMO_TENANT_ID,
      name: "Mohamed Ali Gharbi",
      email: "m.gharbi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Responsable Ventes Terrain & Grands Comptes",
      matricule: "EMP-0003",
      phone: "+216 71 862 103",
      structureType: "Agence",
      structureName: "Agence Commerciale Sousse",
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
      id: "demo-emp_14",
      tenantId: DEMO_TENANT_ID,
      name: "Anis Jlassi",
      email: "a.jlassi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Commercial B2B Régional Sahel",
      matricule: "EMP-0014",
      phone: "+216 73 862 114",
      structureType: "Agence",
      structureName: "Agence Commerciale Sousse",
      createdDate: "2025-02-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_15",
      tenantId: DEMO_TENANT_ID,
      name: "Olfa Belhadj",
      email: "o.belhadj@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chargée ADV & Relations Clients",
      matricule: "EMP-0015",
      phone: "+216 71 862 115",
      structureType: "Service",
      structureName: "Service ADV & Facturation",
      createdDate: "2024-09-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_16",
      tenantId: DEMO_TENANT_ID,
      name: "Mariem Mahfoudh",
      email: "m.mahfoudh@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Hôtesse de Caisse & Vente Showroom",
      matricule: "EMP-0016",
      phone: "+216 71 862 116",
      structureType: "Succursale",
      structureName: "Showroom & Caisse POS Tunis",
      createdDate: "2025-01-05",
      assignedTasks: [],
      isDemo: true
    },

    // Pôle 5: Supply Chain, Quai & Flotte Automobile (5)
    {
      id: "demo-emp_17",
      tenantId: DEMO_TENANT_ID,
      name: "Nader Chaabane",
      email: "n.chaabane@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Responsable Logistique, Flotte & Dispatching",
      matricule: "EMP-0017",
      phone: "+216 74 862 117",
      structureType: "Entrepôt",
      structureName: "Plateforme Logistique Sfax",
      createdDate: "2023-04-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_10",
      tenantId: DEMO_TENANT_ID,
      name: "Riadh Bouazizi",
      email: "r.bouazizi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chef de Quai & Magasinier Principal",
      matricule: "EMP-0010",
      phone: "+216 74 862 110",
      structureType: "Entrepôt",
      structureName: "Dépôt Central Sfax",
      createdDate: "2024-05-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_18",
      tenantId: DEMO_TENANT_ID,
      name: "Karim Zribi",
      email: "k.zribi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Agent Préparateur de Commandes / Picking",
      matricule: "EMP-0018",
      phone: "+216 74 862 118",
      structureType: "Entrepôt",
      structureName: "Dépôt Central Sfax",
      createdDate: "2025-01-10",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_6",
      tenantId: DEMO_TENANT_ID,
      name: "Hamza Ben Salem",
      email: "h.bensalem@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chauffeur-Livreur Principal / Isuzu D-Max",
      matricule: "EMP-0006",
      phone: "+216 71 862 106",
      structureType: "Entrepôt",
      structureName: "Plateforme Logistique Tunis",
      createdDate: "2024-02-15",
      assignedTasks: [
        {
          id: "task-6-1",
          tenantId: DEMO_TENANT_ID,
          title: "Tournée livraison Tunis - Sousse - Sfax",
          description: "Livraison matériaux et outillage sur chantiers clients.",
          dueDate: "2026-08-24",
          priority: "Medium",
          status: "Completed",
          createdDate: "2026-08-10"
        }
      ],
      isDemo: true
    },
    {
      id: "demo-emp_19",
      tenantId: DEMO_TENANT_ID,
      name: "Bilal Zouari",
      email: "b.zouari@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chauffeur-Livreur Poids Lourds / Tournées Régionales",
      matricule: "EMP-0019",
      phone: "+216 74 862 119",
      structureType: "Entrepôt",
      structureName: "Plateforme Logistique Sfax",
      createdDate: "2024-07-01",
      assignedTasks: [],
      isDemo: true
    },

    // Pôle 6: Production Usine, GPAO & Maintenance (5)
    {
      id: "demo-emp_7",
      tenantId: DEMO_TENANT_ID,
      name: "Jalel Ben Ali",
      email: "j.benali@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Responsable Usine & Chef Ligne Extrusion",
      matricule: "EMP-0007",
      phone: "+216 74 862 107",
      structureType: "Usine",
      structureName: "Usine Extrusion Sfax",
      createdDate: "2023-05-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_8",
      tenantId: DEMO_TENANT_ID,
      name: "Mourad Trabelsi",
      email: "m.trabelsi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Chef d'Atelier Assemblage Outillage",
      matricule: "EMP-0008",
      phone: "+216 71 862 108",
      structureType: "Usine",
      structureName: "Atelier Assemblage Tunis",
      createdDate: "2023-09-01",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_9",
      tenantId: DEMO_TENANT_ID,
      name: "Sofiene Sassi",
      email: "s.sassi@elyssa-erp.tn",
      role: "Manager",
      status: "Active",
      jobTitle: "Superviseur Équipe Nuit Extrusion",
      matricule: "EMP-0009",
      phone: "+216 74 862 109",
      structureType: "Usine",
      structureName: "Usine Extrusion Sfax",
      createdDate: "2024-01-15",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_20",
      tenantId: DEMO_TENANT_ID,
      name: "Bilel Hamdi",
      email: "b.hamdi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Opérateur Machine Extrusion & Plasturgie",
      matricule: "EMP-0020",
      phone: "+216 74 862 120",
      structureType: "Usine",
      structureName: "Usine Extrusion Sfax",
      createdDate: "2025-01-20",
      assignedTasks: [],
      isDemo: true
    },
    {
      id: "demo-emp_21",
      tenantId: DEMO_TENANT_ID,
      name: "Hassen Gharbi",
      email: "h.gharbi@elyssa-erp.tn",
      role: "Agent",
      status: "Active",
      jobTitle: "Technicien Maintenance Industrielle & Étalonnage",
      matricule: "EMP-0021",
      phone: "+216 74 862 121",
      structureType: "Usine",
      structureName: "Service Maintenance Sfax",
      createdDate: "2024-06-15",
      assignedTasks: [],
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
      status: "Active",
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
      status: "Active",
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
      status: "Active",
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
      status: "Active",
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
      status: "Active",
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
      status: "Active",
      is_demo: true
    },
    {
      id: "demo-sup_import",
      tenantId: DEMO_TENANT_ID,
      name: "Marseille Chimie & Outillage SAS",
      contactName: "Jean-Luc Morel",
      email: "import@marseille-chimie.fr",
      phone: "+33 4 91 00 22 33",
      address: "Marseille, France / Port de Radès",
      category: "Matières Premières & Import",
      paymentTerms: "Crédoc BIAT (L/C Confirmée)",
      rating: 4.9,
      status: "Active",
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
      date: "2026-08-18",
      purpose: "Visite de suivi nouveau chantier Charguia II (10:00)",
      summary: "Entretien avec le directeur technique. Validation des besoins sur 40 tonnes de ciment CPJ45 et 15 tonnes de fer à béton pour le chantier STC Charguia II.",
      actionPoints: [
        "Établir devis formel avec remise volume",
        "Planifier première livraison fin août",
        "Coordonner avec le service logistique pour passage camion"
      ],
      aiAnalyzed: true,
      aiInsights: "Opportunité commerciale majeure validée (55T matériaux). Client historique fidèle à fort panier moyen. Risque de churn estimé < 2%.",
      author: "Mohamed Ali Gharbi"
    },
    {
      id: "demo-vr_2",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_2",
      clientName: "Comptoir du Centre (Sousse)",
      date: "2026-08-20",
      purpose: "Négociation showroom & réapprovisionnement outillage (14:30)",
      summary: "Visite et négociation au showroom de Sousse. Revue des rotations de stock outillage pro et intégration de la nouvelle gamme de peinture Astral dans les linéaires.",
      actionPoints: [
        "Transmettre catalogue outillage pro 2026",
        "Programmer passage chauffeur Hamza pour tournée Sahel",
        "Mettre en place présentoir PLV"
      ],
      aiAnalyzed: true,
      aiInsights: "Client stratégique dans le Sahel. Potentiel de hausse du panier moyen de 15%. Risque de churn très faible.",
      author: "Mohamed Ali Gharbi"
    },
    {
      id: "demo-vr_3",
      tenantId: DEMO_TENANT_ID,
      clientId: "demo-cli_4",
      clientName: "SOPAL S.A. (Sfax)",
      date: "2026-08-22",
      purpose: "Relance & Recouvrement créance échue (11:00)",
      summary: "Entretien de relance et négociation financière chez SOPAL S.A. (Sfax) pour pointage de l'encaissement en attente et validation du planning de livraison des tubes PVC haute pression.",
      actionPoints: [
        "Pointer encaissement en attente SOPAL avec le DAF",
        "Arrêter échéancier de règlement à l'amiable",
        "Coordonner avec Dépôt Sfax pour déblocage des commandes"
      ],
      aiAnalyzed: false,
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
  companyLocations: DEMO_HR_COMPANY_LOCATIONS,

  // 13. IMMOBILISATIONS & AMORTISSEMENTS (SCE - NCT Tunisie)
  assets: [
    {
      id: "ast-inv-1",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2025-001",
      name: "Serveurs Dell PowerEdge & Baie de Stockage SAN",
      category: "CORPORELLE",
      accountCode: "222",
      acquisitionDate: "2025-01-15",
      commissioningDate: "2025-01-20",
      acquisitionCost: 28500.000,
      salvageValue: 0,
      durationYears: 3,
      amortizationMethod: "LINEAIRE",
      supplier: "Dell Technologies Tunisie",
      invoiceRef: "FACT-DELL-9921",
      location: "Siège Tunis Charguia",
      notes: "Infrastructure IT et baie SAN"
    },
    {
      id: "ast-inv-2",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2024-002",
      name: "Fourgon Isuzu D-Max (240 TN 8812)",
      category: "CORPORELLE",
      accountCode: "224",
      acquisitionDate: "2024-02-10",
      commissioningDate: "2024-02-10",
      acquisitionCost: 72000.000,
      salvageValue: 5000.000,
      durationYears: 5,
      amortizationMethod: "LINEAIRE",
      supplier: "Afrique Auto S.A. Isuzu",
      invoiceRef: "AA-2024-0412",
      location: "Parc Automobile - Ben Arous",
      notes: "Véhicule utilitaire - Matricule 240 TN 8812"
    },
    {
      id: "ast-inv-3",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2024-003",
      name: "Progiciel ERP Elyssa (Licence Perpétuelle & Spécifications)",
      category: "INCORPORELLE",
      accountCode: "212",
      acquisitionDate: "2024-06-10",
      commissioningDate: "2024-07-01",
      acquisitionCost: 18000.000,
      salvageValue: 0,
      durationYears: 3,
      amortizationMethod: "LINEAIRE",
      supplier: "Elyssa Software Technologies",
      invoiceRef: "EST-2024-0819",
      location: "Licence Logicielle Cloud",
      notes: "Agrément et digitalisation des processus métiers"
    },
    {
      id: "ast-inv-4",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2023-004",
      name: "Ligne de Conditionnement Semi-Automatique",
      category: "CORPORELLE",
      accountCode: "223",
      acquisitionDate: "2023-09-01",
      commissioningDate: "2023-09-15",
      acquisitionCost: 145000.000,
      salvageValue: 10000.000,
      durationYears: 7,
      amortizationMethod: "DEGRESSIF",
      supplier: "Bizerte Industrie & Outillages",
      invoiceRef: "BIO-2023-112",
      location: "Atelier Usine Tunis",
      notes: "Amortissement dégressif fiscal (Coeff 2.5) - GPAO"
    },
    {
      id: "ast-inv-5",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2026-005",
      name: "Titres de Participation - Portefeuille BIAT / SFBT",
      category: "FINANCIERE",
      accountCode: "251",
      acquisitionDate: "2026-02-01",
      commissioningDate: "2026-02-01",
      acquisitionCost: 50000.000,
      salvageValue: 50000.000,
      durationYears: 0,
      amortizationMethod: "LINEAIRE",
      supplier: "Intermédiaire en Bourse MAC SA",
      invoiceRef: "MAC-2026-009",
      location: "Compte Titres BVMT",
      notes: "Placements stratégiques non amortissables"
    },
    {
      id: "ast-inv-6",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2024-006",
      name: "Peugeot Partner Utilitaire (228 TN 4091)",
      category: "CORPORELLE",
      accountCode: "224",
      acquisitionDate: "2024-03-12",
      commissioningDate: "2024-03-12",
      acquisitionCost: 62000.000,
      salvageValue: 5000.000,
      durationYears: 5,
      amortizationMethod: "LINEAIRE",
      supplier: "Stafim Peugeot Tunisie",
      invoiceRef: "STAF-2024-118",
      location: "Parc Automobile - Tunis",
      notes: "Véhicule utilitaire - Matricule 228 TN 4091"
    },
    {
      id: "ast-inv-7",
      companyId: DEMO_TENANT_ID,
      code: "IMM-2023-007",
      name: "Citroën C-Élysée Berline (215 TN 9811)",
      category: "CORPORELLE",
      accountCode: "224",
      acquisitionDate: "2023-01-15",
      commissioningDate: "2023-01-15",
      acquisitionCost: 48000.000,
      salvageValue: 4000.000,
      durationYears: 5,
      amortizationMethod: "LINEAIRE",
      supplier: "Aures Auto Citroën",
      invoiceRef: "AUR-2023-045",
      location: "Parc Automobile - Sousse",
      notes: "Véhicule commercial - Matricule 215 TN 9811"
    }
  ],

  // 14. PARC & ACTIFS MATÉRIELS (`fleet_inventory` - 4 actifs synchronisés)
  fleetInventory: [
    {
      id: "trial-fleet-dev-1",
      tenantId: DEMO_TENANT_ID,
      category: "Terminal Mobile",
      fleet_park: "Flotte Commerciale & Vente",
      device_name: "Samsung Galaxy Tab Active 4 Pro",
      serial_reference: "SAM-TAB4-TN-00345",
      status: "Assigned",
      assignedTo: "Mohamed Ali Gharbi",
      assignedDriver: "Mohamed Ali Gharbi",
      registeredAt: "2026-01-15",
      mileage: 0,
      maxPayloadKg: 0,
      acquisitionCost: 1850.000,
      sceAccount: "222",
      immobCode: "IMM-2026-008",
      location: "Flotte Commerciale & Vente"
    },
    {
      id: "trial-fleet-dev-2",
      tenantId: DEMO_TENANT_ID,
      category: "Terminal Mobile",
      fleet_park: "Flotte Logistique",
      device_name: "Zebra TC57 Touch Computer",
      serial_reference: "ZEB-TC57-TN-00812",
      status: "Assigned",
      assignedTo: "Hamza Ben Salem",
      assignedDriver: "Hamza Ben Salem",
      registeredAt: "2026-02-10",
      mileage: 0,
      maxPayloadKg: 0,
      acquisitionCost: 2400.000,
      sceAccount: "222",
      immobCode: "IMM-2026-009",
      location: "Flotte Logistique"
    },
    {
      id: "trial-fleet-srv-3",
      tenantId: DEMO_TENANT_ID,
      category: "Infrastructure IT",
      fleet_park: "Parc Siège & IT",
      device_name: "Serveurs Dell PowerEdge & Baie SAN",
      serial_reference: "SRV-DELL-PE-SAN-2025",
      status: "Assigned",
      assignedTo: "Sami Mansour (DSI)",
      assignedDriver: "Sami Mansour (DSI)",
      registeredAt: "2025-01-20",
      mileage: 0,
      maxPayloadKg: 0,
      acquisitionCost: 28500.000,
      sceAccount: "222",
      immobCode: "IMM-2025-001",
      location: "Siège Tunis Charguia"
    },
    {
      id: "trial-fleet-mach-4",
      tenantId: DEMO_TENANT_ID,
      category: "Machine Industrielle / GPAO",
      fleet_park: "Parc Industriel Usine",
      device_name: "Ligne de Conditionnement Semi-Automatique",
      serial_reference: "LCOND-GPAO-TUNIS-01",
      status: "Assigned",
      assignedTo: "Chef d'Atelier",
      assignedDriver: "Chef d'Atelier",
      registeredAt: "2023-09-15",
      mileage: 0,
      maxPayloadKg: 0,
      acquisitionCost: 145000.000,
      sceAccount: "223",
      immobCode: "IMM-2023-004",
      location: "Atelier Usine Tunis"
    }
  ],

  // 10. PURCHASE ORDERS (Bons de Commande valorisés - 67 581,000 TND TTC total)
  purchaseOrders: [
    {
      id: "demo-po_1",
      tenantId: DEMO_TENANT_ID,
      orderNumber: "PO-2026-0101",
      supplierId: "demo-sup_1",
      supplierName: "Les Ciments de Bizerte",
      requisitionId: "demo-req_1",
      itemDescription: "Approvisionnement Ciment CPJ 45 (500 Sacs)",
      quantity: 500,
      unitCost: 11.200,
      vatRate: 19,
      fodecActive: true,
      amountHT: 5600.000,
      amountTTC: 6665.000,
      totalAmount: 6665.000,
      status: "Reçu conforme",
      orderDate: "2026-08-12",
      deliveryDueDate: "2026-08-20",
      paymentTerms: "Chèque à 60 Jours",
      notes: "500 Sacs Ciment CPJ 45 à 11.200 TND HT = 5 600,000 TND HT | 6 665,000 TND TTC",
      is_demo: true
    },
    {
      id: "demo-po_2",
      tenantId: DEMO_TENANT_ID,
      orderNumber: "PO-2026-0102",
      supplierId: "demo-sup_2",
      supplierName: "EL FOULADH Menzel Bourguiba",
      requisitionId: "demo-req_2",
      itemDescription: "Réapprovisionnement Rond à béton Ø12mm (200 Barres)",
      quantity: 200,
      unitCost: 21.000,
      vatRate: 19,
      fodecActive: true,
      amountHT: 4200.000,
      amountTTC: 4999.000,
      totalAmount: 4999.000,
      status: "Envoyé",
      orderDate: "2026-08-14",
      deliveryDueDate: "2026-08-25",
      paymentTerms: "Traite 90 Jours",
      notes: "200 Barres Rond à béton Ø12mm à 21.000 TND HT = 4 200,000 TND HT | 4 999,000 TND TTC",
      is_demo: true
    },
    {
      id: "demo-po_import",
      tenantId: DEMO_TENANT_ID,
      orderNumber: "PO-2026-0103-IMP",
      supplierId: "demo-sup_import",
      supplierName: "Marseille Chimie & Outillage SAS",
      requisitionId: "demo-req_import",
      itemDescription: "Matières premières & Outillage haute résistance (Dossier IMP-RADES-2026-081)",
      quantity: 500,
      unitCost: 94.000,
      vatRate: 19,
      fodecActive: false,
      amountHT: 47000.000,
      amountTTC: 55917.000,
      totalAmount: 55917.000,
      status: "Envoyé",
      orderDate: "2026-08-01",
      deliveryDueDate: "2026-08-28",
      paymentTerms: "Crédoc BIAT (L/C Confirmée)",
      notes: "Lié au dossier douane IMP-RADES-2026-081 et Crédoc BIAT = 55 917,000 TND TTC",
      is_demo: true
    }
  ],

  purchaseRequisitions: [
    {
      id: "demo-req_1",
      tenantId: DEMO_TENANT_ID,
      requestNumber: "DA-2026-0041",
      requestedBy: "Sami Mansour",
      department: "Logistique & Dépôt",
      title: "Approvisionnement Ciment CPJ 45 500 Sacs",
      totalEstimatedCost: 5600.000,
      priority: "High",
      status: "Approved",
      requestDate: "2026-08-10",
      approvalDate: "2026-08-11",
      approvedBy: "Khaled Ben Amor",
      is_demo: true
    },
    {
      id: "demo-req_2",
      tenantId: DEMO_TENANT_ID,
      requestNumber: "DA-2026-0042",
      requestedBy: "Hamza Ben Salem",
      department: "Logistique & Dépôt",
      title: "Réapprovisionnement Rond à béton Ø12mm 200 Barres",
      totalEstimatedCost: 4200.000,
      priority: "High",
      status: "Approved",
      requestDate: "2026-08-12",
      approvalDate: "2026-08-13",
      approvedBy: "Khaled Ben Amor",
      is_demo: true
    }
  ],

  // 17. STOCK MOVEMENTS (Historique complet réceptions, sorties matière et production)
  stockMovements: [
    {
      id: "demo-sm_1",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_1",
      productName: "Ciment CPJ 45 (Sac 50kg)",
      date: "2026-08-01",
      type: "In",
      quantity: 500,
      reason: "Réception bon de commande fournisseur local BC Les Ciments de Bizerte (PO-2026-0101)",
      reference: "BL-CIM-8812",
      operator: "Riadh Bouazizi (Magasinier)",
      performedBy: "Riadh Bouazizi (Magasinier)"
    },
    {
      id: "demo-sm_2",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_2",
      productName: "Rond à béton Ø12mm (Barre 12m)",
      date: "2026-08-02",
      type: "In",
      quantity: 200,
      reason: "Réception sidérurgie usine EL FOULADH Menzel Bourguiba (PO-2026-0102)",
      reference: "BL-FOULADH-492",
      operator: "Riadh Bouazizi (Magasinier)",
      performedBy: "Riadh Bouazizi (Magasinier)"
    },
    {
      id: "demo-sm_3",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_7",
      productName: "Composant Meuleuse d'Angle 230mm (MP Import)",
      date: "2026-08-10",
      type: "In",
      quantity: 100,
      reason: "Réception Dédouanement Import Marseille Chimie (Dossier IMP-RADES-2026-081 / Crédoc BIAT)",
      reference: "DAU-RADES-8102",
      operator: "Hamza Ben Salem (Logistique & Transit)",
      performedBy: "Hamza Ben Salem (Logistique & Transit)"
    },
    {
      id: "demo-sm_4",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_7",
      productName: "Composant Meuleuse d'Angle 230mm (MP Import)",
      date: "2026-08-16",
      type: "Out",
      quantity: 45,
      reason: "Sortie composant MP pour Ordre de Fabrication demo-mo_1 (Ligne Assemblage B)",
      reference: "OF-2026-001",
      operator: "Mourad Trabelsi (Chef Assemblage)",
      performedBy: "Mourad Trabelsi (Chef Assemblage)"
    },
    {
      id: "demo-sm_5",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_4",
      productName: "Outillage pro (Pack Chantier 230mm)",
      date: "2026-08-18",
      type: "In",
      quantity: 45,
      reason: "Entrée produit fini assemblé conforme OF demo-mo_1",
      reference: "BA-PROD-2026",
      operator: "Mourad Trabelsi (Chef Assemblage)",
      performedBy: "Mourad Trabelsi (Chef Assemblage)"
    },
    {
      id: "demo-sm_6",
      tenantId: DEMO_TENANT_ID,
      productId: "demo-prod_3",
      productName: "Peinture Blanche 15L",
      date: "2026-08-05",
      type: "In",
      quantity: 180,
      reason: "Approvisionnement Magasin Tunis - Astral Tunisie",
      reference: "BL-AST-104",
      operator: "Riadh Bouazizi (Magasinier)",
      performedBy: "Riadh Bouazizi (Magasinier)"
    }
  ]
};
