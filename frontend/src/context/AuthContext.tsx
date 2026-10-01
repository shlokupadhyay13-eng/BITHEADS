import React, { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../services/api/authApi';
import { getStoredAuthToken, IS_MOCK_MODE } from '../services/api/client';
import { AuthContext, type AuthContextType } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize and verify authentication state on app mount
  // Invokes GET /api/auth/me if token exists or in mock mode
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = getStoredAuthToken();
      // If no token exists and not in mock mode, user is unauthenticated
      if (!token && !IS_MOCK_MODE) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen to global 401 unauthorized events dispatched by API client
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.login(credentials);
      setUser(session.user);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Invalid credentials or authentication failure.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.register(data);
      setUser(session.user);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Registration failed. Please check inputs and try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
