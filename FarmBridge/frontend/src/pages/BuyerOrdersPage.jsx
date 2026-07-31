import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buyerOrdersAPI } from '../services/api';
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
      setError('Failed to load orders. Please try again.');
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
