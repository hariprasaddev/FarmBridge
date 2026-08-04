package com.farmbridge.service;

import com.farmbridge.dto.NotificationResponse;
import com.farmbridge.entity.NotificationType;

import java.util.List;

public interface NotificationService {

    // Central creation point — all modules create notifications here.
    NotificationResponse createNotification(
            String recipientEmail,
            String title,
            String message,
            NotificationType type,
            Long referenceId
    );

    List<NotificationResponse> getNotifications(String email);

    List<NotificationResponse> getUnreadNotifications(String email);

    long getUnreadCount(String email);

    NotificationResponse markAsRead(Long notificationId, String email);

    long markAllAsRead(String email);

    void deleteNotification(Long notificationId, String email);

    long clearAllNotifications(String email);
}
