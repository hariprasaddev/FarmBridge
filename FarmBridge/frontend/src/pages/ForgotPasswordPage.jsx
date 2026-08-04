import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import './ForgotPasswordPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submits (covers Enter-key resubmission too)
    if (loading) return;

    // Client-side validation — required + valid email
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // The backend always answers with the same message whether or
      // not the email exists — never reveals account existence.
      await authAPI.forgotPassword({ email: email.trim() });

      setSuccess(true);
      showToast("We've sent a password reset link if your email exists.", 'success');
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Something went wrong. Please try again.'
      );
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-heading">Forgot Password</h1>
      <p className="auth-subtitle">Enter your email address.</p>

      {success && (
        <div className="alert alert-success" role="status">
          We&apos;ve sent a password reset link if your email exists.
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input-wrap">
            <Icon name="mail" size={18} />
            <input
              id="email"
              type="email"
              name="email"
              className="auth-input"
              placeholder="name@example.com"
              value={email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? (
            <>
              <span className="fp-spinner" aria-hidden="true" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <p className="auth-switch">
        <Link to="/login">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
