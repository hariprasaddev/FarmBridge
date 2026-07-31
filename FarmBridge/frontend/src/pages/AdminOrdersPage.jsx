import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'];

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders =
    filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>All Orders</h1>
            <p className="products-subtitle">
              Every order placed across the platform
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-chips">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              className={`filter-chip ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'ALL' ? 'All Statuses' : status}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">📋</div>
            <h3>No orders found</h3>
            <p>There are no orders matching this filter.</p>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Farmer</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td>{order.productName}</td>
                    <td>{order.buyerName}</td>
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

export default AdminOrdersPage;
