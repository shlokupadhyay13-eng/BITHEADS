import React from 'react';
import { GitCompare, AlertCircle } from 'lucide-react';
import type { Document } from '../../types';
import { COMPARISON_CRITERIA } from '../../constants/comparisonCriteria';
import { Button } from '../common/Button';

interface ComparisonWorkflowFormProps {
  documents: Document[];
  docAId: string;
  docBId: string;
  selectedCriteria: string[];
  onDocAChange: (id: string) => void;
  onDocBChange: (id: string) => void;
  onToggleCriterion: (id: string) => void;
  onSelectAllCriteria: () => void;
  onClearCriteria: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const ComparisonWorkflowForm: React.FC<ComparisonWorkflowFormProps> = ({
  documents,
  docAId,
  docBId,
  selectedCriteria,
  onDocAChange,
  onDocBChange,
  onToggleCriterion,
  onSelectAllCriteria,
  onClearCriteria,
  onSubmit,
  isLoading,
}) => {
  const isSameDoc = docAId && docBId && docAId === docBId;
  const isFormValid = docAId && docBId && !isSameDoc && selectedCriteria.length > 0;

  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: '0 0 1.25rem 0' }}>
        Step-by-Step Comparative Workflow
      </h2>

      {/* Step 1 & Step 2: Document Selection */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Step 1: Document A */}
        <div>
          <label
            htmlFor="doc-a-selector"
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: 'var(--gov-navy-950)',
              marginBottom: '0.5rem',
            }}
          >
            Step 1: Select Document A <span style={{ color: 'var(--gov-error-text)' }}>*</span>
          </label>
          <select
            id="doc-a-selector"
            className="form-select"
            value={docAId}
            onChange={(e) => onDocAChange(e.target.value)}
            disabled={isLoading}
            style={{ width: '100%' }}
            required
          >
            <option value="">-- Choose first policy document --</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Document B */}
        <div>
          <label
            htmlFor="doc-b-selector"
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: 'var(--gov-navy-950)',
              marginBottom: '0.5rem',
            }}
          >
            Step 2: Select Document B (cannot equal A) <span style={{ color: 'var(--gov-error-text)' }}>*</span>
          </label>
          <select
            id="doc-b-selector"
            className="form-select"
            value={docBId}
            onChange={(e) => onDocBChange(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              borderColor: isSameDoc ? 'var(--gov-error-border)' : undefined,
            }}
            required
          >
            <option value="">-- Choose second policy document --</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id} disabled={d.id === docAId}>
                {d.title} {d.id === docAId ? '(Selected as Document A)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Error if A equals B */}
      {isSameDoc && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--gov-error-bg)',
            border: '1px solid var(--gov-error-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--gov-error-text)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={16} aria-hidden="true" />
          <span>Validation Error: Document B cannot be the same as Document A. Please select a distinct statutory record.</span>
        </div>
      )}

      {/* Step 3: Choose Criteria */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gov-navy-950)' }}>
              Step 3: Choose Comparison Criteria
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-600)', marginLeft: '0.5rem' }}>
              ({selectedCriteria.length} of {COMPARISON_CRITERIA.length} selected)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onSelectAllCriteria}>
              Select All
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClearCriteria}>
              Clear
            </Button>
          </div>
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Comparison Criteria Selection</legend>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {COMPARISON_CRITERIA.map((criterion) => {
              const isSelected = selectedCriteria.includes(criterion.id);
              return (
                <label
                  key={criterion.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--gov-navy-800)' : 'var(--gov-slate-200)'}`,
                    backgroundColor: isSelected ? 'var(--gov-navy-50)' : 'var(--gov-white)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCriterion(criterion.id)}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--gov-navy-900)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gov-navy-950)' }}>
                      {criterion.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-600)', marginTop: '0.15rem' }}>
                      {criterion.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {selectedCriteria.length === 0 && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--gov-warning-text)', marginTop: '0.5rem' }}>
            Please select at least one statutory criterion to perform comparison.
          </p>
        )}
      </div>

      {/* Step 4: Compare Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Generating Comparative Matrix..."
          disabled={!isFormValid}
          icon={<GitCompare size={16} aria-hidden="true" />}
        >
          Compare
        </Button>
      </div>
    </form>
  );
};
