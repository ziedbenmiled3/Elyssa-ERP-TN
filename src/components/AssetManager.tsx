import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { appStorage } from '../services/storageAdapter';
import { 
  Building, 
  Calculator, 
  TrendingDown, 
  Shield, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  PieChart,
  Info,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Download,
  Percent,
  Cpu,
  Truck,
  Briefcase,
  Sliders,
  MapPin
} from 'lucide-react';

interface Immobilisation {
  id: string;
  name: string;
  category: 'Matériel Industriel' | 'Matériel Informatique' | 'Matériel de Transport' | 'Bâtiments & Locaux' | 'Mobilier & Agencements';
  purchaseDate: string;
  initialValue: number; // TND HT
  usefulLifeYears: number; // e.g. 5 years (20% rate)
  amortizationType: 'Linéaire' | 'Dégressif';
  scrapValue?: number; // Valeur résiduelle (usually 0)
  disposalDate?: string;
  disposalValue?: number; // Selling price if sold
  location: string; // Tunis, Sfax, Sousse, etc.
}

interface DepreciationRow {
  year: number;
  basis: number;
  rate: number;
  annuity: number;
  accumulated: number;
  bookValue: number; // VNC (Valeur Nette Comptable)
}

interface AssetManagerProps {
  currentUser: any;
  assets?: Immobilisation[];
  onUpdateAssets?: (assets: Immobilisation[]) => void;
  isDemoCompany?: boolean;
}

// --- Default Tunisian Company Demo Assets (Synchronisés avec la Flotte SCE 224 & Équipements) ---
const DEFAULT_DEMO_ASSETS: Immobilisation[] = [
  {
    id: 'ast-imm-1',
    name: 'Serveurs Dell PowerEdge & Baie de Stockage SAN',
    category: 'Matériel Informatique',
    purchaseDate: '2025-01-15',
    initialValue: 28500.000,
    usefulLifeYears: 3,
    amortizationType: 'Linéaire',
    location: 'Siège Social Tunis'
  },
  {
    id: 'ast-imm-2',
    name: 'Fourgon Isuzu D-Max (240 TN 8812)',
    category: 'Matériel de Transport',
    purchaseDate: '2024-02-10',
    initialValue: 72000.000,
    usefulLifeYears: 5,
    amortizationType: 'Linéaire',
    location: 'Dépôt de Sousse'
  },
  {
    id: 'ast-imm-3',
    name: 'Progiciel ERP Elyssa (Licence Perpétuelle)',
    category: 'Matériel Informatique',
    purchaseDate: '2024-06-10',
    initialValue: 18000.000,
    usefulLifeYears: 3,
    amortizationType: 'Linéaire',
    location: 'Siège Social Tunis'
  },
  {
    id: 'ast-imm-4',
    name: 'Ligne de Conditionnement Semi-Automatique',
    category: 'Matériel Industriel',
    purchaseDate: '2023-09-01',
    initialValue: 145000.000,
    usefulLifeYears: 7,
    amortizationType: 'Dégressif',
    location: 'Usine de Sfax'
  },
  {
    id: 'ast-imm-5',
    name: 'Titres de Participation - Portefeuille BIAT / SFBT',
    category: 'Matériel Industriel',
    purchaseDate: '2026-02-01',
    initialValue: 50000.000,
    usefulLifeYears: 10,
    amortizationType: 'Linéaire',
    location: 'Siège Social Tunis'
  },
  {
    id: 'ast-imm-6',
    name: 'Peugeot Partner Utilitaire (228 TN 4091)',
    category: 'Matériel de Transport',
    purchaseDate: '2024-03-12',
    initialValue: 62000.000,
    usefulLifeYears: 5,
    amortizationType: 'Linéaire',
    location: 'Siège Social Tunis'
  },
  {
    id: 'ast-imm-7',
    name: 'Citroën C-Élysée Berline (215 TN 9811)',
    category: 'Matériel de Transport',
    purchaseDate: '2023-01-15',
    initialValue: 48000.000,
    usefulLifeYears: 5,
    amortizationType: 'Linéaire',
    location: 'Dépôt de Sousse'
  }
];

// Helper to sanitize & normalize raw asset inputs from any format
function normalizeAssetItem(raw: any, index: number): Immobilisation {
  const rawId = String(raw?.id || raw?.code || `IMM-2026-${String(index + 1).padStart(3, '0')}`);
  const rawName = String(raw?.name || raw?.code || `Immobilisation #${index + 1}`);

  let category: Immobilisation['category'] = 'Matériel Industriel';
  const catStr = String(raw?.category || '').toLowerCase();
  const nameStr = rawName.toLowerCase();

  if (catStr.includes('info') || catStr === 'materielinformatique' || nameStr.includes('dell') || nameStr.includes('erp') || nameStr.includes('serveur')) {
    category = 'Matériel Informatique';
  } else if (catStr.includes('transp') || nameStr.includes('fourgon') || nameStr.includes('isuzu') || nameStr.includes('camion')) {
    category = 'Matériel de Transport';
  } else if (catStr.includes('bâtiment') || catStr.includes('local') || nameStr.includes('bâtiment') || nameStr.includes('usine')) {
    category = 'Bâtiments & Locaux';
  } else if (catStr.includes('mobilier') || catStr.includes('agenc') || nameStr.includes('bureau') || nameStr.includes('chaise')) {
    category = 'Mobilier & Agencements';
  } else if (['Matériel Industriel', 'Matériel Informatique', 'Matériel de Transport', 'Bâtiments & Locaux', 'Mobilier & Agencements'].includes(raw?.category)) {
    category = raw.category;
  }

  const initialValue = Math.max(0, Number(raw?.initialValue ?? raw?.acquisitionCost ?? raw?.acquisitionValue) || 0);
  const usefulLifeYears = Math.max(1, Number(raw?.usefulLifeYears ?? raw?.durationYears) || 5);

  let purchaseDate = String(raw?.purchaseDate || raw?.acquisitionDate || raw?.commissioningDate || '2025-01-15');
  if (isNaN(new Date(purchaseDate).getTime())) {
    purchaseDate = '2025-01-15';
  }

  let amortizationType: 'Linéaire' | 'Dégressif' = 'Linéaire';
  if (raw?.amortizationType === 'Dégressif' || raw?.amortizationMethod === 'DEGRESSIF') {
    amortizationType = 'Dégressif';
  }

  const location = String(raw?.location || 'Siège Social Tunis');

  return {
    id: rawId,
    name: rawName,
    category,
    purchaseDate,
    initialValue,
    usefulLifeYears,
    amortizationType,
    location,
    scrapValue: Number(raw?.scrapValue ?? raw?.salvageValue) || 0
  };
}

// Ensure 100% unique IDs across all loaded assets
function sanitizeAssetsList(rawList: any[], isDemoCompany: boolean = false): Immobilisation[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return isDemoCompany ? DEFAULT_DEMO_ASSETS : [];
  }
  const seenIds = new Set<string>();
  const sanitized: Immobilisation[] = [];

  rawList.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    if (!isDemoCompany && (raw.is_demo || String(raw.id || '').startsWith('demo-') || String(raw.id || '').startsWith('ast-imm-'))) {
      return;
    }
    const item = normalizeAssetItem(raw, idx);
    let finalId = item.id;
    if (seenIds.has(finalId)) {
      finalId = `${finalId}-dup${idx + 1}`;
      item.id = finalId;
    }
    seenIds.add(finalId);
    sanitized.push(item);
  });

  if (sanitized.length > 0) return sanitized;
  return isDemoCompany ? DEFAULT_DEMO_ASSETS : [];
}

export default function AssetManager({ 
  currentUser,
  assets: propAssets = [],
  onUpdateAssets = () => {},
  isDemoCompany = false
}: AssetManagerProps) {
  const STORAGE_KEY = 'carthage_assets_immobilisations';

  // State normalized safely
  const safeAssets = useMemo(() => {
    return sanitizeAssetsList(propAssets, isDemoCompany);
  }, [propAssets, isDemoCompany]);

  const [activeSubTab, setActiveSubTab] = useState<'registry' | 'capital_gains' | 'settings'>('registry');

  // Configurable states
  const [corporateTaxRate, setCorporateTaxRate] = useState<number>(() => {
    const saved = appStorage.getItem('carthage_assets_is_rate');
    return saved ? Number(saved) : 15;
  });
  const [locationsList, setLocationsList] = useState<string[]>(() => {
    const saved = appStorage.getItem('carthage_assets_locations');
    return saved ? JSON.parse(saved) : ['Siège Social Tunis', 'Usine de Sfax', 'Dépôt de Sousse', 'Entrepôt Gabès'];
  });
  const [newLocationVal, setNewLocationVal] = useState('');
  const [categoriesConfig, setCategoriesConfig] = useState<{ category: string; lifetime: number }[]>(() => {
    const saved = appStorage.getItem('carthage_assets_categories_config');
    return saved ? JSON.parse(saved) : [
      { category: 'Matériel Industriel', lifetime: 10 },
      { category: 'Matériel Informatique', lifetime: 3 },
      { category: 'Matériel de Transport', lifetime: 5 },
      { category: 'Bâtiments & Locaux', lifetime: 20 },
      { category: 'Mobilier & Agencements', lifetime: 10 }
    ];
  });

  const updateCorporateTaxRate = (rate: number) => {
    setCorporateTaxRate(rate);
    appStorage.setItem('carthage_assets_is_rate', String(rate));
  };
  const updateLocationsList = (locs: string[]) => {
    setLocationsList(locs);
    appStorage.setItem('carthage_assets_locations', JSON.stringify(locs));
  };
  const updateCategoriesConfig = (config: { category: string; lifetime: number }[]) => {
    setCategoriesConfig(config);
    appStorage.setItem('carthage_assets_categories_config', JSON.stringify(config));
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');

  // Selected asset for detailed depreciation table
  const [selectedAsset, setSelectedAsset] = useState<Immobilisation | null>(null);

  // Form State - Add Asset
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Immobilisation['category']>('Matériel Industriel');
  const [formDate, setFormDate] = useState('');
  const [formValue, setFormValue] = useState(10000);
  const [formLife, setFormLife] = useState(10);
  const [formType, setFormType] = useState<Immobilisation['amortizationType']>('Linéaire');
  const [formLocation, setFormLocation] = useState('Usine de Sfax');

  // Sync useful life form field with selected category configuration
  useEffect(() => {
    const config = categoriesConfig.find(c => c.category === formCategory);
    if (config) {
      setFormLife(config.lifetime);
    }
  }, [formCategory, categoriesConfig]);

  useEffect(() => {
    if (locationsList.length > 0 && !locationsList.includes(formLocation)) {
      setFormLocation(locationsList[0]);
    }
  }, [locationsList]);

  // Sync selected asset with list
  useEffect(() => {
    if (safeAssets.length > 0) {
      if (!selectedAsset || !safeAssets.some(a => a.id === selectedAsset.id)) {
        setSelectedAsset(safeAssets[0]);
      }
    } else {
      setSelectedAsset(null);
    }
  }, [safeAssets]);

  // Capital Gains disposal form
  const [gainAssetId, setGainAssetId] = useState('');
  const [gainDisposalDate, setGainDisposalDate] = useState('');
  const [gainDisposalValue, setGainDisposalValue] = useState(5000);
  const [gainResult, setGainResult] = useState<any | null>(null);

  // --- Load / Save ---
  useEffect(() => {
    if (!propAssets || propAssets.length === 0) {
      const saved = appStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdateAssets(sanitizeAssetsList(parsed));
          } else {
            onUpdateAssets(DEFAULT_DEMO_ASSETS);
            appStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_ASSETS));
          }
        } catch (_) {
          onUpdateAssets(DEFAULT_DEMO_ASSETS);
          appStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_ASSETS));
        }
      } else {
        onUpdateAssets(DEFAULT_DEMO_ASSETS);
        appStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_ASSETS));
      }
    }
  }, []);

  const saveAssetsToStorage = (updated: Immobilisation[]) => {
    const sanitized = sanitizeAssetsList(updated);
    onUpdateAssets(sanitized);
    appStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  };

  // --- Depreciation Schedule Engine ---
  // Calculates depreciation schedules strictly following Tunisian NCT standards
  const generateDepreciationSchedule = (asset: Immobilisation): DepreciationRow[] => {
    if (!asset || typeof asset !== 'object') return [];
    const schedule: DepreciationRow[] = [];
    const basis = Math.max(0, Number(asset.initialValue) || 0);
    const life = Math.max(1, Math.min(50, Math.floor(Number(asset.usefulLifeYears) || 1)));
    
    let dateStr = asset.purchaseDate;
    let purchaseDateObj = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(purchaseDateObj.getTime())) {
      purchaseDateObj = new Date('2025-01-15');
    }
    const purchaseYear = purchaseDateObj.getFullYear() || 2025;
    const purchaseMonth = Math.max(1, Math.min(12, purchaseDateObj.getMonth() + 1));

    let accumulated = 0;

    if (asset.amortizationType === 'Linéaire' || !asset.amortizationType) {
      const annualRate = 100 / life;
      
      // Year 1: prorata temporis
      const monthsInFirstYear = Math.max(1, Math.min(12, 12 - purchaseMonth + 1));
      const firstYearAnnuity = basis * (annualRate / 100) * (monthsInFirstYear / 12);
      accumulated += firstYearAnnuity;
      schedule.push({
        year: purchaseYear,
        basis,
        rate: Math.round(annualRate * 100) / 100,
        annuity: Math.round(firstYearAnnuity * 1000) / 1000,
        accumulated: Math.round(accumulated * 1000) / 1000,
        bookValue: Math.max(0, Math.round((basis - accumulated) * 1000) / 1000)
      });

      // Intermediate years
      for (let i = 1; i < life; i++) {
        const annuity = basis * (annualRate / 100);
        accumulated += annuity;
        schedule.push({
          year: purchaseYear + i,
          basis,
          rate: Math.round(annualRate * 100) / 100,
          annuity: Math.round(annuity * 1000) / 1000,
          accumulated: Math.round(Math.min(basis, accumulated) * 1000) / 1000,
          bookValue: Math.max(0, Math.round((basis - Math.min(basis, accumulated)) * 1000) / 1000)
        });
      }

      // Last year: remainder prorata temporis if purchased mid-year
      if (monthsInFirstYear < 12 && accumulated < basis) {
        const lastYearAnnuity = Math.max(0, basis - accumulated);
        accumulated += lastYearAnnuity;
        schedule.push({
          year: purchaseYear + life,
          basis,
          rate: Math.round(annualRate * 100) / 100,
          annuity: Math.round(lastYearAnnuity * 1000) / 1000,
          accumulated: Math.round(basis * 1000) / 1000,
          bookValue: 0
        });
      }
    } else {
      // Degressive depreciation
      let coeff = 1.5;
      if (life > 4 && life <= 6) coeff = 2.0;
      if (life > 6) coeff = 2.5;

      const degressiveRate = (100 / life) * coeff;
      let remainingBasis = basis;

      for (let i = 0; i < life; i++) {
        const remainingYears = life - i;
        const linearAlternativeRate = 100 / remainingYears;
        
        let rateToApply = degressiveRate;
        let isLinearSwitch = false;

        if (linearAlternativeRate > degressiveRate) {
          rateToApply = linearAlternativeRate;
          isLinearSwitch = true;
        }

        const annuity = isLinearSwitch ? remainingBasis / remainingYears : remainingBasis * (rateToApply / 100);
        accumulated += annuity;
        remainingBasis -= annuity;

        schedule.push({
          year: purchaseYear + i,
          basis: Math.max(0, Math.round((remainingBasis + annuity) * 1000) / 1000),
          rate: Math.round(rateToApply * 100) / 100,
          annuity: Math.round(annuity * 1000) / 1000,
          accumulated: Math.round(Math.min(basis, accumulated) * 1000) / 1000,
          bookValue: Math.max(0, Math.round(remainingBasis * 1000) / 1000)
        });
      }
    }

    return schedule;
  };

  // --- Global Metrics ---
  const globalMetrics = useMemo(() => {
    let totalInitialCost = 0;
    let totalNetBookValue = 0;

    safeAssets.forEach(asset => {
      if (!asset) return;
      const initialVal = Number(asset.initialValue) || 0;
      totalInitialCost += initialVal;
      const sched = generateDepreciationSchedule(asset);
      const currentYear = 2026;
      const currentYearRow = sched.find(r => r.year === currentYear);
      if (currentYearRow) {
        totalNetBookValue += (currentYearRow.bookValue ?? 0);
      } else {
        const lastRow = sched[sched.length - 1];
        if (lastRow && currentYear > lastRow.year) {
          totalNetBookValue += 0;
        } else {
          totalNetBookValue += initialVal;
        }
      }
    });

    const accumulatedDepr = Math.max(0, totalInitialCost - totalNetBookValue);

    return {
      totalInitialCost,
      totalNetBookValue,
      accumulatedDepr
    };
  }, [safeAssets]);

  // --- filtered Assets ---
  const filteredAssets = useMemo(() => {
    return safeAssets.filter(asset => {
      if (!asset) return false;
      const nameStr = String(asset.name || asset.id || '');
      const idStr = String(asset.id || '');
      const locationStr = String(asset.location || '');
      const matchesSearch = !searchQuery || 
        nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
        idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locationStr.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'Tous' || asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [safeAssets, searchQuery, categoryFilter]);

  // --- Handlers ---
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newAsset: Immobilisation = {
      id: `IMM-2026-${String(safeAssets.length + 1).padStart(3, '0')}`,
      name: formName.trim(),
      category: formCategory,
      purchaseDate: formDate || new Date().toISOString().split('T')[0],
      initialValue: Number(formValue),
      usefulLifeYears: Number(formLife),
      amortizationType: formType,
      scrapValue: 0,
      location: formLocation
    };

    saveAssetsToStorage([newAsset, ...safeAssets]);
    setIsFormOpen(false);

    // Reset Form
    setFormName('');
    setFormValue(10000);
    setFormLife(5);
    setFormLocation('Usine de Sfax');
  };

  const handleDeleteAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette immobilisation ?")) {
      const updated = safeAssets.filter(a => a.id !== id);
      saveAssetsToStorage(updated);
      if (selectedAsset?.id === id) {
        setSelectedAsset(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  const handleSimulatePlusValue = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = safeAssets.find(a => a.id === gainAssetId);
    if (!asset) {
      alert("Veuillez sélectionner un actif valide.");
      return;
    }

    const sched = generateDepreciationSchedule(asset);
    const disposalYear = gainDisposalDate ? new Date(gainDisposalDate).getFullYear() : 2026;
    
    // Find VNC at the year of selling
    const sellingYearRow = sched.find(r => r.year === disposalYear);
    const vnc = sellingYearRow ? sellingYearRow.bookValue : 0;

    const initialCost = asset.initialValue;
    const cumulDepr = initialCost - vnc;
    const prixCession = Number(gainDisposalValue);

    // Capital Gain/Loss = Selling Price - VNC
    const gainOrLoss = prixCession - vnc;
    
    // Tax impact IS
    const taxImpact = gainOrLoss > 0 ? gainOrLoss * (corporateTaxRate / 100) : 0;

    setGainResult({
      assetName: asset.name,
      purchaseValue: initialCost,
      cumulDepr,
      vnc,
      disposalValue: prixCession,
      gainOrLoss,
      taxImpact,
      isGain: gainOrLoss > 0
    });
  };

  const exportAssetsToCSV = () => {
    const headers = 'ID,Nom Actif,Catégorie,Date Achat,Valeur d\'Acquisition HT (TND),Durée d\'Amortissement (ans),Type,Localisation\n';
    const rows = safeAssets.map(a => 
      `"${a.id}","${a.name}","${a.category}","${a.purchaseDate}",${a.initialValue},${a.usefulLifeYears},"${a.amortizationType}","${a.location}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `elyssa_immob_inventaire_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-800" id="asset-module">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Building className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-550/20 border border-amber-550/40 rounded-xl">
              <Building className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Gestion Financière & Patrimoniale</span>
              <h2 className="text-2xl font-black tracking-tight">Elyssa Immobilisations & Amortissements</h2>
            </div>
          </div>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Consignez l'ensemble de vos actifs corporels et incorporels, simulez les plans d'amortissement linéaires et dégressifs réglementaires tunisiens (NCT) et auditez l'impact fiscal des plus-values sur cession d'immobilisations (IS 15%).
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Valeur Brute Historique</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(globalMetrics.totalInitialCost ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Cumul des investissements d'actifs</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Amortissements Cumulés</span>
            <span className="text-2xl font-black text-rose-600 font-mono">
              {(globalMetrics.accumulatedDepr ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
            </span>
            <span className="text-[10px] text-rose-500 block font-bold font-mono">
              Amorti à {globalMetrics.totalInitialCost > 0 ? Math.round((globalMetrics.accumulatedDepr / globalMetrics.totalInitialCost) * 100) : 0}%
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Valeur Nette Comptable Globale</span>
            <span className="text-2xl font-black text-emerald-650 font-mono">
              {(globalMetrics.totalNetBookValue ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">VNC active estimée pour l'exercice 2026</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('registry')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'registry' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Registre d'Actifs ({safeAssets.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('capital_gains')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'capital_gains' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulateur Plus-values & Cessions d'Immos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuration Immos</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {activeSubTab === 'registry' && (
            <>
              <button
                onClick={exportAssetsToCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                title="Exporter l'inventaire d'immobilisations"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-650" />
                <span>Exporter Inventaire</span>
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Actif</span>
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: ASSET REGISTRY TABLE & DEPRECIATION SCHEDULE */}
        {activeSubTab === 'registry' && (
          <motion.div
            key="registry-panel"
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
                  placeholder="Rechercher une immobilisation par nom, ID ou marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Catégorie :</span>
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer text-slate-700 focus:border-indigo-500"
                  >
                    <option value="Tous">Toutes catégories</option>
                    <option value="Matériel Industriel">Matériel Industriel</option>
                    <option value="Matériel Informatique">Matériel Informatique</option>
                    <option value="Matériel de Transport">Matériel de Transport</option>
                    <option value="Bâtiments & Locaux">Bâtiments & Locaux</option>
                    <option value="Mobilier & Agencements">Mobilier & Agencements</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  <span>Inventaire Permanent des Immobilisations Corporelles ({filteredAssets.length} actifs)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  Elyssa Asset Ledger
                </span>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                <table className="w-full text-left text-xs border-collapse" id="table-assets-ledger">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-extrabold">Réf Actif & Localisation</th>
                      <th className="p-4 font-extrabold">Description de l'Actif</th>
                      <th className="p-4 font-extrabold">Achat & Durée</th>
                      <th className="p-4 font-extrabold text-right">Valeur d'Acquisition HT</th>
                      <th className="p-4 font-extrabold text-center">Plan</th>
                      <th className="p-4 font-extrabold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${selectedAsset?.id === asset.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                      >
                        {/* ID */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block font-mono">{asset.id}</span>
                            <span className="text-[10px] text-slate-400 block">{asset.location}</span>
                          </div>
                        </td>

                        {/* Description & Category */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">{asset.name}</span>
                              {((asset as any).is_demo || asset.id.startsWith('demo-')) ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-200">
                                  DÉMO
                                </span>
                              ) : (
                                <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-indigo-200">
                                  PROPRE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">{asset.category}</span>
                          </div>
                        </td>

                        {/* Date & useful life */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-700 font-semibold block">{asset.purchaseDate || '-'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{asset.usefulLifeYears || 1} ans (Taux : {Math.round(100 / (asset.usefulLifeYears || 1))}%)</span>
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="p-4 text-right">
                          <span className="text-slate-950 font-black font-mono">
                            {(asset.initialValue ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                          </span>
                        </td>

                        {/* Plan type */}
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            asset.amortizationType === 'Linéaire' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {asset.amortizationType}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleDeleteAsset(asset.id, e)}
                            className="p-1 hover:bg-rose-50 text-rose-650 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredAssets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                          <p className="text-xs font-black">Aucune immobilisation répertoriée dans cette catégorie</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Schedule Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Tableau d'Amortissement
                    </h4>
                    <p className="text-[10px] text-slate-400">Simulation d'amortissement fiscale (NCT)</p>
                  </div>
                  <Calculator className="w-5 h-5 text-indigo-650" />
                </div>

                {selectedAsset ? (
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Actif sélectionné :</span>
                      <span className="font-extrabold text-slate-900 text-xs block leading-tight">{selectedAsset.name}</span>
                    </div>

                    {/* Table schedule */}
                    <div className="overflow-x-auto max-h-[280px] overflow-y-auto pr-1 border border-slate-150 rounded-xl">
                      <table className="w-full text-left text-[10px] font-mono border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[8px] font-black tracking-wider border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="p-2">Année</th>
                            <th className="p-2 text-right">Annuité TND</th>
                            <th className="p-2 text-right">Cumul TND</th>
                            <th className="p-2 text-right">VNC TND</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                          {generateDepreciationSchedule(selectedAsset).map((row) => (
                            <tr key={row.year} className="hover:bg-slate-50/50">
                              <td className="p-2 text-slate-900">{row.year}</td>
                              <td className="p-2 text-right text-indigo-650">{(row.annuity ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                              <td className="p-2 text-right text-slate-600">{(row.accumulated ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                              <td className="p-2 text-right text-emerald-650">{(row.bookValue ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-[10px] leading-relaxed text-slate-400">
                      * Les calculs intègrent automatiquement la règle du **prorata temporis** tunisien pour la première année civile d'acquisition.
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Calculator className="w-8 h-8 mx-auto opacity-35" />
                    <p className="text-[11px] leading-relaxed">Aucun actif sélectionné.<br />Sélectionnez une ligne d'immobilisation dans le tableau pour calculer son plan d'amortissement réglementaire.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: CAPITAL GAINS DISPOSALS SIMULATOR */}
        {activeSubTab === 'capital_gains' && (
          <motion.div
            key="gains-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Entry Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Simulation de Cession d'Immobilisation
                </h4>
                <p className="text-[10px] text-slate-400">Estimez la plus-value ou moins-value de cession</p>
              </div>

              <form onSubmit={handleSimulatePlusValue} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Actif à céder :</label>
                  <select
                    required
                    value={gainAssetId}
                    onChange={(e) => setGainAssetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    <option value="">Sélectionner une immobilisation active...</option>
                    {safeAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Acquis à {(a.initialValue ?? 0).toLocaleString('fr-FR')} TND)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Date de cession effective :</label>
                    <input
                      type="date"
                      required
                      value={gainDisposalDate}
                      onChange={(e) => setGainDisposalDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Prix de vente / cession (TND HT) :</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={gainDisposalValue}
                      onChange={(e) => setGainDisposalValue(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Calculer la plus-value comptable & fiscale
                  </button>
                </div>
              </form>
            </div>

            {/* Results Workspace */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-full space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Diagnostic d'Impact Fiscal (Tunisie)
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400">NCT 05 / Code IRPP-IS</span>
                </div>

                {gainResult ? (
                  <div className="space-y-4 text-xs font-medium">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 font-semibold">Désignation actif :</span>
                        <span className="font-extrabold text-slate-800">{gainResult.assetName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Valeur d'Acquisition HT</span>
                          <span className="font-bold text-slate-800 font-mono">{(gainResult.purchaseValue ?? 0).toLocaleString('fr-FR')} TND</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Valeur Nette Comptable (VNC)</span>
                          <span className="font-bold text-indigo-650 font-mono">{(gainResult.vnc ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Price vs VNC */}
                      <div className="p-4 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Prix de Cession HT</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{(gainResult.disposalValue ?? 0).toLocaleString('fr-FR')} TND</span>
                      </div>

                      {/* Result */}
                      <div className={`p-4 border rounded-xl space-y-1 ${gainResult.isGain ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                        <span className="text-[10px] block font-bold uppercase">Résultat de Cession (Plus-value)</span>
                        <span className="text-lg font-black font-mono">
                          {gainResult.gainOrLoss > 0 ? '+' : ''}{(gainResult.gainOrLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND
                        </span>
                      </div>
                    </div>

                    {/* Tax Reintegration Note */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <span className="font-bold text-slate-800 flex items-center space-x-1">
                        <Percent className="w-3.5 h-3.5 text-indigo-650" />
                        <span>Réintégration Fiscale au taux d'IS ({corporateTaxRate}%)</span>
                      </span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Conformément au Code tunisien de l'Impôt sur le Revenu des Personnes Physiques et de l'Impôt sur les Sociétés (Art. 45), la plus-value nette dégagée lors de la cession est intégrée dans le résultat imposable au taux de **{corporateTaxRate}%**.
                      </p>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-150">
                        <span className="text-slate-600 font-bold">Impôt IS sur plus-value à provisionner :</span>
                        <span className="text-sm font-black text-rose-600 font-mono">
                          {(gainResult.taxImpact ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Calculator className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-black">Prêt à simuler</p>
                    <p className="text-[11px] text-slate-400">Remplissez le formulaire de gauche et lancez l'estimation comptable.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: CONFIGURATION IMMOS */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="assets-settings-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Lifetimes Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Grille des catégories comptables & Durées de vie utiles (NCT)</span>
              </h3>
              <p className="text-[11.5px] text-slate-400 leading-normal font-semibold">
                Définissez les durées d'utilité par défaut préconisées par les Normes Comptables Tunisiennes (NCT) pour vos calculs d'amortissements linéaires ou dégressifs.
              </p>
              <div className="space-y-3.5 pt-2">
                {categoriesConfig.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-xs font-bold text-slate-700">{item.category}</span>
                    <div className="flex items-center space-x-2 font-mono">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={item.lifetime}
                        onChange={(e) => {
                          const newConfig = [...categoriesConfig];
                          newConfig[index].lifetime = Number(e.target.value);
                          updateCategoriesConfig(newConfig);
                        }}
                        className="w-16 p-1.5 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-855 outline-none focus:border-indigo-500"
                      />
                      <span className="text-[11px] text-slate-400 font-sans font-bold">ans</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Taux d'IS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  <span>Taux de l'Impôt sur les Sociétés (IS)</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configurez le taux standard de l'IS applicable à votre secteur d'activité (standard : 15%, entreprises financières ou pétrolières : 35%, exportatrices : 10%).
                </p>
                <div className="flex items-center space-x-3 font-mono pt-1">
                  <div className="relative w-32">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={corporateTaxRate}
                      onChange={(e) => updateCorporateTaxRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                  <span className="text-[11.5px] text-slate-500 font-sans font-semibold">
                    Actuellement : {corporateTaxRate}% d'IS sur les gains nets de cession.
                  </span>
                </div>
              </div>

              {/* Sites / Localisations d'actifs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Registre des Sites & Localisations d'Actifs</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configurez les usines, entrepôts ou succursales de votre entreprise pour l'inventaire géolocalisé de vos immobilisations.
                </p>
                <div className="flex space-x-2 pt-1">
                  <input
                    type="text"
                    value={newLocationVal}
                    onChange={(e) => setNewLocationVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newLocationVal.trim();
                        if (trimmed !== '') {
                          if (!locationsList.includes(trimmed)) {
                            updateLocationsList([...locationsList, trimmed]);
                          }
                          setNewLocationVal('');
                        } else {
                          alert("Veuillez d'abord saisir le nom d'un site ou d'une localisation.");
                        }
                      }
                    }}
                    placeholder="Ex: Bureau de Sousse"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newLocationVal.trim();
                      if (trimmed !== '') {
                        if (!locationsList.includes(trimmed)) {
                          updateLocationsList([...locationsList, trimmed]);
                        }
                        setNewLocationVal('');
                      } else {
                        alert("Veuillez d'abord saisir le nom d'un site ou d'une localisation.");
                      }
                    }}
                    className="p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {locationsList.map(loc => (
                    <div key={loc} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-bold text-slate-700">
                      <span className="truncate">{loc}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (locationsList.length > 1) {
                            updateLocationsList(locationsList.filter(l => l !== loc));
                          } else {
                            alert("Il doit rester au moins une localisation configurée.");
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Ajouter un Actif --- */}
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
                  <Building className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Enregistrer une Immobilisation (Actif Corporel)
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

              <form onSubmit={handleSaveAsset} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Désignation de l'immobilisation :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serveur NAS Synology 8 Baies"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Catégorie comptable :</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      <option value="Matériel Industriel">Matériel Industriel</option>
                      <option value="Matériel Informatique">Matériel Informatique</option>
                      <option value="Matériel de Transport">Matériel de Transport</option>
                      <option value="Bâtiments & Locaux">Bâtiments & Locaux</option>
                      <option value="Mobilier & Agencements">Mobilier & Agencements</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Date d'acquisition :</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Valeur d'Acquisition HT (TND) :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Durée d'utilité (ans) :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={formLife}
                      onChange={(e) => setFormLife(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Mode d'amortissement :</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      <option value="Linéaire">Linéaire (Standard)</option>
                      <option value="Dégressif">Dégressif (Accéléré)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Localisation de l'actif :</label>
                    <select
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      {locationsList.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
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
                    Enregistrer l'Actif
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
