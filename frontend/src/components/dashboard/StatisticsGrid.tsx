import React from 'react';
import {
  FileText,
  FileCheck2,
  HelpCircle,
  BookOpen,
  Info,
  CheckCircle,
} from 'lucide-react';
import { SkeletonCard } from '../common/Skeleton';

export interface WorkspaceMetrics {
  totalDocuments: number;
  recentAnalyses: number;
  questionsAsked?: number;
  researchBriefs?: number;
}

export interface StatisticsGridProps {
  metrics: WorkspaceMetrics;
  isLoading?: boolean;
}

export const StatisticsGrid: React.FC<StatisticsGridProps> = ({
  metrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
        data-testid="statistics-grid-skeleton"
        aria-busy="true"
        aria-label="Loading workspace metrics"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const statCards = [
    {
      id: 'stat-total-documents',
      label: 'Total Statutory Documents',
      value: metrics.totalDocuments.toString(),
      sourceType: 'live' as const,
      sourceLabel: 'Live API Repository',
      description: 'Active policies ingested into workspace',
      icon: FileText,
      iconColor: 'var(--gov-navy-900)',
      iconBg: 'var(--gov-navy-50)',
    },
    {
      id: 'stat-recent-analyses',
      label: 'Synthesized Analyses',
      value: metrics.recentAnalyses.toString(),
      sourceType: 'live' as const,
      sourceLabel: 'Live Verified Analysis',
      description: 'Documents with verified citations',
      icon: FileCheck2,
      iconColor: '#15803d',
      iconBg: '#f0fdf4',
    },
    {
      id: 'stat-questions-asked',
      label: 'Questions Asked',
      value: (metrics.questionsAsked ?? 2).toString(),
      // API currently does not supply a dedicated query telemetry endpoint; clearly label as mock/demo
      sourceType: 'mock' as const,
      sourceLabel: 'Demo / Workspace Telemetry',
      description: 'Evidence-grounded statutory inquiries',
      icon: HelpCircle,
      iconColor: '#0369a1',
      iconBg: '#f0f9ff',
    },
    {
      id: 'stat-research-briefs',
      label: 'Research Briefs',
      value: (metrics.researchBriefs ?? 1).toString(),
      // API currently does not supply a dedicated brief counter endpoint; clearly label as mock/demo
      sourceType: 'mock' as const,
      sourceLabel: 'Demo / Workspace Catalog',
      description: 'Executive parliamentary dossiers generated',
      icon: BookOpen,
      iconColor: '#b45309',
      iconBg: '#fffbeb',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}
      data-testid="statistics-grid"
      aria-label="Workspace Research Statistics"
    >
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--gov-slate-200)',
              backgroundColor: 'var(--gov-white)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {/* Header: Label + Icon */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--gov-slate-600)',
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: stat.iconBg,
                    color: stat.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </div>
              </div>

              {/* Metric Value */}
              <div
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: 'var(--gov-navy-950)',
                  lineHeight: 1.2,
                  marginBottom: '0.375rem',
                }}
              >
                {stat.value}
              </div>

              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--gov-slate-500)',
                  marginBottom: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {stat.description}
              </div>
            </div>

            {/* Source Truth Label (Requirement: clearly label as mock/demo if API cannot supply) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.2rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: stat.sourceType === 'live' ? 'var(--gov-success-bg)' : '#fef3c7',
                color: stat.sourceType === 'live' ? 'var(--gov-success-text)' : '#92400e',
                border: `1px solid ${stat.sourceType === 'live' ? 'var(--gov-success-border)' : '#fde68a'}`,
                width: 'fit-content',
              }}
            >
              {stat.sourceType === 'live' ? (
                <CheckCircle size={11} aria-hidden="true" />
              ) : (
                <Info size={11} aria-hidden="true" />
              )}
              <span>{stat.sourceLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
