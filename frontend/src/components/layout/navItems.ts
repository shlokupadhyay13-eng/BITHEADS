import React from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  FileSearch,
  HelpCircle,
  GitCompare,
  FileText,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    subtitle: 'Executive Overview',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/documents',
    label: 'Documents',
    subtitle: 'Statutory Repository',
    icon: FolderArchive,
  },
  {
    to: '/insights',
    label: 'Insights',
    subtitle: 'Policy Intelligence',
    icon: FileSearch,
  },
  {
    to: '/questions',
    label: 'Questions',
    subtitle: 'Evidence Q&A',
    icon: HelpCircle,
  },
  {
    to: '/compare',
    label: 'Compare',
    subtitle: 'Cross-Policy Matrix',
    icon: GitCompare,
  },
  {
    to: '/research',
    label: 'Research',
    subtitle: 'Executive Briefs',
    icon: FileText,
  },
];
