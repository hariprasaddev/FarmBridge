import { useNotification } from '../context/NotificationContext';
import Icon from '../components/Icon';
import { getNotificationIcon } from '../utils/notifications';
import { formatRelativeTime } from '../utils/relativeTime';
import './NotificationsPage.css';

function NotificationsPage() {
  const {
    notifications,
    loading,
    busy,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotification();

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="npage-skeleton-card" aria-hidden="true">
        <div className="npage-skeleton npage-skel-icon" />
        <div className="npage-skeleton-body">
          <div className="npage-skeleton npage-skel-line npage-skel-line-lg" />
          <div className="npage-skeleton npage-skel-line npage-skel-line-md" />
          <div className="npage-skeleton npage-skel-line npage-skel-line-sm" />
        </div>
      </div>
    ));

  const allRead = notifications.every((n) => n.isRead);

  return (
    <div className="npage-root">
      <div className="npage-inner">
        <header className="npage-head">
          <div className="npage-title">
            <h1>Notifications</h1>
            <p className="npage-sub">Stay up to date with your orders</p>
          </div>

          <div className="npage-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={markAllAsRead}
              disabled={busy || allRead || notifications.length === 0}
            >
              <Icon name="checkCircle" size={16} />
              Mark All Read
            </button>
            <button
              type="button"
              className="npage-clear-btn"
              onClick={clearAll}
              disabled={busy || notifications.length === 0}
            >
              <Icon name="trash" size={16} />
              Clear All
            </button>
          </div>
        </header>

        {loading ? (
          <div className="npage-list">{renderSkeletons()}</div>
        ) : notifications.length === 0 ? (
          <div className="npage-empty">
            <span className="npage-empty-icon" aria-hidden="true">
              🔔
            </span>
            <h2>No notifications yet</h2>
            <p>We&apos;ll notify you when something happens.</p>
          </div>
        ) : (
          <ul className="npage-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`npage-card${
                  notification.isRead ? '' : ' npage-card-unread'
                }`}
              >
                <button
                  type="button"
                  className="npage-card-main"
                  onClick={() => markAsRead(notification.id)}
                  aria-label={`${notification.title} — ${notification.message}${
                    notification.isRead ? '' : ' (unread)'
                  }`}
                >
                  <span
                    className={`npage-card-icon npage-icon-${notification.type.toLowerCase()}`}
                  >
                    <Icon name={getNotificationIcon(notification.type)} size={18} />
                  </span>
                  <span className="npage-card-body">
                    <span className="npage-card-top">
                      <span className="npage-card-title">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="npage-new-tag">New</span>
                      )}
                    </span>
                    <span className="npage-card-msg">
                      {notification.message}
                    </span>
                    <span className="npage-card-time">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="npage-del-btn"
                  onClick={() => deleteNotification(notification.id)}
                  aria-label={`Delete notification: ${notification.title}`}
                  title="Delete"
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
