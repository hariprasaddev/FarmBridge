package com.farmbridge;

import com.farmbridge.dto.BuyerAnalyticsResponse;
import com.farmbridge.dto.CategoryMetric;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.repository.WishlistRepository;
import com.farmbridge.service.AdminService;
import com.farmbridge.service.AnalyticsServiceImpl;
import com.farmbridge.service.ProductService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Deterministic unit tests for the buyer recommendation logic inside
 * AnalyticsServiceImpl — favourite-category preference, marketplace
 * fallback, purchased-product exclusion, in-stock-only filtering, rating
 * ordering and graceful empty cases. No database is required: every
 * repository and the ProductService are mocked, so the rules are verified
 * in isolation from whatever data the shared development MySQL holds.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private WishlistRepository wishlistRepository;
    @Mock private FarmerProfileRepository farmerProfileRepository;
    @Mock private AdminService adminService;
    @Mock private ProductService productService;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private static final String EMAIL = "unit.buyer@test.com";

    @BeforeEach
    void stubEmptyHistory() {
        // A buyer with no orders / reviews / wishlist by default;
        // individual tests override only the pieces they exercise.
        lenient().when(orderRepository.countByBuyerEmail(anyString()))
                .thenReturn(0L);
        lenient().when(orderRepository.countByBuyerEmailAndStatus(anyString(), any()))
                .thenReturn(0L);
        lenient().when(orderRepository.sumBuyerCompletedSpend(anyString()))
                .thenReturn(0.0);
        lenient().when(orderRepository.findBuyerMonthlySpending(anyString()))
                .thenReturn(List.of());
        lenient().when(orderRepository.findBuyerOrdersTimeline(anyString()))
                .thenReturn(List.of());
        lenient().when(orderRepository.findBuyerCategoryPurchases(anyString()))
                .thenReturn(List.of());
        lenient().when(orderRepository.findBuyerRecentOrders(anyString(), any()))
                .thenReturn(List.of());
        lenient().when(orderRepository.findBuyerFavoriteFarmers(anyString()))
                .thenReturn(List.of());
        lenient().when(orderRepository.findBuyerProductIds(anyString()))
                .thenReturn(List.of());
        lenient().when(wishlistRepository.countByBuyerEmail(anyString()))
                .thenReturn(0L);
        lenient().when(reviewRepository.countByBuyerEmail(anyString()))
                .thenReturn(0L);
    }

    private BuyerAnalyticsResponse load() {
        return analyticsService.getBuyerAnalytics(EMAIL);
    }

    private List<Long> recommendedIds(BuyerAnalyticsResponse response) {
        return response.getRecommendedProducts().stream()
                .map(ProductResponse::getId)
                .toList();
    }

    // id, category, rating (null allowed), stock, verified farmer
    private ProductResponse product(
            Long id, String category, Double rating, int quantity) {

        return new ProductResponse(
                id, "Product " + id, "Unit test product", 10.0, quantity,
                category, "Farmer Name", null, "Farm Name", "Location",
                Boolean.TRUE, rating, 1L, 1L, 0L, 0L, 0L, 0L
        );
    }

    // ==========================================
    // FAVOURITE CATEGORY PREFERENCE + FALLBACK
    // ==========================================

    @Test
    @DisplayName("Favourite-category products rank first, then the rest of the marketplace")
    void favouriteCategoryProductsComeFirst() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(3L, "Grains", 4.5, 10),
                product(5L, "Grains", 4.0, 10),
                product(7L, "Grains", 2.0, 10),
                product(9L, "Vegetables", 5.0, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 4, 9)));

        BuyerAnalyticsResponse response = load();

        assertEquals("Grains", response.getFavoriteCategory());
        assertEquals(
                List.of(3L, 5L, 7L, 9L),
                recommendedIds(response),
                "All favourite-category products first (rating desc), then the fallback"
        );
    }

    @Test
    @DisplayName("Falls back to the marketplace when the favourite category has too few products")
    void insufficientFavouriteCategoryFallsBackToMarketplace() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.0, 10),
                product(2L, "Vegetables", 5.0, 10),
                product(6L, "Vegetables", 4.9, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 1, 2)));

        BuyerAnalyticsResponse response = load();

        assertEquals(
                List.of(1L, 2L, 6L),
                recommendedIds(response),
                "The single Grains product first, then the marketplace top-rated rest"
        );
    }

    @Test
    @DisplayName("No favourite category (no orders) recommends the top-rated marketplace")
    void noOrdersRecommendsTopRatedMarketplace() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.0, 10),
                product(2L, "Grains", null, 10),
                product(3L, "Vegetables", 5.0, 10)
        ));
        // findBuyerCategoryPurchases stays empty → favouriteCategory null

        BuyerAnalyticsResponse response = load();

        assertNull(response.getFavoriteCategory());
        assertEquals(
                List.of(3L, 1L, 2L),
                recommendedIds(response),
                "Rating descending, unrated products last"
        );
    }

    @Test
    @DisplayName("Equal ratings break ties by newest product id")
    void equalRatingsBreakTieByNewestId() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(10L, "Grains", 4.0, 10),
                product(2L, "Grains", 4.0, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 2, 3)));

        assertEquals(List.of(10L, 2L), recommendedIds(load()));
    }

    @Test
    @DisplayName("Recommendations are capped at the configured limit")
    void recommendationsAreCapped() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 9.0, 10), product(2L, "Grains", 8.0, 10),
                product(3L, "Grains", 7.0, 10), product(4L, "Grains", 6.0, 10),
                product(5L, "Grains", 5.0, 10), product(6L, "Grains", 4.0, 10),
                product(7L, "Grains", 3.0, 10), product(8L, "Grains", 2.0, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 8, 20)));

        assertEquals(6, recommendedIds(load()).size());
    }

    // ==========================================
    // EXCLUSIONS
    // ==========================================

    @Test
    @DisplayName("Products the buyer already ordered never appear")
    void purchasedProductsAreExcluded() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.5, 10),
                product(2L, "Grains", 4.0, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 1, 1)));
        when(orderRepository.findBuyerProductIds(EMAIL))
                .thenReturn(List.of(1L));

        assertEquals(
                List.of(2L),
                recommendedIds(load()),
                "Only the not-yet-ordered product may be recommended"
        );
    }

    @Test
    @DisplayName("Out-of-stock products (quantity <= 0) are never recommended")
    void outOfStockProductsAreExcluded() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 5.0, 0),
                product(2L, "Grains", 4.0, 5)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 2, 4)));

        assertEquals(
                List.of(2L),
                recommendedIds(load()),
                "The 5.0-rated but out-of-stock product must not be recommended"
        );
    }

    @Test
    @DisplayName("Recommendations trust the single buyer-visible pool — no second visibility rule")
    void delegatesToBuyerVisiblePoolWithoutSecondFilter() {
        // The pool is the source of truth: ProductService already filters
        // out unapproved/deactivated farmers. The service must surface the
        // pool exactly as given (even a hypothetical leaky row) instead of
        // re-implementing a conflicting visibility rule. The real-world
        // guarantee is locked in by the integration test that seeds a
        // PENDING farmer's product.
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.0, 10),
                product(2L, "Vegetables", 3.5, 10)
        ));

        BuyerAnalyticsResponse response = load();

        assertEquals(
                List.of(1L, 2L),
                recommendedIds(response),
                "Both pool rows surface exactly as ProductService returned them"
        );

        // The recommendations must come from the single buyer-visible pool —
        // never from a second, unverified source (no N+1, one source of truth).
        verify(productService, times(1)).getAllProducts();
    }

    @Test
    @DisplayName("Favourite-category matching is case-insensitive")
    void favouriteCategoryMatchIsCaseInsensitive() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.0, 10),
                product(2L, "grains", 3.0, 10),
                product(3L, "Vegetables", 5.0, 10)
        ));
        // Favorite category comes from a GROUP BY of stored values; a
        // lowercase "grains" must still prefer the "Grains" products.
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("grains", 2, 3)));

        assertEquals(
                List.of(1L, 2L, 3L),
                recommendedIds(load()),
                "Case differences must not break the favourite-category preference"
        );
    }

    // ==========================================
    // EMPTY / EDGE CASES
    // ==========================================

    @Test
    @DisplayName("Empty marketplace returns no recommendations without crashing")
    void emptyMarketplaceReturnsEmpty() {
        when(productService.getAllProducts()).thenReturn(List.of());

        BuyerAnalyticsResponse response = load();

        assertEquals(0, response.getOrders());
        assertEquals(0.0, response.getMoneySpent(), 0.001);
        assertTrue(response.getRecommendedProducts().isEmpty());
    }

    @Test
    @DisplayName("Buyer who purchased every eligible product gets no recommendations")
    void allProductsPurchasedReturnsEmpty() {
        when(productService.getAllProducts()).thenReturn(List.of(
                product(1L, "Grains", 4.5, 10),
                product(2L, "Grains", 4.0, 10)
        ));
        when(orderRepository.findBuyerCategoryPurchases(EMAIL))
                .thenReturn(List.of(new CategoryMetric("Grains", 2, 3)));
        when(orderRepository.findBuyerProductIds(EMAIL))
                .thenReturn(List.of(1L, 2L));

        BuyerAnalyticsResponse response = load();

        assertTrue(response.getRecommendedProducts().isEmpty());
    }
}
