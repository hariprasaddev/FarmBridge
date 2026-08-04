package com.farmbridge;

import com.farmbridge.dto.ForgotPasswordRequest;
import com.farmbridge.dto.LoginRequest;
import com.farmbridge.dto.ResetPasswordRequest;
import com.farmbridge.entity.PasswordResetToken;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.repository.PasswordResetTokenRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.service.AuthService;
import com.farmbridge.service.PasswordResetService;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PasswordResetFlowIntegrationTest {

    // Unique per run so leftover data from a previously failed run can
    // never interfere with this one.
    private static final String TEST_EMAIL =
            "pwdreset.test." + System.currentTimeMillis() + "@example.com";
    private static final String OLD_PASSWORD = "OldPassword123!";
    private static final String NEW_PASSWORD = "NewPassword456!";

    @Autowired private PasswordResetService passwordResetService;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthService authService;

    private User testUser;

    @BeforeAll
    void createTestUser() {
        testUser = userRepository.findByEmail(TEST_EMAIL).orElseGet(() -> {
            User user = new User();
            user.setName("Pwd Reset Test");
            user.setEmail(TEST_EMAIL);
            user.setPassword(passwordEncoder.encode(OLD_PASSWORD));
            user.setRole(Role.BUYER);
            return userRepository.save(user);
        });
    }

    // Note: @AfterAll is not covered by Spring's transactional test
    // listener, so use deleteAll/delete (internally transactional)
    // instead of the derived deleteByUser (which needs an outer tx).
    @AfterAll
    void cleanup() {
        tokenRepository.deleteAll(
                tokenRepository.findByUserEmail(TEST_EMAIL).stream().toList()
        );
        userRepository.delete(testUser);
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Unknown email returns the generic message and creates no token")
    void forgotPassword_unknownEmail_returnsGenericMessage() {

        String response = passwordResetService.forgotPassword(
                new ForgotPasswordRequest("nobody@example.com")
        );

        assertEquals(
                "If the email exists, a password reset link has been sent.",
                response
        );

        assertTrue(
                tokenRepository.findByUserEmail("nobody@example.com").isEmpty()
        );
    }

    @Test
    @Order(2)
    @DisplayName("Known email returns the generic message and creates a valid token")
    void forgotPassword_knownEmail_createsToken() {

        String response = passwordResetService.forgotPassword(
                new ForgotPasswordRequest(TEST_EMAIL)
        );

        // Identical message — no account enumeration
        assertEquals(
                "If the email exists, a password reset link has been sent.",
                response
        );

        PasswordResetToken token = tokenRepository
                .findByUserEmail(TEST_EMAIL)
                .orElseThrow(() -> new AssertionError("Token was not created"));

        assertFalse(token.getToken().isBlank());
        assertFalse(Boolean.TRUE.equals(token.getUsed()));
        assertEquals(testUser.getId(), token.getUser().getId());

        // Expires in roughly 15 minutes
        LocalDateTime expectedExpiry = LocalDateTime.now().plusMinutes(15);
        assertTrue(token.getExpiryTime().isAfter(expectedExpiry.minusMinutes(2)));
        assertTrue(token.getExpiryTime().isBefore(expectedExpiry.plusMinutes(2)));
    }

    @Test
    @Order(3)
    @DisplayName("Requesting a new token replaces the previous one (one active token per user)")
    void forgotPassword_replacesPreviousToken() {

        passwordResetService.forgotPassword(
                new ForgotPasswordRequest(TEST_EMAIL)
        );
        String firstToken = tokenRepository
                .findByUserEmail(TEST_EMAIL)
                .orElseThrow()
                .getToken();

        passwordResetService.forgotPassword(
                new ForgotPasswordRequest(TEST_EMAIL)
        );
        String secondToken = tokenRepository
                .findByUserEmail(TEST_EMAIL)
                .orElseThrow()
                .getToken();

        assertNotEquals(firstToken, secondToken);

        // Exactly one token exists for this user
        assertEquals(1, tokenRepository.findByUserEmail(TEST_EMAIL).stream().count());
    }

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    @Test
    @Order(4)
    @DisplayName("Invalid token is rejected")
    void resetPassword_invalidToken_throws() {

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> passwordResetService.resetPassword(
                        new ResetPasswordRequest(
                                "definitely-not-a-real-token",
                                NEW_PASSWORD
                        )
                )
        );

        assertEquals(
                "Invalid or expired password reset token",
                ex.getMessage()
        );
    }

    @Test
    @Order(5)
    @DisplayName("Expired token is rejected (cleaned up, indistinguishable from an invalid token)")
    void resetPassword_expiredToken_throws() {

        // Create a token that already expired
        PasswordResetToken expired = new PasswordResetToken();
        expired.setToken("expired-token-" + System.currentTimeMillis());
        expired.setUser(testUser);
        expired.setExpiryTime(LocalDateTime.now().minusMinutes(1));
        expired.setUsed(false);
        tokenRepository.save(expired);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> passwordResetService.resetPassword(
                        new ResetPasswordRequest(
                                expired.getToken(),
                                NEW_PASSWORD
                        )
                )
        );

        // The service deletes expired tokens before lookup, so an expired
        // token is treated exactly like an invalid one (no information leak)
        assertEquals(
                "Invalid or expired password reset token",
                ex.getMessage()
        );

        // Expired token cleaned up
        assertTrue(tokenRepository.findByToken(expired.getToken()).isEmpty());
    }

    @Test
    @Order(6)
    @DisplayName("Successful reset updates the password, marks the token used, "
            + "allows login with the new password and rejects the old one")
    void resetPassword_success_updatesPasswordAndMarksUsed() {

        passwordResetService.forgotPassword(
                new ForgotPasswordRequest(TEST_EMAIL)
        );

        PasswordResetToken token = tokenRepository
                .findByUserEmail(TEST_EMAIL)
                .orElseThrow();

        String response = passwordResetService.resetPassword(
                new ResetPasswordRequest(token.getToken(), NEW_PASSWORD)
        );

        assertEquals("Password reset successful.", response);

        // Token marked used
        assertTrue(
                Boolean.TRUE.equals(
                        tokenRepository.findByToken(token.getToken())
                                .orElseThrow()
                                .getUsed()
                )
        );

        // Login with the NEW password succeeds
        assertDoesNotThrow(() ->
                authService.login(
                        new LoginRequest(TEST_EMAIL, NEW_PASSWORD)
                )
        );

        // Login with the OLD password is rejected
        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> authService.login(
                        new LoginRequest(TEST_EMAIL, OLD_PASSWORD)
                )
        );

        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @Order(7)
    @DisplayName("A used token can never be reused")
    void resetPassword_usedToken_throws() {

        passwordResetService.forgotPassword(
                new ForgotPasswordRequest(TEST_EMAIL)
        );

        PasswordResetToken token = tokenRepository
                .findByUserEmail(TEST_EMAIL)
                .orElseThrow();

        // First use succeeds
        passwordResetService.resetPassword(
                new ResetPasswordRequest(token.getToken(), NEW_PASSWORD + "x")
        );

        // Second use is rejected
        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> passwordResetService.resetPassword(
                        new ResetPasswordRequest(token.getToken(), NEW_PASSWORD + "y")
                )
        );

        assertEquals(
                "This password reset link has already been used",
                ex.getMessage()
        );
    }
}
