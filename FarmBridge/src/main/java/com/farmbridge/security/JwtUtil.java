package com.farmbridge.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(
            @Value("${jwt.secret}") String secret) {

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes()
        );
    }

    // Generate JWT Token with Email and Role
    public String generateToken(String email, String role) {

        return Jwts.builder()
                .subject(email)

                // Add user's role inside JWT
                .claim("role", role)

                .issuedAt(new Date())

                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000 * 60 * 60
                        )
                )

                .signWith(secretKey)

                .compact();
    }

    // Extract email from JWT
    public String extractEmail(String token) {

        return extractAllClaims(token)
                .getSubject();
    }

    // Extract role from JWT
    public String extractRole(String token) {

        return extractAllClaims(token)
                .get("role", String.class);
    }

    // Validate JWT
    public boolean isTokenValid(String token) {

        try {

            Claims claims = extractAllClaims(token);

            return !claims.getExpiration()
                    .before(new Date());

        } catch (Exception e) {

            return false;
        }
    }

    // Extract all claims
    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}