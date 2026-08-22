import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, MissionOrder, FleetExpense, IncidentRecord, Employee } from '../types';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useTenant } from '../context/TenantContext';
import { 
  Car, 
  MapPin, 
  Receipt, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  Printer, 
  Info,
  Sliders,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const DEMO_VEHICLES: Vehicle[] = [
  { 
    id: 'demo-v_1', 
    brand: 'Peugeot', 
    model: 'Partner', 
    registrationNumber: '228 TN 4091', 
    purchaseDate: '2024-03-12', 
    purchasePrice: 62000.000, 
    status: 'Active', 
    assignedToEmployeeId: 'demo-emp_6', 
    assignedEmployeeName: 'Hamza Ben Salem',
    is_demo: true
  },
  { 
    id: 'demo-v_2', 
    brand: 'Isuzu', 
    model: 'D-Max', 
    registrationNumber: '240 TN 8812', 
    purchaseDate: '2024-02-10', 
    purchasePrice: 72000.000, 
    status: 'Active', 
    assignedToEmployeeId: 'demo-emp_6', 
    assignedEmployeeName: 'Hamza Ben Salem',
    is_demo: true
  },
  { 
    id: 'demo-v_3', 
    brand: 'Citroën', 
    model: 'C-Élysée', 
    registrationNumber: '215 TN 9811', 
    purchaseDate: '2023-01-15', 
    purchasePrice: 48000.000, 
    status: 'Active', 
    assignedToEmployeeId: 'demo-emp_3', 
    assignedEmployeeName: 'Mohamed Ali Gharbi',
    is_demo: true
  }
];

export const DEFAULT_DEMO_VEHICLES = DEMO_VEHICLES;

export const DEMO_MISSIONS: MissionOrder[] = [
  { 
    id: 'demo-mo_1', 
    employeeId: 'demo-emp_6', 
    employeeName: 'Hamza Ben Salem', 
    vehicleId: 'demo-v_2', 
    vehicleLabel: 'Isuzu D-Max (240 TN 8812)', 
    transportType: 'CompanyCar',
    destination: 'Tunis / Sfax', 
    purpose: 'Livraison Client Poulina - Tunis/Sfax', 
    departureDateTime: '2026-08-10T07:30', 
    returnDateTime: '2026-08-10T19:00', 
    status: 'Approved',
    allowancesGranted: 60.000,
    is_demo: true,
    expenses: [
      { id: 'demo-me_mo1_1', category: 'Food', description: 'Repas et frais déplacement livraison Poulina', amount: 35.000, invoiceNumber: 'RE_SFAX_88', date: '2026-08-10' }
    ]
  },
  { 
    id: 'demo-mo_2', 
    employeeId: 'demo-emp_3', 
    employeeName: 'Mohamed Ali Gharbi', 
    vehicleId: 'demo-v_3', 
    vehicleLabel: 'Citroën C-Élysée (215 TN 9811)', 
    transportType: 'CompanyCar',
    destination: 'Sousse', 
    purpose: 'Prospection Sousse', 
    departureDateTime: '2026-08-10T08:00', 
    returnDateTime: '2026-08-10T18:00', 
    status: 'Approved',
    allowancesGranted: 50.000,
    is_demo: true,
    expenses: [
      { id: 'demo-me_mo2_1', category: 'Food', description: 'Déjeuner client prospection commerciale Sousse', amount: 30.000, invoiceNumber: 'RE_SOUSSE_12', date: '2026-08-10' }
    ]
  }
];

export const DEFAULT_DEMO_MISSIONS = DEMO_MISSIONS;

export const DEMO_EXPENSES: FleetExpense[] = [
  { id: 'demo-exp_1', date: '2026-08-01', vehicleId: 'demo-v_2', vehicleLabel: 'Isuzu D-Max (240 TN 8812)', category: 'GasolineBonus', amount: 450.000, invoiceNb: 'BON_TOT_450', providerName: 'TotalEnergies', description: 'Carburant TotalEnergies - Tournée livraison Sud' },
  { id: 'demo-exp_2', date: '2026-08-03', vehicleId: 'demo-v_1', vehicleLabel: 'Peugeot Partner (228 TN 4091)', category: 'MechanicLabor', amount: 280.000, invoiceNb: 'FACT_VID_280', providerName: 'Atelier Central Service', description: 'Entretien vidange complète et remplacement filtres' },
  { id: 'demo-exp_3', date: '2026-08-05', vehicleId: 'demo-v_3', vehicleLabel: 'Citroën C-Élysée (215 TN 9811)', category: 'Insurance', amount: 650.000, invoiceNb: 'VIG_ASSUR_650', providerName: 'Assurances STAR / Recette Finances', description: 'Vignette fiscale & Assurance flotte annuelle' }
];

export const DEFAULT_DEMO_EXPENSES = DEMO_EXPENSES;

const DEMO_INCIDENTS: IncidentRecord[] = [];

export default function FleetManager({ 
  isSimulationActive = false,
  vehicles: propVehicles,
  onUpdateVehicles,
  missions: propMissions,
  onUpdateMissions,
  expenses: propExpenses,
  onUpdateExpenses,
  incidents: propIncidents,
  onUpdateIncidents,
  employees: propEmployees,
  activeTenantId,
  tenantId,
  isDemoCompany = false
}: { 
  isSimulationActive?: boolean;
  vehicles?: Vehicle[];
  onUpdateVehicles?: (v: Vehicle[]) => void;
  missions?: MissionOrder[];
  onUpdateMissions?: (m: MissionOrder[]) => void;
  expenses?: FleetExpense[];
  onUpdateExpenses?: (e: any[]) => void;
  incidents?: IncidentRecord[];
  onUpdateIncidents?: (i: any[]) => void;
  employees?: Employee[];
  activeTenantId?: string;
  tenantId?: string;
  isDemoCompany?: boolean;
}) {
  let contextTenantId = 'Inter-Affaires';
  try {
    const tenantCtx = useTenant();
    if (tenantCtx?.currentTenant?.id) {
      contextTenantId = tenantCtx.currentTenant.id;
    }
  } catch (_) {
    // fallback if outside context
  }
  const effectiveTenant = activeTenantId || tenantId || contextTenantId || 'Inter-Affaires';

  const isDemoTenant = useMemo(() => {
    if (isDemoCompany) return true;
    const tid = String(effectiveTenant || localStorage.getItem('carthage_active_company') || '').toLowerCase().trim();
    if (tid.includes('parent') || tid.includes('prod') || tid === 'inter-affaires' || tid === 'company_parent' || tid === 'elyssa entreprises s.a.') {
      return false;
    }
    return tid === 'inter-affaires-demo' || tid === 'demo' || tid === 'company_demo' || tid.includes('démo') || tid.includes('demo') || tid.includes('sandbox');
  }, [effectiveTenant, isDemoCompany]);

  const SkeletonLoader = () => (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
      <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  );

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Artificial delay to prevent hydration mismatch/flickering when loading async or mock data
    const timer = setTimeout(() => setIsHydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Subtabs configuration: 'dashboard' | 'vehicles' | 'missions' | 'expenses' | 'incidents'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'vehicles' | 'missions' | 'expenses' | 'incidents'>('dashboard');

  // Date Filter states for Fleet Dashboard
  const [fleetStartDate, setFleetStartDate] = useState<string>('');
  const [fleetEndDate, setFleetEndDate] = useState<string>('');

  const employees = propEmployees || [];

  // Direct state initialization with STRICT PROD isolation
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(propVehicles) 
        ? propVehicles.filter(v => !v.is_demo && !String(v.id || '').startsWith('demo-')) 
        : [];
    }
    if (Array.isArray(propVehicles) && propVehicles.length > 0) return propVehicles;
    return DEMO_VEHICLES;
  });

  const [missions, setMissions] = useState<MissionOrder[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(propMissions) 
        ? propMissions.filter(m => !m.is_demo && !String(m.id || '').startsWith('demo-')) 
        : [];
    }
    if (Array.isArray(propMissions) && propMissions.length > 0) return propMissions;
    return DEMO_MISSIONS;
  });

  const [expenses, setExpenses] = useState<FleetExpense[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(propExpenses) 
        ? propExpenses.filter(e => !e.is_demo && !String(e.id || '').startsWith('demo-')) 
        : [];
    }
    if (Array.isArray(propExpenses) && propExpenses.length > 0) return propExpenses;
    return DEMO_EXPENSES;
  });

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(propVehicles) 
        ? propVehicles.filter(v => !v.is_demo && !String(v.id || '').startsWith('demo-')) 
        : [];
      setVehicles(sanitized);
    } else if (Array.isArray(propVehicles) && propVehicles.length > 0) {
      setVehicles(propVehicles);
    }
  }, [propVehicles, isDemoTenant]);

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(propMissions) 
        ? propMissions.filter(m => !m.is_demo && !String(m.id || '').startsWith('demo-')) 
        : [];
      setMissions(sanitized);
    } else if (Array.isArray(propMissions) && propMissions.length > 0) {
      setMissions(propMissions);
    }
  }, [propMissions, isDemoTenant]);

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(propExpenses) 
        ? propExpenses.filter(e => !e.is_demo && !String(e.id || '').startsWith('demo-')) 
        : [];
      setExpenses(sanitized);
    } else if (Array.isArray(propExpenses) && propExpenses.length > 0) {
      setExpenses(propExpenses);
    }
  }, [propExpenses, isDemoTenant]);

  const incidents = useMemo(() => {
    const source = propIncidents !== undefined ? propIncidents : DEMO_INCIDENTS;
    return source.filter(i => {
      if (i.tenantId && i.tenantId !== effectiveTenant) return false;
      const isMDDriver = 
        i.driverName?.toLowerCase().includes('hamza') || 
        i.driverName?.toLowerCase().includes('gharbi') || 
        i.employeeId === 'demo-emp_6' || 
        i.employeeId === 'demo-emp_3';

      if (effectiveTenant === 'Inter-Affaires') {
        if (isMDDriver) return false;
      } else if (effectiveTenant === 'MD') {
        if (isMDDriver) return true;
      }
      return true;
    });
  }, [propIncidents, effectiveTenant]);

  const setIncidents = useMemo(() => (newIncidentsOrUpdater: any[] | ((prev: any[]) => any[])) => {
    if (onUpdateIncidents) {
      if (typeof newIncidentsOrUpdater === 'function') {
        onUpdateIncidents(newIncidentsOrUpdater(incidents));
      } else {
        onUpdateIncidents(newIncidentsOrUpdater);
      }
    }
  }, [incidents, onUpdateIncidents]);

  useEffect(() => {
    // Auto-seeding on empty disabled per user directive.
  }, [isSimulationActive, isHydrated]);

  // Add Modals states
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ 
    brand: '', 
    model: '', 
    registrationNumber: '', 
    purchaseDate: '', 
    purchasePrice: 0, 
    status: 'Active' as 'Active' | 'UnderRepair',
    assignedToEmployeeId: ''
  });
  const [sellingVehicleId, setSellingVehicleId] = useState<string | null>(null);
  const [saleDate, setSaleDate] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [newMission, setNewMission] = useState({ 
    employeeId: '', 
    transportType: 'CompanyCar' as 'CompanyCar' | 'Other',
    vehicleId: '', 
    otherTransportLabel: 'Train' as string, // 'Train', 'Louage', 'Avion', 'Taxi', 'Autre'
    destination: '', 
    purpose: '', 
    departureDateTime: '', 
    returnDateTime: '', 
    allowancesGranted: 0,
    status: 'Approved' as any 
  });

  const [expandedMissionExpenseId, setExpandedMissionExpenseId] = useState<string | null>(null);
  const [newMissionExpense, setNewMissionExpense] = useState({
    category: 'Hotel' as 'Hotel' | 'Food' | 'Visa' | 'Flight' | 'Train' | 'Louage' | 'Taxi' | 'Other',
    description: '',
    amount: 0,
    invoiceNumber: '',
    date: ''
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ date: '', vehicleId: '', category: 'GasolineBonus' as any, amount: 0, invoiceNb: '', providerName: '', description: '' });

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({ date: '', vehicleId: '', employeeId: '', description: '', safetyInquiry: '', sanctionsApplied: '', severity: 'Medium' as 'Low' | 'Medium' | 'High', status: 'Reported' as any });

  // Printable selected mission order state
  const [printedMission, setPrintedMission] = useState<MissionOrder | null>(null);

  // Double-secure UI level fallbacks
  const displayVehicles = useMemo(() => vehicles || [], [vehicles]);
  const displayMissions = useMemo(() => missions || [], [missions]);
  const displayExpenses = useMemo(() => expenses || [], [expenses]);
  const displayIncidents = useMemo(() => incidents || [], [incidents]);

  // Filter lists based on the selected date interval for the dashboard
  const dashboardMissions = useMemo(() => {
    return displayMissions.filter(m => {
      const depDate = m.departureDateTime ? m.departureDateTime.slice(0, 10) : '';
      if (fleetStartDate && depDate < fleetStartDate) return false;
      if (fleetEndDate && depDate > fleetEndDate) return false;
      return true;
    });
  }, [displayMissions, fleetStartDate, fleetEndDate]);

  const dashboardExpenses = useMemo(() => {
    return displayExpenses.filter(e => {
      if (fleetStartDate && e.date < fleetStartDate) return false;
      if (fleetEndDate && e.date > fleetEndDate) return false;
      return true;
    });
  }, [displayExpenses, fleetStartDate, fleetEndDate]);

  const dashboardIncidents = useMemo(() => {
    return displayIncidents.filter(i => {
      if (fleetStartDate && i.date < fleetStartDate) return false;
      if (fleetEndDate && i.date > fleetEndDate) return false;
      return true;
    });
  }, [displayIncidents, fleetStartDate, fleetEndDate]);

  // Computed data / analytics for Dashboard view using display variables
  const stats = useMemo(() => {
    const totalVehiclesCount = displayVehicles.length;
    const activeVehiclesCount = displayVehicles.filter(v => v.status === 'Active').length;
    const underRepairDiscount = displayVehicles.filter(v => v.status === 'UnderRepair').length;
    const soldVehiclesCount = displayVehicles.filter(v => v.status === 'Sold').length;

    const totalSpent = dashboardExpenses.reduce((sum, e) => sum + e.amount, 0);

    const activeMissionsCount = dashboardMissions.filter(m => m.status === 'Approved').length;
    const totalMissionsCount = dashboardMissions.length;

    // Mission sub-expenses computation
    const totalMissionSpent = dashboardMissions.reduce((sum, m) => {
      const itemsSum = (m.expenses || []).reduce((acc, item) => acc + item.amount, 0);
      return sum + itemsSum;
    }, 0);

    const activeInquiriesCount = dashboardIncidents.filter(i => i.status === 'UnderInquiry').length;

    // Category chart mapping for fleet expenses
    const expenseCategoriesMap: Record<string, number> = {
      GasolineBonus: 0,
      Insurance: 0,
      Vignette: 0,
      Toll: 0,
      SpareParts: 0,
      MechanicLabor: 0,
      PanelBeaterInvoice: 0,
      Other: 0
    };
    dashboardExpenses.forEach(e => {
      if (expenseCategoriesMap[e.category] !== undefined) {
        expenseCategoriesMap[e.category] += e.amount;
      } else {
        expenseCategoriesMap.Other += e.amount;
      }
    });

    const categoryTranslationMap: Record<string, string> = {
      GasolineBonus: 'Bons Carburant',
      Insurance: 'Assurances',
      Vignette: 'Vignettes (Fiscale)',
      Toll: 'Péages Autoroutiers',
      SpareParts: 'Pièces Rechange',
      MechanicLabor: 'Main d\'œuvre Mécanicien',
      PanelBeaterInvoice: 'Facture Tôlier',
      Other: 'Autres Frais'
    };

    const categoryColorsMap: Record<string, string> = {
      GasolineBonus: '#eab308', // Yellow
      Insurance: '#4f46e5', // Indigo
      Vignette: '#0891b2', // Cyan
      Toll: '#14b8a6', // Teal
      SpareParts: '#ef4444', // Red
      MechanicLabor: '#f97316', // Orange
      PanelBeaterInvoice: '#8b5cf6', // Purple
      Other: '#64748b' // Slate
    };

    const categoryDataChart = Object.keys(expenseCategoriesMap).map(catKey => ({
      name: categoryTranslationMap[catKey] || catKey,
      value: Math.round(expenseCategoriesMap[catKey] * 1000) / 1000,
      color: categoryColorsMap[catKey] || '#ccc'
    })).filter(item => item.value > 0);

    // Categories mapping for mission travel expenses
    const missionCategoriesMap: Record<string, number> = {
      Hotel: 0,
      Food: 0,
      Visa: 0,
      Flight: 0,
      Train: 0,
      Louage: 0,
      Taxi: 0,
      Other: 0
    };

    dashboardMissions.forEach(m => {
      (m.expenses || []).forEach(item => {
        if (missionCategoriesMap[item.category] !== undefined) {
          missionCategoriesMap[item.category] += item.amount;
        } else {
          missionCategoriesMap.Other += item.amount;
        }
      });
    });

    const missionCategoryTranslationMap: Record<string, string> = {
      Hotel: 'Hébergements (Hôtels)',
      Food: 'Nourriture & Repas',
      Visa: 'Frais Visa / Consulaires',
      Flight: 'Billets d\'Avion',
      Train: 'Tickets de Train',
      Louage: 'Frais de Louage',
      Taxi: 'Frais de Taxi',
      Other: 'Autres frais annexes'
    };

    const missionCategoryColorsMap: Record<string, string> = {
      Hotel: '#ec4899', // Pink
      Food: '#f43f5e', // Rose
      Visa: '#a855f7', // Purple
      Flight: '#3b82f6', // Blue
      Train: '#06b6d4', // Cyan
      Louage: '#10b981', // Emerald
      Taxi: '#f59e0b', // Amber
      Other: '#64748b' // Slate
    };

    const missionCategoryDataChart = Object.keys(missionCategoriesMap).map(catKey => ({
      name: missionCategoryTranslationMap[catKey] || catKey,
      value: Math.round(missionCategoriesMap[catKey] * 1000) / 1000,
      color: missionCategoryColorsMap[catKey] || '#ccc'
    })).filter(item => item.value > 0);

    // Vehicle chart Mapping
    const vehicleExpensesMap: Record<string, number> = {};
    dashboardExpenses.forEach(e => {
      vehicleExpensesMap[e.vehicleLabel] = (vehicleExpensesMap[e.vehicleLabel] || 0) + e.amount;
    });

    const vehicleDataChart = Object.keys(vehicleExpensesMap).map(vehLabel => ({
      vehicle: vehLabel.split(' (')[0], // keep short name
      spent: Math.round(vehicleExpensesMap[vehLabel] * 1000) / 1000
    })).sort((a, b) => b.spent - a.spent);

    return {
      totalVehiclesCount,
      activeVehiclesCount,
      underRepairDiscount,
      soldVehiclesCount,
      totalSpent,
      totalMissionSpent,
      activeMissionsCount,
      totalMissionsCount,
      activeInquiriesCount,
      categoryDataChart,
      missionCategoryDataChart,
      vehicleDataChart
    };
  }, [displayVehicles, dashboardExpenses, dashboardMissions, dashboardIncidents]);

  if (!isHydrated) return <SkeletonLoader />;

  // Form Submissions
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.registrationNumber) return;

    const assignedEmp = employees.find(e => e.id === newVehicle.assignedToEmployeeId);
    const toSave: Vehicle = {
      id: `v_${Date.now()}`,
      brand: newVehicle.brand,
      model: newVehicle.model,
      registrationNumber: newVehicle.registrationNumber,
      purchaseDate: newVehicle.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: Number(newVehicle.purchasePrice) || 0,
      status: newVehicle.status,
      assignedToEmployeeId: newVehicle.assignedToEmployeeId || undefined,
      assignedEmployeeName: assignedEmp ? assignedEmp.name : undefined
    };

    setVehicles([...vehicles, toSave]);
    setIsVehicleModalOpen(false);
    setNewVehicle({ brand: '', model: '', registrationNumber: '', purchaseDate: '', purchasePrice: 0, status: 'Active', assignedToEmployeeId: '' });
  };

  const processVehicleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingVehicleId) return;

    setVehicles(vehicles.map(v => {
      if (v.id === sellingVehicleId) {
        return {
          ...v,
          status: 'Sold',
          saleDate: saleDate || new Date().toISOString().split('T')[0],
          salePrice: Number(salePrice) || 0
        };
      }
      return v;
    }));

    setSellingVehicleId(null);
    setSaleDate('');
    setSalePrice(0);
  };

  const handleAddMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMission.employeeId || !newMission.destination) return;

    const selectedEmp = employees.find(emp => emp.id === newMission.employeeId);
    if (!selectedEmp) return;

    let vehicleId: string | undefined = undefined;
    let vehicleLabel: string | undefined = undefined;

    if (newMission.transportType === 'CompanyCar') {
      if (!newMission.vehicleId) {
        alert("Veuillez sélectionner un véhicule de service pour cette mission.");
        return;
      }
      const vCheck = checkVehicleAvailability(newMission.vehicleId, newMission.departureDateTime, newMission.returnDateTime);
      if (!vCheck.available) {
        alert(`Véhicule indisponible : ${vCheck.reason}`);
        return;
      }
      const selectedVeh = displayVehicles.find(v => v.id === newMission.vehicleId);
      if (!selectedVeh) return;
      vehicleId = selectedVeh.id;
      vehicleLabel = `${selectedVeh.brand} ${selectedVeh.model} (${selectedVeh.registrationNumber})`;
    }

    if (newMission.employeeId && newMission.departureDateTime && newMission.returnDateTime) {
      const eCheck = checkEmployeeAvailability(newMission.employeeId, newMission.departureDateTime, newMission.returnDateTime);
      if (!eCheck.available) {
        alert(`Salarié indisponible : ${eCheck.reason}`);
        return;
      }
    }

    const toSave: MissionOrder = {
      id: `mo_${Date.now()}`,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      transportType: newMission.transportType,
      vehicleId,
      vehicleLabel,
      otherTransportLabel: newMission.transportType === 'Other' ? newMission.otherTransportLabel : undefined,
      destination: newMission.destination,
      purpose: newMission.purpose,
      departureDateTime: newMission.departureDateTime || new Date().toISOString().slice(0, 16),
      returnDateTime: newMission.returnDateTime || new Date().toISOString().slice(0, 16),
      allowancesGranted: Number(newMission.allowancesGranted) || 0,
      status: newMission.status || 'Approved',
      expenses: []
    };

    // If advance is granted upon creation, record accounting entry (Débit 4214 / Crédit 531)
    if (toSave.allowancesGranted && toSave.allowancesGranted > 0) {
      const advTx = {
        id: `tx_adv_pay_${Date.now()}`,
        accountId: 'acc_caisse',
        accountName: 'Caisse / Banque (Avance Mission)',
        date: new Date().toISOString().split('T')[0],
        type: 'Out' as const,
        amount: toSave.allowancesGranted,
        method: 'Especes' as const,
        reference: `ADV-INIT-${toSave.id}`,
        beneficiaryOrIssuer: toSave.employeeName,
        category: 'Autre' as const,
        description: `[Compta 4214] Versement avance sur frais - Mission ${toSave.id} (${toSave.destination}) à ${toSave.employeeName}`,
        status: 'Cleared' as const,
        debitAccount: '4214',
        creditAccount: '531'
      };

      try {
        const existingTxs = JSON.parse(localStorage.getItem('carthage_bank_transactions') || '[]');
        localStorage.setItem('carthage_bank_transactions', JSON.stringify([advTx, ...existingTxs]));
      } catch (e) {
        console.warn("Notice saving initial advance transaction:", e);
      }
    }

    // Sync vehicle assignment in Parc Auto if a company car is used
    if (toSave.transportType === 'CompanyCar' && toSave.vehicleId && toSave.employeeId) {
      setVehicles((prevVehicles: Vehicle[]) => prevVehicles.map(v => {
        if (v.id === toSave.vehicleId) {
          return {
            ...v,
            assignedToEmployeeId: toSave.employeeId,
            assignedEmployeeName: toSave.employeeName
          };
        }
        return v;
      }));
    }

    setMissions([...missions, toSave]);
    setIsMissionModalOpen(false);
    setNewMission({ 
      employeeId: '', 
      transportType: 'CompanyCar', 
      vehicleId: '', 
      otherTransportLabel: 'Train', 
      destination: '', 
      purpose: '', 
      departureDateTime: '', 
      returnDateTime: '', 
      allowancesGranted: 0,
      status: 'Approved' 
    });
  };

  const checkEmployeeAvailability = (employeeId: string, departureStr: string, returnStr: string, ignoreMissionId?: string) => {
    if (!employeeId || !departureStr || !returnStr) return { available: true, reason: "" };
    
    const departureTime = new Date(departureStr).getTime();
    const returnTime = new Date(returnStr).getTime();
    
    if (isNaN(departureTime) || isNaN(returnTime)) return { available: true, reason: "" };

    const overlappingMission = displayMissions.find(m => {
      if (m.id === ignoreMissionId) return false;
      if (m.status !== 'Approved' && m.status !== 'Completed') return false;
      if (m.employeeId !== employeeId) return false;

      const mStart = new Date(m.departureDateTime).getTime();
      const mEnd = new Date(m.returnDateTime).getTime();

      if (isNaN(mStart) || isNaN(mEnd)) return false;

      return (departureTime < mEnd && returnTime > mStart);
    });

    if (overlappingMission) {
      const dep = (overlappingMission.departureDateTime || '').replace('T', ' ');
      const ret = (overlappingMission.returnDateTime || '').replace('T', ' ');
      const datesText = `${dep} au ${ret}`;
      return { 
        available: false, 
        reason: `Salarié déjà en mission : « ${overlappingMission.destination} » (${datesText})` 
      };
    }

    return { available: true, reason: "Salarié disponible pour mission" };
  };

  const checkVehicleAvailability = (vehicleId: string, departureStr: string, returnStr: string, ignoreMissionId?: string) => {
    if (!vehicleId || !departureStr || !returnStr) return { available: true, reason: "" };
    
    const departureTime = new Date(departureStr).getTime();
    const returnTime = new Date(returnStr).getTime();
    
    if (isNaN(departureTime) || isNaN(returnTime)) return { available: true, reason: "" };
    if (returnTime <= departureTime) return { available: false, reason: "La date de retour doit être strictement après la date de sortie." };

    const targetVeh = displayVehicles.find(v => v.id === vehicleId);
    if (targetVeh && targetVeh.status === 'UnderRepair') {
      return { available: false, reason: "Véhicule non disponible : Actuellement en réparation / atelier." };
    }
    if (targetVeh && targetVeh.status === 'Sold') {
      return { available: false, reason: "Véhicule non disponible : Vendu / Cédé." };
    }

    const overlappingMission = displayMissions.find(m => {
      if (m.id === ignoreMissionId) return false;
      if (m.status !== 'Approved' && m.status !== 'Completed') return false;
      if (m.transportType !== 'CompanyCar') return false;
      if (m.vehicleId !== vehicleId) return false;

      const mStart = new Date(m.departureDateTime).getTime();
      const mEnd = new Date(m.returnDateTime).getTime();

      if (isNaN(mStart) || isNaN(mEnd)) return false;

      // Overlap logic:
      return (departureTime < mEnd && returnTime > mStart);
    });

    if (overlappingMission) {
      return { 
        available: false, 
        reason: m_overlap_reason(overlappingMission)
      };
    }

    return { available: true, reason: "Véhicule disponible de suite" };
  };

  // Helper nested function for cleaner readability
  const m_overlap_reason = (m: MissionOrder) => {
    const depTime = (m.departureDateTime || '').split('T')[1] || (m.departureDateTime || '');
    const retTime = (m.returnDateTime || '').split('T')[1] || (m.returnDateTime || '');
    const datesText = `${depTime} au ${retTime}`;
    return `Occupé par ${m.employeeName} pour sa mission « ${m.destination} » (${datesText}).`;
  };

  const addMissionExpenseItem = (missionId: string, item: { category: any, description: string, amount: number, date: string, invoiceNumber?: string }) => {
    setMissions(prevMissions => prevMissions.map(m => {
      if (m.id === missionId) {
        const currentExpenses = m.expenses || [];
        const newItem = {
          id: `item_${Date.now()}`,
          category: item.category,
          description: item.description,
          amount: Number(item.amount) || 0,
          date: item.date || new Date().toISOString().split('T')[0],
          invoiceNumber: item.invoiceNumber
        };
        return {
          ...m,
          expenses: [...currentExpenses, newItem]
        };
      }
      return m;
    }));
  };

  const removeMissionExpenseItem = (missionId: string, itemId: string) => {
    if (confirm("Voulez-vous réelement retirer cette dépense de la mission ?")) {
      setMissions(prevMissions => prevMissions.map(m => {
        if (m.id === missionId) {
          const currentExpenses = m.expenses || [];
          return {
            ...m,
            expenses: currentExpenses.filter(i => i.id !== itemId)
          };
        }
        return m;
      }));
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.vehicleId || !newExpense.amount) return;

    const selectedVeh = displayVehicles.find(v => v.id === newExpense.vehicleId);
    if (!selectedVeh) return;

    const toSave: FleetExpense = {
      id: `exp_${Date.now()}`,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      vehicleId: selectedVeh.id,
      vehicleLabel: `${selectedVeh.brand} ${selectedVeh.model} (${selectedVeh.registrationNumber})`,
      category: newExpense.category,
      amount: Number(newExpense.amount) || 0,
      invoiceNb: newExpense.invoiceNb,
      providerName: newExpense.providerName,
      description: newExpense.description
    };

    setExpenses([...expenses, toSave]);
    setIsExpenseModalOpen(false);
    setNewExpense({ date: '', vehicleId: '', category: 'GasolineBonus', amount: 0, invoiceNb: '', providerName: '', description: '' });
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.vehicleId || !newIncident.employeeId || !newIncident.description) return;

    const selectedVeh = displayVehicles.find(v => v.id === newIncident.vehicleId);
    const selectedEmp = employees.find(emp => emp.id === newIncident.employeeId);
    if (!selectedVeh || !selectedEmp) return;

    const toSave: IncidentRecord = {
      id: `inc_${Date.now()}`,
      date: newIncident.date || new Date().toISOString().split('T')[0],
      vehicleId: selectedVeh.id,
      vehicleLabel: `${selectedVeh.brand} ${selectedVeh.model} (${selectedVeh.registrationNumber})`,
      employeeId: selectedEmp.id,
      driverName: selectedEmp.name,
      description: newIncident.description,
      safetyInquiry: newIncident.safetyInquiry,
      sanctionsApplied: newIncident.sanctionsApplied,
      severity: newIncident.severity,
      status: newIncident.status
    };

    setIncidents([...incidents, toSave]);
    setIsIncidentModalOpen(false);
    setNewIncident({ date: '', vehicleId: '', employeeId: '', description: '', safetyInquiry: '', sanctionsApplied: '', severity: 'Medium', status: 'Reported' });
  };

  // Status changers
  const updateMissionStatus = (id: string, next: 'Approved' | 'Completed' | 'CLOTURE_PAYE' | 'Canceled') => {
    setMissions(missions.map(m => m.id === id ? { ...m, status: next } : m));
  };

  // Clôture de mission : Calcul du Net R = J - A, synchro Paie & écritures Comptabilité
  const handleCloseMissionAndSync = async (m: MissionOrder) => {
    const companyId = window.localStorage.getItem('elyssa_company_id') || window.localStorage.getItem('carthage_company_id') || 'elyssa-sa-tunis';
    
    const A = Number(m.allowancesGranted) || 0;
    const J = (m.expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const R = J - A;

    // 1. Update mission state object
    const updatedMission: MissionOrder = {
      ...m,
      status: 'CLOTURE_PAYE',
      closedAt: new Date().toISOString(),
      totalAdvance: A,
      totalExpenses: J,
      netBalanceToSettle: R
    };

    setMissions((prev: MissionOrder[]) => prev.map(item => item.id === m.id ? updatedMission : item));

    // 2. Prepare Pending Payroll Adjustment
    const adjustmentId = `adj_${m.id}_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    const pendingAdjustment = {
      id: adjustmentId,
      missionId: m.id,
      employeeId: m.employeeId,
      employeeName: m.employeeName,
      type: "MISSION_EXPENSE_REIMBURSEMENT",
      grossAmount: Math.abs(R),
      direction: R >= 0 ? "CREDIT" : "DEBIT", // CREDIT = Ajout sur fiche de paie, DEBIT = Retenue sur salaire
      status: "PENDING_PAYROLL",
      totalAdvance: A,
      totalExpenses: J,
      netAdjustment: R,
      date: new Date().toISOString(),
      month: monthStr,
      destination: m.destination,
      companyId: companyId,
      notes: R >= 0 
        ? `Remboursement reliquat frais de mission ${m.id} (${m.destination}) - Ajout fiche de paie: +${R.toFixed(3)} DT`
        : `Retenue trop-perçu sur avance de mission ${m.id} (${m.destination}) - Déduction salaire: -${Math.abs(R).toFixed(3)} DT`
    };

    // Save to LocalStorage for instant UI reactiveness across modules
    try {
      const existingAdjs = JSON.parse(localStorage.getItem(`elyssa_payroll_pending_adjustments_${companyId}`) || '[]');
      const filteredAdjs = existingAdjs.filter((a: any) => a.missionId !== m.id);
      const newAdjs = [pendingAdjustment, ...filteredAdjs];
      localStorage.setItem(`elyssa_payroll_pending_adjustments_${companyId}`, JSON.stringify(newAdjs));
      window.dispatchEvent(new CustomEvent('elyssa_payroll_adjustments_updated'));
    } catch (e) {
      console.warn("Notice saving local pending adjustments:", e);
    }

    // Sync to Firestore
    try {
      const adjDocRef = doc(db, 'company_erp_data', companyId, 'payroll_pending_adjustments', adjustmentId);
      await setDoc(adjDocRef, pendingAdjustment, { merge: true });

      const parentErpRef = doc(db, 'company_erp_data', companyId);
      await setDoc(parentErpRef, {
        payroll_pending_adjustments: [pendingAdjustment],
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("🔥 Payroll Pending Adjustment synced to Firestore.");
    } catch (err) {
      console.warn("Notice Firestore sync for payroll adjustment:", err);
    }

    // 3. GENERATE ACCOUNTING JOURNAL ENTRIES (Comptabilité & Finance)
    const existingBankTxs = JSON.parse(localStorage.getItem('carthage_bank_transactions') || '[]');
    const newTransactions = [];

    if (J > 0) {
      newTransactions.push({
        id: `tx_mission_exp_${Date.now()}_1`,
        accountId: 'acc_caisse',
        accountName: 'Comptabilité Générale (Journal Operations)',
        date: todayStr,
        type: 'Out' as const,
        amount: J,
        method: 'Autre' as const,
        reference: `OM-${m.id}`,
        beneficiaryOrIssuer: m.employeeName,
        category: 'Autre' as const,
        description: `[Compta Débit 625] Constat charges de mission ${m.id} (${m.destination}) - Justificatifs: ${J.toFixed(3)} DT`,
        status: 'Cleared' as const,
        debitAccount: '625',
        creditAccount: '4214'
      });
    }

    if (A > 0) {
      newTransactions.push({
        id: `tx_mission_adv_settle_${Date.now()}_2`,
        accountId: 'acc_caisse',
        accountName: 'Personnel - Avances (Compte 4214)',
        date: todayStr,
        type: 'In' as const,
        amount: A,
        method: 'Autre' as const,
        reference: `ADV-SOLDE-${m.id}`,
        beneficiaryOrIssuer: m.employeeName,
        category: 'Autre' as const,
        description: `[Compta Crédit 4214] Apurement avance sur frais mission ${m.id} (${m.destination}) - Avance soldée: ${A.toFixed(3)} DT`,
        status: 'Cleared' as const,
        debitAccount: '4214',
        creditAccount: '531'
      });
    }

    if (Math.abs(R) > 0) {
      newTransactions.push({
        id: `tx_mission_reliquat_${Date.now()}_3`,
        accountId: 'acc_payroll',
        accountName: 'Personnel - Rémunérations dues (Compte 421)',
        date: todayStr,
        type: R >= 0 ? 'Out' as const : 'In' as const,
        amount: Math.abs(R),
        method: 'Autre' as const,
        reference: `PAY-REL-${m.id}`,
        beneficiaryOrIssuer: m.employeeName,
        category: 'Salaire' as const,
        description: R >= 0 
          ? `[Compta Crédit 421] Reliquat à rembourser au collaborateur en Paie - Mission ${m.id}: +${R.toFixed(3)} DT`
          : `[Compta Débit 4214] Trop-perçu à déduire du salaire du collaborateur - Mission ${m.id}: -${Math.abs(R).toFixed(3)} DT`,
        status: 'Pending' as const,
        debitAccount: R >= 0 ? '625' : '4214',
        creditAccount: R >= 0 ? '421' : '531'
      });
    }

    if (newTransactions.length > 0) {
      const updatedBankTxs = [...newTransactions, ...existingBankTxs];
      localStorage.setItem('carthage_bank_transactions', JSON.stringify(updatedBankTxs));

      try {
        for (const tx of newTransactions) {
          const txDocRef = doc(db, 'company_erp_data', companyId, 'bank_transactions', tx.id);
          await setDoc(txDocRef, tx, { merge: true });
        }
      } catch (txErr) {
        console.warn("Notice syncing bank transactions to Firestore:", txErr);
      }
    }

    alert(`✅ Ordre de Mission ${m.id} clôturé avec succès !\n\n` +
      `• Total Avance versée (A) : ${A.toFixed(3)} DT\n` +
      `• Total Justificatifs (J) : ${J.toFixed(3)} DT\n` +
      `• Net à Régulariser (R) : ${R >= 0 ? '+' : ''}${R.toFixed(3)} DT\n\n` +
      `${R >= 0 ? '👉 Montant transmis au module PAIE (CREDIT +) pour ajout sur fiche de paie.' : '👉 Trop-perçu transmis au module PAIE (DEBIT -) pour retenue sur le prochain salaire.'}\n` +
      `• Écritures comptables générées (Comptes 625 / 4214 / 421).`
    );
  };

  const updateIncidentStatus = (id: string, next: 'Reported' | 'UnderInquiry' | 'Resolved') => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status: next } : inc));
  };

  const updateIncidentDetails = (id: string, inquiry: string, sanctions: string) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, safetyInquiry: inquiry, sanctionsApplied: sanctions } : inc));
  };

  const deleteVehicle = (id: string) => {
    if (confirm("Voulez-vous réelement retirer ce véhicule de la base Elyssa S.A. ?")) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const deleteMission = (id: string) => {
    if (confirm("Supprimer l'ordre de mission sélectionné ?")) {
      setMissions(missions.filter(m => m.id !== id));
    }
  };

  const deleteExpense = (id: string) => {
    if (confirm("Supprimer définitivement cette écriture comptable de frais ?")) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const deleteIncident = (id: string) => {
    if (confirm("Retirer cette déclaration d'accident du registre ?")) {
      setIncidents(incidents.filter(inc => inc.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation Bar */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-850 flex items-center gap-2">
            <Car className="w-6 h-6 text-indigo-600" />
            <span>Gestion de Parc Auto & Flotte</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Logistique, ordres d'affectation des chauffeurs, contrôles techniques et coûts opérationnels</p>
        </div>

        {/* Mini Tab Links */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'dashboard' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Synthèse & Coûts</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('vehicles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'vehicles' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Le Parc Auto ({displayVehicles.length})</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('missions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'missions' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ordres Mission</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'expenses' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Factures & Bons</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('incidents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'incidents' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sinistres & Enquêtes</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 print:hidden">
          
          {/* Date Range Filter for Fleet Dashboard */}
          <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Intervalle de Temps</h4>
                  <p className="text-[10px] font-semibold text-slate-400">Filtrer les frais, missions et sinistres de la flotte</p>
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
                    isActive = !fleetStartDate && !fleetEndDate;
                  } else if (preset.id === 'this_month') {
                    const expectedStart = new Date(y, m, 1).toISOString().split('T')[0];
                    isActive = fleetStartDate === expectedStart;
                  } else if (preset.id === 'last_month') {
                    const expectedStart = new Date(y, m - 1, 1).toISOString().split('T')[0];
                    isActive = fleetStartDate === expectedStart;
                  } else if (preset.id === 'last_30_days') {
                    const expectedStart = new Date();
                    expectedStart.setDate(today.getDate() - 30);
                    isActive = fleetStartDate === expectedStart.toISOString().split('T')[0];
                  } else if (preset.id === 'last_90_days') {
                    const expectedStart = new Date();
                    expectedStart.setDate(today.getDate() - 90);
                    isActive = fleetStartDate === expectedStart.toISOString().split('T')[0];
                  }

                  const setFleetQuickRange = (rangeType: 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'last_90_days') => {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = today.getMonth();
                    
                    switch (rangeType) {
                      case 'all':
                        setFleetStartDate('');
                        setFleetEndDate('');
                        break;
                      case 'this_month': {
                        const start = new Date(y, m, 1);
                        setFleetStartDate(start.toISOString().split('T')[0]);
                        setFleetEndDate(today.toISOString().split('T')[0]);
                        break;
                      }
                      case 'last_month': {
                        const start = new Date(y, m - 1, 1);
                        const end = new Date(y, m, 0);
                        setFleetStartDate(start.toISOString().split('T')[0]);
                        setFleetEndDate(end.toISOString().split('T')[0]);
                        break;
                      }
                      case 'last_30_days': {
                        const start = new Date();
                        start.setDate(today.getDate() - 30);
                        setFleetStartDate(start.toISOString().split('T')[0]);
                        setFleetEndDate(today.toISOString().split('T')[0]);
                        break;
                      }
                      case 'last_90_days': {
                        const start = new Date();
                        start.setDate(today.getDate() - 90);
                        setFleetStartDate(start.toISOString().split('T')[0]);
                        setFleetEndDate(today.toISOString().split('T')[0]);
                        break;
                      }
                    }
                  };

                  return (
                    <button
                      key={preset.id}
                      onClick={() => setFleetQuickRange(preset.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-3xs' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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
                  value={fleetStartDate}
                  onChange={(e) => setFleetStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-400 text-xs font-semibold">à</span>
                <input
                  type="date"
                  value={fleetEndDate}
                  onChange={(e) => setFleetEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                {(fleetStartDate || fleetEndDate) && (
                  <button
                    onClick={() => {
                      setFleetStartDate('');
                      setFleetEndDate('');
                    }}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                    title="Effacer le filtre"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            {(fleetStartDate || fleetEndDate) && (
              <div className="text-[10px] bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-2 flex items-center justify-between text-indigo-750">
                <span className="font-bold">
                  📅 Période active : {fleetStartDate ? new Date(fleetStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Début'} au {fleetEndDate ? new Date(fleetEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aujourd\'hui'}
                </span>
                <span className="text-[9px] font-medium italic">
                  Données filtrées : {dashboardExpenses.length} dépenses flottes et {dashboardMissions.length} missions
                </span>
              </div>
            )}
          </div>
          
          {/* Top Numeric KPI Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400">Véhicules Flotte</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{stats.totalVehiclesCount}</span>
                <span className="text-[9.5px] font-semibold text-emerald-600 font-mono mt-0.5 block">✓ {stats.activeVehiclesCount} en circulation</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Car className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400">Frais Flotte & Missions</span>
                <span className="text-xl font-black text-slate-850 block mt-1 font-mono">
                  {((stats?.totalSpent ?? 0) + (stats?.totalMissionSpent ?? 0)).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT
                </span>
                <span className="text-[9px] font-semibold text-slate-400 mt-1 block leading-tight">
                  🚘 Flotte : {(stats?.totalSpent ?? 0).toFixed(3)} DT<br/>
                  💼 Missions : {(stats?.totalMissionSpent ?? 0).toFixed(3)} DT
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400">Mission Actives</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{stats.activeMissionsCount}</span>
                <span className="text-[9.5px] font-semibold text-indigo-600 mt-0.5 block">Sur {stats.totalMissionsCount} missions formulées</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400">Accidents & Enquêtes</span>
                <span className="text-2xl font-black text-rose-700 block mt-1">{stats.activeInquiriesCount}</span>
                <span className="text-[9.5px] font-bold text-amber-600 mt-0.5 block leading-none">Délits ou procédures en cours</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Graphical Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pie Chart: Fleet Expenses per Categories */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-4 tracking-wider flex items-center gap-1">
                <span>Distribution des Charges Flotte Auto</span>
                <span className="font-mono text-indigo-600 text-[10px] font-normal lowercase">(Réparations, tôleries, etc.)</span>
              </h3>
              
              <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-4">
                {stats.categoryDataChart.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-20 w-full col-span-2">Aucun frais logistique flotte enregistré.</p>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryDataChart}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.categoryDataChart.map((entry, index) => (
                              <Cell key={`cell-f-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `${(Number(value) || 0).toFixed(3)} DT`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
 
                    <div className="w-full md:w-1/2 space-y-1.5 overflow-y-auto max-h-[220px] pr-1">
                      {stats.categoryDataChart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10.5px] font-medium p-1 border-b border-dashed border-slate-100 last:border-none">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-650 truncate max-w-[110px]">{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-800 font-bold shrink-0">{(item?.value ?? 0).toFixed(3)} DT</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pie Chart: Mission Travel Expenses per Categories */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-4 tracking-wider flex items-center gap-1">
                <span>Composition des Frais de Mission</span>
                <span className="font-mono text-pink-600 text-[10px] font-normal lowercase">(Hôtel, billets, nourriture, etc.)</span>
              </h3>
              
              <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-4">
                {stats.missionCategoryDataChart.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-20 w-full col-span-2">Aucun frais de mission et déplacement enregistré pour le moment.</p>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.missionCategoryDataChart}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.missionCategoryDataChart.map((entry, index) => (
                              <Cell key={`cell-m-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `${(Number(value) || 0).toFixed(3)} DT`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
 
                    <div className="w-full md:w-1/2 space-y-1.5 overflow-y-auto max-h-[220px] pr-1">
                      {stats.missionCategoryDataChart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10.5px] font-medium p-1 border-b border-dashed border-slate-100 last:border-none">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-650 truncate max-w-[110px]">{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-850 font-black shrink-0">{(item?.value ?? 0).toFixed(3)} DT</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bar Chart: Expenses per Vehicle */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs lg:col-span-2">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-4 tracking-wider">Cumuls de Frais de Flotte Auto par Véhicule (DT)</h3>
              <div className="h-64">
                {stats.vehicleDataChart.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-20">Aucune affectation comptable de flotte.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.vehicleDataChart} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="vehicle" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <Tooltip formatter={(v: any) => `${(Number(v) || 0).toFixed(3)} DT`} />
                      <Bar dataKey="spent" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        {stats.vehicleDataChart.map((entry, i) => (
                          <Cell key={i} fill={i === 0 ? '#4f46e5' : i === 1 ? '#6366f1' : '#818cf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-extrabold uppercase">Ressources logitiques pour Elyssa S.A. :</strong> Les vignettes auto et assurances se renouvellent automatiquement dans l'indicateur de conformité. Les bons d'essence décomptent directement l'état de caisse ou les provisions bancaires enregistrées par le Directeur Financier <strong>({employees.find(e => e.id === 'emp_1')?.name})</strong>.
            </div>
          </div>
        </div>
      )}

      {/* VEHICLES MANAGEMENT TAB */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Répertoire des Véhicules</h3>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex items-center gap-1.5 p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Achat / Immatriculation Véhicule</span>
            </button>
          </div>

          {/* Vehicles list */}
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-3 pl-4">Marque & Modèle</th>
                  <th className="p-3">Matricule (Carte Grise)</th>
                  <th className="p-3">Acquisition</th>
                  <th className="p-3 text-right">Prix d'Achat</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 pl-4 font-extrabold text-slate-800 flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-400" />
                      <span>{v.brand} {v.model}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{v.registrationNumber}</td>
                    <td className="p-3 text-slate-500">{v.purchaseDate}</td>
                    <td className="p-3 text-right font-mono text-slate-800 font-semibold">{(Number(v.purchasePrice) || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                        v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                        v.status === 'UnderRepair' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                        'bg-slate-100 text-slate-600 border border-slate-200' // Sold
                      }`}>
                        {v.status === 'Active' ? 'EN CIRCULATION' : 
                         v.status === 'UnderRepair' ? 'AU GARAGE' : 'VENDU / RETIRÉ'}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status !== 'Sold' && (
                          <button
                            onClick={() => {
                              setSellingVehicleId(v.id);
                              setSaleDate(new Date().toISOString().split('T')[0]);
                              setSalePrice(Math.round((Number(v.purchasePrice) || 0) * 0.7));
                            }}
                            className="p-1 px-2 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold cursor-pointer"
                            title="Déclarer la vente de ce véhicule"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" />
                            Vendre
                          </button>
                        )}
                        <button
                          onClick={() => deleteVehicle(v.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Supprimer historique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sold history segment list */}
          {displayVehicles.filter(v => v.status === 'Sold').length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Actifs vendus / Cessions comptabilisées</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                {displayVehicles.filter(v => v.status === 'Sold').map(v => (
                  <div key={v.id} className="flex justify-between items-center text-xs p-2 border-b border-dashed border-slate-150 last:border-none">
                    <div>
                      <strong className="text-slate-800">{v.brand} {v.model}</strong> ({v.registrationNumber})
                      <span className="text-[10px] text-slate-400 font-mono block">Cédé le {v.saleDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-indigo-700 font-black">{(Number(v.salePrice) || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</span>
                      <span className="text-[9.5px] font-bold block text-emerald-600">Plus-value / Moins-value enregistrée</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MISSION ORDERS TAB */}
      {activeSubTab === 'missions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Affectations routières & Ordres de Mission</h3>
            <button
              onClick={() => setIsMissionModalOpen(true)}
              className="flex items-center gap-1.5 p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Générer un ordre de mission</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            {displayMissions.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12 border-2 border-dashed border-slate-150 rounded-2xl bg-white">
                Aucune mission enregistrée pour le moment.
              </p>
            ) : (
              displayMissions.map(m => (
                <div key={m.id} className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col items-stretch gap-4 shadow-3xs hover:border-slate-300 transition">
                  <div className="flex flex-col md:flex-row items-stretch justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1 bg-slate-100 p-1 px-2.5 rounded-lg border border-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {m.employeeName}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className={`text-[10.5px] font-mono p-1 px-2.5 rounded-md font-extrabold ${m.transportType === 'CompanyCar' ? 'text-indigo-900 bg-indigo-100 border border-indigo-250' : 'text-purple-950 bg-purple-100 border border-purple-300'}`}>
                          {m.transportType === 'CompanyCar' ? `🚘 Voiture Flotte : ${m.vehicleLabel}` : `✈️ Transport Public : ${m.otherTransportLabel}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Destination</span>
                          <strong className="text-slate-800">{m.destination}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Objet de l'affectation</span>
                          <p className="text-slate-650 italic text-[11px] truncate">{m.purpose}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-slate-50 text-[10.5px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Sortie : <strong className="text-slate-750">{(m.departureDateTime || '').replace('T', ' à ')}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Retour : <strong className="text-slate-750">{(m.returnDateTime || '').replace('T', ' à ')}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-between md:justify-center items-end gap-3 shrink-0 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                          m.status === 'CLOTURE_PAYE' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          m.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' :
                          m.status === 'Approved' ? 'bg-indigo-50 text-indigo-800 border border-indigo-150' :
                          m.status === 'Canceled' ? 'bg-rose-50 text-rose-800 border border-rose-150' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {m.status === 'CLOTURE_PAYE' ? 'CLÔTURÉ (PAIE SYNC)' :
                           m.status === 'Completed' ? 'CHAUFFEUR RENTRÉ' :
                           m.status === 'Approved' ? 'EN ROUTE / AUTORISÉ' :
                           m.status === 'Canceled' ? 'ANNULÉ' : 'BROUILLON'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {m.status === 'Draft' && (
                          <button
                            onClick={() => updateMissionStatus(m.id, 'Approved')}
                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded text-[10px] font-bold cursor-pointer animate-pulse"
                          >
                            Valider sortie
                          </button>
                        )}
                        
                        {(m.status === 'Approved' || m.status === 'Completed') && (
                          <button
                            onClick={() => handleCloseMissionAndSync(m)}
                            className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            title="Clôturer la mission, régulariser l'avance et transmettre au module Paie & Compta"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Clôturer retour</span>
                          </button>
                        )}

                        {m.status === 'CLOTURE_PAYE' && (
                          <span className="p-1 px-2 text-[9.5px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-teal-600" />
                            <span>Paie & Compta OK</span>
                          </span>
                        )}

                        <button
                          onClick={() => setPrintedMission(m)}
                          className="p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          title="Imprimer l'ordre de mission officiel"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => deleteMission(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mission Expenses Panel */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => setExpandedMissionExpenseId(expandedMissionExpenseId === m.id ? null : m.id)}
                        className="text-slate-500 hover:text-indigo-650 font-extrabold flex items-center gap-1.5 cursor-pointer p-1 rounded-md hover:bg-slate-50"
                      >
                        <Receipt className="w-4 h-4 text-indigo-500" />
                        <span className="underline">Détails des frais de cette mission ({(m.expenses || []).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0).toFixed(3)} DT)</span>
                        <span className="text-[10px] font-normal text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded">
                          {(m.expenses || []).length} justificatifs
                        </span>
                      </button>
                    </div>

                    {expandedMissionExpenseId === m.id && (
                      <div className="bg-slate-50/70 border border-slate-150 rounded-xl p-3 mt-2.5 space-y-3">
                        {/* Dynamic Financial Summary Block (Avance vs Justificatifs vs Reliquat) */}
                        {(() => {
                          const A = Number(m.allowancesGranted) || 0;
                          const J = (m.expenses || []).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
                          const R = J - A;

                          return (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                                  Récapitulatif Financier de la Mission
                                </span>
                                <span className="text-[9.5px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  Clôture Paie & Compta
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 bg-blue-50/80 border border-blue-150 rounded-lg">
                                  <span className="block text-[9.5px] font-bold uppercase text-blue-800">Total Avance versée (A)</span>
                                  <strong className="text-blue-950 text-sm font-mono">{(A ?? 0).toFixed(3)} DT</strong>
                                </div>

                                <div className="p-2.5 bg-purple-50/80 border border-purple-150 rounded-lg">
                                  <span className="block text-[9.5px] font-bold uppercase text-purple-800">Total Justificatifs saisis (J)</span>
                                  <strong className="text-purple-950 text-sm font-mono">{(J ?? 0).toFixed(3)} DT</strong>
                                </div>

                                <div className={`p-2.5 border rounded-lg ${
                                  R > 0 ? 'bg-emerald-50 border-emerald-200' :
                                  R < 0 ? 'bg-amber-50 border-amber-200' :
                                  'bg-slate-50 border-slate-200'
                                }`}>
                                  <span className="block text-[9.5px] font-bold uppercase text-slate-600">Net à Régulariser (R = J - A)</span>
                                  <strong className={`text-sm font-mono ${
                                    R > 0 ? 'text-emerald-800' :
                                    R < 0 ? 'text-amber-800' :
                                    'text-slate-800'
                                  }`}>
                                    {R > 0 ? `+${(R ?? 0).toFixed(3)} DT` : `${(R ?? 0).toFixed(3)} DT`}
                                  </strong>
                                </div>
                              </div>

                              {/* Dynamic Status Banner */}
                              <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-bold ${
                                R > 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-250' :
                                R < 0 ? 'bg-amber-50 text-amber-900 border-amber-250' :
                                'bg-slate-100 text-slate-800 border-slate-200'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {R > 0 ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : R < 0 ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  ) : (
                                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                                  )}
                                  <span>
                                    {R > 0 ? "Reste à rembourser au collaborateur (à injecter en Paie)" :
                                     R < 0 ? "Trop-perçu à déduire du prochain salaire" :
                                     "Compte équilibré (Aucun ajustement de paie requis)"}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded bg-white border border-slate-200 shadow-5xs shrink-0">
                                  {R > 0 ? `+${(R ?? 0).toFixed(3)} DT` : R < 0 ? `-${Math.abs(R ?? 0).toFixed(3)} DT` : '0.000 DT'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Active expenses item lists */}
                        {(m.expenses || []).length === 0 ? (
                          <p className="text-[11px] text-slate-405 italic">Aucun justificatif financier (hôtel, avion, visa, déjeuners...) de mission n'est rattaché pour l'instant.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {(m.expenses || []).map(item => (
                              <div key={item.id} className="flex items-center justify-between text-[10.5px] bg-white p-2 rounded-lg border border-slate-150 shadow-5xs">
                                <div>
                                  <span className="font-extrabold text-indigo-750 mr-1.5">
                                    {item.category === 'Hotel' ? '🏨 Hébergement' :
                                     item.category === 'Food' ? '🍽️ Repas / Nourriture' :
                                     item.category === 'Visa' ? '🎫 Visa / Consulaire' :
                                     item.category === 'Flight' ? '✈️ Avion' :
                                     item.category === 'Train' ? '🚆 Train' :
                                     item.category === 'Louage' ? '🚐 Louage' :
                                     item.category === 'Taxi' ? '🚖 Taxi' : '💼 Autre'}
                                  </span>
                                  <span className="text-slate-650 font-medium">— « {item.description} »</span>
                                  {item.invoiceNumber && <span className="text-[9px] font-mono text-slate-450 ml-1.5 bg-slate-100 p-0.5 px-1 rounded border border-slate-200">(Facture N°{item.invoiceNumber})</span>}
                                  <span className="text-[9px] text-slate-400 ml-1.5 font-mono">({item.date})</span>
                                </div>
                                <div className="flex items-center gap-1.5 pl-2 shrink-0">
                                  <span className="font-mono font-black text-slate-800">{(Number(item?.amount) || 0).toFixed(3)} DT</span>
                                  <button
                                    onClick={() => removeMissionExpenseItem(m.id, item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                    title="Retirer cette note"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quick Add Form Section */}
                        <div className="border-t border-slate-200/65 pt-2">
                          <span className="block text-[9.5px] uppercase font-black text-slate-400 mb-2">Comptabiliser un nouveau justificatif / dépense de mission</span>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!newMissionExpense.description || !newMissionExpense.amount) return;
                              addMissionExpenseItem(m.id, {
                                category: newMissionExpense.category,
                                description: newMissionExpense.description,
                                amount: Number(newMissionExpense.amount) || 0,
                                date: newMissionExpense.date || new Date().toISOString().split('T')[0],
                                invoiceNumber: newMissionExpense.invoiceNumber
                              });
                              setNewMissionExpense({
                                category: 'Hotel',
                                description: '',
                                amount: 0,
                                invoiceNumber: '',
                                date: ''
                              });
                            }}
                            className="grid grid-cols-2 lg:grid-cols-5 gap-2"
                          >
                            <div>
                              <select
                                value={newMissionExpense.category}
                                onChange={(ev) => setNewMissionExpense({ ...newMissionExpense, category: ev.target.value as any })}
                                className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 font-semibold"
                              >
                                <option value="Hotel">🏨 Hôtel / Séjour</option>
                                <option value="Food">🍽️ Nourriture / Repas</option>
                                <option value="Visa">🎫 Visa / Consulaire</option>
                                <option value="Flight">✈️ Billet d'Avion</option>
                                <option value="Train">🚆 Billet Train</option>
                                <option value="Louage">🚐 Louage</option>
                                <option value="Taxi">🚖 Taxi / Bus</option>
                                <option value="Other">💼 Autre Dépense</option>
                              </select>
                            </div>
                            <div className="col-span-2 lg:col-span-1">
                              <input
                                type="text"
                                placeholder="ex: Hôtel Sheraton Tunis, Dîner..."
                                value={newMissionExpense.description}
                                onChange={(ev) => setNewMissionExpense({ ...newMissionExpense, description: ev.target.value })}
                                className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="Montant (DT)"
                                value={newMissionExpense.amount || ''}
                                onChange={(ev) => setNewMissionExpense({ ...newMissionExpense, amount: Number(ev.target.value) || 0 })}
                                className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 font-mono"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="N° Facture / Ticket"
                                value={newMissionExpense.invoiceNumber}
                                onChange={(ev) => setNewMissionExpense({ ...newMissionExpense, invoiceNumber: ev.target.value })}
                                className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-850 focus:ring-1 focus:ring-indigo-500 placeholder-slate-350"
                              />
                            </div>
                            <button
                              type="submit"
                              className="col-span-2 lg:col-span-1 p-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1"
                            >
                              <span>Enregistrer frais</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTROLS EXPENSES & REPAIRS BILLS TAB */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Registre Financier Logistique</h3>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une Dépense / Carburant</span>
            </button>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
            {displayExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12">Aucun frais logistique comptabilisé.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Véhicule Assigné</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Fournisseur / Preuve</th>
                    <th className="p-3 text-right">Montant</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 pl-4 font-mono font-semibold text-slate-500">{e.date}</td>
                      <td className="p-3">
                        <strong className="text-slate-800 block text-[11px]">{(e.vehicleLabel || '').split(' (')[0]}</strong>
                        <span className="text-[9.5px] text-slate-405 font-mono">{(e.vehicleLabel || '').split(' (')[1]?.replace(')', '') || ''}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          e.category === 'GasolineBonus' ? 'bg-yellow-50 text-yellow-800 border border-yellow-150' :
                          e.category === 'Insurance' ? 'bg-indigo-50 text-indigo-805 border border-indigo-150' :
                          e.category === 'Vignette' ? 'bg-cyan-50 text-cyan-805 border border-cyan-150' :
                          e.category === 'SpareParts' ? 'bg-rose-50 text-rose-805 border border-rose-150' :
                          e.category === 'PanelBeaterInvoice' ? 'bg-purple-50 text-purple-805 border border-purple-150' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {e.category === 'GasolineBonus' ? 'Bon d\'essence' :
                           e.category === 'Insurance' ? 'Assurance' :
                           e.category === 'Vignette' ? 'Vignette circulation' :
                           e.category === 'Toll' ? 'Péage autoroute' :
                           e.category === 'SpareParts' ? 'Pièces détachées' :
                           e.category === 'MechanicLabor' ? 'M.O. Mécanicien' :
                           e.category === 'PanelBeaterInvoice' ? 'Tôlier / Carrossier' : 'Autre Frais'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-700 block font-medium">{e.providerName || 'N/A'}</span>
                        <span className="text-[9.5px] text-slate-400 font-mono italic block">{e.invoiceNb ? `N° ${e.invoiceNb}` : 'Sans pièce'}</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800 font-extrabold">{(Number(e?.amount) || 0).toFixed(3)} DT</td>
                      <td className="p-3 text-right pr-4">
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* INCIDENTS & SANCTION PROCEDURES TAB */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Registre des Sinistres, Enquêtes & Sanctions</h3>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="flex items-center gap-1.5 p-1.5 px-3 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Déclarer un accident / sinistre</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {displayIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12">Aucun sinistre répertorié. Bravo pour la vigilance de vos agents.</p>
            ) : (
              displayIncidents.map(inc => (
                <div key={inc.id} className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between border-b pb-3 border-slate-100 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-rose-800 flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          Sinistre du {inc.date}
                        </strong>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                          inc.severity === 'High' ? 'bg-red-100 text-red-800' :
                          inc.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          Gravité {inc.severity === 'High' ? 'CRITIQUE / FAUTE GRAVE' : inc.severity === 'Medium' ? 'MOYENNE' : 'LOGISTIQUE MINEURE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-550 mt-1">
                        Véhicule : <strong className="text-slate-800">{inc.vehicleLabel}</strong> • Chauffeur : <strong className="text-slate-800">{inc.driverName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={inc.status}
                        onChange={e => updateIncidentStatus(inc.id, e.target.value as any)}
                        className="text-[10px] p-1.5 border border-slate-200 bg-white rounded font-bold cursor-pointer"
                      >
                        <option value="Reported">Déclaré</option>
                        <option value="UnderInquiry">Enquête active</option>
                        <option value="Resolved">Clos / Résolu</option>
                      </select>

                      <button
                        onClick={() => deleteIncident(inc.id)}
                        className="p-1 px-2 border border-slate-200 hover:text-rose-600 hover:bg-rose-50 text-slate-405 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>

                  {/* Core logs content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    {/* Colliding/impact description */}
                    <div className="p-3 bg-red-50/40 border border-slate-100 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black uppercase text-red-800">1. Description des faits</h4>
                      <p className="text-slate-700 leading-normal italic">« {inc.description} »</p>
                    </div>

                    {/* Safety inquiry report */}
                    <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>2. Enquête Chauffeur (Audition)</span>
                      </h4>
                      <textarea
                        defaultValue={inc.safetyInquiry}
                        placeholder="Rédiger ici le compte-rendu d'audition d'enquête de sécurité..."
                        onBlur={e => updateIncidentDetails(inc.id, e.target.value, inc.sanctionsApplied)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded min-h-[75px] focus:outline-none placeholder-slate-400 text-slate-700"
                      />
                    </div>

                    {/* Disciplinary / financial sanctions */}
                    <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black uppercase text-indigo-850 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                        <span>3. Sanctions / Fautes graves</span>
                      </h4>
                      <textarea
                        defaultValue={inc.sanctionsApplied}
                        placeholder="Avertissement, retenue sur indemnité de transport de l'Art 11..."
                        onBlur={e => updateIncidentDetails(inc.id, inc.safetyInquiry, e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded min-h-[75px] focus:outline-none placeholder-slate-400 text-slate-700"
                      />
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 1. VEHICLE CREATION MODAL */}
      {/* ============================================== */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-indigo-600" />
                <span>Nouveau véhicule logistique</span>
              </h3>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg uppercase font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Peugeot, Dacia"
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                    value={newVehicle.brand}
                    onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Modèle *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Partner, Clio 5"
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                    value={newVehicle.model}
                    onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Numéro Carte Grise / Matricule *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: 228 TUN 4091"
                  className="w-full text-xs p-2 border border-slate-200 rounded font-mono font-bold uppercase focus:outline-none"
                  value={newVehicle.registrationNumber}
                  onChange={e => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date d'achat</label>
                  <input
                    type="date"
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                    value={newVehicle.purchaseDate}
                    onChange={e => setNewVehicle({ ...newVehicle, purchaseDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Prix Achat (DT) *</label>
                  <input
                    type="number"
                    required
                    step="0.100"
                    placeholder="62000.000"
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none font-mono"
                    value={newVehicle.purchasePrice || ''}
                    onChange={e => setNewVehicle({ ...newVehicle, purchasePrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Statut initial</label>
                <select
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                  value={newVehicle.status}
                  onChange={e => setNewVehicle({ ...newVehicle, status: e.target.value as any })}
                >
                  <option value="Active">En circulation opérationnelle</option>
                  <option value="UnderRepair">Au garage pour diagnostic / Entretien</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Chauffeur / Agent attitré (Optionnel)</label>
                <select
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                  value={newVehicle.assignedToEmployeeId}
                  onChange={e => setNewVehicle({ ...newVehicle, assignedToEmployeeId: e.target.value })}
                >
                  <option value="">-- Aucun chauffeur attitré (Véhicule de pool) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jobTitle || 'Collaborateur'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 2. DECLARE VEHICLE SALE POPUP */}
      {/* ============================================== */}
      {sellingVehicleId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-xs font-black uppercase text-slate-800 border-b pb-2">Déclarer la cession du véhicule</h4>
            <form onSubmit={processVehicleSaleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date de vente officielle</label>
                <input
                  type="date"
                  required
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                  value={saleDate}
                  onChange={e => setSaleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Montant de vente (DT) *</label>
                <input
                  type="number"
                  required
                  step="0.001"
                  className="w-full text-xs p-2 border border-slate-200 rounded font-mono font-bold"
                  value={salePrice || ''}
                  onChange={e => setSalePrice(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSellingVehicleId(null)}
                  className="p-1.5 px-3 bg-slate-150 rounded cursor-pointer text-slate-650"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                >
                  Acter la cession
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 3. MISSION ORDER MODAL */}
      {/* ============================================== */}
      {isMissionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Nouveau transport / Ordre de mission</span>
              </h3>
              <button onClick={() => setIsMissionModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg uppercase font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleAddMission} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Collaborateur assigné *</label>
                <select
                  required
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white focus:outline-none"
                  value={newMission.employeeId}
                  onChange={e => setNewMission({ ...newMission, employeeId: e.target.value })}
                >
                  <option value="">Sélectionner l'agent...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Moyen de locomotion *</label>
                  <select
                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white font-semibold focus:ring-1 focus:ring-indigo-500"
                    value={newMission.transportType}
                    onChange={e => setNewMission({ ...newMission, transportType: e.target.value as any, vehicleId: '' })}
                  >
                    <option value="CompanyCar">🚘 Voiture du parc auto</option>
                    <option value="Other">✈️ Autre Moyen (Public/Ligne)</option>
                  </select>
                </div>

                {newMission.transportType === 'Other' ? (
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Type de transport alternatif *</label>
                    <select
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white font-semibold"
                      value={newMission.otherTransportLabel}
                      onChange={e => setNewMission({ ...newMission, otherTransportLabel: e.target.value })}
                    >
                      <option value="Train">🚆 Train (SNCFT)</option>
                      <option value="Louage">🚐 Louage / Ligne inter-villes</option>
                      <option value="Avion">✈️ Vol national / Avion</option>
                      <option value="Taxi">🚖 Taxi collectif / Course</option>
                      <option value="Bus">🚌 Ligne de Bus</option>
                      <option value="Autre">💼 Autre transport</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Véhicule requis du parc *</label>
                    <select
                      required={newMission.transportType === 'CompanyCar'}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={newMission.vehicleId}
                      onChange={e => setNewMission({ ...newMission, vehicleId: e.target.value })}
                    >
                      <option value="">Sélectionner un véhicule...</option>
                      {displayVehicles.filter(v => v.status === 'Active').map(v => (
                        <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registrationNumber})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {newMission.transportType === 'CompanyCar' && newMission.vehicleId && newMission.departureDateTime && newMission.returnDateTime && (() => {
                const check = checkVehicleAvailability(newMission.vehicleId, newMission.departureDateTime, newMission.returnDateTime);
                return (
                  <div className={`p-2.5 rounded-lg border text-[11px] font-bold ${check.available ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-rose-50 text-rose-800 border-rose-150 animate-pulse'}`}>
                    <span>{check.available ? "✓ Véhicule : " : "⚠️ Véhicule : "}{check.reason}</span>
                  </div>
                );
              })()}

              {newMission.employeeId && newMission.departureDateTime && newMission.returnDateTime && (() => {
                const empCheck = checkEmployeeAvailability(newMission.employeeId, newMission.departureDateTime, newMission.returnDateTime);
                return (
                  <div className={`p-2.5 rounded-lg border text-[11px] font-bold ${empCheck.available ? 'bg-indigo-50 text-indigo-900 border-indigo-150' : 'bg-amber-50 text-amber-900 border-amber-200 animate-pulse'}`}>
                    <span>{empCheck.available ? "✓ Chauffeur/Salarié : " : "⚠️ Chauffeur/Salarié : "}{empCheck.reason}</span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Destination nationale / internationale *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Sfax (Dépôt Commercial) / Tunis-Carthage"
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  value={newMission.destination}
                  onChange={e => setNewMission({ ...newMission, destination: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date et Heure Sortie *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                    value={newMission.departureDateTime}
                    onChange={e => setNewMission({ ...newMission, departureDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date et Heure Retour *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                    value={newMission.returnDateTime}
                    onChange={e => setNewMission({ ...newMission, returnDateTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Objet opérationnel de la mission *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ex: Livraison des factures douanières et négociation du renouvellement de contrat..."
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  value={newMission.purpose}
                  onChange={e => setNewMission({ ...newMission, purpose: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1 flex items-center justify-between">
                  <span>Avance sur frais accordée (DT)</span>
                  <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">Compte 4214</span>
                </label>
                <input
                  type="number"
                  step="0.100"
                  min="0"
                  placeholder="ex: 250.000 (Avance versée au départ)"
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-indigo-950 bg-indigo-50/20"
                  value={newMission.allowancesGranted || ''}
                  onChange={e => setNewMission({ ...newMission, allowancesGranted: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-[9.5px] text-slate-400 mt-1 italic">
                  L'avance sera comptabilisée au Débit du compte 4214 (Personnel - Avances) et déduite automatiquement lors de la clôture (R = J - A).
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Statut Initial</label>
                <select
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                  value={newMission.status}
                  onChange={e => setNewMission({ ...newMission, status: e.target.value as any })}
                >
                  <option value="Approved">Autorisé et actif immédiatement</option>
                  <option value="Draft">Brouillon (À valider plus tard)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsMissionModalOpen(false)}
                  className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                >
                  Générer ordre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 4. EXPENSE / REPAIR ENTRY MODAL */}
      {/* ============================================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-100" />
                <span>Nouveau justificatif d'achat / frais</span>
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-405 font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                  value={newExpense.date}
                  onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Véhicule cible *</label>
                <select
                  required
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                  value={newExpense.vehicleId}
                  onChange={e => setNewExpense({ ...newExpense, vehicleId: e.target.value })}
                >
                  <option value="">Affecter à un véhicule...</option>
                  {displayVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Catégorie Dépense *</label>
                  <select
                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  >
                    <option value="GasolineBonus">Bon Essence / Carburant</option>
                    <option value="Insurance">Acompte / Prime Assurance</option>
                    <option value="Vignette">Droit circulation / Vignette</option>
                    <option value="Toll">Péage de l'autoroute</option>
                    <option value="SpareParts">Pieces de recharge</option>
                    <option value="MechanicLabor">M.O. mécanicien</option>
                    <option value="PanelBeaterInvoice">Facture Tôlerie</option>
                    <option value="Other">Autre frais lié</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Montant TTC (DT) *</label>
                  <input
                    type="number"
                    required
                    step="0.001"
                    placeholder="150.000"
                    className="w-full text-xs p-2 border border-slate-200 rounded font-mono"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Raison sociale / Prestataire</label>
                  <input
                    type="text"
                    placeholder="ex: Total Charguia, Recette Finance"
                    className="w-full text-xs p-2 border border-slate-200 rounded"
                    value={newExpense.providerName}
                    onChange={e => setNewExpense({ ...newExpense, providerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">N° de Facture / Pièce</label>
                  <input
                    type="text"
                    placeholder="ex: REC_699120"
                    className="w-full text-xs p-2 border border-slate-200 rounded font-mono"
                    value={newExpense.invoiceNb}
                    onChange={e => setNewExpense({ ...newExpense, invoiceNb: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Notes descriptives</label>
                <input
                  type="text"
                  placeholder="Justification optionnelle..."
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                  value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 5. INCIDENT / SINISTRE ALIGNMENT MODAL */}
      {/* ============================================== */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Nouveau sinistre chauffeur</span>
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg uppercase font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleAddIncident} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date de l'accident *</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs p-2 border border-slate-200 rounded"
                    value={newIncident.date}
                    onChange={e => setNewIncident({ ...newIncident, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gravité *</label>
                  <select
                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    value={newIncident.severity}
                    onChange={e => setNewIncident({ ...newIncident, severity: e.target.value as any })}
                  >
                    <option value="Low">Mineure (Rayure, froissement léger)</option>
                    <option value="Medium">Moyenne (Matériel impliqué)</option>
                    <option value="High">Critique (Grave indiscipline / Dommages corporels ou matériels majeurs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Chauffeur en cause *</label>
                  <select
                    required
                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    value={newIncident.employeeId}
                    onChange={e => setNewIncident({ ...newIncident, employeeId: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Véhicule accidenté *</label>
                  <select
                    required
                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    value={newIncident.vehicleId}
                    onChange={e => setNewIncident({ ...newIncident, vehicleId: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {displayVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registrationNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description initiale des dégâts *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ex: Perte de contrôle sur voie humide, froissement du pare-chocs avant gauche..."
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  value={newIncident.description}
                  onChange={e => setNewIncident({ ...newIncident, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Dossier enquête Chauffeur (Audition d'exploitation)</label>
                <textarea
                  rows={2}
                  placeholder="Notez ici les premiers éléments d'aveu, vitesse estimée ou état d'excès..."
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  value={newIncident.safetyInquiry}
                  onChange={e => setNewIncident({ ...newIncident, safetyInquiry: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sanctions décidées par Elyssa S.A. en cas de faute grave</label>
                <textarea
                  rows={1.5}
                  placeholder="ex: Avertissement avec inscription au portefeuille de licenciement disciplinaire..."
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none"
                  value={newIncident.sanctionsApplied}
                  onChange={e => setNewIncident({ ...newIncident, sanctionsApplied: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                >
                  Quitter
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-rose-650 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
                >
                  Acter l'accident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. IMMERSIVE PHYSICAL PRINT SHEET VIEW FOR MISSION ORDER */}
      {/* ========================================================= */}
      {printedMission && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[90] overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 space-y-6 shadow-2xl relative text-slate-800 font-serif">
            
            {/* Top print/close buttons bar */}
            <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    alert("Utilisez Ctrl+P pour lancer l'impression s'il vous plaît.");
                  }
                }}
                className="p-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer l'Ordre</span>
              </button>
              <button
                onClick={() => setPrintedMission(null)}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>

            {/* Official Letterhead */}
            <div className="border-b-4 border-double border-slate-850 pb-4 text-center md:text-left">
              <span className="block text-xs font-sans tracking-widest font-black uppercase text-indigo-700">CARTHAGE S.A. LOGISTIQUE</span>
              <h1 className="text-xl font-black font-sans uppercase tracking-tight text-slate-900 mt-1">SOCIETE TUNISIENNE CARTHAGE S.A.</h1>
              <p className="text-[10px] font-sans text-slate-500 mt-1 uppercase">Zone Industrielle Aéroportuaire Charguia II, Tunis • R.C. TN-1094852</p>
            </div>

            <div className="space-y-4">
              <div className="text-center bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <h2 className="text-sm font-black font-sans uppercase tracking-wider text-slate-800">
                  ORDRE DE MISSION DE SERVICE OFFICIEL
                </h2>
                <span className="text-[10px] font-sans text-slate-500 block mt-0.5">N° OM-ELYSSA-2026-{printedMission.id.slice(-5)}</span>
              </div>

              {/* Authority letter context */}
              <p className="text-xs leading-relaxed">
                Il est ordonné par le présent écrit de mission de service au collaborateur sousmentionné de se rendre avec le véhicule logistique désigné de Elyssa S.A. à la destination désignée afin d'assurer les intérêts professionnels et l'objet de service mentionné.
              </p>

              {/* Grid content */}
              <div className="border border-slate-200 rounded-xl overflow-hidden font-sans text-xs">
                <div className="grid grid-cols-2 border-b border-slate-200">
                  <div className="p-3 border-r border-slate-200">
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">NOM DU COLLABORATEUR / CHAUFFEUR</span>
                    <strong className="text-slate-800">{printedMission.employeeName}</strong>
                  </div>
                  <div className="p-3">
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">MOYEN DE LOCOMOTION SELECTIONNÉ</span>
                    <strong className="text-slate-800 font-mono uppercase">
                      {printedMission.transportType === 'CompanyCar' ? `🚘 Flotte : ${printedMission.vehicleLabel}` : `✈️ Public : ${printedMission.otherTransportLabel}`}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-slate-200">
                  <div className="p-3 border-r border-slate-200">
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">DESTINATION COMMANDEE</span>
                    <strong className="text-slate-800">{printedMission.destination}</strong>
                  </div>
                  <div className="p-3">
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">STATUS DU DEPLACEMENT</span>
                    <strong className="text-slate-800 uppercase font-bold">{printedMission.status === 'Completed' ? 'RETOUR EFFECTUÉ CONFORME' : 'AUTORISATION SORTIE ACCORDÉE'}</strong>
                  </div>
                </div>

                <div className="p-3 border-b border-slate-200 bg-slate-50/20">
                  <span className="block text-[8.5px] uppercase font-bold text-slate-400">OBJET DU DEPLACEMENT PROFESSIONNEL DE SERVICE</span>
                  <p className="text-slate-700 font-serif italic mt-1 font-medium">« {printedMission.purpose} »</p>
                </div>

                <div className="grid grid-cols-2 bg-slate-100/30">
                  <div className="p-3 border-r border-slate-200 font-mono text-[10.5px]">
                    <span className="block text-[8.5px] font-sans uppercase font-bold text-slate-400">DATE & HEURE SORTIE (DÉPART)</span>
                    <strong>{(printedMission.departureDateTime || '').replace('T', ' à ')}</strong>
                  </div>
                  <div className="p-3 font-mono text-[10.5px]">
                    <span className="block text-[8.5px] font-sans uppercase font-bold text-slate-400">DATE & HEURE ENTRÉE (RETOUR EFF.)</span>
                    <strong>{(printedMission.returnDateTime || '').replace('T', ' à ')}</strong>
                  </div>
                </div>
              </div>

              {/* Financial travel expenditures recap */}
              {(printedMission.expenses || []).length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 font-sans bg-slate-50 border-dashed text-xs">
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-2">Décompte Justificatif des Dépenses de Mission & Indemnités</span>
                  <div className="space-y-1.5">
                    {(printedMission.expenses || []).map(item => (
                      <div key={item.id} className="flex justify-between items-center text-slate-700 font-mono">
                        <span>
                          {item.category === 'Hotel' ? '🏨 Hébergement / Hôtel' :
                           item.category === 'Food' ? '🍽️ Repas / Nourriture' :
                           item.category === 'Visa' ? '🎫 Visa / Consulaire' :
                           item.category === 'Flight' ? '✈️ Billet d\'Avion' :
                           item.category === 'Train' ? '🚆 Train SNCFT' :
                           item.category === 'Louage' ? '🚐 Louage inter-villes' :
                           item.category === 'Taxi' ? '🚖 Taxi / Bus / Transport urbain' : '💼 Autre charge'} — {item.description}
                        </span>
                        <span className="font-extrabold text-slate-800">{(Number(item?.amount) || 0).toFixed(3)} DT</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between items-center text-xs font-black">
                      <span className="uppercase">TOTAL DES CHARGES ATRIBUÉES À LA MISSION :</span>
                      <span className="text-indigo-750 font-mono font-black text-sm bg-indigo-50 p-1 px-2.5 rounded border border-indigo-150">
                        {(printedMission.expenses || []).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0).toFixed(3)} DT
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning guidelines */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10.5px] font-sans text-amber-900 mt-4 leading-normal">
                <strong>Attention importante au conducteur :</strong> Ce bon doit être signé au départ et à l'entrée par la direction. Les infractions au droit de la route tunisien (vitesse, stationnement) ou accidents sans constat de police ou de tiers restent sous la pleine et entière responsabilité civile et pénale de l'agent commissionné en cas de faute grave de diligence.
              </div>

              {/* Dual signature board */}
              <div className="grid grid-cols-2 pt-12 text-center text-xs font-sans gap-6 pb-4">
                <div>
                  <span className="block text-[10px] uppercase font-extrabold text-slate-400 mb-8">Visa de l'Agent / Conducteur</span>
                  <p className="font-bold underline text-[11px]">{printedMission.employeeName}</p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-extrabold text-slate-400 mb-8">Pour la Direction de Elyssa S.A.</span>
                  <p className="font-bold text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <span>Le Directeur Financier</span>
                  </p>
                  <p className="text-[9px] text-indigo-700 italic font-mono mt-1">Signé Numériquement (Port 3000)</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
