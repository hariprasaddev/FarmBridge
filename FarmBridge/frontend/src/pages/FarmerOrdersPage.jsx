import { useState, useEffect } from 'react';
import { farmerOrdersAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import './FarmerOrdersPage.css';

const STATUS_PILLS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Presentation-only helpers: buyer avatar initials + soft pastel tone.
const getInitials = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

const getAvatarTone = (name) => {
  const sum = (name || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sum % 5;
};

function FarmerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(null);

  // Presentation-level filters (client-side, on the already-fetched orders)
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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
      setError(getErrorMessage(err, 'Failed to load your orders. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    // Rejecting an order is irreversible — confirm before proceeding.
    if (status === 'REJECTED' && !window.confirm('Reject this order?')) {
      return;
    }

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
      setError(getErrorMessage(err, 'Failed to update the order status. Please try again.'));
    } finally {
      setUpdating(null);
    }
  };

  // Dynamic pill counts from the already-fetched orders
  const statusCounts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    ACCEPTED: orders.filter((o) => o.status === 'ACCEPTED').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    REJECTED: orders.filter((o) => o.status === 'REJECTED').length,
  };

  // Derived: search (buyer or product) + status filter — client-side only
  const query = search.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !query ||
      (order.buyerName || '').toLowerCase().includes(query) ||
      (order.productName || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filtersActive = search.trim() !== '' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  // Client-side CSV export of the currently visible orders (no backend involved)
  const exportOrders = () => {
    const header = ['Order ID', 'Product', 'Buyer', 'Quantity', 'Total (INR)', 'Status'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.productName,
      o.buyerName,
      o.quantity,
      o.totalPrice,
      o.status,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmbridge-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer cleanup so the download is not aborted by an early revoke.
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const renderSkeletons = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="fo-skeleton-card" aria-hidden="true">
        <div className="fo-skeleton-avatar" />
        <div className="fo-skeleton-body">
          <div className="fo-skeleton-line fo-skeleton-line--lg" />
          <div className="fo-skeleton-line fo-skeleton-line--sm" />
          <div className="fo-skeleton-line fo-skeleton-line--sm" />
        </div>
        <div className="fo-skeleton-side" />
      </div>
    ));

  const renderActions = (order) => {
    const isUpdating = updating === order.id;

    if (order.status === 'PENDING') {
      return (
        <div className="fo-actions">
          <button
            type="button"
            className="fo-btn fo-btn-accept"
            onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Processing…' : '✓ Accept'}
          </button>
          <button
            type="button"
            className="fo-btn fo-btn-reject"
            onClick={() => handleStatusChange(order.id, 'REJECTED')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Processing…' : '✕ Reject'}
          </button>
        </div>
      );
    }

    if (order.status === 'ACCEPTED') {
      return (
        <div className="fo-actions">
          <button
            type="button"
            className="fo-btn fo-btn-complete"
            onClick={() => handleStatusChange(order.id, 'COMPLETED')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Processing…' : '✓ Mark Complete'}
          </button>
        </div>
      );
    }

    return null;
  };

  const renderOrderCard = (order) => (
    <div key={order.id} className="fo-card">
      <span className={`fo-avatar fo-avatar-${getAvatarTone(order.buyerName)}`}>
        {getInitials(order.buyerName)}
      </span>

      <div className="fo-info">
        <div className="fo-info-top">
          <h3 className="fo-buyer">{order.buyerName}</h3>
          <span className="fo-order-id">#{order.id}</span>
        </div>
        <p className="fo-product">
          <Icon name="package" size={14} />
          {order.productName}
        </p>
        <div className="fo-meta">
          <span>Qty: {order.quantity}</span>
          <span className="fo-meta-dot">•</span>
          <span className="fo-total">₹{order.totalPrice?.toLocaleString()}</span>
        </div>
      </div>

      <div className="fo-side">
        <OrderStatusBadge status={order.status} />
        {renderActions(order)}
      </div>
    </div>
  );

  return (
    <div className="fo-root">
      <div className="fo-inner">
        {/* ============ Header ============ */}
        <header className="fo-head">
          <div className="fo-title">
            <h1>Orders</h1>
            <p className="fo-sub">Manage incoming orders from buyers</p>
          </div>
          <button
            type="button"
            className="fo-export-btn"
            onClick={exportOrders}
            disabled={filteredOrders.length === 0}
          >
            <Icon name="download" size={16} />
            Export Orders
          </button>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="fo-list">{renderSkeletons()}</div>
        ) : (
          <>
            {/* ============ Filter pills ============ */}
            <div className="fo-pills">
              {STATUS_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  className={`fo-pill ${statusFilter === pill.value ? 'active' : ''}`}
                  onClick={() => setStatusFilter(pill.value)}
                >
                  {pill.label} <span className="fo-pill-count">({statusCounts[pill.value]})</span>
                </button>
              ))}
            </div>

            {/* ============ Search ============ */}
            <div className="fo-search">
              <Icon name="search" size={18} />
              <input
                type="text"
                name="search"
                placeholder="Search buyer or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="fo-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            {/* ============ List / Empty ============ */}
            {orders.length === 0 ? (
              <div className="fo-empty">
                <span className="fo-empty-icon">
                  <Icon name="orders" size={28} />
                </span>
                <h2>No orders yet</h2>
                <p>Orders from buyers will appear here.</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="fo-empty">
                <span className="fo-empty-icon">
                  <Icon name="search" size={28} />
                </span>
                <h2>No matching orders</h2>
                <p>Try adjusting your search or filters.</p>
                <button type="button" className="fo-clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="fo-list">{filteredOrders.map(renderOrderCard)}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FarmerOrdersPage;
