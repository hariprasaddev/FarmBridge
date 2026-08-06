import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import AdminPagination from '../components/AdminPagination';
import { Modal, ConfirmDialog, Badge } from '../components/ui';
import './AdminPages.css';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Users' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const ROLE_FILTERS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'BUYER', label: 'Buyers' },
  { value: 'FARMER', label: 'Farmers' },
  { value: 'ADMIN', label: 'Admins' },
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'BUYER' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // `silent` skips the skeleton so post-action refreshes stay smooth.
  const loadUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load the users. Please try again.'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Client-side search + status/role filters over the fetched users.
  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' ? u.active : !u.active);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query);
    return matchesStatus && matchesRole && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive =
    search.trim() !== '' || statusFilter !== 'ALL' || roleFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRoleFilter('ALL');
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

  // ==========================================
  // SOFT DELETE — deactivate / reactivate
  // The user record is NEVER removed. active=false
  // blocks login + every secured endpoint while all
  // historical data (orders, reviews, analytics) is kept.
  // ==========================================

  const handleDeactivate = async (id) => {
    setConfirmDeactivateUser(null);
    setUpdating(id);
    setError('');
    setSuccess('');

    try {
      await adminAPI.deleteUser(id);
      setSuccess('User deactivated successfully');
      await loadUsers(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to deactivate the user. Please try again.'));
    } finally {
      setUpdating(null);
    }
  };

  const handleReactivate = async (id) => {
    setUpdating(id);
    setError('');
    setSuccess('');

    try {
      await adminAPI.reactivateUser(id);
      setSuccess('User activated successfully');
      await loadUsers(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reactivate the user. Please try again.'));
    } finally {
      setUpdating(null);
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
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`adm-pill${statusFilter === status.value ? ' active' : ''}`}
              onClick={() => {
                setStatusFilter(status.value);
                setPage(1);
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="adm-pills">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role.value}
              type="button"
              className={`adm-pill${roleFilter === role.value ? ' active' : ''}`}
              onClick={() => {
                setRoleFilter(role.value);
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((user) => (
                  <tr key={user.id} className={user.active ? '' : 'adm-row-inactive'}>
                    <td>
                      <div className="adm-entity-cell">
                        <span className={`adm-avatar${user.active ? '' : ' adm-avatar-inactive'}`}>
                          {getInitials(user.name)}
                        </span>
                        <span className="adm-entity-name">{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge
                        variant={
                          user.role === 'ADMIN' ? 'warning' : user.role === 'FARMER' ? 'primary' : 'info'
                        }
                        className={`adm-badge adm-badge-${user.role.toLowerCase()}`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        variant={user.active ? 'success' : 'danger'}
                        solid
                        className="adm-badge"
                      >
                        {user.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button
                          className="adm-action-btn"
                          onClick={() => openEdit(user)}
                          disabled={updating === user.id}
                        >
                          <Icon name="edit" size={14} />
                          Edit
                        </button>
                        {user.active ? (
                          <button
                            className="adm-action-btn adm-action-btn-danger"
                            onClick={() => setConfirmDeactivateUser(user)}
                            disabled={updating === user.id}
                          >
                            <Icon name="xCircle" size={14} />
                            {updating === user.id ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button
                            className="adm-action-btn adm-action-btn-restore"
                            onClick={() => handleReactivate(user.id)}
                            disabled={updating === user.id}
                          >
                            <Icon name="refreshCw" size={14} />
                            {updating === user.id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        )}
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
          EDIT USER MODAL (design system)
          ========================================== */}
      <Modal
        open={!!editingUser}
        onClose={closeEdit}
        title="Edit User"
        subtitle={editingUser ? `User #${editingUser.id}` : ''}
        icon={<Icon name="profile" size={18} />}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeEdit}>
              Cancel
            </button>
            <button
              type="submit"
              form="adm-edit-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}

        <form id="adm-edit-form" onSubmit={handleUpdate} className="order-form">
          <div className="form-group">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-role">Role</label>
            <select
              id="edit-role"
              className="form-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="FARMER">FARMER</option>
              <option value="BUYER">BUYER</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ==========================================
          DEACTIVATE USER CONFIRMATION (soft delete)
          ========================================== */}
      <ConfirmDialog
        open={!!confirmDeactivateUser}
        onCancel={() => setConfirmDeactivateUser(null)}
        onConfirm={() => handleDeactivate(confirmDeactivateUser.id)}
        title="Deactivate User?"
        message={
          confirmDeactivateUser
            ? `${confirmDeactivateUser.name || 'This user'} (${confirmDeactivateUser.email}) will no longer be able to access FarmBridge. Their historical data will be preserved.`
            : ''
        }
        confirmLabel="Deactivate User"
        variant="danger"
        loading={updating === confirmDeactivateUser?.id}
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;
