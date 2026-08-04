package com.farmbridge.dto;

public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private Double price;
    private Integer quantity;
    private String category;
    private String farmerName;
    private String imageUrl;
    private String farmName;
    private String location;
    private Boolean farmerVerified;
    private Double averageRating;
    private Long reviewCount;
    private Long fiveStarCount;
    private Long fourStarCount;
    private Long threeStarCount;
    private Long twoStarCount;
    private Long oneStarCount;

    public ProductResponse() {
    }

    public ProductResponse(
            Long id,
            String name,
            String description,
            Double price,
            Integer quantity,
            String category,
            String farmerName,
            String imageUrl,
            String farmName,
            String location,
            Boolean farmerVerified,
            Double averageRating,
            Long reviewCount,
            Long fiveStarCount,
            Long fourStarCount,
            Long threeStarCount,
            Long twoStarCount,
            Long oneStarCount) {

        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.category = category;
        this.farmerName = farmerName;
        this.imageUrl = imageUrl;
        this.farmName = farmName;
        this.location = location;
        this.farmerVerified = farmerVerified;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.fiveStarCount = fiveStarCount;
        this.fourStarCount = fourStarCount;
        this.threeStarCount = threeStarCount;
        this.twoStarCount = twoStarCount;
        this.oneStarCount = oneStarCount;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getFarmName() {
        return farmName;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getFarmerVerified() {
        return farmerVerified;
    }

    public void setFarmerVerified(Boolean farmerVerified) {
        this.farmerVerified = farmerVerified;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Long reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Long getFiveStarCount() {
        return fiveStarCount;
    }

    public void setFiveStarCount(Long fiveStarCount) {
        this.fiveStarCount = fiveStarCount;
    }

    public Long getFourStarCount() {
        return fourStarCount;
    }

    public void setFourStarCount(Long fourStarCount) {
        this.fourStarCount = fourStarCount;
    }

    public Long getThreeStarCount() {
        return threeStarCount;
    }

    public void setThreeStarCount(Long threeStarCount) {
        this.threeStarCount = threeStarCount;
    }

    public Long getTwoStarCount() {
        return twoStarCount;
    }

    public void setTwoStarCount(Long twoStarCount) {
        this.twoStarCount = twoStarCount;
    }

    public Long getOneStarCount() {
        return oneStarCount;
    }

    public void setOneStarCount(Long oneStarCount) {
        this.oneStarCount = oneStarCount;
    }
}