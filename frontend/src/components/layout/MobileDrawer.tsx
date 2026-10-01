import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X, ShieldCheck, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from './navItems';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  triggerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Focus management when opening & closing
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = (document.activeElement as HTMLElement) || triggerRef?.current || null;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside drawer
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else {
      document.body.style.overflow = '';
      // Return focus to the trigger that opened the drawer
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, triggerRef]);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop mobile-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-start',
      }}
    >
      <div
        ref={drawerRef}
        id="mobile-sidebar-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        style={{
          width: '85%',
          maxWidth: '320px',
          height: '100%',
          backgroundColor: 'var(--gov-navy-950)',
          color: 'var(--gov-white)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.6)',
          overflowY: 'auto',
        }}
      >
        {/* Header & Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--gov-navy-800)',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--gov-white)' }}>
              PolicyIntelligence
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-400)' }}>
              Analytical Navigation
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation drawer"
            className="btn-ghost"
            style={{
              color: 'var(--gov-white)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Landmark */}
        <nav aria-label="Mobile Navigation" style={{ flex: 1 }}>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `btn btn-ghost ${isActive ? 'active' : ''}`
                    }
                    style={({ isActive }) => ({
                      width: '100%',
                      justifyContent: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: isActive ? 'var(--gov-white)' : 'var(--gov-slate-300)',
                      backgroundColor: isActive ? 'var(--gov-navy-800)' : 'transparent',
                      borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                    })}
                  >
                    <Icon size={19} aria-hidden={true} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--gov-slate-400)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer Footer / Accessibility info */}
        <div
          style={{
            borderTop: '1px solid var(--gov-navy-800)',
            paddingTop: '1.25rem',
            marginTop: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--gov-slate-300)',
              marginBottom: '0.35rem',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#86efac' }} aria-hidden="true" />
            <span>Zero-Hallucination Standard</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.6875rem',
              color: 'var(--gov-slate-400)',
            }}
          >
            <Sparkles size={12} aria-hidden="true" />
            <span>WCAG 2.2 AA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
