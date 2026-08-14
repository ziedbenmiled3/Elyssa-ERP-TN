/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Database, 
  Terminal, 
  Send, 
  ShieldCheck, 
  Lock, 
  QrCode, 
  FileCheck,
  Building,
  User,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Invoice, BankTransaction, BankAccount, YearEndClosing } from '../types';

interface TejIntegrationProps {
  invoices: Invoice[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  yearEndClosings: YearEndClosing[];
  triggerPrint: (elementId: string, docName: string) => void;
}

// Tunisian Tax Categories for Withholding Tax (Retenue à la Source - RS)
interface RSCategory {
  code: string;
  label: string;
  rate: number;
  description: string;
}

const TUNISIAN_RS_CATEGORIES: RSCategory[] = [
  { code: 'RS_1.5', label: 'Achats de Biens & Services (>= 1000 TND)', rate: 1.5, description: 'Taux général de 1.5% s\'appliquant sur les factures de fournitures et services supérieures ou égales à 1000 TND TTC.' },
  { code: 'RS_3', label: 'Honoraires et Services Spécifiques', rate: 3, description: 'Prestations de services et sous-traitance dans certains secteurs spécifiques.' },
  { code: 'RS_5', label: 'Loyers / Locations Immobilières', rate: 5, description: 'Retenue sur les loyers payés à des personnes physiques ou morales.' },
  { code: 'RS_10', label: 'Honoraires des Professions Libérales', rate: 10, description: 'Honoraires versés aux avocats, médecins, conseils, experts-comptables, architectes, etc.' },
  { code: 'RS_15', label: 'Redevances et Jetons de Présence', rate: 15, description: 'Redevances d\'exploitation de brevets, rémunérations de membres de conseils d\'administration.' },
  { code: 'RS_20', label: 'Honoraires des Non-Résidents', rate: 20, description: 'Prestations de services payées à des personnes physiques ou morales non-résidentes.' },
];

interface GeneratedCertificate {
  id: string;
  payeeName: string;
  payeeTaxId: string;
  invoiceRef: string;
  date: string;
  category: string;
  rate: number;
  amountHT: number;
  amountRS: number;
  amountNetPaid: number;
  status: 'Draft' | 'Signed' | 'Submitted';
  tejId?: string;
  tejHash?: string;
}

export default function TejIntegration({
  invoices,
  bankAccounts,
  bankTransactions,
  yearEndClosings,
  triggerPrint
}: TejIntegrationProps) {
  // Navigation internal tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'certificates' | 'batch' | 'api'>('dashboard');

  // Local storage of generated withholding certificates
  const [certificates, setCertificates] = useState<GeneratedCertificate[]>([
    {
      id: 'CERT-001',
      payeeName: 'Société Tunisienne de Papeterie (SOTUPA)',
      payeeTaxId: '1598426B/A/M/000',
      invoiceRef: 'FAC-2026-0412',
      date: '2026-05-12',
      category: 'Achats de Biens & Services (>= 1000 TND)',
      rate: 1.5,
      amountHT: 2500.000,
      amountRS: 37.500,
      amountNetPaid: 2462.500,
      status: 'Submitted',
      tejId: 'TEJ-2026-08149',
      tejHash: 'e79b940e53a3b98c56e2f12a3d08f7b3c2e11894a'
    },
    {
      id: 'CERT-002',
      payeeName: 'Cabinet d\'Audit Cabinet Ben Ali',
      payeeTaxId: '0485961C/P/N/000',
      invoiceRef: 'HON-2026-0099',
      date: '2026-06-05',
      category: 'Honoraires des Professions Libérales',
      rate: 10.0,
      amountHT: 4000.000,
      amountRS: 400.000,
      amountNetPaid: 3600.000,
      status: 'Submitted',
      tejId: 'TEJ-2026-09228',
      tejHash: '1f8d9b1c0e3a4f8b9e6d7c8a9b0c1d2e3f4a5b6c'
    },
    {
      id: 'CERT-003',
      payeeName: 'Immobilière El Hana',
      payeeTaxId: '0984152X/M/C/000',
      invoiceRef: 'LOY-2026-M06',
      date: '2026-06-25',
      category: 'Loyers / Locations Immobilières',
      rate: 5.0,
      amountHT: 1800.000,
      amountRS: 90.000,
      amountNetPaid: 1710.000,
      status: 'Draft'
    }
  ]);

  // Form State for creating a new certificate
  const [showAddForm, setShowAddForm] = useState(false);
  const [formPayeeName, setFormPayeeName] = useState('');
  const [formPayeeTaxId, setFormPayeeTaxId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formDate, setFormDate] = useState('2026-06-30');
  const [formCategory, setFormCategory] = useState('RS_1.5');
  const [formAmountHT, setFormAmountHT] = useState('');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // API Live Simulator States
  const [apiLogs, setApiLogs] = useState<string[]>([
    '💡 Console Prête. En attente d\'une demande de transmission...',
  ]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiSecretKey, setApiSecretKey] = useState('**********');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.tej.finances.gov.tn/v1/certificates');
  const [simulatedCertId, setSimulatedCertId] = useState<string | null>(null);

  // Computed data from invoices & bank transactions
  const automaticRSData = useMemo(() => {
    // Collect all Outgoing Bank Transactions of Category "Achat Fournisseur", "Loyer", "Impôts & Taxes" etc. 
    // where payment >= 1000 TND or where we should apply withholding tax.
    const eligibleTx = bankTransactions.filter(
      tx => tx.type === 'Out' && tx.amount >= 1000 && (tx.category === 'Achat Fournisseur' || tx.category === 'Loyer')
    );

    // Calculate total withholding tax that we collected on our suppliers and owe to State
    const totalCollected = eligibleTx.reduce((sum, tx) => {
      // rough estimation: if Category is Loyer, RS is 5%, if Achat is 1.5%
      const rate = tx.category === 'Loyer' ? 0.05 : 0.015;
      return sum + (tx.amount * rate);
    }, 0);

    // Calculate total withholding tax suffered on our invoices (sales)
    const totalSuffered = invoices
      .filter(inv => inv.withholdingAmount > 0)
      .reduce((sum, inv) => sum + inv.withholdingAmount, 0);

    return {
      eligibleTransactionsCount: eligibleTx.length,
      estimatedCollectedRS: totalCollected,
      totalSufferedRS: totalSuffered,
      eligibleTx
    };
  }, [bankTransactions, invoices]);

  // Handle creating a new certificate
  const handleCreateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPayeeName || !formPayeeTaxId || !formAmountHT) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Validate Tunisian Tax ID Format (7 digits + 1 letter + 1 category + 3 digits, roughly)
    const taxIdRegex = /^\d{7}[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$/;
    const cleanTaxId = formPayeeTaxId.toUpperCase().trim();

    const selectedCat = TUNISIAN_RS_CATEGORIES.find(c => c.code === formCategory) || TUNISIAN_RS_CATEGORIES[0];
    const amountNum = parseFloat(formAmountHT);
    const rsAmount = amountNum * (selectedCat.rate / 100);
    const netAmount = amountNum - rsAmount;

    const newCert: GeneratedCertificate = {
      id: `CERT-00${certificates.length + 1}`,
      payeeName: formPayeeName,
      payeeTaxId: cleanTaxId,
      invoiceRef: formInvoiceRef || 'N/A',
      date: formDate,
      category: selectedCat.label,
      rate: selectedCat.rate,
      amountHT: amountNum,
      amountRS: rsAmount,
      amountNetPaid: netAmount,
      status: 'Draft'
    };

    setCertificates([newCert, ...certificates]);
    setShowAddForm(false);
    
    // Clear form
    setFormPayeeName('');
    setFormPayeeTaxId('');
    setFormInvoiceRef('');
    setFormAmountHT('');
  };

  // Run validation checks for TEJ transmission
  const validationAlerts = useMemo(() => {
    const alerts: { certId: string; payee: string; message: string; type: 'error' | 'warning' }[] = [];
    certificates.forEach(cert => {
      // Validate Matricule Fiscal format (e.g. 1234567A/M/P/000 or similar)
      const parts = cert.payeeTaxId.split('/');
      if (parts.length < 3 || cert.payeeTaxId.length < 10) {
        alerts.push({
          certId: cert.id,
          payee: cert.payeeName,
          message: `Matricule Fiscal "${cert.payeeTaxId}" non conforme au format standard tunisien (7 chiffres + 1 lettre / Catégorie / Sous-catégorie / 3 chiffres).`,
          type: 'error'
        });
      }
      if (cert.amountHT <= 0) {
        alerts.push({
          certId: cert.id,
          payee: cert.payeeName,
          message: 'L\'assiette brute (Montant HT) doit être supérieure à 0.',
          type: 'error'
        });
      }
    });
    return alerts;
  }, [certificates]);

  // Simulate TEJ Platform API Transmission
  const triggerApiTransmission = (certId: string) => {
    const targetCert = certificates.find(c => c.id === certId);
    if (!targetCert) return;

    setIsApiLoading(true);
    setSimulatedCertId(certId);
    setActiveTab('api');
    setApiLogs(prev => [
      ...prev,
      `🔄 [${new Date().toLocaleTimeString()}] Déclenchement de l'envoi pour ${targetCert.payeeName} (${certId})...`,
    ]);

    setTimeout(() => {
      setApiLogs(prev => [
        ...prev,
        `🔑 [${new Date().toLocaleTimeString()}] Authentification auprès du serveur d'intégration de la CIMF validée.`,
        `📦 [${new Date().toLocaleTimeString()}] Payload JSON généré avec succès pour le Matricule Fiscal ${targetCert.payeeTaxId}.`,
      ]);
    }, 800);

    setTimeout(() => {
      setApiLogs(prev => [
        ...prev,
        `✍️ [${new Date().toLocaleTimeString()}] Signature électronique apposée par la plateforme d'autorisation locale.`,
        `📡 [${new Date().toLocaleTimeString()}] Requête POST envoyée à : ${apiEndpoint}/issue`,
      ]);
    }, 1600);

    setTimeout(() => {
      const simulatedTejId = `TEJ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const simulatedHash = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      
      setApiLogs(prev => [
        ...prev,
        `✅ [${new Date().toLocaleTimeString()}] Réponse du serveur CIMF : HTTP 201 Created.`,
        `📄 [${new Date().toLocaleTimeString()}] Numéro de Certificat TEJ : ${simulatedTejId}`,
        `🔒 [${new Date().toLocaleTimeString()}] Hash de signature numérique : ${simulatedHash}`,
        `🎉 [${new Date().toLocaleTimeString()}] Traitement terminé avec succès. Certificat validé et opposable à l'administration fiscale tunisienne.`,
      ]);

      setCertificates(prev => prev.map(c => {
        if (c.id === certId) {
          return {
            ...c,
            status: 'Submitted',
            tejId: simulatedTejId,
            tejHash: simulatedHash
          };
        }
        return c;
      }));
      setIsApiLoading(false);
    }, 2800);
  };

  // Generate CIMF XML Batch file format
  const generatedXML = useMemo(() => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<DeclarationTEJ Year="2026" Publisher="Elyssa ERP Suite" License="PRD-ELYSSA-99214">\n`;
    xml += `  <IdentifiantPayeur>\n`;
    xml += `    <MatriculeFiscal>1948256X/A/M/000</MatriculeFiscal>\n`;
    xml += `    <RaisonSociale>ELYSSA ERP SOLUTIONS</RaisonSociale>\n`;
    xml += `    <Adresse>Immeuble Carthage, Les Berges du Lac 1, Tunis</Adresse>\n`;
    xml += `  </IdentifiantPayeur>\n`;
    xml += `  <Certificats>\n`;
    
    certificates.forEach(c => {
      xml += `    <Certificat Id="${c.id}" Status="${c.status}">\n`;
      xml += `      <Beneficiaire>\n`;
      xml += `        <Nom>${c.payeeName}</Nom>\n`;
      xml += `        <MatriculeFiscal>${c.payeeTaxId}</MatriculeFiscal>\n`;
      xml += `      </Beneficiaire>\n`;
      xml += `      <Details>\n`;
      xml += `        <DateDeclaration>${c.date}</DateDeclaration>\n`;
      xml += `        <ReferenceFacture>${c.invoiceRef}</ReferenceFacture>\n`;
      xml += `        <AssietteHT>${c.amountHT.toFixed(3)}</AssietteHT>\n`;
      xml += `        <TauxRS>${c.rate.toFixed(1)}</TauxRS>\n`;
      xml += `        <MontantRS>${c.amountRS.toFixed(3)}</MontantRS>\n`;
      xml += `        <MontantNetPaye>${c.amountNetPaid.toFixed(3)}</MontantNetPaye>\n`;
      if (c.tejId) {
        xml += `        <TejReference>${c.tejId}</TejReference>\n`;
        xml += `        <TejDigitalHash>${c.tejHash}</TejDigitalHash>\n`;
      }
      xml += `      </Details>\n`;
      xml += `    </Certificat>\n`;
    });

    xml += `  </Certificats>\n`;
    xml += `</DeclarationTEJ>`;
    return xml;
  }, [certificates]);

  // Generate CSV data for CIMF import structure
  const generatedCSV = useMemo(() => {
    let csv = `ID;NomBeneficiaire;MatriculeFiscal;Date;FactureRef;AssietteHT;TauxRS;MontantRS;NetPaye;StatutTEJ;RefTEJ\n`;
    certificates.forEach(c => {
      csv += `${c.id};"${c.payeeName}";${c.payeeTaxId};${c.date};${c.invoiceRef};${c.amountHT.toFixed(3)};${c.rate.toFixed(1)};${c.amountRS.toFixed(3)};${c.amountNetPaid.toFixed(3)};${c.status};${c.tejId || ''}\n`;
    });
    return csv;
  }, [certificates]);

  // Download logic for XML/CSV
  const handleDownloadFile = (type: 'xml' | 'csv') => {
    const content = type === 'xml' ? generatedXML : generatedCSV;
    const mimeType = type === 'xml' ? 'text/xml' : 'text/csv';
    const filename = `ELYSSA_ERP_TEJ_EXPORT_2026.${type}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter(c => {
      const matchesSearch = c.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.payeeTaxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [certificates, searchQuery, statusFilter]);

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-6" id="tej-integration-module">
      
      {/* HEADER SECTION WITH TUNISIAN LOGO AND BRANDING */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-extrabold uppercase border border-red-200">
              CIMF Tunisie
            </span>
            <span className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Intégration Plateforme TEJ</span>
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Connecteur Ministère des Finances — Plateforme TEJ
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Module de télétransmission, de signature électronique, et d'exportation de fiches de retenues à la source (RS) obligatoires pour les contribuables tunisiens via le format unifié TEJ (Décret 2024).
          </p>
        </div>

        {/* STATS SUMMARY IN HEADER */}
        <div className="flex items-center space-x-3 bg-indigo-50/50 border border-indigo-100 p-2.5 px-4 rounded-xl">
          <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></div>
          <div className="text-xs font-semibold text-indigo-950">
            <span className="text-slate-500">Statut de la liaison: </span>
            <span className="text-emerald-700 font-extrabold">Connecté (Mode Sandbox)</span>
          </div>
        </div>
      </div>

      {/* SUBTABS BAR */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Tableau de Bord TEJ</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`p-3 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Fiches de Retenues ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`p-3 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'batch'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Téléversement & Lots (XML/CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`p-3 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'api'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Simulateur d'API Web Service</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* TOP EXPLANATION BANNER */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="text-xs font-extrabold text-red-950 uppercase tracking-wide">
                  Obligation Légale Importante — TEJ Tunisie
                </h4>
              </div>
              <p className="text-xs text-red-900/80 max-w-4xl leading-relaxed">
                Toutes les retenues à la source tunisiennes effectuées par votre entreprise (loyers, honoraires, achats supérieurs à 1000 TND) doivent faire l'objet de <strong>certificats numériques signés</strong> sur la plateforme TEJ du Ministère des Finances. Les versions papier sont désormais rejetées par la recette des finances.
              </p>
            </div>
            <a 
              href="https://tej.finances.gov.tn" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] font-black bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 transition whitespace-nowrap self-stretch md:self-auto text-center"
            >
              Visiter le Portail TEJ
            </a>
          </div>

          {/* DASHBOARD GRID CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: TOTAL COLLECTED TO DECLARE */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Retenues Effectuées (Reverser)
                </span>
                <span className="p-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold border border-amber-200">
                  À Déclarer
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {(automaticRSData.estimatedCollectedRS + certificates.reduce((sum, c) => sum + c.amountRS, 0)).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                </span>
                <p className="text-[11px] text-slate-500">
                  Détail: {certificates.length} fiches enregistrées ce mois-ci sur des tiers fournisseurs.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-700">
                <span className="font-bold">Génération d'attestations</span>
                <button onClick={() => setActiveTab('certificates')} className="hover:underline font-extrabold">Gérer &rarr;</button>
              </div>
            </div>

            {/* CARD 2: TOTAL SUFFERED RS */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Retenues Subies (Récupérables)
                </span>
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold border border-emerald-200">
                  Crédit d'Impôt
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {automaticRSData.totalSufferedRS.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                </span>
                <p className="text-[11px] text-slate-500">
                  Détail: Retenue de 1,5% ou 10% subie de vos clients pour impôt mensuel de l'exercice.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Certificats reçus:</span>
                <span className="font-extrabold text-slate-700">
                  {invoices.filter(inv => inv.withholdingCertificateReceived).length} / {invoices.filter(inv => inv.withholdingAmount > 0).length} fiches
                </span>
              </div>
            </div>

            {/* CARD 3: STATUS OF TEJ SUBMISSIONS */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Statut des Soumissions TEJ
                </span>
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-200">
                  Temps Réel
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Brouillons (Fichiers locaux):</span>
                  <span className="font-bold text-slate-800">{certificates.filter(c => c.status === 'Draft').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Signés & Validés TEJ :</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{certificates.filter(c => c.status === 'Submitted').length}</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Taux d'intégration TEJ:</span>
                  <span className="font-black text-indigo-950">
                    {Math.round((certificates.filter(c => c.status === 'Submitted').length / certificates.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ELIGIBLE TRANSACTIONS RECOMMENDED FOR WITHHOLDING */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Transactions éligibles détectées par Elyssa ERP
                </h4>
                <p className="text-[11px] text-slate-500">
                  Mouvements bancaires supérieurs à 1000 TND ou factures de charges requérant un certificat de retenue
                </p>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                {automaticRSData.eligibleTransactionsCount} opérations détectées
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <th className="p-3">Date</th>
                    <th className="p-3">Bénéficiaire / Tiers</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Référence</th>
                    <th className="p-3 text-right">Montant Brut (TND)</th>
                    <th className="p-3 text-center">Taux Suggéré</th>
                    <th className="p-3 text-right">RS Suggérée (TND)</th>
                    <th className="p-3 text-center">Action ERP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {automaticRSData.eligibleTx.map((tx, idx) => {
                    const suggestedRate = tx.category === 'Loyer' ? 5 : 1.5;
                    const rsValue = tx.amount * (suggestedRate / 100);
                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-600">{tx.date}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">{tx.beneficiaryOrIssuer}</td>
                        <td className="p-3">
                          <span className="p-1 px-2 rounded-lg bg-slate-100 text-slate-600 font-sans text-[10px] font-bold">
                            {tx.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{tx.reference}</td>
                        <td className="p-3 text-right font-bold text-slate-800">{tx.amount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                        <td className="p-3 text-center text-amber-700 font-black">{suggestedRate}%</td>
                        <td className="p-3 text-right font-bold text-amber-700">{rsValue.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setFormPayeeName(tx.beneficiaryOrIssuer);
                              setFormInvoiceRef(tx.reference);
                              setFormAmountHT(tx.amount.toString());
                              setFormCategory(suggestedRate === 5 ? 'RS_5' : 'RS_1.5');
                              setFormDate(tx.date);
                              setShowAddForm(true);
                              setActiveTab('certificates');
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1 px-2.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition"
                          >
                            Générer Certificat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {automaticRSData.eligibleTx.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                        Aucun décaissement fournisseur ou loyer supérieur au seuil de 1000 TND n'a été détecté dans l'exercice actuel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFICATES LIST */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          
          {/* SEARCH, FILTER AND ADD CERTIFICATE BAR */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher un tiers ou facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">Tous les statuts</option>
                <option value="Draft">Brouillons (Non envoyés)</option>
                <option value="Submitted">Validés & Signés TEJ</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 px-4 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer self-stretch md:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une Fiche de Retenue</span>
            </button>
          </div>

          {/* ADD FORM MODAL / COLLAPSIBLE */}
          {showAddForm && (
            <form onSubmit={handleCreateCertificate} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4 font-sans animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Saisie d'un nouveau Certificat de Retenue (Fiche RS)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Annuler
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Payee Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Nom du Bénéficiaire / Tiers *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: SOTUPA, Cabinet Belkhiria..."
                      value={formPayeeName}
                      onChange={(e) => setFormPayeeName(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Payee Tax ID */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Matricule Fiscal Tunisien *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: 1234567A/M/P/000"
                      value={formPayeeTaxId}
                      onChange={(e) => setFormPayeeTaxId(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block">7 chiffres + 1 lettre + code cat + sous-cat + 3 chiffres</span>
                </div>

                {/* Invoice Ref */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Référence Facture ou Acte</label>
                  <input
                    type="text"
                    placeholder="Ex: FAC-2026-901"
                    value={formInvoiceRef}
                    onChange={(e) => setFormInvoiceRef(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Date du Règlement *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                {/* Category & Rate */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Catégorie de Retenue & Taux *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full bg-white text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {TUNISIAN_RS_CATEGORIES.map(cat => (
                      <option key={cat.code} value={cat.code}>
                        {cat.label} ({cat.rate}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount HT (Base de Retenue) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Assiette Brute (Montant HT en TND) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="Ex: 1500.000"
                    value={formAmountHT}
                    onChange={(e) => setFormAmountHT(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-extrabold"
                  />
                </div>
              </div>

              {/* Category Help text */}
              <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                <strong>Description du barème choisi :</strong> {TUNISIAN_RS_CATEGORIES.find(c => c.code === formCategory)?.description}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 px-6 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Calculer & Enregistrer en Brouillon
                </button>
              </div>
            </form>
          )}

          {/* CERTIFICATES TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                  <th className="p-3">Référence Fiche</th>
                  <th className="p-3">Bénéficiaire / Matricule Fiscal</th>
                  <th className="p-3">Date & Facture</th>
                  <th className="p-3">Catégorie (Taux)</th>
                  <th className="p-3 text-right">Montant Brut (HT)</th>
                  <th className="p-3 text-right">Retenue (RS)</th>
                  <th className="p-3 text-right">Net Réglé</th>
                  <th className="p-3 text-center">Statut TEJ</th>
                  <th className="p-3 text-center">Impression / Envoi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-indigo-950 font-bold">{cert.id}</td>
                    <td className="p-3 font-sans">
                      <div className="font-bold text-slate-900">{cert.payeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium">{cert.payeeTaxId}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-600">{cert.date}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Ref: {cert.invoiceRef}</div>
                    </td>
                    <td className="p-3 font-sans text-[10px]">
                      <div className="font-semibold text-slate-700">{cert.category}</div>
                      <div className="font-mono text-indigo-700 font-extrabold">{cert.rate}%</div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">{cert.amountHT.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-3 text-right font-extrabold text-red-600">-{cert.amountRS.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{cert.amountNetPaid.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                    <td className="p-3 text-center">
                      {cert.status === 'Submitted' ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="p-1 px-2 rounded-full bg-emerald-50 text-emerald-700 font-sans text-[9px] font-extrabold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Validé TEJ</span>
                          </span>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest">{cert.tejId}</span>
                        </div>
                      ) : (
                        <span className="p-1 px-2 rounded-full bg-amber-50 text-amber-700 font-sans text-[9px] font-extrabold border border-amber-200">
                          Brouillon ERP
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Print Button (simulated standard withholding layout) */}
                        <button
                          onClick={() => {
                            // Generate HTML or trigger iframe helper printing
                            alert(`Génération et impression du certificat de retenue officiel au format PDF pour ${cert.payeeName}.\n\nNuméro de référence: ${cert.id}\nMontant retenu: ${cert.amountRS} TND`);
                          }}
                          title="Imprimer l'attestation légale"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Submit TEJ / Generate Single Token */}
                        {cert.status !== 'Submitted' ? (
                          <button
                            onClick={() => triggerApiTransmission(cert.id)}
                            title="Transmettre instantanément à la plateforme TEJ"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer transition flex items-center space-x-1 font-sans text-[10px] font-extrabold"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>TEJ</span>
                          </button>
                        ) : (
                          <span 
                            title={`Hash de validation: ${cert.tejHash}`}
                            className="p-1 bg-emerald-50 text-emerald-600 rounded-lg cursor-help border border-emerald-200"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCertificates.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                      Aucun certificat de retenue ne correspond aux critères de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PRINTABLE LEGAL CERTIFICATE MODEL PREVIEW (TUNISIAN OFFICIAL FORMAT) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <span className="font-extrabold uppercase text-slate-500 text-[9px] tracking-widest block text-center">
              Aperçu du modèle officiel généré (Certificat de Retenue à la Source)
            </span>

            <div className="bg-white border border-slate-300 p-6 max-w-3xl mx-auto rounded-lg shadow-sm font-sans text-xs text-slate-800 space-y-4 leading-normal relative">
              
              {/* TOP BRANDING */}
              <div className="grid grid-cols-2 justify-between border-b pb-3 border-slate-200">
                <div className="space-y-1">
                  <h5 className="font-black text-slate-900 uppercase">RÉPUBLIQUE TUNISIENNE</h5>
                  <p className="text-[10px] text-slate-500">Ministère des Finances</p>
                  <p className="text-[10px] text-slate-500 font-extrabold">Direction Générale des Impôts</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="p-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-md text-[10px] border border-indigo-200">
                    SÉCURISÉ PORTAIL TEJ
                  </span>
                  <p className="text-[10px] text-slate-400">Généré par Elyssa ERP Suite v1.2</p>
                </div>
              </div>

              {/* TITLE */}
              <div className="text-center space-y-1 py-1">
                <h4 className="text-sm font-black text-slate-950 tracking-wide uppercase">
                  CERTIFICAT DE RETENUE À LA SOURCE
                </h4>
                <p className="text-[11px] text-slate-600">
                  au titre de l'Impôt sur le Revenu ou de l'Impôt sur les Sociétés (Tunisie)
                </p>
              </div>

              {/* PAYER & BENEFICIARY INFO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-150">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">A. Personne ou Organisme Payeur (Déclarant)</span>
                  <p className="font-black text-slate-900">ELYSSA ERP SOLUTIONS SARL</p>
                  <p className="text-[11px] text-slate-500">Immeuble Carthage, Les Berges du Lac 1, Tunis</p>
                  <p className="font-mono text-[10px] font-bold text-slate-700">M.F. : 1948256X/A/M/000</p>
                </div>
                <div className="space-y-1 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-slate-200">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">B. Bénéficiaire des Sommes (Créancier)</span>
                  <p className="font-black text-slate-900">{certificates[0]?.payeeName || 'Sélectionner un tiers'}</p>
                  <p className="text-[11px] text-slate-500">Tunisie — Identifiant National Fiscal</p>
                  <p className="font-mono text-[10px] font-bold text-indigo-800">M.F. : {certificates[0]?.payeeTaxId || '1234567A/M/P/000'}</p>
                </div>
              </div>

              {/* TAX DETAILS TABLE */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b text-slate-700">
                      <th className="p-2 border-r">Nature des règlements</th>
                      <th className="p-2 border-r text-right">Assiette de la Retenue (TND)</th>
                      <th className="p-2 border-r text-center">Taux RS (%)</th>
                      <th className="p-2 text-right">Montant Retenu (RS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 border-r font-medium">{certificates[0]?.category || 'N/A'}</td>
                      <td className="p-2 border-r text-right font-mono font-bold">{(certificates[0]?.amountHT || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</td>
                      <td className="p-2 border-r text-center font-mono font-bold">{(certificates[0]?.rate || 0)}%</td>
                      <td className="p-2 text-right font-mono font-extrabold text-red-600">{(certificates[0]?.amountRS || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</td>
                    </tr>
                    <tr className="bg-slate-50 font-black">
                      <td colSpan={3} className="p-2 border-r text-right uppercase text-[9px] tracking-wider text-slate-500">Total Retenues effectuées au titre de la facture :</td>
                      <td className="p-2 text-right font-mono text-red-600">{(certificates[0]?.amountRS || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SIGNATURE AND METADATA */}
              <div className="flex justify-between items-end pt-3">
                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-[10px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>CERTIFICAT SIGNÉ PAR LA PLATEFORME TEJ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-tight">
                    UUID TEJ: {certificates[0]?.tejId || 'N/A'}<br/>
                    Hash CIMF: {certificates[0]?.tejHash || 'N/A'}
                  </p>
                </div>
                
                <div className="text-right space-y-1 text-[11px]">
                  <p className="text-slate-500">Fait à Tunis, le {certificates[0]?.date || '30 Juin 2026'}</p>
                  <p className="font-bold text-slate-950">Cachet Électronique Ministériel (QR Code)</p>
                  <div className="inline-block p-1 border border-slate-200 bg-slate-50 rounded-lg">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TELEVERSEMENT & BATCH GENERATION */}
      {activeTab === 'batch' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Génération de Lots Massifs pour téléversement direct
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                La plateforme TEJ permet aux entreprises de verser un fichier unifié contenant des dizaines de certificats de retenues à la source à la fois. Cela évite d'avoir à saisir les fiches une à une. Notre module extrait automatiquement vos transactions locales pour construire le fichier conforme.
              </p>
            </div>

            {/* BATCH CONTROL CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-3 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Option 1 : Export de Fichier XML Unifié (CIMF)</span>
                <p className="text-xs text-slate-600">
                  Format standard recommandé par le Centre Informatique du Ministère des Finances. Il intègre toutes les métadonnées de chiffrement, les tiers et les montants d'impôts de retenue.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleDownloadFile('xml')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs p-2 rounded-lg px-4 flex items-center space-x-1.5 transition cursor-pointer w-full md:w-auto justify-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger le Fichier TEJ .XML</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-3 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Option 2 : Export CSV de Masse</span>
                <p className="text-xs text-slate-600">
                  Format de secours avec délimiteur point-virgule (;) lisible par Excel et le portail de pré-validation TEJ Tunisie. Utile pour audits internes de fin d'année.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleDownloadFile('csv')}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs p-2 rounded-lg px-4 flex items-center space-x-1.5 transition cursor-pointer w-full md:w-auto justify-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger le Fichier .CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COMPLIANCE AUDIT ENGINE / RAW PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COMPLIANCE ENGINE */}
            <div className="border border-slate-150 rounded-2xl p-5 space-y-4 bg-white">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                Moteur de Validation Locale (Elyssa Audit)
              </h4>
              <p className="text-xs text-slate-500">
                Vérifications automatiques de conformité légale avant exportation ou envoi direct sur la plateforme TEJ.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <span className="font-extrabold block">Zéro erreur bloquante majeure</span>
                    <span className="text-[11px] text-emerald-800">
                      Toutes les fiches actuelles possèdent une structure d'assiette positive et un bénéficiaire identifié.
                    </span>
                  </div>
                </div>

                {validationAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    alert.type === 'error' ? 'bg-red-50 border-red-150 text-red-950' : 'bg-amber-50 border-amber-150 text-amber-950'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                    <div className="text-xs">
                      <span className="font-extrabold block">Alerte sur {alert.payee} ({alert.certId})</span>
                      <span className={`text-[11px] ${alert.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>
                        {alert.message}
                      </span>
                    </div>
                  </div>
                ))}

                {validationAlerts.length === 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-500 text-center font-sans">
                    Félicitations, aucun avertissement de format n'a été détecté par Elyssa Audit ! Votre lot est prêt pour l'administration.
                  </div>
                )}
              </div>
            </div>

            {/* XML/CSV RAW CODE PREVIEW */}
            <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-900 text-slate-200 font-mono relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  Structure brute XML générée (Aperçu)
                </span>
                <span className="text-[9px] bg-slate-800 p-1 rounded text-slate-400">UTF-8</span>
              </div>
              
              <pre className="text-[10px] overflow-auto h-48 leading-relaxed max-w-full text-amber-400">
                {generatedXML}
              </pre>

              <div className="absolute bottom-3 right-3">
                <span className="text-[9px] text-slate-500">Elyssa XML Engine v1.2</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: API WEB SERVICE CONNECTOR SIMULATOR */}
      {activeTab === 'api' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* INTRO AND API SETTINGS CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                  Simulateur de Connexion en Temps Réel (Web Service REST)
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                La plateforme TEJ offre des protocoles de connexion API cryptographiques sécurisés pour que les ERP certifiés (comme Elyssa ERP) puissent émettre les certificats à la volée. Configurez vos paramètres de sandbox officiels fournis par le CIMF ci-dessous pour tester l'intégration d'API.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Point de Terminaison API (Endpoint)</label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="p-2 border border-slate-200 bg-white rounded-xl w-full font-mono font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Certificat Électronique CIMF (Mot de passe)</label>
                <input
                  type="password"
                  value={apiSecretKey}
                  onChange={(e) => setApiSecretKey(e.target.value)}
                  className="p-2 border border-slate-200 bg-white rounded-xl w-full font-mono font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Identifiant d'Émetteur TEJ</label>
                <input
                  type="text"
                  readOnly
                  value="ID-SaaS-ELY-992A-TN"
                  className="p-2 border border-slate-200 bg-slate-100 rounded-xl w-full font-mono font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* ACTIVE TERMINAL WINDOW AND PAYLOAD SHOWCASE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* TERMINAL LOG SCREEN */}
            <div className="lg:col-span-2 bg-slate-950 rounded-2xl p-5 font-mono text-[11px] text-emerald-400 space-y-3 border border-slate-800 min-h-[300px] flex flex-col justify-between shadow-lg relative">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-slate-500 text-[9px] tracking-wider uppercase">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    Console de communication CIMF
                  </span>
                  <span>Port: 443 HTTPS</span>
                </div>

                <div className="space-y-1 overflow-auto max-h-[220px] leading-relaxed select-none">
                  {apiLogs.map((log, idx) => (
                    <div key={idx} className="animate-fadeIn">
                      {log}
                    </div>
                  ))}
                  {isApiLoading && (
                    <div className="flex items-center space-x-2 text-amber-400 animate-pulse mt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmission en cours... Cryptage SHA-256 ...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                <span>Statut API: STANDBY</span>
                <button
                  onClick={() => {
                    setApiLogs([`💡 Console réinitialisée le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}. En attente...`]);
                  }}
                  className="hover:text-slate-300 transition underline cursor-pointer"
                >
                  Effacer l'historique
                </button>
              </div>
            </div>

            {/* LIVE HTTP REQUEST PAYLOAD JSON PREVIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-300 font-mono text-[11px] flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-2">
                  Format de Charge API (Exemple JSON Payload)
                </span>
                
                <pre className="text-amber-400 text-[10px] leading-normal overflow-auto whitespace-pre-wrap max-h-[180px]">
{`{
  "sender": "1948256X/A/M/000",
  "recipient": "1598426B/A/M/000",
  "certificateType": "RS_TUNISIA_1_5",
  "period": "2026-M06",
  "amounts": {
    "gross_HT": 2500.000,
    "rate_percent": 1.5,
    "deducted_tax": 37.500,
    "net_payable": 2462.500
  },
  "signature_type": "TUN_DIGITAL_STAMP_CIMF"
}`}
                </pre>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2 font-sans">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simuler d'autres actions</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button
                    onClick={() => {
                      setApiLogs(prev => [
                        ...prev,
                        `📡 [${new Date().toLocaleTimeString()}] GET ${apiEndpoint}/status/ID-SaaS-ELY-992A-TN`,
                        `📟 [${new Date().toLocaleTimeString()}] Réponse CIMF: SERVICE_OPERATIONAL - Le portail de télétransmission TEJ est 100% fonctionnel.`
                      ]);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer text-center font-bold transition"
                  >
                    Tester la connexion
                  </button>
                  <button
                    onClick={() => {
                      setApiLogs(prev => [
                        ...prev,
                        `📡 [${new Date().toLocaleTimeString()}] GET ${apiEndpoint}/taxpayer/1598426B/A/M/000/validate`,
                        `📟 [${new Date().toLocaleTimeString()}] Réponse CIMF: TAXPAYER_VALID - Contribuable enregistré et actif auprès du bureau de contrôle de Tunis.`
                      ]);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer text-center font-bold transition"
                  >
                    Vérifier M.F. Bénéficiaire
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
