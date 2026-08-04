package com.farmbridge.controller;

import com.farmbridge.dto.ForgotPasswordRequest;
import com.farmbridge.dto.ResetPasswordRequest;
import com.farmbridge.service.PasswordResetService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Password Reset", description = "Forgot password and reset password APIs")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {

        this.passwordResetService = passwordResetService;
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request a password reset link",
            description = "Sends a reset link to the given email if it exists. "
                    + "Always returns the same response whether or not the email "
                    + "exists, so account existence is never revealed."
    )
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String response =
                passwordResetService.forgotPassword(request);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset the password with a token",
            description = "Validates the token (exists, not expired, not used) "
                    + "and updates the password using BCrypt."
    )
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        String response =
                passwordResetService.resetPassword(request);

        return ResponseEntity.ok(response);
    }
}
