package com.farmbridge.dto;

/**
 * A product whose remaining quantity is at or below the low-stock
 * threshold, with the owning farmer's name joined in the query.
 */
public class LowStockProduct {

    private Long id;
    private String name;
    private String category;
    private Integer quantity;
    private Double price;
    private String farmerName;

    public LowStockProduct() {
    }

    public LowStockProduct(
            Long id,
            String name,
            String category,
            Integer quantity,
            Double price,
            String farmerName) {

        this.id = id;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.price = price;
        this.farmerName = farmerName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }
}
