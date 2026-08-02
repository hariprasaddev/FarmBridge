import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getErrorMessage } from '../services/api';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
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

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: '👥',
      to: '/admin/users',
    },
    {
      label: 'Farmers',
      value: stats?.totalFarmers ?? 0,
      icon: '👨‍🌾',
      to: '/admin/users',
    },
    {
      label: 'Buyers',
      value: stats?.totalBuyers ?? 0,
      icon: '🛒',
      to: '/admin/users',
    },
    {
      label: 'Products',
      value: stats?.totalProducts ?? 0,
      icon: '📦',
      to: '/admin/products',
    },
    {
      label: 'Orders',
      value: stats?.totalOrders ?? 0,
      icon: '📋',
      to: '/admin/orders',
    },
    {
      label: 'Pending Verifications',
      value: stats?.pendingVerifications ?? 0,
      icon: '✅',
      to: '/admin/verification',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management</p>
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

      <div className="dashboard-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-row">
          <Link to="/admin/users" className="btn btn-primary">
            Manage Users
          </Link>
          <Link to="/admin/verification" className="btn btn-secondary">
            Farmer Verification
          </Link>
          <Link to="/admin/orders" className="btn btn-outline">
            All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
