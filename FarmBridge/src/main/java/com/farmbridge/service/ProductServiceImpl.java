package com.farmbridge.service;

import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.ProductResponse;
import com.farmbridge.dto.RatingStats;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.ReviewRepository;
import com.farmbridge.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final FarmerProfileRepository farmerProfileRepository;
    private final ReviewRepository reviewRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            FarmerProfileRepository farmerProfileRepository,
            ReviewRepository reviewRepository) {

        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.farmerProfileRepository = farmerProfileRepository;
        this.reviewRepository = reviewRepository;
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    @Override
    public ProductResponse createProduct(
            ProductRequest request,
            String email) {

        // Find logged-in farmer using email
        User farmer = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Only APPROVED farmers may list products for sale
        assertFarmerVerified(email);

        // Create Product entity
        Product product = new Product();

        product.setName(
                request.getName()
        );

        product.setDescription(
                request.getDescription()
        );

        product.setPrice(
                request.getPrice()
        );

        product.setQuantity(
                request.getQuantity()
        );

        product.setCategory(
                request.getCategory()
        );

        // Connect product with logged-in farmer
        product.setFarmer(farmer);

        // Save product to database
        Product savedProduct =
                productRepository.save(product);

        // Return response
        return toProductResponse(savedProduct);
    }

    // ==========================================
    // UPDATE MY PRODUCT
    // ==========================================

    @Override
    public ProductResponse updateProduct(
            Long id,
            ProductRequest request,
            String email) {

        // Only APPROVED farmers may manage product listings
        assertFarmerVerified(email);

        // Find the product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check if this product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to update this product"
            );
        }

        // Update product details
        product.setName(request.getName());

        product.setDescription(
                request.getDescription()
        );

        product.setPrice(
                request.getPrice()
        );

        product.setQuantity(
                request.getQuantity()
        );

        product.setCategory(
                request.getCategory()
        );

        // Save updated product
        Product updatedProduct =
                productRepository.save(product);

        // Return response
        return toProductResponse(updatedProduct);
    }

    // ==========================================
    // DELETE MY PRODUCT
    // ==========================================

    @Override
    public void deleteProduct(
            Long id,
            String email) {

        // Only APPROVED farmers may manage product listings
        assertFarmerVerified(email);

        // Find product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to delete this product"
            );
        }

        // Delete product
        productRepository.delete(product);

        // Delete the stored image file (if any)
        fileStorageService.deleteImage(
                product.getImageUrl()
        );
    }

    // ==========================================
    // UPLOAD PRODUCT IMAGE
    // ==========================================

    @Override
    public ProductResponse uploadProductImage(
            Long id,
            MultipartFile file,
            String email) {

        // Only APPROVED farmers may manage product listings
        assertFarmerVerified(email);

        // Find the product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check if this product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to update this product"
            );
        }

        // Store the new image
        String imageUrl =
                fileStorageService.storeImage(file);

        // Remember the old image for cleanup after save
        String oldImageUrl = product.getImageUrl();

        // Attach the new image to the product
        product.setImageUrl(imageUrl);

        Product savedProduct;

        try {
            savedProduct = productRepository.save(product);
        } catch (RuntimeException e) {
            // Clean up the just-stored file if the save fails
            fileStorageService.deleteImage(imageUrl);
            throw e;
        }

        // Remove the old image file only after a successful save
        if (oldImageUrl != null) {
            fileStorageService.deleteImage(oldImageUrl);
        }

        return toProductResponse(savedProduct);
    }

    // ==========================================
    // DELETE PRODUCT IMAGE
    // ==========================================

    @Override
    public ProductResponse deleteProductImage(
            Long id,
            String email) {

        // Only APPROVED farmers may manage product listings
        assertFarmerVerified(email);

        // Find the product
        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Check if this product belongs to logged-in farmer
        if (!product.getFarmer().getEmail().equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to update this product"
            );
        }

        // Remove the image reference from the product
        String imageUrl = product.getImageUrl();

        product.setImageUrl(null);

        Product savedProduct =
                productRepository.save(product);

        // Delete the image file after a successful save
        if (imageUrl != null) {
            fileStorageService.deleteImage(imageUrl);
        }

        return toProductResponse(savedProduct);
    }

    // ==========================================
    // GET PRODUCT BY ID
    // ==========================================

    @Override
    public ProductResponse getProductById(Long id) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        return toProductResponse(product);
    }

    // ==========================================
    // GET PRODUCT BY ID (BUYER VIEW)
    // Only products of APPROVED farmers are visible to buyers.
    // ==========================================

    @Override
    public ProductResponse getBuyerProductById(Long id) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(List.of(product))
                );

        if (!isFromApprovedFarmer(product, profiles)) {
            // Hidden from buyers — same 404 as a missing product
            throw new RuntimeException("Product not found");
        }

        return toProductResponse(product);
    }

    // ==========================================
    // GET ALL PRODUCTS
    // ==========================================

    @Override
    public List<ProductResponse> getAllProducts() {

        List<Product> products =
                productRepository.findAll();

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        // Buyers only see products from APPROVED farmers
        List<Product> approved =
                filterApprovedProducts(products, profiles);

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        approved.stream()
                                .map(Product::getId)
                                .toList()
                );

        return approved.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // GET ALL PRODUCTS — PAGINATED (BUYER BROWSE)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(
            String category,
            Pageable pageable) {

        // Approval + optional category filter happen in the query, so
        // totalElements is exact (no in-memory filtering on the page).
        Page<Product> page =
                productRepository.findBuyerVisible(category, pageable);

        List<Product> products = page.getContent();

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        products.stream()
                                .map(Product::getId)
                                .toList()
                );

        List<ProductResponse> content = products.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();

        return new PageImpl<>(
                content,
                pageable,
                page.getTotalElements()
        );
    }

    // ==========================================
    // GET BUYER-VISIBLE CATEGORIES
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<String> getBuyerVisibleCategories() {

        return productRepository.findBuyerVisibleCategories();
    }

    // ==========================================
    // GET ALL PRODUCTS (ADMIN OVERSIGHT)
    // Unfiltered — includes products of unverified farmers so admins
    // retain full visibility over the platform.
    // ==========================================

    @Override
    public List<ProductResponse> getAllProductsForAdmin() {

        List<Product> products =
                productRepository.findAll();

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        products.stream()
                                .map(Product::getId)
                                .toList()
                );

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        return products.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // GET PRODUCTS OF LOGGED-IN FARMER
    // ==========================================

    @Override
    public List<ProductResponse> getMyProducts(String email) {

        List<Product> products =
                productRepository.findByFarmerEmail(email);

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        products.stream()
                                .map(Product::getId)
                                .toList()
                );

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        return products.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // GET PRODUCTS BY CATEGORY
    // ==========================================

    @Override
    public List<ProductResponse> getProductsByCategory(
            String category) {

        List<Product> products =
                productRepository
                        .findByCategoryIgnoreCase(category);

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        List<Product> approved =
                filterApprovedProducts(products, profiles);

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        approved.stream()
                                .map(Product::getId)
                                .toList()
                );

        return approved.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // SEARCH PRODUCTS BY NAME
    // ==========================================

    @Override
    public List<ProductResponse> searchProductsByName(
            String name) {

        List<Product> products =
                productRepository
                        .findByNameContainingIgnoreCase(name);

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        List<Product> approved =
                filterApprovedProducts(products, profiles);

        Map<Long, RatingStats> stats =
                loadRatingStats(
                        approved.stream()
                                .map(Product::getId)
                                .toList()
                );

        return approved.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // GET PRODUCTS BY IDS
    // ==========================================

    @Override
    public List<ProductResponse> getProductsByIds(
            Collection<Long> ids) {

        // Skip the query entirely when there are no ids
        if (ids.isEmpty()) {
            return List.of();
        }

        List<Product> products =
                productRepository.findAllById(ids);

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(products)
                );

        // Wishlist lookups must not leak products of unverified farmers
        List<Product> approved =
                filterApprovedProducts(products, profiles);

        // Load rating stats for all visible products in one query
        Map<Long, RatingStats> stats =
                loadRatingStats(
                        approved.stream()
                                .map(Product::getId)
                                .toList()
                );

        return approved.stream()
                .map(product ->
                        toProductResponse(product, stats, profiles)
                )
                .toList();
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private ProductResponse toProductResponse(Product product) {

        Map<Long, RatingStats> stats =
                loadRatingStats(List.of(product.getId()));

        Map<String, FarmerProfile> profiles =
                loadFarmerProfiles(
                        farmerEmailsOf(List.of(product))
                );

        return toProductResponse(product, stats, profiles);
    }

    // ==========================================
    // HELPER — Load rating stats in a single query
    // ==========================================

    private Map<Long, RatingStats> loadRatingStats(
            Collection<Long> productIds) {

        // Skip the query entirely when there are no products
        if (productIds.isEmpty()) {
            return Map.of();
        }

        return reviewRepository
                .findRatingStatsForProducts(productIds)
                .stream()
                .collect(Collectors.toMap(
                        RatingStats::getProductId,
                        stats -> stats
                ));
    }

    // ==========================================
    // HELPER — Load farmer profiles in a single query
    // ==========================================

    private Map<String, FarmerProfile> loadFarmerProfiles(
            Collection<String> emails) {

        // Skip the query entirely when there are no farmers
        if (emails.isEmpty()) {
            return Map.of();
        }

        return farmerProfileRepository
                .findByUserEmailIn(emails)
                .stream()
                .collect(Collectors.toMap(
                        profile -> profile.getUser().getEmail(),
                        Function.identity()
                ));
    }

    // ==========================================
    // HELPER — Assert the farmer is ACTIVE and APPROVED (selling allowed)
    // ==========================================

    private void assertFarmerVerified(String email) {

        // SOFT DELETE: deactivated farmers cannot create, edit, delete or
        // upload images for products — their selling rights are revoked.
        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null || !user.isActive()) {
            throw new RuntimeException(
                    "Your account has been deactivated. Please contact the administrator."
            );
        }

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(email)
                .orElse(null);

        if (profile == null || !profile.isApproved()) {
            throw new RuntimeException(
                    "Your farmer account has not been verified yet."
            );
        }
    }

    // ==========================================
    // HELPER — Keep only products of APPROVED farmers
    // ==========================================

    private List<Product> filterApprovedProducts(
            List<Product> products,
            Map<String, FarmerProfile> profiles) {

        return products.stream()
                .filter(product ->
                        isFromApprovedFarmer(product, profiles)
                )
                .toList();
    }

    private boolean isFromApprovedFarmer(
            Product product,
            Map<String, FarmerProfile> profiles) {

        User farmer = product.getFarmer();

        if (farmer == null) {
            return false;
        }

        // SOFT DELETE: products of deactivated farmers disappear from every
        // buyer-visible surface (listing, search, category, details,
        // wishlist) while remaining fully visible to admins.
        if (!farmer.isActive()) {
            return false;
        }

        FarmerProfile profile =
                profiles.get(farmer.getEmail());

        return profile != null
                && profile.getVerificationStatus()
                == VerificationStatus.APPROVED;
    }

    // ==========================================
    // HELPER — Distinct farmer emails of a product list
    // ==========================================

    private List<String> farmerEmailsOf(List<Product> products) {

        return products.stream()
                .map(Product::getFarmer)
                .filter(java.util.Objects::nonNull)
                .map(User::getEmail)
                .distinct()
                .toList();
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private ProductResponse toProductResponse(
            Product product,
            Map<Long, RatingStats> statsMap,
            Map<String, FarmerProfile> profileMap) {

        User farmer = product.getFarmer();

        String farmName = null;
        String location = null;
        Boolean farmerVerified = false;

        if (farmer != null) {

            FarmerProfile profile =
                    profileMap.get(farmer.getEmail());

            if (profile != null) {
                farmName = profile.getFarmName();
                location = profile.getLocation();
                farmerVerified = profile.isApproved();
            }
        }

        // Rating summary. Products without reviews keep a null average
        // and zero counts (they simply are not part of the grouped query).
        RatingStats stats = statsMap.get(product.getId());

        Double averageRating = null;
        Long reviewCount = 0L;
        Long fiveStarCount = 0L;
        Long fourStarCount = 0L;
        Long threeStarCount = 0L;
        Long twoStarCount = 0L;
        Long oneStarCount = 0L;

        if (stats != null && stats.getReviewCount() != null) {

            reviewCount = stats.getReviewCount();
            fiveStarCount = orZero(stats.getFiveStarCount());
            fourStarCount = orZero(stats.getFourStarCount());
            threeStarCount = orZero(stats.getThreeStarCount());
            twoStarCount = orZero(stats.getTwoStarCount());
            oneStarCount = orZero(stats.getOneStarCount());

            if (reviewCount > 0 && stats.getAverageRating() != null) {
                // Round the average to one decimal place
                averageRating = Math.round(
                        stats.getAverageRating() * 10.0
                ) / 10.0;
            }
        }

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getCategory(),
                farmer != null ? farmer.getName() : null,
                product.getImageUrl(),
                farmName,
                location,
                farmerVerified,
                averageRating,
                reviewCount,
                fiveStarCount,
                fourStarCount,
                threeStarCount,
                twoStarCount,
                oneStarCount
        );
    }

    private Long orZero(Long value) {
        return value != null ? value : 0L;
    }
}
