/**
 * Elyssa ERP - Hub de Messagerie & Canaux Internes d'Entreprise
 * Canaux métier (#general, #terrain-et-chantiers, #ventes-et-commandes), Messages Directs & Notifications Mobiles
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Truck, 
  TrendingUp, 
  Shield, 
  Send, 
  User, 
  Smartphone, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Filter, 
  Search, 
  Plus, 
  Radio, 
  ExternalLink,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CornerDownRight,
  RefreshCw,
  Bell
} from 'lucide-react';
import { InternalMessage, InternalChannel } from '../types/internalChat';
import { InternalChatService, DEFAULT_INTERNAL_CHANNELS } from '../services/internalChatService';
import { TRIAL_FIELD_AGENT_LICENSES } from '../data/mockTrialData';
import { UserSession, Employee } from '../types';

interface InternalChatHubProps {
  tenantId?: string;
  currentUser?: UserSession | null;
  onNavigateToMobileTerrain?: () => void;
  employees?: Employee[];
  isDemoTenant?: boolean;
}

export default function InternalChatHub({
  tenantId = 'MD',
  currentUser,
  onNavigateToMobileTerrain,
  employees = [],
  isDemoTenant = false
}: InternalChatHubProps) {
  const [channels] = useState<InternalChannel[]>(DEFAULT_INTERNAL_CHANNELS);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<{ type: 'channel' | 'dm'; id: string; name: string }>({
    type: 'channel',
    id: 'general',
    name: '#general'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages
  const loadMessages = async () => {
    const list = await InternalChatService.getInternalMessages(tenantId, isDemoTenant);
    setMessages(list);
  };

  useEffect(() => {
    loadMessages();

    const handleNewMessage = (e: any) => {
      if (e.detail) {
        setMessages(prev => [...prev, e.detail]);
      } else {
        loadMessages();
      }
    };

    window.addEventListener('elyssa_internal_message_added', handleNewMessage);
    window.addEventListener('storage', loadMessages);

    return () => {
      window.removeEventListener('elyssa_internal_message_added', handleNewMessage);
      window.removeEventListener('storage', loadMessages);
    };
  }, [tenantId, isDemoTenant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedTarget]);

  // Collaborateurs pour les messages directs : réels uniquement en mode PROD
  const realEmployees = isDemoTenant 
    ? employees 
    : (employees || []).filter(emp => Boolean(emp && !emp.is_demo && !String(emp.id || '').startsWith('demo-')));

  const collaborators = realEmployees.length > 0 ? realEmployees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.jobTitle || emp.department || 'Collaborateur',
    email: emp.email,
    status: emp.department?.includes('Vente') || emp.department?.includes('Logistique') ? 'En Clientèle' : 'Bureau',
    isOnline: Math.random() > 0.3,
    isFieldAgent: emp.department?.includes('Vente') || emp.department?.includes('Logistique')
  })) : (isDemoTenant ? [
    { id: 'demo-emp_1', name: 'Meriam Doudou', role: 'Gérante / Direction', email: 'm.doudou@elyssa-erp.tn', status: 'Bureau', isOnline: true },
    { id: 'demo-emp_2', name: 'Khaled Ben Amor', role: 'Directeur Financier', email: 'k.benamor@elyssa-erp.tn', status: 'Bureau', isOnline: true },
    { id: 'demo-emp_4', name: 'Mohamed Ali Gharbi', role: 'Force de Vente / Van Sales', email: 'm.gharbi@elyssa-erp.tn', status: 'En Clientèle', isOnline: true, isFieldAgent: true },
    { id: 'demo-emp_7', name: 'Hamza Ben Salem', role: 'Chauffeur Livreur / Logistique', email: 'h.bensalem@elyssa-erp.tn', status: 'En Tournée (Ben Arous)', isOnline: true, isFieldAgent: true },
    { id: 'demo-emp_3', name: 'Sonia Trabelsi', role: 'Comptable Fournisseurs', email: 's.trabelsi@elyssa-erp.tn', status: 'Bureau', isOnline: false },
    { id: 'demo-emp_5', name: 'Yassine Mansour', role: 'Chef Magasinier / WMS', email: 'y.mansour@elyssa-erp.tn', status: 'Dépôt Charguia', isOnline: true, isFieldAgent: true }
  ] : []);

  // Filtrer les messages pour la cible active
  const filteredMessages = messages.filter(msg => {
    if (selectedTarget.type === 'channel') {
      return msg.channelId === selectedTarget.id;
    } else {
      // Message direct (1 à 1) ou notification spécifique
      return (
        (msg.recipientId === selectedTarget.id) ||
        (msg.senderId === selectedTarget.id)
      );
    }
  }).filter(msg => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (msg.content && msg.content.toLowerCase().includes(q)) ||
      (msg.senderName && msg.senderName.toLowerCase().includes(q)) ||
      (msg.subject && msg.subject.toLowerCase().includes(q))
    );
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    setIsSending(true);
    const senderName = currentUser?.name || 'Meriam Doudou (Direction)';
    const senderEmail = currentUser?.email || 'm.doudou@elyssa-erp.tn';
    const senderRole = currentUser?.role || 'Admin';

    try {
      if (selectedTarget.type === 'channel') {
        await InternalChatService.sendMessage(tenantId, {
          senderId: currentUser?.id || 'admin-user',
          senderName,
          senderEmail,
          senderRole,
          channelId: selectedTarget.id,
          content: inputContent.trim()
        });
      } else {
        const collab = collaborators.find(c => c.id === selectedTarget.id);
        await InternalChatService.sendMessage(tenantId, {
          senderId: currentUser?.id || 'admin-user',
          senderName,
          senderEmail,
          senderRole,
          recipientId: selectedTarget.id,
          recipientName: collab?.name || selectedTarget.name,
          recipientEmail: collab?.email,
          content: inputContent.trim()
        });
      }
      setInputContent('');
    } catch (err) {
      console.error('Erreur envoi message interne:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickReply = (text: string) => {
    setInputContent(text);
  };

  return (
    <div className="space-y-4">
      {/* En-tête du Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
              <span>Messagerie Interne & Canaux d'Équipe</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Temps Réel Actif
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Échangez avec les équipes de direction, la force de vente nomade et la logistique de distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToMobileTerrain && (
            <button
              onClick={onNavigateToMobileTerrain}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Flotte Mobile Terrain (MOD-11)</span>
            </button>
          )}
          <button
            onClick={loadMessages}
            title="Rafraîchir les messages"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disposition principale : Sidebar Canaux + Espace Discussion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">
        {/* Sidebar : Canaux & Messages Directs (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Recherche */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher message ou collaborateur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Section CANAUX D'ENTREPRISE */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-indigo-500" />
                  Canaux Métier
                </span>
                <span className="text-[10px] font-bold text-slate-400">{channels.length}</span>
              </div>

              <div className="space-y-1">
                {channels.map(channel => {
                  const isSelected = selectedTarget.type === 'channel' && selectedTarget.id === channel.id;
                  const channelMsgCount = messages.filter(m => m.channelId === channel.id).length;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedTarget({ type: 'channel', id: channel.id, name: channel.displayName })}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                          {channel.iconName === 'Truck' && <Truck className="w-3.5 h-3.5" />}
                          {channel.iconName === 'TrendingUp' && <TrendingUp className="w-3.5 h-3.5" />}
                          {channel.iconName === 'MessageSquare' && <MessageSquare className="w-3.5 h-3.5" />}
                          {channel.iconName === 'Shield' && <Shield className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate leading-tight">{channel.displayName}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {channel.badge || channel.description}
                          </p>
                        </div>
                      </div>

                      {channelMsgCount > 0 && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                          isSelected ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {channelMsgCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section MESSAGES DIRECTS & COLLABORATEURS */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-500" />
                  Collaborateurs & Terrain
                </span>
                <span className="text-[10px] font-bold text-slate-400">{collaborators.length}</span>
              </div>

              <div className="space-y-1">
                {collaborators.map(collab => {
                  const isSelected = selectedTarget.type === 'dm' && selectedTarget.id === collab.id;
                  const directMsgsCount = messages.filter(
                    m => (m.recipientId === collab.id || m.senderId === collab.id) && !m.channelId
                  ).length;

                  return (
                    <button
                      key={collab.id}
                      onClick={() => setSelectedTarget({ type: 'dm', id: collab.id, name: collab.name })}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {collab.name.charAt(0)}
                          </div>
                          {collab.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate leading-tight">{collab.name}</p>
                            {collab.isFieldAgent && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1 rounded border border-indigo-200">
                                📱 Nomade
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {collab.status}
                          </p>
                        </div>
                      </div>

                      {directMsgsCount > 0 && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {directMsgsCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Espace Discussion & Fil des Messages (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Header de la discussion active */}
          <div className="p-4 border-b border-slate-150 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                {selectedTarget.type === 'channel' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>{selectedTarget.name}</span>
                  {selectedTarget.type === 'channel' && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      Canal Partagé
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedTarget.type === 'channel'
                    ? channels.find(c => c.id === selectedTarget.id)?.description
                    : `Discussion directe avec ${selectedTarget.name}`
                  }
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">
                {filteredMessages.length} message(s)
              </span>
            </div>
          </div>

          {/* Liste des Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 max-h-[460px]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-700 text-sm">Aucun message pour le moment</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Soyez le premier à publier dans <strong className="text-slate-600">{selectedTarget.name}</strong> ou utilisez les modèles rapides ci-dessous.
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isSystem = msg.isSystemNotification;
                const isMine = msg.senderEmail === (currentUser?.email || 'm.doudou@elyssa-erp.tn');

                if (isSystem) {
                  return (
                    <div 
                      key={msg.id}
                      className="p-3.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 rounded-2xl border border-indigo-200/80 shadow-xs space-y-2 my-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                            <Smartphone className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                              {msg.subject || '📱 Activation de votre Terminal Mobile & Accès Terrain (MOD-11)'}
                            </span>
                            <span className="text-[11px] text-slate-700 font-semibold">
                              {msg.senderName} • {msg.timestamp}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-xs shrink-0">
                          Système Automatisé
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-900 font-medium leading-relaxed pl-10">
                        {msg.content}
                      </p>

                      {msg.actionType === 'open_mobile_terminal' && onNavigateToMobileTerrain && (
                        <div className="pl-10 pt-1">
                          <button
                            onClick={onNavigateToMobileTerrain}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Accéder à l'application Mobile Terrain</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMine ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {msg.senderName ? msg.senderName.charAt(0) : 'U'}
                    </div>

                    <div className={`max-w-[78%] space-y-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-800">{msg.senderName}</span>
                        {msg.senderRole && (
                          <span className="text-[9px] bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.2 rounded font-bold">
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 font-medium">• {msg.timestamp}</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed inline-block font-semibold ${
                        isMine 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs' 
                          : 'bg-white text-slate-950 border border-slate-300 rounded-tl-none shadow-xs'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Réponses Rapides */}
          <div className="p-2 px-4 bg-slate-100/70 border-t border-slate-150 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Suggestions :</span>
            <button
              onClick={() => handleSendQuickReply('Tournée en cours bien reçue, synchronisation des BL effectuée.')}
              className="p-1 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shrink-0 transition text-[10px] cursor-pointer"
            >
              🚚 Synchronisation BL reçue
            </button>
            <button
              onClick={() => handleSendQuickReply('Commande client enregistrée sur le terminal mobile.')}
              className="p-1 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shrink-0 transition text-[10px] cursor-pointer"
            >
              📝 BDC enregistré
            </button>
            <button
              onClick={() => handleSendQuickReply('Rendez-vous client terminé, rapport de visite transmis.')}
              className="p-1 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shrink-0 transition text-[10px] cursor-pointer"
            >
              ✅ Rapport transmis
            </button>
          </div>

          {/* Saisie du message */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Écrire un message dans ${selectedTarget.name}... (Appuyez sur Entrée pour envoyer)`}
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 transition font-medium"
            />

            <button
              type="submit"
              disabled={isSending || !inputContent.trim()}
              className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
