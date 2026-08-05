import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Pagination.css';

function pageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, 2, total - 1, total]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

/**
 * Page-number pagination with prev/next and ellipsis.
 * @example <Pagination page={2} totalPages={10} onPageChange={setPage} totalItems={95} pageSize={10} />
 */
function Pagination({ page, totalPages, onPageChange = () => {}, totalItems = null, pageSize = null, className = '' }) {
  if (!totalPages || totalPages <= 1) {
    return totalItems !== null ? (
      <div className={`fb-pagination${className ? ` ${className}` : ''}`}>
        <span className="fb-pagination-info">{totalItems} item{totalItems === 1 ? '' : 's'}</span>
      </div>
    ) : null;
  }

  const range = pageRange(page, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className={`fb-pagination${className ? ` ${className}` : ''}`} role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="fb-pagination-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <FaChevronLeft size={12} />
      </button>

      {range.map((p, i) => {
        const prev = range[i - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            {showEllipsis && <span className="fb-pagination-ellipsis">…</span>}
            <button
              type="button"
              className={`fb-pagination-btn${p === page ? ' fb-pagination-active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        className="fb-pagination-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <FaChevronRight size={12} />
      </button>

      {totalItems !== null && pageSize !== null && (
        <span className="fb-pagination-info">
          {from}–{to} of {totalItems}
        </span>
      )}
    </div>
  );
}

export default Pagination;
