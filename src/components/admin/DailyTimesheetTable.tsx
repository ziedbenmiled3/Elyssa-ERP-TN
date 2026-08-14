import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  UserCheck, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight, 
  Building2, 
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Sliders,
  Eye,
  Check
} from 'lucide-react';

export type TimesheetStatus = 'VALIDE' | 'ANOMALIE' | 'INCOMPLET';

export interface DailyTimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  siteName: string;
  entryTime: string; // HH:mm
  entryPhotoUrl?: string;
  entryGps: { lat: number; lng: number; address: string };
  exitTime?: string; // HH:mm or undefined
  exitPhotoUrl?: string;
  exitGps?: { lat: number; lng: number; address: string };
  totalWorkedMinutes: number; // minutes worked
  overtimeMinutes: number; // overtime minutes
  status: TimesheetStatus;
  anomalyReason?: string;
  biometricScore: number; // 0 - 100%
  isOfflineSync: boolean;
}

const MOCK_TIMESHEET_DATA: DailyTimesheetEntry[] = [
  {
    id: 'ts_001',
    employeeId: 'EMP-904',
    employeeName: 'Sami Ben Ali',
    role: 'Commercial Van Sales',
    department: 'Commercial & Distribution',
    siteName: 'Dépôt Central Tunis / GEP',
    entryTime: '07:58',
    entryGps: { lat: 36.8392, lng: 10.2432, address: 'Les Berges du Lac 2, Tunis' },
    exitTime: '17:15',
    exitGps: { lat: 36.8392, lng: 10.2432, address: 'Les Berges du Lac 2, Tunis' },
    totalWorkedMinutes: 522, // 8h 42m
    overtimeMinutes: 42,
    status: 'VALIDE',
    biometricScore: 98,
    isOfflineSync: false
  },
  {
    id: 'ts_002',
    employeeId: 'EMP-912',
    employeeName: 'Mohamed Trabelsi',
    role: 'Chef de Chantier BTP',
    department: 'Operations Chantier',
    siteName: 'Chantier Port de Sousse',
    entryTime: '07:45',
    entryGps: { lat: 35.8256, lng: 10.6369, address: 'Zone Portuaire, Sousse' },
    exitTime: '16:30',
    exitGps: { lat: 35.8256, lng: 10.6369, address: 'Zone Portuaire, Sousse' },
    totalWorkedMinutes: 525, // 8h 45m
    overtimeMinutes: 45,
    status: 'VALIDE',
    biometricScore: 96,
    isOfflineSync: false
  },
  {
    id: 'ts_003',
    employeeId: 'EMP-920',
    employeeName: 'Youssef Mansour',
    role: 'Chauffeur Livreur Sfax',
    department: 'Logistique Van Sales',
    siteName: 'Circuit Sud Sfax - Gabès',
    entryTime: '08:12',
    entryGps: { lat: 34.7405, lng: 10.7603, address: 'Route de Gabès Km 4, Sfax' },
    exitTime: undefined, // En cours
    totalWorkedMinutes: 480, // 8h 00m (estimé)
    overtimeMinutes: 0,
    status: 'INCOMPLET',
    anomalyReason: 'Poste toujours actif (Sortie non pointée)',
    biometricScore: 94,
    isOfflineSync: true
  },
  {
    id: 'ts_004',
    employeeId: 'EMP-935',
    employeeName: 'Karem Chaabane',
    role: 'Technicien Maintenance',
    department: 'Services Techniques',
    siteName: 'Usine Agro Nabeul',
    entryTime: '08:30',
    entryGps: { lat: 36.4512, lng: 10.7354, address: 'RN1, Nabeul Nord' },
    exitTime: '17:00',
    exitGps: { lat: 36.4512, lng: 10.7354, address: 'RN1, Nabeul Nord' },
    totalWorkedMinutes: 480,
    overtimeMinutes: 0,
    status: 'ANOMALIE',
    anomalyReason: 'Pointage hors géofence (Ecart: +1450m du site)',
    biometricScore: 72,
    isOfflineSync: false
  },
  {
    id: 'ts_005',
    employeeId: 'EMP-942',
    employeeName: 'Fatma Gharbi',
    role: 'Inspectrice Qualité',
    department: 'Assurance Qualité',
    siteName: 'Parc Bizerte',
    entryTime: '08:00',
    entryGps: { lat: 37.2744, lng: 9.8739, address: 'Parc d\'Activités, Bizerte' },
    exitTime: '17:30',
    exitGps: { lat: 37.2744, lng: 9.8739, address: 'Parc d\'Activités, Bizerte' },
    totalWorkedMinutes: 540, // 9h 00m
    overtimeMinutes: 60,
    status: 'VALIDE',
    biometricScore: 99,
    isOfflineSync: false
  }
];

export interface DailyTimesheetTableProps {
  tenantId?: string;
  className?: string;
  employees?: any[];
  onExportToPayroll?: (exportData: any) => void;
}

/**
 * Composant DailyTimesheetTable - Bilan Journalier des Heures de Travail pour la Paie (MOD-03)
 * Consolide les pointages Entrée/Sortie avec calcul du temps effectif et contrôle des anomalies.
 */
export const DailyTimesheetTable: React.FC<DailyTimesheetTableProps> = ({
  tenantId = 'GEP',
  className = '',
  employees,
  onExportToPayroll
}) => {
  const [entries, setEntries] = useState<DailyTimesheetEntry[]>(MOCK_TIMESHEET_DATA);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-04');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TimesheetStatus>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<DailyTimesheetEntry | null>(null);

  // Dynamic cross-reference sync with MOD-03 employees
  useEffect(() => {
    if (employees && employees.length > 0) {
      setEntries(prevEntries => prevEntries.map(entry => {
        const emp = employees.find((e: any) => e.id === entry.employeeId || e.matricule === entry.employeeId);
        return {
          ...entry,
          employeeName: emp ? emp.name : entry.employeeName,
          role: emp ? emp.jobTitle : entry.role,
          department: emp ? emp.department : entry.department
        };
      }));
    }
  }, [employees]);
  
  // Modal d'Exportation vers MOD-03 Paie
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Conversion minutes en format lisible (08h 30m)
  const formatMinutesToHours = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  // Filtrage
  const filteredEntries = entries.filter(item => {
    if (!item) return false;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const empName = (item.employeeName || '').toLowerCase();
    const empId = (item.employeeId || '').toLowerCase();
    const site = (item.siteName || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch = !query || empName.includes(query) || empId.includes(query) || site.includes(query);
    return matchesStatus && matchesSearch;
  });

  // Cumuls KPI
  const totalWorkedMins = entries.reduce((acc, curr) => acc + curr.totalWorkedMinutes, 0);
  const totalOvertimeMins = entries.reduce((acc, curr) => acc + curr.overtimeMinutes, 0);
  const countAnomalies = entries.filter(e => e.status === 'ANOMALIE').length;
  const countValides = entries.filter(e => e.status === 'VALIDE').length;

  // Traitement d'Exportation Paie (MOD-03)
  const handleConfirmExportToPayroll = () => {
    const payload = {
      tenantId,
      date: selectedDate,
      totalEmployeesProcessed: entries.length,
      totalHoursBase: (totalWorkedMins / 60).toFixed(2),
      totalHoursOvertime: (totalOvertimeMins / 60).toFixed(2),
      anomaliesCount: countAnomalies,
      exportedAt: new Date().toISOString(),
      sourceModule: 'MOD-11 Flotte Mobile',
      targetModule: 'MOD-03 Paie & RH'
    };

    setExportSuccess(true);
    if (onExportToPayroll) {
      onExportToPayroll(payload);
    }
  };

  const getStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'VALIDE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Validé
          </span>
        );
      case 'ANOMALIE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Anomalie
          </span>
        );
      case 'INCOMPLET':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" />
            En cours
          </span>
        );
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans text-slate-100 ${className}`}>
      
      {/* En-tête du Bilan des Heures */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Feuille de Temps Journalière (Suivi MOD-11)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Prêt pour Paie
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidation automatisée des pointages du personnel terrain pour le calcul des salaires et des heures supplémentaires.
              </p>
            </div>
          </div>
        </div>

        {/* Action Majeure : BOUTON EXPORTER POUR LA PAIE (MOD-03) */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
          <button
            onClick={() => {
              setExportSuccess(false);
              setIsExportModalOpen(true);
            }}
            className="w-full lg:w-auto px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Exporter pour la Paie (MOD-03)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-200" />
          </button>
        </div>
      </div>

      {/* Cartes Métriques RH & Temps Effectif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Total Heures Travaillées */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Cumul Heures Effectives
            </span>
            <span className="text-2xl font-black text-white tracking-tight">
              {formatMinutesToHours(totalWorkedMins)}
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Heures Supplémentaires */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Heures Supplémentaires (+25%)
            </span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              +{formatMinutesToHours(totalOvertimeMins)}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pointages Validés */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Feuilles Validées
            </span>
            <span className="text-2xl font-black text-emerald-300 tracking-tight">
              {countValides} / {entries.length}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Anomalies à Réviser */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Anomalies à Valider
            </span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {countAnomalies} Dossier(s)
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Barre d'Outils Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        
        {/* Sélecteur de Date & Filtre Statut */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative">
            <Calendar className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">Validés uniquement</option>
            <option value="ANOMALIE">Anomalies uniquement</option>
            <option value="INCOMPLET">Incomplets</option>
          </select>
        </div>

        {/* Recherche */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher employé, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Tableau Synthétique des Heures */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Employé / Matricule</th>
              <th className="px-4 py-3.5">Site / Affected Area</th>
              <th className="px-4 py-3.5 text-center">Heure Entrée</th>
              <th className="px-4 py-3.5 text-center">Heure Sortie</th>
              <th className="px-4 py-3.5 text-right">Total Heures</th>
              <th className="px-4 py-3.5 text-center">Statut RH</th>
              <th className="px-4 py-3.5 text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredEntries.map((row) => {
              return (
                <tr key={row.id} className="hover:bg-slate-900/80 transition-colors group">
                  
                  {/* Employé */}
                  <td className="px-4 py-3.5">
                    <div>
                      <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {row.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {row.employeeId} • {row.role}
                      </div>
                    </div>
                  </td>

                  {/* Site */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{row.siteName}</span>
                    </div>
                  </td>

                  {/* Heure Entrée */}
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                    <div className="flex items-center justify-center space-x-1">
                      <span>{row.entryTime}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        {row.biometricScore}% IA
                      </span>
                    </div>
                  </td>

                  {/* Heure Sortie */}
                  <td className="px-4 py-3.5 text-center font-mono">
                    {row.exitTime ? (
                      <span className="text-slate-200 font-bold">{row.exitTime}</span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-bold italic">
                        Poste actif
                      </span>
                    )}
                  </td>

                  {/* Total Heures & Overtime */}
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                    <div>
                      <span>{formatMinutesToHours(row.totalWorkedMinutes)}</span>
                      {row.overtimeMinutes > 0 && (
                        <span className="block text-[10px] text-emerald-400">
                          +{formatMinutesToHours(row.overtimeMinutes)} supp
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3.5 text-center">
                    {getStatusBadge(row.status)}
                  </td>

                  {/* Action d'Inspection */}
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedEntry(row)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Détails
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL / DRAWER INSPECTION D'UN POINTAGE */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{selectedEntry.employeeName}</h3>
                <p className="text-xs text-slate-400">{selectedEntry.role} ({selectedEntry.employeeId})</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Site Affecté :</span>
                <span className="font-bold text-white">{selectedEntry.siteName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Adresse GPS Entrée :</span>
                <span className="font-mono text-slate-300">{selectedEntry.entryGps.address}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Score de Confiance IA :</span>
                <span className="font-bold text-emerald-400">{selectedEntry.biometricScore}% (Visage vérifié)</span>
              </div>
              {selectedEntry.anomalyReason && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200">
                  <strong>Avertissement :</strong> {selectedEntry.anomalyReason}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL D'EXPORTATION VERS MOD-03 PAIE */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!exportSuccess ? (
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Transfert vers la Paie (MOD-03)</h3>
                    <p className="text-xs text-slate-400">Exportation des relevés d'heures du {selectedDate}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Nombre de Salariés :</span>
                    <span className="font-bold text-white">{entries.length} personnes</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cumul Heures Normales :</span>
                    <span className="font-bold text-white">{(totalWorkedMins / 60).toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Cumul Heures Supp (+25%) :</span>
                    <span>+{(totalOvertimeMins / 60).toFixed(1)} hrs</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmExportToPayroll}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Confirmer & Transmettre à MOD-03</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Exportation Réussie !</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Les données d'heures ont été synchronisées avec le module MOD-03 (Paie & RH Elyssa ERP).
                  </p>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default DailyTimesheetTable;
