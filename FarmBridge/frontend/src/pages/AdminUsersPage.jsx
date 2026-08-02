import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import AdminPagination from '../components/AdminPagination';
import './AdminPages.css';

const ROLE_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'FARMER', label: 'Farmers' },
  { value: 'BUYER', label: 'Buyers' },
];

const PAGE_SIZE = 10;

// Presentation helper — initials derived from the user's name.
const getInitials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'BUYER' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load the users. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Client-side search + role filter over the already-fetched users.
  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesRole = filter === 'ALL' || u.role === filter;
    const matchesSearch =
      !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = search.trim() !== '' || filter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setFilter('ALL');
    setPage(1);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role });
    setFormError('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setFormError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const response = await adminAPI.updateUser(editingUser.id, form);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? response.data : u))
      );
      setSuccess(`User #${editingUser.id} updated successfully`);
      closeEdit();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to update the user. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setDeleting(id);
    setError('');
    setSuccess('');

    try {
      await adminAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccess('User deleted successfully');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete the user. Please try again.'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout title="Manage Users" subtitle="View and manage all registered users">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" size={17} />
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              className="adm-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        <div className="adm-pills">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role.value}
              type="button"
              className={`adm-pill${filter === role.value ? ' active' : ''}`}
              onClick={() => {
                setFilter(role.value);
                setPage(1);
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        {filtersActive && (
          <button type="button" className="adm-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        )}

        <span className="adm-count">{filteredUsers.length} users</span>
      </div>

      {loading ? (
        <div className="adm-skeleton-table" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="adm-skeleton-row">
              <div className="adm-skeleton-cell adm-skeleton-cell--avatar" />
              <div className="adm-skeleton-cell adm-skeleton-cell--lg" />
              <div className="adm-skeleton-cell adm-skeleton-cell--flex" />
              <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              <div className="adm-skeleton-cell adm-skeleton-cell--md" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="adm-table-card">
          <div className="adm-empty">
            <span className="adm-empty-icon">
              <Icon name="users" size={28} />
            </span>
            <h2>No users found</h2>
            <p>There are no users matching this search or filter.</p>
          </div>
        </div>
      ) : (
        <div className="adm-table-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="adm-entity-cell">
                        <span className="adm-avatar">{getInitials(user.name)}</span>
                        <span className="adm-entity-name">{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`adm-badge adm-badge-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button
                          className="adm-action-btn"
                          onClick={() => openEdit(user)}
                        >
                          <Icon name="edit" size={14} />
                          Edit
                        </button>
                        <button
                          className="adm-action-btn adm-action-btn-danger"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                        >
                          <Icon name="trash" size={14} />
                          {deleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={safePage}
            totalPages={totalPages}
            total={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}

      {/* ==========================================
          EDIT USER MODAL
          ========================================== */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button
                className="modal-close"
                onClick={closeEdit}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="alert alert-error">{formError}</div>
              )}

              <form onSubmit={handleUpdate} className="order-form">
                <div className="form-group">
                  <label htmlFor="edit-name">Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-role">Role</label>
                  <select
                    id="edit-role"
                    className="form-select"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FARMER">FARMER</option>
                    <option value="BUYER">BUYER</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUsersPage;
