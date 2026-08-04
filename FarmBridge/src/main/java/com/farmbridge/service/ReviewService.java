package com.farmbridge.service;

import com.farmbridge.dto.ReviewRequest;
import com.farmbridge.dto.ReviewResponse;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(
            Long productId,
            ReviewRequest request,
            String buyerEmail
    );

    ReviewResponse updateReview(
            Long reviewId,
            ReviewRequest request,
            String buyerEmail
    );

    void deleteReview(Long reviewId, String buyerEmail);

    List<ReviewResponse> getReviewsForProduct(Long productId);

    ReviewResponse getBuyerReview(Long productId, String buyerEmail);

    List<ReviewResponse> getFarmerProductReviews(
            Long productId,
            String farmerEmail
    );
}
