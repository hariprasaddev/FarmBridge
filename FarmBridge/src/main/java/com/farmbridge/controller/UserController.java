package com.farmbridge.controller;

import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;
import com.farmbridge.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for administrators to manage users")
@SecurityRequirement(name = "Bearer JWT")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ==========================================
    // GET USER BY ID
    // ==========================================

    @GetMapping("/{id}")
    @Operation(summary = "Get a user by ID", description = "Fetches a single user by their ID.")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {

        UserResponse response = userService.getUserById(id);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET ALL USERS
    // ==========================================

    @GetMapping
    @Operation(summary = "Get all users", description = "Fetches all registered users.")
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        List<UserResponse> response = userService.getAllUsers();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    @PutMapping("/{id}")
    @Operation(summary = "Update a user", description = "Updates a user's name, email, or role.")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {

        UserResponse response = userService.updateUser(id, request);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // DELETE USER
    // ==========================================

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a user (soft delete)", description = "Deactivates a user account (active=false). The database record and all historical data are preserved; the account can no longer log in until reactivated. An admin cannot deactivate their own account, and the last active ADMIN can never be deactivated.")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {

        userService.deleteUser(
                id,
                authentication.getName()
        );

        return ResponseEntity.ok("User deactivated successfully");
    }

    @PutMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate a user", description = "Reactivates a deactivated account (active=true), restoring login and full access.")
    public ResponseEntity<String> reactivateUser(@PathVariable Long id) {

        userService.activateUser(id);

        return ResponseEntity.ok("User activated successfully");
    }
}
