import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, setLogLevel } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence Firestore internal SDK logs (including the benign BloomFilter hash count error warning)
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

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
  updatedAt?: string;
}

// Helper to save SaaS payment config to Firestore
export const saveSaaSBankConfig = async (config: SaaSBankConfig) => {
  try {
    const docRef = doc(db, 'admin_settings', 'payment_config');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
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
      return docSnap.data() as SaaSBankConfig;
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
    await setDoc(docRef, {
      ...state,
      updatedAt: new Date().toISOString()
    }, { merge: true });
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

