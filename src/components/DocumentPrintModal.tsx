import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, MapPin, Truck, FileText, DollarSign, ExternalLink } from 'lucide-react';
import { ElyssaLogo } from './ElyssaLogo';

export type PrintDocType = 'FACTURE' | 'BON_LIVRAISON' | 'DECHARGE_CAISSE';

export interface PrintModalItem {
  ref?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate?: number;
  totalHT?: number;
  unit?: string;
}

export interface PrintModalData {
  docType: PrintDocType;
  title?: string;
  docNumber?: string;
  date?: string;
  companyInfo?: {
    name?: string;
    mf?: string;
    address?: string;
    phone?: string;
    email?: string;
    rib?: string;
  };
  clientInfo?: {
    name?: string;
    mf?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  
  // Facture
  items?: PrintModalItem[];
  taxRate?: number;
  timbreFiscal?: number; // 1.000 TND default
  includeRS?: boolean;   // 1.5% RS
  rsRate?: number;
  notes?: string;

  // Bon de Livraison / POD
  deliveryAddress?: string;
  driverName?: string;
  vehicleRef?: string;
  gpsCoords?: string;
  signatureUrl?: string;
  recipientName?: string;
  deliveryStatus?: string;
  deliveredAt?: string;

  // Décharge de Caisse
  tourId?: string;
  tourDate?: string;
  cashAmount?: number;
  checkAmount?: number;
  checkCount?: number;
  rsCertificatesAmount?: number;
  rsCertificatesCount?: number;
  totalCollected?: number;
  expectedAmount?: number;
  cashierName?: string;
}

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintModalData | null;
}

// Convert numbers to French currency words (Dinars & Millimes)
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

export default function DocumentPrintModal({ isOpen, onClose, data }: DocumentPrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handleTriggerPrint = () => {
    // If inside iframe or standard browser window, window.print triggers native print dialog
    window.print();
  };

  const company = data.companyInfo || {
    name: "Elyssa ERP Suite",
    mf: "1849203/A/M/000",
    address: "Zone Industrielle Radès, 2040 Tunis, Tunisie",
    phone: "+216 71 800 900",
    email: "contact@elyssaerp.tn"
  };

  // Calculations for Facture
  const items = data.items || [];
  const totalHT = items.reduce((acc, item) => acc + (item.totalHT ?? (item.quantity * item.unitPrice)), 0);
  
  // Calculate TVA (by item tvaRate if available, else standard 19%)
  const totalTVA = items.reduce((acc, item) => {
    const itemHT = item.totalHT ?? (item.quantity * item.unitPrice);
    const rate = item.tvaRate ?? (data.taxRate ?? 19);
    return acc + (itemHT * (rate / 100));
  }, 0);

  const timbreFiscal = data.timbreFiscal ?? 1.000; // 1.000 TND
  const totalTTC = totalHT + totalTVA + timbreFiscal;

  const rsRate = data.rsRate ?? 1.5; // Retenue à la source 1.5%
  const rsAmount = data.includeRS !== false ? (totalHT * (rsRate / 100)) : 0;
  const netToPay = totalTTC - rsAmount;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Modal Card */}
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Aperçu Avant Impression A4 — Elyssa ERP
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {data.docType === 'FACTURE' && `Facture N° ${data.docNumber || 'FA-2026-000'}`}
                {data.docType === 'BON_LIVRAISON' && `Bon de Livraison N° ${data.docNumber || 'BL-2026-000'}`}
                {data.docType === 'DECHARGE_CAISSE' && `Décharge de Caisse — Tournée ${data.tourId || 'T-00'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Document (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-8 sm:p-10 text-slate-900 bg-white print:p-0 print:overflow-visible print:bg-white text-xs leading-normal" ref={printAreaRef}>
          
          {/* HEADER SECTION */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div className="space-y-1">
              <ElyssaLogo className="h-9 w-auto text-indigo-700" />
              <p className="font-extrabold text-slate-900 text-sm">{company.name}</p>
              <p className="text-slate-600 text-[11px]">Matricule Fiscal: <strong className="text-slate-900">{company.mf}</strong></p>
              <p className="text-slate-600 text-[11px]">{company.address}</p>
              <p className="text-slate-600 text-[11px]">Tél: {company.phone} | Email: {company.email}</p>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md print:bg-slate-900 print:text-white">
                {data.docType === 'FACTURE' && 'FACTURE OFFICIELLE A4'}
                {data.docType === 'BON_LIVRAISON' && 'BON DE LIVRAISON & POD'}
                {data.docType === 'DECHARGE_CAISSE' && 'DÉCHARGE DE CAISSE'}
              </div>
              <p className="text-slate-900 font-extrabold text-base mt-2">
                N° {data.docNumber || 'DOC-2026-0001'}
              </p>
              <p className="text-slate-600 text-[11px]">
                Date: <strong>{data.date || new Date().toLocaleDateString('fr-FR')}</strong>
              </p>
            </div>
          </div>

          {/* DOCUMENT TYPE SPECIFIC CONTENT */}

          {/* 1. FACTURE */}
          {data.docType === 'FACTURE' && (
            <div className="space-y-6">
              
              {/* Client Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:bg-slate-50 flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Facturé à (Client) :</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{data.clientInfo?.name || 'Client Passager'}</p>
                  {data.clientInfo?.mf && (
                    <p className="text-[11px] text-slate-700 mt-0.5">Matricule Fiscal: <strong>{data.clientInfo.mf}</strong></p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-0.5">{data.clientInfo?.address || 'Adresse Non Renseignée'}</p>
                  {data.clientInfo?.phone && (
                    <p className="text-[11px] text-slate-600">Tél: {data.clientInfo.phone}</p>
                  )}
                </div>

                <div className="text-right text-[11px] space-y-1">
                  <p className="text-slate-500 font-bold">Conditions de Règlement :</p>
                  <p className="font-extrabold text-slate-800">Comptant à livraison / Virement</p>
                  <p className="text-slate-500 font-bold mt-2">Devise :</p>
                  <p className="font-black text-indigo-700">Dinar Tunisien (TND)</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase print:bg-slate-100">
                      <th className="p-3">Désignation / Article</th>
                      <th className="p-3 text-center">Quantité</th>
                      <th className="p-3 text-right">Prix Unitaire HT</th>
                      <th className="p-3 text-center">TVA</th>
                      <th className="p-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => {
                      const itemHT = item.totalHT ?? (item.quantity * item.unitPrice);
                      const tva = item.tvaRate ?? (data.taxRate ?? 19);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{item.description}</p>
                            {item.ref && <p className="text-[10px] text-slate-500 font-mono">Réf: {item.ref}</p>}
                          </td>
                          <td className="p-3 text-center font-extrabold text-slate-800">
                            {item.quantity} {item.unit || ''}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-800">
                            {item.unitPrice.toFixed(3)} TND
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600">
                            {tva}%
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                            {itemHT.toFixed(3)} TND
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals & Words */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                <div className="space-y-3 bg-slate-50/80 border border-slate-200 p-4 rounded-xl">
                  <p className="text-[11px] font-black uppercase text-slate-700">Arrêté de la présente facture :</p>
                  <p className="text-xs font-extrabold text-slate-900 italic leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    « Arrêtée la présente facture à la somme de : <br/>
                    <strong className="text-indigo-800 font-black">{amountToWordsFR(netToPay)}</strong> »
                  </p>
                  {data.notes && (
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p className="font-bold text-slate-700">Notes / Remarques :</p>
                      <p>{data.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 print:bg-slate-50">
                  <div className="flex justify-between items-center text-slate-700 text-xs">
                    <span>Total HT :</span>
                    <span className="font-mono font-bold text-slate-900">{totalHT.toFixed(3)} TND</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 text-xs">
                    <span>TVA Globale (19%) :</span>
                    <span className="font-mono font-bold text-slate-900">{totalTVA.toFixed(3)} TND</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 text-xs">
                    <span>Timbre Fiscal :</span>
                    <span className="font-mono font-bold text-slate-900">{timbreFiscal.toFixed(3)} TND</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center font-extrabold text-slate-900 text-sm">
                    <span>Total Général TTC :</span>
                    <span className="font-mono text-indigo-700">{totalTTC.toFixed(3)} TND</span>
                  </div>

                  {data.includeRS !== false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 space-y-1">
                      <div className="flex justify-between items-center text-amber-900 text-xs font-bold">
                        <span>Retenue à la Source (RS {rsRate}%) :</span>
                        <span className="font-mono text-amber-800">-{rsAmount.toFixed(3)} TND</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-900 text-xs font-black border-t border-amber-200/60 pt-1">
                        <span>NET À PAYER APRÈS RS :</span>
                        <span className="font-mono text-emerald-700 text-sm">{netToPay.toFixed(3)} TND</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center">
                <div className="border border-dashed border-slate-300 rounded-xl p-4 min-h-[100px] flex flex-col justify-between">
                  <p className="font-extrabold text-slate-700 text-[11px] uppercase">Cachet & Signature Société</p>
                  <p className="text-[10px] text-slate-400">{company.name}</p>
                </div>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 min-h-[100px] flex flex-col justify-between">
                  <p className="font-extrabold text-slate-700 text-[11px] uppercase">Bon pour Accord Client</p>
                  <p className="text-[10px] text-slate-400">Date, Nom & Empreinte</p>
                </div>
              </div>

            </div>
          )}

          {/* 2. BON DE LIVRAISON & POD */}
          {data.docType === 'BON_LIVRAISON' && (
            <div className="space-y-6">
              
              {/* Delivery info bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 print:bg-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Destinataire & Adresse :</p>
                  <p className="font-black text-slate-900 text-sm">{data.clientInfo?.name || 'Client Livré'}</p>
                  <p className="text-[11px] text-slate-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{data.deliveryAddress || data.clientInfo?.address || 'Site Client Radès'}</span>
                  </p>
                  {data.clientInfo?.phone && (
                    <p className="text-[11px] text-slate-600">Tél Contact: {data.clientInfo.phone}</p>
                  )}
                </div>

                <div className="space-y-1 text-right md:text-right">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Info Transport & POD :</p>
                  <p className="text-xs text-slate-800 font-extrabold flex items-center justify-end gap-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Livreur: {data.driverName || 'Hamza Ben Salem'}</span>
                  </p>
                  <p className="text-[11px] text-slate-600">Véhicule: <strong>{data.vehicleRef || 'Isuzu D-Max TN-210'}</strong></p>
                  <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                    📍 {data.gpsCoords || '36.8065° N, 10.1815° E (Radès Port)'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase print:bg-slate-100">
                      <th className="p-3">Référence / Produit</th>
                      <th className="p-3 text-center">Quantité Commandée</th>
                      <th className="p-3 text-center">Quantité Livrée</th>
                      <th className="p-3 text-left">Réserves / Conformité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">
                          {item.description}
                          {item.ref && <span className="block text-[10px] text-slate-500 font-mono">SKU: {item.ref}</span>}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {item.quantity} {item.unit || 'u.'}
                        </td>
                        <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                          {item.quantity} {item.unit || 'u.'} ✓
                        </td>
                        <td className="p-3 text-xs text-slate-500 italic">
                          RAS — Colis Scellé Conforme
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* POD Emargement Box */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center space-x-2 text-emerald-900 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PREUVE DE LIVRAISON NUMÉRIQUE (POD) VALIDÉE</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Statut: {data.deliveryStatus || 'LIVRÉ & ÉMARGÉ'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-600">Réceptionné par : <strong>{data.recipientName || data.clientInfo?.name || 'Chef de Chantier'}</strong></p>
                    <p className="text-slate-600">Horodatage GPS : <strong>{data.deliveredAt || new Date().toLocaleString('fr-FR')}</strong></p>
                  </div>
                  <div className="border border-dashed border-emerald-300 bg-white rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Émargement Client / Signature Digitalisée</p>
                    <div className="h-12 flex items-center justify-center text-indigo-900 font-serif italic text-sm font-bold border-b border-slate-200">
                      {data.signatureUrl ? (
                        <img src={data.signatureUrl} alt="Signature POD" className="h-10 object-contain mx-auto" />
                      ) : (
                        `[Signature Validée — ${data.recipientName || 'Client'}]`
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <p className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-4">
                Toute réclamation concernant la conformité des marchandises doit être formulée sous 48h à réception.
              </p>

            </div>
          )}

          {/* 3. DÉCHARGE DE CAISSE */}
          {data.docType === 'DECHARGE_CAISSE' && (
            <div className="space-y-6">
              
              {/* Tour metadata */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center print:bg-slate-50">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Code Tournée</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{data.tourId || 'TOUR-2026-001'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Livreur / Chauffeur</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{data.driverName || 'Hamza Ben Salem'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Date Clôture</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{data.tourDate || new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Cash Clearance Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase print:bg-slate-100">
                      <th className="p-3">Mode de Règlement / Pièces</th>
                      <th className="p-3 text-center">Nombre / Détails</th>
                      <th className="p-3 text-right">Montant Encaissé (TND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    <tr>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Espèces (Cash Liquide TND)</span>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">Billetage & Pièces contrôlés</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                        {(data.cashAmount || 0).toFixed(3)} TND
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>Chèques Bancaires</span>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        {data.checkCount || 0} Chèque(s) Vérifié(s)
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sky-700 text-sm">
                        {(data.checkAmount || 0).toFixed(3)} TND
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Certificats de Retenue à la Source (RS 1.5%)</span>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        {data.rsCertificatesCount || 0} Attestation(s) RS
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-700 text-sm">
                        {(data.rsCertificatesAmount || 0).toFixed(3)} TND
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-extrabold print:bg-slate-900 print:text-white">
                      <td className="p-3 text-sm">TOTAL GÉNÉRAL VERSEMENT DE CAISSE</td>
                      <td className="p-3 text-center text-slate-300">Conforme à la Tournée</td>
                      <td className="p-3 text-right font-mono text-base text-emerald-400">
                        {((data.totalCollected ?? ((data.cashAmount || 0) + (data.checkAmount || 0) + (data.rsCertificatesAmount || 0)))).toFixed(3)} TND
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Discrepancy / Validation status */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-emerald-900 font-bold text-xs">
                <span>Écart de Caisse : <strong>0.000 TND (Caisse Parfaitement Équilibrée)</strong></span>
                <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                  ✓ VERSEMENT VALIDÉ EN CAISSE CENTRAL
                </span>
              </div>

              {/* Signatures croisées */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center">
                <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                  <p className="font-extrabold text-slate-800 text-[11px] uppercase">
                    Signature & Empreinte Livreur
                  </p>
                  <p className="text-xs font-bold text-slate-700">{data.driverName || 'Hamza Ben Salem'}</p>
                </div>
                <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                  <p className="font-extrabold text-slate-800 text-[11px] uppercase">
                    Cachet & Signature Caissier / Chef d'Agence
                  </p>
                  <p className="text-xs font-bold text-slate-700">{data.cashierName || 'Caissier Central — Radès'}</p>
                </div>
              </div>

            </div>
          )}

          {/* FOOTER GENERAL */}
          <div className="mt-8 border-t border-slate-200 pt-4 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Généré automatiquement par <strong>Elyssa ERP Suite</strong></span>
            <span>Document Certifié & Horodaté</span>
          </div>

        </div>

      </div>
    </div>
  );
}
