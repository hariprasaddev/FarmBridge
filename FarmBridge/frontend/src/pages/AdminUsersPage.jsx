import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const ROLE_FILTERS = ['ALL', 'ADMIN', 'FARMER', 'BUYER'];

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ALL');
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
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers =
    filter === 'ALL' ? users : users.filter((u) => u.role === filter);

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
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.defaultMessage ||
        'Failed to update user';
      setFormError(
        typeof message === 'string' ? message : 'Failed to update user'
      );
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
      const message =
        err.response?.data?.message || 'Failed to delete user';
      setError(
        typeof message === 'string' ? message : 'Failed to delete user'
      );
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>Manage Users</h1>
            <p className="products-subtitle">
              View and manage all registered users
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="filter-chips">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              className={`filter-chip ${filter === role ? 'active' : ''}`}
              onClick={() => setFilter(role)}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>There are no users matching this filter.</p>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="order-id">#{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`role-badge role-${user.role.toLowerCase()}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="order-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm btn-danger-outline"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                        >
                          {deleting === user.id ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  );
}

export default AdminUsersPage;
