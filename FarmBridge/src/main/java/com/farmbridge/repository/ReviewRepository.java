package com.farmbridge.repository;

import com.farmbridge.dto.RatingStats;
import com.farmbridge.entity.Review;

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
}
