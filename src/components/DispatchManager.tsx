import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DeliveryTour, DeliveryTourOrder, FleetInventoryItem, PickingOrder, DeliveryPickupStop } from '../types/mobileTerrain';
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
  AlertTriangle
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

  // Dynamic drivers list combining HR collaborators & default drivers
  const driversList = useMemo(() => {
    const list = [...defaultDrivers];
    const existingIds = new Set(list.map(d => d.id));

    if (Array.isArray(employees) && employees.length > 0) {
      employees.forEach(emp => {
        if (emp && emp.id && !existingIds.has(emp.id)) {
          const title = emp.jobTitle || 'Collaborateur';
          list.push({
            id: emp.id,
            name: `${emp.name} (${title})`
          });
          existingIds.add(emp.id);
        }
      });
    }

    return list;
  }, [employees]);

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

  // Helper to resolve picking readiness and multi-warehouse stops for an invoice
  const getInvoicePickingInfo = (inv: Invoice) => {
    const matching = pickingOrders.filter(
      p => p.orderId === inv.id || p.orderId === inv.invoiceNumber
    );

    if (matching.length > 0) {
      const warehouses = Array.from(new Set(matching.map(p => p.warehouseName)));
      const allReady = matching.every(p => p.status === 'pret_chargement');
      const readyCount = matching.filter(p => p.status === 'pret_chargement').length;

      return {
        pickingOrders: matching,
        warehouses,
        allReady,
        readyCount,
        totalCount: matching.length,
        hasPickingOrders: true
      };
    }

    const whName = inv.warehouse_location || 'Dépôt Central - Radès (Tunis)';
    return {
      pickingOrders: [],
      warehouses: [whName],
      allReady: true,
      readyCount: 1,
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

  // Seed demo pending invoices covering all 3 multi-channel sales paths
  const handleSeedDemoInvoices = async () => {
    const demoInvoices: Partial<Invoice>[] = [
      {
        id: 'FAC-2026-0801',
        clientId: 'CLI-001',
        clientName: 'SOCIÉTÉ DU SAHEL DISTRIBUTION',
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
        delivery_address: 'Zone Industrielle Akouda, Lot 14, Sousse',
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
      },
      {
        id: 'FAC-2026-0804',
        clientId: 'CLI-004',
        clientName: 'TRABELSI EQUIPEMENTS & SERVICES',
        invoiceNumber: 'FAC-2026-0804',
        sales_channel: 'web',
        warehouse_location: 'Entrepôt Principal - Z.I. Charguia II',
        amountHT: 5600,
        vatRate: 19,
        vatAmount: 1064,
        withholdingTaxRate: 1.5,
        withholdingAmount: 84,
        amountNetToPay: 6580,
        amountTTC: 6664,
        status: 'Unpaid',
        delivery_status: 'en_attente',
        delivery_address: 'Route de Gabès km 3, Sfax',
        issuedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 20 * 86400000).toISOString(),
        recouvrementSteps: [],
        withholdingCertificateReceived: false
      }
    ];

    for (const inv of demoInvoices) {
      await setDoc(doc(db, 'company_erp_data', tenantId, 'invoices', inv.id!), inv, { merge: true });
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
          registeredAt: new Date().toISOString()
        },
        {
          id: 'v_utilitaire_van',
          tenantId: tenantId,
          fleet_park: 'Flotte Logistique',
          device_name: 'Utilitaire Peugeot Partner',
          serial_reference: 'TN-8840',
          category: 'Véhicule Utilitaire',
          status: 'Available',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'v_camion_toupie',
          tenantId: tenantId,
          fleet_park: 'Flotte Chantiers',
          device_name: 'Camion Malaxeur Toupie BTP',
          serial_reference: 'TN-7712',
          category: 'Engin Chantier',
          status: 'Available',
          registeredAt: new Date().toISOString()
        }
      ];
      for (const veh of demoVehicles) {
        await setDoc(doc(db, 'company_erp_data', tenantId, 'fleet_inventory', veh.id), veh, { merge: true });
      }
    }

    showToast('Commandes multi-canaux et Véhicules de démonstration générés.', 'success');
  };

  // Toggle Selection
  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter awaiting invoices
  const awaitingInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return pendingInvoices.filter(i => {
      const isPending = (i.delivery_status || 'en_attente') === 'en_attente';
      const matchChannel = channelFilter === 'ALL' || (i.sales_channel || 'web') === channelFilter;

      let matchDate = true;
      if (i.issuedDate) {
        const invDateStr = i.issuedDate.split('T')[0];
        const invDate = new Date(i.issuedDate);

        if (dateFilter === 'today') {
          matchDate = invDateStr === todayStr;
        } else if (dateFilter === 'yesterday') {
          matchDate = invDateStr === yesterdayStr;
        } else if (dateFilter === 'this_week') {
          matchDate = invDate >= sevenDaysAgo;
        } else if (dateFilter === 'custom') {
          if (customStartDate && invDateStr < customStartDate) matchDate = false;
          if (customEndDate && invDateStr > customEndDate) matchDate = false;
        }
      }

      return isPending && matchChannel && matchDate;
    });
  }, [pendingInvoices, channelFilter, dateFilter, customStartDate, customEndDate]);

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === awaitingInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(awaitingInvoices.map(i => i.id));
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

    const tourId = `TOUR-${Date.now()}`;
    const tourNumber = `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const selectedInvoicesList = pendingInvoices.filter(i => selectedInvoiceIds.includes(i.id));
    
    // Check if any selected invoice has unready picking orders
    for (const inv of selectedInvoicesList) {
      const info = getInvoicePickingInfo(inv);
      if (info.hasPickingOrders && !info.allReady) {
        showToast(
          `⚠️ Impossible de créer la tournée: La commande ${inv.invoiceNumber} a ${info.readyCount}/${info.totalCount} dépôt(s) 'Prêt au Quai'. Veuillez valider les préparations en dépôt.`,
          'error'
        );
        return;
      }
    }

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
          address: `${po.warehouseName} - Quai de Ramassage #${idx + 1}`,
          items: po.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
          status: 'en_attente'
        }));
      } else if (inv.warehouses_involved && Array.isArray(inv.warehouses_involved) && inv.warehouses_involved.length > 0) {
        pickupStops = inv.warehouses_involved.map((whName, idx) => ({
          stop_id: `STOP-${inv.id}-${idx + 1}`,
          warehouse_id: `wh_${idx + 1}`,
          warehouse_name: whName,
          address: `${whName} - Quai de Ramassage #${idx + 1}`,
          items: inv.items ? inv.items.map(item => ({ productName: item.description || item.code, quantity: item.quantity })) : [{ productName: `Colis ${whName}`, quantity: 1 }],
          status: 'en_attente'
        }));
      } else {
        const whName = inv.warehouse_location || 'Dépôt Central - Radès (Tunis)';
        pickupStops = [{
          stop_id: `STOP-${inv.id}-DEF`,
          warehouse_id: 'wh_default',
          warehouse_name: whName,
          address: `${whName} - Quai de Ramassage`,
          items: [{ productName: `Colis commande ${inv.invoiceNumber}`, quantity: 1 }],
          status: 'en_attente'
        }];
      }

      return {
        order_id: inv.id,
        client_name: inv.clientName,
        address: inv.delivery_address || 'Adresse Siège Client',
        amount_ttc: inv.amountTTC,
        delivery_status: 'en_transit',
        sales_channel: inv.sales_channel || 'web',
        warehouse_location: info.warehouses.join(' + '),
        warehouses_involved: info.warehouses,
        pickup_stops: pickupStops
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
      notes: tourNotes.trim() || ''
    };

    // 1. Save Tour in Firestore
    await setDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tourId), newTour);

    // 2. Update selected Invoices status to 'en_transit'
    for (const invId of selectedInvoiceIds) {
      await updateDoc(doc(db, 'company_erp_data', tenantId, 'invoices', invId), {
        delivery_status: 'en_transit'
      });
    }

    // 3. Toast and Reset
    showToast(`Tournée de livraison ${tourNumber} générée pour ${selectedDriverName}.`, 'success');
    setSelectedInvoiceIds([]);
    setTourNotes('');
    setSelectedDriverName('');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    setSelectedVehicleName('');
  };

  // Mark tour order delivered manually from admin
  const handleMarkOrderDelivered = async (tour: DeliveryTour, orderId: string) => {
    const updatedOrders = tour.orders.map(ord => {
      if (ord.order_id === orderId) {
        return { ...ord, delivery_status: 'livre' as const, delivered_at: new Date().toISOString() };
      }
      return ord;
    });

    const allDelivered = updatedOrders.every(ord => ord.delivery_status === 'livre');
    const newTourStatus = allDelivered ? 'terminee' : tour.status;

    await updateDoc(doc(db, 'company_erp_data', tenantId, 'delivery_tours', tour.id), {
      orders: updatedOrders,
      status: newTourStatus
    });

    await updateDoc(doc(db, 'company_erp_data', tenantId, 'invoices', orderId), {
      delivery_status: 'livre'
    });

    showToast(`Commande ${orderId} marquée comme LIVRÉE.`, 'success');
  };

  // Filtered tours
  const filteredTours = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return deliveryTours.filter(t => {
      const matchStatus = tourStatusFilter === 'ALL' || t.status === tourStatusFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch = t.tour_number.toLowerCase().includes(search) ||
                          t.driver_name.toLowerCase().includes(search) ||
                          t.vehicle_name.toLowerCase().includes(search);

      let matchDate = true;
      if (t.created_at) {
        const tourDateStr = t.created_at.split('T')[0];
        const tourDate = new Date(t.created_at);

        if (dateFilter === 'today') {
          matchDate = tourDateStr === todayStr;
        } else if (dateFilter === 'yesterday') {
          matchDate = tourDateStr === yesterdayStr;
        } else if (dateFilter === 'this_week') {
          matchDate = tourDate >= sevenDaysAgo;
        } else if (dateFilter === 'custom') {
          if (customStartDate && tourDateStr < customStartDate) matchDate = false;
          if (customEndDate && tourDateStr > customEndDate) matchDate = false;
        }
      }

      return matchStatus && matchSearch && matchDate;
    });
  }, [deliveryTours, tourStatusFilter, searchTerm, dateFilter, customStartDate, customEndDate]);

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
            <span>Commande Web / En Ligne</span>
          </span>
        );
      case 'pos':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <ShoppingCart className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Vente Caisse / POS</span>
          </span>
        );
      case 'field_sales':
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Briefcase className="w-3 h-3 text-purple-600 shrink-0" />
            <span>Commercial Terrain</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
            <span>Commande Standard</span>
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
                Dispatching multi-canaux & Suivi dynamique par Chauffeur / Livreur
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
          <span>Générer Factures Multi-Canaux</span>
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

            {/* Filter by Channel */}
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
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Cliquez sur "Générer Factures Multi-Canaux" dans le bandeau supérieur pour tester l'affectation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {awaitingInvoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.id);
                  const pickInfo = getInvoicePickingInfo(inv);

                  return (
                    <div
                      key={inv.id}
                      onClick={() => toggleSelectInvoice(inv.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3 ${
                        isSelected 
                          ? 'bg-sky-50/90 border-sky-400 shadow-xs ring-1 ring-sky-300' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 rounded text-sky-600 focus:ring-sky-500 h-4 w-4 cursor-pointer"
                      />

                      <div className="flex-1 space-y-2">
                        {/* Header line: BL/Invoice # + Sales Channel Badge + Amount */}
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

                        {/* Client Name */}
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {inv.clientName}
                        </h4>

                        {/* Multi-depot visual tag badge */}
                        {(inv.multi_depot_tag || pickInfo.warehouses.length > 1) && (
                          <div className="pt-1">
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-black shadow-xs">
                              <span>{inv.multi_depot_tag || `📍 ${pickInfo.warehouses.length} Dépôts impliqués (${pickInfo.warehouses.join(' + ')})`}</span>
                            </span>
                          </div>
                        )}

                        {/* Explicit Warehouse & Delivery Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div className="flex items-center space-x-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                            <Warehouse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-medium truncate">
                              <strong>Départ:</strong> {pickInfo.warehouses.join(' + ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-medium truncate">
                              <strong>Livraison:</strong> {inv.delivery_address || 'Adresse Siège Client'}
                            </span>
                          </div>
                        </div>

                        {/* Detailed breakdown of pickup warehouses & articles */}
                        {pickInfo.warehouses.length > 1 && (
                          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3 text-xs space-y-2 mt-2 shadow-inner">
                            <div className="flex items-center space-x-1.5 font-black text-amber-400 text-[11px] uppercase tracking-wider font-mono">
                              <Warehouse className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Plan de Ramassage Multi-Dépôts Détaillé ({pickInfo.warehouses.length} Arrêts) :</span>
                            </div>
                            <div className="space-y-1.5 pl-1">
                              {pickInfo.pickingOrders.length > 0 ? (
                                pickInfo.pickingOrders.map((po, idx) => (
                                  <div key={po.id} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                    <div>
                                      <span className="font-black text-amber-300 font-mono text-[12px] block">
                                        Arrêt #{idx + 1} : {po.warehouseName}
                                      </span>
                                      <p className="text-slate-300 text-[11px] mt-0.5 font-sans font-medium">
                                        {po.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                                      </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider self-start sm:self-auto ${
                                      po.status === 'pret_chargement' 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}>
                                      {po.status === 'pret_chargement' ? '🟢 Prêt au quai' : '⏳ Préparation'}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                pickInfo.warehouses.map((whName, idx) => {
                                  const matchingItem = inv.items && inv.items[idx];
                                  return (
                                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                      <div>
                                        <span className="font-black text-amber-300 font-mono text-[12px] block">
                                          Arrêt #{idx + 1} : {whName}
                                        </span>
                                        {matchingItem && (
                                          <p className="text-slate-300 text-[11px] mt-0.5 font-sans font-medium">
                                            {matchingItem.description || matchingItem.code} (x{matchingItem.quantity})
                                          </p>
                                        )}
                                      </div>
                                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider self-start sm:self-auto">
                                        🟢 Prêt au quai
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Multi-Warehouse Picking Preparation Badge */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
                          <span className="text-[11px] font-extrabold text-slate-600 flex items-center space-x-1">
                            <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{pickInfo.warehouses.length} dépôt(s) impliqué(s)</span>
                          </span>

                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider border ${
                            pickInfo.allReady 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {pickInfo.allReady ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>🟢 Prêt au Quai</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-spin" />
                                <span>⏳ En attente Dépôt ({pickInfo.readyCount}/{pickInfo.totalCount})</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>{selectedInvoiceIds.length} commande(s) sélectionnée(s)</span>
            <span className="text-sky-700 font-mono">
              Total TTC : {
                pendingInvoices
                  .filter(i => selectedInvoiceIds.includes(i.id))
                  .reduce((acc, i) => acc + i.amountTTC, 0)
                  .toLocaleString('fr-FR', { minimumFractionDigits: 2 })
              } TND
            </span>
          </div>
        </div>

        {/* ZONE 2: Constructeur de Tournée (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-150 pb-4 mb-4">
              <Navigation className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                  2. Constructeur de Tournée & Dispatching
                </h3>
                <p className="text-xs text-slate-500">
                  Affectation du Chauffeur, du Véhicule et de l'Entrepôt
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTour} className="space-y-4 text-xs font-sans">
              
              {/* Select Driver */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  CHAUFFEUR / LIVREUR RESPONSABLE *
                </label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => {
                    const drvId = e.target.value;
                    setSelectedDriverId(drvId);
                    const found = driversList.find(d => d.id === drvId);
                    if (found) setSelectedDriverName(found.name);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-bold text-slate-800"
                  id="select-tour-driver"
                >
                  <option value="">-- Sélectionner un Chauffeur Habilité --</option>
                  {driversList.map(drv => (
                    <option key={drv.id} value={drv.id}>
                      {drv.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Vehicle from fleet_inventory */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block flex justify-between">
                  <span>VÉHICULE DE LIVRAISON (`fleet_inventory`) *</span>
                  <span className="text-[9px] text-emerald-600 font-bold">{availableVehicles.length} disponible(s)</span>
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const vehId = e.target.value;
                    setSelectedVehicleId(vehId);
                    const found = availableVehicles.find(v => v.id === vehId);
                    if (found) setSelectedVehicleName(`${found.device_name} [${found.serial_reference}]`);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-bold text-slate-800"
                  id="select-tour-vehicle"
                >
                  <option value="">-- Choisir un Véhicule du Parc --</option>
                  {availableVehicles.map(veh => (
                    <option key={veh.id} value={veh.id}>
                      {veh.device_name} — VIN/Réf: {veh.serial_reference} ({veh.category || 'Véhicule'})
                    </option>
                  ))}
                  <option value="v_camion_12t">Camion Isuzu 12 Tonnes [Immat TN-9021]</option>
                  <option value="v_utilitaire_van">Utilitaire Peugot Partner [Immat TN-8840]</option>
                </select>
              </div>

              {/* Route Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  CONSIGNES DE ROUTE & CONSIGNES CHAUFFEUR
                </label>
                <textarea
                  rows={3}
                  placeholder="ex: Récupérer la commande au Dépôt Radès à 07:30, faire signer le BL client..."
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium text-slate-800 resize-none"
                  id="textarea-tour-notes"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-[11px] leading-relaxed">
                💡 Les commandes sélectionnées basculeront en <code>'en_transit'</code> et apparaîtront directement sur l'application mobile <strong>Elyssa Pocket</strong> du chauffeur.
              </div>

              <button
                type="submit"
                disabled={selectedInvoiceIds.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer ${
                  selectedInvoiceIds.length > 0
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                id="btn-generate-delivery-tour"
              >
                <Truck className="w-4 h-4 stroke-[2.5]" />
                <span>GÉNÉRER LA TOURNÉE ({selectedInvoiceIds.length} LIVRAISONS)</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ZONE 3: Vues Dynamiques par Livreur & Suivi des Tournées */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-4">
        
        {/* Zone 3 Header Controls */}
        <div className="px-6 py-4 border-b border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Suivi & Logistique des Tournées Déployées (`delivery_tours`)</span>
            </h3>
            <p className="text-xs text-slate-500">
              {deliveryTours.length} tournée(s) au registre d'expéditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Date Range Filter */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700/80 p-1 rounded-2xl text-xs font-bold shadow-inner">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                  dateFilter === 'all'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Toutes Dates
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                  dateFilter === 'today'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                  dateFilter === 'yesterday'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Hier
              </button>
              <button
                onClick={() => setDateFilter('this_week')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                  dateFilter === 'this_week'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cette Semaine
              </button>
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                  dateFilter === 'custom'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Personnalisé
              </button>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-1 text-xs">
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-700 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-700 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* View Mode Toggle: Driver Cards vs All Tours */}
            <div className="bg-slate-900 border border-slate-700/80 p-1 rounded-2xl flex items-center space-x-1 text-xs font-bold shadow-inner">
              <button
                onClick={() => setZone3ViewMode('by_driver')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 font-bold ${
                  zone3ViewMode === 'by_driver' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span>🚚 Vues par Livreur</span>
              </button>

              <button
                onClick={() => setZone3ViewMode('all_tours')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 font-bold ${
                  zone3ViewMode === 'all_tours' 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-sky-300" />
                <span>📋 Toutes les Tournées</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 md:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher tournée..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={tourStatusFilter}
              onChange={(e) => setTourStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous Statuts</option>
              <option value="en_cours">En Cours (En Transit)</option>
              <option value="terminee">Terminée (Livrée)</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {loadingTours ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 animate-spin text-sky-500" />
              <span>Chargement des tournées...</span>
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Aucune tournée enregistrée.
            </div>
          ) : zone3ViewMode === 'by_driver' ? (
            /* VUES DYNAMIQUES PAR LIVREUR */
            <div className="space-y-6" id="dynamic-driver-views-container">
              {driverGroups.map((group) => {
                const totalOrdersAllTours = group.tours.reduce((acc, t) => acc + t.orders.length, 0);
                const totalDeliveredAllTours = group.tours.reduce((acc, t) => acc + t.orders.filter(o => o.delivery_status === 'livre').length, 0);
                const overallProgressPct = Math.round((totalDeliveredAllTours / totalOrdersAllTours) * 100) || 0;

                return (
                  <div key={group.driverName} className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                    
                    {/* Driver Card Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-black text-xl">
                          🚚
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 font-mono block">
                            FICHE LIVREUR ACTIVE
                          </span>
                          <h3 className="text-lg font-black text-white font-display flex items-center space-x-2">
                            <span>Tournée : {group.driverName}</span>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">Avancement Global Chauffeur</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            {totalDeliveredAllTours} / {totalOrdersAllTours} Livrés ({overallProgressPct}%)
                          </span>
                        </div>
                        <div className="w-24 bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${overallProgressPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Tours for this driver */}
                    <div className="space-y-4">
                      {group.tours.map((tour) => {
                        const deliveredCount = tour.orders.filter(o => o.delivery_status === 'livre').length;
                        const totalCount = tour.orders.length;
                        const progressPct = Math.round((deliveredCount / totalCount) * 100) || 0;
                        const pickupWarehouse = tour.pickup_warehouse || tour.warehouse_location || tour.orders[0]?.warehouse_location || 'Dépôt Central';

                        return (
                          <div key={tour.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-black text-sky-300 bg-sky-950 px-2.5 py-0.5 rounded border border-sky-800">
                                  {tour.tour_number}
                                </span>

                                {/* Entrepôt de ramassage */}
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800">
                                  <Warehouse className="w-3.5 h-3.5 shrink-0" />
                                  <span>Ramassage : {pickupWarehouse}</span>
                                </span>

                                {/* Assigned Vehicle */}
                                <span className="inline-flex items-center space-x-1 text-xs font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                                  <Car className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                  <span>{tour.vehicle_name}</span>
                                </span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border self-start sm:self-auto ${
                                tour.status === 'terminee'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              }`}>
                                {tour.status === 'terminee' ? 'LIVRÉE / TERMINÉE' : 'EN COURS DE LIVRAISON'}
                              </span>
                            </div>

                            {/* BL Numbers Badge List */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                                BLs Associés :
                              </span>
                              {tour.orders.map(ord => (
                                <span key={ord.order_id} className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                  ord.delivery_status === 'livre'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                    : 'bg-slate-800 text-sky-300 border-slate-700'
                                }`}>
                                  {ord.order_id} {ord.delivery_status === 'livre' ? '✓' : ''}
                                </span>
                              ))}
                            </div>

                            {/* Stops Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                              {tour.orders.map((ord, idx) => (
                                <div key={ord.order_id} className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                  ord.delivery_status === 'livre'
                                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                                    : 'bg-slate-950 border-slate-800 text-slate-200'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[10px] font-bold text-slate-400">
                                      Stop #{idx + 1} • {ord.order_id}
                                    </span>
                                    {renderChannelBadge(ord.sales_channel)}
                                  </div>

                                  <strong className="text-white font-extrabold block text-sm">{ord.client_name}</strong>
                                  
                                  <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span className="truncate">{ord.address}</span>
                                  </div>

                                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-emerald-400 font-mono">{ord.amount_ttc.toLocaleString('fr-FR')} TND</span>
                                    {ord.delivery_status === 'livre' ? (
                                      <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>LIVRÉ</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleMarkOrderDelivered(tour, ord.order_id)}
                                        className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700 cursor-pointer"
                                      >
                                        Valider
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* VUE TOUTES LES TOURNÉES (STANDARD) */
            <div className="space-y-4" id="all-tours-view-container">
              {filteredTours.map((tour) => {
                const deliveredCount = tour.orders.filter(o => o.delivery_status === 'livre').length;
                const totalCount = tour.orders.length;
                const progressPct = Math.round((deliveredCount / totalCount) * 100) || 0;
                const pickupWarehouse = tour.pickup_warehouse || tour.warehouse_location || 'Dépôt Central';

                return (
                  <div key={tour.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4 hover:border-slate-300 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-150 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                          tour.status === 'terminee' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' 
                            : 'bg-sky-50 border border-sky-200 text-sky-600'
                        }`}>
                          <Truck className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black text-slate-900">{tour.tour_number}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              tour.status === 'terminee'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {tour.status === 'terminee' ? 'LIVRÉE / TERMINÉE' : 'EN COURS DE LIVRAISON'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                            <span className="flex items-center space-x-1">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <strong className="text-slate-800">{tour.driver_name}</strong>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-slate-700">Ramassage : {pickupWarehouse}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tour.vehicle_name}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Créée le {new Date(tour.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-bold text-slate-700">Progression: {deliveredCount} / {totalCount} livrés</span>
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Orders in Tour */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tour.orders.map((ord, idx) => (
                        <div key={ord.order_id} className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          ord.delivery_status === 'livre'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] font-bold text-slate-700">
                              Étape #{idx + 1} • {ord.order_id}
                            </span>
                            {renderChannelBadge(ord.sales_channel)}
                          </div>

                          <strong className="text-slate-900 font-bold block">{ord.client_name}</strong>
                          <div className="text-slate-500 text-[11px] flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{ord.address}</span>
                          </div>

                          <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">{ord.amount_ttc.toLocaleString('fr-FR')} TND</span>
                            {ord.delivery_status !== 'livre' && (
                              <button
                                onClick={() => handleMarkOrderDelivered(tour, ord.order_id)}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 cursor-pointer"
                              >
                                Valider Livraison
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
