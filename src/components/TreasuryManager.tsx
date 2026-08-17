import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  RefreshCw, 
  Percent,
  ChevronRight,
  Eye,
  Info,
  Building,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';

interface ChequeEffet {
  id: string;
  type: 'Chèque reçu' | 'Chèque émis' | 'Traite reçue' | 'Traite émise'; // Traite = Promissory note / Effect
  referenceNumber: string; // Numéro du chèque ou de l'effet
  bankName: string;
  dueDate: string; // Date d'échéance (post-dated check / due date of promissory note)
  drawerName: string; // Tireur / Bénéficiaire (client or supplier)
  amount: number; // TND
  status: 'En coffre' | 'Remis à l\'encaissement' | 'Payé / Honoré' | 'Impayé / Rejeté';
  notes?: string;
}

interface BankCommissionAudit {
  id: string;
  bankName: string;
  transactionType: string;
  declaredAmount: number; // what bank charged
  tvaRateApplied: number; // usually 19% on services in Tunisia
  tmmRateUsed: number; // e.g. 7.96% (TMM tunisien active)
  bankMarginRate: number; // e.g. 2.5%
  isCompliant: boolean;
  auditNotes: string;
  auditDate: string;
}

export default function TreasuryManager({ currentUser }: { currentUser: any }) {
  const TREASURY_KEY = 'carthage_treasury_cheques_effects';
  const AUDIT_KEY = 'carthage_treasury_bank_audits';

  // --- Prepopulated Treasury Items ---
  const DEFAULT_ITEMS: ChequeEffet[] = [
    {
      id: 'TR-CHE-2026-001',
      type: 'Chèque reçu',
      referenceNumber: 'CH-985421',
      bankName: 'BIAT',
      dueDate: '2026-06-25',
      drawerName: 'Ste Électricité du Nord',
      amount: 14500.000,
      status: 'Payé / Honoré',
      notes: 'Règlement de la facture FC-2026-112.'
    },
    {
      id: 'TR-CHE-2026-002',
      type: 'Chèque reçu',
      referenceNumber: 'CH-112450',
      bankName: 'Attijari Bank',
      dueDate: '2026-07-15',
      drawerName: 'Établissements Ben Jemaa',
      amount: 8200.000,
      status: 'En coffre',
      notes: 'Chèque de caution ou règlement anticipé.'
    },
    {
      id: 'TR-EFF-2026-001',
      type: 'Traite reçue',
      referenceNumber: 'TR-004521',
      bankName: 'BH Bank',
      dueDate: '2026-08-10',
      drawerName: 'Société Tunisienne de Câblage',
      amount: 25000.000,
      status: 'En coffre',
      notes: 'Effet accepté à 60 jours d\'échéance.'
    },
    {
      id: 'TR-CHE-2026-003',
      type: 'Chèque émis',
      referenceNumber: 'CH-552410',
      bankName: 'UIB',
      dueDate: '2026-06-20',
      drawerName: 'SOTUMETAL S.A.',
      amount: 12000.000,
      status: 'Payé / Honoré',
      notes: 'Paiement acompte pour approvisionnement de cuivre.'
    }
  ];

  const DEFAULT_AUDITS: BankCommissionAudit[] = [
    {
      id: 'AUD-2026-001',
      bankName: 'BIAT',
      transactionType: 'Intérêt de découvert (Agio)',
      declaredAmount: 420.500,
      tvaRateApplied: 19,
      tmmRateUsed: 8.0, // Tunisian Average Market Rate (TMM) around 8%
      bankMarginRate: 3.0, // total interest = 11%
      isCompliant: true,
      auditNotes: 'Agios calculés conformément aux limites contractuelles (TMM + Marge 3%).',
      auditDate: '2026-06-15'
    },
    {
      id: 'AUD-2026-002',
      bankName: 'Amen Bank',
      transactionType: 'Commission sur effet',
      declaredAmount: 85.000,
      tvaRateApplied: 19,
      tmmRateUsed: 8.0,
      bankMarginRate: 4.5, // Exceeded standard limit
      isCompliant: false,
      auditNotes: 'Surfacturation constatée de 15 TND sur la commission de remise de traite.',
      auditDate: '2026-06-18'
    }
  ];

  // --- States ---
  const [items, setItems] = useState<ChequeEffet[]>([]);
  const [audits, setAudits] = useState<BankCommissionAudit[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'portfolio' | 'forecast' | 'bank_audit' | 'settings'>('portfolio');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- Local Storage Keys for Treasury Settings ---
  const SETTINGS_BANKS_KEY = 'carthage_treasury_settings_banks_v2';
  const SETTINGS_FEE_TYPES_KEY = 'carthage_treasury_settings_fee_types_v2';
  const SETTINGS_TMM_KEY = 'carthage_treasury_settings_tmm_v3';
  const SETTINGS_MAX_MARGIN_KEY = 'carthage_treasury_settings_max_margin_v3';

  const DEFAULT_BANKS = ["BIAT", "Attijari Bank", "Amen Bank", "BH Bank", "UIB", "Banque de Tunisie", "Autre"];
  const DEFAULT_FEE_TYPES = [
    "Frais de tenue de compte",
    "Commission sur virement",
    "Intérêt de découvert (Agio)",
    "Commission sur effet"
  ];

  const [banksList, setBanksList] = useState<string[]>([]);
  const [feeTypesList, setFeeTypesList] = useState<string[]>([]);
  const [tmmRate, setTmmRate] = useState<number>(8.0);
  const [maxMarginRate, setMaxMarginRate] = useState<number>(3.5);

  // Search & Filter Portfolio
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  // Form State - Cheque/Effet
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<ChequeEffet['type']>('Chèque reçu');
  const [formRef, setFormRef] = useState('');
  const [formBank, setFormBank] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDrawer, setFormDrawer] = useState('');
  const [formAmount, setFormAmount] = useState(5000);
  const [formNotes, setFormNotes] = useState('');

  // Selected item details
  const [selectedItem, setSelectedItem] = useState<ChequeEffet | null>(null);

  // Form State - Audit
  const [isAuditFormOpen, setIsAuditFormOpen] = useState(false);
  const [auditBank, setAuditBank] = useState('');
  const [auditType, setAuditType] = useState<string>('');
  const [auditAmount, setAuditAmount] = useState(50);
  const [auditMargin, setAuditMargin] = useState(2.5);
  const [auditNotes, setAuditNotes] = useState('');

  // --- Load / Save ---
  useEffect(() => {
    let parsedItems: ChequeEffet[] = [];
    try {
      const savedItems = localStorage.getItem(TREASURY_KEY);
      if (savedItems) {
        parsedItems = JSON.parse(savedItems);
      }
    } catch (e) {
      console.error("Failed to read TREASURY_KEY from localStorage", e);
    }
    setItems(parsedItems);

    let parsedAudits: BankCommissionAudit[] = [];
    try {
      const savedAudits = localStorage.getItem(AUDIT_KEY);
      if (savedAudits) {
        parsedAudits = JSON.parse(savedAudits);
      }
    } catch (e) {
      console.error("Failed to read AUDIT_KEY from localStorage", e);
    }
    setAudits(parsedAudits);

    // Load Settings
    let parsedBanks = DEFAULT_BANKS;
    try {
      const savedBanks = localStorage.getItem(SETTINGS_BANKS_KEY);
      if (savedBanks) {
        const parsed = JSON.parse(savedBanks);
        if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
          parsedBanks = parsed;
        }
      } else {
        localStorage.setItem(SETTINGS_BANKS_KEY, JSON.stringify(DEFAULT_BANKS));
      }
    } catch (e) {
      console.error("Failed to read/write SETTINGS_BANKS_KEY from localStorage", e);
    }
    setBanksList(parsedBanks);
    setFormBank(parsedBanks[0] || 'BIAT');
    setAuditBank(parsedBanks[0] || 'BIAT');

    let parsedFees = DEFAULT_FEE_TYPES;
    try {
      const savedFees = localStorage.getItem(SETTINGS_FEE_TYPES_KEY);
      if (savedFees) {
        const parsed = JSON.parse(savedFees);
        if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
          parsedFees = parsed;
        }
      } else {
        localStorage.setItem(SETTINGS_FEE_TYPES_KEY, JSON.stringify(DEFAULT_FEE_TYPES));
      }
    } catch (e) {
      console.error("Failed to read/write SETTINGS_FEE_TYPES_KEY from localStorage", e);
    }
    setFeeTypesList(parsedFees);
    setAuditType(parsedFees[0] || 'Commission sur virement');

    let parsedTmm = 8.0;
    try {
      const savedTmm = localStorage.getItem(SETTINGS_TMM_KEY);
      if (savedTmm) {
        parsedTmm = Number(savedTmm);
      } else {
        localStorage.setItem(SETTINGS_TMM_KEY, '8.0');
      }
    } catch (e) {
      console.error("Failed to read/write SETTINGS_TMM_KEY from localStorage", e);
    }
    setTmmRate(parsedTmm);

    let parsedMaxMargin = 3.5;
    try {
      const savedMaxMargin = localStorage.getItem(SETTINGS_MAX_MARGIN_KEY);
      if (savedMaxMargin) {
        parsedMaxMargin = Number(savedMaxMargin);
      } else {
        localStorage.setItem(SETTINGS_MAX_MARGIN_KEY, '3.5');
      }
    } catch (e) {
      console.error("Failed to read/write SETTINGS_MAX_MARGIN_KEY from localStorage", e);
    }
    setMaxMarginRate(parsedMaxMargin);
  }, []);

  const saveBanks = (updated: string[]) => {
    if (!Array.isArray(updated)) return;
    setBanksList(updated);
    try {
      localStorage.setItem(SETTINGS_BANKS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveFeeTypes = (updated: string[]) => {
    if (!Array.isArray(updated)) return;
    setFeeTypesList(updated);
    try {
      localStorage.setItem(SETTINGS_FEE_TYPES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTmmRate = (rate: number) => {
    setTmmRate(rate);
    try {
      localStorage.setItem(SETTINGS_TMM_KEY, String(rate));
    } catch (e) {
      console.error(e);
    }
  };

  const saveMaxMarginRate = (rate: number) => {
    setMaxMarginRate(rate);
    try {
      localStorage.setItem(SETTINGS_MAX_MARGIN_KEY, String(rate));
    } catch (e) {
      console.error(e);
    }
  };

  const saveItemsToStorage = (updated: ChequeEffet[]) => {
    setItems(updated);
    localStorage.setItem(TREASURY_KEY, JSON.stringify(updated));
  };

  const saveAuditsToStorage = (updated: BankCommissionAudit[]) => {
    setAudits(updated);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
  };

  // --- Calculations ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.drawerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'Tous' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'Tous' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, searchQuery, typeFilter, statusFilter]);

  // Cash Flow Forecast metrics for 30, 60, 90 days
  const forecastMetrics = useMemo(() => {
    let cashIn30 = 0;
    let cashOut30 = 0;
    let cashIn60 = 0;
    let cashOut60 = 0;
    let cashIn90 = 0;
    let cashOut90 = 0;

    const today = new Date();

    items.forEach(item => {
      if (item.status === 'Payé / Honoré') return; // already settled, not in forecast

      const due = new Date(item.dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        if (item.type === 'Chèque reçu' || item.type === 'Traite reçue') {
          if (diffDays <= 30) cashIn30 += item.amount;
          else if (diffDays <= 60) cashIn60 += item.amount;
          else if (diffDays <= 90) cashIn90 += item.amount;
        } else {
          if (diffDays <= 30) cashOut30 += item.amount;
          else if (diffDays <= 60) cashOut60 += item.amount;
          else if (diffDays <= 90) cashOut90 += item.amount;
        }
      }
    });

    const activeBankBalance = 42500.000; // Mock current actual bank account liquidity in TND

    const liquid30 = activeBankBalance + cashIn30 - cashOut30;
    const liquid60 = liquid30 + cashIn60 - cashOut60;
    const liquid90 = liquid60 + cashIn90 - cashOut90;

    return {
      activeBankBalance,
      cashIn30,
      cashOut30,
      cashIn60,
      cashOut60,
      cashIn90,
      cashOut90,
      liquid30,
      liquid60,
      liquid90
    };
  }, [items]);

  // --- Handlers ---
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef || !formDrawer) return;

    const newItem: ChequeEffet = {
      id: `TR-${formType.startsWith('Chèque') ? 'CHE' : 'EFF'}-2026-${String(items.length + 1).padStart(3, '0')}`,
      type: formType,
      referenceNumber: formRef,
      bankName: formBank,
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
      drawerName: formDrawer,
      amount: Number(formAmount),
      status: 'En coffre',
      notes: formNotes
    };

    saveItemsToStorage([newItem, ...items]);
    setIsFormOpen(false);

    // Reset
    setFormRef('');
    setFormDrawer('');
    setFormAmount(5000);
    setFormNotes('');
  };

  const handleUpdateStatus = (id: string, nextStatus: ChequeEffet['status']) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveItemsToStorage(updated);
    const synced = updated.find(i => i.id === id);
    if (synced && selectedItem) {
      setSelectedItem(synced);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter(item => item.id !== id);
    saveItemsToStorage(updated);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    showToast(`Élément ${id} supprimé.`);
  };

  // --- Audit Handlers ---
  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if interest rate stays compliant under Tunisian regulations
    // (TMM + Margin must be under the excessive bank rates published by the BCT - Banque Centrale de Tunisie)
    const isCompliant = auditMargin <= maxMarginRate;

    const newAudit: BankCommissionAudit = {
      id: `AUD-2026-${String(audits.length + 1).padStart(3, '0')}`,
      bankName: auditBank,
      transactionType: auditType,
      declaredAmount: Number(auditAmount),
      tvaRateApplied: 19, // Tunisian standard TVA on banking commissions
      tmmRateUsed: tmmRate, // Dynamic TMM
      bankMarginRate: Number(auditMargin),
      isCompliant,
      auditNotes: auditNotes || (isCompliant ? 'Audit conforme.' : `Taux excessif constaté. Marge supérieure à la limite BCT de ${maxMarginRate}%.`),
      auditDate: new Date().toISOString().split('T')[0]
    };

    saveAuditsToStorage([newAudit, ...audits]);
    setIsAuditFormOpen(false);
    setAuditAmount(50);
    setAuditMargin(2.5);
    setAuditNotes('');
  };

  const handleDeleteAudit = (id: string) => {
    const updated = audits.filter(a => a.id !== id);
    saveAuditsToStorage(updated);
    showToast(`Audit ${id} supprimé.`);
  };

  const exportPortfolioToCSV = () => {
    const headers = 'ID,Type,Référence,Banque,Echéance,Tireur/Bénéficiaire,Montant (TND),Statut,Notes\n';
    const rows = items.map(i => 
      `"${i.id}","${i.type}","${i.referenceNumber}","${i.bankName}","${i.dueDate}","${i.drawerName}",${i.amount},"${i.status}","${i.notes || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `elyssa_tresorerie_portefeuille_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-800 relative" id="treasury-module">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 flex items-center space-x-2.5 px-4.5 py-3 rounded-xl shadow-lg border text-xs font-bold leading-relaxed ${
              toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-500/30 backdrop-blur-md'
                : 'bg-emerald-900/90 text-white border-emerald-500/30 backdrop-blur-md'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Briefcase className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-550/20 border border-indigo-550/40 rounded-xl">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Trésorerie & Portefeuille d'Effets</span>
              <h2 className="text-2xl font-black tracking-tight">Elyssa Treasury & Bank Audit</h2>
            </div>
          </div>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Maîtrisez votre liquidité en Tunisie. Pilotez vos chèques et traites en coffre, générez des prévisions de trésorerie glissantes à 30/60/90 jours et auditez la conformité réglementaire de vos frais bancaires (Agios, TMM + Marge BCT).
          </p>
        </div>
      </div>

      {/* Sub Tabs Selection Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'portfolio' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Portefeuille Chèques & Traites ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('forecast')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'forecast' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Prévisions de Trésorerie Glissantes</span>
          </button>
          <button
            onClick={() => setActiveSubTab('bank_audit')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'bank_audit' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Audit des Agios & Commissions ({audits.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Configuration</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {activeSubTab === 'portfolio' && (
            <>
              <button
                onClick={exportPortfolioToCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                title="Exporter le portefeuille d'effets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-650" />
                <span>Exporter CSV</span>
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Chèque/Traite</span>
              </button>
            </>
          )}

          {activeSubTab === 'bank_audit' && (
            <button
              onClick={() => setIsAuditFormOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Auditer un Frais</span>
            </button>
          )}
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: CHEQUE & DRAFTS PORTFOLIO */}
        {activeSubTab === 'portfolio' && (
          <motion.div
            key="portfolio-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Filters */}
            <div className="lg:col-span-12 flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par tireur, bénéficiaire, n° chèque ou traite..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex gap-2.5">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer text-slate-700 focus:border-indigo-500"
                >
                  <option value="Tous">Tous types d'effets</option>
                  <option value="Chèque reçu">Chèques reçus (clients)</option>
                  <option value="Chèque émis">Chèques émis (fournisseurs)</option>
                  <option value="Traite reçue">Traites reçues (clients)</option>
                  <option value="Traite émise">Traites émises (fournisseurs)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer text-slate-700 focus:border-indigo-500"
                >
                  <option value="Tous">Tous statuts</option>
                  <option value="En coffre">En coffre (non encaissé)</option>
                  <option value="Remis à l'encaissement">Remis à l'encaissement</option>
                  <option value="Payé / Honoré">Payé / Honoré</option>
                  <option value="Impayé / Rejeté">Impayé / Rejeté</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Registre du Portefeuille Commercial ({filteredItems.length} effets)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  Elyssa Portfolio Ledger
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200">
                      <th className="p-4 font-extrabold">Banque & Réf</th>
                      <th className="p-4 font-extrabold">Nature effet</th>
                      <th className="p-4 font-extrabold">Tireur / Tiers</th>
                      <th className="p-4 font-extrabold">Échéance d'effet</th>
                      <th className="p-4 font-extrabold text-right">Montant nominal</th>
                      <th className="p-4 font-extrabold text-center">Statut</th>
                      <th className="p-4 font-extrabold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${selectedItem?.id === item.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                      >
                        {/* Bank & Ref */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block font-mono">{item.referenceNumber}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{item.bankName}</span>
                          </div>
                        </td>

                        {/* Nature */}
                        <td className="p-4">
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            item.type.includes('reçu') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {item.type}
                          </span>
                        </td>

                        {/* Drawer */}
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{item.drawerName}</span>
                        </td>

                        {/* Due Date */}
                        <td className="p-4">
                          <span className="font-semibold text-slate-600">{item.dueDate}</span>
                        </td>

                        {/* Amount */}
                        <td className="p-4 text-right">
                          <span className="text-slate-950 font-black font-mono">
                            {item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            item.status === 'En coffre' ? 'bg-slate-150 text-slate-500 border border-slate-200' :
                            item.status === 'Remis à l\'encaissement' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            item.status === 'Payé / Honoré' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1">
                            {item.status === 'En coffre' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'Remis à l\'encaissement')}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black cursor-pointer transition-colors border border-indigo-150"
                              >
                                Remettre
                              </button>
                            )}
                            {item.status === 'Remis à l\'encaissement' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'Payé / Honoré')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded text-[10px] font-black cursor-pointer transition-colors border border-emerald-150"
                                >
                                  Payer
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'Impayé / Rejeté')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-650 rounded text-[10px] font-black cursor-pointer transition-colors border border-rose-150"
                                >
                                  Rejet
                                </button>
                              </div>
                            )}
                            <button
                              onClick={e => handleDeleteItem(item.id, e)}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Inspection Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Inspection Effet / Chèque
                  </h4>
                  <p className="text-[10px] text-slate-400">Suivi d'encaissement de portefeuille</p>
                </div>

                {selectedItem ? (
                  <div className="space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono text-slate-900 font-bold">
                      <span>Ref : {selectedItem.referenceNumber}</span>
                      <span className="text-[10px] text-slate-400">{selectedItem.bankName}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tiers / Drawer</span>
                      <span className="font-extrabold text-slate-800 text-sm block">{selectedItem.drawerName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Montant Nominal</span>
                        <span className="text-xs font-black text-slate-950">
                          {selectedItem.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Date d'Échéance</span>
                        <span className="text-xs font-bold text-slate-700">{selectedItem.dueDate}</span>
                      </div>
                    </div>

                    {selectedItem.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg italic text-slate-600 leading-normal">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Journal d'Audit interne</span>
                        {selectedItem.notes}
                      </div>
                    )}

                    {selectedItem.status === 'En coffre' && (
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedItem.id, 'Remis à l\'encaissement')}
                          className="w-full flex items-center justify-center space-x-1.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin-slow" />
                          <span>Remettre à l'encaissement bancaire</span>
                        </button>
                      </div>
                    )}

                    {selectedItem.status === 'Remis à l\'encaissement' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedItem.id, 'Impayé / Rejeté')}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-lg cursor-pointer transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Impayé / Rejeté</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedItem.id, 'Payé / Honoré')}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Marquer Honoré</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CreditCard className="w-8 h-8 mx-auto opacity-35" />
                    <p className="text-[11px] leading-relaxed font-semibold">Aucun chèque ou traite sélectionné.<br />Sélectionnez un effet pour en gérer le cycle de vie.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: CASH FLOW FORECASTS */}
        {activeSubTab === 'forecast' && (
          <motion.div
            key="forecast-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Core forecast bars */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Liquidity Standard */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trésorerie Actuelle (Comptes Bancaires)</span>
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {forecastMetrics.activeBankBalance.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </p>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11px]">
                  <span className="text-slate-500 font-semibold">Dispo immédiat</span>
                  <span className="font-bold text-emerald-600 font-mono">Conforme BCT</span>
                </div>
              </div>

              {/* Day 30 forecast */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-650 tracking-wider">Projection à 30 jours (Fin juillet)</span>
                <p className="text-2xl font-black text-indigo-650 font-mono">
                  {forecastMetrics.liquid30.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </p>
                <div className="flex justify-between text-[11px] font-medium font-mono text-slate-500">
                  <span className="flex items-center text-emerald-600 font-bold"><ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> +{forecastMetrics.cashIn30.toLocaleString('fr-FR')}</span>
                  <span className="flex items-center text-rose-600 font-bold"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> -{forecastMetrics.cashOut30.toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Day 60 forecast */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-650 tracking-wider">Projection à 60 jours (Fin août)</span>
                <p className="text-2xl font-black text-indigo-650 font-mono">
                  {forecastMetrics.liquid60.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </p>
                <div className="flex justify-between text-[11px] font-medium font-mono text-slate-500">
                  <span className="flex items-center text-emerald-600 font-bold"><ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> +{forecastMetrics.cashIn60.toLocaleString('fr-FR')}</span>
                  <span className="flex items-center text-rose-600 font-bold"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> -{forecastMetrics.cashOut60.toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Day 90 forecast */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-650 tracking-wider">Projection à 90 jours (Fin sept.)</span>
                <p className="text-2xl font-black text-indigo-650 font-mono">
                  {forecastMetrics.liquid90.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </p>
                <div className="flex justify-between text-[11px] font-medium font-mono text-slate-500">
                  <span className="flex items-center text-emerald-600 font-bold"><ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> +{forecastMetrics.cashIn90.toLocaleString('fr-FR')}</span>
                  <span className="flex items-center text-rose-600 font-bold"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> -{forecastMetrics.cashOut90.toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Forecast Graphical Visualizer (Interactive CSS/SVG timeline bars) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Évolution Prévisionnelle de la Trésorerie
                </h4>
                <p className="text-[10px] text-slate-400">Projections glissantes basées sur les échéances du portefeuille d'effets</p>
              </div>

              {/* Graphic timeline */}
              <div className="h-64 flex items-end justify-between px-6 pt-8 border-b border-slate-200 font-mono text-xs text-slate-500 relative">
                {/* Dashed gridlines */}
                <div className="absolute left-0 right-0 top-12 border-t border-slate-100 border-dashed"></div>
                <div className="absolute left-0 right-0 top-28 border-t border-slate-100 border-dashed"></div>
                <div className="absolute left-0 right-0 top-44 border-t border-slate-100 border-dashed"></div>

                {/* Day 0 (Today) */}
                <div className="flex flex-col items-center space-y-2 z-10 w-1/4">
                  <div className="text-emerald-650 font-black text-center text-[10px]">
                    42.5K
                  </div>
                  <div className="bg-indigo-600 w-12 rounded-t-lg transition-all duration-500" style={{ height: '80px' }}></div>
                  <span className="font-bold">Aujourd'hui</span>
                </div>

                {/* Day 30 */}
                <div className="flex flex-col items-center space-y-2 z-10 w-1/4">
                  <div className="text-indigo-650 font-black text-center text-[10px]">
                    {Math.round(forecastMetrics.liquid30 / 100) / 10}K
                  </div>
                  <div className="bg-indigo-600 w-12 rounded-t-lg transition-all duration-500" style={{ height: `${80 + (forecastMetrics.liquid30 - forecastMetrics.activeBankBalance) / 250}px` }}></div>
                  <span className="font-bold">30 Jours</span>
                </div>

                {/* Day 60 */}
                <div className="flex flex-col items-center space-y-2 z-10 w-1/4">
                  <div className="text-indigo-650 font-black text-center text-[10px]">
                    {Math.round(forecastMetrics.liquid60 / 100) / 10}K
                  </div>
                  <div className="bg-indigo-600 w-12 rounded-t-lg transition-all duration-500" style={{ height: `${80 + (forecastMetrics.liquid60 - forecastMetrics.activeBankBalance) / 250}px` }}></div>
                  <span className="font-bold">60 Jours</span>
                </div>

                {/* Day 90 */}
                <div className="flex flex-col items-center space-y-2 z-10 w-1/4">
                  <div className="text-indigo-650 font-black text-center text-[10px]">
                    {Math.round(forecastMetrics.liquid90 / 100) / 10}K
                  </div>
                  <div className="bg-indigo-600 w-12 rounded-t-lg transition-all duration-500" style={{ height: `${80 + (forecastMetrics.liquid90 - forecastMetrics.activeBankBalance) / 250}px` }}></div>
                  <span className="font-bold">90 Jours</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: BANK AUDIT */}
        {activeSubTab === 'bank_audit' && (
          <motion.div
            key="audit-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Audited List */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Registre d'Audit de Commission & Agios Bancaires ({audits.length} audits)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Bank Overcharge Watch</span>
              </div>

              <div className="divide-y divide-slate-100">
                {audits.map((aud) => (
                  <div
                    key={aud.id}
                    className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 font-mono">{aud.id}</span>
                        <span className="text-[10px] bg-slate-150 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-bold">
                          {aud.bankName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{aud.auditDate}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-xs leading-snug">{aud.transactionType}</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {aud.auditNotes}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono font-bold">
                        <span>TMM appliqué : {aud.tmmRateUsed}%</span>
                        <span>|</span>
                        <span>Marge bancaire : {aud.bankMarginRate}%</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 text-right">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {aud.declaredAmount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          aud.isCompliant ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {aud.isCompliant ? 'Conforme' : 'Surfacturation détectée'}
                        </span>
                        <button
                          onClick={() => handleDeleteAudit(aud.id)}
                          className="p-1 hover:bg-rose-50 text-rose-650 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit regulations widget */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-650" />
                  <span>Réglementation BCT relative aux Agios</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  En Tunisie, la **Banque Centrale de Tunisie (BCT)** publie régulièrement le taux d'intérêt excessif (usure) calculé sur la base du **TMM (Taux Moyen du Marché)**. Les banques commerciales sont soumises à des limites strictes de marges souveraines. Tout dépassement de marge non consenti fait l'objet d'un droit de réclamation et de remboursement immédiat.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: SETTINGS */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="treasury-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Global parameters card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm md:col-span-2">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                <Percent className="w-4 h-4 text-indigo-650" />
                <span>Paramètres d'Intérêts & Agios (Tunisie)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Taux Moyen du Marché (TMM) :</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={tmmRate}
                      onChange={(e) => saveTmmRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Marge Maximale d'Agios (BCT) :</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={maxMarginRate}
                      onChange={(e) => saveMaxMarginRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[11px] text-indigo-800 leading-relaxed font-semibold">
                Ces taux servent au calcul d'audit de la conformité des frais d'agios déclarés par la banque.
              </div>
            </div>

            {/* Banks manager card */}
            <TreasuryConfigCard
              title="Liste des Banques de la Place"
              items={banksList}
              onAdd={(val) => {
                const trimmed = val.trim();
                if (!trimmed) return;
                const exists = banksList.some(b => b.toLowerCase().trim() === trimmed.toLowerCase());
                if (exists) {
                  showToast("Cette banque figure déjà dans la liste.", "error");
                  return;
                }
                saveBanks([...banksList, trimmed]);
                showToast(`La banque "${trimmed}" a été ajoutée.`);
              }}
              onDelete={(val) => {
                if (banksList.length > 1) {
                  saveBanks(banksList.filter(b => b !== val));
                  showToast(`La banque "${val}" a été retirée.`);
                } else {
                  showToast("Il doit y avoir au moins une banque dans la liste.", "error");
                }
              }}
              placeholder="Ex: BIAT, Attijari, BH Bank, Amen, UIB..."
            />

            {/* Fee Types manager card */}
            <TreasuryConfigCard
              title="Natures & Libellés des Commissions"
              items={feeTypesList}
              onAdd={(val) => {
                const trimmed = val.trim();
                if (!trimmed) return;
                const exists = feeTypesList.some(f => f.toLowerCase().trim() === trimmed.toLowerCase());
                if (exists) {
                  showToast("Ce type de frais figure déjà dans la liste.", "error");
                  return;
                }
                saveFeeTypes([...feeTypesList, trimmed]);
                showToast(`Le type de frais "${trimmed}" a été ajouté.`);
              }}
              onDelete={(val) => {
                if (feeTypesList.length > 1) {
                  saveFeeTypes(feeTypesList.filter(f => f !== val));
                  showToast(`Le type de frais "${val}" a été retiré.`);
                } else {
                  showToast("Il doit y avoir au moins un type de frais.", "error");
                }
              }}
              placeholder="Ex: Frais de tenue de compte, Commission sur virement..."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Nouveau Chèque/Traite --- */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-indigo-450" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Enregistrer un Chèque ou une Traite Commerciale
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Type d'effet :</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      <option value="Chèque reçu">Chèque reçu (Recette Client)</option>
                      <option value="Chèque émis">Chèque émis (Dépense Fournisseur)</option>
                      <option value="Traite reçue">Traite reçue (Client)</option>
                      <option value="Traite émise">Traite émise (Fournisseur)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Référence / Numéro d'effet :</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CH-998855"
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Banque Émettrice / Tirée :</label>
                    <select
                      value={formBank}
                      onChange={(e) => setFormBank(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      {banksList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Date d'échéance :</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Tiers / Client ou Fournisseur :</label>
                    <input
                      type="text"
                      required
                      placeholder="Nom de l'entreprise"
                      value={formDrawer}
                      onChange={(e) => setFormDrawer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Montant Nominal (TND) :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Notes & Justification transactionnelle :</label>
                  <textarea
                    rows={2}
                    placeholder="Justification, référence facture liée..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer l'Effet / Chèque
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Auditer un Frais --- */}
      <AnimatePresence>
        {isAuditFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Auditer un Frais ou Commission Bancaire
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuditFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAudit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Banque auditée :</label>
                  <select
                    value={auditBank}
                    onChange={(e) => setAuditBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    {banksList.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Type de Frais / Commission :</label>
                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    {feeTypesList.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Montant Facturé par la banque (TND) :</label>
                    <input
                      type="number"
                      required
                      min={0.001}
                      value={auditAmount}
                      onChange={(e) => setAuditAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Marge bancaire déclarée (%) :</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      value={auditMargin}
                      onChange={(e) => setAuditMargin(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Notes d'Audit et Constatations :</label>
                  <textarea
                    rows={2}
                    placeholder="Facultatif. Un commentaire d'audit..."
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAuditFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer l'Audit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TreasuryConfigCard({ 
  title, 
  items, 
  onAdd, 
  onDelete, 
  placeholder 
}: { 
  title: string; 
  items: string[]; 
  onAdd: (val: string) => void; 
  onDelete: (val: string) => void; 
  placeholder: string;
}) {
  const [val, setVal] = useState('');

  const handleAdd = () => {
    const trimmed = val.trim();
    if (trimmed) {
      onAdd(trimmed);
      setVal('');
    } else {
      alert(`Veuillez d'abord saisir une valeur (ex: dans le champ de saisie) avant de cliquer sur "Ajouter".`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {items.length} items
        </span>
      </h3>
      <div className="flex space-x-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-black transition-colors shrink-0 cursor-pointer"
        >
          Ajouter
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-semibold">
            <span className="text-slate-700 truncate mr-2" title={item}>{item}</span>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors shrink-0 animate-pulse-once cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
