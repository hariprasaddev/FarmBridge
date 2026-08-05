package com.farmbridge.service;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
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

    List<ProductResponse> getMyProducts(String email);

    List<ProductResponse> getProductsByCategory(String category);

    List<ProductResponse> searchProductsByName(String name);

    List<ProductResponse> getProductsByIds(Collection<Long> ids);

    ProductResponse uploadProductImage(
            Long id, MultipartFile file, String email);

    ProductResponse deleteProductImage(Long id, String email);
}