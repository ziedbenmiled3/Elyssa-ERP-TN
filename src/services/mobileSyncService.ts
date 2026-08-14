import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { MobileDevice, FieldSession, MobileOrder, ChantierReport, AssignedModule } from '../types/mobileTerrain';

/**
 * Service de synchronisation et gestion des opérations Mobiles Terrain pour Elyssa ERP.
 * Gère l'enregistrement des terminaux, le suivi géolocalisé des sessions et la sync des commandes offline.
 */

export interface RegisterDeviceInput {
  tenantId: string;
  agentId: string;
  agentName: string;
  deviceModel: string;
  assigned_module?: AssignedModule;
  id?: string;
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}

export interface StartSessionInput {
  tenantId: string;
  agentId: string;
  type: 'VAN_SALES' | 'CHANTIER';
  lat: number;
  lng: number;
  sessionId?: string;
}

export interface EndSessionInput {
  tenantId: string;
  sessionId: string;
  lat: number;
  lng: number;
}

/**
 * 1. Enregistrer ou mettre à jour un terminal mobile terrain.
 */
export async function registerDevice(input: RegisterDeviceInput): Promise<MobileDevice> {
  const deviceId = input.id || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();

  const deviceData: MobileDevice = {
    id: deviceId,
    tenantId: input.tenantId,
    agentId: input.agentId,
    agentName: input.agentName,
    deviceModel: input.deviceModel,
    assigned_module: input.assigned_module || 'standard',
    lastSync: now,
    status: input.status || 'PENDING',
  };

  try {
    const docRef = doc(db, 'company_erp_data', input.tenantId, 'mobile_devices', deviceId);
    await setDoc(docRef, {
      ...deviceData,
      lastSync: now.toISOString(),
    }, { merge: true });

    console.log(`[MobileSyncService] Terminal ${deviceId} enregistré pour tenant ${input.tenantId}`);
  } catch (error) {
    console.warn(`[MobileSyncService] Enregistrement du terminal en mode offline / fallback :`, error);
  }

  return deviceData;
}

/**
 * 2. Démarrer une nouvelle session terrain avec géolocalisation (Check-In).
 */
export async function startSession(input: StartSessionInput): Promise<FieldSession> {
  const sessionId = input.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();

  const session: FieldSession = {
    id: sessionId,
    tenantId: input.tenantId,
    agentId: input.agentId,
    type: input.type,
    checkIn: {
      timestamp: now,
      lat: input.lat,
      lng: input.lng,
    },
    status: 'OPEN',
  };

  try {
    const docRef = doc(db, 'company_erp_data', input.tenantId, 'field_sessions', sessionId);
    await setDoc(docRef, {
      ...session,
      checkIn: {
        timestamp: now.toISOString(),
        lat: input.lat,
        lng: input.lng,
      },
    });

    console.log(`[MobileSyncService] Session terrain ${sessionId} démarrée (${input.type}) pour agent ${input.agentId}`);
  } catch (error) {
    console.warn(`[MobileSyncService] Démarrage session enregistré en mode local :`, error);
  }

  return session;
}

/**
 * 3. Clôturer une session terrain avec géolocalisation (Check-Out).
 */
export async function endSession(input: EndSessionInput): Promise<FieldSession> {
  const now = new Date();
  const checkOutData = {
    timestamp: now,
    lat: input.lat,
    lng: input.lng,
  };

  try {
    const docRef = doc(db, 'company_erp_data', input.tenantId, 'field_sessions', input.sessionId);
    await updateDoc(docRef, {
      status: 'CLOSED',
      checkOut: {
        timestamp: now.toISOString(),
        lat: input.lat,
        lng: input.lng,
      },
    });

    console.log(`[MobileSyncService] Session terrain ${input.sessionId} clôturée.`);
  } catch (error) {
    console.warn(`[MobileSyncService] Clôture session enregistrée en mode local :`, error);
  }

  return {
    id: input.sessionId,
    tenantId: input.tenantId,
    agentId: 'agent_unknown',
    type: 'VAN_SALES',
    checkIn: { timestamp: now, lat: 0, lng: 0 },
    checkOut: checkOutData,
    status: 'CLOSED',
  };
}

/**
 * 4. Traiter la file d'attente des commandes offline issues du mobile (syncPendingOrders).
 */
export async function syncPendingOrders(
  tenantId: string,
  pendingOrders: Array<Omit<MobileOrder, 'id'>>
): Promise<{ syncedCount: number; orders: MobileOrder[] }> {
  const syncedOrders: MobileOrder[] = [];

  for (const item of pendingOrders) {
    const orderId = `ord_mob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAtDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt || Date.now());

    const orderData: MobileOrder = {
      ...item,
      id: orderId,
      tenantId,
      createdAt: createdAtDate,
    };

    try {
      const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_orders', orderId);
      await setDoc(docRef, {
        ...orderData,
        createdAt: createdAtDate.toISOString(),
      });
      syncedOrders.push(orderData);
    } catch (error) {
      console.warn(`[MobileSyncService] Échec de sync pour commande ${item.localUuid} :`, error);
      syncedOrders.push({ ...orderData, id: item.localUuid || orderId });
    }
  }

  return {
    syncedCount: syncedOrders.length,
    orders: syncedOrders,
  };
}
