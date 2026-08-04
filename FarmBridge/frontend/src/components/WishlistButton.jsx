import { useWishlist } from '../context/WishlistContext';
import Icon from './Icon';
import './WishlistButton.css';

/**
 * Heart toggle for the buyer wishlist.
 *
 * Renders an outline heart when the product is not wishlisted and a
 * filled heart when it is. Clicking adds/removes via the shared
 * WishlistContext (optimistic update + toast), so the icon, the navbar
 * badge and the wishlist page stay in sync without any page refresh.
 *
 * Safe to place inside clickable containers (cards, gallery) — clicks
 * are stopped from bubbling so navigation is not triggered.
 */
function WishlistButton({ product, className = '', size = 18 }) {
  const { isWishlisted, isPending, toggleWishlist } = useWishlist();

  if (!product || product.id == null) return null;

  const id = product.id;
  const active = isWishlisted(id);
  const pending = isPending(id);

  return (
    <button
      type="button"
      className={`wish-btn${active ? ' wish-btn-active' : ''}${
        className ? ` ${className}` : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      onKeyDown={(e) => {
        // Keep Enter/Space from bubbling up to a parent card's
        // navigation handler while toggling with the keyboard.
        e.stopPropagation();
      }}
      disabled={pending}
      aria-label={
        active
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      aria-pressed={active}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Icon name="heart" size={size} />
    </button>
  );
}

export default WishlistButton;
