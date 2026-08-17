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

// Fallback empty dataset for MDM Fleet Inventory
const DEMO_FLEET_INVENTORY: FleetInventoryItem[] = [];

// Fallback empty dataset for initial render and offline/sandbox mode
const DEMO_DEVICES: MobileDevice[] = [];

const DEMO_SESSIONS: FieldSession[] = [];

const DEMO_ORDERS: MobileOrder[] = [];

const DEMO_REPORTS: ChantierReport[] = [];

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
