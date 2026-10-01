import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  RotateCcw,
  Clock,
  AlertTriangle,
  HelpCircle,
  GitCompare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import type { Document, Analysis, Evidence } from '../types';
import { documentsApi } from '../services/api/documentsApi';
import { analysisApi } from '../services/api/analysisApi';
import { DocumentHeader } from '../components/analysis/DocumentHeader';
import { AnalysisTabs, type AnalysisTabId } from '../components/analysis/AnalysisTabs';
import { SummaryPanel } from '../components/analysis/SummaryPanel';
import { KeyFindings } from '../components/analysis/KeyFindings';
import { PolicyInsights } from '../components/analysis/PolicyInsights';
import { EvidencePanel } from '../components/analysis/EvidencePanel';
import { SourceReferences } from '../components/analysis/SourceReferences';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';

export interface DocumentAnalysisPageProps {
  documentId?: string;
  onBack?: () => void;
}

export const DocumentAnalysisPage: React.FC<DocumentAnalysisPageProps> = ({
  documentId: propDocId,
  onBack: propOnBack,
}) => {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const docId = propDocId || paramId || searchParams.get('id') || 'doc-gov-2024-001';
  const handleBack = propOnBack || (() => navigate('/documents'));

  // Core Data States
  const [doc, setDoc] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<AnalysisTabId>('overview');

  // Triggering & Pipeline Processing States
  const [isTriggeringAnalysis, setIsTriggeringAnalysis] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Evidence Selection & View Source Modal
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [inspectSourceEvidence, setInspectSourceEvidence] = useState<Evidence | null>(null);
  const [isMobileEvidenceOpen, setIsMobileEvidenceOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef<number>(0);

  // Polling with stop conditions for document processing status
  const startStatusPolling = useCallback((targetDocId: string) => {
    const POLL_INTERVAL_MS = 3000;
    const MAX_POLL_ATTEMPTS = 30;

    const executePoll = () => {
      pollingTimerRef.current = setTimeout(async () => {
        pollCountRef.current += 1;

        try {
          const statusRes = await documentsApi.getDocumentStatus(targetDocId);

          setDoc((prev) => (prev ? { ...prev, status: statusRes.status, stages: statusRes.stages, failureReason: statusRes.failureReason } : null));

          // Stop conditions:
          // 1. Ready & analyzed
          if (statusRes.status === 'ready') {
            const analysisData = await analysisApi.getDocumentAnalysis(targetDocId);
            setAnalysis(analysisData);
            return;
          }

          // 2. Failed
          if (statusRes.status === 'failed') {
            return;
          }

          // 3. Max attempts reached
          if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
            return;
          }

          executePoll();
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }, POLL_INTERVAL_MS);
    };

    executePoll();
  }, []);

  // Primary data loader
  const loadDocumentAndAnalysis = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const documentData = await documentsApi.getDocumentById(docId, controller.signal);
      setDoc(documentData);

      if (documentData.status === 'ready') {
        const analysisData = await analysisApi.getDocumentAnalysis(docId, controller.signal);
        setAnalysis(analysisData);
      } else {
        setAnalysis(null);
        if (documentData.status === 'processing') {
          pollCountRef.current = 0;
          startStatusPolling(docId);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Unable to retrieve statutory policy analysis.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [docId, startStatusPolling]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    documentsApi.getDocumentById(docId, controller.signal).then(
      async (documentData) => {
        if (!isMounted) return;
        setDoc(documentData);

        if (documentData.status === 'ready') {
          try {
            const analysisData = await analysisApi.getDocumentAnalysis(docId, controller.signal);
            if (isMounted) {
              setAnalysis(analysisData);
              setIsLoading(false);
            }
          } catch (err: any) {
            if (isMounted && err.name !== 'AbortError') {
              setError(err.message || 'Analysis record not available.');
              setIsLoading(false);
            }
          }
        } else {
          setAnalysis(null);
          setIsLoading(false);
          if (documentData.status === 'processing') {
            pollCountRef.current = 0;
            startStatusPolling(docId);
          }
        }
      },
      (err: any) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message || 'Failed to locate statutory document.');
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      controller.abort();
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [docId, startStatusPolling]);

  // Handler: [Analyze Document] POST trigger
  const handleTriggerAnalysis = async () => {
    if (!doc) return;
    setIsTriggeringAnalysis(true);
    setError(null);

    try {
      await analysisApi.triggerAnalysis(doc.id);
      // Refresh state to processing
      const updatedStatus = await documentsApi.getDocumentStatus(doc.id);
      setDoc((prev) => (prev ? { ...prev, status: updatedStatus.status, stages: updatedStatus.stages } : null));

      pollCountRef.current = 0;
      startStatusPolling(doc.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start statutory analysis pipeline.');
    } finally {
      setIsTriggeringAnalysis(false);
    }
  };

  // Handler: [Retry Pipeline] on failure
  const handleRetry = async () => {
    if (!doc) return;
    setIsRetrying(true);
    setError(null);

    try {
      await documentsApi.retryDocument(doc.id);
      await loadDocumentAndAnalysis();
    } catch (err: any) {
      setError(err.message || 'Retry pipeline execution failed.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Compile all citations across findings and metrics
  const allCitations: Evidence[] = React.useMemo(() => {
    if (!analysis) return [];
    const list: Evidence[] = [];
    const findings = analysis.findings || analysis.keyProvisions || [];
    findings.forEach((f) => {
      const cits = f.citations || f.evidence || [];
      list.push(...cits);
    });

    const insights = analysis.insights || analysis.risksAndGaps || [];
    insights.forEach((i) => {
      if (i.citations) list.push(...i.citations);
    });

    const metrics = analysis.extractedMetrics || [];
    metrics.forEach((m) => {
      if (m.citations) list.push(...m.citations);
    });

    // Deduplicate by citation id or quote
    const seen = new Set<string>();
    return list.filter((c) => {
      const key = c.id || c.excerptQuote;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [analysis]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <LoadingSpinner message="Retrieving statutory intelligence & source citations..." size={36} />
      </div>
    );
  }

  // Error state without document
  if (error && !doc) {
    return (
      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Button variant="ghost" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={handleBack}>
            Back to Document Library
          </Button>
        </div>
        <Alert variant="error" title="Analysis Lookup Error" id="analysis-error-alert">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>{error}</span>
            <Button variant="danger" size="sm" onClick={loadDocumentAndAnalysis}>
              Retry Loading
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!doc) return null;

  const isAnalyzed = doc.status === 'ready' && Boolean(analysis);
  const isProcessing = doc.status === 'processing' || isTriggeringAnalysis;
  const isFailed = doc.status === 'failed';
  const isUploadedOnly = doc.status === 'uploaded' && !isAnalyzed;

  return (
    <div
      className="container"
      style={{
        padding: '2rem 1.5rem 5rem 1.5rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
      data-testid="document-analysis-page"
    >
      {/* 1. Document Header */}
      <DocumentHeader
        document={doc}
        onBack={handleBack}
        modelVersion={analysis?.modelVersion}
        analyzedAt={analysis?.analyzedAt}
      />

      {/* Error Announcement if error occurred with document loaded */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="error" title="Analysis Pipeline Error" id="analysis-runtime-error">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span>{error}</span>
              <Button variant="danger" size="sm" onClick={loadDocumentAndAnalysis}>
                Retry
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* 2. RULE: Not Analyzed Yet -> Empty state with [Analyze Document] button */}
      {isUploadedOnly && (
        <EmptyState
          title="Statutory Analysis Pending"
          description={`"${doc.title}" has been ingested into the repository but has not yet undergone statutory synthesis and clause extraction.`}
          actionLabel="Analyze Document"
          onAction={handleTriggerAnalysis}
          icon={<Sparkles size={36} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />}
          id="not-analyzed-state"
        />
      )}

      {/* 3. RULE: Processing state showing ONLY real status and stages from the API */}
      {isProcessing && (
        <div
          className="card"
          style={{
            padding: '2rem',
            border: '1px solid var(--gov-warning-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--gov-warning-bg)',
            marginBottom: '2rem',
          }}
          data-testid="pipeline-processing-state"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Clock size={24} style={{ color: 'var(--gov-warning-text)' }} aria-hidden="true" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-warning-text)', margin: 0 }}>
              Statutory Synthesis Pipeline in Progress
            </h2>
          </div>

          <p style={{ fontSize: '0.9375rem', color: 'var(--gov-warning-text)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            The document is actively undergoing statutory extraction. Real-time pipeline stages from the backend:
          </p>

          {/* REAL Pipeline Stages from the API */}
          {doc.stages && doc.stages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px' }}>
              {doc.stages.map((stage) => {
                const isDone = stage.status === 'completed';
                const isRunning = stage.status === 'in_progress';

                return (
                  <div
                    key={stage.stage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isDone ? '#dcfce7' : isRunning ? '#fef3c7' : 'var(--gov-white)',
                      border: `1px solid ${isDone ? '#86efac' : isRunning ? '#fde68a' : 'var(--gov-slate-200)'}`,
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--gov-slate-900)' }}>{stage.label}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        fontSize: '0.75rem',
                        color: isDone ? '#15803d' : isRunning ? '#b45309' : 'var(--gov-slate-500)',
                      }}
                    >
                      {stage.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <LoadingSpinner message="Awaiting intelligence synthesizer output..." size={28} />
          )}
        </div>
      )}

      {/* 4. Failed Ingestion State */}
      {isFailed && (
        <div
          className="card"
          style={{
            padding: '2rem',
            border: '1px solid var(--gov-error-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--gov-error-bg)',
            marginBottom: '2rem',
          }}
          data-testid="pipeline-failed-state"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: 'var(--gov-error-text)' }} aria-hidden="true" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-error-text)', margin: 0 }}>
              Statutory Ingestion Pipeline Failed
            </h2>
          </div>

          <p style={{ fontSize: '0.9375rem', color: 'var(--gov-error-text)', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
            {doc.failureReason || 'An unexpected error occurred during PDF text extraction or semantic chunking.'}
          </p>

          <Button
            variant="danger"
            onClick={handleRetry}
            isLoading={isRetrying}
            loadingText="Restarting Ingestion..."
            icon={<RotateCcw size={15} aria-hidden="true" />}
          >
            Retry Extraction Pipeline
          </Button>
        </div>
      )}

      {/* 5. Analyzed Results (Results Screen) */}
      {isAnalyzed && analysis && (
        <div>
          {/* Analysis Tabs */}
          <AnalysisTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              findings: (analysis.findings || analysis.keyProvisions || []).length,
              insights: (analysis.insights || analysis.risksAndGaps || []).length,
              evidence: allCitations.length,
            }}
          />

          {/* Desktop Two-Column Layout + Mobile Inline Collapsible */}
          <div className="analysis-layout-grid">
            {/* Primary Analysis Column (Left) */}
            <main
              className="analysis-main-column"
              role="tabpanel"
              id={`analysis-panel-${activeTab}`}
              aria-labelledby={`analysis-tab-${activeTab}`}
              tabIndex={0}
            >
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} data-testid="overview-tab-content">
                  {analysis.executiveSummary && (
                    <section className="card-ai">
                      <span className="card-ai-badge">
                        <Sparkles size={12} aria-hidden="true" />
                        AI-generated interpretation
                      </span>
                      <h2 style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', margin: '0 0 0.5rem 0' }}>
                        Executive Summary
                      </h2>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-800)', lineHeight: 1.65, margin: 0 }}>
                        {analysis.executiveSummary}
                      </p>
                    </section>
                  )}

                  <KeyFindings
                    findings={analysis.findings || analysis.keyProvisions || []}
                    onSelectEvidence={(cit) => setSelectedEvidence(cit)}
                    selectedEvidenceId={selectedEvidence?.id}
                  />
                </div>
              )}

              {/* Tab 2: Summary */}
              {activeTab === 'summary' && (
                <SummaryPanel
                  analysis={analysis}
                  onSelectEvidence={(finding) => {
                    const cit = (finding.citations || finding.evidence)?.[0];
                    if (cit) setSelectedEvidence(cit);
                  }}
                />
              )}

              {/* Tab 3: Insights */}
              {activeTab === 'insights' && (
                <PolicyInsights
                  analysis={analysis}
                  onSelectEvidence={(cit) => setSelectedEvidence(cit)}
                />
              )}

              {/* Tab 4: Evidence */}
              {activeTab === 'evidence' && (
                <EvidencePanel
                  evidenceList={allCitations}
                  selectedEvidence={selectedEvidence}
                  onClearSelection={() => setSelectedEvidence(null)}
                  onViewSource={(cit) => setInspectSourceEvidence(cit)}
                />
              )}

              {/* Tab 5: Questions (Interactive Evidence-Grounded Q&A Launcher) */}
              {activeTab === 'questions' && (
                <div className="card" style={{ padding: '2rem' }} data-testid="questions-tab-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <HelpCircle size={22} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
                      Evidence-Grounded Policy Inquiries
                    </h2>
                  </div>
                  <p style={{ color: 'var(--gov-slate-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Query this document with exact statutory attribution and page excerpt citation grounding.
                  </p>
                  <Link to="/questions" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" icon={<HelpCircle size={15} aria-hidden="true" />}>
                      Launch Grounded Q&A Console
                    </Button>
                  </Link>
                </div>
              )}

              {/* Tab 6: Compare (Cross-Policy Matrix Launcher) */}
              {activeTab === 'compare' && (
                <div className="card" style={{ padding: '2rem' }} data-testid="compare-tab-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <GitCompare size={22} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
                      Cross-Policy Comparative Evaluation
                    </h2>
                  </div>
                  <p style={{ color: 'var(--gov-slate-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Evaluate statutory overlaps, conflicting mandates, and timeline synchronization against other policies.
                  </p>
                  <Link to="/compare" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" icon={<GitCompare size={15} aria-hidden="true" />}>
                      Compare Against Repository
                    </Button>
                  </Link>
                </div>
              )}

              {/* Tab 7: Research Brief (Executive Legislative Memorandum) */}
              {activeTab === 'brief' && (
                <div className="card" style={{ padding: '2rem' }} data-testid="brief-tab-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <BookOpen size={22} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
                      Parliamentary Policy Brief Dossier
                    </h2>
                  </div>
                  <p style={{ color: 'var(--gov-slate-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Generate, export, or print a publication-ready legislative memorandum with complete provenance.
                  </p>
                  <Link to="/research" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" icon={<BookOpen size={15} aria-hidden="true" />}>
                      Open Policy Brief Dossier
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Collapsible Evidence Section (visible on mobile only) */}
              <div className="mobile-evidence-collapsible">
                <button
                  type="button"
                  onClick={() => setIsMobileEvidenceOpen((prev) => !prev)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  aria-expanded={isMobileEvidenceOpen}
                  aria-controls="mobile-evidence-drawer"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>Contextual Source Evidence ({allCitations.length})</span>
                  </span>
                  {isMobileEvidenceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isMobileEvidenceOpen && (
                  <div id="mobile-evidence-drawer" style={{ marginTop: '1rem' }}>
                    <EvidencePanel
                      evidenceList={allCitations}
                      selectedEvidence={selectedEvidence}
                      onClearSelection={() => setSelectedEvidence(null)}
                      onViewSource={(cit) => setInspectSourceEvidence(cit)}
                      isSidePanel={true}
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <SourceReferences document={doc} citations={allCitations} />
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Contextual Evidence Side Panel (Desktop Sticky) */}
            <aside className="analysis-side-panel" aria-label="Contextual Evidence and Statutory Provenance">
              <EvidencePanel
                evidenceList={allCitations}
                selectedEvidence={selectedEvidence}
                onClearSelection={() => setSelectedEvidence(null)}
                onViewSource={(cit) => setInspectSourceEvidence(cit)}
                isSidePanel={true}
              />
              <SourceReferences document={doc} citations={allCitations} />
            </aside>
          </div>
        </div>
      )}

      {/* [View source] Full Text Inspection Modal */}
      {inspectSourceEvidence && (
        <Modal
          isOpen={Boolean(inspectSourceEvidence)}
          onClose={() => setInspectSourceEvidence(null)}
          title="Statutory Source Text Verification"
          id="view-source-modal"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontSize: '0.8125rem', fontWeight: 600 }}>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Verifiable Official Source Attribution</span>
            </div>

            <div className="card-evidence" style={{ margin: 0 }}>
              <blockquote className="evidence-quote" style={{ fontSize: '1rem', lineHeight: 1.7 }}>
                "{inspectSourceEvidence.excerptQuote}"
              </blockquote>
            </div>

            <div
              style={{
                backgroundColor: 'var(--gov-slate-50)',
                border: '1px solid var(--gov-slate-200)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Document:</strong> {inspectSourceEvidence.documentTitle || doc.title}
              </div>
              {inspectSourceEvidence.pageNumber !== undefined && (
                <div>
                  <strong>Official Gazette Page:</strong> Page {inspectSourceEvidence.pageNumber}
                </div>
              )}
              {inspectSourceEvidence.sectionHeading && (
                <div>
                  <strong>Section / Chapter:</strong> {inspectSourceEvidence.sectionHeading}
                </div>
              )}
              {inspectSourceEvidence.paragraphNumber !== undefined && (
                <div>
                  <strong>Paragraph:</strong> Paragraph {inspectSourceEvidence.paragraphNumber}
                </div>
              )}
              {inspectSourceEvidence.confidenceScore !== undefined && (
                <div>
                  <strong>Extraction Confidence:</strong> {(inspectSourceEvidence.confidenceScore * 100).toFixed(0)}%
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="primary" onClick={() => setInspectSourceEvidence(null)}>
                Close Source Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DocumentAnalysisPage;
