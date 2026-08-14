import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Truck,
  Smartphone,
  Factory,
  Scale,
  FileText,
  Layers,
  Car,
  Calculator,
  Building2,
  Lock,
  ArrowRight,
  Search,
  Sparkles,
  Clock,
  CreditCard,
  Package,
  BarChart3,
  BookOpen,
  FileCode,
  TrendingUp,
  Briefcase,
  Sliders,
  ShieldCheck,
  Compass,
  Grid,
  Globe,
  Building,
  Target,
  ShoppingCart,
  Mail,
  AlertTriangle,
  ShieldAlert,
  Activity,
  FolderKanban,
  FileSearch,
  PieChart,
  BadgePercent
} from 'lucide-react';
import { motion } from 'motion/react';

export interface AppLaunchpadProps {
  setActiveTab: (tabId: string) => void;
  isModuleUnlocked: (moduleKey: string) => boolean;
  activeCompanyName: string;
  activeCompanySettings?: any;
  currentUser?: any;
  clients?: any[];
  invoices?: any[];
  employees?: any[];
  products?: any[];
  onOpenCopilot?: () => void;
  onOpenUserGuide?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

interface ModuleCardDef {
  id: string;
  title: string;
  desc: string;
  category: 'rh' | 'finance' | 'trade' | 'operations' | 'strategy';
  categoryLabel: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  gradient: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}

export const AppLaunchpad: React.FC<AppLaunchpadProps> = ({
  setActiveTab,
  isModuleUnlocked,
  activeCompanyName,
  currentUser,
  clients = [],
  invoices = [],
  employees = [],
  products = [],
  onOpenCopilot,
  onOpenUserGuide,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const modulesList: ModuleCardDef[] = [
    // --- 1. RH & PAIE (4 Modules) ---
    {
      id: 'payroll',
      title: 'Paie & Déclarations CNSS / IRPP',
      desc: 'Calcul automatique des bulletins de paie tunisiens, télé-déclaration CNSS, barème IRPP 2026 et livre de paie.',
      category: 'rh',
      categoryLabel: 'RH & PAIE',
      icon: <Users className="w-7 h-7" />,
      badge: 'Barème 2026',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      gradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'attendance',
      title: 'Pointage Biométrique & Présences',
      desc: 'Suivi des pointages, heures supplémentaires, géofencing chantiers et tableau de bord des retards/absences.',
      category: 'rh',
      categoryLabel: 'RH & PAIE',
      icon: <Clock className="w-7 h-7" />,
      gradient: 'from-emerald-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-emerald-500/20 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'collaborators',
      title: 'Gestion des Collaborateurs',
      desc: 'Dossiers du personnel, contrats de travail (CDI, SIVP), fiches de postes et gestion des congés.',
      category: 'rh',
      categoryLabel: 'RH & PAIE',
      icon: <Briefcase className="w-7 h-7" />,
      gradient: 'from-emerald-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-emerald-500/20 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'mobile_terrain',
      title: 'Flotte Mobile & Pointage IA Gemini',
      desc: 'Application PWA hors-ligne pour pointage par reconnaissance faciale IA, géofencing GPS et Vente Embarquée (Van Sales).',
      category: 'rh',
      categoryLabel: 'TERRAIN & MOBILE',
      icon: <Smartphone className="w-7 h-7" />,
      badge: 'IA VISION',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      gradient: 'from-sky-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-sky-500/30 hover:border-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/30',
      iconColor: 'text-sky-400'
    },

    // --- 2. FINANCE & FISCALITÉ (7 Modules) ---
    {
      id: 'tej',
      title: 'Retenue à la Source TEJ (CIMF)',
      desc: 'Génération instantanée des attestations de retenue à la source avec QRC fiscal conforme au portail national TEJ.',
      category: 'finance',
      categoryLabel: 'FINANCE & FISCALITÉ',
      icon: <FileCode className="w-7 h-7" />,
      badge: 'GRATUIT',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      gradient: 'from-amber-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/40',
      iconColor: 'text-amber-400'
    },
    {
      id: 'accountant_portal',
      title: 'Espace Expert-Comptable & Cabinet',
      desc: 'Console multi-dossiers pour cabinets d\'expertise comptable, télé-transmissions TEJ/CNSS groupées et coffre-fort GED.',
      category: 'finance',
      categoryLabel: 'FINANCE & AUDIT',
      icon: <Scale className="w-7 h-7" />,
      badge: 'OECT',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      gradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/40',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'treasury',
      title: 'Trésorerie & Portefeuille Chèques/Effets',
      desc: 'Gestion des chèques et effets à recevoir/payer, prévisions de liquidité et suivi des comptes bancaires.',
      category: 'finance',
      categoryLabel: 'FINANCE & FISCALITÉ',
      icon: <DollarSign className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      id: 'finance',
      title: 'Comptabilité Générale & Déclarations',
      desc: 'Saisie des journaux, grands livres, balances, déclarations fiscales mensuelles et clôture annuelle.',
      category: 'finance',
      categoryLabel: 'FINANCE & FISCALITÉ',
      icon: <Calculator className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      id: 'billing',
      title: 'Facturation, Devis & Recouvrement',
      desc: 'Gestion des factures de vente, devis, avoirs, e-factures avec QR Code et suivi du recouvrement des créances.',
      category: 'finance',
      categoryLabel: 'FINANCE & VENTES',
      icon: <FileText className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      id: 'caisse',
      title: 'Caisse Intelligente (POS Tactile)',
      desc: 'Logiciel de caisse enregistreuse tactile 100% hors-ligne, impression de tickets et synchronisation du stock.',
      category: 'finance',
      categoryLabel: 'POINTS DE VENTE',
      icon: <CreditCard className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      id: 'asset',
      title: 'Immobilisations & Amortissements',
      desc: 'Registre des actifs, tableaux d\'amortissement linéaire/dégressif et gestion des cessions d\'immobilisations.',
      category: 'finance',
      categoryLabel: 'PATRIMOINE',
      icon: <Building2 className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      id: 'investment',
      title: 'Bourse & Portefeuille d\'Investissements',
      desc: 'Suivi des placements, portefeuilles d\'actions BVMT, obligations, dividendes et plus-values.',
      category: 'finance',
      categoryLabel: 'FINANCE & BOURSE',
      icon: <PieChart className="w-7 h-7" />,
      gradient: 'from-amber-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-amber-500/20 hover:border-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-400'
    },

    // --- 3. COMMERCE, CRM & ACHATS (8 Modules) ---
    {
      id: 'clients',
      title: 'CRM & Fiches Clients',
      desc: 'Gestion des fiches clients, historique des transactions, solvabilité, relances et segmentation commerciale.',
      category: 'trade',
      categoryLabel: 'COMMERCE & CRM',
      icon: <Users className="w-7 h-7" />,
      gradient: 'from-indigo-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/30 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'portail_client',
      title: 'Portail Client Extérieur B2B',
      desc: 'Espace sécurisé permettant à vos clients de consulter leurs factures, passer des commandes et suivre leurs livraisons.',
      category: 'trade',
      categoryLabel: 'PORTAIL EXTÉRIEUR',
      icon: <Globe className="w-7 h-7" />,
      badge: 'B2B PORTAL',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      gradient: 'from-cyan-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/30',
      iconColor: 'text-cyan-400'
    },
    {
      id: 'purchasing',
      title: 'Gestion des Achats & Approvisionnements',
      desc: 'Demandes d\'achats, bons de commande fournisseurs, suivi des livraisons et évaluation des prestataires.',
      category: 'trade',
      categoryLabel: 'ACHATS & SOURCING',
      icon: <ShoppingCart className="w-7 h-7" />,
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'stock',
      title: 'Stocks, Dépôts & Valorisation CUMP',
      desc: 'Multi-dépôts, mouvements de stock, alertes de réapprovisionnement et valorisation automatique CUMP.',
      category: 'trade',
      categoryLabel: 'STOCKS & LOGISTIQUE',
      icon: <Layers className="w-7 h-7" />,
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'transit_logistique',
      title: 'Transit & Fiche de Coût Import',
      desc: 'Dossiers d\'importation (Port de Radès/Sousse), déclarations douanières et calcul précis des frais d\'approche.',
      category: 'trade',
      categoryLabel: 'LOGISTIQUE IMPORT',
      icon: <Truck className="w-7 h-7" />,
      badge: 'RADÈS / SOUSSE',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'lc_manager',
      title: 'Lettre de Crédit & Crédoc (LC)',
      desc: 'Gestion des Crédits Documentaires, suivi des ouvertures LC, échéances et règlements bancaires internationaux.',
      category: 'trade',
      categoryLabel: 'FINANCE COMMERCIALE',
      icon: <Building className="w-7 h-7" />,
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'complaints',
      title: 'Suivi des Réclamations Clients',
      desc: 'Ticketing service client, gestion des litiges, délais de résolution et suivi de la satisfaction client.',
      category: 'trade',
      categoryLabel: 'SERVICE CLIENT',
      icon: <AlertTriangle className="w-7 h-7" />,
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'communication',
      title: 'Hub de Communication & Messagerie',
      desc: 'Centralisation des SMS, emails, notifications internes et campagnes de communication ciblées.',
      category: 'trade',
      categoryLabel: 'COMMUNICATION',
      icon: <Mail className="w-7 h-7" />,
      gradient: 'from-indigo-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-indigo-500/20 hover:border-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },

    // --- 4. OPÉRATIONS, FLOTTE & USINE (4 Modules) ---
    {
      id: 'fleet',
      title: 'Gestion de Parc Auto & Flotte',
      desc: 'Suivi des véhicules, cartes carburant, assurances, visites techniques et ordres de mission.',
      category: 'operations',
      categoryLabel: 'FLOTTE & PARC',
      icon: <Car className="w-7 h-7" />,
      gradient: 'from-purple-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-purple-500/20 hover:border-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      iconColor: 'text-purple-400'
    },
    {
      id: 'production',
      title: 'GPAO & Suivi Usine / Atelier',
      desc: 'Nomenclatures industrielles (BOM), ordres de fabrication (OF) et calcul automatique du TRS machine.',
      category: 'operations',
      categoryLabel: 'USINE & GPAO',
      icon: <Factory className="w-7 h-7" />,
      badge: 'TRS MACHINE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      gradient: 'from-purple-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-purple-500/30 hover:border-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      iconColor: 'text-purple-400'
    },
    {
      id: 'ged',
      title: 'GED & Pièces Justificatives',
      desc: 'Archivage numérique sécurisé, catégorisation par IA, recherche OCR et gestion des documents juridiques/comptables.',
      category: 'operations',
      categoryLabel: 'DOCUMENTS & GED',
      icon: <FolderKanban className="w-7 h-7" />,
      gradient: 'from-purple-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-purple-500/20 hover:border-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      iconColor: 'text-purple-400'
    },
    {
      id: 'reports',
      title: 'Rapports Terrain & Comptes-Rendus',
      desc: 'Comptes-rendus de prospection, cartographie des visites et suivi synthétique de l\'activité sur le terrain.',
      category: 'operations',
      categoryLabel: 'RAPPORTS TERRAIN',
      icon: <Compass className="w-7 h-7" />,
      gradient: 'from-purple-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-purple-500/20 hover:border-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      iconColor: 'text-purple-400'
    },

    // --- 5. STRATÉGIE, GOUVERNANCE & DÉCISION (9 Modules) ---
    {
      id: 'executive_dashboard',
      title: 'Tableau de Bord Décisionnel & KPIs',
      desc: 'Vue d\'ensemble executive, graphiques financiers en temps réel, évolution du CA et de la marge brute.',
      category: 'strategy',
      categoryLabel: 'EXECUTIVE DRESSING',
      icon: <Activity className="w-7 h-7" />,
      badge: 'DÉCISIONNEL',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      gradient: 'from-rose-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/20 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'steering',
      title: 'Objectifs & Pilotage Stratégique',
      desc: 'Tableaux de bord analytiques, KPIs de rentabilité, suivi des objectifs commerciaux et alertes de gestion.',
      category: 'strategy',
      categoryLabel: 'STRATÉGIE & AUDIT',
      icon: <TrendingUp className="w-7 h-7" />,
      gradient: 'from-rose-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/20 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'business_plan',
      title: 'Business Plan Stratégique 3-5 Ans',
      desc: 'Simulations financières, compte de résultat prévisionnel, plan de financement et calcul du BFR.',
      category: 'strategy',
      categoryLabel: 'PLANIFICATION',
      icon: <BarChart3 className="w-7 h-7" />,
      gradient: 'from-rose-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/20 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'market',
      title: 'Études de Marché & Opportunités',
      desc: 'Veille concurrentielle, analyse du marché tunisien & africain, ciblage géographique et opportunités B2B.',
      category: 'strategy',
      categoryLabel: 'INTELLIGENCE D\'AFFAIRES',
      icon: <Target className="w-7 h-7" />,
      gradient: 'from-rose-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/20 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'cession',
      title: 'Cession d\'Entreprise & Data Room',
      desc: 'Valorisation d\'entreprise, due diligence, audit repreneur et Data Room confidentielle sécurisée.',
      category: 'strategy',
      categoryLabel: 'STRATÉGIE & M&A',
      icon: <Scale className="w-7 h-7" />,
      badge: 'DUE DILIGENCE',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      gradient: 'from-rose-950/40 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/30 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'juridique',
      title: 'Secrétariat Juridique & Actes',
      desc: 'Gestion des assemblées générales (AGO/AGE), procès-verbaux, statuts de la société et suivi du registre RNE.',
      category: 'strategy',
      categoryLabel: 'GOUVERNANCE & RNE',
      icon: <FileSearch className="w-7 h-7" />,
      gradient: 'from-rose-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-rose-500/20 hover:border-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      id: 'company_settings',
      title: 'Paramètres & Configuration Entreprise',
      desc: 'En-tête des factures, logo, devises, utilisateurs, droits d\'accès et sauvegardes.',
      category: 'strategy',
      categoryLabel: 'CONFIGURATION',
      icon: <Sliders className="w-7 h-7" />,
      badge: 'GRATUIT',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      gradient: 'from-slate-900 via-slate-900 to-slate-900',
      borderColor: 'border-slate-800 hover:border-slate-600',
      iconBg: 'bg-slate-800 border-slate-700',
      iconColor: 'text-slate-300'
    },
    {
      id: 'saas_config',
      title: 'Espace Client, Licences & Packs',
      desc: 'Souscription aux packs Elyssa ERP, activation des modules à la carte, factures d\'abonnement et support.',
      category: 'strategy',
      categoryLabel: 'LICENCES & SUBSCRIPTION',
      icon: <BadgePercent className="w-7 h-7" />,
      gradient: 'from-slate-900 via-slate-900 to-slate-900',
      borderColor: 'border-slate-800 hover:border-slate-600',
      iconBg: 'bg-slate-800 border-slate-700',
      iconColor: 'text-slate-300'
    },
    {
      id: 'admin',
      title: 'Console d\'Administration & SecOps',
      desc: 'Gestion centralisée du système, journaux d\'audit, rôles de sécurité et administration de la plateforme.',
      category: 'strategy',
      categoryLabel: 'ADMINISTRATION',
      icon: <ShieldAlert className="w-7 h-7" />,
      badge: 'ADMIN ONLY',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      gradient: 'from-red-950/30 via-slate-900 to-slate-900',
      borderColor: 'border-red-500/30 hover:border-red-400',
      iconBg: 'bg-red-500/10 border-red-500/30',
      iconColor: 'text-red-400'
    }
  ];

  // Filter modules based on search and category
  const filteredModules = modulesList.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.amount || inv.total || 0), 0);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                <Grid className="w-3.5 h-3.5" />
                <span>LAUNCHPAD ELYSSA ERP • TOUS LES MODULES MÉTIER</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
                <span>Console Métier & App Grid</span>
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                  {activeCompanyName}
                </span>
              </h1>

              <p className="text-xs md:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
                Retrouvez l'intégralité des <strong>{modulesList.length} modules</strong> de la suite Elyssa ERP. Cliquez sur une carte pour lancer l'application.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Afficher/Masquer le menu latéral"
                >
                  <Grid className="w-4 h-4 text-indigo-400" />
                  <span>{isSidebarCollapsed ? 'Afficher Menu' : 'Masquer Menu'}</span>
                </button>
              )}

              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Elyssa Copilot IA</span>
                </button>
              )}

              {onOpenUserGuide && (
                <button
                  onClick={onOpenUserGuide}
                  className="px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Guide Utilisateur</span>
                </button>
              )}

            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Portefeuille Clients</span>
                <span className="text-lg font-black text-white">{clients.length} <span className="text-xs text-slate-500 font-normal">comptes</span></span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Facturation / Ventes</span>
                <span className="text-lg font-black text-amber-400">{totalRevenue > 0 ? `${totalRevenue.toLocaleString()} TND` : `${invoices.length} factures`}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Effectif Collaborateurs</span>
                <span className="text-lg font-black text-emerald-400">{employees.length} <span className="text-xs text-slate-500 font-normal">salariés</span></span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Articles en Stock</span>
                <span className="text-lg font-black text-sky-400">{products.length} <span className="text-xs text-slate-500 font-normal">références</span></span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Package className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher parmi les 32 modules (ex: Paie, TEJ, Facturation, Stock, Pointage IA, GPAO...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
              {[
                { id: 'all', label: `Tous (${modulesList.length})` },
                { id: 'rh', label: 'RH & Paie' },
                { id: 'finance', label: 'Finance & TEJ' },
                { id: 'trade', label: 'Commerce & CRM' },
                { id: 'operations', label: 'Flotte & Usine' },
                { id: 'strategy', label: 'Stratégie & Audit' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Grid of Module Cards */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
            {filteredModules.length} {filteredModules.length === 1 ? 'MODULE DISPONIBLE' : 'MODULES DISPONIBLES SUR LES 32 TOTALS'}
          </span>
          <span className="text-[11px] text-slate-500">Cliquez sur une carte pour ouvrir l'espace de travail</span>
        </div>

        {filteredModules.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Aucun module ne correspond à votre recherche "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map((m) => {
              const unlocked = isModuleUnlocked(m.id);

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.025, translateY: -4 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setActiveTab(m.id)}
                  className={`bg-gradient-to-b ${m.gradient} border ${m.borderColor} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-200 group`}
                >
                  
                  {/* Card Header & Badge */}
                  <div>
                    
                    <div className="flex items-start justify-between gap-3 mb-4">
                      
                      {/* Icon Container */}
                      <div className={`p-3 rounded-2xl border ${m.iconBg} ${m.iconColor} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                        {m.icon}
                      </div>

                      {/* Right Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">
                          {m.categoryLabel}
                        </span>

                        {m.badge && (
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        )}

                        {!unlocked && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Pack supérieur
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Module Title */}
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors mb-2 flex items-center gap-2">
                      <span>{m.title}</span>
                    </h3>

                    {/* Module Description */}
                    <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">
                      {m.desc}
                    </p>

                  </div>

                  {/* Card Footer Action */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      unlocked ? 'text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1' : 'text-slate-500'
                    }`}>
                      <span>{unlocked ? 'Lancer le module' : 'Débloquer le module'}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>

                    <span className="text-[10px] font-mono text-slate-600 font-bold group-hover:text-slate-400">
                      #{m.id}
                    </span>

                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Elyssa ERP Suite • Conformité Fiscale Tunisienne CIMF & Législation RH CNSS 2026</span>
        </div>
        <button
          onClick={() => setActiveTab('saas_config')}
          className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
        >
          Gestion des Licences & Espace Client →
        </button>
      </div>

    </div>
  );
};
