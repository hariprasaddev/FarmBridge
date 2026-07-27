package com.farmbridge.controller;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmer/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request,
            Authentication authentication) {

        // Get logged-in farmer's email from JWT
        String email = authentication.getName();

        // Create product
        ProductResponse response =
                productService.createProduct(
                        request,
                        email
                );

        return ResponseEntity.ok(response);
    }

        @GetMapping("/my-products")
        public ResponseEntity<List<ProductResponse>> getMyProducts(
                Authentication authentication) {

            // Get logged-in farmer's email from JWT
            String email = authentication.getName();

            // Get products belonging to this farmer
            List<ProductResponse> products =
                    productService.getMyProducts(email);

            return ResponseEntity.ok(products);
        }
    // ==========================================
// UPDATE MY PRODUCT
// ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String email = authentication.getName();

        // Update product
        ProductResponse response =
                productService.updateProduct(
                        id,
                        request,
                        email
                );

        return ResponseEntity.ok(response);
    }
    // ==========================================
// DELETE MY PRODUCT
// ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable Long id,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String email = authentication.getName();

        // Delete product
        productService.deleteProduct(
                id,
                email
        );

        return ResponseEntity.ok(
                "Product deleted successfully"
        );
    }

    }

