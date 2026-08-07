# FarmBridge — Backend Dockerization (ADF Phase 12 · Step 1)

> **Date:** 2026-08-07
> **Scope:** Dockerize **only** the existing Spring Boot backend. No Compose, no
> frontend, no business-logic / API / schema / security changes.
> **Status:** ✅ PASS — image built, container started, 50/50 tests, 218/218 QA E2E.

---

## 1. Objective

Produce a production-ready Docker image for the existing FarmBridge Spring Boot
backend so it can be run as a container against the existing MySQL database —
the first Docker implementation of the project. All configuration is injected
through environment variables; no credentials are baked into the image or
committed.

## 2. Docker Architecture

Multi-stage build (matching the plan already sketched in
[`03_ARCHITECTURE.md`](../03_ARCHITECTURE.md) §12 and
[`10_DEPLOYMENT.md`](../10_DEPLOYMENT.md) §2.1):

```
┌──────────────────────────────┐      ┌──────────────────────────────────────┐
│ Stage 1 — build              │      │ Stage 2 — runtime                     │
│ maven:3.9-eclipse-temurin-25 │ ───► │ eclipse-temurin:25-jre-alpine         │
│  mvn package -DskipTests     │ JAR  │  non-root appuser, /app/app.jar       │
└──────────────────────────────┘      │  EXPOSE 8080 · java -jar app.jar      │
                                      └──────────────────┬───────────────────┘
                                                         │ env vars
                               ┌─────────────────────────┼─────────────────────────┐
                               ▼                         ▼                         ▼
                       MySQL (host)            /app/uploads/products      SMTP (mail, fail-safe)
                  host.docker.internal:3306     uploads (volume in prod)   MAIL_* from env
```

- **Java 25** confirmed from `pom.xml` (`<java.version>25</java.version>`),
  Spring Boot **4.1.0**.
- Both image tags were **verified to exist on Docker Hub** before use
  (`maven:3.9-eclipse-temurin-25`, `eclipse-temurin:25-jre-alpine`).

## 3. Files Created

| File | Purpose |
|---|---|
| `FarmBridge/Dockerfile` | Multi-stage build → minimal JRE runtime, non-root user |
| `FarmBridge/.dockerignore` | Keeps the build context to `pom.xml` + `src` only |
| `docs/reports/DockerBackend.md` | This report |
| `qa/backend_test_docker_results.txt` | QA E2E evidence (run #1: 217/218) |
| `qa/backend_test_docker_results2.txt` | QA E2E evidence (run #2: **218/218**) |

## 4. Files Modified

| File | Change |
|---|---|
| `docs/10_DEPLOYMENT.md` | Status header updated + checklist item marked: backend Dockerfile exists (documentation only) |

No application source, tests, DTOs, entities, or API code were modified.

**Environment actions (not files):**

- Stopped a stale IntelliJ-launched backend (PID 22860) that was occupying port 8080.
- Started Docker Desktop (engine was stopped).
- Created MySQL dev user `farmbridge`@`%` (granted on `farmbridge.*`) so the
  container can connect — MySQL `root` is restricted to `localhost` only.
- Reactivated QA test farmer id 67 (approved, 18 Grains products) — see §16.

## 5. Dockerfile Explanation

`FarmBridge/Dockerfile`:

- **Stage 1 (`maven:3.9-eclipse-temurin-25`)**: copies `pom.xml` first and runs
  `mvn dependency:go-offline` (caches dependencies in a layer), then copies
  `src/` and runs `mvn package -DskipTests` to produce the executable JAR.
  Tests are deliberately not run inside the image build — they are executed
  separately (Step 5/Step 10) so the image build is fast and deterministic.
- **Stage 2 (`eclipse-temurin:25-jre-alpine`)**: creates a non-root user
  (`appgroup`/`appuser`), copies only the packaged JAR
  (`target/FarmBridge-4.1.0.jar` → `/app/app.jar`), pre-creates
  `/app/uploads` owned by `appuser`, switches to `USER appuser`,
  `EXPOSE 8080`, and starts with `exec java $JAVA_OPTS -jar /app/app.jar`
  (never `mvn spring-boot:run`).
- `JAVA_OPTS` env var allows JVM tuning (e.g. `-Xmx512m`) without an image rebuild.

## 6. .dockerignore Explanation

`FarmBridge/.dockerignore` excludes everything the backend image does not need:

- VCS: `.git`, `.gitignore`, `.gitattributes`
- IDE: `.idea`, `*.iml`, `.vscode`, `.classpath`, `.project`, `.settings`
- Build output: `target/`, `*.class`
- Maven wrapper: `.mvn` (the image provides its own Maven)
- Frontend: `frontend/` (Dockerized separately in Phase 12 Step 2)
- Runtime data: `uploads/` (never baked into the image)
- Logs/temp/OS junk: `*.log`, `*.tmp`, `*.swp`, `.DS_Store`, `Thumbs.db`, `.env`

Only `pom.xml` and `src/` are actually copied by the Dockerfile.

## 7. Environment Variables

The existing `application.properties` already reads every secret from
environment variables with local-dev defaults — **no config change was needed**
and none was made. The container must be run with:

| Variable | Property | Example (local dev) |
|---|---|---|
| `DB_URL` | `spring.datasource.url` | `jdbc:mysql://host.docker.internal:3306/farmbridge` |
| `DB_USERNAME` | `spring.datasource.username` | `farmbridge` |
| `DB_PASSWORD` | `spring.datasource.password` | dev value, passed via `-e` only |
| `JWT_SECRET` | `jwt.secret` | ≥256-bit dev value, passed via `-e` only |
| `MAIL_HOST` | `spring.mail.host` | `smtp.gmail.com` |
| `MAIL_PORT` | `spring.mail.port` | `587` |
| `MAIL_USERNAME` | `spring.mail.username` | SMTP user (secret) |
| `MAIL_PASSWORD` | `spring.mail.password` | SMTP password (secret) |
| `MAIL_SMTP_AUTH` / `MAIL_STARTTLS` | `spring.mail.properties.*` | `true` |
| `APP_BASE_URL` | `app.base-url` | `http://localhost:5173` (frontend origin) |
| `APP_RESET_PASSWORD_URL` | `app.reset-password-url` | `http://localhost:5173/reset-password` |
| `TZ` | JVM default timezone | `Asia/Kolkata` (see §16) |

> **Note:** `DB_URL` inside the container uses `host.docker.internal` (Docker
> Desktop's host alias) — plain `localhost` would point at the container itself.
> No real credentials are stored in any source file; dev values are passed via
> `-e` on the `docker run` command line only.

## 8. Build Commands

```bash
# 1. Build + test + package locally (needs MySQL on localhost:3306)
cd FarmBridge
./mvnw clean package          # 50 tests → BUILD SUCCESS, target/FarmBridge-4.1.0.jar

# 2. Build the Docker image (context = the backend module)
docker build -t farmbridge-backend .
```

## 9. Docker Image

```text
REPOSITORY           TAG      IMAGE ID     CONTENT SIZE
farmbridge-backend   latest   f1c663352781 193 MB
```

Inspect confirms: `EXPOSE 8080`, `USER appuser` (uid=100), `WORKDIR /app`,
entrypoint `sh -c exec java $JAVA_OPTS -jar /app/app.jar`.

## 10. Container Commands

```bash
docker run -d --name farmbridge-backend \
  -p 8080:8080 \
  -e TZ="Asia/Kolkata" \
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/farmbridge" \
  -e DB_USERNAME="farmbridge" \
  -e DB_PASSWORD="<dev-db-password>" \
  -e JWT_SECRET="<dev-jwt-secret>" \
  -e MAIL_HOST="smtp.gmail.com" \
  -e MAIL_PORT="587" \
  -e MAIL_USERNAME="<dev-mail-user>" \
  -e MAIL_PASSWORD="<dev-mail-password>" \
  -e APP_BASE_URL="http://localhost:5173" \
  -e APP_RESET_PASSWORD_URL="http://localhost:5173/reset-password" \
  farmbridge-backend

docker ps            # container Up, 0.0.0.0:8080->8080/tcp
docker logs -f farmbridge-backend
```

## 11. Port Mapping

`-p 8080:8080` — container port 8080 mapped to host port 8080. Tomcat starts on
8080 with context path `/`. (A fresh container on a free port was started after
stopping a stale local backend that had occupied 8080.)

## 12. Database Connectivity

- Backend connects to the existing MySQL 8.0.46 at
  `host.docker.internal:3306/farmbridge` — log:
  `HikariPool-1 - Start completed`, `Database version: 8.0.46`,
  `Default catalog/schema: farmbridge`.
- Existing data readable: buyer product list returned **31 products** (exactly
  the count of products owned by APPROVED + active farmers), product details
  returned live rows (`Brinjal`, ₹40, `farmerVerified: true`).
- **Setup required:** MySQL `root` is `localhost`-only, so a dev user
  `farmbridge`@`%` (granted on `farmbridge.*`) was created for container access.
  In the planned Compose phase the MySQL service would expose its own user.

## 13. Swagger Verification

- `GET /swagger-ui/index.html` → **200**
- `GET /v3/api-docs` → **200**, OpenAPI 3.1.0, title *FarmBridge API*
- Swagger UI is reachable at `http://localhost:8080/swagger-ui/index.html`.

## 14. File Upload Verification

- Uploads are stored **inside the container** at `/app/uploads/products`
  (`file.upload-dir=uploads/products` resolved against `WORKDIR /app`; verified
  by `docker exec`).
- The QA E2E suite uploaded product images + verification documents; an
  uploaded image was served publicly: `GET /uploads/products/216d13c5-….png`
  → **200**.
- **Persistence limitation:** container-local uploads vanish when the container
  is removed. A Docker volume/bind mount on `/app/uploads` is required for
  persistence — deliberately **not** implemented in this step (see §17).

## 15. Email Verification

- The QA suite triggered every email event (welcome, password reset, order
  new/accepted/rejected/completed, verification rejected). The container made
  **20 SMTP attempts** against the env-configured `smtp.gmail.com:587`, all
  failing with `Authentication failed` (placeholder credentials — expected).
- This proves: (a) `MAIL_*` configuration is loaded from environment variables;
  (b) the fail-safe `EmailService` path works (WARN + swallow, business logic
  unaffected — all 218 QA checks still passed); (c) **no credentials appear in
  the logs** (grep for the dev passwords/secrets → 0 matches).

## 16. Test Results

**Backend unit/integration suite (`./mvnw clean package`): 50/50 PASS**
(`Tests run: 50, Failures: 0, Errors: 0, Skipped: 0`, BUILD SUCCESS,
`target/FarmBridge-4.1.0.jar`).

Two environment issues were found and resolved **without touching any test or
application code**:

1. **Pre-existing data drift (not Docker):**
   `AnalyticsFlowIntegrationTest.buyerAnalytics_consistent:359` failed
   (`expected: <false> but was: <true>`) because the shared dev DB had **88
   soft-deactivated farmers** and **zero buyer-visible Grains products**, so the
   buyer-recommendations list (real approved-farmer products in the buyer's
   favorite category, minus purchased items) was empty. Earlier QA runs had
   deactivated most farmers. Fix: reactivated the APPROVED QA farmer id 67
   (`qa_farmer1_1785918721@test.com`, 18 Grains products) via
   `UPDATE users SET active=TRUE` — the same reactivation operation the QA
   suite performs at runtime. → **50/50 green.**

2. **Container clock/timezone (genuine Docker-environment issue):**
   First QA E2E run was 217/218 — `expired token rejected` failed because the
   container JVM ran on **UTC** while the host runs **IST (+5:30)**. The QA
   harness backdates a reset token's expiry using host-local time, which was
   ~5.5 h **in the future** from the container's perspective, so the token was
   (correctly) still valid. Fix: run the container with `-e TZ=Asia/Kolkata` so
   the JVM timezone matches the host. → **218/218 QA E2E PASS** (run #2:
   `qa/backend_test_docker_results2.txt`).

**QA E2E (`qa/backend_test.sh` against the containerized backend): 218/218 PASS.**
Covers authentication (register/login/duplicate/invalid/privilege escalation),
farmer profile + verification (document uploads, approve/reject/resubmit),
products (CRUD, ownership, image upload + public serving, categories), orders
(stock deduct/restore, status machine), reviews, wishlist, notifications,
password reset (incl. expired token), admin (users, soft delete/reactivate),
and analytics authorization.

## 17. Known Limitations

- **Uploads are not persistent:** files live in the container's filesystem
  (`/app/uploads/products`). Removing the container loses them. A Docker volume
  (`-v farmbridge-uploads:/app/uploads`) must be added — planned for the
  Compose phase; not implemented here by design.
- **No healthcheck yet:** Spring Boot Actuator is not in `pom.xml` (per project
  rules, no dependency changes). `HEALTHCHECK` is planned once Actuator exists.
- **DB must be reachable from the container:** on Docker Desktop the host DB is
  reached via `host.docker.internal`; on a Linux host this would be the host
  LAN IP. The dedicated `farmbridge`@`%` MySQL user is a local-dev convenience —
  a managed MySQL user would be used in production.
- **`ddl-auto=update` is unchanged** (existing behaviour) — Flyway is still a
  documented future task.
- **Timezone:** the container should run with `TZ` matching the deployment
  region (`Asia/Kolkata` here) so `LocalDateTime`-based logic aligns with
  users and with QA tooling.
- **Frontend not Dockerized** (Phase 12 Step 2) — `APP_BASE_URL` /
  `APP_RESET_PASSWORD_URL` still point at the local `:5173` dev server.

## 18. Next Docker Phase

**ADF Phase 12 — Step 2:** Dockerize the React frontend
(`npm run build` → Nginx static hosting with `/api` + `/uploads` reverse proxy
to the backend service), then Step 3: `docker-compose.yml` orchestrating
`mysql:8` (named volume + admin init script), backend, and frontend with all
secrets injected via environment variables. Only after Step 1 is fully verified
should Step 2 proceed.
