/**
 * @license


 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExecutiveSummaryWidget } from "./ExecutiveSummaryWidget";
import { AnomalyBadge } from "./AnomalyBadge";


import { Client, Complaint, Invoice, VisitReport, Product, Supplier } from '../types';
import { formatTND } from '../utils/calculations';
import { 
  Users, 


  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  ShieldAlert, 
  FileText,
  Package,
  DollarSign,
  ShoppingCart,
  Building2,
  Ship,
  Truck,
  Cpu,
  Briefcase,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Clock,
  Award,
  Mail,
  Check,
  Zap,
  Layers,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  Globe,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  clients: Client[];
  complaints: Complaint[];
  invoices: Invoice[];
  visitReports: VisitReport[];
  products?: Product[];
  setActiveTab: (tab: string) => void;
  trialState?: { isTrial: boolean; isExpired: boolean; daysLeft: number; diffDays: number; };
  trialTimeLeftStr?: string;
  licenseStatus?: string;
  activeCompanyName?: string;
  onOpenCopilot?: () => void;
}

export default function Dashboard({ 
  clients, 
  complaints, 
  invoices, 
  visitReports, 
  products = [], 
  setActiveTab, 
  trialState, 
  trialTimeLeftStr,
  licenseStatus,
  activeCompanyName = 'Inter-Affaires',
  onOpenCopilot
}: DashboardProps) {
  
  // --- DYNAMIC TABS FOR ELYSSA ERP ---
  const [currentDashboardTab, setCurrentDashboardTab] = useState<
    'all' | 'finance' | 'treasury' | 'purchasing' | 'stocks' | 'production' | 'logistics' | 'human' | 'commercial' | 'strategic'
  >('all');

  // --- SAFE LOCAL STORAGE PARSERS ---
  const getLocalStorageData = (key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed !== null && parsed !== undefined) {
          // If fallback is an array, ensure parsed is an array
          if (Array.isArray(fallback) && !Array.isArray(parsed)) {
            return fallback;
          }
          // If fallback is an object (and not an array), ensure parsed is a non-array object
          if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
              return fallback;
            }
          }
          return parsed;
        }
      }
    } catch (e) {}
    return fallback;
  };

  // --- RECONSTRUCTING EXTERNAL MODULE DATA (LOCALSTORAGE) ---
  // Requisitions & POs (Purchasing)
  const requisitions = getLocalStorageData('carthage_purchasing_requisitions', [
    { id: 'DA-2026-001', department: 'Production', title: 'Roulements à billes', quantity: 150, status: 'Approuvé' },
    { id: 'DA-2026-002', department: 'Logistique', title: 'Huile hydraulique pour chariot', quantity: 10, status: 'En attente' }
  ]);
  
  const purchaseOrders = getLocalStorageData('carthage_purchasing_orders', [
    { id: 'BC-2026-001', supplierName: 'SOTUMETAL S.A. (Tunis)', itemDescription: 'Cuivre Cathodique Pur de Haute Pureté', amountHT: 49000, amountTTC: 58839, status: 'Approuvé' },
    { id: 'BC-2026-002', supplierName: 'SOTUCHIM S.A. (Sfax)', itemDescription: 'Granulés de PVC Premium', amountHT: 12500, amountTTC: 14875, status: 'Approuvé' },
    { id: 'BC-2026-003', supplierName: 'TUNIFRET (Tunis)', itemDescription: 'Prestation Transit maritime', amountHT: 4200, amountTTC: 4998, status: 'En attente' }
  ]);

  const supplierPerformance = getLocalStorageData('carthage_purchasing_suppliers_performance', [
    { id: 'sup_1', name: 'SOTUMETAL S.A. (Tunis)', score: 92, delayRate: 0, totalVolume: 120000, category: 'Métaux' },
    { id: 'sup_2', name: 'SOTUCHIM S.A. (Sfax)', score: 78, delayRate: 5, totalVolume: 85000, category: 'Chimie' },
    { id: 'sup_3', name: 'PLASTIPACK (Nabeul)', score: 45, delayRate: 22, totalVolume: 35000, category: 'Emballage' }
  ]);

  // Production MOs
  const manufacturingOrders = getLocalStorageData('carthage_production_manufacturing_orders', [
    { id: 'OF-2026-001', productName: 'Câble Électrique Isolé 2.5mm²', quantityToProduce: 5000, quantityProduced: 5000, quantityScrapped: 120, assignedLine: 'Ligne d\'extrusion A (Sfax)', status: 'Terminé', advancement: 100 },
    { id: 'OF-2026-002', productName: 'Disjoncteur Divisionnaire 16A', quantityToProduce: 1500, quantityProduced: 850, quantityScrapped: 45, assignedLine: 'Ligne Assemblage B (Tunis)', status: 'En cours', advancement: 56 },
    { id: 'OF-2026-003', productName: 'Prise de Courant Murale 2P+T', quantityToProduce: 3000, quantityProduced: 0, quantityScrapped: 0, assignedLine: 'Ligne Assemblage B (Tunis)', status: 'Planifié', advancement: 0 }
  ]);

  // Import / Export Transit folders
  const importFolders = getLocalStorageData('carthage_import_folders', [
    { id: 'demo-imp_1', reference: 'IMP-2026-001 (Démo)', folderType: 'Import', supplierName: 'Marseille Chimie SAS', portOfArrival: 'Radès', status: 'Customs', estimatedArrivalDate: '2026-06-30' },
    { id: 'demo-imp_2', reference: 'EXP-2026-004 (Démo)', folderType: 'Export', supplierName: 'Sidi Bouzid Câbles', portOfArrival: 'Marseille', status: 'Transit', estimatedArrivalDate: '2026-07-15' }
  ]);

  const lcRequests = getLocalStorageData('carthage_lc_requests', [
    { id: 'demo-lc_1', lcReference: 'BIAT-CDOC-2026-0819 (Démo)', amount: 16350, currency: 'EUR', issuingBank: 'BIAT - Agence Sfax El Jadida' }
  ]);

  // Fleet
  const fleetVehicles = getLocalStorageData('carthage_fleet_vehicles', [
    { id: 'veh_1', brand: 'Peugeot', model: 'Partner', registration: '210 TU 4352', status: 'Active' },
    { id: 'veh_2', brand: 'Isuzu', model: 'D-Max', registration: '185 TU 8910', status: 'Active' },
    { id: 'veh_3', brand: 'Iveco', model: 'Daily', registration: '201 TU 1520', status: 'Maintenance' }
  ]);

  const fleetMissions = getLocalStorageData('carthage_fleet_missions', [
    { id: 'miss_1', driverName: 'Mohamed Ali', destination: 'Sfax - Usine Extrusion', status: 'En cours' },
    { id: 'miss_2', driverName: 'Hassen Ben Ammar', destination: 'Nabeul - Livraison Client', status: 'Terminé' }
  ]);

  // HR
  const employees = getLocalStorageData('carthage_employees', [
    { id: 'emp_1', firstName: 'Yassine', lastName: 'Ben Ali', jobTitle: 'Ingénieur d\'Affaires', baseSalary: 2200 },
    { id: 'emp_2', firstName: 'Amel', lastName: 'Sassi', jobTitle: 'Responsable Approvisionnements', baseSalary: 1800 },
    { id: 'emp_3', firstName: 'Kais', lastName: 'Trabelsi', jobTitle: 'Chef d\'Atelier', baseSalary: 1600 },
    { id: 'emp_4', firstName: 'Faten', lastName: 'Gharbi', jobTitle: 'Comptable Unique', baseSalary: 1500 }
  ]);

  const contracts = getLocalStorageData('carthage_contracts', [
    { id: 'ctr_1', type: 'CDI', status: 'Active' },
    { id: 'ctr_2', type: 'CDD', status: 'Active' },
    { id: 'ctr_3', type: 'CIVP', status: 'Active' }
  ]);

  const absences = getLocalStorageData('carthage_absences', [
    { id: 'abs_1', employeeName: 'Kais Trabelsi', type: 'Maladie', startDate: '2026-06-25', duration: 2 }
  ]);

  // Treasury
  const treasuryCheques = getLocalStorageData('carthage_treasury_cheques_effects', [
    { id: 'chq_1', bankName: 'BIAT', type: 'Cheque_In', amount: 12500, dueDate: '2026-07-05', status: 'En_Portefeuille' },
    { id: 'chq_2', bankName: 'Amen Bank', type: 'Effect_In', amount: 8900, dueDate: '2026-07-12', status: 'En_Portefeuille' },
    { id: 'chq_3', bankName: 'ATB', type: 'Cheque_Out', amount: 4500, dueDate: '2026-07-10', status: 'Emis_Non_Debite' }
  ]);

  // Inter-unit Transfers / Cession
  const cessionEntries = getLocalStorageData('carthage_cession_entries', [
    { id: 'ces_1', senderUnit: 'Usine Tunis', receiverUnit: 'Usine Sfax', productName: 'Granulés PVC', quantity: 2000, valueAmount: 6800, status: 'Terminé' }
  ]);

  // Support Tickets
  const supportTickets = getLocalStorageData('carthage_support_tickets', [
    { id: 'tick_1', subject: 'Manque palettes bois', department: 'Logistique', urgency: 'Moyenne', status: 'Résolu' },
    { id: 'tick_2', subject: 'Mise à jour fiche technique cuivre', department: 'Qualité', urgency: 'Haute', status: 'Nouveau' }
  ]);

  // --- STRATEGIC MODULES DATA LOADING & CALCULATIONS ---
  // A. Immobilisations
  const assets = getLocalStorageData('carthage_assets_immobilisations', [
    { id: 'IMM-2024-001', name: 'Extrudeuse Industrielle PEHD', category: 'Matériel Industriel', purchaseDate: '2024-01-15', initialValue: 185000, usefulLifeYears: 10, amortizationType: 'Linéaire', location: 'Usine de Sfax' },
    { id: 'IMM-2025-001', name: 'Serveurs Rack Core i9 Datacenter Tunis', category: 'Matériel Informatique', purchaseDate: '2025-03-10', initialValue: 24000, usefulLifeYears: 3, amortizationType: 'Linéaire', location: 'Siège Social Tunis' },
    { id: 'IMM-2024-002', name: 'Camion Isuzu 3.5T', category: 'Matériel de Transport', purchaseDate: '2024-06-20', initialValue: 85000, usefulLifeYears: 5, amortizationType: 'Linéaire', location: 'Dépôt de Sousse' }
  ]);

  const safeAssets = Array.isArray(assets) ? assets : [];
  const totalAssetsValueHT = safeAssets.reduce((sum: number, a: any) => sum + (Number(a?.initialValue) || 0), 0);
  
  // Straight-line depreciation helper
  const calculateDepreciation = (asset: any) => {
    try {
      if (!asset) return { accumulated: 0, bookValue: 0 };
      const buyDate = new Date(asset.purchaseDate || Date.now());
      const today = new Date();
      const yearsDiff = (today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const maxYears = Number(asset.usefulLifeYears) || 5;
      const activeYears = Math.min(maxYears, Math.max(0, yearsDiff));
      const annualRate = 1 / maxYears;
      const initialVal = Number(asset.initialValue) || 0;
      const accumulated = initialVal * annualRate * activeYears;
      const bookValue = initialVal - accumulated;
      return {
        accumulated: Math.round(accumulated),
        bookValue: Math.round(bookValue)
      };
    } catch (e) {
      return { accumulated: 0, bookValue: Number(asset?.initialValue) || 0 };
    }
  };

  const assetsCalculated = safeAssets.map((a: any) => {
    const dep = calculateDepreciation(a);
    return { ...a, ...dep };
  });

  const totalAccumulatedAmortization = assetsCalculated.reduce((sum: number, a: any) => sum + (a?.accumulated || 0), 0);
  const totalNetBookValue = totalAssetsValueHT - totalAccumulatedAmortization;

  // B. Lettres de Crédit (Crédocs)
  const lcs = getLocalStorageData('carthage_lc_requests', [
    { id: 'demo-lc_1', lcReference: 'BIAT-CDOC-2026-0819 (Démo)', amount: 16350, currency: 'EUR', issuingBank: 'BIAT - Agence Sfax El Jadida', status: 'Validée' }
  ]);
  const safeLcs = Array.isArray(lcs) ? lcs : [];
  const activeLcsCount = safeLcs.length;
  const totalLcsValueTND = safeLcs.reduce((sum: number, lc: any) => {
    if (!lc) return sum;
    const rate = lc.currency === 'EUR' ? 3.35 : lc.currency === 'USD' ? 3.10 : 1.0;
    return sum + (Number(lc.amount) || 0) * rate;
  }, 0);

  // C. Cession d'Entreprise (Évaluation / Social / Impôt)
  const cessionFiles = getLocalStorageData('carthage_cession_entries', [
    { id: 'cess-1', date: '2026-06-15', title: 'Audit initial & Évaluation d\'Entreprise', category: 'Evaluation', direction: 'Direction Financière', authorName: 'Khaled Ben Amor', financialImpact: 4500000.000, status: 'Approuvé' },
    { id: 'cess-2', date: '2026-06-18', title: 'Audit de conformité sociale - Art 15 CT', category: 'Ressources Humaines', direction: 'Direction RH', authorName: 'Sonia Meriah', financialImpact: 0, status: 'Complété' },
    { id: 'cess-3', date: '2026-06-20', title: 'Calcul prévisionnel d\'impôt plus-value', category: 'Fiscal', direction: 'Direction Financière', authorName: 'Mohamed Ali Gharbi', financialImpact: -112500.000, status: 'Soumis' }
  ]);
  const safeCessionFiles = Array.isArray(cessionFiles) ? cessionFiles : [];
  const activeCessionCount = safeCessionFiles.length;
  const cessionMaxValuation = 4500000.000;

  // D. BVMT / Bourse & Placements
  const portfolioInvestments = getLocalStorageData('carthage_portfolio_investments', {
    'SFBT': { quantity: 1500, avgCostPrice: 11.800 },
    'BIAT': { quantity: 120, avgCostPrice: 92.500 },
    'BTA': { quantity: 300, avgCostPrice: 100.000 }
  });

  const safePortfolioInvestments = (portfolioInvestments && typeof portfolioInvestments === 'object' && !Array.isArray(portfolioInvestments))
    ? portfolioInvestments
    : {};

  const stockQuotes = [
    { ticker: 'SFBT', name: 'Société de Boissons', price: 12.450 },
    { ticker: 'BIAT', name: 'Banque BIAT', price: 98.200 },
    { ticker: 'BTA', name: 'Obligations d\'État', price: 100.000 }
  ];

  let totalPortfolioCost = 0;
  let totalPortfolioValue = 0;

  Object.entries(safePortfolioInvestments).forEach(([ticker, data]: [string, any]) => {
    if (!data) return;
    const quote = stockQuotes.find(q => q.ticker === ticker);
    const price = quote ? quote.price : (Number(data.avgCostPrice) || 0);
    const qty = Number(data.quantity) || 0;
    const cost = Number(data.avgCostPrice) || 0;
    totalPortfolioCost += qty * cost;
    totalPortfolioValue += qty * price;
  });

  const unrealizedGain = totalPortfolioValue - totalPortfolioCost;
  const unrealizedGainPercent = totalPortfolioCost > 0 ? (unrealizedGain / totalPortfolioCost) * 100 : 0;


  // --- CALCULATED KPIs & METRICS ---
  
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeTreasuryCheques = Array.isArray(treasuryCheques) ? treasuryCheques : [];
  const safePurchaseOrders = Array.isArray(purchaseOrders) ? purchaseOrders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeSupplierPerformance = Array.isArray(supplierPerformance) ? supplierPerformance : [];
  const safeManufacturingOrders = Array.isArray(manufacturingOrders) ? manufacturingOrders : [];
  const safeImportFolders = Array.isArray(importFolders) ? importFolders : [];
  const safeLcRequests = Array.isArray(lcRequests) ? lcRequests : [];
  const safeFleetVehicles = Array.isArray(fleetVehicles) ? fleetVehicles : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeRequisitions = Array.isArray(requisitions) ? requisitions : [];
  const safeAbsences = Array.isArray(absences) ? absences : [];
  const safeSupportTickets = Array.isArray(supportTickets) ? supportTickets : [];
  const safeFleetMissions = Array.isArray(fleetMissions) ? fleetMissions : [];
  const safeTransferOrders = Array.isArray(cessionEntries) ? cessionEntries : [];
  
  const totalPosSalesTND = safeInvoices
    .filter((inv: any) => inv?.type === 'POS' || inv?.isPos)
    .reduce((sum, inv) => sum + (Number(inv?.amountTTC) || 0), 0) || 14200;

  // 1. Finance & Billings
  const totalHT = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.amountHT) || 0), 0);
  const totalTTC = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.amountTTC) || 0), 0);
  const totalCollected = safeInvoices
    .filter(inv => inv?.status === 'Paid')
    .reduce((sum, inv) => sum + (Number(inv?.amountNetToPay) || 0), 0);
  const unpaidInvoices = safeInvoices.filter(inv => inv?.status === 'Unpaid' || inv?.status === 'Debt_Collection');
  const totalOutstandingDebt = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv?.amountNetToPay) || 0), 0);
  const totalWithholdingTax = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.withholdingAmount) || 0), 0);
  const withholdingCertificatesReceivedCount = safeInvoices
    .filter(inv => (Number(inv?.withholdingAmount) || 0) > 0 && inv?.withholdingCertificateReceived)
    .length;
  const withholdingCertificatesTotalCount = safeInvoices.filter(inv => (Number(inv?.withholdingAmount) || 0) > 0).length;

  // Portfolio items
  const chequePortfolioTotal = safeTreasuryCheques
    .filter((c: any) => c?.status === 'En_Portefeuille')
    .reduce((sum: number, c: any) => sum + (Number(c?.amount) || 0), 0);

  // 2. Supply & Stocks
  const totalPurchasesHT = safePurchaseOrders.reduce((sum: number, po: any) => sum + (Number(po?.amountHT) || 0), 0);
  const totalProducts = safeProducts.length;
  const stockValuation = safeProducts.reduce((sum, p) => sum + ((Number(p?.stockLevel) || 0) * (Number(p?.costPrice) || 0)), 0);
  const criticalStockItems = safeProducts.filter(p => (Number(p?.stockLevel) || 0) <= (Number(p?.minStockLevel) || 0));
  const activeSuppliersCount = safeSupplierPerformance.length;
  const highDelaySuppliers = safeSupplierPerformance.filter((s: any) => (Number(s?.delayRate) || 0) > 15);

  // 3. Production & Logistique
  const totalOFs = safeManufacturingOrders.length;
  const completedOFs = safeManufacturingOrders.filter((mo: any) => mo?.status === 'Terminé' || mo?.status === 'Completed').length;
  const inProgressOFs = safeManufacturingOrders.filter((mo: any) => mo?.status === 'En cours' || mo?.status === 'In_Progress' || mo?.status === 'En_Cours').length;
  const totalUnitsPlanned = safeManufacturingOrders.reduce((sum: number, mo: any) => sum + (Number(mo?.quantityToProduce) || 0), 0);
  const totalUnitsProduced = safeManufacturingOrders.reduce((sum: number, mo: any) => sum + (Number(mo?.quantityProduced) || 0), 0);
  const totalUnitsScrapped = safeManufacturingOrders.reduce((sum: number, mo: any) => sum + (Number(mo?.quantityScrapped) || 0), 0);
  const overallYield = totalUnitsProduced > 0 
    ? Math.round(( (totalUnitsProduced - totalUnitsScrapped) / totalUnitsProduced) * 1000) / 10
    : 97.4;

  const activeTransitFolders = safeImportFolders.filter((f: any) => f?.status !== 'Terminé' && f?.status !== 'Received').length;
  const activeFleetVehicles = safeFleetVehicles.filter((v: any) => v?.status === 'Active').length;

  // 4. Human Capital
  const totalEmployees = safeEmployees.length;
  const monthlyPayrollSum = safeEmployees.reduce((sum: number, emp: any) => sum + (Number(emp?.baseSalary) || 0), 0);
  const activeContractsCount = safeContracts.filter((c: any) => c?.status === 'Active').length;

  // 5. CRM & Commitments
  const totalComplaintsCount = safeComplaints.length;
  const pendingComplaintsCount = safeComplaints.filter(c => c?.status !== 'Resolved').length;
  const complaintResolutionRate = totalComplaintsCount > 0 
    ? Math.round(((totalComplaintsCount - pendingComplaintsCount) / totalComplaintsCount) * 100) 
    : 100;

  let totalCommitments = 0;
  let metCommitments = 0;
  let delayedCommitments = 0;
  safeClients.forEach(c => {
    if (!c) return;
    (c.engagements || []).forEach(eng => {
      if (!eng) return;
      totalCommitments++;
      if (eng.status === 'Met') metCommitments++;
      if (eng.status === 'Delayed') delayedCommitments++;
    });
  });

  // --- RECHARTS PLOT DATA ---
  // Monthly Consolidated Revenues vs Purchases
  const chartRevenuesPurchases = [
    { month: 'Jan', Ventes: 45000, Achats: 32000, Rendement: 98.1 },
    { month: 'Féb', Ventes: 52000, Achats: 39500, Rendement: 97.5 },
    { month: 'Mar', Ventes: 49000, Achats: 35000, Rendement: 96.9 },
    { month: 'Avr', Ventes: 63000, Achats: 48000, Rendement: 98.4 },
    { month: 'Mai', Ventes: 58000, Achats: 42000, Rendement: 97.2 },
    { month: 'Juin', Ventes: Math.max(totalHT, 71000), Achats: Math.max(totalPurchasesHT, 51000), Rendement: overallYield }
  ];

  // Bank Cash Flow Distribution
  const bankDistribution = [
    { name: 'BIAT', value: 45000, color: '#1e3a8a' },
    { name: 'Amen Bank', value: 28000, color: '#047857' },
    { name: 'ATB', value: 15000, color: '#b45309' },
    { name: 'Portefeuille', value: chequePortfolioTotal || 21400, color: '#4f46e5' }
  ];

  // Supplier Scoring distribution
  const supplierScoringData = safeSupplierPerformance.map((s: any) => {
    const sName = s?.name || 'Fournisseur Inconnu';
    return {
      name: sName.split(' ')[0],
      Score: Number(s?.score) || 0,
      Retard: Number(s?.delayRate) || 0
    };
  });

  // Production Line Performance
  const prodLinePerformance = safeManufacturingOrders.map((mo: any) => ({
    id: mo?.id || 'OF-?',
    Produit: Number(mo?.quantityProduced) || 0,
    Rebut: Number(mo?.quantityScrapped) || 0,
    name: mo?.id || 'OF-?'
  }));


  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER WITH REALTIME INTEGRATION METRICS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md animate-pulse">
                Connecté • Elyssa ERP Suite
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                v4.5.1
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans mt-1">
              Tableau de Bord de Pilotage Décisionnel
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl font-medium leading-relaxed font-sans">
              Consolidation globale de vos opérations tunisiennes : facturation & fiscalité locale (FODEC/TVA), suivi d'inventaire, ordonnancement d'usine (OF), logistique d'import/export de Radès, trésorerie et capital humain.
            </p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl shrink-0 text-center md:text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">État des Interconnexions</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-left font-mono text-[10px] font-black">
              <span className="text-emerald-400">✓ CRM-Clients</span>
              <span className="text-emerald-400">✓ Finances/TVA</span>
              <span className="text-emerald-400">✓ Stocks/Achats</span>
              <span className="text-emerald-400">✓ Usine & Log</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -translate-y-8 translate-x-8"></div>
      </div>

      {/* SAAS / TRIAL ALERTS */}
      {(() => {
        if (licenseStatus === 'paid') return null;
        if (!trialState || !trialState.isTrial) return null;
        return (
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
            trialState.isExpired
              ? 'bg-red-50/95 border-red-200 text-slate-800'
              : 'bg-amber-50/95 border-amber-200 text-slate-800'
          }`}>
            <div className="space-y-1 font-sans">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${trialState.isExpired ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
                <strong className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {trialState.isExpired ? "PÉRIODE D'ESSAI EXPIRÉE 🛑" : "PÉRIODE D'ESSAI ERP ACTIVÉE ⏳"}
                </strong>
              </div>
              <p className="text-xs text-slate-600 leading-normal font-semibold max-w-3xl">
                {trialState.isExpired 
                  ? "Votre période d'évaluation est expirée. Commandez dès maintenant votre abonnement ou débloquez individuellement les modules Elyssa ERP pour conserver vos données."
                  : `Bénéficiez d'une intégration complète multi-modules. Votre entreprise dispose de toutes les fonctionnalités de haut niveau pendant la durée du test.`
                }
              </p>
            </div>
            <div className="shrink-0 flex items-center space-x-2">
              <span className="bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[10px] px-3 py-1 rounded-full font-black animate-pulse whitespace-nowrap shrink-0">
                ⏳ {trialTimeLeftStr || (`${trialState.daysLeft}j restant(s)`)}
              </span>
              <button
                onClick={() => setActiveTab('saas_config')}
                className="bg-indigo-600 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg cursor-pointer transition-all border-0 shadow-xs"
              >
                Abonnement ➔
              </button>
            </div>
          </div>
        );
      })()}

      {/* ERP INTERACTIVE MODULE SELECTOR BAR (TABS) */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
        {[
          { id: 'all', label: 'Synthèse ERP', icon: Layers, activeClass: 'border bg-indigo-50/90 text-indigo-900 border-indigo-200' },
          { id: 'finance', label: 'Finances & Fiscalité', icon: DollarSign, activeClass: 'border bg-emerald-50/90 text-emerald-900 border-emerald-200' },
          { id: 'treasury', label: 'Trésorerie & Banques', icon: Wallet, activeClass: 'border bg-amber-50/90 text-amber-900 border-amber-200' },
          { id: 'purchasing', label: 'Achats & Appro', icon: ShoppingCart, activeClass: 'border bg-teal-50/90 text-teal-900 border-teal-200' },
          { id: 'stocks', label: 'Stocks & Inventaires', icon: Package, activeClass: 'border bg-blue-50/90 text-blue-900 border-blue-200' },
          { id: 'production', label: 'Usine & OF', icon: Cpu, activeClass: 'border bg-rose-50/90 text-rose-900 border-rose-200' },
          { id: 'logistics', label: 'Transit & Flotte', icon: Ship, activeClass: 'border bg-cyan-50/90 text-cyan-900 border-cyan-200' },
          { id: 'human', label: 'RH, Paie & Pointage', icon: Users, activeClass: 'border bg-violet-50/90 text-violet-900 border-violet-200' },
          { id: 'commercial', label: 'Commercial & CRM', icon: Briefcase, activeClass: 'border bg-pink-50/90 text-pink-900 border-pink-200' },
          { id: 'strategic', label: 'Stratégie & Juridique', icon: Sparkles, activeClass: 'border bg-purple-50/90 text-purple-900 border-purple-200' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentDashboardTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentDashboardTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                isActive 
                  ? `${tab.activeClass} shadow-xs scale-[1.02]` 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? '' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <ExecutiveSummaryWidget 
          companyId={activeCompanyName} 
          isDemo={activeCompanyName === 'pc-parent-elyssa' || activeCompanyName === 'demo'} 
          onOpenChat={onOpenCopilot}
        />
        <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Dernières Factures (Contrôle IA)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium rounded-tl-lg">N° Facture</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium text-right">Montant (TTC)</th>
                  <th className="px-4 py-2 font-medium text-right">TVA</th>
                  <th className="px-4 py-2 font-medium text-right">FODEC 1%</th>
                  <th className="px-4 py-2 font-medium text-right rounded-tr-lg">Statut IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">F2026-0042</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Société Alpha SA</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">12,450.000 TND</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">19%</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">104.620 TND</td>
                  <td className="px-4 py-3 text-right">
                    <AnomalyBadge category="Finance" severity="high" title="Erreur FODEC potentielle" evidence="Le calcul du FODEC 1% semble incohérent par rapport à la base HT (devrait être 104.500)." />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">F2026-0043</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Beta Industries</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">8,300.000 TND</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">19%</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">69.750 TND</td>
                  <td className="px-4 py-3 text-right">
                    <AnomalyBadge category="Finance" severity="low" title="Facture conforme" evidence="Les calculs de TVA et FODEC sont corrects et correspondent à la norme." />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* DYNAMIC DASHBOARD ENGINE CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDashboardTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >

          {/* ========================================================= */}
          {/* TAB 1: ALL-MODULE ERP SYNTHESIS                           */}
          {/* ========================================================= */}
          {currentDashboardTab === 'all' && (
            <>
              {/* Dynamic Metrics Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Facturation Active (TND)</span>
                    <h3 className="text-xl font-black text-slate-850 font-mono">{formatTND(totalHT)}</h3>
                    <span className="text-[9px] text-indigo-650 font-semibold bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                      En attente: {formatTND(totalOutstandingDebt)}
                    </span>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Trésorerie Actifs</span>
                    <h3 className="text-xl font-black text-emerald-700 font-mono">{formatTND(totalCollected)}</h3>
                    <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                      Cheques: {formatTND(chequePortfolioTotal)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Valorisation de l'Inventaire</span>
                    <h3 className="text-xl font-black text-blue-700 font-mono">{formatTND(stockValuation || 82400)}</h3>
                    <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
                      {totalProducts} Références actives
                    </span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Masse Salariale / RH</span>
                    <h3 className="text-xl font-black text-amber-700 font-mono">{formatTND(monthlyPayrollSum)}</h3>
                    <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded">
                      {totalEmployees} Collaborateurs
                    </span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* EXECUTIVE INTER-MODULE RADAR & ALERTS (PHASE 3 CONSOLIDATION) */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <span>Radar Directorial Inter-Modules • Elyssa ERP</span>
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Vue consolidée en temps réel des flux croisés : Douane / Usine / Flotte / Paie / Trésorerie
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Phase 3 : Consolidation & Alertes
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Alert 1: Transit & Douane */}
                  <div 
                    onClick={() => setActiveTab('transit_logistique')}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5" />
                        <span>Transit & Douane</span>
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        safeImportFolders.filter((f: any) => f?.status === 'Customs').length > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {safeImportFolders.filter((f: any) => f?.status === 'Customs').length} En Douane
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold line-clamp-2">
                      {safeImportFolders.filter((f: any) => f?.status === 'Customs').length > 0
                        ? `${safeImportFolders.filter((f: any) => f?.status === 'Customs').length} dossier(s) en dédouanement au Port de Radès.`
                        : "Tous les dossiers d'importation sont dédouanés et en stock."}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9.5px] text-slate-400">
                      <span>Port de Radès / Sfax</span>
                      <span className="text-cyan-400 font-bold group-hover:underline">Gérer Transit →</span>
                    </div>
                  </div>

                  {/* Alert 2: Usine & OF */}
                  <div 
                    onClick={() => setActiveTab('production')}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Ordres de Production</span>
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        safeManufacturingOrders.filter((mo: any) => mo?.status === 'En attente Douane/Matières').length > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {safeManufacturingOrders.filter((mo: any) => mo?.status === 'En attente Douane/Matières').length} Bloqués Douane
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold line-clamp-2">
                      {safeManufacturingOrders.filter((mo: any) => mo?.status === 'En attente Douane/Matières').length > 0
                        ? `Attention : ${safeManufacturingOrders.filter((mo: any) => mo?.status === 'En attente Douane/Matières').length} OF en attente de dédouanement MP.`
                        : `${safeManufacturingOrders.filter((mo: any) => mo?.status === 'En cours').length} OF en cours de fabrication aux usines.`}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9.5px] text-slate-400">
                      <span>Calcul P.R.I Ventilé</span>
                      <span className="text-rose-400 font-bold group-hover:underline">Suivi Usine →</span>
                    </div>
                  </div>

                  {/* Alert 3: Flotte & Missions Paie */}
                  <div 
                    onClick={() => setActiveTab('fleet')}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Flotte & Missions RH</span>
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {safeFleetMissions.filter((m: any) => m?.status === 'En cours' || m?.status === 'In_Progress').length} Missions Actives
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold line-clamp-2">
                      {safeFleetMissions.filter((m: any) => m?.status === 'En cours').length} mission(s) chauffeur active(s) avec indemnités quotidiennes liées aux bulletins de paie.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9.5px] text-slate-400">
                      <span>Exonéré CNSS / IRPP</span>
                      <span className="text-amber-400 font-bold group-hover:underline">Ordres de Mission →</span>
                    </div>
                  </div>

                  {/* Alert 4: Trésorerie & Crédits Documentaires */}
                  <div 
                    onClick={() => setActiveTab('lc_manager')}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Trésorerie & Crédocs</span>
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {safeLcRequests.filter((l: any) => l?.status === 'Opened' || l?.status === 'Submitted').length} LC Actives
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold line-clamp-2">
                      Débouclage bancaire automatique lors de l'apurement des Crédits Documentaires SWIFT.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9.5px] text-slate-400">
                      <span>Compte BIAT / Amen / ATB</span>
                      <span className="text-emerald-400 font-bold group-hover:underline">Gestion LC →</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Graph & Quick Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Chart Area */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">Consolidation d'Activité Elyssa ERP</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Évolution mensuelle des Ventes vs Approvisionnements (Achats)</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      Devise : TND
                    </span>
                  </div>

                  <div className="h-64 font-sans text-[11px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartRevenuesPurchases}>
                        <defs>
                          <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAchats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <ChartTooltip formatter={(val) => [`${Number(val).toLocaleString('fr-TN')} DT`, '']} />
                        <ChartLegend />
                        <Area type="monotone" dataKey="Ventes" name="Chiffre d'Affaires" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentes)" />
                        <Area type="monotone" dataKey="Achats" name="Achats fournisseurs" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorAchats)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Operational Quick Metrics Grid */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Statistiques Opérationnelles</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Vue inter-services de l'entreprise</p>
                    </div>

                    <div className="space-y-3 font-semibold text-xs text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center space-x-2 text-slate-500">
                          <Cpu className="w-3.5 h-3.5 text-rose-500" />
                          <span>Ordres de Production (OF)</span>
                        </span>
                        <span className="font-black font-mono bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full text-[10px]">
                          {completedOFs}/{totalOFs} Clos
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center space-x-2 text-slate-500">
                          <Ship className="w-3.5 h-3.5 text-blue-500" />
                          <span>Transit & Douane en cours</span>
                        </span>
                        <span className="font-black font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px]">
                          {activeTransitFolders} Dossiers Radès
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center space-x-2 text-slate-500">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ruptures & Alerte Stock</span>
                        </span>
                        <span className={`font-black font-mono px-2 py-0.5 rounded-full text-[10px] ${
                          criticalStockItems.length > 0 
                            ? 'bg-rose-50 text-rose-700 border border-rose-150 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {criticalStockItems.length} Ref Critiques
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center space-x-2 text-slate-500">
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Taux de Rendement Usine</span>
                        </span>
                        <span className="font-black font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px]">
                          {overallYield}% Yield
                        </span>
                      </div>
                    </div>
                  </div>

                  {highDelaySuppliers.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-rose-900 text-[10px] leading-relaxed mt-4">
                      <div className="flex items-center space-x-1.5 font-black">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Alerte Fournisseurs Critiques ({highDelaySuppliers.length})</span>
                      </div>
                      <p className="font-medium text-rose-700 mt-1">
                        Certains de vos sous-traitants dépassent le taux réglementaire Elyssa ERP de 15% de retard. Une relance e-mail est fortement recommandée.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-900 text-[10px] leading-relaxed mt-4">
                      <div className="flex items-center space-x-1.5 font-black">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tous les indicateurs au vert</span>
                      </div>
                      <p className="font-medium text-emerald-700 mt-0.5">
                        L'approvisionnement global respecte les objectifs internes. Aucun retard critique constaté aujourd'hui.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enterprise quick operations panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-3">
                <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Accès Rapide Aux Modules Connectés</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  <button onClick={() => setActiveTab('billing')} className="p-3 text-left bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <CreditCard className="w-5 h-5 text-indigo-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Facturation</span>
                      <span className="text-[9px] text-slate-400">TVA & Retenues</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('stock')} className="p-3 text-left bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <Package className="w-5 h-5 text-blue-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Stocks & Flux</span>
                      <span className="text-[9px] text-slate-400">Niveaux de réserve</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('purchasing')} className="p-3 text-left bg-slate-50 hover:bg-teal-50/50 hover:border-teal-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <ShoppingCart className="w-5 h-5 text-teal-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Achats</span>
                      <span className="text-[9px] text-slate-400">Demandes & BC</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('production')} className="p-3 text-left bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <Cpu className="w-5 h-5 text-rose-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Usine/OF</span>
                      <span className="text-[9px] text-slate-400">Lignes d'extrusion</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('payroll')} className="p-3 text-left bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <Briefcase className="w-5 h-5 text-amber-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Paie & RH</span>
                      <span className="text-[9px] text-slate-400">Bulletins & CNSS</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('business_plan')} className="p-3 text-left bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <TrendingUp className="w-5 h-5 text-emerald-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Business Plan</span>
                      <span className="text-[9px] text-slate-400">Simulations 3 ans</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('juridique')} className="p-3 text-left bg-slate-50 hover:bg-violet-50/50 hover:border-violet-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <Building2 className="w-5 h-5 text-violet-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Juridique</span>
                      <span className="text-[9px] text-slate-400">PV AGO & Actes</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('portail_client')} className="p-3 text-left bg-slate-50 hover:bg-pink-50/50 hover:border-pink-200 border border-slate-100 rounded-xl text-xs transition cursor-pointer flex flex-col justify-between h-20 group">
                    <Users className="w-5 h-5 text-pink-650 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-black text-slate-800 block">Portail Client</span>
                      <span className="text-[9px] text-slate-400">Libre-Service</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FINANCE & FISCALITÉ VIEW                           */}
          {/* ========================================================= */}
          {currentDashboardTab === 'finance' && (
            <div className="space-y-6">
              {/* Financial KPI Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Facturation TTC Émise</span>
                  <h3 className="text-xl font-black text-slate-850 font-mono mt-1">{formatTND(totalTTC)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Base HT: {formatTND(totalHT)}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Total Encaissé / Caisse</span>
                  <h3 className="text-xl font-black text-emerald-700 font-mono mt-1">{formatTND(totalCollected)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Restant à collecter: {formatTND(totalOutstandingDebt)}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Certificats RS reçus</span>
                  <h3 className="text-xl font-black text-indigo-850 font-mono mt-1">
                    {withholdingCertificatesReceivedCount} / {withholdingCertificatesTotalCount}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-indigo-700 mt-2 font-bold font-mono">
                    <span>Retenu cumulé: {formatTND(totalWithholdingTax)}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Portefeuille Effets / Traites</span>
                  <h3 className="text-xl font-black text-amber-700 font-mono mt-1">{formatTND(chequePortfolioTotal || 21400)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-amber-600 mt-2 font-semibold">
                    <span>{treasuryCheques.length} Titres en cours</span>
                  </div>
                </div>
              </div>

              {/* Finance Dashboard charts & Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recharts Cash distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div>
                    <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Répartition de Trésorerie Actifs</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Répartition par banque de dépôt et portefeuille local (TND)</p>
                  </div>

                  <div className="h-48 flex items-center justify-center relative font-sans text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bankDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {bankDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(val) => [`${Number(val).toLocaleString('fr-TN')} TND`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">SOLDE TOTAL</span>
                      <span className="text-sm font-black text-slate-800 font-mono">{(totalCollected + chequePortfolioTotal).toLocaleString('fr-TN')} TND</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold">
                    {bankDistribution.map((bank, i) => (
                      <div key={i} className="flex items-center space-x-1.5 p-1 bg-slate-50 border border-slate-100 rounded-md">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank.color }}></span>
                        <span className="text-slate-600 truncate">{bank.name} :</span>
                        <span className="text-slate-800 ml-auto font-mono">{bank.value.toLocaleString('fr-TN')} TND</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outstanding Debts & late invoices */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Suivi du Recouvrement Critique</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Factures impayées ou en service contentieux nécessitant relance</p>
                      </div>
                      <button onClick={() => setActiveTab('billing')} className="text-[10px] font-black text-indigo-650 hover:underline">
                        Accéder au module facturation ➔
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {unpaidInvoices.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 font-semibold">Aucune facture en retard de paiement. Trésorerie excellente !</div>
                      ) : (
                        unpaidInvoices.map((inv) => (
                          <div key={inv.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-250 rounded-lg text-xs transition duration-150">
                            <div className="space-y-0.5">
                              <span className="font-black text-slate-800 font-mono">{inv.invoiceNumber}</span>
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold ml-2">TVA {inv.vatRate}%</span>
                              <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{inv.clientName}</p>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="font-black text-rose-700 font-mono block">{formatTND(inv.amountNetToPay)}</span>
                              <span className={`text-[9px] font-black uppercase ${inv.status === 'Debt_Collection' ? 'text-red-600' : 'text-amber-600'}`}>
                                {inv.status === 'Debt_Collection' ? '⚖ Contentieux' : '⏱ Impayé'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10.5px] font-bold text-slate-500">Taux global de recouvrement clients :</span>
                    <span className="font-black text-indigo-700 font-mono bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-xs">
                      {totalTTC > 0 ? Math.round((totalCollected / totalTTC) * 1000) / 10 : 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: TRÉSORERIE & BANQUES VIEW                          */}
          {/* ========================================================= */}
          {currentDashboardTab === 'treasury' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Portefeuille Chèques / Traites</span>
                  <h3 className="text-xl font-black text-amber-700 font-mono mt-1">{formatTND(chequePortfolioTotal || 21400)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-amber-600 mt-2 font-semibold">
                    <span>{treasuryCheques.length} Titres en coffre</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Solde Banques Total</span>
                  <h3 className="text-xl font-black text-emerald-700 font-mono mt-1">{formatTND(totalCollected)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-emerald-600 mt-2 font-semibold">
                    <span>Comptes Actifs BIAT / STB / UIB</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Créances Impayées</span>
                  <h3 className="text-xl font-black text-rose-600 font-mono mt-1">{formatTND(totalOutstandingDebt)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-rose-600 mt-2 font-semibold">
                    <span>{unpaidInvoices.length} Factures en retard</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Placements Bourse BVMT</span>
                  <h3 className="text-xl font-black text-indigo-700 font-mono mt-1">{formatTND(totalPortfolioValue)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-indigo-600 mt-2 font-semibold">
                    <span>Plus-value: {formatTND(unrealizedGain)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Répartition des Comptes Bancaires</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Comptes courants & coffre-fort Elyssa ERP</p>
                    </div>
                    <button onClick={() => setActiveTab('treasury')} className="text-[10px] font-black text-indigo-650 hover:underline">
                      Accéder au module trésorerie ➔
                    </button>
                  </div>
                  <div className="space-y-3 font-semibold text-xs">
                    {bankDistribution.map((bank, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }}></span>
                          <span className="text-slate-800 font-bold">{bank.name}</span>
                        </div>
                        <span className="font-mono text-indigo-700 font-black">{bank.value.toLocaleString('fr-TN')} TND</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Suivi des Échéances de Chèques & Effets</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Titres en portefeuille en attente d'encaissement</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {treasuryCheques.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucun chèque en attente.</div>
                    ) : (
                      treasuryCheques.map((ch: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                          <div>
                            <span className="font-black text-slate-800 block font-mono">{ch.reference || `CHQ-${1000 + idx}`}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{ch.issuer || 'Client ERP'} • {ch.bank || 'BIAT'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-amber-600 font-black block">{formatTND(Number(ch.amount) || 1200)}</span>
                            <span className="text-[9px] text-slate-400 font-bold">Échéance: {ch.dueDate || '30/06/2026'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: ACHATS & APPROVISIONNEMENTS VIEW                  */}
          {/* ========================================================= */}
          {(currentDashboardTab === 'purchasing' || (currentDashboardTab as any) === 'supply') && (
            <div className="space-y-6">
              {/* Purchasing KPI Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Engagements d'Achats Approbations</span>
                  <h3 className="text-xl font-black text-blue-850 font-mono mt-1">{formatTND(totalPurchasesHT)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Approuvés: {safePurchaseOrders.filter((po: any) => po?.status === 'Approuvé').length} BC</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Demandes d'Achat (DA)</span>
                  <h3 className="text-xl font-black text-teal-700 font-mono mt-1">{safeRequisitions.length} Demandes</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>En attente: {safeRequisitions.filter((da: any) => da?.status === 'En attente' || da?.status === 'Draft' || da?.status === 'Brouillon').length} DA</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Fournisseurs Référencés</span>
                  <h3 className="text-xl font-black text-indigo-850 font-mono mt-1">{activeSuppliersCount} Partenaires</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Retards élevés (&gt;15%): {highDelaySuppliers.length}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Taxe FODEC & Taxe Écologique</span>
                  <h3 className="text-xl font-black text-emerald-800 font-mono mt-1">Conforme 1%</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Calculé auto sur fiches d'achats</span>
                  </div>
                </div>
              </div>

              {/* Supplier performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div>
                    <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Audit & Scoring des Fournisseurs</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Score d'évaluation de la qualité et des délais de livraison</p>
                  </div>
                  <div className="h-52 font-sans text-[11px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supplierScoringData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis max={100} stroke="#94a3b8" />
                        <ChartTooltip />
                        <Bar dataKey="Score" name="Note d'évaluation (/100)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Retard" name="Taux de retard (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Dernières Demandes d'Achat (DA)</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Demandes d'approvisionnement des départements usine & bureau</p>
                    </div>
                    <button onClick={() => setActiveTab('purchasing')} className="text-[10px] font-black text-teal-600 hover:underline">Accéder au module acha ➔</button>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {safeRequisitions.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucune demande d'achat récente.</div>
                    ) : (
                      safeRequisitions.map((da: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                          <div>
                            <span className="font-black text-slate-800 block">{da.reqNumber || `DA-${202600 + idx}`}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{da.department || 'Production'} • Émetteur: {da.requester || 'Resp. Usine'}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${da.status === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {da.status || 'En attente'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: STOCKS & INVENTAIRES VIEW                          */}
          {/* ========================================================= */}
          {currentDashboardTab === 'stocks' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Valorisation Totale du Stock</span>
                  <h3 className="text-xl font-black text-blue-700 font-mono mt-1">{formatTND(stockValuation || 82400)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>{totalProducts} Références gérées</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Références sous Seuil Alerte</span>
                  <h3 className={`text-xl font-black font-mono mt-1 ${criticalStockItems.length > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                    {criticalStockItems.length} Références
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Reconstitution recommandée</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Cessions Inter-Unités</span>
                  <h3 className="text-xl font-black text-indigo-700 font-mono mt-1">{safeTransferOrders.length} Transferts</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Virements d'entrepôt actifs</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Entrepôts & Sitos</span>
                  <h3 className="text-xl font-black text-teal-700 font-mono mt-1">3 Dépôts</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Tunis, Sfax, Radès</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Fiches de Stock Critiques</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Matières premières ou produits finis sous le seuil de sécurité</p>
                  </div>
                  <button onClick={() => setActiveTab('stock')} className="text-[10px] font-black text-blue-600 hover:underline">
                    Gérer le stock ➔
                  </button>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {criticalStockItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucun produit sous le seuil d'alerte.</div>
                  ) : (
                    criticalStockItems.map((prod) => (
                      <div key={prod.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                        <div>
                          <span className="font-black text-slate-800 block">{prod.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold">{prod.category} • SKU: {prod.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-rose-600 block font-black">Stock: {prod.stockLevel} {prod.unit}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold">Seuil sécurité: &lt;= {prod.minStockLevel} {prod.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: USINE & LOGISTIQUE VIEW                            */}
          {/* ========================================================= */}
          {currentDashboardTab === 'production' && (
            <div className="space-y-6">
              {/* Production KPI Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Ordres de Fabrication (OF)</span>
                  <h3 className="text-xl font-black text-rose-800 font-mono mt-1">{totalOFs} Lancés</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>En cours: {inProgressOFs} OF</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Volume Produit Usine</span>
                  <h3 className="text-xl font-black text-indigo-700 font-mono mt-1">{(totalUnitsProduced || 5850).toLocaleString('fr-TN')} Unités</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Niveau de rebuts: {totalUnitsScrapped || 165} unités</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Dossiers Transit maritime Radès</span>
                  <h3 className="text-xl font-black text-blue-800 font-mono mt-1">{safeImportFolders.length} Dossiers</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>En Douane: {safeImportFolders.filter((f: any) => f?.status === 'Customs').length}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Parc Véhicules & Missions</span>
                  <h3 className="text-xl font-black text-teal-800 font-mono mt-1">{safeFleetVehicles.length} Véhicules</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Missions en cours: {safeFleetMissions.filter((m: any) => m?.status === 'En cours').length}</span>
                  </div>
                </div>
              </div>

              {/* Production and Transit widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recharts production yield per line */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div>
                    <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Rapport d'Ordonnancement Usine</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Volume produit vs rebuts par Ordre de Fabrication (OF)</p>
                  </div>

                  <div className="h-52 font-sans text-[11px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prodLinePerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="id" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <ChartTooltip />
                        <Bar dataKey="Produit" name="Volume Produit" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Rebut" name="Rebuts constatés" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Transit & Maritime customs progress */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Statut Logistique & Douane (Port de Radès)</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Suivi des dossiers de transit import-export de marchandises Elyssa ERP</p>
                      </div>
                      <button onClick={() => setActiveTab('transit_logistique')} className="text-[10px] font-black text-indigo-650 hover:underline">
                        Détails transit ➔
                      </button>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {safeImportFolders.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 font-semibold">Aucune marchandise maritime ou terrestre en cours de transit.</div>
                      ) : (
                        safeImportFolders.map((fold) => (
                          <div key={fold.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 hover:border-slate-250 rounded-lg text-xs transition duration-150">
                            <div className="space-y-0.5">
                              <span className="font-black text-slate-800 font-mono">{fold.reference}</span>
                              <span className={`text-[8.5px] font-black uppercase px-2 py-0.2 rounded border ml-2 ${
                                fold.folderType === 'Import' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {fold.folderType}
                              </span>
                              <p className="text-[10px] text-slate-400 font-bold">Fournisseur: {fold.supplierName} • Port: {fold.portOfArrival}</p>
                            </div>
                            <div className="text-right space-y-0.5 font-semibold">
                              <span className={`text-[10px] font-black uppercase ${
                                fold.status === 'Customs' 
                                  ? 'text-rose-600 animate-pulse' 
                                  : fold.status === 'Transit' 
                                  ? 'text-blue-600' 
                                  : 'text-slate-600'
                              }`}>
                                {fold.status === 'Customs' ? '⚓ En Douane' : '🚚 En Transit'}
                              </span>
                              <p className="text-[9px] text-slate-400 font-bold">Livraison estimée : {fold.estimatedArrivalDate}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Taux moyen de conformité et rendement usine :</span>
                    <span className="font-black text-rose-700 font-mono bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                      {overallYield}% rendement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: TRANSIT & FLOTTE LOGISTIQUE VIEW                  */}
          {/* ========================================================= */}
          {currentDashboardTab === 'logistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Dossiers Transit Port Radès</span>
                  <h3 className="text-xl font-black text-blue-800 font-mono mt-1">{safeImportFolders.length} Dossiers</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>En Douane: {safeImportFolders.filter((f: any) => f?.status === 'Customs').length} dossiers</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Engagement Crédocs (L/C)</span>
                  <h3 className="text-xl font-black text-cyan-800 font-mono mt-1">{formatTND(totalLcsValueTND)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>{activeLcsCount} Lettres de crédit en cours</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Parc Véhicules Flotte</span>
                  <h3 className="text-xl font-black text-teal-800 font-mono mt-1">{safeFleetVehicles.length} Véhicules</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Missions actives: {safeFleetMissions.filter((m: any) => m?.status === 'En cours').length}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Consommation Carburant</span>
                  <h3 className="text-xl font-black text-amber-700 font-mono mt-1">Conforme</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Suivi des cartes Agil / Total</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Dossiers Transit Maritime (Radès)</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Procédures de dédouanement et connaissements BL</p>
                    </div>
                    <button onClick={() => setActiveTab('transit_logistique')} className="text-[10px] font-black text-indigo-650 hover:underline">
                      Détails transit ➔
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {safeImportFolders.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucun dossier de transit actif.</div>
                    ) : (
                      safeImportFolders.map((fold) => (
                        <div key={fold.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                          <div>
                            <span className="font-black text-slate-800 font-mono">{fold.reference}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold block">{fold.supplierName} • Port: {fold.portOfArrival}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9.5px] font-black uppercase ${fold.status === 'Customs' ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`}>
                              {fold.status === 'Customs' ? '⚓ En Douane' : '🚚 En Transit'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Suivi de la Flotte & Missions Chauffeurs</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Missions de livraison inter-unités et clients</p>
                    </div>
                    <button onClick={() => setActiveTab('fleet')} className="text-[10px] font-black text-teal-600 hover:underline">
                      Accéder au parc ➔
                    </button>
                  </div>
                  <div className="space-y-3 font-semibold text-xs">
                    {safeFleetMissions.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucune mission en cours.</div>
                    ) : (
                      safeFleetMissions.map((mission: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <div>
                            <span className="font-black text-slate-800 block">{mission.title || `Mission #${101 + idx}`}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">Chauffeur: {mission.driverName || 'Inconnu'} • {mission.vehiclePlate || 'Immat TND'}</span>
                          </div>
                          <span className="text-[9.5px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                            {mission.status || 'En cours'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: HUMAN CAPITAL & SUPPORT                            */}
          {/* ========================================================= */}
          {currentDashboardTab === 'human' && (
            <div className="space-y-6">
              {/* HR KPI Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Collaborateurs RH Actifs</span>
                  <h3 className="text-xl font-black text-amber-800 font-mono mt-1">{totalEmployees} Employés</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Missions logistiques: {safeFleetMissions.length} chauffeurs</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Masse Salariale Brute</span>
                  <h3 className="text-xl font-black text-slate-850 font-mono mt-1">{formatTND(monthlyPayrollSum)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Contrats enregistrés: {activeContractsCount}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Absences du mois en cours</span>
                  <h3 className="text-xl font-black text-indigo-700 font-mono mt-1">{safeAbsences.length} Collaborateurs</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Absence cumulée: {safeAbsences.reduce((sum: number, a: any) => sum + (Number(a?.duration) || 0), 0)} jours</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Litiges ou Tickets Internes</span>
                  <h3 className="text-xl font-black text-teal-800 font-mono mt-1">{safeSupportTickets.filter((t: any) => t?.status !== 'Résolu' && t?.status !== 'Resolved').length} Tickets</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Total tickets traités: {safeSupportTickets.length}</span>
                  </div>
                </div>
              </div>

              {/* Employee list & interdepartment support */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Contract distribution or simple HR stats */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div>
                    <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Répartition des types de contrats</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Réglementation tunisienne du travail Elyssa ERP</p>
                  </div>

                  <div className="space-y-3 font-semibold text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600">CDI (Contrat à Durée Indéterminée)</span>
                      <span className="font-black font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                        {contracts.filter((c: any) => c.type === 'CDI').length || 4} fiches
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600">CDD (Contrat à Durée Déterminée)</span>
                      <span className="font-black font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px]">
                        {safeContracts.filter((c: any) => c?.type === 'CDD').length || 2} fiches
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600">CIVP (Contrat d'Initiation à la Vie Pro)</span>
                      <span className="font-black font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">
                        {safeContracts.filter((c: any) => c?.type === 'CIVP').length || 2} fiches
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-900 text-[10px] leading-relaxed">
                    <span className="font-black block">💡 Conseil d'optimisation RH</span>
                    <p className="font-medium text-amber-700 mt-1">
                      Privilégiez les contrats CIVP pour bénéficier des exonérations de charges patronales CNSS prévues par la législation tunisienne en vigueur.
                    </p>
                  </div>
                </div>

                {/* Support and communication logs */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Registre des Demandes & Support Inter-Services</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Tickets ouverts par vos collaborateurs pour la logistique, qualité ou production</p>
                      </div>
                      <button onClick={() => setActiveTab('collaborators')} className="text-[10px] font-black text-indigo-650 hover:underline">
                        Communication Hub ➔
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {safeSupportTickets.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 font-semibold">Aucun ticket interne ouvert actuellement.</div>
                      ) : (
                        safeSupportTickets.map((ticket) => (
                          <div key={ticket.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-250 rounded-lg text-xs transition duration-150">
                            <div className="space-y-0.5">
                              <span className="font-black text-slate-800">{ticket.subject}</span>
                              <span className={`text-[8.5px] font-black uppercase px-2 py-0.2 rounded border ml-2 ${
                                ticket.urgency === 'Haute' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {ticket.urgency}
                              </span>
                              <p className="text-[10px] text-slate-400 font-bold">Département émetteur : {ticket.department}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                ticket.status === 'Résolu' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {ticket.status === 'Résolu' ? '✓ Résolu' : '⏱ En cours'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Masse salariale totale brute par mois :</span>
                    <span className="font-black text-indigo-700 font-mono bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                      {formatTND(monthlyPayrollSum)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: COMMERCIAL & CLIENTS CRM VIEW                       */}
          {/* ========================================================= */}
          {currentDashboardTab === 'commercial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Portefeuille Clients Actifs</span>
                  <h3 className="text-xl font-black text-indigo-800 font-mono mt-1">{safeClients.length} Clients</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Partenaires B2B & Particuliers</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Ventes Caisse POS</span>
                  <h3 className="text-xl font-black text-emerald-700 font-mono mt-1">{formatTND(totalPosSalesTND || 14200)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Encaissements au comptoir</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Devis & Propositions en Attente</span>
                  <h3 className="text-xl font-black text-amber-700 font-mono mt-1">{safeInvoices.filter((i: any) => i?.status === 'Draft' || i?.status === 'Brouillon').length} Devis</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Négociations commerciales</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Réclamations & SAV Client</span>
                  <h3 className="text-xl font-black text-rose-600 font-mono mt-1">
                    {safeSupportTickets.filter((t: any) => t?.category === 'Client' && t?.status !== 'Résolu').length} En cours
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Temps moyen de réponse: &lt; 24h</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Top Clients & Volume d'Affaires</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Répartition du chiffre d'affaires Elyssa ERP</p>
                    </div>
                    <button onClick={() => setActiveTab('clients')} className="text-[10px] font-black text-indigo-650 hover:underline">
                      Gestion clients ➔
                    </button>
                  </div>
                  <div className="space-y-3 font-semibold text-xs">
                    {safeClients.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-semibold">Aucun client enregistré.</div>
                    ) : (
                      safeClients.slice(0, 5).map((cli: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <div>
                            <span className="font-black text-slate-800 block">{cli.name || `Client B2B #${idx + 1}`}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">Matricule Fiscal: {cli.taxId || 'MF-1029384/A'}</span>
                          </div>
                          <span className="font-mono text-emerald-700 font-black">{formatTND(cli.totalRevenue || (12000 - idx * 1500))}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight">Accès Portail Client & Extranet</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Téléchargement libre des factures signées et relevés de compte</p>
                    </div>
                    <button onClick={() => setActiveTab('portail_client')} className="text-[10px] font-black text-teal-600 hover:underline">
                      Portail client ➔
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center space-x-3 text-slate-700">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">🔑</span>
                      <div>
                        <span className="font-black block">Espace Extranet sécurisé</span>
                        <p className="text-[10px] text-slate-500 font-medium">Vos clients peuvent se connecter en toute autonomie pour régler leurs factures en ligne et télécharger leurs attestations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: STRATEGIC OPERATIONS & MODULE WIDGETS             */}
          {/* ========================================================= */}
          {currentDashboardTab === 'strategic' && (
            <div className="space-y-6">
              {/* Strategic KPI Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">VNC Active des Immobilisations</span>
                  <h3 className="text-xl font-black text-indigo-700 font-mono mt-1">{formatTND(totalNetBookValue)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>Brut: {formatTND(totalAssetsValueHT)}</span>
                    <span>Amorti: {formatTND(totalAccumulatedAmortization)}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Engagement Crédoc (L/C Import)</span>
                  <h3 className="text-xl font-black text-blue-800 font-mono mt-1">{formatTND(totalLcsValueTND)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>{activeLcsCount} Lettre(s) de crédit active(s)</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Évaluation de Cession M&A</span>
                  <h3 className="text-xl font-black text-violet-800 font-mono mt-1">{formatTND(cessionMaxValuation)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span>{activeCessionCount} Procédures & Audits actifs</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-450 uppercase block">Valeur Portefeuille Bourse (BVMT)</span>
                  <h3 className="text-xl font-black text-emerald-800 font-mono mt-1">{formatTND(totalPortfolioValue)}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-semibold">
                    <span className={unrealizedGain >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                      Plus-value : {unrealizedGain >= 0 ? '+' : ''}{formatTND(unrealizedGain)} ({unrealizedGainPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Nouveaux Widgets en Grille */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* WIDGET 1: IMMOBILISATIONS & AMORTISSEMENTS */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        Amortissements & Registre d'Immobilisations
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Valeur Nette Comptable (VNC) et Amortissements cumulés</p>
                    </div>
                    <button onClick={() => setActiveTab('asset')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Actifs ➔
                    </button>
                  </div>

                  <div className="space-y-4">
                    {assetsCalculated.map((asset) => {
                      const initialValue = Number(asset?.initialValue) || 1;
                      const pctAmortized = Math.round(((asset?.accumulated || 0) / initialValue) * 100) || 0;
                      return (
                        <div key={asset?.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-black text-slate-850 text-xs block">{asset?.name || 'Immobilisation'}</span>
                              <span className="text-[9.5px] text-slate-450 font-semibold">{asset?.category || 'Catégorie'} • {asset?.location || 'Localisation'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs font-black text-indigo-700 block">{formatTND(Number(asset?.bookValue) || 0)} VNC</span>
                              <span className="text-[9.5px] text-slate-400 font-bold">Achat: {asset?.purchaseDate || 'Date inconnue'}</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar of Amortization */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black text-slate-450">
                              <span>Acquisition: {formatTND(Number(asset?.initialValue) || 0)} HT</span>
                              <span>Amorti à {pctAmortized}% ({formatTND(Number(asset?.accumulated) || 0)})</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-2.5 rounded-full" 
                                style={{ width: `${pctAmortized}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WIDGET 2: LETTRES DE CRÉDIT (CRÉDOC) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Lettres de Crédit (Crédoc Import)
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Sécurisation des paiements maritimes internationaux</p>
                    </div>
                    <button onClick={() => setActiveTab('lc_manager')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Crédocs ➔
                    </button>
                  </div>

                  <div className="space-y-4">
                    {safeLcs.map((lc) => (
                      <div key={lc?.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-slate-850 text-xs block font-mono">{lc?.lcReference || 'Réf Inconnue'}</span>
                            <span className="text-[9.5px] text-slate-450 font-semibold">Émetteur: {lc?.issuingBank || 'Non spécifiée'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-blue-700 block">{(Number(lc?.amount) || 0).toLocaleString('fr-TN')} {lc?.currency || 'TND'}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">~ {formatTND((Number(lc?.amount) || 0) * (lc?.currency === 'EUR' ? 3.35 : lc?.currency === 'USD' ? 3.10 : 1.0))}</span>
                          </div>
                        </div>

                        {/* Step checklist for L/C life cycle */}
                        <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
                          <div className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                            1. Création ✓
                          </div>
                          <div className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                            2. Validation ✓
                          </div>
                          <div className="p-1 bg-blue-50 text-blue-700 border border-blue-100 rounded animate-pulse">
                            3. Présentation
                          </div>
                          <div className="p-1 bg-slate-100 text-slate-450 border border-slate-150 rounded">
                            4. Règlement
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-900 text-[10px] leading-relaxed">
                      <span className="font-black block">💡 Règle de conformité maritime</span>
                      <p className="font-medium text-blue-700 mt-1">
                        Les crédocs nécessitent le dépôt du connaissement maritime (Bill of Lading) et de la facture commerciale certifiée à la douane du Port de Radès.
                      </p>
                    </div>
                  </div>
                </div>

                {/* WIDGET 3: AUDIT & CESSION D'ENTREPRISE */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-violet-600" />
                        Audit Stratégique & Cession M&A
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Valorisation d'entreprise et maintien de la conformité légale</p>
                    </div>
                    <button onClick={() => setActiveTab('cession')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Cession ➔
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {safeCessionFiles.map((file) => {
                      const title = file?.title || file?.productName || 'Fichier de Cession';
                      const author = file?.authorName ? `Auteur : ${file.authorName}` : file?.senderUnit ? `De : ${file.senderUnit}` : 'Inconnu';
                      const categoryLabel = file?.category ? ` • ${file.category}` : file?.productName ? ` • ${file.productName}` : '';
                      const impact = Number(file?.financialImpact || file?.valueAmount) || 0;
                      const statusVal = file?.status || 'Nouveau';
                      return (
                        <div key={file?.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs hover:bg-slate-100 transition duration-150 flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-800 block">{title}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{author}{categoryLabel}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                              statusVal === 'Approuvé' || statusVal === 'Complété' || statusVal === 'Terminé'
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {statusVal}
                            </span>
                            {impact !== 0 && (
                              <span className="block text-[10px] font-mono font-black text-indigo-700 mt-0.5">
                                {impact > 0 ? '+' : ''}{formatTND(impact)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WIDGET 4: PLACEMENTS & PORTEFEUILLE BOURSE */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        Gestion de Portefeuille & Placements BVMT
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Investissements de trésorerie sur les valeurs mobilières</p>
                    </div>
                    <button onClick={() => setActiveTab('investment')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Bourse ➔
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      {Object.entries(safePortfolioInvestments).map(([ticker, data]: [string, any]) => {
                        if (!data) return null;
                        const quote = stockQuotes.find(q => q.ticker === ticker);
                        const avgPrice = Number(data.avgCostPrice) || 0;
                        const qty = Number(data.quantity) || 0;
                        const curPrice = quote ? quote.price : avgPrice;
                        const gain = (curPrice - avgPrice) * qty;
                        const pct = avgPrice > 0 ? (((curPrice - avgPrice) / avgPrice) * 100) : 0;
                        return (
                          <div key={ticker} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                            <div>
                              <span className="font-black font-mono text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded text-[10px] mr-1">{ticker}</span>
                              <span className="font-bold text-slate-500">{qty} actions</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs font-black block">{formatTND(qty * curPrice)}</span>
                              <span className={`text-[9.5px] font-bold ${gain >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {gain >= 0 ? '▲ +' : '▼ '}{pct.toFixed(1)}% ({formatTND(gain)})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-800">Rendement global latent des placements :</span>
                      <span className="text-xs font-black font-mono text-emerald-700 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {unrealizedGainPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* WIDGET 5: BUSINESS PLAN STRATÉGIQUE */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Business Plan & Seuil de Rentabilité
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Modélisations financières pluriannuelles et seuil de viabilité</p>
                    </div>
                    <button onClick={() => setActiveTab('business_plan')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Simulations ➔
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-450 uppercase block">Chiffre d'Affaires N+1</span>
                        <span className="font-mono text-sm font-black text-slate-800">350 000 DT</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-450 uppercase block">Croissance Annuelle</span>
                        <span className="font-mono text-sm font-black text-emerald-650">+25.0% / an</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Seuil de Rentabilité (Point Mort)</span>
                        <span className="font-mono text-slate-800">210 000 DT</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                        <span>Actuel: {formatTND(totalHT)} HT</span>
                        <span>Seuil: 210 000 DT</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-900 text-[10px] leading-relaxed">
                      <span className="font-black block">💡 Analyse du Plan de Financement</span>
                      <p className="font-medium text-emerald-700 mt-0.5">
                        Fonds propres à hauteur de 65 000 DT et concours bancaires de 60 000 DT prévus pour couvrir les investissements de départ (168 000 DT).
                      </p>
                    </div>
                  </div>
                </div>

                {/* WIDGET 6: SECRÉTARIAT JURIDIQUE & ASSEMBLÉES */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-violet-600" />
                        Secrétariat Juridique & Actes de Gouvernance
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Rédaction automatisée de PV d'AGO, statuts de SARL et conventions</p>
                    </div>
                    <button onClick={() => setActiveTab('juridique')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Actes ➔
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                      <span className="text-[10px] font-black text-slate-800 block">Dernier Procès-Verbal Généré :</span>
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          PV d'AGO d'Approbation des Comptes
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">30/06/2026</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600">
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 uppercase block">Registre Associés</span>
                        <span className="text-slate-800 block mt-0.5">Zied Ben Miled (55%)</span>
                        <span className="text-slate-500 font-medium">Fatma Dridi (35%)</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 uppercase block">Echéances Légales</span>
                        <span className="text-indigo-650 block mt-0.5">AGO d'Approbation</span>
                        <span className="text-slate-500 font-medium">Prévue sous 6 mois</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-lg text-violet-900 text-[10px] leading-relaxed flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                      <span className="font-semibold text-violet-750">3 documents d'actes certifiés et archivés dans le coffre-fort numérique.</span>
                    </div>
                  </div>
                </div>

                {/* WIDGET 7: PORTAIL CLIENT LIBRE-SERVICE */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-pink-600" />
                        Portail Client Extérieur & Espace Libre-Service
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold">Espace de confiance pour le téléchargement d'actes et de factures</p>
                    </div>
                    <button onClick={() => setActiveTab('portail_client')} className="text-[10.5px] font-black text-indigo-650 hover:underline">
                      Portail ➔
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold">
                      <span className="text-slate-650">Personnalisation de la marque</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-black px-2 py-0.5 rounded-full">
                        Thème Émeraude
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2 text-[10px] font-bold text-slate-650">
                      <div className="flex justify-between">
                        <span>Support client dédié :</span>
                        <span className="font-mono text-indigo-650">compta@elyssa-erp.tn</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Libre-service documents (GED) :</span>
                        <span className="text-emerald-600 font-bold">Activé ✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dépôt de réclamations :</span>
                        <span className="text-emerald-600 font-bold">Activé ✓</span>
                      </div>
                    </div>

                    <div className="bg-pink-50 border border-pink-100 p-2.5 rounded-lg text-pink-900 text-[10px] leading-relaxed">
                      <span className="font-black block">🔗 Invitation "Lien Magique"</span>
                      <p className="font-medium text-pink-700 mt-0.5">
                        Les clients de votre CRM reçoivent un lien d'accès sécurisé pour consulter leurs factures en retard et téléverser des justificatifs de retenue d'impôt.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
