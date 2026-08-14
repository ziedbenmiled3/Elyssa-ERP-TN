import { Router, Request, Response } from 'express';
import { BiometricVerificationService } from '../services/biometricVerificationService';

const router = Router();

/**
 * Route POST /api/v1/mobile/verify-attendance-selfie
 * Effectue la vérification faciale et anti-spoofing via Gemini Vision v2.5
 */
router.post('/verify-attendance-selfie', async (req: Request, res: Response) => {
  try {
    const { attendanceId, tenantId, agentId, selfieBase64OrUrl, sessionId, apiKey } = req.body;

    if (!attendanceId || !tenantId || !agentId || !selfieBase64OrUrl) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants : attendanceId, tenantId, agentId, et selfieBase64OrUrl sont requis.'
      });
    }

    const customKey = apiKey || req.headers['x-gemini-api-key'] as string;

    const result = await BiometricVerificationService.verifySelfie({
      attendanceId,
      tenantId,
      agentId,
      selfieBase64OrUrl,
      sessionId,
      customApiKey: customKey
    });

    return res.status(200).json({
      success: result.status === 'VERIFIED',
      verification: result
    });
  } catch (err: any) {
    console.error('[API verify-attendance-selfie] Erreur:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Erreur interne lors de la vérification biométrique.'
    });
  }
});

export default router;
