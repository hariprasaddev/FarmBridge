package com.farmbridge.service;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request, String email);

    ProductResponse updateProduct(Long id, ProductRequest request, String email);

    void deleteProduct(Long id, String email);

    ProductResponse getProductById(Long id);

    // Buyer-visible product lookup — 404 when the seller is not APPROVED
    ProductResponse getBuyerProductById(Long id);

    List<ProductResponse> getAllProducts();

    // Paged buyer-visible catalog. The approval filter and optional
    // category filter run in the query itself, so totalElements is exact.
    // Kept separate from the no-arg getAllProducts() used by analytics
    // and recommendations (which need the whole buyer-visible set).
    Page<ProductResponse> getAllProducts(String category, Pageable pageable);

    // Distinct categories of the buyer-visible catalog (for filter pills).
    List<String> getBuyerVisibleCategories();

    // Admin oversight — every product, regardless of the seller's
    // verification status (buyer-visible lists stay filtered).
    List<ProductResponse> getAllProductsForAdmin();

    List<ProductResponse> getMyProducts(String email);

    List<ProductResponse> getProductsByCategory(String category);

    List<ProductResponse> searchProductsByName(String name);

    List<ProductResponse> getProductsByIds(Collection<Long> ids);

    ProductResponse uploadProductImage(
            Long id, MultipartFile file, String email);

    ProductResponse deleteProductImage(Long id, String email);
}