import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface MobileAccessState {
  hasAccess: boolean;
  loading: boolean;
  accessError: string | null;
  agentName?: string;
  role?: string;
  tenantId: string;
  userId: string;
  lastCheckedAt?: string;
}

/**
 * Custom Hook: useMobileAccessControl
 * 
 * Écoute en temps réel via Firebase Firestore (`onSnapshot`) le document du collaborateur
 * `company_erp_data/{tenantId}/collaborators/{userId}` afin de vérifier son autorisation
 * d'accès au module Flotte Mobile Terrain (MOD-11).
 * 
 * Si le gérant révoque la licence depuis le portail d'administration SaaS,
 * `onSnapshot` déclenche instantanément une mise à jour de l'état `hasAccess` à `false`,
 * provoquant le blocage immédiat de l'application mobile PWA côté client.
 * 
 * Gère le cache offline natif de Firestore pour assurer la continuité de service
 * même en cas de perte ponctuelle de connexion réseau.
 */
export function useMobileAccessControl(
  tenantId: string = 'GEP',
  userId: string = 'emp_01'
): MobileAccessState {
  const [accessState, setAccessState] = useState<MobileAccessState>({
    hasAccess: true,
    loading: true,
    accessError: null,
    tenantId,
    userId
  });

  useEffect(() => {
    // Si tenantId ou userId sont absents, autoriser temporairement en mode dégradé avec avertissement
    if (!tenantId || !userId) {
      setAccessState({
        hasAccess: true,
        loading: false,
        accessError: null,
        tenantId: tenantId || 'UNKNOWN',
        userId: userId || 'GUEST'
      });
      return;
    }

    setAccessState(prev => ({ ...prev, loading: true }));

    // Référence vers le document collaborateur dans Firestore multi-tenant
    const collabRef = doc(db, 'company_erp_data', tenantId, 'collaborators', userId);

    console.log(`[useMobileAccessControl] 📡 Démarrage de l'écoute Firestore en temps réel pour Tenant=${tenantId}, User=${userId}...`);

    // Abonnement Temps Réel avec Firestore onSnapshot
    const unsubscribe = onSnapshot(
      collabRef,
      (docSnap) => {
        const nowIso = new Date().toISOString();

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Vérification des champs de licence (hasMobileLicense ou hasMobileAccess)
          // Par défaut true si le champ n'est pas explicitement défini à false
          const hasLicense = data.hasMobileLicense !== undefined 
            ? Boolean(data.hasMobileLicense) 
            : data.hasMobileAccess !== undefined 
              ? Boolean(data.hasMobileAccess) 
              : true;

          const agentName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Agent Terrain';
          const role = data.role || 'Collaborateur Terrain';

          console.log(`[useMobileAccessControl] 🟢 Mise à jour reçue: Agent=${agentName}, HasLicense=${hasLicense}`);

          setAccessState({
            hasAccess: hasLicense,
            loading: false,
            accessError: hasLicense 
              ? null 
              : 'Votre autorisation d\'accès à l\'application Mobile Terrain a été révoquée par votre administrateur.',
            agentName,
            role,
            tenantId,
            userId,
            lastCheckedAt: nowIso
          });
        } else {
          // Si le document n'existe pas encore dans Firestore, accorder l'accès par défaut (pour les agents démo)
          console.warn(`[useMobileAccessControl] ⚠️ Document collaborateur non trouvé (${userId}). Mode d'accès par défaut actif.`);
          setAccessState({
            hasAccess: true,
            loading: false,
            accessError: null,
            tenantId,
            userId,
            lastCheckedAt: nowIso
          });
        }
      },
      (error) => {
        console.warn(`[useMobileAccessControl] ⚠️ Notification Firestore (Mode Offline ou Latence):`, error?.message || error);
        
        // En cas d'erreur réseau/Firestore (ex: règles de sécurité ou perte réseau),
        // préserver le dernier état connu (résilience PWA offline)
        setAccessState(prev => ({
          ...prev,
          loading: false,
          accessError: null // Ne pas bloquer l'agent si la connexion vacille en mode hors-ligne
        }));
      }
    );

    // Nettoyage impératif de l'écouteur lors du démontage du composant
    return () => {
      console.log(`[useMobileAccessControl] 🔌 Désabonnement de l'écoute Firestore pour ${userId}.`);
      unsubscribe();
    };
  }, [tenantId, userId]);

  return accessState;
}
