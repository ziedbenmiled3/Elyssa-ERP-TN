import { db } from '../utils/firebase';
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { seedAllDemoModulesToFirestore, getFlattenedDemoRegistry } from './demoRegistry';

/**
 * Liste centralisée EXHAUSTIVE de TOUTES les sous-collections métiers Firestore du tenant
 * pour les 34 modules d'Elyssa ERP sous company_erp_data/{tenantId}/...
 */
export const TENANT_SUBCOLLECTIONS = [
  // Module 1: Gestion des Collaborateurs
  'collaborators', 'org_structures', 'department_assignments', 'employees', 'contracts', 'absences', 'payslips', 'collaborateur_records', 'rh_records',

  // Module 2: Pointage & Temps de Travail
  'biometric_alerts', 'geofence_anomalies', 'timesheets', 'attendance_logs', 'virtual_clock_events', 'attendance_records', 'time_tracking', 'time_entries', 'pointages', 'pocket_punches',

  // Module 3: Contrats d'Objectifs & Performance (MPO/OKR)
  'mpo_contracts', 'performance_metrics', 'employee_objectives', 'prime_calculations', 'performance_contracts',

  // Module 4: Paie & Déclarations Fiscales / Sociales
  'payroll_slips', 'cnss_declarations', 'irpp_records', 'payroll_pending_adjustments',

  // Module 5: Flotte Mobile & Suivi Terrain
  'mobile_devices', 'field_sessions', 'gps_breadcrumbs', 'offline_orders_sync', 'offline_orders', 'mobile_orders', 'construction_reports', 'chantier_reports', 'mobile_punches', 'mobile_licenses', 'mobile_logs', 'van_sales_logs', 'mobile_fleet',

  // Module 6: Stocks & Fournisseurs
  'inventory_items', 'stock_categories', 'stock_threshold_alerts', 'stock_valuations', 'products', 'stockMovements',

  // Module 7: Gestion des Achats & Approvisionnements
  'purchase_orders', 'purchase_requests', 'suppliers_registry', 'vendor_ratings', 'supplier_evaluations', 'purchaseRequisitions', 'purchaseOrders', 'supplierPerformance', 'suppliers',

  // Module 8: Gestion des Préparations & Entrepôts (Picking)
  'warehouse_pickings', 'picking_lists', 'dock_alerts', 'warehouse_locations', 'picking_orders', 'depots_stock', 'warehouses',

  // Module 9: Expéditions & Tournées
  'shipment_queues', 'dispatch_tours', 'tour_manifests', 'driver_cash_settlements', 'shipments', 'delivery_tours', 'delivery_manifests',

  // Module 10: Production & GPAO (TRS)
  'manufacturing_orders', 'production_boms', 'workcenter_performance', 'bill_of_materials', 'trs_logs', 'production_orders', 'bom_nomenclatures', 'nomenclatures', 'manufacturingOrders',

  // Module 11: Transit & Logistique Internationale
  'transit_folders', 'customs_declarations', 'landed_cost_calculations', 'customs_documents_eur1', 'importFolders', 'transit_dossiers',

  // Module 12: Lettres de Crédit (Crédocs Bancaires)
  'letters_of_credit', 'swift_messages', 'bank_covenants', 'lcRequests',

  // Module 13: Facturation & Recouvrement
  'invoices', 'credit_notes', 'aging_balances', 'recovery_actions',

  // Module 14: Fiches Clients & CRM
  'clients_directory', 'client_credit_limits', 'clients',

  // Module 15: Caisse Intelligente (POS)
  'pos_sessions', 'pos_receipts', 'cash_drawer_logs', 'caisse_transactions',

  // Module 16: Portail Client Extérieur
  'client_portal_users', 'portal_order_requests',

  // Module 17: Rapports Terrain & Hebdo
  'field_visit_reports', 'survey_responses', 'visitReports', 'competitors',

  // Module 18: Hub de Communication
  'marketing_campaigns', 'communication_threads', 'incomingEmails', 'emailTemplates', 'communicationLogs',

  // Module 19: Suivi des Réclamations & SAV
  'support_tickets', 'merchandise_returns', 'complaints',

  // Module 20: E-Boutique & Storefront (SaaS E-Commerce)
  'ecommerce_products', 'store_categories', 'web_orders', 'abandoned_carts', 'store_shipping_zones', 'payment_gateway_configs',

  // Module 21: Comptabilité Générale & Trésorerie
  'accounting_journals', 'general_ledger', 'journal_entries', 'bank_reconciliations', 'bank_transactions', 'documents',

  // Module 22: Intégration TEJ (CIMF)
  'tej_certificates', 'qrc_tax_records', 'tej_teletransmissions',

  // Module 23: Espace Expert-Comptable
  'accountant_client_files', 'batch_fiscal_filings',

  // Module 24: Trésorerie, Effets & Chèques
  'treasury_checks', 'treasury_effects', 'cash_forecasts', 'bank_audits', 'cheques_effects', 'treasury_cheques_effects', 'bank_transfers',

  // Module 25: Immobilisations & Amortissements
  'fixed_assets', 'depreciation_schedules', 'asset_disposals', 'assets_register', 'assets',

  // Module 26: Bourse & Investissements
  'security_portfolio', 'dividend_records',

  // Module 27: Gestion de Parc Auto & Flotte
  'fleet_vehicles', 'fleet_missions', 'fleet_expenses', 'fleet_accidents', 'vehicles', 'vehicle_missions', 'missions', 'expenses', 'incidents', 'fuelBons', 'interventions', 'insurances', 'mission_orders',

  // Module 28: Gestion du Parc d'Actifs & Matériels
  'fleet_inventory', 'equipment_maintenance', 'hardware_assets',

  // Module 29: GED (Gestion Électronique des Documents)
  'ged_documents', 'scanned_archives',

  // Module 30: Module de Suivi des Actes & Cession d'Entreprise
  'audit_logs', 'cession_events', 'valuation_metrics', 'company_transfer_audits', 'transfer_acts', 'cessionEntries', 'audit_acts', 'company_cessions', 'dataroom', 'system_actions',

  // Module 31: Secrétariat Juridique & Registre Légal
  'legal_minutes', 'shareholders_registry', 'juridique_shareholders', 'juridique_deadlines', 'juridique_documents',

  // Module 32: Espace Client & Gestion des Packs SaaS
  'client_subscriptions', 'tenant_module_permissions',

  // Module 33: Tableau de Bord Décisionnel & BI Copilot
  'bi_kpi_snapshots', 'ai_insights_logs',

  // Module 34: Business Plan Stratégique & Opportunités
  'bp_projections', 'strategic_opportunities'
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
    'carthage_biometric_alerts', 'carthage_timesheets', 'carthage_mpo_contracts', 'elyssa_mpo_contracts', 'carthage_performance_contracts', 'carthage_employee_objectives',
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
 * Recharge les données de démonstration pour un tenant (34 modules)
 */
export async function reloadDemoData(tenantId: string): Promise<any> {
  try {
    const seedReport = await seedAllDemoModulesToFirestore(tenantId);
    
    let backendData: any = null;
    try {
      const res = await fetch('/api/db/load-demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: tenantId })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        backendData = result.updatedData;
      }
    } catch (apiErr) {
      console.warn('[reloadDemoData] Backend notification failed, using client seed:', apiErr);
    }

    localStorage.setItem('carthage_demo_simulation_active', 'true');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('elyssa_demo_reloaded', { 
        detail: { 
          tenantId, 
          seedReport,
          updatedData: backendData 
        } 
      }));
    }

    return backendData || seedReport;
  } catch (err) {
    console.error('[reloadDemoData] Erreur:', err);
    throw err;
  }
}
