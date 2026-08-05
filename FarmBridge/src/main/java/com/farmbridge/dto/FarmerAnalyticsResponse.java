package com.farmbridge.dto;

import java.util.List;

/**
 * One-call payload for the farmer analytics dashboard. Every card,
 * chart and section is aggregated server-side from real order, product
 * and review data.
 */
public class FarmerAnalyticsResponse {

    // ============ CARDS ============
    private long todayOrders;
    private long pendingOrders;
    private long acceptedOrders;
    private long completedOrders;
    private long rejectedOrders;
    private double monthlyRevenue;
    private double totalRevenue;
    private long products;
    private double averageRating;
    private long reviews;
    private long customers;

    // ============ CHARTS ============
    private List<MonthlyMetric> revenueTrend;
    private List<MonthlyMetric> ordersTrend;
    private List<ProductMetric> salesPerProduct;
    private List<MonthlyMetric> salesPerMonth;
    private List<MonthlyMetric> ratingTrend;
    private List<CategoryMetric> categorySales;

    // ============ SECTIONS ============
    private ProductMetric bestSellingProduct;
    private List<LowStockProduct> lowStockProducts;
    private List<ReviewMetric> recentReviews;
    private List<OrderMetric> recentOrders;
    private List<UserMetric> topCustomers;

    public FarmerAnalyticsResponse() {
    }

    public long getTodayOrders() {
        return todayOrders;
    }

    public void setTodayOrders(long todayOrders) {
        this.todayOrders = todayOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getAcceptedOrders() {
        return acceptedOrders;
    }

    public void setAcceptedOrders(long acceptedOrders) {
        this.acceptedOrders = acceptedOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public long getRejectedOrders() {
        return rejectedOrders;
    }

    public void setRejectedOrders(long rejectedOrders) {
        this.rejectedOrders = rejectedOrders;
    }

    public double getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(double monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getProducts() {
        return products;
    }

    public void setProducts(long products) {
        this.products = products;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getReviews() {
        return reviews;
    }

    public void setReviews(long reviews) {
        this.reviews = reviews;
    }

    public long getCustomers() {
        return customers;
    }

    public void setCustomers(long customers) {
        this.customers = customers;
    }

    public List<MonthlyMetric> getRevenueTrend() {
        return revenueTrend;
    }

    public void setRevenueTrend(List<MonthlyMetric> revenueTrend) {
        this.revenueTrend = revenueTrend;
    }

    public List<MonthlyMetric> getOrdersTrend() {
        return ordersTrend;
    }

    public void setOrdersTrend(List<MonthlyMetric> ordersTrend) {
        this.ordersTrend = ordersTrend;
    }

    public List<ProductMetric> getSalesPerProduct() {
        return salesPerProduct;
    }

    public void setSalesPerProduct(List<ProductMetric> salesPerProduct) {
        this.salesPerProduct = salesPerProduct;
    }

    public List<MonthlyMetric> getSalesPerMonth() {
        return salesPerMonth;
    }

    public void setSalesPerMonth(List<MonthlyMetric> salesPerMonth) {
        this.salesPerMonth = salesPerMonth;
    }

    public List<MonthlyMetric> getRatingTrend() {
        return ratingTrend;
    }

    public void setRatingTrend(List<MonthlyMetric> ratingTrend) {
        this.ratingTrend = ratingTrend;
    }

    public List<CategoryMetric> getCategorySales() {
        return categorySales;
    }

    public void setCategorySales(List<CategoryMetric> categorySales) {
        this.categorySales = categorySales;
    }

    public ProductMetric getBestSellingProduct() {
        return bestSellingProduct;
    }

    public void setBestSellingProduct(ProductMetric bestSellingProduct) {
        this.bestSellingProduct = bestSellingProduct;
    }

    public List<LowStockProduct> getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(List<LowStockProduct> lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<ReviewMetric> getRecentReviews() {
        return recentReviews;
    }

    public void setRecentReviews(List<ReviewMetric> recentReviews) {
        this.recentReviews = recentReviews;
    }

    public List<OrderMetric> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<OrderMetric> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<UserMetric> getTopCustomers() {
        return topCustomers;
    }

    public void setTopCustomers(List<UserMetric> topCustomers) {
        this.topCustomers = topCustomers;
    }
}
