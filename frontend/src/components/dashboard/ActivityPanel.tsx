import React, { useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import type { Document } from '../../types';
import { Skeleton } from '../common/Skeleton';

export interface ActivityEvent {
  id: string;
  type: 'upload' | 'completed' | 'failed' | 'stage';
  title: string;
  description: string;
  timestamp: string;
  docId: string;
}

export interface ActivityPanelProps {
  documents: Document[];
  isLoading?: boolean;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  documents,
  isLoading = false,
}) => {
  // Derive real events from authentic document models only
  const realEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    documents.forEach((doc) => {
      // 1. Initial upload event
      if (doc.uploadedAt) {
        events.push({
          id: `ev-upload-${doc.id}`,
          type: 'upload',
          title: 'Document Ingestion Initiated',
          description: `"${doc.title}" was submitted for regulatory pipeline processing.`,
          timestamp: doc.uploadedAt,
          docId: doc.id,
        });
      }

      // 2. Failure event if failed
      if (doc.status === 'failed') {
        events.push({
          id: `ev-failed-${doc.id}`,
          type: 'failed',
          title: 'Extraction Pipeline Failed',
          description: doc.failureReason || `Processing interrupted for "${doc.title}".`,
          timestamp: doc.lastUpdated || doc.uploadedAt || doc.publicationDate || '',
          docId: doc.id,
        });
      }

      // 3. Ready event if ready
      if (doc.status === 'ready') {
        events.push({
          id: `ev-ready-${doc.id}`,
          type: 'completed',
          title: 'Policy Intelligence Synthesized',
          description: `Automated clause extraction and evidence citations confirmed for "${doc.title}".`,
          timestamp: doc.lastUpdated || doc.uploadedAt || doc.publicationDate || '',
          docId: doc.id,
        });
      }

      // 4. In-progress stage event if processing
      if (doc.status === 'processing' && doc.stages) {
        const activeStage = doc.stages.find((s) => s.status === 'in_progress');
        if (activeStage) {
          events.push({
            id: `ev-stage-${doc.id}-${activeStage.stage}`,
            type: 'stage',
            title: `Pipeline Stage: ${activeStage.label}`,
            description: `Active pipeline execution underway for "${doc.title}".`,
            timestamp: activeStage.startedAt || doc.lastUpdated || doc.uploadedAt || '',
            docId: doc.id,
          });
        }
      }
    });

    // Sort strictly in reverse chronological order
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return isNaN(timeB) ? 1 : isNaN(timeA) ? -1 : timeB - timeA;
    });
  }, [documents]);

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        border: '1px solid var(--gov-slate-200)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--gov-white)',
        marginBottom: '2rem',
      }}
      data-testid="activity-panel"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Activity size={20} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
          Real-Time Activity Log
        </h2>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} aria-busy="true">
          <Skeleton height="3rem" />
          <Skeleton height="3rem" />
          <Skeleton height="3rem" />
        </div>
      ) : realEvents.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--gov-slate-500)',
            fontSize: '0.875rem',
          }}
        >
          No workspace activity recorded yet. Ingest a document to begin tracking statutory events.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {realEvents.slice(0, 6).map((ev) => {
            const isCompleted = ev.type === 'completed';
            const isFailed = ev.type === 'failed';
            const isUpload = ev.type === 'upload';

            const Icon = isCompleted
              ? CheckCircle2
              : isFailed
              ? AlertTriangle
              : isUpload
              ? Upload
              : Clock;

            const iconColor = isCompleted
              ? '#15803d'
              : isFailed
              ? '#dc2626'
              : isUpload
              ? 'var(--gov-navy-900)'
              : '#d97706';

            const iconBg = isCompleted
              ? '#f0fdf4'
              : isFailed
              ? '#fef2f2'
              : isUpload
              ? 'var(--gov-navy-50)'
              : '#fffbeb';

            return (
              <li
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  paddingBottom: '0.875rem',
                  borderBottom: '1px solid var(--gov-slate-100)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gov-navy-950)' }}>
                      {ev.title}
                    </span>
                    <time
                      dateTime={ev.timestamp}
                      style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', fontFamily: 'var(--font-mono)' }}
                    >
                      {formatRelativeTime(ev.timestamp)}
                    </time>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--gov-slate-600)', lineHeight: 1.4 }}>
                    {ev.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
