import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  buyerProductsAPI,
  buyerOrdersAPI,
  buyerReviewsAPI,
  getErrorMessage,
} from '../services/api';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import WishlistButton from '../components/WishlistButton';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ui';
import { getStock } from '../utils/stock';
import { recordRecentlyViewed } from '../utils/recentlyViewed';
import './ProductDetailsPage.css';

// Mirrors the backend review-eligibility rule (ReviewServiceImpl): a
// buyer may review a product only once an order for it reaches ACCEPTED
// or COMPLETED. Kept in sync here so the review form can be hidden
// up-front instead of surfacing a backend error on submit.
const PURCHASED_STATUSES = ['ACCEPTED', 'COMPLETED'];

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Order state (reuses the existing buyer order API)
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Reviews & Ratings state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewFormError, setReviewFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Whether the logged-in buyer may write a review for this product
  // (they must have purchased it — order status ACCEPTED or COMPLETED).
  const [canReview, setCanReview] = useState(false);

  // Guards against applying stale responses after navigating away
  // or switching to another product.
  const mountedRef = useRef(true);

  // ==========================================
  // DATA LOADING
  // ==========================================

  // `silent` refresh mode is used after review mutations so the page
  // updates seamlessly without flashing the loading skeletons.
  const loadProduct = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
      setOrderError('');
      setQuantity(1);
      setProduct(null);
      setRelated([]);
    }
    try {
      const response = await buyerProductsAPI.getProductById(id);
      if (!mountedRef.current) return;
      const data = response.data;
      setProduct(data);

      // Record the view for the buyer dashboard's "Recently Viewed"
      recordRecentlyViewed(data);

      // Related products — same category, current product excluded.
      try {
        const relResponse = await buyerProductsAPI.getProductsByCategory(
          data.category
        );
        if (!mountedRef.current) return;
        setRelated(
          relResponse.data.filter((p) => p.id !== data.id).slice(0, 4)
        );
      } catch {
        if (mountedRef.current) setRelated([]);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getErrorMessage(err, 'Failed to load the product.'));
      }
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [id]);

  // Loads the review list and the buyer's own review together, and
  // determines whether the buyer is eligible to write a review.
  const loadReviews = useCallback(async (silent = false) => {
    if (!silent) {
      setReviewsLoading(true);
      setCanReview(false);
    }
    setReviewsError('');
    let mine = null;
    try {
      const [listResponse, mineResponse] = await Promise.all([
        buyerReviewsAPI.getReviews(id),
        buyerReviewsAPI.getMyReview(id),
      ]);
      if (!mountedRef.current) return;
      setReviews(listResponse.data || []);

      // GET .../reviews/mine returns an empty body when the buyer
      // has not reviewed the product yet.
      mine =
        mineResponse.data && mineResponse.data.id ? mineResponse.data : null;
      setMyReview(mine);
      setRating(mine ? mine.rating : 0);
      setComment(mine ? mine.comment || '' : '');
      setEditingReview(false);
    } catch (err) {
      if (mountedRef.current) {
        setReviewsError(
          getErrorMessage(err, 'Failed to load reviews.')
        );
      }
    } finally {
      if (mountedRef.current && !silent) setReviewsLoading(false);
    }

    // Review eligibility — the backend only lets buyers review products
    // they have purchased (an order for this product in ACCEPTED or
    // COMPLETED state). Mirror that rule here using the existing orders
    // endpoint, so the review form is hidden up-front instead of the
    // buyer hitting a backend error on submit.
    let purchased = false;
    try {
      const ordersResponse = await buyerOrdersAPI.getMyOrders();
      purchased = (ordersResponse.data || []).some(
        (order) =>
          order.productId === Number(id) &&
          PURCHASED_STATUSES.includes(order.status)
      );
    } catch {
      // Orders couldn't be fetched — stay safe and hide the form
      // (unless the buyer already has a review to show).
      purchased = false;
    }
    if (mountedRef.current) setCanReview(purchased || Boolean(mine));
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    loadProduct();
    loadReviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Ignore stale responses when the user navigates to another product.
    return () => {
      mountedRef.current = false;
    };
  }, [id, loadProduct, loadReviews]);

  // ==========================================
  // ORDER HANDLERS
  // ==========================================

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));

  const increaseQty = () =>
    setQuantity((q) => Math.min(product.quantity, q + 1));

  // Reuses the existing order creation API (POST /api/buyer/orders).
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setOrderError('');

    try {
      await buyerOrdersAPI.placeOrder({
        productId: product.id,
        quantity,
      });
      showToast('Order placed successfully!');
      navigate('/buyer/orders');
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Failed to place your order. Please try again.'
      );
      setOrderError(message);
      showToast(message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  // ==========================================
  // REVIEW HANDLERS
  // ==========================================

  const formatDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Renders five stars, filling the first `value` (rounded) of them.
  const renderStars = (value, size = 16) =>
    Array.from({ length: 5 }).map((_, index) => (
      <span
        key={index}
        className={`pd-star ${
          index < Math.round(value || 0) ? 'pd-star-filled' : ''
        }`}
        aria-hidden="true"
      >
        <Icon name="star" size={size} />
      </span>
    ));

  const validateReview = () => {
    if (!rating || rating < 1 || rating > 5) {
      setReviewFormError('Please select a rating between 1 and 5 stars.');
      return false;
    }
    if (comment.length > 1000) {
      setReviewFormError('Comment must be at most 1000 characters.');
      return false;
    }
    setReviewFormError('');
    return true;
  };

  // Creates or updates the buyer's review, then refreshes the product
  // details, the review list and the rating summary — without reloading
  // the page.
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!validateReview()) return;
    setSubmitting(true);
    try {
      const payload = { rating, comment: comment.trim() || null };
      if (myReview) {
        await buyerReviewsAPI.updateReview(myReview.id, payload);
        showToast('Review updated successfully!');
      } else {
        await buyerReviewsAPI.createReview(product.id, payload);
        showToast('Review submitted. Thank you!');
      }
      await Promise.all([loadProduct(true), loadReviews(true)]);
    } catch (err) {
      showToast(
        getErrorMessage(
          err,
          'Failed to save your review. Please try again.'
        ),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    setRating(myReview.rating);
    setComment(myReview.comment || '');
    setEditingReview(true);
    setReviewFormError('');
  };

  const handleCancelEdit = () => {
    setEditingReview(false);
    setRating(myReview.rating);
    setComment(myReview.comment || '');
    setReviewFormError('');
  };

  const handleDeleteReview = async () => {
    setDeleting(true);
    try {
      await buyerReviewsAPI.deleteReview(myReview.id);
      showToast('Review deleted.');
      setConfirmDelete(false);
      setMyReview(null);
      setRating(0);
      setComment('');
      setEditingReview(false);
      await Promise.all([loadProduct(true), loadReviews(true)]);
    } catch (err) {
      showToast(
        getErrorMessage(
          err,
          'Failed to delete your review. Please try again.'
        ),
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Loading skeleton ----------
  if (loading) {
    return (
      <div className="pd-root">
        <div className="pd-inner">
          <div className="pd-skeleton pd-skeleton-back" />
          <div className="pd-main">
            <div className="pd-skeleton pd-skeleton-gallery" />
            <div className="pd-skeleton-body">
              <div className="pd-skeleton pd-skeleton-line pd-skeleton-line-lg" />
              <div className="pd-skeleton pd-skeleton-line pd-skeleton-line-price" />
              <div className="pd-skeleton pd-skeleton-line pd-skeleton-line-md" />
              <div className="pd-skeleton pd-skeleton-line pd-skeleton-line-md" />
              <div className="pd-skeleton pd-skeleton-line pd-skeleton-line-sm" />
            </div>
          </div>
          <div className="pd-skeleton pd-skeleton-related" />
          <div className="pd-skeleton pd-skeleton-reviews" />
        </div>
      </div>
    );
  }

  // ---------- Error state ----------
  if (error || !product) {
    return (
      <div className="pd-root">
        <div className="pd-inner">
          <div className="pd-error">
            <span className="pd-error-icon">
              <Icon name="package" size={30} />
            </span>
            <h2>Product unavailable</h2>
            <p>{error || 'This product could not be found.'}</p>
            <Link to="/buyer/products" className="pd-back-btn">
              <Icon name="chevronLeft" size={16} />
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stock = getStock(product.quantity);
  const outOfStock = product.quantity <= 0;
  const displayQty = outOfStock ? 0 : quantity;
  const total = outOfStock ? 0 : (product.price || 0) * quantity;

  // Rating summary data (provided by ProductResponse)
  const reviewCount = product.reviewCount || 0;
  const averageRating = product.averageRating;
  const distribution = [
    { level: 5, count: product.fiveStarCount || 0 },
    { level: 4, count: product.fourStarCount || 0 },
    { level: 3, count: product.threeStarCount || 0 },
    { level: 2, count: product.twoStarCount || 0 },
    { level: 1, count: product.oneStarCount || 0 },
  ];
  const maxBarCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="pd-root">
      <div className="pd-inner">
        <Link to="/buyer/products" className="pd-back">
          <Icon name="chevronLeft" size={16} />
          Back to Products
        </Link>

        {/* ================================
            HERO — gallery + product info
            ================================ */}
        <div className="pd-main">
          <div className="pd-gallery">
            <ProductImage product={product} className="pd-image" alt={product.name} eager />
            <WishlistButton product={product} size={20} />
            <span className={`pd-stock pd-stock-${stock.tone}`}>{stock.label}</span>
          </div>

          <div className="pd-info">
            <span className="pd-category">{product.category}</span>
            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-price-row">
              <span className="pd-price">₹{product.price?.toLocaleString()}</span>
              <span className="pd-availability">
                {product.quantity} available
              </span>
            </div>

            {product.description && (
              <div className="pd-desc">
                <h2>About this product</h2>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ================================
            FARMER CARD + ORDER CARD
            ================================ */}
        <div className="pd-actions-row">
          <section className="pd-farmer">
            <span className="pd-farmer-avatar">
              <Icon name="store" size={22} />
            </span>
            <div className="pd-farmer-body">
              <div className="pd-farmer-name-row">
                <h3>{product.farmerName || 'Unknown Farmer'}</h3>
                {product.farmerVerified && (
                  <span className="pd-verified">
                    <Icon name="badgeCheck" size={14} />
                    Verified
                  </span>
                )}
              </div>
              {product.farmName && (
                <p className="pd-farm-name">{product.farmName}</p>
              )}
              {product.location && (
                <p className="pd-farm-location">
                  <Icon name="mapPin" size={13} />
                  {product.location}
                </p>
              )}
              {!product.farmName && !product.location && (
                <p className="pd-farm-muted">
                  This farmer hasn't added farm details yet.
                </p>
              )}
            </div>
          </section>

          <section className="pd-order">
            {orderError && <div className="alert alert-error">{orderError}</div>}

            <div className="pd-qty-row">
              <span className="pd-qty-label">Quantity</span>
              <div className="pd-stepper">
                <button
                  type="button"
                  className="pd-step-btn"
                  onClick={decreaseQty}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="pd-step-value" aria-live="polite">
                  {displayQty}
                </span>
                <button
                  type="button"
                  className="pd-step-btn"
                  onClick={increaseQty}
                  disabled={outOfStock || quantity >= product.quantity}
                  aria-label="Increase quantity"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>

            <div className="pd-total">
              <span>Total</span>
              <span className="pd-total-amount">₹{total.toLocaleString()}</span>
            </div>

            <button
              type="button"
              className="pd-place-btn"
              onClick={handlePlaceOrder}
              disabled={placing || outOfStock}
            >
              {placing ? (
                'Placing Order…'
              ) : outOfStock ? (
                'Out of Stock'
              ) : (
                <>
                  <Icon name="cart" size={18} />
                  Place Order
                </>
              )}
            </button>

            {outOfStock && (
              <p className="pd-out-hint">
                This product is currently unavailable.
              </p>
            )}
          </section>
        </div>

        {/* ================================
            REVIEWS & RATINGS
            ================================ */}
        <section className="pd-reviews">
          <div className="pd-reviews-head">
            <h2>
              <Icon name="star" size={18} />
              Reviews &amp; Ratings
            </h2>
            {reviewCount > 0 && (
              <span className="pd-reviews-count">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          {reviewsLoading ? (
            <div className="pd-reviews-skeleton" aria-hidden="true">
              <div className="pd-skeleton pd-rev-skel-summary" />
              <div className="pd-skeleton pd-rev-skel-card" />
              <div className="pd-skeleton pd-rev-skel-card" />
            </div>
          ) : (
            <>
              {/* Rating summary */}
              {reviewCount > 0 ? (
                <div className="pd-rating-summary">
                  <div className="pd-rating-big">
                    <span className="pd-rating-num">
                      {averageRating != null
                        ? averageRating.toFixed(1)
                        : '—'}
                    </span>
                    <div className="pd-rating-stars">
                      {renderStars(averageRating || 0, 20)}
                    </div>
                    <span className="pd-rating-count">
                      based on {reviewCount}{' '}
                      {reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  <div className="pd-rating-bars">
                    {distribution.map((row) => (
                      <div className="pd-bar-row" key={row.level}>
                        <span className="pd-bar-level">{row.level}</span>
                        <Icon name="star" size={12} />
                        <div className="pd-bar-track">
                          <div
                            className="pd-bar-fill"
                            style={{
                              width: `${(row.count / maxBarCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="pd-bar-count">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="pd-rating-none">No ratings yet.</p>
              )}

              {/* Buyer's own review — existing review or write form.
                  Shown only to eligible buyers (who purchased the
                  product); everyone else gets a short notice instead. */}
              {canReview ? (
              <div className="pd-my-review">
                <h3>
                  {myReview && !editingReview
                    ? 'Your Review'
                    : 'Write a Review'}
                </h3>

                {myReview && !editingReview ? (
                  <div className="pd-my-review-card">
                    <div className="pd-my-review-stars">
                      {renderStars(myReview.rating, 18)}
                    </div>
                    {myReview.comment ? (
                      <p className="pd-my-review-comment">
                        {myReview.comment}
                      </p>
                    ) : (
                      <p className="pd-my-review-muted">
                        No comment provided.
                      </p>
                    )}
                    <div className="pd-my-review-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleEditReview}
                      >
                        <Icon name="edit" size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="pd-del-btn"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Icon name="trash" size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="pd-review-form"
                    onSubmit={handleSubmitReview}
                    noValidate
                  >
                    <div className="pd-rating-picker" aria-label="Star rating">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`pd-star-btn ${
                            value <= (hoverRating || rating)
                              ? 'pd-star-btn-active'
                              : ''
                          }`}
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(0)}
                          onFocus={() => setHoverRating(value)}
                          onBlur={() => setHoverRating(0)}
                          onClick={() => setRating(value)}
                          aria-label={`Rate ${value} star${
                            value > 1 ? 's' : ''
                          }`}
                          aria-pressed={value === rating}
                        >
                          <Icon name="star" size={28} />
                        </button>
                      ))}
                    </div>

                    <div className="pd-review-field">
                      <label htmlFor="review-comment">
                        Comment (optional)
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        maxLength={1000}
                        placeholder="Share your experience with this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <span className="pd-review-counter">
                        {comment.length}/1000
                      </span>
                    </div>

                    {reviewFormError && (
                      <div className="alert alert-error pd-review-error">
                        {reviewFormError}
                      </div>
                    )}

                    <div className="form-actions pd-review-actions">
                      {editingReview && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleCancelEdit}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                      >
                        {submitting
                          ? myReview
                            ? 'Updating…'
                            : 'Submitting…'
                          : myReview
                          ? 'Update Review'
                          : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              ) : (
                <div className="pd-not-eligible">
                  <span className="pd-not-eligible-icon">
                    <Icon name="lock" size={18} />
                  </span>
                  <p>You can only review products you have purchased.</p>
                </div>
              )}

              {/* All reviews */}
              {reviewsError ? (
                <div className="alert alert-error pd-reviews-error">
                  <span>{reviewsError}</span>
                  <button
                    type="button"
                    className="pd-retry-btn"
                    onClick={loadReviews}
                  >
                    Retry
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="pd-reviews-empty">
                  <span className="pd-reviews-empty-icon">
                    <Icon name="star" size={24} />
                  </span>
                  <p>No reviews yet.</p>
                  <p className="pd-reviews-empty-sub">
                    Be the first to review this product.
                  </p>
                </div>
              ) : (
                <ul className="pd-reviews-list">
                  {reviews.map((review) => (
                    <li key={review.id} className="pd-review-card">
                      <div className="pd-review-top">
                        <span className="pd-review-avatar">
                          {review.buyerName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <div className="pd-review-meta">
                          <span className="pd-review-name">
                            {review.buyerName}
                          </span>
                          <span className="pd-review-date">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="pd-review-stars">
                          {renderStars(review.rating, 15)}
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="pd-review-comment">{review.comment}</p>
                      ) : (
                        <p className="pd-review-muted">No comment.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* ================================
            RELATED PRODUCTS
            ================================ */}
        {related.length > 0 && (
          <section className="pd-related">
            <div className="pd-related-head">
              <h2>Related Products</h2>
              <Link to={`/buyer/products?category=${encodeURIComponent(product.category)}`} className="pd-related-more">
                View all
              </Link>
            </div>
            <div className="pd-related-grid">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/buyer/products/${item.id}`}
                  className="pd-rel-card"
                >
                  <div className="pd-rel-media">
                    <ProductImage product={item} className="pd-rel-image" />
                  </div>
                  <div className="pd-rel-body">
                    <h4 title={item.name}>{item.name}</h4>
                    <p>
                      <Icon name="profile" size={12} />
                      {item.farmerName}
                    </p>
                    <span className="pd-rel-price">
                      ₹{item.price?.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ==========================================
          DELETE REVIEW CONFIRMATION (design system)
          ========================================== */}
      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete your review? This action cannot be undone."
        confirmLabel="Delete Review"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

export default ProductDetailsPage;
