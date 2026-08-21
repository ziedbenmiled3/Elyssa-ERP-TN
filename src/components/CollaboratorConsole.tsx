/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CollaboratorAccount, CollaboratorTask, UserSession, SmtpSettings } from '../types';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Mail, 
  Shield, 
  PlusCircle, 
  Calendar, 
  CheckSquare, 
  UserCheck, 
  AlertTriangle,
  FileCheck,
  XCircle,
  Briefcase,
  KeyRound,
  Bell,
  AlertOctagon,
  Eye,
  EyeOff,
  Building2,
  Filter,
  Search,
  Lock,
  MapPin
} from 'lucide-react';
import { MobileAccessToggle } from './admin/MobileAccessToggle';

export const AVAILABLE_MODULES = [
  // Pilotage
  { id: 'dashboard', label: 'Tableau de Bord', category: 'Pilotage', icon: '📊' },
  { id: 'steering', label: 'Objectifs & Pilotage', category: 'Pilotage', icon: '🎯' },
  { id: 'market', label: 'Études & Opportunités', category: 'Pilotage', icon: '🔍' },
  { id: 'business_plan', label: 'Business Plan & Simulation', category: 'Pilotage', icon: '📈' },
  { id: 'portail_client', label: 'Espace Client & Packs', category: 'Pilotage', icon: '🌐' },

  // Vente
  { id: 'caisse', label: 'Caisse Intelligente (POS)', category: 'Vente', icon: '🛒' },
  { id: 'clients', label: 'Fiches Clients', category: 'Vente', icon: '👥' },
  { id: 'reports', label: 'Rapports Terrain & Hebdo', category: 'Vente', icon: '📝' },
  { id: 'communication', label: 'Hub de Communication', category: 'Vente', icon: '✉️' },
  { id: 'complaints', label: 'Suivi Réclamations', category: 'Vente', icon: '⚠️' },

  // Finance
  { id: 'billing', label: 'Facturation & Recouvrement', category: 'Finance', icon: '💳' },
  { id: 'finance', label: 'Comptabilité', category: 'Finance', icon: '💵' },
  { id: 'treasury', label: 'Trésorerie & Effets', category: 'Finance', icon: '🏦' },
  { id: 'investment', label: 'Bourse & Investissements', category: 'Finance', icon: '💹' },
  { id: 'tej', label: 'Déclarations Fiscales TEJ', category: 'Finance', icon: '🏛️' },

  // Logistique & Terrain
  { id: 'mobile_fleet', label: 'Flotte Mobile & Suivi Terrain (MOD-11)', category: 'Logistique', icon: '📱' },
  { id: 'stock', label: 'Stocks & Fournisseurs', category: 'Logistique', icon: '📦' },
  { id: 'purchasing', label: 'Gestion Achats & Appro.', category: 'Logistique', icon: '🛒' },
  { id: 'production', label: 'Production & GPAO (TRS)', category: 'Logistique', icon: '⚙️' },
  { id: 'fleet', label: 'Gestion Parc Auto', category: 'Logistique', icon: '🚗' },
  { id: 'transit_logistique', label: 'Import/Export & Transit', category: 'Logistique', icon: '✈️' },
  { id: 'lc_manager', label: 'Lettre de Crédit (Crédoc)', category: 'Logistique', icon: '📜' },

  // Ressources
  { id: 'payroll', label: 'Gestion Paie & RH', category: 'Ressources', icon: '🧑‍🤝‍🧑' },
  { id: 'collaborators', label: 'Gestion des Collaborateurs', category: 'Ressources', icon: '👤' },
  { id: 'attendance', label: 'Pointage & Temps de Travail', category: 'Ressources', icon: '⏱️' },
  { id: 'ged', label: 'ED-GED & Justificatifs', category: 'Ressources', icon: '📁' },
  { id: 'asset', label: 'Immobilisations & Amortissements', category: 'Ressources', icon: '🏢' },

  // Opérations Stratégiques
  { id: 'cession', label: 'Cession d\'Entreprise', category: 'Opérations Stratégiques', icon: '🤝' },
  { id: 'juridique', label: 'Secrétariat Juridique', category: 'Opérations Stratégiques', icon: '⚖️' },

  // Système
  { id: 'company_settings', label: 'Paramètres de l\'Entreprise', category: 'Système', icon: '🛠️' },
];

interface CollaboratorConsoleProps {
  collaborators: CollaboratorAccount[];
  onUpdateCollaborators: (collabs: CollaboratorAccount[]) => void;
  currentUser?: UserSession | null;
  publisherClients?: any[];
  activeCompanyName?: string;
  isModuleUnlocked?: (tabId: string) => boolean;
  smtpSettings?: SmtpSettings;
  isTrial?: boolean;
  isDemoTenant?: boolean;
}

// 6 Collaborateurs Démo Normalisés (Mode Essai)
const TRIAL_DEMO_COLLABORATORS: Omit<CollaboratorAccount, 'company' | 'company_id' | 'companyId'>[] = [
  {
    id: 'demo-emp_2',
    name: 'Khaled Ben Amor',
    email: 'k.benamor@elyssa-erp.tn',
    role: 'Director',
    structureType: 'Direction',
    structureName: 'Finance & Recouvrement',
    status: 'Active',
    assignedModules: ['dashboard', 'finance', 'billing', 'treasury', 'reports', 'tej', 'investment', 'clients'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-01-15',
    assignedTasks: [
      { id: 'task_kba_1', title: 'Clôture mensuelle & Rapprochement bancaire', description: 'Valider les écritures comptables et le lettrage bancaire', dueDate: '2026-08-25', priority: 'High', status: 'In_Progress', createdDate: '2026-08-01' }
    ]
  },
  {
    id: 'demo-emp_3',
    name: 'Ines Dridi',
    email: 'i.dridi@elyssa-erp.tn',
    role: 'Agent',
    structureType: 'Service',
    structureName: 'Comptabilité & Rapprochement',
    status: 'Active',
    assignedModules: ['dashboard', 'finance', 'treasury', 'billing'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-03-10',
    assignedTasks: [
      { id: 'task_id_1', title: 'Pointage des relevés bancaires ATB & BIAT', description: 'Rapprochement des écritures du compte courant', dueDate: '2026-08-22', priority: 'Medium', status: 'In_Progress', createdDate: '2026-08-05' }
    ]
  },
  {
    id: 'demo-emp_4',
    name: 'Mohamed Ali Gharbi',
    email: 'm.gharbi@elyssa-erp.tn',
    role: 'Agent',
    structureType: 'Service',
    structureName: 'Force de Vente & Clientèle',
    status: 'Active',
    assignedModules: ['dashboard', 'clients', 'caisse', 'reports', 'communication', 'complaints'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-06-18',
    assignedTasks: [
      { id: 'task_mag_1', title: 'Prospection commerciale zone Sousse', description: 'Visite des clients grands comptes et saisie des bons de commande', dueDate: '2026-08-24', priority: 'High', status: 'In_Progress', createdDate: '2026-08-10' }
    ]
  },
  {
    id: 'demo-emp_5',
    name: 'Amel Ben Soltane',
    email: 'a.bensoltane@elyssa-erp.tn',
    role: 'Manager',
    structureType: 'Direction',
    structureName: 'Ressources Humaines & Paie',
    status: 'Active',
    assignedModules: ['dashboard', 'payroll', 'attendance', 'collaborators', 'ged'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-02-01',
    assignedTasks: [
      { id: 'task_abs_1', title: 'Préparation de la paie du mois & Déclaration CNSS', description: 'Vérification des fiches de paie et calcul des cotisations', dueDate: '2026-08-28', priority: 'High', status: 'Pending', createdDate: '2026-08-12' }
    ]
  },
  {
    id: 'demo-emp_6',
    name: 'Sami Mansour',
    email: 's.mansour@elyssa-erp.tn',
    role: 'Agent',
    structureType: 'Service',
    structureName: 'Direction & IT / Systèmes',
    status: 'Active',
    assignedModules: ['dashboard', 'company_settings', 'ged', 'steering', 'production'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-01-10',
    assignedTasks: [
      { id: 'task_sm_1', title: 'Maintenance et interconnexion API des terminaux mobiles', description: 'Vérification des logs de synchronisation et des accès', dueDate: '2026-08-26', priority: 'Medium', status: 'In_Progress', createdDate: '2026-08-08' }
    ]
  },
  {
    id: 'demo-emp_7',
    name: 'Hamza Ben Salem',
    email: 'h.bensalem@elyssa-erp.tn',
    role: 'Agent',
    structureType: 'Entrepôt',
    structureName: 'Logistique, Dispatch & Flotte',
    status: 'Active',
    assignedModules: ['dashboard', 'mobile_fleet', 'stock', 'fleet'],
    pinCode: '123456',
    plainPassword: '123',
    createdDate: '2026-02-15',
    assignedTasks: [
      { id: 'task_hbs_1', title: 'Tournée livraison Sud - Client Poulina (1 450 kg)', description: 'Livraison express GP1 Km 12 avec émargement du bon de livraison', dueDate: '2026-08-20', priority: 'High', status: 'In_Progress', createdDate: '2026-08-10' }
    ]
  }
];

export default function CollaboratorConsole({ 
  collaborators, 
  onUpdateCollaborators,
  currentUser,
  publisherClients = [],
  activeCompanyName,
  isModuleUnlocked,
  smtpSettings,
  isTrial,
  isDemoTenant
}: CollaboratorConsoleProps) {
  // Determine logged-in user's company and admin permissions
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const loggedInCollab = React.useMemo(() => {
    if (!currentUser || isSuperAdmin) return null;
    return collaborators.find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
  }, [collaborators, currentUser, isSuperAdmin]);

  const currentUserCompany = React.useMemo(() => {
    if (activeCompanyName) return activeCompanyName;
    if (!currentUser) return 'Inter-Affaires';
    if (currentUser.role === 'SuperAdmin') return 'Inter-Affaires';
    return loggedInCollab?.company || 'Inter-Affaires';
  }, [currentUser, loggedInCollab, activeCompanyName]);

  const isDemoTenantMode = React.useMemo(() => {
    return Boolean(
      isDemoTenant || 
      currentUserCompany === 'company_demo' || 
      currentUserCompany.toLowerCase().includes('démo') || 
      currentUserCompany.toLowerCase().includes('demo')
    );
  }, [isDemoTenant, currentUserCompany]);

  // Mode Démo : Forçage et injection automatique des 7 collaborateurs uniquement pour les tenants DÉMO
  useEffect(() => {
    if (isDemoTenantMode) {
      const tenantCollabs = collaborators.filter(c => {
        if (!c) return false;
        const comp = (c.company || c.company_id || c.companyId || '').trim().toLowerCase();
        return comp === currentUserCompany.toLowerCase() || comp === 'company_demo';
      });

      // Si le tenant démo ne contient que le créateur racine ou est vide (longueur <= 1)
      if (tenantCollabs.length <= 1) {
        const existingRoot = tenantCollabs[0] || collaborators.find(c => c.role === 'Manager' || c.role === 'DG') || collaborators[0];
        
        // 1. Compte Racine (Meriam Doudou / Créateur)
        const rootAdmin: CollaboratorAccount = {
          id: existingRoot?.id || 'demo-emp_1',
          name: existingRoot?.name && existingRoot.name !== 'admin' && existingRoot.name !== 'Root Admin' ? existingRoot.name : 'Meriam Doudou',
          email: existingRoot?.email || 'm.doudou@elyssa-erp.tn',
          role: 'Manager',
          structureType: existingRoot?.structureType || 'Direction',
          structureName: existingRoot?.structureName || 'Direction Générale',
          status: 'Active',
          company: currentUserCompany,
          company_id: currentUserCompany,
          companyId: currentUserCompany,
          assignedModules: AVAILABLE_MODULES.map(m => m.id),
          pinCode: existingRoot?.pinCode || '123456',
          plainPassword: existingRoot?.plainPassword || '123',
          createdDate: existingRoot?.createdDate || '2026-01-01',
          assignedTasks: (existingRoot?.assignedTasks && existingRoot.assignedTasks.length > 0) ? existingRoot.assignedTasks : [
            { id: 'task_md_1', title: 'Revue stratégique trimestrielle', description: 'Validation des KPIs et du rapport de gestion', dueDate: '2026-08-30', priority: 'High', status: 'In_Progress', createdDate: '2026-08-01' }
          ]
        };

        // 2. Les 6 Collaborateurs Démo
        const demo6Collabs: CollaboratorAccount[] = TRIAL_DEMO_COLLABORATORS.map(dc => ({
          ...dc,
          company: currentUserCompany,
          company_id: currentUserCompany,
          companyId: currentUserCompany
        }));

        // Fusion des 7 collaborateurs
        const complete7Collabs = [rootAdmin, ...demo6Collabs];

        // Conserver les collaborateurs d'autres tenants si existants
        const otherTenantsCollabs = collaborators.filter(c => {
          if (!c) return false;
          const comp = (c.company || c.company_id || c.companyId || '').trim().toLowerCase();
          return comp && comp !== currentUserCompany.toLowerCase();
        });

        const mergedAll = [...complete7Collabs, ...otherTenantsCollabs];

        onUpdateCollaborators(mergedAll);
        try {
          localStorage.setItem('carthage_collaborators', JSON.stringify(mergedAll));
          localStorage.setItem('elyssa_collaborators', JSON.stringify(mergedAll));
        } catch (e) {
          console.warn('Erreur sauvegarde localStorage collaborateurs :', e);
        }
      }
    }
  }, [isDemoTenantMode, currentUserCompany, collaborators, onUpdateCollaborators, publisherClients]);

  const getAssignableModules = React.useCallback((moduleList: typeof AVAILABLE_MODULES) => {
    // SuperAdmin or DG (Manager) gets access to ALL available operational modules
    if (isSuperAdmin || currentUser?.role === 'Manager' || loggedInCollab?.role === 'Manager') return moduleList;
    
    // Director gets only their own assignedModules to pass down to agents/viewers
    if (loggedInCollab?.role === 'Director') {
      const dirModules = loggedInCollab.assignedModules || [];
      return moduleList.filter(m => dirModules.includes(m.id));
    }
    
    // Fallback: Return unlocked modules or all modules for company
    return moduleList.filter(m => {
      if (isModuleUnlocked) {
        return isModuleUnlocked(m.id);
      }
      return true;
    });
  }, [loggedInCollab, isModuleUnlocked, isSuperAdmin, currentUser]);

  // Filters state for organizational structures & search
  const [structureTypeFilter, setStructureTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered list of collaborators (strictly for the active company e.g. Inter-Affaires)
  const displayedCollaborators = React.useMemo(() => {
    let list = collaborators.filter(c => {
      if (!c) return false;
      const isInterAffaires = currentUserCompany.toLowerCase() === 'inter-affaires' || currentUserCompany.toLowerCase() === 'elyssa entreprises s.a.';
      const emailLower = (c.email || '').toLowerCase().trim();
      const nameLower = (c.name || '').toLowerCase().trim();
      const idLower = (c.id || '').toLowerCase().trim();

      // En mode PROD (non-démo) : purge absolue de tout collaborateur démo
      if (!isDemoTenantMode) {
        if (
          idLower.startsWith('demo-') ||
          emailLower.endsWith('@elyssa-erp.tn') ||
          emailLower === 'm.doudou@elyssa-erp.tn' ||
          emailLower === 'k.benamor@elyssa-erp.tn' ||
          emailLower === 'i.dridi@elyssa-erp.tn' ||
          emailLower === 'm.gharbi@elyssa-erp.tn' ||
          emailLower === 'a.bensoltane@elyssa-erp.tn' ||
          emailLower === 's.mansour@elyssa-erp.tn' ||
          emailLower === 'h.bensalem@elyssa-erp.tn'
        ) {
          return false;
        }
      }

      if (isInterAffaires) {
        if (emailLower === 'bb@gmail.com' || emailLower === 'mondhali@gmail.com' || emailLower === 'ws@gmail.com') return false;
        if (emailLower === 'amel.m@elyssa.pro' || nameLower.includes('amel marzouki')) return false;
        if (emailLower === 'bochra.b@elyssa.pro' || nameLower.includes('bochra belkadhi')) return false;
        if (nameLower.includes('mohamed ben ali') || nameLower.includes('rim oueslati') || emailLower.includes('mohamed.a') || emailLower.includes('rim.o')) return false;
        if (emailLower === 'contact@elyssa.pro' && ((c.status as string) === 'Suspended' || (c.status as string) === 'SUSPENDU' || (c.id && c.id !== 'admin_root'))) return false;
        if (nameLower.includes('boch bej') || nameLower === 'gep' || nameLower.includes('wiem sahbani')) return false;
        if (c.id && c.id.includes('trial_owner')) return false;
      }
      const collabCompany = c.company ? c.company.trim() : '';
      if (collabCompany) {
        return collabCompany.toLowerCase() === currentUserCompany.toLowerCase();
      }
      if (c.company_id || c.companyId) {
        const cid = c.company_id || c.companyId;
        if (isInterAffaires) return cid === 'pc-parent-elyssa' || cid === 'pc-interaffaires';
        return false;
      }
      return isInterAffaires;
    });

    // Pyramidal Filtering:
    // If logged-in user is a Director (Niveau 2), they can ONLY see and manage Agents and Viewers (Niveau 3)
    if (loggedInCollab && loggedInCollab.role === 'Director') {
      list = list.filter(c => c.role === 'Agent' || c.role === 'Viewer');
    }

    // Filter by Structure Type if selected
    if (structureTypeFilter !== 'all') {
      list = list.filter(c => c.structureType === structureTypeFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.structureName && c.structureName.toLowerCase().includes(q))
      );
    }

    const seen = new Set<string>();
    return list.filter(c => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [collaborators, currentUserCompany, loggedInCollab, structureTypeFilter, searchQuery]);

  // Selected collaborator for details pane
  const [selectedCollabId, setSelectedCollabId] = useState<string>('');

  // Calculate task limit alert state
  const getTaskAlert = (task: CollaboratorTask) => {
    if (task.status === 'Completed') return null;
    if (!task.dueDate) return null;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parts = task.dueDate.split('-');
      if (parts.length !== 3) return null;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dueDate = new Date(year, month, day);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          type: 'overdue' as const,
          label: `Échue / Retard (${Math.abs(diffDays)} j)`,
          message: `La date de cette tâche est dépassée de ${Math.abs(diffDays)} jour(s) !`,
          colors: 'bg-rose-50 text-rose-800 border-rose-200',
          bgLight: 'bg-rose-50/30 border-rose-200 shadow-rose-50/10',
          badgeColors: 'bg-rose-600 text-white border-rose-700 font-extrabold'
        };
      } else if (diffDays === 0) {
        return {
          type: 'today' as const,
          label: "Aujourd'hui !",
          message: "Alerte : La date limite d'exécution est aujourd'hui !",
          colors: 'bg-amber-50 text-amber-800 border-amber-200',
          bgLight: 'bg-amber-50/20 border-amber-300 shadow-amber-50/10',
          badgeColors: 'bg-amber-550 text-white border-amber-600 font-extrabold'
        };
      } else if (diffDays <= 3) {
        return {
          type: 'soon' as const,
          label: `Sous ${diffDays} j`,
          message: `Échéance proche : il reste ${diffDays} jour(s) pour finaliser cette tâche.`,
          colors: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          bgLight: 'bg-indigo-50/10 border-indigo-200',
          badgeColors: 'bg-indigo-600 text-white font-extrabold'
        };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Creation Form States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Agent' | 'Manager' | 'Viewer' | 'Director'>('Agent');
  const [invitePassword, setInvitePassword] = useState('Elyssa2026!');
  const [invitePinCode, setInvitePinCode] = useState('123456');
  const [inviteStructureType, setInviteStructureType] = useState<'Direction' | 'Service' | 'Agence' | 'Succursale' | 'Entrepôt' | 'Usine'>('Direction');
  const [inviteStructureName, setInviteStructureName] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteModules, setInviteModules] = useState<string[]>(['dashboard', 'clients', 'reports', 'finance', 'stock']);

  // Custom confirmation modal states
  const [collabToDeleteId, setCollabToDeleteId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ collabId: string; taskId: string } | null>(null);

  // Sync inviteRole for Directors
  useEffect(() => {
    if (showInviteForm && loggedInCollab?.role === 'Director' && (inviteRole === 'Manager' || inviteRole === 'Director')) {
      setInviteRole('Agent');
    }
  }, [showInviteForm, loggedInCollab, inviteRole]);

  // New Task Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Credentials Update States
  const [collabNewPassword, setCollabNewPassword] = useState('');
  const [collabNewPinCode, setCollabNewPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPinCode, setShowPinCode] = useState(false);

  // Structure Update States inside Fiche Personnel
  const [editStructureType, setEditStructureType] = useState<'Direction' | 'Service' | 'Agence' | 'Succursale' | 'Entrepôt' | 'Usine'>('Direction');
  const [editStructureName, setEditStructureName] = useState('');

  // Make sure we have a valid selection
  useEffect(() => {
    if (displayedCollaborators.length > 0 && !displayedCollaborators.some(c => c.id === selectedCollabId)) {
      setSelectedCollabId(displayedCollaborators[0].id);
    }
  }, [displayedCollaborators, selectedCollabId]);

  const activeCollab = displayedCollaborators.find(c => c.id === selectedCollabId);

  // Reset credential form inputs when selection changes
  useEffect(() => {
    setShowPassword(false);
    setShowPinCode(false);
    setCollabNewPassword('');
    setCollabNewPinCode('');
    if (activeCollab) {
      setEditStructureType(activeCollab.structureType || 'Direction');
      setEditStructureName(activeCollab.structureName || '');
    }
  }, [selectedCollabId, activeCollab]);

  // Handle collaborator creation
  const handleInviteCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    if (collaborators.some(c => c.email.toLowerCase() === inviteEmail.toLowerCase())) {
      alert("Un collaborateur possède déjà cette adresse de messagerie.");
      return;
    }

    if (!/^\d{6}$/.test(invitePinCode)) {
      alert("Le code PIN du collaborateur doit être composé d'exactement 6 chiffres.");
      return;
    }

    let modules = inviteModules;
    if (inviteRole === 'Manager') {
      modules = AVAILABLE_MODULES.map(m => m.id);
    } else {
      const assignableIds = getAssignableModules(AVAILABLE_MODULES).map(m => m.id);
      modules = inviteModules.filter(id => assignableIds.includes(id));
    }

    const newCollab: CollaboratorAccount = {
      id: `collab_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      password: invitePassword || 'Elyssa2026!',
      plainPassword: invitePassword || 'Elyssa2026!',
      role: inviteRole,
      status: 'Active',
      assignedTasks: [],
      createdDate: new Date().toISOString().split('T')[0],
      company: currentUserCompany,
      assignedModules: modules,
      pinCode: invitePinCode,
      structureType: inviteStructureType,
      structureName: inviteStructureName || `${inviteStructureType} Principale`
    };

    if (smtpSettings && smtpSettings.isEnabled) {
      const emailSubject = `Compte Collaborateur Elyssa ERP - ${currentUserCompany}`;
      const emailBody = `Bonjour ${inviteName},

Votre compte collaborateur pour l'entreprise **${currentUserCompany}** sur l'ERP **Elyssa ERP** a été créé avec succès.

Voici vos identifiants d'accès :
- **Adresse e-mail** : ${inviteEmail}
- **Mot de passe de connexion** : ${invitePassword || 'Elyssa2026!'}
- **Code PIN d'accès individuel** : ${invitePinCode}
- **Rattachement** : ${inviteStructureType} - ${inviteStructureName || 'Principale'}

Vous pouvez vous connecter pour accéder à vos modules autorisés.

Cordialement,
L'administration Elyssa ERP`;

      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpSettings,
          recipientName: inviteName,
          recipientEmail: inviteEmail,
          subject: emailSubject,
          body: emailBody,
          templateType: 'invitation'
        })
      })
      .then(res => res.json())
      .catch(err => console.error("Erreur réseau envoi email :", err));
    }

    const updated = [...collaborators, newCollab];
    onUpdateCollaborators(updated);
    setInviteName('');
    setInviteEmail('');
    setInvitePassword('Elyssa2026!');
    setInvitePinCode('123456');
    setInviteRole('Agent');
    setInviteStructureName('');
    setInviteModules(['dashboard', 'clients', 'reports', 'finance', 'stock']);
    setShowInviteForm(false);
    setSelectedCollabId(newCollab.id);
  };

  // Toggle status cycling: Active -> Suspended -> Active...
  const cycleStatus = (collabId: string) => {
    onUpdateCollaborators(collaborators.map(c => {
      if (c.id === collabId) {
        const nextStatus: 'Active' | 'Suspended' = (c.status === 'Active' || c.status === 'Invited') ? 'Suspended' : 'Active';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const toggleModule = (collabId: string, moduleId: string) => {
    const assignableIds = getAssignableModules(AVAILABLE_MODULES).map(m => m.id);
    if (!assignableIds.includes(moduleId)) {
      alert("Vous n'êtes pas autorisé à affecter ce module.");
      return;
    }

    onUpdateCollaborators(collaborators.map(c => {
      if (c.id === collabId) {
        const currentModules = c.assignedModules || [];
        let nextModules: string[];
        if (currentModules.includes(moduleId)) {
          nextModules = currentModules.filter(m => m !== moduleId);
        } else {
          nextModules = [...currentModules, moduleId];
        }
        return {
          ...c,
          assignedModules: nextModules
        };
      }
      return c;
    }));
  };

  const confirmDeleteCollaborator = async (collabId: string) => {
    const filtered = collaborators.filter(c => c.id !== collabId);
    
    // Explicit server-side deletion from Firestore & database
    try {
      await fetch('/api/db/admin/delete-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: collabId })
      });
    } catch (err) {
      console.warn("API delete-collaborator error:", err);
    }

    onUpdateCollaborators(filtered);
    if (selectedCollabId === collabId && filtered.length > 0) {
      setSelectedCollabId(filtered[0].id);
    }
    setCollabToDeleteId(null);
  };

  const handleDeleteCollaborator = (collabId: string) => {
    setCollabToDeleteId(collabId);
  };

  const confirmDeleteTask = (collabId: string, taskId: string) => {
    onUpdateCollaborators(collaborators.map(c => {
      if (c.id === collabId) {
        return {
          ...c,
          assignedTasks: c.assignedTasks.filter(t => t.id !== taskId)
        };
      }
      return c;
    }));
    setTaskToDelete(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedCollabId) return;

    const newTask: CollaboratorTask = {
      id: `task_${Date.now()}`,
      title: taskTitle,
      description: taskDesc,
      dueDate: taskDueDate || new Date().toISOString().split('T')[0],
      priority: taskPriority,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    onUpdateCollaborators(collaborators.map(c => {
      if (c.id === selectedCollabId) {
        return {
          ...c,
          assignedTasks: [...c.assignedTasks, newTask]
        };
      }
      return c;
    }));

    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskPriority('Medium');
    setShowTaskForm(false);
  };

  const toggleTaskStatus = (collabId: string, taskId: string) => {
    onUpdateCollaborators(collaborators.map(c => {
      if (c.id === collabId) {
        const updatedTasks = c.assignedTasks.map(t => {
          if (t.id === taskId) {
            let nextTaskStatus: 'Pending' | 'In_Progress' | 'Completed' = 'In_Progress';
            if (t.status === 'Pending') nextTaskStatus = 'In_Progress';
            else if (t.status === 'In_Progress') nextTaskStatus = 'Completed';
            else if (t.status === 'Completed') nextTaskStatus = 'Pending';
            return { ...t, status: nextTaskStatus };
          }
          return t;
        });
        return { ...c, assignedTasks: updatedTasks };
      }
      return c;
    }));
  };

  const handleDeleteTask = (collabId: string, taskId: string) => {
    setTaskToDelete({ collabId, taskId });
  };

  // Group modules by category for clean UI organization
  const groupedModules = React.useMemo(() => {
    const map = new Map<string, typeof AVAILABLE_MODULES>();
    const assignable = getAssignableModules(AVAILABLE_MODULES);
    assignable.forEach(m => {
      const list = map.get(m.category) || [];
      list.push(m);
      map.set(m.category, list);
    });
    return Array.from(map.entries());
  }, [getAssignableModules]);

  return (
    <div className="space-y-6">
      
      {/* Visual Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-indigo-900/60 p-4 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider">Effectif {currentUserCompany}</span>
            <div className="text-2xl font-black text-white mt-1">{displayedCollaborators.length}</div>
          </div>
          <div className="w-10 h-10 bg-indigo-950 border border-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/60 p-4 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">Comptes Actifs</span>
            <div className="text-2xl font-black text-white mt-1">
              {displayedCollaborators.filter(c => c.status === 'Active' || c.status === 'ACTIF' || c.status === 'Invited').length}
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-950 border border-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/60 p-4 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Comptes Suspendus</span>
            <div className="text-2xl font-black text-white mt-1">
              {displayedCollaborators.filter(c => (c.status as string) === 'Suspended' || (c.status as string) === 'SUSPENDU').length}
            </div>
          </div>
          <div className="w-10 h-10 bg-amber-950 border border-amber-900/50 rounded-lg flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tâches en Cours</span>
            <div className="text-2xl font-black text-white mt-1">
              {displayedCollaborators.reduce((sum, c) => sum + (c.assignedTasks ? c.assignedTasks.filter(t => t.status !== 'Completed').length : 0), 0)}
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Left Side: Collaborator Accounts & Structural Filters */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-[12px] uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Collaborateurs de {currentUserCompany}</span>
            </h3>
            
            <button 
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="p-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg flex items-center space-x-1 transition border border-indigo-100"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nouveau Collaborateur</span>
            </button>
          </div>

          {/* Filters by Structural Unit & Search */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-indigo-600" /> Filtrer par Structure :</span>
              <span className="text-indigo-600">{displayedCollaborators.length} affiché(s)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={structureTypeFilter}
                onChange={(e) => setStructureTypeFilter(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold text-[11px]"
              >
                <option value="all">🏢 Toutes les structures</option>
                <option value="Direction">📍 Direction</option>
                <option value="Service">🏢 Service</option>
                <option value="Agence">🏢 Agence</option>
                <option value="Succursale">🏬 Succursale</option>
                <option value="Entrepôt">📦 Entrepôt</option>
                <option value="Usine">🏭 Usine</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-1.5 pl-7 border border-slate-200 rounded-lg w-full bg-white text-slate-700 font-medium text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Creation Form Accordion */}
          {showInviteForm && (
            <form onSubmit={handleInviteCollaborator} className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-150 space-y-3">
              <span className="font-bold text-indigo-900 block border-b border-indigo-150 pb-1.5 text-[11px] uppercase tracking-wider">
                Ajouter un Collaborateur de l'Entreprise
              </span>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Nom complet :</label>
                  <input 
                    type="text" 
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: Med Amine Ben Slimane"
                    className="p-2 border bg-white rounded-lg w-full text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Adresse email d'accès :</label>
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Ex: a.benslimane@elyssa.pro"
                    className="p-2 border bg-white rounded-lg w-full font-mono text-[11px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Structure Rattachée :</label>
                    <select 
                      value={inviteStructureType}
                      onChange={(e) => setInviteStructureType(e.target.value as any)}
                      className="p-2 border bg-white rounded-lg w-full text-xs font-semibold"
                    >
                      <option value="Direction">📍 Direction</option>
                      <option value="Service">🏢 Service</option>
                      <option value="Agence">🏢 Agence</option>
                      <option value="Succursale">🏬 Succursale</option>
                      <option value="Entrepôt">📦 Entrepôt</option>
                      <option value="Usine">🏭 Usine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Intitulé de la Structure :</label>
                    <input 
                      type="text" 
                      value={inviteStructureName}
                      onChange={(e) => setInviteStructureName(e.target.value)}
                      placeholder="Ex: Direction Financière, Usine 1"
                      className="p-2 border bg-white rounded-lg w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Habilitation & Rôle :</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="p-2 border bg-white rounded-lg w-full text-xs"
                  >
                    {loggedInCollab?.role === 'Director' ? (
                      <>
                        <option value="Agent">Niveau 3 - Agent / Collaborateur Opérationnel</option>
                        <option value="Viewer">Niveau 3 - Consultant / Auditeur externe (Lecture Seule)</option>
                      </>
                    ) : (
                      <>
                        <option value="Manager">Niveau 1 - Directeur Général (DG) - Manager Absolu</option>
                        <option value="Director">Niveau 2 - Directeur de Direction / Responsable</option>
                        <option value="Agent">Niveau 3 - Agent / Collaborateur Opérationnel</option>
                        <option value="Viewer">Niveau 3 - Consultant / Auditeur externe (Lecture Seule)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-indigo-100">
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Mot de Passe Connexion :</label>
                    <input 
                      type="text"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      className="p-1.5 border bg-slate-50 rounded w-full font-mono text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Code PIN (6 chiffres) :</label>
                    <input 
                      type="text" 
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={invitePinCode}
                      onChange={(e) => setInvitePinCode(e.target.value.replace(/\D/g, ''))}
                      className="p-1.5 border bg-slate-50 rounded w-full font-mono font-bold text-center tracking-widest text-xs"
                      required
                    />
                  </div>
                </div>

                {inviteRole !== 'Manager' && (
                  <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-indigo-100">
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                      Affecter des Modules Opérationnels ({inviteModules.length} sélectionné(s)) :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {getAssignableModules(AVAILABLE_MODULES).map(module => {
                        const isChecked = inviteModules.includes(module.id);
                        return (
                          <label key={module.id} className="flex items-center space-x-1.5 cursor-pointer text-[11px] p-1 rounded hover:bg-slate-50">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setInviteModules(inviteModules.filter(m => m !== module.id));
                                } else {
                                  setInviteModules([...inviteModules, module.id]);
                                }
                              }}
                              className="rounded text-indigo-600 border-slate-300 w-3.5 h-3.5"
                            />
                            <span className="font-semibold text-slate-700 truncate">{module.icon} {module.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-indigo-150">
                <button 
                  type="button" 
                  onClick={() => setShowInviteForm(false)}
                  className="font-bold text-slate-500 hover:text-slate-800 p-1 px-3 rounded hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer le Collaborateur</span>
                </button>
              </div>
            </form>
          )}

          {/* Collaborators Compact Datagrid (1 line = 1 collaborator) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Registre du Personnel ({displayedCollaborators.length})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold">1 ligne = 1 collaborateur</span>
            </div>

            <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" id="table-collaborators-datagrid">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-600 uppercase text-[9.5px] font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Matricule / ID</th>
                    <th className="py-2.5 px-3">Collaborateur (Nom & Fonction)</th>
                    <th className="py-2.5 px-3">Pôle / Structure</th>
                    <th className="py-2.5 px-3">Rôle / Profil</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium">
                  {displayedCollaborators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        Aucun collaborateur trouvé pour cette recherche.
                      </td>
                    </tr>
                  ) : (
                    displayedCollaborators.map(c => {
                      const isSelected = c.id === selectedCollabId;
                      const isAccountActive = c.status === 'Active' || c.status === 'Invited';
                      const completedCollabTasks = c.assignedTasks.filter(t => t.status === 'Completed').length;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCollabId(c.id)}
                          className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-50/80 font-semibold border-l-4 border-l-indigo-600' : ''
                          }`}
                        >
                          {/* Matricule / ID */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px] whitespace-nowrap">
                            {c.id.substring(0, 10)}
                          </td>

                          {/* Collaborateur (Nom & Email/Fonction) */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-[12px]">{c.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">{c.email}</span>
                            </div>
                          </td>

                          {/* Pôle / Structure */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-tight">
                              <Building2 className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{c.structureType || 'Pôle'} : {c.structureName || 'Principal'}</span>
                            </span>
                          </td>

                          {/* Rôle / Profil */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${
                              c.role === 'Manager'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : c.role === 'Director'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : c.role === 'Agent'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              <Shield className="w-2.5 h-2.5" />
                              {c.role === 'Manager' ? 'DG' : c.role === 'Director' ? 'Directeur' : c.role === 'Agent' ? 'Agent' : 'Consultant'}
                            </span>
                          </td>

                          {/* Statut (Actif / Suspendu) */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); cycleStatus(c.id); }}
                              title="Cliquer pour basculer le statut"
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-black text-[9.5px] uppercase tracking-wider transition cursor-pointer hover:opacity-85 border ${
                                isAccountActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : 'bg-rose-50 text-rose-700 border-rose-250'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAccountActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {isAccountActive ? 'Actif' : 'Suspendu'}
                            </button>
                          </td>

                          {/* Actions (Éditer / Supprimer / Accès) */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded" title={`${completedCollabTasks}/${c.assignedTasks.length} tâches terminées`}>
                                {completedCollabTasks}/{c.assignedTasks.length} T
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedCollabId(c.id); }}
                                className="p-1 hover:bg-indigo-100 text-indigo-600 rounded cursor-pointer transition"
                                title="Voir la fiche et gérer les accès"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteCollaborator(c.id); }}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition"
                                title="Supprimer ce collaborateur"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Detailed View, Fiche Personnel, Credentials & Full Modules Matrix */}
        <div className="lg:col-span-7 space-y-6">
          
          {activeCollab ? (
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-5">
              
              {/* Profile Card Header */}
              <div className="bg-slate-50 rounded-xl border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider bg-white rounded border border-slate-250 p-1 px-2.5">
                      Fiche Personnel - {currentUserCompany}
                    </span>
                    <span className="text-[11px] text-slate-400">Créé le {activeCollab.createdDate}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 font-display mt-1">
                    {activeCollab.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      {activeCollab.email}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                      🏢 {activeCollab.structureType || 'Direction'} : {activeCollab.structureName || 'Principale'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-3 bg-white p-2 border rounded-xl shadow-xs">
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase block text-slate-400 tracking-wider">Taux de Complétion</span>
                    <strong className="text-xs font-black text-slate-850">
                      {activeCollab.assignedTasks.length > 0 
                        ? `${Math.round((activeCollab.assignedTasks.filter(t => t.status === 'Completed').length / activeCollab.assignedTasks.length) * 100)}%`
                        : '0%'}
                    </strong>
                  </div>
                  <div className="w-1.5 h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 rounded-full" 
                      style={{ 
                        height: activeCollab.assignedTasks.length > 0 
                          ? `${(activeCollab.assignedTasks.filter(t => t.status === 'Completed').length / activeCollab.assignedTasks.length) * 100}%` 
                          : '0%',
                        width: '100%'
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Structural Assignment Section */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-700">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Affectation Structurelle & Organisationnelle</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Type de Structure :</label>
                    <select
                      value={editStructureType}
                      onChange={(e) => setEditStructureType(e.target.value as any)}
                      className="p-1.5 border bg-white rounded-lg w-full text-xs font-semibold text-slate-800"
                    >
                      <option value="Direction">📍 Direction</option>
                      <option value="Service">🏢 Service</option>
                      <option value="Agence">🏢 Agence</option>
                      <option value="Succursale">🏬 Succursale</option>
                      <option value="Entrepôt">📦 Entrepôt</option>
                      <option value="Usine">🏭 Usine</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Intitulé de la Structure / Service :</label>
                    <input 
                      type="text"
                      value={editStructureName}
                      onChange={(e) => setEditStructureName(e.target.value)}
                      placeholder="Ex: Direction Financière, Usine Bizerte"
                      className="p-1.5 border bg-white rounded-lg w-full text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button 
                      type="button"
                      onClick={() => {
                        onUpdateCollaborators(collaborators.map(c => {
                          if (c.id === activeCollab.id) {
                            return { 
                              ...c, 
                              structureType: editStructureType,
                              structureName: editStructureName || `${editStructureType} Principale`
                            };
                          }
                          return c;
                        }));
                        alert(`Rattachement mis à jour avec succès pour ${activeCollab.name}.`);
                      }}
                      className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition w-full shadow-xs"
                    >
                      Mettre à jour
                    </button>
                  </div>
                </div>
              </div>

              {/* Credentials & Access Management Section */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-700">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Identifiants de Connexion & Sécurité</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Email */}
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-500">Adresse e-mail (Identifiant) :</span>
                    <div className="p-2 border rounded-lg bg-slate-100 font-mono text-[11px] text-slate-650 font-semibold truncate select-all">
                      {activeCollab.email}
                    </div>
                  </div>
                  
                  {/* Password Display */}
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-500">Mot de Passe Actuel :</span>
                    <div className="p-2 border rounded-lg bg-slate-100 font-mono text-[11px] text-slate-750 font-bold flex items-center justify-between">
                      <span>{showPassword ? (activeCollab.password || activeCollab.plainPassword || 'Elyssa2026!') : '••••••••'}</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-slate-750 p-1 rounded transition-colors"
                        title={showPassword ? "Masquer" : "Afficher"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 inline" /> : <Eye className="w-3.5 h-3.5 inline" />}
                      </button>
                    </div>
                  </div>

                  {/* PIN Display */}
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-500">Code PIN d'Accès (6 chiffres) :</span>
                    <div className="p-2 border rounded-lg bg-slate-100 font-mono text-[11px] text-slate-750 font-bold flex items-center justify-between">
                      <span>{showPinCode ? (activeCollab.pinCode || '123456') : '••••••'}</span>
                      <button
                        type="button"
                        onClick={() => setShowPinCode(!showPinCode)}
                        className="text-slate-500 hover:text-slate-750 p-1 rounded transition-colors"
                        title={showPinCode ? "Masquer" : "Afficher"}
                      >
                        {showPinCode ? <EyeOff className="w-3.5 h-3.5 inline" /> : <Eye className="w-3.5 h-3.5 inline" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Independent Password & PIN Update Forms */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Change Password Form */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-extrabold text-slate-700 uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-600" /> Modification du Mot de Passe :
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nouveau mot de passe"
                        value={collabNewPassword}
                        onChange={(e) => setCollabNewPassword(e.target.value)}
                        className="p-1.5 border bg-slate-50 rounded-lg w-full text-xs font-semibold focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!collabNewPassword.trim()) {
                            alert("Veuillez saisir un mot de passe valide.");
                            return;
                          }
                          onUpdateCollaborators(collaborators.map(c => {
                            if (c.id === activeCollab.id) {
                              return { ...c, password: collabNewPassword.trim(), plainPassword: collabNewPassword.trim() };
                            }
                            return c;
                          }));
                          setCollabNewPassword('');
                          alert(`Mot de passe mis à jour avec succès pour ${activeCollab.name}.`);
                        }}
                        className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition whitespace-nowrap shrink-0 shadow-xs"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>

                  {/* Change PIN Form */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-extrabold text-slate-700 uppercase flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-amber-600" /> Modification du Code PIN (6 chiffres) :
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="ex: 654321"
                        value={collabNewPinCode}
                        onChange={(e) => setCollabNewPinCode(e.target.value.replace(/\D/g, ''))}
                        className="p-1.5 border bg-slate-50 rounded-lg w-full text-xs font-mono font-bold text-center tracking-widest text-slate-800"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!/^\d{6}$/.test(collabNewPinCode.trim())) {
                            alert("Le code PIN doit être composé d'exactement 6 chiffres.");
                            return;
                          }
                          onUpdateCollaborators(collaborators.map(c => {
                            if (c.id === activeCollab.id) {
                              return { ...c, pinCode: collabNewPinCode.trim() };
                            }
                            return c;
                          }));
                          setCollabNewPinCode('');
                          alert(`Code PIN mis à jour avec succès pour ${activeCollab.name}.`);
                        }}
                        className="p-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs transition whitespace-nowrap shrink-0 shadow-xs"
                      >
                        Enregistrer PIN
                      </button>
                    </div>
                  </div>

                </div>

                {/* Licence Mobile & PWA Terrain (MOD-11) Toggle */}
                <div className="pt-3 border-t border-slate-200">
                  <MobileAccessToggle
                    userId={activeCollab.id}
                    userName={activeCollab.name}
                    tenantId={currentUserCompany}
                    hasMobileAccess={Boolean((activeCollab as any).hasMobileAccess)}
                    onToggleChange={(newVal) => {
                      onUpdateCollaborators(collaborators.map(c => {
                        if (c.id === activeCollab.id) {
                          return { ...c, hasMobileAccess: newVal } as any;
                        }
                        return c;
                      }));
                    }}
                  />
                </div>
              </div>

              {/* All Operational Modules Assignment Section */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-2 text-indigo-700">
                    <Shield className="w-4 h-4 shrink-0" />
                    <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                      Modules Opérationnels Affectés (Tous les modules Elyssa ERP)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-white p-1 px-2.5 rounded-lg border">
                    {activeCollab.role === 'Manager' 
                      ? "Accès Absolu (DG)" 
                      : `${(activeCollab.assignedModules || []).length} / ${getAssignableModules(AVAILABLE_MODULES).length} module(s) actif(s)`}
                  </span>
                </div>

                {activeCollab.role === 'Manager' ? (
                  <p className="text-slate-600 italic text-[11px] bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 leading-relaxed">
                    💡 En tant que <strong>Directeur Général / Manager Absolu (DG)</strong>, ce collaborateur dispose automatiquement d'un accès intégral et sans restriction à l'ensemble des 29 modules d'exploitation souscrits par {currentUserCompany}.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-[11.5px]">
                      Cochez les modules opérationnels spécifiques auxquels ce collaborateur est autorisé à accéder :
                    </p>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                      {groupedModules.map(([category, modules]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center justify-between">
                            <span>{category}</span>
                            <span className="text-slate-400 font-normal">({modules.length} module{modules.length > 1 ? 's' : ''})</span>
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modules.map(module => {
                              const currentModules = activeCollab.assignedModules || [];
                              const isChecked = currentModules.includes(module.id);
                              return (
                                <label 
                                  key={module.id} 
                                  className={`flex items-center space-x-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    isChecked 
                                      ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => toggleModule(activeCollab.id, module.id)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 shrink-0"
                                  />
                                  <div className="flex items-center space-x-2 select-none min-w-0 flex-1">
                                    <span className="text-base shrink-0">{module.icon}</span>
                                    <div className="truncate">
                                      <span className="font-bold text-slate-800 block leading-tight text-xs truncate">{module.label}</span>
                                      <span className="text-[9px] font-mono text-slate-400 block tracking-wider uppercase font-semibold">{module.category}</span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks Tracking Pane */}
              <div className="space-y-3.5">
                
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>Tâches Spécifiques Assignées ({activeCollab.assignedTasks.length})</span>
                  </h4>

                  <button
                    onClick={() => setShowTaskForm(!showTaskForm)}
                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold rounded-lg flex items-center space-x-1 transition border border-emerald-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-650" />
                    <span>Créer une Tâche par Collaborateur</span>
                  </button>
                </div>

                {/* Create Task Form */}
                {showTaskForm && (
                  <form onSubmit={handleCreateTask} className="bg-emerald-50/45 p-4 rounded-xl border border-emerald-150 space-y-3">
                    <span className="font-black text-emerald-900 block text-[11px] uppercase tracking-wider border-b border-emerald-150 pb-1">
                      Nouvelle Tâche Dédiée pour {activeCollab.name}
                    </span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Intitulé de la Tâche :</label>
                        <input 
                          type="text" 
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="Ex: Récupérer l'attestation de retenue Poulina"
                          className="p-2 border bg-white rounded-lg w-full text-xs"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Description et consignes :</label>
                        <textarea 
                          rows={2}
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          placeholder="Consignes détaillées pour le collaborateur de terrain..."
                          className="p-2 border bg-white rounded-lg w-full text-xs focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Date limite d'exécution :</label>
                          <input 
                            type="date" 
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="p-2 border bg-white rounded-lg w-full font-sans text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Niveau de Priorité :</label>
                          <select 
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                            className="p-2 border bg-white rounded-lg w-full text-xs"
                          >
                            <option value="High">Haute (Critique)</option>
                            <option value="Medium">Moyenne (Standard)</option>
                            <option value="Low">Basse (Secondaire)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-emerald-150">
                      <button 
                        type="button" 
                        onClick={() => setShowTaskForm(false)}
                        className="font-bold text-slate-500 hover:text-slate-800 p-1 px-2.5 rounded hover:bg-slate-100 text-xs"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        className="p-1 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition text-xs shadow-xs"
                      >
                        Enregistrer et Assigner la Tâche
                      </button>
                    </div>
                  </form>
                )}

                {/* Assigned Tasks Cards */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {activeCollab.assignedTasks.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 bg-emerald-50 p-1 rounded-full mb-2" />
                      <span className="font-bold text-slate-700 block text-xs">Aucune tâche assignée</span>
                      <p className="text-[10px] text-slate-400 mt-1">Créez votre première tâche personnalisée ci-dessus pour lui déléguer des missions.</p>
                    </div>
                  ) : (
                    activeCollab.assignedTasks.map(task => {
                      const alert = getTaskAlert(task);
                      return (
                        <div 
                          key={task.id} 
                          className={`hover:bg-slate-100/80 border rounded-xl p-3.5 transition flex flex-col justify-between gap-3 ${
                            alert 
                              ? `${alert.bgLight} border-2 shadow-xs` 
                              : 'bg-slate-50/50 border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`p-0.5 px-2 rounded font-black text-[9px] tracking-wider uppercase border inline-block ${
                                  task.priority === 'High' 
                                    ? 'bg-red-50 text-red-750 border-red-200' 
                                    : task.priority === 'Medium' 
                                      ? 'bg-yellow-50 text-yellow-800 border-yellow-200' 
                                      : 'bg-slate-100 text-slate-650 border-slate-250'
                                }`}>
                                  Priorité : {task.priority === 'High' ? 'Haute' : task.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                                </span>

                                <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>Limite : {task.dueDate}</span>
                                </span>

                                {alert && (
                                  <span className={`p-0.5 px-2 rounded font-black text-[9px] tracking-wider uppercase border inline-flex items-center space-x-1 animate-pulse shadow-xs ${alert.badgeColors}`}>
                                    <Bell className="w-2.5 h-2.5 text-white shrink-0 animate-bounce" />
                                    <span>{alert.label}</span>
                                  </span>
                                )}
                              </div>

                              <strong className="text-slate-900 text-[12px] block font-extrabold mt-1">
                                {task.title}
                              </strong>

                              {task.description && (
                                <p className="text-[11px] text-slate-500 leading-relaxed bg-white border border-slate-200 p-2 rounded-lg mt-1 font-medium">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleTaskStatus(activeCollab.id, task.id)}
                                title="Changer l'état d'avancement"
                                className={`inline-flex items-center gap-1.5 p-1 px-3 rounded-xl font-bold text-[10px] transition cursor-pointer hover:opacity-90 border ${
                                  task.status === 'Completed' 
                                    ? 'bg-emerald-60 text-emerald-800 border-emerald-300' 
                                    : task.status === 'In_Progress' 
                                      ? 'bg-indigo-60 text-indigo-800 border-indigo-200 animate-pulse' 
                                      : 'bg-slate-100 text-slate-600 border-slate-250'
                                }`}
                              >
                                {task.status === 'Completed' ? (
                                  <>
                                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Terminé</span>
                                  </>
                                ) : task.status === 'In_Progress' ? (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>En Cours</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 text-slate-450" />
                                    <span>En Attente</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(activeCollab.id, task.id)}
                                className="text-slate-400 hover:text-red-650 p-1 rounded-md transition hover:bg-red-50"
                                title="Supprimer cette tâche"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-220 p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <h4 className="font-extrabold text-slate-700">Aucun collaborateur sélectionné</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Veuillez cliquer sur l'un de vos collaborateurs dans la liste de gauche pour afficher et éditer sa fiche.</p>
            </div>
          )}

        </div>

      </div>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION DE COLLABORATEUR */}
      {collabToDeleteId && (() => {
        const collab = collaborators.find(c => c.id === collabToDeleteId);
        if (!collab) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
            <div className="bg-slate-900 border border-red-900/40 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 relative [box-shadow:0_0_50px_rgba(239,68,68,0.15)] text-left">
              <button
                type="button"
                onClick={() => setCollabToDeleteId(null)}
                className="absolute top-4 right-4 text-slate-450 hover:text-white transition font-sans text-xs uppercase font-extrabold cursor-pointer hover:bg-slate-800 px-2 py-1 rounded"
              >
                Fermer ✕
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-950/40 border border-red-900/55 text-red-400 rounded-2xl flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <span className="bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest inline-block font-mono">
                    SUPPRESSION COLLABORATEUR
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Supprimer le collaborateur ?</h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed font-sans">
                    Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de <strong className="text-white">{collab.name}</strong> ?
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1 font-mono text-[9px] text-slate-400">
                <p>Nom / Prénom : <strong className="text-slate-300 font-sans">{collab.name}</strong></p>
                <p>Email d'accès : <strong className="text-indigo-400 font-sans font-bold">{collab.email}</strong></p>
                <p>Structure : <strong className="text-slate-300 font-sans">{collab.structureType || 'Direction'} - {collab.structureName || 'Principale'}</strong></p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCollabToDeleteId(null)}
                  className="w-1/2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteCollaborator(collabToDeleteId)}
                  className="w-1/2 bg-rose-650 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border-0"
                >
                  <Trash2 className="w-4 h-4 text-rose-300" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION DE TÂCHE */}
      {taskToDelete && (() => {
        const collab = collaborators.find(c => c.id === taskToDelete.collabId);
        const task = collab?.assignedTasks.find(t => t.id === taskToDelete.taskId);
        if (!task) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
            <div className="bg-slate-900 border border-red-900/40 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 relative [box-shadow:0_0_50px_rgba(239,68,68,0.15)] text-left">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="absolute top-4 right-4 text-slate-450 hover:text-white transition font-sans text-xs uppercase font-extrabold cursor-pointer hover:bg-slate-800 px-2 py-1 rounded"
              >
                Fermer ✕
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-950/40 border border-red-900/55 text-red-400 rounded-2xl flex-shrink-0">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest inline-block font-mono">
                    SUPPRESSION TÂCHE
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Supprimer cette tâche ?</h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed font-sans">
                    Voulez-vous vraiment retirer la tâche <strong className="text-white">"{task.title}"</strong> assignée à <strong className="text-white">{collab?.name}</strong> ?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="w-1/2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer"
                >
                  Garder la tâche
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteTask(taskToDelete.collabId, taskToDelete.taskId)}
                  className="w-1/2 bg-rose-650 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border-0"
                >
                  <Trash2 className="w-4 h-4 text-rose-300" />
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
