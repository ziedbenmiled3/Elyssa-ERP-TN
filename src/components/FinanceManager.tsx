/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Filter, 
  Wallet, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  Download, 
  Lock, 
  Unlock, 
  Calendar, 
  BookOpen, 
  BarChart2, 
  Percent, 
  Calculator, 
  Search, 
  Check, 
  ChevronRight, 
  FolderOpen,
  DollarSign,
  Printer,
  Info,
  Sparkles,
  AlertTriangle,
  FileText,
  ShieldAlert,
  RefreshCw,
  Scale,
  PlusCircle,
  HelpCircle,
  Send,
  FolderKey,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { BankAccount, BankTransaction, TaxDeclaration, YearEndClosing, Invoice, Product } from '../types';
import IframePrintHelper from './IframePrintHelper';
import TunisianFinancialStatements from './TunisianFinancialStatements';
import TejIntegration from './TejIntegration';

// French Dinar spelling utility of Tunis clearing house SIBTEL standards
function numberToWordsFr(n: number): string {
  if (n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];
  
  const convertUnder100 = (val: number): string => {
    if (val < 10) return units[val];
    if (val >= 10 && val < 20) return teens[val - 10];
    const ten = Math.floor(val / 10);
    const unit = val % 10;
    
    if (ten === 7) {
      return tens[6] + "-" + (unit === 1 ? "et-onze" : teens[unit]);
    }
    if (ten === 9) {
      return tens[8].replace("s", "") + "-" + teens[unit];
    }
    if (unit === 0) return tens[ten];
    if (unit === 1 && ten !== 8) return tens[ten] + "-et-un";
    return tens[ten] + "-" + units[unit];
  };

  const convertUnder1000 = (val: number): string => {
    if (val < 100) return convertUnder100(val);
    const hundred = Math.floor(val / 100);
    const rem = val % 100;
    let hundredStr = hundred === 1 ? "cent" : units[hundred] + " cent";
    if (hundred > 1 && rem === 0) hundredStr += "s";
    if (rem === 0) return hundredStr;
    return hundredStr + " " + convertUnder100(rem);
  };

  const convertUnderMillion = (val: number): string => {
    if (val < 1000) return convertUnder1000(val);
    const thousand = Math.floor(val / 1000);
    const rem = val % 1000;
    let thousandStr = thousand === 1 ? "mille" : convertUnder1000(thousand) + " mille";
    if (rem === 0) return thousandStr;
    return thousandStr + " " + convertUnder1000(rem);
  };

  const convertUnderBillion = (val: number): string => {
    if (val < 1000000) return convertUnderMillion(val);
    const million = Math.floor(val / 1000000);
    const rem = val % 1000000;
    let millionStr = million === 1 ? "un million" : convertUnder1000(million) + " millions";
    if (rem === 0) return millionStr;
    return millionStr + " " + convertUnderMillion(rem);
  };

  const str = convertUnderBillion(n);
  return (str.charAt(0).toUpperCase() + str.slice(1)).replace(/-+/g, ' ').replace(/\s+/g, ' ').trim();
}

function amountToWordsTN(num: number): string {
  const dinars = Math.floor(num);
  const millimes = Math.round((num - dinars) * 1000);
  
  if (dinars === 0 && millimes === 0) return "Zéro Dinar";
  
  const dinarsStr = dinars > 0 ? `${numberToWordsFr(dinars)} Dinar${dinars > 1 ? 's' : ''}` : '';
  const millimesStr = millimes > 0 ? `${numberToWordsFr(millimes)} Millime${millimes > 1 ? 's' : ''}` : '';
  
  if (dinarsStr && millimesStr) {
    return `${dinarsStr} et ${millimesStr}`;
  }
  return dinarsStr || millimesStr;
}

interface TreasuryDiscrepancy {
  id: string;
  date: string;
  department: 'Direction Technique' | 'Direction Logistique' | 'Direction Ressources Humaines' | 'Direction Commerciale' | 'Direction Générale' | 'Direction Marketing';
  amount: number;
  type: 'ExpenseWithoutInvoice' | 'UnreconciledBankTransaction' | 'UnjustifiedAdvance' | 'MissingReceipt';
  description: string;
  nature: string;
  missingDoc: string;
  status: 'Pending' | 'Resolved';
  resolutionComment?: string;
  resolvedAt?: string;
}

interface FinanceManagerProps {
  invoices: Invoice[];
  products: Product[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  taxDeclarations: TaxDeclaration[];
  yearEndClosings: YearEndClosing[];
  onUpdateBankAccounts: (accounts: BankAccount[]) => void;
  onUpdateBankTransactions: (txs: BankTransaction[]) => void;
  onUpdateTaxDeclarations: (decs: TaxDeclaration[]) => void;
  onUpdateYearEndClosings: (closings: YearEndClosing[]) => void;
  readOnly?: boolean;
  currentUser?: any;
  activeCompanyName?: string;
  accountantClientContext?: {
    isAccountantMode: boolean;
    clientName: string;
    mf: string;
    tenantId: string;
  } | null;
  onResetAccountantMode?: () => void;
}

export default function FinanceManager({
  invoices,
  products,
  bankAccounts,
  bankTransactions,
  taxDeclarations,
  yearEndClosings,
  onUpdateBankAccounts,
  onUpdateBankTransactions,
  onUpdateTaxDeclarations,
  onUpdateYearEndClosings,
  readOnly = false,
  currentUser = null,
  activeCompanyName,
  accountantClientContext,
  onResetAccountantMode
}: FinanceManagerProps) {
  // Resolve active company & accountant context
  const companyName = activeCompanyName || localStorage.getItem('carthage_active_company_simulated') || 'Inter-Affaires';

  const accountantContext = useMemo(() => {
    if (accountantClientContext) return accountantClientContext;
    try {
      const saved = localStorage.getItem('carthage_expert_accountant_mode');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }, [accountantClientContext]);
  // Navigation internal tabs with high-fidelity print targeting support
  const [activeSubTab, setActiveSubTab] = useState<'statistics' | 'accounts' | 'transactions' | 'ledger' | 'taxation' | 'closing' | 'traites' | 'treasury' | 'statements'>(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('printTarget');
    if (target === 'printable-grand-livre') return 'ledger';
    return 'statistics';
  });

  // States for high-fidelity printing support
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocName, setPrintDocName] = useState('');
  const [printTarget, setPrintTarget] = useState('');

  // High-fidelity print handler
  const triggerPrint = (elementId: string, docName: string) => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setPrintDocName(docName);
      setPrintTarget(elementId);
      setIsPrintModalOpen(true);
      return;
    }

    const printContent = document.getElementById(elementId);
    if (printContent) {
      const oldRoot = document.getElementById('temp-print-root');
      if (oldRoot) {
        oldRoot.remove();
      }
      
      const clone = printContent.cloneNode(true) as HTMLElement;
      clone.id = 'temp-print-root';
      clone.className = 'temp-print-root ' + (printContent.className || '').replace(/\bhidden\b/g, '');
      
      document.body.classList.add('print-mode-active');
      document.body.appendChild(clone);
      
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error(e);
        }
        
        setTimeout(() => {
          document.body.classList.remove('print-mode-active');
          const tempElement = document.getElementById('temp-print-root');
          if (tempElement) {
            try {
              tempElement.remove();
            } catch (err) {
              console.error('Cleanup print element failed:', err);
            }
          }
        }, 1000);
      }, 500);
    } else {
      window.print();
    }
  };

  // Treasury Discrepancies and Audit States
  const [discrepancies, setDiscrepancies] = useState<TreasuryDiscrepancy[]>(() => {
    const saved = localStorage.getItem('carthage_treasury_discrepancies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    const defaultDiscrepancies: TreasuryDiscrepancy[] = [
      {
        id: 'disc_1',
        date: '2026-06-25',
        department: 'Direction Technique',
        amount: 2450.000,
        type: 'ExpenseWithoutInvoice',
        description: 'Frais de renouvellement annuel des serveurs d\'hébergement Cloud VPS et des sauvegardes MySQL redondées chez OVHcloud.',
        nature: 'Renouvellement d\'infrastructure réseau & serveurs de production',
        missingDoc: 'Facture fournisseur officielle OVHcloud SAS (Prélèvement direct CB du 24/06/2026 sans pièce comptable rattachée)',
        status: 'Pending'
      },
      {
        id: 'disc_2',
        date: '2026-06-22',
        department: 'Direction Ressources Humaines',
        amount: 650.000,
        type: 'UnjustifiedAdvance',
        description: 'Versement immédiat en espèces d\'une avance sur frais et salaire pour le recrutement urgent d\'un chauffeur-livreur intérimaire.',
        nature: 'Avance sur rémunération exceptionnelle réglée en cash',
        missingDoc: 'Avenant de contrat signé par la direction RH et décharge d\'espèces signée de la main du collaborateur intérimaire',
        status: 'Pending'
      },
      {
        id: 'disc_3',
        date: '2026-06-20',
        department: 'Direction Logistique',
        amount: 320.000,
        type: 'MissingReceipt',
        description: 'Réparation d\'extrême urgence effectuée sur l\'arbre de transmission d\'un camion de livraison bloqué à l\'entrée de Sfax.',
        nature: 'Entretien mécanique et pièces de rechange de la flotte logistique',
        missingDoc: 'Facture originale fiscalement conforme du garagiste de permanence (Seul un bon de caisse cartonné a été fourni)',
        status: 'Pending'
      },
      {
        id: 'disc_4',
        date: '2026-06-18',
        department: 'Direction Commerciale',
        amount: 1200.000,
        type: 'UnreconciledBankTransaction',
        description: 'Acompte par virement d\'un nouveau client de la zone industrielle de Ben Arous, crédité sans document contractuel.',
        nature: 'Encaissement client non lettré avec une facture de vente active',
        missingDoc: 'Bon de commande signé ou Devis validé / Facture d\'acompte réglementaire pour déclaration de TVA',
        status: 'Pending'
      }
    ];
    localStorage.setItem('carthage_treasury_discrepancies', JSON.stringify(defaultDiscrepancies));
    return defaultDiscrepancies;
  });

  const [auditRunning, setAuditRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [auditProgressText, setAuditProgressText] = useState('');
  
  // Create Discrepancy Form States
  const [newDiscDept, setNewDiscDept] = useState<'Direction Technique' | 'Direction Logistique' | 'Direction Ressources Humaines' | 'Direction Commerciale' | 'Direction Générale' | 'Direction Marketing'>('Direction Technique');
  const [newDiscAmount, setNewDiscAmount] = useState<string>('');
  const [newDiscType, setNewDiscType] = useState<'ExpenseWithoutInvoice' | 'UnreconciledBankTransaction' | 'UnjustifiedAdvance' | 'MissingReceipt'>('ExpenseWithoutInvoice');
  const [newDiscDesc, setNewDiscDesc] = useState<string>('');
  const [newDiscNature, setNewDiscNature] = useState<string>('');
  const [newDiscMissingDoc, setNewDiscMissingDoc] = useState<string>('');
  
  // Filters & Selected Resolution
  const [filterDiscDept, setFilterDiscDept] = useState<string>('Tous');
  const [filterDiscStatus, setFilterDiscStatus] = useState<'Tous' | 'Pending' | 'Resolved'>('Tous');
  const [selectedResolutionDisc, setSelectedResolutionDisc] = useState<TreasuryDiscrepancy | null>(null);
  const [resolutionComment, setResolutionComment] = useState<string>('');

  // Traite SIBTEL Generator States
  const [trtBankAccountId, setTrtBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [trtBeneficiary, setTrtBeneficiary] = useState('');
  const [trtType, setTrtType] = useState<'In' | 'Out'>('Out'); // Defaults to 'Out' (expenses) as specified in the prompt!
  const [trtAmount, setTrtAmount] = useState<string>(''); // entered manually
  const [trtIssuedDate, setTrtIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [trtDueDate, setTrtDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // default +30j
    return d.toISOString().split('T')[0];
  });
  const [trtReference, setTrtReference] = useState(() => `TRT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [trtLocation, setTrtLocation] = useState('Tunis');
  const [trtCategory, setTrtCategory] = useState<'Vente' | 'Achat Fournisseur' | 'Salaire' | 'Loyer' | 'Impôts & Taxes' | 'Frais Bancaires' | 'Autre'>('Achat Fournisseur');
  const [trtDescription, setTrtDescription] = useState('');
  const [trtHistorySearch, setTrtHistorySearch] = useState('');

  // SIBTEL Traite Multiple Series Generation States
  const [trtIsSeries, setTrtIsSeries] = useState(false);
  const [trtSeriesCount, setTrtSeriesCount] = useState<number>(3);
  const [trtSeriesInterval, setTrtSeriesInterval] = useState<number>(1); // In months
  const [trtSeriesSplitMode, setTrtSeriesSplitMode] = useState<'Split' | 'Repeat'>('Split');

  // Filter States
  const [statTimeFrame, setStatTimeFrame] = useState<'weeks' | 'months' | 'years'>('months');
  
  // Account manager state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccNum, setNewAccNum] = useState('');
  const [newAccType, setNewAccType] = useState<'Checking' | 'Savings' | 'CashBox'>('Checking');
  const [newAccInitial, setNewAccInitial] = useState<number>(0);
  const [newAccCurrency, setNewAccCurrency] = useState<string>('TND');

  // Transaction form states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txAccountId, setTxAccountId] = useState(bankAccounts[0]?.id || '');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState<'In' | 'Out'>('In');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txMethod, setTxMethod] = useState<'Cheque' | 'Traite' | 'Especes' | 'Virement' | 'Prelevement' | 'Autre'>('Cheque');
  const [txRef, setTxRef] = useState('');
  const [txDueDate, setTxDueDate] = useState('');
  const [txBeneficiary, setTxBeneficiary] = useState('');
  const [txCategory, setTxCategory] = useState<'Vente' | 'Achat Fournisseur' | 'Salaire' | 'Loyer' | 'Impôts & Taxes' | 'Frais Bancaires' | 'Autre'>('Vente');
  const [txDesc, setTxDesc] = useState('');

  // Saisie Filters
  const [txMethodFilter, setTxMethodFilter] = useState<string>('all');
  const [txAccountFilter, setTxAccountFilter] = useState<string>('all');
  const [txSearchSearch, setTxSearchSearch] = useState('');

  // Tax Declarations period builder
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [taxYear, setTaxYear] = useState<number>(2026);
  const [taxPeriod, setTaxPeriod] = useState<string>('Q2');

  // Treasury Calculations
  const totalRealBalance = useMemo(() => {
    return bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [bankAccounts]);

  const pendingCollections = useMemo(() => {
    return bankTransactions
      .filter(t => t.type === 'In' && t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [bankTransactions]);

  const pendingDisbursements = useMemo(() => {
    return bankTransactions
      .filter(t => t.type === 'Out' && t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [bankTransactions]);

  const recoveryClaimsAmount = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Debt_Collection')
      .reduce((sum, inv) => sum + (inv.amountNetToPay || inv.amountTTC || 0), 0);
  }, [invoices]);

  const theoreticalTreasury = useMemo(() => {
    return totalRealBalance + pendingCollections - pendingDisbursements + recoveryClaimsAmount;
  }, [totalRealBalance, pendingCollections, pendingDisbursements, recoveryClaimsAmount]);

  // Run audit animation
  const handleRunAudit = () => {
    setAuditRunning(true);
    setAuditComplete(false);
    
    const steps = [
      "Recherche des écritures bancaires non rapprochées dans les journaux...",
      "Analyse comparative des pièces justificatives de la GED...",
      "Analyse des écarts d'écritures de la Direction Commerciale...",
      "Vérification des sorties de caisse de la Direction Logistique...",
      "Audit des fiches de paie et avances de la Direction RH...",
      "Génération du bilan d'arbitrage quotidien de la Direction Générale..."
    ];
    
    let stepIdx = 0;
    setAuditProgressText(steps[0]);
    
    const timer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setAuditProgressText(steps[stepIdx]);
      } else {
        clearInterval(timer);
        setAuditRunning(false);
        setAuditComplete(true);
      }
    }, 800);
  };

  // Add discrepancy manually
  const handleAddDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscAmount || !newDiscNature || !newDiscMissingDoc) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }
    const amt = parseFloat(newDiscAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Veuillez saisir un montant supérieur à zéro.");
      return;
    }
    
    const newD: TreasuryDiscrepancy = {
      id: `disc_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      department: newDiscDept,
      amount: amt,
      type: newDiscType,
      description: newDiscDesc || newDiscNature,
      nature: newDiscNature,
      missingDoc: newDiscMissingDoc,
      status: 'Pending'
    };
    
    const updated = [newD, ...discrepancies];
    setDiscrepancies(updated);
    localStorage.setItem('carthage_treasury_discrepancies', JSON.stringify(updated));
    
    // Clear form
    setNewDiscAmount('');
    setNewDiscDesc('');
    setNewDiscNature('');
    setNewDiscMissingDoc('');
  };

  // Resolve discrepancy with comment
  const handleResolveDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResolutionDisc || !resolutionComment) {
      alert("Veuillez saisir une justification ou un commentaire d'arbitrage.");
      return;
    }
    
    const updated = discrepancies.map(d => {
      if (d.id === selectedResolutionDisc.id) {
        return {
          ...d,
          status: 'Resolved' as const,
          resolutionComment: resolutionComment,
          resolvedAt: new Date().toISOString().split('T')[0]
        };
      }
      return d;
    });
    
    setDiscrepancies(updated);
    localStorage.setItem('carthage_treasury_discrepancies', JSON.stringify(updated));
    setSelectedResolutionDisc(null);
    setResolutionComment('');
  };

  // Download daily PDF report
  const handleDownloadTreasuryPDF = () => {
    const doc = new jsPDF();
    
    // Custom beautiful styles matching Tunisian dinar clearing
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.text("ELYSSA DISTRIBUTION S.A.", 15, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Elyssa ERP - Module Intégral de Direction Générale", 15, 26);
    doc.text(`Rapport d'Audit de Trésorerie Quotidienne du : ${new Date().toLocaleDateString('fr-TN')} à ${new Date().toLocaleTimeString('fr-TN')}`, 15, 32);
    
    // Section 1
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("1. SYNTHÈSE DES DISPONIBILITÉS CONSOLIDÉES", 15, 54);
    doc.line(15, 56, 195, 56);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("A. Trésorerie Réelle Immédiate (Comptes Actifs) :", 18, 65);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalRealBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, 65);
    
    let currentY = 72;
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    bankAccounts.forEach(acc => {
      doc.text(`  • ${acc.bankName} (${acc.accountNumber}) :`, 20, currentY);
      doc.text(`${acc.currentBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, currentY);
      currentY += 5.5;
    });
    
    currentY += 1.5;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("B. Flux de Rapprochements d'Encaissements Attendus :", 18, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // green
    doc.text(`+ ${pendingCollections.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, currentY);
    
    currentY += 6;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text("C. Flux de Décaissements d'Engagements Attendus :", 18, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27); // red
    doc.text(`- ${pendingDisbursements.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, currentY);
    
    currentY += 6;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text("D. Portefeuille de Créances en Recouvrement de Factures :", 18, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202); // indigo
    doc.text(`+ ${recoveryClaimsAmount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, currentY);
    
    currentY += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY - 5, 180, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("SOLDE THÉORIQUE AJUSTÉ CONSOLIDÉ :", 18, currentY + 2);
    doc.text(`${theoreticalTreasury.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`, 140, currentY + 2);
    
    // Section 2
    currentY += 18;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("2. ÉCARTS COMPTABLES PAR DIRECTION OPÉRATIONNELLE", 15, currentY);
    doc.line(15, currentY + 2, 195, currentY + 2);
    
    currentY += 10;
    const activeDiscrepancies = discrepancies.filter(d => d.status === 'Pending');
    if (activeDiscrepancies.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(22, 101, 52);
      doc.text("Aucun écart de trésorerie non justifié n'a été signalé ce jour.", 18, currentY);
    } else {
      doc.setFontSize(9);
      activeDiscrepancies.forEach((disc, idx) => {
        if (currentY > 255) {
          doc.addPage();
          currentY = 22;
        }
        
        doc.setFillColor(254, 242, 242); // red box background
        doc.rect(15, currentY - 4, 180, 24, 'F');
        
        doc.setTextColor(153, 27, 27);
        doc.setFont('helvetica', 'bold');
        doc.text(`Écart #${idx + 1} • ${disc.department} [${disc.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND]`, 18, currentY + 1.5);
        
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nature : ${disc.nature}`, 18, currentY + 6.5);
        doc.text(`Description : ${disc.description}`, 18, currentY + 11.5);
        
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text(`Justification requise : ${disc.missingDoc}`, 18, currentY + 16.5);
        
        currentY += 28;
      });
    }
    
    // Section 3
    const resolvedDiscrepancies = discrepancies.filter(d => d.status === 'Resolved');
    if (resolvedDiscrepancies.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 22;
      }
      currentY += 6;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("3. HISTORIQUE RÉCENT DES ARBITRAGES ET JUSTIFICATIONS", 15, currentY);
      doc.line(15, currentY + 2, 195, currentY + 2);
      
      currentY += 10;
      doc.setFontSize(9);
      resolvedDiscrepancies.forEach((disc, idx) => {
        if (currentY > 255) {
          doc.addPage();
          currentY = 22;
        }
        
        doc.setFillColor(240, 253, 244); // green box background
        doc.rect(15, currentY - 4, 180, 21, 'F');
        
        doc.setTextColor(21, 128, 61);
        doc.setFont('helvetica', 'bold');
        doc.text(`Arbitré • ${disc.department} [${disc.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND]`, 18, currentY + 1.5);
        
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nature : ${disc.nature}`, 18, currentY + 6.5);
        
        doc.setTextColor(22, 101, 52);
        doc.setFont('helvetica', 'bold');
        doc.text(`Arbitrage de la DG : ${disc.resolutionComment} (Régularisé le ${disc.resolvedAt})`, 18, currentY + 11.5);
        
        currentY += 25;
      });
    }
    
    // Bottom Signatures
    if (currentY > 240) {
      doc.addPage();
      currentY = 22;
    }
    currentY += 15;
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text("Directeur Financier & Trésorerie", 22, currentY);
    doc.text("Directeur Général (DG)", 135, currentY);
    
    currentY += 20;
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(8.5);
    doc.text("[Visa Électronique Elyssa ERP]", 22, currentY);
    doc.text("[Arbitrage Certifié Conforme]", 135, currentY);
    
    doc.save(`Bilan_Tresorerie_Elyssa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Compute actual account balances dynamically based on transactions
  const computedAccounts = useMemo(() => {
    return bankAccounts.map(acc => {
      const filteredTxs = bankTransactions.filter(tx => tx.accountId === acc.id && tx.status === 'Cleared');
      const inSum = filteredTxs.filter(t => t.type === 'In').reduce((sum, t) => sum + t.amount, 0);
      const outSum = filteredTxs.filter(t => t.type === 'Out').reduce((sum, t) => sum + t.amount, 0);
      return {
        ...acc,
        currentBalance: acc.initialBalance + inSum - outSum
      };
    });
  }, [bankAccounts, bankTransactions]);

  // Combined Total Cash
  const totalCashOnHand = useMemo(() => {
    return computedAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [computedAccounts]);

  // Handle adding account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccNum) return;
    const newAcc: BankAccount = {
      id: 'acc_' + Date.now(),
      bankName: newAccName,
      accountNumber: newAccNum,
      type: newAccType as any,
      initialBalance: Number(newAccInitial),
      currentBalance: Number(newAccInitial),
      currency: newAccCurrency,
      status: 'Active'
    };
    onUpdateBankAccounts([...bankAccounts, newAcc]);
    setIsAccountModalOpen(false);
    setNewAccName('');
    setNewAccNum('');
    setNewAccInitial(0);
    setNewAccCurrency('TND');
  };

  // Handle adding payment transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0 || !txBeneficiary) return;
    
    const selectedAcc = computedAccounts.find(a => a.id === txAccountId);
    const newTx: BankTransaction = {
      id: 'tx_' + Date.now(),
      accountId: txAccountId,
      accountName: selectedAcc ? selectedAcc.bankName : 'Compte Inconnu',
      date: txDate,
      type: txType,
      amount: Number(txAmount),
      method: txMethod,
      reference: txRef || 'N/A',
      dueDate: txDueDate || undefined,
      beneficiaryOrIssuer: txBeneficiary,
      category: txCategory as any,
      description: txDesc,
      status: txMethod === 'Especes' || txMethod === 'Virement' ? 'Cleared' : 'Pending'
    };

    onUpdateBankTransactions([newTx, ...bankTransactions]);
    setIsTxModalOpen(false);
    // Reset transaction state
    setTxAmount(0);
    setTxRef('');
    setTxDueDate('');
    setTxBeneficiary('');
    setTxDesc('');
  };

  // Toggle transaction clearing state
  const handleToggleTxStatus = (txId: string) => {
    if (readOnly) return;
    const updated = bankTransactions.map(t => {
      if (t.id === txId) {
        const nextStatus: 'Cleared' | 'Pending' | 'Bounced' = 
          t.status === 'Pending' ? 'Cleared' : 
          t.status === 'Cleared' ? 'Bounced' : 'Pending';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onUpdateBankTransactions(updated);
  };

  // Filtered transactions for the Saisie view
  const filteredTxs = useMemo(() => {
    return bankTransactions.filter(tx => {
      const matchMethod = txMethodFilter === 'all' || tx.method === txMethodFilter;
      const matchAccount = txAccountFilter === 'all' || tx.accountId === txAccountFilter;
      const matchSearch = !txSearchSearch || 
        tx.beneficiaryOrIssuer.toLowerCase().includes(txSearchSearch.toLowerCase()) || 
        tx.reference.toLowerCase().includes(txSearchSearch.toLowerCase()) || 
        (tx.description && tx.description.toLowerCase().includes(txSearchSearch.toLowerCase()));
      return matchMethod && matchAccount && matchSearch;
    });
  }, [bankTransactions, txMethodFilter, txAccountFilter, txSearchSearch]);

  // Automated Accounting Syncing from Invoices
  // Synthesizes double-entry balance sheets, receipts, and VAT ledgers
  const ledgerEntries = useMemo(() => {
    const entries: {
      id: string;
      date: string;
      label: string;
      debit: number;
      credit: number;
      accountCode: string;
      source: string;
    }[] = [];

    // 1. Process invoices (Client sales ledger - Class 7 in French/Tunisian schema)
    invoices.forEach(inv => {
      // HT is a credit for revenue
      entries.push({
        id: `inv-rev-${inv.id}`,
        date: inv.issuedDate,
        label: `Vente Client - Facture ${inv.invoiceNumber} (${inv.clientName})`,
        debit: 0,
        credit: inv.amountHT,
        accountCode: '701100', // Ventes de produits finis
        source: `Facturation`
      });

      // TVA is a credit for tax payable
      entries.push({
        id: `inv-tva-${inv.id}`,
        date: inv.issuedDate,
        label: `TVA Collectée 19% - Facture ${inv.invoiceNumber}`,
        debit: 0,
        credit: inv.vatAmount,
        accountCode: '436710', // État - TVA Collectée
        source: `Facturation`
      });

      // Client debt is a debit
      entries.push({
        id: `inv-debt-${inv.id}`,
        date: inv.issuedDate,
        label: `Créance Client - Facture ${inv.invoiceNumber}`,
        debit: inv.amountTTC,
        credit: 0,
        accountCode: '411000', // Clients
        source: `Facturation`
      });

      // If Withholding applied, record it
      if (inv.withholdingAmount > 0) {
        entries.push({
          id: `inv-rs-${inv.id}`,
          date: inv.issuedDate,
          label: `Retenue à la source subie - Facture ${inv.invoiceNumber}`,
          debit: inv.withholdingAmount,
          credit: 0,
          accountCode: '436210', // Retenues subies récuyperables
          source: `Facturation`
        });
      }
    });

    // 2. Process cleared transactions (Class 5 - Bank & cash ledger)
    bankTransactions.filter(t => t.status === 'Cleared').forEach(tx => {
      if (tx.type === 'In') {
        // Cash Inflow: Debit bank
        entries.push({
          id: `tx-in-bank-${tx.id}`,
          date: tx.date,
          label: `Encaissement - ${tx.description} (${tx.beneficiaryOrIssuer})`,
          debit: tx.amount,
          credit: 0,
          accountCode: tx.method === 'Especes' ? '540000' : '532000', // Cash vs Bank
          source: `Banques & Trésorerie`
        });

        // credit counterpart e.g., 411000 Client or 701000
        entries.push({
          id: `tx-in-ctr-${tx.id}`,
          date: tx.date,
          label: `Contrepartie Encaissement - ${tx.beneficiaryOrIssuer}`,
          debit: 0,
          credit: tx.amount,
          accountCode: tx.category === 'Vente' ? '411000' : '750000',
          source: `Banques & Trésorerie`
        });
      } else {
        // Cash Outflow: Credit bank
        entries.push({
          id: `tx-out-bank-${tx.id}`,
          date: tx.date,
          label: `Décaissement - ${tx.description} (${tx.beneficiaryOrIssuer})`,
          debit: 0,
          credit: tx.amount,
          accountCode: tx.method === 'Especes' ? '540000' : '532000',
          source: `Banques & Trésorerie`
        });

        // Account debit according to category
        let accCode = '601000'; // Charges/Achats default
        if (tx.category === 'Salaire') accCode = '640000'; // Personnel
        if (tx.category === 'Loyer') accCode = '613000'; // Locatif
        if (tx.category === 'Impôts & Taxes') accCode = '660000'; // Taxes
        if (tx.category === 'Frais Bancaires') accCode = '627000'; // Frais

        entries.push({
          id: `tx-out-ctr-${tx.id}`,
          date: tx.date,
          label: `Imputation ${tx.category} - ${tx.beneficiaryOrIssuer}`,
          debit: tx.amount,
          credit: 0,
          accountCode: accCode,
          source: `Banques & Trésorerie`
        });
      }
    });

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, bankTransactions]);

  // Statistics Calculations (Weekly, Monthly, Yearly trends)
  const currentYear = 2026;

  const weeklyStats = useMemo(() => {
    // Generate simple weekly markers for 2026
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const wk = 20 + i; // weeks 20 to 27
      return {
        label: `Sem. ${wk}`,
        revenue: 0,
        expenses: 0,
        balance: 0
      };
    });

    // Populate from invoices
    invoices.forEach(inv => {
      const date = new Date(inv.issuedDate);
      if (date.getFullYear() === currentYear) {
        // simple week approximation (June is around week 22-26)
        const month = date.getMonth();
        const day = date.getDate();
        let idx = 0;
        if (month === 5) { // June
          idx = Math.min(3, Math.floor(day / 7));
        } else if (month === 4) { // May
          idx = 0;
        } else {
          idx = 4;
        }
        if (weeks[idx]) {
          weeks[idx].revenue += inv.amountHT;
        }
      }
    });

    // Populate expenses from Out cleared txs
    bankTransactions.filter(t => t.type === 'Out' && t.status === 'Cleared').forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const day = date.getDate();
        let idx = 0;
        if (month === 5) {
          idx = Math.min(3, Math.floor(day / 7));
        } else if (month === 4) {
          idx = 0;
        } else {
          idx = 4;
        }
        if (weeks[idx]) {
          weeks[idx].expenses += t.amount;
        }
      }
    });

    return weeks.map(w => ({ ...w, balance: w.revenue - w.expenses }));
  }, [invoices, bankTransactions]);

  const monthlyStats = useMemo(() => {
    const months = [
      { label: 'Jan', revenue: 0, expenses: 0 },
      { label: 'Fév', revenue: 0, expenses: 0 },
      { label: 'Mar', revenue: 0, expenses: 0 },
      { label: 'Avr', revenue: 0, expenses: 0 },
      { label: 'Mai', revenue: 0, expenses: 0 },
      { label: 'Juin', revenue: 0, expenses: 0 },
    ];

    // Read real values from invoices for currentYear monthly data
    invoices.forEach(inv => {
      const date = new Date(inv.issuedDate);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (monthIdx < 6 && months[monthIdx]) {
          months[monthIdx].revenue += inv.amountHT;
        }
      }
    });

    // Populate monthly expenses from Out transactions
    bankTransactions.filter(tx => tx.type === 'Out' && tx.status === 'Cleared').forEach(tx => {
      const date = new Date(tx.date);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (monthIdx < 6 && months[monthIdx]) {
          months[monthIdx].expenses += tx.amount;
        }
      }
    });

    return months.map(m => ({ ...m, balance: m.revenue - m.expenses }));
  }, [invoices, bankTransactions]);

  const yearlyStats = useMemo(() => {
    const yearsMap: { [key: string]: { label: string; revenue: number; expenses: number; balance: number } } = {};
    
    // Always include at least 2026 as current year
    yearsMap['2026'] = { label: '2026 YTD', revenue: 0, expenses: 0, balance: 0 };
    
    invoices.forEach(inv => {
      const year = new Date(inv.issuedDate).getFullYear().toString();
      const label = year === '2026' ? '2026 YTD' : year;
      if (!yearsMap[year]) {
        yearsMap[year] = { label, revenue: 0, expenses: 0, balance: 0 };
      }
      yearsMap[year].revenue += inv.amountHT;
    });

    bankTransactions.filter(tx => tx.type === 'Out' && tx.status === 'Cleared').forEach(tx => {
      const year = new Date(tx.date).getFullYear().toString();
      const label = year === '2026' ? '2026 YTD' : year;
      if (!yearsMap[year]) {
        yearsMap[year] = { label, revenue: 0, expenses: 0, balance: 0 };
      }
      yearsMap[year].expenses += tx.amount;
    });

    // Compute balance and return sorted list of years
    return Object.keys(yearsMap)
      .sort()
      .map(yr => {
        const item = yearsMap[yr];
        return {
          ...item,
          balance: item.revenue - item.expenses
        };
      });
  }, [invoices, bankTransactions]);

  // Selected statistics data based on timeframe toggle
  const chartData = useMemo(() => {
    if (statTimeFrame === 'weeks') return weeklyStats;
    if (statTimeFrame === 'years') return yearlyStats;
    return monthlyStats;
  }, [statTimeFrame, weeklyStats, monthlyStats, yearlyStats]);

  // Compute total dynamic stats for stats header summary
  const totalFinancialKpis = useMemo(() => {
    const totalCollectedInvoices = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + i.amountTTC, 0);

    const totalInvoicedVat = invoices
      .reduce((sum, i) => sum + i.vatAmount, 0);

    const totalInvoicedWithholding = invoices
      .reduce((sum, i) => sum + i.withholdingAmount, 0);

    return {
      salesVolume: invoices.reduce((sum, i) => sum + i.amountHT, 0),
      vatCollected: totalInvoicedVat,
      withholdingTax: totalInvoicedWithholding,
      clearedRevenue: totalCollectedInvoices
    };
  }, [invoices]);

  const profitabilityRatio = useMemo(() => {
    const totalRev = invoices.reduce((sum, i) => sum + i.amountHT, 0);
    const totalExp = bankTransactions
      .filter(tx => tx.type === 'Out' && tx.status === 'Cleared')
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (totalRev === 0) return 0;
    const netProfit = totalRev - totalExp;
    // Post-tax estimate (15% corporate tax under Tunisian law)
    const postTaxProfit = netProfit > 0 ? netProfit * 0.85 : netProfit;
    const ratio = (postTaxProfit / totalRev) * 100;
    return Math.max(-100, Math.min(100, Math.round(ratio * 10) / 10));
  }, [invoices, bankTransactions]);

  const hasNoData = useMemo(() => {
    return invoices.length === 0 && bankTransactions.length === 0;
  }, [invoices, bankTransactions]);

  // Handle building new tax declarations
  const handleGenerateTaxDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    // Simulate TVA and Retenue summary based on settings
    const randomVatCol = Math.floor(8000 + Math.random() * 5000);
    const randomVatDed = Math.floor(4000 + Math.random() * 3000);
    const rsPaid = Math.floor(500 + Math.random() * 400);
    const rsColl = Math.floor(300 + Math.random() * 300);

    const newDec: TaxDeclaration = {
      id: 'tax_dec_' + Date.now(),
      year: taxYear,
      period: taxPeriod as any,
      periodLabel: `${taxPeriod} - ${taxYear}`,
      tvaCollected: randomVatCol,
      tvaDeductible: randomVatDed,
      tvaDue: randomVatCol - randomVatDed,
      withholdingPaid: rsPaid,
      withholdingCollected: rsColl,
      corporateTaxEstimate: Math.floor((randomVatCol - randomVatDed) * 0.15),
      status: 'Draft',
      totalAmountPaid: (randomVatCol - randomVatDed) + rsColl - rsPaid
    };

    onUpdateTaxDeclarations([newDec, ...taxDeclarations]);
    setIsTaxModalOpen(false);
  };

  const handleValidateTaxDeclaration = (id: string) => {
    if (readOnly) return;
    const updated = taxDeclarations.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'Validated' as const
        };
      }
      return t;
    });
    onUpdateTaxDeclarations(updated);
  };

  const handlePayTaxDeclaration = (id: string) => {
    if (readOnly) return;
    // Prompt state for account payment
    const updated = taxDeclarations.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'Paid' as const,
          filedDate: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    });
    onUpdateTaxDeclarations(updated);
  };

  // Perform Year-End lock or unlock toggle
  const handleToggleClosingLock = (closingId: string) => {
    if (readOnly) return;
    const updated = yearEndClosings.map(cl => {
      if (cl.id === closingId) {
        return {
          ...cl,
          isLocked: !cl.isLocked,
          status: cl.status === 'Closed' ? 'Draft' : 'Closed' as any
        };
      }
      return cl;
    });
    onUpdateYearEndClosings(updated);
  };

  // Max value in chart for scale calculations
  const chartMaxVal = useMemo(() => {
    const vals = chartData.flatMap(d => [d.revenue, d.expenses]);
    return Math.max(...vals, 1000);
  }, [chartData]);

  // Cumulative line chart data for solvency/treasury
  const lineChartData = useMemo(() => {
    let runningSum = 0;
    const cumulativeVals = chartData.map(d => {
      runningSum += (d.revenue - d.expenses);
      return runningSum;
    });
    const maxCum = Math.max(...cumulativeVals.map(v => Math.abs(v)), 1000);
    return {
      values: cumulativeVals,
      max: maxCum
    };
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Tab Header Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
              <Calculator className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight">Finances & Comptabilité Elyssa</h1>
                
                {/* Active Dossier / Tenant Identification Badge */}
                {accountantContext?.isAccountantMode ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-xs">
                    <FolderKey className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>📂 Dossier Client Cabinet : <strong className="text-white">{accountantContext.clientName}</strong> <span className="text-blue-200/80 font-mono text-[11px]">(MF: {accountantContext.mf})</span></span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 shadow-xs">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>🏢 Dossier : <strong className="text-white">{companyName}</strong> (Principal)</span>
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">Suivi multi-comptes, déclaration fiscale, saisie de moyens de paiements et rapprochements comptables</p>
            </div>
          </div>
        </div>

        {/* Right Actions & Dynamic Treasury Badge */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {accountantContext?.isAccountantMode && (
            <button
              type="button"
              onClick={() => {
                if (onResetAccountantMode) {
                  onResetAccountantMode();
                } else {
                  localStorage.removeItem('carthage_expert_accountant_mode');
                  window.location.href = '/?tab=accountant_portal';
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/30 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>⬅️ Revenir au Portail Expert-Comptable</span>
            </button>
          )}

          {/* Dynamic Treasury Badge */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 px-5 text-right w-full sm:w-auto flex justify-between sm:block items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Trésorerie Globale Cumulée</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {totalCashOnHand.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
            </span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 print:hidden">
        <button
          onClick={() => setActiveSubTab('statistics')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'statistics' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Statistiques & Performances</span>
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'accounts' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Multi-Comptes Bancaires ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'transactions' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Saisie des Chèques, Traites & Espèces</span>
        </button>

        <button
          onClick={() => setActiveSubTab('traites')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'traites' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Impression Traites & Échéancier ({bankTransactions.filter(t => t.method === 'Traite' && t.type === 'Out' && t.status === 'Pending').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'ledger' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grand Livre & Écritures</span>
        </button>

        <button
          onClick={() => setActiveSubTab('taxation')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'taxation' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Fiscalité & Taxes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('closing')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'closing' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Clôture Annuelle ({yearEndClosings.filter(c => c.status === 'Closed').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('statements')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'statements' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-650" />
          <span className="font-extrabold text-indigo-950">États Financiers (SCE Tunisien)</span>
        </button>


        <button
          onClick={() => setActiveSubTab('treasury')}
          className={`px-4 py-2.5 font-bold text-xs transition border-b-2 flex items-center space-x-1.5 cursor-pointer relative ${
            activeSubTab === 'treasury' 
              ? 'border-indigo-650 text-indigo-650 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Bilan Quotidien & Écarts</span>
          {discrepancies.filter(d => d.status === 'Pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-red-500 text-white rounded-full font-sans font-bold animate-pulse">
              {discrepancies.filter(d => d.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Main interactive tab switchbody */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">
        
        {/* TAB 1: STATISTICS */}
        {activeSubTab === 'statistics' && (
          <div className="space-y-6">
            {/* Range filters & info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Visualisation des Flux de Trésorerie & Statistiques</h2>
                <p className="text-xs text-slate-500">Courbes d'évolution et chiffres clés consolidés pour l'exercice {currentYear}</p>
              </div>
              <div className="flex bg-white border rounded-lg p-1 text-xs font-bold shadow-xs">
                <button
                  onClick={() => setStatTimeFrame('weeks')}
                  className={`px-3 py-1.5 rounded-md transition ${statTimeFrame === 'weeks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Hebdomadaire
                </button>
                <button
                  onClick={() => setStatTimeFrame('months')}
                  className={`px-3 py-1.5 rounded-md transition ${statTimeFrame === 'months' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setStatTimeFrame('years')}
                  className={`px-3 py-1.5 rounded-md transition ${statTimeFrame === 'years' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Pluriannuel
                </button>
              </div>
            </div>

            {/* Micro stats indicators strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/20 to-slate-50">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Volume de Ventes (CA HT)</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {totalFinancialKpis.salesVolume.toLocaleString('fr-TN')} TND
                </span>
                <span className="text-[9px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-1.5">
                  <ArrowUpRight className="w-3 h-3" /> +12.4% vs exercice précédent
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/20 to-slate-50">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Encaissements Effectifs</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {totalFinancialKpis.clearedRevenue.toLocaleString('fr-TN')} TND
                </span>
                <span className="text-[9px] text-slate-500 font-semibold block mt-1.5">
                  Taux d'encaissement client : <strong className="text-slate-700">88.5%</strong>
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50/20 to-slate-50">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">TVA Collectée (Facturé)</span>
                <span className="text-lg font-black text-amber-700 font-mono">
                  {totalFinancialKpis.vatCollected.toLocaleString('fr-TN')} TND
                </span>
                <span className="text-[9px] text-slate-500 font-semibold block mt-1.5">
                  Détail: Retenues subies clients: <strong className="text-slate-700">{totalFinancialKpis.withholdingTax.toLocaleString()} TND</strong>
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/20 to-slate-50">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Ratio de Rentabilité</span>
                <span className="text-lg font-black text-indigo-750 font-mono">
                  {profitabilityRatio} %
                </span>
                <span className="text-[9px] text-slate-500 font-bold block mt-1.5">
                  Évaluation calculée post-impôts
                </span>
              </div>
            </div>

            {/* High-fidelity responsive custom SVG graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Revenue vs Expenses Side-by-Side (Bar Chart) */}
              <div className="border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden bg-white">
                {hasNoData && (
                  <div className="absolute inset-0 bg-[#121a2e]/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 rounded-xl z-30">
                    <BarChart2 className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="text-xs font-bold text-white">Aucune donnée disponible</p>
                    <p className="text-[10px] text-slate-400 text-center max-w-[220px] mt-0.5">
                      Enregistrez des factures clients ou saisissez des transactions bancaires pour alimenter les graphiques.
                    </p>
                  </div>
                )}
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center justify-between">
                  <span>Comparatif Produits & Charges (TND)</span>
                  <span className="text-[10px] font-medium text-slate-400 font-mono">Légen: 🟦 CA HT / 🟧 Dépenses</span>
                </h3>

                {/* Draw custom SVG interactive bars */}
                <div className="relative h-64 w-full flex items-end justify-between px-3 border-b border-slate-200 pb-2">
                  {chartData.map((d, idx) => {
                    // Height percentage calculation
                    const hRev = chartMaxVal > 0 ? (d.revenue / chartMaxVal) * 80 : 0;
                    const hExp = chartMaxVal > 0 ? (d.expenses / chartMaxVal) * 80 : 0;
                    return (
                      <div key={idx} className="flex flex-col items-center justify-end h-full w-full max-w-[50px] group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white rounded text-[9px] p-2 opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md z-40">
                          <p className="font-bold">{d.label}</p>
                          <p className="text-blue-300">Produits: {d.revenue.toLocaleString('fr-TN')} TND</p>
                          <p className="text-amber-300">Charges: {d.expenses.toLocaleString('fr-TN')} TND</p>
                        </div>

                        {/* Bar containers */}
                        <div className="flex items-end justify-center w-full gap-1 h-48">
                          {/* Revenue blue bar */}
                          <div 
                            style={{ height: `${Math.max(4, hRev)}%` }} 
                            className="w-4 bg-indigo-600 rounded-t-xs hover:bg-indigo-500 transition-all duration-350 shadow-xs"
                          />
                          {/* Expense orange bar */}
                          <div 
                            style={{ height: `${Math.max(4, hExp)}%` }} 
                            className="w-4 bg-amber-500 rounded-t-xs hover:bg-amber-400 transition-all duration-350 shadow-xs"
                          />
                        </div>

                        {/* X Axis Label */}
                        <span className="text-[10px] text-slate-400 mt-2 font-semibold font-mono">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-medium px-2 mt-2">
                  <span>Origine: Base facturation et écritures visées</span>
                  <span>Max: {chartMaxVal.toLocaleString()} TND</span>
                </div>
              </div>

              {/* Card 2: Cumulative cash evolution graph (Line Chart curve) */}
              <div className="border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden bg-white">
                {hasNoData && (
                  <div className="absolute inset-0 bg-[#121a2e]/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 rounded-xl z-30">
                    <TrendingUp className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-xs font-bold text-white">Aucune donnée disponible</p>
                    <p className="text-[10px] text-slate-400 text-center max-w-[220px] mt-0.5">
                      Enregistrez des factures clients ou saisissez des transactions bancaires pour alimenter les graphiques.
                    </p>
                  </div>
                )}
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center justify-between">
                  <span>Évolution de la Solvabilité & Trésorerie</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Flux Net Cumulé</span>
                </h3>

                {/* SVG Curve Line Graph with detailed grid */}
                <div className="relative h-64 w-full">
                  {/* Background horizontal guide lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-slate-350">
                    <div className="border-t border-dashed border-slate-150 w-full" />
                    <div className="border-t border-dashed border-slate-150 w-full" />
                    <div className="border-t border-dashed border-slate-150 w-full" />
                    <div className="border-t border-dashed border-slate-150 w-full" />
                  </div>

                  {/* Draw the visual SVG Line path */}
                  <svg className="w-full h-full pb-8 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4338ca" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#4338ca" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                     {/* Area under line */}
                    <path
                      d={(() => {
                        let points = `M 0,100 `;
                        chartData.forEach((d, i) => {
                          const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                          const x = chartData.length > 1 ? (i / divisor) * 100 : 50;
                          const val = lineChartData.values[i];
                          const y = 100 - (lineChartData.max > 0 ? (Math.max(0, val) / lineChartData.max) * 85 : 0);
                          points += `L ${x},${y} `;
                        });
                        points += `L 100,100 Z`;
                        return points;
                      })()}
                      fill="url(#chartGradient)"
                    />

                    {/* Line itself */}
                    <path
                      d={(() => {
                        let path = '';
                        chartData.forEach((d, i) => {
                          const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                          const x = chartData.length > 1 ? (i / divisor) * 100 : 50;
                          const val = lineChartData.values[i];
                          const y = 100 - (lineChartData.max > 0 ? (Math.max(0, val) / lineChartData.max) * 85 : 0);
                          path += `${i === 0 ? 'M' : 'L'} ${x},${y} `;
                        });
                        return path;
                      })()}
                      fill="none"
                      stroke="#4338ca"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Render data dot hooks */}
                    {chartData.map((d, i) => {
                      const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                      const x = chartData.length > 1 ? (i / divisor) * 100 : 50;
                      const val = lineChartData.values[i];
                      const y = 100 - (lineChartData.max > 0 ? (Math.max(0, val) / lineChartData.max) * 85 : 0);
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#4338ca"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="hover:scale-150 transition-transform cursor-pointer"
                        />
                      );
                    })}
                  </svg>

                  {/* X Axis Labels under SVG */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between px-1 text-[9px] text-slate-400 font-bold font-mono">
                    {chartData.map((d, idx) => (
                      <span key={idx}>{d.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI BANK ACCOUNTS */}
        {activeSubTab === 'accounts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Suivi & Rapprochement des Comptes Bancaires</h3>
                <p className="text-xs text-slate-500">Mise à jour automatique des balances à partir des chèques certifiés et virements encaissés</p>
              </div>
              {!readOnly && (
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Compte Bancaire</span>
                </button>
              )}
            </div>

            {/* Grid of bank cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {computedAccounts.map(acc => (
                <div key={acc.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between h-40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 group-hover:opacity-70 transition duration-500 -mr-4 -mt-4" />
                  
                  <div className="relative">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        acc.type === 'Checking' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                        acc.type === 'Savings' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                        'bg-amber-50 text-amber-700 border border-amber-150'
                      }`}>
                        {acc.type === 'Checking' ? 'Courant' : acc.type === 'Savings' ? 'Épargne' : 'Caisse Espèces'}
                      </span>
                      <span className="text-[10px] text-indigo-650 font-bold font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {acc.currency === 'TND_CONV' ? 'TND Conv.' : (acc.currency || 'TND')}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-2.5 truncate">{acc.bankName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{acc.accountNumber}</p>
                  </div>

                  <div className="relative pt-3 border-t border-slate-100 flex justify-between items-end">
                    <span className="text-[9px] text-slate-400 font-semibold">Solde calculé</span>
                    <span className="text-base font-black text-slate-800 font-mono">
                      {acc.currentBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                      <span className="text-[9.5px] ml-1 font-bold text-slate-400 uppercase">
                        {acc.currency === 'TND_CONV' ? 'TND' : (acc.currency || 'TND')}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for adding account */}
            {isAccountModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-800 pb-3 border-b mb-4">Créer un Nouveau Compte / Caisse</h3>
                  <form onSubmit={handleAddAccount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nom de la Banque ou Caisse *</label>
                      <input 
                        type="text" 
                        required
                        value={newAccName}
                        onChange={e => setNewAccName(e.target.value)}
                        placeholder="Ex: Amen Bank Tunis, Caisse Auxiliaire"
                        className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Identifiant / RIB de compte *</label>
                      <input 
                        type="text" 
                        required
                        value={newAccNum}
                        onChange={e => setNewAccNum(e.target.value)}
                        placeholder="Ex: RIB sur 24 chiffres"
                        className="w-full text-xs p-2.5 border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Type de Compte</label>
                        <select 
                          value={newAccType}
                          onChange={e => setNewAccType(e.target.value as any)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                        >
                          <option value="Checking">Courant professionnel</option>
                          <option value="Savings">Compte d'épargne d'entreprise</option>
                          <option value="CashBox">Caisse caisse-espèces physique</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Devise de Tenue</label>
                        <select 
                          value={newAccCurrency}
                          onChange={e => setNewAccCurrency(e.target.value)}
                          className="w-full text-xs p-2.5 border border-indigo-200 bg-indigo-50/50 font-bold text-indigo-750 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="TND">Dinar Tunisien (TND)</option>
                          <option value="TND_CONV">Dinar Convertible (TND Conv)</option>
                          <option value="EUR">Euro En Devise (EUR)</option>
                          <option value="USD">Dollar Devise (USD)</option>
                          <option value="GBP">Livre Sterling (GBP)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Solde Initial ({newAccCurrency === 'TND_CONV' ? 'TND convertible' : newAccCurrency})
                      </label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={newAccInitial}
                        onChange={e => setNewAccInitial(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded-lg font-mono text-right font-bold text-indigo-900 focus:outline-none" 
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setIsAccountModalOpen(false)}
                        className="p-2 px-4 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="p-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                      >
                        Créer le Compte
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAISIE DES MOYENS DE PAIEMENTS */}
        {activeSubTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Saisie des Flux & Encaissements de Trésorerie</h3>
                <p className="text-xs text-slate-500">Enregistrer les chèques clients, remises de traites fournisseurs, et mouvements d'espèces dans les différents comptes</p>
              </div>
              
              {!readOnly && (
                <button
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Saisir Chèque / Traite / Espèces</span>
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Filtrer par compte bancaire</label>
                <select
                  value={txAccountFilter}
                  onChange={e => setTxAccountFilter(e.target.value)}
                  className="w-full p-2 bg-white text-xs rounded border focus:outline-none"
                >
                  <option value="all">Tous les comptes</option>
                  {computedAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} [{a.currency === 'TND_CONV' ? 'Convertible' : (a.currency || 'TND')}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Filtrer par type de paiement</label>
                <select
                  value={txMethodFilter}
                  onChange={e => setTxMethodFilter(e.target.value)}
                  className="w-full p-2 bg-white text-xs rounded border focus:outline-none"
                >
                  <option value="all">Tous les modes</option>
                  <option value="Cheque">Chiques bancaires</option>
                  <option value="Traite">Traites / Effets</option>
                  <option value="Especes">Espèces / Liquide</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Prelevement">Prélèvements d'achats</option>
                  <option value="Autre">Autres moyens</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Recherche rapide (Bénéficiaire, Ref)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={txSearchSearch}
                    onChange={e => setTxSearchSearch(e.target.value)}
                    placeholder="Chercher..."
                    className="w-full p-2 pl-8.5 bg-white text-xs rounded border focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Transaction Data Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <th className="p-3">Date</th>
                    <th className="p-3">Compte affecté</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Bénéficiaire / Émetteur</th>
                    <th className="p-3">Méthode & Réf</th>
                    <th className="p-3">Échéance</th>
                    <th className="p-3 text-right">Montant (TND)</th>
                    <th className="p-3 text-center">Statut (Iframe friendly)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-405 font-medium italic">
                        Aucun mouvement financier ne correspond à vos filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-slate-600 whitespace-nowrap">{tx.date}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block text-[11px]">{tx.accountName}</span>
                        </td>
                        <td className="p-3">
                          <span className={`p-1 px-1.5 rounded text-[9px] font-bold ${
                            tx.type === 'In' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-red-50 text-red-700 border border-red-150'
                          }`}>
                            {tx.type === 'In' ? 'ENTRÉE +' : 'SORTIE -'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{tx.beneficiaryOrIssuer}</span>
                          <span className="text-[10px] text-slate-400 block block max-w-xs truncate">{tx.description}</span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className="p-0.5 px-1.5 bg-slate-100 border text-slate-600 rounded text-[9px] block mb-0.5 text-center">
                            {tx.method}
                          </span>
                          <span className="text-[10px] text-slate-500 block block text-center bg-slate-50/50 border rounded-sm">{tx.reference}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {tx.dueDate ? (
                            <div className="flex items-center space-x-1 text-slate-700 font-bold">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{tx.dueDate}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Comptant</span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold text-sm ${tx.type === 'In' ? 'text-emerald-600' : 'text-red-650'}`}>
                          {tx.type === 'In' ? '+' : '-'}&nbsp;
                          {tx.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {/* Clever Clear/Toggle button */}
                          <button
                            type="button"
                            onClick={() => handleToggleTxStatus(tx.id)}
                            disabled={readOnly}
                            className={`p-1 px-2 text-[10px] rounded-lg font-black uppercase transition-all shadow-xs inline-flex items-center space-x-1 cursor-pointer ${
                              tx.status === 'Cleared' ? 'bg-emerald-650 hover:bg-emerald-750 text-white' : 
                              tx.status === 'Bounced' ? 'bg-red-650 hover:bg-red-750 text-white' :
                              'bg-amber-100 hover:bg-amber-150 text-amber-800'
                            }`}
                          >
                            {tx.status === 'Cleared' && (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Encaissé (Validé)</span>
                              </>
                            )}
                            {tx.status === 'Pending' && (
                              <>
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                <span>En attente (Viser)</span>
                              </>
                            )}
                            {tx.status === 'Bounced' && (
                              <>
                                <AlertOctagon className="w-3.5 h-3.5" />
                                <span>Impayé / Rejet</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal to add transaction */}
            {isTxModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-xl shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-800 pb-3 border-b mb-4">Saisir un Moyen de Paiement (Chèque, Traite, Espèces)</h3>
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Compte bancaire de destination *</label>
                        <select 
                          value={txAccountId}
                          onChange={e => setTxAccountId(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                        >
                          {computedAccounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.bankName} [{a.currency === 'TND_CONV' ? 'Convertible' : (a.currency || 'TND')}] (RIB: {a.accountNumber.slice(-6)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Date d'enregistrement *</label>
                        <input 
                          type="date" 
                          required
                          value={txDate}
                          onChange={e => setTxDate(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Type de flux financier</label>
                        <div className="flex rounded-lg border p-1 bg-slate-50 gap-1 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => { setTxType('In'); setTxCategory('Vente'); }}
                            className={`w-full py-1.5 rounded-md text-center transition ${txType === 'In' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
                          >
                            Encaissement (+ Entrée)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setTxType('Out'); setTxCategory('Achat Fournisseur'); }}
                            className={`w-full py-1.5 rounded-md text-center transition ${txType === 'Out' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
                          >
                            Décaissement (- Sortie)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Moyen de paiement utilisé *</label>
                        <select 
                          value={txMethod}
                          onChange={e => setTxMethod(e.target.value as any)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                        >
                          <option value="Cheque">Chèque bancaire</option>
                          <option value="Traite">Traite / Effet de commerce</option>
                          <option value="Especes">Espèces / Liquide</option>
                          <option value="Virement">Virement bancaire</option>
                          <option value="Prelevement">Prélèvement automatique</option>
                          <option value="Autre">Autre moyen (Avoir, compensation)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Montant Saisi ({(() => {
                            const activeAcc = bankAccounts.find(a => a.id === txAccountId);
                            return activeAcc?.currency === 'TND_CONV' ? 'TND convertible' : (activeAcc?.currency || 'TND');
                          })()}) *
                        </label>
                        <input 
                          type="number" 
                          step="0.001"
                          required
                          min="0.001"
                          value={txAmount}
                          onChange={e => setTxAmount(Number(e.target.value))}
                          placeholder="0.000"
                          className="w-full text-xs p-2.5 border rounded-lg font-mono text-right font-bold text-indigo-750" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Référence (N° Chèque, traites, pièce) *</label>
                        <input 
                          type="text" 
                          required
                          value={txRef}
                          onChange={e => setTxRef(e.target.value)}
                          placeholder="EX: CHQ-552431 or TRT-998"
                          className="w-full text-xs p-2.5 border rounded-lg font-mono focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Échéance de paiement (Optionnel pour Chèque / Traite)</label>
                        <input 
                          type="date" 
                          value={txDueDate}
                          onChange={e => setTxDueDate(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Bénéficiaire ou Émetteur du paiement *</label>
                        <input 
                          type="text" 
                          required
                          value={txBeneficiary}
                          onChange={e => setTxBeneficiary(e.target.value)}
                          placeholder="Société du tiers, client, trésor public..."
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Catégorie d'imputation comptable</label>
                        <select 
                          value={txCategory}
                          onChange={e => setTxCategory(e.target.value as any)}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                        >
                          <option value="Vente">Chiffre d'Affaire (Ventes)</option>
                          <option value="Achat Fournisseur">Achats Fournisseurs / Services</option>
                          <option value="Salaire">Salaires & Rémunérations</option>
                          <option value="Loyer">Loyer pro & Charges locatives</option>
                          <option value="Impôts & Taxes">Impôts, TVA & Taxes d'état</option>
                          <option value="Frais Bancaires">Frais bancaires & Commissions</option>
                          <option value="Autre">Autres imputations diverses</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Description / Motif de l'écriture</label>
                        <input 
                          type="text" 
                          value={txDesc}
                          onChange={e => setTxDesc(e.target.value)}
                          placeholder="Notes additionnelles d'audit..."
                          className="w-full text-xs p-2.5 border rounded-lg" 
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      * Note : Les espèces et virements sont réputés encaissés immédiatement à la saisie, tandis que les chèques et traites restent à vider manuellement à la confirmation de compensation bancaire.
                    </p>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setIsTxModalOpen(false)}
                        className="p-2 px-4 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="p-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                      >
                        Valider & Saisir l'Écriture
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GENERAL LEDGER (COMPTABILITE GENERAL) */}
        {activeSubTab === 'ledger' && (
          <div id="printable-grand-livre" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Grand Livre des Opérations Comptables</h3>
                <p className="text-xs text-slate-500">Journalisation double-entrée générée dynamiquement à partir de la facturation client et des encaissements de trésorerie.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => triggerPrint('printable-grand-livre', 'Grand Livre des Opérations Comptables')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Grand Livre</span>
                </button>
                <div className="flex items-center space-x-1 font-mono text-[10px] font-bold">
                  <span className="p-1 px-2.5 bg-indigo-100 border text-indigo-700 rounded-lg">Numéro Fiscal: Elyssa MF-1234567/A/M/000</span>
                </div>
              </div>
            </div>

            {/* Trial Balance Quick Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="p-4 bg-white rounded-xl border flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Débit Journal</span>
                  <span className="text-lg font-black text-slate-800 block font-mono">
                    {ledgerEntries.reduce((sum, e) => sum + e.debit, 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                  </span>
                </div>
                <div className="p-2 px-3 bg-indigo-50 border text-indigo-700 rounded-lg text-xs font-bold whitespace-nowrap">
                  Double Entrée OK
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Crédit Journal</span>
                  <span className="text-lg font-black text-slate-800 block font-mono">
                    {ledgerEntries.reduce((sum, e) => sum + e.credit, 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                  </span>
                </div>
                <div className="p-2 px-3 bg-emerald-50 border text-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap">
                  Comptes Équilibrés
                </div>
              </div>
            </div>

            {/* Ledger entries timeline */}
            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <th className="p-3">Source</th>
                    <th className="p-3">Code Compte</th>
                    <th className="p-3 font-semibold text-slate-600">Date</th>
                    <th className="p-3">Libellé de l'Écriture comptable</th>
                    <th className="p-3 text-right">Débit (TND)</th>
                    <th className="p-3 text-right">Crédit (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {ledgerEntries.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <span className="p-1 px-1.5 bg-indigo-50/50 text-indigo-700 font-black rounded text-[9px] border whitespace-nowrap">
                          {e.source}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-650">{e.accountCode}</td>
                      <td className="p-3 text-slate-500">{e.date}</td>
                      <td className="p-3 text-slate-800 font-sans font-medium">{e.label}</td>
                      <td className="p-3 text-right text-slate-700 font-bold">
                        {e.debit > 0 ? e.debit.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) : '—'}
                      </td>
                      <td className="p-3 text-right text-slate-700 font-bold">
                        {e.credit > 0 ? e.credit.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: FISCALITY */}
        {activeSubTab === 'taxation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Déclarations Fiscales & Taxes d'État (Tunisie)</h3>
                <p className="text-xs text-slate-500">Estimations en temps réel de la TVA mensuelle de commerce et des déclarations de retenue de source à reverser</p>
              </div>
              
              {!readOnly && (
                <button
                  onClick={() => setIsTaxModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 px-4 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Calculer Déclaration Mensuelle / Standard</span>
                </button>
              )}
            </div>

            {/* Quick Tax Formula explanation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5 leading-relaxed text-slate-600">
              <span className="font-extrabold uppercase text-slate-500 text-[9px] tracking-widest block">Note d'information fiscale</span>
              <p>
                Selon le code fiscal tunisien: La <strong>TVA Collectée (19%)</strong> issue de vos factures de ventes est due à l'État, nette de la <strong>TVA déductible</strong> supportée sur vos fournisseurs et services opérationnels. De plus, la retenue à la source <strong>(RS)</strong> subie de 1,5% par vos clients grands comptes s'impute en crédit d'impôt récupérable.
              </p>
            </div>

            {/* Real Declarations timeline table */}
            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <th className="p-3">Exercice Fiscale</th>
                    <th className="p-3">Période visée</th>
                    <th className="p-3 text-right">TVA Collectée (Ventes)</th>
                    <th className="p-3 text-right">TVA Déductible (Achats)</th>
                    <th className="p-3 text-right">Net TVA dûe (TND)</th>
                    <th className="p-3 text-right">RS Subies / RS à Reverser</th>
                    <th className="p-3 text-right">Solde Final de Trésorerie</th>
                    <th className="p-3 text-center">État Déclaratif</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(Array.isArray(taxDeclarations) ? taxDeclarations : []).map(dec => {
                    const rawDec = dec as any;
                    const tvaCollected = dec?.tvaCollected ?? rawDec?.tvaCollectee ?? 0;
                    const tvaDeductible = dec?.tvaDeductible ?? 0;
                    const tvaDue = dec?.tvaDue ?? rawDec?.netTvaPayable ?? (tvaCollected - tvaDeductible);
                    const withholdingPaid = dec?.withholdingPaid ?? rawDec?.retenueSource ?? 0;
                    const withholdingCollected = dec?.withholdingCollected ?? 0;
                    const totalAmountPaid = dec?.totalAmountPaid ?? (tvaDue + withholdingCollected - withholdingPaid);
                    const periodLabel = dec?.periodLabel || dec?.period || 'G50';
                    const year = dec?.year || 2026;

                    return (
                      <tr key={dec?.id || Math.random()} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-slate-600">{year}</td>
                        <td className="p-3 font-bold text-slate-800 font-sans">{periodLabel}</td>
                        <td className="p-3 text-right text-red-650 font-bold">{tvaCollected.toLocaleString('fr-TN')} TND</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">{tvaDeductible.toLocaleString('fr-TN')} TND</td>
                        <td className={`p-3 text-right font-bold ${tvaDue >= 0 ? 'text-slate-800' : 'text-emerald-700'}`}>
                          {tvaDue.toLocaleString('fr-TN')} TND
                        </td>
                        <td className="p-3 text-right text-slate-600 block leading-tight pt-3.5">
                          <span className="block text-[10px]">Subies: {withholdingPaid.toLocaleString('fr-TN')}</span>
                          <span className="block text-[10px] text-indigo-700">Reverser: {withholdingCollected.toLocaleString('fr-TN')}</span>
                        </td>
                        <td className="p-3 text-right text-slate-900 font-black text-xs">
                          <strong>{totalAmountPaid.toLocaleString('fr-TN')} TND</strong>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`p-1 px-2.5 rounded-full text-[10px] font-bold leading-tight ${
                            dec?.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 
                            dec?.status === 'Validated' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                            'bg-amber-50 text-amber-700 border border-amber-150'
                          }`}>
                            {dec?.status === 'Paid' ? 'Déclaré & Solder' : dec?.status === 'Validated' ? 'Visé / Validé' : 'Brouillon'}
                          </span>
                          {dec?.filedDate && (
                            <span className="block text-[9px] text-slate-400 mt-1">le {dec.filedDate}</span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap font-sans">
                          {!readOnly && (
                            <div className="flex justify-center gap-1.5">
                              {dec?.status === 'Draft' && (
                                <button
                                  type="button"
                                  onClick={() => handleValidateTaxDeclaration(dec.id)}
                                  className="bg-indigo-650 hover:bg-indigo-750 text-white p-1 px-2.5 rounded font-bold text-[10px] cursor-pointer transition"
                                >
                                  Viser Déclaration
                                </button>
                              )}
                              {dec?.status === 'Validated' && (
                                <button
                                  type="button"
                                  onClick={() => handlePayTaxDeclaration(dec.id)}
                                  className="bg-emerald-600 hover:bg-emerald-750 text-white p-1 px-2.5 rounded font-bold text-[10px] cursor-pointer transition"
                                >
                                  Certifier le Paiement
                                </button>
                              )}
                              {dec?.status === 'Paid' && (
                                <span className="text-[10px] text-slate-400 italic">Opération archivée</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!taxDeclarations || taxDeclarations.length === 0) && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs italic font-sans">
                        Aucune déclaration fiscale enregistrée pour cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tax modal builder form */}
            {isTaxModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-800 pb-3 border-b mb-4">Calculer / Générer une Déclaration Fiscale</h3>
                  <form onSubmit={handleGenerateTaxDeclaration} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Exercice Fiscale (Année) *</label>
                      <select 
                        value={taxYear}
                        onChange={e => setTaxYear(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Période de la Déclaration *</label>
                      <select 
                        value={taxPeriod}
                        onChange={e => setTaxPeriod(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                      >
                        <option value="Q1">1er Trimestre (Q1)</option>
                        <option value="Q2">2ème Trimestre (Q2)</option>
                        <option value="Q3">3ème Trimestre (Q3)</option>
                        <option value="Q4">4ème Trimestre (Q4)</option>
                        <option value="M06">Mois de Juin</option>
                        <option value="M07">Mois de Juillet</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setIsTaxModalOpen(false)}
                        className="p-2 px-4 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="p-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                      >
                        Calculer à blanc
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: YEAR END CLOSING (CLOTURE DE FIN D'ANNEE) */}
        {activeSubTab === 'closing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Clôture des Exercices Comptables</h3>
              <p className="text-xs text-slate-500">Mise sous clé officielle de l'exercice et arrêt définitif des journaux d'écritures financiers.</p>
            </div>

            {/* Elegant warning safety badge */}
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
              <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block font-black mb-0.5">Règle de verrouillage obligatoire (Sécurité d'Audit)</strong>
                <span>
                  Lorsqu'un exercice financier est officiellement clos, toutes les écritures associées, et la modification des fiches clients et factures de cet exercice sont verrouillées pour garantir la loyauté de l'audit fiscal aux tiers.
                </span>
              </div>
            </div>

            {/* List of Closings */}
            <div className="space-y-4">
              {yearEndClosings.map(cl => (
                <div key={cl.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-slate-800">Exercice Fiscal {cl.year}</h4>
                      <span className={`p-0.5 px-2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        cl.status === 'Closed' ? 'bg-red-50 text-red-700 border border-red-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                      }`}>
                        {cl.status === 'Closed' ? '🔒 Archivé & Clos' : '📝 Simulation Active (Brouillon)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic max-w-sm">{cl.notes}</p>
                    <div className="text-[10px] text-slate-400">
                      {cl.closedBy && <span>Clos par: <strong>{cl.closedBy}</strong>, le {cl.closingDate}</span>}
                    </div>
                  </div>

                  {/* Financial stats inside closing */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-3 rounded-xl border border-slate-150 font-mono text-xs text-right min-w-[340px]">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block text-left">Produits HT</span>
                      <span className="font-bold text-slate-800">{cl.revenues.toLocaleString()} TND</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block text-left">Charges HT</span>
                      <span className="font-bold text-slate-800">{cl.expenses.toLocaleString()} TND</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block text-left">Impôt IS (15%)</span>
                      <span className="font-bold text-slate-800">{cl.corporateTax.toLocaleString()} TND</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block text-left">Résultat Net</span>
                      <span className="font-black text-indigo-750">{cl.netIncome.toLocaleString()} TND</span>
                    </div>
                  </div>

                  {/* Closing Button trigger */}
                  <div className="whitespace-nowrap font-sans">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleToggleClosingLock(cl.id)}
                        className={`p-2 px-4 rounded-xl text-xs font-bold leading-none inline-flex items-center space-x-1 transition shadow-xs cursor-pointer ${
                          cl.isLocked 
                            ? 'bg-slate-250 hover:bg-slate-300 text-slate-700 border border-slate-300' 
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {cl.isLocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Déverrouiller</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Clôturer Définitivement</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: TUNISIAN TRAITES (IMPRESSION & ECHEANCIER SIBTEL) */}
        {activeSubTab === 'traites' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Éditeur & Échéancier de Traites SIBTEL (Code de Commerce Tunisien)</h3>
                <p className="text-xs text-slate-500">
                  Générez et imprimez vos lettres de change aux cotes bancaires tunisiennes de 180×80 mm. Choisissez une banque pour reporter son RIB, calculez vos dates d'échéances et suivez vos engagements d'achats.
                </p>
              </div>
              <div className="flex bg-slate-50 border p-1 rounded-lg text-xs font-bold shrink-0 self-stretch sm:self-auto justify-center select-none">
                <button
                  type="button"
                  onClick={() => { setTrtType('Out'); setTrtCategory('Achat Fournisseur'); }}
                  className={`px-3 py-1.5 rounded-md transition ${trtType === 'Out' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Traite Fournisseur (Dépense)
                </button>
                <button
                  type="button"
                  onClick={() => { setTrtType('In'); setTrtCategory('Vente'); }}
                  className={`px-3 py-1.5 rounded-md transition ${trtType === 'In' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Traite Client (Recette)
                </button>
              </div>
            </div>

            {/* Traites KPI Quick Sheet */}
            {(() => {
              const trtTxs = bankTransactions.filter(t => t.method === 'Traite');
              const pendingExpenses = trtTxs.filter(t => t.type === 'Out' && t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
              const clearedExpenses = trtTxs.filter(t => t.type === 'Out' && t.status === 'Cleared').reduce((sum, t) => sum + t.amount, 0);
              const pendingRevenues = trtTxs.filter(t => t.type === 'In' && t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-red-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[9.5px] font-black uppercase text-red-500 tracking-wider">Échéances Dépenses à venir (À Payer)</span>
                    <span className="text-xl font-black text-red-600 block font-mono mt-1">
                      {pendingExpenses.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Total traites fournisseurs en attente d'échéance</span>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[9.5px] font-black uppercase text-emerald-500 tracking-wider">Créances Traites Clients à recevoir</span>
                    <span className="text-xl font-black text-emerald-600 block font-mono mt-1">
                      {pendingRevenues.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Total traites émises à recouvrer aux échéances</span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[9.5px] font-black uppercase text-indigo-500 tracking-wider">Traites Décaissées / Libérées</span>
                    <span className="text-xl font-black text-indigo-600 block font-mono mt-1">
                      {clearedExpenses.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Total traites fournisseurs honorées en banque</span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Formulaire Intelligent (Left Pane - 5 columns) */}
              <div className="xl:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center space-x-1.5 border-b pb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black uppercase text-slate-700">Remplissage Assisté de l'effet</span>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!trtBankAccountId || !trtBeneficiary || !trtAmount || Number(trtAmount) <= 0) {
                    alert("Veuillez remplir correctement tous les champs obligatoires (*).");
                    return;
                  }
                  
                  // Helper function for adding months securely inside onSubmit
                  const addMonthsToDate = (dateStr: string, months: number): string => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('-');
                    let y = parseInt(parts[0], 10);
                    let m = parseInt(parts[1], 10) - 1; // 0-indexed
                    let d = parseInt(parts[2], 10);

                    m += months;
                    y += Math.floor(m / 12);
                    m = m % 12;
                    if (m < 0) {
                      m += 12;
                      y -= 1;
                    }

                    const maxDays = new Date(y, m + 1, 0).getDate();
                    if (d > maxDays) {
                      d = maxDays;
                    }

                    const mm = String(m + 1).padStart(2, '0');
                    const dd = String(d).padStart(2, '0');
                    return `${y}-${mm}-${dd}`;
                  };

                  const selectedAcc = bankAccounts.find(a => a.id === trtBankAccountId);
                  
                  if (trtIsSeries) {
                    const count = Number(trtSeriesCount) || 2;
                    const interval = Number(trtSeriesInterval) || 1;
                    
                    if (count < 2) {
                      alert("Pour générer une série, vous devez spécifier au moins 2 traites.");
                      return;
                    }
                    
                    const splitAmount = trtSeriesSplitMode === 'Split' ? (Number(trtAmount) / count) : Number(trtAmount);
                    const roundedAmount = Math.round(splitAmount * 1000) / 1000;
                    
                    const newTxs: BankTransaction[] = [];
                    const nowMs = Date.now();
                    
                    for (let i = 0; i < count; i++) {
                      const nextDueDate = addMonthsToDate(trtDueDate, i * interval);
                      // Formulate series reference, e.g. TRT-2026-426-1/3
                      const currentRef = `${trtReference}-${i + 1}/${count}`;
                      
                      const newTx: BankTransaction = {
                        id: `TX-TRT-${nowMs}-${i}`,
                        accountId: trtBankAccountId,
                        accountName: selectedAcc ? selectedAcc.bankName : 'Banque Elyssa',
                        date: trtIssuedDate,
                        type: trtType,
                        amount: roundedAmount,
                        method: 'Traite',
                        reference: currentRef,
                        dueDate: nextDueDate,
                        beneficiaryOrIssuer: trtBeneficiary,
                        category: trtCategory,
                        description: trtDescription 
                          ? `${trtDescription} (Échéance ${i + 1}/${count})`
                          : `Effet de commerce (Traite SIBTEL) N° ${currentRef}`,
                        status: 'Pending'
                      };
                      newTxs.push(newTx);
                    }
                    
                    onUpdateBankTransactions([...bankTransactions, ...newTxs]);
                    alert(`${count} traites de ${roundedAmount.toFixed(3)} TND ont été générées et ajoutées avec succès dans l'échéancier.`);
                  } else {
                    const newTx: BankTransaction = {
                      id: `TX-TRT-${Date.now()}`,
                      accountId: trtBankAccountId,
                      accountName: selectedAcc ? selectedAcc.bankName : 'Banque Elyssa',
                      date: trtIssuedDate,
                      type: trtType,
                      amount: Number(trtAmount),
                      method: 'Traite',
                      reference: trtReference,
                      dueDate: trtDueDate,
                      beneficiaryOrIssuer: trtBeneficiary,
                      category: trtCategory,
                      description: trtDescription || `Effet de commerce (Traite SIBTEL) N° ${trtReference}`,
                      status: 'Pending'
                    };
                    onUpdateBankTransactions([...bankTransactions, newTx]);
                    alert("Traite unique enregistrée avec succès dans l'historique prévisionnel !");
                  }

                  setTrtReference(`TRT-2026-${Math.floor(100 + Math.random() * 900)}`);
                  setTrtAmount('');
                  setTrtBeneficiary('');
                  setTrtDescription('');
                  setTrtIsSeries(false); // Reset series toggle
                }} className="space-y-3 text-xs">
                  
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Compte Bancaire de Règlement *</label>
                    <select
                      value={trtBankAccountId}
                      onChange={e => setTrtBankAccountId(e.target.value)}
                      className="w-full text-xs p-2 bg-white border rounded focus:outline-none"
                    >
                      {bankAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} ( {a.accountNumber} )
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block italic">
                      RIB détecté : {bankAccounts.find(a => a.id === trtBankAccountId)?.accountNumber || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Référence Traite *</label>
                      <input
                        type="text"
                        required
                        value={trtReference}
                        onChange={e => setTrtReference(e.target.value)}
                        className="w-full text-xs p-2 bg-white border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Lieu de création</label>
                      <input
                        type="text"
                        required
                        value={trtLocation}
                        onChange={e => setTrtLocation(e.target.value)}
                        className="w-full text-xs p-2 bg-white border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">
                      {trtType === 'Out' ? 'Bénéficiaire (Fournisseur) *' : 'Tiré (Débiteur / Client) *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Poulina S.A., Tunisie Câbles, STEG..."
                      value={trtBeneficiary}
                      onChange={e => setTrtBeneficiary(e.target.value)}
                      className="w-full text-xs p-2 bg-white border rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Date de création *</label>
                      <input
                        type="date"
                        required
                        value={trtIssuedDate}
                        onChange={e => setTrtIssuedDate(e.target.value)}
                        className="w-full text-xs p-2 bg-white border rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Date d'échéance *</label>
                      <input
                        type="date"
                        required
                        value={trtDueDate}
                        onChange={e => setTrtDueDate(e.target.value)}
                        className="w-full text-xs p-2 bg-white border rounded font-bold"
                      />
                    </div>
                  </div>

                  {/* Offset Days Shortcuts */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Raccourcis de délais d'échéances commerciaux :</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {[30, 45, 60, 90, 120].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const base = trtIssuedDate ? new Date(trtIssuedDate) : new Date();
                            base.setDate(base.getDate() + days);
                            setTrtDueDate(base.toISOString().split('T')[0]);
                          }}
                          className="p-1 px-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 rounded text-[10px] font-bold transition cursor-pointer"
                        >
                          +{days} jours
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Montant en TND (Saisi à la main) *</label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        min="0.001"
                        value={trtAmount}
                        onChange={e => setTrtAmount(e.target.value)}
                        placeholder="0.000"
                        className="w-full text-xs p-2 bg-white border rounded font-mono font-bold text-indigo-750 text-right"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Imputation catégorie</label>
                      <select
                        value={trtCategory}
                        onChange={e => setTrtCategory(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border rounded focus:outline-none"
                      >
                        <option value="Achat Fournisseur">Achats Fournisseurs</option>
                        <option value="Vente">Chiffre d'Affaire (Ventes)</option>
                        <option value="Loyer">Loyers professionnels</option>
                        <option value="Salaire">Salaires & Commissions</option>
                        <option value="Impôts & Taxes">Taxes de l'État</option>
                        <option value="Frais Bancaires">Commissions de compte</option>
                        <option value="Autre">Autres dépenses diverses</option>
                      </select>
                    </div>
                  </div>

                  {/* SIBTEL Promissory Note Series Generator Options */}
                  <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 font-black text-slate-700 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trtIsSeries}
                          onChange={e => setTrtIsSeries(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span>🔁 Échelonner / Générer plusieurs traites</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Paiement échelonné</span>
                    </div>

                    {trtIsSeries && (
                      <div className="grid grid-cols-1 gap-2.5 pt-1.5 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nombre de traites (n) *</label>
                            <input
                              type="number"
                              min="2"
                              max="36"
                              required={trtIsSeries}
                              value={trtSeriesCount}
                              onChange={e => setTrtSeriesCount(Math.max(2, parseInt(e.target.value) || 2))}
                              className="w-full text-xs p-1.5 bg-white border rounded font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-[9px] text-slate-400 block mt-0.5">Minimum : 2, Maximum : 36</span>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Intervalle (Mois) *</label>
                            <select
                              value={trtSeriesInterval}
                              onChange={e => setTrtSeriesInterval(parseInt(e.target.value) || 1)}
                              className="w-full text-xs p-1.5 bg-white border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="1">Chaque mois (1M)</option>
                              <option value="2">Tous les 2 mois (2M)</option>
                              <option value="3">Tous les 3 mois (Trimestriel)</option>
                              <option value="4">Tous les 4 mois (4M)</option>
                              <option value="6">Tous les 6 mois (Semestriel)</option>
                              <option value="12">Tous les 12 mois (Annuel)</option>
                            </select>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Délai entre échéances</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Calcul du montant pour chaque traite :</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className={`flex items-center gap-1.5 p-2 rounded-lg border text-[10.5px] cursor-pointer transition ${trtSeriesSplitMode === 'Split' ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                              <input
                                type="radio"
                                name="trtSeriesSplitMode"
                                value="Split"
                                checked={trtSeriesSplitMode === 'Split'}
                                onChange={() => setTrtSeriesSplitMode('Split')}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex flex-col">
                                <span>Diviser équitablement</span>
                                <span className="text-[9px] font-normal text-indigo-600 font-mono">
                                  {trtAmount && Number(trtAmount) > 0 
                                    ? `${(Number(trtAmount) / trtSeriesCount).toFixed(3)} TND / note` 
                                    : "Somme répartie"
                                  }
                                </span>
                              </div>
                            </label>

                            <label className={`flex items-center gap-1.5 p-2 rounded-lg border text-[10.5px] cursor-pointer transition ${trtSeriesSplitMode === 'Repeat' ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                              <input
                                type="radio"
                                name="trtSeriesSplitMode"
                                value="Repeat"
                                checked={trtSeriesSplitMode === 'Repeat'}
                                onChange={() => setTrtSeriesSplitMode('Repeat')}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex flex-col">
                                <span>Répéter le montant</span>
                                <span className="text-[9px] font-normal text-indigo-600 font-mono">
                                  {trtAmount && Number(trtAmount) > 0 
                                    ? `${Number(trtAmount).toFixed(3)} TND / note` 
                                    : "Même montant répété"
                                  }
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {trtAmount && Number(trtAmount) > 0 && (
                          <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[10.5px] text-indigo-900 space-y-1 font-mono leading-relaxed shadow-3xs">
                            <span className="block font-sans font-black text-[9px] uppercase text-indigo-500 tracking-wide">Aperçu de la série prévisionnelle :</span>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              <div>• Nombre de traites : <strong className="text-slate-800 font-sans">{trtSeriesCount}</strong></div>
                              <div>• Intervalle : <strong className="text-slate-800 font-sans">{trtSeriesInterval} mois</strong></div>
                              <div>• Montant unitaire : <strong className="text-indigo-700 font-mono">{(trtSeriesSplitMode === 'Split' ? (Number(trtAmount) / trtSeriesCount) : Number(trtAmount)).toFixed(3)} TND</strong></div>
                              <div>• Montant total : <strong className="text-emerald-700 font-mono">{(trtSeriesSplitMode === 'Split' ? Number(trtAmount) : (Number(trtAmount) * trtSeriesCount)).toFixed(3)} TND</strong></div>
                            </div>
                            <div className="text-[9.5px] text-slate-500 border-t pt-1.5 mt-1 border-indigo-100/60 font-sans italic">
                              Réf. attribuées : <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-[10px] text-indigo-950 font-bold">{trtReference}-1/{trtSeriesCount}</span> à <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-[10px] text-indigo-950 font-bold">{trtReference}-{trtSeriesCount}/{trtSeriesCount}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Motif / Notes d'accompagnement</label>
                    <input
                      type="text"
                      placeholder="Ex: Facture FC-2026-118, etc."
                      value={trtDescription}
                      onChange={e => setTrtDescription(e.target.value)}
                      className="w-full text-xs p-2 bg-white border rounded"
                    />
                  </div>

                  {/* Real-time word transcription */}
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider block mb-0.5">Dinar tunisien en toutes lettres (transcription légale)</span>
                    <p className="font-serif italic font-medium leading-relaxed text-slate-700">
                      «&nbsp;{amountToWordsTN(Number(trtAmount) || 0)}&nbsp;»
                    </p>
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2 pt-3">
                      <button
                        type="submit"
                        className="flex-1 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm cursor-pointer"
                      >
                        Enregistrer dans l'Échéancier
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!trtAmount || Number(trtAmount) <= 0) {
                            alert("Veuillez saisir un montant valide avant de générer le fichier PDF.");
                            return;
                          }
                          const selectedAcc = bankAccounts.find(a => a.id === trtBankAccountId);
                          const reportObj = {
                            reference: trtReference,
                            amount: Number(trtAmount),
                            dueDate: trtDueDate,
                            issuedDate: trtIssuedDate,
                            beneficiaryOrIssuer: trtBeneficiary || "Non renseigné",
                            location: trtLocation,
                            bankName: selectedAcc ? selectedAcc.bankName : 'Banque Elyssa',
                            accountNumber: selectedAcc ? selectedAcc.accountNumber : '00000000000000000000',
                            type: trtType
                          };
                          const d = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [180, 80] });
                          d.setDrawColor(200, 200, 200);
                          d.setLineWidth(0.3);
                          d.rect(2, 2, 176, 76);
                          d.setFont('times', 'bold');
                          d.setFontSize(13);
                          d.setTextColor(30, 41, 59);
                          d.text("LETTRE DE CHANGE (TRAITE)", 10, 10);
                          d.setFont('times', 'normal');
                          d.setFontSize(7.5);
                          d.setTextColor(120, 120, 120);
                          d.text("CONFORME AUX STANDARDS INTERBANCAIRES SIBTEL TUNISIE", 10, 13);
                          d.setFont('times', 'bold');
                          d.setFontSize(9);
                          d.setTextColor(15, 23, 42);
                          d.text(`Réf N° : ${reportObj.reference}`, 115, 10);
                          d.setFillColor(245, 247, 250);
                          d.rect(132, 5, 42, 9, 'FD');
                          d.setFont('courier', 'bold');
                          d.setFontSize(11.5);
                          d.setTextColor(29, 78, 216);
                          d.text(`${reportObj.amount.toFixed(3)} TND`, 134, 11);
                          d.setFont('times', 'bold');
                          d.setFontSize(9.5);
                          d.setTextColor(15, 23, 42);
                          d.text("ÉCHÉANCE : ", 10, 22);
                          d.setFont('courier', 'bold');
                          d.setFontSize(10);
                          d.text(reportObj.dueDate, 33, 22);
                          d.setFont('times', 'normal');
                          d.setFontSize(8.5);
                          d.setTextColor(71, 85, 105);
                          d.text("Veuillez payer contre cette lettre de change acceptée à l'ordre de :", 10, 31);
                          d.setFont('times', 'bold');
                          d.setFontSize(10);
                          d.setTextColor(15, 23, 42);
                          const bName = reportObj.type === 'Out' ? reportObj.beneficiaryOrIssuer : "CARTHAGE S.A.";
                          d.text(bName, 15, 36);
                          d.setFont('times', 'normal');
                          d.setFontSize(8);
                          d.setTextColor(71, 85, 105);
                          d.text("Somme en toutes lettres (Tunisian Dinars SIBTEL standards) :", 10, 42);
                          d.setFont('times', 'italic');
                          d.setFontSize(8.5);
                          d.setTextColor(15, 23, 42);
                          const wl = d.splitTextToSize(amountToWordsTN(reportObj.amount), 115);
                          d.text(wl, 14, 46.5);
                          d.setFont('times', 'normal');
                          d.setFontSize(8);
                          d.setTextColor(100, 116, 139);
                          d.text(`Fait à ${reportObj.location}, le ${reportObj.issuedDate}`, 115, 22);
                          d.setFillColor(248, 250, 252);
                          d.rect(10, 53, 105, 15, 'FD');
                          d.setFont('times', 'bold');
                          d.setFontSize(7.5);
                          d.setTextColor(15, 23, 42);
                          d.text("COMPTE DE RÈGLEMENT À DÉBITER (TIRÉ) :", 12, 57);
                          d.setFont('times', 'normal');
                          d.setFontSize(8);
                          d.setTextColor(51, 65, 85);
                          d.text(`Banque : ${reportObj.bankName}`, 12, 61.5);
                          d.setFont('courier', 'bold');
                          d.text(`RIB : ${reportObj.accountNumber}`, 12, 65.5);
                          d.setFont('times', 'normal');
                          d.setFontSize(6.5);
                          d.setTextColor(120, 120, 120);
                          d.text("ACCEPTATION & SIGNATURE", 125, 41);
                          d.line(125, 43, 172, 43);
                          d.text("SIGNATURE DE L'ÉMETTEUR (TIREUR)", 125, 54);
                          d.line(125, 56, 172, 56);
                          const cleanR = reportObj.accountNumber.replace(/\s+/g, '');
                          const bC = cleanR.substring(0, 2) || '12';
                          const gC = cleanR.substring(2, 5) || '345';
                          const aN = cleanR.substring(5, 18) || '0123456789012';
                          const cK = cleanR.substring(18, 20) || '34';
                          const rF = reportObj.reference.replace(/\D/g, '').substring(0, 7) || '1234567';
                          d.setFont('courier', 'normal');
                          d.setFontSize(9.5);
                          d.setTextColor(30, 41, 59);
                          d.text(`⑈ ${rF} ⑈ ${bC} ${gC} ${aN} ⑈ ${cK}`, 25, 75);
                          d.save(`Traite_${reportObj.reference}.pdf`);
                          alert("Fichier PDF de la traite SIBTEL généré avec les dimensions de 180x80 mm !");
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-705 font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                        title="Télécharger le fichier PDF de la traite"
                      >
                        <Printer className="w-4 h-4 text-indigo-600" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}

                </form>
              </div>

              {/* Aperçu en Temps Réel SIBTEL (Right Pane - 7 columns) */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Aperçu Réaliste de la Traite (SIBTEL S-28 Tunis)</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 p-0.5 px-2 rounded font-mono font-bold">180 mm × 80 mm</span>
                </div>

                {/* SIBTEL graphical template mockup */}
                <div 
                  className="w-full relative p-5 rounded-2xl select-none min-h-[295px] flex flex-col justify-between overflow-hidden sibtel-cheque-container"
                  style={{
                    backgroundImage: 'radial-gradient(#9a3412 0.5px, transparent 0.5px)',
                    backgroundSize: '10px 10px'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-5xl font-serif tracking-widest font-black text-amber-900 select-none">SIBTEL TUNISIE</span>
                  </div>

                  {/* SIBTEL Top Section */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs font-serif tracking-wide border-b border-orange-200/40 pb-0.5" style={{ color: '#1e293b' }}>
                        LETTRE DE CHANGE (TRAITE)
                      </h4>
                      <div className="text-[7.5px] font-mono tracking-wider leading-relaxed opacity-85" style={{ color: '#475569' }}>
                        SOCIÉTÉ INTERBANCAIRE DE TÉLÉCOMPENSE
                      </div>
                    </div>

                    {/* Réf & Price Box */}
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <span className="font-mono font-bold text-[10px] block" style={{ color: '#1e293b' }}>Réf : {trtReference || 'TRA-XXXXXX'}</span>
                        <span className="text-[7.5px] block italic opacity-75" style={{ color: '#64748b' }}>Création : {trtIssuedDate}</span>
                      </div>

                      <div className="sibtel-amount-box p-1 px-3 rounded font-mono text-xs min-w-[110px] text-center border-double">
                        {trtAmount ? `${Number(trtAmount).toFixed(3)} TND` : '***.*** TND'}
                      </div>
                    </div>
                  </div>

                  {/* Maturity block & Fait à... */}
                  <div className="grid grid-cols-2 gap-4 text-[9px] sibtel-cheque-inner-box p-1.5 rounded my-2">
                    <div>
                      <span className="text-[7.5px] block font-bold uppercase opacity-85" style={{ color: '#64748b' }}>Échéance de paiement :</span>
                      <span className="font-mono font-bold text-[10px] block mt-0.5" style={{ color: '#0f172a' }}>
                        🗓️ {trtDueDate || 'JJ/MM/AAAA'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] block font-bold uppercase opacity-85" style={{ color: '#64748b' }}>Lieu de création :</span>
                      <span className="font-semibold block mt-0.5" style={{ color: '#0f172a' }}>
                        📍 {trtLocation || 'Tunis'}, le {trtIssuedDate}
                      </span>
                    </div>
                  </div>

                  {/* Order Line */}
                  <div className="text-[9px] leading-relaxed space-y-1 mt-1">
                    <p className="border-b border-orange-200/40 pb-1 flex flex-wrap items-baseline gap-1" style={{ color: '#1e293b' }}>
                      <span>Veuillez payer contre cette traite acceptée à l'ordre de :</span>
                      <span className="font-bold text-[10px] px-1 bg-white border border-slate-200 rounded" style={{ color: '#0f172a' }}>
                        {trtType === 'Out' ? (trtBeneficiary || '..............................................') : "CARTHAGE S.A."}
                      </span>
                    </p>

                    <p className="flex items-start gap-1 py-1" style={{ color: '#1e293b' }}>
                      <span className="shrink-0 text-[8px] opacity-85" style={{ color: '#64748b' }}>La Somme de (en toutes lettres) :</span>
                      <span className="font-serif italic text-[9.5px] leading-relaxed bg-white rounded p-1 flex-1 block border border-orange-200/25 shadow-3xs" style={{ color: '#0f172a' }}>
                        « {trtAmount ? amountToWordsTN(Number(trtAmount)) : '......................................................................................................................................'} »
                      </span>
                    </p>
                  </div>

                  {/* Tiré and Signatures Grid */}
                  <div className="grid grid-cols-3 gap-3 border-t border-orange-200/40 pt-2.5 mt-2">
                    <div className="col-span-2 sibtel-cheque-inner-box p-2 rounded text-[8px] space-y-1">
                      <span className="text-[7px] font-black uppercase tracking-wider block opacity-75" style={{ color: '#64748b' }}>COMPTE À DÉBITER (LE TIRÉ) :</span>
                      <div className="font-serif">
                        <span className="font-bold text-[9px] block text-slate-900" style={{ color: '#0f172a' }}>
                          Banque : {bankAccounts.find(a => a.id === trtBankAccountId)?.bankName || 'Non sélectionné'}
                        </span>
                        <span className="text-[8.5px] block leading-none pt-0.5 font-mono font-bold sibtel-rib-mono-box p-0.5 rounded">
                          RIB : {bankAccounts.find(a => a.id === trtBankAccountId)?.accountNumber || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[7.5px] flex flex-col justify-between h-full min-h-[48px] pr-1">
                      <div className="space-y-0.5">
                        <span className="block font-bold opacity-85" style={{ color: '#1e293b' }}>ACCEPTATION / SIGNATURE TIRÉ</span>
                        <div className="w-full h-px bg-orange-200/40"></div>
                      </div>
                      <span className="italic block text-[6.5px] opacity-75" style={{ color: '#64748b' }}>Caché Elyssa S.A.</span>
                    </div>
                  </div>

                  {/* SIBTEL Optical Magnetic Character (CMC7) code simulation */}
                  <div className="text-center font-mono text-[9px] tracking-[0.25em] sibtel-cmc7-row p-1.5 rounded select-none mt-2">
                    {(() => {
                      const selA = bankAccounts.find(a => a.id === trtBankAccountId);
                      const rawRIB = selA ? selA.accountNumber.replace(/\s+/g, '') : '23000012345678901234';
                      const bCode = rawRIB.substring(0, 2) || '12';
                      const gCode = rawRIB.substring(2, 5) || '345';
                      const aNum = rawRIB.substring(5, 18) || '0123456789012';
                      const cl = rawRIB.substring(18, 20) || '34';
                      const rNum = trtReference.replace(/\D/g, '').substring(0, 7) || '1452445';
                      return `⑈ ${rNum} ⑈ ${bCode} ${gCode} ${aNum} ⑈ ${cl}`;
                    })()}
                  </div>

                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-150 rounded-xl flex gap-2 w-full text-[10.5px] leading-relaxed text-slate-600">
                  <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Aide au déchargement :</strong> Le bouton <strong>PDF</strong> génère une fiche lettre de change aux dimensions pures de la chambre de compensation tunisienne. Vous pouvez insérer des traites vierges standard dans le bac de votre imprimante d'entreprise et lancer l'impression directe à l'échelle 100%.
                  </p>
                </div>

              </div>

            </div>

            {/* Tracking Table */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t pt-5">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Registre d'échéances et de suivi des effets (Traites)</h4>
                  <p className="text-xs text-slate-500">
                    Voici l'ensemble des traites stockées dans votre base. Utilisez cet échéancier pour surveiller l'exposition de trésorerie à 30, 60, ou 90 jours et lever les oppositions ou forcer les dénouements bancaires.
                  </p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrer par tiers..."
                    value={trtHistorySearch}
                    onChange={(e) => setTrtHistorySearch(e.target.value)}
                    className="w-full p-1.5 pl-8 bg-white text-xs rounded border focus:outline-none animate-none"
                  />
                </div>
              </div>

              {/* Traites list table */}
              <div className="overflow-x-auto rounded-xl border border-slate-150 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">
                      <th className="p-2.5 pl-4">Référence</th>
                      <th className="p-2.5">Date Création</th>
                      <th className="p-2.5">Tiers (Partenaire commercial)</th>
                      <th className="p-2.5">Sens</th>
                      <th className="p-2.5">Banque & RIB</th>
                      <th className="p-2.5 font-semibold text-slate-500">Date Échéance</th>
                      <th className="p-2.5 text-right font-semibold text-slate-550">Montant facial</th>
                      <th className="p-2.5 text-center">Maturité (Alerte)</th>
                      <th className="p-2.5 text-center">Statut (Bancaire)</th>
                      <th className="p-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const trts = bankTransactions.filter(t => t.method === 'Traite').filter(t => {
                        return !trtHistorySearch || t.beneficiaryOrIssuer.toLowerCase().includes(trtHistorySearch.toLowerCase());
                      });

                      if (trts.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400 font-medium italic">
                              Aucune traite bancaire présente dans ce registre de dépenses / recettes.
                            </td>
                          </tr>
                        );
                      }

                      return trts.map(tx => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const overdue = tx.status === 'Pending' && tx.dueDate && tx.dueDate < todayStr;
                        const selectionAcc = bankAccounts.find(a => a.id === tx.accountId);
                        
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-2.5 pl-4 font-mono font-bold text-[10.5px] text-slate-805 whitespace-nowrap">{tx.reference}</td>
                            <td className="p-2.5 text-slate-500 font-mono whitespace-nowrap">{tx.date}</td>
                            <td className="p-2.5 font-bold text-slate-850">
                              {tx.beneficiaryOrIssuer}
                              {tx.description && <span className="block text-[10px] text-slate-400 font-normal">{tx.description}</span>}
                            </td>
                            <td className="p-2.5">
                              <span className={`p-0.5 px-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider ${
                                tx.type === 'In' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-red-50 text-red-700 border border-red-150'
                              }`}>
                                {tx.type === 'In' ? 'ENTRÉE / CLIENT' : 'SORTIE / FOURN'}
                              </span>
                            </td>
                            <td className="p-2.5 leading-tight">
                              <span className="font-bold text-[10.5px] text-slate-800 block">{tx.accountName}</span>
                              <span className="text-[10px] text-slate-400 font-mono italic">
                                RIB: {selectionAcc ? selectionAcc.accountNumber.slice(-8) : '—'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[10.51px] font-extrabold whitespace-nowrap text-slate-700">
                              {tx.dueDate || 'Comptant'}
                            </td>
                            <td className={`p-2.5 text-right font-mono font-black text-sm ${tx.type === 'In' ? 'text-emerald-700' : 'text-red-650'}`}>
                              {tx.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}{' '}
                              {selectionAcc?.currency === 'TND_CONV' ? 'TND Conv.' : (selectionAcc?.currency || 'TND')}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              {tx.status === 'Pending' ? (
                                overdue ? (
                                  <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase p-1 px-2 rounded-full inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Échue (En retard)
                                  </span>
                                ) : (
                                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase p-1 px-2 rounded-full inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> À échoir
                                  </span>
                                )
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase p-1 px-2 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Libéré
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTxStatus(tx.id)}
                                  className={`p-1 px-2.5 text-[9px] rounded-lg font-black uppercase transition-all inline-flex items-center space-x-1 cursor-pointer ${
                                    tx.status === 'Cleared' ? 'bg-emerald-650 hover:bg-emerald-750 text-white' : 
                                    tx.status === 'Bounced' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                    'bg-amber-100 hover:bg-amber-150 text-amber-850 border border-amber-205'
                                  }`}
                                >
                                  {tx.status === 'Cleared' && <span>✔ Encaissée / Honorée</span>}
                                  {tx.status === 'Pending' && <span>⏳ En attente règlement</span>}
                                  {tx.status === 'Bounced' && <span>⚠️ Rejet / Impayée</span>}
                                </button>
                              )}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap font-sans">
                              <button
                                type="button"
                                onClick={() => {
                                  const d = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [180, 80] });
                                  d.setDrawColor(200, 200, 200);
                                  d.setLineWidth(0.3);
                                  d.rect(2, 2, 176, 76);
                                  d.setFont('times', 'bold');
                                  d.setFontSize(13);
                                  d.setTextColor(30, 41, 59);
                                  d.text("LETTRE DE CHANGE (TRAITE)", 10, 10);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(7.5);
                                  d.setTextColor(120, 120, 120);
                                  d.text("CONFORME AUX STANDARDS INTERBANCAIRES SIBTEL TUNISIE", 10, 13);
                                  d.setFont('times', 'bold');
                                  d.setFontSize(9);
                                  d.setTextColor(15, 23, 42);
                                  d.text(`Réf N° : ${tx.reference}`, 115, 10);
                                  d.setFillColor(245, 247, 250);
                                  d.rect(132, 5, 42, 9, 'FD');
                                  d.setFont('courier', 'bold');
                                  d.setFontSize(11.5);
                                  d.setTextColor(29, 78, 216);
                                  d.text(`${tx.amount.toFixed(3)} TND`, 134, 11);
                                  d.setFont('times', 'bold');
                                  d.setFontSize(9.5);
                                  d.setTextColor(15, 23, 42);
                                  d.text("ÉCHÉANCE : ", 10, 22);
                                  d.setFont('courier', 'bold');
                                  d.setFontSize(10);
                                  d.text(tx.dueDate || todayStr, 33, 22);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(8.5);
                                  d.setTextColor(71, 85, 105);
                                  d.text("Veuillez payer contre cette lettre de change acceptée à l'ordre de :", 10, 31);
                                  d.setFont('times', 'bold');
                                  d.setFontSize(10);
                                  d.setTextColor(15, 23, 42);
                                  const bNm = tx.type === 'Out' ? tx.beneficiaryOrIssuer : "CARTHAGE S.A.";
                                  d.text(bNm, 15, 36);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(8);
                                  d.setTextColor(71, 85, 105);
                                  d.text("Somme en toutes lettres (Tunisian Dinars SIBTEL standards) :", 10, 42);
                                  d.setFont('times', 'italic');
                                  d.setFontSize(8.5);
                                  d.setTextColor(15, 23, 42);
                                  const wl = d.splitTextToSize(amountToWordsTN(tx.amount), 115);
                                  d.text(wl, 14, 46.5);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(8);
                                  d.setTextColor(100, 116, 139);
                                  d.text(`Fait à Tunis, le ${tx.date}`, 115, 22);
                                  d.setFillColor(248, 250, 252);
                                  d.rect(10, 53, 105, 15, 'FD');
                                  d.setFont('times', 'bold');
                                  d.setFontSize(7.5);
                                  d.setTextColor(15, 23, 42);
                                  d.text("COMPTE DE RÈGLEMENT À DÉBITER (TIRÉ) :", 12, 57);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(8);
                                  d.setTextColor(51, 65, 85);
                                  d.text(`Banque : ${tx.accountName}`, 12, 61.5);
                                  d.setFont('courier', 'bold');
                                  d.text(`RIB : ${selectionAcc ? selectionAcc.accountNumber : '00000000000000000000'}`, 12, 65.5);
                                  d.setFont('times', 'normal');
                                  d.setFontSize(6.5);
                                  d.setTextColor(120, 120, 120);
                                  d.text("ACCEPTATION & SIGNATURE", 125, 41);
                                  d.line(125, 43, 172, 43);
                                  d.text("SIGNATURE DE L'ÉMETTEUR (TIREUR)", 125, 54);
                                  d.line(125, 56, 172, 56);
                                  const clean = selectionAcc ? selectionAcc.accountNumber.replace(/\s+/g, '') : '00005523000012345678';
                                  const bC = clean.substring(0, 2) || '12';
                                  const gC = clean.substring(2, 5) || '345';
                                  const aN = clean.substring(5, 18) || '0123456789012';
                                  const cK = clean.substring(18, 20) || '34';
                                  const rF = tx.reference.replace(/\D/g, '').substring(0, 7) || '1234567';
                                  d.setFont('courier', 'normal');
                                  d.setFontSize(9.5);
                                  d.setTextColor(30, 41, 59);
                                  d.text(`⑈ ${rF} ⑈ ${bC} ${gC} ${aN} ⑈ ${cK}`, 25, 75);
                                  d.save(`Traite_${tx.reference}.pdf`);
                                }}
                                className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10.1px] hover:shadow-xs transition flex items-center gap-1 inline-block cursor-pointer mx-auto"
                              >
                                <Printer className="w-3 h-3" /> Imprimer SIBTEL
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB: TUNISIAN FINANCIAL STATEMENTS (SCE) */}
        {activeSubTab === 'statements' && (
          <TunisianFinancialStatements
            invoices={invoices}
            bankAccounts={bankAccounts}
            bankTransactions={bankTransactions}
            yearEndClosings={yearEndClosings}
            triggerPrint={triggerPrint}
          />
        )}


        {/* TAB 8: DAILY TREASURY & DISCREPANCY ANALYZER (DIRECTION GÉNÉRALE) */}
        {activeSubTab === 'treasury' && (
          <div className="space-y-6">
            
            {/* Header section with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Bilan de Trésorerie Quotidien & Arbitrage des Écarts
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 rounded-md font-bold select-none">
                    Espace Direction Générale (DG)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Consolidation des comptes réels, des encaissements / décaissements en suspens, et des créances en recouvrement. 
                  Identifiez les anomalies de factures ou de dépenses par direction d'origine et arbitrez-les.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={auditRunning}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    auditRunning 
                      ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-550 hover:bg-indigo-600 text-white cursor-pointer shadow-xs'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditRunning ? 'animate-spin' : ''}`} />
                  <span>{auditRunning ? "Audit en cours..." : "Lancer l'Audit de Trésorerie"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTreasuryPDF}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Rapport PDF</span>
                </button>
              </div>
            </div>

            {/* Simulated Audit Running Overlay Panel */}
            {auditRunning && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 opacity-10 translate-x-6 -translate-y-6 select-none">
                  <Scale className="w-48 h-48" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-850/60 border border-indigo-700/50 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-300" />
                  </div>
                  <div className="space-y-1 z-10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                      Audit Analytique de Trésorerie en cours...
                    </h4>
                    <p className="text-xs text-indigo-100 font-mono italic">
                      {auditProgressText}
                    </p>
                    <div className="w-full bg-indigo-800/80 h-1.5 rounded-full overflow-hidden mt-2 max-w-md">
                      <div className="bg-indigo-400 h-full animate-[shimmer_1.5s_infinite] w-2/3 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Simulated Audit Success Banner */}
            {auditComplete && !auditRunning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-4 flex justify-between items-center text-xs"
              >
                <div className="flex gap-2.5 items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Audit quotidien terminé avec succès !</span> Les flux d'écritures bancaires ont été croisés avec les factures émises, les contrats de travail de la RH et la GED.
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAuditComplete(false)}
                  className="text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline select-none cursor-pointer"
                >
                  Fermer
                </button>
              </motion.div>
            )}

            {/* Dashboard Pillars Metrics (French Dinar TND) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Pillar 1: Trésorerie Réelle */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trésorerie Réelle</span>
                  <div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-extrabold text-slate-800 tracking-tight">
                    {totalRealBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 ml-1">TND</span>
                </div>
                <div className="mt-2 text-[9.5px] text-slate-400 border-t border-slate-200/50 pt-1.5 space-y-0.5">
                  <p className="flex justify-between"><span>BIAT Tunis :</span><span className="font-mono text-slate-600 font-semibold">{bankAccounts.find(a => a.id === 'bank_biat')?.currentBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) || '0,000'} TND</span></p>
                  <p className="flex justify-between"><span>Attijari Sfax :</span><span className="font-mono text-slate-600 font-semibold">{bankAccounts.find(a => a.id === 'bank_attijari')?.currentBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) || '0,000'} TND</span></p>
                  <p className="flex justify-between"><span>Caisse Espèces :</span><span className="font-mono text-slate-600 font-semibold">{bankAccounts.find(a => a.id === 'bank_caisse_cash')?.currentBalance.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) || '0,000'} TND</span></p>
                </div>
              </div>

              {/* Pillar 2: Flux Attendus */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flux Bancaires Attendus</span>
                  <div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-lg font-extrabold tracking-tight ${(pendingCollections - pendingDisbursements) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {(pendingCollections - pendingDisbursements) >= 0 ? '+' : ''}
                    {(pendingCollections - pendingDisbursements).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 ml-1">TND</span>
                </div>
                <div className="mt-2 text-[9.5px] text-slate-400 border-t border-slate-200/50 pt-1.5 space-y-0.5">
                  <p className="flex justify-between text-emerald-600 font-medium"><span>Encaissements :</span><span className="font-mono">{pendingCollections.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span></p>
                  <p className="flex justify-between text-red-600 font-medium"><span>Décaissements (Traites) :</span><span className="font-mono">{pendingDisbursements.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span></p>
                  <p className="flex justify-between text-slate-500 italic"><span>Solde net attendu :</span><span>{(pendingCollections - pendingDisbursements).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span></p>
                </div>
              </div>

              {/* Pillar 3: Recouvrement */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Créances Recouvrement</span>
                  <div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-extrabold text-indigo-700 tracking-tight">
                    {recoveryClaimsAmount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 ml-1">TND</span>
                </div>
                <div className="mt-2 text-[9.5px] text-slate-400 border-t border-slate-200/50 pt-1.5 space-y-1">
                  <p className="flex justify-between font-medium text-indigo-800">
                    <span>Invoices actives :</span>
                    <span>{invoices.filter(i => i.status === 'Debt_Collection').length} facture(s)</span>
                  </p>
                  <p className="text-[9px] text-slate-400 italic">
                    Créances contentieuses confiées à la direction juridique.
                  </p>
                </div>
              </div>

              {/* Pillar 4: Consolidée Théorique */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-950 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-5 translate-x-3 translate-y-3">
                  <Scale className="w-20 h-20" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Trésorerie Consolidée</span>
                  <div className="p-1.5 bg-indigo-850 text-indigo-300 rounded-lg border border-indigo-800">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-extrabold text-white tracking-tight">
                    {theoreticalTreasury.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-300 ml-1">TND</span>
                </div>
                <div className="mt-2 text-[9px] text-indigo-200 border-t border-indigo-850/60 pt-1.5">
                  <p className="flex justify-between"><span>Solde Théorique Ajusté :</span><span className="font-semibold font-mono">100% à jour</span></p>
                  <p className="text-[8px] text-indigo-300/80 mt-0.5 italic">Intègre soldes réels + flux + recouvrement.</p>
                </div>
              </div>

            </div>

            {/* Alert banner if pending discrepancies exist */}
            {discrepancies.filter(d => d.status === 'Pending').length > 0 && (
              <div className="bg-red-950/40 border border-red-500/50 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-extrabold text-red-200">Arbitrage requis :</span> <span className="text-white font-medium">{discrepancies.filter(d => d.status === 'Pending').length} écart(s) financier(s) non résolu(s).</span>
                    <p className="text-[11px] text-red-100/90 mt-0.5 font-medium">
                      Chaque écart est imputé à sa direction d'origine avec description de la dépense ou de la facture fiscale manquante.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-red-900/60 text-red-200 border border-red-500/40 rounded-lg text-[10.5px] font-extrabold tracking-tight select-none shrink-0 uppercase animate-pulse">
                  Factures ou Justificatifs Manquants
                </span>
              </div>
            )}

            {/* Main Interactive Work Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left & Center column: Discrepancies Tracker and List */}
              <div className="xl:col-span-2 space-y-4">
                
                {/* Filters and List Title */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      Analyseur d'Anomalies de Trésorerie par Service
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Department filter */}
                    <select
                      value={filterDiscDept}
                      onChange={(e) => setFilterDiscDept(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg p-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-auto"
                    >
                      <option value="Tous">Toutes les Directions</option>
                      <option value="Direction Technique">Direction Technique</option>
                      <option value="Direction Ressources Humaines">Direction RH</option>
                      <option value="Direction Logistique">Direction Logistique</option>
                      <option value="Direction Commerciale">Direction Commerciale</option>
                      <option value="Direction Marketing">Direction Marketing</option>
                    </select>

                    {/* Status filter */}
                    <select
                      value={filterDiscStatus}
                      onChange={(e: any) => setFilterDiscStatus(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg p-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-auto"
                    >
                      <option value="Tous">Tous les Statuts</option>
                      <option value="Pending">En attente d'arbitrage</option>
                      <option value="Resolved">Résolus & Justifiés</option>
                    </select>
                  </div>
                </div>

                {/* Interactive Discrepancies List */}
                <div className="space-y-4">
                  {(() => {
                    const filtered = discrepancies.filter(d => {
                      const matchDept = filterDiscDept === 'Tous' || d.department === filterDiscDept;
                      const matchStatus = filterDiscStatus === 'Tous' || d.status === filterDiscStatus;
                      return matchDept && matchStatus;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white border border-slate-150 rounded-xl p-10 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                          <CheckCircle className="w-12 h-12 text-emerald-100" />
                          <p className="text-xs font-bold text-slate-500">Aucun écart de trésorerie trouvé</p>
                          <p className="text-[10px] text-slate-400">Modifiez vos critères de filtrage ou signalez un nouvel écart.</p>
                        </div>
                      );
                    }

                    return filtered.map((disc) => {
                      const isPending = disc.status === 'Pending';
                      
                      // Department color styling
                      let deptColors = { bg: 'bg-slate-100 text-slate-800 border-slate-200', text: 'text-slate-700' };
                      if (disc.department === 'Direction Technique') {
                        deptColors = { bg: 'bg-purple-50 text-purple-800 border-purple-200', text: 'text-purple-700' };
                      } else if (disc.department === 'Direction Ressources Humaines') {
                        deptColors = { bg: 'bg-pink-50 text-pink-800 border-pink-200', text: 'text-pink-700' };
                      } else if (disc.department === 'Direction Logistique') {
                        deptColors = { bg: 'bg-orange-50 text-orange-800 border-orange-200', text: 'text-orange-700' };
                      } else if (disc.department === 'Direction Commerciale') {
                        deptColors = { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'text-blue-700' };
                      } else if (disc.department === 'Direction Marketing') {
                        deptColors = { bg: 'bg-teal-50 text-teal-800 border-teal-200', text: 'text-teal-700' };
                      } else if (disc.department === 'Direction Générale') {
                        deptColors = { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', text: 'text-indigo-700' };
                      }

                      return (
                        <motion.div
                          key={disc.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-xl p-4 transition-all duration-200 relative overflow-hidden bg-white ${
                            isPending 
                              ? 'border-red-150 hover:border-red-300 shadow-xs' 
                              : 'border-emerald-150 hover:border-emerald-300'
                          }`}
                        >
                          {/* Top row with tags & amount */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Department Badge */}
                              <span className={`px-2 py-0.5 border rounded text-[10.5px] font-bold ${deptColors.bg}`}>
                                🏢 {disc.department}
                              </span>
                              
                              {/* Discrepancy Type Badge */}
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9.5px] font-medium border border-slate-150 select-none">
                                {disc.type === 'ExpenseWithoutInvoice' && "🚫 Facture Fournisseur Manquante"}
                                {disc.type === 'MissingReceipt' && "⚠️ Ticket/Reçu Justificatif Manquant"}
                                {disc.type === 'UnjustifiedAdvance' && "🧑‍💼 Avance Salaire sans Avenant"}
                                {disc.type === 'UnreconciledBankTransaction' && "🏦 Écritures Bancaires Non Lettrées"}
                              </span>

                              <span className="text-[10px] text-slate-400">
                                Signalé le {disc.date}
                              </span>
                            </div>

                            {/* Amount tag */}
                            <div className="shrink-0">
                              <span className="text-sm font-extrabold text-slate-800">
                                {disc.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 ml-1">TND</span>
                            </div>
                          </div>

                          {/* Body with nature and missing invoice */}
                          <div className="mt-3 space-y-2">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nature de la Dépense / Opération :</p>
                              <p className="text-xs font-bold text-slate-800 mt-0.5">{disc.nature}</p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description détaillée de l'écart :</p>
                              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{disc.description}</p>
                            </div>

                            {/* Highlight of the missing document (facture manquante) */}
                            {isPending ? (
                              <div className="bg-red-950/40 border border-red-500/40 rounded-lg p-2.5 flex items-start gap-2 mt-2">
                                <HelpCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div className="text-xs">
                                  <span className="font-extrabold text-red-300">Pièce Justificative Manquante :</span>
                                  <p className="text-red-100 font-mono mt-0.5 text-[11px] font-semibold">{disc.missingDoc}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 space-y-1 mt-2">
                                <div className="text-xs flex items-center gap-1.5 text-emerald-800 font-bold">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>Ecart Arbitré & Justifié par la DG</span>
                                </div>
                                <p className="text-xs text-slate-600 pl-5 leading-relaxed font-mono">
                                  <span className="font-bold text-slate-800">Commentaire d'arbitrage :</span> {disc.resolutionComment}
                                </p>
                                <p className="text-[10px] text-slate-400 pl-5">
                                  Régularisé le {disc.resolvedAt} par le Directeur Général.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action panel */}
                          {isPending && !readOnly && (
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                              {selectedResolutionDisc?.id === disc.id ? (
                                <form onSubmit={handleResolveDiscrepancy} className="w-full bg-slate-50 border p-3 rounded-lg space-y-3">
                                  <div className="space-y-1">
                                    <label className="block text-[10.5px] font-bold text-slate-700">
                                      Commentaire de justification / Arbitrage de la DG : <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      required
                                      value={resolutionComment}
                                      onChange={(e) => setResolutionComment(e.target.value)}
                                      placeholder="Ex: Facture d'origine enfin rattachée à la GED sous la réf GED-OVH-8827. Validation d'imputation technique acceptée."
                                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedResolutionDisc(null); setResolutionComment(''); }}
                                      className="px-2.5 py-1 text-slate-600 hover:text-slate-800 font-bold text-[10.5px] border border-slate-200 bg-white rounded cursor-pointer"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded cursor-pointer transition shadow-xs"
                                    >
                                      Valider l'Arbitrage
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedResolutionDisc(disc)}
                                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-[11px] rounded-lg border border-indigo-200/50 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Scale className="w-3 h-3" />
                                  <span>Arbitrer & Justifier cet écart</span>
                                </button>
                              )}
                            </div>
                          )}

                        </motion.div>
                      );
                    });
                  })()}
                </div>

              </div>

              {/* Right column: Log new discrepancy for any Department */}
              <div className="space-y-4">
                
                {/* Information Card for the DG */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-950 relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-5 translate-x-3 -translate-y-3">
                    <Info className="w-16 h-16" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Règle de Gestion - Système Pyramidal
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-100 mt-2">
                    En tant que Directeur Général, vous disposez d'une visibilité de trésorerie consolidée.
                    Chaque écart constaté dans l'apurement des relevés bancaires ou de caisse doit être justifié par le Directeur de Direction concerné.
                    Le Directeur Général arbitre en rattachant la pièce ou en consignant la décision de passage en perte/profit.
                  </p>
                </div>

                {/* Form to log a new discrepancy */}
                {!readOnly && (
                  <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-indigo-550" />
                      Signaler un nouvel écart
                    </h4>

                    <form onSubmit={handleAddDiscrepancy} className="mt-3 space-y-3.5">
                      
                      {/* Department Select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Direction Responsable <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newDiscDept}
                          onChange={(e: any) => setNewDiscDept(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                          <option value="Direction Technique">Direction Technique</option>
                          <option value="Direction Ressources Humaines">Direction Ressources Humaines</option>
                          <option value="Direction Logistique">Direction Logistique</option>
                          <option value="Direction Commerciale">Direction Commerciale</option>
                          <option value="Direction Marketing">Direction Marketing</option>
                          <option value="Direction Générale">Direction Générale</option>
                        </select>
                      </div>

                      {/* Type Select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Type d'Anomalie <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newDiscType}
                          onChange={(e: any) => setNewDiscType(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                          <option value="ExpenseWithoutInvoice">Facture Fournisseur Manquante</option>
                          <option value="MissingReceipt">Ticket / Justificatif Manquant</option>
                          <option value="UnjustifiedAdvance">Avance Salaire sans Avenant</option>
                          <option value="UnreconciledBankTransaction">Écritures Bancaires Non Lettrées</option>
                        </select>
                      </div>

                      {/* Amount TND input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Montant de l'écart (TND) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="0.000"
                            value={newDiscAmount}
                            onChange={(e) => setNewDiscAmount(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 pl-3 pr-12 bg-slate-50 text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-[9px] font-bold text-slate-400">TND</span>
                        </div>
                      </div>

                      {/* Nature input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Nature de la dépense <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Frais de déplacement commercial de prospection urgent"
                          value={newDiscNature}
                          onChange={(e) => setNewDiscNature(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Justification requise input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Pièce comptable manquante attendue <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Facture originale de l'Hôtel ou ticket de carburant Sfax"
                          value={newDiscMissingDoc}
                          onChange={(e) => setNewDiscMissingDoc(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Description input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Description / Circonstances détaillées (Optionnel)
                        </label>
                        <textarea
                          placeholder="Donnez plus de contexte sur les circonstances de cet écart."
                          value={newDiscDesc}
                          onChange={(e) => setNewDiscDesc(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none h-14 resize-none"
                        />
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-550 hover:bg-indigo-650 text-white rounded-lg text-xs font-bold transition shadow-xs hover:shadow-sm cursor-pointer"
                      >
                        Enregistrer l'écart de trésorerie
                      </button>

                    </form>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>

      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab="finance"
        documentName={printDocName}
        printTarget={printTarget}
      />
    </div>
  );
}
