package com.farmbridge.controller;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
    // GET ALL PRODUCTS (BUYER BROWSE — PAGINATED)
    // ==========================================

    @GetMapping
    @Operation(
            summary = "Get all products (paginated)",
            description = "Buyer browses products with server-side pagination, sorting and an "
                    + "optional category filter. Only products of APPROVED farmers are returned "
                    + "and totalElements reflects that filtered count. "
                    + "Query params: page (0-based), size, sort (e.g. name,asc | price,desc), category."
    )
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(value = "category", required = false) String category,
            @PageableDefault(size = 12, sort = "id") Pageable pageable) {

        Page<ProductResponse> response =
                productService.getAllProducts(category, pageable);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET BUYER-VISIBLE CATEGORIES (FILTER PILLS)
    // ==========================================

    @GetMapping("/categories")
    @Operation(
            summary = "Get product categories",
            description = "Distinct categories present in the buyer-visible catalog (products of "
                    + "APPROVED farmers only), sorted alphabetically. Used by the filter pills "
                    + "so the full catalog can stay paginated."
    )
    public ResponseEntity<List<String>> getCategories() {

        List<String> response =
                productService.getBuyerVisibleCategories();

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // SEARCH PRODUCTS BY NAME (BUYER VIEW)
    // ==========================================

    @GetMapping("/search")
    @Operation(
            summary = "Search products by name",
            description = "Buyer searches products by name (case-insensitive, partial match). "
                    + "Only products of APPROVED farmers are returned — the same "
                    + "visibility rule as the buyer product listing."
    )
    public ResponseEntity<List<ProductResponse>> searchProducts(
            @RequestParam("name") String name) {

        List<ProductResponse> response =
                productService.searchProductsByName(name);

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

        // Buyer-visible lookup — products of unapproved farmers are hidden
        ProductResponse response =
                productService.getBuyerProductById(id);

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