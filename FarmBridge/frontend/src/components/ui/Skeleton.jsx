import './Skeleton.css';

/**
 * Loading placeholder. Variants:
 * - text:   a single line of text height
 * - rect:   fixed rectangle
 * - circle: round
 * - card:   mini card layout (for grid skeletons)
 * - table:  row of text lines sized to `columns`
 */
function Skeleton({
  variant = 'text',
  width = '100%',
  height = null,
  count = 1,
  columns = 4,
  className = '',
  ...rest
}) {
  const variantClass = {
    text: 'fb-skeleton-text',
    rect: 'fb-skeleton-rect',
    circle: 'fb-skeleton-circle',
    card: 'fb-skeleton-card',
    table: '',
  }[variant] || 'fb-skeleton-text';

  const baseStyle = { width };
  if (height) baseStyle.height = height;

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => {
        if (variant === 'card') {
          return (
            <div key={i} className={`fb-skeleton fb-skeleton-card ${className}`} style={width ? { width } : undefined} aria-hidden="true">
              <div className="fb-skeleton fb-skeleton-text" style={{ width: '40%' }} />
              <div className="fb-skeleton fb-skeleton-text" />
              <div className="fb-skeleton fb-skeleton-text" style={{ width: '70%' }} />
            </div>
          );
        }
        if (variant === 'table') {
          return (
            <div
              key={i}
              className={`fb-skeleton-table-row ${className}`}
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              aria-hidden="true"
            >
              {Array.from({ length: columns }).map((_, c) => (
                <div key={c} className="fb-skeleton fb-skeleton-text" />
              ))}
            </div>
          );
        }
        return (
          <div
            key={i}
            className={`fb-skeleton ${variantClass} ${className}`}
            style={baseStyle}
            aria-hidden="true"
            {...rest}
          />
        );
      })}
    </>
  );
}

export default Skeleton;
