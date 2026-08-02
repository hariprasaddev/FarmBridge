import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { farmerProductsAPI, getErrorMessage } from '../services/api';

const categoryOptions = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Poultry',
  'Spices',
  'Pulses',
  'Oilseeds',
  'Other',
];

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await farmerProductsAPI.getProductById(id);
      const product = response.data;

      if (!product) {
        setNotFound(true);
        return;
      }

      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        category: product.category || '',
      });
    } catch (err) {
      // Product missing — show not-found state
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        // Server / network errors — show graceful error banner
        setError(getErrorMessage(err, 'Failed to load product details. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity, 10),
      };

      await farmerProductsAPI.updateProduct(id, payload);
      navigate('/farmer/products');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update the product. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/farmer/products');
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND STATE
  // ==========================================

  if (notFound) {
    return (
      <div className="page-container">
        <div className="product-form-page">
          <div className="products-empty">
            <div className="empty-icon">🔍</div>
            <h3>Product not found</h3>
            <p>
              This product does not exist or you don't have permission
              to edit it.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/farmer/products')}
            >
              Back to My Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EDIT FORM
  // ==========================================

  return (
    <div className="page-container">
      <div className="product-form-page">
        <div className="product-form-header">
          <div>
            <h1>Edit Product</h1>
            <p className="product-form-subtitle">
              Update your product listing details
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="e.g. Organic Tomatoes"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your product"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹)</label>
              <input
                id="price"
                type="number"
                name="price"
                placeholder="e.g. 50"
                min="1"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity Available</label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                placeholder="e.g. 100"
                min="1"
                step="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductPage;
