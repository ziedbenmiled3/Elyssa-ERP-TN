import React, { useState } from 'react';
import { AdminSettings } from '../types';
import { 
  ArrowRight, 
  Check, 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Settings, 
  Package, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Coins, 
  Clock, 
  BarChart3, 
  Calculator, 
  ChevronRight,
  BookOpen,
  ShoppingCart,
  Play,
  CheckCircle2,
  Building,
  Car,
  LayoutGrid,
  ListFilter,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Server,
  Sparkle,
  Gauge,
  Compass,
  FileCode,
  DollarSign,
  HelpCircle,
  TrendingDown,
  Percent,
  RefreshCw,
  Eye,
  Lock,
  MessageSquare,
  Smartphone,
  MapPin,
  UserCheck,
  Radio,
  Wifi,
  WifiOff,
  Cog,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ElyssaLogo } from './ElyssaLogo';

const MODULE_NAMES: Record<string, string> = {
  executive_dashboard: "Tableau de Bord Décisionnel",
  copilot: "Assistant IA & Copilot",
  steering: "Objectifs & Pilotage",
  business_plan: "Business Plan Stratégique",
  market: "Études & Opportunités",
  dashboard: "Console Launchpad Grid",
  caisse: "Caisse Intelligente (POS)",
  billing: "Facturation & Recouvrement",
  clients: "Fiches Clients",
  portail_client: "Portail Client Extérieur",
  reports: "Rapports Terrain & Hebdo",
  communication: "Hub de Communication",
  complaints: "Suivi Réclamations",
  payroll: "Gestion Paie & RH",
  collaborators: "Gestion des Collaborateurs",
  attendance: "Pointage & Temps de Travail",
  mobile_terrain: "Flotte Mobile & Suivi Terrain",
  mobile_fleet: "Passerelle Flotte Mobile",
  stock: "Stocks & Fournisseurs",
  purchasing: "Achats & Approvisionnements",
  warehouse_picking: "Gestion des Préparations & Dépôts",
  dispatch_tours: "Expéditions & Tournées",
  production: "Production & GPAO (TRS)",
  transit_logistique: "Import/Export & Logistique",
  lc_manager: "Lettre de Crédit (Crédoc)",
  finance: "Comptabilité & Trésorerie",
  tej: "Intégration TEJ (CIMF)",
  treasury: "Trésorerie & Portefeuille d'Effets",
  asset: "Immobilisations & Amortissements",
  investment: "Bourse & Investissements",
  fleet_management: "Gestion du Parc & Actifs",
  fleet: "Gestion Parc Auto",
  ged: "ED-GED & Pièces Justificatives",
  cession: "Cession d'Entreprise & Audit",
  juridique: "Secrétariat Juridique",
  company_settings: "Paramètres de l'Entreprise"
};

const DEFAULT_FALLBACK_PACKS = [
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
  }
];

interface LandingPageProps {
  onNavigateToLogin: () => void;
  customPacks?: any[];
  onTrialSignup?: (newTrialInfo: any) => void;
  trialDurationDays?: number;
  adminSettings?: AdminSettings;
}

export default function LandingPage({ 
  onNavigateToLogin, 
  customPacks = [], 
  onTrialSignup,
  trialDurationDays = 7,
  adminSettings
}: LandingPageProps) {
  // Legal Modal State (CGV, Mentions Légales, Confidentialité)
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'cgv' | 'privacy' | 'mentions'>('cgv');

  // Packs Navigation and Billing Period States for Pricing Section
  const [landingPackTab, setLandingPackTab] = useState<'all' | 'commerce' | 'logistics' | 'industry'>('all');
  const [landingInterval, setLandingInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [expandedPackIds, setExpandedPackIds] = useState<Record<string, boolean>>({});
  const [selectedPackForModal, setSelectedPackForModal] = useState<any | null>(null);

  const togglePackExpand = (packId: string) => {
    setExpandedPackIds(prev => ({
      ...prev,
      [packId]: !prev[packId]
    }));
  };

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Floating Copilot Widget States
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Bonjour ! Je suis Copilot IA, l'assistant virtuel d'Elyssa ERP. Comment puis-je vous aider aujourd'hui à découvrir nos 36 modules, nos offres métiers ou nos tarifs ?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>('');

  const handleSendCopilotMessage = (textToSend?: string) => {
    const text = (textToSend || copilotInput).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    if (!textToSend) setCopilotInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let replyText = "Elyssa ERP regroupe 36 modules de gestion intégrés (Ventes, Achats, Stocks, Paie, TEJ CIMF, GPAO, Flotte mobile...). N'hésitez pas à démarrer votre essai gratuit de 7 jours ou à contacter nos conseillers !";

      if (lower.includes('tarif') || lower.includes('prix') || lower.includes('pack') || lower.includes('formule') || lower.includes('cout')) {
        replyText = "Nos forfaits démarrent à 49 TND HT/mois pour Solo/TPE et s'étendent jusqu'à 249 TND HT/mois pour l'Industrie & Supply-Chain 360°, avec -10% en trimestriel et -20% en annuel. Un essai gratuit de 7 jours est offert sans engagement !";
      } else if (lower.includes('tej') || lower.includes('cimf') || lower.includes('declaration') || lower.includes('xml')) {
        replyText = "Notre module TEJ est 100% conforme aux normes CIMF avec télé-transmission des déclarations fiscales et génération automatisée des fichiers XML certifiés XSD.";
      } else if (lower.includes('mobile') || lower.includes('offline') || lower.includes('hors-ligne') || lower.includes('terrain') || lower.includes('pocket')) {
        replyText = "L'application Elyssa Pocket est 100% Offline-First. Vos livreurs et commerciaux travaillent sans coupure même en zone sans réseau, et la synchronisation s'exécute automatiquement dès le retour d'Internet.";
      } else if (lower.includes('securite') || lower.includes('donnee') || lower.includes('inpdp') || lower.includes('cloud')) {
        replyText = "Vos données d'entreprise sont sécurisées en Cloud redondé avec chiffrement SSL 256 bits, dans le respect strict des exigences de l'INPDP et de la Loi de Finances 2026.";
      } else if (lower.includes('import') || lower.includes('article') || lower.includes('client') || lower.includes('donnee de depart')) {
        replyText = "Vous disposez d'un configurateur autonome pour charger vos fichiers de base en quelques clics dès l'activation de votre espace d'essai !";
      } else if (lower.includes('role') || lower.includes('collaborateur') || lower.includes('pin') || lower.includes('accès')) {
        replyText = "Elyssa ERP gère la restriction granulaire des accès par département (RBAC) et l'authentification rapide par Code PIN sécurisé à 6 chiffres pour vos équipes.";
      }

      const botReply = {
        id: (Date.now() + 1).toString(),
        sender: 'bot' as const,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages(prev => [...prev, botReply]);
    }, 400);
  };

  // Dynamic Company Profile resolution from Admin settings or local storage
  const effectiveSettings = adminSettings || (() => {
    try {
      const saved = localStorage.getItem('carthage_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {} as any;
  })();

  const companyName = effectiveSettings.companyName || 'Elyssa Technology';
  const legalForm = effectiveSettings.legalForm || 'Société à Responsabilité Limitée (SARL)';
  const companyAddress = effectiveSettings.companyAddress 
    ? `${effectiveSettings.companyAddress}${effectiveSettings.cityZipCode ? ', ' + effectiveSettings.cityZipCode : ''}` 
    : 'Les Berges du Lac 2, Tunis, Tunisie';
  const companyMF = effectiveSettings.companyMF || '1458932/A/M/000';
  const rneNumber = effectiveSettings.rneNumber || '1458932RNE';
  const companyEmail = effectiveSettings.companyEmail || 'contact@elyssa.pro';
  const companyPhone = effectiveSettings.companyPhone || '+216 71 862 100';
  const legalRepresentative = effectiveSettings.legalRepresentative || 'Gérance Elyssa Technology';
  const shareCapital = effectiveSettings.shareCapital 
    ? `${Number(effectiveSettings.shareCapital).toLocaleString('fr-TN')} TND` 
    : '100 000 TND';
  const website = effectiveSettings.website || 'https://elyssa.pro';

  // ROI Simulator States
  const [employeesCount, setEmployeesCount] = useState<number>(12);
  const [invoicesCount, setInvoicesCount] = useState<number>(85);
  const [adminHoursLost, setAdminHoursLost] = useState<number>(15);

  // Free Trial Modal State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({
    lastName: '',
    firstName: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    pin: ''
  });
  const [trialError, setTrialError] = useState('');
  const [trialSuccess, setTrialSuccess] = useState(false);

  // Booking Demo Modal State
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    preferredDate: '',
    timeSlot: 'Morning'
  });
  const [demoSuccess, setDemoSuccess] = useState(false);

  // Dynamic Interactive Widgets State
  // 1. TEJ XML generator state
  const [xmlGenerationStatus, setXmlGenerationStatus] = useState<'idle' | 'scanning' | 'generating' | 'ready'>('idle');
  const [generatedXmlText, setGeneratedXmlText] = useState('');
  
  // 2. Tunisian Salary Cotisations calculator state
  const [grossSalary, setGrossSalary] = useState<number>(2000);
  
  // 3. Landed Cost Calculator state
  const [cargoValueTnd, setCargoValueTnd] = useState<number>(50000);
  const [fretCostTnd, setFretCostTnd] = useState<number>(4500);
  const [douaneRate, setDouaneRate] = useState<number>(20); // %

  // 4. Production TRS state
  const [trsActive, setTrsActive] = useState<boolean>(true);
  const [trsValue, setTrsValue] = useState<number>(82.4);

  // 5. Mobile & Field Operations simulator state
  const [mobileSimMode, setMobileSimMode] = useState<'clockin' | 'vansales'>('clockin');
  const [mobileClockinStep, setMobileClockinStep] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const [mobileSalesStep, setMobileSalesStep] = useState<'idle' | 'signed' | 'synced'>('idle');

  // Search query for modules catalog
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'finance' | 'logistic' | 'production' | 'hr'>('all');

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrialError('');

    if (
      !trialForm.lastName.trim() ||
      !trialForm.firstName.trim() ||
      !trialForm.companyName.trim() ||
      !trialForm.email.trim() ||
      !trialForm.phone.trim() ||
      !trialForm.address.trim() ||
      !trialForm.password.trim() ||
      !trialForm.pin.trim()
    ) {
      setTrialError('Tous les champs sont obligatoires.');
      return;
    }

    setTrialSuccess(true);
    setTimeout(() => {
      if (onTrialSignup) {
        onTrialSignup(trialForm);
      }
      setShowTrialModal(false);
      setTrialSuccess(false);
      setTrialForm({
        lastName: '',
        firstName: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        pin: ''
      });
    }, 1500);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSuccess(true);
    setTimeout(() => {
      setShowDemoModal(false);
      setDemoSuccess(false);
      setDemoForm({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        preferredDate: '',
        timeSlot: 'Morning'
      });
    }, 1800);
  };

  // Run mock XML generation
  const runXmlGeneration = () => {
    setXmlGenerationStatus('scanning');
    setGeneratedXmlText('');
    
    setTimeout(() => {
      setXmlGenerationStatus('generating');
      setTimeout(() => {
        setXmlGenerationStatus('ready');
        setGeneratedXmlText(`<?xml version="1.0" encoding="UTF-8"?>
<LotTej xmlns="http://www.cimf.finances.gov.tn/tej/v1">
  <Header>
    <EmetteurIdentifiant>MF-9382109XAM000</EmetteurIdentifiant>
    <DateGeneration>2026-07-01</DateGeneration>
    <TypeLot>RetenueSource</TypeLot>
    <ReglementTrimestre>T2-2026</ReglementTrimestre>
  </Header>
  <DeclarationsCount>42</DeclarationsCount>
  <TotalMontantRetenu>3820.450</TotalMontantRetenu>
  <Signature HashAlgo="SHA-256">
    <Value>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</Value>
  </Signature>
</LotTej>`);
      }, 1000);
    }, 800);
  };

  // Salary calculations based on approximate Tunisian tax rules
  const calculateNetSalary = () => {
    // Basic approximate Tunisian formula for illustration
    const cnssSalariale = grossSalary * 0.0918;
    const taxableBase = grossSalary - cnssSalariale;
    // Simple progressive annual IRPP slab simulation scaled to monthly
    let monthlyIrpp = 0;
    const annualTaxable = taxableBase * 12;
    if (annualTaxable > 50000) {
      monthlyIrpp = (annualTaxable * 0.35) / 12;
    } else if (annualTaxable > 30000) {
      monthlyIrpp = (annualTaxable * 0.30) / 12;
    } else if (annualTaxable > 20000) {
      monthlyIrpp = (annualTaxable * 0.26) / 12;
    } else if (annualTaxable > 5000) {
      monthlyIrpp = (annualTaxable * 0.15) / 12;
    }
    const cssTax = monthlyIrpp * 0.01; // Contribution Sociale de Solidarité
    const cnssPatronale = grossSalary * 0.1657; // 16.57% CNSS
    
    const netSalary = Math.max(0, grossSalary - cnssSalariale - monthlyIrpp - cssTax);
    
    return {
      cnssSalariale: cnssSalariale.toFixed(3),
      cnssPatronale: cnssPatronale.toFixed(3),
      irpp: monthlyIrpp.toFixed(3),
      css: cssTax.toFixed(3),
      net: netSalary.toFixed(3)
    };
  };

  const salaryDetails = calculateNetSalary();

  // Landed Cost calculations based on mock rates
  const calculateLandedCosts = () => {
    const transportTotal = fretCostTnd;
    const customsTaxes = cargoValueTnd * (douaneRate / 100);
    const transportAssurance = cargoValueTnd * 0.015;
    const transitFee = 1200; // Fixed mock agent fee
    const landedTotal = cargoValueTnd + transportTotal + customsTaxes + transportAssurance + transitFee;
    const unitSurchargeRatio = landedTotal / cargoValueTnd;

    return {
      customs: customsTaxes.toFixed(3),
      insurance: transportAssurance.toFixed(3),
      agent: transitFee.toFixed(3),
      total: landedTotal.toFixed(3),
      multiplier: unitSurchargeRatio.toFixed(2)
    };
  };

  const importDetails = calculateLandedCosts();

  // ROI Simulator math
  const monthlySavings = (adminHoursLost * 45) + (invoicesCount * 3.5) + (employeesCount * 18);
  const annualSavings = monthlySavings * 12;

  // Catalog filtering
  const allModulesList = [
    { id: 'steering', name: 'Objectifs & Pilotage', desc: 'Définition des KPIs, prévisions de trésorerie trimestrielles et tableaux de bord analytiques pour le directoire.', cat: 'finance' },
    { id: 'billing', name: 'Facturation & Timbre Fiscal', desc: 'Émission immédiate de factures en dinars (TND) avec calcul automatique de la TVA et du timbre fiscal de 1.000 TND.', cat: 'finance' },
    { id: 'finance', name: 'Comptabilité & Rapprochement', desc: 'Multi-comptes bancaires tunisiens (BIAT, Attijari, UIB), conciliation automatique et déclarations de TVA en temps réel.', cat: 'finance' },
    { id: 'tej', name: 'Télétransmission TEJ (CIMF)', desc: 'Génération de fichiers XML réglementaires pour la télédéclaration de l\'impôt et des retenues à la source à la CIMF.', cat: 'finance' },
    { id: 'payroll', name: 'Moteur de Paie & RH', desc: 'Gestion des fiches de paie tunisiennes, calcul IRPP barème 2026, charges sociales CNSS et déclaration trimestrielle.', cat: 'hr' },
    { id: 'ged', name: 'GED & Archivage Légal', desc: 'Stockage crypté de vos pièces comptables, factures scannées et contrats signés électroniquement.', cat: 'hr' },
    { id: 'transit_logistique', name: 'Suivi de Transit & Douane', desc: 'Suivi des arrivages maritimes au port de Radès, suivi des conteneurs et calcul des taxes douanières.', cat: 'logistic' },
    { id: 'lc_manager', name: 'Gestion des Crédocs (LC)', desc: 'Émission et suivi des Lettres de Crédit import-export avec banques émettrices et notification d\'échéance de documents.', cat: 'logistic' },
    { id: 'production', name: 'GPAO & Suivi Usine', desc: 'Gestion des nomenclatures industrielles (BOM), ordres de fabrication (OF) et calcul automatique du TRS machine.', cat: 'production' },
    { id: 'caisse', name: 'Caisse Intelligente (POS)', desc: 'Logiciel de caisse tactile hors-ligne, ticket de caisse et synchronisation du stock de vos points de vente.', cat: 'logistic' },
    { id: 'stock', name: 'Stocks & Approvisionnements', desc: 'Fiches produits, niveaux d\'alerte, bons d\'entrée/sortie et valorisation de l\'inventaire selon la méthode CUMP.', cat: 'logistic' },
    { id: 'fleet', name: 'Gestion de Parc Auto', desc: 'Suivi des consommations de carburant, vignettes, visites techniques et contrats d\'assurance de vos véhicules.', cat: 'logistic' },
    { id: 'mobile_terrain', name: 'Flotte Mobile & Pointage IA', desc: 'Application PWA mobile hors-ligne pour pointage biométrique IA Gemini Vision, géofencing GPS chantiers et vente embarquée (Van Sales).', cat: 'hr' }
  ];

  const filteredModules = allModulesList.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || m.desc.toLowerCase().includes(moduleSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.cat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans relative antialiased leading-relaxed" id="elyssa-pro-v12">
      
      {/* Decorative Grid Mesh & Ambient Glow Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1328_1px,transparent_1px),linear-gradient(to_bottom,#0c1328_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0"></div>
      
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full filter blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-[25%] right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full filter blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] left-1/3 w-[700px] h-[700px] bg-emerald-950/5 rounded-full filter blur-[180px] pointer-events-none z-0"></div>

      {/* HEADER NAVBAR */}
      <header className="relative z-50 border-b border-slate-900/70 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <ElyssaLogo className="w-10 h-10 rounded-xl" />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black tracking-tight text-white font-sans uppercase">Elyssa ERP</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">V1.2</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">La Suite Cloud Tunisienne</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-400">
            <a href="#v12-features" className="text-amber-400 hover:text-amber-300 transition duration-200 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span>Lancement V1.2</span>
            </a>
            <a href="#features-zigzag" className="hover:text-white transition duration-200">Modules</a>
            <a href="#comparison" className="hover:text-white transition duration-200">Le Ring</a>
            <a href="#roi-pricing" className="hover:text-white transition duration-200">Simulateur & Tarifs</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              type="button" 
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 hover:bg-slate-900 rounded-lg transition cursor-pointer"
            >
              Se Connecter
            </button>
            <button 
              type="button"
              onClick={() => setShowTrialModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider p-2.5 px-5 rounded-xl cursor-pointer transition shadow-lg shadow-amber-500/10 border-0"
            >
              Essai Gratuit
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: THE HERO (Au-dessus de la ligne de flottaison) */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden text-center" id="hero-section">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          
          {/* Surtitre Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 px-4 rounded-full text-slate-300 text-[11px] font-bold font-mono tracking-wide"
          >
            <span>🇹🇳</span>
            <span>Le premier ERP Cloud pensé exclusivement pour les PME et PMI tunisiennes.</span>
          </motion.div>

          {/* Titre Principal H1 */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-sans"
          >
            Gérez votre entreprise, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-indigo-400 bg-clip-text text-transparent">
              pas votre paperasse.
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-300 block mt-2">
              La conformité fiscale tunisienne en un seul clic.
            </span>
          </motion.h1>

          {/* Sous-titre H2 */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold"
          >
            Facturation, Paie, Import/Export et intégration TEJ (CIMF) centralisés sur une seule plateforme Cloud. Zéro serveur à installer. Zéro frais d'intégration cachés.
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => setShowTrialModal(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest p-4 px-8 rounded-xl shadow-xl shadow-amber-500/10 cursor-pointer transition flex items-center justify-center gap-2 border-0"
            >
              <span>Démarrez votre essai gratuit</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs uppercase tracking-widest p-4 px-8 rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
            >
              <span>Réserver une Démo</span>
              <Play className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </motion.div>

          {/* Réassurance element */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="pt-6 text-slate-500 text-[11px] font-bold font-mono tracking-wider flex flex-wrap items-center justify-center gap-3 sm:gap-6"
          >
            <span className="flex items-center gap-1.5 text-amber-500/90">
              <Check className="w-3.5 h-3.5" /> Conforme Lois de Finances 2026
            </span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" /> Hébergement Cloud Sécurisé
            </span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Prêt en 5 minutes
            </span>
          </motion.div>

        </div>
      </section>

      {/* SECTION 2: LE PROBLÈME (Agitation) */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900 bg-slate-950/40" id="problem-section">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-red-500 font-mono">
              Le quotidien des entreprises tunisiennes
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Vous passez plus de temps à calculer qu'à piloter ?
            </h2>
            <div className="w-12 h-1 bg-red-600 mx-auto rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: La double saisie */}
            <div className="bg-slate-900/50 border border-slate-800 hover:border-red-500/25 p-8 rounded-2xl space-y-5 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-red-400 group-hover:bg-red-950/50 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">La double saisie vous épuise</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Entre votre outil de facturation basique et le portail TEJ de la CIMF, vous perdez des heures à ressaisir manuellement vos retenues à la source. Une erreur de frappe et c'est le blocage fiscal assuré.
              </p>
            </div>

            {/* Card 2: La paie est un casse-tête */}
            <div className="bg-slate-900/50 border border-slate-800 hover:border-red-500/25 p-8 rounded-2xl space-y-5 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-red-400 group-hover:bg-red-950/50 transition">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">La paie est un casse-tête mensuel</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Calculer les barèmes progressifs de l'IRPP, les cotisations CNSS complexes (salarié/patronal), et la CSS sur des fichiers Excel obscurs vous expose à des redressements sociaux et fiscaux douloureux.
              </p>
            </div>

            {/* Card 3: Les ERP traditionnels */}
            <div className="bg-slate-900/50 border border-slate-800 hover:border-red-500/25 p-8 rounded-2xl space-y-5 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-red-400 group-hover:bg-red-950/50 transition">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Les ERP traditionnels vous ruinent</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Payer des dizaines de milliers de dinars de matériel, des serveurs physiques bruyants, et des mois d'intégration facturés au prix fort par des intégrateurs lents n'a plus aucun sens technique ou économique en 2026.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: LA SOLUTION & INTERACTIVE ERP PREVIEW */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900" id="v12-features">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
              Un ERP de Classe Mondiale à votre portée
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Voici Elyssa ERP : La puissance d'un grand ERP, l'agilité du Cloud.
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
              Oubliez les installations complexes et obsolètes. Elyssa ERP rassemble tous vos départements opérationnels (Finance, RH, Ventes, Logistique internationale, Production) sur une interface unique, moderne et 100% alignée sur la législation tunisienne.
            </p>
          </div>

          {/* Interactive Mock Dashboard Panel ("Radar de Performance Holistique") */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Header of Mock Window */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-850">
                  https://app.elyssa.pro/dashboard
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Radar de Performance Holistique (V1.2 Active)
              </span>
            </div>

            {/* Content of Mock Window */}
            <div className="p-6 md:p-8 space-y-8 bg-slate-950">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-black font-sans">Chiffre d'Affaires</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">142 850,320 <span className="text-[10px] text-slate-400">TND</span></p>
                  <span className="text-[9px] text-emerald-400 font-bold block">+18.4% ce trimestre</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-black font-sans">Retenues Source (TEJ)</span>
                    <FileCode className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">3 820,450 <span className="text-[10px] text-slate-400">TND</span></p>
                  <span className="text-[9px] text-amber-400 font-bold block">42 transactions prêtes XML</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-black font-sans">Lettres de Crédit</span>
                    <Compass className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">4 Actives <span className="text-[10px] text-slate-400">Port Radès</span></p>
                  <span className="text-[9px] text-indigo-400 font-bold block">En attente de déchargement</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-black font-sans">TRS Industriel Moyen</span>
                    <Gauge className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">84.2% <span className="text-[10px] text-slate-400">Uptime</span></p>
                  <span className="text-[9px] text-purple-400 font-bold block">Consommation optimale de BOM</span>
                </div>

              </div>

              {/* Main Simulated Panel View split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent invoices list */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-350 tracking-wide flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Suivi Factures Récentes (Avec TVA Tunisienne)</span>
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500">Mise à jour en direct</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                          <th className="py-2">Client</th>
                          <th className="py-2">Montant Brut</th>
                          <th className="py-2">Retenue (1.5%)</th>
                          <th className="py-2">Statut Fiscale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60">
                        <tr>
                          <td className="py-2.5 font-bold text-white">STE ALIMENTAIRE DU CAP BON</td>
                          <td className="py-2.5 font-mono">15 450,000 TND</td>
                          <td className="py-2.5 font-mono text-amber-400">231,750 TND</td>
                          <td className="py-2.5"><span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black border border-emerald-900">CONFORME</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">SFAX DISTRIBUTION GROS</td>
                          <td className="py-2.5 font-mono">8 920,000 TND</td>
                          <td className="py-2.5 font-mono text-amber-400">133,800 TND</td>
                          <td className="py-2.5"><span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black border border-emerald-900">CONFORME</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">COMPAGNIE INDUSTRIELLE SAHEL</td>
                          <td className="py-2.5 font-mono">24 100,000 TND</td>
                          <td className="py-2.5 font-mono text-amber-400">361,500 TND</td>
                          <td className="py-2.5"><span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded text-[9px] font-black border border-indigo-900">GÉNÉRÉ TEJ</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Activity Logs representing genuine logs */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4 font-mono text-[10px] text-slate-400 leading-normal">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-300 font-sans font-black uppercase text-xs flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      Système Télédéclaration
                    </span>
                    <span className="text-emerald-400 font-bold">● LIVE</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-slate-500">Jul 01 10:14:22 [system] scan des ventes avec retenue à la source...</p>
                    <p className="text-indigo-300">✔ 42 retenues trouvées pour trimestre T2-2026</p>
                    <p className="text-slate-500">Jul 01 10:14:23 [tej] signature avec certificat Tunisie-Trade...</p>
                    <p className="text-amber-400">✔ Lot TEJ signé avec clé publique SHA-256</p>
                    <p className="text-emerald-400">✔ Fichier XML de télédéclaration généré avec succès !</p>
                  </div>

                  <div className="pt-2 border-t border-slate-850/60 text-center">
                    <button
                      onClick={runXmlGeneration}
                      className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-4 py-2 rounded-lg transition text-[10px] uppercase font-sans cursor-pointer shadow-md"
                    >
                      Relancer l'audit de conformité
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: LES FONCTIONNALITÉS CLÉS (Zig-zag with Interactive Widgets) */}
      <section className="relative z-10 py-16 md:py-24 bg-slate-950/20 border-t border-slate-900" id="features-zigzag">
        <div className="max-w-7xl mx-auto px-6 space-y-24 md:space-y-32">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
              Infrastructures de pointe intégrées
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Une réponse sur-mesure aux réalités tunisiennes.
            </h2>
            <div className="w-12 h-1 bg-amber-500 mx-auto rounded"></div>
          </div>

          {/* Bloc 1: Conformité TEJ / CIMF Native */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                01. AUTOMATISATION FISCALE CIMF
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Ne redoutez plus la fin du mois.
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                Elyssa scanne vos transactions, calcule vos retenues à la source et génère automatiquement les lots au format XML (TEJ) prêts à être télétransmis à la CIMF. Signature électronique et certificats officiels inclus. En un clic, vous êtes en règle.
              </p>
              <ul className="space-y-2.5 font-semibold text-xs text-slate-350">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Calcul automatisé du barème de retenues (1.5%, 15%, etc.)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Génération du XML TEJ validé par le schéma XSD national</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Intégration de signature électronique sécurisée</span>
                </li>
              </ul>
            </div>

            {/* Interactive widget 1: TEJ XML Generator */}
            <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black uppercase text-amber-450 tracking-wider font-mono">
                    Simulateur de génération XML TEJ
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-[9px] text-slate-400 px-2 py-0.5 rounded font-mono">CIMF Schema v1.2</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl min-h-[160px] flex flex-col justify-between font-mono text-[10px] text-slate-450 border border-slate-850">
                  {xmlGenerationStatus === 'idle' && (
                    <div className="my-auto text-center space-y-3">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-slate-400 font-sans font-bold">Prêt à scanner vos factures d'achat et vente de la période.</p>
                      <button
                        onClick={runXmlGeneration}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg transition font-sans text-[10px] uppercase cursor-pointer"
                      >
                        Scanner & Générer Lot TEJ
                      </button>
                    </div>
                  )}

                  {xmlGenerationStatus === 'scanning' && (
                    <div className="my-auto text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-indigo-300 font-sans font-bold">Scan en cours: détection des Retenues à la Source...</p>
                    </div>
                  )}

                  {xmlGenerationStatus === 'generating' && (
                    <div className="my-auto text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                      <p className="text-amber-300 font-sans font-bold">Calcul des sommes & écriture de l'en-tête XML sécurisé...</p>
                    </div>
                  )}

                  {xmlGenerationStatus === 'ready' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                        <span className="font-sans font-bold">Lot XML Généré avec Succès !</span>
                        <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-black">2026_T2_TEJ.xml</span>
                      </div>
                      <pre className="text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-850 overflow-x-auto max-h-[100px] text-[9.5px]">
                        {generatedXmlText}
                      </pre>
                      <button
                        onClick={() => setXmlGenerationStatus('idle')}
                        className="text-slate-400 hover:text-white font-bold font-sans text-[10px] uppercase underline mt-1"
                      >
                        Recommencer la simulation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Bloc 2: Paie & RH Tunisienne */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 lg:order-2 space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                02. MOTEUR RH PROGRESSIF
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                La paie tunisienne, automatisée à 100%.
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                Laissez notre moteur de calcul social estimer pour vous l'IRPP exact selon le dernier barème progressif, la cotisation CNSS (part salariale de 9.18% et part patronale de 16.57%) et la CSS. Émettez des fiches de paie PDF conformes sans aucune formule complexe.
              </p>
              <ul className="space-y-2.5 font-semibold text-xs text-slate-350">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Dossiers collaborateurs centralisés & contrats de travail</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Génération trimestrielle du fichier CNSS consolidé</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Calcul de l'abattement Chef de Famille et enfants à charge</span>
                </li>
              </ul>
            </div>

            {/* Interactive widget 2: Salary Cotisations Calculator */}
            <div className="lg:col-span-6 lg:order-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black uppercase text-amber-450 tracking-wider font-mono">
                    Moteur de Simulation de Salaire
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-[9px] text-slate-400 px-2 py-0.5 rounded font-mono">Taux Réglementaires 2026</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span>Salaire Brut Mensuel (TND)</span>
                      <span className="text-amber-400 font-mono text-sm">{grossSalary} TND</span>
                    </div>
                    <input 
                      type="range" 
                      min="800" 
                      max="6000" 
                      step="100"
                      value={grossSalary} 
                      onChange={(e) => setGrossSalary(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-2 gap-4 font-mono text-[10px] text-slate-400">
                    <div>
                      <span className="text-slate-550 block">CNSS Salariale (9.18%)</span>
                      <span className="text-slate-200 text-xs font-bold">{salaryDetails.cnssSalariale} TND</span>
                    </div>
                    <div>
                      <span className="text-slate-550 block">CNSS Patronale (16.57%)</span>
                      <span className="text-slate-200 text-xs font-bold">{salaryDetails.cnssPatronale} TND</span>
                    </div>
                    <div>
                      <span className="text-slate-550 block">Retenue IRPP (Progressif)</span>
                      <span className="text-amber-400 text-xs font-bold">{salaryDetails.irpp} TND</span>
                    </div>
                    <div>
                      <span className="text-slate-550 block">Solidarité CSS (1%)</span>
                      <span className="text-red-400 text-xs font-bold">{salaryDetails.css} TND</span>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Salaire Net Estimé</span>
                      <span className="text-[9px] text-slate-500">Hors primes & abattements spécifiques</span>
                    </div>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {salaryDetails.net} TND
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bloc 3: Import, Transit & Lettre de Crédit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                03. LOGISTIQUE INTERNATIONALE
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Maîtrisez vos coûts de revient réels.
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                Vous importez des marchandises pour fabriquer ou distribuer ? Suivez vos Lettres de Crédit (Crédoc) bancaires et calculez précisément votre coût de revient au débarquement (fret maritime, droits de douane tunisiens, honoraires transitaire et transport de sûreté) avant même l'accostage à Radès.
              </p>
              <ul className="space-y-2.5 font-semibold text-xs text-slate-350">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Intégration multi-devises (EUR, USD, TND) taux quotidiens</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Fiches d'arrivage maritime avec calcul d'impact sur le stock</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Alertes d'échéance de présentation de documents bancaires</span>
                </li>
              </ul>
            </div>

            {/* Interactive widget 3: Landed Cost estimation */}
            <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black uppercase text-amber-450 tracking-wider font-mono">
                    Simulateur de Coût de Revient Port de Radès
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-[9px] text-slate-400 px-2 py-0.5 rounded font-mono">Incoterm CIF Surcharge</span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">VALEUR CARGO FOB (TND)</label>
                      <input 
                        type="number"
                        value={cargoValueTnd}
                        onChange={(e) => setCargoValueTnd(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">FRET MARITIME (TND)</label>
                      <input 
                        type="number"
                        value={fretCostTnd}
                        onChange={(e) => setFretCostTnd(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Taux Moyen Droits de Douane + Taxes</span>
                      <span className="text-amber-400 font-mono">{douaneRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      value={douaneRate} 
                      onChange={(e) => setDouaneRate(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-slate-500 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Droits douane estimés:</span>
                      <span className="text-slate-300 font-bold">{importDetails.customs} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assurance Transport & Transit:</span>
                      <span className="text-slate-300 font-bold">{importDetails.insurance} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais transitaire forfaitaires:</span>
                      <span className="text-slate-300 font-bold">{importDetails.agent} TND</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-900/30 p-3 rounded-lg flex items-center justify-between font-mono text-xs text-indigo-300">
                    <span>Coût de revient global débarqué:</span>
                    <strong className="text-indigo-400 text-sm font-black">{importDetails.total} TND</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bloc 4: Production & GPAO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 lg:order-2 space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                04. PERFORMANCE INDUSTRIELLE
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                L'usine intelligente dans le Cloud.
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                Gérez vos ordres de fabrication, vos nomenclatures complexes de matières premières (BOM) et suivez votre Taux de Rendement Synthétique (TRS) en temps réel. Minimisez le gaspillage de composants et optimisez l'ordonnancement de vos lignes de production.
              </p>
              <ul className="space-y-2.5 font-semibold text-xs text-slate-350">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Calcul d'éclatement de nomenclature (BOM) et coûts de production</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Suivi des rebus et rebuts par atelier de production</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[11px]">✓</span>
                  <span>Tableau de bord de suivi du TRS (Taux de Rendement Synthétique)</span>
                </li>
              </ul>
            </div>

            {/* Interactive widget 4: Production TRS dial widget */}
            <div className="lg:col-span-6 lg:order-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black uppercase text-amber-450 tracking-wider font-mono">
                    TRS Machine Atelier de Découpe
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-[9px] text-slate-400 px-2 py-0.5 rounded font-mono">Ligne d'Usinage Active</span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-4 py-3">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG ring for dynamic percentage */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#1e293b" strokeWidth="8" fill="transparent" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#f59e0b" strokeWidth="8" fill="transparent" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * trsValue) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white font-mono">{trsValue}%</span>
                      <span className="text-[8px] font-bold text-amber-400 tracking-wider uppercase">TRS Machine</span>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full justify-center text-center">
                    <button 
                      onClick={() => { setTrsValue(72.1); }}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold font-mono"
                    >
                      Simulation Arrêt
                    </button>
                    <button 
                      onClick={() => { setTrsValue(89.5); }}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold font-mono"
                    >
                      Plein Régime
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bloc 05: Flotte Mobile, Pointage Biométrique & Synergie des 4 Piliers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-10 border-t border-slate-900/80">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                <Smartphone className="w-3.5 h-3.5" />
                <span>05. ÉCOSYSTÈME MOBILE & SYNERGIE TERRAIN (MOD-11)</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Pointage Biométrique IA & Synergie des 4 Piliers
              </h3>

              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                L’application mobile PWA <strong className="text-sky-300 font-bold">Elyssa Mobile Terrain</strong> fonctionne en mode <strong className="text-white font-bold">offline-first</strong> (100% hors-ligne) et connecte instantanément vos équipes nomades aux 4 grands piliers stratégiques d'Elyssa ERP :
              </p>

              {/* Synergie 4 Piliers Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Pillar 1: Paie & Pointage */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5 hover:border-emerald-500/30 transition">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Pointage IA & Paie RH</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Reconnaissance faciale Gemini Vision & Géofencing GPS. Envoi direct des heures vers le <strong className="text-slate-200">Moteur de Paie Tunisienne (CNSS/IRPP)</strong>.
                  </p>
                </div>

                {/* Pillar 2: Vente Embarquée & TEJ */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5 hover:border-amber-500/30 transition">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <FileCode className="w-4 h-4 shrink-0" />
                    <span>Van Sales & Fiscalité TEJ</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Bons de livraison & factures sur le terrain avec signature tactile. Alimentation automatique du module <strong className="text-slate-200">TEJ CIMF (Retenues à la source)</strong>.
                  </p>
                </div>

                {/* Pillar 3: Flotte & Transit Import */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5 hover:border-indigo-500/30 transition">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Car className="w-4 h-4 shrink-0" />
                    <span>Flotte & Transit Radès</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Géolocalisation du parc auto (MOD-08) & suivi du déchargement des conteneurs au port pour mise à jour des <strong className="text-slate-200">frais d'approche import</strong>.
                  </p>
                </div>

                {/* Pillar 4: Saisie Atelier & Production */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5 hover:border-purple-500/30 transition">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Cog className="w-4 h-4 shrink-0" />
                    <span>Atelier & TRS Industriel</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Déclaration des Ordres de Fabrication (OF) et rebuts sur tablette d'usine, alimentant le calcul du <strong className="text-slate-200">TRS Machine (GPAO)</strong> en direct.
                  </p>
                </div>

              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowTrialModal(true)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Tester l'Écosystème Mobile & Pointage Gratuitement</span>
                </button>
              </div>
            </div>

            {/* Interactive Widget: Mobile Device Simulator */}
            <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Simulateur Smartphone PWA Elyssa
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMobileSimMode('clockin')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${mobileSimMode === 'clockin' ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                  >
                    Pointage IA
                  </button>
                  <button
                    onClick={() => setMobileSimMode('vansales')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${mobileSimMode === 'vansales' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                  >
                    Van Sales
                  </button>
                </div>
              </div>

              {/* Phone Frame Mockup */}
              <div className="w-full max-w-[320px] bg-[#080d1e] border-4 border-slate-800 rounded-[32px] p-4 shadow-2xl relative overflow-hidden">
                
                {/* Top Notch & Status */}
                <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800/80 text-[9px] font-mono text-slate-400">
                  <span className="font-bold text-white">08:42</span>
                  <div className="w-12 h-2.5 bg-slate-900 rounded-full mx-auto"></div>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" /> 4G / Offline
                  </span>
                </div>

                {mobileSimMode === 'clockin' ? (
                  <div className="py-4 space-y-4 text-center">
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block">POINTAGE BIOMÉTRIQUE IA</span>
                      <p className="text-[11px] font-bold text-white">Chantier Sousse Port #3</p>
                    </div>

                    {/* Camera Scan Box */}
                    <div className="relative w-44 h-44 mx-auto rounded-2xl bg-slate-950 border-2 border-dashed border-sky-500/50 flex flex-col items-center justify-center overflow-hidden p-2">
                      
                      {mobileClockinStep === 'idle' && (
                        <div className="space-y-2">
                          <UserCheck className="w-10 h-10 text-sky-400 mx-auto animate-pulse" />
                          <p className="text-[10px] text-slate-400 font-semibold leading-tight">Positionnez votre visage devant la caméra</p>
                        </div>
                      )}

                      {mobileClockinStep === 'scanning' && (
                        <div className="space-y-2">
                          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                          <p className="text-[10px] text-amber-300 font-mono font-bold">Analyse faciale IA Gemini Vision...</p>
                          <span className="text-[8px] text-slate-500 block">Vérification coordonnées GPS...</span>
                        </div>
                      )}

                      {mobileClockinStep === 'verified' && (
                        <div className="space-y-2 animate-fadeIn">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                          <p className="text-[11px] text-emerald-400 font-bold">Pointage Confirmé !</p>
                          <div className="text-[8px] font-mono text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                            Collaborateur: Slim Ben Amara<br/>
                            Heure: 08:42:15 • GPS: Conforme (0m)
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="pt-2">
                      {mobileClockinStep !== 'verified' ? (
                        <button
                          onClick={() => {
                            setMobileClockinStep('scanning');
                            setTimeout(() => setMobileClockinStep('verified'), 1200);
                          }}
                          disabled={mobileClockinStep === 'scanning'}
                          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
                        >
                          {mobileClockinStep === 'scanning' ? 'Scan en cours...' : 'Simuler un Pointage Visage'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setMobileClockinStep('idle')}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase rounded-xl transition cursor-pointer"
                        >
                          Réinitialiser la simulation
                        </button>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="py-4 space-y-4 text-center">
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">VAN SALES & BONS DE LIVRAISON</span>
                      <p className="text-[11px] font-bold text-white">Client : Grossiste Sfax Nord</p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2 text-left font-mono text-[10px]">
                      <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
                        <span>BL #2026-8841</span>
                        <span className="text-amber-400 font-bold">1 250,000 TND</span>
                      </div>
                      
                      <div className="text-[9px] text-slate-300 space-y-0.5">
                        <p>• 10x Cartons Huile d'Olive (CUMP 45 TND)</p>
                        <p>• Retenue à la source (1.5%): 18.750 TND</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Signature Client Électronique :</span>
                        <div className="h-10 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-amber-400 font-serif italic text-xs">
                          {mobileSalesStep === 'idle' ? 'Attente signature sur écran tactile...' : '✓ Signature client validée (Amor B.)'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      {mobileSalesStep === 'idle' ? (
                        <button
                          onClick={() => setMobileSalesStep('signed')}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
                        >
                          Signer & Synchroniser au Cloud
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-[9px] font-mono rounded-xl font-bold">
                            ⚡ BL Validé • Intégré dans Stock & TEJ !
                          </div>
                          <button
                            onClick={() => setMobileSalesStep('idle')}
                            className="w-full py-1.5 bg-slate-900 text-slate-400 font-bold text-[9px] uppercase rounded-xl"
                          >
                            Nouvelle Vente
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5: LA COMPARAISON (Le K.O.) */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900 bg-slate-950/30" id="comparison">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
              Le Ring Tunisien
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Pourquoi Elyssa ERP change la donne en Tunisie ?
            </h2>
            <div className="w-12 h-1 bg-amber-500 mx-auto rounded"></div>
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-5 font-sans">Critères de choix</th>
                  <th className="p-5 font-sans border-l border-slate-850 bg-amber-500/5 text-amber-400">Elyssa ERP Suite</th>
                  <th className="p-5 font-sans">ERP Open-Source (Odoo/Dolibarr)</th>
                  <th className="p-5 font-sans">ERP Traditionnel sur Serveur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs font-semibold text-slate-300">
                <tr>
                  <td className="p-5 font-bold text-white">Frais d'intégration globaux</td>
                  <td className="p-5 border-l border-slate-850 bg-amber-500/5 text-emerald-400 font-bold">ZÉRO (Plug & Play immédiat)</td>
                  <td className="p-5">Très élevés (Intégrateurs tiers requis)</td>
                  <td className="p-5 text-red-400">Énormes (Investissement CAPEX lourd)</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-white">Mises à jour Lois de Finances</td>
                  <td className="p-5 border-l border-slate-850 bg-amber-500/5 text-emerald-400 font-bold">Automatiques & Gratuites</td>
                  <td className="p-5">Payantes (Nouveau développement custom)</td>
                  <td className="p-5">Payantes (Contrat d'assistance annuel)</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-white">Déploiement TEJ & CIMF</td>
                  <td className="p-5 border-l border-slate-850 bg-amber-500/5 text-emerald-400 font-bold">NATIF & Gratuit (Inclus partout)</td>
                  <td className="p-5">Module tiers sur-mesure (Risque d'erreur)</td>
                  <td className="p-5">Option facturée en sus ou indisponible</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-white">Accessibilité & Mobilité</td>
                  <td className="p-5 border-l border-slate-850 bg-amber-500/5 text-emerald-400 font-bold">100% Cloud / Mobile Web natif</td>
                  <td className="p-5">Correct (Si serveur hébergé)</td>
                  <td className="p-5 text-red-400">Complexe (Configuration VPN obligatoire)</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-white">Coût des serveurs & Maintenance</td>
                  <td className="p-5 border-l border-slate-850 bg-amber-500/5 text-emerald-400 font-bold">ZÉRO (Hébergement managé inclus)</td>
                  <td className="p-5">À votre charge (Serveur VPS ou dédié)</td>
                  <td className="p-5 text-red-400">Trés cher (Serveurs locaux physiques)</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* SECTION 6: THE INTERACTIVE ROI SIMULATOR & PRICING */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900" id="roi-pricing">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
              Calculateur d'impact économique
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Combien allez-vous économiser chaque mois ?
            </h2>
            <div className="w-12 h-1 bg-amber-500 mx-auto rounded"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
            
            <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h3 className="text-lg font-black text-white">Ajustez vos indicateurs d'activité :</h3>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>Nombre de Collaborateurs (Paie mensuelle)</span>
                    <span className="text-amber-400 font-mono">{employeesCount} employés</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="100" 
                    value={employeesCount} 
                    onChange={(e) => setEmployeesCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>Nombre de Factures de Vente / mois</span>
                    <span className="text-amber-400 font-mono">{invoicesCount} factures</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    value={invoicesCount} 
                    onChange={(e) => setInvoicesCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>Heures perdues en saisie & démarches administratives / mois</span>
                    <span className="text-amber-400 font-mono">{adminHoursLost} heures</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    value={adminHoursLost} 
                    onChange={(e) => setAdminHoursLost(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 text-center lg:text-left bg-indigo-950/20 border border-indigo-900/35 p-8 rounded-2xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono block">
                  ÉVALUATION DU RETOUR SUR INVESTISSEMENT
                </span>
                <h3 className="text-2xl font-black text-white">Économies Directes Estimées :</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Économies / Mois</span>
                  <p className="text-2xl font-black text-amber-400 font-mono">
                    {monthlySavings.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs text-slate-400">TND</span>
                  </p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Économies / An</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {annualSavings.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs text-slate-400">TND</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                * Cette estimation prend en compte le coût horaire moyen de traitement comptable, la réduction drastique des amendes pour retards de déclarations et l'élimination des outils logiciels superflus.
              </p>
            </div>

          </div>

          {/* Pricing Header: Periodicity & Categories */}
          <div className="pt-12 border-t border-slate-900 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono block">
                  GRILLE TARIFAIRE MODERNE & TRANSPARENTE
                </span>
                <h3 className="text-xl font-black text-white">Nos Formules Métiers Elyssa ERP</h3>
              </div>

              {/* Interval Switcher */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setLandingInterval('monthly')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    landingInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white font-bold'
                  }`}
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Mensuel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLandingInterval('quarterly')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    landingInterval === 'quarterly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white font-bold'
                  }`}
                >
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span>Trimestriel</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-1 rounded py-0.5">
                    -10%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLandingInterval('yearly')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    landingInterval === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white font-bold'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Annuel</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-1 rounded py-0.5 animate-pulse">
                    -20%
                  </span>
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-850 overflow-x-auto">
              <button
                type="button"
                onClick={() => setLandingPackTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  landingPackTab === 'all'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 font-bold'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span>Tous les Forfaits</span>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  landingPackTab === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-850 text-slate-400'
                }`}>
                  9
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLandingPackTab('commerce')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  landingPackTab === 'commerce'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 font-bold'
                }`}
              >
                <span>🛒</span>
                <span>Commerce & Services</span>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  landingPackTab === 'commerce' ? 'bg-indigo-700 text-white' : 'bg-slate-850 text-slate-400'
                }`}>
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLandingPackTab('logistics')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  landingPackTab === 'logistics'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 font-bold'
                }`}
              >
                <span>🚚</span>
                <span>Logistique & Négoce</span>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  landingPackTab === 'logistics' ? 'bg-amber-700 text-white' : 'bg-slate-850 text-slate-400'
                }`}>
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLandingPackTab('industry')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  landingPackTab === 'industry'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 font-bold'
                }`}
              >
                <span>🏗️</span>
                <span>Industrie & BTP</span>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  landingPackTab === 'industry' ? 'bg-emerald-700 text-white' : 'bg-slate-850 text-slate-400'
                }`}>
                  3
                </span>
              </button>
            </div>

            {/* Packs Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {DEFAULT_FALLBACK_PACKS
                .filter(p => p.id !== 'trial' && (landingPackTab === 'all' || p.category === landingPackTab))
                .map((pack) => {
                  const isFeatured = !!(pack as any).featured;
                  const basePrice = pack.price;
                  const monthlyRateWithDiscount = landingInterval === 'monthly'
                    ? basePrice
                    : landingInterval === 'quarterly'
                    ? Math.round(basePrice * 0.9)
                    : Math.round(basePrice * 0.8);

                  const multiplier = landingInterval === 'monthly' ? 1 : (landingInterval === 'quarterly' ? 3 : 12);
                  const totalContractPrice = monthlyRateWithDiscount * multiplier;

                  return (
                    <div 
                      key={pack.id}
                      className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 relative ${
                        isFeatured
                          ? 'bg-slate-900/90 border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-4 ring-amber-400/10'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                      }`}
                    >
                      {/* Top Badge & Featured Label */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {pack.badge}
                        </span>

                        {isFeatured ? (
                          <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                            RECOMMANDÉ
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 font-sans bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                            <span>Essai {trialDurationDays}j</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-white leading-snug">{pack.name}</h4>
                        <p className="text-slate-400 text-[11px] font-semibold leading-relaxed min-h-[36px]">
                          {pack.desc}
                        </p>
                      </div>

                      {/* Price Block */}
                      <div className="py-3 px-4 bg-slate-950/80 rounded-2xl border border-slate-850 space-y-1">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <strong className="text-2xl font-black font-mono text-white">
                            {totalContractPrice} TND
                          </strong>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                            {landingInterval === 'monthly'
                              ? "HT / mois"
                              : landingInterval === 'quarterly'
                              ? "HT / trim."
                              : "HT / an"
                            }
                          </span>
                        </div>
                        
                        {landingInterval !== 'monthly' && (
                          <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 pt-0.5 font-sans">
                            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                              {landingInterval === 'quarterly' ? '-10%' : '-20%'}
                            </span>
                            <span>soit <strong className="font-black">{monthlyRateWithDiscount} TND</strong> HT / mois</span>
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-850" />

                      {/* Included Modules List */}
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <span>MODULES INCLUS</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPackForModal(pack)}
                            className="text-indigo-400 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 px-2 py-0.5 rounded-md font-mono font-black text-[9px] flex items-center gap-1 cursor-pointer transition"
                          >
                            <Eye className="w-2.5 h-2.5 text-indigo-400" />
                            <span>✓ {pack.modules.length} modules</span>
                          </button>
                        </div>

                        <ul className="space-y-2 text-[11px] font-medium text-slate-300">
                          {(expandedPackIds[pack.id] ? pack.modules : pack.modules.slice(0, 5)).map(mId => (
                            <li key={mId} className="flex items-start gap-2">
                              <span className="bg-indigo-950/90 text-indigo-400 border border-indigo-800/80 w-4 h-4 flex items-center justify-center rounded-md text-[10px] shrink-0 font-bold mt-0.5">✓</span>
                              <span className="leading-tight font-semibold text-slate-200">{MODULE_NAMES[mId] || mId}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Interactive Accordion & Modal Trigger */}
                        <div className="pt-2 space-y-1">
                          {pack.modules.length > 5 && (
                            <button
                              type="button"
                              onClick={() => togglePackExpand(pack.id)}
                              className="w-full py-1.5 px-2 bg-slate-950 hover:bg-indigo-950/80 text-indigo-400 font-bold text-[10px] rounded-xl border border-slate-800 hover:border-indigo-800 transition text-center cursor-pointer flex items-center justify-center gap-1 font-sans"
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
                            className="w-full py-1 px-2 text-indigo-400 hover:text-indigo-300 font-black text-[9px] uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>👁️ Détails & Composition du Pack</span>
                          </button>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => setShowTrialModal(true)}
                        className={`w-full font-black text-xs py-2.5 px-4 rounded-xl transition-all duration-200 text-center cursor-pointer flex items-center justify-center gap-2 ${
                          isFeatured
                            ? 'bg-amber-400 hover:bg-white text-slate-950 shadow-md font-black'
                            : 'bg-slate-950 hover:bg-indigo-600 text-white border border-slate-800 hover:border-indigo-500'
                        }`}
                      >
                        <span>Activer l'Essai Gratuit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Custom configurateur / Sur-Mesure Card */}
            <div className="p-6 rounded-3xl border bg-gradient-to-br from-[#0c1033] via-[#042f2e]/20 to-[#020617] border-emerald-500/40 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-emerald-950/20 mt-6 group">
              <div className="space-y-3 relative z-10 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    CONFIGURATEUR SUR-MESURE
                  </span>
                  <span className="text-[9px] font-black uppercase text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md">
                    Sans Engagement
                  </span>
                </div>

                <h4 className="text-base font-black text-white flex items-center gap-2 pt-1">
                  <span>Forfait Modulaire Évolutif & À la Carte</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-2xl">
                  Composer votre environnement ERP sur-mesure au dinar près. Activez uniquement les modules nécessaires à votre quotidien et faites évoluer votre abonnement à votre propre rythme.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-200 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#042f2e] text-emerald-400 w-4 h-4 flex items-center justify-center rounded border border-emerald-500/30 text-[9px] shrink-0 font-bold">✓</span>
                    <span>Zéro module superflu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#042f2e] text-emerald-400 w-4 h-4 flex items-center justify-center rounded border border-emerald-500/30 text-[9px] shrink-0 font-bold">✓</span>
                    <span>Paiement au dinar près</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#042f2e] text-emerald-400 w-4 h-4 flex items-center justify-center rounded border border-emerald-500/30 text-[9px] shrink-0 font-bold">✓</span>
                    <span>{trialDurationDays} Jours d'essai offerts</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 flex flex-col justify-between relative z-10 shrink-0 lg:w-72 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase font-mono block">OFFRE SPÉCIALE</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white tracking-tight">
                      Essai {trialDurationDays} Jours Gratuit
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">Configurez vos modules en quelques clics</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTrialModal(true)}
                  className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-950" />
                  <span>Démarrer l'Essai Gratuit</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6.5: SÉCURITÉ, LÉGISLATION & SOUVERAINETÉ DES DONNÉES */}
      <section className="relative z-10 py-16 border-t border-slate-900 bg-slate-950/40" id="security-compliance">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              RÉASSURANCE & CONFORMITÉ LÉGALE
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Sécurité, Législation & Souveraineté des Données
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Elyssa ERP est conçu pour répondre aux normes réglementaires tunisiennes les plus exigeantes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Conformité Lois de Finances 2026</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Mise à jour automatique des barèmes IRPP, tranches CNSS et retenues à la source 2026.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Conformité Protection Données INPDP</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Cryptage SSL 256 bits et sécurisation stricte des données à caractère personnel.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Accréditation TEJ CIMF</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Génération certifiée conforme des déclarations fiscales XML destinées à la CIMF.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Sauvegardes Cloud Automatiques Redondées</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Sauvegardes instantanées redondées en temps réel sur infrastructure Cloud sécurisée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6.6: FAQ / FOIRE AUX QUESTIONS INTERACTIVE (ACCORDÉON) */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900 bg-slate-950/60" id="faq">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              QUESTIONS FRÉQUENTES
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Foire Aux Questions (FAQ)
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Tout ce que vous devez savoir avant de lancer votre essai gratuit d'Elyssa ERP.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Comment importer mes données de départ (articles, clients) ?",
                a: "Vous disposez d'un configurateur autonome pour charger vos fichiers de base en quelques clics."
              },
              {
                q: "Est-ce que le module TEJ est conforme aux exigences de la CIMF ?",
                a: "Oui, génération des fichiers XML signés électroniquement et conformes au schéma XSD national."
              },
              {
                q: "L'application mobile fonctionne-t-elle hors-ligne sur le terrain ?",
                a: "Oui, Elyssa Pocket est 100% Offline-First et synchronise automatiquement au retour du réseau."
              },
              {
                q: "Puis-je restreindre l'accès de mes collaborateurs par département ?",
                a: "Oui, grâce à la gestion granulaire des rôles RBAC et de l'authentification sécurisée par Code PIN à 6 chiffres."
              },
              {
                q: "Quels sont les délais d'activation ?",
                a: `Votre instance Cloud est prête et opérationnelle immédiatement avec ${trialDurationDays} jours d'essai gratuit.`
              }
            ].map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/80 transition"
                  >
                    <span className="text-sm font-black text-white leading-snug">
                      {item.q}
                    </span>
                    <span className={`w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-indigo-600 text-white border-indigo-500' : ''}`}>
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-5 pt-0 text-xs text-slate-300 font-medium leading-relaxed border-t border-slate-850/60 mt-1">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7: SOCIAL PROOF / TÉMOIGNAGES */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-900 bg-slate-950/20" id="testimonials">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
              La voix de nos clients
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Ils propulsent leur croissance avec Elyssa ERP
            </h2>
            <div className="w-12 h-1 bg-amber-500 mx-auto rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Quote 1: Slim, DAF */}
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl space-y-4">
              <div className="text-amber-400 text-3xl font-serif">“</div>
              <p className="text-slate-300 font-semibold text-xs leading-relaxed italic">
                Depuis que nous avons adopté le module Transit & Logistique d'Elyssa, je connais ma marge brute exacte au millime près sur chaque pièce importée de l'étranger. C'est le jour et la nuit pour nos prévisions de trésorerie.
              </p>
              <div className="pt-4 border-t border-slate-850 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-black text-xs">SB</div>
                <div>
                  <h4 className="text-xs font-black text-white">Slim B.</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Directeur Financier (DAF) - Carthage Distribution</p>
                </div>
              </div>
            </div>

            {/* Quote 2: Amira, Responsable RH */}
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl space-y-4">
              <div className="text-amber-400 text-3xl font-serif">“</div>
              <p className="text-slate-300 font-semibold text-xs leading-relaxed italic">
                La gestion de la paie mensuelle de nos 35 collaborateurs et l'édition des retenues à la source à la main me prenaient 3 jours complets. Avec Elyssa, c'est plié en une matinée. L'intégration réglementaire TEJ est magique.
              </p>
              <div className="pt-4 border-t border-slate-850 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-black text-xs">AG</div>
                <div>
                  <h4 className="text-xs font-black text-white">Amira G.</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Responsable RH - Sahel Tech S.A.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 8: FINAL CALL TO ACTION */}
      <section className="relative z-10 py-20 border-t border-slate-900 bg-gradient-to-b from-[#020617] to-[#040819]" id="final-cta">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
            Période d'évaluation offerte
          </span>
          
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Prêt à structurer votre croissance ?
          </h2>
          
          <p className="text-xs md:text-sm text-slate-450 leading-relaxed max-w-xl mx-auto font-semibold">
            Rejoignez les entreprises tunisiennes modernes qui ont choisi l'agilité. Créez votre compte en 2 minutes, sans aucun engagement ni carte de crédit requis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setShowTrialModal(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest p-4 px-8 rounded-xl cursor-pointer transition shadow-xl shadow-amber-500/10 border-0"
            >
              {trialDurationDays === 30 
                ? "Commencer mon mois gratuit" 
                : trialDurationDays === 7 
                ? "Commencer ma semaine gratuite" 
                : trialDurationDays === 14 
                ? "Commencer mes 14 jours gratuits" 
                : trialDurationDays === 90 
                ? "Commencer mes 3 mois gratuits" 
                : `Commencer mes ${trialDurationDays} jours gratuits`}
            </button>
            <a
              href="#roi-pricing"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs uppercase tracking-widest p-4 px-8 rounded-xl transition flex items-center justify-center"
            >
              Voir les Tarifs
            </a>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 relative z-10 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <ElyssaLogo className="w-8 h-8 rounded-lg" />
              <strong className="text-sm font-black uppercase tracking-wider font-sans">Elyssa ERP Suite</strong>
            </div>
            <p className="font-semibold leading-relaxed max-w-sm">
              SaaS tunisien haut de gamme pour l'optimisation des flux de gestion, comptabilité de conformité, relation client et suivi logistique des marchandises. Édité par <strong className="text-white">{companyName}</strong> ({legalForm}).
            </p>
            <div className="space-y-1 text-[10px] text-slate-400 font-mono">
              <p>📍 Siège : {companyAddress}</p>
              <p>🏢 RNE : <span className="text-amber-400 font-bold">{rneNumber}</span> | MF : <span className="text-amber-400 font-bold">{companyMF}</span></p>
              <p>✉️ {companyEmail} | 📞 {companyPhone}</p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 text-left">
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Liens Rapides</h5>
            <ul className="space-y-2 font-semibold">
              <li><a href="#features-zigzag" className="hover:text-white transition duration-200">Fonctionnalités Modules</a></li>
              <li><a href="#roi-pricing" className="hover:text-white transition duration-200">Simulateur ROI & Forfaits</a></li>
              <li><a href="#comparison" className="hover:text-white transition duration-200">Comparaison Marché</a></li>
              <li>
                <a 
                  href="/espace-expert-comptable" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/espace-expert-comptable');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="hover:text-amber-400 text-amber-300 font-bold transition duration-200 flex items-center gap-1.5"
                >
                  <span>🏢 Espace Expert-Comptable & Cabinet</span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded-full uppercase font-mono font-black">Nouveau</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3 text-left">
            <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-widest leading-none">Mentions Légales & CGV</h5>
            <ul className="space-y-2 font-semibold">
              <li>
                <button 
                  onClick={() => { setLegalModalTab('cgv'); setShowLegalModal(true); }}
                  className="hover:text-white text-slate-300 transition duration-200 bg-transparent border-0 p-0 text-left cursor-pointer font-bold"
                >
                  📄 Conditions Générales (CGV)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setLegalModalTab('privacy'); setShowLegalModal(true); }}
                  className="hover:text-white text-slate-300 transition duration-200 bg-transparent border-0 p-0 text-left cursor-pointer font-bold"
                >
                  🔒 Politique de Confidentialité
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setLegalModalTab('mentions'); setShowLegalModal(true); }}
                  className="hover:text-white text-slate-300 transition duration-200 bg-transparent border-0 p-0 text-left cursor-pointer font-bold"
                >
                  🏢 Mentions Légales & RNE
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setLegalModalTab('cgv'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 text-slate-400 transition duration-200 bg-transparent border-0 p-0 text-left cursor-pointer text-[10px]"
                >
                  💳 Modalités Paiement & Livraison
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setLegalModalTab('cgv'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 text-slate-400 transition duration-200 bg-transparent border-0 p-0 text-left cursor-pointer text-[10px]"
                >
                  🔄 Retours, Échanges & Remboursement
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest">Souveraineté</h5>
            <span className="inline-block bg-slate-900 border border-slate-800 text-amber-400 font-mono font-bold px-2.5 py-1 rounded-md">
              Droit Tunisien
            </span>
            <p className="text-[10px] text-slate-400 leading-tight">
              Tribunaux de Tunis. Hébergement Cloud hautement sécurisé.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 font-semibold text-center sm:text-left">
          <p>© 2026 Elyssa ERP Suite. Tous droits réservés. Conçu et édité par <strong className="text-slate-300 font-bold">{companyName}</strong>.</p>
          <p className="font-mono text-[10px]">RNE: {rneNumber} | MF: {companyMF}</p>
        </div>
      </footer>

      {/* FREE TRIAL REGISTER MODAL */}
      <AnimatePresence>
        {showTrialModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-left"
            >
              <div className="p-6 sm:p-8 space-y-6">
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      ESSAI GRATUIT V1.2
                    </span>
                    <h3 className="text-lg font-black text-white font-sans">
                      Activer mon compte d'évaluation Elyssa ERP
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold font-sans leading-relaxed">
                      Démarrez votre évaluation gratuite de {trialDurationDays} jours immédiatement. Remplissez ce formulaire pour créer l'instance sécurisée de votre entreprise.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTrialModal(false)}
                    className="text-slate-500 hover:text-white transition duration-150 text-lg font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-950/40 border border-slate-850"
                  >
                    ✕
                  </button>
                </div>

                {trialError && (
                  <div className="p-3.5 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-xs font-semibold">
                    ⚠️ {trialError}
                  </div>
                )}

                {trialSuccess ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-sm">Instance Elyssa prête !</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                        Nous configurons l'environnement Cloud pour <strong>{trialForm.companyName}</strong>. Redirection en cours...
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTrialSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Prénom
                        </label>
                        <input
                          type="text"
                          required
                          value={trialForm.firstName}
                          onChange={(e) => setTrialForm({ ...trialForm, firstName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                          placeholder="ex: Slim"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Nom de famille
                        </label>
                        <input
                          type="text"
                          required
                          value={trialForm.lastName}
                          onChange={(e) => setTrialForm({ ...trialForm, lastName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                          placeholder="ex: Ben Amor"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Raison Sociale de l'Entreprise
                      </label>
                      <input
                        type="text"
                        required
                        value={trialForm.companyName}
                        onChange={(e) => setTrialForm({ ...trialForm, companyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                        placeholder="ex: Carthage Distribution S.A."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          E-mail de contact (Login)
                        </label>
                        <input
                          type="email"
                          required
                          value={trialForm.email}
                          onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="ex: s.benamor@carthage.tn"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Téléphone Tunisien
                        </label>
                        <input
                          type="text"
                          required
                          value={trialForm.phone}
                          onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="ex: +216 71 888 999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Adresse Physique de l'Entreprise
                      </label>
                      <input
                        type="text"
                        required
                        value={trialForm.address}
                        onChange={(e) => setTrialForm({ ...trialForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                        placeholder="ex: Les Berges du Lac 2, Tunis"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Mot de passe de l'Espace Admin
                        </label>
                        <input
                          type="password"
                          required
                          value={trialForm.password}
                          onChange={(e) => setTrialForm({ ...trialForm, password: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="•••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Code PIN d'Identification (6 chiffres)
                        </label>
                        <input
                          type="text"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          required
                          value={trialForm.pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setTrialForm({ ...trialForm, pin: val });
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-center tracking-widest"
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition cursor-pointer border-0 shadow-md uppercase tracking-wider"
                      >
                        Créer mon instance d'évaluation
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed font-sans">
                        En créant votre instance, vous confirmez avoir lu et accepté nos{' '}
                        <button 
                          type="button" 
                          onClick={() => { setLegalModalTab('cgv'); setShowLegalModal(true); }}
                          className="text-amber-400 hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer inline"
                        >
                          Conditions Générales de Vente (CGV)
                        </button>{' '}
                        et notre{' '}
                        <button 
                          type="button" 
                          onClick={() => { setLegalModalTab('privacy'); setShowLegalModal(true); }}
                          className="text-amber-400 hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer inline"
                        >
                          Politique de Confidentialité
                        </button>.
                      </p>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEMO BOOKING MODAL */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-left"
            >
              <div className="p-6 sm:p-8 space-y-6">
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      DÉMO REPRÉSENTATION
                    </span>
                    <h3 className="text-lg font-black text-white font-sans">
                      Réserver une Démo Personnalisée
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold font-sans leading-relaxed">
                      Planifiez une session de 15 minutes en visioconférence avec l'un de nos architectes ERP basés en Tunisie.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="text-slate-500 hover:text-white transition duration-150 text-lg font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-950/40 border border-slate-850"
                  >
                    ✕
                  </button>
                </div>

                {demoSuccess ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-sm">Rendez-vous pré-enregistré !</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-xs mx-auto">
                        Nous venons d'envoyer une invitation Google Meet à <strong>{demoForm.email}</strong>. À très bientôt !
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={demoForm.fullName}
                        onChange={(e) => setDemoForm({ ...demoForm, fullName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                        placeholder="ex: Slim Ben Miled"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Raison Sociale
                      </label>
                      <input
                        type="text"
                        required
                        value={demoForm.companyName}
                        onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                        placeholder="ex: Carthage Trading S.A."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Email professionnel
                        </label>
                        <input
                          type="email"
                          required
                          value={demoForm.email}
                          onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="ex: s.miled@company.tn"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          required
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="ex: +216 22 111 222"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Date souhaitée
                        </label>
                        <input
                          type="date"
                          required
                          value={demoForm.preferredDate}
                          onChange={(e) => setDemoForm({ ...demoForm, preferredDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Créneau horaire
                        </label>
                        <select
                          value={demoForm.timeSlot}
                          onChange={(e) => setDemoForm({ ...demoForm, timeSlot: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-semibold"
                        >
                          <option value="Morning">Matin (9h - 12h)</option>
                          <option value="Afternoon">Après-midi (14h - 17h)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs py-3 rounded-xl transition cursor-pointer border-0 shadow-md uppercase tracking-wider"
                      >
                        Planifier ma démonstration
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEGAL & TERMS MODAL (CGV, PRIVACY, MENTIONS LEGALES) */}
      <AnimatePresence>
        {showLegalModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-left my-8"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    CONFORMITÉ & SOUVERAINETÉ TUNISIENNE
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white font-sans mt-1">
                    Documents Légaux & Conditions Contractuelles
                  </h3>
                </div>
                <button
                  onClick={() => setShowLegalModal(false)}
                  className="text-slate-400 hover:text-white transition duration-150 text-sm font-bold font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer self-end sm:self-auto"
                >
                  ✕ Fermer
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 overflow-x-auto gap-2">
                <button
                  onClick={() => setLegalModalTab('cgv')}
                  className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                    legalModalTab === 'cgv' 
                      ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📄 CGV & Remboursement
                </button>
                <button
                  onClick={() => setLegalModalTab('privacy')}
                  className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                    legalModalTab === 'privacy' 
                      ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔒 Politique de Confidentialité
                </button>
                <button
                  onClick={() => setLegalModalTab('mentions')}
                  className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                    legalModalTab === 'mentions' 
                      ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏢 Mentions Légales & RNE
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans">
                
                {/* TAB 1: CGV */}
                {legalModalTab === 'cgv' && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Conditions Générales de Vente (CGV) & Modalités
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Applicables aux services SaaS édités par <strong className="text-amber-400">{companyName}</strong> ({legalForm}).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">1. Description des Prestations & Services</h5>
                        <p>
                          {companyName} fournit un progiciel de gestion intégrée (ERP) en mode SaaS dénommé <strong>Elyssa ERP Suite</strong>. Les fonctionnalités incluent la gestion commerciale, la facturation conforme aux normes fiscales tunisiennes, la comptabilité générale, la paie/RH (CNSS/IRPP), la logistique, la gestion des stocks, la trésorerie et la gestion de flotte.
                        </p>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">2. Modalités de Paiement</h5>
                        <p>
                          Les abonnements sont facturés en Dinars Tunisiens (TND) Hors Taxes (HT). Le paiement s'effectue au choix de l'utilisateur :
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                          <li>Par carte bancaire tunisienne ou E-Dinar via la passerelle de paiement chiffrée <strong>Flouci</strong>.</li>
                          <li>Par virement bancaire ou chèque libellé à l'ordre de <strong className="text-white">{companyName}</strong>.</li>
                          <li>Par traite bancaire selon accord préalable de la direction financière.</li>
                        </ul>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">3. Modalités de Livraison & Délais d'Activation</h5>
                        <p>
                          La livraison du service est intégralement numérique et dématérialisée :
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                          <li>Pour les règlements électroniques par carte, l'activation de l'instance d'exploitation est <strong>immédiate et automatique</strong>.</li>
                          <li>Pour les règlements par virement ou chèque, l'instance est activée sous un délai maximum de <strong>24 heures ouvrées</strong> suivant la réception de l'ordre de virement ou la remise de chèque.</li>
                        </ul>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">4. Politique d’Annulation & Résiliation</h5>
                        <p>
                          L'utilisateur peut demander l'annulation ou la résiliation de son abonnement SaaS à tout moment sans aucun frais ni pénalité depuis l'espace de gestion ou par e-mail adressé à <strong className="text-white">{companyEmail}</strong>. La résiliation prendra effet à l'échéance de la période de facturation en cours (mensuelle, trimestrielle ou annuelle).
                        </p>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">5. Conditions de Retour, d'Échange & Politique de Remboursement</h5>
                        <p>
                          Chaque nouveau souscripteur bénéficie d'une <strong>période d'évaluation gratuite de {trialDurationDays} jours</strong> afin de tester l'ensemble des modules sans aucun engagement financier.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                          <li>Tout règlement effectué au-delà de la période d'évaluation est réputé ferme et définitif.</li>
                          <li>En cas d'interruption prolongée et avérée du service cloud excédant 72 heures consécutives imputable exclusivement à l'éditeur, un remboursement prorata temporis ou un avoir sera accordé au client sur simple demande écrite sous 14 jours.</li>
                        </ul>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">6. Droit Applicable & Résolution des Litiges</h5>
                        <p>
                          Les présentes CGV et tout contrat qui en découle sont soumis exclusivement au <strong>droit tunisien</strong> (Code des Obligations et des Contrats et législation relative au commerce électronique). En cas de différend, les parties s'engagent à privilégier une conciliation amiable sous 30 jours. À défaut, attribution exclusive de juridiction est faite aux <strong>Tribunaux de Tunis</strong>.
                        </p>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">7. Accessibilité des Conditions Avant Paiement</h5>
                        <p>
                          Les présentes conditions sont directement consultables à tout moment dans le pied de page du site et sont systématiquement soumises à la validation explicite de l'utilisateur avant toute création d'instance, commande ou paiement en ligne.
                        </p>
                      </section>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRIVACY POLICY */}
                {legalModalTab === 'privacy' && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Politique de Confidentialité & Protection des Données Personnelles
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Conforme à la Loi Organique n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel en Tunisie.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">1. Finalité de la Collecte des Données</h5>
                        <p>
                          Les données personnelles et professionnelles collectées sont strictement destinées aux finalités suivantes :
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                          <li>Création, sécurisation et administration technique de votre instance ERP.</li>
                          <li>Établissement des factures d'abonnement et suivi de la relation commerciale.</li>
                          <li>Prestation du support technique et de la maintenance opérationnelle.</li>
                          <li>Conformité aux obligations légales et fiscales tunisiennes.</li>
                        </ul>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">2. Données Collectées</h5>
                        <p>
                          Les catégories de données collectées incluent :
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                          <li><strong>Identité de l'entreprise :</strong> Raison sociale, Matricule Fiscal, Numéro RNE, Adresse du siège social.</li>
                          <li><strong>Coordonnées des utilisateurs :</strong> Nom, Prénom, adresse e-mail professionnelle, numéro de téléphone.</li>
                          <li><strong>Données de connexion & sécurité :</strong> Adresse IP, journaux d'audit et clés d'accès chiffrées.</li>
                        </ul>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">3. Droits des Utilisateurs</h5>
                        <p>
                          Conformément à la législation tunisienne, vous disposez d'un droit permanent d'accès, de rectification, de suppression, d'opposition et de portabilité des données vous concernant.
                        </p>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">4. Durée de Conservation des Données</h5>
                        <p>
                          Les données de votre instance sont conservées pendant toute la durée d'exécution de votre contrat. En cas de résiliation, les sauvegardes sont conservées pendant un délai de <strong>90 jours</strong> pour vous permettre d'exporter vos fichiers avant suppression définitive et irréversible. Les pièces justificatives comptables et factures sont conservées 10 ans selon le Code de Commerce tunisien.
                        </p>
                      </section>

                      <section className="space-y-1.5">
                        <h5 className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">5. Coordonnées pour l'Exercice de vos Droits</h5>
                        <p>
                          Pour toute demande relative à la protection de vos données, contactez le pôle conformité :
                        </p>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-slate-300 font-mono text-[11px] mt-2">
                          <p>✉️ Email : <strong className="text-amber-400">{companyEmail}</strong></p>
                          <p>📞 Téléphone : <strong className="text-amber-400">{companyPhone}</strong></p>
                          <p>📍 Adresse : <strong>{companyAddress}</strong></p>
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {/* TAB 3: MENTIONS LEGALES */}
                {legalModalTab === 'mentions' && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Mentions Légales & Identification de l'Éditeur
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Informations légales de la société éditrice d'Elyssa ERP Suite.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Nom Commercial</span>
                        <p className="text-sm font-black text-white">{companyName}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Forme Juridique</span>
                        <p className="text-sm font-black text-amber-400">{legalForm}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Numéro RNE (Registre National)</span>
                        <p className="text-sm font-mono font-bold text-white">{rneNumber}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Matricule Fiscal (MF)</span>
                        <p className="text-sm font-mono font-bold text-emerald-400">{companyMF}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Capital Social</span>
                        <p className="text-sm font-bold text-white">{shareCapital}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Gérance & Représentation</span>
                        <p className="text-sm font-bold text-slate-200">{legalRepresentative}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Adresse du Siège Social</span>
                        <p className="text-sm font-semibold text-slate-200">{companyAddress}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Adresse E-mail de Contact</span>
                        <p className="text-xs font-mono text-amber-400">{companyEmail}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Téléphone de Contact</span>
                        <p className="text-xs font-mono text-amber-400">{companyPhone}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                      <h5 className="font-extrabold text-amber-400 text-xs uppercase tracking-wide">Produits & Services Proposés</h5>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        <strong>Elyssa ERP Suite</strong> est un progiciel de gestion d'entreprise en mode SaaS intégrant les flux de facturation, comptabilité de conformité tunisienne, paie/RH, gestion des stocks, gestion de flotte, transit & logistique, trésorerie et relation client.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-right">
                <button
                  onClick={() => setShowLegalModal(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl transition cursor-pointer border-0 uppercase tracking-wider"
                >
                  J'ai compris & Je Valide
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👁️ POPUP MODAL: DETAILS & COMPOSITION DU PACK (FRONT-OFFICE) */}
      <AnimatePresence>
        {selectedPackForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-950 text-white flex items-start justify-between gap-4 border-b border-slate-800">
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

              {/* Modal Body - List of modules */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-900">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Composition du Forfait</span>
                  <span className="text-[10px] text-slate-400 font-normal font-mono">{selectedPackForModal.modules.length} fonctionnalités activées</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {selectedPackForModal.modules.map((mId: string) => (
                    <div key={mId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-5 h-5 flex items-center justify-center rounded-lg text-[10px] font-black shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-xs font-black text-slate-200 block leading-tight">
                        {MODULE_NAMES[mId] || mId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-300 font-bold">
                  Tarif : <span className="font-black text-indigo-400 font-mono text-base">{selectedPackForModal.price} TND</span> HT / mois
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPackForModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackForModal(null);
                      setShowTrialModal(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    Essayer ce Pack
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🤖 WIDGET FLOTTANT HYBRIDE: COPILOT IA & CONTACT COMMERCIAL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        {!isCopilotOpen && (
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white font-black p-3.5 px-5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer flex items-center gap-2.5 border border-indigo-400/30 group"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-ping" />
            </div>
            <div className="text-left font-sans">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-100 block opacity-80">
                Assistant IA
              </span>
              <span className="text-xs font-black tracking-tight block">
                Copilot Elyssa ERP
              </span>
            </div>
          </button>
        )}

        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-[350px] sm:w-[390px] h-[520px] shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
            >
              {/* Widget Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>🤖 Copilot IA Elyssa ERP</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>En ligne • Répond 24/7</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer text-xs font-black"
                >
                  ✕
                </button>
              </div>

              {/* Messages Chat Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/90 text-xs">
                {copilotMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-xs font-medium'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {/* Quick Chips */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {[
                    "💰 Tarifs & Essai Gratuit",
                    "📜 Module TEJ CIMF",
                    "📱 App Mobile Offline",
                    "🛡️ Sécurité INPDP"
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendCopilotMessage(chip)}
                      className="text-[10px] font-bold bg-slate-800/80 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/50 px-2.5 py-1 rounded-full transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Commercial Contact Button */}
              <div className="p-2.5 px-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
                <a
                  href="https://wa.me/21671862100?text=Bonjour%20Elyssa%20ERP,%20je%20souhaite%20des%20informations%20sur%20vos%2036%20modules%20et%20tarifs."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-100" />
                  <span>💬 Contact Commercial Direct</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-100" />
                </a>
              </div>

              {/* Interactive Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCopilotMessage();
                }}
                className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="Posez une question sur les 36 modules..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shrink-0"
                >
                  ➔
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
