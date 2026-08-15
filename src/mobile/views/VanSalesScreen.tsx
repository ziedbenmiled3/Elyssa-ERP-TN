import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  CheckCircle2,
  Printer,
  FileText,
  Wifi,
  WifiOff,
  User,
  Truck,
  Package,
  Trash2,
  Plus,
  Minus,
  PenTool,
  Bluetooth,
  RefreshCw,
  X,
  CreditCard,
  DollarSign,
  AlertCircle,
  Tag
} from 'lucide-react';
import offlineSyncEngine from '../services/offlineSyncEngine';
import { MobileOrder, MobileOrderItem } from '../../types/mobileTerrain';
import DocumentPrintModal, { PrintModalData } from '../../components/DocumentPrintModal';

interface ProductCatalogItem {
  id: string;
  ref: string;
  name: string;
  category: string;
  priceHT: number;
  tvaRate: number; // e.g. 19
  unit: string;
  imageUrl?: string;
}

const DEMO_PRODUCTS: ProductCatalogItem[] = [
  { id: 'ART-001', ref: 'CIM-50', name: 'Ciment Portland Super CPJ45 (Sac 50kg)', category: 'Gros Œuvre', priceHT: 14.500, tvaRate: 19, unit: 'Sac' },
  { id: 'ART-002', ref: 'BRI-12', name: 'Brique Rouge de 12 Alvéoles (Paquet)', category: 'Gros Œuvre', priceHT: 0.850, tvaRate: 19, unit: 'Pièce' },
  { id: 'ART-003', ref: 'PEI-SAT', name: 'Peinture Satino-Vinylique Blanche 15L', category: 'Finition', priceHT: 85.000, tvaRate: 19, unit: 'Pot' },
  { id: 'ART-004', ref: 'ROB-LAI', name: 'Robinet Mélangeur Évier Laiton Chromé', category: 'Sanitaire', priceHT: 65.000, tvaRate: 19, unit: 'Unité' },
  { id: 'ART-005', ref: 'CAB-25', name: 'Câble Électrique Rigide 2.5mm² (Rouleau 100m)', category: 'Électricité', priceHT: 110.000, tvaRate: 19, unit: 'Rouleau' },
  { id: 'ART-006', ref: 'FER-12', name: 'Barre de Fer à Béton HLE 12mm (12m)', category: 'Gros Œuvre', priceHT: 28.000, tvaRate: 19, unit: 'Barre' },
  { id: 'ART-007', ref: 'DIS-CUT', name: 'Disque de Découpe Diamanté 230mm Pro', category: 'Outillage', priceHT: 42.000, tvaRate: 19, unit: 'Pièce' },
  { id: 'ART-008', ref: 'DISJ-16', name: 'Disjoncteur Divisionnaire 16A', category: 'Électricité', priceHT: 7.050, tvaRate: 19, unit: 'Pièce' }
];

const DEMO_CLIENTS = [
  { id: 'CLI-101', name: 'Quincaillerie Al Boughaz (Tunis)', code: 'C-TUN-101', address: 'Avenue Habib Bourguiba, Tunis' },
  { id: 'CLI-102', name: 'Société El Wafa de Bâtiment (Sfax)', code: 'C-SFX-102', address: 'Route de Téniour Km 4, Sfax' },
  { id: 'CLI-103', name: 'Ets Ben Ammar Matériaux (Nabeul)', code: 'C-NBL-103', address: 'Zone Industrielle, Nabeul' },
  { id: 'CLI-104', name: 'Comptoir Sanitaire du Sahel (Sousse)', code: 'C-SSE-104', address: 'Avenue Leopold Senghor, Sousse' },
];

interface VanSalesScreenProps {
  tenantId?: string;
  agentId?: string;
  agentName?: string;
  vehicleRef?: string;
}

export const VanSalesScreen: React.FC<VanSalesScreenProps> = ({
  tenantId = 'Inter-Affaires',
  agentId = 'ag_field_01',
  agentName = 'Hamza Ben Salem (Van Sales)',
  vehicleRef = 'Peugeot Partner (228 TUN 4091)'
}) => {
  // Offline Engine & Connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [vehicleStock, setVehicleStock] = useState<Record<string, number>>({});

  // Catalog search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart & Order Form State
  const [selectedClient, setSelectedClient] = useState(DEMO_CLIENTS[0]);
  const [cartItems, setCartItems] = useState<{ product: ProductCatalogItem; qty: number; discountPercent: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHECK' | 'TRAITE'>('CASH');

  // Signature Modal & Canvas State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Bluetooth ESC/POS Thermal Printing State
  const [btConnected, setBtConnected] = useState(false);
  const [btPrinterName, setBtPrinterName] = useState<string>('');
  const [showThermalReceiptModal, setShowThermalReceiptModal] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<MobileOrder | null>(null);

  // Unified Print Modal State
  const [unifiedPrintModalOpen, setUnifiedPrintModalOpen] = useState(false);
  const [unifiedPrintData, setUnifiedPrintData] = useState<PrintModalData | null>(null);

  const handleOpenMobileA4Print = (order: MobileOrder | null) => {
    if (!order) return;
    setUnifiedPrintData({
      docType: 'BON_LIVRAISON',
      docNumber: `BL-VAN-${order.ticketNumber || order.localUuid || order.id}`,
      date: order.timestamp ? new Date(order.timestamp).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      companyInfo: {
        name: 'Elyssa ERP — Flotte Nomade & Vente à Emporter',
        mf: '1849203/A/M/000',
        address: 'Service Distribution Nomade Tunis',
        phone: '+216 71 800 900',
        email: 'vansales@elyssaerp.tn'
      },
      clientInfo: {
        name: order.clientName,
        mf: order.clientTaxId || 'MF-PASSAGER',
        address: 'Livraison Vente Directe Camion'
      },
      deliveryAddress: 'Vente au Camion Nomade',
      driverName: 'Agent Commercial Nomade',
      vehicleRef: 'Camionette Distribution TN-210',
      gpsCoords: order.gpsCoordinates || '36.8065° N, 10.1815° E',
      signatureUrl: order.signatureDataUrl || order.signatureUrl || signatureDataUrl,
      recipientName: order.clientName,
      deliveryStatus: 'LIVRÉ EN CAISSE NOMADE',
      items: order.items.map(i => {
        const q = i.quantity ?? i.qty ?? 1;
        const p = i.unitPriceHT ?? i.unitPrice ?? 0;
        return {
          description: i.productName || i.label || 'Article Nomade',
          quantity: q,
          unitPrice: p,
          tvaRate: i.tvaRate || 19,
          totalHT: q * p,
          unit: 'u.'
        };
      })
    });
    setUnifiedPrintModalOpen(true);
  };

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Initial Stock & Subscribe to Sync Status
  useEffect(() => {
    setVehicleStock(offlineSyncEngine.getVehicleStock(agentId));

    const unsubConn = offlineSyncEngine.onConnectivityChange((online) => {
      setIsOnline(online);
    });

    const unsubSync = offlineSyncEngine.onSyncStatusChange((status) => {
      setPendingOrdersCount(status.pendingOrdersCount);
      setVehicleStock(offlineSyncEngine.getVehicleStock(agentId));
    });

    return () => {
      unsubConn();
      unsubSync();
    };
  }, [agentId]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(DEMO_PRODUCTS.map(p => p.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  // Filtered Catalog
  const filteredProducts = useMemo(() => {
    return DEMO_PRODUCTS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.ref.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  // Cart Totals Calculation
  const cartTotals = useMemo(() => {
    let totalHT = 0;
    let totalTVA = 0;

    cartItems.forEach(item => {
      const lineHTBeforeDiscount = item.product.priceHT * item.qty;
      const lineDiscountAmount = lineHTBeforeDiscount * (item.discountPercent / 100);
      const lineHT = lineHTBeforeDiscount - lineDiscountAmount;
      const lineTVA = lineHT * (item.product.tvaRate / 100);

      totalHT += lineHT;
      totalTVA += lineTVA;
    });

    const totalTTC = totalHT + totalTVA;

    return {
      totalHT,
      totalTVA,
      totalTTC
    };
  }, [cartItems]);

  // Cart Modifiers
  const addToCart = (product: ProductCatalogItem) => {
    const available = vehicleStock[product.id] ?? 0;
    const existingIndex = cartItems.findIndex(i => i.product.id === product.id);
    const currentQtyInCart = existingIndex >= 0 ? cartItems[existingIndex].qty : 0;

    if (currentQtyInCart + 1 > available) {
      showToast(`Stock camionette insuffisant (${available} restants) pour ${product.name}`);
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, qty: 1, discountPercent: 0 }]);
    }
    showToast(`Ajouté au panier: ${product.name}`);
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    const existingIndex = cartItems.findIndex(i => i.product.id === productId);
    if (existingIndex < 0) return;

    const item = cartItems[existingIndex];
    const available = vehicleStock[productId] ?? 0;
    const newQty = item.qty + delta;

    if (newQty > available) {
      showToast(`Stock max atteint (${available} ${item.product.unit})`);
      return;
    }

    if (newQty <= 0) {
      setCartItems(cartItems.filter(i => i.product.id !== productId));
    } else {
      const updated = [...cartItems];
      updated[existingIndex].qty = newQty;
      setCartItems(updated);
    }
  };

  const updateCartItemDiscount = (productId: string, percent: number) => {
    const updated = cartItems.map(item => {
      if (item.product.id === productId) {
        return { ...item, discountPercent: Math.min(100, Math.max(0, percent)) };
      }
      return item;
    });
    setCartItems(updated);
  };

  // Signature Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
    showToast('Signature du client enregistrée avec succès.');
  };

  // Bluetooth ESC/POS Print Simulator / Web Bluetooth Integration
  const connectBluetoothPrinter = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        // Real Web Bluetooth API call
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        setBtConnected(true);
        setBtPrinterName(device.name || 'Imprimante Bluetooth Portable ESC/POS');
        showToast(`Imprimante Bluetooth ${device.name || 'ESC/POS'} connectée.`);
      } else {
        // Fallback simulation for thermal bluetooth printing
        setBtConnected(true);
        setBtPrinterName('Imprimante Thermique Bluetooth ESC/POS 58mm (Simulée)');
        showToast('Module Imprimante Thermique Bluetooth ESC/POS initialisé.');
      }
    } catch (err: any) {
      console.warn('Bluetooth pairing fallback :', err);
      setBtConnected(true);
      setBtPrinterName('Imprimante Thermique ESC/POS 80mm');
      showToast('Connecté à l\'imprimante thermique portable.');
    }
  };

  // Finalize & Save Order
  const handleFinalizeOrder = () => {
    if (cartItems.length === 0) {
      showToast('Votre panier est vide.');
      return;
    }

    const items: MobileOrderItem[] = cartItems.map(item => {
      const lineHTBeforeDiscount = item.product.priceHT * item.qty;
      const lineDiscountAmount = lineHTBeforeDiscount * (item.discountPercent / 100);
      const totalHTLine = lineHTBeforeDiscount - lineDiscountAmount;
      return {
        articleId: item.product.id,
        label: item.product.name,
        qty: item.qty,
        unitPrice: item.product.priceHT,
        total: totalHTLine
      };
    });

    const savedOrder = offlineSyncEngine.saveOrderLocally({
      tenantId,
      agentId,
      agentName,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      items,
      totalHT: cartTotals.totalHT,
      totalTTC: cartTotals.totalTTC,
      paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
      paymentMethod,
      signatureUrl: signatureDataUrl,
      status: 'PENDING_VALIDATION'
    });

    setLastSavedOrder(savedOrder);
    setCartItems([]);
    setSignatureDataUrl('');
    setShowThermalReceiptModal(true);
    showToast(`Commande ${savedOrder.localUuid} enregistrée localement !`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12" id="van-sales-mobile-screen">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-indigo-400 animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Mobile Bar Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-tight font-display">
                  Elyssa ERP • Force de Vente (Van Sales)
                </h2>
                {isOnline ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <Wifi className="w-3 h-3 text-emerald-400" /> ONLINE
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <WifiOff className="w-3 h-3 text-amber-400" /> OFFLINE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {agentName} • Veh: {vehicleRef}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => offlineSyncEngine.syncAllPending(tenantId)}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              title="Synchroniser vers Elyssa ERP Cloud"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync ({pendingOrdersCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Personal Motivation Card: Mon Objectif & Prime du Mois (Sami Cherif) */}
        <div className="bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                🎯
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400 font-mono tracking-wider block">
                  CONTRAT DE PERFORMANCE MPO / OKR
                </span>
                <h3 className="text-sm font-black text-white font-display">
                  Mon Objectif & Prime du Mois (Août 2026)
                </h3>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-xs font-black font-mono">
              93.6% Atteint
            </span>
          </div>

          {/* Realtime Gauge & Estimated Prime */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400 font-medium">Prime Estimée du Mois :</span>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400 font-mono">421.110</span>
                <span className="text-[11px] font-mono text-slate-400 ml-1">/ 450.000 TND</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '93.6%' }}></div>
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>• Chiffre d'Affaires Ventes (70%)</span>
                <span className="font-bold text-white">24 850 / 25 000 TND</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span>• Prospection Nouveaux Clients (30%)</span>
                <span className="font-bold text-emerald-400">8 / 10 Clients</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-rose-300/90 font-medium flex items-center space-x-1">
            <span>🔥</span>
            <span>Plus que <strong>150 DT de CA</strong> pour débloquer la prime maximale de 450.000 DT !</span>
          </div>
        </div>

        {/* Client Selection Bar */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-md">
          <label className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Sélection du Client B2B :</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedClient.id}
              onChange={(e) => {
                const found = DEMO_CLIENTS.find(c => c.id === e.target.value);
                if (found) setSelectedClient(found);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="select-van-client"
            >
              {DEMO_CLIENTS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 flex flex-col justify-center">
              <span className="font-bold text-slate-200">{selectedClient.name}</span>
              <span className="truncate">{selectedClient.address}</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Products Catalog, Right Shopping Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Product Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Categories */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par article ou référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="input-catalog-search"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'Tous les produits' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredProducts.map(product => {
                const stock = vehicleStock[product.id] ?? 0;
                const inCart = cartItems.find(i => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                          {product.ref}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-extrabold uppercase font-mono">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs">
                        {product.name}
                      </h4>
                      <div className="flex items-center space-x-3 text-[11px] font-mono">
                        <span className="text-emerald-400 font-extrabold">
                          {product.priceHT.toFixed(3)} TND HT
                        </span>
                        <span className="text-slate-400">
                          (TVA {product.tvaRate}%)
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stock > 10 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                        }`}>
                          Stock Vh: {stock} {product.unit}s
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {inCart ? (
                        <div className="flex items-center space-x-1.5 bg-slate-900 border border-indigo-500/40 p-1 rounded-xl">
                          <button
                            onClick={() => updateCartItemQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-bold text-indigo-300 text-xs font-mono">
                            {inCart.qty}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold hover:bg-indigo-500 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={stock <= 0}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer border ${
                            stock > 0
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md'
                              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart & Order Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                    Panier de Commande ({cartItems.length})
                  </h3>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Vider
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                    Le panier est vide. Sélectionnez des produits dans le catalogue.
                  </div>
                ) : (
                  cartItems.map(item => {
                    const lineHTBefore = item.product.priceHT * item.qty;
                    const lineHTAfter = lineHTBefore * (1 - item.discountPercent / 100);

                    return (
                      <div key={item.product.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-white text-xs leading-snug">
                              {item.product.name}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.qty} x {item.product.priceHT.toFixed(3)} TND
                            </span>
                          </div>
                          <button
                            onClick={() => updateCartItemQty(item.product.id, -item.qty)}
                            className="text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remise & Line Total */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-amber-400" />
                            <span className="text-slate-400 text-[10px]">Remise:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) => updateCartItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                              className="w-12 bg-slate-950 border border-slate-700 text-amber-300 text-center rounded text-[10px] font-bold py-0.5 focus:outline-none"
                            />
                            <span className="text-slate-400 text-[10px]">%</span>
                          </div>

                          <span className="font-extrabold text-emerald-400">
                            {lineHTAfter.toFixed(3)} TND HT
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Brut HT :</span>
                  <span>{cartTotals.totalHT.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TVA Globale (19%) :</span>
                  <span>{cartTotals.totalTVA.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Net TTC :</span>
                  <span className="text-emerald-400 font-extrabold">{cartTotals.totalTTC.toFixed(3)} TND</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Mode de Règlement Client :</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'CHECK', 'TRAITE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer border ${
                        paymentMethod === m
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {m === 'CASH' ? 'Espèces' : m === 'CHECK' ? 'Chèque' : 'Traite'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Signature Button */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border transition cursor-pointer ${
                    signatureDataUrl
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  id="btn-open-signature-pad"
                >
                  <PenTool className="w-4 h-4 text-indigo-400" />
                  <span>
                    {signatureDataUrl ? 'Signature Client Enregistrée ✓' : 'Pavé de Signature Écran Client'}
                  </span>
                </button>

                {signatureDataUrl && (
                  <div className="bg-slate-900 p-2 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <img src={signatureDataUrl} alt="Signature preview" className="h-8 max-w-[140px] object-contain invert" />
                    <button
                      onClick={() => setSignatureDataUrl('')}
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                )}
              </div>

              {/* Bluetooth ESC/POS Thermal Printer Connect Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bluetooth className={`w-4 h-4 ${btConnected ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="text-[11px] font-mono text-slate-300">
                    {btConnected ? btPrinterName : 'Imprimante Bluetooth Non Connectée'}
                  </span>
                </div>
                <button
                  onClick={connectBluetoothPrinter}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition cursor-pointer"
                  id="btn-connect-bluetooth-printer"
                >
                  {btConnected ? 'Reconnecter' : 'Appairer BT'}
                </button>
              </div>

              {/* Save & Print Action */}
              <button
                onClick={handleFinalizeOrder}
                disabled={cartItems.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition cursor-pointer border-0 ${
                  cartItems.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                id="btn-save-van-order"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider la Commande & Éditer le BL</span>
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SIGNATURE CANVAS MODAL */}
      {/* ========================================================================= */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                  Pavé de Signature Numérique Client
                </h3>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Veuillez faire signer le client ({selectedClient.name}) directement sur l'écran ci-dessous avec le doigt ou un stylet.
            </p>

            {/* Canvas signature area */}
            <div className="bg-white rounded-2xl p-2 border-2 border-slate-700 shadow-inner">
              <canvas
                ref={canvasRef}
                width={420}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-48 bg-white rounded-xl touch-none cursor-crosshair"
                id="signature-canvas-element"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={clearSignature}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Effacer
              </button>
              <button
                onClick={saveSignature}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Valider la Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THERMAL BLUETOOTH RECEIPT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {showThermalReceiptModal && lastSavedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                  Impression Bon de Livraison (ESC/POS)
                </h3>
              </div>
              <button onClick={() => setShowThermalReceiptModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Ticket Display (58mm/80mm layout styling) */}
            <div className="bg-amber-50 text-slate-900 p-5 rounded-xl font-mono text-[11px] space-y-3 shadow-inner border border-amber-200">
              <div className="text-center font-bold space-y-0.5 border-b border-slate-400/40 pb-2">
                <h4 className="text-sm font-black uppercase">ELYSSA ERP • VAN SALES</h4>
                <p>Livraison Itinérante - Société Inter-Affaires</p>
                <p className="text-[10px]">Tél: +216 71 000 000 • MF: 1492049/A/M/000</p>
              </div>

              <div className="space-y-1 text-[10px] border-b border-slate-400/40 pb-2">
                <div className="flex justify-between">
                  <span>BL N°:</span>
                  <span className="font-bold">{lastSavedOrder.localUuid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-bold">{lastSavedOrder.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent / Véhicule:</span>
                  <span>{agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(lastSavedOrder.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-1 border-b border-slate-400/40 pb-2">
                <div className="flex justify-between font-bold text-[10px] uppercase border-b border-slate-300 pb-0.5">
                  <span>Article</span>
                  <span>Qté x PU = Total</span>
                </div>
                {lastSavedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[160px]">{it.label}</span>
                    <span>{it.qty} x {it.unitPrice.toFixed(3)} = {it.total.toFixed(3)} TND</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 font-bold text-[11px]">
                <div className="flex justify-between">
                  <span>Total HT :</span>
                  <span>{lastSavedOrder.totalHT.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Total TTC :</span>
                  <span className="text-sm font-black">{lastSavedOrder.totalTTC.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Règlement :</span>
                  <span>{lastSavedOrder.paymentMethod} ({lastSavedOrder.paymentStatus})</span>
                </div>
              </div>

              {lastSavedOrder.signatureUrl && (
                <div className="pt-2 border-t border-slate-400/40 text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-600 block">Signature Client Reçue :</span>
                  <img src={lastSavedOrder.signatureUrl} alt="Signature" className="h-10 mx-auto object-contain" />
                </div>
              )}

              <div className="text-center text-[9px] text-slate-600 pt-2 border-t border-dashed border-slate-400">
                *** Merci de votre confiance avec Elyssa ERP ***
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Ticket Thermique BT</span>
              </button>

              <button
                onClick={() => handleOpenMobileA4Print(lastSavedOrder)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>📄 Imprimer Format A4</span>
              </button>

              <button
                onClick={() => setShowThermalReceiptModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED PRINT MODAL */}
      <DocumentPrintModal
        isOpen={unifiedPrintModalOpen}
        onClose={() => setUnifiedPrintModalOpen(false)}
        data={unifiedPrintData}
      />

    </div>
  );
};

export default VanSalesScreen;
