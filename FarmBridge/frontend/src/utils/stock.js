/* ============================================================
   STOCK STATUS HELPER
   ------------------------------------------------------------
   Derives the human-readable availability label + tone from the
   existing product.quantity value. Shared by the buyer products
   list and the product details page.
   ============================================================ */

export const getStock = (qty) => {
  if (qty <= 0) return { label: 'Out of Stock', tone: 'out' };
  if (qty <= 20) return { label: 'Low Stock', tone: 'low' };
  return { label: 'In Stock', tone: 'in' };
};
