import React, { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        menuButtonRef={menuButtonRef}
      />

      <div
        className="app-shell-container"
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Accessible Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          triggerRef={menuButtonRef}
        />

        {/* Main Content Landmark with id for skip link */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            minWidth: 0,
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AppLayout;
