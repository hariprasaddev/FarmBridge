package com.farmbridge.controller;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.entity.Product;
import com.farmbridge.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer/products")
public class BuyerProductController {

    private final ProductRepository productRepository;

    public BuyerProductController(
            ProductRepository productRepository) {

        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        List<Product> products =
                productRepository.findAll();

        List<ProductResponse> response =
                products.stream()
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

        return ResponseEntity.ok(response);
    }
}