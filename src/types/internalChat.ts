/**
 * Elyssa ERP - Types pour la Messagerie & Canaux Internes du Hub de Communication
 */

export interface InternalMessage {
  id: string;
  tenantId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  senderEmail?: string;
  recipientId?: string; // ID collaborateur pour les messages directs (1 à 1)
  recipientName?: string;
  recipientEmail?: string;
  channelId?: 'general' | 'terrain-et-chantiers' | 'ventes-et-commandes' | string;
  subject?: string;
  content: string;
  timestamp: string; // ISO ou formaté YYYY-MM-DD HH:mm
  isSystemNotification?: boolean;
  actionType?: 'open_mobile_terminal' | 'open_module' | 'none';
  actionPayload?: any;
  isRead?: boolean;
}

export interface InternalChannel {
  id: 'general' | 'terrain-et-chantiers' | 'ventes-et-commandes';
  name: string;
  displayName: string;
  description: string;
  iconName: 'MessageSquare' | 'Truck' | 'TrendingUp' | 'Shield';
  badge?: string;
  memberCount: number;
}
