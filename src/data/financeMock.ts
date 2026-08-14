/**
 * Initial financial mock data for Elyssa Distribution
 */
import { BankAccount, BankTransaction, TaxDeclaration, YearEndClosing } from '../types';

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_biat',
    bankName: 'BIAT Tunis',
    accountNumber: 'TN59 0800 1234 5678 9012 3456',
    type: 'Checking',
    initialBalance: 75000.000,
    currentBalance: 75000.000, // Adjusted by transactions in app
    currency: 'TND',
    status: 'Active'
  },
  {
    id: 'bank_attijari',
    bankName: 'Attijari Bank Sfax',
    accountNumber: 'TN59 0400 9876 5432 1098 7654',
    type: 'Checking',
    initialBalance: 42300.500,
    currentBalance: 42300.500,
    currency: 'TND',
    status: 'Active'
  },
  {
    id: 'bank_uib_savings',
    bankName: 'UIB Compte d\'Épargne',
    accountNumber: 'TN59 0300 1111 2222 3333 4444',
    type: 'Savings',
    initialBalance: 120000.000,
    currentBalance: 120000.000,
    currency: 'TND',
    status: 'Active'
  },
  {
    id: 'bank_caisse_cash',
    bankName: 'Caisse Principale (Espèces)',
    accountNumber: 'CAISSE-CD-TUNIS',
    type: 'CashBox',
    initialBalance: 4850.250,
    currentBalance: 4850.250,
    currency: 'TND',
    status: 'Active'
  }
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'tx_001',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-01',
    type: 'In',
    amount: 14500.000,
    method: 'Virement',
    reference: 'VIR-CLI-POULINA',
    beneficiaryOrIssuer: 'Poulina Group Holding',
    category: 'Vente',
    description: 'Règlement Facture FA-2026-001',
    status: 'Cleared'
  },
  {
    id: 'tx_002',
    accountId: 'bank_attijari',
    accountName: 'Attijari Bank Sfax',
    date: '2026-06-05',
    type: 'In',
    amount: 3200.000,
    method: 'Cheque',
    reference: 'CHQ-8827391',
    dueDate: '2026-06-12',
    beneficiaryOrIssuer: 'Société El Majd',
    category: 'Vente',
    description: 'Chèque de caution ou d\'acompte commande',
    status: 'Cleared'
  },
  {
    id: 'tx_003',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-08',
    type: 'Out',
    amount: 8500.200,
    method: 'Traite',
    reference: 'TRT-FOURN-CHIMCO',
    dueDate: '2026-06-28',
    beneficiaryOrIssuer: 'ChimCo Tunisie S.A.',
    category: 'Achat Fournisseur',
    description: 'Traite acceptée pour approvisionnement matières premières',
    status: 'Pending'
  },
  {
    id: 'tx_004',
    accountId: 'bank_caisse_cash',
    accountName: 'Caisse Principale (Espèces)',
    date: '2026-06-10',
    type: 'Out',
    amount: 180.000,
    method: 'Especes',
    reference: 'REC-CARBURANT',
    beneficiaryOrIssuer: 'Station Total Charguia',
    category: 'Autre',
    description: 'Frais de carburant camionnettes de livraison',
    status: 'Cleared'
  },
  {
    id: 'tx_005',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-12',
    type: 'Out',
    amount: 2500.000,
    method: 'Virement',
    reference: 'LOY-2026-06',
    beneficiaryOrIssuer: 'SOPROT Tunis (Bailleur)',
    category: 'Loyer',
    description: 'Loyer mensuel bureaux Elyssa Distribution',
    status: 'Cleared'
  },
  {
    id: 'tx_006',
    accountId: 'bank_caisse_cash',
    accountName: 'Caisse Principale (Espèces)',
    date: '2026-06-14',
    type: 'In',
    amount: 450.000,
    method: 'Especes',
    reference: 'ESP-AL-ALOUA',
    beneficiaryOrIssuer: 'Épicerie Al Aloua',
    category: 'Vente',
    description: 'Paiement comptant livraison directe',
    status: 'Cleared'
  },
  {
    id: 'tx_007',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-15',
    type: 'Out',
    amount: 14200.000,
    method: 'Virement',
    reference: 'SALAIRES-06-2026',
    beneficiaryOrIssuer: 'Personnel Elyssa Distribution (14 salariés)',
    category: 'Salaire',
    description: 'Virements de salaires du mois de Juin 2026',
    status: 'Cleared'
  },
  {
    id: 'tx_008',
    accountId: 'bank_attijari',
    accountName: 'Attijari Bank Sfax',
    date: '2026-06-16',
    type: 'Out',
    amount: 1250.000,
    method: 'Prelevement',
    reference: 'PRL-STEG-SF01',
    beneficiaryOrIssuer: 'STEG (Électricité)',
    category: 'Autre',
    description: 'Facture STEG trimestrielle dépôt Sfax',
    status: 'Cleared'
  },
  {
    id: 'tx_009',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-17',
    type: 'In',
    amount: 9800.000,
    method: 'Traite',
    reference: 'TRT-CLI-MEDINA',
    dueDate: '2026-07-15',
    beneficiaryOrIssuer: 'Supermarché Tunis Médina',
    category: 'Vente',
    description: 'Traite client tirée pour règlement facture FA-2026-004',
    status: 'Pending'
  },
  {
    id: 'tx_010',
    accountId: 'bank_biat',
    accountName: 'BIAT Tunis',
    date: '2026-06-18',
    type: 'Out',
    amount: 4500.000,
    method: 'Cheque',
    reference: 'CHQ-0027151',
    dueDate: '2026-06-22',
    beneficiaryOrIssuer: 'Recette des Finances (Impôts)',
    category: 'Impôts & Taxes',
    description: 'Règlement déclaration fiscale mensuelle de Mai 2026',
    status: 'Cleared'
  }
];

export const INITIAL_TAX_DECLARATIONS: TaxDeclaration[] = [
  {
    id: 'tax_dec_01',
    year: 2026,
    period: 'M01',
    periodLabel: 'Janvier 2026',
    tvaCollected: 8540.300,
    tvaDeductible: 5210.100,
    tvaDue: 3330.200,
    withholdingPaid: 650.000,
    withholdingCollected: 420.000,
    corporateTaxEstimate: 1450.000,
    status: 'Paid',
    filedDate: '2026-02-25',
    totalAmountPaid: 3100.200 // tva due + rs à reverser - rs subies
  },
  {
    id: 'tax_dec_02',
    year: 2026,
    period: 'M02',
    periodLabel: 'Février 2026',
    tvaCollected: 9430.000,
    tvaDeductible: 6110.000,
    tvaDue: 3320.000,
    withholdingPaid: 710.000,
    withholdingCollected: 510.000,
    corporateTaxEstimate: 1620.000,
    status: 'Paid',
    filedDate: '2026-03-25',
    totalAmountPaid: 3120.000
  },
  {
    id: 'tax_dec_03',
    year: 2026,
    period: 'M03',
    periodLabel: 'Mars 2026',
    tvaCollected: 12500.500,
    tvaDeductible: 8400.200,
    tvaDue: 4100.300,
    withholdingPaid: 950.000,
    withholdingCollected: 620.000,
    corporateTaxEstimate: 2100.000,
    status: 'Paid',
    filedDate: '2026-04-25',
    totalAmountPaid: 3770.300
  },
  {
    id: 'tax_dec_04',
    year: 2026,
    period: 'M04',
    periodLabel: 'Avril 2026',
    tvaCollected: 11200.000,
    tvaDeductible: 7900.000,
    tvaDue: 3300.000,
    withholdingPaid: 840.000,
    withholdingCollected: 580.000,
    corporateTaxEstimate: 1950.000,
    status: 'Paid',
    filedDate: '2026-05-25',
    totalAmountPaid: 3040.000
  },
  {
    id: 'tax_dec_05',
    year: 2026,
    period: 'M05',
    periodLabel: 'Mai 2026',
    tvaCollected: 14750.000,
    tvaDeductible: 9150.000,
    tvaDue: 5600.000,
    withholdingPaid: 1100.000,
    withholdingCollected: 750.000,
    corporateTaxEstimate: 2500.000,
    status: 'Paid',
    filedDate: '2026-06-18',
    totalAmountPaid: 5250.000
  }
];

export const INITIAL_YEAR_END_CLOSINGS: YearEndClosing[] = [
  {
    id: 'cl_2024',
    year: 2024,
    closingDate: '2025-02-15',
    closedBy: 'Zied Ben Miled',
    revenues: 1854000.000,
    expenses: 1541000.000,
    ebitda: 313000.000,
    corporateTax: 46950.000, // 15% rate
    netIncome: 266050.000,
    status: 'Closed',
    notes: 'Exercice 2024 finalisé et visé par le Commissaire aux Comptes. Quitus accordé.',
    isLocked: true
  },
  {
    id: 'cl_2025',
    year: 2025,
    closingDate: '2026-02-20',
    closedBy: 'Zied Ben Miled',
    revenues: 2150000.000,
    expenses: 1820000.000,
    ebitda: 330000.000,
    corporateTax: 49500.000,
    netIncome: 280500.000,
    status: 'Closed',
    notes: 'Excédent brut d\'exploitation en progression (+5.4%). Tous les comptes d\'achats et de ventes sont formellement arrêtés et verouillés.',
    isLocked: true
  },
  {
    id: 'cl_2026',
    year: 2026,
    closingDate: 'En attente',
    closedBy: '',
    revenues: 1245000.000, // Year-to-date simulation
    expenses: 984500.000,
    ebitda: 260500.000,
    corporateTax: 39075.000,
    netIncome: 221425.000,
    status: 'Draft',
    notes: 'Provisions en cours. Simulation financière mise à jour en temps réel à partir de la facturation et du journal.',
    isLocked: false
  }
];
