import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ShoppingBag, Loader2, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useTenantModules } from '../../hooks/useTenantModules';

interface ModuleAcquisitionProps {
  tenantId?: string;
  moduleId?: string;
  moduleTitle?: string;
  priceTnd?: number;
  onSuccess?: () => void;
  className?: string;
}

/**
 * Composant Front-End : Initiation du Paiement Sécurisé pour l'acquisition du MOD-11
 * Appelle la Firebase Cloud Function `createCheckoutSession` et redirige vers la passerelle.
 */
export const ModuleAcquisitionButton: React.FC<ModuleAcquisitionProps> = ({
  tenantId = 'GEP',
  moduleId = 'MOD-11',
  moduleTitle = 'Flotte Mobile & Suivi Terrain',
  priceTnd = 39,
  className = ''
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcquireModule = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Récupération des fonctions Firebase
      const functions = getFunctions();
      
      // 2. Initialisation du callable httpsCallable 'createCheckoutSession'
      const createCheckoutSession = httpsCallable<
        { tenantId: string; moduleId: string; amountTnd: number; returnUrl: string },
        { success: boolean; checkoutUrl: string; sessionId: string }
      >(functions, 'createCheckoutSession');

      // 3. Appel de la Cloud Function avec l'ID du Tenant et l'ID du module
      const response = await createCheckoutSession({
        tenantId,
        moduleId,
        amountTnd: priceTnd,
        returnUrl: window.location.href
      });

      const { checkoutUrl } = response.data;

      if (checkoutUrl) {
        // 4. Redirection vers la passerelle de paiement sécurisée
        window.location.href = checkoutUrl;
      } else {
        throw new Error("L'URL de paiement retournée par le serveur est invalide.");
      }
    } catch (err: any) {
      console.error('[ModuleAcquisitionButton] Erreur initiation paiement:', err);
      // Mode secours / fallback de démonstration si les Cloud Functions ne sont pas déployées en local
      setError(
        err?.message || "Échec d'accès à la passerelle de paiement. Vérifiez la connexion backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-slate-100 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Info Module */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              SaaS Add-on {moduleId}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Paiement Immédiat
            </span>
          </div>

          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {moduleTitle}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            PWA Offline-First pour commerciaux (Van Sales) et chefs de chantier. Géofencing dynamique, pointage biométrique IA et gestion des stocks itinérants.
          </p>
        </div>

        {/* Prix & Bouton d'Acquisition */}
        <div className="flex flex-col items-end shrink-0 space-y-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
          <div className="text-right">
            <span className="text-2xl font-black text-white">{priceTnd} TND</span>
            <span className="text-xs text-slate-400 font-medium"> / mois</span>
          </div>

          <button
            onClick={handleAcquireModule}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              loading ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Chargement de la passerelle...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Acquérir ce module</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Message d'Erreur si échec */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Exemple de Composant Conteneur illustrant le Déblocage Réactif
 */
export const ModuleAccessGate: React.FC<{ tenantId?: string; children: React.ReactNode }> = ({
  tenantId = 'GEP',
  children
}) => {
  const { hasMobileModule, loading } = useTenantModules(tenantId);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center space-x-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="text-xs font-bold">Vérification de la licence du module {tenantId}...</span>
      </div>
    );
  }

  // Si le module MOD-11 est actif dans la base de données, on affiche le contenu protégé
  if (hasMobileModule) {
    return <>{children}</>;
  }

  // Sinon, on affiche la bannière d'acquisition avec le bouton de paiement
  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 text-xs flex items-center space-x-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400" />
        <div>
          <strong className="font-bold">Module Non Acquis :</strong> L'accès à la Flotte Mobile & Suivi Terrain (MOD-11) requiert une licence active pour l'entreprise {tenantId}.
        </div>
      </div>

      <ModuleAcquisitionButton tenantId={tenantId} />
    </div>
  );
};

export default ModuleAcquisitionButton;
