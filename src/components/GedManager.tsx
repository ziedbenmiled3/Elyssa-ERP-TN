import React, { useState, useMemo, useRef } from 'react';
import { Client, Employee, GedDocument } from '../types';
import { getValidMockBase64 } from '../utils/mockDynamicGed';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Building2, 
  User, 
  Plus, 
  X, 
  Filter, 
  Info, 
  Calendar, 
  FileCode, 
  CloudLightning,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Paperclip,
  Share2,
  HardDrive,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GedManagerProps {
  clients: Client[];
  employees: Employee[];
  documents: GedDocument[];
  onUpdateDocuments: (updatedDocs: GedDocument[]) => void;
  currentUserEmail?: string;
  readOnly?: boolean;
}

export default function GedManager({ 
  clients, 
  employees, 
  documents, 
  onUpdateDocuments,
  currentUserEmail = "contact@elyssa.pro",
  readOnly = false 
}: GedManagerProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Invoice' | 'Contract' | 'Report' | 'Other'>('All');
  const [linkFilter, setLinkFilter] = useState<'All' | 'Client' | 'Employee' | 'None'>('All');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('All');

  // Upload/Edit UI modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Document item properties
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<'Invoice' | 'Contract' | 'Report' | 'Other'>('Other');
  const [newDocLinkType, setNewDocLinkType] = useState<'Client' | 'Employee' | 'None'>('None');
  const [newDocLinkId, setNewDocLinkId] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocFile, setNewDocFile] = useState<{ name: string; size: number; type: string; base64?: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // OCR processing state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    supplier: string;
    invoiceNumber?: string;
    date?: string;
    amountHT?: number;
    amountTVA?: number;
    taxStamp?: number;
    amountTTC?: number;
    currency?: string;
    description?: string;
    confidence?: number;
  } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const runOcrAnalysis = async () => {
    if (!newDocFile || !newDocFile.base64) return;
    setIsOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);

    try {
      // Look up custom key if present in localstorage to support direct pass-through
      let customHeaders: any = {
        'Content-Type': 'application/json'
      };
      const adminSettingsRaw = localStorage.getItem('elyssa_admin_settings');
      if (adminSettingsRaw) {
        try {
          const parsed = JSON.parse(adminSettingsRaw);
          if (parsed.geminiApiKey) {
            customHeaders['x-gemini-key'] = parsed.geminiApiKey;
          }
        } catch (_) {}
      }

      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify({
          base64Data: newDocFile.base64,
          mimeType: newDocFile.type,
          fileName: newDocFile.name
        })
      });

      if (!res.ok) {
        throw new Error(`La requête de traitement OCR a échoué avec le statut ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        setOcrResult(data.data);
      } else {
        throw new Error(data.error || "Une erreur inattendue est survenue durant l'extraction.");
      }
    } catch (err: any) {
      console.error("OCR analysis failure:", err);
      setOcrError(err.message || String(err));
    } finally {
      setIsOcrLoading(false);
    }
  };

  const applyOcrResults = () => {
    if (!ocrResult) return;
    
    // Auto-prefill the inputs
    setNewDocName(`Facture ${ocrResult.supplier} ${ocrResult.invoiceNumber ? '#' + ocrResult.invoiceNumber : ''}`.trim());
    setNewDocType('Invoice');
    
    const financialSummary = `Facture fournisseur extraite par OCR intelligent. \n` +
      `Fournisseur: ${ocrResult.supplier}\n` +
      `N° Facture: ${ocrResult.invoiceNumber || 'Inconnu'}\n` +
      `Date: ${ocrResult.date || 'Inconnue'}\n` +
      `Montant HT: ${(ocrResult.amountHT || 0).toFixed(3)} TND\n` +
      `Montant TVA: ${(ocrResult.amountTVA || 0).toFixed(3)} TND\n` +
      `Timbre Fiscal: ${(ocrResult.taxStamp || 1.000).toFixed(3)} TND\n` +
      `Montant TTC: ${(ocrResult.amountTTC || 0).toFixed(3)} TND\n` +
      `Réf Achat: ${ocrResult.description || 'Non spécifié'}`;
      
    setNewDocDesc(financialSummary);
  };

  // Quick stats computed
  const stats = useMemo(() => {
    const totalCount = documents.length;
    const sizeInBytes = documents.reduce((sum, doc) => {
      // Parse file size strings like "245 KB" or "1.2 MB" to estimate bytes
      const val = parseFloat(doc.fileSize);
      if (doc.fileSize.toUpperCase().includes('MB')) return sum + val * 1024 * 1024;
      if (doc.fileSize.toUpperCase().includes('KB')) return sum + val * 1024;
      return sum + val;
    }, 0);
    
    // Convert back to structured size string
    let formattedSize = "0 B";
    if (sizeInBytes >= 1024 * 1024) formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    else if (sizeInBytes >= 1024) formattedSize = `${(sizeInBytes / 1024).toFixed(0)} KB`;
    else formattedSize = `${sizeInBytes} B`;

    const invoiceCount = documents.filter(d => d.type === 'Invoice').length;
    const contractCount = documents.filter(d => d.type === 'Contract').length;
    const reportCount = documents.filter(d => d.type === 'Report').length;
    const otherCount = documents.filter(d => d.type === 'Other').length;

    const linkedCount = documents.filter(d => d.linkedToType !== 'None').length;

    return {
      totalCount,
      formattedSize,
      invoiceCount,
      contractCount,
      reportCount,
      otherCount,
      linkedCount
    };
  }, [documents]);

  // Read available entities for binding selection
  const targetDropdownEntities = useMemo(() => {
    if (newDocLinkType === 'Client') {
      return clients.map(c => ({ id: c.id, name: `${c.name} (Client)` }));
    }
    if (newDocLinkType === 'Employee') {
      return employees.map(e => ({ id: e.id, name: `${e.name} (Collaborateur)` }));
    }
    return [];
  }, [newDocLinkType, clients, employees]);

  // Filter lists based on target link entities selection
  const listDropdownFilterEntities = useMemo(() => {
    if (linkFilter === 'Client') {
      return clients.map(c => ({ id: c.id, name: c.name }));
    }
    if (linkFilter === 'Employee') {
      return employees.map(e => ({ id: e.id, name: e.name }));
    }
    return [];
  }, [linkFilter, clients, employees]);

  // Apply filters & search terms to the central Document table
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (doc.linkedToName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'All' || doc.type === typeFilter;
      const matchesLink = linkFilter === 'All' || doc.linkedToType === linkFilter;
      
      const matchesEntityId = selectedEntityId === 'All' || doc.linkedToId === selectedEntityId;

      return matchesSearch && matchesType && matchesLink && matchesEntityId;
    }).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, searchTerm, typeFilter, linkFilter, selectedEntityId]);

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 1.8 * 1024 * 1024) {
      setUploadError("Limite de taille dépassée. Pour préserver le stockage local (limite de 5MB du navigateur), veuillez téléverser des pièces inférieures à 1.8 Mo.");
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setNewDocFile({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: reader.result as string
      });
      // Suggest template fields
      if (!newDocName) {
        setNewDocName(file.name.split('.').slice(0, -1).join('.'));
      }
      
      // Auto classify based on extension or keyword checks
      const lName = file.name.toLowerCase();
      if (lName.includes('facture') || lName.includes('invoice') || lName.includes('bill') || lName.endsWith('.csv')) {
        setNewDocType('Invoice');
      } else if (lName.includes('contrat') || lName.includes('contract') || lName.includes('cc') || lName.includes('cdd') || lName.includes('cdi')) {
        setNewDocType('Contract');
      } else if (lName.includes('rapport') || lName.includes('report') || lName.includes('audit')) {
        setNewDocType('Report');
      }
    };
    reader.onerror = () => {
      setUploadError("Erreur lors de la lecture du fichier physique.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Submit complete document upload
  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || readOnly) return;

    let finalSize = "150 KB"; // Fallback estimation
    let finalBase64 = "data:text/plain;base64,U2ltdWxhdGVkIGZpbGUgZGF0YQ==";
    let finalType = "application/pdf";

    if (newDocFile) {
      const kb = newDocFile.size / 1024;
      if (kb >= 1024) {
        finalSize = `${(kb / 1024).toFixed(1)} MB`;
      } else {
        finalSize = `${kb.toFixed(0)} KB`;
      }
      if (newDocFile.base64) {
        finalBase64 = newDocFile.base64;
      }
      finalType = newDocFile.type || "application/octet-stream";
    }

    // Resolve binding name reference
    let boundName = "";
    if (newDocLinkType === 'Client') {
      const c = clients.find(cl => cl.id === newDocLinkId);
      boundName = c ? c.name : "";
    } else if (newDocLinkType === 'Employee') {
      const emp = employees.find(em => em.id === newDocLinkId);
      boundName = emp ? emp.name : "";
    }

    const nextDoc: GedDocument = {
      id: `doc_${Date.now()}`,
      name: newDocName,
      type: newDocType,
      fileSize: finalSize,
      fileType: finalType,
      base64Data: finalBase64,
      uploadDate: new Date().toISOString().split('T')[0],
      linkedToType: newDocLinkType,
      linkedToId: newDocLinkType !== 'None' ? newDocLinkId : undefined,
      linkedToName: newDocLinkType !== 'None' ? boundName : undefined,
      description: newDocDesc || undefined,
      version: 1,
      uploadedBy: currentUserEmail
    };

    onUpdateDocuments([...documents, nextDoc]);
    setIsUploadOpen(false);

    // Reset fields
    setNewDocName('');
    setNewDocType('Other');
    setNewDocLinkType('None');
    setNewDocLinkId('');
    setNewDocDesc('');
    setNewDocFile(null);
    setUploadError(null);
    setOcrResult(null);
    setOcrError(null);
    setIsOcrLoading(false);
  };

  // Handle document file deletion
  const handleDeleteDoc = (id: string) => {
    if (readOnly) return;
    if (confirm("Voulez-vous vraiment supprimer définitivement ce document de la base archivée ?")) {
      const updated = documents.filter(d => d.id !== id);
      onUpdateDocuments(updated);
    }
  };

  // Triggers virtual download of file
  const triggerDownload = (doc: GedDocument) => {
    const link = document.createElement('a');
    let hrefToUse = doc.base64Data;
    if (!hrefToUse || hrefToUse.startsWith('data:text/plain')) {
      hrefToUse = getValidMockBase64(doc);
    }
    link.href = hrefToUse;
    link.download = doc.name.includes('.') ? doc.name : `${doc.name}.${doc.fileType.split('/')[1] || 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocTypeIcon = (type: GedDocument['type']) => {
    switch (type) {
      case 'Invoice':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'Contract':
        return <FileCode className="w-4 h-4 text-indigo-600" />;
      case 'Report':
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div id="ged-manager-root" className="space-y-6">
      
      {/* Centered Greeting & Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight font-display flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-indigo-500/20 text-indigo-300 rounded text-xs select-none">MODULE GED</span>
            <span>Gestion Électronique des Documents Elyssa</span>
          </h2>
          <p className="text-xs text-slate-300">Classez, archivez et reliez vos pièces justificatives (factures, contrats, rapports) aux clients et collaborateurs.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            id="ged-trigger-upload-btn"
            onClick={() => setIsUploadOpen(true)}
            className="p-3 px-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Document</span>
          </button>
        )}
      </div>

      {/* KPI Overview Summary Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Documents Total</p>
            <h4 className="text-lg font-black text-slate-800 tracking-tight font-display">{stats.totalCount}</h4>
            <p className="text-[10px] text-slate-500">dont <strong>{stats.linkedCount}</strong> liés à des entités</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono font-sans">Espace Utilisé</p>
            <h4 className="text-lg font-black text-emerald-700 tracking-tight font-display">{stats.formattedSize}</h4>
            <p className="text-[10px] text-slate-400 font-mono">Quota local: 5.0 MB max</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Contrats signés</p>
            <h4 className="text-lg font-black text-slate-800 tracking-tight font-display">{stats.contractCount}</h4>
            <p className="text-[10px] text-slate-500">avec collaborateurs</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Factures & Justifs</p>
            <h4 className="text-lg font-black text-slate-800 tracking-tight font-display">{stats.invoiceCount + stats.reportCount}</h4>
            <p className="text-[10px] text-slate-500">Rapports & Règlements</p>
          </div>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom de fichier, collaborateur, client ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 md:flex items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-600 cursor-pointer"
            >
              <option value="All">Tous types de fichiers</option>
              <option value="Contract">Contrats RH</option>
              <option value="Invoice">Factures & Reçus</option>
              <option value="Report">Rapports d'Activité</option>
              <option value="Other">Autres Pièces</option>
            </select>

            {/* Target Link Type Filter */}
            <select
              value={linkFilter}
              onChange={(e) => {
                setLinkFilter(e.target.value as any);
                setSelectedEntityId('All');
              }}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-600 cursor-pointer"
            >
              <option value="All">Toutes les liaisons (GED)</option>
              <option value="Client">Lié aux Clients uniquement</option>
              <option value="Employee">Lié aux Collaborateurs</option>
              <option value="None">Documents non classés / Libres</option>
            </select>

            {/* Specific Client/Employee Filter if selected */}
            {['Client', 'Employee'].includes(linkFilter) && (
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-indigo-700 font-sans cursor-pointer animate-fade-in"
              >
                <option value="All">Tous les {linkFilter === 'Client' ? 'clients' : 'collaborateurs'}</option>
                {listDropdownFilterEntities.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Clear Filter Bar Indicators */}
        {(searchTerm || typeFilter !== 'All' || linkFilter !== 'All' || selectedEntityId !== 'All') && (
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 bg-indigo-50/50 p-2.5 px-3.5 rounded-xl border border-indigo-100">
            <span>
              Actuellement filtré : <strong>{filteredDocuments.length}</strong> documents correspondent à vos critères de recherche.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setLinkFilter('All');
                setSelectedEntityId('All');
              }}
              className="text-[10px] font-black uppercase text-indigo-700 hover:underline cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                <th className="p-3">Type</th>
                <th className="p-3">Nom du Document</th>
                <th className="p-3">Liaison GED</th>
                <th className="p-3">Taille</th>
                <th className="p-3">Date d'archivage</th>
                <th className="p-3">Auteur</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs text-medium">
                    Aucun document archivé ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(doc => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 border-b border-slate-100 text-xs text-slate-700 transition">
                      <td className="p-3 font-semibold">
                        <div className="p-2 bg-slate-50 rounded-lg inline-block">
                          {getDocTypeIcon(doc.type)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p id={`doc-name-${doc.id}`} className="font-extrabold text-slate-800">{doc.name}</p>
                          {doc.description && <p className="text-[10px] text-slate-400 truncate max-w-sm">{doc.description}</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        {doc.linkedToType === 'Client' && (
                          <span className="inline-flex items-center bg-emerald-50 text-emerald-800 gap-1.5 p-1 px-2.5 rounded-full text-[10px] font-black">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Client :</span>
                            <span className="opacity-90">{doc.linkedToName}</span>
                          </span>
                        )}
                        {doc.linkedToType === 'Employee' && (
                          <span className="inline-flex items-center bg-indigo-50 text-indigo-800 gap-1.5 p-1 px-2.5 rounded-full text-[10px] font-black">
                            <User className="w-3.5 h-3.5" />
                            <span>RH / Collab :</span>
                            <span className="opacity-90">{doc.linkedToName}</span>
                          </span>
                        )}
                        {doc.linkedToType === 'None' && (
                          <span className="inline-flex items-center bg-slate-100 text-slate-600 gap-1 p-1 px-2.5 rounded-full text-[10px] font-extrabold font-mono">
                            Document Libre
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-500">
                        {doc.fileSize}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {new Date(doc.uploadDate).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400 font-mono">
                        {doc.uploadedBy}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerDownload(doc)}
                            title="Télécharger le fichier physique"
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              title="Archiver / Supprimer de la GED"
                              className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over or Popup overlay form for adding new document */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden"
            >
              <div className="bg-slate-950 p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black font-display flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Archiver un document justificatif (GED)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Ajoutez une pièce et liez-la directement au tiers concerné.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitUpload} className="p-6 space-y-4">
                
                {/* Drag and Drop Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                    dragActive 
                      ? 'border-indigo-600 bg-indigo-50/40' 
                      : newDocFile 
                        ? 'border-emerald-555 bg-emerald-50/20' 
                        : 'border-slate-200 hover:border-indigo-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                  />

                  {newDocFile ? (
                    <div className="space-y-1.5 text-center">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full inline-block">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-extrabold text-slate-800 truncate max-w-sm">{newDocFile.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(newDocFile.size / 1024).toFixed(1)} KB • Type: {newDocFile.type || 'Inconnu'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewDocFile(null);
                          setOcrResult(null);
                          setOcrError(null);
                          setIsOcrLoading(false);
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer inline-block mt-1"
                      >
                        Retirer le fichier
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="p-2 bg-slate-100 text-slate-400 rounded-full inline-block">
                        <Upload className="w-5 h-5 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Déposez votre document ici ou cliquez pour choisir</p>
                      <p className="text-[10px] text-slate-400">PDF, JPG, PNG, XLS (1.8 Mo maximum pour le stockage local)</p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-[11px] font-bold rounded-xl border border-rose-100 flex items-start space-x-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* OCR AI Reading Panel */}
                {newDocFile && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Analyse de Facture par Elyssa OCR IA</h4>
                          <p className="text-[10px] text-slate-400">Extrayez automatiquement les montants HT, TVA, timbre fiscal et fournisseur</p>
                        </div>
                      </div>
                      
                      {!ocrResult && !isOcrLoading && (
                        <button
                          type="button"
                          onClick={runOcrAnalysis}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-[11px] font-extrabold hover:opacity-90 shadow-xs cursor-pointer transition-all shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Lancer l'OCR</span>
                        </button>
                      )}
                    </div>

                    {isOcrLoading && (
                      <div className="p-4 flex flex-col items-center justify-center space-y-2 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">Lecture intelligente de la pièce...</p>
                          <p className="text-[10px] text-slate-400">Extraction de la fiscalité et des montants en Dinars Tunisiens (TND)</p>
                        </div>
                      </div>
                    )}

                    {ocrError && (
                      <div className="p-3 bg-rose-50 text-rose-800 text-[11px] font-bold rounded-xl border border-rose-100 flex items-start space-x-1.5">
                        <span>⚠️</span>
                        <div className="flex-1">
                          <p className="font-extrabold text-xs">Échec de l'analyse OCR</p>
                          <p className="text-[10px] font-normal text-rose-600">{ocrError}</p>
                        </div>
                        <button type="button" onClick={runOcrAnalysis} className="text-[10px] font-black text-rose-800 hover:underline shrink-0">Réessayer</button>
                      </div>
                    )}

                    {ocrResult && (
                      <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-150 text-xs font-medium animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-100">
                            Données Extraites avec Succès
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            Confiance: {Math.round((ocrResult.confidence || 0.9) * 100)}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono">
                          <div className="col-span-2 flex justify-between font-sans">
                            <span className="text-slate-400 font-bold">Fournisseur :</span>
                            <span className="font-black text-slate-800">{ocrResult.supplier}</span>
                          </div>
                          
                          {ocrResult.invoiceNumber && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">N° Facture :</span>
                              <span className="font-bold text-slate-700">{ocrResult.invoiceNumber}</span>
                            </div>
                          )}

                          {ocrResult.date && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Date :</span>
                              <span className="font-bold text-slate-700">{ocrResult.date}</span>
                            </div>
                          )}

                          <div className="col-span-2 border-t my-1.5 border-slate-100"></div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">Base HT :</span>
                            <span className="font-bold text-slate-800">{(ocrResult.amountHT || 0).toFixed(3)} DT</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">TVA :</span>
                            <span className="font-bold text-slate-800">{(ocrResult.amountTVA || 0).toFixed(3)} DT</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Timbre :</span>
                            <span className="font-bold text-slate-800">{(ocrResult.taxStamp || 1.000).toFixed(3)} DT</span>
                          </div>

                          <div className="flex justify-between font-bold text-indigo-650">
                            <span className="font-sans">Total TTC :</span>
                            <span>{(ocrResult.amountTTC || 0).toFixed(3)} DT</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex justify-end gap-2 border-slate-100">
                          <button
                            type="button"
                            onClick={() => setOcrResult(null)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Effacer l'OCR
                          </button>
                          <button
                            type="button"
                            onClick={applyOcrResults}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer"
                          >
                            <span>✓ Pré-remplir les champs justificatifs</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Document metadata info form */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nom personnalisé du document</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Facture Poulina Achat Aliments FA-2026-10"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Type de Document</label>
                    <select
                      value={newDocType}
                      onChange={(e: any) => setNewDocType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="Contract">Contrat de Travail / RH</option>
                      <option value="Invoice">Facture / Pièce Comptable</option>
                      <option value="Report">Rapport / Audit</option>
                      <option value="Other">Autre justificatif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Liaison de Sécurité GED</label>
                    <select
                      value={newDocLinkType}
                      onChange={(e: any) => {
                        setNewDocLinkType(e.target.value);
                        setNewDocLinkId('');
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="None">Aucune liaison (Doc libre)</option>
                      <option value="Client">Associer à une fiche CLIENT</option>
                      <option value="Employee">Associer à un COLLABORATEUR</option>
                    </select>
                  </div>

                  {newDocLinkType !== 'None' && (
                    <div className="col-span-2 animate-fade-in">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Sélectionner le {newDocLinkType === 'Client' ? 'Client Elyssa' : 'Collaborateur RH'}
                      </label>
                      <select
                        required
                        value={newDocLinkId}
                        onChange={(e) => setNewDocLinkId(e.target.value)}
                        className="w-full p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="">-- Choisissez l'entité concernée --</option>
                        {targetDropdownEntities.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Description / Notes additionnelles</label>
                    <textarea
                      placeholder="Commentaires complémentaires facilitant l'indexation..."
                      value={newDocDesc}
                      onChange={(e) => setNewDocDesc(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="p-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-indigo-100"
                  >
                    Archiver & Lier l'élément
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
