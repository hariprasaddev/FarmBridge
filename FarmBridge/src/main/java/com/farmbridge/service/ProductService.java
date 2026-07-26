package com.farmbridge.service;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.User;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductService(
            ProductRepository productRepository,
            UserRepository userRepository) {

        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    public ProductResponse createProduct(
            ProductRequest request,
            String email) {

        // Find logged-in farmer using email
        User farmer = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Create Product entity
        Product product = new Product();

        product.setName(
                request.getName()
        );

        product.setDescription(
                request.getDescription()
        );

        product.setPrice(
                request.getPrice()
        );

        product.setQuantity(
                request.getQuantity()
        );

        product.setCategory(
                request.getCategory()
        );

        // Connect product with logged-in farmer
        product.setFarmer(farmer);

        // Save product to database
        Product savedProduct =
                productRepository.save(product);

        // Return response
        return new ProductResponse(
                savedProduct.getId(),
                savedProduct.getName(),
                savedProduct.getDescription(),
                savedProduct.getPrice(),
                savedProduct.getQuantity(),
                savedProduct.getCategory(),
                farmer.getName()
        );
    }


    // ==========================================
    // SEARCH PRODUCTS BY NAME
    // ==========================================

    public List<ProductResponse> searchProducts(
            String name) {

        List<Product> products =
                productRepository
                        .findByNameContainingIgnoreCase(name);

        return products.stream()
                .map(product ->
                        new ProductResponse(
                                product.getId(),
                                product.getName(),
                                product.getDescription(),
                                product.getPrice(),
                                product.getQuantity(),
                                product.getCategory(),
                                product.getFarmer().getName()
                        )
                )
                .toList();
    }


    // ==========================================
    // GET PRODUCTS BY CATEGORY
    // ==========================================

    public List<ProductResponse> getProductsByCategory(
            String category) {

        List<Product> products =
                productRepository
                        .findByCategoryIgnoreCase(category);

        return products.stream()
                .map(product ->
                        new ProductResponse(
                                product.getId(),
                                product.getName(),
                                product.getDescription(),
                                product.getPrice(),
                                product.getQuantity(),
                                product.getCategory(),
                                product.getFarmer().getName()
                        )
                )
                .toList();
    }
}