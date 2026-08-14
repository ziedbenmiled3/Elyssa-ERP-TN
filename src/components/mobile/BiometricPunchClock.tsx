import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  MapPin, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Loader2, 
  Sparkles, 
  Scan, 
  Smartphone, 
  Database,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { executeProcessBiometricPunchLogic, BiometricPunchResult } from '../../functions/processBiometricPunch';

interface BiometricPunchClockProps {
  tenantId?: string;
  employeeId?: string;
  employeeName?: string;
  onPunchSuccess?: (result: BiometricPunchResult | any) => void;
  className?: string;
}

export const BiometricPunchClock: React.FC<BiometricPunchClockProps> = ({
  tenantId = 'GEP',
  employeeId = 'EMP-904',
  employeeName = 'Sami Ben Ali (Van Sales)',
  onPunchSuccess,
  className = ''
}) => {
  // Hook de synchronisation hors-ligne
  const { isOnline, pendingCount, isSyncing, syncQueue, addToQueue } = useOfflineSync(tenantId);

  // Équipements matériel (Caméra & GPS)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);

  // Géolocalisation
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(true);

  // États du pointage
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [lastPunchResult, setLastPunchResult] = useState<BiometricPunchResult | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Initialisation de la caméra et de la géolocalisation
  const initCamera = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("[BiometricPunchClock] Erreur Caméra:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Permission de la caméra refusée. Veuillez autoriser l'accès vidéo dans les paramètres de votre navigateur.");
      } else {
        setCameraError(`Impossible d'accéder à la caméra : ${err.message || 'Erreur matériel.'}`);
      }
    } finally {
      setIsCameraLoading(false);
    }
  }, []);

  const initGps = useCallback(() => {
    setIsGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation GPS n'est pas supportée par votre appareil.");
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn("[BiometricPunchClock] Avertissement GPS:", err);
        setGpsError("Permission GPS refusée ou signal indisponible. Coordonnées par défaut appliquées.");
        // Coordonnées fallback (ex: Tunis)
        setGpsLocation({ latitude: 36.8065, longitude: 10.1815, accuracy: 20 });
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    initCamera();
    initGps();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture de l'image vidéo sur canvas
  const capturePhotoBase64 = (): string => {
    if (!videoRef.current) {
      // Fallback si pas de flux vidéo réel (simulation SVG/Canvas)
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 300;
      fallbackCanvas.height = 300;
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = '#6366f1';
        ctx.font = '16px sans-serif';
        ctx.fillText('Capture Biométrique', 50, 150);
      }
      return fallbackCanvas.toDataURL('image/jpeg', 0.8);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Action Principale : POINTER
  const handlePunch = async () => {
    if (isPunching) return;

    setIsPunching(true);
    setLastPunchResult(null);
    setOfflineNotice(null);

    const photoBase64 = capturePhotoBase64();
    const location = gpsLocation || { latitude: 36.8065, longitude: 10.1815, accuracy: 25 };
    const timestamp = new Date().toISOString();

    if (!isOnline) {
      // MODE HORS-LIGNE : Ajouter dans la file d'attente locale
      const offlineItem = addToQueue({
        tenantId,
        employeeId,
        employeeName,
        photoBase64,
        location,
        timestamp
      });

      setOfflineNotice(`Pointage enregistré en mode déconnecté ! Il sera synchronisé dès le retour de la connexion Internet (Ref: ${offlineItem.id.slice(-6)}).`);
      setIsPunching(false);

      if (onPunchSuccess) {
        onPunchSuccess({
          isOffline: true,
          offlineId: offlineItem.id,
          timestamp,
          location
        });
      }
      return;
    }

    // MODE EN LIGNE : Traitement direct par IA Gemini
    try {
      const result = await executeProcessBiometricPunchLogic({
        tenantId,
        employeeId,
        employeeName,
        photoBase64,
        location,
        timestamp,
        isOfflinePunch: false
      });

      setLastPunchResult(result);
      if (onPunchSuccess) {
        onPunchSuccess(result);
      }
    } catch (err: any) {
      console.error("[BiometricPunchClock] Erreur traitement pointage:", err);
      // Fallback vers file d'attente si l'appel réseau échoue
      addToQueue({
        tenantId,
        employeeId,
        employeeName,
        photoBase64,
        location,
        timestamp
      });
      setOfflineNotice("Le serveur n'a pas répondu. Le pointage a été placé en file d'attente hors-ligne.");
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl font-sans text-slate-100 ${className}`}>
      
      {/* Canvas caché pour capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* En-tête : Logo Elyssa ERP & Status Réseau */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Pointage Biométrique</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MOD-11
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {employeeName}
            </p>
          </div>
        </div>

        {/* Badge d'État Réseau (Online / Offline) */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 border shadow-sm ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>En Ligne</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Hors-Ligne</span>
            </>
          )}
        </div>
      </div>

      {/* Barre de File d'Attente Hors-Ligne si éléments en attente */}
      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">
              <strong>{pendingCount}</strong> pointage(s) en attente de synchro
            </span>
          </div>

          <button
            onClick={syncQueue}
            disabled={!isOnline || isSyncing}
            className={`px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1 cursor-pointer`}
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>{isSyncing ? 'Synchro...' : 'Synchroniser'}</span>
          </button>
        </div>
      )}

      {/* Zone Vidéo Caméra avec Overlay Biométrique IA */}
      <div className="relative w-full aspect-square bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center mb-4 group">
        
        {/* Caméra Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setIsCameraLoading(false)}
          className="w-full h-full object-cover transform -scale-x-100" // Effet miroir pour l'utilisateur
        />

        {/* Loader chargement caméra */}
        {isCameraLoading && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-bold">Initialisation de la Caméra...</span>
          </div>
        )}

        {/* Erreur de Caméra */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
            <p className="text-xs text-amber-200 font-medium leading-relaxed">{cameraError}</p>
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer la Caméra</span>
            </button>
          </div>
        )}

        {/* Overlay Viseur Biométrique & Viseur IA */}
        {!cameraError && !isCameraLoading && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
            {/* Coins du viseur */}
            <div className="w-full flex justify-between">
              <div className="w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
            </div>

            {/* Ovale de Cadrage Visage */}
            <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-indigo-500/60 flex flex-col items-center justify-center bg-indigo-500/5 backdrop-blur-[1px] animate-pulse relative">
              <Scan className="w-8 h-8 text-indigo-400/80 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30">
                Alignez votre visage
              </span>
            </div>

            <div className="w-full flex justify-between">
              <div className="w-b-2 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Informations de Géolocalisation GPS */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          {isGpsLoading ? (
            <span className="text-slate-500 italic">Acquisition GPS en cours...</span>
          ) : gpsLocation ? (
            <div className="font-mono text-[11px] text-slate-300">
              <span className="text-slate-400">GPS:</span> {gpsLocation.latitude.toFixed(4)}°, {gpsLocation.longitude.toFixed(4)}° 
              <span className="text-slate-500 text-[10px] ml-1.5">(±{Math.round(gpsLocation.accuracy || 15)}m)</span>
            </div>
          ) : (
            <span className="text-amber-400 text-[11px]">{gpsError || 'GPS indisponible'}</span>
          )}
        </div>

        <button
          onClick={initGps}
          className="text-slate-500 hover:text-white p-1 rounded transition-colors"
          title="Actualiser la position GPS"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message de notification d'enregistrement hors-ligne */}
      {offlineNotice && (
        <div className="mb-4 p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 font-medium flex items-start space-x-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{offlineNotice}</span>
        </div>
      )}

      {/* Feedback de la vérification Biométrique IA (si en ligne) */}
      {lastPunchResult && (
        <div className={`mb-4 p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
          lastPunchResult.status === 'APPROVED'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-white">Validation IA Gemini Vision</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Score: {lastPunchResult.aiVerification.confidenceScore}%
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            {lastPunchResult.aiVerification.matchDetails}
          </p>
        </div>
      )}

      {/* Bouton d'Action Principal : POINTER */}
      <button
        onClick={handlePunch}
        disabled={isPunching}
        className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer ${
          isOnline
            ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 active:scale-[0.98] shadow-indigo-600/25'
            : 'bg-amber-600 hover:bg-amber-500 active:scale-[0.98] shadow-amber-600/25'
        } ${isPunching ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isPunching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyse biométrique en cours...</span>
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            <span>
              {isOnline ? 'Pointer avec Reconnaissance IA' : 'Pointer Hors-Ligne (Sauvegarde)'}
            </span>
          </>
        )}
      </button>

      {/* Note d'Information Footer */}
      <div className="mt-4 text-center">
        <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Protection anti-fraude par Gemini Vision & Géofencing Elyssa ERP</span>
        </span>
      </div>

    </div>
  );
};

export default BiometricPunchClock;
