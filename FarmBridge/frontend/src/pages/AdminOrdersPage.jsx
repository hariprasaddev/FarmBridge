import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import AdminPagination from '../components/AdminPagination';
import './AdminPages.css';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PAGE_SIZE = 10;

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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
      setError(getErrorMessage(err, 'Failed to load the orders. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Client-side search + status filter over the already-fetched orders.
  const query = search.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filter === 'ALL' || o.status === filter;
    const matchesSearch =
      !query ||
      String(o.id).includes(query) ||
      (o.productName || '').toLowerCase().includes(query) ||
      (o.buyerName || '').toLowerCase().includes(query) ||
      (o.farmerName || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = search.trim() !== '' || filter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setFilter('ALL');
    setPage(1);
  };

  return (
    <AdminLayout title="All Orders" subtitle="Every order placed across the platform">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" size={17} />
          <input
            type="text"
            name="search"
            placeholder="Search by order ID, product, buyer, or farmer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              className="adm-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        <div className="adm-pills">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`adm-pill${filter === status.value ? ' active' : ''}`}
              onClick={() => {
                setFilter(status.value);
                setPage(1);
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        {filtersActive && (
          <button type="button" className="adm-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        )}

        <span className="adm-count">{filteredOrders.length} orders</span>
      </div>

      {loading ? (
        <div className="adm-skeleton-table" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="adm-skeleton-row">
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--flex" />
              <div className="adm-skeleton-cell adm-skeleton-cell--md" />
              <div className="adm-skeleton-cell adm-skeleton-cell--md" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="adm-table-card">
          <div className="adm-empty">
            <span className="adm-empty-icon">
              <Icon name="orders" size={28} />
            </span>
            <h2>No orders found</h2>
            <p>There are no orders matching this search or filter.</p>
          </div>
        </div>
      ) : (
        <div className="adm-table-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
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
                {pageOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="adm-id">#{order.id}</td>
                    <td>
                      <div className="adm-entity-cell">
                        <span className="adm-avatar adm-avatar-square">
                          <Icon name="package" size={15} />
                        </span>
                        <span className="adm-entity-name adm-entity-name--tight">
                          {order.productName}
                        </span>
                      </div>
                    </td>
                    <td>{order.buyerName}</td>
                    <td>{order.farmerName}</td>
                    <td className="adm-qty">{order.quantity}</td>
                    <td className="adm-price">₹{order.totalPrice?.toLocaleString()}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={safePage}
            totalPages={totalPages}
            total={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminOrdersPage;
