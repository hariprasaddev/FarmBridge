package com.farmbridge.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    // Public URL prefix under which locally-stored images are served
    // (mapped to the upload directory in WebConfig).
    private static final String PUBLIC_URL_PREFIX = "/uploads/products/";

    // Public-id prefix (folder) used for Cloudinary product images.
    private static final String CLOUDINARY_PUBLIC_ID_PREFIX = "products/";

    private final Path uploadRoot;

    // Null when Cloudinary is not configured — the service then behaves
    // exactly like the original local-filesystem implementation.
    private final Cloudinary cloudinary;

    public FileStorageService(
            @Value("${file.upload-dir:uploads/products}") String uploadDir,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {

        this.uploadRoot = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        this.cloudinary = (cloudName == null || cloudName.isBlank())
                ? null
                : new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true));
    }

    /** Whether persistent Cloudinary storage is enabled (prod) vs local FS (dev/tests). */
    public boolean isCloudinaryEnabled() {
        return cloudinary != null;
    }

    /**
     * Stores an uploaded image and returns its public URL:
     * - Cloudinary mode: uploads the image and returns its secure HTTPS
     *   CDN URL, e.g.
     *   https://res.cloudinary.com/<cloud>/image/upload/v<ts>/products/<uuid>.<ext>
     * - Local mode: writes the file under the upload directory and returns
     *   the relative path, e.g. /uploads/products/<uuid>.<ext>.
     * In both modes only the returned URL string is ever persisted.
     */
    public String storeImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException(
                    "Please select an image file to upload"
            );
        }

        String format = detectImageFormat(file);

        if (format == null) {
            throw new RuntimeException(
                    "Only image files (JPG, PNG, WEBP, GIF) are allowed"
            );
        }

        String uuid = UUID.randomUUID().toString();

        if (cloudinary != null) {
            return uploadToCloudinary(file, uuid);
        }

        String filename = uuid + "." + format;

        try {
            Files.createDirectories(uploadRoot);

            Path target = uploadRoot.resolve(filename);

            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target,
                        StandardCopyOption.REPLACE_EXISTING);
            }

            return PUBLIC_URL_PREFIX + filename;

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to store the uploaded image",
                    e
            );
        }
    }

    /**
     * Uploads the image bytes to Cloudinary under a unique public id.
     * The secure_url returned by Cloudinary is the public HTTPS URL.
     */
    private String uploadToCloudinary(MultipartFile file, String uuid) {

        String publicId = CLOUDINARY_PUBLIC_ID_PREFIX + uuid;

        try (InputStream in = file.getInputStream()) {

            Map<?, ?> result = cloudinary.uploader().upload(
                    in,
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "resource_type", "image",
                            "overwrite", true
                    )
            );

            Object secureUrl = result.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException(
                        "Failed to store the uploaded image"
                );
            }

            return secureUrl.toString();

        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException(
                    "Failed to store the uploaded image",
                    e
            );
        }
    }

    /**
     * Deletes a previously stored image (Cloudinary asset or local file).
     * No-op when the imageUrl is blank or the asset does not exist.
     */
    public void deleteImage(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        if (isCloudinaryUrl(imageUrl)) {
            deleteFromCloudinary(imageUrl);
            return;
        }

        Path file = toStoragePath(imageUrl);

        if (file == null) {
            return;
        }

        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // Deleting a stale image must never break the main operation.
        }
    }

    // ==========================================
    // CLOUDINARY HELPERS
    // ==========================================

    private boolean isCloudinaryUrl(String url) {
        return url.startsWith("https://res.cloudinary.com/")
                || url.startsWith("http://res.cloudinary.com/");
    }

    private void deleteFromCloudinary(String imageUrl) {

        String publicId = extractPublicId(imageUrl);

        if (publicId == null) {
            return;
        }

        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.emptyMap()
            );
        } catch (Exception ignored) {
            // Deleting a stale image must never break the main operation.
        }
    }

    /**
     * Extracts the Cloudinary public id from a secure image URL, e.g.
     * https://res.cloudinary.com/<cloud>/image/upload/v1234/products/abc.jpg
     * -> "products/abc" (Cloudinary stores the public id without extension).
     */
    private String extractPublicId(String url) {

        String marker = "/image/upload/";
        int idx = url.indexOf(marker);

        if (idx < 0) {
            return null;
        }

        String path = url.substring(idx + marker.length());

        // Strip the optional version segment (v<number>/)
        int firstSlash = path.indexOf('/');
        if (firstSlash > 0
                && path.startsWith("v")
                && path.substring(0, firstSlash).matches("v\\d+")) {
            path = path.substring(firstSlash + 1);
        }

        // Strip the file extension to match the stored public id
        int dot = path.lastIndexOf('.');
        if (dot > 0) {
            path = path.substring(0, dot);
        }

        return path;
    }

    // ==========================================
    // LOCAL-FILESYSTEM HELPERS
    // ==========================================

    private Path toStoragePath(String imageUrl) {

        if (!imageUrl.startsWith(PUBLIC_URL_PREFIX)) {
            return null;
        }

        String filename = imageUrl.substring(
                PUBLIC_URL_PREFIX.length()
        );

        // Guard against path traversal
        Path path = uploadRoot.resolve(filename).normalize();

        return path.startsWith(uploadRoot) ? path : null;
    }

    /**
     * Reads the file header and returns the detected image format
     * ("jpg", "png", "gif" or "webp"), or null when the file is not a
     * supported image. Magic-byte validation prevents disguised files.
     */
    private String detectImageFormat(MultipartFile file) {

        try (InputStream in = file.getInputStream()) {

            byte[] header = in.readNBytes(12);

            if (isPng(header)) return "png";
            if (isJpeg(header)) return "jpg";
            if (isGif(header)) return "gif";
            if (isWebp(header)) return "webp";
            return null;

        } catch (IOException e) {
            return null;
        }
    }

    private boolean isPng(byte[] h) {
        return h.length >= 8
                && (h[0] & 0xFF) == 0x89
                && h[1] == 0x50
                && h[2] == 0x4E
                && h[3] == 0x47
                && h[4] == 0x0D
                && h[5] == 0x0A
                && h[6] == 0x1A
                && h[7] == 0x0A;
    }

    private boolean isJpeg(byte[] h) {
        return h.length >= 3
                && (h[0] & 0xFF) == 0xFF
                && (h[1] & 0xFF) == 0xD8
                && (h[2] & 0xFF) == 0xFF;
    }

    private boolean isGif(byte[] h) {
        return h.length >= 6
                && h[0] == 0x47
                && h[1] == 0x49
                && h[2] == 0x46
                && h[3] == 0x38
                && (h[4] == 0x37 || h[4] == 0x39)
                && h[5] == 0x61;
    }

    private boolean isWebp(byte[] h) {
        return h.length >= 12
                && h[0] == 0x52
                && h[1] == 0x49
                && h[2] == 0x46
                && h[3] == 0x46
                && h[8] == 0x57
                && h[9] == 0x45
                && h[10] == 0x42
                && h[11] == 0x50;
    }
}
