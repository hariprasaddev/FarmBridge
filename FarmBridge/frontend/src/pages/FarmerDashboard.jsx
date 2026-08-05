import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  analyticsAPI,
  farmerVerificationAPI,
  getErrorMessage,
} from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import AnimatedNumber from '../components/AnimatedNumber';
import Icon from '../components/Icon';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  FaCalendarDay,
  FaClock,
  FaCheckCircle,
  FaFlagCheckered,
  FaTimesCircle,
  FaRupeeSign,
  FaBoxOpen,
  FaStar,
  FaCommentDots,
  FaUsers,
  FaChartLine,
  FaTrophy,
} from 'react-icons/fa';
import './FarmerDashboard.css';
import './FarmerDashboardAnalytics.css';

const NAV_ITEMS = [
  { to: '/farmer/dashboard', label: 'Dashboard', icon: 'dashboard', isActive: (p) => p === '/farmer/dashboard' },
  { to: '/farmer/products', label: 'My Products', icon: 'package', isActive: (p) => p.startsWith('/farmer/products') },
  { to: '/farmer/orders', label: 'Orders', icon: 'orders', isActive: (p) => p === '/farmer/orders' },
  { to: '/farmer/profile', label: 'Profile', icon: 'profile', isActive: (p) => p === '/farmer/profile' },
  { to: '/farmer/verification', label: 'Verification', icon: 'shieldCheck', isActive: (p) => p === '/farmer/verification' },
];

const inr = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const monthLabel = (year, month) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const timeAgo = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

function FaTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="fa-tooltip">
      <p className="fa-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="fa-tooltip-row">
          <span className="fa-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
          <span>{entry.name}</span>
          <strong>
            {currency ? inr(entry.value) : Number(entry.value ?? 0).toLocaleString('en-IN')}
          </strong>
        </p>
      ))}
    </div>
  );
}

function FaEmpty({ message }) {
  return (
    <div className="fa-empty">
      <span className="fa-empty-icon"><Icon name="chart" size={22} /></span>
      <span>{message || 'No data yet'}</span>
    </div>
  );
}

function FarmerDashboard() {
  const { email, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const analyticsRes = await analyticsAPI.farmerAnalytics();
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your analytics. Please try again.'));
    }

    // Verification status — 404 simply means no submission yet
    try {
      const verificationRes = await farmerVerificationAPI.getVerification();
      setVerification(verificationRes.data);
    } catch (err) {
      setVerification(null);
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err, 'Failed to load your verification status.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const rawName = email?.split('@')[0]?.split('.')[0] || '';
  const firstName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Farmer';

  const verificationStatus = verification?.verificationStatus;
  const isVerified = verificationStatus === 'APPROVED';
  const isPending = verificationStatus === 'PENDING';
  const isRejected = verificationStatus === 'REJECTED';

  const totalOrders =
    (analytics?.pendingOrders || 0) +
    (analytics?.acceptedOrders || 0) +
    (analytics?.completedOrders || 0) +
    (analytics?.rejectedOrders || 0);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ----- Cards -----
  const cards = [
    { label: "Today's Orders", value: analytics?.todayOrders || 0, icon: FaCalendarDay, tone: 'green', to: '/farmer/orders', sub: 'Received today' },
    { label: 'Pending Orders', value: analytics?.pendingOrders || 0, icon: FaClock, tone: 'amber', to: '/farmer/orders', sub: 'Awaiting your review' },
    { label: 'Accepted Orders', value: analytics?.acceptedOrders || 0, icon: FaCheckCircle, tone: 'emerald', to: '/farmer/orders', sub: 'In progress' },
    { label: 'Completed Orders', value: analytics?.completedOrders || 0, icon: FaFlagCheckered, tone: 'blue', to: '/farmer/orders', sub: 'Delivered' },
    { label: 'Rejected Orders', value: analytics?.rejectedOrders || 0, icon: FaTimesCircle, tone: 'red', to: '/farmer/orders', sub: 'Declined' },
    { label: 'Monthly Revenue', value: analytics?.monthlyRevenue || 0, icon: FaRupeeSign, tone: 'purple', to: '/farmer/orders', sub: 'Completed this month', currency: true },
    { label: 'Total Revenue', value: analytics?.totalRevenue || 0, icon: FaRupeeSign, tone: 'green', to: '/farmer/orders', sub: 'All-time earnings', currency: true },
    { label: 'Products', value: analytics?.products || 0, icon: FaBoxOpen, tone: 'teal', to: '/farmer/products', sub: 'Listed on marketplace' },
    { label: 'Average Rating', value: analytics?.averageRating || 0, icon: FaStar, tone: 'orange', to: '/farmer/products', sub: 'Across your products', decimal: true },
    { label: 'Reviews', value: analytics?.reviews || 0, icon: FaCommentDots, tone: 'pink', to: '/farmer/products', sub: 'Customer feedback' },
    { label: 'Customers', value: analytics?.customers || 0, icon: FaUsers, tone: 'indigo', to: '/farmer/orders', sub: 'Unique buyers' },
  ];

  // ----- Charts -----
  const revenueTrend = (analytics?.revenueTrend || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Revenue: Math.round(m.value),
  }));
  const ordersTrend = (analytics?.ordersTrend || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Orders: m.count,
  }));
  const salesPerProduct = (analytics?.salesPerProduct || []).map((p) => ({
    name: p.productName,
    Quantity: p.quantity,
  }));
  const salesPerMonth = (analytics?.salesPerMonth || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Sales: Math.round(m.value),
  }));
  const ratingTrend = (analytics?.ratingTrend || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Rating: Number(m.value.toFixed(1)),
    Reviews: m.count,
  }));
  const categorySales = (analytics?.categorySales || []).map((c) => ({
    name: c.category,
    Quantity: c.quantity,
  }));

  const best = analytics?.bestSellingProduct;
  const lowStock = analytics?.lowStockProducts || [];
  const recentReviews = analytics?.recentReviews || [];
  const recentOrders = analytics?.recentOrders || [];
  const topCustomers = analytics?.topCustomers || [];

  return (
    <div className="fd-root">
      {/* ================= Sidebar ================= */}
      <aside className={`fd-sidebar${sidebarOpen ? ' fd-sidebar-open' : ''}`}>
        <div className="fd-sidebar-inner">
          <div className="fd-logo">
            <span className="fd-logo-mark"><Icon name="sprout" size={20} /></span>
            <span className="fd-logo-text">
              FarmBridge
              <small>Farmer Portal</small>
            </span>
            <button className="fd-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
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
            <button className="fd-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Icon name="menu" size={21} />
            </button>
            <div className="fd-topbar-title">
              <h1>Analytics Dashboard</h1>
              <p>{today}</p>
            </div>
            <span className="fd-topbar-badge">Farmer</span>
          </header>

          {loading ? (
            <div className="fd-loading">
              <div className="fa-skeleton-grid">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="fa-skeleton fa-skeleton-card" />
                ))}
              </div>
              <div className="fa-skeleton-grid fa-skeleton-grid--2">
                <div className="fa-skeleton fa-skeleton-chart" />
                <div className="fa-skeleton fa-skeleton-chart" />
              </div>
            </div>
          ) : (
            <div className="fd-content">
              {error && <div className="alert alert-error">{error}</div>}

              {/* ============ Verification status banner ============ */}
              {isRejected && (
                <div className="alert alert-error fd-verif-banner">
                  <strong>Verification rejected.</strong> Reason:{' '}
                  {verification?.rejectionReason || 'No reason provided.'} Please
                  update your information and resubmit.{' '}
                  <Link to="/farmer/verification" className="fd-banner-link">Resubmit</Link>
                </div>
              )}
              {isPending && (
                <div className="alert alert-warning fd-verif-banner">
                  <Icon name="clock" size={15} />
                  Your verification request is under review. Product creation is
                  temporarily locked.{' '}
                  <Link to="/farmer/verification" className="fd-banner-link">View status</Link>
                </div>
              )}
              {!verificationStatus && (
                <div className="alert alert-warning fd-verif-banner">
                  <Icon name="shieldCheck" size={15} />
                  Complete your farmer verification to start selling on FarmBridge.{' '}
                  <Link to="/farmer/verification" className="fd-banner-link">Start verification</Link>
                </div>
              )}

              {/* ============ Hero / Welcome ============ */}
              <section className="fd-hero">
                <div className="fd-hero-deco fd-hero-deco-1" />
                <div className="fd-hero-deco fd-hero-deco-2" />
                <div className="fd-hero-deco fd-hero-deco-3" />
                <span className="fd-hero-watermark"><Icon name="sprout" size={220} /></span>

                <div className="fd-hero-content">
                  <span className="fd-hero-eyebrow"><Icon name="sprout" size={14} /> FarmBridge Dashboard</span>
                  <h1>Welcome back, {firstName}</h1>
                  <p>
                    {isVerified
                      ? 'Your account is verified — buyers can discover your products and place orders.'
                      : 'Complete your farmer verification to start selling on FarmBridge.'}
                  </p>
                  {!isVerified && (
                    <Link to="/farmer/verification" className="fd-hero-cta">
                      {isPending ? 'View verification status' : isRejected ? 'Resubmit verification' : 'Start verification'}
                      <Icon name="arrow" size={16} />
                    </Link>
                  )}
                </div>

                <div className="fd-hero-side">
                  <span className={`fd-verified-pill${isVerified ? '' : ' fd-verified-pill-pending'}`}>
                    <Icon name={isVerified ? 'badgeCheck' : 'shieldCheck'} size={16} />
                    {isVerified ? 'Verified Farmer' : isPending ? 'Under Review' : isRejected ? 'Verification Rejected' : 'Verification Pending'}
                  </span>
                  <div className="fd-hero-stats">
                    <div className="fd-hero-stat">
                      <strong>{analytics?.products || 0}</strong>
                      <span>Products</span>
                    </div>
                    <div className="fd-hero-stat">
                      <strong>{totalOrders}</strong>
                      <span>Orders</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ============ Stat cards ============ */}
              <section className="fd-section">
                <div className="fd-section-head">
                  <h2>Business Overview</h2>
                  <p>Your farm at a glance</p>
                </div>
                <div className="fa-cards">
                  {cards.map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <Link key={card.label} to={card.to} className="fa-card">
                        <div className="fa-card-top">
                          <span className={`fa-card-icon fa-card-icon-${card.tone}`}>
                            <CardIcon size={18} />
                          </span>
                          <span className="fa-card-arrow"><Icon name="arrow" size={14} /></span>
                        </div>
                        <div className="fa-card-value">
                          {card.currency ? (
                            <AnimatedNumber value={card.value} format={inr} />
                          ) : card.decimal ? (
                            <AnimatedNumber value={card.value} format={(v) => v.toFixed(1)} />
                          ) : (
                            <AnimatedNumber value={card.value} />
                          )}
                        </div>
                        <div className="fa-card-label">{card.label}</div>
                        <div className="fa-card-sub">{card.sub}</div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* ============ Quick Actions ============ */}
              <section className="fd-section">
                <div className="fd-section-head">
                  <h2>Quick Actions</h2>
                  <p>Jump back in</p>
                </div>
                <div className="fd-actions-grid">
                  {isVerified ? (
                    <Link to="/farmer/products/add" className="fd-action-card">
                      <span className="fd-action-icon fd-action-icon-green"><Icon name="packagePlus" size={24} /></span>
                      <div className="fd-action-body">
                        <h3>Add New Product</h3>
                        <p>List a fresh product on the marketplace</p>
                      </div>
                      <span className="fd-action-arrow"><Icon name="arrow" size={18} /></span>
                    </Link>
                  ) : (
                    <div className="fd-action-card fd-action-card-locked">
                      <span className="fd-action-icon fd-action-icon-amber"><Icon name="lock" size={24} /></span>
                      <div className="fd-action-body">
                        <h3>Add New Product</h3>
                        <p>Available after your account is verified</p>
                      </div>
                      <Link to="/farmer/verification" className="fd-banner-link fd-locked-link">Verify account</Link>
                    </div>
                  )}
                  <Link to="/farmer/orders" className="fd-action-card">
                    <span className="fd-action-icon fd-action-icon-amber"><Icon name="orders" size={24} /></span>
                    <div className="fd-action-body">
                      <h3>View Orders</h3>
                      <p>Review and manage incoming buyer orders</p>
                    </div>
                    <span className="fd-action-arrow"><Icon name="arrow" size={18} /></span>
                  </Link>
                </div>
              </section>

              {/* ============ Charts ============ */}
              <section className="fd-section">
                <div className="fd-section-head">
                  <h2>Performance Charts</h2>
                  <p>Real sales and rating trends</p>
                </div>
                <div className="fa-charts">
                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Revenue Trend</h3>
                        <p>Completed order revenue per month</p>
                      </div>
                      <FaRupeeSign className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {revenueTrend.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                            <Tooltip content={<FaTooltip currency />} />
                            <Line type="monotone" dataKey="Revenue" stroke="#2e7d32" strokeWidth={2.5} dot={{ r: 3, fill: '#2e7d32' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Orders Trend</h3>
                        <p>Orders received per month</p>
                      </div>
                      <FaChartLine className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {ordersTrend.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ordersTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                            <Tooltip content={<FaTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                            <Bar dataKey="Orders" fill="#66bb6a" radius={[5, 5, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Sales Per Month</h3>
                        <p>Order value per month</p>
                      </div>
                      <FaRupeeSign className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {salesPerMonth.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={salesPerMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                            <Tooltip content={<FaTooltip currency />} />
                            <Line type="monotone" dataKey="Sales" stroke="#26a69a" strokeWidth={2.5} dot={{ r: 3, fill: '#26a69a' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Sales Per Product</h3>
                        <p>Quantity ordered by product</p>
                      </div>
                      <FaBoxOpen className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {salesPerProduct.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesPerProduct} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval={0} angle={-14} textAnchor="end" height={46} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                            <Tooltip content={<FaTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                            <Bar dataKey="Quantity" fill="#5c6bc0" radius={[5, 5, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Rating Trend</h3>
                        <p>Average rating per month</p>
                      </div>
                      <FaStar className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {ratingTrend.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={ratingTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
                            <Tooltip content={<FaTooltip />} />
                            <Line type="monotone" dataKey="Rating" stroke="#f9a825" strokeWidth={2.5} dot={{ r: 3, fill: '#f9a825' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="fa-panel">
                    <div className="fa-panel-head">
                      <div>
                        <h3>Category Sales</h3>
                        <p>Quantity sold by category</p>
                      </div>
                      <FaChartLine className="fa-panel-icon" size={16} />
                    </div>
                    <div className="fa-chart-box">
                      {categorySales.length === 0 ? (
                        <FaEmpty />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categorySales} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={76} />
                            <Tooltip content={<FaTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                            <Bar dataKey="Quantity" fill="#ef6c00" radius={[0, 5, 5, 0]} maxBarSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ============ Best Selling Product ============ */}
              {best && (
                <section className="fd-section">
                  <div className="fd-section-head">
                    <h2>Best Selling Product</h2>
                    <p>Your top performer</p>
                  </div>
                  <div className="fa-best">
                    <span className="fa-best-icon"><FaTrophy size={26} /></span>
                    <div className="fa-best-body">
                      <h3>{best.productName}</h3>
                      <p className="fa-best-cat">{best.category}</p>
                    </div>
                    <div className="fa-best-stats">
                      <div>
                        <strong>{Math.round(best.quantity)}</strong>
                        <span>units sold</span>
                      </div>
                      <div>
                        <strong>{inr(best.revenue)}</strong>
                        <span>order value</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ============ Sections: tables ============ */}
              <div className="fa-tables">
                {/* Recent Orders */}
                <section className="fa-panel">
                  <div className="fa-panel-head">
                    <div>
                      <h3>Recent Orders</h3>
                      <p>Your latest buyer orders</p>
                    </div>
                    <Link to="/farmer/orders" className="fa-panel-link">View all</Link>
                  </div>
                  {recentOrders.length === 0 ? (
                    <FaEmpty message="No orders received yet" />
                  ) : (
                    <div className="fa-table-wrap">
                      <table className="fa-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Buyer</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="fa-dim">#{order.id}</td>
                              <td className="fa-cell-main">{order.productName}</td>
                              <td>{order.buyerName}</td>
                              <td>{inr(order.totalPrice)}</td>
                              <td><OrderStatusBadge status={order.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Low Stock */}
                <section className="fa-panel">
                  <div className="fa-panel-head">
                    <div>
                      <h3>Low Stock Products</h3>
                      <p>Restock soon</p>
                    </div>
                    <FaBoxOpen className="fa-panel-icon" size={15} />
                  </div>
                  {lowStock.length === 0 ? (
                    <FaEmpty message="Stock levels are healthy" />
                  ) : (
                    <div className="fa-table-wrap">
                      <table className="fa-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Left</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStock.map((item) => (
                            <tr key={item.id}>
                              <td className="fa-cell-main">{item.name}</td>
                              <td>{item.category}</td>
                              <td>{inr(item.price)}</td>
                              <td>
                                <span className={`fa-stock-pill ${item.quantity <= 2 ? 'fa-stock-pill-low' : ''}`}>
                                  {item.quantity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Recent Reviews */}
                <section className="fa-panel">
                  <div className="fa-panel-head">
                    <div>
                      <h3>Recent Reviews</h3>
                      <p>Latest customer feedback</p>
                    </div>
                    <FaStar className="fa-panel-icon" size={15} />
                  </div>
                  {recentReviews.length === 0 ? (
                    <FaEmpty message="No reviews yet" />
                  ) : (
                    <div className="fa-table-wrap">
                      <table className="fa-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Buyer</th>
                            <th>Rating</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentReviews.map((review) => (
                            <tr key={review.id}>
                              <td className="fa-cell-main">{review.productName}</td>
                              <td>{review.buyerName}</td>
                              <td>
                                <span className="fa-rating">
                                  <FaStar size={11} color="#f9a825" />
                                  {review.rating}.0
                                </span>
                              </td>
                              <td className="fa-dim">{timeAgo(review.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Top Customers */}
                <section className="fa-panel">
                  <div className="fa-panel-head">
                    <div>
                      <h3>Top Customers</h3>
                      <p>Your most valuable buyers</p>
                    </div>
                    <FaUsers className="fa-panel-icon" size={15} />
                  </div>
                  {topCustomers.length === 0 ? (
                    <FaEmpty message="No customers yet" />
                  ) : (
                    <div className="fa-table-wrap">
                      <table className="fa-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Orders</th>
                            <th>Spent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCustomers.map((customer) => (
                            <tr key={customer.userId}>
                              <td className="fa-cell-main">
                                {customer.name}
                                <span className="fa-cell-sub">{customer.email}</span>
                              </td>
                              <td>{customer.orderCount}</td>
                              <td className="fa-strong">{inr(customer.totalAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
