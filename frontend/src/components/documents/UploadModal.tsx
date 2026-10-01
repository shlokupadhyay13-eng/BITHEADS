import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { PolicyCategory, Document, DocumentStatus, ProcessingStage } from '../../types';
import { documentsApi } from '../../services/api/documentsApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { formatFileSize } from '../../utils/formatters';
import {
  validateUploadFile,
  validateUploadMetadata,
} from '../../utils/uploadValidation';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: Document) => void;
  existingDocuments?: Document[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  existingDocuments = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [issuingMinistry, setIssuingMinistry] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('environmental');
  const [publicationDate, setPublicationDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form states
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Upload & Pipeline Lifecycle
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [pipelineDoc, setPipelineDoc] = useState<Document | null>(null);
  const [pipelineStages, setPipelineStages] = useState<ProcessingStage[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<DocumentStatus | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingCountRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setFile(null);
    setTitle('');
    setIssuingMinistry('');
    setCategory('environmental');
    setPublicationDate(new Date().toISOString().split('T')[0]);
    setValidationErrors({});
    setDuplicateWarning(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('');
    setPipelineDoc(null);
    setPipelineStages([]);
    setPipelineStatus(null);
    setApiError(null);
    setLiveAnnouncement('');
    pollingCountRef.current = 0;
  }, []);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  }, [isUploading, resetForm, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, []);

  // Duplicate document detection (UX helper)
  const checkForDuplicates = (checkTitle: string, currentFile: File | null) => {
    if (!checkTitle && !currentFile) {
      setDuplicateWarning(null);
      return;
    }
    const cleanTitle = checkTitle.trim().toLowerCase();
    const cleanFileName = currentFile?.name.toLowerCase();

    const duplicate = existingDocuments.find((d) => {
      const matchTitle = cleanTitle && d.title.toLowerCase() === cleanTitle;
      const matchFile = cleanFileName && d.fileUrl?.toLowerCase().endsWith(cleanFileName);
      return matchTitle || matchFile;
    });

    if (duplicate) {
      setDuplicateWarning(
        `Notice: A document titled "${duplicate.title}" already exists in the workspace. Uploading duplicates may result in verification conflicts.`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validation = validateUploadFile(selectedFile);
    if (!validation.isValid) {
      setValidationErrors((prev) => ({ ...prev, file: validation.error || 'Invalid file.' }));
      setFile(null);
      setLiveAnnouncement(validation.error || 'Invalid file selected.');
      return;
    }

    setFile(selectedFile);
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    setLiveAnnouncement(`Selected file: ${selectedFile.name}, size ${formatFileSize(selectedFile.size)}.`);

    // Auto-populate title if blank
    if (!title.trim()) {
      const suggestedTitle = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(suggestedTitle);
      checkForDuplicates(suggestedTitle, selectedFile);
    } else {
      checkForDuplicates(title, selectedFile);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Polling with sane interval and stop conditions
  const startProcessingStatusPolling = useCallback((docId: string) => {
    const POLL_INTERVAL_MS = 3000;
    const MAX_POLL_ATTEMPTS = 30;

    const executePoll = () => {
      pollingTimerRef.current = setTimeout(async () => {
        pollingCountRef.current += 1;

        try {
          const statusRes = await documentsApi.getDocumentStatus(docId);
          setPipelineStatus(statusRes.status);
          setPipelineStages(statusRes.stages);

          // Stop conditions:
          // 1. Backend confirms 'ready'
          if (statusRes.status === 'ready') {
            setLiveAnnouncement('Document processing pipeline completed successfully. Ready for analysis.');
            return;
          }

          // 2. Ingestion pipeline failed
          if (statusRes.status === 'failed') {
            setLiveAnnouncement(
              `Document processing failed: ${statusRes.failureReason || 'Pipeline error encountered.'}`
            );
            setApiError(statusRes.failureReason || 'Document processing failed in the statutory pipeline.');
            return;
          }

          // 3. Max timeout reached
          if (pollingCountRef.current >= MAX_POLL_ATTEMPTS) {
            setLiveAnnouncement('Document upload saved. Pipeline processing continues asynchronously.');
            return;
          }

          // Otherwise keep polling
          executePoll();
        } catch (err: any) {
          if (err.isTimeout || err.name === 'AbortError') return;
        }
      }, POLL_INTERVAL_MS);
    };

    executePoll();
  }, []);

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('Upload cancelled by user.');
    setLiveAnnouncement('Upload cancelled by user.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // 1. Validate file
    const fileValidation = validateUploadFile(file);
    // 2. Validate metadata
    const metadataErrors = validateUploadMetadata({
      title,
      issuingMinistry,
      publicationDate,
    });

    const combinedErrors: Record<string, string> = { ...metadataErrors };
    if (!fileValidation.isValid) {
      combinedErrors.file = fileValidation.error || 'Invalid file.';
    }

    if (Object.keys(combinedErrors).length > 0) {
      setValidationErrors(combinedErrors);
      setLiveAnnouncement('Please resolve the highlighted validation errors before uploading.');
      return;
    }

    if (!file) return;

    // Start upload
    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Preparing statutory payload and computing checksum...');
    setLiveAnnouncement('Starting document ingestion pipeline.');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setUploadProgress(45);
      setUploadStatusText('Uploading binary to secure government repository...');

      const newDoc = await documentsApi.uploadDocument(
        file,
        {
          title: title.trim(),
          issuingMinistry: issuingMinistry.trim(),
          category,
          publicationDate,
        },
        controller.signal
      );

      setUploadProgress(100);
      setUploadStatusText('Binary uploaded successfully. Registered with pipeline.');
      setPipelineDoc(newDoc);
      setPipelineStatus(newDoc.status);
      setPipelineStages(newDoc.stages || []);
      setLiveAnnouncement(`Upload complete. Pipeline status: ${newDoc.status}.`);

      onUploadSuccess(newDoc);

      // Never say "analyzed" unless the backend confirms status is ready!
      // Poll document status if backend requires it
      if (newDoc.status !== 'ready' && newDoc.status !== 'failed') {
        pollingCountRef.current = 0;
        startProcessingStatusPolling(newDoc.id);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.isTimeout) {
        setUploadStatusText('Upload was cancelled.');
        setLiveAnnouncement('Upload cancelled.');
      } else {
        const errorMsg = err.message || 'Statutory document upload failed. Please try again.';
        setApiError(errorMsg);
        setLiveAnnouncement(`Upload failed: ${errorMsg}`);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ingest Statutory Policy Document"
      id="upload-policy-modal"
      maxWidth="680px"
    >
      {/* Screen Reader Live Region for status & announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="upload-aria-live"
      >
        {liveAnnouncement}
      </div>

      {apiError && (
        <Alert variant="error" title="Ingestion Error" id="upload-api-error">
          {apiError}
        </Alert>
      )}

      {duplicateWarning && (
        <Alert variant="warning" title="Duplicate Notice" id="upload-duplicate-warning">
          {duplicateWarning}
        </Alert>
      )}

      {/* When upload pipeline is actively running or completed */}
      {pipelineDoc ? (
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--gov-slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gov-slate-200)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {pipelineStatus === 'ready' ? (
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} aria-hidden="true" />
              ) : pipelineStatus === 'failed' ? (
                <AlertTriangle size={20} style={{ color: '#dc2626' }} aria-hidden="true" />
              ) : (
                <Clock size={20} style={{ color: '#d97706' }} aria-hidden="true" />
              )}
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--gov-navy-950)' }}>
                {pipelineStatus === 'ready'
                  ? 'Ingestion & Verification Complete'
                  : pipelineStatus === 'failed'
                  ? 'Pipeline Extraction Failed'
                  : 'Asynchronous Ingestion Pipeline in Progress'}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gov-slate-700)' }}>
              Document: <strong>{pipelineDoc.title}</strong>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--gov-slate-500)' }}>
              {/* Never say analyzed unless confirmed */}
              {pipelineStatus === 'ready'
                ? 'Backend confirmed policy verification. Document is synthesized and ready for analysis.'
                : pipelineStatus === 'failed'
                ? 'An error occurred during statutory extraction. You may retry from the document library.'
                : 'OCR, text extraction, semantic chunking, and vector indexing are underway.'}
            </p>
          </div>

          {/* Pipeline Stages Progress */}
          {pipelineStages.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gov-slate-700)', marginBottom: '0.75rem' }}>
                Pipeline Verification Stages
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pipelineStages.map((stage) => (
                  <div
                    key={stage.stage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        stage.status === 'completed'
                          ? 'var(--gov-success-bg)'
                          : stage.status === 'in_progress'
                          ? 'var(--gov-warning-bg)'
                          : stage.status === 'failed'
                          ? 'var(--gov-error-bg)'
                          : 'var(--gov-slate-100)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--gov-slate-900)' }}>{stage.label}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color:
                          stage.status === 'completed'
                            ? 'var(--gov-success-text)'
                            : stage.status === 'in_progress'
                            ? 'var(--gov-warning-text)'
                            : stage.status === 'failed'
                            ? 'var(--gov-error-text)'
                            : 'var(--gov-slate-600)',
                      }}
                    >
                      {stage.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              onClick={resetForm}
              icon={<RotateCcw size={14} aria-hidden="true" />}
            >
              Upload Another
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done & Return to Library
            </Button>
          </div>
        </div>
      ) : (
        /* Upload Intake Form */
        <form onSubmit={handleSubmit} noValidate>
          {/* Drag & Drop File Intake Zone */}
          <div className="form-group">
            <label id="dropzone-label" className="form-label">
              Statutory File (PDF / DOCX / TXT) <span className="required">*</span>
            </label>

            <div
              className={`file-dropzone ${isDragging ? 'is-dragging' : ''} ${
                validationErrors.file ? 'has-error' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-labelledby="dropzone-label"
              aria-describedby="file-specs-hint"
              data-testid="file-dropzone"
            >
              <input
                ref={fileInputRef}
                id="file-input-control"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--gov-navy-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gov-navy-900)',
                  }}
                  aria-hidden="true"
                >
                  <UploadCloud size={24} />
                </div>

                <div style={{ fontWeight: 600, color: 'var(--gov-navy-950)', fontSize: '0.9375rem' }}>
                  {isDragging ? 'Drop policy file here' : 'Drag & drop statutory file here, or click to browse'}
                </div>

                <div id="file-specs-hint" style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-500)' }}>
                  Supported formats: <strong>PDF, DOCX, TXT</strong> • Maximum file size: <strong>50 MB</strong>
                </div>
              </div>
            </div>

            {/* Selected File Chip */}
            {file && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'var(--gov-navy-50)',
                  border: '1px solid var(--gov-navy-200)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.5rem',
                }}
                data-testid="selected-file-info"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck size={16} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gov-navy-950)' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn-ghost"
                  aria-label="Remove selected file"
                  style={{ padding: '0.2rem', color: 'var(--gov-slate-600)' }}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {validationErrors.file && (
              <div id="upload-file-error" className="form-error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                {validationErrors.file}
              </div>
            )}
          </div>

          {/* Document Title */}
          <div className="form-group">
            <label htmlFor="upload-title" className="form-label">
              Official Statutory Title <span className="required">*</span>
            </label>
            <input
              id="upload-title"
              type="text"
              className={`form-input ${validationErrors.title ? 'has-error' : ''}`}
              placeholder="e.g. National Green Hydrogen Mission Operational Guidelines 2024"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                checkForDuplicates(e.target.value, file);
              }}
              aria-describedby={validationErrors.title ? 'upload-title-error' : undefined}
            />
            {validationErrors.title && (
              <div id="upload-title-error" className="form-error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                {validationErrors.title}
              </div>
            )}
          </div>

          {/* Issuing Ministry */}
          <div className="form-group">
            <label htmlFor="upload-ministry" className="form-label">
              Issuing Ministry / Authority <span className="required">*</span>
            </label>
            <input
              id="upload-ministry"
              type="text"
              className={`form-input ${validationErrors.ministry ? 'has-error' : ''}`}
              placeholder="e.g. Ministry of New and Renewable Energy"
              value={issuingMinistry}
              onChange={(e) => setIssuingMinistry(e.target.value)}
              aria-describedby={validationErrors.ministry ? 'upload-ministry-error' : undefined}
            />
            {validationErrors.ministry && (
              <div id="upload-ministry-error" className="form-error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                {validationErrors.ministry}
              </div>
            )}
          </div>

          {/* Sector Category & Gazette Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="upload-category" className="form-label">
                Policy Sector <span className="required">*</span>
              </label>
              <select
                id="upload-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as PolicyCategory)}
              >
                <option value="environmental">Environment & Climate</option>
                <option value="energy">Energy & Renewables</option>
                <option value="technology_ai">Technology & AI</option>
                <option value="healthcare">Healthcare & Health</option>
                <option value="finance_trade">Finance & Trade</option>
                <option value="education">Education</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="general">General Policy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="upload-pubdate" className="form-label">
                Gazette Publication Date <span className="required">*</span>
              </label>
              <input
                id="upload-pubdate"
                type="date"
                className={`form-input ${validationErrors.pubDate ? 'has-error' : ''}`}
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                aria-describedby={validationErrors.pubDate ? 'upload-pubdate-error' : undefined}
              />
              {validationErrors.pubDate && (
                <div id="upload-pubdate-error" className="form-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  {validationErrors.pubDate}
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar if in-flight */}
          {isUploading && (
            <div style={{ margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--gov-navy-950)' }}>{uploadStatusText}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-slate-600)' }}>{uploadProgress}%</span>
              </div>
              <div className="upload-progress-container" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--gov-slate-200)',
            }}
          >
            {isUploading ? (
              <Button
                variant="secondary"
                type="button"
                onClick={handleCancelUpload}
                aria-label="Cancel upload in progress"
              >
                Cancel Upload
              </Button>
            ) : (
              <Button variant="secondary" type="button" onClick={handleClose}>
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isUploading}
              loadingText="Ingesting Policy..."
              disabled={isUploading}
            >
              Start Ingestion Pipeline
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
