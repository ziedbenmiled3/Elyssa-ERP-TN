export const COMPLETE_DEMO_DATA: Record<string, any[]> = {
  clients: [
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
  ],
  products: [
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
      marginPercentage: 33.33,
      stockLevel: 850,
      minStockLevel: 200,
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
      marginPercentage: 38.10,
      stockLevel: 95,
      minStockLevel: 20,
      unit: "Unité",
      supplierId: "demo-sup_4",
      supplierName: "Bosch Tunisie Tools",
      createdDate: "2026-02-10",
      warehouseId: "WH-TUNIS-02",
      warehouse_location: "Magasin Principal Tunis",
      is_demo: true
    }
  ],
  invoices: [
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
  ],
  documents: [
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
  ],
  suppliers: [
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
  ],
  purchaseOrders: [
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
  ],
  purchaseRequisitions: [
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
  ],
  supplierPerformance: [
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
  ],
  manufacturingOrders: [
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
  ],
  nomenclatures: [
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
  ],
  importFolders: [
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
  ],
  lcRequests: [
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
  ],
  vehicles: [
    {
      id: "demo-v_1",
      brand: "Peugeot",
      model: "Partner",
      licensePlate: "228 TUN 4091",
      category: "Véhicule Utilitaire",
      fuelType: "Diesel",
      driverName: "Hamza Ben Salem",
      mileage: 34200,
      purchasePrice: 62000,
      status: "Active",
      lastMaintenanceDate: "2026-07-10",
      nextMaintenanceMileage: 40000,
      is_demo: true
    },
    {
      id: "demo-v_2",
      brand: "Isuzu",
      model: "D-Max",
      licensePlate: "240 TN 8812",
      category: "Véhicule Utilitaire Pick-Up",
      fuelType: "Diesel",
      driverName: "Hamza Ben Salem",
      mileage: 51800,
      purchasePrice: 72000,
      status: "Active",
      lastMaintenanceDate: "2026-06-25",
      nextMaintenanceMileage: 60000,
      is_demo: true
    },
    {
      id: "demo-v_3",
      brand: "Citroën",
      model: "C-Élysée",
      licensePlate: "215 TUN 9811",
      category: "Véhicule Commercial Tourisme",
      fuelType: "Essence",
      driverName: "Mohamed Ali Gharbi",
      mileage: 42600,
      purchasePrice: 48000,
      status: "Active",
      lastMaintenanceDate: "2026-05-18",
      nextMaintenanceMileage: 50000,
      is_demo: true
    }
  ],
  missions: [
    {
      id: "demo-mo_1",
      missionNumber: "MIS-2026-001",
      driverName: "Hamza Ben Salem",
      vehiclePlate: "240 TN 8812 (Isuzu D-Max)",
      destination: "Tunis -> Sousse -> Sfax",
      purpose: "Livraison BTP & Approvisionnement",
      departureDate: "2026-08-10",
      returnDate: "2026-08-10",
      status: "Approved",
      allowanceAmount: 60.000,
      expenses: [
        { id: "exp_1", category: "Carburant", amount: 450.000, description: "Carburant TotalEnergies Tournée Sud" },
        { id: "exp_2", category: "Repas", amount: 35.000, description: "Frais repas déplacement livraison" }
      ],
      is_demo: true
    },
    {
      id: "demo-mo_2",
      missionNumber: "MIS-2026-002",
      driverName: "Mohamed Ali Gharbi",
      vehiclePlate: "215 TUN 9811 (Citroën C-Élysée)",
      destination: "Sousse & Sahel",
      purpose: "Prospection commerciale & recouvrement",
      departureDate: "2026-08-10",
      returnDate: "2026-08-10",
      status: "Approved",
      allowanceAmount: 50.000,
      expenses: [
        { id: "exp_3", category: "Carburant", amount: 120.000, description: "Carburant Agil Sousse" },
        { id: "exp_4", category: "Assurance", amount: 650.000, description: "Assurance flotte & vignette" }
      ],
      is_demo: true
    }
  ],
  expenses: [
    { id: "demo-exp_1", date: "2026-08-01", vehiclePlate: "240 TN 8812", category: "Carburant", amount: 450.000, provider: "TotalEnergies", description: "Carburant Isuzu D-Max", is_demo: true },
    { id: "demo-exp_2", date: "2026-08-03", vehiclePlate: "228 TUN 4091", category: "Entretien", amount: 280.000, provider: "Atelier Central", description: "Vidange et filtres Peugeot Partner", is_demo: true },
    { id: "demo-exp_3", date: "2026-08-05", vehiclePlate: "215 TUN 9811", category: "Assurance", amount: 650.000, provider: "Assurances STAR", description: "Assurance annuelle Citroën C-Élysée", is_demo: true }
  ],
  employees: [
    { id: 'demo-emp_0', matricule: 'EMP-0000', name: 'Meriam Doudou', email: 'm.doudou@carthage.com.tn', jobTitle: 'Gérante / Direction Générale', department: 'Direction Générale', ssn: '10019283-01', cin: '04123456', rib: '03001010015920038000', baseSalary: 4500.000, transportAllowance: 0, presenceAllowance: 0, otherAllowances: 0, familySituation: 'Married_2', isChefDeFamille: true, status: 'Active', hiringDate: '2022-01-01', is_demo: true },
    { id: 'demo-emp_1', matricule: 'EMP-0001', name: 'Khaled Ben Amor', email: 'k.benamor@carthage.com.tn', jobTitle: 'Directeur Financier & Recouvrement', department: 'Finance', ssn: '14839211-92', cin: '08912345', rib: '03001010015920038472', baseSalary: 2600.000, transportAllowance: 180.000, presenceAllowance: 80.000, otherAllowances: 300.000, familySituation: 'Married_2', isChefDeFamille: true, status: 'Active', hiringDate: '2023-01-15', is_demo: true },
    { id: 'demo-emp_2', matricule: 'EMP-0002', name: 'Ines Dridi', email: 'i.dridi@carthage.com.tn', jobTitle: 'Responsable Rapprochement', department: 'Finance', ssn: '20943810-18', cin: '07123456', rib: '08102030026710048259', baseSalary: 1750.000, transportAllowance: 120.000, presenceAllowance: 80.000, otherAllowances: 150.000, familySituation: 'Single', isChefDeFamille: false, status: 'Active', hiringDate: '2024-03-10', is_demo: true },
    { id: 'demo-emp_3', matricule: 'EMP-0003', name: 'Mohamed Ali Gharbi', email: 'm.gharbi@carthage.com.tn', jobTitle: 'Chargé Clientèle / Ventes', department: 'Ventes', ssn: '12554739-44', cin: '06543210', rib: '12004050037840059341', baseSalary: 1400.000, transportAllowance: 110.000, presenceAllowance: 80.000, otherAllowances: 100.000, familySituation: 'Married_1', isChefDeFamille: true, status: 'Active', hiringDate: '2025-06-18', is_demo: true },
    { id: 'demo-emp_4', matricule: 'EMP-0004', name: 'Amel Ben Soltane', email: 'a.bensoltane@carthage.com.tn', jobTitle: 'Responsable Ressources Humaines', department: 'RH', ssn: '19483029-45', cin: '06123456', rib: '05201040059283749501', baseSalary: 2100.000, transportAllowance: 150.000, presenceAllowance: 80.000, otherAllowances: 200.000, familySituation: 'Married_3', isChefDeFamille: true, status: 'Active', hiringDate: '2024-11-01', is_demo: true },
    { id: 'demo-emp_5', matricule: 'EMP-0005', name: 'Sami Mansour', email: 's.mansour@carthage.com.tn', jobTitle: 'Développeur ERP Principal', department: 'Direction & IT', ssn: '11049382-77', cin: '05123456', rib: '14102030048592837410', baseSalary: 3200.000, transportAllowance: 200.000, presenceAllowance: 80.000, otherAllowances: 500.000, familySituation: 'Single', isChefDeFamille: false, status: 'Active', hiringDate: '2025-01-10', is_demo: true },
    { id: 'demo-emp_6', matricule: 'EMP-0006', name: 'Hamza Ben Salem', email: 'h.bensalem@carthage.com.tn', jobTitle: 'Chauffeur Livreur / Logistique', department: 'Logistique', ssn: '16928301-22', cin: '08812345', rib: '08102030026710048102', baseSalary: 1450.000, transportAllowance: 0, presenceAllowance: 0, otherAllowances: 0, familySituation: 'Married_1', isChefDeFamille: true, status: 'Active', hiringDate: '2024-02-15', is_demo: true }
  ],
  bankAccounts: [
    { id: 'demo-ba_1', bankName: 'BIAT', accountNumber: '03001010015920038472', accountType: 'Courant', balance: 145250.620, currency: 'TND', is_demo: true }
  ],
  bankTransactions: [
    { id: 'demo-tx-1', accountId: 'demo-ba_1', date: '2026-08-01', amount: -8960.000, type: 'Out', category: 'Achat', description: 'Virement fournisseur Les Ciments de Bizerte', status: 'Cleared', method: 'Virement', reference: 'VIR-2026-99', is_demo: true },
    { id: 'demo-tx-2', accountId: 'demo-ba_1', date: '2026-08-05', amount: 11750.000, type: 'In', category: 'Vente', description: 'Règlement Facture FAC-2026-001 STC Construction', status: 'Cleared', method: 'Virement', reference: 'VIR-2026-102', is_demo: true },
    { id: 'demo-tx-3', accountId: 'demo-ba_1', date: '2026-08-10', amount: 10115.000, type: 'In', category: 'Vente POS', description: 'Encaissement Caisse Showroom Tunis POS-2026-0104', status: 'Cleared', method: 'Caisse', reference: 'POS-2026-0104', is_demo: true }
  ]
};

