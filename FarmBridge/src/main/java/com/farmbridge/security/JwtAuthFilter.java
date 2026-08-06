package com.farmbridge.security;

import com.farmbridge.entity.User;
import com.farmbridge.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    // Message returned when a deactivated (soft-deleted) account tries to
    // use a still-valid JWT — the account no longer exists for security.
    private static final String DEACTIVATED_MESSAGE =
            "Your account has been deactivated. Please contact the administrator.";

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(
            JwtUtil jwtUtil,
            UserRepository userRepository) {

        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        // Check Authorization header
        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        // Extract token
        String token = authHeader.substring(7);

        // Validate token
        if (jwtUtil.isTokenValid(token)) {

            // Extract email
            String email =
                    jwtUtil.extractEmail(token);

            // Extract role
            String role =
                    jwtUtil.extractRole(token);

            // SOFT DELETE GATE: an account deactivated after the JWT was
            // issued must be rejected on EVERY secured endpoint. The token
            // is cryptographically valid, but the account no longer has
            // access — no authentication is set and the request returns 403.
            User user = userRepository
                    .findByEmail(email)
                    .orElse(null);

            if (user == null || !user.isActive()) {
                writeForbidden(response);
                return;
            }

            // Create authentication
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_" + role
                                    )
                            )
                    );

            // Set authentication
            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);
        }

        // Continue request
        filterChain.doFilter(
                request,
                response
        );
    }

    // Writes the 403 Forbidden JSON payload and terminates the chain.
    private void writeForbidden(HttpServletResponse response)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"status\":403,\"message\":\""
                        + DEACTIVATED_MESSAGE
                        + "\"}"
        );
        response.flushBuffer();
    }
}