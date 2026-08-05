package com.farmbridge.dto;

/**
 * One category of a GROUP BY aggregation. {@code count} is the number of
 * products (product-category chart) and {@code quantity} the summed order
 * quantity (top-selling-categories / purchases-by-category charts).
 */
public class CategoryMetric {

    private String category;
    private long count;
    private double quantity;

    public CategoryMetric() {
    }

    public CategoryMetric(String category, long count, double quantity) {
        this.category = category;
        this.count = count;
        this.quantity = quantity;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }
}
