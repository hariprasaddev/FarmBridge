package com.farmbridge.service;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.WishlistResponse;

import java.util.List;

public interface WishlistService {

    WishlistResponse addToWishlist(Long productId, String buyerEmail);

    void removeFromWishlist(Long productId, String buyerEmail);

    List<ProductResponse> getWishlist(String buyerEmail);

    boolean isWishlisted(Long productId, String buyerEmail);
}
