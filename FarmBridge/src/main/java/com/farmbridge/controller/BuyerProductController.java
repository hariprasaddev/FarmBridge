package com.farmbridge.controller;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer/products")
public class BuyerProductController {

    private final ProductService productService;

    public BuyerProductController(ProductService productService) {
        this.productService = productService;
    }

    // ==========================================
    // GET ALL PRODUCTS (BUYER BROWSE)
    // ==========================================

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        List<ProductResponse> response =
                productService.getAllProducts();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET PRODUCT BY ID (PRODUCT DETAILS)
    // ==========================================

    @GetMapping("/{id}")
    @Operation(
            summary = "Get a product by ID",
            description = "Buyer fetches full details of a single product, including the seller's farm information."
    )
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {

        ProductResponse response =
                productService.getProductById(id);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET PRODUCTS BY CATEGORY (RELATED PRODUCTS)
    // ==========================================

    @GetMapping("/category/{category}")
    @Operation(
            summary = "Get products by category",
            description = "Buyer fetches all products in a category (case-insensitive), useful for related products."
    )
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(
            @PathVariable String category) {

        List<ProductResponse> response =
                productService.getProductsByCategory(category);

        return ResponseEntity.ok(response);
    }
}