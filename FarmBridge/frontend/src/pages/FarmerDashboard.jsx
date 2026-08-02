import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { farmerProductsAPI, farmerOrdersAPI, farmerProfileAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

function FarmerDashboard() {
  const { email } = useAuth();

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

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const rejectedOrders = orders.filter((o) => o.status === 'REJECTED').length;
  const recentOrders = orders.slice(0, 5);

  const statCards = [
    {
      label: 'Total Products',
      value: products.length,
      icon: '📦',
      to: '/farmer/products',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: '⏳',
      to: '/farmer/orders',
    },
    {
      label: 'Accepted Orders',
      value: acceptedOrders,
      icon: '✅',
      to: '/farmer/orders',
    },
    {
      label: 'Completed Orders',
      value: completedOrders,
      icon: '🎉',
      to: '/farmer/orders',
    },
    {
      label: 'Rejected Orders',
      value: rejectedOrders,
      icon: '🚫',
      to: '/farmer/orders',
    },
    {
      label: 'Profile Status',
      value: profile ? 'Set' : 'Not Set',
      icon: '👤',
      to: '/farmer/profile',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {email?.split('@')[0] || 'Farmer'}!</h1>
        <p>Manage your farm and connect with buyers directly.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <Link key={card.label} to={card.to} className="admin-stat-card">
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-value">{card.value}</div>
            <div className="admin-stat-label">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-cards">
        <Link to="/farmer/profile" className="dash-card">
          <div className="dash-card-icon">👤</div>
          <div className="dash-card-content">
            <h3>My Profile</h3>
            <p>Create or update your farm profile</p>
          </div>
          <span className="dash-card-arrow">→</span>
        </Link>

        <Link to="/farmer/products" className="dash-card">
          <div className="dash-card-icon">📦</div>
          <div className="dash-card-content">
            <h3>My Products</h3>
            <p>Manage your product listings</p>
          </div>
          <span className="dash-card-arrow">→</span>
        </Link>

        <Link to="/farmer/orders" className="dash-card">
          <div className="dash-card-icon">📋</div>
          <div className="dash-card-content">
            <h3>Orders Received</h3>
            <p>View and manage buyer orders</p>
          </div>
          <span className="dash-card-arrow">→</span>
        </Link>
      </div>

      <div className="dashboard-recent-orders">
        <div className="products-header">
          <div>
            <h1>Recent Orders</h1>
            <p className="products-subtitle">Your latest buyer orders</p>
          </div>
          <Link to="/farmer/orders" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">📋</div>
            <h3>No orders received</h3>
            <p>When buyers order your products, they'll appear here.</p>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
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
                    <td className="order-id">#{order.id}</td>
                    <td>{order.productName}</td>
                    <td>{order.buyerName}</td>
                    <td>{order.quantity}</td>
                    <td className="order-price">
                      ₹{order.totalPrice?.toLocaleString()}
                    </td>
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

      <div className="dashboard-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-row">
          <Link to="/farmer/profile" className="btn btn-primary">
            {'>'} Set Up Your Farm Profile
          </Link>
          <Link to="/farmer/products/add" className="btn btn-secondary">
            {'>'} Add New Product
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
