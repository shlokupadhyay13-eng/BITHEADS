import { apiRequest, IS_MOCK_MODE } from './client';
import { mockService } from '../mock/mockService';
import type { CrossPolicyQueryRequest, Comparison, ApiResponse } from '../../types';

function normalizeComparison(comparison: Comparison): Comparison {
  if (!comparison) return comparison;
  const matrix = comparison.comparisonMatrix || comparison.matrix || [];
  return {
    ...comparison,
    comparisonMatrix: matrix,
    matrix,
    similarities: comparison.similarities || [],
    differences: comparison.differences || [],
    documentIds: comparison.documentIds || [],
    allCitations: comparison.allCitations || [],
  };
}

export const comparisonApi = {
  /**
   * Run cross-policy comparison matrix query
   */
  async comparePolicies(
    request: CrossPolicyQueryRequest,
    signal?: AbortSignal
  ): Promise<Comparison> {
    if (IS_MOCK_MODE) {
      const data = await mockService.runCrossPolicyComparison(request);
      return normalizeComparison(data);
    }

    const response = await apiRequest<ApiResponse<Comparison> | Comparison>(
      '/analysis/cross-policy',
      {
        method: 'POST',
        body: JSON.stringify(request),
        signal,
      }
    );

    const raw = 'data' in response ? response.data : response;
    return normalizeComparison(raw);
  },
};
