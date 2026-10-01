import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from './navItems';

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="app-sidebar desktop-only-sidebar"
      aria-label="Sidebar"
      style={{
        width: '260px',
        flexShrink: 0,
        backgroundColor: 'var(--gov-white)',
        borderRight: '1px solid var(--gov-slate-200)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <div>
        <div
          style={{
            padding: '0 0.75rem 0.75rem 0.75rem',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--gov-slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Analytical Modules
        </div>

        <nav aria-label="Sidebar Navigation">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--gov-navy-950)' : 'var(--gov-slate-600)',
                      backgroundColor: isActive ? 'var(--gov-slate-100)' : 'transparent',
                      fontWeight: isActive ? 700 : 500,
                      borderLeft: isActive ? '3px solid var(--gov-navy-900)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)',
                    })}
                  >
                    <Icon size={19} aria-hidden={true} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>{item.label}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--gov-slate-400)', fontWeight: 400 }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Trust & Compliance Badge */}
      <div
        style={{
          padding: '0.875rem',
          backgroundColor: 'var(--gov-slate-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--gov-slate-200)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
          <ShieldCheck size={14} style={{ color: '#166534' }} aria-hidden="true" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-navy-950)' }}>
            Zero-Hallucination
          </span>
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--gov-slate-500)', margin: 0, lineHeight: 1.4 }}>
          All AI policy findings and risks are strictly grounded in verified page citations.
        </p>
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Sparkles size={11} style={{ color: 'var(--gov-navy-700)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.6875rem', color: 'var(--gov-slate-600)', fontWeight: 600 }}>
            WCAG 2.2 AA Standard
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
