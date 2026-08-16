/**
 * Matrice d'Accès de Sécurité Elyssa ERP (RBAC - Role-Based Access Control)
 * 
 * Packs définis :
 * - standard (ou independent) : ['facturation' / 'billing', 'comptabilite' / 'finance']
 * - premium (ou full) : ['standard' + 'caisse', 'hub_com' / 'communication', 'stocks' / 'stock']
 * - industrial : ['premium' + 'production', 'transit' / 'transit_logistique', 'credoc' / 'lc_manager']
 */

export const canAccess = (moduleId: string, pack: string, customModules: string[] = []): boolean => {
  if (!moduleId) return false;
  
  const modId = moduleId.toLowerCase().trim();
  const packId = pack ? pack.toLowerCase().trim() : 'standard';

  // Core modules (Paramètres de l'entreprise, Intégration TEJ, Admin) are always free and accessible by all companies
  const coreModules = ['saas_config', 'admin', 'company_settings', 'tej'];
  if (coreModules.includes(modId)) {
    return true;
  }

  // CRITICAL PROTECTION: Check if the module is explicitly present in customModules / purchased modules array
  // This guarantees that any company (e.g. WS) that purchased modules à la carte will NEVER lose access
  // even if module catalog definitions or pack names are modified.
  if (customModules && customModules.length > 0) {
    const normalizedCustomModules = customModules.map(m => m.toLowerCase().trim());
    if (normalizedCustomModules.includes(modId)) return true;

    // Aliases & module groupings matching
    if (modId === 'billing' || modId === 'facturation') {
      if (normalizedCustomModules.includes('billing') || normalizedCustomModules.includes('facturation')) return true;
    }
    if (modId === 'finance' || modId === 'comptabilite') {
      if (normalizedCustomModules.includes('finance') || normalizedCustomModules.includes('accounting') || normalizedCustomModules.includes('comptabilite')) return true;
    }
    if (modId === 'payroll' || modId === 'collaborators' || modId === 'attendance') {
      if (normalizedCustomModules.includes(modId) || normalizedCustomModules.includes('hrm') || normalizedCustomModules.includes('payroll') || normalizedCustomModules.includes('collaborators') || normalizedCustomModules.includes('attendance')) return true;
    }
    if (modId === 'transit' || modId === 'transit_logistique' || modId === 'credoc' || modId === 'lc_manager') {
      if (normalizedCustomModules.includes('transit_logistique') || normalizedCustomModules.includes('transit') || normalizedCustomModules.includes('lc_manager') || normalizedCustomModules.includes('credoc')) return true;
    }
    if (modId === 'stock' || modId === 'stocks') {
      if (normalizedCustomModules.includes('stock') || normalizedCustomModules.includes('stocks')) return true;
    }
    if (modId === 'hub_com' || modId === 'communication') {
      if (normalizedCustomModules.includes('communication') || normalizedCustomModules.includes('hub_com')) return true;
    }
    if (modId === 'production' || modId === 'nomenclatures' || modId === 'manufacturingOrders') {
      if (normalizedCustomModules.includes('production')) return true;
    }
    if (modId === 'purchasing' || modId === 'purchaseRequisitions' || modId === 'purchaseOrders') {
      if (normalizedCustomModules.includes('purchasing')) return true;
    }
    if (modId === 'asset' || modId === 'assets' || modId === 'cessionEntries') {
      if (normalizedCustomModules.includes('asset') || normalizedCustomModules.includes('cession')) return true;
    }
    if (modId === 'treasury') {
      if (normalizedCustomModules.includes('treasury') || normalizedCustomModules.includes('finance')) return true;
    }
    if (modId === 'investment' || modId === 'bourse') {
      if (normalizedCustomModules.includes('investment') || normalizedCustomModules.includes('bourse')) return true;
    }
    if (modId === 'mobile_terrain' || modId === 'mobile_fleet' || modId === 'mobile' || modId === 'mod-11') {
      if (normalizedCustomModules.includes('mobile_terrain') || normalizedCustomModules.includes('mobile_fleet') || normalizedCustomModules.includes('mobile') || normalizedCustomModules.includes('mod-11')) return true;
    }
  }

  // 1. Standard / Independent / Solo
  const standardModules = [
    'dashboard', 'executive_dashboard',
    'billing', 'facturation', 
    'finance', 'comptabilite',
    'ged', 'reports'
  ];

  // 2. Premium / Full ERP
  const premiumModules = [
    ...standardModules,
    'caisse',
    'communication', 'hub_com',
    'stock', 'stocks',
    'clients', 'complaints', 'market', 'collaborators', 'payroll', 'attendance', 'fleet', 'purchasing', 'asset', 'treasury', 'steering',
    'business_plan', 'juridique', 'portail_client', 'cession', 'investment'
  ];

  // 3. Industrial
  const industrialModules = [
    ...premiumModules,
    'production',
    'transit_logistique', 'transit',
    'lc_manager', 'credoc',
    'mobile_terrain', 'mobile_fleet'
  ];

  // 4. RH Only (Pack RH uniquement)
  const rhOnlyModules = [
    'dashboard', 'executive_dashboard', 'payroll', 'collaborators', 'attendance', 'ged', 'reports'
  ];

  // 5. Logistics (Pack Distribution)
  const logisticsModules = [
    'dashboard', 'executive_dashboard', 'clients', 'stock', 'stocks', 'fleet', 'mobile_terrain', 'mobile_fleet', 'complaints', 'transit_logistique', 'transit', 'lc_manager', 'credoc', 'purchasing'
  ];

  // 6. Trial Pack (Modules d'essai autorisés)
  const trialModules = [
    'dashboard', 'executive_dashboard', 'steering', 'reports', 'caisse', 'clients', 'communication', 'hub_com', 'complaints', 'billing', 'facturation', 'stock', 'stocks', 'payroll', 'collaborators', 'attendance', 'company_settings', 'ged',
    'fleet', 'mobile_terrain', 'mobile_fleet', 'finance', 'comptabilite', 'investment', 'market', 'transit_logistique', 'transit', 'lc_manager', 'credoc', 'cession', 'production', 'purchasing', 'asset', 'treasury', 'business_plan', 'juridique', 'portail_client', 'tej'
  ];

  // 7. Formule Cabinet Comptable & Audit
  const cabinetComptableModules = [
    'dashboard', 'executive_dashboard',
    'accountant_portal',
    'finance', 'comptabilite',
    'payroll', 'collaborators', 'attendance',
    'tej',
    'billing', 'facturation',
    'asset', 'assets',
    'ged',
    'juridique',
    'company_settings',
    'reports'
  ];

  // Vérification de la matrice d'accès selon le pack
  if (packId === 'standard' || packId === 'independent') {
    return standardModules.includes(modId);
  } else if (packId === 'premium' || packId === 'full') {
    return premiumModules.includes(modId);
  } else if (packId === 'industrial' || packId === 'industriel') {
    return industrialModules.includes(modId);
  } else if (packId === 'rh_only') {
    return rhOnlyModules.includes(modId);
  } else if (packId === 'logistics') {
    return logisticsModules.includes(modId);
  } else if (packId === 'trial') {
    return trialModules.includes(modId);
  } else if (packId === 'cabinet_comptable' || packId === 'cabinet' || packId === 'cabinet_comptable_audit') {
    return cabinetComptableModules.includes(modId);
  } else if (packId === 'custom' || packId === 'full' || packId === 'enterprise') {
    // Custom / Full ERP pack provides complete access to all modules included in subscription
    if (customModules && customModules.length > 0) {
      const normalizedCustomModules = customModules.map(m => m.toLowerCase().trim());
      
      if (normalizedCustomModules.includes(modId)) return true;

      // Handle aliasing and grouped modules:
      if (modId === 'billing' || modId === 'facturation') {
        if (normalizedCustomModules.includes('billing') || normalizedCustomModules.includes('facturation')) return true;
      }
      if (modId === 'finance' || modId === 'comptabilite') {
        if (normalizedCustomModules.includes('finance') || normalizedCustomModules.includes('accounting') || normalizedCustomModules.includes('comptabilite')) return true;
      }
      if (modId === 'payroll' || modId === 'collaborators' || modId === 'attendance') {
        if (normalizedCustomModules.includes(modId) || normalizedCustomModules.includes('hrm') || normalizedCustomModules.includes('payroll') || normalizedCustomModules.includes('collaborators') || normalizedCustomModules.includes('attendance')) return true;
      }
      if (modId === 'transit' || modId === 'transit_logistique' || modId === 'credoc' || modId === 'lc_manager') {
        if (normalizedCustomModules.includes('transit_logistique') || normalizedCustomModules.includes('transit') || normalizedCustomModules.includes('lc_manager') || normalizedCustomModules.includes('credoc')) return true;
      }
      if (modId === 'stock' || modId === 'stocks') {
        if (normalizedCustomModules.includes('stock') || normalizedCustomModules.includes('stocks')) return true;
      }
      if (modId === 'hub_com' || modId === 'communication') {
        if (normalizedCustomModules.includes('communication') || normalizedCustomModules.includes('hub_com')) return true;
      }
      if (modId === 'production' || modId === 'nomenclatures' || modId === 'manufacturingOrders') {
        if (normalizedCustomModules.includes('production')) return true;
      }
      if (modId === 'purchasing' || modId === 'purchaseRequisitions' || modId === 'purchaseOrders') {
        if (normalizedCustomModules.includes('purchasing')) return true;
      }
      if (modId === 'asset' || modId === 'assets' || modId === 'cessionEntries') {
        if (normalizedCustomModules.includes('asset') || normalizedCustomModules.includes('cession')) return true;
      }
      if (modId === 'treasury') {
        if (normalizedCustomModules.includes('treasury') || normalizedCustomModules.includes('finance')) return true;
      }
      if (modId === 'investment' || modId === 'bourse') {
        if (normalizedCustomModules.includes('investment') || normalizedCustomModules.includes('bourse')) return true;
      }
      if (modId === 'mobile_terrain' || modId === 'mobile_fleet' || modId === 'mobile' || modId === 'mod-11') {
        if (normalizedCustomModules.includes('mobile_terrain') || normalizedCustomModules.includes('mobile_fleet') || normalizedCustomModules.includes('mobile') || normalizedCustomModules.includes('mod-11')) return true;
      }
    }
    // Full ERP / Custom active pack unlocks all standard, premium & industrial ERP modules
    return true;
  }

  // Par défaut, retour à l'accès Standard
  return standardModules.includes(modId);
};

// getEffectivePack checking the database for 'paid' status in absolute priority.
// If license_status === 'paid', then is_trial is forced to false, regardless of time remaining.
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface EffectivePackResult {
  packId: string;
  is_trial: boolean;
  license_status: string;
}

export const getEffectivePack = async (companyId: string): Promise<EffectivePackResult> => {
  let packId = 'standard';
  let is_trial = false;
  let license_status = 'trial';

  if (!companyId) {
    return { packId, is_trial, license_status };
  }

  try {
    let clientDoc: any = null;

    // 1. Try to fetch direct document by ID (e.g. pc-inter-affaires or pc-sba)
    const docRef = doc(db, 'publisher_clients', companyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      clientDoc = docSnap.data();
    } else {
      // 2. Otherwise search by companyName (e.g. "SBA" or "Inter-Affaires")
      const q = query(collection(db, 'publisher_clients'), where('companyName', '==', companyId));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        clientDoc = qSnap.docs[0].data();
      } else {
        // Fallback case-insensitive check on all documents
        const allSnap = await getDocs(collection(db, 'publisher_clients'));
        const found = allSnap.docs.find(d =>
          d.data().companyName?.toLowerCase() === companyId.toLowerCase() ||
          d.id.toLowerCase() === companyId.toLowerCase()
        );
        if (found) {
          clientDoc = found.data();
        }
      }
    }

    if (clientDoc) {
      license_status = clientDoc.license_status || (clientDoc.status === 'trial' ? 'trial' : 'paid');
      packId = clientDoc.packId || 'standard';

      if (license_status === 'paid') {
        // Priorité absolue : force is_trial à false, quel que soit le temps restant ou le statut d'origine
        is_trial = false;
        if (packId === 'trial') {
          packId = 'custom';
        }
      } else {
        is_trial = (clientDoc.status === 'trial' || license_status === 'trial');
      }
    }
  } catch (error) {
    console.error(`Error fetching effective pack for ${companyId}:`, error);
  }

  return { packId, is_trial, license_status };
};
