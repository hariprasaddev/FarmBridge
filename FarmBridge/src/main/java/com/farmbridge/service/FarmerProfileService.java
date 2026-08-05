package com.farmbridge.service;

import com.farmbridge.dto.FarmerProfileRequest;
import com.farmbridge.dto.FarmerProfileResponse;
import com.farmbridge.dto.FarmerVerificationRequest;
import com.farmbridge.dto.FarmerVerificationResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FarmerProfileService {

    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public FarmerProfileService(
            FarmerProfileRepository farmerProfileRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {

        this.farmerProfileRepository = farmerProfileRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
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

        return toProfileResponse(profile);
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

        return toProfileResponse(updatedProfile);
    }

    // ==========================================
    // CREATE PROFILE (legacy — no verification submission)
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

        // A freshly created profile is never verified: verified = false
        // and verificationStatus = PENDING are the entity defaults.
        // It cannot sell until an admin approves its verification.

        // Save to database
        FarmerProfile savedProfile =
                farmerProfileRepository.save(farmerProfile);

        return toProfileResponse(savedProfile);
    }

    // ==========================================
    // GET MY VERIFICATION STATUS
    // ==========================================

    public FarmerVerificationResponse getVerification(String email) {

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Farmer profile not found")
                );

        return toVerificationResponse(profile);
    }

    // ==========================================
    // SUBMIT / RESUBMIT VERIFICATION
    // ==========================================

    /**
     * Creates (or updates) the farmer's verification profile, stores the
     * uploaded documents, and puts the request back into PENDING state.
     * Required documents: farmer photo, land ownership certificate,
     * farm photo. The organic certificate is optional.
     */
    @Transactional
    public FarmerVerificationResponse submitVerification(
            FarmerVerificationRequest request,
            MultipartFile farmerPhoto,
            MultipartFile landCertificate,
            MultipartFile farmPhoto,
            MultipartFile organicCertificate,
            String email) {

        // Find logged-in farmer using email
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Missing documents are rejected before any file is written
        requireDocument(farmerPhoto, "Farmer photo is required");
        requireDocument(landCertificate,
                "Land ownership certificate is required");
        requireDocument(farmPhoto, "Farm photo is required");

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(email)
                .orElse(null);

        boolean isNewProfile = (profile == null);

        if (isNewProfile) {
            profile = new FarmerProfile();
            profile.setUser(user);
        }

        // ----- Personal information -----
        profile.setFullName(request.getFullName());
        profile.setMobileNumber(request.getMobileNumber());
        profile.setAadhaarNumber(blankToNull(request.getAadhaarNumber()));
        profile.setVillage(request.getVillage());
        profile.setMandal(request.getMandal());
        profile.setDistrict(request.getDistrict());
        profile.setState(request.getState());

        // ----- Farm information -----
        profile.setFarmName(request.getFarmName());
        profile.setFarmAddress(request.getFarmAddress());
        profile.setLandSize(request.getFarmSize());
        profile.setSurveyNumber(blankToNull(request.getSurveyNumber()));

        // ----- Cultivation information -----
        profile.setCultivationMethod(request.getCultivationMethod());
        profile.setCropsCultivated(request.getMainCrops());
        profile.setFarmingExperience(request.getFarmingExperience());
        profile.setFarmingType(request.getCultivationMethod());

        // Human-readable location for backwards-compatible displays
        // (product cards, admin cards)
        profile.setLocation(composeLocation(request));

        // ----- Documents -----
        // Remember old files so they can be cleaned up after a successful
        // save (replaced files are never left orphaned on disk).
        String oldFarmerPhoto = profile.getFarmerPhotoUrl();
        String oldLandCertificate = profile.getLandCertificateUrl();
        String oldFarmPhoto = profile.getFarmPhotoUrl();
        String oldOrganicCertificate = profile.getOrganicCertificateUrl();

        String newFarmerPhoto =
                fileStorageService.storeImage(farmerPhoto);
        String newLandCertificate =
                fileStorageService.storeImage(landCertificate);
        String newFarmPhoto =
                fileStorageService.storeImage(farmPhoto);
        String newOrganicCertificate = null;

        if (organicCertificate != null && !organicCertificate.isEmpty()) {
            newOrganicCertificate =
                    fileStorageService.storeImage(organicCertificate);
        }

        profile.setFarmerPhotoUrl(newFarmerPhoto);
        profile.setLandCertificateUrl(newLandCertificate);
        profile.setFarmPhotoUrl(newFarmPhoto);
        profile.setOrganicCertificateUrl(newOrganicCertificate);

        // ----- Verification workflow -----
        // Every (re)submission resets the request to PENDING.
        profile.setVerified(false);
        profile.setVerificationStatus(VerificationStatus.PENDING);
        profile.setRejectionReason(null);
        profile.setSubmittedAt(LocalDateTime.now());

        FarmerProfile savedProfile;

        try {
            savedProfile = farmerProfileRepository.save(profile);
        } catch (RuntimeException e) {
            // The save failed — remove the freshly stored files so the
            // database and filesystem never drift apart.
            fileStorageService.deleteImage(newFarmerPhoto);
            fileStorageService.deleteImage(newLandCertificate);
            fileStorageService.deleteImage(newFarmPhoto);
            fileStorageService.deleteImage(newOrganicCertificate);
            throw e;
        }

        // Success — clean up the replaced documents (if any)
        if (!isNewProfile) {
            fileStorageService.deleteImage(oldFarmerPhoto);
            fileStorageService.deleteImage(oldLandCertificate);
            fileStorageService.deleteImage(oldFarmPhoto);
            fileStorageService.deleteImage(oldOrganicCertificate);
        }

        return toVerificationResponse(savedProfile);
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private void requireDocument(MultipartFile file, String message) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException(message);
        }
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private String composeLocation(FarmerVerificationRequest request) {

        return Stream.of(
                        request.getVillage(),
                        request.getMandal(),
                        request.getDistrict(),
                        request.getState()
                )
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(", "));
    }

    private FarmerProfileResponse toProfileResponse(
            FarmerProfile profile) {

        return new FarmerProfileResponse(
                profile.getId(),
                profile.getFarmName(),
                profile.getLocation(),
                profile.getLandSize(),
                profile.getCultivationMethod(),
                profile.getCropsCultivated(),
                profile.getFarmingType(),
                Boolean.TRUE.equals(profile.getVerified()),
                profile.getVerificationStatus() != null
                        ? profile.getVerificationStatus().name()
                        : VerificationStatus.PENDING.name(),
                profile.getRejectionReason(),
                profile.getSubmittedAt(),
                profile.getFullName()
        );
    }

    private FarmerVerificationResponse toVerificationResponse(
            FarmerProfile profile) {

        User user = profile.getUser();

        return new FarmerVerificationResponse(
                profile.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                profile.getFullName(),
                profile.getMobileNumber(),
                profile.getAadhaarNumber(),
                profile.getVillage(),
                profile.getMandal(),
                profile.getDistrict(),
                profile.getState(),
                profile.getFarmName(),
                profile.getLocation(),
                profile.getFarmAddress(),
                profile.getLandSize(),
                profile.getSurveyNumber(),
                profile.getCultivationMethod(),
                profile.getCropsCultivated(),
                profile.getFarmingExperience(),
                profile.getFarmerPhotoUrl(),
                profile.getLandCertificateUrl(),
                profile.getFarmPhotoUrl(),
                profile.getOrganicCertificateUrl(),
                Boolean.TRUE.equals(profile.getVerified()),
                profile.getVerificationStatus() != null
                        ? profile.getVerificationStatus().name()
                        : VerificationStatus.PENDING.name(),
                profile.getRejectionReason(),
                profile.getSubmittedAt()
        );
    }
}
