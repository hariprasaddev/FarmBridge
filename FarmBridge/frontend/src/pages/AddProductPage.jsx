import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerProductsAPI, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

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

// Matches the backend upload limit (spring.http.multipart.max-file-size = 5MB)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function AddProductPage() {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Revoke the object URL when it is replaced or on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast('Please choose a JPG, PNG, WEBP or GIF image.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image is too large. Maximum size is 5 MB.', 'error');
      e.target.value = '';
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
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

      // 1. Create the product first using the existing Product API
      const response = await farmerProductsAPI.createProduct(payload);
      const product = response.data;

      // 2. Automatically upload the selected image (if any)
      if (imageFile) {
        try {
          await farmerProductsAPI.uploadProductImage(product.id, imageFile);
          showToast('Product created and image uploaded successfully');
        } catch (uploadErr) {
          // The product was still created — surface the upload problem only
          showToast(
            getErrorMessage(uploadErr, 'Product created, but the image upload failed.'),
            'error'
          );
        }
      } else {
        showToast('Product created successfully');
      }

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

          {/* ============ Product Image (optional) ============ */}
          <div className="form-group">
            <label>Product Image</label>
            <div className="product-image-field">
              <div
                className={`product-image-preview${
                  imagePreview ? '' : ' product-image-preview-empty'
                }`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Product image preview" />
                ) : (
                  <span className="product-image-placeholder">No image selected</span>
                )}
              </div>

              <div className="product-image-actions">
                <label className="btn btn-outline product-image-btn">
                  <input
                    type="file"
                    className="product-image-input"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                  />
                  Choose Image
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    className="btn btn-outline product-image-btn product-image-btn-remove"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </button>
                )}
              </div>

              <p className="product-image-hint">
                Optional — JPG, PNG, WEBP or GIF, up to 5 MB.
              </p>
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
