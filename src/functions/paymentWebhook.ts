/**
 * Webhook de Validation de Paiement HTTP (Firebase Cloud Function Node.js)
 * Reçoit la notification HTTP POST de la passerelle de paiement (GPG, Flouci, Konnect, Stripe, etc.)
 * Valide le paiement, active le module MOD-11 dans Firestore via Firebase Admin SDK et enregistre la facture.
 * 
 * Instructions de Déploiement Cloud Functions :
 * npm install firebase-functions firebase-admin
 * firebase deploy --only functions:paymentWebhook
 */

export interface PaymentWebhookRequestPayload {
  status: 'PAID' | 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  transaction_id?: string;
  payment_ref?: string;
  amount?: number;
  payment_method?: string;
  metadata?: {
    tenantId?: string;
    moduleId?: string;
    amount?: number;
  };
  tenantId?: string;
  moduleId?: string;
}

export interface PaymentWebhookResponse {
  success?: boolean;
  received?: boolean;
  message?: string;
  transactionRef?: string;
  error?: string;
  status?: string;
}

/**
 * Logique Métier du Webhook Backend (Exécutée sur serveur Node.js / Cloud Functions)
 */
export async function processPaymentWebhookLogic(
  payload: PaymentWebhookRequestPayload,
  adminDbInstance?: any
): Promise<{ statusCode: number; body: PaymentWebhookResponse }> {
  console.log("📩 Traitement Webhook de paiement pour MOD-11:", payload);

  const status = payload?.status;
  const metadata = payload?.metadata || {};
  
  const tenantId = metadata.tenantId || payload.tenantId;
  const moduleId = metadata.moduleId || payload.moduleId || "MOD-11";
  const amountTnd = payload.amount || metadata.amount || 39;
  const transactionRef = payload.transaction_id || payload.payment_ref || `TXN-${Date.now()}`;

  // Vérification du statut de paiement
  const isPaid = status === "PAID" || status === "SUCCESS" || status === "payment_intent.succeeded";

  if (!isPaid) {
    console.warn(`⚠️ Paiement non complété pour tenant ${tenantId}. Statut: ${status}`);
    return {
      statusCode: 200,
      body: { received: true, status: "IGNORED_NOT_PAID" }
    };
  }

  if (!tenantId) {
    console.error("❌ Identifiant tenant (tenantId) manquant dans le payload webhook.");
    return {
      statusCode: 400,
      body: { error: "Identifiant tenant (tenantId) requis dans les métadonnées." }
    };
  }

  console.log(`✅ Activation du module ${moduleId} pour l'entreprise/tenant: ${tenantId}`);

  // Si l'instance Firebase Admin DB est passée ou disponible sur le serveur
  if (adminDbInstance) {
    try {
      const tenantRef = adminDbInstance.collection("companies").doc(tenantId);

      // a) Mettre à jour le document du tenant en ajoutant `moduleId` au tableau `activeModules`
      await tenantRef.set(
        {
          activeModules: ['MOD-11', 'mod-11-mobile-fleet', moduleId],
          lastUpdated: new Date().toISOString(),
          subscriptionStatus: "ACTIVE",
          mobileFleetActivatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // b) Créer un document de trace/facture dans la sous-collection `companies/{tenantId}/invoices`
      const invoiceRef = tenantRef.collection("invoices").doc(transactionRef);
      await invoiceRef.set({
        invoiceId: `FAC-${Date.now()}`,
        transactionRef,
        moduleId,
        moduleTitle: "Flotte Mobile & Suivi Terrain (MOD-11)",
        amount: amountTnd,
        currency: "TND",
        status: "PAID",
        paymentMethod: payload.payment_method || "CARTE_BANCAIRE",
        paidAt: new Date().toISOString(),
        issuedToTenant: tenantId,
        description: "Abonnement mensuel SaaS - Flotte Mobile & Suivi Terrain"
      });

      console.log(`🎉 Facture ${transactionRef} créée avec succès pour ${tenantId}`);
    } catch (dbErr) {
      console.error("Erreur mise à jour Firestore Admin:", dbErr);
      return {
        statusCode: 500,
        body: { error: "Échec de l'écriture de la licence en base de données" }
      };
    }
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      message: `Module ${moduleId} activé avec succès pour le tenant ${tenantId}`,
      transactionRef
    }
  };
}

/**
 * Code Source pour le Fichier index.js / index.ts de Firebase Cloud Functions Backend:
 * 
 * const { onRequest } = require("firebase-functions/v2/https");
 * const admin = require("firebase-admin");
 * admin.initializeApp();
 * 
 * exports.paymentWebhook = onRequest({ cors: true, region: "europe-west1" }, async (req, res) => {
 *   if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
 *   const result = await processPaymentWebhookLogic(req.body, admin.firestore());
 *   return res.status(result.statusCode).json(result.body);
 * });
 */
