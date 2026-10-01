import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitCompare, RotateCcw } from 'lucide-react';
import { documentsApi } from '../services/api/documentsApi';
import { comparisonApi } from '../services/api/comparisonApi';
import type { Document, Comparison } from '../types';
import { COMPARISON_CRITERIA } from '../constants/comparisonCriteria';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ComparisonWorkflowForm } from '../components/compare/ComparisonWorkflowForm';
import { ComparisonResultsView } from '../components/compare/ComparisonResultsView';

export const CrossPolicyComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docAParam = searchParams.get('docA') || '';
  const docBParam = searchParams.get('docB') || '';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docAId, setDocAId] = useState<string>(docAParam);
  const [docBId, setDocBId] = useState<string>(docBParam);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(
    COMPARISON_CRITERIA.map((c) => c.id)
  );

  const [result, setResult] = useState<Comparison | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ready documents
  useEffect(() => {
    let isMounted = true;
    documentsApi
      .listDocuments()
      .then((docs) => {
        if (!isMounted) return;
        const readyDocs = docs.filter((d) => d.status === 'ready');
        setDocuments(readyDocs);

        if (!docAId && readyDocs.length > 0) {
          setDocAId(readyDocs[0].id);
        }
        if (!docBId && readyDocs.length > 1) {
          setDocBId(readyDocs[1].id);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to retrieve documents for comparison.';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDocs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [docAId, docBId]);

  const handleToggleCriterion = (criterionId: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterionId) ? prev.filter((id) => id !== criterionId) : [...prev, criterionId]
    );
  };

  const handleSelectAllCriteria = () => {
    setSelectedCriteria(COMPARISON_CRITERIA.map((c) => c.id));
  };

  const handleClearCriteria = () => {
    setSelectedCriteria([]);
  };

  const executeComparison = useCallback(async () => {
    if (!docAId || !docBId) {
      setError('Please select both Document A and Document B.');
      return;
    }

    if (docAId === docBId) {
      setError('Document A and Document B cannot be the same document.');
      return;
    }

    if (selectedCriteria.length === 0) {
      setError('Please select at least one statutory criterion for comparison.');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const data = await comparisonApi.comparePolicies({
        documentIds: [docAId, docBId],
        documentIdA: docAId,
        documentIdB: docBId,
        criteria: selectedCriteria,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Cross-policy comparison failed.';
      setError(msg);
    } finally {
      setIsComparing(false);
    }
  }, [docAId, docBId, selectedCriteria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeComparison();
  };

  const docA = documents.find((d) => d.id === docAId);
  const docB = documents.find((d) => d.id === docBId);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
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
          <GitCompare size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--gov-navy-950)' }}>
            Cross-Policy Matrix & Comparative Research
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', margin: '0.25rem 0 0 0' }}>
            Structured criterion-by-criterion statutory comparison with zero-fabrication standards.
          </p>
        </div>
      </div>

      {/* Loading Documents Skeleton / Spinner */}
      {isLoadingDocs && (
        <div style={{ marginBottom: '1.5rem' }}>
          <LoadingSpinner message="Cataloguing analyzed statutory policies..." size={24} />
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="error" title="Comparison Error" onDismiss={() => setError(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>{error}</div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={executeComparison}
                  icon={<RotateCcw size={14} aria-hidden="true" />}
                >
                  Retry Comparison
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Workflow Form */}
      {!isLoadingDocs && (
        <ComparisonWorkflowForm
          documents={documents}
          docAId={docAId}
          docBId={docBId}
          selectedCriteria={selectedCriteria}
          onDocAChange={setDocAId}
          onDocBChange={setDocBId}
          onToggleCriterion={handleToggleCriterion}
          onSelectAllCriteria={handleSelectAllCriteria}
          onClearCriteria={handleClearCriteria}
          onSubmit={handleSubmit}
          isLoading={isComparing}
        />
      )}

      {/* Loading Comparison State */}
      {isComparing && (
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
            message="Synthesizing multi-criterion statutory comparison and verifying citations..."
          />
        </div>
      )}

      {/* Results View */}
      {result && !isComparing && (
        <ComparisonResultsView
          comparison={result}
          docA={docA}
          docB={docB}
        />
      )}
    </div>
  );
};

export default CrossPolicyComparePage;
