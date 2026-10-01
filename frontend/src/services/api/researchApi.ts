import { apiRequest, IS_MOCK_MODE } from './client';
import { mockService } from '../mock/mockService';
import type { ResearchBrief, GenerateBriefRequest, ApiResponse } from '../../types';

export const researchApi = {
  /**
   * Retrieve official legislative memorandum / policy research brief
   */
  async getResearchBrief(briefId: string, signal?: AbortSignal): Promise<ResearchBrief> {
    if (IS_MOCK_MODE) {
      return mockService.getResearchBrief(briefId);
    }

    const response = await apiRequest<ApiResponse<ResearchBrief> | ResearchBrief>(
      `/research-brief/${encodeURIComponent(briefId)}`,
      { signal }
    );

    return 'data' in response ? response.data : response;
  },

  /**
   * Generate an executive policy research brief from selected documents and topic
   */
  async generateResearchBrief(request: GenerateBriefRequest, signal?: AbortSignal): Promise<ResearchBrief> {
    if (IS_MOCK_MODE) {
      return mockService.generateResearchBrief(request);
    }

    const response = await apiRequest<ApiResponse<ResearchBrief> | ResearchBrief>(
      '/research-brief/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
        signal,
      }
    );

    return 'data' in response ? response.data : response;
  },
};

