# ============================================================
# FarmBridge — Frontend (React + Vite) production image
# ADF Phase 12 · Step 2 · Frontend Dockerization
#
# Multi-stage build:
#   Stage 1 (build):   node:22-alpine  → npm ci + vite build  → dist/
#   Stage 2 (runtime): nginx-unprivileged:1.27-alpine (non-root)
#                      → serves dist/ with SPA fallback and
#                        reverse-proxies /api + /uploads to the
#                        Dockerized backend (host.docker.internal:8080)
# ============================================================

# ---------- Stage 1: build the static bundle ----------
FROM node:22-alpine AS build

WORKDIR /build

# Install dependencies first — leverages Docker layer caching:
# package.json/package-lock.json change far less often than source.
COPY package.json package-lock.json ./
RUN npm install --include=optional

# Copy the remaining source and build the production bundle.
# (.dockerignore keeps node_modules / dist / local artifacts out.)
COPY . .
RUN npm run build

# ---------- Stage 2: serve the bundle with nginx ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# nginx-unprivileged runs as the unprivileged `nginx` user (uid 101) and
# listens on 8080 — no root privileges anywhere in the runtime container.

# SPA-aware nginx config: serves the app with BrowserRouter fallback and
# reverse-proxies /api + /uploads to the backend. The config is shipped as
# an envsubst TEMPLATE — the official nginx entrypoint renders
# /etc/nginx/templates/*.template → /etc/nginx/conf.d/*.conf at container
# start, substituting $BACKEND_UPSTREAM. This lets ONE image serve both:
#   - standalone `docker run`        → host.docker.internal:8080 (default)
#   - docker compose                 → backend:8080 (Compose service DNS)
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV BACKEND_UPSTREAM=host.docker.internal:8080

# Copy only the built static bundle — no source, no node_modules, no
# development files, no secrets are present in the final image.
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080

# Simple liveness probe (busybox wget ships with the alpine base image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
