package com.farmbridge.repository;

import com.farmbridge.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository
        extends JpaRepository<Product, Long> {
    // Search products by name
    List<Product> findByNameContainingIgnoreCase(String name);

    // Find products by category
    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByFarmerEmail(String email);
}