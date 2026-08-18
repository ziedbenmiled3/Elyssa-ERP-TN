/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CessionEntry } from '../types';

export interface AutoLogParams {
  title: string;
  category: 'Evaluation' | 'Juridique' | 'Comptabilité' | 'Audit' | 'Ressources Humaines' | 'Négociation' | 'Fiscal' | 'Autre';
  direction: 'Direction Générale' | 'Direction Financière' | 'Direction Juridique' | 'Direction RH' | 'Direction Commerciale' | 'Direction Technique';
  authorName?: string;
  authorRole?: 'Collaborateur' | 'Dirigeant';
  financialImpact?: number;
  description: string;
  status?: 'Brouillon' | 'Soumis' | 'Approuvé' | 'Complété';
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'SYSTEM';
  sourceModule?: string;
}

export function createAutoAuditEntry(params: AutoLogParams): CessionEntry & { isAutomatic: boolean; actionType: string; sourceModule: string } {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return {
    id: `auto-cess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: dateStr,
    time: timeStr,
    title: params.title,
    category: params.category,
    direction: params.direction,
    authorName: params.authorName || 'Moteur ERP Automatique',
    authorRole: params.authorRole || 'Collaborateur',
    financialImpact: params.financialImpact !== undefined ? params.financialImpact : 0,
    description: params.description,
    status: params.status || 'Complété',
    attachmentsCount: Math.floor(Math.random() * 3) + 1,
    isAutomatic: true,
    actionType: params.actionType || 'SYSTEM',
    sourceModule: params.sourceModule || 'Système Elyssa ERP'
  };
}

export const AUTOMATED_SYSTEM_SAMPLES: AutoLogParams[] = [];

export function logSystemEventToStorage(params: AutoLogParams): CessionEntry[] {
  const newEntry = createAutoAuditEntry(params);
  let existing: any[] = [];
  try {
    const saved = localStorage.getItem('carthage_cession_entries');
    if (saved) {
      existing = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading cession entries:', e);
  }

  const updated = [newEntry, ...existing];
  try {
    localStorage.setItem('carthage_cession_entries', JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving cession entry:', e);
  }
  return updated;
}
