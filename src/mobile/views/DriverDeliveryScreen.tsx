import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { DeliveryTour, DeliveryTourOrder } from '../../types/mobileTerrain';
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
  PenTool
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

  // Signature Modal State
  const [selectedOrderForSignature, setSelectedOrderForSignature] = useState<{ tour: DeliveryTour; order: DeliveryTourOrder } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const toursCol = collection(db, 'company_erp_data', tenantId, 'delivery_tours');
    const unsub = onSnapshot(toursCol, (snap) => {
      const tours: DeliveryTour[] = [];
      snap.forEach((docSnap) => {
        const t = { id: docSnap.id, ...docSnap.data() } as DeliveryTour;
        // Keep active or recent tours for driver
        tours.push(t);
      });
      tours.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Filter by driverId if specified
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
    ctx.strokeStyle = '#0284c7'; // Sky-600 color for signature ink
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

  // Confirm Delivery with Signature
  const handleConfirmSignatureAndDeliver = async () => {
    if (!selectedOrderForSignature) return;
    const { tour, order } = selectedOrderForSignature;

    let signatureDataUrl = '';
    const canvas = canvasRef.current;
    if (canvas) {
      signatureDataUrl = canvas.toDataURL('image/png');
    }

    try {
      const updatedOrders: DeliveryTourOrder[] = tour.orders.map(o => {
        if (o.order_id === order.order_id) {
          return {
            ...o,
            delivery_status: 'livre',
            delivered_at: new Date().toISOString(),
            signatureUrl: signatureDataUrl || undefined
          };
        }
        return o;
      });

      const allDelivered = updatedOrders.every(o => o.delivery_status === 'livre');
      const newStatus = allDelivered ? 'terminee' : tour.status;

      // 1. Update Tour in Firestore
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tour.id), {
        orders: updatedOrders,
        status: newStatus
      });

      // 2. Update Invoice in Firestore
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'invoices', order.order_id), {
        delivery_status: 'livre',
        signatureUrl: signatureDataUrl || undefined
      });

      setSelectedOrderForSignature(null);
      showToast(`✅ Livraison ${order.order_id} validée avec signature client !`);
    } catch (err: any) {
      console.error('Error confirming delivery with signature:', err);
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
          Emplacement des entrepôts de ramassage, adresses clients & signature numérique.
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
            const isCompleted = tour.status === 'terminee';
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
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}>
                      {isCompleted ? 'TERMINÉE' : 'EN COURS'}
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

                        {/* Multi-Warehouse Pickup Stops (Arrêts de Ramassage Chronologiques) */}
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

                        {/* Signature preview if already signed */}
                        {ord.signatureUrl && (
                          <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono">
                              Signature Réceptionnée
                            </span>
                            <img src={ord.signatureUrl} alt="Signature Client" className="h-8 max-w-[100px] object-contain invert" />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center justify-between">
                          {isLivre ? (
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs font-mono">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>LIVRAISON VALIDÉE</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedOrderForSignature({ tour, order: ord })}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer border-0"
                              id={`btn-open-signature-order-${ord.order_id}`}
                            >
                              <PenTool className="w-4 h-4" />
                              <span>Prendre Signature & Valider</span>
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

      {/* SIGNATURE MODAL OVERLAY */}
      {selectedOrderForSignature && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 font-mono block">
                  ÉTAPES DE VALIDATION LIVRAISON
                </span>
                <h3 className="text-base font-black text-white">
                  Signature du Client
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: {selectedOrderForSignature.order.client_name} ({selectedOrderForSignature.order.order_id})
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderForSignature(null)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Veuillez faire signer le client ci-dessous :</span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center space-x-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 bg-white rounded-2xl overflow-hidden touch-none shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair bg-white"
                  id="delivery-signature-canvas"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              ✍️ En appuyant sur "Valider la Livraison", la preuve de réception avec signature sera archivée électroniquement dans le dossier client Firestore.
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
                <span>Valider la Livraison</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
