import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import Icon from './Icon';
import { getNotificationIcon } from '../utils/notifications';
import { formatRelativeTime } from '../utils/relativeTime';
import './NotificationBell.css';

// Cap the dropdown list — the "View all" footer opens the full page.
const DROPDOWN_LIMIT = 10;

function NotificationBell() {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = () => setOpen(false);

  // Close when clicking outside the bell + dropdown.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const items = notifications.slice(0, DROPDOWN_LIMIT);

  return (
    <div className="nbell" ref={rootRef}>
      <button
        type="button"
        className="nbell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="nbell-badge" aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="nbell-dropdown" role="menu">
          <div className="nbell-head">
            <span className="nbell-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="nbell-markall"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="nbell-list">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="nbell-skeleton" aria-hidden="true" />
              ))
            ) : items.length === 0 ? (
              <div className="nbell-empty">
                <span className="nbell-empty-icon" aria-hidden="true">
                  🔔
                </span>
                <p className="nbell-empty-title">No notifications yet</p>
                <p className="nbell-empty-sub">
                  We&apos;ll notify you when something happens.
                </p>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`nbell-item${
                    notification.isRead ? '' : ' nbell-item-unread'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                  role="menuitem"
                  aria-label={`${notification.title} — ${notification.message}${
                    notification.isRead ? '' : ' (unread)'
                  }`}
                >
                  <span
                    className={`nbell-item-icon nbell-icon-${notification.type.toLowerCase()}`}
                  >
                    <Icon name={getNotificationIcon(notification.type)} size={16} />
                  </span>
                  <span className="nbell-item-body">
                    <span className="nbell-item-title">
                      {notification.title}
                    </span>
                    <span className="nbell-item-msg">
                      {notification.message}
                    </span>
                  </span>
                  <span className="nbell-item-meta">
                    {!notification.isRead && (
                      <span className="nbell-dot" aria-label="Unread" />
                    )}
                    <span className="nbell-time">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="nbell-foot">
            <Link to="/notifications" className="nbell-viewall" onClick={close}>
              View all notifications
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
