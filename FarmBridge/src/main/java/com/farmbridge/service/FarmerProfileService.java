package com.farmbridge.service;

import com.farmbridge.dto.FarmerProfileRequest;
import com.farmbridge.dto.FarmerProfileResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.User;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class FarmerProfileService {

    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;

    public FarmerProfileService(
            FarmerProfileRepository farmerProfileRepository,
            UserRepository userRepository) {

        this.farmerProfileRepository = farmerProfileRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // GET MY PROFILE
    // ==========================================

    public FarmerProfileResponse getProfile(String email) {

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Farmer profile not found")
                );

        return new FarmerProfileResponse(
                profile.getId(),
                profile.getFarmName(),
                profile.getLocation(),
                profile.getLandSize(),
                profile.getCultivationMethod(),
                profile.getCropsCultivated(),
                profile.getFarmingType()
        );
    }

    // ==========================================
    // UPDATE MY PROFILE
    // ==========================================

    public FarmerProfileResponse updateProfile(
            FarmerProfileRequest request,
            String email) {

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Farmer profile not found")
                );

        profile.setFarmName(
                request.getFarmName()
        );

        profile.setLocation(
                request.getLocation()
        );

        profile.setLandSize(
                request.getLandSize()
        );

        profile.setCultivationMethod(
                request.getCultivationMethod()
        );

        profile.setCropsCultivated(
                request.getCropsCultivated()
        );

        profile.setFarmingType(
                request.getFarmingType()
        );

        FarmerProfile updatedProfile =
                farmerProfileRepository.save(profile);

        return new FarmerProfileResponse(
                updatedProfile.getId(),
                updatedProfile.getFarmName(),
                updatedProfile.getLocation(),
                updatedProfile.getLandSize(),
                updatedProfile.getCultivationMethod(),
                updatedProfile.getCropsCultivated(),
                updatedProfile.getFarmingType()
        );
    }

    // ==========================================
    // CREATE PROFILE
    // ==========================================

    public FarmerProfileResponse createProfile(
            FarmerProfileRequest request,
            String email) {

        // Find logged-in farmer using email
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Check if profile already exists for this farmer
        farmerProfileRepository.findByUserEmail(email)
                .ifPresent(profile -> {
                    throw new RuntimeException(
                            "Farmer profile already exists"
                    );
                });

        // Create FarmerProfile entity
        FarmerProfile farmerProfile = new FarmerProfile();

        farmerProfile.setFarmName(
                request.getFarmName()
        );

        farmerProfile.setLocation(
                request.getLocation()
        );

        farmerProfile.setLandSize(
                request.getLandSize()
        );

        farmerProfile.setCultivationMethod(
                request.getCultivationMethod()
        );

        farmerProfile.setCropsCultivated(
                request.getCropsCultivated()
        );

        farmerProfile.setFarmingType(
                request.getFarmingType()
        );

        // Connect FarmerProfile with User
        farmerProfile.setUser(user);

        // Save to database
        FarmerProfile savedProfile =
                farmerProfileRepository.save(farmerProfile);

        // Return Response DTO
        return new FarmerProfileResponse(
                savedProfile.getId(),
                savedProfile.getFarmName(),
                savedProfile.getLocation(),
                savedProfile.getLandSize(),
                savedProfile.getCultivationMethod(),
                savedProfile.getCropsCultivated(),
                savedProfile.getFarmingType()
        );
    }
}