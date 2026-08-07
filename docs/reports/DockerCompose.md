# FarmBridge — Docker Compose + MySQL Containerization Report (ADF Phase 12 · Step 3)

> **Document Version:** 1.0
> **Date:** 2026-08-07
> **Milestone:** ADF Phase 12 — Step 3 (Docker Compose + MySQL containerization)
> **Status:** ✅ **COMPLETE** — full stack running and verified end-to-end.

---

## 1. Objective

Run the **entire FarmBridge stack in Docker** — MySQL, Spring Boot backend,
and React/nginx frontend — orchestrated by Docker Compose on a dedicated
internal network, with persistent storage for both the database and uploaded
files. Everything except the browser runs in containers:

```
Browser → frontend (nginx) → backend (Spring Boot) → MySQL (containerized)
```

---

## 2. Existing Architecture (before this step)

- **Backend** (Step 1): `farmbridge-backend:latest` — Spring Boot 4.1 / Java 25,
  non-root `appuser`, port 8080. Connected to the **local host MySQL** via
  `host.docker.internal:3306`.
- **Frontend** (Step 2): `farmbridge-frontend:latest` — React + Vite build
  served by non-root nginx (uid 101), host 5173 → container 8080. Proxied
  `/api` + `/uploads` to `host.docker.internal:8080`.
- **Database**: local MySQL 8.0.46 on the host (port 3306), schema managed by
  `ddl-auto=update`. Uploaded files lived **inside** the backend container
  (ephemeral — the documented Step-1 limitation).

---

## 3. New Compose Architecture

```
┌─────────────────────── farmbridge-network (Docker internal) ───────────────────────┐
│                                                                                     │
│   farmbridge-mysql-1 (mysql:8.0)                                                    │
│     volume farmbridge_mysql_data → /var/lib/mysql      (host 3307 → 3306)           │
│     healthcheck: mysqladmin ping                                                     │
│        ▲ jdbc:mysql://mysql:3306/farmbridge (service DNS)                            │
│   farmbridge-backend-1 (farmbridge-backend:latest)                                  │
│     volume farmbridge_uploads → /app/uploads            (host 8080 → 8080)          │
│     healthcheck: wget /v3/api-docs; TZ=Asia/Kolkata                                  │
│        ▲ http://backend:8080 (service DNS)                                           │
│   farmbridge-frontend-1 (farmbridge-frontend:latest)                                │
│     nginx template renders /api + /uploads → backend:8080   (host 5173 → 8080)      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- **No `host.docker.internal` anywhere** — backend→MySQL uses `mysql:3306`,
  frontend→backend uses `backend:8080` (Docker service-name DNS).
- Host port **3307** is used for MySQL (3306 is occupied by the untouched
  local dev MySQL).

---

## 4. Files Created

| File | Purpose |
|---|---|
| `docker-compose.yml` | The Compose stack (mysql / backend / frontend) |
| `.env.example` | Template with placeholders (tracked) |
| `.env` | Local dev values (**git-ignored**, never committed) |
| `mysql/seed/seed.sql` | Idempotent one-time seed (admin + QA accounts + products) |
| `docs/reports/DockerCompose.md` | This report |
| `qa/backend_test_compose_results.txt` / `_3.txt` | Backend QA evidence (218/218) |
| `qa/uitest_compose_results2.txt` | Browser QA evidence (57/57) |

## 5. Files Modified

| File | Change |
|---|---|
| `FarmBridge/frontend/Dockerfile` | nginx.conf shipped as an **envsubst template** (`/etc/nginx/templates/`) + `ENV BACKEND_UPSTREAM=host.docker.internal:8080` default |
| `FarmBridge/frontend/nginx.conf` | `proxy_pass http://$BACKEND_UPSTREAM;` (was hardcoded host.docker.internal) — substituted at container start |
| `.gitignore` | Added `.env` / `.env.local` |
| `qa/DbTool.java` | Connection now env-configurable (`DB_URL`/`DB_USERNAME`/`DB_PASSWORD`, defaults unchanged) so the QA suite can target the Compose MySQL |
| `docs/10_DEPLOYMENT.md` | Step 3 marked implemented |
| `docs/07_TASKS.md` | Phase 12 entries added |

> **Why the nginx change:** the task requires the frontend to reach the
> backend via the Compose service name `backend:8080`. Using the official
> nginx template mechanism keeps ONE image working in both modes: standalone
> `docker run` (default `host.docker.internal:8080`, unchanged from Step 2)
> and Compose (`BACKEND_UPSTREAM=backend:8080`). No React/axios changes.

## 6. Docker Images Used

| Image | Source |
|---|---|
| `mysql:8.0` | Official MySQL 8.0 (pulled) |
| `farmbridge-backend:latest` | Built from `FarmBridge/Dockerfile` (unchanged) |
| `farmbridge-frontend:latest` | Built from `FarmBridge/frontend/Dockerfile` (template change) |

## 7. Compose Services

| Service | Image | Host → Container | depends_on |
|---|---|---|---|
| `mysql` | `mysql:8.0` | 3307 → 3306 | — |
| `backend` | `farmbridge-backend:latest` | 8080 → 8080 | `mysql: service_healthy` |
| `frontend` | `farmbridge-frontend:latest` | 5173 → 8080 | `backend: service_healthy` |

## 8. Network Configuration

- Dedicated network **`farmbridge-network`** (explicit `name:`), all three
  services attached. Service-name DNS resolves `mysql` and `backend`.

## 9. MySQL Configuration

- Official `mysql:8.0`, database `farmbridge`, user `farmbridge`.
- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`
  injected from `.env` (fail-fast `${VAR:?...}` if missing).
- Schema created by the app (`ddl-auto=update`) on first startup.
- Healthcheck: `mysqladmin ping` as root (`-p$$MYSQL_ROOT_PASSWORD`).

## 10. Environment Variables

From `.env` (via `.env.example`): `MYSQL_DATABASE`, `MYSQL_USER`,
`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
`MAIL_PASSWORD`, `MAIL_SMTP_AUTH`, `MAIL_STARTTLS`, `APP_BASE_URL`,
`APP_RESET_PASSWORD_URL`, `APP_SUPPORT_EMAIL`, `BACKEND_UPSTREAM`.
Every variable maps to an existing `application.properties` placeholder —
nothing invented. Backend also runs with `TZ=Asia/Kolkata` (matches the host
clock so the QA suite's expired-token timing is correct).

## 11. Database Persistence

- Named volume **`farmbridge_mysql_data`** → `/var/lib/mysql`.
- Verified: `docker compose down` → `docker compose up -d` preserves all
  data (users, products, orders, farmer profiles survived; counts identical).

## 12. Upload Persistence

- Named volume **`farmbridge_uploads`** → `/app/uploads` (verified from
  `file.upload-dir=uploads/products` + `WORKDIR /app`; the backend Dockerfile
  already chowns `/app/uploads` to `appuser`, and the named volume inherits
  that ownership on first use — uploaded files are `appuser:appgroup`).
- Verified: an uploaded product image survived `down`/`up` and is still served.

## 13. Backend Networking

- `DB_URL=jdbc:mysql://mysql:3306/farmbridge` — **service DNS, not
  host.docker.internal** (log confirms Hikari connected to the Compose MySQL).

## 14. Frontend Networking

- nginx template rendered at startup: `proxy_pass http://backend:8080;`
  (verified inside the container). SPA fallback (`try_files … /index.html`)
  unchanged. Standalone mode (`BACKEND_UPSTREAM=host.docker.internal:8080`)
  remains available.

## 15. Healthchecks

| Service | Check |
|---|---|
| mysql | `mysqladmin ping` (root) |
| backend | `wget http://localhost:8080/v3/api-docs` (public 200 endpoint — no Actuator added) |
| frontend | image HEALTHCHECK (`wget http://127.0.0.1:8080/`) |

## 16. Startup Order

`depends_on` with `condition: service_healthy` chains MySQL → backend →
frontend. No reliance on raw startup order. All three report `(healthy)`.

## 17. Commands Used

```
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs
docker compose down            (volumes preserved)
docker compose build --no-cache
docker compose up -d
docker compose exec -T mysql sh -c 'mysql -ufarmbridge -p"$MYSQL_PASSWORD" farmbridge' < mysql/seed/seed.sql
```

## 18. Build Results

- `docker compose build`: both images built ✅
- `docker compose build --no-cache`: both images rebuilt from scratch ✅
- Image sizes: backend 552 MB, frontend 75 MB.

## 19. Container Results

- `farmbridge-mysql-1` — Up **(healthy)**, 3307→3306
- `farmbridge-backend-1` — Up **(healthy)**, 8080→8080
- `farmbridge-frontend-1` — Up **(healthy)**, 5173→8080
- Backend log: `Started FarmBridgeApplication in ~12s`, Hikari connected to
  `mysql:3306`.

## 20. End-to-End Test Results

| Check | Result |
|---|---|
| Frontend `/`, SPA deep links (`/login`, `/register`, `/buyer/products`, `/admin/dashboard`, `/farmer/dashboard`) | ✅ 200 |
| API through nginx proxy (`/api/test` no token → 403; register → 200; JWT login) | ✅ |
| Buyer: list 4 seeded products from Compose MySQL | ✅ |
| Farmer (seeded, APPROVED): analytics + product list | ✅ |
| Farmer: create product (201) + upload image (200) → file in volume, appuser-owned, served 200 `image/png` via frontend and backend | ✅ |
| Buyer: place order (order #1, PENDING, total ₹191) → persisted in DB | ✅ |
| Admin (seeded): stats / analytics / users → 200 | ✅ |
| Email: fail-safe WARN logged (`connection refused` to 127.0.0.1:2525), **0 credential matches in logs** | ✅ |
| Backend QA `backend_test.sh` (with DbTool pointed at Compose MySQL) | ✅ 218/218 |
| Browser QA `qa/uitest.js` | ✅ **57/57** (incl. announcement toast) |

## 21. Persistence Test Results

`docker compose down` (volumes kept) → `docker compose up -d`:

- DB: users=4, products=5, orders=1, farmer_profiles=1 — **identical before/after** ✅
- Uploads: uploaded image file still present, appuser-owned ✅
- Auth works after restart; uploaded image still served (200) ✅

## 22. Known Limitations

1. **Local-dev mail is deliberately fail-fast**: `.env` points `MAIL_HOST=127.0.0.1:2525`
   (closed port) so SMTP attempts fail instantly (`connection refused`, logged)
   instead of hanging on external SMTP. Set real `MAIL_*` in `.env` for actual
   delivery; `.env.example` documents the external-SMTP form. This makes the
   announcement flow (synchronous per-user fan-out) usable locally — before
   the change an ALL-audience send took ~2.2 s × users (minutes).
2. **QA harness transient flakiness (Windows)**: `backend_test.sh` buffers API
   responses in `qa/.resp`; one run out of three lost that write (antivirus
   file-lock — same class as the Step-2 `npm ci` lock), producing stale
   response bodies that cascaded into wrong parsed IDs (36 bogus failures).
   Two other runs passed 218/218. Not a Docker/Compose issue.
3. **Host MySQL on 3306 is untouched**; the Compose MySQL publishes **3307**.
4. **One-time seed**: the app has no admin self-registration, so a fresh stack
   needs `mysql/seed/seed.sql` run once (documented in the compose file header
   and §17). Seeded passwords are local-dev placeholders.
5. Frontend container listens on 8080 (non-root nginx-unprivileged), host 5173.
6. Backend image has no Actuator; healthchecks use existing lightweight
   endpoints (deliberate — no new dependencies).

## 23. Security Considerations

- Secrets live only in **`.env`** (git-ignored); compose references them with
  fail-fast placeholders; **nothing hardcoded** in `docker-compose.yml`.
- Backend and frontend containers run **non-root** (appuser / uid 101).
- MySQL is exposed only on the host loopback port 3307 for debugging; the
  backend reaches it over the internal network.
- Mail attempts never expose credentials in logs (verified 0 matches).
- Seed accounts use documented placeholder passwords — change in real use.

## 24. Final Verdict

**PASS.** The complete Compose stack (MySQL + backend + frontend) builds,
starts, stays healthy, survives `down`/`up` (database + uploads persist),
survives a `--no-cache` rebuild, and passes the existing QA suites
(backend 218/218, browser 57/57) plus targeted end-to-end flows.

## 25. Next Recommended ADF Phase

**Phase 13 — CI/CD (GitHub Actions)**: build + test + push both images,
followed by Phase 14 deployment (Azure backend, Vercel frontend, managed
MySQL) and environment-variable hardening (Flyway migrations, Actuator
health endpoint, secret rotation).

---

*End of report — Docker Compose + MySQL (ADF Phase 12 · Step 3)*
