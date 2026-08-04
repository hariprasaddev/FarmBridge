package com.farmbridge.controller;

import com.farmbridge.dto.NotificationResponse;
import com.farmbridge.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "APIs for buyers and farmers to view and manage their in-app notifications")
@SecurityRequirement(name = "Bearer JWT")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ==========================================
    // GET ALL NOTIFICATIONS
    // ==========================================

    @GetMapping
    @Operation(
            summary = "Get my notifications",
            description = "Fetch all notifications of the logged-in user, newest first. Users only ever see their own notifications."
    )
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            Authentication authentication) {

        // Get logged-in user email from JWT
        String email = authentication.getName();

        List<NotificationResponse> response =
                notificationService.getNotifications(email);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET UNREAD NOTIFICATIONS
    // ==========================================

    @GetMapping("/unread")
    @Operation(
            summary = "Get unread notifications",
            description = "Fetch only the unread notifications of the logged-in user, newest first."
    )
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            Authentication authentication) {

        String email = authentication.getName();

        List<NotificationResponse> response =
                notificationService.getUnreadNotifications(email);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET UNREAD COUNT
    // ==========================================

    @GetMapping("/unread/count")
    @Operation(
            summary = "Get unread notification count",
            description = "Fetch the number of unread notifications of the logged-in user (used for badge counters)."
    )
    public ResponseEntity<Long> getUnreadCount(
            Authentication authentication) {

        String email = authentication.getName();

        long count = notificationService.getUnreadCount(email);

        return ResponseEntity.ok(count);
    }

    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    @PutMapping("/{id}/read")
    @Operation(
            summary = "Mark a notification as read",
            description = "Mark one of the logged-in user's notifications as read. Returns 404 if the notification does not exist and 403 if it belongs to another user."
    )
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        NotificationResponse response =
                notificationService.markAsRead(id, email);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // MARK ALL NOTIFICATIONS AS READ
    // ==========================================

    @PutMapping("/read-all")
    @Operation(
            summary = "Mark all notifications as read",
            description = "Mark every notification of the logged-in user as read. Returns the number of notifications that were marked read."
    )
    public ResponseEntity<Long> markAllAsRead(
            Authentication authentication) {

        String email = authentication.getName();

        long marked = notificationService.markAllAsRead(email);

        return ResponseEntity.ok(marked);
    }

    // ==========================================
    // DELETE ONE NOTIFICATION
    // ==========================================

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a notification",
            description = "Delete one of the logged-in user's notifications. Returns 404 if the notification does not exist and 403 if it belongs to another user."
    )
    public ResponseEntity<String> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        notificationService.deleteNotification(id, email);

        return ResponseEntity.ok("Notification deleted successfully");
    }

    // ==========================================
    // CLEAR ALL NOTIFICATIONS
    // ==========================================

    @DeleteMapping
    @Operation(
            summary = "Clear all notifications",
            description = "Delete every notification of the logged-in user. Returns the number of notifications deleted."
    )
    public ResponseEntity<Long> clearAllNotifications(
            Authentication authentication) {

        String email = authentication.getName();

        long deleted = notificationService.clearAllNotifications(email);

        return ResponseEntity.ok(deleted);
    }
}
