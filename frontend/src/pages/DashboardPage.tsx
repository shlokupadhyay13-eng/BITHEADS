import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, RotateCcw, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { Document } from '../types';
import { documentsApi } from '../services/api/documentsApi';
import { StatisticsGrid } from '../components/dashboard/StatisticsGrid';
import { RecentDocuments } from '../components/dashboard/RecentDocuments';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ActivityPanel } from '../components/dashboard/ActivityPanel';
import { UploadModal } from '../components/documents/UploadModal';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const docs = await documentsApi.listDocuments(undefined, controller.signal);
      setDocuments(docs);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Unable to retrieve workspace data from the intelligence service.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    documentsApi.listDocuments(undefined, controller.signal).then(
      (docs) => {
        if (isMounted) {
          setDocuments(docs);
          setIsLoading(false);
        }
      },
      (err) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message || 'Unable to retrieve workspace data from the intelligence service.');
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleRetryPipeline = async (docId: string) => {
    setRetryingDocId(docId);
    try {
      await documentsApi.retryDocument(docId);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Pipeline restart failed: ${err.message}`);
    } finally {
      setRetryingDocId(null);
    }
  };

  const handleUploadSuccess = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
  };

  // Metrics computation from real API state
  const totalDocuments = documents.length;
  const recentAnalyses = documents.filter(
    (d) => d.status === 'ready' || (d.status as string) === 'analyzed'
  ).length;

  // Most recent 4 documents sorted by uploadedAt or publicationDate
  const recentDocs = [...documents]
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.publicationDate || 0).getTime();
      const dateB = new Date(b.uploadedAt || b.publicationDate || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div
      className="container"
      style={{
        padding: '2rem 1.5rem 3.5rem 1.5rem',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
      data-testid="dashboard-page"
    >
      {/* Institutional Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--gov-navy-950)',
          color: 'var(--gov-white)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255,255,255,0.12)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              color: 'var(--gov-slate-200)',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#86efac' }} aria-hidden="true" />
            Statutory Intelligence Environment
          </div>

          <h1
            style={{
              color: 'var(--gov-white)',
              fontSize: '1.875rem',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.3,
            }}
          >
            Welcome, {user?.name || user?.email || 'Policy Analyst'}
          </h1>

          <p style={{ color: 'var(--gov-slate-300)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Unified analytical console answering: <em>What is happening in my research workspace?</em> Monitor
            automated statutory ingestion, check verified policy extractions, and synthesize legislative briefs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} aria-hidden="true" />}
            onClick={loadDashboardData}
            disabled={isLoading}
            aria-label="Refresh workspace metrics"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Error state with accessible Retry */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="error" title="Workspace Data Error" id="dashboard-error-alert">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>{error}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={loadDashboardData}
                icon={<RotateCcw size={14} aria-hidden="true" />}
              >
                Retry Request
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* 1. Statistics Grid (Live API metrics + clearly marked demo metrics) */}
      <StatisticsGrid
        metrics={{
          totalDocuments,
          recentAnalyses,
          questionsAsked: 2,
          researchBriefs: 1,
        }}
        isLoading={isLoading}
      />

      {/* 2. Quick Actions Bar */}
      <QuickActions onUploadClick={() => setIsUploadModalOpen(true)} />

      {/* 3. Main Workspace Grid: Recent Documents + Real Activity Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Left Col: Recent Ingested Documents */}
        <div style={{ flex: '1 1 500px' }}>
          <RecentDocuments
            documents={recentDocs}
            isLoading={isLoading}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onRetryPipeline={handleRetryPipeline}
            retryingDocId={retryingDocId}
          />
        </div>

        {/* Right Col: Genuine Activity Panel */}
        <div style={{ flex: '1 1 360px' }}>
          <ActivityPanel documents={documents} isLoading={isLoading} />
        </div>
      </div>

      {/* Upload Policy Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        existingDocuments={documents}
      />
    </div>
  );
};

export default DashboardPage;
