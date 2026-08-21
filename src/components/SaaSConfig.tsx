/**
 * @license
 * Carthage CRM & ERP SaaS Module Router and Client License Engine
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { loadSaaSBankConfig, saveSaaSBankConfig, deleteCompanyFromDb } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import SaaSInvoiceModal from './SaaSInvoiceModal';
import EvaluationGuideComponent from './EvaluationGuideComponent';
import { ConfirmationModal } from './ConfirmationModal';
import { activateClientPack, SaasPackType } from '../services/licensingService';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock,
  Lock, 
  Unlock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  ShoppingBag,
  Info,
  Building2,
  Check,
  Building,
  Plus,
  Trash2,
  Search,
  Key,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  TrendingUp,
  Coins,
  Activity,
  Mail,
  LayoutDashboard,
  ShoppingCart,
  Printer,
  ThumbsUp,
  BookOpen,
  Zap,
  AlertTriangle,
  Bell,
  Ban,
  LayoutGrid,
  ListFilter,
  Package,
  Eye
} from 'lucide-react';

interface ModuleMetadata {
  id: string;
  name: string;
  category: string;
  desc: string;
  price: number; // TND/month
}

export const ALL_MODULES_METADATA: ModuleMetadata[] = [
  // 1. PILOTAGE & PERFORMANCE
  { id: 'executive_dashboard', name: 'Tableau de Bord Décisionnel', category: 'PILOTAGE & PERFORMANCE', desc: 'Analytique globale, KPIs d\'entreprise, indicateurs de rentabilité et tableaux de bord d\'aide à la décision.', price: 15 },
  { id: 'copilot', name: 'Assistant IA & Copilot', category: 'PILOTAGE & PERFORMANCE', desc: 'Assistant IA conversationnel, synthèses BI automatisées, prédictions d\'activité et conseils stratégiques.', price: 25 },
  { id: 'steering', name: 'Objectifs & Pilotage', category: 'PILOTAGE & PERFORMANCE', desc: 'Saisie des objectifs trimestriels, indicateurs de rentabilité commerciale et alertes d\'écart.', price: 15 },
  { id: 'business_plan', name: 'Business Plan Stratégique', category: 'PILOTAGE & PERFORMANCE', desc: 'Simulateur interactif de viabilité financière, compte de résultat sur 5 ans et seuil de rentabilité.', price: 20 },
  { id: 'market', name: 'Études & Opportunités', category: 'PILOTAGE & PERFORMANCE', desc: 'Données analytiques de veille concurrentielle, étude de marché et opportunités d\'investissement.', price: 15 },
  { id: 'dashboard', name: 'Console Launchpad Grid', category: 'PILOTAGE & PERFORMANCE', desc: 'Vue synthétique des raccourcis d\'applications et indicateurs clés rapides.', price: 0 },

  // 2. ACTIVITÉ COMMERCIALE & CRM
  { id: 'caisse', name: 'Caisse Intelligente (POS)', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Gestion de caisse comptoir, encaissements multi-modes, contrôle de fond de caisse et édition de tickets conformes.', price: 25 },
  { id: 'billing', name: 'Facturation & Recouvrement', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Émission de devis et factures conformes, retenue à la source 1.5%, TVA, suivi des impayés et relances.', price: 20 },
  { id: 'clients', name: 'Fiches Clients', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Profils institutionnels approfondis, classification RNE, secteur et historique d\'engagements.', price: 15 },
  { id: 'portail_client', name: 'Portail Client Extérieur', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Espace client sécurisé en libre-service, téléchargement de factures, messagerie de support et branding.', price: 20 },
  { id: 'reports', name: 'Rapports Terrain & Hebdo', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Rapports collaboratifs hebdomadaires rédigés avec les agents commerciaux et compte-rendus terrain.', price: 15 },
  { id: 'communication', name: 'Hub de Communication', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Paramétrage SMTP local, créateur de gabarits d\'emails professionnels et historique de correspondance.', price: 15 },
  { id: 'complaints', name: 'Suivi Réclamations', category: 'ACTIVITÉ COMMERCIALE & CRM', desc: 'Workflow d\'assignation des plaintes aux départements responsables et résolutions SAV.', price: 15 },

  // 3. RESSOURCES HUMAINES & TERRAIN
  { id: 'payroll', name: 'Gestion Paie & RH', category: 'RESSOURCES HUMAINES & TERRAIN', desc: 'Calcul des fiches de paie tunisiennes conformes au barème IRPP et charges patronales CNSS.', price: 25 },
  { id: 'collaborators', name: 'Gestion des Collaborateurs', category: 'RESSOURCES HUMAINES & TERRAIN', desc: 'Invitation d\'utilisateurs, gestion de rôles, permissions et suivi d\'activité de l\'équipe.', price: 15 },
  { id: 'attendance', name: 'Pointage & Temps de Travail', category: 'RESSOURCES HUMAINES & TERRAIN', desc: 'Horodatage géolocalisé (Clock In/Out), pointage biométrique IA, heures sup et congés.', price: 20 },
  { id: 'mobile_terrain', name: 'Flotte Mobile & Suivi Terrain - Elyssa Pocket', category: 'RESSOURCES HUMAINES & TERRAIN', desc: 'Application mobile terrain pour livreurs et commerciaux, tracking GPS, encaissement COD et ventes embarquées.', price: 49 },
  { id: 'mobile_fleet', name: 'Passerelle Flotte Mobile', category: 'RESSOURCES HUMAINES & TERRAIN', desc: 'Passerelle mobile de synchronisation des agents nomades.', price: 0 },

  // 4. LOGISTIQUE, ACHATS & STOCK
  { id: 'stock', name: 'Stocks & Fournisseurs', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Suivi quantitatif multi-dépôts, seuils d\'alertes de réapprovisionnement et fiches fournisseurs.', price: 25 },
  { id: 'purchasing', name: 'Achats & Approvisionnements', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Demandes d\'achat internes (DA), bons de commande (BC), taxes FODEC/TVA et réceptions.', price: 20 },
  { id: 'warehouse_picking', name: 'Gestion des Préparations & Dépôts', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Découpage des commandes par dépôt, bons de préparation au quai et synchronisation logistique.', price: 29 },
  { id: 'dispatch_tours', name: 'Expéditions & Tournées', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Gestion des tournées de livraison, affectation des livreurs/chauffeurs, feuilles de route et contrôle COD.', price: 39 },
  { id: 'production', name: 'Production & GPAO (TRS)', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Nomenclatures de fabrication, ordres de fabrication, gestion d\'ateliers et calcul du TRS industriel.', price: 45 },
  { id: 'transit_logistique', name: 'Import/Export & Logistique', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Dossiers de transit maritime/aérien, douanes, frais d\'approche et coût de revient consolidé (Landed Cost).', price: 30 },
  { id: 'lc_manager', name: 'Lettre de Crédit (Crédoc)', category: 'LOGISTIQUE, ACHATS & STOCK', desc: 'Gestion des engagements bancaires internationaux, montage de dossiers de Crédocs BCT.', price: 25 },

  // 5. FINANCE & COMPTABILITÉ
  { id: 'finance', name: 'Comptabilité & Trésorerie', category: 'FINANCE & COMPTABILITÉ', desc: 'Importation des extraits bancaires, rapprochement comptable, grand livre et déclarations fiscales.', price: 30 },
  { id: 'tej', name: 'Intégration TEJ (CIMF)', category: 'FINANCE & COMPTABILITÉ', desc: 'Génération et télé-transmission automatique des fichiers TEJ pour la plateforme fiscale CIMF [GRATUIT].', price: 0 },
  { id: 'accountant_portal', name: 'Espace Expert-Comptable & Cabinet', category: 'FINANCE & COMPTABILITÉ', desc: 'Console multi-dossiers pour cabinets d\'expertise, télé-transmissions TEJ/CNSS groupées et GED partagée.', price: 49 },
  { id: 'treasury', name: 'Trésorerie & Portefeuille d\'Effets', category: 'FINANCE & COMPTABILITÉ', desc: 'Suivi des chèques et traites en coffre, projections de liquidités glissantes à 30/60/90 jours.', price: 20 },
  { id: 'asset', name: 'Immobilisations & Amortissements', category: 'FINANCE & COMPTABILITÉ', desc: 'Registre comptable des immobilisations, plans d\'amortissement linéaires/dégressifs (NCT).', price: 20 },
  { id: 'investment', name: 'Bourse & Investissements', category: 'FINANCE & COMPTABILITÉ', desc: 'Placement d\'excédents de trésorerie sur la place de la BVMT et suivi du portefeuille.', price: 25 },

  // 6. PARC, MATÉRIEL & CONTRÔLE
  { id: 'fleet_management', name: 'Gestion du Parc & Actifs', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Gestion du parc d\'équipements lourds, engins, affectations et suivi de maintenance MDM.', price: 29 },
  { id: 'fleet', name: 'Gestion Parc Auto', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Maintenance préventive des véhicules, assurances, vignettes de circulation et kilométrage.', price: 25 },
  { id: 'ged', name: 'ED-GED & Pièces Justificatives', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Coffre-fort numérique pour pièces justificatives scannées, contrats, pièces d\'identité.', price: 20 },
  { id: 'cession', name: 'Cession d\'Entreprise & Audit', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Évaluation d\'actifs, audit de cession, impôts sur plus-values et Garantie d\'Actifs et de Passifs.', price: 20 },
  { id: 'juridique', name: 'Secrétariat Juridique', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Procès-verbaux d\'Assemblées Générales, répartition de capital et calendrier d\'obligations.', price: 20 },
  { id: 'company_settings', name: 'Paramètres de l\'Entreprise', category: 'PARC, MATÉRIEL & CONTRÔLE', desc: 'Fiche entreprise, logo, exercice fiscal et préférences système [GRATUIT].', price: 0 },
];

export const PACKS_DEFINITIONS = [
  {
    id: 'trial',
    name: 'Formule Essai Gratuit',
    desc: 'Accès complet de 7 jours sans engagement à tous les modules opérationnels d\'Elyssa ERP.',
    price: 0,
    modules: ['executive_dashboard', 'copilot', 'steering', 'business_plan', 'market', 'dashboard', 'caisse', 'billing', 'clients', 'portail_client', 'reports', 'communication', 'complaints', 'payroll', 'collaborators', 'attendance', 'mobile_terrain', 'mobile_fleet', 'stock', 'purchasing', 'dispatch_tours', 'production', 'transit_logistique', 'lc_manager', 'finance', 'tej', 'treasury', 'asset', 'investment', 'fleet_management', 'fleet', 'ged', 'cession', 'juridique', 'company_settings'],
    badge: 'MICRO-ENTREPRISE',
    category: 'commerce' as const
  },
  {
    id: 'independent',
    name: 'Formule Solo / Indépendant',
    desc: 'Adapté aux travailleurs indépendants, prestataires individuels et micro-entreprises.',
    price: 49,
    modules: ['billing', 'clients', 'tej', 'company_settings'],
    badge: 'MICRO-ENTREPRISE',
    category: 'commerce' as const
  },
  {
    id: 'pme_commerce',
    name: 'Formule PME Commerce & Services',
    desc: 'Solution idéale pour les commerces, boutiques et PME de prestation de services.',
    price: 89,
    modules: ['caisse', 'billing', 'stock', 'payroll', 'attendance', 'clients', 'tej', 'company_settings'],
    badge: 'COMMERCE & SERVICES',
    category: 'commerce' as const
  },
  {
    id: 'cabinet_comptable',
    name: 'Formule Cabinet Comptable & Audit',
    desc: 'Solution 360° dédiée aux cabinets d\'expertise comptable, commissaires aux comptes et fiduciaires (Comptabilité SCE, Paie CNSS, TEJ et Gestion Multi-Dossiers).',
    price: 119,
    modules: ['accountant_portal', 'finance', 'payroll', 'tej', 'billing', 'asset', 'ged', 'juridique', 'company_settings'],
    badge: 'EXPERTISE COMPTABLE',
    category: 'commerce' as const
  },
  {
    id: 'express_livraison',
    name: 'Formule Express & Livraison',
    desc: 'Dédiée aux sociétés de livraison E-commerce, coursier et transporteurs express.',
    price: 129,
    modules: ['dispatch_tours', 'mobile_terrain', 'mobile_fleet', 'fleet_management', 'billing', 'complaints', 'tej', 'company_settings'],
    badge: 'LIVRAISON & LOGISTIQUE',
    category: 'logistics' as const
  },
  {
    id: 'btp_genie_civil',
    name: 'Formule BTP & Génie Civil',
    desc: 'Pack sur-mesure pour entreprises du BTP, chantiers de construction, génie civil et suivi d\'équipements.',
    price: 149,
    modules: ['billing', 'attendance', 'mobile_terrain', 'fleet_management', 'purchasing', 'tej', 'company_settings'],
    badge: 'BTP & CHANTIERS',
    category: 'industry' as const
  },
  {
    id: 'grossiste_negoce',
    name: 'Formule Grossiste & Négoce Distribution',
    desc: 'Pack complet pour grossistes, négociants et réseaux de distribution régionale.',
    price: 169,
    modules: ['stock', 'purchasing', 'dispatch_tours', 'fleet', 'finance', 'tej', 'mobile_terrain', 'mobile_fleet', 'clients', 'billing', 'company_settings'],
    badge: 'NÉGOCE & DISTRIBUTION',
    category: 'logistics' as const,
    featured: true
  },
  {
    id: 'import_export',
    name: 'Formule Import / Export & Commerce Int.',
    desc: 'Pack métier pour sociétés de commerce international, transitaires, courtiers et négoce à l\'exportation.',
    price: 189,
    modules: ['transit_logistique', 'lc_manager', 'purchasing', 'stock', 'treasury', 'tej', 'company_settings'],
    badge: 'IMPORT / EXPORT',
    category: 'logistics' as const
  },
  {
    id: 'manufacture_gpao',
    name: 'Formule Manufacture & GPAO',
    desc: 'Optimisée pour ateliers de fabrication, usines manufacturières, gestion d\'ateliers et suivi du TRS.',
    price: 199,
    modules: ['production', 'stock', 'purchasing', 'warehouse_picking', 'payroll', 'executive_dashboard', 'dashboard', 'company_settings'],
    badge: 'INDUSTRIE & PRODUCTION',
    category: 'industry' as const
  },
  {
    id: 'industrial',
    name: 'Formule Elyssa Industrielle & Supply-Chain 360°',
    desc: 'L\'ERP précurseur pour industries manufacturières, cimenteries et négoce. Accès illimité à 100% des modules sans exception.',
    price: 249,
    modules: ['executive_dashboard', 'copilot', 'steering', 'business_plan', 'market', 'dashboard', 'caisse', 'billing', 'clients', 'portail_client', 'reports', 'communication', 'complaints', 'payroll', 'collaborators', 'attendance', 'mobile_terrain', 'mobile_fleet', 'stock', 'purchasing', 'dispatch_tours', 'production', 'transit_logistique', 'lc_manager', 'finance', 'tej', 'treasury', 'asset', 'investment', 'fleet_management', 'fleet', 'ged', 'cession', 'juridique', 'company_settings'],
    badge: 'SUPPLY-CHAIN 360°',
    category: 'industry' as const,
    featured: true
  },
  {
    id: 'custom',
    name: 'Formule À la Carte (Sur-mesure)',
    desc: 'Composez librement votre suite ERP en sélectionnant uniquement les modules dont vous avez besoin.',
    price: 0,
    modules: [],
    badge: 'MODULAIRE',
    category: 'commerce' as const
  }
];

export interface PublisherClient {
  id: string;
  companyName: string;
  location: string;
  packId: string;
  paymentGateway: string;
  status: 'active' | 'suspended' | 'trial';
  joinedDate: string;
  customDiscount?: boolean;
  interval?: 'monthly' | 'quarterly' | 'yearly';
  modules?: string[];
  email?: string;
  password?: string;
  license_status?: string;
  isVirtual?: boolean;
}

const PRESET_PUBLISHER_CLIENTS: PublisherClient[] = [
  { id: 'pc-ws', companyName: 'WS', location: 'Tunis', packId: 'standard', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-07-20', interval: 'monthly' },
  { id: 'pc-bb', companyName: 'BB', location: 'Ariana', packId: 'standard', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-07-22', interval: 'monthly' },
  { id: 'pc-diag', companyName: 'Diagnostic Test Corp', location: 'Tunis', packId: 'standard', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-07-24', interval: 'monthly' },
  { id: 'pc-2', companyName: 'Sousse Logistique S.A.', location: 'Sousse', packId: 'logistics', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-06-18', interval: 'quarterly' },
  { id: 'pc-carthage', companyName: 'STE CARTHAGE IMPORT-EXPORT', location: 'Nabeul', packId: 'trial', paymentGateway: 'Flouci', status: 'trial', joinedDate: '2026-06-24', interval: 'monthly' },
  { id: 'pc-1', companyName: 'Stratege Tunisian Consultant', location: 'Tunis', packId: 'independent', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-06-20', interval: 'monthly' },
  { id: 'pc-3', companyName: 'Sfax Olive Export & Trading', location: 'Sfax', packId: 'full', paymentGateway: 'Versement', status: 'active', joinedDate: '2026-05-01', interval: 'yearly' },
  { id: 'pc-4', companyName: 'Tunis RH Partner Ltd', location: 'La Soukra', packId: 'rh_only', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-05-25', interval: 'monthly' },
  { id: 'pc-5', companyName: 'Sami Distribution & Négoce', location: 'Monastir', packId: 'logistics', paymentGateway: 'Versement', status: 'trial', joinedDate: '2026-06-22', interval: 'monthly' },
];

export interface GeneratedKeyLog {
  key: string;
  packId: string;
  clientName: string;
  duration: string;
  createdAt: string;
}

import { UserSession, CollaboratorAccount } from '../types';

interface SaaSConfigProps {
  subscriptionPack: string;
  onUpdateSubscriptionPack: (pack: string) => void;
  purchasedModules: string[];
  onUpdatePurchasedModules: (modules: string[]) => void;
  hideLockedModules: boolean;
  onUpdateHideLockedModules: (hide: boolean) => void;
  customPacks?: any[];
  onUpdateCustomPacks?: (packs: any[]) => void;
  currentUser?: UserSession | null;
  collaborators?: CollaboratorAccount[];
  onUpdateCollaborators?: (collab: CollaboratorAccount[]) => void;
  publisherClients?: PublisherClient[];
  onUpdatePublisherClients?: (clients: PublisherClient[]) => void;
  activeSubscriptionPackId?: string;
  activeCompanyName?: string;
  onUpdateActiveCompanyName?: (name: string) => void;
  isSimulationActive?: boolean;
  onToggleSimulationActive?: (active: boolean) => void;
  trialDurationDays?: number;
  onUpdateTrialDurationDays?: (days: number) => void;
  onClearDemoData?: () => void;
}

export default function SaaSConfig({
  subscriptionPack,
  onUpdateSubscriptionPack,
  purchasedModules,
  onUpdatePurchasedModules,
  hideLockedModules,
  onUpdateHideLockedModules,
  customPacks = PACKS_DEFINITIONS,
  onUpdateCustomPacks = () => {},
  currentUser = null,
  collaborators = [],
  onUpdateCollaborators = () => {},
  publisherClients = PRESET_PUBLISHER_CLIENTS,
  onUpdatePublisherClients = () => {},
  activeSubscriptionPackId = 'full',
  activeCompanyName = 'Inter-Affaires',
  onUpdateActiveCompanyName = () => {},
  isSimulationActive: externalIsSimulationActive,
  onToggleSimulationActive,
  trialDurationDays = 7,
  onUpdateTrialDurationDays,
  onClearDemoData,
}: SaaSConfigProps) {
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const isParentTenant = activeCompanyName?.toLowerCase().includes('inter-affaires') ||
                         activeCompanyName === 'company_parent' ||
                         currentUser?.companyId === 'company_parent';

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const savedSession = localStorage.getItem('carthage_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        let companyId = parsed?.companyId || parsed?.company_id;
        
        // SuperAdmin or Elyssa platform owner fallback to parent company ID
        if (!companyId && (parsed?.role === 'SuperAdmin' || parsed?.email?.toLowerCase() === 'admin@elyssa.pro' || parsed?.email?.toLowerCase() === 'contact@elyssa.pro')) {
          companyId = 'pc-parent-elyssa';
        }

        if (companyId) {
          headers['x-company-id'] = companyId;
        }
      } else {
        const prospect = localStorage.getItem('carthage_trial_registered_prospect');
        if (prospect) {
          const parsed = JSON.parse(prospect);
          const clientsStr = localStorage.getItem('carthage_publisher_clients');
          if (clientsStr) {
            const clients = JSON.parse(clientsStr);
            const matched = clients.find((c: any) => c.companyName?.toLowerCase() === parsed.companyName?.toLowerCase());
            if (matched && (matched.id || matched.company_id)) {
              headers['x-company-id'] = matched.id || matched.company_id;
            }
          }
          headers['x-is-trial-signup'] = 'true';
        }
      }
    } catch (e) {}
    return headers;
  };

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 6, delay = 1500): Promise<Response> => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const [viewMode, setViewMode] = useState<'client' | 'publisher'>('client');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('table');
  const showPublisher = isSuperAdmin && viewMode === 'publisher';

  // --- TRIAL EXPIRATION SIMULATION STATE ---
  const [trialExpiredOverride, setTrialExpiredOverride] = useState<boolean>(() => {
    return localStorage.getItem('carthage_trial_expired_override') === 'true';
  });

  const handleUpdateTrialExpiredOverride = (val: boolean) => {
    setTrialExpiredOverride(val);
    localStorage.setItem('carthage_trial_expired_override', val ? 'true' : 'false');
    // Force storage trigger or custom event if needed
    window.dispatchEvent(new Event('storage'));
  };

  // --- INTERACTIVE SYSTEM STATES ---
  const [filterPackId, setFilterPackId] = useState('all');
  const [selectedPackTab, setSelectedPackTab] = useState<'all' | 'commerce' | 'logistics' | 'industry'>('all');
  const [expandedPackIds, setExpandedPackIds] = useState<Record<string, boolean>>({});
  const [selectedPackForModal, setSelectedPackForModal] = useState<any | null>(null);

  const togglePackExpand = (packId: string) => {
    setExpandedPackIds(prev => ({
      ...prev,
      [packId]: !prev[packId]
    }));
  };
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientToDelete, setClientToDelete] = useState<PublisherClient | null>(null);
  const [clientToSuspend, setClientToSuspend] = useState<PublisherClient | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);
  const [selectedOrderForDoc, setSelectedOrderForDoc] = useState<any | null>(null);
  const lastWriteTime = useRef<number>(0);

  const [backendConfig, setBackendConfig] = useState<{ showEvaluationGuide: boolean } | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetch(`/api/dashboard/config?role=${encodeURIComponent(currentUser.role)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && typeof data.showEvaluationGuide === 'boolean') {
            setBackendConfig(data);
          } else {
            setBackendConfig({ showEvaluationGuide: currentUser?.role === 'SuperAdmin' });
          }
        })
        .catch(() => {
          // Graceful fallback without noisy console logging
          setBackendConfig({ showEvaluationGuide: currentUser?.role === 'SuperAdmin' });
        });
    } else {
      setBackendConfig({ showEvaluationGuide: false });
    }
  }, [currentUser]);

  // --- FLOUCI PAYMENT GATEWAY STATE ACCENTS ---
  const [flouciError, setFlouciError] = useState<string | null>(null);

  // --- STATE FOR GENERATING SIMULATED PURCHASE ORDERS IN THE HUB ---
  const [showSimOrderForm, setShowSimOrderForm] = useState(false);
  const [simOrderCompanyName, setSimOrderCompanyName] = useState('');
  const [simOrderPackId, setSimOrderPackId] = useState('full');
  const [simOrderInterval, setSimOrderInterval] = useState('monthly');
  const [simOrderPrice, setSimOrderPrice] = useState(199);
  const [simOrderGateway, setSimOrderGateway] = useState('Virement');
  const [simOrderEmail, setSimOrderEmail] = useState('');
  const [simOrderModules, setSimOrderModules] = useState<string[]>(['cession', 'reports']);

  const [licenceRequests, setLicenceRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_licence_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Return sample requests for demonstration of communication hub
    return [
      {
        id: 'req_1',
        companyName: 'Jackson Five',
        packId: 'full',
        interval: 'yearly',
        price: 199,
        requestDate: '2026-06-20',
        status: 'pending',
        contactEmail: 'm.jackson@j5.com'
      }
    ];
  });

  const saveLicenceRequests = (requests: any[]) => {
    lastWriteTime.current = Date.now();
    setLicenceRequests(requests);
    localStorage.setItem('carthage_licence_requests', JSON.stringify(requests));
    fetchWithRetry('/api/db/licence-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requests)
    }).catch(err => console.warn('Failed to sync licence requests to server:', err));
  };

  useEffect(() => {
    // Auto calculate price based on pack and interval
    let basePrice = 199;
    if (simOrderPackId === 'independent') {
      basePrice = simOrderInterval === 'yearly' ? 349 : simOrderInterval === 'quarterly' ? 99 : 39;
    } else if (simOrderPackId === 'logistics') {
      basePrice = simOrderInterval === 'yearly' ? 699 : simOrderInterval === 'quarterly' ? 199 : 79;
    } else if (simOrderPackId === 'full') {
      basePrice = simOrderInterval === 'yearly' ? 1799 : simOrderInterval === 'quarterly' ? 499 : 199;
    } else if (simOrderPackId === 'rh_only') {
      basePrice = simOrderInterval === 'yearly' ? 499 : simOrderInterval === 'quarterly' ? 149 : 59;
    } else if (simOrderPackId === 'custom') {
      basePrice = simOrderInterval === 'yearly' ? 890 : simOrderInterval === 'quarterly' ? 236 : 90;
    }
    setSimOrderPrice(basePrice);
  }, [simOrderPackId, simOrderInterval]);

  useEffect(() => {
    if (simOrderCompanyName) {
      const existing = publisherClients.find(c => c.companyName?.toLowerCase() === simOrderCompanyName.toLowerCase());
      if (existing && existing.email) {
        setSimOrderEmail(existing.email);
      } else {
        setSimOrderEmail(`${simOrderCompanyName.toLowerCase().replace(/\s+/g, '')}@gmail.com`);
      }
    }
  }, [simOrderCompanyName, publisherClients]);

  useEffect(() => {
    // Load licence requests from server
    fetchWithRetry('/api/db/licence-requests', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Clean up ghost requests for trial companies that shouldn't have active pending orders
          let needSync = false;
          const cleaned = data.filter((req: any) => {
            const correspondingClient = publisherClients?.find(
              c => c.companyName?.toLowerCase() === req.companyName?.toLowerCase()
            );
            if (correspondingClient && correspondingClient.status === 'trial') {
              if (req.packId === 'full' && (req.price === 199 || req.price === 149) && (req.status === 'pending' || req.status === 'key_emitted')) {
                needSync = true;
                return false; // Remove ghost request!
              }
            }
            return true;
          });

          setLicenceRequests(cleaned);
          localStorage.setItem('carthage_licence_requests', JSON.stringify(cleaned));

          if (needSync) {
            fetchWithRetry('/api/db/licence-requests', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(cleaned)
            }).catch(err => console.warn('Failed to sync cleaned licence requests to server:', err));
          }
        }
      })
      .catch(err => console.warn('Error fetching licence requests:', err));

    // Load admin alerts from server
    fetchWithRetry('/api/db/admin-alerts', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdminAlerts(data);
          localStorage.setItem('carthage_admin_alerts', JSON.stringify(data));
        }
      })
      .catch(err => console.warn('Error fetching admin alerts:', err));

    // Load publisher keys from server
    fetchWithRetry('/api/db/publisher-keys', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentKeys(data);
          localStorage.setItem('carthage_publisher_keys', JSON.stringify(data));
        }
      })
      .catch(err => console.warn('Error fetching publisher keys:', err));
  }, []);

  const myPendingRequests = useMemo(() => {
    return licenceRequests.filter((r: any) => r?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
  }, [licenceRequests, activeCompanyName]);

  const mergedClients = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    // 1. Add unique actual publisher clients
    publisherClients.forEach((c: any) => {
      if (!c || !c.companyName) return;
      const idKey = String(c.id || '').toLowerCase().trim();
      const nameKey = String(c.companyName || '').toLowerCase().trim();
      
      if (!seenIds.has(idKey) && !seenNames.has(nameKey)) {
        seenIds.add(idKey);
        seenNames.add(nameKey);
        list.push(c);
      }
    });

    // 2. Add unique virtual clients from licenceRequests
    licenceRequests.forEach((req: any) => {
      if (!req || !req.companyName) return;
      const nameKey = String(req.companyName || '').toLowerCase().trim();
      
      if (!seenNames.has(nameKey)) {
        const idKey = String(req.companyId || req.company_id || `pc-virtual-${req.id}`).toLowerCase().trim();
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          seenNames.add(nameKey);
          list.push({
            id: req.companyId || req.company_id || `pc-virtual-${req.id}`,
            companyName: req.companyName.toUpperCase() === 'MB' ? 'MB' : req.companyName,
            email: req.contactEmail || '',
            location: 'Tunis',
            packId: req.packId || 'trial',
            paymentGateway: 'Virement',
            status: 'trial',
            joinedDate: req.requestDate || new Date().toISOString().split('T')[0],
            interval: req.interval || 'monthly',
            isVirtual: true
          });
        }
      }
    });

    return list;
  }, [publisherClients, licenceRequests]);

  const getLatestClientsWithPromotion = (id: string): { realId: string, list: PublisherClient[] } => {
    // 1. Check if client already exists in publisherClients by ID or companyName
    const existingInPub = publisherClients.find(c => c.id === id || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (existingInPub) {
      return { realId: existingInPub.id, list: publisherClients };
    }

    // 2. Check if client exists in mergedClients
    const virtualClient = mergedClients.find(c => c.id === id || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (virtualClient) {
      const realId = virtualClient.id.startsWith('pc-virtual-') 
        ? virtualClient.id.replace('pc-virtual-', 'pc-') 
        : (virtualClient.id.startsWith('pc-') ? virtualClient.id : `pc-${virtualClient.id}`);
      const exists = publisherClients.some(c => c.id === realId || c.companyName?.toLowerCase() === virtualClient.companyName?.toLowerCase());
      if (!exists) {
        const newClient: PublisherClient = {
          id: realId,
          companyName: virtualClient.companyName,
          location: virtualClient.location || 'Tunis',
          packId: virtualClient.packId || 'trial',
          paymentGateway: virtualClient.paymentGateway || 'Virement',
          status: virtualClient.status || 'trial',
          joinedDate: virtualClient.joinedDate || new Date().toISOString().split('T')[0],
          interval: virtualClient.interval || 'monthly'
        };
        const newList = [newClient, ...publisherClients];
        updateClients(newList);
        return { realId, list: newList };
      }
      return { realId, list: publisherClients };
    }

    return { realId: id, list: publisherClients };
  };

  const handleSaveEditedClient = (updatedClient: any) => {
    const updated = publisherClients.map(c => c.id === updatedClient.id ? updatedClient : c);
    updateClients(updated);

    if (updatedClient.modules) {
      const key = `carthage_purchased_modules_${updatedClient.companyName}`;
      localStorage.setItem(key, JSON.stringify(updatedClient.modules));
      if (updatedClient.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
        onUpdatePurchasedModules(updatedClient.modules);
      }
    }

    setEditingClient(null);
  };

  const [activationCode, setActivationCode] = useState('');
  const [activationStatus, setActivationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Helper inside SaaSConfig to push client state changes to top-level App state
  const updateClients = (updated: PublisherClient[]) => {
    lastWriteTime.current = Date.now();
    onUpdatePublisherClients(updated);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(updated));
  };

  // New Client Form States
  const [newCompName, setNewCompName] = useState('');
  const [newLocation, setNewLocation] = useState('Tunis');
  const [newPackId, setNewPackId] = useState('full');
  const [newGateway, setNewGateway] = useState('Flouci');
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'trial'>('active');
  const [newInterval, setNewInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [publisherSearch, setPublisherSearch] = useState('');

  // Key Generator States
  const [genPackId, setGenPackId] = useState('full');
  const [genDuration, setGenDuration] = useState('12_months');
  const [genClientName, setGenClientName] = useState('');
  const [generatedKeyCode, setGeneratedKeyCode] = useState('');
  const [recentKeys, setRecentKeys] = useState<GeneratedKeyLog[]>(() => {
    const saved = localStorage.getItem('carthage_publisher_keys');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const saveRecentKeys = (keys: GeneratedKeyLog[]) => {
    lastWriteTime.current = Date.now();
    setRecentKeys(keys);
    localStorage.setItem('carthage_publisher_keys', JSON.stringify(keys));
    fetch('/api/db/publisher-keys', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(keys)
    }).catch(err => console.error('Failed to sync publisher keys to server:', err));
  };

  const [simulationAlert, setSimulationAlert] = useState<string | null>(null);

  // --- E-Commerce Cart Logic for Sur-Mesure / Custom Pack ---
  const [cartModules, setCartModules] = useState<string[]>(() => {
    const saved = localStorage.getItem(`carthage_cart_${activeCompanyName}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const saveCart = (nextCart: string[]) => {
    setCartModules(nextCart);
    localStorage.setItem(`carthage_cart_${activeCompanyName}`, JSON.stringify(nextCart));
  };

  // --- Bank Account Details (Virement/Espèces) Editable by SuperAdmin ---
  const [bankName, setBankName] = useState(() => {
    return localStorage.getItem('carthage_bank_name') || 'BIAT (Banque Internationale Arabe de Tunisie)';
  });
  const [bankOwner, setBankOwner] = useState(() => {
    return localStorage.getItem('carthage_bank_owner') || 'INTER AFFAIRES';
  });
  const [bankRib, setBankRib] = useState(() => {
    return localStorage.getItem('carthage_bank_rib') || '03 000 0100100234567 89';
  });
  const [bankAgency, setBankAgency] = useState(() => {
    return localStorage.getItem('carthage_bank_agency') || 'Agence Tunis Berges du Lac II';
  });

  // --- Wafacash Details Editable by SuperAdmin ---
  const [wafacashBeneficiary, setWafacashBeneficiary] = useState(() => {
    return localStorage.getItem('carthage_wafacash_beneficiary') || 'INTER AFFAIRES';
  });
  const [wafacashCin, setWafacashCin] = useState(() => {
    return localStorage.getItem('carthage_wafacash_cin') || '04829103';
  });
  const [wafacashPhone, setWafacashPhone] = useState(() => {
    return localStorage.getItem('carthage_wafacash_phone') || '+216 71 888 999';
  });
  const [wafacashCity, setWafacashCity] = useState(() => {
    return localStorage.getItem('carthage_wafacash_city') || 'Tunis, Tunisie';
  });

  // --- Payment Methods Active State Editable by SuperAdmin ---
  const [isVirementActive, setIsVirementActive] = useState(() => {
    const saved = localStorage.getItem('carthage_pm_virement_active');
    return saved === null ? true : saved === 'true';
  });
  const [isVersementActive, setIsVersementActive] = useState(() => {
    const saved = localStorage.getItem('carthage_pm_versement_active');
    return saved === null ? true : saved === 'true';
  });
  const [isWafacashActive, setIsWafacashActive] = useState(() => {
    const saved = localStorage.getItem('carthage_pm_wafacash_active');
    return saved === null ? true : saved === 'true';
  });
  const [isOnlineCardActive, setIsOnlineCardActive] = useState(() => {
    const saved = localStorage.getItem('carthage_pm_online_card_active');
    return saved === null ? false : saved === 'true';
  });

  const [isCartCheckoutOpen, setIsCartCheckoutOpen] = useState(false);
  const [cartCheckoutStep, setCartCheckoutStep] = useState<'details' | 'submitting' | 'success'>('details');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [paymentReceiptMethod, setPaymentReceiptMethod] = useState<'virement' | 'especes' | 'wafacash' | 'flouci'>('virement');
  const [orderRefCode, setOrderRefCode] = useState('');

  // --- INTERVAL & ADMIN ALERT SELECTIONS ---
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [cartInterval, setCartInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [includeTva, setIncludeTva] = useState<boolean>(true);
  const [tvaRate, setTvaRate] = useState<number>(19);
  const [includeRs, setIncludeRs] = useState<boolean>(false);
  const [rsRate, setRsRate] = useState<number>(1.5);
  const [systemToast, setSystemToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // Synchroniser le RIB et les coordonnées de paiement depuis Firebase (pour que ce soit partagé entre admin et clients en temps réel)
  useEffect(() => {
    loadSaaSBankConfig().then((config) => {
      if (config) {
        if (config.bankName) {
          setBankName(config.bankName);
          localStorage.setItem('carthage_bank_name', config.bankName);
        }
        if (config.bankOwner) {
          setBankOwner(config.bankOwner);
          localStorage.setItem('carthage_bank_owner', config.bankOwner);
        }
        if (config.bankRib) {
          setBankRib(config.bankRib);
          localStorage.setItem('carthage_bank_rib', config.bankRib);
        }
        if (config.bankAgency) {
          setBankAgency(config.bankAgency);
          localStorage.setItem('carthage_bank_agency', config.bankAgency);
        }
        if (config.wafacashBeneficiary) {
          setWafacashBeneficiary(config.wafacashBeneficiary);
          localStorage.setItem('carthage_wafacash_beneficiary', config.wafacashBeneficiary);
        }
        if (config.wafacashCin) {
          setWafacashCin(config.wafacashCin);
          localStorage.setItem('carthage_wafacash_cin', config.wafacashCin);
        }
        if (config.wafacashPhone) {
          setWafacashPhone(config.wafacashPhone);
          localStorage.setItem('carthage_wafacash_phone', config.wafacashPhone);
        }
        if (config.wafacashCity) {
          setWafacashCity(config.wafacashCity);
          localStorage.setItem('carthage_wafacash_city', config.wafacashCity);
        }
        if (config.isVirementActive !== undefined) {
          setIsVirementActive(config.isVirementActive);
          localStorage.setItem('carthage_pm_virement_active', String(config.isVirementActive));
        }
        if (config.isVersementActive !== undefined) {
          setIsVersementActive(config.isVersementActive);
          localStorage.setItem('carthage_pm_versement_active', String(config.isVersementActive));
        }
        if (config.isWafacashActive !== undefined) {
          setIsWafacashActive(config.isWafacashActive);
          localStorage.setItem('carthage_pm_wafacash_active', String(config.isWafacashActive));
        }
        if (config.isOnlineCardActive !== undefined) {
          setIsOnlineCardActive(config.isOnlineCardActive);
          localStorage.setItem('carthage_pm_online_card_active', String(config.isOnlineCardActive));
        }
      }
    });
  }, []);
  const [localIsSimulationActive, setLocalIsSimulationActive] = useState<boolean>(() => {
    return localStorage.getItem('carthage_demo_simulation_active') === 'true';
  });

  const isSimulationActive = externalIsSimulationActive !== undefined ? externalIsSimulationActive : localIsSimulationActive;

  const setIsSimulationActive = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isSimulationActive) : val;
    setLocalIsSimulationActive(nextVal);
    localStorage.setItem('carthage_demo_simulation_active', nextVal ? 'true' : 'false');
    if (onToggleSimulationActive) {
      onToggleSimulationActive(nextVal);
    }
  };

  const [adminAlerts, setAdminAlerts] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_admin_alerts');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  // --- REAL-TIME LIVE EVENT ALERTS & POLLING ENGINE ---
  interface LiveNotification {
    id: string;
    type: 'registration' | 'acquisition' | 'warning' | 'key_emitted' | 'approved';
    title: string;
    message: string;
    meta?: any;
  }

  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);

  // Sound synthesizer using Web Audio API (cross-browser compatible bell chime or positive chords)
  const playSynthNotification = (type: 'registration' | 'acquisition' | 'warning' | 'key_emitted' | 'approved') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'registration' || type === 'acquisition' || type === 'approved') {
        // Cheerful success chord (arpeggio: C4, E4, G4, C5)
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          
          gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
          
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.7);
        });
      } else if (type === 'warning') {
        // High alert chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else { // key_emitted
        // Delightful key sparkle bell chime
        const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.6);
        });
      }
    } catch (err) {
      console.warn('Audio synthesis failed:', err);
    }
  };

  const removeLiveNotification = (notifId: string) => {
    setLiveNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const triggerLiveVisualNotification = (notif: Omit<LiveNotification, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fullNotif = { ...notif, id };
    
    // Play associated synthesizer chime!
    playSynthNotification(notif.type);
    
    setLiveNotifications(prev => [fullNotif, ...prev].slice(0, 4)); // max 4 stacked notifications
    
    // Automatically dismiss after 10 seconds
    setTimeout(() => {
      removeLiveNotification(id);
    }, 10000);
  };

  // Keep track of what we have already seen to prevent duplicate toast alerts on repeated polls
  const knownAlertIds = useRef<Set<string>>(new Set());
  const knownRequestIds = useRef<Set<string>>(new Set());
  const knownRequestStatuses = useRef<Record<string, string>>({});
  const initialPollingSetupDone = useRef<boolean>(false);
  const isFirstPollDone = useRef<boolean>(false);

  // Background Live Sync & Real-time Polling Hook
  useEffect(() => {
    // Populate known state sets upon initial render
    if (!initialPollingSetupDone.current) {
      if (adminAlerts.length > 0) {
        adminAlerts.forEach(a => knownAlertIds.current.add(a.id));
      }
      if (licenceRequests.length > 0) {
        licenceRequests.forEach(r => {
          knownRequestIds.current.add(r.id);
          knownRequestStatuses.current[r.id] = r.status;
        });
      }
      initialPollingSetupDone.current = true;
    }

    const performBackgroundSync = async () => {
      // Avoid overwriting local state with stale server reads if we wrote recently (e.g. within 6 seconds)
      if (Date.now() - lastWriteTime.current < 6000) {
        return;
      }
      try {
        // 1. Poll Admin Alerts
        const alertsRes = await fetch('/api/db/admin-alerts', {
          headers: getAuthHeaders()
        });
        if (alertsRes.ok) {
          const serverAlerts = await alertsRes.json();
          if (Array.isArray(serverAlerts) && serverAlerts.length > 0) {
            let stateUpdated = false;
            const newAlertsFound: any[] = [];

            serverAlerts.forEach((alert: any) => {
              if (alert.id && !knownAlertIds.current.has(alert.id)) {
                knownAlertIds.current.add(alert.id);
                if (isFirstPollDone.current) {
                  newAlertsFound.push(alert);
                }
                stateUpdated = true;
              }
            });

            if (stateUpdated) {
              setAdminAlerts(serverAlerts);
              localStorage.setItem('carthage_admin_alerts', JSON.stringify(serverAlerts));

              // Trigger interactive notification popups for new alerts!
              newAlertsFound.forEach((alert: any) => {
                // Determine details
                let title = 'Nouvel Événement';
                if (alert.type === 'registration') {
                  title = '🆕 Nouvelle Inscription Entreprise';
                } else if (alert.type === 'acquisition') {
                  title = '💰 Nouveau Contrat Activé';
                } else if (alert.type === 'warning') {
                  title = '⚠️ Échéance Administrative';
                }

                triggerLiveVisualNotification({
                  type: alert.type || 'acquisition',
                  title,
                  message: alert.message
                });
              });
            }
          }
        }

        // 2. Poll Licence Requests
        const reqsRes = await fetch('/api/db/licence-requests', {
          headers: getAuthHeaders()
        });
        if (reqsRes.ok) {
          const serverReqs = await reqsRes.json();
          if (Array.isArray(serverReqs)) {
            let listUpdated = false;
            
            // Check for completely new requests
            serverReqs.forEach((req: any) => {
              const isNew = req.id && !knownRequestIds.current.has(req.id);
              const statusChanged = req.id && knownRequestStatuses.current[req.id] !== req.status;

              if (isNew) {
                knownRequestIds.current.add(req.id);
                knownRequestStatuses.current[req.id] = req.status;
                listUpdated = true;

                // If this is SuperAdmin, notify of new incoming request
                if (isSuperAdmin && isFirstPollDone.current) {
                  triggerLiveVisualNotification({
                    type: 'registration',
                    title: '📋 Nouvelle Commande Reçue',
                    message: `L'entreprise "${req.companyName}" demande la formule ${req.packId === 'full' ? 'Intégrale' : req.packId} (${req.interval === 'yearly' ? 'Annuel' : 'Mensuel'}) pour ${req.price} TND.`,
                    meta: { targetHub: true }
                  });
                }
              } else if (statusChanged) {
                const oldStatus = knownRequestStatuses.current[req.id];
                knownRequestStatuses.current[req.id] = req.status;
                listUpdated = true;

                // Notify client if their request was processed!
                if (req.companyName?.toLowerCase() === activeCompanyName?.toLowerCase() && isFirstPollDone.current) {
                  if (req.status === 'key_emitted') {
                    triggerLiveVisualNotification({
                      type: 'key_emitted',
                      title: '🔏 Clé de Licence Émise !',
                      message: `Votre clé pour le forfait ${req.packId === 'full' ? 'Intégrale' : req.packId} est prête. Cliquez pour l'intégrer.`,
                      meta: { licenseKey: req.licenseKey }
                    });
                  } else if (req.status === 'approved') {
                    triggerLiveVisualNotification({
                      type: 'approved',
                      title: '✔️ Licence Officiellement Active !',
                      message: `Votre virement a été reçu. Tous les modules de votre forfait ${req.packId === 'full' ? 'Intégrale' : req.packId} sont débloqués.`
                    });
                  }
                }
              }
            });

            if (listUpdated) {
              setLicenceRequests(serverReqs);
              localStorage.setItem('carthage_licence_requests', JSON.stringify(serverReqs));

              // If the active company has approved custom requests, make sure modules are unlocked immediately
              const approvedReqs = serverReqs.filter(
                (r: any) =>
                  r.companyName?.toLowerCase() === activeCompanyName?.toLowerCase() &&
                  r.status === 'approved' &&
                  r.packId === 'custom' &&
                  Array.isArray(r.modules)
              );
              if (approvedReqs.length > 0) {
                const key = `carthage_purchased_modules_${activeCompanyName}`;
                const savedStr = localStorage.getItem(key);
                let existingModules: string[] = [];
                if (savedStr) {
                  try {
                    existingModules = JSON.parse(savedStr);
                  } catch (e) {}
                }
                const allReqModules = approvedReqs.flatMap((r: any) => r.modules);
                const merged = Array.from(new Set([...existingModules, ...allReqModules]));
                const hasNewModules = merged.length > existingModules.length;
                if (hasNewModules) {
                  localStorage.setItem(key, JSON.stringify(merged));
                }
                const needsUIUpdate = merged.length !== purchasedModules.length || !merged.every(m => purchasedModules.includes(m));
                if (needsUIUpdate) {
                  onUpdatePurchasedModules(merged);
                }
              }
            }
          }
        }

        // 3. Poll Publisher Clients to sync active state immediately without manual refresh
        const clientsRes = await fetch('/api/db/publisher-clients', {
          headers: getAuthHeaders()
        });
        if (clientsRes.ok) {
          const serverClients = await clientsRes.json();
          if (Array.isArray(serverClients) && serverClients.length > 0) {
            // Check if length or active contents differ
            const localCached = localStorage.getItem('carthage_publisher_clients');
            const localLength = publisherClients.length;
            if (serverClients.length !== localLength || JSON.stringify(serverClients) !== localCached) {
              onUpdatePublisherClients(serverClients);
              localStorage.setItem('carthage_publisher_clients', JSON.stringify(serverClients));
            }
          }
        }

      } catch (err) {
        console.warn('Background sync polling warning:', err);
      } finally {
        isFirstPollDone.current = true;
      }
    };

    // Run immediately on change of role/company or list change
    performBackgroundSync();

    // Set polling interval to 5 seconds
    const intervalId = setInterval(performBackgroundSync, 5000);

    return () => clearInterval(intervalId);
  }, [isSuperAdmin, activeCompanyName, publisherClients.length]);

  // --- FLOUCI PAYMENT CALLBACKS ENGINE ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const flouciStatus = urlParams.get('flouci');
    const trackingId = urlParams.get('tracking_id');
    const paymentId = urlParams.get('payment_id');

    if (flouciStatus && trackingId) {
      if (flouciStatus === 'success') {
        const pendingStr = localStorage.getItem('carthage_pending_payment');
        let pendingDetails: any = null;
        if (pendingStr) {
          try {
            pendingDetails = JSON.parse(pendingStr);
          } catch (e) {
            console.error("Failed to parse pending payment details:", e);
          }
        }

        const targetPaymentId = paymentId || `sandbox_${Date.now()}`;
        
        fetch(`/api/flouci/verify-payment/${targetPaymentId}`)
          .then(res => {
            if (!res.ok) throw new Error("Échec de la vérification du règlement");
            return res.json();
          })
          .then(data => {
            if (data.success && (data.result?.status === 'SUCCESS' || data.result?.sandbox)) {
              const finalPackId = pendingDetails?.id || 'full';
              const finalType = pendingDetails?.type || 'pack';
              const finalInterval = pendingDetails?.interval || 'yearly';
              const finalPrice = pendingDetails?.price || 199;
              const isModule = finalType === 'module';
              const isCartModules = finalType === 'cart_modules';

              if (isCartModules) {
                const pendingModulesList = pendingDetails?.modules || [];
                const updated = Array.from(new Set([...purchasedModules, ...pendingModulesList]));
                onUpdatePurchasedModules(updated);
                localStorage.setItem(`carthage_purchased_modules_${activeCompanyName}`, JSON.stringify(updated));
                localStorage.setItem('carthage_purchased_modules', JSON.stringify(updated));
              } else if (isModule) {
                const updated = [...purchasedModules, finalPackId];
                onUpdatePurchasedModules(updated);
                localStorage.setItem(`carthage_purchased_modules_${activeCompanyName}`, JSON.stringify(updated));
                localStorage.setItem('carthage_purchased_modules', JSON.stringify(updated));
              } else {
                onUpdateSubscriptionPack(finalPackId);
                localStorage.setItem('carthage_sub_pack', finalPackId);
              }

              const genKey = `ELY-FL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;
              const newReq = {
                id: `req_${Date.now()}`,
                companyName: activeCompanyName,
                packId: (isModule || isCartModules) ? 'custom' : finalPackId,
                interval: finalInterval,
                price: finalPrice,
                requestDate: new Date().toISOString().split('T')[0],
                status: 'approved' as const,
                paymentMethod: 'Flouci' as const,
                licenseKey: genKey,
                contactEmail: currentUser?.email || (isSuperAdmin ? 'contact@elyssa.pro' : 'contact@entreprise.tn'),
                modules: isModule ? [finalPackId] : (isCartModules ? pendingDetails?.modules : undefined)
              };
              saveLicenceRequests([newReq, ...licenceRequests]);

              const updatedClients = publisherClients.map(c => {
                if (c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
                  const newReqModules = isModule ? [finalPackId] : (isCartModules ? pendingDetails?.modules : undefined);
                  const isCustom = (isModule || isCartModules);
                  const merged = isCustom ? Array.from(new Set([
                    ...(c.modules || []),
                    ...(newReqModules || [])
                  ])) : c.modules;
                  return {
                    ...c,
                    status: 'active' as const,
                    packId: isCustom ? 'custom' : finalPackId,
                    interval: finalInterval,
                    joinedDate: new Date().toISOString().split('T')[0],
                    modules: isCustom ? merged : c.modules
                  };
                }
                return c;
              });
              updateClients(updatedClients);

              const planTitle = isCartModules
                ? `${pendingDetails?.modules?.length || 0} Modules À la Carte`
                : (isModule 
                    ? `Module : ${ALL_MODULES_METADATA.find(m => m.id === finalPackId)?.name || finalPackId}`
                    : `Forfait : ${PACKS_DEFINITIONS.find(p => p.id === finalPackId)?.name || finalPackId}`);
                
              addAdminAlert(`Règlement Flouci Réussi : l'entreprise "${activeCompanyName}" a acquis le pack "${planTitle}" (${finalInterval === 'monthly' ? 'Mensuel' : finalInterval === 'quarterly' ? 'Trimestriel' : 'Annuel'}) via Flouci (${finalPrice} TND). ID: ${targetPaymentId}`, 'acquisition');

              triggerLiveVisualNotification({
                type: 'approved',
                title: '🎉 Paiement Flouci Réussi !',
                message: `Votre licence "${planTitle}" a été activée instantanément.`
              });
              
              localStorage.removeItem('carthage_pending_payment');
            } else {
              triggerLiveVisualNotification({
                type: 'warning',
                title: '❌ Échec Flouci',
                message: "La transaction Flouci n'a pas pu être validée par la banque centrale."
              });
            }
          })
          .catch(err => {
            console.error("Verification callback error:", err);
            triggerLiveVisualNotification({
              type: 'warning',
              title: '❌ Erreur de Validation',
              message: "Une erreur s'est produite lors de la validation de votre règlement Flouci."
            });
          })
          .finally(() => {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          });
      } else if (flouciStatus === 'fail') {
        triggerLiveVisualNotification({
          type: 'warning',
          title: '❌ Paiement Flouci Annulé',
          message: "La transaction de paiement Flouci a été annulée ou a échoué."
        });
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [purchasedModules, publisherClients, licenceRequests, activeCompanyName]);

  const addAdminAlert = (message: string, type: 'registration' | 'acquisition' | 'warning' = 'acquisition') => {
    const newAlert = {
      id: `al_${Date.now()}`,
      type,
      message,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    
    setAdminAlerts(prev => {
      const updated = [newAlert, ...prev];
      localStorage.setItem('carthage_admin_alerts', JSON.stringify(updated));
      return updated;
    });

    // Fire instant feedback toast
    setSystemToast({ show: true, message });
    setTimeout(() => {
      setSystemToast(prev => prev.message === message ? { show: false, message: '' } : prev);
    }, 8000);

    // Sync with server
    fetch('/api/db/admin-alerts', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(serverAlerts => {
        let mergedAlerts = Array.isArray(serverAlerts) ? serverAlerts : [];
        if (!mergedAlerts.some((a: any) => a.message === message)) {
          mergedAlerts = [newAlert, ...mergedAlerts];
        }
        setAdminAlerts(mergedAlerts);
        localStorage.setItem('carthage_admin_alerts', JSON.stringify(mergedAlerts));
        return fetch('/api/db/admin-alerts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(mergedAlerts)
        });
      })
      .catch(err => console.error('Failed to sync admin alert to server:', err));
  };

  const handleInsertDemos = () => {
    if (isParentTenant) {
      console.warn('[Demo Injection Blocked] Demo data injection is disabled on Parent / Inter-Affaires tenant.');
      return;
    }
    const demoClients: PublisherClient[] = [
      { id: 'pc-demo-1', companyName: 'STE CARTHAGE IMPORT-EXPORT', email: 'carthage@import.tn', password: 'Carthage2026!', location: 'Nabeul', packId: 'full', paymentGateway: 'Virement', status: 'trial', joinedDate: '2026-06-24', interval: 'yearly' },
      { id: 'pc-demo-2', companyName: 'EL KEF AGRICOLE COOPERATIVE', email: 'kef@agri.tn', password: 'Carthage2026!', location: 'El Kef', packId: 'logistics', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-06-24', interval: 'quarterly' },
      { id: 'pc-demo-3', companyName: 'BIZERTE MARITIME & DOCKING', email: 'contact@bizerte-maritime.com', password: 'Carthage2026!', location: 'Bizerte', packId: 'independent', paymentGateway: 'Flouci', status: 'active', joinedDate: '2026-06-24', interval: 'monthly' },
      { id: 'pc-demo-4', companyName: 'DJERBA RECEPTIFS TOURISME', email: 'djerba@tourisme.tn', password: 'Carthage2026!', location: 'Djerba', packId: 'custom', paymentGateway: 'Wafacash', status: 'active', joinedDate: '2026-06-24', interval: 'yearly' }
    ];

    const demoCollabs: CollaboratorAccount[] = [
      {
        id: 'collab_demo_carthage_owner',
        name: 'Dirigeant Carthage',
        email: 'carthage@import.tn',
        password: '123456',
        role: 'Manager',
        status: 'Active',
        company: 'STE CARTHAGE IMPORT-EXPORT',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_kef_owner',
        name: 'Dirigeant El Kef',
        email: 'kef@agri.tn',
        password: '123456',
        role: 'Manager',
        status: 'Active',
        company: 'EL KEF AGRICOLE COOPERATIVE',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_bizerte_owner',
        name: 'Dirigeant Bizerte',
        email: 'contact@bizerte-maritime.com',
        password: '123456',
        role: 'Manager',
        status: 'Active',
        company: 'BIZERTE MARITIME & DOCKING',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_djerba_owner',
        name: 'Dirigeant Djerba',
        email: 'djerba@tourisme.tn',
        password: '123456',
        role: 'Manager',
        status: 'Active',
        company: 'DJERBA RECEPTIFS TOURISME',
        assignedTasks: [],
        createdDate: '2026-06-24'
      }
    ];

    const demoRequests = [
      { id: 'demo-req-1', companyName: 'STE CARTHAGE IMPORT-EXPORT', packId: 'full', interval: 'yearly', price: 199, requestDate: '2026-06-24', status: 'pending', contactEmail: 'carthage@import.tn' },
      { id: 'demo-req-2', companyName: 'BIZERTE MARITIME & DOCKING', packId: 'custom', interval: 'monthly', price: 90, requestDate: '2026-06-24', status: 'pending', contactEmail: 'contact@bizerte-maritime.com', modules: ['steering', 'reports', 'cession', 'business_plan', 'juridique'] }
    ];

    const demoAlerts = [
      { id: 'demo-al-1', type: 'registration', message: 'Nouvelle demande d\'activation reçue de la part de : "STE CARTHAGE IMPORT-EXPORT" (Formule Elyssa Intégrale).', date: '2026-06-24 10:15' },
      { id: 'demo-al-2', type: 'registration', message: 'Inscription de compte d\'essai : "EL KEF AGRICOLE COOPERATIVE" (Formule Logistique & Distribution).', date: '2026-06-24 11:30' }
    ];

    // 1. Add demo clients without duplicates
    const existingIds = new Set(publisherClients.map(c => c.id));
    const newClients = [...publisherClients];
    let addedCount = 0;
    demoClients.forEach(demo => {
      if (!existingIds.has(demo.id)) {
        newClients.unshift(demo); // Put at top so they are easily visible
        addedCount++;
      }
    });
    onUpdatePublisherClients(newClients);

    // 2. Add demo requests without duplicates
    const existingReqIds = new Set(licenceRequests.map(r => r.id));
    const newReqs = [...licenceRequests];
    demoRequests.forEach(req => {
      if (!existingReqIds.has(req.id)) {
        newReqs.unshift(req);
      }
    });
    saveLicenceRequests(newReqs);

    // 3. Add demo alerts
    const existingAlertIds = new Set(adminAlerts.map(a => a.id));
    const newAlerts = [...adminAlerts];
    demoAlerts.forEach(alert => {
      if (!existingAlertIds.has(alert.id)) {
        newAlerts.unshift(alert);
      }
    });
    setAdminAlerts(newAlerts);
    localStorage.setItem('carthage_admin_alerts', JSON.stringify(newAlerts));

    // 4. Add demo collaborator accounts
    const existingCollabIds = new Set(collaborators.map(c => c.id));
    const newCollabs = [...collaborators];
    demoCollabs.forEach(collab => {
      if (!existingCollabIds.has(collab.id)) {
        newCollabs.unshift(collab);
      }
    });
    onUpdateCollaborators(newCollabs);

    setIsSimulationActive(true);
    localStorage.setItem('carthage_demo_simulation_active', 'true');

    setSimulationAlert(`Mode Démo Activé : ${addedCount} entreprises de simulation, comptes dirigeants, demandes de licence et alertes ont été ajoutées. Vous pouvez vous connecter à ces entreprises ou utiliser leurs profils dirigeants avec le code PIN '123456'.`);
    setTimeout(() => setSimulationAlert(null), 8000);
  };

  const handleDeleteDemos = () => {
    setIsSimulationActive(false);
    localStorage.setItem('carthage_demo_simulation_active', 'false');
    
    // Nettoyer tous les clients de démonstration et pré-définis (demo/presets)
    const cleanedClients = publisherClients.filter(c => !c.id.startsWith('pc-demo-') && !['pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5'].includes(c.id));
    onUpdatePublisherClients(cleanedClients);

    // Nettoyer tous les requêtes/commandes de démonstration (y compris Jackson Five)
    const cleanedRequests = licenceRequests.filter(r => !r.id.startsWith('demo-') && r.id !== 'req_1');
    saveLicenceRequests(cleanedRequests);

    // Nettoyer uniquement les alertes démo
    const cleanedAlerts = adminAlerts.filter(a => !a.id.startsWith('demo-'));
    setAdminAlerts(cleanedAlerts);
    localStorage.setItem('carthage_admin_alerts', JSON.stringify(cleanedAlerts));

    // Nettoyer uniquement les collaborateurs démo
    const cleanedCollabs = collaborators.filter(c => !c.id.startsWith('collab_demo_'));
    onUpdateCollaborators(cleanedCollabs);

    setSimulationAlert("Mode Démo Désactivé : Toutes les entreprises, requêtes, alertes et comptes de collaborateurs de démonstration ont été nettoyés. Vos vrais clients et indicateurs réels de production sont préservés.");
    setTimeout(() => setSimulationAlert(null), 6000);
  };

  const handleToggleCartItem = (moduleId: string) => {
    if (cartModules.includes(moduleId)) {
      saveCart(cartModules.filter(id => id !== moduleId));
    } else {
      saveCart([...cartModules, moduleId]);
    }
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleTriggerCartCheckout = () => {
    // Generate a beautiful, Tunisian bank-standard reference
    const clientAbbr = activeCompanyName.trim().slice(0, 4).toUpperCase();
    const randHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    setOrderRefCode(`CMD-${clientAbbr}-${randHex}-2026`);
    setCartCheckoutStep('details');
    setAgreedTerms(false);
    
    // Choose the first active payment receipt method
    if (isOnlineCardActive) {
      setPaymentReceiptMethod('flouci');
    } else if (isVirementActive) {
      setPaymentReceiptMethod('virement');
    } else if (isVersementActive) {
      setPaymentReceiptMethod('especes');
    } else if (isWafacashActive) {
      setPaymentReceiptMethod('wafacash');
    } else {
      setPaymentReceiptMethod('virement');
    }
    
    setIsCartCheckoutOpen(true);
  };

  const handleCartCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;
    setCartCheckoutStep('submitting');
    
    const cartBaseTotal = ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
    const cartMonthlyRate = cartInterval === 'monthly' ? cartBaseTotal : (cartInterval === 'quarterly' ? Math.round(cartBaseTotal * 0.9) : Math.round(cartBaseTotal * 0.8));
    const cartTotalHT = cartInterval === 'monthly' ? cartMonthlyRate : (cartInterval === 'quarterly' ? cartMonthlyRate * 3 : cartMonthlyRate * 12);
    const cartVatVal = includeTva ? Math.round(cartTotalHT * tvaRate / 100) : 0;
    const cartTotalTTC = cartTotalHT + cartVatVal;
    const cartRsVal = includeRs ? Math.round(cartTotalHT * rsRate / 100) : 0;
    const cartNetToPay = cartTotalTTC - cartRsVal;

    if (paymentReceiptMethod === 'flouci') {
      const trackingId = `FL-TRK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const pendingPayment = {
        type: 'cart_modules',
        id: 'custom',
        interval: cartInterval,
        price: cartNetToPay,
        amount: cartNetToPay,
        trackingId: trackingId,
        companyName: activeCompanyName,
        timestamp: Date.now(),
        modules: [...cartModules]
      };
      localStorage.setItem('carthage_pending_payment', JSON.stringify(pendingPayment));

      fetch('/api/flouci/generate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartNetToPay,
          developer_tracking_id: trackingId,
          client_id: activeCompanyName
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Erreur de communication avec le serveur Elyssa ERP.");
        return res.json();
      })
      .then(data => {
        if (data.success && data.result?.link) {
          window.location.href = data.result.link;
        } else {
          throw new Error(data.error || "La passerelle Flouci n'a pas retourné de session valide.");
        }
      })
      .catch(err => {
        console.error("Flouci cart checkout redirect generation error:", err);
        setFlouciError(err.message || "Impossible d'initier la passerelle Flouci.");
        setCartCheckoutStep('details');
      });
      return;
    }

    setTimeout(() => {
      // Do NOT add cart modules to purchasedModules immediately since this is an offline payment (payment promise)
      // The modules will be activated once the admin verifies the payment or the client uses an activation key.

      // Push custom à la carte order to the SuperAdmin's centralized hub
      const newReq = {
        id: `req_${Date.now()}`,
        companyName: activeCompanyName,
        packId: 'custom',
        interval: cartInterval,
        price: cartNetToPay,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        contactEmail: currentUser?.email || (isSuperAdmin ? 'contact@elyssa.pro' : 'contact@entreprise.tn'),
        modules: [...cartModules]
      };
      // Keep existing requests and append the new one so companies can place multiple parallel orders
      saveLicenceRequests([newReq, ...licenceRequests]);

      const mappedGateway = paymentReceiptMethod === 'virement' 
        ? 'Virement' 
        : paymentReceiptMethod === 'especes' 
        ? 'Versement' 
        : 'Wafacash';

      // Update publisherClients database but do NOT force status to 'active' or lock/change active trial modules
      const companyExists = publisherClients.some(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
      let updatedClients;
      
      // Do NOT store purchased modules in local storage yet (this should only happen upon license key activation)
      
      if (companyExists) {
        updatedClients = publisherClients.map(c => {
          if (c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
            return {
              ...c,
              // Keep packId as 'trial' (or its pre-checkout pack) to preserve full access during the trial period
              // Do NOT change packId or set active modules list yet
              interval: cartInterval,
              paymentGateway: mappedGateway,
            };
          }
          return c;
        });
      } else {
        const newClient: PublisherClient = {
          id: `pc-${Date.now()}`,
          companyName: activeCompanyName,
          location: 'Tunis',
          packId: 'trial', // Start on 'trial' pack to preserve full access
          paymentGateway: mappedGateway,
          status: 'trial', // Keep as trial until paid & activated
          joinedDate: new Date().toISOString().split('T')[0],
          interval: cartInterval
        };
        updatedClients = [newClient, ...publisherClients];
      }
      updateClients(updatedClients);

      addAdminAlert(`Commande À la Carte : l'entreprise "${activeCompanyName}" a validé un pack sur-mesure de ${cartModules.length} modules (${cartInterval === 'monthly' ? 'Mensuel' : cartInterval === 'quarterly' ? 'Trimestriel (-10%)' : 'Annuel (-20%)'}) pour un montant total de ${cartNetToPay} TND (basé sur ${cartMonthlyRate} TND/mois).`, 'acquisition');

      // Success
      setCartCheckoutStep('success');
      saveCart([]); // clear cart
    }, 2000);
  };

  const [selectedPackId, setSelectedPackId] = useState(subscriptionPack);
  const [checkoutModule, setCheckoutModule] = useState<ModuleMetadata | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<typeof PACKS_DEFINITIONS[0] | null>(null);
  const [paymentStep, setPaymentStep] = useState<'form' | 'loading' | 'success'>('form');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'card' | 'wire'>('card');
  
  useEffect(() => {
    if (!isOnlineCardActive && checkoutPaymentMethod === 'card') {
      setCheckoutPaymentMethod('wire');
    }
  }, [isOnlineCardActive, checkoutPaymentMethod]);
  
  // Simulated Card Billing Form States
  const [cardNumber, setCardNumber] = useState('4452 7210 0341 9825');
  const [cardHolder, setCardHolder] = useState('ZIED BEN MILED');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('425');
  const [payGateway, setPayGateway] = useState<'Flouci' | 'e-DINAR' | 'Poste' | 'Visa'>('e-DINAR');

  // Compute if a specific module is active
  const isModuleActiveInPack = (moduleId: string, packId: string): boolean => {
    // Standard dashboard is always free
    if (moduleId === 'dashboard') return true;
    const pack = customPacks.find(p => p.id === packId);
    return pack ? pack.modules.includes(moduleId) : false;
  };

  const billingBasePack = subscriptionPack === 'trial' ? 'custom' : subscriptionPack;

  const isModuleCurrentlyUnlocked = (moduleId: string): boolean => {
    const isInterAffairesSession = 
      activeCompanyName?.toLowerCase().includes('inter-affaires') || 
      activeCompanyName?.toLowerCase() === 'elyssa entreprises s.a.' || 
      currentUser?.role === 'SuperAdmin' ||
      isSimulationActive;

    if (isInterAffairesSession) {
      return true;
    }
    return isModuleActiveInPack(moduleId, billingBasePack) || purchasedModules.includes(moduleId);
  };

  const handleSelectPack = (packId: string) => {
    const activeClient = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
    const isTrial = activeClient?.status === 'trial';
    if (packId === subscriptionPack && !isTrial) return;
    const pack = customPacks.find(p => p.id === packId);
    if (!pack) return;
    
    // Direct change or trigger checkout for premium packs
    setCheckoutPack(pack);
    setPaymentStep('form');
    setCheckoutPaymentMethod('card');
  };

  const handleTriggerCheckoutModule = (module: ModuleMetadata) => {
    setCheckoutModule(module);
    setCheckoutPack(null);
    setPaymentStep('form');
    setCheckoutPaymentMethod('card');
  };

  const handleCloseCheckout = () => {
    setCheckoutModule(null);
    setCheckoutPack(null);
    setPaymentStep('form');
    setCheckoutPaymentMethod('card');
  };

  const handleSimulatedPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('loading');
    setFlouciError(null);
    
    const basePrice = checkoutModule ? checkoutModule.price : (checkoutPack ? checkoutPack.price : 0);
    const checkoutPrice = selectedInterval === 'monthly' ? basePrice : (selectedInterval === 'quarterly' ? Math.round(basePrice * 0.9) : Math.round(basePrice * 0.8));
    const packId = checkoutModule ? 'custom' : (checkoutPack ? checkoutPack.id : 'full');

    if (payGateway === 'Flouci' && checkoutPaymentMethod === 'card') {
      const multiplier = selectedInterval === 'monthly' ? 1 : (selectedInterval === 'quarterly' ? 3 : 12);
      const finalAmountTnd = checkoutPrice * multiplier;
      const trackingId = `FL-TRK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const pendingPayment = {
        type: checkoutModule ? 'module' : 'pack',
        id: checkoutModule ? checkoutModule.id : (checkoutPack ? checkoutPack.id : 'full'),
        interval: selectedInterval,
        price: checkoutPrice,
        amount: finalAmountTnd,
        trackingId: trackingId,
        companyName: activeCompanyName,
        timestamp: Date.now()
      };
      localStorage.setItem('carthage_pending_payment', JSON.stringify(pendingPayment));

      fetch('/api/flouci/generate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmountTnd,
          developer_tracking_id: trackingId,
          client_id: activeCompanyName
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Erreur de communication avec le serveur Elyssa ERP.");
        return res.json();
      })
      .then(data => {
        if (data.success && data.result?.link) {
          window.location.href = data.result.link;
        } else {
          throw new Error(data.error || "La passerelle Flouci n'a pas retourné de session valide.");
        }
      })
      .catch(err => {
        console.error("Flouci redirect generation error:", err);
        setFlouciError(err.message || "Impossible d'initier la passerelle Flouci.");
        setPaymentStep('form');
      });
      return;
    }

    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        if (checkoutPaymentMethod === 'wire') {
          // WIRE TRANSFER / CENTRAL HUB ROUTE
          const newReq = {
            id: `req_${Date.now()}`,
            companyName: activeCompanyName,
            packId: packId,
            interval: selectedInterval,
            price: checkoutPrice,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            contactEmail: currentUser?.email || (isSuperAdmin ? 'contact@elyssa.pro' : 'contact@entreprise.tn')
          };
          // Keep existing requests and append the new one so companies can place multiple parallel orders
          saveLicenceRequests([newReq, ...licenceRequests]);

          // Trigger admin alert
          const planTitle = checkoutPack?.name || `Module : ${checkoutModule?.name}`;
          addAdminAlert(`Demande de virement reçue : l'entreprise "${activeCompanyName}" demande l'activation du forfait "${planTitle}" (${selectedInterval === 'monthly' ? 'Mensuel' : selectedInterval === 'quarterly' ? 'Trimestriel' : 'Annuel'}) pour ${checkoutPrice} TND/mois.`, 'registration');
        } else {
          // INSTANT CREDIT CARD / E-DINAR DEMO ACTIVATION
          const genKey = `ELY-CB-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;
          const newReq = {
            id: `req_${Date.now()}`,
            companyName: activeCompanyName,
            packId: packId,
            interval: selectedInterval,
            price: checkoutPrice,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'approved' as const,
            paymentMethod: 'card' as const,
            licenseKey: genKey,
            contactEmail: currentUser?.email || (isSuperAdmin ? 'contact@elyssa.pro' : 'contact@entreprise.tn'),
            modules: checkoutModule ? [checkoutModule.id] : undefined
          };

          if (checkoutPack) {
            onUpdateSubscriptionPack(checkoutPack.id);
            localStorage.setItem('carthage_sub_pack', checkoutPack.id);
          } else if (checkoutModule) {
            const updated = [...purchasedModules, checkoutModule.id];
            onUpdatePurchasedModules(updated);
            localStorage.setItem(`carthage_purchased_modules_${activeCompanyName}`, JSON.stringify(updated));
            localStorage.setItem('carthage_purchased_modules', JSON.stringify(updated));
          }

          saveLicenceRequests([newReq, ...licenceRequests]);

          // Update publisherClients database immediately for instant activation
          const updatedClients = publisherClients.map(c => {
            if (c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
              const extraModules = checkoutModule ? [checkoutModule.id] : [];
              const isCustom = packId === 'custom';
              const merged = isCustom ? Array.from(new Set([
                ...(c.modules || []),
                ...extraModules
              ])) : c.modules;
              return {
                ...c,
                status: 'active' as const,
                packId: packId,
                interval: selectedInterval,
                joinedDate: new Date().toISOString().split('T')[0], // starts today
                modules: isCustom ? merged : c.modules
              };
            }
            return c;
          });
          updateClients(updatedClients);

          const planTitle = checkoutPack?.name || `Module : ${checkoutModule?.name}`;
          addAdminAlert(`Acquisition directe : l'entreprise "${activeCompanyName}" a acquis le pack "${planTitle}" (${selectedInterval === 'monthly' ? 'Mensuel' : selectedInterval === 'quarterly' ? 'Trimestriel' : 'Annuel'}) par Carte Bancaire (${checkoutPrice} TND/mois).`, 'acquisition');
        }
        handleCloseCheckout();
      }, 1500);
    }, 2000);
  };

  // --- ZERO-LOSS LICENSE ACTIVATION COUNTDOWN ---
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);
  const [countdownPack, setCountdownPack] = useState('');
  const [countdownModules, setCountdownModules] = useState<string[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdownValue > 0) {
      timer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
    } else if (showCountdown && countdownValue === 0) {
      const executeClearing = async () => {
        try {
          // Unblock auto-save/sync
          localStorage.removeItem('elyssa_sync_blocked');

          // Update active subscription pack state on frontend
          onUpdateSubscriptionPack(countdownPack);
          localStorage.setItem('carthage_sub_pack', countdownPack);

          // Store customized modules if custom or specific modules activated
          if (countdownModules && countdownModules.length > 0) {
            const key = `carthage_purchased_modules_${activeCompanyName}`;
            let existingModules: string[] = [];
            const savedStr = localStorage.getItem(key);
            if (savedStr) {
              try {
                existingModules = JSON.parse(savedStr);
              } catch (e) {}
            }
            const merged = Array.from(new Set([...existingModules, ...countdownModules]));
            localStorage.setItem(key, JSON.stringify(merged));
            onUpdatePurchasedModules(merged);
          } else if (countdownPack === 'custom') {
            const key = `carthage_purchased_modules_${activeCompanyName}`;
            const savedStr = localStorage.getItem(key);
            if (!savedStr || savedStr === '[]') {
              localStorage.setItem(key, JSON.stringify([]));
              onUpdatePurchasedModules([]);
            }
          }

          // Success feedback
          let mappedPackType: SaasPackType = 'CUSTOM';
          if (countdownPack === 'pos' || countdownPack === 'commerce') mappedPackType = 'COMMERCE_POS';
          else if (countdownPack === 'logistics' || countdownPack === 'wms') mappedPackType = 'LOGISTICS_WMS';
          else if (countdownPack === 'full' || countdownPack === 'industrial') mappedPackType = 'FULL_INDUSTRIAL';
          else if (countdownPack === 'trial' || countdownPack === 'FREE_TRIAL') mappedPackType = 'FREE_TRIAL';

          try {
            activateClientPack(activeCompanyName, activeCompanyName, mappedPackType, countdownModules);
          } catch (licErr) {
            console.warn('[SaaSConfig] Licensing activation error:', licErr);
          }

          const packDisplayName = countdownPack === 'full' 
            ? 'Elyssa Premium (Services & Commerce)' 
            : countdownPack === 'industrial' 
            ? 'Elyssa Industrielle & Intégrale'
            : countdownPack === 'logistics'
            ? 'Logistique & Négoce'
            : countdownPack === 'rh_only'
            ? 'RH & Secrétariat'
            : countdownPack === 'independent'
            ? 'Solo / Cabinet Pro'
            : 'Sur-mesure';

          setActivationStatus({
            type: 'success',
            message: `Félicitations ! La clé de licence est validée avec succès. Votre abonnement est maintenant configuré sur la formule "${packDisplayName}" !`
          });
          setActivationCode('');
          setShowCountdown(false);
        } catch (e) {
          console.error("Error activating license:", e);
        }
      };

      executeClearing();
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdownValue, countdownPack, countdownModules, activeCompanyName, onUpdateSubscriptionPack, onUpdatePurchasedModules]);

  const triggerLicenseActivation = (activePack: string, modules: string[] = []) => {
    // Block sync dynamically to prevent background auto-saves/conflicts
    localStorage.setItem('elyssa_sync_blocked', 'true');

    // Setup the countdown states
    setCountdownPack(activePack);
    setCountdownModules(modules);
    setCountdownValue(5);
    setShowCountdown(true);
  };

  const handleActivateLicenseCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = activationCode.trim().toUpperCase();
    if (!code) return;

    // Look for matching license key in the local requests queue
    const foundRequest = licenceRequests.find((r: any) => r.licenseKey && r.licenseKey.toUpperCase() === code);

    // Load keys from carthage_publisher_keys to find matching license key
    const keysSaved = localStorage.getItem('carthage_publisher_keys');
    let foundKey = null;
    if (keysSaved) {
      try {
        const keysList = JSON.parse(keysSaved);
        foundKey = keysList.find((k: any) => k.key.toUpperCase() === code);
      } catch (ev) {
        console.error(ev);
      }
    }

    if (foundRequest) {
      if (foundRequest.status === 'key_emitted' || foundRequest.status === 'approved') {
        const activePack = foundRequest.packId || 'full';
        
        // Auto-approve the request since the client has entered the valid license key
        const updatedReqs = licenceRequests.map((r: any) => {
          if (r.id === foundRequest.id) {
            return { ...r, status: 'approved' as const, clientSubmittedKey: true };
          }
          return r;
        });
        saveLicenceRequests(updatedReqs);

        let mergedModules: string[] = [];

        // Fully unlock client
        const updatedList = publisherClients.map(c => {
          if (c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
            mergedModules = Array.from(new Set([
              ...(c.modules || []),
              ...(foundRequest.modules || [])
            ]));
            return { 
              ...c, 
              packId: activePack, 
              status: 'active' as const,
              license_status: 'paid', // Mark as paid for durable DB status
              modules: activePack === 'custom' ? mergedModules : (foundRequest.modules || c.modules)
            };
          }
          return c;
        });

        const companyExists = publisherClients.some(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
        if (!companyExists) {
          mergedModules = foundRequest.modules || [];
          updatedList.push({
            id: `pc_${Date.now()}`,
            companyName: activeCompanyName,
            location: 'Tunis',
            packId: activePack,
            paymentGateway: 'Poste', 
            status: 'active',
            license_status: 'paid', // Mark as paid
            joinedDate: new Date().toISOString().split('T')[0],
            modules: foundRequest.modules
          });
        }

        updateClients(updatedList);

        // Emit high-visibility notification for administrative tracking
        addAdminAlert(`Abonnement activé d'un clic : l'entreprise "${activeCompanyName}" a validé sa clé de licence "${code}" avec succès pour la formule "${activePack === 'full' ? 'Intégrale' : activePack === 'custom' ? 'Sur-mesure' : activePack}".`, 'acquisition');

        // Trigger delayed countdown transition and secure atomic cleaning
        triggerLicenseActivation(activePack, mergedModules);
        return;
      }
    }

    // Support fallback direct activation parsing if there is no matching key saved, or for demo safety
    let parsedPackId = '';
    if (!foundKey) {
      // Direct parse fallback
      const parts = code.split('-');
      if ((parts[0] === 'ELY' || parts[0] === 'CRT') && parts[2] === '2026') {
        const packCode = parts[1];
        if (packCode === 'RH_O') parsedPackId = 'rh_only';
        else if (packCode === 'INDE') parsedPackId = 'independent';
        else if (packCode === 'LOGI') parsedPackId = 'logistics';
        else if (packCode === 'FULL') parsedPackId = 'full';
        else if (packCode === 'CUST') parsedPackId = 'custom';
      }
    } else {
      parsedPackId = foundKey.packId;
    }

    if (foundKey || parsedPackId) {
      const activePack = parsedPackId || (foundKey ? foundKey.packId : 'custom');
      
      let customModules: string[] = [];
      if (activePack === 'custom') {
        const correspondingReqs = licenceRequests.filter(
          (r: any) =>
            r.companyName?.toLowerCase() === activeCompanyName?.toLowerCase() &&
            Array.isArray(r.modules) &&
            r.modules.length > 0
        );
        customModules = Array.from(new Set(correspondingReqs.flatMap((r: any) => r.modules)));
      }

      let mergedModules: string[] = [];

      // Update this company's subscription pack inside publisherClients
      const updatedList = publisherClients.map(c => {
        if (c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
          mergedModules = Array.from(new Set([
            ...(c.modules || []),
            ...customModules
          ]));
          return { 
            ...c, 
            packId: activePack, 
            status: 'active' as const, 
            license_status: 'paid',
            modules: activePack === 'custom' ? mergedModules : c.modules
          };
        }
        return c;
      });

      // If the company doesn't exist yet, let's create it on the fly!
      const companyExists = publisherClients.some(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
      if (!companyExists) {
        mergedModules = customModules;
        updatedList.push({
          id: `pc_${Date.now()}`,
          companyName: activeCompanyName,
          location: 'Tunis',
          packId: activePack,
          paymentGateway: 'SPS',
          status: 'active',
          license_status: 'paid', // Mark as paid
          joinedDate: new Date().toISOString().split('T')[0],
          modules: activePack === 'custom' ? customModules : undefined
        });
      }

      updateClients(updatedList);

      // Trigger delayed countdown transition and secure atomic cleaning
      triggerLicenseActivation(activePack, mergedModules);
    } else {
      setActivationStatus({
        type: 'error',
        message: "Code clé invalide ou expiré. Veuillez contacter Elyssa Entreprises pour obtenir une clé de licence commerciale valide."
      });
    }
  };

  const handleUpdatePackField = (packId: string, field: string, value: any) => {
    const nextPacks = customPacks.map(p => {
      if (p.id === packId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onUpdateCustomPacks(nextPacks);
  };

  const handleTogglePackModule = (packId: string, moduleId: string) => {
    const nextPacks = customPacks.map(p => {
      if (p.id === packId) {
        const isIncluded = p.modules.includes(moduleId);
        const nextModules = isIncluded
          ? p.modules.filter((m: string) => m !== moduleId)
          : [...p.modules, moduleId];
        return { ...p, modules: nextModules };
      }
      return p;
    });
    onUpdateCustomPacks(nextPacks);
  };

  // Publisher Logic handlers
  const handleAddPublisherClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const newClient: PublisherClient = {
      id: `pc-${Date.now()}`,
      companyName: newCompName.trim(),
      location: newLocation,
      packId: newPackId,
      paymentGateway: newGateway,
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0],
      interval: newInterval
    };

    const updated = [newClient, ...publisherClients];
    updateClients(updated);

    // Dynamically draft a primary Manager collaborator for this new company to facilitate testing
    const domainPart = newCompName.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0305-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, '') || 'entreprise';
    const primaryCollab = {
      id: `collab_auto_${Date.now()}`,
      name: `Directeur de ${newCompName.trim()}`,
      email: `contact@${domainPart}.tn`,
      password: 'Carthage2026!',
      role: 'Manager' as const,
      status: 'Active' as const,
      company: newCompName.trim(),
      phone: '+216 71 000 000',
      department: 'Direction Générale',
      assignedTasks: [],
      createdDate: new Date().toISOString().split('T')[0],
      joinedDate: new Date().toISOString().split('T')[0]
    };
    onUpdateCollaborators([...collaborators, primaryCollab]);

    // Reset form
    setNewCompName('');

    // Emit registration alert witness
    addAdminAlert(`Nouvelle entreprise enregistrée : "${newClient.companyName}" à ${newClient.location} (${newInterval === 'monthly' ? 'Mensuel' : newInterval === 'quarterly' ? 'Trimestriel' : 'Annuel'}). Un compte d'accès Directeur a été configuré.`, 'registration');
    
    // show a temporary confirmation alert
    setSimulationAlert(`Félicitations ! L'entreprise "${newClient.companyName}" a été enregistrée. Utilisez l'email "${primaryCollab.email}" et le mot de passe "Carthage2026!" pour vous y connecter instantanément !`);
    setTimeout(() => setSimulationAlert(null), 8000);
  };

  const handleDeletePublisherClient = (id: string) => {
    const { realId, list } = getLatestClientsWithPromotion(id);
    let client = list.find(c => c.id === realId || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (!client) {
      const foundInMerged = mergedClients.find(c => c.id === id || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
      if (foundInMerged) {
        client = {
          id: foundInMerged.id,
          companyName: foundInMerged.companyName,
          location: foundInMerged.location || 'Tunis',
          packId: foundInMerged.packId || 'trial',
          paymentGateway: foundInMerged.paymentGateway || 'Virement',
          status: foundInMerged.status || 'trial',
          joinedDate: foundInMerged.joinedDate || new Date().toISOString().split('T')[0],
          interval: foundInMerged.interval || 'monthly'
        };
      }
    }
    if (client) {
      setClientToDelete(client);
    }
  };

  const confirmDeletePublisherClient = async () => {
    if (clientToDelete) {
      const targetName = clientToDelete.companyName?.toLowerCase();
      const targetId = clientToDelete.id;

      try {
        await deleteCompanyFromDb(targetId, clientToDelete.companyName);
      } catch (err) {
        console.warn("deleteCompanyFromDb error in SaaSConfig:", err);
      }

      const updated = publisherClients.filter(c => 
        c.id !== targetId && 
        (targetName ? c.companyName?.toLowerCase() !== targetName : true)
      );
      updateClients(updated);

      // Clean up license requests for this company to make sure there are no lingering blocks in the Hub
      const updatedRequests = licenceRequests.filter(req => 
        req.id !== targetId &&
        (targetName ? req.companyName?.toLowerCase() !== targetName : true)
      );
      saveLicenceRequests(updatedRequests);

      // Clean up teams / collaborators belonging to this company (keep essential admins)
      const updatedCollabs = collaborators.filter(c => 
        (targetName ? c.company?.toLowerCase() !== targetName : true) || 
        c.email?.toLowerCase() === 'contact@elyssa.pro'
      );
      onUpdateCollaborators(updatedCollabs);

      // Reset simulated active company if we deleted the active one
      if (targetName && activeCompanyName?.toLowerCase() === targetName) {
        onUpdateActiveCompanyName('Inter-Affaires');
        localStorage.setItem('carthage_active_company_simulated', 'Inter-Affaires');
        onUpdatePurchasedModules([]);
      }

      // Clear purchased modules list from localStorage to avoid lingering active modules if re-registered
      if (clientToDelete.companyName) {
        localStorage.removeItem(`carthage_purchased_modules_${clientToDelete.companyName}`);
        if (targetName) localStorage.removeItem(`carthage_purchased_modules_${targetName}`);
      }

      setSimulationAlert(`Le compte entreprise "${clientToDelete.companyName}", ses collaborateurs associés et toutes ses commandes en attente ont été définitivement purgés.`);
      setClientToDelete(null);
      setTimeout(() => setSimulationAlert(null), 4500);
    }
  };

  const handleToggleClientStatus = (id: string) => {
    const { realId, list } = getLatestClientsWithPromotion(id);
    const targetClient = list.find(c => c.id === realId || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (!targetClient) return;

    const nextStatusMap: Record<string, 'active' | 'suspended' | 'trial'> = {
      'active': 'suspended',
      'suspended': 'trial',
      'trial': 'active'
    };
    const nextStatus = nextStatusMap[targetClient.status] || 'active';
    const targetName = targetClient.companyName?.toLowerCase();

    const updated = list.map(c => {
      if (c.id === realId || (targetName && c.companyName?.toLowerCase() === targetName)) {
        return { ...c, status: nextStatus };
      }
      return c;
    });
    updateClients(updated);

    const updatedReqs = licenceRequests.map(req => {
      if (req.id === realId || (targetName && req.companyName?.toLowerCase() === targetName)) {
        return { ...req, status: nextStatus === 'suspended' ? 'suspended' : 'approved' };
      }
      return req;
    });
    saveLicenceRequests(updatedReqs);
  };

  const handleToggleClientSuspend = (id: string) => {
    const { realId, list } = getLatestClientsWithPromotion(id);
    const targetClient = list.find(c => c.id === realId || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (!targetClient) return;

    const nextStatus: 'active' | 'suspended' = targetClient.status === 'suspended' ? 'active' : 'suspended';
    const targetName = targetClient.companyName?.toLowerCase();

    const updated = list.map(c => {
      if (c.id === realId || (targetName && c.companyName?.toLowerCase() === targetName)) {
        return { ...c, status: nextStatus };
      }
      return c;
    });
    updateClients(updated);

    const updatedReqs = licenceRequests.map(req => {
      if (req.id === realId || (targetName && req.companyName?.toLowerCase() === targetName)) {
        return { ...req, status: nextStatus === 'suspended' ? 'suspended' : 'approved' };
      }
      return req;
    });
    saveLicenceRequests(updatedReqs);

    setSimulationAlert(
      nextStatus === 'suspended'
        ? `⛔ L'accès entreprise de "${targetClient.companyName}" a été suspendu (Hors Service).`
        : `✅ L'accès entreprise de "${targetClient.companyName}" a été réactivé (Actif).`
    );
    setTimeout(() => setSimulationAlert(null), 4000);
  };

  const handleRequestClientSuspend = (id: string) => {
    const { realId, list } = getLatestClientsWithPromotion(id);
    let client = list.find(c => c.id === realId || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (!client) {
      const foundInMerged = mergedClients.find(c => c.id === id || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
      if (foundInMerged) {
        client = {
          id: foundInMerged.id,
          companyName: foundInMerged.companyName,
          location: foundInMerged.location || 'Tunis',
          packId: foundInMerged.packId || 'trial',
          paymentGateway: foundInMerged.paymentGateway || 'Virement',
          status: foundInMerged.status || 'trial',
          joinedDate: foundInMerged.joinedDate || new Date().toISOString().split('T')[0],
          interval: foundInMerged.interval || 'monthly'
        };
      }
    }
    if (client) {
      setClientToSuspend(client);
    }
  };

  const handleToggleClientDiscount = (id: string) => {
    const { realId, list } = getLatestClientsWithPromotion(id);
    const targetClient = list.find(c => c.id === realId || (c.companyName && id && c.companyName.toLowerCase() === id.toLowerCase()));
    if (!targetClient) return;

    const targetName = targetClient.companyName?.toLowerCase();
    const updated = list.map(c => {
      if (c.id === realId || (targetName && c.companyName?.toLowerCase() === targetName)) {
        return { ...c, customDiscount: !c.customDiscount };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleGenerateLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = genClientName.trim() || 'Client Elyssa';
    
    // Generate code standard, e.g., ELY-PK-YEAR-HASH-HASH
    const packCode = genPackId.toUpperCase().slice(0, 4);
    const randPart1 = Math.random().toString(16).substr(2, 4).toUpperCase();
    const randPart2 = Math.random().toString(16).substr(2, 4).toUpperCase();
    const generatedKey = `ELY-${packCode}-2026-${randPart1}-${randPart2}`;

    setGeneratedKeyCode(generatedKey);

    const newKeyLog: GeneratedKeyLog = {
      key: generatedKey,
      packId: genPackId,
      clientName: nameToUse,
      duration: genDuration === '1_month' ? '1 Mois' : genDuration === '3_months' ? '3 Mois' : '12 Mois (Annuel)',
      createdAt: new Date().toLocaleDateString('fr-TN', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newKeyLog, ...recentKeys].slice(0, 10); // Keep last 10
    saveRecentKeys(updated);
  };

  const handleCreateSimulatedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simOrderCompanyName.trim()) return;

    const normalizedCompanyName = simOrderCompanyName.trim();
    
    // Check if a request already exists for this company
    const requestExists = licenceRequests.some(
      (r: any) => r.companyName?.toLowerCase() === normalizedCompanyName.toLowerCase() && r.status !== 'approved'
    );
    if (requestExists) {
      setSimulationAlert(`Une demande ou commande est déjà en cours pour "${normalizedCompanyName}" dans le Hub.`);
      setTimeout(() => setSimulationAlert(null), 4000);
      return;
    }

    const newReq = {
      id: `req_sim_${Date.now()}`,
      companyName: normalizedCompanyName,
      packId: simOrderPackId,
      interval: simOrderInterval,
      price: Number(simOrderPrice) || 199,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      contactEmail: simOrderEmail || `${normalizedCompanyName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      modules: simOrderPackId === 'custom' ? simOrderModules : []
    };

    saveLicenceRequests([newReq, ...licenceRequests]);
    
    // Trigger notification/witness alert
    addAdminAlert(
      `Nouvelle commande de test générée : "${newReq.companyName}" (${newReq.packId === 'full' ? 'Elyssa Intégrale' : newReq.packId === 'independent' ? 'Elyssa Indépendant' : 'Formule ' + newReq.packId}).`,
      'registration'
    );

    setSimulationAlert(`Succès : Commande d'achat simulée créée pour "${normalizedCompanyName}". Elle est visible ci-dessous.`);
    setTimeout(() => setSimulationAlert(null), 5000);

    // Reset simulator inputs
    setSimOrderCompanyName('');
    setSimOrderEmail('');
    setSimOrderModules(['cession', 'reports']);
    setShowSimOrderForm(false);
  };

  const handleEmitLicenseKey = (reqId: string) => {
    const list = licenceRequests.map(req => {
      if (req.id === reqId) {
        // Generate license key
        const randHex = Math.random().toString(16).substring(2, 6).toUpperCase();
        const licenseKey = `ELY-VAL-2026-${randHex}`;
        
        // Add inside recentKeys as a key awaiting payment
        const newKeyLog = {
          key: licenseKey,
          packId: req.packId,
          clientName: req.companyName,
          duration: req.interval === 'yearly' ? '12 Mois (Annuel)' : req.interval === 'quarterly' ? '3 Mois' : '1 Mois',
          createdAt: new Date().toLocaleDateString('fr-TN', { hour: '2-digit', minute: '2-digit' })
        };
        saveRecentKeys([newKeyLog, ...recentKeys]);
        
        // Add as client trial-restricted standard in publisher list
        const companyExists = publisherClients.some(c => c?.companyName?.toLowerCase() === req?.companyName?.toLowerCase());
        if (!companyExists) {
          const newClient: PublisherClient = {
            id: `pc-${Date.now()}`,
            companyName: req.companyName,
            location: 'Tunis',
            packId: req.packId,
            paymentGateway: 'Poste', 
            status: 'trial', // Marked as trial, so they are restricted in workspace
            joinedDate: new Date().toISOString().split('T')[0],
            interval: req.interval || 'monthly'
          };
          updateClients([newClient, ...publisherClients]);
        }

        setSimulationAlert(`CLÉ DE LICENCE ÉMISE ! Clé : "${licenseKey}" générée pour ${req.companyName}. Elle est à présent disponible dans leur Espace client.`);
        setTimeout(() => setSimulationAlert(null), 8500);

        return {
          ...req,
          status: 'key_emitted',
          licenseKey
        };
      }
      return req;
    });
    saveLicenceRequests(list);
  };

  const handleActivateLicenseRequest = (reqId: string) => {
    const list = licenceRequests.map(req => {
      if (req.id === reqId) {
        // Calculate merged modules first if they exist
        let mergedModules: string[] = [];
        if (req.modules && req.modules.length > 0) {
          const key = `carthage_purchased_modules_${req.companyName}`;
          let existingModules: string[] = [];
          const savedStr = localStorage.getItem(key);
          if (savedStr) {
            try {
              existingModules = JSON.parse(savedStr);
            } catch (e) {}
          }
          mergedModules = Array.from(new Set([...existingModules, ...req.modules]));
          localStorage.setItem(key, JSON.stringify(mergedModules));
          if (req?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
            onUpdatePurchasedModules(mergedModules);
          }
        }

        // Find if they are in publisher clients and set to active
        const updatedClients = publisherClients.map(c => {
          if (c?.companyName?.toLowerCase() === req?.companyName?.toLowerCase()) {
            const finalMerged = Array.from(new Set([
              ...(c.modules || []),
              ...mergedModules
            ]));
            return { 
              ...c, 
              status: 'active' as const, 
              packId: req.packId,
              interval: req.interval || 'monthly',
              joinedDate: new Date().toISOString().split('T')[0], // Resets starting date upon active approval
              modules: req.packId === 'custom' && finalMerged.length > 0 ? finalMerged : c.modules
            };
          }
          return c;
        });

        const companyExists = publisherClients.some(c => c?.companyName?.toLowerCase() === req?.companyName?.toLowerCase());
        if (!companyExists) {
          updatedClients.push({
            id: `pc-${Date.now()}`,
            companyName: req.companyName,
            location: 'Tunis',
            packId: req.packId,
            paymentGateway: 'Poste', 
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0],
            interval: req.interval || 'monthly',
            modules: mergedModules.length > 0 ? mergedModules : undefined
          });
        }
        updateClients(updatedClients);

        // Also if this matches the current active company, let's update current sub pack!
        if (req?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()) {
          onUpdateSubscriptionPack(req.packId);
          localStorage.setItem('carthage_sub_pack', req.packId);
        }

        // Emit high-visibility audit alert in SuperAdmin Dashboard
        const planName = req.packId === 'full' ? 'Intégrale' : req.packId === 'custom' ? 'À la carte' : req.packId;
        addAdminAlert(`Abonnement validé : l'entreprise "${req.companyName}" a activé le pack "${planName}" (${req.interval === 'monthly' ? 'Mensuel' : req.interval === 'quarterly' ? 'Trimestriel' : 'Annuel'}) pour ${req.price} TND/mois après confirmation de réception de son virement.`, 'acquisition');

        setSimulationAlert(`VIREMENT REÇU & LICENCE ACTIVÉE ! L'accès de l'entreprise "${req.companyName}" est débloqué.`);
        setTimeout(() => setSimulationAlert(null), 8500);

        return {
          ...req,
          status: 'approved'
        };
      }
      return req;
    });
    saveLicenceRequests(list);
  };

  const handleDeleteLicenseRequest = (reqId: string) => {
    const req = licenceRequests.find(r => r.id === reqId);
    if (req) {
      setRequestToDelete(req);
    }
  };

  const confirmDeleteLicenseRequest = () => {
    if (requestToDelete) {
      const list = licenceRequests.filter(req => req.id !== requestToDelete.id);
      saveLicenceRequests(list);
      setRequestToDelete(null);
      setSimulationAlert("Demande d'abonnement / virement supprimée du Hub de communication avec succès.");
      setTimeout(() => setSimulationAlert(null), 4500);
    }
  };

  const handleSendInvoiceSimulation = (clientName: string) => {
    setSimulationAlert(`Facture mensuelle et état d'encaissement générés. Notification SMTP de Carthage Pay envoyée avec succès à l'adresse gérante de "${clientName}".`);
    setTimeout(() => setSimulationAlert(null), 6000);
  };

  // Helper calculation for simulated metrics
  const calculateTotalMRR = (): number => {
    let baseMRR = publisherClients.reduce((acc, client) => {
      if (!isSimulationActive && client.id.startsWith('pc-demo-')) return acc;
      if (client.status === 'suspended') return acc;
      const basePack = customPacks.find(p => p.id === client.packId);
      let price = basePack ? basePack.price : 0;
      
      if (client.packId === 'custom') {
        const key = `carthage_purchased_modules_${client.companyName}`;
        const savedModules = localStorage.getItem(key);
        let modulesList: string[] = [];
        if (savedModules) {
          try {
            modulesList = JSON.parse(savedModules);
          } catch (e) {}
        }
        price = ALL_MODULES_METADATA.filter(m => modulesList.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
      }

      // Apply interval discount
      if (client.interval === 'yearly') {
        price = Math.round(price * 0.8);
      } else if (client.interval === 'quarterly') {
        price = Math.round(price * 0.9);
      }
      
      // Apply custom discount if any
      if (client.customDiscount) {
        price = Math.round(price * 0.8); // Additional 20% discount
      }
      return acc + price;
    }, 0);

    if (isSimulationActive) {
      baseMRR += 14850;
    }
    return baseMRR;
  };

  const calculateActiveCount = (): number => {
    const realActiveCount = publisherClients.filter(c => 
      (c.status === 'active' || c.status === 'trial') && 
      (isSimulationActive || !c.id.startsWith('pc-demo-'))
    ).length;
    return realActiveCount + (isSimulationActive ? 32 : 0);
  };

  return (
    <div className="space-y-8" id="saas-modular-management">
      
      {/* ZERO-LOSS COUNTDOWN OVERLAY MODAL */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md"
            id="elyssa-license-activation-countdown-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl shadow-indigo-500/10"
            >
              {/* Animated pulsating ring with the countdown value */}
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center mx-auto relative">
                <span className="text-4xl font-black text-indigo-400 font-mono">
                  {countdownValue}
                </span>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-25"></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Licence activée !
                </h3>
                <p className="text-sm text-slate-300 font-medium leading-relaxed px-4">
                  Elyssa prépare votre espace de travail sécurisé...
                </p>
              </div>

              {/* Secure feedback indicator */}
              <div className="bg-indigo-950/40 border border-indigo-800/30 py-3 px-4 rounded-xl text-xs text-indigo-300 flex items-center justify-center gap-2 max-w-xs mx-auto">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Activation et mise à jour de la licence en cours...</span>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                SÉCURISATION DES DONNÉES ACTIVES • SYNC_BLOCKED
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Real-time live notifications stack overlay */}
      <div className="fixed top-24 right-6 z-[1000] flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {liveNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.15 } }}
              layout
              className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-auto select-none relative overflow-hidden flex flex-col gap-2.5 transition text-left ${
                notif.type === 'registration'
                  ? 'bg-slate-900/95 border-indigo-500/40 text-white shadow-indigo-950/60 [box-shadow:0_10px_30px_rgba(79,70,229,0.25)]'
                  : notif.type === 'acquisition'
                  ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-950/60 [box-shadow:0_10px_30px_rgba(16,185,129,0.25)]'
                  : notif.type === 'warning'
                  ? 'bg-slate-900/95 border-amber-500/40 text-white shadow-amber-950/60 [box-shadow:0_10px_30px_rgba(245,158,11,0.25)]'
                  : notif.type === 'key_emitted'
                  ? 'bg-slate-900/95 border-pink-500/40 text-white shadow-pink-950/60 [box-shadow:0_10px_30px_rgba(236,72,153,0.25)]'
                  : 'bg-slate-900/95 border-teal-500/40 text-white shadow-teal-950/60 [box-shadow:0_10px_30px_rgba(20,184,166,0.25)]'
              }`}
            >
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex items-start justify-between gap-3 relative">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    notif.type === 'registration'
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50'
                      : notif.type === 'acquisition'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                      : notif.type === 'warning'
                      ? 'bg-amber-955 text-amber-400 border border-amber-900/50'
                      : notif.type === 'key_emitted'
                      ? 'bg-pink-950 text-pink-400 border border-pink-900/50 animate-pulse'
                      : 'bg-teal-950 text-teal-400 border border-teal-900/50'
                  }`}>
                    {notif.type === 'registration' && <Building2 className="w-4 h-4" />}
                    {notif.type === 'acquisition' && <Coins className="w-4 h-4 animate-bounce" />}
                    {notif.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                    {notif.type === 'key_emitted' && <Key className="w-4 h-4" />}
                    {notif.type === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider font-sans opacity-90 text-slate-300">
                      {notif.title}
                    </h5>
                    <p className="text-[11px] font-bold leading-normal text-slate-100 font-sans">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLiveNotification(notif.id)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer shrink-0 border-0"
                >
                  <span className="text-xs font-bold px-1">×</span>
                </button>
              </div>

              {/* Action shortcuts */}
              {notif.type === 'key_emitted' && notif.meta?.licenseKey && (
                <div className="mt-1.5 flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black tracking-widest text-amber-400">{notif.meta.licenseKey}</span>
                    <span className="text-[8px] font-bold text-amber-500 uppercase font-sans">Prêt</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivationCode(notif.meta.licenseKey);
                      navigator.clipboard.writeText(notif.meta.licenseKey);
                      removeLiveNotification(notif.id);
                      setActivationStatus({
                        type: 'success',
                        message: `Clé ${notif.meta.licenseKey} copiée et saisie ! Cliquez sur "Activer Clé" pour l'intégrer.`
                      });
                      document.getElementById('license-activation-input')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9px] uppercase py-2 px-3 rounded-xl border-0 cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950"
                  >
                    <Key className="w-3 h-3 text-indigo-200" />
                    <span>Saisir & Activer Clé Maintenant</span>
                  </button>
                </div>
              )}

              {notif.meta?.targetHub && (
                <button
                  type="button"
                  onClick={() => {
                    removeLiveNotification(notif.id);
                    document.getElementById('internal-communication-hub')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-1.5 w-full bg-slate-800 hover:bg-slate-750 text-indigo-300 font-extrabold text-[9px] uppercase py-2 px-3 rounded-xl border border-slate-700/60 cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3 h-3" />
                  <span>Accéder au Hub de Communication</span>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Simulation alert toast */}
      {simulationAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border-2 border-indigo-500 text-white rounded-2xl p-4 shadow-xl flex items-start gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-[10px] font-black uppercase text-indigo-300">Notification Éditeur</h5>
            <p className="text-[11px] font-bold leading-normal text-slate-200">{simulationAlert}</p>
          </div>
        </div>
      )}

      {/* View Switcher Bar at the Top (SuperAdmin only) */}
      {isSuperAdmin ? (
        <div className="flex flex-col sm:flex-row bg-slate-900 p-2.5 rounded-2xl border border-slate-800 justify-between items-center gap-3">
          <div className="flex items-center gap-2 pl-1.5">
            <Building className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-sans">
              Portail d'Administration CRM & Gestion des Licences
            </span>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('client')}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'client'
                  ? 'bg-indigo-650 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 opacity-80" />
              <span>🔑 Tarifs & Offres Client</span>
            </button>
            
            <button
              type="button"
              onClick={() => setViewMode('publisher')}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'publisher'
                  ? 'bg-indigo-650 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 opacity-80" />
              <span>👑 Console Suivi Éditeur</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-950 p-2 rounded-xl border border-indigo-900 shrink-0">
              <Building className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Abonnement & Modules de l'Entreprise</div>
              <h2 className="text-sm font-black text-white uppercase tracking-tight">
                {activeCompanyName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 uppercase tracking-widest leading-none">
              Formule active : {activeSubscriptionPackId === 'full' ? 'Intégrale' : activeSubscriptionPackId === 'custom' ? 'Sur-mesure (Activée par Clé)' : activeSubscriptionPackId}
            </span>
          </div>
        </div>
      )}

      {!showPublisher ? (
        <>
          {/* Banner Intro */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-indigo-950 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute left-1/3 bottom-0 w-80 h-32 bg-indigo-600 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-2 bg-indigo-950/40 border border-indigo-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Architecture Modulaire & Licences à la Carte</span>
              </div>
              <h2 className="text-xl md:text-3xl font-black font-display text-white tracking-tight leading-none leading-normal">
                Partitionnez votre CRM selon vos besoins et maîtrisez vos coûts
              </h2>
              <p className="text-slate-300 font-semibold text-xs md:text-sm leading-relaxed font-sans">
                Configurez des fiches de service sur-mesure pour chaque collaborateur ou chaque type d'entreprise. Pour les cabinets individuels d'une seule personne, n'utilisez que la comptabilité et facturation. À l'inverse, activez l'étude ou l'investissement boursier à tout instant à la carte en payant en direct.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-semibold text-indigo-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Changement instantané sans rechargement</span>
                </div>
                <div className="hidden sm:block text-slate-700 font-bold">•</div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Paiements nationaux sécurisés (Cartes Bancaires, e-DINAR)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 📋 MARCHE À SUIVRE POUR L'ESSAI GRATUIT & ACTIVATION DES LICENCES */}
          {isSuperAdmin && backendConfig?.showEvaluationGuide && (
            <EvaluationGuideComponent
              activeCompanyName={activeCompanyName}
              trialDurationDays={trialDurationDays}
              trialExpiredOverride={trialExpiredOverride}
              handleUpdateTrialExpiredOverride={handleUpdateTrialExpiredOverride}
              isSimulationActive={isSimulationActive}
              setIsSimulationActive={setIsSimulationActive}
              onUpdateTrialDurationDays={onUpdateTrialDurationDays}
            />
          )}

          {/* Suivi des Commandes / Clés d'Activation du client */}
          {myPendingRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans px-1">
                Suivi de vos Commandes d'Activation en cours
              </h4>
              {myPendingRequests.map((req: any) => {
                const status = req.status || 'pending';
                const isPending = status === 'pending';
                const isEmitted = status === 'key_emitted';
                const isApproved = status === 'approved';

                return (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-sans relative overflow-hidden shadow-xl">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-32 h-32 bg-indigo-500 opacity-5 rounded-full blur-2xl"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="p-1 px-2 rounded-lg bg-indigo-950/80 border border-indigo-900 text-indigo-400 font-mono text-[9px] font-bold">
                          COMMANDE #{req.id.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-black text-white uppercase font-display mr-2">
                          Formule {req.packId === 'full' ? 'Intégrale' : req.packId} • {req.interval === 'yearly' ? 'Annuel' : 'Mensuel'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleDeleteLicenseRequest(req.id)}
                          className="px-2 py-0.5 bg-rose-955 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-rose-900/40 rounded text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                          title="Annuler et supprimer cette commande d'achat"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Annuler la commande</span>
                        </button>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider font-mono border ${
                        isPending 
                          ? 'bg-red-950/90 text-red-400 border-red-900/40 animate-pulse' 
                          : isEmitted
                          ? 'bg-amber-955 text-amber-400 border-amber-900/40'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-900/40'
                      }`}>
                        {isPending 
                          ? '● Étape 1 : Attente Émission Clé ...' 
                          : isEmitted 
                          ? '🔏 Étape 2 : Clé Émise - Attente Règlement' 
                          : '✓ Licence Activée'
                        }
                      </span>
                    </div>

                    {isPending && (
                      <div className="space-y-3 text-xs">
                        <p className="text-slate-400 leading-relaxed font-semibold">
                          Notre service réceptif a validé technologiquement votre demande pour <strong className="text-white uppercase">{req.companyName}</strong>. 
                          La clé de licence sera émise dès confirmation de votre ordre de virement bancaire de <strong className="text-emerald-450 font-semibold font-mono">{req.price} TND</strong>.
                        </p>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 font-mono text-[10px]">
                          <p className="text-slate-500 uppercase font-black text-[9px] tracking-wider leading-none">Coordonnées de Virement Bancaire Elyssa :</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                            <p>Banque : <strong className="text-white">BIAT Agence Tunis Belvédère</strong></p>
                            <p>Bénéficiaire : <strong className="text-indigo-300">ELYSSA SOLUTIONS ENTREPRISES S.A.</strong></p>
                            <p className="md:col-span-2">RIB Tunisien : <strong className="text-emerald-400 select-all font-bold">08 045 0001234567890 42</strong></p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isEmitted && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-350 leading-relaxed font-semibold">
                          <p>
                            🎉 <strong>Bonne nouvelle !</strong> Votre clé de licence sécurisée a été générée par l'éditeur. 
                          </p>
                          {req.clientSubmittedKey ? (
                            <p className="text-emerald-400 font-bold mt-2 flex items-center gap-1.5 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30">
                              <span>✔️ Clé saisie et validée de votre côté. L'assistance Elyssa procèdera à l'activation complète dès confirmation de notre service comptabilité après vérification du virement de {req.price} TND.</span>
                            </p>
                          ) : (
                            <p className="text-amber-400 font-bold mt-2">
                              👉 Recopiez et insérez cette clé dans le champ d'activation sécurisé ci-dessous pour l'enregistrer dans votre espace de travail.
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black leading-none block font-mono">Clé de licence attribuée :</span>
                            <span className="text-amber-400 font-mono text-sm font-black tracking-widest block select-all">{req.licenseKey}</span>
                          </div>
                          {!req.clientSubmittedKey && (
                            <button
                              type="button"
                              onClick={() => {
                                setActivationCode(req.licenseKey);
                                navigator.clipboard.writeText(req.licenseKey);
                                // Set feedback
                                setActivationStatus({
                                  type: 'success',
                                  message: `Clé ${req.licenseKey} copiée ! Cliquez maintenant sur le bouton "Activer Clé" pour l'intégrer.`
                                });
                              }}
                              className="bg-amber-600 hover:bg-amber-550 text-white font-black text-[10px] uppercase py-2 px-4 rounded-xl border-0 cursor-pointer transition"
                            >
                              Copier & Saisir la Clé
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {isApproved && (
                      <p className="text-xs text-emerald-400 font-bold leading-relaxed flex items-center gap-2 bg-emerald-950/20 p-3 rounded-2xl border border-emerald-900/30 font-sans">
                        <span>✔️ Validation administrative complète effectuée ! Votre forfait Elyssa est maintenant 100% opérationnel sans aucune restriction.</span>
                      </p>
                    )}

                    {/* Official Documents Quick Actions */}
                    <div className="pt-3 border-t border-slate-850 flex flex-wrap gap-2.5 items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold">
                        <span>Documents comptables tunisiens :</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDoc(req)}
                          className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Consulter & Imprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* License Key Activation Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500 opacity-5 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-900 text-indigo-450">
                    <Key className="w-5 h-5 text-indigo-400" />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                    <span>Chambre d'Activation de Licence & Clés</span>
                    <span className="bg-indigo-950/80 border border-indigo-800 text-indigo-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Sécurisée</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed font-sans">
                  Vous avez reçu une clé d'activation par email de la part de l'éditeur Elyssa Entreprises ? Saisissez-la ci-dessous pour débloquer automatiquement les modules pré-configurés de votre entreprise.
                </p>
                {activationStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                      activationStatus.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                        : 'bg-rose-950/40 border-rose-800 text-rose-455'
                    }`}
                  >
                    {activationStatus.message}
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleActivateLicenseCode} className="w-full lg:max-w-md shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="license-activation-input"
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="ex: ELY-FULL-2026-F578-D912"
                    className="w-full bg-slate-950 text-white border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 rounded-xl text-xs font-mono uppercase placeholder-slate-700 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center gap-2"
                >
                  <span>Activer Clé</span>
                  <ArrowRight className="w-4 h-4 text-indigo-200" />
                </button>
              </form>
            </div>
          </div>

      {/* Global Display preferences settings */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Option d'affichage de la Barre des Menus</span>
          </h4>
          <p className="text-[11px] text-slate-400 leading-normal font-semibold">
            Définissez comment réagit l'interface pour les services hors de votre pack : masquage rigoureux ou affichage freemium interactif.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all duration-200 ${
            hideLockedModules 
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-xs' 
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {hideLockedModules ? "Masquage intégral actif" : "Afficher avec indicateur (🔒)"}
          </span>
          <button
            type="button"
            onClick={() => {
              const newVal = !hideLockedModules;
              onUpdateHideLockedModules(newVal);
              localStorage.setItem('carthage_hide_locked_modules', newVal ? 'true' : 'false');
            }}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none cursor-pointer border shadow-md ${
              hideLockedModules 
                ? 'bg-emerald-500 border-emerald-300 justify-end shadow-emerald-900/50' 
                : 'bg-slate-700 border-slate-600 justify-start'
            }`}
            title="Basculer le mode de masquage"
          >
            <motion.div 
              layout 
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="bg-white w-5 h-5 rounded-full shadow-md flex items-center justify-center font-bold text-[10px] text-slate-900" 
            />
          </button>
        </div>
      </div>

      {/* SECTION 1: PACKS SELECTION */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Formules et Forfaits Prédéfinis</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Sélectionnez la formule métiers adaptée ou composez votre forfait à la carte.</p>
          </div>

          {/* 🕒 Billing Periodicity Selector */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 font-sans self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedInterval('monthly')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                selectedInterval === 'monthly'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Mensuel</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedInterval('quarterly')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                selectedInterval === 'quarterly'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Coins className="w-3 h-3 text-emerald-500" />
              <span>Trimestriel</span>
              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1 rounded-md leading-none py-0.5">
                -10%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedInterval('yearly')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                selectedInterval === 'yearly'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Annuel</span>
              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1 rounded-md leading-none py-0.5 animate-pulse">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 🏷️ Onglets de Navigation Métiers */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto font-sans shadow-xs">
          <button
            type="button"
            onClick={() => setSelectedPackTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedPackTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span>Tous les Forfaits</span>
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
              selectedPackTab === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
            }`}>
              9
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackTab('commerce')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedPackTab === 'commerce'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 font-bold'
            }`}
          >
            <span>🛒</span>
            <span>Commerce & Services</span>
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
              selectedPackTab === 'commerce' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackTab('logistics')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedPackTab === 'logistics'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50/60 font-bold'
            }`}
          >
            <span>🚚</span>
            <span>Logistique & Négoce</span>
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
              selectedPackTab === 'logistics' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackTab('industry')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedPackTab === 'industry'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/60 font-bold'
            }`}
          >
            <span>🏗️</span>
            <span>Industrie & BTP</span>
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
              selectedPackTab === 'industry' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
          </button>
        </div>

        {/* 📦 Grille des Cartes de Forfaits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {customPacks
            .filter(pack => pack.id !== 'trial' && pack.id !== 'custom' && (selectedPackTab === 'all' || pack.category === selectedPackTab))
            .map((pack) => {
              const isCurrent = pack.id === subscriptionPack;
              const activeClient = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
              const isTrial = activeClient?.status === 'trial';
              const showAsSelected = isCurrent && !isTrial;
              const isFeatured = !!(pack as any).featured;

              const basePrice = pack.price;
              const monthlyRateWithDiscount = selectedInterval === 'monthly'
                ? basePrice
                : selectedInterval === 'quarterly'
                ? Math.round(basePrice * 0.9)
                : Math.round(basePrice * 0.8);

              const multiplier = selectedInterval === 'monthly' ? 1 : (selectedInterval === 'quarterly' ? 3 : 12);
              const totalContractPrice = monthlyRateWithDiscount * multiplier;

              return (
                <div
                  key={pack.id}
                  className={`p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-5 relative bg-white border ${
                    showAsSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : isFeatured
                      ? 'border-2 border-amber-400 ring-4 ring-amber-400/15 shadow-lg shadow-amber-500/5 hover:border-amber-500'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Badges Flottants */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2.5 py-1 rounded-lg font-mono">
                      {pack.badge}
                    </span>

                    {isFeatured && (
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                        RECOMMANDÉ
                      </span>
                    )}

                    {showAsSelected && !isFeatured && (
                      <span className="bg-indigo-600 text-white font-black text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-200" />
                        Pack Actif
                      </span>
                    )}
                  </div>

                  {/* Titre & Subtitle */}
                  <div className="space-y-1.5">
                    <h4 className="text-base font-black text-slate-900 leading-snug">{pack.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium min-h-[36px]">
                      {pack.desc}
                    </p>
                  </div>

                  {/* Prix HT */}
                  <div className="py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedInterval}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-0.5"
                      >
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <strong className="text-2xl font-black font-mono text-slate-900">
                            {basePrice === 0 ? "Libre" : `${totalContractPrice} TND`}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                            {basePrice === 0 
                              ? "" 
                              : selectedInterval === 'monthly'
                              ? "HT / mois"
                              : selectedInterval === 'quarterly'
                              ? "HT / trim."
                              : "HT / an"
                            }
                          </span>
                        </div>
                        
                        {basePrice > 0 && selectedInterval !== 'monthly' && (
                          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 pt-0.5 font-sans">
                            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                              {selectedInterval === 'quarterly' ? '-10%' : '-20%'}
                            </span>
                            <span>soit <strong className="font-black">{monthlyRateWithDiscount} TND</strong> HT / mois</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Liste à puces des Modules Inclus */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>MODULES INCLUS</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPackForModal(pack)}
                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md font-mono font-black text-[9px] flex items-center gap-1 cursor-pointer transition"
                      >
                        <Eye className="w-2.5 h-2.5 text-indigo-600" />
                        <span>✓ {pack.modules.length} modules</span>
                      </button>
                    </div>

                    <ul className="space-y-2 text-[11px] font-medium text-slate-700">
                      {(expandedPackIds[pack.id] ? pack.modules : pack.modules.slice(0, 5)).map((mId) => {
                        const mMeta = ALL_MODULES_METADATA.find(m => m.id === mId);
                        return (
                          <li key={mId} className="flex items-start gap-2">
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/80 w-4 h-4 flex items-center justify-center rounded-md text-[10px] shrink-0 font-bold mt-0.5">
                              ✓
                            </span>
                            <span className="leading-tight font-semibold text-slate-800">
                              {mMeta?.name || mId}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Interactive Accordion & Modal Trigger */}
                    <div className="pt-2 space-y-1">
                      {pack.modules.length > 5 && (
                        <button
                          type="button"
                          onClick={() => togglePackExpand(pack.id)}
                          className="w-full py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-xl border border-slate-200 hover:border-indigo-200 transition text-center cursor-pointer flex items-center justify-center gap-1 font-sans"
                        >
                          {expandedPackIds[pack.id] ? (
                            <span>▲ Masquer les modules</span>
                          ) : (
                            <span>▼ Voir la liste complète des {pack.modules.length} modules</span>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPackForModal(pack)}
                        className="w-full py-1 px-2 text-indigo-600 hover:text-indigo-800 font-black text-[9px] uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-indigo-500" />
                        <span>👁️ Détails & Composition du Pack</span>
                      </button>
                    </div>
                  </div>

                  {/* Bouton d'Action */}
                  <button
                    type="button"
                    onClick={() => handleSelectPack(pack.id)}
                    disabled={showAsSelected}
                    className={`w-full font-black text-xs py-2.5 px-4 rounded-xl transition-all duration-200 text-center cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                      showAsSelected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold cursor-default'
                        : isFeatured
                        ? 'bg-slate-900 hover:bg-indigo-600 text-white shadow-md'
                        : 'bg-indigo-600 hover:bg-slate-900 text-white'
                    }`}
                  >
                    <span>{showAsSelected ? "Sélectionné" : (isCurrent ? "Commander (Pétentialiser)" : "Commander la Formule")}</span>
                    {!showAsSelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
        </div>

        {/* 🎛️ Bloc "Configurateur à la carte / Sur-Mesure" en bas de page */}
        <div className="p-6 rounded-3xl border bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-slate-800 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative shadow-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group mt-6">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="space-y-3 relative z-10 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                SUR-MESURE & ÉVOLUTIF
              </span>
              <span className="text-[9px] font-black uppercase text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md">
                Liberté Totale
              </span>
            </div>

            <h4 className="text-base font-black text-white flex items-center gap-2 pt-1">
              <span>Configurateur Modulaire à la Carte</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-2xl">
              Composez sur-mesure votre environnement Elyssa ERP au dinar près ! Sélectionnez uniquement les modules dont votre entreprise a besoin au quotidien. Ajoutez, modifiez ou ajustez vos modules en toute liberté à tout moment.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-200 font-semibold">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-950 text-indigo-400 w-4 h-4 flex items-center justify-center rounded-md border border-indigo-800 text-[9px] shrink-0">✓</span>
                <span>Zéro module inutile payé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-950 text-indigo-400 w-4 h-4 flex items-center justify-center rounded-md border border-indigo-800 text-[9px] shrink-0">✓</span>
                <span>Ajustement au dinar près</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-950 text-indigo-400 w-4 h-4 flex items-center justify-center rounded-md border border-indigo-800 text-[9px] shrink-0">✓</span>
                <span>Abonnement 100% flexible</span>
              </div>
            </div>
          </div>

          <div className="pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-stretch justify-between gap-4 relative z-10 shrink-0 min-w-[220px]">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Estimation du Panier</span>
              <div className="flex items-baseline gap-1.5">
                {cartModules.length > 0 ? (
                  <>
                    <strong className="text-xl font-black font-mono text-emerald-400">
                      {(() => {
                        const cartBaseTotal = ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
                        const cartMonthlyRate = cartInterval === 'monthly' ? cartBaseTotal : (cartInterval === 'quarterly' ? Math.round(cartBaseTotal * 0.9) : Math.round(cartBaseTotal * 0.8));
                        const cartTotalHT = cartInterval === 'monthly' ? cartMonthlyRate : (cartInterval === 'quarterly' ? cartMonthlyRate * 3 : cartMonthlyRate * 12);
                        return cartTotalHT;
                      })()} TND
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold">
                      / {cartInterval === 'monthly' ? 'mois' : cartInterval === 'quarterly' ? 'trimestre' : 'an'}
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="text-xl font-black text-slate-300">0 TND</strong>
                    <span className="text-[10px] text-slate-400 font-bold">Abonnement libre</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {cartModules.length} module{cartModules.length > 1 ? 's' : ''} sélectionné{cartModules.length > 1 ? 's' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const element = document.getElementById('catalog-modules-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-white hover:text-slate-900 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Composer mon forfait</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: INDIVIDUAL MODULES DIRECTORY & UPGRADE STORE */}
      <div className="space-y-6" id="catalog-modules-section">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Catalogue de Modules Opérationnels "À la Carte"</h3>
            <p className="text-xs text-slate-400 font-sans">Pilotez individuellement la souscription de chaque module. Les modules débloqués s'insèrent immédiatement dans la navigation.</p>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              onClick={() => setCatalogViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                catalogViewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-3xs font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille Uniforme</span>
            </button>
            <button
              onClick={() => setCatalogViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                catalogViewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-3xs font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tableau Compact</span>
            </button>
          </div>
        </div>

        {/* 🛍️ SECTION DU PANIER E-COMMERCE ACTIF */}
        <AnimatePresence>
          {cartModules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900 border-2 border-indigo-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4"
            >
              {/* Background elements */}
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-650 opacity-15 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
                    <ShoppingCart className="w-5 h-5 text-indigo-400 animate-bounce" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2 font-display">
                      <span>Mon Panier d'Abonnement "À la Carte"</span>
                      <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        {cartModules.length} {cartModules.length > 1 ? 'Modules' : 'Module'}
                      </span>
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed font-sans">
                      Vous configurez un abonnement sur-mesure pour votre entreprise : <strong className="text-indigo-300 font-black uppercase">{activeCompanyName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-stretch xl:self-auto justify-end w-full xl:w-auto">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold uppercase flex items-center gap-1.5 transition cursor-pointer border border-slate-850"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerCartCheckout}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer border-0"
                  >
                    <span>Passer la commande (Virement/Espèces)</span>
                    <ArrowRight className="w-4 h-4 text-indigo-200" />
                  </button>
                </div>
              </div>

              {/* List of items inside cart */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 relative z-10">
                {ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).map(mod => (
                  <div key={mod.id} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-850 flex items-center justify-between gap-3 font-sans">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block font-sans truncate">{mod.category}</span>
                      <h4 className="text-xs font-black truncate">{mod.name}</h4>
                      <span className="text-[10px] font-black text-emerald-400 font-mono block">{mod.price} TND / mois</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCartItem(mod.id)}
                      className="p-1 px-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/50 rounded-lg text-rose-455 hover:text-rose-200 transition cursor-pointer shrink-0"
                      title="Retirer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Price calculation bar */}
              <div className="pt-3 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10 bg-slate-950/45 p-3 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-semibold">
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-400">Total Mensuel à régler à Elyssa Entreprises :</span>
                  <strong className="text-base font-black font-mono text-emerald-400">
                    {ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, current) => acc + current.price, 0)} TND
                  </strong>
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase font-sans">/ moisHT</span>
                </div>
                <p className="text-[10px] text-amber-400 font-bold font-sans">
                  ⚠️ Tous les modules seront activés en détente de virement dès validation du bon de commande.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          {(() => {
            // Group modules by category
            const categories = [
              {
                name: 'PILOTAGE & PERFORMANCE',
                color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
                description: 'Analytique décisionnelle, Copilot BI, planification stratégique et objectifs d\'entreprise.'
              },
              {
                name: 'ACTIVITÉ COMMERCIALE & CRM',
                color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
                description: 'Encaissements Caisse POS, facturation, relation client, portail libre-service et suivi réclamations.'
              },
              {
                name: 'RESSOURCES HUMAINES & TERRAIN',
                color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                description: 'Paie RH, gestion des collaborateurs, pointage biométrique et suivi terrain Elyssa Pocket.'
              },
              {
                name: 'LOGISTIQUE, ACHATS & STOCK',
                color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
                description: 'Gestion des stocks, approvisionnements, dispatching des tournées, GPAO et logistique internationale.'
              },
              {
                name: 'FINANCE & COMPTABILITÉ',
                color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                description: 'Comptabilité générale, télé-transmission TEJ (CIMF) [Gratuit], gestion de trésorerie et immobilisations.'
              },
              {
                name: 'PARC, MATÉRIEL & CONTRÔLE',
                color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                description: 'Inventaire des actifs, parc automobile, coffre-fort GED, gouvernance juridique et paramétrage.'
              }
            ];

            return (
              <div className="space-y-10">
                {categories.map((cat) => {
                  const catModules = ALL_MODULES_METADATA.filter(m => m.category === cat.name);
                  return (
                    <div key={cat.name} className="space-y-4">
                      <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cat.color} font-mono`}>
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              {catModules.length} {catModules.length > 1 ? 'modules' : 'module'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 font-semibold leading-relaxed">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      {catalogViewMode === 'table' ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-150 bg-white">
                          <table className="min-w-full divide-y divide-slate-100 font-sans">
                            <thead className="bg-slate-50 text-[9.5px] font-black uppercase tracking-wider text-slate-450">
                              <tr>
                                <th scope="col" className="px-5 py-3 text-left">Module</th>
                                <th scope="col" className="px-5 py-3 text-left hidden md:table-cell">Description</th>
                                <th scope="col" className="px-5 py-3 text-right">Tarif HT</th>
                                <th scope="col" className="px-5 py-3 text-center">Statut</th>
                                <th scope="col" className="px-5 py-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white text-[11px] font-semibold text-slate-700">
                              {catModules.map((mod) => {
                                const unlocked = isModuleCurrentlyUnlocked(mod.id);
                                const inPackByDefault = isModuleActiveInPack(mod.id, billingBasePack);
                                const inCart = cartModules.includes(mod.id);
                                const isMajorHighlight = ['billing', 'finance', 'payroll', 'transit_logistique', 'production'].includes(mod.id);

                                return (
                                  <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-[14px] shrink-0">
                                          {mod.id === 'steering' ? '🎯' :
                                           mod.id === 'reports' ? '📝' :
                                           mod.id === 'caisse' ? '🏪' :
                                           mod.id === 'clients' ? '👥' :
                                           mod.id === 'communication' ? '✉️' :
                                           mod.id === 'complaints' ? '🗣️' :
                                           mod.id === 'billing' ? '🧾' :
                                           mod.id === 'stock' ? '📦' :
                                           mod.id === 'fleet' ? '🚛' :
                                           mod.id === 'mobile_fleet' ? '📱' :
                                           mod.id === 'finance' ? '🏦' :
                                           mod.id === 'payroll' ? '💼' :
                                           mod.id === 'collaborators' ? '🤝' :
                                           mod.id === 'attendance' ? '⏱️' :
                                           mod.id === 'dashboard' ? '📊' :
                                           mod.id === 'company_settings' ? '⚙️' :
                                           mod.id === 'ged' ? '📂' :
                                           mod.id === 'investment' ? '📈' :
                                           mod.id === 'market' ? '🔍' :
                                           mod.id === 'transit_logistique' ? '🚢' :
                                           mod.id === 'lc_manager' ? '🔏' :
                                           mod.id === 'cession' ? '🤝' :
                                           mod.id === 'production' ? '🏭' :
                                           mod.id === 'purchasing' ? '🛒' :
                                           mod.id === 'asset' ? '🏛️' :
                                           mod.id === 'treasury' ? '💳' : '📦'}
                                        </span>
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span>{mod.name}</span>
                                            {isMajorHighlight && (
                                              <span className="bg-indigo-50 text-indigo-700 text-[7.5px] px-1 py-0.5 rounded font-black uppercase tracking-wider">
                                                Incontournable
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[9.5px] text-slate-400 font-medium md:hidden mt-0.5">
                                            {mod.desc}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell text-slate-550 leading-relaxed font-medium">
                                      {mod.desc}
                                    </td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-bold">
                                      {mod.price} TND <span className="text-[9px] text-slate-400 font-sans font-normal">/ m</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center text-xs">
                                      {unlocked ? (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-150">
                                          <Check className="w-2 h-2" />
                                          Abonné
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                          <Lock className="w-2 h-2 text-slate-400" />
                                          Inactif
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center">
                                      {unlocked ? (
                                        <span className="text-[9.5px] text-emerald-600 font-bold italic">
                                          {activeCompanyName?.toLowerCase().includes('inter-affaires') || currentUser?.role === 'SuperAdmin' || isSimulationActive
                                            ? "Inclus (SuperAdmin)"
                                            : inPackByDefault ? "Inclus d'office" : "Individuel Actif"}
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleCartItem(mod.id)}
                                          className={`px-3 py-1 rounded-lg text-[9px] font-extrabold transition cursor-pointer flex items-center gap-1 mx-auto border ${
                                            inCart
                                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                              : 'bg-indigo-600 hover:bg-slate-900 text-white border-transparent'
                                          }`}
                                        >
                                          {inCart ? (
                                            <>
                                              <Trash2 className="w-3 h-3 text-rose-500" />
                                              <span>Retirer</span>
                                            </>
                                          ) : (
                                            <>
                                              <ShoppingCart className="w-3 h-3" />
                                              <span>S'abonner</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {catModules.map((mod) => {
                            const unlocked = isModuleCurrentlyUnlocked(mod.id);
                            const inPackByDefault = isModuleActiveInPack(mod.id, billingBasePack);
                            const inCart = cartModules.includes(mod.id);
                            const isMajorHighlight = ['billing', 'finance', 'payroll', 'transit_logistique', 'production'].includes(mod.id);

                            return (
                              <div
                                key={mod.id}
                                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 bg-white relative overflow-hidden group hover:scale-[1.01] hover:shadow-xs ${
                                  unlocked
                                    ? 'border-emerald-100 shadow-3xs bg-gradient-to-br from-emerald-50/20 to-emerald-50/5'
                                    : isMajorHighlight
                                    ? 'border-slate-200 hover:border-indigo-200/90 shadow-3xs'
                                    : 'border-slate-150 hover:border-slate-350'
                                }`}
                              >
                                {!unlocked && isMajorHighlight && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 opacity-60"></div>
                                )}

                                <div className="space-y-2.5 relative z-10">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[13px]">
                                      {mod.id === 'steering' ? '🎯' :
                                       mod.id === 'reports' ? '📝' :
                                       mod.id === 'caisse' ? '🏪' :
                                       mod.id === 'clients' ? '👥' :
                                       mod.id === 'communication' ? '✉️' :
                                       mod.id === 'complaints' ? '🗣️' :
                                       mod.id === 'billing' ? '🧾' :
                                       mod.id === 'stock' ? '📦' :
                                       mod.id === 'fleet' ? '🚛' :
                                       mod.id === 'mobile_fleet' ? '📱' :
                                       mod.id === 'finance' ? '🏦' :
                                       mod.id === 'payroll' ? '💼' :
                                       mod.id === 'collaborators' ? '🤝' :
                                       mod.id === 'attendance' ? '⏱️' :
                                       mod.id === 'dashboard' ? '📊' :
                                       mod.id === 'company_settings' ? '⚙️' :
                                       mod.id === 'ged' ? '📂' :
                                       mod.id === 'investment' ? '📈' :
                                       mod.id === 'market' ? '🔍' :
                                       mod.id === 'transit_logistique' ? '🚢' :
                                       mod.id === 'lc_manager' ? '🔏' :
                                       mod.id === 'cession' ? '🤝' :
                                       mod.id === 'production' ? '🏭' :
                                       mod.id === 'purchasing' ? '🛒' :
                                       mod.id === 'asset' ? '🏛️' :
                                       mod.id === 'treasury' ? '💳' : '📦'}
                                    </span>

                                    {unlocked ? (
                                      <span className="text-[8.5px] font-extrabold uppercase text-emerald-400 bg-emerald-950/45 border border-emerald-900/55 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" />
                                        Abonné
                                      </span>
                                    ) : (
                                      <span className="text-[8.5px] font-extrabold uppercase text-slate-400 bg-slate-900/45 border border-slate-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                                        Inactif
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 group-hover:text-indigo-650 transition-colors">
                                      {mod.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-normal font-semibold mt-1">
                                      {mod.desc}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100 relative z-10">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-455 font-bold">Tarif unitaire :</span>
                                    <strong className="text-slate-900 font-extrabold font-mono">{mod.price} TND / mois</strong>
                                  </div>

                                  {unlocked ? (
                                    <div className="p-1.5 px-3 bg-emerald-950/45 text-emerald-400 rounded-lg text-[9.5px] font-bold text-center leading-normal border border-emerald-900/50 italic">
                                      {activeCompanyName?.toLowerCase().includes('inter-affaires') || currentUser?.role === 'SuperAdmin' || isSimulationActive
                                        ? "✓ Inclus (SuperAdmin)"
                                        : inPackByDefault 
                                          ? "✓ Inclus dans votre offre" 
                                          : "✓ Abonnement individuel actif"}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCartItem(mod.id)}
                                      className={`w-full font-extrabold text-[10px] py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs hover:shadow-xs border ${
                                        inCart
                                          ? 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-600/60 text-amber-700'
                                          : 'bg-indigo-600 hover:bg-slate-950 text-white border-transparent'
                                      }`}
                                    >
                                      {inCart ? (
                                        <>
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Retirer du Panier</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingCart className="w-3.5 h-3.5 opacity-80" />
                                          <span>Ajouter au Panier</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-6" id="publisher-dashboard-panel">
      {/* Banner info */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-550 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-indigo-950/45 border border-indigo-550/50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
            <LayoutDashboard className="w-3 h-3 text-indigo-400" />
            <span>Console Établie & KPIs</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight leading-normal">
            Console de Pilotage Éditeur : Suivi Clientèle Elyssa CRM
          </h2>
          <p className="text-slate-300 font-semibold text-xs leading-relaxed max-w-3xl">
            Suivez en temps réel l'ensemble de vos futurs comptes clients tunisiens, l'évolution du Chiffre d'Affaires Mensuel Récurrent (MRR), la répartition géographique de votre distribution d'ERP modulaire, et distribuez des clés d'activation à la volée.
          </p>
        </div>
      </div>

      {/* KPI Dashboard Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-sans flex items-center gap-1.5">
              <span>Revenu Récurrent Mensuel (MRR)</span>
              {isSimulationActive && (
                <span className="text-[7.5px] bg-emerald-950 text-emerald-400 border border-emerald-900 font-black px-1.5 py-0.2 rounded uppercase animate-pulse">Démo</span>
              )}
            </span>
            <strong className="text-xl md:text-2xl font-black font-mono text-emerald-400 tracking-tight">
              {calculateTotalMRR()} TND
            </strong>
            <span className="text-[10px] text-slate-400 block font-semibold">
              {isSimulationActive ? "Inclut +14 850 TND de simulation" : "Abonnements réels valorisés"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-900 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-sans flex items-center gap-1.5">
              <span>Entreprises Abonnées</span>
              {isSimulationActive && (
                <span className="text-[7.5px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-black px-1.5 py-0.2 rounded uppercase animate-pulse">Démo</span>
              )}
            </span>
            <strong className="text-xl md:text-2xl font-black font-mono text-white tracking-tight">
              {calculateActiveCount()} <span className="text-xs text-slate-400">comptes</span>
            </strong>
            <span className="text-[10px] text-slate-400 block font-semibold">
              {isSimulationActive ? "Inclut +32 comptes de simulation" : "Taux de désabonnement : 1.5%"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-900 flex items-center justify-center text-indigo-400">
            <Building className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-sans flex items-center gap-1.5">
              <span>Panier Moyen (ARPU)</span>
              {isSimulationActive && (
                <span className="text-[7.5px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-black px-1.5 py-0.2 rounded uppercase animate-pulse">Démo</span>
              )}
            </span>
            <strong className="text-xl md:text-2xl font-black font-mono text-indigo-300 tracking-tight">
              {Math.round(calculateTotalMRR() / ((publisherClients.length + (isSimulationActive ? 37 : 0)) || 1))} TND
            </strong>
            <span className="text-[10px] text-slate-450 block font-bold uppercase">par client / mois</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-300">
            <Coins className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-sans">Santé Technique Serveur</span>
            <strong className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En ligne (99.98%)
            </strong>
            <span className="text-[10px] text-slate-400 block font-semibold">Sfax & Tunis Clusters online</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
            <Activity className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* 🛠️ CONTRÔLES DES DONNÉES DE DÉMONSTRATION & SIMULATION (Masqués sur le tenant Éditeur Parent / Inter-Affaires) */}
      {!isParentTenant && (
        <div className="bg-slate-900 border border-indigo-950/80 p-6 rounded-3xl space-y-4" id="publisher-demo-simulation-panel">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>🛠️ Mode Démo : Entreprises & Indicateurs de Simulation</span>
              </h3>
              <p className="text-[10.5px] text-slate-400 font-semibold leading-normal font-sans text-left">
                Générez instantanément un ensemble complet de clients de démonstration tunisiens (STE CARTHAGE, EL KEF AGRICOLE, BIZERTE MARITIME, etc.), de demandes de licence d'évaluation et de logs d'activité. Ces entités sont étiquetées avec un badge <span className="text-amber-400 font-bold">"Démo"</span> distinctif pour éviter toute confusion avec vos vrais clients en production, et peuvent être purgées proprement en un seul clic.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInsertDemos}
                className="px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Injecter les Démos</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteDemos}
                className="px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer les Démos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 CENTRE D'ALERTES ET TÉMOINS D'ACTIVITÉ */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4" id="publisher-alerts-witness-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Centre de Témoins d'Alertes & Activités d'Acquisition (Elyssa SaaS Logs)</span>
            </h3>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-normal font-sans text-left">
              Flux d'audit automatisé : enregistrement de comptes d'essai et validation des règlements de packs clients.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdminAlerts([]);
              localStorage.setItem('carthage_admin_alerts', JSON.stringify([]));
            }}
            className="text-[9px] font-black uppercase text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-950 transition cursor-pointer self-start animate-fade-in"
          >
            Vider le journal
          </button>
        </div>

        {adminAlerts.filter(a => isSimulationActive || !a.id.startsWith('demo-')).length === 0 ? (
          <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold uppercase font-sans">Aucun événement enregistré pour le moment.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {adminAlerts
              .filter(a => isSimulationActive || !a.id.startsWith('demo-'))
              .map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-xl border flex items-start gap-2.5 transition text-left ${
                  alert.type === 'registration' 
                    ? 'bg-blue-950/20 border-blue-900/40 text-blue-200' 
                    : alert.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {alert.type === 'registration' ? (
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 font-black text-[8px] tracking-wider uppercase block">INSCRIPTION</span>
                  ) : alert.type === 'warning' ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 font-black text-[8px] tracking-wider uppercase block">ÉCHÉANCE</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-black text-[8px] tracking-wider uppercase block">ACQUISITION</span>
                  )}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-200 leading-normal break-words font-sans">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[8.5px] text-slate-450 block font-mono font-semibold">
                      ⏱️ {alert.date}
                    </span>
                    {alert.id.startsWith('demo-') && (
                      <span className="bg-amber-955 text-amber-400 border border-amber-800/60 px-1 py-0.2 rounded text-[6.5px] font-black uppercase tracking-wider font-sans leading-none">Démo</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 👑 CONFIGURATION DU CATALOGUE DES FORFAITS ET DES PRIX PAR L'ÉDITEUR */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5" id="publisher-pack-editor-controls">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Gestion Dynamique du Barème Forfaits & Tarifs Elyssa</span>
            </h3>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-normal font-sans">
              Ajustez l'intitulé, les tarifs mensuels et les applications débloquées pour les 4 formules d'entrée. Tout changement est répercuté instantanément sur la vitrine officielle et la facturation client.
            </p>
          </div>
          <span className="bg-emerald-950/80 border border-emerald-900 font-mono text-[9px] text-white font-black uppercase px-3 py-1 rounded-lg flex items-center gap-1.5 shrink-0 self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Mise à jour à chaud</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customPacks.filter(p => p.id !== 'custom').map((pack) => (
            <div key={pack.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-black uppercase text-indigo-400 font-mono px-2 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-900">
                    ID: {pack.id}
                  </span>
                  <div className="text-right">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase">Tarif Actuel</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 font-mono block">Libellé commercial</label>
                    <input
                      type="text"
                      value={pack.name}
                      onChange={(e) => handleUpdatePackField(pack.id, 'name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 font-mono block">Badge publicitaire</label>
                    <input
                      type="text"
                      value={pack.badge || ''}
                      onChange={(e) => handleUpdatePackField(pack.id, 'badge', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-bold text-indigo-400 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 font-mono block">Prix Mensuel (TND)</label>
                    <input
                      type="number"
                      value={pack.price}
                      min="0"
                      onChange={(e) => handleUpdatePackField(pack.id, 'price', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-bold text-emerald-400 font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 font-mono block">Description</label>
                    <textarea
                      value={pack.desc}
                      rows={2}
                      onChange={(e) => handleUpdatePackField(pack.id, 'desc', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[11px] font-semibold text-slate-300 focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                {/* Modules selector */}
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 font-mono block">Modules inclus ({pack.modules.length}) :</label>
                  <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-850 rounded-xl max-h-32 overflow-y-auto">
                    {ALL_MODULES_METADATA.map((mod) => {
                      const active = pack.modules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleTogglePackModule(pack.id, mod.id)}
                          className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-indigo-650 text-white border border-indigo-550'
                              : 'bg-slate-950 text-slate-650 hover:text-slate-400 border border-slate-850'
                          }`}
                        >
                          <span>{active ? "✓" : "+"}</span>
                          <span>{mod.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Fichier Général des Abonnés Elyssa SaaS</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal font-sans text-left">
                Tableau de bord de gestion linéaire. Cliquez sur l'icône de modification ✎ pour ouvrir la fiche client en format popup.
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-450" />
              <input
                type="text"
                value={publisherSearch}
                onChange={(e) => setPublisherSearch(e.target.value)}
                placeholder="Filtrer par nom, pack, ville..."
                className="bg-slate-950 text-white pl-8 pr-4 py-2 text-[11px] font-bold rounded-xl border border-slate-800 w-full sm:w-56 outline-hidden focus:border-indigo-500 text-ellipsis font-sans"
              />
            </div>
          </div>

          {/* 🎯 TABS DE FILTRAGE DES ABONNÉS */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
            {/* PACKS */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <span className="text-[8.5px] font-black uppercase text-slate-500 px-2 font-sans">Forfait :</span>
              <button
                type="button"
                onClick={() => setFilterPackId('all')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer font-sans leading-none ${
                  filterPackId === 'all'
                    ? 'bg-indigo-650 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Tout ({mergedClients.length})
              </button>
              {customPacks.map(p => {
                const count = mergedClients.filter(c => c.packId === p.id).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFilterPackId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer font-sans leading-none ${
                      filterPackId === p.id
                        ? 'bg-indigo-650 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {p.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* STATUSES */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <span className="text-[8.5px] font-black uppercase text-slate-500 px-2 font-sans">Statut :</span>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer font-sans leading-none ${
                  filterStatus === 'all'
                    ? 'bg-indigo-650 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Tous ({mergedClients.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer font-sans leading-none ${
                  filterStatus === 'active'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Actifs & Essai ({mergedClients.filter(c => c.status !== 'suspended').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('suspended')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer font-sans leading-none ${
                  filterStatus === 'suspended'
                    ? 'bg-red-950 text-red-400 border border-red-900/60 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Suspendus ({mergedClients.filter(c => c.status === 'suspended').length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto text-slate-300 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950/50">
          <table className="w-full font-sans text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-850 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Raison Sociale (& Ville)</th>
                  <th className="px-4 py-3 text-left">Forfait actif</th>
                  <th className="px-4 py-3 text-left">Engagement / Intervalle</th>
                  <th className="px-4 py-3 text-left">Échéance & Clé de validation</th>
                  <th className="px-4 py-3 text-left">Tarif mensuel</th>
                  <th className="px-4 py-3 text-left">Agrégateur</th>
                  <th className="px-4 py-3 text-left">Statut Opt.</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {mergedClients
                  .filter(client => {
                    if (!isSimulationActive && client.id.startsWith('pc-demo-')) {
                      return false;
                    }
                    if (filterPackId !== 'all' && client.packId !== filterPackId) {
                      return false;
                    }
                    if (filterStatus === 'active' && client.status === 'suspended') {
                      return false;
                    }
                    if (filterStatus === 'suspended' && client.status !== 'suspended') {
                      return false;
                    }
                    const searchLower = publisherSearch.toLowerCase();
                    return (
                      client.companyName.toLowerCase().includes(searchLower) ||
                      client.location.toLowerCase().includes(searchLower) ||
                      client.packId.toLowerCase().includes(searchLower) ||
                      client.paymentGateway.toLowerCase().includes(searchLower)
                    );
                  })
                  .map(client => {
                    // Find any pending or key_emitted request for this client
                    const pendingReq = licenceRequests.find(
                      (r: any) => 
                        r?.companyName?.toLowerCase() === client.companyName?.toLowerCase() && 
                        (r?.status === 'pending' || r?.status === 'key_emitted')
                    );

                    const packIdToShow = pendingReq ? pendingReq.packId : client.packId;
                    const intervalToShow = pendingReq ? pendingReq.interval : (client.interval || 'monthly');

                    const packInfo = customPacks.find(p => p.id === packIdToShow);
                    let calculatedPrice = packInfo ? packInfo.price : 0;

                    if (packIdToShow === 'custom') {
                      let modulesList: string[] = [];
                      if (pendingReq && pendingReq.modules && pendingReq.modules.length > 0) {
                        modulesList = pendingReq.modules;
                      } else {
                        const key = `carthage_purchased_modules_${client.companyName}`;
                        const savedModules = localStorage.getItem(key);
                        if (savedModules) {
                          try {
                            modulesList = JSON.parse(savedModules);
                          } catch (e) {}
                        }
                        if (modulesList.length === 0 && client.modules) {
                          modulesList = client.modules;
                        }
                      }
                      const baseModulesPrice = ALL_MODULES_METADATA.filter(m => modulesList.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
                      calculatedPrice = intervalToShow === 'yearly' 
                        ? Math.round(baseModulesPrice * 0.8) 
                        : (intervalToShow === 'quarterly' 
                          ? Math.round(baseModulesPrice * 0.9) 
                          : baseModulesPrice);
                    }
                    if (client.customDiscount) {
                      calculatedPrice = Math.round(calculatedPrice * 0.8);
                    }

                    // Real-time discrete countdown clocks & alert flags
                    const joined = new Date(client.joinedDate);
                    const durationDays = client.status === 'trial' ? trialDurationDays : (client.interval === 'yearly' ? 365 : (client.interval === 'quarterly' ? 90 : 30));
                    const dueDate = new Date(joined.getTime() + durationDays * 24 * 60 * 60 * 1000);
                    const diffMs = dueDate.getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const isNearingDue = diffDays <= 7 && diffDays >= 0 && client.status !== 'suspended';
                    const isOverdue = diffDays < 0 && client.status !== 'suspended';

                    return (
                      <tr 
                        key={client.id} 
                        className={`text-[11px] font-semibold text-left border-l-2 transition ${
                          isOverdue 
                            ? 'bg-red-950/20 border-l-red-600 hover:bg-red-950/35' 
                            : isNearingDue 
                            ? 'bg-amber-950/25 border-l-amber-500 hover:bg-amber-950/40 animate-pulse-slow' 
                            : 'hover:bg-slate-850/40 border-l-transparent'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white block font-extrabold">{client.companyName}</span>
                            {client.id.startsWith('pc-demo-') && (
                              <span className="bg-amber-950/60 text-amber-400 border border-amber-900/85 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider font-sans leading-none">Démo</span>
                            )}
                          </div>
                          <span className="text-[9.5px] text-slate-450 block font-mono font-bold uppercase">{client.location}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {pendingReq ? (
                            <div className="space-y-1">
                              <span className="text-amber-400 font-bold uppercase block text-[10px] animate-pulse">
                                ⏳ Commande : {pendingReq.packId === 'custom' ? 'À la Carte' : (customPacks.find(p => p.id === pendingReq.packId)?.name || pendingReq.packId)}
                              </span>
                              {pendingReq.packId === 'custom' && pendingReq.modules && (
                                <div className="text-[9px] text-indigo-300 font-semibold leading-tight max-w-xs">
                                  Modules : {pendingReq.modules.map((mId: string) => ALL_MODULES_METADATA.find(m => m.id === mId)?.name || mId).join(', ')}
                                </div>
                              )}
                              <span className="text-[8.5px] text-amber-500/80 block">
                                Demandé le {pendingReq.requestDate}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-slate-350 font-bold uppercase block text-[10px]">
                                {packInfo?.name || client.packId}
                              </span>
                              {client.packId === 'custom' && (
                                <div className="text-[9px] text-indigo-300 font-semibold leading-tight max-w-xs">
                                  Modules : {(() => {
                                    const key = `carthage_purchased_modules_${client.companyName}`;
                                    const savedModules = localStorage.getItem(key);
                                    let modulesList: string[] = [];
                                    if (savedModules) {
                                      try {
                                        modulesList = JSON.parse(savedModules);
                                      } catch (e) {}
                                    }
                                    if (modulesList.length === 0 && client.modules) {
                                      modulesList = client.modules;
                                    }
                                    return modulesList.map(mId => ALL_MODULES_METADATA.find(m => m.id === mId)?.name || mId).join(', ') || 'Aucun module';
                                  })()}
                                </div>
                              )}
                              <span className="text-[8.5px] text-slate-500 block">
                                Souscrit le {client.joinedDate}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* 🕒 Engagement / Intervalle */}
                        <td className="px-4 py-3.5">
                          {pendingReq ? (
                            <span className="bg-amber-950 text-amber-300 border border-amber-900/60 p-1 px-2 rounded-md text-[8px] font-black uppercase tracking-wider font-sans leading-none inline-block animate-pulse">
                              {pendingReq.interval === 'yearly' ? 'Annuel (-20%)' : pendingReq.interval === 'quarterly' ? 'Trimestriel (-10%)' : 'Mensuel'}
                            </span>
                          ) : client.status === 'trial' ? (
                            <span className="bg-blue-950 text-blue-300 border border-blue-900/60 p-1 px-2 rounded-md text-[8px] font-black uppercase tracking-wider font-sans leading-none inline-block">
                              Essai Gratuit ({trialDurationDays}j)
                            </span>
                          ) : (
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/60 p-1 px-2 rounded-md text-[8px] font-black uppercase tracking-wider font-sans leading-none inline-block">
                              {client.interval === 'yearly' ? 'Annuel (-20%)' : client.interval === 'quarterly' ? 'Trimestriel (-10%)' : 'Mensuel'}
                            </span>
                          )}
                        </td>
                        {/* ⏰ Compte à rebours / Échéance */}
                        <td className="px-4 py-3.5">
                          {client.status === 'suspended' ? (
                            <span className="text-red-500 font-bold uppercase text-[9px] flex items-center gap-1">
                              <span>⛔ Aborté / Suspendu</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {isOverdue ? (
                                <span className="bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider font-sans animate-pulse inline-block">
                                  🚨 Échu ({Math.abs(diffDays)} j. retard)
                                </span>
                              ) : isNearingDue ? (
                                <span className="bg-amber-950 text-amber-300 border border-amber-650 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider font-sans inline-block">
                                  ⚠️ {diffDays} j. restants (Payement imminent)
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-[9.5px]">
                                  🕒 {diffDays} jours restants
                                </span>
                              )}
                              
                              {/* 📈 Discret countdown progress bar */}
                              <div className="w-24 bg-slate-950 border border-slate-800/80 h-1 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOverdue ? 'bg-red-500' : isNearingDue ? 'bg-amber-500' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, Math.round(((durationDays - Math.max(0, diffDays)) / durationDays) * 100)))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-white">
                          <div className="flex items-center gap-1.5">
                            <span className={client.status === 'suspended' ? 'line-through text-slate-500' : 'text-emerald-450 font-extrabold'}>
                              {client.status === 'suspended' ? '0' : calculatedPrice} TND
                            </span>
                            {client.status !== 'suspended' && (
                              <button
                                type="button"
                                onClick={() => handleToggleClientDiscount(client.id)}
                                title="Activer une réduction exclusive de -20%"
                                className={`px-1 rounded-sm text-[8px] tracking-wider uppercase font-black transition cursor-pointer ${
                                  client.customDiscount 
                                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-sans' 
                                    : 'bg-slate-800 hover:bg-slate-750 text-slate-400 font-sans'
                                  }`}
                              >
                                -20%
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {client.status === 'trial' ? (
                            <span className="bg-slate-950/40 p-1 px-2 border border-slate-900 rounded-md text-[9px] font-black uppercase text-slate-500 font-mono">
                              — (Essai)
                            </span>
                          ) : (
                            <span className="bg-slate-950 p-1 px-2 border border-slate-850 rounded-md text-[9px] font-black uppercase text-indigo-400 font-mono">
                              {client.paymentGateway === 'Virement' 
                                ? 'Virement' 
                                : client.paymentGateway === 'Versement' 
                                ? 'Versement' 
                                : client.paymentGateway === 'FLOUCI' 
                                ? 'FLOUCI ⏱️' 
                                : client.paymentGateway}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleRequestClientSuspend(client.id)}
                            title="Changer ou suspendre le statut de l'abonnement"
                            className={`p-1 px-2 rounded-full font-black text-[9px] uppercase transition cursor-pointer ${
                              client.status === 'active'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                                : client.status === 'trial'
                                ? 'bg-blue-950 text-blue-400 border border-blue-900/40'
                                : 'bg-red-950 text-red-500 border border-red-900/40'
                            }`}
                          >
                            {client.status === 'active' ? '● Actif (Paiement OK)' : client.status === 'trial' ? '● PÉRIODE D\'ESSAI' : '● Hors service (Suspendu)'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const { realId } = getLatestClientsWithPromotion(client.id);
                                const normalizedClient = { ...client, id: realId };
                                const key = `carthage_purchased_modules_${normalizedClient.companyName}`;
                                const savedModules = localStorage.getItem(key);
                                let modules: string[] = [];
                                if (savedModules) {
                                  try {
                                    modules = JSON.parse(savedModules);
                                  } catch (e) {}
                                }
                                setEditingClient({ ...normalizedClient, modules });
                              }}
                              title="Modifier la fiche client en popup"
                              className="p-1 px-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition cursor-pointer font-sans font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                            >
                              <span>Modifier ✎</span>
                            </button>
                             <button
                              type="button"
                              onClick={() => handleSendInvoiceSimulation(client.companyName)}
                              title="Générer & Envoyer la relance d'échéance par mail"
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestClientSuspend(client.id)}
                              title={client.status === 'suspended' ? "Réactiver l'accès pour cette entreprise" : "Suspendre temporairement l'accès"}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                client.status === 'suspended'
                                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-900/50 text-emerald-400 hover:text-white'
                                  : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-900/50 text-amber-400 hover:text-white'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePublisherClient(client.id)}
                              title="Retirer ce client"
                              className="p-1.5 hover:bg-red-500 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-950/50 border-t border-slate-800 p-3.5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold font-sans">
              Note: Simulez l'envoi instantané de relances d'échéances Elyssa aux clients réels pour valider l'automatisme.
            </span>
          </div>
        </div>

      {/* 🏦 EXCLUSIF SUPERADMIN: PARAMÉTRAGE DES MODES DE PAIEMENT & ENCAISSEMENT */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 font-sans" id="superadmin-payment-settings">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Gestion des Modes de Paiement & Comptes de Règlement (SuperAdmin)</span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold leading-normal font-sans">
            Configurez les modes de règlement acceptés pour l'achat de modules d'Elyssa. Cochez les modes actifs à proposer aux clients et mettez à jour les informations de paiement (virement, versement en compte, mandat Wafacash).
          </p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem('carthage_bank_name', bankName);
          localStorage.setItem('carthage_bank_owner', bankOwner);
          localStorage.setItem('carthage_bank_rib', bankRib);
          localStorage.setItem('carthage_bank_agency', bankAgency);
          localStorage.setItem('carthage_wafacash_beneficiary', wafacashBeneficiary);
          localStorage.setItem('carthage_wafacash_cin', wafacashCin);
          localStorage.setItem('carthage_wafacash_phone', wafacashPhone);
          localStorage.setItem('carthage_wafacash_city', wafacashCity);
          localStorage.setItem('carthage_pm_virement_active', String(isVirementActive));
          localStorage.setItem('carthage_pm_versement_active', String(isVersementActive));
          localStorage.setItem('carthage_pm_wafacash_active', String(isWafacashActive));
          localStorage.setItem('carthage_pm_online_card_active', String(isOnlineCardActive));
          
          saveSaaSBankConfig({
            bankName,
            bankOwner,
            bankRib,
            bankAgency,
            wafacashBeneficiary,
            wafacashCin,
            wafacashPhone,
            wafacashCity,
            isVirementActive,
            isVersementActive,
            isWafacashActive,
            isOnlineCardActive
          });

          setSimulationAlert("Configurations des modes de paiement enregistrées avec succès et synchronisées !");
          setTimeout(() => setSimulationAlert(null), 5000);
        }} className="space-y-5">
          
          {/* 🔘 ACTIVE MODES CONFIGURATION AREA */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
            <span className="text-[9.5px] font-black uppercase text-indigo-400 tracking-wider">État d'activation des Modes de Paiement Client</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              
              {/* Virement */}
              <button
                type="button"
                onClick={() => setIsVirementActive(!isVirementActive)}
                className={`p-3 rounded-xl border text-left transition flex justify-between items-center cursor-pointer ${
                  isVirementActive 
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-900/50 border-slate-850 text-slate-500'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase block">Virement Bancaire</span>
                  <span className="text-[8.5px] font-semibold text-slate-400 block">Transfert direct</span>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${isVirementActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                  {isVirementActive ? 'ACTIF' : 'INACTIF'}
                </span>
              </button>

              {/* Versement */}
              <button
                type="button"
                onClick={() => setIsVersementActive(!isVersementActive)}
                className={`p-3 rounded-xl border text-left transition flex justify-between items-center cursor-pointer ${
                  isVersementActive 
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-900/50 border-slate-850 text-slate-500'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase block">Versement Espèces</span>
                  <span className="text-[8.5px] font-semibold text-slate-400 block">Sur compte bancaire</span>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${isVersementActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                  {isVersementActive ? 'ACTIF' : 'INACTIF'}
                </span>
              </button>

              {/* Wafacash */}
              <button
                type="button"
                onClick={() => setIsWafacashActive(!isWafacashActive)}
                className={`p-3 rounded-xl border text-left transition flex justify-between items-center cursor-pointer ${
                  isWafacashActive 
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-900/50 border-slate-850 text-slate-500'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase block">Mandat Wafacash</span>
                  <span className="text-[8.5px] font-semibold text-slate-400 block">Par agence physique</span>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${isWafacashActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                  {isWafacashActive ? 'ACTIF' : 'INACTIF'}
                </span>
              </button>

              {/* Online Gateways */}
              <button
                type="button"
                onClick={() => setIsOnlineCardActive(!isOnlineCardActive)}
                className={`p-3 rounded-xl border text-left transition flex justify-between items-center cursor-pointer ${
                  isOnlineCardActive 
                    ? 'bg-indigo-950/20 border-indigo-500/50 text-indigo-300' 
                    : 'bg-slate-900/50 border-slate-850 text-slate-500'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase block">Paiement par Carte</span>
                  <span className="text-[8.5px] font-semibold text-slate-400 block">Paiement en ligne, e-DINAR, etc.</span>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${isOnlineCardActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-950 text-slate-500'}`}>
                  {isOnlineCardActive ? 'ACTIF' : 'INACTIF'}
                </span>
              </button>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 🏦 BANK ACCOUNT COORDINATES */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3.5">
              <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span className="text-[10.5px] font-black uppercase text-slate-200 tracking-wider">Coordonnées Bancaires (Virement & Versement)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Nom de la Banque</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Bureau / Agence d'origine</label>
                  <input
                    type="text"
                    value={bankAgency}
                    onChange={(e) => setBankAgency(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-emerald-510 font-sans"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Titulaire du Compte (Bénéficiaire - au nom de INTER AFFAIRES)</label>
                  <input
                    type="text"
                    value={bankOwner}
                    onChange={(e) => setBankOwner(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Code RIB Tunisien (20 chiffres)</label>
                  <input
                    type="text"
                    value={bankRib}
                    onChange={(e) => setBankRib(e.target.value)}
                    className="w-full bg-slate-950 text-emerald-450 rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 💸 WAFACASH MANDATE COORDINATES */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3.5">
              <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-[10.5px] font-black uppercase text-slate-200 tracking-wider">Données Mandat Wafacash</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Nom Complet du Bénéficiaire (à l'ordre de)</label>
                  <input
                    type="text"
                    value={wafacashBeneficiary}
                    onChange={(e) => setWafacashBeneficiary(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-amber-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">CIN / Identifiant fiscal</label>
                  <input
                    type="text"
                    value={wafacashCin}
                    onChange={(e) => setWafacashCin(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-amber-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Téléphone du Récipiendaire</label>
                  <input
                    type="text"
                    value={wafacashPhone}
                    onChange={(e) => setWafacashPhone(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-amber-500 font-sans"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 block font-sans">Ville / Pays de Retrait</label>
                  <input
                    type="text"
                    value={wafacashCity}
                    onChange={(e) => setWafacashCity(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold outline-hidden focus:border-amber-500 font-sans"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md border-0"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Sauvegarder les Configurations de Règlement</span>
            </button>
          </div>
        </form>
      </div>



      {/* 📋 HUB DE COMMUNICATION INTERNE: APPROBATION ET DÉBLOCAGE RAPIDE */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-sans" id="internal-communication-hub">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-950/80 border border-indigo-900 px-2.5 py-0.5 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse animate-spin" />
            <span>Serveur d'Abonnement National Elyssa</span>
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Hub de Communication Interne & Validation des Commandes d'Achat</span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold leading-normal font-sans">
            Ce tableau de bord centralise toutes les demandes reçues de la page d'achat ou du formulaire d'évaluation. 
            Suivez le protocole de sécurisation en deux étapes : <strong className="text-indigo-400">Étape 1</strong> : Émettre la clé de licence (le client peut la voir et la saisir). 
            <strong className="text-emerald-450">Étape 2</strong> : Confirmer la réception du virement sur le compte bancaire de l'entreprise pour activer la licence et libérer l'accès aux modules.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3 pt-3 border-t border-slate-800">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️ Actuellement : {licenceRequests.filter(req => isSimulationActive || !req.id.startsWith('demo-')).length} commande(s) listée(s)</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSimOrderForm(!showSimOrderForm);
                if (!simOrderCompanyName && mergedClients.length > 0) {
                  const potential = mergedClients.find(c => c.companyName?.toLowerCase() !== 'elyssa entreprises s.a.');
                  if (potential) {
                    setSimOrderCompanyName(potential.companyName);
                  }
                }
              }}
              className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-900/50 text-indigo-400 hover:text-white transition cursor-pointer flex items-center gap-1 shrink-0 border-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showSimOrderForm ? "Fermer le Simulateur" : "Simuler une nouvelle Commande Client"}</span>
            </button>
          </div>
        </div>

        {showSimOrderForm && (
          <form onSubmit={handleCreateSimulatedOrder} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <h4 className="text-[10.5px] font-black uppercase text-white tracking-wider">Générateur de Commande d'Achat Simulée</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Nom de l'Entreprise</label>
                <input
                  type="text"
                  placeholder="Ex: SOUSSE LOGISTIQUE"
                  value={simOrderCompanyName}
                  onChange={(e) => setSimOrderCompanyName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 p-2 text-xs font-bold font-sans outline-hidden focus:border-indigo-500"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Raccourcis :</span>
                  {mergedClients
                    .filter(c => c.companyName?.toLowerCase() !== 'elyssa entreprises s.a.')
                    .slice(0, 4)
                    .map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSimOrderCompanyName(c.companyName)}
                        className="text-[8px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                      >
                        {c.companyName}
                      </button>
                    ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Formule d'Abonnement</label>
                <select
                  value={simOrderPackId}
                  onChange={(e) => setSimOrderPackId(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 p-2 text-xs font-bold font-sans outline-hidden focus:border-indigo-500"
                >
                  <option value="independent">Elyssa Indépendant</option>
                  <option value="logistics">Logistique & Distribution</option>
                  <option value="full">Elyssa Intégrale</option>
                  <option value="custom">Sur-Mesure (Custom Modules)</option>
                  <option value="rh_only">RH & Paie Uniquement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Périodicité</label>
                <select
                  value={simOrderInterval}
                  onChange={(e) => setSimOrderInterval(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 p-2 text-xs font-bold font-sans outline-hidden focus:border-indigo-500"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Mode de Règlement attendu</label>
                <select
                  value={simOrderGateway}
                  onChange={(e) => setSimOrderGateway(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 p-2 text-xs font-bold font-sans outline-hidden focus:border-indigo-500"
                >
                  <option value="Virement">Virement Bancaire (Recommandé)</option>
                  <option value="Mandat">Mandat Minute (La Poste)</option>
                  <option value="Poste">Versement d'Espèces</option>
                  <option value="Flouci">Portefeuille Flouci</option>
                  <option value="Wafacash">Réseau Wafacash</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Adresse Email Contact</label>
                <input
                  type="email"
                  placeholder="contact@entreprise.tn"
                  value={simOrderEmail}
                  onChange={(e) => setSimOrderEmail(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 p-2 text-xs font-semibold font-sans outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 block">Montant Estimé (TND)</label>
                <input
                  type="number"
                  value={simOrderPrice}
                  onChange={(e) => setSimOrderPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 p-2 text-xs font-bold font-mono outline-hidden focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {simOrderPackId === 'custom' && (
              <div className="bg-[#0c142c] p-4 rounded-xl border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <label className="text-[8.5px] font-black uppercase text-indigo-400 block">Sélection des modules pour l'offre sur-mesure</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (simOrderModules.length === ALL_MODULES_METADATA.length) {
                        setSimOrderModules([]);
                      } else {
                        setSimOrderModules(ALL_MODULES_METADATA.map(m => m.id));
                      }
                    }}
                    className="text-[8px] text-slate-400 hover:text-white uppercase font-bold bg-slate-800 border-0 px-2 py-1 rounded cursor-pointer transition font-sans"
                  >
                    {simOrderModules.length === ALL_MODULES_METADATA.length ? "Tout Désélectionner" : "Tout Sélectionner"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 font-sans">
                  {ALL_MODULES_METADATA.map(mod => {
                    const isChecked = simOrderModules.includes(mod.id);
                    return (
                      <label key={mod.id} className={`flex items-start gap-1.5 p-2 rounded-lg border transition-all duration-200 cursor-pointer select-none text-[9.5px] font-bold font-sans ${
                        isChecked 
                          ? 'bg-indigo-950/45 border-indigo-800/80 text-white' 
                          : 'bg-slate-900/30 border-slate-850 text-slate-400 hover:bg-slate-850/40 hover:text-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSimOrderModules(prev => [...prev, mod.id]);
                            } else {
                              setSimOrderModules(prev => prev.filter(id => id !== mod.id));
                            }
                          }}
                          className="mt-0.5 accent-indigo-500 rounded text-indigo-650"
                        />
                        <span>{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer border-0 flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5 text-indigo-200" />
                <span>Simuler & Ajouter cette Commande d'Achat</span>
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3 font-sans font-semibold">
          {licenceRequests.filter(req => isSimulationActive || !req.id.startsWith('demo-')).length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-sans text-xs">
              Aucune demande d'achat ou d'essai en attente dans le hub de communication pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {licenceRequests
                .filter(req => isSimulationActive || !req.id.startsWith('demo-'))
                .map((req: any) => {
                const status = req.status || 'pending';
                const isPending = status === 'pending';
                const isEmitted = status === 'key_emitted';
                const isApproved = status === 'approved';

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 transition ${
                      isPending 
                        ? 'bg-slate-950/80 border-indigo-900/60 [box-shadow:0_0_15px_rgba(79,70,229,0.1)]' 
                        : isEmitted
                        ? 'bg-slate-950/90 border-amber-900/50 [box-shadow:0_0_15px_rgba(245,158,11,0.05)]'
                        : 'bg-slate-950/40 border-slate-850 opacity-80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{req.requestDate}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLicenseRequest(req.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer hover:bg-slate-900 border-0 flex items-center"
                            title="Supprimer cette demande du Hub"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {req.clientSubmittedKey && isEmitted && (
                            <span className="animate-pulse bg-emerald-950 text-emerald-400 border border-emerald-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Clé Saisie Client
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono border ${
                            isPending 
                              ? 'bg-red-950/85 text-red-400 border-red-900/50' 
                              : isEmitted
                              ? 'bg-amber-955 text-amber-400 border-amber-800/60'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-900/50'
                          }`}>
                            {isPending 
                              ? '● Étape 1 : Attente Émission' 
                              : isEmitted 
                              ? '🔏 Étape 2 : Attente Virement' 
                              : '✓ Licence Active'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-white uppercase tracking-tight">{req.companyName}</h4>
                          {req.id.startsWith('demo-') && (
                            <span className="bg-amber-950/60 text-amber-400 border border-amber-900/85 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider font-sans leading-none">Démo</span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-300 font-medium space-y-0.5">
                          <p>Contact : <span className="text-white font-semibold font-sans">{req.contactEmail}</span></p>
                          <p>Forfait d'Abonnement : <strong className="text-indigo-400 uppercase font-sans">{req.packId}</strong> ({req.interval})</p>
                          {req.packId === 'custom' && req.modules && req.modules.length > 0 && (
                            <p className="text-[10px] text-indigo-300 font-semibold leading-normal font-sans">
                              Modules demandés : <span className="text-slate-300">{req.modules.map((mId: string) => {
                                const mMeta = ALL_MODULES_METADATA.find(m => m.id === mId);
                                return mMeta ? mMeta.name : mId;
                              }).join(', ')}</span>
                            </p>
                          )}
                          <p>Montant Attendu : <strong className="text-emerald-450 font-mono">{req.price} TND</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-850 flex flex-col gap-2 font-sans">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleEmitLicenseKey(req.id)}
                          className="w-full bg-indigo-650 hover:bg-indigo-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer border-0 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Key className="w-3.5 h-3.5 text-indigo-255" />
                          <span>1. Générer & Émettre la Clé de Licence</span>
                        </button>
                      )}

                      {isEmitted && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-[8.5px] text-slate-450 uppercase font-bold font-sans">Clé de licence générée (Transmise au client) :</p>
                            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center flex items-center justify-between">
                              <span className="text-amber-400 font-mono text-[10px] font-bold select-all tracking-wider">{req.licenseKey}</span>
                              <span className="text-[8px] text-amber-500 font-black uppercase bg-amber-950/80 border border-amber-900 px-1 py-0.5 rounded leading-none">Inactive (Attente)</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleActivateLicenseRequest(req.id)}
                            className="w-full bg-emerald-650 hover:bg-emerald-555 text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer border-0 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>2. Confirmer Virement (Activer la Licence)</span>
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="w-full space-y-1.5 leading-normal">
                          <p className="text-[9px] text-slate-450 uppercase font-bold font-sans">Clé de Licence Activée :</p>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center flex items-center justify-between">
                            <span className="text-emerald-400 font-mono text-[10px] font-bold select-all tracking-wider">{req.licenseKey || 'ELY-VAL-2026-X8AZ'}</span>
                            <span className="text-[8px] text-emerald-500 font-black uppercase bg-emerald-950 border border-emerald-900 px-1 py-0.5 rounded leading-none">Active & Débloquée</span>
                          </div>
                        </div>
                      )}

                      {/* Document consulting action for the Administrator */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDoc(req)}
                        className="w-full mt-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Consulter & Imprimer (BC/Facture)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* CHECKOUT SIMULATION MODAL (Elyssa Pay) */}
      <AnimatePresence>
        {(checkoutModule || checkoutPack) && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Elyssa Pay</h3>
                    <p className="text-[10px] text-indigo-300 font-semibold font-mono">Passerelle Nationale de Transaction Électronique</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCheckout}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer font-bold text-xs"
                >
                  Fermer
                </button>
              </div>

              {paymentStep === 'form' && (
                <form onSubmit={handleSimulatedPaymentSubmit} className="p-6 space-y-6">
                  
                  {/* Summary card */}
                  {(() => {
                    const basePrice = checkoutModule ? checkoutModule.price : (checkoutPack ? checkoutPack.price : 0);
                    const checkoutPrice = selectedInterval === 'monthly' ? basePrice : (selectedInterval === 'quarterly' ? Math.round(basePrice * 0.9) : Math.round(basePrice * 0.8));
                    const periodMonths = selectedInterval === 'monthly' ? 1 : (selectedInterval === 'quarterly' ? 3 : 12);
                    const amountHT = checkoutPrice * periodMonths;
                    const vatAmount = includeTva ? Math.round(amountHT * tvaRate / 100) : 0;
                    const totalTtc = amountHT + vatAmount;
                    const rsAmount = includeRs ? Math.round(amountHT * rsRate / 100) : 0;
                    const amountNetToPay = totalTtc - rsAmount;

                    return (
                      <div className="bg-indigo-950 text-white p-4.5 rounded-2xl space-y-2 border border-indigo-900 relative text-left font-sans">
                        <div className="absolute right-3 top-3 bg-indigo-800/80 p-1 rounded-lg text-indigo-300">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-indigo-400 block">
                          Facturation {selectedInterval === 'monthly' ? 'Mensuelle' : selectedInterval === 'quarterly' ? 'Trimestrielle (-10%)' : 'Annuelle (-20%)'}
                        </span>
                        <h4 className="text-xs font-black uppercase">
                          {checkoutModule ? `Module : ${checkoutModule.name}` : `Pack : ${checkoutPack?.name}`}
                        </h4>
                        <p className="text-[10px] text-indigo-200 leading-normal font-semibold max-w-xs">
                          {checkoutModule ? checkoutModule.desc : checkoutPack?.desc}
                        </p>
                        
                        {/* Financial breakdown */}
                        <div className="pt-2 border-t border-indigo-900/60 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-sans">
                          <div className="flex justify-between">
                            <span className="text-indigo-300 font-medium">Base Hors Taxe ({periodMonths}m) :</span>
                            <span className="font-mono font-bold">{amountHT} TND</span>
                          </div>
                          {includeTva && (
                            <div className="flex justify-between">
                              <span className="text-indigo-300 font-medium">TVA ({tvaRate}%) :</span>
                              <span className="font-mono font-bold">+{vatAmount} TND</span>
                            </div>
                          )}
                          {includeTva && (
                            <div className="flex justify-between col-span-2 border-b border-indigo-900/40 pb-1">
                              <span className="text-indigo-300 font-medium">Montant TTC :</span>
                              <span className="font-mono font-bold text-indigo-200">{totalTtc} TND</span>
                            </div>
                          )}
                          {includeRs && (
                            <div className="flex justify-between col-span-2">
                              <span className="text-amber-300 font-medium">Retenue Source ({rsRate}%) :</span>
                              <span className="font-mono font-bold text-amber-300">-{rsAmount} TND</span>
                            </div>
                          )}
                          <div className="flex justify-between col-span-2 pt-1 border-t border-indigo-900/40 items-center">
                            <span className="text-emerald-300 font-black uppercase text-[10px]">Net à payer :</span>
                            <strong className="text-lg font-black font-mono text-emerald-400">
                              {amountNetToPay} TND
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 🕒 BILLING INTERVAL SELECTOR IN BACKOFFICE */}
                  <div className="space-y-2 text-left">
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-450 block">Périodicité d'Engagement d'Abonnement</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSelectedInterval('monthly')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase transition cursor-pointer text-center leading-none ${
                          selectedInterval === 'monthly'
                            ? 'bg-slate-900 text-white shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                        }`}
                      >
                        Mensuel (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInterval('quarterly')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase transition cursor-pointer text-center leading-none ${
                          selectedInterval === 'quarterly'
                            ? 'bg-slate-900 text-white shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                        }`}
                      >
                        Trimestriel (-10%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInterval('yearly')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase transition cursor-pointer text-center leading-none ${
                          selectedInterval === 'yearly'
                            ? 'bg-slate-900 text-white shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                        }`}
                      >
                        Annuel (-20%)
                      </button>
                    </div>
                  </div>

                  {/* 🇹🇳 FISCAL & TAX CONFIGURATION PANEL (TVA & RS) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3 font-sans">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span>🇹🇳 Fiscalité Tunisienne (TVA & Retenue)</span>
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* TVA Selector */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={includeTva}
                              onChange={(e) => setIncludeTva(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className={`text-[11px] font-sans transition-all duration-200 ${includeTva ? 'text-indigo-400 font-black animate-clignote' : 'text-slate-750 font-bold'}`}>Appliquer la TVA</span>
                          </label>
                        </div>
                        {includeTva && (
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="text-[10px] text-slate-400 font-bold">Taux (%) :</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tvaRate}
                              onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)}
                              className="w-16 text-center text-[11px] font-mono font-bold p-1 border border-slate-200 rounded focus:outline-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500 font-mono">%</span>
                          </div>
                        )}
                      </div>

                      {/* Retenue à la source Selector */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={includeRs}
                              onChange={(e) => setIncludeRs(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className={`text-[11px] font-sans transition-all duration-200 ${includeRs ? 'text-indigo-400 font-black animate-clignote' : 'text-slate-750 font-bold'}`}>Retenue Source (RS)</span>
                          </label>
                        </div>
                        {includeRs && (
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="text-[10px] text-slate-400 font-bold">Taux (%) :</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={rsRate}
                              onChange={(e) => setRsRate(parseFloat(e.target.value) || 0)}
                              className="w-16 text-center text-[11px] font-mono font-bold p-1 border border-slate-200 rounded focus:outline-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500 font-mono">%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TAB SELECTOR FOR CARD vs WIRE */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={!isOnlineCardActive}
                      onClick={() => setCheckoutPaymentMethod('card')}
                      className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition text-center flex items-center justify-center gap-1.5 relative ${
                        !isOnlineCardActive
                          ? 'opacity-35 cursor-not-allowed bg-slate-200/50 text-slate-400 border border-transparent'
                          : checkoutPaymentMethod === 'card'
                          ? 'bg-white text-slate-900 shadow-3xs font-black border border-slate-200 cursor-pointer'
                          : 'text-slate-500 hover:text-slate-800 font-bold cursor-pointer'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Par Carte (Direct)</span>
                      {!isOnlineCardActive && (
                        <span className="absolute -top-1.5 -right-1 bg-rose-650 text-white text-[5.5px] px-1 rounded font-sans font-bold leading-none py-0.5 uppercase tracking-wide">
                          Grisé
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutPaymentMethod('wire')}
                      className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        checkoutPaymentMethod === 'wire'
                          ? 'bg-white text-slate-900 shadow-3xs font-black border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800 font-bold'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Par Virement (Clé)</span>
                    </button>
                  </div>

                  {checkoutPaymentMethod === 'card' ? (
                    <div className="space-y-4 text-left">
                      {/* Payment Gateway selector */}
                      <div className="space-y-2">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-450 block">Agrégateur de Règlement Tunisien</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'Flouci', name: 'Carte Bancaire', badge: 'Visa/MC/CIB' },
                            { id: 'e-DINAR', name: 'e-Dinar', badge: 'Poste.tn' },
                            { id: 'Poste', name: 'D-S17', badge: 'Mobile' },
                            { id: 'Visa', name: 'Terminal Manuel', badge: 'Elyssa Pay' }
                          ].map((gate) => (
                            <button
                              key={gate.id}
                              type="button"
                              onClick={() => setPayGateway(gate.id as any)}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                                payGateway === gate.id
                                  ? 'border-indigo-500 bg-indigo-950/60 text-white font-extrabold ring-1 ring-indigo-900'
                                  : 'border-slate-200 hover:border-slate-350 text-slate-650'
                              }`}
                            >
                              <strong className="text-[10px] font-black block leading-none">{gate.name}</strong>
                              <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-1 font-semibold leading-none">{gate.badge}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {payGateway === 'Flouci' ? (
                        <div className="bg-cyan-50 border border-cyan-150 p-4.5 rounded-2xl text-left space-y-3.5 font-sans">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-cyan-600 text-white rounded-lg">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-[11px] font-black uppercase text-cyan-900 leading-none">Paiement par Carte Bancaire</h5>
                              <span className="text-[9px] text-cyan-600 font-semibold">Tunisie (Portail de Transaction Nationale Sécurisée)</span>
                            </div>
                          </div>
                          
                          <p className="text-[10.5px] text-cyan-800 leading-relaxed font-semibold font-sans">
                            Vous allez être redirigé vers l'interface de paiement hautement sécurisée pour finaliser le règlement. Vous pourrez y payer en toute sécurité avec n'importe quelle carte bancaire (Nationale ou Internationale).
                          </p>

                          {flouciError && (
                            <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[10px] rounded-lg font-bold">
                              ⚠️ {flouciError}
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-3.5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/10 border-0"
                          >
                            <Unlock className="w-3.5 h-3.5 text-cyan-200" />
                            <span>Payer et Activer par Carte Bancaire</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Secure credit card inputs simulation */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block">Numéro de la Carte Tunisienne</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="ex. 0000 0000 0000 0000"
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-8 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block">Titulaire de la Carte</label>
                                <input
                                  type="text"
                                  value={cardHolder}
                                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                  placeholder="ZIED BEN MILED"
                                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-bold tracking-wide"
                                  required
                                />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block">Expiration & CVV</label>
                                <div className="flex gap-2.5">
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    placeholder="MM/AA"
                                    className="w-1/2 text-center text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono font-bold"
                                    maxLength={5}
                                    required
                                  />
                                  <input
                                    type="text"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value)}
                                    placeholder="CVV"
                                    className="w-1/2 text-center text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500 font-mono font-bold"
                                    maxLength={3}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-start space-x-2">
                            <Info className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-500 leading-normal font-semibold font-sans">
                              Le présent paiement est une simulation sécurisée d'acquisition de licences. Aucun prélèvement réel ne sera engagé. Les droits administratifs d'exploitation s'enregistrent en mémoire locale.
                            </p>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-emerald-600 hover:text-white text-white font-extrabold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 border-0"
                          >
                            <Unlock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Confirmer le Règlement & Activer les Droits</span>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      {/* Bank details panel */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs font-sans">
                        <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">🏦 Coordonnées Bancaires Elyssa Officiel :</h5>
                        <div className="space-y-1.5 leading-relaxed font-semibold">
                          <div className="flex justify-between font-sans">
                            <span className="text-slate-500">Banque :</span>
                            <strong className="text-slate-800 uppercase">{bankName}</strong>
                          </div>
                          <div className="flex justify-between font-sans">
                            <span className="text-slate-500 font-sans">Titulaire (RIB) :</span>
                             <strong className="text-slate-800 uppercase">{bankOwner}</strong>
                          </div>
                          <div className="flex justify-between font-sans">
                            <span className="text-slate-500 font-mono font-sans">RIB National :</span>
                            <strong className="text-indigo-650 font-mono font-sans">{bankRib}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-start space-x-2 text-[10.5px] leading-relaxed font-semibold text-slate-650 font-sans">
                        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>La soumission transmet immédiatement un bon de commande au <strong>Hub Administrateur Elyssa (SuperAdmin)</strong>. Vous obtiendrez votre clé de licence sécurisée dès reception de votre virement.</span>
                      </div>

                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="wire_agree_checkout"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                          required
                        />
                        <label htmlFor="wire_agree_checkout" className="text-[10px] text-slate-500 select-none cursor-pointer leading-normal font-bold font-sans">
                          {(() => {
                            const basePrice = checkoutModule ? checkoutModule.price : (checkoutPack ? checkoutPack.price : 0);
                            const checkoutPrice = selectedInterval === 'monthly' ? basePrice : (selectedInterval === 'quarterly' ? Math.round(basePrice * 0.9) : Math.round(basePrice * 0.8));
                            const periodMonths = selectedInterval === 'monthly' ? 1 : (selectedInterval === 'quarterly' ? 3 : 12);
                            const amountHT = checkoutPrice * periodMonths;
                            const vatAmount = includeTva ? Math.round(amountHT * tvaRate / 100) : 0;
                            const totalTtc = amountHT + vatAmount;
                            const rsAmount = includeRs ? Math.round(amountHT * rsRate / 100) : 0;
                            const amountNetToPay = totalTtc - rsAmount;
                            return (
                              <span>
                                Je m'engage formellement au nom de <strong className="text-slate-700 uppercase font-sans">{activeCompanyName}</strong> à initier le virement bancaire d'un montant net à payer de <strong className="text-emerald-650 font-mono font-sans">{amountNetToPay} TND</strong> sous 48h ({amountHT} TND HT {includeTva && `+ ${vatAmount} TND TVA (${tvaRate}%)`} {includeRs && `- ${rsAmount} TND Retenue à la source (${rsRate}%)`}).
                              </span>
                            );
                          })()}
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const basePrice = checkoutModule ? checkoutModule.price : (checkoutPack ? checkoutPack.price : 0);
                            const checkoutPrice = selectedInterval === 'monthly' ? basePrice : (selectedInterval === 'quarterly' ? Math.round(basePrice * 0.9) : Math.round(basePrice * 0.8));
                            const periodMonths = selectedInterval === 'monthly' ? 1 : (selectedInterval === 'quarterly' ? 3 : 12);
                            const amountHT = checkoutPrice * periodMonths;
                            const vatAmount = includeTva ? Math.round(amountHT * tvaRate / 100) : 0;
                            const totalTtc = amountHT + vatAmount;
                            const rsAmount = includeRs ? Math.round(amountHT * rsRate / 100) : 0;
                            const amountNetToPay = totalTtc - rsAmount;

                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const titleLabel = checkoutPack ? `PACK : ${checkoutPack.name}` : `MODULE : ${checkoutModule?.name}`;
                              const descLabel = checkoutPack ? checkoutPack.desc : checkoutModule?.desc;
                              const refCode = orderRefCode || `CMD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Bon de Commande Elyssa SaaS</title>
                                    <style>
                                      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; font-size: 11px; }
                                      .invoice-card { max-width: 720px; margin: 10px auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; box-sizing: border-box; }
                                      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 12px; }
                                      .logo { font-size: 20px; font-weight: bold; color: rgb(79, 70, 229); }
                                      .title { font-size: 12px; text-transform: uppercase; font-weight: bold; margin-top: 10px; margin-bottom: 6px; color: #1e293b; border-left: 3px solid rgb(79, 70, 229); padding-left: 6px; }
                                      .table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 10.5px; }
                                      .table th, .table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                                      .table th { background: #f1f5f9; font-weight: bold; color: #334155; }
                                      .rib-block { background: #f8fafc; border: 1px dashed rgb(79, 70, 229); padding: 10px; border-radius: 6px; margin: 8px 0; }
                                      .ref { font-family: monospace; font-size: 13px; font-weight: bold; color: rgb(79, 70, 229); }
                                      .seal { margin-top: 15px; text-align: right; font-size: 9.5px; text-transform: uppercase; font-weight: bold; color: #64748b; }
                                      @media print {
                                        @page { size: A4; margin: 0.4cm; }
                                        body { padding: 0 !important; margin: 0 !important; font-size: 11px !important; }
                                        .invoice-card { border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="invoice-card">
                                      <div class="header">
                                        <div>
                                          <div class="logo">ELYSSA CRM & ERP</div>
                                          <div style="font-weight: bold; margin-top: 4px;">Éditeur : Inter-Affaires</div>
                                          <div>Tunis, Tunisie</div>
                                        </div>
                                        <div style="text-align: right;">
                                          <strong style="font-size: 12px; color: rgb(79, 70, 229);">BON DE COMMANDE PRO-FORMA</strong>
                                          <div style="margin-top: 4px;">Réf: <span class="ref">${refCode}</span></div>
                                          <div>Date: ${new Date().toLocaleDateString('fr-TN')}</div>
                                        </div>
                                      </div>
                                      
                                      <div class="title">Bénéficiaire de l'Abonnement</div>
                                      <p style="margin: 4px 0 10px 0;">
                                        <strong>Société :</strong> ${activeCompanyName}<br/>
                                        <strong>Régime d'activation :</strong> Forfait Prédéfini
                                      </p>

                                      <div class="title">Abonnement Commandé</div>
                                      <table class="table">
                                        <thead>
                                          <tr>
                                            <th>Désignation</th>
                                            <th>Description</th>
                                            <th style="text-align: right; width: 120px;">Tarif Mensuel (HT)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td style="font-weight: bold; color: rgb(79, 70, 229);">${titleLabel}</td>
                                            <td>${descLabel}</td>
                                            <td style="text-align: right; font-weight: bold;">${checkoutPrice} TND / mois</td>
                                          </tr>
                                          <tr style="font-weight: bold;">
                                            <td colspan="2" style="text-align: right;">TOTAL HORS TAXE :</td>
                                            <td style="text-align: right;">${amountHT} TND</td>
                                          </tr>
                                          ${includeTva ? `
                                            <tr>
                                              <td colspan="2" style="text-align: right;">TVA (${tvaRate}%) :</td>
                                              <td style="text-align: right; font-weight: bold; color: #10b981;">+${vatAmount} TND</td>
                                            </tr>
                                            <tr style="font-weight: bold; background-color: #f8fafc;">
                                              <td colspan="2" style="text-align: right;">TOTAL TTC :</td>
                                              <td style="text-align: right;">${totalTtc} TND</td>
                                            </tr>
                                          ` : ''}
                                          ${includeRs ? `
                                            <tr>
                                              <td colspan="2" style="text-align: right; color: #b45309;">Retenue à la Source (${rsRate}%) :</td>
                                              <td style="text-align: right; font-weight: bold; color: #b45309;">-${rsAmount} TND</td>
                                            </tr>
                                          ` : ''}
                                          <tr style="font-weight: bold; background-color: #f1f5f9; font-size: 12px;">
                                            <td colspan="2" style="text-align: right; text-transform: uppercase; color: rgb(79, 70, 229);">Total net à payer (${selectedInterval === 'monthly' ? 'Période 1 mois' : selectedInterval === 'quarterly' ? 'Période 3 mois (Trimestre)' : 'Période 12 mois (An)'}) :</td>
                                            <td style="text-align: right; color: rgb(79, 70, 229); font-size: 13px;">${amountNetToPay} TND</td>
                                          </tr>
                                        </tbody>
                                      </table>

                                      <div class="title">Coordonnées Bancaires de l'Éditeur pour Règlement</div>
                                      <div class="rib-block">
                                        <strong>Banque :</strong> ${bankName}<br/>
                                        <strong>Titulaire du Compte :</strong> ${bankOwner}<br/>
                                        <strong>Bureau / Agence :</strong> ${bankAgency}<br/>
                                        <strong>RIB Tunisien :</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: rgb(16, 185, 129);">${bankRib}</span>
                                      </div>
                                      <p style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 10px; line-height: 1.4;">
                                        <strong>Instructions Importantes :</strong> Pour valider votre paiement définitivement, veuillez reporter scrupuleusement la référence de commande dans l'intitulé de votre virement bancaire ou l'annoter sur votre bordereau de versement d'espèces en compte bancaire.
                                      </p>

                                      <div class="seal">
                                        Elyssa Entreprises - Validateur National Certifié<br/>
                                        Génération Électronique - Conforme réglementation 2026
                                      </div>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="w-full sm:w-auto bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-extrabold text-[10.5px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 font-sans"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Imprimer le Bon</span>
                        </button>

                        <button
                          type="submit"
                          className="flex-1 bg-indigo-650 hover:bg-slate-900 hover:text-white text-white font-extrabold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 border-0 font-sans"
                        >
                          <Building className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Confirmer par Virement</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}

              {paymentStep === 'loading' && (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Validation Bancaire Securisée...</h4>
                  <p className="text-[10px] text-slate-400">Communication sécurisée Elyssa Pay avec la Société Interbancaire de Monétique.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-black uppercase text-slate-900">Paiement Autorisé</h4>
                  <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-4 py-1.5 rounded-full">
                    Les modules d'accès Elyssa CRM ont été débloqués avec succès !
                  </p>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛒 MODAL DE CASHOUT HISTORIQUE/E-COMMERCE (Virement & Versement Espèces) */}
      <AnimatePresence>
        {isCartCheckoutOpen && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative font-sans self-start my-8"
            >
              {/* Decorative elements */}
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-650 opacity-10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-indigo-950/75 border border-indigo-900 rounded-lg text-indigo-400">
                    <ShoppingCart className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Bon de Commande & Mode de Règlement</h3>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono">Process de Règlement par Virement Bancaire ou Versement Espèces</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartCheckoutOpen(false)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-black text-slate-300 hover:text-white transition cursor-pointer relative z-20 border border-slate-800"
                >
                  Fermer
                </button>
              </div>

              {cartCheckoutStep === 'details' && (
                <form onSubmit={handleCartCheckoutSubmit} className="p-6 space-y-6">

                  {/* 🌟 ULTRA PROMINENT PERIOD SELECTOR (CRITICAL FOR VISIBILITY) */}
                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Engagement & Périodicité de Facturation</h4>
                        <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">Bénéficiez de remises immédiates et récurrentes sur vos modules opérationnels "À la Carte".</p>
                      </div>
                      <span className="bg-emerald-950/70 border border-emerald-900/50 text-emerald-400 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                        Économisez jusqu'à -20%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                      {(['monthly', 'quarterly', 'yearly'] as const).map(inv => {
                        const isSelected = cartInterval === inv;
                        return (
                          <button
                            key={inv}
                            type="button"
                            onClick={() => setCartInterval(inv)}
                            className={`p-3.5 rounded-2xl border transition-all duration-300 text-center flex flex-col justify-center items-center gap-1.5 cursor-pointer transform hover:scale-[1.01] ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-400 text-white shadow-xl shadow-indigo-600/35 ring-2 ring-indigo-500/20 scale-[1.04] font-black'
                                : 'bg-[#0b1329] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-100 hover:bg-[#0f1a3a]'
                            }`}
                          >
                            <span className="text-[11px] font-black uppercase tracking-wider">
                              {inv === 'monthly' ? 'Mensuel' : inv === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                            </span>
                            <span className={`text-[9px] font-extrabold ${
                              isSelected
                                ? inv === 'monthly' ? 'text-indigo-200 animate-pulse' : inv === 'quarterly' ? 'text-amber-300 animate-clignote-amber' : 'text-emerald-300 animate-clignote-green'
                                : inv === 'monthly' ? 'text-slate-500' : inv === 'quarterly' ? 'text-amber-500/85 animate-clignote-amber' : 'text-emerald-500/85 animate-clignote-green'
                            }`}>
                              {inv === 'monthly' ? 'Plein Tarif' : inv === 'quarterly' ? 'Remise -10%' : 'Remise -20%'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid layout of order listing and bank transfer instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Column 1: Invoice items summary */}
                    <div className="md:col-span-5 space-y-4">
                      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 space-y-3">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-indigo-400 block font-mono font-sans">Abonnements Sélectionnés</span>
                        
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).map(mod => {
                            const itemPrice = cartInterval === 'monthly' ? mod.price : (cartInterval === 'quarterly' ? Math.round(mod.price * 0.9) : Math.round(mod.price * 0.8));
                            return (
                              <div key={mod.id} className="text-[11px] flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-850 font-sans">
                                <span className="font-extrabold truncate pr-2 text-slate-200 font-sans">{mod.name}</span>
                                <strong className="font-mono text-emerald-400 text-xs shrink-0 font-sans">{itemPrice} TND</strong>
                              </div>
                            );
                          })}
                        </div>

                        {/* Fiscal controls inside cart checkout */}
                        <div className="pt-2 border-t border-slate-850 space-y-2.5 font-sans">
                          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block font-mono">Options Fiscales Tunisiennes</span>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={includeTva}
                                onChange={(e) => setIncludeTva(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-800 w-3.5 h-3.5"
                              />
                              <span className={`transition-all duration-200 ${includeTva ? 'text-indigo-400 font-black animate-clignote' : 'text-slate-500 font-bold hover:text-slate-400'}`}>TVA ({tvaRate}%)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={includeRs}
                                onChange={(e) => setIncludeRs(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-800 w-3.5 h-3.5"
                              />
                              <span className={`transition-all duration-200 ${includeRs ? 'text-indigo-400 font-black animate-clignote' : 'text-slate-500 font-bold hover:text-slate-400'}`}>Retenue ({rsRate}%)</span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-850 space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 font-sans">
                            <span>Date du bon :</span>
                            <span>{new Date().toLocaleDateString('fr-TN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 font-sans">
                            <span>Référence de commande :</span>
                            <span className="font-mono text-indigo-350 font-sans font-extrabold">{orderRefCode}</span>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-850 space-y-1 font-sans text-[11px]">
                            {(() => {
                              const cartBaseTotal = ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
                              const cartMonthlyRate = cartInterval === 'monthly' ? cartBaseTotal : (cartInterval === 'quarterly' ? Math.round(cartBaseTotal * 0.9) : Math.round(cartBaseTotal * 0.8));
                              const cartTotalHT = cartInterval === 'monthly' ? cartMonthlyRate : (cartInterval === 'quarterly' ? cartMonthlyRate * 3 : cartMonthlyRate * 12);
                              const cartVatVal = includeTva ? Math.round(cartTotalHT * tvaRate / 100) : 0;
                              const cartTotalTTC = cartTotalHT + cartVatVal;
                              const cartRsVal = includeRs ? Math.round(cartTotalHT * rsRate / 100) : 0;
                              const cartNetToPay = cartTotalTTC - cartRsVal;

                              return (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Base Hors Taxe :</span>
                                    <span className="font-mono font-bold text-slate-200">{cartTotalHT} TND</span>
                                  </div>
                                  {includeTva && (
                                    <div className="flex justify-between text-slate-400">
                                      <span>TVA ({tvaRate}%) :</span>
                                      <span className="font-mono font-bold text-slate-200">+{cartVatVal} TND</span>
                                    </div>
                                  )}
                                  {includeRs && (
                                    <div className="flex justify-between text-amber-400 font-bold">
                                      <span>Retenue Source ({rsRate}%) :</span>
                                      <span className="font-mono">-{cartRsVal} TND</span>
                                    </div>
                                  )}
                                  <div className="pt-1.5 border-t border-slate-850 flex justify-between items-baseline">
                                    <span className="text-[10px] font-black uppercase text-slate-200">Net à Payer :</span>
                                    <div className="text-right">
                                      <strong className="text-base font-black font-mono text-emerald-400">
                                        {cartNetToPay} TND
                                      </strong>
                                      <span className="text-[8px] text-slate-500 font-black uppercase block leading-none font-mono mt-0.5">
                                        {cartInterval === 'monthly' ? 'Période 1 mois' : cartInterval === 'quarterly' ? 'Période 3 mois' : 'Période 12 mois'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-300" />
                          <span className="text-[10px] font-black tracking-wider uppercase text-indigo-300">Alerte Déblocage Temporaire</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-semibold leading-relaxed font-sans">
                          Dès confirmation, les modules s'activeront instantanément sur votre console Elyssa ERP. Vous disposez de <strong>48 heures</strong> pour que Elyssa Entreprises perçoive le virement sur son RIB ci-contre.
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Bank details credentials display */}
                    <div className="md:col-span-7 space-y-4">
                      
                      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-4 font-sans">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10.5px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5 font-mono font-sans">
                            <span>🏦 Coordonnées de l'Éditeur</span>
                          </h4>
                          <span className="bg-emerald-950/70 border border-emerald-950 text-emerald-400 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                            Compte Virement
                          </span>
                        </div>

                        {/* Mode tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-[#060c1e] rounded-2xl border border-slate-800/80 shadow-inner">
                          {/* Virement Tab */}
                          <button
                            key="tab_virement"
                            type="button"
                            disabled={!isVirementActive}
                            onClick={() => setPaymentReceiptMethod('virement')}
                            className={`py-2 px-1.5 rounded-xl text-[9.5px] font-black uppercase transition-all duration-200 cursor-pointer text-center leading-tight flex flex-col justify-center items-center gap-0.5 ${
                              !isVirementActive
                                ? 'opacity-30 cursor-not-allowed bg-slate-950/40 text-slate-600 border border-slate-900'
                                : paymentReceiptMethod === 'virement'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/20 scale-[1.04]'
                                : 'bg-[#0c142c] text-slate-400 hover:text-white hover:bg-[#132040] border border-slate-800/60'
                            }`}
                          >
                            <span>Virement</span>
                            {!isVirementActive && <span className="block text-[6.5px] text-rose-500 font-bold leading-none mt-0.5">Désactivé</span>}
                          </button>

                          {/* Versement Espèces Tab */}
                          <button
                            key="tab_especes"
                            type="button"
                            disabled={!isVersementActive}
                            onClick={() => setPaymentReceiptMethod('especes')}
                            className={`py-2 px-1.5 rounded-xl text-[9.5px] font-black uppercase transition-all duration-200 cursor-pointer text-center leading-tight flex flex-col justify-center items-center gap-0.5 ${
                              !isVersementActive
                                ? 'opacity-30 cursor-not-allowed bg-slate-950/40 text-slate-600 border border-slate-900'
                                : paymentReceiptMethod === 'especes'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/20 scale-[1.04]'
                                : 'bg-[#0c142c] text-slate-400 hover:text-white hover:bg-[#132040] border border-slate-800/60'
                            }`}
                          >
                            <span>Versement</span>
                            {!isVersementActive && <span className="block text-[6.5px] text-rose-500 font-bold leading-none mt-0.5">Désactivé</span>}
                          </button>

                          {/* Mandat Wafacash Tab */}
                          <button
                            key="tab_wafacash"
                            type="button"
                            disabled={!isWafacashActive}
                            onClick={() => setPaymentReceiptMethod('wafacash')}
                            className={`py-2 px-1.5 rounded-xl text-[9.5px] font-black uppercase transition-all duration-200 cursor-pointer text-center leading-tight flex flex-col justify-center items-center gap-0.5 ${
                              !isWafacashActive
                                ? 'opacity-30 cursor-not-allowed bg-slate-950/40 text-slate-600 border border-slate-900'
                                : paymentReceiptMethod === 'wafacash'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/20 scale-[1.04]'
                                : 'bg-[#0c142c] text-slate-400 hover:text-white hover:bg-[#132040] border border-slate-800/60'
                            }`}
                          >
                            <span>Wafacash</span>
                            {!isWafacashActive && <span className="block text-[6.5px] text-rose-500 font-bold leading-none mt-0.5">Désactivé</span>}
                          </button>

                          {/* CARTE BANCAIRE Tab */}
                          <button
                            key="tab_flouci"
                            type="button"
                            disabled={!isOnlineCardActive}
                            onClick={() => setPaymentReceiptMethod('flouci')}
                            className={`py-2 px-1.5 rounded-xl text-[9.5px] font-black uppercase transition-all duration-200 cursor-pointer text-center leading-tight flex flex-col justify-center items-center gap-1 ${
                              !isOnlineCardActive
                                ? 'opacity-30 cursor-not-allowed bg-slate-950/40 text-slate-600 border border-slate-900'
                                : paymentReceiptMethod === 'flouci'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/20 scale-[1.04]'
                                : 'bg-[#0c142c] text-slate-400 hover:text-white hover:bg-[#132040] border border-slate-800/60'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>CARTE BANCAIRE</span>
                            {isOnlineCardActive ? (
                              <span className="bg-cyan-600/20 text-cyan-400 text-[6px] px-1 rounded border border-cyan-500/25 font-sans font-black tracking-wide animate-pulse">
                                Actif
                              </span>
                            ) : (
                              <span className="bg-amber-600/10 text-amber-500 text-[6px] px-1 rounded border border-amber-500/25 font-sans font-black tracking-wide">
                                Bientôt
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Selected payment details block */}
                        <div className="space-y-2.5 text-xs">
                          {paymentReceiptMethod === 'flouci' ? (
                            <div className="bg-cyan-950/40 border border-cyan-900/40 p-3.5 rounded-xl space-y-2.5">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-cyan-600/20 text-cyan-400 rounded-lg">
                                  <CreditCard className="w-3.5 h-3.5" />
                                </span>
                                <strong className="text-cyan-400 text-[11px] font-black uppercase font-sans">Paiement Sécurisé par Carte Bancaire</strong>
                              </div>
                              <p className="text-[10px] text-slate-300 font-sans leading-relaxed text-left">
                                Vous allez être redirigé vers notre passerelle de paiement bancaire hautement sécurisée pour finaliser le règlement. Les droits d'accès et modules s'activeront de manière **immédiate et automatisée** dès réception de la confirmation bancaire.
                              </p>
                              {flouciError && (
                                <div className="p-3 bg-rose-950/50 border border-rose-900/40 rounded-xl text-rose-300 text-[10px] font-bold leading-normal">
                                  ⚠️ {flouciError}
                                </div>
                              )}
                            </div>
                          ) : paymentReceiptMethod === 'wafacash' ? (
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-2.5">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Organisme de Transfert</span>
                                <strong className="text-white text-[11px] font-black block font-sans uppercase font-sans">WAFACASH Tunisie / Attijari Vert</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Nom Complet du Bénéficiaire (à l'ordre de)</span>
                                <strong className="text-white text-[11px] font-black block font-sans uppercase font-sans">{wafacashBeneficiary}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">CIN / Identifiant unique du bénéficiaire</span>
                                <strong className="text-indigo-300 font-mono text-[11px] font-black block font-sans">{wafacashCin}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Téléphone du bénéficiaire</span>
                                <strong className="text-white text-[11.5px] font-black block font-sans">{wafacashPhone}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Ville / Destination de retrait</span>
                                <strong className="text-white text-[11px] font-black block font-sans uppercase font-sans">{wafacashCity}</strong>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-2.5">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Banque Récipiendaire</span>
                                <strong className="text-white text-[11px] font-black block font-sans uppercase font-sans">{bankName}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Titulaire du compte (Bénéficiaire - au nom de INTER AFFAIRES)</span>
                                <strong className="text-white text-[11px] font-black block font-sans uppercase font-sans">{bankOwner}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block font-sans">Bureau / Agence d'encaissement</span>
                                <strong className="text-indigo-300 text-[11px] font-black block font-sans font-sans">{bankAgency}</strong>
                              </div>
                              <div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans">Code Unique RIB Tunisien (20 chiffres)</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(bankRib);
                                      alert("Le RIB électronique de l'éditeur a été copié !");
                                    }}
                                    className="text-[9px] font-bold text-emerald-450 hover:underline cursor-pointer uppercase font-sans border-0 bg-transparent p-0"
                                  >
                                    Copier
                                  </button>
                                </div>
                                <strong className="text-emerald-400 text-xs md:text-sm font-mono tracking-wider block font-black pt-0.5">{bankRib}</strong>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 italic leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-dashed border-slate-800 font-sans">
                            {paymentReceiptMethod === 'flouci' ? (
                              <span>⚡ <strong>Paiement en ligne :</strong> Vous allez être redirigé vers l'environnement de paiement sécurisé par Carte Bancaire. Les modules seront actifs dès la confirmation de la transaction.</span>
                            ) : paymentReceiptMethod === 'virement' ? (
                              <span>💡 <strong>Conseil :</strong> Mentionnez obligatoirement la référence <strong className="text-white font-mono">{orderRefCode}</strong> dans le motif ou l'intitulé de votre virement bancaire sur votre application mobile ou auprès de votre conseiller.</span>
                            ) : paymentReceiptMethod === 'especes' ? (
                              <span>💡 <strong>Conseil :</strong> Reportez scrupuleusement la référence de commande <strong className="text-white font-mono">{orderRefCode}</strong> sur votre bordereau de versement d'espèces en compte bancaire pour accélérer la validation définitive.</span>
                            ) : (
                              <span>💡 <strong>Conseil :</strong> Reportez la référence de commande <strong className="text-white font-mono">{orderRefCode}</strong> lors de l'envoi du mandat Wafacash, puis transmettez le code de transaction à notre service client.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Print section pro-forma preview action */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Format pro-forma disponible</span>
                      </span>
                      <p className="text-[10px] text-slate-450 font-semibold leading-normal font-sans">
                        Téléchargez ou imprimez le bon de commande pour votre service comptable.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const detailsBaseTotal = ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
                        const detailsMonthlyRate = cartInterval === 'monthly' ? detailsBaseTotal : (cartInterval === 'quarterly' ? Math.round(detailsBaseTotal * 0.9) : Math.round(detailsBaseTotal * 0.8));
                        const detailsTotalHT = cartInterval === 'monthly' ? detailsMonthlyRate : (cartInterval === 'quarterly' ? detailsMonthlyRate * 3 : detailsMonthlyRate * 12);
                        const detailsVatAmount = includeTva ? Math.round(detailsTotalHT * tvaRate / 100) : 0;
                        const detailsTotalTTC = detailsTotalHT + detailsVatAmount;
                        const detailsRsAmount = includeRs ? Math.round(detailsTotalHT * rsRate / 100) : 0;
                        const detailsNetToPay = detailsTotalTTC - detailsRsAmount;

                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Bon de Commande Elyssa SaaS</title>
                                <style>
                                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; font-size: 11px; }
                                  .invoice-card { max-width: 720px; margin: 10px auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; box-sizing: border-box; }
                                  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 12px; }
                                  .logo { font-size: 20px; font-weight: bold; color: rgb(79, 70, 229); }
                                  .title { font-size: 12px; text-transform: uppercase; font-weight: bold; margin-top: 10px; margin-bottom: 6px; color: #1e293b; border-left: 3px solid rgb(79, 70, 229); padding-left: 6px; }
                                  .table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 10.5px; }
                                  .table th, .table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                                  .table th { background: #f1f5f9; font-weight: bold; color: #334155; }
                                  .rib-block { background: #f8fafc; border: 1px dashed rgb(79, 70, 229); padding: 10px; border-radius: 6px; margin: 8px 0; }
                                  .ref { font-family: monospace; font-size: 13px; font-weight: bold; color: rgb(79, 70, 229); }
                                  .seal { margin-top: 15px; text-align: right; font-size: 9.5px; text-transform: uppercase; font-weight: bold; color: #64748b; }
                                  @media print {
                                    @page { size: A4; margin: 0.4cm; }
                                    body { padding: 0 !important; margin: 0 !important; font-size: 11px !important; }
                                    .invoice-card { border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="invoice-card">
                                  <div class="header">
                                    <div>
                                      <div class="logo">ELYSSA CRM & ERP</div>
                                      <div style="font-weight: bold; margin-top: 4px;">Éditeur : Inter-Affaires</div>
                                      <div>Tunis, Tunisie</div>
                                    </div>
                                    <div style="text-align: right;">
                                      <strong style="font-size: 12px; color: rgb(79, 70, 229);">BON DE COMMANDE PRO-FORMA</strong>
                                      <div style="margin-top: 4px;">Réf: <span class="ref">${orderRefCode}</span></div>
                                      <div>Date: ${new Date().toLocaleDateString('fr-TN')}</div>
                                    </div>
                                  </div>
                                  
                                  <div class="title">Bénéficiaire de l'Abonnement</div>
                                  <p style="margin: 4px 0 10px 0;">
                                    <strong>Société :</strong> ${activeCompanyName}<br/>
                                    <strong>Régime d'activation :</strong> Elyssa Sur-mesure (À la carte)
                                  </p>

                                  <div class="title">Modules Commandés</div>
                                  <table class="table">
                                    <thead>
                                      <tr>
                                        <th>Module Applicatif</th>
                                        <th>Catégorie</th>
                                        <th style="text-align: right;">Tarif Public (Mensuel HT)</th>
                                        <th style="text-align: right;">Tarif Ajusté (Mensuel HT)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).map(mod => {
                                        const adjustedPrice = cartInterval === 'monthly' ? mod.price : (cartInterval === 'quarterly' ? Math.round(mod.price * 0.9) : Math.round(mod.price * 0.8));
                                        return `
                                          <tr>
                                            <td>${mod.name}</td>
                                            <td>${mod.category}</td>
                                            <td style="text-align: right;">${mod.price} TND</td>
                                            <td style="text-align: right; font-weight: bold;">${adjustedPrice} TND</td>
                                          </tr>
                                        `;
                                      }).join('')}
                                      <tr style="font-weight: bold;">
                                        <td colspan="3" style="text-align: right;">TOTAL BRUT MENSUEL :</td>
                                        <td style="text-align: right;">${detailsBaseTotal} TND / mois</td>
                                      </tr>
                                      ${cartInterval !== 'monthly' ? `
                                        <tr style="font-weight: bold; color: rgb(16, 185, 129);">
                                          <td colspan="3" style="text-align: right;">REMISE APPLIQUÉE (${cartInterval === 'quarterly' ? '-10% (Engagement Trimestriel)' : '-20% (Engagement Annuel)'}) :</td>
                                          <td style="text-align: right;">-${detailsBaseTotal - detailsMonthlyRate} TND / mois</td>
                                        </tr>
                                      ` : ''}
                                      <tr style="font-weight: bold; background-color: #f8fafc;">
                                        <td colspan="3" style="text-align: right;">TOTAL HORS TAXE SUR LA PÉRIODE :</td>
                                        <td style="text-align: right;">${detailsTotalHT} TND</td>
                                      </tr>
                                      ${includeTva ? `
                                        <tr>
                                          <td colspan="3" style="text-align: right;">TVA (${tvaRate}%) :</td>
                                          <td style="text-align: right; font-weight: bold; color: #10b981;">+${detailsVatAmount} TND</td>
                                        </tr>
                                        <tr style="font-weight: bold; background-color: #f8fafc;">
                                          <td colspan="3" style="text-align: right;">TOTAL TTC :</td>
                                          <td style="text-align: right;">${detailsTotalTTC} TND</td>
                                        </tr>
                                      ` : ''}
                                      ${includeRs ? `
                                        <tr>
                                          <td colspan="3" style="text-align: right; color: #b45309;">Retenue à la Source (${rsRate}%) :</td>
                                          <td style="text-align: right; font-weight: bold; color: #b45309;">-${detailsRsAmount} TND</td>
                                        </tr>
                                      ` : ''}
                                      <tr style="font-weight: bold; background-color: #f1f5f9; font-size: 11px;">
                                        <td colspan="3" style="text-align: right; text-transform: uppercase; color: rgb(79, 70, 229);">
                                          TOTAL NET À PAYER (${cartInterval === 'monthly' ? 'Période 1 mois' : cartInterval === 'quarterly' ? 'Période de 3 mois (Trimestre)' : 'Période de 12 mois (An)'}) :
                                        </td>
                                        <td style="text-align: right; color: rgb(79, 70, 229); font-size: 13px;">
                                          ${detailsNetToPay} TND
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>

                                  ${paymentReceiptMethod === 'wafacash' ? `
                                    <div class="title">Coordonnées de Transfert Mandat Wafacash pour Règlement</div>
                                    <div class="rib-block" style="border-color: rgb(217, 119, 6);">
                                      <strong>Organisme de Transfert :</strong> WAFACASH Tunisie / Attijari Vert<br/>
                                      <strong>Nom Complet du Bénéficiaire :</strong> ${wafacashBeneficiary}<br/>
                                      <strong>CIN / Identifiant unique du bénéficiaire :</strong> ${wafacashCin}<br/>
                                      <strong>Téléphone :</strong> ${wafacashPhone}<br/>
                                      <strong>Ville / Destination :</strong> ${wafacashCity}
                                    </div>
                                    <p style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 10px; line-height: 1.4;">
                                      <strong>Instructions Importantes :</strong> Pour valider votre paiement définitivement, veuillez reporter la référence de commande <span class="ref">${orderRefCode}</span> lors de l'envoi de votre mandat Wafacash, puis transmettre le code de transaction à notre service client.
                                    </p>
                                  ` : `
                                    <div class="title">Coordonnées Bancaires de l'Éditeur pour Règlement</div>
                                    <div class="rib-block">
                                      <strong>Banque :</strong> ${bankName}<br/>
                                      <strong>Titulaire du Compte :</strong> ${bankOwner}<br/>
                                      <strong>Bureau / Agence :</strong> ${bankAgency}<br/>
                                      <strong>RIB Tunisien :</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: rgb(16, 185, 129);">${bankRib}</span>
                                    </div>
                                    <p style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 10px; line-height: 1.4;">
                                      <strong>Instructions Importantes :</strong> Pour valider votre paiement définitivement, veuillez reporter scrupuleusement la référence de commande <span class="ref">${orderRefCode}</span> dans l'intitulé de votre virement bancaire ou l'annoter sur votre bordereau de versement d'espèces en compte bancaire.
                                    </p>
                                  `}

                                  <div class="seal">
                                    Elyssa Entreprises - Validateur National Certifié<br/>
                                    Génération Électronique - Conforme réglementation 2026
                                  </div>
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 font-extrabold text-[10.5px] uppercase py-2 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 font-sans"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-400 font-sans" />
                      <span>Générer & Imprimer le Bon</span>
                    </button>
                  </div>

                  {/* Checkbox confirmation */}
                  <div className="space-y-3 pt-1 font-sans">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 leading-normal font-semibold font-sans">
                        {(() => {
                          const baseTotal = ALL_MODULES_METADATA.filter(m => cartModules.includes(m.id)).reduce((acc, c) => acc + c.price, 0);
                          const rate = cartInterval === 'monthly' ? baseTotal : (cartInterval === 'quarterly' ? Math.round(baseTotal * 0.9) : Math.round(baseTotal * 0.8));
                          const totalHT = cartInterval === 'monthly' ? rate : (cartInterval === 'quarterly' ? rate * 3 : rate * 12);
                          const vatVal = includeTva ? Math.round(totalHT * tvaRate / 100) : 0;
                          const totalTtc = totalHT + vatVal;
                          const rsVal = includeRs ? Math.round(totalHT * rsRate / 100) : 0;
                          const netToPay = totalTtc - rsVal;
                          if (paymentReceiptMethod === 'flouci') {
                            return (
                              <>
                                Je confirme vouloir procéder au paiement immédiat en ligne par **Carte Bancaire** au nom de <strong className="text-white uppercase">{activeCompanyName}</strong> pour un montant total net de <strong className="text-cyan-400">{netToPay} TND</strong>. Je comprends que je serai redirigé vers l'espace de paiement sécurisé.
                              </>
                            );
                          }
                          return (
                            <>
                              Je m'engage formellement au nom de <strong className="text-white uppercase">{activeCompanyName}</strong> à initier l'ordre de virement bancaire d'un montant net à payer de <strong className="text-emerald-400">{netToPay} TND</strong> sur le RIB officiel sous un délai de 48h ({totalHT} TND HT {includeTva && `+ ${vatVal} TND TVA (${tvaRate}%)`} {includeRs && `- ${rsVal} TND Retenue à la source (${rsRate}%)`}). Je comprends que mes modules s'activeront instantanément à titre temporaire.
                            </>
                          );
                        })()}
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={!agreedTerms}
                    className={`w-full font-black text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md border-0 uppercase cursor-pointer ${
                      !agreedTerms
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : paymentReceiptMethod === 'flouci'
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {paymentReceiptMethod === 'flouci' ? (
                      <CreditCard className="w-4 h-4 text-cyan-200 animate-pulse" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-250 animate-pulse" />
                    )}
                    <span>
                      {paymentReceiptMethod === 'flouci'
                        ? 'Procéder au paiement en ligne sécurisé'
                        : 'Confirmer la commande & Débloquer les modules'}
                    </span>
                  </button>
                </form>
              )}

              {cartCheckoutStep === 'submitting' && (
                <div className="p-16 text-center flex flex-col items-center justify-center space-y-4 font-sans">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                  <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono">
                    {paymentReceiptMethod === 'flouci'
                      ? "Génération de la session de paiement sécurisée..."
                      : "Transmission du Bon de Commande Tunisien..."}
                  </h4>
                  <p className="text-[10.5px] text-slate-405 font-sans">
                    {paymentReceiptMethod === 'flouci'
                      ? "Communication avec le serveur de paiement et génération de la session sécurisée par carte..."
                      : `Génération du matricule de liaison et enregistrement de l'activation pour l'entreprise ${activeCompanyName} dans Elyssa Core...`}
                  </p>
                </div>
              )}

              {cartCheckoutStep === 'success' && (
                <div className="p-16 text-center flex flex-col items-center justify-center space-y-5 font-sans">
                  <div className="w-14 h-14 rounded-full bg-indigo-950 border border-indigo-500 text-indigo-400 flex items-center justify-center animate-bounce">
                    <ThumbsUp className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-black uppercase text-white tracking-tight">Commande Soumise avec Succès !</h4>
                    <p className="text-[11px] text-amber-400 font-bold bg-amber-950/60 border border-amber-900/60 p-2 text-center rounded-xl inline-block px-5">
                      Régime en attente de validation Elyssa
                    </p>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed max-w-md font-semibold">
                    Félicitations <strong>{activeCompanyName}</strong> ! Votre commande À la Carte a été transmise avec succès à l'éditeur Elyssa Entreprises. Dès réception de votre virement ou versement, votre clé de licence sera émise ou l'administrateur activera vos modules directement.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartCheckoutOpen(false)}
                    className="bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase py-2.5 px-6 rounded-xl transition cursor-pointer border-0"
                  >
                    Fermer et retourner à l'espace d'évaluation
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 CLIENT EDITING POPUP MODAL (FICHE CLIENT MODIFIABLE) */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 relative [box-shadow:0_0_50px_rgba(79,70,229,0.25)] my-8 text-left">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition font-sans text-xs uppercase font-extrabold cursor-pointer hover:bg-slate-800 px-2 py-1 rounded"
            >
              Fermer ✕
            </button>

            <div className="space-y-1">
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-2.5 py-1 rounded-md text-[8.5px] font-black tracking-widest uppercase inline-block font-mono">
                ÉDITEUR DE CONSOLE ELYSSA SaaS
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Fiche Client Habilité : {editingClient.companyName}</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Modifiez en direct les privilèges de licence, le forfait d'habilitation et l'état de règlement de cet abonné. Les changements prennent effet instantanément.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditedClient(editingClient);
              }}
              className="space-y-4 font-sans text-xs font-semibold"
            >
              <div className="space-y-1">
                <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Raison Sociale de l'Abonné</label>
                <input
                  type="text"
                  required
                  value={editingClient.companyName}
                  onChange={(e) => setEditingClient({ ...editingClient, companyName: e.target.value })}
                  className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 font-sans shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Gouvernorat</label>
                  <select
                    value={editingClient.location}
                    onChange={(e) => setEditingClient({ ...editingClient, location: e.target.value })}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 cursor-pointer font-sans"
                  >
                    <option value="Tunis">Tunis (Berges du Lac)</option>
                    <option value="Sfax">Sfax (Zone Industrielle)</option>
                    <option value="Sousse">Sousse (Port)</option>
                    <option value="Monastir">Monastir</option>
                    <option value="Bizerte">Bizerte</option>
                    <option value="Gabès">Gabès</option>
                    <option value="Nabeul">Nabeul (Hammamet)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Forfait de Licence</label>
                  <select
                    value={editingClient.packId}
                    onChange={(e) => setEditingClient({ ...editingClient, packId: e.target.value })}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 cursor-pointer font-sans"
                  >
                    {customPacks.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Canal de Règlement</label>
                  <select
                    value={editingClient.paymentGateway}
                    onChange={(e) => setEditingClient({ ...editingClient, paymentGateway: e.target.value })}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 cursor-pointer font-sans"
                  >
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Versement">Versement Espèces</option>
                    <option value="FLOUCI">Portefeuille FLOUCI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Statut de la Licence</label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                    className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 cursor-pointer font-sans"
                  >
                    <option value="active">Actif (Paiement OK)</option>
                    <option value="trial">PÉRIODE D'ESSAI</option>
                    <option value="suspended">Hors service (Suspendu)</option>
                  </select>
                </div>
              </div>

              {/* 🕒 CHOOSE BILLING INTERVAL */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-black uppercase text-slate-450 block tracking-wider">Périodicité / Engagement de Facturation</label>
                <select
                  value={editingClient.interval || 'monthly'}
                  onChange={(e) => setEditingClient({ ...editingClient, interval: e.target.value as any })}
                  className="w-full bg-slate-950 text-white rounded-xl border border-slate-800/80 p-2.5 text-xs font-bold focus:border-indigo-500 cursor-pointer font-sans"
                >
                  <option value="monthly">Mensuel (Plein tarif)</option>
                  <option value="quarterly">Trimestriel (-10% de réduction)</option>
                  <option value="yearly">Annuel (-20% de réduction)</option>
                </select>
              </div>

              {/* 🧩 SELECTION OF CUSTOM MODULES IF THE PACK IS SUR-MESURE / CUSTOM */}
              {editingClient.packId === 'custom' && (
                <div className="space-y-2.5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-850">
                  <label className="text-[9.5px] font-black uppercase text-indigo-400 block tracking-wider">
                    Modules Sur-Mesure Habilités
                  </label>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    Sélectionnez les modules individuels activés pour ce client.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 mt-1.5">
                    {ALL_MODULES_METADATA.map((mod) => {
                      const isChecked = (editingClient.modules || []).includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border transition cursor-pointer text-[10px] font-bold ${
                            isChecked
                              ? 'bg-indigo-950/40 border-indigo-900 text-indigo-200'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let current = [...(editingClient.modules || [])];
                              if (e.target.checked) {
                                if (!current.includes(mod.id)) current.push(mod.id);
                              } else {
                                current = current.filter((id) => id !== mod.id);
                              }
                              setEditingClient({ ...editingClient, modules: current });
                            }}
                            className="rounded text-indigo-600 bg-slate-900 border-slate-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="truncate">{mod.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Réduction Commerciale (-20%)</span>
                  <input
                    type="checkbox"
                    checked={editingClient.customDiscount || false}
                    onChange={(e) => setEditingClient({ ...editingClient, customDiscount: e.target.checked })}
                    className="rounded text-indigo-600 bg-slate-900 border-slate-800 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Applique un abattement immédiat et récurrent de 20% sur la facture mensuelle calculée pour ce client.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="w-1/2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 border-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-300" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⛔ MODAL DE CONFIRMATION DE BLOCAGE / SUSPENSION / RÉACTIVATION COMPTE CLIENT */}
      <ConfirmationModal
        isOpen={!!clientToSuspend}
        onClose={() => setClientToSuspend(null)}
        onConfirm={() => {
          if (clientToSuspend) {
            handleToggleClientSuspend(clientToSuspend.id);
            setClientToSuspend(null);
          }
        }}
        title={clientToSuspend?.status === 'suspended' ? "Réactiver l'accès client ?" : "Bloquer / Suspendre le client ?"}
        subtitle={clientToSuspend?.status === 'suspended' ? "RÉACTIVATION COMPTE CLIENT" : "SUSPENSION & BLOCAGE COMPTE CLIENT"}
        type={clientToSuspend?.status === 'suspended' ? 'success' : 'warning'}
        confirmText={clientToSuspend?.status === 'suspended' ? "Réactiver L'Accès" : "Bloquer / Suspendre"}
        cancelText="Annuler"
        message={
          clientToSuspend?.status === 'suspended' ? (
            <>Êtes-vous sûr de vouloir réactiver l'accès pour l'entreprise <strong className="text-white">{clientToSuspend?.companyName}</strong> ? Ses modules et services ERP seront immédiatement rétablis.</>
          ) : (
            <>Êtes-vous sûr de vouloir bloquer et suspendre l'accès de l'entreprise <strong className="text-white">{clientToSuspend?.companyName}</strong> ? Les collaborateurs associés ne pourront plus se connecter à la suite Elyssa ERP.</>
          )
        }
        details={clientToSuspend ? [
          { label: "Raison Sociale", value: <span className="text-slate-200 font-sans">{clientToSuspend.companyName}</span> },
          { label: "Statut Actuel", value: <span className={clientToSuspend.status === 'suspended' ? 'text-rose-400 font-bold uppercase' : 'text-emerald-400 font-bold uppercase'}>{clientToSuspend.status === 'suspended' ? 'Hors Service (Suspendu)' : 'Actif'}</span> },
          { label: "Action Cible", value: <span className={clientToSuspend.status === 'suspended' ? 'text-emerald-400 font-bold uppercase' : 'text-amber-400 font-bold uppercase'}>{clientToSuspend.status === 'suspended' ? 'Réactivation d\'accès' : 'Blocage & Suspension'}</span> },
        ] : []}
      />

      {/* 🗑️ MODAL DE CONFIRMATION DE SUPPRESSION COMPTE CLIENT */}
      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDeletePublisherClient}
        title="Supprimer le client ?"
        subtitle="SUPPRESSION COMPTE ENTREPRISE"
        type="danger"
        confirmText="Supprimer Définitivement"
        cancelText="Annuler"
        message={
          <>Êtes-vous absolument sûr de vouloir supprimer définitivement le compte entreprise <strong className="text-white">{clientToDelete?.companyName}</strong> ? Ses accès et toutes ses commandes associées seront purgés de la console Elyssa ERP.</>
        }
        details={clientToDelete ? [
          { label: "Raison Sociale", value: <span className="text-slate-200 font-sans">{clientToDelete.companyName}</span> },
          { label: "Forfait souscrit", value: <span className="text-indigo-400 font-bold uppercase">{clientToDelete.packId}</span> },
          { label: "Rejoint le", value: <span className="text-slate-300">{clientToDelete.joinedDate}</span> },
          { label: "Attention", value: <span className="text-rose-400 font-semibold font-sans">⚠️ Retrait irréversible de l'accès ERP</span> },
        ] : []}
      />

      {/* 📋 MODAL DE CONFIRMATION DE SUPPRESSION DE BLOCS DE VALIDATION DES COMMANDES */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-slate-900 border border-red-900/40 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 relative [box-shadow:0_0_50px_rgba(239,68,68,0.15)] text-left">
            <button
              type="button"
              onClick={() => setRequestToDelete(null)}
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
                  SUPPRESSION DU BLOC DE VALIDATION
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-tight font-display">Supprimer cette commande d'achat ?</h3>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed font-sans">
                  Confirmez-vous le retrait de la commande #{requestToDelete.id.toUpperCase()} de l'entreprise <strong className="text-white">{requestToDelete.companyName}</strong> de votre hub de messagerie ?
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1 font-mono text-[9px] text-slate-400">
              <p>Client : <strong className="text-slate-350 font-sans">{requestToDelete.companyName}</strong></p>
              <p>Forfait demandé : <strong className="text-indigo-400 font-sans font-extrabold pb-1 uppercase">{requestToDelete.packId}</strong></p>
              <p>Montant simulé : <strong className="text-slate-300">{requestToDelete.price} TND</strong></p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="w-1/2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={confirmDeleteLicenseRequest}
                className="w-1/2 bg-rose-650 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                <Trash2 className="w-4 h-4 text-rose-300" />
                <span>Supprimer du Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Hidden Target Element */}
      <div id="carthage-proforma-document" className="hidden font-sans"></div>

      {/* Invoice and order preview & print modal */}
      <SaaSInvoiceModal 
        isOpen={!!selectedOrderForDoc} 
        onClose={() => setSelectedOrderForDoc(null)} 
        order={selectedOrderForDoc} 
      />

      {/* 🇹🇳 FLOUCI SANDBOX PAYMENT ENVIRONMENT OVERLAY */}
      {(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const showSandboxScreen = urlParams.get('flouci_sandbox') === 'true';
        const sandboxAmount = urlParams.get('amount') || '0';
        const sandboxTrackingId = urlParams.get('tracking_id') || '';
        const sandboxClientId = urlParams.get('client_id') || '';

        if (!showSandboxScreen) return null;

        return (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md font-sans">
            <div className="bg-white text-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              {/* Header */}
              <div className="bg-cyan-600 p-6 text-white text-center space-y-2">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto border border-white/30 shadow-inner">
                  <span className="text-xl font-extrabold text-white tracking-widest uppercase">Flouci</span>
                </div>
                <h2 className="text-lg font-black tracking-wide uppercase">Environnement d'Essai</h2>
                <div className="inline-block bg-cyan-700/80 text-[10px] text-cyan-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest font-mono">
                  Portail de Paiement Sandbox
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4 text-xs font-semibold leading-relaxed">
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-150 space-y-3 font-sans">
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-400">Marchand :</span>
                    <strong className="text-slate-800 uppercase font-sans">Inter-Affaires</strong>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-400">Client :</span>
                    <strong className="text-slate-800 font-sans">{decodeURIComponent(sandboxClientId)}</strong>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-400">ID Tracking :</span>
                    <strong className="text-slate-600 font-mono font-sans">{sandboxTrackingId}</strong>
                  </div>
                  <div className="border-t border-slate-200/60 pt-3 flex justify-between font-sans items-center">
                    <span className="text-slate-900 font-bold uppercase text-[10px]">Montant de la Transaction :</span>
                    <strong className="text-xl font-black font-mono text-cyan-700">{sandboxAmount} TND</strong>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start space-x-2 text-[10px] leading-normal font-semibold">
                  <span className="shrink-0 text-amber-600 text-sm mt-0.5">⚠️</span>
                  <p>
                    Vous utilisez la simulation Flouci car aucune clé API Flouci n'est configurée dans vos variables d'environnement (.env). En production, vous serez redirigé vers l'agrégateur Flouci officiel.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const origin = window.location.origin + window.location.pathname;
                    window.location.href = `${origin}?flouci=success&tracking_id=${sandboxTrackingId}&payment_id=sandbox_${Date.now()}`;
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-3.5 rounded-2xl transition cursor-pointer text-center shadow-lg shadow-cyan-600/10"
                >
                  ✔️ Simuler un Paiement Réussi (Succès)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const origin = window.location.origin + window.location.pathname;
                    window.location.href = `${origin}?flouci=fail&tracking_id=${sandboxTrackingId}`;
                  }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs py-3 rounded-2xl transition cursor-pointer text-center"
                >
                  ❌ Simuler un Échec / Annuler
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 👁️ POPUP MODAL: DETAILS & COMPOSITION DU PACK PAR PÔLE */}
      <AnimatePresence>
        {selectedPackForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
                      {selectedPackForModal.badge}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                      ✓ {selectedPackForModal.modules.length} Modules Inclus
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedPackForModal.name}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{selectedPackForModal.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPackForModal(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - Grouped by Category */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
                {[
                  'PILOTAGE & PERFORMANCE',
                  'ACTIVITÉ COMMERCIALE & CRM',
                  'RESSOURCES HUMAINES & TERRAIN',
                  'LOGISTIQUE, ACHATS & STOCK',
                  'FINANCE & COMPTABILITÉ',
                  'PARC, MATÉRIEL & CONTRÔLE'
                ].map((catTitle) => {
                  const categoryModules = selectedPackForModal.modules
                    .map((mId: string) => ALL_MODULES_METADATA.find(m => m.id === mId) || { id: mId, name: mId, category: 'AUTRES', desc: '', price: 0 })
                    .filter((m: any) => m.category === catTitle);

                  if (categoryModules.length === 0) return null;

                  return (
                    <div key={catTitle} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 font-mono">
                          <span>{catTitle}</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {categoryModules.length} module(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {categoryModules.map((mod: any) => (
                          <div key={mod.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 flex items-start gap-2">
                            <span className="bg-emerald-500 text-white w-4 h-4 flex items-center justify-center rounded-md text-[9px] font-black shrink-0 mt-0.5">
                              ✓
                            </span>
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-slate-800 block leading-tight">
                                {mod.name}
                              </span>
                              {mod.desc && (
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                  {mod.desc}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-600 font-bold">
                  Tarif : <span className="font-black text-indigo-700 font-mono text-base">{selectedPackForModal.price} TND</span> HT / mois
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPackForModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectPack(selectedPackForModal.id);
                      setSelectedPackForModal(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition cursor-pointer shadow-md"
                  >
                    Choisir cette Formule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
