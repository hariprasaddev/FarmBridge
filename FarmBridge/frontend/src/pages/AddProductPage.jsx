import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerProductsAPI, getErrorMessage } from '../services/api';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  category: '',
};

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

function AddProductPage() {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

      await farmerProductsAPI.createProduct(payload);
      navigate('/farmer/products');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create the product. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/farmer/products');
  };

  return (
    <div className="page-container">
      <div className="product-form-page">
        <div className="product-form-header">
          <div>
            <h1>Add New Product</h1>
            <p className="product-form-subtitle">
              List a new product for buyers to discover
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
              placeholder="Describe your product — quality, harvest date, variety, etc."
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
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;
