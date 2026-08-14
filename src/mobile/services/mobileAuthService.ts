import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { MobileDevice } from '../../types/mobileTerrain';
import { registerDevice } from '../../services/mobileSyncService';
import offlineSyncEngine from './offlineSyncEngine';

const DEVICE_STORAGE_KEY = 'elyssa_mobile_device_id';

export interface MobileAuthDeviceState {
  deviceId: string;
  device: MobileDevice | null;
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'CHECKING';
  error: string | null;
}

/**
 * 1. Obtenir ou générer un DeviceId unique et persistant pour ce terminal mobile
 */
export function getOrCreateDeviceId(): string {
  if (typeof localStorage !== 'undefined') {
    let existingId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!existingId) {
      existingId = `dev_mob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, existingId);
    }
    return existingId;
  }
  return `dev_mob_default`;
}

/**
 * 2. Vérifier le statut d'habilitation du terminal auprès de Firestore
 */
export async function verifyDeviceStatus(
  tenantId: string = 'Inter-Affaires',
  agentId: string = 'emp_agent_01',
  agentName: string = 'Hamza Ben Salem (Agent Terrain)',
  deviceModel: string = 'Samsung Galaxy Tab Active (PWA)'
): Promise<MobileAuthDeviceState> {
  const deviceId = getOrCreateDeviceId();

  try {
    const docRef = doc(db, 'company_erp_data', tenantId, 'mobile_devices', deviceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const deviceData = docSnap.data() as MobileDevice;
      
      // Mettre à jour les infos locales
      offlineSyncEngine.saveDeviceInfoLocally({
        deviceId,
        tenantId,
        agentId: deviceData.agentId || agentId,
        agentName: deviceData.agentName || agentName,
        deviceModel: deviceData.deviceModel || deviceModel,
        assigned_module: deviceData.assigned_module || 'standard'
      });

      console.log(`[MobileAuthService] Statut du terminal ${deviceId}: ${deviceData.status}`);
      return {
        deviceId,
        device: deviceData,
        status: deviceData.status || 'PENDING',
        error: null,
      };
    } else {
      // Le terminal n'existe pas encore sur le cloud -> L'enregistrer automatiquement avec le statut PENDING
      console.log(`[MobileAuthService] Nouveau terminal détecté (${deviceId}). Enregistrement initial auprès d'Elyssa ERP...`);
      const newDevice = await registerDevice({
        id: deviceId,
        tenantId,
        agentId,
        agentName,
        deviceModel,
        status: 'PENDING',
      });

      offlineSyncEngine.saveDeviceInfoLocally({
        deviceId,
        tenantId,
        agentId,
        agentName,
        deviceModel,
      });

      return {
        deviceId,
        device: newDevice,
        status: 'PENDING',
        error: null,
      };
    }
  } catch (error: any) {
    console.warn('[MobileAuthService] Impossible d\'interroger Firestore (mode hors-ligne ou fallback) :', error);
    
    // Fallback hors-ligne local : consulter offlineSyncEngine
    const stored = offlineSyncEngine.getStoredDeviceInfo();
    return {
      deviceId,
      device: stored ? {
        id: stored.deviceId,
        tenantId: stored.tenantId,
        agentId: stored.agentId,
        agentName: stored.agentName,
        deviceModel: stored.deviceModel,
        lastSync: new Date().toISOString(),
        status: 'ACTIVE', // Permet le travail offline pour les équipements pré-enregistrés
      } : null,
      status: 'ACTIVE',
      error: 'Mode Hors-Ligne (Vérification locale effectuée)',
    };
  }
}
