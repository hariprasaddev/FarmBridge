package com.farmbridge.service;

import com.farmbridge.dto.AdminDashboardResponse;
import com.farmbridge.dto.FarmerVerificationResponse;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;

import java.util.List;

public interface AdminService {

    AdminDashboardResponse getStats();

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    List<UserResponse> getFarmers();

    List<UserResponse> getBuyers();

    List<ProductResponse> getAllProducts();

    List<OrderResponse> getAllOrders();

    List<FarmerVerificationResponse> getUnverifiedFarmers();

    FarmerVerificationResponse verifyFarmer(Long profileId);

    FarmerVerificationResponse rejectFarmer(Long profileId, String reason);

    UserResponse updateUser(Long id, UserRequest request);

    // actingEmail guards against an admin deactivating their own account
    void deleteUser(Long id, String actingEmail);

    UserResponse activateUser(Long id);
}
