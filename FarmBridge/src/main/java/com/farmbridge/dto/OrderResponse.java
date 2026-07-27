package com.farmbridge.dto;

public class OrderResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String buyerName;
    private String farmerName;
    private Integer quantity;
    private Double totalPrice;
    private String status;

    public OrderResponse() {
    }

    public OrderResponse(
            Long id,
            Long productId,
            String productName,
            String buyerName,
            String farmerName,
            Integer quantity,
            Double totalPrice,
            String status) {

        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.buyerName = buyerName;
        this.farmerName = farmerName;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
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
}