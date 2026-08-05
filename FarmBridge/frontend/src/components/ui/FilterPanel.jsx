import { useState } from 'react';
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from './Button';
import './FilterPanel.css';

/**
 * Collapsible filter panel. Render filter fields/controls as children and
 * provide `onApply` / `onClear`. `activeCount` shows a count in the header.
 *
 * @example
 * <FilterPanel onApply={apply} onClear={clear} activeCount={2}>
 *   <FilterPanel.Field label="Status">
 *     <select …>…</select>
 *   </FilterPanel.Field>
 * </FilterPanel>
 */
function FilterPanel({
  title = 'Filters',
  children,
  onApply = () => {},
  onClear = () => {},
  activeCount = 0,
  defaultOpen = true,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`fb-filterpanel${open ? ' fb-filterpanel-open' : ''}${className ? ` ${className}` : ''}`}>
      <div className="fb-filterpanel-head">
        <span className="fb-filterpanel-title">
          <FaFilter size={13} aria-hidden="true" />
          {title}
          {activeCount > 0 && (
            <span className="fb-badge fb-badge-primary fb-badge-solid">{activeCount}</span>
          )}
        </span>
        <button
          type="button"
          className="fb-filterpanel-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide filters' : 'Show filters'}
        >
          {open ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <>
          <div className="fb-filterpanel-body">{children}</div>
          <div className="fb-filterpanel-foot">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="fb-filterpanel-field">
      {label && <span className="fb-filterpanel-label">{label}</span>}
      {children}
    </div>
  );
}

FilterPanel.Field = Field;

export default FilterPanel;
