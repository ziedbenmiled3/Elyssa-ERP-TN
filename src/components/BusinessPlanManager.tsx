import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Calculator, 
  FileText, 
  Sliders, 
  HelpCircle, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatTND } from '../utils/calculations';
import IframePrintHelper from './IframePrintHelper';

interface BusinessPlanManagerProps {
  companyName?: string;
}

export default function BusinessPlanManager({ companyName = "Elyssa Corp" }: BusinessPlanManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'projections' | 'compte_resultat' | 'financement' | 'rentabilite' | 'dossier'>('projections');
  
  // 1. Projections state
  const [scenario, setScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [baseRevenue, setBaseRevenue] = useState(350000); // Year 1 CA base
  const [growthRate, setGrowthRate] = useState(25); // annual growth rate %
  const [costOfGoodsPercent, setCostOfGoodsPercent] = useState(35); // variable costs ratio %
  
  // 2. Compte de résultat fine tuning (yearly overheads)
  const [personnelExpenses, setPersonnelExpenses] = useState(120000);
  const [marketingExpenses, setMarketingExpenses] = useState(25000);
  const [rentAndUtilities, setRentAndUtilities] = useState(18000);
  const [administrativeExpenses, setAdministrativeExpenses] = useState(10000);
  const [taxRate, setTaxRate] = useState(15); // Corporate tax rate Tunisia (e.g., 15%)

  // 3. Plan de Financement State
  const [needs, setNeeds] = useState([
    { id: '1', label: 'Immobilisations Incorporelles (R&D, Logiciels)', amount: 45000 },
    { id: '2', label: 'Immobilisations Corporelles (Matériel & Machines)', amount: 80000 },
    { id: '3', label: 'Besoin en Fonds de Roulement (BFR initial)', amount: 35000 },
    { id: '4', label: 'Frais d\'Établissement & Domiciliation', amount: 8000 },
  ]);
  const [resources, setResources] = useState([
    { id: '1', label: 'Apports en Capital (Fonds propres)', amount: 65000 },
    { id: '2', label: 'Emprunts Bancaires à Moyen Terme', amount: 60000 },
    { id: '3', label: 'Subventions d\'Investissement (APIA/FOPRODI)', amount: 25000 },
    { id: '4', label: 'Comptes Courants d\'Associés', amount: 18000 },
  ]);

  const [newNeedLabel, setNewNeedLabel] = useState('');
  const [newNeedAmount, setNewNeedAmount] = useState('');
  const [newResourceLabel, setNewResourceLabel] = useState('');
  const [newResourceAmount, setNewResourceAmount] = useState('');

  // 4. Print & Export helper states
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Dynamic calculations for Projections & P&L
  const getMultiplier = (scen: typeof scenario) => {
    if (scen === 'optimistic') return 1.25;
    if (scen === 'pessimistic') return 0.8;
    return 1.0;
  };

  const calculateYearsData = () => {
    const mult = getMultiplier(scenario);
    const result = [];
    let currentRevenue = baseRevenue * mult;

    // Fixed overheads increase by a small margin each year (inflation/expansion)
    for (let yr = 1; yr <= 5; yr++) {
      const rev = Math.round(currentRevenue);
      const varCosts = Math.round(rev * (costOfGoodsPercent / 100));
      const grossMargin = rev - varCosts;

      const personnel = Math.round(personnelExpenses * Math.pow(1.08, yr - 1));
      const marketing = Math.round(marketingExpenses * Math.pow(1.05, yr - 1));
      const rent = Math.round(rentAndUtilities * Math.pow(1.03, yr - 1));
      const admin = Math.round(administrativeExpenses * Math.pow(1.04, yr - 1));
      
      const totalOverheads = personnel + marketing + rent + admin;
      const ebitda = grossMargin - totalOverheads;
      
      // Simulate depreciation (dotation aux amortissements)
      const depreciation = Math.round(15000 * Math.pow(0.95, yr - 1));
      const ebit = ebitda - depreciation;
      
      const taxes = ebit > 0 ? Math.round(ebit * (taxRate / 100)) : 0;
      const netProfit = ebit - taxes;

      result.push({
        year: `Année ${yr}`,
        revenue: rev,
        grossMargin,
        varCosts,
        personnel,
        overheads: totalOverheads,
        ebitda,
        depreciation,
        ebit,
        taxes,
        netProfit,
        profitMargin: rev > 0 ? parseFloat(((netProfit / rev) * 100).toFixed(1)) : 0
      });

      currentRevenue = currentRevenue * (1 + growthRate / 100);
    }
    return result;
  };

  const yearsData = calculateYearsData();

  // Financement Calculations
  const totalNeeds = needs.reduce((sum, n) => sum + n.amount, 0);
  const totalResources = resources.reduce((sum, r) => sum + r.amount, 0);
  const financingGap = totalNeeds - totalResources;

  // Rentabilité Calculations
  // We use Year 1 values for the break-even calculation
  const yr1 = yearsData[0];
  const fixedCosts = yr1.personnel + (marketingExpenses) + (rentAndUtilities) + (administrativeExpenses) + yr1.depreciation;
  const totalVariableCosts = yr1.varCosts;
  const variableCostRatio = yr1.revenue > 0 ? totalVariableCosts / yr1.revenue : 0;
  const marginOnVariableCostRatio = 1 - variableCostRatio;
  
  // Seuil de rentabilité (CA minimum pour couvrir les coûts fixes)
  const breakEvenTurnover = marginOnVariableCostRatio > 0 ? Math.round(fixedCosts / marginOnVariableCostRatio) : 0;
  
  // Point mort en jours (Année 1)
  const breakEvenDays = yr1.revenue > 0 && breakEvenTurnover <= yr1.revenue 
    ? Math.round((breakEvenTurnover / yr1.revenue) * 365) 
    : 365;

  // Format date for point mort
  const getBreakEvenDate = (days: number) => {
    if (days >= 365) return "Non atteint sur l'exercice";
    const start = new Date(2026, 0, 1);
    start.setDate(start.getDate() + days);
    return start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const addNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeedLabel || !newNeedAmount) return;
    setNeeds([...needs, {
      id: Date.now().toString(),
      label: newNeedLabel,
      amount: parseFloat(newNeedAmount)
    }]);
    setNewNeedLabel('');
    setNewNeedAmount('');
  };

  const removeNeed = (id: string) => {
    setNeeds(needs.filter(n => n.id !== id));
  };

  const addResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceLabel || !newResourceAmount) return;
    setResources([...resources, {
      id: Date.now().toString(),
      label: newResourceLabel,
      amount: parseFloat(newResourceAmount)
    }]);
    setNewResourceLabel('');
    setNewResourceAmount('');
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  // Recharts Chart Data for Break-Even Visualizer
  const generateChartData = () => {
    const data = [];
    const stepCount = 10;
    const maxRev = Math.max(yr1.revenue * 1.2, breakEvenTurnover * 1.2);
    const stepVal = maxRev / stepCount;

    for (let i = 0; i <= stepCount; i++) {
      const simulatedRevenue = Math.round(stepVal * i);
      const simulatedVarCosts = Math.round(simulatedRevenue * variableCostRatio);
      const simulatedTotalCosts = Math.round(fixedCosts + simulatedVarCosts);
      const profit = simulatedRevenue - simulatedTotalCosts;

      data.push({
        revenueInput: simulatedRevenue,
        "Chiffre d'Affaires": simulatedRevenue,
        "Coûts Totaux": simulatedTotalCosts,
        "Coûts Fixes": fixedCosts,
        "Résultat net estimé": profit
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="font-sans">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Plan Stratégique & Prévisions
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100">
            Business Plan Intégral - Elyssa ERP
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
            Simulez, validez et dressez de véritables prévisions de rentabilité à long terme. Modélisez vos hypothèses pour convaincre investisseurs et banques.
          </p>
        </div>

        <button 
          onClick={() => setIsPrintOpen(true)}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition duration-150 shrink-0 shadow-md shadow-indigo-900/30"
        >
          <Printer className="w-4 h-4" /> Imprimer le Dossier Complet
        </button>
      </div>

      {/* QUICK STATS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="font-sans">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CA Prévisionnel (An 1)</p>
            <p className="text-base font-black text-white">{formatTND(yr1.revenue)}</p>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
              +{growthRate}% de croissance cible / an
            </span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="font-sans">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seuil de Rentabilité</p>
            <p className="text-base font-black text-white">{formatTND(breakEvenTurnover)}</p>
            <span className="text-[10px] text-blue-400 font-bold mt-0.5 block">
              Rentabilité dès le {getBreakEvenDate(breakEvenDays)}
            </span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="font-sans">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Équilibre Financement</p>
            <p className="text-base font-black text-white">
              {financingGap === 0 ? "Équilibré" : formatTND(Math.abs(financingGap))}
            </p>
            <span className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${financingGap > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {financingGap > 0 ? (
                <> <AlertTriangle className="w-3 h-3" /> Besoin de {formatTND(financingGap)} </>
              ) : financingGap < 0 ? (
                <> <CheckCircle2 className="w-3 h-3" /> Excédent de {formatTND(Math.abs(financingGap))} </>
              ) : (
                "Ressources couvrent 100% des besoins"
              )}
            </span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-purple-950/80 border border-purple-500/20 text-purple-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-sans">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Résultat Net Cumulé (5 Ans)</p>
            <p className="text-base font-black text-white">
              {formatTND(yearsData.reduce((sum, y) => sum + y.netProfit, 0))}
            </p>
            <span className="text-[10px] text-purple-400 font-bold mt-0.5 block">
              Marge nette An 5 : {yearsData[4].profitMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* MODULE WORKSPACE SUBTABS */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('projections')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'projections' 
              ? 'border-amber-500 text-amber-500 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Projections & Scénarios
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('compte_resultat')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'compte_resultat' 
              ? 'border-emerald-500 text-emerald-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Compte de Résultat
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('financement')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'financement' 
              ? 'border-blue-500 text-blue-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> Plan de Financement
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('rentabilite')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'rentabilite' 
              ? 'border-purple-500 text-purple-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" /> Seuil de Rentabilité
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('dossier')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'dossier' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Dossier Final
          </div>
        </button>
      </div>

      {/* SUB-TABS VIEWS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md min-h-[400px]">
        {/* 1. PROJECTIONS & SCENARIOS */}
        {activeSubTab === 'projections' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Hypothèses Commerciales & Scénarios Cibles</h3>
                <p className="text-[11px] text-slate-400">Ajustez les curseurs pour voir l'impact immédiat sur vos courbes de Chiffre d'Affaires sur 5 ans.</p>
              </div>

              {/* Scenario Toggle */}
              <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700/80 gap-1 shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setScenario('pessimistic')}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition ${
                    scenario === 'pessimistic' ? 'bg-red-950 border border-red-550/30 text-red-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pessimiste
                </button>
                <button
                  type="button"
                  onClick={() => setScenario('realistic')}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition ${
                    scenario === 'realistic' ? 'bg-indigo-950 border border-indigo-550/30 text-indigo-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Réaliste
                </button>
                <button
                  type="button"
                  onClick={() => setScenario('optimistic')}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition ${
                    scenario === 'optimistic' ? 'bg-emerald-950 border border-emerald-550/30 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Optimiste
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sliders Container */}
              <div className="space-y-5 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase text-slate-300">Chiffre d'Affaires An 1 (Base)</label>
                    <span className="text-xs font-mono font-bold text-amber-400">{formatTND(baseRevenue)}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="1500000"
                    step="25000"
                    value={baseRevenue}
                    onChange={(e) => setBaseRevenue(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>50K TND</span>
                    <span>1.5M TND</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase text-slate-300">Taux de Croissance Annuelle</label>
                    <span className="text-xs font-mono font-bold text-amber-400">+{growthRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>5%</span>
                    <span>100% / an</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase text-slate-300">Ratio Coûts Variables (Achats/Production)</label>
                    <span className="text-xs font-mono font-bold text-amber-400">{costOfGoodsPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="70"
                    step="1"
                    value={costOfGoodsPercent}
                    onChange={(e) => setCostOfGoodsPercent(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>10% (Prestations)</span>
                    <span>70% (Négoce/Manufacture)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-750 space-y-2.5 font-sans">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Coefficient Scénario :</span>
                    <span className="font-bold text-white">x{getMultiplier(scenario)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taux Marge Brute estimé :</span>
                    <span className="font-bold text-emerald-400">{100 - costOfGoodsPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Graphic Display Area */}
              <div className="lg:col-span-2 bg-slate-850 p-5 rounded-xl border border-slate-750 flex flex-col justify-between h-[300px]">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 font-sans">
                  Évolution Prévisionnelle du Chiffre d'Affaires & Marge Brute (TND)
                </p>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="year" stroke="#718096" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#718096" style={{ fontSize: '10px' }} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a202c', borderColor: '#4a5568', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                        itemStyle={{ fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Line type="monotone" name="Chiffre d'Affaires" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" name="Marge Brute" dataKey="grossMargin" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Yearly Table Overview */}
            <div className="overflow-x-auto border border-slate-850 rounded-xl">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-850">
                  <tr className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-sans">
                    <th className="px-4 py-3">Année</th>
                    <th className="px-4 py-3 text-right">Chiffre d'Affaires (CA)</th>
                    <th className="px-4 py-3 text-right">Marge Brute ({100 - costOfGoodsPercent}%)</th>
                    <th className="px-4 py-3 text-right">Frais d'Exploitation</th>
                    <th className="px-4 py-3 text-right">Résultat Net</th>
                    <th className="px-4 py-3 text-right">Rentabilité %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono text-xs text-slate-300">
                  {yearsData.map((yr, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50">
                      <td className="px-4 py-3 font-sans font-extrabold text-white">{yr.year}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-100">{formatTND(yr.revenue)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{formatTND(yr.grossMargin)}</td>
                      <td className="px-4 py-3 text-right text-rose-300">{formatTND(yr.overheads)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${yr.netProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                        {formatTND(yr.netProfit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${yr.netProfit >= 0 ? 'bg-indigo-950 border border-indigo-900 text-indigo-400' : 'bg-red-950 text-red-400'}`}>
                          {yr.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. COMPTE DE RESULTAT PREVISIONNEL */}
        {activeSubTab === 'compte_resultat' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Compte de Résultat Prévisionnel Structuré (P&L)</h3>
                <p className="text-[11px] text-slate-400">Affinez les principales charges fixes de votre entreprise pour ajuster les marges nettes.</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs bg-slate-850 border border-slate-750 px-3 py-1.5 rounded-lg text-slate-300 shrink-0">
                <span>Impôt Sociétés (IS Tunisie) :</span>
                <input
                  type="number"
                  min="5"
                  max="35"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-slate-900 border border-slate-700 text-center rounded text-white font-bold ml-1"
                />
                <span>%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Overheads Control Sidepanel */}
              <div className="lg:col-span-1 space-y-4 bg-slate-850 p-4 rounded-xl border border-slate-750">
                <p className="text-[10px] uppercase font-black text-slate-400 pb-2 border-b border-slate-700 font-sans">Charges de Structure (An 1)</p>
                
                <div className="font-sans">
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Masse Salariale brute / an</label>
                  <input
                    type="number"
                    value={personnelExpenses}
                    onChange={(e) => setPersonnelExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="font-sans">
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Marketing, Pub & Canaux</label>
                  <input
                    type="number"
                    value={marketingExpenses}
                    onChange={(e) => setMarketingExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="font-sans">
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Loyers, Utilities & Serveurs</label>
                  <input
                    type="number"
                    value={rentAndUtilities}
                    onChange={(e) => setRentAndUtilities(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="font-sans">
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Autres Charges Admin & Assurances</label>
                  <input
                    type="number"
                    value={administrativeExpenses}
                    onChange={(e) => setAdministrativeExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="text-[10px] text-slate-500 leading-normal pt-2 font-sans">
                  💡 Les charges de structure sont configurées pour subir une majoration d'inflation de 3% à 8% par an au fil de l'expansion modélisée de l'entreprise.
                </div>
              </div>

              {/* Structured P&L Table */}
              <div className="lg:col-span-3 overflow-x-auto border border-slate-800 rounded-xl">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-mono">
                  <thead className="bg-slate-850 text-[10px] uppercase font-black text-slate-400 font-sans">
                    <tr>
                      <th className="px-4 py-3">Lignes du Compte de Résultat</th>
                      {yearsData.map((y, i) => (
                        <th key={i} className="px-4 py-3 text-right">{y.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr className="bg-slate-850/20 font-bold text-slate-100">
                      <td className="px-4 py-2.5 font-sans">Chiffre d'Affaires Cible</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2.5 text-right">{formatTND(y.revenue)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-400 pl-6">- Coûts des ventes & Var.</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right text-rose-350">{formatTND(y.varCosts)}</td>
                      ))}
                    </tr>
                    <tr className="text-emerald-400 font-bold">
                      <td className="px-4 py-2 font-sans pl-6">Marge Brute</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right">{formatTND(y.grossMargin)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 pl-6">- Charges de Personnel</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right">{formatTND(y.personnel)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 pl-6">- Autres Charges de structure</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right">{formatTND(y.overheads - y.personnel)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-800/10 font-bold text-slate-100">
                      <td className="px-4 py-2.5 font-sans">Excédent Brut d'Exploitation (EBITDA)</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className={`px-4 py-2.5 text-right ${y.ebitda >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatTND(y.ebitda)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 pl-6">- Dotations aux Amortissements</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right text-slate-500">{formatTND(y.depreciation)}</td>
                      ))}
                    </tr>
                    <tr className="font-bold">
                      <td className="px-4 py-2 font-sans">Résultat d'Exploitation (EBIT)</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right">{formatTND(y.ebit)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 pl-6">- Impôt sur les Sociétés ({taxRate}%)</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className="px-4 py-2 text-right text-rose-400">{formatTND(y.taxes)}</td>
                      ))}
                    </tr>
                    <tr className="bg-indigo-950/20 font-extrabold text-white border-t border-slate-700">
                      <td className="px-4 py-3 font-sans text-xs uppercase tracking-wider">RÉSULTAT NET COMPTABLE</td>
                      {yearsData.map((y, i) => (
                        <td key={i} className={`px-4 py-3 text-right text-sm ${y.netProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                          {formatTND(y.netProfit)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. PLAN DE FINANCEMENT */}
        {activeSubTab === 'financement' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Plan de Financement de Lancement</h3>
              <p className="text-[11px] text-slate-400">Équilibrez les besoins d'investissement initiaux (Capex, BFR) avec vos ressources financières d'apport.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
              {/* Needs Column */}
              <div className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">1. Besoins (Emplois initiaux)</h4>
                  <span className="text-xs font-mono font-black text-rose-400">{formatTND(totalNeeds)}</span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {needs.map(n => (
                    <div key={n.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">{n.label}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-white font-bold">{formatTND(n.amount)}</span>
                        <button 
                          onClick={() => removeNeed(n.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Need Form */}
                <form onSubmit={addNeed} className="flex gap-2 pt-2 border-t border-slate-700/60">
                  <input
                    type="text"
                    required
                    placeholder="Nouveau besoin..."
                    value={newNeedLabel}
                    onChange={(e) => setNewNeedLabel(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Montant (TND)"
                    value={newNeedAmount}
                    onChange={(e) => setNewNeedAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white text-right"
                  />
                  <button type="submit" className="px-3 bg-rose-950 border border-rose-800/40 text-rose-400 rounded-lg text-xs font-bold font-sans">
                    Ajouter
                  </button>
                </form>
              </div>

              {/* Resources Column */}
              <div className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">2. Ressources (Moyens de financement)</h4>
                  <span className="text-xs font-mono font-black text-emerald-400">{formatTND(totalResources)}</span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {resources.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">{r.label}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-white font-bold">{formatTND(r.amount)}</span>
                        <button 
                          onClick={() => removeResource(r.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Resource Form */}
                <form onSubmit={addResource} className="flex gap-2 pt-2 border-t border-slate-700/60">
                  <input
                    type="text"
                    required
                    placeholder="Nouvelle ressource..."
                    value={newResourceLabel}
                    onChange={(e) => setNewResourceLabel(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Montant (TND)"
                    value={newResourceAmount}
                    onChange={(e) => setNewResourceAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-white text-right"
                  />
                  <button type="submit" className="px-3 bg-emerald-950 border border-emerald-800/40 text-emerald-400 rounded-lg text-xs font-bold font-sans">
                    Ajouter
                  </button>
                </form>
              </div>
            </div>

            {/* Gap Warning Banner */}
            {financingGap !== 0 ? (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                financingGap > 0 
                  ? 'bg-rose-950/45 border-rose-500/20 text-rose-200' 
                  : 'bg-emerald-950/45 border-emerald-500/20 text-emerald-200'
              }`}>
                {financingGap > 0 ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div className="text-xs font-sans">
                      <span className="font-bold">Financement incomplet.</span> Il vous manque <strong className="font-mono">{formatTND(financingGap)}</strong> pour financer vos investissements. Envisagez d'augmenter le capital social ou de lever de la dette moyen terme.
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-xs font-sans">
                      <span className="font-bold">Financement excédentaire.</span> Vous possédez un surplus de ressources de <strong className="font-mono">{formatTND(Math.abs(financingGap))}</strong>. Cette somme constituera de la trésorerie de secours idéale pour renforcer votre BFR disponible en banque.
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-850 p-4 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3 font-sans font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Votre plan est parfaitement équilibré ! 100% de vos investissements de démarrage sont couverts par vos capitaux et financements de tiers.
              </div>
            )}
          </div>
        )}

        {/* 4. SEUIL DE RENTABILITE */}
        {activeSubTab === 'rentabilite' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Seuil de Rentabilité & Calcul du Point Mort</h3>
              <p className="text-[11px] text-slate-400">Calculez le niveau d'activité minimal requis pour ne pas perdre d'argent et déterminez le jour de l'année d'entrée en bénéfice.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calculations Cards */}
              <div className="space-y-4">
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 font-sans">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Charges Fixes Annuelles (F)</span>
                  <p className="text-lg font-black text-white font-mono mt-1">{formatTND(fixedCosts)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Salaires fixes, loyers, assurances, amortissements.</p>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 font-sans">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Taux de Charges Variables (v)</span>
                  <p className="text-lg font-black text-white font-mono mt-1">{(variableCostRatio * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">Achats consommés, fret et courtages proportionnels.</p>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 font-sans">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Marge / Coût Variable (MCV)</span>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-1">{(marginOnVariableCostRatio * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">Part de chaque dinar de vente qui couvre vos frais fixes.</p>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="lg:col-span-2 bg-slate-850 p-5 rounded-xl border border-slate-750 flex flex-col justify-between h-[320px]">
                <div className="flex justify-between items-center mb-2 font-sans">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Modélisation du Point Mort (Intersections de Rentabilité)
                  </p>
                  {yr1.revenue >= breakEvenTurnover ? (
                    <span className="text-[9px] font-black bg-emerald-950 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      Rentabilité Atteinte
                    </span>
                  ) : (
                    <span className="text-[9px] font-black bg-rose-950 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase">
                      Hors d'Atteinte (CA trop bas)
                    </span>
                  )}
                </div>

                <div className="w-full h-[230px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="revenueInput" stroke="#718096" style={{ fontSize: '9px' }} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                      <YAxis stroke="#718096" style={{ fontSize: '9px' }} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a202c', borderColor: '#4a5568', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}
                        itemStyle={{ fontSize: '10px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                      <Line type="monotone" name="Chiffre d'Affaires" dataKey="Chiffre d'Affaires" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" name="Coûts Totaux (Fixes + Var)" dataKey="Coûts Totaux" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" name="Coûts Fixes" dataKey="Coûts Fixes" stroke="#718096" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Break-even point summary card */}
            <div className="bg-indigo-950/25 border border-indigo-800/30 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="font-sans text-xs">
                <h4 className="font-black uppercase text-indigo-400 tracking-wider">Formule : Seuil de Rentabilité = Charges Fixes / Taux MCV</h4>
                <p className="text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Votre entreprise commence à générer de réels bénéfices une fois qu'elle a accumulé <strong>{formatTND(breakEvenTurnover)}</strong> de Chiffre d'Affaires HT. Compte tenu du plan commercial ciblé de <strong>{formatTND(yr1.revenue)}</strong>, ce niveau d'activité correspond à <strong>{breakEvenDays} jours</strong> de fonctionnement commercial.
                </p>
              </div>

              <div className="bg-indigo-950/80 border border-indigo-700/40 p-4 rounded-xl text-center md:min-w-[180px] shrink-0 font-sans">
                <span className="text-[10px] text-indigo-400 uppercase font-black tracking-wider block">Jour de l'échéance</span>
                <p className="text-lg font-black text-white mt-1 uppercase tracking-tight">{getBreakEvenDate(breakEvenDays)}</p>
                <span className="text-[9px] text-indigo-300 block mt-0.5 font-mono">du premier exercice 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. DOSSIER STRATEGIQUE FINAL */}
        {activeSubTab === 'dossier' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Dossier Business Plan Finalisé</h3>
                <p className="text-[11px] text-slate-400">Présentation structurée et unifiée prête pour l'exportation et le dépôt.</p>
              </div>
              <button 
                onClick={() => setIsPrintOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition text-white"
              >
                <Printer className="w-3.5 h-3.5" /> Aperçu avant Impression
              </button>
            </div>

            <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-4xl mx-auto shadow-2xl font-sans space-y-6 border border-slate-300">
              <div className="text-center py-6 border-b border-slate-200">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">BUSINESS PLAN & PRÉVISIONS STRATÉGIQUES</h1>
                <p className="text-sm font-black text-indigo-700 uppercase tracking-widest mt-1.5">{companyName}</p>
                <div className="w-16 h-1 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
                <p className="text-[11px] text-slate-400 mt-4 uppercase tracking-wider font-mono">Dossier validé par le module de pilotage Elyssa ERP • Juillet 2026</p>
              </div>

              {/* 1. Résumé Exécutif */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span> I. Résumé Exécutif & Hypothèses Générales
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ce plan d'affaires a été élaboré à partir d'une estimation de base d'un Chiffre d'Affaires annuel de {formatTND(baseRevenue)} pour le premier exercice. Grâce à un taux de croissance annuel ciblé à {growthRate}%, l'entreprise vise une trajectoire solide d'expansion. Le taux de charges variables est modélisé à {costOfGoodsPercent}%, ce qui permet de préserver une marge brute confortable de {100 - costOfGoodsPercent}%.
                </p>
              </div>

              {/* 2. Tableau Récapitulatif P&L */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span> II. Synthèse du Plan de Financement de Lancement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-slate-700 block mb-1.5">Investissements de Démarrage (Besoins)</span>
                    <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                      {needs.map(n => (
                        <li key={n.id} className="flex justify-between border-b border-slate-150 pb-0.5">
                          <span>{n.label}</span>
                          <span className="font-bold">{formatTND(n.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-slate-700 block mb-1.5">Origine des Fonds (Ressources)</span>
                    <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                      {resources.map(r => (
                        <li key={r.id} className="flex justify-between border-b border-slate-150 pb-0.5">
                          <span>{r.label}</span>
                          <span className="font-bold">{formatTND(r.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. Rentabilité */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span> III. Seuil de Rentabilité & Viabilité Commerciale
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le seuil de rentabilité HT de {companyName} s'établit à <strong>{formatTND(breakEvenTurnover)}</strong>. Ce montant représente le chiffre d'affaires critique au-dessus duquel l'entreprise couvre l'ensemble de ses charges d'exploitation et d'amortissements. 
                  Sous l'hypothèse d'activité de l'Année 1, le point mort est atteint au bout de <strong>{breakEvenDays} jours</strong>, soit le <strong>{getBreakEvenDate(breakEvenDays)}</strong>.
                </p>
              </div>

              {/* 4. Table projections */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span> IV. Projections Financières Détaillées (Compte de Résultat 5 Ans)
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-[10.5px] font-mono">
                    <thead className="bg-slate-100 font-sans font-black text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Poste de Compte</th>
                        <th className="px-3 py-2 text-right">Année 1</th>
                        <th className="px-3 py-2 text-right">Année 2</th>
                        <th className="px-3 py-2 text-right">Année 3</th>
                        <th className="px-3 py-2 text-right">Année 4</th>
                        <th className="px-3 py-2 text-right">Année 5</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-700">
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-bold">Chiffre d'Affaires Target</td>
                        {yearsData.map((y, i) => <td key={i} className="px-3 py-1.5 text-right font-bold">{formatTND(y.revenue)}</td>)}
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5">- Coûts Variables</td>
                        {yearsData.map((y, i) => <td key={i} className="px-3 py-1.5 text-right">{formatTND(y.varCosts)}</td>)}
                      </tr>
                      <tr className="bg-emerald-50 text-emerald-800 font-bold">
                        <td className="px-3 py-1.5 font-sans">Marge Brute</td>
                        {yearsData.map((y, i) => <td key={i} className="px-3 py-1.5 text-right">{formatTND(y.grossMargin)}</td>)}
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5">- Charges d'Exploitation</td>
                        {yearsData.map((y, i) => <td key={i} className="px-3 py-1.5 text-right">{formatTND(y.overheads)}</td>)}
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5">- Amortissements (Dot.)</td>
                        {yearsData.map((y, i) => <td key={i} className="px-3 py-1.5 text-right text-slate-500">{formatTND(y.depreciation)}</td>)}
                      </tr>
                      <tr className="bg-indigo-50 text-indigo-900 font-bold">
                        <td className="px-3 py-1.5 font-sans">RÉSULTAT NET COMPTABLE</td>
                        {yearsData.map((y, i) => (
                          <td key={i} className="px-3 py-1.5 text-right text-indigo-700">
                            {formatTND(y.netProfit)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT HELPER IFRAME MODAL */}
      <IframePrintHelper
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        activeTab="business_plan"
        documentName="Dossier de Business Plan Stratégique"
      />
    </div>
  );
}
