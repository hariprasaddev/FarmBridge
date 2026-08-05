package com.farmbridge.dto;

import java.time.LocalDateTime;

public class AnnouncementResponse {

    private final Long id;
    private final String audience;
    private final String subject;
    private final String message;
    private final String buttonText;
    private final String buttonUrl;
    private final int recipientCount;
    private final String sentBy;
    private final LocalDateTime createdAt;

    public AnnouncementResponse(
            Long id,
            String audience,
            String subject,
            String message,
            String buttonText,
            String buttonUrl,
            int recipientCount,
            String sentBy,
            LocalDateTime createdAt) {

        this.id = id;
        this.audience = audience;
        this.subject = subject;
        this.message = message;
        this.buttonText = buttonText;
        this.buttonUrl = buttonUrl;
        this.recipientCount = recipientCount;
        this.sentBy = sentBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getAudience() {
        return audience;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public String getButtonText() {
        return buttonText;
    }

    public String getButtonUrl() {
        return buttonUrl;
    }

    public int getRecipientCount() {
        return recipientCount;
    }

    public String getSentBy() {
        return sentBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
