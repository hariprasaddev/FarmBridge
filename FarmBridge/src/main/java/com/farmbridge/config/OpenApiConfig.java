package com.farmbridge.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer JWT";

    @Bean
    public OpenAPI farmBridgeOpenAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("FarmBridge API")
                        .description(
                                "FarmBridge is a direct digital agricultural marketplace " +
                                "that connects farmers with buyers, reducing the need for " +
                                "unnecessary intermediaries."
                        )
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("FarmBridge Team")
                                .email("support@farmbridge.com")
                        )
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")
                        )
                )
                // Define the JWT Bearer token security scheme
                // (No global requirement — public auth endpoints don't need a lock.
                //  Use the "Authorize" button in Swagger UI to enter a JWT
                //  before testing protected endpoints.)
                .components(new Components()
                        .addSecuritySchemes(
                                SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description(
                                                "Enter your JWT token obtained from " +
                                                "POST /api/auth/login"
                                        )
                        )
                );
    }
}
