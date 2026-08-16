import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface TenantModulesState {
  activeModules: string[];
  hasMobileModule: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Custom Hook React pour écouter en temps réel la liste des modules acquis par une entreprise
 * @param tenantId Identifiant unique de l'entreprise (ex: 'GEP')
 * @returns State contenant activeModules, hasMobileModule (booléen MOD-11) et loading
 */
export function useTenantModules(tenantId: string = 'GEP'): TenantModulesState {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [hasMobileModule, setHasMobileModule] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Référence au document entreprise / tenant dans Firestore
    const tenantDocRef = doc(db, 'companies', tenantId);

    // Écoute en temps réel via onSnapshot (Firebase v9 Modular SDK)
    const unsubscribe = onSnapshot(
      tenantDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const modules: string[] = (data?.activeModules && data.activeModules.length > 0)
            ? data.activeModules
            : ['MOD-11', 'mod-11-mobile-fleet', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', 'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10'];
          
          setActiveModules(modules);
          setHasMobileModule(true);
        } else {
          // Default fallback for GEP or active tenant without Firestore document
          const defaultFullModules = ['MOD-11', 'mod-11-mobile-fleet', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', 'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10'];
          setActiveModules(defaultFullModules);
          setHasMobileModule(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useTenantModules] Erreur écoute Firestore:', err);
        const defaultFullModules = ['MOD-11', 'mod-11-mobile-fleet', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', 'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10'];
        setActiveModules(defaultFullModules);
        setHasMobileModule(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  return { activeModules, hasMobileModule, loading, error };
}

export default useTenantModules;
