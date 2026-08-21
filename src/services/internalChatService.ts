/**
 * Elyssa ERP - Service de Messagerie & Canaux Internes et Notifications d'Activation
 */

import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { InternalMessage, InternalChannel } from '../types/internalChat';

export const DEFAULT_INTERNAL_CHANNELS: InternalChannel[] = [
  {
    id: 'general',
    name: 'general',
    displayName: '#general',
    description: 'Canal général d\'entreprise (Personnel & Direction)',
    iconName: 'MessageSquare',
    badge: 'Tous',
    memberCount: 5
  },
  {
    id: 'terrain-et-chantiers',
    name: 'terrain-et-chantiers',
    displayName: '#terrain-et-chantiers',
    description: 'Agents nomades, Chauffeurs-Livreurs, Logistique & Préparation WMS',
    iconName: 'Truck',
    badge: 'Terrain & WMS',
    memberCount: 3
  },
  {
    id: 'ventes-et-commandes',
    name: 'ventes-et-commandes',
    displayName: '#ventes-et-commandes',
    description: 'Force de vente Van Sales, BDC clients, Encaissements & Direction Commerciale',
    iconName: 'TrendingUp',
    badge: 'Van Sales',
    memberCount: 2
  }
];

export const INITIAL_INTERNAL_MESSAGES_SEED: InternalMessage[] = [
  // Canal #general
  {
    id: 'msg-seed-gen-1',
    tenantId: 'MD',
    senderId: 'demo-emp_1',
    senderName: 'Meriam Doudou',
    senderRole: 'Gérante / Direction Générale',
    senderEmail: 'm.doudou@elyssa-erp.tn',
    channelId: 'general',
    content: 'Bonjour à toute l\'équipe MD ! Bienvenue sur le nouveau Hub Collaboratif Elyssa ERP. N\'hésitez pas à échanger sur les canaux dédiés ou en direct.',
    timestamp: '2026-08-20 08:30',
    isSystemNotification: false,
    isRead: true
  },
  {
    id: 'msg-seed-gen-2',
    tenantId: 'MD',
    senderId: 'demo-emp_2',
    senderName: 'Khaled Ben Amor',
    senderRole: 'Directeur Financier',
    senderEmail: 'k.benamor@elyssa-erp.tn',
    channelId: 'general',
    content: 'Rappel : Les clôtures mensuelles et déclarations TEJ sont synchronisées. Bravo à l\'équipe comptabilité et trésorerie pour la rigueur.',
    timestamp: '2026-08-20 09:15',
    isSystemNotification: false,
    isRead: true
  },
  // Canal #terrain-et-chantiers
  {
    id: 'msg-seed-field-1',
    tenantId: 'MD',
    senderId: 'demo-emp_7',
    senderName: 'Hamza Ben Salem',
    senderRole: 'Chauffeur Livreur / Logistique',
    senderEmail: 'h.bensalem@elyssa-erp.tn',
    channelId: 'terrain-et-chantiers',
    content: 'Tournée Tunis-Sud / Ben Arous démarrée avec l\'Isuzu D-Max (240 TN 8812). 4 livraisons planifiées et géolocalisées sur le PDA.',
    timestamp: '2026-08-20 09:40',
    isSystemNotification: false,
    isRead: true
  },
  {
    id: 'msg-seed-field-2',
    tenantId: 'MD',
    senderId: 'demo-emp_4',
    senderName: 'Mohamed Ali Gharbi',
    senderRole: 'Chargé Clientèle / Ventes',
    senderEmail: 'm.gharbi@elyssa-erp.tn',
    channelId: 'terrain-et-chantiers',
    content: 'Reçu Hamza ! Client SOCODIS La Charguia a validé le réapprovisionnement express. Je t\'ajoute le bon de livraison directement.',
    timestamp: '2026-08-20 10:05',
    isSystemNotification: false,
    isRead: true
  },
  // Canal #ventes-et-commandes
  {
    id: 'msg-seed-sales-1',
    tenantId: 'MD',
    senderId: 'demo-emp_4',
    senderName: 'Mohamed Ali Gharbi',
    senderRole: 'Chargé Clientèle / Ventes',
    senderEmail: 'm.gharbi@elyssa-erp.tn',
    channelId: 'ventes-et-commandes',
    content: 'Commande Van Sales n° BDC-2026-088 enregistrée via l\'application Mobile Terrain (1 420 TND TTC réglée par traite à 30 jours).',
    timestamp: '2026-08-20 10:20',
    isSystemNotification: false,
    isRead: true
  },
  // Direct Message : Notification d'activation initiale pour Mohamed Ali Gharbi
  {
    id: 'msg-seed-notif-mohamed',
    tenantId: 'MD',
    senderId: 'sys-admin',
    senderName: 'Administration Système / RH (Meriam Doudou)',
    senderRole: 'Système Elyssa ERP',
    senderEmail: 'admin@elyssa-erp.tn',
    recipientId: 'demo-emp_4',
    recipientName: 'Mohamed Ali Gharbi',
    recipientEmail: 'm.gharbi@elyssa-erp.tn',
    subject: '📱 Activation de votre Terminal Mobile & Accès Terrain (MOD-11)',
    content: 'Bonjour Mohamed Ali Gharbi, votre licence pour le module Flotte Mobile & Suivi Terrain vient d\'être activée. Vous pouvez désormais utiliser l\'application mobile PWA pour vos pointages géolocalisés, tournées et commandes.',
    timestamp: '2026-08-20 08:00',
    isSystemNotification: true,
    actionType: 'open_mobile_terminal',
    isRead: true
  },
  // Direct Message : Notification d'activation initiale pour Hamza Ben Salem
  {
    id: 'msg-seed-notif-hamza',
    tenantId: 'MD',
    senderId: 'sys-admin',
    senderName: 'Administration Système / RH (Meriam Doudou)',
    senderRole: 'Système Elyssa ERP',
    senderEmail: 'admin@elyssa-erp.tn',
    recipientId: 'demo-emp_7',
    recipientName: 'Hamza Ben Salem',
    recipientEmail: 'h.bensalem@elyssa-erp.tn',
    subject: '📱 Activation de votre Terminal Mobile & Accès Terrain (MOD-11)',
    content: 'Bonjour Hamza Ben Salem, votre licence pour le module Flotte Mobile & Suivi Terrain vient d\'être activée. Vous pouvez désormais utiliser l\'application mobile PWA pour vos pointages géolocalisés, tournées et commandes.',
    timestamp: '2026-08-20 08:05',
    isSystemNotification: true,
    actionType: 'open_mobile_terminal',
    isRead: true
  }
];

export class InternalChatService {
  private static getStorageKey(tenantId: string): string {
    const cleanId = tenantId?.trim() || 'MD';
    return `elyssa_internal_messages_${cleanId}`;
  }

  /**
   * Récupère tous les messages internes du tenant (LocalStorage + Firestore).
   */
  public static async getInternalMessages(tenantId: string, isDemoTenant: boolean = false): Promise<InternalMessage[]> {
    const cleanTenant = tenantId?.trim() || (isDemoTenant ? 'MD' : 'company_parent');
    const key = this.getStorageKey(cleanTenant);
    const isProdTenant = !isDemoTenant || cleanTenant === 'company_parent' || cleanTenant.toLowerCase().includes('parent');
    
    // 1. LocalStorage
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isProdTenant) {
            // Mode PROD : Purge stricte des messages et expéditeurs démo
            const clean = parsed.filter(m => m && !m.id?.startsWith('msg-seed-') && !m.senderId?.startsWith('demo-') && !m.recipientId?.startsWith('demo-') && !m.content?.includes('équipe MD'));
            if (clean.length !== parsed.length) {
              localStorage.setItem(key, JSON.stringify(clean));
            }
            return clean;
          }
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[InternalChatService] Erreur lecture LocalStorage:', e);
    }

    // En mode PROD / Éditeur, retourner un tableau vide par défaut (aucun message d'exemple)
    if (isProdTenant) {
      return [];
    }

    // 2. Firestore fallback if available (mode Démo uniquement)
    try {
      const msgsRef = collection(db, 'company_erp_data', cleanTenant, 'internal_messages');
      const snap = await getDocs(msgsRef);
      if (!snap.empty) {
        const remoteMsgs: InternalMessage[] = [];
        snap.forEach(d => {
          remoteMsgs.push({ id: d.id, ...(d.data() as any) });
        });
        remoteMsgs.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        localStorage.setItem(key, JSON.stringify(remoteMsgs));
        return remoteMsgs;
      }
    } catch (err) {
      console.warn('[InternalChatService] Firestore non disponible ou hors ligne, utilisation des fixtures:', err);
    }

    // 3. Fallback Seed réservé exclusivement au mode DEMO_SANDBOX
    const seed = INITIAL_INTERNAL_MESSAGES_SEED.map(m => ({ ...m, tenantId: cleanTenant }));
    try {
      localStorage.setItem(key, JSON.stringify(seed));
    } catch {
      // ignore
    }
    return seed;
  }

  /**
   * Envoie un message direct ou sur un canal partagé.
   */
  public static async sendMessage(
    tenantId: string,
    message: Omit<InternalMessage, 'id' | 'timestamp' | 'tenantId'>
  ): Promise<InternalMessage> {
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const newMsg: InternalMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tenantId: tenantId || 'MD',
      timestamp: formattedTimestamp,
      isRead: false
    };

    const currentMsgs = await this.getInternalMessages(tenantId);
    const updated = [...currentMsgs, newMsg];

    const key = this.getStorageKey(tenantId);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      // Dispatch custom event for real-time reactive sync across components
      window.dispatchEvent(new CustomEvent('elyssa_internal_message_added', { detail: newMsg }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('[InternalChatService] Erreur sauvegarde message:', e);
    }

    // Firestore async sync
    try {
      const cleanTenant = tenantId || 'MD';
      const msgDocRef = doc(db, 'company_erp_data', cleanTenant, 'internal_messages', newMsg.id);
      await setDoc(msgDocRef, newMsg);
    } catch (err) {
      console.warn('[InternalChatService] Sync Firestore ignorée (mode local actif):', err);
    }

    return newMsg;
  }

  /**
   * Déclencheur automatique lors de l'activation ou de la suspension d'une Licence Mobile Terrain.
   */
  public static async sendMobileLicenseNotification(
    tenantId: string,
    agent: { agentId: string; agentName: string; email?: string; role?: string },
    isActivated: boolean
  ): Promise<InternalMessage> {
    const subject = isActivated
      ? `📱 Activation de votre Terminal Mobile & Accès Terrain (MOD-11)`
      : `🔒 Suspension de votre Licence Mobile Terrain (MOD-11)`;

    const content = isActivated
      ? `Bonjour ${agent.agentName}, votre licence pour le module Flotte Mobile & Suivi Terrain vient d'être activée. Vous pouvez désormais utiliser l'application mobile PWA pour vos pointages géolocalisés, tournées et commandes.`
      : `Bonjour ${agent.agentName}, votre accès au module Flotte Mobile & Suivi Terrain a été suspendu par l'administration système. Vos sessions actives sur terminal nomade ont été révoquées.`;

    const systemMsg: Omit<InternalMessage, 'id' | 'timestamp' | 'tenantId'> = {
      senderId: 'sys-admin',
      senderName: 'Administration Système / RH (Meriam Doudou)',
      senderRole: 'Système Elyssa ERP',
      senderEmail: 'admin@elyssa-erp.tn',
      recipientId: agent.agentId,
      recipientName: agent.agentName,
      recipientEmail: agent.email,
      subject,
      content,
      isSystemNotification: true,
      actionType: isActivated ? 'open_mobile_terminal' : 'none',
      isRead: false
    };

    return await this.sendMessage(tenantId, systemMsg);
  }
}
