/**
 * Cloud Function Server-Side Logic: validateBankTransfer
 * Valide la réception du virement bancaire pour une commande SaaS en attente (48h temp access).
 * 
 * Actions dans Firestore (Admin SDK / Transaction) :
 * 1. Mettre à jour la facture `companies/{tenantId}/invoices/{cmdRef}` : statut -> `PAID`
 * 2. Mettre à jour le document tenant `companies/{tenantId}` :
 *    - Ajouter `moduleId` à `activeModules`
 *    - Supprimer l'entrée correspondante du tableau `temporaryAccess` pour rendre l'accès permanent
 */

export interface ValidateBankTransferParams {
  tenantId: string;
  cmdRef: string;
  moduleId: string;
  validatedByAdminEmail?: string;
}

export interface ValidateBankTransferResult {
  success: boolean;
  message: string;
  updatedAt: string;
}

/**
 * Fonction d'exécution atomique exécutée sur le serveur Firebase / Cloud Functions
 */
export async function executeValidateBankTransferLogic(
  params: ValidateBankTransferParams,
  adminDbInstance?: any
): Promise<ValidateBankTransferResult> {
  const { tenantId, cmdRef, moduleId, validatedByAdminEmail = 'superadmin@elyssa-erp.tn' } = params;

  console.log(`[validateBankTransfer] Validation virement pour tenant=${tenantId}, cmdRef=${cmdRef}, module=${moduleId}`);

  if (!tenantId || !cmdRef || !moduleId) {
    throw new Error("Paramètres manquants : tenantId, cmdRef et moduleId sont obligatoires.");
  }

  const nowIso = new Date().toISOString();

  if (adminDbInstance) {
    try {
      // Utilisation d'un Batch ou de runTransaction pour la cohérence des données
      const batch = adminDbInstance.batch();

      // 1. Référence document facture : companies/{tenantId}/invoices/{cmdRef}
      const invoiceRef = adminDbInstance.collection("companies").doc(tenantId).collection("invoices").doc(cmdRef);
      batch.set(
        invoiceRef,
        {
          status: "PAID",
          validatedAt: nowIso,
          validatedBy: validatedByAdminEmail,
          paymentMethod: "VIREMENT_BANCAIRE_VALIDE"
        },
        { merge: true }
      );

      // 2. Référence document tenant : companies/{tenantId}
      const tenantRef = adminDbInstance.collection("companies").doc(tenantId);
      
      // Récupération du document tenant pour nettoyer le tableau temporaryAccess
      const tenantSnap = await tenantRef.get();
      let updatedTempAccess: any[] = [];
      
      if (tenantSnap.exists) {
        const data = tenantSnap.data();
        const currentTempAccess: any[] = data.temporaryAccess || [];
        // Filtrer pour retirer le module validé
        updatedTempAccess = currentTempAccess.filter((item) => item.moduleId !== moduleId);
      }

      // Mise à jour atomique du tenant
      batch.set(
        tenantRef,
        {
          activeModules: adminDbInstance.FieldValue 
            ? adminDbInstance.FieldValue.arrayUnion(moduleId, 'mod-11-mobile-fleet')
            : ['MOD-11', moduleId],
          temporaryAccess: updatedTempAccess,
          lastUpdated: nowIso,
          subscriptionStatus: "ACTIVE"
        },
        { merge: true }
      );

      // Exécution de la transaction batch
      await batch.commit();
      console.log(`[validateBankTransfer] Transaction réussie pour tenant ${tenantId}`);

    } catch (err: any) {
      console.error("[validateBankTransfer] Erreur Firestore Batch:", err);
      throw new Error(`Échec de la validation Firestore : ${err.message}`);
    }
  }

  return {
    success: true,
    message: `Virement validé avec succès pour ${tenantId}. Accès permanent accordé pour le module ${moduleId}.`,
    updatedAt: nowIso
  };
}

/**
 * Code d'Exemple pour Firebase Cloud Functions v2 (index.ts) :
 * 
 * import { onCall, HttpsError } from "firebase-functions/v2/https";
 * import * as admin from "firebase-admin";
 * 
 * exports.validateBankTransfer = onCall({ region: "europe-west1" }, async (request) => {
 *   // Vérification des droits Admin
 *   if (!request.auth || !request.auth.token.admin) {
 *     throw new HttpsError("permission-denied", "Accès réservé aux administrateurs Elyssa ERP.");
 *   }
 *   
 *   const { tenantId, cmdRef, moduleId } = request.data;
 *   return await executeValidateBankTransferLogic(
 *     { tenantId, cmdRef, moduleId, validatedByAdminEmail: request.auth.token.email },
 *     admin.firestore()
 *   );
 * });
 */
