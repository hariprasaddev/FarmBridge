import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import './BuyerWishlistPage.css';

/**
 * Buyer Wishlist page (/buyer/wishlist).
 *
 * Renders straight from the shared WishlistContext — the wishlist was
 * already loaded once via GET /api/buyer/wishlist (newest first), so
 * this page makes no extra requests and stays in sync with the heart
 * buttons and the navbar badge automatically.
 */
function BuyerWishlistPage() {
  const { items, loading, count, toggleWishlist } = useWishlist();

  // Compact star row + numeric average for the rating summary.
  const renderRating = (product) => {
    const avg = product.averageRating;
    const reviewCount = product.reviewCount || 0;
    return (
      <div className="bw-rating">
        <span className="bw-rating-stars" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={`bw-star ${
                index < Math.round(avg || 0) ? 'bw-star-filled' : ''
              }`}
            >
              <Icon name="star" size={12} />
            </span>
          ))}
        </span>
        <span className="bw-rating-num">
          {avg != null ? avg.toFixed(1) : '—'}
        </span>
        <span className="bw-rating-count">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    );
  };

  const renderSkeletons = () =>
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bw-skeleton-card" aria-hidden="true">
        <div className="bw-skeleton bw-skeleton-media" />
        <div className="bw-skeleton-body">
          <div className="bw-skeleton bw-skeleton-line bw-skeleton-line--lg" />
          <div className="bw-skeleton bw-skeleton-line bw-skeleton-line--sm" />
          <div className="bw-skeleton bw-skeleton-line bw-skeleton-line--sm" />
          <div className="bw-skeleton bw-skeleton-line bw-skeleton-line--sm" />
        </div>
        <div className="bw-skeleton bw-skeleton-actions" />
      </div>
    ));

  return (
    <div className="bw-root">
      <div className="bw-inner">
        <header className="bw-head">
          <div className="bw-title">
            <h1>My Wishlist</h1>
            <p className="bw-sub">Products you have saved for later</p>
          </div>
          {!loading && count > 0 && (
            <span className="bw-count">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          )}
        </header>

        {loading ? (
          <div className="bw-list">{renderSkeletons()}</div>
        ) : items.length === 0 ? (
          <div className="bw-empty">
            <span className="bw-empty-icon" aria-hidden="true">
              ❤️
            </span>
            <h2>No wishlist items found.</h2>
            <p>Browse products and add your favourites.</p>
            <Link to="/buyer/products" className="bw-empty-btn">
              <Icon name="cart" size={16} />
              Browse Products
            </Link>
          </div>
        ) : (
          <ul className="bw-list">
            {items.map((product) => (
              <li key={product.id} className="bw-card">
                <div className="bw-media">
                  <ProductImage product={product} className="bw-image" />
                </div>

                <div className="bw-body">
                  <span className="bw-category">{product.category}</span>
                  <h3 className="bw-name" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="bw-farmer">
                    <Icon name="store" size={14} />
                    <span>{product.farmerName || 'Unknown Farmer'}</span>
                    {product.farmName && (
                      <span className="bw-farm">· {product.farmName}</span>
                    )}
                  </div>
                  {product.location && (
                    <p className="bw-location">
                      <Icon name="mapPin" size={12} />
                      {product.location}
                    </p>
                  )}
                  {renderRating(product)}
                </div>

                <div className="bw-side">
                  <span className="bw-price">
                    ₹{product.price?.toLocaleString()}
                  </span>
                  <div className="bw-actions">
                    <Link
                      to={`/buyer/products/${product.id}`}
                      className="bw-view-btn"
                    >
                      View Details
                      <Icon name="chevronRight" size={14} />
                    </Link>
                    <button
                      type="button"
                      className="bw-remove-btn"
                      onClick={() => toggleWishlist(product)}
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Icon name="trash" size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default BuyerWishlistPage;
