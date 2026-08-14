import { BiometricVerificationService, BiometricVerificationInput, BiometricVerificationResult } from '../services/biometricVerificationService';

/**
 * Interface pour la requête d'appel Cloud Function
 */
export interface VerifyAttendanceSelfieRequestData {
  attendanceId: string;
  tenantId: string;
  agentId: string;
  selfieBase64OrUrl: string;
  sessionId?: string;
  apiKey?: string;
}

/**
 * Interface pour le contexte d'authentification Firebase Cloud Functions
 */
export interface CallableContext {
  auth?: {
    uid: string;
    token: {
      email?: string;
      company_id?: string;
      companyId?: string;
      tenantId?: string;
      role?: string;
    };
  };
}

/**
 * Cloud Function Handler : verifyAttendanceSelfie
 * 
 * Peut être déployée en tant que Firebase Callable Cloud Function :
 * export const verifyAttendanceSelfie = functions.https.onCall(verifyAttendanceSelfieHandler);
 */
export async function verifyAttendanceSelfieHandler(
  data: VerifyAttendanceSelfieRequestData,
  context?: CallableContext
): Promise<{ success: boolean; data: BiometricVerificationResult }> {
  // 1. Validation de sécurité et des entrées
  if (!data || !data.attendanceId || !data.tenantId || !data.agentId || !data.selfieBase64OrUrl) {
    throw new Error('Paramètres manquants : attendanceId, tenantId, agentId, et selfieBase64OrUrl sont requis.');
  }

  // 2. Contrôle d'accès multi-tenant si auth présent
  if (context?.auth) {
    const userTenant = context.auth.token?.company_id || context.auth.token?.companyId || context.auth.token?.tenantId;
    const isSuperAdmin = context.auth.token?.role === 'SuperAdmin';

    if (userTenant && userTenant !== data.tenantId && !isSuperAdmin) {
      throw new Error(`Violation de sécurité multi-tenant : Accès refusé pour le tenant ${data.tenantId}.`);
    }
  }

  // 3. Appel du service de vérification biométrique avec Gemini Vision
  const input: BiometricVerificationInput = {
    attendanceId: data.attendanceId,
    tenantId: data.tenantId,
    agentId: data.agentId,
    selfieBase64OrUrl: data.selfieBase64OrUrl,
    sessionId: data.sessionId,
    customApiKey: data.apiKey
  };

  try {
    const result = await BiometricVerificationService.verifySelfie(input);
    return {
      success: result.status === 'VERIFIED',
      data: result
    };
  } catch (err: any) {
    console.error('[CloudFunction verifyAttendanceSelfie] Erreur lors de l\'exécution:', err);
    throw new Error(`Échec du contrôle biométrique : ${err?.message || err}`);
  }
}
