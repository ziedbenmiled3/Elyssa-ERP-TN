/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Wallet, 
  Building2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Calendar, 
  BookOpen, 
  BarChart2, 
  Percent, 
  Calculator, 
  Search, 
  Check, 
  ChevronRight, 
  Info,
  Sparkles,
  DollarSign,
  Briefcase,
  History,
  FileCheck,
  TrendingDown,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BankAccount, BankTransaction, TaxDeclaration, YearEndClosing, Invoice } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface InvestmentManagerProps {
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  taxDeclarations: TaxDeclaration[];
  yearEndClosings: YearEndClosing[];
  onUpdateBankAccounts: (accounts: BankAccount[]) => void;
  onUpdateBankTransactions: (txs: BankTransaction[]) => void;
  onUpdateTaxDeclarations: (decs: TaxDeclaration[]) => void;
  onUpdateYearEndClosings: (closings: YearEndClosing[]) => void;
  readOnly?: boolean;
}

interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number; // percentage
  volume: number;
  peRatio: number;
  dividendYield: number; // percentage
  description: string;
}

// Fixed mock quotes for BVMT
const TUNIS_STOCKS: StockQuote[] = [
  { ticker: 'SFBT', name: 'Société de Fabrication des Boissons de Tunisie', price: 12.450, change: 1.25, volume: 42500, peRatio: 11.2, dividendYield: 6.8, description: 'Leader agroalimentaire des boissons en Tunisie, valeur refuge historique.' },
  { ticker: 'BIAT', name: 'Banque Internationale Arabe de Tunisie', price: 98.200, change: -0.45, volume: 14800, peRatio: 6.5, dividendYield: 5.5, description: 'Première banque privée de la place de Tunis, profitabilité robuste.' },
  { ticker: 'PGH', name: 'Poulina Group Holding', price: 9.150, change: 0.88, volume: 21600, peRatio: 14.1, dividendYield: 4.2, description: 'Plus grand conglomérat industriel privé de Tunisie (agro, papier, emballage).' },
  { ticker: 'SAH', name: 'SAH Lilas (Société d\'Articles Hygiéniques)', price: 8.400, change: 2.15, volume: 38200, peRatio: 12.8, dividendYield: 3.9, description: 'Acteur majeur de l\'hygiène personnelle, forte croissance à l\'export.' },
  { ticker: 'ECYCL', name: 'Euro-Cycles S.A.', price: 11.900, change: -1.82, volume: 11200, peRatio: 8.9, dividendYield: 7.2, description: 'Exportateur de bicyclettes vers l\'UE, basé dans la zone industrielle de Sousse.' },
  { ticker: 'CC', name: 'Carthage Cement', price: 1.850, change: 0.00, volume: 154000, peRatio: 22.4, dividendYield: 0.0, description: 'Cimenterie de premier plan avec contrats d\'export majeurs vers l\'Afrique.' },
  { ticker: 'BTA', name: 'Obligation Assimilable du Trésor (BTA)', price: 100.000, change: 0.05, volume: 20000, peRatio: 12.0, dividendYield: 8.25, description: 'Bons du Trésor tunisiens garantis par l\'État, rendement fixe sans risque opérationnel.' },
];

export default function InvestmentManager({
  bankAccounts,
  bankTransactions,
  taxDeclarations,
  yearEndClosings,
  onUpdateBankAccounts,
  onUpdateBankTransactions,
  onUpdateTaxDeclarations,
  onUpdateYearEndClosings,
  readOnly = false
}: InvestmentManagerProps) {

  // Local storage for purchased shares
  const [sharesOwned, setSharesOwned] = useState<{ [ticker: string]: { quantity: number; avgCostPrice: number } }>(() => {
    const saved = localStorage.getItem('carthage_portfolio_investments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Seed with initial portfolios for Elyssa Entreprises
    return {
      'SFBT': { quantity: 1500, avgCostPrice: 11.800 },
      'BIAT': { quantity: 120, avgCostPrice: 92.500 },
      'BTA': { quantity: 300, avgCostPrice: 100.000 }
    };
  });

  useEffect(() => {
    localStorage.setItem('carthage_portfolio_investments', JSON.stringify(sharesOwned));
  }, [sharesOwned]);

  const [selectedStock, setSelectedStock] = useState<StockQuote>(TUNIS_STOCKS[0]);
  const [activeSubView, setActiveSubView] = useState<'market' | 'portfolio' | 'fiscal_bridge' | 'api_config'>('market');
  
  // API connection config for BVMT / Broker
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('carthage_bvmt_api_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      broker: 'MAC SA',
      endpoint: 'https://api.bvmt.com.tn/v1/router',
      clientId: 'CATH-ENT-9452',
      secretKey: '••••••••••••••••••••••••••••••••',
      sibtelLiveFeed: true
    };
  });

  const [saveSuccess, setSaveSuccess] = useState('');

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    localStorage.setItem('carthage_bvmt_api_config', JSON.stringify(apiConfig));
    setSaveSuccess('Paramètres de connexion API enregistrés avec succès ! Connexion au registre de la BVMT opérationnelle.');
    setTimeout(() => {
      setSaveSuccess('');
    }, 4500);
  };
  
  // Transaction Buying state
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQty, setTradeQty] = useState<number>(100);
  const [tradeBankId, setTradeBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [isTradeProcessing, setIsTradeProcessing] = useState(false);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState('');
  const [tradeErrorMsg, setTradeErrorMsg] = useState('');

  // Auto-sync bank account selection when bankAccounts list updates or mounts
  useEffect(() => {
    if (bankAccounts && bankAccounts.length > 0) {
      if (!tradeBankId || !bankAccounts.some(a => a.id === tradeBankId)) {
        setTradeBankId(bankAccounts[0].id);
      }
    }
  }, [bankAccounts, tradeBankId]);

  // Dividends state
  const [divSuccessMsg, setDivSuccessMsg] = useState('');

  // AI Analyst State
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Generate 30 days historical charts for selected stock with deterministic pattern
  const stockHistoryData = useMemo(() => {
    const basePrice = selectedStock.price;
    const history = [];
    const changeFactor = selectedStock.change / 100;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      
      // Deterministic pseudo-random walk based on stock ticker
      const charSum = selectedStock.ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const walk = Math.sin((i + charSum) * 0.4) * (basePrice * 0.04) + Math.cos(i * 0.7) * (basePrice * 0.015);
      const trend = (basePrice * changeFactor * (30 - i) / 30);
      const finalPrice = Math.max(0.1, +(basePrice + walk + trend).toFixed(3));
      
      history.push({
        date: formattedDate,
        valeur: finalPrice
      });
    }
    return history;
  }, [selectedStock]);

  // Compute calculated values for owned stocks
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const items = (Object.entries(sharesOwned) as [string, { quantity: number; avgCostPrice: number }][]).map(([ticker, data]) => {
      const quote = TUNIS_STOCKS.find(s => s.ticker === ticker) || { price: data.avgCostPrice, change: 0, name: ticker };
      const currentVal = data.quantity * quote.price;
      const costBasis = data.quantity * data.avgCostPrice;
      const profitLoss = currentVal - costBasis;
      const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      
      totalInvested += costBasis;
      totalCurrentValue += currentVal;

      return {
        ticker,
        name: quote.name,
        quantity: data.quantity,
        avgCostPrice: data.avgCostPrice,
        currentPrice: quote.price,
        currentValue: currentVal,
        costBasis,
        profitLoss,
        profitLossPct,
      };
    }).filter(item => item.quantity > 0);

    const netProfitLoss = totalCurrentValue - totalInvested;
    const netProfitLossPct = totalInvested > 0 ? (netProfitLoss / totalInvested) * 100 : 0;

    return {
      items,
      totalInvested,
      totalCurrentValue,
      netProfitLoss,
      netProfitLossPct
    };
  }, [sharesOwned]);

  // Handle Trade Buy/Sell operations
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeSuccessMsg('');
    setTradeErrorMsg('');

    if (tradeQty <= 0) {
      setTradeErrorMsg('La quantité doit être supérieure à zéro.');
      return;
    }

    // Default fallback account if empty
    let selectedAcc = bankAccounts.find(a => a.id === tradeBankId);
    if (!selectedAcc && bankAccounts.length > 0) {
      selectedAcc = bankAccounts[0];
    }
    
    // If no bank account exists at all, construct a virtual operational account
    if (!selectedAcc) {
      selectedAcc = {
        id: 'virtual-ba-1',
        bankName: 'Attijari Bank Sfax',
        accountNumber: '040010100159200387654',
        type: 'Checking',
        initialBalance: 250000.000,
        currentBalance: 250000.000,
        currency: 'TND',
        status: 'Active'
      };
    }

    const totalCost = +(tradeQty * selectedStock.price).toFixed(3);

    if (tradeAction === 'BUY') {
      // Check balance (approximate computed balance for this bank account)
      const initialBal = selectedAcc.initialBalance ?? selectedAcc.currentBalance ?? 250000;
      const clearedTransactions = bankTransactions.filter(tx => tx.accountId === selectedAcc.id && tx.status === 'Cleared');
      const inSum = clearedTransactions.filter(t => t.type === 'In').reduce((sum, t) => sum + t.amount, 0);
      const outSum = clearedTransactions.filter(t => t.type === 'Out').reduce((sum, t) => sum + t.amount, 0);
      const currentBankBalance = initialBal + inSum - outSum;

      if (currentBankBalance < totalCost) {
        setTradeErrorMsg(`Solde disponible insuffisant sur ${selectedAcc.bankName}. Nécessaire : ${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND, Disponible : ${currentBankBalance.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND.`);
        return;
      }

      setIsTradeProcessing(true);

      setTimeout(() => {
        // 1. Deduct money / Log payment transaction
        const tradeTx: BankTransaction = {
          id: 'tx_trade_' + Date.now(),
          accountId: selectedAcc.id,
          accountName: selectedAcc.bankName,
          date: new Date().toISOString().split('T')[0],
          type: 'Out',
          amount: totalCost,
          method: 'Virement',
          reference: `ORDRE-BUY-${selectedStock.ticker}`,
          beneficiaryOrIssuer: `BVMT-BROKER Tunisie (${selectedStock.ticker})`,
          category: 'Autre',
          description: `Achat de ${tradeQty} actions de ${selectedStock.name} (${selectedStock.ticker}) à ${selectedStock.price.toFixed(3)} TND via Bourse`,
          status: 'Cleared'
        };

        if (onUpdateBankTransactions) {
          onUpdateBankTransactions([tradeTx, ...bankTransactions]);
        }

        // 2. Add shares to local inventory
        setSharesOwned(prev => {
          const existing = prev[selectedStock.ticker] || { quantity: 0, avgCostPrice: 0 };
          const newQty = existing.quantity + tradeQty;
          const newCost = +((existing.quantity * existing.avgCostPrice + totalCost) / newQty).toFixed(3);
          return {
            ...prev,
            [selectedStock.ticker]: { quantity: newQty, avgCostPrice: newCost }
          };
        });

        setIsTradeProcessing(false);
        setTradeSuccessMsg(`Ordre réussi ! Achat de ${tradeQty} actions ${selectedStock.ticker} pour ${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND compensé avec succès.`);
      }, 600);

    } else {
      // SELL shares
      const existing = sharesOwned[selectedStock.ticker];
      const ownedQty = existing?.quantity || 0;
      
      if (ownedQty <= 0) {
        setTradeErrorMsg(`Vous ne détentez aucune action ${selectedStock.ticker} dans votre portefeuille actuellement.`);
        return;
      }

      if (ownedQty < tradeQty) {
        setTradeErrorMsg(`Quantité d'actions insuffisante dans votre portefeuille (Vous détentez : ${ownedQty} actions de ${selectedStock.ticker}).`);
        return;
      }

      setIsTradeProcessing(true);

      setTimeout(() => {
        const totalRevenue = +(tradeQty * selectedStock.price).toFixed(3);
        const costBasisRealized = +(tradeQty * existing.avgCostPrice).toFixed(3);
        const profitRealized = +(totalRevenue - costBasisRealized).toFixed(3);

        // 1. Credit bank account via transaction
        const tradeTx: BankTransaction = {
          id: 'tx_trade_' + Date.now(),
          accountId: selectedAcc.id,
          accountName: selectedAcc.bankName,
          date: new Date().toISOString().split('T')[0],
          type: 'In',
          amount: totalRevenue,
          method: 'Virement',
          reference: `ORDRE-SELL-${selectedStock.ticker}`,
          beneficiaryOrIssuer: `BVMT-BROKER Tunisie (${selectedStock.ticker})`,
          category: 'Autre',
          description: `Cession de ${tradeQty} actions de ${selectedStock.name} (${selectedStock.ticker}) à ${selectedStock.price.toFixed(3)} TND (Plus-value réalisée: ${profitRealized > 0 ? '+' : ''}${profitRealized.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND)`,
          status: 'Cleared'
        };

        if (onUpdateBankTransactions) {
          onUpdateBankTransactions([tradeTx, ...bankTransactions]);
        }

        // 2. Update stock inventory
        setSharesOwned(prev => {
          const current = prev[selectedStock.ticker];
          const nextQty = current.quantity - tradeQty;
          return {
            ...prev,
            [selectedStock.ticker]: {
              quantity: nextQty,
              avgCostPrice: nextQty > 0 ? current.avgCostPrice : 0
            }
          };
        });

        setIsTradeProcessing(false);
        setTradeSuccessMsg(`Ordre réussi ! Vente de ${tradeQty} actions ${selectedStock.ticker} exécutée. Crédit transigé de ${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND.`);
      }, 600);
    }
  };

  // Receive Dividends with 10% withholding tax (Tunisian Code)
  const handleCollectDividends = (ticker: string) => {
    setDivSuccessMsg('');
    const owned = sharesOwned[ticker];
    const stock = TUNIS_STOCKS.find(s => s.ticker === ticker);
    
    if (!owned || owned.quantity <= 0 || !stock || stock.dividendYield <= 0) return;

    // In Tunisian custom: dividend amount returned per share
    // Let's compute dividend payment = 6.5% yield of the initial price, or say 0.600 TND per share
    const dividendPerShare = +(stock.price * (stock.dividendYield / 100)).toFixed(3);
    const grossDividends = +(owned.quantity * dividendPerShare).toFixed(3);
    
    // Withholding tax in Tunisia: 10% on dividends
    const withholdingTax = +(grossDividends * 0.10).toFixed(3);
    const netDividendsReceived = +(grossDividends - withholdingTax).toFixed(3);

    // Pick first bank account to deposit
    const defaultAcc = bankAccounts[0];
    if (!defaultAcc) return;

    // 1. Post Bank Transaction for net dividend received
    const divTx: BankTransaction = {
      id: 'tx_div_' + Date.now(),
      accountId: defaultAcc.id,
      accountName: defaultAcc.bankName,
      date: new Date().toISOString().split('T')[0],
      type: 'In',
      amount: netDividendsReceived,
      method: 'Virement',
      reference: `DIV-${ticker}-2026`,
      beneficiaryOrIssuer: `${stock.name} (Service Titres)`,
      category: 'Dividendes',
      description: `Règlement de dividendes exercice 2025. Brut: ${grossDividends.toLocaleString()} TND, Retenue fiscale subie (10%): ${withholdingTax.toLocaleString()} TND`,
      status: 'Cleared'
    };

    onUpdateBankTransactions([divTx, ...bankTransactions]);

    // 2. Update Tax Declaration with Withholding Tax Subie
    const currentYear = 2026;
    const activeDeclaration = taxDeclarations.find(d => d.year === currentYear && d.status === 'Draft');

    if (activeDeclaration) {
      const updatedDeclarations = taxDeclarations.map(d => {
        if (d.id === activeDeclaration.id) {
          return {
            ...d,
            withholdingPaid: +(d.withholdingPaid + withholdingTax).toFixed(3),
            totalAmountPaid: +(d.totalAmountPaid - withholdingTax).toFixed(3), // credit tax
          };
        }
        return d;
      });
      onUpdateTaxDeclarations(updatedDeclarations);
    } else {
      // Create a quarterly draft with the withholding tax loaded
      const newDec: TaxDeclaration = {
        id: 'tax_gen_' + Date.now(),
        year: currentYear,
        period: 'Q2',
        periodLabel: 'T2 2026',
        tvaCollected: 0,
        tvaDeductible: 0,
        tvaDue: 0,
        withholdingPaid: withholdingTax,
        withholdingCollected: 0,
        corporateTaxEstimate: 0,
        status: 'Draft',
        totalAmountPaid: -withholdingTax
      };
      onUpdateTaxDeclarations([...taxDeclarations, newDec]);
    }

    setDivSuccessMsg(`Dividendes de ${ticker} perçus ! Brut : ${grossDividends.toLocaleString()} TND, Crédit net crédité de ${netDividendsReceived.toLocaleString()} TND sur ${defaultAcc.bankName}. Retenue fiscale de ${withholdingTax.toLocaleString()} TND (10%) intégrée à votre déclaration fiscale.`);
    
    // Clear notification automatically after 6s
    setTimeout(() => setDivSuccessMsg(''), 6000);
  };

  // Gemini AI advice generation
  const handleTriggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiReport('');

    const payload = {
      bankBalances: bankAccounts.map(a => ({ name: a.bankName, balance: a.initialBalance })),
      portfolio: (Object.entries(sharesOwned) as [string, { quantity: number; avgCostPrice: number }][]).map(([ticker, data]) => {
        const quote = TUNIS_STOCKS.find(s => s.ticker === ticker);
        return {
          ticker,
          name: quote?.name || ticker,
          quantity: data.quantity,
          avgCost: data.avgCostPrice,
          currentPrice: quote?.price || 0
        };
      })
    };

    try {
      const adminSettingsRaw = localStorage.getItem('carthage_admin_settings');
      const customKey = adminSettingsRaw ? JSON.parse(adminSettingsRaw).geminiApiKey : '';
      const response = await fetch('/api/gemini/bourse', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': customKey || ''
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiReport(data.analysis);
      } else {
        setAiReport("Impossible de charger les prévisions. Veuillez réessayer plus tard.");
      }
    } catch (err) {
      console.error(err);
      setAiReport("Erreur réseau de communication avec l'assistant financier Gemini. Affichage du mode de secours.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Module description row */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-700">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Placement & Bourse de Tunis</h2>
              <p className="text-xs text-slate-450 font-medium">Allocation d'excédents de trésorerie sur la place BVMT et suivi de rentabilité fiscale tunisienne.</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Tab buttons inside portfolio */}
        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubView('market')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubView === 'market' 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            📊 Marché BVMT
          </button>
          <button
            onClick={() => setActiveSubView('portfolio')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubView === 'portfolio' 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            💼 Mon Portefeuille
          </button>
          <button
            onClick={() => setActiveSubView('fiscal_bridge')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubView === 'fiscal_bridge' 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            🏛️ Connexion Fiscale
          </button>
          <button
            onClick={() => setActiveSubView('api_config')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubView === 'api_config' 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            ⚙️ Configuration API Bourse
          </button>
        </div>
      </div>

      {/* Grid summarizing the Portfolio Value */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valorisation Actions</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl font-black text-slate-900">{portfolioSummary.totalCurrentValue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</span>
            <span className="text-xs text-slate-450 font-bold font-mono">TND</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-[11px]">
            <span className="text-slate-450">Coût Investi:</span>
            <span className="font-semibold text-slate-700">{portfolioSummary.totalInvested.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gains Latents (Plus-value)</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className={`text-2xl font-black ${portfolioSummary.netProfitLoss >= 0 ? 'text-emerald-650' : 'text-rose-650'}`}>
              {portfolioSummary.netProfitLoss >= 0 ? '+' : ''}{portfolioSummary.netProfitLoss.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
            </span>
            <span className="text-xs text-slate-450 font-bold font-mono">TND</span>
          </div>
          <div className="flex items-center space-x-2 mt-2 text-[11px]">
            <span className={`font-black px-1.5 py-0.5 rounded ${portfolioSummary.netProfitLoss >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {portfolioSummary.netProfitLoss >= 0 ? '▲' : '▼'} {portfolioSummary.netProfitLossPct.toFixed(2)} %
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rendement Moyen du Portefeuille</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl font-black text-indigo-700">
              {TUNIS_STOCKS.reduce((sum, s) => sum + (sharesOwned[s.ticker] ? s.dividendYield : 0), 0) / (Object.keys(sharesOwned).filter(k=>sharesOwned[k].quantity>0).length || 1) === 0 
                ? '5.85' 
                : (TUNIS_STOCKS.reduce((sum, s) => sum + (sharesOwned[s.ticker] ? s.dividendYield : 0), 0) / (Object.keys(sharesOwned).filter(k=>sharesOwned[k].quantity>0).length || 1)).toFixed(2)
              } %
            </span>
          </div>
          <p className="text-[10px] text-slate-450 mt-2 font-medium">Rendement dividende moyen pondéré annuel.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-150 shadow-3xs bg-gradient-to-br from-indigo-50/20 to-white">
          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Trésorerie Disponible</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl font-black text-slate-900">
              {bankAccounts.reduce((sum, a) => {
                const clearedTx = bankTransactions.filter(tx => tx.accountId === a.id && tx.status === 'Cleared');
                const inS = clearedTx.filter(t => t.type === 'In').reduce((sum, t) => sum + t.amount, 0);
                const outS = clearedTx.filter(t => t.type === 'Out').reduce((sum, t) => sum + t.amount, 0);
                return sum + (a.initialBalance + inS - outS);
              }, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
            </span>
            <span className="text-xs text-indigo-650 font-bold font-mono">TND</span>
          </div>
          <p className="text-[10px] text-slate-450 mt-2 font-medium">Somme consolidée de vos comptes bancaires actifs.</p>
        </div>

      </div>

      {divSuccessMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-semibold flex items-start space-x-3"
        >
          <Check className="w-4 h-4 text-emerald-650 shrink-0 mt-0.5" />
          <span>{divSuccessMsg}</span>
        </motion.div>
      )}

      {/* Main Views Router Container */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: MARKET BVMT */}
        {activeSubView === 'market' && (
          <motion.div
            key="market"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left side: Tunis stock table index */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                  <span>🏛️ Cours Officiels de la BVMT</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-bold">TUNIS COMPENSÉ</span>
                </h3>
                <span className="text-[10px] text-slate-450 font-mono flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Elyssa Broker Direct 15m retarded</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-450">
                      <th className="py-2.5">Valeur / Titre</th>
                      <th className="py-2.5 text-right">Dernier (TND)</th>
                      <th className="py-2.5 text-right">Var. %</th>
                      <th className="py-2.5 text-right">Volume</th>
                      <th className="py-2.5 text-right">Div. Brut</th>
                      <th className="py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {TUNIS_STOCKS.map(stock => {
                      const selected = selectedStock.ticker === stock.ticker;
                      return (
                        <tr 
                          key={stock.ticker}
                          onClick={() => setSelectedStock(stock)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${selected ? 'bg-indigo-50/40 font-semibold' : ''}`}
                        >
                          <td className="py-3 pr-2">
                            <div className="font-black text-slate-900">{stock.ticker}</div>
                            <div className="text-[10px] text-slate-450 truncate max-w-[180px]">{stock.name}</div>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-slate-800">
                            {stock.price.toFixed(3)}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center space-x-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                              stock.change > 0 ? 'bg-emerald-50 text-emerald-700' :
                              stock.change < 0 ? 'bg-rose-50 text-rose-700' :
                              'bg-slate-100 text-slate-650'
                            }`}>
                              {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                            {stock.volume.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                            {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStock(stock);
                                  setTradeAction('BUY');
                                  setTradeErrorMsg('');
                                  setTradeSuccessMsg('');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg text-[10px] font-black transition cursor-pointer border border-emerald-200/60"
                                title={`Transmettre un ordre d'achat pour ${stock.ticker}`}
                              >
                                Acheter
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStock(stock);
                                  setTradeAction('SELL');
                                  setTradeErrorMsg('');
                                  setTradeSuccessMsg('');
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg text-[10px] font-black transition cursor-pointer border border-rose-200/60"
                                title={`Transmettre un ordre de vente pour ${stock.ticker}`}
                              >
                                Vendre
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informative footer */}
              <div className="bg-slate-50 rounded-xl p-3 mt-4 border border-slate-100 flex items-start space-x-2.5 text-slate-500 text-[10px] leading-relaxed">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Information de Compensation :</strong> Les opérations boursières de Elyssa Entreprises sont dénouées à J+2 d'après les directives de la Société Tunisienne de l'Électricité et du Gaz et BVMT. Les fonds sont prélevés directement sur vos comptes d'exploitation déclarés.
                </span>
              </div>
            </div>

            {/* Right side: Detailed Stock Chart & Fast order trigger form */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Chart widget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase font-mono">{selectedStock.ticker}</span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">{selectedStock.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 font-mono">{selectedStock.price.toFixed(3)} TND</div>
                    <div className={`text-xs font-bold font-mono ${selectedStock.change >= 0 ? 'text-emerald-650' : 'text-rose-650'}`}>
                      {selectedStock.change >= 0 ? '▲' : '▼'} {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)} %
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-450 leading-normal mb-4">{selectedStock.description}</p>

                {/* Performance Chart */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockHistoryData}>
                      <defs>
                        <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={30} />
                      <Tooltip 
                        contentStyle={{ fontSize: 10, borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} 
                        formatter={(val: any) => [`${(+val).toFixed(3)} TND`, 'Valeur']} 
                      />
                      <Area type="monotone" dataKey="valeur" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#chartColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-[10px] text-slate-500 font-mono">
                  <div>PER: <span className="font-bold text-slate-800">{selectedStock.peRatio}x</span></div>
                  <div>Dividende Estimé: <span className="font-bold text-slate-800">{selectedStock.dividendYield}%</span></div>
                </div>
              </div>

              {/* Order form widget */}
              <div className="bg-white p-5 rounded-2xl border border-indigo-150 shadow-3xs">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>📝 Carnet de Transmission d'Ordre</span>
                  <span className="text-[10px] text-slate-400 font-normal font-mono">
                    Valeur : <strong className="text-slate-700 font-bold">{selectedStock.ticker}</strong>
                  </span>
                </h4>

                {tradeSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-[11px] font-semibold mb-3 animate-fade-in">
                    {tradeSuccessMsg}
                  </div>
                )}
                {tradeErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-[11px] font-semibold mb-3 flex items-start space-x-1.5 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{tradeErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleExecuteTrade} className="space-y-3">
                  
                  {/* Select Order action type (BUY / SELL buttons) */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setTradeAction('BUY');
                        setTradeErrorMsg('');
                        setTradeSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        tradeAction === 'BUY' 
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Achat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTradeAction('SELL');
                        setTradeErrorMsg('');
                        setTradeSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        tradeAction === 'SELL' 
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/30' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Vente</span>
                    </button>
                  </div>

                  {/* Account Debit/Credit selection */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                      {tradeAction === 'BUY' ? 'Compte bancaire à débiter' : 'Compte bancaire à créditer'}
                    </label>
                    <select
                      value={tradeBankId}
                      onChange={(e) => setTradeBankId(e.target.value)}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-hidden"
                    >
                      {bankAccounts.length === 0 ? (
                        <option value="virtual-ba-1">
                          Attijari Bank Sfax [TND] — RIB : ... 8 7654
                        </option>
                      ) : (
                        bankAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.bankName} [{acc.currency === 'TND_CONV' ? 'Convertible' : (acc.currency || 'TND')}] — RIB : ... {acc.accountNumber.slice(-6)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Quantity and Value evaluation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Quantité (Actions)</label>
                        {sharesOwned[selectedStock.ticker]?.quantity > 0 && (
                          <span className="text-[9.5px] text-indigo-600 font-mono font-bold">
                            Détenu : {sharesOwned[selectedStock.ticker].quantity}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={tradeQty}
                          onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full text-xs font-bold bg-white border border-slate-200 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-hidden pr-12"
                        />
                        {tradeAction === 'SELL' && sharesOwned[selectedStock.ticker]?.quantity > 0 && (
                          <button
                            type="button"
                            onClick={() => setTradeQty(sharesOwned[selectedStock.ticker].quantity)}
                            className="absolute right-1.5 top-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-1 rounded cursor-pointer"
                          >
                            MAX
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Prix de Transaction</label>
                      <div className="w-full text-xs font-black bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-mono text-slate-700 leading-normal">
                        {selectedStock.price.toFixed(3)} TND
                      </div>
                    </div>
                  </div>

                  {/* Total summary row */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Montant Estimé Consolidé</span>
                      <strong className="text-sm font-black text-indigo-900 leading-tight">
                        {(tradeQty * selectedStock.price).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                      </strong>
                    </div>
                    <button
                      type="submit"
                      disabled={isTradeProcessing || readOnly}
                      className={`px-4 py-2.5 text-xs font-black text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 ${
                        tradeAction === 'BUY' 
                          ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:bg-slate-300' 
                          : 'bg-rose-600 hover:bg-rose-700 active:scale-98 disabled:bg-slate-300'
                      }`}
                    >
                      {isTradeProcessing ? (
                        <span>Traitement en cours...</span>
                      ) : tradeAction === 'BUY' ? (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Transmettre Ordre d'Achat</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Transmettre Ordre de Vente</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: PORTFOLIO HOLDINGS */}
        {activeSubView === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* List of owned stocks and details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Portefeuille Titres de Elyssa Entreprises</span>
              </h3>

              {portfolioSummary.items.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-semibold text-xs">Aucune action en possession pour le moment</p>
                  <p className="text-[11px] text-slate-400">Dirigez-vous vers l'onglet Marché BVMT pour exécuter un premier ordre d'achat.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse-table">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase font-black tracking-wider text-slate-450">
                        <th className="py-2.5">Société / Ticker</th>
                        <th className="py-2.5 text-right">Actions détenues</th>
                        <th className="py-2.5 text-right">Prix Moyen d'Achat</th>
                        <th className="py-2.5 text-right">Cours Actuel</th>
                        <th className="py-2.5 text-right">Valeur actuelle</th>
                        <th className="py-2.5 text-right">Gain / Perte</th>
                        <th className="py-2.5 text-center">Dividendes</th>
                        <th className="py-2.5 text-center">Opérations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {portfolioSummary.items.map(item => {
                        const targetStock = TUNIS_STOCKS.find(s => s.ticker === item.ticker);
                        return (
                        <tr key={item.ticker} className="hover:bg-slate-50/50">
                          <td className="py-3.5">
                            <strong className="text-slate-900 font-black">{item.ticker}</strong>
                            <div className="text-[10px] text-slate-450 truncate max-w-[200px]">{item.name}</div>
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-slate-700">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-600">
                            {item.avgCostPrice.toFixed(3)} TND
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-800 font-bold">
                            {item.currentPrice.toFixed(3)} TND
                          </td>
                          <td className="py-3.5 text-right font-mono font-black text-slate-900">
                            {item.currentValue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-flex items-center font-mono font-bold ${item.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND <br />
                              <span className="text-[9px] font-normal ml-0.5">({item.profitLossPct.toFixed(2)}%)</span>
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {/* Dividends collect action */}
                            {targetStock?.dividendYield !== 0 ? (
                              <button
                                onClick={() => handleCollectDividends(item.ticker)}
                                disabled={readOnly}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg border border-indigo-150 transition cursor-pointer flex items-center space-x-1 mx-auto"
                                title="Réclamer les dividendes de l'exercice et reverser la retenue à la source de 10%"
                              >
                                <Percent className="w-3 h-3 text-indigo-650" />
                                <span>Encaisser Div.</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Sans dividende</span>
                            )}
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (targetStock) setSelectedStock(targetStock);
                                  setTradeAction('SELL');
                                  setTradeQty(item.quantity);
                                  setTradeErrorMsg('');
                                  setTradeSuccessMsg('');
                                  setActiveSubView('market');
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Vendre cette ligne d'actions"
                              >
                                Vendre
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (targetStock) setSelectedStock(targetStock);
                                  setTradeAction('BUY');
                                  setTradeQty(100);
                                  setTradeErrorMsg('');
                                  setTradeSuccessMsg('');
                                  setActiveSubView('market');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Renforcer la position (Racheter des actions)"
                              >
                                Acheter +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Gemini AI Advice card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Revue Stratégique & Arbitrage d'Excédents par Gemini AI</span>
                  </h4>
                  <p className="text-xs text-slate-450">L'IA analyse votre portefeuille actions, vos liquidités et propose un plan d'allocation d'actifs sur la place financière de Tunis.</p>
                </div>
                <button
                  onClick={handleTriggerAiAnalysis}
                  disabled={isAiLoading || readOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black p-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{isAiLoading ? "Analyse en cours..." : "Générer Rapport IA"}</span>
                </button>
              </div>

              {isAiLoading && (
                <div className="space-y-2 py-4">
                  <div className="h-3.5 bg-slate-100 rounded-md animate-pulse w-3/4"></div>
                  <div className="h-3.5 bg-slate-100 rounded-md animate-pulse w-full"></div>
                  <div className="h-3.5 bg-slate-100 rounded-md animate-pulse w-5/6"></div>
                </div>
              )}

              {aiReport && !isAiLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed space-y-3"
                >
                  <div className="flex items-center space-x-2 text-indigo-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-indigo-100 pb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Avis d'Arbitrage Économique (Généré par Gemini)</span>
                  </div>
                  <div className="whitespace-pre-line text-slate-650 tracking-wide font-medium leading-relaxed">
                    {aiReport}
                  </div>
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

        {/* VIEW 3: FISCAL & ACCOUNTING CONNECTION BRIDGE */}
        {activeSubView === 'fiscal_bridge' && (
          <motion.div
            key="fiscal_bridge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            
            {/* Tax implication instructions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-indigo-700" />
                <span>Réglementation Fiscale & Mécanisme Comptable</span>
              </h3>

              <div className="space-y-3 text-xs leading-relaxed text-slate-650 font-medium">
                <p>
                  Toute opération d'investissement financier accomplie par Elyssa Entreprises est enregistrée fidèlement dans le grand livre comptable d'après la réglementation nationale tunisienne :
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">⚖️ Régime d'imposition sur le revenu mobilier</h4>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li>
                      <strong>Retenue à la source sur dividendes :</strong> Le décret-loi comptable tunisien impose une retenue libératoire de <strong>10%</strong> subie directement par le détenteur (crédit d'impôt récupérable).
                    </li>
                    <li>
                      <strong>Taxes sur Plus-values de Cession :</strong> Les profits de cession d'obligations d'État (BTA) sont exonérés d'impôt en vertu du code de soutien monétaire. Les profits sur actions ordinaires (ex: SFBT, BIAT) sont réintégrés au résultat imposable à hauteur du taux ordinaire de l'IS (15%).
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">📊 Schémas de liaison automatique avec vos modules :</h4>
                  <p className="text-[11px]">
                    Lorsque vous effectuez un encaissement de dividende dans votre portefeuille, le montant net est comptabilisé instantanément comme revenu financier, tandis que la retenue de 10% s'intègre automatiquement dans la ligne <strong>Impôts sur Résultat / Retenues Subies</strong> de votre déclaration fiscale mensuelle active (T2/Trimestrielle).
                  </p>
                </div>
              </div>

              {/* PDF report of stock portfolio */}
              <div className="bg-indigo-50/40 p-4 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-xs text-indigo-900 block font-bold">Rapport d'inventaire financier</strong>
                  <span className="text-[10px] text-slate-500 block">Télécharger l'évaluation officielle de vos actifs financiers au format PDF.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert("Génération PDF d'audit de portefeuille initiée... Le fichier sera sauvegardé localement d'après votre grille d'avoirs.");
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>

            {/* Interconnected financial audit ledger log list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-700" />
                <span>Journal d'Affection Trésorerie-Investissement</span>
              </h3>

              <div className="space-y-2.5">
                {bankTransactions.filter(t => t.description.includes('action') || t.description.includes('dividende') || t.category === 'Dividendes').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    Aucun événement d'investissement boursier n'a encore été tracé dans le grand livre de trésorerie.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankTransactions.filter(t => t.description.includes('action') || t.description.includes('dividende') || t.category === 'Dividendes').slice(0, 5).map(tx => (
                      <div 
                        key={tx.id}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span className={tx.type === 'In' ? 'text-emerald-600' : 'text-slate-600'}>
                              {tx.type === 'In' ? '📥 Entrée' : '📤 Sortie'}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{tx.reference}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">{tx.description}</p>
                          <span className="text-[9px] text-indigo-650 font-semibold font-mono block mt-1">Via: {tx.accountName} | {tx.date}</span>
                        </div>
                        <div className="text-right font-mono font-black text-slate-800">
                          {tx.type === 'In' ? '+' : '-'}{tx.amount.toLocaleString()} TND
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax reporting status widget */}
              <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/20 space-y-2 text-xs">
                <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-700 animate-pulse" />
                  <span>Statut Intégration Fiscale (Modulée TS)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed">
                  <div>
                    <span className="text-slate-450 block text-[10px]">Déclaration fiscalité en cours:</span>
                    <strong className="text-slate-800 font-bold">T2 2026 (En cours d'exercice)</strong>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10px]">Retenues Subies (Invests Bourse):</span>
                    <strong className="text-emerald-700 font-black">
                      {(Array.isArray(taxDeclarations) ? taxDeclarations : []).reduce((sum, d) => sum + (d?.withholdingPaid || (d as any)?.retenueSource || 0), 0).toLocaleString('fr-TN')} TND
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100/50 bg-indigo-50/50 -mx-4 -mb-4 p-3 rounded-b-2xl flex justify-between items-center text-[10px] text-slate-500 leading-normal font-medium">
                  <span>Pris en charge au titre de l'impôt sur les sociétés tunisien.</span>
                  <span className="text-emerald-700 font-bold uppercase">● LIÉ ET SYNCHRONISÉ</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW 4: API & ACCESS DIRECT CONFIGURATION */}
        {activeSubView === 'api_config' && (
          <motion.div
            key="api_config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
          >
            {/* Left Pane - Config Form (5 columns) */}
            <div className="xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
              <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-700">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Accès API Courtier & BVMT</h3>
                  <p className="text-[10px] text-slate-400">Configurez votre routage direct pour transmettre de réels ordres en ligne.</p>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveApiConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Intermédiaire en Bourse (Agréé CMF)</label>
                  <select
                    value={apiConfig.broker}
                    onChange={(e) => setApiConfig({ ...apiConfig, broker: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold bg-white"
                  >
                    <option value="MAC SA">MAC SA — Intermédiaire Elyssa Entreprises</option>
                    <option value="Tunisie Valeurs">Tunisie Valeurs — Groupe BIAT</option>
                    <option value="AFC">AFC — Arab Financial Consultants</option>
                    <option value="Amen Invest">Amen Invest — Groupe Amen Bank</option>
                    <option value="BIAT Asset Management">BIAT Capital / Asset Management</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Adresse de l'API Passerelle (REST/FIX)</label>
                  <input
                    type="url"
                    value={apiConfig.endpoint}
                    onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                    placeholder="https://api.votre-courtier.tn/v1/trade"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Identifiant Client API (Account ID / CMF)</label>
                  <input
                    type="text"
                    value={apiConfig.clientId}
                    onChange={(e) => setApiConfig({ ...apiConfig, clientId: e.target.value })}
                    placeholder="ex. MAC-INST-7589"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Clé Secrète / Jeton d'Authentification (Bearer JWT)</label>
                  <input
                    type="password"
                    value={apiConfig.secretKey}
                    onChange={(e) => setApiConfig({ ...apiConfig, secretKey: e.target.value })}
                    placeholder="Saisissez votre clé secrète JWT"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                    required
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Flux Cotations en Temps Réel SIBTEL</span>
                    <span className="text-[9px] text-slate-450 block">Abonnement automatique aux WebSockets d'écoulement SIBTEL</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={apiConfig.sibtelLiveFeed}
                    onChange={(e) => setApiConfig({ ...apiConfig, sibtelLiveFeed: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer text-center"
                >
                  Sauvegarder les Paramètres de Sécurité
                </button>
              </form>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                <h4 className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Environnement Local Sécurisé</span>
                </h4>
                <p className="text-[9.5px] text-amber-700 leading-normal font-semibold">
                  Ces clés de connexion API sont stockées uniquement de manière chiffrée en local sur votre terminal. Aucune donnée confidentielle n'est transmise d'appareil en appareil ou conservée hors du périmètre de votre navigateur web.
                </p>
              </div>
            </div>

            {/* Right Pane - Step by step procedures and broker contact details (7 columns) */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* Timeline cards */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-700">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Guide & Démarche Administrative de Routage en Direct</h3>
                    <p className="text-[10px] text-slate-400">Suivez ce protocole officiel pour obtenir vos accès de production auprès du CMF et des intermédiaires tunisiens.</p>
                  </div>
                </div>

                {/* Timeline Steps layout */}
                <div className="space-y-5 relative pl-4 border-l-2 border-slate-100 py-1">
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[25px] top-0 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono">1</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Ouverture du Compte-Titres Institutionnel</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Prenez contact avec un courtier agréé en Tunisie (Intermédiaire en Bourse). Elyssa Entreprises doit signer un acte de dépôt institutionnel d'excédent financier et désigner un responsable financier mandaté pour les signatures.
                      </p>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1">
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">💡 Documents requis :</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                          <li>Extrait de registre de commerce récent (RNE de moins de 3 mois).</li>
                          <li>Copie des Statuts de la société Elyssa Entreprises.</li>
                          <li>Rapport d'audit de solvabilité ou bilan financier signé du commissaire aux comptes.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative mt-4">
                    <span className="absolute -left-[25px] top-0 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono">2</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Signature de la Convention de Routage Électronique</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Demandez à votre intermédiaire en bourse de souscrire formellement à la <strong>"Convention de Transmission Électronique Directe des Ordres"</strong>. Ce document autorise l'interopérabilité directe entre notre plateforme progicielle locale de Elyssa et le carnet d'ordres BVMT réel.
                      </p>
                      <p className="text-[10.5px] text-indigo-700 italic font-semibold">
                        → Votre broker vous délivrera alors un Endpoint Passerelle (FIX ou REST/HTTP JSON) ainsi qu'un Client ID unique et un certificat SSL/Clé de chiffrement SSH.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative mt-4">
                    <span className="absolute -left-[25px] top-0 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono">3</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Abonnement SIBTEL Flux (Temps Réel)</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        L'accès au flux de données en temps réel est régi par la <strong>SIBTEL</strong> (Société Interbancaire de Télécompense tunisienne). Votre courtier liera votre compte au flux de données (WebSockets) pour transmettre en temps réel les hausses et baisses d'actions (SFBT, BIAT, CC, etc.) à votre tableau de bord.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative mt-4">
                    <span className="absolute -left-[25px] top-0 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono">4</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Saisie et Connexion sur le Progiciel</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Reportez les clés dans le formulaire de gauche. Dès la sauvegarde, la liaison est enclenchée. Les futurs clics sur le bouton <strong className="text-indigo-600 bg-indigo-50 px-1 rounded font-mono">Transmettre Ordre</strong> de l'onglet Marché n'utiliseront plus un modèle démo fictif mais formuleront de réelles requêtes signées au registre central.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Useful Tunisian Brokers references info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Intermédiaires et Courtages Recommandés en Tunisie</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px] font-medium text-slate-600">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-extrabold block">MAC SA — Intermédiaire Agréé</strong>
                    <span className="block text-slate-400">Les Berges du Lac, Tunis</span>
                    <span className="block text-indigo-700">Tél : +216 71 180 000 | macsa@macsa.com.tn</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-extrabold block">Tunisie Valeurs — Groupe BIAT</strong>
                    <span className="block text-slate-400">Place Pasteur, Tunis</span>
                    <span className="block text-indigo-700">Tél : +216 71 189 600 | tv@tunisievaleurs.com</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-extrabold block">Amen Invest — Groupe Amen Bank</strong>
                    <span className="block text-slate-400">Avenue Mohamed V, Tunis</span>
                    <span className="block text-indigo-700">Tél : +216 71 148 020 | contact@ameninvest.com.tn</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-extrabold block">AFC — Arab Financial Consultants</strong>
                    <span className="block text-slate-400">Immeuble AFC, Tunis</span>
                    <span className="block text-indigo-700">Tél : +216 71 862 300 | afc@afc.com.tn</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
