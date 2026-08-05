// Recently-viewed products — a real user-activity trail kept locally
// (product view actions are recorded when the buyer opens a product).
const KEY = 'farmbridge.recentlyViewed';
const MAX = 8;

export function recordRecentlyViewed(product) {
  if (!product || !product.id) return;
  try {
    const list = getRecentlyViewed().filter((p) => p.id !== product.id);
    list.unshift({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      farmerName: product.farmerName,
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage unavailable — silently skip
  }
}

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
