import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES_STATUS,
} from '../constants/auth';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AuthContext, type AuthContextType } from '../context/authContextDef';

describe('Auth Validation Constants & Rules', () => {
  it('documents password rules as unknown, needs Person 3 input', () => {
    expect(PASSWORD_RULES_STATUS).toBe('unknown, needs Person 3 input');
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  describe('validateEmail', () => {
    it('rejects empty or whitespace-only email', () => {
      expect(validateEmail('')).toBe('Institutional email address is required.');
      expect(validateEmail('   ')).toBe('Institutional email address is required.');
    });

    it('rejects improperly formatted email addresses', () => {
      expect(validateEmail('plainaddress')).toBe('Please enter a valid official email address (e.g. analyst@ministry.gov.in).');
      expect(validateEmail('analyst@')).toBe('Please enter a valid official email address (e.g. analyst@ministry.gov.in).');
      expect(validateEmail('@domain.com')).toBe('Please enter a valid official email address (e.g. analyst@ministry.gov.in).');
    });

    it('accepts valid official email addresses', () => {
      expect(validateEmail('analyst@intelligence.gov.in')).toBeNull();
      expect(validateEmail('officer.research@niti.gov.in')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('rejects empty password', () => {
      expect(validatePassword('')).toBe('Password is required.');
    });

    it('rejects passwords shorter than PASSWORD_MIN_LENGTH (8)', () => {
      expect(validatePassword('1234567')).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters in length.`);
    });

    it('accepts passwords with 8 or more characters', () => {
      expect(validatePassword('GovPolicy2026!')).toBeNull();
      expect(validatePassword('validpassword')).toBeNull();
    });

    it('rejects passwords exceeding 128 characters', () => {
      const longPassword = 'a'.repeat(129);
      expect(validatePassword(longPassword)).toBe('Password cannot exceed 128 characters.');
    });
  });

  describe('validateConfirmPassword', () => {
    it('rejects empty confirm password', () => {
      expect(validateConfirmPassword('GovPolicy2026!', '')).toBe('Please confirm your password.');
    });

    it('rejects mismatching passwords', () => {
      expect(validateConfirmPassword('GovPolicy2026!', 'DifferentPassword123')).toBe(
        'Passwords do not match. Please verify your entries.'
      );
    });

    it('accepts matching passwords', () => {
      expect(validateConfirmPassword('GovPolicy2026!', 'GovPolicy2026!')).toBeNull();
    });
  });

  describe('validateName', () => {
    it('rejects empty name', () => {
      expect(validateName('')).toBe('Official full name is required.');
      expect(validateName('  ')).toBe('Official full name is required.');
    });

    it('rejects names with less than 2 characters', () => {
      expect(validateName('A')).toBe('Name must be at least 2 characters.');
    });

    it('accepts valid full names', () => {
      expect(validateName('Dr. Rajesh Verma')).toBeNull();
    });
  });
});

describe('LoginPage Component', () => {
  const mockAuthContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  const renderLoginPage = (authOverrides = {}) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders email and password inputs with real label associations', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Institutional Email Address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/Official Password/i, { selector: 'input' });

    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(emailInput.getAttribute('type')).toBe('email');
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('toggles password visibility with accessible aria-pressed and aria-label attributes', () => {
    renderLoginPage();

    const toggleButton = screen.getByRole('button', { name: /Show password/i });
    expect(toggleButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggleButton);

    const passwordInput = screen.getByLabelText(/Official Password/i, { selector: 'input' });
    expect(passwordInput.getAttribute('type')).toBe('text');
    expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
    expect(toggleButton.getAttribute('aria-label')).toBe('Hide password');
  });

  it('displays client validation errors and summary when submitted with empty fields', async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /Authenticate & Enter Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const emailErrors = screen.getAllByText('Institutional email address is required.');
      expect(emailErrors.length).toBeGreaterThanOrEqual(1);

      const passwordErrors = screen.getAllByText('Password is required.');
      expect(passwordErrors.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  it('displays API error state when authentication fails', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid statutory credentials'));
    renderLoginPage({ login: mockLogin });

    const emailInput = screen.getByLabelText(/Institutional Email Address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/Official Password/i, { selector: 'input' });

    fireEvent.change(emailInput, { target: { value: 'analyst@intelligence.gov.in' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword123' } });

    const submitBtn = screen.getByRole('button', { name: /Authenticate & Enter Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid statutory credentials')).toBeDefined();
    });
  });
});

describe('RegisterPage Component', () => {
  const mockAuthContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  const renderRegisterPage = (authOverrides = {}) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders all required registration fields with labels', () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/Full Official Name/i, { selector: 'input' })).toBeDefined();
    expect(screen.getByLabelText(/Institutional Email Address/i, { selector: 'input' })).toBeDefined();
    expect(screen.getByLabelText(/^Password/i, { selector: 'input' })).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password/i, { selector: 'input' })).toBeDefined();
  });

  it('validates matching passwords on submit', async () => {
    renderRegisterPage();

    const nameInput = screen.getByLabelText(/Full Official Name/i, { selector: 'input' });
    const emailInput = screen.getByLabelText(/Institutional Email Address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/^Password/i, { selector: 'input' });
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i, { selector: 'input' });

    fireEvent.change(nameInput, { target: { value: 'Dr. Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane.doe@ministry.gov.in' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword456!' } });

    const submitBtn = screen.getByRole('button', { name: /Create Analytical Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const matchErrors = screen.getAllByText('Passwords do not match. Please verify your entries.');
      expect(matchErrors.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('validates minimum password length against PASSWORD_MIN_LENGTH', async () => {
    renderRegisterPage();

    const nameInput = screen.getByLabelText(/Full Official Name/i, { selector: 'input' });
    const emailInput = screen.getByLabelText(/Institutional Email Address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/^Password/i, { selector: 'input' });
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i, { selector: 'input' });

    fireEvent.change(nameInput, { target: { value: 'Dr. Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane.doe@ministry.gov.in' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });

    const submitBtn = screen.getByRole('button', { name: /Create Analytical Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const lengthErrors = screen.getAllByText(`Password must be at least ${PASSWORD_MIN_LENGTH} characters in length.`);
      expect(lengthErrors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
