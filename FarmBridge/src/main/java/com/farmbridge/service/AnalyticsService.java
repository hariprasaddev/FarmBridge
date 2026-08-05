package com.farmbridge.service;

import com.farmbridge.dto.AdminAnalyticsResponse;
import com.farmbridge.dto.BuyerAnalyticsResponse;
import com.farmbridge.dto.FarmerAnalyticsResponse;
import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.dto.ProductMetric;
import com.farmbridge.dto.UserMetric;

import java.util.List;

public interface AnalyticsService {

    // ============ ADMIN ============

    AdminAnalyticsResponse getAdminAnalytics();

    List<MonthlyMetric> getAdminMonthlyRevenue();

    List<MonthlyMetric> getAdminMonthlyOrders();

    List<ProductMetric> getTopProducts();

    List<UserMetric> getTopFarmers();

    List<UserMetric> getTopBuyers();

    // ============ FARMER ============

    FarmerAnalyticsResponse getFarmerAnalytics(String email);

    List<ProductMetric> getFarmerSales(String email);

    // ============ BUYER ============

    BuyerAnalyticsResponse getBuyerAnalytics(String email);

    List<MonthlyMetric> getBuyerSpending(String email);
}
