import Icon from './Icon';

// Decorative category placeholder emoji (presentation only — products
// have no image field, so a category-tinted placeholder is shown).
const CATEGORY_EMOJI = {
  Vegetables: '🥦',
  Fruits: '🍎',
  Grains: '🌾',
  Dairy: '🥛',
  Poultry: '🍗',
  Spices: '🌶️',
  Pulses: '🫘',
  Oilseeds: '🌻',
  Other: '🧺',
};

// Availability derived from the existing product.quantity value.
export function getStock(qty) {
  if (qty <= 0) return { label: 'Out of Stock', tone: 'out' };
  if (qty <= 20) return { label: 'Low Stock', tone: 'low' };
  return { label: 'In Stock', tone: 'in' };
}

/**
 * Reusable marketplace product card.
 * @param {object}  props.product  - { id, name, price, quantity, category, description, ... }
 * @param {boolean} props.deleting - true while this product is being deleted
 * @param {Function} props.onEdit  - existing edit handler (navigates to edit page)
 * @param {Function} props.onDelete - existing delete handler (keeps its confirmation dialog)
 */
function ProductCard({ product, deleting = false, onEdit, onDelete }) {
  const stock = getStock(product.quantity);
  const emoji = CATEGORY_EMOJI[product.category] || CATEGORY_EMOJI.Other;

  return (
    <div className="mp-card">
      <div className="mp-card-media">
        <span className="mp-placeholder" role="img" aria-label={product.category}>
          {emoji}
        </span>
        <span className={`mp-stock mp-stock-${stock.tone}`}>{stock.label}</span>
      </div>

      <div className="mp-card-body">
        <h3 className="mp-card-name" title={product.name}>
          {product.name}
        </h3>
        <div className="mp-card-price">₹{product.price?.toLocaleString()}</div>
        <div className="mp-card-qty">{product.quantity} available</div>
      </div>

      <div className="mp-card-actions">
        <button
          type="button"
          className="mp-edit-btn"
          onClick={() => onEdit(product.id)}
          aria-label={`Edit ${product.name}`}
        >
          <Icon name="edit" size={15} />
          Edit
        </button>
        <button
          type="button"
          className="mp-delete-btn"
          onClick={() => onDelete(product.id)}
          disabled={deleting}
          aria-label={`Delete ${product.name}`}
        >
          <Icon name="trash" size={16} />
          {deleting ? 'Deleting...' : ''}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
