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
RUN npm ci

# Copy the remaining source and build the production bundle.
# (.dockerignore keeps node_modules / dist / local artifacts out.)
COPY . .
RUN npm run build

# ---------- Stage 2: serve the bundle with nginx ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# nginx-unprivileged runs as the unprivileged `nginx` user (uid 101) and
# listens on 8080 — no root privileges anywhere in the runtime container.

# SPA-aware nginx config: serves the app with BrowserRouter fallback and
# reverse-proxies /api + /uploads to the Dockerized backend on the host
# (Docker Desktop resolves host.docker.internal to the host loopback,
# where the backend container publishes port 8080).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Validate the nginx config at image build time (fail fast on syntax errors).
RUN nginx -t

# Copy only the built static bundle — no source, no node_modules, no
# development files, no secrets are present in the final image.
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080

# Simple liveness probe (busybox wget ships with the alpine base image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
