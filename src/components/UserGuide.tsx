import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Target,
  Mail,
  AlertTriangle,
  Package,
  Car,
  Calculator,
  Settings,
  ShieldAlert,
  Clock,
  ShoppingCart,
  Truck,
  Cpu,
  FileCheck,
  Landmark,
  Anchor,
  Shield,
  Calendar,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  summary: string;
  steps: string[];
  tips: string[];
}

export default function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');

  const docSections: DocSection[] = [
    {
      id: 'dashboard',
      title: 'Tableau de Bord',
      icon: <Activity className="w-4 h-4 text-emerald-500" />,
      category: 'Pilotage & Stratégie',
      summary: 'Vision d\'ensemble analytique des indicateurs de performance clés (KPI) de Elyssa ERP.',
      steps: [
        'Analysez le chiffre d\'affaires consolidé en temps réel et le DSO (Days Sales Outstanding) moyen de l\'entreprise.',
        'Visualisez la répartition de l\'état de vos créances via le graphique interactif de Balance Âgée.',
        'Suivez le flux d\'activité récente pour rester informé des événements de recouvrement et de facturation majeurs.',
        'Consultez le statut des indicateurs de risques d\'impayés calculés sur l\'ensemble des comptes clients.'
      ],
      tips: [
        'Les indicateurs financiers sont actualisés de manière sécurisée et persistés localement grâce à la sauvegarde d\'arrière-plan automatique.',
        'Un DSO inférieur à 45 jours démontre un cycle de recouvrement dynamique et une excellente santé de trésorerie.'
      ]
    },
    {
      id: 'steering',
      title: 'Objectifs & Pilotage',
      icon: <Target className="w-4 h-4 text-indigo-400" />,
      category: 'Pilotage & Stratégie',
      summary: 'Fixation des objectifs de recouvrement et surveillance des performances des équipes commerciales.',
      steps: [
        'Configurez un objectif financier global de recouvrement pour la période ou le mois en cours.',
        'Attribuez des quotas de relance personnalisés pour chacun de vos agents ou collaborateurs opérationnels.',
        'Renseignez les montants réalisés réels pour mettre à jour les thermomètres de performance visuels.',
        'Suivez le taux d\'atteinte des objectifs de vente et de recouvrement à l\'aide des jauges de progression.'
      ],
      tips: [
        'La mise à jour des objectifs stimule l\'engagement collectif en clarifiant la direction stratégique de votre structure.',
        'Partagez ces statistiques en réunion hebdomadaire pour réaligner vos efforts commerciaux sur les priorités physiques.'
      ]
    },
    {
      id: 'reports',
      title: 'Rapports Terrain & Hebdo',
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      category: 'Pilotage & Stratégie',
      summary: 'Planification stratégique des tournées physiques, comptes-rendus opérationnels et analyse linguistique IA.',
      steps: [
        'Planifiez vos visites terrain de recouvrement ou de courtoisie directement dans l\'agenda interactif de la semaine.',
        'Saisissez les rapports opérationnels suite aux rendez-vous physiques pour consigner les promesses de paiement.',
        'Activez l\'outil d\'interprétation par Intelligence Artificielle (IA) de Elyssa pour évaluer la sémantique de vos rapports.',
        'Mettez à jour le statut du plan de tournée (Visite complétée, Prévue, Litige résolu).'
      ],
      tips: [
        'L\'analyse linguistique évalue la sémantique et la sincérité commerciale pour vous attribuer un score de probabilité de règlement.',
        'Les rapports sont directement archivés dans la chronologie client pour assurer un historique infaillible.'
      ]
    },
    {
      id: 'market',
      title: 'Études & Opportunités',
      icon: <Target className="w-4 h-4 text-red-450" />,
      category: 'Pilotage & Stratégie',
      summary: 'Outils de diagnostic stratégique, veille concurrentielle et suivi des appels d\'offres publics.',
      steps: [
        'Construisez des matrices SWOT (Forces, Faiblesses, Opportunités, Menaces) interactives pour chaque projet.',
        'Référencez vos concurrents directs avec leurs parts de marché estimées et vectors de compétitivité.',
        'Suivez les opportunités d\'appels d\'offres publics en Tunisie (TUNEPS) en évaluant leur faisabilité.',
        'Estimez le taux de réussite théorique de vos propositions commerciales grâce aux balances SWOT.'
      ],
      tips: [
        'Mettez à jour vos analyses SWOT trimestriellement pour réagir rapidement aux évolutions technologiques et légales.',
        'Associez des documents justificatifs aux opportunités d\'appels d\'offres pour consolider vos dossiers techniques.'
      ]
    },
    {
      id: 'clients',
      title: 'Fiches Clients',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      category: 'Relation Client & Vente',
      summary: 'Base de données centralisée de la relation client, notation de crédit et géolocalisation.',
      steps: [
        'Créez une fiche d\'identité client exhaustive (Nom, Matricule Fiscal, Téléphone, Secteur et Catégorie).',
        'Paramétrez la limite de crédit maximale autorisée et la notation de risque de crédit appropriée (Faible, Moyen, Élevé, Sinistre).',
        'Consultez la cartographie géographique de vos clients pour optimiser les plannings physiques par gouvernorat.',
        'Associez des notes de synthèse ou des particularités relationnelles directement sur sa fiche dédiée.'
      ],
      tips: [
        'Utilisez la recherche par filtres rapides pour isoler instantanément vos catégories stratégiques (Grossistes, Détaillants, etc.).',
        'Le dépassement d\'encours ou une notation de "Risque Sinistré" bloque l\'émission d\'encours non sécurisés.'
      ]
    },
    {
      id: 'communication',
      title: 'Hub de Communication',
      icon: <Mail className="w-4 h-4 text-violet-400" />,
      category: 'Relation Client & Vente',
      summary: 'Gestion intégrée des envois d\'e-mails professionnels, serveurs SMTP/IMAP et modèles de relances types.',
      steps: [
        'Configurez vos serveurs SMTP et IMAP professionnels (Hôte, Port, Sécurité) pour expédier et recevoir des e-mails.',
        'Définissez d\'élégants modèles de lettres de relance (Amiable, Rappel 1, Mise en demeure) avec variables d\'insertion.',
        'Sélectionnez des factures en retard et envoyez des relances individualisées ou groupées en un clic.',
        'Consultez la boîte de réception synchronisée et le livre d\'historique des communications d\'affaires.'
      ],
      tips: [
        'Les balises comme [Nom de l\'entreprise] ou [Facture Échue] sont remplacées à la volée avant chaque expédition.',
        'Testez votre configuration SMTP en vous envoyant un message d\'essai depuis l\'interface de paramétrage.'
      ]
    },
    {
      id: 'complaints',
      title: 'Suivi Réclamations',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      category: 'Relation Client & Vente',
      summary: 'Traitement systématique des désaccords clients et des réclamations opérationnelles.',
      steps: [
        'Ouvrez un dossier de réclamation client en précisant le motif de désaccord (Qualité, Quantité, Prix, Erreur facturation).',
        'Sélectionnez le degré de gravité du ticket (Faible, Moyen, Critique) pour prioriser l\'ordre de résolution.',
        'Suivez le cycle de vie du traitement de la réclamation (Nouveau, En Cours, Résolu ou Rejeté).',
        'Associez la réclamation à la facture à l\'origine du paiement bloqué pour éclairer le service de recouvrement.'
      ],
      tips: [
        'Le déblocage rapide des litiges commerciaux permet une réduction mesurable des délais de paiement de votre clientèle.',
        'Triez vos réclamations par motif pour corriger durablement les défaillances de votre chaîne logistique.'
      ]
    },
    {
      id: 'pos',
      title: 'Point de Vente (Smart POS)',
      icon: <ShoppingCart className="w-4 h-4 text-pink-400" />,
      category: 'Relation Client & Vente',
      summary: 'Console de caisse enregistreuse et point de vente directe pour les boutiques et comptoirs physiques.',
      steps: [
        'Ouvrez une session de caisse journalière avec encaissement initial de fond de caisse.',
        'Sélectionnez les articles ou scannez les codes-barres pour les ajouter instantanément au ticket.',
        'Choisissez le mode de paiement (Espèces, Chèque, Carte Bancaire ou Application Flouci) et encaissez.',
        'Clôturez votre caisse en fin de journée, générant l\'écriture comptable de recettes et décrémentant le stock.'
      ],
      tips: [
        'Le point de vente fonctionne de manière ultra-fluide et intègre la gestion des remises d\'articles à la ligne.',
        'Chaque ticket de caisse validé décompte immédiatement les produits du catalogue de stock pour un suivi précis.'
      ]
    },
    {
      id: 'billing',
      title: 'Facturation & Recouvrement',
      icon: <CreditCard className="w-4 h-4 text-blue-400" />,
      category: 'Opérations & Finance',
      summary: 'Création de factures, calcul des taxes fiscales et traitement des règlements de créances.',
      steps: [
        'Émettez de nouvelles factures de vente conformes contenant le détail des articles, les remises et les taux de TVA.',
        'Déterminez les délais de règlement réglementaires ainsi que le statut initial de chaque facture.',
        'Générez de multiples paiements partiels ou complets pour les imputer en direct sur la facture correspondante.',
        'Visualisez la liste consolidée des factures à recouvrer avec alerte visuelle d\'échéance.'
      ],
      tips: [
        'L\'application intègre le calcul du timbre fiscal légal de 1.000 DT requis sur l\'ensemble des factures professionnelles tunisiennes.',
        'Vous pouvez générer un rapport financier d\'historique pour chaque facture pour attester des versements effectués.'
      ]
    },
    {
      id: 'finance',
      title: 'Comptabilité & Trésorerie',
      icon: <Calculator className="w-4 h-4 text-green-400" />,
      category: 'Opérations & Finance',
      summary: 'Rapprochement bancaire comptable, équilibre des comptes de trésorerie et enregistrement des transactions.',
      steps: [
        'Enregistrez les différents comptes courants d\'entreprise (Banques, comptes de dépôt tunisiens ou étrangers).',
        'Enregistrez ou importez chronologiquement vos lignes d\'écritures bancaires (Débits, crédits, libellés de chèque).',
        'Associez des pièces ou factures justificatives à vos transactions pour finaliser le rapprochement opérationnel.',
        'Analysez le cash-flow net disponible de l\'entreprise via les courbes de soldes cumulées.'
      ],
      tips: [
        'Rapprochez vos lignes bancaires régulièrement pour éviter les écarts d\'écritures lors de l\'établissement du bilan bilatéral.',
        'Créez des catégories analytiques de dépenses claires pour suivre les lignes de frais généraux majeurs.'
      ]
    },
    {
      id: 'treasury',
      title: 'Trésorerie Prévisionnelle',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      category: 'Opérations & Finance',
      summary: 'Modélisation prévisionnelle des flux de trésorerie entrants et sortants à court et moyen terme.',
      steps: [
        'Intégrez les encaissements futurs prévus basés sur les échéances réelles des factures clients.',
        'Déclarez les décaissements planifiés (Fournisseurs, salaires, déclarations fiscales de TVA, CNSS).',
        'Générez des simulations sur un horizon de 1 à 12 mois pour analyser l\'évolution de votre solde cumulé.',
        'Identifiez en amont les périodes de tension de trésorerie pour négocier des lignes de crédit temporaires.'
      ],
      tips: [
        'Le module se synchronise avec les modules Facturation et Achats pour estimer dynamiquement les encours réels.',
        'Prévoyez toujours une marge de sécurité de 10% sur vos dépenses pour pallier les retards d\'encaissement imprévus.'
      ]
    },
    {
      id: 'assets',
      title: 'Gestion des Immobilisations',
      icon: <Landmark className="w-4 h-4 text-sky-400" />,
      category: 'Opérations & Finance',
      summary: 'Suivi comptable du registre des immobilisations d\'entreprise et calcul automatique des amortissements.',
      steps: [
        'Enregistrez vos actifs immobilisés (Matériel informatique, mobilier, véhicules, machines industrielles).',
        'Spécifiez la valeur d\'acquisition, la date de mise en service et la durée d\'amortissement légale.',
        'Sélectionnez le mode d\'amortissement (Linéaire ou Dégressif) conforme aux règles du plan comptable tunisien.',
        'Éditez le tableau complet d\'amortissement comptable annuel de vos actifs à destination de votre comptable.'
      ],
      tips: [
        'La dotation aux amortissements réduit légalement le résultat imposable de votre entreprise.',
        'N\'oubliez pas de déclarer les mises au rebut d\'actifs pour ajuster la valeur nette comptable globale.'
      ]
    },
    {
      id: 'investment',
      title: 'Bourse & Investissements',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      category: 'Opérations & Finance',
      summary: 'Administration de positions d\'actifs boursiers d\'entreprise, placements de trésorerie de secours et rentabilité.',
      steps: [
        'Initialisez de nouvelles positions boursières ou placements monétaires (Société de capitalisation, actions, FCP de banques).',
        'Renseignez la quantité achetée, le cours d\'action initial et suivez l\'évolution de la cotation.',
        'Enregistrez les dividendes encaissés pour mesurer le rendement financier annuel réel.',
        'Analysez de façon visuelle la performance cumulée ainsi que les plus-values latentes de vos lignes.'
      ],
      tips: [
        'L\'allocation de trésorerie excédentaire temporaire vers des supports sans risques de type SICAV protège contre la dévaluation.',
        'Consultez régulièrement les rapports graphiques de rendement boursier pour arbitrer vos positions de placement.'
      ]
    },
    {
      id: 'cession',
      title: 'Cession & Factoring',
      icon: <Percent className="w-4 h-4 text-cyan-400" />,
      category: 'Opérations & Finance',
      summary: 'Gestion des contrats de factoring et cession de créances facturées pour obtenir des financements de court terme.',
      steps: [
        'Sélectionnez vos factures saines en retard d\'échéance éligibles à une opération de cession de créance.',
        'Établissez et transmettez le bordereau de cession de créances auprès de votre banque ou factor (Tunisie Factoring, etc.).',
        'Enregistrez la réception de l\'avance de fonds (généralement 80% à 90%) et les commissions prélevées.',
        'Suivez le dénouement et le paiement final effectué par votre client entre les mains du factor.'
      ],
      tips: [
        'Le recours au factoring améliore instantanément votre fonds de roulement sans alourdir vos dettes bancaires.',
        'Suivez attentivement les frais financiers d\'affacturage pour évaluer le coût réel du financement de vos créances.'
      ]
    },
    {
      id: 'stock',
      title: 'Stocks & Entrepôts',
      icon: <Package className="w-4 h-4 text-orange-400" />,
      category: 'Logistique & Production',
      summary: 'Gestion du catalogue produits, inventaire physique de stockage et structures multi-entrepôts.',
      steps: [
        'Renseignez vos articles avec prix d\'achat, prix de vente de référence, code barre et niveau de stockage de sécurité.',
        'Créez des succursales ou des entrepôts logistiques physiques (Tunis, Sousse, Sfax, etc.).',
        'Déclarez des mouvements logistiques planifiés d\'entrées (Réception fournisseur) ou de sorties (Livraison client).',
        'Consultez la valorisation financière périodique de vos stocks actifs et les alertes d\'articles proches de la rupture.'
      ],
      tips: [
        'Paramétrez méticuleusement le seuil de sécurité de chaque pièce pour être notifié visuellement d\'un besoin d\'achat.',
        'Un stock bien équilibré réduit vos immobilisations de trésorerie et élimine les risques de rupture d\'activité.'
      ]
    },
    {
      id: 'fleet',
      title: 'Gestion Parc Auto',
      icon: <Car className="w-4 h-4 text-purple-400" />,
      category: 'Logistique & Production',
      summary: 'Administration de la flotte automobile, carte carburant d\'entreprise et planification de l\'entretien mécanique.',
      steps: [
        'Déclarez les véhicules opérationnels constituants le parc de votre société (Marque, Plaque d\'immatriculation, Modèle, Carburant, Affectation).',
        'Consignez les consommations régulières d\'essence en mentionnant le kilométrage actuel et la carte carburant (Vigor, etc.) impliquée.',
        'Déclarez les opérations d\'entretien mécanique pour un contrôle complet (Vidange moteur, amortisseurs, pneumatiques).',
        'Planifiez les prochaines alertes d\'échéance (Assurances professionnelles, Visites techniques, vignettes routières).'
      ],
      tips: [
        'Le module calcule la consommation moyenne aux 100 km par véhicule pour détecter les fraudes ou les usures d\'injecteurs.',
        'Ne négligez pas les alertes d\'entretien prédictives pour éviter les pannes immobilisantes en pleine tournée commerciale.'
      ]
    },
    {
      id: 'transit',
      title: 'Transit & Logistique',
      icon: <Truck className="w-4 h-4 text-amber-500" />,
      category: 'Logistique & Production',
      summary: 'Suivi logistique des importations et exportations, douanes, et calcul des coûts de revient complexes.',
      steps: [
        'Déclarez un dossier d\'importation maritime, aérien ou terrestre (Numéro de dossier, transitaire, compagnie maritime).',
        'Suivez les différentes étapes d\'acheminement (Port d\'origine, Transit international, Inspection en Douane, Sortie port).',
        'Enregistrez les différents frais liés (Droits de douane, frais d\'acconage, honoraires de transit, frais de magasinage).',
        'Calculez le coût de revient unitaire rendu entrepôt (Landed Cost) pour chaque produit importé.'
      ],
      tips: [
        'La liaison directe entre Transit et Stock permet d\'automatiser la mise à jour des prix d\'achat pondérés des marchandises importées.',
        'Suivez rigoureusement les surestaries de conteneurs pour éliminer les pénalités financières inutiles.'
      ]
    },
    {
      id: 'production',
      title: 'GPAO & Production',
      icon: <Cpu className="w-4 h-4 text-teal-500" />,
      category: 'Logistique & Production',
      summary: 'Gestion de Production Assistée par Ordinateur (GPAO), nomenclatures d\'assemblage et coûts de fabrication.',
      steps: [
        'Définissez les nomenclatures (Bill of Materials) associant les matières premières nécessaires à la fabrication d\'un produit fini.',
        'Lancez des ordres de fabrication (OF) en planifiant les quantités à fabriquer et l\'entrepôt de destination.',
        'Validez l\'OF pour déconsommer automatiquement les composants de stock et augmenter la quantité du produit fini créé.',
        'Analysez le coût d\'assemblage réel composé de la matière première et des frais d\'opération déclarés.'
      ],
      tips: [
        'La fabrication assistée par ordinateur de Elyssa calcule à l\'avance si votre stock actuel dispose de composants suffisants.',
        'Un historique de production complet permet de détecter les écarts anormaux de rebuts de matières premières.'
      ]
    },
    {
      id: 'purchasing',
      title: 'Achats & Fournisseurs',
      icon: <FileCheck className="w-4 h-4 text-rose-400" />,
      category: 'Logistique & Production',
      summary: 'Gestion du cycle d\'achat, demandes de prix fournisseurs, bons de commande et réceptions physiques.',
      steps: [
        'Centralisez les fiches de vos fournisseurs avec leurs coordonnées, modalités de paiement et délais de livraison standard.',
        'Saisissez des demandes de prix (RFQs) auprès de différents fournisseurs pour comparer les offres.',
        'Générez des Bons de Commande d\'Achat officiels et suivez l\'accord de confirmation commerciale.',
        'Validez les Bons de Réception d\'articles livrés à vos entrepôts pour incrémenter de façon sécurisée vos stocks.'
      ],
      tips: [
        'Faites un rapprochement systématique "Bon de Commande / Bon de Réception / Facture d\'Achat" avant de valider tout règlement.',
        'Le module Achats prévient automatiquement le service de comptabilité dès qu\'une facture fournisseur est prête à être payée.'
      ]
    },
    {
      id: 'payroll',
      title: 'Gestion Paie & RH',
      icon: <Users className="w-4 h-4 text-violet-500" />,
      category: 'Ressources Humaines',
      summary: 'Fiches salariés complexes, fiches de paie tunisiennes, calcul d\'IRPP, primes et cotisations sociales CNSS.',
      steps: [
        'Déclarez vos salariés en renseignant le salaire brut/de base de départ, l\'affiliation CNSS et le poste de travail.',
        'Configurez la situation familiale pour ajuster les réductions d\'impôts d\'IRPP Tunisie (chef de famille, nombre d\'enfants).',
        'Générez mensuellement les bulletins de paie individuels : Elyssa calcule automatiquement l\'assiette CNSS salariale, patronale, la CSS et l\'impôt net.',
        'Visualisez le récapitulatif comptable des virements à formaliser auprès de votre institution financière.'
      ],
      tips: [
        'Les cotisations et les échelles de calcul de l\'impôt (IRPP) sont coordonnées avec les dernières réglementations fiscales en Tunisie.',
        'Archivez les attestations et fichiers de bulletins calculés directement dans le dossier RH de la GED de l\'employé.'
      ]
    },
    {
      id: 'attendance',
      title: 'Pointage & Présence',
      icon: <Clock className="w-4 h-4 text-indigo-500" />,
      category: 'Ressources Humaines',
      summary: 'Pointage géolocalisé mobile (GPS), validation par selfie anti-fraude, badgeuses virtuelles et suivi des présences.',
      steps: [
        'Configurez vos sites d\'intervention physiques avec leurs coordonnées GPS géographiques précises et leur rayon d\'autorisation.',
        'Faites enregistrer un selfie de référence (enrôlement) par chacun de vos collaborateurs de terrain.',
        'Suivez en temps réel les pointages d\'entrée et de sortie validés par géolocalisation et photographie selfie.',
        'Consultez le registre mensuel des heures travaillées, les retards calculés et ajustez les anomalies éventuelles.'
      ],
      tips: [
        'Le module de pointage intègre un mode hors-ligne qui stocke localement le badgeage s\'il n\'y a pas d\'accès réseau instantané.',
        'Vous pouvez associer des justifications officielles d\'absence (Congé médical, mission extérieure) sur le registre RH.'
      ]
    },
    {
      id: 'ged',
      title: 'ED-GED & Pièces Justificatives',
      icon: <FileText className="w-4 h-4 text-yellow-500" />,
      category: 'Système, Documents & Interfaçages',
      summary: 'Classement de documents certifiés, gestion des fichiers numériques et coffre-fort de sécurité.',
      steps: [
        'Téléversez de nouveaux justificatifs comptables, contrats commerciaux, IRPP signées ou fichiers fiscaux.',
        'Associez le fichier déposé à une section dédiée (Vente, Achat, Banque, RH, Contrat) et spécifiez des tags clés.',
        'Consultez ou supprimez les pièces justificatives obsolètes à tout moment.',
        'Filtrez ou recherchez de façon instantanée vos documents administratifs grâce au moteur multi-critères.'
      ],
      tips: [
        'Un classement récurrent en GED de vos déclarations élimine le stress lors de la préparation de l\'audit comptable de fin d\'exercice.',
        'L\'application prend soin d\'attribuer des tags dynamiques pour vous aider à retrouver vos contrats d\'un simple clic.'
      ]
    },
    {
      id: 'tej',
      title: 'Interfaçage TEJ Douane',
      icon: <Shield className="w-4 h-4 text-blue-500" />,
      category: 'Système, Documents & Interfaçages',
      summary: 'Intégration directe avec le système national TEJ pour le suivi douanier et la synchronisation des dossiers de transit.',
      steps: [
        'Activez la liaison TEJ en saisissant vos identifiants d\'autorisation ou clé d\'accès de douane professionnelle.',
        'Synchronisez vos déclarations de douane d\'importation et d\'exportation directement depuis la plateforme d\'État.',
        'Récupérez automatiquement les montants liquidés de droits de douane et de taxes de transit applicables.',
        'Associez automatiquement les documents officiels TEJ (PDF de déclaration) à la GED de vos dossiers logistiques.'
      ],
      tips: [
        'La liaison TEJ élimine les doubles saisies manuelles et vous prémunit contre les erreurs de déclaration de nomenclature douanière.',
        'La synchronisation s\'effectue en arrière-plan et vous avertit dès qu\'une modification de statut douanier survient.'
      ]
    },
    {
      id: 'saas_config',
      title: 'Espace Client & Packs SaaS',
      icon: <CreditCard className="w-4 h-4 text-teal-500" />,
      category: 'Système & Administration',
      summary: 'Abonnement d\'hébergement Cloud, stockage de données GED extensible et configuration multi-sociétés.',
      steps: [
        'Consultez votre forfait SaaS actuel (Solo, Pro, ou Enterprise Cloud) et le quota d\'espace de stockage GED alloué.',
        'Basculez entre vos différents profits d\'entreprises enregistrées si vous opérez en format multi-sociétés ou groupe.',
        'Simulez la mise à niveau vers un pack supérieur pour lever les limitations de collaborateurs ou de stockage.',
        'Consultez vos reçus d\'abonnement d\'exploitation Cloud Elyssa directement depuis le volet dédié.'
      ],
      tips: [
        'Le pack "Enterprise Cloud" garantit un support applicatif prioritaire 7j/7 et une base de données entièrement dédiée.',
        'La gestion multi-sociétés vous permet de consolider l\'activité comptable de plusieurs filiales sur une unique interface.'
      ]
    },
    {
      id: 'business_plan',
      title: 'Business Plan Stratégique',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      category: 'Pilotage & Stratégie',
      summary: 'Outil de modélisation financière, de scénarios de chiffre d\'affaires, plan de financement et calcul de seuil de rentabilité.',
      steps: [
        'Sélectionnez un scénario d\'activité (Optimiste, Réaliste, Pessimiste) pour ajuster instantanément vos courbes de croissance.',
        'Ajustez le chiffre d\'affaires de base, le taux de croissance annuel et le ratio des coûts des ventes (matières premières).',
        'Saisissez vos charges fixes d\'exploitation (personnel, marketing, loyers) et configurez le taux d\'imposition tunisien de l\'IS.',
        'Visualisez votre Compte de Résultat prévisionnel sur 3 ans, déterminez le Point Mort financier et éditez le dossier de financement (Besoins/Ressources).'
      ],
      tips: [
        'Une simulation rigoureuse du plan de financement équilibré (Besoins = Ressources) est indispensable pour négocier un prêt d\'investissement auprès de votre banque (BIAT, Amen Bank, etc.).',
        'Téléchargez le rapport de Business Plan ou imprimez-le de manière officielle pour appuyer vos demandes d\'avantages fiscaux APIA/FOPRODI.'
      ]
    },
    {
      id: 'sec_juridique',
      title: 'Secrétariat Juridique',
      icon: <FileCheck className="w-4 h-4 text-indigo-400" />,
      category: 'Système, Documents & Interfaçages',
      summary: 'Génération automatique de documents d\'actes, rédaction assistée de PV d\'assemblées et coffre-fort d\'actes signés.',
      steps: [
        'Générez automatiquement des projets de Procès-Verbaux d\'Assemblée Générale Ordinaire (AGO), de Statuts de SARL ou de conventions réglementées.',
        'Complétez les informations requises (gérant, capital social, dividende par part sociale) pour mettre à jour les clauses.',
        'Utilisez le module "Déposer des actes signés" pour archiver numériquement vos documents officiels par glisser-déposer ou sélection simple.',
        'Visualisez directement vos actes sauvegardés dans le lecteur de documents intégré avec estampille "Certifié Conforme" et signatures électroniques.'
      ],
      tips: [
        'Le coffre-fort numérique de Elyssa ERP associe des métadonnées de dates et de tailles précises pour chaque fichier, assurant une traçabilité infaillible.',
        'En cas de contrôle fiscal ou d\'audit légal, utilisez le bouton d\'impression directe ou de téléchargement des documents d\'actes.'
      ]
    },
    {
      id: 'portail_client',
      title: 'Portail Client Libre-Service',
      icon: <Users className="w-4 h-4 text-pink-400" />,
      category: 'Relation Client & Vente',
      summary: 'Configuration de marque pour l\'espace client collaboratif sécurisé et simulation d\'environnement client.',
      steps: [
        'Définissez l\'identité de marque de votre espace client : choisissez le thème coloré (Émeraude, Indigo, Bleu, Rose, Ambre).',
        'Personnalisez le message d\'accueil et configurez l\'adresse e-mail dédiée au support de facturation.',
        'Sélectionnez un client actif de votre base CRM pour simuler fidèlement sa vue en libre-service.',
        'Consultez et suivez la vue du client : factures impayées, historique des règlements, téléchargement des documents partagés, et dépôt de réclamations.'
      ],
      tips: [
        'L\'activation des réclamations en ligne permet au client de notifier la comptabilité d\'un désaccord de retenue à la source ou de délais, accélérant la résolution amiable.',
        'Le client accède à son portail de manière sécurisée via un lien d\'authentification unique (lien magique) envoyé directement par e-mail.'
      ]
    },
    {
      id: 'admin',
      title: 'Console d\'Administration',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      category: 'Système & Administration',
      summary: 'Outils techniques d\'administration globale, réinitialisation de base de données et restauration de sauvegardes.',
      steps: [
        'Configurez les mécanismes de sécurité système et les permissions de rôles applicatifs (Manager, Agent, Auditeur).',
        'Consultez le livre journal pour observer en direct les connexions utilisateurs et les modifications comptables passées.',
        'Exportez une sauvegarde complète au format JSON sécurisé pour préserver localement l\'intégralité de Elyssa ERP.',
        'Utilisez le module d\'importation globale JSON pour restaurer un état d\'administration ou consolider des données d\'agences.'
      ],
      tips: [
        'Conservez une copie mensuelle de vos fichiers de sauvegarde JSON Elyssa pour vous prémunir de toute perte de données accidentelle.',
        'Seul l\'administrateur de l\'application (SuperAdmin) possède les droits exclusifs pour exécuter les imports ou réinitialisations globales.'
      ]
    }
  ];

  const filteredSections = docSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
        id="carthage-user-guide-modal"
      >
        {/* Header Decors */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800/80 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-550/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5 shadow-sm shadow-indigo-500/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-indigo-500/35">CENTRE D'ASSISTANCE CLOUD</span>
                <span className="text-[10px] text-emerald-400 font-bold">Elyssa ERP Pro</span>
              </div>
              <h2 className="text-sm font-black text-white mt-0.5 font-sans tracking-tight">Manuel d'Utilisation Interactif & Documentations Éditées ({docSections.length} Modules)</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-450 hover:text-white bg-slate-900 border border-slate-850 hover:border-slate-750 transition-colors rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Segment */}
        <div className="bg-slate-900/90 border-b border-slate-850 px-6 py-3.5 z-10 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-505" />
            <input
              type="text"
              placeholder="Rechercher un module, une règle de paie tunisienne, une étude SWOT ou un processus de trésorerie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-white border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none placeholder-slate-500 transition-colors font-medium text-left"
            />
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation bar */}
          <div className="w-2/5 md:w-1/3 border-r border-slate-850 bg-slate-950/30 overflow-y-auto p-4 space-y-2">
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-2.5 pb-1">MODULES CONFIGURÉS</p>
            {filteredSections.map((section) => {
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between border cursor-pointer ${
                    isActive 
                      ? 'bg-slate-800/95 border-indigo-500/40 text-white shadow-md' 
                      : 'border-transparent text-slate-400 hover:bg-slate-850/45 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                      isActive ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {section.icon}
                    </div>
                    <div className="truncate text-left">
                      <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-wider leading-none mb-0.5">{section.category}</span>
                      <span className="block text-xs font-bold leading-tight truncate">{section.title}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform shrink-0 ${isActive ? 'translate-x-0.5 text-indigo-400' : ''}`} />
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-6 text-center text-slate-600">
                <HelpCircle className="w-8 h-8 mx-auto stroke-[1.2] mb-2" />
                <p className="text-xs font-semibold">Aucun module correspondant</p>
              </div>
            )}
          </div>

          {/* Right Detail Segment */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-905">
            {(() => {
              const activeSec = docSections.find(s => s.id === selectedSection);
              if (!activeSec) return null;

              return (
                <div className="space-y-6 text-left animate-in fade-in duration-100">
                  {/* Title block */}
                  <div className="space-y-2 border-b border-slate-850 pb-4">
                    <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {activeSec.category}
                    </span>
                    <h3 className="text-lg font-black text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                      <span>{activeSec.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {activeSec.summary}
                    </p>
                  </div>

                  {/* Operational Steps */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-indigo-500 rounded-sm"></span>
                      Directives et Étapes d'Exploitation
                    </h4>
                    <div className="space-y-2.5">
                      {activeSec.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 items-start">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips and Pro recommendations */}
                  <div className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center space-x-2 text-indigo-400">
                      <ShieldAlert className="w-4 h-4 shadow-sm" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Conseils Pratiques Elyssa ERP</span>
                    </div>
                    <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-450 font-sans leading-relaxed">
                      {activeSec.tips.map((tip, idx) => (
                        <li key={idx} className="marker:text-indigo-400">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/95 border-t border-slate-850 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <span className="text-[10px] text-slate-550 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Documentation validée • Conforme Réglementation tunisienne
          </span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
          >
            Fermer l'Assistance
          </button>
        </div>
      </motion.div>
    </div>
  );
}
