import { apiRequest, IS_MOCK_MODE } from './client';
import { mockService } from '../mock/mockService';
import type { QuestionRequest, QuestionResponse, ApiResponse } from '../../types';

export const questionsApi = {
  /**
   * Submit an evidence-grounded research question against policy corpus
   */
  async askQuestion(request: QuestionRequest, signal?: AbortSignal): Promise<QuestionResponse> {
    if (IS_MOCK_MODE) {
      return mockService.askQuestion(request.question, request.documentIds);
    }

    const response = await apiRequest<ApiResponse<QuestionResponse> | QuestionResponse>(
      '/questions/query',
      {
        method: 'POST',
        body: JSON.stringify(request),
        signal,
      }
    );

    return 'data' in response ? response.data : response;
  },
};
