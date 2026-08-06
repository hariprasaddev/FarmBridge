# Pre-Docker Cleanup Sprint — Milestone Report

> **Milestone:** Documentation & Cleanup Sprint before ADF Phase 12 (Docker)
> **Date:** 2026-08-06
> **Report:** `docs/reports/PreDockerCleanup.md`
> **Master timeline:** [`docs/07_TASKS.md`](../07_TASKS.md)
> **Scope:** Documentation corrections, README verification, dead-code cleanup,
> and configuration (secrets) verification only. **No features, no business
> logic, no APIs, no database schema, no frontend behaviour, no security
> behaviour, and no Docker changes.**

---

## 1. Files Modified

| File | Change |
|---|---|
| `docs/09_TESTING.md` | Test counts corrected: **50 test methods** (was 60); per-class counts aligned to reality (8/13/10/7/11/1); progression `18 → 26 → 39 → **50**`; `60/60 → 50/50`; "Last full run" updated to the **218**-check RC run (Day-17's 203 kept as history) |
| `docs/01_PROJECT_CONTEXT.md` | "60 test methods" → **50** (folder tree + §13); "203+ checks" → **218+** |
| `docs/02_REQUIREMENTS.md` | FR-AUTH-02 duplicate email **200 → 409**; FR-AUTH-06 invalid JWT **401 → 403** (401 noted as hardening); FR-SYS-05 / NFR-SEC-10 now ✅ env-var based; NFR-MAINT-04 & AC-SYS-01 test counts → **50** |
| `docs/05_API_CONTRACT.md` | §2.6 status table corrected to real behaviour (403 for missing/invalid/expired JWT; 409 added) + note documenting 401 as future hardening; §3.1.1 register (roles, duplicate-email 409, null/ADMIN role 400); §3.1.2 login errors (400 enumeration-safe, 403 deactivated) |
| `docs/11_PROMPTS.md` | Day 21 acceptance "60/60 today" → "50/50" |
| `docs/reports/ADFCompliance.md` | "60 backend test methods" → **50**; "60/60 test methods audited" → **50/50**; "203+ / 56" → "218+ / 56" |
| `docs/reports/ReleaseCandidateValidation.md` | Noted resolutions (counts corrected, 218 run recorded); **corrected the dead-code finding** — `NotificationBell` was incorrectly flagged as unused (it is used by `TopNavbar.jsx` via a relative import) |
| `README.md` | See §5 |
| `FarmBridge/src/main/resources/application.properties` | DB + JWT secrets converted to env-var placeholders (see §7) |
| `FarmBridge/src/test/resources/application.properties` | Same placeholder treatment (mirrors main config) |

## 2. Files Removed

| File | Reason |
|---|---|
| `FarmBridge/frontend/src/components/Navbar.jsx` | **Dead code** — 0 importers (superseded by `AppLayout` / `TopNavbar` since Day 18). Verified with import-level greps before deletion. |
| `FarmBridge/src/main/java/com/farmbridge/PasswordGenerator.java` | **Dead code** — 0 references anywhere in `src/main`; also contained a `System.out.println`. |

**Deliberately kept:** `components/NotificationBell.jsx` + `NotificationBell.css` —
after a precise re-check they are **still imported by `TopNavbar.jsx`**
(`import NotificationBell from '../NotificationBell'`). Deleting them would have
broken the app shell; the earlier "unused" flag was a grep-prefix false
negative and has been corrected in the RC report.

## 3. Documentation Corrections

- **Test counts: every "60 tests / 60/60" claim corrected to 50 / 50/50.**
  The inflated number came from counting `@TestInstance` / `@TestMethodOrder`
  annotations as `@Test` (2 per class × 5 classes = 10). Surefire's real count
  is **50**, re-verified twice (`./mvnw clean test` → `Tests run: 50`).
- Per-class method counts in `09_TESTING.md` aligned to the surefire reports.
- QA suite count updated from a stale 203 (Day-17 run) to the current
  **218-check** RC run; historical figure retained as history.
- `11_PROMPTS.md` Day-21 "60/60 today" corrected.

## 4. API Documentation Corrections

Verified against live backend behaviour (RC probes) — documentation updated,
backend untouched:

| Contract item | Previously documented | Actual (now documented) |
|---|---|---|
| Duplicate email on register | `200 OK` `"Email already exists"` | **409 Conflict** `ErrorResponse` |
| `role` omitted / `ADMIN` on register | `null` → DB error `500` | **400** `"Only FARMER and BUYER accounts can be created through registration"` |
| Missing / invalid / expired JWT | `401 Unauthorized` | **403 Forbidden** (Spring Security default entry point) |
| Wrong password / unknown email | `500` | **400** `"Invalid email or password"` (identical for both — enumeration-safe) |
| Deactivated account login | (not documented) | **403** `"Your account has been deactivated…"` |
| Status code table | 200/400/401/403/500 | 200/400/403/409/500 (+ 401 hardening note) |

Per **TASK 6**, the 401-vs-403 behaviour was **not implemented** — §2.6 now
documents the real 403 behaviour and lists 401 + `WWW-Authenticate` as a
future Docker/Production hardening task.

## 5. README Fixes

- **Screenshots (13 broken links fixed):** 8 now point to the real captures in
  `qa/screenshots/` (farmer-dashboard, buyer-verified-badge, buyer-orders,
  farmer-orders, admin-dashboard, admin-analytics, farmer-analytics,
  buyer-analytics). The 5 screenshots that have no existing file (login-page,
  register-page, add-product, admin-users, swagger-ui) were removed; a note
  now points readers to `qa/screenshots/`.
- **Swagger URL:** `…/swagger-ui.html` → canonical `…/swagger-ui/index.html`
  (2 places).
- **Backend setup:** MySQL credentials now documented as environment variables
  (`DB_URL` / `DB_USERNAME` / `DB_PASSWORD`) with config-default fallback.
- **Future Enhancements:** removed already-implemented items (Email
  Notifications, Image Upload, Reviews & Ratings); kept Payment Gateway /
  shopping cart and AI Crop Recommendation.
- **Verified working:** Postman collection + environment links
  (`docs/FarmBridge_API.postman_collection.json`,
  `docs/FarmBridge_Environment.postman_environment.json`), `docs/API_DOCUMENTATION.md`,
  and both GitHub links (`https://github.com/hariprasaddev` and
  `…/FarmBridge` — HTTP 200). README was not rewritten — only broken links
  and stale facts were fixed.

## 6. Dead Code Cleanup

| Item | Verdict |
|---|---|
| `components/Navbar.jsx` | ✅ Truly unused (0 importers) — **deleted** |
| `components/NotificationBell.jsx` + `.css` | ❌ **Still used** by `TopNavbar.jsx` — kept |
| `PasswordGenerator.java` | ✅ Truly unused (0 references) — **deleted** |

Both deletions were re-verified after removal by the clean `npm run build`
(792 modules) and `./mvnw clean test` (50/50).

## 7. Secrets Verification

`FarmBridge/src/main/resources/application.properties` and
`FarmBridge/src/test/resources/application.properties`:

| Property | Before | After |
|---|---|---|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/farmbridge` | `${DB_URL:jdbc:mysql://localhost:3306/farmbridge}` |
| `spring.datasource.username` | `root` | `${DB_USERNAME:root}` |
| `spring.datasource.password` | `Hari@1849` | `${DB_PASSWORD:Hari@1849}` |
| `jwt.secret` | `FarmTrustSuperSecretKey…` | `${JWT_SECRET:FarmTrustSuperSecretKey…}` |
| `spring.mail.username` | `${MAIL_USERNAME:}` ✅ (unchanged) | `${MAIL_USERNAME:}` |
| `spring.mail.password` | `${MAIL_PASSWORD:}` ✅ (unchanged) | `${MAIL_PASSWORD:}` |

- Every secret now resolves from an environment variable; the in-place
  defaults preserve the local development workflow (no env vars required to
  run locally) and are overridden by Docker/Compose in Phase 12.
- Defaults still exist for local-dev convenience — **Phase 12 should keep
  production compose overrides** (`DB_PASSWORD`, `JWT_SECRET`) so real
  credentials are never committed.
- `qa/DbTool.java` (QA helper) still contains a local DB password — dev-only
  tooling, noted as a known remaining item.
- The documented env-var names match `README.md`'s Environment Variables table
  (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `MAIL_*`).

## 8. Verification Results

### Backend Tests

```
./mvnw clean test
[INFO] Tests run: 8  … AnalyticsFlowIntegrationTest
[INFO] Tests run: 13 … EmailNotificationFlowIntegrationTest
[INFO] Tests run: 10 … FarmerVerificationFlowIntegrationTest
[INFO] Tests run: 1  … FramTrustApplicationTests
[INFO] Tests run: 7  … PasswordResetFlowIntegrationTest
[INFO] Tests run: 11 … SoftDeleteFlowIntegrationTest
[INFO] Tests run: 50, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

✅ **50/50 PASS — BUILD SUCCESS** (with the new env-var configuration).

### Frontend Build

```
npm run build (vite v5.4.21)
✓ 792 modules transformed.
✓ built in 7.43s — 0 errors, 0 warnings
```

✅ **Build Success — 0 errors, 0 warnings** (after `Navbar.jsx` removal).

## 9. Known Remaining Improvements

| # | Item | Status |
|---|---|---|
| 1 | **401 vs 403** — return `401` + `WWW-Authenticate: Bearer` for missing/invalid/expired JWTs (Spring Security `AuthenticationEntryPoint`) and make the frontend's 401 interceptor effective | **Future Docker/Production hardening task** — deliberately NOT implemented (TASK 6); documented in `05_API_CONTRACT.md` §2.6 |
| 2 | Remove in-file secret *defaults* so nothing sensitive is committed (keep Docker `.env` overrides) | Phase 12 (Docker) |
| 3 | `qa/DbTool.java` local DB password | Dev-only QA tooling; optional cleanup |
| 4 | Product search-by-name endpoint, load testing, Flyway migrations, CI/CD | Phase 12–14 backlog |
| 5 | No other known outstanding items — `grep` confirms zero remaining "60 test" or stale status-count claims (the only mentions are past-tense audit history with resolution notes) | ✅ |

## 10. Final Verdict

All documentation is consistent with the verified implementation, the README
has no broken links, the only truly dead code has been removed, secrets are
env-var based (with local defaults), and both verification layers are green:

- Backend: `./mvnw clean test` → **50/50 PASS, BUILD SUCCESS**
- Frontend: `npm run build` → **0 errors, 0 warnings**

> **FarmBridge v1.0 has successfully completed the Pre-Docker Cleanup Sprint and is approved to begin ADF Phase 12 (Docker & Docker Compose).**

---

*End of Pre-Docker Cleanup Sprint Report*
