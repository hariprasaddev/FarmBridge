package com.farmbridge.service;

import com.farmbridge.dto.ForgotPasswordRequest;
import com.farmbridge.dto.ResetPasswordRequest;
import com.farmbridge.entity.PasswordResetToken;
import com.farmbridge.entity.User;
import com.farmbridge.repository.PasswordResetTokenRepository;
import com.farmbridge.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl
        implements PasswordResetService {

    // How long a reset token stays valid (minutes)
    private static final long TOKEN_VALIDITY_MINUTES = 15;

    // Identical response whether or not the email exists — prevents
    // user enumeration through the forgot-password endpoint.
    private static final String GENERIC_RESPONSE =
            "If the email exists, a password reset link has been sent.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Runs the expired-token purge in its OWN transaction so the
    // cleanup is committed even when the surrounding reset request
    // fails (and its transaction rolls back).
    private final TransactionTemplate cleanupTransaction;

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            PlatformTransactionManager transactionManager) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;

        this.cleanupTransaction =
                new TransactionTemplate(transactionManager);
        this.cleanupTransaction.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    // ==========================================
    // HELPER — Delete every expired token
    // ==========================================

    private void deleteExpiredTokens() {
        cleanupTransaction.executeWithoutResult(status ->
                tokenRepository.deleteByExpiryTimeBefore(
                        LocalDateTime.now()
                )
        );
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {

        // Clean up tokens that have already expired
        deleteExpiredTokens();

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        // IMPORTANT: never reveal whether the email exists — the
        // response is identical in both branches.
        //
        // SOFT DELETE: deactivated accounts also receive the same generic
        // response and no reset token — an attacker cannot tell active
        // accounts from inactive ones, and a deactivated account cannot
        // obtain a reset link. They remain blocked from logging in until
        // an admin reactivates the account.
        if (user == null || !user.isActive()) {
            return GENERIC_RESPONSE;
        }

        // One active token per user: drop any previous token first.
        tokenRepository.deleteByUser(user);

        // Generate a unique token valid for 15 minutes
        PasswordResetToken token = new PasswordResetToken();

        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiryTime(
                LocalDateTime.now().plusMinutes(TOKEN_VALIDITY_MINUTES)
        );
        token.setUsed(false);

        tokenRepository.save(token);

        // Best-effort send — failures are logged, never surfaced.
        emailService.sendPasswordResetEmail(user, token);

        return GENERIC_RESPONSE;
    }

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {

        // Delete expired tokens (cleanup rule)
        deleteExpiredTokens();

        PasswordResetToken token = tokenRepository
                .findByToken(request.getToken().trim())
                .orElseThrow(() -> new RuntimeException(
                        "Invalid or expired password reset token"
                ));

        // A used token can never be reused
        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new RuntimeException(
                    "This password reset link has already been used"
            );
        }

        // Expired tokens are rejected. (The deleteExpiredTokens() purge
        // above already removed every expired row in a committed
        // transaction, so this branch only fires for a token expiring
        // between the purge and this check — microseconds.)
        if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "This password reset link has expired"
            );
        }

        User user = token.getUser();

        // Update the password (BCrypt hashed)
        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );
        userRepository.save(user);

        // Invalidate the token so it can never be used again
        token.setUsed(true);
        tokenRepository.save(token);

        return "Password reset successful.";
    }
}
