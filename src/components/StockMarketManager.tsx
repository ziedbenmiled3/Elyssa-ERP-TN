import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw, AlertCircle, ShoppingCart, Activity, Shield, Settings, Wallet, LineChart as ChartIcon, CheckCircle2, Building2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BankAccount } from '../types';
import { DEMO_UNIVERSE } from '../data/demoUniverse';

// Data types
type Stock = {
  symbol: string;
  name: string;
  price: number;
  variation: number;
  volume: number;
  dividend: number;
  per: number;
};

const MARKET_DATA: Stock[] = [
  { symbol: 'SFBT', name: 'Soc. de Fabrication des Boissons', price: 12.450, variation: 1.25, volume: 15420, dividend: 0.740, per: 11.2 },
  { symbol: 'BIAT', name: 'Banque Int. Arabe de Tunisie', price: 98.200, variation: -0.45, volume: 3200, dividend: 6.000, per: 8.5 },
  { symbol: 'PGH', name: 'Poulina Group Holding', price: 9.150, variation: 2.10, volume: 45000, dividend: 0.350, per: 14.1 },
  { symbol: 'SAH', name: 'SAH (Lilas)', price: 8.400, variation: 0.00, volume: 12500, dividend: 0.280, per: 18.4 },
  { symbol: 'ECYCL', name: 'Euro-Cycles', price: 11.900, variation: -1.15, volume: 8400, dividend: 0.400, per: 12.8 },
  { symbol: 'CC', name: 'Carthage Cement', price: 1.850, variation: 0.54, volume: 120000, dividend: 0.000, per: 22.0 },
  { symbol: 'BTA', name: 'Bons du Trésor Assimilables', price: 100.000, variation: 0.00, volume: 500, dividend: 7.500, per: 0 },
];

const MOCK_GRAPH_DATA = [
  { time: '09:00', price: 12.20 },
  { time: '10:00', price: 12.35 },
  { time: '11:00', price: 12.30 },
  { time: '12:00', price: 12.45 },
  { time: '13:00', price: 12.42 },
  { time: '14:00', price: 12.45 },
];

export interface StockMarketManagerProps {
  bankAccounts?: BankAccount[];
  onUpdateBankAccounts?: (accounts: BankAccount[]) => void;
  currentTenantId?: string;
  isDemo?: boolean;
}

export default function StockMarketManager({
  bankAccounts,
  onUpdateBankAccounts,
  currentTenantId,
  isDemo = false
}: StockMarketManagerProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'tax' | 'config'>('market');
  const [selectedStock, setSelectedStock] = useState<Stock>(MARKET_DATA[0]);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderQty, setOrderQty] = useState<number>(100);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  // Resolved list of bank accounts
  const accounts: BankAccount[] = useMemo(() => {
    if (Array.isArray(bankAccounts) && bankAccounts.length > 0) return bankAccounts;
    const saved = localStorage.getItem('carthage_bank_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEMO_UNIVERSE.bankAccounts || [];
  }, [bankAccounts]);

  // Global Cumulative Treasury (Sum of all active accounts)
  const globalCumulativeTreasury = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0);
  }, [accounts]);

  // Specific Titres Account if available
  const titresAccount = useMemo(() => {
    return accounts.find(a => 
      a.type === 'TITRES' || 
      a.accountTypeCategory === 'TITRES' || 
      a.isBvmtDedicated ||
      (a.bankName || '').toLowerCase().includes('titre') ||
      (a.bankName || '').toLowerCase().includes('bourse')
    );
  }, [accounts]);

  // Available settlement accounts (all banking & titres accounts, excluding pure cash boxes)
  const settlementAccounts = useMemo(() => {
    const list = accounts.filter(a => {
      const isCash = a.type === 'CAISSE' || a.type === 'CashBox' || a.accountTypeCategory === 'CAISSE' || (a.bankName || '').toLowerCase().includes('caisse');
      return !isCash;
    });
    return list.length > 0 ? list : accounts;
  }, [accounts]);

  // Selected settlement account state
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(() => {
    return titresAccount?.id || accounts[0]?.id || '';
  });

  // Ensure selection is valid if accounts list updates
  useEffect(() => {
    if (!selectedBankAccountId && accounts.length > 0) {
      setSelectedBankAccountId(titresAccount?.id || accounts[0].id);
    }
  }, [accounts, titresAccount, selectedBankAccountId]);

  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedBankAccountId) || titresAccount || accounts[0];
  }, [accounts, selectedBankAccountId, titresAccount]);

  const formatTND = (val: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'decimal',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(val) + ' TND';
  };

  const estimatedTotal = orderQty * selectedStock.price;

  // Order Execution Simulation & Sync
  const handleTransmitOrder = () => {
    if (!selectedAccount) return;
    if (orderQty <= 0) return;

    if (orderType === 'buy' && (selectedAccount.currentBalance || 0) < estimatedTotal) {
      setOrderFeedback(`⚠️ Solde insuffisant sur ${selectedAccount.bankName} (${formatTND(selectedAccount.currentBalance)} dispo pour ${formatTND(estimatedTotal)} requis).`);
      setTimeout(() => setOrderFeedback(null), 5000);
      return;
    }

    if (onUpdateBankAccounts) {
      const updated = accounts.map(a => {
        if (a.id === selectedAccount.id) {
          const newBal = orderType === 'buy' 
            ? a.currentBalance - estimatedTotal 
            : a.currentBalance + estimatedTotal;
          return { ...a, currentBalance: Math.max(0, newBal) };
        }
        return a;
      });
      onUpdateBankAccounts(updated);
    }

    setOrderFeedback(`✅ Ordre ${orderType === 'buy' ? "d'achat" : "de vente"} de ${orderQty} ${selectedStock.symbol} transmis à la BVMT avec succès ! Règlement sur ${selectedAccount.bankName}.`);
    setTimeout(() => setOrderFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-200">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Bourse & Investissements (BVMT)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plateforme de trading BVMT, gestion de portefeuille d'actifs et multi-comptes de trésorerie
          </p>
        </div>
        
        <div className="flex overflow-x-auto bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'market' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <ChartIcon className="w-4 h-4" /> 📊 Marché BVMT
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'portfolio' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Briefcase className="w-4 h-4" /> 💼 Mon Portefeuille
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'tax' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4" /> 🏛️ Connexion Fiscale
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'config' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" /> ⚙️ Config API Bourse
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valorisation Actions</span>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">60 459,000 <span className="text-sm font-bold text-slate-400">TND</span></p>
          <span className="text-xs text-slate-400 mt-2 block font-medium">
            Coût investi : 58 800,000 TND
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compte Titres Dédié BVMT</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
            {formatTND(titresAccount?.currentBalance ?? 12500)}
          </p>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 mt-2 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2 py-1 rounded-lg">
            <Building2 className="w-3.5 h-3.5" /> {titresAccount ? titresAccount.bankName : 'BIAT Bourse - Compte Titres'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gains Latents</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">+1 659,000 <span className="text-sm font-bold opacity-80">TND</span></p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-2 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3.5 h-3.5" /> +2.82% Rendement
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trésorerie Globale Cumulée</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {formatTND(globalCumulativeTreasury)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 mt-2 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-1 rounded-lg">
            <Wallet className="w-3.5 h-3.5" /> {accounts.length} Comptes Trésorerie Actifs
          </span>
        </div>
      </div>

      {orderFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          orderFeedback.startsWith('⚠️') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{orderFeedback}</span>
          <button onClick={() => setOrderFeedback(null)} className="text-slate-400 hover:text-slate-600 font-black ml-4">✕</button>
        </div>
      )}

      {/* Main Grid View */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column - Market Data */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-500" />
                Cours Officiels BVMT
              </h3>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Marché Ouvert
              </span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 pl-6">Valeur / Titre</th>
                    <th className="py-3.5 px-4 text-right">Dernier (TND)</th>
                    <th className="py-3.5 px-4 text-right">Var. %</th>
                    <th className="py-3.5 px-4 text-right">Volume</th>
                    <th className="py-3.5 px-4 text-right">Div. Brut</th>
                    <th className="py-3.5 px-4 pr-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MARKET_DATA.map((stock) => (
                    <tr 
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer transition-colors ${
                        selectedStock.symbol === stock.symbol 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 px-4 pl-6">
                        <div className="font-black text-slate-800 dark:text-white text-sm">{stock.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{stock.name}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-700 dark:text-slate-200 text-sm">
                        {stock.price.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-md ${
                          stock.variation > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                          stock.variation < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {stock.variation > 0 ? '+' : ''}{stock.variation.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-medium text-slate-500">
                        {stock.volume.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-medium text-slate-500">
                        {stock.dividend > 0 ? stock.dividend.toFixed(3) : '-'}
                      </td>
                      <td className="py-3 px-4 pr-6 text-center">
                        <button 
                          className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition shadow-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedStock(stock); setOrderType('buy'); }}
                        >
                          Télex
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 mt-auto border-t border-slate-200 dark:border-slate-800 flex items-start gap-3 rounded-b-3xl">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Les ordres exécutés sont soumis aux frais de courtage et à la commission CMF. 
                <strong className="text-slate-700 dark:text-slate-300"> Information de compensation :</strong> Règlement/Livraison à J+2 selon les directives réglementaires de la BVMT et Tunisie Clearing.
              </p>
            </div>
          </div>

          {/* Right Column - Chart & Order Book */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Chart Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-2">
                    {selectedStock.symbol} <span className="text-sm font-bold text-slate-400 opacity-60">| {selectedStock.name}</span>
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedStock.price.toFixed(3)} <span className="text-base text-slate-500">TND</span></span>
                    <span className={`text-sm font-bold flex items-center px-2 py-0.5 rounded-md ${
                      selectedStock.variation >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                    }`}>
                      {selectedStock.variation > 0 ? '+' : ''}{selectedStock.variation}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-500 border border-slate-100 dark:border-slate-800">PER: <strong className="text-slate-800 dark:text-slate-200">{selectedStock.per}x</strong></span>
                <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-500 border border-slate-100 dark:border-slate-800">Rendement Dividende: <strong className="text-slate-800 dark:text-slate-200">{(selectedStock.dividend / selectedStock.price * 100).toFixed(1)}%</strong></span>
              </div>

              <div className="h-[180px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_GRAPH_DATA}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedStock.variation >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={selectedStock.variation >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#1e293b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={selectedStock.variation >= 0 ? '#10b981' : '#f43f5e'} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Form Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex-1 flex flex-col relative overflow-hidden">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <ShoppingCart className="w-5 h-5 text-indigo-500" />
                Passage d'Ordre BVMT
              </h3>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${orderType === 'buy' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Achat
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${orderType === 'sell' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Vente
                </button>
              </div>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Compte de règlement</label>
                  <select 
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  >
                    {settlementAccounts.map(acc => {
                      const isTitres = acc.type === 'TITRES' || acc.accountTypeCategory === 'TITRES' || acc.isBvmtDedicated;
                      return (
                        <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {isTitres ? '🎯 [Dédié BVMT] ' : ''}{acc.bankName} (RIB: {acc.accountNumber}) — Solde: {formatTND(acc.currentBalance)}
                        </option>
                      );
                    })}
                  </select>

                  {/* Active Selected Account Details Badge */}
                  {selectedAccount && (
                    <div className="mt-2.5 p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-semibold truncate">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{selectedAccount.bankName}</span>
                        {selectedAccount.sceAccount && (
                          <span className="text-[9px] bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200 px-1 rounded font-mono font-bold">
                            SCE {selectedAccount.sceAccount}
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-black text-indigo-700 dark:text-indigo-400 shrink-0">
                        {formatTND(selectedAccount.currentBalance)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Quantité</label>
                    <input 
                      type="number" 
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(Number(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Prix Limite (TND)</label>
                    <input 
                      type="text" 
                      disabled
                      value={selectedStock.price.toFixed(3)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5 mb-5 bg-slate-50/50 dark:bg-slate-900/50 -mx-6 px-6 pb-2">
                  <span className="text-sm font-bold text-slate-500">Montant Estimé</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{formatTND(estimatedTotal)}</span>
                </div>
                <button 
                  onClick={handleTransmitOrder}
                  className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    orderType === 'buy' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/20'
                  }`}
                >
                  Transmettre l'ordre {orderType === 'buy' ? "d'achat" : 'de vente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholders for other tabs */}
      {activeTab !== 'market' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
          <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            {activeTab === 'portfolio' && 'Mon Portefeuille Boursier'}
            {activeTab === 'tax' && 'Déclarations & Connexion Fiscale'}
            {activeTab === 'config' && 'Configuration API & Courtier'}
          </h3>
          <p className="text-slate-500 font-medium">Ce module est synchronisé avec les comptes de trésorerie de l'entreprise et l'infrastructure BVMT.</p>
        </div>
      )}
    </div>
  );
}
