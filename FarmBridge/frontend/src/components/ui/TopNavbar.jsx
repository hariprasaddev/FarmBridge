import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaLeaf, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import NotificationBell from '../NotificationBell';
import ProfileDropdown from './ProfileDropdown';
import SearchBar from './SearchBar';
import Breadcrumb from './Breadcrumb';
import { NAV_CONFIG, ROLE_LABELS } from '../../config/navigation';
import './TopNavbar.css';

/**
 * Global top bar: mobile/drawer & collapse toggles, brand, breadcrumb,
 * search (routes to the role's catalogue on Enter), notification bell and
 * profile dropdown.
 *
 * Props:
 * - role / email / name / logout: identity
 * - onMenuClick: opens the sidebar drawer (mobile)
 * - onToggleCollapse: collapses/expands the sidebar (desktop)
 * - showSidebar: whether the sidebar is visible (drives which toggle shows)
 * - collapsed: sidebar collapse state
 */
function TopNavbar({
  role = '',
  email = '',
  name = '',
  logout = () => {},
  onMenuClick = () => {},
  onToggleCollapse = () => {},
  showSidebar = true,
  collapsed = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const items = NAV_CONFIG[role] || [];
  const current = items.find((i) => i.match(location.pathname));
  const isNotifications = location.pathname === '/notifications';

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: ROLE_LABELS[role] || role },
    current && { label: current.label },
    isNotifications && { label: 'Notifications' },
  ].filter(Boolean);

  const cataloguePath =
    role === 'FARMER' ? '/farmer/products' : role === 'ADMIN' ? '/admin/products' : '/buyer/products';

  const submitSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setQuery('');
    navigate(cataloguePath);
  };

  return (
    <header className="fb-topbar">
      <div className="fb-topbar-left">
        {showSidebar && (
          <>
            <button
              type="button"
              className="fb-topbar-icon-btn fb-topbar-hamburger"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <FaBars size={17} />
            </button>
            <button
              type="button"
              className="fb-topbar-icon-btn fb-topbar-collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
            </button>
          </>
        )}
        <span className="fb-topbar-brand">
          <span className="fb-topbar-brand-mark" aria-hidden="true">
            <FaLeaf size={16} />
          </span>
          FarmBridge
        </span>
        <div className="fb-topbar-breadcrumb">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <form className="fb-topbar-search" onSubmit={submitSearch} role="search">
        <SearchBar
          compact
          placeholder={`Search ${role === 'BUYER' ? 'products' : 'catalogue'}…`}
          value={query}
          onChange={setQuery}
        />
      </form>

      <div className="fb-topbar-right">
        <span className="fb-topbar-bell">
          <NotificationBell />
        </span>
        <ProfileDropdown email={email} role={role} name={name} logout={logout} />
      </div>
    </header>
  );
}

export default TopNavbar;
