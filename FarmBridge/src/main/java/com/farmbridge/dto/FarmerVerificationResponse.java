package com.farmbridge.dto;

import java.time.LocalDateTime;

/**
 * Full farmer verification profile — returned to the farmer (my
 * verification status) and to admins (pending verification list).
 */
public class FarmerVerificationResponse {

    private Long profileId;
    private Long userId;

    // Account info
    private String farmerName;
    private String email;

    // Personal information
    private String fullName;
    private String mobileNumber;
    private String aadhaarNumber;
    private String village;
    private String mandal;
    private String district;
    private String state;

    // Farm information
    private String farmName;
    private String location;
    private String farmAddress;
    private Double farmSize;
    private String surveyNumber;

    // Cultivation information
    private String cultivationMethod;
    private String mainCrops;
    private String farmingExperience;

    // Documents (public /uploads/... URLs)
    private String farmerPhotoUrl;
    private String landCertificateUrl;
    private String farmPhotoUrl;
    private String organicCertificateUrl;

    // Verification workflow
    private Boolean verified;
    private String verificationStatus;
    private String rejectionReason;
    private LocalDateTime submittedAt;

    public FarmerVerificationResponse() {
    }

    public FarmerVerificationResponse(
            Long profileId,
            Long userId,
            String farmerName,
            String email,
            String fullName,
            String mobileNumber,
            String aadhaarNumber,
            String village,
            String mandal,
            String district,
            String state,
            String farmName,
            String location,
            String farmAddress,
            Double farmSize,
            String surveyNumber,
            String cultivationMethod,
            String mainCrops,
            String farmingExperience,
            String farmerPhotoUrl,
            String landCertificateUrl,
            String farmPhotoUrl,
            String organicCertificateUrl,
            Boolean verified,
            String verificationStatus,
            String rejectionReason,
            LocalDateTime submittedAt) {

        this.profileId = profileId;
        this.userId = userId;
        this.farmerName = farmerName;
        this.email = email;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;
        this.aadhaarNumber = aadhaarNumber;
        this.village = village;
        this.mandal = mandal;
        this.district = district;
        this.state = state;
        this.farmName = farmName;
        this.location = location;
        this.farmAddress = farmAddress;
        this.farmSize = farmSize;
        this.surveyNumber = surveyNumber;
        this.cultivationMethod = cultivationMethod;
        this.mainCrops = mainCrops;
        this.farmingExperience = farmingExperience;
        this.farmerPhotoUrl = farmerPhotoUrl;
        this.landCertificateUrl = landCertificateUrl;
        this.farmPhotoUrl = farmPhotoUrl;
        this.organicCertificateUrl = organicCertificateUrl;
        this.verified = verified;
        this.verificationStatus = verificationStatus;
        this.rejectionReason = rejectionReason;
        this.submittedAt = submittedAt;
    }

    // ==========================================
    // Getters and Setters
    // ==========================================

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public String getFarmerPhotoUrl() {
        return farmerPhotoUrl;
    }

    public void setFarmerPhotoUrl(String farmerPhotoUrl) {
        this.farmerPhotoUrl = farmerPhotoUrl;
    }

    public String getLandCertificateUrl() {
        return landCertificateUrl;
    }

    public void setLandCertificateUrl(String landCertificateUrl) {
        this.landCertificateUrl = landCertificateUrl;
    }

    public String getFarmPhotoUrl() {
        return farmPhotoUrl;
    }

    public void setFarmPhotoUrl(String farmPhotoUrl) {
        this.farmPhotoUrl = farmPhotoUrl;
    }

    public String getOrganicCertificateUrl() {
        return organicCertificateUrl;
    }

    public void setOrganicCertificateUrl(String organicCertificateUrl) {
        this.organicCertificateUrl = organicCertificateUrl;
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
}
