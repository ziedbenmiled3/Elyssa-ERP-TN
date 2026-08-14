import React from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound, HelpCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_MODULES_METADATA } from './SaaSConfig';

interface LockedModuleScreenProps {
  tabId: string;
  activeCompanyName: string;
  onGoToSaaSConfig: () => void;
  onGoToActivation: () => void;
}

export default function LockedModuleScreen({
  tabId,
  activeCompanyName,
  onGoToSaaSConfig,
  onGoToActivation,
}: LockedModuleScreenProps) {
  // Find the metadata for the locked module
  const metadata = ALL_MODULES_METADATA.find((m) => m.id === tabId);

  const moduleName = metadata?.name || 'Service Collaboratif';
  const moduleDesc = metadata?.desc || 'Accès à des fonctionnalités avancées d\'Elyssa ERP / CRM pour votre structure d\'activité commerciale.';
  const modulePrice = metadata?.price || 15;
  const moduleCategory = metadata?.category || 'PILOTAGE & STRATÉGIE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto my-8 px-4"
    >
      {/* 🔒 CONTAINER D'AFFICHAGE DU MODULE VERROUILLÉ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl p-8 md:p-12 text-center text-white">
        {/* Subtle glowing radial background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Badge de catégorie avec un petit astérisque ou sparkle */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-950/45 border border-indigo-900/60 text-indigo-300">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>MODULE {moduleCategory}</span>
          </div>

          {/* Îcone de verrouillage animée */}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/25">
            <Lock className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981]/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
            </span>
          </div>

          {/* Titre et sous-titre */}
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none font-sans">
              Module "{moduleName}" Verrouillé
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400 leading-relaxed font-sans">
              Cet espace opérationnel n’est pas inclus dans la formule d'abonnement active de de l'entreprise{' '}
              <strong className="text-white uppercase font-sans">{activeCompanyName}</strong>. 
              Vous pouvez y accéder instantanément en personnalisant vos modules à la carte.
            </p>
          </div>

          {/* Description de valeur / ce qu'apporte le module */}
          <div className="max-w-lg mx-auto bg-slate-900/60 border border-slate-800/60 p-5 rounded-2xl text-left space-y-3.5">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">Ce que comprend ce module :</h4>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  {moduleDesc}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Tarif unitaire à la carte
              </span>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-450 font-mono">{modulePrice} TND</span>
                <span className="text-[10px] text-slate-500 font-sans"> / mois</span>
              </div>
            </div>
          </div>

          {/* Boutons d'action premium */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <button
              onClick={onGoToSaaSConfig}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-250 shadow-lg shadow-indigo-600/10 border border-indigo-500 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Activer à la Carte</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={onGoToActivation}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-250 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Saisir une Clé de Licence</span>
            </button>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-sans">
              ★ INTÉGRITY SYSTEM BY ELYSSA ENTERPRISES ★
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
