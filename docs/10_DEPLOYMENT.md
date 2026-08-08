# FarmBridge — Deployment Plan

> **Document Version:** 1.2
> **Last Updated:** 2026-08-08
> **Framework:** TrainingMug ADF v1.0
> **Status:** 🟡 **Partially implemented** — Phase 12 (Dockerization +
> Compose + MySQL) and **Phase 13 (CI/CD via GitHub Actions)** are DONE:
> - Backend image `farmbridge-backend` — [reports/DockerBackend.md](reports/DockerBackend.md)
> - Frontend image `farmbridge-frontend` — [reports/DockerFrontend.md](reports/DockerFrontend.md)
> - Full Compose stack (MySQL + backend + frontend) — [reports/DockerCompose.md](reports/DockerCompose.md)
> - CI/CD pipeline (GitHub Actions, Docker Hub publish) — [reports/CICD.md](reports/CICD.md)
>
> Cloud deployment remains planned (Phase 14).
>
> Current runtime: Docker Compose stack — MySQL container (host 3307),
> backend on `:8080`, frontend on `:5173` (all healthy).

---

## 1. Target Architecture

```
                        ┌────────────────────────────┐
 User → HTTPS           │  Vercel (frontend)         │
        ───────────────►│  Nginx-served React SPA    │
                        │  /api & /uploads proxied   │
                        └────────────┬───────────────┘
                                     │ HTTPS
                        ┌────────────▼───────────────┐
                        │  Azure (backend)           │
                        │  Spring Boot JAR in Docker │
                        │  - healthchecks            │
                        └────────────┬───────────────┘
                                     │ MySQL over SSL
                        ┌────────────▼───────────────┐
                        │  Managed MySQL (Azure DB / │
                        │  DigitalOcean / AWS RDS)   │
                        └────────────────────────────┘
```

- **Frontend:** static build (`npm run build`) served by a web server; the
  `/api` + `/uploads` paths reverse-proxied to the backend.
- **Backend:** stateless Spring Boot service (JWT → horizontally scalable);
  multiple instances can run behind a load balancer.
- **Database:** managed MySQL; the only stateful component; backups + SSL.

---

## 2. Docker (Phase 12)

**✅ Steps 1–3 implemented on 2026-08-07** — see
[`reports/DockerBackend.md`](reports/DockerBackend.md) (50/50 tests, 218/218
QA E2E), [`reports/DockerFrontend.md`](reports/DockerFrontend.md) (browser E2E
57/57 after the Step-3 mail change), and
[`reports/DockerCompose.md`](reports/DockerCompose.md) (full stack: backend
QA 218/218, browser QA 57/57, persistence + clean-rebuild verified).

### 2.1 Backend image (`farmbridge-backend`) — ✅ IMPLEMENTED

```
Multi-stage build (FarmBridge/Dockerfile):
  Stage 1 (build):  maven:3.9-eclipse-temurin-25 → mvn package -DskipTests
  Stage 2 (runtime): eclipse-temurin:25-jre-alpine (non-root appuser)
    - copy target/FarmBridge-4.1.0.jar → /app/app.jar
    - ENTRYPOINT exec java $JAVA_OPTS -jar /app/app.jar
    - EXPOSE 8080
    - HEALTHCHECK (after adding Actuator — not yet in pom.xml)
Run: docker run -d --name farmbridge-backend -p 8080:8080 -e TZ=Asia/Kolkata \
     -e DB_URL=jdbc:mysql://host.docker.internal:3306/farmbridge \
     -e DB_USERNAME / DB_PASSWORD / JWT_SECRET / MAIL_* farmbridge-backend
```

### 2.2 Frontend image (`farmbridge-frontend`) — ✅ IMPLEMENTED

```
Multi-stage build (FarmBridge/frontend/Dockerfile):
  Stage 1 (build):  node:22-alpine → npm ci && npm run build (792 modules)
  Stage 2 (runtime): nginxinc/nginx-unprivileged:1.27-alpine (non-root, uid 101)
    - copy dist → /usr/share/nginx/html
    - nginx.conf (FarmBridge/frontend/nginx.conf): SPA fallback (try_files
      /index.html) + reverse proxy /api and /uploads to
      host.docker.internal:8080 (the Docker host, where the backend publishes 8080)
    - listens on 8080 (unprivileged); host port 5173 → container 8080
    - proxy timeouts raised to 300s (announcement endpoint fans out emails)
Run: docker run -d --name farmbridge-frontend -p 5173:8080 farmbridge-frontend
Linux hosts: add --add-host host.docker.internal:host-gateway
```

### 2.3 MySQL container (`mysql:8.0`) — ✅ IMPLEMENTED (Step 3)

- `mysql:8.0`, database `farmbridge`, user `farmbridge` (env-driven).
- Named volume `farmbridge_mysql_data` → `/var/lib/mysql` (survives `down`).
- Host port **3307** → 3306 (host 3306 stays with the local dev MySQL).
- Healthcheck `mysqladmin ping`; backend waits on `service_healthy`.
- Admin seed via `mysql/seed/seed.sql` (run once through `docker compose
  exec` after the backend creates the schema — the app has no ADMIN
  self-registration).

---

## 3. Docker Compose — ✅ IMPLEMENTED (Step 3)

See [`reports/DockerCompose.md`](reports/DockerCompose.md). `docker-compose.yml`
(at the repo root) defines `mysql` / `backend` / `frontend` on the dedicated
`farmbridge-network`, with named volumes `farmbridge_mysql_data` and
`farmbridge_uploads`, healthcheck-chained `depends_on`, and secrets from the
git-ignored `.env`:

```
ports:    frontend 5173→8080 · backend 8080→8080 · mysql 3307→3306
network:  farmbridge-network (service DNS: mysql, backend)
db:       backend → jdbc:mysql://mysql:3306/farmbridge
proxy:    frontend nginx → http://backend:8080 (BACKEND_UPSTREAM env)
startup:  mysql healthy → backend healthy → frontend
```

---

## 4. Environment Variables

| Variable | Property | Purpose | Example |
|---|---|---|---|
| `DB_URL` | `spring.datasource.url` | JDBC URL | `jdbc:mysql://mysql:3306/farmbridge` |
| `DB_USERNAME` | `spring.datasource.username` | DB user | `farmbridge` |
| `DB_PASSWORD` | `spring.datasource.password` | DB password (secret) | — |
| `JWT_SECRET` | `jwt.secret` | Signing key (secret, ≥ 256-bit) | — |
| `MAIL_HOST` | `spring.mail.host` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | `spring.mail.port` | SMTP port | `587` |
| `MAIL_USERNAME` | `spring.mail.username` | SMTP user (secret) | — |
| `MAIL_PASSWORD` | `spring.mail.password` | SMTP password (secret) | — |
| `MAIL_SMTP_AUTH` / `MAIL_STARTTLS` | `spring.mail.properties.*` | SMTP options | `true` |
| `APP_BASE_URL` | `app.base-url` | Frontend origin for email links | `https://farmbridge.app` |
| `APP_RESET_PASSWORD_URL` | `app.reset-password-url` | Reset-page URL in emails | `https://farmbridge.app/reset-password` |
| `APP_SUPPORT_EMAIL` | `app.support-email` | Support address in emails | `support@farmbridge.com` |
| `MYSQL_DATABASE` | (mysql image) | Database name | `farmbridge` |
| `MYSQL_USER` | (mysql image) | App DB user | `farmbridge` |
| `MYSQL_PASSWORD` | (mysql image + `DB_PASSWORD`) | DB password (secret) | — |
| `MYSQL_ROOT_PASSWORD` | (mysql image) | Root password (secret) | — |
| `BACKEND_UPSTREAM` | (nginx template) | Compose service name | `backend:8080` |

> The Compose `.env` (git-ignored) supplies every value above; `docker-compose.yml`
> uses fail-fast `${VAR:?...}` for secrets. DB and JWT secrets already flow
> through `${DB_PASSWORD:}` / `${JWT_SECRET:}` placeholders in
> `application.properties` (Step 1/3) — remaining hardening (Flyway, rotation)
> is a later phase.

---

## 5. CI/CD — ✅ IMPLEMENTED (Phase 13)

CI/CD is handled entirely by **GitHub Actions** — one workflow,
[`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml).

### 5.1 What CI means

**Continuous Integration** = every code change is automatically built and
tested the moment it is pushed. For every **pull request** (and every push
to `main`) the workflow checks out the repository, sets up Java 25,
compiles the Spring Boot backend and runs its full `@SpringBootTest`
integration suite against a **throwaway MySQL 8 service container** (a fresh
`farmbridge` database created and destroyed per run — no production
database is ever touched), then sets up Node 22, installs the frontend
dependencies with `npm ci` and builds the production bundle with
`npm run build`. If anything fails, the PR shows a red check and cannot be
merged — problems surface in minutes instead of at deploy time.

### 5.2 What CD means

**Continuous Delivery (images)** = every commit merged to `main` that
passes the build/test job automatically produces ready-to-deploy Docker
images and pushes them to **Docker Hub**. FarmBridge's CD stage stops at the
registry — Phase 14 adds actual cloud deployment of those images. Two tags
are published per commit:

| Image | Tags |
|---|---|
| `<DOCKERHUB_USERNAME>/farmbridge-backend` | `latest`, `<git-commit-sha>` |
| `<DOCKERHUB_USERNAME>/farmbridge-frontend` | `latest`, `<git-commit-sha>` |

`latest` is the most recent `main` build; the `<sha>` tag pins the exact
commit, enabling rollbacks by redeploying a previous SHA.

### 5.3 What happens when code is pushed

| Event | What runs | Outcome |
|---|---|---|
| Push to a PR branch | `build-and-test` job (backend build+tests, frontend build) | PR status check; blocks merge on failure |
| Push/merge to `main` | `build-and-test` first, then `publish` job | Both images published to Docker Hub (`latest` + SHA) |
| Manual run (Actions tab → **Run workflow**) | `build-and-test` job | One-off validation of any branch |

### 5.4 Workflow explanation (`.github/workflows/ci-cd.yml`)

Two jobs on `ubuntu-latest`:

**`build-and-test`** (PRs + pushes to `main`; no secrets required):

1. `actions/checkout@v4` — checkout the repository.
2. `actions/setup-java@v5` — Temurin **JDK 25** with Maven `~/.m2` caching
   (matches `pom.xml` `<java.version>25`).
3. `./mvnw -B package` — compile + run every backend test + package the
   JAR. (`mvnw` is `chmod +x` first: the wrapper is checked in without the
   executable bit because the repo was created on Windows.) The tests run
   against a MySQL 8.0 **service container** declared at the job level
   (ports `3306` on the runner, CI-only throwaway credentials) — a fresh
   `farmbridge` database created and destroyed per run.
4. `actions/setup-node@v4` — **Node 22** with npm cache
   (matches the `node:22-alpine` Docker build stage).
5. `npm ci` — install frontend dependencies from the lock file.
6. `npm run build` — produce the production bundle. A final step runs
   `npm test` only if a `test` script exists (the frontend currently defines
   none, so the build is the gate).

**`publish`** (pushes to `main` only, `needs: build-and-test`):

1. `actions/checkout@v4`.
2. `docker/setup-buildx-action@v3` — enable Buildx.
3. `docker/login-action@v4` — **Docker Hub login using the two GitHub
   Secrets** (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`). Login happens only
   here, never on pull requests.
4. `docker/build-push-action@v6` × 2 — build and push the backend image
   (`./FarmBridge/Dockerfile`) and the frontend image
   (`./FarmBridge/frontend/Dockerfile`), each tagged `latest` + `${{ github.sha }}`.

**Quality gates:** all backend integration tests and both production builds
must pass before images are published. The live E2E suites
(`qa/backend_test.sh`, `qa/uitest.js`) are *not* part of the automated
pipeline (they need a fully-running stack, a seeded admin and Chrome); they
remain the manual release gate before Phase 14 deployment.

### 5.5 Docker Hub setup

1. Create a free account at **hub.docker.com**.
2. Create a **Personal Access Token** (Account Settings → Personal Access
   Tokens → Generate new token) with **Read & Write** scope. Tokens are
   safer than account passwords and can be revoked individually.
3. In the GitHub repository go to **Settings → Secrets and variables →
   Actions → New repository secret** and add the two secrets below.

### 5.6 Required GitHub Secrets

| Secret | Purpose | Example |
|---|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account name — used as the image prefix | `hariprasaddev` |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (Read/Write) | `dckr_pat_...` |

Add them at **repo → Settings → Secrets and variables → Actions**.
> Docker Hub image names must be **lowercase** — make sure the
> `DOCKERHUB_USERNAME` value contains no uppercase characters, or the push
> will be rejected.
> The pipeline requires **no other secrets**: the MySQL credentials inside
> the workflow are throwaway CI-only values for the ephemeral service
> container, and production values (`.env`) are never needed by CI.

### 5.7 Manual trigger

The workflow defines `workflow_dispatch`, so it can be started manually:
**Actions** tab → select **CI/CD** → **Run workflow** → pick the branch and
run. This is useful for validating a branch before opening a PR, or
re-running a failed pipeline.
> A manual run only executes the **CI** job (`build-and-test`) — it never
> logs in to Docker Hub or publishes images; publishing is reserved for real
> pushes to `main`.

### 5.8 Verifying published Docker images

- **Docker Hub web UI:** hub.docker.com → your namespace → the
  `farmbridge-backend` / `farmbridge-frontend` repositories show `latest`
  and the SHA tags with their push dates.
- **CLI (after `docker login`):**
  ```bash
  docker buildx imagetools inspect <DOCKERHUB_USERNAME>/farmbridge-backend:latest
  docker buildx imagetools inspect <DOCKERHUB_USERNAME>/farmbridge-frontend:<full-sha>
  ```
- **GitHub:** Actions → CI/CD → the main-branch `publish` job run log lists
  every tag pushed.

### 5.9 Pulling and running the published images

Any developer (or a Phase 14 host) can run the published images with the
same environment contract as the Compose stack:

```bash
docker pull <DOCKERHUB_USERNAME>/farmbridge-backend:latest
docker pull <DOCKERHUB_USERNAME>/farmbridge-frontend:latest

# Backend (MySQL must already be reachable; env vars match application.properties)
docker run -d --name farmbridge-backend -p 8080:8080 \
  -e DB_URL=jdbc:mysql://host:3306/farmbridge \
  -e DB_USERNAME=farmbridge -e DB_PASSWORD='***' -e JWT_SECRET='***' \
  -e TZ=Asia/Kolkata \
  <DOCKERHUB_USERNAME>/farmbridge-backend:latest

# Frontend (proxies /api + /uploads to the backend at $BACKEND_UPSTREAM)
docker run -d --name farmbridge-frontend -p 5173:8080 \
  -e BACKEND_UPSTREAM=host.docker.internal:8080 \
  <DOCKERHUB_USERNAME>/farmbridge-frontend:latest
```

On Linux add `--add-host host.docker.internal:host-gateway` to the frontend
run command. Easiest of all: use the repo's `docker-compose.yml` with a
`.env` file, or point its `backend`/`frontend` services at the published
images directly.

---

## 6. Health Checks

- Add **Spring Boot Actuator** (planned): `GET /actuator/health` for container
  and load-balancer probes.
- Docker `HEALTHCHECK` on backend + MySQL (`mysqladmin ping`).
- Frontend: nginx `healthz` endpoint; SPA uptime monitor (e.g. UptimeRobot).
- Custom readiness signal: after startup, `GET /api/test` returns
  `"JWT Authentication is working!"` (existing endpoint).

---

## 7. Rollback Strategy

| Layer | Strategy |
|---|---|
| **Application** | Keep the previous image/tag in the registry; redeploy the last-good image (Azure App Service slots / ACR tag pin). |
| **Database** | Managed MySQL backups (daily + PITR). Schema migrations applied only after code deploy; any migration reversible or additive (current `ddl-auto=update` is additive-only for new columns). |
| **Frontend** | Vercel instant rollback to a previous deployment. |
| **Data safety** | Soft delete already guarantees user records are never hard-deleted, so account rollbacks are trivial. |

## 8. Pre-Production Checklist

- [ ] Move DB password + JWT secret to environment variables
- [ ] Add Flyway or similar migration tool (replace bare `ddl-auto=update`)
- [ ] Add Spring Boot Actuator health endpoint
- [x] Create the backend Dockerfile + .dockerignore (Phase 12 Step 1 — done 2026-08-07)
- [x] Create the frontend Dockerfile + .dockerignore + nginx.conf (Phase 12 Step 2 — done 2026-08-07)
- [x] Create docker-compose.yml + MySQL containerization (Phase 12 Step 3 — done 2026-08-07)
- [x] Seed an initial ADMIN account (`mysql/seed/seed.sql` — Step 3)
- [ ] Configure managed MySQL (SSL, backups, firewall)
- [ ] Set production `APP_BASE_URL` / `APP_RESET_PASSWORD_URL`
- [ ] Run both QA suites against a staging deployment
- [ ] Set up CI/CD pipeline + rollback runbooks

---

*End of Deployment Plan (documentation only)*
