package com.farmbridge;

import com.farmbridge.dto.AdminAnalyticsResponse;
import com.farmbridge.dto.BuyerAnalyticsResponse;
import com.farmbridge.dto.CategoryMetric;
import com.farmbridge.dto.FarmerAnalyticsResponse;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.dto.ProductMetric;
import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ReviewRequest;
import com.farmbridge.dto.UserMetric;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.NotificationRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.service.AnalyticsService;
import com.farmbridge.service.OrderService;
import com.farmbridge.service.ProductService;
import com.farmbridge.service.ReviewService;

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
 * End-to-end analytics verification against real data: seeds an approved
 * farmer, two buyers and completed orders, then asserts every dashboard
 * payload is consistent with those seeded facts.
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AnalyticsFlowIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    private static final String FARMER_EMAIL = "analytics.farmer." + TS + "@example.com";
    private static final String BUYER1_EMAIL = "analytics.buyer1." + TS + "@example.com";
    private static final String BUYER2_EMAIL = "analytics.buyer2." + TS + "@example.com";
    private static final String PASSWORD = "AnalyticsPass123!";

    @Autowired private AnalyticsService analyticsService;
    @Autowired private ProductService productService;
    @Autowired private OrderService orderService;
    @Autowired private ReviewService reviewService;
    @Autowired private UserRepository userRepository;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TransactionTemplate transactionTemplate;

    private Long riceId;
    private Long wheatId;
    private Long order1Id;
    private Long order2Id;
    private Long order3Id;

    // Seeded facts used across assertions
    private static final double EXPECTED_REVENUE = 350.0; // 200 + 50 + 100 (all COMPLETED)
    private static final double EXPECTED_BUYER1_SPEND = 250.0; // 200 + 50
    private static final double EXPECTED_BUYER2_SPEND = 100.0; // 100

    @BeforeAll
    void seed() {
        User farmer = saveUser("Analytics Farmer", FARMER_EMAIL, Role.FARMER);
        User buyer1 = saveUser("Analytics Buyer One", BUYER1_EMAIL, Role.BUYER);
        User buyer2 = saveUser("Analytics Buyer Two", BUYER2_EMAIL, Role.BUYER);

        // Approved farmer profile
        FarmerProfile profile = new FarmerProfile();
        profile.setUser(farmer);
        profile.setFarmName("Analytics Farm");
        profile.setLocation("Hyderabad, Telangana");
        profile.setVerified(true);
        profile.setVerificationStatus(VerificationStatus.APPROVED);
        farmerProfileRepository.save(profile);

        // Two products (both Grains)
        riceId = productService.createProduct(
                productRequest("Analytics Rice", 100.0, 50),
                FARMER_EMAIL
        ).getId();
        // Low stock on purpose — 3 units left after the order below
        wheatId = productService.createProduct(
                productRequest("Analytics Wheat", 50.0, 3),
                FARMER_EMAIL
        ).getId();

        // Orders: buyer1 (2 orders), buyer2 (1 order) — all completed
        order1Id = placeAndComplete(buyer1, riceId, 2);  // 200
        order2Id = placeAndComplete(buyer1, wheatId, 1); // 50
        order3Id = placeAndComplete(buyer2, riceId, 1);  // 100

        // A review by buyer1 on the rice
        ReviewRequest reviewRequest = new ReviewRequest();
        reviewRequest.setRating(5);
        reviewRequest.setComment("Excellent rice quality");
        reviewService.createReview(riceId, reviewRequest, BUYER1_EMAIL);
    }

    @AfterAll
    void cleanup() {
        // All removals run inside one transaction (FK order: reviews →
        // notifications → orders → products → profile → users).
        transactionTemplate.executeWithoutResult(status -> {
            reviewRepository.findByProductFarmerEmail(FARMER_EMAIL)
                    .forEach(reviewRepository::delete);
            notificationRepository.deleteByRecipientEmail(FARMER_EMAIL);
            notificationRepository.deleteByRecipientEmail(BUYER1_EMAIL);
            notificationRepository.deleteByRecipientEmail(BUYER2_EMAIL);
            orderRepository.deleteAll(
                    orderRepository.findByFarmerEmail(FARMER_EMAIL)
            );
            productRepository.deleteAll(
                    productRepository.findByFarmerEmail(FARMER_EMAIL)
            );
            farmerProfileRepository.findByUserEmail(FARMER_EMAIL)
                    .ifPresent(farmerProfileRepository::delete);
            userRepository.findByEmail(FARMER_EMAIL)
                    .ifPresent(userRepository::delete);
            userRepository.findByEmail(BUYER1_EMAIL)
                    .ifPresent(userRepository::delete);
            userRepository.findByEmail(BUYER2_EMAIL)
                    .ifPresent(userRepository::delete);
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

    private ProductRequest productRequest(String name, double price, int quantity) {
        ProductRequest request = new ProductRequest();
        request.setName(name);
        request.setDescription("Analytics test product");
        request.setPrice(price);
        request.setQuantity(quantity);
        request.setCategory("Grains");
        return request;
    }

    private Long placeAndComplete(User buyer, Long productId, int quantity) {
        OrderRequest request = new OrderRequest();
        request.setProductId(productId);
        request.setQuantity(quantity);

        Long orderId = orderService.placeOrder(request, buyer.getEmail()).getId();

        OrderStatusRequest accept = new OrderStatusRequest();
        accept.setStatus(OrderStatus.ACCEPTED);
        orderService.updateOrderStatus(orderId, accept, FARMER_EMAIL);

        OrderStatusRequest complete = new OrderStatusRequest();
        complete.setStatus(OrderStatus.COMPLETED);
        orderService.updateOrderStatus(orderId, complete, FARMER_EMAIL);

        return orderId;
    }

    // ==========================================
    // ADMIN ANALYTICS
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Admin analytics: cards, charts and tables are consistent with seeded data")
    void adminAnalytics_consistent() {
        AdminAnalyticsResponse response = analyticsService.getAdminAnalytics();

        // Cards — completed orders & revenue reflect the seeded orders
        assertTrue(response.getCompletedOrders() >= 3);
        assertTrue(response.getPlatformRevenue() >= EXPECTED_REVENUE);
        assertTrue(response.getMonthlyRevenue() >= EXPECTED_REVENUE);

        // Chart consistency: monthly revenue series totals match the card
        double revenueSeriesSum = response.getRevenuePerMonth().stream()
                .mapToDouble(MonthlyMetric::getValue).sum();
        assertTrue(revenueSeriesSum >= EXPECTED_REVENUE);
        assertTrue(revenueSeriesSum <= response.getPlatformRevenue() + 0.001);

        // Order-status buckets always sum to the total order count
        long statusSum = response.getOrderStatus().stream()
                .mapToLong(s -> s.getCount()).sum();
        assertEquals(response.getOrders(), statusSum);

        // Top selling categories include Grains (our seeded category)
        CategoryMetric grains = response.getTopSellingCategories().stream()
                .filter(c -> "Grains".equalsIgnoreCase(c.getCategory()))
                .findFirst().orElse(null);
        assertNotNull(grains, "Grains must appear in top selling categories");
        assertTrue(grains.getQuantity() >= 3.0);

        // Top-buyers / top-products rankings are sorted descending by the
        // driving metric (the shared DB contains legacy data, so we assert
        // ordering and non-emptiness rather than exact membership).
        assertFalse(response.getTopBuyers().isEmpty());
        assertSortedByAmountDesc(response.getTopBuyers());

        assertFalse(response.getTopFarmers().isEmpty());
        assertSortedByAmountDesc(response.getTopFarmers());

        assertFalse(response.getTopProducts().isEmpty());
        List<ProductMetric> topProducts = response.getTopProducts();
        for (int i = 1; i < topProducts.size(); i++) {
            assertTrue(
                    topProducts.get(i - 1).getQuantity() >= topProducts.get(i).getQuantity(),
                    "Top products must be sorted by quantity descending"
            );
        }

        // Low stock table surfaces the 3-unit wheat product
        assertTrue(response.getLowStockProducts().stream()
                .anyMatch(p -> p.getId().equals(wheatId)));

        // Latest reviews include the seeded review
        assertTrue(response.getLatestReviews().stream()
                .anyMatch(r -> "Excellent rice quality".equals(r.getComment())));

        // Latest orders include our order ids
        assertTrue(response.getLatestOrders().stream()
                .anyMatch(o -> o.getId().equals(order3Id)));
    }

    @Test
    @Order(2)
    @DisplayName("Admin series endpoints return the same monthly aggregates")
    void adminSeriesEndpoints_match() {
        double revenueSum = analyticsService.getAdminMonthlyRevenue().stream()
                .mapToDouble(MonthlyMetric::getValue).sum();
        assertTrue(revenueSum >= EXPECTED_REVENUE);

        long ordersSum = analyticsService.getAdminMonthlyOrders().stream()
                .mapToLong(MonthlyMetric::getCount).sum();
        assertTrue(ordersSum >= 3, "At least the three seeded orders in the monthly series");
    }

    // ==========================================
    // FARMER ANALYTICS
    // ==========================================

    @Test
    @Order(3)
    @DisplayName("Farmer analytics: order counts, revenue, rating and sales match seeded facts")
    void farmerAnalytics_consistent() {
        FarmerAnalyticsResponse response =
                analyticsService.getFarmerAnalytics(FARMER_EMAIL);

        // Cards
        assertEquals(2, response.getProducts());
        assertEquals(3, response.getCompletedOrders());
        assertEquals(0, response.getPendingOrders());
        assertEquals(0, response.getAcceptedOrders());
        assertEquals(0, response.getRejectedOrders());
        assertEquals(2, response.getCustomers());
        assertEquals(EXPECTED_REVENUE, response.getTotalRevenue(), 0.001);
        assertEquals(EXPECTED_REVENUE, response.getMonthlyRevenue(), 0.001);
        assertEquals(1, response.getReviews());
        assertEquals(5.0, response.getAverageRating(), 0.001);

        // Charts
        double revenueTrendSum = response.getRevenueTrend().stream()
                .mapToDouble(MonthlyMetric::getValue).sum();
        assertEquals(EXPECTED_REVENUE, revenueTrendSum, 0.001);

        assertEquals(2, response.getSalesPerProduct().size());
        assertEquals("Analytics Rice", response.getBestSellingProduct().getProductName());

        assertTrue(response.getCategorySales().stream()
                .anyMatch(c -> "Grains".equalsIgnoreCase(c.getCategory())
                        && c.getQuantity() >= 3.0));

        // Sections
        assertEquals(3, response.getRecentOrders().size());
        assertTrue(response.getLowStockProducts().stream()
                .anyMatch(p -> p.getId().equals(wheatId)));
        assertTrue(response.getTopCustomers().stream()
                .anyMatch(c -> BUYER1_EMAIL.equals(c.getEmail())
                        && c.getOrderCount() == 2));
    }

    @Test
    @Order(4)
    @DisplayName("Farmer sales endpoint totals the seeded order quantities")
    void farmerSalesEndpoint_matches() {
        double totalQty = analyticsService.getFarmerSales(FARMER_EMAIL).stream()
                .mapToDouble(ProductMetric::getQuantity).sum();
        assertEquals(4.0, totalQty, 0.001); // 2 + 1 + 1
    }

    // ==========================================
    // BUYER ANALYTICS
    // ==========================================

    @Test
    @Order(5)
    @DisplayName("Buyer analytics: buyer1's cards, charts, recommendations and farmers match")
    void buyerAnalytics_consistent() {
        BuyerAnalyticsResponse response =
                analyticsService.getBuyerAnalytics(BUYER1_EMAIL);

        // Cards
        assertEquals(2, response.getOrders());
        assertEquals(2, response.getCompletedOrders());
        assertEquals(0, response.getPendingOrders());
        assertEquals(EXPECTED_BUYER1_SPEND, response.getMoneySpent(), 0.001);
        assertEquals(2, response.getPurchasedProducts());
        assertEquals("Grains", response.getFavoriteCategory());

        // Charts
        double spendSum = response.getMonthlySpending().stream()
                .mapToDouble(MonthlyMetric::getValue).sum();
        assertEquals(EXPECTED_BUYER1_SPEND, spendSum, 0.001);

        assertTrue(response.getPurchasesByCategory().stream()
                .anyMatch(c -> "Grains".equalsIgnoreCase(c.getCategory())
                        && c.getQuantity() >= 3.0));

        // Sections
        assertEquals(2, response.getLatestOrders().size());

        assertTrue(response.getFavoriteFarmers().stream()
                .anyMatch(f -> FARMER_EMAIL.equals(f.getEmail())
                        && f.getOrderCount() == 2));

        // Recommendations — real APPROVED-farmer products only, and they
        // must not include products the buyer already ordered.
        assertFalse(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getRecommendedProducts().stream()
                .noneMatch(p -> p.getId().equals(riceId) || p.getId().equals(wheatId)));
        assertTrue(response.getRecommendedProducts().stream()
                .allMatch(p -> Boolean.TRUE.equals(p.getFarmerVerified())));
    }

    @Test
    @Order(6)
    @DisplayName("Buyer spending endpoint matches the buyer's completed spend")
    void buyerSpendingEndpoint_matches() {
        double spendSum = analyticsService.getBuyerSpending(BUYER1_EMAIL).stream()
                .mapToDouble(MonthlyMetric::getValue).sum();
        assertEquals(EXPECTED_BUYER1_SPEND, spendSum, 0.001);
    }

    @Test
    @Order(7)
    @DisplayName("Second buyer analytics reflect only their own orders")
    void buyer2Analytics_isolated() {
        BuyerAnalyticsResponse response =
                analyticsService.getBuyerAnalytics(BUYER2_EMAIL);

        assertEquals(1, response.getOrders());
        assertEquals(EXPECTED_BUYER2_SPEND, response.getMoneySpent(), 0.001);
        assertEquals(1, response.getPurchasedProducts());
        assertEquals("Grains", response.getFavoriteCategory());
    }

    // ==========================================
    // SCOPE ISOLATION
    // ==========================================

    @Test
    @Order(8)
    @DisplayName("Farmer and buyer analytics never leak data across scopes")
    void analytics_scopesAreIsolated() {
        // The farmer's orders must never appear in a buyer's timeline
        List<MonthlyMetric> buyerTimeline =
                analyticsService.getBuyerAnalytics(BUYER2_EMAIL).getOrdersTimeline();
        long buyer2Orders = buyerTimeline.stream()
                .mapToLong(MonthlyMetric::getCount).sum();
        assertEquals(1, buyer2Orders, "buyer2 timeline must only contain buyer2's own order");

        // A fresh buyer with no activity gets empty (not leaking) data
        User stranger = saveUser(
                "Stranger",
                "analytics.stranger." + TS + "@example.com",
                Role.BUYER
        );
        try {
            BuyerAnalyticsResponse response =
                    analyticsService.getBuyerAnalytics(stranger.getEmail());
            assertEquals(0, response.getOrders());
            assertEquals(0.0, response.getMoneySpent(), 0.001);
            assertTrue(response.getMonthlySpending().isEmpty());
        } finally {
            final User toDelete = stranger;
            transactionTemplate.executeWithoutResult(status ->
                    userRepository.delete(toDelete)
            );
        }
    }

    private void assertSortedByAmountDesc(List<UserMetric> metrics) {
        for (int i = 1; i < metrics.size(); i++) {
            assertTrue(
                    metrics.get(i - 1).getTotalAmount() >= metrics.get(i).getTotalAmount(),
                    "Ranking must be sorted by total amount descending"
            );
        }
    }
}
