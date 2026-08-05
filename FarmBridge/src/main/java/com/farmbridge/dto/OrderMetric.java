package com.farmbridge.dto;

import java.time.LocalDateTime;

/**
 * A denormalized order row for dashboard tables — joins product, buyer
 * and farmer names in one JPQL query (no per-order lazy fetches).
 */
public class OrderMetric {

    private Long id;
    private String productName;
    private String buyerName;
    private String farmerName;
    private Integer quantity;
    private Double totalPrice;
    private String status;
    private LocalDateTime createdAt;

    public OrderMetric() {
    }

    public OrderMetric(
            Long id,
            String productName,
            String buyerName,
            String farmerName,
            Integer quantity,
            Double totalPrice,
            String status,
            LocalDateTime createdAt) {

        this.id = id;
        this.productName = productName;
        this.buyerName = buyerName;
        this.farmerName = farmerName;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
