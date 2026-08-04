package com.farmbridge.controller;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.WishlistResponse;
import com.farmbridge.service.WishlistService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer/wishlist")
@Tag(name = "Wishlist", description = "APIs for buyers to save and manage products they are interested in")
@SecurityRequirement(name = "Bearer JWT")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    // ==========================================
    // BUYER - ADD PRODUCT TO WISHLIST
    // ==========================================

    @PostMapping("/{productId}")
    @Operation(
            summary = "Add a product to the wishlist",
            description = "Buyer saves a product to their wishlist. Duplicate entries return 409."
    )
    public ResponseEntity<WishlistResponse> addToWishlist(
            @PathVariable Long productId,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        WishlistResponse response =
                wishlistService.addToWishlist(
                        productId,
                        buyerEmail
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // BUYER - REMOVE PRODUCT FROM WISHLIST
    // ==========================================

    @DeleteMapping("/{productId}")
    @Operation(
            summary = "Remove a product from the wishlist",
            description = "Buyer removes a product from their wishlist. Idempotent — removing a product that is not wishlisted still succeeds."
    )
    public ResponseEntity<String> removeFromWishlist(
            @PathVariable Long productId,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        wishlistService.removeFromWishlist(
                productId,
                buyerEmail
        );

        return ResponseEntity.ok("Product removed from wishlist");
    }

    // ==========================================
    // BUYER - VIEW WISHLIST
    // ==========================================

    @GetMapping
    @Operation(
            summary = "Get my wishlist",
            description = "Fetch all products saved by the logged-in buyer, newest first."
    )
    public ResponseEntity<List<ProductResponse>> getWishlist(
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        List<ProductResponse> response =
                wishlistService.getWishlist(buyerEmail);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // BUYER - CHECK IF PRODUCT IS WISHLISTED
    // ==========================================

    @GetMapping("/check/{productId}")
    @Operation(
            summary = "Check if a product is wishlisted",
            description = "Returns true if the logged-in buyer has saved the product, false otherwise."
    )
    public ResponseEntity<Boolean> isWishlisted(
            @PathVariable Long productId,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        boolean wishlisted =
                wishlistService.isWishlisted(
                        productId,
                        buyerEmail
                );

        return ResponseEntity.ok(wishlisted);
    }
}
