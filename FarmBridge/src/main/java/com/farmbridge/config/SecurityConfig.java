package com.farmbridge.config;

import com.farmbridge.security.JwtAuthFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter) {

        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http)
            throws Exception {

        http
                // Disable CSRF for REST APIs
                .csrf(csrf -> csrf.disable())

                // Don't create HTTP sessions
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // Role-based APIs
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/farmer/**").hasRole("FARMER")
                        .requestMatchers("/api/buyer/**").hasRole("BUYER")

                        // Everything else
                        .anyRequest().authenticated()
                )


                // Add JWT filter
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}