# FarmBridge — CI/CD Implementation Report

> **Phase:** ADF Phase 13 · CI/CD
> **Date:** 2026-08-08
> **Status:** ✅ Complete (not yet pushed — awaiting Phase 14)
> **Deliverable:** `.github/workflows/ci-cd.yml` + CI/CD documentation

---

## 1. What was implemented

A single GitHub Actions workflow, `.github/workflows/ci-cd.yml`, with two jobs:

| Job | Runs on | Purpose |
|---|---|---|
| `build-and-test` | every PR (targeting `main`) + every push to `main` + manual `workflow_dispatch` | CI: compile, integration-test and package the backend; install and build the frontend. **No secrets required.** |
| `publish` | pushes to `main` only (`needs: build-and-test`) | CD: Docker Hub login → build & push `farmbridge-backend` and `farmbridge-frontend` images tagged `latest` and `${{ github.sha }}` |

### CI steps (`build-and-test`)

1. `actions/checkout@v4`
2. MySQL **8.0 service container** (throwaway `farmbridge` database,
   CI-only credentials, health-checked) — feeds the `@SpringBootTest`
   integration tests, which otherwise need a live MySQL on `localhost:3306`.
3. `actions/setup-java@v5` — Temurin **JDK 25** (matches
   `pom.xml` `<java.version>25</java.version>`), `cache: maven`.
4. `./mvnw -B package` — compiles, runs all tests, packages the JAR.
   The step runs `chmod +x mvnw` first because the wrapper is checked in
   without the executable bit (the repository was created on Windows —
   `git ls-files -s` shows mode `100644`).
5. `actions/setup-node@v4` — **Node 22** (matches the
   `node:22-alpine` Docker build stage), `cache: npm`.
6. `npm ci` — exact install from the tracked `package-lock.json`.
7. `npm run build` — production bundle (Vite). A final step runs
   `npm test` **only if a `test` script exists** — FarmBridge's frontend
   defines none (scripts: `dev` / `build` / `preview`), so the production
   build is the frontend gate. No test command was invented.

### CD steps (`publish`)

1. `actions/checkout@v4`
2. `docker/setup-buildx-action@v3`
3. `docker/login-action@v4` with `secrets.DOCKERHUB_USERNAME` /
   `secrets.DOCKERHUB_TOKEN` — **the only place Docker credentials are used**.
4. `docker/build-push-action@v6` × 2 — backend (`./FarmBridge/Dockerfile`)
   and frontend (`./FarmBridge/frontend/Dockerfile`), each pushed with:

```
<DOCKERHUB_USERNAME>/farmbridge-backend:latest
<DOCKERHUB_USERNAME>/farmbridge-backend:<git-sha>
<DOCKERHUB_USERNAME>/farmbridge-frontend:latest
<DOCKERHUB_USERNAME>/farmbridge-frontend:<git-sha>
```

### Action versions

All actions are pinned to current stable major releases (August 2026):

| Action | Version | Notes |
|---|---|---|
| `actions/checkout` | `v4` | Current, still backported (v4.4.0, Jul 2026) |
| `actions/setup-java` | `v5` | v4 is deprecated (warning added) |
| `actions/setup-node` | `v4` | Current, widely deployed |
| `docker/setup-buildx-action` | `v3` | Current (v4 is brand-new) |
| `docker/login-action` | `v4` | Latest stable |
| `docker/build-push-action` | `v6` | Current (v7 released Jul 2026) |

---

## 2. Design decisions

- **MySQL as a service container** — the backend's integration tests are
  `@SpringBootTest` classes that connect to a real MySQL
  (`jdbc:mysql://localhost:3306/farmbridge` in the test
  `application.properties`). CI spins up a fresh `mysql:8.0` container per
  run; `spring.jpa.hibernate.ddl-auto=update` builds the schema. This keeps
  the tests honest (they exercise real SQL/JPA) without any production DB.
- **CI-only DB credentials** — `farmbridge_ci_pass` /
  `farmbridge_ci_root_pass` are defined inline in the workflow and exist
  only inside the ephemeral runner. They are not secrets and never appear
  in any deployed environment.
- **`mvnw` + `chmod +x`** — uses the checked-in wrapper (pins Maven 3.9.16
  via `maven-wrapper.properties`) and fixes the missing exec bit that a
  Windows-created repo introduces for Linux runners.
- **Publish only on `main`** — image building, Docker Hub login and pushes
  are confined to the `publish` job, which is gated by
  `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` and
  `needs: build-and-test`. PRs never receive the Docker secrets.
- **Least privilege** — both jobs set `permissions: contents: read`.
- **Concurrency guard** — newer runs cancel in-progress ones on the same
  ref (saves runner minutes).
- **`workflow_dispatch`** — manual trigger for ad-hoc validation.

---

## 3. Security verification

| Check | Result |
|---|---|
| No Docker Hub token / credentials in any source file | ✅ only `secrets.*` references |
| `.env` not committed (git-ignored: root `.gitignore` line 32) | ✅ |
| `.env.example` tracked contains placeholders only (`change-me`) | ✅ |
| No database credentials hardcoded into the workflow (values are throwaway CI-only, documented as such) | ✅ |
| GitHub Secrets used correctly (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) | ✅ |
| PRs never receive production secrets | ✅ Docker login lives only in the main-only `publish` job |
| Secrets scanning of the diff (gitleaks-style manual audit of new files) | ✅ no `BEGIN RSA`, `api[_-]?key`, `password=`, token patterns in the workflow |
| Pre-existing note (unchanged by this phase) | `application.properties` carries local-dev default `DB_PASSWORD:Hari@1849` used by the local dev MySQL and QA scripts — deliberately kept for local workflows; Phase 13 introduces no new exposure |

---

## 4. Local verification (Step 8)

| Check | Command | Result |
|---|---|---|
| `git status` | `git status --short` | ✅ only the 2 new + 3 edited files below |
| Workflow YAML syntax/structure | Python `yaml.safe_load` structural parse | ✅ 2 jobs, 12 steps, correct action versions |
| Backend build + tests | `mvn -B package` with `DB_URL/DB_USERNAME/DB_PASSWORD` overrides (local MySQL on 3306) | ✅ **BUILD SUCCESS — Tests run: 50, Failures: 0, Errors: 0**; JAR `FarmBridge-4.1.0.jar` packaged |
| Frontend build | `npm run build` (Vite 5.4.21) | ✅ 792 modules, `dist/` written in ~10 s |
| Frontend tests | n/a — no `test` script exists | ✅ documented (build is the gate) |
| Docker backend build | `docker build -t farmbridge-backend:phase13-verify ./FarmBridge` | ✅ image built (cache-hit layers — Dockerfile unchanged since Phase 12) |
| Docker frontend build | `docker build -t farmbridge-frontend:phase13-verify ./FarmBridge/frontend` | ✅ image built (cache-hit layers — Dockerfile unchanged since Phase 12) |

> **Local run note:** the first local `mvn` run failed because the shell had
> Compose env vars exported (`DB_URL=jdbc:mysql://mysql:3306/farmbridge` →
> `UnknownHostException: mysql`). Passing the DB overrides explicitly fixed
> it — which is exactly what the workflow's Maven step does, so the CI
> design was validated by this incident.

> **GitHub Actions cannot be executed locally.** The workflow file is
> validated structurally (above) and follows the official action
> documentation; the definitive verification is on GitHub itself:
>
> 1. Push the changes (or open a PR). **Actions → CI/CD** — the
>    `build-and-test` job runs. Watch for green.
> 2. Merge to `main`. The `publish` job runs; confirm the four image tags
>    appear under your Docker Hub namespace.
> 3. Verify with `docker buildx imagetools inspect
>    <DOCKERHUB_USERNAME>/farmbridge-backend:latest`.

---

## 5. Files

| File | Change |
|---|---|
| `.github/workflows/ci-cd.yml` | **created** — the CI/CD pipeline |
| `docs/10_DEPLOYMENT.md` | **modified** — §5 rewritten: CI/CD implemented (sections 5.1–5.9) |
| `docs/07_TASKS.md` | **modified** — Phase 13 section added; planned table updated |
| `README.md` | **modified** — CI/CD badge + "CI/CD (GitHub Actions)" section |
| `docs/reports/CICD.md` | **created** — this report |

Nothing was committed or pushed (Step 9 respected).

---

## 6. Problems discovered

1. **`mvnw` lacks the executable bit** (`100644`) — would break `./mvnw` on
   Linux runners. Mitigated in the workflow with `chmod +x mvnw`; a future
   cleanup could `git update-index --chmod=+x FarmBridge/mvnw`.
2. **Docker Hub enforces lowercase image names** — `DOCKERHUB_USERNAME`
   must be lowercase or the push is rejected (noted in `10_DEPLOYMENT.md`
   §5.6 and the workflow header).
3. **Manual `workflow_dispatch` runs never publish** by design — publishing
   is gated to real pushes on `main` (documented in §5.7).
4. **Frontend has no unit test suite** — `package.json` defines only
   `dev`/`build`/`preview`. The workflow runs `npm test` conditionally and
   the build is the gate; the live browser suite (`qa/uitest.js`) remains a
   manual release gate.
5. **Backend tests require a live MySQL** — handled in CI via the service
   container; locally they need the dev MySQL on `:3306`.
6. **Docker Desktop was not running** on the local machine during Phase 13
   (daemon started for the build verification).
7. Version pinning is a moving target — the workflow comments and this
   report list the exact stable versions used on 2026-08-08; bump majors
   deliberately, never blindly.

---

*End of CI/CD report (Phase 13). No cloud deployment performed — that is Phase 14.*
