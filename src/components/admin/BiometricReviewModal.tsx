import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ScanFace, 
  Sparkles, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  Building2, 
  FileText, 
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';

export interface SecurityAlertItem {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole?: string;
  userDepartment?: string;
  referencePhotoUrl?: string;
  pointagePhotoUrl?: string;
  timestamp: string;
  type: 'IN' | 'OUT' | 'POINTAGE';
  locationName?: string;
  gpsCoords?: { lat: number; lng: number };
  geofenceValid: boolean;
  geofenceDistance?: number; // distance in meters from site
  biometricVerification: {
    status: 'ALERT_BIOMETRICS' | 'VERIFIED' | 'FAILED' | 'REJECTED';
    confidenceScore: number; // 0.0 to 1.0
    reasoning: string;
  };
  resolutionStatus: 'PENDING' | 'VALIDATED_MANUALLY' | 'REJECTED_ABSENCE';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

interface BiometricReviewModalProps {
  alert: SecurityAlertItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolveAlert: (
    alertId: string, 
    decision: 'VALIDATED_MANUALLY' | 'REJECTED_ABSENCE', 
    note?: string
  ) => Promise<void> | void;
}

export const BiometricReviewModal: React.FC<BiometricReviewModalProps> = ({
  alert,
  isOpen,
  onClose,
  onResolveAlert
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<'ref' | 'pointage' | null>(null);

  if (!isOpen || !alert) return null;

  const confidencePercent = Math.round((alert.biometricVerification?.confidenceScore || 0) * 100);

  const handleAction = async (decision: 'VALIDATED_MANUALLY' | 'REJECTED_ABSENCE') => {
    setIsSubmitting(true);
    try {
      await onResolveAlert(alert.id, decision, resolutionNote);
      setResolutionNote('');
      onClose();
    } catch (err) {
      console.error('Erreur lors de la résolution de l\'alerte:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern high-resolution fallback photos for demo
  const refPhoto = alert.referencePhotoUrl || 
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`;
  const selfiePhoto = alert.pointagePhotoUrl || 
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Examen d'Alerte Biométrique & GPS
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                  REF-{alert.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rapprochement automatique par l'IA Gemini Vision • Elyssa ERP Security Suite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Agent Information Header */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-300 text-lg">
                {alert.userName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{alert.userName}</h4>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-indigo-400 font-semibold">{alert.userId}</span>
                  <span>•</span>
                  <span>{alert.userRole || 'Agent Terrain'}</span>
                  {alert.userDepartment && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">{alert.userDepartment}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300">
                  {alert?.timestamp ? new Date(alert.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>

              <div className={`px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1.5 ${
                alert.type === 'IN' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}>
                <span>Type : {alert.type === 'IN' ? 'Entrée (Prise de poste)' : 'Sortie (Fin de poste)'}</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Photo Comparison */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <ScanFace className="w-4 h-4 text-indigo-400" />
                <span>Comparatif Biométrique Rapprochement Facial IA</span>
              </h5>
              <span className="text-[11px] text-slate-400 italic">
                Cliquez sur une image pour agrandir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Photo 1: Reference Photo (RH) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 relative group">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo de Référence RH (Master)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Certifié Biométrie
                  </span>
                </div>

                <div 
                  onClick={() => setSelectedPhotoZoom('ref')}
                  className="aspect-4/3 w-full bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800 cursor-pointer group-hover:border-indigo-500/50 transition-all"
                >
                  <img 
                    src={refPhoto} 
                    alt="Master Biométrique" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Base de données RH Elyssa • Registre Officiel
                </p>
              </div>

              {/* Photo 2: Pointage Selfie (Field) */}
              <div className="bg-slate-950 border border-red-500/30 rounded-xl p-3 space-y-2 relative group">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1.5">
                    <ScanFace className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selfie de Pointage Terrain</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Horodaté & Géolocalisé
                  </span>
                </div>

                <div 
                  onClick={() => setSelectedPhotoZoom('pointage')}
                  className="aspect-4/3 w-full bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800 cursor-pointer group-hover:border-amber-500/50 transition-all"
                >
                  <img 
                    src={selfiePhoto} 
                    alt="Pointage Selfie" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Capturé le {alert?.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'} via PWA Terrain
                </p>
              </div>

            </div>
          </div>

          {/* AI Analysis & Geofencing Diagnostic Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* AI Gemini Vision Diagnostic */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Analyse Gemini Vision IA</span>
                </h5>
                
                {/* Confidence Badge */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center space-x-1 border ${
                  confidencePercent >= 80 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : confidencePercent >= 50
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  <span>Score IA: {confidencePercent}%</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed space-y-1">
                <span className="font-semibold text-slate-400 block text-[11px] uppercase tracking-wider">
                  Rapport de concordance visuelle :
                </span>
                <p className="text-slate-200">
                  {alert.biometricVerification?.reasoning || "Divergence de la structure faciale détectée entre la photo de référence et le selfie pris sur le terrain."}
                </p>
              </div>
            </div>

            {/* GPS & Geofencing Diagnostic */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>Diagnostic Géolocalisation GPS</span>
                </h5>

                <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center space-x-1 ${
                  alert.geofenceValid 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {alert.geofenceValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zone Validée</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Hors Périmètre</span>
                    </>
                  )}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Site/Chantier :</span>
                  <strong className="text-white">{alert.locationName || 'Chantier Central Tunis'}</strong>
                </div>
                {alert.gpsCoords && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Coordonnées GPS :</span>
                    <span className="text-indigo-300">{alert.gpsCoords.lat.toFixed(5)}, {alert.gpsCoords.lng.toFixed(5)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Écart du rayon autorisé :</span>
                  <span className={alert.geofenceValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {alert.geofenceDistance ? `+${alert.geofenceDistance}m hors zone` : 'Respecté (<50m)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Resolution Note Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Note d'arbitrage RH (Optionnel)</span>
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Ex: Employé a changé de lunettes / Éclairage faible sur le chantier, validation accordée par le chef d'équipe..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors"
          >
            Fermer sans statuer
          </button>

          <div className="flex items-center space-x-3">
            {/* Reject Button */}
            <button
              onClick={() => handleAction('REJECTED_ABSENCE')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Rejeter le pointage (Absence injustifiée)</span>
            </button>

            {/* Accept / Validate Manually Button */}
            <button
              onClick={() => handleAction('VALIDATED_MANUALLY')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider manuellement (Faux positif IA)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Photo Lightbox Preview Modal */}
      {selectedPhotoZoom && (
        <div 
          onClick={() => setSelectedPhotoZoom(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700">
            <img 
              src={selectedPhotoZoom === 'ref' ? refPhoto : selfiePhoto} 
              alt="Zoomed" 
              className="w-full h-full object-contain max-h-[80vh]" 
            />
            <div className="absolute top-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
              {selectedPhotoZoom === 'ref' ? 'Photo Référence Master' : 'Selfie Terrain Pointage'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
