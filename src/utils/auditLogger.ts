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

export const AUTOMATED_SYSTEM_SAMPLES: AutoLogParams[] = [
  {
    title: 'Saisie automatique : Création Facture Client Vente #FAC-2026-189',
    category: 'Comptabilité',
    direction: 'Direction Financière',
    authorName: 'Khaled Ben Amor',
    authorRole: 'Dirigeant',
    financialImpact: 145000.000,
    description: 'Enregistrement automatique du flux comptable lors de l\'émission de la facture B2B avec calcul automatisé de la TVA (19%) et de la Retenue à la Source.',
    status: 'Approuvé',
    actionType: 'CREATE',
    sourceModule: 'Facturation & Comptabilité'
  },
  {
    title: 'Saisie automatique : Clôture de l\'Ordre de Fabrication OF-2026-042',
    category: 'Audit',
    direction: 'Direction Technique',
    authorName: 'Tarek Chaabane',
    authorRole: 'Collaborateur',
    financialImpact: 320000.000,
    description: 'Pointage automatique de la fin de production usine. Entrée en stock de 450 unités de produits finis et déstockage des matières premières correspondantes.',
    status: 'Complété',
    actionType: 'UPDATE',
    sourceModule: 'Usine & Production'
  },
  {
    title: 'Saisie automatique : Validation de la Paie Mensuelle & Cotisations CNSS',
    category: 'Ressources Humaines',
    direction: 'Direction RH',
    authorName: 'Sonia Meriah',
    authorRole: 'Collaborateur',
    financialImpact: -85400.000,
    description: 'Calcul automatisé des bulletins de salaire pour 42 collaborateurs. Génération directe du journal des salaires et déclaration télé-liquidée à la CNSS.',
    status: 'Complété',
    actionType: 'APPROVAL',
    sourceModule: 'Ressources Humaines & Paie'
  },
  {
    title: 'Saisie automatique : Dédouanement Dossier Transit Radès #IMP-2026-018',
    category: 'Juridique',
    direction: 'Direction Juridique',
    authorName: 'Rim Oueslati',
    authorRole: 'Collaborateur',
    financialImpact: -24500.000,
    description: 'Consignation automatique du paiement des droits de douane et de la taxe d\'acconage STAM. Libération de la marchandise pour transfert vers le dépôt central.',
    status: 'Approuvé',
    actionType: 'UPDATE',
    sourceModule: 'Transit & Dédouanement'
  },
  {
    title: 'Saisie automatique : Réception Bon de Commande Achat Fournisseur #BR-804',
    category: 'Audit',
    direction: 'Direction Financière',
    authorName: 'Mohamed Ali Gharbi',
    authorRole: 'Collaborateur',
    financialImpact: -68000.000,
    description: 'Rapprochement à trois voix (Bon de Commande, Bon de Réception, Facture Fournisseur) exécuté avec succès par l\'IA comptable d\'Elyssa ERP.',
    status: 'Complété',
    actionType: 'CREATE',
    sourceModule: 'Achats & Approvisionnement'
  },
  {
    title: 'Saisie automatique : Restructuration du Capital & Mise à jour RNE',
    category: 'Evaluation',
    direction: 'Direction Générale',
    authorName: 'Zied Ben Miled',
    authorRole: 'Dirigeant',
    financialImpact: 4800000.000,
    description: 'Inscription automatique du procès-verbal de l\'Assemblée Générale Extraordinaire constatant la valorisation révisée des titres d\'Elyssa ERP.',
    status: 'Approuvé',
    actionType: 'UPDATE',
    sourceModule: 'Gouvernance & M&A'
  },
  {
    title: 'Saisie automatique : Encaissement Chèque Banque BIAT #CHQ-98402',
    category: 'Comptabilité',
    direction: 'Direction Financière',
    authorName: 'Khaled Ben Amor',
    authorRole: 'Dirigeant',
    financialImpact: 52000.000,
    description: 'Lettrage automatique de la remise de chèque sur le compte courant bancaire et mise à jour de l\'état de trésorerie nette.',
    status: 'Complété',
    actionType: 'APPROVAL',
    sourceModule: 'Trésorerie & Banques'
  },
  {
    title: 'Saisie automatique : Amortissement Annuel de la Flotte Automobile',
    category: 'Fiscal',
    direction: 'Direction Financière',
    authorName: 'Mohamed Ali Gharbi',
    authorRole: 'Collaborateur',
    financialImpact: -18500.000,
    description: 'Comptabilisation automatique de la dotation aux amortissements des véhicules utilitaires de transport inter-unités.',
    status: 'Complété',
    actionType: 'SYSTEM',
    sourceModule: 'Gestion des Immobilisations'
  }
];

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
