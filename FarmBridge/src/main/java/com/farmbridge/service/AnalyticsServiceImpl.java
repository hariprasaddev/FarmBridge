package com.farmbridge.service;

import com.farmbridge.dto.AdminAnalyticsResponse;
import com.farmbridge.dto.BuyerAnalyticsResponse;
import com.farmbridge.dto.CategoryMetric;
import com.farmbridge.dto.FarmerAnalyticsResponse;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.dto.ProductMetric;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.UserMetric;
import com.farmbridge.dto.UserResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.repository.WishlistRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Aggregates real platform data into dashboard payloads. Every number a
 * card, chart or table shows is computed server-side from grouped JPQL
 * queries (COUNT / SUM / AVG / GROUP BY YEAR/MONTH) — no client-side
 * math and no per-row lazy loading.
 */
@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final int TOP_N = 5;
    private static final int ENDPOINT_N = 10;
    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int RECOMMENDED_N = 6;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final AdminService adminService;
    private final ProductService productService;

    public AnalyticsServiceImpl(
            OrderRepository orderRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            ReviewRepository reviewRepository,
            WishlistRepository wishlistRepository,
            FarmerProfileRepository farmerProfileRepository,
            AdminService adminService,
            ProductService productService) {

        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.adminService = adminService;
        this.productService = productService;
    }

    // ==========================================
    // ADMIN DASHBOARD
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics() {

        LocalDateTime monthStart =
                YearMonth.now().atDay(1).atStartOfDay();

        AdminAnalyticsResponse response =
                new AdminAnalyticsResponse();

        // ----- CARDS -----
        response.setTotalUsers(userRepository.count());
        response.setTotalFarmers(
                userRepository.countByRole(Role.FARMER)
        );
        response.setBuyers(
                userRepository.countByRole(Role.BUYER)
        );
        response.setVerifiedFarmers(
                farmerProfileRepository.countByVerificationStatus(
                        VerificationStatus.APPROVED
                )
        );
        response.setPendingVerifications(
                farmerProfileRepository.countByVerificationStatus(
                        VerificationStatus.PENDING
                )
        );
        response.setProducts(productRepository.count());
        response.setOrders(orderRepository.count());
        response.setMonthlyOrders(
                orderRepository.countByCreatedAtGreaterThanEqual(monthStart)
        );
        response.setPlatformRevenue(
                orderRepository.sumCompletedRevenue()
        );
        response.setMonthlyRevenue(
                orderRepository.sumCompletedRevenueSince(monthStart)
        );
        response.setCompletedOrders(
                orderRepository.countByStatus(OrderStatus.COMPLETED)
        );
        response.setCancelledOrders(
                orderRepository.countByStatus(OrderStatus.REJECTED)
        );
        response.setActiveFarmers(
                productRepository.countActiveFarmers()
        );

        // ----- CHARTS -----
        response.setRevenuePerMonth(
                sortMonthly(orderRepository.findMonthlyRevenue())
        );
        response.setOrdersPerMonth(
                sortMonthly(orderRepository.findMonthlyOrderCounts())
        );
        response.setFarmerRegistrations(
                sortMonthly(userRepository.findMonthlyFarmerRegistrations())
        );
        response.setProductCategories(
                productRepository.countProductsByCategory()
        );
        response.setOrderStatus(
                orderRepository.countByStatusGrouped()
        );
        response.setTopSellingCategories(
                sortCategoriesByQuantityDesc(
                        orderRepository.findTopSellingCategories()
                )
        );

        // ----- TABLES -----
        response.setLatestOrders(
                orderRepository.findLatestOrders(
                        PageRequest.of(0, TOP_N)
                )
        );
        response.setLatestFarmers(mapLatestFarmers());
        response.setPendingVerificationList(
                limit(adminService.getUnverifiedFarmers(), TOP_N)
        );
        response.setTopBuyers(
                limitByAmount(orderRepository.findTopBuyers(), TOP_N)
        );
        response.setTopFarmers(
                limitByAmount(orderRepository.findTopFarmers(), TOP_N)
        );
        response.setTopProducts(
                limitByQuantity(orderRepository.findTopProducts(), TOP_N)
        );
        response.setLowStockProducts(
                productRepository.findLowStockProducts(
                        LOW_STOCK_THRESHOLD,
                        PageRequest.of(0, TOP_N)
                )
        );
        response.setLatestReviews(
                reviewRepository.findLatestReviews(
                        PageRequest.of(0, TOP_N)
                )
        );

        return response;
    }

    @Override
    public List<MonthlyMetric> getAdminMonthlyRevenue() {
        return sortMonthly(orderRepository.findMonthlyRevenue());
    }

    @Override
    public List<MonthlyMetric> getAdminMonthlyOrders() {
        return sortMonthly(orderRepository.findMonthlyOrderCounts());
    }

    @Override
    public List<ProductMetric> getTopProducts() {
        return limitByQuantity(
                orderRepository.findTopProducts(),
                ENDPOINT_N
        );
    }

    @Override
    public List<UserMetric> getTopFarmers() {
        return limitByAmount(
                orderRepository.findTopFarmers(),
                ENDPOINT_N
        );
    }

    @Override
    public List<UserMetric> getTopBuyers() {
        return limitByAmount(
                orderRepository.findTopBuyers(),
                ENDPOINT_N
        );
    }

    // ==========================================
    // FARMER DASHBOARD
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public FarmerAnalyticsResponse getFarmerAnalytics(String email) {

        LocalDateTime todayStart =
                LocalDate.now().atStartOfDay();

        LocalDateTime monthStart =
                YearMonth.now().atDay(1).atStartOfDay();

        FarmerAnalyticsResponse response =
                new FarmerAnalyticsResponse();

        // ----- CARDS -----
        response.setTodayOrders(
                orderRepository.countByFarmerEmailAndCreatedAtGreaterThanEqual(
                        email, todayStart
                )
        );
        response.setPendingOrders(
                orderRepository.countByFarmerEmailAndStatus(
                        email, OrderStatus.PENDING
                )
        );
        response.setAcceptedOrders(
                orderRepository.countByFarmerEmailAndStatus(
                        email, OrderStatus.ACCEPTED
                )
        );
        response.setCompletedOrders(
                orderRepository.countByFarmerEmailAndStatus(
                        email, OrderStatus.COMPLETED
                )
        );
        response.setRejectedOrders(
                orderRepository.countByFarmerEmailAndStatus(
                        email, OrderStatus.REJECTED
                )
        );
        response.setMonthlyRevenue(
                orderRepository.sumFarmerCompletedRevenueSince(
                        email, monthStart
                )
        );
        response.setTotalRevenue(
                orderRepository.sumFarmerCompletedRevenue(email)
        );
        response.setProducts(
                productRepository.countByFarmerEmail(email)
        );
        response.setAverageRating(round1(
                reviewRepository.averageRatingForFarmer(email)
        ));
        response.setReviews(
                reviewRepository.countByProductFarmerEmail(email)
        );
        response.setCustomers(
                orderRepository.countFarmerDistinctCustomers(email)
        );

        // ----- CHARTS -----
        response.setRevenueTrend(
                sortMonthly(orderRepository.findFarmerMonthlyRevenue(email))
        );
        response.setOrdersTrend(
                sortMonthly(orderRepository.findFarmerSalesPerMonth(email))
        );
        response.setSalesPerMonth(
                sortMonthly(orderRepository.findFarmerSalesPerMonth(email))
        );
        response.setSalesPerProduct(
                sortProductsByQuantityDesc(
                        orderRepository.findFarmerSalesPerProduct(email)
                )
        );
        response.setRatingTrend(
                sortMonthly(reviewRepository.findFarmerRatingTrend(email))
        );
        response.setCategorySales(
                sortCategoriesByQuantityDesc(
                        orderRepository.findFarmerCategorySales(email)
                )
        );

        // ----- SECTIONS -----
        List<ProductMetric> sales = response.getSalesPerProduct();

        response.setBestSellingProduct(
                sales.isEmpty() ? null : sales.get(0)
        );
        response.setLowStockProducts(
                productRepository.findFarmerLowStockProducts(
                        email,
                        LOW_STOCK_THRESHOLD,
                        PageRequest.of(0, TOP_N)
                )
        );
        response.setRecentReviews(
                reviewRepository.findFarmerRecentReviews(
                        email, PageRequest.of(0, TOP_N)
                )
        );
        response.setRecentOrders(
                orderRepository.findFarmerRecentOrders(
                        email, PageRequest.of(0, TOP_N)
                )
        );
        response.setTopCustomers(
                limitByAmount(
                        orderRepository.findFarmerTopCustomers(email),
                        TOP_N
                )
        );

        return response;
    }

    @Override
    public List<ProductMetric> getFarmerSales(String email) {
        return sortProductsByQuantityDesc(
                orderRepository.findFarmerSalesPerProduct(email)
        );
    }

    // ==========================================
    // BUYER DASHBOARD
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public BuyerAnalyticsResponse getBuyerAnalytics(String email) {

        BuyerAnalyticsResponse response =
                new BuyerAnalyticsResponse();

        // ----- CARDS -----
        response.setOrders(
                orderRepository.countByBuyerEmail(email)
        );
        response.setWishlist(
                wishlistRepository.countByBuyerEmail(email)
        );
        response.setReviews(
                reviewRepository.countByBuyerEmail(email)
        );
        response.setMoneySpent(
                orderRepository.sumBuyerCompletedSpend(email)
        );
        response.setPurchasedProducts(
                orderRepository.countBuyerDistinctProducts(email)
        );
        response.setPendingOrders(
                orderRepository.countByBuyerEmailAndStatus(
                        email, OrderStatus.PENDING
                )
        );
        response.setCompletedOrders(
                orderRepository.countByBuyerEmailAndStatus(
                        email, OrderStatus.COMPLETED
                )
        );

        // ----- CHARTS -----
        response.setMonthlySpending(
                sortMonthly(
                        orderRepository.findBuyerMonthlySpending(email)
                )
        );
        response.setOrdersTimeline(
                sortMonthly(
                        orderRepository.findBuyerOrdersTimeline(email)
                )
        );

        List<CategoryMetric> categoryPurchases =
                sortCategoriesByQuantityDesc(
                        orderRepository.findBuyerCategoryPurchases(email)
                );

        response.setPurchasesByCategory(categoryPurchases);
        response.setFavoriteCategory(
                categoryPurchases.isEmpty()
                        ? null
                        : categoryPurchases.get(0).getCategory()
        );

        // ----- SECTIONS -----
        response.setRecommendedProducts(
                buildRecommendations(email, response.getFavoriteCategory())
        );
        response.setLatestOrders(
                orderRepository.findBuyerRecentOrders(
                        email, PageRequest.of(0, TOP_N)
                )
        );
        response.setFavoriteFarmers(
                limitByAmount(
                        orderRepository.findBuyerFavoriteFarmers(email),
                        TOP_N
                )
        );

        return response;
    }

    @Override
    public List<MonthlyMetric> getBuyerSpending(String email) {
        return sortMonthly(
                orderRepository.findBuyerMonthlySpending(email)
        );
    }

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Recommendations are real products — the buyer's most-purchased
     * category first, falling back to the whole marketplace, excluding
     * products they already ordered. Only APPROVED farmers appear
     * (ProductService already enforces that for buyer-visible lists).
     */
    private List<ProductResponse> buildRecommendations(
            String email,
            String favoriteCategory) {

        List<ProductResponse> pool;

        if (favoriteCategory != null && !favoriteCategory.isBlank()) {
            pool = productService.getProductsByCategory(favoriteCategory);
        } else {
            pool = productService.getAllProducts();
        }

        Set<Long> purchased =
                new HashSet<>(orderRepository.findBuyerProductIds(email));

        Comparator<ProductResponse> byRating = Comparator.comparing(
                ProductResponse::getAverageRating,
                Comparator.nullsLast(Comparator.reverseOrder())
        );

        return pool.stream()
                .filter(product -> !purchased.contains(product.getId()))
                .sorted(
                        byRating.thenComparing(
                                Comparator.comparing(
                                        ProductResponse::getId,
                                        Comparator.reverseOrder()
                                )
                        )
                )
                .limit(RECOMMENDED_N)
                .toList();
    }

    /**
     * Newest farmer accounts. On a fresh platform (zero farmers) the
     * batched profile lookup is skipped entirely — the same empty-guard
     * convention ProductServiceImpl uses for its IN-clause queries.
     */
    private List<UserResponse> mapLatestFarmers() {

        List<User> farmers =
                userRepository.findTop5ByRoleOrderByIdDesc(Role.FARMER);

        if (!farmers.isEmpty()) {
            // Batch-resolve profiles so the dashboard can enrich the
            // table with farm details — single query, no N+1.
            List<String> emails =
                    farmers.stream().map(User::getEmail).toList();

            Map<String, FarmerProfile> profiles =
                    farmerProfileRepository
                            .findByUserEmailIn(emails)
                            .stream()
                            .collect(Collectors.toMap(
                                    profile ->
                                            profile.getUser().getEmail(),
                                    Function.identity()
                            ));

            return farmers.stream()
                    .map(user -> new UserResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            "FARMER"
                    ))
                    .toList();
        }

        return List.of();
    }

    private List<MonthlyMetric> sortMonthly(
            List<MonthlyMetric> metrics) {

        return metrics.stream()
                .sorted(Comparator.comparingInt(
                        m -> m.getYear() * 100 + m.getMonth()
                ))
                .toList();
    }

    private List<CategoryMetric> sortCategoriesByQuantityDesc(
            List<CategoryMetric> metrics) {

        return metrics.stream()
                .sorted(Comparator.comparingDouble(
                        CategoryMetric::getQuantity
                ).reversed())
                .toList();
    }

    private List<ProductMetric> sortProductsByQuantityDesc(
            List<ProductMetric> metrics) {

        return metrics.stream()
                .sorted(Comparator.comparingDouble(
                        ProductMetric::getQuantity
                ).reversed())
                .toList();
    }

    private List<UserMetric> limitByAmount(
            List<UserMetric> metrics,
            int n) {

        return metrics.stream()
                .sorted(Comparator.comparingDouble(
                        UserMetric::getTotalAmount
                ).reversed())
                .limit(n)
                .toList();
    }

    private List<ProductMetric> limitByQuantity(
            List<ProductMetric> metrics,
            int n) {

        return metrics.stream()
                .sorted(Comparator.comparingDouble(
                        ProductMetric::getQuantity
                ).reversed())
                .limit(n)
                .toList();
    }

    private <T> List<T> limit(List<T> list, int n) {
        return list.stream().limit(n).toList();
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
