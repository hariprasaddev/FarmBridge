package com.farmbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Farmer verification submission. Bound from multipart form fields
 * (the document files are separate @RequestPart parameters).
 * The cultivationMethod values are ORGANIC / NATURAL / CHEMICAL / MIXED.
 */
public class FarmerVerificationRequest {

    // ==========================================
    // PERSONAL INFORMATION
    // ==========================================

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
    private String mobileNumber;

    // Optional
    private String aadhaarNumber;

    @NotBlank(message = "Village is required")
    private String village;

    @NotBlank(message = "Mandal is required")
    private String mandal;

    @NotBlank(message = "District is required")
    private String district;

    @NotBlank(message = "State is required")
    private String state;

    // ==========================================
    // FARM INFORMATION
    // ==========================================

    @NotBlank(message = "Farm name is required")
    private String farmName;

    @NotBlank(message = "Farm address is required")
    private String farmAddress;

    @NotNull(message = "Farm size is required")
    private Double farmSize;

    // Optional
    private String surveyNumber;

    // ==========================================
    // CULTIVATION INFORMATION
    // ==========================================

    @NotBlank(message = "Cultivation method is required")
    private String cultivationMethod;

    @NotBlank(message = "Main crops are required")
    private String mainCrops;

    @NotBlank(message = "Farming experience is required")
    private String farmingExperience;

    // ==========================================
    // Getters and Setters
    // ==========================================

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public String getMandal() {
        return mandal;
    }

    public void setMandal(String mandal) {
        this.mandal = mandal;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getFarmName() {
        return farmName;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
    }

    public String getFarmAddress() {
        return farmAddress;
    }

    public void setFarmAddress(String farmAddress) {
        this.farmAddress = farmAddress;
    }

    public Double getFarmSize() {
        return farmSize;
    }

    public void setFarmSize(Double farmSize) {
        this.farmSize = farmSize;
    }

    public String getSurveyNumber() {
        return surveyNumber;
    }

    public void setSurveyNumber(String surveyNumber) {
        this.surveyNumber = surveyNumber;
    }

    public String getCultivationMethod() {
        return cultivationMethod;
    }

    public void setCultivationMethod(String cultivationMethod) {
        this.cultivationMethod = cultivationMethod;
    }

    public String getMainCrops() {
        return mainCrops;
    }

    public void setMainCrops(String mainCrops) {
        this.mainCrops = mainCrops;
    }

    public String getFarmingExperience() {
        return farmingExperience;
    }

    public void setFarmingExperience(String farmingExperience) {
        this.farmingExperience = farmingExperience;
    }
}
