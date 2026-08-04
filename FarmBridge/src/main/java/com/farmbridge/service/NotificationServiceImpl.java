package com.farmbridge.service;

import com.farmbridge.dto.NotificationResponse;
import com.farmbridge.entity.Notification;
import com.farmbridge.entity.NotificationType;
import com.farmbridge.entity.User;
import com.farmbridge.exception.NotificationAccessDeniedException;
import com.farmbridge.repository.NotificationRepository;
import com.farmbridge.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE NOTIFICATION
    // Central creation point used by all modules.
    // ==========================================

    @Override
    @Transactional
    public NotificationResponse createNotification(
            String recipientEmail,
            String title,
            String message,
            NotificationType type,
            Long referenceId) {

        // Recipient must exist
        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        Notification notification = new Notification();

        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);

        Notification saved =
                notificationRepository.save(notification);

        return convertToResponse(saved);
    }

    // ==========================================
    // GET ALL NOTIFICATIONS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String email) {

        return notificationRepository
                .findByRecipientEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // GET UNREAD NOTIFICATIONS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(
            String email) {

        return notificationRepository
                .findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(
                        email
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // GET UNREAD COUNT
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {

        return notificationRepository
                .countByRecipientEmailAndIsReadFalse(email);
    }

    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    @Override
    @Transactional
    public NotificationResponse markAsRead(
            Long notificationId,
            String email) {

        Notification notification =
                getOwnedNotification(notificationId, email);

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }

        return convertToResponse(notification);
    }

    // ==========================================
    // MARK ALL NOTIFICATIONS AS READ
    // ==========================================

    @Override
    @Transactional
    public long markAllAsRead(String email) {

        List<Notification> unread =
                notificationRepository
                        .findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(
                                email
                        );

        unread.forEach(notification ->
                notification.setIsRead(true)
        );

        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }

        return unread.size();
    }

    // ==========================================
    // DELETE ONE NOTIFICATION
    // ==========================================

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, String email) {

        Notification notification =
                getOwnedNotification(notificationId, email);

        notificationRepository.delete(notification);
    }

    // ==========================================
    // CLEAR ALL NOTIFICATIONS
    // ==========================================

    @Override
    @Transactional
    public long clearAllNotifications(String email) {

        return notificationRepository
                .deleteByRecipientEmail(email);
    }

    // ==========================================
    // HELPER — Load a notification, verifying ownership
    // ==========================================

    private Notification getOwnedNotification(
            Long notificationId,
            String email) {

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() ->
                        new RuntimeException("Notification not found")
                );

        // Users can only touch their own notifications
        if (!notification.getRecipient()
                .getEmail()
                .equals(email)) {

            throw new NotificationAccessDeniedException(
                    "You are not allowed to access this notification"
            );
        }

        return notification;
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private NotificationResponse convertToResponse(
            Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getIsRead(),
                notification.getReferenceId(),
                notification.getCreatedAt()
        );
    }
}
