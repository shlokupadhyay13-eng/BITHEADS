/**
 * Shared Type Definitions — PolicyIntelligence Platform
 * 
 * WCAG 2.2 AA Compatible • Zero-Fabrication Standard
 * All optional fields are explicitly marked with ? so the UI
 * gracefully tolerates partial or missing sections from the backend.
 */

// ============================================================
// 1. AUTHENTICATION & USER
// ============================================================
export interface User {
  id: string;
  name?: string;
  email?: string;
  role?: 'analyst' | 'researcher' | 'administrator' | 'viewer' | string;
  ministry?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  ministry?: string;
}

// ============================================================
// 2. DOCUMENT ENTITIES & STATUS
// ============================================================
export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export type PolicyCategory = 
  | 'environmental'
  | 'healthcare'
  | 'technology_ai'
  | 'energy'
  | 'finance_trade'
  | 'education'
  | 'infrastructure'
  | 'general'
  | string;

export interface ProcessingStage {
  stage: 'upload' | 'ocr_extraction' | 'chunking' | 'indexing' | 'synthesis' | string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  issuingMinistry?: string;
  publicationDate?: string;
  category?: PolicyCategory;
  fileSize?: number; // in bytes
  pageCount?: number;
  fileUrl?: string;
  uploadedAt?: string;
  lastUpdated?: string;
  summarySnippet?: string;
  failureReason?: string;
  stages?: ProcessingStage[];
}

// Backwards-compatible alias for existing components
export type PolicyDocument = Document;

// ============================================================
// 3. CITATIONS, EVIDENCE & SOURCES
// ============================================================
export interface Source {
  id: string;
  documentId?: string;
  title?: string;
  ministry?: string;
  url?: string;
  publicationDate?: string;
  pageNumber?: number;
  section?: string;
}

/**
 * Primary verifiable evidence excerpt directly from statutory source text.
 */
export interface Evidence {
  id: string;
  excerptQuote: string;
  documentId?: string;
  documentTitle?: string;
  pageNumber?: number;
  sectionHeading?: string;
  paragraphNumber?: number;
  confidenceScore?: number; // 0.0 - 1.0 confidence
  source?: Source;
}

// Backwards-compatible alias for existing components
export type Citation = Evidence;

// ============================================================
// 4. FINDINGS & POLICY PROVISIONS
// ============================================================
export type MandateLevel = 'mandatory' | 'discretionary' | 'advisory' | 'prohibitory' | string;

export interface Finding {
  id: string;
  summary?: string;
  title?: string;
  mandateLevel?: MandateLevel;
  effectiveDate?: string;
  enforcingAgency?: string;
  penaltiesOrConsequences?: string;
  citations?: Evidence[];
  evidence?: Evidence[];
}

// Backwards-compatible alias for existing components
export type KeyProvision = Finding;

// ============================================================
// 5. STAKEHOLDERS & REGULATORY INSIGHTS
// ============================================================
export type StakeholderImpactType = 
  | 'positive' 
  | 'neutral' 
  | 'restrictive' 
  | 'financial_burden' 
  | 'compliance_requirement'
  | string;

export interface StakeholderImpact {
  id: string;
  groupName?: string;
  description?: string;
  impactType?: StakeholderImpactType;
  complianceDeadline?: string;
  citations?: Evidence[];
}

export interface Insight {
  id: string;
  description?: string;
  category?: 'ambiguity' | 'enforcement_gap' | 'timeline_risk' | 'statutory_conflict' | 'financial_unfunded' | string;
  title?: string;
  severity?: 'low' | 'medium' | 'high' | string;
  suggestedRemediation?: string;
  citations?: Evidence[];
}

// Backwards-compatible alias for existing components
export type PolicyRiskOrGap = Insight;

// ============================================================
// 6. FULL POLICY ANALYSIS MODEL
// ============================================================
export interface Analysis {
  documentId: string;
  executiveSummary?: string;
  analyzedAt?: string;
  modelVersion?: string;
  findings?: Finding[];
  keyProvisions?: Finding[];
  insights?: Insight[];
  risksAndGaps?: Insight[];
  stakeholderImpacts?: StakeholderImpact[];
  extractedMetrics?: {
    label?: string;
    value?: string;
    unit?: string;
    citations?: Evidence[];
  }[];
  keyPoints?: string[];
  limitations?: string[];
  categories?: Record<string, string | string[]>;
}

// Backwards-compatible alias for existing components
export type PolicyAnalysis = Analysis;

// ============================================================
// 7. QUESTION & ANSWER (EVIDENCE GROUNDED)
// ============================================================
export interface QuestionRequest {
  question: string;
  documentIds?: string[];
  scope?: 'single_document' | 'corpus' | string;
}

export interface QuestionResponse {
  id?: string;
  question: string;
  answer: string;
  documentIds?: string[];
  evidence?: Evidence[];
  confidence?: number;
  generatedAt?: string;
}

// ============================================================
// 8. CROSS-POLICY COMPARISON
// ============================================================
export interface ComparisonFinding {
  documentId: string;
  documentTitle: string;
  findingSummary: string;
  citations?: Evidence[];
}

export interface ComparisonMatrixRow {
  comparisonTopic: string;
  criterionId?: string;
  findings: ComparisonFinding[];
}

export interface Comparison {
  query?: string;
  documentIds?: string[];
  synthesizedAnswer?: string;
  similarities?: string[];
  differences?: string[];
  comparisonMatrix?: ComparisonMatrixRow[];
  matrix?: ComparisonMatrixRow[];
  allCitations?: Evidence[];
  timestamp?: string;
  criteria?: string[];
}

// Backwards-compatible aliases & extended request
export interface CrossPolicyQueryRequest {
  query?: string;
  documentIds?: string[];
  documentIdA?: string;
  documentIdB?: string;
  criteria?: string[];
}
export type CrossPolicyAnalysisResult = Comparison;
export type CrossPolicyFinding = ComparisonFinding;

// ============================================================
// 9. RESEARCH BRIEF & LEGISLATIVE MEMORANDUM
// ============================================================
export interface ResearchBrief {
  id: string;
  title: string;
  documentId?: string;
  documentIds?: string[];
  topic?: string;
  subject?: string;
  ministry?: string;
  gazetteDate?: string;
  executiveSummary?: string;
  background?: string;
  keyFindings?: Finding[];
  policyAnalysis?: string;
  evidence?: Evidence[];
  implications?: string[];
  limitations?: string[];
  sources?: Source[];
  stakeholderSummary?: StakeholderImpact[];
  regulatoryRisks?: Insight[];
  evidenceRegister?: Evidence[];
  generatedAt?: string;
  authorDivision?: string;
}

export interface GenerateBriefRequest {
  documentIds: string[];
  topic: string;
}

// ============================================================
// 10. API RESPONSES & CENTRALIZED ERROR
// ============================================================
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    processingTimeMs?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  timestamp?: string;
}
