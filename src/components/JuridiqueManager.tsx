import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  BookOpen, 
  Calendar, 
  FolderLock, 
  Settings, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Users, 
  ArrowUpRight,
  RefreshCw,
  Search,
  Upload,
  Eye,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import IframePrintHelper from './IframePrintHelper';
import { formatTND } from '../utils/calculations';

interface JuridiqueManagerProps {
  companyName?: string;
  onRefreshData?: () => void;
}

export default function JuridiqueManager({ companyName = "Elyssa Corp", onRefreshData }: JuridiqueManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pv' | 'conventions' | 'registres' | 'echeances' | 'archivage'>('pv');
  
  // 1. Procès-Verbaux Generator state
  const [pvType, setPvType] = useState<'approbation' | 'capital' | 'gerant'>('approbation');
  const [pvDate, setPvDate] = useState('2026-06-30');
  const [managerName, setManagerName] = useState('Yassine Ben Salem');
  const [capitalAmount, setCapitalAmount] = useState(100000);
  const [netProfit, setNetProfit] = useState(45200);
  const [dividendAmount, setDividendAmount] = useState(30000);
  const [newCapital, setNewCapital] = useState(150000);
  const [newManager, setNewManager] = useState('Myriam Ben Ali');
  
  // Printable states
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printTitle, setPrintTitle] = useState('');
  const [printContent, setPrintContent] = useState('');

  // 2. Conventions state
  const [domiciliationDuration, setDomiciliationDuration] = useState('12'); // months
  const [domiciliationPrice, setDomiciliationPrice] = useState(150); // TND / month
  const [clientCompanyName, setClientCompanyName] = useState('Sidi Bou Said Ventures');
  const [clientRepresentative, setClientRepresentative] = useState('Sofiene Mezghani');

  // 3. Registres légaux state
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [newShareholderName, setNewShareholderName] = useState('');
  const [newShareholderShares, setNewShareholderShares] = useState('');

  // 4. Suivi des Échéances state
  const [deadlines, setDeadlines] = useState<any[]>([]);

  // 5. Archivage numérique (document simulator)
  const [documents, setDocuments] = useState<any[]>([]);

  // LocalStorage Sync
  React.useEffect(() => {
    const savedShareholders = localStorage.getItem('carthage_juridique_shareholders');
    const savedDeadlines = localStorage.getItem('carthage_juridique_deadlines');
    const savedDocs = localStorage.getItem('carthage_juridique_documents');

    if (savedShareholders) {
      setShareholders(JSON.parse(savedShareholders));
    } else {
      const defaultShareholders = [
        { id: '1', name: 'Zied Ben Miled', shares: 550, nominalValue: 10, totalContribution: 5500, percentage: 55 },
        { id: '2', name: 'Fatma Dridi', shares: 350, nominalValue: 10, totalContribution: 3500, percentage: 35 },
        { id: '3', name: 'Slim Kamoun', shares: 100, nominalValue: 10, totalContribution: 1000, percentage: 10 },
      ];
      setShareholders(defaultShareholders);
      localStorage.setItem('carthage_juridique_shareholders', JSON.stringify(defaultShareholders));
    }

    if (savedDeadlines) {
      setDeadlines(JSON.parse(savedDeadlines));
    } else {
      const defaultDeadlines = [
        { id: '1', title: 'Assemblée Générale Ordinaire d\'Approbation des comptes 2025', date: '2026-06-30', status: 'Completed', urgency: 'Low' },
        { id: '2', title: 'Dépôt des comptes annuels au Registre National des Entreprises (RNE)', date: '2026-07-31', status: 'Pending', urgency: 'High' },
        { id: '3', title: 'Déclaration trimestrielle des employeurs (CNSS 2ème Trimestre)', date: '2026-07-15', status: 'Pending', urgency: 'High' },
        { id: '4', title: 'Renouvellement annuel du contrat de domiciliation commerciale', date: '2026-09-01', status: 'Pending', urgency: 'Medium' },
      ];
      setDeadlines(defaultDeadlines);
      localStorage.setItem('carthage_juridique_deadlines', JSON.stringify(defaultDeadlines));
    }

    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    } else {
      const defaultDocs = [
        { id: 'doc1', title: 'Statuts Enregistrés - Elyssa ERP.pdf', category: 'Statuts & Constitution', date: '2025-01-12', size: '2.4 MB' },
        { id: 'doc2', title: 'PV Assemblée Générale Ordinaire 2025 (Signé).pdf', category: 'Procès-Verbaux', date: '2026-06-15', size: '1.1 MB' },
        { id: 'doc3', title: 'Convention de Domiciliation - Sidi Bou Said.pdf', category: 'Conventions', date: '2025-09-01', size: '840 KB' },
        { id: 'doc4', title: 'Extrait Registre National des Entreprises (RNE).pdf', category: 'Administratif', date: '2026-05-10', size: '1.6 MB' },
      ];
      setDocuments(defaultDocs);
      localStorage.setItem('carthage_juridique_documents', JSON.stringify(defaultDocs));
    }
  }, []);

  React.useEffect(() => {
    if (shareholders.length > 0) {
      localStorage.setItem('carthage_juridique_shareholders', JSON.stringify(shareholders));
    }
  }, [shareholders]);

  React.useEffect(() => {
    if (deadlines.length > 0) {
      localStorage.setItem('carthage_juridique_deadlines', JSON.stringify(deadlines));
    }
  }, [deadlines]);

  React.useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('carthage_juridique_documents', JSON.stringify(documents));
    }
  }, [documents]);
  const [dragActive, setDragActive] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<any | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Determine category based on name
      let category = 'Administratif';
      if (file.name.toLowerCase().includes('statut')) {
        category = 'Statuts & Constitution';
      } else if (file.name.toLowerCase().includes('pv') || file.name.toLowerCase().includes('assembl')) {
        category = 'Procès-Verbaux';
      } else if (file.name.toLowerCase().includes('convent')) {
        category = 'Conventions';
      }

      setDocuments([
        {
          id: Date.now().toString(),
          title: file.name,
          category,
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        },
        ...documents
      ]);
    }
  };

  // PV Legal text generation formulas
  const generatePvText = (): { title: string; content: string } => {
    if (pvType === 'approbation') {
      const title = `PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE`;
      const content = `L'an deux mille vingt-six, le ${new Date(pvDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à 10 heures, les associés de la société ${companyName}, Société à Responsabilité Limitée au capital de ${capitalAmount.toLocaleString('fr-FR')} TND, se sont réunis en Assemblée Générale Ordinaire au siège social sous la présidence de M. ${managerName}, en sa qualité de Gérant.
      
Il a été dressé une feuille de présence qui constate que l'intégralité des associés détenant 100% des parts sociales sont présents ou représentés.
      
Le président soumet à l'assemblée le rapport de gestion pour l'exercice clos le 31 décembre 2025.
Il en ressort un bénéfice comptable net d'impôts s'élevant à ${netProfit.toLocaleString('fr-FR')} TND.
      
PREMIÈRE RÉSOLUTION :
L'Assemblée Générale, après avoir entendu la lecture des rapports, approuve le bilan et le compte de résultat de l'exercice Clos.
      
DEUXIÈME RÉSOLUTION (Affectation du Résultat) :
L'Assemblée Générale décide d'affecter le bénéfice net de la manière suivante :
- Dotation à la réserve légale (5%) : ${(netProfit * 0.05).toLocaleString('fr-FR')} TND
- Distribution de dividendes aux associés : ${dividendAmount.toLocaleString('fr-FR')} TND
- Report à nouveau créditeur : ${(netProfit - dividendAmount - (netProfit * 0.05)).toLocaleString('fr-FR')} TND
      
Plus rien n'étant à l'ordre du jour, la séance est levée à douze heures, dont acte.
      
Signatures des associés :
1. M. ${shareholders[0]?.name || 'Associé 1'} ___________________
2. Mme. ${shareholders[1]?.name || 'Associé 2'} ___________________`;
      return { title, content };
    } else if (pvType === 'capital') {
      const title = `PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE`;
      const content = `L'an deux mille vingt-six, le ${new Date(pvDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
Les associés de la société ${companyName}, réunis en Assemblée Générale Extraordinaire sous la présidence de M. ${managerName}, ont délibéré de l'ordre du jour suivant :
Augmentation du capital social de la société.
      
RÉSOLUTION UNIQUE :
L'Assemblée Générale Extraordinaire décide d'augmenter le capital social de la société d'un montant de ${(newCapital - capitalAmount).toLocaleString('fr-FR')} TND pour le porter de ${capitalAmount.toLocaleString('fr-FR')} TND à ${newCapital.toLocaleString('fr-FR')} TND.
Cette augmentation est réalisée par la création de ${((newCapital - capitalAmount) / 10).toLocaleString('fr-FR')} parts nouvelles d'une valeur nominale de 10 TND chacune, intégralement souscrites et libérées en numéraire.
      
Les statuts de la société sont modifiés en conséquence.
      
Fait au siège social, sous la signature de l'ensemble des associés d'Elyssa ERP.`;
      return { title, content };
    } else {
      const title = `PV DU CONSEIL D'ADMINISTRATION : CHANGEMENT DE GÉRANCE`;
      const content = `L'an deux mille vingt-six, le ${new Date(pvDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
L'Assemblée Générale Ordinaire des associés de la société ${companyName} décide :
      
PREMIÈRE RÉSOLUTION :
L'Assemblée Générale prend acte de la démission de M. ${managerName} de ses fonctions de gérant de la société à compter de ce jour. Elle lui donne quitus entier et définitif pour sa gestion.
      
DEUXIÈME RÉSOLUTION :
L'Assemblée Générale nomme en qualité de nouveau Gérant de la société, pour une durée indéterminée, Mme. ${newManager}, qui accepte expressément ses fonctions. Elle disposera des pouvoirs les plus étendus pour agir au nom de la société en toutes circonstances.
      
Dépôt légal et formalités au guichet du Registre National des Entreprises (RNE) de Tunis seront exécutés sans délai.`;
      return { title, content };
    }
  };

  const currentPv = generatePvText();

  // Convention Generation Formulas
  const generateConventionText = (): { title: string; content: string } => {
    const title = `CONVENTION DE DOMICILIATION DE SIÈGE SOCIAL`;
    const content = `ENTRE LES SOUSSIGNÉS :
La société ${companyName}, SARL au capital de ${capitalAmount.toLocaleString('fr-FR')} TND, ayant son siège social domicilié à Tunis, représentée par M. ${managerName} en sa qualité de Gérant.
Ci-après désignée "Le Domiciliataire",
      
ET :
La société ${clientCompanyName || 'Société Cliente'}, en cours de constitution ou représentée par M. ${clientRepresentative || 'Représentant'}, agissant en qualité de Fondateur / Gérant.
Ci-après désignée "Le Domicilié",
      
IL A ÉTÉ CONVENU CE QUI SUIT :
      
ARTICLE 1 - OBJET :
Le Domiciliataire met à la disposition du Domicilié des locaux d'implantation pour y fixer le siège social de son entreprise et y recevoir sa correspondance administrative et commerciale.
      
ARTICLE 2 - DURÉE ET TARIFS :
La présente convention est conclue pour une durée ferme de ${domiciliationDuration} mois renouvelable par tacite reconduction.
La domiciliation est accordée moyennant une redevance mensuelle de ${domiciliationPrice} TND Hors Taxes, payée d'avance trimestriellement.
      
ARTICLE 3 - OBLIGATIONS :
Le Domicilié s'engage à informer le RNE de tout changement de sa forme juridique ou de son activité. Le Domiciliataire assurera la garde des plis recommandés reçus.
      
Fait en double exemplaire original à Tunis, le ${new Date().toLocaleDateString('fr-FR')}.
      
Signatures des deux parties (Précédées de la mention manuscrite "Lu et approuvé") :
Le Domiciliataire (Pour ${companyName})                 Le Domicilié (Pour ${clientCompanyName})`;
    return { title, content };
  };

  const currentConvention = generateConventionText();

  // Actions
  const handleOpenPrint = (title: string, content: string) => {
    setPrintTitle(title);
    setPrintContent(content);
    setIsPrintOpen(true);
  };

  const handleAddShareholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShareholderName || !newShareholderShares) return;
    const addedShares = parseInt(newShareholderShares);
    const nominal = 10;
    
    // Recalculate percentages
    const totalCurrentShares = shareholders.reduce((sum, s) => sum + s.shares, 0);
    const newTotalShares = totalCurrentShares + addedShares;

    const updated = [
      ...shareholders,
      {
        id: Date.now().toString(),
        name: newShareholderName,
        shares: addedShares,
        nominalValue: nominal,
        totalContribution: addedShares * nominal,
        percentage: 0
      }
    ].map(s => {
      const percentage = Math.round((s.shares / newTotalShares) * 100);
      return { ...s, percentage };
    });

    setShareholders(updated);
    setNewShareholderName('');
    setNewShareholderShares('');
  };

  // Upload simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setDocuments([
        {
          id: Date.now().toString(),
          title: file.name,
          category: 'Procès-Verbaux',
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        },
        ...documents
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans">
        <div>
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Scale className="w-3.5 h-3.5" /> Secrétariat Juridique & Formalités
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100">
            Gestion Juridique d'Entreprise
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
            Générez vos PV d'assemblées ordinaires et extraordinaires conformes aux régulations de l'État tunisien, éditez vos conventions de domiciliation et suivez les registres d'associés.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenPrint(currentPv.title, currentPv.content)}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition duration-150 shadow-md"
          >
            <Printer className="w-4 h-4" /> Imprimer le PV Actif
          </button>
        </div>
      </div>

      {/* QUICK STATUS INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associés Enregistrés</p>
            <p className="text-base font-black text-white">{shareholders.length}</p>
            <span className="text-[10px] text-slate-400">Total capital social : {formatTND(shareholders.reduce((sum, s) => sum + s.totalContribution, 0))}</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-rose-950/80 border border-rose-500/20 text-rose-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prochaines Échéances RNE</p>
            <p className="text-base font-black text-white">
              {deadlines.filter(d => d.status === 'Pending').length} Obligations
            </p>
            <span className="text-[10px] text-rose-400 font-bold">Dépôt annuel requis avant fin Juillet</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750/75 flex items-center gap-4">
          <div className="p-3 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-xl">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documents Sécurisés</p>
            <p className="text-base font-black text-white">{documents.length} Pièces</p>
            <span className="text-[10px] text-emerald-400">Archivage Coffre-Fort Crypté (AES)</span>
          </div>
        </div>
      </div>

      {/* MODULE WORKSPACE SUBTABS */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('pv')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'pv' 
              ? 'border-blue-500 text-blue-450 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Procès-Verbaux (PV)
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('conventions')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'conventions' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Conventions de Domiciliation
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('registres')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'registres' 
              ? 'border-emerald-500 text-emerald-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Registre d'Associés
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('echeances')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'echeances' 
              ? 'border-rose-500 text-rose-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Suivi Échéances & Alertes
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('archivage')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${
            activeSubTab === 'archivage' 
              ? 'border-amber-500 text-amber-400 bg-slate-850/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5" /> Coffre-fort & Archivage
          </div>
        </button>
      </div>

      {/* SUBTABS RENDERING */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md min-h-[400px]">
        {/* 1. PROCÈS-VERBAUX GENERATOR */}
        {activeSubTab === 'pv' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              {/* Form Side */}
              <div className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <p className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-700 pb-2">Modèle & Paramètres d'Assemblée</p>
                
                <div>
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Type de Procès-Verbal</label>
                  <select
                    value={pvType}
                    onChange={(e: any) => setPvType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  >
                    <option value="approbation">AGO - Approbation des Comptes & Dividendes</option>
                    <option value="capital">AGE - Augmentation de Capital Social</option>
                    <option value="gerant">AGO/AGE - Nomination d'un Nouveau Gérant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Date de Réunion de l'Assemblée</label>
                  <input
                    type="date"
                    value={pvDate}
                    onChange={(e) => setPvDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Nom du Gérant / Président d'Assemblée</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                {pvType === 'approbation' && (
                  <>
                    <div>
                      <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Bénéfice Comptable Net (TND)</label>
                      <input
                        type="number"
                        value={netProfit}
                        onChange={(e) => setNetProfit(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Dividendes à Distribuer (TND)</label>
                      <input
                        type="number"
                        value={dividendAmount}
                        onChange={(e) => setDividendAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </>
                )}

                {pvType === 'capital' && (
                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Nouveau Capital Social (TND)</label>
                    <input
                      type="number"
                      value={newCapital}
                      onChange={(e) => setNewCapital(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}

                {pvType === 'gerant' && (
                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Nom du Gérant Remplaçant</label>
                    <input
                      type="text"
                      value={newManager}
                      onChange={(e) => setNewManager(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Preview Side */}
              <div className="lg:col-span-2 bg-slate-850 p-6 rounded-xl border border-slate-750 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Prévisualisation Conforme du Document</span>
                  <button 
                    onClick={() => handleOpenPrint(currentPv.title, currentPv.content)}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-white"
                    title="Imprimer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white text-slate-850 p-6 rounded-xl shadow-inner border border-slate-300 h-[340px] overflow-y-auto whitespace-pre-wrap font-serif text-xs leading-relaxed text-left">
                  <div className="text-center font-bold uppercase border-b border-slate-200 pb-4 mb-4">
                    {currentPv.title}
                  </div>
                  {currentPv.content}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONVENTIONS DE DOMICILIATION */}
        {activeSubTab === 'conventions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              <div className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <p className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-700 pb-2">Paramètres de la Convention</p>
                
                <div>
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Société Cliente Domiciliée</label>
                  <input
                    type="text"
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Représentant de la société cliente</label>
                  <input
                    type="text"
                    value={clientRepresentative}
                    onChange={(e) => setClientRepresentative(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Durée (Mois)</label>
                    <select
                      value={domiciliationDuration}
                      onChange={(e) => setDomiciliationDuration(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                    >
                      <option value="6">6 Mois</option>
                      <option value="12">12 Mois (1 An)</option>
                      <option value="24">24 Mois (2 Ans)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Tarif Mensuel (TND HT)</label>
                    <input
                      type="number"
                      value={domiciliationPrice}
                      onChange={(e) => setDomiciliationPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-lg text-[10px] text-slate-400 leading-normal">
                  📌 Ce modèle de convention de domiciliation commerciale est conforme à l'Article 16 du Code de Commerce tunisien, requis pour l'enregistrement du siège social au bureau de la recette des finances.
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-850 p-6 rounded-xl border border-slate-750 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Contrat de Domiciliation Commerciale</span>
                  <button 
                    onClick={() => handleOpenPrint(currentConvention.title, currentConvention.content)}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-white"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white text-slate-850 p-6 rounded-xl shadow-inner border border-slate-300 h-[340px] overflow-y-auto whitespace-pre-wrap font-serif text-xs leading-relaxed text-left">
                  <div className="text-center font-bold uppercase border-b border-slate-200 pb-4 mb-4">
                    {currentConvention.title}
                  </div>
                  {currentConvention.content}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. REGISTRE LÉGAL D'ASSOCIÉS */}
        {activeSubTab === 'registres' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              {/* Register Overview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] uppercase font-black text-slate-400">Registre d'Émargement des Parts Sociales</span>
                  <span className="text-xs text-indigo-400 font-bold font-mono">Structure du capital social : 100%</span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-mono">
                    <thead className="bg-slate-850 text-[10px] uppercase font-black text-slate-400 font-sans">
                      <tr>
                        <th className="px-4 py-3">Associé</th>
                        <th className="px-4 py-3 text-right">Parts détenues</th>
                        <th className="px-4 py-3 text-right">Valeur Nominale</th>
                        <th className="px-4 py-3 text-right">Apport Total</th>
                        <th className="px-4 py-3 text-right">Quotité (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {shareholders.map(s => (
                        <tr key={s.id} className="hover:bg-slate-850/40">
                          <td className="px-4 py-3 font-sans font-extrabold text-white">{s.name}</td>
                          <td className="px-4 py-3 text-right font-bold">{s.shares}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatTND(s.nominalValue)}</td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-300">{formatTND(s.totalContribution)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-slate-800 px-2 py-0.5 border border-slate-700 text-[10.5px] text-white rounded-md font-bold">
                              {s.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Shareholder */}
              <div className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <p className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-700 pb-2">Enregistrer une cession / cessionnaire</p>
                
                <form onSubmit={handleAddShareholder} className="space-y-4">
                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Nom Complet de l'Associé</label>
                    <input
                      type="text"
                      required
                      value={newShareholderName}
                      onChange={(e) => setNewShareholderName(e.target.value)}
                      placeholder="ex: Ahmed Ben Mustapha"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-black uppercase text-slate-300 mb-1">Nombre de parts sociales souscrites</label>
                    <input
                      type="number"
                      required
                      value={newShareholderShares}
                      onChange={(e) => setNewShareholderShares(e.target.value)}
                      placeholder="ex: 150"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-650 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition duration-150 shadow"
                  >
                    Valider & Enregistrer au Registre →
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUIVI ÉCHÉANCES & ALERTES */}
        {activeSubTab === 'echeances' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 font-sans">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Chronogramme des Échéances Légales</h3>
                <p className="text-[11px] text-slate-400">Suivez et préparez les dates limites imposées par la législation fiscale et commerciale tunisienne.</p>
              </div>
              <button 
                onClick={() => setDeadlines([
                  ...deadlines,
                  { id: Date.now().toString(), title: 'Déclaration Fiscale Annuelle d\'Impôt (Impôt sur les Sociétés)', date: '2026-11-25', status: 'Pending', urgency: 'High' }
                ])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-white font-bold rounded-lg"
              >
                + Ajouter une Échéance
              </button>
            </div>

            <div className="space-y-3 font-sans">
              {deadlines.map(d => (
                <div key={d.id} className="bg-slate-850 p-4 rounded-xl border border-slate-750/70 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      d.urgency === 'High' 
                        ? 'bg-rose-950/80 border border-rose-500/20 text-rose-400' 
                        : d.urgency === 'Medium' 
                          ? 'bg-amber-950/80 border border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-950/80 border border-emerald-500/20 text-emerald-400'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{d.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date limite : {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10.5px]">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                      d.status === 'Completed' 
                        ? 'bg-emerald-950/60 border border-emerald-900/50 text-emerald-400' 
                        : 'bg-rose-950/60 border border-rose-900/50 text-rose-400 animate-pulse'
                    }`}>
                      {d.status === 'Completed' ? 'Exécuté' : 'À Faire'}
                    </span>
                    {d.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setDeadlines(deadlines.map(item => item.id === d.id ? { ...item, status: 'Completed' } : item));
                        }}
                        className="text-indigo-400 font-extrabold hover:text-indigo-300 transition"
                      >
                        Marquer comme Fait
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. COFFRE-FORT & ARCHIVAGE */}
        {activeSubTab === 'archivage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              {/* Drag and drop Area */}
              <div className="lg:col-span-1 space-y-4">
                <p className="text-[10.5px] uppercase font-black text-slate-400">Déposer des Actes Signés</p>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2 transition cursor-pointer h-[240px] ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-950/10 text-white' 
                      : 'border-slate-700 bg-slate-850/50 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <Upload className="w-10 h-10 text-slate-500" />
                  <p className="text-xs font-bold">Glissez-déposez le document signé ici</p>
                  <p className="text-[10px] text-slate-500">ou cliquez pour parcourir les fichiers (PDF, Word, Images max 10 Mo)</p>
                </div>
              </div>

              {/* Saved Documents */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10.5px] uppercase font-black text-slate-400">Documents Juridiques Archivés</span>
                  <span className="text-[10px] text-slate-500">Coffre-fort local crypté</span>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {documents.map(doc => (
                    <div key={doc.id} className="bg-slate-850 p-3 rounded-lg border border-slate-750 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 border border-slate-750 text-amber-500 rounded-lg">
                          <FolderLock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-slate-500">
                            <span>{doc.category}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                            <span>•</span>
                            <span className="font-mono">{doc.size}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setViewingDoc(doc)}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition" 
                          title="Visualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingDoc(doc)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition" 
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-850 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 border border-slate-750 text-amber-500 rounded-lg">
                  <FolderLock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Visualisation de l'Acte</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{viewingDoc.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Simulated PDF Sheet */}
            <div className="p-6 bg-slate-950 overflow-y-auto flex-1 flex justify-center">
              <div className="bg-white text-slate-900 w-full max-w-2xl p-8 rounded shadow-lg min-h-[500px] font-serif relative flex flex-col justify-between">
                {/* Official watermarks & stamp decoration */}
                <div className="absolute top-4 right-4 border border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded rotate-12">
                  ✓ CERTIFIÉ CONFORME
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.03] text-slate-900 text-6xl font-black uppercase tracking-widest rotate-45 text-center">
                  {companyName}<br />ELYSSA ERP
                </div>

                {/* Content */}
                <div>
                  {/* Letterhead */}
                  <div className="text-center pb-6 border-b border-slate-200 mb-6 font-sans">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{companyName}</h2>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">Secrétariat Juridique Elyssa ERP</p>
                    <p className="text-[8px] text-slate-400 mt-1">Généré et archivé le {viewingDoc.date} • Taille : {viewingDoc.size} • Catégorie : {viewingDoc.category}</p>
                  </div>

                  {/* Document Body Text */}
                  <div className="text-xs leading-relaxed text-justify whitespace-pre-wrap text-slate-800">
                    {viewingDoc.category === 'Statuts & Constitution' ? (
                      `STATUTS DE LA SOCIÉTÉ ${companyName.toUpperCase()}
                      
ARTICLE 1 : FORME JURIDIQUE
La Société est constituée sous la forme d'une Société à Responsabilité Limitée (SARL) conformément au Code des Sociétés Commerciales en Tunisie.

ARTICLE 2 : OBJET SOCIAL
La Société a pour objet principal : l'édition, l'intégration, le support et le déploiement du progiciel intégré de gestion Elyssa ERP, ainsi que toutes prestations connexes.

ARTICLE 3 : SIÈGE SOCIAL
Le siège social de la société est établi à Tunis, Tunisie, et enregistré sous l'Identifiant Unique au Registre National des Entreprises (RNE).

ARTICLE 4 : CAPITAL SOCIAL
Le capital social est fixé conformément aux résolutions de l'assemblée constitutive.`
                    ) : viewingDoc.category === 'Procès-Verbaux' ? (
                      `PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE DE ${companyName.toUpperCase()}
                      
L'Assemblée Générale Ordinaire Annuelle des associés se réunit pour délibérer de l'ordre du jour suivant :
1. Approbation des comptes de l'exercice écoulé.
2. Quitus au gérant de la société.
3. Affectation des résultats comptables et distribution éventuelle de dividendes.

RÉSOLUTION UNIQUE :
L'Assemblée Générale approuve à l'unanimité le bilan d'activité présenté et autorise la répartition du dividende de l'exercice conformément à la feuille de présence.`
                    ) : viewingDoc.category === 'Conventions' ? (
                      `CONVENTION RÉGLEMENTÉE DE DOMICILIATION COMMERCIALE
                      
Entre l'entreprise domiciliataire Elyssa ERP, et l'entité domiciliée signataire.
La présente convention a pour objet de fixer les conditions d'octroi de l'adresse de siège social, la gestion de la boîte postale, et les services d'archivage numérique des actes juridiques.

CONDITIONS FINANCIÈRES :
Redevance mensuelle forfaitaire facturée conformément au tarif général.`
                    ) : (
                      `EXTRAIT D'ACTE JURIDIQUE ENREGISTRÉ AU RNE
                      
Document de référence archivé dans le coffre-fort d'Elyssa ERP.
- Intitulé de l'acte : ${viewingDoc.title}
- Date d'archivage officiel : ${viewingDoc.date}
- Identifiant numérique de l'archive : ARCH-${viewingDoc.id}

Le présent document constitue une copie numérique conforme stockée de manière hautement sécurisée.`
                    )}
                  </div>
                </div>

                {/* Signature Block */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end font-sans">
                  <div>
                    <p className="text-[8px] text-slate-400">Signature Électronique</p>
                    <p className="text-[9px] font-mono text-emerald-600 font-bold">✓ SECURE-KEY-{viewingDoc.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-800">Le Gérant d'Elyssa ERP</p>
                    <div className="h-6 w-24 border-b border-dashed border-slate-300 mt-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-850 border-t border-slate-850 flex justify-between shrink-0">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Fermer
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleOpenPrint(viewingDoc.title, viewingDoc.category === 'Statuts & Constitution' ? `STATUTS DE LA SOCIÉTÉ ${companyName.toUpperCase()}\n\nARTICLE 1 : FORME JURIDIQUE\nLa Société est constituée sous la forme d'une Société à Responsabilité Limitée (SARL).\n\nARTICLE 2 : OBJET SOCIAL\nLa Société a pour objet principal l'édition d'Elyssa ERP.` : `ACTE JURIDIQUE ENREGISTRÉ AU RNE\n\nIntitulé: ${viewingDoc.title}\nDate d'archivage: ${viewingDoc.date}`);
                    setViewingDoc(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Imprimer officiel
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(viewingDoc.title)}`}
                  download={viewingDoc.title}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Télécharger
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Supprimer l'acte juridique ?</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le document <strong className="text-slate-200">"{deletingDoc.title}"</strong> de votre coffre-fort numérique ? Cette action est irréversible.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setDocuments(documents.filter(d => d.id !== deletingDoc.id));
                  setDeletingDoc(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-xs font-bold transition"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT DIALOG */}
      <IframePrintHelper
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        activeTab="juridique"
        documentName={printTitle}
      />
    </div>
  );
}
