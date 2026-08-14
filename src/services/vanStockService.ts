import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { VanArticleStock } from '../types/mobileTerrain';

const DB_NAME = 'ElyssaVanStockDB';
const DB_VERSION = 1;
const STORE_NAME = 'van_stock';

/**
 * Service de gestion de stock nomade Offline-First avec IndexedDB pour le mode VAN_SALES.
 */
class VanStockService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialise ou ouvre la base IndexedDB locale.
   */
  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          if (!idb.objectStoreNames.contains(STORE_NAME)) {
            idb.createObjectStore(STORE_NAME, { keyPath: 'articleId' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('[VanStockService] Erreur d\'ouverture IndexedDB:', request.error);
          reject(request.error);
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * 1. Télécharger le stock d'un dépôt itinérant (ex: DEP-VAN-01) depuis Firestore dans IndexedDB au démarrage de la session.
   */
  public async downloadVanStockFromFirestore(
    tenantId: string,
    depotVanId: string
  ): Promise<VanArticleStock[]> {
    console.log(`[VanStockService] Téléchargement stock depuis Firestore (${tenantId} / ${depotVanId})...`);
    let items: VanArticleStock[] = [];

    try {
      const docRef = doc(db, 'company_erp_data', tenantId, 'van_stocks', depotVanId);
      const snap = await getDoc(docRef);

      if (snap.exists() && snap.data()?.items) {
        items = snap.data().items as VanArticleStock[];
      } else {
        // Mock par défaut si le document n'existe pas encore sur le serveur
        items = [
          { articleId: 'art_001', reference: 'CIM-50', label: 'Ciment CPJ 45 (Sac 50kg)', unitPrice: 14.5, stockQty: 120, lastUpdated: new Date().toISOString() },
          { articleId: 'art_002', reference: 'PEI-20', label: 'Peinture Acrylique Blanc 20L', unitPrice: 85.0, stockQty: 35, lastUpdated: new Date().toISOString() },
          { articleId: 'art_003', reference: 'TBR-16', label: 'Tube PVC Diamètre 110mm 4m', unitPrice: 22.0, stockQty: 60, lastUpdated: new Date().toISOString() },
          { articleId: 'art_004', reference: 'ELEC-25', label: 'Câble Électrique 3x2.5mm² (100m)', unitPrice: 130.0, stockQty: 15, lastUpdated: new Date().toISOString() },
        ];
      }
    } catch (err) {
      console.warn('[VanStockService] Mode hors-ligne détecté lors du chargement initial Firestore. Utilisation du cache local IndexedDB.');
      return this.getLocalVanStock();
    }

    // Sauvegarde atomique dans IndexedDB
    const idb = await this.getDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Vider le store précédent
    store.clear();

    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        console.log(`[VanStockService] ${items.length} articles sauvegardés dans IndexedDB.`);
        resolve(items);
      };
    });
  }

  /**
   * 2. Récupérer l'intégralité du stock local depuis IndexedDB.
   */
  public async getLocalVanStock(): Promise<VanArticleStock[]> {
    const idb = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 3. Décrémenter le stock localement hors-ligne lors d'une vente.
   */
  public async decrementStockOffline(
    articleId: string,
    quantity: number
  ): Promise<VanArticleStock> {
    const idb = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(articleId);

      request.onsuccess = () => {
        const item: VanArticleStock = request.result;
        if (!item) {
          reject(new Error(`Article ${articleId} introuvable dans le stock local IndexedDB.`));
          return;
        }

        if (item.stockQty < quantity) {
          console.warn(`[VanStockService] Vente en surstock (Disponible: ${item.stockQty}, Vendu: ${quantity})`);
        }

        item.stockQty = Math.max(0, item.stockQty - quantity);
        item.lastUpdated = new Date().toISOString();

        store.put(item);

        tx.oncomplete = () => {
          console.log(`[VanStockService] Article ${articleId} décrémenté de ${quantity}. Nouveau stock: ${item.stockQty}`);
          resolve(item);
        };
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 4. Synchroniser le stock mis à jour vers Firestore au retour du réseau.
   */
  public async syncStockWithFirestore(
    tenantId: string,
    depotVanId: string
  ): Promise<{ success: boolean; syncedItemsCount: number }> {
    const localStock = await this.getLocalVanStock();
    if (localStock.length === 0) {
      return { success: true, syncedItemsCount: 0 };
    }

    try {
      const docRef = doc(db, 'company_erp_data', tenantId, 'van_stocks', depotVanId);
      await setDoc(docRef, {
        depotVanId,
        tenantId,
        items: localStock,
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });

      console.log(`[VanStockService] Synchronisation réussie vers Firestore pour dépôt ${depotVanId}.`);
      return { success: true, syncedItemsCount: localStock.length };
    } catch (err) {
      console.error('[VanStockService] Échec de synchronisation vers Firestore (réseau indisponible):', err);
      return { success: false, syncedItemsCount: 0 };
    }
  }
}

export const vanStockService = new VanStockService();
