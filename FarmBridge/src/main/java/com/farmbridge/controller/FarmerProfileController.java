package com.farmbridge.controller;

import com.farmbridge.dto.FarmerProfileRequest;
import com.farmbridge.dto.FarmerProfileResponse;
import com.farmbridge.dto.FarmerVerificationRequest;
import com.farmbridge.dto.FarmerVerificationResponse;
import com.farmbridge.service.FarmerProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/farmer/profile")
@Tag(name = "Farmer Profile & Verification", description = "APIs for farmers to manage their profile and verification request")
@SecurityRequirement(name = "Bearer JWT")
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

    // ==========================================
    // GET MY VERIFICATION STATUS
    // ==========================================

    @GetMapping("/verification")
    @Operation(
            summary = "Get my verification status",
            description = "Returns the logged-in farmer's full verification profile, current status (PENDING / APPROVED / REJECTED), and the rejection reason when present."
    )
    public ResponseEntity<FarmerVerificationResponse> getVerification(
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        FarmerVerificationResponse response =
                farmerProfileService.getVerification(email);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // SUBMIT / RESUBMIT VERIFICATION (multipart)
    // ==========================================

    @PostMapping(
            value = "/verification",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
            summary = "Submit (or resubmit) farmer verification",
            description = "Uploads the farmer's personal, farm and cultivation details together with the required documents (farmer photo, land ownership certificate, farm photo; organic certificate optional). Resubmitting a rejected request resets it to PENDING."
    )
    public ResponseEntity<FarmerVerificationResponse> submitVerification(
            @Valid @ModelAttribute FarmerVerificationRequest request,
            @RequestPart(value = "farmerPhoto", required = false)
            MultipartFile farmerPhoto,
            @RequestPart(value = "landCertificate", required = false)
            MultipartFile landCertificate,
            @RequestPart(value = "farmPhoto", required = false)
            MultipartFile farmPhoto,
            @RequestPart(value = "organicCertificate", required = false)
            MultipartFile organicCertificate,
            Authentication authentication) {

        // Get email of logged-in farmer from JWT authentication
        String email = authentication.getName();

        // Submit verification — GlobalExceptionHandler maps failures
        FarmerVerificationResponse response =
                farmerProfileService.submitVerification(
                        request,
                        farmerPhoto,
                        landCertificate,
                        farmPhoto,
                        organicCertificate,
                        email
                );

        return ResponseEntity.ok(response);
    }
}