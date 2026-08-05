import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import './AppLayout.css';

const COLLAPSE_KEY = 'farmbridge.sidebar.collapsed';

/**
 * Global authenticated shell: TopNavbar always visible; Sidebar shown for
 * roles/pages that don't already own their own shell (ADMIN pages and the
 * Farmer Dashboard render their own sidebars, so they only get the top bar).
 *
 * Routing is untouched — children (the <Routes>) render in the content area.
 */
function AppLayout({ children }) {
  const { email, role, logout } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — ignore */
    }
  }, [collapsed]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isFarmerDashboard = role === 'FARMER' && location.pathname.startsWith('/farmer/dashboard');
  const showSidebar = role === 'BUYER' || (role === 'FARMER' && !isFarmerDashboard);

  const toggleCollapse = () => setCollapsed((c) => !c);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="fb-applayout">
      <TopNavbar
        role={role}
        email={email}
        logout={logout}
        showSidebar={showSidebar}
        collapsed={collapsed}
        onMenuClick={() => setMobileOpen(true)}
        onToggleCollapse={toggleCollapse}
      />

      <div className="fb-applayout-body">
        {showSidebar && (
          <Sidebar
            role={role}
            email={email}
            logout={logout}
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onCloseMobile={closeMobile}
          />
        )}

        <main
          className={`main-content fb-applayout-content${
            showSidebar
              ? collapsed
                ? ' fb-applayout-content-sidebar-collapsed'
                : ' fb-applayout-content-sidebar'
              : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
