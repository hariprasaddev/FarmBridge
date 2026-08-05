import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaUserCircle, FaBell, FaSignOutAlt } from 'react-icons/fa';
import Avatar from './Avatar';
import Badge from './Badge';
import './ProfileDropdown.css';

const ROLE_BADGE = {
  FARMER: 'primary',
  BUYER: 'info',
  ADMIN: 'warning',
};

/**
 * Avatar + name + role badge that opens a menu with profile / notifications
 * / settings / logout. The logout button keeps the legacy `.btn-logout`
 * class so existing flows (and QA selectors) keep working.
 */
function ProfileDropdown({ email, role, name = '', logout = () => {} }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  const displayName = name || email?.split('@')[0]?.split('.')[0] || 'User';
  const prettyName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const profilePath =
    role === 'FARMER' ? '/farmer/profile' : role === 'ADMIN' ? '/admin/users' : '/buyer/dashboard';

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fb-pd" ref={rootRef}>
      <button
        type="button"
        className="fb-pd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={prettyName} size="sm" />
        <span className="fb-pd-trigger-name">{prettyName}</span>
        <span className="fb-pd-trigger-chevron" aria-hidden="true">
          <FaChevronDown size={10} />
        </span>
      </button>

      {open && (
        <div className="fb-pd-menu" role="menu">
          <div className="fb-pd-head">
            <Avatar name={prettyName} size="md" ring />
            <div className="fb-pd-head-info">
              <p className="fb-pd-head-name">{prettyName}</p>
              <p className="fb-pd-head-email" title={email}>{email}</p>
              <Badge variant={ROLE_BADGE[role] || 'neutral'} solid className="fb-pd-role">
                {ROLE_LABEL(role)}
              </Badge>
            </div>
          </div>

          <div className="fb-pd-items">
            <button type="button" className="fb-pd-item" role="menuitem" onClick={() => go(profilePath)}>
              <FaUserCircle size={15} /> My Profile
            </button>
            <button type="button" className="fb-pd-item" role="menuitem" onClick={() => go('/notifications')}>
              <FaBell size={15} /> Notifications
            </button>
          </div>

          <div className="fb-pd-divider" />

          <button
            type="button"
            className="fb-pd-item fb-pd-logout btn-logout"
            role="menuitem"
            onClick={logout}
          >
            <FaSignOutAlt size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

function ROLE_LABEL(role) {
  if (role === 'FARMER') return 'Farmer';
  if (role === 'BUYER') return 'Buyer';
  if (role === 'ADMIN') return 'Admin';
  return role || 'User';
}

export default ProfileDropdown;
