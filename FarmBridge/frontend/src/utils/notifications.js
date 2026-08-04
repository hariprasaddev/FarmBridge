// Maps a backend NotificationType to the Icon name shown on cards.
// Shared by the notification bell dropdown and the notifications page
// so the iconography stays identical everywhere.
const NOTIFICATION_ICONS = {
  NEW_ORDER: 'cart',
  ORDER_ACCEPTED: 'checkCircle',
  ORDER_REJECTED: 'xCircle',
  ORDER_COMPLETED: 'package',
  ADMIN_MESSAGE: 'info',
};

export function getNotificationIcon(type) {
  return NOTIFICATION_ICONS[type] || 'bell';
}
