import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  PhoneCall, 
  Building2, 
  Smartphone, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useMobileAccessControl } from '../../hooks/useMobileAccessControl';

interface MobileAccessGuardProps {
  children: React.ReactNode;
  tenantId?: string;
  userId?: string;
  onLogout?: () => void;
}

/**
 * Composant Route Guard & Écran de Blocage : MobileAccessGuard
 * 
 * Verrouille l'accès à l'application PWA Mobile Terrain si la licence de l'agent 
 * a été révoquée en temps réel par le gérant depuis l'Espace Client Elyssa ERP.
 * 
 * Intégration :
 * <MobileAccessGuard tenantId="GEP" userId="emp_01">
 *   <PocketAttendanceView />
 * </MobileAccessGuard>
 */
export const MobileAccessGuard: React.FC<MobileAccessGuardProps> = ({
  children,
  tenantId = 'GEP',
  userId = 'emp_01',
  onLogout
}) => {
  const { hasAccess, loading, accessError, agentName, role, lastCheckedAt } = useMobileAccessControl(tenantId, userId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Rechargement manuel du statut
  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // 1. ÉCRAN DE CHARGEMENT ÉPURÉ & SÉCURISÉ
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-2xl">
            <Smartphone className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Elyssa ERP Mobile
          </h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Vérification de la licence sécurisée...</span>
          </p>
        </div>

        <div className="mt-8 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
          <span>Tenant : <strong className="text-slate-300">{tenantId}</strong></span>
          <span>•</span>
          <span>ID : <strong className="text-slate-300">{userId}</strong></span>
        </div>
      </div>
    );
  }

  // 2. ÉCRAN DE BLOCAGE STRICT SI DÉS-AUTORISÉ (hasAccess === false)
  if (!hasAccess) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-between p-6 text-white font-sans relative overflow-hidden">
        {/* Cercles de halo luminescent en arrière-plan */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* En-tête Elyssa ERP */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white">
              Elyssa ERP <span className="text-red-400">Security</span>
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
            Accès Suspendu
          </span>
        </div>

        {/* Corps de l'Alerte de Révocabilité */}
        <div className="my-auto py-8 space-y-6 max-w-md text-center relative z-10">
          {/* Icône de cadenas géant avec effet pulsing */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping opacity-25" />
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-red-950/80 to-slate-900 border border-red-500/40 flex items-center justify-center shadow-2xl">
              <Lock className="w-12 h-12 text-red-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 shadow-lg">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          {/* Titre et Explication */}
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Licence Terrain Révoquée
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed px-2">
              L'autorisation pour l'application mobile terrain (<strong className="text-amber-400">MOD-11</strong>) a été suspendue ou retirée par l'administrateur de votre entreprise.
            </p>
          </div>

          {/* Fiche d'Information Administrateur */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-xl backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Détails de l'Agent</span>
              <span className="text-red-400 font-mono">NON AUTORISÉ</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Agent :</span>
                <strong className="text-white font-medium">{agentName || userId}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Rôle :</span>
                <span className="text-slate-300">{role || 'Agent Terrain'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tenant ERP :</span>
                <span className="text-indigo-300 font-mono font-semibold">{tenantId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dernier contrôle :</span>
                <span className="text-slate-400 text-[10px]">
                  {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : 'Maintenant'}
                </span>
              </div>
            </div>

            {accessError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] leading-tight flex items-start gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{accessError}</span>
              </div>
            )}
          </div>

          {/* Boutons d'Action */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Vérification...' : 'Actualiser le statut de la licence'}</span>
            </button>

            <button
              onClick={() => setShowContactModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>Contacter le Support ou l'Administrateur RH</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter de la PWA</span>
              </button>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-[11px] text-slate-600 text-center relative z-10">
          Elyssa ERP Suite • Protection Multi-Tenant & Sécurité Biométrique IA
        </div>

        {/* MODAL CONTACT ADMINISTRATEUR */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Contact Direction RH
                </h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-slate-400 hover:text-white p-1 text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Pour réactiver votre accès à la PWA Mobile Terrain, veuillez contacter le responsable du compte Elyssa ERP de votre entreprise :
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div>🏢 Entreprise : <strong className="text-white">{tenantId}</strong></div>
                  <div>📧 Support RH : <strong className="text-indigo-400">admin-rh@{tenantId.toLowerCase()}.tn</strong></div>
                  <div>📞 Ligne Directe : <strong className="text-emerald-400">+216 71 000 000</strong></div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Une fois la licence réattribuée dans la console SaaS, cliquez sur "Actualiser le statut" pour déverrouiller immédiatement l'application.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. AUTORISATION VALIDE : RENDU TRANSPARENT DE L'APPLICATION MOBILE
  return <>{children}</>;
};
