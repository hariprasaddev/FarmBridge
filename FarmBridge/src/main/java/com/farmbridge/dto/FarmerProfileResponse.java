package com.farmbridge.dto;

import java.time.LocalDateTime;

public class FarmerProfileResponse {

    private Long id;
    private String farmName;
    private String location;
    private Double landSize;
    private String cultivationMethod;
    private String cropsCultivated;
    private String farmingType;

    // Verification workflow
    private Boolean verified;
    private String verificationStatus;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private String fullName;

    public FarmerProfileResponse() {
    }

    public FarmerProfileResponse(
            Long id,
            String farmName,
            String location,
            Double landSize,
            String cultivationMethod,
            String cropsCultivated,
            String farmingType,
            Boolean verified,
            String verificationStatus,
            String rejectionReason,
            LocalDateTime submittedAt,
            String fullName) {

        this.id = id;
        this.farmName = farmName;
        this.location = location;
        this.landSize = landSize;
        this.cultivationMethod = cultivationMethod;
        this.cropsCultivated = cropsCultivated;
        this.farmingType = farmingType;
        this.verified = verified;
        this.verificationStatus = verificationStatus;
        this.rejectionReason = rejectionReason;
        this.submittedAt = submittedAt;
        this.fullName = fullName;
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

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}