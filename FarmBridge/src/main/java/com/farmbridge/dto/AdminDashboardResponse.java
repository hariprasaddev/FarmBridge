package com.farmbridge.dto;

public class AdminDashboardResponse {

    private Long totalUsers;
    private Long totalFarmers;
    private Long totalBuyers;
    private Long totalProducts;
    private Long totalOrders;
    private Long pendingVerifications;

    public AdminDashboardResponse() {
    }

    public AdminDashboardResponse(
            Long totalUsers,
            Long totalFarmers,
            Long totalBuyers,
            Long totalProducts,
            Long totalOrders,
            Long pendingVerifications) {

        this.totalUsers = totalUsers;
        this.totalFarmers = totalFarmers;
        this.totalBuyers = totalBuyers;
        this.totalProducts = totalProducts;
        this.totalOrders = totalOrders;
        this.pendingVerifications = pendingVerifications;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTotalFarmers() {
        return totalFarmers;
    }

    public void setTotalFarmers(Long totalFarmers) {
        this.totalFarmers = totalFarmers;
    }

    public Long getTotalBuyers() {
        return totalBuyers;
    }

    public void setTotalBuyers(Long totalBuyers) {
        this.totalBuyers = totalBuyers;
    }

    public Long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(Long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public Long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Long getPendingVerifications() {
        return pendingVerifications;
    }

    public void setPendingVerifications(Long pendingVerifications) {
        this.pendingVerifications = pendingVerifications;
    }
}
