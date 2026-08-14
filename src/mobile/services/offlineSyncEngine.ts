import { MobileOrder, ChantierReport, ChantierMaterialItem } from '../../types/mobileTerrain';
import { syncPendingOrders } from '../../services/mobileSyncService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

/**
 * ENGINE OFFLINE-FIRST (Elyssa ERP - Agent Terrain Mobile)
 * Gestionnaire de stockage local, file d'attente d'actions hors-ligne
 * et synchronisation automatique lors du rétablissement de la connectivité réseau.
 */

const STORAGE_KEYS = {
  PENDING_ORDERS: 'elyssa_mobile_pending_orders',
  PENDING_REPORTS: 'elyssa_mobile_pending_reports',
  VEHICLE_STOCK: 'elyssa_mobile_vehicle_stock',
  CHANTIER_STOCK: 'elyssa_mobile_chantier_stock',
  DEVICE_REGISTRATION: 'elyssa_mobile_device_info',
  NETWORK_STATUS: 'elyssa_mobile_online_status',
};

export interface SyncEngineStatus {
  isOnline: boolean;
  pendingOrdersCount: number;
  pendingReportsCount: number;
  isSyncing: boolean;
  lastSyncTimestamp: string | null;
}

type ConnectivityCallback = (isOnline: boolean) => void;
type SyncCallback = (status: SyncEngineStatus) => void;

class OfflineSyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private connectivityListeners: Set<ConnectivityCallback> = new Set();
  private syncListeners: Set<SyncCallback> = new Set();
  private lastSyncTimestamp: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStateChange);
      window.addEventListener('offline', this.handleOfflineStateChange);
    }
  }

  private handleOnlineStateChange = () => {
    this.isOnline = true;
    this.notifyConnectivityListeners();
    this.notifySyncListeners();
    console.log('[OfflineSyncEngine] 🟢 Réseau rétabli. Démarrage automatique de la synchronisation...');
    
    // Auto sync default active tenant from local device configuration
    const deviceConfig = this.getStoredDeviceInfo();
    const tenantId = deviceConfig?.tenantId || 'Inter-Affaires';
    this.syncAllPending(tenantId);
  };

  private handleOfflineStateChange = () => {
    this.isOnline = false;
    this.notifyConnectivityListeners();
    this.notifySyncListeners();
    console.log('[OfflineSyncEngine] 🔴 Mode Hors-Ligne activé (Offline mode).');
  };

  /**
   * S'abonner aux changements de connectivité réseau (NetInfo compatible)
   */
  public onConnectivityChange(callback: ConnectivityCallback): () => void {
    this.connectivityListeners.add(callback);
    callback(this.isOnline);
    return () => this.connectivityListeners.delete(callback);
  }

  /**
   * S'abonner aux mises à jour d'état du moteur de synchronisation
   */
  public onSyncStatusChange(callback: SyncCallback): () => void {
    this.syncListeners.add(callback);
    callback(this.getStatus());
    return () => this.syncListeners.delete(callback);
  }

  private notifyConnectivityListeners() {
    this.connectivityListeners.forEach((cb) => cb(this.isOnline));
  }

  private notifySyncListeners() {
    const status = this.getStatus();
    this.syncListeners.forEach((cb) => cb(status));
  }

  public getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      pendingOrdersCount: this.getPendingOrdersLocally().length,
      pendingReportsCount: this.getPendingReportsLocally().length,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
  }

  // =========================================================================
  // 1. GESTION DES COMMANDES HORS-LIGNE (VAN SALES)
  // =========================================================================

  /**
   * Enregistrer une commande localement dans la file d'attente hors-ligne SQLite / LocalStorage
   */
  public saveOrderLocally(orderData: Partial<MobileOrder>): MobileOrder {
    const localUuid = orderData.localUuid || `local_ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const fullOrder: MobileOrder = {
      id: orderData.id || localUuid,
      tenantId: orderData.tenantId || 'Inter-Affaires',
      localUuid,
      agentId: orderData.agentId || 'ag_field_01',
      agentName: orderData.agentName || 'Agent Terrain',
      clientId: orderData.clientId || 'cli_default',
      clientName: orderData.clientName || 'Client Inconnu',
      items: orderData.items || [],
      totalHT: orderData.totalHT || 0,
      totalTTC: orderData.totalTTC || 0,
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      signatureUrl: orderData.signatureUrl || '',
      status: 'PENDING_VALIDATION',
      createdAt: orderData.createdAt ? orderData.createdAt : now.toISOString(),
    };

    const currentPending = this.getPendingOrdersLocally();
    currentPending.push(fullOrder);
    this.saveToStorage(STORAGE_KEYS.PENDING_ORDERS, currentPending);

    // Décrémenter le stock embarqué dans le véhicule localement
    if (orderData.agentId && orderData.items) {
      orderData.items.forEach((item) => {
        this.updateVehicleStock(orderData.agentId!, item.articleId, -item.qty);
      });
    }

    console.log(`[OfflineSyncEngine] 💾 Commande ${localUuid} sauvegardée localement.`);
    this.notifySyncListeners();

    // Tente une synchronisation immédiate si en ligne
    if (this.isOnline) {
      this.syncAllPending(fullOrder.tenantId);
    }

    return fullOrder;
  }

  /**
   * Récupérer toutes les commandes en attente de synchronisation
   */
  public getPendingOrdersLocally(): MobileOrder[] {
    return this.getFromStorage<MobileOrder[]>(STORAGE_KEYS.PENDING_ORDERS) || [];
  }

  /**
   * Supprimer une commande de la file d'attente après synchronisation réussie
   */
  public clearPendingOrder(localUuid: string) {
    const currentPending = this.getPendingOrdersLocally();
    const updated = currentPending.filter((o) => o.localUuid !== localUuid && o.id !== localUuid);
    this.saveToStorage(STORAGE_KEYS.PENDING_ORDERS, updated);
    this.notifySyncListeners();
  }

  // =========================================================================
  // 2. GESTION DES RAPPORTS DE CHANTIER HORS-LIGNE
  // =========================================================================

  /**
   * Enregistrer un rapport journalier de chantier localement
   */
  public saveChantierReportLocally(reportData: Partial<ChantierReport>): ChantierReport {
    const reportId = reportData.id || `rep_local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const fullReport: ChantierReport = {
      id: reportId,
      tenantId: reportData.tenantId || 'Inter-Affaires',
      chantierId: reportData.chantierId || 'ch_default',
      chantierName: reportData.chantierName || 'Chantier Principal',
      chefChantierId: reportData.chefChantierId || 'chef_01',
      chefChantierName: reportData.chefChantierName || 'Chef de Chantier',
      date: reportData.date || now.toISOString(),
      workersPresent: reportData.workersPresent || 0,
      materialsConsumed: reportData.materialsConsumed || [],
      photoUrls: reportData.photoUrls || [],
      signatureUrl: reportData.signatureUrl || '',
      notes: reportData.notes || '',
      status: 'PENDING',
    };

    const currentPending = this.getPendingReportsLocally();
    currentPending.push(fullReport);
    this.saveToStorage(STORAGE_KEYS.PENDING_REPORTS, currentPending);

    // Décrémenter les matériaux consommés dans le stock local de chantier
    if (reportData.chantierId && reportData.materialsConsumed) {
      reportData.materialsConsumed.forEach((mat) => {
        this.updateChantierStock(reportData.chantierId!, mat.articleId, -mat.qty);
      });
    }

    console.log(`[OfflineSyncEngine] 📋 Rapport de chantier ${reportId} sauvegardé localement.`);
    this.notifySyncListeners();

    // Tente une synchronisation immédiate si en ligne
    if (this.isOnline) {
      this.syncAllPending(fullReport.tenantId);
    }

    return fullReport;
  }

  /**
   * Récupérer tous les rapports de chantier en attente de synchro
   */
  public getPendingReportsLocally(): ChantierReport[] {
    return this.getFromStorage<ChantierReport[]>(STORAGE_KEYS.PENDING_REPORTS) || [];
  }

  /**
   * Supprimer un rapport de la file d'attente après synchronisation réussie
   */
  public clearPendingReport(reportId: string) {
    const currentPending = this.getPendingReportsLocally();
    const updated = currentPending.filter((r) => r.id !== reportId);
    this.saveToStorage(STORAGE_KEYS.PENDING_REPORTS, updated);
    this.notifySyncListeners();
  }

  // =========================================================================
  // 3. SYNCHRONISATION EN ARRIÈRE-PLAN (CLOUD SYNC)
  // =========================================================================

  /**
   * Déclencher la synchronisation globale vers Firestore
   */
  public async syncAllPending(tenantId: string): Promise<{
    syncedOrders: number;
    syncedReports: number;
    errors: string[];
  }> {
    if (!this.isOnline || this.isSyncing) {
      return { syncedOrders: 0, syncedReports: 0, errors: [] };
    }

    this.isSyncing = true;
    this.notifySyncListeners();

    const pendingOrders = this.getPendingOrdersLocally();
    const pendingReports = this.getPendingReportsLocally();
    const errors: string[] = [];

    let syncedOrdersCount = 0;
    let syncedReportsCount = 0;

    // 1. Sync Pending Mobile Orders
    if (pendingOrders.length > 0) {
      try {
        const result = await syncPendingOrders(tenantId, pendingOrders);
        syncedOrdersCount = result.syncedCount;
        result.orders.forEach((o) => {
          this.clearPendingOrder(o.localUuid || o.id);
        });
        console.log(`[OfflineSyncEngine] ✅ ${syncedOrdersCount} commande(s) synchronisée(s) vers Firestore.`);
      } catch (err: any) {
        console.error('[OfflineSyncEngine] Échec synchro commandes :', err);
        errors.push(`Commandes: ${err.message || String(err)}`);
      }
    }

    // 2. Sync Pending Chantier Reports
    if (pendingReports.length > 0) {
      for (const report of pendingReports) {
        try {
          const docRef = doc(db, 'company_erp_data', tenantId, 'chantier_reports', report.id);
          await setDoc(docRef, {
            ...report,
            date: typeof report.date === 'string' ? report.date : new Date(report.date).toISOString(),
            status: 'PENDING',
            syncedAt: new Date().toISOString(),
          });
          this.clearPendingReport(report.id);
          syncedReportsCount++;
        } catch (err: any) {
          console.error(`[OfflineSyncEngine] Échec synchro rapport ${report.id} :`, err);
          errors.push(`Rapport ${report.id}: ${err.message || String(err)}`);
        }
      }
      console.log(`[OfflineSyncEngine] ✅ ${syncedReportsCount} rapport(s) de chantier synchronisé(s).`);
    }

    this.isSyncing = false;
    this.lastSyncTimestamp = new Date().toISOString();
    this.notifySyncListeners();

    return {
      syncedOrders: syncedOrdersCount,
      syncedReports: syncedReportsCount,
      errors,
    };
  }

  // =========================================================================
  // 4. STOCKS EMBARQUÉS & CHANTIER (OFFLINE STOCK ENGINE)
  // =========================================================================

  public getVehicleStock(agentId: string): Record<string, number> {
    const allStocks = this.getFromStorage<Record<string, Record<string, number>>>(STORAGE_KEYS.VEHICLE_STOCK) || {};
    return allStocks[agentId] || {
      'ART-001': 45, // Ex: Ciment Portland 50kg
      'ART-002': 120, // Ex: Brique de 12
      'ART-003': 30, // Ex: Peinture Satinée White
      'ART-004': 15, // Ex: Robinetterie Laiton
      'ART-005': 80, // Ex: Câble Électrique 2.5mm
    };
  }

  public updateVehicleStock(agentId: string, articleId: string, deltaQty: number) {
    const allStocks = this.getFromStorage<Record<string, Record<string, number>>>(STORAGE_KEYS.VEHICLE_STOCK) || {};
    const agentStock = allStocks[agentId] || this.getVehicleStock(agentId);
    
    agentStock[articleId] = Math.max(0, (agentStock[articleId] || 0) + deltaQty);
    allStocks[agentId] = agentStock;

    this.saveToStorage(STORAGE_KEYS.VEHICLE_STOCK, allStocks);
  }

  public getChantierStock(chantierId: string): Record<string, number> {
    const allStocks = this.getFromStorage<Record<string, Record<string, number>>>(STORAGE_KEYS.CHANTIER_STOCK) || {};
    return allStocks[chantierId] || {
      'ART-001': 200, // Ciment
      'ART-002': 1500, // Briques
      'ART-005': 450, // Câbles
      'ART-006': 60, // Fer à béton 12mm
    };
  }

  public updateChantierStock(chantierId: string, articleId: string, deltaQty: number) {
    const allStocks = this.getFromStorage<Record<string, Record<string, number>>>(STORAGE_KEYS.CHANTIER_STOCK) || {};
    const stock = allStocks[chantierId] || this.getChantierStock(chantierId);

    stock[articleId] = Math.max(0, (stock[articleId] || 0) + deltaQty);
    allStocks[chantierId] = stock;

    this.saveToStorage(STORAGE_KEYS.CHANTIER_STOCK, allStocks);
  }

  // =========================================================================
  // 5. HELPER STORAGE & DEVICE UTILS
  // =========================================================================

  public saveDeviceInfoLocally(info: { deviceId: string; tenantId: string; agentName: string; agentId: string; deviceModel: string; assigned_module?: string }) {
    this.saveToStorage(STORAGE_KEYS.DEVICE_REGISTRATION, info);
  }

  public getStoredDeviceInfo(): { deviceId: string; tenantId: string; agentName: string; agentId: string; deviceModel: string; assigned_module?: string } | null {
    return this.getFromStorage(STORAGE_KEYS.DEVICE_REGISTRATION);
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (err) {
      console.warn(`[OfflineSyncEngine] Échec d'écriture localStorage pour ${key}`, err);
    }
  }

  private getFromStorage<T>(key: string): T | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (err) {
      console.warn(`[OfflineSyncEngine] Échec de lecture localStorage pour ${key}`, err);
    }
    return null;
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
export default offlineSyncEngine;
