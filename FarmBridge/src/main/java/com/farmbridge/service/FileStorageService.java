package com.farmbridge.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    // Public URL prefix under which stored images are served
    // (mapped to the upload directory in WebConfig).
    private static final String PUBLIC_URL_PREFIX = "/uploads/products/";

    private final Path uploadRoot;

    public FileStorageService(
            @Value("${file.upload-dir:uploads/products}") String uploadDir) {

        this.uploadRoot = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();
    }

    /**
     * Stores an uploaded image on the local filesystem using a UUID filename.
     * The file extension is derived from the detected image format, so the
     * served content type always matches the actual content.
     * Returns the public URL path (e.g. /uploads/products/xxxx.png).
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

        String filename = UUID.randomUUID() + "." + format;

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
     * Deletes a previously stored image file. No-op when the imageUrl
     * is blank or the file does not exist.
     */
    public void deleteImage(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
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
    // HELPERS
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
