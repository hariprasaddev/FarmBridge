package com.farmbridge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Public URL prefix under which stored product images are served.
    // Must match FileStorageService.PUBLIC_URL_PREFIX.
    private static final String PUBLIC_URL_PREFIX = "/uploads/products/";

    private final Path uploadRoot;

    public WebConfig(
            @Value("${file.upload-dir:uploads/products}") String uploadDir) {

        this.uploadRoot = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Expose uploaded product images:
        // /uploads/products/** -> file:<uploadRoot>/
        // (The pattern must include "products/" so that the captured path
        //  resolves directly inside the upload directory.)
        String location = uploadRoot.toUri().toString();

        if (!location.endsWith("/")) {
            location = location + "/";
        }

        registry.addResourceHandler(PUBLIC_URL_PREFIX + "**")
                .addResourceLocations(location);
    }
}
