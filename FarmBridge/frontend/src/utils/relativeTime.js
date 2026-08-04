/**
 * Lightweight relative-time formatter (no external library).
 *
 * "Just now"          — less than a minute
 * "5 minutes ago"     — under an hour
 * "3 hours ago"       — same calendar day, under 24h
 * "Yesterday"         — the previous calendar day
 * "4 days ago"        — anything older
 */
export function formatRelativeTime(iso) {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Just now';

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  // Calendar-day difference (so 23:00 yesterday → "Yesterday")
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (startOfToday - startOfDate) / 86400000
  );

  if (diffDays === 1) return 'Yesterday';

  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
