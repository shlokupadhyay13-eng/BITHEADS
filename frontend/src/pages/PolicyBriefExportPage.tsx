import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, RotateCcw, ArrowLeft } from 'lucide-react';
import { researchApi } from '../services/api/researchApi';
import { documentsApi } from '../services/api/documentsApi';
import type { ResearchBrief, Document } from '../types';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BriefGenerateForm } from '../components/brief/BriefGenerateForm';
import { ResearchBriefView } from '../components/brief/ResearchBriefView';

export const PolicyBriefExportPage: React.FC = () => {
  const { briefId } = useParams<{ briefId?: string }>();
  const navigate = useNavigate();

  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ready documents for the generation form
  useEffect(() => {
    let isMounted = true;
    documentsApi
      .listDocuments()
      .then((docs) => {
        if (!isMounted) return;
        const readyDocs = docs.filter((d) => d.status === 'ready');
        setDocuments(readyDocs);
      })
      .catch(() => {
        // Continue gracefully
      })
      .finally(() => {
        if (isMounted) setIsLoadingDocs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch brief if briefId is provided
  const loadBrief = useCallback(async (id: string) => {
    setIsLoadingBrief(true);
    setError(null);
    try {
      const data = await researchApi.getResearchBrief(id);
      setBrief(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : `Failed to load policy brief "${id}".`;
      setError(msg);
      setBrief(null);
    } finally {
      setIsLoadingBrief(false);
    }
  }, []);

  useEffect(() => {
    const targetId = briefId || 'brief-001';
    let isMounted = true;

    researchApi
      .getResearchBrief(targetId)
      .then((data) => {
        if (isMounted) {
          setBrief(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (briefId) {
            const msg =
              err && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : `Failed to load policy brief "${targetId}".`;
            setError(msg);
          }
          setBrief(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingBrief(false);
      });

    return () => {
      isMounted = false;
    };
  }, [briefId]);

  const handleGenerateBrief = async (data: { documentIds: string[]; topic: string }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const createdBrief = await researchApi.generateResearchBrief(data);
      setBrief(createdBrief);
      // Navigate to the newly generated brief view
      navigate(`/research-brief/${createdBrief.id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to generate policy research brief.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        {briefId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/research')}
            icon={<ArrowLeft size={14} aria-hidden="true" />}
            style={{ marginBottom: '0.75rem', paddingLeft: 0 }}
          >
            Create New Brief
          </Button>
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
            <BookOpen size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--gov-navy-950)' }}>
              Legislative Policy Brief & Research Dossier
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', margin: '0.25rem 0 0 0' }}>
              Standard executive memorandum formatted for statutory committee review and legislative analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div style={{ marginBottom: '2rem' }}>
          <Alert variant="error" title="Brief Operation Error" onDismiss={() => setError(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>{error}</div>
              {briefId && (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => loadBrief(briefId)}
                    icon={<RotateCcw size={14} aria-hidden="true" />}
                  >
                    Retry Loading Brief
                  </Button>
                </div>
              )}
            </div>
          </Alert>
        </div>
      )}

      {/* Generate Form (Show if not locked on a specific brief, or as generator) */}
      {!briefId && !isLoadingDocs && (
        <BriefGenerateForm
          documents={documents}
          onGenerate={handleGenerateBrief}
          isLoading={isGenerating}
        />
      )}

      {/* Loading States */}
      {(isLoadingBrief || isGenerating) && (
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
            message={
              isGenerating
                ? 'Synthesizing legislative memorandum and verifying statutory provisions...'
                : 'Retrieving official policy research brief...'
            }
          />
        </div>
      )}

      {/* Brief Dossier View */}
      {brief && !isLoadingBrief && !isGenerating && (
        <ResearchBriefView brief={brief} />
      )}
    </div>
  );
};

export default PolicyBriefExportPage;
