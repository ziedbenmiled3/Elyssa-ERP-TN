/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  PlusCircle,
  Filter,
  Search,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  Briefcase,
  FileText,
  UserCheck,
  Shield,
  HelpCircle,
  FileSignature,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { CessionEntry, UserSession } from '../types';
import { AUTOMATED_SYSTEM_SAMPLES, createAutoAuditEntry } from '../utils/auditLogger';

interface CessionManagerProps {
  currentUser: UserSession | null;
  isSimulationActive?: boolean;
  entries?: CessionEntry[];
  onUpdateEntries?: (entries: CessionEntry[]) => void;
  isDemoCompany?: boolean;
}

// Pre-populated realistic Tunisian corporate cession records
const INITIAL_CESSION_ENTRIES: CessionEntry[] = [];

export function CessionManager({ 
  currentUser, 
  isSimulationActive,
  entries: propEntries = [],
  onUpdateEntries = () => {},
  isDemoCompany = false
}: CessionManagerProps) {
  const SkeletonLoader = () => (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
      <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  );

  const [isHydrated, setIsHydrated] = useState(false);
  const [localData, setLocalData] = useState<CessionEntry[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('elyssa_cession_entries');
    if (cached) {
      try { 
        setLocalData(JSON.parse(cached)); 
      } catch (e) { 
        console.error(e); 
      }
    } else {
      setLocalData([]);
    }
    setIsHydrated(true);
  }, []);

  const entriesList = propEntries.length > 0 ? propEntries : localData;
  const setEntries = (val: any) => {
    const newVal = typeof val === 'function' ? val(entriesList) : val;
    setLocalData(newVal);
    onUpdateEntries(newVal);
    try {
      localStorage.setItem('elyssa_cession_entries', JSON.stringify(newVal));
    } catch (e) {
      console.error(e);
    }
  };

  const entries = entriesList;

  // Notification & Origin Filter States
  const [simulationNotification, setSimulationNotification] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<'all' | 'auto' | 'manual'>('all');

  // Handler to simulate new automatic actions from system activity
  const handleSimulateAutoBatch = () => {
    const randomSamples = [...AUTOMATED_SYSTEM_SAMPLES].sort(() => 0.5 - Math.random()).slice(0, 4);
    const newAutoEntries = randomSamples.map(sample => createAutoAuditEntry(sample));
    setEntries(prev => [...newAutoEntries, ...prev]);
    setSimulationNotification(`⚡ ${newAutoEntries.length} nouvelles opérations collaborateurs (Finances, RH, Usine, Transit) interceptées et consignées automatiquement !`);
    setTimeout(() => setSimulationNotification(null), 5000);
  };

  // Form states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CessionEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<CessionEntry | null>(null);

  // New/Edit entry fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'Evaluation',
    direction: 'Direction Générale',
    authorName: currentUser?.name || 'Utilisateur Elyssa',
    authorRole: currentUser?.role === 'Manager' || currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Director' ? 'Dirigeant' : 'Collaborateur',
    financialImpact: '',
    description: '',
    status: 'Brouillon',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  });

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'day' | 'range'>('all');
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  const [filterDirection, setFilterDirection] = useState<string>('Toutes');
  const [filterAuthorRole, setFilterAuthorRole] = useState<'Toutes' | 'Dirigeant' | 'Collaborateur'>('Toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Scrolling States
  const [viewMode, setViewMode] = useState<'pagination' | 'scroll'>('pagination');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Dropdown options
  const DIRECTIONS = [
    'Direction Générale',
    'Direction Financière',
    'Direction Juridique',
    'Direction RH',
    'Direction Commerciale',
    'Direction Technique'
  ];

  const CATEGORIES = [
    'Evaluation',
    'Juridique',
    'Comptabilité',
    'Audit',
    'Ressources Humaines',
    'Négociation',
    'Fiscal',
    'Autre'
  ];

  const STATUSES = ['Brouillon', 'Soumis', 'Approuvé', 'Complété'];

  // Handle open add form
  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'Evaluation',
      direction: 'Direction Générale',
      authorName: currentUser?.name || 'Utilisateur Elyssa',
      authorRole: currentUser?.role === 'Manager' || currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Director' ? 'Dirigeant' : 'Collaborateur',
      financialImpact: '',
      description: '',
      status: 'Brouillon',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    setEditingEntry(null);
    setIsAddingNew(true);
  };

  // Handle open edit
  const handleOpenEdit = (entry: CessionEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      category: entry.category,
      direction: entry.direction,
      authorName: entry.authorName,
      authorRole: entry.authorRole,
      financialImpact: entry.financialImpact !== undefined ? entry.financialImpact.toString() : '',
      description: entry.description,
      status: entry.status,
      date: entry.date,
      time: entry.time
    });
    setIsAddingNew(true);
    if (detailEntry) {
      setDetailEntry(null);
    }
  };

  // Handle Submit (Create/Update Exception Manual Entry)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Veuillez remplir le titre et la description de la saisie.");
      return;
    }

    const cleanEntry: CessionEntry = {
      id: editingEntry ? editingEntry.id : `cess-${Date.now()}`,
      title: formData.title,
      category: formData.category as any,
      direction: formData.direction as any,
      authorName: formData.authorName,
      authorRole: formData.authorRole as any,
      financialImpact: formData.financialImpact ? parseFloat(formData.financialImpact) : 0,
      description: formData.description,
      status: formData.status as any,
      date: formData.date,
      time: formData.time,
      attachmentsCount: editingEntry?.attachmentsCount || 0,
      isAutomatic: editingEntry ? editingEntry.isAutomatic : false,
      sourceModule: 'Saisie d\'Ajustement Manuel'
    };

    if (editingEntry) {
      setEntries(prev => prev.map(item => item.id === editingEntry.id ? cleanEntry : item));
    } else {
      setEntries(prev => [cleanEntry, ...prev]);
    }

    setIsAddingNew(false);
    setEditingEntry(null);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette saisie d'audit de cession ?")) {
      setEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return (entries || []).filter(entry => {
      if (!entry) return false;
      // 1. Origin Filter (Automatique vs Manuel)
      const isAuto = entry.isAutomatic || (entry.id || '').startsWith('auto-') || (entry.title || '').startsWith('Saisie automatique');
      if (originFilter === 'auto' && !isAuto) return false;
      if (originFilter === 'manual' && isAuto) return false;

      // 2. Date filters
      if (filterType === 'day') {
        if (entry.date !== singleDate) return false;
      } else if (filterType === 'range') {
        if ((entry.date || '') < startDate || (entry.date || '') > endDate) return false;
      }

      // 3. Direction filter
      if (filterDirection !== 'Toutes') {
        if (entry.direction !== filterDirection) return false;
      }

      // 4. Author role filter
      if (filterAuthorRole !== 'Toutes') {
        if (entry.authorRole !== filterAuthorRole) return false;
      }

      // 5. Keyword query search (Title, Description, Author)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (entry.title || '').toLowerCase().includes(query);
        const matchesDesc = (entry.description || '').toLowerCase().includes(query);
        const matchesAuthor = (entry.authorName || '').toLowerCase().includes(query);
        const matchesCat = (entry.category || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesCat) return false;
      }

      return true;
    });
  }, [entries, originFilter, filterType, singleDate, startDate, endDate, filterDirection, filterAuthorRole, searchQuery]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalCount = filteredEntries.length;
    const autoCount = filteredEntries.filter(e => e.isAutomatic || (e.id || '').startsWith('auto-') || (e.title || '').startsWith('Saisie automatique')).length;
    const manualCount = totalCount - autoCount;
    const autoPercentage = totalCount > 0 ? Math.round((autoCount / totalCount) * 100) : 100;
    const managerCount = filteredEntries.filter(e => e.authorRole === 'Dirigeant').length;
    const collaboratorCount = filteredEntries.filter(e => e.authorRole === 'Collaborateur').length;
    const totalValuation = filteredEntries.reduce((sum, e) => sum + (e.financialImpact || 0), 0);
    const timeSavedHours = Math.round(autoCount * 1.5); // 1.5 hours saved per auto-logged operation

    return {
      totalCount,
      autoCount,
      manualCount,
      autoPercentage,
      managerCount,
      collaboratorCount,
      totalValuation,
      timeSavedHours
    };
  }, [filteredEntries]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEntries.length / itemsPerPage);
  }, [filteredEntries.length, itemsPerPage]);

  // Keep currentPage inside valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredEntries.length, itemsPerPage, totalPages, currentPage]);

  const currentEntries = useMemo(() => {
    if (viewMode === 'scroll') {
      return filteredEntries;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, viewMode, currentPage, itemsPerPage]);

  // Chart data 1: Saisies par Direction
  const chartDataByDirection = useMemo(() => {
    const counts: Record<string, number> = {};
    DIRECTIONS.forEach(d => { counts[d] = 0; });
    filteredEntries.forEach(e => {
      counts[e.direction] = (counts[e.direction] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.replace('Direction ', 'Dir. '),
      Saisies: count
    }));
  }, [filteredEntries]);

  // Chart data 2: Saisies par Catégorie
  const chartDataByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count
    }));
  }, [filteredEntries]);

  // Chart data 3: Chronology of Valuation Impact
  const chartTimelineValuation = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let cumulative = 0;
    return sorted.map(e => {
      cumulative += (e.financialImpact || 0);
      return {
        date: e.date || '',
        'Impact Unique': e.financialImpact || 0,
        'Cumul TND': cumulative
      };
    });
  }, [filteredEntries]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#64748b'];

  if (!isHydrated) return <SkeletonLoader />;

  // PDF Generation Report
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("ELYSSA ERP PRO - RAPPORT D'AUDIT DE CESSION", 20, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} | Filtres actifs : Dir. ${filterDirection} | Role : ${filterAuthorRole}`, 20, 26);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 30, 190, 30);

    // Summary Card Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(20, 35, 170, 25, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text("SYNTHÈSE DES SAISIES :", 25, 42);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Saisies: ${stats.totalCount}`, 25, 48);
    doc.text(`Saisies Dirigeants: ${stats.managerCount} | Collaborateurs: ${stats.collaboratorCount}`, 25, 53);
    doc.text(`Valorisation Nette de Cession (TND): ${stats.totalValuation.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND`, 100, 48);

    // Write Records
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("LISTE CHRONOLOGIQUE DES EVENEMENTS DE LA CESSION", 20, 70);

    let currentY = 78;
    filteredEntries.forEach((entry, idx) => {
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${entry.title} (${entry.date})`, 20, currentY);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Direction: ${entry.direction} | Auteur: ${entry.authorName} (${entry.authorRole}) | Catégorie: ${entry.category}`, 20, currentY + 4.5);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const descLines = doc.splitTextToSize(entry.description, 160);
      doc.text(descLines, 20, currentY + 9);

      const offset = descLines.length * 4;
      doc.setFont("Helvetica", "bold");
      if (entry.financialImpact && entry.financialImpact >= 0) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      const valStr = entry.financialImpact 
        ? `${entry.financialImpact >= 0 ? '+' : ''}${entry.financialImpact.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND`
        : 'Aucun impact direct';
      doc.text(`Valorisation: ${valStr} | Statut: ${entry.status}`, 20, currentY + 11 + offset);

      doc.setDrawColor(241, 245, 249);
      doc.line(20, currentY + 14 + offset, 190, currentY + 14 + offset);

      currentY += 19 + offset;
    });

    doc.save(`elyssa_erp_rapport_cession_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Heure', 'Titre', 'Categorie', 'Direction', 'Auteur', 'Role', 'Impact Financier TND', 'Statut', 'Description'];
    const rows = filteredEntries.map(e => [
      e.id,
      e.date,
      e.time,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.direction,
      e.authorName,
      e.authorRole,
      e.financialImpact || 0,
      e.status,
      `"${e.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elyssa_saisies_cession_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // HTML Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-800" id="cession-module">
      {/* Simulation Notification Toast */}
      <AnimatePresence>
        {simulationNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs border border-emerald-500"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>{simulationNotification}</span>
            </div>
            <span className="bg-emerald-700 text-emerald-100 text-[10px] px-2.5 py-1 rounded-full uppercase font-black">Enregistré en direct</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automated Real-Time Status Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 border border-emerald-500/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="relative shrink-0">
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute top-0 left-0"></div>
            <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full"></div>
          </div>
          <div>
            <span className="font-black text-emerald-400 uppercase tracking-widest text-[10px] block">Moteur de Traçabilité Automatique Actif</span>
            <p className="text-slate-300 font-medium">
              Toutes les manœuvres (créations, modifications, suppressions, validations) effectuées par les collaborateurs sur l'ERP sont <strong>consignées automatiquement en temps réel</strong>. Aucune saisie manuelle n'est requise.
            </p>
          </div>
        </div>
        <button
          onClick={handleSimulateAutoBatch}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-md active:scale-95 transition-all flex items-center space-x-2 text-xs"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Simuler Flux Automatiques ERP</span>
        </button>
      </div>

      {/* Header Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-40 h-40" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="bg-amber-500/15 text-amber-400 p-2 rounded-xl border border-amber-500/20">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-amber-500/20">
                Registre Automatisé de Cession & Gouvernance
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-sans">
              Module de Suivi des Actes & Cession (Mode Automatique)
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-mono leading-relaxed">
              Consultez l'historique complet d'audit des opérations d'entreprise. Les événements, rapports d'actifs, fiches de paie RH, dossiers de transit et écritures comptables sont enregistrés automatiquement par le système.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-200 font-bold text-xs px-3.5 py-3 rounded-xl flex items-center space-x-2 cursor-pointer border border-slate-700"
              title="Ajouter exceptionnellement une note ou ajustement manuel"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Saisie d'Ajustement Manuel</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-200 font-bold text-xs px-3 py-3 rounded-xl flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              title="Imprimer cette console d'audit"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">Actes Capturés Automatiquement</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-600">{stats.autoCount}</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                {stats.autoPercentage}% Auto
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">~{stats.timeSavedHours}h de travail économisées</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">Total Événements Audit</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{stats.totalCount}</span>
              <span className="text-xs font-bold text-indigo-650">actes enregistrés</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">{stats.manualCount} saisies d'exception</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <FileSignature className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">Saisies par Role</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-slate-900">{stats.managerCount} <span className="text-xs font-normal text-slate-400">Dir.</span> / {stats.collaboratorCount} <span className="text-xs font-normal text-slate-400">Coll.</span></span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">Traçabilité nominative intégrale</span>
          </div>
          <div className="bg-teal-50 text-teal-600 p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">Valorisation Nette</span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-xl font-black ${stats.totalValuation >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.totalValuation.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
              </span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">TND</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">Impact cumulé des actes</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Console de Filtrage d'Audit</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Enregistrement automatique en direct</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Origin Filter Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Origine des Actes</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setOriginFilter('all')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  originFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setOriginFilter('auto')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  originFilter === 'auto' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🤖 Automatiques
              </button>
              <button
                onClick={() => setOriginFilter('manual')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  originFilter === 'manual' ? 'bg-slate-800 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✍️ Manuels
              </button>
            </div>
          </div>
          {/* Filter Type Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Période du filtre</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Historique
              </button>
              <button
                onClick={() => setFilterType('day')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Par Jour
              </button>
              <button
                onClick={() => setFilterType('range')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === 'range' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Intervalle
              </button>
            </div>
          </div>

          {/* Conditional Date inputs */}
          <div className="space-y-1">
            {filterType === 'all' && (
              <>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date</label>
                <input
                  type="text"
                  disabled
                  value="Toutes dates confondues"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-xs rounded-xl p-2.5 font-bold cursor-not-allowed"
                />
              </>
            )}
            {filterType === 'day' && (
              <>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sélectionner le jour</label>
                <div className="relative">
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </>
            )}
            {filterType === 'range' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Direction Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtrer par Direction</label>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="Toutes">Toutes les Directions</option>
              {DIRECTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Author Role filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Auteur de la saisie</label>
            <select
              value={filterAuthorRole}
              onChange={(e) => setFilterAuthorRole(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="Toutes">Tous les rôles (Dirigeant & Coll.)</option>
              <option value="Dirigeant">Dirigeants seulement</option>
              <option value="Collaborateur">Collaborateurs seulement</option>
            </select>
          </div>
        </div>

        {/* Search row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par mot-clé, nom de l'auteur, description ou titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-10 pr-4 py-2.5 font-bold outline-none focus:border-indigo-500 transition-colors"
            />
          </div>



          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              title="Exporter au format Excel CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-indigo-100 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              title="Générer un rapport PDF officiel de cession"
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Rapport PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bar Chart - Saisies par Direction */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Saisies par Direction</h4>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByDirection}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="Saisies" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: Pie Chart - Categories distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Répartition par Catégorie</h4>
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {chartDataByCategory.length === 0 ? (
              <span className="text-slate-400 text-xs font-mono">Aucune donnée</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartDataByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} fiches`, name]} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Area Chart - Cumulative Valuation timelines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-sans">Valorisation Cumulative (TND)</h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
              Évolution
            </span>
          </div>
          <div className="h-48 w-full">
            {chartTimelineValuation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                Pas d'impact financier dans les dates filtrées
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTimelineValuation}>
                  <defs>
                    <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 8 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => [`${(Number(value) || 0).toLocaleString()} TND`, 'Cumul']} />
                  <Area type="monotone" dataKey="Cumul TND" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCumul)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Main List & Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Adding New / Editing Form Panel (Conditional overlay or sidebar block) */}
        {isAddingNew && (
          <div className="lg:col-span-12 bg-white rounded-2xl border border-amber-400/55 p-6 shadow-md space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase text-slate-800">
                  {editingEntry ? "Modifier la Saisie de Cession" : "Déclarer et Saisir un Événement d'Audit de Cession"}
                </h3>
              </div>
              <button
                onClick={() => { setIsAddingNew(false); setEditingEntry(null); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Titre de la saisie / Opération</label>
                <input
                  type="text"
                  placeholder="Ex: Validation de la Garantie d'Actifs et Passifs (GAP)"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Catégorie de l'événement</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Direction rattachée</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500"
                >
                  {DIRECTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nom de l'auteur de la saisie</label>
                <input
                  type="text"
                  placeholder="Ex: Rim Oueslati"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rôle hiérarchique de l'auteur</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, authorRole: 'Collaborateur' }))}
                    className={`flex-1 text-center py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                      formData.authorRole === 'Collaborateur' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Collaborateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, authorRole: 'Dirigeant' }))}
                    className={`flex-1 text-center py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                      formData.authorRole === 'Dirigeant' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Dirigeant (Admin/Cadre)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Impact Financier / Valorisation (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Ex: +500000 pour apport d'actifs, -12000 pour impôt"
                  value={formData.financialImpact}
                  onChange={(e) => setFormData(prev => ({ ...prev, financialImpact: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date de saisie</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Heure de saisie</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Statut du dossier</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 font-bold outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description détaillée, notes d'audit & pièces justificatives rattachées</label>
                <textarea
                  rows={4}
                  placeholder="Décrivez de manière exhaustive l'opération de cession effectuée : nature des actifs cédés, obligations légales, rapports annexés, décisions administratives ou résultats des négociations..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 font-bold outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="md:col-span-3 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => { setIsAddingNew(false); setEditingEntry(null); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  {editingEntry ? "Sauvegarder les modifications" : "Enregistrer la saisie"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Side / Full screen width if form is closed: The Audit Timeline Ledger */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Registre Général d'Audit de Cession
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ({filteredEntries.length} Saisies affichées)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filteredEntries.length < entries.length && (
                <span className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full font-bold">
                  Filtre actif : {filteredEntries.length} fiches sur {entries.length}
                </span>
              )}

              {/* Display mode selector */}
              <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('pagination')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    viewMode === 'pagination' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/45'
                  }`}
                  title="Affichage par page"
                >
                  <span>Pages</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('scroll')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    viewMode === 'scroll' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/45'
                  }`}
                  title="Affichage défilant (Ascenseur)"
                >
                  <span>Ascenseur</span>
                </button>
              </div>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Aucune saisie de cession ne correspond aux filtres appliqués.</p>
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDirection('Toutes');
                  setFilterAuthorRole('Toutes');
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-600 font-bold underline cursor-pointer hover:text-indigo-800"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className={`overflow-x-auto ${viewMode === 'scroll' ? 'max-h-[460px] overflow-y-auto pr-1' : ''}`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                      <th className="p-4 font-extrabold">Événement & Date</th>
                      <th className="p-4 font-extrabold">Auteur / Role</th>
                      <th className="p-4 font-extrabold">Direction / Catégorie</th>
                      <th className="p-4 font-extrabold text-right">Valorisation / Impact</th>
                      <th className="p-4 font-extrabold text-center">Statut</th>
                      <th className="p-4 font-extrabold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/65 transition-colors">
                        {/* Event Column */}
                        <td className="p-4 max-w-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(entry.isAutomatic || (entry.id || '').startsWith('auto-') || (entry.title || '').startsWith('Saisie automatique')) ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>AUTOMATIQUE ({entry.sourceModule || 'Système ERP'})</span>
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span>✍️ Saisie Manuelle</span>
                                </span>
                              )}
                            </div>
                            <span className="font-extrabold text-slate-900 leading-snug block">{entry.title}</span>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{entry.date}</span>
                              <span>à</span>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{entry.time}</span>
                            </div>
                          </div>
                        </td>

                        {/* Author Column */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-700 block">{entry.authorName}</span>
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              entry.authorRole === 'Dirigeant' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                            }`}>
                              {entry.authorRole}
                            </span>
                          </div>
                        </td>

                        {/* Direction Column */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-600 block">{entry.direction}</span>
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {entry.category}
                            </span>
                          </div>
                        </td>

                        {/* Financial Impact Column */}
                        <td className="p-4 text-right font-mono font-extrabold">
                          {entry.financialImpact ? (
                            <span className={entry.financialImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {entry.financialImpact >= 0 ? '+' : ''}
                              {entry.financialImpact.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Aucun impact direct</span>
                          )}
                        </td>

                        {/* Status badge Column */}
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full ${
                            entry.status === 'Brouillon' ? 'bg-slate-100 text-slate-500' :
                            entry.status === 'Soumis' ? 'bg-amber-100 text-amber-800' :
                            entry.status === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setDetailEntry(entry)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer"
                              title="Voir les détails complets de la saisie"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                              title="Modifier cette saisie"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Supprimer cette saisie"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
              {viewMode === 'pagination' && (
                <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span>Lignes par page :</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
                      | Saisies {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEntries.length)} à {Math.min(currentPage * itemsPerPage, filteredEntries.length)} sur {filteredEntries.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 font-bold">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Première page"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs"
                      title="Page précédente"
                    >
                      Précédent
                    </button>

                    {/* Page number buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
                      })
                      .map((p, idx, arr) => {
                        const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs ${
                                currentPage === p
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })
                    }

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs"
                      title="Page suivante"
                    >
                      Suivant
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Dernière page"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}

              {/* Scroll Mode Footer */}
              {viewMode === 'scroll' && (
                <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Défilement vertical ("Ascenseur") actif pour une consultation fluide</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Total : {filteredEntries.length} lignes
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {detailEntry && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-200 shadow-2xl text-slate-800"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">Fiche de saisie de cession</span>
                </div>
                <button
                  onClick={() => setDetailEntry(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg text-xs cursor-pointer"
                >
                  Fermer ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider block">Sujet de l'événement</span>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{detailEntry.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Auteur de l'action</span>
                    <p className="text-slate-800">{detailEntry.authorName}</p>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border mt-1 ${
                      detailEntry.authorRole === 'Dirigeant' ? 'text-amber-700 border-amber-200' : 'text-teal-700 border-teal-200'
                    }`}>
                      {detailEntry.authorRole}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Date & Heure</span>
                    <p className="text-slate-800 font-mono">{detailEntry.date} à {detailEntry.time}</p>
                    <span className="text-[9px] text-slate-400 block font-mono mt-1">ID: {detailEntry.id}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Direction de rattachement</span>
                    <p className="text-indigo-950 font-bold">{detailEntry.direction}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Catégorie</span>
                    <p className="text-slate-850 font-bold">{detailEntry.category}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Valorisation / Impact financier</span>
                    <p className={`font-mono font-extrabold ${detailEntry.financialImpact && detailEntry.financialImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {detailEntry.financialImpact 
                        ? `${detailEntry.financialImpact >= 0 ? '+' : ''}${detailEntry.financialImpact.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND`
                        : 'Aucun impact direct rattaché'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-black mb-1">Statut d'Audit actuel</span>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1 ${
                      detailEntry.status === 'Brouillon' ? 'bg-slate-200 text-slate-600' :
                      detailEntry.status === 'Soumis' ? 'bg-amber-100 text-amber-800' :
                      detailEntry.status === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {detailEntry.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider block">Description détaillée & Audit notes</span>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-semibold text-slate-700 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {detailEntry.description}
                  </div>
                </div>

                {detailEntry.attachmentsCount !== undefined && detailEntry.attachmentsCount > 0 && (
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 bg-slate-100 p-2.5 rounded-xl">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>{detailEntry.attachmentsCount} pièce(s) jointe(s) et rapports d'audits scellés rattachés à ce dossier</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    const printDoc = new jsPDF();
                    printDoc.setFont("Helvetica", "bold");
                    printDoc.text("RAPPORT DE FICHE DE CESSION", 20, 20);
                    printDoc.setFont("Helvetica", "normal");
                    printDoc.setFontSize(10);
                    printDoc.text(`Titre: ${detailEntry.title}`, 20, 30);
                    printDoc.text(`Direction: ${detailEntry.direction}`, 20, 38);
                    printDoc.text(`Auteur: ${detailEntry.authorName} (${detailEntry.authorRole})`, 20, 46);
                    printDoc.text(`Date: ${detailEntry.date} à ${detailEntry.time}`, 20, 54);
                    printDoc.text(`Valorisation: ${detailEntry.financialImpact?.toLocaleString() || 0} TND`, 20, 62);
                    printDoc.text(`Statut: ${detailEntry.status}`, 20, 70);
                    const splitText = printDoc.splitTextToSize(detailEntry.description, 160);
                    printDoc.text(splitText, 20, 80);
                    printDoc.save(`cession_fiche_${detailEntry.id}.pdf`);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-indigo-100 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF de la fiche</span>
                </button>
                <button
                  onClick={() => {
                    const entryToEdit = detailEntry;
                    handleOpenEdit(entryToEdit);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier la fiche</span>
                </button>
                <button
                  onClick={() => setDetailEntry(null)}
                  className="bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
