import { comparisonApi } from './comparisonApi';
import { analysisApi } from './analysisApi';
import type {
  CrossPolicyQueryRequest,
  CrossPolicyAnalysisResult,
} from '../../types';

/**
 * Service adapter providing backwards compatibility for existing components
 * while delegating directly to comparisonApi and analysisApi.
 */
export const analysisService = {
  async runCrossPolicyComparison(
    request: CrossPolicyQueryRequest,
    signal?: AbortSignal
  ): Promise<CrossPolicyAnalysisResult> {
    return comparisonApi.comparePolicies(request, signal);
  },

  async checkBackendHealth(signal?: AbortSignal): Promise<{
    status: string;
    version?: string;
    geminiConnected?: boolean;
    mongoConnected?: boolean;
  }> {
    return analysisApi.checkBackendHealth(signal);
  },
};
