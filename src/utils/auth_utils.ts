import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

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

  // Core modules (Paramètres de l'entreprise, Intégration TEJ, Admin, Copilot, Dashboard) are always free and accessible by all companies
  const coreModules = ['saas_config', 'admin', 'company_settings', 'tej', 'copilot', 'dashboard', 'executive_dashboard'];
  if (coreModules.includes(modId)) {
    return true;
  }

  // Full, Enterprise and Industrial packs provide full complete access to all modules without exception
  if (packId === 'full' || packId === 'enterprise' || packId === 'industrial' || packId === 'industriel' || packId === 'full_industrial' || packId === 'premium') {
    return true;
  }

  // Check if the module is explicitly present in customModules / purchased modules array
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
    if (modId === 'production' || modId === 'nomenclatures' || modId === 'manufacturingorders') {
      if (normalizedCustomModules.includes('production')) return true;
    }
    if (modId === 'purchasing' || modId === 'purchaserequisitions' || modId === 'purchaseorders') {
      if (normalizedCustomModules.includes('purchasing')) return true;
    }
    if (modId === 'asset' || modId === 'assets' || modId === 'cessionentries') {
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

  // 2. Solo / Indépendant
  const independentModules = [
    'dashboard', 'executive_dashboard',
    'billing', 'facturation',
    'clients', 'reports', 'company_settings', 'tej'
  ];

  // 3. PME Commerce & Services
  const pmeCommerceModules = [
    'dashboard', 'executive_dashboard',
    'caisse', 'billing', 'facturation',
    'stock', 'stocks', 'payroll', 'attendance', 'clients', 'reports', 'company_settings', 'tej'
  ];

  // 4. Manufacture & GPAO (Formule 159 DT / 199 DT)
  const manufactureGpaoModules = [
    'dashboard', 'executive_dashboard',
    'production', 'stock', 'stocks',
    'purchasing', 'warehouse_picking', 'payroll', 'attendance', 'ged', 'reports', 'company_settings', 'tej'
  ];

  // 5. Grossiste & Négoce Distribution
  const grossisteNegoceModules = [
    'dashboard', 'executive_dashboard',
    'stock', 'stocks', 'purchasing', 'dispatch_tours', 'fleet', 'fleet_management',
    'finance', 'comptabilite', 'mobile_terrain', 'mobile_fleet', 'clients', 'billing', 'facturation', 'reports', 'company_settings', 'tej'
  ];

  // 6. Import / Export & Commerce Int.
  const importExportModules = [
    'dashboard', 'executive_dashboard',
    'transit_logistique', 'transit', 'lc_manager', 'credoc',
    'purchasing', 'stock', 'stocks', 'treasury', 'billing', 'facturation', 'reports', 'company_settings', 'tej'
  ];

  // 7. BTP & Génie Civil
  const btpGenieCivilModules = [
    'dashboard', 'executive_dashboard',
    'billing', 'facturation', 'attendance', 'mobile_terrain', 'fleet_management', 'fleet', 'purchasing', 'reports', 'company_settings', 'tej'
  ];

  // 8. Express & Livraison
  const expressLivraisonModules = [
    'dashboard', 'executive_dashboard',
    'dispatch_tours', 'mobile_terrain', 'mobile_fleet', 'fleet_management', 'fleet', 'billing', 'facturation', 'complaints', 'reports', 'company_settings', 'tej'
  ];

  // 9. Cabinet Comptable & Audit
  const cabinetComptableModules = [
    'dashboard', 'executive_dashboard',
    'accountant_portal',
    'finance', 'comptabilite',
    'payroll', 'collaborators', 'attendance',
    'tej', 'billing', 'facturation',
    'asset', 'assets', 'ged', 'juridique', 'company_settings', 'reports'
  ];

  // 10. RH Only
  const rhOnlyModules = [
    'dashboard', 'executive_dashboard',
    'payroll', 'collaborators', 'attendance', 'ged', 'reports', 'company_settings', 'tej'
  ];

  // 11. Logistics / Distribution
  const logisticsModules = [
    'dashboard', 'executive_dashboard',
    'clients', 'stock', 'stocks', 'fleet', 'mobile_terrain', 'mobile_fleet', 'complaints',
    'transit_logistique', 'transit', 'lc_manager', 'credoc', 'purchasing', 'reports', 'company_settings', 'tej'
  ];

  // 12. Trial Pack (Sandbox complète)
  const trialModules = [
    'dashboard', 'executive_dashboard', 'steering', 'reports', 'caisse', 'clients', 'communication', 'hub_com', 'complaints', 'billing', 'facturation', 'stock', 'stocks', 'payroll', 'collaborators', 'attendance', 'company_settings', 'ged',
    'fleet', 'mobile_terrain', 'mobile_fleet', 'finance', 'comptabilite', 'investment', 'market', 'transit_logistique', 'transit', 'lc_manager', 'credoc', 'cession', 'production', 'purchasing', 'asset', 'treasury', 'business_plan', 'juridique', 'portail_client', 'tej', 'dispatch_tours', 'warehouse_picking', 'fleet_management'
  ];

  if (packId === 'manufacture_gpao' || packId === 'manufacture' || packId === 'gpao') {
    return manufactureGpaoModules.includes(modId);
  } else if (packId === 'grossiste_negoce' || packId === 'grossiste' || packId === 'negoce') {
    return grossisteNegoceModules.includes(modId);
  } else if (packId === 'import_export' || packId === 'transitaire') {
    return importExportModules.includes(modId);
  } else if (packId === 'btp_genie_civil' || packId === 'btp') {
    return btpGenieCivilModules.includes(modId);
  } else if (packId === 'express_livraison' || packId === 'livraison') {
    return expressLivraisonModules.includes(modId);
  } else if (packId === 'pme_commerce' || packId === 'commerce') {
    return pmeCommerceModules.includes(modId);
  } else if (packId === 'independent' || packId === 'solo') {
    return independentModules.includes(modId);
  } else if (packId === 'cabinet_comptable' || packId === 'cabinet' || packId === 'cabinet_comptable_audit') {
    return cabinetComptableModules.includes(modId);
  } else if (packId === 'rh_only') {
    return rhOnlyModules.includes(modId);
  } else if (packId === 'logistics') {
    return logisticsModules.includes(modId);
  } else if (packId === 'trial') {
    return trialModules.includes(modId);
  } else if (packId === 'standard') {
    return standardModules.includes(modId);
  } else if (packId === 'custom') {
    return customModules && customModules.length > 0 ? customModules.map(m => m.toLowerCase().trim()).includes(modId) : standardModules.includes(modId);
  }

  // Par défaut, retour à l'accès Standard
  return standardModules.includes(modId);
};

// getEffectivePack checking the database for 'paid' status in absolute priority.
// If license_status === 'paid', then is_trial is forced to false, regardless of time remaining.
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
