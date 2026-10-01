import { apiRequest, IS_MOCK_MODE } from './client';
import { mockService } from '../mock/mockService';
import type { Document, DocumentStatus, PolicyCategory, ProcessingStage, ApiResponse } from '../../types';

/**
 * Normalizes backend document statuses to the strict 4-state lifecycle:
 * 'uploaded' | 'processing' | 'ready' | 'failed'
 */
export function normalizeDocumentStatus(status: unknown): DocumentStatus {
  if (typeof status !== 'string') return 'uploaded';
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'analyzed') return 'ready';
  if (s === 'processing' || s === 'extracting' || s === 'chunking' || s === 'analyzing') return 'processing';
  if (s === 'failed') return 'failed';
  return 'uploaded';
}

function normalizeDocument(doc: Document): Document {
  return {
    ...doc,
    status: normalizeDocumentStatus(doc.status),
  };
}

export const documentsApi = {
  /**
   * Fetch all documents with optional filters
   */
  async listDocuments(
    filters?: {
      category?: string;
      status?: string;
      search?: string;
    },
    signal?: AbortSignal
  ): Promise<Document[]> {
    if (IS_MOCK_MODE) {
      const docs = await mockService.listDocuments(filters);
      return docs.map(normalizeDocument);
    }

    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest<ApiResponse<Document[]> | Document[]>(
      `/documents${queryString}`,
      { signal }
    );

    const rawList = Array.isArray(response) ? response : response.data;
    return (rawList || []).map(normalizeDocument);
  },

  /**
   * Fetch single document by ID
   */
  async getDocumentById(id: string, signal?: AbortSignal): Promise<Document> {
    if (IS_MOCK_MODE) {
      const doc = await mockService.getDocumentById(id);
      return normalizeDocument(doc);
    }

    const response = await apiRequest<ApiResponse<Document> | Document>(
      `/documents/${encodeURIComponent(id)}`,
      { signal }
    );
    const doc = 'data' in response ? response.data : response;
    return normalizeDocument(doc);
  },

  /**
   * Ingest new policy document binary with statutory metadata
   */
  async uploadDocument(
    file: File,
    metadata: {
      title: string;
      issuingMinistry: string;
      category: PolicyCategory;
      publicationDate: string;
    },
    signal?: AbortSignal
  ): Promise<Document> {
    if (IS_MOCK_MODE) {
      const doc = await mockService.uploadDocument(file, metadata);
      return normalizeDocument(doc);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('issuingMinistry', metadata.issuingMinistry);
    formData.append('category', metadata.category);
    formData.append('publicationDate', metadata.publicationDate);

    const response = await apiRequest<ApiResponse<Document> | Document>(
      '/documents/upload',
      {
        method: 'POST',
        body: formData,
        signal,
      }
    );

    const doc = 'data' in response ? response.data : response;
    return normalizeDocument(doc);
  },

  /**
   * Poll processing pipeline status
   */
  async getDocumentStatus(
    id: string,
    signal?: AbortSignal
  ): Promise<{
    status: DocumentStatus;
    stages: ProcessingStage[];
    failureReason?: string;
  }> {
    if (IS_MOCK_MODE) {
      const res = await mockService.getDocumentProcessingStatus(id);
      return {
        ...res,
        status: normalizeDocumentStatus(res.status),
      };
    }

    const response = await apiRequest<{
      status: unknown;
      stages: ProcessingStage[];
      failureReason?: string;
    }>(`/documents/${encodeURIComponent(id)}/status`, { signal });

    return {
      ...response,
      status: normalizeDocumentStatus(response.status),
      stages: response.stages || [],
    };
  },

  /**
   * Request processing retry on failed ingestion
   */
  async retryDocument(
    id: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message: string }> {
    if (IS_MOCK_MODE) {
      return mockService.retryDocumentProcessing(id);
    }

    return apiRequest<{ success: boolean; message: string }>(
      `/documents/${encodeURIComponent(id)}/retry`,
      { method: 'POST', signal }
    );
  },
};
