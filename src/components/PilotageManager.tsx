/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Invoice } from '../types';
import { formatTND } from '../utils/calculations';
import IframePrintHelper from './IframePrintHelper';
import { 
  Target, 
  TrendingUp, 
  Compass, 
  Sliders, 
  Printer, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  HelpCircle, 
  ChevronRight, 
  Calendar,
  Users,
  Briefcase,
  ArrowUpRight,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface PilotageManagerProps {
  clients: Client[];
  invoices: Invoice[];
}

interface FinancialGoals {
  targetCA: number;               // Annual Turnover goal (TND)
  targetCollectionRate: number;   // Target Cash collection rate %
  targetWithholdingRate: number;  // Target RS certificate recovery rate %
  targetNewClients: number;       // Target count of active clients
}

interface PilotageMilestone {
  id: string;
  title: string;
  targetDate: string;
  status: 'Completed' | 'In_Progress' | 'Pending' | 'Delayed';
  description: string;
}

interface TacticalMeasure {
  id: string;
  scenario: string;
  remedy: string;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
}

export default function PilotageManager({ clients, invoices }: PilotageManagerProps) {
  // 1. Core Financial Data computation
  const totalHT = invoices.reduce((sum, inv) => sum + inv.amountHT, 0);
  const totalTTC = invoices.reduce((sum, inv) => sum + inv.amountTTC, 0);
  const totalCollected = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.amountNetToPay || 0), 0);
  
  const totalWithholdingTax = invoices.reduce((sum, inv) => sum + (inv.withholdingAmount || 0), 0);
  const rsCertificatesReceivedCount = invoices
    .filter(inv => inv.withholdingAmount > 0 && inv.withholdingCertificateReceived)
    .length;
  const rsCertificatesTotalCount = invoices.filter(inv => inv.withholdingAmount > 0).length;
  
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Debt_Collection')
    .reduce((sum, inv) => sum + inv.amountNetToPay, 0);

  const activeClientsCount = clients.filter(c => c.status === 'Active').length;

  // Collection Rate Calculations
  const collectionRate = totalTTC > 0 ? (totalCollected / totalTTC) * 100 : 100;
  const rsRecoveryRate = rsCertificatesTotalCount > 0 ? (rsCertificatesReceivedCount / rsCertificatesTotalCount) * 100 : 100;

  // 2. Load / Save Financial Goals from LocalStorage
  const [goals, setGoals] = useState<FinancialGoals>(() => {
    const saved = localStorage.getItem('carthage_financial_goals');
    return saved ? JSON.parse(saved) : {
      targetCA: 1200000,
      targetCollectionRate: 90,
      targetWithholdingRate: 95,
      targetNewClients: 8
    };
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempTargetCA, setTempTargetCA] = useState(goals.targetCA);
  const [tempTargetCollectionRate, setTempTargetCollectionRate] = useState(goals.targetCollectionRate);
  const [tempTargetWithholdingRate, setTempTargetWithholdingRate] = useState(goals.targetWithholdingRate);
  const [tempTargetNewClients, setTempTargetNewClients] = useState(goals.targetNewClients);

  // 3. Goals persistence
  useEffect(() => {
    localStorage.setItem('carthage_financial_goals', JSON.stringify(goals));
  }, [goals]);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setGoals({
      targetCA: Number(tempTargetCA),
      targetCollectionRate: Number(tempTargetCollectionRate),
      targetWithholdingRate: Number(tempTargetWithholdingRate),
      targetNewClients: Number(tempTargetNewClients)
    });
    setIsEditingGoals(false);
  };

  // 4. Milestones ("Tracer la Route")
  const [milestones, setMilestones] = useState<PilotageMilestone[]>(() => {
    const saved = localStorage.getItem('carthage_pilotage_milestones');
    return saved ? JSON.parse(saved) : [
      { id: 'm1', title: 'Sécuriser le CA de Poulina Group', targetDate: '2026-07-15', status: 'In_Progress', description: 'Atteindre 150k TND de livraisons facturées et collectées avant mi-juillet.' },
      { id: 'm2', title: 'Apurement total des Retenues à la Source', targetDate: '2026-08-30', status: 'Pending', description: 'Récupérer 100% des fiches de certification RS du 1er semestre auprès des clients locaux.' },
      { id: 'm3', title: 'Audit Logistique & Temps d\'Attente', targetDate: '2026-09-15', status: 'Completed', description: 'Mettre en place la cellule de suivi inter-services pour éliminer les retards de livraison de Sfax.' },
      { id: 'm4', title: 'Audit d\'Expansion Export (France/Italie)', targetDate: '2026-11-30', status: 'Pending', description: 'Contracter notre premier distributeur bio-éthique ou certifié sur la zone Euro.' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('carthage_pilotage_milestones', JSON.stringify(milestones));
  }, [milestones]);

  const [newMTitle, setNewMTitle] = useState('');
  const [newMDate, setNewMDate] = useState('');
  const [newMDesc, setNewMDesc] = useState('');
  const [newMStatus, setNewMStatus] = useState<'Completed' | 'In_Progress' | 'Pending' | 'Delayed'>('Pending');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMTitle || !newMDate) return;
    const newM: PilotageMilestone = {
      id: `milestone_${Date.now()}`,
      title: newMTitle,
      targetDate: newMDate,
      status: newMStatus,
      description: newMDesc
    };
    setMilestones([...milestones, newM]);
    setNewMTitle('');
    setNewMDate('');
    setNewMDesc('');
    setNewMStatus('Pending');
    setIsAddingMilestone(false);
  };

  const toggleMilestoneStatus = (id: string) => {
    const statusCycle: Record<string, 'Completed' | 'In_Progress' | 'Pending' | 'Delayed'> = {
      'Pending': 'In_Progress',
      'In_Progress': 'Completed',
      'Completed': 'Delayed',
      'Delayed': 'Pending'
    };
    setMilestones(milestones.map(m => m.id === id ? { ...m, status: statusCycle[m.status] } : m));
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // 5. Corrective Action Measures ("Prendre des mesures")
  const [tacticalMeasures, setTacticalMeasures] = useState<TacticalMeasure[]>(() => {
    const saved = localStorage.getItem('carthage_tactical_measures');
    return saved ? JSON.parse(saved) : [
      { id: 't1', scenario: 'Retard de Recouvrement Local > 45 jours', remedy: 'Déclencher la mise en demeure formelle par lettre recommandée et suspendre temporairement les remises logistiques contractuelles.', priority: 'High', done: false },
      { id: 't2', scenario: 'Manque de Certificats de Retenues à la Source (RS)', remedy: 'Envoyer l\'aide-mémoire automatisé prévenant de la pénalité fiscale tunisienne de retard sur l\'impôt des sociétés.', priority: 'High', done: false },
      { id: 't3', scenario: 'Baisse de CA sur le grand Tunis', remedy: 'Planifier une visite de soutien technique avec l\'ingénieur commercial sur le site du client en intégrant une étude de co-développement.', priority: 'Medium', done: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem('carthage_tactical_measures', JSON.stringify(tacticalMeasures));
  }, [tacticalMeasures]);

  const [selectedProblemPreset, setSelectedProblemPreset] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [customRemedy, setCustomRemedy] = useState('');
  const [customPriority, setCustomPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const PROBLEM_PRESETS = [
    { problem: 'Retards de livraison logistique à répétition', remedy: 'Déclencher l\'arbitrage inter-services Qualité/Logistique et mettre en place des indicateurs de pénalités de retard.' },
    { problem: 'Client Poulina en blocage administratif', remedy: 'Organiser une réunion de niveau Direction Générale pour négocier un échéancier d\'apurement bilatéral.' },
    { problem: 'Retenue à la source non certifiée au-delà d\'un trimestre', remedy: 'Appliquer l\'article 52 du code de l\'IRPP et de l\'IS tunisien, stipulant la preuve écrite obligatoire.' },
    { problem: 'Hausse des coûts de stockage de matières premières', remedy: 'Négocier des contrats d\'approvisionnement à flux tendu avec clause de réévaluation trimestrielle auprès des fournisseurs agréés.' }
  ];

  const handleAddTacticalMeasure = (e: React.FormEvent) => {
    e.preventDefault();
    const problemText = selectedProblemPreset ? selectedProblemPreset : customProblem;
    const remedyText = customRemedy;

    if (!problemText || !remedyText) return;

    const newMeasure: TacticalMeasure = {
      id: `tactical_${Date.now()}`,
      scenario: problemText,
      remedy: remedyText,
      priority: customPriority,
      done: false
    };

    setTacticalMeasures([...tacticalMeasures, newMeasure]);
    setSelectedProblemPreset('');
    setCustomProblem('');
    setCustomRemedy('');
    setCustomPriority('Medium');
  };

  const toggleMeasureDone = (id: string) => {
    setTacticalMeasures(tacticalMeasures.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteMeasure = (id: string) => {
    setTacticalMeasures(tacticalMeasures.filter(t => t.id !== id));
  };

  // Preset Selection Helper
  const handleSelectPreset = (problem: string, remedy: string) => {
    setSelectedProblemPreset(problem);
    setCustomRemedy(remedy);
  };

  // 6. Forecasts Engine ("Les Prévisions")
  // Let's compute monthly projections based on the current active clients' revenue potential
  const activeClientsPotential = clients
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + (c.revenuePotential || 0), 0);
  
  // Predict monthly billing based on historical average or pipeline potential
  const projectedMonths = ['Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthlyProgressionBase = totalHT > 0 ? (totalHT / 6) : 65000; // estimated historical metric
  
  // Generate slightly fluctuating monthly forecast values representing high fidelity data pipeline
  const monthlyForecasts = projectedMonths.map((m, idx) => {
    // Slight seasonal variation in Tunisia (August usually slower due to vacations, September/October picking up)
    let multiplier = 1.0;
    if (m === 'Août') multiplier = 0.75; // Vacation drop
    if (m === 'Septembre') multiplier = 1.15; // Back to school surge
    if (m === 'Novembre') multiplier = 1.1; // End of year invoicing
    
    const projectedInvoicing = Math.round(monthlyProgressionBase * multiplier);
    const expectedCollection = Math.round(projectedInvoicing * (goals.targetCollectionRate / 100));
    const potentialAtRisk = Math.round(projectedInvoicing * (1 - (goals.targetCollectionRate / 100)));

    return {
      month: m,
      projectedInvoicing,
      expectedCollection,
      potentialAtRisk
    };
  });

  const totalForecastedInvoicing = monthlyForecasts.reduce((sum, f) => sum + f.projectedInvoicing, 0);
  const totalForecastedCollection = monthlyForecasts.reduce((sum, f) => sum + f.expectedCollection, 0);

  // Revenue by sector calculations
  const sectorMap: Record<string, number> = {};
  clients.forEach(c => {
    const sectorNorm = c.sector || 'Divers';
    sectorMap[sectorNorm] = (sectorMap[sectorNorm] || 0) + (c.revenuePotential || 0);
  });
  const sectorData = Object.entries(sectorMap).map(([name, potential]) => ({ name, potential }));
  const maxPotential = Math.max(...sectorData.map(s => s.potential), 1);

  // Print Functionality
  const triggerPrint = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setPrintTarget('printable-pilotage');
      setIsPrintModalOpen(true);
      return;
    }

    const printContent = document.getElementById('printable-pilotage');
    if (printContent) {
      // Create high-fidelity clone of the element to inject directly into body
      const clone = printContent.cloneNode(true) as HTMLElement;
      clone.id = 'temp-print-root';
      clone.className = 'temp-print-root ' + (printContent.className || '');
      
      // Append clone to body directly
      document.body.appendChild(clone);
      document.body.classList.add('print-mode-active');
      
      // Delay slightly to give browsers time to apply layout classes before popping system Dialog
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error('Print error:', e);
        } finally {
          // Absolute clean-up
          document.body.classList.remove('print-mode-active');
          const tempElement = document.getElementById('temp-print-root');
          if (tempElement) {
            document.body.removeChild(tempElement);
          }
        }
      }, 150);
    } else {
      window.print();
    }
  };

  return (
    <div id="printable-pilotage" className="space-y-6">
      {/* 1. TOP HEADER BANNER (Strategic Steering Presentation) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest bg-yellow-400/25 px-2.5 py-1 rounded text-yellow-300 border border-yellow-400/20 inline-flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            Module de Pilotage Stratégique Elyssa CRM
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-slate-100 font-display">
            Objectifs Commercials & Route Financière
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
            Saisissez et modifiez vos indicateurs cibles, observez les prévisions mensuelles de trésorerie consolidées, cadrez les actions de recouvrement des impayés, et dressez la feuille de route du directoire.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrint}
            className="p-2 px-4 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Imprimer le Plan de Route</span>
          </button>
        </div>
      </div>

      {/* 2. OBJECTIVES & REAL-TIME ALIGNMENT ("Fixation des Objectifs") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Goals Setting Panel */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-indigo-700">
              <Sliders className="w-4 h-4" />
              Fixation des Objectifs Cibles
            </h3>
            {!isEditingGoals ? (
              <button
                onClick={() => {
                  setTempTargetCA(goals.targetCA);
                  setTempTargetCollectionRate(goals.targetCollectionRate);
                  setTempTargetWithholdingRate(goals.targetWithholdingRate);
                  setTempTargetNewClients(goals.targetNewClients);
                  setIsEditingGoals(true);
                }}
                className="text-xs text-indigo-650 hover:underline font-bold"
              >
                Modifier
              </button>
            ) : (
              <button
                onClick={() => setIsEditingGoals(false)}
                className="text-xs text-slate-400 hover:underline"
              >
                Annuler
              </button>
            )}
          </div>

          {!isEditingGoals ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-lg space-y-2 border border-[#1f2a45]">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                  <span>Chiffre d'Affaires Annuel Cible :</span>
                  <span className="text-indigo-400 font-bold font-mono">{formatTND(goals.targetCA)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                  <span>Taux de Recouvrement Trésorerie :</span>
                  <span className="text-indigo-400 font-bold font-mono">{goals.targetCollectionRate}%</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                  <span>Récupération Retenues (RS) :</span>
                  <span className="text-indigo-400 font-bold font-mono">{goals.targetWithholdingRate}%</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                  <span>Clients Clés Actifs Objectif :</span>
                  <span className="text-indigo-400 font-bold font-mono">{goals.targetNewClients} clients</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic font-medium">
                Ces chiffres servent de points de repère pour les calculs de progression de Elyssa S.A.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveGoals} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Chiffre d'Affaires Cible (TND)</label>
                <input
                  type="number"
                  value={tempTargetCA}
                  onChange={(e) => setTempTargetCA(Number(e.target.value))}
                  className="w-full p-2 border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 font-sans">Taux Recouvrement Cible (%)</label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={tempTargetCollectionRate}
                  onChange={(e) => setTempTargetCollectionRate(Number(e.target.value))}
                  className="w-full p-2 border border-[#28375c] rounded text-xs bg-black text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 font-sans">Récupération Certificats RS (%)</label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={tempTargetWithholdingRate}
                  onChange={(e) => setTempTargetWithholdingRate(Number(e.target.value))}
                  className="w-full p-2 border border-[#28375c] rounded text-xs bg-black text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 font-sans">Clients Clés Actifs Objectif</label>
                <input
                  type="number"
                  value={tempTargetNewClients}
                  onChange={(e) => setTempTargetNewClients(Number(e.target.value))}
                  className="w-full p-2 border border-[#28375c] rounded text-xs bg-black text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full p-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold text-xs"
              >
                Enregistrer les Objectifs
              </button>
            </form>
          )}

          <div className="p-3 bg-indigo-50/80 rounded-xl space-y-1 border border-indigo-100">
            <span className="font-bold text-indigo-900 text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Note de Régulation IRPP
            </span>
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              En Tunisie, les retenues de 1.5% ou de 15% (prestations) impactent l'impôt mensuel. La non-fourniture des fiches bloque l'apurement fiscal de Elyssa.
            </p>
          </div>
        </div>

        {/* Right Columns: Target vs Actual Progress Indicators */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-slate-700">
              <Target className="w-4 h-4 text-emerald-600" />
              État de Performance par Rapport aux Objectifs
            </h3>
            <span className="text-[11px] text-slate-400 font-mono font-bold">Année en cours</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goal 1: Turnover */}
            <div className="p-3.5 rounded-xl border border-[#1f2a45] bg-[#090d16] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Volume de Facturation</span>
                <span className="text-indigo-300 font-extrabold text-[10px] uppercase bg-indigo-950/40 px-1.5 py-0.5 rounded border border-[#1f2a45]">
                  CA HT / Cible
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-black text-indigo-400 font-mono">{formatTND(totalHT)}</span>
                <span className="text-[11px] text-slate-300 font-semibold">sur {formatTND(goals.targetCA)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (totalHT / goals.targetCA) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>Progression : <strong className="text-white">{Math.round((totalHT / goals.targetCA) * 100)}%</strong></span>
                <span>Restant : {formatTND(Math.max(0, goals.targetCA - totalHT))}</span>
              </div>
            </div>

            {/* Goal 2: Cash Recouvrement */}
            <div className="p-3.5 rounded-xl border border-[#1f2a45] bg-[#090d16] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Taux de Recouvrement Cash</span>
                <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${collectionRate >= goals.targetCollectionRate ? 'bg-emerald-950/45 text-emerald-300 border border-emerald-900/30' : 'bg-amber-950/45 text-amber-300 border border-amber-900/30'}`}>
                  {collectionRate >= goals.targetCollectionRate ? 'Atteint' : 'Sous Recours'}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-lg font-black text-emerald-400">{collectionRate.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-300 font-semibold font-sans">Objectif {goals.targetCollectionRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (collectionRate / goals.targetCollectionRate) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>Rendement Relatif : <strong className="text-white">{Math.round((collectionRate / goals.targetCollectionRate) * 100)}%</strong></span>
                <span>Trésorerie Actuelle : {formatTND(totalCollected)}</span>
              </div>
            </div>

            {/* Goal 3: Withholding Certificates Retrieval */}
            <div className="p-3.5 rounded-xl border border-[#1f2a45] bg-[#090d16] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Sécurisation Légale (RS)</span>
                <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${rsRecoveryRate >= goals.targetWithholdingRate ? 'bg-blue-950/45 text-blue-300 border border-blue-900/30' : 'bg-red-950/45 text-red-300 border border-red-900/30'}`}>
                  {rsRecoveryRate >= goals.targetWithholdingRate ? 'Habilité' : 'Risqué'}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-lg font-black text-blue-400">{rsRecoveryRate.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-300 font-semibold font-sans">Objectif {goals.targetWithholdingRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (rsRecoveryRate / goals.targetWithholdingRate) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>Certificats acquis : {rsCertificatesReceivedCount} / {rsCertificatesTotalCount}</span>
                <span>À récupérer : {rsCertificatesTotalCount - rsCertificatesReceivedCount} fiches</span>
              </div>
            </div>

            {/* Goal 4: Active Core Customers onboarding */}
            <div className="p-3.5 rounded-xl border border-[#1f2a45] bg-[#090d16] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Portefeuille Clients Actifs</span>
                <span className="text-slate-300 font-extrabold text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                  Relatif
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-black text-indigo-300 font-mono">{activeClientsCount}</span>
                <span className="text-[11px] text-slate-300 font-semibold">Cible {goals.targetNewClients} clients</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (activeClientsCount / goals.targetNewClients) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>Progression : <strong className="text-white">{Math.round((activeClientsCount / goals.targetNewClients) * 100)}%</strong></span>
                <span>Inactifs à relancer : {clients.filter(c => c.status === 'Inactive').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SALES REVENUE ANALYTICS & FORECASTS ("Chiffre d'Affaire & Prévision") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Projection Schedule & Forecast Graphs */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-slate-700">
              <TrendingUp className="w-4 h-4 text-indigo-700" />
              Chiffre d'Affaires Prévisionnel (Second Semestre 2026)
            </h3>
            <span className="text-xs font-bold font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
              Route Financière : {formatTND(totalForecastedInvoicing)}
            </span>
          </div>

          {/* Pure CSS Visual Bar Chart */}
          <div className="space-y-4 pt-2">
            <div className="flex h-32 items-end gap-3 justify-around px-2 border-b border-slate-100 pb-2">
              {monthlyForecasts.map((f, i) => {
                const maxVal = Math.max(...monthlyForecasts.map(m => m.projectedInvoicing), 10000);
                const heightPercent = Math.min(100, Math.max(15, (f.projectedInvoicing / maxVal) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white p-1.5 rounded text-[9px] font-bold font-mono text-center transition duration-200 z-10 w-24 pointer-events-none">
                      <div>Facturé: {formatTND(f.projectedInvoicing)}</div>
                      <div className="text-emerald-400">Cash: {formatTND(f.expectedCollection)}</div>
                    </div>
                    
                    {/* Double stacked bar */}
                    <div className="w-full flex gap-1 h-24 items-end">
                      <div 
                        className="bg-indigo-600 w-1/2 rounded-t-sm transition-all duration-500 hover:bg-indigo-550"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <div 
                        className="bg-emerald-600 w-1/2 rounded-t-sm transition-all duration-500 hover:bg-emerald-555"
                        style={{ height: `${heightPercent * (goals.targetCollectionRate / 100)}%` }}
                      ></div>
                    </div>
                    
                    <span className="text-[10px] text-slate-300 font-extrabold mt-1.5 uppercase tracking-tight">{f.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500 font-semibold p-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded"></span>
                Invoicing Prévisionnel (HT)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-600 rounded"></span>
                Encaissement Attendu (Sous cible de {goals.targetCollectionRate}%)
              </span>
            </div>

            {/* Structured Table for exact numbers */}
            <div className="overflow-x-auto text-xs border border-[#1f2a45] rounded-lg bg-[#090d16]">
              <table className="w-full text-left">
                <thead className="bg-[#0f172a] text-[10px] font-bold uppercase text-slate-200 border-b border-[#1f2a45]">
                  <tr>
                    <th className="p-2.5 pl-3">Mois Projeté</th>
                    <th className="p-2.5">Facturation (TND)</th>
                    <th className="p-2.5">Recouvrement Prévu</th>
                    <th className="p-2.5 pr-3 text-right">Potentiel Hors Cible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2a45] font-mono text-[11px]">
                  {monthlyForecasts.map((f, i) => (
                    <tr key={i} className="hover:bg-[#121b30] transition duration-150">
                      <td className="p-2.5 pl-3 font-sans font-bold text-slate-200">{f.month} 2026</td>
                      <td className="p-2.5 font-bold text-indigo-300">{formatTND(f.projectedInvoicing)}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{formatTND(f.expectedCollection)}</td>
                      <td className="p-2.5 pr-3 text-right text-slate-300">{formatTND(f.potentialAtRisk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sector Potential Distribution Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-slate-700">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Potentiel par Secteur d'Activité
              </h3>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              {sectorData.length === 0 ? (
                <p className="text-slate-400 py-6 text-center italic">Aucune donnée sectorielle disponible.</p>
              ) : (
                sectorData.map((sect, i) => {
                  const percentOfMax = (sect.potential / maxPotential) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between font-bold text-[11px] text-slate-700">
                        <span>{sect.name}</span>
                        <span className="font-mono">{formatTND(sect.potential)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-650 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentOfMax}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl mt-4 border border-emerald-100 text-[10px] leading-relaxed">
            <span className="font-bold block text-[11px] text-emerald-950 mb-1">
              🚀 Opportunités Import / Export
            </span>
            Le segment textile à l'export détient le potentiel d'encaissement immédiat le plus fluide car exonéré de retenues à la source tunisiennes à la facturation client directe.
          </div>
        </div>
      </div>

      {/* 4. DRIVING FEUILLE DE ROUTE / MILESTONES ("Tracer la Route") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Jalon (Milestones) List & Timeline */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-orange-600">
              <Compass className="w-4 h-4" />
              Notre Route Tracée (Jalons & Milestones)
            </h3>
            <button
              onClick={() => setIsAddingMilestone(!isAddingMilestone)}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Jalon
            </button>
          </div>

          {/* Form to Add Milestone */}
          {isAddingMilestone && (
            <form onSubmit={handleAddMilestone} className="p-4 bg-slate-55 rounded-lg border border-slate-200 text-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Titre du Jalon *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Recouvrer Poulina, Nouveau client..."
                    value={newMTitle}
                    onChange={(e) => setNewMTitle(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Date d'Échéance *</label>
                  <input
                    type="date"
                    required
                    value={newMDate}
                    onChange={(e) => setNewMDate(e.target.value)}
                    className="w-full text-xs p-2 border rounded"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Description du Jalon</label>
                <input
                  type="text"
                  placeholder="Objectif d'affaires, équipe mobilisée..."
                  value={newMDesc}
                  onChange={(e) => setNewMDesc(e.target.value)}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="p-1 px-3 border rounded text-slate-505 hover:bg-slate-50 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
                >
                  Ajouter Jalon
                </button>
              </div>
            </form>
          )}

          {/* Timeline Milestones View */}
          <div className="relative border-l border-slate-200 ml-3.5 pl-5 space-y-5 text-xs pt-1.5">
            {milestones.length === 0 ? (
              <p className="text-slate-400 italic pl-2">Aucun jalon défini. Cliquez sur "+ Jalon" pour tracer la route.</p>
            ) : (
              milestones
                .sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
                .map((m) => {
                  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  let icon = <Clock className="w-3 h-3 text-slate-500" />;

                  if (m.status === 'Completed') {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
                  } else if (m.status === 'In_Progress') {
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                    icon = <RefreshCw className="w-3.5 h-3.5 text-blue-700 animate-spin-slow" />;
                  } else if (m.status === 'Delayed') {
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                    icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />;
                  }

                  return (
                    <div key={m.id} className="relative group">
                      {/* Left Dot Icon Indicator */}
                      <span className="absolute -left-[28px] top-0 bg-[#121a2e] border border-[#1f2a45] rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                        {icon}
                      </span>

                      <div className="p-3.5 rounded-xl border border-[#1f2a45]/60 hover:border-indigo-500/30 transition bg-[#090d16] hover:bg-[#0e1628] flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap pb-0.5">
                            <span className="font-extrabold text-white text-xs tracking-tight">{m.title}</span>
                            <span 
                              onClick={() => toggleMilestoneStatus(m.id)}
                              className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none hover:opacity-85 ${badgeColor}`}
                            >
                              {m.status === 'Completed' ? 'Honoré' : m.status === 'In_Progress' ? 'En Cours' : m.status === 'Delayed' ? 'Retardé' : 'En Attente'}
                            </span>
                          </div>
                          {m.description && <p className="text-[11px] text-slate-300 leading-relaxed">{m.description}</p>}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-[10px] text-indigo-200 font-mono flex items-center gap-1 bg-[#121a2e] p-1 px-2.5 rounded-full border border-[#1f2a45]">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            {m.targetDate}
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-450 hover:bg-slate-900/65 rounded transition"
                            title="Supprimer ce jalon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Debts recovery actions & Aging index ("Recouvrements en souffrance") */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-slate-700">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Situation de Recouvrement (Alerte Délais)
            </h3>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-red-950/20 text-red-300 border border-red-900/40 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-rose-200">
                <span>Trésorerie bloquée du CRM</span>
                <span>Encours Client</span>
              </div>
              <div className="text-xl font-black font-mono text-red-400">{formatTND(totalOutstanding)}</div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Représente le montant des factures tunisiennes restées impayées à ce jour. Nécessite une attention immédiate de recouvrement forcée.
              </p>
            </div>

            {/* List top debtors */}
            <div className="space-y-2">
              <span className="block font-bold text-[11px] text-slate-300 pb-1">Portefeuille de Relance Trésorerie :</span>
              {invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Debt_Collection').length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Zéro impayé en souffrance !</p>
              ) : (
                invoices
                  .filter(inv => inv.status === 'Unpaid' || inv.status === 'Debt_Collection')
                  .slice(0, 3)
                  .map(inv => (
                    <div key={inv.id} className="p-2.5 rounded-lg border border-[#1f2a45]/65 bg-[#090d16] flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="text-slate-100 block text-xs truncate max-w-[150px]">{inv.clientName}</strong>
                        <span className="text-[9px] text-slate-300 font-mono font-bold uppercase">{inv.invoiceNumber} | Échéance: {inv.dueDate}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-rose-400 font-mono block">{formatTND(inv.amountNetToPay)}</strong>
                        <span className="text-[9px] bg-amber-950/40 text-amber-300 border border-amber-900/45 rounded px-1.5 py-0.5 uppercase font-bold">Relancer</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MEASURES & DECISION ROOM ("Prendre les mesures") */}
      <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-indigo-700">
            <Sliders className="w-4 h-4" />
            Prendre les Mesures de Redressement Commercial & Fiscal
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Simulation d'Actions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Problem Simulator Inputs */}
          <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
            <span className="block font-extrabold text-[11px] text-slate-700">Simulateur de dysfonctionnements :</span>
            
            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold text-[10px] uppercase">Sélectionner un incident pré-défini</label>
              <div className="divide-y divide-slate-150 border rounded bg-white overflow-hidden max-h-48 overflow-y-auto">
                {PROBLEM_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p.problem, p.remedy)}
                    className="w-full text-left p-2 hover:bg-indigo-50 text-[10px] text-slate-700 font-semibold transition block"
                  >
                    {p.problem}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold text-[10px] uppercase">Ou saisir la problématique</label>
              <input
                type="text"
                placeholder="Incassabilité, Retard logistique client Sfax, etc."
                value={customProblem}
                onChange={(e) => { setSelectedProblemPreset(''); setCustomProblem(e.target.value); }}
                className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold text-[10px] uppercase">Remède Stratégique / Action corrective</label>
              <textarea
                rows={2}
                placeholder="Expliciter les mesures correctives de la cellule de crédit ou du contentieux fiscal..."
                value={customRemedy}
                onChange={(e) => setCustomRemedy(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5 flex items-center justify-between">
              <label className="text-slate-500 font-bold text-[10px] uppercase">Priorité</label>
              <select
                value={customPriority}
                onChange={(e: any) => setCustomPriority(e.target.value)}
                className="p-1 border border-slate-200 rounded text-[11px] bg-white"
              >
                <option value="High">Haute</option>
                <option value="Medium">Moyenne</option>
                <option value="Low">Basse</option>
              </select>
            </div>

            <button
              onClick={handleAddTacticalMeasure}
              className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[11px] transition"
            >
              Enregistrer la Mesure Stratégique
            </button>
          </div>

          {/* List of Applied Actions & Decisions Checklist */}
          <div className="md:col-span-2 space-y-3">
            <span className="block font-bold text-slate-650 text-xs border-b pb-1">
              Registre des Ordonnancements Commercials & Décisions :
            </span>

            {tacticalMeasures.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                Aucune mesure de redressement n'a encore été ordonnancée. Utilisez le panneau latéral gauche pour simuler ou consigner des décisions.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {tacticalMeasures.map((t) => (
                  <div 
                    key={t.id} 
                    className={`p-3 rounded-xl border transition-all duration-200 text-xs flex items-start gap-3 ${
                      t.done 
                        ? 'border-emerald-500/20 bg-emerald-950/10 text-slate-300' 
                        : 'border-[#1f2a45] bg-[#090d16] hover:border-indigo-500/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleMeasureDone(t.id)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />

                    <div className="flex-1 space-y-1 border-none bg-transparent">
                      <div className="flex items-center gap-2 flex-wrap font-sans">
                        <strong className={`font-extrabold ${t.done ? 'line-through text-slate-500' : 'text-white'}`}>
                          {t.scenario}
                        </strong>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                          t.priority === 'High' 
                            ? 'bg-[#4c0519] text-rose-300 border-[#9f1239]' 
                            : t.priority === 'Medium' 
                            ? 'bg-amber-950/40 text-amber-300 border-amber-900/40' 
                            : 'bg-slate-900 text-slate-300 border-slate-850'
                        }`}>
                          {t.priority === 'High' ? 'CRITIQUE' : t.priority === 'Medium' ? 'MOYEN' : 'CONSEIL'}
                        </span>
                      </div>
                      <p className={`text-[11px] text-slate-300 leading-relaxed ${t.done ? 'line-through text-slate-550' : ''}`}>
                        <strong className="text-slate-400">Mesure corrective :</strong> {t.remedy}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteMeasure(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-450 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/55 text-[10px] text-indigo-700">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span><strong>Contrôle Commercial Elyssa :</strong> Cochez une ligne pour marquer la décision stratégique comme complètement exécutée par vos chargés de comptes ou le service financier.</span>
            </div>
          </div>
        </div>
      </div>
      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab="steering"
        documentName="Plan de Route Stratégique & Objectifs"
        printTarget={printTarget}
      />
    </div>
  );
}
