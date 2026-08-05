package com.farmbridge;

import com.farmbridge.dto.FarmerVerificationRequest;
import com.farmbridge.dto.ProductRequest;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.service.AdminService;
import com.farmbridge.service.FarmerProfileService;
import com.farmbridge.service.ProductService;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end verification workflow at the service layer:
 * submit -> PENDING -> reject (reason) -> resubmit (keeps documents)
 * -> approve -> sell. Also covers missing/invalid documents and the
 * buyer-side visibility rule (only APPROVED farmers' products are shown).
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FarmerVerificationFlowIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    // The farmer who goes through the full submit -> reject -> resubmit -> approve flow
    private static final String FARMER_EMAIL = "verif.farmer." + TS + "@example.com";
    private static final String FARMER_PASSWORD = "FarmerPass123!";

    // A second farmer who never gets approved (product visibility test)
    private static final String UNVERIFIED_EMAIL = "verif.unverified." + TS + "@example.com";
    private static final String UNVERIFIED_PASSWORD = "FarmerPass123!";

    // A brand-new farmer used only for the missing-documents test
    private static final String NO_DOCS_EMAIL = "verif.nodocs." + TS + "@example.com";
    private static final String NO_DOCS_PASSWORD = "FarmerPass123!";

    @Autowired private FarmerProfileService farmerProfileService;
    @Autowired private AdminService adminService;
    @Autowired private ProductService productService;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User farmer;
    private User unverifiedFarmer;
    private User noDocsFarmer;
    private Long approvedProductId;

    // A minimal-but-valid PNG signature passes FileStorageService's
    // magic-byte check (it reads only the header).
    private static final byte[] FAKE_PNG = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x00
    };

    @BeforeAll
    void seedUsers() {
        farmer = saveUser("Verif Farmer", FARMER_EMAIL, FARMER_PASSWORD);
        unverifiedFarmer = saveUser("Unverified Farmer", UNVERIFIED_EMAIL, UNVERIFIED_PASSWORD);
        noDocsFarmer = saveUser("No Docs Farmer", NO_DOCS_EMAIL, NO_DOCS_PASSWORD);
    }

    @AfterAll
    void cleanup() {
        productRepository.deleteAll(
                productRepository.findByFarmerEmail(FARMER_EMAIL)
        );
        productRepository.deleteAll(
                productRepository.findByFarmerEmail(UNVERIFIED_EMAIL)
        );
        farmerProfileRepository.findByUserEmail(FARMER_EMAIL)
                .ifPresent(farmerProfileRepository::delete);
        farmerProfileRepository.findByUserEmail(UNVERIFIED_EMAIL)
                .ifPresent(farmerProfileRepository::delete);
        userRepository.delete(farmer);
        userRepository.delete(unverifiedFarmer);
        userRepository.delete(noDocsFarmer);
    }

    private User saveUser(String name, String email, String password) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.FARMER);
        return userRepository.save(user);
    }

    private FarmerVerificationRequest validRequest() {
        FarmerVerificationRequest request = new FarmerVerificationRequest();
        request.setFullName("Ravi Kumar");
        request.setMobileNumber("9876543210");
        request.setAadhaarNumber("123456789012");
        request.setVillage("Peddapalli");
        request.setMandal("Nizamabad");
        request.setDistrict("Nizamabad");
        request.setState("Telangana");
        request.setFarmName("Green Valley Farm");
        request.setFarmAddress("Survey 45, Peddapalli");
        request.setFarmSize(5.5);
        request.setSurveyNumber("452/1A");
        request.setCultivationMethod("ORGANIC");
        request.setMainCrops("Rice, Chillies");
        request.setFarmingExperience("12 years");
        return request;
    }

    private MultipartFile doc(String name) {
        return new MockMultipartFile(name, name + ".png", "image/png", FAKE_PNG);
    }

    private ProductRequest productRequest(String name, double price, int quantity) {
        ProductRequest request = new ProductRequest();
        request.setName(name);
        request.setDescription("Test product");
        request.setPrice(price);
        request.setQuantity(quantity);
        request.setCategory("Grains");
        return request;
    }

    // ==========================================
    // SUBMISSION
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Submitting verification creates a PENDING, unverified profile with documents")
    void submit_createsPendingProfile() {

        var response = farmerProfileService.submitVerification(
                validRequest(),
                doc("farmerPhoto"),
                doc("landCertificate"),
                doc("farmPhoto"),
                doc("organicCertificate"),
                FARMER_EMAIL
        );

        assertEquals("PENDING", response.getVerificationStatus());
        assertEquals(false, response.getVerified());
        assertEquals("Ravi Kumar", response.getFullName());
        assertEquals("9876543210", response.getMobileNumber());
        assertEquals("Peddapalli", response.getVillage());
        assertEquals("Green Valley Farm", response.getFarmName());
        assertEquals(5.5, response.getFarmSize());
        assertEquals("ORGANIC", response.getCultivationMethod());
        assertEquals("Rice, Chillies", response.getMainCrops());
        assertNotNull(response.getFarmerPhotoUrl());
        assertNotNull(response.getLandCertificateUrl());
        assertNotNull(response.getFarmPhotoUrl());
        assertNotNull(response.getOrganicCertificateUrl());
        assertNotNull(response.getSubmittedAt());
    }

    @Test
    @Order(2)
    @DisplayName("A new submission without the required documents is rejected")
    void submit_missingDocuments_throws() {

        // Uses a farmer with no prior submission, so the required-documents
        // check applies (a resubmission may keep existing documents).
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                farmerProfileService.submitVerification(
                        validRequest(),
                        null,
                        doc("landCertificate"),
                        doc("farmPhoto"),
                        null,
                        NO_DOCS_EMAIL
                )
        );

        assertEquals("Farmer photo is required", ex.getMessage());
    }

    @Test
    @Order(3)
    @DisplayName("Invalid (non-image) uploads are rejected by the file validator")
    void submit_invalidUpload_throws() {

        MockMultipartFile textFile = new MockMultipartFile(
                "farmerPhoto",
                "photo.txt",
                "text/plain",
                "not an image".getBytes()
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                farmerProfileService.submitVerification(
                        validRequest(),
                        textFile,
                        doc("landCertificate"),
                        doc("farmPhoto"),
                        null,
                        FARMER_EMAIL
                )
        );

        assertEquals(
                "Only image files (JPG, PNG, WEBP, GIF) are allowed",
                ex.getMessage()
        );
    }

    @Test
    @Order(4)
    @DisplayName("A PENDING farmer cannot create products (403-style message)")
    void pendingFarmer_cannotCreateProduct() {

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                productService.createProduct(
                        productRequest("Rice", 50.0, 10),
                        FARMER_EMAIL
                )
        );

        assertEquals(
                "Your farmer account has not been verified yet.",
                ex.getMessage()
        );
    }

    // ==========================================
    // REJECT / RESUBMIT
    // ==========================================

    @Test
    @Order(5)
    @DisplayName("Admin rejection stores the reason and moves the profile to REJECTED")
    void adminReject_storesReason() {

        Long profileId = farmerProfileRepository
                .findByUserEmail(FARMER_EMAIL)
                .orElseThrow()
                .getId();

        var response = adminService.rejectFarmer(
                profileId,
                "Land certificate is illegible — upload a clearer copy."
        );

        assertEquals("REJECTED", response.getVerificationStatus());
        assertEquals(false, response.getVerified());
        assertEquals(
                "Land certificate is illegible — upload a clearer copy.",
                response.getRejectionReason()
        );
    }

    @Test
    @Order(6)
    @DisplayName("Resubmitting without re-uploading keeps the documents and resets to PENDING")
    void resubmit_keepsDocuments_andGoesPending() {

        String previousPhotoUrl = farmerProfileRepository
                .findByUserEmail(FARMER_EMAIL)
                .orElseThrow()
                .getFarmerPhotoUrl();

        // No files at all — the previously uploaded documents are kept
        var response = farmerProfileService.submitVerification(
                validRequest(),
                null,
                null,
                null,
                null,
                FARMER_EMAIL
        );

        assertEquals("PENDING", response.getVerificationStatus());
        assertNull(response.getRejectionReason());
        assertEquals(previousPhotoUrl, response.getFarmerPhotoUrl());
        assertNotNull(response.getLandCertificateUrl());
        assertNotNull(response.getFarmPhotoUrl());
    }

    // ==========================================
    // APPROVE + SELL
    // ==========================================

    @Test
    @Order(7)
    @DisplayName("Admin approval moves the profile to APPROVED and verified=true")
    void adminApprove_marksApproved() {

        Long profileId = farmerProfileRepository
                .findByUserEmail(FARMER_EMAIL)
                .orElseThrow()
                .getId();

        var response = adminService.verifyFarmer(profileId);

        assertEquals("APPROVED", response.getVerificationStatus());
        assertEquals(true, response.getVerified());
    }

    @Test
    @Order(8)
    @DisplayName("An APPROVED farmer can create products, which appear for buyers")
    void approvedFarmer_canCreateProduct_visibleToBuyers() {

        var product = productService.createProduct(
                productRequest("Verified Rice", 60.0, 20),
                FARMER_EMAIL
        );

        approvedProductId = product.getId();
        assertTrue(product.getFarmerVerified());

        // Visible to buyers (list + details)
        List<com.farmbridge.dto.ProductResponse> all =
                productService.getAllProducts();

        assertTrue(
                all.stream().anyMatch(p -> p.getId().equals(approvedProductId)),
                "Buyer list must contain the approved farmer's product"
        );

        assertDoesNotThrow(() ->
                productService.getBuyerProductById(approvedProductId)
        );
    }

    // ==========================================
    // BUYER VISIBILITY OF UNVERIFIED PRODUCTS
    // ==========================================

    @Test
    @Order(9)
    @DisplayName("Products of unapproved farmers are hidden from buyer listings and details")
    void unapprovedFarmerProducts_hiddenFromBuyers() {

        // Bypass the service guard to simulate legacy data — a product owned
        // by a farmer whose profile is not APPROVED
        Product legacy = new Product();
        legacy.setName("Legacy Unverified Wheat");
        legacy.setPrice(40.0);
        legacy.setQuantity(15);
        legacy.setCategory("Grains");
        legacy.setFarmer(unverifiedFarmer);
        Long legacyId = productRepository.save(legacy).getId();

        assertFalse(
                productService.getAllProducts().stream()
                        .anyMatch(p -> p.getId().equals(legacyId)),
                "Unverified farmer's product must not appear in the buyer list"
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                productService.getBuyerProductById(legacyId)
        );

        assertEquals("Product not found", ex.getMessage());
    }

    @Test
    @Order(10)
    @DisplayName("An account with no verification profile cannot create products")
    void noProfileFarmer_cannotCreateProduct() {

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                productService.createProduct(
                        productRequest("Wheat", 30.0, 5),
                        UNVERIFIED_EMAIL
                )
        );

        assertEquals(
                "Your farmer account has not been verified yet.",
                ex.getMessage()
        );
    }
}
