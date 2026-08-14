import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, AlertCircle, Building2, Landmark, ShieldCheck } from 'lucide-react';
import IframePrintHelper from './IframePrintHelper';

interface SaaSInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    companyName: string;
    packId: string;
    interval: 'monthly' | 'quarterly' | 'yearly';
    price: number;
    requestDate: string;
    status: 'pending' | 'key_emitted' | 'approved';
    licenseKey?: string;
    contactEmail: string;
    paymentMethod?: 'wire' | 'card';
    modules?: string[];
  } | null;
}

export default function SaaSInvoiceModal({ isOpen, onClose, order }: SaaSInvoiceModalProps) {
  const [docType, setDocType] = useState<'bc' | 'facture'>('bc');
  const [isPrintHelperOpen, setIsPrintHelperOpen] = useState(false);

  if (!isOpen || !order) return null;

  const orderIdSuffix = order.id.replace('req_', '');
  const documentNo = docType === 'bc' ? `BC-2026-${orderIdSuffix}` : `FAC-2026-${orderIdSuffix}`;
  const documentName = docType === 'bc' ? `Bon de Commande ${documentNo}` : `Facture ${documentNo}`;

  // Financial calculations
  const priceHTPerMonth = order.price;
  const billingMonths = order.interval === 'yearly' ? 12 : order.interval === 'quarterly' ? 3 : 1;
  const totalHT = priceHTPerMonth * billingMonths;
  const tvaRate = 0.19; // 19% standard Tunisian VAT for services
  const tvaAmount = Math.round(totalHT * tvaRate * 100) / 100;
  const stampDuty = 1.000; // 1.000 TND standard stamp duty (timbre fiscal) in Tunisia
  const totalTTC = totalHT + tvaAmount + stampDuty;

  // Formatting helper
  const formatCurrency = (val: number) => {
    return val.toFixed(3) + ' TND';
  };

  const packLabels: { [key: string]: string } = {
    'full': 'Formule Elyssa Intégrale (Full ERP/CRM)',
    'logistics': 'Formule Logistique & Distribution',
    'independent': 'Formule Professionnels & Indépendants',
    'rh_only': 'Formule Gestion des Ressources Humaines (RH)',
    'custom': 'Formule À la Carte (Sur-mesure)',
    'trial': 'Période d\'Essai Gratuit'
  };

  const getPackName = () => {
    return packLabels[order.packId] || order.packId;
  };

  const getPaymentMethodLabel = () => {
    if (order.paymentMethod === 'card') return 'Carte Bancaire / E-Dinar (Instant)';
    return 'Virement Bancaire (BIAT Agence Belvédère)';
  };

  // Determine if invoice is paid
  const isPaid = order.status === 'approved' || order.paymentMethod === 'card';

  const handlePrintTrigger = () => {
    setIsPrintHelperOpen(true);
  };

  const printableId = `printable-saas-doc-${order.id}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row h-[90vh] max-h-[800px]">
        
        {/* Left pane: Navigation & Control Panel */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-2xl">
                <FileText className="w-6 h-6" />
              </span>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight font-display">
                Chambre des Documents
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Bon de Commande & Facturation
              </p>
            </div>

            {/* Document Selection Tabs */}
            <div className="space-y-2">
              <button
                onClick={() => setDocType('bc')}
                className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-xs font-bold border ${
                  docType === 'bc'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[11px] truncate">Bon de Commande</p>
                  <p className={`text-[9px] ${docType === 'bc' ? 'text-indigo-200' : 'text-slate-400'} font-semibold`}>Engagement & Devis d'achat</p>
                </div>
              </button>

              <button
                onClick={() => setDocType('facture')}
                className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-xs font-bold border ${
                  docType === 'facture'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[11px] truncate">Facture de Vente</p>
                  <p className={`text-[9px] ${docType === 'facture' ? 'text-indigo-200' : 'text-slate-400'} font-semibold`}>
                    {isPaid ? 'Acquittée & Payée' : 'Proforma / Attente'}
                  </p>
                </div>
              </button>
            </div>

            {/* Status Information Panel */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/50 space-y-2">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">État du document</span>
              <div className="flex items-center space-x-2 text-xs font-bold">
                {isPaid ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0"></span>
                    <span className="text-slate-800">Règlement Confirmé ({order.paymentMethod === 'card' ? 'CB' : 'Virement'})</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
                    <span className="text-slate-700">Attente de Confirmation</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                {isPaid 
                  ? "La facture est acquittée. Vos modules de production Elyssa ont été activés définitivement."
                  : "Le bon de commande a été émis. Veuillez procéder au virement bancaire ou l'activer depuis la console."
                }
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200">
            <button
              onClick={handlePrintTrigger}
              className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le document</span>
            </button>

            <button
              onClick={onClose}
              className="w-full p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border border-slate-250 cursor-pointer"
            >
              <span>Fermer la vue</span>
            </button>
          </div>
        </div>

        {/* Right pane: Living Document Preview (Paper design) */}
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto flex items-start justify-center h-full">
          <div 
            id={printableId}
            className="w-full max-w-[210mm] bg-white text-slate-800 shadow-xl border border-slate-300/60 p-6 md:p-10 rounded-2xl relative font-sans leading-relaxed text-xs shrink-0 self-start printable-saas-document"
            style={{ minHeight: '297mm' }}
          >
            {/* Stamp Overlay for PAID status */}
            {docType === 'facture' && isPaid && (
              <div className="absolute right-8 top-1/4 -rotate-12 border-4 border-emerald-600 text-emerald-600 rounded-xl p-3 px-5 font-black text-xs uppercase tracking-widest bg-white/90 z-20 pointer-events-none select-none">
                <p className="text-center font-extrabold text-[13px]">PAYÉ</p>
                <p className="text-[8px] text-center font-bold font-mono tracking-normal mt-0.5">Le {order.requestDate}</p>
                <p className="text-[8px] text-center font-semibold">PAR {order.paymentMethod === 'card' ? 'CARTE' : 'VIREMENT'}</p>
              </div>
            )}

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-700 font-black">
                  <span className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs">EY</span>
                  <span className="text-sm font-extrabold tracking-tight">ELYSSA SOLUTIONS</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 leading-normal">
                  <p><strong>ELYSSA SOLUTIONS ENTREPRISES S.A.</strong></p>
                  <p>Éditeur de progiciels ERP & CRM Tunisien</p>
                  <p>Immeuble Elyssa, Boulevard du Belvédère, Tunis 1002</p>
                  <p><strong>MF :</strong> 1458796/A/M/000 • <strong>RC :</strong> B0124582025</p>
                  <p>Téléphone : +216 71 845 900 • Email : billing@elyssa.pro</p>
                </div>
              </div>

              <div className="text-right space-y-1.5 self-stretch sm:self-auto flex flex-col justify-between items-end">
                <div className="space-y-0.5">
                  <h1 className="font-extrabold text-[15px] uppercase tracking-wide text-slate-900">
                    {docType === 'bc' ? 'Bon de Commande' : 'Facture de Vente'}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-500 font-mono">N° {documentNo}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold leading-normal">
                  <p>Date d'émission : <strong>{order.requestDate}</strong></p>
                  <p>Période fiscale : <strong>Exercice 2026</strong></p>
                  <p>Échéance : <strong>À réception</strong></p>
                </div>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200">
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Destinataire (Client)</span>
                </div>
                <div className="text-[10.5px] font-semibold text-slate-800 space-y-0.5">
                  <p className="font-extrabold text-xs text-slate-900 uppercase">{order.companyName}</p>
                  <p>Adresse de facturation : Tunis, Tunisie</p>
                  <p>Contact : {order.contactEmail}</p>
                  <p>Identifiant Client : CLT-{order.companyName.substring(0, 3).toUpperCase()}-{orderIdSuffix}</p>
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Landmark className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Règlement & Mode de Paiement</span>
                  </div>
                  <p className="text-[10.5px] font-bold text-slate-800 mt-1">{getPaymentMethodLabel()}</p>
                </div>
                {order.licenseKey && (
                  <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-900 p-2 rounded-lg border border-indigo-100 font-mono leading-tight">
                    <p className="font-bold">Clé sécurisée attribuée :</p>
                    <p className="font-black tracking-wider text-indigo-700 select-all mt-0.5">{order.licenseKey}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Items Table */}
            <div className="py-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50">
                    <th className="py-2.5 px-3">Désignation de la prestation</th>
                    <th className="py-2.5 px-3 text-center">Période</th>
                    <th className="py-2.5 px-3 text-right">PU Mensuel HT</th>
                    <th className="py-2.5 px-3 text-right">Quantité</th>
                    <th className="py-2.5 px-3 text-right">Total HT (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10.5px] font-semibold text-slate-700">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-extrabold text-slate-900 uppercase">{getPackName()}</p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 font-sans">
                        Abonnement annuel ou mensuel au progiciel Elyssa ERP/CRM avec hébergement Cloud tunisien sécurisé et assistance locale.
                      </p>
                      {order.packId === 'custom' && order.modules && order.modules.length > 0 && (
                        <p className="text-[9px] text-indigo-600 font-bold mt-1">
                          Modules inclus : {order.modules.join(', ').toUpperCase()}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono capitalize">
                      {order.interval === 'yearly' ? '12 mois' : order.interval === 'quarterly' ? '3 mois' : '1 mois'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(priceHTPerMonth)}</td>
                    <td className="py-3 px-3 text-right font-mono">1</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900">{formatCurrency(totalHT)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-6 border-t border-slate-200">
              <div className="text-[10px] text-slate-500 max-w-sm space-y-1">
                <p className="font-bold text-slate-700">Conditions Générales de Vente (CGV) :</p>
                <p className="leading-relaxed">
                  Cette commande est régie par les CGV d'Elyssa Solutions S.A. Pour les règlements par virement, l'activation complète des modules nécessite la saisie de la clé de licence Tunisienne sécurisée ci-dessus dans l'espace client.
                </p>
                <div className="flex items-center space-x-1.5 text-indigo-700 font-bold mt-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Document officiel Elyssa CRM certifié conforme.</span>
                </div>
              </div>

              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>TOTAL HORS TAXES (HT) :</span>
                  <span className="font-mono">{formatCurrency(totalHT)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-semibold border-b border-slate-100 pb-2">
                  <span>TVA (19.0%) :</span>
                  <span className="font-mono">{formatCurrency(tvaAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[10px] font-semibold border-b border-slate-100 pb-2">
                  <span>Droit de Timbre Fiscal :</span>
                  <span className="font-mono">{formatCurrency(stampDuty)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 text-xs font-black bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="uppercase">Net à Payer (TTC) :</span>
                  <span className="font-mono text-indigo-700 text-sm">{formatCurrency(totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-10 pt-12 text-[10px] text-slate-500 border-t border-dashed border-slate-200 mt-12">
              <div className="space-y-12">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Pour le Client : {order.companyName}</p>
                <div className="border-t border-slate-200 pt-1.5 italic font-semibold">
                  Nom, Date, Signature & Cachet précédés de la mention "Lu et approuvé"
                </div>
              </div>

              <div className="space-y-12 text-right">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Pour l'Éditeur : ELYSSA SOLUTIONS</p>
                <div className="border-t border-slate-200 pt-1.5 flex flex-col items-end">
                  <div className="text-[10px] font-black text-indigo-700 font-mono tracking-wider border-2 border-indigo-600/30 p-1.5 px-3 rounded-lg rotate-3 uppercase">
                    ★ ELYSSA SOLUTIONS S.A. ★
                  </div>
                  <span className="italic mt-1.5 font-semibold">Direction Administrative & Financière</span>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-8 text-center text-[9px] text-slate-400 border-t border-dashed mt-8 space-y-0.5">
              <p><strong>ELYSSA SOLUTIONS</strong> • S.A. au capital de 1 000 000 TND • Immeuble Elyssa, Tunis 1002 • MF: 1458796/A/M/000</p>
              <p>Généré automatiquement par le module de facturation Elyssa ERP le {order.requestDate}. Document faisant foi.</p>
            </div>

          </div>
        </div>

      </div>

      <IframePrintHelper
        isOpen={isPrintHelperOpen}
        onClose={() => setIsPrintHelperOpen(false)}
        activeTab="saas_config"
        documentName={documentName}
        printTarget={printableId}
        targetId={order.id}
      />
    </div>
  );
}
