import fs from 'fs';
import path from 'path';
import { 
  INITIAL_CLIENTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_INVOICES, 
  INITIAL_VISIT_REPORTS, 
  INITIAL_COMPETITORS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_INCOMING_EMAILS,
  INITIAL_COMMUNICATION_LOGS
} from '../src/data/mockData';

import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_TAX_DECLARATIONS,
  INITIAL_YEAR_END_CLOSINGS
} from '../src/data/financeMock';

// Let's replicate the HR and document demo arrays exactly as defined in App.tsx
const demoEmployees = [
  {
    id: 'demo-emp_1',
    name: 'Khaled Ben Amor (Démo)',
    email: 'k.benamor@carthage.com.tn',
    jobTitle: 'Directeur Financier & Recouvrement',
    ssn: '14839211-92',
    rib: '03001010015920038472',
    baseSalary: 2600.000,
    transportAllowance: 180.000,
    presenceAllowance: 80.000,
    otherAllowances: 300.000,
    familySituation: 'Married_2',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2023-01-15'
  },
  {
    id: 'demo-emp_2',
    name: 'Ines Dridi (Démo)',
    email: 'i.dridi@carthage.com.tn',
    jobTitle: 'Responsable Rapprochement',
    ssn: '20943810-18',
    rib: '08102030026710048259',
    baseSalary: 1750.000,
    transportAllowance: 120.000,
    presenceAllowance: 80.000,
    otherAllowances: 150.000,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2024-03-10'
  },
  {
    id: 'demo-emp_3',
    name: 'Mohamed Ali Gharbi (Démo)',
    email: 'm.gharbi@carthage.com.tn',
    jobTitle: 'Chargé Clientèle Extérieure',
    ssn: '12554739-44',
    rib: '12004050037840059341',
    baseSalary: 1400.000,
    transportAllowance: 110.000,
    presenceAllowance: 80.000,
    otherAllowances: 100.000,
    familySituation: 'Married_1',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2025-06-18'
  },
  {
    id: 'demo-emp_4',
    name: 'Amel Ben Soltane (Démo)',
    email: 'a.bensoltane@carthage.com.tn',
    jobTitle: 'Responsable Ressources Humaines',
    ssn: '19483029-45',
    rib: '05201040059283749501',
    baseSalary: 2100.000,
    transportAllowance: 150.000,
    presenceAllowance: 80.000,
    otherAllowances: 200.000,
    familySituation: 'Married_3',
    isChefDeFamille: true,
    status: 'Active',
    hiringDate: '2024-11-01'
  },
  {
    id: 'demo-emp_5',
    name: 'Sami Mansour (Démo)',
    email: 's.mansour@carthage.com.tn',
    jobTitle: 'Développeur ERP Principal',
    ssn: '11049382-77',
    rib: '14102030048592837410',
    baseSalary: 3200.000,
    transportAllowance: 200.000,
    presenceAllowance: 80.000,
    otherAllowances: 500.000,
    familySituation: 'Single',
    isChefDeFamille: false,
    status: 'Active',
    hiringDate: '2025-01-10'
  }
];

const demoContracts = [
  {
    id: 'demo-ct_1',
    employeeId: 'demo-emp_1',
    employeeName: 'Khaled Ben Amor (Démo)',
    contractType: 'CDI',
    startDate: '2023-01-15',
    trialPeriodMonths: 3,
    baseSalary: 2600.000,
    status: 'Signed',
    dutiesDescription: 'Superviser l\'ensemble des processus financiers, élaboration du budget annuel, pilotage de la trésorerie et reporting réglementaire de Elyssa S.A. auprès de la Banque Centrale de Tunisie.',
    generatedAt: '2023-01-15',
    signedAt: '2023-01-15'
  },
  {
    id: 'demo-ct_2',
    employeeId: 'demo-emp_2',
    employeeName: 'Ines Dridi (Démo)',
    contractType: 'CDD',
    startDate: '2024-03-10',
    endDate: '2026-03-09',
    trialPeriodMonths: 2,
    baseSalary: 1750.000,
    status: 'Signed',
    dutiesDescription: 'Contrôler les opérations de rapprochement bancaire, auditer les pièces comptables de paie et s\'assurer du respect des règles fiscales de retenue à la source en Tunisie.',
    generatedAt: '2024-03-05',
    signedAt: '2024-03-10'
  },
  {
    id: 'demo-ct_3',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi (Démo)',
    contractType: 'CIVP',
    startDate: '2025-06-18',
    endDate: '2026-06-17',
    trialPeriodMonths: 1,
    baseSalary: 1400.000,
    status: 'Signed',
    dutiesDescription: 'Assister les clients de Elyssa S.A., préparer la documentation de prospection commerciale et de service extérieur pour la zone industrielle de Charguia et Ben Arous.',
    generatedAt: '2025-06-15',
    signedAt: '2025-06-18'
  },
  {
    id: 'demo-ct_4',
    employeeId: 'demo-emp_4',
    employeeName: 'Amel Ben Soltane (Démo)',
    contractType: 'CDI',
    startDate: '2024-11-01',
    trialPeriodMonths: 3,
    baseSalary: 2100.000,
    status: 'Signed',
    dutiesDescription: 'Gérer l\'ensemble des dossiers administratifs du personnel, l\'élaboration de la paie mensuelle, le suivi des recrutements et des relations avec la CNSS et l\'Inspection du Travail.',
    generatedAt: '2024-10-25',
    signedAt: '2024-11-01'
  },
  {
    id: 'demo-ct_5',
    employeeId: 'demo-emp_5',
    employeeName: 'Sami Mansour (Démo)',
    contractType: 'CDI',
    startDate: '2025-01-10',
    trialPeriodMonths: 3,
    baseSalary: 3200.000,
    status: 'Signed',
    dutiesDescription: 'Concevoir et développer de nouveaux modules logiciels pour l\'ERP Elyssa, assurer la maintenance corrective et évolutive des applications, et optimiser les performances de la base de données.',
    generatedAt: '2025-01-05',
    signedAt: '2025-01-10'
  }
];

const demoAbsences = [
  {
    id: 'demo-abs_1',
    employeeId: 'demo-emp_2',
    employeeName: 'Ines Dridi (Démo)',
    type: 'SickLeave',
    startDate: '2026-06-02',
    endDate: '2026-06-05',
    daysCount: 4,
    isDeductibleFromSalary: true,
    deductionAmount: 240.000,
    status: 'Approved',
    description: 'Grippe saisonnière sévère - Certificat médical transmis'
  },
  {
    id: 'demo-abs_2',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi (Démo)',
    type: 'WorkAccident',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    daysCount: 3,
    isDeductibleFromSalary: false,
    deductionAmount: 0.000,
    status: 'Approved',
    description: "Accident de trajet (visite clientèle) - Notification d'arrêt délivrée par la CNAM"
  },
  {
    id: 'demo-abs_3',
    employeeId: 'demo-emp_1',
    employeeName: 'Khaled Ben Amor (Démo)',
    type: 'PaidLeave',
    startDate: '2026-06-15',
    endDate: '2026-06-19',
    daysCount: 5,
    isDeductibleFromSalary: false,
    deductionAmount: 0,
    status: 'Approved',
    description: "Congés d'été annuels validés par la Direction"
  }
];

const demoPayslips = [
  {
    id: 'demo-ps_1_may',
    employeeId: 'demo-emp_1',
    employeeName: 'Khaled Ben Amor (Démo)',
    month: '2026-05',
    baseSalary: 2600.000,
    grossSalary: 3160.000,
    cnssEmployee: 290.088,
    cnssEmployer: 539.412,
    professionalExpenses: 166.667,
    familyDeduction: 41.667,
    taxableIncome: 2661.578,
    irpp: 582.345,
    css: 26.616,
    netSalary: 2260.951,
    allowancesPaid: 560.000,
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-05-31'
  },
  {
    id: 'demo-ps_2_may',
    employeeId: 'demo-emp_2',
    employeeName: 'Ines Dridi (Démo)',
    month: '2026-05',
    baseSalary: 1750.000,
    grossSalary: 2100.000,
    cnssEmployee: 192.780,
    cnssEmployer: 358.470,
    professionalExpenses: 166.667,
    familyDeduction: 0.000,
    taxableIncome: 1740.553,
    irpp: 312.450,
    css: 17.406,
    netSalary: 1577.364,
    allowancesPaid: 350.000,
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-05-31'
  },
  {
    id: 'demo-ps_3_may',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi (Démo)',
    month: '2026-05',
    baseSalary: 1400.000,
    grossSalary: 1690.000,
    cnssEmployee: 155.142,
    cnssEmployer: 288.483,
    professionalExpenses: 153.486,
    familyDeduction: 33.333,
    taxableIncome: 1348.039,
    irpp: 202.150,
    css: 13.480,
    netSalary: 1319.228,
    allowancesPaid: 290.000,
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-05-31'
  },
  {
    id: 'demo-ps_4_may',
    employeeId: 'demo-emp_4',
    employeeName: 'Amel Ben Soltane (Démo)',
    month: '2026-05',
    baseSalary: 2100.000,
    grossSalary: 2530.000,
    cnssEmployee: 232.254,
    cnssEmployer: 431.871,
    professionalExpenses: 166.667,
    familyDeduction: 50.000,
    taxableIncome: 2081.079,
    irpp: 412.350,
    css: 20.811,
    netSalary: 1864.585,
    allowancesPaid: 430.000,
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-05-31'
  },
  {
    id: 'demo-ps_5_may',
    employeeId: 'demo-emp_5',
    employeeName: 'Sami Mansour (Démo)',
    month: '2026-05',
    baseSalary: 3200.000,
    grossSalary: 3980.000,
    cnssEmployee: 365.364,
    cnssEmployer: 679.386,
    professionalExpenses: 166.667,
    familyDeduction: 0.000,
    taxableIncome: 3447.969,
    irpp: 825.400,
    css: 34.480,
    netSalary: 2754.756,
    allowancesPaid: 780.000,
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-05-31'
  },
  {
    id: 'demo-ps_1_june',
    employeeId: 'demo-emp_1',
    employeeName: 'Khaled Ben Amor (Démo)',
    month: '2026-06',
    baseSalary: 2600.000,
    grossSalary: 3160.000,
    cnssEmployee: 290.088,
    cnssEmployer: 539.412,
    professionalExpenses: 166.667,
    familyDeduction: 41.667,
    taxableIncome: 2661.578,
    irpp: 582.345,
    css: 26.616,
    netSalary: 2260.951,
    allowancesPaid: 560.000,
    status: 'Approved',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1'
  },
  {
    id: 'demo-ps_2_june',
    employeeId: 'demo-emp_2',
    employeeName: 'Ines Dridi (Démo)',
    month: '2026-06',
    baseSalary: 1750.000,
    grossSalary: 1860.000,
    cnssEmployee: 170.748,
    cnssEmployer: 317.502,
    professionalExpenses: 155.333,
    familyDeduction: 0.000,
    taxableIncome: 1533.919,
    irpp: 252.350,
    css: 15.339,
    netSalary: 1421.563,
    allowancesPaid: 350.000,
    absencesDeduction: 240.000,
    absenceDaysTracked: 4,
    status: 'Approved',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1'
  },
  {
    id: 'demo-ps_3_june',
    employeeId: 'demo-emp_3',
    employeeName: 'Mohamed Ali Gharbi (Démo)',
    month: '2026-06',
    baseSalary: 1400.000,
    grossSalary: 1690.000,
    cnssEmployee: 155.142,
    cnssEmployer: 288.483,
    professionalExpenses: 153.486,
    familyDeduction: 33.333,
    taxableIncome: 1348.039,
    irpp: 202.150,
    css: 13.480,
    netSalary: 1319.228,
    allowancesPaid: 290.000,
    status: 'Draft',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1'
  }
];

const demoDocuments = [
  {
    id: "demo-doc_1",
    name: "Contrat_CDI_Khaled_Ben_Amor_Signed",
    type: "Contract",
    fileSize: "245 KB",
    fileType: "application/pdf",
    uploadDate: "2023-01-15",
    linkedToType: "Employee",
    linkedToId: "demo-emp_1",
    linkedToName: "Khaled Ben Amor (Démo)",
    description: "Contrat de travail permanent en qualité de Directeur Financier & Recouvrement.",
    version: 1,
    uploadedBy: "contact@elyssa.pro"
  },
  {
    id: "demo-doc_2",
    name: "Attestation_Ines_Dridi_ID",
    type: "Other",
    fileSize: "112 KB",
    fileType: "image/png",
    uploadDate: "2024-03-10",
    linkedToType: "Employee",
    linkedToId: "demo-emp_2",
    linkedToName: "Ines Dridi (Démo)",
    description: "Copie scannée de la Carte d'Identité Nationale (CIN).",
    version: 1,
    uploadedBy: "contact@elyssa.pro"
  },
  {
    id: "demo-doc_3",
    name: "Contrat_CIVP_Mohamed_Ali_Gharbi_Signed",
    type: "Contract",
    fileSize: "185 KB",
    fileType: "application/pdf",
    uploadDate: "2025-06-18",
    linkedToType: "Employee",
    linkedToId: "demo-emp_3",
    linkedToName: "Mohamed Ali Gharbi (Démo)",
    description: "Contrat d'insertion CIVP visé par l'ANETI.",
    version: 1,
    uploadedBy: "contact@elyssa.pro"
  },
  {
    id: "demo-doc_4",
    name: "Fiche_Paie_Khaled_Ben_Amor_Mai_2026",
    type: "Other",
    fileSize: "85 KB",
    fileType: "application/pdf",
    uploadDate: "2026-05-31",
    linkedToType: "Employee",
    linkedToId: "demo-emp_1",
    linkedToName: "Khaled Ben Amor (Démo)",
    description: "Fiche de paie numérique certifiée conforme pour Mai 2026.",
    version: 1,
    uploadedBy: "contact@elyssa.pro"
  }
];

// Transit and Logistics demo datasets
const demoImportFolders = [
  {
    id: 'demo-imp_1',
    reference: 'IMP-2026-001 (Démo)',
    folderType: 'Import',
    supplierName: 'Marseille Chimie SAS',
    originCountry: 'France',
    incoterm: 'FOB',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Customs',
    creationDate: '2026-06-01',
    estimatedArrivalDate: '2026-06-30',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-item_1', productName: 'Solvant Éco Purifié', quantity: 1500, fobUnitPrice: 4.5, foreignCurrencyRate: 3.42, customsDutyRate: 15, vatRate: 19 },
      { id: 'demo-item_2', productName: 'Additif Stabilisateur X20', quantity: 800, fobUnitPrice: 12.0, foreignCurrencyRate: 3.42, customsDutyRate: 10, vatRate: 19 }
    ],
    freightCostTND: 4200,
    customsDutiesTND: 8150,
    transitterFeesTND: 1200,
    handlingFeesTND: 850,
    insuranceCostTND: 650,
    otherFeesTND: 300
  },
  {
    id: 'demo-imp_2',
    reference: 'IMP-2026-002 (Démo)',
    folderType: 'Import',
    supplierName: 'Genoa Industrial Valves',
    originCountry: 'Italie',
    incoterm: 'EXW',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Transport',
    creationDate: '2026-06-10',
    estimatedArrivalDate: '2026-07-05',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-item_3', productName: 'Vanne Haute Pression V3', quantity: 120, fobUnitPrice: 85.0, foreignCurrencyRate: 3.42, customsDutyRate: 20, vatRate: 19 },
      { id: 'demo-item_4', productName: 'Joint Torique Graphene', quantity: 2000, fobUnitPrice: 1.2, foreignCurrencyRate: 3.42, customsDutyRate: 5, vatRate: 19 }
    ],
    freightCostTND: 3500,
    customsDutiesTND: 12400,
    transitterFeesTND: 1000,
    handlingFeesTND: 600,
    insuranceCostTND: 450,
    otherFeesTND: 150
  },
  {
    id: 'demo-imp_3',
    reference: 'IMP-2026-003 (Démo)',
    folderType: 'Import',
    supplierName: 'Istanbul Petrochemicals',
    originCountry: 'Turquie',
    incoterm: 'CIF',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Pending',
    creationDate: '2026-06-18',
    estimatedArrivalDate: '2026-07-15',
    currency: 'USD',
    exchangeRate: 3.12,
    items: [
      { id: 'demo-item_5', productName: 'Résine Synthétique Premium', quantity: 5000, fobUnitPrice: 2.1, foreignCurrencyRate: 3.12, customsDutyRate: 15, vatRate: 19 }
    ],
    freightCostTND: 6200,
    customsDutiesTND: 11450,
    transitterFeesTND: 1500,
    handlingFeesTND: 900,
    insuranceCostTND: 800,
    otherFeesTND: 400
  },
  {
    id: 'demo-exp_1',
    reference: 'EXP-2026-001 (Démo)',
    folderType: 'Export',
    supplierName: 'Marseille Chimie SAS',
    originCountry: 'France',
    incoterm: 'FOB',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Customs',
    creationDate: '2026-06-01',
    estimatedArrivalDate: '2026-06-30',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-exp-item_1', productName: 'Résine Polyéthylène Haute Densité (PEHD)', quantity: 4000, fobUnitPrice: 1.80, foreignCurrencyRate: 3.12, customsDutyRate: 0, vatRate: 0 }
    ],
    freightCostTND: 2200,
    customsDutiesTND: 0,
    transitterFeesTND: 1000,
    handlingFeesTND: 500,
    insuranceCostTND: 350,
    otherFeesTND: 100
  },
  {
    id: 'demo-exp_2',
    reference: 'EXP-2026-002 (Démo)',
    folderType: 'Export',
    supplierName: 'Genoa Industrial Valves',
    originCountry: 'Italie',
    incoterm: 'EXW',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Transport',
    creationDate: '2026-06-10',
    estimatedArrivalDate: '2026-07-05',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-exp-item_2', productName: 'Adjuvants Ciment Spécifiques', quantity: 12000, fobUnitPrice: 0.95, foreignCurrencyRate: 3.42, customsDutyRate: 0, vatRate: 0 }
    ],
    freightCostTND: 2500,
    customsDutiesTND: 0,
    transitterFeesTND: 1000,
    handlingFeesTND: 500,
    insuranceCostTND: 400,
    otherFeesTND: 200
  }
];

const demoLcRequests = [
  {
    id: 'demo-lc_1',
    importFolderId: 'demo-imp_1',
    folderType: 'Import',
    lcReference: 'BIAT-CDOC-2026-0819 (Démo)',
    proformaInvoiceRef: 'PROFORMA-MC-1029',
    proformaInvoiceDate: '2026-05-25',
    issuingBank: 'Banque Internationale Arabe de Tunisie (BIAT) - Agence Sfax El Jadida',
    beneficiaryName: 'Marseille Chimie SAS',
    beneficiaryAddress: 'Avenue de l\'Exportation, Zone Portuaire, 13002 Marseille, France',
    advisingBank: 'BNP Paribas - Agence Marseille Joliette',
    amount: 16350,
    currency: 'EUR',
    paymentTerms: 'At Sight',
    expiryDate: '2026-08-30',
    shipmentDeadline: '2026-06-30',
    portOfLoading: 'Port de Marseille, France',
    portOfDischarge: 'Port de Radès, Tunisie',
    status: 'Issued',
    amendments: [],
    requiredDocuments: [
      'Commercial Invoice (3 copies)',
      'Full set of clean on board Bill of Lading, marked Freight Prepaid',
      'Certificate of Origin',
      'Analysis Certificate for chemical solvents'
    ],
    comments: 'Crédit documentaire irrévocable et confirmé par BNP Paribas. Émission rapide validée par le DAF.'
  },
  {
    id: 'demo-lc_2',
    importFolderId: 'demo-imp_2',
    folderType: 'Import',
    lcReference: 'BIAT-CDOC-2026-0941 (Démo)',
    proformaInvoiceRef: 'PROFORMA-GIV-4822',
    proformaInvoiceDate: '2026-06-05',
    issuingBank: 'Banque Internationale Arabe de Tunisie (BIAT) - Agence Sfax El Jadida',
    beneficiaryName: 'Genoa Industrial Valves',
    beneficiaryAddress: 'Via della Logistica, Block C, 16121 Gênes, Italie',
    advisingBank: 'UniCredit Spa - Agence Gênes Port',
    amount: 12600,
    currency: 'EUR',
    paymentTerms: '30 Days End of Month',
    expiryDate: '2026-09-15',
    shipmentDeadline: '2026-07-05',
    portOfLoading: 'Port de Gênes, Italie',
    portOfDischarge: 'Port de Radès, Tunisie',
    status: 'Approved',
    amendments: [],
    requiredDocuments: [
      'Commercial Invoice (2 copies)',
      'Packing List',
      'Bill of Lading',
      'EUR.1 Certificate'
    ],
    comments: 'En attente de transmission à la banque correspondante en Italie.'
  },
  {
    id: 'demo-lc_export_1',
    importFolderId: 'demo-exp_1',
    folderType: 'Export',
    lcReference: 'SG-CDOC-2026-0033 (Démo)',
    proformaInvoiceRef: 'EXP-PROFORMA-001',
    proformaInvoiceDate: '2026-05-20',
    issuingBank: 'Société Générale - Agence Marseille Joliette',
    beneficiaryName: 'Marseille Chimie SAS',
    beneficiaryAddress: 'Avenue de l\'Exportation, Zone Portuaire, 13002 Marseille, France',
    advisingBank: 'BNP Paribas - Agence Marseille Joliette',
    amount: 7200,
    currency: 'EUR',
    paymentTerms: 'At Sight',
    expiryDate: '2026-08-30',
    shipmentDeadline: '2026-06-30',
    portOfLoading: 'Port de Marseille, France',
    portOfDischarge: 'Port de Radès, Tunisie',
    status: 'Issued',
    amendments: [],
    requiredDocuments: [
      'Commercial Invoice (3 copies)',
      'Full set of clean on board Bill of Lading, marked Freight Prepaid',
      'Certificate of Origin'
    ],
    comments: 'Crédit documentaire irrévocable et de qualité.'
  }
];

// Fleet demo datasets
const demoVehicles = [
  { id: 'demo-v_1', brand: 'Peugeot', model: 'Partner', registrationNumber: '228 TUN 4091', purchaseDate: '2024-03-12', purchasePrice: 62000.000, status: 'Active' },
  { id: 'demo-v_2', brand: 'Isuzu', model: 'D-Max', registrationNumber: '215 TUN 9832', purchaseDate: '2023-08-18', purchasePrice: 89000.000, status: 'Active' },
  { id: 'demo-v_3', brand: 'Citroën', model: 'C-Élysée', registrationNumber: '241 TUN 1109', purchaseDate: '2025-01-20', purchasePrice: 54000.000, status: 'Active' }
];

const demoFuelBons = [
  { id: 'demo-fb_1', vehicleId: 'demo-v_1', employeeName: 'Khaled Ben Amor (Démo)', date: '2026-06-01', amount: 80.000, liters: 34.5, station: 'Agil Lac 2', reference: 'BON-00918' },
  { id: 'demo-fb_2', vehicleId: 'demo-v_2', employeeName: 'Mohamed Ali Gharbi (Démo)', date: '2026-06-12', amount: 120.000, liters: 52.0, station: 'Total Charguia', reference: 'BON-00942' },
  { id: 'demo-fb_3', vehicleId: 'demo-v_1', employeeName: 'Ines Dridi (Démo)', date: '2026-06-18', amount: 60.000, liters: 25.8, station: 'Ola Sousse', reference: 'BON-01004' }
];

const demoInterventions = [
  { id: 'demo-it_1', vehicleId: 'demo-v_1', type: 'Vidange' as const, date: '2026-05-10', cost: 140.000, description: 'Changement filtre à huile et filtre à air - Huile 10W40 5L chez Agil Sfax.', provider: 'Agil Sfax Service', status: 'Completed' as const },
  { id: 'demo-it_2', vehicleId: 'demo-v_2', type: 'Reparation' as const, date: '2026-05-24', cost: 480.000, description: 'Remplacement plaquettes de frein avant et disque de frein droit chez Isuzu Tunis.', provider: 'Isuzu Tunisie - Sousse', status: 'Completed' as const }
];

const demoInsurances = [
  { id: 'demo-ins_1', vehicleId: 'demo-v_1', provider: 'GAT Assurances', policyNumber: 'POL-GAT-90812', startDate: '2026-03-12', endDate: '2027-03-11', annualCost: 1120.000, status: 'Active' },
  { id: 'demo-ins_2', vehicleId: 'demo-v_2', provider: 'Star Assurances', policyNumber: 'POL-STAR-74892', startDate: '2025-08-18', endDate: '2026-08-17', annualCost: 1450.000, status: 'Active' }
];

const demoAssets = [
  {
    id: 'demo-IMM-2024-001',
    name: 'Extrudeuse Industrielle Haute Fréquence PEHD',
    category: 'Matériel Industriel',
    purchaseDate: '2024-01-15',
    initialValue: 185000,
    usefulLifeYears: 10,
    scrapValue: 0,
    amortizationType: 'Linéaire',
    location: 'Usine de Sfax'
  },
  {
    id: 'demo-IMM-2025-001',
    name: 'Serveurs Rack Core i9 Datacenter Tunis',
    category: 'Matériel Informatique',
    purchaseDate: '2025-03-10',
    initialValue: 24000,
    usefulLifeYears: 3,
    scrapValue: 0,
    amortizationType: 'Linéaire',
    location: 'Siège Social Tunis'
  },
  {
    id: 'demo-IMM-2024-002',
    name: 'Camion de Livraison Isotherme Isuzu 3.5T',
    category: 'Matériel de Transport',
    purchaseDate: '2024-06-20',
    initialValue: 85000,
    usefulLifeYears: 5,
    scrapValue: 0,
    amortizationType: 'Linéaire',
    location: 'Dépôt de Sousse'
  }
];

const demoCessions = [
  {
    id: 'demo-cess-1',
    date: '2026-06-15',
    time: '09:30',
    title: 'Audit initial & Évaluation d\'Entreprise',
    category: 'Evaluation',
    direction: 'Direction Financière',
    authorName: 'Khaled Ben Amor',
    authorRole: 'Dirigeant',
    financialImpact: 4500000.000,
    description: 'Rapport d\'évaluation d\'actifs corporels et incorporels élaboré par notre Expert-Comptable agréé par l\'OECT. La valeur de cession conseillée est arrêtée entre 4,2 MD et 4,8 MD.',
    status: 'Approuvé',
    attachmentsCount: 3
  },
  {
    id: 'demo-cess-2',
    date: '2026-06-18',
    time: '14:15',
    title: 'Audit de conformité sociale - Article 15 du Code du Travail',
    category: 'Ressources Humaines',
    direction: 'Direction RH',
    authorName: 'Sonia Meriah',
    authorRole: 'Collaborateur',
    financialImpact: 0,
    description: 'Vérification de la validité de l\'ancienneté et des contrats des 42 salariés. En vertu de l\'article 15 du Code du Travail tunisien, tous les contrats de travail en cours seront maintenus automatiquement chez le repreneur.',
    status: 'Complété',
    attachmentsCount: 1
  },
  {
    id: 'demo-cess-3',
    date: '2026-06-20',
    time: '11:00',
    title: 'Calcul prévisionnel d\'impôt sur la plus-value de cession',
    category: 'Fiscal',
    direction: 'Direction Financière',
    authorName: 'Mohamed Ali Gharbi',
    authorRole: 'Collaborateur',
    financialImpact: -112500.000,
    description: 'Estimation de l\'impôt sur les plus-values professionnelles de cession d\'actions ordinaires. Réintégration au résultat fiscal imposable à hauteur du taux standard tunisien de 15%. Plus-value estimée à 750 000 TND, d\'où un impôt latent de 112 500 TND.',
    status: 'Soumis',
    attachmentsCount: 2
  },
  {
    id: 'demo-cess-4',
    date: '2026-06-22',
    time: '16:00',
    title: 'Rédaction du compromis de vente (Lettre d\'Intention - LOI)',
    category: 'Juridique',
    direction: 'Direction Juridique',
    authorName: 'Emna Kallel',
    authorRole: 'Dirigeant',
    financialImpact: 0,
    description: 'Validation de l\'avant-projet de compromis de cession avec clause de confidentialité stricte ("NDA") et période d\'exclusivité de 60 jours négociée avec l\'acquéreur (Holding El-Qarawan).',
    status: 'Approuvé',
    attachmentsCount: 4
  },
  {
    id: 'demo-cess-5',
    date: '2026-06-25',
    time: '10:30',
    title: 'Négociation du prix de cession & Garanties d\'Actifs et de Passifs',
    category: 'Négociation',
    direction: 'Direction Générale',
    authorName: 'Zied Ben Miled',
    authorRole: 'Dirigeant',
    financialImpact: 4650000.000,
    description: 'Séance finale de négociation de la GAP (Garantie d\'Actif et de Passif). L\'acheteur accepte une valorisation finale de 4 650 000 TND avec un compte séquestre de 10% dans une banque tunisienne pour couvrir les passifs éventuels non déclarés.',
    status: 'Soumis',
    attachmentsCount: 1
  },
  {
    id: 'demo-cess-6',
    date: '2026-06-28',
    time: '09:00',
    title: 'Inventaire contradictoire des stocks physiques',
    category: 'Audit',
    direction: 'Direction Technique',
    authorName: 'Tarek Chaabane',
    authorRole: 'Collaborateur',
    financialImpact: 280000.000,
    description: 'Saisie de l\'inventaire physique contradictoire des stocks d\'intrants et de produits finis aux entrepôts de la Charguia 2 et Sousse. La valorisation nette d\'inventaire est conforme aux écritures comptables à 98.7%.',
    status: 'Brouillon',
    attachmentsCount: 0
  },
  {
    id: 'demo-cess-7',
    date: '2026-06-29',
    time: '08:45',
    title: 'Déclaration préalable de cession au bureau d\'enregistrement',
    category: 'Fiscal',
    direction: 'Direction Juridique',
    authorName: 'Rim Oueslati',
    authorRole: 'Collaborateur',
    financialImpact: -15000.000,
    description: 'Enregistrement de l\'acte de cession au bureau de la Recette des Finances. Droits d\'enregistrement fixes à 150 TND par acte et taxation proportionnelle selon le type d\'apport le cas échéant.',
    status: 'Complété',
    attachmentsCount: 1
  }
];

const demoNomenclatures = [
  {
    id: 'demo-nom-1',
    productName: 'Câble Électrique Isolé 2.5mm²',
    category: 'Câblerie & Électricité',
    estimatedTimeMinutes: 12,
    laborCostPerUnit: 1.200,
    materials: [
      { id: 'm1', name: 'Cuivre Cathodique Pur', quantityNeeded: 0.18, unit: 'kg', unitCost: 24.500 },
      { id: 'm2', name: 'Grains PVC Isolants (Gris)', quantityNeeded: 0.12, unit: 'kg', unitCost: 4.800 },
      { id: 'm3', name: 'Touret Bois de Conditionnement', quantityNeeded: 0.01, unit: 'u', unitCost: 15.000 }
    ]
  },
  {
    id: 'demo-nom-2',
    productName: 'Disjoncteur Divisionnaire 16A',
    category: 'Appareillage Électrique',
    estimatedTimeMinutes: 25,
    laborCostPerUnit: 2.500,
    materials: [
      { id: 'm4', name: 'Ressort Acier Allié', quantityNeeded: 1, unit: 'u', unitCost: 0.350 },
      { id: 'm5', name: 'Boîtier Plastique Auto-extinguible', quantityNeeded: 1, unit: 'u', unitCost: 1.100 },
      { id: 'm6', name: 'Bandes de Cuivre de Contact', quantityNeeded: 0.05, unit: 'kg', unitCost: 26.000 },
      { id: 'm7', name: 'Bobine de Déclenchement Magnétique', quantityNeeded: 1, unit: 'u', unitCost: 1.800 }
    ]
  },
  {
    id: 'demo-nom-3',
    productName: 'Gaine annelée ICTA Ø20',
    category: 'Conduits & Goulottes',
    estimatedTimeMinutes: 8,
    laborCostPerUnit: 0.500,
    materials: [
      { id: 'm8', name: 'Polyéthylène Haute Densité (PEHD)', quantityNeeded: 0.08, unit: 'kg', unitCost: 3.900 },
      { id: 'm9', name: 'Fil de Tire-aiguille Acier', quantityNeeded: 1, unit: 'm', unitCost: 0.080 }
    ]
  }
];

const demoManufacturingOrders = [
  {
    id: 'demo-OF-2026-001',
    nomenclatureId: 'demo-nom-1',
    productName: 'Câble Électrique Isolé 2.5mm²',
    quantityToProduce: 5000,
    quantityProduced: 5000,
    quantityScrapped: 120,
    startDate: '2026-06-20',
    endDate: '2026-06-22',
    assignedLine: 'Ligne d\'extrusion A (Sfax)',
    assignedTeam: 'Équipe Matin (Chef : J. Ben Ali)',
    status: 'Terminé',
    advancement: 100,
    notes: 'Production conforme aux normes tunisiennes de sécurité électrique. Rebuts minimes.'
  },
  {
    id: 'demo-OF-2026-002',
    nomenclatureId: 'demo-nom-2',
    productName: 'Disjoncteur Divisionnaire 16A',
    quantityToProduce: 1500,
    quantityProduced: 850,
    quantityScrapped: 45,
    startDate: '2026-06-25',
    assignedLine: 'Ligne Assemblage B (Tunis)',
    assignedTeam: 'Équipe Après-midi (Chef : M. Trabelsi)',
    status: 'En cours',
    advancement: 56,
    notes: 'Cadence de montage nominale. Approvisionnement en bobines fluide.'
  },
  {
    id: 'demo-OF-2026-003',
    nomenclatureId: 'demo-nom-3',
    productName: 'Gaine annelée ICTA Ø20',
    quantityToProduce: 10000,
    quantityProduced: 0,
    quantityScrapped: 0,
    startDate: '2026-07-02',
    assignedLine: 'Ligne Extrusion C (Sfax)',
    assignedTeam: 'Équipe Nuit (Chef : S. Ghorbel)',
    status: 'Planifié',
    advancement: 0,
    notes: 'En attente de réception de la matière première PEHD.'
  }
];

const demoPurchaseRequisitions = [
  {
    id: 'demo-DA-2026-001',
    itemDescription: 'Bobines de fil d\'acier allié pour ressorts',
    quantityRequested: 500,
    unit: 'kg',
    estimatedCost: 3500,
    requestedBy: 'Kamel Slimi',
    department: 'Production - Tunis',
    requestDate: '2026-06-22',
    status: 'En attente'
  },
  {
    id: 'demo-DA-2026-002',
    itemDescription: 'Ordinateur portable de développement (Service IT)',
    quantityRequested: 2,
    unit: 'u',
    estimatedCost: 5200,
    requestedBy: 'Ines Ben Sassi',
    department: 'Système & IT',
    requestDate: '2026-06-20',
    status: 'Approuvé',
    decisionNotes: 'Approuvé par le Directeur Général. Commande en cours.'
  },
  {
    id: 'demo-DA-2026-003',
    itemDescription: 'Bandes de Cuivre de Contact Électrique',
    quantityRequested: 100,
    unit: 'kg',
    estimatedCost: 2600,
    requestedBy: 'Firas Ghorbel',
    department: 'Logistique & Stocks',
    requestDate: '2026-06-18',
    status: 'Approuvé',
    decisionNotes: 'Stocks critiques atteints pour les disjoncteurs.'
  }
];

const demoPurchaseOrders = [
  {
    id: 'demo-BC-2026-001',
    supplierName: 'SOTUMETAL S.A. (Tunis)',
    itemDescription: 'Cuivre Cathodique Pur de Haute Pureté',
    quantity: 2000,
    unitCost: 24.500,
    vatRate: 19,
    fodecActive: true,
    amountHT: 49000,
    amountTTC: 58839,
    orderDate: '2026-06-15',
    deliveryDueDate: '2026-06-30',
    paymentTerms: 'Chèque à 60 Jours fin de mois',
    status: 'Envoyé',
    notes: 'Livraison au dépôt de Sfax. Certificat d\'analyse requis.'
  },
  {
    id: 'demo-BC-2026-002',
    supplierName: 'TUNISIE PLASTIQUES S.A.',
    itemDescription: 'Grains PVC Isolants Auto-extinguibles',
    quantity: 5000,
    unitCost: 4.800,
    vatRate: 19,
    fodecActive: true,
    amountHT: 24000,
    amountTTC: 28801.20,
    orderDate: '2026-06-10',
    deliveryDueDate: '2026-06-25',
    paymentTerms: 'Virement bancaire BIAT comptant',
    status: 'Reçu conforme',
    notes: 'Matériaux reçus le 24/06. Inspection qualitative validée.'
  },
  {
    id: 'demo-BC-2026-003',
    supplierName: 'COMPOSANTS ÉLECTRIQUES MED',
    itemDescription: 'Bobine de Déclenchement Magnétique 230V',
    quantity: 1500,
    unitCost: 1.800,
    vatRate: 19,
    fodecActive: false,
    amountHT: 2700,
    amountTTC: 3214,
    orderDate: '2026-06-24',
    deliveryDueDate: '2026-07-05',
    paymentTerms: 'Traite à 90 jours',
    status: 'Brouillon',
    notes: 'Vérifier la compatibilité technique du boîtier plastique.'
  }
];

const demoSupplierPerformance = [
  {
    id: 'demo-SUP-001',
    name: 'SOTUMETAL S.A. (Tunis)',
    category: 'Cuivre, Métaux d\'alliage',
    totalVolume: 125000,
    delayRate: 0,
    conformityRate: 99.8,
    score: 96,
    status: 'Rang A - Excellent'
  },
  {
    id: 'demo-SUP-002',
    name: 'TUNISIE PLASTIQUES S.A.',
    category: 'Grains PVC, Polymères isolants',
    totalVolume: 64000,
    delayRate: 4.5,
    conformityRate: 98.5,
    score: 92,
    status: 'Rang A - Excellent'
  },
  {
    id: 'demo-SUP-003',
    name: 'COMPOSANTS ÉLECTRIQUES MED',
    category: 'Composants de sécurité, bobines électriques',
    totalVolume: 12400,
    delayRate: 18.2,
    conformityRate: 94.1,
    score: 76,
    status: 'Rang B - Sous surveillance'
  }
];

// Helper to deeply map and inject is_demo: true
function enrichWithDemoFlag<T>(arr: T[], prefix: string = 'demo-'): (T & { is_demo: boolean })[] {
  return arr.map((item: any) => {
    const copy = { ...item, is_demo: true };
    // Force demo- prefix on id if not present
    if (copy.id && typeof copy.id === 'string' && !copy.id.startsWith('demo-') && !copy.id.startsWith('pc-demo-') && !copy.id.startsWith('collab_demo_')) {
      copy.id = prefix + copy.id;
    }
    // Handle sub-objects
    if (copy.engagements && Array.isArray(copy.engagements)) {
      copy.engagements = copy.engagements.map((e: any) => ({ ...e, id: e.id.startsWith('demo-') ? e.id : 'demo-' + e.id, is_demo: true }));
    }
    if (copy.recouvrementSteps && Array.isArray(copy.recouvrementSteps)) {
      copy.recouvrementSteps = copy.recouvrementSteps.map((s: any) => ({ ...s, id: s.id.startsWith('demo-') ? s.id : 'demo-' + s.id, is_demo: true }));
    }
    if (copy.items && Array.isArray(copy.items)) {
      copy.items = copy.items.map((i: any) => ({ ...i, id: i.id.startsWith('demo-') ? i.id : 'demo-' + i.id, is_demo: true }));
    }
    if (copy.amendments && Array.isArray(copy.amendments)) {
      copy.amendments = copy.amendments.map((a: any) => ({ ...a, id: a.id.startsWith('demo-') ? a.id : 'demo-' + a.id, is_demo: true }));
    }
    return copy;
  });
}

// Assemble full demo container
const masterDemoData = {
  clients: enrichWithDemoFlag(INITIAL_CLIENTS),
  complaints: enrichWithDemoFlag(INITIAL_COMPLAINTS),
  invoices: enrichWithDemoFlag(INITIAL_INVOICES),
  visitReports: enrichWithDemoFlag(INITIAL_VISIT_REPORTS),
  competitors: enrichWithDemoFlag(INITIAL_COMPETITORS),
  suppliers: enrichWithDemoFlag(INITIAL_SUPPLIERS),
  products: enrichWithDemoFlag(INITIAL_PRODUCTS),
  stockMovements: enrichWithDemoFlag(INITIAL_STOCK_MOVEMENTS),
  bankAccounts: enrichWithDemoFlag(INITIAL_BANK_ACCOUNTS),
  bankTransactions: enrichWithDemoFlag(INITIAL_BANK_TRANSACTIONS),
  taxDeclarations: enrichWithDemoFlag(INITIAL_TAX_DECLARATIONS),
  yearEndClosings: enrichWithDemoFlag(INITIAL_YEAR_END_CLOSINGS),
  employees: enrichWithDemoFlag(demoEmployees, ''),
  contracts: enrichWithDemoFlag(demoContracts, ''),
  absences: enrichWithDemoFlag(demoAbsences, ''),
  payslips: enrichWithDemoFlag(demoPayslips, ''),
  documents: enrichWithDemoFlag(demoDocuments, ''),
  importFolders: enrichWithDemoFlag(demoImportFolders, ''),
  lcRequests: enrichWithDemoFlag(demoLcRequests, ''),
  vehicles: enrichWithDemoFlag(demoVehicles, ''),
  fuelBons: enrichWithDemoFlag(demoFuelBons, ''),
  interventions: enrichWithDemoFlag(demoInterventions, ''),
  insurances: enrichWithDemoFlag(demoInsurances, ''),
  assets: enrichWithDemoFlag(demoAssets, ''),
  cessionEntries: enrichWithDemoFlag(demoCessions, ''),
  nomenclatures: enrichWithDemoFlag(demoNomenclatures, ''),
  manufacturingOrders: enrichWithDemoFlag(demoManufacturingOrders, ''),
  purchaseRequisitions: enrichWithDemoFlag(demoPurchaseRequisitions, ''),
  purchaseOrders: enrichWithDemoFlag(demoPurchaseOrders, ''),
  supplierPerformance: enrichWithDemoFlag(demoSupplierPerformance, '')
};

const outputFilePath = path.join(process.cwd(), 'demo_master_data.json');
fs.writeFileSync(outputFilePath, JSON.stringify(masterDemoData, null, 2), 'utf-8');
console.log(`Successfully compiled and wrote isolated demo master data to: ${outputFilePath}`);
