import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="page-container admin-page">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>All Products</h1>
            <p className="products-subtitle">
              Every product listed across the platform
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {products.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">📦</div>
            <h3>No products listed</h3>
            <p>Farmers haven't listed any products yet.</p>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Farmer</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="order-id">#{product.id}</td>
                    <td>
                      <div className="admin-product-name">
                        {product.name}
                        {product.description && (
                          <span className="admin-product-desc">
                            {product.description.length > 60
                              ? product.description.substring(0, 60) + '...'
                              : product.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="product-category-badge">
                        {product.category}
                      </span>
                    </td>
                    <td className="order-price">
                      ₹{product.price?.toLocaleString()}
                    </td>
                    <td>{product.quantity}</td>
                    <td>{product.farmerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProductsPage;
