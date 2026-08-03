import { getProductImage, getCategoryDefaultImage } from '../utils/productImages';

/**
 * Reusable product image renderer.
 * - Shows the backend-provided `imageUrl` when present.
 * - Shows a category-based default illustration otherwise.
 * - Falls back to the category default if the stored image fails
 *   to load (e.g. file missing on disk) — with a loop guard.
 */
function ProductImage({ product, className = '', alt }) {
  return (
    <img
      className={className}
      src={getProductImage(product)}
      alt={alt || product?.name || ''}
      loading="lazy"
      onError={(e) => {
        if (e.currentTarget.dataset.fallback === 'true') return;
        e.currentTarget.dataset.fallback = 'true';
        e.currentTarget.src = getCategoryDefaultImage(product?.category);
      }}
    />
  );
}

export default ProductImage;
