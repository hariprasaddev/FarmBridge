package com.farmbridge.service;

import com.farmbridge.dto.ReviewRequest;
import com.farmbridge.dto.ReviewResponse;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Review;
import com.farmbridge.entity.User;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    // A buyer is considered to have purchased a product once an
    // order for it reaches ACCEPTED or COMPLETED (not COMPLETED only).
    private static final List<OrderStatus> PURCHASED_STATUSES =
            List.of(OrderStatus.ACCEPTED, OrderStatus.COMPLETED);

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            UserRepository userRepository) {

        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE REVIEW
    // ==========================================

    @Override
    @Transactional
    public ReviewResponse createReview(
            Long productId,
            ReviewRequest request,
            String buyerEmail) {

        // Product must exist
        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Buyer must exist
        User buyer = userRepository
                .findByEmail(buyerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Buyer not found")
                );

        // Buyer must have actually purchased the product
        boolean purchased = orderRepository
                .existsByBuyerEmailAndProductIdAndStatusIn(
                        buyerEmail,
                        productId,
                        PURCHASED_STATUSES
                );

        if (!purchased) {
            throw new RuntimeException(
                    "You can only review products you have purchased"
            );
        }

        // One review per buyer per product
        if (reviewRepository
                .existsByBuyerEmailAndProductId(
                        buyerEmail,
                        productId
                )) {

            throw new RuntimeException(
                    "A review already exists for this product"
            );
        }

        // Create review
        Review review = new Review();

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setProduct(product);
        review.setBuyer(buyer);

        Review savedReview;

        try {
            savedReview =
                    reviewRepository.save(review);
        } catch (DataIntegrityViolationException e) {
            // A concurrent duplicate slipped past the existsBy() check —
            // the unique (buyer_id, product_id) constraint caught it.
            throw new RuntimeException(
                    "A review already exists for this product"
            );
        }

        return convertToResponse(savedReview);
    }

    // ==========================================
    // UPDATE OWN REVIEW
    // ==========================================

    @Override
    @Transactional
    public ReviewResponse updateReview(
            Long reviewId,
            ReviewRequest request,
            String buyerEmail) {

        Review review = reviewRepository
                .findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException("Review not found")
                );

        // Buyers can only edit their own review
        if (!review.getBuyer().getEmail().equals(buyerEmail)) {
            throw new RuntimeException(
                    "You are not allowed to update this review"
            );
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review updatedReview =
                reviewRepository.save(review);

        return convertToResponse(updatedReview);
    }

    // ==========================================
    // DELETE OWN REVIEW
    // ==========================================

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String buyerEmail) {

        Review review = reviewRepository
                .findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException("Review not found")
                );

        // Buyers can only delete their own review
        if (!review.getBuyer().getEmail().equals(buyerEmail)) {
            throw new RuntimeException(
                    "You are not allowed to delete this review"
            );
        }

        reviewRepository.delete(review);
    }

    // ==========================================
    // GET REVIEWS OF A PRODUCT (BUYER VIEW)
    // ==========================================

    @Override
    public List<ReviewResponse> getReviewsForProduct(
            Long productId) {

        // Product must exist
        productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        List<Review> reviews =
                reviewRepository
                        .findByProductIdOrderByCreatedAtDesc(productId);

        return reviews.stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // GET BUYER'S OWN REVIEW OF A PRODUCT
    // ==========================================

    @Override
    public ReviewResponse getBuyerReview(
            Long productId,
            String buyerEmail) {

        return reviewRepository
                .findByBuyerEmailAndProductId(
                        buyerEmail,
                        productId
                )
                .map(this::convertToResponse)
                .orElse(null);
    }

    // ==========================================
    // FARMER - VIEW REVIEWS OF THEIR OWN PRODUCT
    // ==========================================

    @Override
    public List<ReviewResponse> getFarmerProductReviews(
            Long productId,
            String farmerEmail) {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Farmers can only view reviews for their own products
        if (!product.getFarmer()
                .getEmail()
                .equals(farmerEmail)) {

            throw new RuntimeException(
                    "You are not allowed to view these reviews"
            );
        }

        List<Review> reviews =
                reviewRepository
                        .findByProductIdOrderByCreatedAtDesc(productId);

        return reviews.stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private ReviewResponse convertToResponse(Review review) {

        return new ReviewResponse(
                review.getId(),
                review.getProduct().getId(),
                review.getProduct().getName(),
                review.getBuyer().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
