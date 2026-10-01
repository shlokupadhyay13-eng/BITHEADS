import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AuthContext, type AuthContextType } from '../context/authContextDef';

describe('ProtectedRoute Component', () => {
  const baseAuthContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  const renderWithRouter = (authValue: AuthContextType, initialEntry = '/dashboard') => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Confidential Policy Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders loading indicator with accessible role="status" while authentication is loading', () => {
    renderWithRouter({
      ...baseAuthContext,
      isLoading: true,
      isAuthenticated: false,
    });

    expect(screen.getByRole('status')).toBeDefined();
    expect(
      screen.getAllByText(/Verifying statutory credentials and session security/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Confidential Policy Dashboard')).toBeNull();
    expect(screen.queryByText('Login Page Mock')).toBeNull();
  });

  it('redirects unauthenticated users to /login when attempting to access a protected route', () => {
    renderWithRouter({
      ...baseAuthContext,
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    expect(screen.getByText('Login Page Mock')).toBeDefined();
    expect(screen.queryByText('Confidential Policy Dashboard')).toBeNull();
  });

  it('renders protected child component when the user is authenticated', () => {
    renderWithRouter({
      ...baseAuthContext,
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: 'user-001',
        name: 'Dr. Jane Doe',
        email: 'jane.doe@ministry.gov.in',
        role: 'Senior Regulatory Analyst',
      },
    });

    expect(screen.getByText('Confidential Policy Dashboard')).toBeDefined();
    expect(screen.queryByText('Login Page Mock')).toBeNull();
  });
});
