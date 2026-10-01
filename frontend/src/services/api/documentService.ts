import { documentsApi } from './documentsApi';
import { analysisApi } from './analysisApi';
import type {
  PolicyDocument,
  PolicyAnalysis,
  PolicyCategory,
  ProcessingStage,
  DocumentStatus,
} from '../../types';

/**
 * Service adapter providing backwards compatibility for existing components
 * while delegating directly to documentsApi and analysisApi.
 */
export const documentService = {
  async listDocuments(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }, signal?: AbortSignal): Promise<PolicyDocument[]> {
    return documentsApi.listDocuments(filters, signal);
  },

  async getDocumentById(id: string, signal?: AbortSignal): Promise<PolicyDocument> {
    return documentsApi.getDocumentById(id, signal);
  },

  async uploadDocument(
    file: File,
    metadata: {
      title: string;
      issuingMinistry: string;
      category: PolicyCategory;
      publicationDate: string;
    },
    signal?: AbortSignal
  ): Promise<PolicyDocument> {
    return documentsApi.uploadDocument(file, metadata, signal);
  },

  async getDocumentProcessingStatus(id: string, signal?: AbortSignal): Promise<{
    status: DocumentStatus;
    stages: ProcessingStage[];
    failureReason?: string;
  }> {
    return documentsApi.getDocumentStatus(id, signal);
  },

  async getDocumentAnalysis(id: string, signal?: AbortSignal): Promise<PolicyAnalysis> {
    return analysisApi.getDocumentAnalysis(id, signal);
  },

  async retryDocumentProcessing(id: string, signal?: AbortSignal): Promise<{ success: boolean; message: string }> {
    return documentsApi.retryDocument(id, signal);
  },
};
