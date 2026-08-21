import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, Award, TrendingUp, Users, CheckCircle2, AlertCircle, Clock, 
  DollarSign, FileText, Plus, Trash2, RefreshCw, Send, ShieldCheck, 
  Sparkles, Check, ChevronRight, BarChart3, Lock, Unlock, Building2, Truck, Calculator,
  Settings, Sliders, Info, ShieldAlert, UserCheck, Key, Smartphone, Printer, Search
} from 'lucide-react';
import { PerformanceContract, KPIItem, Employee, Invoice, DeliveryTour, Payslip, TripartiteWeightingConfig } from '../types';
import { MPOContractTemplate } from './MPOContractTemplate';
import { 
  recalculateContractMetrics, 
  savePerformanceContract, 
  deletePerformanceContract, 
  injectPrimeIntoPayroll,
  computeTripartiteBreakdown,
  DEFAULT_TRIPARTITE_CONFIG,
  getTenantMpoManagers,
  generateTenantDemoPerformanceContracts,
  MPOManager
} from '../services/performanceContractService';

interface PerformanceManagerProps {
  tenantId?: string;
  isTrial?: boolean;
  employees: Employee[];
  invoices?: Invoice[];
  deliveryTours?: DeliveryTour[];
  payslips: Payslip[];
  onUpdatePayslips: (payslips: Payslip[]) => void;
  currentUser?: { email?: string; name?: string; role?: string; department?: string; structure?: string; companyName?: string; id?: string } | null;
  performanceContracts: PerformanceContract[];
  onUpdateContracts: (contracts: PerformanceContract[]) => void;
}

export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  tenantId = 'MD',
  isTrial = false,
  employees = [],
  invoices = [],
  deliveryTours = [],
  payslips = [],
  onUpdatePayslips,
  currentUser,
  performanceContracts = [],
  onUpdateContracts
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'payroll'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [viewingContractForPrint, setViewingContractForPrint] = useState<PerformanceContract | null>(null);

  // Helper to trigger window.print with @media print CSS for MPO Contract A4
  const handlePrintMPOContract = (elementId: string, employeeName?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up dans votre navigateur pour imprimer le contrat MPO.");
      return;
    }
    const tpl = document.getElementById(elementId);
    if (!tpl) {
      alert("Impossible d'accéder au document de contrat à imprimer.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrat de Performance & Objectifs (MPO) - ${employeeName || 'Elyssa ERP'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;800&display=swap');
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              background-color: white !important; 
              color: #0f172a !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              margin: 0;
              padding: 20px;
            }
            @page {
              size: A4 portrait;
              margin: 0.5cm 0.8cm;
            }
            .mpo-contract-print-sheet {
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 auto !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${tpl.outerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Manager Authentication & Security PIN State
  const availableManagers = useMemo(() => {
    return getTenantMpoManagers(tenantId, currentUser, employees);
  }, [tenantId, currentUser, employees]);

  const [activeManager, setActiveManager] = useState<MPOManager | null>(() => availableManagers[0] || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>(availableManagers[0]?.id || 'MGR-ACTIVE-USER');
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Sync active manager with available managers list on profile/tenant update
  useEffect(() => {
    if (availableManagers.length > 0) {
      setActiveManager(prev => {
        if (!prev) return availableManagers[0];
        const match = availableManagers.find(m => m.id === prev.id || m.name === prev.name);
        return match || availableManagers[0];
      });
      setSelectedManagerId(prev => {
        const match = availableManagers.find(m => m.id === prev);
        return match ? prev : availableManagers[0].id;
      });
    }
  }, [availableManagers]);

  // Automatic Seed in Trial Mode or healing missing poles
  useEffect(() => {
    if (isTrial && (!performanceContracts || performanceContracts.length === 0)) {
      const managerName = activeManager?.name || currentUser?.name || (tenantId === 'MD' ? 'Meriam Doudou' : 'Direction Générale');
      const demoContracts = generateTenantDemoPerformanceContracts(tenantId, employees, managerName);
      demoContracts.forEach(c => savePerformanceContract(tenantId, c));
      onUpdateContracts(demoContracts);
    } else if (performanceContracts && performanceContracts.length > 0) {
      let needsHeal = false;
      const healed = performanceContracts.map(c => {
        let assignedPole = c.pole;
        let assignedDept = c.department;
        const nameLower = (c.employee_name || '').toLowerCase();
        
        if (!assignedPole || assignedPole === 'Finance & Comptabilité' || assignedPole === 'Ressources Humaines' || assignedPole === 'Ventes & Commercial Terrain' || assignedPole === 'Logistique & Expéditions') {
          if (nameLower.includes('khaled') || nameLower.includes('amor') || nameLower.includes('ines') || nameLower.includes('dridi')) {
            assignedPole = 'Finance';
            assignedDept = 'Finance';
            needsHeal = true;
          } else if (nameLower.includes('amel') || nameLower.includes('soltane')) {
            assignedPole = 'RH';
            assignedDept = 'RH';
            needsHeal = true;
          } else if (nameLower.includes('gharbi') || nameLower.includes('cherif') || nameLower.includes('mohamed')) {
            assignedPole = 'Ventes';
            assignedDept = 'Ventes';
            needsHeal = true;
          } else if (nameLower.includes('mansour') || nameLower.includes('sami')) {
            assignedPole = 'Direction & IT';
            assignedDept = 'Direction & IT';
            needsHeal = true;
          } else if (nameLower.includes('salem') || nameLower.includes('hamza') || nameLower.includes('trad')) {
            assignedPole = 'Logistique';
            assignedDept = 'Logistique';
            needsHeal = true;
          } else if (!assignedPole) {
            assignedPole = assignedDept || 'Direction & IT';
            needsHeal = true;
          }
        }
        return {
          ...c,
          pole: assignedPole,
          department: assignedDept
        };
      });

      if (needsHeal) {
        onUpdateContracts(healed);
      }
    }
  }, [isTrial, tenantId, employees, activeManager, currentUser, performanceContracts, onUpdateContracts]);

  // Tripartite Weighting Settings State
  const [tripartiteConfig, setTripartiteConfig] = useState<TripartiteWeightingConfig>({
    weight_entreprise: 70,
    weight_direction: 20,
    weight_personnel: 10,
    company_achievement_rate: 90.0
  });

  // MPO Table Search query
  const [searchMpoQuery, setSearchMpoQuery] = useState<string>('');

  // Department Achievement Rates
  const [deptRates, setDeptRates] = useState<{ [key: string]: number }>({
    'Finance': 95.0,
    'RH': 98.0,
    'Ventes': 93.6,
    'Logistique': 91.0,
    'Direction & IT': 99.0,
    'Achats': 90.0,
    'Magasin': 92.0,
    'Finance & Comptabilité': 95.0,
    'Ressources Humaines': 98.0,
    'Achats & Production': 90.0,
    'Ventes & Commercial Terrain': 93.6,
    'Logistique & Expéditions': 91.0,
    'Magasin & Showroom POS': 92.0
  });

  // Form states for creating / editing contract
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formPeriod, setFormPeriod] = useState<'mensuel' | 'trimestriel' | 'annuel'>('mensuel');
  const [formYear, setFormYear] = useState<number>(2026);
  const [formMonth, setFormMonth] = useState<number>(8);
  const [formPrimeTarget, setFormPrimeTarget] = useState<number>(450);
  const [formKpis, setFormKpis] = useState<KPIItem[]>([
    {
      id: 'kpi-1',
      title: "Chiffre d'Affaires Ventes (TND)",
      weight_percent: 70,
      target_value: 25000,
      current_value: 24850,
      unit: 'TND',
      data_source: 'auto_pos_sales'
    },
    {
      id: 'kpi-2',
      title: 'Prospection Nouveaux Clients',
      weight_percent: 30,
      target_value: 10,
      current_value: 8,
      unit: 'Clients',
      data_source: 'manual_manager'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Manager Authentication by PIN
  const handleAuthenticateManager = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mgr = availableManagers.find(m => m.id === selectedManagerId);
    if (!mgr) {
      setPinError('Veuillez sélectionner un responsable.');
      return;
    }
    if (inputPin.trim() === mgr.pin_code) {
      setActiveManager(mgr);
      setIsAuthModalOpen(false);
      setInputPin('');
      setPinError(null);
      showToast(`🔓 Session déverrouillée : Manager Actif ${mgr.name} (${mgr.role}) !`);
    } else {
      setPinError(`❌ Code PIN incorrect pour ${mgr.name}. Veuillez vérifier votre code à 6 chiffres.`);
    }
  };

  const handleLockSession = () => {
    setIsAuthModalOpen(true);
    setInputPin('');
    setPinError(null);
    showToast('🔒 Session responsable verrouillée avec succès.');
  };

  // Active Scope derived from connected Manager
  const activeScope = useMemo(() => {
    if (!activeManager) return 'NONE';
    if (activeManager.is_super_admin || activeManager.department === 'Direction Générale' || activeManager.department === 'Ressources Humaines') {
      return 'ALL'; // Super Admin / DG / RH General Access
    }
    return activeManager.department;
  }, [activeManager]);

  // Dynamically extract departments and poles from RH repository & contracts
  const dynamicDepartments = useMemo(() => {
    const deptsFromStorage: string[] = [];
    try {
      const raw = localStorage.getItem(`carthage_${tenantId}_departments`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((d: any) => {
            const name = typeof d === 'string' ? d : d?.name || d?.label;
            if (name && typeof name === 'string' && name.trim()) {
              deptsFromStorage.push(name.trim());
            }
          });
        }
      }
    } catch (e) {
      console.error('Error reading tenant departments:', e);
    }

    // Extract from contracts (both pole and department)
    const fromContracts: string[] = [];
    (performanceContracts || []).forEach(c => {
      if (c.pole && c.pole.trim()) fromContracts.push(c.pole.trim());
      if (c.department && c.department.trim()) fromContracts.push(c.department.trim());
    });

    // Extract from employees
    const fromEmployees: string[] = [];
    (employees || []).forEach(e => {
      const empPole = (e as any).pole;
      if (empPole && typeof empPole === 'string' && empPole.trim()) fromEmployees.push(empPole.trim());
      if (e.department && typeof e.department === 'string' && e.department.trim()) fromEmployees.push(e.department.trim());
    });

    // Combine uniquely while keeping clean display
    const set = new Set<string>();
    [...deptsFromStorage, ...fromContracts, ...fromEmployees].forEach(item => {
      if (item && item !== 'ALL' && item !== 'Tous pôles' && item !== 'Direction Générale') {
        set.add(item);
      }
    });

    // Fallback if empty
    if (set.size === 0) {
      return ['Finance', 'RH', 'Ventes', 'Logistique', 'Direction & IT'];
    }

    return Array.from(set);
  }, [tenantId, performanceContracts, employees]);

  // Helper for pole badge visual identity
  const getPoleBadgeStyle = (pole?: string) => {
    const p = (pole || '').toLowerCase();
    if (p.includes('finan')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
    if (p.includes('rh') || p.includes('ressour')) {
      return 'bg-purple-50 text-purple-700 border-purple-300';
    }
    if (p.includes('vent') || p.includes('commer')) {
      return 'bg-sky-50 text-sky-700 border-sky-300';
    }
    if (p.includes('direct') || p.includes('it') || p.includes('tech')) {
      return 'bg-rose-50 text-rose-700 border-rose-300';
    }
    if (p.includes('logis') || p.includes('exped') || p.includes('trans')) {
      return 'bg-amber-50 text-amber-700 border-amber-300';
    }
    if (p.includes('achat') || p.includes('appro')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  // All contracts currently stored
  const allContracts = useMemo(() => {
    return performanceContracts;
  }, [performanceContracts]);

  // Filtered contracts list based on active Manager scope & secondary UI filter
  const activeContractsList = useMemo(() => {
    let list = allContracts;

    // 1. Strict Isolation by Active Manager Scope
    if (activeScope !== 'ALL' && activeScope !== 'NONE') {
      const scopeLower = (activeScope || '').toLowerCase().trim();
      list = list.filter(c => {
        const deptLower = (c.department || '').toLowerCase().trim();
        const poleLower = (c.pole || '').toLowerCase().trim();
        return deptLower === scopeLower || poleLower === scopeLower ||
               deptLower.includes(scopeLower) || scopeLower.includes(deptLower) ||
               poleLower.includes(scopeLower) || scopeLower.includes(poleLower);
      });
    }

    // 2. Secondary UI filter for Super Admin / All scope
    if (activeScope === 'ALL' && filterDepartment !== 'ALL') {
      const filterLower = (filterDepartment || '').toLowerCase().trim();
      list = list.filter(c => {
        const deptLower = (c.department || '').toLowerCase().trim();
        const poleLower = (c.pole || '').toLowerCase().trim();
        return deptLower === filterLower || poleLower === filterLower ||
               deptLower.includes(filterLower) || filterLower.includes(deptLower) ||
               poleLower.includes(filterLower) || filterLower.includes(poleLower);
      });
    }

    // 3. Search Query Filter (multi-column)
    if (searchMpoQuery.trim()) {
      const query = searchMpoQuery.toLowerCase().trim();
      list = list.filter(c => {
        const name = (c.employee_name || '').toLowerCase();
        const role = (c.role || '').toLowerCase();
        const pole = (c.pole || '').toLowerCase();
        const dept = (c.department || '').toLowerCase();
        return name.includes(query) || role.includes(query) || pole.includes(query) || dept.includes(query);
      });
    }

    return list;
  }, [allContracts, activeScope, filterDepartment, searchMpoQuery]);

  // Filtered employees list for contract creation form based on active manager's perimeter
  const allowedEmployeesForForm = useMemo(() => {
    if (activeScope === 'ALL') return employees;
    const scopeLower = (activeScope || '').toLowerCase();
    return employees.filter(e => {
      const deptLower = (e.department || '').toLowerCase();
      return deptLower.includes(scopeLower) || (!!deptLower && scopeLower.includes(deptLower));
    });
  }, [employees, activeScope]);

  // Global KPI summary metrics for active perimeter
  const globalMetrics = useMemo(() => {
    const list = activeContractsList;
    if (list.length === 0) {
      return { avgAchievement: 0, totalTargetPrime: 0, totalCalculatedPrime: 0, totalInjectedPrime: 0, count: 0 };
    }

    const totalAchievementSum = list.reduce((sum, c) => sum + (c.achievement_rate || 0), 0);
    const avgAchievement = Math.round((totalAchievementSum / list.length) * 100) / 100;
    const totalTargetPrime = list.reduce((sum, c) => sum + (c.prime_target_tnd || 0), 0);
    const totalCalculatedPrime = list.reduce((sum, c) => sum + (c.calculated_prime_tnd || 0), 0);
    const totalInjectedPrime = list.filter(c => c.status === 'injecte_paie').reduce((sum, c) => sum + (c.calculated_prime_tnd || 0), 0);

    return {
      avgAchievement,
      totalTargetPrime,
      totalCalculatedPrime,
      totalInjectedPrime,
      count: list.length
    };
  }, [activeContractsList]);

  // Selected Employee object in form
  const selectedEmployeeObj = useMemo(() => {
    return employees.find(e => e.id === formEmployeeId);
  }, [employees, formEmployeeId]);

  // Handle employee selection in form with auto pre-filled KPIs based on role/department
  const handleEmployeeSelect = (empId: string) => {
    setFormEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const deptLower = (emp.department || '').toLowerCase();
      if (deptLower.includes('finan') || deptLower.includes('compta')) {
        setFormPrimeTarget(500);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: 'Délais Clôture Comptable Mensuelle (J+5)',
            weight_percent: 60,
            target_value: 5,
            current_value: 4,
            unit: 'Jours',
            data_source: 'manual_manager'
          },
          {
            id: `kpi-${Date.now()}-2`,
            title: 'Déclarations Fiscales & TEJ sans Pénalités',
            weight_percent: 40,
            target_value: 100,
            current_value: 100,
            unit: '%',
            data_source: 'manual_manager'
          }
        ]);
      } else if (deptLower.includes('rh') || deptLower.includes('paie')) {
        setFormPrimeTarget(350);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: 'Délais Validation Paie & CNSS',
            weight_percent: 60,
            target_value: 3,
            current_value: 2,
            unit: 'Jours',
            data_source: 'manual_manager'
          },
          {
            id: `kpi-${Date.now()}-2`,
            title: 'Zéro Erreur Fiches de Paie',
            weight_percent: 40,
            target_value: 100,
            current_value: 99,
            unit: '%',
            data_source: 'manual_manager'
          }
        ]);
      } else if (deptLower.includes('achat') || deptLower.includes('prod')) {
        setFormPrimeTarget(450);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: 'Optimisation Coûts Achats & RFA (%)',
            weight_percent: 60,
            target_value: 8,
            current_value: 8.5,
            unit: '%',
            data_source: 'manual_manager'
          },
          {
            id: `kpi-${Date.now()}-2`,
            title: 'Conformité Commandes Fournisseurs',
            weight_percent: 40,
            target_value: 98,
            current_value: 97,
            unit: '%',
            data_source: 'manual_manager'
          }
        ]);
      } else if (deptLower.includes('vente') || deptLower.includes('commer')) {
        setFormPrimeTarget(450);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: "Chiffre d'Affaires Ventes (TND)",
            weight_percent: 70,
            target_value: 25000,
            current_value: 24850,
            unit: 'TND',
            data_source: 'auto_pos_sales'
          },
          {
            id: `kpi-${Date.now()}-2`,
            title: 'Nouveaux Clients Prospectés',
            weight_percent: 30,
            target_value: 10,
            current_value: 8,
            unit: 'Clients',
            data_source: 'manual_manager'
          }
        ]);
      } else if (deptLower.includes('logist') || deptLower.includes('exped')) {
        setFormPrimeTarget(300);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: 'Livraisons réussies sans réclamation',
            weight_percent: 80,
            target_value: 30,
            current_value: 27,
            unit: 'Livraisons',
            data_source: 'auto_deliveries'
          },
          {
            id: `kpi-${Date.now()}-2`,
            title: 'Ponctualité Chargement Quai',
            weight_percent: 20,
            target_value: 100,
            current_value: 95,
            unit: '%',
            data_source: 'manual_manager'
          }
        ]);
      } else {
        setFormPrimeTarget(250);
        setFormKpis([
          {
            id: `kpi-${Date.now()}-1`,
            title: 'Objectif de Vente / Encaissement Caisse',
            weight_percent: 100,
            target_value: 15000,
            current_value: 13800,
            unit: 'TND',
            data_source: 'auto_pos_sales'
          }
        ]);
      }
    }
  };

  // Add a new KPI row to form
  const handleAddKpiRow = () => {
    const newKpi: KPIItem = {
      id: `kpi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: "Nouvel Objectif KPI",
      weight_percent: 20,
      target_value: 100,
      current_value: 0,
      unit: 'Unités',
      data_source: 'manual_manager'
    };
    setFormKpis([...formKpis, newKpi]);
  };

  // Remove a KPI row
  const handleRemoveKpiRow = (id: string) => {
    if (formKpis.length <= 1) {
      showToast('⚠️ Le contrat doit comporter au moins 1 objectif KPI.');
      return;
    }
    setFormKpis(formKpis.filter(k => k.id !== id));
  };

  // Live preview calculations for form
  const formPreviewCalculations = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    formKpis.forEach(kpi => {
      const target = kpi.target_value > 0 ? kpi.target_value : 1;
      const rate = kpi.current_value / target;
      const kpiRatePercent = Math.min(rate * 100, 150);
      totalWeightedScore += (kpiRatePercent * (kpi.weight_percent / 100));
      totalWeight += kpi.weight_percent;
    });

    const individualRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 0;
    const empDept = (selectedEmployeeObj as any)?.pole || selectedEmployeeObj?.department || (activeScope !== 'ALL' ? activeScope : 'Finance');

    const tripartite = computeTripartiteBreakdown(
      formPrimeTarget,
      individualRate,
      empDept,
      tripartiteConfig,
      tripartiteConfig.company_achievement_rate,
      deptRates[empDept]
    );

    return {
      totalWeight,
      individualRate,
      tripartite,
      isValidWeight: totalWeight === 100,
      isTripartiteValid: (tripartiteConfig.weight_entreprise + tripartiteConfig.weight_direction + tripartiteConfig.weight_personnel) === 100
    };
  }, [formKpis, formPrimeTarget, selectedEmployeeObj, activeScope, tripartiteConfig, deptRates]);

  // Load Cross-Module Demo Data ("CHARGER DÉMOS")
  const handleLoadDemos = () => {
    const managerName = activeManager?.name || currentUser?.name || (tenantId === 'MD' ? 'Meriam Doudou' : 'Direction Générale');
    const demoContracts = generateTenantDemoPerformanceContracts(tenantId, employees, managerName);
    demoContracts.forEach(c => savePerformanceContract(tenantId, c));
    onUpdateContracts(demoContracts);
    showToast(`⚡ Contrats d'objectifs MPO assignés avec succès aux collaborateurs (${demoContracts.length} contrats) !`);
  };

  // Purge Demo Data ("PURGER")
  const handlePurgeDemos = () => {
    const remaining = performanceContracts.filter(c => !c.is_demo && !c.is_demo_data);
    const deleted = performanceContracts.filter(c => c.is_demo || c.is_demo_data);
    deleted.forEach(c => deletePerformanceContract(tenantId, c.id));
    onUpdateContracts(remaining);
    showToast('🧹 Données démo MPO purgées avec succès !');
  };

  // Request digital signature on Elyssa Pocket mobile app
  const handleRequestPocketSignature = async (contract: PerformanceContract) => {
    const updated: PerformanceContract = {
      ...contract,
      status: 'en_attente_signature',
      updated_at: new Date().toISOString()
    };
    await savePerformanceContract(tenantId, updated);
    onUpdateContracts(allContracts.map(c => c.id === contract.id ? updated : c));
    showToast(`📲 Demande de signature numérique transmise sur l'app mobile Elyssa Pocket pour ${contract.employee_name} !`);
  };

  // Lock contract after signature validation
  const handleSignAndLockContract = async (contract: PerformanceContract) => {
    const updated: PerformanceContract = {
      ...contract,
      status: 'valide_signe',
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await savePerformanceContract(tenantId, updated);
    onUpdateContracts(allContracts.map(c => c.id === contract.id ? updated : c));
    showToast(`🔒 Contrat Cadre Validé & Verrouillé avec succès pour ${contract.employee_name} !`);
  };

  // Apply new Tripartite config
  const handleApplyTripartiteConfig = () => {
    const totalWeights = tripartiteConfig.weight_entreprise + tripartiteConfig.weight_direction + tripartiteConfig.weight_personnel;
    if (totalWeights !== 100) {
      showToast('⚠️ La somme des 3 axes de pondération doit être égale à exactement 100%.');
      return;
    }

    const updatedList = allContracts.map(contract => {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      contract.kpis.forEach(kpi => {
        const target = kpi.target_value > 0 ? kpi.target_value : 1;
        const rate = kpi.current_value / target;
        totalWeightedScore += (Math.min(rate * 100, 150) * (kpi.weight_percent / 100));
        totalWeight += kpi.weight_percent;
      });
      const indRate = totalWeight > 0 ? Math.round(totalWeightedScore * 100) / 100 : 0;

      const deptRate = deptRates[contract.department] ?? 90.0;

      const tripartiteRes = computeTripartiteBreakdown(
        contract.prime_target_tnd,
        indRate,
        contract.department,
        tripartiteConfig,
        tripartiteConfig.company_achievement_rate,
        deptRate
      );

      const updated = {
        ...contract,
        achievement_rate: tripartiteRes.overall_achievement_rate,
        calculated_prime_tnd: tripartiteRes.calculated_prime_tnd,
        tripartite_config: tripartiteRes.tripartite_config,
        tripartite_breakdown: tripartiteRes.tripartite_breakdown,
        updated_at: new Date().toISOString()
      };

      savePerformanceContract(tenantId, updated);
      return updated;
    });

    onUpdateContracts(updatedList);
    showToast(`✅ Pondération Tripartite appliquée (${tripartiteConfig.weight_entreprise}% Ent / ${tripartiteConfig.weight_direction}% Dir / ${tripartiteConfig.weight_personnel}% Ind) !`);
  };

  // Recalculate metrics from real ERP data
  const handleRecalculateAllMetrics = () => {
    const updated = allContracts.map(c => 
      recalculateContractMetrics(c, invoices, deliveryTours, tripartiteConfig)
    );
    onUpdateContracts(updated);
    showToast('🔄 Recalcul automatique des métriques d\'atteinte réelles effectué !');
  };

  // Save contract from form
  const handleSaveContract = async (statusToSet: 'brouillon' | 'en_attente_signature' | 'valide_signe') => {
    if (!formEmployeeId) {
      showToast('⚠️ Veuillez sélectionner un collaborateur.');
      return;
    }
    if (!formPreviewCalculations.isValidWeight) {
      showToast('⚠️ La somme des poids KPI doit être égale à 100%.');
      return;
    }

    const emp = employees.find(e => e.id === formEmployeeId);
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthName = `${monthNames[formMonth - 1]} ${formYear}`;

    const newContract: PerformanceContract = {
      id: `perf-contract-${formEmployeeId}-${Date.now()}`,
      tenantId,
      employee_id: formEmployeeId,
      employee_name: emp ? emp.name : 'Collaborateur',
      department: emp?.department || (emp as any)?.pole || (activeScope !== 'ALL' ? activeScope : 'Finance'),
      pole: (emp as any)?.pole || emp?.department || (activeScope !== 'ALL' ? activeScope : 'Finance'),
      role: emp?.jobTitle || 'Collaborateur Elyssa ERP',
      period: formPeriod,
      year: formYear,
      month: formMonth,
      month_name: monthName,
      prime_target_tnd: formPrimeTarget,
      calculated_prime_tnd: formPreviewCalculations.tripartite.calculated_prime_tnd,
      achievement_rate: formPreviewCalculations.tripartite.overall_achievement_rate,
      tripartite_config: formPreviewCalculations.tripartite.tripartite_config,
      tripartite_breakdown: formPreviewCalculations.tripartite.tripartite_breakdown,
      status: statusToSet,
      ...(statusToSet === 'valide_signe' ? { signed_at: new Date().toISOString() } : {}),
      kpis: formKpis,
      created_at: new Date().toISOString()
    };

    const finalContract = recalculateContractMetrics(newContract, invoices, deliveryTours, tripartiteConfig);

    await savePerformanceContract(tenantId, finalContract);
    const updatedList = [finalContract, ...performanceContracts.filter(c => c.id !== finalContract.id)];
    onUpdateContracts(updatedList);

    if (statusToSet === 'en_attente_signature') {
      showToast(`📲 Demande de signature transmise sur Elyssa Pocket pour ${finalContract.employee_name} !`);
    } else if (statusToSet === 'valide_signe') {
      showToast(`🔒 Contrat cadre validé et verrouillé pour ${finalContract.employee_name} !`);
    } else {
      showToast(`💾 Contrat enregistré en brouillon.`);
    }
    setActiveTab('overview');
  };

  // Inject prime into payroll
  const handleInjectPayroll = (contract: PerformanceContract) => {
    const updatedPayslips = injectPrimeIntoPayroll(contract, payslips);
    onUpdatePayslips(updatedPayslips);

    const updatedContract: PerformanceContract = {
      ...contract,
      status: 'injecte_paie',
      injected_in_payroll_at: new Date().toISOString()
    };

    savePerformanceContract(tenantId, updatedContract);
    onUpdateContracts(allContracts.map(c => c.id === contract.id ? updatedContract : c));

    showToast(`💰 Prime Tripartite de ${contract.calculated_prime_tnd.toFixed(3)} TND transmise directement dans la fiche de paie de ${contract.employee_name} !`);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-rose-500/50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-bold animate-bounce">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🔐 MODAL: AUTHENTIFICATION MANAGER MPO PAR CODE PIN (6 CHIFFRES) */}
      {(isAuthModalOpen || !activeManager) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                <Key className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black font-display tracking-tight text-white pt-2">
                🔐 Authentification Manager MPO
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accès sécurisé par Code PIN RH à 6 chiffres. Sélectionnez votre profil pour déverrouiller votre périmètre de management.
              </p>
            </div>

            <form onSubmit={handleAuthenticateManager} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  1. Sélectionner le Responsable :
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => {
                    setSelectedManagerId(e.target.value);
                    setPinError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-3 text-xs font-extrabold text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {availableManagers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role} - {m.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  2. Code PIN d'Accès (6 Chiffres) :
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={inputPin}
                  onChange={(e) => {
                    setInputPin(e.target.value);
                    setPinError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-amber-400 font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {pinError && (
                <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 rounded-2xl p-3 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider font-mono"
              >
                <Unlock className="w-4 h-4" />
                <span>Déverrouiller la Session Manager</span>
              </button>
            </form>

            {/* Helper PIN guide for quick demo testing */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-[11px] text-slate-300 space-y-2">
              <span className="font-bold text-amber-400 font-mono uppercase block text-[10px] tracking-wider">
                💡 Codes PIN d'Accès Démo :
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10.5px]">
                {availableManagers.slice(0, 6).map(m => (
                  <div key={m.id}>• {m.name.split(' ')[0]} ({m.department.substring(0, 3)}) : <strong className="text-white">{m.pin_code}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MANAGER SESSION HEADER BANNER */}
      {activeManager && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                Session Manager Déverrouillée MPO :
              </span>
              <span className="font-black text-white text-base">
                Manager Actif : <strong className="text-amber-400">{activeManager.name}</strong> ({activeManager.role})
              </span>
              <span className="text-slate-300 font-bold ml-2 font-mono">
                | Structure : <strong className="text-rose-400">{activeManager.department}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase font-mono border ${
              activeScope === 'ALL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {activeScope === 'ALL' ? '🌐 Super Admin / Accès Total Global' : `🔒 Périmètre : ${activeScope}`}
            </span>

            <button
              onClick={handleLockSession}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>🔒 Verrouiller la Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Module Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-rose-400 text-xs font-black uppercase tracking-wider font-mono">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Elyssa ERP • Règle Tripartite (70% Ent / 20% Dir / 10% Ind)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center space-x-3">
              <span>Contrats d'Objectifs & Performance (MPO/OKR)</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Supervision hermétique par périmètre de pôle, signature électronique Elyssa Pocket et injection automatique des primes en paie.
            </p>
          </div>

          {/* Action Buttons: Settings & New Contract */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                showSettingsPanel 
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Pondération Tripartite</span>
            </button>

            <button
              onClick={handleRecalculateAllMetrics}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Recalculer Métriques</span>
            </button>

            <button
              onClick={() => {
                if (allowedEmployeesForForm.length > 0) setFormEmployeeId(allowedEmployeesForForm[0].id);
                setActiveTab('manage');
              }}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Contrat</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tableau de Bord Global</span>
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shrink-0 ${
                activeTab === 'manage'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Contrats Individuels & Fixation</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shrink-0 ${
                activeTab === 'payroll'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Clôture & Injection Paie ({activeContractsList.filter(c => c.status !== 'injecte_paie').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Scope Isolation Notice Bar */}
      {activeScope !== 'ALL' && (
        <div className="bg-amber-950/90 border border-amber-500/50 text-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-xs font-bold shadow-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="text-amber-400 font-black uppercase font-mono tracking-wider block text-[12px]">
              Périmètre de Management Isolé : {activeScope}
            </span>
            <p className="text-amber-100/90 font-medium mt-0.5 text-xs">
              Interface filtrée exclusivement pour les collaborateurs du pôle <strong className="text-amber-300 font-bold">{activeScope}</strong>. Les contrats, indicateurs et statistiques des autres départements sont masqués.
            </p>
          </div>
          <span className="bg-amber-500/30 text-amber-200 border border-amber-400/50 px-3.5 py-1.5 rounded-xl text-[11px] font-black shrink-0 font-mono shadow-md">
            {activeContractsList.length} contrat(s) en périmètre
          </span>
        </div>
      )}

      {/* PANEL CONFIGURATION PONDÉRATION TRIPARTITE */}
      {showSettingsPanel && (
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">
                  ⚙️ Configuration de la Pondération Tripartite des Primes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Définissez la clé de répartition en % (Entreprise / Direction / Personnel) et les taux d'atteinte globaux.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsPanel(false)}
              className="text-slate-400 hover:text-white transition text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Axe 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-rose-400 uppercase font-mono">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Axe 1 : Performance Entreprise</span>
                </span>
                <span>{tripartiteConfig.weight_entreprise}%</span>
              </div>

              <label className="block text-[11px] text-slate-400">Poids sur la Prime Cible (% total) :</label>
              <input
                type="number"
                value={tripartiteConfig.weight_entreprise}
                onChange={(e) => setTripartiteConfig({ ...tripartiteConfig, weight_entreprise: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white font-mono"
              />

              <label className="block text-[11px] text-slate-400 mt-2">Taux d'Atteinte Global Entreprise (%) :</label>
              <input
                type="number"
                step="0.1"
                value={tripartiteConfig.company_achievement_rate}
                onChange={(e) => setTripartiteConfig({ ...tripartiteConfig, company_achievement_rate: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-emerald-400 font-mono"
              />
            </div>

            {/* Axe 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-sky-400 uppercase font-mono">
                <span className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Axe 2 : Performance Direction</span>
                </span>
                <span>{tripartiteConfig.weight_direction}%</span>
              </div>

              <label className="block text-[11px] text-slate-400">Poids sur la Prime Cible (% total) :</label>
              <input
                type="number"
                value={tripartiteConfig.weight_direction}
                onChange={(e) => setTripartiteConfig({ ...tripartiteConfig, weight_direction: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white font-mono"
              />

              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Taux d'Atteinte par Direction :</span>
                <div className="text-[11px] space-y-1 font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Finance & Comptabilité :</span>
                    <span className="text-sky-400 font-bold">{deptRates['Finance & Comptabilité']}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ressources Humaines :</span>
                    <span className="text-sky-400 font-bold">{deptRates['Ressources Humaines']}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commercial :</span>
                    <span className="text-sky-400 font-bold">{deptRates['Ventes & Commercial Terrain']}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logistique :</span>
                    <span className="text-sky-400 font-bold">{deptRates['Logistique & Expéditions']}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Axe 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase font-mono">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4" />
                  <span>Axe 3 : Performance Individuelle</span>
                </span>
                <span>{tripartiteConfig.weight_personnel}%</span>
              </div>

              <label className="block text-[11px] text-slate-400">Poids sur la Prime Cible (% total) :</label>
              <input
                type="number"
                value={tripartiteConfig.weight_personnel}
                onChange={(e) => setTripartiteConfig({ ...tripartiteConfig, weight_personnel: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white font-mono"
              />

              <p className="text-[11px] text-slate-400 pt-3">
                Calculé automatiquement à partir de la grille des KPIs individuels renseignés pour chaque collaborateur.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <span>Somme Totale des Poids :</span>
              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black ${
                (tripartiteConfig.weight_entreprise + tripartiteConfig.weight_direction + tripartiteConfig.weight_personnel) === 100
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {tripartiteConfig.weight_entreprise + tripartiteConfig.weight_direction + tripartiteConfig.weight_personnel}% / 100%
              </span>
            </div>

            <button
              onClick={handleApplyTripartiteConfig}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Appliquer & Recalculer Tous les Contrats</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Atteinte Moyenne</span>
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 font-mono">{globalMetrics.avgAchievement}%</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+4.2% / mois</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Périmètre : {activeScope === 'ALL' ? 'Global Elyssa ERP' : activeScope}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Primes Calculées</span>
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{globalMetrics.totalCalculatedPrime.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-500 font-mono">TND</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Budget cible : {globalMetrics.totalTargetPrime.toFixed(2)} TND</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Contrats Visibles</span>
                <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 font-mono">{globalMetrics.count}</span>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">Actifs</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Filtrés par contrôle d'accès PIN</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Transmis en Paie</span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{globalMetrics.totalInjectedPrime.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-500 font-mono">TND</span>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-2">✓ Transmis sur Bulletin CNSS</p>
            </div>
          </div>

          {/* Active Contracts Compact Datagrid with Toolbar and Tripartite Breakdown */}
          <div className="space-y-4">
            {/* Toolbar: Search, Filters and Counter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher un collaborateur, pôle, rôle..."
                    value={searchMpoQuery}
                    onChange={(e) => setSearchMpoQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                    id="input-mpo-search"
                  />
                </div>

                {activeScope === 'ALL' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <button
                      key="ALL"
                      onClick={() => setFilterDepartment('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
                        filterDepartment === 'ALL'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tous pôles
                    </button>
                    {dynamicDepartments.map(dept => (
                      <button
                        key={dept}
                        onClick={() => setFilterDepartment(dept)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
                          filterDepartment === dept || filterDepartment.toLowerCase() === dept.toLowerCase()
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-mono shrink-0">
                <span className="text-slate-500 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  {activeContractsList.length} contrat(s) affiché(s)
                </span>
              </div>
            </div>

            {/* Compact Datagrid Table (max-height 480px) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display flex items-center space-x-2">
                  <Award className="w-4 h-4 text-rose-500" />
                  <span>Tableau de Suivi des Contrats d'Objectifs MPO/OKR (Périmètre : {activeScope})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  1 ligne = 1 contrat
                </span>
              </div>

              <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs" id="table-mpo-contracts-datagrid">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-600 uppercase text-[9.5px] font-black tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-4">Pôle / Département</th>
                      <th className="py-3 px-4 text-center">Pondération Tripartite (Ent./Dir./Ind.)</th>
                      <th className="py-3 px-4 text-right">Prime Cible (TND)</th>
                      <th className="py-3 px-4 text-center">% Atteinte</th>
                      <th className="py-3 px-4 text-right">Prime Calculée (TND)</th>
                      <th className="py-3 px-4 text-center">Statut Signature</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium">
                    {activeContractsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          Aucun contrat d'objectifs trouvé pour cette recherche ou ce périmètre.
                        </td>
                      </tr>
                    ) : (
                      activeContractsList.map(contract => {
                        const breakdown = contract.tripartite_breakdown || {
                          weight_entreprise: 70,
                          rate_entreprise: 90.0,
                          prime_entreprise: contract.prime_target_tnd * 0.70 * 0.90,
                          weight_direction: 20,
                          rate_direction: 91.0,
                          prime_direction: contract.prime_target_tnd * 0.20 * 0.91,
                          weight_personnel: 10,
                          rate_personnel: contract.achievement_rate,
                          prime_personnel: contract.prime_target_tnd * 0.10 * (contract.achievement_rate / 100),
                          formula_string: `(${contract.prime_target_tnd} TND × 70% × 90%) + (${contract.prime_target_tnd} TND × 20% × 91%) + (${contract.prime_target_tnd} TND × 10% × ${contract.achievement_rate}%)`
                        };

                        const isLocked = contract.status === 'valide_signe' || contract.status === 'evalue' || contract.status === 'injecte_paie';

                        return (
                          <tr key={contract.id} className="hover:bg-rose-50/30 transition-colors">
                            {/* Collaborateur */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-[12px]">{contract.employee_name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{contract.role}</span>
                              </div>
                            </td>

                            {/* Pôle / Département */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase font-mono tracking-tight px-2 py-0.5 rounded-lg border ${getPoleBadgeStyle(contract.pole || contract.department)}`}>
                                {contract.pole || contract.department}
                              </span>
                            </td>

                            {/* Pondération Tripartite */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg">
                                <span className="text-rose-400 font-black" title={`Entreprise : ${breakdown.weight_entreprise}% (${breakdown.rate_entreprise}%)`}>
                                  {breakdown.weight_entreprise}%
                                </span>
                                <span className="text-slate-500">/</span>
                                <span className="text-sky-400 font-black" title={`Direction : ${breakdown.weight_direction}% (${breakdown.rate_direction}%)`}>
                                  {breakdown.weight_direction}%
                                </span>
                                <span className="text-slate-500">/</span>
                                <span className="text-amber-400 font-black" title={`Individuel : ${breakdown.weight_personnel}% (${breakdown.rate_personnel}%)`}>
                                  {breakdown.weight_personnel}%
                                </span>
                              </div>
                            </td>

                            {/* Prime Cible (TND) */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                              {contract.prime_target_tnd.toFixed(2)} <span className="text-[10px] text-slate-400">TND</span>
                            </td>

                            {/* % Atteinte */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                contract.achievement_rate >= 90
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : contract.achievement_rate >= 75
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {contract.achievement_rate}%
                              </span>
                            </td>

                            {/* Prime Calculée (TND) */}
                            <td className="py-3 px-4 text-right font-mono font-black text-amber-600 whitespace-nowrap text-[12px]">
                              {contract.calculated_prime_tnd.toFixed(2)} <span className="text-[10px] text-slate-400">TND</span>
                            </td>

                            {/* Statut Signature */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase border ${
                                contract.status === 'injecte_paie'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                  : contract.status === 'valide_signe'
                                  ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                                  : contract.status === 'en_attente_signature'
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              }`}>
                                {contract.status === 'injecte_paie' ? (
                                  <span>💰 Paie Injectée</span>
                                ) : contract.status === 'valide_signe' ? (
                                  <>
                                    <Lock className="w-2.5 h-2.5 text-sky-400" />
                                    <span>🔒 Validé Cadre</span>
                                  </>
                                ) : contract.status === 'en_attente_signature' ? (
                                  <>
                                    <Smartphone className="w-2.5 h-2.5 text-amber-400" />
                                    <span>📱 Sign. Pocket</span>
                                  </>
                                ) : (
                                  <span>📝 Brouillon</span>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => setViewingContractForPrint(contract)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Imprimer A4"
                                >
                                  <Printer className="w-3.5 h-3.5 text-rose-500" />
                                </button>

                                {contract.status === 'brouillon' && (
                                  <button
                                    onClick={() => handleRequestPocketSignature(contract)}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] transition cursor-pointer"
                                    title="Demander Sign. Pocket"
                                  >
                                    Sign. Pocket
                                  </button>
                                )}

                                {contract.status === 'en_attente_signature' && (
                                  <button
                                    onClick={() => handleSignAndLockContract(contract)}
                                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-lg text-[10px] transition cursor-pointer"
                                    title="Valider & Verrouiller"
                                  >
                                    Valider
                                  </button>
                                )}

                                {contract.status !== 'injecte_paie' ? (
                                  <button
                                    onClick={() => handleInjectPayroll(contract)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] transition cursor-pointer shadow-xs"
                                    title="Transmettre Paie"
                                  >
                                    + Paie
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-black">✓ Transmis</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACT CREATION & FORM */}
      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Area */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Formulaire de Fixation des Objectifs MPO / OKR</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Générez le contrat d'objectifs pour le collaborateur (restreint à votre périmètre de management).
              </p>
            </div>

            {/* Employee Selector & Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Collaborateur RH (Périmètre : {activeScope}) :
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Sélectionner un agent RH --</option>
                  {allowedEmployeesForForm.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.jobTitle} - {e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Période d'Évaluation :
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formPeriod}
                    onChange={(e: any) => setFormPeriod(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 flex-1"
                  >
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="annuel">Annuel</option>
                  </select>

                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 w-28"
                  >
                    <option value={1}>Janvier</option>
                    <option value={2}>Février</option>
                    <option value={3}>Mars</option>
                    <option value={4}>Avril</option>
                    <option value={5}>Mai</option>
                    <option value={6}>Juin</option>
                    <option value={7}>Juillet</option>
                    <option value={8}>Août</option>
                    <option value={9}>Septembre</option>
                    <option value={10}>Octobre</option>
                    <option value={11}>Novembre</option>
                    <option value={12}>Décembre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Prime Amount */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-rose-900 uppercase tracking-wider block">
                  Montant de la Prime Cible (100% Atteinte) :
                </span>
                <p className="text-xs text-rose-700">
                  Prévue pour être versée à l'atteinte exacte des 3 axes de performance.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={formPrimeTarget}
                  onChange={(e) => setFormPrimeTarget(Number(e.target.value))}
                  className="w-32 bg-white border border-rose-300 rounded-xl px-3 py-2 text-base font-black text-rose-900 text-right font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <span className="font-black text-rose-900 text-xs font-mono">TND</span>
              </div>
            </div>

            {/* KPI List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-900 font-display">
                  Grille des Indicateurs d'Objectifs Individuels (Axe Personnel)
                </h4>

                <button
                  onClick={handleAddKpiRow}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter KPI</span>
                </button>
              </div>

              {/* Weight warning bar */}
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
                formPreviewCalculations.isValidWeight 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span>Poids Total des KPIs Individuels : {formPreviewCalculations.totalWeight}% / 100%</span>
                {!formPreviewCalculations.isValidWeight && (
                  <span className="text-[11px] font-normal">⚠️ Ajustez les poids pour atteindre exactement 100%.</span>
                )}
              </div>

              {/* KPI Rows */}
              <div className="space-y-3">
                {formKpis.map((kpi, idx) => (
                  <div key={kpi.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-rose-600 font-mono uppercase">
                        Objectif Individuel #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveKpiRow(kpi.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Supprimer cet objectif"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Intitulé de l'objectif :
                        </label>
                        <input
                          type="text"
                          value={kpi.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormKpis(formKpis.map(k => k.id === kpi.id ? { ...k, title: val } : k));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Source de Données Auto :
                        </label>
                        <select
                          value={kpi.data_source}
                          onChange={(e: any) => {
                            const ds = e.target.value;
                            setFormKpis(formKpis.map(k => k.id === kpi.id ? { ...k, data_source: ds } : k));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                        >
                          <option value="auto_pos_sales">🛒 Auto Ventes POS / Factures</option>
                          <option value="auto_deliveries">🚚 Auto Livraisons Terrain</option>
                          <option value="auto_picking">📦 Auto Bons de Préparation Quai</option>
                          <option value="manual_manager">✍️ Saisie Manager (Qualitatif)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Poids (%) :
                        </label>
                        <input
                          type="number"
                          value={kpi.weight_percent}
                          onChange={(e) => {
                            const w = Number(e.target.value);
                            setFormKpis(formKpis.map(k => k.id === kpi.id ? { ...k, weight_percent: w } : k));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Cible :
                          </label>
                          <input
                            type="number"
                            value={kpi.target_value}
                            onChange={(e) => {
                              const tv = Number(e.target.value);
                              setFormKpis(formKpis.map(k => k.id === kpi.id ? { ...k, target_value: tv } : k));
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Unité :
                          </label>
                          <input
                            type="text"
                            value={kpi.unit || ''}
                            onChange={(e) => {
                              const u = e.target.value;
                              setFormKpis(formKpis.map(k => k.id === kpi.id ? { ...k, unit: u } : k));
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                            placeholder="TND / Livr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleSaveContract('brouillon')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-4 py-2.5 rounded-2xl text-xs transition cursor-pointer"
              >
                💾 Enregistrer en Brouillon
              </button>

              <button
                onClick={() => handleSaveContract('en_attente_signature')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <span>Envoyer Sign. Pocket Mobile</span>
              </button>

              <button
                onClick={() => handleSaveContract('valide_signe')}
                className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider & Verrouiller Contrat</span>
              </button>
            </div>
          </div>

          {/* Real-time A4 Contract Sheet Live Preview & Simulation */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-black uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Aperçu A4 Temps Réel — Contrat MPO</span>
                </div>
                <button
                  onClick={() => handlePrintMPOContract('mpo-contract-document', selectedEmployeeObj?.name)}
                  type="button"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>🖨️ Imprimer A4</span>
                </button>
              </div>

              {/* Embedded A4 Contract Template Card */}
              <div className="bg-slate-950 p-2 sm:p-4 rounded-2xl border border-slate-800 max-h-[600px] overflow-y-auto">
                <MPOContractTemplate
                  id="mpo-contract-document"
                  tenantName={tenantId === 'MD' || tenantId?.toLowerCase().includes('md') ? 'MD DISTRIB S.A.' : (currentUser?.companyName || 'SOCIÉTÉ TUNISIENNE ELYSSA S.A.')}
                  employeeName={selectedEmployeeObj ? selectedEmployeeObj.name : ''}
                  employeePost={selectedEmployeeObj?.jobTitle || 'Collaborateur / Agent'}
                  department={(selectedEmployeeObj as any)?.pole || selectedEmployeeObj?.department || (activeScope !== 'ALL' ? activeScope : 'Finance')}
                  period={formPeriod}
                  year={formYear}
                  monthName={`${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][formMonth - 1]} ${formYear}`}
                  primeTargetTnd={formPrimeTarget}
                  calculatedPrimeTnd={formPreviewCalculations.tripartite.calculated_prime_tnd}
                  achievementRate={formPreviewCalculations.tripartite.overall_achievement_rate}
                  tripartiteConfig={formPreviewCalculations.tripartite.tripartite_config}
                  tripartiteBreakdown={formPreviewCalculations.tripartite.tripartite_breakdown}
                  kpis={formKpis}
                  managerName={activeManager?.name || currentUser?.name || (tenantId === 'MD' || tenantId?.toLowerCase().includes('md') ? 'Meriam Doudou' : 'Direction Générale')}
                  managerRole={activeManager?.role || (currentUser?.role === 'SuperAdmin' ? 'Directeur Général / Super Admin' : (currentUser?.role || 'Directeur Général'))}
                  showPrintActions={true}
                  onPrint={() => handlePrintMPOContract('mpo-contract-document', selectedEmployeeObj?.name)}
                />
              </div>

              {/* Simulation Breakdown Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Décomposition des 3 Axes de Performance :
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">1. Entreprise ({tripartiteConfig.weight_entreprise}%) :</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {formPreviewCalculations.tripartite.tripartite_breakdown.prime_entreprise.toFixed(2)} TND
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">2. Direction ({tripartiteConfig.weight_direction}%) :</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {formPreviewCalculations.tripartite.tripartite_breakdown.prime_direction.toFixed(2)} TND
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">3. Personnel ({tripartiteConfig.weight_personnel}%) :</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {formPreviewCalculations.tripartite.tripartite_breakdown.prime_personnel.toFixed(2)} TND
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-extrabold">Prime Tripartite Totale :</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {formPreviewCalculations.tripartite.calculated_prime_tnd.toFixed(2)} TND
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL INJECTION */}
      {activeTab === 'payroll' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Clôture & Injection Directe en Paie (CNSS / IRPP)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Validez les primes tripartites d'atteinte et transmettez-les directement dans le module Gestion Paie & RH.
              </p>
            </div>
          </div>

          {/* Table of Contracts Ready for Payroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase font-mono">
                  <th className="p-3.5">Collaborateur</th>
                  <th className="p-3.5">Pôle / Poste</th>
                  <th className="p-3.5">Période</th>
                  <th className="p-3.5 text-right">Prime Cible</th>
                  <th className="p-3.5 text-center">Atteinte Tripartite</th>
                  <th className="p-3.5 text-right">Prime Finale TND</th>
                  <th className="p-3.5 text-center">Statut Paie</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeContractsList.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <span className="font-black text-slate-900">{contract.employee_name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{contract.employee_id}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded border mb-0.5 ${getPoleBadgeStyle(contract.pole || contract.department)}`}>
                        {contract.pole || contract.department}
                      </span>
                      <span className="block text-[10px] text-slate-500">{contract.role}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {contract.month_name || `${contract.month}/${contract.year}`}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {contract.prime_target_tnd.toFixed(2)} TND
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-lg font-black text-[11px] ${
                        contract.achievement_rate >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {contract.achievement_rate}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      {contract.calculated_prime_tnd.toFixed(2)} TND
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border inline-flex items-center space-x-1 ${
                        contract.status === 'injecte_paie'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {contract.status === 'injecte_paie' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Injecté Paie</span>
                          </>
                        ) : (
                          <span>⏳ En Attente Paie</span>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {contract.status === 'injecte_paie' ? (
                        <span className="text-[11px] text-emerald-600 font-bold">✓ Transmis</span>
                      ) : (
                        <button
                          onClick={() => handleInjectPayroll(contract)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition flex items-center space-x-1 mx-auto cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Transmettre la Prime</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A4 PRINT & PREVIEW MODAL FOR SELECTED CONTRACT */}
      {viewingContractForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full text-white space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-black font-display text-white">
                  Aperçu Officiel A4 — Contrat MPO ({viewingContractForPrint.employee_name})
                </h3>
              </div>
              <button
                onClick={() => setViewingContractForPrint(null)}
                className="text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold transition cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl flex justify-center border border-slate-800">
              <MPOContractTemplate
                id={`mpo-contract-${viewingContractForPrint.id}`}
                tenantName={tenantId === 'MD' || tenantId?.toLowerCase().includes('md') ? 'MD DISTRIB S.A.' : (currentUser?.companyName || 'SOCIÉTÉ TUNISIENNE ELYSSA S.A.')}
                employeeName={viewingContractForPrint.employee_name}
                employeePost={viewingContractForPrint.role}
                department={viewingContractForPrint.pole || viewingContractForPrint.department}
                period={viewingContractForPrint.period}
                year={viewingContractForPrint.year}
                monthName={viewingContractForPrint.month_name}
                primeTargetTnd={viewingContractForPrint.prime_target_tnd}
                calculatedPrimeTnd={viewingContractForPrint.calculated_prime_tnd}
                achievementRate={viewingContractForPrint.achievement_rate}
                tripartiteConfig={viewingContractForPrint.tripartite_config}
                tripartiteBreakdown={viewingContractForPrint.tripartite_breakdown}
                kpis={viewingContractForPrint.kpis}
                status={viewingContractForPrint.status}
                signedAt={viewingContractForPrint.signed_at}
                managerName={activeManager?.name || currentUser?.name || (tenantId === 'MD' || tenantId?.toLowerCase().includes('md') ? 'Meriam Doudou' : 'Direction Générale')}
                managerRole={activeManager?.role || (currentUser?.role === 'SuperAdmin' ? 'Directeur Général / Super Admin' : (currentUser?.role || 'Directeur Général'))}
                showPrintActions={true}
                onPrint={() => handlePrintMPOContract(`mpo-contract-${viewingContractForPrint.id}`, viewingContractForPrint.employee_name)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceManager;
