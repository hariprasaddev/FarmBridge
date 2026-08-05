package com.farmbridge.service;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.WishlistResponse;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.User;
import com.farmbridge.entity.Wishlist;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.repository.WishlistRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public WishlistServiceImpl(
            WishlistRepository wishlistRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            ProductService productService) {

        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    // ==========================================
    // ADD PRODUCT TO WISHLIST
    // ==========================================

    @Override
    @Transactional
    public WishlistResponse addToWishlist(
            Long productId,
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

        // One wishlist entry per buyer per product
        if (wishlistRepository
                .existsByBuyerEmailAndProductId(
                        buyerEmail,
                        productId
                )) {

            throw new RuntimeException(
                    "Product already exists in your wishlist"
            );
        }

        // Create wishlist entry
        Wishlist wishlist = new Wishlist();

        wishlist.setBuyer(buyer);
        wishlist.setProduct(product);

        Wishlist savedWishlist;

        try {
            savedWishlist =
                    wishlistRepository.save(wishlist);
        } catch (DataIntegrityViolationException e) {
            // A concurrent duplicate slipped past the existsBy() check —
            // the unique (buyer_id, product_id) constraint caught it.
            throw new RuntimeException(
                    "Product already exists in your wishlist"
            );
        }

        return convertToResponse(savedWishlist);
    }

    // ==========================================
    // REMOVE PRODUCT FROM WISHLIST
    // ==========================================

    @Override
    @Transactional
    public void removeFromWishlist(
            Long productId,
            String buyerEmail) {

        // Idempotent delete — nothing happens if not wishlisted
        wishlistRepository.deleteByBuyerEmailAndProductId(
                buyerEmail,
                productId
        );
    }

    // ==========================================
    // GET BUYER'S WISHLIST (PRODUCTS)
    // ==========================================

    @Override
    public List<ProductResponse> getWishlist(String buyerEmail) {

        List<Wishlist> entries =
                wishlistRepository
                        .findByBuyerEmailOrderByCreatedAtDesc(buyerEmail);

        if (entries.isEmpty()) {
            return List.of();
        }

        List<Long> productIds = entries.stream()
                .map(entry -> entry.getProduct().getId())
                .toList();

        // Fetch every wishlisted product (with rating stats) in one call —
        // reuses the existing ProductResponse mapping, no N+1 queries.
        Map<Long, ProductResponse> productsById =
                productService.getProductsByIds(productIds)
                        .stream()
                        .collect(Collectors.toMap(
                                ProductResponse::getId,
                                Function.identity()
                        ));

        // Preserve the wishlist order (newest first). Products of farmers
        // who are no longer APPROVED are filtered out by getProductsByIds,
        // so skip any entry without a visible product instead of emitting
        // a null element.
        return entries.stream()
                .map(entry ->
                        productsById.get(entry.getProduct().getId())
                )
                .filter(Objects::nonNull)
                .toList();
    }

    // ==========================================
    // CHECK IF PRODUCT IS WISHLISTED
    // ==========================================

    @Override
    public boolean isWishlisted(Long productId, String buyerEmail) {

        return wishlistRepository
                .existsByBuyerEmailAndProductId(buyerEmail, productId);
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private WishlistResponse convertToResponse(Wishlist wishlist) {

        return new WishlistResponse(
                wishlist.getId(),
                wishlist.getProduct().getId(),
                wishlist.getProduct().getName(),
                wishlist.getBuyer().getName(),
                wishlist.getCreatedAt()
        );
    }
}
