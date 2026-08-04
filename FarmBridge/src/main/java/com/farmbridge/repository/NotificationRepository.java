package com.farmbridge.repository;

import com.farmbridge.entity.Notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // All notifications of a recipient, newest first
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(
            String email
    );

    // Number of unread notifications of a recipient
    long countByRecipientEmailAndIsReadFalse(String email);

    // Unread notifications of a recipient, newest first
    List<Notification> findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(
            String email
    );

    // A single notification owned by a recipient (empty otherwise)
    Optional<Notification> findByIdAndRecipientEmail(
            Long id,
            String email
    );

    // Remove every notification of a recipient
    long deleteByRecipientEmail(String email);
}
