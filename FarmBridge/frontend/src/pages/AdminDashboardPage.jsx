import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FaUsers,
  FaLeaf,
  FaUserCheck,
  FaClipboardCheck,
  FaShoppingBag,
  FaBoxOpen,
  FaShoppingCart,
  FaChartLine,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaStoreAlt,
  FaStar,
} from 'react-icons/fa';
import { analyticsAPI, getErrorMessage } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import OrderStatusBadge from '../components/OrderStatusBadge';
import AnimatedNumber from '../components/AnimatedNumber';
import Icon from '../components/Icon';
import './AdminDashboardPage.css';

const CHART_COLORS = [
  '#2e7d32', '#66bb6a', '#a5d6a7', '#f9a825',
  '#ef6c00', '#26a69a', '#5c6bc0', '#ec407a',
  '#8d6e63', '#78909c',
];

const STATUS_COLORS = {
  PENDING: '#f9a825',
  ACCEPTED: '#2e7d32',
  REJECTED: '#ef5350',
  COMPLETED: '#5c6bc0',
};

// ==========================================
// FORMATTING HELPERS
// ==========================================

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

// ==========================================
// SHARED UI — Chart tooltip
// ==========================================

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="an-tooltip-row">
          <span className="an-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
          <span>{entry.name}</span>
          <strong>
            {currency ? inr(entry.value) : Number(entry.value ?? 0).toLocaleString('en-IN')}
          </strong>
        </p>
      ))}
    </div>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="an-chart-empty">
      <Icon name="chart" size={22} />
      <span>{message || 'No data yet'}</span>
    </div>
  );
}

// ==========================================
// SKELETONS
// ==========================================

function CardSkeleton() {
  return <div className="an-skeleton an-skeleton-card" aria-hidden="true" />;
}

function ChartSkeleton() {
  return <div className="an-skeleton an-skeleton-chart" aria-hidden="true" />;
}

function TableSkeleton() {
  return (
    <div className="an-table-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="an-skeleton-line" />
      ))}
    </div>
  );
}

// ==========================================
// PAGE
// ==========================================

function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await analyticsAPI.adminAnalytics();
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load the analytics dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshAll = () => {
    setMenuOpen(false);
    load();
  };

  // ----- Cards -----
  const cards = data
    ? [
        { label: 'Total Users', value: data.totalUsers, icon: FaUsers, tone: 'green', to: '/admin/users', sub: 'All registered accounts' },
        { label: 'Total Farmers', value: data.totalFarmers, icon: FaLeaf, tone: 'emerald', to: '/admin/users', sub: 'Farmer accounts' },
        { label: 'Verified Farmers', value: data.verifiedFarmers, icon: FaUserCheck, tone: 'blue', to: '/admin/verification', sub: 'Approved to sell' },
        { label: 'Pending Verification', value: data.pendingVerifications, icon: FaClipboardCheck, tone: 'amber', to: '/admin/verification', sub: 'Awaiting review' },
        { label: 'Buyers', value: data.buyers, icon: FaShoppingBag, tone: 'indigo', to: '/admin/users', sub: 'Buyer accounts' },
        { label: 'Products', value: data.products, icon: FaBoxOpen, tone: 'teal', to: '/admin/products', sub: 'Listed on marketplace' },
        { label: 'Orders', value: data.orders, icon: FaShoppingCart, tone: 'orange', to: '/admin/orders', sub: 'All-time orders' },
        { label: 'Monthly Orders', value: data.monthlyOrders, icon: FaChartLine, tone: 'pink', to: '/admin/orders', sub: 'This month' },
        { label: 'Platform Revenue', value: data.platformRevenue, icon: FaRupeeSign, tone: 'purple', to: '/admin/orders', sub: 'Completed orders', currency: true },
        { label: 'Monthly Revenue', value: data.monthlyRevenue, icon: FaRupeeSign, tone: 'green', to: '/admin/orders', sub: 'Completed this month', currency: true },
        { label: 'Completed Orders', value: data.completedOrders, icon: FaCheckCircle, tone: 'emerald', to: '/admin/orders', sub: 'Delivered' },
        { label: 'Cancelled Orders', value: data.cancelledOrders, icon: FaTimesCircle, tone: 'red', to: '/admin/orders', sub: 'Rejected requests' },
        { label: 'Active Farmers', value: data.activeFarmers, icon: FaStoreAlt, tone: 'cyan', to: '/admin/products', sub: 'Selling now' },
      ]
    : [];

  // ----- Chart data -----
  const revenuePerMonth = (data?.revenuePerMonth || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Revenue: Math.round(m.value),
    Orders: m.count,
  }));
  const ordersPerMonth = (data?.ordersPerMonth || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Orders: m.count,
  }));
  const farmerRegistrations = (data?.farmerRegistrations || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Farmers: m.count,
  }));
  const productCategories = (data?.productCategories || []).map((c) => ({
    name: c.category,
    value: c.count,
  }));
  const orderStatus = (data?.orderStatus || []).map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#9e9e9e',
  }));
  const topSellingCategories = (data?.topSellingCategories || []).map((c) => ({
    name: c.category,
    Quantity: c.quantity,
  }));

  // ----- Tables -----
  const latestOrders = data?.latestOrders || [];
  const latestFarmers = data?.latestFarmers || [];
  const pendingVerifications = data?.pendingVerificationList || [];
  const topBuyers = data?.topBuyers || [];
  const topFarmers = data?.topFarmers || [];
  const lowStock = data?.lowStockProducts || [];
  const latestReviews = data?.latestReviews || [];

  const dropdownActions = (
    <>
      <button className="ad-more-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="More actions" aria-expanded={menuOpen}>
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
            <Icon name="users" size={16} /> Manage Users
          </Link>
          <Link to="/admin/orders" className="ad-dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="orders" size={16} /> All Orders
          </Link>
          <Link to="/admin/verification" className="ad-dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="shieldCheck" size={16} /> Verification
          </Link>
        </div>
      )}
    </>
  );

  const renderCard = (card) => {
    const CardIcon = card.icon;
    const content = (
      <>
        <div className="an-card-top">
          <span className={`an-card-icon an-card-icon-${card.tone}`}>
            <CardIcon size={19} />
          </span>
          {card.to && (
            <span className="an-card-arrow">
              <Icon name="arrow" size={15} />
            </span>
          )}
        </div>
        <div className="an-card-value">
          {card.currency ? (
            <AnimatedNumber value={card.value} format={inr} />
          ) : (
            <AnimatedNumber value={card.value} />
          )}
        </div>
        <div className="an-card-label">{card.label}</div>
        <div className="an-card-sub">{card.sub}</div>
      </>
    );
    return card.to ? (
      <Link key={card.label} to={card.to} className="an-card">
        {content}
      </Link>
    ) : (
      <div key={card.label} className="an-card">
        {content}
      </div>
    );
  };

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="Platform business overview"
      actions={dropdownActions}
    >
      {loading ? (
        <div className="an-loading">
          <div className="an-skeleton-grid">
            {Array.from({ length: 13 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <div className="an-skeleton-charts">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : error ? (
        <div className="an-loading">
          <div className="alert alert-error an-error-box">{error}</div>
          <button type="button" className="btn btn-primary" onClick={load}>
            Retry
          </button>
        </div>
      ) : (
        <div className="an-content">
          {/* ============ STAT CARDS ============ */}
          <div className="an-stats-grid">{cards.map(renderCard)}</div>

          {/* ============ CHARTS — row 1 ============ */}
          <div className="an-charts-grid">
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Revenue Per Month</h2>
                  <p className="an-panel-sub">Completed order revenue</p>
                </div>
                <FaRupeeSign className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {revenuePerMonth.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenuePerMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                      <Tooltip content={<ChartTooltip currency />} />
                      <Line type="monotone" dataKey="Revenue" stroke="#2e7d32" strokeWidth={2.5} dot={{ r: 3, fill: '#2e7d32' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Orders Per Month</h2>
                  <p className="an-panel-sub">All orders placed</p>
                </div>
                <FaShoppingCart className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {ordersPerMonth.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersPerMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                      <Bar dataKey="Orders" fill="#66bb6a" radius={[5, 5, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Farmer Registrations</h2>
                  <p className="an-panel-sub">New farmer accounts per month</p>
                </div>
                <FaLeaf className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {farmerRegistrations.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={farmerRegistrations} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="Farmers" stroke="#26a69a" strokeWidth={2.5} dot={{ r: 3, fill: '#26a69a' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* ============ CHARTS — row 2 ============ */}
          <div className="an-charts-grid">
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Product Categories</h2>
                  <p className="an-panel-sub">Distribution of listings</p>
                </div>
                <FaBoxOpen className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {productCategories.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={productCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={11}>
                        {productCategories.map((entry, i) => (
                          <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Order Status</h2>
                  <p className="an-panel-sub">Current breakdown</p>
                </div>
                <FaClipboardCheck className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {orderStatus.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={86} paddingAngle={3}>
                        {orderStatus.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Top Selling Categories</h2>
                  <p className="an-panel-sub">By total ordered quantity</p>
                </div>
                <FaChartLine className="an-panel-icon" size={18} />
              </div>
              <div className="an-chart-box">
                {topSellingCategories.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSellingCategories} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={84} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                      <Bar dataKey="Quantity" fill="#f9a825" radius={[0, 5, 5, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* ============ TABLES ============ */}
          <div className="an-tables-grid">
            {/* Latest Orders */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Latest Orders</h2>
                  <p className="an-panel-sub">Most recent purchases</p>
                </div>
                <Link to="/admin/orders" className="an-panel-link">View all</Link>
              </div>
              {latestOrders.length === 0 ? (
                <ChartEmpty message="No orders yet" />
              ) : (
                <div className="an-table-wrap">
                  <table className="an-table">
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
                      {latestOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="an-dim">#{order.id}</td>
                          <td className="an-cell-main">{order.productName}</td>
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

            {/* Pending Verification */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Pending Verification</h2>
                  <p className="an-panel-sub">Awaiting your review</p>
                </div>
                <Link to="/admin/verification" className="an-panel-link">Review all</Link>
              </div>
              {pendingVerifications.length === 0 ? (
                <ChartEmpty message="No pending requests" />
              ) : (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Farm</th>
                        <th>Method</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVerifications.map((req) => (
                        <tr key={req.profileId ?? req.userId}>
                          <td className="an-cell-main">
                            {req.fullName || req.farmerName}
                            <span className="an-cell-sub">{req.email}</span>
                          </td>
                          <td>{req.farmName || '—'}</td>
                          <td>
                            <span className="an-method">{req.cultivationMethod || '—'}</span>
                          </td>
                          <td className="an-dim">{timeAgo(req.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Top Buyers */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Top Buyers</h2>
                  <p className="an-panel-sub">Highest order value</p>
                </div>
                <FaShoppingBag className="an-panel-icon" size={16} />
              </div>
              {topBuyers.length === 0 ? (
                <ChartEmpty message="No buyers yet" />
              ) : (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Buyer</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topBuyers.map((buyer) => (
                        <tr key={buyer.userId}>
                          <td className="an-cell-main">
                            {buyer.name}
                            <span className="an-cell-sub">{buyer.email}</span>
                          </td>
                          <td>{buyer.orderCount}</td>
                          <td className="an-strong">{inr(buyer.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Top Farmers */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Top Farmers</h2>
                  <p className="an-panel-sub">By total order value</p>
                </div>
                <FaLeaf className="an-panel-icon" size={16} />
              </div>
              {topFarmers.length === 0 ? (
                <ChartEmpty message="No farmer sales yet" />
              ) : (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topFarmers.map((farmer) => (
                        <tr key={farmer.userId}>
                          <td className="an-cell-main">
                            {farmer.name}
                            <span className="an-cell-sub">{farmer.email}</span>
                          </td>
                          <td>{farmer.orderCount}</td>
                          <td className="an-strong">{inr(farmer.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Low Stock */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Low Stock Products</h2>
                  <p className="an-panel-sub">Running out soon</p>
                </div>
                <FaBoxOpen className="an-panel-icon" size={16} />
              </div>
              {lowStock.length === 0 ? (
                <ChartEmpty message="Stock levels are healthy" />
              ) : (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Farmer</th>
                        <th>Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((item) => (
                        <tr key={item.id}>
                          <td className="an-cell-main">{item.name}</td>
                          <td>{item.category}</td>
                          <td className="an-dim">{item.farmerName}</td>
                          <td>
                            <span className={`an-stock-pill ${item.quantity <= 2 ? 'an-stock-pill-low' : ''}`}>
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

            {/* Latest Reviews */}
            <section className="an-card-panel">
              <div className="an-panel-head">
                <div>
                  <h2>Latest Reviews</h2>
                  <p className="an-panel-sub">Recent buyer feedback</p>
                </div>
                <FaStar className="an-panel-icon" size={16} />
              </div>
              {latestReviews.length === 0 ? (
                <ChartEmpty message="No reviews yet" />
              ) : (
                <div className="an-review-list">
                  {latestReviews.map((review) => (
                    <div key={review.id} className="an-review-item">
                      <div className="an-review-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FaStar
                            key={i}
                            size={11}
                            color={i < review.rating ? '#f9a825' : '#e5e7eb'}
                          />
                        ))}
                      </div>
                      <p className="an-review-text">{review.comment || 'No comment.'}</p>
                      <p className="an-review-meta">
                        {review.buyerName} on <strong>{review.productName}</strong> · {timeAgo(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboardPage;
