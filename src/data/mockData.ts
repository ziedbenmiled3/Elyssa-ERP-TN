/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Complaint, Invoice, CompetitorReport, AdminSettings, VisitReport, Supplier, Product, StockMovement, SmtpSettings, EmailTemplate, CommunicationLog } from '../types';

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  companyName: "Inter-Affaires (Parent)",
  currency: "TND",
  defaultVatRate: 19,
  defaultWithholdingRate: 1.5,
  withholdingThreshold: 1000,
  authorizedUsers: ["contact@elyssa.pro"],
  companyLogo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=",
  companyAddress: "Rue du Lac Windermere, Les Berges du Lac 2, 1053 Tunis, Tunisie",
  companyPhone: "+216 71 862 100",
  companyEmail: "contact@elyssa.pro",
  companyMF: "1458932/A/M/000",
  geminiApiKey: "",
  googleAnalyticsId: "",
  googleAdsId: "",
  robotsTxt: "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n",
  sitemapXml: "https://elyssa.pro/",
  seoTitle: "Elyssa ERP | Progiciel de Gestion Intégré & Pilotage d'Entreprise",
  seoDescription: "Elyssa ERP - Solution intégrée de gestion globale pour entreprises en Tunisie.",
  seoKeywords: "Elyssa ERP, ERP Tunisie, Gestion Intégrée",
  ogImage: "",
  legalForm: "Société Anonyme",
  shareCapital: 100000,
  rneNumber: "1458932RNE",
  legalRepresentative: "MED ZIED BEN MILED",
  cityZipCode: "Tunis 1053",
  website: "https://elyssa.pro"
};

export const INITIAL_CLIENTS: Client[] = [
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
  },
  {
    id: "demo-cli_4",
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
        title: "Règlement encaissement en attente & approvisionnement",
        description: "Pointage de la traite échue et validation du planning de livraison tubes.",
        dueDate: "2026-08-25",
        status: "Pending",
        is_demo: true
      }
    ],
    is_demo: true
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "demo-prod_1",
    sku: "CIM-CPJ45",
    name: "Ciment CPJ 45 (Sac 50kg)",
    category: "Gros Œuvre",
    type: "PRODUIT_FINI",
    unitPrice: 14.500,
    costPrice: 11.200,
    marginPercentage: 29.46,
    stockLevel: 1200,
    minStockLevel: 300,
    unit: "Sac",
    supplierId: "demo-sup_1",
    supplierName: "Les Ciments de Bizerte",
    createdDate: "2026-01-15",
    warehouseId: "WH-RADES-01",
    warehouse_location: "Dépôt Central Radès"
  },
  {
    id: "demo-prod_2",
    sku: "FER-BETON-12",
    name: "Rond à béton Ø12mm (Barre 12m)",
    category: "Gros Œuvre",
    type: "PRODUIT_FINI",
    unitPrice: 28.000,
    costPrice: 21.000,
    marginPercentage: 33.33,
    stockLevel: 850,
    minStockLevel: 200,
    unit: "Barre",
    supplierId: "demo-sup_2",
    supplierName: "EL FOULADH Menzel Bourguiba",
    createdDate: "2026-01-15",
    warehouseId: "WH-RADES-01",
    warehouse_location: "Dépôt Central Radès"
  },
  {
    id: "demo-prod_3",
    sku: "PNT-BLA-15L",
    name: "Peinture Blanche 15L",
    category: "Finition & Décoration",
    type: "PRODUIT_FINI",
    unitPrice: 85.000,
    costPrice: 62.000,
    marginPercentage: 37.10,
    stockLevel: 180,
    minStockLevel: 40,
    unit: "Pot",
    supplierId: "demo-sup_3",
    supplierName: "Astral Tunisie",
    createdDate: "2026-02-01",
    warehouseId: "WH-TUNIS-02",
    warehouse_location: "Magasin Principal Tunis"
  },
  {
    id: "demo-prod_4",
    sku: "OUT-PRO-230",
    name: "Outillage pro (Meuleuse & Découpe 230mm)",
    category: "Outillage Pro",
    type: "PRODUIT_FINI",
    unitPrice: 145.000,
    costPrice: 105.000,
    marginPercentage: 38.10,
    stockLevel: 95,
    minStockLevel: 20,
    unit: "Unité",
    supplierId: "demo-sup_4",
    supplierName: "Bosch Tunisie Tools",
    createdDate: "2026-02-10",
    warehouseId: "WH-TUNIS-02",
    warehouse_location: "Magasin Principal Tunis"
  },
  {
    id: "demo-prod_5",
    sku: "PLA-BA13-30",
    name: "Plaques de Plâtre BA13 Standard (120x300cm)",
    category: "Gros Œuvre",
    type: "PRODUIT_FINI",
    unitPrice: 26.000,
    costPrice: 18.500,
    marginPercentage: 40.54,
    stockLevel: 0,
    minStockLevel: 50,
    unit: "Plaque",
    supplierId: "demo-sup_5",
    supplierName: "Knauf Tunisie",
    createdDate: "2026-03-01",
    warehouseId: "WH-CHARGUIA-02",
    warehouse_location: "Entrepôt Central - Charguia II"
  },
  {
    id: "demo-prod_6",
    sku: "COL-CAR-25",
    name: "Mortier Colle C2TE Haute Performance (Sac 25kg)",
    category: "Finition & Décoration",
    type: "PRODUIT_FINI",
    unitPrice: 21.000,
    costPrice: 14.200,
    marginPercentage: 47.89,
    stockLevel: 12,
    minStockLevel: 40,
    unit: "Sac",
    supplierId: "demo-sup_6",
    supplierName: "Sika Tunisie",
    createdDate: "2026-03-10",
    warehouseId: "WH-SFAX-01",
    warehouse_location: "Dépôt Régional - Sfax"
  }
];

export const INITIAL_INVOICES: Invoice[] = [
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
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
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
    status: 'Active',
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
    status: 'Active',
    is_demo: true
  },
  {
    id: "demo-sup_3",
    name: "Astral Tunisie",
    contactName: "Hichem Jaziri",
    email: "commandes@astral.tn",
    phone: "+216 71 430 100",
    address: "Zone Industrielle Megrine, Ben Arous",
    category: "Peintures & Revêtements",
    paymentTerms: "30 jours",
    rating: 4.7,
    status: 'Active',
    is_demo: true
  },
  {
    id: "demo-sup_4",
    name: "Bosch Tunisie Tools",
    contactName: "Slimane Chahed",
    email: "pro@bosch-tools.tn",
    phone: "+216 71 880 900",
    address: "Zone Industrielle Charguia I, Tunis",
    category: "Outillage Professionnel",
    paymentTerms: "30 jours fin de mois",
    rating: 4.9,
    status: 'Active',
    is_demo: true
  },
  {
    id: "demo-sup_5",
    name: "Knauf Tunisie",
    contactName: "Mehdi Trabelsi",
    email: "contact@knauf.tn",
    phone: "+216 71 940 300",
    address: "Zone Industrielle Charguia II, Tunis",
    category: "Plaques & Systèmes Plâtre",
    paymentTerms: "30 jours",
    rating: 4.8,
    status: 'Active',
    is_demo: true
  },
  {
    id: "demo-sup_6",
    name: "Sika Tunisie",
    contactName: "Anis Khemir",
    email: "commandes@tn.sika.com",
    phone: "+216 70 022 700",
    address: "Zone Industrielle Ksar Saïd, Manouba",
    category: "Colles & Chimie du Bâtiment",
    paymentTerms: "45 jours fin de mois",
    rating: 4.9,
    status: 'Active',
    is_demo: true
  },
  {
    id: "demo-sup_import",
    name: "Marseille Chimie & Outillage SAS",
    contactName: "Jean-Luc Morel",
    email: "import@marseille-chimie.fr",
    phone: "+33 4 91 00 22 33",
    address: "Marseille, France / Port de Radès",
    category: "Matières Premières & Import",
    paymentTerms: "Crédoc BIAT (L/C Confirmée)",
    rating: 4.9,
    status: 'Active',
    is_demo: true
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "demo-sm_1",
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
];

export const INITIAL_COMPLAINTS: Complaint[] = [];
export const INITIAL_COMPETITORS: CompetitorReport[] = [];
export const INITIAL_VISIT_REPORTS: VisitReport[] = [
  {
    id: "demo-vr_1",
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
];
export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [];
export const INITIAL_COMMUNICATION_LOGS: CommunicationLog[] = [];

export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromName: "",
  fromEmail: "",
  isEnabled: false,
  provider: "smtp",
  resendApiKey: ""
};

export const DEFAULT_IMAP_SETTINGS = {
  host: "",
  port: 993,
  secure: true,
  user: "",
  pass: "",
  isEnabled: false
};

export const PARENT_EDITOR_SMTP_SETTINGS: SmtpSettings = {
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  user: "contact@elyssa.pro",
  pass: "",
  fromName: "Elyssa ERP Suite",
  fromEmail: "contact@elyssa.pro",
  isEnabled: true,
  provider: "smtp",
  resendApiKey: ""
};

export const PARENT_EDITOR_IMAP_SETTINGS = {
  host: "imap.hostinger.com",
  port: 993,
  secure: true,
  user: "contact@elyssa.pro",
  pass: "",
  isEnabled: true
};

export const INITIAL_INCOMING_EMAILS: any[] = [];

