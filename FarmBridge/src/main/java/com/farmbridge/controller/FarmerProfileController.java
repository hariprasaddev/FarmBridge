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
    public ResponseEntity<FarmerProfileResponse> getProfile(
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        // Get farmer profile — GlobalExceptionHandler handles 404 if not found
        FarmerProfileResponse response =
                farmerProfileService.getProfile(email);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // UPDATE MY PROFILE
    // ==========================================

    @PutMapping
    public ResponseEntity<FarmerProfileResponse> updateProfile(
            @Valid @RequestBody FarmerProfileRequest request,
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        // Update farmer profile — GlobalExceptionHandler handles 404 if not found
        FarmerProfileResponse response =
                farmerProfileService.updateProfile(
                        request,
                        email
                );

        return ResponseEntity.ok(response);
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