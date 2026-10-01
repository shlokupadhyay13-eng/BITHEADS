import { apiRequest, IS_MOCK_MODE } from './client';
import { mockService } from '../mock/mockService';
import type { Analysis, ApiResponse, DocumentStatus } from '../../types';

function normalizeAnalysis(analysis: Analysis): Analysis {
  if (!analysis) return analysis;
  const findings = analysis.findings || analysis.keyProvisions || [];
  const insights = analysis.insights || analysis.risksAndGaps || [];
  return {
    ...analysis,
    findings,
    keyProvisions: findings,
    insights,
    risksAndGaps: insights,
    stakeholderImpacts: analysis.stakeholderImpacts || [],
    extractedMetrics: analysis.extractedMetrics || [],
  };
}

export const analysisApi = {
  /**
   * Fetch extracted policy intelligence and verifiable evidence citations
   */
  async getDocumentAnalysis(id: string, signal?: AbortSignal): Promise<Analysis> {
    if (IS_MOCK_MODE) {
      const data = await mockService.getDocumentAnalysis(id);
      return normalizeAnalysis(data);
    }

    const response = await apiRequest<ApiResponse<Analysis> | Analysis>(
      `/documents/${encodeURIComponent(id)}/analysis`,
      { signal }
    );

    const raw = 'data' in response ? response.data : response;
    return normalizeAnalysis(raw);
  },

  /**
   * Trigger statutory policy intelligence analysis pipeline (POST)
   */
  async triggerAnalysis(
    id: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message: string; status: DocumentStatus }> {
    if (IS_MOCK_MODE) {
      return mockService.triggerAnalysis(id);
    }

    const response = await apiRequest<{ success: boolean; message: string; status: DocumentStatus }>(
      `/documents/${encodeURIComponent(id)}/analyze`,
      {
        method: 'POST',
        signal,
      }
    );
    return response;
  },

  /**
   * Check health of intelligence and analysis backend service
   */
  async checkBackendHealth(signal?: AbortSignal): Promise<{
    status: string;
    version?: string;
    geminiConnected?: boolean;
    mongoConnected?: boolean;
  }> {
    return apiRequest<{
      status: string;
      version?: string;
      geminiConnected?: boolean;
      mongoConnected?: boolean;
    }>('/health', { signal, timeoutMs: 5000 });
  },
};
