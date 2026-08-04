import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { notificationAPI, getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';

/**
 * Shared notification state for the logged-in user.
 *
 * Single source of truth used by:
 *  - the notification bell (badge count + dropdown)
 *  - the /notifications page
 *
 * The list is fetched exactly once per login (GET /api/notifications)
 * and kept in sync locally through optimistic mutations, so no page
 * needs to re-fetch it and every surface stays consistent.
 */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { email, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  // Refs mirror the async state so handlers can read the latest value
  // synchronously (avoids stale-closure bugs during optimistic updates).
  const itemsRef = useRef(notifications);
  const pendingRef = useRef(new Set());
  const busyRef = useRef(false);
  const fetchedForRef = useRef(null);

  // Load (or clear) the list whenever the auth session changes.
  useEffect(() => {
    if (authLoading) return;

    if (!email) {
      fetchedForRef.current = null;
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Already loaded for this session — StrictMode double-effects and
    // re-renders must not trigger duplicate requests.
    if (fetchedForRef.current === email) return;
    fetchedForRef.current = email;

    let cancelled = false;
    setLoading(true);
    notificationAPI
      .getNotifications()
      .then((response) => {
        if (cancelled) return;
        setNotifications(response.data || []);
      })
      .catch(() => {
        // Failed to load — degrade gracefully to an empty list.
        if (cancelled) return;
        setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, email]);

  // Keep the mirror ref in sync with the latest list.
  useEffect(() => {
    itemsRef.current = notifications;
  }, [notifications]);

  /** Re-fetches the list from the server (used sparingly). */
  const refresh = useCallback(async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data || []);
    } catch (err) {
      showToast(
        getErrorMessage(err, 'Unable to update notifications'),
        'error'
      );
    }
  }, [showToast]);

  /** Marks a single notification as read (optimistic). */
  const markAsRead = useCallback(
    async (id) => {
      if (pendingRef.current.has(id)) return;
      const target = itemsRef.current.find((n) => n.id === id);
      if (!target || target.isRead) return;

      pendingRef.current.add(id);
      setPendingIds(new Set(pendingRef.current));

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      try {
        await notificationAPI.markRead(id);
        showToast('Marked as read');
      } catch (err) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
        showToast(
          getErrorMessage(err, 'Unable to update notifications'),
          'error'
        );
      } finally {
        pendingRef.current.delete(id);
        setPendingIds(new Set(pendingRef.current));
      }
    },
    [showToast]
  );

  /** Marks every notification as read (optimistic, single request). */
  const markAllAsRead = useCallback(async () => {
    if (busyRef.current) return;
    const unread = itemsRef.current.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    busyRef.current = true;
    setBusy(true);
    const snapshot = itemsRef.current;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );

    try {
      await notificationAPI.markAllRead();
      showToast('All notifications marked as read');
    } catch (err) {
      setNotifications(snapshot);
      showToast(
        getErrorMessage(err, 'Unable to update notifications'),
        'error'
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [showToast]);

  /** Deletes a single notification (optimistic). */
  const deleteNotification = useCallback(
    async (id) => {
      if (pendingRef.current.has(id)) return;
      pendingRef.current.add(id);
      setPendingIds(new Set(pendingRef.current));
      const snapshot = itemsRef.current;

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      try {
        await notificationAPI.delete(id);
        showToast('Notification deleted');
      } catch (err) {
        setNotifications(snapshot);
        showToast(
          getErrorMessage(err, 'Unable to update notifications'),
          'error'
        );
      } finally {
        pendingRef.current.delete(id);
        setPendingIds(new Set(pendingRef.current));
      }
    },
    [showToast]
  );

  /** Clears every notification (optimistic, single request). */
  const clearAll = useCallback(async () => {
    if (busyRef.current) return;
    if (itemsRef.current.length === 0) return;

    busyRef.current = true;
    setBusy(true);
    const snapshot = itemsRef.current;

    setNotifications([]);

    try {
      await notificationAPI.clearAll();
      showToast('Notifications cleared');
    } catch (err) {
      setNotifications(snapshot);
      showToast(
        getErrorMessage(err, 'Unable to update notifications'),
        'error'
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [showToast]);

  const isPending = useCallback(
    (id) => pendingIds.has(id),
    [pendingIds]
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const value = useMemo(
    () => ({
      notifications,
      loading,
      unreadCount,
      busy,
      isPending,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }),
    [
      notifications,
      loading,
      unreadCount,
      busy,
      isPending,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
