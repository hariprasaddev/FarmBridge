import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { farmerProductsAPI } from '../services/api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);
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
      setError('Failed to load products. Please try again.');
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
      const message =
        err.response?.data?.message || 'Failed to delete product';
      setError(typeof message === 'string' ? message : 'Failed to delete product');
    } finally {
      setDeleting(null);
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
            <h1>My Products</h1>
            <p className="products-subtitle">
              Manage your product listings
            </p>
          </div>
          <Link to="/farmer/products/add" className="btn btn-primary">
            + Add Product
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {products.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">📦</div>
            <h3>No products yet</h3>
            <p>Start by adding your first product listing.</p>
            <Link to="/farmer/products/add" className="btn btn-primary">
              + Add Your First Product
            </Link>
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
                      📦 Qty: {product.quantity}
                    </span>
                  </div>
                </div>

                <div className="product-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      navigate(`/farmer/products/edit/${product.id}`)
                    }
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm btn-danger-outline"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                  >
                    {deleting === product.id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
