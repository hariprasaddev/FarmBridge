package com.farmbridge;

import com.farmbridge.dto.ProductResponse;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.security.JwtUtil;
import com.farmbridge.service.ProductService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Product search (GET /api/buyer/products/search?name=...) — end-to-end.
 *
 * Covers the four guarantees of the search API:
 *  - case-insensitive partial name matching
 *  - empty results for unmatched terms
 *  - buyer-visibility rules (only APPROVED farmers' products are returned)
 *  - role authorization (BUYER only, enforced by SecurityConfig path rules)
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@AutoConfigureMockMvc
class ProductSearchIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    private static final String FARMER_EMAIL = "search.farmer." + TS + "@example.com";
    private static final String HIDDEN_FARMER_EMAIL = "search.hidden." + TS + "@example.com";
    private static final String BUYER_EMAIL = "search.buyer." + TS + "@example.com";
    private static final String PASSWORD = "SearchPass123!";

    @Autowired private ProductService productService;
    @Autowired private UserRepository userRepository;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Long approvedRiceId;
    private Long hiddenMilletId;

    @BeforeAll
    void seed() {
        User farmer = saveUser("Search Farmer", FARMER_EMAIL, Role.FARMER);
        User hiddenFarmer = saveUser("Hidden Farmer", HIDDEN_FARMER_EMAIL, Role.FARMER);
        saveUser("Search Buyer", BUYER_EMAIL, Role.BUYER);

        // Approved farmer — their products are buyer-visible.
        FarmerProfile approved = new FarmerProfile();
        approved.setUser(farmer);
        approved.setFarmName("Search Farm");
        approved.setLocation("Hyderabad");
        approved.setVerified(true);
        approved.setVerificationStatus(VerificationStatus.APPROVED);
        farmerProfileRepository.save(approved);

        // PENDING farmer — their products must never appear in buyer search.
        FarmerProfile hidden = new FarmerProfile();
        hidden.setUser(hiddenFarmer);
        hidden.setFarmName("Hidden Farm");
        hidden.setLocation("Hidden");
        hidden.setVerified(false);
        hidden.setVerificationStatus(VerificationStatus.PENDING);
        farmerProfileRepository.save(hidden);

        // Two searchable products from the approved farmer.
        approvedRiceId = productService.createProduct(
                productRequest("Fresh Red Rice", 80.0, 50),
                FARMER_EMAIL
        ).getId();
        productService.createProduct(
                productRequest("Green Wheat", 60.0, 40),
                FARMER_EMAIL
        ).getId();

        // One product from the PENDING farmer, inserted directly through the
        // repository to simulate legacy data that bypassed the service guard.
        Product hiddenMillet = new Product();
        hiddenMillet.setName("Hidden Millet");
        hiddenMillet.setDescription("Must never be searchable");
        hiddenMillet.setPrice(30.0);
        hiddenMillet.setQuantity(20);
        hiddenMillet.setCategory("Grains");
        hiddenMillet.setFarmer(hiddenFarmer);
        hiddenMilletId = productRepository.save(hiddenMillet).getId();
    }

    @AfterAll
    void cleanup() {
        transactionTemplate.executeWithoutResult(status -> {
            productRepository.deleteAll(
                    productRepository.findByFarmerEmail(FARMER_EMAIL)
            );
            productRepository.deleteAll(
                    productRepository.findByFarmerEmail(HIDDEN_FARMER_EMAIL)
            );
            farmerProfileRepository.findByUserEmail(FARMER_EMAIL)
                    .ifPresent(farmerProfileRepository::delete);
            farmerProfileRepository.findByUserEmail(HIDDEN_FARMER_EMAIL)
                    .ifPresent(farmerProfileRepository::delete);
            userRepository.findByEmail(FARMER_EMAIL)
                    .ifPresent(userRepository::delete);
            userRepository.findByEmail(HIDDEN_FARMER_EMAIL)
                    .ifPresent(userRepository::delete);
            userRepository.findByEmail(BUYER_EMAIL)
                    .ifPresent(userRepository::delete);
        });
    }

    private User saveUser(String name, String email, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        return userRepository.save(user);
    }

    private com.farmbridge.dto.ProductRequest productRequest(
            String name, double price, int quantity) {

        com.farmbridge.dto.ProductRequest request =
                new com.farmbridge.dto.ProductRequest();
        request.setName(name);
        request.setDescription("Search test product");
        request.setPrice(price);
        request.setQuantity(quantity);
        request.setCategory("Grains");
        return request;
    }

    // ==========================================
    // SERVICE-LEVEL SEARCH BEHAVIOUR
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Search matches the approved farmer's product by partial name")
    void search_matchesByPartialName() {
        List<ProductResponse> results =
                productService.searchProductsByName("Red Rice");

        assertTrue(results.stream().anyMatch(p -> p.getId().equals(approvedRiceId)),
                "Search must return the matching approved product");
        assertTrue(results.stream().noneMatch(p -> "Green Wheat".equals(p.getName())),
                "Non-matching product must not appear");
    }

    @Test
    @Order(2)
    @DisplayName("Search is case-insensitive (RICE / rIcE return the same product)")
    void search_isCaseInsensitive() {
        List<ProductResponse> upper =
                productService.searchProductsByName("RICE");
        List<ProductResponse> mixed =
                productService.searchProductsByName("rIcE");

        assertTrue(upper.stream().anyMatch(p -> p.getId().equals(approvedRiceId)),
                "Uppercase query must match");
        assertTrue(mixed.stream().anyMatch(p -> p.getId().equals(approvedRiceId)),
                "Mixed-case query must match");
    }

    @Test
    @Order(3)
    @DisplayName("Search with no matches returns an empty list")
    void search_noMatches_returnsEmpty() {
        List<ProductResponse> results =
                productService.searchProductsByName("zzzz-not-a-product");

        assertTrue(results.isEmpty(), "Unmatched terms must return an empty list");
    }

    @Test
    @Order(4)
    @DisplayName("Products of unapproved farmers are excluded from search results")
    void search_excludesUnapprovedFarmerProducts() {
        List<ProductResponse> results =
                productService.searchProductsByName("Hidden Millet");

        assertTrue(results.stream().noneMatch(p -> p.getId().equals(hiddenMilletId)),
                "A PENDING farmer's product must never be searchable by buyers");
    }

    // ==========================================
    // ENDPOINT — AUTHORIZATION & RESPONSE
    // ==========================================

    @Test
    @Order(5)
    @DisplayName("Search endpoint requires the BUYER role (403 otherwise) and returns ProductResponse")
    void searchEndpoint_requiresBuyerRole() throws Exception {
        String buyerToken = jwtUtil.generateToken(BUYER_EMAIL, "BUYER");
        String farmerToken = jwtUtil.generateToken(FARMER_EMAIL, "FARMER");

        // 1. No token → rejected.
        mockMvc.perform(get("/api/buyer/products/search")
                        .param("name", "rice"))
                .andExpect(status().isForbidden());

        // 2. FARMER on /api/buyer/** → rejected.
        mockMvc.perform(get("/api/buyer/products/search")
                        .param("name", "rice")
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isForbidden());

        // 3. BUYER → 200 with the matching approved product.
        JsonNode body = objectMapper.readTree(
                mockMvc.perform(get("/api/buyer/products/search")
                                .param("name", "rice")
                                .header("Authorization", "Bearer " + buyerToken))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        assertTrue(body.isArray(), "Search must return a JSON array of ProductResponse");
        boolean found = false;
        for (JsonNode node : body) {
            if (node.get("id").asLong() == approvedRiceId) {
                found = true;
                assertEquals("Fresh Red Rice", node.get("name").asText());
            }
        }
        assertTrue(found, "Response must contain the approved rice product");
    }

    @Test
    @Order(6)
    @DisplayName("Search endpoint never leaks unapproved farmers' products")
    void searchEndpoint_hidesUnapprovedProducts() throws Exception {
        String buyerToken = jwtUtil.generateToken(BUYER_EMAIL, "BUYER");

        JsonNode body = objectMapper.readTree(
                mockMvc.perform(get("/api/buyer/products/search")
                                .param("name", "millet")
                                .header("Authorization", "Bearer " + buyerToken))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        boolean leaked = false;
        for (JsonNode node : body) {
            if (node.get("id").asLong() == hiddenMilletId) {
                leaked = true;
            }
        }
        assertFalse(leaked, "Unapproved farmer's product must not be searchable via the API");
    }
}
