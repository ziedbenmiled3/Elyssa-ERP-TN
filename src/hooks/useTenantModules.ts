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
          const modules: string[] = data?.activeModules || [];
          
          setActiveModules(modules);
          
          // Vérification de la présence du module MOD-11
          const isMobileActive = modules.some(
            (m) => m === 'MOD-11' || m === 'mod-11-mobile-fleet'
          );
          setHasMobileModule(isMobileActive);
        } else {
          // Document par défaut / non trouvé
          setActiveModules([]);
          setHasMobileModule(false);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useTenantModules] Erreur écoute Firestore:', err);
        setError('Erreur lors du chargement des modules actifs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  return { activeModules, hasMobileModule, loading, error };
}

export default useTenantModules;
