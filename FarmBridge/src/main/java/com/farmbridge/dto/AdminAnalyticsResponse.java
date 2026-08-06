package com.farmbridge.dto;

import java.util.List;

/**
 * One-call payload for the admin analytics dashboard — all stat cards,
 * charts and tables are aggregated server-side in a handful of grouped
 * JPQL queries (no per-row lazy loading, no client-side math).
 */
public class AdminAnalyticsResponse {

    // ============ CARDS ============
    private long totalUsers;
    private long totalFarmers;
    private long verifiedFarmers;
    private long pendingVerifications;
    private long buyers;
    private long products;
    private long orders;
    private long monthlyOrders;
    private double platformRevenue;
    private double monthlyRevenue;
    private long completedOrders;
    private long cancelledOrders;
    // Farmers currently selling (own at least one product)
    private long sellingFarmers;

    // SOFT DELETE — account status breakdown
    private long activeUsers;
    private long inactiveUsers;
    private long activeFarmers;
    private long inactiveFarmers;

    // ============ CHARTS ============
    private List<MonthlyMetric> revenuePerMonth;
    private List<MonthlyMetric> ordersPerMonth;
    private List<MonthlyMetric> farmerRegistrations;
    private List<CategoryMetric> productCategories;
    private List<StatusMetric> orderStatus;
    private List<CategoryMetric> topSellingCategories;

    // ============ TABLES ============
    private List<OrderMetric> latestOrders;
    private List<UserResponse> latestFarmers;
    private List<FarmerVerificationResponse> pendingVerificationList;
    private List<UserMetric> topBuyers;
    private List<UserMetric> topFarmers;
    private List<ProductMetric> topProducts;
    private List<LowStockProduct> lowStockProducts;
    private List<ReviewMetric> latestReviews;

    public AdminAnalyticsResponse() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalFarmers() {
        return totalFarmers;
    }

    public void setTotalFarmers(long totalFarmers) {
        this.totalFarmers = totalFarmers;
    }

    public long getVerifiedFarmers() {
        return verifiedFarmers;
    }

    public void setVerifiedFarmers(long verifiedFarmers) {
        this.verifiedFarmers = verifiedFarmers;
    }

    public long getPendingVerifications() {
        return pendingVerifications;
    }

    public void setPendingVerifications(long pendingVerifications) {
        this.pendingVerifications = pendingVerifications;
    }

    public long getBuyers() {
        return buyers;
    }

    public void setBuyers(long buyers) {
        this.buyers = buyers;
    }

    public long getProducts() {
        return products;
    }

    public void setProducts(long products) {
        this.products = products;
    }

    public long getOrders() {
        return orders;
    }

    public void setOrders(long orders) {
        this.orders = orders;
    }

    public long getMonthlyOrders() {
        return monthlyOrders;
    }

    public void setMonthlyOrders(long monthlyOrders) {
        this.monthlyOrders = monthlyOrders;
    }

    public double getPlatformRevenue() {
        return platformRevenue;
    }

    public void setPlatformRevenue(double platformRevenue) {
        this.platformRevenue = platformRevenue;
    }

    public double getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(double monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public long getSellingFarmers() {
        return sellingFarmers;
    }

    public void setSellingFarmers(long sellingFarmers) {
        this.sellingFarmers = sellingFarmers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getInactiveUsers() {
        return inactiveUsers;
    }

    public void setInactiveUsers(long inactiveUsers) {
        this.inactiveUsers = inactiveUsers;
    }

    public long getActiveFarmers() {
        return activeFarmers;
    }

    public void setActiveFarmers(long activeFarmers) {
        this.activeFarmers = activeFarmers;
    }

    public long getInactiveFarmers() {
        return inactiveFarmers;
    }

    public void setInactiveFarmers(long inactiveFarmers) {
        this.inactiveFarmers = inactiveFarmers;
    }

    public List<MonthlyMetric> getRevenuePerMonth() {
        return revenuePerMonth;
    }

    public void setRevenuePerMonth(List<MonthlyMetric> revenuePerMonth) {
        this.revenuePerMonth = revenuePerMonth;
    }

    public List<MonthlyMetric> getOrdersPerMonth() {
        return ordersPerMonth;
    }

    public void setOrdersPerMonth(List<MonthlyMetric> ordersPerMonth) {
        this.ordersPerMonth = ordersPerMonth;
    }

    public List<MonthlyMetric> getFarmerRegistrations() {
        return farmerRegistrations;
    }

    public void setFarmerRegistrations(List<MonthlyMetric> farmerRegistrations) {
        this.farmerRegistrations = farmerRegistrations;
    }

    public List<CategoryMetric> getProductCategories() {
        return productCategories;
    }

    public void setProductCategories(List<CategoryMetric> productCategories) {
        this.productCategories = productCategories;
    }

    public List<StatusMetric> getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(List<StatusMetric> orderStatus) {
        this.orderStatus = orderStatus;
    }

    public List<CategoryMetric> getTopSellingCategories() {
        return topSellingCategories;
    }

    public void setTopSellingCategories(List<CategoryMetric> topSellingCategories) {
        this.topSellingCategories = topSellingCategories;
    }

    public List<OrderMetric> getLatestOrders() {
        return latestOrders;
    }

    public void setLatestOrders(List<OrderMetric> latestOrders) {
        this.latestOrders = latestOrders;
    }

    public List<UserResponse> getLatestFarmers() {
        return latestFarmers;
    }

    public void setLatestFarmers(List<UserResponse> latestFarmers) {
        this.latestFarmers = latestFarmers;
    }

    public List<FarmerVerificationResponse> getPendingVerificationList() {
        return pendingVerificationList;
    }

    public void setPendingVerificationList(List<FarmerVerificationResponse> pendingVerificationList) {
        this.pendingVerificationList = pendingVerificationList;
    }

    public List<UserMetric> getTopBuyers() {
        return topBuyers;
    }

    public void setTopBuyers(List<UserMetric> topBuyers) {
        this.topBuyers = topBuyers;
    }

    public List<UserMetric> getTopFarmers() {
        return topFarmers;
    }

    public void setTopFarmers(List<UserMetric> topFarmers) {
        this.topFarmers = topFarmers;
    }

    public List<ProductMetric> getTopProducts() {
        return topProducts;
    }

    public void setTopProducts(List<ProductMetric> topProducts) {
        this.topProducts = topProducts;
    }

    public List<LowStockProduct> getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(List<LowStockProduct> lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<ReviewMetric> getLatestReviews() {
        return latestReviews;
    }

    public void setLatestReviews(List<ReviewMetric> latestReviews) {
        this.latestReviews = latestReviews;
    }
}
