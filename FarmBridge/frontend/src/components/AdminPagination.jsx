import Icon from './Icon';

/**
 * Shared pagination controls for admin tables.
 * Pure presentation — page/total come from the parent, which owns the state.
 */
function AdminPagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const changePage = (next) => {
    onChange(Math.min(totalPages, Math.max(1, next)));
  };

  // Page numbers with ellipsis for long lists.
  const pages = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, page + 2);
  if (from > 1) pages.push(1);
  if (from > 2) pages.push('…');
  for (let i = from; i <= to; i++) pages.push(i);
  if (to < totalPages - 1) pages.push('…');
  if (to < totalPages) pages.push(totalPages);

  return (
    <div className="adm-pagination">
      <span className="adm-page-info">
        Showing {start}–{end} of {total}
      </span>
      <div className="adm-page-controls">
        <button
          type="button"
          className="adm-page-btn"
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={15} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="adm-page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`adm-page-btn${p === page ? ' active' : ''}`}
              onClick={() => changePage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="adm-page-btn"
          onClick={() => changePage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
