import React, { useState, useMemo } from 'react';
import { useMobileAdmin } from '../hooks/useMobileAdmin';
import { FleetDeviceStatus, FleetInventoryItem } from '../types/mobileTerrain';
import { TRIAL_FLEET_INVENTORY } from '../data/mockTrialData';
import { appStorage } from '../services/storageAdapter';
import { 
  Boxes, 
  Search, 
  Plus, 
  X, 
  Smartphone, 
  Car, 
  Wrench, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Filter,
  ShieldCheck,
  Tag,
  Building2,
  HardHat,
  Receipt,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface FleetAssetManagerProps {
  tenantId: string;
  isTrial?: boolean;
}

export const FleetAssetManager: React.FC<FleetAssetManagerProps> = ({ tenantId, isTrial = false }) => {
  const { 
    fleetInventory: rawFleetInventory, 
    addFleetItem, 
    updateFleetItemStatus 
  } = useMobileAdmin(tenantId);

  const fleetInventory = useMemo(() => {
    if (rawFleetInventory && rawFleetInventory.length > 0) {
      return rawFleetInventory;
    }
    if (isTrial || tenantId === 'Inter-Affaires' || tenantId === 'company_demo') {
      return TRIAL_FLEET_INVENTORY;
    }
    return [];
  }, [rawFleetInventory, isTrial, tenantId]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [parkFilter, setParkFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryPreset, setNewCategoryPreset] = useState('Terminal Mobile');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newFleetPark, setNewFleetPark] = useState('Stock Réserve');
  const [newCustomPark, setNewCustomPark] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newSerialRef, setNewSerialRef] = useState('');
  const [newStatus, setNewStatus] = useState<FleetDeviceStatus>('Available');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  
  // Cross-Creation Accounting Fields (SCE)
  const [newAcquisitionCost, setNewAcquisitionCost] = useState<number>(0);
  const [generateAccountingImmob, setGenerateAccountingImmob] = useState(false);
  const [newSceAccount, setNewSceAccount] = useState('222');
  const [newDurationYears, setNewDurationYears] = useState(3);
  const [newAmortMethod, setNewAmortMethod] = useState<'LINEAIRE' | 'DEGRESSIF'>('LINEAIRE');
  const [newLocation, setNewLocation] = useState('Siège Tunis Charguia');

  // Automatically adapt default SCE account & duration when category changes
  const handleCategoryChange = (val: string) => {
    setNewCategoryPreset(val);
    if (val === 'Terminal Mobile' || val === 'Informatique') {
      setNewSceAccount('222');
      setNewDurationYears(3);
    } else if (val === 'Véhicule') {
      setNewSceAccount('224');
      setNewDurationYears(5);
    } else if (val === 'Outillage Chantier' || val === 'Machine Industrielle / GPAO') {
      setNewSceAccount('223');
      setNewDurationYears(7);
    } else {
      setNewSceAccount('228');
      setNewDurationYears(5);
    }
  };

  // Auto-toggle accounting generation proposal when cost > 1000 DT
  const handleCostChange = (cost: number) => {
    setNewAcquisitionCost(cost);
    if (cost >= 1000) {
      setGenerateAccountingImmob(true);
    }
  };

  // Extract unique categories from existing fleetInventory
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Terminal Mobile');
    cats.add('Infrastructure IT');
    cats.add('Machine Industrielle / GPAO');
    cats.add('Véhicule');
    cats.add('Outillage Chantier');
    cats.add('Informatique');
    fleetInventory.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [fleetInventory]);

  // Extract unique parks
  const existingParks = useMemo(() => {
    const parks = new Set<string>();
    parks.add('Stock Réserve');
    parks.add('Flotte Commerciale & Vente');
    parks.add('Flotte Chantiers');
    parks.add('Flotte Logistique');
    parks.add('Parc Siège & IT');
    parks.add('Parc Industriel Usine');
    fleetInventory.forEach(item => {
      if (item.fleet_park) parks.add(item.fleet_park);
    });
    return Array.from(parks);
  }, [fleetInventory]);

  // KPIs
  const availableCount = useMemo(() => fleetInventory.filter(f => f.status === 'Available').length, [fleetInventory]);
  const assignedCount = useMemo(() => fleetInventory.filter(f => f.status === 'Assigned').length, [fleetInventory]);
  const maintenanceCount = useMemo(() => fleetInventory.filter(f => f.status === 'Maintenance').length, [fleetInventory]);
  const decommissionedCount = useMemo(() => fleetInventory.filter(f => f.status === 'Decommissioned').length, [fleetInventory]);

  // Filtered List
  const filteredInventory = useMemo(() => {
    return fleetInventory.filter(item => {
      const itemCategory = item.category || 'Terminal Mobile';
      const matchCategory = categoryFilter === 'ALL' || itemCategory === categoryFilter;
      const matchPark = parkFilter === 'ALL' || item.fleet_park === parkFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch = (item.device_name || '').toLowerCase().includes(search) ||
                          (item.serial_reference || '').toLowerCase().includes(search) ||
                          (item.assignedTo || '').toLowerCase().includes(search) ||
                          (item.fleet_park || '').toLowerCase().includes(search) ||
                          (item.immobCode || '').toLowerCase().includes(search) ||
                          itemCategory.toLowerCase().includes(search);

      return matchCategory && matchPark && matchStatus && matchSearch;
    });
  }, [fleetInventory, categoryFilter, parkFilter, statusFilter, searchTerm]);

  // Submit new asset
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newSerialRef) {
      showToast('Veuillez remplir le nom du matériel et sa référence unique / N° de série.', 'error');
      return;
    }

    const finalCategory = newCategoryPreset === 'AUTRE' ? (newCustomCategory.trim() || 'Équipement Général') : newCategoryPreset;
    const finalPark = newFleetPark === 'AUTRE' ? (newCustomPark.trim() || 'Stock Réserve') : newFleetPark;

    let immobCodeGenerated: string | undefined = undefined;

    // Cross-Creation Accounting Logic (SCE)
    if (generateAccountingImmob && newAcquisitionCost > 0) {
      try {
        const year = new Date().getFullYear();
        const randNum = Math.floor(100 + Math.random() * 900);
        immobCodeGenerated = `IMM-${year}-${randNum}`;

        const rawAssets = appStorage.getItem('carthage_assets_immobilisations');
        const currentAssets = rawAssets ? JSON.parse(rawAssets) : [];

        const newImmobAsset = {
          id: `ast-inv-${Date.now()}`,
          companyId: tenantId || 'Inter-Affaires',
          code: immobCodeGenerated,
          name: `${newDeviceName} (${newSerialRef})`,
          category: finalCategory.toLowerCase().includes('logiciel') ? 'INCORPORELLE' : 'CORPORELLE',
          accountCode: newSceAccount,
          acquisitionDate: new Date().toISOString().split('T')[0],
          commissioningDate: new Date().toISOString().split('T')[0],
          acquisitionCost: Number(newAcquisitionCost),
          salvageValue: 0,
          durationYears: Number(newDurationYears) || 5,
          amortizationMethod: newAmortMethod,
          supplier: 'Fournisseur Matériel / Parc',
          invoiceRef: `FAC-ACT-${Date.now().toString().slice(-4)}`,
          location: newLocation || finalPark,
          notes: `Généré automatiquement depuis Gestion Parc & Actifs (${finalCategory} - Réf: ${newSerialRef})`
        };

        const updatedAssets = Array.isArray(currentAssets) ? [...currentAssets, newImmobAsset] : [newImmobAsset];
        appStorage.setItem('carthage_assets_immobilisations', JSON.stringify(updatedAssets));
        window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId } }));
      } catch (err) {
        console.error('Erreur cross-création immobilisation SCE:', err);
      }
    }

    await addFleetItem({
      category: finalCategory,
      fleet_park: finalPark,
      device_name: newDeviceName,
      serial_reference: newSerialRef,
      status: newStatus,
      assignedTo: newAssignedTo.trim() || '',
      acquisitionCost: newAcquisitionCost > 0 ? newAcquisitionCost : undefined,
      sceAccount: generateAccountingImmob ? newSceAccount : undefined,
      immobCode: immobCodeGenerated,
      location: newLocation
    });

    if (immobCodeGenerated) {
      showToast(`Actif "${newDeviceName}" créé et fiche d'immobilisation #${immobCodeGenerated} (Compte SCE ${newSceAccount}) générée avec succès !`, 'success');
    } else {
      showToast(`Actif "${newDeviceName}" ajouté avec succès au catalogue du parc.`, 'success');
    }

    setShowAddModal(false);
    setNewDeviceName('');
    setNewSerialRef('');
    setNewAssignedTo('');
    setNewCategoryPreset('Terminal Mobile');
    setNewCustomCategory('');
    setNewFleetPark('Stock Réserve');
    setNewCustomPark('');
    setNewStatus('Available');
    setNewAcquisitionCost(0);
    setGenerateAccountingImmob(false);
  };

  // Get icon for category
  const renderCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('mobile') || cat.includes('smartphone') || cat.includes('tablette') || cat.includes('pocket')) {
      return <Smartphone className="w-4 h-4 text-sky-600" />;
    }
    if (cat.includes('véhicule') || cat.includes('vehicule') || cat.includes('auto') || cat.includes('camion') || cat.includes('flotte')) {
      return <Car className="w-4 h-4 text-emerald-600" />;
    }
    if (cat.includes('outillage') || cat.includes('chantier') || cat.includes('machine') || cat.includes('gpao') || cat.includes('industri')) {
      return <Wrench className="w-4 h-4 text-amber-600" />;
    }
    if (cat.includes('informatique') || cat.includes('pc') || cat.includes('ordinateur') || cat.includes('serveur') || cat.includes('infrastructure') || cat.includes('it')) {
      return <Laptop className="w-4 h-4 text-purple-600" />;
    }
    return <Boxes className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans" id="gestion-parc-actifs-page">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-3 transition-all animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' :
          toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-display text-white">
                Gestion du Parc & Actifs Elyssa
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Gestionnaire d'actifs universel multi-catégories • Collection Firestore `fleet_inventory` synchronisée avec les Immobilisations SCE
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md hover:shadow-amber-500/20 transition cursor-pointer shrink-0 border-0"
          id="btn-add-asset-main"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nouveau Matériel / Actif</span>
        </button>
      </div>

      {/* Synthetic Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">En Stock (Disponibles)</span>
            <span className="text-2xl font-black text-slate-900 font-display">{availableCount}</span>
            <span className="text-[10px] font-mono text-emerald-600 block mt-0.5">Prêts à être affectés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">En Service (Attribués)</span>
            <span className="text-2xl font-black text-slate-900 font-display">{assignedCount}</span>
            <span className="text-[10px] font-mono text-blue-600 block mt-0.5">Actuellement sur le terrain / site</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">En Maintenance</span>
            <span className="text-2xl font-black text-slate-900 font-display">{maintenanceCount}</span>
            <span className="text-[10px] font-mono text-amber-600 block mt-0.5">Réparation / Révision</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Parc Total d'Actifs</span>
            <span className="text-2xl font-black text-slate-900 font-display">{fleetInventory.length}</span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Tous types d'équipements & matériels</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher nom, réf. unique, matricule, compte SCE, agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
              id="input-asset-search"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1 text-xs bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              id="select-category-filter"
            >
              <option value="ALL">Toutes Catégories</option>
              {existingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Park Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={parkFilter}
              onChange={(e) => setParkFilter(e.target.value)}
              className="py-1 text-xs bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              id="select-park-filter"
            >
              <option value="ALL">Tous les Parcs</option>
              {existingParks.map(park => (
                <option key={park} value={park}>{park}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 text-xs bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              id="select-status-filter"
            >
              <option value="ALL">Tous les États</option>
              <option value="Available">Available (En Stock)</option>
              <option value="Assigned">Assigned (En Service)</option>
              <option value="Maintenance">Maintenance (Réparation)</option>
              <option value="Decommissioned">Decommissioned (Hors Service)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
              Inventaire Général des Actifs & Matériels (`fleet_inventory`)
            </h3>
            <p className="text-xs text-slate-500">
              {filteredInventory.length} actif(s) affiché(s) sur {fleetInventory.length} au total.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold hidden sm:inline">
            Tenant: {tenantId}
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
          <table className="w-full text-left border-collapse" id="table-asset-inventory">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs">
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-3.5">Catégorie</th>
                <th className="px-6 py-3.5">Équipement / Nom / Marque</th>
                <th className="px-6 py-3.5">Référence Unique / N° Série</th>
                <th className="px-6 py-3.5">Parc / Emplacement</th>
                <th className="px-6 py-3.5">Statut Actuel</th>
                <th className="px-6 py-3.5">Affectation / Responsable</th>
                <th className="px-6 py-3.5">Fiche Comptable (SCE)</th>
                <th className="px-6 py-3.5 text-right">Mise à jour État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs font-sans">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                    Aucun matériel ou actif ne correspond aux filtres de recherche.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const statusBadges: Record<FleetDeviceStatus, { label: string; style: string }> = {
                    Available: { label: 'En Stock (Disponible)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    Assigned: { label: 'En Service (Attribué)', style: 'bg-blue-50 text-blue-700 border-blue-200' },
                    Maintenance: { label: 'En Réparation (Maintenance)', style: 'bg-amber-50 text-amber-800 border-amber-200' },
                    Decommissioned: { label: 'Hors Service (Réformé)', style: 'bg-red-50 text-red-700 border-red-200' },
                    Garage: { label: 'Au Garage (Garage)', style: 'bg-purple-50 text-purple-700 border-purple-200' },
                    'En Panne': { label: 'En Panne', style: 'bg-rose-50 text-rose-800 border-rose-300' }
                  };
                  const badge = statusBadges[item.status] || statusBadges.Available;
                  const itemCategory = item.category || 'Terminal Mobile';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Catégorie */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[10px]">
                          {renderCategoryIcon(itemCategory)}
                          <span>{itemCategory}</span>
                        </span>
                      </td>

                      {/* Équipement / Nom */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <strong className="text-slate-900 font-bold block text-sm">{item.device_name}</strong>
                            <span className="text-[10px] font-mono text-slate-400">ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Référence Unique / N° Série / VIN */}
                      <td className="px-6 py-4 font-mono text-slate-800 font-semibold">
                        {item.serial_reference}
                      </td>

                      {/* Parc / Flotte */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] block w-fit">
                            {item.fleet_park}
                          </span>
                          {item.location && (
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              {item.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border font-black text-[10px] uppercase font-mono ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Affectation */}
                      <td className="px-6 py-4">
                        {item.assignedTo ? (
                          <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{item.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">En Stock Réserve</span>
                        )}
                      </td>

                      {/* Fiche Comptable SCE */}
                      <td className="px-6 py-4">
                        {item.immobCode || item.sceAccount || (item.acquisitionCost && item.acquisitionCost > 0) ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 font-mono font-bold text-slate-900 text-[11px]">
                              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                              <span>{item.immobCode || 'Immobilisé'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.sceAccount && <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-1 font-bold text-slate-700">Compte {item.sceAccount}</span>}
                              {item.acquisitionCost && <span>{item.acquisitionCost.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Non immobilisé</span>
                        )}
                      </td>

                      {/* Action state change */}
                      <td className="px-6 py-4 text-right">
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const newSt = e.target.value as FleetDeviceStatus;
                            updateFleetItemStatus(item.id, newSt);
                            showToast(`Statut de "${item.device_name}" mis à jour : ${newSt}`, 'info');
                          }}
                          className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Available">Available (En Stock)</option>
                          <option value="Assigned">Assigned (En Service)</option>
                          <option value="Maintenance">Maintenance (Réparation)</option>
                          <option value="Decommissioned">Decommissioned (Hors Service)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Asset / Equipment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="modal-add-asset">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 font-black">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Nouveau Matériel / Actif du Parc
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrement dans la collection `fleet_inventory` & liaison comptable SCE
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-sans">
              
              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  CATÉGORIE D'ÉQUIPEMENT *
                </label>
                <select
                  value={newCategoryPreset}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-new-asset-category"
                >
                  <option value="Terminal Mobile">Terminal Mobile (Smartphone / Tablette)</option>
                  <option value="Infrastructure IT">Infrastructure IT (Serveur, Baie SAN, Réseau)</option>
                  <option value="Machine Industrielle / GPAO">Machine Industrielle & Ligne GPAO</option>
                  <option value="Véhicule">Véhicule (Voiture, Fourgon, Utilitaire)</option>
                  <option value="Outillage Chantier">Outillage Chantier & Équipement</option>
                  <option value="Informatique">Matériel Informatique (Poste, Écran, Laptop)</option>
                  <option value="Bâtiment & Équipement">Bâtiment & Équipement Lourd</option>
                  <option value="AUTRE">-- Autre Catégorie Personnalisée --</option>
                </select>
              </div>

              {newCategoryPreset === 'AUTRE' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Nom de la Catégorie Personnalisée
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Drone de Survol, Groupe Électrogène..."
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="input-new-asset-custom-category"
                  />
                </div>
              )}

              {/* Park */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  PARC / FLOTTE D'APPARTENANCE *
                </label>
                <select
                  value={newFleetPark}
                  onChange={(e) => setNewFleetPark(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="select-new-asset-park"
                >
                  <option value="Stock Réserve">Stock Réserve</option>
                  <option value="Flotte Commerciale & Vente">Flotte Commerciale & Vente</option>
                  <option value="Flotte Chantiers">Flotte Chantiers</option>
                  <option value="Flotte Logistique">Flotte Logistique</option>
                  <option value="Parc Siège & IT">Parc Siège & IT</option>
                  <option value="Parc Industriel Usine">Parc Industriel Usine</option>
                  <option value="AUTRE">-- Autre Parc Spécifique --</option>
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
                    placeholder="ex: Flotte Direction / Usine Sfax"
                    value={newCustomPark}
                    onChange={(e) => setNewCustomPark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="input-new-asset-custom-park"
                  />
                </div>
              )}

              {/* Device / Asset Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  NOM DE L'ÉQUIPEMENT / DÉSIGNATION *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Zebra TC57, Isuzu D-Max, Serveurs Dell PowerEdge, Ligne GPAO..."
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                  id="input-new-asset-name"
                />
              </div>

              {/* Serial Reference / VIN */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  RÉFÉRENCE UNIQUE / N° DE SÉRIE / MATRICULE / IMEI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 240 TN 8812, SRV-DELL-PE-SAN, SAM-TAB4-TN-00345..."
                  value={newSerialRef}
                  onChange={(e) => setNewSerialRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-slate-800"
                  id="input-new-asset-serial-ref"
                />
              </div>

              {/* Status & Assigned To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    STATUT INITIAL
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as FleetDeviceStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="select-new-asset-status"
                  >
                    <option value="Available">Available (En Stock)</option>
                    <option value="Assigned">Assigned (En Service)</option>
                    <option value="Maintenance">Maintenance (Réparation)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    AFFECTATION / RESPONSABLE
                  </label>
                  <input
                    type="text"
                    placeholder="Mohamed Ali Gharbi, Chef d'Atelier..."
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    id="input-new-asset-assigned-to"
                  />
                </div>
              </div>

              {/* Cross-Creation Accounting Section (SCE) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <label className="font-black text-slate-900 uppercase text-[10px] tracking-wider">
                      VALEUR D'ACQUISITION (DT HT)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Seuil immo : &gt; 1 000 DT
                  </span>
                </div>

                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="ex: 28500"
                  value={newAcquisitionCost || ''}
                  onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono font-bold text-slate-800"
                  id="input-new-asset-cost"
                />

                {/* Checkbox Trigger if cost > 1000 or user toggles */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateAccountingImmob}
                      onChange={(e) => setGenerateAccountingImmob(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      id="checkbox-generate-immob"
                    />
                    <span className="font-bold text-slate-900 text-xs">
                      Générer la fiche d'immobilisation comptable SCE (NCT Tunisie)
                    </span>
                  </label>
                </div>

                {generateAccountingImmob && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[10px] uppercase block">
                        Compte SCE
                      </label>
                      <select
                        value={newSceAccount}
                        onChange={(e) => setNewSceAccount(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                        id="select-new-asset-sce"
                      >
                        <option value="222">222 - Matériel Informatique</option>
                        <option value="223">223 - Matériel Industriel & Outillage</option>
                        <option value="224">224 - Matériel de Transport</option>
                        <option value="228">228 - Autre Immo Corporelle</option>
                        <option value="212">212 - Logiciels & Brevets</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[10px] uppercase block">
                        Durée (Années) & Méthode
                      </label>
                      <div className="flex space-x-1.5">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={newDurationYears}
                          onChange={(e) => setNewDurationYears(parseInt(e.target.value) || 5)}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                        />
                        <select
                          value={newAmortMethod}
                          onChange={(e) => setNewAmortMethod(e.target.value as 'LINEAIRE' | 'DEGRESSIF')}
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-800"
                        >
                          <option value="LINEAIRE">Linéaire</option>
                          <option value="DEGRESSIF">Dégressif</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                💡 Cet équipement sera stocké sous <code>company_erp_data/{tenantId}/fleet_inventory</code>. Si la fiche d'immobilisation est cochée, elle sera immédiatement synchronisée avec le module Immobilisations & Amortissements.
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider transition shadow-md shadow-amber-500/20 cursor-pointer"
                  id="btn-submit-add-asset"
                >
                  Enregistrer au Parc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
