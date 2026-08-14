import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  Camera,
  Users,
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Trash2,
  Plus,
  Minus,
  FileText,
  RefreshCw,
  Navigation,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import offlineSyncEngine from '../services/offlineSyncEngine';
import { startSession, endSession } from '../../services/mobileSyncService';
import { ChantierReport, ChantierMaterialItem, FieldSession } from '../../types/mobileTerrain';

interface ChantierScreenProps {
  tenantId?: string;
  chefChantierId?: string;
  chefChantierName?: string;
}

const DEMO_CHANTIERS = [
  { id: 'CH-201', name: 'Chantier Résidence Les Jasmins (Lac 2, Tunis)', location: 'Les Berges du Lac 2' },
  { id: 'CH-202', name: 'Chantier Pont d\'Accès Zone Industrielle (Sfax)', location: 'Route de Gabès Km 3, Sfax' },
  { id: 'CH-203', name: 'Chantier Immeuble Tertiaire Elyssa (Sousse)', location: 'Kantaoui, Sousse' },
];

const ChantierMaterialCatalog = [
  { articleId: 'ART-001', name: 'Ciment Portland Super CPJ45 (Sac 50kg)', unit: 'Sac' },
  { articleId: 'ART-002', name: 'Brique Rouge de 12 Alvéoles', unit: 'Pièce' },
  { articleId: 'ART-005', name: 'Câble Électrique Rigide 2.5mm²', unit: 'Mètre' },
  { articleId: 'ART-006', name: 'Barre de Fer à Béton HLE 12mm', unit: 'Barre' },
  { articleId: 'ART-007', name: 'Peinture Façade Hydrofuge', unit: 'Pot' },
];

export const ChantierScreen: React.FC<ChantierScreenProps> = ({
  tenantId = 'Inter-Affaires',
  chefChantierId = 'chef_01',
  chefChantierName = 'Kamel Ben Youssef (Chef de Chantier)'
}) => {
  // Sync Engine & Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  // Selected Chantier
  const [selectedChantier, setSelectedChantier] = useState(DEMO_CHANTIERS[0]);

  // Check-In / Check-Out Geolocation State
  const [activeSession, setActiveSession] = useState<FieldSession | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number; address?: string } | null>(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Daily Report Form State
  const [workersCount, setWorkersCount] = useState<number>(8);
  const [consumedMaterials, setConsumedMaterials] = useState<ChantierMaterialItem[]>([
    { articleId: 'ART-001', articleName: 'Ciment Portland Super CPJ45 (Sac 50kg)', qty: 15, unit: 'Sac' },
    { articleId: 'ART-002', articleName: 'Brique Rouge de 12 Alvéoles', qty: 350, unit: 'Pièce' }
  ]);
  const [notes, setNotes] = useState<string>('Coulage de la dalle du 2ème étage effectué. Effectif au complet, aucun incident à signaler.');

  // Stock Chantier Local
  const [chantierStock, setChantierStock] = useState<Record<string, number>>({});

  // Camera & Photo Module State (with Auto-compression)
  const [photos, setPhotos] = useState<{ id: string; url: string; originalSizeKb: number; compressedSizeKb: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Init & Listeners
  useEffect(() => {
    setChantierStock(offlineSyncEngine.getChantierStock(selectedChantier.id));

    const unsubConn = offlineSyncEngine.onConnectivityChange(online => setIsOnline(online));
    const unsubSync = offlineSyncEngine.onSyncStatusChange(status => setPendingReportsCount(status.pendingReportsCount));

    // Get Initial GPS Position
    fetchGpsPosition();

    return () => {
      unsubConn();
      unsubSync();
    };
  }, [selectedChantier]);

  // Fetch GPS Coordinates using browser geolocation
  const fetchGpsPosition = () => {
    setLoadingGps(true);
    setGpsError(null);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            address: `${selectedChantier.location} (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          });
          setLoadingGps(false);
        },
        (err) => {
          console.warn('Géolocalisation fallback :', err);
          // Fallback coordinates for Lac 2, Tunis
          setGpsLocation({
            lat: 36.8385,
            lng: 10.2412,
            accuracy: 8,
            address: `${selectedChantier.location} (Lac 2 Tunis)`
          });
          setLoadingGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGpsLocation({
        lat: 36.8385,
        lng: 10.2412,
        accuracy: 10,
        address: `${selectedChantier.location} (Lac 2 Tunis)`
      });
      setLoadingGps(false);
    }
  };

  // Check-In Action
  const handleCheckIn = async () => {
    if (!gpsLocation) {
      showToast('Attente de la géolocalisation GPS...');
      return;
    }

    const session = await startSession({
      tenantId,
      agentId: chefChantierId,
      type: 'CHANTIER',
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
    });

    setActiveSession(session);
    showToast(`Check-In Chantier validé à ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  // Check-Out Action
  const handleCheckOut = async () => {
    if (!activeSession) return;
    if (!gpsLocation) {
      showToast('Attente GPS...');
      return;
    }

    await endSession({
      tenantId,
      sessionId: activeSession.id,
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
    });

    setActiveSession(null);
    showToast('Check-Out Chantier enregistré avec succès.');
  };

  // Material Selector Modifiers
  const addMaterialRow = (articleId: string) => {
    const itemInfo = ChantierMaterialCatalog.find(m => m.articleId === articleId);
    if (!itemInfo) return;

    const existingIndex = consumedMaterials.findIndex(m => m.articleId === articleId);
    if (existingIndex >= 0) {
      const updated = [...consumedMaterials];
      updated[existingIndex].qty += 1;
      setConsumedMaterials(updated);
    } else {
      setConsumedMaterials([
        ...consumedMaterials,
        { articleId, articleName: itemInfo.name, qty: 1, unit: itemInfo.unit }
      ]);
    }
  };

  const updateMaterialQty = (articleId: string, qty: number) => {
    if (qty <= 0) {
      setConsumedMaterials(consumedMaterials.filter(m => m.articleId !== articleId));
    } else {
      setConsumedMaterials(consumedMaterials.map(m => m.articleId === articleId ? { ...m, qty } : m));
    }
  };

  // Photo Capture & Canvas Auto-Compression Module
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const file = files[0];
    const originalSizeKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using HTML5 Canvas (max dimension 1200px, quality 0.65)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          const compressedSizeKb = Math.round((compressedDataUrl.length * 0.75) / 1024);

          setPhotos(prev => [
            ...prev,
            {
              id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              url: compressedDataUrl,
              originalSizeKb,
              compressedSizeKb
            }
          ]);

          showToast(`Photo compressée: ${originalSizeKb}KB ➔ ${compressedSizeKb}KB (-${Math.round((1 - compressedSizeKb / originalSizeKb) * 100)}%)`);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Finalize & Save Daily Chantier Report
  const handleSaveReport = () => {
    if (consumedMaterials.length === 0 && !notes) {
      showToast('Veuillez renseigner les matériaux ou les notes du rapport.');
      return;
    }

    const report = offlineSyncEngine.saveChantierReportLocally({
      tenantId,
      chantierId: selectedChantier.id,
      chantierName: selectedChantier.name,
      chefChantierId,
      chefChantierName,
      date: new Date().toISOString(),
      workersPresent: workersCount,
      materialsConsumed: consumedMaterials,
      photoUrls: photos.map(p => p.url),
      notes,
      status: 'PENDING'
    });

    setPhotos([]);
    setNotes('');
    showToast(`Rapport journalier (${report.id}) enregistré localement.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12" id="chantier-mobile-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-xl text-xs border border-amber-400 animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Mobile Bar Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-tight font-display">
                  Elyssa ERP • Suivi Chantier & Pointage
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
                {chefChantierName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => offlineSyncEngine.syncAllPending(tenantId)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync ({pendingReportsCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">

        {/* 1. SECTION CHECK-IN / CHECK-OUT GÉOLOCALISÉ */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                Pointage Géolocalisé GPS (Check-In / Check-Out)
              </h3>
            </div>
            {activeSession ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                SESSION ACTIVE
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-full font-bold">
                EN ATTENTE CHECK-IN
              </span>
            )}
          </div>

          {/* Chantier Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Chantier Concerné :</label>
            <select
              value={selectedChantier.id}
              onChange={(e) => {
                const found = DEMO_CHANTIERS.find(c => c.id === e.target.value);
                if (found) setSelectedChantier(found);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-chantier-mobile"
            >
              {DEMO_CHANTIERS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Coordinates Box */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-300">
                <Navigation className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="font-bold text-white">Coordonnées GPS Actuelles :</span>
              </div>
              {gpsLocation ? (
                <div className="text-[11px] text-slate-400 space-y-0.5 pl-6">
                  <p className="text-indigo-300 font-bold">{gpsLocation.address}</p>
                  <p className="text-[10px] text-slate-500">
                    Lat: {gpsLocation.lat.toFixed(5)} | Lng: {gpsLocation.lng.toFixed(5)} | Précision: ±{gpsLocation.accuracy}m
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-amber-400 pl-6">Recherche du signal satellite GPS...</p>
              )}
            </div>

            <button
              onClick={fetchGpsPosition}
              disabled={loadingGps}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition cursor-pointer shrink-0"
              title="Actualiser la position GPS"
            >
              <RefreshCw className={`w-4 h-4 ${loadingGps ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          {/* Check-In / Check-Out Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCheckIn}
              disabled={!!activeSession}
              className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer border-0 ${
                !activeSession
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              id="btn-chantier-check-in"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check-In Arrivée Chantier</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!activeSession}
              className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer border-0 ${
                activeSession
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              id="btn-chantier-check-out"
            >
              <X className="w-4 h-4" />
              <span>Check-Out Départ Chantier</span>
            </button>
          </div>
        </div>

        {/* 2. FORMULAIRE DE RAPPORT JOURNALIER & EFFECTIFS */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
              Rapport Journalier d'Activité & Matériaux Consommés
            </h3>
          </div>

          {/* Saisie de l'effectif */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">Effectif Présent sur le Chantier</h4>
                <p className="text-[10px] text-slate-400 font-mono">Nombre d'ouvriers, maçons et techniciens présent ce jour</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setWorkersCount(Math.max(1, workersCount - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-amber-400 text-sm font-mono">
                {workersCount}
              </span>
              <button
                onClick={() => setWorkersCount(workersCount + 1)}
                className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center hover:bg-amber-400 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matériaux consommés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Matériaux Consommés (Stock Chantier) :</span>
              </label>

              {/* Add Material Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addMaterialRow(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                <option value="">+ Ajouter un Matériau</option>
                {ChantierMaterialCatalog.map(m => (
                  <option key={m.articleId} value={m.articleId}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {consumedMaterials.length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                  Aucun matériau décompté pour aujourd'hui.
                </div>
              ) : (
                consumedMaterials.map((mat) => {
                  const stockRemaining = chantierStock[mat.articleId] ?? 100;

                  return (
                    <div key={mat.articleId} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-white text-xs">{mat.articleName || mat.articleId}</h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Stock chantier disponible: {stockRemaining} {mat.unit}s
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={mat.qty}
                          onChange={(e) => updateMaterialQty(mat.articleId, parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-amber-300 text-center rounded-xl text-xs font-black py-1.5 focus:outline-none font-mono"
                        />
                        <span className="text-xs text-slate-400 font-mono w-10">{mat.unit}</span>
                        <button
                          onClick={() => updateMaterialQty(mat.articleId, 0)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. MODULE PHOTO AVEC COMPRESSION AUTOMATIQUE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Photos Avancement Chantier (Compression Auto JPEG) :</span>
              </label>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCompressing ? 'Compression...' : 'Prendre une Photo'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
                id="input-camera-capture"
              />
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-1 space-y-1">
                  <img src={photo.url} alt="Avancement chantier" className="w-full h-24 object-cover rounded-xl" />
                  <div className="text-[9px] font-mono text-slate-400 text-center">
                    <span className="text-emerald-400 font-bold">{photo.compressedSizeKb} KB</span> (comp.)
                  </div>
                  <button
                    onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                    className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded-lg hover:bg-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Observations */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Notes & Synthèse du Chef de Chantier :</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques sur la météo, avancement, incidents..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="textarea-chantier-notes"
            />
          </div>

          {/* Save Action */}
          <button
            onClick={handleSaveReport}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/20 transition cursor-pointer border-0"
            id="btn-save-chantier-report"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Enregistrer le Rapport Journalier</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChantierScreen;
