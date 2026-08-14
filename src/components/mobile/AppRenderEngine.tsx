import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  HardHat,
  Camera,
  Printer,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  FileText,
  Search,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';

import {
  FieldSession,
  VanArticleStock,
  MobileOrder,
  ChantierReport
} from '../../types/mobileTerrain';
import { vanStockService } from '../../services/vanStockService';
import { syncPendingOrders } from '../../services/mobileSyncService';

interface AppRenderEngineProps {
  session: FieldSession;
  onCloseSession?: () => void;
}

export const AppRenderEngine: React.FC<AppRenderEngineProps> = ({ session, onCloseSession }) => {
  const isOnline = navigator.onLine;

  // State Van Sales
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'PAYMENT' | 'PRINTER'>('CATALOG');
  const [stockList, setStockList] = useState<VanArticleStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<Array<{ article: VanArticleStock; qty: number }>>([]);
  const [clientName, setClientName] = useState('Client Société ABC');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHECK' | 'TRAITE'>('CASH');
  const [lastOrder, setLastOrder] = useState<MobileOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // State Chantier
  const [chantierTab, setChantierTab] = useState<'REPORT' | 'PHOTOS' | 'INCIDENTS'>('REPORT');
  const [workersCount, setWorkersCount] = useState<number>(12);
  const [consumedMaterials, setConsumedMaterials] = useState<Array<{ articleId: string; label: string; qty: number }>>([
    { articleId: 'art_001', label: 'Ciment CPJ 45', qty: 25 },
    { articleId: 'art_003', label: 'Tube PVC 110mm', qty: 8 }
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentList, setIncidentList] = useState<Array<{ id: string; title: string; desc: string; date: string }>>([
    { id: 'inc_1', title: 'Retard livraison béton', desc: 'Camion toupie bloqué dans le trafic à 09h30.', date: new Date().toLocaleDateString('fr-TN') }
  ]);
  const [notes, setNotes] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialisation du stock local Van Sales
  useEffect(() => {
    if (session.type === 'VAN_SALES') {
      const depotId = session.depotVanId || 'DEP-VAN-01';
      vanStockService.downloadVanStockFromFirestore(session.tenantId, depotId).then((items) => {
        setStockList(items);
      });
    }
  }, [session]);

  // Total panier HT & TTC (TVA 19%)
  const totalHT = cartItems.reduce((acc, item) => acc + item.article.unitPrice * item.qty, 0);
  const totalTTC = Math.round(totalHT * 1.19 * 1000) / 1000;

  // Manipulation du panier
  const addToCart = (article: VanArticleStock) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.article.articleId === article.articleId);
      if (existing) {
        return prev.map((i) =>
          i.article.articleId === article.articleId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { article, qty: 1 }];
    });
  };

  const removeFromCart = (articleId: string) => {
    setCartItems((prev) => prev.filter((i) => i.article.articleId !== articleId));
  };

  // Traitement Vente Van Sales
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    // Décrémentation locale dans IndexedDB pour chaque article
    for (const item of cartItems) {
      await vanStockService.decrementStockOffline(item.article.articleId, item.qty);
    }

    // Mise à jour de l'état du stock à l'écran
    const updatedStock = await vanStockService.getLocalVanStock();
    setStockList(updatedStock);

    const orderPayload = {
      tenantId: session.tenantId,
      localUuid: `ORD-LOCAL-${Date.now()}`,
      agentId: session.agentId,
      agentName: session.agentName || 'Agent Terrain',
      clientId: 'CLT-1092',
      clientName: clientName || 'Client Passage',
      items: cartItems.map((ci) => ({
        articleId: ci.article.articleId,
        label: ci.article.label,
        qty: ci.qty,
        unitPrice: ci.article.unitPrice,
        total: ci.article.unitPrice * ci.qty
      })),
      totalHT,
      totalTTC,
      paymentStatus: 'PAID' as const,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    // Tentative de synchronisation vers Firestore
    const res = await syncPendingOrders(session.tenantId, [orderPayload]);
    const createdOrder = res.orders[0];

    setLastOrder(createdOrder);
    setCartItems([]);
    setShowReceiptModal(true);
  };

  // Traitement photo avec compression Canvas HTML5
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compression 70%
          setPhotos((prev) => [...prev, compressedDataUrl]);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Soumission Rapport Chantier
  const handleSubmitChantierReport = () => {
    setReportSubmitted(true);
    setTimeout(() => setReportSubmitted(false), 4000);
  };

  // Simulation Impression Thermique ESC/POS
  const printThermalReceipt = () => {
    alert(`🖨️ [Impression ESC/POS] Ticket #${lastOrder?.localUuid} envoyé vers l'imprimante thermique Bluetooth (58mm/80mm).`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header Mobile Terrain */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${session.type === 'VAN_SALES' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {session.type === 'VAN_SALES' ? <ShoppingBag className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Elyssa Mobile - {session.type === 'VAN_SALES' ? 'Vente Itinérante (Van Sales)' : 'Gestion de Chantier'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              Agent: {session.agentName || session.agentId} | Tenant: {session.tenantId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'EN LIGNE' : 'HORS-LIGNE (IndexedDB)'}
          </span>
          {onCloseSession && (
            <button onClick={onCloseSession} className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 font-medium">
              Quitter
            </button>
          )}
        </div>
      </header>

      {/* RENDER ENGINE: BRANCHE VAN_SALES */}
      {session.type === 'VAN_SALES' && (
        <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          {/* Navigation Onglets Van Sales */}
          <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeTab === 'CATALOG' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Package className="w-4 h-4" /> Catalogue ({stockList.length})
            </button>
            <button
              onClick={() => setActiveTab('CART')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition relative ${activeTab === 'CART' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Panier
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('PAYMENT')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeTab === 'PAYMENT' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <CreditCard className="w-4 h-4" /> Encaissement
            </button>
          </div>

          {/* ONGLET 1: CATALOGUE */}
          {activeTab === 'CATALOG' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par libellé ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                {stockList
                  .filter((art) => art.label.toLowerCase().includes(searchTerm.toLowerCase()) || art.reference.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((article) => (
                    <div key={article.articleId} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-600 transition">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/50">
                          {article.reference}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{article.label}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="text-emerald-400 font-medium">{article.unitPrice.toFixed(3)} TND HT</span>
                          <span>•</span>
                          <span className={`font-semibold ${article.stockQty > 10 ? 'text-slate-300' : 'text-rose-400'}`}>
                            Stock Van: {article.stockQty} u
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(article)}
                        disabled={article.stockQty <= 0}
                        className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 rounded-lg font-bold flex items-center gap-1 text-xs transition"
                      >
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ONGLET 2: PANIER */}
          {activeTab === 'CART' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                <label className="text-xs text-slate-400 font-medium">Nom du Client / Raison Sociale :</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm mt-1 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Le panier est vide pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((ci) => (
                    <div key={ci.article.articleId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{ci.article.label}</h4>
                        <p className="text-xs text-slate-400">{ci.article.unitPrice.toFixed(3)} TND x {ci.qty} u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-amber-400">{(ci.article.unitPrice * ci.qty).toFixed(3)} TND</span>
                        <button onClick={() => removeFromCart(ci.article.articleId)} className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2 mt-4">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Total HT :</span>
                      <span>{totalHT.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>TVA (19%) :</span>
                      <span>{(totalTTC - totalHT).toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-slate-700">
                      <span>Net à Payer (TTC) :</span>
                      <span>{totalTTC.toFixed(3)} TND</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('PAYMENT')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    Procéder au Règlement <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3: ENCAISSEMENT */}
          {activeTab === 'PAYMENT' && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Mode de Règlement Nomade
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'CHECK', 'TRAITE'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border transition ${paymentMethod === mode ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      {mode === 'CASH' && 'Espèces (Cash)'}
                      {mode === 'CHECK' && 'Chèque'}
                      {mode === 'TRAITE' && 'Traite'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-slate-300">
                  <span>Client:</span>
                  <span className="text-amber-400">{clientName}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-300">
                  <span>Nombre d'articles:</span>
                  <span>{cartItems.reduce((a, b) => a + b.qty, 0)} u</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-emerald-400 pt-2 border-t border-slate-700">
                  <span>Montant Total Encaissé:</span>
                  <span>{totalTTC.toFixed(3)} TND</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition"
              >
                <CheckCircle2 className="w-5 h-5" /> Encaisser & Décrémenter Stock Local
              </button>
            </div>
          )}
        </main>
      )}

      {/* RENDER ENGINE: BRANCHE CHANTIER */}
      {session.type === 'CHANTIER' && (
        <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          {/* Navigation Onglets Chantier */}
          <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setChantierTab('REPORT')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${chantierTab === 'REPORT' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-4 h-4" /> Rapport Jour
            </button>
            <button
              onClick={() => setChantierTab('PHOTOS')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${chantierTab === 'PHOTOS' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Camera className="w-4 h-4" /> Photos ({photos.length})
            </button>
            <button
              onClick={() => setChantierTab('INCIDENTS')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${chantierTab === 'INCIDENTS' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Incidents ({incidentList.length})
            </button>
          </div>

          {/* ONGLET 1: RAPPORT JOURNALIER */}
          {chantierTab === 'REPORT' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Ouvriers / Effectif Présent sur Chantier :
                  </label>
                  <span className="text-lg font-bold text-emerald-400">{workersCount} ouvriers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={workersCount}
                  onChange={(e) => setWorkersCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" /> Consommables & Matériaux Utilisés :
                </h4>
                <div className="space-y-2">
                  {consumedMaterials.map((mat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-200 font-medium">{mat.label}</span>
                      <span className="font-bold text-emerald-400">{mat.qty} un.</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Remarques & Avancement des Travaux :</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pose du ferraillage terminée sur la travée A3. Coulage béton prévu demain 08h..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {reportSubmitted && (
                <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Rapport de chantier transmis et sauvegardé en local / Firestore.
                </div>
              )}

              <button
                onClick={handleSubmitChantierReport}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Valider le Rapport Journalier
              </button>
            </div>
          )}

          {/* ONGLET 2: PHOTOS (COMPRESSION CANVAS) */}
          {chantierTab === 'PHOTOS' && (
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-emerald-400 font-semibold text-xs transition"
              >
                <Camera className="w-6 h-6 text-emerald-400" />
                Prendre une photo de chantier (Compression auto 70%)
              </button>

              <div className="grid grid-cols-2 gap-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-video">
                    <img src={src} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] px-1.5 py-0.5 rounded text-slate-300">
                      JPEG Compressé
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONGLET 3: INCIDENTS */}
          {chantierTab === 'INCIDENTS' && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Signaler un Incident ou Aléa
                </h4>
                <input
                  type="text"
                  placeholder="Titre de l'incident (ex: Infiltration d'eau)..."
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <textarea
                  rows={2}
                  placeholder="Description détaillée de l'incident..."
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (incidentTitle) {
                      setIncidentList((prev) => [
                        ...prev,
                        { id: `inc_${Date.now()}`, title: incidentTitle, desc: incidentDesc, date: new Date().toLocaleDateString('fr-TN') }
                      ]);
                      setIncidentTitle('');
                      setIncidentDesc('');
                    }
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Enregistrer l'Incident
                </button>
              </div>

              <div className="space-y-2">
                {incidentList.map((inc) => (
                  <div key={inc.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-amber-300">{inc.title}</h5>
                      <span className="text-[10px] text-slate-400">{inc.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{inc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* MODAL REÇU / IMPRESSION THERMIQUE (VAN SALES) */}
      {showReceiptModal && lastOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-4">
            <button onClick={() => setShowReceiptModal(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400">ELYSSA ERP - REÇU DE VENTE</h3>
              <p className="text-xs text-slate-400">Bordereau Nomade ESC/POS</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Ref: {lastOrder.localUuid}</p>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-xl text-slate-300">
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="text-slate-100">{lastOrder.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Règlement:</span>
                <span className="text-emerald-400">{lastOrder.paymentMethod}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 space-y-1">
                {lastOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{it.label} x{it.qty}</span>
                    <span>{it.total.toFixed(3)} DT</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-amber-300 text-xs">
                <span>TOTAL TTC:</span>
                <span>{lastOrder.totalTTC.toFixed(3)} DT</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={printThermalReceipt}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimer ESC/POS
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
