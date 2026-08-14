import { GoogleGenAI, Type } from '@google/genai';

function getAiClient(customApiKey?: string): GoogleGenAI | null {
  const key = customApiKey?.trim() || process.env.GEMINI_API_KEY || '';
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export interface FinancialHealthSummary {
  healthScore: number;
  headline: string;
  keyTakeaways: string[];
  aiNarrativeMd: string;
}

export interface ClientCreditRisk {
  clientId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  analysis: string;
  recommendedAction: string;
}

export class GeminiService {
  /**
   * Appelle Gemini avec un responseSchema strict au format JSON pour le rapport hebdo.
   * Utilise en priorité la clé personnalisée du tenant (BYOK), puis process.env.GEMINI_API_KEY.
   */
  static async generateFinancialHealthSummary(condensedJson: any, customApiKey?: string): Promise<FinancialHealthSummary> {
    const prompt = `Tu es un expert financier et conseiller stratégique pour Elyssa ERP.
Analyse les données condensées suivantes et génère un rapport de santé financière.
Donne un score sur 100, une phrase d'accroche (headline), 3-5 points clés (keyTakeaways), et un court paragraphe markdown d'analyse (aiNarrativeMd).

Données:
${JSON.stringify(condensedJson, null, 2)}`;

    try {
      const ai = getAiClient(customApiKey);
      if (!ai) {
        throw new Error("Aucune clé API Gemini disponible (Clé non renseignée et absence de variable d'environnement)");
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.INTEGER, description: "Score de 0 à 100" },
              headline: { type: Type.STRING, description: "Titre principal court" },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Liste de 3 à 5 points clés"
              },
              aiNarrativeMd: { type: Type.STRING, description: "Analyse textuelle en Markdown" }
            },
            required: ['healthScore', 'headline', 'keyTakeaways', 'aiNarrativeMd']
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as FinancialHealthSummary;
      }
      throw new Error("Empty response from Gemini");
    } catch (error: any) {
      console.warn("Gemini API Error (generateFinancialHealthSummary):", error?.message || error);
      // Return a graceful fallback mock instead of crashing
      return {
        healthScore: 65,
        headline: "Alerte de Crédit API (Mode Dégradé)",
        keyTakeaways: [
          "L'API Gemini a renvoyé une erreur de quota ou de connexion.",
          "Les crédits de prépaiement sont potentiellement épuisés.",
          "Ceci est une analyse fictive de secours pour maintenir l'application en fonction."
        ],
        aiNarrativeMd: "### Erreur de génération IA\n\nNous n'avons pas pu générer l'analyse financière complète car l'API Gemini est actuellement indisponible (crédits épuisés ou limite de requêtes atteinte). Veuillez vérifier votre clé API dans les Paramètres de l'Entreprise.\n\n*Ceci est un message de secours généré automatiquement pour éviter de bloquer votre Dashboard.*"
      };
    }
  }

  /**
   * Évalue le risque d'impayé client.
   */
  static async evaluateClientCreditRisk(clientHistoryJson: any, customApiKey?: string): Promise<ClientCreditRisk> {
    const prompt = `Tu es un analyste de risque de crédit intégré à Elyssa ERP.
Analyse l'historique de paiement de ce client et fournis une évaluation du risque d'impayé.

Historique Client:
${JSON.stringify(clientHistoryJson, null, 2)}`;

    try {
      const ai = getAiClient(customApiKey);
      if (!ai) {
        throw new Error("Aucune clé API Gemini disponible");
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clientId: { type: Type.STRING },
              riskScore: { type: Type.INTEGER, description: "Score de risque de 0 à 100" },
              riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
              analysis: { type: Type.STRING, description: "Explication de l'analyse" },
              recommendedAction: { type: Type.STRING, description: "Action concrète suggérée" }
            },
            required: ['clientId', 'riskScore', 'riskLevel', 'analysis', 'recommendedAction']
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as ClientCreditRisk;
      }
      throw new Error("Empty response from Gemini");
    } catch (error: any) {
      console.warn("Gemini API Error (evaluateClientCreditRisk):", error?.message || error);
      return {
        clientId: clientHistoryJson?.clientId || "Unknown",
        riskScore: 50,
        riskLevel: "MEDIUM",
        analysis: "Analyse indisponible en raison de l'indisponibilité de l'API IA.",
        recommendedAction: "Veuillez vérifier manuellement le dossier client."
      };
    }
  }
}
