/**
 * Authentication and credential validation constants.
 * 
 * Note on Password Complexity Rules:
 * Minimal length is currently standardized to 8 characters for client-side sanity.
 * Specific backend requirements (e.g. mandatory symbols, uppercase, numeric characters,
 * or dictionary restrictions) are currently UNKNOWN and require Person 3 specification.
 * See docs/BACKEND_REQUIREMENTS.md for discrepancy tracking.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Backend password complexity requirements (symbols, uppercase, numbers, dictionary restrictions).
 * Currently undocumented by backend team.
 */
export const PASSWORD_RULES_STATUS = 'unknown, needs Person 3 input' as const;

// Basic RFC 5322 compliant regex for email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Institutional email address is required.';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid official email address (e.g. analyst@ministry.gov.in).';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters in length.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match. Please verify your entries.';
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Official full name is required.';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
}
