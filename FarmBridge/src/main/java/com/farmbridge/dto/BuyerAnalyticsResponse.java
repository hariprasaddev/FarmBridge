package com.farmbridge.dto;

import java.util.List;

/**
 * One-call payload for the buyer analytics dashboard — spending,
 * purchasing behaviour and personalized recommendations computed from
 * the buyer's real order, wishlist and review history.
 */
public class BuyerAnalyticsResponse {

    // ============ CARDS ============
    private long orders;
    private long wishlist;
    private long reviews;
    private double moneySpent;
    private String favoriteCategory;
    private long purchasedProducts;
    private long pendingOrders;
    private long completedOrders;

    // ============ CHARTS ============
    private List<MonthlyMetric> monthlySpending;
    private List<CategoryMetric> purchasesByCategory;
    private List<MonthlyMetric> ordersTimeline;

    // ============ SECTIONS ============
    private List<ProductResponse> recommendedProducts;
    private List<OrderMetric> latestOrders;
    private List<UserMetric> favoriteFarmers;

    public BuyerAnalyticsResponse() {
    }

    public long getOrders() {
        return orders;
    }

    public void setOrders(long orders) {
        this.orders = orders;
    }

    public long getWishlist() {
        return wishlist;
    }

    public void setWishlist(long wishlist) {
        this.wishlist = wishlist;
    }

    public long getReviews() {
        return reviews;
    }

    public void setReviews(long reviews) {
        this.reviews = reviews;
    }

    public double getMoneySpent() {
        return moneySpent;
    }

    public void setMoneySpent(double moneySpent) {
        this.moneySpent = moneySpent;
    }

    public String getFavoriteCategory() {
        return favoriteCategory;
    }

    public void setFavoriteCategory(String favoriteCategory) {
        this.favoriteCategory = favoriteCategory;
    }

    public long getPurchasedProducts() {
        return purchasedProducts;
    }

    public void setPurchasedProducts(long purchasedProducts) {
        this.purchasedProducts = purchasedProducts;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public List<MonthlyMetric> getMonthlySpending() {
        return monthlySpending;
    }

    public void setMonthlySpending(List<MonthlyMetric> monthlySpending) {
        this.monthlySpending = monthlySpending;
    }

    public List<CategoryMetric> getPurchasesByCategory() {
        return purchasesByCategory;
    }

    public void setPurchasesByCategory(List<CategoryMetric> purchasesByCategory) {
        this.purchasesByCategory = purchasesByCategory;
    }

    public List<MonthlyMetric> getOrdersTimeline() {
        return ordersTimeline;
    }

    public void setOrdersTimeline(List<MonthlyMetric> ordersTimeline) {
        this.ordersTimeline = ordersTimeline;
    }

    public List<ProductResponse> getRecommendedProducts() {
        return recommendedProducts;
    }

    public void setRecommendedProducts(List<ProductResponse> recommendedProducts) {
        this.recommendedProducts = recommendedProducts;
    }

    public List<OrderMetric> getLatestOrders() {
        return latestOrders;
    }

    public void setLatestOrders(List<OrderMetric> latestOrders) {
        this.latestOrders = latestOrders;
    }

    public List<UserMetric> getFavoriteFarmers() {
        return favoriteFarmers;
    }

    public void setFavoriteFarmers(List<UserMetric> favoriteFarmers) {
        this.favoriteFarmers = favoriteFarmers;
    }
}
