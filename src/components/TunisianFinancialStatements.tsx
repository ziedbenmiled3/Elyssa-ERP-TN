/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BookOpen, 
  Percent, 
  Calculator, 
  Layers, 
  Scale, 
  Info, 
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Invoice, BankTransaction, BankAccount, YearEndClosing } from '../types';

const fmt = (val: number | undefined | null, locale = 'fr-TN', options?: Intl.NumberFormatOptions) =>
  (typeof val === 'number' && !isNaN(val) ? val : 0).toLocaleString(locale, options);

interface TunisianFinancialStatementsProps {
  invoices: Invoice[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  yearEndClosings: YearEndClosing[];
  triggerPrint: (elementId: string, docName: string) => void;
}

// Plan Comptable Tunisien (Typical core accounts)
interface AccountPCT {
  code: string;
  label: string;
  class: number;
  type: 'Debit' | 'Credit';
}

const TUNISIAN_PCT: AccountPCT[] = [
  // Class 1: Capitaux Propres et Emprunts
  { code: '101', label: 'Capital social', class: 1, type: 'Credit' },
  { code: '106', label: 'Réserves légales et statutaires', class: 1, type: 'Credit' },
  { code: '110', label: 'Report à nouveau (Solde créditeur)', class: 1, type: 'Credit' },
  { code: '119', label: 'Report à nouveau (Solde débiteur)', class: 1, type: 'Debit' },
  { code: '131', label: 'Subventions d\'investissement', class: 1, type: 'Credit' },
  { code: '164', label: 'Emprunts auprès des établissements de crédit', class: 1, type: 'Credit' },
  
  // Class 2: Actifs Immobilisés
  { code: '211', label: 'Frais de recherche et de développement', class: 2, type: 'Debit' },
  { code: '213', label: 'Brevets, licences et marques', class: 2, type: 'Debit' },
  { code: '221', label: 'Terrains', class: 2, type: 'Debit' },
  { code: '222', label: 'Constructions / Bâtiments', class: 2, type: 'Debit' },
  { code: '223', label: 'Installations, matériel et outillage techniques', class: 2, type: 'Debit' },
  { code: '224', label: 'Matériel de transport (Véhicules)', class: 2, type: 'Debit' },
  { code: '228', label: 'Matériel de bureau et équipement informatique', class: 2, type: 'Debit' },
  { code: '282', label: 'Amortissements des immobilisations corporelles', class: 2, type: 'Credit' },
  { code: '292', label: 'Provisions pour dépréciation des immobilisations', class: 2, type: 'Credit' },
  
  // Class 3: Stocks
  { code: '311', label: 'Stocks de marchandises (Matières premières)', class: 3, type: 'Debit' },
  { code: '313', label: 'Stocks de produits finis', class: 3, type: 'Debit' },
  { code: '315', label: 'Stocks d\'emballages', class: 3, type: 'Debit' },
  { code: '391', label: 'Provisions pour dépréciation des stocks', class: 3, type: 'Credit' },

  // Class 4: Comptes de Tiers
  { code: '401', label: 'Fournisseurs d\'exploitation', class: 4, type: 'Credit' },
  { code: '404', label: 'Fournisseurs d\'immobilisations', class: 4, type: 'Credit' },
  { code: '411', label: 'Clients d\'exploitation (Créances)', class: 4, type: 'Debit' },
  { code: '416', label: 'Clients douteux ou litigieux', class: 4, type: 'Debit' },
  { code: '421', label: 'Personnel - Rémunérations dues', class: 4, type: 'Credit' },
  { code: '431', label: 'État - Impôts sur les bénéfices (IS)', class: 4, type: 'Credit' },
  { code: '434', label: 'État - TVA Collectée', class: 4, type: 'Credit' },
  { code: '436', label: 'État - TVA Déductible', class: 4, type: 'Debit' },
  { code: '438', label: 'État - Retenues à la source subies', class: 4, type: 'Debit' },
  { code: '451', label: 'Associés - Comptes courants', class: 4, type: 'Credit' },
  { code: '491', label: 'Provisions pour dépréciation des comptes clients', class: 4, type: 'Credit' },

  // Class 5: Comptes Financiers
  { code: '532', label: 'Banque nationale (BIAT, UIB, etc.)', class: 5, type: 'Debit' },
  { code: '541', label: 'Chèques à l\'encaissement / Effets à recevoir', class: 5, type: 'Debit' },
  { code: '582', label: 'Régies d\'avances et caisses (Espèces)', class: 5, type: 'Debit' },

  // Class 6: Charges (Compte de résultat)
  { code: '601', label: 'Achats de matières premières et marchandises', class: 6, type: 'Debit' },
  { code: '607', label: 'Achats d\'énergie et fournitures consommables', class: 6, type: 'Debit' },
  { code: '613', label: 'Locations et charges locatives (Loyers)', class: 6, type: 'Debit' },
  { code: '615', label: 'Entretien et réparations', class: 6, type: 'Debit' },
  { code: '616', label: 'Primes d\'assurances', class: 6, type: 'Debit' },
  { code: '624', label: 'Transports de biens et du personnel', class: 6, type: 'Debit' },
  { code: '627', label: 'Services bancaires et assimilés', class: 6, type: 'Debit' },
  { code: '641', label: 'Charges de personnel (Salaires bruts)', class: 6, type: 'Debit' },
  { code: '645', label: 'Charges sociales (CNSS patronale)', class: 6, type: 'Debit' },
  { code: '661', label: 'Impôts, taxes et versements assimilés (FODEC, etc.)', class: 6, type: 'Debit' },
  { code: '651', label: 'Charges financières (Intérêts d\'emprunts)', class: 6, type: 'Debit' },
  { code: '681', label: 'Dotations aux amortissements et provisions', class: 6, type: 'Debit' },
  { code: '691', label: 'Impôts sur les bénéfices (IS de l\'exercice)', class: 6, type: 'Debit' },

  // Class 7: Produits (Compte de résultat)
  { code: '701', label: 'Ventes de produits finis', class: 7, type: 'Credit' },
  { code: '707', label: 'Ventes de marchandises', class: 7, type: 'Credit' },
  { code: '713', label: 'Variation des stocks de produits finis', class: 7, type: 'Credit' },
  { code: '741', label: 'Subventions d\'exploitation accordées', class: 7, type: 'Credit' },
  { code: '751', label: 'Produits financiers (Intérêts des placements)', class: 7, type: 'Credit' },
  { code: '781', label: 'Reprises sur amortissements et provisions', class: 7, type: 'Credit' }
];

export default function TunisianFinancialStatements({
  invoices,
  bankAccounts,
  bankTransactions,
  yearEndClosings,
  triggerPrint
}: TunisianFinancialStatementsProps) {
  // Tabs: 'balance' | 'actif' | 'passif' | 'resultat' | 'flux' | 'fiscal' | 'pct' | 'notes'
  const [activeTab, setActiveTab] = useState<'balance' | 'actif' | 'passif' | 'resultat' | 'flux' | 'fiscal' | 'pct' | 'notes'>('balance');
  const [pctSearch, setPctSearch] = useState('');
  const [pctClassFilter, setPctClassFilter] = useState<string>('All');

  // Manual Adjustments (Saisie d'ajustements comptables pour équilibrer ou simuler)
  const [adjustments, setAdjustments] = useState<{ code: string; debit: number; credit: number }[]>([]);
  const [adjCode, setAdjCode] = useState('681');
  const [adjDebit, setAdjDebit] = useState<number>(0);
  const [adjCredit, setAdjCredit] = useState<number>(0);

  // Fiscal settings
  const [companyCategory, setCompanyCategory] = useState<'Standard' | 'Favored' | 'Financial'>('Standard');
  const [reintegrations, setReintegrations] = useState<{ id: string; label: string; amount: number }[]>([
    { id: '1', label: 'Amortissements excédentaires de véhicules de tourisme (>20k TND)', amount: 2400 },
    { id: '2', label: 'Pénalités, amendes fiscales et de retard non déductibles', amount: 850 },
    { id: '3', label: 'Dons excédentaires ou non justifiés', amount: 500 }
  ]);
  const [deductions, setDeductions] = useState<{ id: string; label: string; amount: number }[]>([
    { id: '1', label: 'Produits de participations exonérés / Dividendes reçus', amount: 1200 },
    { id: '2', label: 'Plus-values de cession réinvesties exonérées', amount: 3000 }
  ]);

  const [newReintegrationLabel, setNewReintegrationLabel] = useState('');
  const [newReintegrationAmount, setNewReintegrationAmount] = useState<number>(0);
  const [newDeductionLabel, setNewDeductionLabel] = useState('');
  const [newDeductionAmount, setNewDeductionAmount] = useState<number>(0);

  // Core automatic calculation engine based on actual ERP data
  const baseMetrics = useMemo(() => {
    // 1. Sales & Revenue
    const salesTTC = invoices.reduce((sum, inv) => sum + inv.amountTTC, 0);
    const salesHT = invoices.reduce((sum, inv) => sum + inv.amountHT, 0);
    const vatCollected = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0);
    const withholdingSubies = invoices.reduce((sum, inv) => sum + inv.withholdingAmount, 0);

    // 2. Bank balances
    const cashBoxBalance = bankAccounts.filter(a => a.type === 'CashBox').reduce((sum, a) => sum + a.currentBalance, 0);
    const bankBalance = bankAccounts.filter(a => a.type === 'Checking' || a.type === 'Savings').reduce((sum, a) => sum + a.currentBalance, 0);

    // 3. Transactions categorized
    let achatsGoods = 0;
    let salariesBrut = 0;
    let socialCharges = 0;
    let loyers = 0;
    let bankCharges = 0;
    let generalExpenses = 0; // assurance, transport, entretien, publicite
    let financialInterests = 0;
    let placementRevenues = 0;

    bankTransactions.forEach(t => {
      if (t.status === 'Bounced') return;
      if (t.type === 'Out') {
        if (t.category === 'Achat Fournisseur') {
          achatsGoods += t.amount;
        } else if (t.category === 'Salaire') {
          // Gross estimate from net payout
          salariesBrut += t.amount * 1.15;
          socialCharges += t.amount * 0.17;
        } else if (t.category === 'Loyer') {
          loyers += t.amount;
        } else if (t.category === 'Frais Bancaires') {
          bankCharges += t.amount;
        } else if (t.category === 'Impôts & Taxes') {
          generalExpenses += t.amount * 0.3; // portion taxes
        } else {
          generalExpenses += t.amount;
        }
      } else { // In
        if (t.category === 'Dividendes') {
          placementRevenues += t.amount;
        } else if (t.category === 'Autre') {
          // generic revenue
        }
      }
    });

    // Handle unpaid invoices as Client Receivables (Class 411)
    const clientReceivables = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + inv.amountNetToPay, 0);
    
    // Fournisseurs (accounts payable simulation)
    const unpaidPurchaseEstim = bankTransactions.filter(t => t.status === 'Pending' && t.type === 'Out').reduce((sum, t) => sum + t.amount, 0);
    const supplierPayables = unpaidPurchaseEstim > 0 ? unpaidPurchaseEstim : 12450.000; // conservative default

    return {
      salesHT,
      salesTTC,
      vatCollected,
      withholdingSubies,
      cashBoxBalance,
      bankBalance,
      achatsGoods,
      salariesBrut,
      socialCharges,
      loyers,
      bankCharges,
      generalExpenses,
      financialInterests,
      placementRevenues,
      clientReceivables,
      supplierPayables
    };
  }, [invoices, bankAccounts, bankTransactions]);

  // Derived Balance sheet, general ledger and Trial balance totals
  const trialBalance = useMemo(() => {
    // Merge PCT with dynamically aggregated values from ERP database
    const entries = TUNISIAN_PCT.map(account => {
      let debit = 0;
      let credit = 0;

      // Map dynamic metrics to corresponding Tunisian account codes
      switch (account.code) {
        case '101': // Capital
          credit = 150000.000; // Base Capital Social
          break;
        case '106': // Reserves
          credit = 15000.000;
          break;
        case '110': // Report à nouveau
          credit = 8450.500;
          break;
        case '224': // Vehicles (material of transport)
          debit = 45000.000;
          break;
        case '228': // Bureau / IT
          debit = 18500.000;
          break;
        case '282': // Amortissements Corporelles
          credit = 9500.000;
          break;
        case '311': // Stocks Matières Premières
          debit = 34500.000;
          break;
        case '401': // Fournisseurs
          credit = baseMetrics.supplierPayables;
          break;
        case '411': // Clients
          debit = baseMetrics.clientReceivables;
          break;
        case '434': // TVA Collectée
          credit = baseMetrics.vatCollected;
          break;
        case '436': // TVA Déductible
          debit = baseMetrics.vatCollected * 0.65; // Approx deductible portion
          break;
        case '438': // Retenue à la source subie
          debit = baseMetrics.withholdingSubies;
          break;
        case '532': // Banques
          debit = Math.max(0, baseMetrics.bankBalance);
          if (baseMetrics.bankBalance < 0) credit = Math.abs(baseMetrics.bankBalance);
          break;
        case '582': // Caisses (Espèces)
          debit = baseMetrics.cashBoxBalance;
          break;
        case '601': // Achats
          debit = baseMetrics.achatsGoods > 0 ? baseMetrics.achatsGoods : 28900.000;
          break;
        case '607': // Energie / Eau
          debit = 2450.000;
          break;
        case '613': // Loyer
          debit = baseMetrics.loyers > 0 ? baseMetrics.loyers : 6000.000;
          break;
        case '615': // Entretien
          debit = 1800.000;
          break;
        case '627': // Services bancaires
          debit = baseMetrics.bankCharges > 0 ? baseMetrics.bankCharges : 450.000;
          break;
        case '641': // Personnel
          debit = baseMetrics.salariesBrut > 0 ? baseMetrics.salariesBrut : 18500.000;
          break;
        case '645': // CNSS patronale
          debit = baseMetrics.socialCharges > 0 ? baseMetrics.socialCharges : 3150.000;
          break;
        case '661': // Impôts & taxes (FODEC / Taxe formation professionnelle)
          debit = baseMetrics.generalExpenses * 0.15 + 850;
          break;
        case '701': // Ventes Produits Finis
          credit = baseMetrics.salesHT > 0 ? baseMetrics.salesHT : 98400.000;
          break;
        case '751': // Produits financiers
          credit = baseMetrics.placementRevenues > 0 ? baseMetrics.placementRevenues : 1200.000;
          break;
        default:
          break;
      }

      // Add manual adjustments if any
      const adjs = adjustments.filter(a => a.code === account.code);
      adjs.forEach(adj => {
        debit += adj.debit;
        credit += adj.credit;
      });

      // Calculate closing balance
      let debitBalance = 0;
      let creditBalance = 0;
      const net = debit - credit;

      if (account.type === 'Debit') {
        if (net >= 0) {
          debitBalance = net;
        } else {
          creditBalance = Math.abs(net);
        }
      } else {
        if (net <= 0) {
          creditBalance = Math.abs(net);
        } else {
          debitBalance = net;
        }
      }

      return {
        ...account,
        debit,
        credit,
        debitBalance,
        creditBalance
      };
    });

    // Sort entries by account code
    return entries.sort((a, b) => a.code.localeCompare(b.code));
  }, [baseMetrics, adjustments]);

  // Balance sheet Totals
  const totalBalanceDebits = trialBalance.reduce((sum, e) => sum + e.debit, 0);
  const totalBalanceCredits = trialBalance.reduce((sum, e) => sum + e.credit, 0);
  const totalBalanceDebitBalances = trialBalance.reduce((sum, e) => sum + e.debitBalance, 0);
  const totalBalanceCreditBalances = trialBalance.reduce((sum, e) => sum + e.creditBalance, 0);

  // Dynamic Trial Balance Discrepancy Indicator
  const trialDiscrepancy = Math.abs(totalBalanceDebitBalances - totalBalanceCreditBalances);

  // Intermediate Management Balances (TND)
  const financialResults = useMemo(() => {
    // Extract totals from Class 6 and Class 7
    const class6Accounts = trialBalance.filter(e => e.class === 6);
    const class7Accounts = trialBalance.filter(e => e.class === 7);

    const totalCharges = class6Accounts.reduce((sum, e) => sum + (e.debitBalance - e.creditBalance || 0), 0);
    const totalRevenues = class7Accounts.reduce((sum, e) => sum + (e.creditBalance - e.debitBalance || 0), 0);

    // Specific Tunisian SCE aggregates
    const ventes = trialBalance.filter(e => e.code.startsWith('70')).reduce((sum, e) => sum + e.creditBalance, 0);
    const achatsConsommes = trialBalance.filter(e => e.code.startsWith('601') || e.code.startsWith('607')).reduce((sum, e) => sum + e.debitBalance, 0);
    
    // Marges brutes & valeurs ajoutées (SCE)
    const productionExercice = ventes; 
    const consommationsIntermediaires = achatsConsommes + trialBalance.filter(e => e.code.startsWith('61') || e.code.startsWith('62')).reduce((sum, e) => sum + e.debitBalance, 0);
    const valeurAjoutee = productionExercice - consommationsIntermediaires;

    const chargesPersonnel = trialBalance.filter(e => e.code.startsWith('64')).reduce((sum, e) => sum + e.debitBalance, 0);
    const impotsTaxes = trialBalance.filter(e => e.code.startsWith('66')).reduce((sum, e) => sum + e.debitBalance, 0);
    
    // EBE (Excédent Brut d'Exploitation)
    const ebe = valeurAjoutee - chargesPersonnel - impotsTaxes;

    const dotationsAmort = trialBalance.filter(e => e.code.startsWith('68')).reduce((sum, e) => sum + e.debitBalance, 0);
    const reprisesProv = trialBalance.filter(e => e.code.startsWith('78')).reduce((sum, e) => sum + e.creditBalance, 0);

    // Résultat d'exploitation (EBIT)
    const resultatExploitation = ebe - dotationsAmort + reprisesProv;

    // Financial components
    const chargesFinancieres = trialBalance.filter(e => e.code.startsWith('65')).reduce((sum, e) => sum + e.debitBalance, 0);
    const produitsFinanciers = trialBalance.filter(e => e.code.startsWith('75')).reduce((sum, e) => sum + e.creditBalance, 0);
    const resultatFinancier = produitsFinanciers - chargesFinancieres;

    // Résultat courant avant impôt
    const resultatCourantAvantImpots = resultatExploitation + resultatFinancier;

    // Impôt sur les sociétés
    const IS_Rate = companyCategory === 'Standard' ? 0.15 : companyCategory === 'Favored' ? 0.10 : 0.35;
    
    // Basic tax calculation on positive accounting income
    const IS_due_basic = resultatCourantAvantImpots > 0 ? (resultatCourantAvantImpots * IS_Rate) : 0;
    
    // Net result of the period
    const netProfit = resultatCourantAvantImpots - IS_due_basic;

    return {
      totalCharges,
      totalRevenues,
      productionExercice,
      consommationsIntermediaires,
      valeurAjoutee,
      chargesPersonnel,
      impotsTaxes,
      ebe,
      dotationsAmort,
      reprisesProv,
      resultatExploitation,
      chargesFinancieres,
      produitsFinanciers,
      resultatFinancier,
      resultatCourantAvantImpots,
      IS_due_basic,
      netProfit,
      IS_Rate
    };
  }, [trialBalance, companyCategory]);

  // Taxable profit (Determination du resultat fiscal)
  const fiscalResults = useMemo(() => {
    const rComptable = financialResults.resultatCourantAvantImpots;
    const sumReintegrations = reintegrations.reduce((sum, r) => sum + r.amount, 0);
    const sumDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    
    const rFiscal = rComptable + sumReintegrations - sumDeductions;
    const taxableProfit = Math.max(0, rFiscal);

    const isRate = financialResults.IS_Rate;
    const isDetermined = taxableProfit * isRate;

    // Tunisian minimum tax rules: 0.2% of turnover (Chiffre d'Affaires HT), minimum 300 TND (or 500 TND for companies subject to higher rates)
    const turnover = financialResults.productionExercice;
    const minTaxValue = Math.max(300, turnover * 0.002);
    
    // Tax actually due
    const finalTaxDue = Math.max(isDetermined, minTaxValue);

    return {
      rComptable,
      sumReintegrations,
      sumDeductions,
      rFiscal,
      taxableProfit,
      isDetermined,
      minTaxValue,
      finalTaxDue,
      isRate
    };
  }, [financialResults, reintegrations, deductions]);

  // Asset Statement (Bilan Actif SCE)
  const bilanActif = useMemo(() => {
    // Gather specific values
    const landVal = trialBalance.filter(e => e.code === '221').reduce((sum, e) => sum + e.debitBalance, 0);
    const buildVal = trialBalance.filter(e => e.code === '222').reduce((sum, e) => sum + e.debitBalance, 0);
    const techVal = trialBalance.filter(e => e.code === '223').reduce((sum, e) => sum + e.debitBalance, 0);
    const vehicleVal = trialBalance.filter(e => e.code === '224').reduce((sum, e) => sum + e.debitBalance, 0);
    const computerVal = trialBalance.filter(e => e.code === '228').reduce((sum, e) => sum + e.debitBalance, 0);

    const brutImmobCorp = landVal + buildVal + techVal + vehicleVal + computerVal;
    const amortImmobCorp = trialBalance.filter(e => e.code === '282').reduce((sum, e) => sum + e.creditBalance, 0);
    const netImmobCorp = brutImmobCorp - amortImmobCorp;

    const stockBrut = trialBalance.filter(e => e.code.startsWith('3')).reduce((sum, e) => sum + e.debitBalance, 0);
    const stockDeprec = trialBalance.filter(e => e.code === '391').reduce((sum, e) => sum + e.creditBalance, 0);
    const stockNet = stockBrut - stockDeprec;

    const clientBrut = trialBalance.filter(e => e.code === '411' || e.code === '416').reduce((sum, e) => sum + e.debitBalance, 0);
    const clientDeprec = trialBalance.filter(e => e.code === '491').reduce((sum, e) => sum + e.creditBalance, 0);
    const clientNet = clientBrut - clientDeprec;

    const tvaDeduct = trialBalance.filter(e => e.code === '436').reduce((sum, e) => sum + e.debitBalance, 0);
    const withholdingTaxSubie = trialBalance.filter(e => e.code === '438').reduce((sum, e) => sum + e.debitBalance, 0);
    const otherCurrentAssetsBrut = tvaDeduct + withholdingTaxSubie;
    const otherCurrentAssetsNet = otherCurrentAssetsBrut;

    const liquidities = trialBalance.filter(e => e.code === '532' || e.code === '582').reduce((sum, e) => sum + e.debitBalance, 0);

    // Sum sections
    const totalNonCourantBrut = brutImmobCorp;
    const totalNonCourantAmort = amortImmobCorp;
    const totalNonCourantNet = netImmobCorp;

    const totalCourantBrut = stockBrut + clientBrut + otherCurrentAssetsBrut + liquidities;
    const totalCourantAmort = stockDeprec + clientDeprec;
    const totalCourantNet = stockNet + clientNet + otherCurrentAssetsNet + liquidities;

    const totalActifBrut = totalNonCourantBrut + totalCourantBrut;
    const totalActifAmort = totalNonCourantAmort + totalCourantAmort;
    const totalActifNet = totalNonCourantNet + totalCourantNet;

    return {
      brutImmobCorp,
      amortImmobCorp,
      netImmobCorp,
      stockBrut,
      stockDeprec,
      stockNet,
      clientBrut,
      clientDeprec,
      clientNet,
      otherCurrentAssetsBrut,
      otherCurrentAssetsNet,
      liquidities,
      totalNonCourantBrut,
      totalNonCourantAmort,
      totalNonCourantNet,
      totalCourantBrut,
      totalCourantAmort,
      totalCourantNet,
      totalActifBrut,
      totalActifAmort,
      totalActifNet
    };
  }, [trialBalance]);

  // Liabilities Statement (Bilan Passif SCE)
  const bilanPassif = useMemo(() => {
    const capitalSocial = trialBalance.filter(e => e.code === '101').reduce((sum, e) => sum + e.creditBalance, 0);
    const reserves = trialBalance.filter(e => e.code === '106').reduce((sum, e) => sum + e.creditBalance, 0);
    const reportANouveau = trialBalance.filter(e => e.code === '110').reduce((sum, e) => sum + e.creditBalance, 0) - trialBalance.filter(e => e.code === '119').reduce((sum, e) => sum + e.debitBalance, 0);
    
    // Result of the period before tax, or net after IS
    const resultPeriod = financialResults.netProfit;

    const totalCapitauxPropres = capitalSocial + reserves + reportANouveau + resultPeriod;

    // Liabilities
    const empruntsLT = trialBalance.filter(e => e.code === '164').reduce((sum, e) => sum + e.creditBalance, 0);
    const totalPassifsNonCourants = empruntsLT;

    // Current Liabilities
    const fournisseurs = trialBalance.filter(e => e.code === '401' || e.code === '404').reduce((sum, e) => sum + e.creditBalance, 0);
    const etatTvaCollectee = trialBalance.filter(e => e.code === '431' || e.code === '434').reduce((sum, e) => sum + e.creditBalance, 0);
    const salariesDue = trialBalance.filter(e => e.code === '421').reduce((sum, e) => sum + e.creditBalance, 0);
    const associesCC = trialBalance.filter(e => e.code === '451').reduce((sum, e) => sum + e.creditBalance, 0);

    const totalPassifsCourants = fournisseurs + etatTvaCollectee + salariesDue + associesCC + fiscalResults.finalTaxDue;

    const totalPassifEtCapitaux = totalCapitauxPropres + totalPassifsNonCourants + totalPassifsCourants;

    return {
      capitalSocial,
      reserves,
      reportANouveau,
      resultPeriod,
      totalCapitauxPropres,
      empruntsLT,
      totalPassifsNonCourants,
      fournisseurs,
      etatTvaCollectee,
      salariesDue,
      associesCC,
      totalPassifsCourants,
      totalPassifEtCapitaux
    };
  }, [trialBalance, financialResults, fiscalResults]);

  // Handle manual adjustment submission
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjCode) return;
    setAdjustments(prev => [...prev, { code: adjCode, debit: adjDebit, credit: adjCredit }]);
    setAdjDebit(0);
    setAdjCredit(0);
  };

  const handleRemoveAdjustment = (index: number) => {
    setAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all adjustments
  const handleClearAdjustments = () => {
    setAdjustments([]);
  };

  // PDF Generation for the full packet
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // PDF Styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text("ELYSSA ERP - ÉTATS FINANCIERS", 15, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("République Tunisienne - Système Comptable des Entreprises (SCE)", 15, 26);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-TN')} - Exercice Fiscal 2026`, 15, 31);
    doc.line(15, 35, 195, 35);

    // Title Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("1. BILAN ACTIF (Exprimé en TND)", 15, 45);

    // Bilan Actif Table
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("RUBRIQUES ACTIF", 15, 55);
    doc.text("MONTANT BRUT", 110, 55);
    doc.text("AMORT / PROV", 145, 55);
    doc.text("MONTANT NET", 175, 55);
    doc.line(15, 57, 195, 57);

    // Write Actif lines
    let y = 63;
    const writeActifLine = (label: string, brut: number, amort: number, net: number, isHeader = false) => {
      if (isHeader) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.text(label, 15, y);
      doc.text(brut.toLocaleString('fr-TN', { minimumFractionDigits: 3 }), 110, y);
      doc.text(amort.toLocaleString('fr-TN', { minimumFractionDigits: 3 }), 145, y);
      doc.text(net.toLocaleString('fr-TN', { minimumFractionDigits: 3 }), 175, y);
      y += 6;
    };

    writeActifLine("ACTIFS NON COURANTS", 0, 0, 0, true);
    writeActifLine("Immobilisations corporelles", bilanActif.brutImmobCorp, bilanActif.amortImmobCorp, bilanActif.netImmobCorp);
    writeActifLine("Total des Actifs Non Courants (I)", bilanActif.totalNonCourantBrut, bilanActif.totalNonCourantAmort, bilanActif.totalNonCourantNet, true);
    
    y += 2;
    writeActifLine("ACTIFS COURANTS", 0, 0, 0, true);
    writeActifLine("Stocks & En-cours", bilanActif.stockBrut, bilanActif.stockDeprec, bilanActif.stockNet);
    writeActifLine("Clients et comptes rattachés", bilanActif.clientBrut, bilanActif.clientDeprec, bilanActif.clientNet);
    writeActifLine("Autres actifs courants", bilanActif.otherCurrentAssetsBrut, 0, bilanActif.otherCurrentAssetsNet);
    writeActifLine("Liquidités et équivalents de liquidités", bilanActif.liquidities, 0, bilanActif.liquidities);
    writeActifLine("Total des Actifs Courants (II)", bilanActif.totalCourantBrut, bilanActif.totalCourantAmort, bilanActif.totalCourantNet, true);
    
    doc.line(15, y - 2, 195, y - 2);
    writeActifLine("TOTAL GÉNÉRAL DE L'ACTIF (I + II)", bilanActif.totalActifBrut, bilanActif.totalActifAmort, bilanActif.totalActifNet, true);

    // Page 2: Bilan Passif & État de résultat
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text("2. BILAN PASSIF & CAPITAUX PROPRES (Exprimé en TND)", 15, 20);

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("RUBRIQUES PASSIF & CAPITAUX PROPRES", 15, 30);
    doc.text("MONTANT", 175, 30);
    doc.line(15, 32, 195, 32);

    y = 38;
    const writePassifLine = (label: string, val: number, isHeader = false) => {
      if (isHeader) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.text(label, 15, y);
      doc.text(val.toLocaleString('fr-TN', { minimumFractionDigits: 3 }), 175, y);
      y += 6;
    };

    writePassifLine("CAPITAUX PROPRES", 0, true);
    writePassifLine("Capital social", bilanPassif.capitalSocial);
    writePassifLine("Réserves légales & assimilées", bilanPassif.reserves);
    writePassifLine("Report à nouveau", bilanPassif.reportANouveau);
    writePassifLine("Résultat net de l'exercice", bilanPassif.resultPeriod);
    writePassifLine("Total des Capitaux Propres", bilanPassif.totalCapitauxPropres, true);
    
    y += 2;
    writePassifLine("PASSIFS NON COURANTS (Emprunts LT)", bilanPassif.empruntsLT, true);
    
    y += 2;
    writePassifLine("PASSIFS COURANTS", 0, true);
    writePassifLine("Fournisseurs et comptes rattachés", bilanPassif.fournisseurs);
    writePassifLine("Impôts & Taxes (TVA collectée / IS dû)", bilanPassif.etatTvaCollectee + fiscalResults.finalTaxDue);
    writePassifLine("Personnel & CNSS rattachée", bilanPassif.salariesDue);
    writePassifLine("Total des Passifs Courants", bilanPassif.totalPassifsCourants, true);
    
    doc.line(15, y - 2, 195, y - 2);
    writePassifLine("TOTAL GÉNÉRAL DU PASSIF & CAPITAUX PROPRES", bilanPassif.totalPassifEtCapitaux, true);

    // État de résultat summary on Page 2
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text("3. ÉTAT DE RÉSULTAT COMPACT", 15, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    writePassifLine("PRODUITS DE L'ACTIVITÉ (Chiffre d'Affaires HT)", financialResults.productionExercice);
    writePassifLine("Consommations de l'exercice (Achats/Charges ext.)", financialResults.consommationsIntermediaires);
    writePassifLine("Valeur Ajoutée (VA)", financialResults.valeurAjoutee, true);
    writePassifLine("Charges de personnel & Charges sociales", financialResults.chargesPersonnel);
    writePassifLine("Excédent Brut d'Exploitation (EBE)", financialResults.ebe, true);
    writePassifLine("Dotations aux Amortissements et Provisions", financialResults.dotationsAmort);
    writePassifLine("Résultat d'Exploitation", financialResults.resultatExploitation, true);
    writePassifLine("Résultat Courant Avant Impôt", financialResults.resultatCourantAvantImpots, true);
    writePassifLine("Impôt sur les Sociétés déterminé (IS Tunisien)", fiscalResults.finalTaxDue);
    writePassifLine("RÉSULTAT NET COMPTABLE DE L'EXERCICE", financialResults.netProfit, true);

    // Save
    doc.save(`Elyssa_ERP_Etats_Financiers_Tunisie_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-500 text-indigo-100 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Normes Tunisiennes (SCE)</span>
              <span className="text-xs text-slate-400 font-mono">Tunis Clearing / SIBTEL Standards</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              <span>États Financiers de l'Exercice</span>
            </h2>
            <p className="text-slate-350 text-xs max-w-2xl">
              Génération automatique du Bilan Actif/Passif, État de résultat, Flux de Trésorerie, Balance Générale et détermination du résultat fiscal tunisien (IS/Minimum d'Impôt).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={handleExportPDF}
              className="flex-1 md:flex-initial p-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Exporter la liasse PDF</span>
            </button>
            <button
              onClick={() => triggerPrint('tunisian-liasse-printable', 'Liasse États Financiers - Elyssa ERP')}
              className="flex-1 md:flex-initial p-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-900/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'état actif</span>
            </button>
          </div>
        </div>

        {/* TOP LEVEL KPIS (TUNISIAN LAW) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chiffre d'Affaires HT</span>
            <span className="text-lg font-black font-mono text-indigo-400">
              {fmt(financialResults?.productionExercice)} TND
            </span>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Valeur Ajoutée (VA)</span>
            <span className="text-lg font-black font-mono text-indigo-400">
              {fmt(financialResults?.valeurAjoutee)} TND
            </span>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Résultat Courant (SCE)</span>
            <span className={`text-lg font-black font-mono ${(financialResults?.resultatCourantAvantImpots ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(financialResults?.resultatCourantAvantImpots)} TND
            </span>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Impôt sur Sociétés dû</span>
            <span className="text-lg font-black font-mono text-amber-400">
              {fmt(fiscalResults?.finalTaxDue)} TND
            </span>
          </div>
        </div>
      </div>

      {/* DISCREPANCY WARNING (IF BALANCING TRIAL SHEET IS NOT SECURED) */}
      {(trialDiscrepancy ?? 0) > 0.001 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-800">Déséquilibre de la Balance Générale ({fmt(trialDiscrepancy)} TND)</h4>
            <p className="text-[11px] text-amber-700">
              Les débits ne sont pas rigoureusement égaux aux crédits. Pour simuler ou corriger une écriture d'ajustement (ex: dotation aux amortissements, variation des stocks ou capital social complémentaire), utilisez l'onglet de saisie d'ajustements ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TABS INTERFACE */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'balance' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Balance Générale</span>
        </button>

        <button
          onClick={() => setActiveTab('actif')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'actif' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Bilan Actif</span>
        </button>

        <button
          onClick={() => setActiveTab('passif')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'passif' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Bilan Passif</span>
        </button>

        <button
          onClick={() => setActiveTab('resultat')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'resultat' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>État de Résultat</span>
        </button>

        <button
          onClick={() => setActiveTab('flux')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'flux' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Flux de Trésorerie</span>
        </button>

        <button
          onClick={() => setActiveTab('fiscal')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'fiscal' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Détermination Fiscale</span>
        </button>

        <button
          onClick={() => setActiveTab('pct')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'pct' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Plan Comptable (PCT)</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-2 font-bold text-xs transition border-b-2 flex items-center space-x-1 cursor-pointer ${
            activeTab === 'notes' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Notes Annexes</span>
        </button>
      </div>

      {/* CONTENT INTERFACES */}
      <div id="tunisian-liasse-printable" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* TAB 1: BALANCE GENERALE */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Balance Générale des Comptes (Vérification et Ajustements)</h3>
                <p className="text-[11px] text-slate-500">6 colonnes de contrôle des mouvements débiteurs/créditeurs et soldes finaux de l'exercice.</p>
              </div>
              <span className="p-1 px-2.5 bg-indigo-50 border text-indigo-700 rounded-lg text-[10px] font-mono font-bold">Matricule Fiscal: 1234567/A/M/000</span>
            </div>

            {/* QUICK FORM FOR MANUAL ADJUSTMENTS */}
            <form onSubmit={handleAddAdjustment} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Compte PCT à ajuster</label>
                <select
                  value={adjCode}
                  onChange={(e) => setAdjCode(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {TUNISIAN_PCT.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Mouvement Débit (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  value={adjDebit || ''}
                  onChange={(e) => setAdjDebit(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Mouvement Crédit (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  value={adjCredit || ''}
                  onChange={(e) => setAdjCredit(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 p-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition cursor-pointer"
                >
                  Enregistrer
                </button>
                {adjustments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAdjustments}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg text-xs transition cursor-pointer"
                    title="Vider tous les ajustements"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* ADJUSTMENTS LIST */}
            {adjustments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase">Ajustements comptables appliqués ({adjustments.length}) :</h4>
                <div className="flex flex-wrap gap-2">
                  {adjustments.map((adj, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 p-1 px-2.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-full text-[10px] font-mono">
                      <span>{adj.code} : +{adj.debit > 0 ? `${adj.debit} Db` : `${adj.credit} Cr`}</span>
                      <button type="button" onClick={() => handleRemoveAdjustment(i)} className="text-indigo-400 hover:text-indigo-600 font-extrabold">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TRIAL BALANCE GRID */}
            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                    <th className="p-2.5 pl-4">Code</th>
                    <th className="p-2.5">Intitulé du Compte</th>
                    <th className="p-2.5 text-right font-mono">Cumul Débits</th>
                    <th className="p-2.5 text-right font-mono">Cumul Crédits</th>
                    <th className="p-2.5 text-right font-mono text-indigo-700 bg-indigo-50/30">Solde Débiteur</th>
                    <th className="p-2.5 text-right font-mono text-indigo-700 bg-indigo-50/30">Solde Créditeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                  {trialBalance.map(e => {
                    if (e.debit === 0 && e.credit === 0 && e.debitBalance === 0 && e.creditBalance === 0) return null;
                    return (
                      <tr key={e.code} className="hover:bg-slate-50/50">
                        <td className="p-2 pl-4 font-mono font-bold text-slate-800">{e.code}</td>
                        <td className="p-2 font-semibold text-slate-800">{e.label}</td>
                        <td className="p-2 text-right font-mono text-slate-500">{(e.debit ?? 0) > 0 ? fmt(e.debit) : '-'}</td>
                        <td className="p-2 text-right font-mono text-slate-500">{(e.credit ?? 0) > 0 ? fmt(e.credit) : '-'}</td>
                        <td className="p-2 text-right font-mono text-emerald-700 bg-emerald-50/10 font-bold">{(e.debitBalance ?? 0) > 0 ? fmt(e.debitBalance) : '-'}</td>
                        <td className="p-2 text-right font-mono text-indigo-800 bg-indigo-50/10 font-bold">{(e.creditBalance ?? 0) > 0 ? fmt(e.creditBalance) : '-'}</td>
                      </tr>
                    );
                  })}
                  
                  {/* TOTAL LINE */}
                  <tr className="bg-slate-50 font-black text-xs text-slate-800 border-t-2 border-slate-200">
                    <td colSpan={2} className="p-3 pl-4 text-left font-extrabold uppercase">TOTAUX DE CONTRÔLE</td>
                    <td className="p-3 text-right font-mono">{fmt(totalBalanceDebits)}</td>
                    <td className="p-3 text-right font-mono">{fmt(totalBalanceCredits)}</td>
                    <td className="p-3 text-right font-mono text-emerald-800 bg-emerald-50/50">{fmt(totalBalanceDebitBalances)}</td>
                    <td className="p-3 text-right font-mono text-indigo-950 bg-indigo-50/50">{fmt(totalBalanceCreditBalances)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BILAN ACTIF */}
        {activeTab === 'actif' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bilan Actif (Système Comptable des Entreprises - SCE)</h3>
                <p className="text-[11px] text-slate-500">Présentation des ressources économiques possédées par l'entreprise (Immobilisations, Stocks, Créances et Liquidités).</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                    <th className="p-3 pl-4">ACTIF (Rubriques)</th>
                    <th className="p-3 text-right font-mono">Brut (TND)</th>
                    <th className="p-3 text-right font-mono">Amort. / Prov. (TND)</th>
                    <th className="p-3 text-right font-mono text-indigo-700 bg-indigo-50/30">Net 2026 (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {/* ACTIFS NON COURANTS */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={4} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">ACTIFS NON COURANTS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Immobilisations incorporelles</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Immobilisations corporelles (Terrains, Bâtiments, Véhicules)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.brutImmobCorp)}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.amortImmobCorp)}</td>
                    <td className="p-2.5 text-right font-mono text-indigo-800 font-bold">{fmt(bilanActif?.netImmobCorp)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Immobilisations financières</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="bg-indigo-50/20 font-bold text-slate-800">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">TOTAL ACTIFS NON COURANTS (I)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.totalNonCourantBrut)}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.totalNonCourantAmort)}</td>
                    <td className="p-2.5 text-right font-mono text-indigo-900">{fmt(bilanActif?.totalNonCourantNet)}</td>
                  </tr>

                  {/* ACTIFS COURANTS */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={4} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">ACTIFS COURANTS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Stocks & En-cours (Marchandises, matières premières)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.stockBrut)}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.stockDeprec)}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{fmt(bilanActif?.stockNet)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Clients et comptes rattachés (Créances clients)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.clientBrut)}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.clientDeprec)}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{fmt(bilanActif?.clientNet)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Autres actifs courants (TVA récupérable, Retenues à la source subies)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.otherCurrentAssetsBrut)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-bold">{fmt(bilanActif?.otherCurrentAssetsNet)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Liquidités et équivalents de liquidités (Soldes Banques & Caisses)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.liquidities)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-bold">{fmt(bilanActif?.liquidities)}</td>
                  </tr>
                  <tr className="bg-indigo-50/20 font-bold text-slate-800">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">TOTAL ACTIFS COURANTS (II)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.totalCourantBrut)}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanActif?.totalCourantAmort)}</td>
                    <td className="p-2.5 text-right font-mono text-indigo-900">{fmt(bilanActif?.totalCourantNet)}</td>
                  </tr>

                  {/* GRAND TOTAL */}
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2">
                    <td className="p-3 pl-4 uppercase">TOTAL GÉNÉRAL DE L'ACTIF (I + II)</td>
                    <td className="p-3 text-right font-mono">{fmt(bilanActif?.totalActifBrut)}</td>
                    <td className="p-3 text-right font-mono">{fmt(bilanActif?.totalActifAmort)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-extrabold">{fmt(bilanActif?.totalActifNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BILAN PASSIF */}
        {activeTab === 'passif' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bilan Passif (Capitaux Propres & Passifs - SCE)</h3>
                <p className="text-[11px] text-slate-500">Structure de financement de l'entreprise : capitaux apportés, emprunts bancaires à long terme et dettes d'exploitation.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                    <th className="p-3 pl-4">PASSIF ET CAPITAUX PROPRES (Rubriques)</th>
                    <th className="p-3 text-right font-mono">Net 2026 (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {/* CAPITAUX PROPRES */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">CAPITAUX PROPRES</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Capital social</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.capitalSocial)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Réserves légales & réglementaires</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.reserves)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Report à nouveau (Excedént / Déficit cumulé)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.reportANouveau)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Résultat net de l'exercice (Solde après IS)</td>
                    <td className={`p-2.5 text-right font-mono font-bold ${(bilanPassif?.resultPeriod ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {fmt(bilanPassif?.resultPeriod)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/20 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">TOTAL CAPITAUX PROPRES</td>
                    <td className="p-2.5 text-right font-mono font-black">{fmt(bilanPassif?.totalCapitauxPropres)}</td>
                  </tr>

                  {/* PASSIFS NON COURANTS */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">PASSIFS NON COURANTS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Emprunts à long terme (Établissements financiers)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.empruntsLT)}</td>
                  </tr>
                  <tr className="bg-indigo-50/20 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">TOTAL PASSIFS NON COURANTS</td>
                    <td className="p-2.5 text-right font-mono font-black">{fmt(bilanPassif?.totalPassifsNonCourants)}</td>
                  </tr>

                  {/* PASSIFS COURANTS */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">PASSIFS COURANTS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Fournisseurs d'exploitation et d'immobilisations</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.fournisseurs)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">État - Impôts & Taxes (TVA collectée, Retenue IS due)</td>
                    <td className="p-2.5 text-right font-mono">{fmt((bilanPassif?.etatTvaCollectee ?? 0) + (fiscalResults?.finalTaxDue ?? 0))}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Personnel & Organismes Sociaux (CNSS / Salaires nets dus)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.salariesDue)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Associés - Comptes courants créditeurs</td>
                    <td className="p-2.5 text-right font-mono">{fmt(bilanPassif?.associesCC)}</td>
                  </tr>
                  <tr className="bg-indigo-50/20 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">TOTAL PASSIFS COURANTS</td>
                    <td className="p-2.5 text-right font-mono font-black">{fmt(bilanPassif?.totalPassifsCourants)}</td>
                  </tr>

                  {/* PASSIF & EQUITIES */}
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2">
                    <td className="p-3 pl-4 uppercase">TOTAL PASSIFS & CAPITAUX PROPRES</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-extrabold">{fmt(bilanPassif?.totalPassifEtCapitaux)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BALANCE RECONCILIATION VERIFIER */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rapprochement d'Équilibre Actif/Passif :</span>
              </span>
              <span className="font-mono font-bold text-emerald-900">
                Écart : {fmt(Math.abs((bilanActif?.totalActifNet ?? 0) - (bilanPassif?.totalPassifEtCapitaux ?? 0)))} TND
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: ETAT DE RESULTAT */}
        {activeTab === 'resultat' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">État de Résultat - Soldes Intermédiaires de Gestion (SCE Tunisien)</h3>
                <p className="text-[11px] text-slate-500">Calcul du bénéfice net d'exploitation après déduction des achats, charges de personnel et IS.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                    <th className="p-3 pl-4">SIG - COMPTE DE RÉSULTAT (Comptes Classes 6 et 7)</th>
                    <th className="p-3 text-right font-mono">Débit (Charges)</th>
                    <th className="p-3 text-right font-mono">Crédit (Produits)</th>
                    <th className="p-3 text-right font-mono text-indigo-700 bg-indigo-50/30">Marge / Solde 2026 (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Chiffre d'Affaires HT (Ventes de marchandises / produits)</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.productionExercice, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{fmt(financialResults?.productionExercice, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Consommations de matières & Achats intermédiaires</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.consommationsIntermediaires, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">({fmt(financialResults?.consommationsIntermediaires, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>

                  {/* VALEUR AJOUTEE */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">VALEUR AJOUTÉE COMPTABLE (VA)</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-black text-indigo-900">{fmt(financialResults?.valeurAjoutee, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Charges de personnel (Salaires & CNSS Patronale)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.chargesPersonnel, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">({fmt(financialResults?.chargesPersonnel, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Impôts, taxes et versements assimilés (FODEC / TFP)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.impotsTaxes, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">({fmt(financialResults?.impotsTaxes, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>

                  {/* EBE */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">EXCÉDENT BRUT D'EXPLOITATION (EBE)</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-black text-indigo-900">{fmt(financialResults?.ebe, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Dotations aux Amortissements et Provisions d'exploitation</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.dotationsAmort, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">({fmt(financialResults?.dotationsAmort, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>

                  {/* RESULTAT EXPLOITATION */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">RÉSULTAT D'EXPLOITATION (EBIT)</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono text-slate-900">{fmt(financialResults?.resultatExploitation, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Produits financiers net des charges (Intérêts placements - frais banques)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.chargesFinancieres, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.produitsFinanciers, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">{fmt(financialResults?.resultatFinancier, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  {/* RESULTAT COURANT AVANT IMPOT */}
                  <tr className="bg-slate-200 font-bold text-slate-900">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">RÉSULTAT COURANT AVANT IMPÔTS</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono text-slate-950">{fmt(financialResults?.resultatCourantAvantImpots, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-4 text-slate-800">Impôt sur les sociétés (Tunisian Corporate Tax)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(fiscalResults?.finalTaxDue, 'fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">({fmt(fiscalResults?.finalTaxDue, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>

                  {/* NET INCOME */}
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2">
                    <td className="p-3 pl-4 uppercase">RÉSULTAT NET DE L'EXERCICE 2026</td>
                    <td colSpan={2} className="p-3"></td>
                    <td className={`p-3 text-right font-mono text-emerald-400 font-extrabold`}>
                      {fmt(financialResults?.netProfit, 'fr-TN', { minimumFractionDigits: 3 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ETAT DE FLUX DE TRESORERIE */}
        {activeTab === 'flux' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">État de Flux de Trésorerie (Méthode Indirecte - SCE)</h3>
                <p className="text-[11px] text-slate-500">Analyse de la provenance et de l'affectation des liquidités de l'entreprise sur la période d'exercice.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                    <th className="p-3 pl-4">FLUX DE TRESORERIE (Nature des activités)</th>
                    <th className="p-3 text-right font-mono">Valeur (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {/* ACTIVITE EXPLOITATION */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">I. FLUX DE TRÉSORERIE PROVENANT DE L'EXPLOITATION</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Marge brute d'autofinancement (MBA)</td>
                    <td className="p-2.5 text-right font-mono">{fmt((financialResults?.netProfit || 0) + (financialResults?.dotationsAmort || 0), 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Variation du Besoin en Fonds de Roulement (BFR) - Clients & Stocks</td>
                    <td className="p-2.5 text-right font-mono">({fmt((bilanActif?.stockNet || 0) + (bilanActif?.clientNet || 0) - (bilanPassif?.fournisseurs || 0) * 0.4, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>
                  <tr className="bg-indigo-50/10 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">Flux de Trésorerie Net de l'Exploitation (A)</td>
                    <td className="p-2.5 text-right font-mono">
                      {fmt((financialResults?.netProfit || 0) + (financialResults?.dotationsAmort || 0) - ((bilanActif?.stockNet || 0) + (bilanActif?.clientNet || 0) - (bilanPassif?.fournisseurs || 0) * 0.4), 'fr-TN', { minimumFractionDigits: 3 })}
                    </td>
                  </tr>

                  {/* ACTIVITE INVESTISSEMENT */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">II. FLUX DE TRÉSORERIE PROVENANT DE L'INVESTISSEMENT</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Acquisition d'immobilisations (Matériel, locaux, informatique)</td>
                    <td className="p-2.5 text-right font-mono">({fmt((bilanActif?.brutImmobCorp || 0) * 0.15, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Cession d'éléments d'actif corporel</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="bg-indigo-50/10 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">Flux de Trésorerie Net de l'Investissement (B)</td>
                    <td className="p-2.5 text-right font-mono">({fmt((bilanActif?.brutImmobCorp || 0) * 0.15, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>

                  {/* ACTIVITE FINANCEMENT */}
                  <tr className="bg-slate-100/60 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-600">III. FLUX DE TRÉSORERIE PROVENANT DE FINANCEMENT</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Augmentations de capital / Apport des associés</td>
                    <td className="p-2.5 text-right font-mono">20000.000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-800">Emprunts contractés ou remboursements de dettes financières</td>
                    <td className="p-2.5 text-right font-mono">({fmt((bilanPassif?.empruntsLT || 0) * 0.1, 'fr-TN', { minimumFractionDigits: 3 })})</td>
                  </tr>
                  <tr className="bg-indigo-50/10 font-bold text-indigo-950">
                    <td className="p-2.5 pl-4 uppercase text-[10px]">Flux de Trésorerie Net de Financement (C)</td>
                    <td className="p-2.5 text-right font-mono">{fmt(20000.000 - ((bilanPassif?.empruntsLT || 0) * 0.1), 'fr-TN', { minimumFractionDigits: 3 })}</td>
                  </tr>

                  {/* VARIATION GLOBALE */}
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2">
                    <td className="p-3 pl-4 uppercase">VARIATION NETTE DE TRÉSORERIE (A + B + C)</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-extrabold">
                      {fmt(
                        ((financialResults?.netProfit || 0) + (financialResults?.dotationsAmort || 0) - ((bilanActif?.stockNet || 0) + (bilanActif?.clientNet || 0) - (bilanPassif?.fournisseurs || 0) * 0.4))
                        - ((bilanActif?.brutImmobCorp || 0) * 0.15)
                        + (20000.000 - ((bilanPassif?.empruntsLT || 0) * 0.1)),
                        'fr-TN',
                        { minimumFractionDigits: 3 }
                      )} TND
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: DETERMINATION DU RESULTAT FISCAL */}
        {activeTab === 'fiscal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tableau de Détermination du Résultat Fiscal Tunisien (Passage du Comptable au Fiscal)</h3>
                <p className="text-[11px] text-slate-500">Calcul extra-comptable pour réintégrer les charges non déductibles et déduire les produits exonérés selon le Code de l'IRPP et de l'IS tunisien.</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Taux IS :</span>
                <select
                  value={companyCategory}
                  onChange={(e: any) => setCompanyCategory(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                >
                  <option value="Standard">Standard - 15% (Industrie, Commerce)</option>
                  <option value="Favored">Secteurs Favorisés - 10% (Agriculture, Export)</option>
                  <option value="Financial">Secteurs Financiers / Télécom - 35%</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN: LISTS OF REINTEGRATIONS AND DEDUCTIONS */}
              <div className="space-y-6">
                
                {/* REINTEGRATIONS (CHARGES NON DEDUCTIBLES) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-rose-800 uppercase flex items-center justify-between mb-3">
                    <span>1. Réintégrations Fiscales (+)</span>
                    <span className="p-0.5 px-2 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-mono">{fmt(fiscalResults?.sumReintegrations, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </h4>

                  <ul className="space-y-2 mb-4 text-[11px] font-semibold text-slate-600">
                    {reintegrations.map(r => (
                      <li key={r.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-150">
                        <span>{r.label}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-rose-700">{fmt(r?.amount, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                          <button
                            type="button"
                            onClick={() => setReintegrations(prev => prev.filter(item => item.id !== r.id))}
                            className="text-slate-350 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Add Reintegration form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nouvelle charge non déductible..."
                      value={newReintegrationLabel}
                      onChange={(e) => setNewReintegrationLabel(e.target.value)}
                      className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={newReintegrationAmount || ''}
                      onChange={(e) => setNewReintegrationAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newReintegrationLabel || newReintegrationAmount <= 0) return;
                        setReintegrations(prev => [...prev, { id: Date.now().toString(), label: newReintegrationLabel, amount: newReintegrationAmount }]);
                        setNewReintegrationLabel('');
                        setNewReintegrationAmount(0);
                      }}
                      className="p-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* DEDUCTIONS FISCALES */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase flex items-center justify-between mb-3">
                    <span>2. Déductions Fiscales (-)</span>
                    <span className="p-0.5 px-2 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-mono">{fmt(fiscalResults?.sumDeductions, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </h4>

                  <ul className="space-y-2 mb-4 text-[11px] font-semibold text-slate-600">
                    {deductions.map(d => (
                      <li key={d.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-150">
                        <span>{d.label}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-emerald-700">{fmt(d?.amount, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                          <button
                            type="button"
                            onClick={() => setDeductions(prev => prev.filter(item => item.id !== d.id))}
                            className="text-slate-350 hover:text-emerald-600"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Add Deduction form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nouveau produit déductible..."
                      value={newDeductionLabel}
                      onChange={(e) => setNewDeductionLabel(e.target.value)}
                      className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={newDeductionAmount || ''}
                      onChange={(e) => setNewDeductionAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newDeductionLabel || newDeductionAmount <= 0) return;
                        setDeductions(prev => [...prev, { id: Date.now().toString(), label: newDeductionLabel, amount: newDeductionAmount }]);
                        setNewDeductionLabel('');
                        setNewDeductionAmount(0);
                      }}
                      className="p-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: TAX CALCULATION GRID */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-indigo-400">Synthèse du Calcul de l'IS 2026</h4>
                  <p className="text-[11px] text-slate-400">Passage comptable-fiscal selon le barème officiel tunisien en vigueur.</p>
                </div>

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Résultat Courant Comptable avant Impôt</span>
                    <span className="font-mono text-white">{fmt(fiscalResults?.rComptable, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Cumul des Réintégrations Fiscales (+)</span>
                    <span className="font-mono text-rose-450">+{fmt(fiscalResults?.sumReintegrations, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Cumul des Déductions Fiscales (-)</span>
                    <span className="font-mono text-emerald-400">-{fmt(fiscalResults?.sumDeductions, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 bg-indigo-950/20 p-2 rounded-lg">
                    <span className="text-indigo-400 font-bold">Assiette / Résultat Fiscal de l'exercice</span>
                    <span className="font-mono text-white font-bold">{fmt(fiscalResults?.taxableProfit, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Taux d'Impôt applicable (IS)</span>
                    <span className="font-mono text-white bg-indigo-500/20 p-1 px-2.5 rounded-lg text-[10px]">{((fiscalResults?.isRate || 0) * 100).toFixed(0)} %</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Impôt Théorique déterminé</span>
                    <span className="font-mono text-white">{fmt(fiscalResults?.isDetermined, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">Minimum d'Impôt Tunisien (0.2% de CA, min 300 TND)</span>
                    <span className="font-mono text-amber-400">{fmt(fiscalResults?.minTaxValue, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-amber-400 font-bold block">IMPÔT SUR LES SOCIÉTÉS (IS) FINAL DU</span>
                      <span className="text-[9px] text-slate-400">Le montant le plus élevé entre l'impôt théorique et le minimum légal de 0.2%</span>
                    </div>
                    <span className="font-mono text-lg font-black text-amber-400">{fmt(fiscalResults?.finalTaxDue, 'fr-TN', { minimumFractionDigits: 3 })} TND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PLAN COMPTABLE PCT */}
        {activeTab === 'pct' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Plan Comptable Tunisien (Système National Coordonné)</h3>
                <p className="text-[11px] text-slate-500">Liste officielle des comptes de l'entreprise par classe.</p>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Chercher par code ou nom..."
                    value={pctSearch}
                    onChange={(e) => setPctSearch(e.target.value)}
                    className="w-full text-xs pl-8 p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <select
                  value={pctClassFilter}
                  onChange={(e) => setPctClassFilter(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="All">Toutes les classes</option>
                  <option value="1">Classe 1: Capitaux</option>
                  <option value="2">Classe 2: Immobilisations</option>
                  <option value="3">Classe 3: Stocks</option>
                  <option value="4">Classe 4: Tiers</option>
                  <option value="5">Classe 5: Financiers</option>
                  <option value="6">Classe 6: Charges</option>
                  <option value="7">Classe 7: Produits</option>
                </select>
              </div>
            </div>

            {/* PCT INTERACTIVE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TUNISIAN_PCT.filter(acc => {
                const matchesSearch = acc.code.includes(pctSearch) || acc.label.toLowerCase().includes(pctSearch.toLowerCase());
                const matchesClass = pctClassFilter === 'All' || acc.class === parseInt(pctClassFilter);
                return matchesSearch && matchesClass;
              }).map(acc => (
                <div key={acc.code} className="p-3 bg-slate-50 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition duration-150 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 p-1 px-2 rounded">{acc.code}</span>
                    <span className="text-[11px] font-bold text-slate-800 block mt-1">{acc.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] uppercase font-bold p-1 px-2 rounded-full ${acc.type === 'Debit' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}>
                      {acc.type === 'Debit' ? 'Débiteur' : 'Créditeur'}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1">Classe {acc.class}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: NOTES ANNEXES */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Notes aux États Financiers (Mémoires Explicatifs)</h3>
              <p className="text-[11px] text-slate-500">Cadre d'évaluation comptable, principes légaux et déclarations conformément aux standards tunisiens (SCE).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed font-semibold">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Note 1 : Référentiel et Principes Comptables</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Les présents états financiers sont établis et présentés conformément au Système Comptable des Entreprises (SCE) promulgué par la loi n° 96-112 du 30 décembre 1996 relative au système comptable des entreprises en Tunisie.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    L'unité monétaire de présentation est le Dinar Tunisien (TND), exprimé avec trois décimales (Millimes tunisiens).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Note 2 : Évaluation des Stocks (Classe 3)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Les stocks de matières premières et de marchandises sont évalués au coût historique d'acquisition majoré des frais de douanes, de transport et de transit (coût de revient landed). Les sorties de stocks sont valorisées selon la méthode du Coût Moyen Pondéré (PUMP).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Note 3 : Immobilisations et Amortissements</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Les immobilisations corporelles sont valorisées au coût d'acquisition. L'amortissement est linéaire selon les durées d'utilité économique tunisiennes usuelles :
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Constructions et Bâtiments : 20 ans (5%)</li>
                    <li>Matériel industriel et Outillage : 10 ans (10%)</li>
                    <li>Véhicules et Matériel de transport : 5 ans (20%)</li>
                    <li>Équipement informatique et IT : 3 ans (33.33%)</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Note 4 : Provisions pour Créances Douteuses</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Les créances d'exploitation font l'objet d'un examen individuel à la clôture de l'exercice. Des provisions pour dépréciation de 100% de la valeur de la créance HT sont constituées pour tout client engagé en procédure de liquidation légale ou présentant des risques avérés de non-recouvrement de plus de 360 jours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
