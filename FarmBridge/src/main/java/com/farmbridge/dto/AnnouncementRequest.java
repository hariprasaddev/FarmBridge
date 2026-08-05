package com.farmbridge.dto;

import com.farmbridge.entity.AnnouncementAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AnnouncementRequest {

    @NotNull(message = "Audience is required")
    private AnnouncementAudience audience;

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must be at most 200 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(max = 5000, message = "Message must be at most 5000 characters")
    private String message;

    // Optional action button
    @Size(max = 80, message = "Button text must be at most 80 characters")
    private String buttonText;

    // Optional action button URL. Must be an absolute http(s) link —
    // javascript:, file:, data: and relative URLs are rejected. Empty
    // (null/blank) is allowed because the button is optional.
    @Size(max = 1000, message = "Button URL must be at most 1000 characters")
    @Pattern(
            regexp = "^(https?://.*)?$",
            message = "Button URL must start with http:// or https://"
    )
    private String buttonUrl;

    public AnnouncementRequest() {
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
}
