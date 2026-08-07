# ============================================================
# FarmBridge Backend — Dockerfile
# ADF Phase 12 · Step 1 (backend Dockerization)
#
# Runtime stack (from pom.xml):
#   Java 25        -> <java.version>25</java.version>
#   Spring Boot 4.1.0
#
# Multi-stage build:
#   Stage 1 (build):   maven:3.9-eclipse-temurin-25
#                      -> `mvn package -DskipTests` produces the JAR
#   Stage 2 (runtime): eclipse-temurin:25-jre-alpine (minimal JRE)
#                      -> runs the packaged JAR as a NON-ROOT user
#
# All configuration is injected through environment variables at
# runtime (never baked into the image). See docs/reports/DockerBackend.md.
# ============================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build

# Copy the POM first so dependency resolution is cached in its own layer.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Copy sources and package the executable JAR.
# Tests are NOT run here — they are executed separately before the image
# build (Step 5 / Step 10 of the ADF Phase 12 checklist) so the image
# build stays fast and deterministic.
COPY src ./src
RUN mvn -B package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:25-jre-alpine AS runtime

# Create a non-root user and group for least-privilege operation.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the packaged JAR from the build stage.
COPY --from=build /build/target/FarmBridge-*.jar /app/app.jar

# Upload directory — product images and verification documents.
# The app resolves `file.upload-dir=uploads/products` relative to the
# working directory (/app), so files land in /app/uploads/products.
# NOTE: container-local files are lost when the container is removed;
#       attach a Docker volume/bind mount here for persistence
#       (planned for the Compose phase — not implemented in Step 1).
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Drop privileges before running the application.
USER appuser

# Spring Boot default port.
EXPOSE 8080

# Optional JVM tuning via JAVA_OPTS at runtime (e.g. -Xmx512m).
ENV JAVA_OPTS=""

# UTF-8 locale for correct formatting (e.g. thousands separators in
# String.format("%,.2f") used by EmailService) on Alpine's minimal locale.
ENV LANG=C.UTF-8

# Start the packaged JAR (never mvn spring-boot:run in production).
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
