package com.farmbridge.dto;

public class FarmerVerificationResponse {

    private Long profileId;
    private Long userId;
    private String farmerName;
    private String email;
    private String farmName;
    private String location;
    private Boolean verified;

    public FarmerVerificationResponse() {
    }

    public FarmerVerificationResponse(
            Long profileId,
            Long userId,
            String farmerName,
            String email,
            String farmName,
            String location,
            Boolean verified) {

        this.profileId = profileId;
        this.userId = userId;
        this.farmerName = farmerName;
        this.email = email;
        this.farmName = farmName;
        this.location = location;
        this.verified = verified;
    }

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

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }
}
