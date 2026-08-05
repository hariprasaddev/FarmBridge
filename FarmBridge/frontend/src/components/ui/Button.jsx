import './Button.css';

const VARIANTS = {
  primary: 'fb-btn-primary',
  secondary: 'fb-btn-secondary',
  outline: 'fb-btn-outline',
  ghost: 'fb-btn-ghost',
  danger: 'fb-btn-danger',
  success: 'fb-btn-success',
  link: 'fb-btn-link',
};

const SIZES = {
  sm: 'fb-btn-sm',
  md: 'fb-btn-md',
  lg: 'fb-btn-lg',
};

/**
 * Design-system button. Drop-in for the legacy `.btn` classes (the old
 * styles keep working for pages that are not migrated yet).
 *
 * @example <Button variant="primary" icon={<FaPlus />} loading>Create</Button>
 */
function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  loading = false,
  block = false,
  children,
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}) {
  const classes = [
    'fb-btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    block ? 'fb-btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="fb-btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="fb-btn-icon" aria-hidden="true">{icon}</span>
      )}
      {children}
    </button>
  );
}

export default Button;
