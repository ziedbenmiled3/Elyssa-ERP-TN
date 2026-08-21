import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { TenantSubscription, FieldAgentLicense } from '../types/mobileTerrain';
import { TRIAL_FIELD_AGENT_LICENSES, TRIAL_TENANT_SUBSCRIPTION } from '../data/mockTrialData';
import { InternalChatService } from './internalChatService';

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
  public static async getTenantSubscription(tenantId: string, isDemoTenant: boolean = false): Promise<TenantSubscription> {
    // 1. Check LocalStorage
    try {
      const savedLocal = localStorage.getItem(`elyssa_tenant_subscription_${tenantId}`);
      if (savedLocal) {
        return JSON.parse(savedLocal) as TenantSubscription;
      }
    } catch {
      // ignore
    }

    // 2. Check Firestore
    try {
      const subRef = doc(db, 'company_erp_data', tenantId, 'subscription', 'current');
      const subSnap = await getDoc(subRef);

      if (subSnap.exists()) {
        return subSnap.data() as TenantSubscription;
      }
    } catch (err) {
      console.warn(`[MobileLicenseService] Erreur lors du chargement de la souscription Firestore pour ${tenantId}:`, err);
    }

    // 3. Mode Évaluation / Démo / MD
    const isGep = tenantId === 'GEP';
    if (isGep) {
      return {
        tenantId,
        plan: 'PRO',
        activeModules: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-11'],
        quotas: {
          maxUsers: 25,
          maxFieldAgents: 10,
          monthlyBiometricVerifications: 500
        },
        addOnPricing: {
          mobileFleetActive: true,
          pricePerExtraFieldAgent: 39
        }
      };
    }

    // Default / MD / Trial / PROD default subscription
    return {
      ...TRIAL_TENANT_SUBSCRIPTION,
      tenantId: tenantId || 'Inter-Affaires'
    };
  }

  /**
   * Récupère la liste des collaborateurs et leur statut de licence terrain pour un tenant.
   */
  public static async getTenantFieldAgents(
    tenantId: string,
    isDemoTenant: boolean = false,
    collaborators?: any[]
  ): Promise<FieldAgentLicense[]> {
    // 1. MODE DÉMO (Inter-Affaires Démo, company_demo, etc.)
    if (isDemoTenant) {
      try {
        const saved = localStorage.getItem(`elyssa_mobile_licenses_${tenantId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }

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
              department: data.department || data.structureName || 'Opérations Terrain',
              hasMobileLicense: Boolean(data.hasMobileLicense),
              assignedAt: data.mobileLicenseAssignedAt,
              lastMobileSync: data.lastMobileSync
            };
          });
        }
      } catch (err) {
        console.warn(`[MobileLicenseService] Erreur chargement agents terrain Firestore démo pour ${tenantId}:`, err);
      }

      // Équipe démo canonique : Mohamed Ali Gharbi & Hamza Ben Salem ont la licence active (2/5)
      return TRIAL_FIELD_AGENT_LICENSES.map(agent => ({ ...agent }));
    }

    // 2. MODE PROD (Inter-Affaires Parent ou tout tenant réel) :
    // UNIQUEMENT les salariés réels enregistrés (0 profil démo injecté)

    // a) Si des collaborateurs sont fournis depuis le state parent
    if (collaborators && collaborators.length > 0) {
      const realCollabs = collaborators.filter(c => {
        if (!c) return false;
        const emailLower = (c.email || '').toLowerCase().trim();
        const idLower = (c.id || '').toLowerCase().trim();
        // Filtrer strictement tout compte démo résiduel
        if (
          idLower.startsWith('demo-') ||
          emailLower.endsWith('@elyssa-erp.tn') ||
          emailLower.includes('doudou') ||
          emailLower.includes('benamor') ||
          emailLower.includes('dridi') ||
          emailLower.includes('bensoltane') ||
          emailLower.includes('mansour')
        ) {
          return false;
        }
        const comp = (c.company || c.company_id || c.companyId || '').trim().toLowerCase();
        const activeComp = (tenantId || '').trim().toLowerCase();
        return comp === activeComp || !comp || activeComp === 'inter-affaires' || activeComp === 'elyssa entreprises s.a.';
      });

      if (realCollabs.length > 0) {
        let savedLicenses: Record<string, boolean> = {};
        try {
          const saved = localStorage.getItem(`elyssa_mobile_licenses_${tenantId}`);
          if (saved) {
            const parsed: FieldAgentLicense[] = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              parsed.forEach(p => {
                if (p.agentId) savedLicenses[p.agentId] = p.hasMobileLicense;
              });
            }
          }
        } catch {
          // ignore
        }

        return realCollabs.map(c => ({
          agentId: c.id,
          agentName: c.name,
          email: c.email,
          role: c.role || 'Collaborateur',
          department: c.structureName || c.structureType || 'Opérations',
          hasMobileLicense: savedLicenses[c.id] ?? Boolean(c.hasMobileLicense ?? false),
          assignedAt: c.mobileLicenseAssignedAt,
          lastMobileSync: c.lastMobileSync
        }));
      }
    }

    // b) Check LocalStorage pour PROD en filtrant les comptes démo
    try {
      const saved = localStorage.getItem(`elyssa_mobile_licenses_${tenantId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleanReal = parsed.filter((p: any) => {
            const email = (p.email || '').toLowerCase();
            const id = (p.agentId || '').toLowerCase();
            return !id.startsWith('demo-') && !email.endsWith('@elyssa-erp.tn');
          });
          if (cleanReal.length > 0) {
            return cleanReal;
          }
        }
      }
    } catch {
      // ignore
    }

    // c) Check Firestore pour PROD
    try {
      const collsRef = collection(db, 'company_erp_data', tenantId, 'collaborators');
      const snap = await getDocs(collsRef);

      if (!snap.empty) {
        const cleanDocs = snap.docs
          .map(doc => {
            const data = doc.data();
            return {
              agentId: doc.id,
              agentName: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Agent',
              email: data.email || '',
              role: data.role || 'Collaborateur',
              department: data.department || data.structureName || 'Opérations',
              hasMobileLicense: Boolean(data.hasMobileLicense),
              assignedAt: data.mobileLicenseAssignedAt,
              lastMobileSync: data.lastMobileSync
            };
          })
          .filter(a => !a.agentId.startsWith('demo-') && !a.email.endsWith('@elyssa-erp.tn'));

        if (cleanDocs.length > 0) {
          return cleanDocs;
        }
      }
    } catch (err) {
      console.warn(`[MobileLicenseService] Erreur chargement agents terrain Firestore prod pour ${tenantId}:`, err);
    }

    // Par défaut en PROD : 0 collaborateur tant qu'aucun salarié réel n'est créé
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
          assignedAt: targetState ? (agent.assignedAt || new Date().toISOString().split('T')[0]) : undefined,
          lastMobileSync: targetState ? (agent.lastMobileSync || new Date().toISOString().replace('T', ' ').substring(0, 16)) : agent.lastMobileSync
        };
      }
      return agent;
    });

    // Sauvegarde en LocalStorage pour persistance instantanée
    try {
      localStorage.setItem(`elyssa_mobile_licenses_${tenantId}`, JSON.stringify(updatedAgents));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }

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

    // Notification instantanée dans le Hub de Communication & Messagerie Interne
    const targetAgent = currentAgents.find(a => a.agentId === agentId);
    if (targetAgent) {
      InternalChatService.sendMobileLicenseNotification(
        tenantId,
        {
          agentId: targetAgent.agentId,
          agentName: targetAgent.agentName,
          email: targetAgent.email,
          role: targetAgent.role
        },
        targetState
      ).catch(e => console.warn('[MobileLicenseService] Erreur notification interne:', e));
    }

    return {
      success: true,
      message: targetState
        ? `Licence Mobile Terrain activée avec succès pour l'agent.`
        : `Licence Mobile Terrain désactivée pour l'agent.`,
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
      localStorage.setItem(`elyssa_tenant_subscription_${tenantId}`, JSON.stringify(updatedSub));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }

    try {
      const subRef = doc(db, 'company_erp_data', tenantId, 'subscription', 'current');
      await setDoc(subRef, updatedSub, { merge: true });
    } catch (err) {
      console.warn('[MobileLicenseService] Mise à jour souscription locale:', err);
    }

    return updatedSub;
  }
}
