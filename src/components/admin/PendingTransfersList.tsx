import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  Search, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight
} from 'lucide-react';
import { collectionGroup, getDocs, doc, setDoc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../utils/firebase';

export interface PendingInvoiceOrder {
  id: string; // cmdRef
  tenantId: string;
  tenantName?: string;
  moduleId: string;
  moduleTitle: string;
  amount: number;
  currency: string;
  status: 'PENDING_TRANSFER' | 'PAID' | 'EXPIRED' | string;
  createdAt: string;
  expiresAt?: string;
  customerContact?: string;
}

interface PendingTransfersListProps {
  adminEmail?: string;
  onOrderValidated?: (cmdRef: string) => void;
  className?: string;
}

/**
 * Composant Front-End Back-Office Super-Admin : Tableau de Bord des Virements Bancaires en Attente
 * Permet à l'équipe financière d'Elyssa ERP de valider la réception des fonds et débloquer l'accès permanent au MOD-11.
 */
export const PendingTransfersList: React.FC<PendingTransfersListProps> = ({
  adminEmail = 'finance@elyssa-erp.tn',
  onOrderValidated,
  className = ''
}) => {
  const [orders, setOrders] = useState<PendingInvoiceOrder[]>([
    // Données de démonstration initiales (si Firestore vide)
    {
      id: 'CMD-2026-0891',
      tenantId: 'GEP',
      tenantName: 'Grands Elevages du Sahel',
      moduleId: 'MOD-11',
      moduleTitle: 'Flotte Mobile & Suivi Terrain',
      amount: 39,
      currency: 'TND',
      status: 'PENDING_TRANSFER',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // Il y a 12h
      expiresAt: new Date(Date.now() + 3600000 * 36).toISOString(),  // Reste 36h
      customerContact: 'finance@gep-sahel.tn'
    },
    {
      id: 'CMD-2026-0885',
      tenantId: 'SART',
      tenantName: 'Société Artisanale de Tunis',
      moduleId: 'MOD-11',
      moduleTitle: 'Flotte Mobile & Suivi Terrain',
      amount: 39,
      currency: 'TND',
      status: 'PENDING_TRANSFER',
      createdAt: new Date(Date.now() - 3600000 * 28).toISOString(), // Il y a 28h
      expiresAt: new Date(Date.now() + 3600000 * 20).toISOString(),  // Reste 20h
      customerContact: 'compta@sart.com.tn'
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [processingCmdId, setProcessingCmdId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Écoute en temps réel de Firestore pour récupérer les commandes d'invoices en attente
  useEffect(() => {
    setLoading(true);
    
    // Requête sur la collection d'invoices du tenant principal
    const invoicesRef = collectionGroup(db, 'invoices');
    const q = query(invoicesRef, where('status', '==', 'PENDING_TRANSFER'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: PendingInvoiceOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOrders.push({
            id: docSnap.id,
            tenantId: data.tenantId || data.issuedToTenant || 'GEP',
            tenantName: data.tenantName || data.issuedToTenant || 'Entreprise Client',
            moduleId: data.moduleId || 'MOD-11',
            moduleTitle: data.moduleTitle || 'Flotte Mobile & Suivi Terrain',
            amount: data.amount || 39,
            currency: data.currency || 'TND',
            status: data.status || 'PENDING_TRANSFER',
            createdAt: data.createdAt || data.paidAt || new Date().toISOString(),
            expiresAt: data.expiresAt,
            customerContact: data.customerContact
          });
        });

        if (fetchedOrders.length > 0) {
          setOrders(fetchedOrders);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("[PendingTransfersList] Notice Firestore collectionGroup fallback vers données démo:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Action : Validation du Virement Bancaire via Cloud Function ou Firestore Direct
   */
  const handleValidateTransfer = async (order: PendingInvoiceOrder) => {
    setProcessingCmdId(order.id);
    setFeedbackMessage(null);

    try {
      // 1. Essai d'appel de la Cloud Function HTTPS Callable
      try {
        const functions = getFunctions();
        const validateBankTransfer = httpsCallable<
          { tenantId: string; cmdRef: string; moduleId: string },
          { success: boolean; message: string }
        >(functions, 'validateBankTransfer');

        await validateBankTransfer({
          tenantId: order.tenantId,
          cmdRef: order.id,
          moduleId: order.moduleId
        });
      } catch (cfErr) {
        console.warn("[PendingTransfersList] Fallback direct Firestore pour validation virement:", cfErr);

        // 2. Fallback de mise à jour directe dans Firestore client SDK
        const companyRef = doc(db, 'companies', order.tenantId);
        await setDoc(
          companyRef,
          {
            activeModules: arrayUnion(order.moduleId, 'mod-11-mobile-fleet'),
            subscriptionStatus: 'ACTIVE',
            lastUpdated: new Date().toISOString()
          },
          { merge: true }
        );

        const invoiceRef = doc(db, 'companies', order.tenantId, 'invoices', order.id);
        await setDoc(
          invoiceRef,
          {
            status: 'PAID',
            validatedAt: new Date().toISOString(),
            validatedBy: adminEmail,
            paymentMethod: 'VIREMENT_BANCAIRE_VALIDE'
          },
          { merge: true }
        );
      }

      // Mise à jour de l'état local UI
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setFeedbackMessage({
        type: 'success',
        text: `Virement validé avec succès pour la commande ${order.id} (${order.tenantId}). Module ${order.moduleId} activé de façon permanente !`
      });

      if (onOrderValidated) {
        onOrderValidated(order.id);
      }
    } catch (err: any) {
      console.error("[PendingTransfersList] Erreur lors de la validation du virement:", err);
      setFeedbackMessage({
        type: 'error',
        text: `Erreur de validation : ${err.message || 'Impossible de mettre à jour le statut.'}`
      });
    } finally {
      setProcessingCmdId(null);
    }
  };

  // Filtrage des commandes selon la recherche
  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tenantName && o.tenantName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans text-slate-100 ${className}`}>
      
      {/* En-tête du Tableau de Bord Finance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Validation des Virements Bancaires
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Back-Office Finance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des bons de commande sous engagement 48h. Validez les encaissements pour débloquer les licences permanentes.
          </p>
        </div>

        {/* Moteur de recherche rapide */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher Cmd / Tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Alerte / Message de Confirmation */}
      {feedbackMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Tableau des Commandes en Attente */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Réf. Commande</th>
              <th className="px-4 py-3">Entreprise Tenant</th>
              <th className="px-4 py-3">Module SaaS</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Délai 48h / Création</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-right">Action de Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Chargement des bons de commande...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  <div className="space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-400">Aucun virement en attente de validation.</p>
                    <p className="text-[11px] text-slate-500">Toutes les souscriptions sont à jour.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isProcessing = processingCmdId === order.id;
                const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-TN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A';

                return (
                  <tr key={order.id} className="hover:bg-slate-900/80 transition-colors group">
                    {/* Ref Commande */}
                    <td className="px-4 py-3.5 font-mono text-indigo-300 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{order.id}</span>
                      </div>
                    </td>

                    {/* Entreprise Tenant */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white tracking-tight">
                            {order.tenantName || order.tenantId}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {order.tenantId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {order.moduleId}
                        </span>
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {order.moduleTitle}
                        </span>
                      </div>
                    </td>

                    {/* Montant */}
                    <td className="px-4 py-3.5 text-right font-bold text-white text-sm">
                      {order.amount} {order.currency}
                    </td>

                    {/* Date / Délai */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{createdDate}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Attente Virement</span>
                      </span>
                    </td>

                    {/* Bouton de Validation */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleValidateTransfer(order)}
                        disabled={isProcessing}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 ml-auto cursor-pointer ${
                          isProcessing ? 'opacity-60 cursor-wait' : 'hover:scale-[1.02]'
                        }`}
                        title="Valider l'encaissement et débloquer l'accès permanent"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Validation...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marquer comme Reçu</span>
                          </>
                        )}
                      </button>
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
};

export default PendingTransfersList;
