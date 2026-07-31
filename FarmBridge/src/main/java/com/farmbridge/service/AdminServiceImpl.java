package com.farmbridge.service;

import com.farmbridge.dto.AdminDashboardResponse;
import com.farmbridge.dto.FarmerVerificationResponse;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.Order;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final ProductService productService;

    public AdminServiceImpl(
            UserRepository userRepository,
            FarmerProfileRepository farmerProfileRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            UserService userService,
            ProductService productService) {

        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userService = userService;
        this.productService = productService;
    }

    // ==========================================
    // DASHBOARD STATS
    // ==========================================

    @Override
    public AdminDashboardResponse getStats() {

        long pendingVerifications =
                farmerProfileRepository.findAll().stream()
                        .filter(p -> !Boolean.TRUE.equals(p.getVerified()))
                        .count();

        return new AdminDashboardResponse(
                userRepository.count(),
                userRepository.countByRole(Role.FARMER),
                userRepository.countByRole(Role.BUYER),
                productRepository.count(),
                orderRepository.count(),
                pendingVerifications
        );
    }

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    @Override
    public List<UserResponse> getAllUsers() {

        return userService.getAllUsers();
    }

    @Override
    public UserResponse getUserById(Long id) {

        return userService.getUserById(id);
    }

    @Override
    public List<UserResponse> getFarmers() {

        return userRepository.findByRole(Role.FARMER).stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    public List<UserResponse> getBuyers() {

        return userRepository.findByRole(Role.BUYER).stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    public UserResponse updateUser(Long id, UserRequest request) {

        return userService.updateUser(id, request);
    }

    @Override
    public void deleteUser(Long id) {

        userService.deleteUser(id);
    }

    // ==========================================
    // PRODUCT OVERSIGHT
    // ==========================================

    @Override
    public List<ProductResponse> getAllProducts() {

        return productService.getAllProducts();
    }

    // ==========================================
    // ORDER OVERSIGHT
    // ==========================================

    @Override
    public List<OrderResponse> getAllOrders() {

        return orderRepository.findAll().stream()
                .map(this::toOrderResponse)
                .toList();
    }

    // ==========================================
    // FARMER VERIFICATION
    // ==========================================

    @Override
    public List<FarmerVerificationResponse> getUnverifiedFarmers() {

        return farmerProfileRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getVerified()))
                .map(this::toVerificationResponse)
                .toList();
    }

    @Override
    public FarmerVerificationResponse verifyFarmer(Long profileId) {

        FarmerProfile profile = farmerProfileRepository
                .findById(profileId)
                .orElseThrow(() ->
                        new RuntimeException("Farmer profile not found")
                );

        profile.setVerified(true);

        FarmerProfile savedProfile =
                farmerProfileRepository.save(profile);

        return toVerificationResponse(savedProfile);
    }

    // ==========================================
    // HELPERS — Map entities to response DTOs
    // ==========================================

    private UserResponse toUserResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    private OrderResponse toOrderResponse(Order order) {

        return new OrderResponse(
                order.getId(),
                order.getProduct().getId(),
                order.getProduct().getName(),
                order.getBuyer().getName(),
                order.getFarmer().getName(),
                order.getQuantity(),
                order.getTotalPrice(),
                order.getStatus().name()
        );
    }

    private FarmerVerificationResponse toVerificationResponse(
            FarmerProfile profile) {

        User user = profile.getUser();

        return new FarmerVerificationResponse(
                profile.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                profile.getFarmName(),
                profile.getLocation(),
                profile.getVerified()
        );
    }
}
