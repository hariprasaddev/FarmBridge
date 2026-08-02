import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buyerOrdersAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import './BuyerOrdersPage.css';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

const STATUS_LABEL = {
  ALL: 'All',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

// Order # is auto-incremented, so ID order is creation order.
const sortOrders = (list, sortBy) => {
  const sorted = [...list];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => a.id - b.id);
    case 'priceHigh':
      return sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
    case 'priceLow':
      return sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    case 'newest':
    default:
      return sorted.sort((a, b) => b.id - a.id);
  }
};

// Category-tinted thumbnail placeholder (presentation only — orders carry
// no image field, so a category-colored tile with an SVG icon is shown,
// inferred from the product name).
const CATEGORY_RULES = [
  {
    tone: 'veg',
    icon: 'sprout',
    label: 'Vegetables',
    keywords: [
      'tomato', 'potato', 'onion', 'carrot', 'cabbage', 'spinach', 'brinjal',
      'chilli', 'chili', 'pepper', 'cucumber', 'okra', 'pumpkin', 'beetroot',
      'radish', 'cauliflower', 'broccoli', 'garlic', 'ginger', 'leafy',
      'greens', 'vegetable',
    ],
  },
  {
    tone: 'fruit',
    icon: 'apple',
    label: 'Fruits',
    keywords: [
      'apple', 'mango', 'banana', 'orange', 'grape', 'papaya', 'guava',
      'pomegranate', 'watermelon', 'muskmelon', 'kiwi', 'pineapple',
      'coconut', 'fruit', 'lemon', 'lime', 'strawberry',
    ],
  },
  {
    tone: 'grain',
    icon: 'wheat',
    label: 'Grains',
    keywords: [
      'wheat', 'rice', 'paddy', 'maize', 'corn', 'millet', 'jowar', 'bajra',
      'barley', 'oat', 'grain', 'flour', 'atta',
    ],
  },
  {
    tone: 'dairy',
    icon: 'milk',
    label: 'Dairy',
    keywords: ['milk', 'curd', 'yogurt', 'yoghurt', 'ghee', 'butter', 'paneer', 'cheese', 'dairy'],
  },
];

const getCategoryTone = (productName) => {
  const name = (productName || '').toLowerCase();
  const rule = CATEGORY_RULES.find((r) => r.keywords.some((k) => name.includes(k)));
  return rule || { tone: 'veg', icon: 'sprout', label: 'Produce' };
};

function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Presentation-level filters (client-side, on the already-fetched orders)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [detailsOrder, setDetailsOrder] = useState(null);

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

  // Order statistics computed from the already-fetched orders
  const orderStats = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: 'orders',
      tone: 'green',
    },
    {
      label: 'Pending Orders',
      value: orders.filter((o) => o.status === 'PENDING').length,
      icon: 'clock',
      tone: 'amber',
    },
    {
      label: 'Accepted Orders',
      value: orders.filter((o) => o.status === 'ACCEPTED').length,
      icon: 'checkCircle',
      tone: 'emerald',
    },
    {
      label: 'Completed Orders',
      value: orders.filter((o) => o.status === 'COMPLETED').length,
      icon: 'flag',
      tone: 'blue',
    },
    {
      label: 'Rejected Orders',
      value: orders.filter((o) => o.status === 'REJECTED').length,
      icon: 'xCircle',
      tone: 'red',
    },
  ];

  // Derived: search + status filter, then sort (client-side only)
  const query = search.trim().toLowerCase();
  const filteredOrders = sortOrders(
    orders.filter((order) => {
      const matchesSearch =
        !query ||
        (order.productName || '').toLowerCase().includes(query) ||
        (order.farmerName || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    sortBy
  );

  const filtersActive = search.trim() !== '' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSortBy('newest');
  };

  const renderSkeletonCards = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bo-skeleton-card" aria-hidden="true">
        <div className="bo-skeleton-thumb" />
        <div className="bo-skeleton-body">
          <div className="bo-skeleton-line bo-skeleton-line--name" />
          <div className="bo-skeleton-line bo-skeleton-line--meta" />
          <div className="bo-skeleton-line bo-skeleton-line--ref" />
        </div>
        <div className="bo-skeleton-side">
          <div className="bo-skeleton-line bo-skeleton-line--price" />
          <div className="bo-skeleton-badge" />
        </div>
      </div>
    ));

  const renderOrderCard = (order) => {
    const tone = getCategoryTone(order.productName);

    return (
      <div
        key={order.id}
        className={`bo-card ${order.status === 'REJECTED' ? 'bo-card-rejected' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setDetailsOrder(order)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailsOrder(order);
          }
        }}
        aria-label={`View details for order ${order.id}`}
      >
        <span className={`bo-thumb bo-thumb-${tone.tone}`} aria-hidden="true">
          <Icon name={tone.icon} size={24} />
        </span>

        <div className="bo-card-info">
          <p className="bo-card-name" title={order.productName}>
            {order.productName}
          </p>
          <p className="bo-card-meta">
            Qty {order.quantity} • by {order.farmerName}
          </p>
          <p className="bo-card-ref">Order #{order.id}</p>
        </div>

        <div className="bo-card-side">
          <span className="bo-card-price">₹{order.totalPrice?.toLocaleString()}</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>
    );
  };

  return (
    <div className="bo-root">
      <div className="bo-inner">
        {/* ============ Header + Summary ============ */}
        <header className="bo-head">
          <div className="bo-title">
            <h1>My Orders</h1>
            <p className="bo-sub">Track and manage your purchases</p>
          </div>

          {loading ? (
            <div className="bo-summary">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bo-skeleton bo-skeleton-summary" />
              ))}
            </div>
          ) : (
            <div className="bo-summary">
              {orderStats.map((stat) => (
                <div key={stat.label} className="bo-summary-card">
                  <span className={`bo-summary-icon bo-summary-icon-${stat.tone}`}>
                    <Icon name={stat.icon} size={18} />
                  </span>
                  <div>
                    <div className="bo-summary-value">{stat.value}</div>
                    <div className="bo-summary-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {loading ? (
          <>
            <div className="bo-skeleton bo-skeleton-toolbar" />
            <div className="bo-list">{renderSkeletonCards()}</div>
          </>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}

            {/* ============ Search + Filter bar ============ */}
            <div className="bo-toolbar">
              <div className="bo-search">
                <Icon name="search" size={17} />
                <input
                  type="text"
                  name="search"
                  placeholder="Search your orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="bo-search-clear"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>

              <div className="bo-pills">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`bo-pill ${statusFilter === s ? 'active' : ''}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              {filtersActive && (
                <button type="button" className="bo-clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>

            {/* ============ Order cards / Empty ============ */}
            {orders.length === 0 ? (
              <div className="bo-empty-card">
                <div className="bo-empty">
                  <span className="bo-empty-icon">
                    <Icon name="orders" size={28} />
                  </span>
                  <h2>No orders yet</h2>
                  <p>You haven&apos;t placed any orders yet.</p>
                  <Link to="/buyer/products" className="bo-empty-btn">
                    <Icon name="cart" size={16} />
                    Browse Products
                  </Link>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bo-empty-card">
                <div className="bo-empty">
                  <span className="bo-empty-icon">
                    <Icon name="search" size={28} />
                  </span>
                  <h2>No matching orders</h2>
                  <p>Try adjusting your search or filters.</p>
                  <button type="button" className="bo-clear-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="bo-list">{filteredOrders.map(renderOrderCard)}</div>
            )}
          </>
        )}
      </div>

      {/* ============ Order Details Modal ============ */}
      {detailsOrder && (
        <div className="modal-overlay" onClick={() => setDetailsOrder(null)}>
          <div className="modal bo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button
                className="modal-close"
                onClick={() => setDetailsOrder(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-summary">
                <div className="order-summary-item">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value">#{detailsOrder.id}</span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <OrderStatusBadge status={detailsOrder.status} />
                  </span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Product</span>
                  <span className="detail-value">{detailsOrder.productName}</span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Farmer</span>
                  <span className="detail-value">{detailsOrder.farmerName}</span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value">{detailsOrder.quantity}</span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Total</span>
                  <span className="detail-value">
                    ₹{detailsOrder.totalPrice?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <Link
                  to="/buyer/products"
                  className="btn btn-outline"
                  onClick={() => setDetailsOrder(null)}
                >
                  Browse More Products
                </Link>
                <button className="btn btn-primary" onClick={() => setDetailsOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerOrdersPage;
