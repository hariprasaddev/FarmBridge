import './Badge.css';

const VARIANTS = {
  success: 'fb-badge-success',
  warning: 'fb-badge-warning',
  danger: 'fb-badge-danger',
  info: 'fb-badge-info',
  neutral: 'fb-badge-neutral',
  primary: 'fb-badge-primary',
};

/**
 * Status / label pill. Variants: success, warning, danger, info, neutral,
 * primary. Pass `solid` for a filled high-emphasis badge.
 */
function Badge({ variant = 'neutral', solid = false, icon = null, children, className = '', ...rest }) {
  const classes = [
    'fb-badge',
    VARIANTS[variant] || VARIANTS.neutral,
    solid ? 'fb-badge-solid' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {icon && <span className="fb-badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
