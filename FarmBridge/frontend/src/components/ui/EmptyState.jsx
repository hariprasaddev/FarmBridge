import './EmptyState.css';

/**
 * Friendly empty / no-data state with optional action.
 * @example <EmptyState icon={<FaBoxOpen />} title="No products yet" description="…" action={<Button>Add product</Button>} />
 */
function EmptyState({ icon = null, title, description = '', action = null, className = '' }) {
  return (
    <div className={`fb-empty${className ? ` ${className}` : ''}`}>
      {icon && <div className="fb-empty-icon" aria-hidden="true">{icon}</div>}
      {title && <div className="fb-empty-title">{title}</div>}
      {description && <div className="fb-empty-description">{description}</div>}
      {action && <div className="fb-empty-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
