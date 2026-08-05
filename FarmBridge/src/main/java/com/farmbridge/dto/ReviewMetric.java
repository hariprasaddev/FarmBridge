package com.farmbridge.dto;

import java.time.LocalDateTime;

/**
 * A denormalized review row for the latest-reviews table — joins the
 * product and buyer names in one JPQL query.
 */
public class ReviewMetric {

    private Long id;
    private String productName;
    private String buyerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewMetric() {
    }

    public ReviewMetric(
            Long id,
            String productName,
            String buyerName,
            Integer rating,
            String comment,
            LocalDateTime createdAt) {

        this.id = id;
        this.productName = productName;
        this.buyerName = buyerName;
        this.rating = rating;
        this.comment = comment;
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

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
