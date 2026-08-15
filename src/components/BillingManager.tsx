/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Client, InvoiceStatus, RecouvrementStep, AdminSettings, SmtpSettings, EmailTemplate, CommunicationLog } from '../types';
import { calculateInvoiceAmounts, formatTND, getCompanyLegalHeader } from '../utils/calculations';
import IframePrintHelper from './IframePrintHelper';
import DocumentPrintModal, { PrintModalData } from './DocumentPrintModal';
import { ElyssaLogo } from './ElyssaLogo';
import { INITIAL_EMAIL_TEMPLATES } from '../data/mockData';
import { 
  Plus, 
  Calendar, 
  CreditCard, 
  Search, 
  PhoneCall, 
  Mail, 
  FileCheck, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  ClipboardList,
  ChevronRight,
  UserCheck,
  Send,
  Loader2,
  Sparkles,
  Printer,
  Upload,
  Download,
  Scale,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';

// French currency text writer for TND (Dinars & Millimes)
function amountToWordsFR(amount: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

  const dinari = Math.floor(amount);
  const millimes = Math.round((amount - dinari) * 1000);

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    let res = "";
    const h = Math.floor(n / 100);
    const remainder = n % 100;

    if (h > 0) {
      if (h === 1) {
        res += "cent ";
      } else {
        res += units[h] + " cent ";
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        res += units[remainder];
      } else if (remainder < 20) {
        res += teens[remainder - 10];
      } else {
        const t = Math.floor(remainder / 10);
        const u = remainder % 10;
        if (u === 0) {
          res += tens[t];
        } else if (u === 1 && t < 8) {
          res += tens[t] + " et un";
        } else {
          res += tens[t] + "-" + units[u];
        }
      }
    }
    return res.trim();
  }

  function convertBig(n: number): string {
    if (n === 0) return "zéro dinar";
    let res = "";
    const millions = Math.floor(n / 1000000);
    const thousands = Math.floor((n % 1000000) / 1000);
    const remaining = n % 1000;

    if (millions > 0) {
      res += convertLessThanThousand(millions) + (millions > 1 ? " millions " : " million ");
    }
    if (thousands > 0) {
      if (thousands === 1) {
        res += "mille ";
      } else {
        res += convertLessThanThousand(thousands) + " mille ";
      }
    }
    if (remaining > 0) {
      res += convertLessThanThousand(remaining);
    }
    return res.trim();
  }

  let words = convertBig(dinari);
  words += (dinari > 1 ? " dinars" : " dinar");

  if (millimes > 0) {
    words += " et " + convertLessThanThousand(millimes) + (millimes > 1 ? " millimes" : " millime");
  } else {
    words += " et zéro millime";
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface BillingManagerProps {
  invoices: Invoice[];
  clients: Client[];
  adminSettings: AdminSettings;
  onUpdateAdminSettings?: (updatedSettings: AdminSettings) => void;
  onUpdateInvoices: (updatedInvoices: Invoice[]) => void;
  smtpSettings?: SmtpSettings;
  emailTemplates?: EmailTemplate[];
  communicationLogs?: CommunicationLog[];
  onUpdateCommunicationLogs?: (logs: CommunicationLog[]) => void;
}

export default function BillingManager({ 
  invoices, 
  clients, 
  adminSettings, 
  onUpdateAdminSettings,
  onUpdateInvoices,
  smtpSettings,
  emailTemplates = [],
  communicationLogs = [],
  onUpdateCommunicationLogs
}: BillingManagerProps) {
  const templatesToUse = Array.isArray(emailTemplates) && emailTemplates.length > 0 
    ? emailTemplates 
    : INITIAL_EMAIL_TEMPLATES;

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUri = params.get('id');
    return idFromUri || invoices[0]?.id || null;
  });

  // Unified Print Modal State
  const [unifiedPrintModalOpen, setUnifiedPrintModalOpen] = useState(false);
  const [unifiedPrintData, setUnifiedPrintData] = useState<PrintModalData | null>(null);

  const handleOpenPrintInvoice = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clientId) || {
      name: inv.clientName,
      mf: inv.clientTaxId || '1849203/A/M/000',
      address: inv.clientAddress || 'Tunis, Tunisie',
      phone: inv.clientPhone || '+216 71 000 000'
    };

    const invoiceItems = (inv.items && inv.items.length > 0) ? inv.items.map(item => ({
      ref: item.productCode || item.sku || 'SKU-001',
      description: item.description || item.productName || 'Article / Prestation',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.priceHT || 0,
      tvaRate: item.tvaRate || 19,
      totalHT: (item.quantity || 1) * (item.unitPrice || item.priceHT || 0),
      unit: item.unit || 'u.'
    })) : [
      {
        description: `Facture commerciale N° ${inv.invoiceNumber}`,
        quantity: 1,
        unitPrice: inv.amountHT || (inv.amountNetToPay ? inv.amountNetToPay / 1.19 : 100),
        tvaRate: 19,
        totalHT: inv.amountHT || (inv.amountNetToPay ? inv.amountNetToPay / 1.19 : 100),
        unit: 'U'
      }
    ];

    setUnifiedPrintData({
      docType: 'FACTURE',
      docNumber: inv.invoiceNumber,
      date: inv.issuedDate || new Date().toISOString().split('T')[0],
      companyInfo: {
        name: adminSettings?.companyName || 'Elyssa ERP Suite',
        mf: adminSettings?.matriculeFiscal || '1849203/A/M/000',
        address: adminSettings?.companyAddress || 'Zone Industrielle Radès, 2040 Tunis, Tunisie',
        phone: adminSettings?.companyPhone || '+216 71 800 900',
        email: adminSettings?.companyEmail || 'billing@elyssaerp.tn'
      },
      clientInfo: {
        name: inv.clientName || 'Client Passager',
        mf: inv.clientTaxId || (client as any).mf || 'MF-1234567/A',
        address: inv.clientAddress || client.address || 'Tunis, Tunisie',
        phone: inv.clientPhone || client.phone || ''
      },
      items: invoiceItems,
      taxRate: 19,
      timbreFiscal: 1.000,
      includeRS: true,
      rsRate: 1.5,
      notes: inv.notes || 'Paiement sous 30 jours. Soumis à la Retenue à la Source RS 1.5% selon la législation fiscale tunisienne.'
    });
    setUnifiedPrintModalOpen(true);
  };

  // Bill creation form
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [amountHTInput, setAmountHTInput] = useState<number>(0);
  const [vatRateInput, setVatRateInput] = useState<number>(adminSettings.defaultVatRate);
  const [withholdingRateInput, setWithholdingRateInput] = useState<number>(adminSettings.defaultWithholdingRate);
  const [dueDateInput, setDueDateInput] = useState('');

  // Configurable rates states
  const [vatRatesList, setVatRatesList] = useState<number[]>(() => {
    const saved = localStorage.getItem('carthage_billing_vat_rates');
    return saved ? JSON.parse(saved) : [19, 13, 7, 0];
  });
  const [withholdingRatesList, setWithholdingRatesList] = useState<number[]>(() => {
    const saved = localStorage.getItem('carthage_billing_withholding_rates');
    return saved ? JSON.parse(saved) : [1.5, 15, 5, 10, 0];
  });
  const [stampDutyValue, setStampDutyValue] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_billing_stamp_duty');
    return saved ? Number(saved) : 1.0;
  });

  const updateVatRates = (rates: number[]) => {
    setVatRatesList(rates);
    localStorage.setItem('carthage_billing_vat_rates', JSON.stringify(rates));
  };

  const updateWithholdingRates = (rates: number[]) => {
    setWithholdingRatesList(rates);
    localStorage.setItem('carthage_billing_withholding_rates', JSON.stringify(rates));
  };

  const updateStampDuty = (val: number) => {
    setStampDutyValue(val);
    localStorage.setItem('carthage_billing_stamp_duty', String(val));
  };

  // Collection step logger form
  const [collectionActionType, setCollectionActionType] = useState<'Email' | 'Call' | 'Letter' | 'Legal'>('Email');
  const [collectionActionNote, setCollectionActionNote] = useState('');
  const [collectionPerformedBy, setCollectionPerformedBy] = useState('Service Recouvrement');

  const [activeDetailTab, setActiveDetailTab] = useState<'recovery' | 'invoice_preview' | 'huissier_act'>('recovery');

  // Iframe print fallback helper states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocName, setPrintDocName] = useState('');
  const [printDocTab, setPrintDocTab] = useState('billing');
  const [printTarget, setPrintTarget] = useState('');
  const [printTargetId, setPrintTargetId] = useState('');

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

  const handleInlineLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (onUpdateAdminSettings) {
          onUpdateAdminSettings({
            ...adminSettings,
            companyLogo: compressed
          });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreGoldenWomanLogo = () => {
    const goldenWomanLogo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=";
    if (onUpdateAdminSettings) {
      onUpdateAdminSettings({
        ...adminSettings,
        companyLogo: goldenWomanLogo
      });
      alert("Le logo historique de la Femme Dorée Elyssa a été restauré avec succès !");
    }
  };

  const handleInlineDownloadLogo = () => {
    if (!adminSettings.companyLogo) {
      alert("Aucun logo à télécharger.");
      return;
    }
    const link = document.createElement('a');
    link.href = adminSettings.companyLogo;
    link.download = adminSettings.companyLogo.startsWith('data:image/svg+xml') 
      ? 'logo_carthage.svg' 
      : 'logo_carthage.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  // SMTP Email Send local states & handlers
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedbackMessage, setEmailFeedbackMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");

  React.useEffect(() => {
    if (selectedInvoice) {
      const client = clients.find(c => c.id === selectedInvoice.clientId);
      setCustomRecipientEmail(client?.email || "");
    } else {
      setCustomRecipientEmail("");
    }
    setEmailFeedbackMessage(null);
  }, [selectedInvoiceId, clients, selectedInvoice]);

  const fillTemplate = (templateBody: string, invoice: Invoice, client: Client) => {
    return templateBody
      .replace(/\{\{clientName\}\}/g, client.name)
      .replace(/\{\{invoiceNumber\}\}/g, invoice.invoiceNumber)
      .replace(/\{\{amountTTC\}\}/g, formatTND(invoice.amountTTC))
      .replace(/\{\{amountNetToPay\}\}/g, formatTND(invoice.amountNetToPay))
      .replace(/\{\{dueDate\}\}/g, invoice.dueDate)
      .replace(/\{\{issuedDate\}\}/g, invoice.issuedDate)
      .replace(/\{\{withholdingAmount\}\}/g, formatTND(invoice.withholdingAmount))
      .replace(/\{\{withholdingTaxRate\}\}/g, String(invoice.withholdingTaxRate));
  };

  const triggerInvoiceEmail = async (invoice: Invoice, templateId: string) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const template = templatesToUse.find(t => t.id === templateId);
    
    if (!client) {
      setEmailFeedbackMessage({
        success: false,
        message: "Erreur : Le client associé à cette facture est introuvable dans la base de données."
      });
      return;
    }

    if (!template) {
      setEmailFeedbackMessage({
        success: false,
        message: "Erreur : Le modèle d'e-mail sélectionné est introuvable."
      });
      return;
    }

    const emailToUse = customRecipientEmail.trim();

    if (!emailToUse) {
      setEmailFeedbackMessage({
        success: false,
        message: "Erreur : Veuillez saisir ou vérifier l'adresse e-mail de destination."
      });
      return;
    }

    if (!emailToUse.includes("@")) {
      setEmailFeedbackMessage({
        success: false,
        message: "Erreur : L'adresse e-mail saisie n'est pas valide (le symbole '@' est requis)."
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailFeedbackMessage(null);

    // Parse variables
    const parsedSubject = fillTemplate(template.subject, invoice, client);
    const parsedBody = fillTemplate(template.body, invoice, client);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpSettings,
          recipientName: client.name,
          recipientEmail: emailToUse,
          subject: parsedSubject,
          body: parsedBody,
          referenceId: invoice.invoiceNumber,
          templateType: templateId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailFeedbackMessage({
          success: true,
          message: data.message || `L'email (${template.name}) a été traité avec succès.`
        });

        // Add auto communication log list item
        if (data.log && onUpdateCommunicationLogs) {
          onUpdateCommunicationLogs([data.log, ...communicationLogs]);
        }

        // Add auto Recovery/Recouvrement step record to the invoice
        const newStep: RecouvrementStep = {
          id: `step_auto_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Email',
          note: `Envoi automatique [${template.name}] - Sujet : "${parsedSubject}"`,
          performedBy: 'Assistant Elyssa ERP'
        };

        const updated = invoices.map(inv => {
          if (inv.id === invoice.id) {
            return {
              ...inv,
              recouvrementSteps: [...(inv.recouvrementSteps || []), newStep],
              status: inv.status === 'Unpaid' ? 'Debt_Collection' as InvoiceStatus : inv.status
            };
          }
          return inv;
        });
        onUpdateInvoices(updated);

      } else {
        setEmailFeedbackMessage({
          success: false,
          message: data.message || "L'envoi par courriel a échoué."
        });
      }
    } catch (err: any) {
      setEmailFeedbackMessage({
        success: false,
        message: `Erreur lors de la communication : ${err.message || err}`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Preview computations
  const previewVatAmount = amountHTInput * (vatRateInput / 100);
  const previewTTC = amountHTInput + previewVatAmount + stampDutyValue;
  const previewWithholding = previewTTC >= adminSettings.withholdingThreshold ? (previewTTC * (withholdingRateInput / 100)) : 0;
  const previewNetToPay = previewTTC - previewWithholding;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all essential company legal fields are configured before generating documents
    const missingFields: string[] = [];
    if (!adminSettings.legalForm) missingFields.push("Forme Juridique");
    if (!adminSettings.shareCapital || adminSettings.shareCapital <= 0) missingFields.push("Capital Social");
    if (!adminSettings.rneNumber) missingFields.push("Numéro RNE");
    if (!adminSettings.companyMF) missingFields.push("Matricule Fiscal (MF)");
    if (!adminSettings.legalRepresentative) missingFields.push("Gérant / Représentant Légal");
    if (!adminSettings.companyAddress) missingFields.push("Adresse du Siège Social");
    if (!adminSettings.cityZipCode) missingFields.push("Ville & Code Postal");
    if (!adminSettings.website) missingFields.push("Site Web");

    if (missingFields.length > 0) {
      alert(
        `🚨 ERREUR BLOQUANTE : La configuration légale de votre entreprise est incomplète.\n\n` +
        `Pour générer des documents officiels (Factures, Contrats, Devis), veuillez d'abord renseigner les champs suivants dans la Console d'Administration (Paramètres de l'Entreprise) :\n` +
        missingFields.map(f => `• ${f}`).join("\n")
      );
      return;
    }

    if (!invoiceClientId || amountHTInput <= 0) {
      alert('Veuillez sélectionner un client et entrer un montant valide supérieur à 0.');
      return;
    }

    const matchedClient = clients.find(c => c.id === invoiceClientId);
    const clientName = matchedClient ? matchedClient.name : 'Client Inconnu';

    const vatAmount = Math.round(amountHTInput * (vatRateInput / 100) * 1000) / 1000;
    const amountTTC = Math.round((amountHTInput + vatAmount + stampDutyValue) * 1000) / 1000;
    let withholdingAmount = 0;
    if (amountTTC >= adminSettings.withholdingThreshold) {
      withholdingAmount = Math.round(amountTTC * (withholdingRateInput / 100) * 1000) / 1000;
    }
    const amountNetToPay = Math.round((amountTTC - withholdingAmount) * 1000) / 1000;

    const newInv: Invoice = {
      id: `inv_${Date.now()}`,
      clientId: invoiceClientId,
      clientName,
      invoiceNumber: `FA-2026-${String(invoices.length + 10).padStart(4, '0')}`,
      amountHT: amountHTInput,
      vatRate: vatRateInput,
      vatAmount,
      withholdingTaxRate: withholdingRateInput,
      withholdingAmount,
      amountTTC,
      amountNetToPay,
      status: 'Unpaid',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: dueDateInput || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recouvrementSteps: [],
      withholdingCertificateReceived: false
    };

    onUpdateInvoices([...invoices, newInv]);
    setSelectedInvoiceId(newInv.id);
    setIsAddingInvoice(false);

    // Reset
    setInvoiceClientId('');
    setAmountHTInput(0);
  };

  const handleAddRecouvrementStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !collectionActionNote) return;

    const newStep: RecouvrementStep = {
      id: `step_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: collectionActionType,
      note: collectionActionNote,
      performedBy: collectionPerformedBy
    };

    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoiceId) {
        return {
          ...inv,
          recouvrementSteps: [...(inv.recouvrementSteps || []), newStep],
          status: inv.status === 'Unpaid' ? 'Debt_Collection' as InvoiceStatus : inv.status
        };
      }
      return inv;
    });

    onUpdateInvoices(updated);
    setCollectionActionNote('');
  };

  const handleToggleCertificate = () => {
    if (!selectedInvoiceId) return;
    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoiceId) {
        return {
          ...inv,
          withholdingCertificateReceived: !inv.withholdingCertificateReceived
        };
      }
      return inv;
    });
    onUpdateInvoices(updated);
  };

  const handleChangeInvoiceStatus = (status: InvoiceStatus) => {
    if (!selectedInvoiceId) return;
    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoiceId) {
        return {
          ...inv,
          status,
          collectedAmount: status === 'Paid' ? inv.amountNetToPay : 0
        };
      }
      return inv;
    });
    onUpdateInvoices(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    if (!confirm('Voulez-vous supprimer définitivement cette écriture comptable ?')) return;
    const remaining = invoices.filter(inv => inv.id !== id);
    onUpdateInvoices(remaining);
    setSelectedInvoiceId(remaining[0]?.id || null);
  };

  const isDemoInvoice = (inv: any) => {
    return inv.id?.startsWith('demo-') || inv.is_demo === true || inv.isDemo === true || ['inv_1', 'inv_2', 'inv_3', 'inv_4', 'inv_5'].includes(inv.id);
  };

  const filteredInvoices = invoices.filter(inv => {
    return selectedStatusFilter === 'All' || inv.status === selectedStatusFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Column */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-150 p-4 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-base">Factures ({filteredInvoices.length})</h3>
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => { setIsAddingInvoice(false); setSelectedInvoiceId('settings'); }}
              className={`p-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                selectedInvoiceId === 'settings'
                  ? 'bg-indigo-650 hover:bg-indigo-700 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>Config</span>
            </button>
            <button 
              onClick={() => { setIsAddingInvoice(true); setSelectedInvoiceId(null); }}
              className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Facturer</span>
            </button>
          </div>
        </div>

        {/* Filter Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filtrer par état de paiement</label>
            <select 
              value={selectedStatusFilter}
              onChange={(e: any) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded"
            >
              <option value="All">Toutes les écritures</option>
              <option value="Draft">Brouillon</option>
              <option value="Unpaid">Non payée (En attente d'échéance)</option>
              <option value="Debt_Collection">En recouvrement (Relancée)</option>
              <option value="Paid">Payée (Trésorerie close)</option>
            </select>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-2 overflow-y-auto max-h-[460px]">
          {filteredInvoices.map(inv => {
            const isSelected = inv.id === selectedInvoiceId;
            const statusConfig = {
              Draft: { color: 'text-slate-500 bg-slate-100', text: 'Brouillon' },
              Unpaid: { color: 'text-blue-600 bg-blue-50 border-blue-100', text: 'Non Payée' },
              Debt_Collection: { color: 'text-red-700 bg-red-50 border-red-100', text: 'Recouvrement' },
              Paid: { color: 'text-emerald-700 bg-emerald-50 border-emerald-100', text: 'Encaissée' }
            };
            const currentStatus = statusConfig[inv.status] || { color: 'bg-slate-100 text-slate-400', text: 'Inconnu' };

            return (
              <div 
                key={inv.id}
                onClick={() => { setSelectedInvoiceId(inv.id); setIsAddingInvoice(false); }}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col space-y-1 ${
                  isSelected ? 'border-emerald-600 bg-emerald-50/20 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    {inv.invoiceNumber}
                    {isDemoInvoice(inv) ? (
                      <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                    ) : (
                      <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                    )}
                  </span>
                  <span className="text-slate-400 font-semibold">{inv.issuedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-700 truncate max-w-[140px] font-medium">{inv.clientName}</span>
                  <span className="text-xs font-extrabold text-slate-900">{formatTND(inv.amountNetToPay)}</span>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 text-[9px]">
                  <span className={`px-2 py-0.2 rounded border font-bold ${currentStatus.color}`}>
                    {currentStatus.text}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {inv.withholdingAmount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        inv.withholdingCertificateReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        RS: {inv.withholdingCertificateReceived ? 'Certificat reçu' : 'RS à collecter'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPrintInvoice(inv);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-black text-[9px] flex items-center space-x-1 cursor-pointer transition shrink-0 shadow-2xs"
                      title="Imprimer Facture A4 avec TVA, Timbre & RS 1.5%"
                    >
                      <Printer className="w-3 h-3 text-indigo-600" />
                      <span>🖨️ Imprimer Facture A4</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredInvoices.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">Aucune facture n'est répertoriée.</div>
          )}
        </div>
      </div>

      {/* Detail / Invoice Creation Form Column */}
      <div className="lg:col-span-2">
        {isAddingInvoice ? (
          /* BILLS CREATION INTERFACE */
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 text-emerald-700">Editer une Facture Client (Tunisie & Fiscalité)</h3>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Client à facturer *</label>
                  <select 
                    value={invoiceClientId}
                    onChange={(e) => {
                      setInvoiceClientId(e.target.value);
                      const cli = clients.find(c => c.id === e.target.value);
                      if (cli && cli.category === 'Export') {
                        // In Tunisia export invoices have 0% VAT and 0% withholding tax by law
                        setVatRateInput(0);
                        setWithholdingRateInput(0);
                      } else {
                        setVatRateInput(adminSettings.defaultVatRate);
                        setWithholdingRateInput(adminSettings.defaultWithholdingRate);
                      }
                    }}
                    required
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 font-bold"
                  >
                    <option value="">Sélectionnez un client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Montant net Hors-Taxe (HT) en TND *</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0.001"
                    required
                    placeholder="Ex: 5000.000 (Tunisien)"
                    value={amountHTInput || ''}
                    onChange={(e) => setAmountHTInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Taux de TVA applicable (%)</label>
                  <select 
                    value={vatRateInput}
                    onChange={(e) => setVatRateInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 font-semibold"
                  >
                    {vatRatesList.map(rate => (
                      <option key={rate} value={rate}>
                        {rate}% {rate === 19 ? "(Taux standard)" : rate === 13 ? "(Taux libéral/informatique)" : rate === 7 ? "(Taux réduit)" : rate === 0 ? "(Exportation suspensive)" : "(Taux personnalisé)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Taux de Retenue à la source (%)</label>
                  <select 
                    value={withholdingRateInput}
                    onChange={(e) => setWithholdingRateInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 font-semibold"
                  >
                    {withholdingRatesList.map(rate => (
                      <option key={rate} value={rate}>
                        {rate}% {rate === 1.5 ? "(Achat local >= 1000 TND TTC)" : rate === 15 ? "(Honoraires/Contrats libéraux)" : rate === 5 ? "(Sous-traitance standard)" : rate === 0 ? "(Exonéré/Export)" : "(Taux personnalisé)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Échéance d'exigibilité du paiement</label>
                  <input 
                    type="date" 
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded"
                  />
                </div>
              </div>

              {/* Dynamic Live Calculations Review */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Aperçu financier dynamique</span>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-slate-500">Montant Brut HT:</span>
                  <span className="text-right font-bold text-slate-800">{formatTND(amountHTInput)}</span>

                  <span className="text-slate-500">Montant TVA ({vatRateInput}%):</span>
                  <span className="text-right font-bold text-slate-800">{formatTND(previewVatAmount)}</span>

                  <span className="text-slate-500">Droit de Timbre Fiscal:</span>
                  <span className="text-right font-bold text-slate-800">{formatTND(stampDutyValue)}</span>

                  <span className="text-slate-500">Total TTC:</span>
                  <span className="text-right font-extrabold text-slate-900 border-b pb-0.5">{formatTND(previewTTC)}</span>

                  <span className="text-amber-700 font-medium">Retenue à la source (RS {withholdingRateInput}%):</span>
                  <span className={`text-right font-bold text-amber-800 ${previewWithholding > 0 ? 'inline' : 'line-through text-slate-300'}`}>
                    - {formatTND(previewWithholding)}
                  </span>
                  {previewWithholding === 0 && amountHTInput > 0 && (
                    <span className="text-[10px] text-amber-600 font-semibold col-span-2">
                      * TTC sous le seuil légal de {formatTND(adminSettings.withholdingThreshold)}. Aucune RS appliquée.
                    </span>
                  )}

                  <span className="font-bold text-indigo-700 pt-1.5 text-sm">Net à recevoir en banque:</span>
                  <span className="text-right font-black text-indigo-900 text-sm pt-1.5 border-t border-indigo-200">
                    {formatTND(previewNetToPay)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsAddingInvoice(false)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                >
                  Générer et Enregistrer
                </button>
              </div>
            </form>
          </div>
        ) : selectedInvoice ? (
          /* DETAILED VIEW AND DEBT RECOVERY LOGS WITH THREE TABS */
          <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveDetailTab('recovery')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                  activeDetailTab === 'recovery'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/40'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Suivi & Recouvrement</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('invoice_preview')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                  activeDetailTab === 'invoice_preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Aperçu Facture</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('huissier_act')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                  activeDetailTab === 'huissier_act'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/40'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Mise en Demeure</span>
              </button>
            </div>

            {activeDetailTab === 'recovery' ? (
              <>
                {/* Invoice invoice summary bill */}
                <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Facture Officielle Elyssa S.A.</span>
                      <h3 className="text-base font-black text-slate-800 mt-1 flex items-center gap-1.5">
                        <span>{selectedInvoice.invoiceNumber}</span>
                        {selectedInvoice.id.startsWith('demo-') && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.5 rounded uppercase leading-none">Démo</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">Client débiteur : <strong className="text-indigo-700">{selectedInvoice.clientName}</strong></p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded font-bold ${
                        selectedInvoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        Statut : {selectedInvoice.status === 'Paid' ? 'Encaissée' : 'Impayée / En cours'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2">Date limite: <strong>{selectedInvoice.dueDate}</strong></p>
                    </div>
                  </div>

                  {/* Financial block spreadsheet layout */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
                    <div className="text-xs">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Base Hors-Taxe</span>
                      <span className="font-bold text-slate-800 text-[13px]">{formatTND(selectedInvoice.amountHT)}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">TVA ({selectedInvoice.vatRate}%)</span>
                      <span className="font-bold text-slate-800 text-[13px]">{formatTND(selectedInvoice.vatAmount)}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Retenue (RS {selectedInvoice.withholdingTaxRate}%)</span>
                      <span className="font-bold text-amber-700 text-[13px]">{formatTND(selectedInvoice.withholdingAmount)}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-indigo-600 block font-bold text-[10px] uppercase">Dû Net (TND)</span>
                      <span className="font-black text-indigo-900 text-[14px]">{formatTND(selectedInvoice.amountNetToPay)}</span>
                    </div>
                  </div>

                  {/* SMTP Communication Box inside Invoice details container */}
                  <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50/20 p-4 rounded-xl border border-indigo-100/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-indigo-950 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Envoi de Relance & Facture par Email / SMTP</span>
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        smtpSettings?.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {smtpSettings?.isEnabled ? "Mode SMTP Connecté" : "Simulation sans SMTP"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600 leading-relaxed">
                        Expédiez directement cette pièce comptable ou une relance amiable par e-mail au client. Vous pouvez modifier l'adresse de destination ci-dessous :
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={customRecipientEmail}
                          onChange={(e) => setCustomRecipientEmail(e.target.value)}
                          placeholder="Saisir l'adresse e-mail de destination..."
                          className="flex-1 text-xs p-2 border border-indigo-100 rounded-lg bg-white/80 focus:ring-1 focus:ring-indigo-400 focus:outline-none font-mono text-indigo-950 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const originalClient = clients.find(c => c.id === selectedInvoice.clientId);
                            setCustomRecipientEmail(originalClient?.email || "");
                          }}
                          className="text-[10px] font-bold px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                          title="Réinitialiser à l'adresse par défaut du client"
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>

                    {emailFeedbackMessage && (
                      <div className={`p-2.5 px-3 border rounded-lg text-xs flex items-center space-x-2 ${
                        emailFeedbackMessage.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        {emailFeedbackMessage.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{emailFeedbackMessage.message}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {templatesToUse.map(templ => {
                        let badgeColor = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
                        if (templ.id === "temp_invoice") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
                        if (templ.id === "temp_collection_lvl2") badgeColor = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse";
                        
                        return (
                          <button
                            key={templ.id}
                            type="button"
                            disabled={isSendingEmail}
                            onClick={() => triggerInvoiceEmail(selectedInvoice, templ.id)}
                            className={`p-2 px-3 border rounded-xl text-[10px] font-black flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 ${badgeColor}`}
                          >
                            {isSendingEmail ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{templ.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Withholding Certificate Toggle Receipt */}
                  {selectedInvoice.withholdingAmount > 0 && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-5 h-5 text-amber-600 animate-bounce" />
                        <div>
                          <span className="font-bold text-slate-700">Certificat de Retenue à la Source (Tunisie) :</span>
                          <p className="text-[11px] text-slate-500">Un document de {formatTND(selectedInvoice.withholdingAmount)} doit être récupéré auprès du service comptable client.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleToggleCertificate}
                        className={`p-1.5 px-3 rounded font-bold transition ${
                          selectedInvoice.withholdingCertificateReceived 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {selectedInvoice.withholdingCertificateReceived ? 'Certificat Collecté ✓' : 'Marquer Reçu'}
                      </button>
                    </div>
                  )}

                  {/* Manual Control Actions buttons */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs gap-2 flex-wrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Action statut:</span>
                      {['Unpaid', 'Debt_Collection', 'Paid'].map(st => {
                        const active = selectedInvoice.status === st;
                        const labels = { Unpaid: 'Non Payée', Debt_Collection: 'Recouvrement', Paid: 'Marquer Encaissée' };
                        return (
                          <button 
                            key={st}
                            onClick={() => handleChangeInvoiceStatus(st as InvoiceStatus)}
                            className={`p-1 px-2.5 rounded font-bold text-[10px] transition ${
                              active 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border'
                            }`}
                          >
                            {labels[st as InvoiceStatus]}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                      className="p-1 px-2.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-semibold"
                    >
                      Supprimer Facture
                    </button>
                  </div>
                </div>

                {/* DEBT COLLECTING RELATIONS & ACTIVITIES HISTORY */}
                <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-1 text-red-700">Journal de Recouvrement (Actions de poursuite)</h3>

                  {/* Log new Step Form */}
                  <form onSubmit={handleAddRecouvrementStep} className="p-3 bg-red-50/20 rounded-xl space-y-3 border border-red-50 text-xs">
                    <span className="font-bold text-slate-700 flex items-center space-x-1">
                      <PhoneCall className="w-4 h-4 text-red-600" />
                      <span>Enregistrer une démarche de recouvrement directe auprès du client</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-500">Moyen de contact</label>
                        <select 
                          value={collectionActionType}
                          onChange={(e: any) => setCollectionActionType(e.target.value)}
                          className="p-1 border bg-white rounded text-xs w-full"
                        >
                          <option value="Email">Relance par E-mail direct</option>
                          <option value="Call">Appel téléphonique (Trésorerie)</option>
                          <option value="Letter">Mise en demeure par Courrier Oficiel</option>
                          <option value="Legal">Action en Justice (Contentieux)</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-slate-500">Note d'avancement (Qu'a dit le client ? Date promise ?)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Promesse de virement d'ici la semaine prochaine..."
                          value={collectionActionNote}
                          onChange={(e) => setCollectionActionNote(e.target.value)}
                          className="p-1 border bg-white rounded text-xs w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit"
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
                      >
                        Ajouter au dossier
                      </button>
                    </div>
                  </form>

                  {/* Actions History Loop */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(!selectedInvoice.recouvrementSteps || selectedInvoice.recouvrementSteps.length === 0) ? (
                      <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                        Aucune action de recouvrement amiable enregistrée pour cette facture. Elle est toujours en attente de règlement passif.
                      </div>
                    ) : (
                      selectedInvoice.recouvrementSteps.map(step => {
                        const iconConfig = {
                          Email: <Mail className="w-4 h-4 text-blue-600" />,
                          Call: <PhoneCall className="w-4 h-4 text-indigo-600" />,
                          Letter: <ShieldAlert className="w-4 h-4 text-amber-600" />,
                          Legal: <AlertCircle className="w-4 h-4 text-red-600" />
                        };
                        return (
                          <div key={step.id} className="p-3 bg-slate-50 rounded-lg border flex items-start space-x-3 text-xs">
                            <div className="mt-0.5">{iconConfig[step.type]}</div>
                            <div className="flex-1">
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <strong>{step.type === 'Call' ? 'Appel' : step.type === 'Letter' ? 'Mise en Demeure' : step.type}</strong>
                                <span>{step.date}</span>
                              </div>
                              <p className="text-slate-700 mt-1">{step.note}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">Saisie par: <strong>{step.performedBy}</strong></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : activeDetailTab === 'invoice_preview' ? (
              <div className="space-y-6">
                {/* Print Layout */}
                <div id="printable-invoice" className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-xs text-slate-700 font-sans">
                  {/* Top Header */}
                  <div className="flex justify-between items-start border-b pb-6 border-slate-200">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {adminSettings.companyLogo ? (
                          <img src={adminSettings.companyLogo} alt="Logo de l'entreprise" className="max-h-12 max-w-[140px] rounded object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <ElyssaLogo className="w-10 h-10 rounded-lg" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-pre-line leading-relaxed">
                        {getCompanyLegalHeader(adminSettings)}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <h4 className="text-lg font-black text-slate-200 uppercase tracking-widest font-display">FACTURE</h4>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200/60 inline-block text-left text-[11px] space-y-1 mt-1">
                        <p>N° Facture : <strong className="text-slate-200 font-mono">{selectedInvoice.invoiceNumber}</strong></p>
                        <p>Date d'émission : <span className="font-semibold text-slate-300">{selectedInvoice.issuedDate}</span></p>
                        <p>Date d'échéance : <span className="font-semibold text-slate-300">{selectedInvoice.dueDate}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-201">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destinataire (Facturé à)</span>
                      <p className="font-extrabold text-[13px] text-slate-200">{selectedInvoice.clientName}</p>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Catégorie : <strong className="text-indigo-400">{clients.find(c => c.id === selectedInvoice.clientId)?.category || "Standard"}</strong>
                      </p>
                      <p className="text-slate-400 text-[11px]">Email : <span className="font-mono">{clients.find(c => c.id === selectedInvoice.clientId)?.email || "sans-email"}</span></p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Détails Réglementaires (Tunisie)</span>
                      <p className="text-[11px] text-slate-400">MF Client : <strong>1234567/B/A/000</strong></p>
                      <p className="text-[11px] text-slate-400">Régime fiscal : <strong>{clients.find(c => c.id === selectedInvoice.clientId)?.category === 'Export' ? "Régime d'exportation (0% TVA)" : "Régime commun tunisien"}</strong></p>
                    </div>
                  </div>

                  {/* table items */}
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] uppercase text-slate-400 font-bold border-b">
                          <th className="p-3">Désignation des Prestations et Fournitures</th>
                          <th className="p-3 text-right">Base HT (TND)</th>
                          <th className="p-3 text-right">TVA (%)</th>
                          <th className="p-3 text-right">Montant TVA (TND)</th>
                          <th className="p-3 text-right">Total TTC (TND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-300">
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">
                            <div>Prestations d'ingénierie, de câblage et logistique industrielle</div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Réf : {selectedInvoice.invoiceNumber} - Elyssa S.A.</span>
                          </td>
                          <td className="p-3 text-right font-mono">{formatTND(selectedInvoice.amountHT)}</td>
                          <td className="p-3 text-right">{selectedInvoice.vatRate}%</td>
                          <td className="p-3 text-right font-mono">{formatTND(selectedInvoice.vatAmount)}</td>
                          <td className="p-3 text-right font-black font-mono">{formatTND(selectedInvoice.amountHT + selectedInvoice.vatAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Block */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
                    <div className="max-w-[320px] bg-indigo-50/20 border border-indigo-100 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-400 block pb-1 border-b border-indigo-50/20">Arrêté en toutes lettres :</span>
                      <p className="text-[11px] font-bold italic text-indigo-300 leading-relaxed pt-1">
                        "{amountToWordsFR(selectedInvoice.amountNetToPay)}"
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-2">
                        * Arrêté par le Directeur Financier, payable par virement bancaire ou chèque barré certifié sous les dispositions prévues par la fiscalité tunisienne.
                      </span>
                    </div>

                    <div className="w-full md:w-[280px] bg-slate-50 p-4 rounded-xl border space-y-2 font-semibold">
                      <div className="flex justify-between text-slate-455 text-xs">
                        <span>Total Hors-Taxe :</span>
                        <span className="font-bold text-slate-200 font-mono">{formatTND(selectedInvoice.amountHT)}</span>
                      </div>
                      <div className="flex justify-between text-slate-455 text-xs border-b border-slate-100 pb-1.5">
                        <span>TVA ({selectedInvoice.vatRate}%) :</span>
                        <span className="font-bold text-slate-200 font-mono">{formatTND(selectedInvoice.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-200 text-xs font-bold">
                        <span>Total TTC :</span>
                        <span className="font-black text-slate-100 font-mono">{formatTND(selectedInvoice.amountHT + selectedInvoice.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-amber-500 text-[11px] leading-tight">
                        <span>Retenue à la source ({selectedInvoice.withholdingTaxRate}%) :</span>
                        <span className="font-extrabold text-amber-500 font-mono">- {formatTND(selectedInvoice.withholdingAmount)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-300 text-sm font-black pt-1.5 border-t border-indigo-200">
                        <span>NET À PAYER S.A. :</span>
                        <span className="text-md text-indigo-200 font-black font-mono">{formatTND(selectedInvoice.amountNetToPay)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Stamps */}
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-200 text-slate-400 text-[10px]">
                    <div>
                      <p className="font-bold uppercase mb-1">Cachet & Signature Client</p>
                      <div className="h-20 bg-slate-50 rounded-lg border border-dashed border-slate-101 flex items-center justify-center text-slate-400">
                        Mention "Lu et approuvé - Bon pour paiement"
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold uppercase mb-1">Elyssa Directions des Finances</p>
                      <div className="h-20 bg-emerald-50/25 rounded-lg border border-dashed border-emerald-100 flex flex-col items-center justify-center text-emerald-800 select-none p-2">
                        <CheckCircle className="w-5 h-5 text-emerald-650 mb-0.5 animate-pulse" />
                        <span className="font-black text-emerald-600">ELYSSA ERP FINANCE</span>
                        <span className="text-[8px] font-mono text-emerald-500">Certifié Électronique TUNTRUST</span>
                      </div>
                    </div>
                  </div>

                  {/* Corporate Premium Footer */}
                  <div className="border-t border-slate-200 pt-3 mt-6 text-center text-[8.5px] text-slate-400 font-sans space-y-1 tracking-wide">
                    <p className="font-bold">Elyssa ERP Suite • Facture Commerciale Éditée Électriquement</p>
                    <p>
                      {adminSettings?.companyName || "Inter-Affaires"} 
                      {adminSettings?.legalForm ? ` (${adminSettings.legalForm})` : ""} 
                      {adminSettings?.shareCapital ? ` au capital de ${adminSettings.shareCapital.toLocaleString('fr-FR')} TND` : ""} 
                      {adminSettings?.rneNumber ? ` - RNE ${adminSettings.rneNumber}` : ""} 
                      {adminSettings?.companyMF ? ` - MF ${adminSettings.companyMF}` : ""} 
                      {adminSettings?.companyAddress ? ` - ${adminSettings.companyAddress}` : ""} 
                      {adminSettings?.cityZipCode ? ` ${adminSettings.cityZipCode}` : ""}
                    </p>
                  </div>
                </div>

                {/* Print and logo uploads section */}
                <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenPrintInvoice(selectedInvoice)}
                      className="p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ Imprimer Facture A4 (TVA / Timbre / RS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInlineDownloadLogo}
                      disabled={!adminSettings.companyLogo}
                      className="p-2 px-4 border border-slate-200 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Télécharger Logo</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <label className="text-xs font-bold text-slate-400 uppercase shrink-0">Changer Logo Société :</label>
                    <label className="p-2 px-4 border border-dashed border-indigo-500 hover:bg-slate-800 text-indigo-400 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer relative">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span>Téléverser Logo (.png, .svg)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleInlineLogoUpload}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRestoreGoldenWomanLogo}
                      className="p-2 px-4 bg-indigo-950 border border-indigo-500/30 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Restaurer Femme Dorée (Logo Elyssa)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB HUISSIER_ACT - LEGAL CONTENTIOUS MISE EN DEMEURE */
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-200 text-sm border-b pb-2 text-rose-700 flex items-center space-x-1.5 uppercase tracking-wider font-display">
                    <Scale className="w-4.5 h-4.5" />
                    <span>Création d'Acte d'Huissier-Notaire (Tunisie)</span>
                  </h3>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sous l'égide du Code des Obligations et des Contrats de la République Tunisienne, ce module génère automatiquement une <strong>sommation de payer</strong> officielle prête à être délivrée par voie d'huissier de justice (huissier-notaire) pour interrompre toute prescription civile ou commerciale.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold">Cabinet d'Huissier requis *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Maître KHALED BEN SALAH, Huissier-Notaire"
                        defaultValue="Maître Khaled Ben Salah, Huissier-Notaire près le Tribunal de Tunis"
                        id="huissier-name-input"
                        className="w-full p-2 border border-slate-200 rounded text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold">Délai contractuel de sommation (jours francs) *</label>
                      <select 
                        id="huissier-delay-select"
                        defaultValue="15"
                        className="w-full p-2 border border-slate-200 rounded text-xs font-bold bg-slate-50"
                      >
                        <option value="7">Sous 7 jours francs (Procédure accélérée)</option>
                        <option value="15">Sous 15 jours francs (Usage commercial courant)</option>
                        <option value="30">Sous 30 jours (Délai d'apaisement d'affaires)</option>
                      </select>
                    </div>
                  </div>

                  {/* Generated Formal Judicial Template Preview */}
                  <div id="printable-judicial-notice" className="bg-amber-50/25 border border-amber-200/60 p-8 rounded-xl font-serif text-[11.5px] leading-relaxed text-slate-250 space-y-4">
                    <div className="flex justify-between border-b pb-4 border-amber-150 font-sans">
                      <div className="flex items-center gap-3">
                        <ElyssaLogo className="w-12 h-12 rounded-xl bg-slate-900 p-2 shrink-0 border border-slate-800" />
                        <div>
                          <strong className="text-amber-600 font-extrabold tracking-wider">RÉPUBLIQUE TUNISIENNE</strong>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Étude Juridique de Huissier de Justice</p>
                          <p className="text-[9px] text-slate-400">Près le Tribunal de Première Instance de Tunis</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-455">
                        <p className="font-bold text-amber-600 font-display">Loi Commerciale Tunisienne</p>
                        <p className="text-[9px] font-mono text-slate-400">Dossier Contentieux N° : MC-2026-{(selectedInvoice.invoiceNumber).replace('FA-2026-', '')}</p>
                      </div>
                    </div>

                    <div className="text-center py-2 font-sans">
                      <h4 className="text-[14px] font-black underline uppercase text-slate-100 tracking-wide">MISE EN DEMEURE ET COMMANDEMENT DE PAYER</h4>
                      <p className="text-[10px] text-indigo-400 mt-1 font-semibold">Par exploit d'Huissier de Justice - Sommation civile de payer sous peine de forclusion</p>
                    </div>

                    <p>
                      À la demande de la société <strong>ELYSSA SOLUTIONS ENTREPRISES S.A.</strong>, personne morale de droit tunisien dont le siège social est sis à Boulevard du Lac, Les Berges du Lac, BP 2045 Tunis, agissant poursuites et diligences de son représentant financier légal.
                    </p>

                    <p>
                      J’ai, Maître soussigné, Huissier-Notaire près le Tribunal de Première Instance de Tunis, fait notification, commandement et sommation formelle à :
                    </p>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-sans text-xs space-y-1">
                      <p className="font-bold text-slate-200">Le débiteur : {selectedInvoice.clientName}</p>
                      <p className="text-slate-400">Catégorie de commerce : {clients.find(c => c.id === selectedInvoice.clientId)?.category || "Professionnel tunisien"}</p>
                      <p className="text-slate-400">Domicile : Adresse enregistrée au Répertoire National des Entreprises (RNE).</p>
                    </div>

                    <p>
                      De payer immédiatement et sous un délai de <strong className="text-slate-100">15 jours francs</strong> à compter de la présente sommation, en l'étude de l'huissier instrumentaire ou par virement bancaire créditeur de Elyssa S.A., la créance commerciale certaine, liquide et exigible suivante :
                    </p>

                    <ul className="list-disc pl-6 space-y-1 text-slate-300 font-sans text-xs">
                      <li>Facture d'achat commerciale de prestations : <strong>{selectedInvoice.invoiceNumber}</strong></li>
                      <li>Date d'échéance non honorée : <strong className="text-rose-500">{selectedInvoice.dueDate}</strong> (Débiteur contractuel de plein droit)</li>
                      <li>Principal Hors-Taxe : <strong>{formatTND(selectedInvoice.amountHT)}</strong></li>
                      <li>Taxe sur la Valeur Ajoutée (TVA {selectedInvoice.vatRate}%) : <strong>{formatTND(selectedInvoice.vatAmount)}</strong></li>
                      <li>Retenue à la source déduite : <strong>{formatTND(selectedInvoice.withholdingAmount)}</strong></li>
                      <li><strong>Montant net exigible : <span className="text-sm font-black text-rose-500">{formatTND(selectedInvoice.amountNetToPay)}</span></strong> (Soit la somme de : <i>{amountToWordsFR(selectedInvoice.amountNetToPay)}</i>)</li>
                    </ul>

                    <p>
                      À défaut d'exécution dans le délai imparti de 15 jours francs, les requérants engageront à votre encontre, par toutes voies de droit légales, l'intégralité des procédures d'injonction de payer et de saisies d'exécution près les tribunaux compétents de la République Tunisienne.
                    </p>

                    <p className="text-slate-400 text-[10px] italic border-t border-dashed border-amber-200 pt-3">
                      Sous toutes réserves de droit, d'intérêts moratoires de retard de paiement prévus par le code de commerce (loi N° 59-129) et de frais d'huissier d'exécution.
                    </p>

                    {/* Corporate Premium Footer */}
                    <div className="border-t border-amber-200/40 pt-3 mt-6 text-center text-[8.5px] text-slate-400 font-sans space-y-1 tracking-wide">
                      <p className="font-bold">Elyssa ERP Suite • Document de Procédure Contentieuse</p>
                      <p>
                        {adminSettings?.companyName || "Inter-Affaires"} 
                        {adminSettings?.legalForm ? ` (${adminSettings.legalForm})` : ""} 
                        {adminSettings?.shareCapital ? ` au capital de ${adminSettings.shareCapital.toLocaleString('fr-FR')} TND` : ""} 
                        {adminSettings?.rneNumber ? ` - RNE ${adminSettings.rneNumber}` : ""} 
                        {adminSettings?.companyMF ? ` - MF ${adminSettings.companyMF}` : ""} 
                        {adminSettings?.companyAddress ? ` - ${adminSettings.companyAddress}` : ""} 
                        {adminSettings?.cityZipCode ? ` ${adminSettings.cityZipCode}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Actions for certified letter */}
                  <div className="flex flex-wrap gap-2 pt-2 justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const isIframe = window.self !== window.top;
                        if (isIframe) {
                          setPrintDocName(`Mise en demeure - Facture ${selectedInvoice?.invoiceNumber || ''}`);
                          setPrintDocTab('billing');
                          setPrintTarget('printable-judicial-notice');
                          setPrintTargetId(selectedInvoice?.id || '');
                          setIsPrintModalOpen(true);
                          return;
                        }

                        const printContent = document.getElementById('printable-judicial-notice');
                        if (printContent) {
                          const clone = printContent.cloneNode(true) as HTMLElement;
                          clone.id = 'temp-print-root';
                          clone.className = 'temp-print-root ' + (printContent.className || '');
                          document.body.appendChild(clone);
                          document.body.classList.add('print-mode-active');
                          
                          setTimeout(() => {
                            try {
                              window.print();
                            } catch (e) {
                              console.error('Print error:', e);
                            } finally {
                              document.body.classList.remove('print-mode-active');
                              const tempElement = document.getElementById('temp-print-root');
                              if (tempElement) {
                                document.body.removeChild(tempElement);
                              }
                            }
                          }, 150);
                        } else {
                          window.print();
                        }
                      }}
                      className="p-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer l'Acte de Sommation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const huissierName = (document.getElementById('huissier-name-input') as HTMLInputElement)?.value || "Cabinet d'Huissier";
                        const delayDays = (document.getElementById('huissier-delay-select') as HTMLSelectElement)?.value || "15";
                        
                        const newStep: RecouvrementStep = {
                          id: `step_legal_${Date.now()}`,
                          date: new Date().toISOString().split('T')[0],
                          type: 'Letter',
                          note: `Mise en demeure d'huissier-notaire (${huissierName}) sous un délai de ${delayDays} jours.`,
                          performedBy: 'Directeur Contentieux'
                        };

                        const updated = invoices.map(inv => {
                          if (inv.id === selectedInvoice.id) {
                            return {
                              ...inv,
                              recouvrementSteps: [...(inv.recouvrementSteps || []), newStep],
                              status: 'Debt_Collection' as InvoiceStatus
                            };
                          }
                          return inv;
                        });
                        onUpdateInvoices(updated);
                        alert("Procédure de mise en demeure enregistrée dans le journal de suivi !");
                        setActiveDetailTab('recovery');
                      }}
                      className="p-2 px-4 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      <span>Enregistrer dans le dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedInvoiceId === 'settings' ? (
          /* BILLING SETTINGS INTERFACE */
          <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 text-indigo-700 flex items-center space-x-2">
              <Scale className="w-5 h-5 text-indigo-500" />
              <span>Configuration Financière & Taxes Facturation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Taux de TVA */}
              <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <span className="text-[10.5px] font-black uppercase text-slate-500 block border-b pb-1.5">Grille des taux de TVA (%)</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Configurez les taux standard autorisés par la Loi de Finances tunisienne (standard: 19%, libéral: 13%, réduit: 7%).
                </p>
                <div className="flex space-x-2 pt-1">
                  <input 
                    type="number"
                    step="0.5"
                    id="new-tva-input"
                    placeholder="Ex: 19"
                    className="w-24 p-1.5 bg-white border border-slate-200 rounded text-xs font-bold font-mono text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-tva-input') as HTMLInputElement;
                      const val = Number(input?.value);
                      if (input && !isNaN(val) && val >= 0 && !vatRatesList.includes(val)) {
                        updateVatRates([...vatRatesList, val].sort((a, b) => b - a));
                        input.value = '';
                      }
                    }}
                    className="p-1.5 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {vatRatesList.map(rate => (
                    <div key={rate} className="flex justify-between items-center p-2 bg-white border rounded text-xs font-bold font-mono text-slate-700">
                      <span>{rate}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (vatRatesList.length > 1) {
                            updateVatRates(vatRatesList.filter(r => r !== rate));
                          } else {
                            alert("Il doit rester au moins un taux de TVA configuré.");
                          }
                        }}
                        className="text-slate-400 hover:text-red-655 font-sans p-1 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taux de Retenue à la source */}
              <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <span className="text-[10.5px] font-black uppercase text-slate-500 block border-b pb-1.5">Grille des retenues à la source (%)</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Configurez les pourcentages de retenues à la source selon la nature des prestations (standard: 1.5%, honoraires: 15%).
                </p>
                <div className="flex space-x-2 pt-1">
                  <input 
                    type="number"
                    step="0.1"
                    id="new-rs-input"
                    placeholder="Ex: 1.5"
                    className="w-24 p-1.5 bg-white border border-slate-200 rounded text-xs font-bold font-mono text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-rs-input') as HTMLInputElement;
                      const val = Number(input?.value);
                      if (input && !isNaN(val) && val >= 0 && !withholdingRatesList.includes(val)) {
                        updateWithholdingRates([...withholdingRatesList, val].sort((a, b) => b - a));
                        input.value = '';
                      }
                    }}
                    className="p-1.5 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {withholdingRatesList.map(rate => (
                    <div key={rate} className="flex justify-between items-center p-2 bg-white border rounded text-xs font-bold font-mono text-slate-700">
                      <span>{rate}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (withholdingRatesList.length > 1) {
                            updateWithholdingRates(withholdingRatesList.filter(r => r !== rate));
                          } else {
                            alert("Il doit rester au moins un taux de RS configuré.");
                          }
                        }}
                        className="text-slate-400 hover:text-red-655 font-sans p-1 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timbre Fiscal Setup */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 space-y-3.5">
              <span className="text-[11px] font-black uppercase text-slate-600 block border-b pb-1.5">Droit de Timbre Fiscal (Tunisie)</span>
              <div className="flex items-center space-x-4">
                <div className="w-32 space-y-1 font-mono">
                  <label className="text-[10px] text-slate-400 font-sans font-bold block">Montant Timbre (TND) :</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={stampDutyValue}
                    onChange={(e) => updateStampDuty(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <p className="text-[11.5px] text-slate-500 leading-relaxed font-semibold">
                  Le droit de timbre fiscal est obligatoirement collecté sur toute facture commerciale papier ou électronique émise sur le marché local tunisien. Le montant fixé est actuellement de <strong>1.000 DT</strong> par Loi de Finances.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-150 p-10 text-center text-slate-400 text-xs">
            Sélectionnez une facture à gauche pour suivre son historique de recouvrement, valider son certificat de retenue à la source ou enregistrer de nouvelles actions de relance, ou cliquez sur "Config" pour ajuster la fiscalité.
          </div>
        )}
      </div>
      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={printDocTab}
        documentName={printDocName}
        printTarget={printTarget}
        targetId={printTargetId}
      />
      <DocumentPrintModal
        isOpen={unifiedPrintModalOpen}
        onClose={() => setUnifiedPrintModalOpen(false)}
        data={unifiedPrintData}
      />
    </div>
  );
}
