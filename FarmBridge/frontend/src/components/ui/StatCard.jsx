import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import AnimatedNumber from '../AnimatedNumber';
import './StatCard.css';

const ACCENTS = {
  primary: 'fb-statcard-accent-primary',
  success: 'fb-statcard-accent-success',
  warning: 'fb-statcard-accent-warning',
  danger: 'fb-statcard-accent-danger',
  info: 'fb-statcard-accent-info',
  neutral: 'fb-statcard-accent-neutral',
};

/**
 * KPI card with icon, label, animated value and optional trend.
 * Pass `animate=false` to render the raw value (e.g. formatted strings).
 *
 * @example <StatCard icon={<FaUsers />} label="Total Users" value={124} accent="primary" trend={+8} />
 */
function StatCard({
  icon = null,
  label,
  value,
  accent = 'primary',
  trend = null,
  trendLabel = '',
  animate = true,
  format = null,
  className = '',
  ...rest
}) {
  const trendDir = trend === null || trend === undefined ? null : trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';

  return (
    <div className={`fb-statcard${className ? ` ${className}` : ''}`} {...rest}>
      {icon && (
        <div className={`fb-statcard-icon ${ACCENTS[accent] || ACCENTS.primary}`} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="fb-statcard-content">
        <div className="fb-statcard-label">{label}</div>
        <div className="fb-statcard-value">
          {animate && typeof value === 'number' ? (
            <AnimatedNumber value={value} format={format} />
          ) : format ? (
            format(value)
          ) : (
            value
          )}
        </div>
        {trendDir && (
          <span className={`fb-statcard-trend fb-statcard-trend-${trendDir}`}>
            {trendDir === 'up' ? <FaArrowUp size={10} /> : trendDir === 'down' ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
            {Math.abs(trend)}%
            {trendLabel && <span style={{ color: 'var(--fb-gray-400)', fontWeight: 500 }}> {trendLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
