import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import './ResetPasswordPage.css';

const MIN_PASSWORD_LENGTH = 8;

// Lightweight strength scoring — no external library.
function strengthScore(password) {
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function strengthMeta(score) {
  if (score <= 2) return { label: 'Weak', tone: 'weak' };
  if (score <= 4) return { label: 'Fair', tone: 'fair' };
  return { label: 'Strong', tone: 'strong' };
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const score = useMemo(() => strengthScore(newPassword), [newPassword]);
  const strength = useMemo(() => strengthMeta(score), [score]);

  const validate = () => {
    const next = {};

    if (!newPassword) {
      next.newPassword = 'New password is required.';
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      next.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    return next;
  };

  // Token missing → the link is broken (e.g. copied without the query).
  if (!token) {
    return (
      <AuthLayout>
        <h1 className="auth-heading">Reset Password</h1>
        <div className="alert alert-error" role="alert">
          Invalid password reset link.
        </div>
        <p className="auth-switch">
          <Link to="/forgot-password">Request a new link</Link>
          <span className="rp-switch-sep">·</span>
          <Link to="/login">Back to Login</Link>
        </p>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submits (covers Enter-key resubmission too)
    if (loading) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      await authAPI.resetPassword({ token, newPassword });

      showToast('Password reset successful.', 'success');

      // Give the toast a moment to be seen, then go to login.
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Unable to reset your password. Please try again.'
      );
      setServerError(message);
      showToast(message, 'error');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-heading">Reset Password</h1>
      <p className="auth-subtitle">Choose a new password for your account.</p>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="newPassword">New Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              name="newPassword"
              className="auth-input rp-input"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: '' }));
              }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="rp-toggle"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
              aria-pressed={showNew}
            >
              <Icon name={showNew ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
          {errors.newPassword && (
            <span className="rp-field-error">{errors.newPassword}</span>
          )}
        </div>

        {/* Strength indicator */}
        {newPassword && (
          <div className="rp-strength" aria-live="polite">
            <div className="rp-strength-bar">
              <span
                className={`rp-strength-fill rp-strength-${strength.tone}`}
                style={{ width: `${Math.max(score / 6, 0.08) * 100}%` }}
              />
            </div>
            <span className={`rp-strength-label rp-strength-${strength.tone}`}>
              {strength.label}
            </span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              className="auth-input rp-input"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="rp-toggle"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
              aria-pressed={showConfirm}
            >
              <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="rp-field-error">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? (
            <>
              <span className="rp-spinner" aria-hidden="true" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <p className="auth-switch">
        <Link to="/login">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
