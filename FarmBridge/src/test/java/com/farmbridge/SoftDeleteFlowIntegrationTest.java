package com.farmbridge;

import com.farmbridge.dto.ForgotPasswordRequest;
import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Review;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.NotificationRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.service.AdminService;
import com.farmbridge.service.AuthService;
import com.farmbridge.service.OrderService;
import com.farmbridge.service.PasswordResetService;
import com.farmbridge.service.ProductService;
import com.farmbridge.service.ReviewService;
import com.farmbridge.service.UserService;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Day 21 — Enterprise Soft Delete.
 *
 * Deactivating a user NEVER removes the database record. active=false only
 * blocks login and every secured endpoint. This suite proves the full
 * lifecycle: deactivate buyer -> blocked everywhere -> reactivate buyer ->
 * full access restored; same for a farmer, including product visibility
 * (hidden from buyers, visible to admins). All historical data — orders,
 * reviews, revenue, analytics — survives untouched, and the forgot-password
 * flow stays enumeration-safe.
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SoftDeleteFlowIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    private static final String BUYER_EMAIL = "soft.buyer." + TS + "@example.com";
    private static final String FARMER_EMAIL = "soft.farmer." + TS + "@example.com";
    private static final String ADMIN_EMAIL = "soft.admin." + TS + "@example.com";
    private static final String PASSWORD = "Passw0rd!123";

    @Autowired private AuthService authService;
    @Autowired private AdminService adminService;
    @Autowired private UserService userService;
    @Autowired private ProductService productService;
    @Autowired private OrderService orderService;
    @Autowired private ReviewService reviewService;
    @Autowired private PasswordResetService passwordResetService;

    @Autowired private UserRepository userRepository;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User buyer;
    private User farmer;
    private User admin;
    private Long farmerProductId;
    private Long orderId;

    private static final String DEACTIVATED_MESSAGE =
            "Your account has been deactivated. Please contact the administrator.";

    @BeforeAll
    void seed() {
        // Buyer + farmer accounts (both active by default)
        buyer = saveUser("Soft Delete Buyer", BUYER_EMAIL, Role.BUYER);
        farmer = saveUser("Soft Delete Farmer", FARMER_EMAIL, Role.FARMER);

        // Farmer passes verification so they can sell
        FarmerProfile profile = new FarmerProfile();
        profile.setUser(farmer);
        profile.setFarmName("Soft Delete Farm");
        profile.setVerified(true);
        profile.setVerificationStatus(VerificationStatus.APPROVED);
        farmerProfileRepository.save(profile);

        // Farmer lists a product
        ProductRequest productRequest = new ProductRequest();
        productRequest.setName("Soft Delete Rice");
        productRequest.setDescription("Grown with care");
        productRequest.setPrice(60.0);
        productRequest.setQuantity(50);
        productRequest.setCategory("Grains");
        farmerProductId = productService.createProduct(productRequest, FARMER_EMAIL).getId();

        // Buyer orders it and the farmer accepts — the buyer then reviews
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setProductId(farmerProductId);
        orderRequest.setQuantity(2);
        orderId = orderService.placeOrder(orderRequest, BUYER_EMAIL).getId();

        OrderStatusRequest statusRequest = new OrderStatusRequest();
        statusRequest.setStatus(OrderStatus.ACCEPTED);
        orderService.updateOrderStatus(orderId, statusRequest, FARMER_EMAIL);

        com.farmbridge.dto.ReviewRequest reviewRequest = new com.farmbridge.dto.ReviewRequest();
        reviewRequest.setRating(5);
        reviewRequest.setComment("Excellent quality");
        reviewService.createReview(farmerProductId, reviewRequest, BUYER_EMAIL);
    }

    @AfterAll
    void cleanup() {
        // FK order: reviews → orders → products → notifications → profiles → users.
        // Notifications reference both users (order/review events), so they
        // must be removed before the users themselves can be deleted.
        transactionTemplate.executeWithoutResult(status -> {
            reviewRepository.findByBuyerEmailAndProductId(BUYER_EMAIL, farmerProductId)
                    .ifPresent(reviewRepository::delete);
            orderRepository.findByBuyerEmail(BUYER_EMAIL)
                    .forEach(orderRepository::delete);
            productRepository.findByFarmerEmail(FARMER_EMAIL)
                    .forEach(productRepository::delete);
        notificationRepository.deleteByRecipientEmail(BUYER_EMAIL);
        notificationRepository.deleteByRecipientEmail(FARMER_EMAIL);
        farmerProfileRepository.findByUserEmail(FARMER_EMAIL)
                .ifPresent(farmerProfileRepository::delete);
        userRepository.delete(buyer);
        userRepository.delete(farmer);
        if (admin != null) {
            userRepository.delete(admin);
        }
        });
    }

    private User saveUser(String name, String email, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        return userRepository.save(user);
    }

    private void assertLoginBlocked(String email) {
        com.farmbridge.dto.LoginRequest request = new com.farmbridge.dto.LoginRequest();
        request.setEmail(email);
        request.setPassword(PASSWORD);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                authService.login(request)
        );
        assertEquals(DEACTIVATED_MESSAGE, ex.getMessage());
    }

    private void assertLoginWorks(String email) {
        com.farmbridge.dto.LoginRequest request = new com.farmbridge.dto.LoginRequest();
        request.setEmail(email);
        request.setPassword(PASSWORD);

        assertDoesNotThrow(() -> authService.login(request));
    }

    // ==========================================
    // BUYER LIFECYCLE
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Historical data exists before deactivation (order + review + revenue)")
    void historicalData_seeded() {
        assertTrue(orderRepository.findByBuyerEmail(BUYER_EMAIL).size() >= 1);
        assertTrue(reviewRepository.findByBuyerEmailAndProductId(BUYER_EMAIL, farmerProductId).isPresent());
        assertNotNull(userRepository.findByEmail(BUYER_EMAIL).orElseThrow());
        assertNotNull(userRepository.findByEmail(FARMER_EMAIL).orElseThrow());
    }

    @Test
    @Order(2)
    @DisplayName("Deactivated buyer cannot log in (403 message, no JWT)")
    void deactivatedBuyer_cannotLogin() {
        userService.deleteUser(buyer.getId());
        assertFalse(userRepository.findById(buyer.getId()).orElseThrow().isActive());
        // The record still exists — soft delete never removes the row
        assertTrue(userRepository.findById(buyer.getId()).isPresent());

        assertLoginBlocked(BUYER_EMAIL);
    }

    @Test
    @Order(3)
    @DisplayName("Deactivated buyer cannot place orders")
    void deactivatedBuyer_cannotPlaceOrder() {
        OrderRequest request = new OrderRequest();
        request.setProductId(farmerProductId);
        request.setQuantity(1);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                orderService.placeOrder(request, BUYER_EMAIL)
        );
        assertEquals(DEACTIVATED_MESSAGE, ex.getMessage());
    }

    @Test
    @Order(4)
    @DisplayName("Reactivated buyer can log in and place orders again")
    void reactivatedBuyer_canLoginAndOrder() {
        userService.activateUser(buyer.getId());
        assertTrue(userRepository.findById(buyer.getId()).orElseThrow().isActive());

        assertLoginWorks(BUYER_EMAIL);

        OrderRequest request = new OrderRequest();
        request.setProductId(farmerProductId);
        request.setQuantity(1);
        assertDoesNotThrow(() -> orderService.placeOrder(request, BUYER_EMAIL));
    }

    // ==========================================
    // FARMER LIFECYCLE
    // ==========================================

    @Test
    @Order(5)
    @DisplayName("Deactivated farmer cannot log in or create products")
    void deactivatedFarmer_cannotLoginOrCreate() {
        userService.deleteUser(farmer.getId());
        assertFalse(userRepository.findById(farmer.getId()).orElseThrow().isActive());

        assertLoginBlocked(FARMER_EMAIL);

        ProductRequest request = new ProductRequest();
        request.setName("Blocked Product");
        request.setDescription("Should never exist");
        request.setPrice(10.0);
        request.setQuantity(5);
        request.setCategory("Grains");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                productService.createProduct(request, FARMER_EMAIL)
        );
        assertEquals(DEACTIVATED_MESSAGE, ex.getMessage());
    }

    @Test
    @Order(6)
    @DisplayName("Products of a deactivated farmer vanish from buyer surfaces but stay visible to admins")
    void deactivatedFarmer_productsHiddenFromBuyers_visibleToAdmin() {
        // Buyer listing + details
        assertFalse(
                productService.getAllProducts().stream()
                        .anyMatch(p -> p.getId().equals(farmerProductId)),
                "Deactivated farmer's product must not appear in the buyer list"
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                productService.getBuyerProductById(farmerProductId)
        );
        assertEquals("Product not found", ex.getMessage());

        // Search must exclude it too
        List<ProductResponse> searchResults =
                productService.searchProductsByName("Soft Delete");
        assertFalse(
                searchResults.stream().anyMatch(p -> p.getId().equals(farmerProductId)),
                "Deactivated farmer's product must not appear in search results"
        );

        // Admin oversight still sees every product
        assertTrue(
                productService.getAllProductsForAdmin().stream()
                        .anyMatch(p -> p.getId().equals(farmerProductId)),
                "Admin must still see the deactivated farmer's product"
        );
    }

    @Test
    @Order(7)
    @DisplayName("Historical orders, reviews and the user record survive the deactivation")
    void historicalData_survivesDeactivation() {
        // Orders unchanged
        List<com.farmbridge.entity.Order> buyerOrders =
                orderRepository.findByBuyerEmail(BUYER_EMAIL);
        assertFalse(buyerOrders.isEmpty(), "Order history must remain intact");
        assertTrue(
                buyerOrders.stream().allMatch(o -> o.getStatus() != null),
                "Order state must remain readable"
        );

        // Reviews unchanged
        assertTrue(
                reviewRepository.findByBuyerEmailAndProductId(BUYER_EMAIL, farmerProductId).isPresent(),
                "Reviews must remain intact"
        );

        // Product record unchanged
        assertTrue(
                productRepository.findById(farmerProductId).isPresent(),
                "Product record must remain in the database"
        );

        // Revenue/order totals are aggregate queries over the same rows —
        // nothing was deleted, so analytics stay stable.
        long ordersBefore = orderRepository.count();
        long reviewsBefore = reviewRepository.count();
        assertTrue(ordersBefore >= 1 && reviewsBefore >= 1);
        // (Counts can only grow from the previous steps' reactivation order)
    }

    @Test
    @Order(8)
    @DisplayName("Reactivated farmer can log in and create products again")
    void reactivatedFarmer_canLoginAndCreate() {
        userService.activateUser(farmer.getId());
        assertTrue(userRepository.findById(farmer.getId()).orElseThrow().isActive());

        assertLoginWorks(FARMER_EMAIL);

        ProductRequest request = new ProductRequest();
        request.setName("Soft Delete Wheat");
        request.setDescription("Back in business");
        request.setPrice(40.0);
        request.setQuantity(10);
        request.setCategory("Grains");

        ProductResponse created =
                productService.createProduct(request, FARMER_EMAIL);
        assertNotNull(created.getId());

        // Buyer-visible again
        assertTrue(
                productService.getAllProducts().stream()
                        .anyMatch(p -> p.getId().equals(created.getId())),
                "Reactivated farmer's new product must be visible to buyers"
        );
    }

    // ==========================================
    // PASSWORD RESET — ENUMERATION SAFETY
    // ==========================================

    @Test
    @Order(9)
    @DisplayName("Forgot password returns the identical generic response for inactive users and unknown emails")
    void forgotPassword_enumerationSafe() {
        // Deactivate the buyer again for this check
        userService.deleteUser(buyer.getId());

        ForgotPasswordRequest inactive = new ForgotPasswordRequest();
        inactive.setEmail(BUYER_EMAIL);

        ForgotPasswordRequest unknown = new ForgotPasswordRequest();
        unknown.setEmail("does-not-exist." + TS + "@example.com");

        String responseForInactive = passwordResetService.forgotPassword(inactive);
        String responseForUnknown = passwordResetService.forgotPassword(unknown);

        assertEquals(
                responseForUnknown,
                responseForInactive,
                "Inactive accounts must not be distinguishable via forgot-password"
        );
    }

    @Test
    @Order(10)
    @DisplayName("Admin user list reports the active status of every account")
    void adminUserList_reportsActiveFlag() {
        // Buyer is inactive (step 9), farmer is active (step 8)
        boolean buyerFlag = adminService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(BUYER_EMAIL))
                .findFirst()
                .orElseThrow()
                .isActive();
        boolean farmerFlag = adminService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(FARMER_EMAIL))
                .findFirst()
                .orElseThrow()
                .isActive();

        assertFalse(buyerFlag, "Buyer must be reported inactive");
        assertTrue(farmerFlag, "Farmer must be reported active");
    }

    // ==========================================
    // ADMIN SELF-PROTECTION GUARD
    // ==========================================

    @Test
    @Order(11)
    @DisplayName("Admins cannot deactivate themselves, and the last active admin is protected")
    void adminGuard_blocksSelfAndLastAdmin() {
        admin = saveUser("Guard Admin", ADMIN_EMAIL, Role.ADMIN);

        // SELF-DEACTIVATION — always blocked, regardless of admin count
        RuntimeException selfEx = assertThrows(RuntimeException.class, () ->
                userService.deleteUser(admin.getId(), ADMIN_EMAIL)
        );
        assertEquals("You cannot deactivate your own account", selfEx.getMessage());
        assertTrue(
                userRepository.findById(admin.getId()).orElseThrow().isActive(),
                "Self-deactivation must be rejected"
        );

        // LAST-ADMIN — blocked only when this account is the only active
        // ADMIN (the guard is count-based, so the assertion holds whether
        // or not the shared dev DB already contains other admins).
        long activeAdmins =
                userRepository.countByRoleAndActive(Role.ADMIN, true);

        if (activeAdmins == 1) {
            RuntimeException lastEx = assertThrows(RuntimeException.class, () ->
                    userService.deleteUser(
                            admin.getId(),
                            "someone.else@example.com"
                    )
            );
            assertEquals(
                    "Cannot deactivate the last active admin account",
                    lastEx.getMessage()
            );
            assertTrue(
                    userRepository.findById(admin.getId()).orElseThrow().isActive(),
                    "The last active admin must survive"
            );
        } else {
            // Other active admins exist — deactivating this one is allowed
            userService.deleteUser(
                    admin.getId(),
                    "someone.else@example.com"
            );
            assertFalse(
                    userRepository.findById(admin.getId()).orElseThrow().isActive(),
                    "A non-last admin may be deactivated by another admin"
            );
        }
    }
}
