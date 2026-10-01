import type {
  Document,
  Analysis,
  PolicyCategory,
  CrossPolicyQueryRequest,
  Comparison,
  ProcessingStage,
  ApiError,
  QuestionResponse,
  ResearchBrief,
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  DocumentStatus,
} from '../../types';
import { mockDocuments } from './mockDocuments';
import { mockAnalysis } from './mockAnalysis';
import { mockQuestions } from './mockQuestions';
import { mockComparison } from './mockComparison';
import { mockResearchBrief } from './mockResearchBrief';

const SIMULATED_LATENCY_MS = 250;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory clones for mutation support in demo mode
let inMemoryDocuments = [...mockDocuments];

const MOCK_USER: User = {
  id: 'usr-analyst-001',
  name: 'Senior Policy Analyst',
  email: 'analyst@intelligence.gov.in',
  role: 'analyst',
  ministry: 'Cabinet Secretariat / Policy Research',
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockService = {
  // ============================================================
  // AUTHENTICATION
  // ============================================================
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await delay(SIMULATED_LATENCY_MS);
    if (!credentials.email) {
      throw {
        statusCode: 400,
        message: 'Email address is required for institutional authentication.',
      } as ApiError;
    }

    return {
      user: {
        ...MOCK_USER,
        email: credentials.email,
      },
      token: 'mock-jwt-bearer-token-sec-2026',
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };
  },

  async register(data: RegisterData): Promise<AuthSession> {
    await delay(SIMULATED_LATENCY_MS);
    if (!data.email || !data.password || !data.name) {
      throw {
        statusCode: 400,
        message: 'Name, email, and password are required for registration.',
      } as ApiError;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'analyst',
      ministry: data.ministry || 'Ministry of Law and Justice',
      createdAt: new Date().toISOString(),
    };
    return {
      user: newUser,
      token: 'mock-jwt-bearer-token-registered',
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };
  },

  async getCurrentUser(): Promise<User> {
    await delay(SIMULATED_LATENCY_MS / 2);
    return MOCK_USER;
  },

  // ============================================================
  // DOCUMENTS
  // ============================================================
  async listDocuments(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Document[]> {
    await delay(SIMULATED_LATENCY_MS);
    let docs = [...inMemoryDocuments];

    if (filters?.category && filters.category !== 'all') {
      docs = docs.filter((d) => d.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      docs = docs.filter((d) => d.status === filters.status);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.issuingMinistry && d.issuingMinistry.toLowerCase().includes(q)) ||
          (d.summarySnippet && d.summarySnippet.toLowerCase().includes(q))
      );
    }

    return docs;
  },

  async getDocumentById(id: string): Promise<Document> {
    await delay(SIMULATED_LATENCY_MS);
    const doc = inMemoryDocuments.find((d) => d.id === id);
    if (!doc) {
      throw {
        statusCode: 404,
        message: `Policy document with ID "${id}" was not found in the records.`,
      } as ApiError;
    }
    return doc;
  },

  async uploadDocument(
    file: File,
    metadata: {
      title: string;
      issuingMinistry: string;
      category: PolicyCategory;
      publicationDate: string;
    }
  ): Promise<Document> {
    await delay(SIMULATED_LATENCY_MS * 2);

    const newDocId = `doc-gov-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const stages: ProcessingStage[] = [
      { stage: 'upload', label: 'File Upload & Verification', status: 'completed', startedAt: now, completedAt: now },
      { stage: 'ocr_extraction', label: 'PDF Text Extraction & Cleaning', status: 'in_progress', startedAt: now },
      { stage: 'chunking', label: 'Semantic Policy Chunking', status: 'pending' },
      { stage: 'indexing', label: 'Vector Indexing & Cross-Ref Mapping', status: 'pending' },
      { stage: 'synthesis', label: 'Policy Intelligence Synthesis', status: 'pending' },
    ];

    const newDoc: Document = {
      id: newDocId,
      title: metadata.title.trim(),
      issuingMinistry: metadata.issuingMinistry.trim(),
      category: metadata.category,
      publicationDate: metadata.publicationDate,
      fileSize: file.size,
      status: 'processing',
      uploadedAt: now,
      lastUpdated: now,
      stages,
      summarySnippet: 'Document uploaded and awaiting OCR extraction and analysis pipeline completion.',
    };

    inMemoryDocuments = [newDoc, ...inMemoryDocuments];
    return newDoc;
  },

  async getDocumentProcessingStatus(id: string): Promise<{
    status: Document['status'];
    stages: ProcessingStage[];
    failureReason?: string;
  }> {
    await delay(SIMULATED_LATENCY_MS);
    const doc = inMemoryDocuments.find((d) => d.id === id);
    if (!doc) {
      throw {
        statusCode: 404,
        message: `Document not found for status lookup: ${id}`,
      } as ApiError;
    }
    return {
      status: doc.status,
      stages: doc.stages || [],
      failureReason: doc.failureReason,
    };
  },

  async retryDocumentProcessing(id: string): Promise<{ success: boolean; message: string }> {
    await delay(SIMULATED_LATENCY_MS);
    const docIndex = inMemoryDocuments.findIndex((d) => d.id === id);
    if (docIndex === -1) {
      throw {
        statusCode: 404,
        message: `Document not found: ${id}`,
      } as ApiError;
    }

    const now = new Date().toISOString();
    inMemoryDocuments[docIndex] = {
      ...inMemoryDocuments[docIndex],
      status: 'processing',
      failureReason: undefined,
      lastUpdated: now,
      stages: inMemoryDocuments[docIndex].stages?.map((s) =>
        s.stage === 'upload' ? s : { ...s, status: s.stage === 'ocr_extraction' ? 'in_progress' : 'pending', error: undefined }
      ),
    };

    return {
      success: true,
      message: `Processing pipeline restarted for "${inMemoryDocuments[docIndex].title}".`,
    };
  },

  // ============================================================
  // ANALYSIS
  // ============================================================
  async triggerAnalysis(id: string): Promise<{ success: boolean; message: string; status: DocumentStatus }> {
    await delay(SIMULATED_LATENCY_MS);
    const docIndex = inMemoryDocuments.findIndex((d) => d.id === id);
    if (docIndex === -1) {
      throw {
        statusCode: 404,
        message: `Policy document with ID "${id}" was not found.`,
      } as ApiError;
    }

    const doc = inMemoryDocuments[docIndex];
    const now = new Date().toISOString();

    inMemoryDocuments[docIndex] = {
      ...doc,
      status: 'processing',
      lastUpdated: now,
      stages: [
        { stage: 'upload', label: 'File Upload & Integrity Check', status: 'completed', startedAt: now, completedAt: now },
        { stage: 'ocr_extraction', label: 'PDF Text Extraction & Cleaning', status: 'completed', startedAt: now, completedAt: now },
        { stage: 'chunking', label: 'Semantic Policy Chunking', status: 'in_progress', startedAt: now },
        { stage: 'indexing', label: 'Vector Indexing & Cross-Ref Mapping', status: 'pending' },
        { stage: 'synthesis', label: 'Policy Intelligence Synthesis', status: 'pending' },
      ],
    };

    return {
      success: true,
      message: `Statutory synthesis initiated for "${doc.title}".`,
      status: 'processing',
    };
  },

  async getDocumentAnalysis(id: string): Promise<Analysis> {
    await delay(SIMULATED_LATENCY_MS);
    const doc = inMemoryDocuments.find((d) => d.id === id);
    if (!doc) {
      throw {
        statusCode: 404,
        message: `Policy document with ID "${id}" was not found.`,
      } as ApiError;
    }

    if (doc.status !== 'ready') {
      throw {
        statusCode: 400,
        message: `Document is currently in "${doc.status}" state. Policy analysis is available only after processing completes.`,
      } as ApiError;
    }

    const analysis = mockAnalysis[id];
    if (!analysis) {
      throw {
        statusCode: 404,
        message: `Analysis record for document "${id}" has not yet been synthesized.`,
      } as ApiError;
    }

    return analysis;
  },

  // ============================================================
  // QUESTIONS & ANSWERS (GROUNDED EVIDENCE)
  // ============================================================
  async askQuestion(question: string, documentIds?: string[]): Promise<QuestionResponse> {
    await delay(SIMULATED_LATENCY_MS * 2);

    const q = question.toLowerCase();
    if (q.includes('penalty') || q.includes('fine') || q.includes('consequence')) {
      return mockQuestions['penalties'];
    }
    if (q.includes('deadline') || q.includes('transition') || q.includes('date')) {
      return mockQuestions['deadlines'];
    }

    // Default grounded mock response with authentic citations
    return {
      question,
      answer: `Analysis across selected policies confirms statutory oversight under both Central and State nodal authorities. Specific provisions mandate quarterly compliance filings and third-party verified monitoring audits.`,
      documentIds: documentIds || ['doc-gov-2024-001'],
      confidence: 0.95,
      generatedAt: new Date().toISOString(),
      evidence: mockAnalysis['doc-gov-2024-001']?.findings?.[0]?.citations || [],
    };
  },

  // ============================================================
  // COMPARISON
  // ============================================================
  async runCrossPolicyComparison(request: CrossPolicyQueryRequest): Promise<Comparison> {
    await delay(SIMULATED_LATENCY_MS * 2);

    const docIds = request.documentIds || (request.documentIdA && request.documentIdB ? [request.documentIdA, request.documentIdB] : []);

    if (docIds.length < 2) {
      throw {
        statusCode: 400,
        message: 'Two distinct analyzed documents must be selected for comparison.',
      } as ApiError;
    }

    if (docIds[0] === docIds[1]) {
      throw {
        statusCode: 400,
        message: 'Document A and Document B cannot be the same document.',
      } as ApiError;
    }

    const sample = mockComparison['compliance-deadlines'];
    const selectedCriteria = request.criteria && request.criteria.length > 0 ? request.criteria : undefined;

    // Filter matrix rows by criteria if provided
    let filteredMatrix = sample.comparisonMatrix?.map((m) => ({
      ...m,
      findings: m.findings.filter((f) => docIds.includes(f.documentId)),
    })) || [];

    if (selectedCriteria) {
      filteredMatrix = filteredMatrix.filter((m) =>
        m.criterionId ? selectedCriteria.includes(m.criterionId) : true
      );
    }

    return {
      query: request.query || 'Statutory Multi-Criterion Cross-Policy Comparison',
      timestamp: new Date().toISOString(),
      documentIds: docIds,
      synthesizedAnswer: sample.synthesizedAnswer,
      similarities: sample.similarities,
      differences: sample.differences,
      criteria: request.criteria,
      comparisonMatrix: filteredMatrix,
      matrix: filteredMatrix,
      allCitations: sample.allCitations?.filter((c) => (c.documentId ? docIds.includes(c.documentId) : true)),
    };
  },

  // ============================================================
  // RESEARCH BRIEFS
  // ============================================================
  async getResearchBrief(briefId: string): Promise<ResearchBrief> {
    await delay(SIMULATED_LATENCY_MS);
    const brief = mockResearchBrief[briefId];
    if (!brief) {
      throw {
        statusCode: 404,
        message: `Research brief with ID "${briefId}" was not found.`,
      } as ApiError;
    }
    return brief;
  },

  async generateResearchBrief(request: { documentIds: string[]; topic: string }): Promise<ResearchBrief> {
    await delay(SIMULATED_LATENCY_MS * 2);

    if (!request.topic || request.topic.trim().length === 0) {
      throw {
        statusCode: 400,
        message: 'A research topic or inquiry scope is required to generate a brief.',
      } as ApiError;
    }

    if (!request.documentIds || request.documentIds.length === 0) {
      throw {
        statusCode: 400,
        message: 'At least one catalogued document must be selected to generate a brief.',
      } as ApiError;
    }

    const newId = `brief-${Date.now().toString(36)}`;
    const base = mockResearchBrief['brief-001'];
    const newBrief: ResearchBrief = {
      ...base,
      id: newId,
      title: `Executive Legislative Memorandum: ${request.topic}`,
      topic: request.topic,
      documentIds: request.documentIds,
      generatedAt: new Date().toISOString(),
    };

    // Store in mock memory
    mockResearchBrief[newId] = newBrief;
    return newBrief;
  },
};

