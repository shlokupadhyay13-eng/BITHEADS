import React, { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import type { Document } from '../../types';
import { Button } from '../common/Button';

interface BriefGenerateFormProps {
  documents: Document[];
  onGenerate: (data: { documentIds: string[]; topic: string }) => Promise<void>;
  isLoading: boolean;
}

export const BriefGenerateForm: React.FC<BriefGenerateFormProps> = ({
  documents,
  onGenerate,
  isLoading,
}) => {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() =>
    documents.length > 0 ? [documents[0].id] : []
  );
  const [topic, setTopic] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleToggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocIds(documents.map((d) => d.id));
  };

  const handleClearAll = () => {
    setSelectedDocIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) {
      setValidationError('Please select at least one policy document for the brief.');
      return;
    }
    if (!topic.trim()) {
      setValidationError('Please enter a research inquiry topic or scope.');
      return;
    }

    setValidationError(null);
    await onGenerate({ documentIds: selectedDocIds, topic: topic.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Sparkles size={20} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
          Generate Legislative Policy Brief
        </h2>
      </div>

      {validationError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--gov-error-bg)',
            border: '1px solid var(--gov-error-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--gov-error-text)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {validationError}
        </div>
      )}

      {/* Step 1: Select Catalogued Documents */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gov-navy-950)' }}>
            1. Source Documents ({selectedDocIds.length} selected) <span style={{ color: 'var(--gov-error-text)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleClearAll}>
              Clear
            </Button>
          </div>
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Select Source Documents for Research Brief</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
            {documents.map((doc) => {
              const isChecked = selectedDocIds.includes(doc.id);
              return (
                <label
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isChecked ? 'var(--gov-navy-800)' : 'var(--gov-slate-200)'}`,
                    backgroundColor: isChecked ? 'var(--gov-navy-50)' : 'var(--gov-white)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleDoc(doc.id)}
                    style={{ accentColor: 'var(--gov-navy-900)' }}
                  />
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-navy-950)', fontWeight: 600 }}>
                    {doc.title}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Step 2: Inquiry Topic Textarea */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="brief-topic"
          style={{
            display: 'block',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--gov-navy-950)',
            marginBottom: '0.5rem',
          }}
        >
          2. Research Topic / Legislative Scope <span style={{ color: 'var(--gov-error-text)' }}>*</span>
        </label>
        <textarea
          id="brief-topic"
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Evaluation of domestic manufacturing mandates, subsidy disbursal schedules, and interstate transmission surcharges..."
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
          loadingText="Generating Brief..."
          disabled={selectedDocIds.length === 0 || !topic.trim()}
          icon={<BookOpen size={16} aria-hidden="true" />}
        >
          Generate Research Brief
        </Button>
      </div>
    </form>
  );
};
