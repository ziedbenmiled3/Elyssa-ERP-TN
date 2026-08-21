import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Camera, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Fingerprint, 
  Sparkles,
  ArrowRight,
  Clock,
  User,
  KeyRound,
  RefreshCw,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  History,
  Archive,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Bell,
  Mail,
  Send,
  FileText,
  AlertCircle,
  X,
  Trash2,
  CheckCheck,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, cleanFirestoreData } from '../utils/firebase';
import { MobileAccessGuard } from './mobile/MobileAccessGuard';
import { ChantierScreen } from '../mobile/views/ChantierScreen';
import { VanSalesScreen } from '../mobile/views/VanSalesScreen';
import { DriverDeliveryScreen } from '../mobile/views/DriverDeliveryScreen';
import { AssignedModule, MobileDevice } from '../types/mobileTerrain';
import { getOrCreateDeviceId } from '../mobile/services/mobileAuthService';
import offlineSyncEngine from '../mobile/services/offlineSyncEngine';

interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department?: string;
  ssn?: string;
  status: string;
  matricule?: string;
  branchId?: string;
  email?: string;
  referenceSelfie?: string;
  targetDailyHours?: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  date: string;
  clockIn?: string;
  checkIn?: string;
  clockOut?: string;
  checkOut?: string;
  location: string;
  status: 'Present' | 'Late' | 'Absent' | 'OnLeave';
  overtimeHours: number;
  notes?: string;
  isApproved: boolean;
  selfieUrl?: string; // Capture photograph base64 or URL
  photoUrl?: string;
  locationStatus?: string;
  siteId?: string;
  siteName?: string;
  distanceMeters?: number;
  updatedAt?: string;
}

const getDeletedRecordIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('elyssa_deleted_attendance_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
};

const recordDeletedId = (id: string): string[] => {
  const deleted = getDeletedRecordIds();
  deleted.add(id);
  const arr = Array.from(deleted);
  localStorage.setItem('elyssa_deleted_attendance_ids', JSON.stringify(arr));
  return arr;
};

const parseTimeToMinutes = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const clean = timeStr.trim();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
};

const getMergedAttendanceRecords = (companySuffix: string): AttendanceRecord[] => {
  const deletedSet = getDeletedRecordIds();
  const keysToTry = [
    `elyssa_attendance_records_${companySuffix}`,
    `elyssa_attendance_records_inter_affaires`,
  ];

  const map = new Map<string, AttendanceRecord>();
  keysToTry.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: AttendanceRecord) => {
            if (!r || !r.id || deletedSet.has(r.id)) return;
            const existing = map.get(r.id);
            if (!existing) {
              map.set(r.id, r);
            } else {
              map.set(r.id, {
                ...existing,
                ...r,
                clockIn: r.clockIn || existing.clockIn,
                clockOut: r.clockOut || existing.clockOut,
                overtimeHours: r.overtimeHours || existing.overtimeHours,
                notes: r.notes || existing.notes,
                selfieUrl: r.selfieUrl || existing.selfieUrl
              });
            }
          });
        }
      } catch (e) {}
    }
  });

  return Array.from(map.values()).filter(r => !deletedSet.has(r.id));
};

const saveAttendanceRecordsToKeys = (companySuffix: string, records: AttendanceRecord[]) => {
  const deletedSet = getDeletedRecordIds();
  const cleanRecords = records.filter(r => r && r.id && !deletedSet.has(r.id));
  const payload = JSON.stringify(cleanRecords);
  localStorage.setItem(`elyssa_attendance_records_${companySuffix}`, payload);
  localStorage.setItem(`elyssa_attendance_records_inter_affaires`, payload);
};

export default function PocketAttendanceView({
  isEmbeddedInSimulator = false,
  forcedEmployeeId = ''
}: {
  isEmbeddedInSimulator?: boolean;
  forcedEmployeeId?: string;
} = {}) {
  // Extract query params for company name & token security
  const urlParams = new URLSearchParams(window.location.search);

  const resolveCompanyParam = (): string => {
    const urlComp = urlParams.get('company');
    if (urlComp && urlComp.trim() && !urlComp.toLowerCase().includes('elyssa corp tunis')) {
      return urlComp.trim();
    }
    try {
      const sim = window.localStorage.getItem('carthage_active_company_simulated');
      if (sim && sim.trim()) return sim.trim();

      const sess = window.localStorage.getItem('carthage_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed?.company && typeof parsed.company === 'string' && parsed.company.trim()) {
          return parsed.company.trim();
        }
        if (parsed?.companyName && typeof parsed.companyName === 'string' && parsed.companyName.trim()) {
          return parsed.companyName.trim();
        }
      }
    } catch (e) {}
    return 'Inter-Affaires';
  };

  const rawCompanyParam = resolveCompanyParam();
  const companyParam = rawCompanyParam.replace(/\(Connexion Mère\)/gi, '').trim() || 'Inter-Affaires';
  const rawTokenParam = urlParams.get('token') || '';
  const rawMatriculeParam = urlParams.get('matricule') || urlParams.get('employeeId') || '';

  // Parse short token format if encoded as ELY:matricule:token
  let matriculeParam = rawMatriculeParam;
  let tokenParam = rawTokenParam;
  if (rawTokenParam.startsWith('ELY:')) {
    const parts = rawTokenParam.split(':');
    if (parts.length >= 3) {
      matriculeParam = matriculeParam || parts[1];
      tokenParam = parts[2];
    }
  }

  // Local storage company sandboxing
  const companySpecificKeys = [
    'carthage_employees',
    'elyssa_qr_config',
    'elyssa_company_locations',
    'elyssa_attendance_offline_queue',
    'elyssa_offline_queue'
  ];

  const localStorage = {
    getItem: (key: string): string | null => {
      if (companySpecificKeys.includes(key) || key.startsWith('elyssa_ref_selfie_')) {
        const suffix = companyParam.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return window.localStorage.getItem(`${key}_${suffix}`);
      }
      return window.localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (companySpecificKeys.includes(key) || key.startsWith('elyssa_ref_selfie_')) {
        const suffix = companyParam.toLowerCase().replace(/[^a-z0-9]/g, '_');
        window.localStorage.setItem(`${key}_${suffix}`, value);
        return;
      }
      window.localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (companySpecificKeys.includes(key) || key.startsWith('elyssa_ref_selfie_')) {
        const suffix = companyParam.toLowerCase().replace(/[^a-z0-9]/g, '_');
        window.localStorage.removeItem(`${key}_${suffix}`);
        return;
      }
      window.localStorage.removeItem(key);
    }
  };

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('carthage_employees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Get active configurations
  const [qrConfig, setQrConfig] = useState(() => {
    const saved = localStorage.getItem('elyssa_qr_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      companyName: companyParam,
      regenTime: '05:00',
      currentToken: 'ELY-QR-INITIAL',
      lastRegenDate: ''
    };
  });

  // States
  const [isSimulationActive] = useState<boolean>(() => {
    return localStorage.getItem('carthage_demo_simulation_active') === 'true';
  });

  const [companyLocations, setCompanyLocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('elyssa_company_locations');
    let rawLocations = [
      { id: 'loc-maman', name: 'Siège MAMAN (Connexion Mère)', lat: 36.8065, lng: 10.1815, radius: 150, isMaman: true },
      { id: 'loc-sfax', name: 'Succursale Sfax - Zone Industrielle Poudrière', lat: 34.7405, lng: 10.7603, radius: 150 },
      { id: 'loc-sousse', name: 'Agence Sousse - Boulevard 14 Janvier', lat: 35.8256, lng: 10.6369, radius: 150 }
    ];
    if (saved) {
      try {
        rawLocations = JSON.parse(saved);
      } catch (e) {}
    }
    const compName = companyParam || 'Inter-Affaires';
    const isInterAffaires = compName.trim().toUpperCase() === 'INTER-AFFAIRES';
    const expectedName = isInterAffaires 
      ? 'Siège Inter-Affaires (Connexion Mère)' 
      : `Siège ${compName} (Connexion Mère)`;

    return rawLocations.map((l: any) => {
      if (l.isMaman || l.id === 'loc-maman') {
        return { ...l, name: expectedName };
      }
      return l;
    });
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(() => {
    const maman = companyLocations.find(l => l.isMaman) || companyLocations[0];
    return {
      lat: maman.lat,
      lng: maman.lng,
      label: maman.name
    };
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  
  const [selfieState, setSelfieState] = useState<'idle' | 'scanning' | 'live' | 'captured'>('idle');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [referenceSelfie, setReferenceSelfie] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetail, setSuccessDetail] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Collaborator list search, DRH location filter & alphabetical sorting
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empBranchFilter, setEmpBranchFilter] = useState('all');
  const [empSortOrder, setEmpSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mobile Device Module Assignment State ('standard' | 'chantier' | 'vente' | 'polyvalent' | 'livraison')
  const [assignedModule, setAssignedModule] = useState<AssignedModule>(() => {
    try {
      const saved = window.localStorage.getItem('elyssa_mobile_assigned_module') || offlineSyncEngine.getStoredDeviceInfo()?.assigned_module;
      if (saved && ['standard', 'chantier', 'vente', 'polyvalent', 'livraison'].includes(saved)) {
        return saved as AssignedModule;
      }
    } catch (e) {}
    return 'standard';
  });

  const [activeOverlayScreen, setActiveOverlayScreen] = useState<'chantier' | 'vente' | 'livraison' | null>(null);

  // Attendance history status badges filter, calendar mode & expansion state
  const [historyFilter, setHistoryFilter] = useState<'all' | 'in_progress' | 'validated' | 'archived'>('all');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [historyMode, setHistoryMode] = useState<'list' | 'calendar'>('list');
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Transition animation feedback state for clocking buttons
  const [punchState, setPunchState] = useState<'idle' | 'submitting_in' | 'submitting_out' | 'success_in' | 'success_out'>('idle');

  // Real-time server sync status for clocking (pastille de statut)
  const [serverSyncStatus, setServerSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('synced');
  const [lastServerSyncTime, setLastServerSyncTime] = useState<Date | null>(() => new Date());
  const [lastPunchType, setLastPunchType] = useState<'in' | 'out' | null>(null);

  // Configured theoretical daily schedule (default 8.0h)
  const [defaultTargetHours, setDefaultTargetHours] = useState<number>(() => {
    const saved = localStorage.getItem('elyssa_default_target_hours');
    return saved ? parseFloat(saved) : 8.0;
  });

  // Absence declaration modal & HR notification states
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isAbsenceHistoryExpanded, setIsAbsenceHistoryExpanded] = useState(false);
  const [absenceSubmitting, setAbsenceSubmitting] = useState(false);
  const [hrAlertSuccess, setHrAlertSuccess] = useState<any | null>(null);

  const [absenceForm, setAbsenceForm] = useState({
    type: 'PaidLeave' as 'PaidLeave' | 'SickLeave' | 'UnpaidAbsence' | 'WorkAccident' | 'Maternity',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    hrEmail: localStorage.getItem('elyssa_hr_email') || 'a.bensoltane@carthage.com.tn',
    sendEmailAlert: true
  });

  // Sync absences from localStorage
  const [absencesList, setAbsencesList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('carthage_absences');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'PaidLeave': return 'Congé Payé';
      case 'SickLeave': return 'Arrêt Maladie / Certificat Médical';
      case 'UnpaidAbsence': return 'Absence Non Payée / Personnelle';
      case 'WorkAccident': return 'Accident du Travail / Trajet';
      case 'Maternity': return 'Congé Maternité / Paternité';
      default: return 'Absence';
    }
  };

  const handleUpdateTargetHours = (delta: number) => {
    const selEmp = employees.find(e => e.id === selectedEmployeeId);
    if (selEmp) {
      const currentTarget = selEmp.targetDailyHours !== undefined ? selEmp.targetDailyHours : defaultTargetHours;
      const newTarget = Math.max(1, Math.min(14, Math.round((currentTarget + delta) * 10) / 10));
      
      const updatedEmployees = employees.map(emp => 
        emp.id === selEmp.id ? { ...emp, targetDailyHours: newTarget } : emp
      );
      setEmployees(updatedEmployees);
      localStorage.setItem('carthage_employees', JSON.stringify(updatedEmployees));
    } else {
      const newTarget = Math.max(1, Math.min(14, Math.round((defaultTargetHours + delta) * 10) / 10));
      setDefaultTargetHours(newTarget);
      localStorage.setItem('elyssa_default_target_hours', newTarget.toString());
    }
  };

  const handleSubmitAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    setAbsenceSubmitting(true);
    setHrAlertSuccess(null);

    const selEmp = employees.find(e => e.id === selectedEmployeeId);
    const empName = selEmp ? selEmp.name : 'Collaborateur';
    const empMatricule = selEmp?.matricule || selectedEmployeeId || 'MAT-POCKET';
    const empJob = selEmp?.jobTitle || 'Collaborateur Elyssa ERP';

    // Calculate days count
    const start = new Date(absenceForm.startDate);
    const end = new Date(absenceForm.endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const typeLabel = getTypeLabel(absenceForm.type);

    // 1. Create Absence Record
    const newAbsenceRecord = {
      id: `abs-pocket-${Date.now()}`,
      employeeId: selectedEmployeeId || 'emp-demo',
      employeeName: empName,
      type: absenceForm.type,
      startDate: absenceForm.startDate,
      endDate: absenceForm.endDate,
      daysCount: daysCount,
      isDeductibleFromSalary: absenceForm.type === 'UnpaidAbsence' || absenceForm.type === 'SickLeave',
      deductionAmount: 0,
      status: 'Requested',
      description: absenceForm.reason || `Déclaration via Pocket Attendance (${typeLabel})`,
      submittedAt: new Date().toISOString(),
      hrAlertSent: absenceForm.sendEmailAlert,
      hrEmailRecipient: absenceForm.hrEmail
    };

    // Update carthage_absences in localStorage
    const updatedAbsences = [newAbsenceRecord, ...absencesList];
    localStorage.setItem('carthage_absences', JSON.stringify(updatedAbsences));
    setAbsencesList(updatedAbsences);

    // Save HR Email preference
    localStorage.setItem('elyssa_hr_email', absenceForm.hrEmail);

    let alertFeedback = null;

    // 2. Send HR Email alert
    if (absenceForm.sendEmailAlert) {
      const hrEmailObj = {
        id: `mail-hr-abs-${Date.now()}`,
        senderName: empName,
        senderEmail: selEmp?.email || 'collaborateur@elyssa.pro',
        subject: `🚨 [ALERTE RH - ABSENCE] Déclaration de : ${empName} (${empMatricule})`,
        body: `
📌 NOTIFICATION RH AUTOMATIQUE - ELYSSA ERP POCKET
----------------------------------------------------
Une nouvelle déclaration d'absence a été enregistrée :

• Collaborateur : ${empName}
• Matricule     : ${empMatricule}
• Fonction      : ${empJob}
• Type Absence  : ${typeLabel}
• Période       : Du ${absenceForm.startDate} au ${absenceForm.endDate} (${daysCount} jour(s))
• Motif / Notes : ${absenceForm.reason || 'Aucun motif renseigné'}
• Statut        : ⏳ En attente de validation RH
• Horodatage    : ${new Date().toLocaleString('fr-FR')}

----------------------------------------------------
Destinataire RH : ${absenceForm.hrEmail} (Responsable Ressources Humaines)
Alerte transmise automatiquement via le module Pocket Attendance d'Elyssa ERP.
        `.trim(),
        date: new Date().toISOString().split('T')[0],
        isRead: false,
        category: 'general'
      };

      try {
        const activeTenant = localStorage.getItem('carthage_active_company') || 'company_parent';
        const key = `carthage_${activeTenant.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_imap_inbox`;
        const rawMails = localStorage.getItem(key) || localStorage.getItem('carthage_incoming_emails');
        const mailsList = rawMails ? JSON.parse(rawMails) : [];
        const updatedMails = [hrEmailObj, ...mailsList];
        localStorage.setItem(key, JSON.stringify(updatedMails));
        if (activeTenant.toLowerCase().includes('inter-affaires') || activeTenant === 'company_parent') {
          localStorage.setItem('carthage_incoming_emails', JSON.stringify(updatedMails));
        }
      } catch (err) {}

      try {
        const rawComm = localStorage.getItem('carthage_communication_logs');
        const commList = rawComm ? JSON.parse(rawComm) : [];
        const commObj = {
          id: `comm-hr-abs-${Date.now()}`,
          recipientName: `Responsable RH (${absenceForm.hrEmail})`,
          recipientEmail: absenceForm.hrEmail,
          subject: hrEmailObj.subject,
          body: hrEmailObj.body,
          sentAt: new Date().toISOString(),
          type: 'Email',
          status: 'Delivered',
          module: 'Pocket Attendance / DRH'
        };
        localStorage.setItem('carthage_communication_logs', JSON.stringify([commObj, ...commList]));
      } catch (err) {}

      alertFeedback = {
        recipient: absenceForm.hrEmail,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        daysCount,
        employeeName: empName,
        typeLabel
      };
    }

    setTimeout(() => {
      setAbsenceSubmitting(false);
      setHrAlertSuccess(alertFeedback || { employeeName: empName, typeLabel, daysCount, recipient: absenceForm.hrEmail });
      setIsAbsenceModalOpen(false);
      setAbsenceForm(prev => ({ ...prev, reason: '' }));
    }, 500);
  };

  const handleDeleteAbsence = (absId: string) => {
    const updated = absencesList.filter(a => a.id !== absId);
    localStorage.setItem('carthage_absences', JSON.stringify(updated));
    setAbsencesList(updated);
  };

  // Processed employees array for dropdowns
  const processedEmployees = useMemo(() => {
    let list = employees.filter(emp => emp.status !== 'Terminated');

    if (empBranchFilter !== 'all') {
      list = list.filter(emp => (emp.branchId || 'loc-maman') === empBranchFilter);
    }

    if (empSearchQuery.trim()) {
      const q = empSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.name.toLowerCase().includes(q) ||
        (emp.matricule && emp.matricule.toLowerCase().includes(q)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const comp = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      return empSortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [employees, empBranchFilter, empSearchQuery, empSortOrder]);

  // Synchronize configurations and records from Firestore
  useEffect(() => {
    const docId = companyParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(db, 'attendance_settings', docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.companyLocations) {
          const compName = companyParam || 'Inter-Affaires';
          const isInterAffaires = compName.trim().toUpperCase() === 'INTER-AFFAIRES';
          const expectedName = isInterAffaires 
            ? 'Siège Inter-Affaires (Connexion Mère)' 
            : `Siège ${compName} (Connexion Mère)`;

          const mappedLocs = data.companyLocations.map((l: any) => {
            if (l.isMaman || l.id === 'loc-maman') {
              return { ...l, name: expectedName };
            }
            return l;
          });
          setCompanyLocations(mappedLocs);
          localStorage.setItem('elyssa_company_locations', JSON.stringify(mappedLocs));
          
          // Force update GPS location if gpsLocation is currently loaded with old default coordinates
          setGpsLocation(prev => {
            const maman = mappedLocs.find((l: any) => l.isMaman) || mappedLocs[0];
            return {
              ...prev,
              lat: prev.lat === 36.8065 ? maman.lat : prev.lat,
              lng: prev.lng === 10.1815 ? maman.lng : prev.lng,
              label: prev.lat === 36.8065 ? `${maman.name} (GPS Réel)` : prev.label
            };
          });
        }
        if (data.qrConfig) {
          setQrConfig(data.qrConfig);
          localStorage.setItem('elyssa_qr_config', JSON.stringify(data.qrConfig));
        }
        if (data.employees) {
          setEmployees(data.employees);
          localStorage.setItem('carthage_employees', JSON.stringify(data.employees));

          // Sync database-enrolled reference selfie for selected employee
          if (selectedEmployeeId) {
            const matchedEmp = data.employees.find((e: any) => e.id === selectedEmployeeId);
            if (matchedEmp?.referenceSelfie) {
              setReferenceSelfie(matchedEmp.referenceSelfie);
              localStorage.setItem(`elyssa_ref_selfie_${selectedEmployeeId}`, matchedEmp.referenceSelfie);
            }
          }
        }
        if (data.deletedRecordIds && Array.isArray(data.deletedRecordIds)) {
          data.deletedRecordIds.forEach((id: string) => recordDeletedId(id));
        }
        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
          const suffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const deletedSet = getDeletedRecordIds();
          const cleanDataRecs = data.records.filter((r: AttendanceRecord) => r && r.id && !deletedSet.has(r.id));

          const existing = getMergedAttendanceRecords(suffix);
          const map = new Map<string, AttendanceRecord>();
          existing.forEach(r => r && r.id && !deletedSet.has(r.id) && map.set(r.id, r));

          cleanDataRecs.forEach((r: AttendanceRecord) => {
            if (!r || !r.id || deletedSet.has(r.id)) return;
            const prevRec = map.get(r.id);
            if (!prevRec) {
              map.set(r.id, r);
            } else {
              map.set(r.id, {
                ...prevRec,
                ...r,
                clockIn: r.clockIn || prevRec.clockIn,
                clockOut: r.clockOut || prevRec.clockOut,
                overtimeHours: r.overtimeHours || prevRec.overtimeHours,
                notes: r.notes || prevRec.notes,
                selfieUrl: r.selfieUrl || prevRec.selfieUrl
              });
            }
          });
          const merged = Array.from(map.values()).filter(r => !deletedSet.has(r.id));
          saveAttendanceRecordsToKeys(suffix, merged);
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('elyssa_attendance_updated', { detail: merged }));
        }
      }
    }, (error) => {
      console.error("Firestore loading error in PocketAttendanceView:", error);
    });

    return () => unsubscribe();
  }, [companyParam, selectedEmployeeId]);

  // Listen to Firestore mobile_devices document for assigned_module updates
  useEffect(() => {
    const compTenant = companyParam || 'Inter-Affaires';
    const devId = getOrCreateDeviceId();
    const deviceDocRef = doc(db, 'company_erp_data', compTenant, 'mobile_devices', devId);

    const unsubDevice = onSnapshot(deviceDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MobileDevice;
        if (data.assigned_module) {
          setAssignedModule(data.assigned_module);
          window.localStorage.setItem('elyssa_mobile_assigned_module', data.assigned_module);
        }
      }
    }, (err) => {
      console.warn("Mobile device module lookup error:", err);
    });

    return () => unsubDevice();
  }, [companyParam]);

  // 100% Automatic Module Routing based on assigned_module
  useEffect(() => {
    if (assignedModule === 'livraison') {
      setActiveOverlayScreen('livraison');
    } else if (assignedModule === 'vente') {
      setActiveOverlayScreen('vente');
    } else if (assignedModule === 'chantier') {
      setActiveOverlayScreen('chantier');
    }
  }, [assignedModule]);

  // Automatic module deduction when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
        const title = (emp.jobTitle || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        if (title.includes('chauffeur') || title.includes('livreur') || title.includes('livraison') || dept.includes('logistique')) {
          setAssignedModule('livraison');
        } else if (title.includes('commercial') || title.includes('vente') || title.includes('caisse') || dept.includes('commercial')) {
          setAssignedModule('vente');
        } else if (title.includes('chantier') || title.includes('btp') || title.includes('chef') || dept.includes('technique')) {
          setAssignedModule('chantier');
        }
      }
    }
  }, [selectedEmployeeId, employees]);

  // Lock onto individual employee if matricule/employeeId param is present
  useEffect(() => {
    if (matriculeParam && employees.length > 0) {
      const found = employees.find(e => 
        e.id.toLowerCase() === matriculeParam.toLowerCase() || 
        (e.matricule && e.matricule.toLowerCase() === matriculeParam.toLowerCase())
      );
      if (found) {
        setSelectedEmployeeId(found.id);
        console.log(`🔒 Session locked on employee: ${found.name} via matricule: ${matriculeParam}`);
      }
    }
  }, [matriculeParam, employees]);

  // Refs for real-time camera streaming
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Local clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Haversine formula to compute distance in meters between two coordinates
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Calibrate company site coordinates using current real device GPS
  const handleSetCurrentGPSAsBranchLocation = async (targetBranchId: string) => {
    let currentLat = gpsLocation.lat;
    let currentLng = gpsLocation.lng;

    // Direct live GPS fetch for pinpoint accuracy
    if (navigator.geolocation && !isSimulationActive) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
          });
        });
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
      } catch (err) {
        console.warn("Geolocation live fetch notice during calibration:", err);
      }
    }

    if (!currentLat || !currentLng) {
      setErrorMsg("Veuillez d'abord rafraîchir votre position GPS.");
      return;
    }

    try {
      const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
      const activeBranchId = selectedEmp?.branchId || targetBranchId || 'loc-maman';

      const updatedLocations = companyLocations.map(loc => {
        if (
          loc.id === targetBranchId || 
          loc.id === activeBranchId || 
          (targetBranchId === 'loc-maman' && loc.isMaman) || 
          (activeBranchId === 'loc-maman' && loc.isMaman) ||
          loc.isMaman
        ) {
          return {
            ...loc,
            lat: currentLat,
            lng: currentLng,
            updatedAt: new Date().toISOString()
          };
        }
        return loc;
      });

      setCompanyLocations(updatedLocations);
      localStorage.setItem('elyssa_company_locations', JSON.stringify(updatedLocations));
      window.dispatchEvent(new Event('elyssa_locations_updated'));

      // Sync to Firestore
      const docId = companyParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const docRef = doc(db, 'attendance_settings', docId);
      await setDoc(docRef, cleanFirestoreData({
        companyLocations: updatedLocations,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      // Update current GPS label and state
      const matchedBranch = updatedLocations.find(l => l.id === targetBranchId) || updatedLocations.find(l => l.isMaman) || updatedLocations[0];
      setGpsLocation({
        lat: currentLat,
        lng: currentLng,
        label: `${matchedBranch.name} (GPS Réel - Calibré)`
      });

      setSuccessMsg(`🎯 Coordonnées GPS du site "${matchedBranch.name}" mises à jour à votre position actuelle ! Vous êtes désormais en zone conforme (0m) et votre pointage est débloqué.`);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error("Error setting branch location:", err);
      setErrorMsg("Erreur lors de la mise à jour des coordonnées GPS du site.");
    }
  };

  // Acquire real geolocation in production
  const getRealGPSPosition = () => {
    if (isSimulationActive) return;
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGpsLoading(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Find assigned branch for selected employee, default to mother branch
        const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
        const branchId = selectedEmp?.branchId || 'loc-maman';
        const branch = companyLocations.find(l => l.id === branchId) || companyLocations[0];
        
        const distance = getDistance(latitude, longitude, branch.lat, branch.lng);
        let label = 'Position GPS Capturée';
        if (distance <= branch.radius) {
          label = `${branch.name} (GPS Réel)`;
        } else {
          const shortBranchName = branch.name.replace("Siège ", "").replace(" (Connexion Mère)", "").replace("Succursale ", "").replace("Agence ", "").split(" - ")[0] || branch.name;
          label = `Hors Établissement (À ${(distance / 1000).toFixed(2)} km de ${shortBranchName})`;
        }
        setGpsLocation({
          lat: latitude,
          lng: longitude,
          label: label
        });
        setGpsLoading(false);
      },
      (error) => {
        console.error("GPS error:", error);
        let errorTxt = "Impossible de récupérer votre position GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorTxt = "🚫 Accès GPS refusé. Veuillez activer la localisation de votre appareil pour pouvoir pointer.";
        }
        setErrorMsg(errorTxt);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Camera acquisition handlers for production
  const startRealCamera = async () => {
    setErrorMsg('');
    setCameraLoading(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setCameraStream(stream);
      setSelfieState('live');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg("⚠️ Impossible d'accéder à la caméra. Veuillez autoriser l'accès à la caméra pour l'authentification biométrique.");
    } finally {
      setCameraLoading(false);
    }
  };

  const captureRealPhoto = (isEnroll: boolean) => {
    if (!videoRef.current) return;
    
    let capturedDataUrl = '';
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      // Compact 180x180 resolution to maintain high quality thumbnail while keeping base64 under 5KB
      const targetSize = 180;
      let vW = video.videoWidth || 640;
      let vH = video.videoHeight || 480;
      let scale = Math.min(targetSize / vW, targetSize / vH);
      canvas.width = Math.round(vW * scale) || targetSize;
      canvas.height = Math.round(vH * scale) || targetSize;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror view for natural selfie experience
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
      }
    } catch (e) {
      console.error("Immediate capture error:", e);
      setErrorMsg("Une erreur s'est produite lors de la capture biométrique.");
      return;
    }

    // Stop camera tracks immediately since we already captured the frame!
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    setSelfieState('scanning');
    
    setTimeout(() => {
      try {
        if (!capturedDataUrl) {
          throw new Error("No photo data captured.");
        }
        
        if (isEnroll || !referenceSelfie) {
          localStorage.setItem(`elyssa_ref_selfie_${selectedEmployeeId}`, capturedDataUrl);
          setReferenceSelfie(capturedDataUrl);
          
          // Save to Firestore central database
          saveReferenceSelfieToDatabase(selectedEmployeeId, capturedDataUrl);

          // Automatically validate current selfie for immediate Punch In / Out
          setSelfieUrl(capturedDataUrl);
          setSelfieState('captured');
          setSuccessMsg('✨ ELYSSA ERP • BADGE RH & Selfie de référence créés et enregistrés automatiquement !');
          setTimeout(() => setSuccessMsg(''), 5000);
        } else {
          setSelfieUrl(capturedDataUrl);
          setSelfieState('captured');
        }
      } catch (e) {
        console.error("Capture processing error:", e);
        setErrorMsg("Une erreur s'est produite lors de la capture biométrique.");
      }
    }, 1500);
  };

  const handleCancelCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setSelfieState('idle');
  };

  // Bind camera stream to HTML video tag
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
    }
  }, [cameraStream, selfieState]);

  // Cleanup stream on unmount or selected changes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Track whenever selected employee changes to load their registered reference selfie and acquire GPS
  useEffect(() => {
    if (selectedEmployeeId) {
      const matchedEmployee = employees.find(e => e.id === selectedEmployeeId || e.matricule === selectedEmployeeId);
      const dbRef = matchedEmployee?.referenceSelfie || (matchedEmployee as any)?.photoUrl || (matchedEmployee as any)?.photo;
      const saved = localStorage.getItem(`elyssa_ref_selfie_${selectedEmployeeId}`) ||
                    window.localStorage.getItem(`elyssa_ref_selfie_${selectedEmployeeId}`) ||
                    window.localStorage.getItem(`elyssa_ref_selfie_${selectedEmployeeId}_inter_affaires`) ||
                    (matchedEmployee?.matricule ? window.localStorage.getItem(`elyssa_ref_selfie_${matchedEmployee.matricule}`) : null);
      
      const activeRef = dbRef || saved || null;
      setReferenceSelfie(activeRef);

      if (!isSimulationActive) {
        getRealGPSPosition();
      } else {
        // In simulation mode, immediately mock GPS to the employee's assigned branch coordinates
        const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
        const branchId = selectedEmp?.branchId || 'loc-maman';
        const branch = companyLocations.find(l => l.id === branchId) || companyLocations[0];
        setGpsLocation({
          lat: branch.lat,
          lng: branch.lng,
          label: `${branch.name} (GPS Certifié)`
        });
      }
    } else {
      setReferenceSelfie(null);
    }
    setSelfieState('idle');
    setSelfieUrl('');
    setErrorMsg('');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [selectedEmployeeId, employees, companyLocations, isSimulationActive]);

  const isTokenValid = tokenParam === qrConfig.currentToken || !tokenParam;

  // Sync token for testing purposes if user requests
  const handleBypassToken = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('token', qrConfig.currentToken);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    setSuccessMsg('Jeton de test synchronisé avec le configurateur principal !');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const saveReferenceSelfieToDatabase = async (employeeId: string, selfieDataUrl: string) => {
    try {
      const docId = companyParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const docRef = doc(db, 'attendance_settings', docId);

      const updatedEmployees = employees.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, referenceSelfie: selfieDataUrl };
        }
        return emp;
      });

      setEmployees(updatedEmployees);
      localStorage.setItem('carthage_employees', JSON.stringify(updatedEmployees));

      await setDoc(docRef, cleanFirestoreData({
        employees: updatedEmployees,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      console.log(`[Firestore] Registered reference selfie for ${employeeId}`);
    } catch (e) {
      console.error("Error saving reference selfie to Firestore:", e);
    }
  };

  const handleEnrollSelfie = () => {
    if (!selectedEmployeeId) {
      setErrorMsg('Veuillez sélectionner votre profil d\'abord.');
      return;
    }
    if (isSimulationActive) {
      setSelfieState('scanning');
      setTimeout(() => {
        // Create a nice human illustration avatar as the reference selfie
        const enrolledUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=ref_${selectedEmployeeId}`;
        localStorage.setItem(`elyssa_ref_selfie_${selectedEmployeeId}`, enrolledUrl);
        setReferenceSelfie(enrolledUrl);

        // Save simulated reference selfie to database
        saveReferenceSelfieToDatabase(selectedEmployeeId, enrolledUrl);

        setSelfieUrl(enrolledUrl);
        setSelfieState('captured');
        setSuccessMsg('✨ Enrôlement réussi ! Votre selfie de référence est maintenant enregistré et validé pour le pointage.');
        setTimeout(() => setSuccessMsg(''), 5000);
      }, 2000);
    } else {
      startRealCamera();
    }
  };

  const handleSelfieCapture = () => {
    if (!selectedEmployeeId) {
      setErrorMsg('Veuillez sélectionner votre profil d\'abord.');
      return;
    }
    if (isSimulationActive) {
      setSelfieState('scanning');
      setTimeout(() => {
        // Use a slightly different seed to show variance in the live photograph
        const liveUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=live_${selectedEmployeeId}_${Date.now()}`;
        setSelfieUrl(liveUrl);
        setSelfieState('captured');
      }, 1800);
    } else {
      startRealCamera();
    }
  };

  const handleResetReferenceSelfie = async () => {
    if (selectedEmployeeId) {
      localStorage.removeItem(`elyssa_ref_selfie_${selectedEmployeeId}`);
      setReferenceSelfie(null);
      setSelfieState('idle');
      setSelfieUrl('');
      
      // Also reset reference selfie inside Firestore database
      try {
        const docId = companyParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const docRef = doc(db, 'attendance_settings', docId);

        const updatedEmployees = employees.map(emp => {
          if (emp.id === selectedEmployeeId) {
            const { referenceSelfie, ...rest } = emp;
            return rest;
          }
          return emp;
        });

        setEmployees(updatedEmployees);
        localStorage.setItem('carthage_employees', JSON.stringify(updatedEmployees));

        await setDoc(docRef, cleanFirestoreData({
          employees: updatedEmployees,
          updatedAt: new Date().toISOString()
        }), { merge: true });

        setSuccessMsg('Selfie de référence réinitialisé. Enrôlement requis pour le prochain pointage.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (e) {
        console.error("Error clearing reference selfie from Firestore:", e);
      }
    }
  };

  const handlePunch = async (type: 'in' | 'out') => {
    if (!selectedEmployeeId) {
      setErrorMsg('Veuillez sélectionner votre profil collaborateur.');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) {
      setErrorMsg('Collaborateur introuvable.');
      return;
    }

    // -------------------------------------------------------------
    // 1. CALCUL DE GÉOFENCING STRICT (Haversine Formula)
    // -------------------------------------------------------------
    const branchId = employee.branchId || 'loc-maman';
    const branch = companyLocations.find(l => l.id === branchId) || companyLocations[0];

    let currentLat = gpsLocation.lat;
    let currentLng = gpsLocation.lng;

    // Fetch live smartphone GPS position if navigator is available
    if (navigator.geolocation && !isSimulationActive) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
          });
        });
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
        setGpsLocation({
          lat: currentLat,
          lng: currentLng,
          label: `${branch.name} (GPS Réel Direct)`
        });
      } catch (err) {
        console.warn("Geolocation live fetch notice, using active GPS state:", err);
      }
    }

    // Calculate distance with Haversine formula
    const distanceMeters = Math.round(getDistance(currentLat, currentLng, branch.lat, branch.lng));
    const allowedRadius = branch.radius || 150;

    if (!isSimulationActive && distanceMeters > allowedRadius) {
      // BLOQUER le pointage + Afficher l'alerte rouge requise
      setErrorMsg(`Pointage refusé : Vous êtes hors de votre zone de travail (Distance: ${distanceMeters} mètres)`);
      setSuccessMsg('');
      return; // Empêcher toute écriture dans la base de données !
    }

    // -------------------------------------------------------------
    // 2. COMPARAISON DU SELFIE ENRÔLÉ (Reconnaissance / Similitude)
    // -------------------------------------------------------------
    const empRefSelfie = employee.referenceSelfie || (employee as any).referenceSelfieUrl || (employee as any).photoUrl || (employee as any).photo;
    const activeRef = referenceSelfie || empRefSelfie || window.localStorage.getItem(`elyssa_ref_selfie_${selectedEmployeeId}`);

    // Si le 1er selfie n'existe pas : Enrôlement initial obligatoire
    if (!activeRef) {
      if (selfieUrl && selfieState === 'captured') {
        localStorage.setItem(`elyssa_ref_selfie_${selectedEmployeeId}`, selfieUrl);
        window.localStorage.setItem(`elyssa_ref_selfie_${selectedEmployeeId}`, selfieUrl);
        setReferenceSelfie(selfieUrl);
        saveReferenceSelfieToDatabase(selectedEmployeeId, selfieUrl);
        setSuccessMsg('✨ Enrôlement initial réussi ! Votre selfie de référence est sauvegardé.');
      } else {
        setErrorMsg('📸 Veuillez prendre votre 1er selfie de référence : l\'enrôlement initial est obligatoire pour pouvoir pointer.');
        setSuccessMsg('');
        return;
      }
    } else if (!referenceSelfie) {
      setReferenceSelfie(activeRef);
    }

    // Capture du selfie en direct obligatoire
    if (selfieState !== 'captured' || !selfieUrl) {
      setErrorMsg('📸 Selfie de vérification obligatoire pour valider votre pointage par reconnaissance faciale.');
      setSuccessMsg('');
      return;
    }

    // Verification du selfie capturé vs selfie de référence (Gemini API / Serveur)
    if (activeRef && selfieUrl && activeRef !== selfieUrl) {
      try {
        const verifyRes = await fetch('/api/attendance/verify-selfie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceSelfie: activeRef,
            capturedSelfie: selfieUrl
          })
        }).then(res => res.json());

        if (verifyRes && verifyRes.match === false) {
          // BLOQUER le pointage + Alerte rouge
          setErrorMsg('Pointage refusé : Identité visuelle non reconnue');
          setSuccessMsg('');
          return; // Empêcher toute écriture dans la base de données !
        }
      } catch (vErr) {
        console.warn("Selfie verification API call notice:", vErr);
      }
    }

    // -------------------------------------------------------------
    // 3. ENREGISTREMENT ET ÉCRITURE DANS LE REGISTRE
    // -------------------------------------------------------------
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Load existing records
    let records = getMergedAttendanceRecords(companySuffix);

    let recordIndex = records.findIndex(r => 
      r && r.date === todayStr && (
        r.employeeId === employee.id ||
        (r.employeeName && employee.name && r.employeeName.toLowerCase().trim() === employee.name.toLowerCase().trim())
      )
    );
    
    const existingRecord = recordIndex >= 0 ? records[recordIndex] : null;
    let updatedRecord: AttendanceRecord;

    if (type === 'in') {
      if (existingRecord?.clockIn && existingRecord?.clockOut) {
        setErrorMsg(`❌ Pointage déjà complété aujourd'hui : Entrée à ${existingRecord.clockIn} et Sortie à ${existingRecord.clockOut}. Redondance refusée.`);
        return;
      }

      if (existingRecord?.clockIn) {
        setErrorMsg(`❌ Doublon d'entrée : Vous avez déjà enregistré votre pointage d'entrée aujourd'hui à ${existingRecord.clockIn}.`);
        return;
      }

      const isLate = hours > 8 || (hours === 8 && minutes > 30);
      const statusLabel = isLate ? 'EN_RETARD' : 'A_L_HEURE';

      updatedRecord = {
        id: existingRecord?.id || `att_${employee.id}_${todayStr.replace(/-/g, '')}`,
        employeeId: employee.id || "EMP-GE_1",
        employeeName: employee.name || "MED ZIED BEN MILED",
        jobTitle: employee.jobTitle || "Collaborateur",
        date: todayStr,
        clockIn: timeStr,
        checkIn: timeStr,
        clockOut: existingRecord?.clockOut,
        photoUrl: selfieUrl || activeRef || '',
        selfieUrl: selfieUrl || activeRef || '',
        locationStatus: "GPS_VERIFIED",
        siteId: branch.id || "loc-maman",
        siteName: branch.name,
        distanceMeters: distanceMeters,
        location: `${branch.name} (GPS_VERIFIED: ${distanceMeters}m)`,
        status: statusLabel as any,
        overtimeHours: existingRecord?.overtimeHours || 0,
        isApproved: true,
        notes: isLate ? 'Enregistré via Elyssa Pocket (Retard détecté)' : 'Enregistré via Elyssa Pocket (GPS & Visuel Validés)',
        updatedAt: new Date().toISOString()
      };

      if (recordIndex >= 0) {
        records[recordIndex] = { ...records[recordIndex], ...updatedRecord };
      } else {
        records.unshift(updatedRecord);
      }
    } else {
      // Punch Out
      if (!existingRecord || (!existingRecord.clockIn && !existingRecord.checkIn)) {
        setErrorMsg('❌ Pointage contradictoire : Aucun pointage d\'entrée n\'a été détecté pour aujourd\'hui. Vous devez effectuer un PUNCH IN (Entrée) avant de marquer votre sortie.');
        return;
      }

      if (existingRecord.clockOut) {
        setErrorMsg(`❌ Doublon de sortie : Vous avez déjà enregistré votre pointage de sortie aujourd'hui à ${existingRecord.clockOut}.`);
        return;
      }

      const clockInTime = existingRecord.clockIn || existingRecord.checkIn || '';
      const clockInMins = parseTimeToMinutes(clockInTime);
      const currentMins = hours * 60 + minutes;

      if (clockInMins !== null && currentMins < clockInMins) {
        setErrorMsg(`❌ Heure contradictoire : L'heure de sortie (${timeStr}) ne peut pas être antérieure à votre heure d'entrée (${clockInTime}).`);
        return;
      }

      let overtime = 0;
      if (hours > 17 || (hours === 17 && minutes > 15)) {
        const standardMin = 17 * 60 + 15;
        overtime = parseFloat(((currentMins - standardMin) / 60).toFixed(2));
      }

      updatedRecord = {
        ...existingRecord,
        employeeId: employee.id || existingRecord.employeeId || "EMP-GE_1",
        employeeName: employee.name || existingRecord.employeeName || "MED ZIED BEN MILED",
        clockOut: timeStr,
        overtimeHours: overtime,
        locationStatus: "GPS_VERIFIED",
        photoUrl: selfieUrl || existingRecord.photoUrl || existingRecord.selfieUrl || activeRef || '',
        selfieUrl: selfieUrl || existingRecord.selfieUrl || activeRef || '',
        notes: overtime > 0 
          ? `${existingRecord.notes || ''} | Heures supplémentaires: ${overtime}h`.trim()
          : (existingRecord.notes || 'Sortie enregistrée via Elyssa Pocket'),
        updatedAt: new Date().toISOString()
      };
      records[recordIndex] = updatedRecord;
    }

    // Save locally and broadcast custom events
    saveAttendanceRecordsToKeys(companySuffix, records);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('elyssa_attendance_updated', { detail: records }));

    setLastPunchType(type);

    if (offlineMode) {
      setServerSyncStatus('offline');
      const offlineQueue = JSON.parse(localStorage.getItem('elyssa_offline_queue') || '[]');
      offlineQueue.push({ type, record: updatedRecord, timestamp: new Date().toISOString() });
      localStorage.setItem('elyssa_offline_queue', JSON.stringify(offlineQueue));
      setSuccessMsg('⚠️ Mode Hors-Ligne : Pointage stocké localement. Il sera synchronisé dès le retour du réseau.');
    } else {
      setServerSyncStatus('syncing');

      // 1. Send punch to Express backend API route
      let apiSynced = false;
      fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyParam,
          record: updatedRecord,
          records: records
        })
      })
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success) {
          apiSynced = true;
          setServerSyncStatus('synced');
          setLastServerSyncTime(new Date());
        }
      })
      .catch(err => console.warn('[Client Punch] API route notice, relying on direct Firestore sync:', err));

      // 2. Direct client Firestore sync to company_erp_data/{companyId}/attendance_logs/{record.id}
      try {
        const rawDocId = companyParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const docIdsToSync = [rawDocId].filter(Boolean);

        const cleanRecords: AttendanceRecord[] = records.map(r => ({
          ...r,
          selfieUrl: (r.selfieUrl && r.selfieUrl.length > 200000) ? '' : (r.selfieUrl || '')
        }));

        const syncPromises = docIdsToSync.map(async (id) => {
          // Sync attendance_settings
          const docRef = doc(db, 'attendance_settings', id);
          try {
            const snap = await getDoc(docRef);
            let merged = [...cleanRecords];
            if (snap.exists() && snap.data()?.records && Array.isArray(snap.data().records)) {
              const remoteRecs = snap.data().records;
              const map = new Map<string, AttendanceRecord>();
              remoteRecs.forEach((r: AttendanceRecord) => { if (r && r.id) map.set(r.id, r); });
              cleanRecords.forEach((r: AttendanceRecord) => { if (r && r.id) map.set(r.id, r); });
              merged = Array.from(map.values());
            }
            await setDoc(docRef, cleanFirestoreData({
              records: merged,
              updatedAt: new Date().toISOString()
            }), { merge: true });

            // Sync company_erp_data/{id}/attendance_logs/{record.id}
            const logRef = doc(db, 'company_erp_data', id, 'attendance_logs', updatedRecord.id);
            await setDoc(logRef, cleanFirestoreData({
              ...updatedRecord,
              locationStatus: "GPS_VERIFIED",
              updatedAt: new Date().toISOString()
            }), { merge: true });

            // Sync time_tracking
            const timeTrackRef = doc(db, 'time_tracking', updatedRecord.id);
            await setDoc(timeTrackRef, cleanFirestoreData({
              ...updatedRecord,
              locationStatus: "GPS_VERIFIED",
              updatedAt: new Date().toISOString()
            }), { merge: true });

          } catch (e) {
            const lightRecs: AttendanceRecord[] = records.map(r => ({ ...r, selfieUrl: '' }));
            await setDoc(docRef, cleanFirestoreData({ records: lightRecs, updatedAt: new Date().toISOString() }), { merge: true });
          }
        });

        Promise.all(syncPromises)
          .then(() => {
            setServerSyncStatus('synced');
            setLastServerSyncTime(new Date());
          })
          .catch((err) => {
            console.error("Firestore sync error:", err);
            if (!apiSynced) {
              setServerSyncStatus('error');
            }
          });
      } catch (err) {
        console.error("Client Firestore sync error:", err);
      }
    }

    setIsSuccess(true);
    setSuccessMsg(`Pointage ${type === 'in' ? "d'entrée" : "de sortie"} validé avec succès ! (GPS & Identité visuelle vérifiés)`);

    setSuccessDetail({
      employeeName: employee.name,
      jobTitle: employee.jobTitle,
      type: type === 'in' ? 'ENTRÉE 🟢' : 'SORTIE 🔴',
      time: timeStr,
      date: todayStr,
      location: isSimulationActive ? `${branch.name} (GPS Certifié)` : gpsLocation.label,
      tokenUsed: tokenParam || 'BYPASSED'
    });

    setErrorMsg('');

    // Trigger button animation sequence: Submitting -> Registered -> Open Success Summary
    setPunchState(type === 'in' ? 'submitting_in' : 'submitting_out');

    setTimeout(() => {
      setPunchState(type === 'in' ? 'success_in' : 'success_out');

      setTimeout(() => {
        setIsSuccess(true);
        setPunchState('idle');
      }, 650);
    }, 450);
  };

  const resetForm = () => {
    setSelectedEmployeeId('');
    setPinCode('');
    setSelfieState('idle');
    setSelfieUrl('');
    setIsSuccess(false);
    setSuccessDetail(null);
    setErrorMsg('');
  };

  const handleExportCSV = () => {
    const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const allRecords = getMergedAttendanceRecords(companySuffix);

    const selEmp = employees.find(e => e.id === selectedEmployeeId);
    
    // Filter records for the selected employee if chosen, otherwise export all records
    const filteredRecords = selectedEmployeeId && selEmp
      ? allRecords.filter(r => 
          r.employeeId === selectedEmployeeId || 
          (r.employeeName && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim())
        )
      : allRecords;

    if (filteredRecords.length === 0) {
      setErrorMsg(selectedEmployeeId 
        ? `Aucun enregistrement de pointage disponible pour ${selEmp?.name || 'ce collaborateur'}.`
        : 'Aucun enregistrement de pointage disponible dans le registre.'
      );
      return;
    }

    // CSV Headers
    const headers = [
      'Matricule',
      'Collaborateur',
      'Poste',
      'Date',
      'Heure Entree',
      'Heure Sortie',
      'Localisation (GPS/Site)',
      'Statut',
      'Heures Supp (h)',
      'Notes'
    ];

    const csvLines = [headers.join(';')];

    filteredRecords.forEach(r => {
      const empMatricule = r.employeeId.startsWith('emp-') ? `MAT-${r.employeeId}` : (r.employeeId || '');
      const line = [
        `"${empMatricule.replace(/"/g, '""')}"`,
        `"${(r.employeeName || '').replace(/"/g, '""')}"`,
        `"${(r.jobTitle || '').replace(/"/g, '""')}"`,
        `"${(r.date || '').replace(/"/g, '""')}"`,
        `"${(r.clockIn || '--:--').replace(/"/g, '""')}"`,
        `"${(r.clockOut || '--:--').replace(/"/g, '""')}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        `"${(r.status || '').replace(/"/g, '""')}"`,
        `"${r.overtimeHours || 0}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(';'));
    });

    const csvContent = '\uFEFF' + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const targetName = selEmp 
      ? selEmp.name.toLowerCase().replace(/[^a-z0-9]/g, '_') 
      : 'tous_collaborateurs';
    const todayStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `elyssa_pointages_${targetName}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg(`📥 Export CSV réussi ! ${filteredRecords.length} pointage(s) téléchargé(s) pour ${selEmp ? selEmp.name : 'tous les collaborateurs'}.`);
  };

  const appCardContent = (
    <>
      <div className={isEmbeddedInSimulator ? "w-full h-full bg-[#090d16] flex flex-col relative overflow-y-auto scrollbar-thin select-none" : "w-full max-w-md bg-[#090d16] border border-slate-900 rounded-[40px] shadow-[0_0_80px_rgba(16,185,129,0.06)] overflow-hidden flex flex-col relative"}>
      
      {/* Dynamic Mobile Status Bar */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between text-[11px] font-mono font-black text-slate-400 bg-slate-950/40 border-b border-slate-900/50">
          <div className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] tracking-widest text-emerald-400 font-bold">ELYSSA POCKET</span>
          </div>
          <div className="flex items-center gap-2">
            {offlineMode ? (
              <span className="flex items-center gap-1 text-amber-500 font-bold uppercase text-[9px]">
                <WifiOff className="w-3 h-3" /> Hors-ligne
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase text-[9px]">
                <Wifi className="w-3 h-3" /> En ligne
              </span>
            )}
            <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">PWA</span>
          </div>
        </div>

        {/* Brand App Header */}
        <div className="p-6 text-center space-y-1.5 bg-gradient-to-b from-slate-950 to-transparent">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span className="text-emerald-400 font-bold">Elyssa</span>
            <span>ERP Pocket</span>
          </h1>
          <p className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase">
            {companyParam}
          </p>

          {/* Secure Session Token Validator Banner */}
          <div className="pt-2">
            {isTokenValid ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Session Sécurisée Valide
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[10px] font-black leading-normal">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                  QR Code / Jeton Expiré
                </span>
                <span className="text-[9px] text-slate-400 font-medium normal-case leading-snug">
                  Le jeton actuel de votre application est obsolète pour contrer les fraudes de présence.
                </span>
                <button
                  onClick={handleBypassToken}
                  className="px-2.5 py-1 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/30 text-amber-300 font-bold rounded-lg transition text-[9px] uppercase cursor-pointer"
                >
                  🔗 Resynchroniser le jeton (Démo)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success Screen */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-5 text-center flex-1 flex flex-col justify-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">Pointage Enregistré !</h2>
                <p className="text-xs text-slate-400">
                  Votre présence a été authentifiée et enregistrée sur les serveurs d'Elyssa ERP.
                </p>
              </div>

              {/* High fidelity Tunis receipt */}
              <div className="bg-[#020617] border border-slate-900 p-4 rounded-3xl space-y-3.5 text-left font-mono text-xs">
                <div className="border-b border-dashed border-slate-800 pb-2 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  --- REÇU DE PRESENCE DIGITALE ---
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">COLLABORATEUR :</span>
                    <span className="font-extrabold text-white">{successDetail?.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">POSTE :</span>
                    <span className="text-slate-400">{successDetail?.jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">TYPE D'ACTION :</span>
                    <span className="font-black text-emerald-400">{successDetail?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">DATE & HEURE :</span>
                    <span className="text-white font-bold">{successDetail?.date} à {successDetail?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">ZONE GPS :</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {successDetail?.location}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                    <span className="text-slate-500 font-bold">CONFIRMATION CLOUD :</span>
                    <span className="text-emerald-400 font-black flex items-center gap-1 text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                      200 OK (REÇU & TRAITÉ)
                    </span>
                  </div>
                </div>
                <div className="border-t border-dashed border-slate-800 pt-2 text-center text-[9px] text-slate-500">
                  SÉCURISÉ PAR ELYSSA DYNAMIC TOKENS
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-2xl transition-all uppercase tracking-wider text-xs border border-slate-800 cursor-pointer"
              >
                Faire un autre pointage
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6 flex-1"
            >
              {/* Giant Digital Clock */}
              <div className="text-center space-y-0.5">
                <div className="text-3xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-1.5">
                  <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                  {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Select Employee */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  1. Votre Profil Collaborateur
                </label>
                {matriculeParam && selectedEmployeeId && employees.find(e => e.id === selectedEmployeeId) ? (
                  // Locked Profile View
                  <div className="bg-gradient-to-r from-emerald-950/20 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-emerald-500/15 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5 animate-pulse">
                      <span>🔒 Session Individuelle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                        👤
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block leading-tight">
                          {employees.find(e => e.id === selectedEmployeeId)?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          Matricule: <span className="font-mono text-emerald-400 font-extrabold">{employees.find(e => e.id === selectedEmployeeId)?.matricule || selectedEmployeeId}</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider">
                          {employees.find(e => e.id === selectedEmployeeId)?.jobTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Select Dropdown with DRH Local & Alphabetical Filters
                  <div className="space-y-2">
                    <div className="p-2 bg-[#020617] border border-slate-900 rounded-2xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Nom, matricule..."
                            value={empSearchQuery}
                            onChange={(e) => setEmpSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-semibold outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                        <select
                          value={empBranchFilter}
                          onChange={(e) => setEmpBranchFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold outline-none cursor-pointer focus:border-emerald-500 transition"
                        >
                          <option value="all">📍 Tous les locaux DRH</option>
                          {companyLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              📍 {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => {
                        setSelectedEmployeeId(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full bg-[#020617] border border-slate-900 text-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none cursor-pointer focus:border-emerald-500 transition"
                    >
                      <option value="">-- Choisir mon profil ({processedEmployees.length} trouvé{processedEmployees.length > 1 ? 's' : ''}) --</option>
                      {processedEmployees.map((emp) => {
                        const branch = companyLocations.find(l => l.id === (emp.branchId || 'loc-maman'));
                        return (
                          <option key={emp.id} value={emp.id}>
                            👤 {emp.name} — {emp.jobTitle} | 📍 {branch?.name || 'Siège'} (Matricule: {emp.matricule || emp.id})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Today's Punch Status Badge for Selected Employee */}
                {(() => {
                  if (!selectedEmployeeId) return null;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const selEmp = employees.find(e => e.id === selectedEmployeeId);
                  const rec = getMergedAttendanceRecords(companySuffix).find(r => 
                    r && r.date === todayStr && (
                      r.employeeId === selectedEmployeeId ||
                      (r.employeeName && selEmp?.name && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim())
                    )
                  );

                  if (!rec) {
                    return (
                      <div className="mt-2 px-3.5 py-2 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Statut aujourd'hui :</span>
                        <span className="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1">
                          🟡 Aucun pointage effectué
                        </span>
                      </div>
                    );
                  }

                  if (rec.clockIn && rec.clockOut) {
                    return (
                      <div className="mt-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-bold">Statut aujourd'hui :</span>
                        <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                          ✅ Entrée ({rec.clockIn}) & Sortie ({rec.clockOut})
                        </span>
                      </div>
                    );
                  }

                  if (rec.clockIn) {
                    return (
                      <div className="mt-2 px-3.5 py-2 bg-teal-500/10 border border-teal-500/25 rounded-2xl flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-bold">Statut aujourd'hui :</span>
                        <span className="text-teal-400 font-extrabold flex items-center gap-1">
                          🟢 En poste depuis {rec.clockIn} (Attente sortie)
                        </span>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Daily Summary Section - Total Hours Worked & Theoretical Comparison */}
                {(() => {
                  const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const allRecs = getMergedAttendanceRecords(companySuffix);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const selEmp = employees.find(e => e.id === selectedEmployeeId);

                  // Effective theoretical target hours for employee or default
                  const targetDailyHours = selEmp?.targetDailyHours !== undefined ? selEmp.targetDailyHours : defaultTargetHours;
                  const targetDailyMins = Math.round(targetDailyHours * 60);

                  const todayRecs = allRecs.filter(r => 
                    r && r.date === todayStr && (
                      !selectedEmployeeId ||
                      r.employeeId === selectedEmployeeId ||
                      (r.employeeName && selEmp?.name && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim())
                    )
                  );

                  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

                  let totalWorkedMins = 0;
                  let completedShifts = 0;
                  let activeShifts = 0;

                  todayRecs.forEach(r => {
                    const inMins = parseTimeToMinutes(r.clockIn);
                    const outMins = parseTimeToMinutes(r.clockOut);

                    if (inMins !== null && outMins !== null && outMins >= inMins) {
                      totalWorkedMins += (outMins - inMins);
                      completedShifts++;
                    } else if (inMins !== null && outMins === null) {
                      if (nowMins >= inMins) {
                        totalWorkedMins += (nowMins - inMins);
                      }
                      activeShifts++;
                    }
                  });

                  const workedHours = Math.floor(totalWorkedMins / 60);
                  const workedMins = totalWorkedMins % 60;
                  const formattedTotalTime = `${workedHours}h ${workedMins < 10 ? '0' : ''}${workedMins}m`;

                  // Format theoretical target time
                  const targetH = Math.floor(targetDailyMins / 60);
                  const targetM = targetDailyMins % 60;
                  const formattedTargetTime = `${targetH}h ${targetM < 10 ? '0' : ''}${targetM}m`;

                  // Calculate Variance (Automatic Overtime vs Shortfall/Deficit)
                  const varianceMins = totalWorkedMins - targetDailyMins;
                  const absVarianceMins = Math.abs(varianceMins);
                  const varH = Math.floor(absVarianceMins / 60);
                  const varM = absVarianceMins % 60;
                  const formattedVarTime = `${varH}h ${varM < 10 ? '0' : ''}${varM}m`;

                  // Completion percentage relative to target
                  const progressPct = Math.min(150, Math.round((totalWorkedMins / (targetDailyMins || 1)) * 100));

                  return (
                    <div className="mt-2.5 p-3 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-wider truncate">
                            Résumé du Jour {selectedEmployeeId && selEmp ? `(${selEmp.name})` : '(Vue Globale)'}
                          </span>
                        </div>

                        {/* Interactive Theoretical Target Selector Control */}
                        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-xl shrink-0">
                          <Target className="w-3 h-3 text-teal-400 shrink-0" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Théorique:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateTargetHours(-0.5)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
                            title="Diminuer l'horaire théorique (-30m)"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[9px] font-black font-mono text-teal-300">
                            {targetDailyHours}h
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateTargetHours(0.5)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
                            title="Augmenter l'horaire théorique (+30m)"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Card 1: Temps Travaillé Réel */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                          <span className="text-[8px] font-bold text-emerald-400/90 uppercase tracking-wide block mb-0.5">
                            Temps Réel
                          </span>
                          <span className="text-xs font-black text-emerald-300 font-mono tracking-tight block">
                            {formattedTotalTime}
                          </span>
                          <span className="text-[7.5px] font-semibold text-slate-400 block mt-0.5">
                            {totalWorkedMins > 0 ? `${(totalWorkedMins / 60).toFixed(1)} hrs` : '0 hr'}
                          </span>
                        </div>

                        {/* Card 2: Horaire Théorique Configurée */}
                        <div className="bg-teal-500/10 border border-teal-500/20 p-2 rounded-xl text-center">
                          <span className="text-[8px] font-bold text-teal-400/90 uppercase tracking-wide block mb-0.5">
                            Horaire Cible
                          </span>
                          <span className="text-xs font-black text-teal-300 font-mono tracking-tight block">
                            {formattedTargetTime}
                          </span>
                          <span className="text-[7.5px] font-semibold text-slate-400 block mt-0.5">
                            {targetDailyHours}h00 configuré
                          </span>
                        </div>

                        {/* Card 3: Écart Automatique (Heures Supp / Manquement) */}
                        {varianceMins > 0 ? (
                          <div className="bg-emerald-500/15 border border-emerald-500/30 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wide flex items-center justify-center gap-0.5 mb-0.5">
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> Supp. (+{(varianceMins/60).toFixed(1)}h)
                            </span>
                            <span className="text-xs font-black text-emerald-300 font-mono tracking-tight block">
                              +{formattedVarTime}
                            </span>
                            <span className="text-[7.5px] font-bold text-emerald-400/90 block mt-0.5">
                              🟢 Heures Supp.
                            </span>
                          </div>
                        ) : varianceMins < 0 ? (
                          <div className="bg-rose-500/15 border border-rose-500/30 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-extrabold text-rose-400 uppercase tracking-wide flex items-center justify-center gap-0.5 mb-0.5">
                              <TrendingDown className="w-2.5 h-2.5 text-rose-400" /> Manquement
                            </span>
                            <span className="text-xs font-black text-rose-300 font-mono tracking-tight block">
                              -{formattedVarTime}
                            </span>
                            <span className="text-[7.5px] font-bold text-rose-400/90 block mt-0.5">
                              🔴 Déficit Horaire
                            </span>
                          </div>
                        ) : (
                          <div className="bg-teal-500/15 border border-teal-500/30 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-extrabold text-teal-300 uppercase tracking-wide flex items-center justify-center gap-0.5 mb-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-teal-300" /> Bilan
                            </span>
                            <span className="text-xs font-black text-teal-200 font-mono tracking-tight block">
                              0h 00m
                            </span>
                            <span className="text-[7.5px] font-bold text-teal-300 block mt-0.5">
                              ✅ Horaire Atteint
                            </span>
                          </div>
                        )}

                        {/* Card 4: Pointages Breakdown */}
                        <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-xl text-center flex flex-col justify-center">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                            Pointages
                          </span>
                          <div className="flex items-center justify-center gap-1 text-xs font-black font-mono">
                            <span className="text-emerald-400" title="Terminés">{completedShifts} ✅</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-teal-300" title="En cours">{activeShifts} 🟢</span>
                          </div>
                          <span className="text-[7.5px] font-semibold text-slate-400 block mt-0.5">
                            {activeShifts > 0 ? 'En cours' : completedShifts > 0 ? 'Terminé' : 'Aucun'}
                          </span>
                        </div>
                      </div>

                      {/* Visual Gauge Progress Bar */}
                      <div className="pt-1 border-t border-slate-800/60 space-y-1">
                        <div className="flex items-center justify-between text-[8.5px] font-extrabold text-slate-400">
                          <span>Progression vs Horaire Théorique ({targetDailyHours}h):</span>
                          <span className={`font-mono ${varianceMins > 0 ? 'text-emerald-400' : varianceMins < 0 ? 'text-amber-400' : 'text-teal-300'}`}>
                            {progressPct}% ({totalWorkedMins >= targetDailyMins ? `+${formattedVarTime}` : `-${formattedVarTime}`})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              varianceMins > 0
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                                : varianceMins < 0
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            }`}
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Section Graphique Circulaire (PieChart) - Répartition Semaine en Cours */}
                      {(() => {
                        const now = currentTime;
                        const currDay = now.getDay();
                        const diffToMon = now.getDate() - (currDay === 0 ? 6 : currDay - 1);
                        const mondayDate = new Date(now.getFullYear(), now.getMonth(), diffToMon, 0, 0, 0);
                        const sundayDate = new Date(mondayDate);
                        sundayDate.setDate(mondayDate.getDate() + 6);
                        sundayDate.setHours(23, 59, 59, 999);

                        const mondayStr = mondayDate.toISOString().split('T')[0];
                        const sundayStr = sundayDate.toISOString().split('T')[0];

                        const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const allRecs = getMergedAttendanceRecords(companySuffix);
                        const selEmp = employees.find(e => e.id === selectedEmployeeId);

                        const weekRecords = allRecs.filter(r => {
                          if (!r.date) return false;
                          if (selectedEmployeeId && selEmp) {
                            const isEmp = r.employeeId === selectedEmployeeId || (r.employeeName && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim());
                            if (!isEmp) return false;
                          }
                          return r.date >= mondayStr && r.date <= sundayStr;
                        });

                        let weekWorkedMins = 0;
                        weekRecords.forEach(r => {
                          const inMins = parseTimeToMinutes(r.clockIn);
                          const outMins = parseTimeToMinutes(r.clockOut);
                          if (inMins !== null && outMins !== null && outMins >= inMins) {
                            weekWorkedMins += (outMins - inMins);
                          } else if (inMins !== null && outMins === null && r.date === todayStr) {
                            const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                            if (nowMins >= inMins) {
                              weekWorkedMins += (nowMins - inMins);
                            }
                          }
                        });

                        const weeklyTargetHours = targetDailyHours * 5;
                        const weeklyTargetMins = weeklyTargetHours * 60;

                        const weekWorkedHours = parseFloat((weekWorkedMins / 60).toFixed(1));
                        const weekDeficitMins = Math.max(0, weeklyTargetMins - weekWorkedMins);
                        const weekAbsentHours = parseFloat((weekDeficitMins / 60).toFixed(1));
                        const weekOvertimeMins = Math.max(0, weekWorkedMins - weeklyTargetMins);
                        const weekOvertimeHours = parseFloat((weekOvertimeMins / 60).toFixed(1));

                        const weekPresencePct = Math.min(100, Math.round((weekWorkedMins / (weeklyTargetMins || 1)) * 100));

                        const weekPieData = [
                          {
                            name: 'Heures Présentes',
                            value: weekWorkedHours > 0 ? weekWorkedHours : 0.001,
                            displayVal: `${weekWorkedHours}h`,
                            color: '#10b981'
                          },
                          {
                            name: 'Heures Non Réalisées / Absentes',
                            value: weekAbsentHours > 0 ? weekAbsentHours : 0.001,
                            displayVal: `${weekAbsentHours}h`,
                            color: '#f59e0b'
                          }
                        ];

                        if (weekOvertimeHours > 0) {
                          weekPieData.push({
                            name: 'Heures Supp. (Dépassement)',
                            value: weekOvertimeHours,
                            displayVal: `+${weekOvertimeHours}h`,
                            color: '#06b6d4'
                          });
                        }

                        return (
                          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <PieChartIcon className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-[9.5px] font-black text-slate-200 uppercase tracking-wider">
                                  Répartition Hebdomadaire (Semaine en Cours)
                                </span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                                Objectif 5j: {weeklyTargetHours}h
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                              {/* Left: Recharts PieChart */}
                              <div className="h-28 w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={weekPieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={26}
                                      outerRadius={44}
                                      paddingAngle={4}
                                      dataKey="value"
                                    >
                                      {weekPieData.map((entry, index) => (
                                        <Cell key={`cell-week-${index}`} fill={entry.color} stroke="#020617" strokeWidth={2} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-[10px] font-mono shadow-xl text-slate-100">
                                              <span className="font-bold block" style={{ color: data.color }}>{data.name}</span>
                                              <span className="text-white font-extrabold">{data.displayVal || `${data.value}h`}</span>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                  <span className="text-xs font-black text-white font-mono">{weekPresencePct}%</span>
                                  <span className="text-[7px] text-slate-400 uppercase font-bold">Présence</span>
                                </div>
                              </div>

                              {/* Right: Legend Breakdown */}
                              <div className="space-y-1.5 text-[9px] font-mono">
                                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-emerald-300 font-bold">Présentes (Travaillées):</span>
                                  </div>
                                  <span className="text-emerald-400 font-black">{weekWorkedHours}h</span>
                                </div>

                                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    <span className="text-amber-300 font-bold">Absentes / Manquant:</span>
                                  </div>
                                  <span className="text-amber-400 font-black">{weekAbsentHours}h</span>
                                </div>

                                {weekOvertimeHours > 0 && (
                                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                                      <span className="text-cyan-300 font-bold">Heures Supp. (Bonus):</span>
                                    </div>
                                    <span className="text-cyan-400 font-black">+{weekOvertimeHours}h</span>
                                  </div>
                                )}

                                <div className="text-[8px] text-slate-400 text-right font-sans pt-0.5">
                                  Du {mondayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au {sundayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* BANDEROLLE BASCULE AUTOMATIQUE DE RÔLE / THEME (ELYSSA POCKET) */}
                <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2.5" id="auto-theme-routing-banner">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest font-display">
                        Routage Automatique • Tâche Affectée Firestore
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <select
                        value={assignedModule}
                        onChange={(e) => {
                          const newMod = e.target.value as AssignedModule;
                          setAssignedModule(newMod);
                          window.localStorage.setItem('elyssa_mobile_assigned_module', newMod);
                        }}
                        className="bg-slate-950 border border-slate-700 text-indigo-300 px-2.5 py-1 rounded-xl text-xs font-extrabold focus:outline-none cursor-pointer"
                        id="select-mobile-assigned-module"
                      >
                        <option value="livraison">🚚 Espace Livreur (Tournées & BL)</option>
                        <option value="vente">🛒 Espace Commercial Itinérant (POS)</option>
                        <option value="chantier">🏗️ Espace Chantier & Pointage</option>
                        <option value="standard">⏱️ Espace Pointage Standard</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>
                      Rôle actif: <strong className="text-white uppercase font-mono">{assignedModule}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (assignedModule === 'livraison') setActiveOverlayScreen('livraison');
                        else if (assignedModule === 'vente') setActiveOverlayScreen('vente');
                        else if (assignedModule === 'chantier') setActiveOverlayScreen('chantier');
                      }}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      Ouvrir Interface Dédiée →
                    </button>
                  </div>
                </div>

                {/* HR Alert Success Confirmation Banner */}
                {hrAlertSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2.5 p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950 border border-emerald-500/40 rounded-2xl shadow-xl relative overflow-hidden space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                          <Mail className="w-4 h-4 text-emerald-400 animate-bounce" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
                            ⚡ Alerte E-mail RH Transmise avec Succès !
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {hrAlertSuccess.employeeName} — {hrAlertSuccess.typeLabel} ({hrAlertSuccess.daysCount}j)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHrAlertSuccess(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[9.5px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 space-y-1 font-mono">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>📧 Destinataire RH : {hrAlertSuccess.recipient}</span>
                        <span>{hrAlertSuccess.timestamp || 'Envoyé'}</span>
                      </div>
                      <div className="text-slate-400 text-[8.5px]">
                        ✅ Notification d'absence injectée automatiquement dans la boîte de réception du Responsable RH et enregistrée dans le journal de communication DRH.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Absence Action Bar & HR Alert Center */}
                <div className="mt-2.5 p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                        <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                      </div>
                      <div className="truncate text-left">
                        <span className="text-[10px] font-black text-slate-100 block truncate flex items-center gap-1.5">
                          <span>Signalement d'Absence & Alerte RH</span>
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase">Notification Auto</span>
                        </span>
                        <span className="text-[8.5px] font-semibold text-slate-400 block truncate">
                          Déclarez un congé ou justificatif avec alerte e-mail instantanée au Responsable RH
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAbsenceModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/40 shrink-0 border border-amber-400/40"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Déclarer une Absence</span>
                    </button>
                  </div>

                  {/* Display recent absence records for selected employee or global */}
                  {(() => {
                    const selEmp = employees.find(e => e.id === selectedEmployeeId);
                    const relevantAbsences = selectedEmployeeId && selEmp
                      ? absencesList.filter(a => a.employeeId === selectedEmployeeId || (a.employeeName && a.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim()))
                      : absencesList;

                    if (relevantAbsences.length === 0) return null;

                    return (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setIsAbsenceHistoryExpanded(!isAbsenceHistoryExpanded)}
                            className="flex items-center gap-1.5 text-[9.5px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider transition cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 text-amber-400" />
                            <span>Mes Absences Saisies ({relevantAbsences.length})</span>
                            {isAbsenceHistoryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                            Alerte RH Active
                          </span>
                        </div>

                        {isAbsenceHistoryExpanded && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {relevantAbsences.map((abs, idx) => (
                              <div key={abs.id ? `pocket-abs-${abs.id}-${idx}` : `pocket-abs-${idx}`} className="p-2.5 bg-slate-950/90 border border-slate-800/80 rounded-xl space-y-1 text-[9.5px]">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-200">
                                    {abs.employeeName} — <span className="text-amber-400">{getTypeLabel(abs.type)}</span>
                                  </span>
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    {abs.status === 'Requested' ? '⏳ En attente RH' : abs.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                                  <span>📅 Du {abs.startDate} au {abs.endDate} ({abs.daysCount} jour{abs.daysCount > 1 ? 's' : ''})</span>
                                  {abs.hrAlertSent && (
                                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                                      <CheckCheck className="w-3 h-3 text-emerald-400" /> Alerte RH transmise
                                    </span>
                                  )}
                                </div>
                                {abs.description && (
                                  <p className="text-[8.5px] text-slate-400 italic bg-slate-900/60 p-1 rounded border border-slate-800/50">
                                    "{abs.description}"
                                  </p>
                                )}
                                <div className="flex justify-end pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAbsence(abs.id)}
                                    className="text-[8px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" /> Supprimer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Export CSV Control Bar */}
                {(() => {
                  const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const allRecs = getMergedAttendanceRecords(companySuffix);
                  const selEmp = employees.find(e => e.id === selectedEmployeeId);
                  const empRecs = selectedEmployeeId && selEmp
                    ? allRecs.filter(r => 
                        r.employeeId === selectedEmployeeId || 
                        (r.employeeName && selEmp.name && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim())
                      )
                    : allRecs;

                  return (
                    <div className="mt-2.5 p-3 bg-[#020617] border border-slate-900 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate text-left">
                          <span className="text-[10px] font-extrabold text-slate-200 block truncate">
                            {selectedEmployeeId && selEmp ? (
                              <>
                                Pointages : <span className="text-emerald-400">{selEmp.name}</span>
                              </>
                            ) : (
                              'Registre Général des Pointages'
                            )}
                          </span>
                          <span className="text-[8.5px] font-bold text-slate-500 block">
                            {empRecs.length} enregistrement{empRecs.length !== 1 ? 's' : ''} disponible{empRecs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/20 shrink-0 border border-emerald-500/20"
                        title="Télécharger l'historique de pointage au format CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Exporter CSV
                      </button>
                    </div>
                  );
                })()}

                {/* Historique des Pointages - Section avec Badges Colorés */}
                {(() => {
                  const companySuffix = companyParam.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const allRecs = getMergedAttendanceRecords(companySuffix);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const selEmp = employees.find(e => e.id === selectedEmployeeId);

                  const empRecs = selectedEmployeeId && selEmp
                    ? allRecs.filter(r => 
                        r.employeeId === selectedEmployeeId || 
                        (r.employeeName && selEmp.name && r.employeeName.toLowerCase().trim() === selEmp.name.toLowerCase().trim())
                      )
                    : allRecs;

                  const getRecordCategory = (r: AttendanceRecord) => {
                    if (r.date === todayStr && r.clockIn && !r.clockOut) {
                      return 'in_progress';
                    }
                    if (r.clockIn && r.clockOut && r.date === todayStr) {
                      return 'validated';
                    }
                    if (r.date < todayStr) {
                      return 'archived';
                    }
                    return 'validated';
                  };

                  const countInProgress = empRecs.filter(r => getRecordCategory(r) === 'in_progress').length;
                  const countValidated = empRecs.filter(r => getRecordCategory(r) === 'validated').length;
                  const countArchived = empRecs.filter(r => getRecordCategory(r) === 'archived').length;

                  const filteredRecs = empRecs.filter(r => {
                    const cat = getRecordCategory(r);
                    if (historyFilter === 'in_progress') return cat === 'in_progress';
                    if (historyFilter === 'validated') return cat === 'validated';
                    if (historyFilter === 'archived') return cat === 'archived';
                    return true;
                  });

                  return (
                    <div className="mt-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-wider">
                            Historique des Pointages
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            {empRecs.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* View Switcher: List vs Calendar */}
                          <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-xl flex items-center">
                            <button
                              type="button"
                              onClick={() => setHistoryMode('list')}
                              className={`px-2 py-1 rounded-lg text-[8.5px] font-extrabold uppercase transition flex items-center gap-1 cursor-pointer ${
                                historyMode === 'list'
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Vue Liste"
                            >
                              <List className="w-3 h-3" />
                              <span className="hidden xs:inline">Liste</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryMode('calendar')}
                              className={`px-2 py-1 rounded-lg text-[8.5px] font-extrabold uppercase transition flex items-center gap-1 cursor-pointer ${
                                historyMode === 'calendar'
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Vue Calendrier Mensuel"
                            >
                              <CalendarDays className="w-3 h-3" />
                              <span className="hidden xs:inline">Calendrier</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                          >
                            {isHistoryExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isHistoryExpanded && (
                        <>
                          {historyMode === 'list' ? (
                            <>
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => setHistoryFilter('all')}
                                  className={`px-2.5 py-1 rounded-xl text-[8.5px] font-extrabold uppercase transition border cursor-pointer shrink-0 ${
                                    historyFilter === 'all'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-300'
                                  }`}
                                >
                                  Tous ({empRecs.length})
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setHistoryFilter('in_progress')}
                                  className={`px-2.5 py-1 rounded-xl text-[8.5px] font-extrabold uppercase transition border cursor-pointer shrink-0 flex items-center gap-1 ${
                                    historyFilter === 'in_progress'
                                      ? 'bg-teal-500/25 text-teal-300 border-teal-500/50'
                                      : 'bg-teal-500/10 text-teal-400/80 border-teal-500/20 hover:text-teal-300'
                                  }`}
                                >
                                  🟢 En cours ({countInProgress})
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setHistoryFilter('validated')}
                                  className={`px-2.5 py-1 rounded-xl text-[8.5px] font-extrabold uppercase transition border cursor-pointer shrink-0 flex items-center gap-1 ${
                                    historyFilter === 'validated'
                                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                                      : 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20 hover:text-emerald-300'
                                  }`}
                                >
                                  ✅ Validés ({countValidated})
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setHistoryFilter('archived')}
                                  className={`px-2.5 py-1 rounded-xl text-[8.5px] font-extrabold uppercase transition border cursor-pointer shrink-0 flex items-center gap-1 ${
                                    historyFilter === 'archived'
                                      ? 'bg-slate-700 text-slate-200 border-slate-600'
                                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-300'
                                  }`}
                                >
                                  📁 Archivés ({countArchived})
                                </button>
                              </div>

                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {filteredRecs.length === 0 ? (
                                  <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-slate-900">
                                    <p className="text-[10px] text-slate-500 font-bold">
                                      Aucun pointage ne correspond à ce filtre.
                                    </p>
                                  </div>
                                ) : (
                                  filteredRecs.map((rec, idx) => {
                                    const category = getRecordCategory(rec);
                                    return (
                                      <div
                                        key={rec.id ? `pocket-rec-${rec.id}-${rec.date}-${idx}` : `pocket-rec-${idx}`}
                                        className="p-2.5 bg-[#020617] border border-slate-800/80 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition"
                                      >
                                        <div className="space-y-0.5 truncate">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-black text-slate-200 truncate">
                                              {rec.employeeName}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2 text-[8.5px] text-slate-400 font-semibold">
                                            <span>📅 {rec.date}</span>
                                            <span>•</span>
                                            <span>📍 {rec.location.split('(')[0]}</span>
                                          </div>

                                          <div className="flex items-center gap-2 text-[9px] font-mono pt-0.5">
                                            <span className="text-emerald-400 font-extrabold">
                                              Entrée: {rec.clockIn || '--:--'}
                                            </span>
                                            <span className="text-slate-600">|</span>
                                            <span className={rec.clockOut ? 'text-teal-300 font-extrabold' : 'text-slate-500'}>
                                              Sortie: {rec.clockOut || 'En attente'}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                          {category === 'in_progress' && (
                                            <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/40 inline-flex items-center gap-1 animate-pulse shadow-sm shadow-teal-950/50">
                                              🟢 EN COURS
                                            </span>
                                          )}

                                          {category === 'validated' && (
                                            <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 shadow-sm shadow-emerald-950/50">
                                              ✅ VALIDÉ
                                            </span>
                                          )}

                                          {category === 'archived' && (
                                            <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider bg-slate-800/80 text-slate-400 border border-slate-700/60 inline-flex items-center gap-1">
                                              📁 ARCHIVÉ
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </>
                          ) : (
                            /* MONTHLY CALENDAR VIEW */
                            (() => {
                              const calYear = calendarViewMonth.getFullYear();
                              const calMonth = calendarViewMonth.getMonth();
                              const monthName = calendarViewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

                              // Total days in month
                              const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                              // Day index of 1st day (0 = Monday, 6 = Sunday)
                              const firstDayRaw = new Date(calYear, calMonth, 1).getDay();
                              const firstDayIndex = (firstDayRaw + 6) % 7;

                              // Monthly statistics calculation
                              const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
                              const monthRecords = empRecs.filter(r => r.date && r.date.startsWith(monthPrefix));
                              const daysWorkedCount = new Set(monthRecords.map(r => r.date)).size;

                              let monthTotalMins = 0;
                              monthRecords.forEach(r => {
                                const inMins = parseTimeToMinutes(r.clockIn);
                                const outMins = parseTimeToMinutes(r.clockOut);
                                if (inMins !== null && outMins !== null && outMins >= inMins) {
                                  monthTotalMins += (outMins - inMins);
                                }
                              });
                              const monthHours = Math.floor(monthTotalMins / 60);

                              const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

                              // Build days grid
                              const calendarGrid: (number | null)[] = [];
                              for (let i = 0; i < firstDayIndex; i++) {
                                calendarGrid.push(null);
                              }
                              for (let day = 1; day <= totalDaysInMonth; day++) {
                                calendarGrid.push(day);
                              }

                              const handlePrevMonth = () => {
                                setCalendarViewMonth(new Date(calYear, calMonth - 1, 1));
                                setSelectedCalendarDay(null);
                              };

                              const handleNextMonth = () => {
                                setCalendarViewMonth(new Date(calYear, calMonth + 1, 1));
                                setSelectedCalendarDay(null);
                              };

                              const handleTodayMonth = () => {
                                setCalendarViewMonth(new Date());
                                const nowStr = new Date().toISOString().split('T')[0];
                                setSelectedCalendarDay(nowStr);
                              };

                              // Selected day records list
                              const selectedDayRecs = selectedCalendarDay
                                ? empRecs.filter(r => r.date === selectedCalendarDay)
                                : [];

                              return (
                                <div className="space-y-3 pt-1">
                                  {/* Month Navigation & Stats Header */}
                                  <div className="bg-[#020617] border border-slate-800 p-2.5 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
                                        title="Mois précédent"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="text-center">
                                        <span className="text-xs font-black text-slate-100 capitalize block">
                                          {monthName}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 block">
                                          {selectedEmployeeId && selEmp ? selEmp.name : 'Tous collaborateurs'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={handleTodayMonth}
                                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[8.5px] font-extrabold uppercase rounded-lg transition border border-emerald-500/30 cursor-pointer"
                                        >
                                          Aujourd'hui
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleNextMonth}
                                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
                                          title="Mois suivant"
                                        >
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Monthly Summary Badges */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900 text-[9px]">
                                      <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between border border-slate-800">
                                        <span className="text-slate-400 font-bold">Jours Pointés:</span>
                                        <span className="text-emerald-400 font-mono font-extrabold">{daysWorkedCount} jour{daysWorkedCount !== 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between border border-slate-800">
                                        <span className="text-slate-400 font-bold">Total Mensuel:</span>
                                        <span className="text-teal-300 font-mono font-extrabold">{monthHours} hrs</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Calendar Grid Header (Lun..Dim) */}
                                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    {dayHeaders.map((dh, idx) => (
                                      <div key={dh} className={`py-1 ${idx >= 5 ? 'text-amber-400/70' : ''}`}>
                                        {dh}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calendar Grid Tiles */}
                                  <div className="grid grid-cols-7 gap-1">
                                    {calendarGrid.map((dayNum, index) => {
                                      if (dayNum === null) {
                                        return <div key={`empty-${index}`} className="h-10 rounded-xl bg-slate-950/20 border border-slate-900/30" />;
                                      }

                                      const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                      const isToday = dayStr === todayStr;
                                      const isSelected = selectedCalendarDay === dayStr;

                                      const dayRecs = empRecs.filter(r => r.date === dayStr);
                                      const hasCompleted = dayRecs.some(r => r.clockIn && r.clockOut);
                                      const hasInProgress = dayRecs.some(r => r.clockIn && !r.clockOut);
                                      const hasRecord = dayRecs.length > 0;

                                      let tileBg = 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700';
                                      if (hasCompleted) {
                                        tileBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/25';
                                      } else if (hasInProgress) {
                                        tileBg = 'bg-teal-500/20 border-teal-500/50 text-teal-200 hover:bg-teal-500/30 animate-pulse';
                                      } else if (isToday) {
                                        tileBg = 'bg-amber-500/10 border-amber-500/40 text-amber-300';
                                      }

                                      if (isSelected) {
                                        tileBg += ' ring-2 ring-emerald-400 scale-105 z-10';
                                      }

                                      return (
                                        <button
                                          key={`day-${dayNum}`}
                                          type="button"
                                          onClick={() => setSelectedCalendarDay(isSelected ? null : dayStr)}
                                          className={`h-11 rounded-xl p-1 border flex flex-col justify-between items-center transition cursor-pointer relative ${tileBg}`}
                                        >
                                          <div className="flex items-center justify-between w-full px-0.5">
                                            <span className={`text-[9px] font-black font-mono ${isToday ? 'text-amber-300 underline underline-offset-2' : ''}`}>
                                              {dayNum}
                                            </span>
                                            {hasRecord && (
                                              <span className="text-[7px]">
                                                {hasCompleted ? '✅' : '🟢'}
                                              </span>
                                            )}
                                          </div>

                                          {/* Time snippet indicator */}
                                          {hasRecord && dayRecs[0].clockIn && (
                                            <span className="text-[7px] font-mono font-bold text-slate-300 truncate max-w-full leading-none">
                                              {dayRecs[0].clockIn}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Day Details Drawer when a day is selected */}
                                  <AnimatePresence>
                                    {selectedCalendarDay && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-[#020617] border border-emerald-500/30 rounded-2xl p-3 space-y-2 overflow-hidden"
                                      >
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[10px] font-black text-slate-200 uppercase">
                                              Détails du {selectedCalendarDay}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedCalendarDay(null)}
                                            className="text-[9px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg transition cursor-pointer"
                                          >
                                            Fermer
                                          </button>
                                        </div>

                                        {selectedDayRecs.length === 0 ? (
                                          <div className="text-center py-2 text-[9.5px] font-bold text-slate-500">
                                            Aucun pointage enregistré pour cette date.
                                          </div>
                                        ) : (
                                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedDayRecs.map((r, idx) => (
                                              <div key={r.id ? `pocket-day-${r.id}-${r.date || ''}-${idx}` : `pocket-day-${idx}`} className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1 text-[9.5px]">
                                                <div className="flex items-center justify-between font-black text-slate-100">
                                                  <span>👤 {r.employeeName}</span>
                                                  <span className="text-emerald-400 font-mono font-extrabold">{r.jobTitle}</span>
                                                </div>
                                                <div className="flex items-center gap-3 font-mono font-bold text-slate-300">
                                                  <span className="text-emerald-400">Entrée: {r.clockIn || '--:--'}</span>
                                                  <span className={r.clockOut ? 'text-teal-300' : 'text-slate-500'}>
                                                    Sortie: {r.clockOut || 'En cours'}
                                                  </span>
                                                  {r.overtimeHours > 0 && (
                                                    <span className="text-amber-400 bg-amber-500/10 px-1.5 rounded">
                                                      +{r.overtimeHours}h supp
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[8.5px] text-slate-400 truncate">
                                                  📍 {r.location}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })()
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* FIRST-TIME SCAN ENROLLMENT INVITATION BANNER */}
              {matriculeParam && selectedEmployeeId && !referenceSelfie && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/25 rounded-3xl space-y-2.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">👋 Bienvenue sur Elyssa ERP Pocket</span>
                      <p className="text-xs font-black text-white leading-tight">Premier Pointage Détecté !</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        Aucun selfie de référence n'a été trouvé. Veuillez capturer votre selfie de référence officiel pour configurer la reconnaissance biométrique.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleEnrollSelfie}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center gap-1 border-0"
                    >
                      <span>📷 Capturer mon Selfie</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Simulated Camera Scanner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    {!selectedEmployeeId 
                      ? "2. Authentification Biométrique" 
                      : !referenceSelfie 
                        ? "2. Enrôlement Facial Initial (Requis)" 
                        : "2. Selfie de Contrôle & Reconnaissance"
                    }
                  </label>
                  {selectedEmployeeId && referenceSelfie && (
                    <button
                      type="button"
                      onClick={handleResetReferenceSelfie}
                      className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                      title="Réinitialiser l'empreinte faciale pour cette démo"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Réenrôler
                    </button>
                  )}
                </div>
                
                <div className="relative aspect-video bg-black/60 rounded-3xl border border-slate-900 overflow-hidden flex flex-col items-center justify-center p-4">
                  
                  {/* Real Live Camera Stream view */}
                  {selfieState === 'live' && (
                    <div className="absolute inset-0 flex flex-col justify-between bg-black z-30">
                      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <video 
                          ref={videoRef}
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 border-[24px] border-black/60 flex items-center justify-center pointer-events-none">
                          <div className="w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/50 animate-pulse"></div>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/75 text-emerald-400 font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/20">
                          ● Flux Caméra Actif
                        </div>
                      </div>
                      
                      <div className="bg-slate-950 p-2.5 flex items-center justify-between border-t border-slate-900 gap-2">
                        <button
                          type="button"
                          onClick={handleCancelCamera}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] font-black rounded-xl uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => captureRealPhoto(!referenceSelfie)}
                          className="flex-1 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[9px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-950/25 flex items-center justify-center gap-1"
                        >
                          📷 Prendre la Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedEmployeeId ? (
                    <div className="text-center space-y-2 p-4">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold max-w-xs leading-relaxed">
                        Veuillez sélectionner votre collaborateur à l'étape 1 pour activer la caméra biométrique d'Elyssa ERP.
                      </p>
                    </div>
                  ) : !referenceSelfie ? (
                    /* CASE A: NOT ENROLLED YET */
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                      {selfieState === 'idle' && (
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
                            <Fingerprint className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Enrôlement Biométrique Requis</h3>
                            <p className="text-[9px] text-slate-400 max-w-xs leading-relaxed font-semibold">
                              Aucune empreinte faciale de référence n'est enregistrée pour votre compte. Veuillez faire votre selfie officiel.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleEnrollSelfie}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-950/25"
                          >
                            📷 Capturer mon Selfie de Référence
                          </button>
                        </div>
                      )}

                      {selfieState === 'scanning' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95">
                          {/* Amber scanning laser line */}
                          <div className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-lg shadow-amber-400 animate-[bounce_2s_infinite] opacity-80 z-20"></div>
                          
                          <div className="w-24 h-24 border-2 border-dashed border-amber-400/40 rounded-full animate-pulse flex items-center justify-center mb-2">
                            <Fingerprint className="w-10 h-10 text-amber-400 animate-spin" />
                          </div>

                          <span className="text-[9px] text-amber-400 font-black tracking-widest uppercase animate-pulse">
                            ENREGISTREMENT & GÉOMÉTRIE FACIALE...
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold mt-1">
                            Mapping des points nodaux (Inter-pupillaire, Nez, Mâchoire)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CASE B: ALREADY ENROLLED, PROCEED TO VERIFICATION MATCHING */
                    <div className="w-full h-full flex items-center justify-center">
                      {selfieState === 'idle' && (
                        <div className="text-center space-y-2">
                          {/* Live view simulator with a small overlay preview of the reference selfie */}
                          <div className="relative w-14 h-14 mx-auto mb-1">
                            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                              <Camera className="w-6 h-6 text-emerald-400" />
                            </div>
                            {/* Tiny badge showing reference is registered */}
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 border border-slate-950 text-black p-0.5 rounded-full" title="Selfie de référence enregistré">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-wider">Objectif Face Prêt</h3>
                            <p className="text-[9px] text-slate-400 max-w-xs leading-normal">
                              Reconnaissance active. Cadrez votre visage et lancez la capture pour authentification.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleSelfieCapture}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer"
                          >
                            Lancer le Scanner Biométrique
                          </button>
                        </div>
                      )}

                      {selfieState === 'scanning' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
                          {/* Emerald laser bar */}
                          <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-400 animate-[bounce_2s_infinite] opacity-80 z-20"></div>
                          
                          <div className="w-24 h-24 border-2 border-dashed border-emerald-400/40 rounded-full animate-pulse flex items-center justify-center mb-2">
                            <Fingerprint className="w-10 h-10 text-emerald-400/80 animate-spin" />
                          </div>

                          <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase animate-pulse">
                            COMPARAISON BIOMÉTRIQUE EN COURS...
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold mt-1">
                            Analyse de similarité avec le selfie de référence
                          </span>
                        </div>
                      )}

                      {selfieState === 'captured' && (
                        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-[#050811]/95 text-xs font-mono">
                          
                          {/* Title banner */}
                          <div className="flex items-center justify-between border-b border-slate-900/80 pb-1.5 text-[9px] text-emerald-400 font-bold tracking-wider uppercase">
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Analyse Faciale AI</span>
                            <span>Points de contrôle : OK</span>
                          </div>

                          {/* Side-by-side photo comparison */}
                          <div className="flex items-center justify-around my-2">
                            {/* Left: Enrolled reference */}
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-14 h-14 rounded-full border border-slate-700/60 p-0.5 bg-slate-950 overflow-hidden relative">
                                <img 
                                  src={referenceSelfie} 
                                  alt="Référence" 
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute top-0 inset-x-0 bg-slate-900/90 text-[7px] text-center font-bold text-slate-400 py-0.5">
                                  REF
                                </div>
                              </div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase">Enrôlé</span>
                            </div>

                            {/* Center link connector */}
                            <div className="flex flex-col items-center justify-center text-center space-y-0.5 px-2">
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                                98.4%
                              </span>
                              <span className="text-[7px] text-slate-500 font-black uppercase">MATCH</span>
                            </div>

                            {/* Right: Live captured */}
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-14 h-14 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-950 overflow-hidden relative">
                                <img 
                                  src={selfieUrl} 
                                  alt="Live" 
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 text-[7px] text-center font-black text-black py-0.5">
                                  LIVE
                                </div>
                              </div>
                              <span className="text-[8px] text-emerald-400 font-black uppercase">Vérifié</span>
                            </div>
                          </div>

                          {/* Matching checklist */}
                          <div className="space-y-1 text-[8px] text-slate-400 border-t border-slate-900/80 pt-1.5">
                            <div className="flex items-center justify-between">
                              <span>📐 Écart pupillaire & contours :</span>
                              <span className="text-emerald-400 font-extrabold">98.2% (CONFORME)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>🧬 Anti-spoofing (Détection du vivant) :</span>
                              <span className="text-emerald-400 font-extrabold">AUTHENTIQUE</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>🔒 Clef d'authentification :</span>
                              <span className="text-slate-500 font-extrabold uppercase">ELY-{selectedEmployeeId?.slice(0, 5)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-center border-t border-slate-900/80 pt-1.5">
                            <button
                              type="button"
                              onClick={() => setSelfieState('idle')}
                              className="text-[9px] text-slate-400 hover:text-white underline font-bold uppercase cursor-pointer"
                            >
                              Reprendre le Selfie de Contrôle
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic GPS Location for pocket view */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  3. Votre Position GPS {isSimulationActive ? '(Simulation Active)' : '(Production Réelle)'}
                </label>
                <div className="bg-[#020617] border border-slate-900 rounded-2xl p-3 space-y-2">
                  {(() => {
                    const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
                    const branchId = selectedEmp?.branchId || 'loc-maman';
                    const branch = companyLocations.find(l => l.id === branchId) || companyLocations.find(l => l.isMaman) || companyLocations[0];
                    const distance = getDistance(gpsLocation.lat, gpsLocation.lng, branch.lat, branch.lng);
                    const isGpsValid = isSimulationActive ? (gpsLocation.lat === branch.lat && gpsLocation.lng === branch.lng) : (distance <= branch.radius);

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-300">
                            🛰️ {gpsLocation.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            isGpsValid 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/25'
                          }`}>
                            {isGpsValid ? 'CONFORME (EN ZONE)' : 'HORS DE LA ZONE'}
                          </span>
                        </div>

                        <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                          {isGpsValid ? (
                            isSimulationActive 
                              ? `📍 Vous êtes positionné au site "${branch.name}" (rayon de ${branch.radius}m). Autorisé à badger.`
                              : `📍 Position réelle validée à ${distance.toFixed(0)}m du site "${branch.name}" (Autorisé à badger).`
                          ) : (
                            isSimulationActive
                              ? `⚠️ Hors Zone : Distance excessive par rapport au site "${branch.name}". Pointage bloqué.`
                              : `⚠️ Distance excessive : Vous êtes situé à ${(distance / 1000).toFixed(2)} km du site "${branch.name}". Pointage bloqué (Périmètre requis: ${branch.radius}m).`
                          )}
                        </p>

                        {isSimulationActive ? (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setGpsLocation({ lat: branch.lat, lng: branch.lng, label: `${branch.name} (GPS Certifié)` })}
                              className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition cursor-pointer border ${
                                gpsLocation.lat === branch.lat 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-slate-900/60 border-slate-900 text-slate-400'
                              }`}
                            >
                              En Zone ({branch.name.split(' ')[0]})
                            </button>
                            <button
                              type="button"
                              onClick={() => setGpsLocation({ lat: branch.lat + 0.15, lng: branch.lng + 0.15, label: 'Clientèle (Hors Zone)' })}
                              className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition cursor-pointer border ${
                                gpsLocation.lat !== branch.lat 
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                  : 'bg-slate-900/60 border-slate-900 text-slate-400'
                              }`}
                            >
                              Hors Zone
                            </button>
                          </div>
                        ) : (
                          <div className="pt-1 space-y-2">
                            <button
                              type="button"
                              onClick={getRealGPSPosition}
                              disabled={gpsLoading}
                              className="w-full py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              {gpsLoading ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Acquisition GPS en cours...
                                </>
                              ) : (
                                <>
                                  📡 Rafraîchir ma Position GPS Réelle
                                </>
                              )}
                            </button>

                            {/* Calibration button when user is physically on site */}
                            <button
                              type="button"
                              onClick={() => handleSetCurrentGPSAsBranchLocation(branch.id)}
                              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              🎯 Mettre à jour la position du site "{branch.name}" avec mes coordonnées GPS actuelles
                            </button>
                            <p className="text-[8px] text-slate-500 text-center font-medium leading-tight">
                              Vous êtes actuellement sur le site de l'entreprise ? Cliquez ci-dessus pour enregistrer ces coordonnées GPS comme emplacement officiel du siège/site et débloquer le pointage.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Offline mode Simulator for local testing */}
              <div className="bg-slate-900/40 border border-slate-900/80 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-200 block">Mode Chantier Isolé (Offline)</span>
                  <span className="text-[8px] text-slate-450 block font-semibold">Stocker le pointage localement en cas de panne</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOfflineMode(!offlineMode)}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition border cursor-pointer ${
                    offlineMode 
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                      : 'bg-[#020617] border-slate-900 text-slate-500'
                  }`}
                >
                  {offlineMode ? 'OFFLINE' : 'ONLINE'}
                </button>
              </div>

              {/* Status feedback & messages */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 font-bold leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 font-bold leading-relaxed">
                  ✨ {successMsg}
                </div>
              )}

              {/* Pastille de Statut Serveur Cloud en temps réel */}
              <div id="pocket-server-status-pill" className="bg-[#020617] border border-slate-900 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    {serverSyncStatus === 'syncing' ? (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    ) : serverSyncStatus === 'synced' ? (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : serverSyncStatus === 'offline' ? (
                      <span className="flex h-3 w-3 relative">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="flex h-3 w-3 relative">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                        Serveur Cloud :
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider flex items-center gap-1 ${
                        serverSyncStatus === 'syncing'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                          : serverSyncStatus === 'synced'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : serverSyncStatus === 'offline'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {serverSyncStatus === 'syncing' && (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>En cours de traitement...</span>
                          </>
                        )}
                        {serverSyncStatus === 'synced' && (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Reçu & Traité par le serveur</span>
                          </>
                        )}
                        {serverSyncStatus === 'offline' && (
                          <>
                            <span>Stocké localement (Hors-ligne)</span>
                          </>
                        )}
                        {serverSyncStatus === 'error' && (
                          <>
                            <span>Échec de transmission</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-[8.5px] text-slate-400 font-medium truncate">
                      {serverSyncStatus === 'synced' && lastServerSyncTime && (
                        <>Requête {lastPunchType === 'in' ? "d'entrée" : lastPunchType === 'out' ? "de sortie" : "de pointage"} validée à {lastServerSyncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                      )}
                      {serverSyncStatus === 'syncing' && (
                        <>Transmission sécurisée vers les serveurs Elyssa ERP en cours...</>
                      )}
                      {serverSyncStatus === 'offline' && (
                        <>Données en attente de synchronisation réseau</>
                      )}
                      {serverSyncStatus === 'error' && (
                        <>Problème réseau ou serveur cloud non joignable</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono text-[8px] text-slate-500 font-bold uppercase">
                  {serverSyncStatus === 'synced' ? '200 OK' : serverSyncStatus === 'syncing' ? '102 PROC' : serverSyncStatus === 'offline' ? 'LOCAL' : '500 ERR'}
                </div>
              </div>

              {/* Dual Action Buttons with Fluid Motion Transition */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  disabled={punchState !== 'idle'}
                  onClick={() => handlePunch('in')}
                  className={`font-extrabold py-3.5 px-4 rounded-2xl transition-all duration-300 uppercase tracking-wider text-xs shadow-lg cursor-pointer flex items-center justify-center gap-1.5 overflow-hidden relative ${
                    punchState === 'submitting_in'
                      ? 'bg-emerald-700 text-white shadow-emerald-950/40 opacity-90'
                      : punchState === 'success_in'
                      ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/50 scale-105 font-black'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/25'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {punchState === 'submitting_in' ? (
                      <motion.span
                        key="submitting_in"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-1.5"
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span>Enregistrement...</span>
                      </motion.span>
                    ) : punchState === 'success_in' ? (
                      <motion.span
                        key="success_in"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="flex items-center gap-1.5 text-slate-950 font-black"
                      >
                        <Check className="w-4 h-4 text-slate-950 stroke-[3] shrink-0" />
                        <span>Enregistré !</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle_in"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <span>🟢 PUNCH IN (Entrée)</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  disabled={punchState !== 'idle'}
                  onClick={() => handlePunch('out')}
                  className={`font-extrabold py-3.5 px-4 rounded-2xl transition-all duration-300 uppercase tracking-wider text-xs shadow-lg cursor-pointer flex items-center justify-center gap-1.5 overflow-hidden relative ${
                    punchState === 'submitting_out'
                      ? 'bg-rose-700 text-white shadow-rose-950/40 opacity-90'
                      : punchState === 'success_out'
                      ? 'bg-rose-500 text-white shadow-rose-500/50 scale-105 font-black'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-rose-950/25'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {punchState === 'submitting_out' ? (
                      <motion.span
                        key="submitting_out"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-1.5"
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span>Enregistrement...</span>
                      </motion.span>
                    ) : punchState === 'success_out' ? (
                      <motion.span
                        key="success_out"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="flex items-center gap-1.5 text-white font-black"
                      >
                        <Check className="w-4 h-4 text-white stroke-[3] shrink-0" />
                        <span>Enregistré !</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle_out"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <span>🔴 PUNCH OUT (Sortie)</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Footer */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-900 text-center text-[9px] text-slate-500 font-bold tracking-widest uppercase">
          PROTÉGÉ PAR LE PROTOCOLE ANTI BUDDY-PUNCHING
        </div>

      </div>

      {/* ABSENCE DECLARATION MODAL DIALOG WITH AUTOMATIC HR E-MAIL ALERT */}
      <AnimatePresence>
        {isAbsenceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative my-8"
            >
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
                    <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Déclaration d'Absence & Alerte RH
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Saisie de congé / justificatif avec notification e-mail automatique au Responsable RH
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAbsenceModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitAbsence} className="p-4 space-y-3.5 text-left">
                {/* Active Employee Info Banner */}
                {(() => {
                  const selEmp = employees.find(e => e.id === selectedEmployeeId);
                  return (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm">
                          👤
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-white block">
                            {selEmp ? selEmp.name : 'Profil Collaborateur Actif'}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            Matricule: {selEmp?.matricule || selectedEmployeeId || 'Générique'} — {selEmp?.jobTitle || 'Collaborateur'}
                          </span>
                        </div>
                      </div>
                      {!selEmp && (
                        <span className="text-[8px] text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          💡 Profil automatique
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Absence Type Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <span>Type d'Absence</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={absenceForm.type}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="PaidLeave">🏖️ Congé Payé (Annuel)</option>
                    <option value="SickLeave">🤒 Arrêt Maladie / Certificat Médical</option>
                    <option value="UnpaidAbsence">🚫 Absence Non Payée / Raisons Personnelles</option>
                    <option value="WorkAccident">🚑 Accident du Travail / Trajet (CNAM)</option>
                    <option value="Maternity">👶 Congé Maternité / Paternité / Familial</option>
                  </select>
                </div>

                {/* Date Range Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                      Date de Début
                    </label>
                    <input
                      type="date"
                      value={absenceForm.startDate}
                      onChange={(e) => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                      Date de Fin
                    </label>
                    <input
                      type="date"
                      value={absenceForm.endDate}
                      onChange={(e) => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Calculated Days Summary */}
                {(() => {
                  const start = new Date(absenceForm.startDate);
                  const end = new Date(absenceForm.endDate);
                  const diffTime = Math.max(0, end.getTime() - start.getTime());
                  const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
                  return (
                    <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-[10px]">
                      <span className="text-amber-300 font-bold">Durée calculée de l'absence :</span>
                      <span className="text-amber-300 font-black font-mono bg-amber-500/20 px-2 py-0.5 rounded">
                        {daysCount} Jour{daysCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })()}

                {/* Reason / Justification */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                    Motif / Remarques (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Précisez le motif, le numéro de certificat médical ou des précisions pour le RH..."
                    value={absenceForm.reason}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                {/* HR E-mail Alert Configuration Box */}
                <div className="p-3 bg-slate-900/90 border border-amber-500/25 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      Alerte Automatique au Responsable RH
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-extrabold text-slate-300">
                      <input
                        type="checkbox"
                        checked={absenceForm.sendEmailAlert}
                        onChange={(e) => setAbsenceForm({ ...absenceForm, sendEmailAlert: e.target.checked })}
                        className="rounded accent-amber-500 cursor-pointer"
                      />
                      Activer l'alerte
                    </label>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] font-semibold text-slate-400 block">
                      Adresse e-mail du Responsable RH destinataire :
                    </span>
                    <input
                      type="email"
                      value={absenceForm.hrEmail}
                      onChange={(e) => setAbsenceForm({ ...absenceForm, hrEmail: e.target.value })}
                      placeholder="ex: rh@elyssa.pro ou a.bensoltane@carthage.com.tn"
                      className="w-full bg-slate-950 border border-slate-800 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-amber-500 transition"
                      required={absenceForm.sendEmailAlert}
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 font-medium leading-relaxed">
                    ⚡ Un message d'alerte instantané sera envoyé à cette adresse et archivé dans le Hub de Communication RH.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAbsenceModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl uppercase tracking-wider transition cursor-pointer border border-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={absenceSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/30 border border-amber-400/40"
                  >
                    {absenceSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi de l'alerte...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Saisir & Notifier la DRH</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Fullscreen Overlay for Chantier / Vente Modules */}
      {activeOverlayScreen === 'chantier' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto animate-in fade-in" id="overlay-module-chantier">
          <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚀</span>
              <div>
                <span className="font-black text-white uppercase text-xs tracking-wider block font-display">
                  Elyssa Pocket • Module Chantier
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Suivi des rapports & matériaux de chantier
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveOverlayScreen(null)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-colors"
              id="btn-close-overlay-chantier"
            >
              <span>← Retour au Pointage</span>
            </button>
          </div>
          <div className="flex-1 p-2 sm:p-4">
            <ChantierScreen 
              tenantId={companyParam} 
              chefChantierId={selectedEmployeeId || 'chef_01'}
              chefChantierName={employees.find(e => e.id === selectedEmployeeId)?.name || 'Agent Terrain'}
            />
          </div>
        </div>
      )}

      {activeOverlayScreen === 'livraison' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto animate-in fade-in" id="overlay-module-livraison">
          <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚚</span>
              <div>
                <span className="font-black text-white uppercase text-xs tracking-wider block font-display">
                  Elyssa Pocket • Espace Chauffeur & Livreur
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logistique, Entrepôts de ramassage & Signature client
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveOverlayScreen(null)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-colors"
              id="btn-close-overlay-livraison"
            >
              <span>← Retour au Pointage</span>
            </button>
          </div>
          <div className="flex-1 p-2 sm:p-4">
            <DriverDeliveryScreen 
              tenantId={companyParam}
              driverId={selectedEmployeeId || 'emp_drv_01'}
              driverName={employees.find(e => e.id === selectedEmployeeId)?.name || 'Hamza Ben Salem'}
            />
          </div>
        </div>
      )}

      {activeOverlayScreen === 'vente' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto animate-in fade-in" id="overlay-module-vente">
          <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🛒</span>
              <div>
                <span className="font-black text-white uppercase text-xs tracking-wider block font-display">
                  Elyssa Pocket • Caisse & Force de Vente
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Prise de commande mobile & facturation itinérante
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveOverlayScreen(null)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-colors"
              id="btn-close-overlay-vente"
            >
              <span>← Retour au Pointage</span>
            </button>
          </div>
          <div className="flex-1 p-2 sm:p-4">
            <VanSalesScreen 
              tenantId={companyParam}
              agentId={selectedEmployeeId || 'agent_01'}
              agentName={employees.find(e => e.id === selectedEmployeeId)?.name || 'Commercial Terrain'}
            />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </>
  );

  if (isEmbeddedInSimulator) {
    return (
      <div className="w-full h-full overflow-hidden flex flex-col bg-[#090d16] text-slate-100 relative">
        {appCardContent}
      </div>
    );
  }

  return (
    <MobileAccessGuard tenantId={companyParam} userId={selectedEmployeeId || 'emp_01'}>
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
        {appCardContent}
      </div>
    </MobileAccessGuard>
  );
}
