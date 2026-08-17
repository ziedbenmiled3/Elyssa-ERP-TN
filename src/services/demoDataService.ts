import { db } from '../utils/firebase';
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * Liste centralisée de TOUTES les sous-collections métiers Firestore du tenant
 * sous company_erp_data/{tenantId}/...
 */
export const TENANT_SUBCOLLECTIONS = [
  // 1. Trésorerie & Portefeuille
  'treasury_effects',
  'bank_audits',
  'cash_forecasts',
  'cheques_effects',
  'treasury_cheques_effects',
  'treasury_checks',
  'bank_transfers',
  'bank_transactions',
  'caisse_transactions',

  // 2. Immobilisations, Actifs & Matériel
  'assets_register',
  'depreciation_schedules',
  'fixed_assets',
  'assets',
  'fleet_inventory',
  'hardware_assets',

  // 3. Achats & Approvisionnements
  'purchase_orders',
  'purchase_requests',
  'supplier_evaluations',
  'purchaseRequisitions',
  'purchaseOrders',
  'supplierPerformance',

  // 4. Production & GPAO
  'manufacturing_orders',
  'bill_of_materials',
  'trs_logs',
  'production_orders',
  'bom_nomenclatures',
  'nomenclatures',

  // 5. Parc Auto, Véhicules & Missions
  'fleet_vehicles',
  'fleet_expenses',
  'mission_orders',
  'fleet_missions',
  'vehicles',
  'vehicle_missions',
  'missions',
  'expenses',
  'incidents',
  'fuelBons',
  'interventions',
  'insurances',

  // 6. Cession d'Entreprise, Audit, Traçabilité & Gouvernance
  'company_transfer_audits',
  'transfer_acts',
  'cessionEntries',
  'cession_events',
  'audit_logs',
  'audit_acts',
  'company_cessions',
  'dataroom',
  'system_actions',

  // 7. Flotte Mobile, Terrain & Entrepôt
  'mobile_devices',
  'field_sessions',
  'offline_orders',
  'mobile_orders',
  'construction_reports',
  'chantier_reports',
  'mobile_punches',
  'mobile_licenses',
  'mobile_logs',
  'van_sales_logs',
  'mobile_fleet',
  'warehouse_pickings',
  'picking_orders',
  'depots_stock',
  'shipments',
  'dispatch_tours',
  'delivery_tours',
  'delivery_manifests',
  'warehouses',

  // 8. RH, Collaborateurs, Objectifs & Pointage
  'collaborators',
  'mpo_contracts',
  'performance_contracts',
  'employee_objectives',
  'attendance_logs',
  'attendance_records',
  'biometric_alerts',
  'timesheets',
  'time_tracking',
  'payroll_pending_adjustments',
  'employees',
  'contracts',
  'absences',
  'payslips',
  'time_entries',
  'pointages',
  'pocket_punches',
  'collaborateur_records',
  'rh_records',

  // 9. Ventes, CRM, Stocks & Divers
  'clients',
  'complaints',
  'invoices',
  'visitReports',
  'competitors',
  'suppliers',
  'products',
  'stockMovements',
  'documents',
  'importFolders',
  'lcRequests',
  'transit_dossiers',
  'incomingEmails',
  'emailTemplates',
  'communicationLogs',
  'juridique_shareholders',
  'juridique_deadlines',
  'juridique_documents'
];

export interface PurgeReportDetail {
  deleted: number;
  remaining: number;
  recalcitrantIds?: string[];
}

export type PurgeReport = Record<string, PurgeReportDetail>;

/**
 * Supprime toutes les données de démonstration dans Firestore sous company_erp_data/{tenantId}/...
 * et dans le LocalStorage client tout en préservant la configuration / métadonnées du tenant.
 */
export async function clearDemoData(tenantId: string): Promise<PurgeReport> {
  const report: PurgeReport = {};
  if (!tenantId) return report;

  // Normalisation de l'ID tenant pour Firestore
  const companyId = tenantId.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

  // 1. Purge exhaustive de TOUTES les sous-collections Firestore sous company_erp_data/{tenantId}/...
  if (db) {
    for (const subCol of TENANT_SUBCOLLECTIONS) {
      try {
        const colRef = collection(db, 'company_erp_data', companyId, subCol);
        const snapshot = await getDocs(colRef).catch(() => null);
        
        if (snapshot && !snapshot.empty) {
          let deletedCount = 0;
          const docs = snapshot.docs;
          
          // Exécution des batch deletes par tranches de 400 documents (limite Firestore = 500)
          for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 400);
            chunk.forEach(d => {
              batch.delete(d.ref);
              deletedCount++;
            });
            await batch.commit();
          }
          report[subCol] = { deleted: deletedCount, remaining: 0 };
        } else {
          report[subCol] = { deleted: 0, remaining: 0 };
        }
      } catch (err) {
        console.warn(`[clearDemoData] Notice lors de la purge de la sous-collection ${subCol}:`, err);
        report[subCol] = { deleted: 0, remaining: 0 };
      }
    }

    // 2. Réinitialisation des tableaux du document tenant parent sans supprimer ses métadonnées
    try {
      const tenantDocRef = doc(db, 'company_erp_data', companyId);
      const tenantSnap = await getDoc(tenantDocRef).catch(() => null);
      
      if (tenantSnap && tenantSnap.exists()) {
        const tenantData = tenantSnap.data();
        const updatedDoc: Record<string, any> = { ...tenantData };

        // Remise à zéro de tous les tableaux embarqués
        TENANT_SUBCOLLECTIONS.forEach(key => {
          updatedDoc[key] = [];
        });

        updatedDoc.hasLoadedTrialDemo = false;
        updatedDoc.demoPurged = true;
        updatedDoc.isPurged = true;
        updatedDoc.updatedAt = new Date().toISOString();

        await setDoc(tenantDocRef, updatedDoc, { merge: true });
        report['tenant_parent_metadata'] = { deleted: 1, remaining: 0 };
      }
    } catch (parentErr) {
      console.warn('[clearDemoData] Notice mise à jour document tenant parent:', parentErr);
    }

    // 2b. Purge directe des collections Firestore de premier niveau
    const rootCollectionsToPurge = [
      'collaborators',
      'mpo_contracts',
      'performance_contracts',
      'employee_objectives',
      'attendance_logs',
      'biometric_alerts',
      'timesheets',
      'time_tracking',
      'warehouse_pickings',
      'picking_orders',
      'depots_stock',
      'shipments',
      'dispatch_tours',
      'delivery_manifests',
      'mobile_devices',
      'field_sessions',
      'fleet_inventory',
      'hardware_assets',
      'vehicles',
      'vehicle_missions',
      'fleet_expenses',
      'audit_logs',
      'cession_events',
      'system_actions'
    ];

    for (const rootColName of rootCollectionsToPurge) {
      try {
        const rootRef = collection(db, rootColName);
        const rootSnap = await getDocs(rootRef).catch(() => null);
        if (rootSnap && !rootSnap.empty) {
          const batch = writeBatch(db);
          let delCount = 0;
          for (const docSnap of rootSnap.docs) {
            const data = docSnap.data();
            const docId = docSnap.id.toLowerCase();
            const email = String(data.email || '').toLowerCase();
            const isSystemAdmin = email === 'contact@elyssa.pro' || email === 'admin@elyssa.pro' || email === 'admin@carthage.tn' || email === 'ziedbenmiled3@gmail.com' || data.role === 'SuperAdmin';
            
            if (rootColName === 'collaborators' && isSystemAdmin) {
              continue; // Preserver uniquement l'admin racine
            }

            batch.delete(docSnap.ref);
            delCount++;
          }
          if (delCount > 0) {
            await batch.commit();
          }
          report[`root_${rootColName}`] = { deleted: delCount, remaining: 0 };
        }
      } catch (rErr) {
        console.warn(`[clearDemoData] Notice purge collection root ${rootColName}:`, rErr);
      }
    }
  }

  // 3. Purge des clés LocalStorage associées aux données de démo
  const localKeysToFilter = [
    'carthage_clients', 'carthage_complaints', 'carthage_invoices', 'carthage_visit_reports',
    'carthage_competitors', 'carthage_suppliers', 'carthage_products', 'carthage_stock_movements',
    'carthage_incoming_emails', 'carthage_email_templates', 'carthage_communication_logs',
    'carthage_bank_accounts', 'carthage_bank_transactions', 'carthage_tax_declarations',
    'carthage_year_end_closings', 'carthage_accounting_entries', 'carthage_documents',
    'carthage_employees', 'carthage_contracts', 'carthage_absences', 'carthage_payslips',
    'carthage_collaborators', 'carthage_attendance_logs', 'carthage_attendance_records',
    'carthage_biometric_alerts', 'carthage_timesheets', 'carthage_mpo_contracts', 'elyssa_mpo_contracts', 'carthage_employee_objectives',
    `elyssa_attendance_records_${companyId}`, 'elyssa_pocket_punches',
    'carthage_assets_immobilisations', 'carthage_cession_entries', 'carthage_company_transfer_audits', 'carthage_dataroom',
    'carthage_audit_logs', 'carthage_cession_events', 'carthage_system_actions',
    'carthage_production_nomenclatures', 'carthage_production_manufacturing_orders', 'carthage_trs_logs',
    'carthage_purchasing_requisitions', 'carthage_purchasing_orders', 'carthage_purchasing_suppliers_performance',
    'carthage_import_folders', 'carthage_lc_requests',
    'carthage_fleet_vehicles', 'carthage_fleet_inventory', 'carthage_hardware_assets', 'carthage_fleet_missions', 'carthage_vehicle_missions', 'carthage_fleet_expenses', 'carthage_fleet_incidents', 'carthage_fuel_bons',
    'carthage_mobile_devices', 'carthage_field_sessions', 'carthage_offline_orders', 'carthage_mobile_orders',
    'carthage_warehouse_pickings', 'carthage_picking_orders', 'carthage_depots_stock', 'carthage_shipments', 'carthage_dispatch_tours', 'carthage_delivery_manifests',
    'carthage_mobile_punches', 'carthage_van_sales_logs', 'elyssa_mobile_fleet', 'carthage_mobile_logs',
    'carthage_treasury_cheques_effects', 'carthage_treasury_bank_audits',
    'carthage_juridique_shareholders', 'carthage_juridique_deadlines', 'carthage_juridique_documents',
    'elyssa_company_locations', 'elyssa_pos_transactions',
    `elyssa_payroll_pending_adjustments_${companyId}`
  ];

  localKeysToFilter.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  });

  localStorage.setItem('carthage_demo_simulation_active', 'false');

  // Déclenchement des événements de notification UI pour rafraîchir les React States
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('elyssa_demo_purged', { detail: { tenantId: companyId, report } }));
  }

  return report;
}

/**
 * Exécute la purge complète d'un tenant via l'API serveur backend et la purge Firestore client
 */
export async function purgeTenantData(tenantId: string): Promise<PurgeReport> {
  const localReport = await clearDemoData(tenantId);

  try {
    const res = await fetch('/api/db/purge-demo-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: tenantId })
    });
    const result = await res.json();
    if (res.ok && result.success && result.report) {
      return { ...localReport, ...result.report };
    }
  } catch (err) {
    console.warn('[purgeTenantData] Communication backend purge:', err);
  }

  return localReport;
}

/**
 * Recharge les données de démonstration pour un tenant via l'API backend
 */
export async function reloadDemoData(tenantId: string): Promise<any> {
  try {
    const res = await fetch('/api/db/load-demo-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: tenantId })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('elyssa_demo_reloaded', { detail: { tenantId, updatedData: result.updatedData } }));
      }
      return result.updatedData;
    } else {
      throw new Error(result.error || 'Erreur lors du rechargement des données de démonstration');
    }
  } catch (err) {
    console.error('[reloadDemoData] Erreur:', err);
    throw err;
  }
}
