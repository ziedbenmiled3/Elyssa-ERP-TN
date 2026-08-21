/**
 * Elyssa ERP - Registre Global de Démonstration (34 Modules)
 * Mode Purge Intégrale - Retourne des structures vides pour garantir un état zéro propre.
 */

import { db } from '../utils/firebase';

export interface DemoModuleDefinition {
  id: string;
  number: number;
  name: string;
  category: 'HR_FIELD' | 'LOGISTICS_INDUSTRY' | 'SALES_CLIENTS' | 'FINANCE_GOVERNANCE' | 'FLEET_ASSETS_SECURITY' | 'BI_STRATEGY';
  tabs: Array<{
    tabName: string;
    collections: string[];
  }>;
}

export const ERP_MODULES_CATALOG: DemoModuleDefinition[] = [
  {
    id: 'collaborators_mgmt',
    number: 1,
    name: 'Gestion des Collaborateurs',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Collaborateurs / Fiches', collections: ['collaborators'] },
      { tabName: 'Affectations & Structures', collections: ['org_structures', 'department_assignments'] }
    ]
  },
  {
    id: 'time_attendance',
    number: 2,
    name: 'Pointage & Temps de Travail',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Synthèse RH & Alertes', collections: ['biometric_alerts', 'geofence_anomalies'] },
      { tabName: 'Registre & Feuilles de Temps', collections: ['timesheets', 'attendance_logs'] },
      { tabName: 'Badgeuse Virtuelle / PWA', collections: ['virtual_clock_events'] }
    ]
  },
  {
    id: 'mpo_performance',
    number: 3,
    name: 'Contrats d\'Objectifs & Performance (MPO/OKR)',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Tableau de Bord Global', collections: ['mpo_contracts', 'performance_metrics'] },
      { tabName: 'Contrats Individuels', collections: ['employee_objectives', 'prime_calculations'] }
    ]
  },
  {
    id: 'payroll_taxes',
    number: 4,
    name: 'Paie & Déclarations Fiscales / Sociales',
    category: 'HR_FIELD',
    tabs: [
      { tabName: 'Bulletins de Paie', collections: ['payroll_slips'] },
      { tabName: 'Déclarations CNSS / IRPP', collections: ['cnss_declarations', 'irpp_records'] }
    ]
  }
];

export function generateRawDemoFixtures(): Record<string, any[]> {
  return {};
}

export function getFlattenedDemoRegistry(tenantId: string): Record<string, any[]> {
  return {};
}

export async function seedAllDemoModulesToFirestore(tenantId: string): Promise<Record<string, number>> {
  console.log('[seedAllDemoModulesToFirestore] Auto-seeding is disabled in Zero State mode.');
  return {};
}

export function injectDemoData(tenantId: string): void {
  console.log(`[injectDemoData] Injecting simulation demo dataset for tenant ${tenantId}.`);
  try {
    localStorage.setItem(`elyssa_demo_mode_${tenantId}`, 'true');
    window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId, isDemo: true } }));
  } catch (err) {
    console.warn('[injectDemoData] Failed to update localStorage:', err);
  }
}

export function purgeDemoData(tenantId: string): void {
  console.log(`[purgeDemoData] Radical purge of simulation demo dataset for tenant ${tenantId}.`);
  try {
    localStorage.setItem(`elyssa_demo_mode_${tenantId}`, 'false');
    localStorage.removeItem(`elyssa_demo_data_${tenantId}`);
    window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId, isDemo: false } }));
  } catch (err) {
    console.warn('[purgeDemoData] Failed to update localStorage:', err);
  }
}
