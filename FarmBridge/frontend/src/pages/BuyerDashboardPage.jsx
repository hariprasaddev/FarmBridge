import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaRupeeSign,
  FaTag,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaHistory,
  FaThumbsUp,
} from 'react-icons/fa';
import { analyticsAPI, getErrorMessage } from '../services/api';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import AnimatedNumber from '../components/AnimatedNumber';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ProductImage from '../components/ProductImage';
import Icon from '../components/Icon';
import './BuyerDashboardPage.css';

const CHART_COLORS = [
  '#2e7d32', '#66bb6a', '#f9a825', '#ef6c00',
  '#26a69a', '#5c6bc0', '#ec407a', '#8d6e63',
];

const inr = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const monthLabel = (year, month) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

function BdTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bd-tooltip">
      <p className="bd-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="bd-tooltip-row">
          <span className="bd-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
          <span>{entry.name}</span>
          <strong>
            {currency ? inr(entry.value) : Number(entry.value ?? 0).toLocaleString('en-IN')}
          </strong>
        </p>
      ))}
    </div>
  );
}

function BdEmpty({ message }) {
  return (
    <div className="bd-empty">
      <span className="bd-empty-icon"><Icon name="chart" size={22} /></span>
      <span>{message || 'No data yet'}</span>
    </div>
  );
}

function ProductTile({ product, sub }) {
  return (
    <Link
      to={`/buyer/products/${product.id}`}
      className="bd-tile"
      title={product.name}
    >
      <div className="bd-tile-media">
        <ProductImage product={product} className="bd-tile-image" />
        {product.farmerVerified && (
          <span className="bd-tile-verified" title="Verified Farmer">
            <Icon name="badgeCheck" size={11} />
          </span>
        )}
      </div>
      <div className="bd-tile-body">
        <h4>{product.name}</h4>
        <p className="bd-tile-price">₹{product.price?.toLocaleString()}</p>
        {sub && <p className="bd-tile-sub">{sub}</p>}
      </div>
    </Link>
  );
}

function BuyerDashboardPage() {
  const [data, setData] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await analyticsAPI.buyerAnalytics();
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ----- Cards -----
  const cards = data
    ? [
        { label: 'Orders', value: data.orders, icon: FaShoppingCart, tone: 'green', to: '/buyer/orders', sub: 'All-time orders' },
        { label: 'Wishlist', value: data.wishlist, icon: FaHeart, tone: 'pink', to: '/buyer/wishlist', sub: 'Saved products' },
        { label: 'Reviews', value: data.reviews, icon: FaStar, tone: 'amber', to: '/buyer/orders', sub: 'Reviews written' },
        { label: 'Money Spent', value: data.moneySpent, icon: FaRupeeSign, tone: 'purple', to: '/buyer/orders', sub: 'Completed orders', currency: true },
        { label: 'Favorite Category', value: data.favoriteCategory || '—', icon: FaTag, tone: 'indigo', to: '/buyer/products', sub: 'Most purchased' },
        { label: 'Purchased Products', value: data.purchasedProducts, icon: FaBoxOpen, tone: 'teal', to: '/buyer/orders', sub: 'Distinct products' },
        { label: 'Pending Orders', value: data.pendingOrders, icon: FaClock, tone: 'orange', to: '/buyer/orders', sub: 'Awaiting farmer' },
        { label: 'Completed Orders', value: data.completedOrders, icon: FaCheckCircle, tone: 'emerald', to: '/buyer/orders', sub: 'Delivered' },
      ]
    : [];

  // ----- Charts -----
  const monthlySpending = (data?.monthlySpending || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Spending: Math.round(m.value),
  }));
  const purchasesByCategory = (data?.purchasesByCategory || []).map((c) => ({
    name: c.category,
    value: c.quantity,
  }));
  const ordersTimeline = (data?.ordersTimeline || []).map((m) => ({
    name: monthLabel(m.year, m.month),
    Orders: m.count,
  }));

  // ----- Sections -----
  const recommended = data?.recommendedProducts || [];
  const latestOrders = data?.latestOrders || [];
  const favoriteFarmers = data?.favoriteFarmers || [];

  return (
    <div className="bd-root">
      <div className="bd-inner">
        <header className="bd-head">
          <div>
            <h1>My Dashboard</h1>
            <p className="bd-sub">Your shopping insights at a glance</p>
          </div>
          <button type="button" className="bd-refresh" onClick={load} aria-label="Refresh dashboard">
            <Icon name="refreshCw" size={16} />
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="bd-loading">
            <div className="bd-skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bd-skeleton bd-skeleton-card" />
              ))}
            </div>
            <div className="bd-skeleton-grid bd-skeleton-grid--3">
              <div className="bd-skeleton bd-skeleton-chart" />
              <div className="bd-skeleton bd-skeleton-chart" />
              <div className="bd-skeleton bd-skeleton-chart" />
            </div>
          </div>
        ) : error ? (
          <div className="bd-error">
            <div className="alert alert-error">{error}</div>
            <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
          </div>
        ) : (
          <div className="bd-content">
            {/* ============ Stat cards ============ */}
            <div className="bd-cards">
              {cards.map((card) => {
                const CardIcon = card.icon;
                const isText = card.label === 'Favorite Category';
                return (
                  <Link key={card.label} to={card.to} className="bd-card">
                    <div className="bd-card-top">
                      <span className={`bd-card-icon bd-card-icon-${card.tone}`}>
                        <CardIcon size={18} />
                      </span>
                      <span className="bd-card-arrow"><Icon name="arrow" size={14} /></span>
                    </div>
                    <div className={`bd-card-value ${isText ? 'bd-card-value-text' : ''}`}>
                      {card.currency ? (
                        <AnimatedNumber value={card.value} format={inr} />
                      ) : isText ? (
                        card.value
                      ) : (
                        <AnimatedNumber value={card.value} />
                      )}
                    </div>
                    <div className="bd-card-label">{card.label}</div>
                    <div className="bd-card-sub">{card.sub}</div>
                  </Link>
                );
              })}
            </div>

            {/* ============ Charts ============ */}
            <div className="bd-charts">
              <section className="bd-panel">
                <div className="bd-panel-head">
                  <div>
                    <h3>Monthly Spending</h3>
                    <p>Completed order spend</p>
                  </div>
                  <FaRupeeSign className="bd-panel-icon" size={16} />
                </div>
                <div className="bd-chart-box">
                  {monthlySpending.length === 0 ? (
                    <BdEmpty />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlySpending} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bdSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                        <Tooltip content={<BdTooltip currency />} />
                        <Area type="monotone" dataKey="Spending" stroke="#2e7d32" strokeWidth={2.5} fill="url(#bdSpend)" activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="bd-panel">
                <div className="bd-panel-head">
                  <div>
                    <h3>Purchases by Category</h3>
                    <p>Quantity ordered</p>
                  </div>
                  <FaTag className="bd-panel-icon" size={16} />
                </div>
                <div className="bd-chart-box">
                  {purchasesByCategory.length === 0 ? (
                    <BdEmpty />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={purchasesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={3}>
                          {purchasesByCategory.map((entry, i) => (
                            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<BdTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="bd-panel">
                <div className="bd-panel-head">
                  <div>
                    <h3>Orders Timeline</h3>
                    <p>Orders placed per month</p>
                  </div>
                  <FaShoppingCart className="bd-panel-icon" size={16} />
                </div>
                <div className="bd-chart-box">
                  {ordersTimeline.length === 0 ? (
                    <BdEmpty />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ordersTimeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                        <Tooltip content={<BdTooltip />} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
                        <Bar dataKey="Orders" fill="#66bb6a" radius={[5, 5, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>

            {/* ============ Recently Viewed ============ */}
            <section className="bd-section">
              <div className="bd-section-head">
                <div>
                  <h2><FaHistory size={16} /> Recently Viewed</h2>
                  <p>Products you checked out</p>
                </div>
                {recentlyViewed.length > 0 && (
                  <Link to="/buyer/products" className="bd-panel-link">Browse more</Link>
                )}
              </div>
              {recentlyViewed.length === 0 ? (
                <div className="bd-note">
                  Products you view will appear here. Start browsing the marketplace!
                </div>
              ) : (
                <div className="bd-tile-row">
                  {recentlyViewed.slice(0, 8).map((product) => (
                    <ProductTile key={product.id} product={product} sub={product.farmerName} />
                  ))}
                </div>
              )}
            </section>

            {/* ============ Recommended ============ */}
            <section className="bd-section">
              <div className="bd-section-head">
                <div>
                  <h2><FaThumbsUp size={16} /> Recommended For You</h2>
                  <p>
                    {data?.favoriteCategory
                      ? `Picked from your favourite category (${data.favoriteCategory})`
                      : 'Top-rated products on the marketplace'}
                  </p>
                </div>
              </div>
              {recommended.length === 0 ? (
                <div className="bd-note">No recommendations available yet — try placing an order.</div>
              ) : (
                <div className="bd-tile-row">
                  {recommended.map((product) => (
                    <ProductTile key={product.id} product={product} sub={product.farmerName} />
                  ))}
                </div>
              )}
            </section>

            {/* ============ Tables ============ */}
            <div className="bd-tables">
              <section className="bd-panel">
                <div className="bd-panel-head">
                  <div>
                    <h3>Latest Orders</h3>
                    <p>Your most recent purchases</p>
                  </div>
                  <Link to="/buyer/orders" className="bd-panel-link">View all</Link>
                </div>
                {latestOrders.length === 0 ? (
                  <BdEmpty message="No orders yet" />
                ) : (
                  <div className="bd-table-wrap">
                    <table className="bd-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Farmer</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="bd-dim">#{order.id}</td>
                            <td className="bd-cell-main">{order.productName}</td>
                            <td>{order.farmerName}</td>
                            <td>{inr(order.totalPrice)}</td>
                            <td><OrderStatusBadge status={order.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="bd-panel">
                <div className="bd-panel-head">
                  <div>
                    <h3>Favorite Farmers</h3>
                    <p>You order from them most</p>
                  </div>
                  <FaHeart className="bd-panel-icon" size={15} />
                </div>
                {favoriteFarmers.length === 0 ? (
                  <BdEmpty message="No favourite farmers yet" />
                ) : (
                  <div className="bd-table-wrap">
                    <table className="bd-table">
                      <thead>
                        <tr>
                          <th>Farmer</th>
                          <th>Orders</th>
                          <th>Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favoriteFarmers.map((farmer) => (
                          <tr key={farmer.userId}>
                            <td className="bd-cell-main">
                              {farmer.name}
                              <span className="bd-cell-sub">{farmer.email}</span>
                            </td>
                            <td>{farmer.orderCount}</td>
                            <td className="bd-strong">{inr(farmer.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerDashboardPage;
