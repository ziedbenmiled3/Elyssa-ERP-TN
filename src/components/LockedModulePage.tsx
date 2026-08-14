import React from 'react';
import { 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  Smartphone, 
  Cog, 
  Car, 
  Globe, 
  Building, 
  Users, 
  FileText, 
  Calculator, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  Scale
} from 'lucide-react';

interface ModuleInfo {
  code: string;
  title: string;
  category: string;
  priceTnd: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const MODULE_DETAILS_MAP: Record<string, ModuleInfo> = {
  mobile_terrain: {
    code: 'MOD-11',
    title: 'Flotte Mobile & Suivi Terrain',
    category: 'Opérations & Terrain',
    priceTnd: 39,
    description: 'Application mobile PWA offline-first pour livreurs, commerciaux (Van Sales) et chefs de chantiers. Inclut la géolocalisation GPS en temps réel, le pointage biométrique IA Gemini Vision et la vente embarquée.',
    features: [
      'Pointage biométrique IA (Reconnaissance faciale Gemini Vision)',
      'Géofencing GPS dynamique multi-sites & chantiers',
      'Mode Van Sales & Bons de livraison hors-ligne avec signature client',
      'Synchronisation bidirectionnelle Firestore automatique en tâche de fond',
      'Arbitrage & alertes de sécurité pour le responsable RH & contrôleur de gestion'
    ],
    icon: <Smartphone className="w-8 h-8 text-sky-400" />
  },
  production: {
    code: 'MOD-05',
    title: 'Production & GPAO (TRS)',
    category: 'Ressources & GPAO',
    priceTnd: 49,
    description: 'Suivi des ordres de fabrication (OF), gestion des nomenclatures multi-niveaux, calcul du Taux de Rendement Synthétique (TRS) et coût de revient des produits finis.',
    features: [
      'Nomenclatures matières & gammes opératoires multi-niveaux',
      'Lancement et suivi des Ordres de Fabrication (OF)',
      'Calcul automatique du Taux de Rendement Synthétique (TRS)',
      'Suivi des consommations matières & contrôle qualité en atelier'
    ],
    icon: <Cog className="w-8 h-8 text-sky-400" />
  },
  fleet: {
    code: 'MOD-08',
    title: 'Gestion Parc Auto & Véhicules',
    category: 'Logistique & Flotte',
    priceTnd: 29,
    description: 'Suivi du parc automobile, contrôles techniques, cartes VTT, assurances, consommations de carburant et affectation des véhicules de service.',
    features: [
      'Carnet de santé véhicule & suivi des kilométrages',
      'Alertes automatiques pour vidanges, assurances & contrôles techniques',
      'Gestion des cartes carburant & consommations au 100km',
      'Historique des sinistres & affectations des chauffeurs'
    ],
    icon: <Car className="w-8 h-8 text-emerald-400" />
  },
  transit_logistique: {
    code: 'MOD-09',
    title: 'Import / Export & Transit Logistique',
    category: 'Logistique International',
    priceTnd: 49,
    description: 'Gestion des dossiers de transit douanier, suivi des expéditions maritimes/aériennes, calcul des frais d’approche et couts de revient import.',
    features: [
      'Dossiers de transit douanier & déclarations d’import/export',
      'Calcul automatique du coût de revient d’importation (frais d’approche)',
      'Suivi de la traçabilité des conteneurs & réclamations transporteurs',
      'Intégration directe avec les fiches fournisseurs & stocks'
    ],
    icon: <Globe className="w-8 h-8 text-indigo-400" />
  },
  lc_manager: {
    code: 'MOD-10',
    title: 'Lettre de Crédit (Crédoc)',
    category: 'Finance & Négoce',
    priceTnd: 39,
    description: 'Suivi opérationnel des crédits documentaires d’importation et d’exportation, suivi des réserves bancaires et conformité des expéditions.',
    features: [
      'Suivi des ouvertures, amendements & apurements Crédoc',
      'Vérification de la conformité des documents de transport (B/L, CO)',
      'Echéancier des engagements bancaires & alertes de validité',
      'Journal de bord partagé avec le département financier'
    ],
    icon: <Building className="w-8 h-8 text-indigo-400" />
  },
  cession: {
    code: 'MOD-12',
    title: 'Cession d’Entreprise & M&A',
    category: 'Opérations Stratégiques',
    priceTnd: 59,
    description: 'Préparation à la cession d’entreprise, valorisation financière multi-méthodes, dataroom virtuelle sécurisée et checklist de due diligence.',
    features: [
      'Valorisation financière automatique (DCF, Multiples, ANR)',
      'Dataroom virtuelle sécurisée pour les investisseurs',
      'Checklist interactive de due diligence juridique & fiscale',
      'Gestion des mandats de vente & accords de confidentialité (NDA)'
    ],
    icon: <ArrowRightLeft className="w-8 h-8 text-amber-400" />
  },
  juridique: {
    code: 'MOD-07',
    title: 'Secrétariat Juridique & Assemblées',
    category: 'Gouvernance & Droit',
    priceTnd: 29,
    description: 'Gestion des procès-verbaux d’assemblées générales (AGO/AGE), registre des associés, pouvoirs et conformité RNE Tunisie.',
    features: [
      'Génération automatique de PV d’AG & résolutions d’approbation des comptes',
      'Registre des mouvements de parts sociales & actions',
      'Suivi des mandats des gérants/administrateurs & échéances légales RNE',
      'Modèles de contrats commerciaux & lettres officielles pré-remplis'
    ],
    icon: <Scale className="w-8 h-8 text-blue-400" />
  },
  caisse: {
    code: 'MOD-04',
    title: 'Caisse Intelligente (POS)',
    category: 'Commerce & Vente',
    priceTnd: 29,
    description: 'Interface de caisse tactile, arrêtés de caisse quotidiens (Z de caisse), comptage des espèces, tickets et synchronisation comptable.',
    features: [
      'Saisie rapide de caisse avec scanner code-barres',
      'Arrêtés Z de caisse & comptage physique des espèces',
      'Clôture quotidienne & intégration automatique en comptabilité',
      'Gestion des rendus de monnaie & cartes bancaires'
    ],
    icon: <Calculator className="w-8 h-8 text-emerald-400" />
  },
  purchasing: {
    code: 'MOD-06',
    title: 'Gestion des Achats & Approvisionnements',
    category: 'Achats & Stocks',
    priceTnd: 39,
    description: 'Demandes d’achats internes, bons de commande fournisseurs, suivi des livraisons et évaluation de la performance fournisseurs.',
    features: [
      'Demandes d’achats (DA) avec circuit de validation hiérarchique',
      'Bons de commande fournisseurs & suivi des reliquats',
      'Contrôle de conformité BL vs Facture fournisseur',
      'Évaluation de la ponctualité & qualité des fournisseurs'
    ],
    icon: <ShoppingCart className="w-8 h-8 text-emerald-400" />
  },
  asset: {
    code: 'MOD-13',
    title: 'Immobilisations & Amortissements',
    category: 'Finance & Patrimoine',
    priceTnd: 29,
    description: 'Gestion du registre des immobilisations, calcul des tableaux d’amortissements linéaires/dégressifs et écritures de dotation.',
    features: [
      'Fiches d’immobilisations avec photos & codes-barres',
      'Calcul automatique des plans d’amortissement fiscal & comptable',
      'Génération automatique des écritures de dotation annuelle',
      'Gestion des sorties d’actifs & plus/moins-values de cession'
    ],
    icon: <Building className="w-8 h-8 text-amber-400" />
  },
  treasury: {
    code: 'MOD-14',
    title: 'Trésorerie & Portefeuille d’Effets',
    category: 'Finance & Banques',
    priceTnd: 39,
    description: 'Suivi prévisionnel de trésorerie, gestion des chèques/traites à l’encaissement, escompte et bordereaux de remise en banque.',
    features: [
      'Plan de trésorerie prévisionnel glissant à 30/60/90 jours',
      'Portefeuille des chèques & traites en coffre',
      'Bordereaux de remise à l’encaissement & à l’escompte',
      'Alertes d’impayés & agios bancaires'
    ],
    icon: <TrendingUp className="w-8 h-8 text-indigo-400" />
  },
  stock: {
    code: 'MOD-03',
    title: 'Stocks & Fournisseurs Multi-Dépôts',
    category: 'Commercial & Logistique',
    priceTnd: 39,
    description: 'Gestion des stocks en temps réel sur plusieurs dépôts, valorisation FIFO/PUMP, inventaires physiques et seuils d’alerte.',
    features: [
      'Multi-dépôts & mouvements d’entrée/sortie',
      'Valorisation de stock FIFO & PUMP',
      'Inventaires tournants & ajustements de stock',
      'Alerte de rupture de stock automatique'
    ],
    icon: <Package className="w-8 h-8 text-amber-400" />
  },
  payroll: {
    code: 'MOD-02',
    title: 'Gestion Paie & RH Tunisie',
    category: 'RH & Paie',
    priceTnd: 39,
    description: 'Calcul automatique des bulletins de paie conforme à la législation tunisienne 2026, déclarations CNSS, IRPP et fiches d’employés.',
    features: [
      'Fiches de paie conformes aux barèmes CNSS & IRPP 2026',
      'Génération des fichiers de virement bancaire & état de paie',
      'Télédéclaration CNSS trimestrielle',
      'Gestion des congés, acomptes & prêts aux salariés'
    ],
    icon: <Users className="w-8 h-8 text-emerald-400" />
  },
  ged: {
    code: 'MOD-15',
    title: 'ED-GED & Pièces Justificatives',
    category: 'Documents & Dématérialisation',
    priceTnd: 29,
    description: 'Gestation électronique de documents, classement par dossier entreprise, recherche OCR et horodatage des justificatifs.',
    features: [
      'Stockage sécurisé des factures, contrats & pièces comptables',
      'Classement automatique par dossier & exercice comptable',
      'Contrôle des accès & historique de consultation',
      'Recherche rapide par mot-clé & métadonnées'
    ],
    icon: <FileText className="w-8 h-8 text-indigo-400" />
  }
};

interface LockedModulePageProps {
  tabId: string;
  moduleLabel?: string;
  currentPackName?: string;
  activeCompanyName?: string;
  onNavigateToSaaSConfig: () => void;
  onNavigateToDashboard: () => void;
}

export const LockedModulePage: React.FC<LockedModulePageProps> = ({
  tabId,
  moduleLabel,
  currentPackName = 'Standard',
  activeCompanyName = 'Votre Entreprise',
  onNavigateToSaaSConfig,
  onNavigateToDashboard
}) => {
  const details = MODULE_DETAILS_MAP[tabId] || {
    code: 'MOD-EXTRA',
    title: moduleLabel || 'Module Complémentaire Elyssa ERP',
    category: 'Extension Spécialisée',
    priceTnd: 39,
    description: 'Ce module offre des fonctionnalités avancées pour optimiser la gestion et la productivité de votre entreprise.',
    features: [
      'Intégration directe avec l’ensemble des modules Elyssa ERP',
      'Accès multi-utilisateurs sécurisé selon les rôles attribués',
      'Synchronisation des données en temps réel',
      'Rapports analytiques & exports Excel / PDF'
    ],
    icon: <Sparkles className="w-8 h-8 text-indigo-400" />
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Outer Card Wrapper */}
      <div className="w-full max-w-4xl bg-[#090d1a] border border-slate-800/80 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative">
        
        {/* Glowing Gradient Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>

        {/* Ambient background glow behind lock icon */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-6 sm:p-10 relative z-10 space-y-8">
          
          {/* Top Bar Navigation & Lock Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-6">
            
            <button
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au Tableau de Bord</span>
            </button>

            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 animate-pulse" />
              <span>Module Non Acquis • Licence Requise</span>
            </div>

          </div>

          {/* Hero Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-lg shadow-black/40">
              {details.icon}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-black text-[10px] rounded-md uppercase">
                  {details.code}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {details.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {details.title}
              </h1>
            </div>
          </div>

          {/* Main Informational Notice Banner */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Ce module <strong className="text-amber-400 font-bold">ne fait pas partie de votre pack actuel ({currentPackName})</strong> configuré pour <strong className="text-white">{activeCompanyName}</strong>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pour débloquer l’accès à <strong className="text-slate-200">{details.title}</strong> pour vous et vos collaborateurs, vous pouvez l’ajouter à la carte ou faire évoluer votre formule dans l’Espace Client & Packs.
            </p>
          </div>

          {/* Main Content Grid: Features vs Upgrade Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Module Description & Included Features */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Présentation du Module
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {details.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Fonctionnalités Incluses :
                </h3>

                <ul className="space-y-2.5">
                  {details.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Right Column: Pricing & Activation Card */}
            <div className="lg:col-span-5 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">
                  TARIF & ACTIVATION À LA CARTE
                </span>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {details.priceTnd}
                  </span>
                  <span className="text-sm font-black text-emerald-400 uppercase">
                    DT / mois HT
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  Tarif mensuel sans engagement. Déblocage instantané sur votre compte entreprise.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={onNavigateToSaaSConfig}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/20 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/30"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Activer dans l'Espace Client</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={onNavigateToSaaSConfig}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-800"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Voir tous les Packs & Forfaits</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  🛡️ Activation sécurisée & répercutée en temps réel
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 text-center text-[10px] text-slate-400 font-mono">
          Éditeur Elyssa ERP Suite • Service Client & Commercial : <span className="text-slate-300 font-bold">contact@elyssa-entreprises.com</span>
        </div>

      </div>

    </div>
  );
};

export default LockedModulePage;
