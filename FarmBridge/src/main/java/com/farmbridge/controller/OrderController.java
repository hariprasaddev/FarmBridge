package com.farmbridge.controller;

import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.service.OrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Orders", description = "APIs for buyers to place/view orders and farmers to manage received orders")
@SecurityRequirement(name = "Bearer JWT")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // ==========================================
    // BUYER - PLACE ORDER
    // ==========================================

    @PostMapping("/buyer/orders")
    @Operation(summary = "Place an order", description = "Buyer places an order for a product. Stock is validated and deducted automatically.")
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

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // BUYER - VIEW MY ORDERS
    // ==========================================

    @GetMapping("/buyer/orders")
    @Operation(summary = "Get my orders", description = "Fetch all orders placed by the logged-in buyer.")
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
    @Operation(summary = "Get received orders", description = "Fetch all orders received by the logged-in farmer (orders for their products).")
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
    @Operation(summary = "Update order status", description = "Farmer accepts, rejects, or completes an order. Follows a strict state machine (PENDING -> ACCEPTED/REJECTED, ACCEPTED -> COMPLETED).")
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
