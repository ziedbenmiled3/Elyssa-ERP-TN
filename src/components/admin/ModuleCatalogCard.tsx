import React, { useState } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Camera, 
  WifiOff, 
  Truck, 
  FileText, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  X,
  AlertCircle,
  Clock,
  Check
} from 'lucide-react';

export interface ModuleCatalogCardProps {
  title?: string;
  code?: string;
  description?: string;
  priceMonthlyTnd?: number;
  features?: string[];
  isSubscribed?: boolean;
  onOpenOrderModal: () => void;
  className?: string;
}

/**
 * Composant ModuleCatalogCard - Carte Catalogue SaaS pour le Module MOD-11
 * Design moderne Slate/Indigo mode sombre pour l'écosystème Elyssa ERP.
 */
export const ModuleCatalogCard: React.FC<ModuleCatalogCardProps> = ({
  title = "Flotte Mobile & Suivi Terrain",
  code = "MOD-11",
  description = "Application PWA Offline-First pour les commerciaux (Van Sales) et chefs de chantier. Géofencing dynamique, pointage biométrique par IA, et gestion des stocks itinérants.",
  priceMonthlyTnd = 39,
  features = [
    "Application PWA Offline-First (mode déconnecté)",
    "Pointage Biométrique IA par reconnaissance faciale (Gemini Vision)",
    "Géofencing GPS dynamique multi-sites & chantiers",
    "Van Sales & Gestion des stocks itinérants"
  ],
  isSubscribed = false,
  onOpenOrderModal,
  className = ""
}) => {
  return (
    <div className={`relative bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group ${className}`}>
      
      {/* Halo d'arrière-plan discret */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

      <div>
        {/* En-tête : Badges & Code Module */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            {/* Badge Nouveau */}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Nouveau
            </span>

            {/* Code Module */}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {code}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* Titre & Tarification */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors">
            {title}
          </h3>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-white tracking-tight">{priceMonthlyTnd} TND</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">/ mois HT</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-6 font-normal">
          {description}
        </p>

        {/* Liste des fonctionnalités clés */}
        <div className="space-y-2.5 mb-6 pt-4 border-t border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">
            Fonctionnalités Incluses :
          </span>
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pied de Carte & Action de Souscription */}
      <div className="pt-4 border-t border-slate-800/80">
        {isSubscribed ? (
          <div className="w-full py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Module Déjà Actif sur ce Tenant</span>
          </div>
        ) : (
          <button
            onClick={onOpenOrderModal}
            className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer group/btn"
          >
            <FileText className="w-4 h-4 text-indigo-200 group-hover/btn:scale-110 transition-transform" />
            <span>Souscrire via Virement</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

    </div>
  );
};

/**
 * Composant Modal de Bon de Commande avec Engagement de Virement sous 48h
 */
export interface WireTransferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  priceMonthlyTnd?: number;
  onConfirmOrder?: () => void;
}

export const WireTransferOrderModal: React.FC<WireTransferOrderModalProps> = ({
  isOpen,
  onClose,
  tenantId = 'GEP',
  priceMonthlyTnd = 39,
  onConfirmOrder
}) => {
  const [agreedTo48hCommitment, setAgreedTo48hCommitment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTo48hCommitment) return;

    setIsSubmitting(true);
    // Simulation enregistrement bon de commande
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setOrderSubmitted(true);

    if (onConfirmOrder) {
      onConfirmOrder();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!orderSubmitted ? (
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Bon de Commande par Virement Bancaire
                </h3>
                <p className="text-xs text-slate-400">
                  Souscription au Module Flotte Mobile & Suivi Terrain (MOD-11)
                </p>
              </div>
            </div>

            {/* Détails du Paiement & Relevé Bancaire (RIB) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Entreprise Client :</span>
                <span className="font-bold text-white">{tenantId}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Montant Mensuel :</span>
                <span className="font-bold text-emerald-400">{priceMonthlyTnd} TND HT / mois</span>
              </div>
              
              <div className="pt-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Coordonnées Bancaires (RIB Elyssa ERP Tunisie) :
                </span>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 select-all">
                  BIAT TN59 0800 1000 1234 5678 9012
                </div>
              </div>
            </div>

            {/* Case d'Engagement 48h Obligatoire */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTo48hCommitment}
                  onChange={(e) => setAgreedTo48hCommitment(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-amber-500/50 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-amber-200 font-medium leading-tight">
                  Je m'engage à effectuer le virement bancaire de <strong>{priceMonthlyTnd} TND</strong> sous <strong>48 heures</strong> pour validation par l'équipe Elyssa ERP.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!agreedTo48hCommitment || isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center space-x-2 ${
                  !agreedTo48hCommitment || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? 'Validation en cours...' : 'Confirmer le Bon de Commande'}
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation après souscription */
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Commande Enregistrée avec Succès !</h3>
              <p className="text-xs text-slate-300 mt-1">
                Votre bon de commande a été transmis. L'accès au module MOD-11 sera débloqué dès réception de l'avis de virement.
              </p>
            </div>
            <button
              onClick={() => {
                setOrderSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

/**
 * Exemple complet de Gestion de l'État Montrant l'interaction Carte <-> Modal
 */
export const ModuleCatalogShowcaseExample: React.FC<{ tenantId?: string }> = ({ tenantId = 'GEP' }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-bold text-white mb-2">Exemple Catalogue SaaS Elyssa ERP</h2>
        
        {/* Composant Carte du Catalogue */}
        <ModuleCatalogCard
          isSubscribed={isSubscribed}
          onOpenOrderModal={() => setIsModalOpen(true)}
        />

        {/* Modal de Commande déclenché par l'état `isModalOpen` */}
        <WireTransferOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tenantId={tenantId}
          onConfirmOrder={() => setIsSubscribed(true)}
        />
      </div>
    </div>
  );
};

export default ModuleCatalogCard;
