/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompetitorReport } from '../types';
import { 
  Building2, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Globe, 
  Search, 
  ShieldAlert, 
  Lightbulb, 
  BookOpen, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface MarketIntelligenceProps {
  competitors: CompetitorReport[];
  onUpdateCompetitors: (updatedCompetitors: CompetitorReport[]) => void;
}

export default function MarketIntelligence({ competitors, onUpdateCompetitors }: MarketIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'study' | 'competitors'>('study');

  // Competitor list states
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [compName, setCompName] = useState('');
  const [compSector, setCompSector] = useState('');
  const [compStrengths, setCompStrengths] = useState('');
  const [compWeaknesses, setCompWeaknesses] = useState('');
  const [compPricing, setCompPricing] = useState<'Cheap' | 'Competitive' | 'Premium'>('Competitive');
  const [compShare, setCompShare] = useState<number>(10);
  const [compNote, setCompNote] = useState('');

  // Market Study AI state
  const [studySector, setStudySector] = useState('Textile & Habillement bio-éthique');
  const [studyScale, setStudyScale] = useState('Exportation');
  const [studyCountry, setStudyCountry] = useState('France, Italie, Allemagne');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isLoadingStudy, setIsLoadingStudy] = useState(false);

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compSector) return;

    const newComp: CompetitorReport = {
      id: `comp_${Date.now()}`,
      competitorName: compName,
      sectorName: compSector,
      strengths: compStrengths.split(',').map(s => s.trim()).filter(Boolean),
      weaknesses: compWeaknesses.split(',').map(w => w.trim()).filter(Boolean),
      pricingIndex: compPricing,
      marketShare: Number(compShare),
      strategicWatchNote: compNote,
      recordedDate: new Date().toISOString().split('T')[0]
    };

    onUpdateCompetitors([newComp, ...competitors]);
    setIsAddingCompetitor(false);

    // reset
    setCompName('');
    setCompSector('');
    setCompStrengths('');
    setCompWeaknesses('');
    setCompShare(10);
    setCompNote('');
  };

  const handleDeleteCompetitor = (id: string) => {
    if (!confirm('Supprimer ce concurrent de la veille stratégique ?')) return;
    onUpdateCompetitors(competitors.filter(c => c.id !== id));
  };

  // Run Gemini market opportunities analysis
  const handleLaunchMarketStudy = async () => {
    setIsLoadingStudy(true);
    setAiAnalysisResult(null);

    try {
      const adminSettingsRaw = localStorage.getItem('carthage_admin_settings');
      const customKey = adminSettingsRaw ? JSON.parse(adminSettingsRaw).geminiApiKey : '';
      const response = await fetch('/api/gemini/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': customKey || ''
        },
        body: JSON.stringify({
          sector: studySector,
          scale: studyScale,
          targetCountry: studyCountry
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiAnalysisResult(data.analysis);
      } else {
        setAiAnalysisResult("Erreur lors de la communication avec l'IA Gemini. Veuillez ré-essayer.");
      }
    } catch (e: any) {
      console.error(e);
      setAiAnalysisResult("Une erreur réseau ou serveur s'est produite lors de l'étude strategique.");
    } finally {
      setIsLoadingStudy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab select section */}
      <div className="flex border-b border-slate-150">
        <button 
          onClick={() => setActiveTab('study')}
          className={`pb-3 text-xs font-bold px-4 transition ${
            activeTab === 'study' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Analyse d'Opportunités & Études IA
        </button>
        <button 
          onClick={() => setActiveTab('competitors')}
          className={`pb-3 text-xs font-bold px-4 transition ${
            activeTab === 'competitors' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Rapports Périodiques sur la Concurrence ({competitors.length})
        </button>
      </div>

      {activeTab === 'study' ? (
        /* STUDY LAYOUT AREA WITH GEMINI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4 h-fit">
            <span className="font-bold text-slate-800 text-sm flex items-center space-x-1">
              <Brain className="w-5 h-5 text-indigo-600" />
              <span>Générateur d'Opportunités (IA Gemini)</span>
            </span>
            <p className="text-xs text-slate-400">Générez une étude de rentabilité de marché sur mesure pour saisir des opportunités locales et à l'export.</p>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Secteur Industriel ou Commercial :</label>
                <input 
                  type="text" 
                  value={studySector}
                  onChange={(e) => setStudySector(e.target.value)}
                  className="p-2 border rounded bg-slate-50 w-full"
                  placeholder="Ex: Cimenterie, Huile d'olive, Recyclage..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Échelle de Marché :</label>
                <select 
                  value={studyScale}
                  onChange={(e) => setStudyScale(e.target.value)}
                  className="p-2 border rounded bg-slate-50 w-full"
                >
                  <option value="Local">Marché Local Tunisien uniquement</option>
                  <option value="Exportation">Marché d'Exportation International</option>
                  <option value="Hybride">Hybride (Local & Export)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Pays Cibles :</label>
                <input 
                  type="text" 
                  value={studyCountry}
                  onChange={(e) => setStudyCountry(e.target.value)}
                  className="p-2 border rounded bg-slate-50 w-full"
                  placeholder="Ex: France, Algérie, Libye, Italie..."
                />
              </div>

              <button 
                onClick={handleLaunchMarketStudy}
                disabled={isLoadingStudy}
                className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition flex items-center justify-center space-x-2 disabled:bg-indigo-300"
              >
                {isLoadingStudy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyse économique en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer l'analyse de Rentabilité</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Analysis Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-150 p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Conclusions & Étude Stratégique Générée</span>
            </h3>

            {aiAnalysisResult ? (
              <div className="prose prose-sm text-slate-700 max-w-none text-xs leading-relaxed space-y-3 mt-4 whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-slate-100">
                {aiAnalysisResult}
              </div>
            ) : isLoadingStudy ? (
              <div className="text-center py-24 flex-1 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest animate-pulse">L'IA Gemini modélise l'opportunité de marché...</span>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">Nous calculons les variables de rentabilité fiscale en Tunisie (retenues à la source, taux de douane, régimes de suspens d'export) pour vous livrer une recommandation rigoureuse.</p>
              </div>
            ) : (
              <div className="text-center py-20 flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Lightbulb className="w-12 h-12 text-slate-300 mb-2" />
                <p>Aucune étude n'est en cours. Entrez vos critères géographiques à gauche et cliquez sur le bouton de génération pour obtenir un diagnostic économique complet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COMPETITORS MANAGEMENT SYSTEM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitor addition form */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4 h-fit">
            <span className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Enregistrer un Concurrent Direct</span>
            </span>

            <form onSubmit={handleAddCompetitor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Nom du Concurrent :</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Eurasia Agro..."
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="p-1.5 border rounded w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Secteur / Domaine d'activité :</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Textile Export / Marbre..."
                  value={compSector}
                  onChange={(e) => setCompSector(e.target.value)}
                  className="p-1.5 border rounded w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Forces d'attraction (Séparés par virgule) :</label>
                <input 
                  type="text" 
                  placeholder="Ex: Prix bas, grande capacité usine..."
                  value={compStrengths}
                  onChange={(e) => setCompStrengths(e.target.value)}
                  className="p-1.5 border rounded w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Faiblesses identifiées (Séparés par virgule) :</label>
                <input 
                  type="text" 
                  placeholder="Ex: Pas de SAV local, lenteur transport..."
                  value={compWeaknesses}
                  onChange={(e) => setCompWeaknesses(e.target.value)}
                  className="p-1.5 border rounded w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">Tarification :</label>
                  <select 
                    value={compPricing}
                    onChange={(e: any) => setCompPricing(e.target.value)}
                    className="p-1 border rounded w-full"
                  >
                    <option value="Cheap">Bas de gamme / Low-Cost</option>
                    <option value="Competitive">Compétitif / Équivalent</option>
                    <option value="Premium">Haut de gamme / Premium</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">Part de marché (%) :</label>
                  <input 
                    type="number" 
                    value={compShare}
                    onChange={(e) => setCompShare(Number(e.target.value))}
                    className="p-1 border rounded w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Note de veille stratégique brute :</label>
                <textarea 
                  value={compNote}
                  onChange={(e) => setCompNote(e.target.value)}
                  rows={3}
                  className="p-1.5 border rounded w-full text-xs"
                  placeholder="Inscrivez les rumeurs marchés, les appels d'offres approchés..."
                />
              </div>

              <button 
                type="submit"
                className="w-full p-2 bg-indigo-600 text-white rounded font-bold"
              >
                Enregistrer la fiche concurrent
              </button>
            </form>
          </div>

          {/* List display */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Rapports de surveillance active</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitors.map(comp => (
                <div key={comp.id} className="bg-white rounded-xl border border-slate-150 p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-800 text-xs">{comp.competitorName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{comp.sectorName}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCompetitor(comp.id)}
                        className="text-slate-300 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-y my-2.5 py-2 text-[10px]">
                      <div>
                        <span className="font-extrabold text-slate-500 block uppercase">Part de marché</span>
                        <span className="font-bold text-slate-800">{comp.marketShare}%</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-500 block uppercase">Tarif</span>
                        <span className="font-bold text-slate-800">{comp.pricingIndex === 'Cheap' ? 'Agressif / Low-Cost' : comp.pricingIndex === 'Premium' ? 'Premium' : 'Compétitif'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px]">
                      <span className="font-bold text-emerald-700 block">Forces:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[10px]">
                        {comp.strengths.slice(0, 3).map((st, i) => <li key={i}>{st}</li>)}
                      </ul>

                      <span className="font-bold text-slate-500 block mt-2">Faiblesses:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[10px]">
                        {comp.weaknesses.slice(0, 3).map((wk, i) => <li key={i}>{wk}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t text-[11px] bg-slate-50 p-2.5 rounded text-slate-600 italic">
                    "{comp.strategicWatchNote || 'Aucune note stratégique particulière enregistrée.'}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
