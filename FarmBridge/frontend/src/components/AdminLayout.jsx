import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', isActive: (p) => p === '/admin/dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'users', isActive: (p) => p === '/admin/users' },
  { to: '/admin/products', label: 'Products', icon: 'package', isActive: (p) => p === '/admin/products' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders', isActive: (p) => p === '/admin/orders' },
  { to: '/admin/verification', label: 'Verification', icon: 'shieldCheck', isActive: (p) => p === '/admin/verification' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'mail', isActive: (p) => p === '/admin/announcements' },
];

/**
 * Shared premium shell for every Admin page: dark-green sidebar, topbar,
 * and scrollable content area. No routing or auth changes — pages render
 * inside this layout exactly as before.
 */
function AdminLayout({ title, subtitle, actions, children }) {
  const { email, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Presentational only — derive a clean name from the email local part.
  const rawName = email?.split('@')[0]?.split('.')[0] || '';
  const adminName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Admin';

  return (
    <div className="ad-root">
      {/* ================= Sidebar ================= */}
      <aside className={`ad-sidebar${sidebarOpen ? ' ad-sidebar-open' : ''}`}>
        <div className="ad-sidebar-inner">
          <div className="ad-logo">
            <span className="ad-logo-mark">
              <Icon name="sprout" size={20} />
            </span>
            <span className="ad-logo-text">
              FarmBridge
              <small>Admin Console</small>
            </span>
            <button
              className="ad-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <nav className="ad-nav" aria-label="Admin navigation">
            <p className="ad-nav-label">Menu</p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`ad-nav-item${item.isActive(location.pathname) ? ' ad-nav-item-active' : ''}`}
                aria-current={item.isActive(location.pathname) ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="ad-sidebar-bottom">
            <div className="ad-user-card">
              <span className="ad-user-avatar">{adminName.charAt(0)}</span>
              <div className="ad-user-info">
                <p className="ad-user-name">{adminName}</p>
                <p className="ad-user-role">Administrator</p>
              </div>
            </div>
            <button className="ad-logout" onClick={logout}>
              <Icon name="logout" size={17} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="ad-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ================= Main content ================= */}
      <div className="ad-main">
        <div className="ad-main-inner">
          <header className="ad-topbar">
            <button
              className="ad-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" size={21} />
            </button>
            <div className="ad-topbar-title">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="ad-topbar-actions">{actions}</div>}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
