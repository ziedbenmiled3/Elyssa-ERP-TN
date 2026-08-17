import React, { useState, useMemo, useEffect } from 'react';
import { ImportFolder, ImportFolderItem, LCRequest, ManufacturingOrder, BankAccount, BankTransaction } from '../types';
import { ElyssaLogo } from './ElyssaLogo';
import { 
  Globe, 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Ship, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Search, 
  Calculator, 
  FileCheck, 
  Anchor, 
  Scale, 
  Info,
  ChevronDown,
  Percent,
  Package,
  Building,
  FileSignature,
  Receipt,
  Award,
  Sliders,
  Printer,
  Cog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import IframePrintHelper from './IframePrintHelper';

export default function TransitLogistiqueManager({ 
  standaloneMode = 'full',
  isSimulationActive = false,
  folders: propFolders,
  onUpdateFolders,
  lcRequests: propLcRequests,
  onUpdateLcRequests,
  manufacturingOrders = [],
  bankAccounts = [],
  onUpdateBankAccounts,
  bankTransactions = [],
  onUpdateBankTransactions
}: { 
  standaloneMode?: 'full' | 'lc_only';
  isSimulationActive?: boolean;
  folders?: ImportFolder[];
  onUpdateFolders?: (f: ImportFolder[]) => void;
  lcRequests?: LCRequest[];
  onUpdateLcRequests?: (l: LCRequest[]) => void;
  manufacturingOrders?: ManufacturingOrder[];
  bankAccounts?: BankAccount[];
  onUpdateBankAccounts?: (accs: BankAccount[]) => void;
  bankTransactions?: BankTransaction[];
  onUpdateBankTransactions?: (txs: BankTransaction[]) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'folders' | 'incoterms' | 'landed_cost' | 'customs' | 'lc_manager' | 'settings'>(
    standaloneMode === 'lc_only' ? 'lc_manager' : 'folders'
  );

  // Configurable transit states
  const [portsList, setPortsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('carthage_transit_ports');
    return saved ? JSON.parse(saved) : ['Radès', 'Sfax', 'Enfidha', 'Tunis-Carthage', 'Gabès Port'];
  });
  const [transittersList, setTransittersList] = useState<string[]>(() => {
    const saved = localStorage.getItem('carthage_transit_transitters');
    return saved ? JSON.parse(saved) : [
      'Société Tunisienne de Transit & Logistique (STTL)',
      'Sfax Douane Services',
      'Nord Sud Transitaire Tunis',
      'Carthage Logistique & Transit'
    ];
  });
  const [usdToTndRate, setUsdToTndRate] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_transit_rate_usd');
    return saved ? Number(saved) : 3.12; // 1 USD = 3.12 TND
  });
  const [eurToTndRate, setEurToTndRate] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_transit_rate_eur');
    return saved ? Number(saved) : 3.42; // 1 EUR = 3.42 TND
  });
  const [defaultFreightFee, setDefaultFreightFee] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_transit_default_freight');
    return saved ? Number(saved) : 4500; // Average sea freight cost in TND
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const updatePortsList = (list: string[]) => {
    setPortsList(list);
    localStorage.setItem('carthage_transit_ports', JSON.stringify(list));
  };
  const updateTransittersList = (list: string[]) => {
    setTransittersList(list);
    localStorage.setItem('carthage_transit_transitters', JSON.stringify(list));
  };
  const updateUsdToTndRate = (rate: number) => {
    setUsdToTndRate(rate);
    localStorage.setItem('carthage_transit_rate_usd', String(rate));
  };
  const updateEurToTndRate = (rate: number) => {
    setEurToTndRate(rate);
    localStorage.setItem('carthage_transit_rate_eur', String(rate));
  };
  const updateDefaultFreightFee = (fee: number) => {
    setDefaultFreightFee(fee);
    localStorage.setItem('carthage_transit_default_freight', String(fee));
  };

  const handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (printContent) {
      // Remove any existing temp-print-root
      const oldRoot = document.getElementById('temp-print-root');
      if (oldRoot) oldRoot.remove();

      const clone = printContent.cloneNode(true) as HTMLElement;
      clone.id = 'temp-print-root';
      clone.className = 'temp-print-root ' + (printContent.className || '').replace(/\bhidden\b/g, '');
      
      document.body.classList.add('print-mode-active');
      document.body.appendChild(clone);
      
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error(e);
        }
        
        setTimeout(() => {
          document.body.classList.remove('print-mode-active');
          const tempElement = document.getElementById('temp-print-root');
          if (tempElement) {
            try {
              tempElement.remove();
            } catch (err) {
              console.error('Cleanup print element failed:', err);
            }
          }
        }, 1000);
      }, 500);
    } else {
      window.print();
    }
  };
  
  const folders = propFolders || [];
  const setFolders = (newFoldersOrUpdater: ImportFolder[] | ((prev: ImportFolder[]) => ImportFolder[])) => {
    if (onUpdateFolders) {
      if (typeof newFoldersOrUpdater === 'function') {
        onUpdateFolders(newFoldersOrUpdater(folders));
      } else {
        onUpdateFolders(newFoldersOrUpdater);
      }
    }
  };

  const saveFolders = (updated: ImportFolder[]) => {
    setFolders(updated);
  };

  // Searching & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [folderTypeFilter, setFolderTypeFilter] = useState<'All' | 'Import' | 'Export'>('All');

  // Selected folder for detail views / modification / landed cost calc
  const [selectedFolderId, setSelectedFolderId] = useState<string>('demo-imp_1');

  // Modal / Input State for creating a folder
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderType, setNewFolderType] = useState<'Import' | 'Export'>('Import');
  const [newFolderRef, setNewFolderRef] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newIncoterm, setNewIncoterm] = useState<'FOB' | 'CIF' | 'EXW' | 'CFR' | 'DDP'>('FOB');
  const [newPort, setNewPort] = useState<string>('Radès');
  const [newTransitter, setNewTransitter] = useState<string>('');
  const [newCurrency, setNewCurrency] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [newExchangeRate, setNewExchangeRate] = useState<number>(3.42);

  // Sync exchange rate with settings configuration
  useEffect(() => {
    if (newCurrency === 'USD') {
      setNewExchangeRate(usdToTndRate);
    } else if (newCurrency === 'EUR') {
      setNewExchangeRate(eurToTndRate);
    }
  }, [newCurrency, usdToTndRate, eurToTndRate]);

  // Sync default form port & transitter with configuration lists
  useEffect(() => {
    if (showCreateModal) {
      if (portsList.length > 0) setNewPort(portsList[0]);
      if (transittersList.length > 0) setNewTransitter(transittersList[0]);
    }
  }, [showCreateModal, portsList, transittersList]);

  const [newItems, setNewItems] = useState<ImportFolderItem[]>([]);
  
  // Temporary item fields
  const [tempItemName, setTempItemName] = useState('');
  const [tempItemQty, setTempItemQty] = useState<number>(100);
  const [tempItemFobPrice, setTempItemFobPrice] = useState<number>(10);
  const [tempItemCustomsRate, setTempItemCustomsRate] = useState<number>(15);
  const [tempItemVatRate, setTempItemVatRate] = useState<number>(19);

  // Landed Cost Simulation temporary states
  const [allocationMethod, setAllocationMethod] = useState<'value' | 'weight' | 'quantity'>('value');

  const lcRequests = propLcRequests || [];
  const setLcRequests = (newLcOrUpdater: LCRequest[] | ((prev: LCRequest[]) => LCRequest[])) => {
    if (onUpdateLcRequests) {
      if (typeof newLcOrUpdater === 'function') {
        onUpdateLcRequests(newLcOrUpdater(lcRequests));
      } else {
        onUpdateLcRequests(newLcOrUpdater);
      }
    }
  };

  const saveLcRequests = (updated: LCRequest[]) => {
    setLcRequests(updated);
  };

  useEffect(() => {
    // Auto-seeding on empty disabled per user directive
    if (false && isSimulationActive) {
      const hasDemoFolders = folders.some(f => f.id.startsWith('demo-'));
      if (!hasDemoFolders) {
        setFolders(prev => {
          const hasDemo = prev.some(f => f.id.startsWith('demo-'));
          if (!hasDemo) {
            const demoFolders: ImportFolder[] = [
              {
                id: 'demo-imp_1',
                reference: 'IMP-2026-001 (Démo)',
                folderType: 'Import',
                supplierName: 'Marseille Chimie SAS',
                originCountry: 'France',
                incoterm: 'FOB',
                portOfArrival: 'Radès',
                transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
                status: 'Customs',
                creationDate: '2026-06-01',
                estimatedArrivalDate: '2026-06-30',
                currency: 'EUR',
                exchangeRate: 3.42, // 1 EUR = 3.42 TND
                items: [
                  { id: 'demo-item_1', productName: 'Solvant Éco Purifié', quantity: 1500, fobUnitPrice: 4.5, foreignCurrencyRate: 3.42, customsDutyRate: 15, vatRate: 19 },
                  { id: 'demo-item_2', productName: 'Additif Stabilisateur X20', quantity: 800, fobUnitPrice: 12.0, foreignCurrencyRate: 3.42, customsDutyRate: 10, vatRate: 19 }
                ],
                freightCostTND: 4200,
                customsDutiesTND: 8150,
                transitterFeesTND: 1200,
                handlingFeesTND: 850, // Port de Radès acconage
                insuranceCostTND: 650,
                otherFeesTND: 300
              },
              {
                id: 'demo-imp_2',
                reference: 'IMP-2026-002 (Démo)',
                folderType: 'Import',
                supplierName: 'Genoa Industrial Valves',
                originCountry: 'Italie',
                incoterm: 'CIF',
                portOfArrival: 'Sfax',
                transitterName: 'Sfax Douane Services',
                status: 'Transit',
                creationDate: '2026-06-15',
                estimatedArrivalDate: '2026-07-05',
                currency: 'EUR',
                exchangeRate: 3.42,
                items: [
                  { id: 'demo-item_3', productName: 'Vanne Haute Pression V3', quantity: 120, fobUnitPrice: 85.0, foreignCurrencyRate: 3.42, customsDutyRate: 20, vatRate: 19 },
                  { id: 'demo-item_4', productName: 'Joint Torique Graphene', quantity: 2000, fobUnitPrice: 1.2, foreignCurrencyRate: 3.42, customsDutyRate: 5, vatRate: 19 }
                ],
                freightCostTND: 0, // CIF means Freight is included in the invoice!
                customsDutiesTND: 12400,
                transitterFeesTND: 1500,
                handlingFeesTND: 1100, // Port de Sfax
                insuranceCostTND: 0, // CIF includes Insurance!
                otherFeesTND: 450
              },
              {
                id: 'demo-imp_3',
                reference: 'IMP-2026-003 (Démo)',
                folderType: 'Import',
                supplierName: 'Hamburg Raw Materials Ltd',
                originCountry: 'Allemagne',
                incoterm: 'EXW',
                portOfArrival: 'Radès',
                transitterName: 'STTL',
                status: 'Cleared',
                creationDate: '2026-05-10',
                estimatedArrivalDate: '2026-06-20',
                currency: 'EUR',
                exchangeRate: 3.41,
                items: [
                  { id: 'demo-item_5', productName: 'Résine Synthétique Premium', quantity: 5000, fobUnitPrice: 2.1, foreignCurrencyRate: 3.41, customsDutyRate: 15, vatRate: 19 }
                ],
                freightCostTND: 8500, // EXW requires buyer to handle freight from factory door
                customsDutiesTND: 14600,
                transitterFeesTND: 1800,
                handlingFeesTND: 1200,
                insuranceCostTND: 1100,
                otherFeesTND: 600
              },
              {
                id: 'demo-exp_1',
                reference: 'EXP-2026-001 (Démo)',
                folderType: 'Export',
                clientName: 'Tripoli Polymer Trading',
                destinationCountry: 'Libye',
                incoterm: 'FOB',
                portOfDeparture: 'Sfax',
                transitterName: 'Sfax Douane Services',
                status: 'Transit',
                creationDate: '2026-06-10',
                estimatedArrivalDate: '2026-07-01',
                currency: 'USD',
                exchangeRate: 3.12, // 1 USD = 3.12 TND
                items: [
                  { id: 'demo-exp-item_1', productName: 'Résine Polyéthylène Haute Densité (PEHD)', quantity: 4000, fobUnitPrice: 1.80, foreignCurrencyRate: 3.12, customsDutyRate: 0, vatRate: 0 }
                ],
                freightCostTND: 0, // FOB export, foreign buyer handles shipping
                customsDutiesTND: 0, // Exempt from customs duties in Tunisia
                transitterFeesTND: 650,
                handlingFeesTND: 450,
                insuranceCostTND: 0,
                otherFeesTND: 150 // administrative origin certificate
              },
              {
                id: 'demo-exp_2',
                reference: 'EXP-2026-002 (Démo)',
                folderType: 'Export',
                clientName: 'Algeria Chemical Corp',
                destinationCountry: 'Algérie',
                incoterm: 'CIF',
                portOfDeparture: 'Radès',
                transitterName: 'STTL',
                status: 'Customs',
                creationDate: '2026-06-18',
                estimatedArrivalDate: '2026-06-29',
                currency: 'EUR',
                exchangeRate: 3.42,
                items: [
                  { id: 'demo-exp-item_2', productName: 'Adjuvants Ciment Spécifiques', quantity: 12000, fobUnitPrice: 0.95, foreignCurrencyRate: 3.42, customsDutyRate: 0, vatRate: 0 }
                ],
                freightCostTND: 3800, // CIF, Elyssa covers main freight to Algeria
                customsDutiesTND: 0,
                transitterFeesTND: 850,
                handlingFeesTND: 550,
                insuranceCostTND: 400,
                otherFeesTND: 200
              }
            ];
            const filtered = prev.filter(f => !f.id.startsWith('demo-'));
            return [...demoFolders, ...filtered];
          }
          return prev;
        });
      }

      const hasDemoLc = lcRequests.some(l => l.id.startsWith('demo-'));
      if (!hasDemoLc) {
        setLcRequests(prev => {
          const hasDemo = prev.some(l => l.id.startsWith('demo-'));
          if (!hasDemo) {
            const demoLc: LCRequest[] = [
              {
                id: 'demo-lc_1',
                importFolderId: 'demo-imp_1',
                folderType: 'Import',
                lcReference: 'BIAT-CDOC-2026-0819 (Démo)',
                proformaInvoiceRef: 'PROFORMA-MC-1029',
                proformaInvoiceDate: '2026-05-25',
                issuingBank: 'Banque Internationale Arabe de Tunisie (BIAT) - Agence Sfax El Jadida',
                beneficiaryName: 'Marseille Chimie SAS',
                beneficiaryAddress: 'Avenue de l\'Exportation, Zone Portuaire, 13002 Marseille, France',
                advisingBank: 'BNP Paribas - Agence Marseille Joliette',
                amount: 16350,
                currency: 'EUR',
                paymentTerms: 'At Sight',
                expiryDate: '2026-08-30',
                shipmentDeadline: '2026-06-30',
                portOfLoading: 'Port de Marseille, France',
                portOfDischarge: 'Radès',
                status: 'Opened',
                requiredDocuments: [
                  'Facture Commerciale signée en 3 exemplaires originaux',
                  'Jeu complet de Connaissement Maritime (Bill of Lading) "Clean on Board" à l\'ordre de la BIAT',
                  'Certificat de circulation des marchandises EUR.1 visé par la douane française',
                  'Note de colisage (Packing List) détaillée',
                  'Certificat d\'analyse chimique des solvants'
                ],
                additionalConditions: 'Expéditions partielles autorisées. Transbordement interdit. Tous les frais bancaires hors de Tunisie sont à la charge du bénéficiaire.',
                creationDate: '2026-05-28'
              },
              {
                id: 'demo-lc_2',
                importFolderId: 'demo-imp_2',
                folderType: 'Import',
                lcReference: 'AMEN-CDOC-2026-0922 (Démo)',
                proformaInvoiceRef: 'PI-2026-VALVES-12',
                proformaInvoiceDate: '2026-06-10',
                issuingBank: 'AMEN BANK - Agence Tunis Berges du Lac',
                beneficiaryName: 'Genoa Industrial Valves',
                beneficiaryAddress: 'Via della Logistica, Calata Sanità, 16126 Genova, Italie',
                advisingBank: 'UniCredit SpA - Sede di Genova',
                amount: 12600,
                currency: 'EUR',
                paymentTerms: 'Deferred 90 Days',
                expiryDate: '2026-09-15',
                shipmentDeadline: '2026-07-15',
                portOfLoading: 'Port de Gênes, Italie',
                portOfDischarge: 'Sfax',
                status: 'Submitted',
                requiredDocuments: [
                  'Facture Commerciale signée certifiant l\'origine des marchandises',
                  'Connaissement Maritime Original signé "Freight Prepaid"',
                  'Certificat d\'Origine EUR.1 original',
                  'Note de poids détaillée'
                ],
                additionalConditions: 'Paiement à 90 jours de la date de connaissement. Acceptation bancaire obligatoire.',
                creationDate: '2026-06-12'
              },
              {
                id: 'demo-lc_export_1',
                importFolderId: 'demo-exp_1',
                folderType: 'Export',
                lcReference: 'W-TRIP-2026-EXP72 (Démo Export)',
                proformaInvoiceRef: 'PI-ELYSSA-EXP-2026-89',
                proformaInvoiceDate: '2026-06-05',
                issuingBank: 'Wahda Bank - Tripoli, Libya',
                beneficiaryName: 'Elyssa Distribution S.A.',
                beneficiaryAddress: 'Zone Industrielle Ghannouch, Sfax, Tunisie',
                advisingBank: 'Banque Nationale Agricole (BNA) - Agence Tunis Berges du Lac',
                amount: 7200,
                currency: 'USD',
                paymentTerms: 'At Sight',
                expiryDate: '2026-08-15',
                shipmentDeadline: '2026-07-10',
                portOfLoading: 'Port de Sfax, Tunisie',
                portOfDischarge: 'Enfidha', // Saisie fictive de déchargement
                status: 'Opened',
                requiredDocuments: [
                  'Facture Commerciale signée en 3 exemplaires originaux certifiée par la Chambre de Commerce',
                  'Connaissement Maritime Original (Bill of Lading) Clean on Board à l\'ordre de Wahda Bank',
                  'Certificat d\'Origine délivré par l\'UTICA',
                  'Note de colisage détaillée',
                  'Certificat phytosanitaire officiel'
                ],
                additionalConditions: 'Tous les documents doivent mentionner le numéro d\'autorisation d\'exportation de la BCT.',
                creationDate: '2026-06-08'
              }
            ];
            const filtered = prev.filter(l => !l.id.startsWith('demo-'));
            return [...demoLc, ...filtered];
          }
          return prev;
        });
      }
    }
  }, [isSimulationActive]);

  const [selectedLcId, setSelectedLcId] = useState<string>('lc_1');
  const [showCreateLcModal, setShowCreateLcModal] = useState(false);

  // Form states for L/C
  const [lcForm_importFolderId, setLcForm_importFolderId] = useState<string>('');
  const [lcForm_proformaRef, setLcForm_proformaRef] = useState<string>('');
  const [lcForm_proformaDate, setLcForm_proformaDate] = useState<string>('');
  const [lcForm_issuingBank, setLcForm_issuingBank] = useState<string>('BIAT - Banque Internationale Arabe de Tunisie');
  const [lcForm_beneficiaryName, setLcForm_beneficiaryName] = useState<string>('');
  const [lcForm_beneficiaryAddress, setLcForm_beneficiaryAddress] = useState<string>('');
  const [lcForm_advisingBank, setLcForm_advisingBank] = useState<string>('');
  const [lcForm_amount, setLcForm_amount] = useState<number>(0);
  const [lcForm_currency, setLcForm_currency] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [lcForm_paymentTerms, setLcForm_paymentTerms] = useState<'At Sight' | 'Deferred 30 Days' | 'Deferred 60 Days' | 'Deferred 90 Days' | 'Deferred 120 Days'>('At Sight');
  const [lcForm_expiryDate, setLcForm_expiryDate] = useState<string>('');
  const [lcForm_shipmentDeadline, setLcForm_shipmentDeadline] = useState<string>('');
  const [lcForm_portOfLoading, setLcForm_portOfLoading] = useState<string>('');
  const [lcForm_portOfDischarge, setLcForm_portOfDischarge] = useState<'Radès' | 'Sfax' | 'Enfidha' | 'Tunis-Carthage'>('Radès');
  const [lcForm_additionalConditions, setLcForm_additionalConditions] = useState<string>('');
  const [lcForm_docs, setLcForm_docs] = useState<string[]>([
    'Facture Commerciale signée en 3 exemplaires',
    'Jeu complet de Connaissement Maritime (Bill of Lading) Clean on Board',
    'Certificat de circulation EUR.1',
    'Note de Colisage (Packing List)'
  ]);
  const [newLcDocText, setNewLcDocText] = useState<string>('');
  
  // Search and status filters for Letters of Credit
  const [lcSearchTerm, setLcSearchTerm] = useState<string>('');
  const [lcStatusFilter, setLcStatusFilter] = useState<string>('All');

  // Interactive checked documents list
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('carthage_lc_checked_docs');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleCheckedDoc = (lcId: string, docIdx: number) => {
    const key = `${lcId}_${docIdx}`;
    const updated = { ...checkedDocs, [key]: !checkedDocs[key] };
    setCheckedDocs(updated);
    localStorage.setItem('carthage_lc_checked_docs', JSON.stringify(updated));
  };

  // Handle auto-population of L/C form from selected Import Folder
  const populateLcFormFromFolder = (folderId: string) => {
    const f = folders.find(folder => folder.id === folderId);
    if (!f) return;
    
    // Sum items for total value
    const totalFob = f.items.reduce((acc, it) => acc + (it.fobUnitPrice * it.quantity), 0);
    
    setLcForm_importFolderId(f.id);
    setLcForm_beneficiaryName(f.supplierName);
    setLcForm_beneficiaryAddress(f.originCountry === 'France' ? 'Zone Industrielle, Marseille, France' : f.originCountry === 'Italie' ? 'Via della Seta, Gênes, Italie' : 'Zone de Fret, Europe');
    setLcForm_amount(totalFob);
    setLcForm_currency(f.currency);
    setLcForm_portOfDischarge(f.portOfArrival);
    setLcForm_proformaRef('PROFORMA-' + f.reference);
    setLcForm_proformaDate(new Date().toISOString().split('T')[0]);
    setLcForm_portOfLoading(f.originCountry === 'France' ? 'Port de Marseille, France' : f.originCountry === 'Italie' ? 'Port de Gênes, Italie' : 'Port d\'embarquement d\'origine');
    
    // Calculate typical LC expiry (3 months from now) and shipment (1 month from now)
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + 3);
    const shipment = new Date();
    shipment.setMonth(now.getMonth() + 1);
    
    setLcForm_expiryDate(expiry.toISOString().split('T')[0]);
    setLcForm_shipmentDeadline(shipment.toISOString().split('T')[0]);
  };

  const handleCreateLCRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcForm_proformaRef.trim() || !lcForm_beneficiaryName.trim() || lcForm_amount <= 0) return;
    
    const associatedFolder = folders.find(f => f.id === lcForm_importFolderId);
    const folderRef = associatedFolder ? associatedFolder.reference : 'DIR';
    
    const newLC: LCRequest = {
      id: 'lc_' + Date.now(),
      importFolderId: lcForm_importFolderId || undefined,
      lcReference: `${lcForm_issuingBank.substring(0, 4).toUpperCase()}-CDOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      proformaInvoiceRef: lcForm_proformaRef,
      proformaInvoiceDate: lcForm_proformaDate || new Date().toISOString().split('T')[0],
      issuingBank: lcForm_issuingBank,
      beneficiaryName: lcForm_beneficiaryName,
      beneficiaryAddress: lcForm_beneficiaryAddress,
      advisingBank: lcForm_advisingBank || 'Correspondant Étranger de la Banque d\'Émission',
      amount: lcForm_amount,
      currency: lcForm_currency,
      paymentTerms: lcForm_paymentTerms,
      expiryDate: lcForm_expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shipmentDeadline: lcForm_shipmentDeadline || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      portOfLoading: lcForm_portOfLoading || 'Port de départ européen',
      portOfDischarge: lcForm_portOfDischarge,
      status: 'Draft',
      requiredDocuments: [...lcForm_docs],
      additionalConditions: lcForm_additionalConditions,
      creationDate: new Date().toISOString().split('T')[0]
    };
    
    const updated = [newLC, ...lcRequests];
    saveLcRequests(updated);
    setSelectedLcId(newLC.id);
    setShowCreateLcModal(false);
    
    // Reset form states
    setLcForm_importFolderId('');
    setLcForm_proformaRef('');
    setLcForm_proformaDate('');
    setLcForm_beneficiaryName('');
    setLcForm_beneficiaryAddress('');
    setLcForm_advisingBank('');
    setLcForm_amount(0);
    setLcForm_additionalConditions('');
  };

  const handleUpdateLcStatus = (lcId: string, newStatus: LCRequest['status']) => {
    const targetLc = lcRequests.find(l => l.id === lcId);

    const updated = lcRequests.map(lc => {
      if (lc.id === lcId) {
        return { ...lc, status: newStatus };
      }
      return lc;
    });
    saveLcRequests(updated);

    // Automatic Treasury Bank Transaction when LC is Settled
    if (newStatus === 'Settled' && targetLc && onUpdateBankTransactions) {
      const rate = targetLc.currency === 'EUR' ? 3.35 : targetLc.currency === 'USD' ? 3.10 : 1;
      const amountTND = targetLc.amount * rate;
      
      const primaryAccount = bankAccounts[0];
      const accountId = primaryAccount ? primaryAccount.id : 'biat_main';
      const accountName = primaryAccount ? primaryAccount.bankName : (targetLc.issuingBank || 'BIAT - Agence Principale');

      const newTx: BankTransaction = {
        id: `tx_lc_${Date.now()}`,
        accountId: accountId,
        accountName: accountName,
        date: new Date().toISOString().split('T')[0],
        type: 'Out',
        amount: amountTND,
        method: 'Virement',
        reference: `CDOC-SWIFT-${targetLc.lcReference || targetLc.id}`,
        beneficiaryOrIssuer: targetLc.beneficiaryName,
        category: 'Achat Fournisseur',
        description: `Apurement Crédit Documentaire (${targetLc.amount.toLocaleString()} ${targetLc.currency}) - Facture: ${targetLc.proformaInvoiceRef}`,
        status: 'Cleared'
      };

      onUpdateBankTransactions([newTx, ...bankTransactions]);

      if (primaryAccount && onUpdateBankAccounts) {
        const updatedAccounts = bankAccounts.map(acc => {
          if (acc.id === accountId) {
            return { ...acc, currentBalance: acc.currentBalance - amountTND };
          }
          return acc;
        });
        onUpdateBankAccounts(updatedAccounts);
      }

      alert(`✅ Débouclage du Crédit Documentaire enregistré en Trésorerie !\n\nUne écriture bancaire de ${amountTND.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} TND (${targetLc.amount} ${targetLc.currency}) a été automatiquement générée dans le journal de Trésorerie (Compte: ${accountName}).`);
    }
  };

  const handleGenerateFolderCustomsBankTx = (folder: ImportFolder) => {
    if (!onUpdateBankTransactions) {
      alert("⚠️ Le module Trésorerie n'est pas accessible.");
      return;
    }

    const freight = folder.freightCostTND || 0;
    const customs = folder.customsDutiesTND || 0;
    const transitter = folder.transitterFeesTND || 0;
    const handling = folder.handlingFeesTND || 0;
    const insurance = folder.insuranceCostTND || 0;
    const other = folder.otherFeesTND || 0;
    const totalFeesTND = freight + customs + transitter + handling + insurance + other;

    if (totalFeesTND <= 0) {
      alert("⚠️ Les frais d'approche (Douane, Fret, Transitaire) pour ce dossier sont nuls. Veuillez d'abord renseigner les montants des frais.");
      return;
    }

    const primaryAccount = bankAccounts[0];
    const accountId = primaryAccount ? primaryAccount.id : 'biat_main';
    const accountName = primaryAccount ? primaryAccount.bankName : 'BIAT - Agence Principale';

    const newTx: BankTransaction = {
      id: `tx_imp_${Date.now()}`,
      accountId: accountId,
      accountName: accountName,
      date: new Date().toISOString().split('T')[0],
      type: 'Out',
      amount: totalFeesTND,
      method: 'Virement',
      reference: `DOUANE-FRET-${folder.reference}`,
      beneficiaryOrIssuer: folder.transitterName || 'Douane & Transitaire',
      category: 'Achat Fournisseur',
      description: `Paiement Frais d'approche Dossier ${folder.reference} (Douane: ${customs.toLocaleString()} TND, Fret: ${freight.toLocaleString()} TND, Transitaire: ${transitter.toLocaleString()} TND)`,
      status: 'Cleared'
    };

    onUpdateBankTransactions([newTx, ...bankTransactions]);

    if (primaryAccount && onUpdateBankAccounts) {
      const updatedAccounts = bankAccounts.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, currentBalance: acc.currentBalance - totalFeesTND };
        }
        return acc;
      });
      onUpdateBankAccounts(updatedAccounts);
    }

    alert(`✅ Écriture de Trésorerie générée avec succès !\n\nUn montant global de ${totalFeesTND.toLocaleString('fr-FR')} TND (frais d'approche et douane) a été imputé sur le compte bancaire ${accountName}.`);
  };

  const handleDeleteLcRequest = (lcId: string) => {
    const updated = lcRequests.filter(lc => lc.id !== lcId);
    saveLcRequests(updated);
    if (selectedLcId === lcId && updated.length > 0) {
      setSelectedLcId(updated[0].id);
    }
  };

  const handleAddLcDoc = () => {
    if (!newLcDocText.trim()) return;
    setLcForm_docs([...lcForm_docs, newLcDocText.trim()]);
    setNewLcDocText('');
  };

  const handleRemoveLcDoc = (idx: number) => {
    setLcForm_docs(lcForm_docs.filter((_, i) => i !== idx));
  };


  // Add Item to the temporary list
  const handleAddTempItem = () => {
    if (!tempItemName.trim() || tempItemQty <= 0 || tempItemFobPrice <= 0) return;
    const newItem: ImportFolderItem = {
      id: 'temp_' + Date.now(),
      productName: tempItemName,
      quantity: tempItemQty,
      fobUnitPrice: tempItemFobPrice,
      foreignCurrencyRate: newExchangeRate,
      customsDutyRate: tempItemCustomsRate,
      vatRate: tempItemVatRate
    };
    setNewItems([...newItems, newItem]);
    setTempItemName('');
    setTempItemQty(100);
    setTempItemFobPrice(10);
  };

  // Create folder submit
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderRef.trim() || !newSupplier.trim() || newItems.length === 0) return;

    const isExport = newFolderType === 'Export';

    const newFolder: ImportFolder = {
      id: (isExport ? 'exp_' : 'imp_') + Date.now(),
      reference: newFolderRef.toUpperCase(),
      folderType: newFolderType,
      supplierName: isExport ? undefined : newSupplier,
      clientName: isExport ? newSupplier : undefined,
      originCountry: isExport ? undefined : (newOrigin || 'Inconnue'),
      destinationCountry: isExport ? (newOrigin || 'Inconnue') : undefined,
      incoterm: newIncoterm,
      portOfArrival: isExport ? undefined : newPort as "Radès" | "Sfax" | "Enfidha" | "Tunis-Carthage",
      portOfDeparture: isExport ? newPort as "Radès" | "Sfax" | "Enfidha" | "Tunis-Carthage" : undefined,
      transitterName: newTransitter || 'Non assigné',
      status: 'Draft',
      creationDate: new Date().toISOString().split('T')[0],
      estimatedArrivalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: newCurrency,
      exchangeRate: newExchangeRate,
      items: newItems,
      freightCostTND: newIncoterm === 'CIF' ? 0 : 3500,
      customsDutiesTND: 0,
      transitterFeesTND: 800,
      handlingFeesTND: 500,
      insuranceCostTND: newIncoterm === 'CIF' ? 0 : 400,
      otherFeesTND: 200
    };

    saveFolders([...folders, newFolder]);
    setShowCreateModal(false);
    
    // Reset states
    setNewFolderRef('');
    setNewSupplier('');
    setNewOrigin('');
    setNewItems([]);
    setNewFolderType('Import');
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    saveFolders(updatedFolders);
    
    const updatedLc = lcRequests.filter(l => l.importFolderId !== folderId);
    saveLcRequests(updatedLc);
    
    if (selectedFolderId === folderId) {
      if (updatedFolders.length > 0) {
        setSelectedFolderId(updatedFolders[0].id);
      } else {
        setSelectedFolderId('');
      }
    }
  };

  const selectedLC = useMemo(() => {
    return lcRequests.find(lc => lc.id === selectedLcId) || lcRequests[0];
  }, [lcRequests, selectedLcId]);

  const lcStats = useMemo(() => {
    let totalEUR = 0;
    let totalUSD = 0;
    let activeCount = 0;
    let pendingCount = 0;
    
    lcRequests.forEach(lc => {
      if (lc.status === 'Opened') {
        activeCount++;
        if (lc.currency === 'EUR') totalEUR += lc.amount;
        if (lc.currency === 'USD') totalUSD += lc.amount;
      } else if (lc.status === 'Submitted') {
        pendingCount++;
      }
    });

    return { totalEUR, totalUSD, activeCount, pendingCount, totalCount: lcRequests.length };
  }, [lcRequests]);

  const filteredLcRequests = useMemo(() => {
    return lcRequests.filter(lc => {
      const matchSearch = 
        lc.lcReference.toLowerCase().includes(lcSearchTerm.toLowerCase()) ||
        lc.proformaInvoiceRef.toLowerCase().includes(lcSearchTerm.toLowerCase()) ||
        lc.beneficiaryName.toLowerCase().includes(lcSearchTerm.toLowerCase()) ||
        lc.issuingBank.toLowerCase().includes(lcSearchTerm.toLowerCase());
      
      const matchStatus = lcStatusFilter === 'All' || lc.status === lcStatusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [lcRequests, lcSearchTerm, lcStatusFilter]);

  const selectedFolder = useMemo(() => {
    return folders.find(f => f.id === selectedFolderId) || folders[0];
  }, [folders, selectedFolderId]);

  // Landed Cost details calculation for the selected folder
  const calculatedLandedCosts = useMemo(() => {
    if (!selectedFolder) return null;

    // Total FOB Value in Foreign Currency
    const totalFobForeign = selectedFolder.items.reduce((acc, it) => acc + (it.fobUnitPrice * it.quantity), 0);
    // Total FOB Value in TND
    const totalFobTND = totalFobForeign * selectedFolder.exchangeRate;

    // Total ancillary fees (freight, transitter, port handling, insurance, other)
    const totalAncillaryTND = 
      selectedFolder.freightCostTND + 
      selectedFolder.transitterFeesTND + 
      selectedFolder.handlingFeesTND + 
      selectedFolder.insuranceCostTND + 
      selectedFolder.otherFeesTND;

    // We also have customs duties directly payed. If 0 in state, estimate based on items customs rates for premium realism
    const activeCustomsTND = selectedFolder.customsDutiesTND > 0 
      ? selectedFolder.customsDutiesTND 
      : selectedFolder.items.reduce((acc, it) => {
          const itemFobTnd = it.fobUnitPrice * it.quantity * selectedFolder.exchangeRate;
          return acc + (itemFobTnd * (it.customsDutyRate / 100));
        }, 0);

    const totalFraisDossierTND = totalAncillaryTND + activeCustomsTND;
    const totalCostTND = totalFobTND + totalFraisDossierTND;

    // Impute to each item proportion of costs
    const computedItems = selectedFolder.items.map(it => {
      const itemFobForeign = it.fobUnitPrice * it.quantity;
      const itemFobTnd = itemFobForeign * selectedFolder.exchangeRate;
      
      // Proportion allocation factor
      let ratio = 0;
      if (allocationMethod === 'value') {
        ratio = totalFobTND > 0 ? itemFobTnd / totalFobTND : 0;
      } else if (allocationMethod === 'quantity') {
        const totalQty = selectedFolder.items.reduce((acc, i) => acc + i.quantity, 0);
        ratio = totalQty > 0 ? it.quantity / totalQty : 0;
      }

      // Imputed transport & ancillary fees
      const allocatedAncillary = totalAncillaryTND * ratio;
      // Item customs duty (directly calculated per item rate or allocated)
      const allocatedCustoms = selectedFolder.customsDutiesTND > 0 
        ? selectedFolder.customsDutiesTND * ratio
        : itemFobTnd * (it.customsDutyRate / 100);

      const totalItemExpenses = allocatedAncillary + allocatedCustoms;
      const landedCostTndTotal = itemFobTnd + totalItemExpenses;
      const landedCostTndUnit = it.quantity > 0 ? landedCostTndTotal / it.quantity : 0;
      const unitFobTnd = it.fobUnitPrice * selectedFolder.exchangeRate;
      const markupPercentage = unitFobTnd > 0 ? ((landedCostTndUnit - unitFobTnd) / unitFobTnd) * 100 : 0;

      return {
        ...it,
        fobTndUnit: unitFobTnd,
        fobTndTotal: itemFobTnd,
        allocatedAncillary,
        allocatedCustoms,
        totalItemExpenses,
        landedCostTndTotal,
        landedCostTndUnit,
        markupPercentage
      };
    });

    return {
      totalFobForeign,
      totalFobTND,
      totalAncillaryTND,
      activeCustomsTND,
      totalFraisDossierTND,
      totalCostTND,
      computedItems
    };
  }, [selectedFolder, allocationMethod]);

  // Handle manual modification of expenses inside selected folder
  const handleUpdateExpenses = (field: string, val: number) => {
    if (!selectedFolder) return;
    const updated = folders.map(f => {
      if (f.id === selectedFolder.id) {
        return { ...f, [field]: val };
      }
      return f;
    });
    saveFolders(updated);
  };

  // Update Status of Dossier
  const handleUpdateStatus = (status: 'Draft' | 'Transit' | 'Customs' | 'Cleared' | 'InStock') => {
    if (!selectedFolder) return;
    const updated = folders.map(f => {
      if (f.id === selectedFolder.id) {
        return { ...f, status };
      }
      return f;
    });
    saveFolders(updated);
  };

  const filteredFolders = useMemo(() => {
    return folders.filter(f => {
      const supplierOrClient = f.supplierName || f.clientName || '';
      const originOrDest = f.originCountry || f.destinationCountry || '';
      const matchSearch = f.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          supplierOrClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          originOrDest.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'All' || f.status === filterStatus;
      const matchType = folderTypeFilter === 'All' || (f.folderType || 'Import') === folderTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [folders, searchTerm, filterStatus, folderTypeFilter]);

  // Statistics for overall Transit
  const stats = useMemo(() => {
    const totalActiveDossiers = folders.filter(f => f.status !== 'InStock').length;
    const foldersByStatus = {
      Draft: folders.filter(f => f.status === 'Draft').length,
      Transit: folders.filter(f => f.status === 'Transit').length,
      Customs: folders.filter(f => f.status === 'Customs').length,
      Cleared: folders.filter(f => f.status === 'Cleared').length,
      InStock: folders.filter(f => f.status === 'InStock').length,
    };

    // Total import volume on going (in TND FOB)
    const onGoingImportTND = folders
      .filter(f => f.status !== 'InStock' && (f.folderType || 'Import') === 'Import')
      .reduce((acc, f) => {
        const fobForeign = f.items.reduce((sum, it) => sum + (it.fobUnitPrice * it.quantity), 0);
        return acc + (fobForeign * f.exchangeRate);
      }, 0);

    // Total export volume on going (in TND FOB)
    const onGoingExportTND = folders
      .filter(f => f.status !== 'InStock' && f.folderType === 'Export')
      .reduce((acc, f) => {
        const fobForeign = f.items.reduce((sum, it) => sum + (it.fobUnitPrice * it.quantity), 0);
        return acc + (fobForeign * f.exchangeRate);
      }, 0);

    return {
      totalActiveDossiers,
      foldersByStatus,
      onGoingImportTND,
      onGoingExportTND
    };
  }, [folders]);

  return (
    <div className="bg-[#0b1329] text-slate-100 p-4 md:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* Upper header */}
      {standaloneMode === 'lc_only' ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400">
                <Building className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                Lettres de Crédit (Crédocs Bancaires)
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
              Gestionnaire d'engagements bancaires internationaux, montage de dossiers de Crédocs conformes aux circulaires de la BCT, édition de lettres officielles pour l'import d'Elyssa Distribution S.A.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400">
                <Globe className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                Transit & Logistique Internationale
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
              Module stratégique de douane tunisienne, calcul du coût de revient consolidé (Landed Cost) et coordination logistique sur les ports de Radès & Sfax d'Elyssa Distribution S.A.
            </p>
          </div>

          <button 
            onClick={() => {
              setNewFolderType('Import');
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20 border-0"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            Nouveau Dossier (Imp/Exp)
          </button>
        </div>
      )}

      {/* Mini KPIs cards */}
      {standaloneMode !== 'lc_only' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0e172e] p-4.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Dossiers Actifs</span>
              <span className="text-2xl font-black text-white mt-1 block font-mono">{stats.totalActiveDossiers}</span>
              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">En transit ou en douane</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Ship className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0e172e] p-4.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">En Douane (Radès/Sfax)</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block font-mono">{stats.foldersByStatus.Customs}</span>
              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Liasse EUR.1 soumise</span>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <Anchor className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0e172e] p-4.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Encours Douane & Transit</span>
              <span className="text-xs font-black text-cyan-400 mt-1 block font-mono">
                Imp : {Math.round(stats.onGoingImportTND).toLocaleString()} TND
              </span>
              <span className="text-xs font-black text-indigo-400 block font-mono">
                Exp : {Math.round(stats.onGoingExportTND).toLocaleString()} TND
              </span>
              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Valorisé au cours du jour</span>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0e172e] p-4.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Dossiers Apurés</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">{stats.foldersByStatus.InStock}</span>
              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Acheminés au stock d'Elyssa</span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Selector */}
      {standaloneMode !== 'lc_only' && (
        <div className="flex border-b border-slate-800 gap-1.5 scrollbar-thin overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveSubTab('folders')}
            className={`py-3 px-4.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'folders' 
                ? 'border-indigo-500 text-white bg-indigo-500/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Suivi des Dossiers
          </button>

          <button
            onClick={() => setActiveSubTab('landed_cost')}
            className={`py-3 px-4.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'landed_cost' 
                ? 'border-indigo-500 text-white bg-indigo-500/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Coût de Revient Consolidé (Landed Cost)
          </button>

          <button
            onClick={() => setActiveSubTab('incoterms')}
            className={`py-3 px-4.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'incoterms' 
                ? 'border-indigo-500 text-white bg-indigo-500/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Incoterms & Simulation Fret
          </button>

          <button
            onClick={() => setActiveSubTab('customs')}
            className={`py-3 px-4.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'customs' 
                ? 'border-indigo-500 text-white bg-indigo-500/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Réglementation & Dédouanement
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`py-3 px-4.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'settings' 
                ? 'border-indigo-500 text-white bg-indigo-500/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Configuration Transit
          </button>
        </div>
      )}

      {/* SUBTAB CONTENT 1: FOLDERS TRACKING */}
      {activeSubTab === 'folders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Folders List & Search */}
          <div className="lg:col-span-5 bg-[#080f21] p-4.5 rounded-2xl border border-slate-800/80 space-y-4">
            
            {/* Import vs Export Pills */}
            <div className="flex bg-[#0d152a] p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setFolderTypeFilter('All')}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer border-0 ${
                  folderTypeFilter === 'All'
                    ? 'bg-indigo-650 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                Tous ({folders.length})
              </button>
              <button
                type="button"
                onClick={() => setFolderTypeFilter('Import')}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer border-0 ${
                  folderTypeFilter === 'Import'
                    ? 'bg-indigo-650 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                Imports ({folders.filter(f => (f.folderType || 'Import') === 'Import').length})
              </button>
              <button
                type="button"
                onClick={() => setFolderTypeFilter('Export')}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer border-0 ${
                  folderTypeFilter === 'Export'
                    ? 'bg-indigo-650 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                Exports ({folders.filter(f => f.folderType === 'Export').length})
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Réf, partenaire, pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-9 text-xs font-medium text-slate-200 placeholder-slate-550 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0d152a] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">Tous Statuts</option>
                <option value="Draft">Brouillon</option>
                <option value="Transit">En Transit</option>
                <option value="Customs">En Douane</option>
                <option value="Cleared">Dédouané</option>
                <option value="InStock">Acheminé / Livré</option>
              </select>
            </div>

            {/* Folders List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredFolders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-medium">
                  Aucun dossier trouvé pour les critères sélectionnés.
                </div>
              ) : (
                filteredFolders.map((f) => {
                  const isSelected = f.id === selectedFolderId;
                  const totalTnd = Math.round(f.items.reduce((sum, it) => sum + (it.fobUnitPrice * it.quantity), 0) * f.exchangeRate);
                  const isExport = f.folderType === 'Export';
                  
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected 
                          ? 'bg-indigo-950/25 border-indigo-500/80 shadow-md shadow-indigo-650/5' 
                          : 'bg-[#0d152a]/60 border-slate-850 hover:bg-[#0e172e] hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white font-mono tracking-wider">{f.reference}</span>
                          <span className={`text-[8px] font-black px-1 py-0.2 rounded ${
                            isExport ? 'bg-indigo-500/20 text-indigo-300' : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {isExport ? 'EXPORT' : 'IMPORT'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          f.status === 'Draft' ? 'bg-slate-800 text-slate-400' :
                          f.status === 'Transit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50' :
                          f.status === 'Customs' ? 'bg-rose-950/80 text-rose-300 border border-rose-900/40' :
                          f.status === 'Cleared' ? 'bg-amber-950/80 text-amber-300 border border-amber-900/30' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {f.status === 'Draft' ? 'Brouillon' :
                           f.status === 'Transit' ? (isExport ? 'Transit Export' : 'Transit Import') :
                           f.status === 'Customs' ? 'En Douane' :
                           f.status === 'Cleared' ? 'Dédouané' : (isExport ? 'Livré Client' : 'Entré Stock')}
                        </span>
                      </div>

                      <div className="flex justify-between items-end text-[10px] text-slate-400">
                        <div>
                          <p className="font-extrabold text-slate-300 line-clamp-1">{isExport ? f.clientName : f.supplierName}</p>
                          <p className="mt-0.5 font-sans">
                            {isExport ? 'Destination' : 'Provenance'} : <strong className="text-slate-300">{isExport ? f.destinationCountry : f.originCountry}</strong> ({f.incoterm})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-400 font-mono text-xs">{totalTnd.toLocaleString()} TND</p>
                          <p className="mt-0.5 font-mono text-[9px]">Arr. estimé : {f.estimatedArrivalDate}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Dossier Detail & Documents checklist */}
          <div className="lg:col-span-7 space-y-5">
            {selectedFolder ? (
              <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-5">
                
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white font-mono tracking-tight">{selectedFolder.reference}</h2>
                      <span className="text-xs text-slate-400 font-bold">|</span>
                      <p className="text-xs text-slate-300 font-bold">
                        {selectedFolder.folderType === 'Export' ? selectedFolder.clientName : selectedFolder.supplierName}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Dossier créé le {selectedFolder.creationDate} • {selectedFolder.folderType === 'Export' ? `Port de départ : Port de ${selectedFolder.portOfDeparture || 'Sfax'}` : `Port d'arrivée : Port de ${selectedFolder.portOfArrival || 'Radès'}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 bg-[#0d152a] p-1 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-black uppercase px-2">Statut :</span>
                      <select
                        value={selectedFolder.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as any)}
                        className="bg-slate-900 border-0 text-[10px] font-black uppercase tracking-wider text-indigo-400 py-1 px-2 rounded-lg focus:ring-0 cursor-pointer"
                      >
                        <option value="Draft">Brouillon</option>
                        <option value="Transit">En Transit</option>
                        <option value="Customs">En Douane</option>
                        <option value="Cleared">Dédouané</option>
                        <option value="InStock">{selectedFolder.folderType === 'Export' ? 'Livré Client' : 'Entré Stock'}</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleGenerateFolderCustomsBankTx(selectedFolder)}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl transition cursor-pointer text-[10px] font-extrabold flex items-center gap-1"
                      title="Générer l'écriture comptable/bancaire des frais de transit et douane dans le journal de Trésorerie"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Écriture Trésorerie (Frais/Douane)</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFolder(selectedFolder.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer border-0"
                      title="Supprimer ce Dossier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0d152a]/60 p-4 rounded-xl border border-slate-850/50">
                  <div>
                    <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                      {selectedFolder.folderType === 'Export' ? 'Incoterm de Vente' : "Incoterm d'Achat"}
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block font-mono text-indigo-400">{selectedFolder.incoterm}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">Devise & Cours</span>
                    <span className="text-xs font-black text-white mt-0.5 block font-mono">1 {selectedFolder.currency} = {selectedFolder.exchangeRate} TND</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">Transitaire Agréé</span>
                    <span className="text-xs font-black text-white mt-0.5 block truncate">{selectedFolder.transitterName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                      {selectedFolder.folderType === 'Export' ? 'Départ du Port' : "Arrivée au Port"}
                    </span>
                    <span className="text-xs font-black text-amber-400 mt-0.5 block font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {selectedFolder.estimatedArrivalDate}
                    </span>
                  </div>
                </div>

                {/* Liasse Documentaire d'origine tunisienne (Compliancy checklist) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      {selectedFolder.folderType === 'Export' ? 'Liasse Documentaire Export & Certificats d\'Origine' : 'Liasse Documentaire & Conformité Douane (EUR.1 / B/L)'}
                    </h3>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 rounded-full uppercase">
                      {selectedFolder.folderType === 'Export' ? 'Banque Centrale & UTICA' : 'Exigence Douane Tunisienne'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-[#0d152a] rounded-xl border border-slate-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-extrabold text-slate-200">Facture Commerciale signée</span>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Prête / Certifiée</span>
                    </div>

                    <div className="p-2.5 bg-[#0d152a] rounded-xl border border-slate-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-extrabold text-slate-200">
                          {selectedFolder.folderType === 'Export' ? 'Certificat d\'Origine UTICA' : 'Certificat d\'Origine EUR.1'}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                        {selectedFolder.folderType === 'Export' ? 'Délivré UTICA' : 'Visé Douane CE'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#0d152a] rounded-xl border border-slate-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-extrabold text-slate-200">Connaissement Maritime (B/L)</span>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Confirmé</span>
                    </div>

                    <div className="p-2.5 bg-[#0d152a] rounded-xl border border-slate-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedFolder.status !== 'Draft' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                        <span className="font-extrabold text-slate-200">
                          {selectedFolder.folderType === 'Export' ? 'Engagement de Change (BCT)' : 'Note de Poids & Packing List'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${selectedFolder.status !== 'Draft' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                        {selectedFolder.status !== 'Draft' ? (selectedFolder.folderType === 'Export' ? 'Enregistré BCT' : 'Conforme') : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linked Manufacturing Orders (OF) section */}
                {(() => {
                  const linkedMOs = manufacturingOrders.filter(mo => mo.importFolderId === selectedFolder.id);
                  return (
                    <div className="space-y-3 bg-[#0d152a]/70 p-4 rounded-xl border border-indigo-900/40">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Cog className="w-4 h-4 text-indigo-400" />
                          <span>Ordres de Fabrication (OF Usine) dépendants ({linkedMOs.length})</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">Lien Direct Usine & Douane</span>
                      </div>

                      {linkedMOs.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          Aucun Ordre de Fabrication n'est actuellement lié à ce dossier d'importation. Vous pouvez lier un OF lors de sa création dans le module Usine & OF.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {linkedMOs.map(mo => (
                            <div key={mo.id} className="p-3 bg-[#0a0f1d] rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-white font-mono">{mo.id}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  mo.status === 'En attente Douane/Matières' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                  mo.status === 'En cours' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                  mo.status === 'Terminé' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {mo.status}
                                </span>
                              </div>
                              <div className="text-slate-300 font-semibold">{mo.productName}</div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Qté à produire : {mo.quantityToProduce.toLocaleString('fr-FR')} u</span>
                                <span>Progression : {mo.advancement}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Items contained in import dossier */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-400" />
                    {selectedFolder.folderType === 'Export' ? `Détail des Produits Exportés (${selectedFolder.items.length})` : `Détail des Produits Importés (${selectedFolder.items.length})`}
                  </h3>

                  <div className="border border-slate-850 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#0d152a] text-slate-400 font-extrabold uppercase border-b border-slate-850">
                          <th className="p-3">Désignation Produit</th>
                          <th className="p-3 text-center">Quantité</th>
                          <th className="p-3 text-right">PU FOB ({selectedFolder.currency})</th>
                          <th className="p-3 text-right">Montant Total TND</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-sans">
                        {selectedFolder.items.map((it) => {
                          const itemTotalTnd = it.fobUnitPrice * it.quantity * selectedFolder.exchangeRate;
                          return (
                            <tr key={it.id} className="hover:bg-slate-900/40">
                              <td className="p-3 font-bold text-white">{it.productName}</td>
                              <td className="p-3 text-center font-mono text-slate-300">{it.quantity.toLocaleString()} kg/u</td>
                              <td className="p-3 text-right font-mono text-slate-300">
                                {it.fobUnitPrice.toFixed(2)} {selectedFolder.currency}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-indigo-400">
                                {Math.round(itemTotalTnd).toLocaleString()} TND
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-3.5 bg-indigo-950/15 border border-indigo-900/40 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-300 leading-relaxed font-sans">
                    {selectedFolder.folderType === 'Export' ? (
                      <span><strong>Régime d'exportation tunisien :</strong> En Tunisie, les exportations de biens industriels et chimiques sont totalement exonérées de droits de douane et de TVA (Régime suspensif sous le Code des Douanes). Cependant, l'exportateur est réglementairement tenu de rapatrier le produit des exportations sous 120 jours conformément à la réglementation des changes de la Banque Centrale de Tunisie (BCT).</span>
                    ) : (
                      <span><strong>Régime douanier tunisien :</strong> En vertu du Code des Douanes Tunisien, Elyssa Distribution S.A. bénéficie d'une liasse documentaire avec EUR.1. Les marchandises importées de l'UE bénéficient d'une réduction ou exonération des droits de douane (exonération sous réserve d'un taux de douane préférentiel de 0%).</span>
                    )}
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-[#080f21] p-10 rounded-2xl border border-slate-800 text-center text-slate-400 font-medium text-xs">
                Sélectionnez un dossier à gauche ou créez-en un nouveau.
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB CONTENT 2: LANDED COST CONSOLIDATION */}
      {activeSubTab === 'landed_cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Cost distribution control parameters */}
          <div className="lg:col-span-5 bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-5">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                {selectedFolder?.folderType === 'Export' ? "Dépenses Annexes d'Exportation (TND)" : "Dépenses Annexes d'Achat (TND)"}
              </h3>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {selectedFolder?.folderType === 'Export' 
                  ? "Saisissez les frais réels imputés pour l'acheminement, transit et logistique d'exportation de ce dossier."
                  : "Saisissez les frais réels imputés au port d'arrivée d'Elyssa (Radès / Sfax) pour ce dossier."}
              </p>
            </div>

            {selectedFolder ? (
              <div className="space-y-4">
                
                {/* Active Folder selector in form */}
                <div className="p-3 bg-[#0d152a] rounded-xl border border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black uppercase font-mono">{selectedFolder.reference}</span>
                  <span className="text-[10px] text-slate-500">
                    Imputer sur {selectedFolder.folderType === 'Export' ? selectedFolder.clientName : selectedFolder.supplierName}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">
                      {selectedFolder.folderType === 'Export' ? "Fret International Export (CIF) (TND)" : "Fret Maritime / Aérien (TND)"}
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-[10px] font-mono font-bold text-slate-500">TND</span>
                      <input
                        type="number"
                        value={selectedFolder.freightCostTND}
                        onChange={(e) => handleUpdateExpenses('freightCostTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">
                      {selectedFolder.folderType === 'Export' ? "Frais de Certification & Douane Export (TND)" : "Droits de Douane Payés (TND)"}
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-[10px] font-mono font-bold text-slate-500">TND</span>
                      <input
                        type="number"
                        value={selectedFolder.customsDutiesTND}
                        onChange={(e) => handleUpdateExpenses('customsDutiesTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Honoraires Transitaire Tunisien (TND)</label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-[10px] font-mono font-bold text-slate-500">TND</span>
                      <input
                        type="number"
                        value={selectedFolder.transitterFeesTND}
                        onChange={(e) => handleUpdateExpenses('transitterFeesTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">
                      {selectedFolder.folderType === 'Export' ? "Manutention Portuaire d'Export (TND)" : "Frais d'Acconage & Portuaire (TND)"}
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-[10px] font-mono font-bold text-slate-500">TND</span>
                      <input
                        type="number"
                        value={selectedFolder.handlingFeesTND}
                        onChange={(e) => handleUpdateExpenses('handlingFeesTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Assurance Fret</label>
                      <input
                        type="number"
                        value={selectedFolder.insuranceCostTND}
                        onChange={(e) => handleUpdateExpenses('insuranceCostTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Autres Taxes</label>
                      <input
                        type="number"
                        value={selectedFolder.otherFeesTND}
                        onChange={(e) => handleUpdateExpenses('otherFeesTND', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Allocation mechanism */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">Méthode de Prorata (Consolidation)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAllocationMethod('value')}
                      className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase border cursor-pointer transition ${
                        allocationMethod === 'value' 
                          ? 'bg-indigo-650 border-indigo-500 text-white' 
                          : 'bg-slate-950 border-slate-805 text-slate-400 hover:text-white'
                      }`}
                    >
                      Prorata Valeur FOB
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationMethod('quantity')}
                      className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase border cursor-pointer transition ${
                        allocationMethod === 'quantity' 
                          ? 'bg-indigo-650 border-indigo-500 text-white' 
                          : 'bg-slate-950 border-slate-805 text-slate-400 hover:text-white'
                      }`}
                    >
                      Prorata Quantité / Unité
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500">Veuillez sélectionner un dossier.</p>
            )}
          </div>

          {/* Right Column: Calculations & Comparison Charts */}
          <div className="lg:col-span-7 space-y-5">
            {calculatedLandedCosts && selectedFolder ? (
              (() => {
                const isExport = selectedFolder.folderType === 'Export';
                const totalBaseProductionCostTND = calculatedLandedCosts.totalFobTND * 0.70;
                const totalExportCostTND = totalBaseProductionCostTND + calculatedLandedCosts.totalFraisDossierTND;
                const netExportProfitTND = calculatedLandedCosts.totalFobTND - totalExportCostTND;
                const netExportMarginPct = calculatedLandedCosts.totalFobTND > 0 ? (netExportProfitTND / calculatedLandedCosts.totalFobTND) * 100 : 0;

                return (
                  <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-6">
                    
                    {/* Cost Distribution summary */}
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        {isExport ? `Analyse Financière & Rentabilité Export (${selectedFolder.reference})` : `Analyse Financière & Ventilation des Coûts (${selectedFolder.reference})`}
                      </h3>
                      <div className="grid grid-cols-3 gap-3.5 mt-3">
                        <div className="bg-[#0d152a] p-3 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                            {isExport ? "CA Facturé FOB (TND)" : "Valeur Achat FOB (TND)"}
                          </span>
                          <span className="text-sm font-black text-indigo-400 mt-0.5 block font-mono">
                            {Math.round(calculatedLandedCosts.totalFobTND).toLocaleString()} TND
                          </span>
                        </div>

                        <div className="bg-[#0d152a] p-3 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                            {isExport ? "Logistique d'Export" : "Frais Logistique + Douane"}
                          </span>
                          <span className="text-sm font-black text-amber-400 mt-0.5 block font-mono">
                            +{Math.round(calculatedLandedCosts.totalFraisDossierTND).toLocaleString()} TND
                          </span>
                        </div>

                        <div className="bg-[#0d152a] p-3 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                            {isExport ? "Marge Net d'Export" : "Coût Consolidé Final"}
                          </span>
                          <span className="text-sm font-black text-emerald-400 mt-0.5 block font-mono">
                            {isExport 
                              ? `${Math.round(netExportProfitTND).toLocaleString()} TND (${netExportMarginPct.toFixed(1)}%)`
                              : `${Math.round(calculatedLandedCosts.totalCostTND).toLocaleString()} TND`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Landed Cost detailed item rows */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        {isExport ? "Analyse Marginale Export & Rentabilité Unitaire" : "Calculateur de Marge Douanière & Coût de Revient Unitaire"}
                      </h4>

                      <div className="space-y-2.5">
                        {calculatedLandedCosts.computedItems.map(it => {
                          const unitFobTnd = it.fobUnitPrice * selectedFolder.exchangeRate;
                          const itemBaseProductionCostTnd = unitFobTnd * 0.70;
                          const unitExpensesTnd = it.quantity > 0 ? it.totalItemExpenses / it.quantity : 0;
                          const totalUnitCostTnd = itemBaseProductionCostTnd + unitExpensesTnd;
                          const unitNetProfitTnd = unitFobTnd - totalUnitCostTnd;
                          const unitProfitMarginPct = unitFobTnd > 0 ? (unitNetProfitTnd / unitFobTnd) * 100 : 0;
                          const cogsPct = 70;
                          const expensesPct = unitFobTnd > 0 ? (unitExpensesTnd / unitFobTnd) * 100 : 0;

                          return (
                            <div key={it.id} className="bg-[#0d152a]/65 p-3.5 rounded-xl border border-slate-850/60 space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-black text-white block">{it.productName}</span>
                                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                                    Quantité : {it.quantity.toLocaleString()} unités • PU de {isExport ? "vente" : "achat"} FOB : {it.fobUnitPrice} {selectedFolder.currency}
                                  </span>
                                </div>
                                
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 font-black uppercase block">
                                    {isExport ? "Marge Bénéficiaire Unitaire (Est.)" : "Coût Revient Consolidé Unitaire"}
                                  </span>
                                  <span className="text-xs font-black text-emerald-400 block font-mono mt-0.5">
                                    {isExport 
                                      ? `${unitNetProfitTnd.toFixed(3)} TND (${unitProfitMarginPct.toFixed(1)}%)` 
                                      : `${it.landedCostTndUnit.toFixed(3)} TND`}
                                  </span>
                                </div>
                              </div>

                              {/* Cost progress comparative bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                                  {isExport ? (
                                    <>
                                      <span>Coût Production Base ({itemBaseProductionCostTnd.toFixed(3)} TND)</span>
                                      <span className="text-cyan-400 font-extrabold">Profit Export ({unitProfitMarginPct.toFixed(1)}%)</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Prix FOB de Base ({it.fobTndUnit.toFixed(3)} TND)</span>
                                      <span className="text-amber-400">Frais d'approche (+{it.markupPercentage.toFixed(1)}%)</span>
                                    </>
                                  )}
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden flex">
                                  {isExport ? (
                                    <>
                                      <div className="bg-indigo-600 h-full" style={{ width: `${cogsPct}%` }}></div>
                                      <div className="bg-amber-500 h-full" style={{ width: `${expensesPct}%` }}></div>
                                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(0, 100 - cogsPct - expensesPct)}%` }}></div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="bg-indigo-500 h-full" style={{ width: `${100 / (1 + it.markupPercentage/100)}%` }}></div>
                                      <div className="bg-amber-500 h-full" style={{ width: `${100 - (100 / (1 + it.markupPercentage/100))}%` }}></div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] pt-1 border-t border-slate-850/45 text-slate-400 font-medium">
                                <div>
                                  {isExport ? "Logistique d'Export :" : "Droits de douane :"} <strong className="text-slate-300 font-mono">+{Math.round(isExport ? it.allocatedAncillary : it.allocatedCustoms)} TND</strong>
                                </div>
                                <div>
                                  {isExport ? "Frais de Transit :" : "Frais d'approche prorata :"} <strong className="text-slate-300 font-mono">+{Math.round(isExport ? it.allocatedCustoms : it.allocatedAncillary)} TND</strong>
                                </div>
                                <div className="sm:text-right">
                                  {isExport ? "Valeur FOB Globale :" : "Total Produit Consolidé :"} <strong className="text-indigo-400 font-mono">{Math.round(it.fobTndTotal).toLocaleString()} TND</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Landed Cost Breakdown Pie chart */}
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={[
                            {
                              name: isExport ? 'Financement Export' : 'Coût Final Dossier',
                              FOB: isExport ? Math.round(totalBaseProductionCostTND) : Math.round(calculatedLandedCosts.totalFobTND),
                              Fret: selectedFolder.freightCostTND,
                              Douane: isExport ? Math.round(selectedFolder.customsDutiesTND) : Math.round(calculatedLandedCosts.activeCustomsTND),
                              Manutention_Transitaire: selectedFolder.transitterFeesTND + selectedFolder.handlingFeesTND,
                              Assurance_Autres: isExport ? (selectedFolder.insuranceCostTND + selectedFolder.otherFeesTND + Math.round(netExportProfitTND)) : (selectedFolder.insuranceCostTND + selectedFolder.otherFeesTND)
                            }
                          ]}
                          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis type="category" dataKey="name" stroke="#64748b" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                          />
                          <Legend />
                          <Bar dataKey="FOB" stackId="a" fill="#4f46e5" name={isExport ? "Coût de Production (TND)" : "Valeur d'Achat (FOB TND)"} />
                          <Bar dataKey="Fret" stackId="a" fill="#0891b2" name="Fret National / Export" />
                          <Bar dataKey="Douane" stackId="a" fill="#e11d48" name={isExport ? "Frais de Certification" : "Droits Douane"} />
                          <Bar dataKey="Manutention_Transitaire" stackId="a" fill="#d97706" name="Transitaire & Acconage" />
                          <Bar dataKey="Assurance_Autres" stackId="a" fill="#10b981" name={isExport ? "Marge Net d'Exportation" : "Assurance & Autres"} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">Veuillez sélectionner un dossier pour afficher l'analyse consolidée.</p>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB CONTENT 3: INCOTERMS SIMULATOR */}
      {activeSubTab === 'incoterms' && (
        <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Matrice des Incoterms d'Achat Internationaux
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Comprendre la répartition des charges, risques et responsabilités entre Elyssa Distribution et les fournisseurs étrangers.
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              Incoterms 2020 ICC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 bg-[#0d152a] rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-black">EXW</span>
                <span className="text-xs font-black text-white uppercase">Ex Works (À l'Usine)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Le vendeur met simplement la marchandise à disposition dans ses locaux. <strong>Elyssa prend en charge 100% des frais :</strong> chargement, pré-acheminement, dédouanement export, transport principal (fret), assurance, manutention portuaire et dédouanement import.
              </p>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-500 font-bold">
                Risque : Transféré à la porte de l'usine fournisseur.
              </div>
            </div>

            <div className="p-4 bg-[#0d152a] rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg text-xs font-black">FOB</span>
                <span className="text-xs font-black text-white uppercase">Free On Board (Franco à Bord)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Le vendeur livre la marchandise à bord du navire désigné au port d'exportation. <strong>Elyssa paye :</strong> le fret maritime principal, l'assurance transport, l'acconage au port d'arrivée tunisien (Radès/Sfax), le transitaire et les droits de douane.
              </p>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-indigo-500 font-bold">
                Le plus recommandé pour maîtriser les coûts logistiques.
              </div>
            </div>

            <div className="p-4 bg-[#0d152a] rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-black">CIF</span>
                <span className="text-xs font-black text-white uppercase">Cost, Insurance & Freight</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Le vendeur paie le transport (fret) et l'assurance jusqu'au port d'arrivée d'Elyssa (Radès/Sfax). <strong>Elyssa ne paie à l'arrivée que :</strong> le déchargement (acconage), son transitaire agréé STTL et les taxes/droits de douane tunisiennes.
              </p>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-emerald-500/80 font-bold">
                Recommandé pour les envois ponctuels d'équipement.
              </div>
            </div>
          </div>

          {/* Incoterm cost slider simulation */}
          <div className="p-4.5 bg-slate-950/75 border border-slate-850 rounded-xl space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Simulateur d'Optimisation d'Achat d'Additifs (Valeur FOB : 50,000 EUR)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans text-slate-300">
              <div className="space-y-3">
                <p>
                  Ce simulateur compare les frais réels à provisionner pour une cargaison de solvants d'une valeur de <strong>171,000 TND</strong> en provenance de Marseille (France) vers le Port de Radès.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center p-2.5 bg-[#0d152a] rounded-lg border border-slate-850/60 text-[11px]">
                    <span className="font-extrabold text-slate-400">Option EXW (Achat d'usine) :</span>
                    <span className="font-black text-white">Coût global : <strong className="text-indigo-400 font-mono">186,500 TND</strong></span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#0d152a] rounded-lg border border-slate-850/60 text-[11px]">
                    <span className="font-extrabold text-slate-400">Option FOB (Marseille) :</span>
                    <span className="font-black text-white">Coût global : <strong className="text-indigo-400 font-mono">177,400 TND</strong></span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#0d152a] rounded-lg border border-slate-850/60 text-[11px]">
                    <span className="font-extrabold text-slate-400">Option CIF (Port de Radès) :</span>
                    <span className="font-black text-white">Coût global : <strong className="text-indigo-400 font-mono">174,150 TND</strong> (Fret payé par tiers)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d152a] p-4 rounded-xl border border-slate-850 flex flex-col justify-center space-y-3 text-[11px]">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">💡 Recommandation Stratégique Elyssa</span>
                <p className="leading-relaxed">
                  L'achat en <strong>Incoterm FOB</strong> combiné avec une négociation directe des contrats cadres de fret maritime avec des transporteurs (ex: MSC, CMA CGM Tunisie) permet généralement d'économiser jusqu'à <strong>15% sur le Landed Cost unitaire</strong> par rapport à un Incoterm CIF sur-facturé par les fournisseurs d'additifs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 4: CUSTOMS REGULATIONS */}
      {activeSubTab === 'customs' && (
        <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Dédouanement & Réglementation Douanière Tunisienne
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Coordination réglementaire avec l'administration douanière (TTN - Tunisia Trade Net) pour l'approvisionnement d'Elyssa.
              </p>
            </div>
            <span className="text-[9px] font-black text-rose-400 bg-rose-950/20 border border-rose-900/40 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Tunisia Trade Net (TTN) Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-sans">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                1. Les Régimes Suspensifs d'Importation
              </h4>
              
              <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="font-extrabold text-white text-[11px]">Régime d'Admission Temporaire (Code D8)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Permet d'importer des intrants ou matières premières d'origine étrangère en suspension totale des droits de douane et de la TVA, à condition qu'ils soient re-manufacturés et exportés à l'étranger dans un délai légal de 12 mois.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-extrabold text-white text-[11px]">Entrepôt Privé Industriels sous Douane</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Elyssa Distribution S.A. est autorisée à stocker des marchandises non dédouanées dans son entrepôt sécurisé de Sfax pour différer le paiement des droits de douanes jusqu'au jour de la mise en consommation réelle des produits.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                2. Coordination de Transit sur les Ports Principaux
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
                      <Anchor className="w-4 h-4 text-blue-400" />
                      Port de Radès (Gouvernorat de Ben Arous)
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">Terminal Conteneurs</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Point névralgique par lequel transitent nos cargaisons de Marseille et Gênes. Les frais d'acconage de la STAM (Société Tunisienne d'Acconage et de Manutention) y sont facturés au prorata du poids brut en TND.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
                      <Anchor className="w-4 h-4 text-teal-400" />
                      Port Commercial de Sfax-Ghannouch
                    </span>
                    <span className="text-[9px] font-bold text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded">Vrac & Matériaux</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Privilégié pour les livraisons volumineuses destinées directement à notre succursale industrielle de Sfax. Idéal pour minimiser le coût de transport national par rapport à un débarquement au nord à Radès.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 5: LETTER OF CREDIT (L/C) MANAGER */}
      {activeSubTab === 'lc_manager' && (
        <div className="space-y-6">
          
          {/* L/C Key Metrics at the top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0e172e] p-4 rounded-2xl border border-slate-800/65 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Crédocs Actifs (Émis)</span>
                <span className="text-xl font-black text-white mt-1.5 block font-mono">
                  {lcStats.totalEUR.toLocaleString()} EUR
                </span>
                {lcStats.totalUSD > 0 && (
                  <span className="text-xs font-bold text-indigo-400 font-mono">
                    + {lcStats.totalUSD.toLocaleString()} USD
                  </span>
                )}
                <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Couvert par garantie bancaire</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#0e172e] p-4 rounded-2xl border border-slate-800/65 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">En attente d'émission</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">{lcStats.pendingCount}</span>
                <span className="text-[9px] text-slate-550 font-medium block mt-0.5">Dossiers déposés aux agences</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#0e172e] p-4 rounded-2xl border border-slate-800/65 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Crédocs Ouverts / Actifs</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">{lcStats.activeCount}</span>
                <span className="text-[9px] text-slate-550 font-medium block mt-0.5">Engagements de paiement en cours</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#0e172e] p-4 rounded-2xl border border-slate-800/65 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total Dossiers Crédoc</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 block font-mono">{lcStats.totalCount}</span>
                <span className="text-[9px] text-slate-550 font-medium block mt-0.5">Base historique Elyssa S.A.</span>
              </div>
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Grid: L/C list & Detail/Official Letter generation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: LC List, Search & Actions */}
            <div className="lg:col-span-4 bg-[#080f21] p-4.5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <span className="text-[11px] font-black text-white uppercase tracking-wider">Dossiers Crédoc</span>
                <button
                  onClick={() => {
                    // Pre-initialize forms
                    setLcForm_docs([
                      'Facture Commerciale signée en 3 exemplaires originaux',
                      'Jeu complet de Connaissement Maritime (Bill of Lading) Clean on Board',
                      'Certificat de circulation EUR.1 original',
                      'Note de Colisage (Packing List) détaillée'
                    ]);
                    if (selectedFolder) {
                      populateLcFormFromFolder(selectedFolder.id);
                    }
                    setShowCreateLcModal(true);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau Crédoc
                </button>
              </div>

              {/* Search & Status Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher proforma, banque..."
                    value={lcSearchTerm}
                    onChange={(e) => setLcSearchTerm(e.target.value)}
                    className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-9 text-[11px] font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <select
                  value={lcStatusFilter}
                  onChange={(e) => setLcStatusFilter(e.target.value)}
                  className="w-full bg-[#0d152a] border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Tous les statuts</option>
                  <option value="Draft">Brouillon (Création)</option>
                  <option value="Submitted">Déposée (Banque)</option>
                  <option value="Opened">Émise/Ouverte (Active)</option>
                  <option value="Settled">Apurée/Réglée</option>
                  <option value="Cancelled">Annulée</option>
                </select>
              </div>

              {/* LC List Container */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredLcRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-medium">
                    Aucun dossier de lettre de crédit trouvé.
                  </div>
                ) : (
                  filteredLcRequests.map((lc) => {
                    const isSelected = lc.id === selectedLcId;
                    return (
                      <div
                        key={lc.id}
                        onClick={() => setSelectedLcId(lc.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected 
                            ? 'bg-indigo-950/20 border-indigo-500/75 shadow-md shadow-indigo-650/5' 
                            : 'bg-[#0d152a]/60 border-slate-850 hover:bg-[#0e172e] hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white font-mono tracking-wider">{lc.lcReference}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            lc.status === 'Draft' ? 'bg-slate-800 text-slate-400' :
                            lc.status === 'Submitted' ? 'bg-amber-950/80 text-amber-300 border border-amber-900/30' :
                            lc.status === 'Opened' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                            lc.status === 'Settled' ? 'bg-blue-950 text-blue-300 border border-blue-800/40' :
                            'bg-rose-950/80 text-rose-300 border border-rose-900/40'
                          }`}>
                            {lc.status === 'Draft' ? 'Brouillon' :
                             lc.status === 'Submitted' ? 'Déposée' :
                             lc.status === 'Opened' ? 'Émise SWIFT' :
                             lc.status === 'Settled' ? 'Apurée' : 'Annulée'}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-1">
                          <p className="font-extrabold text-slate-200 line-clamp-1">{lc.beneficiaryName}</p>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800/40 text-[9px] font-mono">
                            <span>Facture: {lc.proformaInvoiceRef}</span>
                            <span className="font-bold text-indigo-400 text-[10px]">{lc.amount.toLocaleString()} {lc.currency}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Detailed View & Document / Swift printing */}
            <div className="lg:col-span-8 space-y-5">
              {selectedLC ? (
                <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-6">
                  
                  {/* Detailed view Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-white font-mono tracking-tight">{selectedLC.lcReference}</h2>
                        <span className="text-xs text-slate-500 font-bold">|</span>
                        <p className="text-xs text-indigo-400 font-black uppercase tracking-wider">Demande de Crédoc Bancaire</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans">
                        Généré suivant la facture proforma <strong className="text-slate-200">{selectedLC.proformaInvoiceRef}</strong> du {selectedLC.proformaInvoiceDate} de {selectedLC.beneficiaryName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteLcRequest(selectedLC.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer border-0"
                        title="Supprimer le Crédoc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interractive Workflow Stepper */}
                  <div className="p-4 bg-[#0d152a]/70 rounded-xl border border-slate-850 space-y-4">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Suivi d'Ouverture du Crédoc</span>
                    
                    <div className="flex items-center justify-between">
                      {/* Step 1: Draft */}
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedLC.status === 'Draft' ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-indigo-950 text-indigo-400 border border-indigo-700/50'
                        }`}>
                          1
                        </div>
                        <span className="text-[9px] font-extrabold mt-1.5 text-slate-300">Brouillon</span>
                      </div>

                      <div className="h-0.5 bg-slate-800 flex-1 -mt-4"></div>

                      {/* Step 2: Submitted */}
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedLC.status === 'Submitted' ? 'bg-amber-600 text-white ring-4 ring-amber-500/20' : 
                          ['Opened', 'Settled'].includes(selectedLC.status) ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          2
                        </div>
                        <span className="text-[9px] font-extrabold mt-1.5 text-slate-300">Déposée</span>
                      </div>

                      <div className="h-0.5 bg-slate-800 flex-1 -mt-4"></div>

                      {/* Step 3: Opened */}
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedLC.status === 'Opened' ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' :
                          ['Settled'].includes(selectedLC.status) ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          3
                        </div>
                        <span className="text-[9px] font-extrabold mt-1.5 text-slate-300">Émise SWIFT</span>
                      </div>

                      <div className="h-0.5 bg-slate-800 flex-1 -mt-4"></div>

                      {/* Step 4: Settled */}
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedLC.status === 'Settled' ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-900 text-slate-500'
                        }`}>
                          4
                        </div>
                        <span className="text-[9px] font-extrabold mt-1.5 text-slate-300">Apurée</span>
                      </div>
                    </div>

                    {/* Quick status transition actions */}
                    <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-800/50 mt-2">
                      {selectedLC.status === 'Draft' && (
                        <button
                          onClick={() => handleUpdateLcStatus(selectedLC.id, 'Submitted')}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          Déposer le Dossier à l'agence
                        </button>
                      )}

                      {selectedLC.status === 'Submitted' && (
                        <button
                          onClick={() => handleUpdateLcStatus(selectedLC.id, 'Opened')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Confirmer l'ouverture (SWIFT MT700)
                        </button>
                      )}

                      {selectedLC.status === 'Opened' && (
                        <button
                          onClick={() => handleUpdateLcStatus(selectedLC.id, 'Settled')}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marquer le Crédoc comme Apuré / Payé
                        </button>
                      )}

                      {selectedLC.status !== 'Settled' && selectedLC.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleUpdateLcStatus(selectedLC.id, 'Cancelled')}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer"
                        >
                          Annuler
                        </button>
                      )}

                      {selectedLC.status === 'Cancelled' && (
                        <button
                          onClick={() => handleUpdateLcStatus(selectedLC.id, 'Draft')}
                          className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer border-0"
                        >
                          Remettre en Brouillon
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inner Tabs: Details vs. Official Printable Letter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Column 1: Core Details Grid */}
                    <div className="bg-[#0d152a]/60 p-4 rounded-xl border border-slate-850/60 space-y-4">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block border-b border-slate-800 pb-1">Spécifications du Crédoc</span>
                      
                      <div className="grid grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Banque Émettrice (Tunisie)</span>
                          <span className="font-extrabold text-white block mt-0.5 line-clamp-1">{selectedLC.issuingBank}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Banque Notificatrice</span>
                          <span className="font-extrabold text-white block mt-0.5 line-clamp-1">{selectedLC.advisingBank}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Bénéficiaire Expatrié</span>
                          <span className="font-extrabold text-indigo-400 block mt-0.5">{selectedLC.beneficiaryName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Montant du Crédoc</span>
                          <span className="font-black text-emerald-400 block mt-0.5 font-mono">{selectedLC.amount.toLocaleString()} {selectedLC.currency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Mode de Règlement</span>
                          <span className="font-extrabold text-slate-300 block mt-0.5">
                            {selectedLC.paymentTerms === 'At Sight' ? 'À vue (At Sight)' :
                             selectedLC.paymentTerms === 'Deferred 30 Days' ? 'À 30 jours (Date B/L)' :
                             selectedLC.paymentTerms === 'Deferred 60 Days' ? 'À 60 jours (Date B/L)' :
                             selectedLC.paymentTerms === 'Deferred 90 Days' ? 'À 90 jours (Date B/L)' : 'À 120 jours'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Date Limite d'Embarquement</span>
                          <span className="font-bold text-slate-300 block mt-0.5 font-mono">{selectedLC.shipmentDeadline}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Validité / Expiration</span>
                          <span className="font-bold text-rose-400 block mt-0.5 font-mono">{selectedLC.expiryDate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Routage Maritime</span>
                          <span className="font-medium text-slate-300 block mt-0.5 line-clamp-1">{selectedLC.portOfLoading} ➔ Port de {selectedLC.portOfDischarge}</span>
                        </div>
                      </div>

                      {selectedLC.additionalConditions && (
                        <div className="pt-3 border-t border-slate-800/60">
                          <span className="text-[9px] text-slate-550 font-bold uppercase block">Conditions Particulières SWIFT :</span>
                          <p className="text-[10px] text-slate-400 italic leading-relaxed mt-1">{selectedLC.additionalConditions}</p>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Documents Checklist & validation */}
                    <div className="bg-[#0d152a]/60 p-4 rounded-xl border border-slate-850/60 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block border-b border-slate-800 pb-1">Dossier de Documents Requis</span>
                        
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          La banque ne libèrera le paiement au fournisseur étranger que sur présentation stricte de ces justificatifs conformes aux guichets tunisiens. Cochez les documents prêts :
                        </p>

                        <div className="space-y-2 pt-1">
                          {selectedLC.requiredDocuments.map((doc, idx) => {
                            const isDocChecked = checkedDocs[`${selectedLC.id}_${idx}`] || false;
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleCheckedDoc(selectedLC.id, idx)}
                                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition border text-[10px] font-sans ${
                                  isDocChecked 
                                    ? 'bg-indigo-950/10 border-indigo-900/50 text-slate-200' 
                                    : 'bg-[#060b18] border-slate-850 text-slate-450 hover:border-slate-800'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                  isDocChecked ? 'bg-indigo-650 border-indigo-500 text-white' : 'border-slate-700'
                                }`}>
                                  {isDocChecked && <span className="text-[8px] font-black">✓</span>}
                                </div>
                                <span className={isDocChecked ? 'font-medium' : 'line-through opacity-70'}>{doc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-[#080f21] p-3 rounded-lg border border-slate-850 text-[10px] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-400">
                          <Info className="w-4 h-4 shrink-0" />
                          <span className="font-bold">Réglementation BCT (Tunisie) :</span>
                        </div>
                        <span className="text-slate-400 text-[9px]">Le crédit doit respecter la circulaire n° 2017-09.</span>
                      </div>
                    </div>
                  </div>

                  {/* PDF-like Official Letter View (Paper look) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">
                        Aperçu de la Demande d'Ouverture Officielle (A4 Prêt pour la Banque)
                      </span>
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer border-0 shadow-sm self-start sm:self-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer la Demande de Crédoc
                      </button>
                    </div>

                    <div id="printable-lc-document" className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 max-w-3xl mx-auto font-serif text-[11px] leading-relaxed relative overflow-hidden">
                      {/* Paper Background Details */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-650"></div>
                      
                      {/* Letterhead */}
                      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-3">
                          <ElyssaLogo className="w-12 h-12 rounded-xl bg-slate-900 p-2 shrink-0 border border-slate-800" />
                          <div>
                            <h4 className="font-sans font-black text-slate-950 uppercase tracking-widest text-xs">ELYSSA DISTRIBUTION S.A.</h4>
                            <p className="text-[9px] font-sans text-slate-500 font-bold mt-0.5">Importation & Distribution Industrielle</p>
                            <p className="text-[8px] font-sans text-slate-500">Zone Industrielle Ghannouch, Sfax, Tunisie</p>
                            <p className="text-[8px] font-sans text-slate-500">M.F: 1459203/A/M/000 • Tél: +216 74 400 500</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-slate-100 font-sans font-extrabold text-[8px] rounded uppercase tracking-wider border border-slate-300">
                            DOC-ID: LC-{selectedLC.proformaInvoiceRef}
                          </span>
                          <p className="text-[8px] font-sans text-slate-400 mt-1">Sfax, le {selectedLC.creationDate}</p>
                        </div>
                      </div>

                      {/* Letter content */}
                      <div className="mt-6 space-y-4">
                        {/* Address Block */}
                        <div className="flex justify-end">
                          <div className="w-1/2 bg-slate-50 p-3 rounded border border-slate-100 font-sans text-[10px]">
                            <p className="font-black text-slate-950">À l'attention de Monsieur le Directeur</p>
                            <p className="font-bold text-slate-700 mt-1">{selectedLC.issuingBank}</p>
                            <p className="text-slate-500 mt-0.5">Sfax, Tunisie</p>
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="font-sans text-[10px]">
                          <p><strong className="text-slate-950 uppercase">Objet :</strong> Demande d'ouverture de Crédit Documentaire Irrévocable</p>
                          <p className="mt-1"><strong className="text-slate-950 uppercase">Réf :</strong> Proforma n° <strong className="text-indigo-700">{selectedLC.proformaInvoiceRef}</strong> du {selectedLC.proformaInvoiceDate}</p>
                        </div>

                        <p className="text-justify indent-8 text-slate-800">
                          Monsieur le Directeur, nous vous prions par la présente de bien vouloir procéder à l'ouverture d'un <strong>crédit documentaire irrévocable</strong> par transmission de message <strong>SWIFT MT700</strong> en faveur de notre partenaire exportateur désigné ci-après :
                        </p>

                        {/* Core Parameters Table */}
                        <table className="w-full border-collapse border border-slate-200 text-[10px] font-sans">
                          <tbody>
                            <tr className="bg-slate-50">
                              <td className="border border-slate-200 p-2 font-black text-slate-900 w-1/3">Bénéficiaire</td>
                              <td className="border border-slate-200 p-2 text-slate-800">{selectedLC.beneficiaryName} <br /> <span className="text-[8px] text-slate-500">{selectedLC.beneficiaryAddress}</span></td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 p-2 font-black text-slate-900">Montant Global</td>
                              <td className="border border-slate-200 p-2 font-bold text-slate-900">{selectedLC.amount.toLocaleString()} {selectedLC.currency}</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <td className="border border-slate-200 p-2 font-black text-slate-900">Banque Notificatrice</td>
                              <td className="border border-slate-200 p-2 text-slate-800">{selectedLC.advisingBank}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 p-2 font-black text-slate-900">Conditions de Paiement</td>
                              <td className="border border-slate-200 p-2 text-slate-800 font-bold">
                                {selectedLC.paymentTerms === 'At Sight' ? 'Paiement à vue à réception des documents conformes' :
                                 selectedLC.paymentTerms === 'Deferred 30 Days' ? 'Paiement différé à 30 jours de la date de connaissement' :
                                 selectedLC.paymentTerms === 'Deferred 60 Days' ? 'Paiement différé à 60 jours de la date de connaissement' :
                                 selectedLC.paymentTerms === 'Deferred 90 Days' ? 'Paiement différé à 90 jours de la date de connaissement (B/L)' :
                                 'Paiement différé à 120 jours de la date de connaissement (B/L)'}
                              </td>
                            </tr>
                            <tr className="bg-slate-50">
                              <td className="border border-slate-200 p-2 font-black text-slate-900">Détails d'Expédition</td>
                              <td className="border border-slate-200 p-2 text-slate-800">
                                <strong>Embarquement :</strong> {selectedLC.portOfLoading} <br />
                                <strong>Déchargement :</strong> Port de {selectedLC.portOfDischarge}, Tunisie
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 p-2 font-black text-slate-900">Délais Rigoureux</td>
                              <td className="border border-slate-200 p-2 text-slate-800">
                                <strong>Embarquement max :</strong> {selectedLC.shipmentDeadline} <br />
                                <strong>Validité / Expiration :</strong> {selectedLC.expiryDate} en Tunisie
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Goods Description */}
                        <div>
                          <p className="font-sans font-extrabold text-[9px] text-slate-900 uppercase tracking-wider mb-1">
                            Désignation Sommaire des Marchandises (Incoterm {selectedFolder ? selectedFolder.incoterm : 'FOB'}) :
                          </p>
                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded font-sans text-[9px] text-slate-700">
                            {selectedFolder ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {selectedFolder.items.map((it, idx) => (
                                  <li key={idx}>
                                    <strong>{it.productName}</strong> - Qté: {it.quantity} unités × {it.fobUnitPrice} {selectedLC.currency}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>Matières premières et intrants industriels à destination de notre entrepôt agréé par la Douane.</p>
                            )}
                          </div>
                        </div>

                        {/* Required Documents List */}
                        <div>
                          <p className="font-sans font-extrabold text-[9px] text-slate-900 uppercase tracking-wider mb-1">
                            Documents Requis pour Négociation (Message SWIFT MT700) :
                          </p>
                          <ol className="list-decimal pl-4 font-sans text-[9px] text-slate-700 space-y-1">
                            {selectedLC.requiredDocuments.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ol>
                        </div>

                        {selectedLC.additionalConditions && (
                          <p className="text-[9px] text-slate-500 italic font-sans leading-relaxed">
                            <strong>Note additionnelle :</strong> {selectedLC.additionalConditions}
                          </p>
                        )}

                        <p className="text-justify indent-8 text-slate-800">
                          Nous vous autorisons à débiter notre compte courant n° <strong>03-094-102948192-48</strong> ouvert dans vos livres de la commission d'ouverture légale ainsi que des frais réglementaires inhérents à cette transaction.
                        </p>

                        <p className="text-slate-800">
                          En vous remerciant de votre habituelle collaboration, nous vous prions d'agréer, Monsieur le Directeur, l'expression de nos salutations distinguées.
                        </p>

                        {/* Rubber Stamp and Signature section */}
                        <div className="pt-4 flex justify-between items-center font-sans">
                          <div className="text-[8px] text-slate-400">
                            Copie : Service Transit & Dédouanement Elyssa S.A.
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-[9px] text-slate-900">Pour ELYSSA DISTRIBUTION S.A.</p>
                            <p className="text-[8px] text-slate-500 mt-0.5">Le Directeur Général</p>
                            
                            {/* Visual Rubber Stamp */}
                            <div className="mt-2.5 mx-auto w-24 h-12 border-2 border-dashed border-indigo-700/60 rounded flex items-center justify-center text-indigo-700/70 font-black text-[9px] uppercase tracking-widest rotate-2 select-none">
                              ELYSSA S.A. <br /> SFAX / TUNIS
                            </div>
                          </div>
                        </div>

                        {/* Corporate Premium Footer */}
                        <div className="border-t border-slate-200 pt-3 mt-8 text-center text-[8.5px] text-slate-400 font-sans space-y-0.5 tracking-wide">
                          <p className="font-bold">Elyssa ERP Suite • Document de Transit & Crédit Documentaire Officiel</p>
                          <p>Elyssa Distribution S.A. au capital de 500.000 DT - RNE 1832049Z - MF 1459203/A/M/000 - Boulevard de l'Environnement, Sfax, Tunisie</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#080f21] p-12 rounded-2xl border border-slate-800/80 text-center text-slate-500 text-xs">
                  Aucun dossier de crédit documentaire sélectionné. Veuillez en sélectionner un ou en créer un nouveau.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 6: CONFIGURATION TRANSIT */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Ports & Transit Agents */}
          <div className="space-y-6">
            {/* Custom Ports list */}
            <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Anchor className="w-4 h-4 text-indigo-400" />
                <span>Bureaux de Douane & Plateformes Portuaires</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Gérez la liste des ports maritimes et aéroports tunisiens habilités pour vos opérations d'importation et d'exportation.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {portsList.map((port, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#0d152a] border border-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-200 font-mono">Port / Aéroport de {port}</span>
                    {portsList.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = portsList.filter((_, i) => i !== idx);
                          updatePortsList(updated);
                        }}
                        className="p-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition cursor-pointer"
                        title="Supprimer la plateforme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Port Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const val = new FormData(target).get('newPortVal') as string;
                  if (val && val.trim()) {
                    updatePortsList([...portsList, val.trim()]);
                    target.reset();
                  }
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  name="newPortVal"
                  type="text"
                  placeholder="Ex : Gabès, Zarzis..."
                  required
                  className="flex-1 bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                />
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-600 text-white p-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </form>
            </div>

            {/* Custom Transit Agents */}
            <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Ship className="w-4 h-4 text-indigo-400" />
                <span>Transitaires Tunisiens Agréés (Partenaires)</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Renseignez la liste de vos agences de transit partenaires pour les formalités de dédouanement et d'acconage.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {transittersList.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#0d152a] border border-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-200 font-semibold">{t}</span>
                    {transittersList.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = transittersList.filter((_, i) => i !== idx);
                          updateTransittersList(updated);
                        }}
                        className="p-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition cursor-pointer"
                        title="Supprimer le transitaire"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Transitter Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const val = new FormData(target).get('newTransVal') as string;
                  if (val && val.trim()) {
                    updateTransittersList([...transittersList, val.trim()]);
                    target.reset();
                  }
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  name="newTransVal"
                  type="text"
                  placeholder="Ex : Carthage Customs Transit..."
                  required
                  className="flex-1 bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                />
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-600 text-white p-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Exchange Rates & Port Costs */}
          <div className="bg-[#080f21] p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              <span>Devises & Devis Logistiques Standard</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Ajustez le cours moyen des principales devises d'achat/vente par rapport au Dinar Tunisien (TND) et configurez les frais d'expédition moyens.
            </p>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] font-sans font-extrabold text-slate-400 block uppercase tracking-wider">Taux EUR ➔ TND (BCT) :</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="1"
                      value={eurToTndRate}
                      onChange={(e) => updateEurToTndRate(Number(e.target.value))}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-sans">TND</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] font-sans font-extrabold text-slate-400 block uppercase tracking-wider">Taux USD ➔ TND (BCT) :</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="1"
                      value={usdToTndRate}
                      onChange={(e) => updateUsdToTndRate(Number(e.target.value))}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-sans">TND</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] font-sans font-extrabold text-slate-400 block uppercase tracking-wider">Forfait Moyen Fret Maritime (TND) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={defaultFreightFee}
                    onChange={(e) => updateDefaultFreightFee(Number(e.target.value))}
                    className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-sans">TND</span>
                </div>
              </div>

              {/* Live exchange rate comparison cards */}
              <div className="bg-[#0b1326] p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Aperçu Comparatif Arbitrage devises</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0d152a] rounded-lg border border-slate-850">
                    <span className="text-slate-500 text-[9px] uppercase font-bold block">Conteneur Standard (EUR) :</span>
                    <span className="text-xs font-black text-slate-300 font-mono">
                      {(defaultFreightFee / eurToTndRate).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="p-3 bg-[#0d152a] rounded-lg border border-slate-850">
                    <span className="text-slate-500 text-[9px] uppercase font-bold block">Conteneur Standard (USD) :</span>
                    <span className="text-xs font-black text-slate-300 font-mono">
                      {(defaultFreightFee / usdToTndRate).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} $
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 leading-normal pt-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Ces taux sont utilisés par Elyssa ERP pour les fiches pro-forma import/export et le Crédit Documentaire.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE IMPORT DOSSIER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <form onSubmit={handleCreateFolder} className="p-5.5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    Créer un Dossier {newFolderType === 'Export' ? "d'Exportation" : "d'Importation"}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white text-xs uppercase font-extrabold border-0 bg-transparent cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>

                {/* Type selection pills */}
                <div className="grid grid-cols-2 gap-2 bg-[#0d152a] p-1 rounded-xl border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderType('Import');
                      if (!newFolderRef || newFolderRef.startsWith('EXP-')) {
                        setNewFolderRef('IMP-2026-');
                      }
                    }}
                    className={`text-center py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer border-0 ${
                      newFolderType === 'Import'
                        ? 'bg-indigo-650 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    Dossier d'Importation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderType('Export');
                      if (!newFolderRef || newFolderRef.startsWith('IMP-')) {
                        setNewFolderRef('EXP-2026-');
                      }
                    }}
                    className={`text-center py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer border-0 ${
                      newFolderType === 'Export'
                        ? 'bg-indigo-650 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    Dossier d'Exportation
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Référence Dossier {newFolderType === 'Export' ? "(ex: EXP-2026-004)" : "(ex: IMP-2026-004)"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={newFolderType === 'Export' ? "EXP-2026-..." : "IMP-2026-..."}
                      value={newFolderRef}
                      onChange={(e) => setNewFolderRef(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {newFolderType === 'Export' ? "Nom du Client Étranger" : "Nom du Fournisseur Étranger"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={newFolderType === 'Export' ? "Tripoli Chem, Algiers Trading..." : "Marseille SAS, Hambourg Gmbh..."}
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {newFolderType === 'Export' ? "Pays de Destination" : "Pays de Provenance d'Origine"}
                    </label>
                    <input
                      type="text"
                      placeholder={newFolderType === 'Export' ? "Libye, Algérie, Maroc..." : "France, Allemagne, Italie..."}
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {newFolderType === 'Export' ? "Port de Départ Tunisien" : "Port d'Arrivée Tunisien"}
                    </label>
                    <select
                      value={newPort}
                      onChange={(e) => setNewPort(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {portsList.map(p => (
                        <option key={p} value={p}>Port/Aérop. de {p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Transitaire Tunisien Partenaire
                    </label>
                    <select
                      value={newTransitter}
                      onChange={(e) => setNewTransitter(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {transittersList.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {newFolderType === 'Export' ? "Incoterm ICC de Vente" : "Incoterm ICC d'Achat"}
                    </label>
                    <select
                      value={newIncoterm}
                      onChange={(e) => setNewIncoterm(e.target.value as any)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="FOB">FOB (Franco à Bord)</option>
                      <option value="CIF">CIF (Fret & Assurance payés)</option>
                      <option value="EXW">EXW (Départ Usine)</option>
                      <option value="CFR">CFR (Fret payé)</option>
                      <option value="DDP">DDP (Droits acquittés)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        {newFolderType === 'Export' ? "Devise de Vente" : "Devise d'Achat"}
                      </label>
                      <select
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value as any)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cours TND</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newExchangeRate}
                        onChange={(e) => setNewExchangeRate(parseFloat(e.target.value) || 3.42)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Subform: items container */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">
                    {newFolderType === 'Export' ? "Ajouter des articles au dossier d'exportation" : "Ajouter des articles au dossier d'importation"}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Désignation Produit"
                        value={tempItemName}
                        onChange={(e) => setTempItemName(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Quantité"
                        value={tempItemQty || ''}
                        onChange={(e) => setTempItemQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Prix FOB Devise"
                        value={tempItemFobPrice || ''}
                        onChange={(e) => setTempItemFobPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddTempItem}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] py-2 rounded-lg transition uppercase cursor-pointer border-0"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Added items list */}
                  {newItems.length > 0 && (
                    <div className="divide-y divide-slate-850 pt-2 text-[10px]">
                      {newItems.map((it, idx) => (
                        <div key={it.id} className="flex justify-between items-center py-1.5">
                          <span className="font-extrabold text-slate-300">{idx+1}. {it.productName}</span>
                          <span className="font-mono text-slate-450">{it.quantity} unités × {it.fobUnitPrice} {newCurrency} = {it.quantity * it.fobUnitPrice} {newCurrency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submitting CTAs */}
                <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-1/2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-xs uppercase py-3 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={newItems.length === 0}
                    className={`w-1/2 font-black text-xs py-3 rounded-xl transition uppercase border-0 cursor-pointer ${
                      newItems.length === 0 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-650 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    Enregistrer le Dossier
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE LETTER OF CREDIT MODAL */}
      <AnimatePresence>
        {showCreateLcModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 text-xs text-slate-200"
            >
              <form onSubmit={handleCreateLCRequest} className="p-5.5 space-y-4">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Ouvrir un Dossier de Crédit Documentaire (Crédoc)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Dossier réglementaire basé sur la facture proforma de l'exportateur</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateLcModal(false)}
                    className="text-slate-400 hover:text-white text-xs uppercase font-extrabold border-0 bg-transparent cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>

                {/* Auto-populate from Import Folder Helper */}
                <div className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl space-y-2">
                  <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider block">Générer à partir d'un Dossier d'Importation Existante</span>
                  <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Sélectionner un dossier d'importation d'Elyssa</label>
                      <select
                        value={lcForm_importFolderId}
                        onChange={(e) => {
                          setLcForm_importFolderId(e.target.value);
                          if (e.target.value) populateLcFormFromFolder(e.target.value);
                        }}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-1.5 px-3 text-[11px] text-white focus:outline-none"
                      >
                        <option value="">-- Saisie libre manuelle (Sans lien de dossier) --</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.reference} - {f.supplierName} ({f.incoterm})</option>
                        ))}
                      </select>
                    </div>
                    {lcForm_importFolderId && (
                      <button
                        type="button"
                        onClick={() => populateLcFormFromFolder(lcForm_importFolderId)}
                        className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl transition cursor-pointer border-0"
                      >
                        Réinitialiser & Recharger
                      </button>
                    )}
                  </div>
                </div>

                {/* Main parameters block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Left Column forms */}
                  <div className="space-y-3.5">
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block border-b border-slate-800 pb-1">1. Références Proforma</span>
                    
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">N° de Facture Proforma *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: PROFORMA-1029"
                        value={lcForm_proformaRef}
                        onChange={(e) => setLcForm_proformaRef(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date de la Proforma *</label>
                      <input
                        type="date"
                        required
                        value={lcForm_proformaDate}
                        onChange={(e) => setLcForm_proformaDate(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fournisseur Bénéficiaire *</label>
                      <input
                        type="text"
                        required
                        placeholder="Société expéditrice"
                        value={lcForm_beneficiaryName}
                        onChange={(e) => setLcForm_beneficiaryName(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Adresse Complète du Bénéficiaire</label>
                      <textarea
                        rows={2}
                        placeholder="Adresse pour le message SWIFT..."
                        value={lcForm_beneficiaryAddress}
                        onChange={(e) => setLcForm_beneficiaryAddress(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-1.5 px-3 text-white focus:outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Middle Column forms */}
                  <div className="space-y-3.5">
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block border-b border-slate-800 pb-1">2. Routage & Banque</span>
                    
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Banque Émettrice (Tunisie) *</label>
                      <select
                        value={lcForm_issuingBank}
                        onChange={(e) => setLcForm_issuingBank(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none cursor-pointer"
                      >
                        <option value="BIAT - Banque Internationale Arabe de Tunisie">BIAT - Banque Internationale Arabe de Tunisie</option>
                        <option value="AMEN BANK - S.A.">AMEN BANK</option>
                        <option value="ATTIJARI BANK - Tunisie">ATTIJARI BANK</option>
                        <option value="BANQUE DE TUNISIE (BT) - S.A.">BANQUE DE TUNISIE (BT)</option>
                        <option value="STB - Société Tunisienne de Banque">STB - Société Tunisienne de Banque</option>
                        <option value="BH BANK - S.A.">BH BANK</option>
                        <option value="UIB - Union Internationale de Banques">UIB - Union Internationale de Banques</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Banque Notificatrice (Étranger)</label>
                      <input
                        type="text"
                        placeholder="Correspondant Swift (ex: BNP Paribas)"
                        value={lcForm_advisingBank}
                        onChange={(e) => setLcForm_advisingBank(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Montant FOB *</label>
                        <input
                          type="number"
                          required
                          value={lcForm_amount || ''}
                          onChange={(e) => setLcForm_amount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Devise *</label>
                        <select
                          value={lcForm_currency}
                          onChange={(e) => setLcForm_currency(e.target.value as any)}
                          className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none cursor-pointer font-mono"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Conditions de Paiement *</label>
                      <select
                        value={lcForm_paymentTerms}
                        onChange={(e) => setLcForm_paymentTerms(e.target.value as any)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none cursor-pointer"
                      >
                        <option value="At Sight">À vue (At Sight)</option>
                        <option value="Deferred 30 Days">Différé à 30 jours (Date B/L)</option>
                        <option value="Deferred 60 Days">Différé à 60 jours (Date B/L)</option>
                        <option value="Deferred 90 Days">Différé à 90 jours (Date B/L)</option>
                        <option value="Deferred 120 Days">Différé à 120 jours (Date B/L)</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column forms */}
                  <div className="space-y-3.5">
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block border-b border-slate-800 pb-1">3. Conditions Temporelles</span>
                    
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Port d'Embarquement (Chargement)</label>
                      <input
                        type="text"
                        placeholder="ex: Port de Marseille, France"
                        value={lcForm_portOfLoading}
                        onChange={(e) => setLcForm_portOfLoading(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Port de Déchargement Tunisien *</label>
                      <select
                        value={lcForm_portOfDischarge}
                        onChange={(e) => setLcForm_portOfDischarge(e.target.value as any)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Radès">Port de Radès</option>
                        <option value="Sfax">Port de Sfax</option>
                        <option value="Enfidha">Aéroport Enfidha</option>
                        <option value="Tunis-Carthage">Aéroport Tunis-Carthage</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date Limite d'Expédition *</label>
                      <input
                        type="date"
                        required
                        value={lcForm_shipmentDeadline}
                        onChange={(e) => setLcForm_shipmentDeadline(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date d'Expiration du Crédit *</label>
                      <input
                        type="date"
                        required
                        value={lcForm_expiryDate}
                        onChange={(e) => setLcForm_expiryDate(e.target.value)}
                        className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Required Documents checklist builder & specific conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Documents required Builder */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block mb-1.5">Documents requis à la négociation (SWIFT MT700)</span>
                      
                      {/* Interactive doc append list */}
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {lcForm_docs.map((doc, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 px-2 bg-[#0a0f1e] border border-slate-850 rounded text-[10px]">
                            <span className="font-medium text-slate-300 line-clamp-1">{idx+1}. {doc}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLcDoc(idx)}
                              className="text-rose-400 hover:text-rose-300 font-black cursor-pointer bg-transparent border-0 py-0 px-1 text-[11px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Nouveau document requis (ex: Certificat SGS...)"
                        value={newLcDocText}
                        onChange={(e) => setNewLcDocText(e.target.value)}
                        className="flex-1 bg-[#0d152a] border border-slate-800 rounded-lg py-1 px-2.5 text-[10px] text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddLcDoc}
                        className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg transition border-0 cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Conditions Spéciales Text Area */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Conditions Particulières / Instructions SWIFT Additionnelles</label>
                    <textarea
                      rows={5}
                      placeholder="ex: Expéditions partielles interdites. Transbordement autorisé. Tous les frais hors de Tunisie à la charge du bénéficiaire..."
                      value={lcForm_additionalConditions}
                      onChange={(e) => setLcForm_additionalConditions(e.target.value)}
                      className="w-full bg-[#0d152a] border border-slate-800 rounded-xl py-2 px-3 text-slate-200 focus:outline-none font-sans"
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-2.5 pt-3.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateLcModal(false)}
                    className="w-1/2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-xs uppercase py-3 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs py-3 rounded-xl transition uppercase border-0 cursor-pointer"
                  >
                    Créer le Dossier Crédoc (Brouillon)
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={standaloneMode === 'lc_only' ? 'lc_manager' : 'transit_logistique'}
        documentName={selectedLC ? `Lettre de Crédit LC-${selectedLC.proformaInvoiceRef}` : "Lettre de Crédit (Crédoc)"}
        printTarget="printable-lc-document"
      />

    </div>
  );
}
