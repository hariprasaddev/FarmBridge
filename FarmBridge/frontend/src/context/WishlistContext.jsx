import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buyerWishlistAPI, getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';

/**
 * Shared wishlist state for the logged-in buyer.
 *
 * Single source of truth used by:
 *  - the heart button on every product card
 *  - the heart button on the product details page
 *  - the navbar badge
 *  - the /buyer/wishlist page
 *
 * The wishlist is loaded exactly once per login (GET /api/buyer/wishlist)
 * and kept in sync locally through optimistic toggles, so no page needs
 * to re-fetch it and all of them stay consistent with each other.
 */
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { email, role, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  // Refs mirror the async state so handlers can read the latest value
  // synchronously (functional updates alone would be racy here).
  const itemsRef = useRef(items);
  const pendingRef = useRef(new Set());
  const fetchedForRef = useRef(null);

  // Load (or clear) the wishlist whenever the auth session changes.
  useEffect(() => {
    if (authLoading) return;

    // Non-buyers have no wishlist to track.
    if (role !== 'BUYER' || !email) {
      fetchedForRef.current = null;
      setItems([]);
      setLoading(false);
      return;
    }

    // Already loaded for this exact session — avoid duplicate requests
    // (StrictMode double-effects, re-renders, etc.).
    if (fetchedForRef.current === email) return;
    fetchedForRef.current = email;

    let cancelled = false;
    setLoading(true);
    buyerWishlistAPI
      .getWishlist()
      .then((response) => {
        if (cancelled) return;
        setItems(response.data || []);
      })
      .catch(() => {
        // Failed to load — degrade gracefully to an empty wishlist.
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, role, email]);

  // Keep the mirror ref in sync with the latest items.
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /**
   * Adds or removes a product with an optimistic UI update.
   * Returns true when the operation succeeded.
   */
  const toggleWishlist = useCallback(
    async (product) => {
      if (!product || product.id == null) return false;
      const id = product.id;

      // Guard against double-clicks / in-flight toggles.
      if (pendingRef.current.has(id)) return false;
      pendingRef.current.add(id);
      setPendingIds(new Set(pendingRef.current));

      const wasWishlisted = itemsRef.current.some(
        (item) => item.id === id
      );

      // Optimistic update — the UI reflects the new state immediately.
      setItems((prev) =>
        wasWishlisted
          ? prev.filter((item) => item.id !== id)
          : [product, ...prev]
      );

      try {
        if (wasWishlisted) {
          await buyerWishlistAPI.remove(id);
          showToast('Removed from Wishlist');
        } else {
          await buyerWishlistAPI.add(id);
          showToast('Added to Wishlist');
        }
        return true;
      } catch (err) {
        // Roll back the optimistic change.
        setItems((prev) =>
          wasWishlisted
            ? [product, ...prev]
            : prev.filter((item) => item.id !== id)
        );
        showToast(
          getErrorMessage(err, 'Unable to update Wishlist'),
          'error'
        );
        return false;
      } finally {
        pendingRef.current.delete(id);
        setPendingIds(new Set(pendingRef.current));
      }
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (id) => items.some((item) => item.id === id),
    [items]
  );

  const isPending = useCallback(
    (id) => pendingIds.has(id),
    [pendingIds]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      count: items.length,
      isWishlisted,
      isPending,
      toggleWishlist,
    }),
    [items, loading, isWishlisted, isPending, toggleWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
