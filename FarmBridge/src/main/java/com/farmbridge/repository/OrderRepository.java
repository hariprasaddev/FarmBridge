package com.farmbridge.repository;

import com.farmbridge.dto.CategoryMetric;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.dto.OrderMetric;
import com.farmbridge.dto.ProductMetric;
import com.farmbridge.dto.StatusMetric;
import com.farmbridge.dto.UserMetric;
import com.farmbridge.entity.Order;
import com.farmbridge.entity.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository
        extends JpaRepository<Order, Long> {

    // Get all orders placed by a buyer
    List<Order> findByBuyerEmail(String email);

    // Get all orders received by a farmer
    List<Order> findByFarmerEmail(String email);

    // Get orders by status
    List<Order> findByStatus(OrderStatus status);

    // Get orders of a farmer by status
    List<Order> findByFarmerEmailAndStatus(
            String email,
            OrderStatus status
    );

    // Count orders of a farmer by status (farmer dashboard cards)
    long countByFarmerEmailAndStatus(
            String email,
            OrderStatus status
    );

    // Total orders placed by a buyer (buyer dashboard card)
    long countByBuyerEmail(String email);

    // Does this buyer have a fulfilled order for this product?
    // Buyers may review a product once an order for it reaches
    // ACCEPTED or COMPLETED (not COMPLETED only).
    boolean existsByBuyerEmailAndProductIdAndStatusIn(
            String email,
            Long productId,
            List<OrderStatus> statuses
    );

    // ==========================================
    // ANALYTICS — PLATFORM-WIDE AGGREGATIONS
    // ==========================================

    // Revenue is defined as the value of COMPLETED orders (money actually
    // earned). PENDING / ACCEPTED orders are order value, not revenue.

    long countByStatus(OrderStatus status);

    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.status = com.farmbridge.entity.OrderStatus.COMPLETED
            """)
    double sumCompletedRevenue();

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.status = com.farmbridge.entity.OrderStatus.COMPLETED
              AND o.createdAt >= :from
            """)
    double sumCompletedRevenueSince(@Param("from") LocalDateTime from);

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   SUM(o.totalPrice), COUNT(o))
            FROM Order o
            WHERE o.status = com.farmbridge.entity.OrderStatus.COMPLETED
              AND o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findMonthlyRevenue();

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   COUNT(o), COUNT(o))
            FROM Order o
            WHERE o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findMonthlyOrderCounts();

    @Query("""
            SELECT NEW com.farmbridge.dto.StatusMetric(CAST(o.status AS string), COUNT(o))
            FROM Order o
            GROUP BY o.status
            """)
    List<StatusMetric> countByStatusGrouped();

    @Query("""
            SELECT NEW com.farmbridge.dto.CategoryMetric(
                   p.category, COUNT(o), SUM(o.quantity))
            FROM Order o JOIN o.product p
            GROUP BY p.category
            """)
    List<CategoryMetric> findTopSellingCategories();

    @Query("""
            SELECT NEW com.farmbridge.dto.UserMetric(
                   b.id, b.name, b.email, COUNT(o), SUM(o.totalPrice))
            FROM Order o JOIN o.buyer b
            GROUP BY b.id, b.name, b.email
            """)
    List<UserMetric> findTopBuyers();

    @Query("""
            SELECT NEW com.farmbridge.dto.UserMetric(
                   f.id, f.name, f.email, COUNT(o), SUM(o.totalPrice))
            FROM Order o JOIN o.farmer f
            GROUP BY f.id, f.name, f.email
            """)
    List<UserMetric> findTopFarmers();

    @Query("""
            SELECT NEW com.farmbridge.dto.ProductMetric(
                   p.id, p.name, p.category, SUM(o.quantity), SUM(o.totalPrice))
            FROM Order o JOIN o.product p
            GROUP BY p.id, p.name, p.category
            """)
    List<ProductMetric> findTopProducts();

    @Query("""
            SELECT NEW com.farmbridge.dto.OrderMetric(
                   o.id, p.name, b.name, f.name,
                   o.quantity, o.totalPrice, CAST(o.status AS string), o.createdAt)
            FROM Order o
            JOIN o.product p
            JOIN o.buyer b
            JOIN o.farmer f
            ORDER BY o.id DESC
            """)
    List<OrderMetric> findLatestOrders(Pageable pageable);

    // ==========================================
    // ANALYTICS — FARMER SCOPE
    // ==========================================

    long countByFarmerEmailAndCreatedAtGreaterThanEqual(
            String email,
            LocalDateTime from
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   SUM(o.totalPrice), COUNT(o))
            FROM Order o
            WHERE o.farmer.email = :email
              AND o.status = com.farmbridge.entity.OrderStatus.COMPLETED
              AND o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findFarmerMonthlyRevenue(
            @Param("email") String email
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   SUM(o.totalPrice), COUNT(o))
            FROM Order o
            WHERE o.farmer.email = :email
              AND o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findFarmerSalesPerMonth(
            @Param("email") String email
    );

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.farmer.email = :email
              AND o.status = com.farmbridge.entity.OrderStatus.COMPLETED
            """)
    double sumFarmerCompletedRevenue(@Param("email") String email);

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.farmer.email = :email
              AND o.status = com.farmbridge.entity.OrderStatus.COMPLETED
              AND o.createdAt >= :from
            """)
    double sumFarmerCompletedRevenueSince(
            @Param("email") String email,
            @Param("from") LocalDateTime from
    );

    @Query("""
            SELECT COUNT(DISTINCT o.buyer.id)
            FROM Order o
            WHERE o.farmer.email = :email
            """)
    long countFarmerDistinctCustomers(@Param("email") String email);

    @Query("""
            SELECT NEW com.farmbridge.dto.CategoryMetric(
                   p.category, COUNT(o), SUM(o.quantity))
            FROM Order o JOIN o.product p
            WHERE o.farmer.email = :email
            GROUP BY p.category
            """)
    List<CategoryMetric> findFarmerCategorySales(
            @Param("email") String email
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.ProductMetric(
                   p.id, p.name, p.category, SUM(o.quantity), SUM(o.totalPrice))
            FROM Order o JOIN o.product p
            WHERE o.farmer.email = :email
            GROUP BY p.id, p.name, p.category
            """)
    List<ProductMetric> findFarmerSalesPerProduct(
            @Param("email") String email
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.OrderMetric(
                   o.id, p.name, b.name, f.name,
                   o.quantity, o.totalPrice, CAST(o.status AS string), o.createdAt)
            FROM Order o
            JOIN o.product p
            JOIN o.buyer b
            JOIN o.farmer f
            WHERE o.farmer.email = :email
            ORDER BY o.id DESC
            """)
    List<OrderMetric> findFarmerRecentOrders(
            @Param("email") String email,
            Pageable pageable
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.UserMetric(
                   b.id, b.name, b.email, COUNT(o), SUM(o.totalPrice))
            FROM Order o JOIN o.buyer b
            WHERE o.farmer.email = :email
            GROUP BY b.id, b.name, b.email
            """)
    List<UserMetric> findFarmerTopCustomers(
            @Param("email") String email
    );

    // ==========================================
    // ANALYTICS — BUYER SCOPE
    // ==========================================

    long countByBuyerEmailAndStatus(String email, OrderStatus status);

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.buyer.email = :email
              AND o.status = com.farmbridge.entity.OrderStatus.COMPLETED
            """)
    double sumBuyerCompletedSpend(@Param("email") String email);

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   SUM(o.totalPrice), COUNT(o))
            FROM Order o
            WHERE o.buyer.email = :email
              AND o.status = com.farmbridge.entity.OrderStatus.COMPLETED
              AND o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findBuyerMonthlySpending(
            @Param("email") String email
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.CategoryMetric(
                   p.category, COUNT(o), SUM(o.quantity))
            FROM Order o JOIN o.product p
            WHERE o.buyer.email = :email
            GROUP BY p.category
            """)
    List<CategoryMetric> findBuyerCategoryPurchases(
            @Param("email") String email
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(o.createdAt), MONTH(o.createdAt),
                   COUNT(o), COUNT(o))
            FROM Order o
            WHERE o.buyer.email = :email
              AND o.createdAt IS NOT NULL
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyMetric> findBuyerOrdersTimeline(
            @Param("email") String email
    );

    @Query("""
            SELECT COUNT(DISTINCT o.product.id)
            FROM Order o
            WHERE o.buyer.email = :email
            """)
    long countBuyerDistinctProducts(@Param("email") String email);

    @Query("""
            SELECT NEW com.farmbridge.dto.OrderMetric(
                   o.id, p.name, b.name, f.name,
                   o.quantity, o.totalPrice, CAST(o.status AS string), o.createdAt)
            FROM Order o
            JOIN o.product p
            JOIN o.buyer b
            JOIN o.farmer f
            WHERE o.buyer.email = :email
            ORDER BY o.id DESC
            """)
    List<OrderMetric> findBuyerRecentOrders(
            @Param("email") String email,
            Pageable pageable
    );

    @Query("""
            SELECT NEW com.farmbridge.dto.UserMetric(
                   f.id, f.name, f.email, COUNT(o), SUM(o.totalPrice))
            FROM Order o JOIN o.farmer f
            WHERE o.buyer.email = :email
            GROUP BY f.id, f.name, f.email
            """)
    List<UserMetric> findBuyerFavoriteFarmers(
            @Param("email") String email
    );

    // Distinct product ids a buyer has ordered (recommendation exclusion)
    @Query("""
            SELECT DISTINCT o.product.id
            FROM Order o
            WHERE o.buyer.email = :email
            """)
    List<Long> findBuyerProductIds(@Param("email") String email);
}
