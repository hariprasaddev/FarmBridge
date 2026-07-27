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

    // ==========================================
// GET PRODUCTS OF LOGGED-IN FARMER
// ==========================================

    public List<ProductResponse> getMyProducts(String email) {

        List<Product> products =
                productRepository.findByFarmerEmail(email);

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
    // ==========================================
// UPDATE MY PRODUCT
// ==========================================

    public ProductResponse updateProduct(
            Long id,
            ProductRequest request,
            String email) {

        // Find the product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check if this product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to update this product"
            );
        }

        // Update product details
        product.setName(request.getName());

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

        // Save updated product
        Product updatedProduct =
                productRepository.save(product);

        // Return response
        return new ProductResponse(
                updatedProduct.getId(),
                updatedProduct.getName(),
                updatedProduct.getDescription(),
                updatedProduct.getPrice(),
                updatedProduct.getQuantity(),
                updatedProduct.getCategory(),
                updatedProduct.getFarmer().getName()
        );
    }
    // ==========================================
// DELETE MY PRODUCT
// ==========================================

    public void deleteProduct(
            Long id,
            String email) {

        // Find product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to delete this product"
            );
        }

        // Delete product
        productRepository.delete(product);
    }
}