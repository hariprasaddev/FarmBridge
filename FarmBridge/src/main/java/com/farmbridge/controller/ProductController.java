package com.farmbridge.controller;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/farmer/products")
@Tag(name = "Farmer Products", description = "APIs for farmers to manage their own products")
@SecurityRequirement(name = "Bearer JWT")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    @PostMapping
    @Operation(summary = "Create a new product", description = "Farmer creates a new product listing. The product is automatically associated with the logged-in farmer.")
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

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // GET MY PRODUCTS
    // ==========================================

    @GetMapping("/my-products")
    @Operation(summary = "Get my products", description = "Fetch all products belonging to the logged-in farmer.")
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
    @Operation(summary = "Update a product", description = "Farmer updates one of their own products. Only the owner can update.")
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
    // GET PRODUCT BY ID
    // ==========================================

    @GetMapping("/{id}")
    @Operation(summary = "Get a product by ID", description = "Fetch details of a specific product by its ID.")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {

        ProductResponse response =
                productService.getProductById(id);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // DELETE MY PRODUCT
    // ==========================================

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product", description = "Farmer deletes one of their own products. Only the owner can delete.")
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

    // ==========================================
    // UPLOAD PRODUCT IMAGE
    // ==========================================

    @PostMapping(
            value = "/{id}/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
            summary = "Upload a product image",
            description = "Farmer uploads or replaces the image of one of their own products. Only the owner can upload."
    )
    public ResponseEntity<ProductResponse> uploadProductImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String email = authentication.getName();

        // Upload the image
        ProductResponse response =
                productService.uploadProductImage(
                        id,
                        file,
                        email
                );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // DELETE PRODUCT IMAGE
    // ==========================================

    @DeleteMapping("/{id}/image")
    @Operation(
            summary = "Delete a product image",
            description = "Farmer removes the image of one of their own products. Only the owner can delete."
    )
    public ResponseEntity<ProductResponse> deleteProductImage(
            @PathVariable Long id,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String email = authentication.getName();

        // Delete the image
        ProductResponse response =
                productService.deleteProductImage(
                        id,
                        email
                );

        return ResponseEntity.ok(response);
    }
}
