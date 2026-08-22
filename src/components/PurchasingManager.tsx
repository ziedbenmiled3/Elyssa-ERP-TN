import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Truck, 
  Tag, 
  User, 
  ArrowRight,
  ChevronRight,
  Eye,
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  Scale,
  Award,
  Activity,
  TrendingUp,
  Sparkles,
  Star,
  ShieldAlert,
  Mail,
  AlertTriangle,
  Send,
  Upload,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  Cell
} from 'recharts';

interface PurchaseRequisition {
  id: string;
  itemDescription: string;
  quantityRequested: number;
  unit: string;
  estimatedCost: number; // TND
  requestedBy: string;
  department: string;
  requestDate: string;
  status: 'En attente' | 'Approuvé' | 'Refusé';
  decisionNotes?: string;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  itemDescription: string;
  quantity: number;
  unitCost: number; // HT in TND
  vatRate: number; // 19% standard, 7%, etc.
  fodecActive: boolean; // 1% FODEC (Tunisian local industry tax)
  amountHT: number;
  amountTTC: number;
  orderDate: string;
  deliveryDueDate: string;
  paymentTerms: string; // 60 jours fin de mois, comptant, etc.
  status: 'Brouillon' | 'Envoyé' | 'Reçu conforme' | 'Litige';
  notes?: string;
}

export interface SupplierPerformance {
  id: string;
  name: string;
  category: string;
  totalVolume: number;
  delayRate: number; // Taux de retard en %
  conformityRate: number; // Taux de conformité en %
  score: number; // Note globale 0 - 100
  status: 'Rang A - Excellent' | 'Rang B - Sous surveillance' | 'Rang C - Critique';
}

interface PurchasingManagerProps {
  currentUser: any;
  requisitions?: PurchaseRequisition[];
  onUpdateRequisitions?: (requisitions: PurchaseRequisition[]) => void;
  purchaseOrders?: PurchaseOrder[];
  onUpdatePurchaseOrders?: (purchaseOrders: PurchaseOrder[]) => void;
  suppliers?: SupplierPerformance[];
  onUpdateSuppliers?: (suppliers: SupplierPerformance[]) => void;
  suppliersPerformance?: SupplierPerformance[];
  onUpdateSuppliersPerformance?: (suppliers: SupplierPerformance[]) => void;
  isDemoCompany?: boolean;
}

export default function PurchasingManager({ 
  currentUser,
  requisitions: propRequisitions = [],
  onUpdateRequisitions = () => {},
  purchaseOrders: propPurchaseOrders = [],
  onUpdatePurchaseOrders = () => {},
  suppliers: propSuppliersRaw,
  onUpdateSuppliers: propOnUpdateSuppliers,
  suppliersPerformance,
  onUpdateSuppliersPerformance,
  isDemoCompany = false
}: PurchasingManagerProps) {
  const propSuppliers = propSuppliersRaw || suppliersPerformance || [];
  const onUpdateSuppliers = propOnUpdateSuppliers || onUpdateSuppliersPerformance || (() => {});
  // --- Storage Keys ---
  const REQ_STORAGE_KEY = 'carthage_purchasing_requisitions';
  const PO_STORAGE_KEY = 'carthage_purchasing_orders';
  const SUPPLIER_PERF_KEY = 'carthage_purchasing_suppliers_performance';

  // --- Prepopulated Data ---
  const DEFAULT_REQUISITIONS: PurchaseRequisition[] = [];

  const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [];

  const DEFAULT_SUPPLIERS: SupplierPerformance[] = [];

  const DEMO_PURCHASE_ORDERS: PurchaseOrder[] = [
    {
      id: "demo-po_1",
      supplierName: "Les Ciments de Bizerte",
      itemDescription: "Approvisionnement Ciment CPJ 45 (500 Sacs)",
      quantity: 500,
      unitCost: 11.200,
      vatRate: 19,
      fodecActive: true,
      amountHT: 5600.000,
      amountTTC: 6665.000,
      orderDate: "2026-08-12",
      deliveryDueDate: "2026-08-20",
      paymentTerms: "Chèque à 60 Jours",
      status: "Reçu conforme",
      notes: "500 Sacs Ciment CPJ 45 à 11.200 TND HT = 5 600,000 TND HT | 6 665,000 TND TTC"
    },
    {
      id: "demo-po_2",
      supplierName: "EL FOULADH Menzel Bourguiba",
      itemDescription: "Réapprovisionnement Rond à béton Ø12mm (200 Barres)",
      quantity: 200,
      unitCost: 21.000,
      vatRate: 19,
      fodecActive: true,
      amountHT: 4200.000,
      amountTTC: 4999.000,
      orderDate: "2026-08-14",
      deliveryDueDate: "2026-08-25",
      paymentTerms: "Traite 90 Jours",
      status: "Envoyé",
      notes: "200 Barres Rond à béton Ø12mm à 21.000 TND HT = 4 200,000 TND HT | 4 999,000 TND TTC"
    },
    {
      id: "demo-po_import",
      supplierName: "Marseille Chimie & Outillage SAS",
      itemDescription: "Matières premières & Outillage haute résistance (Dossier IMP-RADES-2026-081)",
      quantity: 500,
      unitCost: 94.000,
      vatRate: 19,
      fodecActive: false,
      amountHT: 47000.000,
      amountTTC: 55917.000,
      orderDate: "2026-08-01",
      deliveryDueDate: "2026-08-28",
      paymentTerms: "Crédoc BIAT (L/C Confirmée)",
      status: "Envoyé",
      notes: "Commande Import liée au dossier douane IMP-RADES-2026-081 et Crédoc BIAT = 55 917,000 TND TTC"
    }
  ];

  // --- States & Proxies ---
  const requisitions = propRequisitions;
  const setRequisitions = (val: any) => {
    if (typeof val === 'function') {
      onUpdateRequisitions(val(requisitions));
    } else {
      onUpdateRequisitions(val);
    }
  };

  const rawPurchaseOrders = (Array.isArray(propPurchaseOrders) && propPurchaseOrders.length > 0)
    ? propPurchaseOrders
    : (isDemoCompany ? DEMO_PURCHASE_ORDERS : []);

  const purchaseOrders: PurchaseOrder[] = useMemo(() => {
    return rawPurchaseOrders.map((po: any) => {
      if (isDemoCompany) {
        if (po.id === 'demo-po_1' || (String(po.supplierName || '').includes('Ciments de Bizerte') && String(po.id || '').startsWith('demo-'))) {
          return {
            ...po,
            id: 'demo-po_1',
            supplierName: 'Les Ciments de Bizerte',
            itemDescription: 'Approvisionnement Ciment CPJ 45 (500 Sacs)',
            quantity: 500,
            unitCost: 11.200,
            vatRate: 19,
            fodecActive: true,
            amountHT: 5600.000,
            amountTTC: 6665.000,
            totalAmount: 6665.000,
            status: po.status || 'Reçu conforme',
            orderDate: po.orderDate || '2026-08-12',
            deliveryDueDate: po.deliveryDueDate || '2026-08-20',
            paymentTerms: po.paymentTerms || 'Chèque à 60 Jours',
            notes: '500 Sacs Ciment CPJ 45 à 11.200 TND HT = 5 600,000 TND HT | 6 665,000 TND TTC'
          };
        }
        if (po.id === 'demo-po_2' || (String(po.supplierName || '').includes('EL FOULADH') && String(po.id || '').startsWith('demo-'))) {
          return {
            ...po,
            id: 'demo-po_2',
            supplierName: 'EL FOULADH Menzel Bourguiba',
            itemDescription: 'Réapprovisionnement Rond à béton Ø12mm (200 Barres)',
            quantity: 200,
            unitCost: 21.000,
            vatRate: 19,
            fodecActive: true,
            amountHT: 4200.000,
            amountTTC: 4999.000,
            totalAmount: 4999.000,
            status: po.status || 'Envoyé',
            orderDate: po.orderDate || '2026-08-14',
            deliveryDueDate: po.deliveryDueDate || '2026-08-25',
            paymentTerms: po.paymentTerms || 'Traite 90 Jours',
            notes: '200 Barres Rond à béton Ø12mm à 21.000 TND HT = 4 200,000 TND HT | 4 999,000 TND TTC'
          };
        }
        if (po.id === 'demo-po_import' || (String(po.supplierName || '').includes('Marseille Chimie') && String(po.id || '').startsWith('demo-'))) {
          return {
            ...po,
            id: 'demo-po_import',
            supplierName: 'Marseille Chimie & Outillage SAS',
            itemDescription: 'Matières premières & Outillage haute résistance (Dossier IMP-RADES-2026-081)',
            quantity: 500,
            unitCost: 94.000,
            vatRate: 19,
            fodecActive: false,
            amountHT: 47000.000,
            amountTTC: 55917.000,
            totalAmount: 55917.000,
            status: po.status || 'Envoyé',
            orderDate: po.orderDate || '2026-08-01',
            deliveryDueDate: po.deliveryDueDate || '2026-08-28',
            paymentTerms: po.paymentTerms || 'Crédoc BIAT (L/C Confirmée)',
            notes: 'Commande Import liée au dossier douane IMP-RADES-2026-081 et Crédoc BIAT = 55 917,000 TND TTC'
          };
        }
      }
      return po;
    });
  }, [rawPurchaseOrders, isDemoCompany]);

  const setPurchaseOrders = (val: any) => {
    if (typeof val === 'function') {
      onUpdatePurchaseOrders(val(purchaseOrders));
    } else {
      onUpdatePurchaseOrders(val);
    }
  };

  const DEMO_SUPPLIERS: SupplierPerformance[] = [
    {
      id: "demo-sup_1",
      name: "SOPAL Tunisie",
      category: "Plomberie & Robinetterie Industrielle",
      totalVolume: 48500,
      delayRate: 4.5,
      conformityRate: 98.2,
      score: 93,
      status: "Rang A - Excellent"
    },
    {
      id: "demo-sup_2",
      name: "Les Ciments de Bizerte",
      category: "Matériaux de Construction & Liants",
      totalVolume: 82000,
      delayRate: 18.5,
      conformityRate: 92.0,
      score: 70,
      status: "Rang C - Critique"
    },
    {
      id: "demo-sup_3",
      name: "EL FOULADH Menzel Bourguiba",
      category: "Métallurgie & Aciers FeE500",
      totalVolume: 64200,
      delayRate: 8.0,
      conformityRate: 95.5,
      score: 86,
      status: "Rang B - Sous surveillance"
    }
  ];

  const rawSuppliersList = (Array.isArray(propSuppliersRaw) && propSuppliersRaw.length > 0)
    ? propSuppliersRaw
    : (Array.isArray(suppliersPerformance) && suppliersPerformance.length > 0)
      ? suppliersPerformance
      : (isDemoCompany ? DEMO_SUPPLIERS : []);

  const suppliers: SupplierPerformance[] = useMemo(() => {
    return (rawSuppliersList || []).map((s: any, idx: number) => {
      const name = String(s?.name || s?.supplierName || s?.supplier || `Fournisseur ${idx + 1}`);
      const category = String(s?.category || 'Matières Premières');
      const delayRate = typeof s?.delayRate === 'number' ? s.delayRate : Number(s?.delayRate || 0);
      const conformityRate = typeof s?.conformityRate === 'number' 
        ? s.conformityRate 
        : (s?.nonConformityRate !== undefined ? Math.max(0, 100 - Number(s.nonConformityRate || 0)) : (Number(s?.score) || 95));
      const score = typeof s?.score === 'number' 
        ? s.score 
        : Math.max(0, Math.min(100, Math.round(conformityRate - (delayRate * 1.2))));
      let status: SupplierPerformance['status'] = s?.status;
      if (!status || !['Rang A - Excellent', 'Rang B - Sous surveillance', 'Rang C - Critique'].includes(status)) {
        if (score >= 90) status = 'Rang A - Excellent';
        else if (score >= 75) status = 'Rang B - Sous surveillance';
        else status = 'Rang C - Critique';
      }
      const totalVolume = typeof s?.totalVolume === 'number' ? s.totalVolume : (Number(s?.volume || s?.amount || 0) || 0);
      return {
        id: String(s?.id || `SUP-${String(idx + 1).padStart(3, '0')}`),
        name,
        category,
        totalVolume,
        delayRate,
        conformityRate,
        score,
        status
      };
    });
  }, [rawSuppliersList]);

  const setSuppliers = (val: any) => {
    if (typeof val === 'function') {
      onUpdateSuppliers(val(suppliers));
    } else {
      onUpdateSuppliers(val);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'bc' | 'da' | 'suppliers' | 'settings'>('bc');

  // Supplier evaluation modal states
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPerformance | null>(null);
  const [supFormName, setSupFormName] = useState('');
  const [supFormCategory, setSupFormCategory] = useState('');
  const [supFormVolume, setSupFormVolume] = useState(0);
  const [supFormDelay, setSupFormDelay] = useState(0);
  const [supFormConformity, setSupFormConformity] = useState(100);

  // Email alert and Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSup, setEmailSup] = useState<SupplierPerformance | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Configurable states
  const [fodecRate, setFodecRate] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_purchasing_fodec_rate');
    return saved ? Number(saved) : 1.0;
  });
  const [approvalThreshold, setApprovalThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_purchasing_approval_threshold');
    return saved ? Number(saved) : 5000.0;
  });
  const [stampDutyValue, setStampDutyValue] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_purchasing_stamp_duty');
    return saved ? Number(saved) : 1.0;
  });

  const updateFodecRate = (rate: number) => {
    setFodecRate(rate);
    localStorage.setItem('carthage_purchasing_fodec_rate', String(rate));
  };
  const updateApprovalThreshold = (val: number) => {
    setApprovalThreshold(val);
    localStorage.setItem('carthage_purchasing_approval_threshold', String(val));
  };
  const updateStampDuty = (val: number) => {
    setStampDutyValue(val);
    localStorage.setItem('carthage_purchasing_stamp_duty', String(val));
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [poFilter, setPoFilter] = useState<'Tous' | 'Brouillon' | 'Envoyé' | 'Reçu conforme' | 'Litige'>('Tous');

  // Requisitions selection/action state
  const [selectedDA, setSelectedDA] = useState<PurchaseRequisition | null>(null);
  const [daDecisionNotes, setDaDecisionNotes] = useState('');

  // Form State - BC (Bons de Commande)
  const [isBCFormOpen, setIsBCFormOpen] = useState(false);
  const [editingBC, setEditingBC] = useState<PurchaseOrder | null>(null);
  const [formSupplier, setFormSupplier] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formQty, setFormQty] = useState(100);
  const [formUnitCost, setFormUnitCost] = useState(10.0);
  const [formVatRate, setFormVatRate] = useState(19);
  const [formFodec, setFormFodec] = useState(true);
  const [formDelivDate, setFormDelivDate] = useState('');
  const [formPayTerms, setFormPayTerms] = useState('Chèque à 60 Jours');
  const [formNotes, setFormNotes] = useState('');

  // OCR state variables for pre-filling Bons de Commande
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{
    supplier: string;
    invoiceNumber?: string;
    date?: string;
    amountHT?: number;
    amountTVA?: number;
    taxStamp?: number;
    amountTTC?: number;
    currency?: string;
    description?: string;
    confidence?: number;
  } | null>(null);

  const handleBcFileOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1.8 * 1024 * 1024) {
        setOcrError("Fichier trop volumineux. La taille maximale pour le stockage local est de 1.8 Mo.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setIsOcrLoading(true);
        setOcrError(null);
        setOcrResult(null);
        
        try {
          let customHeaders: any = {
            'Content-Type': 'application/json'
          };
          const adminSettingsRaw = localStorage.getItem('elyssa_admin_settings');
          if (adminSettingsRaw) {
            try {
              const parsed = JSON.parse(adminSettingsRaw);
              if (parsed.geminiApiKey) {
                customHeaders['x-gemini-key'] = parsed.geminiApiKey;
              }
            } catch (_) {}
          }

          const res = await fetch('/api/gemini/ocr', {
            method: 'POST',
            headers: customHeaders,
            body: JSON.stringify({
              base64Data: base64,
              mimeType: file.type,
              fileName: file.name
            })
          });

          if (!res.ok) {
            throw new Error(`La requête de traitement OCR a échoué avec le statut ${res.status}`);
          }

          const data = await res.json();
          if (data.success && data.data) {
            const extracted = data.data;
            setOcrResult(extracted);
            
            // Map supplier name with existing supplier names if possible
            const extSupStr = String(extracted?.supplier || '').toLowerCase();
            const matchedSup = suppliers.find(s => {
              const sNameStr = String(s?.name || '').toLowerCase();
              return sNameStr && extSupStr && (sNameStr.includes(extSupStr) || extSupStr.includes(sNameStr));
            });
            
            if (matchedSup) {
              setFormSupplier(matchedSup.name);
            } else {
              const extUpper = String(extracted?.supplier || '').toUpperCase();
              if (extUpper.includes("SOTUMETAL")) {
                setFormSupplier("SOTUMETAL S.A. (Tunis)");
              } else if (extUpper.includes("PLASTIQUE")) {
                setFormSupplier("TUNISIE PLASTIQUES S.A.");
              } else if (extUpper.includes("MED")) {
                setFormSupplier("COMPOSANTS ÉLECTRIQUES MED");
              } else {
                setFormSupplier("");
              }
            }

            if (extracted.description) {
              setFormDesc(extracted.description);
            } else {
              setFormDesc(`Achat composants réf ${extracted.invoiceNumber || 'Facture OCR'}`);
            }

            setFormQty(1);
            setFormUnitCost(extracted.amountHT || 0);
            
            if (extracted.amountHT && extracted.amountTVA) {
              const calculatedRate = Math.round((extracted.amountTVA / extracted.amountHT) * 100);
              if (calculatedRate >= 18 && calculatedRate <= 20) setFormVatRate(19);
              else if (calculatedRate >= 12 && calculatedRate <= 14) setFormVatRate(13);
              else if (calculatedRate >= 6 && calculatedRate <= 8) setFormVatRate(7);
              else setFormVatRate(19);
            } else {
              setFormVatRate(19);
            }

            if (extracted.date) {
              setFormDelivDate(extracted.date);
            }
            
            const details = `[Extraction OCR Elyssa] \n` +
              `Fournisseur identifié : ${extracted.supplier}\n` +
              `N° de facture/devis original : ${extracted.invoiceNumber || 'Non spécifié'}\n` +
              `Total HT extrait : ${(extracted.amountHT || 0).toFixed(3)} DT\n` +
              `Total TVA extrait : ${(extracted.amountTVA || 0).toFixed(3)} DT\n` +
              `Timbre Fiscal extrait : ${(extracted.taxStamp || 1.000).toFixed(3)} DT\n` +
              `Total TTC extrait : ${(extracted.amountTTC || 0).toFixed(3)} DT\n` +
              `Confiance de l'IA : ${Math.round((extracted.confidence || 0.95) * 100)}%`;
              
            setFormNotes(details);
            setToastMessage("Le Bon de Commande a été pré-rempli automatiquement avec les données lues !");
          } else {
            throw new Error(data.error || "Une erreur inattendue est survenue durant l'extraction.");
          }
        } catch (err: any) {
          console.error("Purchasing OCR error:", err);
          setOcrError(err.message || String(err));
        } finally {
          setIsOcrLoading(false);
        }
      };
      reader.onerror = () => {
        setOcrError("Erreur lors de la lecture physique du fichier.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Form State - DA (Demandes d'Achat)
  const [isDAFormOpen, setIsDAFormOpen] = useState(false);
  const [daDesc, setDaDesc] = useState('');
  const [daQty, setDaQty] = useState(10);
  const [daUnit, setDaUnit] = useState('u');
  const [daCost, setDaCost] = useState(500);

  // Selected Inspect BC
  const [selectedBC, setSelectedBC] = useState<PurchaseOrder | null>(null);

  // --- Load / Save ---
  useEffect(() => {
    if (isDemoCompany && purchaseOrders.length === 0) {
      const savedPOs = localStorage.getItem(PO_STORAGE_KEY);
      if (savedPOs) {
        try {
          const parsed = JSON.parse(savedPOs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdatePurchaseOrders(parsed);
            return;
          }
        } catch (_) {}
      }
      onUpdatePurchaseOrders(DEMO_PURCHASE_ORDERS);
      localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(DEMO_PURCHASE_ORDERS));
    }
  }, [isDemoCompany]);

  const saveReqsToStorage = (updated: PurchaseRequisition[]) => {
    onUpdateRequisitions(updated);
    localStorage.setItem(REQ_STORAGE_KEY, JSON.stringify(updated));
  };

  const savePOsToStorage = (updated: PurchaseOrder[]) => {
    onUpdatePurchaseOrders(updated);
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(updated));
  };

  const saveSuppliersToStorage = (updated: SupplierPerformance[]) => {
    onUpdateSuppliers(updated);
    localStorage.setItem(SUPPLIER_PERF_KEY, JSON.stringify(updated));
  };

  // --- Calculations ---
  const calculateTTC = (ht: number, vatRate: number, hasFodec: boolean) => {
    // Tunisian Taxation logic:
    // 1. Base HT
    // 2. FODEC = fodecRate% of HT (if active)
    // 3. Base after FODEC = HT + FODEC
    // 4. VAT = Base after FODEC * vatRate%
    // 5. Total = Base after FODEC + VAT + stampDutyValue TND Timbre fiscal (stamp tax for invoices)
    const fodec = hasFodec ? ht * (fodecRate / 100) : 0;
    const baseWithFodec = ht + fodec;
    const vat = baseWithFodec * (vatRate / 100);
    const stamp = stampDutyValue; // Standard Tunisian invoice physical stamp
    return baseWithFodec + vat + stamp;
  };

  const isDemoBC = (po: any) => {
    return isDemoCompany && (po?.id?.startsWith('demo-') || po?.is_demo === true || po?.isDemo === true || ['BC-2026-001', 'BC-2026-002', 'BC-2026-003'].includes(po?.id));
  };

  const filteredBCs = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (purchaseOrders || []).filter(po => {
      if (!po) return false;
      const supplierName = String(po.supplierName || '').toLowerCase();
      const id = String(po.id || '').toLowerCase();
      const itemDescription = String(po.itemDescription || '').toLowerCase();
      const matchesSearch = !q || supplierName.includes(q) || id.includes(q) || itemDescription.includes(q);
      const matchesStatus = poFilter === 'Tous' || po.status === poFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, poFilter]);

  const filteredDAs = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (requisitions || []).filter(da => {
      if (!da) return false;
      const itemDescription = String(da.itemDescription || '').toLowerCase();
      const id = String(da.id || '').toLowerCase();
      const requestedBy = String(da.requestedBy || '').toLowerCase();
      return !q || itemDescription.includes(q) || id.includes(q) || requestedBy.includes(q);
    });
  }, [requisitions, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (suppliers || []).filter(s => {
      if (!s) return false;
      const name = String(s.name || '').toLowerCase();
      const category = String(s.category || '').toLowerCase();
      return !q || name.includes(q) || category.includes(q);
    });
  }, [suppliers, searchQuery]);

  const purchasingStats = useMemo(() => {
    let totalSpentTND = 0;
    let pendingApprovalsCount = requisitions.filter(r => r.status === 'En attente').length;
    let activeDisputesCount = purchaseOrders.filter(p => p.status === 'Litige').length;

    purchaseOrders.forEach(po => {
      if (po.status === 'Reçu conforme' || po.status === 'Envoyé') {
        totalSpentTND += po.amountTTC;
      }
    });

    return {
      totalSpentTND,
      pendingApprovalsCount,
      activeDisputesCount,
      totalOrdersCount: purchaseOrders.length
    };
  }, [purchaseOrders, requisitions]);

  // --- Handlers ---
  const handleOpenNewBC = () => {
    setEditingBC(null);
    setFormSupplier('');
    setFormDesc('');
    setFormQty(100);
    setFormUnitCost(5.0);
    setFormVatRate(19);
    setFormFodec(true);
    setFormDelivDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // +10 days
    setFormPayTerms('Chèque à 60 Jours fin de mois');
    setFormNotes('');
    setOcrResult(null);
    setOcrError(null);
    setIsOcrLoading(false);
    setIsBCFormOpen(true);
  };

  const handleSaveBC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplier || !formDesc) {
      alert("Veuillez remplir les champs obligatoires (Fournisseur, Description).");
      return;
    }

    const amountHT = Number(formQty) * Number(formUnitCost);
    const amountTTC = calculateTTC(amountHT, Number(formVatRate), formFodec);

    if (editingBC) {
      const updated = purchaseOrders.map(po => {
        if (po.id === editingBC.id) {
          return {
            ...po,
            supplierName: formSupplier,
            itemDescription: formDesc,
            quantity: Number(formQty),
            unitCost: Number(formUnitCost),
            vatRate: Number(formVatRate),
            fodecActive: formFodec,
            amountHT,
            amountTTC,
            deliveryDueDate: formDelivDate,
            paymentTerms: formPayTerms,
            notes: formNotes
          };
        }
        return po;
      });
      savePOsToStorage(updated);
    } else {
      const newBC: PurchaseOrder = {
        id: `BC-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        supplierName: formSupplier,
        itemDescription: formDesc,
        quantity: Number(formQty),
        unitCost: Number(formUnitCost),
        vatRate: Number(formVatRate),
        fodecActive: formFodec,
        amountHT,
        amountTTC,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDueDate: formDelivDate,
        paymentTerms: formPayTerms,
        status: 'Brouillon',
        notes: formNotes
      };
      savePOsToStorage([newBC, ...purchaseOrders]);
    }
    setIsBCFormOpen(false);
  };

  const handleUpdateBCStatus = (poId: string, nextStatus: PurchaseOrder['status']) => {
    const updated = purchaseOrders.map(po => {
      if (po.id === poId) {
        return { ...po, status: nextStatus };
      }
      return po;
    });
    savePOsToStorage(updated);
    const synced = updated.find(p => p.id === poId);
    if (synced && selectedBC) {
      setSelectedBC(synced);
    }
  };

  const handleDeleteBC = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de commande ?")) {
      const updated = purchaseOrders.filter(po => po.id !== id);
      savePOsToStorage(updated);
      if (selectedBC?.id === id) {
        setSelectedBC(null);
      }
    }
  };

  // --- Requisition Handlers ---
  const handleSaveDA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!daDesc) return;

    const isAutoApproved = Number(daCost) <= approvalThreshold;
    const newDA: PurchaseRequisition = {
      id: `DA-2026-${String(requisitions.length + 1).padStart(3, '0')}`,
      itemDescription: daDesc,
      quantityRequested: Number(daQty),
      unit: daQty > 1 ? daUnit : 'u',
      estimatedCost: Number(daCost),
      requestedBy: currentUser?.name || 'Collaborateur',
      department: currentUser?.role || 'Achat',
      requestDate: new Date().toISOString().split('T')[0],
      status: isAutoApproved ? 'Approuvé' : 'En attente',
      decisionNotes: isAutoApproved ? 'Approbation automatique (Budget inférieur au seuil de validation)' : undefined
    };

    saveReqsToStorage([newDA, ...requisitions]);
    setIsDAFormOpen(false);
    setDaDesc('');
    setDaQty(10);
    setDaUnit('u');
    setDaCost(500);
  };

  const handleDecisionDA = (daId: string, isApproved: boolean) => {
    const updated = requisitions.map(r => {
      if (r.id === daId) {
        return {
          ...r,
          status: (isApproved ? 'Approuvé' : 'Refusé') as any,
          decisionNotes: daDecisionNotes || (isApproved ? 'Validé pour commande.' : 'Refusé pour motif budgétaire.')
        };
      }
      return r;
    });
    saveReqsToStorage(updated);
    setSelectedDA(null);
    setDaDecisionNotes('');
  };

  const exportPurchasesToCSV = () => {
    const headers = 'ID,Fournisseur,Article,Quantité,Prix U HT,TVA,FODEC,Total HT,Total TTC,Date Commande,Echeance Livraison,Paiement,Statut\n';
    const rows = purchaseOrders.map(po => 
      `"${po.id}","${po.supplierName}","${po.itemDescription}",${po.quantity},${po.unitCost},${po.vatRate}%,${po.fodecActive ? '1%' : '0%'},${po.amountHT},${po.amountTTC},"${po.orderDate}","${po.deliveryDueDate}","${po.paymentTerms}","${po.status}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `elyssa_achats_bc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupFormName('');
    setSupFormCategory('');
    setSupFormVolume(5000);
    setSupFormDelay(5);
    setSupFormConformity(98);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: SupplierPerformance) => {
    setEditingSupplier(supplier);
    setSupFormName(supplier.name);
    setSupFormCategory(supplier.category);
    setSupFormVolume(supplier.totalVolume);
    setSupFormDelay(supplier.delayRate);
    setSupFormConformity(supplier.conformityRate);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supFormName || !supFormCategory) return;

    // Score: conformityRate - delayRate * 1.2
    const calculatedScore = Math.max(0, Math.min(100, Math.round(Number(supFormConformity) - (Number(supFormDelay) * 1.2))));
    let calculatedStatus: SupplierPerformance['status'] = 'Rang C - Critique';
    if (calculatedScore >= 90) {
      calculatedStatus = 'Rang A - Excellent';
    } else if (calculatedScore >= 75) {
      calculatedStatus = 'Rang B - Sous surveillance';
    }

    if (editingSupplier) {
      const updated = suppliers.map(s => {
        if (s.id === editingSupplier.id) {
          return {
            ...s,
            name: supFormName,
            category: supFormCategory,
            totalVolume: Number(supFormVolume),
            delayRate: Number(supFormDelay),
            conformityRate: Number(supFormConformity),
            score: calculatedScore,
            status: calculatedStatus
          };
        }
        return s;
      });
      saveSuppliersToStorage(updated);
    } else {
      const newSupplier: SupplierPerformance = {
        id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: supFormName,
        category: supFormCategory,
        totalVolume: Number(supFormVolume),
        delayRate: Number(supFormDelay),
        conformityRate: Number(supFormConformity),
        score: calculatedScore,
        status: calculatedStatus
      };
      saveSuppliersToStorage([...suppliers, newSupplier]);
    }

    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer l'évaluation de ce fournisseur ?")) {
      const updated = suppliers.filter(s => s.id !== id);
      saveSuppliersToStorage(updated);
    }
  };

  const handleInitiateEmail = (sup: SupplierPerformance, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmailSup(sup);
    setEmailSubject(`Rappel Elyssa ERP - Alerte Retard de Livraison: ${sup.name}`);
    setEmailBody(
      `Bonjour l'équipe de ${sup.name},\n\n` +
      `Nous constatons sur notre tableau de bord de performance fournisseur Elyssa ERP que votre taux de retard de livraison s'élève actuellement à ${sup.delayRate}%.\n` +
      `Ce taux dépasse le seuil critique autorisé de 15%.\n\n` +
      `Cette situation perturbe nos lignes de production. Nous vous demandons instamment de prendre des mesures correctives immédiates pour améliorer vos délais de livraison.\n\n` +
      `Notre équipe d'approvisionnement reste à votre disposition pour faire un point téléphonique d'évaluation de la qualité (votre taux de conformité actuel est de ${sup.conformityRate}%).\n\n` +
      `Cordialement,\n` +
      `Le Service des Approvisionnements\n` +
      `Elyssa ERP / Elyssa Manufacturing`
    );
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSup) return;

    // Simulate sending email
    setToastMessage(`E-mail de relance de conformité envoyé avec succès à ${emailSup.name} !`);
    setIsEmailModalOpen(false);

    // Auto clear toast after 4 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 text-slate-800" id="purchasing-module">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[9999] max-w-sm bg-slate-900 border border-emerald-550/40 text-white rounded-2xl p-4 shadow-2xl flex items-center space-x-3.5"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Notification Système</span>
              <p className="text-xs text-slate-200 leading-normal font-semibold">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs font-bold font-mono pl-1 cursor-pointer">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <ShoppingCart className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-550/20 border border-emerald-550/40 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Achats & Approvisionnements</span>
              <h2 className="text-2xl font-black tracking-tight">Elyssa Procurement Ledger</h2>
            </div>
          </div>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Coordonnez vos demandes d'achat (DA) internes, émettez vos Bons de Commande (BC) avec calcul des taxes tunisiennes (TVA, FODEC, Timbre fiscal) et gérez la conformité des réceptions de matières premières.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Global d'Achats</span>
            <p className="text-2xl font-black text-slate-800 font-mono">
              {(purchasingStats?.totalSpentTND ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bons de Commande Émis</span>
            <p className="text-2xl font-black text-slate-800 font-mono">{purchasingStats.totalOrdersCount} BC</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Demandes d'Achat en attente</span>
            <p className="text-2xl font-black text-amber-600 font-mono">{purchasingStats.pendingApprovalsCount} DA</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Litiges Fournisseurs actifs</span>
            <p className="text-2xl font-black text-rose-600 font-mono">{purchasingStats.activeDisputesCount} Litiges</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('bc')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'bc' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Bons de Commande ({purchaseOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('da')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'da' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Demandes d'Achat Interne ({requisitions.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'suppliers' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Évaluation Fournisseurs</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuration Achat</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {activeSubTab === 'bc' && (
            <>
              <button
                onClick={exportPurchasesToCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                title="Exporter l'historique des achats"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-650" />
                <span>Exporter CSV</span>
              </button>
              <button
                onClick={handleOpenNewBC}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau BC</span>
              </button>
            </>
          )}

          {activeSubTab === 'da' && (
            <button
              onClick={() => setIsDAFormOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Soumettre une DA</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Panels */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: BONS DE COMMANDE (BC) */}
        {activeSubTab === 'bc' && (
          <motion.div
            key="bc-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Filters */}
            <div className="lg:col-span-12 flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par fournisseur, ID de commande, composant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0 w-full sm:w-auto">
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Statut :</span>
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {(['Tous', 'Brouillon', 'Envoyé', 'Reçu conforme', 'Litige'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPoFilter(st)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          poFilter === st ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BC Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-slate-500" />
                  <span>Registre Général des Achats ({filteredBCs.length} Bons)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  Bons de Commande Fournisseur
                </span>
              </div>

              {filteredBCs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-xs font-black text-slate-600">Aucun bon de commande trouvé</p>
                  <p className="text-[11px] text-slate-400">Lancez une nouvelle commande fournisseur pour approvisionner vos ateliers.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200">
                        <th className="p-4 font-extrabold">Réf BC & Date</th>
                        <th className="p-4 font-extrabold">Fournisseur</th>
                        <th className="p-4 font-extrabold">Composants commandés</th>
                        <th className="p-4 font-extrabold text-right">Valorisation TTC</th>
                        <th className="p-4 font-extrabold text-center">Statut</th>
                        <th className="p-4 font-extrabold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredBCs.map((po) => (
                        <tr
                          key={po.id}
                          onClick={() => setSelectedBC(po)}
                          className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${selectedBC?.id === po.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                        >
                          {/* ID & Date */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 block font-mono">{po.id}</span>
                                {isDemoBC(po) ? (
                                  <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                                ) : (
                                  <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{po.orderDate}</span>
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="p-4">
                            <span className="font-bold text-slate-700 block">{po.supplierName}</span>
                          </td>

                          {/* Component / Qty */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-600 block">{po.itemDescription}</span>
                              <span className="text-[10px] text-slate-400">Qté : {(po.quantity ?? 0).toLocaleString('fr-FR')} unités</span>
                            </div>
                          </td>

                          {/* Valuation */}
                          <td className="p-4 text-right">
                            <div className="space-y-0.5">
                              <span className="text-slate-950 font-black font-mono">
                                {(po.amountTTC ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono block">
                                HT : {(po.amountHT ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              po.status === 'Brouillon' ? 'bg-slate-150 text-slate-500 border border-slate-200' :
                              po.status === 'Envoyé' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              po.status === 'Reçu conforme' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {po.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center space-x-1">
                              {po.status === 'Brouillon' && (
                                <button
                                  onClick={() => handleUpdateBCStatus(po.id, 'Envoyé')}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black cursor-pointer transition-colors border border-indigo-150"
                                >
                                  Envoyer
                                </button>
                              )}
                              {po.status === 'Envoyé' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleUpdateBCStatus(po.id, 'Reçu conforme')}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded text-[10px] font-black cursor-pointer transition-colors border border-emerald-150"
                                    title="Réceptionner la commande"
                                  >
                                    Reçu
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBCStatus(po.id, 'Litige')}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-black cursor-pointer transition-colors border border-rose-150"
                                    title="Déclarer un litige de livraison"
                                  >
                                    Litige
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={e => handleDeleteBC(po.id, e)}
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
              )}
            </div>

            {/* Side Inspection Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Inspection Bon de Commande
                  </h4>
                  <p className="text-[10px] text-slate-400">Inspectez la conformité de vos transactions</p>
                </div>

                {selectedBC ? (
                  <div className="space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono text-slate-900 font-bold">
                      <span>{selectedBC.id}</span>
                      <span className="text-[10px] text-slate-400">Date : {selectedBC.orderDate}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Fournisseur institutionnel</span>
                      <span className="font-extrabold text-slate-800 text-sm block">{selectedBC.supplierName}</span>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Montant HT :</span>
                        <span className="font-bold text-slate-800">{(selectedBC.amountHT ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/50 pb-1.5 mb-1.5">
                        <span className="text-slate-500">Taux TVA appliqué :</span>
                        <span className="font-bold text-slate-800">{selectedBC.vatRate}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Taxe FODEC (1%) :</span>
                        <span className="font-bold text-slate-800">{selectedBC.fodecActive ? 'Active' : 'Exonérée'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] border-b border-slate-200/50 pb-1.5 mb-1.5">
                        <span className="text-slate-500">Timbre Fiscal :</span>
                        <span className="font-bold text-slate-800">1.000 TND</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-indigo-650">
                        <span>VALEUR TOTAL TTC :</span>
                        <span>{(selectedBC.amountTTC ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-indigo-50/20 p-2.5 border border-indigo-100/50 rounded-lg">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Échéance de livraison</span>
                        <span className="font-bold text-slate-700">{selectedBC.deliveryDueDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Conditions paiement</span>
                        <span className="font-bold text-slate-700">{selectedBC.paymentTerms}</span>
                      </div>
                    </div>

                    {selectedBC.notes && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 italic text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cahier d'instructions</span>
                        {selectedBC.notes}
                      </div>
                    )}

                    {selectedBC.status === 'Envoyé' && (
                      <div className="space-y-1.5 pt-2">
                        <button
                          onClick={() => handleUpdateBCStatus(selectedBC.id, 'Reçu conforme')}
                          className="w-full flex items-center justify-center space-x-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Réceptionner sans réserves (Conforme)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-[11px] leading-relaxed">Aucun bon de commande sélectionné.<br />Sélectionnez un bon pour afficher le détail comptable complet de la fiscalité locale.</p>
                  </div>
                )}
              </div>

              {/* Taxation Tips Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-indigo-650" />
                  <span>Fiscalité des Achats - Tunisie</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Le **FODEC** (Fonds de Développement de la Compétitivité Industrielle) est une taxe de **1%** appliquée sur les importations et ventes de produits manufacturés locaux. Le **Timbre Fiscal** physique de **1.000 TND** est obligatoire sur toute facture commerciale émise en Tunisie.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: DEMANDES D'ACHAT INTERNES (DA) */}
        {activeSubTab === 'da' && (
          <motion.div
            key="da-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* DA Requisitions List */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Demandes d'Achats Internes ({filteredDAs.length} Demandes)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Awaiting Corporate Approval</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDAs.map((da) => (
                  <div
                    key={da.id}
                    onClick={() => {
                      setSelectedDA(da);
                      setDaDecisionNotes(da.decisionNotes || '');
                    }}
                    className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-indigo-50/15 cursor-pointer transition-colors ${selectedDA?.id === da.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-extrabold text-slate-900 font-mono">{da.id}</span>
                        {da.id.startsWith('demo-') ? (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                            Démo
                          </span>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
                            Propre
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 font-bold">
                          {da.department}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{da.requestDate}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-xs leading-snug">{da.itemDescription}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Demandé par : {da.requestedBy}</span>
                        <span>|</span>
                        <span>Qté : {da.quantityRequested} {da.unit}</span>
                      </div>

                      {da.decisionNotes && (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 font-bold">
                          Note décisionnelle : {da.decisionNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 text-right">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {(da.estimatedCost ?? 0).toLocaleString('fr-FR')} TND
                      </span>
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        da.status === 'En attente' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        da.status === 'Approuvé' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {da.status}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredDAs.length === 0 && (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Tag className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-black">Aucune demande d'achat correspondante trouvée</p>
                  </div>
                )}
              </div>
            </div>

            {/* DA Decision Workspace */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Bureau des Approbations (DA)
                  </h4>
                  <p className="text-[10px] text-slate-400">Validez ou rejetez les demandes de vos collaborateurs</p>
                </div>

                {selectedDA ? (
                  <div className="space-y-4 text-xs font-medium">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Description abrégée</span>
                      <p className="font-bold text-slate-800 text-sm leading-snug">{selectedDA.itemDescription}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">Budget prévisionnel</span>
                        <span className="font-bold text-slate-800 font-mono">{(selectedDA.estimatedCost ?? 0).toLocaleString('fr-FR')} TND</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">Quantité requise</span>
                        <span className="font-bold text-slate-800">{selectedDA.quantityRequested} {selectedDA.unit}</span>
                      </div>
                    </div>

                    {selectedDA.status === 'En attente' ? (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-bold">Note de décision / Justification :</label>
                          <textarea
                            rows={3}
                            placeholder="Saisissez la justification de votre approbation ou de votre rejet budgétaire..."
                            value={daDecisionNotes}
                            onChange={(e) => setDaDecisionNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 font-semibold text-slate-800"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecisionDA(selectedDA.id, false)}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-lg cursor-pointer transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Rejeter la DA</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecisionDA(selectedDA.id, true)}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approuver DA</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600">
                        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase text-slate-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Demande déjà traitée</span>
                        </div>
                        <p className="text-[11px]">Le statut de cette demande d'achat a été fixé sur **{selectedDA.status}**.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Tag className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-[11px] leading-relaxed">Aucune demande sélectionnée.<br />Sélectionnez une demande d'achat à gauche pour statuer sur sa validité budgétaire.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: SUPPLIERS PERFORMANCE */}
        {activeSubTab === 'suppliers' && (
          <motion.div
            key="suppliers-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Qualité Globale</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {suppliers.length > 0
                      ? (suppliers.reduce((sum, s) => sum + (s.conformityRate ?? 0), 0) / suppliers.length).toFixed(1)
                      : '0'}%
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Taux de conformité moyen</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Retard de Livraison</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {suppliers.length > 0
                      ? (suppliers.reduce((sum, s) => sum + (s.delayRate ?? 0), 0) / suppliers.length).toFixed(1)
                      : '0'}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Délai moyen constaté</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Volume d'Achat</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {(suppliers.reduce((sum, s) => sum + (s.totalVolume ?? 0), 0)).toLocaleString('fr-FR')} DT
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Budget engagé cumulé</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Fournisseurs Évalués</span>
                  <span className="text-xl font-black font-mono text-slate-900">{suppliers.length}</span>
                  <span className="text-[9px] text-slate-500 block">Partenaires actifs</span>
                </div>
              </div>
            </div>

            {/* Interactive Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recharts chart block */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Comparatif Performance Fournisseurs</h3>
                    <p className="text-[10px] text-slate-400">Croisement des taux de retard (%) et de conformité qualité (%)</p>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span>
                      <span>Qualité %</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                      <span>Retard %</span>
                    </span>
                  </div>
                </div>

                <div className="h-[230px] w-full">
                  {suppliers.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Aucune donnée à afficher. Ajoutez un fournisseur pour générer le graphique.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={suppliers.map(s => {
                          const rawName = String(s?.name || 'Fournisseur');
                          const shortName = rawName.includes(' ') ? rawName.split(' ')[0] : rawName;
                          return {
                            name: shortName || 'Fournisseur',
                            Qualite: Number(s?.conformityRate ?? 0),
                            Retard: Number(s?.delayRate ?? 0),
                          };
                        })}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="Qualite" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} name="Conformité Qualité (%)" />
                        <Bar dataKey="Retard" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} name="Taux de Retard (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Quality Criteria Guide panel */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">Critères d'Audit Elyssa ERP</h3>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Le score de performance est recalculé automatiquement selon la formule de conformité stricte et l'impact du retard sur les lignes de production de l'usine :
                  </p>
                  <div className="space-y-2.5 text-[11px]">
                    <div className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">✔</span>
                      <span><strong className="text-white">Score ≥ 90 (Rang A) :</strong> Fournisseur privilégié. Processus d'inspection qualité allégé.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">⚠</span>
                      <span><strong className="text-white">Score [75 - 89] (Rang B) :</strong> Sous surveillance active. Audit qualité annuel requis.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-rose-400 font-bold">✘</span>
                      <span><strong className="text-white">Score &lt; 75 (Rang C) :</strong> Critique. Gel temporaire de nouvelles commandes d'achat.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-indigo-900/60 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-300">Calculateur Elyssa ERP v2.1</span>
                  <button
                    onClick={handleOpenAddSupplier}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Évaluer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List & Search/Filter of Evaluated Suppliers */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registre d'Évaluation de la Performance</h3>
                  <p className="text-[10px] text-slate-400">Cliquez sur un fournisseur pour réévaluer ses KPI de livraison et de rebuts</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      placeholder="Rechercher un fournisseur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-800"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Suppliers Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((sup) => {
                  const isRangA = sup.score >= 90;
                  const isRangB = sup.score >= 75 && sup.score < 90;
                  const isRangC = sup.score < 75;

                  return (
                    <div
                      key={sup.id}
                      onClick={() => handleOpenEditSupplier(sup)}
                      className={`bg-white hover:bg-slate-50 border rounded-2xl p-5 shadow-xs space-y-4 transition-all cursor-pointer relative group ${
                        sup.delayRate > 15
                          ? 'border-rose-400 ring-2 ring-rose-100/70 bg-rose-50/5'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {String(sup?.id || '').startsWith('demo-') ? (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                                Démo
                              </span>
                            ) : (
                              <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
                                Propre
                              </span>
                            )}
                          </div>
                          {isRangA && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-650 font-black uppercase px-2 py-0.5 rounded-md border border-emerald-100 flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>Qualifié - Rang A</span>
                            </span>
                          )}
                          {isRangB && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 font-black uppercase px-2 py-0.5 rounded-md border border-amber-100 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Alerte - Rang B</span>
                            </span>
                          )}
                          {isRangC && (
                            <span className="text-[9px] bg-rose-50 text-rose-800 font-black uppercase px-2 py-0.5 rounded-md border border-rose-150 flex items-center space-x-1">
                              <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Critique - Rang C</span>
                            </span>
                          )}
                          {sup.delayRate > 15 && (
                            <span className="text-[9px] bg-rose-600 text-white font-black uppercase px-2 py-0.5 rounded-md border border-rose-700 flex items-center space-x-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-white shrink-0" />
                              <span>Retard &gt; 15%</span>
                            </span>
                          )}
                        </div>
                        <span className={`text-xl font-black font-mono ${isRangA ? 'text-emerald-600' : isRangB ? 'text-amber-600' : 'text-rose-600'}`}>
                          {sup.score}/100
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-650 transition-colors flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span>{sup.name}</span>
                          {sup.delayRate > 15 && (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                          )}
                        </h4>
                        <p className="text-slate-400 text-[10px]">{sup.category}</p>
                      </div>

                        <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-600">
                          <div className="flex justify-between items-center">
                            <span>Volume d'achat cumulé :</span>
                            <span className="font-bold text-slate-800 font-mono">{(sup.totalVolume ?? 0).toLocaleString('fr-FR')} TND</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center space-x-1">
                              {sup.delayRate > 15 && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                              <span>Retard de livraison constaté :</span>
                            </span>
                            <span className={`font-bold ${sup.delayRate === 0 ? 'text-emerald-600' : sup.delayRate > 15 ? 'text-rose-600 font-black' : sup.delayRate > 10 ? 'text-rose-500' : 'text-amber-600'}`}>
                              {sup.delayRate}% {sup.delayRate === 0 ? '(Ponctuel)' : sup.delayRate > 15 ? '(Retards élevés)' : '(Mineur)'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Taux de conformité pièces :</span>
                            <span className={`font-bold ${sup.conformityRate >= 98 ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {sup.conformityRate}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Alert Banner with action button for severe delays */}
                        {sup.delayRate > 15 && (
                          <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex items-center justify-between text-rose-900 mt-1">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="text-[10px] font-black truncate">Seuil critique dépassé !</span>
                            </div>
                            <button
                              onClick={(e) => handleInitiateEmail(sup, e)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-2.5 py-1 rounded-md flex items-center space-x-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Relancer</span>
                            </button>
                          </div>
                        )}

                        {/* Tooltip or hover indicators */}
                        <div className="pt-2 border-t border-slate-100/60 flex justify-between items-center text-[10px] text-slate-400">
                          <span>ID: {sup.id}</span>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditSupplier(sup);
                              }}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-650 hover:bg-indigo-100 rounded text-[9px] font-bold"
                            >
                              Évaluer
                            </button>
                            {sup.delayRate > 15 && (
                              <button
                                onClick={(e) => handleInitiateEmail(sup, e)}
                                className="px-2 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[9px] font-bold flex items-center space-x-1"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Rappel</span>
                              </button>
                            )}
                            {suppliers.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteSupplier(sup.id, e)}
                                className="p-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: CONFIGURATION ACHAT */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="purchasing-settings-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Taxe FODEC & Timbre Setup */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Paramètres de Taxation & Taxes d'Approvisionnement (FODEC)</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Configurez le taux du Fonds de Développement de la Compétitivité Industrielle (FODEC) et le Droit de Timbre Fiscal obligatoire pour vos Bons de Commande tunisiens.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux FODEC (%) :</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fodecRate}
                    onChange={(e) => updateFodecRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Droit de Timbre (TND) :</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={stampDutyValue}
                    onChange={(e) => updateStampDuty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-indigo-650/80 font-semibold leading-relaxed">
                * Note : Le FODEC est actuellement de 1.00% et le Timbre Fiscal est à 1.000 DT d'après le Code Fiscal tunisien en vigueur.
              </p>
            </div>

            {/* Seuils d'approbation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Seuils d'Approbation Budgétaire (Tunisie)</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Définissez la limite financière en TND en dessous de laquelle une demande d'achat (DA) interne est automatiquement approuvée par le système Elyssa ERP.
              </p>
              <div className="space-y-1.5 font-mono pt-2 max-w-xs">
                <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Seuil d'Approbation Automatique (TND) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={approvalThreshold}
                    onChange={(e) => updateApprovalThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-12 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">
                    TND
                  </div>
                </div>
              </div>
              <p className="text-[10.5px] text-amber-700 font-semibold leading-relaxed">
                Toute demande dont le budget dépasse {(approvalThreshold ?? 0).toLocaleString()} TND restera en attente d'évaluation manuelle par le Chef de Service ou le Directeur Financier.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Bons de Commande (BC) --- */}
      <AnimatePresence>
        {isBCFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {editingBC ? "Modifier le Bon de Commande" : "Émettre un nouveau Bon de Commande (BC)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBCFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBC} className="p-5 space-y-4 text-xs font-semibold">
                {/* Optional Smart OCR pre-fill panel */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-[11px]">Saisie Assistée par Elyssa OCR IA</h4>
                        <p className="text-[10px] text-slate-500">Glissez ou sélectionnez un devis/facture pour remplir le formulaire</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="flex items-center justify-center border border-dashed border-indigo-300 rounded-lg p-3 bg-white hover:bg-indigo-50/50 transition cursor-pointer text-center space-x-2">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-700">
                        {isOcrLoading ? "Lecture intelligente en cours..." : "Téléverser la facture ou devis fournisseur"}
                      </span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleBcFileOcr} 
                        accept="image/*,application/pdf"
                        disabled={isOcrLoading}
                      />
                    </label>
                  </div>

                  {isOcrLoading && (
                    <div className="flex items-center justify-center space-x-1.5 py-1 text-[10px] text-indigo-600 font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extraction de la fiscalité tunisienne (FODEC, TVA)...</span>
                    </div>
                  )}

                  {ocrError && (
                    <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-[10px]">
                      ⚠️ <strong>Erreur OCR :</strong> {ocrError}
                    </div>
                  )}

                  {ocrResult && (
                    <div className="p-2 bg-emerald-50/60 border border-emerald-100 text-emerald-800 rounded-lg text-[10px] flex items-center justify-between font-bold">
                      <span>✓ Données de {ocrResult.supplier} appliquées (confiance: {Math.round((ocrResult.confidence || 0.95) * 100)}%)</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setOcrResult(null);
                          setOcrError(null);
                        }} 
                        className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        Effacer
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Fournisseur :</label>
                  <select
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                  >
                    <option value="">Sélectionner un fournisseur qualifié...</option>
                    <option value="SOTUMETAL S.A. (Tunis)">SOTUMETAL S.A. (Tunis)</option>
                    <option value="TUNISIE PLASTIQUES S.A.">TUNISIE PLASTIQUES S.A.</option>
                    <option value="COMPOSANTS ÉLECTRIQUES MED">COMPOSANTS ÉLECTRIQUES MED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Désignation des composants :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bandes de cuivre électrolytique"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Quantité commandée :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formQty}
                      onChange={(e) => setFormQty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Prix Unitaire HT (TND) :</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      min={0.001}
                      value={formUnitCost}
                      onChange={(e) => setFormUnitCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Taux TVA (%) :</label>
                    <select
                      value={formVatRate}
                      onChange={(e) => setFormVatRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800 font-mono"
                    >
                      <option value={19}>19% (Standard)</option>
                      <option value={13}>13% (Services/Énergie)</option>
                      <option value={7}>7% (Matières premières agri.)</option>
                      <option value={0}>0% (Exonéré)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="fodec"
                      checked={formFodec}
                      onChange={(e) => setFormFodec(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="fodec" className="text-slate-600 select-none cursor-pointer">
                      Soumettre au FODEC (1%)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Échéance de livraison :</label>
                    <input
                      type="date"
                      required
                      value={formDelivDate}
                      onChange={(e) => setFormDelivDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Conditions de règlement :</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chèque à 60 Jours fin de mois"
                      value={formPayTerms}
                      onChange={(e) => setFormPayTerms(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Cahier d'instructions et notes :</label>
                  <textarea
                    rows={3}
                    placeholder="Certificats de test qualité requis, exigences de conditionnement..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsBCFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer Bon de Commande
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Soumettre une Demande d'Achat (DA) --- */}
      <AnimatePresence>
        {isDAFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Soumettre une Demande d'Achat Interne
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDAFormOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDA} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Désignation du besoin :</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 5 Bobines de fil galvanisé pour le dépannage de la ligne extrusion A"
                    value={daDesc}
                    onChange={(e) => setDaDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-slate-500 block">Quantité requise :</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={daQty}
                      onChange={(e) => setDaQty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Unité :</label>
                    <select
                      value={daUnit}
                      onChange={(e) => setDaUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 cursor-pointer text-slate-800"
                    >
                      <option value="u">u (pièces)</option>
                      <option value="kg">kg</option>
                      <option value="m">mètres</option>
                      <option value="L">litres</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Estimation du budget global (TND) :</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={daCost}
                    onChange={(e) => setDaCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsDAFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Soumettre la Demande
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Évaluer un Fournisseur --- */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {editingSupplier ? "Modifier l'Évaluation Fournisseur" : "Nouvelle Évaluation Fournisseur"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Nom du Fournisseur :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOTUMETAL S.A. (Tunis)"
                    value={supFormName}
                    onChange={(e) => setSupFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Catégorie d'articles / Activité :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cuivre, Métaux d'alliage"
                    value={supFormCategory}
                    onChange={(e) => setSupFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Volume d'achat cumulé (TND) :</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={supFormVolume}
                    onChange={(e) => setSupFormVolume(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-800 font-mono"
                  />
                </div>

                {/* Delay & Quality parameters with live preview */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3.5">
                  <span className="text-[10px] text-indigo-650 font-black block uppercase tracking-wider">
                    Indicateurs de Performance (KPI)
                  </span>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">Taux de retard de livraison :</span>
                      <span className="font-bold text-slate-900 font-mono">{supFormDelay}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={supFormDelay}
                      onChange={(e) => setSupFormDelay(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>0% (Parfait)</span>
                      <span>50% (Sévère)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">Taux de conformité qualité :</span>
                      <span className="font-bold text-slate-900 font-mono">{supFormConformity}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="0.1"
                      value={supFormConformity}
                      onChange={(e) => setSupFormConformity(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>50% (Rebuts)</span>
                      <span>100% (Zéro défaut)</span>
                    </div>
                  </div>

                  {/* Live computed score feedback */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-bold">Score d'Évaluation estimé :</span>
                    <span className="font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-mono">
                      {Math.max(0, Math.min(100, Math.round(Number(supFormConformity) - (Number(supFormDelay) * 1.2))))}/100
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Enregistrer l'évaluation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: Relancer un Fournisseur par E-mail --- */}
      <AnimatePresence>
        {isEmailModalOpen && emailSup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden text-slate-800"
            >
              <div className="bg-rose-900 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-rose-300" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Rédiger un E-mail de Relance (Alerte Retards)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="text-slate-300 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="p-5 space-y-4 text-xs font-semibold">
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start space-x-2.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-black">Statut Critique : Taux de retard de {emailSup.delayRate}% !</p>
                    <p className="text-[10px] text-rose-700 font-medium">Le retard de ce fournisseur dépasse le seuil réglementaire Elyssa ERP de 15%. Cet e-mail sera enregistré dans l'historique d'audit.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Destinataire :</label>
                  <input
                    type="text"
                    disabled
                    value={`${String(emailSup?.name || 'fournisseur').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@contact.tn`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Sujet :</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-rose-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Message :</label>
                  <textarea
                    required
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-rose-500 text-slate-800 font-sans leading-relaxed resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg cursor-pointer transition-colors shadow-xs flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer le rappel</span>
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
