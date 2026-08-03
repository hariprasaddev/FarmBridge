import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { farmerProductsAPI, getErrorMessage } from '../services/api';
import { getCategoryDefaultImage } from '../utils/productImages';
import ProductImage from '../components/ProductImage';
import { useToast } from '../components/Toast';

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

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  // Image state: existing backend image + newly selected file/preview
  const [existingImage, setExistingImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Revoke the object URL when it is replaced or on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
      setExistingImage(product.imageUrl || '');
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

  const handleRemoveNewImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
  };

  // What the preview shows: the newly picked file, else the existing image,
  // else the category default illustration.
  const previewSource = imagePreview || existingImage || getCategoryDefaultImage(form.category);

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

      // 1. Update the product details (existing API)
      await farmerProductsAPI.updateProduct(id, payload);

      // 2. If a new image was picked, replace the old one via the upload API
      if (imageFile) {
        try {
          await farmerProductsAPI.uploadProductImage(id, imageFile);
          showToast('Product updated and image replaced successfully');
        } catch (uploadErr) {
          showToast(
            getErrorMessage(uploadErr, 'Product updated, but the image upload failed.'),
            'error'
          );
        }
      } else {
        showToast('Product updated successfully');
      }

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

          {/* ============ Product Image (replace) ============ */}
          <div className="form-group">
            <label>Product Image</label>
            <div className="product-image-field">
              <div className="product-image-preview">
                <ProductImage
                  product={{ imageUrl: previewSource, category: form.category }}
                  alt="Product image preview"
                />
              </div>

              <div className="product-image-actions">
                <label className="btn btn-outline product-image-btn">
                  <input
                    type="file"
                    className="product-image-input"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                  />
                  {imageFile ? 'Replace Image' : 'Choose Image'}
                </label>
                {imageFile && (
                  <button
                    type="button"
                    className="btn btn-outline product-image-btn product-image-btn-remove"
                    onClick={handleRemoveNewImage}
                  >
                    Keep Current
                  </button>
                )}
              </div>

              <p className="product-image-hint">
                {existingImage
                  ? 'Choose a new image to replace the current one.'
                  : 'Optional — JPG, PNG, WEBP or GIF, up to 5 MB.'}
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
              {saving ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductPage;
