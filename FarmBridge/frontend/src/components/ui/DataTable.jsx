import { useEffect, useState } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaInbox } from 'react-icons/fa';
import Skeleton from './Skeleton';
import './DataTable.css';

/**
 * Generic data table driven by a column config.
 *
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', label: 'Product', sortable: true },
 *     { key: 'price', label: 'Price', render: (row) => `₹${row.price}` },
 *     { key: 'actions', label: '', render: (row) => <Button … /> },
 *   ]}
 *   data={products}
 *   rowKey={(p) => p.id}
 *   loading={loading}
 *   onSort={(key, dir) => …}
 *   emptyText="No products found"
 * />
 */
function DataTable({
  columns = [],
  data = [],
  rowKey = (_, i) => i,
  loading = false,
  skeletonRows = 5,
  onSort = null,
  defaultSort = null,
  emptyText = 'No data found',
  emptyIcon = <FaInbox size={22} />,
  className = '',
}) {
  const [sort, setSort] = useState(defaultSort || { key: null, dir: 'asc' });

  // Keep internal sort in sync when the parent changes the default.
  useEffect(() => {
    if (defaultSort) setSort(defaultSort);
  }, [defaultSort]);

  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const next = {
      key: col.key,
      dir: sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc',
    };
    setSort(next);
    onSort(next.key, next.dir);
  };

  return (
    <div className={`fb-datatable-wrap${className ? ` ${className}` : ''}`}>
      <table className="fb-datatable">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className={`fb-datatable-sortable${sort.key === col.key ? ' fb-datatable-sorted' : ''}`}
                    onClick={() => handleSort(col)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    {sort.key === col.key ? (
                      sort.dir === 'asc' ? <FaSortUp size={11} /> : <FaSortDown size={11} />
                    ) : (
                      <FaSort size={11} />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="fb-datatable-skeleton-row">
              <td colSpan={columns.length}>
                <Skeleton variant="table" count={skeletonRows} columns={columns.length} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className="fb-datatable-empty" colSpan={columns.length}>
                <div className="fb-empty" style={{ padding: '2.5rem 1rem' }}>
                  <div className="fb-empty-icon" aria-hidden="true">{emptyIcon}</div>
                  <div className="fb-empty-title">{emptyText}</div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={rowKey(row, i)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
