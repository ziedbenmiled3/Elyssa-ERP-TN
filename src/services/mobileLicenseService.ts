import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { TenantSubscription, FieldAgentLicense } from '../types/mobileTerrain';

export interface MobileLoginValidationResult {
  authorized: boolean;
  errorCode?: 'MODULE_DISABLED' | 'QUOTA_EXCEEDED' | 'LICENSE_NOT_ASSIGNED' | 'TENANT_NOT_FOUND';
  errorMessage?: string;
  subscription?: TenantSubscription;
  agentLicense?: FieldAgentLicense;
  activeAgentsCount?: number;
  maxFieldAgents?: number;
}

/**
 * Service de gestion des licences et validation des accès PWA Mobile Terrain pour Elyssa ERP.
 */
export class MobileLicenseService {
  /**
   * Récupère la souscription courante d'un tenant (ou génère un fallback par défaut selon sa config).
   */
  public static async getTenantSubscription(tenantId: string): Promise<TenantSubscription> {
    try {
      const subRef = doc(db, 'company_erp_data', tenantId, 'subscription', 'current');
      const subSnap = await getDoc(subRef);

      if (subSnap.exists()) {
        return subSnap.data() as TenantSubscription;
      }
    } catch (err) {
      console.warn(`[MobileLicenseService] Erreur lors du chargement de la souscription Firestore pour ${tenantId}:`, err);
    }

    // Default mock subscription per tenant
    const isGep = tenantId === 'GEP';
    return {
      tenantId,
      plan: isGep ? 'PRO' : 'ESSENTIAL',
      activeModules: isGep ? ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-11'] : ['MOD-01', 'MOD-02'],
      quotas: {
        maxUsers: isGep ? 25 : 5,
        maxFieldAgents: isGep ? 10 : 3,
        monthlyBiometricVerifications: isGep ? 500 : 50
      },
      addOnPricing: {
        mobileFleetActive: isGep,
        pricePerExtraFieldAgent: 39 // 39 TND / mois
      }
    };
  }

  /**
   * Récupère la liste des collaborateurs et leur statut de licence terrain pour un tenant.
   */
  public static async getTenantFieldAgents(tenantId: string): Promise<FieldAgentLicense[]> {
    try {
      const collsRef = collection(db, 'company_erp_data', tenantId, 'collaborators');
      const snap = await getDocs(collsRef);

      if (!snap.empty) {
        return snap.docs.map(doc => {
          const data = doc.data();
          return {
            agentId: doc.id,
            agentName: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Agent',
            email: data.email || 'agent@elyssa-erp.tn',
            role: data.role || 'Collaborateur',
            department: data.department || 'Opérations Terrain',
            hasMobileLicense: Boolean(data.hasMobileLicense),
            assignedAt: data.mobileLicenseAssignedAt,
            lastMobileSync: data.lastMobileSync
          };
        });
      }
    } catch (err) {
      console.warn(`[MobileLicenseService] Erreur lors du chargement des agents terrain Firestore pour ${tenantId}:`, err);
    }

    // Fallback list of collaborators
    return [];
  }

  /**
   * 3. BACKEND & SÉCURITÉ : MIDDLEWARE DE CONNEXION (validateMobileLogin)
   * Valide l'accès mobile d'un agent sur le terrain lors du démarrage/login PWA.
   */
  public static async validateMobileLogin(
    tenantId: string,
    agentId: string
  ): Promise<MobileLoginValidationResult> {
    console.log(`[MobileLicenseService] Validation connexion mobile pour Tenant=${tenantId}, Agent=${agentId}...`);

    // a) Récupération souscription tenant
    const sub = await this.getTenantSubscription(tenantId);

    // b) Vérification de l'activation du module
    const isModuleActive = sub.addOnPricing.mobileFleetActive || sub.activeModules.includes('MOD-11') || sub.activeModules.includes('MOBILE_FLEET');
    if (!isModuleActive) {
      return {
        authorized: false,
        errorCode: 'MODULE_DISABLED',
        errorMessage: `Le module "Flotte Mobile & Opérations Terrain" n'est pas actif pour le tenant ${tenantId}. Veuillez l'activer depuis le Store de Modules ERP (39 TND/mois/agent).`,
        subscription: sub
      };
    }

    // c) Récupération des agents terrain du tenant
    const agents = await this.getTenantFieldAgents(tenantId);
    const activeAgentsCount = agents.filter(a => a.hasMobileLicense).length;

    // d) Vérification du quota global maxFieldAgents
    if (activeAgentsCount > sub.quotas.maxFieldAgents) {
      return {
        authorized: false,
        errorCode: 'QUOTA_EXCEEDED',
        errorMessage: `Le quota d'agents terrain est dépassé (${activeAgentsCount}/${sub.quotas.maxFieldAgents} licences). Veuillez souscrire à des licences supplémentaires.`,
        subscription: sub,
        activeAgentsCount,
        maxFieldAgents: sub.quotas.maxFieldAgents
      };
    }

    // e) Vérification que l'agent spécifique possède une licence activée
    const currentAgent = agents.find(a => a.agentId === agentId || a.email === agentId);
    if (currentAgent && !currentAgent.hasMobileLicense) {
      return {
        authorized: false,
        errorCode: 'LICENSE_NOT_ASSIGNED',
        errorMessage: `L'agent "${currentAgent.agentName}" ne possède pas de licence mobile attribuée. Demandez à votre administrateur d'activer votre accès dans le gestionnaire de licences.`,
        subscription: sub,
        agentLicense: currentAgent,
        activeAgentsCount,
        maxFieldAgents: sub.quotas.maxFieldAgents
      };
    }

    // f) Connexion autorisée
    return {
      authorized: true,
      subscription: sub,
      agentLicense: currentAgent,
      activeAgentsCount,
      maxFieldAgents: sub.quotas.maxFieldAgents
    };
  }

  /**
   * Attribue ou révoque une licence terrain à un collaborateur tout en contrôlant les quotas.
   */
  public static async toggleAgentLicense(
    tenantId: string,
    agentId: string,
    targetState: boolean,
    currentSubscription: TenantSubscription,
    currentAgents: FieldAgentLicense[]
  ): Promise<{ success: boolean; message: string; updatedAgents?: FieldAgentLicense[] }> {
    const activeCount = currentAgents.filter(a => a.hasMobileLicense).length;

    if (targetState && activeCount >= currentSubscription.quotas.maxFieldAgents) {
      return {
        success: false,
        message: `Quota maximum atteint (${activeCount}/${currentSubscription.quotas.maxFieldAgents} licences). Impossible d'attribuer une nouvelle licence sans ajouter un seat supplémentaire (39 TND/mois).`
      };
    }

    // Mise à jour de l'agent dans la liste
    const updatedAgents = currentAgents.map(agent => {
      if (agent.agentId === agentId) {
        return {
          ...agent,
          hasMobileLicense: targetState,
          assignedAt: targetState ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return agent;
    });

    // Mise à jour dans Firestore si possible
    try {
      const collabRef = doc(db, 'company_erp_data', tenantId, 'collaborators', agentId);
      await updateDoc(collabRef, {
        hasMobileLicense: targetState,
        mobileLicenseAssignedAt: targetState ? new Date().toISOString() : null
      });
    } catch (err) {
      console.warn(`[MobileLicenseService] Mise à jour locale (Firestore non accessible):`, err);
    }

    return {
      success: true,
      message: targetState
        ? `Licence Mobile Terrain activée pour l'agent.`
        : `Licence Mobile Terrain révoquée pour l'agent.`,
      updatedAgents
    };
  }

  /**
   * Mettre à jour les quotas du tenant (ex: achat de seats supplémentaires).
   */
  public static async addExtraSeats(
    tenantId: string,
    additionalSeats: number,
    currentSub: TenantSubscription
  ): Promise<TenantSubscription> {
    const updatedSub: TenantSubscription = {
      ...currentSub,
      addOnPricing: {
        ...currentSub.addOnPricing,
        mobileFleetActive: true
      },
      quotas: {
        ...currentSub.quotas,
        maxFieldAgents: currentSub.quotas.maxFieldAgents + additionalSeats
      },
      activeModules: Array.from(new Set([...currentSub.activeModules, 'MOD-11']))
    };

    try {
      const subRef = doc(db, 'company_erp_data', tenantId, 'subscription', 'current');
      await setDoc(subRef, updatedSub, { merge: true });
    } catch (err) {
      console.warn('[MobileLicenseService] Mise à jour souscription locale:', err);
    }

    return updatedSub;
  }
}
