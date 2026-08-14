/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  SmtpSettings, 
  ImapSettings,
  IncomingEmail,
  EmailTemplate, 
  CommunicationLog, 
  Client, 
  Invoice, 
  UserSession, 
  SupportTicket, 
  SupportTicketMessage 
} from '../types';
import { INITIAL_EMAIL_TEMPLATES } from '../data/mockData';
import { 
  Mail, 
  Inbox,
  Download,
  Settings, 
  FileText, 
  History, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Save, 
  RefreshCw, 
  Send, 
  User, 
  Eye, 
  CornerDownRight, 
  HelpCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Plus,
  Filter,
  Tag,
  Check,
  Shield,
  LifeBuoy,
  ChevronRight,
  ArrowUpCircle,
  Wrench,
  AlertTriangle,
  Server,
  Cloud,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

interface CommunicationHubProps {
  smtpSettings: SmtpSettings;
  onUpdateSmtpSettings: (settings: SmtpSettings) => void;
  imapSettings: ImapSettings;
  onUpdateImapSettings: (settings: ImapSettings) => void;
  incomingEmails: IncomingEmail[];
  onUpdateIncomingEmails: (emails: IncomingEmail[]) => void;
  emailTemplates: EmailTemplate[];
  onUpdateEmailTemplates: (templates: EmailTemplate[]) => void;
  communicationLogs: CommunicationLog[];
  onUpdateCommunicationLogs: (logs: CommunicationLog[]) => void;
  clients: Client[];
  invoices: Invoice[];
  currentUser?: UserSession | null;
}

export default function CommunicationHub({
  smtpSettings = { host: 'smtp.elyssa-erp.tn', port: 587, secure: false, user: '', pass: '', fromEmail: 'contact@elyssa-erp.tn', fromName: 'Elyssa ERP', isEnabled: true },
  onUpdateSmtpSettings,
  imapSettings = { host: 'imap.elyssa-erp.tn', port: 993, secure: true, user: '', pass: '', isEnabled: true },
  onUpdateImapSettings,
  incomingEmails = [],
  onUpdateIncomingEmails,
  emailTemplates = [],
  onUpdateEmailTemplates,
  communicationLogs = [],
  onUpdateCommunicationLogs,
  clients = [],
  invoices = [],
  currentUser
}: CommunicationHubProps) {
  const safeIncomingEmails = Array.isArray(incomingEmails) ? incomingEmails : [];
  const safeCommunicationLogs = Array.isArray(communicationLogs) ? communicationLogs : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const templatesToUse = Array.isArray(emailTemplates) && emailTemplates.length > 0 
    ? emailTemplates 
    : INITIAL_EMAIL_TEMPLATES;

  // Support Tickets Sub-tab active by default
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'logs' | 'smtp' | 'imap' | 'inbox' | 'templates' | 'composer'>('inbox');
  
  // SMTP Settings Local Form State
  const [smtpForm, setSmtpForm] = useState<SmtpSettings>({ ...smtpSettings });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  // IMAP Settings Local Form State
  const [imapForm, setImapForm] = useState<ImapSettings>({ ...imapSettings });
  const [isVerifyingImap, setIsVerifyingImap] = useState(false);
  const [verificationResultImap, setVerificationResultImap] = useState<{ success: boolean; message: string } | null>(null);

  // Inbox States
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(safeIncomingEmails[0]?.id || null);
  const [incomingEmailSearch, setIncomingEmailSearch] = useState('');
  const [incomingEmailCategoryFilter, setIncomingEmailCategoryFilter] = useState<'all' | 'invoice' | 'complaint' | 'sales' | 'support' | 'general'>('all');
  const [isSyncingInbox, setIsSyncingInbox] = useState(false);

  // Template Editing State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templatesToUse[0]?.id || '');
  const selectedTemplate = templatesToUse.find(t => t.id === selectedTemplateId);
  const [templateSubject, setTemplateSubject] = useState(selectedTemplate?.subject || '');
  const [templateBody, setTemplateBody] = useState(selectedTemplate?.body || '');

  useEffect(() => {
    if (templatesToUse.length > 0) {
      if (!selectedTemplateId || !templatesToUse.some(t => t.id === selectedTemplateId)) {
        const first = templatesToUse[0];
        setSelectedTemplateId(first.id);
        setTemplateSubject(first.subject);
        setTemplateBody(first.body);
      } else {
        const current = templatesToUse.find(t => t.id === selectedTemplateId);
        if (current) {
          setTemplateSubject(current.subject);
          setTemplateBody(current.body);
        }
      }
    }
  }, [templatesToUse, selectedTemplateId]);

  // Composer State
  const [composeToEmail, setComposeToEmail] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);
  const [composeStatus, setComposeStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Filter logs state
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'Sent' | 'Failed' | 'Simulated'>('all');

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('carthage_support_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing support tickets", e);
      }
    }
    
    // Seed high-fidelity Tunisian support tickets
    const initialTickets: SupportTicket[] = [
      {
        id: "TK-2041",
        subject: "Dysfonctionnement du certificat SSL de la passerelle de paiement Flouci",
        category: "Technical",
        priority: "Urgent",
        status: "In_Progress",
        creatorName: "Hamdi Sfaxi",
        creatorEmail: "h.sfaxi@sfaxolive.tn",
        createdDate: "2026-06-22",
        assignedAgent: "Service Technique Elyssa CRM S.A.",
        messages: [
          {
            id: "msg_1",
            senderName: "Hamdi Sfaxi",
            senderRole: "Client",
            content: "Bonjour, lors de la tentative de validation du paiement des factures d'exportation via la passerelle de paiement par carte Flouci, nous obtenons une alerte de sécurité du navigateur indiquant que le certificat SSL de l'API intermédiaire a expiré. Pourriez-vous renouveler le certificat ou nous donner l'URL alternative ?",
            timestamp: "2026-06-22 09:14"
          },
          {
            id: "msg_2",
            senderName: "Khaled Ben Amor",
            senderRole: "IT Support",
            content: "Bonjour Hamdi, nous avons bien pris en compte votre blocage critique. Notre équipe réseau est en cours de déploiement de la clé de chiffrement CDN renouvelée. Le retour au fonctionnement normal est prévu sous 1 heure.",
            timestamp: "2026-06-22 10:30"
          },
          {
            id: "msg_2_reply",
            senderName: "Hamdi Sfaxi",
            senderRole: "Client",
            content: "Merci beaucoup pour votre réactivité. Nous restons en attente de la confirmation finale de déploiement pour repasser nos virements d'avoirs logistiques.",
            timestamp: "2026-06-22 10:48"
          }
        ]
      },
      {
        id: "TK-1092",
        subject: "Génération de l'état annuel 2750 pour la déclaration de précompte Tunisie",
        category: "Billing",
        priority: "Medium",
        status: "Open",
        creatorName: "Zied Ben Miled",
        creatorEmail: "contact@elyssa.pro",
        createdDate: "2026-06-23",
        assignedAgent: "Expert Comptable Elyssa",
        messages: [
          {
            id: "msg_3",
            senderName: "Zied Ben Miled",
            senderRole: "Manager",
            content: "Nous souhaiterions générer automatiquement l'état annuel des retenues à la source (loi de finances tunisienne 2026) au format CSV pour l'impôt sur les sociétés. Est-ce que cette passerelle d'export de données est prise en charge dans l'onglet Éditeur Fiscal ?",
            timestamp: "2026-06-23 02:10"
          }
        ]
      },
      {
        id: "TK-3011",
        subject: "Problème d'alignement des fiches de paie avec la convention collective logistique",
        category: "HR_Payroll",
        priority: "Low",
        status: "Resolved",
        creatorName: "Amira Ben Romdhane",
        creatorEmail: "a.romdhane@elyssa.pro",
        createdDate: "2026-06-21",
        assignedAgent: "Service Paie Elyssa",
        messages: [
          {
            id: "msg_4",
            senderName: "Amira Ben Romdhane",
            senderRole: "Agent",
            content: "Le calcul de l'indemnité de panier de transport montre un écart de 1.200 TND par jour travaillé comparé au barème officiel national tunisien mis en vigueur le 1er Juin. Pouvons-nous forcer sa valeur journalière ?",
            timestamp: "2026-06-21 11:00"
          },
          {
            id: "msg_5",
            senderName: "Karim (Expert Paie)",
            senderRole: "IT Support",
            content: "Bonjour Amira, l'indemnité de panier de transport a été mise à jour à 4.500 TND par jour travaillé comme spécifié par l'avenant conventionnel de la logistique en Tunisie. Vous pouvez re-calculer les bulletins de paie maintenant.",
            timestamp: "2026-06-21 16:45"
          }
        ]
      }
    ];
    localStorage.setItem('carthage_support_tickets', JSON.stringify(initialTickets));
    return initialTickets;
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(supportTickets[0]?.id || null);
  const selectedTicket = supportTickets.find(t => t.id === selectedTicketId);

  // Tickets Filter State
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<'All' | 'Technical' | 'Billing' | 'HR_Payroll' | 'Commercial' | 'Other'>('All');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'All' | 'Open' | 'In_Progress' | 'Pending_Customer' | 'Resolved' | 'Closed'>('All');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<'All' | 'Low' | 'Medium' | 'High' | 'Urgent'>('All');

  // Support Form State
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Technical' | 'Billing' | 'HR_Payroll' | 'Commercial' | 'Other'>('Technical');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');

  // Support Reply State
  const [replyText, setReplyText] = useState('');
  const [reassignAgent, setReassignAgent] = useState('');
  const [notifyClientByEmail, setNotifyClientByEmail] = useState(true);

  // Sync support tickets to localStorage
  useEffect(() => {
    localStorage.setItem('carthage_support_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

  // Synchronize SMTP and IMAP local forms when their parent props update (e.g., from Firebase fetch)
  useEffect(() => {
    setSmtpForm({ ...smtpSettings });
  }, [smtpSettings]);

  useEffect(() => {
    setImapForm({ ...imapSettings });
  }, [imapSettings]);

  // Notification Toast Helper
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Predefined Response Templates
  const prebuiltReplies = [
    { label: "Accuser réception", text: "Bonjour, votre demande a bien été enregistrée par nos équipes techniques. Nous procédons à l'investigation et reviendrons vers vous au plus vite." },
    { label: "Résolution d'incident", text: "Bonjour, l'anomalie signalée a été corrigée avec succès. Vous pouvez maintenant rafraîchir l'application ou l'outil d'export pour valider." },
    { label: "Demander des précisions", text: "Bonjour, afin de mieux comprendre l'origine du blocage, pourriez-vous nous préciser le message d'erreur exact ou l'ID de facture impliqué ?" }
  ];

  // 1. Verify SMTP Settings live API
  const handleVerifySMTP = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpForm)
      });
      const data = await response.json();
      setVerificationResult({
        success: data.success,
        message: data.message
      });
      if (data.success) {
        onUpdateSmtpSettings({ ...smtpForm });
        triggerToast("Paramètres SMTP enregistrés & connectés !");
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: `Erreur client de connexion au serveur proxy : ${err.message || err}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveSMTP = () => {
    onUpdateSmtpSettings({ ...smtpForm });
    triggerToast("Paramètres de messagerie sauvegardés.");
  };

  // 1b. IMAP Handlers
  const handleVerifyIMAP = async () => {
    setIsVerifyingImap(true);
    setVerificationResultImap(null);
    try {
      const response = await fetch('/api/imap/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imapForm)
      });
      const data = await response.json();
      setVerificationResultImap({
        success: data.success,
        message: data.message
      });
      if (data.success) {
        onUpdateImapSettings({ ...imapForm });
        triggerToast("Paramètres IMAP enregistrés & connectés !");
      }
    } catch (err: any) {
      setVerificationResultImap({
        success: false,
        message: `Erreur client de connexion au serveur IMAP : ${err.message || err}`
      });
    } finally {
      setIsVerifyingImap(false);
    }
  };

  const handleSaveIMAP = () => {
    onUpdateImapSettings({ ...imapForm });
    triggerToast("Paramètres de réception IMAP sauvegardés.");
  };

  const handleSyncInbox = async () => {
    setIsSyncingInbox(true);
    
    // Check if real IMAP is enabled and configured
    if (imapSettings && imapSettings.isEnabled && imapSettings.host && imapSettings.user && imapSettings.pass) {
      try {
        const response = await fetch('/api/imap/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imapSettings)
        });
        
        if (!response.ok) {
          throw new Error(`Serveur HTTP : ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.emails) {
          const realEmails: IncomingEmail[] = data.emails;
          
          if (realEmails.length === 0) {
            triggerToast("Boîte de réception vide ou aucun nouvel e-mail.");
            setIsSyncingInbox(false);
            return;
          }
          
          // Merge real emails while avoiding duplicates based on subject, date, or sender
          const uniqueNewEmails = realEmails.filter(realMail => {
            return !safeIncomingEmails.some(existing => 
              (existing.subject === realMail.subject && existing.senderEmail === realMail.senderEmail) ||
              existing.id === realMail.id
            );
          });
          
          if (uniqueNewEmails.length > 0) {
            onUpdateIncomingEmails([...uniqueNewEmails, ...safeIncomingEmails]);
            setSelectedEmailId(uniqueNewEmails[0].id);
            triggerToast(`${uniqueNewEmails.length} nouvel/nouveaux e-mail(s) récupéré(s) en temps réel !`);
          } else {
            triggerToast("Boîte de réception à jour. Aucun nouvel e-mail trouvé.");
          }
        } else {
          throw new Error(data.message || "Échec de récupération.");
        }
      } catch (err: any) {
        console.error("Real IMAP sync failed:", err);
        triggerToast(`Échec de la récupération IMAP : ${err.message || err}. Mode simulation.`);
        runSimulatedSync();
      } finally {
        setIsSyncingInbox(false);
      }
    } else {
      runSimulatedSync();
    }
  };

  const runSimulatedSync = () => {
    setTimeout(() => {
      setIsSyncingInbox(false);
      const newMail = {
        id: `mail-sync-${Date.now()}`,
        senderName: "Mohamed Ali Ben Said (STIP)",
        senderEmail: "m.bensaid@stip.com.tn",
        subject: "Demande urgente de fiches techniques - Commande Gomme Naturelle",
        body: "Bonjour,\n\nNous aimerions recevoir les fiches de sécurité et de spécifications techniques pour le lot d'élastomères que vous nous avez proposé pour l'usine de Menzel Bourguiba.\n\nMerci d'avance pour votre réactivité.\n\nMohamed Ali Ben Said\nIngénieur Qualité STIP S.A.",
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false,
        category: "general" as const
      };
      
      const alreadyHasSync = safeIncomingEmails.some(m => m.senderEmail === "m.bensaid@stip.com.tn");
      if (!alreadyHasSync) {
        onUpdateIncomingEmails([newMail, ...safeIncomingEmails]);
        setSelectedEmailId(newMail.id);
        triggerToast("1 nouvel e-mail reçu et synchronisé via IMAP (Simulation).");
      } else {
        triggerToast("Boîte de réception déjà à jour. Aucun nouvel e-mail.");
      }
    }, 1500);
  };

  const handleConvertEmailToTicket = (email: IncomingEmail) => {
    const ticketId = `TK-${1000 + Math.floor(Math.random() * 9000)}`;
    const categoryMapping: Record<string, 'Technical' | 'Billing' | 'HR_Payroll' | 'Commercial' | 'Other'> = {
      'invoice': 'Billing',
      'complaint': 'Other',
      'sales': 'Commercial',
      'support': 'Technical',
      'general': 'Other'
    };
    
    const newTicket: SupportTicket = {
      id: ticketId,
      subject: email.subject,
      category: categoryMapping[email.category] || 'Other',
      priority: email.category === 'complaint' ? 'High' : 'Medium',
      status: 'Open',
      creatorName: email.senderName,
      creatorEmail: email.senderEmail,
      createdDate: new Date().toISOString().split('T')[0],
      assignedAgent: 'Service Informatique Elyssa ERP S.A.',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderName: email.senderName,
          senderRole: 'Client',
          content: email.body,
          timestamp: email.date
        }
      ]
    };

    setSupportTickets([newTicket, ...supportTickets]);
    setSelectedTicketId(ticketId);
    setActiveSubTab('tickets');
    
    const updated = safeIncomingEmails.map(m => m.id === email.id ? { ...m, isRead: true } : m);
    onUpdateIncomingEmails(updated);
    
    triggerToast(`E-mail de ${email.senderName} converti en ticket d'assistance ${ticketId} !`);
  };

  const handleReplyToEmail = (email: IncomingEmail) => {
    setComposeToEmail(email.senderEmail || '');
    setComposeToName(email.senderName || '');
    setComposeSubject(`Re: ${email.subject || ''}`);
    setComposeBody(`\n\n--- Message d'origine de ${email.senderName || ''} (${email.date || ''}) ---\n> ${(email.body || '').replace(/\n/g, '\n> ')}`);
    setActiveSubTab('composer');
    
    const updated = safeIncomingEmails.map(m => m.id === email.id ? { ...m, isRead: true } : m);
    onUpdateIncomingEmails(updated);
  };

  // 2. Save Edited Template
  const handleSaveTemplate = () => {
    if (!selectedTemplateId) return;
    const updated = templatesToUse.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, subject: templateSubject, body: templateBody };
      }
      return t;
    });
    onUpdateEmailTemplates(updated);
    triggerToast(`Modèle "${selectedTemplate?.name}" mis à jour avec succès.`);
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const templ = templatesToUse.find(t => t.id === id);
    if (templ) {
      setTemplateSubject(templ.subject);
      setTemplateBody(templ.body);
    }
  };

  // 3. Send Manual Compose Email
  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeToEmail || !composeSubject || !composeBody) {
      setComposeStatus({ success: false, message: "Veuillez remplir l'adresse, l'objet et le message." });
      return;
    }

    setIsSendingCompose(true);
    setComposeStatus(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpSettings,
          recipientName: composeToName || composeToEmail,
          recipientEmail: composeToEmail,
          subject: composeSubject,
          body: composeBody,
          templateType: 'manual'
        })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setComposeStatus({
          success: true,
          message: data.message
        });
        if (data.log) {
          onUpdateCommunicationLogs([data.log, ...safeCommunicationLogs]);
        }
        triggerToast("Email envoyé avec succès !");
        setComposeToEmail('');
        setComposeToName('');
        setComposeSubject('');
        setComposeBody('');
      } else {
        setComposeStatus({
          success: false,
          message: data.message || "L'envoi de l'email a échoué."
        });
      }
    } catch (err: any) {
      setComposeStatus({
        success: false,
        message: `Erreur inattendue : ${err.message || err}`
      });
    } finally {
      setIsSendingCompose(false);
    }
  };

  // 4. Create Support Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) return;

    const ticketId = `TK-${1000 + Math.floor(Math.random() * 9000)}`;
    const ticketCreatorName = currentUser?.name || "Zied Ben Miled";
    const ticketCreatorEmail = currentUser?.email || "contact@elyssa.pro";

    const newTicket: SupportTicket = {
      id: ticketId,
      subject: newTicketSubject,
      category: newTicketCategory,
      priority: newTicketPriority,
      status: 'Open',
      creatorName: ticketCreatorName,
      creatorEmail: ticketCreatorEmail,
      createdDate: new Date().toISOString().split('T')[0],
      assignedAgent: 'Service Informatique Elyssa CRM S.A.',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderName: ticketCreatorName,
          senderRole: (currentUser?.role || 'Manager') as any,
          content: newTicketDescription,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ]
    };

    setSupportTickets([newTicket, ...supportTickets]);
    setSelectedTicketId(ticketId);
    setIsAddingTicket(false);

    // Reset Form
    setNewTicketSubject('');
    setNewTicketCategory('Technical');
    setNewTicketPriority('Medium');
    setNewTicketDescription('');

    triggerToast(`Ticket d'assistance ${ticketId} ouvert avec succès !`);

    // Log the action to SMTP/Simulated communication logs
    const ticketLogged: CommunicationLog = {
      id: `log_${Date.now()}`,
      recipientName: "Service Support Elyssa",
      recipientEmail: "admin@elyssa.pro",
      subject: `[Support Elyssa] Nouveau ticket ${ticketId} initié : ${newTicketSubject}`,
      body: `Le collaborateur ${ticketCreatorName} (${ticketCreatorEmail}) a initié un incident de type ${newTicketCategory}.`,
      sentDate: new Date().toLocaleString('fr-FR'),
      status: 'Simulated',
      templateType: 'manual',
      referenceId: ticketId
    };
    onUpdateCommunicationLogs([ticketLogged, ...safeCommunicationLogs]);
  };

  // 5. Submit Message Reply to Ticket
  const handleSubmitTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    const senderName = currentUser?.name || "Zied Ben Miled";
    const senderRole = currentUser?.role || 'Manager';

    const newMessage: SupportTicketMessage = {
      id: `msg_${Date.now()}`,
      senderName,
      senderRole: senderRole as any,
      content: replyText,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    // Determine target state based on who is replying
    const updatedTickets = supportTickets.map(t => {
      if (t.id === selectedTicketId) {
        const nextStatus = t.status === 'Open' ? 'In_Progress' : t.status;
        return {
          ...t,
          status: nextStatus,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    });

    setSupportTickets(updatedTickets);
    setReplyText('');
    triggerToast("Réponse ajoutée en direct au ticket !");

    // Seamlessly log notification email if checkmark was selected
    if (notifyClientByEmail && selectedTicket) {
      const isAgentReply = senderRole !== 'Viewer' && senderRole !== 'Agent';
      const recipientName = isAgentReply ? selectedTicket.creatorName : "Service Support Elyssa";
      const recipientEmail = isAgentReply ? selectedTicket.creatorEmail : "admin@elyssa.pro";

      const replyLogged: CommunicationLog = {
        id: `log_${Date.now()}`,
        recipientName,
        recipientEmail,
        subject: `[Support Elyssa] Notification de réponse au Ticket ${selectedTicket.id}`,
        body: `Bonjour, une nouvelle réponse a été ajoutée. Contenu : "${replyText.slice(0, 80)}..."`,
        sentDate: new Date().toLocaleString('fr-FR'),
        status: 'Simulated',
        templateType: 'manual',
        referenceId: selectedTicket.id
      };
      onUpdateCommunicationLogs([replyLogged, ...safeCommunicationLogs]);
    }
  };

  // 6. Update Ticket Status
  const handleUpdateTicketStatus = (status: SupportTicket['status']) => {
    if (!selectedTicketId) return;
    const updated = supportTickets.map(t => {
      if (t.id === selectedTicketId) {
        return { ...t, status };
      }
      return t;
    });
    setSupportTickets(updated);
    triggerToast(`Statut du ticket modifié : ${status}`);
  };

  // 7. Update Ticket Priority
  const handleUpdateTicketPriority = (priority: SupportTicket['priority']) => {
    if (!selectedTicketId) return;
    const updated = supportTickets.map(t => {
      if (t.id === selectedTicketId) {
        return { ...t, priority };
      }
      return t;
    });
    setSupportTickets(updated);
    triggerToast(`Priorité modifiée en : ${priority}`);
  };

  // 8. Reassign Agent Group
  const handleReassignAgent = (agent: string) => {
    if (!selectedTicketId) return;
    const updated = supportTickets.map(t => {
      if (t.id === selectedTicketId) {
        return { ...t, assignedAgent: agent };
      }
      return t;
    });
    setSupportTickets(updated);
    triggerToast(`Ticket réassigné au groupe : ${agent}`);
  };

  // Filter communication logs count
  const filteredLogs = safeCommunicationLogs.filter(log => {
    const searchLower = (logSearch || '').toLowerCase();
    const matchesSearch = 
      (log.recipientName || '').toLowerCase().includes(searchLower) ||
      (log.recipientEmail || '').toLowerCase().includes(searchLower) ||
      (log.subject || '').toLowerCase().includes(searchLower) ||
      (log.referenceId && (log.referenceId || '').toLowerCase().includes(searchLower));
    
    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter support tickets
  const filteredTickets = supportTickets.filter(ticket => {
    const searchLower = (ticketSearch || '').toLowerCase();
    const matchesSearch = 
      (ticket.subject || '').toLowerCase().includes(searchLower) ||
      (ticket.id || '').toLowerCase().includes(searchLower) ||
      (ticket.creatorName || '').toLowerCase().includes(searchLower) ||
      (ticket.creatorEmail || '').toLowerCase().includes(searchLower);

    const matchesCategory = ticketCategoryFilter === 'All' ? true : ticket.category === ticketCategoryFilter;
    const matchesStatus = ticketStatusFilter === 'All' ? true : ticket.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === 'All' ? true : ticket.priority === ticketPriorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500 text-white rounded-xl p-4 shadow-xl max-w-sm flex items-center space-x-3 text-xs animate-bounce font-sans">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Serveur Tunnel SMTP</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${smtpSettings.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="font-extrabold text-slate-800 text-xs">
                {smtpSettings.isEnabled ? 'SMTP Sécurisé Actif' : 'Messagerie Simulée'}
              </span>
            </div>
            <span className="text-[9px] text-slate-405 block font-mono">Hôte : {smtpSettings.host || 'localhost'}</span>
          </div>
          <div className="p-2.5 bg-indigo-50/70 rounded-xl text-indigo-600">
            <Settings className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Demandes d'Assistance</span>
            <span className="font-black text-slate-800 text-xl block">{supportTickets.length}</span>
            <span className="text-[10px] text-indigo-600 block font-bold">
              {supportTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length} en cours / {supportTickets.filter(t => t.status === 'Resolved').length} résolues
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <LifeBuoy className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Total Relances Client</span>
            <span className="font-black text-slate-800 text-xl block">{safeCommunicationLogs.length}</span>
            <span className="text-[10px] text-emerald-600 block font-bold">
              {safeCommunicationLogs.filter(l => l.status === 'Sent').length} SMTP / {safeCommunicationLogs.filter(l => l.status === 'Simulated').length} Simulés
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Taux d'Efficacité Support</span>
            <span className="font-black text-slate-800 text-xl block">
              {supportTickets.length > 0
                ? `${Math.round((supportTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length / supportTickets.length) * 100)}%`
                : '100%'
              }
            </span>
            <span className="text-[10px] text-amber-600 block font-bold">
              {supportTickets.filter(t => t.priority === 'Urgent').length} incident critique urgent
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs list for communications */}
      <div className="bg-white rounded-2xl border border-slate-150 p-3 shadow-xs">
        <div className="flex flex-wrap border-b border-slate-100 mb-4">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'inbox' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4 text-emerald-600" />
            <span>Boîte de Réception</span>
            {safeIncomingEmails.filter(m => !m.isRead).length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                {safeIncomingEmails.filter(m => !m.isRead).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'tickets' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-rose-600" />
            <span>Tickets d'Assistance Tech & Autre</span>
            <span className="bg-rose-100 text-rose-800 font-black text-[9px] px-1.5 py-0.2 rounded-full">
              {supportTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'logs' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique des Communications</span>
          </button>

          <button
            onClick={() => setActiveSubTab('smtp')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'smtp' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres SMTP</span>
          </button>

          <button
            onClick={() => setActiveSubTab('imap')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'imap' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Configuration IMAP</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'templates' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Modèles d'Emails de Relance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('composer')}
            className={`p-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'composer' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Rédiger un Email Direct</span>
          </button>
        </div>

        <div className="p-2 sm:p-4">
          
          {/* VIEW: Boîte de Réception (Inbox IMAP) */}
          {activeSubTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    <span>Boîte de Réception Collaborative (IMAP)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Consultez et traisez en temps réel les emails entrants reçus sur vos boîtes professionnelles Elyssa ERP.
                  </p>
                </div>
                <button
                  onClick={handleSyncInbox}
                  disabled={isSyncingInbox}
                  className="self-start p-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInbox ? 'animate-spin' : ''}`} />
                  <span>{isSyncingInbox ? "Synchronisation..." : "Synchroniser IMAP"}</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher par expéditeur, objet ou contenu..."
                    value={incomingEmailSearch}
                    onChange={(e) => setIncomingEmailSearch(e.target.value)}
                    className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600"
                  />
                </div>

                {/* Category badges */}
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'invoice', 'complaint', 'sales', 'support', 'general'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setIncomingEmailCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition uppercase cursor-pointer ${
                        incomingEmailCategoryFilter === cat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-150 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' && 'Tous'}
                      {cat === 'invoice' && 'Facturation'}
                      {cat === 'complaint' && 'Réclamations'}
                      {cat === 'sales' && 'Commercial'}
                      {cat === 'support' && 'Support'}
                      {cat === 'general' && 'Général'}
                    </button>
                  ))}
                </div>
              </div>

              {/* List Detail View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                
                {/* Email List Left */}
                <div className="lg:col-span-5 border-r border-slate-150 bg-white max-h-[500px] overflow-y-auto">
                  {(() => {
                    const filtered = safeIncomingEmails.filter(mail => {
                      const searchLower = (incomingEmailSearch || '').toLowerCase();
                      const matchesSearch = 
                        (mail.senderName || '').toLowerCase().includes(searchLower) ||
                        (mail.senderEmail || '').toLowerCase().includes(searchLower) ||
                        (mail.subject || '').toLowerCase().includes(searchLower) ||
                        (mail.body || '').toLowerCase().includes(searchLower);
                      const matchesCategory = 
                        incomingEmailCategoryFilter === 'all' || mail.category === incomingEmailCategoryFilter;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-450">
                          <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <div className="text-xs font-bold">Aucun e-mail trouvé</div>
                          <p className="text-[10px] mt-1 text-slate-400 leading-normal">Essayez de modifier vos filtres ou lancez une synchronisation.</p>
                        </div>
                      );
                    }

                    return filtered.map((mail) => {
                      const isSelected = selectedEmailId === mail.id;
                      const catBadge = ({
                        invoice: { bg: 'bg-blue-50 text-blue-700 border-blue-150', label: 'Comptabilité' },
                        complaint: { bg: 'bg-rose-50 text-rose-700 border-rose-150', label: 'Réclamation' },
                        sales: { bg: 'bg-amber-50 text-amber-700 border-amber-150', label: 'Ventes' },
                        support: { bg: 'bg-purple-50 text-purple-700 border-purple-150', label: 'Support Tech' },
                        general: { bg: 'bg-slate-50 text-slate-700 border-slate-150', label: 'Général' }
                      } as Record<string, { bg: string; label: string }>)[mail.category || 'general'] || { bg: 'bg-slate-50 text-slate-700 border-slate-150', label: 'Général' };

                      return (
                        <button
                          key={mail.id}
                          onClick={() => {
                            setSelectedEmailId(mail.id);
                            if (!mail.isRead) {
                              const updated = safeIncomingEmails.map(m => m.id === mail.id ? { ...m, isRead: true } : m);
                              onUpdateIncomingEmails(updated);
                            }
                          }}
                          className={`w-full text-left p-3.5 border-b border-slate-100 transition cursor-pointer flex items-start space-x-2.5 hover:bg-slate-50/80 ${
                            isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600 font-extrabold text-indigo-900' : ''
                          } ${!mail.isRead ? 'bg-slate-50/40' : ''}`}
                        >
                          <div className="shrink-0 mt-1">
                            {!mail.isRead ? (
                              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
                            ) : (
                              <span className="flex h-2 w-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] truncate block ${!mail.isRead ? 'font-black text-slate-800' : 'font-medium text-slate-600'}`}>
                                {mail.senderName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                                {(mail.date || '').split(' ')[0]}
                              </span>
                            </div>
                            <span className={`text-xs block truncate mt-0.5 ${!mail.isRead ? 'font-black text-slate-900' : 'text-slate-700'}`}>
                              {mail.subject}
                            </span>
                            <p className="text-[10px] text-slate-450 truncate mt-1 leading-normal font-sans">
                              {mail.body}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-[9px] px-2 py-0.5 font-bold rounded-md border ${catBadge.bg}`}>
                                {catBadge.label}
                              </span>
                              {!imapSettings.isEnabled && (
                                <span className="text-[8px] font-mono text-indigo-600/70 bg-indigo-50 px-1 rounded">Simulé</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Email Viewer Right */}
                <div className="lg:col-span-7 bg-white p-5 min-h-[350px] flex flex-col justify-between">
                  {(() => {
                    const selectedMail = safeIncomingEmails.find(m => m.id === selectedEmailId);
                    if (!selectedMail) {
                      return (
                        <div className="flex flex-col items-center justify-center my-auto text-slate-400 p-8 text-center">
                          <Mail className="w-10 h-10 text-slate-200 mb-2" />
                          <div className="text-xs font-bold">Sélectionnez un e-mail</div>
                          <p className="text-[10px] mt-1 text-slate-450">Cliquez sur un message de la liste pour en afficher l'intégralité du contenu et exécuter des actions ERP.</p>
                        </div>
                      );
                    }

                    const catBadge = ({
                      invoice: { bg: 'bg-blue-100 text-blue-800', label: 'Comptabilité / Facture' },
                      complaint: { bg: 'bg-rose-100 text-rose-800', label: 'Réclamation Client' },
                      sales: { bg: 'bg-amber-100 text-amber-800', label: 'Opportunité de Ventes' },
                      support: { bg: 'bg-purple-100 text-purple-800', label: 'Support Technique' },
                      general: { bg: 'bg-slate-100 text-slate-800', label: 'Général' }
                    } as Record<string, { bg: string; label: string }>)[selectedMail.category || 'general'] || { bg: 'bg-slate-100 text-slate-800', label: 'Général' };

                    return (
                      <div className="space-y-4 flex-1 flex flex-col justify-between h-full">
                        {/* Header Details */}
                        <div className="border-b border-slate-100 pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className={`text-[9px] px-2 py-0.5 font-black uppercase rounded-full ${catBadge.bg}`}>
                              {catBadge.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              Reçu le : {selectedMail.date}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-800 leading-snug">
                            {selectedMail.subject}
                          </h4>

                          <div className="flex items-center space-x-2 mt-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {(selectedMail.senderName || selectedMail.senderEmail || 'E').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-black text-slate-700 block">{selectedMail.senderName || selectedMail.senderEmail}</span>
                              <span className="text-[9px] font-mono text-slate-400 block">{selectedMail.senderEmail}</span>
                            </div>
                          </div>
                        </div>

                        {/* Message Body */}
                        <div className="flex-1 py-2 text-xs text-slate-700 whitespace-pre-line leading-relaxed overflow-y-auto max-h-[250px] font-sans">
                          {selectedMail.body}
                        </div>

                        {/* Invoice reference detection */}
                        {(() => {
                          const mailBody = selectedMail.body || '';
                          const mailSubj = selectedMail.subject || '';
                          const invoiceNoMatch = mailBody.match(/F-2026-\d{3}/i) || mailSubj.match(/F-2026-\d{3}/i);
                          if (invoiceNoMatch) {
                            const foundNo = invoiceNoMatch[0].toUpperCase();
                            const matchedInvoice = safeInvoices.find(inv => inv.invoiceNumber === foundNo);
                            return (
                              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-extrabold text-blue-800 block">Facture détectée : {foundNo}</span>
                                    <p className="text-[10px] text-blue-600 mt-0.5 truncate">
                                      {matchedInvoice 
                                        ? `Client: ${matchedInvoice.clientName} | Montant: ${matchedInvoice.amountNetToPay} TND | Statut: ${matchedInvoice.status}`
                                        : 'Cette facture n\'est pas enregistrée dans l\'ERP Elyssa.'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Footer Action Bar */}
                        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-between items-center">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleReplyToEmail(selectedMail)}
                              className="p-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-white" />
                              <span>Répondre</span>
                            </button>

                            <button
                              onClick={() => handleConvertEmailToTicket(selectedMail)}
                              className="p-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                            >
                              <LifeBuoy className="w-3 h-3 text-rose-600" />
                              <span>Créer un Ticket Support</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                const updated = safeIncomingEmails.map(m => m.id === selectedMail.id ? { ...m, isRead: !m.isRead } : m);
                                onUpdateIncomingEmails(updated);
                              }}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition cursor-pointer"
                            >
                              Marquer {selectedMail.isRead ? "Non Lu" : "Lu"}
                            </button>

                            <button
                              onClick={() => {
                                if (confirm("Voulez-vous supprimer définitivement cet email ?")) {
                                  const updated = safeIncomingEmails.filter(m => m.id !== selectedMail.id);
                                  onUpdateIncomingEmails(updated);
                                  setSelectedEmailId(updated[0]?.id || null);
                                  triggerToast("Email supprimé.");
                                }
                              }}
                              className="p-2 bg-rose-50 hover:bg-rose-150 text-rose-600 font-bold text-[10px] rounded-lg transition cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          )}

          {/* VIEW: Configuration IMAP */}
          {activeSubTab === 'imap' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Config */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Paramètres de Serveur de Messagerie Entrante (IMAP)</h3>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-500 font-medium">Activer Boîte IMAP Réelle :</span>
                    <button
                      type="button"
                      onClick={() => setImapForm({ ...imapForm, isEnabled: !imapForm.isEnabled })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        imapForm.isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        imapForm.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hôte IMAP (ex: imap.gmail.com)</label>
                    <input
                      type="text"
                      value={imapForm.host || ''}
                      onChange={(e) => setImapForm({ ...imapForm, host: e.target.value })}
                      placeholder="imap.domain.tn"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Port IMAP</label>
                    <input
                      type="number"
                      value={imapForm.port || 993}
                      onChange={(e) => setImapForm({ ...imapForm, port: Number(e.target.value) })}
                      placeholder="993"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Identifiant / Compte Email</label>
                    <input
                      type="text"
                      value={imapForm.user || ''}
                      onChange={(e) => setImapForm({ ...imapForm, user: e.target.value })}
                      placeholder="commercial@elyssa.pro"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mot de Passe d'Application (ou standard)</label>
                    <input
                      type="password"
                      value={imapForm.pass || ''}
                      onChange={(e) => setImapForm({ ...imapForm, pass: e.target.value })}
                      placeholder="••••••••••••••"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="imap-secure-checkbox"
                    checked={imapForm.secure === true}
                    onChange={(e) => setImapForm({ ...imapForm, secure: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="imap-secure-checkbox" className="text-xs text-slate-600 font-medium select-none">
                    Exiger une Connexion Chiffrée Sécurisée (SSL/TLS sur port 993 recommandé)
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleVerifyIMAP}
                    disabled={isVerifyingImap}
                    className="p-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingImap ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Vérification du handshake...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Tester la Connexion IMAP</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveIMAP}
                    className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Sauvegarder la Config</span>
                  </button>
                </div>

                {verificationResultImap && (
                  <div className={`p-4 border rounded-xl text-xs flex items-start space-x-2.5 ${
                    verificationResultImap.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {verificationResultImap.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold">{verificationResultImap.success ? 'Succès de connexion IMAP' : 'Erreur de poignée de main IMAP'}</div>
                      <p className="mt-0.5 leading-relaxed font-sans">{verificationResultImap.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Help and guidelines sidebar */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4 self-start">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aide Messagerie Entrante</h4>
                </div>
                
                <p className="text-[11px] text-slate-550 leading-relaxed">
                  Le protocole <strong>IMAP</strong> permet à l'ERP <strong>Elyssa ERP</strong> de se connecter de manière transparente à votre serveur de messagerie externe pour extraire de manière sécurisée les communications entrantes, les réclamations et les justificatifs comptables.
                </p>

                <div className="space-y-2 text-[10px] text-slate-450 font-medium">
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>Avantages</strong> : Permet d'intégrer les communications et de générer automatiquement des tickets de réclamation.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>Compatibilité</strong> : Supporte OVH, Topnet, Ooredoo, Orange, Google Workspace et tout serveur IMAP standard.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>Sécurité</strong> : Vos identifiants de boîte de réception sont chiffrés et ne quittent jamais le serveur d'intégration d'Elyssa ERP.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Tickets d'Assistance Ticketing Hub */}
          {activeSubTab === 'tickets' && (
            <div className="space-y-6">
              
              {isAddingTicket ? (
                /* ADD TICKET FORM */
                <form onSubmit={handleCreateTicket} className="bg-slate-50 border border-slate-150 p-6 rounded-2xl space-y-4 text-xs">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-rose-600" />
                      <span>Ouvrir une Demande d'Assistance Technique / Optionnelle</span>
                    </h3>
                    <p className="text-[11px] text-slate-550 mt-0.5">Ce ticket sera directement affecté au service compétent et une trace e-mail sera ajoutée.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block font-black text-slate-600 uppercase text-[10px]">Sujet Clarifié du Ticket de support *</label>
                      <input 
                        type="text"
                        required
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder="Ex : Problème de chargement de l'onglet de déclaration fiscale 2026..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-rose-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-600 uppercase text-[10px]">Catégorie de la Demande</label>
                      <select
                        value={newTicketCategory}
                        onChange={(e: any) => setNewTicketCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-rose-500 text-xs font-bold"
                      >
                        <option value="Technical">🔧 Technique (Bug, API défaillante, Lenteur)</option>
                        <option value="Billing">💳 Facturation & Abonnements SaaS</option>
                        <option value="HR_Payroll">👥 Ressources Humaines & Conventions</option>
                        <option value="Commercial">💼 Relations Commerciales & Devis</option>
                        <option value="Other">🌟 Autre Demande d'Assistance</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-black text-slate-600 uppercase text-[10px]">Niveau d'Urgence Déclaré</label>
                      <select
                        value={newTicketPriority}
                        onChange={(e: any) => setNewTicketPriority(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-rose-500 text-xs font-bold"
                      >
                        <option value="Low">Moyen (Simple Question)</option>
                        <option value="Medium">Standard (Optimisation d'un paramètre)</option>
                        <option value="High">Important (Bloque une opération non-vitale)</option>
                        <option value="Urgent">Urgent / Critique (Arrêt matériel ou erreur comptabilité - Urgent !)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-600 uppercase text-[10px]">Créateur</label>
                      <input 
                        type="text"
                        disabled
                        value={`${currentUser?.name || "Zied Ben Miled"} (${currentUser?.email || "contact@elyssa.pro"})`}
                        className="w-full p-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-black text-slate-600 uppercase text-[10px]">Description exhaustive des faits *</label>
                    <textarea
                      required
                      rows={5}
                      value={newTicketDescription}
                      onChange={(e) => setNewTicketDescription(e.target.value)}
                      placeholder="Expliquez ici précisément les étapes pour reproduire l'anomalie technique, ou l'aide attendue du support technique..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-rose-500 text-xs font-medium"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingTicket(false)}
                      className="p-2.5 px-4 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-650 font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="p-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                    >
                      Initier l'Assistance
                    </button>
                  </div>
                </form>
              ) : (
                /* MAIN HUB: LIST + DISCUSSION CONSOLE */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Tickets list */}
                  <div className="lg:col-span-1 border border-slate-150 rounded-2xl p-4 space-y-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Tickets actifs ({filteredTickets.length})</h3>
                      <button
                        onClick={() => { setIsAddingTicket(true); setSelectedTicketId(null); }}
                        className="p-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Créer</span>
                      </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="space-y-2 text-[11px]">
                      <input 
                        type="text"
                        placeholder="Rechercher par ID, sujet, email..."
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-350 text-xs"
                      />

                      <div className="grid grid-cols-2 gap-1.5 ">
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Catégorie</label>
                          <select
                            value={ticketCategoryFilter}
                            onChange={(e: any) => setTicketCategoryFilter(e.target.value)}
                            className="p-1 text-[10px] w-full bg-white border border-slate-200 rounded font-medium"
                          >
                            <option value="All">Toutes</option>
                            <option value="Technical">Technique</option>
                            <option value="Billing">Factures</option>
                            <option value="HR_Payroll">Paie/RH</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Other">Autre</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Statut de Traitement</label>
                          <select
                            value={ticketStatusFilter}
                            onChange={(e: any) => setTicketStatusFilter(e.target.value)}
                            className="p-1 text-[10px] w-full bg-white border border-slate-200 rounded font-medium"
                          >
                            <option value="All">Tous</option>
                            <option value="Open">Nouveau</option>
                            <option value="In_Progress">En cours</option>
                            <option value="Pending_Customer">En Attente</option>
                            <option value="Resolved">Résolu</option>
                            <option value="Closed">Fermé</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filteredTickets.map(tk => {
                        const isSelected = tk.id === selectedTicketId;
                        
                        const categoryLabels = {
                          Technical: { text: "Technique", icon: <Wrench className="w-3 h-3" />, color: "text-amber-700 bg-amber-50" },
                          Billing: { text: "Factuation/SaaS", icon: <Settings className="w-3 h-3" />, color: "text-blue-700 bg-blue-50" },
                          HR_Payroll: { text: "Ressources H.", icon: <User className="w-3 h-3" />, color: "text-emerald-700 bg-emerald-50" },
                          Commercial: { text: "Commercial", icon: <FileText className="w-3 h-3" />, color: "text-purple-700 bg-purple-50" },
                          Other: { text: "Support G.", icon: <HelpCircle className="w-3 h-3" />, color: "text-slate-650 bg-slate-100" }
                        };
                        const cat = categoryLabels[tk.category] || categoryLabels['Other'];

                        const statusColors = {
                          Open: "bg-red-50 border-red-150 text-red-700",
                          In_Progress: "bg-indigo-50 border-indigo-150 text-indigo-700",
                          Pending_Customer: "bg-amber-50 border-amber-150 text-amber-700",
                          Resolved: "bg-emerald-50 border-emerald-150 text-emerald-800",
                          Closed: "bg-slate-105 border-slate-200 text-slate-500"
                        };
                        const statusText = {
                          Open: "Nouveau", In_Progress: "En Cours", Pending_Customer: "En Attente", Resolved: "Résolu", Closed: "Fermé"
                        };

                        return (
                          <div
                            key={tk.id}
                            onClick={() => setSelectedTicketId(tk.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                              isSelected ? 'bg-white border-rose-500 shadow-md' : 'bg-white hover:bg-slate-50/70 border-slate-150'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1">
                              <span className="font-mono font-bold">{tk.id}</span>
                              <span className="font-medium">{tk.createdDate}</span>
                            </div>

                            <h4 className="font-extrabold text-slate-800 leading-tight mb-1 truncate" title={tk.subject}>
                              {tk.subject}
                            </h4>

                            <div className="flex items-center space-x-1.5 mb-2">
                              {cat.icon}
                              <span className="text-[10px] text-slate-500 font-medium">{cat.text}</span>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                              <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase ${
                                tk.priority === 'Urgent' ? 'bg-red-150 text-red-800 animate-pulse' :
                                tk.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {tk.priority}
                              </span>

                              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusColors[tk.status]}`}>
                                {statusText[tk.status]}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredTickets.length === 0 && (
                        <div className="p-10 text-center text-xs text-slate-400 leading-relaxed bg-white border border-dashed rounded-xl">
                          Aucun ticket d'assistance trouvé.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Active Discussion workspace */}
                  <div className="lg:col-span-2 border border-slate-150 rounded-2xl p-4 bg-white flex flex-col justify-between">
                    {selectedTicket ? (
                      <div className="space-y-4 flex flex-col justify-between h-full">
                        
                        {/* Header Details */}
                        <div className="border-b border-slate-100 pb-3 flex flex-wrap justify-between items-start gap-2">
                          <div className="space-y-1 max-w-md">
                            <span className="text-[10px] uppercase font-bold text-rose-600 font-mono">Dossier Support : {selectedTicket.id}</span>
                            <h3 className="text-sm font-black text-slate-800 leading-tight">{selectedTicket.subject}</h3>
                            <p className="text-[10px] text-slate-450">
                              Initié par <strong>{selectedTicket.creatorName}</strong> ({selectedTicket.creatorEmail}) le {selectedTicket.createdDate}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {/* Priority Select */}
                            <select
                              value={selectedTicket.priority}
                              onChange={(e: any) => handleUpdateTicketPriority(e.target.value)}
                              className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                            >
                              <option value="Low">Priorité : Low</option>
                              <option value="Medium">Priorité : Medium</option>
                              <option value="High">Priorité : High</option>
                              <option value="Urgent">Priorité : Urgent</option>
                            </select>

                            {/* Status Select */}
                            <select
                              value={selectedTicket.status}
                              onChange={(e: any) => handleUpdateTicketStatus(e.target.value)}
                              className="p-1 bg-slate-55 border border-slate-200 rounded font-bold text-slate-800"
                            >
                              <option value="Open">Statut : Nouveau</option>
                              <option value="In_Progress">Statut : En cours</option>
                              <option value="Pending_Customer">Statut : En attente</option>
                              <option value="Resolved">Statut : Résolu</option>
                              <option value="Closed">Statut : Clos</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive Reassignment and Help panel */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl text-[10.5px] border border-slate-150">
                          <div>
                            <span className="text-slate-450 block font-bold uppercase tracking-wider text-[8px] mb-1">Groupe d'attribution actuel</span>
                            <select
                              value={selectedTicket.assignedAgent || 'Service Informatique Elyssa CRM'}
                              onChange={(e) => handleReassignAgent(e.target.value)}
                              className="p-1 bg-white border border-slate-200 rounded w-full font-semibold text-slate-700 text-[10.5px]"
                            >
                              <option value="Service Technique Elyssa CRM S.A.">🔧 Service Technique Elyssa CRM</option>
                              <option value="Expert Comptable Elyssa">💳 Expert Comptable Elyssa</option>
                              <option value="Service Paie Elyssa">👥 Service Paie & RH Elyssa</option>
                              <option value="Support Client SaaS">🌟 Support Directeur de Clientèle</option>
                            </select>
                          </div>

                          <div className="flex flex-col justify-center border-l border-slate-200 pl-3">
                            <span className="text-slate-450 block font-bold uppercase tracking-wider text-[8px] mb-0.5">Note de sécurité</span>
                            <p className="text-[10px] text-slate-500 italic leading-snug">
                              Ce hub chiffre de bout en bout l'ensemble des requêtes conformément aux normes d'audit informatique tunisiennes de l'ANSI.
                            </p>
                          </div>
                        </div>

                        {/* Conversation Thread */}
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 max-h-[320px] overflow-y-auto space-y-3.5 my-2">
                          {selectedTicket.messages.map((msg, idx) => {
                            // Support agents vs custom client contrast styling
                            const isSupport = msg.senderRole === 'IT Support' || (msg.senderRole as any) === 'SuperAdmin';
                            return (
                              <div
                                key={msg.id || idx}
                                className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 space-y-1 shadow-xs text-xs tracking-wide ${
                                  isSupport 
                                    ? 'bg-rose-50/80 border border-rose-100 text-rose-950 ml-auto' 
                                    : 'bg-white border border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 text-[9px] text-slate-400 font-bold border-b border-dashed border-slate-200 pb-1 mb-1">
                                  <span className="flex items-center space-x-1 uppercase">
                                    <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span>{msg.senderName}</span>
                                    <span className="text-[8px] opacity-75 font-mono px-1 bg-slate-100 rounded text-slate-550 lowercase">
                                      ({msg.senderRole})
                                    </span>
                                  </span>
                                  <span className="font-medium font-mono whitespace-nowrap">{msg.timestamp}</span>
                                </div>
                                <p className="leading-relaxed font-sans whitespace-pre-line text-[11.5px]">{msg.content}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply Form Console */}
                        <form onSubmit={handleSubmitTicketReply} className="space-y-3 pt-3 border-t">
                          
                          {/* Predefined replies selector */}
                          <div className="flex flex-wrap items-center gap-2 max-w-full">
                            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-500" />
                              <span>Réponses types :</span>
                            </span>
                            {prebuiltReplies.map((pb, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyText(pb.text)}
                                className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 hover:text-indigo-650 rounded-lg text-[9.5px] font-bold text-slate-500 border border-slate-200 transition cursor-pointer"
                              >
                                {pb.label}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <textarea
                              rows={3}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Rédiger votre réponse technique à l'attention du collaborateur..."
                              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-rose-500"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={notifyClientByEmail}
                                onChange={(e) => setNotifyClientByEmail(e.target.checked)}
                                className="rounded text-rose-600 focus:ring-rose-500 border-slate-300 w-3.5 h-3.5"
                              />
                              <span>Notifier l'utilisateur par e-mail automatique</span>
                            </label>

                            <button
                              type="submit"
                              className="p-2 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-white" />
                              <span>Répondre & Notifier</span>
                            </button>
                          </div>
                        </form>

                      </div>
                    ) : (
                      <div className="p-16 my-auto text-center space-y-4 text-slate-450 bg-slate-50 border border-dashed rounded-2xl">
                        <LifeBuoy className="w-12 h-12 text-rose-300 mx-auto animate-bounce" />
                        <div>
                          <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Console d'Assistance Elyssa CRM</h4>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Sélectionnez un ticket d'assistance technique ou de paie à gauche pour inspecter le fil de discussion sécurisé ou apporter des réponses correctives.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsAddingTicket(true)}
                          className="p-1.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-150 transition cursor-pointer"
                        >
                          Ouvrir un nouveau ticket
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
          
          {/* VIEW: Logs Historique */}
          {activeSubTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Suivi des relances et correspondances</h3>
                  <p className="text-[11px] text-slate-400">Liste complète de tous les messages envoyés depuis les modules de facturation et recouvrement.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Filtrer par dest., sujet, facture..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="p-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-48 placeholder:text-slate-350 focus:outline-indigo-600"
                  />

                  <select
                    value={logStatusFilter}
                    onChange={(e) => setLogStatusFilter(e.target.value as any)}
                    className="p-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-indigo-600 font-medium"
                  >
                    <option value="all">Tous les Statuts</option>
                    <option value="Sent">Envoyés (SMTP)</option>
                    <option value="Simulated">Simulés (Simulation)</option>
                    <option value="Failed">Échoués (Erreur)</option>
                  </select>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-450 text-xs bg-white">
                  Aucun log de communication ne correspond aux filtres appliqués.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-slate-150 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-650">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider border-b border-slate-150">
                        <th className="p-3">Destinataire</th>
                        <th className="p-3">Type / Réf</th>
                        <th className="p-3">Objet du Message</th>
                        <th className="p-3 mr-2">Emetteur / Date</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{log.recipientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.recipientEmail}</div>
                          </td>
                          <td className="p-3 font-medium">
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold block w-fit capitalize">
                              {log.templateType === 'invoice' ? 'Facturation' : log.templateType.startsWith('collection') ? 'Recouvrement' : 'Manuel'}
                            </span>
                            {log.referenceId && (
                              <span className="text-[10px] text-slate-450 font-mono block mt-0.5">{log.referenceId}</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-medium text-slate-750 truncate">{log.subject}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{log.body}</div>
                          </td>
                          <td className="p-3 text-slate-550 font-mono text-[10.5px] whitespace-nowrap">
                            <div className="flex items-center space-x-1 text-slate-450">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-bold text-slate-600">{log.recipientEmail.includes('support') ? 'Elyssa Support' : 'Gestionnaire'}</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5 text-[9px]">
                              <Clock className="w-3 h-3 text-slate-350" />
                              <span>{log.sentDate}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center">
                              {log.status === 'Sent' && (
                                <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-0.5 border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" />
                                  <span>SMTP Sent</span>
                                </span>
                              )}
                              {log.status === 'Simulated' && (
                                <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-0.5 border border-blue-200">
                                  <Sparkles className="w-3 h-3 text-blue-600 mr-1 animate-pulse" />
                                  <span>Simulé</span>
                                </span>
                              )}
                              {log.status === 'Failed' && (
                                <span className="bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-0.5 border border-rose-200" title={log.errorMessage}>
                                  <AlertCircle className="w-3 h-3 text-rose-600 mr-1" />
                                  <span>Échoué</span>
                                </span>
                              )}
                            </div>
                            {log.errorMessage && (
                              <div className="text-[9px] text-rose-500 block mt-1 font-mono truncate max-w-xs">{log.errorMessage}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Paramètres SMTP */}
          {activeSubTab === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Config */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Paramètres de Serveur de Messagerie Sortante</h3>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-500 font-medium">Activer Messagerie Sortante Réelle :</span>
                    <button
                      type="button"
                      onClick={() => setSmtpForm({ ...smtpForm, isEnabled: !smtpForm.isEnabled })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        smtpForm.isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        smtpForm.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Choix du fournisseur */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type de Fournisseur d'Envoi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSmtpForm({ ...smtpForm, provider: 'smtp' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                        (smtpForm.provider || 'smtp') === 'smtp'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Server className="w-4 h-4 shrink-0 text-indigo-600" />
                      <span>Serveur SMTP Classique</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmtpForm({ ...smtpForm, provider: 'resend' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                        smtpForm.provider === 'resend'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Cloud className="w-4 h-4 shrink-0 text-indigo-600" />
                      <span>Service Cloud Resend</span>
                    </button>
                  </div>
                </div>

                {(smtpForm.provider || 'smtp') === 'smtp' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hôte SMTP (ex: smtp.gmail.com)</label>
                        <input
                          type="text"
                          value={smtpForm.host || ''}
                          onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                          placeholder="smtp.domain.tn"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Port SMTP</label>
                        <input
                          type="number"
                          value={smtpForm.port || 587}
                          onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                          placeholder="587"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Utilisateur / Adresse de Connexion</label>
                        <input
                          type="text"
                          value={smtpForm.user || ''}
                          onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                          placeholder="facturation@monentreprise.com.tn"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mot de Passe Courriel / App Password</label>
                        <input
                          type="password"
                          value={smtpForm.pass || ''}
                          onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                          placeholder="******"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clé API Resend (ex: re_123456789)</label>
                      <input
                        type="password"
                        value={smtpForm.resendApiKey || ''}
                        onChange={(e) => setSmtpForm({ ...smtpForm, resendApiKey: e.target.value })}
                        placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Resend est une infrastructure de messagerie moderne qui envoie vos emails via API REST sécurisée. Elle évite tous les blocages des ports réseaux SMTP classiques.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom de l'Expéditeur Affiché</label>
                    <input
                      type="text"
                      value={smtpForm.fromName || ''}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      placeholder="Elyssa ERP - Service Financier"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adresse Email Expéditeur (Doit être vérifiée sur Resend si activé)</label>
                    <input
                      type="email"
                      value={smtpForm.fromEmail || ''}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      placeholder="facture@monentreprise.com.tn"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={handleVerifySMTP}
                    disabled={isVerifying}
                    className="p-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer animate-none"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>En cours de connexion...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Tester la Connexion SMTP</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSMTP}
                    className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Sauvegarder la Config</span>
                  </button>
                </div>

                {verificationResult && (
                  <div className={`p-4 border rounded-xl text-xs flex items-start space-x-2.5 ${
                    verificationResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {verificationResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold">{verificationResult.success ? 'Succès de validation de communication' : 'Erreur réseau SMTP'}</div>
                      <p className="mt-0.5 leading-relaxed font-sans">{verificationResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide explicatif */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4 self-start">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aide & Recommandations</h4>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Notre passerelle de communication est configurée pour supporter tous les fournisseurs d'accès tunisiens (Topnet, Ooredoo, Orange, Tunisie Telecom) ainsi que les serveurs Cloud hébergés (OVH, Google Workspace, Mailtrap, AWS SES).
                </p>

                <div className="space-y-2 text-[10px] text-slate-450 font-medium">
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>SSL (Port 465)</strong> : Sécurité stricte exigée par iCloud ou Yahoo.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>TLS / STARTTLS (Port 587)</strong> : Recommandé pour Gmail avec app password ou Microsoft 365.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-600 mr-1.5">•</span>
                    <span><strong>Simulateur offline</strong> : Si le serveur SMTP est désactivé, l'ERP générera tout de même les rapports d'impression et les logs d'activité pour préserver la traçabilité.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Modèles d'Emails de Relance */}
          {activeSubTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Select & Variables Tool */}
              <div className="space-y-4 self-start">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sélectionner un Modèle</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-600 cursor-pointer"
                  >
                    {templatesToUse.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <div className="text-[10px] font-black text-indigo-850 uppercase tracking-widest flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Variables disponibles</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-relaxed">
                    Vous pouvez insérer ces jetons dynamiques qui seront remplacés automatiquement lors de l'envoi :
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{clientName}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{invoiceNumber}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{amountTTC}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{amountNetToPay}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{dueDate}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{issuedDate}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-700">{"{{withholdingAmount}}"}</div>
                    <div className="bg-white p-1 rounded border border-indigo-50 font-bold text-slate-750 font-bold">{"{{withholdingTaxRate}}"}</div>
                  </div>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Édition du Modèle Administratif</h4>
                  <span className="text-[10px] text-indigo-600 font-bold font-sans">Messagerie riche</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objet du Message</label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    placeholder="Sujet du courriel"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contenu de l'Email</label>
                  <textarea
                    rows={12}
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:bg-white focus:outline-indigo-600 focus:ring-1 focus:ring-indigo-100"
                    placeholder="Contenu éditable de l'email..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Sauvegarder ce Modèle</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Direct Mail Composer */}
          {activeSubTab === 'composer' && (
            <form onSubmit={handleSendManualEmail} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Recipient details */}
              <div className="space-y-4 self-start">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center space-x-1.5 border-b pb-1">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Destinataire</span>
                </h3>
                
                <p className="text-[11px] text-slate-500">
                  Rédigez un courriel direct à n'importe quel interlocuteur (client d'exportation ou local).
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Raison Sociale / Nom</label>
                  <input
                    type="text"
                    value={composeToName}
                    onChange={(e) => setComposeToName(e.target.value)}
                    placeholder="ex: Sousse Textiles ou M. Karim"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Adresse Courriel Destinataire *</label>
                  <input
                    type="email"
                    required
                    value={composeToEmail}
                    onChange={(e) => setComposeToEmail(e.target.value)}
                    placeholder="contact@client.tn"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
                  />
                </div>

                {/* Preload contacts from clients list to assist rapidly */}
                {safeClients.length > 0 && (
                  <div className="border border-slate-150 p-3 rounded-xl bg-slate-50/50">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5">Insérer rapidement depuis mes fiches clients</label>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {safeClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setComposeToName(c.name);
                            setComposeToEmail(c.email);
                          }}
                          className="w-full text-left p-1 rounded hover:bg-white hover:shadow-xs transition text-[10px] text-slate-755 border border-transparent hover:border-slate-150 flex items-center justify-between"
                        >
                          <span className="font-bold truncate max-w-xs">{c.name}</span>
                          <span className="text-[8px] font-mono text-slate-400 shrink-0">{c.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Composer block */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center space-x-1.5 border-b pb-1">
                  <Mail className="w-4 h-4 text-indigo-700" />
                  <span>Rédiger l'Objet et le Message</span>
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objet du Message *</label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Saisissez l'objet du courriel..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corps de l'Email *</label>
                  <textarea
                    rows={10}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Rédigez votre courrier ici..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:bg-white focus:outline-indigo-600 font-medium"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[10px] text-slate-400">
                    * Informations obligatoires
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSendingCompose}
                    className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCompose ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>Envoyer l'Email</span>
                      </>
                    )}
                  </button>
                </div>

                {composeStatus && (
                  <div className={`p-3 border rounded-xl text-xs flex items-center space-x-2 ${
                    composeStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {composeStatus.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{composeStatus.message}</span>
                  </div>
                )}
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
