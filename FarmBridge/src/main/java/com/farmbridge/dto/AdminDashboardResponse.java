package com.farmbridge.dto;

public class AdminDashboardResponse {

    private Long totalUsers;
    private Long totalFarmers;
    private Long totalBuyers;
    private Long totalProducts;
    private Long totalOrders;
    private Long pendingVerifications;

    // SOFT DELETE — account status breakdown
    private Long activeUsers;
    private Long inactiveUsers;
    private Long activeFarmers;
    private Long inactiveFarmers;

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

    public Long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(Long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public Long getInactiveUsers() {
        return inactiveUsers;
    }

    public void setInactiveUsers(Long inactiveUsers) {
        this.inactiveUsers = inactiveUsers;
    }

    public Long getActiveFarmers() {
        return activeFarmers;
    }

    public void setActiveFarmers(Long activeFarmers) {
        this.activeFarmers = activeFarmers;
    }

    public Long getInactiveFarmers() {
        return inactiveFarmers;
    }

    public void setInactiveFarmers(Long inactiveFarmers) {
        this.inactiveFarmers = inactiveFarmers;
    }
}
