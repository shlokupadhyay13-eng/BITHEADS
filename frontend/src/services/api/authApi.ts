import { apiRequest, IS_MOCK_MODE, setStoredAuthToken, clearStoredAuthToken } from './client';
import { mockService } from '../mock/mockService';
import type { User, AuthSession, LoginCredentials, RegisterData, ApiResponse } from '../../types';

export const authApi = {
  /**
   * Log into the intelligence platform
   */
  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthSession> {
    if (IS_MOCK_MODE) {
      const session = await mockService.login(credentials);
      setStoredAuthToken(session.token);
      return session;
    }

    const response = await apiRequest<ApiResponse<AuthSession> | AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      signal,
    });

    const session = 'data' in response ? response.data : response;
    if (session.token) {
      setStoredAuthToken(session.token);
    }
    return session;
  },

  /**
   * Register a new policy researcher account
   */
  async register(data: RegisterData, signal?: AbortSignal): Promise<AuthSession> {
    if (IS_MOCK_MODE) {
      const session = await mockService.register(data);
      setStoredAuthToken(session.token);
      return session;
    }

    const response = await apiRequest<ApiResponse<AuthSession> | AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });

    const session = 'data' in response ? response.data : response;
    if (session.token) {
      setStoredAuthToken(session.token);
    }
    return session;
  },

  /**
   * Retrieve current authenticated user profile
   */
  async getCurrentUser(signal?: AbortSignal): Promise<User> {
    if (IS_MOCK_MODE) {
      return mockService.getCurrentUser();
    }

    const response = await apiRequest<ApiResponse<User> | User>('/auth/me', { signal });
    return 'data' in response ? response.data : response;
  },

  /**
   * Terminate active authentication session
   */
  async logout(signal?: AbortSignal): Promise<void> {
    clearStoredAuthToken();
    if (!IS_MOCK_MODE) {
      try {
        await apiRequest('/auth/logout', { method: 'POST', signal });
      } catch {
        // Safe to ignore on client-side teardown
      }
    }
  },
};
