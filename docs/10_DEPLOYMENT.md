# FarmBridge — Deployment Plan

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** 📘 **Documentation only** — this is the PLAN for Phase 12+. No
> Docker files, compose files, or CI/CD configuration exist in the repository yet.
>
> Current runtime: local development (backend `:8080`, frontend `:5173`,
> local MySQL `farmbridge` schema).

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

## 2. Docker (planned — Phase 12)

No `Dockerfile`s exist yet. The planned images:

### 2.1 Backend image (`farmbridge-backend`)

```
Multi-stage build:
  Stage 1 (build):  maven:3.9-eclipse-temurin-25 → ./mvnw package -DskipTests
  Stage 2 (runtime): eclipse-temurin:25-jre-alpine
    - copy target/FarmBridge-*.jar
    - ENTRYPOINT java -jar app.jar
    - EXPOSE 8080
    - HEALTHCHECK curl -f http://localhost:8080/actuator/health (after adding Actuator)
```

### 2.2 Frontend image (`farmbridge-frontend`)

```
Stage 1 (build):  node:20-alpine → npm ci && npm run build
Stage 2 (runtime): nginx:alpine
  - copy dist → /usr/share/nginx/html
  - nginx.conf: serve SPA fallback + proxy /api and /uploads to backend:8080
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
- [ ] Create Dockerfiles + docker-compose.yml
- [ ] Seed an initial ADMIN account (one-time script)
- [ ] Configure managed MySQL (SSL, backups, firewall)
- [ ] Set production `APP_BASE_URL` / `APP_RESET_PASSWORD_URL`
- [ ] Run both QA suites against a staging deployment
- [ ] Set up CI/CD pipeline + rollback runbooks

---

*End of Deployment Plan (documentation only)*
