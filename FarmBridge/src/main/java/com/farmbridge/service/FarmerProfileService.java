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

    public FarmerProfileResponse createProfile(
            FarmerProfileRequest request,
            String email) {

        // Find logged-in farmer using email
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

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