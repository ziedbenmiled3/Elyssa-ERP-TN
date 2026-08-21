/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import corporateLogo from '../assets/images/elyssa_corporate_logo_1782209702209.jpg';
import faviconLogo from '../assets/images/elyssa_favicon_icon_1782209720262.jpg';
import { AdminSettings, Client, Complaint, Invoice, VisitReport, CompetitorReport, CollaboratorAccount, UserSession } from '../types';
import CollaboratorConsole from './CollaboratorConsole';
import { saveCompanyERPState, loadCompanyERPState, deleteCompanyFromDb, db, cleanFirestoreData } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import SecurityDashboard from './SecurityDashboard';
import RadarDashboard from './RadarDashboard';
import { ElyssaLogo } from './ElyssaLogo';
import { ModuleStore } from './admin/ModuleStore';
import { LicenseManager } from './admin/LicenseManager';
import { 
  Settings, 
  ShieldAlert, 
  Save, 
  FileDown, 
  FolderUp, 
  Users, 
  Percent, 
  Database,
  Building,
  KeyRound,
  Upload,
  Download,
  Image as ImageIcon,
  Globe,
  FileCode,
  Chrome,
  Check,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Info,
  ExternalLink,
  Radar,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Smartphone,
  Layers,
  Loader2
} from 'lucide-react';

interface AdminConsoleProps {
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  collaborators: CollaboratorAccount[];
  onUpdateCollaborators: (collabs: CollaboratorAccount[]) => void;
  allData: {
    clients: Client[];
    complaints: Complaint[];
    invoices: Invoice[];
    visitReports: VisitReport[];
    competitors: CompetitorReport[];
    suppliers?: any[];
    products?: any[];
    stockMovements?: any[];
    bankAccounts?: any[];
    bankTransactions?: any[];
    taxDeclarations?: any[];
    yearEndClosings?: any[];
  };
  onImportAllData: (importedData: any) => void;
  currentUser?: UserSession | null;
  publisherClients?: any[];
  onUpdatePublisherClients?: (clients: any[]) => void;
  mode?: 'company_settings' | 'admin';
  isTrial?: boolean;
  isDemoTenant?: boolean;
}

export default function AdminConsole({ 
  settings, 
  onUpdateSettings, 
  collaborators,
  onUpdateCollaborators,
  allData,
  onImportAllData,
  currentUser,
  publisherClients = [],
  onUpdatePublisherClients,
  mode = 'admin',
  isTrial = true,
  isDemoTenant
}: AdminConsoleProps) {
  const isDemoTenantMode = isDemoTenant || 
    settings.companyName === 'company_demo' || 
    settings.companyName?.toLowerCase().includes('démo') ||
    settings.companyName?.toLowerCase().includes('demo');

  const [publisherClientsList, setPublisherClientsList] = useState<any[]>(publisherClients);

  React.useEffect(() => {
    setPublisherClientsList(publisherClients);
  }, [publisherClients]);
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'collaborators' | 'security' | 'seo' | 'radar' | 'companies' | 'module_store' | 'licenses'>(
    mode === 'company_settings' ? 'settings' : 'collaborators'
  );
  const isClientCompany = settings.companyName.toLowerCase() !== "inter-affaires" && settings.companyName.toLowerCase() !== "elyssa entreprises s.a.";
  const [compName, setCompName] = useState(settings.companyName);
  const [vatRate, setVatRate] = useState<number>(settings.defaultVatRate);
  const [withholdingRate, setWithholdingRate] = useState<number>(settings.defaultWithholdingRate);
  const [threshold, setThreshold] = useState<number>(settings.withholdingThreshold);
  const [authorizedEmailsText, setAuthorizedEmailsText] = useState(settings.authorizedUsers.join(', '));
  const [compAddress, setCompAddress] = useState(settings.companyAddress || "");
  const [compPhone, setCompPhone] = useState(settings.companyPhone || "");
  const [compEmail, setCompEmail] = useState(settings.companyEmail || "");
  const [compMF, setCompMF] = useState(settings.companyMF || "");
  const [compLogo, setCompLogo] = useState(settings.companyLogo || "");
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");

  // Legal settings states
  const [legalForm, setLegalForm] = useState(settings.legalForm || "");
  const [shareCapital, setShareCapital] = useState<number>(settings.shareCapital || 0);
  const [rneNumber, setRneNumber] = useState(settings.rneNumber || "");
  const [legalRepresentative, setLegalRepresentative] = useState(settings.legalRepresentative || "");
  const [cityZipCode, setCityZipCode] = useState(settings.cityZipCode || "");
  const [website, setWebsite] = useState(settings.website || "");

  // SEO & Google tracking states
  const [gaId, setGaId] = useState(settings.googleAnalyticsId || "G-EY789X12");
  const [gAdsId, setGAdsId] = useState(settings.googleAdsId || "AW-120485934");
  const [robotsText, setRobotsText] = useState(settings.robotsTxt || "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n\nSitemap: https://elyssa.pro/sitemap.xml");
  const [sitemapText, setSitemapText] = useState(settings.sitemapXml || "https://elyssa.pro/\nhttps://elyssa.pro/login\nhttps://elyssa.pro/saas-config\nhttps://elyssa.pro/pricing\nhttps://elyssa.pro/finance-dashboard");
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle || "Elyssa CRM & ERP | Logiciel Intelligent de Facturation & Recouvrement en Tunisie");
  const [seoDesc, setSeoDesc] = useState(settings.seoDescription || "Le premier ERP & CRM conçu pour le marché tunisien. Facturation conforme (TVA & Retenue à la source), suivi de solvabilité, relances de créances automatisées et analyses prédictives par IA.");
  const [seoKeywords, setSeoKeywords] = useState(settings.seoKeywords || "CRM Tunisie, ERP Tunisie, Facturation Tunisie, Retenue à la source Tunisie, Recouvrement de créances, Trésorerie, Elyssa ERP, Elyssa CRM");
  const [ogImage, setOgImage] = useState(settings.ogImage || "");

  // Company management states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isDeletingCompany, setIsDeletingCompany] = useState<boolean>(false);
  const [editingCompanyPassword, setEditingCompanyPassword] = useState<string>('');
  const [editingCollaboratorId, setEditingCollaboratorId] = useState<string>('');
  const [editingCollaboratorPassword, setEditingCollaboratorPassword] = useState<string>('');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [isClearingDb, setIsClearingDb] = useState<boolean>(false);

  // Real database Cloud Sync states
  const [isUploadingToCloud, setIsUploadingToCloud] = useState<boolean>(false);
  const [isDownloadingFromCloud, setIsDownloadingFromCloud] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Gemini BYOK states
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [testingGeminiKey, setTestingGeminiKey] = useState<boolean>(false);
  const [geminiTestFeedback, setGeminiTestFeedback] = useState<{ valid: boolean; message: string } | null>(null);
  const [savingGeminiKey, setSavingGeminiKey] = useState<boolean>(false);
  const [geminiSaveFeedback, setGeminiSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestGeminiKey = async () => {
    setTestingGeminiKey(true);
    setGeminiTestFeedback(null);
    setGeminiSaveFeedback(null);
    try {
      const activeCompName = compName || settings.companyName || 'Inter-Affaires';
      const res = await fetch('/api/v1/ai/test-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': geminiApiKey
        },
        body: JSON.stringify({
          apiKey: geminiApiKey,
          companyId: activeCompName
        })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setGeminiTestFeedback({
          valid: true,
          message: data.message || 'Clé API Gemini 2.5 Flash valide et opérationnelle ! ✅'
        });
      } else {
        setGeminiTestFeedback({
          valid: false,
          message: data.error || 'Clé API invalide ou quota dépassé. ❌'
        });
      }
    } catch (err: any) {
      setGeminiTestFeedback({
        valid: false,
        message: 'Erreur lors du test de la clé : ' + (err?.message || 'Erreur réseau ❌')
      });
    } finally {
      setTestingGeminiKey(false);
    }
  };

  const handleSaveGeminiKeyCard = async () => {
    setSavingGeminiKey(true);
    setGeminiSaveFeedback(null);
    try {
      const activeCompName = compName || settings.companyName || 'Inter-Affaires';
      const updatedSettings: AdminSettings = {
        ...settings,
        companyName: activeCompName,
        defaultVatRate: Number(vatRate),
        defaultWithholdingRate: Number(withholdingRate),
        withholdingThreshold: Number(threshold),
        authorizedUsers: authorizedEmailsText.split(',').map(e => e.trim()).filter(Boolean),
        companyAddress: compAddress,
        companyPhone: compPhone,
        companyEmail: compEmail,
        companyMF: compMF,
        companyLogo: compLogo,
        geminiApiKey: geminiApiKey,
        legalForm,
        shareCapital: Number(shareCapital),
        rneNumber,
        legalRepresentative,
        cityZipCode,
        website
      };

      onUpdateSettings(updatedSettings);

      // Save directly to Firestore tenant document
      const docId = activeCompName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const docRef = doc(db, 'company_erp_data', docId);
      await setDoc(docRef, cleanFirestoreData({
        geminiApiKey: geminiApiKey,
        admin_settings: updatedSettings,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      setGeminiSaveFeedback({
        success: true,
        message: `Clé Gemini enregistrée avec succès pour ${activeCompName} ! ✅`
      });
      setTimeout(() => setGeminiSaveFeedback(null), 4000);
    } catch (err: any) {
      setGeminiSaveFeedback({
        success: false,
        message: `Erreur d'enregistrement : ${err?.message || 'Erreur inconnue ❌'}`
      });
    } finally {
      setSavingGeminiKey(false);
    }
  };

  const handleUploadToCloud = async () => {
    setIsUploadingToCloud(true);
    setCloudSyncStatus(null);
    try {
      const success = await saveCompanyERPState(settings.companyName, allData);
      if (success) {
        setCloudSyncStatus({
          type: 'success',
          message: 'Données sauvegardées avec succès dans Firestore !'
        });
      } else {
        setCloudSyncStatus({
          type: 'error',
          message: 'Erreur lors de la sauvegarde dans Firestore.'
        });
      }
    } catch (err: any) {
      setCloudSyncStatus({
        type: 'error',
        message: err.message || 'Erreur inattendue'
      });
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    setIsDownloadingFromCloud(true);
    setCloudSyncStatus(null);
    try {
      const cloudState = await loadCompanyERPState(settings.companyName);
      if (cloudState) {
        onImportAllData(cloudState);
        setCloudSyncStatus({
          type: 'success',
          message: 'Données cloud restaurées avec succès !'
        });
      } else {
        setCloudSyncStatus({
          type: 'error',
          message: 'Aucune donnée cloud trouvée pour cette entreprise.'
        });
      }
    } catch (err: any) {
      setCloudSyncStatus({
        type: 'error',
        message: err.message || 'Erreur inattendue'
      });
    } finally {
      setIsDownloadingFromCloud(false);
    }
  };

  // Administrative Collaborators & Inline Forms State
  const [adminCollaborators, setAdminCollaborators] = useState<any[]>(() => {
    if (Array.isArray(collaborators) && collaborators.length > 0) return collaborators;
    try {
      const saved = localStorage.getItem('elyssa_collaborators') || localStorage.getItem('carthage_collaborators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [collabForm, setCollabForm] = useState({
    id: '',
    name: '',
    role: 'Collaborateur',
    email: '',
    password: '',
    status: 'Active'
  });
  const [isEditingCollabRowId, setIsEditingCollabRowId] = useState<string>('');
  const [isAddingCollab, setIsAddingCollab] = useState<boolean>(false);

  // New States for Creating / Editing Companies
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    email: '',
    location: 'Tunisie',
    packId: 'trial',
    paymentGateway: 'Flouci',
    status: 'trial',
    joinedDate: new Date().toISOString().split('T')[0],
    password: ''
  });

  // Load administrative collaborators list
  React.useEffect(() => {
    let isMounted = true;
    const fetchAdminCollabs = async () => {
      try {
        const res = await fetch('/api/db/admin/collaborators', {
          headers: { 'Accept': 'application/json' }
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setAdminCollaborators(data);
            return;
          }
        }
      } catch (err) {
        console.warn("API /api/db/admin/collaborators unavailable, using local collaborators fallback:", err);
      }

      // Fallback
      if (isMounted) {
        if (Array.isArray(collaborators) && collaborators.length > 0) {
          setAdminCollaborators(prev => prev.length > 0 ? prev : collaborators);
        } else {
          try {
            const saved = localStorage.getItem('elyssa_collaborators') || localStorage.getItem('carthage_collaborators');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAdminCollaborators(prev => prev.length > 0 ? prev : parsed);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    };
    fetchAdminCollabs();
    return () => { isMounted = false; };
  }, [selectedCompanyId, collaborators]);

  // Sync edit form when selected company changes
  React.useEffect(() => {
    if (selectedCompanyId) {
      const comp = publisherClientsList.find(c => c.id === selectedCompanyId || c.company_id === selectedCompanyId || c.companyName === selectedCompanyId);
      if (comp) {
        setIsCreatingNew(false);
        setCompanyForm({
          companyName: comp.companyName || '',
          email: comp.email || '',
          location: comp.location || 'Tunisie',
          packId: comp.packId || 'trial',
          paymentGateway: comp.paymentGateway || 'Flouci',
          status: comp.status || 'trial',
          joinedDate: comp.joinedDate || new Date().toISOString().split('T')[0],
          password: comp.password || ''
        });
      }
    } else {
      // Clear form when nothing is selected
      setCompanyForm({
        companyName: '',
        email: '',
        location: 'Tunisie',
        packId: 'trial',
        paymentGateway: 'Flouci',
        status: 'trial',
        joinedDate: new Date().toISOString().split('T')[0],
        password: ''
      });
    }
  }, [selectedCompanyId, publisherClients]);

  // Sync state values when settings change dynamically (essential for switching tenant companies!)
  React.useEffect(() => {
    setCompName(settings.companyName);
    setVatRate(settings.defaultVatRate);
    setWithholdingRate(settings.defaultWithholdingRate);
    setThreshold(settings.withholdingThreshold);
    setAuthorizedEmailsText(settings.authorizedUsers?.join(', ') || '');
    setCompAddress(settings.companyAddress || "");
    setCompPhone(settings.companyPhone || "");
    setCompEmail(settings.companyEmail || "");
    setCompMF(settings.companyMF || "");
    setCompLogo(settings.companyLogo || "");
    setGeminiApiKey(settings.geminiApiKey || "");

    // Legal settings sync
    setLegalForm(settings.legalForm || "");
    setShareCapital(settings.shareCapital || 0);
    setRneNumber(settings.rneNumber || "");
    setLegalRepresentative(settings.legalRepresentative || "");
    setCityZipCode(settings.cityZipCode || "");
    setWebsite(settings.website || "");

    // SEO
    setGaId(settings.googleAnalyticsId || "G-EY789X12");
    setGAdsId(settings.googleAdsId || "AW-120485934");
    setRobotsText(settings.robotsTxt || "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n\nSitemap: https://elyssa.pro/sitemap.xml");
    setSitemapText(settings.sitemapXml || "https://elyssa.pro/\nhttps://elyssa.pro/login\nhttps://elyssa.pro/saas-config\nhttps://elyssa.pro/pricing\nhttps://elyssa.pro/finance-dashboard");
    setSeoTitle(settings.seoTitle || "Elyssa CRM & ERP | Logiciel Intelligent de Facturation & Recouvrement en Tunisie");
    setSeoDesc(settings.seoDescription || "Le premier ERP & CRM conçu pour le marché tunisien. Facturation conforme (TVA & Retenue à la source), suivi de solvabilité, relances de créances automatisées et analyses prédictives par IA.");
    setSeoKeywords(settings.seoKeywords || "CRM Tunisie, ERP Tunisie, Facturation Tunisie, Retenue à la source Tunisie, Recouvrement de créances, Trésorerie, Elyssa ERP, Elyssa CRM");
    setOgImage(settings.ogImage || "");
  }, [settings]);

  // Import-export variables
  const [backupText, setBackupText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);

  const compressImage = (
    base64Str: string,
    maxWidth: number,
    maxHeight: number,
    quality: number,
    callback: (compressed: string) => void
  ) => {
    if (base64Str.startsWith('data:image/svg+xml')) {
      callback(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        callback(compressedBase64);
      } else {
        callback(base64Str);
      }
    };
    img.onerror = () => {
      callback(base64Str);
    };
    img.src = base64Str;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop lourde. Veuillez choisir un fichier de moins de 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEv) => {
      const base64 = uploadEv.target?.result as string;
      compressImage(base64, 400, 400, 0.85, (compressed) => {
        setCompLogo(compressed);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadLogo = () => {
    if (!compLogo) {
      alert("Aucun logo enregistré pour le téléchargement.");
      return;
    }
    const link = document.createElement('a');
    link.href = compLogo;
    link.download = compLogo.startsWith('data:image/svg+xml') 
      ? 'logo_carthage.svg' 
      : 'logo_carthage.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadOfficialAsset = async (src: string, filename: string) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download official asset", err);
      const link = document.createElement('a');
      link.href = src;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadGoldenWomanAsPNG = () => {
    const svgBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=";
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 512, 512);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'elyssa_femme_doree.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = svgBase64;
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = authorizedEmailsText.split(',').map(em => em.trim()).filter(Boolean);

    const updated: AdminSettings = {
      ...settings,
      companyName: compName,
      currency: "TND", // Force TND as specified but configurable in settings label
      defaultVatRate: Number(vatRate),
      defaultWithholdingRate: Number(withholdingRate),
      withholdingThreshold: Number(threshold),
      authorizedUsers: emails,
      companyAddress: compAddress,
      companyPhone: compPhone,
      companyEmail: compEmail,
      companyMF: compMF,
      companyLogo: compLogo,
      geminiApiKey: geminiApiKey,
      
      // Legal fields
      legalForm: legalForm,
      shareCapital: Number(shareCapital),
      rneNumber: rneNumber,
      legalRepresentative: legalRepresentative,
      cityZipCode: cityZipCode,
      website: website
    };

    onUpdateSettings(updated);
    alert('Configurations de la console d\'administration sécurisée mises à jour !');
  };

  const handleOgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image de partage est trop lourde. Veuillez choisir un fichier de moins de 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEv) => {
      const base64 = uploadEv.target?.result as string;
      compressImage(base64, 800, 420, 0.7, (compressed) => {
        setOgImage(compressed);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSeoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminSettings = {
      ...settings,
      googleAnalyticsId: gaId,
      googleAdsId: gAdsId,
      robotsTxt: robotsText,
      sitemapXml: sitemapText,
      seoTitle: seoTitle,
      seoDescription: seoDesc,
      seoKeywords: seoKeywords,
      ogImage: ogImage
    };
    onUpdateSettings(updated);
    alert('Configurations de référencement Google & Tracking mises à jour avec succès !');
  };

  const handleAutoGenerateSitemap = () => {
    const hostname = "https://elyssa.pro";
    const routes = [
      "",
      "/login",
      "/saas-config",
      "/dashboard",
      "/finance-dashboard",
      "/clients",
      "/invoices",
      "/collaborators",
      "/pricing",
      "/help"
    ];
    const generatedUrls = routes.map(r => `${hostname}${r}`).join("\n");
    setSitemapText(generatedUrls);
    alert("Le sitemap.xml a été re-généré automatiquement d'après l'architecture applicative Elyssa !");
  };

  const handleResetRobotsTxt = () => {
    const defaultRobots = "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n\nSitemap: https://elyssa.pro/sitemap.xml";
    setRobotsText(defaultRobots);
  };

  const handleExportBackup = () => {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      settings: settings,
      data: allData
    };
    setBackupText(JSON.stringify(fullBackup, null, 2));
    setShowImportArea(true);
    alert('Base de données SaaS exportée avec succès ! Copiez le code JSON ci-dessous.');
  };

  const handleImportBackup = () => {
    try {
      const parsed = JSON.parse(backupText);
      if (!parsed.data || !parsed.settings) {
        alert('Format de sauvegarde invalide. Impossible d\'importer.');
        return;
      }

      onUpdateSettings(parsed.settings);
      onImportAllData(parsed.data);
      alert('Toutes les fiches clients, engagements, réclamations et factures ont été restaurés !');
      setShowImportArea(false);
      setBackupText('');
    } catch (e) {
      alert('Erreur lors du décodage du code JSON. Veuillez vérifier le texte.');
    }
  };

  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = companyForm.companyName.trim();
    if (!name) {
      alert("Le nom de l'entreprise est requis.");
      return;
    }
    const pwd = companyForm.password.trim() || 'Elyssa2026!';
    const payload = { ...companyForm, companyName: name, password: pwd };

    const newCompId = `comp-${Date.now()}`;
    const fallbackCompany = {
      id: newCompId,
      company_id: newCompId,
      companyName: name,
      email: companyForm.email || '',
      location: companyForm.location || 'Tunisie',
      packId: companyForm.packId || 'trial',
      paymentGateway: companyForm.paymentGateway || 'Flouci',
      status: companyForm.status || 'trial',
      joinedDate: companyForm.joinedDate || new Date().toISOString().split('T')[0],
      password: pwd
    };

    let updatedList = [...publisherClientsList, fallbackCompany];

    try {
      const res = await fetch('/api/db/add-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.company) {
        updatedList = [...publisherClientsList.filter(c => c.id !== newCompId), data.company];
      }
    } catch (err) {
      console.warn("API add-company fallback used:", err);
    }

    setPublisherClientsList(updatedList);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    if (onUpdatePublisherClients) {
      onUpdatePublisherClients(updatedList);
    }

    setSelectedCompanyId(updatedList[updatedList.length - 1].id);
    setIsCreatingNew(false);
    alert("Entreprise créée et enregistrée avec succès !");
  };

  const handleUpdateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      alert("Veuillez d'abord sélectionner une entreprise à modifier.");
      return;
    }
    const name = companyForm.companyName.trim();
    if (!name) {
      alert("Le nom de l'entreprise est requis.");
      return;
    }

    const updatedList = publisherClientsList.map(c => {
      if (c.id === selectedCompanyId || c.company_id === selectedCompanyId || c.companyName?.toLowerCase() === name.toLowerCase()) {
        return {
          ...c,
          companyName: name,
          email: companyForm.email || '',
          location: companyForm.location || 'Tunisie',
          packId: companyForm.packId || 'trial',
          paymentGateway: companyForm.paymentGateway || 'Flouci',
          status: companyForm.status || 'trial',
          joinedDate: companyForm.joinedDate || c.joinedDate || new Date().toISOString().split('T')[0],
          password: companyForm.password || c.password || 'Elyssa2026!'
        };
      }
      return c;
    });

    try {
      await fetch('/api/db/update-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCompanyId,
          ...companyForm,
          companyName: name
        })
      });
    } catch (err) {
      console.warn("API update-company network warning:", err);
    }

    setPublisherClientsList(updatedList);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    if (onUpdatePublisherClients) {
      onUpdatePublisherClients(updatedList);
    }

    alert("Fiche entreprise enregistrée et mise à jour avec succès !");
  };

  const handleDeleteCompanySubmit = async () => {
    if (!selectedCompanyId) return;
    const targetComp = publisherClientsList.find(c => 
      c.id === selectedCompanyId || c.company_id === selectedCompanyId || c.companyName === selectedCompanyId
    );
    const companyName = targetComp?.companyName || '';

    if (!window.confirm(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement cette entreprise ${companyName ? `(${companyName})` : ''} ? Cette action supprimera sa fiche d'identité ainsi que tous ses droits d'accès.`)) {
      return;
    }

    try {
      setIsDeletingCompany(true);
      await deleteCompanyFromDb(selectedCompanyId, companyName);

      const updatedList = publisherClientsList.filter(c => 
        c.id !== selectedCompanyId && 
        c.company_id !== selectedCompanyId &&
        (companyName ? c.companyName?.toLowerCase() !== companyName.toLowerCase() : true)
      );

      setPublisherClientsList(updatedList);
      localStorage.setItem('carthage_publisher_clients', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));
      if (onUpdatePublisherClients) {
        onUpdatePublisherClients(updatedList);
      }
      setSelectedCompanyId('');
      alert("Entreprise supprimée définitivement avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entreprise:", error);
      alert("Erreur lors de la suppression en base de données.");
    } finally {
      setIsDeletingCompany(false);
    }
  };

  // Admin-Collaborator CRUD Handlers
  const handleAddCollabSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    const activeComp = publisherClientsList.find(c => 
      c.id === selectedCompanyId || 
      c.company_id === selectedCompanyId || 
      c.companyName === selectedCompanyId
    ) || { companyName: companyForm.companyName || 'Elyssa Entreprises S.A.' };

    const name = collabForm.name.trim();
    const email = collabForm.email.trim();
    if (!name || !email) {
      alert("Le nom et l'adresse e-mail du collaborateur sont requis.");
      return;
    }
    const pwd = collabForm.password.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    const newCollabObj: CollaboratorAccount = {
      id: `collab-${Date.now()}`,
      company: activeComp.companyName,
      company_id: selectedCompanyId || 'pc-parent-elyssa',
      name,
      email,
      role: (collabForm.role || 'Agent') as any,
      password: pwd,
      plainPassword: pwd,
      status: (collabForm.status || 'Active') as any,
      createdDate: new Date().toISOString().split('T')[0],
      assignedTasks: []
    };

    let updatedCollabs = [...adminCollaborators, newCollabObj];

    try {
      const res = await fetch('/api/db/admin/add-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: activeComp.companyName,
          ...collabForm,
          name,
          email,
          password: pwd
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.collaborator) {
        updatedCollabs = [...adminCollaborators.filter(c => c.id !== newCollabObj.id), data.collaborator];
      }
    } catch (err) {
      console.warn("API add-collaborator fallback used:", err);
    }

    setAdminCollaborators(updatedCollabs);
    localStorage.setItem('elyssa_collaborators', JSON.stringify(updatedCollabs));
    window.dispatchEvent(new Event('storage'));
    if (onUpdateCollaborators) {
      onUpdateCollaborators(updatedCollabs);
    }

    setIsAddingCollab(false);
    setCollabForm({ id: '', name: '', role: 'Collaborateur', email: '', password: '', status: 'Active' });
    alert("Collaborateur créé avec succès !");
  };

  const handleUpdateCollabSubmit = async (collabId: string) => {
    const name = collabForm.name.trim();
    const email = collabForm.email.trim();
    if (!name || !email) {
      alert("Le nom et l'email du collaborateur sont requis.");
      return;
    }

    const activeComp = publisherClientsList.find(c => 
      c.id === selectedCompanyId || 
      c.company_id === selectedCompanyId || 
      c.companyName === selectedCompanyId
    );

    const updatedCollabs = adminCollaborators.map(c => {
      if (c.id === collabId) {
        return {
          ...c,
          name,
          email,
          role: (collabForm.role || c.role || 'Agent') as any,
          company: activeComp ? activeComp.companyName : c.company,
          status: (collabForm.status || c.status || 'Active') as any,
          password: collabForm.password || c.password,
          plainPassword: collabForm.password || c.plainPassword
        };
      }
      return c;
    });

    try {
      await fetch('/api/db/admin/update-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: collabId,
          company: activeComp ? activeComp.companyName : undefined,
          ...collabForm,
          name,
          email
        })
      });
    } catch (err) {
      console.warn("API update-collaborator warning:", err);
    }

    setAdminCollaborators(updatedCollabs);
    localStorage.setItem('elyssa_collaborators', JSON.stringify(updatedCollabs));
    window.dispatchEvent(new Event('storage'));
    if (onUpdateCollaborators) {
      onUpdateCollaborators(updatedCollabs);
    }

    setIsEditingCollabRowId('');
    alert("Collaborateur mis à jour avec succès !");
  };

  const handleDeleteCollabSubmit = async (collabId: string) => {
    if (window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce collaborateur ?")) {
      const updatedCollabs = adminCollaborators.filter(c => c.id !== collabId);

      try {
        await fetch('/api/db/admin/delete-collaborator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: collabId })
        });
      } catch (err) {
        console.warn("API delete-collaborator warning:", err);
      }

      setAdminCollaborators(updatedCollabs);
      localStorage.setItem('elyssa_collaborators', JSON.stringify(updatedCollabs));
      window.dispatchEvent(new Event('storage'));
      if (onUpdateCollaborators) {
        onUpdateCollaborators(updatedCollabs);
      }

      alert("Collaborateur supprimé avec succès !");
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-indigo-700">
          <Settings className="w-5 h-5" />
          <h2 className="text-base font-extrabold text-slate-800">
            {mode === 'company_settings' ? "Paramètres de l'Entreprise" : "Console d'Administration Sécurisée"}
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          {mode === 'company_settings' 
            ? "Configurez l'identité de votre entreprise (logo, adresse, matricule fiscal) et vos paramètres de facturation & fiscalité tunisienne."
            : "Administrez la devise monétaire (Dinar Tunisien TND), le taux de fiscalité (TVA standard), invitez des comptes collaborateurs et assignez-leur des tâches spécifiques de recouvrement."}
        </p>
      </div>

      {/* Sub-Tabs Selector */}
      {mode === 'company_settings' && (
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'settings'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Paramètres Généraux & Fiscalité</span>
          </button>
          <button
            onClick={() => setActiveSubTab('module_store')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'module_store'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Boutique Modules & Add-ons</span>
          </button>
          <button
            onClick={() => setActiveSubTab('licenses')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'licenses'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Licences Mobile Terrain (MOD-11)</span>
          </button>
        </div>
      )}

      {mode === 'admin' && (
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('collaborators')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'collaborators'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Gestion des Collaborateurs & Tâches</span>
          </button>
          <button
            onClick={() => setActiveSubTab('module_store')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'module_store'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Boutique Modules & Add-ons</span>
          </button>
          <button
            onClick={() => setActiveSubTab('licenses')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'licenses'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Licences Mobile (MOD-11)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'security'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Bilan de Santé & Sécurité (SecOps)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('seo')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'seo'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Référencement Google & SEO</span>
          </button>
          <button
            onClick={() => setActiveSubTab('radar')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'radar'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radar className="w-4 h-4 text-indigo-600" />
            <span>Radar de Connexions Live</span>
          </button>
          <button
            onClick={() => setActiveSubTab('companies')}
            className={`py-3 px-5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'companies'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Fiches & Comptes Entreprises</span>
          </button>
        </div>
      )}

      {activeSubTab === 'module_store' ? (
        <ModuleStore 
          tenantId={settings.companyName || 'Inter-Affaires'} 
          onNavigateToLicenseManager={() => setActiveSubTab('licenses')} 
          isTrial={isTrial}
        />
      ) : activeSubTab === 'licenses' ? (
        <LicenseManager 
          tenantId={settings.companyName || 'Inter-Affaires'} 
          activeCompanyName={settings.companyName}
          collaborators={collaborators}
          onNavigateToStore={() => setActiveSubTab('module_store')} 
          isTrial={isTrial}
          isDemoTenant={isDemoTenantMode}
        />
      ) : mode === 'admin' && activeSubTab === 'collaborators' ? (
        <CollaboratorConsole 
          collaborators={collaborators} 
          onUpdateCollaborators={onUpdateCollaborators} 
          currentUser={currentUser}
          publisherClients={publisherClients}
          activeCompanyName={settings.companyName}
          isTrial={isTrial}
          isDemoTenant={isDemoTenantMode}
        />
      ) : mode === 'admin' && activeSubTab === 'security' ? (
        <SecurityDashboard 
          collaborators={collaborators}
          allData={allData}
          settings={settings}
          publisherClients={publisherClients}
          currentUser={currentUser}
        />
      ) : mode === 'admin' && activeSubTab === 'seo' ? (
        <form onSubmit={handleSaveSeoSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fadeIn">
          {/* Form Settings Left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* SEO Basics */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
                <Globe className="w-4.5 h-4.5 text-indigo-600" />
                <span>Métadonnées d'Indexation & Référencement (SEO)</span>
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">Titre Principal de la Page d'Accueil (Meta Title) :</label>
                    <span className={`text-[10px] font-mono font-bold ${seoTitle.length >= 50 && seoTitle.length <= 60 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {seoTitle.length} / 60 car. {seoTitle.length >= 50 && seoTitle.length <= 60 ? '(Optimal)' : '(Recommandé: 50-60)'}
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-medium text-xs"
                    placeholder="Ex: Elyssa CRM & ERP | Logiciel de Recouvrement en Tunisie"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">Description de l'Application (Meta Description) :</label>
                    <span className={`text-[10px] font-mono font-bold ${seoDesc.length >= 140 && seoDesc.length <= 160 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {seoDesc.length} / 160 car. {seoDesc.length >= 140 && seoDesc.length <= 160 ? '(Optimal)' : '(Recommandé: 140-160)'}
                    </span>
                  </div>
                  <textarea 
                    rows={3}
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full leading-relaxed text-xs"
                    placeholder="Ex: Le premier ERP & CRM conçu pour le marché tunisien. Suivi de trésorerie, relances clients, facturation de TVA et retenues à la source..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Mots-clés SEO (séparés par des virgules) :</label>
                  <input 
                    type="text" 
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: CRM Tunisie, ERP Tunisie, Factures, Recouvrement"
                  />
                  <span className="text-[10px] text-slate-400 block">Aide à l'indexation sémantique sur les moteurs de recherche secondaires.</span>
                </div>
              </div>
            </div>

            {/* Google Ecosystem Connections */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
                <Chrome className="w-4.5 h-4.5 text-indigo-600" />
                <span>Intégration Google Analytics & Google Ads</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">ID de Mesure Google Analytics 4 (GA4) :</label>
                    {gaId ? (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">Actif</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-full">Inactif</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-mono text-xs"
                    placeholder="Ex: G-XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">ID de Tracking de Conversion Google Ads :</label>
                    {gAdsId ? (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">Actif</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-full">Inactif</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={gAdsId}
                    onChange={(e) => setGAdsId(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-mono text-xs"
                    placeholder="Ex: AW-XXXXXXXXXX"
                  />
                </div>
              </div>

              {/* Dynamic Tracking Code Script Template */}
              <div className="bg-slate-900 rounded-xl p-4 text-slate-300 space-y-3 font-mono text-[10px] relative overflow-hidden">
                <div className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-indigo-900/60 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-700/50">
                  Code Source Injecté
                </div>
                <div className="text-slate-400 font-sans font-bold text-[11px] mb-1 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Aperçu de la balise globale (gtag.js) auto-générée pour {settings.companyName} :</span>
                </div>
                <pre className="overflow-x-auto leading-relaxed">
{`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId || 'G-XXXXXXXXXX'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId || 'G-XXXXXXXXXX'}');
  ${gAdsId ? `gtag('config', '${gAdsId}');` : ''}
</script>`}
                </pre>
              </div>
            </div>

            {/* Robots.txt and Sitemap.xml files */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
                <FileCode className="w-4.5 h-4.5 text-indigo-600" />
                <span>Fichiers de Guidage de Crawl d'Indexation (Robots & Sitemaps)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Robots.txt */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">Contenu du fichier ROBOTS.TXT :</label>
                    <div className="flex space-x-1.5">
                      <button 
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(robotsText); alert("Robots.txt copié !"); }}
                        className="p-1 px-2 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 font-semibold rounded text-[9px]"
                      >
                        Copier
                      </button>
                      <button 
                        type="button"
                        onClick={handleResetRobotsTxt}
                        className="p-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold rounded text-[9px]"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={6}
                    value={robotsText}
                    onChange={(e) => setRobotsText(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-mono text-[11px] leading-relaxed"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Indique aux robots de Google quels répertoires sont interdits (ex: le panneau admin, l'API).</span>
                </div>

                {/* Sitemap.xml URLs */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">Adresses incluses dans SITEMAP.XML :</label>
                    <div className="flex space-x-1.5">
                      <button 
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(sitemapText); alert("Sitemap copié !"); }}
                        className="p-1 px-2 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 font-semibold rounded text-[9px]"
                      >
                        Copier
                      </button>
                      <button 
                        type="button"
                        onClick={handleAutoGenerateSitemap}
                        className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded text-[9px]"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={6}
                    value={sitemapText}
                    onChange={(e) => setSitemapText(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-mono text-[11px] leading-relaxed"
                    placeholder="Une URL par ligne..."
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Liste des chemins publics de l'application à envoyer à Google Search Console pour indexation instantanée.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center space-x-1.5 shadow-sm text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les Paramètres Référencement & SEO</span>
              </button>
            </div>
          </div>
          
          {/* Previews Right side (1 column) */}
          <div className="space-y-6">
            {/* OG Image Upload Card */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Image de Couverture Sociale (OG:Image)</span>
              </h3>
              
              <p className="text-[10px] text-slate-400">
                Cette image s'affiche de manière proéminente lorsque vous partagez le lien d'Elyssa sur des réseaux sociaux (Facebook, LinkedIn, Twitter). Format recommandé : 1200x630 pixels.
              </p>

              {/* Shared image preview container */}
              <div className="aspect-video w-full bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-inner">
                {ogImage ? (
                  <>
                    <img src={ogImage} alt="Social share card cover" className="w-full h-full object-cover animate-fadeIn" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-white text-[10px] font-bold bg-slate-900/80 px-2.5 py-1 rounded-full">Format Valide</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Share2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 block">Image standard par défaut</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Format SVG dynamique de la marque Carthage</span>
                  </div>
                )}
              </div>

              {/* Upload actions */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-dashed border-indigo-250 rounded-lg p-2.5 text-center cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 mx-auto text-indigo-600 mb-1" />
                  <span>{ogImage ? "Changer la photo de partage" : "Sélectionner une photo (Max 5Mo)"}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleOgImageUpload} 
                    className="hidden" 
                  />
                </label>

                {ogImage && (
                  <button
                    type="button"
                    onClick={() => { setOgImage(""); }}
                    className="w-full p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg transition text-[10px]"
                  >
                    Réinitialiser à l'image Elyssa d'origine
                  </button>
                )}
              </div>
            </div>

            {/* Facebook Share Preview Card */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-3">
              <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-[10px] font-black">f</span>
                <span>Aperçu de Partage - Facebook</span>
              </span>

              {/* Mock FB Post container */}
              <div className="border border-slate-200 rounded-lg bg-white shadow-xs overflow-hidden font-sans mock-social-card">
                {/* User Info Header */}
                <div className="p-2.5 flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    E
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 hover:underline cursor-pointer block leading-tight">Elyssa Entreprises</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">À l'instant · Sponsorisé · 🌐</span>
                  </div>
                </div>

                {/* Shared Link Card */}
                <div className="border-t border-slate-150 cursor-pointer hover:bg-slate-50 transition">
                  {/* Share image */}
                  <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                    {ogImage ? (
                      <img src={ogImage} alt="FB share card" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-3 text-center">
                        <span className="text-amber-400 text-xs font-black tracking-widest">ELYSSA CRM & ERP</span>
                      </div>
                    )}
                  </div>
                  {/* Share description */}
                  <div className="p-3 bg-[#f2f3f5] border-t border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">ELYSSA.PRO</span>
                    <h4 className="text-[11px] font-bold text-slate-800 mt-1 truncate-2-lines line-clamp-2 leading-tight">
                      {seoTitle}
                    </h4>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 truncate-2-lines line-clamp-2 leading-snug">
                      {seoDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LinkedIn Share Preview Card */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-3">
              <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-[#0077B5] text-white rounded flex items-center justify-center text-[10px] font-bold">in</span>
                <span>Aperçu de Partage - LinkedIn</span>
              </span>

              {/* Mock LinkedIn Post container */}
              <div className="border border-slate-200 rounded-lg bg-white shadow-xs overflow-hidden font-sans mock-social-card">
                {/* LinkedIn header */}
                <div className="p-3 flex items-center space-x-2">
                  <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    E
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] font-bold text-slate-800 hover:underline cursor-pointer leading-none">Inter-Affaires</span>
                      <span className="text-[9px] text-slate-400 font-bold">· 1er</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">15 420 abonnés</span>
                    <span className="text-[9px] text-slate-400 block">À l'instant · 🌐</span>
                  </div>
                </div>

                {/* Post body excerpt */}
                <p className="px-3 pb-2 text-[10px] text-slate-700 leading-relaxed">
                  Optimisez l'acquisition de vos clients et le suivi des factures impayées grâce à notre plateforme intelligente.
                </p>

                {/* LinkedIn Share card */}
                <div className="border-t border-slate-150 cursor-pointer hover:bg-slate-50 transition">
                  {/* Share image */}
                  <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                    {ogImage ? (
                      <img src={ogImage} alt="LinkedIn share card" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-3 text-center">
                        <span className="text-amber-400 text-xs font-black tracking-widest">ELYSSA CRM & ERP</span>
                      </div>
                    )}
                  </div>
                  {/* Share title */}
                  <div className="p-3 bg-white border-t border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                      {seoTitle}
                    </h4>
                    <span className="text-[9px] text-slate-400 block mt-1">elyssa.pro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : mode === 'admin' && activeSubTab === 'radar' ? (
        <RadarDashboard companyName={settings.companyName || 'Inter-Affaires'} companySettings={settings} />
      ) : mode === 'admin' && activeSubTab === 'companies' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fadeIn">
          {/* List of Companies */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4 self-start">
            <div className="border-b pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <Building className="w-4.5 h-4.5 text-indigo-600" />
                <span>Gestion des Entreprises</span>
              </h3>
              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {publisherClients.length}
              </span>
            </div>

            {/* Create Company Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCompanyId('');
                setIsCreatingNew(true);
                setCompanyForm({
                  companyName: '',
                  email: '',
                  location: 'Tunisie',
                  packId: 'trial',
                  paymentGateway: 'Flouci',
                  status: 'trial',
                  joinedDate: new Date().toISOString().split('T')[0],
                  password: ''
                });
              }}
              className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouvelle Entreprise</span>
            </button>

            {/* Search */}
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Rechercher une entreprise..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 font-mono"
            />

            {/* Company List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {publisherClientsList
                .filter(c => !companySearch || c.companyName?.toLowerCase().includes(companySearch.toLowerCase()))
                .map((client) => {
                  const clientId = client.id || client.company_id || client.companyName;
                  const isSelected = selectedCompanyId === clientId || selectedCompanyId === client.id || selectedCompanyId === client.company_id;
                  return (
                    <button
                      key={clientId}
                      onClick={() => {
                        setSelectedCompanyId(clientId);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition flex flex-col space-y-1 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                          : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-slate-900 truncate">{client.companyName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          client.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : client.status === 'trial'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {client.status === 'active' ? 'Actif' : client.status === 'trial' ? 'Essai' : 'Suspendu'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-450 flex items-center justify-between">
                        <span>{client.location || 'Tunisie'}</span>
                        <span className="font-mono">{client.joinedDate || '2026-06-27'}</span>
                      </div>
                    </button>
                  );
                })}
              {publisherClientsList.filter(c => !companySearch || c.companyName?.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                  Aucune entreprise trouvée.
                </div>
              )}
            </div>

            {/* Dangerous Zone / Clear DB */}
            <div className="pt-4 border-t border-slate-150 space-y-2">
              <h4 className="font-black text-rose-700 uppercase text-[10px] tracking-wider">Zone de Danger</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Vider la base de données client supprimera toutes les fiches d'entreprises créées en démonstration/essais ainsi que tous leurs comptes collaborateurs, à l'exception des profils par défaut d'Elyssa S.A.
              </p>
              <button
                type="button"
                disabled={isClearingDb}
                onClick={async () => {
                  if (window.confirm("⚠️ Êtes-vous ABSOLUMENT sûr de vouloir vider toute la base de données clients ? Cette action est irréversible et déconnectera tous les comptes d'essai.")) {
                    setIsClearingDb(true);
                    try {
                      const res = await fetch('/api/db/clear-clients', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        alert("La base de données clients a été vidée avec succès ! L'application va se recharger.");
                        window.location.reload();
                      } else {
                        alert("Erreur lors du nettoyage : " + (data.error || "Inconnu"));
                      }
                    } catch (err: any) {
                      alert("Erreur de communication : " + err.message);
                    } finally {
                      setIsClearingDb(false);
                    }
                  }
                }}
                className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition disabled:opacity-50 cursor-pointer text-center"
              >
                {isClearingDb ? "Nettoyage en cours..." : "Vider la Base de Données Client"}
              </button>
            </div>
          </div>

          {/* Details & Fiche Entreprise */}
          <div className="lg:col-span-2 space-y-6">
            {isCreatingNew || selectedCompanyId ? (
              <div className="space-y-6">
                {/* Form to Create/Edit */}
                <form onSubmit={isCreatingNew ? handleAddCompanySubmit : handleUpdateCompanySubmit} className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-5">
                  <div className="border-b pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                        {isCreatingNew ? "Création de Compte Client" : "Fiche d'identité d'Entreprise"}
                      </span>
                      <h2 className="text-lg font-black text-slate-800 leading-tight mt-0.5">
                        {isCreatingNew ? "Nouvelle Entreprise Tunisie" : companyForm.companyName || "Édition de l'Entreprise"}
                      </h2>
                    </div>
                    {!isCreatingNew && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        ID: {selectedCompanyId}
                      </span>
                    )}
                  </div>

                  {/* Input Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Nom de l'entreprise *</label>
                      <input
                        type="text"
                        required
                        value={companyForm.companyName}
                        onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                        placeholder="Ex: Entreprise S.A."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      />
                    </div>

                    {/* Company Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">E-mail du compte entreprise</label>
                      <input
                        type="email"
                        value={companyForm.email || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        placeholder="Ex: contact@entreprise.tn ou entreprise@carthage.tn"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Gouvernorat / Adresse</label>
                      <input
                        type="text"
                        value={companyForm.location}
                        onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                        placeholder="Ex: Tunis, Sousse, Sfax, Ariana"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      />
                    </div>

                    {/* SaaS Package */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Formule SaaS Active</label>
                      <select
                        value={companyForm.packId}
                        onChange={(e) => setCompanyForm({ ...companyForm, packId: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      >
                        <option value="trial">Période d'Essai (Trial)</option>
                        <option value="full">SaaS Premium (Services & Commerce - Sans Usine)</option>
                        <option value="industrial">SaaS Elyssa Industrielle & Intégrale (Avec Usine)</option>
                        <option value="logistics">SaaS Logistique & Import</option>
                        <option value="rh_only">SaaS Ressources Humaines & Paie</option>
                      </select>
                    </div>

                    {/* Payment Gateway */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                        Moyen de paiement favori {companyForm.status === 'trial' && <span className="text-amber-600 font-bold lowercase"> - inactif en essai</span>}
                      </label>
                      <select
                        value={companyForm.status === 'trial' ? 'None' : companyForm.paymentGateway}
                        disabled={companyForm.status === 'trial'}
                        onChange={(e) => setCompanyForm({ ...companyForm, paymentGateway: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {companyForm.status === 'trial' ? (
                          <option value="None">Aucun règlement enregistré (Période d'essai active)</option>
                        ) : (
                          <>
                            <option value="Flouci">Carte Bancaire (En Ligne)</option>
                            <option value="Poste">Poste Tunisienne (e-Dinar)</option>
                            <option value="BankTransfer">Virement Bancaire (RIB)</option>
                            <option value="Cash">Espèces / Chèque certifié</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Account Status */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Statut du compte</label>
                      <select
                        value={companyForm.status}
                        onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      >
                        <option value="active">Actif (Accès autorisé)</option>
                        <option value="trial">En Essai (Trial temporaire)</option>
                        <option value="inactive">Suspendu / Désactivé</option>
                      </select>
                    </div>

                    {/* Integration Date */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Date d'intégration</label>
                      <input
                        type="date"
                        value={companyForm.joinedDate}
                        onChange={(e) => setCompanyForm({ ...companyForm, joinedDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-medium"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                        Mot de passe Entreprise (Commun) *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.password}
                        onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })}
                        placeholder="Ex: Carthage2026!"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600 font-mono font-bold"
                      />
                      <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                        Ce mot de passe sert de clé d'accès commune pour débloquer l'authentification des collaborateurs lors de l'accès au portail.
                      </p>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-between border-t pt-4 border-slate-100">
                    {!isCreatingNew ? (
                      <button
                        type="button"
                        disabled={isDeletingCompany}
                        onClick={handleDeleteCompanySubmit}
                        className="flex items-center space-x-1.5 p-2 px-3 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 font-extrabold text-xs rounded-lg transition cursor-pointer"
                      >
                        {isDeletingCompany ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            <span>Suppression en cours...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Supprimer l'Entreprise</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompanyId('');
                          setIsCreatingNew(false);
                        }}
                        className="p-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-1.5 p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition shadow-xs cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isCreatingNew ? "Créer l'Entreprise" : "Enregistrer les modifications"}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Collaborators belonging to the edited company */}
                {!isCreatingNew && selectedCompanyId && (() => {
                  const comp = publisherClientsList.find(c => c.id === selectedCompanyId || c.company_id === selectedCompanyId || c.companyName === selectedCompanyId);
                  if (!comp) return null;
                  
                  // Filter our unmasked admin collaborators by company name (deduplicated by id)
                  const seenCollabIds = new Set<string>();
                  const compCollabs = adminCollaborators.filter(collab => {
                    if (!collab || collab.company !== comp.companyName) return false;
                    const key = collab.id || collab.email;
                    if (!key || seenCollabIds.has(key)) return false;
                    seenCollabIds.add(key);
                    return true;
                  });

                  return (
                    <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                          <Users className="w-4.5 h-4.5 text-indigo-600" />
                          <span>Collaborateurs de l'entreprise : {comp.companyName}</span>
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {compCollabs.length}
                          </span>
                        </h3>
                        
                        {!isAddingCollab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCollab(true);
                              setCollabForm({
                                id: '',
                                name: '',
                                role: 'Collaborateur',
                                email: '',
                                password: '',
                                status: 'Active'
                              });
                            }}
                            className="flex items-center space-x-1 p-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-lg transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            <span>Ajouter un collaborateur</span>
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Nom & Prénom</th>
                              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Intitulé du Poste / Rôle</th>
                              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Adresse E-mail</th>
                              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Mot de passe (Mdp)</th>
                              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {/* Form row for adding new collaborator */}
                            {isAddingCollab && (
                              <tr className="bg-indigo-50/30">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={collabForm.name}
                                    onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })}
                                    placeholder="Nom & Prénom"
                                    required
                                    className="w-full p-2 bg-white border border-indigo-200 rounded text-xs font-semibold focus:outline-indigo-600 focus:bg-white text-slate-800"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={collabForm.role}
                                    onChange={(e) => setCollabForm({ ...collabForm, role: e.target.value })}
                                    placeholder="Ex: Admin, Responsable..."
                                    className="w-full p-2 bg-white border border-indigo-200 rounded text-xs font-semibold focus:outline-indigo-600 focus:bg-white text-slate-800"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="email"
                                    value={collabForm.email}
                                    onChange={(e) => setCollabForm({ ...collabForm, email: e.target.value })}
                                    placeholder="email@collaborateur.tn"
                                    required
                                    className="w-full p-2 bg-white border border-indigo-200 rounded text-xs font-medium focus:outline-indigo-600 focus:bg-white text-slate-800"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    value={collabForm.password}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      setCollabForm({ ...collabForm, password: val });
                                    }}
                                    placeholder="PIN (6 ch.)"
                                    required
                                    className="w-full p-2 bg-white border border-indigo-200 rounded text-xs font-mono text-center tracking-widest focus:outline-indigo-600 focus:bg-white text-slate-800"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      type="button"
                                      onClick={handleAddCollabSubmit}
                                      className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded shadow-sm transition cursor-pointer"
                                    >
                                      Créer
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsAddingCollab(false)}
                                      className="p-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] rounded transition cursor-pointer"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {compCollabs.length === 0 && !isAddingCollab ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                                  Aucun collaborateur configuré pour cette entreprise. Cliquez sur <strong>"+ Ajouter un collaborateur"</strong> ci-dessus pour en créer un.
                                </td>
                              </tr>
                            ) : (
                              compCollabs.map((collab) => {
                                const isEditing = isEditingCollabRowId === collab.id;

                                if (isEditing) {
                                  return (
                                    <tr key={collab.id} className="bg-amber-50/20">
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={collabForm.name}
                                          onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })}
                                          className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-semibold focus:outline-amber-600 focus:bg-white text-slate-800"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={collabForm.role}
                                          onChange={(e) => setCollabForm({ ...collabForm, role: e.target.value })}
                                          className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-semibold focus:outline-amber-600 focus:bg-white text-slate-800"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="email"
                                          value={collabForm.email}
                                          onChange={(e) => setCollabForm({ ...collabForm, email: e.target.value })}
                                          className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-medium focus:outline-amber-600 focus:bg-white text-slate-800"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          maxLength={6}
                                          pattern="[0-9]{6}"
                                          value={collabForm.password}
                                          onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setCollabForm({ ...collabForm, password: val });
                                          }}
                                          placeholder="Modifier le PIN (6 ch.)"
                                          className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-mono text-center tracking-widest focus:outline-amber-600 focus:bg-white text-slate-800"
                                        />
                                      </td>
                                      <td className="p-2 text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCollabSubmit(collab.id)}
                                            className="p-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] rounded shadow-sm transition cursor-pointer"
                                          >
                                            Enregistrer
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setIsEditingCollabRowId('')}
                                            className="p-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] rounded transition cursor-pointer"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={collab.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3 text-xs font-semibold text-slate-800">
                                      {collab.name}
                                    </td>
                                    <td className="p-3 text-xs">
                                      <span className="bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                                        {collab.role}
                                      </span>
                                    </td>
                                    <td className="p-3 text-xs font-mono text-indigo-600 font-medium">
                                      {collab.email}
                                    </td>
                                    <td className="p-3 text-xs font-mono font-bold text-slate-600">
                                      {collab.plainPassword || 'N/A'}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end space-x-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsEditingCollabRowId(collab.id);
                                            setIsAddingCollab(false);
                                            setCollabForm({
                                              id: collab.id,
                                              name: collab.name || '',
                                              role: collab.role || 'Collaborateur',
                                              email: collab.email || '',
                                              password: collab.plainPassword || '',
                                              status: collab.status || 'Active'
                                            });
                                          }}
                                          className="p-1 px-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-[10px] rounded transition cursor-pointer"
                                        >
                                          Modifier
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCollabSubmit(collab.id)}
                                          className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded transition cursor-pointer"
                                        >
                                          Supprimer
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
                  );
                })()}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-10 text-center text-slate-400 space-y-3">
                <Building className="w-10 h-10 text-indigo-300 mx-auto" />
                <h3 className="font-extrabold text-slate-700 text-sm">Aucune Entreprise Sélectionnée</h3>
                <p className="text-slate-450 max-w-sm mx-auto leading-relaxed">
                  Sélectionnez une entreprise dans le panneau de gauche pour gérer sa fiche d'identité complète ou cliquez sur le bouton <strong className="text-indigo-600 font-black">"+ Nouvelle Entreprise"</strong> pour ajouter manuellement une nouvelle structure cliente à la console Elyssa ERP.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Form Settings Left side */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
              <Percent className="w-4.5 h-4.5 text-indigo-600" />
              <span>Paramètres de Facturation & Fiscalité Tunisienne</span>
            </h3>


          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-650">Raison Sociale de l'Entreprise :</label>
                <input 
                  type="text" 
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="p-2 border rounded bg-slate-50 w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-650">Devise Principale du Système (Monnaie) :</label>
                <input 
                  type="text" 
                  value="TND (Dinar Tunisien)"
                  disabled
                  className="p-2 border rounded bg-slate-100 w-full font-bold text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-650">Taux de TVA Standard Défaut (%) :</label>
                <input 
                  type="number" 
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="p-2 border rounded bg-slate-50 w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-655">Taux de Retenue à la Source Défaut (%) :</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={withholdingRate}
                  onChange={(e) => setWithholdingRate(Number(e.target.value))}
                  className="p-2 border rounded bg-slate-50 w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-655">Seuil d'application de la Retenue (TTC) :</label>
                <input 
                  type="number" 
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="p-2 border rounded bg-slate-50 w-full font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">Conformément aux directives de l'État (Standard: 1,000 TND inclus).</span>
              </div>

              {(!currentUser || currentUser.role === 'SuperAdmin') && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Administrateurs Habilités (Emails, séparés par virgule) :</label>
                  <input 
                    type="text" 
                    value={authorizedEmailsText}
                    onChange={(e) => setAuthorizedEmailsText(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full font-mono text-[11px]"
                    required
                  />
                </div>
              )}

              {/* Clé API Gemini Personnelle (Multi-Tenant BYOK) Card - Accessible to all companies */}
              <div id="gemini-api-key-card" className="col-span-1 md:col-span-2 p-4 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-2xl border border-indigo-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-indigo-950 flex items-center space-x-2 text-sm">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>Clé API Gemini Personnelle (Multi-Tenant BYOK)</span>
                  </label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    BYOK Config • {compName || settings.companyName}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Saisissez la clé API Gemini propre à l'entreprise <strong className="text-indigo-900">{compName || settings.companyName}</strong>. 
                  Cette clé est enregistrée directement dans le document tenant (<code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono text-[11px]">company_erp_data</code>) et utilisée en priorité par le backend pour l'analyse financière autonome et le Copilot (modèle <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono text-[11px]">gemini-3.6-flash</code>).
                </p>

                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input 
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        setGeminiTestFeedback(null);
                        setGeminiSaveFeedback(null);
                      }}
                      placeholder="Collez votre clé API Gemini (Ex: AIzaSyD...)"
                      className="w-full pr-10 pl-3 py-2.5 border border-indigo-200 rounded-xl bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title={showGeminiKey ? "Masquer la clé" : "Afficher la clé"}
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dedicated buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleTestGeminiKey}
                      disabled={testingGeminiKey}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 active:scale-98 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      {testingGeminiKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>Test en cours...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tester la clé</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveGeminiKeyCard}
                      disabled={savingGeminiKey}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      {savingGeminiKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Enregistrer la clé</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Immediate Feedback Displays */}
                {geminiTestFeedback && (
                  <div className={`p-3 rounded-xl border flex items-start space-x-2 text-xs transition-all ${
                    geminiTestFeedback.valid 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}>
                    {geminiTestFeedback.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-medium">
                      {geminiTestFeedback.message}
                    </div>
                  </div>
                )}

                {geminiSaveFeedback && (
                  <div className={`p-3 rounded-xl border flex items-start space-x-2 text-xs transition-all ${
                    geminiSaveFeedback.success 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}>
                    {geminiSaveFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-medium">
                      {geminiSaveFeedback.message}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Corporate Visual Identity and Contact Settings */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1 rounded-md">
                <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Identité Commerciale & Contacts</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Téléphone Standard :</label>
                  <input 
                    type="text" 
                    value={compPhone} 
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: +216 71 862 100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Adresse Courriel Administrative :</label>
                  <input 
                    type="email" 
                    value={compEmail} 
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: commercial@elyssa.pro"
                  />
                </div>
              </div>
            </div>

            {/* Informations Légales & En-tête Section */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1 rounded-md">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Informations Légales & En-tête</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Forme Juridique :</label>
                  <input 
                    type="text" 
                    value={legalForm} 
                    onChange={(e) => setLegalForm(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: Société Anonyme, SARL"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Capital Social (TND) :</label>
                  <input 
                    type="number" 
                    value={shareCapital || ''} 
                    onChange={(e) => setShareCapital(Number(e.target.value))}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: 100000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Numéro RNE :</label>
                  <input 
                    type="text" 
                    value={rneNumber} 
                    onChange={(e) => setRneNumber(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs font-semibold"
                    placeholder="Registre National des Entreprises"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Matricule Fiscal (MF) :</label>
                  <input 
                    type="text" 
                    value={compMF} 
                    onChange={(e) => setCompMF(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs font-semibold"
                    placeholder="Ex: 1458932/A/M/000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Gérant / Représentant Légal :</label>
                  <input 
                    type="text" 
                    value={legalRepresentative} 
                    onChange={(e) => setLegalRepresentative(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Nom complet du gérant"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Adresse du Siège Social :</label>
                  <input 
                    type="text" 
                    value={compAddress} 
                    onChange={(e) => setCompAddress(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: Rue du Lac Windermere, Lac 2, Tunis"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Ville & Code Postal :</label>
                  <input 
                    type="text" 
                    value={cityZipCode} 
                    onChange={(e) => setCityZipCode(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs"
                    placeholder="Ex: Tunis 1053"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-650">Site Web :</label>
                  <input 
                    type="text" 
                    value={website} 
                    onChange={(e) => setWebsite(e.target.value)}
                    className="p-2 border rounded bg-slate-50 w-full text-xs font-semibold text-indigo-700"
                    placeholder="Ex: https://inter-affaires.tn"
                  />
                </div>
              </div>

              {/* Logo Area */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/65 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-700 block text-[11px] uppercase tracking-wider">Logo Officiel pour Rapports et Factures</span>
                    <p className="text-[10px] text-slate-400">Ce logo apparaîtra de manière proéminente sur l'impression de vos factures et documents officiels de relance.</p>
                  </div>
                  
                  {compLogo && (
                    <button 
                      type="button"
                      onClick={handleDownloadLogo}
                      className="inline-flex items-center space-x-1.5 p-1 px-3 bg-white hover:bg-slate-100 text-indigo-700 font-extrabold border border-slate-250 rounded-lg text-[10px] transition shrink-0 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Télécharger le Logo</span>
                    </button>
                  )}
                </div>

                {isClientCompany && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-700 block">⚠️ Logo Personnalisé Requis</span>
                      <p className="text-[10px] leading-relaxed text-slate-600">
                        Veuillez insérer le logo officiel de votre société. Ce logo personnalisé est indispensable pour être affiché et imprimé automatiquement sur vos factures, devis, bons de commande, fiches de paie et autres pièces réglementaires.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current logo preview thumbnail */}
                  <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-1.5 shrink-0 shadow-sm">
                    {compLogo ? (
                      <img src={compLogo} alt="Logo de l'entreprise" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : isClientCompany ? (
                      <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150">
                        <Building className="w-8 h-8 text-slate-400" />
                      </div>
                    ) : (
                      <ElyssaLogo className="w-16 h-16 rounded-xl" />
                    )}
                  </div>
                  
                  {/* File Upload Controls widget */}
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[11px] font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-dashed border-indigo-250 rounded-xl p-3 text-center cursor-pointer transition">
                      <Upload className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                      <span>{compLogo ? "Remplacer l'image du logo" : "Choisir un fichier image pour le logo"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[9px] text-slate-400 text-center">Formats acceptés : PNG, SVG, JPG. Recommandation : taille carrée ou paysage compact, max 5 Mo.</p>
                    
                    {!isClientCompany && (
                      <button
                        type="button"
                        onClick={() => {
                          const goldenWomanLogo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=";
                          setCompLogo(goldenWomanLogo);
                          alert("Le logo officiel de la Femme Dorée Elyssa a été appliqué à vos paramètres locaux ! N'oubliez pas de cliquer sur 'Enregistrer la Programmation Fiscale' pour confirmer le changement.");
                        }}
                        className="w-full inline-flex items-center justify-center space-x-1.5 p-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer mt-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Appliquer le Logo Femme Dorée d'Elyssa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t">
              <button 
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la Programmation Fiscale</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Backup area right-side */}
        <div className="space-y-6">
          {/* Security details cards */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-3">
            <span className="font-bold text-slate-800 text-sm flex items-center space-x-1 text-red-650">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span>Protocole d'Accès Sécurisé</span>
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              La console d'administration crypte les sessions et exige que l'utilisateur soit authentifié avec une adresse de messagerie présente dans la liste blanche des emails habilités.
            </p>
            <div className="p-2.5 bg-slate-50 rounded border text-[10px] text-slate-600 font-mono flex items-center justify-between">
              <span>Utilisateur actuel connecté :</span>
              <strong className="text-indigo-600">{currentUser?.email || 'contact@elyssa.pro'}</strong>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-800 font-semibold rounded text-[10px] text-center uppercase tracking-wider">
              🛡️ Connexion Multi-Tenant Sécurisée
            </div>
          </div>

          {/* Real Cloud Database Sync card */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
            <span className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5 text-indigo-750">
              <Database className="w-4.5 h-4.5 text-indigo-600" />
              <span>Base de Données Cloud (Firestore)</span>
            </span>
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-150">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-wider">Connectée en temps réel</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Votre instance Firestore <strong>theta-function-437609-b9</strong> est active. Sauvegardez instantanément tout l'ERP de <strong>{settings.companyName}</strong> ou récupérez vos fiches et factures depuis le cloud.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                type="button"
                onClick={handleUploadToCloud}
                disabled={isUploadingToCloud || isDownloadingFromCloud}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                {isUploadingToCloud ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Sauvegarder</span>
              </button>

              <button 
                type="button"
                onClick={handleDownloadFromCloud}
                disabled={isUploadingToCloud || isDownloadingFromCloud}
                className="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                {isDownloadingFromCloud ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Restaurer</span>
              </button>
            </div>

            {cloudSyncStatus && (
              <div className={`p-2 rounded text-[10px] leading-tight ${
                cloudSyncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {cloudSyncStatus.message}
              </div>
            )}
          </div>

          {/* Backup Database panel - Super Admin Only */}
          {(!currentUser || currentUser.role === 'SuperAdmin') && (
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <Database className="w-4.5 h-4.5 text-emerald-600" />
                <span>Exportation & Sauvegarde Globale</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Assurez la persistance physique de vos données d'activité SaaS en téléchargeant la base au format JSON standard.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={handleExportBackup}
                  className="flex-1 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 font-bold transition flex items-center justify-center space-x-1"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Exporter JSON</span>
                </button>

                <button 
                  onClick={() => { setShowImportArea(!showImportArea); }}
                  className="flex-1 p-2 bg-indigo-50 hover:bg-indigo-150 rounded border border-indigo-100 text-indigo-700 font-bold transition flex items-center justify-center space-x-1"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Restaurer</span>
                </button>
              </div>

              {showImportArea && (
                <div className="space-y-2 mt-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Coller le code JSON de sauvegarde ci-dessous :</label>
                  <textarea 
                    rows={4}
                    value={backupText}
                    onChange={(e) => setBackupText(e.target.value)}
                    className="w-full text-[10px] font-mono p-2 border bg-slate-55 rounded focus:outline-none"
                    placeholder='{"timestamp": "...", "settings": {...}, "data": {...}}'
                  />
                  <button 
                    onClick={handleImportBackup}
                    className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-center"
                  >
                    Confirmer et écraser les données locales
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
