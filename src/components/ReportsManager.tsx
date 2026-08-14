/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VisitReport, Client, Complaint, Invoice } from '../types';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Calendar, 
  Users, 
  ArrowRight,
  ClipboardList,
  RefreshCw,
  Send,
  AlertTriangle,
  Award,
  X,
  Clock,
  MapPin,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsManagerProps {
  visitReports: VisitReport[];
  clients: Client[];
  complaints: Complaint[];
  invoices: Invoice[];
  onUpdateVisitReports: (updatedReports: VisitReport[]) => void;
}

export default function ReportsManager({ 
  visitReports, 
  clients, 
  complaints, 
  invoices, 
  onUpdateVisitReports 
}: ReportsManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'visits' | 'calendar' | 'weekly'>('visits');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(visitReports[0]?.id || null);

  // States for scheduling calendar
  const [selectedCalendarVisit, setSelectedCalendarVisit] = useState<VisitReport | null>(null);
  const [isSchedulingForDate, setIsSchedulingForDate] = useState<string | null>(null);
  const [scheduleClientId, setScheduleClientId] = useState('');
  const [schedulePurpose, setSchedulePurpose] = useState('');
  const [scheduleSummary, setScheduleSummary] = useState('');
  const [scheduleActions, setScheduleActions] = useState('');
  const [scheduleAuthor, setScheduleAuthor] = useState('Zied Ben Miled');

  // Visit Creation form states
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [visitClientId, setVisitClientId] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [visitActions, setVisitActions] = useState('');
  const [visitAuthor, setVisitAuthor] = useState('Zied Ben Miled');
  const [isAnalyzingVisit, setIsAnalyzingVisit] = useState<string | null>(null);

  // Weekly report state
  const [weeklyCustomNotes, setWeeklyCustomNotes] = useState('');
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [weeklyReportResult, setWeeklyReportResult] = useState<string | null>(null);

  // Date utils for localized calendar rendering
  const todayStr = new Date().toISOString().split('T')[0];

  const getCurrentWeekDays = () => {
    const current = new Date();
    const day = current.getDay();
    // Adjust to Monday-initiated week
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };

  const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const FRENCH_DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const FRENCH_MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handleScheduleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSchedulingForDate || !scheduleClientId || !schedulePurpose) return;

    const matchedClient = clients.find(c => c.id === scheduleClientId);
    const clientName = matchedClient ? matchedClient.name : "Client Inconnu";

    const newReport: VisitReport = {
      id: `vis_${Date.now()}`,
      clientId: scheduleClientId,
      clientName,
      date: isSchedulingForDate,
      purpose: schedulePurpose,
      summary: scheduleSummary || "Visite planifiée.",
      actionPoints: scheduleActions ? scheduleActions.split(',').map(a => a.trim()).filter(Boolean) : [],
      aiAnalyzed: false,
      author: scheduleAuthor
    };

    onUpdateVisitReports([newReport, ...visitReports]);
    setIsSchedulingForDate(null);
    setScheduleClientId('');
    setSchedulePurpose('');
    setScheduleSummary('');
    setScheduleActions('');
  };

  const selectedVisit = visitReports.find(v => v.id === selectedVisitId);

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitClientId || !visitSummary) return;

    const matchedClient = clients.find(c => c.id === visitClientId);
    const clientName = matchedClient ? matchedClient.name : "Client Inconnu";

    const newReport: VisitReport = {
      id: `vis_${Date.now()}`,
      clientId: visitClientId,
      clientName,
      date: new Date().toISOString().split('T')[0],
      purpose: visitPurpose,
      summary: visitSummary,
      actionPoints: visitActions.split(',').map(a => a.trim()).filter(Boolean),
      aiAnalyzed: false,
      author: visitAuthor
    };

    onUpdateVisitReports([newReport, ...visitReports]);
    setSelectedVisitId(newReport.id);
    setIsAddingVisit(false);

    // reset
    setVisitClientId('');
    setVisitPurpose('');
    setVisitSummary('');
    setVisitActions('');
  };

  // Run Gemini analysis on client visit
  const handleAnalyzeVisit = async (visitId: string) => {
    const report = visitReports.find(r => r.id === visitId);
    if (!report) return;

    setIsAnalyzingVisit(visitId);
    try {
      const adminSettingsRaw = localStorage.getItem('carthage_admin_settings');
      const customKey = adminSettingsRaw ? JSON.parse(adminSettingsRaw).geminiApiKey : '';
      const response = await fetch('/api/gemini/analyze-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': customKey || ''
        },
        body: JSON.stringify({
          clientName: report.clientName,
          summary: report.summary,
          purpose: report.purpose,
          actionPoints: report.actionPoints
        })
      });

      const data = await response.json();
      if (data.success) {
        const updated = visitReports.map(r => {
          if (r.id === visitId) {
            return {
              ...r,
              aiAnalyzed: true,
              aiInsights: data.analysis
            };
          }
          return r;
        });
        onUpdateVisitReports(updated);
      }
    } catch (err) {
      console.error(err);
      alert("Impossible de joindre l'analyse par Intelligence Artificielle.");
    } finally {
      setIsAnalyzingVisit(null);
    }
  };

  // Run Weekly compilation report via Gemini
  const handleGenerateWeeklyReport = async () => {
    setIsLoadingWeekly(true);
    setWeeklyReportResult(null);

    try {
      // Gather condensed stats
      const condensedClients = clients.map(c => ({ name: c.name, category: c.category, sector: c.sector }));
      const condensedClaims = complaints.filter(c => c.status !== 'Resolved').map(c => ({ client: c.clientName, dept: c.assignedDepartment, subject: c.subject }));
      const condensedInvoices = invoices.filter(inv => inv.status !== 'Paid').map(inv => ({ client: inv.clientName, amount: inv.amountNetToPay, status: inv.status }));

      const adminSettingsRaw = localStorage.getItem('carthage_admin_settings');
      const customKey = adminSettingsRaw ? JSON.parse(adminSettingsRaw).geminiApiKey : '';
      const response = await fetch('/api/gemini/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': customKey || ''
        },
        body: JSON.stringify({
          clients: condensedClients,
          claims: condensedClaims,
          invoices: condensedInvoices,
          customNotes: weeklyCustomNotes
        })
      });

      const data = await response.json();
      if (data.success) {
        setWeeklyReportResult(data.analysis);
      } else {
        setWeeklyReportResult("Erreur lors de la compilation par l'IA.");
      }
    } catch (e) {
      console.error(e);
      setWeeklyReportResult("Erreur réseau lors de la génération du rapport commercial.");
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => setActiveSubTab('visits')}
          className={`pb-3 text-xs font-bold px-4 transition ${
            activeSubTab === 'visits' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Comptes-Rendus de Visites
        </button>
        <button 
          onClick={() => setActiveSubTab('calendar')}
          className={`pb-3 text-xs font-bold px-4 transition flex items-center space-x-1 ${
            activeSubTab === 'calendar' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Agenda & Planification Terrain</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('weekly')}
          className={`pb-3 text-xs font-bold px-4 transition ${
            activeSubTab === 'weekly' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Rapport de Suivi Hebdomadaire (Hiérarchie)
        </button>
      </div>

      {activeSubTab === 'visits' ? (
        /* VISITS SHEET MODULE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* list visits */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-150 p-4 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm">Visites clients ({visitReports.length})</h3>
              <button 
                onClick={() => { setIsAddingVisit(true); setSelectedVisitId(null); }}
                className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Nouveau</span>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[460px]">
              {visitReports.map(rep => {
                const isSelected = rep.id === selectedVisitId;
                return (
                  <div 
                    key={rep.id}
                    onClick={() => { setSelectedVisitId(rep.id); setIsAddingVisit(false); }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="truncate max-w-[120px] font-bold text-indigo-700">{rep.clientName}</span>
                      <span>{rep.date}</span>
                    </div>
                    <span className="block font-bold text-slate-800 text-xs truncate">{rep.purpose}</span>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Visiteur: {rep.author}</p>

                    {rep.aiAnalyzed && (
                      <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        ✓ Diagnostiqué par l'IA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* detail view visit */}
          <div className="lg:col-span-2">
            {isAddingVisit ? (
              /* ADD NEW VISIT SHEET */
              <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Rédiger un Rapport de Visite Client</h3>
                
                <form onSubmit={handleAddVisit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">Client Visité *</label>
                      <select 
                        value={visitClientId}
                        onChange={(e) => setVisitClientId(e.target.value)}
                        required
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 font-bold text-xs"
                      >
                        <option value="">Sélectionnez un client...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">Objet de la Visite :</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Négociation tarifaire / Diagnostic de satisfaction..."
                        value={visitPurpose}
                        onChange={(e) => setVisitPurpose(e.target.value)}
                        className="p-2 border rounded w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">Résumé stratégique de l'entretien (Ce qui s'est dit, humeurs, menaces) *</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Décrivez les échanges. Ex: Le client se plaint des retards logistiques du dépôt ou exprime un intérêt pour..."
                      value={visitSummary}
                      onChange={(e) => setVisitSummary(e.target.value)}
                      className="p-2 border rounded w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">Points d'Action convenus (Séparés par des virgules) :</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Envoyer plan de continuité logistique, Accorder remise de 1.5%..."
                      value={visitActions}
                      onChange={(e) => setVisitActions(e.target.value)}
                      className="p-2 border rounded w-full text-xs"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingVisit(false)}
                      className="p-2 border rounded text-slate-600 font-bold"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
                    >
                      Enregistrer le Rapport
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedVisit ? (
              /* DETAILED VIEW VISIT */
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Rapport Commercial terrain</span>
                      <h3 className="text-base font-black text-slate-800 mt-1">{selectedVisit.purpose}</h3>
                      <p className="text-xs text-slate-500 font-semibold">Client: <strong className="text-indigo-700">{selectedVisit.clientName}</strong> — Visité par {selectedVisit.author} le {selectedVisit.date}</p>
                    </div>

                    <button 
                      onClick={() => handleAnalyzeVisit(selectedVisit.id)}
                      disabled={isAnalyzingVisit === selectedVisit.id}
                      className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                    >
                      {isAnalyzingVisit === selectedVisit.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyse...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Audit IA de Churn</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-500 uppercase">Résumé de l'entretien commercial :</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border italic">
                      "{selectedVisit.summary}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-slate-500 uppercase">Points de plan d'action validés :</span>
                    <ul className="list-decimal list-inside text-xs text-slate-700 space-y-1">
                      {selectedVisit.actionPoints.map((pt, i) => (
                        <li key={i} className="font-medium bg-slate-50/50 p-1 rounded px-2">{pt}</li>
                      ))}
                      {selectedVisit.actionPoints.length === 0 && (
                        <span className="text-slate-400 italic text-[11px]">Aucun point d'action requis ou enregistré.</span>
                      )}
                    </ul>
                  </div>

                  {/* IA analysis results attached */}
                  {selectedVisit.aiAnalyzed && selectedVisit.aiInsights && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-indigo-100 bg-indigo-50/20 p-4 rounded-xl border">
                      <div className="flex items-center space-x-2 mb-2 text-indigo-700 text-xs font-black">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                        <span>RECOMMANDATIONS STRATÉGIQUES INTELLIGENTES (IA)</span>
                      </div>
                      <div className="text-slate-700 text-xs whitespace-pre-line leading-relaxed">
                        {selectedVisit.aiInsights}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-150 p-10 text-center text-slate-400 text-xs">
                Sélectionnez un rapport d'entretien de visite à gauche pour auditer sa satisfaction par l'IA ou rédigez-en un nouveau.
              </div>
            )}
          </div>
        </div>
      ) : activeSubTab === 'calendar' ? (
        /* CALENDAR VIEW & PLANNING */
        <div className="space-y-6 text-left">
          {/* Calendar Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">MODULE AGENDA</span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">🌟 Planification et Suivi Terrain</span>
                </div>
                <h3 className="text-xl font-black tracking-tight mt-1">Calendrier d'Activité et Visites Client</h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Pilotez les itinéraires des relanceurs de la semaine en cours. Consultez l'historique des entretiens conduits et prévoyez de nouvelles visites stratégiques pour optimiser le recouvrement.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 backdrop-blur-sm self-start md:self-center">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Semaine du {getCurrentWeekDays()[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au {getCurrentWeekDays()[6].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Agenda Grid of Days */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {getCurrentWeekDays().map((dayDate, index) => {
              const dayStr = dayDate.toISOString().split('T')[0];
              const isToday = dayStr === todayStr;
              const isPast = dayStr < todayStr;
              const matchedReports = visitReports.filter(r => r.date === dayStr);

              return (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between transition-all relative group min-h-[190px] ${
                    isToday 
                      ? 'border-indigo-505 ring-1 ring-indigo-500 shadow-indigo-100/50 border-indigo-500' 
                      : 'border-slate-150 hover:border-slate-350'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start pb-2 border-b border-dashed border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase font-sans tracking-wide block">
                          {FRENCH_DAYS[dayDate.getDay()]}
                        </span>
                        <span className={`text-sm font-black font-sans leading-none ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {dayDate.getDate()} {FRENCH_MONTHS[dayDate.getMonth()].substring(0, 4)}.
                        </span>
                      </div>

                      {/* Add visit button */}
                      <button 
                        onClick={() => {
                          setIsSchedulingForDate(dayStr);
                          setScheduleClientId(clients[0]?.id || '');
                          setSchedulePurpose('Visite de Recouvrement');
                        }}
                        className="p-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 transition-colors"
                        title="Planifier une visite"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visits on this day */}
                    <div className="mt-2.5 space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {matchedReports.map((report) => (
                        <div 
                          key={report.id}
                          onClick={() => setSelectedCalendarVisit(report)}
                          className="p-1.5 rounded bg-slate-50 border border-slate-100/80 hover:bg-slate-100/70 hover:border-slate-200 transition text-[10.5px] cursor-pointer text-left font-sans"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 line-clamp-1">
                            <span>{report.clientName}</span>
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-semibold flex items-center gap-0.5 mt-0.5 truncate">
                            <Clock className="w-2.5 h-2.5 text-indigo-455 flex-shrink-0" />
                            <span className="truncate">{report.purpose}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[8.5px]">
                            <span className="text-slate-400 font-mono">par {report.author.split(' ')[0]}</span>
                            {report.aiAnalyzed ? (
                              <span className="text-violet-650 font-bold bg-violet-50 px-1 rounded flex items-center gap-0.5">✨ IA</span>
                            ) : (
                              <span className={`px-1 rounded font-bold ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                                {isPast ? 'Passée' : 'Planifiée'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {matchedReports.length === 0 && (
                        <div className="h-[90px] flex flex-col items-center justify-center text-center opacity-40">
                          <ClipboardList className="w-6 h-6 text-slate-350 stroke-[1.2]" />
                          <span className="text-[9px] text-slate-400 mt-1 select-none font-medium text-center">Aucune visite</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Footer Marker */}
                  {isToday && (
                    <div className="absolute bottom-1 right-2 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] font-black uppercase text-emerald-600 font-sans tracking-wide">Aujourd'hui</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Stats & Explanation Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800">Elyssa Route Management</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {visitReports.length} rapports enregistrés au total. Les nouvelles planifications sont instantanément synchronisées avec la pile d'analyses et sauvegardées en local.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Visites de la semaine</span>
                <span className="text-sm font-black text-indigo-700">
                  {visitReports.filter(r => {
                    const days = getCurrentWeekDays().map(d => d.toISOString().split('T')[0]);
                    return days.includes(r.date);
                  }).length} planifiées / faites
                </span>
              </div>
            </div>
          </div>

          {/* Scheduling Dialog Modal for specific date */}
          {isSchedulingForDate && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-[9995] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-950 px-5 py-4 text-white flex justify-between items-center text-left">
                  <div>
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block">PLANIFICATION AGENDA</span>
                    <h3 className="text-xs font-black">Planifier une Visite Terrain pour le {new Date(isSchedulingForDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                  </div>
                  <button 
                    onClick={() => setIsSchedulingForDate(null)}
                    className="p-1 text-slate-400 hover:text-white transition rounded"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleScheduleVisitSubmit} className="p-5 space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Client à visiter *</label>
                    <select
                      required
                      value={scheduleClientId}
                      onChange={(e) => setScheduleClientId(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 focus:bg-white transition"
                    >
                      <option value="" disabled>Sélectionner un client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.sector || c.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motif de Visite *</label>
                      <select
                        required
                        value={schedulePurpose}
                        onChange={(e) => setSchedulePurpose(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 focus:bg-white transition"
                      >
                        <option value="Visite de Recouvrement">Recouvrement de créances</option>
                        <option value="Négociation Échéancier">Négociation d'échéances</option>
                        <option value="Audit de Satisfaction">Audit & Entretien relationnel</option>
                        <option value="Traitement Litige Facture">Cadrage litige facture</option>
                        <option value="Prise de Contact Standard">Visite de courtoisie d'agent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Agent Responsable</label>
                      <input 
                        type="text" 
                        required
                        value={scheduleAuthor}
                        onChange={(e) => setScheduleAuthor(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objectifs et plan de l'entretien (Instructions pour le relanceur)</label>
                    <textarea
                      rows={3}
                      placeholder="Indiquez les points cruciaux de négociation ou les factures visées..."
                      value={scheduleSummary}
                      onChange={(e) => setScheduleSummary(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plan d'action ou Actions attendues en retour (Séparés par des virgules)</label>
                    <input 
                      type="text" 
                      placeholder="Encaisser chèque de garantie, Arrêter échéancier..."
                      value={scheduleActions}
                      onChange={(e) => setScheduleActions(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    />
                    <span className="text-[9px] text-slate-400 italic block mt-1">Exemple: "Récupérer la traite validée, Signer l'accord de livraison"</span>
                  </div>

                  <div className="border-t pt-4 flex justify-end space-x-2">
                    <button 
                      type="button"
                      onClick={() => setIsSchedulingForDate(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold shadow transition flex items-center space-x-1"
                    >
                      <Check className="w-4.5 h-4.5" />
                      <span>Confirmer la Planification</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal overlay for a selected calendar visit */}
          {selectedCalendarVisit && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-[9995] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left w-full">
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">EXAMEN FICHE RDV</span>
                    <h3 className="text-xs font-black">Visite Client : {selectedCalendarVisit.clientName}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedCalendarVisit(null)}
                    className="p-1 text-slate-400 hover:text-white transition rounded"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-1 border-b pb-3">
                    <span className="text-[9px] uppercase font-bold text-indigo-505">Motif de l'Entretien</span>
                    <p className="text-sm font-black text-slate-800">{selectedCalendarVisit.purpose}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Date de l'intervention : <strong className="text-indigo-600">{new Date(selectedCalendarVisit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Agent Responsable / Visiteur : <strong className="text-slate-700">{selectedCalendarVisit.author}</strong>
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-indigo-505 block mb-1">Description / Objectifs consignés :</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/50 italic">
                      "{selectedCalendarVisit.summary}"
                    </p>
                  </div>

                  {selectedCalendarVisit.actionPoints && selectedCalendarVisit.actionPoints.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-505 block mb-1.5">Plan d'action & Engagements :</span>
                      <ul className="space-y-1.5">
                        {selectedCalendarVisit.actionPoints.map((pt, i) => (
                          <li key={i} className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[9px]">
                              {i + 1}
                            </span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCalendarVisit.aiAnalyzed && selectedCalendarVisit.aiInsights && (
                    <div className="bg-violet-50/45 p-4 rounded-xl border border-violet-100 mt-2">
                      <div className="flex items-center gap-1.5 text-violet-700 text-xs font-black mb-1">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        <span>SYNTHÈSE EXCLUSION RISQUE (AUDIT IA)</span>
                      </div>
                      <p className="text-[11.5px] text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                        {selectedCalendarVisit.aiInsights}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t">
                  <span className="text-[9.5px] text-slate-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Elyssa CRM/ERP Agenda Module
                  </span>
                  <button 
                    onClick={() => setSelectedCalendarVisit(null)}
                    className="p-2 px-5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition font-sans"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* WEEKLY HIERARCHICAL REPORT COMPILING */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
            <span className="font-bold text-slate-800 text-sm flex items-center space-x-1">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Générateur de Rapport Hebdomadaire Hiérarchique (IA)</span>
            </span>
            <p className="text-xs text-slate-400">
              Préparez un mémo formel de synthèse à destination de votre supérieur hiérarchique. L'application compile automatiquement les états de fiches clients, les factures en recouvrement ou impayées, et les réclamations inter-services (logistique, production) de la semaine.
            </p>

            <div className="space-y-3 font-xs">
              <label className="block text-xs font-bold text-slate-600">Commentaires libres ou constatations additionnelles (Optionnel) :</label>
              <textarea 
                rows={3}
                placeholder="Exprimez vos constats marchés ou demandes de soutien de la hiérarchie..."
                value={weeklyCustomNotes}
                onChange={(e) => setWeeklyCustomNotes(e.target.value)}
                className="p-2 border rounded w-full text-xs"
              />

              <div className="flex justify-end">
                <button 
                  onClick={handleGenerateWeeklyReport}
                  disabled={isLoadingWeekly}
                  className="p-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded text-xs transition flex items-center space-x-2"
                >
                  {isLoadingWeekly ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Génération de la note stratégique...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Générer le Rapport Hebdomadaire</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Compilation result block */}
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm min-h-[300px]">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Rapport d'activité compilé pour la direction</h3>
            
            {weeklyReportResult ? (
              <div className="p-5 bg-indigo-50/20 rounded-xl border border-indigo-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {weeklyReportResult}
              </div>
            ) : isLoadingWeekly ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xs text-indigo-700 uppercase tracking-widest font-bold">L'IA rassemble vos bases de données...</span>
                <p className="text-[10px] text-slate-400">Analyse de {clients.length} fiches clients, {invoices.length} factures et réclamations.</p>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Aucun rapport hebdomadaire n'a été compilé pour l'instant. Cliquez sur le bouton "Générer" ci-dessus pour bâtir votre note stratégique.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
