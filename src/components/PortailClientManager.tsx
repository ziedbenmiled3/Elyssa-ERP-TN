import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  FolderLock, 
  Printer, 
  Eye, 
  Download, 
  Send,
  Lock,
  Palette,
  Bell
} from 'lucide-react';
import { Client, Invoice } from '../types';
import { formatTND } from '../utils/calculations';
import IframePrintHelper from './IframePrintHelper';

interface PortailClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  companyName?: string;
}

export default function PortailClientManager({ clients, invoices, companyName = "Elyssa ERP" }: PortailClientManagerProps) {
  // Portal customization settings
  const [portalTheme, setPortalTheme] = useState<'indigo' | 'emerald' | 'blue' | 'rose' | 'amber'>('emerald');
  const [welcomeText, setWelcomeText] = useState('Bienvenue sur votre espace client sécurisé. Consultez vos factures et suivez vos paiements en toute autonomie.');
  const [supportEmail, setSupportEmail] = useState('compta@elyssa-erp.tn');
  const [allowOnlineRequests, setAllowOnlineRequests] = useState(true);

  // Simulated active client viewing the portal
  const activeClients = clients.filter(c => c.status === 'Active');
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClients[0]?.id || '');
  
  // Tab within the client portal simulation
  const [portalTab, setPortalTab] = useState<'factures' | 'paiements' | 'documents' | 'demandes'>('factures');

  // Client requests/tickets state
  const [requests, setRequests] = useState([
    { id: 'req1', clientId: activeClients[0]?.id || '1', subject: 'Demande d\'échéancier de paiement', date: '2026-06-20', status: 'Solved', message: 'Serait-il possible de payer la facture F-2026-004 en deux fois ?', reply: 'Demande accordée. Échéances fixées au 15 Juillet et 15 Août.' },
    { id: 'req2', clientId: activeClients[0]?.id || '1', subject: 'Erreur sur le taux de retenue', date: '2026-07-02', status: 'Pending', message: 'Le taux appliqué sur la retenue est de 1.5% au lieu de 1%. Merci de rectifier.', reply: '' }
  ]);
  const [newRequestSubject, setNewRequestSubject] = useState('');
  const [newRequestMessage, setNewRequestMessage] = useState('');

  // Selected client details
  const currentClient = clients.find(c => c.id === selectedClientId) || activeClients[0];
  const clientInvoices = invoices.filter(inv => inv.clientId === selectedClientId);

  // Shared documents simulator
  const [sharedDocs] = useState([
    { id: 'doc1', title: 'Relevé de Compte Client - Q2 2026.pdf', date: '2026-07-01', size: '1.2 MB' },
    { id: 'doc2', title: 'Rib de la société - Elyssa ERP.pdf', date: '2026-01-15', size: '420 KB' },
    { id: 'doc3', title: 'Attestation d\'Exonération de TVA active.pdf', date: '2026-03-10', size: '1.8 MB' }
  ]);

  // Printing help states
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const getThemeClasses = () => {
    switch (portalTheme) {
      case 'indigo':
        return {
          bg: 'bg-indigo-950/30',
          border: 'border-indigo-500/20',
          text: 'text-indigo-400',
          btn: 'bg-indigo-650 hover:bg-indigo-600 border-indigo-500 text-white',
          accent: 'indigo'
        };
      case 'blue':
        return {
          bg: 'bg-blue-950/30',
          border: 'border-blue-500/20',
          text: 'text-blue-400',
          btn: 'bg-blue-650 hover:bg-blue-600 border-blue-500 text-white',
          accent: 'blue'
        };
      case 'rose':
        return {
          bg: 'bg-rose-950/30',
          border: 'border-rose-500/20',
          text: 'text-rose-400',
          btn: 'bg-rose-650 hover:bg-rose-600 border-rose-500 text-white',
          accent: 'rose'
        };
      case 'amber':
        return {
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/20',
          text: 'text-amber-400',
          btn: 'bg-amber-600 hover:bg-amber-550 border-amber-500 text-slate-950',
          accent: 'amber'
        };
      case 'emerald':
      default:
        return {
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/20',
          text: 'text-emerald-400',
          btn: 'bg-emerald-650 hover:bg-emerald-600 border-emerald-550 text-slate-950',
          accent: 'emerald'
        };
    }
  };

  const activeTheme = getThemeClasses();

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestSubject || !newRequestMessage) return;
    setRequests([
      ...requests,
      {
        id: Date.now().toString(),
        clientId: selectedClientId,
        subject: newRequestSubject,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        message: newRequestMessage,
        reply: ''
      }
    ]);
    setNewRequestSubject('');
    setNewRequestMessage('');
  };

  const handlePrint = (inv: Invoice) => {
    setPrintInvoice(inv);
    setIsPrintOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans">
        <div>
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Portail Client Libre-Service
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100">
            Espace Client Collaboratif (Portail)
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
            Gérez la configuration de marque de votre espace client en libre-service et simulez l'environnement auquel vos clients accèdent en toute autonomie.
          </p>
        </div>
      </div>

      {/* WORKSPACE SECTIONS: CONFIGURATION (Left) vs CLIENT PORTAL SIMULATION (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* LEFT COLUMN: BRANDING & PARAMETERS */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">1. Personnalisation Visuelle</h3>
            </div>

            {/* Colors picker */}
            <div className="space-y-2">
              <label className="block text-[9.5px] font-black uppercase text-slate-300">Couleur Primaire de l'Espace</label>
              <div className="flex gap-2">
                {(['emerald', 'indigo', 'blue', 'rose', 'amber'] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => setPortalTheme(color)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      portalTheme === color 
                        ? 'border-white scale-110' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    } ${
                      color === 'emerald' ? 'bg-emerald-500' :
                      color === 'indigo' ? 'bg-indigo-500' :
                      color === 'blue' ? 'bg-blue-500' :
                      color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Welcome text editor */}
            <div className="space-y-2">
              <label className="block text-[9.5px] font-black uppercase text-slate-300">Message de Bienvenue aux Clients</label>
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={3}
                className="w-full bg-slate-850 border border-slate-750 p-2 text-xs rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Support Email */}
            <div className="space-y-2">
              <label className="block text-[9.5px] font-black uppercase text-slate-300">Email du Support de Facturation</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-850 border border-slate-750 p-2 text-xs rounded-xl text-white font-mono"
              />
            </div>

            {/* Toggle features */}
            <div className="space-y-3 pt-2">
              <label className="block text-[9.5px] font-black uppercase text-slate-300 border-b border-slate-800 pb-1">Fonctionnalités Autorisées</label>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={allowOnlineRequests}
                  onChange={(e) => setAllowOnlineRequests(e.target.checked)}
                  className="rounded bg-slate-850 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-slate-300">Autoriser les réclamations & demandes en ligne</span>
              </label>
            </div>
          </div>

          {/* SIMULATION CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">2. Choisir un Client à Simuler</h3>
            </div>
            
            <p className="text-[10px] text-slate-400">Sélectionnez l'un de vos clients actifs de votre base CRM d'Elyssa ERP pour voir exactement comment l'espace se configure pour lui.</p>
            
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white font-medium"
            >
              {activeClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <div className="bg-blue-950/20 border border-blue-900/30 p-3 rounded-lg text-[10px] text-slate-400">
              📌 Le client reçoit un email sécurisé avec une clé d'accès tokenisée unique pour s'authentifier directement à son portail sans mot de passe complexe (Connexion par lien magique).
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATED LIVE PORTAL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            {/* PORTAL SIMULATION FRAME HEADER */}
            <div className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full bg-${portalTheme === 'amber' ? 'amber' : portalTheme === 'emerald' ? 'emerald' : portalTheme}-500`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Visualisation Portail Client</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] bg-slate-850 px-2 py-1 rounded border border-slate-750 text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400 mr-1" />
                <span>HTTPS://{currentClient?.name.toLowerCase().replace(/\s+/g, '-')}.client-elyssa.tn</span>
              </div>
            </div>

            {/* PORTAL WORKSPACE BODY */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                {/* WELCOME BAR */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-black text-white">Espace Client - {currentClient?.name}</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">{welcomeText}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold ${activeTheme.bg} ${activeTheme.text} border ${activeTheme.border} shrink-0`}>
                    <Bell className="w-3.5 h-3.5 animate-bounce" /> {clientInvoices.filter(i => i.status === 'Unpaid').length} Factures Impayées
                  </div>
                </div>

                {/* PORTAL NAV */}
                <div className="flex gap-1 border-b border-slate-800 pb-0.5 mb-5 overflow-x-auto">
                  <button
                    onClick={() => setPortalTab('factures')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                      portalTab === 'factures' 
                        ? `border-${portalTheme === 'amber' ? 'amber-500 text-amber-500' : portalTheme === 'emerald' ? 'emerald-400 text-emerald-400' : portalTheme + '-400 text-' + portalTheme + '-400'}` 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Factures en cours
                  </button>
                  <button
                    onClick={() => setPortalTab('paiements')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                      portalTab === 'paiements' 
                        ? `border-${portalTheme === 'amber' ? 'amber-500 text-amber-500' : portalTheme === 'emerald' ? 'emerald-400 text-emerald-400' : portalTheme + '-400 text-' + portalTheme + '-400'}` 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Historique Paiements
                  </button>
                  <button
                    onClick={() => setPortalTab('documents')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                      portalTab === 'documents' 
                        ? `border-${portalTheme === 'amber' ? 'amber-500 text-amber-500' : portalTheme === 'emerald' ? 'emerald-400 text-emerald-400' : portalTheme + '-400 text-' + portalTheme + '-400'}` 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Documents Partagés
                  </button>
                  <button
                    onClick={() => setPortalTab('demandes')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                      portalTab === 'demandes' 
                        ? `border-${portalTheme === 'amber' ? 'amber-500 text-amber-500' : portalTheme === 'emerald' ? 'emerald-400 text-emerald-400' : portalTheme + '-400 text-' + portalTheme + '-400'}` 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Demandes & Support
                  </button>
                </div>

                {/* PORTAL CONTENT WINDOW */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl min-h-[250px]">
                  
                  {/* A. FACTURES VIEW */}
                  {portalTab === 'factures' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10.5px] uppercase font-black text-slate-400">
                        <span>Consulter & Imprimer vos Factures</span>
                        <span>Total facturé : {formatTND(clientInvoices.reduce((sum, inv) => sum + inv.amountTTC, 0))}</span>
                      </div>

                      <div className="space-y-2.5">
                        {clientInvoices.length > 0 ? (
                          clientInvoices.map(inv => (
                            <div key={inv.id} className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white">{inv.invoiceNumber}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                    inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                                  }`}>
                                    {inv.status === 'Paid' ? 'Encaissée' : 'Impayée / Échue'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">Éditée le : {inv.issuedDate}</p>
                              </div>

                              <div className="flex items-center gap-4 font-mono">
                                <span className="text-xs font-bold text-slate-100">{formatTND(inv.amountTTC)}</span>
                                <button
                                  onClick={() => handlePrint(inv)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                                  title="Consulter et Imprimer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400">Aucune facture émise pour ce client à ce jour.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* B. PAIEMENTS VIEW */}
                  {portalTab === 'paiements' && (
                    <div className="space-y-4">
                      <div className="text-[10.5px] uppercase font-black text-slate-400 mb-2">Suivi complet de vos Encaissements</div>
                      
                      <div className="space-y-2">
                        {clientInvoices.filter(i => i.status === 'Paid').map(inv => (
                          <div key={inv.id} className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-900 border border-slate-750 text-emerald-400 rounded-lg">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white">Encaissement Validé</p>
                                <p className="text-[9.5px] text-slate-500 font-mono">Facture {inv.invoiceNumber} • Reçu le {inv.issuedDate}</p>
                              </div>
                            </div>

                            <div className="text-right font-mono">
                              <span className="font-bold text-emerald-400">+{formatTND(inv.amountNetToPay || inv.amountTTC)}</span>
                              <span className="block text-[9px] text-slate-500">Crédité au Compte de Caisse</span>
                            </div>
                          </div>
                        ))}

                        {clientInvoices.filter(i => i.status === 'Paid').length === 0 && (
                          <div className="text-center py-8 text-xs text-slate-400">Aucun encaissement validé enregistré sur ce compte.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* C. DOCUMENTS PARTAGES VIEW */}
                  {portalTab === 'documents' && (
                    <div className="space-y-4">
                      <div className="text-[10.5px] uppercase font-black text-slate-400 mb-2">Documents mis à disposition par le fournisseur</div>

                      <div className="space-y-2">
                        {sharedDocs.map(doc => (
                          <div key={doc.id} className="bg-slate-850 p-3 rounded-xl border border-slate-750 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-900 border border-slate-750 text-amber-500 rounded-lg">
                                <FolderLock className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white">{doc.title}</p>
                                <p className="text-[9.5px] text-slate-500">Déposé le {doc.date} • Taille : {doc.size}</p>
                              </div>
                            </div>

                            <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* D. DEMANDES & TICKETS VIEW */}
                  {portalTab === 'demandes' && (
                    <div className="space-y-4">
                      {allowOnlineRequests ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* List requests */}
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {requests.filter(r => r.clientId === selectedClientId).map(req => (
                              <div key={req.id} className="bg-slate-850 p-3 rounded-xl border border-slate-750 text-xs text-left">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5">
                                  <span className="font-bold text-slate-200">{req.subject}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${
                                    req.status === 'Solved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400 animate-pulse'
                                  }`}>
                                    {req.status === 'Solved' ? 'Traité' : 'En Attente'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">"{req.message}"</p>
                                {req.reply && (
                                  <div className="bg-slate-900 p-2 rounded-lg mt-2 text-[10px] border border-slate-800 text-indigo-300">
                                    <strong>Réponse Elyssa :</strong> {req.reply}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Request Form */}
                          <form onSubmit={handleCreateRequest} className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                            <p className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider">Déposer une nouvelle demande</p>
                            
                            <input
                              type="text"
                              required
                              placeholder="Objet de la demande..."
                              value={newRequestSubject}
                              onChange={(e) => setNewRequestSubject(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded-lg text-white"
                            />
                            
                            <textarea
                              required
                              placeholder="Décrivez votre demande en détail (délais de paiement, retenue à la source, litiges...)"
                              value={newRequestMessage}
                              onChange={(e) => setNewRequestMessage(e.target.value)}
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded-lg text-white"
                            />

                            <button
                              type="submit"
                              className={`w-full py-1.5 ${activeTheme.btn} font-black text-[9px] uppercase tracking-wider rounded-lg transition duration-150 flex items-center justify-center gap-1.5`}
                            >
                              <Send className="w-3 h-3" /> Transmettre à la comptabilité
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-400">Le support de messagerie et de demandes en ligne a été désactivé par l'administration.</div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* FOOTER OF SIMULATED PORTAL */}
              <div className="mt-6 border-t border-slate-850 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
                <span>Fournisseur certifié par le progiciel de facturation direct {companyName}</span>
                <span className="font-mono">Support direct : {supportEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT HELPER FOR CLIENT PORTAL INVOICE PRINTING */}
      <IframePrintHelper
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        activeTab="portail_client"
        documentName={printInvoice ? `Facture ${printInvoice.invoiceNumber}` : "Facture d'Espace Client"}
      />
    </div>
  );
}
