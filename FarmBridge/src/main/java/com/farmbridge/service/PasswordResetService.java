package com.farmbridge.service;

import com.farmbridge.dto.ForgotPasswordRequest;
import com.farmbridge.dto.ResetPasswordRequest;

public interface PasswordResetService {

    // Requests a reset link. Always returns the same message whether
    // or not the email exists (no account enumeration).
    String forgotPassword(ForgotPasswordRequest request);

    // Resets the password using a valid, unused, unexpired token.
    String resetPassword(ResetPasswordRequest request);
}
