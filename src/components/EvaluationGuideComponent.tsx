import React from 'react';
import { BookOpen, Zap } from 'lucide-react';

interface EvaluationGuideComponentProps {
  activeCompanyName: string;
  trialDurationDays: number;
  trialExpiredOverride: boolean;
  handleUpdateTrialExpiredOverride: (val: boolean) => void;
  isSimulationActive: boolean;
  setIsSimulationActive: (val: boolean) => void;
  onUpdateTrialDurationDays?: (days: number) => void;
}

export default function EvaluationGuideComponent({
  activeCompanyName,
  trialDurationDays,
  trialExpiredOverride,
  handleUpdateTrialExpiredOverride,
  isSimulationActive,
  setIsSimulationActive,
  onUpdateTrialDurationDays,
}: EvaluationGuideComponentProps) {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-850 shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500 opacity-5 rounded-full blur-2xl"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-900 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5 font-display font-sans">
              <span>Marche à Suivre : Cycle d’Évaluation Elyssa</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-950 border border-indigo-850 text-indigo-400 text-[8.5px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider font-mono">
              Compte : {activeCompanyName}
            </span>
          </div>
        </div>

        {/* 4-step workflow details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-1.5 font-sans">
            <div className="text-indigo-400 font-black text-xs font-mono font-bold">Étape 01</div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Création Prospect</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Inscrivez-vous via le bouton <strong>"Créer mon compte d'évaluation"</strong> sur la page d'accueil d'accueil. Cela génère automatiquement votre fiche et vos accès d'équipe.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-1.5 font-sans">
            <div className="text-indigo-400 font-black text-xs font-mono font-bold">Étape 02</div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Période d'Évaluation</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Bénéficiez du service complet durant {trialDurationDays} jours de simulation. Pour tester le verrouillage post-essai immédiatement, utilisez notre interrupteur ci-dessous !
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-1.5 font-sans">
            <div className="text-indigo-400 font-black text-xs font-mono font-bold">Étape 03</div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Demande d'Achat</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Sélectionnez un pack ou un module ci-dessous. Au lieu de payer par carte de manière fictive, soumettez une <strong>Demande d'Activation par virement</strong> pour l'envoyer au Hub !
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-1.5 font-sans">
            <div className="text-indigo-400 font-black text-xs font-mono font-bold">Étape 04</div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Émission de Licence</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Allez dans l’Espace Éditeur (SuperAdmin) pour valider la demande d’un clic, émettre la clé de licence Tunisienne sécurisée, et l'insérer dans l'Espace Client !
            </p>
          </div>
        </div>

        {/* Simulation Quick Switcher Dashboard */}
        <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-900/40 space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Console de Simulation & Pilotage de l'Essai (Testeur)</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                Contrôlez l'horloge système et simulez les états d'alerte et de validation pour vérifier l'exactitude des protections de Elyssa ERP/CRM.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleUpdateTrialExpiredOverride(!trialExpiredOverride)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition duration-200 ${
                  trialExpiredOverride
                    ? 'bg-red-900/40 border-red-500 text-red-400 hover:bg-neutral-950 shadow-md font-sans'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white font-sans'
                }`}
              >
                {trialExpiredOverride ? '⚡ Simuler Période Active (J-0)' : '⚠️ Simuler Expiration (J+8)'}
              </button>

              <button
                type="button"
                onClick={() => setIsSimulationActive(!isSimulationActive)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition duration-200 ${
                  isSimulationActive
                    ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400 hover:bg-neutral-950 shadow-md font-sans'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white font-sans'
                }`}
              >
                {isSimulationActive ? '🗑️ Nettoyer Données Démo' : '➕ Injecter Données Démo'}
              </button>
            </div>
          </div>

          <div className="text-[10px] leading-relaxed font-semibold text-slate-300 font-sans space-y-1.5">
            {trialExpiredOverride ? (
              <div className="text-red-400 flex items-start gap-1.5">
                <span>🛑</span>
                <span>
                  <strong>Alerte d'évaluation Expirée simulée :</strong> L'accès complet de l'entreprise est suspendu. Tous les modules métier (Finance, CRM, Paie, etc.) sont bloqués. Seul l'Espace Client (cette page) reste déverrouillé afin de vous permettre de soumettre une commande d'achat ou d'activer une clé de licence valide.
                </span>
              </div>
            ) : (
              <div className="text-emerald-400 flex items-start gap-1.5">
                <span>✓</span>
                <span>
                  <strong>Période active :</strong> Le service fonctionne de manière nominale avec accès intégral à tous les modules de démonstration.
                </span>
              </div>
            )}

            {isSimulationActive ? (
              <div className="text-teal-400 flex items-start gap-1.5">
                <span>💡</span>
                <span>
                  <strong>Données de Démo Actives :</strong> Des dizaines de clients fictifs tunisiens, des factures, des écritures comptables, des fiches de paie et des mouvements de stocks ont été injectés dans votre espace pour tester l'ERP à 100%. Vous pouvez les désactiver à tout moment pour vider l'espace de travail.
                </span>
              </div>
            ) : (
              <div className="text-slate-450 flex items-start gap-1.5">
                <span>⚙️</span>
                <span>
                  <strong>Espace Vierge :</strong> L'ERP est actuellement vide de données. Cliquez sur <em>"Injecter Données Démo"</em> ci-dessus pour peupler l'intégralité des modules métier d'un clic avec de magnifiques simulations d'activité.
                </span>
              </div>
            )}

            {/* Durée de l'essai personnalisable par l'éditeur / administrateur */}
            <div className="pt-3.5 mt-2 border-t border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
              <div>
                <h5 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-indigo-400">⚙️</span>
                  <span>Durée du Cycle d'Évaluation</span>
                </h5>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                  Ajustez le délai d'essai gratuit offert aux nouveaux prospects de la plateforme en jours.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 px-3 rounded-xl border border-indigo-950">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={trialDurationDays}
                    onChange={(e) => onUpdateTrialDurationDays?.(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 bg-transparent text-white border-0 p-0 text-[11px] font-black font-mono text-center focus:ring-0 focus:outline-none"
                  />
                  <span className="text-[9.5px] font-extrabold text-slate-450 uppercase font-mono select-none">jours</span>
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-950/60">
                  <button
                    type="button"
                    onClick={() => onUpdateTrialDurationDays?.(7)}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                      trialDurationDays === 7 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTrialDurationDays?.(14)}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                      trialDurationDays === 14 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Semaines
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTrialDurationDays?.(30)}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                      trialDurationDays === 30 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Mois
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTrialDurationDays?.(90)}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                      trialDurationDays === 90 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3 Mois
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
