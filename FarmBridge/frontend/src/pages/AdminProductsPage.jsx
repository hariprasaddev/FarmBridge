import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import AdminPagination from '../components/AdminPagination';
import './AdminPages.css';

const PAGE_SIZE = 10;

// Stock status derived from the existing quantity value:
// 0 = Out of Stock, 1–10 = Low Stock, >10 = In Stock.
const getStock = (qty) => {
  if (!qty || qty <= 0) return { label: 'Out of Stock', tone: 'out' };
  if (qty <= 10) return { label: 'Low Stock', tone: 'low' };
  return { label: 'In Stock', tone: 'in' };
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllProducts();
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load the products. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Derived: all categories present in the loaded products.
  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Client-side search + category filter over the already-fetched products.
  const query = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesCategory = category === 'ALL' || p.category === category;
    const matchesSearch =
      !query ||
      (p.name || '').toLowerCase().includes(query) ||
      (p.farmerName || '').toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = search.trim() !== '' || category !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setCategory('ALL');
    setPage(1);
  };

  return (
    <AdminLayout title="All Products" subtitle="Every product listed across the platform">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" size={17} />
          <input
            type="text"
            name="search"
            placeholder="Search by product, farmer, or description..."
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
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`adm-pill${category === cat ? ' active' : ''}`}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {filtersActive && (
          <button type="button" className="adm-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        )}

        <span className="adm-count">{filteredProducts.length} products</span>
      </div>

      {loading ? (
        <div className="adm-skeleton-table" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="adm-skeleton-row">
              <div className="adm-skeleton-cell adm-skeleton-cell--avatar" />
              <div className="adm-skeleton-cell adm-skeleton-cell--lg" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--flex" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="adm-table-card">
          <div className="adm-empty">
            <span className="adm-empty-icon">
              <Icon name="package" size={28} />
            </span>
            <h2>No products found</h2>
            <p>There are no products matching this search or filter.</p>
          </div>
        </div>
      ) : (
        <div className="adm-table-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Farmer</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageProducts.map((product) => {
                  const stock = getStock(product.quantity);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="adm-entity-cell">
                          <span className="adm-avatar adm-avatar-square">
                            <Icon name="package" size={16} />
                          </span>
                          <div className="adm-entity-name--block">
                            <span className="adm-entity-name adm-entity-name--block">
                              {product.name}
                            </span>
                            {product.description && (
                              <span className="adm-entity-sub">
                                {product.description.length > 60
                                  ? product.description.substring(0, 60) + '...'
                                  : product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="adm-badge adm-badge-category">
                          {product.category || '—'}
                        </span>
                      </td>
                      <td>{product.farmerName}</td>
                      <td className="adm-price">₹{product.price?.toLocaleString()}</td>
                      <td className="adm-qty">{product.quantity}</td>
                      <td>
                        <span className={`adm-badge adm-badge-${stock.tone}`}>
                          {stock.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={safePage}
            totalPages={totalPages}
            total={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminProductsPage;
