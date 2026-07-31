import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { email, role, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isProductActive = location.pathname.startsWith('/farmer/products');
  const isBuyerProductActive = location.pathname.startsWith('/buyer/products');

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
            <Link
              to="/farmer/products"
              className={`nav-link ${isProductActive ? 'active' : ''}`}
            >
              My Products
            </Link>
            <Link
              to="/farmer/orders"
              className={`nav-link ${isActive('/farmer/orders') ? 'active' : ''}`}
            >
              Orders
            </Link>
          </>
        )}

        {role === 'BUYER' && (
          <>
            <Link
              to="/buyer/products"
              className={`nav-link ${isBuyerProductActive ? 'active' : ''}`}
            >
              Browse Products
            </Link>
            <Link
              to="/buyer/orders"
              className={`nav-link ${isActive('/buyer/orders') ? 'active' : ''}`}
            >
              My Orders
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
