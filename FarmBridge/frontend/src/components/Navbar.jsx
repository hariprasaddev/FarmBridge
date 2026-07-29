import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { email, role, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🌾</span>
        <Link to="/" className="navbar-title">
          FarmBridge
        </Link>
      </div>

      <div className="navbar-links">
        {role === 'FARMER' && (
          <>
            <Link
              to="/farmer/dashboard"
              className={`nav-link ${isActive('/farmer/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/farmer/profile"
              className={`nav-link ${isActive('/farmer/profile') ? 'active' : ''}`}
            >
              My Profile
            </Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span className="navbar-email">{email}</span>
        <span className={`role-badge role-${role?.toLowerCase()}`}>{role}</span>
        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
