import Breadcrumb from './Breadcrumb';
import './PageHeader.css';

/**
 * Standard page header: breadcrumb + title + subtitle + primary actions.
 * Used by the shell and intended as the canonical header for every page.
 *
 * @example
 * <PageHeader
 *   items={[{ label: 'Home', to: '/admin/dashboard' }, { label: 'Users' }]}
 *   title="Manage Users"
 *   subtitle="View and manage all registered users"
 *   actions={<Button icon={<FaPlus />}>Add user</Button>}
 * />
 */
function PageHeader({ title, subtitle = '', items = [], actions = null, className = '' }) {
  return (
    <header className={`fb-page-header${className ? ` ${className}` : ''}`}>
      <div className="fb-page-header-left">
        {items.length > 0 && <Breadcrumb items={items} />}
        <h1 className="fb-page-header-title">{title}</h1>
        {subtitle && <p className="fb-page-header-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="fb-page-header-actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
