import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, setLogLevel } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence Firestore internal SDK logs (including the benign BloomFilter hash count error warning)
setLogLevel('silent');

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch (e) {
  firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Explicitly configure Firebase Auth persistence using local storage
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔥 Firebase Auth persistence set to browserLocalPersistence successfully.");
  })
  .catch((error) => {
    console.error("⚠️ Failed to set Firebase Auth persistence:", error);
  });

export interface SaaSBankConfig {
  bankName: string;
  bankOwner: string;
  bankRib: string;
  bankAgency: string;
  wafacashBeneficiary: string;
  wafacashCin: string;
  wafacashPhone: string;
  wafacashCity: string;
  isVirementActive: boolean;
  isVersementActive: boolean;
  isWafacashActive: boolean;
  isOnlineCardActive: boolean;
  online_payment_enabled?: boolean;
  updatedAt?: string;
}

/**
 * Recursively cleans an object or array to ensure it contains NO undefined values,
 * which cause Firestore setDoc/updateDoc to throw "Unsupported field value: undefined".
 * Undefined values in objects are stripped, and undefined in arrays are mapped to null.
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => (item === undefined ? null : cleanFirestoreData(item))) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

// Helper to save SaaS payment config to Firestore (both in admin_settings and company_erp_data/saas_settings)
export const saveSaaSBankConfig = async (config: SaaSBankConfig) => {
  try {
    const isOnlineActive = config.online_payment_enabled !== undefined 
      ? config.online_payment_enabled 
      : config.isOnlineCardActive;

    const payload = cleanFirestoreData({
      ...config,
      isOnlineCardActive: isOnlineActive,
      online_payment_enabled: isOnlineActive,
      updatedAt: new Date().toISOString()
    });

    // 1. Save in admin_settings/payment_config
    const docRef = doc(db, 'admin_settings', 'payment_config');
    await setDoc(docRef, payload, { merge: true });

    // 2. Also persist in company_erp_data/saas_settings as requested
    try {
      const saasSettingsRef = doc(db, 'company_erp_data', 'saas_settings');
      await setDoc(saasSettingsRef, payload, { merge: true });
    } catch (e) {
      console.warn("Notice: Sync to company_erp_data/saas_settings skipped:", e);
    }

    console.log("SaaS Payment Config saved to Firestore successfully");
  } catch (error) {
    console.warn("Notice: SaaS payment config save skipped or offline:", error);
  }
};

// Helper to load SaaS payment config from Firestore
export const loadSaaSBankConfig = async (): Promise<Partial<SaaSBankConfig> | null> => {
  try {
    const docRef = doc(db, 'admin_settings', 'payment_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SaaSBankConfig;
      if (data.online_payment_enabled === undefined && data.isOnlineCardActive !== undefined) {
        data.online_payment_enabled = data.isOnlineCardActive;
      }
      return data;
    }

    // Fallback: check company_erp_data/saas_settings
    try {
      const saasSettingsRef = doc(db, 'company_erp_data', 'saas_settings');
      const saasSnap = await getDoc(saasSettingsRef);
      if (saasSnap.exists()) {
        const saasData = saasSnap.data() as SaaSBankConfig;
        if (saasData.online_payment_enabled === undefined && saasData.isOnlineCardActive !== undefined) {
          saasData.online_payment_enabled = saasData.isOnlineCardActive;
        }
        return saasData;
      }
    } catch (e) {
      console.warn("Notice: company_erp_data/saas_settings fallback check failed:", e);
    }

    return null;
  } catch (error) {
    console.warn("Notice: SaaS payment config offline or not cached, falling back to local state:", error);
    return null;
  }
};

export interface CompanyERPState {
  clients?: any[];
  invoices?: any[];
  complaints?: any[];
  visitReports?: any[];
  competitors?: any[];
  suppliers?: any[];
  products?: any[];
  stockMovements?: any[];
  bankAccounts?: any[];
  bankTransactions?: any[];
  taxDeclarations?: any[];
  yearEndClosings?: any[];
  documents?: any[];
  employees?: any[];
  smtpSettings?: any;
  imapSettings?: any;
  incomingEmails?: any[];
  emailTemplates?: any[];
  communicationLogs?: any[];
  supportTickets?: any[];
  updatedAt?: string;
}

// Helper to save complete Company ERP state to Firestore
export const saveCompanyERPState = async (companyName: string, state: CompanyERPState) => {
  try {
    const docRef = doc(db, 'companies', companyName || 'default_company');
    await setDoc(docRef, cleanFirestoreData({
      ...state,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    console.log(`ERP State for ${companyName} saved to Firestore successfully`);
    return true;
  } catch (error) {
    console.warn(`Notice: Saving ERP State for ${companyName} skipped or offline:`, error);
    return false;
  }
};

// Helper to load complete Company ERP state from Firestore
export const loadCompanyERPState = async (companyName: string): Promise<CompanyERPState | null> => {
  try {
    const docRef = doc(db, 'companies', companyName || 'default_company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanyERPState;
    }
    return null;
  } catch (error) {
    console.warn(`Notice: Loading ERP State for ${companyName} skipped or offline:`, error);
    return null;
  }
};

/**
 * Secure Firestore pointages retrieval.
 * Rule: Each query MUST include where('company', '==', currentCompanyId).
 * Security: If currentCompanyId is absent or empty, the query must fail immediately.
 */
export const getPointages = async (currentCompanyId: string): Promise<any[]> => {
  if (!currentCompanyId || currentCompanyId.trim() === '') {
    throw new Error("Sécurité critique : L'identifiant de l'entreprise (currentCompanyId) est absent ou vide. Accès refusé.");
  }

  try {
    const timeTrackingRef = collection(db, 'time_tracking');
    const q = query(timeTrackingRef, where('company', '==', currentCompanyId));
    const qSnapshot = await getDocs(q);
    const results: any[] = [];
    qSnapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });
    return results;
  } catch (error) {
    console.error("Erreur lors de la récupération sécurisée des pointages :", error);
    throw error;
  }
};

/**
 * Persistent and effective company deletion in Firestore and server DB.
 * Deletes company document from 'companies', 'publisher_clients',
 * and all related orphaned collections (collaborators, attendance_settings, etc.)
 */
export const deleteCompanyFromDb = async (targetCompanyId: string, companyName?: string) => {
  if (!targetCompanyId) return;

  console.log(`[deleteCompanyFromDb] Starting persistent deletion for ID: ${targetCompanyId}, Name: ${companyName}`);

  // 1. Direct Firestore SDK Deletion
  if (db) {
    try {
      // Delete document from 'companies'
      await deleteDoc(doc(db, 'companies', targetCompanyId)).catch(e => console.warn('Firestore companies delete warning:', e));
      if (companyName) {
        await deleteDoc(doc(db, 'companies', companyName)).catch(() => {});
        await deleteDoc(doc(db, 'companies', companyName.toLowerCase())).catch(() => {});
      }

      // Delete document from 'publisher_clients'
      await deleteDoc(doc(db, 'publisher_clients', targetCompanyId)).catch(e => console.warn('Firestore publisher_clients delete warning:', e));

      // Set tombstone in 'deleted_companies'
      await setDoc(doc(db, 'deleted_companies', targetCompanyId), {
        id: targetCompanyId,
        companyName: companyName || targetCompanyId,
        deletedAt: new Date().toISOString()
      }).catch(e => console.warn('deleted_companies record warning:', e));

      // Clean up orphaned records in linked collections
      const relatedCols = ['collaborators', 'attendance_settings', 'active_sessions', 'presence_logs', 'heartbeats', 'licence_requests', 'company_settings'];
      for (const colName of relatedCols) {
        try {
          const colRef = collection(db, colName);
          const snapAll = await getDocs(colRef).catch(() => null);
          if (snapAll && !snapAll.empty) {
            const idLower = targetCompanyId.toLowerCase().trim();
            const nameLower = companyName ? companyName.toLowerCase().trim() : '';

            for (const d of snapAll.docs) {
              const data = d.data();
              const dCompId = String(data.companyId || data.company_id || d.id).toLowerCase().trim();
              const dCompName = String(data.company || data.companyName || '').toLowerCase().trim();
              const dEmail = String(data.email || '').toLowerCase().trim();

              if (dCompId === idLower || (nameLower && dCompName === nameLower) ||
                  dCompId.includes(idLower) || (nameLower && dCompName.includes(nameLower)) ||
                  (idLower === 'gep' && (dCompName.includes('gep') || dCompId.includes('gep') || dEmail.includes('gep') || dEmail.includes('mondhali')))) {
                await deleteDoc(doc(db, colName, d.id)).catch(() => {});
              }
            }
          }
        } catch (colErr) {
          console.warn(`Clean up warning for collection ${colName}:`, colErr);
        }
      }
    } catch (fsErr) {
      console.error("Firestore SDK company deletion error:", fsErr);
    }
  }

  // 2. Server API Deletion call
  try {
    const res = await fetch('/api/db/delete-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetCompanyId, companyName })
    });
    if (!res.ok) {
      console.warn("Server delete-company returned status:", res.status);
    }
  } catch (apiErr) {
    console.warn("API delete-company call warning:", apiErr);
  }
};

