import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import './Breadcrumb.css';

/**
 * Breadcrumb trail.
 * @example <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Products' }]} />
 */
function Breadcrumb({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <nav className={`fb-breadcrumb${className ? ` ${className}` : ''}`} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            <span className="fb-breadcrumb-item">
              {item.to && !isLast ? (
                <Link to={item.to} className="fb-breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'fb-breadcrumb-current' : ''}>{item.label}</span>
              )}
            </span>
            {!isLast && (
              <span className="fb-breadcrumb-sep" aria-hidden="true">
                <FaChevronRight size={10} />
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
