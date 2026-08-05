import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaSignOutAlt, FaLeaf } from 'react-icons/fa';
import Avatar from './Avatar';
import { NAV_CONFIG, COMMON_NAV } from '../../config/navigation';
import './Sidebar.css';

const COLLAPSE_KEY = 'farmbridge.sidebar.collapsed';

/**
 * Enterprise sidebar: role-aware items (react-icons), active highlight,
 * desktop collapse/expand (persisted), mobile drawer + backdrop, and a
 * user profile section with logout.
 *
 * Props:
 * - role: FARMER | BUYER | ADMIN
 * - email / name: for the profile section
 * - collapsed / onToggleCollapse: controlled collapse state
 * - mobileOpen / onCloseMobile: controlled mobile drawer state
 * - logout: callback
 * - badgeFn: optional (item) => number | undefined for per-item counters
 */
function Sidebar({
  role,
  email = '',
  name = '',
  collapsed = false,
  mobileOpen = false,
  onCloseMobile = () => {},
  logout = () => {},
  badgeFn = null,
}) {
  const location = useLocation();
  const items = NAV_CONFIG[role] || [];
  const displayName = name || email?.split('@')[0]?.split('.')[0] || 'User';
  const prettyName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  const renderItem = (item, i) => {
    const active = item.match(location.pathname);
    const badge = badgeFn ? badgeFn(item, location.pathname) : null;
    return (
      <Link
        key={item.to + i}
        to={item.to}
        className={`fb-sb-item${active ? ' fb-sb-item-active' : ''}`}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        onClick={() => mobileOpen && onCloseMobile()}
      >
        <span aria-hidden="true">{item.icon}</span>
        <span className="fb-sb-item-text">{item.label}</span>
        {badge !== null && badge !== undefined && (
          <span className="fb-sb-badge" aria-label={`${badge} ${item.label}`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {mobileOpen && <div className="fb-sb-backdrop" onClick={onCloseMobile} />}
      <aside
        className={`fb-sidebar${collapsed ? ' fb-sidebar-collapsed' : ''}${
          mobileOpen ? ' fb-sb-mobile-open' : ''
        }`}
        aria-label="Primary navigation"
      >
        <div className="fb-sb-logo">
          <span className="fb-sb-logo-mark" aria-hidden="true">
            <FaLeaf size={19} />
          </span>
          <span className="fb-sb-logo-text">
            FarmBridge
            <small>Marketplace</small>
          </span>
          <button
            type="button"
            className="fb-sb-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <nav className="fb-sb-nav">
          <p className="fb-sb-label">Menu</p>
          {items.map(renderItem)}
          <p className="fb-sb-label">General</p>
          {COMMON_NAV.map(renderItem)}
        </nav>

        <div className="fb-sb-bottom">
          <div className="fb-sb-user" title={collapsed ? prettyName : undefined}>
            <Avatar name={prettyName} size="sm" />
            <span className="fb-sb-user-info">
              <span className="fb-sb-user-name">{prettyName}</span>
              <span className="fb-sb-user-role">{role}</span>
            </span>
          </div>
          <button type="button" className="fb-sb-logout" onClick={logout}>
            <FaSignOutAlt size={15} aria-hidden="true" />
            <span className="fb-sb-item-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
