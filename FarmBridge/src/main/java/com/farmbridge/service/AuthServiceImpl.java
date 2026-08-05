package com.farmbridge.service;

import com.farmbridge.dto.LoginRequest;
import com.farmbridge.dto.LoginResponse;
import com.farmbridge.dto.RegisterRequest;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.security.JwtUtil;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Override
    public String register(RegisterRequest request) {

        // Duplicate email → 409 Conflict (matches the API-wide message mapping)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // SECURITY: only FARMER and BUYER accounts can self-register.
        // Accepting the role from the request body without restriction
        // would let anyone create an ADMIN account (privilege escalation).
        Role role = request.getRole();

        if (role == null || role == Role.ADMIN) {
            throw new RuntimeException(
                    "Only FARMER and BUYER accounts can be created through registration"
            );
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // Hash password before saving
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole(role);

        userRepository.save(user);

        // Best-effort welcome email — a mail outage must never fail
        // registration (EmailService swallows and logs the failure).
        emailService.sendWelcomeEmail(user);

        return "User Registered Successfully";
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        // Generate JWT with email and role
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new LoginResponse(
                "Login successful",
                token,
                user.getEmail(),
                user.getRole().name()
        );
    }
}