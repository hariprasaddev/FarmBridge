package com.farmbridge.dto;

/**
 * Projection returned by the aggregate rating queries in ReviewRepository.
 * It lets ProductServiceImpl populate the rating fields of ProductResponse
 * with a single grouped SQL query instead of one query per product (N+1).
 */
public interface RatingStats {

    Long getProductId();

    Double getAverageRating();

    Long getReviewCount();

    Long getFiveStarCount();

    Long getFourStarCount();

    Long getThreeStarCount();

    Long getTwoStarCount();

    Long getOneStarCount();
}
