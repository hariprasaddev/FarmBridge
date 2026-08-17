import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Secure password policy — identical to the backend RegisterRequest rule:
// at least 8 characters, one uppercase, one lowercase, one number and
// one special character.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FARMER',
  });
  // confirmPassword is a frontend-only validation field — it is never
  // sent to the backend or stored anywhere.
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    setError('');
  };

  const validate = () => {
    const next = {};

    if (!formData.name.trim()) {
      next.name = 'Full name is required.';
    }

    const email = formData.email.trim();
    if (!email) {
      next.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email)) {
      next.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      next.password = 'Password is required.';
    } else if (!PASSWORD_PATTERN.test(formData.password)) {
      next.password = PASSWORD_RULES_MESSAGE;
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== formData.password) {
      next.confirmPassword = 'Passwords do not match.';
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submits (covers Enter-key resubmission too)
    if (loading) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setError('');

    // Do NOT call the backend when validation fails.
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      // Send only the fields the existing registration API expects —
      // confirmPassword is a frontend-only check and is never transmitted.
      await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-heading">Create Your Account</h1>
      <p className="auth-subtitle">Join FarmBridge as a Farmer or Buyer.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="name">Full Name</label>
          <div className="auth-input-wrap">
            <Icon name="profile" size={18} />
            <input
              id="name"
              type="text"
              name="name"
              className="auth-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
          {errors.name && <span className="auth-field-error">{errors.name}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="reg-email">Email</label>
          <div className="auth-input-wrap">
            <Icon name="mail" size={18} />
            <input
              id="reg-email"
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
          {errors.email && <span className="auth-field-error">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="auth-input auth-input-pad-right"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
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
          {errors.password && (
            <span className="auth-field-error">{errors.password}</span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="reg-confirm-password">Confirm Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="auth-input auth-input-pad-right"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="auth-toggle"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
              title={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
              aria-pressed={showConfirmPassword}
            >
              <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="auth-field-error">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="auth-field">
          <label>I want to join as</label>
          <div className="auth-roles">
            <label
              className={`auth-role ${formData.role === 'FARMER' ? 'auth-role-selected' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value="FARMER"
                checked={formData.role === 'FARMER'}
                onChange={handleChange}
              />
              <span className="auth-role-icon">🌾</span>
              <span>
                <span className="auth-role-name">Farmer</span>
                <span className="auth-role-desc">Sell your products</span>
              </span>
            </label>
            <label
              className={`auth-role ${formData.role === 'BUYER' ? 'auth-role-selected' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value="BUYER"
                checked={formData.role === 'BUYER'}
                onChange={handleChange}
              />
              <span className="auth-role-icon">🛒</span>
              <span>
                <span className="auth-role-name">Buyer</span>
                <span className="auth-role-desc">Buy fresh produce</span>
              </span>
            </label>
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
