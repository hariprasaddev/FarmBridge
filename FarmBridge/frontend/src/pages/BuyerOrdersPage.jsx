import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buyerOrdersAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await buyerOrdersAPI.getMyOrders();
      setOrders(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your orders. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Order statistics computed from the already-fetched orders
  const orderStats = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: '📋',
    },
    {
      label: 'Pending Orders',
      value: orders.filter((o) => o.status === 'PENDING').length,
      icon: '⏳',
    },
    {
      label: 'Accepted Orders',
      value: orders.filter((o) => o.status === 'ACCEPTED').length,
      icon: '✅',
    },
    {
      label: 'Completed Orders',
      value: orders.filter((o) => o.status === 'COMPLETED').length,
      icon: '🎉',
    },
    {
      label: 'Rejected Orders',
      value: orders.filter((o) => o.status === 'REJECTED').length,
      icon: '🚫',
    },
  ];

  return (
    <div className="page-container">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>My Orders</h1>
            <p className="products-subtitle">
              Track the status of your orders
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-stats-grid buyer-stats-grid">
          {orderStats.map((stat) => (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-icon">{stat.icon}</div>
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Browse products and place your first order.</p>
            <Link to="/buyer/products" className="btn btn-primary">
              🛒 Browse Products
            </Link>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Farmer</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td>{order.productName}</td>
                    <td>{order.farmerName}</td>
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
    </div>
  );
}

export default BuyerOrdersPage;
