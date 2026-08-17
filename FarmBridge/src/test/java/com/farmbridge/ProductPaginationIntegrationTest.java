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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Server-side pagination and sorting of the buyer catalog
 * (GET /api/buyer/products?page&size&sort&category).
 *
 * The shared dev DB may contain other products, so assertions are relative
 * to the five products seeded here: they must all appear exactly once across
 * the pages, never include the hidden (unapproved) product, and sort
 * correctly when requested.
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@AutoConfigureMockMvc
class ProductPaginationIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    private static final String FARMER_EMAIL = "paging.farmer." + TS + "@example.com";
    private static final String HIDDEN_FARMER_EMAIL = "paging.hidden." + TS + "@example.com";
    private static final String BUYER_EMAIL = "paging.buyer." + TS + "@example.com";
    private static final String PASSWORD = "PagingPass123!";

    @Autowired private ProductService productService;
    @Autowired private UserRepository userRepository;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Five approved-farmer products (3 Fruits, 2 Vegetables) + 1 hidden.
    private final List<Long> seededIds = new ArrayList<>();
    private Long hiddenFigId;

    @BeforeAll
    void seed() {
        User farmer = saveUser("Paging Farmer", FARMER_EMAIL, Role.FARMER);
        User hiddenFarmer = saveUser("Hidden Paging Farmer", HIDDEN_FARMER_EMAIL, Role.FARMER);
        saveUser("Paging Buyer", BUYER_EMAIL, Role.BUYER);

        FarmerProfile approved = new FarmerProfile();
        approved.setUser(farmer);
        approved.setFarmName("Paging Farm");
        approved.setLocation("Hyderabad");
        approved.setVerified(true);
        approved.setVerificationStatus(VerificationStatus.APPROVED);
        farmerProfileRepository.save(approved);

        FarmerProfile hidden = new FarmerProfile();
        hidden.setUser(hiddenFarmer);
        hidden.setFarmName("Hidden Farm");
        hidden.setLocation("Hidden");
        hidden.setVerified(false);
        hidden.setVerificationStatus(VerificationStatus.PENDING);
        farmerProfileRepository.save(hidden);

        // Names chosen so the alphabetical sort is unambiguous.
        seededIds.add(productService.createProduct(
                productRequest("Paged Apple", 100.0, 10, "Fruits"), FARMER_EMAIL).getId());
        seededIds.add(productService.createProduct(
                productRequest("Paged Banana", 50.0, 10, "Fruits"), FARMER_EMAIL).getId());
        seededIds.add(productService.createProduct(
                productRequest("Paged Carrot", 30.0, 10, "Vegetables"), FARMER_EMAIL).getId());
        seededIds.add(productService.createProduct(
                productRequest("Paged Dates", 200.0, 10, "Fruits"), FARMER_EMAIL).getId());
        seededIds.add(productService.createProduct(
                productRequest("Paged Eggplant", 10.0, 10, "Vegetables"), FARMER_EMAIL).getId());

        // Hidden product — inserted directly to simulate legacy data.
        Product fig = new Product();
        fig.setName("Hidden Paged Fig");
        fig.setDescription("Must never be paginated for buyers");
        fig.setPrice(99.0);
        fig.setQuantity(10);
        fig.setCategory("Fruits");
        fig.setFarmer(hiddenFarmer);
        hiddenFigId = productRepository.save(fig).getId();
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
            String name, double price, int quantity, String category) {

        com.farmbridge.dto.ProductRequest request =
                new com.farmbridge.dto.ProductRequest();
        request.setName(name);
        request.setDescription("Pagination test product");
        request.setPrice(price);
        request.setQuantity(quantity);
        request.setCategory(category);
        return request;
    }

    private String buyerToken() {
        return jwtUtil.generateToken(BUYER_EMAIL, "BUYER");
    }

    private JsonNode getPage(String query) throws Exception {
        return objectMapper.readTree(
                mockMvc.perform(get("/api/buyer/products" + query)
                                .header("Authorization", "Bearer " + buyerToken()))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );
    }

    private List<Long> idsOf(JsonNode content) {
        List<Long> ids = new ArrayList<>();
        for (JsonNode node : content) {
            ids.add(node.get("id").asLong());
        }
        return ids;
    }

    // ==========================================
    // SERVICE-LEVEL PAGE METADATA
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Service page returns content, exact size and a total that excludes unapproved farmers")
    void servicePage_metadata() {
        Page<ProductResponse> page = productService.getAllProducts(
                null,
                PageRequest.of(0, 2, Sort.by("id"))
        );

        assertEquals(2, page.getContent().size());
        assertTrue(page.getTotalElements() >= 5,
                "Total must count at least the 5 seeded approved products");
        assertFalse(page.getContent().stream()
                        .anyMatch(p -> p.getId().equals(hiddenFigId)),
                "Unapproved farmer's product must never be counted or returned");
        assertTrue(page.getTotalPages() >= 3, "5 products at size 2 need >= 3 pages");
    }

    // ==========================================
    // ENDPOINT — PAGING
    // ==========================================

    @Test
    @Order(2)
    @DisplayName("page=0&size=2 returns the first page with correct metadata")
    void page0_returnsFirstPage() throws Exception {
        JsonNode body = getPage("?page=0&size=2&sort=id");

        assertEquals(0, body.get("number").asInt());
        assertEquals(2, body.get("size").asInt());
        assertEquals(2, body.get("content").size());
        assertTrue(body.get("first").asBoolean());
        assertTrue(body.get("totalElements").asLong() >= 5);
    }

    @Test
    @Order(3)
    @DisplayName("Every seeded product appears exactly once across all pages")
    void allSeededProducts_spanAllPages() throws Exception {
        // Walk the pages the server actually reports — robust even though
        // the shared dev DB contains unrelated approved products.
        JsonNode first = getPage("?page=0&size=4&sort=id");
        int totalPages = first.get("totalPages").asInt();
        assertTrue(totalPages >= 2, "5 seeded products at size 4 need >= 2 pages");

        List<Long> seen = new ArrayList<>();
        for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            JsonNode body = getPage("?page=" + pageIndex + "&size=4&sort=id");
            seen.addAll(idsOf(body.get("content")));
        }

        for (Long id : seededIds) {
            assertEquals(1, seen.stream().filter(seenId -> seenId.equals(id)).count(),
                    "Seeded product " + id + " must appear exactly once across pages");
        }
        assertFalse(seen.contains(hiddenFigId),
                "Hidden product must never appear on any page");
    }

    @Test
    @Order(4)
    @DisplayName("size is respected and the default pageable applies when no params are sent")
    void sizeAndDefaults() throws Exception {
        JsonNode size5 = getPage("?size=5");
        assertEquals(5, size5.get("content").size());

        // No params at all → the @PageableDefault(size = 12) applies.
        JsonNode defaults = getPage("");
        assertEquals(12, defaults.get("size").asInt());
        assertFalse(defaults.get("content").isEmpty());
    }

    // ==========================================
    // ENDPOINT — SORTING
    // ==========================================

    @Test
    @Order(5)
    @DisplayName("sort=name,asc orders the seeded products alphabetically")
    void sortByNameAsc() throws Exception {
        // One large page so the sort is exercised across the whole catalog
        // (the shared dev DB contains unrelated products).
        JsonNode body = getPage("?size=1000&sort=name,asc");
        List<JsonNode> mine = new ArrayList<>();
        for (JsonNode node : body.get("content")) {
            if (seededIds.contains(node.get("id").asLong())) {
                mine.add(node);
            }
        }

        assertEquals(5, mine.size(), "All five seeded products must be returned");
        for (int i = 1; i < mine.size(); i++) {
            assertTrue(
                    mine.get(i - 1).get("name").asText().compareTo(
                            mine.get(i).get("name").asText()) <= 0,
                    "Names must be sorted ascending"
            );
        }
        // First seeded product alphabetically is "Paged Apple".
        assertEquals("Paged Apple", mine.get(0).get("name").asText());
    }

    @Test
    @Order(6)
    @DisplayName("sort=price,desc puts the most expensive seeded product first")
    void sortByPriceDesc() throws Exception {
        JsonNode body = getPage("?size=1000&sort=price,desc");
        JsonNode firstMine = null;
        for (JsonNode node : body.get("content")) {
            if (seededIds.contains(node.get("id").asLong())) {
                firstMine = node;
                break;
            }
        }

        assertNotNull(firstMine, "At least one seeded product must be returned");
        assertEquals(200.0, firstMine.get("price").asDouble(), 0.001,
                "Paged Dates (200) is the most expensive seeded product");
    }

    // ==========================================
    // ENDPOINT — CATEGORY FILTER
    // ==========================================

    @Test
    @Order(7)
    @DisplayName("category=Fruits filters server-side and keeps totals exact")
    void categoryFilter() throws Exception {
        JsonNode body = getPage("?category=Fruits&size=10&sort=id");

        assertTrue(body.get("totalElements").asLong() >= 3,
                "Fruits filter must count at least the 3 seeded Fruits products");
        for (JsonNode node : body.get("content")) {
            assertEquals("Fruits", node.get("category").asText());
        }
        // The Vegetables products must be filtered out.
        assertTrue(idsOf(body.get("content")).stream()
                        .noneMatch(id -> seededIds.contains(id) && !isFruits(id)),
                "No Vegetables product may appear under category=Fruits");
    }

    private boolean isFruits(Long id) {
        // ids were seeded in the fixed order [Apple, Banana, Carrot, Dates, Eggplant]
        int idx = seededIds.indexOf(id);
        return idx == 0 || idx == 1 || idx == 3;
    }

    // ==========================================
    // ENDPOINT — AUTHORIZATION
    // ==========================================

    @Test
    @Order(8)
    @DisplayName("Pagination endpoint requires the BUYER role (403 otherwise)")
    void endpoint_requiresBuyerRole() throws Exception {
        String farmerToken = jwtUtil.generateToken(FARMER_EMAIL, "FARMER");

        mockMvc.perform(get("/api/buyer/products")
                        .param("page", "0"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/buyer/products")
                        .param("page", "0")
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isForbidden());
    }
}
