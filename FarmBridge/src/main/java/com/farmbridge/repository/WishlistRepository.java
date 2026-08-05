package com.farmbridge.repository;

import com.farmbridge.entity.Wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRepository
        extends JpaRepository<Wishlist, Long> {

    // Is this product already saved by this buyer?
    boolean existsByBuyerEmailAndProductId(
            String email,
            Long productId
    );

    // All wishlist entries of a buyer, newest first
    List<Wishlist> findByBuyerEmailOrderByCreatedAtDesc(String email);

    // Wishlist size of a buyer (buyer dashboard card)
    long countByBuyerEmail(String email);

    // Remove a saved product (returns the number of removed rows)
    long deleteByBuyerEmailAndProductId(
            String email,
            Long productId
    );
}
