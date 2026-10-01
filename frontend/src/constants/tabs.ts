import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  ShieldCheck,
  HelpCircle,
  GitCompare,
  BookOpen,
} from 'lucide-react';

export type AnalysisTabId =
  | 'overview'
  | 'summary'
  | 'insights'
  | 'evidence'
  | 'questions'
  | 'compare'
  | 'brief';

export interface AnalysisTabItem {
  id: AnalysisTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  count?: number;
}

export const TABS_CONFIG: AnalysisTabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'evidence', label: 'Evidence', icon: ShieldCheck },
  { id: 'questions', label: 'Questions', icon: HelpCircle },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'brief', label: 'Research Brief', icon: BookOpen },
];
