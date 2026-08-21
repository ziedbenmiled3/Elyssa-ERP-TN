/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, CommercialEngagement } from '../types';
import { getValidMockBase64 } from '../utils/mockDynamicGed';
import { formatTND } from '../utils/calculations';
import IframePrintHelper from './IframePrintHelper';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Sparkles, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Trash2,
  Edit2,
  Printer,
  Paperclip,
  Download,
  Upload,
  FolderOpen,
  FileSpreadsheet,
  FileCode,
  X,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClientManagerProps {
  clients: Client[];
  onUpdateClients: (updatedClients: Client[]) => void;
  readOnly?: boolean;
  activeTenantId?: string;
  isDemoCompany?: boolean;
}

export const DEFAULT_DEMO_CLIENTS: Client[] = [
  {
    id: "demo-cli_1",
    name: "Société Tunisienne de Construction (STC)",
    matriculeFiscal: "0849203/A/M/000",
    email: "contact@stc-batiment.tn",
    phone: "+216 71 840 210",
    address: "Zone Industrielle Charguia II, Tunis",
    category: "Local",
    sector: "BTP & Gros Œuvre",
    revenuePotential: 85000,
    createdDate: "2026-01-10",
    status: "Active",
    engagements: [
      { id: "eng_1", title: "Livraison Chantier Les Berges du Lac", description: "Fourniture Ciment CPJ 45 et fers à béton", dueDate: "2026-08-25", status: "Pending", is_demo: true },
      { id: "eng_2", title: "Négociation remise annuelle grands comptes", description: "Revue des tarifs sur approvisionnement Q4", dueDate: "2026-09-01", status: "Pending", is_demo: true }
    ],
    notes: "Client fidèle de référence sur le Grand Tunis. Encours autorisé 50 000 TND.",
    is_demo: true
  },
  {
    id: "demo-cli_2",
    name: "Comptoir du Centre",
    matriculeFiscal: "1120489/B/P/000",
    email: "achats@comptoir-centre.tn",
    phone: "+216 73 220 180",
    address: "Avenue Léopold Senghor, Sousse",
    category: "Local",
    sector: "Distribution & Négoce Matériaux",
    revenuePotential: 45000,
    createdDate: "2026-02-15",
    status: "Active",
    engagements: [
      { id: "eng_3", title: "Réapprovisionnement Stock Peintures", description: "Envoi catalogue Astral et outillage", dueDate: "2026-08-28", status: "Pending", is_demo: true }
    ],
    notes: "Distributeur régional leader sur le Sahel. Règlements par traites à 60 jours.",
    is_demo: true
  },
  {
    id: "demo-cli_3",
    name: "Afrique Bâtiment",
    matriculeFiscal: "0994821/C/M/000",
    email: "direction@afrique-batiment.tn",
    phone: "+216 74 400 950",
    address: "Route de Gabès Km 3, Sfax",
    category: "Local",
    sector: "Entreprise Générale BTP",
    revenuePotential: 60000,
    createdDate: "2026-03-01",
    status: "Active",
    engagements: [
      { id: "eng_4", title: "Règlement Facture FAC-2026-003", description: "Suivi du dossier de recouvrement et promesse virement", dueDate: "2026-08-30", status: "Pending", is_demo: true }
    ],
    notes: "Grand chantier Sud en cours. Vigilance sur les délais de paiement.",
    is_demo: true
  }
];

export default function ClientManager({ 
  clients: incomingClients, 
  onUpdateClients, 
  readOnly = false,
  activeTenantId,
  isDemoCompany = false
}: ClientManagerProps) {
  // Strict check for Demo tenant vs Production tenant
  const isDemoTenant = React.useMemo(() => {
    if (isDemoCompany) return true;
    const tid = String(activeTenantId || localStorage.getItem('carthage_active_company') || '').toLowerCase().trim();
    if (tid.includes('parent') || tid.includes('prod') || tid === 'inter-affaires' || tid === 'company_parent' || tid === 'elyssa entreprises s.a.') {
      return false;
    }
    return tid === 'inter-affaires-demo' || tid === 'demo' || tid === 'company_demo' || tid.includes('démo') || tid.includes('demo') || tid.includes('sandbox');
  }, [activeTenantId, isDemoCompany]);

  // Direct state initialization: STRICT isolation (empty [] for PROD, demo only for demo tenants)
  const [clients, setClients] = useState<Client[]>(() => {
    if (!isDemoTenant) {
      try {
        localStorage.removeItem('carthage_demo_clients');
      } catch (_) {}
      return Array.isArray(incomingClients) 
        ? incomingClients.filter(c => !c.is_demo && !String(c.id || '').startsWith('demo-')) 
        : [];
    }
    if (Array.isArray(incomingClients) && incomingClients.length > 0) {
      return incomingClients;
    }
    return DEFAULT_DEMO_CLIENTS;
  });

  React.useEffect(() => {
    if (!isDemoTenant) {
      try {
        localStorage.removeItem('carthage_demo_clients');
      } catch (_) {}
      const sanitized = Array.isArray(incomingClients) 
        ? incomingClients.filter(c => !c.is_demo && !String(c.id || '').startsWith('demo-')) 
        : [];
      setClients(sanitized);
    } else if (Array.isArray(incomingClients) && incomingClients.length > 0) {
      setClients(incomingClients);
    }
  }, [incomingClients, isDemoTenant]);

  const updateClients = (updated: Client[]) => {
    setClients(updated);
    if (onUpdateClients) {
      onUpdateClients(updated);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Local' | 'Export'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUri = params.get('id');
    return idFromUri || clients[0]?.id || null;
  });

  // States for print support
  const [clientToDeleteInManager, setClientToDeleteInManager] = useState<Client | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocName, setPrintDocName] = useState('');
  const [printDocTab, setPrintDocTab] = useState('clients');
  const [printTarget, setPrintTarget] = useState('');
  const [printTargetId, setPrintTargetId] = useState('');

  // GED Document Local Integration State
  const [localDocs, setLocalDocs] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_documents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });
  
  // Fast Upload Mini Form states inside client details
  const [isAddingClientDoc, setIsAddingClientDoc] = useState(false);
  const [clientDocName, setClientDocName] = useState('');
  const [clientDocType, setClientDocType] = useState<'Invoice' | 'Contract' | 'Report' | 'Other'>('Invoice');
  const [clientDocFile, setClientDocFile] = useState<{ name: string; size: number; type: string; base64: string } | null>(null);
  const [clientDocFileError, setClientDocFileError] = useState<string | null>(null);

  // Forms State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCategory, setNewClientCategory] = useState<string>('Local');
  const [newClientSector, setNewClientSector] = useState('');
  const [newClientRevenue, setNewClientRevenue] = useState<number>(10000);
  const [newClientNotes, setNewClientNotes] = useState('');

  // Edit Fiche Client State
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientCategory, setEditClientCategory] = useState<string>('Local');
  const [editClientSector, setEditClientSector] = useState('');
  const [editClientRevenue, setEditClientRevenue] = useState<number>(10000);
  const [editClientNotes, setEditClientNotes] = useState('');

  // Commitment adding form state
  const [isAddingCommitment, setIsAddingCommitment] = useState(false);
  const [commitmentTitle, setCommitmentTitle] = useState('');
  const [commitmentDesc, setCommitmentDesc] = useState('');
  const [commitmentDueDate, setCommitmentDueDate] = useState('');

  // Selected client
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone,
      address: newClientAddress,
      category: newClientCategory,
      sector: newClientSector,
      revenuePotential: Number(newClientRevenue),
      engagements: [],
      status: 'Active',
      notes: newClientNotes,
      createdDate: new Date().toISOString().split('T')[0]
    };

    updateClients([...clients, newClient]);
    setSelectedClientId(newClient.id);
    setIsAddingClient(false);
    
    // reset form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
    setNewClientCategory('Local');
    setNewClientSector('');
    setNewClientRevenue(10000);
    setNewClientNotes('');
  };

  const startEditingClient = () => {
    if (!selectedClient) return;
    setEditClientName(selectedClient.name);
    setEditClientEmail(selectedClient.email || '');
    setEditClientPhone(selectedClient.phone || '');
    setEditClientAddress(selectedClient.address || '');
    setEditClientCategory(selectedClient.category || 'Local');
    setEditClientSector(selectedClient.sector || '');
    setEditClientRevenue(selectedClient.revenuePotential || 10000);
    setEditClientNotes(selectedClient.notes || '');
    setIsEditingClient(true);
    setIsAddingClient(false);
  };

  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !editClientName) return;

    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        return {
          ...c,
          name: editClientName,
          email: editClientEmail,
          phone: editClientPhone,
          address: editClientAddress,
          category: editClientCategory,
          sector: editClientSector,
          revenuePotential: Number(editClientRevenue),
          notes: editClientNotes
        };
      }
      return c;
    });

    updateClients(updated);
    setIsEditingClient(false);
  };

  const handleUpdateNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedClientId) return;
    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        return { ...c, notes: e.target.value };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleUpdateStatus = (status: 'Active' | 'Inactive') => {
    if (!selectedClientId) return;
    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        return { ...c, status };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !commitmentTitle) return;

    const newEng: CommercialEngagement = {
      id: `eng_${Date.now()}`,
      title: commitmentTitle,
      description: commitmentDesc,
      dueDate: commitmentDueDate || new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        return { ...c, engagements: [...(c.engagements || []), newEng] };
      }
      return c;
    });

    updateClients(updated);
    setIsAddingCommitment(false);
    setCommitmentTitle('');
    setCommitmentDesc('');
    setCommitmentDueDate('');
  };

  const handleToggleCommitmentStatus = (commitmentId: string, currentStatus: 'Pending' | 'Met' | 'Delayed') => {
    let nextStatus: 'Pending' | 'Met' | 'Delayed';
    if (currentStatus === 'Pending') nextStatus = 'Met';
    else if (currentStatus === 'Met') nextStatus = 'Delayed';
    else nextStatus = 'Pending';

    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        const updatedEngs = c.engagements.map(eng => {
          if (eng.id === commitmentId) {
            return { ...eng, status: nextStatus };
          }
          return eng;
        });
        return { ...c, engagements: updatedEngs };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleDeleteCommitment = (commitmentId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet engagement commercial ?')) return;
    const updated = clients.map(c => {
      if (c.id === selectedClientId) {
        return {
          ...c,
          engagements: c.engagements.filter(e => e.id !== commitmentId)
        };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const target = clients.find(c => c.id === clientId);
    if (target) {
      setClientToDeleteInManager(target);
    }
  };

  const confirmDeleteClient = () => {
    if (clientToDeleteInManager) {
      const remaining = clients.filter(c => c.id !== clientToDeleteInManager.id);
      updateClients(remaining);
      setSelectedClientId(remaining[0]?.id || null);
      setClientToDeleteInManager(null);
    }
  };

  const handleClientFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1.8 * 1024 * 1024) {
        setClientDocFileError("Fichier trop volumineux. Limite de 1.8 Mo maximum.");
        return;
      }
      setClientDocFileError(null);
      const r = new FileReader();
      r.onload = () => {
        setClientDocFile({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: r.result as string
        });
        if (!clientDocName) {
          setClientDocName(file.name.split('.').slice(0, -1).join('.'));
        }
      };
      r.readAsDataURL(file);
    }
  };

  const handleAddClientDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientDocName.trim() || !selectedClient) return;

    let fSize = "100 KB";
    let fBase64 = "data:text/plain;base64,VGVzdA==";
    let fType = "application/pdf";

    if (clientDocFile) {
      const kb = clientDocFile.size / 1024;
      fSize = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
      fBase64 = clientDocFile.base64;
      fType = clientDocFile.type || "application/pdf";
    }

    let sessionEmail = 'contact@elyssa.pro';
    try {
      const savedSession = localStorage.getItem('carthage_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.email) {
          sessionEmail = parsed.email;
        }
      }
    } catch (e) {}

    const newDoc = {
      id: `doc_${Date.now()}`,
      name: clientDocName,
      type: clientDocType,
      fileSize: fSize,
      fileType: fType,
      base64Data: fBase64,
      uploadDate: new Date().toISOString().split('T')[0],
      linkedToType: 'Client',
      linkedToId: selectedClient.id,
      linkedToName: selectedClient.name,
      description: `Pièce archivée via la Fiche Client de ${selectedClient.name}`,
      version: 1,
      uploadedBy: sessionEmail
    };

    const saved = localStorage.getItem('carthage_documents');
    let current: any[] = [];
    if (saved) {
      try { current = JSON.parse(saved); } catch (err) {}
    }
    const updated = [...current, newDoc];
    setLocalDocs(updated);
    localStorage.setItem('carthage_documents', JSON.stringify(updated));
    // Reset form
    setIsAddingClientDoc(false);
    setClientDocName('');
    setClientDocType('Invoice');
    setClientDocFile(null);
    setClientDocFileError(null);
  };

  const handleDeleteClientDoc = (id: string) => {
    if (confirm("Voulez-vous supprimer ce document lié de la GED ?")) {
      const saved = localStorage.getItem('carthage_documents');
      let current: any[] = [];
      if (saved) {
        try { current = JSON.parse(saved); } catch (err) {}
      }
      const updated = current.filter((d: any) => d.id !== id);
      setLocalDocs(updated);
      localStorage.setItem('carthage_documents', JSON.stringify(updated));
    }
  };

  // High-fidelity print handler
  const triggerPrint = (elementId: string, docName: string) => {
    // If we are printing a single client sheet, pass the client ID
    const targetIdVal = (elementId === 'printable-client-sheet' && selectedClientId) ? selectedClientId : '';

    const isIframe = window.self !== window.top;
    if (isIframe) {
      setPrintDocName(docName);
      setPrintDocTab('clients'); // tab associated with ClientManager in App.tsx is 'clients'
      setPrintTarget(elementId);
      setPrintTargetId(targetIdVal);
      setIsPrintModalOpen(true);
      return;
    }

    const printContent = document.getElementById(elementId);
    if (printContent) {
      const clone = printContent.cloneNode(true) as HTMLElement;
      clone.id = 'temp-print-root';
      clone.className = 'temp-print-root ' + (printContent.className || '').replace(/\bhidden\b/g, '');
      document.body.appendChild(clone);
      document.body.classList.add('print-mode-active');
      
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error('Print error:', e);
        } finally {
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

  // Filter clients
  const filteredClients = clients.filter(c => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(searchLower) || 
                          (c.sector || '').toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'All' ? true : c.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Filter and List */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-150 shadow-sm p-4 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-base">Fiches Clients ({filteredClients.length})</h3>
          {!readOnly && (
            <button 
              onClick={() => { setIsAddingClient(true); setIsEditingClient(false); }}
              className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Rechercher Poulina, Sousse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catégorie</label>
            <select 
              value={categoryFilter}
              onChange={(e: any) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1"
            >
              <option value="All">Toutes</option>
              <option value="Local">Locale (TND)</option>
              <option value="Export">Exportation</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Statut</label>
            <select 
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1"
            >
              <option value="All">Tous</option>
              <option value="Active">Actif</option>
              <option value="Inactive">Inactif</option>
            </select>
          </div>
        </div>

        {/* Print Filtered Listing */}
        <button
          onClick={() => triggerPrint('printable-client-list', `Listing Clients - ${filteredClients.length} Sociétés`)}
          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-indigo-100 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimer le Listing ({filteredClients.length})</span>
        </button>

        {/* Client List */}
        <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
          {filteredClients.map(c => {
            const isSelected = c.id === selectedClientId;
            return (
              <div 
                key={c.id}
                onClick={() => { setSelectedClientId(c.id); setIsAddingClient(false); setIsEditingClient(false); }}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col space-y-1 ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800 text-xs truncate flex items-center gap-1">
                    {c.name}
                    {c.id.startsWith('demo-') && (
                      <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                    )}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    c.category === 'Export' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {c.category}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="truncate max-w-[120px]">{c.sector}</span>
                  <span className={`font-semibold ${c.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {c.status === 'Active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400">Aucun client trouvé.</div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed View / Add client Form */}
      <div className="lg:col-span-2 space-y-6">
        {isAddingClient ? (
          /* ADD NEW CLIENT FORM */
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Créer une nouvelle Fiche Client</h3>
            <form onSubmit={handleAddClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Nom de la Société *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="SOPAT, SFBT, STEG..."
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Secteur d'activité</label>
                  <input 
                    type="text" 
                    placeholder="Agro-alimentaire, Cimenterie, Retail..."
                    value={newClientSector}
                    onChange={(e) => setNewClientSector(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">E-mail</label>
                  <input 
                    type="email" 
                    placeholder="achats@société.com.tn"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Téléphone</label>
                  <input 
                    type="text" 
                    placeholder="+216 71 000 000"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Catégorie fiscale</label>
                  <select 
                    value={newClientCategory}
                    onChange={(e: any) => setNewClientCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="Local">Locale (Soumise à TVA tunisienne standard)</option>
                    <option value="Export">Exportation (Suspensif de taxes ou détaxes)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Potentiel de revenu annuel (TND)</label>
                  <input 
                    type="number" 
                    value={newClientRevenue}
                    onChange={(e) => setNewClientRevenue(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Adresse Complète</label>
                <input 
                  type="text" 
                  placeholder="Zone Industrielle Charguia, Tunis"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Commentaires initiaux / Profil</label>
                <textarea 
                  rows={3}
                  placeholder="Focaliser sur cet aspect de..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsAddingClient(false)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
                >
                  Enregistrer la Fiche
                </button>
              </div>
            </form>
          </div>
        ) : isEditingClient ? (
          /* EDIT CLIENT FORM */
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Modifier la Fiche Client</h3>
            <form onSubmit={handleEditClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Nom de la Société *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="SOPAT, SFBT, STEG..."
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Secteur d'activité</label>
                  <input 
                    type="text" 
                    placeholder="Agro-alimentaire, Cimenterie, Retail..."
                    value={editClientSector}
                    onChange={(e) => setEditClientSector(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">E-mail</label>
                  <input 
                    type="email" 
                    placeholder="achats@société.com.tn"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Téléphone</label>
                  <input 
                    type="text" 
                    placeholder="+216 71 000 000"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Catégorie fiscale</label>
                  <select 
                    value={editClientCategory}
                    onChange={(e: any) => setEditClientCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="Local">Locale (Soumise à TVA tunisienne standard)</option>
                    <option value="Export">Exportation (Suspensif de taxes ou détaxes)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Potentiel de revenu annuel (TND)</label>
                  <input 
                    type="number" 
                    value={editClientRevenue}
                    onChange={(e) => setEditClientRevenue(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Adresse Complète</label>
                <input 
                  type="text" 
                  placeholder="Zone Industrielle Charguia, Tunis"
                  value={editClientAddress}
                  onChange={(e) => setEditClientAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Commentaires / Profil</label>
                <textarea 
                  rows={3}
                  placeholder="Focaliser sur cet aspect de..."
                  value={editClientNotes}
                  onChange={(e) => setEditClientNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsEditingClient(false)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        ) : selectedClient ? (
          /* DETAILED CLIENT SHEET */
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 p-2.5 rounded-lg text-indigo-700">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                      {selectedClient.name}
                      {selectedClient.id.startsWith('demo-') && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.5 rounded uppercase leading-none">Démo</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">{selectedClient.sector} — Créé le {selectedClient.createdDate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => triggerPrint('printable-client-sheet', `Fiche Client - ${selectedClient.name}`)}
                    className="p-1 px-3 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-750 font-bold border border-indigo-150 rounded text-xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer la Fiche</span>
                  </button>
                  {!readOnly && (
                    <>
                      <button 
                        onClick={startEditingClient}
                        className="p-1 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs transition flex items-center space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(selectedClient.status === 'Active' ? 'Inactive' : 'Active')}
                        className={`text-[10px] uppercase font-bold px-3 py-1 rounded transition ${
                          selectedClient.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        Marquer {selectedClient.status === 'Active' ? 'Inactif' : 'Actif'}
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(selectedClient.id)}
                        className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Data Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span><strong>Email:</strong> {selectedClient.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span><strong>Tel:</strong> {selectedClient.phone || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate"><strong>Adresse:</strong> {selectedClient.address}</span>
                  </div>
                </div>

                <div className="space-y-2.5 md:border-l md:pl-4">
                  <div className="flex items-center justify-between text-slate-600">
                    <span><strong>Régime fiscal :</strong></span>
                    <span className="font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedClient.category === 'Export' ? 'Exonéré / Export' : 'Locale (TND)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span><strong>Potentiel commercial :</strong></span>
                    <span className="font-bold text-slate-800">
                      {formatTND(selectedClient.revenuePotential)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Notes Segment */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">Commentaire interne & Notes de coordination :</label>
                <textarea 
                  rows={2}
                  value={selectedClient.notes}
                  onChange={handleUpdateNotes}
                  placeholder="Écrire les points d'alerte ou notes d'historique..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Commitments & Agreements Section */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Respect des Engagements Commerciaux</h3>
                  <p className="text-[11px] text-slate-400">Cliquez sur un engagement pour faire basculer son statut (En cours ➔ Honoré ➔ En retard).</p>
                </div>
                <button 
                  onClick={() => setIsAddingCommitment(!isAddingCommitment)}
                  className="p-1 px-3 border border-slate-200 rounded duration-100 text-xs text-indigo-600 hover:bg-slate-50 font-bold"
                >
                  {isAddingCommitment ? 'Fermer' : 'Ajouter Eng.'}
                </button>
              </div>

              {isAddingCommitment && (
                <form onSubmit={handleAddCommitment} className="p-3 bg-indigo-50/50 rounded-lg text-xs space-y-3">
                  <span className="font-bold text-slate-700">Nouvel Engagement</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-medium">Titre de l'engagement *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Taux de service de 98%..."
                        value={commitmentTitle}
                        onChange={(e) => setCommitmentTitle(e.target.value)}
                        className="w-full p-1.5 border rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-medium">Échéance de respect</label>
                      <input 
                        type="date" 
                        value={commitmentDueDate}
                        onChange={(e) => setCommitmentDueDate(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-medium">Description de l'obligation</label>
                    <textarea 
                      placeholder="Spécifications de livraison ou de support technique..."
                      value={commitmentDesc}
                      onChange={(e) => setCommitmentDesc(e.target.value)}
                      rows={2}
                      className="w-full p-1.5 border rounded"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCommitment(false)}
                      className="p-1.5 border rounded text-slate-500 font-semibold"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="p-1.5 bg-indigo-600 text-white rounded font-bold"
                    >
                      Enregistrer cet engagement
                    </button>
                  </div>
                </form>
              )}

              {/* Commitments list */}
              <div className="space-y-3">
                {(!selectedClient.engagements || selectedClient.engagements.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                    Aucun engagement contractuel particulier n'est encore enregistré pour ce client.
                  </div>
                ) : (
                  selectedClient.engagements.map(eng => {
                    const statusColors = {
                      Pending: 'bg-blue-100 text-blue-800 border-blue-200',
                      Met: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Delayed: 'bg-rose-100 text-rose-800 border-rose-200'
                    };
                    const statusLabels = {
                      Pending: 'En attente',
                      Met: 'Respecté / Honoré',
                      Delayed: 'En retard'
                    };
                    return (
                      <div 
                        key={eng.id}
                        className="p-3 border border-slate-100 rounded-lg flex items-start justify-between bg-slate-50/50 hover:bg-slate-50"
                      >
                        <div 
                          onClick={() => handleToggleCommitmentStatus(eng.id, eng.status)}
                          className="flex-1 cursor-pointer pr-4"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-xs">{eng.title}</span>
                            <span className={`text-[10px] px-2 py-0.2 border rounded-full font-semibold ${statusColors[eng.status]}`}>
                              {statusLabels[eng.status]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{eng.description || "Aucune description"}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Échéance de livraison/acte: {eng.dueDate}</p>
                        </div>

                        <button 
                          onClick={() => handleDeleteCommitment(eng.id)}
                          className="text-slate-300 hover:text-red-500 mt-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* INTEGRATED GED - PIÈCES JUSTIFICATIVES CLIENT CARD */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>Dossier Numérique & Pièces Jointes (GED)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Classer les factures, contrats ou rapports d'audits propres à ce client.</p>
                </div>
                {!readOnly && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingClientDoc(!isAddingClientDoc);
                      // Force refresh doc list
                      const saved = localStorage.getItem('carthage_documents');
                      if (saved) {
                        try { setLocalDocs(JSON.parse(saved)); } catch (e) {}
                      }
                    }}
                    className="p-1 px-3 border border-indigo-200 rounded text-xs text-indigo-600 hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isAddingClientDoc ? 'Fermer' : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Rattacher un doc</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isAddingClientDoc && (
                <form onSubmit={handleAddClientDoc} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-1.5">Nouveau document GED pour {selectedClient.name}</span>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fichier physique à téléverser *</label>
                      <input 
                        type="file" 
                        required
                        onChange={handleClientFileLoad}
                        accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                        className="w-full bg-white p-2 border border-slate-200 rounded cursor-pointer text-xs"
                      />
                      {clientDocFileError && <p className="text-[10px] text-rose-600 font-bold mt-1">⚠️ {clientDocFileError}</p>}
                      {clientDocFile && (
                        <p className="text-[10px] text-emerald-700 font-extrabold mt-1">
                          ✓ Prêt: {clientDocFile.name} ({(clientDocFile.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom d'indexation du fichier *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Facture d'acompte conteneurs"
                          value={clientDocName}
                          onChange={(e) => setClientDocName(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type de Document *</label>
                        <select
                          value={clientDocType}
                          onChange={(e: any) => setClientDocType(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded cursor-pointer"
                        >
                          <option value="Invoice">Facture / Pièce Comptable</option>
                          <option value="Contract">Contrat Commercial / Commande</option>
                          <option value="Report">Rapport Logistique / Terrain</option>
                          <option value="Other">Autre justificatif</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingClientDoc(false)}
                      className="p-1.5 px-3 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-black cursor-pointer"
                    >
                      Indexer & Attacher
                    </button>
                  </div>
                </form>
              )}

              {/* Document List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {localDocs.filter(d => d.linkedToType === 'Client' && d.linkedToId === selectedClient.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-100 rounded-lg">
                    Aucune pièce justificative GED n'est rattachée à cette fiche client pour le moment.
                  </p>
                ) : (
                  localDocs
                    .filter(d => d.linkedToType === 'Client' && d.linkedToId === selectedClient.id)
                    .map(doc => {
                      const triggerDownloadLocal = (curr: any) => {
                        const link = document.createElement('a');
                        let hrefToUse = curr.base64Data;
                        if (!hrefToUse || hrefToUse.startsWith('data:text/plain')) {
                          hrefToUse = getValidMockBase64(curr);
                        }
                        link.href = hrefToUse;
                        link.download = curr.name.includes('.') ? curr.name : `${curr.name}.${curr.fileType.split('/')[1] || 'pdf'}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };

                      return (
                        <div 
                          key={doc.id}
                          className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                              {doc.type === 'Invoice' && <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                              {doc.type === 'Contract' && <FileCode className="w-4 h-4 text-indigo-600" />}
                              {doc.type === 'Report' && <FileText className="w-4 h-4 text-amber-600" />}
                              {doc.type === 'Other' && <Paperclip className="w-4 h-4 text-slate-500" />}
                            </div>
                            <div className="truncate">
                              <p className="font-extrabold text-slate-800 text-xs truncate max-w-xs">{doc.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono">
                                Archivé: {doc.uploadDate} • {doc.fileSize}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => triggerDownloadLocal(doc)}
                              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                              title="Télécharger la pièce archive"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClientDoc(doc.id)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                title="Délié / Supprimer de la GED"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-150 p-10 text-center text-slate-400 text-xs">
            Sélectionnez une fiche client à gauche pour voir son dossier et ses engagements de livraison, ou créez-en un nouveau.
          </div>
        )}
      </div>

      {/* ==================== PRINT TEMPLATES (SCREEN HIDDEN, PRINT VISIBLE) ==================== */}
      
      {/* 1. Printed Client Profile Sheet */}
      {selectedClient && (
        <div id="printable-client-sheet" className="hidden">
          <div className="p-8 bg-white text-slate-900 space-y-6">
            {/* Header */}
            <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">ELYSSA CRM - FICHE CLIENT</h1>
                <p className="text-[10px] text-slate-400 font-mono">Généré le {new Date().toLocaleDateString('fr-FR')} - Confidentialité Élevée</p>
              </div>
              <div className="text-right">
                <span className="p-1 px-3 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-700 font-extrabold text-[10px] uppercase font-mono">
                  {selectedClient.category === 'Export' ? 'Société Exportatrice' : 'Régime Local'}
                </span>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Informations Générales</h3>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-xs">
                  <p><strong>Raison Sociale :</strong> <span className="font-bold text-slate-800 text-sm">{selectedClient.name}</span></p>
                  <p><strong>Secteur d'Activité :</strong> {selectedClient.sector || "Non renseigné"}</p>
                  <p><strong>Création Système :</strong> {selectedClient.createdDate}</p>
                  <p><strong>Statut :</strong> {selectedClient.status === 'Active' ? 'Actif' : 'Inactif'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Coordonnées de Contact</h3>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-xs">
                  <p><strong>E-mail :</strong> {selectedClient.email || "Non renseigné"}</p>
                  <p><strong>Téléphone :</strong> {selectedClient.phone || "Non renseigné"}</p>
                  <p><strong>Adresse Complète :</strong> {selectedClient.address || "Non renseigné"}</p>
                  <p><strong>Potentiel Annuel :</strong> <span className="font-bold text-emerald-700">{formatTND(selectedClient.revenuePotential || 0)}</span></p>
                </div>
              </div>
            </div>

            {/* Comments & Notes */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Notes de Suivi & Profiling</h3>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs italic text-slate-600 leading-relaxed min-h-[80px]">
                {selectedClient.notes || "Aucun commentaire interne enregistré."}
              </div>
            </div>

            {/* Commitments list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Engagements Commerciaux Référencés ({selectedClient.engagements?.length || 0})</h3>
              {(!selectedClient.engagements || selectedClient.engagements.length === 0) ? (
                <p className="text-xs text-slate-450 italic p-3 bg-slate-50 rounded-lg">Aucun engagement contractuel actif.</p>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Intitulé</th>
                        <th className="p-3">Description / Spécifications</th>
                        <th className="p-3">Échéance</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {selectedClient.engagements.map(eng => (
                        <tr key={eng.id}>
                          <td className="p-3 font-bold text-slate-800">{eng.title}</td>
                          <td className="p-3 text-slate-500">{eng.description || "-"}</td>
                          <td className="p-3 font-semibold text-slate-600">{eng.dueDate}</td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-[9px] uppercase text-slate-700">
                              {eng.status === 'Met' ? 'Honoré' : eng.status === 'Delayed' ? 'En retard' : 'En cours'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Page Footer for print */}
            <div className="pt-12 text-center text-[10px] text-slate-400 border-t border-dashed mt-auto">
              <p>Elyssa CRM - Système de Pilotage Intelligent & Suivi Clientèle</p>
              <p className="mt-0.5">Ce document constitue une fiche d'information interne et ne peut être divulguée à des tiers sans accord écrit.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Printed Client Filtered List */}
      <div id="printable-client-list" className="hidden">
        <div className="p-8 bg-white text-slate-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ELYSSA CRM - LISTING CLIENTELE</h1>
              <p className="text-[10px] text-slate-400 font-mono">
                Filtres : Cat. {categoryFilter === 'All' ? 'Toutes' : categoryFilter} | Statut {statusFilter === 'All' ? 'Tous' : statusFilter === 'Active' ? 'Actifs' : 'Inactifs'} 
                {searchTerm ? ` | Recherche: "${searchTerm}"` : ''} — Généré le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-xs text-slate-505 font-mono">
                Total : {filteredClients.length} clients
              </span>
            </div>
          </div>

          {/* Table Listing */}
          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Société</th>
                  <th className="p-3">Activité / Secteur</th>
                  <th className="p-3">Régime</th>
                  <th className="p-3">Coordonnées</th>
                  <th className="p-3">Potentiel (TND)</th>
                  <th className="p-3 text-center">Création</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {filteredClients.map(c => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3 text-slate-550">{c.sector || 'N/A'}</td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-600">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-3 leading-tight">
                      <div className="font-mono text-[10px]">{c.email || '-'}</div>
                      <div className="text-slate-400 text-[10px]">{c.phone || '-'}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-700">{formatTND(c.revenuePotential)}</td>
                    <td className="p-3 text-center text-slate-400 font-mono text-[10px]">{c.createdDate}</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold text-slate-700">
                        {c.status === 'Active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-[10px] text-slate-400 border-t border-dashed">
            <p>Elyssa CRM - Listing Interne Clients - Confidentiel</p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!clientToDeleteInManager}
        onClose={() => setClientToDeleteInManager(null)}
        onConfirm={confirmDeleteClient}
        title="Supprimer la fiche client ?"
        subtitle="SUPPRESSION CLIENT CRM"
        type="danger"
        confirmText="Supprimer Définitivement"
        cancelText="Annuler"
        message={
          <>Êtes-vous sûr de vouloir supprimer définitivement la fiche client <strong className="text-white">{clientToDeleteInManager?.name}</strong> ? Cette opération effacera également l'historique d'engagements commerciaux.</>
        }
        details={clientToDeleteInManager ? [
          { label: "Nom de la société / client", value: <span className="text-slate-200">{clientToDeleteInManager.name}</span> },
          { label: "Secteur", value: <span className="text-indigo-400 font-bold">{clientToDeleteInManager.sector || clientToDeleteInManager.category}</span> },
          { label: "Potentiel CA", value: <span className="text-emerald-400 font-mono font-bold">{formatTND(clientToDeleteInManager.revenuePotential)}</span> },
        ] : []}
      />

      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={printDocTab}
        documentName={printDocName}
        printTarget={printTarget}
        targetId={printTargetId}
      />
    </div>
  );
}
