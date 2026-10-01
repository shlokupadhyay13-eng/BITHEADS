import type { ApiError } from '../../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';

const DEFAULT_TIMEOUT_MS = 30000;
const AUTH_TOKEN_KEY = 'policy_intel_auth_token';

/**
 * Token accessors for bearer credentials
 */
export function getStoredAuthToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string, persist: boolean = false): void {
  try {
    if (persist) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredAuthToken(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Verifies if an error message from backend is safe to display to users
 * (i.e. does not expose internal stack traces, file paths, or DB driver internals)
 */
export function isSafeBackendMessage(msg: unknown): msg is string {
  if (typeof msg !== 'string') return false;
  const lower = msg.toLowerCase();
  // Filter stack traces, node internals, and DB errors
  if (lower.includes('at ') && (lower.includes('.js:') || lower.includes('.ts:'))) return false;
  if (lower.includes('node_modules')) return false;
  if (lower.includes('mongonetworkerror') || lower.includes('econnrefused') || lower.includes('mongoerror')) return false;
  if (lower.includes('syntaxerror:') || lower.includes('referenceerror:') || lower.includes('typeerror:')) return false;
  if (lower.includes('call stack:') || lower.includes('trace:')) return false;
  if (lower.includes('cast to objectid failed') || lower.includes('validation failed:')) return false;
  return msg.trim().length > 0 && msg.trim().length < 500;
}

/**
 * Centralized Error Normalization
 * Strictly maps HTTP 400/401/403/404/409/413/429/500, network failure, and timeout.
 * On 401: Clears session and initiates redirect to /login.
 */
export function normalizeApiError(
  error: unknown,
  fallbackMessage: string,
  statusCode?: number
): ApiError {
  const code = statusCode ?? (typeof error === 'object' && error !== null && 'statusCode' in error ? (error as any).statusCode : 500);

  // Check for Abort / Timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      statusCode: 408,
      message: 'The request timed out while awaiting the intelligence service to respond. Please try again.',
      isTimeout: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Network connection failures
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return {
      statusCode: 0,
      message: 'Unable to connect to the Government Policy Analysis service. Please verify network connectivity or check if the backend server is active.',
      isNetworkError: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Extract potential safe message from backend
  let safeMsg: string | undefined;
  if (typeof error === 'object' && error !== null && 'message' in error && isSafeBackendMessage((error as any).message)) {
    safeMsg = (error as any).message;
  }

  // Handle HTTP status code mapping
  switch (code) {
    case 400:
      return {
        statusCode: 400,
        message: safeMsg || 'The request was invalid or missing required parameters.',
        timestamp: new Date().toISOString(),
      };
    case 401:
      // Clear auth state immediately
      clearStoredAuthToken();
      // Notify application if in browser
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        // If not already on login page, redirect
        if (!window.location.pathname.includes('/login')) {
          const redirectUrl = `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          window.location.href = redirectUrl;
        }
      }
      return {
        statusCode: 401,
        message: 'Your session has expired or authentication is required. Redirecting to login...',
        timestamp: new Date().toISOString(),
      };
    case 403:
      return {
        statusCode: 403,
        message: safeMsg || 'You do not have statutory authorization to access this intelligence resource.',
        timestamp: new Date().toISOString(),
      };
    case 404:
      return {
        statusCode: 404,
        message: safeMsg || 'The requested policy document or research finding was not found.',
        timestamp: new Date().toISOString(),
      };
    case 409:
      return {
        statusCode: 409,
        message: safeMsg || 'A document or record with this statutory reference already exists in the repository.',
        timestamp: new Date().toISOString(),
      };
    case 413:
      return {
        statusCode: 413,
        message: safeMsg || 'The uploaded file exceeds the permissible file size limit (maximum: 50MB).',
        timestamp: new Date().toISOString(),
      };
    case 429:
      return {
        statusCode: 429,
        message: 'Too many requests. Rate limit thresholds have been applied. Please wait a moment and try again.',
        timestamp: new Date().toISOString(),
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        statusCode: code,
        message: 'An internal server error occurred within the intelligence analysis service. Our team has been notified.',
        timestamp: new Date().toISOString(),
      };
    default:
      return {
        statusCode: code,
        message: safeMsg || fallbackMessage,
        timestamp: new Date().toISOString(),
      };
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Core HTTP Client Wrapper with AbortController, Timeout, and Credential support
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // Setup AbortController for timeout & caller abort signals
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  // Setup headers & Bearer credentials
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: options.credentials || 'same-origin',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let backendErrorMsg: string | undefined;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson === 'object') {
          backendErrorMsg = errorJson.message || errorJson.error;
        }
      } catch {
        // Fallback if not JSON
      }

      throw normalizeApiError(
        { message: backendErrorMsg },
        `HTTP Error ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      throw err as ApiError;
    }
    throw normalizeApiError(err, 'Failed to complete request to government intelligence service.');
  }
}
