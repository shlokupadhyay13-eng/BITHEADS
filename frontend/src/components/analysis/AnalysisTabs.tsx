import React, { useRef } from 'react';
import { TABS_CONFIG, type AnalysisTabId } from '../../constants/tabs';

export type { AnalysisTabId };

export interface AnalysisTabsProps {
  activeTab: AnalysisTabId;
  onTabChange: (tabId: AnalysisTabId) => void;
  counts?: {
    findings?: number;
    insights?: number;
    evidence?: number;
  };
}

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabsCount = TABS_CONFIG.length;
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (index + 1) % tabsCount;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (index - 1 + tabsCount) % tabsCount;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabsCount - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onTabChange(TABS_CONFIG[index].id);
        return;
      default:
        return;
    }

    const nextTab = TABS_CONFIG[nextIndex];
    onTabChange(nextTab.id);

    // Focus DOM button element
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (buttons && buttons[nextIndex]) {
      buttons[nextIndex].focus();
    }
  };

  return (
    <nav
      style={{
        borderBottom: '2px solid var(--gov-slate-200)',
        marginBottom: '2rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      aria-label="Policy Intelligence Sections"
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation="horizontal"
        style={{
          display: 'flex',
          gap: '0.25rem',
          minWidth: 'max-content',
        }}
      >
        {TABS_CONFIG.map((tab, idx) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          let badgeCount: number | undefined;
          if (tab.id === 'summary' && counts?.findings) badgeCount = counts.findings;
          if (tab.id === 'insights' && counts?.insights) badgeCount = counts.insights;
          if (tab.id === 'evidence' && counts?.evidence) badgeCount = counts.evidence;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`analysis-tab-${tab.id}`}
              aria-controls={`analysis-panel-${tab.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="tab-btn"
              data-testid={`tab-${tab.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.75rem 1.125rem',
                fontSize: '0.875rem',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--gov-navy-950)' : 'var(--gov-slate-600)',
                borderBottom: isSelected ? '3px solid var(--gov-navy-900)' : '3px solid transparent',
                marginBottom: '-2px',
                background: isSelected ? 'var(--gov-slate-50)' : 'transparent',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
              {badgeCount !== undefined && badgeCount > 0 && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'var(--gov-navy-900)' : 'var(--gov-slate-200)',
                    color: isSelected ? 'var(--gov-white)' : 'var(--gov-slate-700)',
                    lineHeight: 1.2,
                  }}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
