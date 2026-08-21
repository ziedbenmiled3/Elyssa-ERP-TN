import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Truck, 
  MapPin, 
  AlertTriangle,
  Lock,
  Plus,
  TrendingUp,
  Building2,
  FileText,
  BadgeCheck,
  Check,
  PackageCheck,
  Shield
} from 'lucide-react';
import { TenantSubscription, FieldAgentLicense } from '../../types/mobileTerrain';
import { MobileLicenseService } from '../../services/mobileLicenseService';
import { ELYSSA_ERP_MODULES_CATALOG, ELYSSA_ERP_PACKS_CATALOG, ErpModuleItem, ErpPackItem } from '../../constants/modulesList';
import { WireTransferOrderModal } from './ModuleCatalogCard';

interface ModuleStoreProps {
  tenantId?: string;
  onNavigateToLicenseManager?: () => void;
  isTrial?: boolean;
}

/**
 * Composant ModuleStore - Boutique de Modules SaaS, Packs Métiers & Catalogue Elyssa ERP
 * Présente le module "Flotte Mobile & Opérations Terrain" (MOD-11) à la carte et dans les Packs SaaS.
 */
export const ModuleStore: React.FC<ModuleStoreProps> = ({
  tenantId = 'MD',
  onNavigateToLicenseManager,
  isTrial = true
}) => {
  // États locaux
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [agents, setAgents] = useState<FieldAgentLicense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Navigation entre vues de la boutique
  const [storeSection, setStoreSection] = useState<'PACKS' | 'CARTE' | 'FOCUS_MOD11'>('PACKS');

  // Modals de commande
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedExtraSeats, setSelectedExtraSeats] = useState<number>(1);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal de commande Virement Bancaire
  const [wireModalOpen, setWireModalOpen] = useState<boolean>(false);
  const [wireModalModuleCode, setWireModalModuleCode] = useState<string>('MOD-11');
  const [wireModalPrice, setWireModalPrice] = useState<number>(39);

  // Chargement des données de souscription
  useEffect(() => {
    async function loadStoreData() {
      setLoading(true);
      try {
        const sub = await MobileLicenseService.getTenantSubscription(tenantId);
        const agList = await MobileLicenseService.getTenantFieldAgents(tenantId);
        setSubscription(sub);
        setAgents(agList);
      } catch (err) {
        console.error('[ModuleStore] Erreur chargement souscription:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [tenantId]);

  if (loading || !subscription) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
        <Zap className="w-6 h-6 animate-spin text-amber-500 mr-3" />
        <span>Chargement de la Boutique de Modules Elyssa ERP...</span>
      </div>
    );
  }

  const isProOrEnterprise = subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE';
  const isModuleActive = subscription.addOnPricing.mobileFleetActive || subscription.activeModules.includes('MOD-11');
  const activeLicensedCount = agents.filter(a => a.hasMobileLicense).length;
  const remainingLicenses = Math.max(0, subscription.quotas.maxFieldAgents - activeLicensedCount);

  // Achat/ajout de sièges
  const handleConfirmPurchase = async () => {
    const updatedSub = await MobileLicenseService.addExtraSeats(tenantId, selectedExtraSeats, subscription);
    setSubscription(updatedSub);
    setShowUpgradeModal(false);
    setActionSuccessMessage(`Option activée ! +${selectedExtraSeats} licence(s) terrain ajoutée(s) avec succès.`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleOpenOrderModalForModule = (module: ErpModuleItem) => {
    setWireModalModuleCode(module.code);
    setWireModalPrice(module.priceMonthlyTnd);
    setWireModalOpen(true);
  };

  const handleOpenOrderModalForPack = (pack: ErpPackItem) => {
    setWireModalModuleCode(pack.name);
    setWireModalPrice(pack.priceMonthlyTnd);
    setWireModalOpen(true);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Notifications / Feedback */}
      {actionSuccessMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {/* En-tête de la Boutique SaaS Elyssa ERP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Boutique & Add-ons SaaS
            </span>
            <span className="text-xs text-slate-400">• Tenant ID : <strong className="text-slate-200">{tenantId}</strong></span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Elyssa ERP <span className="text-amber-400">Module Store & Packs</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Découvrez nos Packs Métiers Tout-en-Un ou souscrivez aux modules opérationnels À la Carte.
          </p>
        </div>

        {/* Badge Offre Actuelle */}
        {(() => {
          const isTrialMode = isTrial || subscription.plan === 'TRIAL' || tenantId === 'MD' || tenantId === 'Inter-Affaires';
          return (
            <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 shadow-lg">
              <div className="p-3 bg-amber-500/15 rounded-lg text-amber-400 border border-amber-500/30 shrink-0">
                {isTrialMode ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Building2 className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Offre souscrite actuelle</div>
                {isTrialMode ? (
                  <>
                    <div className="text-sm font-black text-amber-300 flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        MODE ÉVALUATION ILLIMITÉE (TRIAL 14 JOURS)
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
                      Accès complet aux 33 modules métier + Licences Mobiles Terrain actives pour test.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      Pack {subscription.plan}
                      {isProOrEnterprise ? (
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Essentiel</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {subscription.quotas.maxUsers} Utilisateurs Web • {subscription.quotas.maxFieldAgents} Agents Mobile Terrain
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Barre d'onglets de la Boutique */}
      <div className="flex items-center space-x-2 bg-slate-950 p-1.5 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setStoreSection('PACKS')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            storeSection === 'PACKS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Packs Métiers All-In-One</span>
        </button>

        <button
          onClick={() => setStoreSection('CARTE')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            storeSection === 'CARTE'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catalogue à la Carte (Modules)</span>
        </button>

        <button
          onClick={() => setStoreSection('FOCUS_MOD11')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            storeSection === 'FOCUS_MOD11'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Focus MOD-11 (Flotte Terrain)</span>
        </button>
      </div>

      {/* VUE 1 : PACKS MÉTIERS ALL-IN-ONE */}
      {storeSection === 'PACKS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
            <h3 className="text-2xl font-black text-white">Nos Formules d'Abonnement Tout-en-Un</h3>
            <p className="text-xs text-slate-300">
              Profitez d’une suite ERP complète adaptée au secteur tunisien. Choisissez entre l’offre Essentiel et le Pack Pro Terrain incluant le suivi mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ELYSSA_ERP_PACKS_CATALOG.map((pack) => {
              const isCurrentPlan = subscription.plan === (pack.id === 'pack-essentiel' ? 'ESSENTIEL' : pack.id === 'pack-pro-terrain' ? 'PRO' : 'ENTERPRISE');

              return (
                <div
                  key={pack.id}
                  className={`relative bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all ${
                    pack.isRecommended
                      ? 'border-indigo-500 shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badge Recommandé */}
                  {pack.badge && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {pack.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header Pack */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-black text-white">{pack.name}</h4>
                        {isCurrentPlan && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Votre Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{pack.description}</p>
                    </div>

                    {/* Prix */}
                    <div className="py-2 border-y border-slate-800">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-white">{pack.priceMonthlyTnd} DT</span>
                        <span className="text-xs text-slate-400 font-bold uppercase">{pack.billingText}</span>
                      </div>
                    </div>

                    {/* Quotas & Statut Flotte Mobile */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="text-xs text-slate-300 flex items-center justify-between">
                        <span>Utilisateurs Web :</span>
                        <strong className="text-white">{pack.maxUsers} inclus</strong>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center justify-between">
                        <span>Module Flotte Mobile (MOD-11) :</span>
                        {pack.mobileFleetStatus === 'INCLUDED_5_SEATS' ? (
                          <span className="text-emerald-400 font-bold">INCLUS (5 agents)</span>
                        ) : pack.mobileFleetStatus === 'INCLUDED_UNLIMITED' ? (
                          <span className="text-emerald-400 font-bold">INCLUS (25 agents)</span>
                        ) : (
                          <span className="text-amber-400 font-bold">Option (39 DT/agent)</span>
                        )}
                      </div>
                    </div>

                    {/* Fonctionnalités clés */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        Avantages du Pack :
                      </span>
                      {pack.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    {isCurrentPlan ? (
                      <div className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Formule Actuellement Souscrite</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenOrderModalForPack(pack)}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          pack.isRecommended
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        }`}
                      >
                        <span>Surclasser vers le {pack.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE 2 : CATALOGUE DE MODULES À LA CARTE */}
      {storeSection === 'CARTE' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Modules Opérationnels "À la Carte"</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Activez uniquement les briques logicielles dont votre entreprise a besoin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ELYSSA_ERP_MODULES_CATALOG.map((mod) => {
              const isSubscribedModule = mod.code === 'MOD-11' ? isModuleActive : true; // MOD-01, MOD-02, MOD-03 sont inclus de base

              return (
                <div
                  key={mod.id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between shadow-xl relative transition-all ${
                    mod.code === 'MOD-11' ? 'border-amber-500/40 bg-slate-900/95' : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header Carte */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {mod.code}
                      </span>
                      {mod.isPopular && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Terrain & Mobile
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">{mod.title}</h4>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-3">{mod.description}</p>

                    {/* Prix */}
                    <div className="py-2 border-y border-slate-800 mb-4">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-amber-400">{mod.priceMonthlyTnd} TND</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">/ mois HT</span>
                      </div>
                    </div>

                    {/* Fonctionnalités */}
                    <div className="space-y-1.5 mb-4">
                      {mod.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800">
                    {isSubscribedModule ? (
                      <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Module Actif</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenOrderModalForModule(mod)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Activer à la carte</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE 3 : FOCUS ET DÉTAILS DU MODULE MOD-11 (FLOTTE MOBILE & SUIVI TERRAIN) */}
      {(storeSection === 'FOCUS_MOD11' || storeSection === 'PACKS') && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-md">
          {/* Glow effet d'arrière plan */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="p-6 md:p-8 space-y-6 relative z-10">
            {/* Header Carte Module */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-amber-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-inner">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      MOD-11
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Module Terrain PWA
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Flotte Mobile & Opérations Terrain
                  </h3>
                  <p className="text-slate-300 text-sm max-w-2xl">
                    Optimisez la gestion de vos équipes nomades : Van Sales (vente embarquée), suivi de chantiers, géofencing temps réel et vérification faciale IA par Gemini Vision.
                  </p>
                </div>
              </div>

              {/* Statut Tarifaire & Badge d'Activation */}
              <div className="flex flex-col items-start lg:items-end gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 min-w-[260px]">
                {isModuleActive ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Module Actif sur votre compte</span>
                    </div>
                    {isProOrEnterprise ? (
                      <div className="text-xs text-slate-300">
                        Inclus dans votre <strong className="text-amber-400">Pack {subscription.plan}</strong>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300">
                        Option Add-on active ({subscription.addOnPricing.pricePerExtraFieldAgent} TND / mois / agent)
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Licences utilisées : <strong className="text-white">{activeLicensedCount} / {subscription.quotas.maxFieldAgents}</strong></span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tarif Add-on à la carte</div>
                    <div className="text-2xl font-black text-amber-400 flex items-baseline gap-1">
                      39 <span className="text-sm font-normal text-slate-300">TND / mois / agent</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Facturé à l'agent actif attribué • Sans engagement
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Grille de Fonctionnalités Clés du Module Terrain */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Biométrie IA Gemini</span>
                </div>
                <p className="text-xs text-slate-400">
                  Anti-spoofing et comparaison faciale en temps réel lors du pointage terrain contre le registre RH.
                </p>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>GPS Offline & Geofence</span>
                </div>
                <p className="text-xs text-slate-400">
                  Localisation haute précision sur chantier ou tournée. Synchronisation automatique en reconnexion.
                </p>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                  <Truck className="w-4 h-4" />
                  <span>Van Sales & ESC/POS</span>
                </div>
                <p className="text-xs text-slate-400">
                  Facturation embarquée, gestion de stock Camion et impression thermique directe sur imprimante portable Bluetooth.
                </p>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Rapports de Chantier</span>
                </div>
                <p className="text-xs text-slate-400">
                  Saisie quotidienne du journal de chantier, photos avec filigrane GPS et signature numérique du client.
                </p>
              </div>
            </div>

            {/* Section d'action contextuelle selon le Pack et l'État du Module */}
            <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Cas 1: Pack PRO ou ENTERPRISE */}
              {isProOrEnterprise ? (
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inclus dans votre Pack {subscription.plan} ({remainingLicenses} licence(s) restante(s))</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Vous disposez d'un quota de {subscription.quotas.maxFieldAgents} agents terrain inclus. Vous avez actuellement attribué {activeLicensedCount} licence(s).
                  </p>
                </div>
              ) : isModuleActive ? (
                /* Cas 2: Pack Essentiel avec Option Active */
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Option Terrain Active sur Pack Essentiel</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeLicensedCount} agent(s) terrain actif(s) souscrit(s). Prochaine facturation : {(activeLicensedCount * 39).toFixed(0)} TND / mois.
                  </p>
                </div>
              ) : (
                /* Cas 3: Pack Essentiel sans Option */
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Option Non Activée (Offre Essentiel)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ajoutez l'accès mobile pour vos livreurs ou chefs de chantier pour <strong>39 TND / mois par agent</strong>, ou surclassez votre souscription vers le Pack Pro.
                  </p>
                </div>
              )}

              {/* Boutons d'Action */}
              <div className="flex items-center gap-3 shrink-0">
                {onNavigateToLicenseManager && isModuleActive && (
                  <button
                    onClick={onNavigateToLicenseManager}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Gérer les accès agents</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{isModuleActive ? "Ajouter des licences" : "Activer l'option (39 TND/mois)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOUSCRIPTION / AJOUT DE LICENCES TERRAIN */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Ajustement des Licences Terrain</h3>
                  <p className="text-xs text-slate-400">Module MOD-11 : Flotte Mobile & Opérations Terrain</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white p-1 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Choix du nombre de licences */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nombre de licences agents supplémentaires
              </label>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedExtraSeats(Math.max(1, selectedExtraSeats - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={selectedExtraSeats}
                  onChange={(e) => setSelectedExtraSeats(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-lg"
                />
                <button
                  type="button"
                  onClick={() => setSelectedExtraSeats(selectedExtraSeats + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold hover:bg-slate-700"
                >
                  +
                </button>
                <span className="text-sm text-slate-400">agent(s) supplémentaire(s)</span>
              </div>

              {/* Récapitulatif Tarifaire */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Nouveau quota total d'agents terrain :</span>
                  <strong className="text-white">{subscription.quotas.maxFieldAgents + selectedExtraSeats} agents</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Prix unitaire mensuel :</span>
                  <span className="text-slate-200">39,000 TND HT / agent</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>TVA (19%) :</span>
                  <span className="text-slate-200">{(selectedExtraSeats * 39 * 0.19).toFixed(3)} TND</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-200">Total mensuel supplémentaire TTC :</span>
                  <span className="text-amber-400">{(selectedExtraSeats * 39 * 1.19).toFixed(3)} TND / mois</span>
                </div>
              </div>
            </div>

            {/* Boutons validation */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider et activer (+{selectedExtraSeats} licence(s))</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bon de commande par virement */}
      <WireTransferOrderModal
        isOpen={wireModalOpen}
        onClose={() => setWireModalOpen(false)}
        tenantId={tenantId}
        priceMonthlyTnd={wireModalPrice}
        onConfirmOrder={() => {
          setActionSuccessMessage(`Bon de commande pour ${wireModalModuleCode} enregistré avec succès. Activation en cours d'étude par le service financier.`);
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />
    </div>
  );
};
