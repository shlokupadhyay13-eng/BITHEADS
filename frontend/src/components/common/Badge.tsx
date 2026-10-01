import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldAlert,
  Info,
  Zap,
  Cpu,
  Leaf,
  HeartPulse,
  Landmark,
  GraduationCap,
  Building2,
  Sparkles,
} from 'lucide-react';
import type { DocumentStatus, MandateLevel, StakeholderImpactType, PolicyCategory } from '../../types';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
  id,
}) => {
  return (
    <span id={id} className={`badge badge-${variant} ${className}`}>
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const DocumentStatusBadge: React.FC<{ status: DocumentStatus | string; id?: string }> = ({
  status,
  id,
}) => {
  switch (status) {
    case 'ready':
    case 'analyzed':
      return (
        <Badge id={id} variant="success" icon={<CheckCircle2 size={13} aria-hidden="true" />}>
          Ready & Analyzed
        </Badge>
      );
    case 'processing':
    case 'analyzing':
    case 'extracting':
    case 'chunking':
      return (
        <Badge id={id} variant="warning" icon={<Clock size={13} aria-hidden="true" />}>
          Processing Pipeline
        </Badge>
      );
    case 'uploaded':
      return (
        <Badge id={id} variant="neutral" icon={<Clock size={13} aria-hidden="true" />}>
          Queued for Ingestion
        </Badge>
      );
    case 'failed':
      return (
        <Badge id={id} variant="error" icon={<XCircle size={13} aria-hidden="true" />}>
          Ingestion Failed
        </Badge>
      );
    default:
      return (
        <Badge id={id} variant="neutral">
          {status}
        </Badge>
      );
  }
};

export const PolicyCategoryBadge: React.FC<{ category?: PolicyCategory | string; id?: string }> = ({
  category,
  id,
}) => {
  switch (category) {
    case 'energy':
      return (
        <Badge id={id} variant="warning" icon={<Zap size={13} aria-hidden="true" />}>
          Energy & Renewables
        </Badge>
      );
    case 'technology_ai':
      return (
        <Badge id={id} variant="info" icon={<Cpu size={13} aria-hidden="true" />}>
          Technology & AI
        </Badge>
      );
    case 'environmental':
      return (
        <Badge id={id} variant="success" icon={<Leaf size={13} aria-hidden="true" />}>
          Environment & Climate
        </Badge>
      );
    case 'healthcare':
      return (
        <Badge id={id} variant="error" icon={<HeartPulse size={13} aria-hidden="true" />}>
          Healthcare & Health
        </Badge>
      );
    case 'finance_trade':
      return (
        <Badge id={id} variant="neutral" icon={<Landmark size={13} aria-hidden="true" />}>
          Finance & Trade
        </Badge>
      );
    case 'education':
      return (
        <Badge id={id} variant="info" icon={<GraduationCap size={13} aria-hidden="true" />}>
          Education
        </Badge>
      );
    case 'infrastructure':
      return (
        <Badge id={id} variant="neutral" icon={<Building2 size={13} aria-hidden="true" />}>
          Infrastructure
        </Badge>
      );
    default:
      return (
        <Badge id={id} variant="neutral" icon={<FileText size={13} aria-hidden="true" />}>
          {category ? category.replace(/_/g, ' ') : 'General Policy'}
        </Badge>
      );
  }
};

export const AnalysisStatusBadge: React.FC<{
  status: DocumentStatus | string;
  id?: string;
}> = ({ status, id }) => {
  switch (status) {
    case 'ready':
    case 'analyzed':
      return (
        <Badge id={id} variant="success" icon={<Sparkles size={13} aria-hidden="true" />}>
          Synthesized & Grounded
        </Badge>
      );
    case 'processing':
    case 'analyzing':
    case 'extracting':
    case 'chunking':
      return (
        <Badge id={id} variant="warning" icon={<Clock size={13} aria-hidden="true" />}>
          Analysis Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge id={id} variant="error" icon={<AlertTriangle size={13} aria-hidden="true" />}>
          Analysis Incomplete
        </Badge>
      );
    default:
      return (
        <Badge id={id} variant="neutral" icon={<Clock size={13} aria-hidden="true" />}>
          Queued
        </Badge>
      );
  }
};

export const MandateLevelBadge: React.FC<{ level?: MandateLevel; id?: string }> = ({
  level,
  id,
}) => {
  switch (level) {
    case 'mandatory':
      return (
        <Badge id={id} variant="error" icon={<ShieldAlert size={13} aria-hidden="true" />}>
          Mandatory Compliance
        </Badge>
      );
    case 'prohibitory':
      return (
        <Badge id={id} variant="error" icon={<XCircle size={13} aria-hidden="true" />}>
          Statutory Prohibition
        </Badge>
      );
    case 'discretionary':
      return (
        <Badge id={id} variant="warning" icon={<AlertTriangle size={13} aria-hidden="true" />}>
          Discretionary
        </Badge>
      );
    case 'advisory':
      return (
        <Badge id={id} variant="info" icon={<Info size={13} aria-hidden="true" />}>
          Advisory Guideline
        </Badge>
      );
    default:
      return (
        <Badge id={id} variant="neutral">
          {level || 'Statutory Clause'}
        </Badge>
      );
  }
};

export const StakeholderImpactBadge: React.FC<{
  impactType?: StakeholderImpactType;
  id?: string;
}> = ({ impactType, id }) => {
  switch (impactType) {
    case 'positive':
      return (
        <Badge id={id} variant="success" icon={<CheckCircle2 size={13} aria-hidden="true" />}>
          Beneficial Impact
        </Badge>
      );
    case 'financial_burden':
      return (
        <Badge id={id} variant="warning" icon={<AlertTriangle size={13} aria-hidden="true" />}>
          Fiscal Burden
        </Badge>
      );
    case 'restrictive':
      return (
        <Badge id={id} variant="error" icon={<ShieldAlert size={13} aria-hidden="true" />}>
          Restrictive Constraint
        </Badge>
      );
    case 'compliance_requirement':
      return (
        <Badge id={id} variant="info" icon={<FileText size={13} aria-hidden="true" />}>
          Compliance Obligation
        </Badge>
      );
    default:
      return (
        <Badge id={id} variant="neutral">
          {impactType || 'Neutral'}
        </Badge>
      );
  }
};

