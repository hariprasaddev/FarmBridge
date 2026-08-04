package com.farmbridge.exception;

/**
 * Thrown when a user tries to access a notification that belongs to
 * another user. Handled by NotificationExceptionHandler → HTTP 403.
 */
public class NotificationAccessDeniedException extends RuntimeException {

    public NotificationAccessDeniedException(String message) {
        super(message);
    }
}
