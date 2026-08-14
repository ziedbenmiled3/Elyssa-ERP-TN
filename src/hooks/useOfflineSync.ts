import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface OfflinePunchPayload {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  photoBase64: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    addressHint?: string;
  };
  timestamp: string;
  deviceInfo?: string;
  syncAttempts?: number;
}

const OFFLINE_QUEUE_KEY = 'elyssa_offline_punches_queue';

/**
 * Hook React useOfflineSync - Gestion de la file d'attente hors-ligne & auto-sync au retour du réseau
 */
export function useOfflineSync(tenantId: string = 'GEP') {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<OfflinePunchPayload[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Charger la file depuis le localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setQueue(parsed);
        }
      }
    } catch (e) {
      console.error("[useOfflineSync] Erreur lors de la lecture de la file hors-ligne:", e);
    }
  }, []);

  // Sauvegarder la file dans le localStorage dès qu'elle change
  const saveQueueToStorage = (newQueue: OfflinePunchPayload[]) => {
    setQueue(newQueue);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
    } catch (e) {
      console.error("[useOfflineSync] Erreur lors de la sauvegarde dans localStorage:", e);
    }
  };

  // Écouter les événements de connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      console.log("[useOfflineSync] Connexion réseau rétablie !");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("[useOfflineSync] Appareil déconnecté du réseau.");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ajouter un pointage dans la file d'attente hors-ligne
  const addToQueue = useCallback((item: Omit<OfflinePunchPayload, 'id'>) => {
    const newItem: OfflinePunchPayload = {
      ...item,
      id: `punch_offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      syncAttempts: 0
    };

    setQueue(prev => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("[useOfflineSync] Erreur sauvegarde localStorage:", e);
      }
      return updated;
    });

    return newItem;
  }, []);

  // Supprimer un élément de la file d'attente
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("[useOfflineSync] Erreur mise à jour localStorage:", e);
      }
      return updated;
    });
  }, []);

  // Vider complètement la file d'attente
  const clearQueue = useCallback(() => {
    setQueue([]);
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.error("[useOfflineSync] Erreur nettoyage localStorage:", e);
    }
  }, []);

  // Synchroniser la file d'attente avec Firestore
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);
    console.log(`[useOfflineSync] Début de synchronisation de ${queue.length} pointages hors-ligne...`);

    const remainingItems: OfflinePunchPayload[] = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        // Enregistrement Firestore sous companies/{tenantId}/punches/{punchId}
        const punchDocRef = doc(db, 'companies', item.tenantId || tenantId, 'punches', item.id);
        
        await setDoc(punchDocRef, {
          tenantId: item.tenantId || tenantId,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          photoBase64: item.photoBase64,
          location: item.location,
          timestamp: item.timestamp,
          syncedAt: new Date().toISOString(),
          isOfflinePunch: true,
          status: 'PENDING_AI_VERIFICATION',
          deviceInfo: item.deviceInfo || navigator.userAgent
        }, { merge: true });

        successCount++;
      } catch (err: any) {
        console.error(`[useOfflineSync] Échec d'envoi du pointage ${item.id}:`, err);
        remainingItems.push({
          ...item,
          syncAttempts: (item.syncAttempts || 0) + 1
        });
      }
    }

    saveQueueToStorage(remainingItems);
    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString('fr-TN'));

    if (remainingItems.length > 0) {
      setSyncError(`${remainingItems.length} pointage(s) n'ont pas pu être synchronisés.`);
    }

    return {
      total: queue.length,
      successCount,
      failedCount: remainingItems.length
    };
  }, [queue, isSyncing, tenantId]);

  // Synchronisation automatique au retour en ligne si la file contient des éléments
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  return {
    isOnline,
    queue,
    pendingCount: queue.length,
    isSyncing,
    lastSyncTime,
    syncError,
    addToQueue,
    removeFromQueue,
    clearQueue,
    syncQueue
  };
}

export default useOfflineSync;
