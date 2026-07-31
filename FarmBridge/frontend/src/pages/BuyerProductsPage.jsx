import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyerProductsAPI, buyerOrdersAPI } from '../services/api';

function BuyerProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
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
      const message =
        err.response?.data?.message || 'Failed to place order';
      setOrderError(
        typeof message === 'string' ? message : 'Failed to place order'
      );
    } finally {
      setPlacing(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="page-container">
      <div className="products-page">
        <div className="products-header">
          <div>
            <h1>Browse Products</h1>
            <p className="products-subtitle">
              Fresh produce straight from farmers
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {products.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">🌾</div>
            <h3>No products available</h3>
            <p>Check back soon — farmers are adding new listings.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-card-header">
                  <div className="product-category-badge">
                    {product.category}
                  </div>
                  <div className="product-price">
                    ₹{product.price?.toLocaleString()}
                  </div>
                </div>

                <div className="product-card-body">
                  <h3 className="product-name">{product.name}</h3>
                  {product.description && (
                    <p className="product-description">
                      {product.description.length > 100
                        ? product.description.substring(0, 100) + '...'
                        : product.description}
                    </p>
                  )}
                  <div className="product-meta">
                    <span className="product-quantity">
                      📦 Available: {product.quantity}
                    </span>
                    <span className="product-quantity">
                      👨‍🌾 {product.farmerName}
                    </span>
                  </div>
                </div>

                <div className="product-card-actions">
                  <button
                    className="btn btn-primary btn-sm btn-full"
                    onClick={() => openOrderModal(product)}
                    disabled={product.quantity <= 0}
                  >
                    {product.quantity > 0 ? '🛒 Place Order' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
