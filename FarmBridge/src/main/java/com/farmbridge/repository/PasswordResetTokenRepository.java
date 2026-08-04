package com.farmbridge.repository;

import com.farmbridge.entity.PasswordResetToken;
import com.farmbridge.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    // Lookup a token by its UUID value (used when the reset link is opened)
    Optional<PasswordResetToken> findByToken(String token);

    // The single active token of a user (one active token per user)
    Optional<PasswordResetToken> findByUserEmail(String email);

    // Drop every token belonging to a user — called before issuing a
    // new token so only one active token exists per user.
    void deleteByUser(User user);

    // Bulk cleanup of expired tokens
    void deleteByExpiryTimeBefore(LocalDateTime time);
}
