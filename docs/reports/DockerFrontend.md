# FarmBridge — Frontend Dockerization Report (ADF Phase 12 · Step 2)

> **Document Version:** 1.0
> **Date:** 2026-08-07
> **Milestone:** ADF Phase 12 — Step 2 (Frontend Dockerization)
> **Status:** ✅ **COMPLETE** (one environment-level limitation documented — see §13)

---

## 1. Executive Summary

The FarmBridge React frontend has been Dockerized with a production-ready,
multi-stage build and verified end-to-end against the already-Dockerized
backend (`farmbridge-backend`, Phase 12 Step 1). The frontend image
(`farmbridge-frontend:latest`) builds the static bundle with Node and serves
it from a minimal, fully non-root nginx runtime that replicates the existing
Vite development proxy (`/api` + `/uploads` → backend). **No frontend source
code was changed.** SPA routing, JWT authentication, API communication, file
uploads, and browser flows were verified against the running containers.

**Outcome:** PASS WITH LIMITATIONS. All build, image, container, HTTP, SPA,
API, authentication, and upload verifications pass. One item in the existing
browser E2E suite (`qa/uitest.js`) — *announcement success toast* — cannot
pass in this environment because the announcement endpoint synchronously
emails every user (~210) and the placeholder SMTP credentials make each
attempt take ~2.2 s (~7–8 min total), while the test waits only 12 s. This is
a pre-existing backend/development-environment characteristic that occurs
identically on the Vite dev server; it is not caused by Dockerization (§13.1).

---

## 2. Objective

Produce a production-ready Docker image for the existing React + Vite
frontend that:

- builds the static bundle in a container (no host build artifacts),
- serves it from a lightweight, non-root production web server,
- supports React `BrowserRouter` SPA routing (no 404 on deep links),
- keeps frontend ↔ backend communication working with `http://localhost:8080`
  while the backend container publishes port 8080,
- preserves local development exactly as before,
- requires **zero changes** to frontend application code, backend code, APIs,
  or security behavior.

Docker Compose and MySQL containerization are **explicitly out of scope**
(Phase 12 Steps 3).

---

## 3. Existing Frontend Architecture (as inspected)

| Aspect | Finding |
|---|---|
| Framework | React 18.3 (`react`, `react-dom`) |
| Build tool | Vite 5.4 (`vite`, `@vitejs/plugin-react`) |
| Router | `react-router-dom` 6.26 — **`BrowserRouter`** (SPA, no hash routing) |
| HTTP client | axios with `baseURL: '/api'` (relative — same-origin by design) |
| Dev server | Vite dev server, port **5173**, proxy: `/api` + `/uploads` → `http://localhost:8080` |
| Env variables | **None used** — no `.env*` files, no `import.meta.env` references |
| Build command | `npm run build` (`vite build`) |
| Output dir | `dist/` (hashed assets under `dist/assets/`) |
| Dependencies | axios, react-icons, recharts (manualChunks: vendor-react / vendor-charts / vendor-icons) |
| Frontend tests | None (no test script; no test files) |
| Lockfile | `package-lock.json` (lockfileVersion 3) → `npm ci` is appropriate |
| Local Node | v24.18.0 (Docker uses Node 22 LTS — Node 20 reached EOL 2026-04) |
| CORS | Backend has **no CORS configuration** — the app relies on same-origin proxying, so none is needed in Docker either |

Key architectural fact: because axios uses the **relative** baseURL `/api`, the
browser only ever talks to the origin that serves the page. In development
the Vite dev server proxies `/api` and `/uploads`; in the Dockerized
production setup **nginx replicates that proxy**, so the browser continues to
talk to a single origin and no CORS or API-URL changes are required.

---

## 4. Docker Architecture

```
┌─────────────────────────── farmbridge-frontend:latest ───────────────────────────┐
│                                                                                  │
│  Stage 1 (build)              node:22-alpine                                     │
│    npm ci  →  npm run build   (792 modules → dist/)                              │
│                                                                                  │
│  Stage 2 (runtime)            nginxinc/nginx-unprivileged:1.27-alpine            │
│    user 101 (nginx) — no root                                                    │
│    listens on 8080 (unprivileged port)                                           │
│    serves dist/ + SPA fallback + reverse proxy                                   │
└──────────────┬───────────────────────────────────────────────────────────────────┘
               │ host port 5173 → container 8080
               ▼
      Browser → http://localhost:5173
                 ├── /                → static SPA (index.html)
                 ├── /login …         → SPA fallback (index.html)
                 ├── /assets/*        → static (immutable cache)
                 ├── /api/*           → proxy → host.docker.internal:8080 (backend)
                 └── /uploads/*       → proxy → host.docker.internal:8080 (backend)
```

`host.docker.internal` resolves to the Docker host, where the
`farmbridge-backend` container publishes `0.0.0.0:8080 → 8080`. The
frontend container therefore reaches the backend at `http://localhost:8080`
from the browser's perspective (the host's `localhost:8080`).

---

## 5. Dockerfile Design

`FarmBridge/frontend/Dockerfile` — multi-stage build:

**Stage 1 — build (`node:22-alpine`)**
- `COPY package.json package-lock.json ./` → `RUN npm ci` (reproducible
  installs from the lockfile; layer cached until the lockfile changes)
- `COPY . .` → `RUN npm run build` (vite build inside the container)

**Stage 2 — runtime (`nginxinc/nginx-unprivileged:1.27-alpine`)**
- nginx-unprivileged runs as the unprivileged `nginx` user (uid 101) and
  listens on **8080** — a fully non-root runtime (no `root` anywhere)
- `COPY nginx.conf /etc/nginx/conf.d/default.conf` — SPA-aware config
- `COPY --from=build /build/dist /usr/share/nginx/html` — only the static
  bundle is copied: **no source, no node_modules, no secrets**
- `EXPOSE 8080`
- `HEALTHCHECK` — busybox `wget http://127.0.0.1:8080/`

Rationale:
- Node **22 LTS** (not Node 20 — reached end-of-life April 2026; Vite 5
  requires Node ≥ 18).
- nginx-unprivileged over `nginx:alpine` because the task requires a non-root
  runtime and this image is the official, zero-config way to achieve it. The
  container therefore listens on 8080 (unprivileged port) instead of 80; the
  host port remains **5173** (matching the development port and the browser
  E2E harness `BASE`).
- The official image's `docker-entrypoint.sh` remains the entrypoint
  (`CMD ["nginx", "-g", "daemon off;"]`).

---

## 6. .dockerignore Design

`FarmBridge/frontend/.dockerignore` keeps the build context small and keeps
unnecessary files out of the image:

- `node_modules` — reinstalled via `npm ci` inside the image
- `dist` — regenerated inside the image
- `.git`, `.github`, `.gitignore`
- `.env`, `.env.*`, `*.local` — never baked into an image (none exist today)
- IDE/editor files (`.idea`, `.vscode`, `*.swp`, `*.swo`)
- logs (`*.log`, `npm-debug.log*`), temp files, `.DS_Store`, `Thumbs.db`
- QA/test artifacts (`test-image.png`, `coverage`, `qa`)
- `Dockerfile`, `.dockerignore` themselves

Nothing required by the Docker build is excluded (`package.json`,
`package-lock.json`, `index.html`, `vite.config.js`, `src/`, `public/`,
`nginx.conf` are all included).

---

## 7. Build Process

**Local build (host, `FarmBridge/frontend`):**

```
npm ci                      → clean install from package-lock.json
npm run build               → vite v5.4.21 build
```

Output: **792 modules transformed, built in 12.43 s, 0 errors.**

```
dist/index.html                          0.87 kB │ gzip:  0.48 kB
dist/assets/index-CP6NShKW.css         216.84 kB │ gzip: 34.04 kB
dist/assets/vendor-icons-DaoviL3L.js     2.46 kB │ gzip:  1.08 kB
dist/assets/vendor-react-BKdl3TPa.js   209.28 kB │ gzip: 70.43 kB
dist/assets/index-t09a5kJ9.js          242.81 kB │ gzip: 58.24 kB
dist/assets/vendor-charts-Dg_oTOvb.js  431.78 kB │ gzip: 122.63 kB
```

**Container build (in the image, Stage 1):** identical result — 792 modules,
built in 3.15 s, no warnings/errors.

> Note: the first `npm ci` attempt hit a transient Windows file-lock error
> (antivirus/registry scanner holding `node_modules`); removing
> `node_modules` and retrying succeeded. This is a host-only annoyance, not
> an image problem — inside the container the install is always fresh.

---

## 8. API Configuration

**No source code or environment-file changes were required.**

- The frontend axios instance uses the relative `baseURL: '/api'` and no
  Vite env vars exist in the project.
- The Dockerized nginx **replicates the existing Vite dev proxy**:
  - `/api/` → `http://host.docker.internal:8080`
  - `/uploads/` → `http://host.docker.internal:8080`
- The browser therefore keeps talking to a single origin
  (`http://localhost:5173`), exactly like local development, and the backend
  is reached at `http://localhost:8080` via the host.

**Local development is unchanged:** `npm run dev` still serves on 5173 with
the Vite proxy to `localhost:8080` (no `nginx.conf` is used locally).

**Port summary:**

| Mode | Frontend | Backend reachable at |
|---|---|---|
| Local dev | `http://localhost:5173` (Vite) | `http://localhost:8080` (Vite proxy) |
| Docker | `http://localhost:5173` → container 8080 (nginx) | `http://localhost:8080` (nginx proxy → host → backend container) |

`host.docker.internal` works natively on Docker Desktop (Windows/macOS). On
Linux hosts, run the container with `--add-host host.docker.internal:host-gateway`.

---

## 9. SPA Routing Configuration

The app uses React Router `BrowserRouter`. The nginx config implements the
standard SPA fallback so **direct navigation to any route returns
`index.html`** (never a 404):

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Verified routes (all return `200`): `/`, `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/products`, `/admin`,
`/buyer/products`, `/farmer/dashboard`, `/admin/users`, `/buyer/wishlist`,
`/notifications`.

---

## 10. Docker Image

```
farmbridge-frontend:latest
  Size (content):   21.3 MB  (disk 75.1 MB)
  User:             101 (nginx — non-root)
  Exposed ports:    8080/tcp
  Entrypoint:       /docker-entrypoint.sh  (nginx -g "daemon off;")
```

---

## 11. Container Configuration

```
docker run -d --name farmbridge-frontend -p 5173:8080 farmbridge-frontend
```

- Host **5173** → container **8080** (no conflict with the backend on 8080).
- Health: `HEALTHCHECK` reports `healthy`.
- Backend container (`farmbridge-backend`) left running and untouched.

---

## 12. Verification Procedure

1. Container starts and reports `healthy`.
2. `GET /` returns 200 with the **production** bundle (hashed `/assets/*`).
3. Deep SPA links return 200 (not 404).
4. Hashed JS/CSS assets load with correct MIME types.
5. `/api/*` and `/uploads/*` are proxied to the backend.
6. JWT authentication round-trips through the proxy.
7. File upload → stored in the backend container → served back via the proxy.
8. Browser E2E suite (`qa/uitest.js`, puppeteer-core + installed Chrome)
   against `http://localhost:5173`.

---

## 13. Verification Results

| Check | Result |
|---|---|
| Image build (`docker build -t farmbridge-frontend .`) | ✅ PASS |
| Container start + `HEALTHCHECK` healthy | ✅ PASS |
| `GET /` → 200 (production index.html) | ✅ PASS |
| SPA deep links (12 routes) → 200 | ✅ PASS |
| Static assets (`/assets/index-*.js`, `*.css`) → 200, correct MIME | ✅ PASS |
| `GET /api/test` (no token) → 403 (backend auth, proxied) | ✅ PASS |
| `POST /api/auth/login` invalid → 400 (proxied) | ✅ PASS |
| Register → 200; Login → JWT (200 chars); `GET /api/buyer/products` → 200 | ✅ PASS |
| `GET /api/test` with JWT → 200 "JWT Authentication is working!" | ✅ PASS |
| Upload `POST /api/farmer/products/{id}/image` → 200; file stored in backend container | ✅ PASS |
| `GET /uploads/products/<file>` via frontend → 200 `image/png` (508 B) | ✅ PASS |
| nginx error log | ✅ empty |
| Frontend container still running at end | ✅ `Up (healthy)` |
| Browser E2E `qa/uitest.js` | ⚠️ **56/57 PASS — 1 environment-limited failure (below)** |

### 13.1 The single E2E failure — root cause (pre-existing, not Docker)

`FAIL announcement send -> no success toast`:

- The announcement endpoint (`POST /api/admin/announcements`) **synchronously
  emails every recipient** (`AnnouncementServiceImpl.sendAnnouncement` loops
  over all users). The shared dev DB currently has **210 users**.
- Each SMTP attempt with the placeholder dev credentials takes ~2.2 s
  (gmail SMTP returns `Authentication failed` slowly), so an ALL-audience
  send takes **~7–8 minutes**.
- `qa/uitest.js` waits only **12 s** for the success toast — it cannot appear
  in time. This behavior is identical on the Vite dev server (the Vite proxy
  has no 60 s cap, but the toast still cannot appear in 12 s).
- **Proven working end-to-end through the Dockerized proxy:** two test
  announcements were recorded in the DB (`announcements` rows with
  `recipient_count = 210`), i.e. the request is correctly forwarded and the
  backend completes the send. With real SMTP credentials the send completes
  in seconds and the toast appears normally.
- The 54 console errors are the suite's "expected 404s" (product images
  missing in the ephemeral container-local uploads dir — the documented
  Step-1 limitation) plus the intentional invalid-login 400.

**Related Docker-side fix made:** nginx's default `proxy_read_timeout` (60 s)
was cutting this slow-but-valid request off with a `504 Gateway Time-out`
(the Vite dev proxy has no such cap). The nginx config now sets
`proxy_connect_timeout 10s; proxy_send_timeout 300s; proxy_read_timeout 300s`
on `/api/` so the Docker frontend behaves equivalently to development.

---

## 14. Browser/API Test Results

- **`qa/uitest.js` run 1:** 56 PASS / 1 FAIL (announcement toast) — run
  against the initial image.
- **`qa/uitest.js` run 2** (after the nginx-timeout fix, rebuilt image):
  **56 PASS / 1 FAIL** — identical single failure (deterministic).
- Covered and passing: root redirect to login; register buyer via UI; invalid
  login; buyer login; farmer login; admin login; logout (profile dropdown);
  product browsing; product detail; wishlist add/remove; order placement;
  farmer dashboard stats; farmer product add/edit; farmer verification
  document upload (3 files) + submission; admin dashboard; admin users;
  admin products; admin orders; admin verification approve/reject; admin
  announcements page renders; admin logout; role-guard redirects.
- Console/network: no unexpected asset or API errors (see §13.1).

---

## 15. Files Created

| File | Purpose |
|---|---|
| `FarmBridge/frontend/Dockerfile` | Multi-stage build (Node build → non-root nginx runtime) |
| `FarmBridge/frontend/nginx.conf` | SPA fallback + `/api` + `/uploads` reverse proxy + timeouts |
| `FarmBridge/frontend/.dockerignore` | Minimal, safe Docker build context |
| `docs/reports/DockerFrontend.md` | This report |
| `qa/uitest_docker_results.txt` | Browser E2E evidence (run 1) |
| `qa/uitest_docker_results2.txt` | Browser E2E evidence (run 2) |

## 16. Files Modified

| File | Change |
|---|---|
| `docs/10_DEPLOYMENT.md` | Phase 12 Step 2 marked implemented; frontend-image section updated (documentation only) |

## 17. Files Deleted

None.

---

## 18. Commands Executed

```
cd FarmBridge/frontend
npm ci                                    # clean install (host verification)
npm run build                             # vite build (host verification)
docker build -t farmbridge-frontend .     # build image (context: frontend/)
docker run -d --name farmbridge-frontend -p 5173:8080 farmbridge-frontend
curl http://localhost:5173/...            # HTTP / SPA / asset / API checks
cd qa && node uitest.js                   # browser E2E (56/57, see §13.1)
```

(Environment cleanup: a stale host `vite dev` process from a previous
session was holding port 5173 and shadowing the container; it was stopped so
verification targets the container — analogous to the stale IntelliJ backend
removed on port 8080 in Step 1.)

---

## 19. Known Limitations

1. **Announcement toast E2E check cannot pass in this dev environment**
   (placeholder SMTP + 210-user shared DB → ~7–8 min synchronous fan-out vs
   the test's 12 s wait). Pre-existing; identical on the Vite dev server;
   passes with working mail credentials (§13.1). Not a Docker defect.
2. **`host.docker.internal`** is Docker-Desktop-native; on Linux, run with
   `--add-host host.docker.internal:host-gateway`.
3. **Container port is 8080 (not 80)** because nginx-unprivileged cannot bind
   privileged ports; the host port 5173 is unaffected and matches development.
4. **No Docker network / Compose** — the frontend reaches the backend
   through the host's published port. Step 3 (Compose) will replace this
   with an internal Docker network and service DNS.
5. Product images stored inside the backend container are ephemeral
   (Step-1 limitation, unchanged): uploaded images disappear when the
   backend container is recreated unless a volume is mounted (Compose phase).

---

## 20. Security Considerations

- **Non-root runtime:** nginx runs as uid 101; no root in the runtime image.
- **No secrets baked in:** no `.env` files, no credentials; API keys/secrets
  live only in backend environment variables (unchanged from Step 1).
- **Minimal image:** only the static bundle + nginx; no source, no
  `node_modules`, no build toolchain, no test artifacts in the final image
  (21.3 MB content).
- **Same-origin by design:** the proxy keeps the browser on one origin, so
  the backend's existing security posture (JWT, role-based authorization,
  no CORS surface) is unchanged.
- **No new network exposure:** only port 5173 is published.

---

## 21. Relationship to ADF Phase 12

| Step | Status |
|---|---|
| Step 1 — Backend Dockerization | ✅ COMPLETE (image `farmbridge-backend`, 50/50 tests, 218/218 QA E2E — see `DockerBackend.md`) |
| **Step 2 — Frontend Dockerization** | ✅ **COMPLETE (this report)** |
| Step 3 — Docker Compose / MySQL container | ⛔ **NOT IMPLEMENTED** |

---

## 22. Next Step

**ADF Phase 12 — Step 3: Docker Compose orchestration** (backend + frontend +
MySQL in an internal Docker network with named volumes for uploads and
database persistence). At that point the `host.docker.internal` proxy target
in `nginx.conf` will be replaced by the Compose service name.

---

*End of report — Frontend Dockerization (ADF Phase 12 · Step 2)*
