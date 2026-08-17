package com.farmbridge.repository;

import com.farmbridge.dto.CategoryMetric;
import com.farmbridge.dto.LowStockProduct;
import com.farmbridge.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository
        extends JpaRepository<Product, Long> {
    // Search products by name
    List<Product> findByNameContainingIgnoreCase(String name);

    // ==========================================
    // BUYER-VISIBLE CATALOG (server-side pagination)
    // ==========================================

    // Paged catalog restricted to products of ACTIVE + APPROVED farmers —
    // the exact visibility rule of the buyer surfaces. The optional
    // category filter (case-insensitive) keeps the pills working on the
    // server, so totalElements always reflects the filtered count.
    @Query("""
            SELECT p FROM Product p
            JOIN p.farmer f
            JOIN FarmerProfile fp ON fp.user = f
            WHERE f.active = true
              AND fp.verificationStatus = com.farmbridge.entity.VerificationStatus.APPROVED
              AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
            """)
    Page<Product> findBuyerVisible(
            @Param("category") String category,
            Pageable pageable
    );

    // Distinct categories present in the buyer-visible catalog (drives the
    // category pills without loading every product).
    @Query("""
            SELECT DISTINCT p.category FROM Product p
            JOIN p.farmer f
            JOIN FarmerProfile fp ON fp.user = f
            WHERE f.active = true
              AND fp.verificationStatus = com.farmbridge.entity.VerificationStatus.APPROVED
            ORDER BY p.category
            """)
    List<String> findBuyerVisibleCategories();

    // Find products by category
    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByFarmerEmail(String email);

    long countByFarmerEmail(String email);

    // ==========================================
    // ANALYTICS — CATALOGUE AGGREGATIONS
    // ==========================================

    // Farmers currently selling (own at least one product)
    @Query("""
            SELECT COUNT(DISTINCT p.farmer.id)
            FROM Product p
            """)
    long countActiveFarmers();

    // Product counts per category (pie chart)
    @Query("""
            SELECT NEW com.farmbridge.dto.CategoryMetric(
                   p.category, COUNT(p), 0)
            FROM Product p
            GROUP BY p.category
            """)
    List<CategoryMetric> countProductsByCategory();

    // Products running low on stock (low-stock table)
    @Query("""
            SELECT NEW com.farmbridge.dto.LowStockProduct(
                   p.id, p.name, p.category, p.quantity, p.price, p.farmer.name)
            FROM Product p
            WHERE p.quantity <= :threshold
            ORDER BY p.quantity ASC
            """)
    List<LowStockProduct> findLowStockProducts(
            @Param("threshold") int threshold,
            Pageable pageable
    );

    // A farmer's own products running low on stock (farmer dashboard)
    @Query("""
            SELECT NEW com.farmbridge.dto.LowStockProduct(
                   p.id, p.name, p.category, p.quantity, p.price, p.farmer.name)
            FROM Product p
            WHERE p.farmer.email = :email
              AND p.quantity <= :threshold
            ORDER BY p.quantity ASC
            """)
    List<LowStockProduct> findFarmerLowStockProducts(
            @Param("email") String email,
            @Param("threshold") int threshold,
            Pageable pageable
    );
}
