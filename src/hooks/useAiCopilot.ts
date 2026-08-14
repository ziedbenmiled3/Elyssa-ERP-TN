import { useState, useEffect, useCallback } from 'react';

export interface FinancialHealthSummary {
  healthScore: number;
  headline: string;
  keyTakeaways: string[];
  aiNarrativeMd: string;
}

export interface CashflowForecast {
  currentBalance: number;
  forecast30Days: number;
  forecast60Days: number;
  forecast90Days: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Anomaly {
  id: string;
  type: 'PRICE_SPIKE' | 'TAX_ERROR' | 'DUPLICATE' | 'OTHER';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: any;
  detectedAt: string;
}

export interface AICopilotData {
  summary: FinancialHealthSummary;
  forecast: CashflowForecast;
  anomalies: Anomaly[];
  generatedAt: string;
}

export function useAiCopilot(companyId: string) {
  const [data, setData] = useState<AICopilotData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isDemoMode = companyId === 'pc-parent-elyssa' || companyId === 'demo';

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/ai/insights?isDemo=${isDemoMode}`, {
        headers: { 'x-company-id': companyId }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res.status === 404) {
        setData(null);
      } else {
        throw new Error('Erreur lors de la récupération des insights');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, isDemoMode]);

  useEffect(() => {
    if (companyId) {
      fetchInsights();
    }
  }, [companyId, fetchInsights]);

  const generateInsights = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/ai/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': companyId,
          'x-is-demo': isDemoMode.toString()
        },
        body: JSON.stringify({ isDemo: isDemoMode })
      });
      
      if (res.status === 202) {
        // Polling if asynchronous
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/v1/ai/insights?isDemo=${isDemoMode}`, {
              headers: { 'x-company-id': companyId }
            });
            if (checkRes.ok) {
              const json = await checkRes.json();
              if (json && json.generatedAt) {
                setData(json);
                clearInterval(pollInterval);
                setIsGenerating(false);
              }
            }
          } catch (e) {
            // ignore polling errors
          }
        }, 3000);

        // Timeout polling after 30 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsGenerating(false);
        }, 30000);

      } else if (res.ok) {
        const json = await res.json();
        if (json.insights) {
          setData(json.insights);
        }
        setIsGenerating(false);
      } else {
        throw new Error('Erreur lors de la génération');
      }
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  }, [companyId, isDemoMode]);

  // Global Ctrl+K / Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => setIsChatOpen(prev => !prev);

  return {
    data,
    isLoading,
    isGenerating,
    error,
    isChatOpen,
    openChat,
    closeChat,
    toggleChat,
    fetchInsights,
    generateInsights
  };
}
