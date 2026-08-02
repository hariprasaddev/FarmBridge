import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FARMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.register(formData);
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

      <form onSubmit={handleSubmit} className="auth-form">
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
              required
            />
          </div>
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
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={18} />
            <input
              id="reg-password"
              type="password"
              name="password"
              className="auth-input"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
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
