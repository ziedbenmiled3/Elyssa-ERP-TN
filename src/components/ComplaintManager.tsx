/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Complaint, Client, ComplaintStatus, Department } from '../types';
import IframePrintHelper from './IframePrintHelper';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Building, 
  HelpCircle, 
  Send, 
  Filter, 
  Check, 
  MessageSquare, 
  RefreshCw,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

interface ComplaintManagerProps {
  complaints: Complaint[];
  clients: Client[];
  onUpdateComplaints: (updatedComplaints: Complaint[]) => void;
  readOnly?: boolean;
}

export default function ComplaintManager({ complaints, clients, onUpdateComplaints, readOnly = false }: ComplaintManagerProps) {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'All' | Department>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUri = params.get('id');
    return idFromUri || complaints[0]?.id || null;
  });

  // States for printing support
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocName, setPrintDocName] = useState('');
  const [printDocTab, setPrintDocTab] = useState('complaints');
  const [printTarget, setPrintTarget] = useState('');
  const [printTargetId, setPrintTargetId] = useState('');

  // Form State
  const [isAddingComplaint, setIsAddingComplaint] = useState(false);
  const [clientId, setClientId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [department, setDepartment] = useState<Department>('Quality');

  // Resolution Edit State
  const [investigationText, setInvestigationText] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const selectedComplaint = complaints.find(c => c.id === selectedComplaintId);

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !subject || !description) return;

    const matchedClient = clients.find(c => c.id === clientId);
    const clientName = matchedClient ? matchedClient.name : "Client Inconnu";

    const newComplaint: Complaint = {
      id: `rec_${Date.now()}`,
      clientId,
      clientName,
      subject,
      description,
      status: 'Received',
      priority,
      assignedDepartment: department,
      createdDate: new Date().toISOString().split('T')[0]
    };

    const updated = [...complaints, newComplaint];
    onUpdateComplaints(updated);
    setSelectedComplaintId(newComplaint.id);
    setIsAddingComplaint(false);

    // reset
    setClientId('');
    setSubject('');
    setDescription('');
    setPriority('Medium');
    setDepartment('Quality');
  };

  const handleUpdateComplaintDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    const updated = complaints.map(c => {
      if (c.id === selectedComplaintId) {
        return {
          ...c,
          investigationDetails: investigationText,
          resolutionNotes: resolutionText,
          status: 'In_Investigation' as ComplaintStatus
        };
      }
      return c;
    });

    onUpdateComplaints(updated);
    alert('Informations d\'enquête et d\'état inter-services mises à jour !');
  };

  const handleMarkResolved = () => {
    if (!selectedComplaintId) return;
    const updated = complaints.map(c => {
      if (c.id === selectedComplaintId) {
        return {
          ...c,
          status: 'Resolved' as ComplaintStatus,
          resolvedDate: new Date().toISOString().split('T')[0],
          resolutionNotes: resolutionText || "Résolu conformément aux spécifications techniques."
        };
      }
      return c;
    });
    onUpdateComplaints(updated);
  };

  const handleUpdateStatusOnly = (status: ComplaintStatus) => {
    if (!selectedComplaintId) return;
    const updated = complaints.map(c => {
      if (c.id === selectedComplaintId) {
        return {
          ...c,
          status,
          resolvedDate: status === 'Resolved' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });
    onUpdateComplaints(updated);
  };

  // High-fidelity print handler
  const triggerPrint = (elementId: string, docName: string) => {
    // If we are printing a single complaint sheet, pass the complaint ID
    const targetIdVal = (elementId === 'printable-complaint-sheet' && selectedComplaintId) ? selectedComplaintId : '';

    const isIframe = window.self !== window.top;
    if (isIframe) {
      setPrintDocName(docName);
      setPrintDocTab('complaints'); // tab associated with ComplaintManager is 'complaints' in App.tsx
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

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesDept = selectedDeptFilter === 'All' ? true : c.assignedDepartment === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'All' ? true : c.status === selectedStatusFilter;
    return matchesDept && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Column */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-150 p-4 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-base">Suivi Réclamations ({filteredComplaints.length})</h3>
          {!readOnly && (
            <button 
              onClick={() => { setIsAddingComplaint(true); setSelectedComplaintId(null); }}
              className="p-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Déposer</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Département technique ciblé</label>
            <select 
              value={selectedDeptFilter}
              onChange={(e: any) => setSelectedDeptFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded"
            >
              <option value="All">Tous les départements</option>
              <option value="Quality">Qualité (Laboratoire)</option>
              <option value="Logistics">Logistique (Transport / Dépôt)</option>
              <option value="Production">Production (Usines / Calibrages)</option>
              <option value="Sales">Administration Commerciale</option>
              <option value="Finance">Finances (Modes de paiement)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">État de traitement</label>
            <select 
              value={selectedStatusFilter}
              onChange={(e: any) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded"
            >
              <option value="All">Tous les états</option>
              <option value="Received">Reçu / Non traité</option>
              <option value="In_Investigation">En cours d'investigation</option>
              <option value="Resolved">Résolue (Dossier clos)</option>
              <option value="Declined">Classée sans suite</option>
            </select>
          </div>
        </div>

        {/* Print Registre */}
        <button
          onClick={() => triggerPrint('printable-complaint-list', `Registre Réclamations - ${filteredComplaints.length} Dossiers`)}
          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-rose-100 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimer le Registre ({filteredComplaints.length})</span>
        </button>

        {/* Complaints List items */}
        <div className="space-y-2 overflow-y-auto max-h-[460px]">
          {filteredComplaints.map(c => {
            const isSelected = c.id === selectedComplaintId;
            const statusConfig = {
              Received: { color: 'text-amber-600 bg-amber-50', text: 'Reçu' },
              In_Investigation: { color: 'text-blue-600 bg-blue-50', text: 'Enquête' },
              Resolved: { color: 'text-emerald-700 bg-emerald-50', text: 'Résolue' },
              Declined: { color: 'text-slate-500 bg-slate-100', text: 'Sans suite' }
            };
            const currentStatus = statusConfig[c.status] || { color: 'bg-slate-50 text-slate-400', text: 'Inconnu' };

            const departmentLabels = {
              Quality: 'Qualité',
              Logistics: 'Logistique',
              Production: 'Production',
              Sales: 'Commercial',
              Finance: 'Finance'
            };

            return (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedComplaintId(c.id);
                  setIsAddingComplaint(false);
                  setInvestigationText(c.investigationDetails || '');
                  setResolutionText(c.resolutionNotes || '');
                }}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  isSelected ? 'border-rose-500 bg-rose-50/20 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider">{departmentLabels[c.assignedDepartment]}</span>
                  <span>{c.createdDate}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs truncate">{c.subject}</h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.clientName}</p>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    c.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Prio: {c.priority === 'High' ? 'Haute' : c.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                  </span>
                  
                  <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${currentStatus.color}`}>
                    {currentStatus.text}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredComplaints.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-400">Aucune réclamation.</div>
          )}
        </div>
      </div>

      {/* Editing & Visualizing Column */}
      <div className="lg:col-span-2">
        {isAddingComplaint ? (
          /* ADD NEW COMPLAINT FORM */
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 text-rose-700">Ouvrir un Dossier de Réclamation Client</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Sélectionner le Client concerné *</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 font-bold"
                  >
                    <option value="">Sélectionnez un client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Service Technique d'Assignation *</label>
                  <select 
                    value={department}
                    onChange={(e: any) => setDepartment(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="Quality">Qualité (Problème produit, non-conformité Labo)</option>
                    <option value="Logistics">Logistique (Problème de camion, retard, emballage)</option>
                    <option value="Production">Production (Erreur calibrage matériel, délai usine)</option>
                    <option value="Sales">Commercial (Litige contrat/tarifs)</option>
                    <option value="Finance">Finances (Erreur de facturation / banque)</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold text-slate-600">Sujet Clarifié de la plainte *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Teinte de fil décalée de 10% / Colis d'emballage humides..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Niveau d'urgence prioritaire</label>
                  <select 
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="Low">Basse (Simple remarque)</option>
                    <option value="Medium">Moyenne (Investigation nécessaire sous 7 jours)</option>
                    <option value="High">Haute (Risque contractuel ou arrêt machine - Urgent !)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Description détaillée des faits *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Décrire de manière factuelle ce que le client réclame. Spécifier les références de commande ou camions si possible..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsAddingComplaint(false)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold"
                >
                  Ouvrir l'Incident Commercial
                </button>
              </div>
            </form>
          </div>
        ) : selectedComplaint ? (
          /* DETAILED INCIDENT & COLLABORATION VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-600">Fiche Incident ID: {selectedComplaint.id}</span>
                  <h3 className="text-base font-extrabold text-slate-800 mt-1">{selectedComplaint.subject}</h3>
                  <p className="text-xs text-slate-500 font-medium">Déposée par le client : <strong>{selectedComplaint.clientName}</strong> le {selectedComplaint.createdDate}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => triggerPrint('printable-complaint-sheet', `Fiche Incident - ${selectedComplaint.id}`)}
                    className="p-1 px-3 bg-rose-50/50 hover:bg-rose-50 text-rose-750 font-bold border border-rose-150 rounded text-xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer la Fiche</span>
                  </button>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    selectedComplaint.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Priorité : {selectedComplaint.priority === 'High' ? 'Élevée' : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 uppercase">1. Rapport de non-conformité initial :</span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                  "{selectedComplaint.description}"
                </div>
              </div>

              {/* Technical investigation & collaborative departments progress */}
              <form onSubmit={handleUpdateComplaintDetails} className="space-y-4 border-t border-slate-100 pt-4 text-xs">
                <span className="block text-xs font-extrabold text-slate-800 uppercase">2. Traitement Inter-services :</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">Département affecté actuel :</label>
                    <select 
                      value={selectedComplaint.assignedDepartment}
                      disabled={readOnly}
                      onChange={(e: any) => {
                        const updated = complaints.map(c => {
                          if (c.id === selectedComplaint.id) {
                            return { ...c, assignedDepartment: e.target.value as Department };
                          }
                          return c;
                        });
                        onUpdateComplaints(updated);
                      }}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-700 w-full disabled:opacity-75 disabled:bg-slate-100"
                    >
                      <option value="Quality">Qualité (Labo)</option>
                      <option value="Logistics">Logistique (Transports)</option>
                      <option value="Production">Production (Machines)</option>
                      <option value="Sales">Commercial</option>
                      <option value="Finance">Finances</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">État d'avancement administratif :</label>
                    <div className="flex space-x-1.5">
                      {['Received', 'In_Investigation', 'Resolved', 'Declined'].map(st => {
                        const isCurrent = selectedComplaint.status === st;
                        const labels = { Received: 'Reçu', In_Investigation: 'Enquête', Resolved: 'Résolu', Declined: 'Classé' };
                        return (
                          <button 
                            key={st}
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleUpdateStatusOnly(st as ComplaintStatus)}
                            className={`p-1 px-2.5 rounded font-bold text-[10px] border transition ${
                              isCurrent 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-150'
                            } ${readOnly ? 'opacity-80 cursor-not-allowed' : ''}`}
                          >
                            {labels[st as ComplaintStatus]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Enquête Technique menée par le service concerné :</label>
                  <textarea 
                    rows={3}
                    value={investigationText}
                    disabled={readOnly}
                    onChange={(e) => setInvestigationText(e.target.value)}
                    placeholder={readOnly ? "Aucune enquête en cours ou documentée." : "Inscrire ici les conclusions techniques de l'ingénieur concerné, du logisticien ou du technicien qualité..."}
                    className="w-full p-2 border border-slate-200 rounded focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Solution Commerciale ou Technique d'accord client :</label>
                  <textarea 
                    rows={2}
                    value={resolutionText}
                    disabled={readOnly}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder={readOnly ? "Pas de solution client affectée." : "Indiquez l'accord trouvé avec le client (ex: émission d'un avoir financier, re-fabrication du lot, etc.)"}
                    className="w-full p-2 border border-slate-200 rounded focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {!readOnly ? (
                  <div className="flex justify-between items-center pt-3 border-t">
                    <button 
                      type="button"
                      onClick={handleMarkResolved}
                      className="p-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Clore l'Incident (Marquer Résolu)</span>
                    </button>

                    <button 
                      type="submit"
                      className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                    >
                      Sauvegarder l'Enquête Commerciale
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-slate-500 text-[11px] font-medium italic text-center">
                    Mode Consultation Uniquement — Vous ne possédez pas les privilèges requis pour modifier ce dossier.
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-150 p-10 text-center text-slate-400 text-xs">
            Sélectionnez un dossier de réclamation à gauche pour l'affecter aux équipes Qualité/Logistique ou documenter ses notes d'enquête.
          </div>
        )}
      </div>

      {/* ==================== PRINT TEMPLATES (SCREEN HIDDEN, PRINT VISIBLE) ==================== */}

      {/* 1. Printed Complaint Sheet */}
      {selectedComplaint && (
        <div id="printable-complaint-sheet" className="hidden">
          <div className="p-8 bg-white text-slate-900 space-y-6">
            {/* Header */}
            <div className="border-b-2 border-rose-600 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight text-rose-700">CARTHAGE CRM - INCIDENT ET RECLAMATION</h1>
                <p className="text-[10px] text-slate-400 font-mono">Dossier technique N° : {selectedComplaint.id} — Généré le {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`p-1 px-3 border rounded-lg font-black text-[10px] uppercase font-mono ${
                  selectedComplaint.priority === 'High' ? 'bg-red-50 text-red-700 border-red-250' : 'bg-slate-50 text-slate-650'
                }`}>
                  Priorité : {selectedComplaint.priority === 'High' ? 'Urgent / Critique' : 'Normal'}
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs">
              <div className="space-y-1.5">
                <p><strong>Raison Sociale Client :</strong> <span className="font-bold text-slate-800 text-sm">{selectedComplaint.clientName}</span></p>
                <p><strong>Intitulé de la Réclamation :</strong> <span className="font-bold text-slate-800">{selectedComplaint.subject}</span></p>
                <p><strong>Date d'Ouverture :</strong> {selectedComplaint.createdDate}</p>
              </div>
              <div className="space-y-1.5 col-span-1 border-l pl-4 border-slate-200">
                <p><strong>Département Assignataire :</strong> {
                  selectedComplaint.assignedDepartment === 'Quality' ? 'Qualité / Laboratoire' :
                  selectedComplaint.assignedDepartment === 'Logistics' ? 'Logistique / Transport' :
                  selectedComplaint.assignedDepartment === 'Production' ? 'Production / Usine' :
                  selectedComplaint.assignedDepartment === 'Sales' ? 'Commercial' : 'Finance'
                }</p>
                <p><strong>Statut de Résolution :</strong> <span className="font-bold">{
                  selectedComplaint.status === 'Received' ? 'Reçu - Action requise' :
                  selectedComplaint.status === 'In_Investigation' ? 'Investigation Technique Active' :
                  selectedComplaint.status === 'Resolved' ? 'Fiche Résolue (Clos)' : 'Classé sans suite'
                }</span></p>
                {selectedComplaint.resolvedDate && <p><strong>Date de Clôture :</strong> {selectedComplaint.resolvedDate}</p>}
              </div>
            </div>

            {/* Section 1: Non-conformité initial */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">1. Rapport Factuel de non-conformité (Client)</h3>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs italic text-slate-700 leading-relaxed min-h-[80px]">
                "{selectedComplaint.description}"
              </div>
            </div>

            {/* Section 2: Enquête inter-service */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">2. Conclusions de l'Enquête interne & Diagnostic Technique</h3>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-800 leading-relaxed min-h-[80px]">
                {selectedComplaint.investigationDetails || "Enquête en cours par le département assignataire. Aucune conclusion intermédiaire rapportée."}
              </div>
            </div>

            {/* Section 3: Résolution */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">3. Décision d'Accord Client & Traitement Commercial</h3>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-800 leading-relaxed min-h-[60px]">
                {selectedComplaint.resolutionNotes || "En attente de formalisation de la solution avec le client."}
              </div>
            </div>

            {/* Signatures slots */}
            <div className="grid grid-cols-2 gap-6 pt-10 text-xs text-slate-500">
              <div className="h-24 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between">
                <span className="font-bold text-slate-400 text-[10px] uppercase font-mono">Visa Département Technique</span>
                <span className="text-right text-[10px] text-slate-400 italic">Signature & Date</span>
              </div>
              <div className="h-24 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between">
                <span className="font-bold text-slate-400 text-[10px] uppercase font-mono">Visa Responsable Commercial</span>
                <span className="text-right text-[10px] text-slate-400 italic">Signature & Date</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-12 text-center text-[10px] text-slate-400 border-t border-dashed mt-auto">
              <p>Elyssa CRM - Fiche de Gestion des Non-Conformités Client</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Printed Complaint Register list */}
      <div id="printable-complaint-list" className="hidden">
        <div className="p-8 bg-white text-slate-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-rose-600 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight text-rose-700">CARTHAGE CRM - REGISTRE DES RECLAMATIONS</h1>
              <p className="text-[10px] text-slate-400 font-mono">
                Filtres : Dépt {selectedDeptFilter === 'All' ? 'Tous' : selectedDeptFilter} | Statut {selectedStatusFilter === 'All' ? 'Tous' : selectedStatusFilter} — Généré le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-xs text-slate-550 font-mono">
                Total : {filteredComplaints.length} réclamations
              </span>
            </div>
          </div>

          {/* Table Listing */}
          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">ID Dossier</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Sujet de la réclamation</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Priorité</th>
                  <th className="p-3 text-center">Date Ouv.</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {filteredComplaints.map(c => {
                  const deptLabels = { Quality: 'Qualité', Logistics: 'Logistics', Production: 'Production', Sales: 'Sales', Finance: 'Finance' };
                  const statusText = { Received: 'Reçu', In_Investigation: 'Enquête', Resolved: 'Résolue', Declined: 'Classée' };
                  return (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-slate-500 text-[10px]">{c.id}</td>
                      <td className="p-3 font-bold text-slate-800">{c.clientName}</td>
                      <td className="p-3 text-slate-650 max-w-xs truncate">{c.subject}</td>
                      <td className="p-3 text-slate-500 font-medium">{deptLabels[c.assignedDepartment] || c.assignedDepartment}</td>
                      <td className="p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-600">
                          {c.priority === 'High' ? 'Haute' : c.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-400 font-mono text-[10px]">{c.createdDate}</td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] font-bold text-slate-700">
                          {statusText[c.status] || c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-[10px] text-slate-400 border-t border-dashed">
            <p>Elyssa CRM - Gestion Interne de la Qualité - Confidentiel</p>
          </div>
        </div>
      </div>

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
