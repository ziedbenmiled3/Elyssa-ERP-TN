import React, { useState } from 'react';
import {
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  ExternalLink,
  RefreshCw,
  Layers,
  Calculator,
  Send,
  Lock,
  FolderKey,
  FileSpreadsheet,
  Sparkles,
  Filter,
  ArrowRight,
  UserCheck,
  ChevronRight,
  X,
  Scale,
  Check,
  Share2,
  FileCheck,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ClientDossier {
  id: string;
  name: string;
  mf: string;
  tenant_id: string;
  legalForm: string;
  sector: string;
  fiscalYear: string;
  unprocessedDocs: number;
  tejStatus: 'validated' | 'pending' | 'late';
  cnssStatus: 'validated' | 'pending' | 'late';
  tvaG50Status: 'validated' | 'pending' | 'late';
  quarterlyRevenue: number;
  lastSyncDate: string;
}

export interface CabinetDocument {
  id: string;
  title: string;
  clientName: string;
  category: 'Liasse Fiscale' | 'Bilan & CR' | 'PV dAG' | 'Rapport Commissariat' | 'Attestation Fiscale / CNSS' | 'Autre';
  uploadDate: string;
  fileSize: string;
  author: 'Cabinet' | 'Client';
  isSigned: boolean;
}

const INITIAL_DEMO_DOSSIERS: ClientDossier[] = [
  {
    id: 'dos-sfe',
    name: 'SFE (Société de Fabrication Électrique)',
    mf: '1482930/A/A/M/000',
    tenant_id: 'dos-sfe',
    legalForm: 'SUARL',
    sector: 'Industrie & Électricité',
    fiscalYear: '2026',
    unprocessedDocs: 14,
    tejStatus: 'validated',
    cnssStatus: 'pending',
    tvaG50Status: 'validated',
    quarterlyRevenue: 1420000,
    lastSyncDate: '2026-08-11 16:30'
  },
  {
    id: 'dos-sfax-distrib',
    name: 'Sfax Distribution',
    mf: '0948215/B/A/M/000',
    tenant_id: 'dos-sfax-distrib',
    legalForm: 'SARL',
    sector: 'Commerce & Grossiste',
    fiscalYear: '2026',
    unprocessedDocs: 32,
    tejStatus: 'validated',
    cnssStatus: 'validated',
    tvaG50Status: 'late',
    quarterlyRevenue: 890000,
    lastSyncDate: '2026-08-12 09:15'
  },
  {
    id: 'dos-batiment-sahel',
    name: 'Batiment Sahel',
    mf: '1209384/C/A/M/000',
    tenant_id: 'dos-batiment-sahel',
    legalForm: 'SA',
    sector: 'BTP & Construction',
    fiscalYear: '2026',
    unprocessedDocs: 8,
    tejStatus: 'pending',
    cnssStatus: 'validated',
    tvaG50Status: 'validated',
    quarterlyRevenue: 2150000,
    lastSyncDate: '2026-08-10 14:00'
  },
  {
    id: 'dos-gts',
    name: 'GTS (Global Transport Services)',
    mf: '1654321/D/A/M/000',
    tenant_id: 'dos-gts',
    legalForm: 'SARL',
    sector: 'Logistique & Transit',
    fiscalYear: '2026',
    unprocessedDocs: 21,
    tejStatus: 'validated',
    cnssStatus: 'pending',
    tvaG50Status: 'validated',
    quarterlyRevenue: 640000,
    lastSyncDate: '2026-08-11 11:45'
  }
];

const INITIAL_CABINET_DOCS: CabinetDocument[] = [
  {
    id: 'doc-1',
    title: 'Liasse Fiscale Définitive Exercice 2025',
    clientName: 'SFE (Société de Fabrication Électrique)',
    category: 'Liasse Fiscale',
    uploadDate: '2026-03-25',
    fileSize: '4.2 MB',
    author: 'Cabinet',
    isSigned: true
  },
  {
    id: 'doc-2',
    title: 'PV d\'Assemblée Générale Ordinaire 2025 & Affectation Résultat',
    clientName: 'Batiment Sahel',
    category: 'PV dAG',
    uploadDate: '2026-05-18',
    fileSize: '1.8 MB',
    author: 'Cabinet',
    isSigned: true
  },
  {
    id: 'doc-3',
    title: 'Attestation de Régularité Fiscale DGI T2-2026',
    clientName: 'GTS (Global Transport Services)',
    category: 'Attestation Fiscale / CNSS',
    uploadDate: '2026-07-02',
    fileSize: '850 KB',
    author: 'Cabinet',
    isSigned: true
  },
  {
    id: 'doc-4',
    title: 'Relevés Bancaires & Factures d\'Achat Juillet 2026',
    clientName: 'Sfax Distribution',
    category: 'Autre',
    uploadDate: '2026-08-05',
    fileSize: '12.4 MB',
    author: 'Client',
    isSigned: false
  },
  {
    id: 'doc-5',
    title: 'Rapport Spécial du Commissaire aux Comptes',
    clientName: 'Batiment Sahel',
    category: 'Rapport Commissariat',
    uploadDate: '2026-04-12',
    fileSize: '3.1 MB',
    author: 'Cabinet',
    isSigned: true
  }
];

export interface AccountantPortalProps {
  onBackToLanding?: () => void;
  onSwitchCompany?: (companyName: string, tenantId?: string, mf?: string) => void;
  setActiveTab?: (tabId: string) => void;
}

export const AccountantPortal: React.FC<AccountantPortalProps> = ({
  onBackToLanding,
  onSwitchCompany,
  setActiveTab
}) => {
  const [activeTab, setActiveTabLocal] = useState<'dossiers' | 'tej_consolidation' | 'ged_vault'>('dossiers');
  const [dossiers, setDossiers] = useState<ClientDossier[]>(INITIAL_DEMO_DOSSIERS);
  const [documents, setDocuments] = useState<CabinetDocument[]>(INITIAL_CABINET_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'pending' | 'validated'>('all');
  
  // Modals & Interactivity states
  const [showAddDossierModal, setShowAddDossierModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showTaxSummaryModal, setShowTaxSummaryModal] = useState(false);
  const [isSigningBatch, setIsSigningBatch] = useState(false);
  const [batchSignedSuccess, setBatchSignedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Dossier Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientMF, setNewClientMF] = useState('');
  const [newClientLegalForm, setNewClientLegalForm] = useState('SARL');
  const [newClientSector, setNewClientSector] = useState('');

  // New Document Upload Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocClient, setNewDocClient] = useState(INITIAL_DEMO_DOSSIERS[0].name);
  const [newDocCategory, setNewDocCategory] = useState<CabinetDocument['category']>('Liasse Fiscale');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetDemoData = () => {
    setDossiers(INITIAL_DEMO_DOSSIERS);
    setDocuments(INITIAL_CABINET_DOCS);
    setBatchSignedSuccess(false);
    showToast('Portefeuille cabinet réinitialisé avec 4 dossiers clients complets (SFE, Sfax Distribution, Batiment Sahel, GTS).');
  };

  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientMF) return;

    const newDos: ClientDossier = {
      id: `dos-${Date.now()}`,
      name: newClientName,
      mf: newClientMF,
      tenant_id: `tenant-${Date.now()}`,
      legalForm: newClientLegalForm,
      sector: newClientSector || 'Services',
      fiscalYear: '2026',
      unprocessedDocs: 0,
      tejStatus: 'pending',
      cnssStatus: 'pending',
      tvaG50Status: 'validated',
      quarterlyRevenue: 0,
      lastSyncDate: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setDossiers(prev => [newDos, ...prev]);
    setShowAddDossierModal(false);
    setNewClientName('');
    setNewClientMF('');
    setNewClientSector('');
    showToast(`Dossier client "${newClientName}" créé et rattaché au cabinet.`);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;

    const newDoc: CabinetDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      clientName: newDocClient,
      category: newDocCategory,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileSize: '2.5 MB',
      author: 'Cabinet',
      isSigned: true
    };

    setDocuments(prev => [newDoc, ...prev]);
    setShowUploadDocModal(false);
    setNewDocTitle('');
    showToast(`Document "${newDocTitle}" déposé dans le coffre-fort sécurisé.`);
  };

  const handleBatchSignTEJ = () => {
    setIsSigningBatch(true);
    setTimeout(() => {
      setIsSigningBatch(false);
      setBatchSignedSuccess(true);
      setDossiers(prev => prev.map(d => ({ ...d, tejStatus: 'validated' })));
      showToast('⚡ Lot XML TEJ CIMF signé avec succès avec votre certificat OECT ! 4 déclarations transmises.');
    }, 1200);
  };

  const handleSwitchClientERP = (client: ClientDossier) => {
    if (onSwitchCompany) {
      onSwitchCompany(client.name, client.tenant_id, client.mf);
    }
    if (setActiveTab) {
      setActiveTab('finance');
    }
    showToast(`🔗 Basculement sur l'ERP du client : "${client.name}" (Tenant ID: ${client.tenant_id}).`);
  };

  // Filtered dossiers
  const filteredDossiers = dossiers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.mf.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.sector.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'alert') {
      return matchSearch && (d.tvaG50Status === 'late' || d.tejStatus === 'late' || d.cnssStatus === 'late');
    }
    if (statusFilter === 'pending') {
      return matchSearch && (d.tejStatus === 'pending' || d.cnssStatus === 'pending');
    }
    if (statusFilter === 'validated') {
      return matchSearch && d.tejStatus === 'validated' && d.cnssStatus === 'validated' && d.tvaG50Status === 'validated';
    }
    return matchSearch;
  });

  // Global counts
  const totalDossiers = dossiers.length;
  const pendingTEJ = dossiers.filter(d => d.tejStatus === 'pending').length;
  const lateDeclarations = dossiers.filter(d => d.tvaG50Status === 'late').length;
  const totalUnprocessedDocs = dossiers.reduce((acc, curr) => acc + curr.unprocessedDocs, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-indigo-400/30 flex items-center gap-2 max-w-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header Cabinet */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Scale className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Cabinet d'Expertise Comptable Ben Amor & Associés
                </h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Agréé OECT</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span>Portefeuille Multi-Tenants & Consolidation Fiscale</span>
                <span>•</span>
                <span className="text-amber-400/90 font-mono font-bold">Matricule OECT: 2024-EC-0891</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <span>← Retour Site</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetDemoData}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>CHARGER DÉMOS</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddDossierModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouveau Dossier Client</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Counters Dashboard Bar */}
      <section className="bg-slate-900/50 border-b border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block">
                Dossiers Gérés
              </span>
              <span className="text-2xl font-black text-white font-mono block">
                {totalDossiers} <span className="text-xs font-normal text-slate-400 font-sans">clients</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider font-mono block">
                TEJ CIMF en Attente
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono block">
                {pendingTEJ} <span className="text-xs font-normal text-amber-400/80 font-sans">à signer</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider font-mono block">
                Alertes Échéances (G50/TVA)
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono block">
                {lateDeclarations} <span className="text-xs font-normal text-rose-300 font-sans">en retard</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono block">
                Pièces Non Saisies
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono block">
                {totalUnprocessedDocs} <span className="text-xs font-normal text-emerald-400/80 font-sans">pièces</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTabLocal('dossiers')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'dossiers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Registre des Dossiers Clients ({dossiers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabLocal('tej_consolidation')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'tej_consolidation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>2. Télé-transmissions TEJ & CNSS Groupées</span>
            {pendingTEJ > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                {pendingTEJ}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTabLocal('ged_vault')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'ged_vault'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FolderKey className="w-4 h-4 text-emerald-400" />
            <span>3. Coffre-Fort Électronique GED ({documents.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ONGLET 1 : REGISTRE DES DOSSIERS CLIENTS */}
        {activeTab === 'dossiers' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par client, MF ou secteur..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-[10px] font-black uppercase text-slate-500 font-mono shrink-0">Filtre :</span>
                {[
                  { id: 'all', label: 'Tous les dossiers' },
                  { id: 'alert', label: '🔴 En retard (G50/TVA)' },
                  { id: 'pending', label: '🟡 TEJ/CNSS à vérifier' },
                  { id: 'validated', label: '🟢 Conformes' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      statusFilter === f.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-850'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dossiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDossiers.map((client) => (
                <div
                  key={client.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 p-6 transition flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                            {client.legalForm}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Exercice {client.fiscalYear}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">{client.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">MF : <span className="text-amber-400 font-bold">{client.mf}</span></p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">Pièces non saisies</span>
                        <span className="text-base font-black text-amber-300 font-mono">
                          {client.unprocessedDocs} <span className="text-xs font-normal text-slate-400 font-sans">doc(s)</span>
                        </span>
                      </div>
                    </div>

                    {/* Deadline Status Badges */}
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block">
                        Statut des Échéances du Mois :
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        {/* TEJ */}
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="font-bold text-slate-300">TEJ CIMF :</span>
                          {client.tejStatus === 'validated' ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1 text-[10px]">
                              🟢 Validée
                            </span>
                          ) : (
                            <span className="text-amber-400 font-black flex items-center gap-1 text-[10px]">
                              🟡 En attente
                            </span>
                          )}
                        </div>

                        {/* CNSS */}
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="font-bold text-slate-300">Paie/CNSS :</span>
                          {client.cnssStatus === 'validated' ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1 text-[10px]">
                              🟢 Validée
                            </span>
                          ) : (
                            <span className="text-amber-400 font-black flex items-center gap-1 text-[10px]">
                              🟡 À vérifier
                            </span>
                          )}
                        </div>

                        {/* G50 */}
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="font-bold text-slate-300">TVA / G50 :</span>
                          {client.tvaG50Status === 'validated' ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1 text-[10px]">
                              🟢 Conforme
                            </span>
                          ) : (
                            <span className="text-rose-400 font-black flex items-center gap-1 text-[10px]">
                              🔴 En retard
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Switch ERP Action */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Dernière synchro : {client.lastSyncDate}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSwitchClientERP(client)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>🔗 Accéder au Dossier (Switch ERP)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 2 : TÉLÉ-TRANSMISSIONS TEJ & CNSS GROUPÉES */}
        {activeTab === 'tej_consolidation' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-amber-400" />
                    <span>Consolidation & Signature Groupée TEJ (CIMF)</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Signez et télé-transmettez les lots d'attestations de retenues à la source pour l'ensemble des clients du cabinet.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTaxSummaryModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-2 border border-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>📊 Récapitulatif Impôts Trimestriel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchSignTEJ}
                    disabled={isSigningBatch}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSigningBatch ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>⚡ Signer & Télé-transmettre le Lot XML CIMF ({dossiers.length} Dossiers)</span>
                  </button>
                </div>
              </div>

              {batchSignedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    Signature électronique OECT validée. Référence CIMF : <span className="font-mono text-white font-black">CIMF-2026-BATCH-098412</span>. Tous les lots XML ont été enregistrés et transmis.
                  </span>
                </div>
              )}
            </div>

            {/* Table of TEJ Client Files */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300 font-mono">
                  État des Déclarations par Dossier Client
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Échéance mensuelle : 28 Août 2026</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Client Dossier</th>
                      <th className="p-4">Matricule Fiscal</th>
                      <th className="p-4">Retenues RS Total (TND)</th>
                      <th className="p-4">Cotisations CNSS (TND)</th>
                      <th className="p-4">Statut XML TEJ</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dossiers.map((dos) => (
                      <tr key={dos.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-4 font-black text-white">{dos.name}</td>
                        <td className="p-4 font-mono text-amber-400">{dos.mf}</td>
                        <td className="p-4 font-mono font-bold text-slate-200">
                          {(dos.quarterlyRevenue * 0.015).toLocaleString()} TND
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-200">
                          {(dos.quarterlyRevenue * 0.032).toLocaleString()} TND
                        </td>
                        <td className="p-4">
                          {dos.tejStatus === 'validated' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Validé & Transmis CIMF</span>
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-black px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Prêt pour Signature</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => showToast(`Téléchargement du fichier XML TEJ certifié pour ${dos.name}...`)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition cursor-pointer font-bold text-xs inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>XML</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3 : COFFRE-FORT ÉLECTRONIQUE & GED PARTAGÉE */}
        {activeTab === 'ged_vault' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FolderKey className="w-5 h-5 text-emerald-400" />
                  <span>Coffre-Fort Électronique & GED Partagée (Cabinet ↔ Client)</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Espace de dépôt hautement sécurisé pour les bilans, liasses fiscales, PV d'AG et rapports officiels.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadDocModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Transmettre un Document au Client</span>
              </button>
            </div>

            {/* Documents List */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300 font-mono">
                  Documents Déposés ({documents.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">🔒 Chiffrement SSL 256 bits</span>
              </div>

              <div className="divide-y divide-slate-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-850/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                            {doc.category}
                          </span>
                          {doc.isSigned && (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                              ✓ Signé Électroniquement
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-white">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Client : <span className="text-slate-200 font-bold">{doc.clientName}</span> • Déposé par : <span className="text-indigo-300 font-bold">{doc.author}</span> le {doc.uploadDate} ({doc.fileSize})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => showToast(`Aperçu du document : ${doc.title}`)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Aperçu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Téléchargement de ${doc.title}...`)}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NOUVEAU DOSSIER CLIENT */}
      <AnimatePresence>
        {showAddDossierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <span>Rattacher un Nouveau Dossier Client</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDossierModal(false)}
                  className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDossier} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Raison Sociale de l'Entreprise *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="ex: Maghreb Multi-Services SARL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Matricule Fiscal (MF) *</label>
                    <input
                      type="text"
                      required
                      value={newClientMF}
                      onChange={(e) => setNewClientMF(e.target.value)}
                      placeholder="1234567/A/A/M/000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Forme Juridique</label>
                    <select
                      value={newClientLegalForm}
                      onChange={(e) => setNewClientLegalForm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="SARL">SARL</option>
                      <option value="SUARL">SUARL</option>
                      <option value="SA">SA</option>
                      <option value="SNC">SNC</option>
                      <option value="Personne Physique">Personne Physique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Secteur d'Activité</label>
                  <input
                    type="text"
                    value={newClientSector}
                    onChange={(e) => setNewClientSector(e.target.value)}
                    placeholder="ex: Commerce de Gros, Agroalimentaire..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDossierModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black"
                  >
                    Enregistrer le Dossier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: UPLOAD DOCUMENT GED */}
      <AnimatePresence>
        {showUploadDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FolderKey className="w-5 h-5 text-emerald-400" />
                  <span>Transmettre un Document Officiel</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Dossier Client Destinataire *</label>
                  <select
                    value={newDocClient}
                    onChange={(e) => setNewDocClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {dossiers.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Intitulé du Document *</label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="ex: Liasse Fiscale Officielle 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Catégorie</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Liasse Fiscale">Liasse Fiscale</option>
                    <option value="Bilan & CR">Bilan & Compte de Résultat</option>
                    <option value="PV dAG">PV d'Assemblée Générale</option>
                    <option value="Rapport Commissariat">Rapport de Commissariat</option>
                    <option value="Attestation Fiscale / CNSS">Attestation Fiscale / CNSS</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadDocModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                  >
                    Déposer dans le Coffre-Fort
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RÉCAPITULATIF IMPÔTS TRIMESTRIEL */}
      <AnimatePresence>
        {showTaxSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Récapitulatif Impôts & Déclarations Cabinet (G50 / TEJ)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTaxSummaryModal(false)}
                  className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Nombre de Dossiers Consolidés :</span>
                    <span className="text-white font-black">{dossiers.length} entreprises</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Chiffre d'Affaires Global :</span>
                    <span className="text-emerald-400 font-black">
                      {dossiers.reduce((acc, c) => acc + c.quarterlyRevenue, 0).toLocaleString()} TND
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Retenues à la Source TEJ :</span>
                    <span className="text-amber-300 font-black">
                      {(dossiers.reduce((acc, c) => acc + c.quarterlyRevenue, 0) * 0.015).toLocaleString()} TND
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Ce fichier récapitulatif est prêt pour la soumission globale auprès de l'Administration Fiscale et de l'OECT.
                </p>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTaxSummaryModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaxSummaryModal(false);
                      showToast('Fichier récapitulatif comptable & fiscal exporté en format Excel (.xlsx).');
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountantPortal;
