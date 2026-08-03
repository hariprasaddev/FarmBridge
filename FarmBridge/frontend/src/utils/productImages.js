/* ============================================================
   PRODUCT IMAGE HELPER
   ------------------------------------------------------------
   Resolves the image shown for a product card / thumbnail:
   - The backend-provided `imageUrl` when the product has one
     (rendered exactly as returned — never hardcoded).
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

/**
 * Returns the URL to render for a product.
 * @param {{ imageUrl?: string|null, category?: string|null }} product
 * @returns {string} an absolute or root-relative image URL
 */
export function getProductImage(product) {
  if (product?.imageUrl) {
    return product.imageUrl;
  }
  return CATEGORY_DEFAULT_IMAGES[product?.category] || DEFAULT_PRODUCT_IMAGE;
}

/** Returns the default illustration for a single category name. */
export function getCategoryDefaultImage(category) {
  return CATEGORY_DEFAULT_IMAGES[category] || DEFAULT_PRODUCT_IMAGE;
}
