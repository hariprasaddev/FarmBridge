# FarmBridge — Deployment Plan

> **Document Version:** 1.1
> **Last Updated:** 2026-08-07
> **Framework:** TrainingMug ADF v1.0
> **Status:** 🟡 **Partially implemented** — Phase 12 Steps 1 & 2
> (backend + frontend Dockerization) are DONE:
> - Backend image `farmbridge-backend` — see [reports/DockerBackend.md](reports/DockerBackend.md)
> - Frontend image `farmbridge-frontend` — see [reports/DockerFrontend.md](reports/DockerFrontend.md)
>
> Docker Compose, MySQL containerization, and CI/CD remain planned.
>
> Current runtime: local MySQL `farmbridge` schema + containerized backend on
> `:8080` + containerized frontend on `:5173`.

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

**✅ Steps 1 & 2 implemented on 2026-08-07** — see
[`reports/DockerBackend.md`](reports/DockerBackend.md) (50/50 tests, 218/218
QA E2E) and [`reports/DockerFrontend.md`](reports/DockerFrontend.md)
(browser E2E 56/57 — one environment-limited announcement-toast check,
see the report). Docker Compose and MySQL containerization remain planned:

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

### 2.3 MySQL image (`mysql:8`)

- Named volume for data persistence.
- Init script (mounted at `/docker-entrypoint-initdb.d/`) to seed the admin
  account (the app has no ADMIN self-registration).

---

## 3. Docker Compose (planned)

```
services:
  mysql:
    image: mysql:8
    environment: MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD
    volumes: [mysql-data, ./init:/docker-entrypoint-initdb.d]
    healthcheck: mysqladmin ping
  backend:
    build: ./backend
    depends_on: mysql (healthy)
    environment: DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET,
                 MAIL_*, APP_BASE_URL, APP_RESET_PASSWORD_URL
    ports: ["8080:8080"]
  frontend:
    build: ./frontend
    depends_on: backend
    ports: ["80:80"]
networks: farmbridge-net
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

> Hardening task (Phase 12): convert the currently hardcoded
> `spring.datasource.password` and `jwt.secret` to `${DB_PASSWORD:}` /
> `${JWT_SECRET:}` placeholders.

---

## 5. CI/CD (planned — Phase 13)

GitHub Actions workflow stages:

```
1. Backend: setup Java 25 + Maven → ./mvnw test
2. Frontend: setup Node 20 → npm ci && npm run build
3. QA: start MySQL service container + backend + frontend
        → run qa/backend_test.sh and qa/uitest.js
4. Build images: docker build backend + frontend → push to container registry
5. Deploy (on main):
     frontend → Vercel (or pull image into Vercel/static hosting)
     backend  → Azure App Service / Azure Container Apps
     migrations → run on managed MySQL
6. Notify: Slack/email on success/failure
```

Quality gates: **all backend tests, both QA suites, and both production
builds must pass** before merge/deploy.

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
- [ ] Create docker-compose.yml (Phase 12 Step 3)
- [ ] Seed an initial ADMIN account (one-time script)
- [ ] Configure managed MySQL (SSL, backups, firewall)
- [ ] Set production `APP_BASE_URL` / `APP_RESET_PASSWORD_URL`
- [ ] Run both QA suites against a staging deployment
- [ ] Set up CI/CD pipeline + rollback runbooks

---

*End of Deployment Plan (documentation only)*
