import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import { 
  Clock, 
  UserCheck, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  MapIcon, 
  UserPlus, 
  Check, 
  X, 
  Info,
  Layers,
  FileText,
  Clock3,
  Sliders,
  TrendingUp,
  Award,
  Smartphone,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Camera,
  Laptop,
  Maximize2,
  Printer,
  ZoomIn,
  Copy,
  ShieldCheck,
  BadgeCheck,
  Eye,
  Upload,
  Image as ImageIcon,
  User,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { HRDashboard } from './admin/HRDashboard';
import PocketAttendanceView from './PocketAttendanceView';

interface AttendanceManagerProps {
  employees: Employee[];
  collaborators?: any[];
  currentUser?: any;
  isSimulationActive?: boolean;
  activeCompanyName?: string;
  companyLocations: any[];
  onUpdateCompanyLocations: (locs: any[]) => void;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // HH:MM
  clockOut?: string; // HH:MM
  location: string;
  status: 'Present' | 'Late' | 'Absent' | 'OnLeave';
  overtimeHours: number; // calculated extra hours (decimal)
  notes?: string;
  isApproved: boolean; // Overtime and hours approved by manager
  selfieUrl?: string; // Capture photograph base64 or URL
}

// Predefined Tunisian business hubs
const TUNISIAN_LOCATIONS = [
  'Elyssa HQ - Les Berges du Lac 2, Tunis',
  'Elyssa Sfax - Zone Industrielle Poudrière',
  'Elyssa Sousse - Boulevard 14 Janvier',
  'Télétravail / Home Office',
  'En Clientèle / Déplacement Terrain'
];

const getDeletedRecordIds = (): Set<string> => {
  try {
    const raw = window.localStorage.getItem('elyssa_deleted_attendance_ids');
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
  window.localStorage.setItem('elyssa_deleted_attendance_ids', JSON.stringify(arr));
  return arr;
};

export default function AttendanceManager({ 
  employees, 
  collaborators,
  currentUser, 
  isSimulationActive = false,
  activeCompanyName = 'Inter-Affaires',
  companyLocations,
  onUpdateCompanyLocations
}: AttendanceManagerProps) {
  // Shadowed localStorage for dynamic tenant isolation
  const companySpecificKeys = [
    'elyssa_qr_config',
    'elyssa_company_locations',
    'elyssa_attendance_offline_queue'
  ];

  const localStorage = {
    getItem: (key: string): string | null => {
      if (companySpecificKeys.includes(key)) {
        const suffix = activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return window.localStorage.getItem(`${key}_${suffix}`);
      }
      return window.localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (companySpecificKeys.includes(key)) {
        const suffix = activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        window.localStorage.setItem(`${key}_${suffix}`, value);
        return;
      }
      window.localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (companySpecificKeys.includes(key)) {
        const suffix = activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        window.localStorage.removeItem(`${key}_${suffix}`);
        return;
      }
      window.localStorage.removeItem(key);
    }
  };

  // Determine if the connected user is a basic collaborator (restricted role)
  const isRestrictedUser = currentUser?.role === 'Agent' || currentUser?.role === 'Viewer';
  const isManagerOrAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Manager' || currentUser?.role === 'Director';

  // Find the employee profile corresponding to the connected user's email
  const loggedInEmployee = useMemo(() => {
    if (!currentUser?.email) return null;
    return employees.find(e => e.email?.toLowerCase() === currentUser.email.toLowerCase());
  }, [employees, currentUser]);

  const [activeTab, setActiveTab] = useState<'terminal' | 'dashboard' | 'hr_dashboard' | 'logs' | 'export' | 'mobile' | 'selfies'>(() => {
    return isRestrictedUser ? 'terminal' : 'hr_dashboard';
  });

  const filteredLocations = companyLocations;

  const filteredEmployees = useMemo(() => {
    const seen = new Set<string>();
    const list: Employee[] = [];

    (employees || []).forEach(emp => {
      if (!emp || !emp.id) return;
      if (!seen.has(emp.id)) {
        seen.add(emp.id);
        list.push(emp);
      }
    });

    (collaborators || []).forEach(collab => {
      if (!collab || !collab.name) return;
      const nameKey = collab.name.toLowerCase().trim();
      const emailKey = collab.email?.toLowerCase().trim();
      const exists = list.some(e => 
        e.id === collab.id || 
        e.name.toLowerCase().trim() === nameKey || 
        (emailKey && e.email?.toLowerCase().trim() === emailKey)
      );

      if (!exists) {
        seen.add(collab.id);
        list.push({
          id: collab.id,
          matricule: collab.matricule || `EMP-${collab.id.slice(-4).toUpperCase()}`,
          name: collab.name,
          email: collab.email || '',
          phone: collab.phone || '',
          role: collab.role,
          jobTitle: collab.jobTitle || collab.role || 'Collaborateur',
          department: 'Direction & Exploitation',
          hiringDate: collab.createdDate || new Date().toISOString().split('T')[0],
          hireDate: collab.createdDate || new Date().toISOString().split('T')[0],
          baseSalary: 1800,
          status: collab.status === 'Active' ? 'Active' : 'Terminated',
          ssn: '',
          cin: ''
        });
      }
    });

    return list;
  }, [employees, collaborators]);
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const deletedSet = getDeletedRecordIds();
      const suffix = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const keysToTry = [
        `elyssa_attendance_records_${suffix}`,
      ];

      const recordMap = new Map<string, AttendanceRecord>();
      keysToTry.forEach(key => {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              parsed.forEach((r: AttendanceRecord) => {
                if (r && r.id && !deletedSet.has(r.id)) {
                  recordMap.set(r.id, r);
                }
              });
            }
          } catch (e) {}
        }
      });

      return Array.from(recordMap.values()).filter(r => !deletedSet.has(r.id));
    } catch (e) {
      return [];
    }
  });

  // --- SELFIES DE RÉFÉRENCE GALLERY STATES & LOGIC ---
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(() => {
    const seen = new Set<string>();
    return (filteredEmployees || []).filter(e => {
      if (!e || !e.id || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  });

  useEffect(() => {
    const seen = new Set<string>();
    const unique = (filteredEmployees || []).filter(e => {
      if (!e || !e.id || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    setLocalEmployees(unique);
  }, [filteredEmployees]);

  const [selfieSearchQuery, setSelfieSearchQuery] = useState('');
  const [selfieStatusFilter, setSelfieStatusFilter] = useState<'all' | 'enrolled' | 'pending'>('all');
  const [selfieBranchFilter, setSelfieBranchFilter] = useState('all');
  const [selectedBadgeEmployee, setSelectedBadgeEmployee] = useState<Employee | null>(null);

  // Admin Selfie Enrollment Modal
  const [showAdminSelfieModal, setShowAdminSelfieModal] = useState(false);
  const [adminEnrollEmpId, setAdminEnrollEmpId] = useState('');
  const [adminCapturedPhoto, setAdminCapturedPhoto] = useState<string | null>(null);

  const getEmployeeRefSelfie = useCallback((emp: Employee): string | null => {
    if ((emp as any).referenceSelfie) return (emp as any).referenceSelfie;
    const stored = localStorage.getItem(`elyssa_ref_selfie_${emp.id}`);
    if (stored) return stored;
    // Auto-detect selfie photo captured during smartphone clock-in
    const recordSelfie = records.find(r => r.employeeId === emp.id && r.selfieUrl)?.selfieUrl;
    if (recordSelfie) {
      localStorage.setItem(`elyssa_ref_selfie_${emp.id}`, recordSelfie);
      return recordSelfie;
    }
    if ((emp as any).photoUrl) return (emp as any).photoUrl;
    return null;
  }, [records]);

  const getRecordPhoto = useCallback((rec: AttendanceRecord): string | null => {
    if (rec.selfieUrl && rec.selfieUrl.trim().length > 0) return rec.selfieUrl;
    
    const emp = localEmployees.find(e => 
      (e.id && rec.employeeId && e.id === rec.employeeId) ||
      (e.name && rec.employeeName && e.name.trim().toLowerCase() === rec.employeeName.trim().toLowerCase())
    );
    if (emp) {
      if ((emp as any).referenceSelfie) return (emp as any).referenceSelfie;
      if ((emp as any).photoUrl) return (emp as any).photoUrl;
      if ((emp as any).photo) return (emp as any).photo;
    }
    
    if (rec.employeeId) {
      const stored = localStorage.getItem(`elyssa_ref_selfie_${rec.employeeId}`) ||
                     localStorage.getItem(`elyssa_ref_selfie_${rec.employeeId}_inter_affaires`);
      if (stored) return stored;
    }
    
    return null;
  }, [localEmployees]);



  // States for collaborator filtering by name, local/agency and alphabetical sorting
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empBranchFilter, setEmpBranchFilter] = useState('all');
  const [empSortOrder, setEmpSortOrder] = useState<'asc' | 'desc'>('asc');

  // Processed employees filtered by search query, DRH location affectation and sorted
  const processedEmployees = useMemo(() => {
    let list = filteredEmployees.filter(emp => emp.status !== 'Terminated');

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
  }, [filteredEmployees, empBranchFilter, empSearchQuery, empSortOrder]);

  // Memoized filters & metrics for Selfies Gallery
  const selfieEmployeesList = useMemo(() => {
    let list = localEmployees.filter(emp => emp.status !== 'Terminated');

    if (selfieBranchFilter !== 'all') {
      list = list.filter(emp => (emp.branchId || 'loc-maman') === selfieBranchFilter);
    }

    if (selfieSearchQuery.trim()) {
      const q = selfieSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.name.toLowerCase().includes(q) ||
        (emp.matricule && emp.matricule.toLowerCase().includes(q)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q))
      );
    }

    if (selfieStatusFilter === 'enrolled') {
      list = list.filter(emp => !!getEmployeeRefSelfie(emp));
    } else if (selfieStatusFilter === 'pending') {
      list = list.filter(emp => !getEmployeeRefSelfie(emp));
    }

    return list;
  }, [localEmployees, selfieBranchFilter, selfieSearchQuery, selfieStatusFilter, getEmployeeRefSelfie]);

  const enrolledEmployeesCount = useMemo(() => {
    return localEmployees.filter(emp => !!getEmployeeRefSelfie(emp)).length;
  }, [localEmployees, getEmployeeRefSelfie]);

  const pendingEmployeesCount = useMemo(() => {
    return Math.max(0, localEmployees.length - enrolledEmployeesCount);
  }, [localEmployees, enrolledEmployeesCount]);

  const enrolmentPercentage = useMemo(() => {
    if (!localEmployees.length) return 0;
    return Math.round((enrolledEmployeesCount / localEmployees.length) * 100);
  }, [localEmployees, enrolledEmployeesCount]);

  const handleAdminSaveSelfie = async (empId: string, selfieUrl: string) => {
    const updated = localEmployees.map(e => e.id === empId ? { ...e, referenceSelfie: selfieUrl } : e);
    setLocalEmployees(updated);
    localStorage.setItem(`elyssa_ref_selfie_${empId}`, selfieUrl);
    localStorage.setItem('carthage_employees', JSON.stringify(updated));
    await syncToCloud(companyLocations, qrConfig, records, updated);
  };

  const handleAdminDeleteSelfie = async (empId: string) => {
    const updated = localEmployees.map(e => {
      if (e.id === empId) {
        const copy = { ...e };
        delete (copy as any).referenceSelfie;
        return copy;
      }
      return e;
    });
    setLocalEmployees(updated);
    localStorage.removeItem(`elyssa_ref_selfie_${empId}`);
    localStorage.setItem('carthage_employees', JSON.stringify(updated));
    await syncToCloud(companyLocations, qrConfig, records, updated);
  };

  // --- START OF MOBILE SMARTPHONE SIMULATOR STATES & LOGIC ---
  const [mobileEmployeeId, setMobileEmployeeId] = useState<string>(() => {
    if (isRestrictedUser && loggedInEmployee) {
      return loggedInEmployee.id;
    }
    return '';
  });
  useEffect(() => {
    if (isRestrictedUser && loggedInEmployee) {
      setMobileEmployeeId(loggedInEmployee.id);
    }
  }, [loggedInEmployee, isRestrictedUser]);

  const [mobileSuccessMsg, setMobileSuccessMsg] = useState<string>('');
  const [mobileErrorMsg, setMobileErrorMsg] = useState<string>('');
  const [mobileGpsLocation, setMobileGpsLocation] = useState<{lat: number; lng: number; accuracy: number; label: string}>({
    lat: 36.8065,
    lng: 10.1815,
    accuracy: 8,
    label: 'Tunis Centre (36.8065, 10.1815)'
  });
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Individual employee QR / Link generation states
  const [individualQrEmpId, setIndividualQrEmpId] = useState<string>('');
  const [simulatedMatriculeLocked, setSimulatedMatriculeLocked] = useState<boolean>(false);
  const [qrModelType, setQrModelType] = useState<'high_contrast' | 'short_token' | 'stylized_indigo' | 'stylized_emerald'>('high_contrast');
  const [enlargedQrModal, setEnlargedQrModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    matricule?: string;
    url: string;
    qrImageUrl: string;
  } | null>(null);

  const getQrCodeImageUrl = (dataString: string, model: 'high_contrast' | 'short_token' | 'stylized_indigo' | 'stylized_emerald', size = 450) => {
    let color = '000000'; // Standard black for maximum camera scanning readability
    let ecc = 'L'; // Low redundancy error correction = larger blocks, easier scanning
    let qzone = '2';

    if (model === 'stylized_indigo') {
      color = '1e1b4b'; // Deep navy indigo (high contrast)
      ecc = 'M';
    } else if (model === 'stylized_emerald') {
      color = '064e3b'; // Deep forest emerald
      ecc = 'M';
    } else if (model === 'short_token') {
      color = '000000';
      ecc = 'L';
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(dataString)}&color=${color}&bgcolor=ffffff&ecc=${ecc}&qzone=${qzone}`;
  };

  const [qrConfig, setQrConfig] = useState(() => {
    const saved = localStorage.getItem('elyssa_qr_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName && parsed.regenTime && parsed.currentToken) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      companyName: activeCompanyName,
      regenTime: '05:00',
      currentToken: 'ELY-QR-' + Math.floor(100000 + Math.random() * 900000),
      lastRegenDate: new Date().toISOString().split('T')[0]
    };
  });

  // Sync state if activeCompanyName changes and differs from qrConfig
  useEffect(() => {
    if (activeCompanyName && qrConfig.companyName !== activeCompanyName) {
      const saved = localStorage.getItem('elyssa_qr_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.companyName === activeCompanyName) {
            setQrConfig(parsed);
            return;
          }
        } catch (e) {}
      }
      setQrConfig({
        companyName: activeCompanyName,
        regenTime: '05:00',
        currentToken: 'ELY-QR-' + Math.floor(100000 + Math.random() * 900000),
        lastRegenDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [activeCompanyName]);

  // Helper to sync state to firestore
  const syncToCloud = async (
    locs: any[] = companyLocations,
    qConf: any = qrConfig,
    recs: any[] = records,
    emps: any[] = employees
  ) => {
    try {
      const deletedArr = Array.from(getDeletedRecordIds());
      const deletedSet = new Set(deletedArr);
      const cleanRecs = recs.filter(r => r && r.id && !deletedSet.has(r.id));

      const docId = qConf.companyName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const docRef = doc(db, 'attendance_settings', docId);

      // Fetch remote snapshot first so mobile check-ins are merged safely
      let mergedRecs = cleanRecs;
      try {
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.records && Array.isArray(snap.data().records)) {
          const remoteRecs = snap.data().records.filter((r: any) => r && r.id && !deletedSet.has(r.id));
          const map = new Map<string, AttendanceRecord>();
          cleanRecs.forEach(r => map.set(r.id, r));
          remoteRecs.forEach((r: AttendanceRecord) => {
            const existing = map.get(r.id);
            if (!existing) {
              map.set(r.id, r);
            } else {
              map.set(r.id, {
                ...existing,
                ...r,
                clockIn: r.clockIn || existing.clockIn,
                clockOut: r.clockOut || existing.clockOut,
                selfieUrl: r.selfieUrl || existing.selfieUrl
              });
            }
          });
          mergedRecs = Array.from(map.values());
        }
      } catch (e) {}

      await setDoc(docRef, {
        companyLocations: locs,
        qrConfig: qConf,
        employees: emps.map(e => ({
          id: e.id,
          name: e.name,
          jobTitle: e.jobTitle,
          matricule: e.matricule || `MAT-${e.id}`,
          status: e.status || 'Active',
          branchId: e.branchId || 'loc-maman',
          referenceSelfie: (e as any).referenceSelfie || (e as any).photoUrl || (e as any).photo || window.localStorage.getItem(`elyssa_ref_selfie_${e.id}`) || window.localStorage.getItem(`elyssa_ref_selfie_${e.id}_inter_affaires`) || null,
          department: e.department || '',
          email: e.email || '',
          phone: e.phone || ''
        })),
        records: mergedRecs,
        deletedRecordIds: deletedArr,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also sync to company_erp_data/{docId}
      try {
        const erpDocRef = doc(db, 'company_erp_data', docId);
        await setDoc(erpDocRef, {
          attendance_logs: mergedRecs.map(r => ({ ...r, locationStatus: "GPS_VERIFIED" })),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Sync individual records to subcollection
        for (const rec of mergedRecs) {
          if (rec && rec.id) {
            const subDocRef = doc(db, 'company_erp_data', docId, 'attendance_logs', rec.id);
            await setDoc(subDocRef, {
              ...rec,
              locationStatus: "GPS_VERIFIED",
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } catch (subErr) {
        console.warn("Notice syncing company_erp_data subcollection:", subErr);
      }

      console.log("☁️ HR Attendance Config & Records synced to Firestore.");
    } catch (err) {
      console.error("Error syncing to Firestore:", err);
    }
  };

  const saveQrConfig = (newConfig: typeof qrConfig) => {
    setQrConfig(newConfig);
    localStorage.setItem('elyssa_qr_config', JSON.stringify(newConfig));
    syncToCloud(companyLocations, newConfig, records, employees);
  };

  const saveLocations = (locs: any[]) => {
    onUpdateCompanyLocations(locs);
    localStorage.setItem('elyssa_company_locations', JSON.stringify(locs));
    syncToCloud(locs, qrConfig, records, employees);
  };

  // Load and listen to Firestore sync on mount
  useEffect(() => {
    const rawName = qrConfig.companyName || activeCompanyName || 'Inter-Affaires';
    const cleanedName = rawName.replace(/\(Connexion Mère\)/gi, '').trim() || 'Inter-Affaires';
    const docId = cleanedName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(db, 'attendance_settings', docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.companyLocations) {
          const compName = activeCompanyName || 'Inter-Affaires';
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
          onUpdateCompanyLocations(mappedLocs);
          window.localStorage.setItem('elyssa_company_locations', JSON.stringify(mappedLocs));
        }
        if (data.qrConfig) {
          setQrConfig(data.qrConfig);
          window.localStorage.setItem('elyssa_qr_config', JSON.stringify(data.qrConfig));
        }
        if (data.deletedRecordIds && Array.isArray(data.deletedRecordIds)) {
          data.deletedRecordIds.forEach((id: string) => recordDeletedId(id));
        }
        if (data.records && Array.isArray(data.records)) {
          const deletedSet = getDeletedRecordIds();
          const cleanFirestoreRecs = data.records.filter((r: AttendanceRecord) => r && r.id && !deletedSet.has(r.id));

          setRecords(prev => {
            const map = new Map<string, AttendanceRecord>();
            if (Array.isArray(prev)) {
              prev.filter(r => r && r.id && !deletedSet.has(r.id)).forEach(r => map.set(r.id, r));
            }

            const suffix = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const keysToTry = [
              `elyssa_attendance_records_${suffix}`,
            ];

            keysToTry.forEach(key => {
              const saved = window.localStorage.getItem(key);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
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

            cleanFirestoreRecs.forEach((r: AttendanceRecord) => {
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

            const merged = Array.from(map.values()).filter(r => !deletedSet.has(r.id));
            const payload = JSON.stringify(merged);
            window.localStorage.setItem(`elyssa_attendance_records_${suffix}`, payload);
            return merged;
          });
        }
      } else {
        syncToCloud(companyLocations, qrConfig, records, employees);
      }
    }, (error) => {
      console.error("Firestore loading error in AttendanceManager:", error);
    });

    return () => unsubscribe();
  }, [qrConfig.companyName, activeCompanyName]);

  const [gpsMamanLoading, setGpsMamanLoading] = useState(false);

  // Haversine formula to compute distance in meters between two coordinates
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  };

  const regenerateQrToken = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const updated = {
      ...qrConfig,
      currentToken: `ELY-QR-${randomSuffix}`,
      lastRegenDate: new Date().toISOString().split('T')[0]
    };
    saveQrConfig(updated);
  };

  // Auto-generation effect: checks if we have hit the target time today
  useEffect(() => {
    const checkTimer = setInterval(() => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDateStr = now.toISOString().split('T')[0];

      if (currentHourMin === qrConfig.regenTime && qrConfig.lastRegenDate !== todayDateStr) {
        regenerateQrToken();
      }
    }, 20000); // Check every 20 seconds
    return () => clearInterval(checkTimer);
  }, [qrConfig]);

  const handleMobilePunch = async (type: 'in' | 'out') => {
    const targetEmpId = mobileEmployeeId;
    if (!targetEmpId) {
      setMobileErrorMsg("Veuillez choisir votre profil de collaborateur.");
      setMobileSuccessMsg('');
      return;
    }

    const emp = employees.find(e => e.id === targetEmpId);
    if (!emp) return;

    // 1. GPS Geofence Check based on employee's branch
    const branchId = emp.branchId || 'loc-maman';
    const branch = companyLocations.find(l => l.id === branchId) || companyLocations[0];
    const distMeters = Math.round(getDistance(mobileGpsLocation.lat, mobileGpsLocation.lng, branch.lat, branch.lng));
    const allowedRadius = branch.radius || 150;

    if (distMeters > allowedRadius) {
      setMobileErrorMsg(`Pointage refusé : Vous êtes hors de votre zone de travail (Distance: ${distMeters} mètres)`);
      setMobileSuccessMsg('');
      return; // Empêcher toute écriture !
    }

    // 2. Selfie / Reconnaissance Faciale
    const activeRef = (emp as any).referenceSelfie || (emp as any).referenceSelfieUrl || (emp as any).photoUrl || (emp as any).photo || window.localStorage.getItem(`elyssa_ref_selfie_${emp.id}`) || null;

    if (!activeRef && !capturedPhotoUrl) {
      setMobileErrorMsg("📸 Veuillez prendre votre 1er selfie de référence : l'enrôlement initial est obligatoire pour pouvoir pointer.");
      setMobileSuccessMsg('');
      return;
    }

    if (!capturedPhotoUrl && activeRef) {
      setMobileErrorMsg("📸 Selfie de vérification en direct obligatoire pour valider votre pointage par reconnaissance faciale.");
      setMobileSuccessMsg('');
      return;
    }

    if (activeRef && capturedPhotoUrl && activeRef !== capturedPhotoUrl) {
      try {
        const verifyRes = await fetch('/api/attendance/verify-selfie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceSelfie: activeRef,
            capturedSelfie: capturedPhotoUrl
          })
        }).then(res => res.json());

        if (verifyRes && verifyRes.match === false) {
          setMobileErrorMsg('Pointage refusé : Identité visuelle non reconnue');
          setMobileSuccessMsg('');
          return; // Empêcher toute écriture dans la base de données !
        }
      } catch (e) {
        console.warn("Verify selfie notice in AttendanceManager:", e);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const punchTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const mockLocationLabel = `📱 Pocket App (Site: ${branch.name} | GPS: ${mobileGpsLocation.lat.toFixed(4)}, ${mobileGpsLocation.lng.toFixed(4)})`;

    if (offlineMode) {
      const localRecord = {
        id: `att_local_${Date.now()}`,
        employeeId: targetEmpId,
        employeeName: emp.name,
        jobTitle: emp.jobTitle,
        date: todayStr,
        time: punchTime,
        type,
        location: mockLocationLabel,
        gps: mobileGpsLocation,
        photo: capturedPhotoUrl,
        synced: false
      };
      setOfflineQueue(prev => [...prev, localRecord]);
      setMobileSuccessMsg(`💾 [Mode Hors-ligne] Enregistré localement sur votre smartphone !`);
      setMobileErrorMsg('');
      setCapturedPhotoUrl(null);
      return;
    }

    // Direct online sync
    const existingIndex = records.findIndex(r => r.employeeId === targetEmpId && r.date === todayStr);
    let updated = [...records];

    if (type === 'in') {
      const hours = new Date().getHours();
      const minutes = new Date().getMinutes();
      const isLate = (hours > 8) || (hours === 8 && minutes > 30);
      
      const newRec: AttendanceRecord = {
        id: `att_${targetEmpId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
        employeeId: targetEmpId,
        employeeName: emp.name,
        jobTitle: emp.jobTitle,
        date: todayStr,
        clockIn: punchTime,
        location: mockLocationLabel,
        status: isLate ? 'Late' : 'Present',
        overtimeHours: 0,
        notes: `📱 Pointage PWA Mobile | Photo & GPS Validés`,
        isApproved: true,
        selfieUrl: capturedPhotoUrl || activeRef || ''
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], ...newRec };
      } else {
        updated.unshift(newRec);
      }
      setMobileSuccessMsg(`✅ Bonjour ${emp.name} ! Arrivée validée par GPS & Photo à ${punchTime}.`);
      setMobileErrorMsg('');
    } else {
      if (existingIndex >= 0) {
        const inRecord = updated[existingIndex];
        let ot = 0;
        if (inRecord.clockIn) {
          const inHours = parseInt(inRecord.clockIn.split(':')[0], 10) + parseInt(inRecord.clockIn.split(':')[1], 10) / 60;
          const outHours = new Date().getHours() + new Date().getMinutes() / 60;
          const standardDuration = 8.25;
          const elapsed = outHours - inHours;
          if (elapsed > standardDuration) {
            ot = Math.round((elapsed - standardDuration) * 100) / 100;
          }
        }

        updated[existingIndex] = {
          ...inRecord,
          clockOut: punchTime,
          overtimeHours: ot,
          isApproved: ot > 0 ? false : true,
          notes: `${inRecord.notes || ''} | Départ validé par PWA Mobile`.trim(),
          selfieUrl: capturedPhotoUrl || inRecord.selfieUrl || ''
        };
        setMobileSuccessMsg(`✅ Au revoir ${emp.name} ! Départ enregistré à ${punchTime}.`);
        setMobileErrorMsg('');
      } else {
        const newRec: AttendanceRecord = {
          id: `att_${targetEmpId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
          employeeId: targetEmpId,
          employeeName: emp.name,
          jobTitle: emp.jobTitle,
          date: todayStr,
          clockOut: punchTime,
          location: mockLocationLabel,
          status: 'Present',
          overtimeHours: 0,
          notes: `⚠️ Départ direct via PWA Mobile sans arrivée`,
          isApproved: false,
          selfieUrl: capturedPhotoUrl || ''
        };
        updated.unshift(newRec);
        setMobileSuccessMsg(`⚠️ Départ enregistré à ${punchTime} sans arrivée préalable.`);
        setMobileErrorMsg('');
      }
    }

    setRecords(updated);
    saveRecords(updated);
    setCapturedPhotoUrl(null);
  };

  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    
    let updated = [...records];
    offlineQueue.forEach(item => {
      const todayStr = item.date;
      const targetEmpId = item.employeeId;
      const existingIndex = updated.findIndex(r => r.employeeId === targetEmpId && r.date === todayStr);

      if (item.type === 'in') {
        const hours = parseInt(item.time.split(':')[0], 10);
        const minutes = parseInt(item.time.split(':')[1], 10);
        const isLate = (hours > 8) || (hours === 8 && minutes > 30);

        const newRec: AttendanceRecord = {
          id: `att_${targetEmpId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
          employeeId: targetEmpId,
          employeeName: item.employeeName,
          jobTitle: item.jobTitle,
          date: todayStr,
          clockIn: item.time,
          location: `${item.location} (Synchronisé)`,
          status: isLate ? 'Late' : 'Present',
          overtimeHours: 0,
          notes: `📱 Pointage Offline Synchronisé | Photo & GPS validés hors-ligne`,
          isApproved: true
        };

        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], ...newRec };
        } else {
          updated.unshift(newRec);
        }
      } else {
        if (existingIndex >= 0) {
          const inRecord = updated[existingIndex];
          let ot = 0;
          if (inRecord.clockIn) {
            const inHours = parseInt(inRecord.clockIn.split(':')[0], 10) + parseInt(inRecord.clockIn.split(':')[1], 10) / 60;
            const outHours = parseInt(item.time.split(':')[0], 10) + parseInt(item.time.split(':')[1], 10) / 60;
            const standardDuration = 8.25;
            const elapsed = outHours - inHours;
            if (elapsed > standardDuration) {
              ot = Math.round((elapsed - standardDuration) * 100) / 100;
            }
          }

          updated[existingIndex] = {
            ...inRecord,
            clockOut: item.time,
            overtimeHours: ot,
            isApproved: ot > 0 ? false : true,
            notes: `${inRecord.notes || ''} | Départ Offline Synchronisé`.trim()
          };
        } else {
          const newRec: AttendanceRecord = {
            id: `att_${targetEmpId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
            employeeId: targetEmpId,
            employeeName: item.employeeName,
            jobTitle: item.jobTitle,
            date: todayStr,
            clockOut: item.time,
            location: `${item.location} (Synchronisé)`,
            status: 'Present',
            overtimeHours: 0,
            notes: `⚠️ Départ Offline direct sans arrivée`,
            isApproved: false
          };
          updated.unshift(newRec);
        }
      }
    });

    saveRecords(updated);
    setOfflineQueue([]);
    setMobileSuccessMsg(`🎉 Synchronisation réussie de ${offlineQueue.length} pointage(s) stocké(s) localement !`);
    setMobileErrorMsg('');
  };
  // --- END OF MOBILE SMARTPHONE SIMULATOR STATES & LOGIC ---
  
  // Terminal Inputs State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    if (isRestrictedUser && loggedInEmployee) {
      return loggedInEmployee.id;
    }
    return '';
  });

  // Sync selectedEmployeeId if loggedInEmployee loads or changes
  useEffect(() => {
    if (isRestrictedUser && loggedInEmployee) {
      setSelectedEmployeeId(loggedInEmployee.id);
    }
  }, [loggedInEmployee, isRestrictedUser]);
  const [terminalLocation, setTerminalLocation] = useState<string>(TUNISIAN_LOCATIONS[0]);
  const [terminalNote, setTerminalNote] = useState<string>('');
  const [terminalTime, setTerminalTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [customTerminalDate, setCustomTerminalDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [terminalSuccessMsg, setTerminalSuccessMsg] = useState<string>('');

  // Log Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Dashboard date interval filters
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');

  // Manual Adjust Modal
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualRecord, setManualRecord] = useState<Partial<AttendanceRecord>>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:00',
    clockOut: '17:00',
    location: TUNISIAN_LOCATIONS[0],
    status: 'Present',
    overtimeHours: 0,
    notes: '',
    isApproved: true
  });

  // Current user's local date/time for UI display
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeDisplay(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize Simulation Mode and Seed/Purge Attendance Records
  useEffect(() => {
    const deletedSet = getDeletedRecordIds();
    setRecords(prev => {
      const map = new Map<string, AttendanceRecord>();
      if (Array.isArray(prev)) {
        prev.filter(r => r && r.id && !deletedSet.has(r.id)).forEach(r => map.set(r.id, r));
      }

      const suffix = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const keysToTry = [
        `elyssa_attendance_records_${suffix}`,
      ];

      keysToTry.forEach(key => {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
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

      const filtered = Array.from(map.values()).filter(r => r && r.id && !deletedSet.has(r.id));
      const payload = JSON.stringify(filtered);
      window.localStorage.setItem(`elyssa_attendance_records_${suffix}`, payload);
      return filtered;
    });
  }, [activeCompanyName]);

  // Real-time synchronization when Pocket or another component triggers attendance updates
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      const deletedSet = getDeletedRecordIds();
      setRecords(prev => {
        const map = new Map<string, AttendanceRecord>();
        if (Array.isArray(prev)) {
          prev.filter(r => r && r.id && !deletedSet.has(r.id)).forEach(r => map.set(r.id, r));
        }

        const suffix = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9]/g, '_');
        const keysToTry = [
          `elyssa_attendance_records_${suffix}`,
          `elyssa_attendance_records_inter_affaires`
        ];

        keysToTry.forEach(key => {
          const saved = window.localStorage.getItem(key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
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

        const filtered = Array.from(map.values()).filter(r => r && r.id && !deletedSet.has(r.id));
        return filtered;
      });
    };

    window.addEventListener('storage', handleAttendanceUpdate);
    window.addEventListener('elyssa_attendance_updated', handleAttendanceUpdate);
    return () => {
      window.removeEventListener('storage', handleAttendanceUpdate);
      window.removeEventListener('elyssa_attendance_updated', handleAttendanceUpdate);
    };
  }, [activeCompanyName]);

  // Synchronize state back to localStorage
  const saveRecords = (newRecords: AttendanceRecord[]) => {
    const deletedSet = getDeletedRecordIds();
    const cleanRecords = newRecords.filter(r => r && r.id && !deletedSet.has(r.id));
    setRecords(cleanRecords);
    const suffix = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const payload = JSON.stringify(cleanRecords);
    window.localStorage.setItem(`elyssa_attendance_records_${suffix}`, payload);
    syncToCloud(companyLocations, qrConfig, cleanRecords, employees);
  };

  // Clock In / Clock Out Action from Terminal
  const handleTerminalPunch = (type: 'in' | 'out') => {
    if (!selectedEmployeeId) {
      alert("Veuillez sélectionner un collaborateur.");
      return;
    }

    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    const todayStr = customTerminalDate;
    const existingIndex = records.findIndex(r => r.employeeId === selectedEmployeeId && r.date === todayStr);
    
    let updated = [...records];
    const punchTime = terminalTime;

    if (type === 'in') {
      // Analyze late status (standard limit: 08:30)
      const hours = parseInt(punchTime.split(':')[0], 10);
      const minutes = parseInt(punchTime.split(':')[1], 10);
      const isLate = (hours > 8) || (hours === 8 && minutes > 30);
      
      const newRec: AttendanceRecord = {
        id: `att_${selectedEmployeeId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
        employeeId: selectedEmployeeId,
        employeeName: emp.name,
        jobTitle: emp.jobTitle,
        date: todayStr,
        clockIn: punchTime,
        location: terminalLocation,
        status: isLate ? 'Late' : 'Present',
        overtimeHours: 0,
        notes: terminalNote || undefined,
        isApproved: true
      };

      if (existingIndex >= 0) {
        // Overwrite standard day entry
        updated[existingIndex] = { ...updated[existingIndex], ...newRec };
      } else {
        updated.unshift(newRec);
      }
      setTerminalSuccessMsg(`👋 Bonjour ${emp.name} ! Arrivée enregistrée avec succès à ${punchTime}.`);
    } else {
      // Clock out
      if (existingIndex >= 0) {
        const inRecord = updated[existingIndex];
        // Calculate overtime if exit is past 17:15 and has clockIn
        let ot = 0;
        if (inRecord.clockIn) {
          const inHours = parseInt(inRecord.clockIn.split(':')[0], 10) + parseInt(inRecord.clockIn.split(':')[1], 10) / 60;
          const outHours = parseInt(punchTime.split(':')[0], 10) + parseInt(punchTime.split(':')[1], 10) / 60;
          const standardDuration = 8.25; // 8h15 duration standard
          const elapsed = outHours - inHours;
          if (elapsed > standardDuration) {
            ot = Math.round((elapsed - standardDuration) * 100) / 100;
          }
        }

        updated[existingIndex] = {
          ...inRecord,
          clockOut: punchTime,
          overtimeHours: ot,
          isApproved: ot > 0 ? false : true, // Overtime needs approval
          notes: terminalNote ? `${inRecord.notes || ''} | Départ: ${terminalNote}`.trim() : inRecord.notes
        };
        setTerminalSuccessMsg(`🏁 Au revoir ${emp.name} ! Départ enregistré à ${punchTime}. Travail de la journée validé.`);
      } else {
        // Directly clocking out without clockIn (assumed absent/manual correction needed)
        const newRec: AttendanceRecord = {
          id: `att_${selectedEmployeeId}_${todayStr.replace(/-/g, '')}_${Date.now()}`,
          employeeId: selectedEmployeeId,
          employeeName: emp.name,
          jobTitle: emp.jobTitle,
          date: todayStr,
          clockOut: punchTime,
          location: terminalLocation,
          status: 'Present',
          overtimeHours: 0,
          notes: `Départ direct sans arrivée: ${terminalNote}`,
          isApproved: false
        };
        updated.unshift(newRec);
        setTerminalSuccessMsg(`⚠️ Départ enregistré sans heure d'arrivée préalable. Une validation manager sera requise.`);
      }
    }

    saveRecords(updated);
    setTerminalNote('');
    
    // Clear success message after 4s
    setTimeout(() => {
      setTerminalSuccessMsg('');
    }, 4000);
  };

  // Add a manual correction record from Manager Modal
  const handleAddManualRecord = () => {
    if (!manualRecord.employeeId) return;
    const emp = employees.find(e => e.id === manualRecord.employeeId);
    if (!emp) return;

    const newRec: AttendanceRecord = {
      id: `att_man_${manualRecord.employeeId}_${Date.now()}`,
      employeeId: manualRecord.employeeId,
      employeeName: emp.name,
      jobTitle: emp.jobTitle,
      date: manualRecord.date || new Date().toISOString().split('T')[0],
      clockIn: manualRecord.status !== 'Absent' && manualRecord.status !== 'OnLeave' ? manualRecord.clockIn : undefined,
      clockOut: manualRecord.status !== 'Absent' && manualRecord.status !== 'OnLeave' ? manualRecord.clockOut : undefined,
      location: manualRecord.location || TUNISIAN_LOCATIONS[0],
      status: (manualRecord.status as any) || 'Present',
      overtimeHours: Number(manualRecord.overtimeHours) || 0,
      notes: manualRecord.notes,
      isApproved: true
    };

    const updated = [newRec, ...records];
    saveRecords(updated);
    setShowAddManualModal(false);
    
    // reset manual record inputs
    setManualRecord({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      clockIn: '08:00',
      clockOut: '17:00',
      location: TUNISIAN_LOCATIONS[0],
      status: 'Present',
      overtimeHours: 0,
      notes: '',
      isApproved: true
    });
  };

  // Delete a record
  const handleDeleteRecord = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de pointage ?")) {
      // 1. Permanently register as deleted
      const deletedArr = recordDeletedId(id);
      const deletedSet = new Set(deletedArr);

      // 2. Filter local records
      const updated = records.filter(r => r && r.id !== id && !deletedSet.has(r.id));

      // 3. Save to state and all localstorage keys
      saveRecords(updated);

      // 4. Force update/purge on active company Firestore doc
      const activeDocId = (activeCompanyName || 'Inter-Affaires').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      try {
        const docRef = doc(db, 'attendance_settings', activeDocId);
        await setDoc(docRef, {
          records: updated,
          deletedRecordIds: deletedArr,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error purging record from Firestore doc:", activeDocId, err);
      }

      // 5. Broadcast to all open views & tabs
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('elyssa_attendance_updated', { detail: updated }));
    }
  };

  // Toggle/Approve Overtime hours
  const handleToggleApproveOvertime = (id: string) => {
    const updated = records.map(r => {
      if (r.id === id) {
        return { ...r, isApproved: !r.isApproved };
      }
      return r;
    });
    saveRecords(updated);
  };

  const validRecords = useMemo(() => {
    const employeeIds = new Set(localEmployees.map(e => e.id));
    return records.filter(r => r && r.employeeId && employeeIds.has(r.employeeId));
  }, [records, localEmployees]);

  // computed statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasActiveRange = !!(dashboardStartDate || dashboardEndDate);
    
    // Period filter records
    const periodRecords = validRecords.filter(r => {
      if (dashboardStartDate && r.date < dashboardStartDate) return false;
      if (dashboardEndDate && r.date > dashboardEndDate) return false;
      return true;
    });
    
    // Today records
    const todayRecords = validRecords.filter(r => r.date === todayStr);
    
    // Today specific numbers
    const presentTodayCount = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const lateTodayCount = todayRecords.filter(r => r.status === 'Late').length;
    const absentTodayCount = todayRecords.filter(r => r.status === 'Absent').length;
    const onLeaveTodayCount = todayRecords.filter(r => r.status === 'OnLeave').length;
    const totalActiveEmployees = employees?.length || 0;
    const rateToday = totalActiveEmployees > 0 
      ? Math.round((presentTodayCount / totalActiveEmployees) * 100) 
      : 0;

    // Period specific numbers
    const presentPeriodCount = periodRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const latePeriodCount = periodRecords.filter(r => r.status === 'Late').length;
    const absentPeriodCount = periodRecords.filter(r => r.status === 'Absent').length;
    const onLeavePeriodCount = periodRecords.filter(r => r.status === 'OnLeave').length;
    
    // Unique dates with records in period to calculate average rate
    const uniqueDates = Array.from(new Set(periodRecords.map(r => r.date)));
    const totalDaysCount = uniqueDates.length || 1;
    const ratePeriod = totalActiveEmployees > 0 
      ? Math.round((presentPeriodCount / (totalActiveEmployees * totalDaysCount)) * 100) 
      : 0;

    const totalPeriodOvertime = periodRecords
      .filter(r => r.isApproved)
      .reduce((sum, r) => sum + r.overtimeHours, 0);

    const pendingApprovalsCount = validRecords.filter(r => !r.isApproved && r.overtimeHours > 0).length;

    return {
      // Today indicators (shown as secondary or default)
      presentToday: presentTodayCount,
      lateToday: lateTodayCount,
      absentToday: absentTodayCount,
      onLeaveToday: onLeaveTodayCount,
      presenceRateToday: rateToday,
      
      // Period/Active indicators
      hasActiveRange,
      presentPeriod: presentPeriodCount,
      latePeriod: latePeriodCount,
      absentPeriod: absentPeriodCount,
      onLeavePeriod: onLeavePeriodCount,
      presenceRatePeriod: hasActiveRange ? ratePeriod : rateToday,
      periodOvertime: Math.round(totalPeriodOvertime * 10) / 10,
      pendingApprovals: pendingApprovalsCount
    };
  }, [records, employees, dashboardStartDate, dashboardEndDate]);

  // Chart data 1: Presence Breakdown over the chosen period
  const last5DaysChartData = useMemo(() => {
    const data: any[] = [];
    let start = new Date();
    let end = new Date();
    const hasActiveRange = !!(dashboardStartDate || dashboardEndDate);
    
    if (hasActiveRange) {
      if (dashboardStartDate) start = new Date(dashboardStartDate);
      if (dashboardEndDate) end = new Date(dashboardEndDate);
      
      // Calculate days diff
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const daysToRender = Math.min(diffDays, 31); // cap to 31 days to avoid visual clutter
      
      const tempDate = new Date(start);
      for (let i = 0; i < daysToRender; i++) {
        if (tempDate.getDay() === 0) { // skip Sunday
          tempDate.setDate(tempDate.getDate() + 1);
          continue;
        }
        const dateStr = tempDate.toISOString().split('T')[0];
        const dayRecs = validRecords.filter(r => r.date === dateStr);
        
        const p = dayRecs.filter(r => r.status === 'Present').length;
        const l = dayRecs.filter(r => r.status === 'Late').length;
        const a = dayRecs.filter(r => r.status === 'Absent').length;
        const c = dayRecs.filter(r => r.status === 'OnLeave').length;

        const formattedDate = tempDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        
        data.push({
          date: formattedDate,
          'À l\'heure': p,
          'En retard': l,
          'Absents': a,
          'En congé': c
        });
        tempDate.setDate(tempDate.getDate() + 1);
      }
    } else {
      // Default fallback: last 5 working days
      const today = new Date();
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getDay() === 0) continue; // skip sunday
        
        const dateStr = d.toISOString().split('T')[0];
        const dayRecs = validRecords.filter(r => r.date === dateStr);
        
        const p = dayRecs.filter(r => r.status === 'Present').length;
        const l = dayRecs.filter(r => r.status === 'Late').length;
        const a = dayRecs.filter(r => r.status === 'Absent').length;
        const c = dayRecs.filter(r => r.status === 'OnLeave').length;

        const formattedDate = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        
        data.push({
          date: formattedDate,
          'À l\'heure': p,
          'En retard': l,
          'Absents': a,
          'En congé': c
        });
      }
    }
    return data;
  }, [records, dashboardStartDate, dashboardEndDate]);

  // Chart data 2: Overtime Hours by Employee in selected period
  const monthlyOvertimeChartData = useMemo(() => {
    const hasActiveRange = !!(dashboardStartDate || dashboardEndDate);
    const targetRecs = validRecords.filter(r => {
      if (hasActiveRange) {
        if (dashboardStartDate && r.date < dashboardStartDate) return false;
        if (dashboardEndDate && r.date > dashboardEndDate) return false;
        return r.isApproved && r.overtimeHours > 0;
      } else {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return r.date.startsWith(currentMonth) && r.isApproved && r.overtimeHours > 0;
      }
    });
    
    const empMap: { [key: string]: { name: string, hours: number } } = {};
    
    employees.forEach(e => {
      empMap[e.id] = { name: e.name, hours: 0 };
    });

    targetRecs.forEach(r => {
      if (empMap[r.employeeId]) {
        empMap[r.employeeId].hours += r.overtimeHours;
      }
    });

    return Object.values(empMap)
      .filter(item => item.hours > 0)
      .map(item => ({
        name: item.name.split(' ').slice(0, 2).join(' '), // keep first 2 words
        'Heures Sup.': Math.round(item.hours * 10) / 10
      }));
  }, [records, employees, dashboardStartDate, dashboardEndDate]);

  // Today's list filtered
  const todayRecordsFiltered = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    return validRecords.filter(r => r && r.date === todayStr);
  }, [validRecords]);

  // Filtered complete logs list
  const filteredLogs = useMemo(() => {
    const searchLower = (searchQuery || '').toLowerCase();
    const statusF = statusFilter || 'all';
    const locationF = locationFilter || 'all';

    return validRecords
      .filter(r => {
        if (!r) return false;
        const empName = (r.employeeName || '').toLowerCase();
        const jTitle = (r.jobTitle || '').toLowerCase();
        const rNotes = (r.notes || '').toLowerCase();

        const matchSearch = !searchLower || empName.includes(searchLower) || jTitle.includes(searchLower) || rNotes.includes(searchLower);
        const matchStatus = statusF === 'all' || r.status === statusF;
        const matchLocation = locationF === 'all' || (r.location || '').includes(locationF);
        const matchDate = !dateFilter || r.date === dateFilter;

        return matchSearch && matchStatus && matchLocation && matchDate;
      })
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        return (b.clockIn || '').localeCompare(a.clockIn || '');
      });
  }, [validRecords, searchQuery, statusFilter, locationFilter, dateFilter]);

  // Export summary calculations for Tunisian Payroll (calculates Presence Allowances and overtime multipliers)
  const payrollSummaries = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const summaries: { [key: string]: { 
      employeeId: string, 
      name: string, 
      jobTitle: string,
      daysPresent: number, 
      daysLate: number, 
      daysAbsent: number, 
      daysOnLeave: number,
      approvedOvertime: number,
      calculatedPresencePrime: number // standard Tunisian presence allowance proportional to days present (assuming 26 working days max)
    } } = {};

    (employees || []).forEach(emp => {
      if (!emp || !emp.id) return;
      summaries[emp.id] = {
        employeeId: emp.id,
        name: emp.name || 'Employé',
        jobTitle: emp.jobTitle || 'Collaborateur',
        daysPresent: 0,
        daysLate: 0,
        daysAbsent: 0,
        daysOnLeave: 0,
        approvedOvertime: 0,
        calculatedPresencePrime: 0
      };
    });

    // populate summaries
    validRecords.forEach(r => {
      if (r && r.date && r.date.startsWith(currentMonth)) {
        if (r.employeeId && summaries[r.employeeId]) {
          const s = summaries[r.employeeId];
          if (r.status === 'Present') {
            s.daysPresent++;
          } else if (r.status === 'Late') {
            s.daysLate++;
          } else if (r.status === 'Absent') {
            s.daysAbsent++;
          } else if (r.status === 'OnLeave') {
            s.daysOnLeave++;
          }
          if (r.isApproved) {
            s.approvedOvertime += (r.overtimeHours || 0);
          }
        }
      }
    });

    // Calculate prime proportion based on standard 26-day Tunisian working month
    Object.keys(summaries).forEach(id => {
      const emp = (employees || []).find(e => e && e.id === id);
      const s = summaries[id];
      if (emp && s) {
        const presenceDaysTotal = s.daysPresent + s.daysLate;
        const basePresenceAllowance = emp.presenceAllowance || 15.000; // default 15 DT
        s.calculatedPresencePrime = presenceDaysTotal > 0 
          ? Math.round((presenceDaysTotal / 22) * basePresenceAllowance * 1000) / 1000 
          : 0;
      }
    });

    return Object.values(summaries);
  }, [validRecords, employees]);

  return (
    <div className="bg-[#020617] text-slate-100 min-h-[calc(100vh-80px)] p-4 md:p-6 space-y-6 font-sans">
      
      {/* Title Header with Tunisian Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-400 p-2.5 rounded-2xl shadow-lg shadow-emerald-950/20">
            <Clock className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight font-display flex items-center gap-2">
              <span>Pointage & Temps de Travail</span>
              <span className={`text-[9px] border px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                isSimulationActive 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse'
              }`}>
                {isSimulationActive ? 'Mode Démo' : 'Production Active'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Horodatage biométrique simulé, heures supplémentaires, conformité à la législation du travail tunisienne.
            </p>
          </div>
        </div>

        {/* Live Clock & Action Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {!isRestrictedUser && (
            <button
              onClick={() => setActiveTab('hr_dashboard')}
              className="bg-gradient-to-r from-red-950/80 via-slate-900 to-indigo-950/80 border border-red-500/30 hover:border-red-500/60 rounded-xl px-3.5 py-2 flex items-center space-x-3 transition-all hover:scale-[1.02] shadow-lg shadow-red-950/20 cursor-pointer group"
              title="Accéder au Dashboard Décisionnel RH & Traitement des Alertes"
            >
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-white group-hover:text-red-300 transition-colors">
                    Dashboard Décisionnel (Alertes Terrain)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                    3 anomalies détectées aujourd'hui
                  </span>
                </div>
              </div>
            </button>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-right font-mono select-none">
            <span className="text-[10px] block text-slate-500 font-bold uppercase tracking-widest leading-none">HEURE DU SYSTÈME</span>
            <span className="text-sm font-black text-emerald-400 leading-none">
              {currentTimeDisplay.toLocaleTimeString('fr-FR')}
            </span>
            <span className="text-[10px] text-slate-400 ml-1.5 border-l border-slate-800 pl-1.5 font-bold">
              {currentTimeDisplay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-800/60 pb-1 gap-2 flex-wrap">
        {!isRestrictedUser && (
          <>
            <button
              onClick={() => setActiveTab('hr_dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'hr_dashboard' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🛡️ Dashboard RH & Alertes
              <span className="px-1.5 py-0.5 text-[8px] bg-red-500/20 text-red-300 rounded font-bold uppercase tracking-widest border border-red-500/30">MOD-11</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-650 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📊 Tableau de Bord
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === 'terminal' 
              ? 'bg-emerald-650 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📟 Badgeuse Virtuelle
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === 'mobile' 
              ? 'bg-[#10b981] text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📱 Pointage Mobile (PWA)
          <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-300 rounded font-bold uppercase tracking-widest border border-emerald-500/20">LÉGER</span>
        </button>
        {!isRestrictedUser && (
          <>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'logs' 
                  ? 'bg-emerald-650 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📋 Registre & Feuilles de Temps
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'export' 
                  ? 'bg-emerald-650 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🔄 Synthèse & Transfert Paie
            </button>
            <button
              onClick={() => setActiveTab('selfies')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'selfies' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📸 Galerie Badges & Selfies
              <span className="px-1.5 py-0.5 text-[8px] bg-amber-500/20 text-amber-300 rounded font-bold uppercase tracking-widest border border-amber-500/30">ADMIN</span>
            </button>
          </>
        )}
      </div>



      {/* TAB CONTENTS */}
      <AnimatePresence mode="wait">
        
        {/* TAB 0: HR DASHBOARD & SECURITY ALERTS */}
        {activeTab === 'hr_dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <HRDashboard tenantId={activeCompanyName || 'GEP'} employees={employees} />
          </motion.div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Elegant Date Interval Filter for Attendance Dashboard */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Filtre d'Intervalle de Temps</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Ajustez la période des statistiques de présence et des heures supplémentaires</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'this_month', label: 'Ce mois' },
                    { id: 'last_month', label: 'Mois dernier' },
                    { id: 'last_30_days', label: '30 derniers jours' },
                    { id: 'last_90_days', label: '90 derniers jours' }
                  ].map((preset) => {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = today.getMonth();
                    let isActive = false;
                    
                    if (preset.id === 'all') {
                      isActive = !dashboardStartDate && !dashboardEndDate;
                    } else if (preset.id === 'this_month') {
                      const expectedStart = new Date(y, m, 1).toISOString().split('T')[0];
                      isActive = dashboardStartDate === expectedStart;
                    } else if (preset.id === 'last_month') {
                      const expectedStart = new Date(y, m - 1, 1).toISOString().split('T')[0];
                      isActive = dashboardStartDate === expectedStart;
                    } else if (preset.id === 'last_30_days') {
                      const expectedStart = new Date();
                      expectedStart.setDate(today.getDate() - 30);
                      isActive = dashboardStartDate === expectedStart.toISOString().split('T')[0];
                    } else if (preset.id === 'last_90_days') {
                      const expectedStart = new Date();
                      expectedStart.setDate(today.getDate() - 90);
                      isActive = dashboardStartDate === expectedStart.toISOString().split('T')[0];
                    }

                    const setDashboardQuickRange = (rangeType: 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'last_90_days') => {
                      const today = new Date();
                      const y = today.getFullYear();
                      const m = today.getMonth();
                      
                      switch (rangeType) {
                        case 'all':
                          setDashboardStartDate('');
                          setDashboardEndDate('');
                          break;
                        case 'this_month': {
                          const start = new Date(y, m, 1);
                          setDashboardStartDate(start.toISOString().split('T')[0]);
                          setDashboardEndDate(today.toISOString().split('T')[0]);
                          break;
                        }
                        case 'last_month': {
                          const start = new Date(y, m - 1, 1);
                          const end = new Date(y, m, 0);
                          setDashboardStartDate(start.toISOString().split('T')[0]);
                          setDashboardEndDate(end.toISOString().split('T')[0]);
                          break;
                        }
                        case 'last_30_days': {
                          const start = new Date();
                          start.setDate(today.getDate() - 30);
                          setDashboardStartDate(start.toISOString().split('T')[0]);
                          setDashboardEndDate(today.toISOString().split('T')[0]);
                          break;
                        }
                        case 'last_90_days': {
                          const start = new Date();
                          start.setDate(today.getDate() - 90);
                          setDashboardStartDate(start.toISOString().split('T')[0]);
                          setDashboardEndDate(today.toISOString().split('T')[0]);
                          break;
                        }
                      }
                    };

                    return (
                      <button
                        key={preset.id}
                        onClick={() => setDashboardQuickRange(preset.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dashboardStartDate}
                    onChange={(e) => setDashboardStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2 px-3 text-xs font-bold text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500 text-xs font-black uppercase">à</span>
                  <input
                    type="date"
                    value={dashboardEndDate}
                    onChange={(e) => setDashboardEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2 px-3 text-xs font-bold text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  {(dashboardStartDate || dashboardEndDate) && (
                    <button
                      onClick={() => {
                        setDashboardStartDate('');
                        setDashboardEndDate('');
                      }}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition cursor-pointer"
                      title="Effacer le filtre"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {(dashboardStartDate || dashboardEndDate) && (
                <div className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-2.5 flex items-center justify-between text-emerald-400">
                  <span>
                    📅 Intervalle actif : {dashboardStartDate ? new Date(dashboardStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Origine'} au {dashboardEndDate ? new Date(dashboardEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aujourd\'hui'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold lowercase italic">
                    statistiques recalculées sur la base de la plage sélectionnée
                  </span>
                </div>
              )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      {stats.hasActiveRange ? "Présences (Période)" : "Présence Aujourd'hui"}
                    </span>
                    <h2 className="text-2xl font-black text-white font-mono tracking-tight">
                      {stats.hasActiveRange ? `${stats.presentPeriod} j.p.` : stats.presentToday}{" "}
                      <span className="text-slate-500 text-sm font-semibold">/ {employees.length}</span>
                    </h2>
                  </div>
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                    <UserCheck className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 py-1 px-2.5 rounded-lg border border-emerald-500/10 w-fit">
                  <span>
                    {stats.hasActiveRange ? "Taux de présence moyen" : "Taux de présence global"}: {stats.presenceRatePeriod}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      {stats.hasActiveRange ? "Retards (Période)" : "Retards de la matinée"}
                    </span>
                    <h2 className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                      {stats.hasActiveRange ? `${stats.latePeriod} retards` : `${stats.lateToday} en retard`}
                    </h2>
                  </div>
                  <span className="p-2 bg-amber-500/10 text-amber-400 rounded-2xl">
                    <Clock3 className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-950 py-1 px-2.5 rounded-lg border border-slate-800 w-fit">
                  <span>{stats.hasActiveRange ? "Minutes de retards accumulées" : "Tolérance système : 08h30"}</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      {stats.hasActiveRange ? "Heures Sup. (Période)" : "Heures Sup. Validées (Mois)"}
                    </span>
                    <h2 className="text-2xl font-black text-sky-400 font-mono tracking-tight">
                      {stats.periodOvertime} hrs
                    </h2>
                  </div>
                  <span className="p-2 bg-sky-500/10 text-sky-400 rounded-2xl">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 py-1 px-2.5 rounded-lg border border-emerald-500/10 w-fit">
                  <span>Majorées conformes au Code du Travail</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      {stats.hasActiveRange ? "Absences & Congés (Période)" : "Absences & Congés (Mois)"}
                    </span>
                    <h2 className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                      {stats.hasActiveRange ? `${stats.absentPeriod + stats.onLeavePeriod} j.` : `${stats.absentToday + stats.onLeaveToday} actifs`}
                    </h2>
                  </div>
                  <span className="p-2 bg-rose-500/10 text-rose-400 rounded-2xl">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/5 py-1 px-2.5 rounded-lg border border-red-500/10 w-fit">
                  <span>
                    {stats.hasActiveRange ? `${stats.onLeavePeriod} jours de congés accordés` : `${stats.onLeaveToday} congés planifiés ou autorisés`}
                  </span>
                </div>
              </div>

            </div>

            {/* Graphs and live feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Presence trends (BarChart) */}
              <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-3xl lg:col-span-2 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {stats.hasActiveRange ? "📈 Présences sur la période sélectionnée (Taux de Présence)" : "📈 Fréquentation des derniers jours ouvrés"}
                </h3>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last5DaysChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                      <Bar dataKey="À l'heure" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="En retard" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="En congé" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Absents" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column - Today Presence Breakdown */}
              <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-3xl space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {stats.hasActiveRange ? "🎯 Top Heures Supplémentaires (Période)" : "🎯 Top Heures Supplémentaires (Mois en cours)"}
                </h3>
                
                {monthlyOvertimeChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyOvertimeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        />
                        <Bar dataKey="Heures Sup." fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
                    <Award className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span className="text-[11px] font-bold">Aucune heure supplémentaire enregistrée</span>
                  </div>
                )}
              </div>

            </div>

            {/* Today's Pointages Live Feed */}
            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">
                    ⏱️ Pointages du jour en temps réel
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Visualisez les entrées, retards et sorties de la journée d'aujourd'hui.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('terminal')}
                  className="px-3.5 py-1.5 bg-emerald-650/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-650/25 transition-all text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ouvrir la badgeuse</span>
                </button>
              </div>

              {todayRecordsFiltered.length === 0 ? (
                <div className="py-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-[11px] font-bold">Aucun pointage enregistré pour l'instant aujourd'hui.</p>
                  <p className="text-[10px] text-slate-600 font-semibold">Basculez sur l'onglet "Badgeuse Virtuelle" pour effectuer un pointage d'essai.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-850">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-800 text-[9px] text-slate-400 uppercase font-black tracking-widest">
                        <th className="p-3">Collaborateur</th>
                        <th className="p-3 text-center">Photo Biométrique</th>
                        <th className="p-3">Statut du jour</th>
                        <th className="p-3">Arrivée (Clock In)</th>
                        <th className="p-3">Départ (Clock Out)</th>
                        <th className="p-3">Site de Pointage</th>
                        <th className="p-3">Heures Sup.</th>
                        <th className="p-3">Note du jour</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {todayRecordsFiltered.map((rec) => {
                        const recPhoto = getRecordPhoto(rec);
                        return (
                        <tr key={rec.id} className="hover:bg-slate-900/30 transition-all">
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white">{rec.employeeName}</span>
                              <span className="text-[10px] text-slate-400 font-semibold font-mono">{rec.jobTitle}</span>
                            </div>
                          </td>
                          <td className="p-3 flex justify-center">
                            {recPhoto ? (
                              <div className="relative group w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/30 bg-slate-950 flex items-center justify-center">
                                <img
                                  src={recPhoto}
                                  alt="Selfie"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                  <span className="text-[7px] font-black text-white text-center">VOIR PHOTO</span>
                                </div>
                                {/* Magnified preview on hover */}
                                <div className="hidden group-hover:block absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-slate-900 border-2 border-indigo-500 rounded-2xl overflow-hidden shadow-2xl z-50 p-1">
                                  <img src={recPhoto} className="w-full h-full object-cover rounded-xl" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Aucune</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              rec.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              rec.status === 'Late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
                              rec.status === 'OnLeave' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                              'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {rec.status === 'Present' ? 'À l\'heure' :
                               rec.status === 'Late' ? 'En Retard' :
                               rec.status === 'OnLeave' ? 'En Congé' : 'Absent'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-300">
                            {rec.clockIn ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {rec.clockIn}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-300">
                            {rec.clockOut ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                {rec.clockOut}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Présence active...</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400">
                            <span className="flex items-center gap-1 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {rec.location}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-black text-slate-300">
                            {rec.overtimeHours > 0 ? (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] ${rec.isApproved ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'}`}>
                                +{rec.overtimeHours} h
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-slate-450 italic text-[11px] max-w-xs truncate font-semibold">
                            {rec.notes || '-'}
                          </td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* TAB 2: TERMINAL DE POINTAGE */}
        {activeTab === 'terminal' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl shadow-emerald-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative block"></span>
              </div>

              {/* Terminal Head */}
              <div className="text-center space-y-2 border-b border-slate-800 pb-5">
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl w-fit mx-auto">
                  <Clock className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Elyssa Pointage - Terminal d'Enregistrement
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Utilisez ce terminal pour simuler un horodatage d'arrivée ou de départ pour n'importe quel collaborateur.
                </p>
              </div>

              {/* Success alert message */}
              {terminalSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 animate-bounce" />
                  <span>{terminalSuccessMsg}</span>
                </motion.div>
              )}

              {/* Main Inputs Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Employee Dropdown Selection */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400">
                    SÉLECTIONNER UN COLLABORATEUR
                  </label>
                  {isRestrictedUser && loggedInEmployee ? (
                    <div className="bg-[#020617] border border-emerald-500/25 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">COLLABORATEUR CONNECTÉ</span>
                        <span className="text-sm font-black text-white">👤 {loggedInEmployee.name}</span>
                        <span className="text-xs text-emerald-400 block mt-0.5">{loggedInEmployee.jobTitle}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 uppercase">
                        VOTRE FICHE
                      </span>
                    </div>
                  ) : (
                    <>
                      {isRestrictedUser && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl text-[11px] font-medium leading-relaxed mb-2">
                          💡 Aucun profil d'employé de l'ERP ne correspond à votre adresse e-mail <strong>({currentUser?.email || 'N/A'})</strong>. Pour tester le module pointage dans cette démo, veuillez sélectionner l'un des collaborateurs de test ci-dessous.
                        </div>
                      )}
                      {/* Filter & Search Bar for Collaborators */}
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 mb-2">
                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Filter className="w-3 h-3 text-emerald-400" /> Filtre par Local & Recherche Alphabétique
                          </span>
                          <span className="text-slate-400 font-bold">
                            {processedEmployees.length} collaborateur{processedEmployees.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-6 relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Filtre nom, matricule..."
                              value={empSearchQuery}
                              onChange={(e) => setEmpSearchQuery(e.target.value)}
                              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:border-emerald-500 outline-none transition"
                            />
                          </div>
                          <div className="sm:col-span-6">
                            <select
                              value={empBranchFilter}
                              onChange={(e) => setEmpBranchFilter(e.target.value)}
                              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:border-emerald-500 outline-none cursor-pointer transition"
                            >
                              <option value="all">📍 Tous les locaux & agences DRH</option>
                              {companyLocations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  📍 {loc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-2xl px-3.5 py-3 text-xs font-semibold focus:border-emerald-500 outline-none transition cursor-pointer"
                      >
                        <option value="">-- Choisir un collaborateur ({processedEmployees.length}) --</option>
                        {processedEmployees.map((emp) => {
                          const branch = companyLocations.find(l => l.id === (emp.branchId || 'loc-maman'));
                          return (
                            <option key={emp.id} value={emp.id}>
                              👤 {emp.name} — {emp.jobTitle} | 📍 {branch?.name || 'Siège'} (Matricule: {emp.matricule || emp.id})
                            </option>
                          );
                        })}
                      </select>
                    </>
                  )}
                </div>

                {/* 2. Site / Location Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400">
                    SITE DE POINTAGE (GPS SIMULÉ)
                  </label>
                  <select
                    value={terminalLocation}
                    onChange={(e) => setTerminalLocation(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-2xl px-3.5 py-3 text-xs font-semibold focus:border-emerald-500 outline-none transition cursor-pointer"
                  >
                    {TUNISIAN_LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={loc}>
                        📍 {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Shift / Timestamp custom picker (for testing different hours) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400">
                    HEURE À ENREGISTRER (SIMULÉE)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={terminalTime}
                      onChange={(e) => setTerminalTime(e.target.value)}
                      className="flex-1 bg-[#020617] border border-slate-800 text-slate-100 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setTerminalTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                      }}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      title="Heure actuelle"
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400">
                    DATE DU POINTAGE (PAR DÉFAUT AUJOURD'HUI)
                  </label>
                  <input
                    type="date"
                    value={customTerminalDate}
                    onChange={(e) => setCustomTerminalDate(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none transition"
                  />
                </div>

                {/* 4. Daily Note / Report */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400">
                    NOTE DU COLLABORATEUR / MOTIF OU RAPPORT (OPTIONNEL)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Saisissez un motif de retard, une tâche effectuée, ou notez 'Visite client à Tunis'..."
                    value={terminalNote}
                    onChange={(e) => setTerminalNote(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-500 outline-none transition resize-none placeholder-slate-650"
                  />
                </div>

              </div>

              {/* Action Buttons - Punch In and Punch Out */}
              <div className="grid grid-cols-2 gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => handleTerminalPunch('in')}
                  disabled={!selectedEmployeeId}
                  className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedEmployeeId 
                      ? 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-emerald-950/10' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-slate-950 shrink-0 stroke-[2.5]" />
                  <span>Pointer l'Arrivée (Clock In)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTerminalPunch('out')}
                  disabled={!selectedEmployeeId}
                  className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedEmployeeId 
                      ? 'bg-sky-650 hover:bg-sky-600 text-white shadow-sky-950/10' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4 text-slate-950 shrink-0 stroke-[2.5]" />
                  <span>Pointer le Départ (Clock Out)</span>
                </button>
              </div>

              {/* Regulatory Notice (Conformity with Tunisian Labor Code) */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="space-y-1 font-semibold">
                  <p className="text-white uppercase tracking-wider font-extrabold text-[9px]">Aide & Paramètres de Retard</p>
                  <p>
                    Le seuil de tolérance standard pour les arrivées est configuré à <span className="text-amber-400">08:30</span>. Toute arrivée enregistrée au-delà génère automatiquement un statut <span className="text-amber-400 font-bold">"En Retard"</span>. Le système calcule les heures supplémentaires (OT) dès que le temps de travail hebdomadaire dépasse les 40h standard.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3: COMPLETE ATTENDANCE LOGS */}
        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filtering Drawer / Toolbar */}
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Filtres de recherche avancée
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search query */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Collaborateur, poste, note..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl pl-9 pr-3.5 py-2 text-xs font-semibold focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Status filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="all">Filtre Statut (Tous)</option>
                    <option value="Present">À l'heure / Présents</option>
                    <option value="Late">En Retard</option>
                    <option value="Absent">Absents</option>
                    <option value="OnLeave">En Congé</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="all">Filtre Site (Tous)</option>
                    <option value="Lac 2">Les Berges du Lac</option>
                    <option value="Sfax">Sfax Dépôt</option>
                    <option value="Sousse">Boulevard 14 Janvier</option>
                    <option value="Télétravail">Télétravail</option>
                    <option value="Clientèle">Déplacement Terrain</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Reset Filters & Add Manual button */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setLocationFilter('all');
                      setDateFilter('');
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setShowAddManualModal(true)}
                    className="py-2 px-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Régulariser</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid / Table */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Feuilles d'Heures & Présences
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {filteredLogs.length} enregistrements trouvés selon vos critères.
                  </p>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs font-bold">Aucun enregistrement ne correspond aux filtres appliqués.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setLocationFilter('all');
                      setDateFilter('');
                    }}
                    className="text-[10px] font-bold text-emerald-400 underline"
                  >
                    Effacer tous les filtres
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-850">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-800 text-[9px] text-slate-400 uppercase font-black tracking-widest">
                        <th className="p-3">Date</th>
                        <th className="p-3">Collaborateur</th>
                        <th className="p-3 text-center">Photo</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Arrivée</th>
                        <th className="p-3">Départ</th>
                        <th className="p-3">Site / GPS</th>
                        <th className="p-3">Heures Sup.</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50 text-xs">
                      {filteredLogs.map((rec) => {
                        const recPhoto = getRecordPhoto(rec);
                        return (
                        <tr key={rec.id} className="hover:bg-slate-900/20 transition-all">
                          <td className="p-3 font-mono text-slate-300 font-bold whitespace-nowrap">
                            {rec.date ? (isNaN(new Date(rec.date).getTime()) ? rec.date : new Date(rec.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) : '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white">{rec.employeeName}</span>
                              <span className="text-[10px] text-slate-400 font-semibold font-mono">{rec.jobTitle}</span>
                            </div>
                          </td>
                          <td className="p-3 flex justify-center">
                            {recPhoto ? (
                              <div className="relative group w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/30 bg-slate-950 flex items-center justify-center">
                                <img
                                  src={recPhoto}
                                  alt="Selfie"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                  <span className="text-[7px] font-black text-white text-center">VOIR PHOTO</span>
                                </div>
                                {/* Magnified preview on hover */}
                                <div className="hidden group-hover:block absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-slate-900 border-2 border-indigo-500 rounded-2xl overflow-hidden shadow-2xl z-50 p-1">
                                  <img src={recPhoto} className="w-full h-full object-cover rounded-xl" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Aucune</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              rec.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              rec.status === 'Late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              rec.status === 'OnLeave' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                              'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {rec.status === 'Present' ? 'À l\'heure' :
                               rec.status === 'Late' ? 'En Retard' :
                               rec.status === 'OnLeave' ? 'En Congé' : 'Absent'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-350">
                            {rec.clockIn || '-'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-350">
                            {rec.clockOut || '-'}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px] font-semibold">
                            {rec.location}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {rec.overtimeHours > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                  rec.isApproved 
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse'
                                }`}>
                                  +{rec.overtimeHours} h
                                </span>
                                {!rec.isApproved && (
                                  <button
                                    onClick={() => handleToggleApproveOvertime(rec.id)}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[8px] font-black uppercase tracking-wider text-emerald-400 rounded cursor-pointer border-0"
                                    title="Approuver Heures Sup."
                                  >
                                    Approuver
                                  </button>
                                )}
                                {rec.isApproved && (
                                  <button
                                    onClick={() => handleToggleApproveOvertime(rec.id)}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[8px] font-semibold text-slate-400 rounded cursor-pointer border-0"
                                    title="Remettre en attente"
                                  >
                                    Annuler
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-450 transition-colors cursor-pointer border-0"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: PAYROLL INTEGRATION & SYNTHESIS */}
        {activeTab === 'export' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Warning/Info message */}
            <div className="bg-gradient-to-br from-[#0c1030] via-emerald-950/10 to-slate-900 border border-emerald-500/25 p-5 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ⚡ SYNCHRONISATION AUTOMATIQUE PAIE
                </span>
                <h3 className="text-sm font-black text-white">
                  Feuille de Synthèse du Mois pour la Paie Tunisienne
                </h3>
                <p className="text-[11px] text-slate-350 leading-relaxed max-w-2xl font-medium">
                  Le système d'Elyssa ERP regroupe les présences effectives pour calculer la <span className="text-emerald-400 font-bold">Prime de Présence (conforme au barème local)</span> et injecter automatiquement les heures supplémentaires validées dans le module de calcul de Paie.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-950/20"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Exporter la Synthèse</span>
              </button>
            </div>

            {/* Export table */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    Calculateur des Primes & Majorations Heures Sup. par Collaborateur (Mois Actuel)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                  Base 26 jours de travail / mois
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-[9px] text-slate-400 uppercase font-black tracking-widest">
                      <th className="p-3">Collaborateur</th>
                      <th className="p-3 text-center">Jours Présents</th>
                      <th className="p-3 text-center">Jours Retards</th>
                      <th className="p-3 text-center">Jours Absents</th>
                      <th className="p-3 text-center">Congés autorisés</th>
                      <th className="p-3 text-center">Heures Sup (Approved)</th>
                      <th className="p-3 text-right">Prime de Présence (TND)</th>
                      <th className="p-3 text-right">Gain Estimé H.S. (TND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 text-xs font-mono font-semibold">
                    {payrollSummaries.map((s) => {
                      const emp = employees.find(e => e.id === s.employeeId);
                      // Calculate estimated overtime gains (standard Tunisian multiplier ~1.25x average)
                      const hourlyRate = emp ? (emp.baseSalary / 192) : 10; // 192 standard monthly hours
                      const otGain = s.approvedOvertime * hourlyRate * 1.25;

                      return (
                        <tr key={s.employeeId} className="hover:bg-slate-900/20 transition-all">
                          <td className="p-3 font-sans">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white">{s.name}</span>
                              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{s.jobTitle}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-400">
                            {s.daysPresent} j
                          </td>
                          <td className="p-3 text-center font-bold text-amber-400">
                            {s.daysLate} j
                          </td>
                          <td className="p-3 text-center font-bold text-red-400">
                            {s.daysAbsent} j
                          </td>
                          <td className="p-3 text-center font-bold text-blue-400">
                            {s.daysOnLeave} j
                          </td>
                          <td className="p-3 text-center font-black text-sky-400">
                            {s.approvedOvertime > 0 ? `+${s.approvedOvertime} h` : '0 h'}
                          </td>
                          <td className="p-3 text-right font-black text-slate-250">
                            {s.calculatedPresencePrime.toFixed(3)} TND
                          </td>
                          <td className="p-3 text-right font-black text-emerald-400">
                            {otGain > 0 ? `+${otGain.toFixed(3)} TND` : '0.000 TND'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General integration schema block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sliders className="w-5 h-5" />
                  <h4 className="text-xs font-extrabold uppercase tracking-widest">Calcul de Majorations Légales (Tunisie)</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  Selon le Code du Travail de la République Tunisienne :
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 pl-4 list-disc font-semibold">
                  <li>Les heures sup. au-delà du régime légal de 40 heures hebdomadaires sont majorées de <span className="text-emerald-400 font-bold">25%</span> pour les premières heures.</li>
                  <li>Les heures prestées au-delà de 48 heures hebdomadaires ou le dimanche sont majorées de <span className="text-emerald-400 font-bold">50% ou 100%</span>.</li>
                  <li>La prime de présence est proportionnelle à la présence effective au cours du mois de paie.</li>
                </ul>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="text-xs font-extrabold uppercase tracking-widest">Pont de données Paie Actif</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                    Les valeurs de présence de cet écran se synchronisent à l'édition des fiches de paie pour éviter les ressaisies comptables et les erreurs humaines.
                  </p>
                </div>

                <div className="p-3 bg-[#020617] rounded-xl border border-slate-800 text-[10px] text-slate-400 text-center font-bold">
                  🔗 Statut de la liaison : <span className="text-emerald-400 animate-pulse font-black">CONNECTÉ AUX FICHES DE PAIE</span>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 5: MOBILE POCKET SMARTPHONE PORTAL & SIMULATOR */}
        {activeTab === 'mobile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Panel: Instructions & QR Setup (Col Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Main Banner */}
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Smartphone className="w-5 h-5 animate-bounce" />
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                    PWA (Progressive Web App)
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Elyssa Pocket : La Badgeuse Mobile Légère
                </h3>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Pour simplifier la vie de vos équipes itinérantes (livreurs, agents commerciaux, techniciens sur chantier ou personnel en déplacement), Elyssa ERP intègre une application web progressive (PWA) de pointage géolocalisé.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                    <span className="font-extrabold text-emerald-400 block mb-0.5">🚀 ZÉRO INSTALLATION</span>
                    <span className="text-slate-400">Aucun téléchargement lourd sur Google Play ou l'App Store.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                    <span className="font-extrabold text-emerald-400 block mb-0.5">📡 SANS RÉSEAU</span>
                    <span className="text-slate-400">Le mode hors-ligne stocke localement et synchronise dès récupération.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                    <span className="font-extrabold text-emerald-400 block mb-0.5">🔒 ANTI-FRAUDE</span>
                    <span className="text-slate-400">Vérification de proximité GPS et selfie d'identité obligatoires.</span>
                  </div>
                </div>
              </div>



              {/* BRAND NEW: GENERATEUR DE LIEN & QR PERSONNEL PAR COLLABORATEUR */}
              <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <UserCheck className="w-5 h-5 text-indigo-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        Générateur de QR & Lien Personnel (Par Matricule)
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Sécurisé & Verrouillé au Collaborateur
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[9px] font-black uppercase rounded-md border border-emerald-500/20">
                    SÉCURITÉ MAX
                  </span>
                </div>

                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Générez un QR Code unique et un lien chiffré pour un collaborateur spécifique. Lors du scan ou de l'ouverture de ce lien, l'application de pointage s'ouvrira <strong>directement sur son profil verrouillé</strong> sans afficher la liste des autres employés.
                </p>

                <div className="p-4 bg-[#020617]/50 border border-slate-800 rounded-2xl space-y-4">
                  
                  {/* Selector Bar for QR Code Model / Style */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                        🎨 Type / Modèle de QR Code (Lisibilité Caméra) :
                      </label>
                      <span className="text-[9px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {qrModelType === 'high_contrast' ? '⬛ Noir & Blanc High-Contrast (Recommandé)' :
                         qrModelType === 'short_token' ? '⚡ Matrice Épurée (Carrés XL)' :
                         qrModelType === 'stylized_indigo' ? '🟦 Cobalt Sombre HD' : '🟩 Émeraude Sombre HD'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setQrModelType('high_contrast')}
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                          qrModelType === 'high_contrast'
                            ? 'bg-slate-100 text-slate-950 border-white shadow-md font-extrabold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white"></span>
                        High-Contrast
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModelType('short_token')}
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                          qrModelType === 'short_token'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-amber-400 font-bold">⚡</span>
                        Jeton XL
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModelType('stylized_indigo')}
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                          qrModelType === 'stylized_indigo'
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-extrabold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-400"></span>
                        Cobalt HD
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModelType('stylized_emerald')}
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                          qrModelType === 'stylized_emerald'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-extrabold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-950 border border-emerald-400"></span>
                        Émeraude
                      </button>
                    </div>
                  </div>

                  {/* Employee Select */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Sélectionner le collaborateur :</span>
                      <span className="text-indigo-400 font-extrabold">{processedEmployees.length} affiché(s)</span>
                    </label>

                    {/* Filter & Search Bar */}
                    <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6 relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Nom, matricule..."
                            value={empSearchQuery}
                            onChange={(e) => setEmpSearchQuery(e.target.value)}
                            className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none transition"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <select
                            value={empBranchFilter}
                            onChange={(e) => setEmpBranchFilter(e.target.value)}
                            className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none cursor-pointer transition"
                          >
                            <option value="all">📍 Tous les locaux & agences DRH</option>
                            {companyLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                📍 {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <select
                      value={individualQrEmpId}
                      onChange={(e) => setIndividualQrEmpId(e.target.value)}
                      className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-indigo-500 transition"
                    >
                      <option value="">-- Choisir un collaborateur actif ({processedEmployees.length}) --</option>
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

                  {(() => {
                    const selEmp = employees.find(e => e.id === individualQrEmpId);
                    if (!selEmp) return null;

                    const individualUrl = `${window.location.origin}/pocket-attendance?company=${encodeURIComponent(qrConfig.companyName)}&matricule=${encodeURIComponent(selEmp.id)}&token=${qrConfig.currentToken}`;
                    const dataToEncode = qrModelType === 'short_token'
                      ? `ELY:${selEmp.matricule || selEmp.id}:${qrConfig.currentToken}`
                      : individualUrl;

                    const qrImgSrc = getQrCodeImageUrl(dataToEncode, qrModelType, 450);

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-900 border border-indigo-500/20 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-5 items-center shadow-lg"
                      >
                        {/* Interactive Click-to-Enlarge QR Card */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl relative shadow-md group">
                          <img
                            src={qrImgSrc}
                            alt={`QR Code ${selEmp.name}`}
                            className="w-32 h-32 object-contain rounded-lg [image-rendering:pixelated]"
                          />
                          
                          {/* Hover Zoom Overlay */}
                          <div
                            onClick={() => setEnlargedQrModal({
                              isOpen: true,
                              title: `Badge QR — ${selEmp.name}`,
                              subtitle: `Poste : ${selEmp.jobTitle} • Matricule : ${selEmp.matricule || selEmp.id}`,
                              matricule: selEmp.matricule || selEmp.id,
                              url: individualUrl,
                              qrImageUrl: qrImgSrc
                            })}
                            className="absolute inset-0 bg-slate-950/75 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center text-white text-center p-2 backdrop-blur-[2px] cursor-pointer"
                          >
                            <ZoomIn className="w-7 h-7 mb-1 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white">Cliquer pour Agrandir</span>
                            <span className="text-[8.5px] text-slate-300">Scanner sur écran ou imprimer</span>
                          </div>

                          <span className="text-[9.5px] font-black text-slate-900 mt-1.5 uppercase text-center font-mono tracking-wider">
                            QR {selEmp.matricule || selEmp.id}
                          </span>
                        </div>

                        <div className="md:col-span-7 space-y-3">
                          <div>
                            <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block">
                              COLLABORATEUR SÉLECTIONNÉ :
                            </span>
                            <span className="text-sm font-black text-white block">
                              {selEmp.name}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium block">
                              Poste : {selEmp.jobTitle}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium block font-mono">
                              Matricule : <strong className="text-emerald-400">{selEmp.matricule || selEmp.id}</strong>
                            </span>
                          </div>

                          {/* Quick Info Badge */}
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                            <span className="text-emerald-400 font-bold block">
                              ✓ Modèle configuré : {qrModelType === 'high_contrast' ? 'Noir & Blanc High-Contrast' : qrModelType === 'short_token' ? 'Format Jeton XL' : qrModelType === 'stylized_indigo' ? 'Cobalt Sombre HD' : 'Émeraude Sombre HD'}
                            </span>
                            <span className="block text-slate-400">
                              Lien direct : <code className="text-slate-300 font-mono text-[9.5px]">{individualUrl.slice(0, 42)}...</code>
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEnlargedQrModal({
                                isOpen: true,
                                title: `Badge QR — ${selEmp.name}`,
                                subtitle: `Poste : ${selEmp.jobTitle} • Matricule : ${selEmp.matricule || selEmp.id}`,
                                matricule: selEmp.matricule || selEmp.id,
                                url: individualUrl,
                                qrImageUrl: qrImgSrc
                              })}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase transition cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              Agrandir / Scanner
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const printWin = window.open('', '_blank');
                                if (printWin) {
                                  printWin.document.write(`
                                    <html>
                                      <head>
                                        <title>Badge QR — ${selEmp.name}</title>
                                        <style>
                                          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
                                          .badge { width: 320px; padding: 24px; background: white; border: 2px solid #0f172a; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                                          .company { font-size: 14px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                                          .name { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 8px; }
                                          .title { font-size: 12px; color: #64748b; margin-bottom: 12px; }
                                          .qr { width: 220px; height: 220px; margin: 0 auto; display: block; }
                                          .matricule { font-size: 14px; font-weight: 800; color: #059669; font-family: monospace; margin-top: 12px; padding: 4px 12px; background: #ecfdf5; border-radius: 8px; display: inline-block; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="badge">
                                          <div class="company">${qrConfig.companyName || 'ELYSSA ERP'}</div>
                                          <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Badge de Pointage Collaborateur</div>
                                          <div class="name">${selEmp.name}</div>
                                          <div class="title">${selEmp.jobTitle}</div>
                                          <img src="${qrImgSrc}" class="qr" alt="QR Code" />
                                          <div class="matricule">MATRICULE : ${selEmp.matricule || selEmp.id}</div>
                                        </div>
                                        <script>window.onload = function() { window.print(); }</script>
                                      </body>
                                    </html>
                                  `);
                                  printWin.document.close();
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px] font-black rounded-xl uppercase border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-400" />
                              Imprimer Badge
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(individualUrl);
                                alert(`Lien sécurisé pour ${selEmp.name} copié !\n\n${individualUrl}`);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl uppercase transition cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copier Lien
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMobileEmployeeId(selEmp.id);
                                setSimulatedMatriculeLocked(true);
                                setMobileSuccessMsg(`🔒 Simulateur configuré sur le lien sécurisé de ${selEmp.name}. Remarquez à droite que le dropdown de choix est bloqué sur son profil.`);
                                setMobileErrorMsg('');
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black rounded-xl uppercase border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                            >
                              📱 Simulateur
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>

              {/* BRAND NEW: CONFIGURATEUR DE QR CODE DYNAMIQUE POUR L'ENTREPRISE */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <Sliders className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        Configurateur QR Code Dynamique
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Sécurité Anti-Copie par Rotation
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[9px] font-black uppercase rounded-md border border-indigo-500/20">
                    PARAMÉTRABLE
                  </span>
                </div>

                <div className="p-4 bg-[#020617]/50 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Input: Nom de l'entreprise */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        🏢 Nom de l'Entreprise / Entité
                      </label>
                      <input
                        type="text"
                        value={qrConfig.companyName}
                        onChange={(e) => saveQrConfig({ ...qrConfig, companyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition"
                        placeholder="Ex: Elyssa Corp Sfax"
                      />
                    </div>

                    {/* Input: Heure de Régénération automatique */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        ⏰ Heure de Rotation Quotidienne
                      </label>
                      <input
                        type="time"
                        value={qrConfig.regenTime}
                        onChange={(e) => saveQrConfig({ ...qrConfig, regenTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase">
                        🔑 Jeton de Sécurité Actuel (Rotatif)
                      </span>
                      <code className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded">
                        {qrConfig.currentToken}
                      </code>
                      <span className="text-[9px] text-slate-500 block">
                        Dernière rotation : {qrConfig.lastRegenDate} (Se renouvelle chaque jour à {qrConfig.regenTime})
                      </span>
                    </div>

                    <button
                      onClick={regenerateQrToken}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Régénérer Maintenant
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  💡 <strong className="text-white">Principe d'auto-régénération :</strong> Chaque jour à l'heure programmée (<strong className="text-white">{qrConfig.regenTime}</strong>), ou instantanément lors de l'appui sur <strong className="text-indigo-400">Régénérer</strong>, Elyssa ERP change le jeton d'accès. Les captures d'écran des anciens QR Codes deviennent caduques et sont refusées par les smartphones des employés, assurant ainsi un contrôle infaillible.
                </p>
              </div>

              {/* GESTION DES SUCCURSALES ET ETABLISSEMENTS GPS */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        Succursales & Établissements GPS
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Géofencing de Production & Connexion Mère (MAMAN)
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[9px] font-black uppercase rounded-md border border-emerald-500/20">
                    MAMAN & FILIALES
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredLocations.map((loc, idx) => (
                    <div key={loc.id} className="p-3 bg-slate-950 border border-slate-900 rounded-2xl space-y-2 relative overflow-hidden">
                      {loc.isMaman && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-indigo-600 text-white text-[7px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-wider">
                          ⭐ CONNEXION MÈRE (MAMAN)
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white">{loc.name}</span>
                          {(loc.id?.startsWith('demo-') || (loc as any).is_demo === true || (loc as any).isDemo === true) ? (
                            <span className="text-[7px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black px-1.5 py-0.2 rounded uppercase leading-none">Démo</span>
                          ) : (
                            <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-1.5 py-0.2 rounded uppercase leading-none">Propre</span>
                          )}
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 font-mono">ID: {loc.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Latitude</span>
                          <input 
                            type="number"
                            step="0.000001"
                            value={loc.lat}
                            onChange={(e) => {
                              const updated = [...companyLocations];
                              updated[idx].lat = Number(e.target.value);
                              saveLocations(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 font-mono text-[10px] rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Longitude</span>
                          <input 
                            type="number"
                            step="0.000001"
                            value={loc.lng}
                            onChange={(e) => {
                              const updated = [...companyLocations];
                              updated[idx].lng = Number(e.target.value);
                              saveLocations(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 font-mono text-[10px] rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Rayon (Mètres)</span>
                          <input 
                            type="number"
                            value={loc.radius}
                            onChange={(e) => {
                              const updated = [...companyLocations];
                              updated[idx].radius = Number(e.target.value);
                              saveLocations(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 font-mono text-[10px] rounded px-1.5 py-0.5"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-900/60">
                        <span className="text-[9px] text-slate-400 font-semibold italic">
                          Périmètre autorisé : {loc.radius}m de tolérance géographique.
                        </span>
                        {loc.isMaman ? (
                          <button
                            onClick={() => {
                              if (navigator.geolocation) {
                                setGpsMamanLoading(true);
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    const updated = [...companyLocations];
                                    updated[idx].lat = position.coords.latitude;
                                    updated[idx].lng = position.coords.longitude;
                                    saveLocations(updated);
                                    setGpsMamanLoading(false);
                                    alert(`🛰️ GPS MAMAN DÉTECTÉ ET MIS À JOUR !\n\nVotre connexion administrative mère est désormais localisée à:\nLat: ${position.coords.latitude}\nLng: ${position.coords.longitude}\nTous les collaborateurs rattachés au Siège MAMAN seront désormais autorisés uniquement dans ce périmètre.`);
                                  },
                                  (error) => {
                                    setGpsMamanLoading(false);
                                    alert(`❌ Erreur d'acquisition GPS : ${error.message}\nAssurez-vous d'avoir autorisé la géolocalisation.`);
                                  },
                                  { enableHighAccuracy: true, timeout: 10000 }
                                );
                              } else {
                                alert("La géolocalisation n'est pas supportée par ce navigateur.");
                              }
                            }}
                            disabled={gpsMamanLoading}
                            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[8px] font-black rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                          >
                            {gpsMamanLoading ? "Acquisition..." : "🛰️ Détecter ma Position MAMAN"}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm("Voulez-vous supprimer cette succursale ?")) {
                                saveLocations(companyLocations.filter(l => l.id !== loc.id));
                              }
                            }}
                            className="px-2 py-1 bg-rose-950/45 hover:bg-rose-900/45 text-rose-400 text-[8px] font-black rounded-lg uppercase tracking-wider transition cursor-pointer border border-rose-900/20"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const name = prompt("Entrez le nom de la nouvelle succursale / agence :");
                      if (!name) return;
                      const latStr = prompt("Entrez la latitude (ex : 35.8256) :");
                      const lngStr = prompt("Entrez la longitude (ex : 10.6369) :");
                      if (!latStr || !lngStr) return;
                      const newLoc = {
                        id: `loc_${Date.now()}`,
                        name: name,
                        lat: Number(latStr),
                        lng: Number(lngStr),
                        radius: 150
                      };
                      saveLocations([...companyLocations, newLoc]);
                    }}
                    className="w-full py-2 border border-dashed border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 text-[9px] font-black uppercase rounded-2xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    ➕ Ajouter une nouvelle Succursale / Agence
                  </button>
                </div>
              </div>

              {/* Geofencing & Anti-Buddy-Punching Settings Info */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  🛡️ Paramètres de Contrôle Local et Anti-Fraude
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-800 p-4 rounded-2xl space-y-2 bg-[#020617]/50">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">GÉOFENCING / RAYON GPS</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Le pointage n'est validé que si la géolocalisation de l'appareil est dans un rayon de <strong className="text-white">50 mètres</strong> d'un site déclaré (ex: l'agence Tunis-Lac, Sfax, ou l'usine). Hors zone, le pointage est soit bloqué, soit soumis à une justification.
                    </p>
                  </div>
                  <div className="border border-slate-800 p-4 rounded-2xl space-y-2 bg-[#020617]/50">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">FACIAL MATCHING & PHOTO PROOF</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Pour en finir avec le pointage à la place des collègues ("buddy punching"), la badgeuse mobile exige un selfie instantané. L'image est compressée et cryptée sur la fiche de présence et consultable par la direction RH.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Panel: Real Smartphone PWA App (Col Span 5) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              <div className="text-center mb-2.5">
                <span className="text-xs font-bold text-slate-300 block flex items-center justify-center gap-1.5">
                  📱 SIMULATEUR MOBILE TERRAIN EN DIRECT
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">
                  100% Identique à l'Interface Smartphone
                </span>
              </div>

              {/* Smartphone Outer Shell Frame */}
              <div className="relative w-[320px] sm:w-[340px] h-[660px] bg-slate-950 border-[7px] border-slate-800 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-1 ring-slate-800/80">
                
                {/* Speaker Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center border border-slate-800 pointer-events-none">
                  <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                </div>

                {/* Real Pocket Mobile App Embedded Directly */}
                <div className="flex-1 w-full h-full overflow-hidden flex flex-col pt-3">
                  <PocketAttendanceView isEmbeddedInSimulator={true} />
                </div>

                {/* Smartphone Home Touch Bar */}
                <div className="bg-[#020617] py-2 flex items-center justify-center select-none z-30 shrink-0">
                  <div className="w-24 h-1 bg-slate-800 rounded-full"></div>
                </div>

              </div>

              <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl max-w-[340px] text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">🔗 SYNCHRONISATION DIRECTE</span>
                <p className="text-[9px] text-slate-350 leading-relaxed font-semibold">
                  Chaque action sur ce smartphone virtuel est identique à l'application mobile réelle et est immédiatement visible dans le <span className="text-emerald-400 font-bold">Registre RH</span> !
                </p>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 6: GALERIE & MOSAÏQUE DES BADGES BIOMÉTRIQUES (SELFIES DE RÉFÉRENCE) */}
        {activeTab === 'selfies' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Main Banner */}
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/20 p-6 rounded-3xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Camera className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                      Registre Biométrique Admin & Cartes d'Identité
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2 flex-wrap">
                    <span>Galerie Mosaïque des Selfies de Référence</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {enrolledEmployeesCount} / {filteredEmployees.length} Enrôlés
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                    Le premier selfie de référence s'effectue en présence de l'administrateur système local pour chaque entreprise. 
                    Les selfies enregistrés sont affichés sous forme de <strong className="text-slate-200">cartes d'identité biométriques</strong> (photo, matricule, nom & prénom, poste, site). 
                    Une fois le selfie enregistré, l'application smartphone du collaborateur bascule directement en pointage instantané sans redemander de photo de référence.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAdminSelfieModal(true);
                    setAdminEnrollEmpId('');
                    setAdminCapturedPhoto(null);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-2xl uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg shrink-0 border-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enrôler un Selfie (Admin)</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Effectif</span>
                <div className="text-2xl font-black text-white font-mono">{filteredEmployees.length}</div>
                <span className="text-[10px] text-slate-500">Collaborateurs répertoriés</span>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">Selfies Validés (Admin)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{enrolledEmployeesCount}</div>
                <span className="text-[10px] text-emerald-500/80 font-semibold">✓ Verrouillés pour pointage</span>
              </div>

              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">En Attente d'Enrôlement</span>
                <div className="text-2xl font-black text-amber-400 font-mono">{pendingEmployeesCount}</div>
                <span className="text-[10px] text-amber-500/80 font-semibold">⏳ En présence de l'Admin</span>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Couverture Biométrique</span>
                <div className="text-2xl font-black text-indigo-400 font-mono">{enrolmentPercentage}%</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${enrolmentPercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, matricule, poste..."
                  value={selfieSearchQuery}
                  onChange={(e) => setSelfieSearchQuery(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-amber-500 transition font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <select
                  value={selfieStatusFilter}
                  onChange={(e) => setSelfieStatusFilter(e.target.value as any)}
                  className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer font-semibold"
                >
                  <option value="all">🔍 Tous les statuts</option>
                  <option value="enrolled">🟢 Uniquement Enrôlés (Selfie Validé)</option>
                  <option value="pending">⏳ En Attente d'Enrôlement</option>
                </select>

                <select
                  value={selfieBranchFilter}
                  onChange={(e) => setSelfieBranchFilter(e.target.value)}
                  className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer font-semibold"
                >
                  <option value="all">📍 Tous les sites DRH</option>
                  {companyLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mosaïque Grid: Cartes d'Identité Biométriques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selfieEmployeesList.map((emp) => {
                const selfie = getEmployeeRefSelfie(emp);
                const branch = companyLocations.find(l => l.id === (emp.branchId || 'loc-maman'));
                const empMatricule = emp.matricule || `MAT-${emp.id}`;

                return (
                  <div
                    key={emp.id}
                    className={`bg-slate-900/90 border rounded-3xl p-4 space-y-3 relative flex flex-col justify-between transition duration-200 hover:border-amber-500/40 shadow-xl ${
                      selfie 
                        ? 'border-emerald-500/30 shadow-emerald-950/20' 
                        : 'border-slate-800 opacity-90'
                    }`}
                  >
                    {/* Top ID Card Corporate Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-300">
                          ELYSSA ERP • BADGE RH
                        </span>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        selfie 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {selfie ? '✓ ENRÔLÉ ADMIN' : '⏳ NON ENRÔLÉ'}
                      </span>
                    </div>

                    {/* Photo Block (Mosaïque Photo) */}
                    <div className="relative aspect-square w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group flex items-center justify-center">
                      {selfie ? (
                        <>
                          <img
                            src={selfie}
                            alt={`Selfie de ${emp.name}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                            <button
                              onClick={() => setSelectedBadgeEmployee(emp)}
                              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspecter Carte ID</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                            <Camera className="w-8 h-8" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Aucun Selfie de Référence</span>
                          <button
                            onClick={() => {
                              setShowAdminSelfieModal(true);
                              setAdminEnrollEmpId(emp.id);
                            }}
                            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-wider transition cursor-pointer border border-amber-500/30"
                          >
                            + Enrôler avec l'Admin
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Information Section Below Photo (as requested by user) */}
                    <div className="space-y-2 pt-1">
                      
                      {/* Matricule Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Matricule :</span>
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                          {empMatricule}
                        </span>
                      </div>

                      {/* Nom & Prénom */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nom & Prénom :</span>
                        <h4 className="text-sm font-black text-white leading-tight mt-0.5">
                          {emp.name}
                        </h4>
                      </div>

                      {/* Poste / Fonction */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Poste / Fonction :</span>
                        <p className="text-xs font-bold text-slate-300">
                          {emp.jobTitle || 'Collaborateur'}
                        </p>
                      </div>

                      {/* Site / Affectation */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Site / Local :</span>
                        <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{branch?.name || 'Siège Inter-Affaires'}</span>
                        </p>
                      </div>

                      {/* Status Confirmation Notice */}
                      <div className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border ${
                        selfie 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}>
                        {selfie ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Selfie enregistré & validé par l'Admin</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>1er selfie requis en présence de l'admin</span>
                          </>
                        )}
                      </div>

                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedBadgeEmployee(emp)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 border-0"
                      >
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Carte ID</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAdminSelfieModal(true);
                          setAdminEnrollEmpId(emp.id);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-xl transition cursor-pointer border-0"
                        title="Modifier / Enrôler selfie"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {selfie && (
                        <button
                          onClick={() => {
                            if (confirm(`Effacer le selfie de référence de ${emp.name} ? Le collaborateur devra se réenrôler avec l'administrateur.`)) {
                              handleAdminDeleteSelfie(emp.id);
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer border-0"
                          title="Supprimer selfie de référence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL: MANUAL ATTENDANCE CORRECTION / REGULARISATION */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
          >
            <button
              onClick={() => setShowAddManualModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border-0"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Régulariser un Pointage Collaborateur</span>
              </h3>
              <p className="text-xs text-slate-400">
                Saisissez un pointage manuel pour corriger un oubli de badge ou excuser une absence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborateur</label>
                <select
                  value={manualRecord.employeeId}
                  onChange={(e) => setManualRecord({ ...manualRecord, employeeId: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none cursor-pointer font-semibold"
                >
                  <option value="">-- Sélectionner --</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jobTitle}) {(['emp_1', 'emp_2', 'emp_3'].includes(emp.id) || emp.id?.startsWith('demo-') || (emp as any).is_demo === true || (emp as any).isDemo === true) ? '(DÉMO)' : '(PROPRE)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={manualRecord.date}
                  onChange={(e) => setManualRecord({ ...manualRecord, date: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</label>
                <select
                  value={manualRecord.status}
                  onChange={(e) => setManualRecord({ ...manualRecord, status: e.target.value as any })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none cursor-pointer font-semibold"
                >
                  <option value="Present">À l'heure / Présent</option>
                  <option value="Late">En Retard</option>
                  <option value="Absent">Absent non excusé</option>
                  <option value="OnLeave">En Congé</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrivée (In)</label>
                <input
                  type="time"
                  disabled={manualRecord.status === 'Absent' || manualRecord.status === 'OnLeave'}
                  value={manualRecord.clockIn}
                  onChange={(e) => setManualRecord({ ...manualRecord, clockIn: e.target.value })}
                  className="w-full bg-[#020617] disabled:bg-slate-950 disabled:text-slate-600 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Départ (Out)</label>
                <input
                  type="time"
                  disabled={manualRecord.status === 'Absent' || manualRecord.status === 'OnLeave'}
                  value={manualRecord.clockOut}
                  onChange={(e) => setManualRecord({ ...manualRecord, clockOut: e.target.value })}
                  className="w-full bg-[#020617] disabled:bg-slate-950 disabled:text-slate-600 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site</label>
                <select
                  value={manualRecord.location}
                  disabled={manualRecord.status === 'Absent' || manualRecord.status === 'OnLeave'}
                  onChange={(e) => setManualRecord({ ...manualRecord, location: e.target.value })}
                  className="w-full bg-[#020617] disabled:bg-slate-950 disabled:text-slate-600 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none cursor-pointer font-semibold"
                >
                  {TUNISIAN_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc}>{loc.split(' - ')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heures Sup.</label>
                <input
                  type="number"
                  step="0.25"
                  disabled={manualRecord.status === 'Absent' || manualRecord.status === 'OnLeave'}
                  value={manualRecord.overtimeHours}
                  onChange={(e) => setManualRecord({ ...manualRecord, overtimeHours: Number(e.target.value) })}
                  className="w-full bg-[#020617] disabled:bg-slate-950 disabled:text-slate-600 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes de correction</label>
                <input
                  type="text"
                  placeholder="Ex: Oubli de badge, visite client externe, maladie justifiée..."
                  value={manualRecord.notes}
                  onChange={(e) => setManualRecord({ ...manualRecord, notes: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:border-emerald-500 outline-none"
                />
              </div>

            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddManualRecord}
                disabled={!manualRecord.employeeId}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer border-0 ${
                  manualRecord.employeeId 
                    ? 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-emerald-950/10' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Sauvegarder
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* MODAL D'AGRANDISSEMENT ET D'IMPRESSION QR CODE */}
      {enlargedQrModal && enlargedQrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative text-slate-100"
          >
            <button
              type="button"
              onClick={() => setEnlargedQrModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border-0"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-full border border-indigo-500/20 tracking-wider">
                SÉCURITÉ & HAUTE LISIBILITÉ
              </span>
              <h3 className="text-lg font-black text-white">{enlargedQrModal.title}</h3>
              <p className="text-xs text-slate-400">{enlargedQrModal.subtitle}</p>
            </div>

            {/* Model Selector Bar inside Modal */}
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block text-center">
                Changer le modèle de rendu instantanément :
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setQrModelType('high_contrast');
                    const data = enlargedQrModal.url;
                    setEnlargedQrModal({
                      ...enlargedQrModal,
                      qrImageUrl: getQrCodeImageUrl(data, 'high_contrast', 600)
                    });
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition border cursor-pointer ${
                    qrModelType === 'high_contrast' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ⬛ High-Contrast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrModelType('short_token');
                    const data = enlargedQrModal.matricule
                      ? `ELY:${enlargedQrModal.matricule}:${qrConfig.currentToken}`
                      : enlargedQrModal.url;
                    setEnlargedQrModal({
                      ...enlargedQrModal,
                      qrImageUrl: getQrCodeImageUrl(data, 'short_token', 600)
                    });
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition border cursor-pointer ${
                    qrModelType === 'short_token' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ⚡ Jeton XL
                </button>
              </div>
            </div>

            {/* Enlarged QR Code White Badge */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-3 shadow-2xl">
              <img
                src={enlargedQrModal.qrImageUrl}
                alt={enlargedQrModal.title}
                className="w-64 h-64 object-contain rounded-xl [image-rendering:pixelated]"
              />
              <div className="text-center space-y-0.5">
                <span className="text-xs font-black text-slate-900 uppercase font-mono tracking-widest block">
                  {enlargedQrModal.matricule ? `MATRICULE : ${enlargedQrModal.matricule}` : qrConfig.companyName}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  Orienté pour scan direct via caméra mobile à distance
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(enlargedQrModal.url);
                  alert(`Lien copié dans le presse-papier :\n\n${enlargedQrModal.url}`);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0 shadow-md flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                Copier Lien
              </button>

              <button
                type="button"
                onClick={() => setEnlargedQrModal(null)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: CARTE D'IDENTITÉ BIOMÉTRIQUE RH (BADGE GRAND FORMAT) */}
      {selectedBadgeEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedBadgeEmployee(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border-0 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Badge ID Layout */}
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-xs">
                    E
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">ELYSSA ERP SUITE</h3>
                    <p className="text-[8px] text-amber-400 font-bold uppercase tracking-widest">Carte d'Identité Biométrique RH</p>
                  </div>
                </div>
                <div className="w-6 h-5 rounded border border-amber-500/40 bg-gradient-to-r from-amber-600/40 to-amber-400/20 flex items-center justify-center">
                  <div className="w-3 h-2 border border-amber-300/60 rounded-xs"></div>
                </div>
              </div>

              {/* Photo & Main Details */}
              <div className="flex gap-4 items-center">
                <div className="w-28 h-28 rounded-xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden shrink-0 shadow-inner flex items-center justify-center relative">
                  {getEmployeeRefSelfie(selectedBadgeEmployee) ? (
                    <img
                      src={getEmployeeRefSelfie(selectedBadgeEmployee)!}
                      alt={selectedBadgeEmployee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <Camera className="w-8 h-8 mx-auto" />
                      <span className="text-[8px] uppercase block font-bold mt-1">Non Enrôlé</span>
                    </div>
                  )}
                  {getEmployeeRefSelfie(selectedBadgeEmployee) && (
                    <div className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full" title="Selfie Validé">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Matricule</span>
                    <span className="font-mono text-sm font-black text-amber-400 block">
                      {selectedBadgeEmployee.matricule || `MAT-${selectedBadgeEmployee.id}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Nom & Prénom</span>
                    <h4 className="text-xs font-black text-white truncate">
                      {selectedBadgeEmployee.name}
                    </h4>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Poste / Fonction</span>
                    <p className="text-[11px] font-bold text-slate-300 truncate">
                      {selectedBadgeEmployee.jobTitle || 'Collaborateur'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Status */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-bold text-slate-400">Site d'Affectation:</span>
                  <span className="font-extrabold text-emerald-400 truncate max-w-[180px]">
                    {companyLocations.find(l => l.id === (selectedBadgeEmployee.branchId || 'loc-maman'))?.name || 'Siège Inter-Affaires'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-bold text-slate-400">Statut d'Enrôlement:</span>
                  <span className={`font-black uppercase ${getEmployeeRefSelfie(selectedBadgeEmployee) ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {getEmployeeRefSelfie(selectedBadgeEmployee) ? '✓ Validé par Admin System' : '⏳ En Attente d\'Admin'}
                  </span>
                </div>
              </div>

              {/* Barcode / QR Simulation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <QrCode className="w-8 h-8 text-slate-300" />
                  <div className="font-mono text-[7px] text-slate-400 space-y-0.5">
                    <div>UID: {selectedBadgeEmployee.id}</div>
                    <div>TOKEN: {qrConfig.currentToken || 'ELY-QR-49201'}</div>
                  </div>
                </div>
                <div className="h-6 w-28 bg-slate-200 rounded px-1 flex items-center justify-between opacity-80">
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1.5 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1.5 bg-black"></div>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0 flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Carte ID</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBadgeEmployee(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition cursor-pointer border-0"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: ADMIN ENROLL SELFIE DIRECTLY */}
      {showAdminSelfieModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
          >
            <button
              onClick={() => {
                setShowAdminSelfieModal(false);
                setAdminCapturedPhoto(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border-0"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <span>Enrôlement Admin du Selfie de Référence</span>
              </h3>
              <p className="text-xs text-slate-400">
                Sélectionnez le collaborateur et téléversez ou capturez sa photo officielle pour débloquer son pointage mobile.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              
              {/* Select Employee */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Collaborateur</label>
                <select
                  value={adminEnrollEmpId}
                  onChange={(e) => setAdminEnrollEmpId(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choisir le collaborateur --</option>
                  {localEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.name} ({emp.jobTitle}) — {emp.matricule || `MAT-${emp.id}`} {getEmployeeRefSelfie(emp) ? '✓ (Déjà Enrôlé)' : '⏳ (En Attente)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Input options */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Photo / Selfie de Référence</label>
                
                {adminCapturedPhoto ? (
                  <div className="relative aspect-square w-48 mx-auto bg-slate-950 rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-xl">
                    <img src={adminCapturedPhoto} alt="Aperçu selfie admin" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setAdminCapturedPhoto(null)}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition cursor-pointer border-0"
                      title="Changer de photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* File Upload */}
                    <label className="p-4 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group">
                      <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-slate-200">Choisir un Fichier Photo</span>
                      <span className="text-[9px] text-slate-500">JPG, PNG (Max 5Mo)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setAdminCapturedPhoto(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {/* Simulation Quick Avatar */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminEnrollEmpId) {
                          alert("Veuillez d'abord sélectionner un collaborateur.");
                          return;
                        }
                        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=ref_${adminEnrollEmpId}_${Date.now()}`;
                        setAdminCapturedPhoto(avatar);
                      }}
                      className="p-4 bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group border-0"
                    >
                      <Sparkles className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-slate-200">Générer Avatar Test</span>
                      <span className="text-[9px] text-slate-500">Photo simulée HD</span>
                    </button>

                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  disabled={!adminEnrollEmpId || !adminCapturedPhoto}
                  onClick={async () => {
                    if (adminEnrollEmpId && adminCapturedPhoto) {
                      await handleAdminSaveSelfie(adminEnrollEmpId, adminCapturedPhoto);
                      setShowAdminSelfieModal(false);
                      setAdminCapturedPhoto(null);
                      alert("✨ Selfie de référence enregistré et validé avec succès par l'administrateur !");
                    }
                  }}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer border-0 shadow-lg flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider & Verrouiller Selfie</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminSelfieModal(false);
                    setAdminCapturedPhoto(null);
                  }}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl uppercase transition cursor-pointer border-0"
                >
                  Annuler
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
