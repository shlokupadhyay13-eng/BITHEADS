import { useState, useRef, useId } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Landmark, Eye, EyeOff, ShieldCheck, AlertCircle, UserPlus, Info } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES_STATUS,
} from '../constants/auth';
import { Button } from '../components/common/Button';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ministry, setMinistry] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const nameErrorId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const confirmPasswordErrorId = useId();

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validateForm = (): { isValid: boolean; formErrors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    const nameErr = validateName(name);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) newErrors.password = passwordErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, formErrors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const { isValid, formErrors } = validateForm();
    if (!isValid) {
      setTimeout(() => {
        if (formErrors.name) {
          nameInputRef.current?.focus();
        } else if (formErrors.email) {
          emailInputRef.current?.focus();
        } else if (formErrors.password) {
          passwordInputRef.current?.focus();
        } else if (formErrors.confirmPassword) {
          confirmPasswordInputRef.current?.focus();
        } else {
          errorSummaryRef.current?.focus();
        }
      }, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        ministry: ministry.trim() || undefined,
      });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Registration failed. Please check inputs and try again.';
      setApiError(msg);
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0 || !!apiError;

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        backgroundColor: 'var(--gov-slate-50)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-lg)',
          borderTop: '4px solid var(--gov-navy-900)',
          padding: '2rem',
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--gov-navy-950)',
              color: 'var(--gov-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
            aria-hidden="true"
          >
            <Landmark size={26} />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--gov-navy-950)', margin: '0 0 0.25rem 0' }}>
            Register Institutional Account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', margin: 0 }}>
            PolicyIntelligence Portal — Government Policy Research Access
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.5rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(22, 101, 52, 0.1)',
              color: '#166534',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={13} aria-hidden="true" />
            Official Analyst Registration
          </div>
        </div>

        {/* Error Summary Banner (WCAG 2.2 AA compliant focus target) */}
        {hasErrors && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            aria-labelledby="error-summary-heading"
            style={{
              backgroundColor: 'var(--gov-error-bg)',
              border: '1px solid var(--gov-error-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              outline: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <AlertCircle size={18} style={{ color: 'var(--gov-error-text)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                <h2
                  id="error-summary-heading"
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--gov-error-text)',
                    margin: '0 0 0.35rem 0',
                  }}
                >
                  There is a problem with your registration
                </h2>
                {apiError && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gov-error-text)', margin: '0 0 0.5rem 0' }}>
                    {apiError}
                  </p>
                )}
                {Object.keys(errors).length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--gov-error-text)' }}>
                    {errors.name && (
                      <li>
                        <a
                          href="#name"
                          onClick={(e) => {
                            e.preventDefault();
                            nameInputRef.current?.focus();
                          }}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {errors.name}
                        </a>
                      </li>
                    )}
                    {errors.email && (
                      <li>
                        <a
                          href="#email"
                          onClick={(e) => {
                            e.preventDefault();
                            emailInputRef.current?.focus();
                          }}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {errors.email}
                        </a>
                      </li>
                    )}
                    {errors.password && (
                      <li>
                        <a
                          href="#password"
                          onClick={(e) => {
                            e.preventDefault();
                            passwordInputRef.current?.focus();
                          }}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {errors.password}
                        </a>
                      </li>
                    )}
                    {errors.confirmPassword && (
                      <li>
                        <a
                          href="#confirmPassword"
                          onClick={(e) => {
                            e.preventDefault();
                            confirmPasswordInputRef.current?.focus();
                          }}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {errors.confirmPassword}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--gov-slate-900)',
                marginBottom: '0.35rem',
              }}
            >
              Full Official Name <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? nameErrorId : undefined}
              placeholder="e.g. Dr. Rajesh Verma"
              className="gov-input"
              style={{
                width: '100%',
                borderColor: errors.name ? '#dc2626' : undefined,
              }}
            />
            {errors.name && (
              <div
                id={nameErrorId}
                style={{
                  fontSize: '0.8125rem',
                  color: '#dc2626',
                  marginTop: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--gov-slate-900)',
                marginBottom: '0.35rem',
              }}
            >
              Institutional Email Address <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
            </label>
            <input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? emailErrorId : undefined}
              placeholder="e.g. analyst@ministry.gov.in"
              className="gov-input"
              style={{
                width: '100%',
                borderColor: errors.email ? '#dc2626' : undefined,
              }}
            />
            {errors.email && (
              <div
                id={emailErrorId}
                style={{
                  fontSize: '0.8125rem',
                  color: '#dc2626',
                  marginTop: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Ministry / Department (Optional) */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="ministry"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--gov-slate-900)',
                marginBottom: '0.35rem',
              }}
            >
              Ministry / Institutional Department <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="ministry"
              name="ministry"
              type="text"
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              placeholder="e.g. Ministry of Power / NITI Aayog"
              className="gov-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--gov-slate-900)',
                marginBottom: '0.35rem',
              }}
            >
              Password <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? passwordErrorId : undefined}
                placeholder="At least 8 characters"
                className="gov-input"
                style={{
                  width: '100%',
                  paddingRight: '2.75rem',
                  borderColor: errors.password ? '#dc2626' : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute',
                  right: '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gov-slate-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <div
                id={passwordErrorId}
                style={{
                  fontSize: '0.8125rem',
                  color: '#dc2626',
                  marginTop: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{errors.password}</span>
              </div>
            )}
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--gov-slate-500)',
                marginTop: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Info size={13} aria-hidden="true" />
              <span>
                Minimum {PASSWORD_MIN_LENGTH} characters. Additional complexity rules: {PASSWORD_RULES_STATUS}.
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--gov-slate-900)',
                marginBottom: '0.35rem',
              }}
            >
              Confirm Password <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={confirmPasswordInputRef}
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.confirmPassword;
                      return next;
                    });
                  }
                }}
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
                placeholder="Re-enter password"
                className="gov-input"
                style={{
                  width: '100%',
                  paddingRight: '2.75rem',
                  borderColor: errors.confirmPassword ? '#dc2626' : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                style={{
                  position: 'absolute',
                  right: '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gov-slate-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div
                id={confirmPasswordErrorId}
                style={{
                  fontSize: '0.8125rem',
                  color: '#dc2626',
                  marginTop: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Registering institutional credentials..."
            icon={<UserPlus size={16} aria-hidden="true" />}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
          >
            Create Analytical Account
          </Button>
        </form>

        {/* Existing account link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--gov-slate-600)' }}>
          Already have verified credentials?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--gov-navy-900)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Authenticate here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
