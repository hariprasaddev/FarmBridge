import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { farmerProductsAPI, farmerVerificationAPI, getErrorMessage } from '../services/api';
import ProductCard, { getStock } from '../components/ProductCard';
import Icon from '../components/Icon';
import { ConfirmDialog, EmptyState } from '../components/ui';
import { FaBoxOpen, FaSearch } from 'react-icons/fa';
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
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);

  // Verification status — gates Create/Update/Delete actions until APPROVED
  const [verified, setVerified] = useState(null);

  // Presentation-level filters (client-side, on the already-fetched products)
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadVerification();
  }, []);

  const loadVerification = async () => {
    try {
      const response = await farmerVerificationAPI.getVerification();
      setVerified(response.data.verificationStatus === 'APPROVED');
    } catch (err) {
      // 404 = no submission yet — the account is not approved
      setVerified(false);
    }
  };

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
    setConfirmDeleteProduct(null);
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
          {verified ? (
            <Link to="/farmer/products/add" className="mp-btn-add">
              <Icon name="plus" size={17} />
              Add Product
            </Link>
          ) : (
            <button
              type="button"
              className="mp-btn-add mp-btn-add-locked"
              title="Complete farmer verification to add products"
            >
              <Icon name="lock" size={16} />
              Add Product
            </button>
          )}
        </header>

        {verified === false && (
          <div className="alert alert-warning">
            <Icon name="shieldCheck" size={15} />
            Your account is not verified yet. Create, edit and delete are
            unlocked after an admin approves your{' '}
            <Link to="/farmer/verification" className="fd-banner-link">
              verification request
            </Link>
            .
          </div>
        )}

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
                <EmptyState
                  icon={<FaBoxOpen size={30} />}
                  title="You haven't added any products yet."
                  description={
                    verified
                      ? 'List your fresh produce and start selling to buyers.'
                      : 'Complete your farmer verification to start listing products.'
                  }
                  action={
                    verified ? (
                      <Link to="/farmer/products/add" className="mp-empty-btn">
                        <Icon name="plus" size={16} />
                        Add your first product
                      </Link>
                    ) : (
                      <Link to="/farmer/verification" className="mp-empty-btn">
                        <Icon name="shieldCheck" size={16} />
                        Complete verification
                      </Link>
                    )
                  }
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mp-empty">
                <EmptyState
                  icon={<FaSearch size={30} />}
                  title="No matching products"
                  description="Try adjusting your search or filters."
                  action={
                    <button type="button" className="mp-clear-btn" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mp-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    deleting={deleting === product.id}
                    locked={!verified}
                    onEdit={(id) => navigate(`/farmer/products/edit/${id}`)}
                    onDelete={(id) => setConfirmDeleteProduct(id)}
                  />
                ))}

                {/* Add New Product tile — last card in the grid */}
                {verified ? (
                  <Link to="/farmer/products/add" className="mp-tile">
                    <span className="mp-tile-icon">
                      <Icon name="plus" size={24} />
                    </span>
                    <span>Add New Product</span>
                  </Link>
                ) : (
                  <Link to="/farmer/verification" className="mp-tile mp-tile-locked">
                    <span className="mp-tile-icon">
                      <Icon name="shieldCheck" size={24} />
                    </span>
                    <span>Complete verification to add products</span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ==========================================
          DELETE PRODUCT CONFIRMATION (design system)
          ========================================== */}
      <ConfirmDialog
        open={!!confirmDeleteProduct}
        onCancel={() => setConfirmDeleteProduct(null)}
        onConfirm={() => handleDelete(confirmDeleteProduct)}
        title="Delete product?"
        message="This will permanently remove this product and its image. Existing orders are not affected. This action cannot be undone."
        confirmLabel="Delete Product"
        variant="danger"
        loading={deleting === confirmDeleteProduct}
      />
    </div>
  );
}

export default ProductsPage;
