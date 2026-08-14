import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DeliveryTour, DeliveryTourOrder, FleetInventoryItem, PickingOrder, DeliveryPickupStop, EveningTourClosure } from '../types/mobileTerrain';
import { Invoice, Employee } from '../types';
import { 
  Truck, 
  Package, 
  UserCheck, 
  Car, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  Navigation, 
  Layers, 
  Sparkles,
  Globe,
  ShoppingCart,
  Briefcase,
  Warehouse,
  User,
  FileCheck2,
  ChevronRight,
  Building2,
  Filter,
  Boxes,
  AlertTriangle,
  Scale,
  Receipt,
  DollarSign,
  X,
  CreditCard,
  Gauge,
  Lock
} from 'lucide-react';

interface DispatchManagerProps {
  tenantId: string;
  employees?: Employee[];
}

export const DispatchManager: React.FC<DispatchManagerProps> = ({ tenantId, employees = [] }) => {
  // Pending Invoices / Orders
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Picking Orders for multi-warehouse readiness check
  const [pickingOrders, setPickingOrders] = useState<PickingOrder[]>([]);

  // Vehicles from fleet_inventory
  const [availableVehicles, setAvailableVehicles] = useState<FleetInventoryItem[]>([]);

  // Delivery Tours
  const [deliveryTours, setDeliveryTours] = useState<DeliveryTour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  // Form & Selection State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedDriverName, setSelectedDriverName] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicleName, setSelectedVehicleName] = useState('');
  const [tourNotes, setTourNotes] = useState('');

  // Evening Tour Closure Modal State
  const [closingTour, setClosingTour] = useState<DeliveryTour | null>(null);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [actualChequesCounted, setActualChequesCounted] = useState<number>(0);
  const [actualRSCounted, setActualRSCounted] = useState<number>(0);
  const [endingOdometer, setEndingOdometer] = useState<number>(120480);
  const [fuelExpenses, setFuelExpenses] = useState<number>(120);
  const [tollExpenses, setTollExpenses] = useState<number>(18);

  // Zone 3 View Mode & Search / Filters
  const [zone3ViewMode, setZone3ViewMode] = useState<'by_driver' | 'all_tours'>('by_driver');
  const [searchTerm, setSearchTerm] = useState('');
  const [tourStatusFilter, setTourStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // Date Range Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Default drivers base
  const defaultDrivers = [
    { id: 'emp_drv_01', name: 'Kamel Trad (Chauffeur Logistique Poids Lourds)' },
    { id: 'emp_drv_02', name: 'Hamza Ben Salem (Livreur / Express)' },
    { id: 'emp_drv_03', name: 'Youssef Chahed (Chauffeur Toupie & Chantier)' },
    { id: 'emp_drv_04', name: 'Nizar Trabelsi (Conducteur Utilitaire)' }
  ];

  // Dynamic drivers list combining HR collaborators & default drivers filtered by driver roles
  const driversList = useMemo(() => {
    const list = [...defaultDrivers];
    const existingIds = new Set(list.map(d => d.id));

    if (Array.isArray(employees) && employees.length > 0) {
      employees.forEach(emp => {
        if (!emp || !emp.id) return;
        const job = (emp.jobTitle || '').toLowerCase();
        const role = (emp.role || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();

        const isDriver = job.includes('chauffeur') || job.includes('livreur') || job.includes('conducteur') ||
                         job.includes('agent') || job.includes('logistique') || dept.includes('logistique') ||
                         dept.includes('transport') || role === 'chauffeur' || role === 'livreur' || role === 'agent';

        if (isDriver && !existingIds.has(emp.id)) {
          list.push({
            id: emp.id,
            name: `${emp.name} (${emp.jobTitle || 'Chauffeur Terrain'})`
          });
          existingIds.add(emp.id);
        }
      });
    }

    return list.map(d => {
      const activeTour = deliveryTours.find(t => t.driver_id === d.id && t.status === 'en_cours');
      return {
        ...d,
        activeTourNumber: activeTour?.tour_number,
        availabilityStatus: activeTour ? 'EN_TOURNEE' : 'DISPONIBLE'
      };
    });
  }, [employees, deliveryTours]);

  // Filtered vehicles (only Available or EN CIRCULATION)
  const filteredVehicles = useMemo(() => {
    return availableVehicles.filter(v => {
      const st = (v.status || '').toUpperCase();
      return st === 'AVAILABLE' || st === 'EN CIRCULATION' || st === 'ACTIF' || st === 'ASSIGNED';
    }).map(v => {
      let maxPayloadKg = v.maxPayloadKg;
      if (!maxPayloadKg) {
        const name = (v.device_name || '').toLowerCase();
        if (name.includes('12t') || name.includes('12 tonne')) maxPayloadKg = 12000;
        else if (name.includes('partner') || name.includes('utilitaire')) maxPayloadKg = 1200;
        else if (name.includes('toupie') || name.includes('malaxeur')) maxPayloadKg = 20000;
        else maxPayloadKg = 8000;
      }
      return { ...v, maxPayloadKg };
    });
  }, [availableVehicles]);

  // Payload calculation for selected invoices
  const selectedInvoicesList = useMemo(() => {
    return pendingInvoices.filter(i => selectedInvoiceIds.includes(i.id));
  }, [pendingInvoices, selectedInvoiceIds]);

  const totalPayloadWeightKg = useMemo(() => {
    return selectedInvoicesList.reduce((acc, inv) => {
      const estWeight = inv.estimatedWeightKg || Math.round((inv.amountHT || inv.amountTTC * 0.8) * 0.25) || 450;
      return acc + estWeight;
    }, 0);
  }, [selectedInvoicesList]);

  const selectedVehicleObj = useMemo(() => {
    return filteredVehicles.find(v => v.id === selectedVehicleId);
  }, [filteredVehicles, selectedVehicleId]);

  const selectedVehicleMaxPayloadKg = selectedVehicleObj?.maxPayloadKg || 12000;
  const payloadRatioPercent = selectedVehicleMaxPayloadKg > 0 ? Math.round((totalPayloadWeightKg / selectedVehicleMaxPayloadKg) * 100) : 0;
  const isPayloadOverloaded = totalPayloadWeightKg > selectedVehicleMaxPayloadKg;

  // Helper to calculate client credit status
  const getClientCreditInfo = (inv: Invoice) => {
    const creditLimit = 10000;
    const clientInvoices = pendingInvoices.filter(i => i.clientId === inv.clientId || i.clientName === inv.clientName);
    const currentOutstanding = clientInvoices.reduce((sum, i) => sum + (i.amountNetToPay || i.amountTTC || 0), 0);
    const overdueCount = clientInvoices.filter(i => i.status === 'Unpaid' && i.dueDate && new Date(i.dueDate) < new Date()).length;
    const isExceeded = currentOutstanding > creditLimit || overdueCount > 0;

    return {
      creditLimit,
      currentOutstanding,
      overdueCount,
      isExceeded
    };
  };

  // 1. Listen to Invoices awaiting delivery
  useEffect(() => {
    if (!tenantId) return;
    setLoadingInvoices(true);

    const invoicesCol = collection(db, 'company_erp_data', tenantId, 'invoices');
    const unsub = onSnapshot(invoicesCol, (snap) => {
      const items: Invoice[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Invoice;
        items.push({ ...data, id: docSnap.id });
      });
      setPendingInvoices(items);
      setLoadingInvoices(false);
    }, (err) => {
      console.warn('Firestore invoices sub error:', err);
      setLoadingInvoices(false);
    });

    return () => unsub();
  }, [tenantId]);

  // 1b. Listen to Picking Orders
  useEffect(() => {
    if (!tenantId) return;

    const pickingCol = collection(db, 'company_erp_data', tenantId, 'picking_orders');
    const unsub = onSnapshot(pickingCol, (snap) => {
      const list: PickingOrder[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PickingOrder);
      });
      setPickingOrders(list);
    }, (err) => {
      console.warn('Firestore picking_orders sub error:', err);
    });

    return () => unsub();
  }, [tenantId]);

  // Helper to resolve picking readiness & loading dock assignment
  const getInvoicePickingInfo = (inv: Invoice) => {
    const matching = pickingOrders.filter(
      p => p.orderId === inv.id || p.orderId === inv.invoiceNumber
    );

    if (matching.length > 0) {
      const warehouses = Array.from(new Set(matching.map(p => p.warehouseName)));
      const allReady = matching.every(p => p.status === 'pret_chargement');
      const readyCount = matching.filter(p => p.status === 'pret_chargement').length;
      
      const dockList = matching
        .map(p => p.dockNumber)
        .filter((d): d is string => Boolean(d && d !== 'Quai Non Attribué'));
      const dockNumber = dockList.length > 0 ? Array.from(new Set(dockList)).join(' / ') : 'Quai Non Attribué';

      return {
        pickingOrders: matching,
        warehouses,
        allReady,
        isReadyForDispatch: allReady,
        dockNumber,
        readyCount,
        totalCount: matching.length,
        hasPickingOrders: true
      };
    }

    // Orders without picking orders in warehouse_picking are pending picking setup (blocked for tour creation)
    const whName = inv.warehouse_location || 'Dépôt Central - Radès (Tunis)';
    return {
      pickingOrders: [],
      warehouses: [whName],
      allReady: false,
      isReadyForDispatch: false,
      dockNumber: 'Quai Non Attribué',
      readyCount: 0,
      totalCount: 1,
      hasPickingOrders: false
    };
  };

  // 2. Listen to Fleet Inventory to get available vehicles
  useEffect(() => {
    if (!tenantId) return;

    const fleetCol = collection(db, 'company_erp_data', tenantId, 'fleet_inventory');
    const unsub = onSnapshot(fleetCol, (snap) => {
      const vehicles: FleetInventoryItem[] = [];
      snap.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as FleetInventoryItem;
        const cat = (item.category || '').toLowerCase();
        if (item.status === 'Available' || cat.includes('véhicule') || cat.includes('camion') || cat.includes('utilitaire')) {
          vehicles.push(item);
        }
      });
      setAvailableVehicles(vehicles);
    }, (err) => {
      console.warn('Firestore fleet_inventory sub error:', err);
    });

    return () => unsub();
  }, [tenantId]);

  // 3. Listen to Delivery Tours
  useEffect(() => {
    if (!tenantId) return;
    setLoadingTours(true);

    const toursCol = collection(db, 'company_erp_data', tenantId, 'delivery_tours');
    const unsub = onSnapshot(toursCol, (snap) => {
      const tours: DeliveryTour[] = [];
      snap.forEach((docSnap) => {
        tours.push({ id: docSnap.id, ...docSnap.data() } as DeliveryTour);
      });
      tours.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDeliveryTours(tours);
      setLoadingTours(false);
    }, (err) => {
      console.warn('Firestore delivery_tours sub error:', err);
      setLoadingTours(false);
    });

    return () => unsub();
  }, [tenantId]);

  // Seed Demo Data
  const handleSeedDemoInvoices = async () => {
    const demoInvoices: Partial<Invoice>[] = [
      {
        id: 'FAC-2026-0801',
        clientId: 'CLI-001',
        clientName: 'SOCIÉTÉ TUNISIENNE DE CONSTRUCTION (STC)',
        invoiceNumber: 'FAC-2026-0801',
        sales_channel: 'web',
        warehouse_location: 'Dépôt Central - Radès (Tunis)',
        amountHT: 4200,
        vatRate: 19,
        vatAmount: 798,
        withholdingTaxRate: 1.5,
        withholdingAmount: 63,
        amountNetToPay: 4935,
        amountTTC: 4998,
        status: 'Unpaid',
        delivery_status: 'en_attente',
        delivery_address: 'Z.I. Ben Arous, Rue 8600, Tunis',
        issuedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        recouvrementSteps: [],
        withholdingCertificateReceived: false
      },
      {
        id: 'FAC-2026-0802',
        clientId: 'CLI-002',
        clientName: 'COMPTOIR INDUSTRIEL BTP',
        invoiceNumber: 'FAC-2026-0802',
        sales_channel: 'pos',
        warehouse_location: 'Magasin & Showroom Sfax - Poudrière',
        amountHT: 8500,
        vatRate: 19,
        vatAmount: 1615,
        withholdingTaxRate: 1.5,
        withholdingAmount: 127.5,
        amountNetToPay: 9987.5,
        amountTTC: 10115,
        status: 'Unpaid',
        delivery_status: 'en_attente',
        delivery_address: 'Chantier Rocade Sud, km 12, Sfax',
        issuedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        recouvrementSteps: [],
        withholdingCertificateReceived: false
      },
      {
        id: 'FAC-2026-0803',
        clientId: 'CLI-003',
        clientName: 'BEN AHMED MATÉRIAUX',
        invoiceNumber: 'FAC-2026-0803',
        sales_channel: 'field_sales',
        warehouse_location: 'Stock Logistique Sousse - Kantaoui',
        amountHT: 3100,
        vatRate: 19,
        vatAmount: 589,
        withholdingTaxRate: 1.5,
        withholdingAmount: 46.5,
        amountNetToPay: 3642.5,
        amountTTC: 3689,
        status: 'Paid',
        delivery_status: 'en_attente',
        delivery_address: 'Avenue Habib Bourguiba, Nabeul',
        issuedDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        recouvrementSteps: [],
        withholdingCertificateReceived: true
      }
    ];

    for (const inv of demoInvoices) {
      await setDoc(doc(db, 'company_erp_data', tenantId, 'invoices', inv.id!), inv, { merge: true });
    }

    // Seed matching picking orders with various readiness statuses (Ready vs In Progress / Pending)
    const demoPickingOrders: PickingOrder[] = [
      {
        id: 'PICK-FAC-2026-0801',
        tenantId,
        orderId: 'FAC-2026-0801',
        clientName: 'SOCIÉTÉ TUNISIENNE DE CONSTRUCTION (STC)',
        deliveryAddress: 'Z.I. Ben Arous, Rue 8600, Tunis',
        warehouseId: 'wh_central',
        warehouseName: 'Dépôt Central Radès',
        dockNumber: 'Quai 1 - Dépôt Central Radès',
        status: 'pret_chargement',
        createdAt: new Date().toISOString(),
        preparedAt: new Date().toISOString(),
        preparedBy: 'Mounir Sfaxi (Chef Dépôt)',
        totalAmountTTC: 4998,
        items: [{ productId: 'MAT-01', productName: 'Ciment Portland 50kg', quantity: 50, warehouseName: 'Dépôt Central Radès' }]
      },
      {
        id: 'PICK-FAC-2026-0802',
        tenantId,
        orderId: 'FAC-2026-0802',
        clientName: 'COMPTOIR INDUSTRIEL BTP',
        deliveryAddress: 'Chantier Rocade Sud, km 12, Sfax',
        warehouseId: 'wh_sfax',
        warehouseName: 'Magasin & Showroom Sfax',
        dockNumber: 'Quai Non Attribué',
        status: 'en_cours',
        createdAt: new Date().toISOString(),
        totalAmountTTC: 10115,
        items: [{ productId: 'MAT-02', productName: 'Briques Creuses 12 Trous', quantity: 20, warehouseName: 'Magasin & Showroom Sfax' }]
      },
      {
        id: 'PICK-FAC-2026-0803',
        tenantId,
        orderId: 'FAC-2026-0803',
        clientName: 'BEN AHMED MATÉRIAUX',
        deliveryAddress: 'Avenue Habib Bourguiba, Nabeul',
        warehouseId: 'wh_sousse',
        warehouseName: 'Stock Logistique Sousse',
        dockNumber: 'Quai Non Attribué',
        status: 'en_attente',
        createdAt: new Date().toISOString(),
        totalAmountTTC: 3689,
        items: [{ productId: 'MAT-03', productName: 'Peinture Mat Satiné 20L', quantity: 10, warehouseName: 'Stock Logistique Sousse' }]
      }
    ];

    for (const po of demoPickingOrders) {
      await setDoc(doc(db, 'company_erp_data', tenantId, 'picking_orders', po.id), po, { merge: true });
    }

    if (availableVehicles.length === 0) {
      const demoVehicles: FleetInventoryItem[] = [
        {
          id: 'v_camion_12t',
          tenantId: tenantId,
          fleet_park: 'Flotte Logistique',
          device_name: 'Camion Isuzu 12 Tonnes',
          serial_reference: 'TN-9021',
          category: 'Véhicule Poids Lourd',
          status: 'Available',
          registeredAt: new Date().toISOString(),
          maxPayloadKg: 12000
        },
        {
          id: 'v_utilitaire_van',
          tenantId: tenantId,
          fleet_park: 'Flotte Logistique',
          device_name: 'Utilitaire Peugeot Partner',
          serial_reference: 'TN-8840',
          category: 'Véhicule Utilitaire',
          status: 'Available',
          registeredAt: new Date().toISOString(),
          maxPayloadKg: 1200
        }
      ];
      for (const veh of demoVehicles) {
        await setDoc(doc(db, 'company_erp_data', tenantId, 'fleet_inventory', veh.id), veh, { merge: true });
      }
    }

    showToast('Commandes, Bons de Préparation et Véhicules générés avec succès.', 'success');
  };

  // Toggle Selection (Blocked if picking status is not PRÊT AU QUAI / PRÉPARÉ)
  const toggleSelectInvoice = (id: string) => {
    const inv = pendingInvoices.find(i => i.id === id);
    if (inv) {
      const pickInfo = getInvoicePickingInfo(inv);
      if (!pickInfo.isReadyForDispatch) {
        showToast(
          `🔒 Affectation camion impossible : La commande ${inv.invoiceNumber || inv.id} est en cours de préparation au dépôt (Quai non attribué). Validation "PRÊT AU QUAI" requise.`,
          'error'
        );
        return;
      }
    }

    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter awaiting invoices
  const awaitingInvoices = useMemo(() => {
    return pendingInvoices.filter(i => {
      const isPending = (i.delivery_status || 'en_attente') === 'en_attente';
      const matchChannel = channelFilter === 'ALL' || (i.sales_channel || 'web') === channelFilter;
      return isPending && matchChannel;
    });
  }, [pendingInvoices, channelFilter]);

  const toggleSelectAll = () => {
    const readyInvoices = awaitingInvoices.filter(inv => getInvoicePickingInfo(inv).isReadyForDispatch);
    const readyIds = readyInvoices.map(i => i.id);

    if (readyIds.length === 0) {
      showToast('⚠️ Aucune commande "PRÊT AU QUAI" disponible à sélectionner.', 'error');
      return;
    }

    const allReadySelected = readyIds.every(id => selectedInvoiceIds.includes(id));
    if (allReadySelected) {
      setSelectedInvoiceIds(prev => prev.filter(id => !readyIds.includes(id)));
    } else {
      setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...readyIds])));
    }
  };

  // Generate Delivery Tour
  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInvoiceIds.length === 0) {
      showToast('Veuillez sélectionner au moins une facture / commande à livrer.', 'error');
      return;
    }

    if (!selectedDriverName) {
      showToast('Veuillez désigner le chauffeur responsable de la tournée.', 'error');
      return;
    }

    if (isPayloadOverloaded) {
      showToast(`⚠️ Attention: Le poids total (${totalPayloadWeightKg} kg) dépasse la charge utile max du véhicule (${selectedVehicleMaxPayloadKg} kg). Risque de surcharge!`, 'error');
    }

    const tourId = `TOUR-${Date.now()}`;
    const tourNumber = `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const selectedInvoicesList = pendingInvoices.filter(i => selectedInvoiceIds.includes(i.id));

    // Determine primary pickup warehouse from selected invoices
    const primaryWarehouse = selectedInvoicesList[0]?.warehouse_location || 'Dépôt Central - Radès (Tunis)';

    const tourOrders: DeliveryTourOrder[] = selectedInvoicesList.map(inv => {
      const info = getInvoicePickingInfo(inv);

      let pickupStops: DeliveryPickupStop[] = [];
      if (info.hasPickingOrders && info.pickingOrders.length > 0) {
        pickupStops = info.pickingOrders.map((po, idx) => ({
          stop_id: `STOP-${po.id}`,
          warehouse_id: po.warehouseId || `wh_${idx + 1}`,
          warehouse_name: po.warehouseName,
          dock_number: po.dockNumber || info.dockNumber || `Quai 1 - ${po.warehouseName}`,
          address: `${po.warehouseName} (${po.dockNumber || info.dockNumber || 'Quai 1'})`,
          items: po.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
          status: 'en_attente'
        }));
      } else {
        const whName = inv.warehouse_location || 'Dépôt Central - Radès (Tunis)';
        pickupStops = [{
          stop_id: `STOP-${inv.id}-DEF`,
          warehouse_id: 'wh_default',
          warehouse_name: whName,
          dock_number: info.dockNumber || 'Quai 1 - Dépôt Central',
          address: `${whName} - ${info.dockNumber || 'Quai 1'}`,
          items: [{ productName: `Colis commande ${inv.invoiceNumber}`, quantity: 1 }],
          status: 'en_attente'
        }];
      }

      const creditInfo = getClientCreditInfo(inv);

      return {
        order_id: inv.id,
        client_name: inv.clientName,
        address: inv.delivery_address || 'Adresse Siège Client',
        amount_ttc: inv.amountTTC,
        amount_ht: inv.amountHT,
        delivery_status: 'en_transit',
        sales_channel: inv.sales_channel || 'web',
        warehouse_location: info.warehouses.join(' + '),
        dock_number: info.dockNumber || 'Quai 1 - Dépôt Central',
        warehouses_involved: info.warehouses,
        pickup_stops: pickupStops,
        clientCreditAlert: creditInfo
      };
    });

    const newTour: DeliveryTour = {
      id: tourId,
      tenantId,
      tour_number: tourNumber,
      driver_id: selectedDriverId || 'emp_drv_01',
      driver_name: selectedDriverName,
      vehicle_id: selectedVehicleId || 'v_default',
      vehicle_name: selectedVehicleName || 'Camion Logistics 12T',
      pickup_warehouse: primaryWarehouse,
      warehouse_location: primaryWarehouse,
      orders: tourOrders,
      status: 'en_cours',
      created_at: new Date().toISOString(),
      notes: tourNotes.trim() || '',
      total_weight_kg: totalPayloadWeightKg,
      vehicle_max_payload_kg: selectedVehicleMaxPayloadKg,
      payload_ratio_percent: payloadRatioPercent
    };

    // 1. Save Tour in Firestore
    await setDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tourId), newTour);

    // 2. Reserve Stock in Firestore for each invoice item
    for (const inv of selectedInvoicesList) {
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'invoices', inv.id), {
        delivery_status: 'en_transit'
      });

      const stockResDocId = `RES_${inv.id}`;
      await setDoc(doc(db, 'company_erp_data', tenantId, 'stock_reservations', stockResDocId), {
        id: stockResDocId,
        tenantId,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        status: 'RESERVE_EN_PREPARATION',
        tourNumber,
        reservedAt: new Date().toISOString()
      }, { merge: true });
    }

    showToast(`Tournée ${tourNumber} créée avec succès. Stock réservé & Tournée notifiée au chauffeur.`, 'success');
    setSelectedInvoiceIds([]);
    setTourNotes('');
    setSelectedDriverName('');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    setSelectedVehicleName('');
  };

  // Open Evening Closure Modal
  const handleOpenEveningClosure = (tour: DeliveryTour) => {
    let cash = 0;
    let cheques = 0;
    let rs = 0;

    tour.orders.forEach(o => {
      if (o.delivery_status === 'livre' && o.payment_collected) {
        if (o.payment_collected.method === 'CASH') cash += o.payment_collected.amountTTC || 0;
        if (o.payment_collected.method === 'CHEQUE') cheques += o.payment_collected.amountTTC || 0;
      }
      if (o.withholding_tax_rs?.enabled) rs += o.withholding_tax_rs.amountRS || 0;
    });

    setActualCashCounted(cash);
    setActualChequesCounted(cheques);
    setActualRSCounted(rs);
    setClosingTour(tour);
  };

  // Confirm Evening Tour Closure & Treasury Injection
  const handleConfirmEveningClosure = async () => {
    if (!closingTour) return;

    let expectedCash = 0;
    let expectedCheques = 0;
    let expectedRS = 0;

    closingTour.orders.forEach(o => {
      if (o.delivery_status === 'livre' && o.payment_collected) {
        if (o.payment_collected.method === 'CASH') expectedCash += o.payment_collected.amountTTC || 0;
        if (o.payment_collected.method === 'CHEQUE') expectedCheques += o.payment_collected.amountTTC || 0;
      }
      if (o.withholding_tax_rs?.enabled) expectedRS += o.withholding_tax_rs.amountRS || 0;
    });

    const totalExpected = expectedCash + expectedCheques;
    const totalActual = actualCashCounted + actualChequesCounted;
    const cashGap = totalActual - totalExpected;

    const closureStatus = cashGap === 0 ? 'CONFORME' : 'ARBITRAGE_REQUIS';

    const eveningClosureObj: EveningTourClosure = {
      closedAt: new Date().toISOString(),
      closedBy: 'Responsable Caisse & Dispatch',
      expectedCash,
      actualCash: actualCashCounted,
      expectedCheques,
      actualCheques: actualChequesCounted,
      expectedRSAmount: expectedRS,
      actualRSAmount: actualRSCounted,
      cashGap,
      status: closureStatus,
      endingOdometerKm: endingOdometer,
      startingOdometerKm: 120000,
      distanceTraveledKm: Math.max(0, endingOdometer - 120000),
      fuelExpensesTND: fuelExpenses,
      tollExpensesTND: tollExpenses
    };

    try {
      // 1. Update Tour status & evening_closure object in Firestore
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', closingTour.id), {
        status: 'cloturee_validee',
        evening_closure: eveningClosureObj
      });

      // 2. Inject Treasury Cash/Cheque entry in company_erp_data/{tenantId}/bank_transactions
      const txId = `TX_DISPATCH_${closingTour.tour_number}`;
      await setDoc(doc(db, 'company_erp_data', tenantId, 'bank_transactions', txId), {
        id: txId,
        tenantId,
        date: new Date().toISOString(),
        description: `Recette Tournée ${closingTour.tour_number} - Chauffeur ${closingTour.driver_name}`,
        amount: totalActual,
        type: 'Credit',
        category: 'Encaissement Livraison Client',
        account: 'Caisse Centrale Tunis',
        reconciled: true,
        reference: closingTour.tour_number,
        notes: cashGap !== 0 ? `⚠️ Écart de caisse livreur: ${cashGap.toFixed(3)} TND` : 'Décharge caisse conforme'
      }, { merge: true });

      // 3. Update Vehicle Odometer in fleet_inventory
      if (closingTour.vehicle_id && endingOdometer > 0) {
        await setDoc(doc(db, 'company_erp_data', tenantId, 'fleet_inventory', closingTour.vehicle_id), {
          mileage: endingOdometer,
          registeredAt: new Date().toISOString()
        }, { merge: true });
      }

      setClosingTour(null);
      showToast(`✅ Clôture de la tournée ${closingTour.tour_number} effectuée et injectée en trésorerie !`, 'success');
    } catch (err) {
      console.error('Error closing tour:', err);
      showToast('Erreur lors de la clôture de tournée.', 'error');
    }
  };

  // Filtered tours for Zone 3
  const filteredTours = useMemo(() => {
    return deliveryTours.filter(tour => {
      const matchSearch = !searchTerm || 
        tour.tour_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = tourStatusFilter === 'ALL' || tour.status === tourStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [deliveryTours, searchTerm, tourStatusFilter]);

  // Dynamic Driver Grouping for Zone 3
  const driverGroups = useMemo(() => {
    const map = new Map<string, { driverId: string; driverName: string; tours: DeliveryTour[] }>();
    filteredTours.forEach(t => {
      const key = t.driver_name || 'Chauffeur Non Spécifié';
      if (!map.has(key)) {
        map.set(key, { driverId: t.driver_id, driverName: key, tours: [] });
      }
      map.get(key)!.tours.push(t);
    });
    return Array.from(map.values());
  }, [filteredTours]);

  // Channel Badge Helper
  const renderChannelBadge = (channel?: 'web' | 'pos' | 'field_sales') => {
    switch (channel) {
      case 'web':
        return (
          <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Globe className="w-3 h-3 text-sky-600 shrink-0" />
            <span>Web</span>
          </span>
        );
      case 'pos':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <ShoppingCart className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Caisse POS</span>
          </span>
        );
      case 'field_sales':
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Briefcase className="w-3 h-3 text-purple-600 shrink-0" />
            <span>Commercial</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
            <span>Commande</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans" id="dispatch-tour-manager-page">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center space-x-3 transition-all animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' :
          toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-display text-white">
                Expéditions & Dispatching des Tournées
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Pipeline Intégral : RH Chauffeurs, Flotte, Contrôle Payload, Sécurité Crédit Client & Décharge Caisse
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSeedDemoInvoices}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md transition cursor-pointer shrink-0 border-0"
          id="btn-seed-demo-invoices"
        >
          <Sparkles className="w-4 h-4 text-sky-200" />
          <span>Générer Factures & Flotte Démo</span>
        </button>
      </div>

      {/* Grid Zone 1 & Zone 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ZONE 1: Commandes en Attente de Livraison Multi-Canaux (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                  1. File d'Attente Multi-Canaux (Dispatch Admin)
                </h3>
                <p className="text-xs text-slate-500">
                  {awaitingInvoices.length} commande(s) non livrée(s) prête(s) pour expédition.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous les Canaux</option>
                <option value="web">🌐 Commande Web</option>
                <option value="pos">🛒 Vente Caisse (POS)</option>
                <option value="field_sales">💼 Commercial Terrain</option>
              </select>

              {awaitingInvoices.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer shrink-0"
                >
                  {selectedInvoiceIds.length === awaitingInvoices.length ? 'Tout décocher' : 'Tout sélec.'}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
            {loadingInvoices ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 animate-spin text-sky-500" />
                <span>Chargement de la file d'attente...</span>
              </div>
            ) : awaitingInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-sans space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  Aucune commande en attente dans ce canal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {awaitingInvoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.id);
                  const pickInfo = getInvoicePickingInfo(inv);
                  const creditInfo = getClientCreditInfo(inv);
                  const isReady = pickInfo.isReadyForDispatch;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        if (!isReady) {
                          showToast(
                            `🔒 Affectation camion impossible : La commande ${inv.invoiceNumber || inv.id} est en cours de préparation au dépôt (Quai non attribué).`,
                            'error'
                          );
                          return;
                        }
                        toggleSelectInvoice(inv.id);
                      }}
                      className={`p-4 rounded-2xl border transition flex items-start space-x-3 ${
                        !isReady
                          ? 'bg-slate-50/90 border-slate-200 opacity-80 cursor-not-allowed'
                          : isSelected 
                          ? 'bg-sky-50/90 border-sky-400 shadow-xs ring-1 ring-sky-300 cursor-pointer' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isReady}
                        onChange={() => {
                          if (isReady) toggleSelectInvoice(inv.id);
                        }}
                        className={`mt-1 rounded h-4 w-4 ${
                          isReady
                            ? 'text-sky-600 focus:ring-sky-500 cursor-pointer'
                            : 'text-slate-300 opacity-50 cursor-not-allowed'
                        }`}
                      />

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                              {inv.invoiceNumber}
                            </span>
                            {renderChannelBadge(inv.sales_channel)}
                          </div>
                          <span className="font-black text-slate-900 text-sm font-display">
                            {inv.amountTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} TND
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {inv.clientName}
                        </h4>

                        {/* Picking Readiness & Loading Dock Number Badge */}
                        {isReady ? (
                          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>✅ PRÊT AU QUAI - Colisage Validé</span>
                            </span>
                            <span className="bg-emerald-700 text-white font-mono text-[10px] px-2.5 py-0.5 rounded shadow-xs font-black">
                              📍 {pickInfo.dockNumber}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-[11px] text-amber-800 font-bold flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                              <span>⏳ En cours de préparation au dépôt (Quai non attribué)</span>
                            </span>
                            <span className="bg-amber-200 text-amber-900 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-300 font-black">
                              🔒 Affectation bloquée
                            </span>
                          </div>
                        )}

                        {/* CRM Credit Limit Alert Badge */}
                        {creditInfo.isExceeded ? (
                          <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-[11px] text-rose-800 font-bold flex items-center space-x-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>⚠️ ALERTE ENCOURS CLIENT : Encours {creditInfo.currentOutstanding.toLocaleString()} TND &gt; Plafond {creditInfo.creditLimit.toLocaleString()} TND</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Encours & Crédit Client Conformes</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Warehouse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{inv.warehouse_location || 'Dépôt Central Radès'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{inv.delivery_address || 'Adresse Siège'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ZONE 2: Formulaire de Création de Tournée & Contrôle Payload (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-150 pb-3 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                2. Configuration Tournée & Payload
              </h3>
              <p className="text-xs text-slate-500">
                Affectation RH, Flotte et Contrôle de Poids Utile.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateTour} className="space-y-4">
            
            {/* Payload Weight Control Bar */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isPayloadOverloaded ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse' :
              payloadRatioPercent > 85 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center space-x-1.5 font-mono uppercase text-[11px]">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <span>Jauge Charge Utile :</span>
                </span>
                <span className="font-mono font-black">{totalPayloadWeightKg.toLocaleString()} / {selectedVehicleMaxPayloadKg.toLocaleString()} kg ({payloadRatioPercent}%)</span>
              </div>

              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPayloadOverloaded ? 'bg-rose-600' :
                    payloadRatioPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, payloadRatioPercent)}%` }}
                ></div>
              </div>

              {isPayloadOverloaded && (
                <div className="text-[10px] font-bold text-rose-700 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>⚠️ SURCHARGE : Réduisez le nombre de commandes ou choisissez un camion poids lourd.</span>
                </div>
              )}
            </div>

            {/* Selected Driver RH Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chauffeur / Livreur Affecté (RH) :
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => {
                  const drv = driversList.find(d => d.id === e.target.value);
                  setSelectedDriverId(e.target.value);
                  setSelectedDriverName(drv ? drv.name : '');
                }}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Sélectionner un Chauffeur Filtré --</option>
                {driversList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} [{d.availabilityStatus}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Vehicle Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Véhicule de la Flotte (En Circulation) :
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => {
                  const veh = filteredVehicles.find(v => v.id === e.target.value);
                  setSelectedVehicleId(e.target.value);
                  setSelectedVehicleName(veh ? `${veh.device_name} (${veh.serial_reference})` : '');
                }}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Sélectionner un Véhicule Filtré --</option>
                {filteredVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    🚗 {v.device_name} ({v.serial_reference}) - Max {v.maxPayloadKg?.toLocaleString()} kg
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Orders Dock Preview */}
            {selectedInvoiceIds.length > 0 && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-emerald-900 font-extrabold">
                  <span>📦 Commandes Validées au Quai ({selectedInvoiceIds.length}) :</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Quais Attribués</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {pendingInvoices.filter(i => selectedInvoiceIds.includes(i.id)).map(inv => {
                    const info = getInvoicePickingInfo(inv);
                    return (
                      <div key={inv.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-emerald-100 text-[11px] shadow-2xs">
                        <span className="font-bold text-slate-800 font-mono truncate max-w-[180px]">{inv.invoiceNumber} - {inv.clientName}</span>
                        <span className="font-mono text-emerald-800 font-black bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[10px] shrink-0">
                          📍 {info.dockNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tour Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Consignes Spéciales / Notes Dispatch :
              </label>
              <textarea
                rows={2}
                value={tourNotes}
                onChange={(e) => setTourNotes(e.target.value)}
                placeholder="ex: Vérifier bon de décharge au quai, livraison prioritaire avant 12h..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={selectedInvoiceIds.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition cursor-pointer disabled:opacity-50 border-0"
              id="btn-create-tour-dispatch"
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>Générer Tournée ({selectedInvoiceIds.length} cmd)</span>
            </button>

          </form>
        </div>

      </div>

      {/* ZONE 3: Suivi Dynamic des Tournées & Clôture Soirée */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-150 pb-4">
          <div className="flex items-center space-x-3">
            <Layers className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display tracking-wider">
                3. Tableau de Suivi des Tournées & Clôture de Caisse Soirée
              </h3>
              <p className="text-xs text-slate-500">
                Suivi en temps réel des livraisons terrain et décharge caissier fin de journée.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={tourStatusFilter}
              onChange={(e) => setTourStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="en_cours">🚚 Tournée En Cours</option>
              <option value="terminee">✅ Tournée Terminée</option>
              <option value="cloturee_validee">🔐 Clôturée & Rapprochée</option>
            </select>
          </div>
        </div>

        {/* Tour List */}
        {loadingTours ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 animate-spin text-sky-500" />
            <span>Chargement des tournées...</span>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-sans">
            <p className="text-xs font-bold text-slate-600">Aucune tournée active enregistrée.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTours.map((tour) => {
              const deliveredCount = tour.orders.filter(o => o.delivery_status === 'livre').length;
              const totalCount = tour.orders.length;
              const isTerminee = tour.status === 'terminee';
              const isCloturee = tour.status === 'cloturee_validee';

              return (
                <div key={tour.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {tour.tour_number}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm font-display">
                          {tour.driver_name}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        Véhicule: {tour.vehicle_name} • Dépôt Ramassage: {tour.pickup_warehouse || 'Dépôt Central'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCloturee ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        isTerminee ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}>
                        {isCloturee ? '🔐 CLÔTURÉE & RAPPROCHÉE' : isTerminee ? '✅ TERMINÉE (À RAPPROCHER)' : '🚚 EN COURS'}
                      </span>

                      {/* Evening Closure Action Button */}
                      {!isCloturee && (
                        <button
                          onClick={() => handleOpenEveningClosure(tour)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs uppercase flex items-center space-x-1.5 shadow-sm transition cursor-pointer border-0"
                        >
                          <Lock className="w-3.5 h-3.5 text-purple-200" />
                          <span>Clôturer & Décharge Soirée</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Orders Summary inside tour */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-700 font-bold border-b border-slate-100 pb-2">
                      <span>Commandes Incluses ({deliveredCount}/{totalCount} livrées)</span>
                      <span className="font-mono text-indigo-600">{tour.orders.reduce((sum, o) => sum + o.amount_ttc, 0).toLocaleString()} TND</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {tour.orders.map((o) => (
                        <div key={o.order_id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-bold text-slate-900 block">{o.client_name}</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-slate-500 text-[10px]">{o.order_id}</span>
                              <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-200">
                                📍 {o.dock_number || 'Quai 1'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            o.delivery_status === 'livre' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.delivery_status === 'livre' ? 'LIVRÉ' : 'EN TRANSIT'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EVENING TOUR CLOSURE & CASHIER RECONCILIATION MODAL */}
      {closingTour && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                  CLÔTURE SOIRÉE & DECHARGE CAISSIER
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Rapprochement Caisse Tournée {closingTour.tour_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Chauffeur: {closingTour.driver_name} • Véhicule: {closingTour.vehicle_name}
                </p>
              </div>

              <button
                onClick={() => setClosingTour(null)}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs Form */}
            <div className="space-y-3 text-xs">
              
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl space-y-2 text-purple-900 font-bold">
                <span className="uppercase text-[10px] font-mono block">1. Décharge Encaissements Livreur</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Espèces Comptées (TND) :</label>
                    <input
                      type="number"
                      value={actualCashCounted}
                      onChange={(e) => setActualCashCounted(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Chèques Remis (TND) :</label>
                    <input
                      type="number"
                      value={actualChequesCounted}
                      onChange={(e) => setActualChequesCounted(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 mb-1">Certificats Retenue à la Source RS 1.5% (TND) :</label>
                  <input
                    type="number"
                    value={actualRSCounted}
                    onChange={(e) => setActualRSCounted(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                <span className="uppercase text-[10px] font-mono text-slate-600 font-bold block">2. Compteur Odomètre & Frais de Route</span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold mb-1">Odomètre Fin (km) :</label>
                    <input
                      type="number"
                      value={endingOdometer}
                      onChange={(e) => setEndingOdometer(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-mono text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold mb-1">Frais Carburant (TND) :</label>
                    <input
                      type="number"
                      value={fuelExpenses}
                      onChange={(e) => setFuelExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold mb-1">Frais Péage (TND) :</label>
                    <input
                      type="number"
                      value={tollExpenses}
                      onChange={(e) => setTollExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Submit */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setClosingTour(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmEveningClosure}
                className="flex-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md cursor-pointer border-0"
              >
                <Lock className="w-4 h-4 text-purple-200" />
                <span>Valider Clôture & Injecter Trésorerie</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
