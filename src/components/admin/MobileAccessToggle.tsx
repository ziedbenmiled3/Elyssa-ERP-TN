import React, { useState } from 'react';
import { Smartphone, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface MobileAccessToggleProps {
  userId: string;
  userName?: string;
  tenantId?: string;
  hasMobileAccess: boolean;
  onToggleChange?: (newStatus: boolean) => void;
  className?: string;
}

/**
 * Composant UI Switch/Toggle d'Affectation de Licence Mobile (MOD-11)
 * Met à jour le champ `hasMobileAccess` dans Firestore (`company_erp_data/{tenantId}/collaborators/{userId}`)
 */
export const MobileAccessToggle: React.FC<MobileAccessToggleProps> = ({
  userId,
  userName = 'Collaborateur',
  tenantId = 'GEP',
  hasMobileAccess,
  onToggleChange,
  className = ''
}) => {
  const [enabled, setEnabled] = useState<boolean>(hasMobileAccess);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    const nextState = !enabled;
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Mettre à jour la collection des collaborateurs dans Firestore
      const collabRef = doc(db, 'company_erp_data', tenantId, 'collaborators', userId);
      
      await setDoc(collabRef, {
        hasMobileAccess: nextState,
        mobileAccessUpdatedAt: new Date().toISOString(),
        updatedBy: 'Responsable RH (Admin)'
      }, { merge: true });

      // Également synchroniser dans la sous-collection field_agents pour compatibilité
      const agentRef = doc(db, 'company_erp_data', tenantId, 'field_agents', userId);
      await setDoc(agentRef, {
        userId,
        hasMobileLicense: nextState,
        status: nextState ? 'ACTIVE' : 'SUSPENDED',
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      setEnabled(nextState);
      if (onToggleChange) {
        onToggleChange(nextState);
      }

      setSuccessMessage(
        nextState 
          ? `Licence terrain (PWA) attribuée à ${userName}` 
          : `Licence terrain révoquée pour ${userName}`
      );

      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('[MobileAccessToggle] Erreur mise à jour Firestore:', err);
      setError('Échec de la mise à jour Firestore. Réessayez.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-slate-100 font-sans ${className}`}>
      <div className="flex items-center justify-between gap-4">
        
        {/* Intitulé & Description */}
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl border transition-colors ${
            enabled 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <Smartphone className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-white tracking-tight">
                Accès Application Terrain (PWA)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MOD-11
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autorise la connexion sur la PWA mobile (Van Sales, Pointage Biométrique & Chantier).
            </p>
          </div>
        </div>

        {/* Bouton Toggle / Switch Tailwind CSS */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={isSyncing}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              enabled ? 'bg-indigo-600' : 'bg-slate-700'
            } ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-slate-900 ${
                enabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : enabled ? (
                <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
              ) : null}
            </span>
          </button>
        </div>

      </div>

      {/* Messages de Statut / Feedback */}
      {successMessage && (
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-semibold flex items-center space-x-1.5 animate-in fade-in">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 font-semibold flex items-center space-x-1.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MobileAccessToggle;
