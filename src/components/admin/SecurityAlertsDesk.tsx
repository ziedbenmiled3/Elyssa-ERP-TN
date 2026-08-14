import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Eye, 
  ScanFace, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  UserX,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { SecurityAlertItem, BiometricReviewModal } from './BiometricReviewModal';

interface SecurityAlertsDeskProps {
  alerts: SecurityAlertItem[];
  isLoading?: boolean;
  onResolveAlert: (
    alertId: string, 
    decision: 'VALIDATED_MANUALLY' | 'REJECTED_ABSENCE', 
    note?: string
  ) => Promise<void> | void;
  onRefresh?: () => void;
}

export const SecurityAlertsDesk: React.FC<SecurityAlertsDeskProps> = ({
  alerts,
  isLoading = false,
  onResolveAlert,
  onRefresh
}) => {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'BIOMETRIC' | 'GPS' | 'PENDING' | 'RESOLVED'>('PENDING');

  const handleOpenReview = (alert: SecurityAlertItem) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  // Filter alerts based on active tab and search query
  const filteredAlerts = alerts.filter(alert => {
    // Search query filter
    const matchesSearch = 
      alert.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.locationName && alert.locationName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'PENDING') return alert.resolutionStatus === 'PENDING';
    if (activeTab === 'RESOLVED') return alert.resolutionStatus !== 'PENDING';
    if (activeTab === 'BIOMETRIC') return alert.biometricVerification?.status === 'ALERT_BIOMETRICS';
    if (activeTab === 'GPS') return !alert.geofenceValid;
    return true; // ALL
  });

  const pendingCount = alerts.filter(a => a.resolutionStatus === 'PENDING').length;
  const biometricCount = alerts.filter(a => a.biometricVerification?.status === 'ALERT_BIOMETRICS').length;
  const gpsCount = alerts.filter(a => !a.geofenceValid).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 font-sans">
      
      {/* Header Bar */}
      <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-white tracking-tight">
                Bureau des Alertes de Sécurité & Pointages Anormaux
              </h3>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  {pendingCount} à traiter
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervision en temps réel des réjections IA biométriques et sorties de périmètre GPS
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1.5"
              title="Actualiser la liste"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'PENDING'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>À Traiter ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('BIOMETRIC')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'BIOMETRIC'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Alerte Biométrie ({biometricCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('GPS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'GPS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Hors Périmètre GPS ({gpsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'RESOLVED'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Traitées</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Toutes ({alerts.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher agent, matricule, site..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <th className="py-3.5 px-4">Employé / Agent</th>
              <th className="py-3.5 px-4">Horodatage</th>
              <th className="py-3.5 px-4">Type d'Alerte</th>
              <th className="py-3.5 px-4">Score IA / Périmètre</th>
              <th className="py-3.5 px-4">Motif d'Anomalie IA</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Action RH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <span>Chargement des alertes biométriques...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                    <span className="font-semibold text-slate-400">Aucune alerte trouvée</span>
                    <p className="text-[11px] text-slate-500">
                      Toutes les vérifications biométriques et GPS sont en règle.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const confidence = Math.round((alert.biometricVerification?.confidenceScore || 0) * 100);
                const isBiometricAlert = alert.biometricVerification?.status === 'ALERT_BIOMETRICS';
                const isGpsAlert = !alert.geofenceValid;

                return (
                  <tr 
                    key={alert.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Agent Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0 overflow-hidden">
                          {alert.pointagePhotoUrl ? (
                            <img src={alert.pointagePhotoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            alert.userName.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                            {alert.userName}
                          </span>
                          <span className="font-mono text-[10px] text-indigo-400">
                            {alert.userId} • {alert.userDepartment || 'Terrain'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(alert.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(alert.timestamp).toLocaleDateString('fr-FR')}
                      </span>
                    </td>

                    {/* Alert Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {isBiometricAlert && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                            <ScanFace className="w-3 h-3 text-purple-400" />
                            <span>Alerte Biométrie</span>
                          </span>
                        )}
                        {isGpsAlert && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>Hors Zone GPS</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score / Distance */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-xs font-bold font-mono ${
                            confidence < 50 ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            Conf. IA : {confidence}%
                          </span>
                        </div>
                        {alert.geofenceDistance && (
                          <span className="text-[10px] text-slate-400 block">
                            Distance : +{alert.geofenceDistance}m
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reasoning */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                        {alert.biometricVerification?.reasoning || "Anomalie faciale détectée."}
                      </p>
                    </td>

                    {/* Resolution Status */}
                    <td className="py-3.5 px-4">
                      {alert.resolutionStatus === 'PENDING' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          <span>En Attente</span>
                        </span>
                      ) : alert.resolutionStatus === 'VALIDATED_MANUALLY' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Validé RH</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1 w-max">
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span>Rejeté (Absence)</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(alert)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ml-auto shadow-sm ${
                          alert.resolutionStatus === 'PENDING'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{alert.resolutionStatus === 'PENDING' ? 'Examiner' : 'Revoir'}</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal Integration */}
      <BiometricReviewModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResolveAlert={onResolveAlert}
      />
    </div>
  );
};
