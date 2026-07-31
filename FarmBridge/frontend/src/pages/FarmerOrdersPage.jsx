import { useState, useEffect } from 'react';
import { farmerOrdersAPI } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

function FarmerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await farmerOrdersAPI.getOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    setError('');
    setSuccess('');

    try {
      const response = await farmerOrdersAPI.updateStatus(orderId, status);
      // Update the order in local state with the returned order
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? response.data : o))
      );
      setSuccess(`Order #${orderId} marked as ${status}`);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to update order status';
      setError(
        typeof message === 'string' ? message : 'Failed to update order status'
      );
    } finally {
      setUpdating(null);
    }
  };

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
    <div className="page-container">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>Orders Received</h1>
            <p className="products-subtitle">
              Accept, reject, or complete buyer orders
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {orders.length === 0 ? (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                    <td>
                      <div className="order-actions">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleStatusChange(order.id, 'ACCEPTED')
                              }
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? '...' : '✓ Accept'}
                            </button>
                            <button
                              className="btn btn-outline btn-sm btn-danger-outline"
                              onClick={() =>
                                handleStatusChange(order.id, 'REJECTED')
                              }
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? '...' : '✕ Reject'}
                            </button>
                          </>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleStatusChange(order.id, 'COMPLETED')
                            }
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? '...' : '✓ Complete'}
                          </button>
                        )}
                        {(order.status === 'REJECTED' ||
                          order.status === 'COMPLETED') && (
                          <span className="order-locked">—</span>
                        )}
                      </div>
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

export default FarmerOrdersPage;
