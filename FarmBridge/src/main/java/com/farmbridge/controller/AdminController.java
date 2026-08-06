package com.farmbridge.controller;

import com.farmbridge.dto.AdminDashboardResponse;
import com.farmbridge.dto.AnnouncementRequest;
import com.farmbridge.dto.AnnouncementResponse;
import com.farmbridge.dto.FarmerVerificationResponse;
import com.farmbridge.dto.RejectVerificationRequest;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;
import com.farmbridge.service.AdminService;
import com.farmbridge.service.AnnouncementService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "APIs for platform administrators to manage users, products, orders, and farmer verification")
@SecurityRequirement(name = "Bearer JWT")
public class AdminController {

    private final AdminService adminService;
    private final AnnouncementService announcementService;

    public AdminController(
            AdminService adminService,
            AnnouncementService announcementService) {

        this.adminService = adminService;
        this.announcementService = announcementService;
    }

    // ==========================================
    // ADMIN GREETING (Stub)
    // ==========================================

    @GetMapping
    @Operation(summary = "Admin dashboard greeting", description = "Simple greeting endpoint to verify admin authentication works.")
    public String adminDashboard() {
        return "Welcome Admin!";
    }

    // ==========================================
    // DASHBOARD STATS
    // ==========================================

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard stats", description = "Returns platform-wide counts: total users, farmers, buyers, products, orders, and pending verifications.")
    public ResponseEntity<AdminDashboardResponse> getStats() {

        AdminDashboardResponse response =
                adminService.getStats();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Lists every registered user across all roles.")
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        List<UserResponse> response =
                adminService.getAllUsers();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get a user by ID", description = "Fetches a single user by their ID.")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        UserResponse response =
                adminService.getUserById(id);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update a user", description = "Admin updates a user's name, email, or role.")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {

        UserResponse response =
                adminService.updateUser(id, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Deactivate a user (soft delete)", description = "Admin deactivates a user account. The record is never deleted — active=false blocks login and every secured endpoint while all historical data (orders, reviews, analytics) is preserved. An admin cannot deactivate their own account, and the last active ADMIN can never be deactivated.")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {

        adminService.deleteUser(
                id,
                authentication.getName()
        );

        return ResponseEntity.ok("User deactivated successfully");
    }

    @PutMapping("/users/{id}/reactivate")
    @Operation(summary = "Reactivate a user", description = "Admin reactivates a previously deactivated account (active=true), restoring login and full access. Historical data was never lost.")
    public ResponseEntity<String> reactivateUser(
            @PathVariable Long id) {

        adminService.activateUser(id);

        return ResponseEntity.ok("User activated successfully");
    }

    // ==========================================
    // ROLE-FILTERED USER LISTS
    // ==========================================

    @GetMapping("/farmers")
    @Operation(summary = "Get all farmers", description = "Lists all users with the FARMER role.")
    public ResponseEntity<List<UserResponse>> getFarmers() {

        List<UserResponse> response =
                adminService.getFarmers();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/buyers")
    @Operation(summary = "Get all buyers", description = "Lists all users with the BUYER role.")
    public ResponseEntity<List<UserResponse>> getBuyers() {

        List<UserResponse> response =
                adminService.getBuyers();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // PRODUCT OVERSIGHT
    // ==========================================

    @GetMapping("/products")
    @Operation(summary = "Get all products", description = "Lists every product listed across the platform.")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        List<ProductResponse> response =
                adminService.getAllProducts();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ORDER OVERSIGHT
    // ==========================================

    @GetMapping("/orders")
    @Operation(summary = "Get all orders", description = "Lists every order placed across the platform.")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {

        List<OrderResponse> response =
                adminService.getAllOrders();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // FARMER VERIFICATION
    // ==========================================

    @GetMapping("/farmers/unverified")
    @Operation(summary = "Get unverified farmers", description = "Lists farmer profiles that have not been verified yet.")
    public ResponseEntity<List<FarmerVerificationResponse>> getUnverifiedFarmers() {

        List<FarmerVerificationResponse> response =
                adminService.getUnverifiedFarmers();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/farmers/{profileId}/verify")
    @Operation(summary = "Approve a farmer", description = "Approves a farmer's verification request, unlocking product creation and order receiving.")
    public ResponseEntity<FarmerVerificationResponse> verifyFarmer(
            @PathVariable Long profileId) {

        FarmerVerificationResponse response =
                adminService.verifyFarmer(profileId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/farmers/{profileId}/reject")
    @Operation(summary = "Reject a farmer", description = "Rejects a farmer's verification request with a mandatory reason stored on the profile.")
    public ResponseEntity<FarmerVerificationResponse> rejectFarmer(
            @PathVariable Long profileId,
            @Valid @RequestBody RejectVerificationRequest request) {

        FarmerVerificationResponse response =
                adminService.rejectFarmer(
                        profileId,
                        request.getReason()
                );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // EMAIL ANNOUNCEMENTS
    // ==========================================

    @PostMapping("/announcements")
    @Operation(summary = "Send an announcement email", description = "Emails every user matching the audience (ALL, BUYERS or FARMERS). A delivery failure for one recipient never stops the remaining emails.")
    public ResponseEntity<AnnouncementResponse> sendAnnouncement(
            @Valid @RequestBody AnnouncementRequest request,
            Authentication authentication) {

        // Get logged-in admin email from JWT
        String adminEmail = authentication.getName();

        AnnouncementResponse response =
                announcementService.sendAnnouncement(
                        request,
                        adminEmail
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/announcements")
    @Operation(summary = "Get announcement history", description = "Lists every announcement email sent, newest first.")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements() {

        List<AnnouncementResponse> response =
                announcementService.getAnnouncements();

        return ResponseEntity.ok(response);
    }
}
