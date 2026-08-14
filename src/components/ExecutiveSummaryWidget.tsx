import React, { useState } from 'react';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, Maximize2, X, FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAiCopilot } from '../hooks/useAiCopilot';

export function ExecutiveSummaryWidget({ 
  companyId = 'default', 
  isDemo = false,
  onOpenChat
}: { 
  companyId?: string;
  isDemo?: boolean;
  onOpenChat?: () => void;
}) {
  const { data, isLoading, isGenerating, error, generateInsights } = useAiCopilot(companyId);
  const [showNarrative, setShowNarrative] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <>
      {/* Sleek Compact Banner (Minimal Vertical Space) */}
      <div className="bg-slate-900/90 dark:bg-slate-900 border border-indigo-500/20 rounded-xl p-3 px-4 shadow-sm backdrop-blur-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand & Health Score Pill */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Elyssa AI Copilot & BI
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 font-medium uppercase tracking-wider border border-slate-700">
                    Demo
                  </span>
                )}
              </h2>

              {data && (
                <div className={`px-2 py-0.5 rounded-full text-xs font-black border ${getScoreBadgeClass(data.summary.healthScore)} flex items-center space-x-1 ml-2`}>
                  <span>Score IA :</span>
                  <span className="font-mono text-sm">{data.summary.healthScore}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Center/Headline preview (if data) */}
          {data && (
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-300 max-w-md truncate">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping flex-shrink-0" />
              <span className="truncate font-medium">{data.summary.headline}</span>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {data && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all text-xs font-bold cursor-pointer"
                title="Ouvrir le rapport complet en Popup"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Rapport Complet IA</span>
              </button>
            )}

            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-bold shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Copilot</span>
              </button>
            )}

            <button
              onClick={generateInsights}
              disabled={isGenerating || isLoading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
              title="Actualiser l'analyse"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-400 text-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={generateInsights}
              className="underline text-[11px] font-semibold hover:text-rose-300"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* NON-INTRUSIVE MODAL POPUP (FULL BI REPORT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Bilan de Santé Financière & BI
                    {isDemo && <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 uppercase">Demo</span>}
                  </h3>
                  <p className="text-xs text-slate-400">Analyse Elyssa AI Copilot pour {companyId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generateInsights}
                  disabled={isGenerating || isLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isLoading && !data ? (
                <div className="animate-pulse flex space-x-6 p-4">
                  <div className="w-28 h-28 rounded-full bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-6 bg-slate-800 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-5/6" />
                      <div className="h-4 bg-slate-800 rounded w-4/6" />
                    </div>
                  </div>
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Gauge & Main Headline Card */}
                  <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-col items-center justify-center flex-shrink-0">
                      <div className={`relative w-28 h-28 rounded-full border-[6px] flex items-center justify-center ${getScoreBg(data.summary.healthScore)}`}>
                        <div className="text-center">
                          <span className={`text-3xl font-black ${getScoreColor(data.summary.healthScore)}`}>
                            {data.summary.healthScore}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            / 100
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>Mis à jour {new Date(data.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                        Synthèse de santé
                      </span>
                      <h4 className="text-lg font-bold text-white leading-tight mb-3">
                        {data.summary.headline}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Cette évaluation est générée dynamiquement par Elyssa AI Copilot à partir de vos flux de facturation, trésorerie et alertes comptables.
                      </p>
                    </div>
                  </div>

                  {/* Key Takeaways */}
                  <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-400" />
                      Points Clés & Diagnostique
                    </h5>
                    <ul className="space-y-3">
                      {data.summary.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Markdown Narrative */}
                  <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                    <button
                      onClick={() => setShowNarrative(!showNarrative)}
                      className="w-full flex items-center justify-between text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Analyse détaillée et Recommandations Stratégiques</span>
                      </div>
                      {showNarrative ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showNarrative && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-300 leading-relaxed max-w-none">
                        <div className="markdown-body">
                          <Markdown>{data.summary.aiNarrativeMd}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm mb-4">Aucune analyse disponible pour le moment.</p>
                  <button
                    onClick={generateInsights}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    Lancer l'analyse AI
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
              {onOpenChat && (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onOpenChat();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Poser une question au Copilot</span>
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="ml-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

