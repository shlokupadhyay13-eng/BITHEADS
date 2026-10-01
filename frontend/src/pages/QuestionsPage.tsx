import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HelpCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { questionsApi } from '../services/api/questionsApi';
import { documentsApi } from '../services/api/documentsApi';
import type { QuestionResponse, Document } from '../types';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ResearchQuestionForm } from '../components/qa/ResearchQuestionForm';
import { QuestionResultView } from '../components/qa/QuestionResultView';

export const QuestionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('documentId') || '';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(docIdParam);
  const [question, setQuestion] = useState<string>('');
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState<string>('');
  const [result, setResult] = useState<QuestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available ready documents for the selector
  useEffect(() => {
    let isMounted = true;
    documentsApi.listDocuments().then((docs) => {
      if (isMounted) {
        const readyDocs = docs.filter((d) => d.status === 'ready');
        setDocuments(readyDocs);
        if (docIdParam) {
          setSelectedDocumentId(docIdParam);
        }
      }
    }).catch(() => {
      // Gracefully continue with empty document list if fetch fails
    });

    return () => {
      isMounted = false;
    };
  }, [docIdParam]);

  const executeQuestion = useCallback(async (queryText: string, docId: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setError(null);
    setLastSubmittedQuestion(queryText.trim());

    try {
      const response = await questionsApi.askQuestion({
        question: queryText.trim(),
        documentIds: docId ? [docId] : undefined,
        scope: docId ? 'single_document' : 'corpus',
      });
      setResult(response);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to synthesize statutory policy answer.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuestion(question, selectedDocumentId);
  };

  const handleRetry = () => {
    if (lastSubmittedQuestion) {
      executeQuestion(lastSubmittedQuestion, selectedDocumentId);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        {docIdParam && (
          <Link
            to={`/insights/${docIdParam}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8125rem',
              color: 'var(--gov-navy-800)',
              textDecoration: 'none',
              marginBottom: '0.75rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Document Analysis
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--gov-navy-950)',
              color: 'var(--gov-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <HelpCircle size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--gov-navy-950)' }}>
              Evidence-Grounded Policy Q&A
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', margin: '0.25rem 0 0 0' }}>
              Statutory Research Engine backed by verifiable page excerpts and zero-hallucination guarantees.
            </p>
          </div>
        </div>
      </div>

      {/* Research Question Form */}
      <ResearchQuestionForm
        question={question}
        onQuestionChange={setQuestion}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={setSelectedDocumentId}
        isInDocumentContext={Boolean(docIdParam)}
      />

      {/* Loading State with clear explanation of what is happening */}
      {isLoading && (
        <div
          className="card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--gov-slate-50)',
            marginBottom: '2rem',
          }}
          role="status"
          aria-live="polite"
        >
          <LoadingSpinner
            size={36}
            message="Retrieving statutory context and synthesizing evidence-grounded answer..."
          />
        </div>
      )}

      {/* Error State with Retry Button */}
      {error && !isLoading && (
        <div style={{ marginBottom: '2rem' }}>
          <Alert variant="error" title="Query Processing Error">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>{error}</div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRetry}
                  icon={<RotateCcw size={14} aria-hidden="true" />}
                >
                  Retry Query
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Empty State when no query submitted yet */}
      {!result && !isLoading && !error && (
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--gov-white)',
            border: '1px dashed var(--gov-slate-300)',
          }}
          data-testid="qa-empty-state"
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--gov-slate-100)',
              color: 'var(--gov-slate-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
            aria-hidden="true"
          >
            <HelpCircle size={24} />
          </div>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', marginBottom: '0.5rem' }}>
            Ask your first research question about this document.
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', maxWidth: '520px', margin: '0 auto' }}>
            Enter your question above to query statutory obligations, compliance mandates, penalty matrices, or timelines with page-grounded citations.
          </p>
        </div>
      )}

      {/* Results View */}
      {result && !isLoading && (
        <QuestionResultView result={result} />
      )}
    </div>
  );
};

export default QuestionsPage;
