package com.farmbridge.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A record of an admin announcement email broadcast. Stored for the
 * admin history list — the emails themselves are sent by EmailService.
 */
@Entity
@Table(name = "announcements")
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnnouncementAudience audience;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 5000)
    private String message;

    // Optional action button on the email
    @Column
    private String buttonText;

    @Column(length = 1000)
    private String buttonUrl;

    // How many recipients were addressed (delivery is best-effort)
    @Column(nullable = false)
    private int recipientCount;

    // Admin who sent it
    @Column(nullable = false)
    private String sentBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Announcement() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AnnouncementAudience getAudience() {
        return audience;
    }

    public void setAudience(AnnouncementAudience audience) {
        this.audience = audience;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getButtonText() {
        return buttonText;
    }

    public void setButtonText(String buttonText) {
        this.buttonText = buttonText;
    }

    public String getButtonUrl() {
        return buttonUrl;
    }

    public void setButtonUrl(String buttonUrl) {
        this.buttonUrl = buttonUrl;
    }

    public int getRecipientCount() {
        return recipientCount;
    }

    public void setRecipientCount(int recipientCount) {
        this.recipientCount = recipientCount;
    }

    public String getSentBy() {
        return sentBy;
    }

    public void setSentBy(String sentBy) {
        this.sentBy = sentBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
