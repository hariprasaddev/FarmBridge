import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import OrderStatusBadge from '../components/OrderStatusBadge';
import './AdminDashboardPage.css';

// Decorative bar heights for the "Orders Over Time" placeholder.
// Purely visual — no fake data is presented as real.
const CHART_BARS = [38, 62, 46, 78, 54, 70, 88, 58, 74, 50, 82, 64];

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [verification, setVerification] = useState([]);
  const [verificationError, setVerificationError] = useState('');

  // Recent activity panels — derived from the existing users/orders APIs.
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentError, setRecentError] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadVerification();
    loadRecent();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard statistics. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Verification panel — separate lightweight fetch so a failure here
  // never blocks the main dashboard stats.
  const loadVerification = async () => {
    setVerificationError('');
    try {
      const response = await adminAPI.getUnverifiedFarmers();
      setVerification(response.data);
    } catch (err) {
      setVerificationError(getErrorMessage(err, 'Failed to load verification requests.'));
    }
  };

  // Recent activity — independent of stats; a failure here only empties
  // the two "Recent" panels, never the main dashboard.
  const loadRecent = async () => {
    setRecentError('');
    try {
      const [usersRes, ordersRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllOrders(),
      ]);
      setRecentUsers(usersRes.data);
      setRecentOrders(ordersRes.data);
    } catch (err) {
      setRecentError(getErrorMessage(err, 'Failed to load recent activity.'));
    }
  };

  const refreshAll = () => {
    setMenuOpen(false);
    loadDashboard();
    loadVerification();
    loadRecent();
  };

  const pendingVerifications = stats?.pendingVerifications ?? 0;

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      desc: `${stats?.totalFarmers ?? 0} farmers · ${stats?.totalBuyers ?? 0} buyers`,
      icon: 'users',
      tone: 'green',
      to: '/admin/users',
    },
    {
      label: 'Active Farmers',
      value: stats?.totalFarmers ?? 0,
      desc: 'Total farmer accounts',
      icon: 'leaf',
      tone: 'emerald',
      to: '/admin/users',
    },
    {
      label: 'Registered Buyers',
      value: stats?.totalBuyers ?? 0,
      desc: 'Total buyer accounts',
      icon: 'shoppingBag',
      tone: 'blue',
      to: '/admin/users',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      desc: 'All-time order count',
      icon: 'orders',
      tone: 'amber',
      to: '/admin/orders',
    },
    {
      label: 'Pending Verification',
      value: pendingVerifications,
      desc: pendingVerifications > 0 ? 'Awaiting your review' : 'All requests reviewed',
      icon: 'shieldCheck',
      tone: 'indigo',
      to: '/admin/verification',
    },
    {
      label: 'Platform Revenue',
      value: '—',
      desc: 'Revenue tracking coming soon',
      icon: 'indianRupee',
      tone: 'purple',
      to: null,
    },
  ];

  const renderStatCard = (card) => {
    const content = (
      <>
        <div className="ad-stat-top">
          <span className={`ad-stat-icon ad-stat-icon-${card.tone}`}>
            <Icon name={card.icon} size={20} />
          </span>
          {card.to && (
            <span className="ad-stat-arrow">
              <Icon name="arrow" size={16} />
            </span>
          )}
        </div>
        <div className="ad-stat-value">{card.value}</div>
        <div className="ad-stat-label">{card.label}</div>
        <div className="ad-stat-desc">{card.desc}</div>
      </>
    );

    return card.to ? (
      <Link key={card.label} to={card.to} className="ad-stat-card">
        {content}
      </Link>
    ) : (
      <div key={card.label} className="ad-stat-card">
        {content}
      </div>
    );
  };

  // Newest first — the APIs return all records; we take the latest 5.
  const latestUsers = [...recentUsers].sort((a, b) => b.id - a.id).slice(0, 5);
  const latestOrders = [...recentOrders].sort((a, b) => b.id - a.id).slice(0, 5);

  const dropdownActions = (
    <>
      <button
        className="ad-more-btn"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="More actions"
        aria-expanded={menuOpen}
      >
        <Icon name="moreHorizontal" size={20} />
      </button>

      {menuOpen && <div className="ad-dropdown-backdrop" onClick={() => setMenuOpen(false)} />}

      {menuOpen && (
        <div className="ad-dropdown">
          <button className="ad-dropdown-item" onClick={refreshAll}>
            <Icon name="refreshCw" size={16} />
            Refresh dashboard
          </button>
          <div className="ad-dropdown-sep" />
          <Link to="/admin/users" className="ad-dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="users" size={16} />
            Manage Users
          </Link>
          <Link to="/admin/orders" className="ad-dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="orders" size={16} />
            All Orders
          </Link>
          <Link to="/admin/verification" className="ad-dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="shieldCheck" size={16} />
            Verification
          </Link>
        </div>
      )}
    </>
  );

  return (
    <AdminLayout
      title="Admin Overview"
      subtitle="Platform Activity Summary"
      actions={dropdownActions}
    >
      {loading ? (
        <div className="ad-loading">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <div className="ad-content">
          {error && <div className="alert alert-error">{error}</div>}

          {/* ============ Statistics ============ */}
          <div className="ad-stats-grid">{statCards.map(renderStatCard)}</div>

          {/* ============ Chart + Verification ============ */}
          <div className="ad-grid">
            {/* ---- Orders Over Time (placeholder, existing values) ---- */}
            <section className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2>Orders Over Time</h2>
                  <p className="ad-card-sub">Aggregate platform activity</p>
                </div>
              </div>
              <div className="ad-chart-body">
                <div className="ad-chart-metric">
                  <strong>{stats?.totalOrders ?? 0}</strong>
                  <span>total orders</span>
                </div>
                <div className="ad-chart-bars">
                  {CHART_BARS.map((h, i) => (
                    <span key={i} className="ad-chart-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <p className="ad-chart-note">
                  <Icon name="badgeCheck" size={13} />
                  Illustrative view — chart data arrives with analytics
                </p>
                <div className="ad-chart-footer">
                  <span className="ad-chart-chip">
                    <Icon name="package" size={14} />
                    Products listed
                    <strong>{stats?.totalProducts ?? 0}</strong>
                  </span>
                  <span className="ad-chart-chip">
                    <Icon name="shieldCheck" size={14} />
                    Pending verifications
                    <strong>{pendingVerifications}</strong>
                  </span>
                </div>
              </div>
            </section>

            {/* ---- Verification Requests ---- */}
            <section className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2>Verification Requests</h2>
                  <p className="ad-card-sub">
                    {verificationError
                      ? 'Unavailable right now'
                      : `${pendingVerifications} awaiting review`}
                  </p>
                </div>
              </div>

              {verificationError ? (
                <div className="ad-verif-empty">
                  <p>{verificationError}</p>
                </div>
              ) : verification.length === 0 ? (
                <div className="ad-verif-empty">
                  <span className="ad-verif-empty-icon">
                    <Icon name="badgeCheck" size={24} />
                  </span>
                  <p>No pending verification requests.</p>
                </div>
              ) : (
                <div className="ad-verif-list">
                  {verification.slice(0, 5).map((req) => (
                    <div key={req.profileId ?? req.userId} className="ad-verif-item">
                      <span className="ad-verif-avatar">
                        {(req.farmName || req.farmerName || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="ad-verif-info">
                        <p className="ad-verif-name">{req.farmName || req.farmerName}</p>
                        <p className="ad-verif-meta">
                          <Icon name="mapPin" size={12} />
                          {req.location || '—'}
                        </p>
                      </div>
                      <span className={`ad-badge ${req.verified ? 'ad-badge-verified' : 'ad-badge-pending'}`}>
                        {req.verified ? 'Verified' : 'Pending'}
                      </span>
                      <Link to="/admin/verification" className="ad-verif-view">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <div className="ad-verif-foot">
                <Link to="/admin/verification">
                  Manage all requests
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </section>
          </div>

          {/* ============ Recent Activity ============ */}
          <div className="ad-recent-grid">
            {/* ---- Recent Users ---- */}
            <section className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2>Recent Users</h2>
                  <p className="ad-card-sub">Latest registered accounts</p>
                </div>
              </div>

              {recentError ? (
                <div className="ad-verif-empty">
                  <p>{recentError}</p>
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="ad-verif-empty">
                  <span className="ad-verif-empty-icon">
                    <Icon name="users" size={24} />
                  </span>
                  <p>No users registered yet.</p>
                </div>
              ) : (
                <div className="ad-recent-list">
                  {latestUsers.map((user) => (
                    <div key={user.id} className="ad-recent-item">
                      <span className="ad-recent-avatar">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                      <div className="ad-recent-info">
                        <p className="ad-recent-name">{user.name}</p>
                        <p className="ad-recent-meta">{user.email}</p>
                      </div>
                      <span className={`ad-role-pill ad-role-pill-${user.role?.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="ad-verif-foot">
                <Link to="/admin/users">
                  View all users
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </section>

            {/* ---- Recent Orders ---- */}
            <section className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2>Recent Orders</h2>
                  <p className="ad-card-sub">Latest orders placed</p>
                </div>
              </div>

              {recentError ? (
                <div className="ad-verif-empty">
                  <p>{recentError}</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="ad-verif-empty">
                  <span className="ad-verif-empty-icon">
                    <Icon name="orders" size={24} />
                  </span>
                  <p>No orders placed yet.</p>
                </div>
              ) : (
                <div className="ad-recent-list">
                  {latestOrders.map((order) => (
                    <div key={order.id} className="ad-recent-item">
                      <span className="ad-recent-avatar ad-recent-avatar-order">
                        <Icon name="orders" size={15} />
                      </span>
                      <div className="ad-recent-info">
                        <p className="ad-recent-name">
                          #{order.id} · {order.productName}
                        </p>
                        <p className="ad-recent-meta">
                          {order.buyerName} · ₹{order.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  ))}
                </div>
              )}

              <div className="ad-verif-foot">
                <Link to="/admin/orders">
                  View all orders
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboardPage;
