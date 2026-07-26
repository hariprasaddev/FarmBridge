package com.farmbridge.dto;

public class FarmerProfileResponse {

    private Long id;
    private String farmName;
    private String location;
    private Double landSize;
    private String cultivationMethod;
    private String cropsCultivated;
    private String farmingType;

    public FarmerProfileResponse() {
    }

    public FarmerProfileResponse(
            Long id,
            String farmName,
            String location,
            Double landSize,
            String cultivationMethod,
            String cropsCultivated,
            String farmingType) {

        this.id = id;
        this.farmName = farmName;
        this.location = location;
        this.landSize = landSize;
        this.cultivationMethod = cultivationMethod;
        this.cropsCultivated = cropsCultivated;
        this.farmingType = farmingType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Double getLandSize() {
        return landSize;
    }

    public void setLandSize(Double landSize) {
        this.landSize = landSize;
    }

    public String getCultivationMethod() {
        return cultivationMethod;
    }

    public void setCultivationMethod(String cultivationMethod) {
        this.cultivationMethod = cultivationMethod;
    }

    public String getCropsCultivated() {
        return cropsCultivated;
    }

    public void setCropsCultivated(String cropsCultivated) {
        this.cropsCultivated = cropsCultivated;
    }

    public String getFarmingType() {
        return farmingType;
    }

    public void setFarmingType(String farmingType) {
        this.farmingType = farmingType;
    }
}