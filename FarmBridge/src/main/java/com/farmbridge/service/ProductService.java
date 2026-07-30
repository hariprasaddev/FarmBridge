package com.farmbridge.service;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request, String email);

    ProductResponse updateProduct(Long id, ProductRequest request, String email);

    void deleteProduct(Long id, String email);

    ProductResponse getProductById(Long id);

    List<ProductResponse> getAllProducts();

    List<ProductResponse> getMyProducts(String email);

    List<ProductResponse> getProductsByCategory(String category);

    List<ProductResponse> searchProductsByName(String name);
}