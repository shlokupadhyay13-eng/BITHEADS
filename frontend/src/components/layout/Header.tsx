import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';
import { MockBanner } from '../common/MockBanner';
import { SkipLink } from '../common/SkipLink';
import { useAuth } from '../../context/useAuth';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Header: React.FC<HeaderProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
  menuButtonRef,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <>
      <SkipLink targetId="main-content" />
      <MockBanner />

      <header
        role="banner"
        style={{
          backgroundColor: 'var(--gov-navy-950)',
          color: 'var(--gov-white)',
          borderBottom: '2px solid var(--gov-navy-800)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            maxWidth: '100%',
          }}
        >
          {/* Left: Mobile Toggle & Portal Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* Mobile hamburger button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={onToggleMobileMenu}
              className="btn-ghost mobile-menu-btn"
              style={{
                color: 'var(--gov-white)',
                padding: '0.5rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-sidebar-drawer"
            >
              {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--gov-navy-800)',
                border: '1px solid var(--gov-navy-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gov-white)',
              }}
              aria-hidden="true"
            >
              <Landmark size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--gov-white)',
                  }}
                >
                  PolicyIntelligence
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'var(--gov-slate-200)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Research Portal
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-400)' }} className="desktop-only">
                Government Policies & Statutory Reports Analyser
              </div>
            </div>
          </div>

          {/* Right: Verified Citations Badge & User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#86efac',
                backgroundColor: 'rgba(22, 101, 52, 0.25)',
                border: '1px solid #166534',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
              }}
              className="desktop-only"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Verified Citations
            </span>

            {isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8125rem',
                    color: 'var(--gov-slate-200)',
                  }}
                  className="desktop-only"
                >
                  <UserIcon size={15} style={{ color: 'var(--gov-slate-400)' }} aria-hidden="true" />
                  <span style={{ fontWeight: 600 }}>{user?.name || user?.email || 'Senior Analyst'}</span>
                </div>

                {/* Logout action in the top nav */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost"
                  style={{
                    color: '#fca5a5',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8125rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  aria-label="Sign out of analytical session"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
