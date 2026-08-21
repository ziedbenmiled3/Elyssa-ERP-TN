/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { appStorage } from '../services/storageAdapter';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Eye,
  X,
  Calculator,
  Building2,
  Printer,
  Download,
  Info,
  TrendingDown,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Percent
} from 'lucide-react';
import { BankAccount, BankTransaction, TaxDeclaration, YearEndClosing } from '../types';

export type AssetCategory =
  | 'CORPORELLE'
  | 'INCORPORELLE'
  | 'FINANCIERE'
  | 'EN_COURS';

export type AmortizationMethod = 'LINEAIRE' | 'DEGRESSIF';

export interface Asset {
  id: string;
  companyId: string;
  code: string;
  name: string;
  category: AssetCategory;
  accountCode: string; // Ex: 222 (Matériel info), 224 (Matériel de transport)
  acquisitionDate: string; // YYYY-MM-DD
  commissioningDate: string; // Date de mise en service pour prorata SCE
  acquisitionCost: number; // Montant brut HT (en TND)
  salvageValue: number; // Valeur résiduelle
  durationYears: number; // Durée de vie utile
  amortizationMethod: AmortizationMethod;
  degressiveRateMultiplier?: number;
  supplier?: string;
  invoiceRef?: string;
  location?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface AmortizationScheduleRow {
  year: number;
  baseAmount: number;
  rate: number;
  annuity: number;
  accumulated: number;
  vnc: number;
}

export interface InvestmentManagerProps {
  currentTenantId?: string;
  isDemo?: boolean;
  bankAccounts?: BankAccount[];
  bankTransactions?: BankTransaction[];
  taxDeclarations?: TaxDeclaration[];
  yearEndClosings?: YearEndClosing[];
  onUpdateBankAccounts?: (accounts: BankAccount[]) => void;
  onUpdateBankTransactions?: (txs: BankTransaction[]) => void;
  onUpdateTaxDeclarations?: (decs: TaxDeclaration[]) => void;
  onUpdateYearEndClosings?: (closings: YearEndClosing[]) => void;
  readOnly?: boolean;
}

const CATEGORY_LABELS: Record<AssetCategory, { label: string; color: string; defaultAccount: string }> = {
  CORPORELLE: { label: 'Immo. Corporelle', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50', defaultAccount: '22' },
  INCORPORELLE: { label: 'Immo. Incorporelle', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50', defaultAccount: '21' },
  FINANCIERE: { label: 'Immo. Financière', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50', defaultAccount: '25' },
  EN_COURS: { label: 'Immo. en cours', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50', defaultAccount: '23' },
};

const STORAGE_KEY = 'carthage_assets_immobilisations';

// Initial Tunisian Demo Assets
const SEED_ASSETS: Asset[] = [
  {
    id: 'ast-inv-1',
    companyId: 'Inter-Affaires',
    code: 'IMM-2025-001',
    name: 'Serveurs Dell PowerEdge & Baie de Stockage SAN',
    category: 'CORPORELLE',
    accountCode: '222',
    acquisitionDate: '2025-01-15',
    commissioningDate: '2025-01-20',
    acquisitionCost: 28500.000,
    salvageValue: 0,
    durationYears: 3,
    amortizationMethod: 'LINEAIRE',
    supplier: 'Dell Technologies Tunisie',
    invoiceRef: 'FACT-DELL-9921',
    location: 'Salle Serveurs siège Charguia II',
    notes: 'Infrastructures SI et sauvegarde centrale cloud'
  },
  {
    id: 'ast-inv-2',
    companyId: 'Inter-Affaires',
    code: 'IMM-2024-002',
    name: 'Fourgon Isuzu D-Max Camionette Commerciale',
    category: 'CORPORELLE',
    accountCode: '224',
    acquisitionDate: '2024-03-01',
    commissioningDate: '2024-03-15',
    acquisitionCost: 78000.000,
    salvageValue: 5000.000,
    durationYears: 5,
    amortizationMethod: 'LINEAIRE',
    supplier: 'Afrique Auto S.A. Isuzu',
    invoiceRef: 'AA-2024-0412',
    location: 'Parc Automobile - Ben Arous',
    notes: 'Véhicule de livraison Van Sales régional'
  },
  {
    id: 'ast-inv-3',
    companyId: 'Inter-Affaires',
    code: 'IMM-2024-003',
    name: 'Progiciel ERP Elyssa (Licence Perpétuelle & Spécifications)',
    category: 'INCORPORELLE',
    accountCode: '212',
    acquisitionDate: '2024-06-10',
    commissioningDate: '2024-07-01',
    acquisitionCost: 18000.000,
    salvageValue: 0,
    durationYears: 3,
    amortizationMethod: 'LINEAIRE',
    supplier: 'Elyssa Software Technologies',
    invoiceRef: 'EST-2024-0819',
    location: 'Licence Logicielle Cloud',
    notes: 'Agrément et digitalisation des processus métiers'
  },
  {
    id: 'ast-inv-4',
    companyId: 'Inter-Affaires',
    code: 'IMM-2023-004',
    name: 'Ligne de Conditionnement Semi-Automatique',
    category: 'CORPORELLE',
    accountCode: '223',
    acquisitionDate: '2023-09-01',
    commissioningDate: '2023-09-15',
    acquisitionCost: 145000.000,
    salvageValue: 10000.000,
    durationYears: 7,
    amortizationMethod: 'DEGRESSIF',
    supplier: 'Bizerte Industrie & Outillages',
    invoiceRef: 'BIO-2023-112',
    location: 'Usine de Production - Nabeul',
    notes: 'Amortissement dégressif fiscal (Coeff 2.5)'
  },
  {
    id: 'ast-inv-5',
    companyId: 'Inter-Affaires',
    code: 'IMM-2026-005',
    name: 'Titres de Participation - Portefeuille BIAT / SFBT',
    category: 'FINANCIERE',
    accountCode: '251',
    acquisitionDate: '2026-02-01',
    commissioningDate: '2026-02-01',
    acquisitionCost: 50000.000,
    salvageValue: 50000.000,
    durationYears: 0,
    amortizationMethod: 'LINEAIRE',
    supplier: 'Intermédiaire en Bourse MAC SA',
    invoiceRef: 'MAC-2026-009',
    location: 'Compte Titres BVMT',
    notes: 'Placements stratégiques non amortissables'
  }
];

export default function InvestmentManager({
  currentTenantId = 'Inter-Affaires',
  isDemo = false,
  readOnly = false
}: InvestmentManagerProps) {
  const isDemoTenant = Boolean(isDemo || currentTenantId === 'company_demo' || (currentTenantId && currentTenantId.toLowerCase().includes('démo') && !currentTenantId.toLowerCase().includes('parent')));
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssetForSchedule, setSelectedAssetForSchedule] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Chargement des données filtrées par Tenant
  const loadAssets = () => {
    try {
      if (!isDemoTenant) {
        // En mode PROD (company_parent) : 0 actif enregistré, valeur brute = 0 DT
        const raw = appStorage.getItem(STORAGE_KEY);
        if (raw) {
          const all: Asset[] = JSON.parse(raw);
          if (Array.isArray(all)) {
            const tenantAssets = all.filter(a => a && a.companyId === currentTenantId && !String(a.id || '').startsWith('ast-inv-') && !String(a.id || '').startsWith('demo-') && !String(a.code || '').startsWith('IMM-202'));
            setAssets(tenantAssets);
            return;
          }
        }
        setAssets([]);
        return;
      }

      // En mode SANDBOX (company_demo) : Charger le registre des 5 actifs types (319 500 DT)
      const raw = appStorage.getItem(STORAGE_KEY);
      if (raw) {
        const all: Asset[] = JSON.parse(raw);
        if (Array.isArray(all) && all.length > 0) {
          const tenantAssets = all.filter(a => a && (a.companyId === currentTenantId || a.companyId === 'Inter-Affaires' || a.companyId === 'company_demo'));
          if (tenantAssets.length > 0) {
            setAssets(tenantAssets);
            return;
          }
        }
      }
      setAssets(SEED_ASSETS);
      appStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ASSETS));
    } catch (_) {
      setAssets(isDemoTenant ? SEED_ASSETS : []);
    }
  };

  useEffect(() => {
    loadAssets();
    window.addEventListener('elyssa_demo_state_changed', loadAssets);
    return () => window.removeEventListener('elyssa_demo_state_changed', loadAssets);
  }, [currentTenantId, isDemoTenant]);

  // Sauvegarde globale multi-tenant
  const persistAssets = (updatedTenantAssets: Asset[]) => {
    try {
      const raw = appStorage.getItem(STORAGE_KEY);
      const all: Asset[] = raw ? JSON.parse(raw) : (isDemoTenant ? SEED_ASSETS : []);
      const others = all.filter(a => a.companyId !== currentTenantId);
      const combined = [...others, ...updatedTenantAssets];
      
      appStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      setAssets(updatedTenantAssets);
      window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId: currentTenantId } }));
    } catch (err) {
      console.error('Erreur sauvegarde actifs:', err);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Omit<Asset, 'companyId' | 'id'>>({
    code: '',
    name: '',
    category: 'CORPORELLE',
    accountCode: '22',
    acquisitionDate: new Date().toISOString().split('T')[0],
    commissioningDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    salvageValue: 0,
    durationYears: 5,
    amortizationMethod: 'LINEAIRE',
    supplier: '',
    invoiceRef: '',
    location: '',
    notes: ''
  });

  // Calcul du tableau d'amortissement SCE Tunisie (Prorata temporis exact sur 360 jours)
  const calculateSchedule = (asset: Asset): AmortizationScheduleRow[] => {
    if (asset.category === 'FINANCIERE' || asset.category === 'EN_COURS' || asset.durationYears <= 0) {
      return [];
    }

    const rows: AmortizationScheduleRow[] = [];
    const depreciableBase = Math.max(0, asset.acquisitionCost - asset.salvageValue);
    const commDate = new Date(asset.commissioningDate);
    const startYear = commDate.getFullYear();
    const linearRate = (1 / asset.durationYears) * 100;

    const commMonth = commDate.getMonth();
    const commDay = Math.min(commDate.getDate(), 30);
    const daysInFirstYear = (11 - commMonth) * 30 + (30 - commDay + 1);
    const firstYearRatio = Math.min(1, Math.max(0, daysInFirstYear / 360));

    let accumulated = 0;
    let currentVnc = asset.acquisitionCost;

    if (asset.amortizationMethod === 'LINEAIRE') {
      const normalAnnualAnnuity = depreciableBase / asset.durationYears;
      const totalYears = firstYearRatio < 1 ? asset.durationYears + 1 : asset.durationYears;

      for (let i = 0; i < totalYears; i++) {
        const year = startYear + i;
        let annuity = 0;

        if (i === 0) {
          annuity = normalAnnualAnnuity * firstYearRatio;
        } else if (i === totalYears - 1 && firstYearRatio < 1) {
          annuity = depreciableBase - accumulated;
        } else {
          annuity = normalAnnualAnnuity;
        }

        annuity = Math.min(annuity, depreciableBase - accumulated);
        accumulated += annuity;
        currentVnc = asset.acquisitionCost - accumulated;

        rows.push({
          year,
          baseAmount: depreciableBase,
          rate: Number(linearRate.toFixed(2)),
          annuity: Math.round(annuity * 1000) / 1000,
          accumulated: Math.round(accumulated * 1000) / 1000,
          vnc: Math.max(asset.salvageValue, Math.round(currentVnc * 1000) / 1000)
        });
      }
    } else {
      const coeff = asset.durationYears <= 4 ? 1.5 : asset.durationYears <= 6 ? 2.0 : 2.5;
      const degressiveRate = linearRate * coeff;
      let remainingBase = depreciableBase;

      for (let i = 0; i < asset.durationYears; i++) {
        const year = startYear + i;
        const remainingYears = asset.durationYears - i;
        const linearSubstituteRate = (1 / remainingYears) * 100;

        let appliedRate = degressiveRate;
        let annuity = 0;

        if (linearSubstituteRate >= degressiveRate) {
          appliedRate = linearSubstituteRate;
          annuity = remainingBase / remainingYears;
        } else {
          annuity = (remainingBase * degressiveRate) / 100;
        }

        if (i === 0 && firstYearRatio < 1) {
          annuity = annuity * firstYearRatio;
        }

        annuity = Math.min(annuity, remainingBase);
        accumulated += annuity;
        remainingBase -= annuity;
        currentVnc = asset.acquisitionCost - accumulated;

        rows.push({
          year,
          baseAmount: Math.round((remainingBase + annuity) * 1000) / 1000,
          rate: Number(appliedRate.toFixed(2)),
          annuity: Math.round(annuity * 1000) / 1000,
          accumulated: Math.round(accumulated * 1000) / 1000,
          vnc: Math.max(0, Math.round(currentVnc * 1000) / 1000)
        });
      }
    }

    return rows;
  };

  const currentYear = new Date().getFullYear();

  const financialSummary = useMemo(() => {
    let totalGrossValue = 0;
    let totalDepreciated = 0;
    let totalVnc = 0;
    let currentYearAnnuity = 0;

    assets.forEach((asset) => {
      totalGrossValue += asset.acquisitionCost;
      const schedule = calculateSchedule(asset);
      
      const currentYearRow = schedule.find((r) => r.year === currentYear);
      if (currentYearRow) {
        currentYearAnnuity += currentYearRow.annuity;
        totalDepreciated += currentYearRow.accumulated;
        totalVnc += currentYearRow.vnc;
      } else {
        const lastRow = schedule[schedule.length - 1];
        if (lastRow && currentYear > lastRow.year) {
          totalDepreciated += lastRow.accumulated;
          totalVnc += lastRow.vnc;
        } else {
          totalVnc += asset.acquisitionCost;
        }
      }
    });

    return { totalGrossValue, totalDepreciated, totalVnc, currentYearAnnuity };
  }, [assets, currentYear]);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.accountCode.includes(searchTerm);
    const matchesCategory =
      categoryFilter === 'ALL' || asset.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const handleOpenAdd = () => {
    setFormData({
      code: `IMM-${new Date().getFullYear()}-${String(assets.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'CORPORELLE',
      accountCode: '22',
      acquisitionDate: new Date().toISOString().split('T')[0],
      commissioningDate: new Date().toISOString().split('T')[0],
      acquisitionCost: 0,
      salvageValue: 0,
      durationYears: 5,
      amortizationMethod: 'LINEAIRE',
      supplier: '',
      invoiceRef: '',
      location: '',
      notes: ''
    });
    setEditingAsset(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      const updated = assets.map((a) => (a.id === editingAsset.id ? { ...formData, id: a.id, companyId: currentTenantId } : a));
      persistAssets(updated);
    } else {
      const newAsset: Asset = {
        ...formData,
        id: `ast-${Date.now()}`,
        companyId: currentTenantId
      };
      persistAssets([newAsset, ...assets]);
    }
    setIsAddModalOpen(false);
    setEditingAsset(null);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({ ...asset });
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmez-vous la suppression de cette immobilisation ?')) {
      const updated = assets.filter((a) => a.id !== id);
      persistAssets(updated);
    }
  };

  const formatTND = (val: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building className="w-7 h-7 text-indigo-600 dark:text-indigo-400"/>
            Gestion des Investissements & Immobilisations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registre des actifs, suivi de la VNC et tableaux d'amortissement conforme au Système Comptable des Entreprises (SCE Tunisie).
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md shadow-indigo-600/20 text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4"/>
            Nouvelle Immobilisation
          </button>
        )}
      </div>

      <>
        {/* Cartes Synthèse VNC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Valeur Brute (Actifs)</span>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl"><DollarSign className="w-5 h-5"/></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">{formatTND(financialSummary.totalGrossValue)}</p>
              <span className="text-xs text-slate-400 mt-1 block">{assets.length} actif(s) enregistré(s)</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Amortissements Cumulés</span>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl"><Layers className="w-5 h-5"/></div>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatTND(financialSummary.totalDepreciated)}</p>
              <span className="text-xs text-slate-400 mt-1 block">Cumul au 31/12/{currentYear}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Valeur Nette (VNC)</span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-5 h-5"/></div>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatTND(financialSummary.totalVnc)}</p>
              <span className="text-xs text-slate-400 mt-1 block">Valeur comptable actuelle</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Dotation Exercice ({currentYear})</span>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl"><Calculator className="w-5 h-5"/></div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{formatTND(financialSummary.currentYearAnnuity)}</p>
              <span className="text-xs text-slate-400 mt-1 block">Charge prévisionnelle N</span>
            </div>
          </div>

          {/* Barre de Recherche & Filtrage */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input
                type="text"
                placeholder="Rechercher par nom, code ou compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400"/>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Toutes les catégories</option>
                <option value="CORPORELLE">Immobilisations Corporelles</option>
                <option value="INCORPORELLE">Immobilisations Incorporelles</option>
                <option value="FINANCIERE">Immobilisations Financières</option>
                <option value="EN_COURS">Immobilisations en cours</option>
              </select>
            </div>
          </div>

          {/* Tableau des Immobilisations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Code / Compte</th>
                    <th className="py-3.5 px-4">Désignation</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4">Mise en service</th>
                    <th className="py-3.5 px-4 text-right">Coût Brut (TND)</th>
                    <th className="py-3.5 px-4 text-right">VNC Actuelle</th>
                    <th className="py-3.5 px-4 text-center">Méthode</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        Aucune immobilisation enregistrée pour cette entreprise.
                      </td>
                    </tr>
                  ) : (
                    paginatedAssets.map((asset) => {
                      const schedule = calculateSchedule(asset);
                      const currentYearRow = schedule.find((r) => r.year === currentYear);
                      const vnc = currentYearRow ? currentYearRow.vnc : asset.acquisitionCost;
                      const catInfo = CATEGORY_LABELS[asset.category];

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{asset.code}</div>
                            <div className="text-xs text-slate-400 font-mono">Cpt: {asset.accountCode}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{asset.name}</div>
                            {asset.supplier && <div className="text-xs text-slate-400">Fourn: {asset.supplier}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {new Date(asset.commissioningDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">{formatTND(asset.acquisitionCost)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatTND(vnc)}</td>
                          <td className="py-3.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {asset.amortizationMethod === 'LINEAIRE' ? 'Linéaire' : 'Dégressif'} ({asset.durationYears} ans)
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                title="Tableau d'amortissement"
                                onClick={() => setSelectedAssetForSchedule(asset)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4"/>
                              </button>
                              {!readOnly && (
                                <>
                                  <button
                                    title="Modifier"
                                    onClick={() => handleEdit(asset)}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4"/>
                                  </button>
                                  <button
                                    title="Supprimer"
                                    onClick={() => handleDelete(asset.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                <span className="text-xs text-slate-500">
                  Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} sur {filteredAssets.length} actifs
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </>

      {/* MODAL : Ajouter / Modifier Immobilisation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>{editingAsset ? 'Modifier la Fiche d\'Immobilisation' : 'Nouvelle Immobilisation Comptable'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Code Interne / Imm. *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: IMM-2026-008"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Désignation de l'Actif *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Camionette Fourgon Isuzu"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie d'Actif *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value as AssetCategory;
                      setFormData({
                        ...formData,
                        category: cat,
                        accountCode: CATEGORY_LABELS[cat].defaultAccount
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="CORPORELLE">Immobilisation Corporelle</option>
                    <option value="INCORPORELLE">Immobilisation Incorporelle</option>
                    <option value="FINANCIERE">Immobilisation Financière</option>
                    <option value="EN_COURS">Immobilisation en cours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compte Comptable SCE *</label>
                  <input
                    type="text"
                    required
                    value={formData.accountCode}
                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    placeholder="Ex: 222 (Matériel Info), 224 (Transport)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Acquisition *</label>
                  <input
                    type="date"
                    required
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Mise en Service (Prorata) *</label>
                  <input
                    type="date"
                    required
                    value={formData.commissioningDate}
                    onChange={(e) => setFormData({ ...formData, commissioningDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Coût d'Acquisition Brut HT (TND) *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={formData.acquisitionCost}
                    onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valeur Résiduelle Estimée (TND)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.salvageValue}
                    onChange={(e) => setFormData({ ...formData, salvageValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Durée d'Utilité (en Années) *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.durationYears}
                    onChange={(e) => setFormData({ ...formData, durationYears: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Méthode d'Amortissement *</label>
                  <select
                    value={formData.amortizationMethod}
                    onChange={(e) => setFormData({ ...formData, amortizationMethod: e.target.value as AmortizationMethod })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="LINEAIRE">Amortissement Linéaire</option>
                    <option value="DEGRESSIF">Amortissement Dégressif Fiscal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={formData.supplier || ''}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ex: Afrique Auto"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Réf. Facture / Contrat</label>
                  <input
                    type="text"
                    value={formData.invoiceRef || ''}
                    onChange={(e) => setFormData({ ...formData, invoiceRef: e.target.value })}
                    placeholder="Ex: FA-2026-902"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Remarques & Affectation</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes de contrôle, numéro de série ou affectation analytique..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md cursor-pointer"
                >
                  Enregistrer l'Immobilisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : Tableau d'Amortissement Détaillé SCE Tunisie */}
      {selectedAssetForSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Tableau d'Amortissement Officiel SCE Tunisie
                </span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mt-0.5">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span>{selectedAssetForSchedule.name} ({selectedAssetForSchedule.code})</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssetForSchedule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* En-tête fiche actif */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-bold block uppercase">Date de Mise en Service</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {new Date(selectedAssetForSchedule.commissioningDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase">Coût d'Acquisition HT</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatTND(selectedAssetForSchedule.acquisitionCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase">Méthode d'Amortissement</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {selectedAssetForSchedule.amortizationMethod === 'LINEAIRE' ? 'Linéaire' : 'Dégressif Fiscal'} ({selectedAssetForSchedule.durationYears} ans)
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase">Compte Comptable SCE</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedAssetForSchedule.accountCode}
                </span>
              </div>
            </div>

            {/* Tableau Annuel */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Année</th>
                    <th className="py-2.5 px-3 text-right">Base Amortissable (TND)</th>
                    <th className="py-2.5 px-3 text-center">Taux (%)</th>
                    <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">Annuité (Dotation N)</th>
                    <th className="py-2.5 px-3 text-right">Amort. Cumulés</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">VNC (Fin d'exercice)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {calculateSchedule(selectedAssetForSchedule).map((row) => (
                    <tr key={row.year} className={row.year === currentYear ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                      <td className="py-2.5 px-3 font-sans">
                        {row.year} {row.year === currentYear && <span className="ml-1 text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full uppercase">Exercice Actuel</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">{formatTND(row.baseAmount)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{(row.rate ?? 0).toFixed(2)}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{formatTND(row.annuity)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">{formatTND(row.accumulated)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatTND(row.vnc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <span className="text-[11px] text-slate-400">
                Calcul effectué selon le prorata temporis exact de la norme comptable tunisienne (SCE - Loi 96-112).
              </span>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'Échéancier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
