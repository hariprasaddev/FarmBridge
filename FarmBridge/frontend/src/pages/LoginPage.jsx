import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Success message when redirected from registration (state passed by RegisterPage).
  // Show it once, then clear the navigation state so it never reappears.
  useEffect(() => {
    if (location.state?.registered) {
      setShowSuccess(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submits (covers Enter-key resubmission too)
    if (loading) return;

    setError('');

    // Client-side validation — required fields + email format.
    // The backend is never called until these pass.
    const email = formData.email.trim();
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({ email, password: formData.password });
      const data = response.data;
      login(data, rememberMe);
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-heading">Welcome Back</h1>
      <p className="auth-subtitle">Sign in to manage your farm and orders.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {showSuccess && (
        <div className="alert alert-success">
          Registration successful! Please login.
        </div>
      )}

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
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="auth-input auth-input-pad-right"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </div>

        <div className="auth-row">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth-forgot">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <Link to="/register">Sign Up</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
