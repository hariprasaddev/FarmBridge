package com.farmbridge.dto;

/**
 * Aggregated activity of a user — order count and summed order value.
 * Used for top buyers, top farmers, top customers and favorite farmers.
 */
public class UserMetric {

    private Long userId;
    private String name;
    private String email;
    private long orderCount;
    private double totalAmount;

    public UserMetric() {
    }

    public UserMetric(
            Long userId,
            String name,
            String email,
            long orderCount,
            double totalAmount) {

        this.userId = userId;
        this.name = name;
        this.email = email;
        this.orderCount = orderCount;
        this.totalAmount = totalAmount;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(long orderCount) {
        this.orderCount = orderCount;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }
}
