package com.farmbridge.controller;

import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.service.OrderService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // ==========================================
    // BUYER - PLACE ORDER
    // ==========================================

    @PostMapping("/buyer/orders")
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        // Place order
        OrderResponse response =
                orderService.placeOrder(
                        request,
                        buyerEmail
                );

        return ResponseEntity.ok(response);
    }


    // ==========================================
    // BUYER - VIEW MY ORDERS
    // ==========================================

    @GetMapping("/buyer/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            Authentication authentication) {

        // Get logged-in buyer email from JWT
        String buyerEmail = authentication.getName();

        // Get buyer's orders
        List<OrderResponse> orders =
                orderService.getMyOrders(
                        buyerEmail
                );

        return ResponseEntity.ok(orders);
    }


    // ==========================================
    // FARMER - VIEW RECEIVED ORDERS
    // ==========================================

    @GetMapping("/farmer/orders")
    public ResponseEntity<List<OrderResponse>> getFarmerOrders(
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String farmerEmail = authentication.getName();

        // Get orders received by farmer
        List<OrderResponse> orders =
                orderService.getFarmerOrders(
                        farmerEmail
                );

        return ResponseEntity.ok(orders);
    }
    // ==========================================
// FARMER - UPDATE ORDER STATUS
// ==========================================

    @PutMapping("/farmer/orders/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusRequest request,
            Authentication authentication) {

        // Get logged-in farmer email from JWT
        String farmerEmail = authentication.getName();

        // Update order status
        OrderResponse response =
                orderService.updateOrderStatus(
                        orderId,
                        request,
                        farmerEmail
                );

        return ResponseEntity.ok(response);
    }
}