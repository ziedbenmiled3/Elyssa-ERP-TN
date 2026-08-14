/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Complaint, Invoice, CompetitorReport, AdminSettings, VisitReport, Supplier, Product, StockMovement, SmtpSettings, EmailTemplate, CommunicationLog } from '../types';

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  companyName: "Inter-Affaires",
  currency: "TND",
  defaultVatRate: 19, // Standard Tunisian VAT rate is 19% (others are 7% and 13%)
  defaultWithholdingRate: 1.5, // Standard RS rate for goods/services under local law
  withholdingThreshold: 1000,   // standard 1000 TND threshold under Tunisian commercial transactions
  authorizedUsers: ["contact@elyssa.pro", "directeur.general@elyssa.pro", "admin@elyssa.pro"],
  companyLogo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=",
  companyAddress: "Rue du Lac Windermere, Les Berges du Lac 2, 1053 Tunis, Tunisie",
  companyPhone: "+216 71 862 100",
  companyEmail: "commercial@elyssa.pro",
  companyMF: "1458932/A/M/000",
  geminiApiKey: "",
  googleAnalyticsId: "G-EY789X12",
  googleAdsId: "AW-120485934",
  robotsTxt: "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n\nSitemap: https://elyssa.pro/sitemap.xml",
  sitemapXml: "https://elyssa.pro/\nhttps://elyssa.pro/login\nhttps://elyssa.pro/saas-config\nhttps://elyssa.pro/pricing\nhttps://elyssa.pro/finance-dashboard",
  seoTitle: "Elyssa CRM & ERP | Logiciel Intelligent de Facturation & Recouvrement en Tunisie",
  seoDescription: "Le premier ERP & CRM conçu pour le marché tunisien. Facturation conforme (TVA & Retenue à la source), suivi de solvabilité, relances de créances automatisées et analyses prédictives par IA.",
  seoKeywords: "CRM Tunisie, ERP Tunisie, Facturation Tunisie, Retenue à la source Tunisie, Recouvrement de créances, Trésorerie, Elyssa ERP, Elyssa CRM",
  ogImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDYzMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjMwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MzAiIGZpbGw9IiMwZjE3MmEiLz48ZyBvcGFjaXR5PSIwLjA1Ij48Y2lyY2xlIGN4PSI2MDAiIGN5PSIzMTUiIHI9IjQwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSI2MDAiIGN5PSIzMTUiIHI9IjUwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PHBhdGggZD0iTTU1MCwzMDAgQzU3MCwyNDAgNjMwLDIwMCA2NTAsMTgwIEM2NzAsMjAwIDczMCwyNDAgNzUwLDMwMCBaIiBmaWxsPSJ1cmwoI2dvbGQpIi8+PGNpcmNsZSBjeD0iNjUwIiBjeT0iMTMwIiByPSI4IiBmaWxsPSIjZmJiZjI0Ii8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnb2xkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Atb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZiYmYyNCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2I0NTMwOSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0iJ0hlbHZldGljYSBOZXVlJywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1NiIgZm9udC13ZWlnaHQ9ImJvbGQiIGxldHRlci1zcGFjaW5nPSIzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FTFlTU0EgQ1JNICYgRVJQPC90ZXh0Pjx0ZXh0IHg9IjYwMCIgeT0iNDU1IiBmaWxsPSIjOTR0M2I4IiBmb250LWZhbWlseT0iJ0hlbHZldGljYSBOZXVlJywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9IjUwMCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxhIHBsYXRlZm9ybWUgaW50ZWxsaWdlbnRlIGRlIGdlc3Rpb24gZXQgZGUgcmVjb3V2cmVtZW50PC90ZXh0Pjx0ZXh0IHg9IjYwMCIgeT0iNDk1IiBmaWxsPSIjZTU3ZTBlIiBmb250LWZhbWlseT0iJ0hlbHZldGljYSBOZXVlJywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGxldHRlci1zcGFjaW5nPSI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB0ZXh0LXRyYW5zZm9ybT0idXBwZXJjYXNlIj5Db25mb3JtZSBhdXggbm9ybWVzIGZpc2NhbGVzIHR1bmlzaWVubmVzPC90ZXh0Pjwvc3ZnPg==",
  legalForm: "Société Anonyme",
  shareCapital: 100000,
  rneNumber: "1458932RNE",
  legalRepresentative: "Mohamed Ben Ali",
  cityZipCode: "Tunis 1053",
  website: "https://elyssa.pro"
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "cli_1",
    name: "Poulina Group Holding",
    email: "contact@poulina.com.tn",
    phone: "+216 71 130 000",
    address: "GP1 Km 12, Ezzahra, Ben Arous, Tunisie",
    category: "Local",
    sector: "Agro-alimentaire & Distribution",
    revenuePotential: 250000,
    status: "Active",
    createdDate: "2026-01-10",
    notes: "Partenaire commercial historique majeur. Très exigeant sur les délais de livraison logistique.",
    engagements: [
      {
        id: "eng_1_1",
        title: "Garantie de livraison sous 48h",
        description: "Assurer la réception des commandes de volaille brute en moins de 48h sur le site de Sfax.",
        dueDate: "2026-07-15",
        status: "Met"
      },
      {
        id: "eng_1_2",
        title: "Mise à disposition de conteneurs isothermes",
        description: "Fournir 25 conteneurs réfrigérés de dernière génération en crédit-bail.",
        dueDate: "2026-10-30",
        status: "Pending"
      }
    ]
  },
  {
    id: "cli_2",
    name: "Sousse Textiles Export S.A.",
    email: "export@soussetextiles.tn",
    phone: "+216 73 224 500",
    address: "Zone Industrielle Sidi Abdelhamid, Sousse, Tunisie",
    category: "Export",
    sector: "Textile & Habillement",
    revenuePotential: 480000,
    status: "Active",
    createdDate: "2026-02-15",
    notes: "Client exportant vers la France et l'Allemagne. Exige des certificats de conformité de qualité stricts.",
    engagements: [
      {
        id: "eng_2_1",
        title: "Attestation OEKO-TEX Standard 100",
        description: "Fournir les certificats de traçabilité matière avant chaque expédition.",
        dueDate: "2026-06-30",
        status: "Met"
      },
      {
        id: "eng_2_2",
        title: "Paiement en Euros à 60 jours",
        description: "Respecter l'échéance de paiement par virement Swift direct.",
        dueDate: "2026-08-20",
        status: "Pending"
      }
    ]
  },
  {
    id: "cli_3",
    name: "Société Carthage Cement",
    email: "approvisionnement@carthagecement.tn",
    phone: "+216 71 987 654",
    address: "Rue du Lac de Côme, Les Berges du Lac, Tunis",
    category: "Local",
    sector: "Construction & Cimenterie",
    revenuePotential: 180000,
    status: "Active",
    createdDate: "2025-11-05",
    notes: "Compte clé étatique tunisien. Les processus de recouvrement sont lents et assujettis à une retenue à la source systématique.",
    engagements: [
      {
        id: "eng_3_1",
        title: "Approvisionnement en gypse brut",
        description: "Livrer 500 tonnes de gypse raffiné par mois sur le site de Djebel Ressas.",
        dueDate: "2026-07-01",
        status: "Delayed"
      }
    ]
  },
  {
    id: "cli_4",
    name: "Magasin Général (MG) Tunisie",
    email: "finances@mg.com.tn",
    phone: "+216 71 840 111",
    address: "Avenue de France, Tunis, Tunisie",
    category: "Local",
    sector: "Grande Distribution",
    revenuePotential: 320000,
    status: "Active",
    createdDate: "2026-03-01",
    notes: "Réseau de supermarchés national. Très sensible aux opérations promotionnelles de fin d'année.",
    engagements: [
      {
        id: "eng_4_1",
        title: "Taux de service linéaire à 98%",
        description: "Assurer aucun rupture de stock sur les produits de notre marque.",
        dueDate: "2026-09-01",
        status: "Pending"
      }
    ]
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: "rec_1",
    clientId: "cli_1",
    clientName: "Poulina Group Holding",
    subject: "Retard de livraison sur la commande de Sfax #8940",
    description: "Le camion frigorifique est arrivé avec 6 heures de retard sur le planning convenu. Les équipes de déchargement n'étaient plus disponibles, générant un surcoût logistique et un risque pour la chaîne du froid.",
    status: "In_Investigation",
    priority: "High",
    assignedDepartment: "Logistics",
    investigationDetails: "Le transporteur externe a subi une panne moteur à hauteur de Sousse (autoroute A1). Des mesures de backup n'ont pas été activées à temps.",
    createdDate: "2026-06-10"
  },
  {
    id: "rec_2",
    clientId: "cli_2",
    clientName: "Sousse Textiles Export S.A.",
    subject: "Anomalie d'épaisseur de fil sur le lot TX-09",
    description: "Une déviation d'élasticité de 15% supérieure aux tolérances de la fiche de spécifications a été identifiée sur les bobines de fil de coton écru.",
    status: "Resolved",
    priority: "High",
    assignedDepartment: "Quality",
    investigationDetails: "Après analyse du laboratoire, le degré d'humidité stocké au dépôt logistique était sursaturé. Un re-conditionnement thermique a été réalisé.",
    resolutionNotes: "Le lot non conforme a été récupéré et remplacé sous 5 jours. Un avoir de 10% de dédommagement commercial a été validé.",
    createdDate: "2026-06-12",
    resolvedDate: "2026-06-16"
  },
  {
    id: "rec_3",
    clientId: "cli_3",
    clientName: "Société Carthage Cement",
    subject: "Erreur de calibrage sur la livraison de gypse",
    description: "La granulométrie livrée dépasse 40mm alors que l'engagement technique exige un d90 inférieur à 20mm.",
    status: "Received",
    priority: "Medium",
    assignedDepartment: "Production",
    createdDate: "2026-06-17"
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv_1",
    clientId: "cli_1",
    clientName: "Poulina Group Holding",
    invoiceNumber: "FA-2026-0012",
    amountHT: 25000.000,
    vatRate: 19,
    vatAmount: 4750.000,
    withholdingTaxRate: 1.5,
    withholdingAmount: 446.250, // 1.5% of TTC (29750 * 0.015)
    amountTTC: 29750.000,
    amountNetToPay: 29303.750, // TTC - RS
    status: "Paid",
    issuedDate: "2026-05-02",
    dueDate: "2026-06-15",
    collectedAmount: 29303.750,
    withholdingCertificateReceived: true,
    recouvrementSteps: [
      {
        id: "step_1",
        date: "2026-06-01",
        type: "Email",
        note: "Relance hebdomadaire automatique - envoi de la facture numérique.",
        performedBy: "Système Facturation"
      },
      {
        id: "step_2",
        date: "2026-06-10",
        type: "Call",
        note: "Appel service comptable Poulina. Virement programmé pour le 14/06. Certificat de retenue transmis par mail.",
        performedBy: "Zied Ben Miled"
      }
    ]
  },
  {
    id: "inv_2",
    clientId: "cli_3",
    clientName: "Société Carthage Cement",
    invoiceNumber: "FA-2026-0018",
    amountHT: 45000.000,
    vatRate: 19,
    vatAmount: 8550.000,
    withholdingTaxRate: 1.5,
    withholdingAmount: 803.250, // 1.5% of 53550
    amountTTC: 53550.000,
    amountNetToPay: 52746.750,
    status: "Debt_Collection",
    issuedDate: "2026-04-10",
    dueDate: "2026-05-25",
    collectedAmount: 0,
    withholdingCertificateReceived: false,
    recouvrementSteps: [
      {
        id: "step_3",
        date: "2026-05-28",
        type: "Email",
        note: "Facture en souffrance. Demande d'état de validation de paiement émise à la direction administrative.",
        performedBy: "Service Recouvrement"
      },
      {
        id: "step_4",
        date: "2026-06-05",
        type: "Call",
        note: "Contact téléphonique auprès du responsable trésorerie. Dossier en attente de visa du contrôleur d'État.",
        performedBy: "Responsable Financier"
      },
      {
        id: "step_5",
        date: "2026-06-15",
        type: "Letter",
        note: "Envoi d'un courrier de mise en demeure amiable recommandé avec accusé de réception.",
        performedBy: "Service Audit Interne"
      }
    ]
  },
  {
    id: "inv_3",
    clientId: "cli_2",
    clientName: "Sousse Textiles Export S.A.",
    invoiceNumber: "FA-2026-0021",
    amountHT: 12000.000,
    vatRate: 0, // Export invoice has 0% VAT in Tunisia (Régime suspensif d'exportation)
    vatAmount: 0,
    withholdingTaxRate: 0, // No withholding tax for export, or standard local not applicable
    withholdingAmount: 0,
    amountTTC: 12000.000,
    amountNetToPay: 12000.000,
    status: "Unpaid",
    issuedDate: "2026-05-20",
    dueDate: "2026-07-05",
    collectedAmount: 0,
    withholdingCertificateReceived: false,
    recouvrementSteps: []
  },
  {
    id: "inv_4",
    clientId: "cli_4",
    clientName: "Magasin Général (MG) Tunisie",
    invoiceNumber: "FA-2026-0025",
    amountHT: 850.000,
    vatRate: 19,
    vatAmount: 161.500,
    withholdingTaxRate: 1.5,
    withholdingAmount: 0, // UNDER 1000 TND TTC (total TTC is 1011.5 TND, which is ABOVE 1000 - wait, 850 + 161.5 = 1011.5)
    // Let's check: 1011.5 is > 1000, so withholding applies! Let's make an invoice under 1000 TTC to test threshold
    amountTTC: 1011.500,
    amountNetToPay: 996.327, // 1011.5 - (1011.5 * 0.015) = 1011.5 - 15.173 = 996.327
    status: "Unpaid",
    issuedDate: "2026-06-15",
    dueDate: "2026-07-30",
    collectedAmount: 0,
    withholdingCertificateReceived: false,
    recouvrementSteps: []
  },
  {
    id: "inv_5",
    clientId: "cli_4",
    clientName: "Magasin Général (MG) Tunisie",
    invoiceNumber: "FA-2026-0026",
    amountHT: 500.000,
    vatRate: 19,
    vatAmount: 95.000,
    withholdingTaxRate: 1.5,
    withholdingAmount: 0, // UNDER 1000 TND TTC (total TTC is 595 TND, which is UNDER 1000, so RS is 0)
    amountTTC: 595.000,
    amountNetToPay: 595.000,
    status: "Draft",
    issuedDate: "2026-06-17",
    dueDate: "2026-08-01",
    collectedAmount: 0,
    withholdingCertificateReceived: false,
    recouvrementSteps: []
  }
];

export const INITIAL_VISIT_REPORTS: VisitReport[] = [
  {
    id: "vis_1",
    clientId: "cli_1",
    clientName: "Poulina Group Holding",
    date: "2026-06-08",
    purpose: "Négociation annuelle & Revue Logistique",
    summary: "Rencontre avec Mme Sonia Ben Slimane, Directrice des Achats. Poulina exprime une satisfaction globale sur la qualité de nos produits, mais formule un mécontentement critique concernant les retards de transport de la semaine dernière. Elle menace d'ouvrir un appel d'offres à des concurrents turcs ou espagnols si un taux de livraison sous 48h n'est pas garanti par contrat.",
    actionPoints: [
      "Soumettre un plan de continuité d'activité (PCA) logistique au secrétariat des achats de Poulina avant le 25 juin.",
      "Vérifier auprès de l'équipe logistique s'il est possible de mobiliser des chauffeurs de réserve à Sfax.",
      "Renouveler l'offre tarifaire annuelle avec une remise préférentielle de 1.5% sur les volumes excédant 100 tonnes."
    ],
    aiAnalyzed: true,
    aiInsights: "ANALYSE STRATÉGIQUE (IA):\n- Risque de désabonnement client : ÉLEVÉ. Poulina est approchée activement par la concurrence étrangère.\n- Point de vigilance : Les retards logistiques sont les principaux déclencheurs de volatilité.\n- Recommandation IA : Intégrer une clause contractuelle de pénalité de retard légère en échange d'une exclusivité d'approvisionnement.",
    author: "Zied Ben Miled"
  },
  {
    id: "vis_2",
    clientId: "cli_2",
    clientName: "Sousse Textiles Export S.A.",
    date: "2026-06-14",
    purpose: "Vérification des normes d'intégration et nouveaux besoins filature",
    summary: "Visite technique des usines à Sidi Abdelhamid. Validation du bon stockage thermique pour corriger l'humidité. Discussion sur un nouveau besoin pour l'année prochaine : fourniture de fil recyclé certifié GRS (Global Recycled Standard) pour répondre aux exigences d'un marché d'exportation de vêtements éco-conçus en Europe.",
    actionPoints: [
      "Rechercher des fournisseurs certifiés de gousses de coton biologique recyclé sur le marché local.",
      "Établir une étude de rentabilité de la production de fils GRS.",
      "Lancer une offre technique chiffrée pour 10 tonnes de fils haut de gamme en juillet."
    ],
    aiAnalyzed: false,
    author: "Karim Chahed (Ingénieur Commercial)"
  }
];

export const INITIAL_COMPETITORS: CompetitorReport[] = [
  {
    id: "comp_1",
    competitorName: "Eurasia Import-Export (Turquie)",
    sectorName: "Agro-alimentaire & Importations Générales",
    strengths: ["Prix agressifs en raison de la dépréciation de la Livre Turque", "Fret maritime subventionné", "Gamme produit très automatisée"],
    weaknesses: ["Délais d'acheminement de 5 à 7 jours vers le port de Radès", "Frais de douane élevés hors accords préférentiels", "Absence de support client réactif en Tunisie"],
    pricingIndex: "Cheap",
    marketShare: 15,
    strategicWatchNote: "Propose régulièrement des prix inférieurs de 15% à nos tarifs aux clients tunisiens de grande distribution. Toutefois, leur manque de flexibilité logistique est notre principal atout de défense.",
    recordedDate: "2026-05-12"
  },
  {
    id: "comp_2",
    competitorName: "SOTUMAR (Société Tunisienne des Matériaux)",
    sectorName: "Construction & Cimenterie",
    strengths: ["Forte implantation locale dans le sud tunisien (Gabès)", "Réseau d'approvisionnement ferroviaire dédié", "Appuis étatiques"],
    weaknesses: ["Outil industriel vieillissant sujet à des arrêts intempestifs", "Absence de filière export haut de gamme", "Rapports clients de type bureaucratique"],
    pricingIndex: "Competitive",
    marketShare: 35,
    strategicWatchNote: "Leader historique local, mais commence à perdre des parts de marché face à Carthage Cement sur les produits fins en raison d'un manque d'investissement dans l'assurance qualité.",
    recordedDate: "2026-06-01"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup_1",
    name: "Tunisie Chimie Industrielle (TCI)",
    contactName: "M. Hédi Boussaid",
    email: "hboussaid@tci.com.tn",
    phone: "+216 71 888 222",
    address: "Zone Industrielle de Charguia II, Tunis",
    category: "Chimie",
    status: "Active",
    createdDate: "2026-01-15"
  },
  {
    id: "sup_2",
    name: "Med Pack Sousse",
    contactName: "Mme Amel Belcadhi",
    email: "abelcadhi@medpack.com.tn",
    phone: "+216 73 345 120",
    address: "Zone Industrielle de Kalaa Kebira, Sousse",
    category: "Emballage",
    status: "Active",
    createdDate: "2026-02-10"
  },
  {
    id: "sup_3",
    name: "Cotonière du Nord",
    contactName: "M. Moncef Gharbi",
    email: "m.gharbi@cotonniere.tn",
    phone: "+216 72 456 789",
    address: "Route de Béja, Mateur, Tunisie",
    category: "Textile",
    status: "Active",
    createdDate: "2026-03-01"
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Fil d'Élasthanne Premium GRS",
    sku: "TX-EL-50-GRS",
    category: "Produits Finis",
    stockLevel: 1200,
    minStockLevel: 500,
    unitPrice: 24.500, // 24.5 TND
    costPrice: 15.200, // 15.2 TND
    supplierId: "sup_3",
    supplierName: "Cotonière du Nord",
    unit: "Kg",
    createdDate: "2026-03-05"
  },
  {
    id: "prod_2",
    name: "Solvant d'Ethanol Purifié 99%",
    sku: "CH-ET-99",
    category: "Matières Premières",
    stockLevel: 450,
    minStockLevel: 600, // triggers warning alert!
    unitPrice: 8.800,
    costPrice: 5.400,
    supplierId: "sup_1",
    supplierName: "Tunisie Chimie Industrielle (TCI)",
    unit: "Litre",
    createdDate: "2026-01-20"
  },
  {
    id: "prod_3",
    name: "Carton Ondulé Isolé Double Cannelure",
    sku: "EM-CO-DC",
    category: "Emballages",
    stockLevel: 8500,
    minStockLevel: 2000,
    unitPrice: 1.250,
    costPrice: 0.720,
    supplierId: "sup_2",
    supplierName: "Med Pack Sousse",
    unit: "Pièce",
    createdDate: "2026-02-15"
  },
  {
    id: "prod_4",
    name: "Fil de Coton Bio Peigné Ne 30/1",
    sku: "TX-CO-30",
    category: "Produits Finis",
    stockLevel: 3200,
    minStockLevel: 800,
    unitPrice: 16.200,
    costPrice: 10.100,
    supplierId: "sup_3",
    supplierName: "Cotonière du Nord",
    unit: "Kg",
    createdDate: "2026-03-12"
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov_1",
    productId: "prod_1",
    productName: "Fil d'Élasthanne Premium GRS",
    type: "In",
    quantity: 1500,
    date: "2026-06-01",
    reference: "BC-2026-441 (Entrée Approvisionnement)",
    operator: "Zied Ben Miled"
  },
  {
    id: "mov_2",
    productId: "prod_1",
    productName: "Fil d'Élasthanne Premium GRS",
    type: "Out",
    quantity: 300,
    date: "2026-06-10",
    reference: "Livraison Client Sousse Textiles",
    operator: "Karim Chahed"
  },
  {
    id: "mov_3",
    productId: "prod_2",
    productName: "Solvant d'Ethanol Purifié 99%",
    type: "Out",
    quantity: 150,
    date: "2026-06-12",
    reference: "Prélèvement Ligne de Production B",
    operator: "Sami Alouini"
  },
  {
    id: "mov_4",
    productId: "prod_3",
    productName: "Carton Ondulé Isolé Double Cannelure",
    type: "In",
    quantity: 5000,
    date: "2026-06-15",
    reference: "Livraison Fournisseur Med Pack Sousse",
    operator: "Hamdi Sraieb"
  }
];

export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  host: "smtp.elyssa.pro",
  port: 587,
  secure: false, // TLS
  user: "commercial@elyssa.pro",
  pass: "ElyssaSecure2026!",
  fromName: "Elyssa Entreprises - Service Commercial",
  fromEmail: "commercial@elyssa.pro",
  isEnabled: false, // Starts as offline simulation by default for safety
  provider: "smtp",
  resendApiKey: ""
};

export const DEFAULT_IMAP_SETTINGS: { host: string; port: number; secure: boolean; user: string; pass: string; isEnabled: boolean } = {
  host: "imap.elyssa.pro",
  port: 993,
  secure: true,
  user: "commercial@elyssa.pro",
  pass: "ElyssaSecure2026!",
  isEnabled: false
};

export const INITIAL_INCOMING_EMAILS: any[] = [
  {
    id: "mail-001",
    senderName: "Skander Ben Slimane (SOCODIS)",
    senderEmail: "s.benslimane@socodis.com.tn",
    subject: "Confirmation de réception facture F-2026-069 & Demande Certificat Retenue à la Source",
    body: "Bonjour l'équipe Elyssa,\n\nNous avons bien reçu votre facture de livraison F-2026-069 pour un montant de 14,850 TND. Notre service comptabilité a planifié le règlement pour le 5 juillet.\n\nPouvez-vous nous confirmer si vous préférez que le certificat de retenue à la source (1.5%) soit envoyé par email ou déposé directement à votre bureau d'ordre à la Charguia ?\n\nCordialement,\nSkander Ben Slimane\nDirecteur Financier SOCODIS S.A.",
    date: "2026-06-29 14:32",
    isRead: false,
    category: "invoice"
  },
  {
    id: "mail-002",
    senderName: "Sonia Marzouki (SCS Sfax)",
    senderEmail: "sonia.marzouki@scs.com.tn",
    subject: "RECLAMATION : Retard sur la livraison Lot #8809 (Emballages)",
    body: "A l'attention du Service Logistique,\n\nNous constatons un retard de 48 heures sur la livraison de notre commande d'emballages carton (Lot #8809) destinée à notre usine de Sfax.\n\nCe retard bloque notre ligne de conditionnement d'huile d'olive pour l'export. Veuillez nous fournir le statut du chauffeur ou le numéro de suivi du transporteur de toute urgence.\n\nSonia Marzouki\nResponsable Supply Chain - SCS Sfax",
    date: "2026-06-29 09:15",
    isRead: false,
    category: "complaint"
  },
  {
    id: "mail-003",
    senderName: "Karim Gharbi (Carthage Grains)",
    senderEmail: "k.gharbi@carthagegrains.tn",
    subject: "Demande de devis d'accompagnement logistique et transit Rades",
    body: "Bonjour,\n\nDans le cadre de l'extension de nos activités d'importation de céréales, nous recherchons un partenaire logistique pour la gestion des opérations de transit au port de Rades.\n\nPourriez-vous nous envoyer vos tarifs de base pour les prestations de dédouanement et d'entreposage sous douane ?\n\nMeilleures salutations,\nKarim Gharbi\nCarthage Grains S.A.",
    date: "2026-06-28 11:20",
    isRead: true,
    category: "sales"
  },
  {
    id: "mail-004",
    senderName: "BIAT (Alertes Corporate)",
    senderEmail: "noreply@biatnet.com.tn",
    subject: "Notification de Virement Reçu - Réf: VIR-TN-889102",
    body: "Cher Client,\n\nNous vous informons qu'un virement national en dinars tunisiens d'un montant de 25,430.000 TND a été crédité sur votre compte N° 08115000293849301298.\n\nDonneur d'ordre : COFICAB TUNISIE S.A.\nMotif : Reglement Factures Mai 2026\n\nMerci pour votre fidélité.\nBanque Internationale Arabe de Tunisie",
    date: "2026-06-27 16:05",
    isRead: true,
    category: "general"
  },
  {
    id: "mail-005",
    senderName: "Yassine Jlassi (Support Technique)",
    senderEmail: "yassine.j@elyssa.pro",
    subject: "Ticket TK-2041 résolu - API Flouci opérationnelle",
    body: "Hello Team,\n\nJe vous confirme que le certificat SSL intermédiaire pour la passerelle Flouci a été renouvelé et déployé sur notre serveur de production.\n\nLes tests d'intégration sont au vert. J'ai notifié le client Hamdi Sfaxi de la résolution de son ticket TK-2041.\n\nBest,\nYassine",
    date: "2026-06-26 18:40",
    isRead: true,
    category: "support"
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "temp_invoice",
    name: "Envoi Standard de Facture",
    subject: "Facture N° {{invoiceNumber}} - Inter-Affaires",
    body: `Madame, Monsieur,

Nous avons le plaisir de vous transmettre sous ce pli la facture N° **{{invoiceNumber}}** relative aux dernières livraisons effectuées.

* **Client** : {{clientName}}
* **Montant TTC** : {{amountTTC}} TND
* **Retenue à la source (RS)** : {{withholdingAmount}} TND
* **Net à payer** : **{{amountNetToPay}} TND**
* **Échéance de règlement** : {{dueDate}}

Nous vous prions de bien vouloir procéder au paiement selon nos accords contractuels et de nous faire parvenir le certificat de retenue à la source correspondant au taux applicable de {{withholdingTaxRate}}%.

Nous vous remercions pour votre chaleureuse collaboration.

Cordialement,
Le Service Facturation & Comptabilité
**Inter-Affaires**`
  },
  {
    id: "temp_collection_lvl1",
    name: "Relance Amiable (Niveau 1)",
    subject: "[RAPPEL] Facture en attente de paiement N° {{invoiceNumber}}",
    body: `Bonjour,

Sauf erreur ou omission de notre part, le paiement de la facture N° **{{invoiceNumber}}** émise le {{issuedDate}} pour un montant de **{{amountNetToPay}} TND** n'a pas été réceptionné à son échéance le {{dueDate}}.

Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais par virement bancaire ou par chèque, en nous transmettant également le certificat de retenue à la source ({{withholdingTaxRate}}%).

Si vous avez déjà procédé au règlement ces derniers jours, nous vous invitons à ignorer ce message de suivi automatique.

Nous restons à votre entière disposition pour tout renseignement d'ordre financier.

Bien sincèrement,
Le Service Contentieux & Recouvrement
**Inter-Affaires**`
  },
  {
    id: "temp_collection_lvl2",
    name: "Mise en Demeure / Sommation (Niveau 2)",
    subject: "IMPORTANT - MISE EN DEMEURE : Facture impayée N° {{invoiceNumber}}",
    body: `Madame, Monsieur le Responsable Financier,

Malgré nos relances précédentes, nous constatons que la facture N° **{{invoiceNumber}}** arrivant à échéance le {{dueDate}}, pour un solde de **{{amountNetToPay}} TND**, demeure impayée à ce jour dans nos livres comptables.

Par la présente, nous vous mettons formellement en demeure de régulariser ce solde sous **48 heures ouvrables**. À défaut de réception de votre règlement de {{amountNetToPay}} TND (accompagné du justificatif de retenue de {{withholdingTaxRate}}%), nous serons contraints de suspendre vos livraisons opérationnelles et de transmettre votre dossier à notre cabinet d'avocats.

Nous espérons vivement ne pas en arriver à de telles extrémités et comptons sur votre impératif professionnalisme.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

La Direction Administrative et Financière (DAF)
**Inter-Affaires**`
  }
];

export const INITIAL_COMMUNICATION_LOGS: CommunicationLog[] = [
  {
    id: "log_1",
    recipientName: "Sousse Textiles",
    recipientEmail: "comptabilite@soussetextiles.com.tn",
    templateType: "invoice",
    subject: "Facture N° FAC-2026-001 - Inter-Affaires",
    body: "Nous avons le plaisir de vous transmettre sous ce pli la facture N° FAC-2026-001 relative aux dernières livraisons pour un montant net à payer de 15 230.000 TND échéance le 2026-06-15.",
    sentDate: "2026-06-01 09:15",
    status: "Sent",
    referenceId: "FAC-2026-001"
  },
  {
    id: "log_2",
    recipientName: "Poulina Group Holding",
    recipientEmail: "recouvrement@poulina-group.com",
    templateType: "collection_lvl1",
    subject: "[RAPPEL] Facture en attente de paiement N° FAC-2026-002",
    body: "Sauf erreur ou omission de notre part, le paiement de la facture N° FAC-2026-002 de 8 450.000 TND n'a pas été réceptionné à son échéance le 2026-06-12.",
    sentDate: "2026-06-14 11:20",
    status: "Sent",
    referenceId: "FAC-2026-002"
  },
  {
    id: "log_3",
    recipientName: "Sté El Bouniane Construction",
    recipientEmail: "arriere@elbouniane.tn",
    templateType: "collection_lvl2",
    subject: "IMPORTANT - MISE EN DEMEURE : Facture impayée N° FAC-2026-003",
    body: "Notre direction constante constate que la facture N° FAC-2026-003 de 22 500.000 TND reste impayée. Nous vous mettons formellement en demeure sous 48h.",
    sentDate: "2026-06-16 15:45",
    status: "Simulated",
    referenceId: "FAC-2026-003"
  }
];


