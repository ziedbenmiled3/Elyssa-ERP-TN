import React from 'react';
import { ElyssaLogo } from './ElyssaLogo';
import { KPIItem, TripartiteWeightingConfig, TripartiteBreakdown } from '../types';

export interface MPOContractTemplateProps {
  id?: string;
  tenantName?: string;
  employeeName: string;
  employeePost?: string;
  department?: string;
  period?: 'mensuel' | 'trimestriel' | 'annuel' | string;
  year?: number;
  monthName?: string;
  primeTargetTnd: number;
  calculatedPrimeTnd?: number;
  achievementRate?: number;
  tripartiteConfig?: TripartiteWeightingConfig;
  tripartiteBreakdown?: TripartiteBreakdown;
  kpis: KPIItem[];
  dateStr?: string;
  contractRef?: string;
  status?: string;
  signedAt?: string;
  managerName?: string;
  managerRole?: string;
  showPrintActions?: boolean;
  onPrint?: () => void;
}

export const MPOContractTemplate: React.FC<MPOContractTemplateProps> = ({
  id = 'mpo-contract-document',
  tenantName = 'SOCIÉTÉ TUNISIENNE ELYSSA S.A.',
  employeeName,
  employeePost = 'Collaborateur Cadre / Agent',
  department = 'Finance & Comptabilité',
  period = 'mensuel',
  year = 2026,
  monthName = 'Août 2026',
  primeTargetTnd = 450,
  calculatedPrimeTnd,
  achievementRate,
  tripartiteConfig = {
    weight_entreprise: 70,
    weight_direction: 20,
    weight_personnel: 10,
    company_achievement_rate: 90
  },
  tripartiteBreakdown,
  kpis = [],
  dateStr,
  contractRef,
  status = 'brouillon',
  signedAt,
  managerName = 'MED ZIED BEN MILED',
  managerRole = 'Fondateur & Super Admin MPO',
  showPrintActions = false,
  onPrint
}) => {
  const currentDate = dateStr || new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const refNumber = contractRef || `MPO-${year}-${(department || 'GEN').substring(0, 3).toUpperCase()}-${(employeeName || 'EMP').substring(0, 3).toUpperCase()}`;

  const isSigned = status === 'valide_signe' || status === 'Signed' || status === 'injecte_paie';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Optional Top Action Bar inside preview */}
      {showPrintActions && (
        <div className="w-full max-w-[700px] mb-3 flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl border border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              isSigned ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {isSigned ? 'CONTRAT VALIDÉ & SIGNÉ' : 'BROUILLON / APERÇU TEMPS RÉEL'}
            </span>
          </div>
          {onPrint && (
            <button
              onClick={onPrint}
              type="button"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <span>🖨️ Imprimer / Exporter le Contrat</span>
            </button>
          )}
        </div>
      )}

      {/* Main A4 Document Paper Sheet */}
      <div
        id={id}
        className="mpo-contract-print-sheet bg-white border border-slate-250 shadow-lg max-w-[700px] w-full p-6 sm:p-8 text-slate-900 font-sans leading-tight text-left text-[10px] bg-no-repeat bg-center relative rounded-xl"
        style={{
          backgroundImage: isSigned
            ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='120px' width='450px'><text x='30' y='75' fill='rgba(16, 185, 129, 0.06)' font-size='34' font-family='sans-serif' font-weight='900' transform='rotate(-12, 15,75)'>VALIDÉ %26 APPROUVÉ MPO</text></svg>\")"
            : "none"
        }}
      >
        {/* 1. EN-TÊTE CORPORATE */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-3 font-sans">
          <div className="flex items-center gap-3">
            <ElyssaLogo className="w-10 h-10 bg-slate-900 rounded-xl p-1.5 shrink-0 border border-slate-800 shadow-xs" />
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-[11px] text-slate-950 tracking-wide uppercase">
                {tenantName}
              </h3>
              <p className="text-[8px] text-slate-600 font-bold">
                Elyssa ERP Suite • Systèmes de Pilotage de la Performance MPO
              </p>
              <p className="text-[7.5px] text-slate-500 font-mono leading-none">
                Capital Social : 500 000 DT • RNE : 1832049Z • M.F. : 1548301/A/M/000
              </p>
            </div>
          </div>

          <div className="text-right space-y-0.5 text-[8px] text-slate-600">
            <p className="font-black text-slate-900 tracking-wider">RÉPUBLIQUE TUNISIENNE</p>
            <p className="font-bold text-rose-700">Direction Générale & Ressources Humaines</p>
            <p className="font-mono text-[7.5px] text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
              Réf: {refNumber} • Date: {currentDate}
            </p>
          </div>
        </div>

        {/* TITRE DU DOCUMENT */}
        <div className="text-center mb-3 py-2 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-xl shadow-xs space-y-0.5">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-rose-300">
            CONTRAT DE PERFORMANCE & OBJECTIFS (MPO)
          </h2>
          <p className="text-[8.5px] font-extrabold text-slate-300 uppercase tracking-wider font-mono">
            Système d&apos;Évaluation Tripartite • Période : {monthName || `${period} ${year}`}
          </p>
        </div>

        {/* 2. CORPS DU CONTRAT */}
        <div className="space-y-3 text-[9.5px] text-slate-800 leading-relaxed text-justify">
          
          {/* CLAUSE D'ENGAGEMENT / PRÉAMBULE */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 space-y-1">
            <p className="font-black text-slate-950 uppercase text-[8.5px] tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              Article 1 — Engagement Cadre entre les Parties
            </p>
            <div className="text-[8.5px] text-slate-700 leading-normal space-y-0.5 pt-0.5">
              <p>
                <strong>Entre la Société :</strong> <strong className="text-slate-950">{tenantName}</strong>, représentée par sa Direction Générale et le Responsable MPO <strong className="text-slate-950">{managerName}</strong> ({managerRole}),
              </p>
              <p>
                <strong>Et le Collaborateur :</strong> Monsieur/Madame <strong className="text-slate-950">{employeeName || '[Sélectionner un collaborateur]'}</strong>, occupant les fonctions de <strong className="text-rose-950">{employeePost}</strong> rattaché au pôle/département <strong className="text-slate-950 font-bold">{department}</strong>.
              </p>
              <p className="italic text-slate-500 text-[8px] pt-0.5">
                Il est expressément convenu et arrêté le présent contrat de fixation d&apos;objectifs individuels et collectifs pour la période évaluée <strong>{monthName || `${period} ${year}`}</strong>.
              </p>
            </div>
          </div>

          {/* RÈGLE DE PONDÉRATION TRIPARTITE */}
          <div>
            <p className="font-black text-slate-950 text-[8.5px] uppercase tracking-wider border-b border-slate-200 pb-0.5 font-sans">
              Article 2 — Règle de Pondération Tripartite de la Performance
            </p>
            <p className="text-[8.5px] text-slate-700 mt-1 leading-snug">
              Conformément à la charte MPO de l&apos;entreprise, la performance globale est articulée autour de 3 axes d&apos;évaluation interconnectés :
            </p>

            <div className="grid grid-cols-3 gap-2 my-1.5">
              <div className="p-2 bg-rose-50/60 border border-rose-200 rounded-lg text-center space-y-0.5">
                <span className="text-[7.5px] font-black uppercase text-rose-800 block">Axe 1. Entreprise</span>
                <span className="text-[12px] font-black font-mono text-rose-900 block">{tripartiteConfig.weight_entreprise}%</span>
                <span className="text-[7px] text-rose-700 block">Atteinte Générale : {tripartiteConfig.company_achievement_rate}%</span>
              </div>

              <div className="p-2 bg-sky-50/60 border border-sky-200 rounded-lg text-center space-y-0.5">
                <span className="text-[7.5px] font-black uppercase text-sky-800 block">Axe 2. Direction ({department.substring(0, 12)})</span>
                <span className="text-[12px] font-black font-mono text-sky-900 block">{tripartiteConfig.weight_direction}%</span>
                <span className="text-[7px] text-sky-700 block">
                  Atteinte Pôle : {tripartiteBreakdown?.rate_direction ?? 90}%
                </span>
              </div>

              <div className="p-2 bg-amber-50/60 border border-amber-200 rounded-lg text-center space-y-0.5">
                <span className="text-[7.5px] font-black uppercase text-amber-800 block">Axe 3. Personnel (KPIs)</span>
                <span className="text-[12px] font-black font-mono text-amber-900 block">{tripartiteConfig.weight_personnel}%</span>
                <span className="text-[7px] text-amber-700 block">
                  Atteinte KPIs : {tripartiteBreakdown?.rate_personnel ?? achievementRate ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* TABLEAU DYNAMIQUE DES KPIS */}
          <div>
            <p className="font-black text-slate-950 text-[8.5px] uppercase tracking-wider border-b border-slate-200 pb-0.5 font-sans mb-1">
              Article 3 — Tableau Dynamique des KPIs & Objectifs d&apos;Activité
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-250 bg-white">
              <table className="w-full text-left text-[8px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono uppercase tracking-wider text-[7.5px]">
                    <th className="p-1.5 w-7 text-center border-r border-slate-700">#</th>
                    <th className="p-1.5 border-r border-slate-700">Intitulé de l&apos;Objectif KPI</th>
                    <th className="p-1.5 w-20 text-center border-r border-slate-700">Cible Attendu</th>
                    <th className="p-1.5 w-16 text-center border-r border-slate-700">Unité</th>
                    <th className="p-1.5 w-16 text-center border-r border-slate-700">Poids %</th>
                    <th className="p-1.5 w-20 text-center">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                  {kpis && kpis.length > 0 ? (
                    kpis.map((kpi, idx) => (
                      <tr key={kpi.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-1.5 font-mono font-bold text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-1.5 font-bold text-slate-950 border-r border-slate-200">
                          {kpi.title}
                          {kpi.notes && (
                            <span className="block text-[7px] font-normal text-slate-500 italic mt-0.5">{kpi.notes}</span>
                          )}
                        </td>
                        <td className="p-1.5 font-mono font-extrabold text-center text-rose-950 border-r border-slate-200">
                          {typeof kpi.target_value === 'number' ? kpi.target_value.toLocaleString('fr-FR') : kpi.target_value}
                        </td>
                        <td className="p-1.5 text-center font-bold text-slate-700 border-r border-slate-200">{kpi.unit || '—'}</td>
                        <td className="p-1.5 font-mono font-black text-center text-rose-700 border-r border-slate-200">{kpi.weight_percent}%</td>
                        <td className="p-1.5 text-center text-[7px] font-bold text-slate-600">
                          {kpi.data_source === 'auto_pos_sales' ? '🛒 POS ERP' :
                           kpi.data_source === 'auto_deliveries' ? '🚚 Livraisons' :
                           kpi.data_source === 'auto_picking' ? '📦 Stock' : '✍️ Manager'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-3 text-center italic text-slate-400">
                        Aucun objectif KPI défini pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MONTANT PRIME CIBLE & CONDITIONS DE VERSEMENT PAIE */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-2.5 space-y-1">
            <p className="font-black text-rose-950 uppercase text-[8.5px] tracking-wider border-b border-rose-200 pb-0.5">
              Article 4 — Montant de la Prime Cible & Engagement de Versement en Paie
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div>
                <p className="text-[8.5px] text-slate-800">
                  Montant de la Prime Cible (100% d&apos;atteinte) : <strong className="text-rose-900 font-mono text-[10px] font-black">{primeTargetTnd.toFixed(3)} TND</strong>
                </p>
                {calculatedPrimeTnd !== undefined && (
                  <p className="text-[8px] text-slate-600 font-mono mt-0.5">
                    Prime Calculée Tripartite : <strong className="text-emerald-700 font-extrabold">{calculatedPrimeTnd.toFixed(3)} TND</strong> (Taux Global: {achievementRate ?? 0}%)
                  </p>
                )}
              </div>

              <div className="text-[7.5px] bg-white border border-rose-300 p-1.5 rounded-lg text-rose-900 font-bold max-w-[280px]">
                ⚡ Versement Paie : Transmis automatiquement dans la fiche de paie mensuelle du collaborateur sous la rubrique &quot;Prime MPO / Performance&quot;.
              </div>
            </div>
          </div>

        </div>

        {/* 3. PIED DE PAGE & SIGNATURES */}
        <div className="mt-5 pt-3 border-t-2 border-slate-900 space-y-3 font-sans">
          <div className="grid grid-cols-2 gap-6 text-[8.5px]">
            {/* BLOC VISA DIRECTION / MANAGER */}
            <div className="border border-slate-250 bg-slate-50/50 p-2.5 rounded-xl space-y-1">
              <p className="font-black text-slate-900 uppercase text-[8px] tracking-wider border-b border-slate-200 pb-1 flex justify-between items-center">
                <span>Visa Direction / Manager</span>
                <span className="text-[7px] font-mono text-slate-500 font-normal">Sceau & Signature</span>
              </p>
              <div className="pt-1 space-y-0.5 text-slate-700">
                <p><strong>Nom :</strong> {managerName}</p>
                <p><strong>Rôle :</strong> {managerRole}</p>
                <p className="text-[7.5px] text-emerald-700 font-bold mt-1">✓ Validé & Approuvé pour exécution</p>
                <div className="h-10 mt-1 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[7.5px] text-slate-400 italic bg-white">
                  [ Cachet Officiel Elyssa ERP / MPO ]
                </div>
              </div>
            </div>

            {/* BLOC VISA & SIGNATURE DU COLLABORATEUR */}
            <div className="border border-slate-250 bg-slate-50/50 p-2.5 rounded-xl space-y-1">
              <p className="font-black text-slate-900 uppercase text-[8px] tracking-wider border-b border-slate-200 pb-1 flex justify-between items-center">
                <span>Visa & Signature Collaborateur</span>
                <span className="text-[7px] font-mono text-slate-500 font-normal">Mention obligatoire</span>
              </p>
              <div className="pt-1 space-y-0.5 text-slate-700">
                <p><strong>Nom :</strong> {employeeName || '--------------------'}</p>
                <p className="text-[7.5px] italic text-slate-500">
                  &quot;Lu et approuvé — Bon pour accord sur les objectifs et modalités MPO&quot;
                </p>
                <div className="h-10 mt-1 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[7.5px] text-slate-400 italic bg-white">
                  {isSigned ? (
                    <span className="font-mono text-emerald-700 font-bold text-[8.5px]">
                      ✍️ Signé Numériquement ({signedAt ? new Date(signedAt).toLocaleDateString('fr-FR') : currentDate})
                    </span>
                  ) : (
                    '[ Emplacement Signature Collaborateur ]'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER METADATA */}
          <div className="text-[7px] text-slate-400 text-center font-mono pt-1 flex justify-between items-center border-t border-slate-100">
            <span>Elyssa ERP • Générateur de Contrats MPO v2.5</span>
            <span>Document Officiel confidentiel — Reproduction interdite</span>
            <span>Page 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
