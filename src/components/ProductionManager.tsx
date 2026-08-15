import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cog, 
  Layers, 
  Activity, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  User, 
  Cpu, 
  Wrench,
  Download,
  FileSpreadsheet,
  Gauge,
  Hourglass,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  ClipboardList,
  Flame,
  Info
} from 'lucide-react';

import { RawMaterial, Nomenclature, ManufacturingOrder, ImportFolder, LCRequest } from '../types';

interface ProductionManagerProps {
  currentUser: any;
  nomenclatures?: Nomenclature[];
  onUpdateNomenclatures?: (nomenclatures: Nomenclature[]) => void;
  manufacturingOrders?: ManufacturingOrder[];
  onUpdateManufacturingOrders?: (manufacturingOrders: ManufacturingOrder[]) => void;
  isDemoCompany?: boolean;
  importFolders?: ImportFolder[];
  lcRequests?: LCRequest[];
}

export default function ProductionManager({ 
  currentUser,
  nomenclatures: propNomenclatures = [],
  onUpdateNomenclatures = () => {},
  manufacturingOrders: propManufacturingOrders = [],
  onUpdateManufacturingOrders = () => {},
  isDemoCompany = false,
  importFolders = [],
  lcRequests = []
}: ProductionManagerProps) {
  // --- Local Storage Keys ---
  const BOM_STORAGE_KEY = 'carthage_production_nomenclatures';
  const MO_STORAGE_KEY = 'carthage_production_manufacturing_orders';

  // --- Prepopulated Data ---
  const DEFAULT_NOMENCLATURES: Nomenclature[] = [
    {
      id: 'demo-nom-1',
      productName: 'Câble Électrique Isolé 2.5mm²',
      category: 'Câblerie & Électricité',
      estimatedTimeMinutes: 12,
      laborCostPerUnit: 1.200,
      materials: [
        { id: 'm1', name: 'Cuivre Cathodique Pur', quantityNeeded: 0.18, unit: 'kg', unitCost: 24.500 },
        { id: 'm2', name: 'Grains PVC Isolants (Gris)', quantityNeeded: 0.12, unit: 'kg', unitCost: 4.800 },
        { id: 'm3', name: 'Touret Bois de Conditionnement', quantityNeeded: 0.01, unit: 'u', unitCost: 15.000 },
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
        { id: 'm7', name: 'Bobine de Déclenchement Magnétique', quantityNeeded: 1, unit: 'u', unitCost: 1.800 },
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
        { id: 'm9', name: 'Fil de Tire-aiguille Acier', quantityNeeded: 1, unit: 'm', unitCost: 0.080 },
      ]
    }
  ];

  const DEFAULT_MANUFACTURING_ORDERS: ManufacturingOrder[] = [
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

  // --- States & Proxies ---
  const nomenclatures = propNomenclatures;
  const setNomenclatures = (val: any) => {
    if (typeof val === 'function') {
      onUpdateNomenclatures(val(nomenclatures));
    } else {
      onUpdateNomenclatures(val);
    }
  };

  const manufacturingOrders = propManufacturingOrders;
  const setManufacturingOrders = (val: any) => {
    if (typeof val === 'function') {
      onUpdateManufacturingOrders(val(manufacturingOrders));
    } else {
      onUpdateManufacturingOrders(val);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'nomenclatures' | 'oee' | 'settings'>('orders');

  // --- Local Storage Keys for Settings ---
  const SETTINGS_LINES_KEY = 'carthage_production_settings_lines_v2';
  const SETTINGS_TEAMS_KEY = 'carthage_production_settings_teams_v2';
  const SETTINGS_CATEGORIES_KEY = 'carthage_production_settings_categories_v2';

  const DEFAULT_LINES = [
    "Ligne Extrusion A (Sfax)",
    "Ligne Assemblage B (Tunis)",
    "Ligne Extrusion C (Sfax)",
    "Ligne Moulage D (Sousse)"
  ];

  const DEFAULT_TEAMS = [
    "Équipe Matin (Chef : J. Ben Ali)",
    "Équipe Après-midi (Chef : M. Trabelsi)",
    "Équipe Nuit (Chef : S. Sassi)"
  ];

  const DEFAULT_CATEGORIES = [
    "Câblerie & Électricité",
    "Appareillage Électrique",
    "Conduits & Goulottes",
    "Général"
  ];

  const [productionLines, setProductionLines] = useState<string[]>([]);
  const [productionTeams, setProductionTeams] = useState<string[]>([]);
  const [bomCategories, setBomCategories] = useState<string[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Planifié' | 'En attente Douane/Matières' | 'En cours' | 'Terminé' | 'Rejeté'>('Tous');

  // Form State - MO (Ordre de Fabrication)
  const [isMOFormOpen, setIsMOFormOpen] = useState(false);
  const [editingMO, setEditingMO] = useState<ManufacturingOrder | null>(null);
  const [formNomenclatureId, setFormNomenclatureId] = useState('');
  const [formQtyToProduce, setFormQtyToProduce] = useState(1000);
  const [formStartDate, setFormStartDate] = useState('');
  const [formAssignedLine, setFormAssignedLine] = useState('');
  const [formAssignedTeam, setFormAssignedTeam] = useState('');
  const [formImportFolderId, setFormImportFolderId] = useState('');
  const [formLcRequestId, setFormLcRequestId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form State - Nomenclature (BOM)
  const [isBOMFormOpen, setIsBOMFormOpen] = useState(false);
  const [bomProductName, setBomProductName] = useState('');
  const [bomCategory, setBomCategory] = useState('');
  const [bomEstTime, setBomEstTime] = useState(15);
  const [bomLaborCost, setBomLaborCost] = useState(1.5);
  const [bomMaterials, setBomMaterials] = useState<RawMaterial[]>([
    { id: '1', name: '', quantityNeeded: 1, unit: 'kg', unitCost: 1.0 }
  ]);

  // Selected Detail Modal
  const [selectedMO, setSelectedMO] = useState<ManufacturingOrder | null>(null);

  // --- Landing Cost & Customs Clearance Calculation Engine ---
  const getImportFolderLandingCostInfo = (folderId?: string) => {
    if (!folderId || !importFolders || importFolders.length === 0) return null;
    const folder = importFolders.find(f => f.id === folderId);
    if (!folder) return null;

    const exchangeRate = folder.exchangeRate || 3.35;
    const fobTotalTND = folder.items.reduce((sum, item) => sum + (item.quantity * item.fobUnitPrice * exchangeRate), 0);
    
    const freight = folder.freightCostTND || 0;
    const customs = folder.customsDutiesTND || 0;
    const transitter = folder.transitterFeesTND || 0;
    const handling = folder.handlingFeesTND || 0;
    const insurance = folder.insuranceCostTND || 0;
    const other = folder.otherFeesTND || 0;

    const totalLandingExpensesTND = freight + customs + transitter + handling + insurance + other;
    
    // Landed cost markup ratio (Coefficient de ventilation/majoration des frais d'approche)
    const landedMarkupRatio = fobTotalTND > 0 ? (totalLandingExpensesTND / fobTotalTND) : 0;
    const landedMultiplier = 1 + landedMarkupRatio;

    return {
      folder,
      fobTotalTND,
      totalLandingExpensesTND,
      freight,
      customs,
      transitter,
      handling,
      insurance,
      other,
      landedMarkupRatioPercent: Math.round(landedMarkupRatio * 1000) / 10,
      landedMultiplier,
      isCleared: folder.status === 'Cleared' || folder.status === 'InStock',
      isBlockedInCustoms: folder.status === 'Transit' || folder.status === 'Customs' || folder.status === 'Draft',
      customsStatus: folder.status
    };
  };

  const getBOMCostBreakdown = (bom: Nomenclature, importFolderId?: string) => {
    const landingInfo = getImportFolderLandingCostInfo(importFolderId);

    let rawMaterialBaseCost = 0;
    let rawMaterialLandedCost = 0;

    bom.materials.forEach(mat => {
      const matLandingInfo = mat.importFolderId ? getImportFolderLandingCostInfo(mat.importFolderId) : landingInfo;
      const mult = matLandingInfo ? matLandingInfo.landedMultiplier : 1;

      const baseUnitCost = mat.unitCost;
      const landedUnitCost = baseUnitCost * mult;

      rawMaterialBaseCost += mat.quantityNeeded * baseUnitCost;
      rawMaterialLandedCost += mat.quantityNeeded * landedUnitCost;
    });

    const laborCost = bom.laborCostPerUnit || 0;
    const totalBaseCostPerUnit = rawMaterialBaseCost + laborCost;
    const totalLandedCostPerUnit = rawMaterialLandedCost + laborCost;
    const landedCostDifference = totalLandedCostPerUnit - totalBaseCostPerUnit;

    return {
      rawMaterialBaseCost,
      rawMaterialLandedCost,
      laborCost,
      totalBaseCostPerUnit,
      totalLandedCostPerUnit,
      landedCostDifference,
      landingInfo
    };
  };

  // --- Load and Save Data ---
  useEffect(() => {
    if (nomenclatures.length === 0) {
      if (isDemoCompany) {
        onUpdateNomenclatures(DEFAULT_NOMENCLATURES);
      } else {
        const savedBoms = localStorage.getItem(BOM_STORAGE_KEY);
        if (savedBoms) {
          try {
            const parsed = JSON.parse(savedBoms);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onUpdateNomenclatures(parsed);
            }
          } catch (e) {
            console.error('Error parsing boms:', e);
          }
        }
      }
    }
  }, [isDemoCompany]);

  useEffect(() => {
    if (manufacturingOrders.length === 0) {
      if (isDemoCompany) {
        onUpdateManufacturingOrders(DEFAULT_MANUFACTURING_ORDERS);
      } else {
        const savedMOs = localStorage.getItem(MO_STORAGE_KEY);
        if (savedMOs) {
          try {
            const parsed = JSON.parse(savedMOs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onUpdateManufacturingOrders(parsed);
            }
          } catch (e) {
            console.error('Error parsing MOs:', e);
          }
        }
      }
    }
  }, [isDemoCompany]);

  useEffect(() => {
    // Load Settings
    const savedLines = localStorage.getItem(SETTINGS_LINES_KEY);
    const parsedLines = savedLines ? JSON.parse(savedLines) : DEFAULT_LINES;
    setProductionLines(parsedLines);
    if (!savedLines) {
      localStorage.setItem(SETTINGS_LINES_KEY, JSON.stringify(DEFAULT_LINES));
    }
    setFormAssignedLine(parsedLines[0] || '');

    const savedTeams = localStorage.getItem(SETTINGS_TEAMS_KEY);
    const parsedTeams = savedTeams ? JSON.parse(savedTeams) : DEFAULT_TEAMS;
    setProductionTeams(parsedTeams);
    if (!savedTeams) {
      localStorage.setItem(SETTINGS_TEAMS_KEY, JSON.stringify(DEFAULT_TEAMS));
    }
    setFormAssignedTeam(parsedTeams[0] || '');

    const savedCats = localStorage.getItem(SETTINGS_CATEGORIES_KEY);
    const parsedCats = savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES;
    setBomCategories(parsedCats);
    if (!savedCats) {
      localStorage.setItem(SETTINGS_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
    setBomCategory(parsedCats[0] || 'Général');
  }, []);

  const saveLines = (updated: string[]) => {
    setProductionLines(updated);
    localStorage.setItem(SETTINGS_LINES_KEY, JSON.stringify(updated));
  };

  const saveTeams = (updated: string[]) => {
    setProductionTeams(updated);
    localStorage.setItem(SETTINGS_TEAMS_KEY, JSON.stringify(updated));
  };

  const saveCategories = (updated: string[]) => {
    setBomCategories(updated);
    localStorage.setItem(SETTINGS_CATEGORIES_KEY, JSON.stringify(updated));
  };

  const saveBomsToStorage = (updated: Nomenclature[]) => {
    onUpdateNomenclatures(updated);
    localStorage.setItem(BOM_STORAGE_KEY, JSON.stringify(updated));
  };

  const saveMOsToStorage = (updated: ManufacturingOrder[]) => {
    onUpdateManufacturingOrders(updated);
    localStorage.setItem(MO_STORAGE_KEY, JSON.stringify(updated));
  };

  // --- Calculations ---
  // Calculates cost of raw materials for a single unit of a product
  const calculateBOMMaterialCost = (bom: Nomenclature) => {
    return bom.materials.reduce((sum, mat) => sum + (mat.quantityNeeded * mat.unitCost), 0);
  };

  const calculateBOMTotalCost = (bom: Nomenclature) => {
    return calculateBOMMaterialCost(bom) + bom.laborCostPerUnit;
  };

  // filtered manufacturing orders
  const filteredMOs = useMemo(() => {
    return manufacturingOrders.filter(mo => {
      const matchesSearch = mo.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            mo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (mo.notes && mo.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'Tous' || mo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [manufacturingOrders, searchQuery, statusFilter]);

  // filtered nomenclatures (BOMs)
  const filteredBOMs = useMemo(() => {
    return nomenclatures.filter(bom => {
      return bom.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             bom.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
             bom.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [nomenclatures, searchQuery]);

  // OEE (TRS - Taux de Rendement Synthétique) Metrics
  const oeeMetrics = useMemo(() => {
    const finishedMOs = manufacturingOrders.filter(mo => mo.status === 'Terminé' || (mo.status === 'En cours' && mo.quantityProduced > 0));
    
    if (finishedMOs.length === 0) {
      return { trs: 88.5, dispo: 92.0, performance: 97.2, qualite: 99.1, totalProduced: 12500, totalScrapped: 180 };
    }

    let totalProduced = 0;
    let totalScrapped = 0;
    let totalToProduce = 0;

    finishedMOs.forEach(mo => {
      totalProduced += mo.quantityProduced;
      totalScrapped += mo.quantityScrapped;
      totalToProduce += mo.quantityToProduce;
    });

    // Quality Rate = Good Products / Total Products
    const goodProducts = totalProduced - totalScrapped;
    const qualite = totalProduced > 0 ? (goodProducts / totalProduced) * 100 : 98.2;

    // Performance & Availability averages
    const dispo = 93.4; // Simulated factory machine uptime in Tunisian production facilities
    const performance = 95.8; // Efficiency compared to ideal cycle times
    const trs = (dispo * performance * qualite) / 10000;

    return {
      trs: Math.round(trs * 10) / 10,
      dispo,
      performance,
      qualite: Math.round(qualite * 10) / 10,
      totalProduced,
      totalScrapped
    };
  }, [manufacturingOrders]);

  // --- Handlers ---
  const handleOpenNewMO = () => {
    if (nomenclatures.length === 0) {
      alert("Veuillez d'abord créer une nomenclature avant de lancer un ordre de fabrication.");
      return;
    }
    setEditingMO(null);
    setFormNomenclatureId(nomenclatures[0].id);
    setFormQtyToProduce(1000);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormAssignedLine(productionLines[0] || '');
    setFormAssignedTeam(productionTeams[0] || '');
    setFormImportFolderId(importFolders.length > 0 ? importFolders[0].id : '');
    setFormLcRequestId('');
    setFormNotes('');
    setIsMOFormOpen(true);
  };

  const handleEditMO = (mo: ManufacturingOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMO(mo);
    setFormNomenclatureId(mo.nomenclatureId);
    setFormQtyToProduce(mo.quantityToProduce);
    setFormStartDate(mo.startDate);
    setFormAssignedLine(mo.assignedLine);
    setFormAssignedTeam(mo.assignedTeam);
    setFormImportFolderId(mo.importFolderId || '');
    setFormLcRequestId(mo.lcRequestId || '');
    setFormNotes(mo.notes || '');
    setIsMOFormOpen(true);
  };

  const handleSaveMO = (e: React.FormEvent) => {
    e.preventDefault();
    const bom = nomenclatures.find(n => n.id === formNomenclatureId);
    if (!bom) return;

    // Determine initial status based on import folder customs status
    let initialStatus: 'Planifié' | 'En attente Douane/Matières' = 'Planifié';
    if (formImportFolderId) {
      const landingInfo = getImportFolderLandingCostInfo(formImportFolderId);
      if (landingInfo && landingInfo.isBlockedInCustoms) {
        initialStatus = 'En attente Douane/Matières';
      }
    }

    if (editingMO) {
      // Edit
      const updated = manufacturingOrders.map(mo => {
        if (mo.id === editingMO.id) {
          return {
            ...mo,
            nomenclatureId: formNomenclatureId,
            productName: bom.productName,
            quantityToProduce: Number(formQtyToProduce),
            startDate: formStartDate,
            assignedLine: formAssignedLine,
            assignedTeam: formAssignedTeam,
            importFolderId: formImportFolderId || undefined,
            lcRequestId: formLcRequestId || undefined,
            status: (mo.status === 'Planifié' && initialStatus === 'En attente Douane/Matières') ? 'En attente Douane/Matières' : mo.status,
            notes: formNotes
          };
        }
        return mo;
      });
      saveMOsToStorage(updated);
    } else {
      // Create
      const newMO: ManufacturingOrder = {
        id: `OF-2026-${String(manufacturingOrders.length + 1).padStart(3, '0')}`,
        nomenclatureId: formNomenclatureId,
        productName: bom.productName,
        quantityToProduce: Number(formQtyToProduce),
        quantityProduced: 0,
        quantityScrapped: 0,
        startDate: formStartDate,
        assignedLine: formAssignedLine,
        assignedTeam: formAssignedTeam,
        importFolderId: formImportFolderId || undefined,
        lcRequestId: formLcRequestId || undefined,
        status: initialStatus,
        advancement: 0,
        notes: formNotes
      };
      saveMOsToStorage([newMO, ...manufacturingOrders]);
      if (newMO.status === 'En cours') {
        triggerRawMaterialsDeductionAndDA(newMO);
      }
    }
    setIsMOFormOpen(false);
  };

  const triggerRawMaterialsDeductionAndDA = (mo: ManufacturingOrder) => {
    // Find nomenclature matching product
    const nom = nomenclatures.find(n => 
      n.productName.toLowerCase().includes(mo.productName.toLowerCase()) || 
      mo.productName.toLowerCase().includes(n.productName.toLowerCase())
    ) || DEFAULT_NOMENCLATURES[1];

    if (!nom || !nom.materials) return;

    let storedProducts: any[] = [];
    try {
      const raw = localStorage.getItem('carthage_products');
      if (raw) storedProducts = JSON.parse(raw);
    } catch (e) {}

    let createdDAs: any[] = [];
    let alertMessages: string[] = [];

    const updatedProducts = storedProducts.map(p => {
      const matNeeded = nom.materials.find(m => 
        (p.sku && m.id && p.sku.toLowerCase() === m.id.toLowerCase()) || 
        (p.name && m.name && p.name.toLowerCase().includes(m.name.toLowerCase())) || 
        (p.name && m.name && m.name.toLowerCase().includes(p.name.toLowerCase()))
      );

      if (matNeeded) {
        const totalQuantityConsumed = (matNeeded.quantityNeeded || 1) * mo.quantityToProduce;
        const newStock = Math.max(0, p.stockLevel - totalQuantityConsumed);
        
        const minStock = p.minStockLevel || 500;
        if (newStock <= minStock) {
          const reorderQty = Math.max(1000, Math.round(minStock * 2.5));
          const estimatedCost = Math.round(reorderQty * (p.costPrice || p.unitPrice || 10));
          
          const daItem = {
            id: `DA-GPAO-${Date.now()}-${p.sku || p.id}`,
            itemDescription: `[RÉAPPRO GPAO] ${p.name} (${p.sku || 'Matière Première'}) - Seuil Critique Reint`,
            quantityRequested: reorderQty,
            unit: p.unit || 'Unité',
            estimatedCost,
            requestedBy: 'GPAO Production Automatique',
            department: 'Usine & Production',
            requestDate: new Date().toISOString().split('T')[0],
            status: 'En attente',
            decisionNotes: `DA générée automatiquement suite au lancement de l'OF ${mo.id} (${mo.quantityToProduce} u. ${mo.productName}). Stock restant: ${newStock} <= Seuil ${minStock}.`
          };
          createdDAs.push(daItem);
          alertMessages.push(`• ${p.name} (${p.sku}) : Stock restant = ${newStock} ${p.unit} <= Seuil (${minStock} ${p.unit}) -> DA #${daItem.id} auto-créée (${reorderQty} ${p.unit})`);
        }

        return {
          ...p,
          stockLevel: newStock,
          stockQuantity: newStock
        };
      }
      return p;
    });

    try {
      localStorage.setItem('carthage_products', JSON.stringify(updatedProducts));
    } catch (e) {}

    if (createdDAs.length > 0) {
      try {
        const existingRaw = localStorage.getItem('carthage_purchasing_requisitions');
        const existingDAs = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem('carthage_purchasing_requisitions', JSON.stringify([...createdDAs, ...existingDAs]));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      alert(`⚙️ GPAO & STOCKS SYNCHRONISÉS :\n\nLancement de l'Ordre de Fabrication ${mo.id} (${mo.quantityToProduce} unités de ${mo.productName}).\n\n- Consommation des Matières Premières déduite du Stock Central.\n- ${createdDAs.length} Demande(s) d'Achat (DA) pré-générée(s) automatiquement dans le module ACHATS :\n\n${alertMessages.join('\n')}`);
    }
  };

  const handleSimulateProgress = (moId: string) => {
    const targetMO = manufacturingOrders.find(mo => mo.id === moId);
    if (!targetMO) return;

    // Customs Check
    if ((targetMO.status === 'Planifié' || targetMO.status === 'En attente Douane/Matières') && targetMO.importFolderId) {
      const landingInfo = getImportFolderLandingCostInfo(targetMO.importFolderId);
      if (landingInfo && landingInfo.isBlockedInCustoms) {
        alert(`⚠️ Blocage Logistique Douanier !\n\nLe dossier d'importation lié ${landingInfo.folder.reference} (${landingInfo.folder.supplierName || 'Fournisseur'}) est actuellement en statut "${landingInfo.customsStatus}" au Port de ${landingInfo.folder.portOfArrival || 'Radès'}.\n\nL'Ordre de Fabrication reste bloqué au statut "En attente Douane/Matières" tant que le dédouanement n'est pas finalisé.`);
        
        if (targetMO.status !== 'En attente Douane/Matières') {
          const updated = manufacturingOrders.map(mo => mo.id === moId ? { ...mo, status: 'En attente Douane/Matières' as const } : mo);
          saveMOsToStorage(updated);
        }
        return;
      }
    }

    const updated = manufacturingOrders.map(mo => {
      if (mo.id === moId) {
        if (mo.status === 'Planifié' || mo.status === 'En attente Douane/Matières') {
          triggerRawMaterialsDeductionAndDA(mo);
          return { ...mo, status: 'En cours' as const, advancement: 10, notes: 'Matières dédouanées. Production démarrée & Stock matières déduit.' };
        } else if (mo.status === 'En cours') {
          const nextAdv = mo.advancement + 30;
          if (nextAdv >= 100) {
            const scrapped = Math.round(mo.quantityToProduce * (0.01 + Math.random() * 0.02)); // 1% - 3% scrap
            return {
              ...mo,
              status: 'Terminé' as const,
              advancement: 100,
              quantityProduced: mo.quantityToProduce,
              quantityScrapped: scrapped,
              endDate: new Date().toISOString().split('T')[0],
              notes: `Production clôturée avec succès. ${scrapped} unités déclassées (rebuts d'extrusion).`
            };
          } else {
            const producedSoFar = Math.round(mo.quantityToProduce * (nextAdv / 100));
            return {
              ...mo,
              advancement: nextAdv,
              quantityProduced: producedSoFar,
              quantityScrapped: Math.round(producedSoFar * 0.015),
              notes: `Avancement nominal. Cadence respectée.`
            };
          }
        }
      }
      return mo;
    });
    saveMOsToStorage(updated);
    // Sync active details if modal open
    const currentActive = updated.find(mo => mo.id === moId);
    if (currentActive && selectedMO) {
      setSelectedMO(currentActive);
    }
  };

  const handleDeleteMO = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet ordre de fabrication ?")) {
      const updated = manufacturingOrders.filter(mo => mo.id !== id);
      saveMOsToStorage(updated);
      if (selectedMO?.id === id) {
        setSelectedMO(null);
      }
    }
  };

  // --- Nomenclature Creation Handlers ---
  const handleAddMaterialRow = () => {
    setBomMaterials([
      ...bomMaterials,
      { id: Date.now().toString() + Math.random().toString(), name: '', quantityNeeded: 1, unit: 'kg', unitCost: 1.0 }
    ]);
  };

  const handleRemoveMaterialRow = (idx: number) => {
    if (bomMaterials.length === 1) return;
    setBomMaterials(bomMaterials.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx: number, field: keyof RawMaterial, value: any) => {
    const updated = bomMaterials.map((mat, i) => {
      if (i === idx) {
        return { ...mat, [field]: value };
      }
      return mat;
    });
    setBomMaterials(updated);
  };

  const handleSaveNomenclature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomProductName) {
      alert("Veuillez saisir le nom du produit fini.");
      return;
    }

    const newBom: Nomenclature = {
      id: `nom-${Date.now()}`,
      productName: bomProductName,
      category: bomCategory,
      estimatedTimeMinutes: Number(bomEstTime),
      laborCostPerUnit: Number(bomLaborCost),
      materials: bomMaterials.map(m => ({
        ...m,
        quantityNeeded: Number(m.quantityNeeded),
        unitCost: Number(m.unitCost)
      }))
    };

    saveBomsToStorage([...nomenclatures, newBom]);
    setIsBOMFormOpen(false);

    // Reset Form
    setBomProductName('');
    setBomCategory('Général');
    setBomEstTime(15);
    setBomLaborCost(1.5);
    setBomMaterials([{ id: '1', name: '', quantityNeeded: 1, unit: 'kg', unitCost: 1.0 }]);
  };

  const handleDeleteBOM = (id: string) => {
    if (manufacturingOrders.some(mo => mo.nomenclatureId === id)) {
      alert("Impossible de supprimer cette nomenclature car elle est actuellement liée à des ordres de fabrication existants.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette nomenclature ?")) {
      const updated = nomenclatures.filter(b => b.id !== id);
      saveBomsToStorage(updated);
    }
  };

  const exportMOToCSV = () => {
    const headers = 'ID,Produit,Quantité Objectif,Quantité Produite,Rebuts,Date Début,Statut,Avancement,Ligne,Équipe,Notes\n';
    const rows = manufacturingOrders.map(mo => 
      `"${mo.id}","${mo.productName}",${mo.quantityToProduce},${mo.quantityProduced},${mo.quantityScrapped},"${mo.startDate}","${mo.status}",${mo.advancement}%,"${mo.assignedLine}","${mo.assignedTeam}","${mo.notes || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `elyssa_gpa_of_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-800" id="production-module">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Cog className="w-96 h-96 animate-spin-slow text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-550/20 border border-indigo-550/40 rounded-xl">
              <Cog className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Gestion Industrielle & GPAO</span>
              <h2 className="text-2xl font-black tracking-tight">Elyssa Production & TRS</h2>
            </div>
          </div>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Planifiez vos ordres de fabrication (OF), configurez vos nomenclatures d'ingrédients multi-niveaux et pilotez en temps réel le Taux de Rendement Synthétique (TRS) de vos ateliers tunisiens.
          </p>
        </div>
      </div>

      {/* Mini Tabs Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'orders' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Ordres de Fabrication ({manufacturingOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('nomenclatures')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'nomenclatures' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Nomenclatures ({nomenclatures.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('oee')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'oee' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Atelier & Performance (TRS)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Configuration</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {activeSubTab === 'orders' && (
            <>
              <button
                onClick={exportMOToCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                title="Exporter l'historique des OF"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exporter CSV</span>
              </button>
              <button
                onClick={handleOpenNewMO}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Lancer un OF</span>
              </button>
            </>
          )}

          {activeSubTab === 'nomenclatures' && (
            <button
              onClick={() => setIsBOMFormOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer Nomenclature</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Panels */}
      <AnimatePresence mode="wait">
        {/* TAB 1: ORDERS OF */}
        {activeSubTab === 'orders' && (
          <motion.div
            key="orders-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Filters panel */}
            <div className="lg:col-span-12 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par produit, ID de fabrication ou note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Statut :</span>
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {(['Tous', 'Planifié', 'En attente Douane/Matières', 'En cours', 'Terminé', 'Rejeté'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          statusFilter === st ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table & Details Card */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <span>Suivi des Ordres de Fabrication ({filteredMOs.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  Elyssa Manufacturing Ledger
                </span>
              </div>

              {filteredMOs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-xs font-black text-slate-600">Aucun ordre de fabrication trouvé</p>
                  <p className="text-[11px] text-slate-400">Modifiez vos critères de recherche ou lancez un nouvel OF.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200">
                        <th className="p-4 font-extrabold">Ordre ID & Ligne</th>
                        <th className="p-4 font-extrabold">Produit Fini</th>
                        <th className="p-4 font-extrabold text-center">Progression OF</th>
                        <th className="p-4 font-extrabold text-right">Rendement / Rebuts</th>
                        <th className="p-4 font-extrabold text-center">Statut</th>
                        <th className="p-4 font-extrabold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredMOs.map((mo) => (
                        <tr 
                          key={mo.id} 
                          onClick={() => setSelectedMO(mo)}
                          className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${selectedMO?.id === mo.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                        >
                          {/* OF ID & line */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 block font-mono">{mo.id}</span>
                                {mo.id.startsWith('demo-') ? (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1 rounded border border-amber-200 uppercase scale-90">
                                    Démo
                                  </span>
                                ) : (
                                  <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1 rounded border border-indigo-200 uppercase scale-90">
                                    Propre
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{mo.assignedLine}</span>
                              {mo.importFolderId && (() => {
                                const lInfo = getImportFolderLandingCostInfo(mo.importFolderId);
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                    lInfo?.isBlockedInCustoms 
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  }`}>
                                    📦 {lInfo?.folder.reference || mo.importFolderId} {lInfo?.isBlockedInCustoms ? '(Douane)' : ''}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Product */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-700 block">{mo.productName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Début : {mo.startDate}</span>
                            </div>
                          </td>

                          {/* Progress */}
                          <td className="p-4">
                            <div className="w-36 mx-auto space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>{mo.quantityProduced} / {mo.quantityToProduce} u</span>
                                <span className="font-bold">{mo.advancement}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    mo.status === 'Terminé' ? 'bg-emerald-500' :
                                    mo.status === 'Rejeté' ? 'bg-rose-500' :
                                    mo.status === 'En attente Douane/Matières' ? 'bg-amber-500' :
                                    'bg-indigo-600'
                                  }`}
                                  style={{ width: `${mo.advancement}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Yield / Scrap */}
                          <td className="p-4 text-right">
                            {mo.status === 'Planifié' || mo.status === 'En attente Douane/Matières' ? (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-emerald-600 font-black font-mono">
                                  {mo.quantityProduced - mo.quantityScrapped} bon(s)
                                </span>
                                <span className="text-rose-500 font-bold font-mono text-[10px] block">
                                  {mo.quantityScrapped} rebuts ({mo.quantityProduced > 0 ? Math.round((mo.quantityScrapped / mo.quantityProduced) * 1000) / 10 : 0}%)
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              mo.status === 'Planifié' ? 'bg-slate-150 text-slate-600 border border-slate-200' :
                              mo.status === 'En attente Douane/Matières' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse' :
                              mo.status === 'En cours' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              mo.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {mo.status}
                            </span>
                          </td>

                          {/* Interactive Simulations */}
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center space-x-1.5">
                              {mo.status !== 'Terminé' && mo.status !== 'Rejeté' && (
                                <button
                                  onClick={() => handleSimulateProgress(mo.id)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center space-x-1 border border-indigo-200"
                                  title={mo.status === 'Planifié' ? "Démarrer l'OF" : "Avancer la production (+30%)"}
                                >
                                  <Activity className="w-3 h-3 animate-pulse" />
                                  <span>{mo.status === 'Planifié' ? "Démarrer" : "+30%"}</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteMO(mo.id, e)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded border border-transparent hover:border-rose-100 cursor-pointer transition-colors"
                                title="Supprimer cet OF"
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
              )}
            </div>

            {/* Quick Details Inspection & Material Reservations Panel */}
            <div className="lg:col-span-4 space-y-6">
              {/* Active Selection Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Inspection Ordre de Fabrication
                  </h4>
                  <p className="text-[10px] text-slate-400">Cliquez sur un OF pour l'analyser</p>
                </div>

                {selectedMO ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono">
                      <span className="font-black text-slate-900">{selectedMO.id}</span>
                      <span className="font-bold text-[10px] text-slate-400">Équipes assignées</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Produit fini ciblé</span>
                      <span className="font-bold text-slate-800 block text-sm">{selectedMO.productName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-medium">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Obj. Production</span>
                        <span className="text-sm font-black text-slate-700">{selectedMO.quantityToProduce.toLocaleString('fr-FR')} u</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Rebuts constatés</span>
                        <span className="text-sm font-black text-rose-600">{selectedMO.quantityScrapped.toLocaleString('fr-FR')} u</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Consommation Estimée des matières premières</span>
                      {/* Look up the associated BOM */}
                      {(() => {
                        const bom = nomenclatures.find(n => n.id === selectedMO.nomenclatureId);
                        if (!bom) return <p className="text-slate-400 italic">Nomenclature introuvable.</p>;
                        return (
                          <div className="space-y-1.5 bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/40">
                            {bom.materials.map(mat => {
                              const totalNeeded = mat.quantityNeeded * selectedMO.quantityToProduce;
                              const cost = totalNeeded * mat.unitCost;
                              return (
                                <div key={mat.id} className="flex justify-between items-center text-[11px] font-medium border-b border-indigo-100/20 pb-1 last:border-0 last:pb-0">
                                  <span className="text-slate-600 font-semibold">{mat.name}</span>
                                  <div className="text-right font-mono font-bold">
                                    <span className="text-indigo-950">{totalNeeded.toLocaleString('fr-FR')} {mat.unit}</span>
                                    <span className="text-[10px] text-slate-400 block">{cost.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Landed Cost & Customs Breakdown Card */}
                    {selectedMO.importFolderId && (() => {
                      const landingInfo = getImportFolderLandingCostInfo(selectedMO.importFolderId);
                      const bom = nomenclatures.find(n => n.id === selectedMO.nomenclatureId);
                      const costBreakdown = bom ? getBOMCostBreakdown(bom, selectedMO.importFolderId) : null;
                      if (!landingInfo) return null;

                      return (
                        <div className="space-y-2 bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 font-sans shadow-xs">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                              <span>📦 Approvisionnement Import & Douane</span>
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              landingInfo.isBlockedInCustoms ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {landingInfo.folder.reference}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block">Fournisseur :</span>
                              <span className="font-bold text-slate-200">{landingInfo.folder.supplierName || 'Importation'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Port d'arrivée :</span>
                              <span className="font-bold text-slate-200">{landingInfo.folder.portOfArrival || 'Radès'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Transitaire :</span>
                              <span className="font-bold text-slate-200">{landingInfo.folder.transitterName}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Statut Douane :</span>
                              <span className={`font-bold ${landingInfo.isBlockedInCustoms ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
                                {landingInfo.customsStatus}
                              </span>
                            </div>
                          </div>

                          {costBreakdown && (
                            <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px]">
                              <div className="flex justify-between text-slate-400">
                                <span>P.R.I direct (hors frais) :</span>
                                <span className="font-mono">{costBreakdown.totalBaseCostPerUnit.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND/u</span>
                              </div>
                              <div className="flex justify-between text-indigo-300 font-bold">
                                <span>Frais d'approche ventilés (+{landingInfo.landedMarkupRatioPercent}%) :</span>
                                <span className="font-mono">+{costBreakdown.landedCostDifference.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND/u</span>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-black text-[11px] pt-1 border-t border-slate-800">
                                <span>Prix de Revient Industriel (P.R.I Ventilé) :</span>
                                <span className="font-mono">{costBreakdown.totalLandedCostPerUnit.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND/u</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {selectedMO.notes && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Journal de Production</span>
                        <p className="text-slate-600 text-[11px] italic leading-relaxed">{selectedMO.notes}</p>
                      </div>
                    )}

                    {selectedMO.status === 'En cours' && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleSimulateProgress(selectedMO.id)}
                          className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <Activity className="w-4 h-4 animate-spin-slow" />
                          <span>Simuler l'avancée de la production (+30%)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Eye className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-[11px] leading-relaxed">Aucun ordre de fabrication sélectionné.<br />Sélectionnez-en un dans le tableau de gauche pour inspecter sa consommation de composants et son avancement.</p>
                  </div>
                )}
              </div>

              {/* Manufacturing Quick Info Tips */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-2 text-xs">
                <span className="font-extrabold text-slate-700 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cahier des Charges Industriel</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Chaque ordre de fabrication réserve automatiquement en stock virtuel les composants de sa nomenclature. En cas de rupture, les alertes de seuil critique du module de gestion de stock s'activent pour initier des demandes d'achat urgentes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: NOMENCLATURES (BOM) */}
        {activeSubTab === 'nomenclatures' && (
          <motion.div
            key="nomenclatures-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* List of NOMENCLATURES */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBOMs.map((bom) => {
                const totalMatCost = calculateBOMMaterialCost(bom);
                const totalCost = calculateBOMTotalCost(bom);
                return (
                  <div key={bom.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-black uppercase px-2 py-0.5 rounded-md border border-slate-150">
                          {bom.category}
                        </span>
                        <button
                          onClick={() => handleDeleteBOM(bom.id)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer transition-colors"
                          title="Supprimer cette nomenclature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Name */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{bom.productName}</h4>
                          {bom.id.startsWith('demo-') ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                              Démo
                            </span>
                          ) : (
                            <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
                              Propre
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">BOM ID : {bom.id}</span>
                      </div>

                      {/* Raw Materials list */}
                      <div className="space-y-2 border-t border-b border-slate-100 py-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Matières premières requises</span>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                          {bom.materials.map((mat) => (
                            <div key={mat.id} className="flex justify-between text-[11px] font-medium border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                              <span className="text-slate-600 font-semibold">{mat.name}</span>
                              <span className="font-mono text-slate-500 font-bold">
                                {mat.quantityNeeded} {mat.unit} <span className="text-slate-300">|</span> {mat.unitCost} TND/{mat.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Info */}
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Temps d'assemblage</span>
                          <span className="font-black text-slate-700">{bom.estimatedTimeMinutes} min / u</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Main d'œuvre directe</span>
                          <span className="font-black text-slate-700 font-mono">{bom.laborCostPerUnit.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Summary Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Coût de Revient Indus.</span>
                        <span className="text-[11px] text-slate-400 block">Mat. {totalMatCost.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-indigo-600 font-mono">
                          {totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase leading-none">par unité produite</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBOMs.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                  <Layers className="w-12 h-12 text-indigo-600 mx-auto opacity-30" />
                  <p className="text-xs font-black text-slate-600">Aucune nomenclature active correspondante dans votre catalogue</p>
                  <p className="text-[11px] text-slate-400">Modifiez votre filtre ou cliquez sur "Créer Nomenclature" en haut à droite.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: OEE (TRS) ATELIER AND PERFORMANCE */}
        {activeSubTab === 'oee' && (
          <motion.div
            key="oee-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* OEE Main indicators row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* TRS Core Metric */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-5">
                  <Gauge className="w-24 h-24 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">TRS - Taux de Rendement Synthétique</span>
                  <p className="text-3xl font-black font-mono text-indigo-950">{oeeMetrics.trs}%</p>
                </div>
                {/* Micro progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${oeeMetrics.trs}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Le TRS global de l'entreprise combine la disponibilité opérationnelle, la vitesse de production et la qualité finale du produit.
                </p>
              </div>

              {/* Disponibilité */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Disponibilité Machines</span>
                  <p className="text-3xl font-black font-mono text-slate-800">{oeeMetrics.dispo}%</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${oeeMetrics.dispo}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Taux d'utilisation effectif des machines par rapport au temps requis théorique (hors pannes critiques ou arrêts d'extrusions).
                </p>
              </div>

              {/* Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Performance de Cadence</span>
                  <p className="text-3xl font-black font-mono text-slate-800">{oeeMetrics.performance}%</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${oeeMetrics.performance}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Vitesse réelle de fabrication par rapport à la cadence standard prévue par la nomenclature (mètres de câble/min).
                </p>
              </div>

              {/* Qualité */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Taux de Qualité</span>
                  <p className="text-3xl font-black font-mono text-emerald-600">{oeeMetrics.qualite}%</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${oeeMetrics.qualite}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Rapport entre le nombre de produits finis conformes commercialisables et le total produit (taux de rebus : {Math.round((oeeMetrics.totalScrapped / (oeeMetrics.totalProduced || 1)) * 1000) / 10}%).
                </p>
              </div>
            </div>

            {/* Industrial Line diagnostics and statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production summary chart & history */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Analyse des Rebuts & Pertes Industrielles
                  </h4>
                  <span className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full font-bold">
                    Norme ISO 9001
                  </span>
                </div>

                <div className="space-y-3 text-xs font-medium">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Total Pièces Produits</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{(oeeMetrics.totalProduced).toLocaleString('fr-FR')} unités</span>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-slate-500 font-semibold block text-[11px]">Dont Rebuts Matières</span>
                      <span className="text-lg font-black text-rose-600 font-mono">{(oeeMetrics.totalScrapped).toLocaleString('fr-FR')} u</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Les rebus en extrusion et injection font l'objet d'un broyage systématique au sein du dépôt de Sfax pour réintégration de matière recyclée à hauteur de 15% dans les cycles secondaires d'injection plastique.
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Performances par ligne (Temps réel)</span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 font-semibold mb-1">
                          <span>Ligne d'extrusion A (Sfax)</span>
                          <span className="text-emerald-600">TRS : 91.2% (Excellent)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '91.2%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 font-semibold mb-1">
                          <span>Ligne Assemblage B (Tunis)</span>
                          <span className="text-indigo-600">TRS : 82.5% (Nominal)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82.5%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance & Quality alerts */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Maintenance Préventive & Étalonnage
                  </h4>
                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                    3 Interventions requises
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <Wrench className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div className="text-xs font-medium text-slate-800 space-y-1">
                      <span className="font-extrabold text-slate-900 block leading-tight">Nettoyage filière de vis d'extrusion - Sfax</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        La pression d'extrusion de la ligne A approche de la limite d'alarme de 120 bars. Nettoyage et maintenance préventive recommandés d'ici 48h.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-amber-50/50 border border-amber-150 rounded-xl">
                    <Hourglass className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs font-medium text-slate-800 space-y-1">
                      <span className="font-extrabold text-slate-900 block leading-tight">Calibration du capteur de tension d'enroulement</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Prévue pour le 30 juin 2026. L'opération nécessite un arrêt planifié de la ligne d'enroulement de Tunis pour une durée de 45 minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs font-medium text-slate-800 space-y-1">
                      <span className="font-extrabold text-slate-900 block leading-tight">Audit Qualité Certification BVQI</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Conformité ISO 9001 validée le 15 juin 2026. Prochain audit de suivi planifié pour décembre 2026.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: CONFIGURATION PARAMÉTRABLE */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Lignes de fabrication */}
            <ProductionConfigCard
              title="Lignes de Fabrication"
              items={productionLines}
              onAdd={(newItem) => {
                if (newItem && !productionLines.includes(newItem)) {
                  saveLines([...productionLines, newItem]);
                }
              }}
              onDelete={(itemToDelete) => {
                if (productionLines.length > 1) {
                  const updated = productionLines.filter(x => x !== itemToDelete);
                  saveLines(updated);
                  if (formAssignedLine === itemToDelete) {
                    setFormAssignedLine(updated[0]);
                  }
                } else {
                  alert("Vous devez garder au moins une ligne de fabrication.");
                }
              }}
              placeholder="Ex: Ligne Extrusion E (Sfax)"
            />

            {/* Équipes de production */}
            <ProductionConfigCard
              title="Équipes de Production"
              items={productionTeams}
              onAdd={(newItem) => {
                if (newItem && !productionTeams.includes(newItem)) {
                  saveTeams([...productionTeams, newItem]);
                }
              }}
              onDelete={(itemToDelete) => {
                if (productionTeams.length > 1) {
                  const updated = productionTeams.filter(x => x !== itemToDelete);
                  saveTeams(updated);
                  if (formAssignedTeam === itemToDelete) {
                    setFormAssignedTeam(updated[0]);
                  }
                } else {
                  alert("Vous devez garder au moins une équipe de production.");
                }
              }}
              placeholder="Ex: Équipe Week-end (Chef : A. Mansour)"
            />

            {/* Catégories de Nomenclature */}
            <ProductionConfigCard
              title="Catégories de Nomenclature"
              items={bomCategories}
              onAdd={(newItem) => {
                if (newItem && !bomCategories.includes(newItem)) {
                  saveCategories([...bomCategories, newItem]);
                }
              }}
              onDelete={(itemToDelete) => {
                if (bomCategories.length > 1) {
                  const updated = bomCategories.filter(x => x !== itemToDelete);
                  saveCategories(updated);
                  if (bomCategory === itemToDelete) {
                    setBomCategory(updated[0]);
                  }
                } else {
                  alert("Vous devez garder au moins une catégorie.");
                }
              }}
              placeholder="Ex: Éclairage LED"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Lancer un OF (Manufacturing Order) --- */}
      <AnimatePresence>
        {isMOFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Cog className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {editingMO ? "Modifier l'Ordre de Fabrication" : "Lancer un nouvel Ordre de Fabrication (OF)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMOFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMO} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Nomenclature à produire :</label>
                  <select
                    value={formNomenclatureId}
                    onChange={(e) => setFormNomenclatureId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    {nomenclatures.map(n => (
                      <option key={n.id} value={n.id}>{n.productName} (BOM: {n.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Quantité cible (unités) :</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={formQtyToProduce}
                      onChange={(e) => setFormQtyToProduce(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Date de début prévue :</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Ligne de fabrication :</label>
                    <select
                      value={formAssignedLine}
                      onChange={(e) => setFormAssignedLine(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      {productionLines.map(line => (
                        <option key={line} value={line}>{line}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Équipe assignée :</label>
                    <select
                      value={formAssignedTeam}
                      onChange={(e) => setFormAssignedTeam(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      {productionTeams.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Dossier d'Importation / Approvisionnement MP (Port & Douane) :</label>
                  <select
                    value={formImportFolderId}
                    onChange={(e) => setFormImportFolderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    <option value="">-- Aucun (Achat local TND sans douane) --</option>
                    {importFolders.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.reference} - {f.supplierName || 'Fournisseur'} ({f.portOfArrival || 'Port Radès'}) [{f.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {formImportFolderId && (() => {
                  const landingInfo = getImportFolderLandingCostInfo(formImportFolderId);
                  if (!landingInfo) return null;
                  return (
                    <div className={`p-3 rounded-xl border text-[11px] font-semibold space-y-1 ${
                      landingInfo.isBlockedInCustoms 
                        ? 'bg-amber-50 text-amber-900 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>{landingInfo.isBlockedInCustoms ? "⚠️ Dossier Bloqué en Douane / Transit" : "✓ Dossier Dédouané & En Stock"}</span>
                        <span className="font-mono">Frais d'approche : +{landingInfo.landedMarkupRatioPercent}%</span>
                      </div>
                      <p className="text-[10px] opacity-80">
                        Port : {landingInfo.folder.portOfArrival || 'Radès'} | Transitaire : {landingInfo.folder.transitterName} | Frais annexes (Douane/Fret/Acconage) : {landingInfo.totalLandingExpensesTND.toLocaleString('fr-FR')} TND
                      </p>
                      {landingInfo.isBlockedInCustoms && (
                        <p className="text-[10px] font-bold italic">
                          Statut douanier actuel : "{landingInfo.customsStatus}". Cet OF sera initié en statut "En attente Douane/Matières".
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-1">
                  <label className="text-slate-500 block">Instructions & Notes particulières :</label>
                  <textarea
                    rows={3}
                    placeholder="Instructions de conditionnement, priorités d'ateliers..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsMOFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer & Lancer l'OF
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Créer Nomenclature (BOM) --- */}
      <AnimatePresence>
        {isBOMFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Créer une nouvelle Nomenclature de fabrication (BOM)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBOMFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNomenclature} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Nom du produit fini :</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Câble blindé"
                      value={bomProductName}
                      onChange={(e) => setBomProductName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Catégorie :</label>
                    <select
                      value={bomCategory}
                      onChange={(e) => setBomCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      {bomCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Temps d'assemblage estimé (minutes/u) :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={bomEstTime}
                      onChange={(e) => setBomEstTime(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Coût MOD directe par unité (TND) :</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      min={0}
                      value={bomLaborCost}
                      onChange={(e) => setBomLaborCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* MATERIALS NESTED ROWS */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-slate-500 block font-bold uppercase">Composants requis (Matières Premières)</label>
                    <button
                      type="button"
                      onClick={handleAddMaterialRow}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black cursor-pointer transition-colors border border-indigo-200"
                    >
                      + Ajouter un composant
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {bomMaterials.map((mat, idx) => (
                      <div key={mat.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            required
                            placeholder="Nom du composant (e.g. PVC, Acier)"
                            value={mat.name}
                            onChange={(e) => handleMaterialChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:border-indigo-500 text-slate-800"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            required
                            step="0.001"
                            placeholder="Qte"
                            value={mat.quantityNeeded}
                            onChange={(e) => handleMaterialChange(idx, 'quantityNeeded', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={mat.unit}
                            onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="u">u (pièce)</option>
                            <option value="m">m</option>
                            <option value="L">L</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            required
                            step="0.001"
                            placeholder="Prix U (TND)"
                            value={mat.unitCost}
                            onChange={(e) => handleMaterialChange(idx, 'unitCost', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            disabled={bomMaterials.length === 1}
                            onClick={() => handleRemoveMaterialRow(idx)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded disabled:opacity-40 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsBOMFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer Nomenclature
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

function ProductionConfigCard({ 
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
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
      <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {items.length} config
        </span>
      </h3>
      <div className="flex space-x-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
        />
        <button
          onClick={() => {
            if (val.trim()) {
              onAdd(val.trim());
              setVal('');
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-black transition-colors shrink-0"
        >
          Ajouter
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-semibold">
            <span className="text-slate-700 truncate mr-2" title={item}>{item}</span>
            <button
              onClick={() => onDelete(item)}
              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

