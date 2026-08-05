package com.farmbridge.controller;

import com.farmbridge.dto.AdminAnalyticsResponse;
import com.farmbridge.dto.BuyerAnalyticsResponse;
import com.farmbridge.dto.FarmerAnalyticsResponse;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.dto.ProductMetric;
import com.farmbridge.dto.UserMetric;
import com.farmbridge.service.AnalyticsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Business analytics APIs. Each dashboard fetches its full payload from
 * one endpoint; the dedicated series endpoints (revenue / orders / sales /
 * spending / top-*) support drill-down without extra dashboard calls.
 * Access is role-scoped by SecurityConfig path rules:
 * /api/admin/**  -> ADMIN, /api/farmer/** -> FARMER, /api/buyer/** -> BUYER.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Analytics", description = "Business analytics for admin, farmer and buyer dashboards — all values are computed server-side from real data")
@SecurityRequirement(name = "Bearer JWT")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // ==========================================
    // ADMIN ANALYTICS
    // ==========================================

    @GetMapping("/admin/analytics")
    @Operation(
            summary = "Admin analytics dashboard",
            description = "Full admin dashboard payload: user/farmer/buyer counts, verified & pending verifications, revenue, orders, monthly series, category/status breakdowns, top buyers/farmers/products, low stock and latest reviews."
    )
    public ResponseEntity<AdminAnalyticsResponse> getAdminAnalytics() {

        return ResponseEntity.ok(
                analyticsService.getAdminAnalytics()
        );
    }

    @GetMapping("/admin/analytics/revenue")
    @Operation(
            summary = "Revenue per month",
            description = "Monthly completed-order revenue series (year, month, value, count)."
    )
    public ResponseEntity<List<MonthlyMetric>> getAdminMonthlyRevenue() {

        return ResponseEntity.ok(
                analyticsService.getAdminMonthlyRevenue()
        );
    }

    @GetMapping("/admin/analytics/orders")
    @Operation(
            summary = "Orders per month",
            description = "Monthly order-count series (year, month, value, count)."
    )
    public ResponseEntity<List<MonthlyMetric>> getAdminMonthlyOrders() {

        return ResponseEntity.ok(
                analyticsService.getAdminMonthlyOrders()
        );
    }

    @GetMapping("/admin/top-products")
    @Operation(
            summary = "Top selling products",
            description = "Top products ranked by total ordered quantity."
    )
    public ResponseEntity<List<ProductMetric>> getTopProducts() {

        return ResponseEntity.ok(
                analyticsService.getTopProducts()
        );
    }

    @GetMapping("/admin/top-farmers")
    @Operation(
            summary = "Top farmers",
            description = "Top farmers ranked by total order value."
    )
    public ResponseEntity<List<UserMetric>> getTopFarmers() {

        return ResponseEntity.ok(
                analyticsService.getTopFarmers()
        );
    }

    @GetMapping("/admin/top-buyers")
    @Operation(
            summary = "Top buyers",
            description = "Top buyers ranked by total order value."
    )
    public ResponseEntity<List<UserMetric>> getTopBuyers() {

        return ResponseEntity.ok(
                analyticsService.getTopBuyers()
        );
    }

    // ==========================================
    // FARMER ANALYTICS
    // ==========================================

    @GetMapping("/farmer/analytics")
    @Operation(
            summary = "Farmer analytics dashboard",
            description = "Full farmer dashboard payload: order status counts, today's orders, revenue, rating, customers, sales charts and top customers."
    )
    public ResponseEntity<FarmerAnalyticsResponse> getFarmerAnalytics(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getFarmerAnalytics(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/farmer/analytics/sales")
    @Operation(
            summary = "Sales per product",
            description = "Sales of the logged-in farmer's products ranked by quantity (drill-down chart data)."
    )
    public ResponseEntity<List<ProductMetric>> getFarmerSales(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getFarmerSales(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // BUYER ANALYTICS
    // ==========================================

    @GetMapping("/buyer/analytics")
    @Operation(
            summary = "Buyer analytics dashboard",
            description = "Full buyer dashboard payload: order/wishlist/review counts, money spent, favourite category, spending charts, recommendations, latest orders and favourite farmers."
    )
    public ResponseEntity<BuyerAnalyticsResponse> getBuyerAnalytics(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getBuyerAnalytics(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/buyer/analytics/spending")
    @Operation(
            summary = "Monthly spending",
            description = "Monthly completed-order spending series of the logged-in buyer."
    )
    public ResponseEntity<List<MonthlyMetric>> getBuyerSpending(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getBuyerSpending(
                        authentication.getName()
                )
        );
    }
}
