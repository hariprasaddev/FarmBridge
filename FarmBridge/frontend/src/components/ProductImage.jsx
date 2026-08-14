import { getProductImage, getCategoryDefaultImage } from '../utils/productImages';

/**
 * Reusable product image renderer.
 * - Shows the backend-provided `imageUrl` when present.
 * - Shows a category-based default illustration otherwise.
 * - Falls back to the category default if the stored image fails
 *   to load (e.g. file missing on disk) — with a loop guard.
 */
function ProductImage({ product, className = '', alt, eager = false }) {
  return (
    <img
      className={className}
      src={getProductImage(product)}
      alt={alt || product?.name || ''}
      loading={eager ? 'eager' : 'lazy'}
      onError={(e) => {
        if (e.currentTarget.dataset.fallback === 'true') return;
        e.currentTarget.dataset.fallback = 'true';
        // Development-only diagnostic: a load failure usually means the
        // imageUrl points at a host that cannot serve the file. Never
        // surfaced to production users — the fallback image is shown.
        if (import.meta.env.DEV) {
          console.warn(
            '[ProductImage] failed to load image, falling back to category default:',
            { src: e.currentTarget.src, category: product?.category }
          );
        }
        e.currentTarget.src = getCategoryDefaultImage(product?.category);
      }}
    />
  );
}

export default ProductImage;
