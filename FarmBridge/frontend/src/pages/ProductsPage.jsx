import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { farmerProductsAPI, getErrorMessage } from '../services/api';
import ProductCard, { getStock } from '../components/ProductCard';
import Icon from '../components/Icon';
import './ProductsPage.css';

const STOCK_PILLS = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out Of Stock' },
];

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Presentation-level filters (client-side, on the already-fetched products)
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await farmerProductsAPI.getMyProducts();
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your products. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeleting(id);
    setError('');
    setSuccess('');

    try {
      await farmerProductsAPI.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccess('Product deleted successfully');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete the product. Please try again.'));
    } finally {
      setDeleting(null);
    }
  };

  // Derived: search + stock filter (client-side only)
  const query = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.description || '').toLowerCase().includes(query);
    const stock = getStock(product.quantity);
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && stock.tone === 'in') ||
      (stockFilter === 'LOW_STOCK' && stock.tone === 'low') ||
      (stockFilter === 'OUT_OF_STOCK' && stock.tone === 'out');
    return matchesSearch && matchesStock;
  });

  const filtersActive = search.trim() !== '' || stockFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStockFilter('ALL');
  };

  const renderSkeletons = () =>
    Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="mp-skeleton" aria-hidden="true">
        <div className="mp-skeleton-media" />
        <div className="mp-skeleton-body">
          <div className="mp-skeleton-line mp-skeleton-line--lg" />
          <div className="mp-skeleton-line mp-skeleton-line--price" />
          <div className="mp-skeleton-line mp-skeleton-line--sm" />
        </div>
        <div className="mp-skeleton-actions" />
      </div>
    ));

  return (
    <div className="mp-root">
      <div className="mp-inner">
        {/* ============ Header ============ */}
        <header className="mp-head">
          <div className="mp-title">
            <h1>My Products</h1>
            <p className="mp-sub">
              {products.length} {products.length === 1 ? 'Product' : 'Products'} Listed
            </p>
          </div>
          <Link to="/farmer/products/add" className="mp-btn-add">
            <Icon name="plus" size={17} />
            Add Product
          </Link>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="mp-grid">{renderSkeletons()}</div>
        ) : (
          <>
            {/* ============ Search + filter pills ============ */}
            {products.length > 0 && (
              <div className="mp-toolbar">
                <div className="mp-search">
                  <Icon name="search" size={18} />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search your products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="mp-search-clear"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>

                <div className="mp-pills">
                  {STOCK_PILLS.map((pill) => (
                    <button
                      key={pill.value}
                      className={`mp-pill ${stockFilter === pill.value ? 'active' : ''}`}
                      onClick={() => setStockFilter(pill.value)}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ============ Empty / Grid ============ */}
            {products.length === 0 ? (
              <div className="mp-empty">
                <span className="mp-empty-icon">
                  <Icon name="package" size={28} />
                </span>
                <h2>You haven&apos;t added any products yet.</h2>
                <p>List your fresh produce and start selling to buyers.</p>
                <Link to="/farmer/products/add" className="mp-empty-btn">
                  <Icon name="plus" size={16} />
                  Add your first product
                </Link>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mp-empty">
                <span className="mp-empty-icon">
                  <Icon name="search" size={28} />
                </span>
                <h2>No matching products</h2>
                <p>Try adjusting your search or filters.</p>
                <button type="button" className="mp-clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="mp-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    deleting={deleting === product.id}
                    onEdit={(id) => navigate(`/farmer/products/edit/${id}`)}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Add New Product tile — last card in the grid */}
                <Link to="/farmer/products/add" className="mp-tile">
                  <span className="mp-tile-icon">
                    <Icon name="plus" size={24} />
                  </span>
                  <span>Add New Product</span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
