import { db } from '../utils/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Employee, Invoice } from '../types';
import { DeliveryTour, FleetInventoryItem, PickingOrder } from '../types/mobileTerrain';
import { DEFAULT_DEMO_PERFORMANCE_CONTRACTS } from './performanceContractService';
import {
  TRIAL_FLEET_INVENTORY,
  TRIAL_MOBILE_DEVICES,
  TRIAL_FIELD_SESSIONS,
  TRIAL_MOBILE_ORDERS,
  TRIAL_CHANTIER_REPORTS
} from '../data/mockTrialData';

export interface HyperConnectedDemoResult {
  employees: Employee[];
  fleetVehicles: FleetInventoryItem[];
  invoices: Invoice[];
  deliveryTours: DeliveryTour[];
  warehouses: any[];
  incomingEmails: any[];
  caisseTransactions: any[];
  accountingEntries: any[];
}

/**
 * Générateur de données de démonstration hyper-connectées (Cross-Modules) pour Elyssa ERP.
 * Seeding automatique et simultané dans Firestore sous company_erp_data/{tenantId}/...
 */
export async function seedHyperConnectedDemoData(tenantId: string): Promise<HyperConnectedDemoResult> {
  const companyId = (tenantId || 'Inter-Affaires').trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const now = new Date().toISOString();

  // 1. Ressources Humaines & Collaborateurs (7 profils unifiés)
  const employeesData: Employee[] = [
    {
      id: 'demo-emp_1',
      name: 'Meriam Doudou',
      email: 'm.doudou@elyssa-erp.tn',
      phone: '+216 20 100 200',
      jobTitle: 'Gérante / Direction Générale',
      department: 'Direction Générale',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 4500.000,
      hireDate: '2020-01-01',
      nationalId: '04812345',
      birthDate: '1985-04-12',
      address: 'Les Berges du Lac 2, Tunis',
      assigned_module: 'finance',
      cnssNumber: '11223344-01'
    },
    {
      id: 'demo-emp_2',
      name: 'Khaled Ben Amor',
      email: 'k.benamor@elyssa-erp.tn',
      phone: '+216 21 300 400',
      jobTitle: 'Directeur Financier',
      department: 'Finance & Comptabilité',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 3800.000,
      hireDate: '2021-03-15',
      nationalId: '05923456',
      birthDate: '1987-09-23',
      address: 'Ennasr 2, Ariana',
      assigned_module: 'finance',
      cnssNumber: '22334455-02'
    },
    {
      id: 'demo-emp_3',
      name: 'Ines Dridi',
      email: 'i.dridi@elyssa-erp.tn',
      phone: '+216 22 500 600',
      jobTitle: 'Responsable Rapprochement',
      department: 'Finance & Trésorerie',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 2400.000,
      hireDate: '2022-06-01',
      nationalId: '06834567',
      birthDate: '1992-11-05',
      address: 'Menzah 6, Tunis',
      assigned_module: 'finance',
      cnssNumber: '33445566-03'
    },
    {
      id: 'demo-emp_4',
      name: 'Mohamed Ali Gharbi',
      email: 'm.gharbi@elyssa-erp.tn',
      phone: '+216 23 700 800',
      jobTitle: 'Chargé Clientèle / Ventes',
      department: 'Ventes & Commercial',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 2100.000,
      hireDate: '2022-09-15',
      nationalId: '07945678',
      birthDate: '1990-02-18',
      address: 'Sousse Ville, Sousse',
      assigned_module: 'vente',
      cnssNumber: '44556677-04'
    },
    {
      id: 'demo-emp_5',
      name: 'Amel Ben Soltane',
      email: 'a.bensoltane@elyssa-erp.tn',
      phone: '+216 24 900 100',
      jobTitle: 'Responsable RH',
      department: 'Ressources Humaines',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 2600.000,
      hireDate: '2021-11-01',
      nationalId: '08156789',
      birthDate: '1989-07-30',
      address: 'La Marsa, Tunis',
      assigned_module: 'rh',
      cnssNumber: '55667788-05'
    },
    {
      id: 'demo-emp_6',
      name: 'Sami Mansour',
      email: 's.mansour@elyssa-erp.tn',
      phone: '+216 25 200 300',
      jobTitle: 'Développeur Principal',
      department: 'Direction & IT',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 3200.000,
      hireDate: '2023-02-01',
      nationalId: '09267890',
      birthDate: '1994-05-14',
      address: 'Ariana Centre, Ariana',
      assigned_module: 'it',
      cnssNumber: '66778899-06'
    },
    {
      id: 'demo-emp_7',
      name: 'Hamza Ben Salem',
      email: 'h.bensalem@elyssa-erp.tn',
      phone: '+216 29 881 200',
      jobTitle: 'Chauffeur Livreur / Logistique',
      department: 'Logistique & Transport',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 1450.000,
      hireDate: '2023-05-10',
      nationalId: '03478901',
      birthDate: '1993-08-22',
      address: 'Ben Arous, Tunis',
      assigned_module: 'livraison',
      cnssNumber: '77889900-07'
    }
  ];

  // Collaborators mapping
  const collaboratorsData = employeesData.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.jobTitle,
    department: e.department,
    assigned_module: e.assigned_module,
    status: 'Active',
    license_status: 'Active'
  }));

  // Pointages & Attendance Logs
  const attendanceLogs = [
    {
      id: `att-liv-01-${Date.now()}`,
      employeeId: 'demo-emp_7',
      employeeName: 'Hamza Ben Salem',
      timestamp: new Date().toISOString(),
      type: 'IN',
      method: 'gps',
      location: 'Dépôt Central Radès (Quai 1)',
      verified: true
    },
    {
      id: `att-com-01-${Date.now()}`,
      employeeId: 'demo-emp_4',
      employeeName: 'Mohamed Ali Gharbi',
      timestamp: new Date().toISOString(),
      type: 'IN',
      method: 'gps',
      location: 'Zone Commerciale Sousse',
      verified: true
    }
  ];

  // 2. Parc Auto & Véhicules (3 véhicules exacts)
  const fleetVehiclesData: FleetInventoryItem[] = [
    {
      id: 'demo-v_1',
      tenantId: companyId,
      fleet_park: 'Flotte Commerciale & Livraison',
      device_name: 'Peugeot Partner',
      serial_reference: '228 TUN 4091',
      category: 'Véhicule Utilitaire',
      status: 'Available',
      registeredAt: '2024-03-12',
      mileage: 34200,
      assignedDriver: 'Hamza Ben Salem',
      maxPayloadKg: 1200
    },
    {
      id: 'demo-v_2',
      tenantId: companyId,
      fleet_park: 'Flotte Logistique & Transport',
      device_name: 'Isuzu D-Max',
      serial_reference: '240 TN 8812',
      category: 'Véhicule Utilitaire',
      status: 'Available',
      registeredAt: '2024-02-10',
      mileage: 51800,
      assignedDriver: 'Hamza Ben Salem',
      maxPayloadKg: 1500
    },
    {
      id: 'demo-v_3',
      tenantId: companyId,
      fleet_park: 'Flotte Commerciale',
      device_name: 'Citroën C-Élysée',
      serial_reference: '215 TUN 9811',
      category: 'Véhicule de Tourisme',
      status: 'Available',
      registeredAt: '2023-01-15',
      mileage: 42600,
      assignedDriver: 'Mohamed Ali Gharbi',
      maxPayloadKg: 600
    }
  ];

  // 2b. Ordres de Mission Flotte (2 missions actives)
  const fleetMissionsData = [
    {
      id: 'demo-mo_1',
      employeeId: 'demo-emp_7',
      employeeName: 'Hamza Ben Salem',
      vehicleId: 'demo-v_2',
      vehicleLabel: 'Isuzu D-Max (240 TN 8812)',
      transportType: 'CompanyCar',
      destination: 'Tunis / Sfax',
      purpose: 'Livraison Client Poulina - Tunis/Sfax',
      departureDateTime: '2026-08-10T07:30',
      returnDateTime: '2026-08-10T19:00',
      status: 'Approved',
      allowancesGranted: 60.000,
      expenses: [
        { id: 'demo-me_mo1_1', category: 'Food', description: 'Repas et frais déplacement livraison Poulina', amount: 35.000, invoiceNumber: 'RE_SFAX_88', date: '2026-08-10' }
      ]
    },
    {
      id: 'demo-mo_2',
      employeeId: 'demo-emp_4',
      employeeName: 'Mohamed Ali Gharbi',
      vehicleId: 'demo-v_3',
      vehicleLabel: 'Citroën C-Élysée (215 TUN 9811)',
      transportType: 'CompanyCar',
      destination: 'Sousse',
      purpose: 'Prospection Sousse',
      departureDateTime: '2026-08-10T08:00',
      returnDateTime: '2026-08-10T18:00',
      status: 'Approved',
      allowancesGranted: 50.000,
      expenses: [
        { id: 'demo-me_mo2_1', category: 'Food', description: 'Déjeuner client prospection commerciale Sousse', amount: 30.000, invoiceNumber: 'RE_SOUSSE_12', date: '2026-08-10' }
      ]
    }
  ];

  // 2c. Dépenses & Frais Flotte (3 écritures récurrentes)
  const fleetExpensesData = [
    { id: 'demo-exp_1', date: '2026-08-01', vehicleId: 'demo-v_2', vehicleLabel: 'Isuzu D-Max (240 TN 8812)', category: 'GasolineBonus', amount: 450.000, invoiceNb: 'BON_TOT_450', providerName: 'TotalEnergies', description: 'Carburant TotalEnergies - Tournée livraison Sud' },
    { id: 'demo-exp_2', date: '2026-08-03', vehicleId: 'demo-v_1', vehicleLabel: 'Peugeot Partner (228 TUN 4091)', category: 'MechanicLabor', amount: 280.000, invoiceNb: 'FACT_VID_280', providerName: 'Atelier Central Service', description: 'Entretien vidange complète et remplacement filtres' },
    { id: 'demo-exp_3', date: '2026-08-05', vehicleId: 'demo-v_3', vehicleLabel: 'Citroën C-Élysée (215 TUN 9811)', category: 'Insurance', amount: 650.000, invoiceNb: 'VIG_ASSUR_650', providerName: 'Assurances STAR / Recette Finances', description: 'Vignette fiscale & Assurance flotte annuelle' }
  ];

  // 3. Entrepôts & Stocks (warehouses & products)
  const warehousesData = [
    {
      id: 'WH-RADES-01',
      code: 'DEP-01',
      name: 'Dépôt Central Radès',
      address: 'Zone Portuaire & Logistique, Radès, Tunis',
      manager: 'Hamza Ben Salem',
      capacity: '5000 m2',
      status: 'Active'
    },
    {
      id: 'WH-TUNIS-02',
      code: 'MAG-02',
      name: 'Magasin Principal Tunis',
      address: 'Avenue Habib Bourguiba, Tunis',
      manager: 'Mounir Karray',
      capacity: '1200 m2',
      status: 'Active'
    }
  ];

  // 4 Articles valorisés demandés
  const productsData = [
    {
      id: "demo-prod_1",
      sku: "CIM-CPJ45",
      name: "Ciment CPJ 45 (Sac 50kg)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      unitPrice: 14.500,
      costPrice: 11.200,
      vatRate: 19,
      stockQuantity: 1200,
      stockLevel: 1200,
      minStockLevel: 300,
      unit: "Sac",
      supplierName: "Les Ciments de Bizerte",
      warehouse_location: "Dépôt Central Radès",
      is_demo: true
    },
    {
      id: "demo-prod_2",
      sku: "FER-BETON-12",
      name: "Rond à béton Ø12mm (Barre 12m)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      unitPrice: 28.000,
      costPrice: 21.000,
      vatRate: 19,
      stockQuantity: 850,
      stockLevel: 850,
      minStockLevel: 200,
      unit: "Barre",
      supplierName: "EL FOULADH Menzel Bourguiba",
      warehouse_location: "Dépôt Central Radès",
      is_demo: true
    },
    {
      id: "demo-prod_3",
      sku: "PNT-BLA-15L",
      name: "Peinture Blanche 15L",
      category: "Finition & Décoration",
      type: "PRODUIT_FINI",
      unitPrice: 85.000,
      costPrice: 62.000,
      vatRate: 19,
      stockQuantity: 180,
      stockLevel: 180,
      minStockLevel: 40,
      unit: "Pot",
      supplierName: "Astral Tunisie",
      warehouse_location: "Magasin Principal Tunis",
      is_demo: true
    },
    {
      id: "demo-prod_4",
      sku: "OUT-PRO-230",
      name: "Outillage pro (Meuleuse & Découpe 230mm)",
      category: "Outillage Pro",
      type: "PRODUIT_FINI",
      unitPrice: 145.000,
      costPrice: 105.000,
      vatRate: 19,
      stockQuantity: 95,
      stockLevel: 95,
      minStockLevel: 20,
      unit: "Unité",
      supplierName: "Bosch Tunisie Tools",
      warehouse_location: "Magasin Principal Tunis",
      is_demo: true
    }
  ];

  // 3 Clients demandés
  const clientsData = [
    {
      id: "demo-cli_1",
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
          title: "Plan d'apurement créance échue",
          description: "Règlement échelonné prévu fin de mois.",
          dueDate: "2026-07-01",
          status: "Delayed",
          is_demo: true
        }
      ],
      is_demo: true
    }
  ];

  // 3 Factures réparties demandées (Payée, En attente, Échue) + POS
  const invoicesData: Invoice[] = [
    {
      id: "demo-inv_1",
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
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
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
        { id: "step_1", date: "2026-07-05", actionType: "Email", notes: "Relance amiable niveau 1 transmise au service comptable.", performedBy: "Khaled Ben Amor" },
        { id: "step_2", date: "2026-07-20", actionType: "Call", notes: "Appel téléphonique au DAF d'Afrique Bâtiment, promesse de virement fin de mois.", performedBy: "Khaled Ben Amor" }
      ],
      is_demo: true
    },
    {
      id: "POS-2026-0104",
      invoiceNumber: "POS-2026-0104",
      clientId: "demo-cli_2",
      clientName: "Comptoir BTP Ariana",
      sales_channel: "pos",
      seller_id: "EMP-POS-01",
      seller_name: "Mounir Karray (Chef de Caisse)",
      warehouse_location: "Magasin Principal Tunis",
      delivery_address: "Chantier Résidence Les Jasmins, Ariana",
      amountHT: 8500.000,
      vatRate: 19,
      vatAmount: 1615.000,
      withholdingTaxRate: 1.5,
      withholdingAmount: 127.500,
      amountNetToPay: 9987.500,
      amountTTC: 10115.000,
      status: "Paid",
      delivery_status: "livre",
      issuedDate: now,
      dueDate: now,
      items: [
        {
          code: "OUT-PRO-230",
          description: "Outillage pro (Meuleuse 230mm)",
          quantity: 70,
          unitPrice: 145.000,
          totalTTC: 10115.000
        }
      ],
      recouvrementSteps: [],
      withholdingCertificateReceived: true,
      is_demo: true
    }
  ];

  // 3 Pièces GED types demandées
  const documentsData = [
    {
      id: "demo-doc_ged_1",
      name: "Bilan fiscal certifié 2025",
      type: "TaxDeclaration",
      fileName: "Bilan_Fiscal_Certifie_2025_InterAffaires.pdf",
      fileUrl: "#",
      fileSize: "1.8 MB",
      mimeType: "application/pdf",
      uploadDate: "2026-04-15",
      uploadedBy: "expert-comptable@cabinet-fiduciaire.tn",
      linkedToType: "TaxDeclaration",
      linkedToId: "TAX-2025",
      linkedToName: "Inter-Affaires (Démo)",
      status: "Processed",
      tags: ["Bilan", "Fiscalité", "Certifié", "2025"],
      is_demo: true
    },
    {
      id: "demo-doc_ged_2",
      name: "Attestation exonération TVA",
      type: "Contract",
      fileName: "Attestation_Exoneration_TVA_2026.pdf",
      fileUrl: "#",
      fileSize: "450 KB",
      mimeType: "application/pdf",
      uploadDate: "2026-01-10",
      uploadedBy: "direction@inter-affaires.tn",
      linkedToType: "TaxDeclaration",
      linkedToId: "EXO-TVA-2026",
      linkedToName: "Direction Générale des Impôts",
      status: "Processed",
      tags: ["TVA", "Exonération", "Attestation", "DGI"],
      is_demo: true
    },
    {
      id: "demo-doc_ged_3",
      name: "Contrat commercial",
      type: "Contract",
      fileName: "Contrat_Commercial_Cadre_STC_2026.pdf",
      fileUrl: "#",
      fileSize: "920 KB",
      mimeType: "application/pdf",
      uploadDate: "2026-02-01",
      uploadedBy: "commercial@inter-affaires.tn",
      linkedToType: "Client",
      linkedToId: "demo-cli_1",
      linkedToName: "Société Tunisienne de Construction (STC)",
      status: "Signed",
      tags: ["Contrat Cadre", "BTP", "Vente", "STC"],
      is_demo: true
    }
  ];

  // Fournisseurs & Achats (2 Bons de Commande Fournisseurs)
  const suppliersData = [
    {
      id: "demo-sup_1",
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
      name: "EL FOULADH Menzel Bourguiba",
      contactName: "Tarak Mansouri",
      email: "ventes@elfouladh.com.tn",
      phone: "+216 72 460 200",
      address: "Zone Industrielle El Fouladh, Menzel Bourguiba",
      category: "Sidérurgie & Métallurgie",
      paymentTerms: "45 jours fin de mois",
      rating: 4.6,
      is_demo: true
    }
  ];

  const purchaseOrdersData = [
    {
      id: "demo-po_1",
      orderNumber: "PO-2026-0101",
      supplierId: "demo-sup_1",
      supplierName: "Les Ciments de Bizerte",
      requisitionId: "demo-req_1",
      title: "Approvisionnement Ciment CPJ45 800 Sacs",
      totalAmount: 8960.000,
      status: "InProgress",
      orderDate: "2026-08-12",
      paymentTerms: "60 jours fin de mois",
      expectedDeliveryDate: "2026-08-25",
      items: [
        { productId: "demo-prod_1", productName: "Ciment CPJ 45 (Sac 50kg)", quantity: 800, unitPrice: 11.200, totalPrice: 8960.000 }
      ],
      is_demo: true
    },
    {
      id: "demo-po_2",
      orderNumber: "PO-2026-0102",
      supplierId: "demo-sup_2",
      supplierName: "EL FOULADH Menzel Bourguiba",
      requisitionId: "demo-req_2",
      title: "Réapprovisionnement Rond à Béton Ø12mm 500 Barres",
      totalAmount: 10500.000,
      status: "InProgress",
      orderDate: "2026-08-14",
      paymentTerms: "45 jours fin de mois",
      expectedDeliveryDate: "2026-08-28",
      items: [
        { productId: "demo-prod_2", productName: "Rond à béton Ø12mm (Barre 12m)", quantity: 500, unitPrice: 21.000, totalPrice: 10500.000 }
      ],
      is_demo: true
    }
  ];

  const purchaseRequisitionsData = [
    {
      id: "demo-req_1",
      requestNumber: "DA-2026-0041",
      requestedBy: "Sami Mansour",
      department: "Logistique & Dépôt",
      title: "Approvisionnement Ciment CPJ45 800 Sacs",
      totalEstimatedCost: 8960.000,
      priority: "High",
      status: "Approved",
      requestDate: "2026-08-10",
      approvalDate: "2026-08-11",
      approvedBy: "Khaled Ben Amor",
      is_demo: true
    },
    {
      id: "demo-req_2",
      requestNumber: "DA-2026-0042",
      requestedBy: "Hamza Ben Salem",
      department: "Logistique & Dépôt",
      title: "Réapprovisionnement Rond à Béton Ø12mm 500 Barres",
      totalEstimatedCost: 10500.000,
      priority: "High",
      status: "Approved",
      requestDate: "2026-08-12",
      approvalDate: "2026-08-13",
      approvedBy: "Khaled Ben Amor",
      is_demo: true
    }
  ];

  const supplierPerformanceData = [
    {
      id: "demo-perf_1",
      supplierId: "demo-sup_1",
      supplierName: "Les Ciments de Bizerte",
      qualityScore: 96,
      deliveryScore: 94,
      pricingScore: 95,
      overallScore: 95,
      evaluationPeriod: "2026-Q2",
      delayRate: 2,
      nonConformityRate: 1,
      is_demo: true
    },
    {
      id: "demo-perf_2",
      supplierId: "demo-sup_2",
      supplierName: "EL FOULADH Menzel Bourguiba",
      qualityScore: 92,
      deliveryScore: 90,
      pricingScore: 91,
      overallScore: 91,
      evaluationPeriod: "2026-Q2",
      delayRate: 4,
      nonConformityRate: 2,
      is_demo: true
    }
  ];

  // Production & GPAO (1 OF actif & Nomenclature)
  const manufacturingOrdersData = [
    {
      id: "demo-mo_1",
      orderNumber: "OF-2026-0042",
      nomenclatureId: "demo-nom_1",
      productName: "Outillage pro (Conditionnement & Pack Chantier 230mm)",
      quantity: 100,
      startDate: "2026-08-15",
      dueDate: "2026-08-30",
      status: "InProgress",
      supervisor: "Khaled Ben Amor",
      priority: "High",
      progressPercentage: 65,
      notes: "Ordre de fabrication actif atelier outillage pro.",
      is_demo: true
    }
  ];

  const nomenclaturesData = [
    {
      id: "demo-nom_1",
      code: "BOM-OUT-230",
      name: "Outillage pro (Pack Chantier 230mm)",
      version: "1.0",
      productName: "Outillage pro (Meuleuse & Découpe 230mm)",
      status: "Approved",
      components: [
        { id: "c1", componentName: "Meuleuse d'angle Pro 230mm", quantity: 1, unit: "Pcs", unitCost: 85.000 },
        { id: "c2", componentName: "Disque diamanté béton armé", quantity: 2, unit: "Pcs", unitCost: 10.000 }
      ],
      is_demo: true
    }
  ];

  // Douane, Import & Lettre de Crédit SWIFT (1 dossier Import maritime Radès + 1 Crédoc SWIFT)
  const importFoldersData = [
    {
      id: "demo-imp_1",
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
        { id: "demo-item_1", productName: "Matières premières & Outillage haute résistance", quantity: 500, fobUnitPrice: 32.7, foreignCurrencyRate: 3.42, customsDutyRate: 15, vatRate: 19 }
      ],
      freightCostTND: 4200.000,
      customsDutiesTND: 8150.000,
      transitterFeesTND: 1200.000,
      handlingFeesTND: 850.000,
      insuranceCostTND: 650.000,
      otherFeesTND: 300.000,
      is_demo: true
    }
  ];

  const lcRequestsData = [
    {
      id: "demo-lc_1",
      importFolderId: "demo-imp_1",
      folderType: "Import",
      lcReference: "BIAT-CDOC-2026-0819",
      swiftReference: "SWIFT-BIAT-MT700-0819",
      proformaInvoiceRef: "PROFORMA-MC-1029",
      proformaInvoiceDate: "2026-07-25",
      issuingBank: "Banque Internationale Arabe de Tunisie (BIAT) - Siège Tunis",
      beneficiaryName: "Marseille Chimie & Outillage SAS",
      beneficiaryAddress: "Avenue de l'Exportation, Zone Portuaire, 13002 Marseille, France",
      advisingBank: "BNP Paribas Paris Joliette",
      amount: 16350,
      currency: "EUR",
      paymentTerms: "At Sight",
      expiryDate: "2026-09-30",
      shipmentDeadline: "2026-08-30",
      portOfLoading: "Port de Marseille, France",
      portOfDischarge: "Radès",
      status: "Opened",
      requiredDocuments: [
        "Facture Commerciale en 3 exemplaires originaux",
        "Connaissement Maritime B/L Clean on Board",
        "Certificat d'origine EUR.1",
        "Certificat d'assurance maritime"
      ],
      additionalConditions: "Expéditions partielles autorisées.",
      creationDate: "2026-07-28",
      is_demo: true
    }
  ];

  // Ordres de Préparation / Picking Orders pour Multi-Dépôts
  const pickingOrdersData: PickingOrder[] = [
    {
      id: 'PICK-881-1',
      tenantId: companyId,
      orderId: 'FAC-2026-0881',
      clientName: 'Société du Sahel Distribution',
      deliveryAddress: 'Zone Industrielle Akouda, Lot 14, Sousse',
      warehouseId: 'WH-CHARGUIA-01',
      warehouseName: 'Entrepôt Principal - Z.I. Charguia II',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-BTP-001', productName: '40 Sacs Ciment Portland CEM I', quantity: 40 },
        { productId: 'PROD-BRQ-015', productName: '15 Palettes Briques de Structure', quantity: 15 }
      ]
    },
    {
      id: 'PICK-881-2',
      tenantId: companyId,
      orderId: 'FAC-2026-0881',
      clientName: 'Société du Sahel Distribution',
      deliveryAddress: 'Zone Industrielle Akouda, Lot 14, Sousse',
      warehouseId: 'WH-TUNIS-02',
      warehouseName: 'Magasin Tunis Principal - Av. Bourguiba',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-PNT-006', productName: '6 Pots Peinture Industrielle', quantity: 6 },
        { productId: 'PROD-CBL-018', productName: '18 Rouleaux Câbles Armés', quantity: 18 }
      ]
    },
    {
      id: 'PICK-900-1',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-CHARGUIA-01',
      warehouseName: 'Entrepôt Principal - Z.I. Charguia II',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-STC-100', productName: '100 Armatures Acier BTP 12mm', quantity: 100 }
      ]
    },
    {
      id: 'PICK-900-2',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-TUNIS-02',
      warehouseName: 'Magasin Tunis Principal',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-OUT-020', productName: '20 Outillages Coffrage Lourd', quantity: 20 }
      ]
    },
    {
      id: 'PICK-900-3',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-SOUSSE-03',
      warehouseName: 'Stock Logistique Sousse',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-AGG-050', productName: '50 Unités Grave Bitume Routier', quantity: 50 }
      ]
    }
  ];

  // Incoming Emails linked to Web Order
  const incomingEmailsData = [
    {
      id: 'EML-2026-881',
      subject: 'Confirmation Commande Web #FAC-2026-0881 - Société du Sahel Distribution',
      sender: 'achats@sahel-distribution.tn',
      recipient: 'commandes@elyssa-erp.tn',
      date: now,
      content: 'Bonjour l\'équipe Elyssa ERP, nous confirmons la commande web N° FAC-2026-0881 (11 662.00 TND) nécessitant un ramassage sur 2 dépôts (Charguia II + Tunis Bourguiba) à livrer sur notre site de Sousse. Merci.',
      status: 'processed',
      linked_invoice_id: 'FAC-2026-0881'
    }
  ];

  // Tournées de Livraison initiales pour Hamza Ben Salem & Kamel Trad
  const deliveryToursData: DeliveryTour[] = [
    {
      id: 'TOUR-2026-0881',
      tenantId: companyId,
      tour_number: 'TR-2026-0881',
      driver_id: 'EMP-LIV-01',
      driver_name: 'Hamza Ben Salem (Chauffeur / Livreur Express)',
      vehicle_id: 'FLEET-ISUZU-01',
      vehicle_name: 'Camion Isuzu D-Max [TN-210-9842]',
      pickup_warehouse: 'Charguia II + Tunis Bourguiba',
      warehouse_location: 'Charguia II + Tunis Bourguiba',
      status: 'en_cours',
      created_at: now,
      notes: 'Tournée multi-ramassage (2 Dépôts) : Quai Charguia II + Quai Tunis Bourguiba -> Sousse.',
      orders: [
        {
          order_id: 'FAC-2026-0881',
          client_name: 'Société du Sahel Distribution',
          address: 'Zone Industrielle Akouda, Lot 14, Sousse',
          amount_ttc: 11662,
          delivery_status: 'en_transit',
          sales_channel: 'web',
          warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal - Av. Bourguiba',
          warehouses_involved: [
            'Entrepôt Principal - Z.I. Charguia II',
            'Magasin Tunis Principal - Av. Bourguiba'
          ],
          pickup_stops: [
            {
              stop_id: 'STOP-881-1',
              warehouse_id: 'WH-CHARGUIA-01',
              warehouse_name: 'Entrepôt Principal - Z.I. Charguia II',
              address: 'Entrepôt Principal - Z.I. Charguia II - Quai #1',
              items: [
                { productName: '40 Sacs Ciment Portland CEM I', quantity: 40 },
                { productName: '15 Palettes Briques de Structure', quantity: 15 }
              ],
              status: 'charge',
              loaded_at: now
            },
            {
              stop_id: 'STOP-881-2',
              warehouse_id: 'WH-TUNIS-02',
              warehouse_name: 'Magasin Tunis Principal - Av. Bourguiba',
              address: 'Magasin Tunis Principal - Av. Bourguiba - Quai #2',
              items: [
                { productName: '6 Pots Peinture Industrielle', quantity: 6 },
                { productName: '18 Rouleaux Câbles Armés', quantity: 18 }
              ],
              status: 'en_attente'
            }
          ]
        }
      ]
    },
    {
      id: 'TOUR-2026-0900',
      tenantId: companyId,
      tour_number: 'TR-2026-0900',
      driver_id: 'emp_drv_01',
      driver_name: 'Kamel Trad (Chauffeur Logistique Poids Lourds)',
      vehicle_id: 'v_camion_12t',
      vehicle_name: 'Camion Isuzu 12 Tonnes [TN-9021]',
      pickup_warehouse: 'Charguia II + Tunis + Sousse',
      warehouse_location: 'Charguia II + Tunis + Sousse',
      status: 'en_cours',
      created_at: now,
      notes: 'Tournée grand itinéraire 3 dépôts (Charguia II + Tunis + Sousse) -> Chantier Autoroute A1 Sfax.',
      orders: [
        {
          order_id: 'FAC-2026-0900',
          client_name: 'Grands Travaux du Sud - GTS',
          address: 'Chantier Autoroute A1, Km 140, Sfax',
          amount_ttc: 24850,
          delivery_status: 'en_transit',
          sales_channel: 'field_sales',
          warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal + Stock Logistique Sousse',
          warehouses_involved: [
            'Entrepôt Principal - Z.I. Charguia II',
            'Magasin Tunis Principal',
            'Stock Logistique Sousse'
          ],
          pickup_stops: [
            {
              stop_id: 'STOP-900-1',
              warehouse_id: 'WH-CHARGUIA-01',
              warehouse_name: 'Entrepôt Principal - Z.I. Charguia II',
              address: 'Entrepôt Principal - Z.I. Charguia II - Quai #1',
              items: [
                { productName: '100 Armatures Acier BTP 12mm', quantity: 100 }
              ],
              status: 'charge',
              loaded_at: now
            },
            {
              stop_id: 'STOP-900-2',
              warehouse_id: 'WH-TUNIS-02',
              warehouse_name: 'Magasin Tunis Principal',
              address: 'Magasin Tunis Principal - Quai #2',
              items: [
                { productName: '20 Outillages Coffrage Lourd', quantity: 20 }
              ],
              status: 'en_attente'
            },
            {
              stop_id: 'STOP-900-3',
              warehouse_id: 'WH-SOUSSE-03',
              warehouse_name: 'Stock Logistique Sousse',
              address: 'Stock Logistique Sousse - Quai #3',
              items: [
                { productName: '50 Unités Grave Bitume Routier', quantity: 50 }
              ],
              status: 'en_attente'
            }
          ]
        }
      ]
    }
  ];

  // 5. Finance, Caisse & Comptabilité (caisse_transactions & accounting_entries)
  const caisseTransactionsData = [
    {
      id: 'TRX-POS-104',
      date: now,
      type: 'Encaissement Vente POS',
      category: 'Vente Caisse',
      amount: 10115,
      cashier_id: 'EMP-POS-01',
      cashier_name: 'Mounir Karray',
      reference: 'POS-2026-0104',
      client: 'Comptoir BTP Ariana',
      journal: 'Caisse Showroom Tunis',
      status: 'Validated'
    }
  ];

  const accountingEntriesData = [
    {
      id: 'ECR-POS-2026-0104',
      journalCode: 'VT',
      pieceNumber: 'POS-2026-0104',
      date: now,
      label: 'Vente Caisse POS Comptoir BTP Ariana - Mounir Karray',
      lines: [
        { account: '530000', accountLabel: 'Caisse Showroom Tunis', debit: 10115, credit: 0 },
        { account: '707000', accountLabel: 'Ventes de marchandises POS', debit: 0, credit: 8500 },
        { account: '445700', accountLabel: 'TVA Collectée 19%', debit: 0, credit: 1615 }
      ]
    }
  ];

  // FIRESTORE PERSISTENCE
  if (db) {
    try {
      // Employees
      for (const emp of employeesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'employees', emp.id), emp, { merge: true });
      }

      // Collaborators
      for (const col of collaboratorsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'collaborators', col.id), col, { merge: true });
      }

      // Attendance logs
      for (const att of attendanceLogs) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'attendance_logs', att.id), att, { merge: true });
      }

      // Fleet
      for (const veh of fleetVehiclesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_inventory', veh.id), veh, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_vehicles', veh.id), veh, { merge: true });
      }

      // Fleet Missions
      for (const mo of fleetMissionsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_missions', mo.id), mo, { merge: true });
      }

      // Fleet Expenses
      for (const exp of fleetExpensesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_expenses', exp.id), exp, { merge: true });
      }

      // Clients
      for (const cli of clientsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'clients', cli.id), cli, { merge: true });
      }

      // GED Documents
      for (const docItem of documentsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'documents', docItem.id), docItem, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'ged_documents', docItem.id), docItem, { merge: true });
      }

      // Suppliers
      for (const sup of suppliersData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'suppliers', sup.id), sup, { merge: true });
      }

      // Purchase Orders
      for (const po of purchaseOrdersData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'purchaseOrders', po.id), po, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'purchase_orders', po.id), po, { merge: true });
      }

      // Purchase Requisitions
      for (const req of purchaseRequisitionsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'purchaseRequisitions', req.id), req, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'purchase_requisitions', req.id), req, { merge: true });
      }

      // Supplier Performance
      for (const perf of supplierPerformanceData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'supplierPerformance', perf.id), perf, { merge: true });
      }

      // Manufacturing Orders & Nomenclatures
      for (const mo of manufacturingOrdersData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'manufacturingOrders', mo.id), mo, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'manufacturing_orders', mo.id), mo, { merge: true });
      }
      for (const nom of nomenclaturesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'nomenclatures', nom.id), nom, { merge: true });
      }

      // Import Folders & LC Requests
      for (const imp of importFoldersData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'importFolders', imp.id), imp, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'import_folders', imp.id), imp, { merge: true });
      }
      for (const lc of lcRequestsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'lcRequests', lc.id), lc, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'lc_requests', lc.id), lc, { merge: true });
      }

      // Warehouses
      for (const wh of warehousesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'warehouses', wh.id), wh, { merge: true });
      }

      // Products
      for (const prod of productsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'products', prod.id), prod, { merge: true });
      }

      // Invoices
      for (const inv of invoicesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'invoices', inv.id), inv, { merge: true });
      }

      // Incoming Emails
      for (const eml of incomingEmailsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'incomingEmails', eml.id), eml, { merge: true });
      }

      // Delivery Tours
      for (const tour of deliveryToursData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'delivery_tours', tour.id), tour, { merge: true });
      }

      // Caisse Transactions
      for (const ctx of caisseTransactionsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'caisse_transactions', ctx.id), ctx, { merge: true });
      }

      // Accounting Entries
      for (const acc of accountingEntriesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'bank_transactions', acc.id), acc, { merge: true });
      }

      // Performance Contracts (MPO/OKR)
      for (const perf of DEFAULT_DEMO_PERFORMANCE_CONTRACTS) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'performance_contracts', perf.id), perf, { merge: true });
      }

      // Mobile Devices (MDM)
      for (const mobDev of TRIAL_MOBILE_DEVICES) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'mobile_devices', mobDev.id), { ...mobDev, tenantId: companyId }, { merge: true });
      }

      // Mobile Fleet Items
      for (const fltItem of TRIAL_FLEET_INVENTORY) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_inventory', fltItem.id), { ...fltItem, tenantId: companyId }, { merge: true });
      }

      // Field Sessions
      for (const sess of TRIAL_FIELD_SESSIONS) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'field_sessions', sess.id), { ...sess, tenantId: companyId }, { merge: true });
      }

      // Mobile Orders
      for (const ord of TRIAL_MOBILE_ORDERS) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'mobile_orders', ord.id), { ...ord, tenantId: companyId }, { merge: true });
      }

      // Chantier / Tournée Reports
      for (const rep of TRIAL_CHANTIER_REPORTS) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'chantier_reports', rep.id), { ...rep, tenantId: companyId }, { merge: true });
      }

      console.log('✅ [seedHyperConnectedDemoData] Seeding Firestore sous company_erp_data réussi.');
    } catch (err) {
      console.error('❌ [seedHyperConnectedDemoData] Firestore seed error:', err);
    }
  }

  // Also update LocalStorage keys
  try {
    localStorage.setItem('carthage_employees', JSON.stringify(employeesData));
    localStorage.setItem('carthage_invoices', JSON.stringify(invoicesData));
    localStorage.setItem('carthage_clients', JSON.stringify(clientsData));
    localStorage.setItem('carthage_documents', JSON.stringify(documentsData));
    localStorage.setItem('carthage_ged_documents', JSON.stringify(documentsData));
    localStorage.setItem('carthage_suppliers', JSON.stringify(suppliersData));
    localStorage.setItem('carthage_purchase_orders', JSON.stringify(purchaseOrdersData));
    localStorage.setItem('carthage_purchase_requisitions', JSON.stringify(purchaseRequisitionsData));
    localStorage.setItem('carthage_supplier_performance', JSON.stringify(supplierPerformanceData));
    localStorage.setItem('carthage_manufacturing_orders', JSON.stringify(manufacturingOrdersData));
    localStorage.setItem('carthage_nomenclatures', JSON.stringify(nomenclaturesData));
    localStorage.setItem('carthage_import_folders', JSON.stringify(importFoldersData));
    localStorage.setItem('carthage_lc_requests', JSON.stringify(lcRequestsData));
    localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(fleetVehiclesData));
    localStorage.setItem('carthage_fleet_missions', JSON.stringify(fleetMissionsData));
    localStorage.setItem('carthage_fleet_expenses', JSON.stringify(fleetExpensesData));
    localStorage.setItem('carthage_products', JSON.stringify(productsData));
    localStorage.setItem('carthage_incoming_emails', JSON.stringify(incomingEmailsData));
    localStorage.setItem('carthage_performance_contracts', JSON.stringify(DEFAULT_DEMO_PERFORMANCE_CONTRACTS));
    localStorage.setItem('carthage_demo_simulation_active', 'true');
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('elyssa_demo_reloaded', { detail: { tenantId: companyId } }));
  } catch (e) {}

  return {
    employees: employeesData,
    fleetVehicles: fleetVehiclesData,
    invoices: invoicesData,
    deliveryTours: deliveryToursData,
    warehouses: warehousesData,
    incomingEmails: incomingEmailsData,
    caisseTransactions: caisseTransactionsData,
    accountingEntries: accountingEntriesData
  };
}
