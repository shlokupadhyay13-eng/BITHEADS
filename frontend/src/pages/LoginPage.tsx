import { useState, useRef, useId } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Landmark, Eye, EyeOff, ShieldCheck, AlertCircle, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { validateEmail, validatePassword } from '../constants/auth';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const emailErrorId = useId();
  const passwordErrorId = useId();

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after authentication
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validateForm = (): { isValid: boolean; formErrors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) newErrors.password = passwordErr;

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, formErrors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const { isValid, formErrors } = validateForm();
    if (!isValid) {
      // Focus the first invalid field or summary
      setTimeout(() => {
        if (formErrors.email) {
          emailInputRef.current?.focus();
        } else if (formErrors.password) {
          passwordInputRef.current?.focus();
        } else {
          errorSummaryRef.current?.focus();
        }
      }, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Invalid credentials or authentication failure.';
      setApiError(msg);
      // Focus error summary upon API rejection
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
          maxWidth: '480px',
          boxShadow: 'var(--shadow-lg)',
          borderTop: '4px solid var(--gov-navy-900)',
          padding: '2rem',
        }}
      >
        {/* Portal Branding Header */}
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
            PolicyIntelligence Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', margin: 0 }}>
            Government Policies & Statutory Reports Analyser
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
            Official Institutional Access
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
                  There is a problem with your submission
                </h2>
                {apiError && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gov-error-text)', margin: '0 0 0.5rem 0' }}>
                    {apiError}
                  </p>
                )}
                {Object.keys(errors).length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--gov-error-text)' }}>
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
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
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
              placeholder="e.g. analyst@intelligence.gov.in"
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

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label
                htmlFor="password"
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--gov-slate-900)',
                }}
              >
                Official Password <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
                placeholder="Enter statutory access password"
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
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Verifying credentials..."
            icon={<LogIn size={16} aria-hidden="true" />}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
          >
            Authenticate & Enter Portal
          </Button>
        </form>

        {/* Demo Mode Quick Access Notice */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--gov-slate-100)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--gov-slate-700)',
            borderLeft: '3px solid var(--gov-navy-800)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--gov-navy-950)' }}>
            <CheckCircle size={14} aria-hidden="true" />
            Evaluation / Hackathon Testing Credentials:
          </div>
          <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            Email: <strong>analyst@intelligence.gov.in</strong>
            <br />
            Password: <strong>GovPolicy2026!</strong>
          </div>
        </div>

        {/* Registration Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--gov-slate-600)' }}>
          Need new analytical credentials?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--gov-navy-900)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Register Institutional Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
