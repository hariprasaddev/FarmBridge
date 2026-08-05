package com.farmbridge.entity;

/**
 * Lifecycle of a farmer's verification request.
 *
 * PENDING  — submitted (or resubmitted) and awaiting an admin review.
 * APPROVED — accepted by an admin; the farmer may create products
 *            and receive buyer orders.
 * REJECTED — declined by an admin with a stored rejection reason;
 *            the farmer may edit and resubmit.
 */
public enum VerificationStatus {
    PENDING,
    APPROVED,
    REJECTED
}
