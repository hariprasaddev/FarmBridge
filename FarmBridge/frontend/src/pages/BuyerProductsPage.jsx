import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyerProductsAPI, buyerOrdersAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import './BuyerProductsPage.css';

// Availability derived from the existing product.quantity value.
const getStock = (qty) => {
  if (qty <= 0) return { label: 'Out of Stock', tone: 'out' };
  if (qty <= 20) return { label: 'Low Stock', tone: 'low' };
  return { label: 'In Stock', tone: 'in' };
};

function BuyerProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & category filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  // Place-order modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await buyerProductsAPI.getAllProducts();
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load available products. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Derived: all categories present in the loaded products
  const categories = ['ALL', ...new Set(products.map((p) => p.category))];

  // Derived: apply client-side search + category filter
  const query = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.description || '').toLowerCase().includes(query);
    const matchesCategory =
      category === 'ALL' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearch('');
    setCategory('ALL');
  };

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderError('');
  };

  const closeOrderModal = () => {
    setSelectedProduct(null);
    setOrderError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setOrderError('');

    try {
      await buyerOrdersAPI.placeOrder({
        productId: selectedProduct.id,
        quantity: parseInt(quantity, 10),
      });
      closeOrderModal();
      navigate('/buyer/orders');
    } catch (err) {
      setOrderError(getErrorMessage(err, 'Failed to place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  const renderSkeletons = () =>
    Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bp-skeleton" aria-hidden="true">
        <div className="bp-skeleton-media" />
        <div className="bp-skeleton-body">
          <div className="bp-skeleton-line bp-skeleton-line--lg" />
          <div className="bp-skeleton-line bp-skeleton-line--sm" />
          <div className="bp-skeleton-line bp-skeleton-line--price" />
        </div>
        <div className="bp-skeleton-actions" />
      </div>
    ));

  const renderCard = (product) => {
    const stock = getStock(product.quantity);

    return (
      <div key={product.id} className="bp-card">
        <div className="bp-card-media">
          <ProductImage product={product} className="bp-image" />
          <span className={`bp-stock bp-stock-${stock.tone}`}>{stock.label}</span>
        </div>

        <div className="bp-card-body">
          <h3 className="bp-card-name" title={product.name}>
            {product.name}
          </h3>
          <p className="bp-card-farmer">
            <Icon name="profile" size={13} />
            by {product.farmerName}
          </p>
          <div className="bp-card-foot">
            <span className="bp-card-price">₹{product.price?.toLocaleString()}</span>
          </div>
        </div>

        <div className="bp-card-actions">
          <button
            className="bp-add-btn"
            onClick={() => openOrderModal(product)}
            disabled={product.quantity <= 0}
          >
            <Icon name="cart" size={16} />
            {product.quantity > 0 ? 'Add to Order' : 'Out of Stock'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bp-root">
      <div className="bp-inner">
        <header className="bp-head">
          <h1>Browse Products</h1>
          <p className="bp-sub">Fresh produce straight from farmers</p>
        </header>

        <div className="bp-toolbar">
          <div className="bp-search">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="bp-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <div className="bp-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`bp-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="bp-grid">{renderSkeletons()}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="bp-empty">
            <span className="bp-empty-icon">
              <Icon name="search" size={28} />
            </span>
            <h2>
              {products.length === 0 ? 'No products available' : 'No products found'}
            </h2>
            <p>
              {products.length === 0
                ? 'Check back soon — farmers are adding new listings.'
                : 'Try another search or category.'}
            </p>
            {(search || category !== 'ALL') && (
              <button type="button" className="bp-empty-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bp-grid">{filteredProducts.map(renderCard)}</div>
        )}
      </div>

      {/* ==========================================
          PLACE ORDER MODAL
          ========================================== */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Place Order</h3>
              <button
                className="modal-close"
                onClick={closeOrderModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-summary">
                <div className="order-summary-item">
                  <span className="detail-label">Product</span>
                  <span className="detail-value">
                    {selectedProduct.name}
                  </span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Farmer</span>
                  <span className="detail-value">
                    {selectedProduct.farmerName}
                  </span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Price</span>
                  <span className="detail-value">
                    ₹{selectedProduct.price?.toLocaleString()}
                  </span>
                </div>
                <div className="order-summary-item">
                  <span className="detail-label">Available</span>
                  <span className="detail-value">
                    {selectedProduct.quantity}
                  </span>
                </div>
              </div>

              {orderError && (
                <div className="alert alert-error">{orderError}</div>
              )}

              <form onSubmit={handlePlaceOrder} className="order-form">
                <div className="form-group">
                  <label htmlFor="order-quantity">Quantity</label>
                  <input
                    id="order-quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.quantity}
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="order-total">
                  <span>Total</span>
                  <span className="order-total-amount">
                    ₹
                    {(
                      (selectedProduct.price || 0) *
                      (parseInt(quantity, 10) || 0)
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeOrderModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={placing}
                  >
                    {placing ? 'Placing...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerProductsPage;
