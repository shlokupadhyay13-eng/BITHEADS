import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Search,
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react';
import type { Document } from '../types';
import { documentsApi } from '../services/api/documentsApi';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonTableRow } from '../components/common/Skeleton';
import { DocumentTable } from '../components/documents/DocumentTable';
import { UploadModal } from '../components/documents/UploadModal';

export type SortOption = 'date_desc' | 'date_asc' | 'title_asc' | 'status';

export interface DocumentListPageProps {
  onSelectDocument?: (docId: string) => void;
}

export const DocumentListPage: React.FC<DocumentListPageProps> = ({ onSelectDocument }) => {
  const navigate = useNavigate();
  const handleSelect = onSelectDocument || ((docId: string) => navigate(`/insights?id=${docId}`));

  // Document collection state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);

  // Abort controller for canceling stale requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Fetch documents with cancellation of stale requests
  const fetchDocuments = useCallback(async () => {
    // Cancel any pending stale in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await documentsApi.listDocuments(
        {
          category: categoryFilter,
          status: statusFilter,
          search: debouncedSearch,
        },
        controller.signal
      );
      setDocuments(data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Failed to retrieve government documents from repository.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, debouncedSearch]);

  // Re-fetch on filter or debounced search change
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    documentsApi.listDocuments(
      {
        category: categoryFilter,
        status: statusFilter,
        search: debouncedSearch,
      },
      controller.signal
    ).then(
      (data) => {
        if (isMounted) {
          setDocuments(data);
          setIsLoading(false);
        }
      },
      (err: any) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message || 'Failed to retrieve government documents from repository.');
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categoryFilter, statusFilter, debouncedSearch]);

  // Client-side sort applied cleanly
  const sortedDocuments = React.useMemo(() => {
    const list = [...documents];
    switch (sortBy) {
      case 'date_desc':
        return list.sort((a, b) => {
          const timeA = new Date(a.publicationDate || a.uploadedAt || 0).getTime();
          const timeB = new Date(b.publicationDate || b.uploadedAt || 0).getTime();
          return timeB - timeA;
        });
      case 'date_asc':
        return list.sort((a, b) => {
          const timeA = new Date(a.publicationDate || a.uploadedAt || 0).getTime();
          const timeB = new Date(b.publicationDate || b.uploadedAt || 0).getTime();
          return timeA - timeB;
        });
      case 'title_asc':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'status':
        return list.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return list;
    }
  }, [documents, sortBy]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'date_desc';

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('date_desc');
  };

  const handleRetryPipeline = async (docId: string) => {
    setRetryingDocId(docId);
    try {
      await documentsApi.retryDocument(docId);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Pipeline retry failed: ${err.message}`);
    } finally {
      setRetryingDocId(null);
    }
  };

  const handleUploadSuccess = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
  };

  return (
    <div
      className="container"
      style={{
        padding: '2rem 1.5rem 4rem 1.5rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
      data-testid="document-list-page"
    >
      {/* Page Header and Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ marginBottom: '0.35rem', color: 'var(--gov-navy-950)' }}>
            Government Document Repository
          </h1>
          <p style={{ color: 'var(--gov-slate-600)', margin: 0, fontSize: '0.9375rem' }}>
            Authoritative statutory guidelines, gazette notifications, and legislative policy documents.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} aria-hidden="true" />}
            onClick={fetchDocuments}
            disabled={isLoading}
            aria-label="Refresh document repository"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            icon={<UploadCloud size={16} aria-hidden="true" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter, Search, and Sort Controls */}
      <div
        className="card-meta"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'flex-end',
          padding: '1.25rem',
          backgroundColor: 'var(--gov-white)',
          border: '1px solid var(--gov-slate-200)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* Debounced Search Input */}
        <div style={{ flex: '1 1 280px' }}>
          <label htmlFor="repo-search" className="form-label" style={{ fontSize: '0.8125rem' }}>
            Search Policy Titles or Ministries
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="repo-search"
              type="text"
              className="form-input"
              placeholder="e.g. Green Hydrogen, DPDP, Clean Air..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', paddingRight: searchQuery ? '2rem' : '0.75rem' }}
              aria-label="Search policy documents by title, ministry, or keywords"
            />
            <Search
              size={16}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gov-slate-400)',
                pointerEvents: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-ghost"
                aria-label="Clear search input"
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.2rem',
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category / Sector Filter */}
        <div style={{ flex: '0 1 200px' }}>
          <label htmlFor="category-filter" className="form-label" style={{ fontSize: '0.8125rem' }}>
            Policy Sector
          </label>
          <select
            id="category-filter"
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter documents by policy sector"
          >
            <option value="all">All Sectors</option>
            <option value="energy">Energy & Renewables</option>
            <option value="technology_ai">Technology & AI</option>
            <option value="environmental">Environment & Climate</option>
            <option value="healthcare">Healthcare & Health</option>
            <option value="finance_trade">Finance & Trade</option>
            <option value="education">Education</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>

        {/* Pipeline Status Filter */}
        <div style={{ flex: '0 1 180px' }}>
          <label htmlFor="status-filter" className="form-label" style={{ fontSize: '0.8125rem' }}>
            Pipeline Status
          </label>
          <select
            id="status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter documents by ingestion pipeline status"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready & Analyzed</option>
            <option value="processing">Processing / Ingesting</option>
            <option value="uploaded">Queued for Ingestion</option>
            <option value="failed">Failed Pipeline</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div style={{ flex: '0 1 180px' }}>
          <label htmlFor="sort-selector" className="form-label" style={{ fontSize: '0.8125rem' }}>
            Sort Documents
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="sort-selector"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort documents list"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="status">Pipeline Status</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Action */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            icon={<RotateCcw size={13} aria-hidden="true" />}
            style={{ alignSelf: 'flex-end', marginBottom: '0.2rem' }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Error Announcement with Retry */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="error" title="Repository Retrieval Error" id="repo-error-alert">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>{error}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={fetchDocuments}
                icon={<RotateCcw size={14} aria-hidden="true" />}
              >
                Retry
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Content: Loading, Empty, or Document Table & Cards */}
      {isLoading ? (
        <div className="table-container" aria-busy="true" aria-label="Loading document library">
          <table className="gov-table" aria-label="Loading documents table">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Type</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Analysis</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
            </tbody>
          </table>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <EmptyState
          title="No policy documents match your criteria"
          description={
            hasActiveFilters
              ? 'No documents match the active search query or sector/status filters. Reset filters to view all catalogued items.'
              : 'Your document repository is currently empty. Ingest your first statutory document to get started.'
          }
          actionLabel={hasActiveFilters ? 'Clear All Filters' : 'Upload First Document'}
          onAction={hasActiveFilters ? handleClearFilters : () => setIsUploadModalOpen(true)}
          id="no-documents-state"
        />
      ) : (
        <DocumentTable
          documents={sortedDocuments}
          onSelectDocument={handleSelect}
          onRetryPipeline={handleRetryPipeline}
          retryingDocId={retryingDocId}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        existingDocuments={documents}
      />
    </div>
  );
};

export default DocumentListPage;
