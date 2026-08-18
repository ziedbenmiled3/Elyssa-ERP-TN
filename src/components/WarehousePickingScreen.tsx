import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { PickingOrder, PickingOrderStatus } from '../types/mobileTerrain';
import { 
  Warehouse, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  PackageCheck, 
  Truck, 
  MapPin, 
  FileText, 
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2,
  RefreshCw,
  BellRing
} from 'lucide-react';

interface WarehousePickingScreenProps {
  tenantId: string;
  currentUser?: any;
}

export const WarehousePickingScreen: React.FC<WarehousePickingScreenProps> = ({
  tenantId,
  currentUser
}) => {
  const [pickingOrders, setPickingOrders] = useState<PickingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Known warehouses list for filtering
  const warehouses = [
    { id: 'wh_charguia', name: 'Dépôt Charguia (Z.I.)' },
    { id: 'wh_tunis', name: 'Magasin Tunis Principal' },
    { id: 'wh_sfax', name: 'Dépôt Sfax - Poudrière' },
    { id: 'wh_sousse', name: 'Stock Logistique Sousse' }
  ];

  // SLA Quai Calculator for 'pret_chargement'
  const getQuaiSlaInfo = (preparedAt?: string) => {
    if (!preparedAt) return { hours: 0, minutes: 0, formatted: '0h 0m', slaStatus: 'normal' as const };
    
    const preparedTime = new Date(preparedAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - preparedTime);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formatted = `${hours}h ${minutes}m`;

    if (hours >= 6) {
      return { hours, minutes, formatted, slaStatus: 'alert_quai' as const };
    } else if (hours >= 2) {
      return { hours, minutes, formatted, slaStatus: 'late' as const };
    }
    return { hours, minutes, formatted, slaStatus: 'normal' as const };
  };

  // 1. Firestore Real-time Listener
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const colRef = collection(db, 'company_erp_data', tenantId, 'picking_orders');
    const unsub = onSnapshot(colRef, (snap) => {
      const list: PickingOrder[] = [];
      snap.forEach((docSnap) => {
        const id = docSnap.id;
        if (!id.startsWith('PICK-FAC-2026-08') && !id.includes('demo')) {
          list.push({ id, ...docSnap.data() } as PickingOrder);
        }
      });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPickingOrders(list);
      setLoading(false);
    }, (err) => {
      console.warn('Picking orders listener error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  // Seed function disabled per user directive (no demo data)
  const handleSeedDemoPickingOrders = async () => {
    showToast('Mode données réelles actif. Aucune donnée démo injectée.', 'info');
  };

  // Status Change Handler
  const handleUpdateStatus = async (pickingOrder: PickingOrder, newStatus: PickingOrderStatus) => {
    try {
      const operator = currentUser?.name || 'Chef de Dépôt';
      const defaultDock = pickingOrder.dockNumber && pickingOrder.dockNumber !== 'Quai Non Attribué'
        ? pickingOrder.dockNumber 
        : `Quai ${Math.floor(Math.random() * 3) + 1} - ${pickingOrder.warehouseName}`;

      const updateData: Partial<PickingOrder> = {
        status: newStatus,
        ...(newStatus === 'pret_chargement' ? {
          preparedAt: new Date().toISOString(),
          preparedBy: operator,
          dockNumber: defaultDock
        } : {})
      };

      await updateDoc(doc(db, 'company_erp_data', tenantId, 'picking_orders', pickingOrder.id), updateData);

      if (newStatus === 'pret_chargement') {
        showToast(`🟢 Order ${pickingOrder.id} validé "Prêt au Quai" (${defaultDock}) par ${operator}!`, 'success');
      } else if (newStatus === 'en_cours') {
        showToast(`⚙️ Démarrage de la préparation pour ${pickingOrder.id}`, 'info');
      }
    } catch (err) {
      console.error('Error updating picking status:', err);
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    }
  };

  // Reverse Logistics: Validate Stock Re-integration and trigger Credit Note + Refund Order
  const handleReintegrateStock = async (po: PickingOrder) => {
    try {
      const operator = currentUser?.name || 'Chef de Dépôt';
      const nowIso = new Date().toISOString();

      // 1. Update Picking Order Status
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'picking_orders', po.id), {
        reintegrationStatus: 'reintegre',
        reintegratedAt: nowIso,
        reintegratedBy: operator
      });

      // 2. Generate Credit Note (Avoir Client)
      const creditNoteId = `AV-${Date.now().toString().slice(-6)}`;
      const amount = po.totalAmountTTC || 1850.000;

      await setDoc(doc(db, 'company_erp_data', tenantId, 'credit_notes', creditNoteId), {
        id: creditNoteId,
        tenantId,
        clientName: po.clientName,
        invoiceId: po.orderId,
        invoiceNumber: po.orderId,
        amountTTC: amount,
        reason: `Annulation commande & réintégration stock au dépôt (${po.id})`,
        issuedDate: nowIso.split('T')[0],
        status: 'VALIDE',
        paymentMethod: 'AVOIR_COMPTE'
      });

      // 3. Generate Refund Order (Comptabilité & Trésorerie)
      const refundOrderId = `REM-${Date.now().toString().slice(-6)}`;
      await setDoc(doc(db, 'company_erp_data', tenantId, 'refund_orders', refundOrderId), {
        id: refundOrderId,
        tenantId,
        clientName: po.clientName,
        sourceType: 'RETOUR_DEPOT',
        sourceRef: po.orderId,
        amount,
        reason: `Remboursement suite annulation client & réintégration stock (${po.id})`,
        status: 'EN_ATTENTE',
        paymentMethod: 'CHEQUE',
        createdAt: nowIso
      });

      showToast(
        `✅ Stock réintégré en rayon ! Avoir Client ${creditNoteId} & Ordre de Remboursement ${refundOrderId} transmis en Comptabilité.`,
        'success'
      );
    } catch (err) {
      console.error('Error reintegrating stock:', err);
      showToast('Erreur lors de la réintégration stock.', 'error');
    }
  };

  // Orders scoped to currently selected warehouse (or all warehouses if 'ALL')
  const warehouseOrders = useMemo(() => {
    if (selectedWarehouseFilter === 'ALL') return pickingOrders;
    return pickingOrders.filter(po => 
      po.warehouseId === selectedWarehouseFilter || po.warehouseName.includes(selectedWarehouseFilter)
    );
  }, [pickingOrders, selectedWarehouseFilter]);

  // Filtered picking orders (by warehouse, status, date, and search term)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return warehouseOrders.filter(po => {
      const matchStatus = selectedStatusFilter === 'ALL' || po.status === selectedStatusFilter;
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        po.id.toLowerCase().includes(query) || 
        po.orderId.toLowerCase().includes(query) || 
        po.clientName.toLowerCase().includes(query) ||
        po.warehouseName.toLowerCase().includes(query) ||
        po.items.some(i => i.productName.toLowerCase().includes(query));

      // Date Filtering
      let matchDate = true;
      if (po.createdAt) {
        const poDateStr = po.createdAt.split('T')[0];
        const poDate = new Date(po.createdAt);

        if (dateFilter === 'today') {
          matchDate = poDateStr === todayStr;
        } else if (dateFilter === 'yesterday') {
          matchDate = poDateStr === yesterdayStr;
        } else if (dateFilter === 'this_week') {
          matchDate = poDate >= sevenDaysAgo;
        } else if (dateFilter === 'custom') {
          if (customStartDate && poDateStr < customStartDate) matchDate = false;
          if (customEndDate && poDateStr > customEndDate) matchDate = false;
        }
      }

      return matchStatus && matchSearch && matchDate;
    });
  }, [warehouseOrders, selectedStatusFilter, searchTerm, dateFilter, customStartDate, customEndDate]);

  // Statistics dynamically calculated for selected warehouse (or global if 'ALL')
  const pendingCount = useMemo(() => warehouseOrders.filter(p => p.status === 'en_attente').length, [warehouseOrders]);
  const inProgressCount = useMemo(() => warehouseOrders.filter(p => p.status === 'en_cours').length, [warehouseOrders]);
  const readyCount = useMemo(() => warehouseOrders.filter(p => p.status === 'pret_chargement').length, [warehouseOrders]);
  const cancelledCount = useMemo(() => warehouseOrders.filter(p => p.status === 'annule').length, [warehouseOrders]);

  // SLA Alerts Count (> 6h at dock)
  const alertQuaiOrders = useMemo(() => {
    return warehouseOrders.filter(p => {
      if (p.status !== 'pret_chargement' || !p.preparedAt) return false;
      const sla = getQuaiSlaInfo(p.preparedAt);
      return sla.slaStatus === 'alert_quai' || sla.slaStatus === 'late';
    });
  }, [warehouseOrders]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen font-sans" id="warehouse-picking-screen">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-6 z-50 p-4 rounded-2xl font-black text-xs shadow-2xl flex items-center space-x-2 border animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
            : toast.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500'
            : 'bg-sky-500 text-slate-950 border-sky-400'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 p-6 rounded-3xl border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Boxes className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                  ESPACE CHEF DE DÉPÔT & LOGISTIQUE
                </span>
                <span className="text-xs text-slate-400 font-mono">• Elyssa ERP</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white font-display mt-0.5">
                Gestion des Préparations & Dépôts (Multi-Warehouse Picking)
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSeedDemoPickingOrders}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
              title="Générer des bons de test"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Générer Démos & SLA</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-medium max-w-3xl leading-relaxed">
          Traitez les ordres de colisage par entrepôt, préparez les colis au quai de chargement, surveillez les SLA d'enlèvement quai et gérez les réintégrations stock après annulation.
        </p>

        {/* High Priority Quai Alert Banner */}
        {alertQuaiOrders.length > 0 && (
          <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-rose-200 animate-pulse shadow-2xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-white uppercase text-sm block">
                  🚨 ALERTE QUAI : Colis non récupéré par le chauffeur ({alertQuaiOrders.length} bon(s) &gt; 2h / 6h quai) !
                </span>
                <p className="text-rose-300 font-medium mt-0.5">
                  Des commandes emballées stagnent au quai de chargement sans prise en charge chauffeur. Risque d'encombrement du quai.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStatusFilter('pret_chargement')}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shrink-0 transition cursor-pointer"
            >
              Voir les Quais en Souffrance
            </button>
          </div>
        )}

        {/* Real-time Alert Banner if Pending Orders */}
        {pendingCount > 0 && alertQuaiOrders.length === 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-300 animate-pulse">
            <div className="flex items-center space-x-2.5">
              <BellRing className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-extrabold">
                🚨 ALERTE DÉPÔT : {pendingCount} bon(s) de préparation en attente de traitement au quai !
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-200 px-2 py-0.5 rounded border border-amber-800">
              Action Requise
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 font-mono block">EN ATTENTE</span>
            <span className="text-2xl font-black text-white font-mono">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 block">Non démarrés au dépôt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-sky-500/30 p-4 rounded-2xl shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-sky-400 font-mono block">EN COURS DE COLISAGE</span>
            <span className="text-2xl font-black text-white font-mono">{inProgressCount}</span>
            <span className="text-[10px] text-slate-400 block">En préparation sur rayonnage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-400 font-mono block">PRÊTS AU QUAI</span>
            <span className="text-2xl font-black text-white font-mono">{readyCount}</span>
            <span className="text-[10px] text-slate-400 block">Prêts pour chargement chauffeur</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-400 font-mono block">ANNULÉS / RETOURS</span>
            <span className="text-2xl font-black text-white font-mono">{cancelledCount}</span>
            <span className="text-[10px] text-slate-400 block">À réintégrer en rayon</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        
        {/* Row 1: Warehouse & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Warehouse Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1 shrink-0">
              <Warehouse className="w-4 h-4 text-amber-400" />
              <span>Dépôt:</span>
            </span>

            <button
              onClick={() => setSelectedWarehouseFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedWarehouseFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tous les Dépôts
            </button>

            {warehouses.map(wh => (
              <button
                key={wh.id}
                onClick={() => setSelectedWarehouseFilter(wh.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedWarehouseFilter === wh.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {wh.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher bon, facture, client..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Row 2: Date Range Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="font-bold text-slate-400 flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Période:</span>
          </span>

          <button
            onClick={() => setDateFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              dateFilter === 'all' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes les Dates
          </button>

          <button
            onClick={() => setDateFilter('today')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              dateFilter === 'today' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Aujourd'hui
          </button>

          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              dateFilter === 'yesterday' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Hier
          </button>

          <button
            onClick={() => setDateFilter('this_week')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              dateFilter === 'this_week' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Cette Semaine
          </button>

          <button
            onClick={() => setDateFilter('custom')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              dateFilter === 'custom' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Personnalisé
          </button>

          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 ml-2">
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
              />
              <span className="text-slate-500">-</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 border-t border-slate-800 pt-3">
          <span className="text-xs font-bold text-slate-400 shrink-0">Statut:</span>
          
          <button
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tous ({warehouseOrders.length})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('en_attente')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatusFilter === 'en_attente' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏳ En attente ({pendingCount})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('en_cours')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatusFilter === 'en_cours' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ En cours ({inProgressCount})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('pret_chargement')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatusFilter === 'pret_chargement' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            🟢 Prêts au Quai ({readyCount})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('annule')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatusFilter === 'annule' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            🚫 Annulés / Retours ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Main Grid / Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-amber-400" />
          <span>Chargement des bons de préparation...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Aucun bon de préparation trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aucun bon de préparation pour cet entrepôt ne correspond aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((po) => {
            const isReady = po.status === 'pret_chargement';
            const isInProgress = po.status === 'en_cours';
            const isCancelled = po.status === 'annule';

            // SLA calculation for ready items
            const slaInfo = isReady ? getQuaiSlaInfo(po.preparedAt) : null;

            return (
              <div 
                key={po.id}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition space-y-4 ${
                  isCancelled
                    ? 'border-rose-600/80 bg-rose-950/20'
                    : isReady 
                    ? slaInfo?.slaStatus === 'alert_quai'
                      ? 'border-rose-500/80 bg-rose-950/20'
                      : slaInfo?.slaStatus === 'late'
                      ? 'border-amber-500/80 bg-slate-900'
                      : 'border-emerald-500/40 bg-slate-900/90' 
                    : isInProgress
                    ? 'border-sky-500/40'
                    : 'border-amber-500/40 bg-slate-900/80'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                        {po.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">
                        Réf Facture: <strong className="text-white">{po.orderId}</strong>
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base mt-1.5 flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{po.warehouseName}</span>
                    </h3>
                    {po.dockNumber && (
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80 inline-block mt-1">
                        📍 {po.dockNumber}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center space-x-1.5 ${
                    isCancelled
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isReady 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : isInProgress
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isCancelled && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    {isReady && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {isInProgress && <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />}
                    {!isReady && !isInProgress && !isCancelled && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span>
                      {isCancelled ? '🚫 COMMANDE ANNULÉE' : isReady ? 'PRÊT AU QUAI' : isInProgress ? 'EN PRÉPARATION' : 'EN ATTENTE'}
                    </span>
                  </span>
                </div>

                {/* SLA Quai Badge if Prêt au Quai */}
                {isReady && slaInfo && (
                  <div className={`p-2.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-between ${
                    slaInfo.slaStatus === 'alert_quai'
                      ? 'bg-rose-950/80 text-rose-200 border-rose-500 animate-pulse'
                      : slaInfo.slaStatus === 'late'
                      ? 'bg-amber-950/80 text-amber-200 border-amber-500'
                      : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        {slaInfo.slaStatus === 'alert_quai'
                          ? `🚨 ALERTE QUAI : Colis non récupéré par le chauffeur (${slaInfo.formatted})`
                          : slaInfo.slaStatus === 'late'
                          ? `🟠 Enlèvement en retard : Stagnation Quai (${slaInfo.formatted})`
                          : `🟢 SLA Quai Normal : Mis au quai depuis ${slaInfo.formatted}`}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      SLA Quai
                    </span>
                  </div>
                )}

                {/* Reverse Logistics Alert if Cancelled */}
                {isCancelled && (
                  <div className="p-3 bg-rose-950/90 border border-rose-500/60 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-rose-300 font-extrabold">
                      <span className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>🚫 Annulation Facture/Commande - Reverse Logistics</span>
                      </span>
                      <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 font-mono">
                        {po.reintegrationStatus === 'reintegre' ? '✅ RÉINTÉGRÉ' : '⚠️ REPARATION/RETOUR'}
                      </span>
                    </div>

                    {po.cancellationReason && (
                      <p className="text-[11px] text-rose-200 italic font-mono bg-rose-900/40 p-2 rounded">
                        Motif: "{po.cancellationReason}"
                      </p>
                    )}

                    {/* Stock Reintegration Status */}
                    {po.reintegrationStatus === 'reintegre' ? (
                      <div className="text-[11px] text-emerald-300 font-mono bg-emerald-950/50 p-2 rounded border border-emerald-500/30 flex items-center justify-between">
                        <span>✅ Stock réintégré en rayon par {po.reintegratedBy}</span>
                        <span>{po.reintegratedAt ? new Date(po.reintegratedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReintegrateStock(po)}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2 rounded-lg text-xs flex items-center justify-center space-x-2 transition cursor-pointer border border-rose-400 shadow-lg"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>📦 Générer Bon de Réintégration Stock & Régulariser comptabilité</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Client & Delivery Info */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center space-x-2 text-slate-200 font-bold">
                    <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Client: {po.clientName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">{po.deliveryAddress}</span>
                  </div>
                </div>

                {/* Table of Items to Pick */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                    Articles à Coliser ({po.items.length}) :
                  </span>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Article / Produit</th>
                          <th className="p-2.5 text-right">Qté à Charger</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {po.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 font-medium">
                              <span className="block font-bold text-white">{item.productName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">SKU: {item.productId}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-amber-400 text-sm">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prepared info if finished */}
                {isReady && po.preparedBy && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono flex items-center justify-between">
                    <span>Préparé par: {po.preparedBy}</span>
                    <span>{po.preparedAt ? new Date(po.preparedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                )}

                {/* Action Footer Buttons */}
                {!isCancelled && (
                  <div className="pt-2 flex items-center space-x-3">
                    {!isReady && (
                      <>
                        {!isInProgress && (
                          <button
                            onClick={() => handleUpdateStatus(po, 'en_cours')}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-sky-300 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition cursor-pointer border border-sky-500/30"
                          >
                            <RefreshCw className="w-4 h-4 text-sky-400" />
                            <span>Démarrer Colisage</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateStatus(po, 'pret_chargement')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer border-0"
                          id={`btn-mark-ready-picking-${po.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>🟢 Marquer Prêt au Quai</span>
                        </button>
                      </>
                    )}

                    {isReady && (
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-center text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Colisage Prêt - Transmis au Dispatching</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
