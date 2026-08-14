import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { 
  MobileDevice, 
  FieldSession, 
  MobileOrder, 
  ChantierReport,
  AssignedModule,
  FleetInventoryItem,
  FleetDeviceStatus
} from '../types/mobileTerrain';

// Fallback demo dataset for MDM Fleet Inventory
const DEMO_FLEET_INVENTORY: FleetInventoryItem[] = [
  {
    id: 'mdm_001',
    tenantId: 'demo_tenant',
    fleet_park: 'Flotte Commerciale & Vente',
    device_name: 'Zebra TC26 Touch Computer',
    serial_reference: 'IMEI: 864201948210394',
    status: 'Available',
    registeredAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mdm_002',
    tenantId: 'demo_tenant',
    fleet_park: 'Flotte Chantiers',
    device_name: 'Samsung Galaxy Tab Active4 Pro',
    serial_reference: 'IMEI: 358912049182301',
    status: 'Available',
    registeredAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mdm_003',
    tenantId: 'demo_tenant',
    fleet_park: 'Flotte Logistique',
    device_name: 'Honeywell ScanPal EDA52',
    serial_reference: 'IMEI: 869012384910283',
    status: 'Available',
    registeredAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mdm_004',
    tenantId: 'demo_tenant',
    fleet_park: 'Flotte Commerciale & Vente',
    device_name: 'Xiaomi Redmi Note 12 Pro 5G',
    serial_reference: 'IMEI: 861234567890123',
    status: 'Assigned',
    assignedTo: 'Sami Ben Ali (EMP-904)',
    registeredAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mdm_005',
    tenantId: 'demo_tenant',
    fleet_park: 'Stock Réserve',
    device_name: 'Samsung Galaxy A54 5G Enterprise',
    serial_reference: 'IMEI: 351239084712039',
    status: 'Maintenance',
    registeredAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
  }
];

// Fallback demo dataset for initial render and offline/sandbox mode
const DEMO_DEVICES: MobileDevice[] = [
  {
    id: 'dev_001',
    tenantId: 'demo_tenant',
    agentId: 'EMP-904',
    agentName: 'Sami Ben Ali',
    deviceModel: 'Terminal Mobile (Mission Vente)',
    assigned_module: 'vente',
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    batteryLevel: 88,
    appVersion: 'v2.4.1',
    macAddress: 'FC:FB:FB:01:22:9A',
    phoneNumber: '+216 98 123 456'
  },
  {
    id: 'dev_002',
    tenantId: 'demo_tenant',
    agentId: 'EMP-912',
    agentName: 'Mohamed Trabelsi',
    deviceModel: 'Terminal Mobile (Mission Chantier)',
    assigned_module: 'chantier',
    lastSync: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    batteryLevel: 64,
    appVersion: 'v2.4.1',
    macAddress: 'AA:BB:CC:44:55:66',
    phoneNumber: '+216 22 987 654'
  },
  {
    id: 'dev_003',
    tenantId: 'demo_tenant',
    agentId: 'EMP-920',
    agentName: 'Youssef Mansour',
    deviceModel: 'Terminal Mobile (Polyvalent Chantier & Vente)',
    assigned_module: 'polyvalent',
    lastSync: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    batteryLevel: 92,
    appVersion: 'v2.4.0',
    macAddress: 'DE:AD:BE:EF:00:11',
    phoneNumber: '+216 55 432 109'
  },
  {
    id: 'dev_004',
    tenantId: 'demo_tenant',
    agentId: 'EMP-935',
    agentName: 'Karem Chaabane',
    deviceModel: 'Xiaomi Redmi Note 12 Pro 5G',
    lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    batteryLevel: 75,
    appVersion: 'v2.4.1',
    macAddress: '77:88:99:11:22:33',
    phoneNumber: '+216 97 654 321'
  },
  {
    id: 'dev_005',
    tenantId: 'demo_tenant',
    agentId: 'EMP-942',
    agentName: 'Fatma Gharbi',
    deviceModel: 'Samsung Galaxy A54 5G Enterprise',
    lastSync: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    batteryLevel: 82,
    appVersion: 'v2.4.1',
    macAddress: '12:34:56:78:90:AB',
    phoneNumber: '+216 29 111 222'
  }
];

const DEMO_SESSIONS: FieldSession[] = [
  {
    id: 'sess_101',
    tenantId: 'demo_tenant',
    agentId: 'EMP-904',
    agentName: 'Sami Ben Ali',
    type: 'VAN_SALES',
    checkIn: {
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      lat: 36.8065,
      lng: 10.1815,
      address: 'Avenue Habib Bourguiba, Tunis Centre'
    },
    status: 'OPEN',
    notes: 'Tournée Van Sales IT grands comptes Tunis Centre'
  },
  {
    id: 'sess_102',
    tenantId: 'demo_tenant',
    agentId: 'EMP-912',
    agentName: 'Mohamed Trabelsi',
    type: 'CHANTIER',
    checkIn: {
      timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      lat: 35.8256,
      lng: 10.6084,
      address: 'Zone Industrielle Poudrière II, Sfax'
    },
    status: 'OPEN',
    notes: 'Supervision chef de chantier Hangar Logistique Sfax'
  },
  {
    id: 'sess_103',
    tenantId: 'demo_tenant',
    agentId: 'EMP-920',
    agentName: 'Youssef Mansour',
    type: 'VAN_SALES',
    checkIn: {
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      lat: 36.8450,
      lng: 10.2700,
      address: 'Les Berges du Lac 2, Tunis'
    },
    status: 'OPEN',
    notes: 'Livraison express client grands comptes zone Lac 2'
  },
  {
    id: 'sess_104',
    tenantId: 'demo_tenant',
    agentId: 'EMP-935',
    agentName: 'Karem Chaabane',
    type: 'CHANTIER',
    checkIn: {
      timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
      lat: 36.4000,
      lng: 10.6167,
      address: 'Chantier Résidence Marina, Nabeul'
    },
    checkOut: {
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      lat: 36.4010,
      lng: 10.6175,
      address: 'Sortie Chantier Marina, Nabeul'
    },
    status: 'CLOSED',
    notes: 'Maintenance préventive groupes électrogènes'
  },
  {
    id: 'sess_105',
    tenantId: 'demo_tenant',
    agentId: 'EMP-942',
    agentName: 'Fatma Gharbi',
    type: 'CHANTIER',
    checkIn: {
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      lat: 36.8500,
      lng: 10.2000,
      address: 'Zone Industrielle Charguia 2, Ariana'
    },
    status: 'OPEN',
    notes: 'Inspection qualité conformité sécurité terrain'
  }
];

const DEMO_ORDERS: MobileOrder[] = [
  {
    id: 'ord_mob_8801',
    tenantId: 'demo_tenant',
    localUuid: 'loc_uuid_001',
    agentId: 'emp_101',
    agentName: 'Sami Mansour',
    clientId: 'cli_001',
    clientName: 'Poulina Group Holding S.A.',
    items: [
      { articleId: 'ART-01', label: 'Solvant Éco Purifié 20L', qty: 10, unitPrice: 220.000, total: 2200.000 },
      { articleId: 'ART-02', label: 'Peinture Industrielle Haute Résistance', qty: 5, unitPrice: 410.000, total: 2050.000 }
    ],
    totalHT: 4250.000,
    totalTTC: 5057.500,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    signatureUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=300&q=80',
    status: 'PENDING_VALIDATION',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'ord_mob_8802',
    tenantId: 'demo_tenant',
    localUuid: 'loc_uuid_002',
    agentId: 'emp_105',
    agentName: 'Amira Trabelsi',
    clientId: 'cli_002',
    clientName: 'Société Tunisienne de Verrerie (SOTUVER)',
    items: [
      { articleId: 'ART-03', label: 'Carton Ondulé Double Cannelure', qty: 200, unitPrice: 6.400, total: 1280.000 }
    ],
    totalHT: 1280.000,
    totalTTC: 1523.200,
    paymentStatus: 'PENDING',
    paymentMethod: 'CHECK',
    signatureUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=300&q=80',
    status: 'PENDING_VALIDATION',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString()
  },
  {
    id: 'ord_mob_8803',
    tenantId: 'demo_tenant',
    localUuid: 'loc_uuid_003',
    agentId: 'emp_101',
    agentName: 'Sami Mansour',
    clientId: 'cli_003',
    clientName: 'SFBT S.A. (Société Frigorifique et Brasserie de Tunis)',
    items: [
      { articleId: 'ART-04', label: 'Fûts Inox 200L Norme Agroalimentaire', qty: 12, unitPrice: 700.000, total: 8400.000 }
    ],
    totalHT: 8400.000,
    totalTTC: 9996.000,
    paymentStatus: 'PAID',
    paymentMethod: 'TRAITE',
    signatureUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=300&q=80',
    status: 'VALIDATED',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString()
  }
];

const DEMO_REPORTS: ChantierReport[] = [
  {
    id: 'rep_chantier_301',
    tenantId: 'demo_tenant',
    chantierId: 'CH-SFAX-01',
    chantierName: 'Hangar Logistique Z.I. Poudrière II Sfax',
    chefChantierId: 'emp_102',
    chefChantierName: 'Khaled Ben Amor',
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    workersPresent: 14,
    materialsConsumed: [
      { articleId: 'MAT-01', articleName: 'Ciment Portland CEM I 42.5 (Sacs 50kg)', qty: 45, unit: 'Sacs' },
      { articleId: 'MAT-02', articleName: 'Treillis Soudé 150x150x6mm', qty: 30, unit: 'Panneaux' },
      { articleId: 'MAT-03', articleName: 'Adjuvant Plastifiant Béton', qty: 50, unit: 'Litres' }
    ],
    photoUrls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ],
    signatureUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=300&q=80',
    notes: 'Coulage de la dalle béton armé effectué conformément aux spécifications techniques. Inspection contrôle qualité validée par l\'ingénieur conseil.',
    status: 'PENDING'
  },
  {
    id: 'rep_chantier_302',
    tenantId: 'demo_tenant',
    chantierId: 'CH-NAB-02',
    chantierName: 'Résidence Elyssa Marina Nabeul',
    chefChantierId: 'emp_103',
    chefChantierName: 'Youssef Chahed',
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    workersPresent: 8,
    materialsConsumed: [
      { articleId: 'MAT-04', articleName: 'Profilés Aluminium Noir Anodisé', qty: 24, unit: 'Barres 6m' },
      { articleId: 'MAT-05', articleName: 'Mastic Étanchéité Polyuréthane', qty: 12, unit: 'Cartouches' }
    ],
    photoUrls: [
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80'
    ],
    signatureUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=300&q=80',
    notes: 'Pose des menuiseries aluminium étage 2 terminée sans réserve. Test d\'étanchéité sous pression d\'eau réussi.',
    status: 'APPROVED'
  }
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.warn('[Firestore Mobile Admin Error]:', JSON.stringify(errInfo));
}

export function useMobileAdmin(tenantIdParam?: string) {
  const tenantId = tenantIdParam || 'Inter-Affaires';

  const [devices, setDevices] = useState<MobileDevice[]>(DEMO_DEVICES);
  const [fleetInventory, setFleetInventory] = useState<FleetInventoryItem[]>(DEMO_FLEET_INVENTORY);
  const [sessions, setSessions] = useState<FieldSession[]>(DEMO_SESSIONS);
  const [orders, setOrders] = useState<MobileOrder[]>(DEMO_ORDERS);
  const [reports, setReports] = useState<ChantierReport[]>(DEMO_REPORTS);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore subscription for Real-time listener
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const devicesColRef = collection(db, 'company_erp_data', tenantId, 'mobile_devices');
    const fleetColRef = collection(db, 'company_erp_data', tenantId, 'fleet_inventory');
    const sessionsColRef = collection(db, 'company_erp_data', tenantId, 'field_sessions');
    const ordersColRef = collection(db, 'company_erp_data', tenantId, 'mobile_orders');
    const reportsColRef = collection(db, 'company_erp_data', tenantId, 'chantier_reports');

    // Subscribe to Devices
    const unsubDevices = onSnapshot(
      devicesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedDevices: MobileDevice[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              agentId: data.agentId || 'agent_unk',
              agentName: data.agentName || 'Agent Inconnu',
              deviceModel: data.deviceModel || 'Terminal Mobile',
              assigned_module: data.assigned_module || 'standard',
              lastSync: data.lastSync || new Date().toISOString(),
              status: data.status || 'PENDING',
              batteryLevel: data.batteryLevel,
              appVersion: data.appVersion,
              macAddress: data.macAddress,
              phoneNumber: data.phoneNumber,
            };
          });
          setDevices(loadedDevices);
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `company_erp_data/${tenantId}/mobile_devices`);
        setLoading(false);
      }
    );

    // Subscribe to MDM Fleet Inventory
    const unsubFleet = onSnapshot(
      fleetColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedFleet: FleetInventoryItem[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              fleet_park: data.fleet_park || 'Stock Réserve',
              device_name: data.device_name || 'Terminal Mobile',
              serial_reference: data.serial_reference || 'IMEI Non Spécifié',
              status: data.status || 'Available',
              assignedTo: data.assignedTo,
              registeredAt: data.registeredAt || new Date().toISOString()
            };
          });
          setFleetInventory(loadedFleet);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `company_erp_data/${tenantId}/fleet_inventory`);
      }
    );

    // Subscribe to Field Sessions
    const unsubSessions = onSnapshot(
      sessionsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSessions: FieldSession[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              agentId: data.agentId || 'agent_unk',
              agentName: data.agentName || 'Agent Terrain',
              type: data.type || 'VAN_SALES',
              checkIn: data.checkIn || { timestamp: new Date().toISOString(), lat: 36.8065, lng: 10.1815 },
              checkOut: data.checkOut,
              status: data.status || 'OPEN',
              notes: data.notes
            };
          });
          setSessions(loadedSessions);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `company_erp_data/${tenantId}/field_sessions`);
      }
    );

    // Subscribe to Mobile Orders
    const unsubOrders = onSnapshot(
      ordersColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedOrders: MobileOrder[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              localUuid: data.localUuid || docSnap.id,
              agentId: data.agentId,
              agentName: data.agentName,
              clientId: data.clientId || 'cli_unk',
              clientName: data.clientName || 'Client Inconnu',
              items: data.items || [],
              totalHT: data.totalHT || 0,
              totalTTC: data.totalTTC || 0,
              paymentStatus: data.paymentStatus || 'PENDING',
              paymentMethod: data.paymentMethod,
              signatureUrl: data.signatureUrl,
              status: data.status || 'PENDING_VALIDATION',
              createdAt: data.createdAt || new Date().toISOString()
            };
          });
          setOrders(loadedOrders);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `company_erp_data/${tenantId}/mobile_orders`);
      }
    );

    // Subscribe to Chantier Reports
    const unsubReports = onSnapshot(
      reportsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedReports: ChantierReport[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              chantierId: data.chantierId || 'CH-001',
              chantierName: data.chantierName,
              chefChantierId: data.chefChantierId || 'chef_unk',
              chefChantierName: data.chefChantierName,
              date: data.date || new Date().toISOString(),
              workersPresent: data.workersPresent || 0,
              materialsConsumed: data.materialsConsumed || [],
              photoUrls: data.photoUrls || [],
              signatureUrl: data.signatureUrl,
              notes: data.notes || '',
              status: data.status || 'PENDING'
            };
          });
          setReports(loadedReports);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `company_erp_data/${tenantId}/chantier_reports`);
      }
    );

    return () => {
      unsubDevices();
      unsubFleet();
      unsubSessions();
      unsubOrders();
      unsubReports();
    };
  }, [tenantId]);

  /**
   * 1. Approver un terminal en attente (PENDING -> ACTIVE)
   */
  const approveDevice = useCallback(async (deviceId: string) => {
    try {
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'ACTIVE' } : d));
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_devices', deviceId);
      await updateDoc(docRef, { status: 'ACTIVE', lastSync: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/mobile_devices/${deviceId}`);
    }
  }, [tenantId]);

  /**
   * 2. Bloquer ou Activer un terminal
   */
  const blockDevice = useCallback(async (deviceId: string) => {
    try {
      setDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
          const newStatus = d.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
          return { ...d, status: newStatus };
        }
        return d;
      }));

      const currentDev = devices.find(d => d.id === deviceId);
      const newStatus = currentDev?.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_devices', deviceId);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/mobile_devices/${deviceId}`);
    }
  }, [tenantId, devices]);

  /**
   * 3. Réinitialiser la synchro d'un terminal
   */
  const resetDeviceSync = useCallback(async (deviceId: string) => {
    const nowIso = new Date().toISOString();
    try {
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, lastSync: nowIso } : d));
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_devices', deviceId);
      await updateDoc(docRef, { lastSync: nowIso });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/mobile_devices/${deviceId}`);
    }
  }, [tenantId]);

  /**
   * 4. Valider/Associer un nouveau terminal
   */
  const registerDevice = useCallback(async (newDevice: {
    agentId: string;
    agentName: string;
    vehicleId?: string;
    deviceModel: string;
    assigned_module?: AssignedModule;
    phoneNumber?: string;
    fleetItemId?: string;
  }) => {
    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const deviceData: MobileDevice = {
      id: deviceId,
      tenantId,
      agentId: newDevice.agentId,
      agentName: newDevice.agentName,
      vehicleId: newDevice.vehicleId,
      deviceModel: newDevice.deviceModel,
      assigned_module: newDevice.assigned_module || 'standard',
      phoneNumber: newDevice.phoneNumber,
      lastSync: nowIso,
      status: 'ACTIVE',
      batteryLevel: 100,
      appVersion: 'v2.4.1'
    };

    setDevices(prev => [deviceData, ...prev]);

    // If a fleet inventory item was associated, update its status to 'Assigned' and assignedTo
    if (newDevice.fleetItemId) {
      setFleetInventory(prev => prev.map(item => item.id === newDevice.fleetItemId ? {
        ...item,
        status: 'Assigned',
        assignedTo: `${newDevice.agentName} (${newDevice.agentId})`
      } : item));

      try {
        const fleetDocRef = doc(db, 'company_erp_data', tenantId, 'fleet_inventory', newDevice.fleetItemId);
        await updateDoc(fleetDocRef, {
          status: 'Assigned',
          assignedTo: `${newDevice.agentName} (${newDevice.agentId})`
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/fleet_inventory/${newDevice.fleetItemId}`);
      }
    }

    try {
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_devices', deviceId);
      await setDoc(docRef, deviceData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `company_erp_data/${tenantId}/mobile_devices/${deviceId}`);
    }

    return deviceData;
  }, [tenantId]);

  /**
   * 5. Ajouter un terminal / équipement au parc d'actifs (fleet_inventory)
   */
  const addFleetItem = useCallback(async (newItem: {
    category?: string;
    fleet_park: string;
    device_name: string;
    serial_reference: string;
    status?: FleetDeviceStatus;
    assignedTo?: string;
  }) => {
    const fleetId = `mdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const itemData: FleetInventoryItem = {
      id: fleetId,
      tenantId,
      category: newItem.category || 'Terminal Mobile',
      fleet_park: newItem.fleet_park,
      device_name: newItem.device_name,
      serial_reference: newItem.serial_reference,
      status: newItem.status || 'Available',
      assignedTo: newItem.assignedTo,
      registeredAt: nowIso
    };

    setFleetInventory(prev => [itemData, ...prev]);

    try {
      const docRef = doc(db, 'company_erp_data', tenantId, 'fleet_inventory', fleetId);
      await setDoc(docRef, itemData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `company_erp_data/${tenantId}/fleet_inventory/${fleetId}`);
    }

    return itemData;
  }, [tenantId]);

  /**
   * 6. Modifier le statut d'un terminal dans le parc MDM
   */
  const updateFleetItemStatus = useCallback(async (fleetId: string, status: FleetDeviceStatus, assignedTo?: string) => {
    try {
      setFleetInventory(prev => prev.map(item => item.id === fleetId ? { ...item, status, assignedTo: assignedTo ?? item.assignedTo } : item));
      const docRef = doc(db, 'company_erp_data', tenantId, 'fleet_inventory', fleetId);
      await updateDoc(docRef, { status, assignedTo: assignedTo ?? null });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/fleet_inventory/${fleetId}`);
    }
  }, [tenantId]);

  /**
   * 5. Récupérer les rapports de chantier (méthode explicite demandée)
   */
  const fetchChantierReports = useCallback(async (): Promise<ChantierReport[]> => {
    try {
      const colRef = collection(db, 'company_erp_data', tenantId, 'chantier_reports');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const loaded: ChantierReport[] = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ChantierReport));
        setReports(loaded);
        return loaded;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `company_erp_data/${tenantId}/chantier_reports`);
    }
    return reports;
  }, [tenantId, reports]);

  /**
   * 6. Récupérer les commandes mobiles
   */
  const fetchMobileOrders = useCallback(async (): Promise<MobileOrder[]> => {
    try {
      const colRef = collection(db, 'company_erp_data', tenantId, 'mobile_orders');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const loaded: MobileOrder[] = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as MobileOrder));
        setOrders(loaded);
        return loaded;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `company_erp_data/${tenantId}/mobile_orders`);
    }
    return orders;
  }, [tenantId, orders]);

  /**
   * 7. Valider une commande hors-ligne issue du mobile
   */
  const validateOrder = useCallback(async (orderId: string, newStatus: 'VALIDATED' | 'REJECTED' = 'VALIDATED') => {
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_orders', orderId);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/mobile_orders/${orderId}`);
    }
  }, [tenantId]);

  /**
   * 8. Approuver un rapport de chantier
   */
  const approveReport = useCallback(async (reportId: string, newStatus: 'APPROVED' | 'REJECTED' = 'APPROVED') => {
    try {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      const docRef = doc(db, 'company_erp_data', tenantId, 'chantier_reports', reportId);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `company_erp_data/${tenantId}/chantier_reports/${reportId}`);
    }
  }, [tenantId]);

  return {
    devices,
    fleetInventory,
    sessions,
    orders,
    reports,
    loading,
    error,
    approveDevice,
    blockDevice,
    resetDeviceSync,
    registerDevice,
    addFleetItem,
    updateFleetItemStatus,
    fetchChantierReports,
    fetchMobileOrders,
    validateOrder,
    approveReport
  };
}
