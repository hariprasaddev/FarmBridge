package com.farmbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of the admin reject action — the rejection reason is mandatory
 * and stored on the farmer's profile for the farmer to read and resubmit.
 */
public class RejectVerificationRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 1000, message = "Rejection reason must be at most 1000 characters")
    private String reason;

    public RejectVerificationRequest() {
    }

    public RejectVerificationRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
