import React from 'react';
import { Search, FileText } from 'lucide-react';
import type { Document } from '../../types';
import { Button } from '../common/Button';

interface ResearchQuestionFormProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  documents: Document[];
  selectedDocumentId: string;
  onSelectDocument: (docId: string) => void;
  isInDocumentContext?: boolean;
}

export const ResearchQuestionForm: React.FC<ResearchQuestionFormProps> = ({
  question,
  onQuestionChange,
  onSubmit,
  isLoading,
  documents,
  selectedDocumentId,
  onSelectDocument,
  isInDocumentContext = false,
}) => {
  const currentDoc = documents.find((d) => d.id === selectedDocumentId);

  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Document Selector if not already locked in a single document context */}
      {!isInDocumentContext ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="qa-document-selector"
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--gov-navy-950)',
              marginBottom: '0.375rem',
            }}
          >
            Target Policy Document:
          </label>
          <select
            id="qa-document-selector"
            className="form-select"
            value={selectedDocumentId}
            onChange={(e) => onSelectDocument(e.target.value)}
            disabled={isLoading}
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <option value="">All catalogued policies (Corpus-wide search)</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} {doc.issuingMinistry ? `(${doc.issuingMinistry})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--gov-slate-100)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            color: 'var(--gov-navy-950)',
          }}
        >
          <FileText size={16} aria-hidden="true" style={{ color: 'var(--gov-navy-800)', flexShrink: 0 }} />
          <span>
            Document Context: <strong>{currentDoc?.title || selectedDocumentId}</strong>
          </span>
        </div>
      )}

      {/* Research Question Textarea */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="research-question"
          style={{
            display: 'block',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--gov-navy-950)',
            marginBottom: '0.5rem',
          }}
        >
          Research question
        </label>
        <textarea
          id="research-question"
          name="researchQuestion"
          rows={3}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Enter statutory research question (e.g., What are the enforcement penalties and compliance grace periods for entities?)..."
          className="gov-input"
          style={{
            width: '100%',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
          }}
          disabled={isLoading}
          required
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Synthesizing..."
          disabled={!question.trim()}
          icon={<Search size={16} aria-hidden="true" />}
        >
          Ask Question
        </Button>
      </div>
    </form>
  );
};
