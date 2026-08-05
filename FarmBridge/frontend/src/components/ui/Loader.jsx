import './Loader.css';

/**
 * Spinner loader. `block` renders a full-width centered block (page/panel
 * loading); `inline` fits inside buttons/inline contexts.
 */
function Loader({ size = 'md', label = '', block = false, inline = false, light = false, className = '' }) {
  const classes = [
    'fb-loader',
    size === 'sm' ? 'fb-loader-sm' : size === 'lg' ? 'fb-loader-lg' : 'fb-loader-md',
    block ? 'fb-loader-block' : inline ? 'fb-loader-inline' : 'fb-loader-block',
    light ? 'fb-loader-light' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <span className="fb-loader-spinner" aria-hidden="true" />
      {label && <span className="fb-loader-label">{label}</span>}
    </div>
  );
}

export default Loader;
