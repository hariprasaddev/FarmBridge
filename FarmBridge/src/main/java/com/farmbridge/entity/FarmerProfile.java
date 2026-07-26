package com.farmbridge.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String farmName;

    private String location;

    private Double landSize;

    private String cultivationMethod;

    private String cropsCultivated;

    private String farmingType;

    // Connect FarmerProfile with User
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    // Default constructor
    public FarmerProfile() {
    }


    // Getters and Setters

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}