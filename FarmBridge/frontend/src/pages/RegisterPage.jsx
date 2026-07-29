import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        'Registration failed';
      setError(typeof message === 'string' ? message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🌾</span>
          <h1>Join FarmBridge</h1>
          <p>Connect directly with farmers and buyers</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>I want to join as</label>
            <div className="role-selector">
              <label
                className={`role-option ${formData.role === 'FARMER' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="FARMER"
                  checked={formData.role === 'FARMER'}
                  onChange={handleChange}
                />
                <span className="role-icon">👨‍🌾</span>
                <span className="role-label">Farmer</span>
                <span className="role-desc">Sell your products</span>
              </label>
              <label
                className={`role-option ${formData.role === 'BUYER' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="BUYER"
                  checked={formData.role === 'BUYER'}
                  onChange={handleChange}
                />
                <span className="role-icon">🛒</span>
                <span className="role-label">Buyer</span>
                <span className="role-desc">Buy fresh produce</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
