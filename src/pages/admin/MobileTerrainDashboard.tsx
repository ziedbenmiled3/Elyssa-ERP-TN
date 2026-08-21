import React, { useState, useMemo, useEffect } from 'react';
import { 
  Smartphone, 
  MapPin, 
  ShoppingCart, 
  FileCheck2, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Battery, 
  Truck, 
  Building2, 
  Eye, 
  FileText, 
  UserCheck, 
  Download, 
  Layers,
  Map as MapIcon,
  X,
  ChevronRight,
  AlertTriangle,
  Phone,
  DollarSign,
  Calendar,
  Users,
  Boxes,
  Package
} from 'lucide-react';
import { useMobileAdmin } from '../../hooks/useMobileAdmin';
import { MobileDevice, FieldSession, MobileOrder, ChantierReport, AssignedModule, FleetInventoryItem, FleetDeviceStatus } from '../../types/mobileTerrain';
import { MobileAgentContainer } from '../../mobile/views/MobileAgentContainer';
import { FieldAgentsMap } from '../../components/admin/FieldAgentsMap';

interface MobileTerrainDashboardProps {
  tenantId?: string;
  employees?: any[];
  vehicles?: any[];
  missions?: any[];
  onNavigateToInvoice?: (order: MobileOrder) => void;
  isDemoTenant?: boolean;
}

const DEFAULT_EMPLOYEES_LIST = [
  { id: 'EMP-904', name: 'Sami Ben Ali', jobTitle: 'Commercial IT (Van Sales)', department: 'Commercial & Distribution', phone: '+216 98 123 456' },
  { id: 'EMP-912', name: 'Mohamed Trabelsi', jobTitle: 'Chef de Chantier BTP', department: 'Operations Chantier', phone: '+216 22 987 654' },
  { id: 'EMP-920', name: 'Youssef Mansour', jobTitle: 'Chauffeur Livreur', department: 'Logistique Van Sales', phone: '+216 55 432 109' },
  { id: 'EMP-935', name: 'Karem Chaabane', jobTitle: 'Technicien de Maintenance Itinérant', department: 'Services Techniques', phone: '+216 97 654 321' },
  { id: 'EMP-942', name: 'Fatma Gharbi', jobTitle: 'Inspectrice Qualité Terrain', department: 'Assurance Qualité', phone: '+216 29 111 222' }
];

const DEFAULT_VEHICLES_LIST = [
  { id: 'demo-v_904', brand: 'Isuzu', model: 'D-Max Camionette', registrationNumber: '240 TN 8812', assignedToEmployeeId: 'EMP-904' },
  { id: 'demo-v_912', brand: 'Toyota', model: 'Hilux Pick-Up', registrationNumber: '198 TN 4410', assignedToEmployeeId: 'EMP-912' },
  { id: 'demo-v_920', brand: 'Peugeot', model: 'Boxer Fourgon', registrationNumber: '215 TN 1092', assignedToEmployeeId: 'EMP-920' },
  { id: 'demo-v_935', brand: 'Citroën', model: 'Berlingo Van', registrationNumber: '201 TN 6621', assignedToEmployeeId: 'EMP-935' },
  { id: 'demo-v_942', brand: 'Renault', model: 'Clio 5', registrationNumber: '228 TN 3301', assignedToEmployeeId: 'EMP-942' }
];

export const MobileTerrainDashboard: React.FC<MobileTerrainDashboardProps> = ({ 
  tenantId = 'Inter-Affaires',
  employees = [],
  vehicles = [],
  missions = [],
  onNavigateToInvoice,
  isDemoTenant = false
}) => {
  const { 
    devices, 
    fleetInventory,
    sessions, 
    orders, 
    reports, 
    loading, 
    approveDevice, 
    blockDevice, 
    resetDeviceSync, 
    registerDevice, 
    addFleetItem,
    updateFleetItemStatus,
    validateOrder, 
    approveReport 
  } = useMobileAdmin(tenantId, isDemoTenant);

  // Sync / Inject Demo mobile devices into localStorage if empty in Demo mode
  useEffect(() => {
    if (isDemoTenant) {
      try {
        const rawLocal = localStorage.getItem('carthage_mobile_devices');
        const localList = rawLocal ? JSON.parse(rawLocal) : [];
        if (!Array.isArray(localList) || localList.length === 0) {
          const todayDateStr = new Date().toISOString().split('T')[0];
          const demoTerminals = [
            {
              id: 'trial-fleet-dev-1',
              type: 'Tablette',
              brand: 'Samsung',
              model: 'Samsung Galaxy Tab Active 4 Pro',
              serialNumber: 'SAM-TAB4-TN-00345',
              assignedToId: 'demo-emp_4',
              assignedToName: 'Mohamed Ali Gharbi',
              pole: 'Commercial & Vente',
              status: 'Actif',
              lastSync: `${todayDateStr} 09:15`,
              batteryLevel: 94
            },
            {
              id: 'trial-fleet-dev-2',
              type: 'Terminal Durci PDA',
              brand: 'Zebra',
              model: 'Zebra TC57 Touch Computer',
              serialNumber: 'ZEB-TC57-TN-00812',
              assignedToId: 'demo-emp_7',
              assignedToName: 'Hamza Ben Salem',
              pole: 'Logistique & Livraisons',
              status: 'Actif',
              lastSync: `${todayDateStr} 08:30`,
              batteryLevel: 88
            }
          ];
          localStorage.setItem('carthage_mobile_devices', JSON.stringify(demoTerminals));
        }
      } catch (e) {
        console.error('Error seeding demo mobile devices:', e);
      }
    }
  }, [isDemoTenant]);

  // Active Tab state: 'fleet' | 'sessions' | 'validation'
  const [activeTab, setActiveTab] = useState<'fleet' | 'sessions' | 'validation'>('fleet');
  const [showMobileAgentScreen, setShowMobileAgentScreen] = useState(false);

  // Fleet tab states
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED'>('ALL');
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedFleetItemId, setSelectedFleetItemId] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newAssignedModule, setNewAssignedModule] = useState<AssignedModule>('standard');
  const [newPhone, setNewPhone] = useState('');

  // MDM Parc states
  const [mdmSearch, setMdmSearch] = useState('');
  const [mdmParkFilter, setMdmParkFilter] = useState<string>('ALL');
  const [mdmStatusFilter, setMdmStatusFilter] = useState<string>('ALL');
  const [showAddFleetModal, setShowAddFleetModal] = useState(false);
  const [newFleetPark, setNewFleetPark] = useState<string>('Stock Réserve');
  const [newFleetCustomPark, setNewFleetCustomPark] = useState<string>('');
  const [newFleetDeviceName, setNewFleetDeviceName] = useState<string>('');
  const [newFleetSerialRef, setNewFleetSerialRef] = useState<string>('');

  // Sessions tab states
  const [selectedSession, setSelectedSession] = useState<FieldSession | null>(null);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<'ALL' | 'VAN_SALES' | 'CHANTIER'>('ALL');

  // Validation tab states
  const [selectedOrder, setSelectedOrder] = useState<MobileOrder | null>(null);
  const [selectedReport, setSelectedReport] = useState<ChantierReport | null>(null);
  const [validationSubTab, setValidationSubTab] = useState<'orders' | 'reports'>('orders');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Toast feedback
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Fleet stats
  const activeDevicesCount = useMemo(() => devices.filter(d => d.status === 'ACTIVE').length, [devices]);
  const pendingDevicesCount = useMemo(() => devices.filter(d => d.status === 'PENDING').length, [devices]);
  const blockedDevicesCount = useMemo(() => devices.filter(d => d.status === 'BLOCKED').length, [devices]);

  // Session stats
  const openSessions = useMemo(() => sessions.filter(s => s.status === 'OPEN'), [sessions]);
  const vanSalesCount = useMemo(() => openSessions.filter(s => s.type === 'VAN_SALES').length, [openSessions]);
  const chantierCount = useMemo(() => openSessions.filter(s => s.type === 'CHANTIER').length, [openSessions]);

  // Order stats
  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'PENDING_VALIDATION').length, [orders]);
  const totalOrdersHT = useMemo(() => orders.reduce((sum, o) => sum + o.totalHT, 0), [orders]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchSearch = (d.agentName || '').toLowerCase().includes(deviceSearch.toLowerCase()) ||
                          (d.deviceModel || '').toLowerCase().includes(deviceSearch.toLowerCase()) ||
                          (d.id || '').toLowerCase().includes(deviceSearch.toLowerCase());
      const matchStatus = deviceStatusFilter === 'ALL' || d.status === deviceStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [devices, deviceSearch, deviceStatusFilter]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return openSessions.filter(s => {
      if (sessionTypeFilter === 'ALL') return true;
      return s.type === sessionTypeFilter;
    });
  }, [openSessions, sessionTypeFilter]);

  // MDM Fleet Stats
  const availableFleetCount = useMemo(() => fleetInventory.filter(f => f.status === 'Available').length, [fleetInventory]);
  const assignedFleetCount = useMemo(() => fleetInventory.filter(f => f.status === 'Assigned').length, [fleetInventory]);
  const maintenanceFleetCount = useMemo(() => fleetInventory.filter(f => f.status === 'Maintenance').length, [fleetInventory]);
  const decommissionedFleetCount = useMemo(() => fleetInventory.filter(f => f.status === 'Decommissioned').length, [fleetInventory]);

  // Filter stock MDM for mobile device assignment (Smart Filter: ONLY mobile terminals/smartphones/tablets)
  const availableFleetItems = useMemo(() => {
    return fleetInventory.filter(f => {
      if (f.status !== 'Available') return false;
      const cat = (f.category || 'Terminal Mobile').toLowerCase();
      return cat.includes('mobile') || cat.includes('smartphone') || cat.includes('tablette') || cat.includes('pocket');
    });
  }, [fleetInventory]);

  const filteredFleetInventory = useMemo(() => {
    return fleetInventory.filter(item => {
      const matchPark = mdmParkFilter === 'ALL' || item.fleet_park === mdmParkFilter;
      const matchStatus = mdmStatusFilter === 'ALL' || item.status === mdmStatusFilter;
      const matchSearch = (item.device_name || '').toLowerCase().includes(mdmSearch.toLowerCase()) ||
                          (item.serial_reference || '').toLowerCase().includes(mdmSearch.toLowerCase()) ||
                          (item.assignedTo || '').toLowerCase().includes(mdmSearch.toLowerCase()) ||
                          (item.fleet_park || '').toLowerCase().includes(mdmSearch.toLowerCase());
      return matchPark && matchStatus && matchSearch;
    });
  }, [fleetInventory, mdmParkFilter, mdmStatusFilter, mdmSearch]);

  const handleAddFleetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFleetDeviceName || !newFleetSerialRef) {
      showToast('Veuillez spécifier le modèle et le numéro de série / IMEI.', 'error');
      return;
    }

    const finalPark = newFleetPark === 'AUTRE' ? (newFleetCustomPark || 'Stock Réserve') : newFleetPark;

    addFleetItem({
      fleet_park: finalPark,
      device_name: newFleetDeviceName,
      serial_reference: newFleetSerialRef,
      status: 'Available'
    });

    showToast(`Terminal ${newFleetDeviceName} (${newFleetSerialRef}) ajouté au parc MDM (${finalPark}).`, 'success');
    setShowAddFleetModal(false);
    setNewFleetDeviceName('');
    setNewFleetSerialRef('');
    setNewFleetPark('Stock Réserve');
    setNewFleetCustomPark('');
  };

  const handleCreateDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName) {
      showToast('Veuillez sélectionner un collaborateur RH.', 'error');
      return;
    }

    const moduleLabels: Record<AssignedModule, string> = {
      standard: 'Standard (Pointage uniquement)',
      chantier: 'Mission Chantier',
      vente: 'Mission Vente',
      polyvalent: 'Polyvalent (Chantier & Vente)',
      livraison: 'Mission Livraison (Chauffeur / Dispatch)'
    };
    const deviceModelLabel = newDeviceModel || `Terminal Mobile (${moduleLabels[newAssignedModule]})`;

    registerDevice({
      agentId: newAgentId || `EMP-${Date.now()}`,
      agentName: newAgentName,
      vehicleId: newVehicleId || undefined,
      deviceModel: deviceModelLabel,
      assigned_module: newAssignedModule,
      phoneNumber: newPhone,
      fleetItemId: selectedFleetItemId || undefined
    });

    showToast(`Terminal associé avec succès à ${newAgentName} (Affectation: ${moduleLabels[newAssignedModule]}).`, 'success');
    setShowAddDeviceModal(false);
    setNewAgentName('');
    setNewAgentId('');
    setNewVehicleId('');
    setNewDeviceModel('');
    setNewAssignedModule('standard');
    setNewPhone('');
    setSelectedFleetItemId('');
  };

  if (showMobileAgentScreen) {
    return (
      <MobileAgentContainer 
        tenantId={tenantId} 
        onBackToErp={() => setShowMobileAgentScreen(false)} 
      />
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 w-full max-w-[1800px] mx-auto font-sans text-slate-800" id="mobile-terrain-admin-root">
      
      {/* Toast Notification */}
      {actionToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center space-x-3 transition-all animate-bounce ${
          actionToast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
          actionToast.type === 'error' ? 'bg-red-900 text-red-100 border-red-700' :
          'bg-indigo-900 text-indigo-100 border-indigo-700'
        }`} id="mobile-admin-toast">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold font-sans">{actionToast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 pointer-events-none">
          <Smartphone className="w-80 h-80 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Elyssa ERP • Module Suivi Terrain & Flotte
              </span>
              {pendingDevicesCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse font-mono">
                  ⚠️ {pendingDevicesCount} Terminal(x) en attente
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-display">
              Administration de la Flotte Mobile & Suivi Terrain
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Supervision en temps réel des terminaux mobiles (`mobile_devices`), géolocalisation des agents sur le terrain (`field_sessions`), validation des bons de commande hors-ligne et rapports de chantier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowMobileAgentScreen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer border-0"
              id="btn-open-mobile-terminal-agent"
            >
              <Smartphone className="w-4 h-4 text-indigo-200" />
              <span>Ouvrir Terminal Mobile Agent</span>
            </button>

            <button
              onClick={() => setShowAddDeviceModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer border-0"
              id="btn-add-device-top"
            >
              <Plus className="w-4 h-4" />
              <span>Associer un Terminal</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flotte de Terminaux</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black text-white">{devices.length}</span>
                <span className="text-[10px] font-extrabold text-emerald-400">({activeDevicesCount} Actifs)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sessions Terrain Actives</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black text-white">{openSessions.length}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">({vanSalesCount} Sales / {chantierCount} Logistique)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commandes Offline</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black text-white">{orders.length}</span>
                <span className="text-[10px] font-bold text-amber-400">({pendingOrdersCount} à valider)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rapports Reçus</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black text-white">{reports.length}</span>
                <span className="text-[10px] font-bold text-slate-400">reçu(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1" id="mobile-admin-tabs-nav">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border shrink-0 ${
            activeTab === 'fleet'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
          id="tab-btn-fleet"
        >
          <Smartphone className="w-4 h-4" />
          <span>Terminaux Affectés ({devices.length})</span>
          {pendingDevicesCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
              {pendingDevicesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border shrink-0 ${
            activeTab === 'sessions'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
          id="tab-btn-sessions"
        >
          <MapPin className="w-4 h-4" />
          <span>Suivi Sessions & GPS ({openSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border shrink-0 ${
            activeTab === 'validation'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
          id="tab-btn-validation"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Validation Commandes & Rapports ({pendingOrdersCount})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1: GESTION DE LA FLOTTE */}
      {/* ========================================================================= */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-fadeIn" id="mobile-admin-tab-fleet">
          
          {/* Controls bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par agent, modèle, ID..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  id="input-device-search"
                />
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'ACTIVE', 'PENDING', 'BLOCKED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setDeviceStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                      deviceStatusFilter === status 
                        ? 'bg-white text-indigo-700 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {status === 'ALL' ? 'Tous' : status}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddDeviceModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-sm transition cursor-pointer shrink-0"
              id="btn-open-modal-add-device"
            >
              <Plus className="w-4 h-4" />
              <span>Associer un Nouveau Terminal</span>
            </button>
          </div>

          {/* Devices Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                  Liste des Terminaux Enregistrés (`mobile_devices`)
                </h3>
                <p className="text-xs text-slate-500">
                  {filteredDevices.length} terminal(x) correspondant aux critères.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 font-bold">
                Tenant: {tenantId}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left border-collapse" id="table-mobile-devices">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-4 py-3.5 min-w-[200px]">Agent Terrain</th>
                    <th className="px-4 py-3.5 min-w-[170px]">Affectation Module</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Modèle / Infos</th>
                    <th className="px-4 py-3.5 min-w-[120px]">Batterie / OS</th>
                    <th className="px-4 py-3.5 min-w-[160px]">Dernière Synchro</th>
                    <th className="px-4 py-3.5 min-w-[100px]">Statut</th>
                    <th className="px-4 py-3.5 text-right min-w-[260px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-mono text-xs">
                        Aucun terminal trouvé dans cette catégorie.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map(device => {
                      const isPending = device.status === 'PENDING';
                      const isActive = device.status === 'ACTIVE';
                      const isBlocked = device.status === 'BLOCKED';

                      return (
                        <tr key={device.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-700 font-black font-display text-xs">
                                {device.agentName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong className="block text-slate-900 font-bold">{device.agentName}</strong>
                                <span className="text-[10px] font-mono text-slate-400 block">ID: {device.agentId} ({device.id})</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {device.assigned_module === 'chantier' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                🚀 Mission Chantier
                              </span>
                            ) : device.assigned_module === 'vente' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                                🛒 Mission Vente
                              </span>
                            ) : device.assigned_module === 'polyvalent' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                ⚡ Polyvalent (Chantier & Vente)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                                Standard (Pointage uniquement)
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block">{device.deviceModel}</span>
                              {device.phoneNumber && (
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {device.phoneNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 font-mono">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                                <Battery className="w-3 h-3 text-emerald-600" />
                                <span>{device.batteryLevel ?? 85}%</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{device.appVersion || 'v2.4'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {device.lastSync
                                  ? (typeof device.lastSync === 'string'
                                    ? new Date(device.lastSync).toLocaleString('fr-FR')
                                    : (device.lastSync instanceof Date ? device.lastSync.toLocaleString('fr-FR') : new Date(device.lastSync).toLocaleString('fr-FR')))
                                  : 'Jamais'}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {isActive && (
                              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>ACTIVE</span>
                              </span>
                            )}
                            {isBlocked && (
                              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>BLOCKED</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span>PENDING</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isPending ? (
                                <button
                                  onClick={() => {
                                    approveDevice(device.id);
                                    showToast(`Terminal de ${device.agentName} validé et activé avec succès.`, 'success');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-xs cursor-pointer"
                                  title="Valider et associer ce terminal"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Valider Terminal</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    blockDevice(device.id);
                                    showToast(
                                      device.status === 'BLOCKED'
                                        ? `Terminal de ${device.agentName} débloqué (ACTIVE).`
                                        : `Terminal de ${device.agentName} bloqué (BLOCKED).`,
                                      device.status === 'BLOCKED' ? 'success' : 'error'
                                    );
                                  }}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer border ${
                                    device.status === 'BLOCKED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  }`}
                                >
                                  {device.status === 'BLOCKED' ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Activer</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                      <span>Bloquer</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  resetDeviceSync(device.id);
                                  showToast(`Synchro réinitialisée pour le terminal de ${device.agentName}.`, 'info');
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
                                title="Réinitialiser le jeton de synchronisation"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Réinit. Synchro</span>
                              </button>
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
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2: SUIVI DES SESSIONS & CARTE GPS */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 animate-fadeIn" id="mobile-admin-tab-sessions">
          
          {/* Top Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                Filtrer les sessions ouvertes (`FIELD_SESSIONS` status: OPEN) :
              </span>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSessionTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                    sessionTypeFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Toutes ({openSessions.length})
                </button>
                <button
                  onClick={() => setSessionTypeFilter('VAN_SALES')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                    sessionTypeFilter === 'VAN_SALES' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Truck className="w-3 h-3" />
                  <span>Van Sales ({vanSalesCount})</span>
                </button>
                <button
                  onClick={() => setSessionTypeFilter('CHANTIER')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                    sessionTypeFilter === 'CHANTIER' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Chantier ({chantierCount})</span>
                </button>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Positions GPS mises à jour en direct via Firebase Firestore
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Sessions List Cards */}
            <div className="space-y-4 lg:col-span-1">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider font-display flex items-center justify-between">
                <span>Agents sur le terrain</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  {filteredSessions.length} Actif(s)
                </span>
              </h3>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredSessions.length === 0 ? (
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center text-slate-400 font-mono text-xs">
                    Aucune session terrain active enregistrée pour ce filtre.
                  </div>
                ) : (
                  filteredSessions.map(session => {
                    const isVanSales = session.type === 'VAN_SALES';
                    const isSelected = selectedSession?.id === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isVanSales ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isVanSales ? <Truck className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">
                                {session.agentName || session.agentId}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                ID Session: {session.id}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            isVanSales
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isVanSales ? 'VAN SALES' : 'CHANTIER'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] font-mono space-y-1">
                          <div className="flex items-center text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-red-500 mr-1 shrink-0" />
                            <span className="truncate">{session.checkIn.address || `${session.checkIn.lat}, ${session.checkIn.lng}`}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 text-[10px]">
                            <span>Lat: {session.checkIn?.lat != null ? session.checkIn.lat.toFixed(4) : '0'}</span>
                            <span>Lng: {session.checkIn?.lng != null ? session.checkIn.lng.toFixed(4) : '0'}</span>
                            <span>
                              {session.checkIn?.timestamp
                                ? (typeof session.checkIn.timestamp === 'string'
                                  ? new Date(session.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : (session.checkIn.timestamp instanceof Date ? session.checkIn.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(session.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))
                                : '--:--'}
                            </span>
                          </div>
                        </div>

                        {session.notes && (
                          <p className="text-[11px] text-slate-600 italic line-clamp-2">
                            "{session.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Col: Synthetic Interactive GPS Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-indigo-600" />
                      <span>Carte de Géolocalisation Synthétique GPS</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Positions en direct des agents sur le réseau routier tunisien (Tunis, Sfax, Nabeul, etc.)
                    </p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    GPS LIVE SYNC
                  </span>
                </div>

                {/* Carte de Géolocalisation Leaflet & CARTO OpenStreetMap */}
                <FieldAgentsMap
                  sessions={filteredSessions}
                  selectedSessionId={selectedSession?.id}
                  onSelectSession={(session) => setSelectedSession(session)}
                />

                {/* Selected Agent Inspection Details Box */}
                {selectedSession && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          Détails Agent Sélectionné
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {selectedSession.agentName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-mono">
                        Dernier pointage : {selectedSession.checkIn.address} ({selectedSession.checkIn.lat}, {selectedSession.checkIn.lng})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => showToast(`Signal de synchronisation envoyé à ${selectedSession.agentName}.`, 'info')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Ping Agent</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3: VALIDATION DES COMMANDES & RAPPORTS */}
      {/* ========================================================================= */}
      {activeTab === 'validation' && (
        <div className="space-y-6 animate-fadeIn" id="mobile-admin-tab-validation">
          
          {/* Sub-tab Switcher */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setValidationSubTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 ${
                  validationSubTab === 'orders'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                id="subtab-btn-orders"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Commandes Offline Mobile (`mobile_orders`) ({orders.length})</span>
              </button>

              <button
                onClick={() => setValidationSubTab('reports')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 ${
                  validationSubTab === 'reports'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                id="subtab-btn-reports"
              >
                <FileText className="w-4 h-4" />
                <span>Rapports de Chantier (`chantier_reports`) ({reports.length})</span>
              </button>
            </div>

            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              Module d'approbation commerciale Elyssa ERP
            </span>
          </div>

          {/* SUB-VIEW 1: COMMANDES MOBILE */}
          {validationSubTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                    Validation des Commandes Terrain Hors-Ligne
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transmises par les agents lors de leurs visites clients en mode offline.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Total HT: {(totalOrdersHT ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left border-collapse" id="table-mobile-orders">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="px-4 py-3.5 min-w-[170px]">N° Commande & Date</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Client</th>
                      <th className="px-4 py-3.5 min-w-[160px]">Agent Terrain</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Articles & Total TTC</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Mode Paiement</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Statut Validation</th>
                      <th className="px-4 py-3.5 text-right min-w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-xs">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-mono">
                          Aucune commande terrain enregistrée.
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => {
                        const isPendingVal = order.status === 'PENDING_VALIDATION' || !order.status;
                        const isValidated = order.status === 'VALIDATED';

                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-mono">
                              <span className="font-bold text-slate-900 block">{order.id}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {order.createdAt
                                  ? (typeof order.createdAt === 'string'
                                    ? new Date(order.createdAt).toLocaleDateString('fr-FR')
                                    : (order.createdAt instanceof Date ? order.createdAt.toLocaleDateString('fr-FR') : new Date(order.createdAt).toLocaleDateString('fr-FR')))
                                  : 'N/A'}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <strong className="text-slate-900 font-bold block">{order.clientName}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {order.clientId}</span>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                                {order.agentName || 'Agent Terrain'}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <span className="font-black text-slate-900 text-sm block font-mono">
                                  {(order.totalTTC ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {order.items?.length || 0} article(s) • HT: {(order.totalHT ?? 0).toLocaleString('fr-FR')} TND
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <span className="font-mono text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {order.paymentMethod || 'ESPÈCES'}
                                </span>
                                <div>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    order.paymentStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {order.paymentStatus === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              {isValidated ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>VALIDÉE (ERP)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>À VALIDER</span>
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
                                  title="Voir le détail de la commande & signature"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Détails</span>
                                </button>

                                {isPendingVal && (
                                  <button
                                    onClick={() => {
                                      validateOrder(order.id, 'VALIDATED');
                                      showToast(`Commande ${order.id} validée et enregistrée dans la facturation ERP.`, 'success');
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Valider</span>
                                  </button>
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
          )}

          {/* SUB-VIEW 2: RAPPORTS DE CHANTIER */}
          {validationSubTab === 'reports' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map(report => (
                  <div 
                    key={report.id} 
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 font-mono uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {report.chantierId}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                          {report.chantierName || 'Chantier BTP'}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          Chef de Chantier: {report.chefChantierName || report.chefChantierId}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        report.status === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {report.status || 'PENDING'}
                      </span>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-sans">Ouvriers Présents</span>
                        <strong className="text-slate-800 text-sm">{report.workersPresent} personnes</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-sans">Matériaux Consommés</span>
                        <strong className="text-indigo-700 text-sm">{report.materialsConsumed.length} référence(s)</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      "{report.notes}"
                    </p>

                    {/* Photos Preview Grid */}
                    {report.photoUrls.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                          Photos de Terrain ({report.photoUrls.length}) :
                        </span>
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                          {report.photoUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Terrain ${i}`}
                              onClick={() => setLightboxImage(url)}
                              className="w-20 h-16 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 transition shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-150 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-400">
                        Date: {report.date ? (typeof report.date === 'string' ? new Date(report.date).toLocaleDateString('fr-FR') : (report.date instanceof Date ? report.date.toLocaleDateString('fr-FR') : new Date(report.date).toLocaleDateString('fr-FR'))) : 'N/A'}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspecter Rapport</span>
                        </button>

                        {report.status !== 'APPROVED' && (
                          <button
                            onClick={() => {
                              approveReport(report.id, 'APPROVED');
                              showToast(`Rapport de chantier ${report.chantierId} approuvé avec succès.`, 'success');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approuver</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSOCIER / VALIDER UN NOUVEAU TERMINAL */}
      {/* ========================================================================= */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="modal-add-device">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-150 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Associer un Terminal Mobile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrer et valider un équipement pour l'agent terrain
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddDeviceModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeviceSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block flex items-center justify-between">
                  <span>Collaborateur RH (MOD-03) *</span>
                  <span className="text-[9px] text-indigo-600 font-normal">Intégrité Référentielle Active</span>
                </label>
                <select
                  required
                  value={newAgentId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setNewAgentId(selectedId);
                    const empList = (employees && employees.length > 0) ? employees : DEFAULT_EMPLOYEES_LIST;
                    const emp = empList.find((x: any) => x.id === selectedId || x.matricule === selectedId);
                    if (emp) {
                      setNewAgentName(emp.name);
                      setNewPhone(emp.phone || emp.email || '+216 22 100 200');
                      // Find matched vehicle if assigned
                      const vehList = (vehicles && vehicles.length > 0) ? vehicles : DEFAULT_VEHICLES_LIST;
                      const matchedVeh = vehList.find((v: any) => v.assignedToEmployeeId === emp.id || v.assignedToEmployeeId === selectedId);
                      if (matchedVeh) {
                        setNewVehicleId(matchedVeh.id);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-new-agent-rh"
                >
                  <option value="">-- Sélectionner un Collaborateur RH --</option>
                  {((employees && employees.length > 0) ? employees : DEFAULT_EMPLOYEES_LIST).map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id || emp.matricule}) — {emp.jobTitle || emp.role || 'Collaborateur RH'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    ID Matricule Agent
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Sélectionner ci-dessus"
                    value={newAgentId}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-700"
                    id="input-new-agent-id"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Véhicule Affecté (Parc MOD-08)
                  </label>
                  <select
                    value={newVehicleId}
                    onChange={(e) => setNewVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="select-new-vehicle-fleet"
                  >
                    <option value="">-- Aucun véhicule / En déplacement à pied --</option>
                    {((vehicles && vehicles.length > 0) ? vehicles : DEFAULT_VEHICLES_LIST).map((veh: any) => (
                      <option key={veh.id} value={veh.id}>
                        {veh.brand} {veh.model} ({veh.registrationNumber || veh.immatriculation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block flex items-center justify-between">
                  <span>TERMINAL PHYSIQUE (STOCK MDM)</span>
                  <span className="text-[9px] text-emerald-600 font-bold">{availableFleetItems.length} dispo(s) en stock</span>
                </label>
                <select
                  value={selectedFleetItemId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setSelectedFleetItemId(selectedId);
                    const item = fleetInventory.find(f => f.id === selectedId);
                    if (item) {
                      setNewDeviceModel(`${item.device_name} [${item.serial_reference}]`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-fleet-inventory-stock"
                >
                  <option value="">-- Choisir un matériel disponible dans le parc MDM --</option>
                  {availableFleetItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.device_name} — IMEI: {item.serial_reference} ({item.fleet_park})
                    </option>
                  ))}
                </select>
                {availableFleetItems.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-medium italic">
                    Aucun matériel disponible en stock MDM. Vous pouvez saisir un modèle ci-dessous ou ajouter un terminal au parc MDM.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  AFFECTATION DU TERMINAL (MODULE) *
                </label>
                <select
                  required
                  value={newAssignedModule}
                  onChange={(e) => setNewAssignedModule(e.target.value as AssignedModule)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-new-assigned-module"
                >
                  <option value="standard">Standard (Pointage uniquement)</option>
                  <option value="chantier">Mission Chantier</option>
                  <option value="vente">Mission Vente</option>
                  <option value="polyvalent">Polyvalent (Chantier & Vente)</option>
                  <option value="livraison">Mission Livraison (Chauffeur / Dispatch)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  L'association générera immédiatement l'enregistrement Firestore sous `company_erp_data/{tenantId}/mobile_devices`. Le terminal sera immédiatement mis au statut <strong>ACTIVE</strong> et le matériel MDM passera à <strong>'Assigned'</strong>.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  id="btn-submit-new-device"
                >
                  Valider & Associer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AJOUT TERMINAL AU PARC MDM */}
      {/* ========================================================================= */}
      {showAddFleetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="modal-add-fleet-item">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-150 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Ajouter un Terminal au Parc MDM
                  </h3>
                  <p className="text-xs text-slate-500">
                    Collection `fleet_inventory` • Statut 'Available' par défaut
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddFleetModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFleetSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  PARC / FLOTTE D'APPARTENANCE *
                </label>
                <select
                  value={newFleetPark}
                  onChange={(e) => setNewFleetPark(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-new-fleet-park"
                >
                  <option value="Flotte Commerciale & Vente">Flotte Commerciale & Vente</option>
                  <option value="Flotte Chantiers">Flotte Chantiers</option>
                  <option value="Flotte Logistique">Flotte Logistique</option>
                  <option value="Stock Réserve">Stock Réserve</option>
                  <option value="AUTRE">-- Autre / Flotte Spécifique --</option>
                </select>
              </div>

              {newFleetPark === 'AUTRE' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Nom du Parc Spécifique
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Flotte Direction / IT"
                    value={newFleetCustomPark}
                    onChange={(e) => setNewFleetCustomPark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="input-new-fleet-custom-park"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  MARQUE & MODÈLE DU TERMINAL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Zebra TC26 / Samsung Galaxy Tab Active4 Pro"
                  value={newFleetDeviceName}
                  onChange={(e) => setNewFleetDeviceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="input-new-fleet-device-name"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  NUMÉRO DE SÉRIE / IMEI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: IMEI 864201948210394 ou N° Série ZB-9021"
                  value={newFleetSerialRef}
                  onChange={(e) => setNewFleetSerialRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-slate-800"
                  id="input-new-fleet-serial-ref"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
                💡 Ce terminal apparaîtra immédiatement avec le statut <strong>'Available'</strong> dans le stock MDM et pourra être associé aux collaborateurs terrain.
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddFleetModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  id="btn-submit-add-fleet-item"
                >
                  Enregistrer au Parc MDM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DÉTAIL COMMANDE MOBILE & SIGNATURE */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="modal-order-detail">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  {selectedOrder.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 font-display mt-1">
                  Détail de la Commande Terrain
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Client</span>
                <strong className="text-slate-900 text-sm block font-sans">{selectedOrder.clientName}</strong>
                <span className="text-slate-500 text-[10px]">ID: {selectedOrder.clientId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Agent Émetteur</span>
                <strong className="text-indigo-700 text-sm block font-sans">{selectedOrder.agentName || 'Agent Terrain'}</strong>
                <span className="text-slate-500 text-[10px]">
                  Paiement: {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                </span>
              </div>
            </div>

            {/* Articles Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider font-display">
                Articles Commandés ({selectedOrder.items.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5">Désignation</th>
                      <th className="p-2.5 text-center">Qté</th>
                      <th className="p-2.5 text-right">Prix Unitaire HT</th>
                      <th className="p-2.5 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-sans font-bold text-slate-800">{item.label}</td>
                        <td className="p-2.5 text-center">{item.qty}</td>
                        <td className="p-2.5 text-right">{item.unitPrice.toFixed(3)} TND</td>
                        <td className="p-2.5 text-right font-bold">{item.total.toFixed(3)} TND</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial summary */}
            <div className="bg-indigo-900 text-white p-4 rounded-2xl flex justify-between items-center font-mono">
              <div>
                <span className="text-[10px] uppercase text-indigo-300 font-sans block">Total Hors Taxe</span>
                <strong className="text-base">{(selectedOrder.totalHT ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-indigo-300 font-sans block">Montant Net TTC à Régler</span>
                <strong className="text-xl font-black text-emerald-400">{(selectedOrder.totalTTC ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</strong>
              </div>
            </div>

            {/* Client Signature Preview */}
            {selectedOrder.signatureUrl && (
              <div className="space-y-1.5 border-t border-slate-150 pt-4">
                <span className="text-[10px] font-bold uppercase text-slate-500 font-mono block">
                  Signature Électronique du Client sur Terminal Mobile :
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-center items-center h-28">
                  <img
                    src={selectedOrder.signatureUrl}
                    alt="Signature client"
                    className="max-h-20 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Fermer
              </button>

              {selectedOrder.status !== 'VALIDATED' && (
                <button
                  onClick={() => {
                    validateOrder(selectedOrder.id, 'VALIDATED');
                    showToast(`Commande ${selectedOrder.id} validée et synchronisée avec la facturation.`, 'success');
                    setSelectedOrder(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider la Commande dans l'ERP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSPECTION RAPPORT DE CHANTIER */}
      {/* ========================================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="modal-report-detail">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">
                  {selectedReport.chantierId}
                </span>
                <h3 className="text-lg font-black text-slate-900 font-display mt-1">
                  Rapport Détaillé de Chantier (`chantier_reports`)
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Chantier</span>
                <strong className="text-slate-900 text-sm block font-sans">{selectedReport.chantierName || selectedReport.chantierId}</strong>
                <span className="text-slate-500 text-[10px]">Effectif: {selectedReport.workersPresent} ouvriers</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Chef de Chantier</span>
                <strong className="text-indigo-700 text-sm block font-sans">{selectedReport.chefChantierName || selectedReport.chefChantierId}</strong>
                <span className="text-slate-500 text-[10px]">
                  Date: {selectedReport.date ? (typeof selectedReport.date === 'string' ? new Date(selectedReport.date).toLocaleDateString('fr-FR') : (selectedReport.date instanceof Date ? selectedReport.date.toLocaleDateString('fr-FR') : new Date(selectedReport.date).toLocaleDateString('fr-FR'))) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Consumed materials list */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider font-display">
                Matériaux Consommés sur le Terrain ({selectedReport.materialsConsumed.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5">Référence / Matériau</th>
                      <th className="p-2.5 text-right">Quantité Consommée</th>
                      <th className="p-2.5 text-right">Unité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono">
                    {selectedReport.materialsConsumed.map((mat, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-sans font-bold text-slate-800">
                          {mat.articleName || mat.articleId}
                        </td>
                        <td className="p-2.5 text-right font-black text-indigo-700">{mat.qty}</td>
                        <td className="p-2.5 text-right text-slate-500">{mat.unit || 'U'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photos gallery */}
            {selectedReport.photoUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider font-display">
                  Photos prises sur le terrain
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedReport.photoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Chantier ${i}`}
                      onClick={() => setLightboxImage(url)}
                      className="w-full h-28 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 transition shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                Observations & Notes du Chef de Chantier :
              </span>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed italic">
                "{selectedReport.notes}"
              </p>
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Fermer
              </button>

              {selectedReport.status !== 'APPROVED' && (
                <button
                  onClick={() => {
                    approveReport(selectedReport.id, 'APPROVED');
                    showToast(`Rapport de chantier ${selectedReport.chantierId} approuvé.`, 'success');
                    setSelectedReport(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approuver le Rapport de Chantier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX IMAGE MODAL */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={lightboxImage} 
              alt="Agrandissement photo terrain" 
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileTerrainDashboard;
