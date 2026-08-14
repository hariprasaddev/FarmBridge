/* ============================================================
   PRODUCT IMAGE HELPER
   ------------------------------------------------------------
   Resolves the image shown for a product card / thumbnail:
   - The backend-provided `imageUrl` when the product has one
     (relative /uploads/... paths are prefixed with the API origin
     so they resolve against the BACKEND, not the frontend host).
   - A category-based default illustration when `imageUrl` is
     null / missing (products created without an image).
   ============================================================ */

const CATEGORY_DEFAULT_IMAGES = {
  Vegetables: '/images/products/vegetables.svg',
  Fruits: '/images/products/fruits.svg',
  Grains: '/images/products/grains.svg',
  Dairy: '/images/products/dairy.svg',
  Poultry: '/images/products/poultry.svg',
  Spices: '/images/products/spices.svg',
  Pulses: '/images/products/pulses.svg',
  Oilseeds: '/images/products/oilseeds.svg',
  Other: '/images/products/other.svg',
};

export const DEFAULT_PRODUCT_IMAGE = '/images/products/other.svg';

// API origin, mirroring the baseURL in services/api.js. Empty in dev when
// VITE_API_BASE_URL is unset — the Vite dev server then proxies /uploads
// to the backend itself, so relative paths keep working unchanged.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * True for URL schemes that must be rendered exactly as returned
 * (they already point at a full, self-contained location).
 */
function isAbsoluteImageUrl(imageUrl) {
  return /^(https?:|blob:|data:)/i.test(imageUrl);
}

/**
 * Resolves a stored product image value to a renderable src:
 * - absolute URLs (http/https/blob/data) → returned unchanged
 * - root-relative /uploads/... backend paths → prefixed with the API
 *   base URL so the browser requests them from the BACKEND origin
 * - any other path (e.g. frontend assets under /images/...) → unchanged
 */
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (isAbsoluteImageUrl(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/uploads/')) {
    return API_BASE_URL ? `${API_BASE_URL}${imageUrl}` : imageUrl;
  }
  return imageUrl;
}

/**
 * Returns the URL to render for a product.
 * @param {{ imageUrl?: string|null, category?: string|null }} product
 * @returns {string} an absolute or root-relative image URL
 */
export function getProductImage(product) {
  if (product?.imageUrl) {
    return resolveImageUrl(product.imageUrl);
  }
  return CATEGORY_DEFAULT_IMAGES[product?.category] || DEFAULT_PRODUCT_IMAGE;
}

/** Returns the default illustration for a single category name. */
export function getCategoryDefaultImage(category) {
  return CATEGORY_DEFAULT_IMAGES[category] || DEFAULT_PRODUCT_IMAGE;
}
