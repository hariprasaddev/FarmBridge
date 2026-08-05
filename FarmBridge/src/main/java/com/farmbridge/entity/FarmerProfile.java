package com.farmbridge.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // PERSONAL INFORMATION
    // ==========================================

    private String fullName;

    private String mobileNumber;

    // Optional — Aadhaar is never required to sell
    private String aadhaarNumber;

    private String village;

    private String mandal;

    private String district;

    private String state;

    // ==========================================
    // FARM INFORMATION
    // ==========================================

    private String farmName;

    // Human-readable location composed from village/mandal/district/state.
    // Kept for backwards compatibility — product cards and the buyer
    // experience render this field.
    private String location;

    private String farmAddress;

    // Farm size in acres (legacy name landSize is kept as the column)
    private Double landSize;

    // Optional — survey number of the farmland
    private String surveyNumber;

    // ==========================================
    // CULTIVATION INFORMATION
    // ==========================================

    // One of ORGANIC / NATURAL / CHEMICAL / MIXED
    private String cultivationMethod;

    // Main crops (legacy name cropsCultivated is kept as the column)
    private String cropsCultivated;

    private String farmingExperience;

    private String farmingType;

    // ==========================================
    // VERIFICATION DOCUMENTS
    // (Public /uploads/... URLs produced by FileStorageService)
    // ==========================================

    private String farmerPhotoUrl;

    private String landCertificateUrl;

    private String farmPhotoUrl;

    // Optional — only organic/natural farmers upload this
    private String organicCertificateUrl;

    // ==========================================
    // VERIFICATION WORKFLOW
    // ==========================================

    // Whether this farmer has been verified by an admin.
    // Always kept in sync with verificationStatus == APPROVED so
    // pre-existing consumers (admin stats, product responses) work.
    @Column(columnDefinition = "boolean default false")
    private Boolean verified = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    // Admin's rejection reason — set only when status == REJECTED
    @Column(length = 1000)
    private String rejectionReason;

    // When the current verification request was (re)submitted
    private LocalDateTime submittedAt;

    // Connect FarmerProfile with User
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    // Default constructor
    public FarmerProfile() {
    }

    // ==========================================
    // VERIFICATION HELPERS
    // ==========================================

    public boolean isApproved() {
        return verificationStatus == VerificationStatus.APPROVED;
    }

    public boolean isPending() {
        return verificationStatus == VerificationStatus.PENDING;
    }

    // ==========================================
    // Getters and Setters
    // ==========================================

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

    public String getFarmAddress() {
        return farmAddress;
    }

    public void setFarmAddress(String farmAddress) {
        this.farmAddress = farmAddress;
    }

    public String getSurveyNumber() {
        return surveyNumber;
    }

    public void setSurveyNumber(String surveyNumber) {
        this.surveyNumber = surveyNumber;
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

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}