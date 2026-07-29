package com.farmbridge.controller;

import com.farmbridge.dto.FarmerProfileRequest;
import com.farmbridge.dto.FarmerProfileResponse;
import com.farmbridge.service.FarmerProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farmer/profile")
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    public FarmerProfileController(
            FarmerProfileService farmerProfileService) {

        this.farmerProfileService = farmerProfileService;
    }

    // ==========================================
    // GET MY PROFILE
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getProfile(
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        try {

            // Get farmer profile
            FarmerProfileResponse response =
                    farmerProfileService.getProfile(email);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            // Profile not found — return 404
            return ResponseEntity.notFound().build();
        }
    }

    // ==========================================
    // UPDATE MY PROFILE
    // ==========================================

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody FarmerProfileRequest request,
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        try {

            // Update farmer profile
            FarmerProfileResponse response =
                    farmerProfileService.updateProfile(
                            request,
                            email
                    );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            // Profile not found — return 404
            return ResponseEntity.notFound().build();
        }
    }

    // ==========================================
    // CREATE PROFILE
    // ==========================================

    @PostMapping
    public ResponseEntity<FarmerProfileResponse> createProfile(
            @Valid @RequestBody FarmerProfileRequest request,
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        // Create farmer profile
        FarmerProfileResponse response =
                farmerProfileService.createProfile(
                        request,
                        email
                );

        return ResponseEntity.ok(response);
    }
}