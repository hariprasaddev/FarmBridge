package com.farmbridge.dto;

/**
 * Aggregated sales of a single product — summed order quantity and
 * revenue. Used by the admin top-products list and the farmer
 * sales-per-product chart / best-selling-product card.
 */
public class ProductMetric {

    private Long productId;
    private String productName;
    private String category;
    private double quantity;
    private double revenue;

    public ProductMetric() {
    }

    public ProductMetric(
            Long productId,
            String productName,
            String category,
            double quantity,
            double revenue) {

        this.productId = productId;
        this.productName = productName;
        this.category = category;
        this.quantity = quantity;
        this.revenue = revenue;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }

    public double getRevenue() {
        return revenue;
    }

    public void setRevenue(double revenue) {
        this.revenue = revenue;
    }
}
