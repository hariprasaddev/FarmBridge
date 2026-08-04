package com.farmbridge.controller;

import com.farmbridge.dto.ReviewRequest;
import com.farmbridge.dto.ReviewResponse;
import com.farmbridge.service.ReviewService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Reviews", description = "APIs for buyers to review purchased products and farmers to view reviews of their own products")
@SecurityRequirement(name = "Bearer JWT")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // ==========================================
    // BUYER - SUBMIT REVIEW
    // ==========================================

    @PostMapping("/buyer/products/{productId}/reviews")
    @Operation(
            summary = "Submit a review",
            description = "Buyer reviews a product they have purchased (order status ACCEPTED or COMPLETED). One review per buyer per product."
    )
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        ReviewResponse response =
                reviewService.createReview(
                        productId,
                        request,
                        buyerEmail
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // BUYER - VIEW REVIEWS OF A PRODUCT
    // ==========================================

    @GetMapping("/buyer/products/{productId}/reviews")
    @Operation(
            summary = "Get reviews of a product",
            description = "Fetch all reviews for a product, newest first."
    )
    public ResponseEntity<List<ReviewResponse>> getReviewsForProduct(
            @PathVariable Long productId) {

        List<ReviewResponse> response =
                reviewService.getReviewsForProduct(productId);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // BUYER - VIEW MY REVIEW OF A PRODUCT
    // ==========================================

    @GetMapping("/buyer/products/{productId}/reviews/mine")
    @Operation(
            summary = "Get my review",
            description = "Fetch the logged-in buyer's own review of a product. Returns an empty body when the buyer has not reviewed it."
    )
    public ResponseEntity<ReviewResponse> getBuyerReview(
            @PathVariable Long productId,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        ReviewResponse response =
                reviewService.getBuyerReview(
                        productId,
                        buyerEmail
                );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // BUYER - UPDATE OWN REVIEW
    // ==========================================

    @PutMapping("/buyer/reviews/{reviewId}")
    @Operation(
            summary = "Update a review",
            description = "Buyer edits their own review. Only the author can update it."
    )
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        ReviewResponse response =
                reviewService.updateReview(
                        reviewId,
                        request,
                        buyerEmail
                );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // BUYER - DELETE OWN REVIEW
    // ==========================================

    @DeleteMapping("/buyer/reviews/{reviewId}")
    @Operation(
            summary = "Delete a review",
            description = "Buyer deletes their own review. Only the author can delete it."
    )
    public ResponseEntity<String> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        reviewService.deleteReview(reviewId, buyerEmail);

        return ResponseEntity.ok("Review deleted successfully");
    }

    // ==========================================
    // FARMER - VIEW REVIEWS OF OWN PRODUCT
    // ==========================================

    @GetMapping("/farmer/products/{productId}/reviews")
    @Operation(
            summary = "Get reviews of my product",
            description = "Farmer views all reviews for one of their own products. Only the product owner can view them."
    )
    public ResponseEntity<List<ReviewResponse>> getFarmerProductReviews(
            @PathVariable Long productId,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String farmerEmail = authentication.getName();

        List<ReviewResponse> response =
                reviewService.getFarmerProductReviews(
                        productId,
                        farmerEmail
                );

        return ResponseEntity.ok(response);
    }
}
