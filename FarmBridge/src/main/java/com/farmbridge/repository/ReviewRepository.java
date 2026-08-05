package com.farmbridge.repository;

import com.farmbridge.dto.RatingStats;
import com.farmbridge.dto.ReviewMetric;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.entity.Review;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    // Reviews of a product, newest first
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    // A buyer's review of a product (used for the one-review-per-buyer rule)
    Optional<Review> findByBuyerEmailAndProductId(
            String email,
            Long productId
    );

    // Fast duplicate check before creating a review
    boolean existsByBuyerEmailAndProductId(
            String email,
            Long productId
    );

    // All reviews for every product owned by a farmer
    List<Review> findByProductFarmerEmail(String email);

    // Single grouped query returning rating stats for many products at once.
    // Computes the average rating, total count, and the 1-5 star distribution
    // in one pass — avoiding one SQL query per product (N+1).
    @Query("""
            SELECT r.product.id AS productId,
                   AVG(r.rating) AS averageRating,
                   COUNT(r)      AS reviewCount,
                   SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS fiveStarCount,
                   SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS fourStarCount,
                   SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS threeStarCount,
                   SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS twoStarCount,
                   SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS oneStarCount
            FROM Review r
            WHERE r.product.id IN :productIds
            GROUP BY r.product.id
            """)
    List<RatingStats> findRatingStatsForProducts(
            @Param("productIds") Collection<Long> productIds
    );

    // ==========================================
    // ANALYTICS — REVIEW AGGREGATIONS
    // ==========================================

    long countByBuyerEmail(String email);

    long countByProductFarmerEmail(String email);

    // Average rating of a farmer's products (farmer dashboard card)
    @Query("""
            SELECT COALESCE(AVG(r.rating), 0)
            FROM Review r
            WHERE r.product.farmer.email = :email
            """)
    double averageRatingForFarmer(@Param("email") String email);

    // Average rating per month over a farmer's products (rating-trend chart)
    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(r.createdAt), MONTH(r.createdAt),
                   AVG(r.rating), COUNT(r))
            FROM Review r
            WHERE r.product.farmer.email = :email
              AND r.createdAt IS NOT NULL
            GROUP BY YEAR(r.createdAt), MONTH(r.createdAt)
            """)
    List<MonthlyMetric> findFarmerRatingTrend(
            @Param("email") String email
    );

    // A farmer's latest reviews, with product and buyer names joined
    @Query("""
            SELECT NEW com.farmbridge.dto.ReviewMetric(
                   r.id, r.product.name, r.buyer.name,
                   r.rating, r.comment, r.createdAt)
            FROM Review r
            WHERE r.product.farmer.email = :email
            ORDER BY r.createdAt DESC
            """)
    List<ReviewMetric> findFarmerRecentReviews(
            @Param("email") String email,
            Pageable pageable
    );

    // Platform-wide latest reviews (admin dashboard table)
    @Query("""
            SELECT NEW com.farmbridge.dto.ReviewMetric(
                   r.id, r.product.name, r.buyer.name,
                   r.rating, r.comment, r.createdAt)
            FROM Review r
            ORDER BY r.createdAt DESC
            """)
    List<ReviewMetric> findLatestReviews(Pageable pageable);
}
