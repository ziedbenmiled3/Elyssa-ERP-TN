import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { AIAnalyticsEngine } from '../services/aiAnalyticsEngine';
import { GeminiService } from '../services/geminiService';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const router = express.Router();

/**
 * POST /api/v1/ai/test-key
 * Endpoint pour vérifier la validité d'une clé API Gemini 2.5 Flash
 */
router.post('/test-key', async (req, res) => {
  try {
    const { apiKey, companyId } = req.body;
    let keyToTest = (apiKey || req.headers['x-gemini-key'] || '').toString().trim();

    if (!keyToTest && companyId) {
      const docId = companyId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const docRef = doc(db, 'company_erp_data', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const erpData = docSnap.data();
        keyToTest = erpData?.geminiApiKey || erpData?.admin_settings?.geminiApiKey || erpData?.settings?.geminiApiKey || '';
      }
    }

    if (!keyToTest) {
      keyToTest = process.env.GEMINI_API_KEY || '';
    }

    if (!keyToTest || keyToTest === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        valid: false,
        error: "Aucune clé API Gemini fournie ni configurée pour cette entreprise."
      });
    }

    const ai = new GoogleGenAI({ apiKey: keyToTest });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Test de réponse API. Réponds uniquement "OK".'
    });

    if (response && response.text) {
      return res.status(200).json({
        valid: true,
        message: 'Clé API Gemini 2.5 Flash valide et opérationnelle ! ✅'
      });
    } else {
      throw new Error('Réponse vide obtenue de l\'API Gemini.');
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('[Gemini Test Key Error]:', errMsg);
    const isQuotaError = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('prepayment credits') || errMsg.includes('depleted');
    return res.status(400).json({
      valid: false,
      error: isQuotaError
        ? "Vos crédits de prépaiement Gemini sont épuisés ou le quota est atteint. L'application bascule automatiquement sur l'IA simulée locale."
        : (errMsg || 'Clé API invalide ou quota dépassé.')
    });
  }
});

// Middleware to parse and enforce companyId
const enforceCompanyId = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const companyId = req.headers['x-company-id'] || req.body.companyId;
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }
  (req as any).companyId = companyId;
  next();
};

/**
 * POST /api/v1/ai/generate-insights
 * Traitement asynchrone (HTTP 202) avec cache, bypass immédiat si mode démo
 */
router.post('/generate-insights', enforceCompanyId, async (req, res) => {
  const companyId = (req as any).companyId;
  const isDemo = req.headers['x-is-demo'] === 'true' || req.body.isDemo === true || companyId === 'pc-parent-elyssa';

  // 1. Détection Mode Démo -> Réponse immédiate mockée
  if (isDemo) {
    return res.status(200).json({
      status: 'demo',
      insights: {
        summary: {
          healthScore: 85,
          headline: "Situation Financière Saine (Mode Démo)",
          keyTakeaways: ["Trésorerie stable", "Baisse des BFR"],
          aiNarrativeMd: "En **mode démo**, l'entreprise présente des métriques très satisfaisantes..."
        },
        forecast: {
          currentBalance: 125000,
          forecast30Days: 140000,
          forecast60Days: 135000,
          forecast90Days: 150000,
          riskLevel: 'LOW'
        },
        anomalies: [
          {
            id: 'DEMO_ANOMALY',
            type: 'PRICE_SPIKE',
            severity: 'MEDIUM',
            description: 'Hausse simulée des prix constatée.',
            detectedAt: new Date().toISOString()
          }
        ],
        generatedAt: new Date().toISOString()
      }
    });
  }

  // 2. Traitement asynchrone réel (HTTP 202)
  res.status(202).json({ message: 'Génération des insights en cours de traitement asynchrone...' });

  try {
    // We execute the actual generation in background
    setTimeout(async () => {
      try {
        const docId = companyId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        
        // Fetch the document
        const docRef = doc(db, 'company_erp_data', docId);
        const docSnap = await getDoc(docRef);
        const erpData = docSnap.exists() ? docSnap.data() : {}; 

        // Extraction tenant key (BYOK priority)
        const tenantGeminiKey = erpData?.geminiApiKey || erpData?.admin_settings?.geminiApiKey || erpData?.settings?.geminiApiKey;

        // Extraction locale
        const lightweightContext = AIAnalyticsEngine.extractLightweightERPContext(erpData);
        const anomalies = AIAnalyticsEngine.detectLocalAnomalies(erpData);
        const forecast = AIAnalyticsEngine.calculateCashflowForecast(erpData);

        // Appel API Gemini avec la clé du tenant
        const summary = await GeminiService.generateFinancialHealthSummary(lightweightContext, tenantGeminiKey);

        // Consolidation
        const aiCopilotModuleData = {
          summary,
          forecast,
          anomalies,
          generatedAt: new Date().toISOString()
        };

        // Sauvegarde dans Firestore
        await setDoc(docRef, { ai_copilot_module: aiCopilotModuleData }, { merge: true });
        console.log(`[AI Copilot] Insights generated and saved for ${companyId}`);
      } catch (bgError) {
        console.warn(`[AI Copilot] Background processing failed for ${companyId}:`, bgError);
      }
    }, 0); // push to event loop
  } catch (error) {
    console.warn('Error initiating insights generation:', error);
  }
});

/**
 * GET /api/v1/ai/insights
 * Lecture rapide du cache / données Firestore
 */
router.get('/insights', enforceCompanyId, async (req, res) => {
  const companyId = (req as any).companyId;
  const isDemo = req.headers['x-is-demo'] === 'true' || req.query.isDemo === 'true' || companyId === 'pc-parent-elyssa';

  if (isDemo) {
    return res.status(200).json({
      summary: { healthScore: 85, headline: "Demo Health", keyTakeaways: [], aiNarrativeMd: "" },
      forecast: { currentBalance: 0, forecast30Days: 0, forecast60Days: 0, forecast90Days: 0, riskLevel: 'LOW' },
      anomalies: [],
      generatedAt: new Date().toISOString()
    });
  }

  try {
    const docId = companyId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(db, 'company_erp_data', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().ai_copilot_module) {
      return res.status(200).json(docSnap.data().ai_copilot_module);
    }
    
    // Si pas de données encore
    return res.status(404).json({ error: 'Insights not yet generated.' });
  } catch (error) {
    console.warn('Error fetching insights:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/v1/ai/copilot-chat
 */
router.post('/copilot-chat', enforceCompanyId, async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // Simulate Gemini chat call
    // const response = await ai.models.generateContent({...})
    const mockReply = `Ceci est une réponse du Copilot (Mock). J'ai bien reçu : "${message}".`;
    res.status(200).json({ reply: mockReply });
  } catch (error) {
    console.warn('Copilot Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
