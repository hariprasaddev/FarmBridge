import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { farmerProductsAPI, farmerOrdersAPI, farmerProfileAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import './FarmerDashboard.css';

const NAV_ITEMS = [
  { to: '/farmer/dashboard', label: 'Dashboard', icon: 'dashboard', isActive: (p) => p === '/farmer/dashboard' },
  { to: '/farmer/products', label: 'My Products', icon: 'package', isActive: (p) => p.startsWith('/farmer/products') },
  { to: '/farmer/orders', label: 'Orders', icon: 'orders', isActive: (p) => p === '/farmer/orders' },
  { to: '/farmer/profile', label: 'Profile', icon: 'profile', isActive: (p) => p === '/farmer/profile' },
];

function FarmerDashboard() {
  const { email, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      // Products and orders are required; profile may 404 (not created yet)
      const [productsRes, ordersRes] = await Promise.all([
        farmerProductsAPI.getMyProducts(),
        farmerOrdersAPI.getOrders(),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your dashboard data. Please try again.'));
      setLoading(false);
      return;
    }

    // Profile is optional — a new farmer may not have one yet (404)
    try {
      const profileRes = await farmerProfileAPI.getProfile();
      setProfile(profileRes.data);
    } catch (err) {
      setProfile(null);
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err, 'Failed to load your farm profile.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Presentational only — derive a clean first name from the email local part
  // (e.g. "hari@…" → "Hari", "demo.farmer.2026@…" → "Demo").
  const rawName = email?.split('@')[0]?.split('.')[0] || '';
  const firstName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Farmer';

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const rejectedOrders = orders.filter((o) => o.status === 'REJECTED').length;
  const recentOrders = orders.slice(0, 5);

  const statCards = [
    {
      label: 'Products Listed',
      value: products.length,
      desc: 'Live on the marketplace',
      icon: 'package',
      tone: 'green',
      to: '/farmer/products',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      desc: 'Awaiting your review',
      icon: 'clock',
      tone: 'amber',
      to: '/farmer/orders',
    },
    {
      label: 'Accepted Orders',
      value: acceptedOrders,
      desc: 'Currently in progress',
      icon: 'checkCircle',
      tone: 'emerald',
      to: '/farmer/orders',
    },
    {
      label: 'Completed Orders',
      value: completedOrders,
      desc: 'Delivered successfully',
      icon: 'flag',
      tone: 'blue',
      to: '/farmer/orders',
    },
    {
      label: 'Rejected Orders',
      value: rejectedOrders,
      desc: 'Declined requests',
      icon: 'xCircle',
      tone: 'red',
      to: '/farmer/orders',
    },
    {
      label: 'Profile Status',
      value: profile ? 'Set' : 'Not set',
      desc: profile ? 'Farm profile complete' : 'Complete to get orders',
      icon: 'shieldCheck',
      tone: 'indigo',
      to: '/farmer/profile',
    },
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fd-root">
      {/* ================= Sidebar ================= */}
      <aside className={`fd-sidebar${sidebarOpen ? ' fd-sidebar-open' : ''}`}>
        <div className="fd-sidebar-inner">
          <div className="fd-logo">
            <span className="fd-logo-mark">
              <Icon name="sprout" size={20} />
            </span>
            <span className="fd-logo-text">
              FarmBridge
              <small>Farmer Portal</small>
            </span>
            <button
              className="fd-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <nav className="fd-nav" aria-label="Farmer navigation">
            <p className="fd-nav-label">Menu</p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`fd-nav-item${item.isActive(location.pathname) ? ' fd-nav-item-active' : ''}`}
                aria-current={item.isActive(location.pathname) ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="fd-sidebar-bottom">
            <div className="fd-user-card">
              <span className="fd-user-avatar">{firstName.charAt(0)}</span>
              <div className="fd-user-info">
                <p className="fd-user-name">{firstName}</p>
                <p className="fd-user-role">Farmer</p>
              </div>
            </div>
            <button className="fd-logout" onClick={logout}>
              <Icon name="logout" size={17} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fd-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ================= Main content ================= */}
      <div className="fd-main">
        <div className="fd-main-inner">
          <header className="fd-topbar">
            <button
              className="fd-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" size={21} />
            </button>
            <div className="fd-topbar-title">
              <h1>Dashboard</h1>
              <p>{today}</p>
            </div>
            <span className="fd-topbar-badge">Farmer</span>
          </header>

          {loading ? (
            <div className="fd-loading">
              <div className="spinner" />
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <div className="fd-content">
              {error && <div className="alert alert-error">{error}</div>}

              {/* ============ Hero / Welcome ============ */}
              <section className="fd-hero">
                <div className="fd-hero-deco fd-hero-deco-1" />
                <div className="fd-hero-deco fd-hero-deco-2" />
                <div className="fd-hero-deco fd-hero-deco-3" />
                <span className="fd-hero-watermark">
                  <Icon name="sprout" size={220} />
                </span>

                <div className="fd-hero-content">
                  <span className="fd-hero-eyebrow">
                    <Icon name="sprout" size={14} /> FarmBridge Dashboard
                  </span>
                  <h1>Welcome back, {firstName}</h1>
                  <p>
                    {profile
                      ? `Your farm profile is verified and active — buyers can discover your products and place orders.`
                      : `Complete your farm profile so buyers can find and trust your farm.`}
                  </p>
                  {!profile && (
                    <Link to="/farmer/profile" className="fd-hero-cta">
                      Set up your farm profile
                      <Icon name="arrow" size={16} />
                    </Link>
                  )}
                </div>

                <div className="fd-hero-side">
                  <span className={`fd-verified-pill${profile ? '' : ' fd-verified-pill-pending'}`}>
                    <Icon name={profile ? 'badgeCheck' : 'shieldCheck'} size={16} />
                    {profile ? 'Verified & Active' : 'Profile Pending'}
                  </span>
                  <div className="fd-hero-stats">
                    <div className="fd-hero-stat">
                      <strong>{products.length}</strong>
                      <span>Products</span>
                    </div>
                    <div className="fd-hero-stat">
                      <strong>{orders.length}</strong>
                      <span>Orders</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ============ Statistics ============ */}
              <section className="fd-section">
                <div className="fd-section-head">
                  <h2>Overview</h2>
                  <p>Your farm at a glance</p>
                </div>
                <div className="fd-stats-grid">
                  {statCards.map((card) => (
                    <Link key={card.label} to={card.to} className="fd-stat-card">
                      <div className="fd-stat-top">
                        <span className={`fd-stat-icon fd-stat-icon-${card.tone}`}>
                          <Icon name={card.icon} size={20} />
                        </span>
                        <span className="fd-stat-arrow">
                          <Icon name="arrow" size={16} />
                        </span>
                      </div>
                      <div className="fd-stat-value">{card.value}</div>
                      <div className="fd-stat-label">{card.label}</div>
                      <div className="fd-stat-desc">{card.desc}</div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* ============ Quick Actions ============ */}
              <section className="fd-section">
                <div className="fd-section-head">
                  <h2>Quick Actions</h2>
                  <p>Jump back in</p>
                </div>
                <div className="fd-actions-grid">
                  <Link to="/farmer/products/add" className="fd-action-card">
                    <span className="fd-action-icon fd-action-icon-green">
                      <Icon name="packagePlus" size={24} />
                    </span>
                    <div className="fd-action-body">
                      <h3>Add New Product</h3>
                      <p>List a fresh product on the marketplace</p>
                    </div>
                    <span className="fd-action-arrow">
                      <Icon name="arrow" size={18} />
                    </span>
                  </Link>
                  <Link to="/farmer/orders" className="fd-action-card">
                    <span className="fd-action-icon fd-action-icon-amber">
                      <Icon name="orders" size={24} />
                    </span>
                    <div className="fd-action-body">
                      <h3>View Orders</h3>
                      <p>Review and manage incoming buyer orders</p>
                    </div>
                    <span className="fd-action-arrow">
                      <Icon name="arrow" size={18} />
                    </span>
                  </Link>
                </div>
              </section>

              {/* ============ Recent Orders ============ */}
              <section className="fd-section">
                <div className="fd-orders-card">
                  <div className="fd-orders-head">
                    <div>
                      <h2>Recent Orders</h2>
                      <p className="fd-orders-sub">Your latest buyer orders</p>
                    </div>
                    <Link to="/farmer/orders" className="fd-view-all">
                      View all
                      <Icon name="arrow" size={15} />
                    </Link>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="fd-orders-empty">
                      <span className="fd-orders-empty-icon">
                        <Icon name="orders" size={26} />
                      </span>
                      <h3>No orders received</h3>
                      <p>When buyers order your products, they&apos;ll appear here.</p>
                      <Link to="/farmer/products" className="btn btn-primary btn-sm">
                        Browse your products
                      </Link>
                    </div>
                  ) : (
                    <div className="fd-table-wrap">
                      <table className="fd-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Product</th>
                            <th>Buyer</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="fd-order-id">#{order.id}</td>
                              <td className="fd-product-cell">
                                <span className="fd-product-dot" />
                                {order.productName}
                              </td>
                              <td>{order.buyerName}</td>
                              <td className="fd-qty">{order.quantity}</td>
                              <td className="fd-price">₹{order.totalPrice?.toLocaleString()}</td>
                              <td>
                                <OrderStatusBadge status={order.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
