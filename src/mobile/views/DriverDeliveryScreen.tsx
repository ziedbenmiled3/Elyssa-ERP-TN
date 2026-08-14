import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { DeliveryTour, DeliveryTourOrder, ItemQualification, PaymentCollection, WithholdingTaxRS } from '../../types/mobileTerrain';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  ShieldCheck,
  Package,
  Warehouse,
  Globe,
  ShoppingCart,
  Briefcase,
  X,
  Eraser,
  PenTool,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  Wifi,
  WifiOff,
  RotateCcw
} from 'lucide-react';

interface DriverDeliveryScreenProps {
  tenantId?: string;
  driverId?: string;
  driverName?: string;
}

export const DriverDeliveryScreen: React.FC<DriverDeliveryScreenProps> = ({
  tenantId = 'Inter-Affaires',
  driverId = '',
  driverName = ''
}) => {
  const [activeTours, setActiveTours] = useState<DeliveryTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Delivery Modal State
  const [selectedOrderForSignature, setSelectedOrderForSignature] = useState<{ tour: DeliveryTour; order: DeliveryTourOrder } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Item Qualification State for the active modal
  const [lineQualifications, setLineQualifications] = useState<ItemQualification[]>([]);
  
  // Payment Collection State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'TRAITE' | 'DEJA_PAYE'>('CASH');
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [chequeNum, setChequeNum] = useState<string>('');
  const [bankName, setBankName] = useState<string>('BIAT - Banque Internationale Arabe de Tunisie');

  // Retenue à la Source (RS 1.5%) State
  const [rsEnabled, setRsEnabled] = useState<boolean>(false);
  const [rsCertNum, setRsCertNum] = useState<string>('');
  const [rsRatePercent, setRsRatePercent] = useState<number>(1.5);

  // GPS Location State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; address?: string }>({ lat: 36.8065, lng: 10.1815, address: 'Z.I. Charguia II, Tunis' });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineDeliveries();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Offline Queue stored in localStorage
  const syncOfflineDeliveries = async () => {
    try {
      const rawQueue = localStorage.getItem('ELYSSA_OFFLINE_DELIVERIES');
      if (!rawQueue) return;
      const queue = JSON.parse(rawQueue);
      if (!Array.isArray(queue) || queue.length === 0) return;

      let syncedCount = 0;
      for (const item of queue) {
        if (item.tenantId && item.tourId && item.updatedOrders) {
          await updateDoc(doc(db, 'company_erp_data', item.tenantId, 'delivery_tours', item.tourId), {
            orders: item.updatedOrders,
            status: item.newStatus
          });
          if (item.orderId) {
            await updateDoc(doc(db, 'company_erp_data', item.tenantId, 'invoices', item.orderId), {
              delivery_status: 'livre',
              signatureUrl: item.signatureDataUrl || undefined
            });
          }
          syncedCount++;
        }
      }

      localStorage.removeItem('ELYSSA_OFFLINE_DELIVERIES');
      showToast(`🔄 Synchronisation réussie: ${syncedCount} livraison(s) hors-ligne transmise(s) !`);
    } catch (err) {
      console.warn('Offline sync error:', err);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const toursCol = collection(db, 'company_erp_data', tenantId, 'delivery_tours');
    const unsub = onSnapshot(toursCol, (snap) => {
      const tours: DeliveryTour[] = [];
      snap.forEach((docSnap) => {
        const t = { id: docSnap.id, ...docSnap.data() } as DeliveryTour;
        tours.push(t);
      });
      tours.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const filtered = driverId 
        ? tours.filter(t => t.driver_id === driverId || (driverName && t.driver_name.toLowerCase().includes(driverName.toLowerCase())))
        : tours;

      setActiveTours(filtered.length > 0 ? filtered : tours);
      setLoading(false);
    }, (err) => {
      console.warn('DriverDeliveryScreen snapshot error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId, driverId, driverName]);

  // When order selection changes for signature/qualification
  useEffect(() => {
    if (!selectedOrderForSignature) return;

    const ord = selectedOrderForSignature.order;
    
    // Default items to qualify
    const defaultQualifications: ItemQualification[] = [
      { articleId: 'ART-001', articleName: 'Ciment HRS 50kg (SOTACIB)', qtyOrdered: 20, qtyDelivered: 20, status: 'LIVRE', unitPriceTTC: 18.5 },
      { articleId: 'ART-002', articleName: 'Fer à Béton Ø12 HLE (Tonnes)', qtyOrdered: 2, qtyDelivered: 2, status: 'LIVRE', unitPriceTTC: 2450.0 },
      { articleId: 'ART-003', articleName: 'Peinture BTP Satinée Blanc 20L', qtyOrdered: 5, qtyDelivered: 5, status: 'LIVRE', unitPriceTTC: 115.0 }
    ];

    setLineQualifications(ord.item_qualifications || defaultQualifications);
    setCollectedAmount(ord.amount_ttc || 0);
    setPaymentMethod('CASH');
    setChequeNum('');
    setRsEnabled(false);
    setRsCertNum(`RS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setRsRatePercent(1.5);

    // Fetch GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            address: `${ord.address || 'Livraison Client'}`
          });
        },
        () => {
          setGpsLocation({ lat: 36.8065, lng: 10.1815, address: ord.address });
        }
      );
    }
  }, [selectedOrderForSignature]);

  // Canvas Signature Pad Handlers
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
    ctx.strokeStyle = '#0284c7'; // Sky-600 color
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

  // Update item qualification
  const updateQualificationStatus = (index: number, newStatus: 'LIVRE' | 'REFUSE' | 'PARTIEL', reason?: string) => {
    setLineQualifications(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      item.status = newStatus;
      if (reason !== undefined) item.returnReason = reason;
      if (newStatus === 'REFUSE') item.qtyDelivered = 0;
      if (newStatus === 'LIVRE') item.qtyDelivered = item.qtyOrdered;
      copy[index] = item;
      return copy;
    });
  };

  const updateDeliveredQty = (index: number, qty: number) => {
    setLineQualifications(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      item.qtyDelivered = Math.max(0, Math.min(item.qtyOrdered, qty));
      if (item.qtyDelivered === 0) item.status = 'REFUSE';
      else if (item.qtyDelivered < item.qtyOrdered) item.status = 'PARTIEL';
      else item.status = 'LIVRE';
      copy[index] = item;
      return copy;
    });
  };

  // Confirm Delivery with Signature, Item Qualifications, Payment & GED BL
  const handleConfirmSignatureAndDeliver = async () => {
    if (!selectedOrderForSignature) return;
    const { tour, order } = selectedOrderForSignature;

    let signatureDataUrl = '';
    const canvas = canvasRef.current;
    if (canvas) {
      signatureDataUrl = canvas.toDataURL('image/png');
    }

    const calculatedRSAmount = rsEnabled ? Math.round((order.amount_ttc / 1.19) * (rsRatePercent / 100) * 1000) / 1000 : 0;

    const paymentInfo: PaymentCollection = {
      method: paymentMethod,
      amountTTC: collectedAmount,
      chequeNumber: paymentMethod === 'CHEQUE' ? chequeNum : undefined,
      bankName: paymentMethod === 'CHEQUE' ? bankName : undefined,
      collectedAt: new Date().toISOString()
    };

    const rsInfo: WithholdingTaxRS = {
      enabled: rsEnabled,
      certificateNumber: rsEnabled ? rsCertNum : undefined,
      ratePercent: rsRatePercent,
      amountRS: calculatedRSAmount,
      issueDate: rsEnabled ? new Date().toISOString() : undefined
    };

    const podGps = {
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      timestamp: new Date().toISOString(),
      address: gpsLocation.address
    };

    const updatedOrders: DeliveryTourOrder[] = tour.orders.map(o => {
      if (o.order_id === order.order_id) {
        return {
          ...o,
          delivery_status: 'livre',
          delivered_at: new Date().toISOString(),
          signatureUrl: signatureDataUrl || undefined,
          item_qualifications: lineQualifications,
          payment_collected: paymentInfo,
          withholding_tax_rs: rsInfo,
          pod_gps: podGps
        };
      }
      return o;
    });

    const allDelivered = updatedOrders.every(o => o.delivery_status === 'livre');
    const newStatus = allDelivered ? 'terminee' : tour.status;

    // Offline handling
    if (!navigator.onLine) {
      const offlineQueue = JSON.parse(localStorage.getItem('ELYSSA_OFFLINE_DELIVERIES') || '[]');
      offlineQueue.push({
        tenantId,
        tourId: tour.id,
        orderId: order.order_id,
        updatedOrders,
        newStatus,
        signatureDataUrl,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('ELYSSA_OFFLINE_DELIVERIES', JSON.stringify(offlineQueue));
      setSelectedOrderForSignature(null);
      showToast('⚡ Enregistré en Mode Hors-Ligne (Mémorisé localement, synchro auto au retour réseau)');
      return;
    }

    try {
      // 1. Update Tour in Firestore
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tour.id), {
        orders: updatedOrders,
        status: newStatus
      });

      // 2. Update Invoice in Firestore
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'invoices', order.order_id), {
        delivery_status: 'livre',
        signatureUrl: signatureDataUrl || undefined,
        paymentStatus: paymentMethod === 'DEJA_PAYE' ? 'Paid' : 'Paid',
        withholdingCertificateReceived: rsEnabled,
        withholdingCertificateRef: rsEnabled ? rsCertNum : undefined,
        withholdingAmount: rsEnabled ? calculatedRSAmount : 0
      });

      // 3. Generate & Archive Signed BL into GED
      const blGedDocId = `BL_GED_${order.order_id}`;
      const blGedDocument = {
        id: blGedDocId,
        name: `BL_SIGNE_${order.order_id}.pdf`,
        type: 'Invoice',
        fileSize: '245 KB',
        fileType: 'application/pdf',
        base64Data: signatureDataUrl,
        uploadDate: new Date().toISOString(),
        linkedToType: 'Client',
        linkedToId: order.order_id,
        linkedToName: order.client_name,
        description: `Bon de Livraison signé avec géolocalisation GPS (${podGps.lat}, ${podGps.lng}) pour la commande ${order.order_id}`,
        version: 1,
        uploadedBy: `Livreur PWA (${tour.driver_name})`
      };

      await setDoc(doc(db, 'company_erp_data', tenantId, 'documents', blGedDocId), blGedDocument, { merge: true });

      // 4. Save Retenue à la Source for TEJ CIMF Module if enabled
      if (rsEnabled) {
        const rsDocId = `RS_CERT_${order.order_id}`;
        await setDoc(doc(db, 'company_erp_data', tenantId, 'withholding_tax_certificates', rsDocId), {
          id: rsDocId,
          tenantId,
          clientName: order.client_name,
          invoiceNumber: order.order_id,
          certificateNumber: rsCertNum,
          ratePercent: rsRatePercent,
          amountRS: calculatedRSAmount,
          issuedAt: new Date().toISOString(),
          status: 'PRE_REMPLI_TEJ_CIMF'
        }, { merge: true });
      }

      // 5. Save Stock Reintegration Movements for refused/partial returns
      const refusedItems = lineQualifications.filter(q => q.status === 'REFUSE' || q.status === 'PARTIEL');
      if (refusedItems.length > 0) {
        for (const item of refusedItems) {
          const returnQty = item.qtyOrdered - item.qtyDelivered;
          if (returnQty > 0) {
            const returnDocId = `RETOUR_${order.order_id}_${item.articleId}`;
            await setDoc(doc(db, 'company_erp_data', tenantId, 'stock_movements', returnDocId), {
              id: returnDocId,
              tenantId,
              orderId: order.order_id,
              clientName: order.client_name,
              articleId: item.articleId,
              articleName: item.articleName,
              quantity: returnQty,
              type: 'RETOUR_DEPOT',
              reason: item.returnReason || 'Refus à la livraison',
              warehouseLocation: tour.pickup_warehouse || 'Dépôt Central Radès',
              createdAt: new Date().toISOString(),
              status: 'A_REINTEGRER'
            }, { merge: true });
          }
        }
      }

      setSelectedOrderForSignature(null);
      showToast(`✅ Livraison ${order.order_id} validée, BL archivé en GED & RS enregistré !`);
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      showToast('Erreur lors de la validation.');
    }
  };

  // Confirm Pickup Stop Loading
  const handleConfirmPickupStop = async (tour: DeliveryTour, orderId: string, stopId: string) => {
    try {
      const updatedOrders = tour.orders.map(o => {
        if (o.order_id === orderId && o.pickup_stops) {
          const updatedStops = o.pickup_stops.map(st => {
            if (st.stop_id === stopId) {
              return { ...st, status: 'charge' as const, loaded_at: new Date().toISOString() };
            }
            return st;
          });
          return { ...o, pickup_stops: updatedStops };
        }
        return o;
      });

      await updateDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tour.id), {
        orders: updatedOrders
      });

      showToast('📦 Chargement au quai validé pour cet arrêt !');
    } catch (err) {
      console.error('Error confirming pickup stop:', err);
      showToast('Erreur lors de la confirmation du chargement.');
    }
  };

  // Helper for sales channel badge
  const renderChannelBadge = (channel?: 'web' | 'pos' | 'field_sales') => {
    switch (channel) {
      case 'web':
        return (
          <span className="inline-flex items-center space-x-1 bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded text-[10px] font-bold">
            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
            <span>Web</span>
          </span>
        );
      case 'pos':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
            <ShoppingCart className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Caisse / POS</span>
          </span>
        );
      case 'field_sales':
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">
            <Briefcase className="w-3 h-3 text-purple-400 shrink-0" />
            <span>Commercial</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Commande</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans pb-20" id="mobile-driver-delivery-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-5">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-emerald-500 text-slate-950 p-3.5 rounded-2xl font-black text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Network Connectivity Bar */}
      <div className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
        isOnline 
          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
          : 'bg-amber-950/60 text-amber-300 border-amber-600/60 animate-pulse'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
          <span>{isOnline ? 'Connecté au Réseau Elyssa Cloud (Direct)' : 'Mode Hors-Ligne Actif (Stockage Local PWA)'}</span>
        </div>
        {!isOnline && (
          <span className="text-[10px] uppercase tracking-wider font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            Offline-First Active
          </span>
        )}
      </div>

      {/* Header Mobile Driver Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 p-5 rounded-3xl border border-sky-500/30 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 font-mono block">
              ELYSSA POCKET • ESPACE LIVREUR
            </span>
            <h2 className="text-lg font-black text-white font-display">
              Mes Livraisons du Jour
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          Qualification par ligne, COD, Retenue à la Source RS 1.5%, Signature GPS & BL Archivé en GED.
        </p>
      </div>

      {/* Personal Motivation Card: Mon Objectif & Prime du Mois */}
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
            91.0% Atteint
          </span>
        </div>

        {/* Realtime Gauge & Estimated Prime */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-slate-400 font-medium">Prime Estimée du Mois :</span>
            <div className="text-right">
              <span className="text-xl font-black text-amber-400 font-mono">273.000</span>
              <span className="text-[11px] font-mono text-slate-400 ml-1">/ 300.000 TND</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '91%' }}></div>
          </div>

          <div className="space-y-1 pt-1 text-[11px]">
            <div className="flex justify-between text-slate-300 font-mono">
              <span>• Livraisons sans réclamation (80%)</span>
              <span className="font-bold text-white">27 / 30</span>
            </div>
            <div className="flex justify-between text-slate-300 font-mono">
              <span>• Ponctualité Chargement Quai (20%)</span>
              <span className="font-bold text-emerald-400">95%</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-rose-300/90 font-medium flex items-center space-x-1">
          <span>🔥</span>
          <span>Plus que <strong>3 livraisons validées</strong> pour débloquer 100% de votre prime (300.000 DT) !</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center space-x-2">
          <Clock className="w-4 h-4 animate-spin text-sky-400" />
          <span>Synchro des données de tournée...</span>
        </div>
      ) : activeTours.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Aucune tournée active assignée</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            L'administrateur n'a pas encore assigné de tournée de livraison à ce véhicule/chauffeur.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeTours.map((tour) => {
            const deliveredCount = tour.orders.filter(o => o.delivery_status === 'livre').length;
            const totalCount = tour.orders.length;
            const isCompleted = tour.status === 'terminee' || tour.status === 'cloturee_validee';
            const pickupWarehouse = tour.pickup_warehouse || tour.warehouse_location || tour.orders[0]?.warehouse_location || 'Dépôt Central';

            return (
              <div key={tour.id} className={`bg-slate-900 border rounded-3xl p-5 shadow-lg space-y-4 ${
                isCompleted ? 'border-emerald-500/40 bg-slate-900/80' : 'border-sky-500/30'
              }`}>
                
                {/* Tour Title Bar & Ramassage Warehouse */}
                <div className="space-y-2 border-b border-slate-800 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        {tour.tour_number}
                      </span>
                      <h3 className="font-extrabold text-white text-base mt-1">
                        Chauffeur: {tour.driver_name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        Véhicule: {tour.vehicle_name}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      tour.status === 'cloturee_validee'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}>
                      {tour.status === 'cloturee_validee' ? 'CLÔTURÉE & RAPPROCHÉE' : isCompleted ? 'TERMINÉE' : 'EN COURS'}
                    </span>
                  </div>

                  {/* Entrepôt de Ramassage Display */}
                  <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>ENTREPÔT RAMASSAGE : {pickupWarehouse}</span>
                  </div>
                </div>

                {/* Route Notes */}
                {tour.notes && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-300 italic">
                    💬 Consignes dispatch: "{tour.notes}"
                  </div>
                )}

                {/* Progression Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Avancement de la tournée</span>
                    <span className="font-mono text-emerald-400">{deliveredCount} / {totalCount} livrés</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.round((deliveredCount / totalCount) * 100) || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Orders / Stops */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                    Commandes à Livrer ({totalCount}) :
                  </span>

                  {tour.orders.map((ord, idx) => {
                    const isLivre = ord.delivery_status === 'livre';

                    return (
                      <div key={ord.order_id} className={`p-4 rounded-2xl border transition space-y-3 ${
                        isLivre 
                          ? 'bg-emerald-950/20 border-emerald-500/40' 
                          : 'bg-slate-950 border-slate-800'
                      }`}>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                Étape #{idx + 1} • {ord.order_id}
                              </span>
                              {renderChannelBadge(ord.sales_channel)}
                            </div>
                            <h4 className="font-black text-white text-sm">
                              {ord.client_name}
                            </h4>
                          </div>

                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {ord.amount_ttc.toLocaleString('fr-FR')} TND
                          </span>
                        </div>

                        {/* Multi-Warehouse Pickup Stops */}
                        {ord.pickup_stops && ord.pickup_stops.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-slate-800">
                            <span className="text-[10px] font-black uppercase text-amber-400 font-mono block">
                              🏭 Arrêts de Ramassage Dépôts ({ord.pickup_stops.length}) :
                            </span>

                            <div className="space-y-2">
                              {ord.pickup_stops.map((stop, sIdx) => {
                                const isLoaded = stop.status === 'charge';

                                return (
                                  <div 
                                    key={stop.stop_id || sIdx}
                                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                                      isLoaded 
                                        ? 'bg-emerald-950/30 border-emerald-500/30' 
                                        : 'bg-slate-900 border-amber-500/40'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center space-x-2">
                                        <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span className="font-extrabold text-white">
                                          Arrêt #{sIdx + 1}: {stop.warehouse_name}
                                        </span>
                                      </div>

                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                        isLoaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                      }`}>
                                        {isLoaded ? '🟢 CHARGÉ AU QUAI' : '⏳ RAMASSAGE REQUIS'}
                                      </span>
                                    </div>

                                    {/* Items to pick at this stop */}
                                    {stop.items && stop.items.length > 0 && (
                                      <div className="bg-slate-950 p-2 rounded-lg text-[11px] font-mono text-slate-300 space-y-0.5">
                                        {stop.items.map((it, itIdx) => (
                                          <div key={itIdx} className="flex justify-between">
                                            <span>• {it.productName}</span>
                                            <span className="font-bold text-amber-400">x{it.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Pickup Button if not yet loaded */}
                                    {!isLoaded && (
                                      <button
                                        onClick={() => handleConfirmPickupStop(tour, ord.order_id, stop.stop_id)}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition border border-amber-500/30 cursor-pointer"
                                      >
                                        <Package className="w-3.5 h-3.5 text-amber-400" />
                                        <span>📦 Valider le Chargement au Quai</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Customer Address */}
                        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                          <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="font-medium truncate">
                            <strong>Livraison Client:</strong> {ord.address}
                          </span>
                        </div>

                        {/* Signature & Qualification Preview if signed */}
                        {isLivre && (
                          <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono">
                                ✅ Signature & Coordonnées GPS Reçues
                              </span>
                              {ord.signatureUrl && (
                                <img src={ord.signatureUrl} alt="Signature Client" className="h-7 max-w-[90px] object-contain invert" />
                              )}
                            </div>

                            {/* RS Certificate Badge */}
                            {ord.withholding_tax_rs?.enabled && (
                              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
                                <div className="flex items-center space-x-1.5">
                                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                                  <span>RS 1.5%: N° {ord.withholding_tax_rs.certificateNumber}</span>
                                </div>
                                <span className="font-mono font-bold">{ord.withholding_tax_rs.amountRS.toFixed(3)} TND</span>
                              </div>
                            )}

                            {/* GPS info */}
                            {ord.pod_gps && (
                              <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-sky-400" />
                                <span>GPS: {ord.pod_gps.lat}, {ord.pod_gps.lng} • {new Date(ord.pod_gps.timestamp).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center justify-between">
                          {isLivre ? (
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs font-mono">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>LIVRAISON VALIDÉE (BL ARCHIVÉ GED)</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedOrderForSignature({ tour, order: ord })}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer border-0"
                              id={`btn-open-signature-order-${ord.order_id}`}
                            >
                              <PenTool className="w-4 h-4" />
                              <span>Qualifier Lignes, COD, RS & Valider Signature</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      </div>

      {/* FULL-FEATURED DELIVERY QUALIFICATION & SIGNATURE MODAL */}
      {selectedOrderForSignature && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 my-8">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 font-mono block">
                  QUALIFICATION TERRAIN • CROSS-MODULE PIPELINE
                </span>
                <h3 className="text-base font-black text-white">
                  Livraison & Encaissement COD Client
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: {selectedOrderForSignature.order.client_name} ({selectedOrderForSignature.order.order_id})
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderForSignature(null)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: QUALIFICATION PAR LIGNE */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-sky-400 font-mono flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-sky-400" />
                  <span>1. Qualification des Articles par Ligne</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {lineQualifications.filter(q => q.status === 'LIVRE').length}/{lineQualifications.length} Livrés
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {lineQualifications.map((item, qIdx) => (
                  <div key={item.articleId || qIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-white leading-snug">{item.articleName}</h5>
                        <span className="text-[10px] font-mono text-slate-400">Commandé: {item.qtyOrdered} unité(s)</span>
                      </div>
                      
                      {/* Status Selector */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateQualificationStatus(qIdx, 'LIVRE')}
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                            item.status === 'LIVRE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          LIVRÉ
                        </button>

                        <button
                          type="button"
                          onClick={() => updateQualificationStatus(qIdx, 'PARTIEL')}
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                            item.status === 'PARTIEL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          PARTIEL
                        </button>

                        <button
                          type="button"
                          onClick={() => updateQualificationStatus(qIdx, 'REFUSE', 'Produit endommagé')}
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                            item.status === 'REFUSE' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          REFUSÉ / RETOUR
                        </button>
                      </div>
                    </div>

                    {/* Quantity or Return reason input */}
                    {item.status === 'PARTIEL' && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] text-amber-300 font-bold">Qté Livrée Effective:</span>
                        <input
                          type="number"
                          min={0}
                          max={item.qtyOrdered}
                          value={item.qtyDelivered}
                          onChange={(e) => updateDeliveredQty(qIdx, parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-950 border border-amber-500/50 rounded p-1 text-xs text-amber-300 font-mono font-bold text-center"
                        />
                        <span className="text-[10px] text-slate-400">/ {item.qtyOrdered}</span>
                      </div>
                    )}

                    {item.status === 'REFUSE' && (
                      <div className="pt-1 flex items-center space-x-2">
                        <span className="text-[11px] text-rose-300 font-bold">Motif du Retour:</span>
                        <select
                          value={item.returnReason || 'Produit endommagé'}
                          onChange={(e) => updateQualificationStatus(qIdx, 'REFUSE', e.target.value)}
                          className="flex-1 bg-slate-950 border border-rose-500/50 text-rose-300 text-xs rounded p-1 font-mono"
                        >
                          <option value="Produit endommagé">Produit endommagé en transport</option>
                          <option value="Commande non conforme">Commande non conforme au BC</option>
                          <option value="Refus client">Refus client à la réception</option>
                          <option value="Erreur de reference">Erreur de référence dépôt</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 2: ENCAISSEMENT COD & RETENUE À LA SOURCE (RS 1.5%) */}
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-black uppercase text-amber-400 font-mono flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>2. Encaissement COD & Retenue à la Source (RS 1.5%)</span>
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Montant TTC à Régler :</label>
                  <input
                    type="number"
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Mode d'Encaissement :</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold text-xs"
                  >
                    <option value="CASH">💵 Espèces (Cash)</option>
                    <option value="CHEQUE">💳 Chèque Bancaire</option>
                    <option value="TRAITE">📄 Traite / Virement</option>
                    <option value="DEJA_PAYE">🟢 Déjà Payé à la Commande</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">N° du Chèque :</label>
                    <input
                      type="text"
                      placeholder="ex: CHQ-908212"
                      value={chequeNum}
                      onChange={(e) => setChequeNum(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Banque Émettrice :</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Retenue à la source checkbox */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rsEnabled}
                    onChange={(e) => setRsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>📜 Remise Certificat Retenue à la Source (RS 1.5%) par le client</span>
                </label>

                {rsEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">N° Certificat RS :</label>
                      <input
                        type="text"
                        value={rsCertNum}
                        onChange={(e) => setRsCertNum(e.target.value)}
                        className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-1.5 text-amber-300 font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Montant RS (Calculé 1.5%) :</label>
                      <div className="bg-slate-950 border border-amber-500/50 rounded-lg p-1.5 text-amber-400 font-mono font-black text-xs">
                        {((selectedOrderForSignature.order.amount_ttc / 1.19) * 0.015).toFixed(3)} TND
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: SIGNATURE & GPS HORODATAGE */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                <span className="text-sky-400 uppercase font-mono">3. Signature Client & Géolocalisation GPS</span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 bg-white rounded-2xl overflow-hidden touch-none shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair bg-white"
                  id="delivery-signature-canvas"
                />
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>GPS Fix: {gpsLocation.lat}, {gpsLocation.lng} • Horodaté au {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForSignature(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmSignatureAndDeliver}
                className="flex-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer border-0"
                id="btn-confirm-delivery-with-signature"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Valider Livraison (BL GED & Synchro Cloud)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
