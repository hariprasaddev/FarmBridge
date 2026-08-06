# Release Candidate Validation — Milestone Report

> **Milestone:** Pre-Phase-12 Release Candidate (RC) validation · **Date:** 2026-08-06
> **Report:** `docs/reports/ReleaseCandidateValidation.md`
> **Master timeline:** [`docs/07_TASKS.md`](../07_TASKS.md)
> **Scope:** Read-only audit. **No features implemented, no code changed, no
> APIs/schema/UI/business logic modified.** One documentation artifact was
> created (this report). Only the QA harness account was restored so the
> existing E2E suite could run (see §8).
> **Method:** `./mvnw clean test` · `npm run build` · live backend E2E
> (`qa/backend_test.sh`) · browser E2E (`qa/uitest.js`) · targeted API probes ·
> code & documentation inspection.

---

## 1. Executive Summary

FarmBridge is **feature-complete and functionally green** in its current
state. All three verification layers pass:

| Layer | Result |
|---|---|
| Backend integration tests (`./mvnw clean test`) | ✅ **50/50 PASS** — BUILD SUCCESS, 0 failures, 0 errors, 0 skipped, 26.6 s |
| Backend live E2E (`qa/backend_test.sh`) | ✅ **218/218 PASS** — 0 failures |
| Browser E2E (`qa/uitest.js`, Chrome) | ✅ **56/56 PASS** — 0 failures |
| Frontend production build (`npm run build`) | ✅ Clean — 792 modules, 0 errors, 0 warnings (5.2 s) |

The audit found **no blocking functional defects**. Auth (including the
soft-delete gate and role-based access), farmer verification, products,
orders, reviews, wishlist, notifications, analytics, email flows, and soft
delete were all exercised against the live stack. Findings are limited to a
security-hardening item already planned for Phase 12, one HTTP-status
contract mismatch, one QA-harness defect, and several documentation
inaccuracies — none block the move to Docker.

**Production Readiness Score: 90 / 100.**

---

## 2. Backend Status

- `./mvnw clean test` → **BUILD SUCCESS**, `Tests run: 50, Failures: 0, Errors: 0, Skipped: 0`.
- Per class: Analytics 8 · Email 13 · FarmerVerification 10 · PasswordReset 7 · SoftDelete 11 · Context 1.
- **No flaky tests observed** across the run; deterministic DB cleanup
  (`TransactionTemplate`, `@AfterAll`) worked.
- `./mvnw compile` (implied by the test build) clean. Boot time ~7 s.
- **⚠️ Documentation note (resolved 2026-08-06):** docs 01/02/09/11/22 stated
  **60 test methods**; the actual executed count is **50**. The discrepancy
  came from counting the `@TestInstance` / `@TestMethodOrder` annotations
  (2 per class) as `@Test`. All documented counts were corrected to **50/50**
  in the Pre-Docker Cleanup Sprint (`reports/PreDockerCleanup.md`).

## 3. Frontend Status

- `npm run build` → **success**, 792 modules transformed, `✓ built in 5.22s`,
  **0 errors / 0 warnings**.
- Bundle split working: `vendor-react` 209 kB, `vendor-charts` 432 kB
  (recharts, on-demand), main `index` 243 kB (gzip 58 kB).
- No broken imports — the full browser E2E suite (all roles, verification,
  analytics) ran against the production-build-equivalent dev server and
  passed 56/56.

## 4. Authentication Status

Live probes against `:8080`:

| Case | Result | Expected (docs §2.6) |
|---|---|---|
| Register buyer / farmer | ✅ 200 | 200 |
| Register with role `ADMIN` | ✅ **400 "Only FARMER and BUYER…"** (privilege escalation blocked) | n/a |
| Register with no role | ✅ 400 (clean) | docs claim DB-error 500 |
| Duplicate email | ⚠️ **409** `ErrorResponse` | docs §3.1.1 claim **200** "Email already exists" |
| Login valid | ✅ 200 + JWT (1 h expiry, email + role claims) | 200 |
| Login wrong password | ✅ 400 "Invalid email or password" | 400 |
| Login unknown email | ✅ 400 **identical** message (enumeration-safe) | 400 |
| Login deactivated account | ✅ 403 (no JWT minted) | 403 |
| Valid token on protected route | ✅ 200 | 200 |
| Wrong role (buyer token → `/api/admin/**`) | ✅ 403 | 403 |
| **No token** | ⚠️ **403** | docs claim **401** |
| **Garbage token** | ⚠️ **403** | docs claim **401** |
| **Expired-but-valid-signature token** | ⚠️ **403** | docs claim **401** |
| Tampered token | ✅ 403 | 403 |
| Logout | ✅ client-side token removal (stateless JWT — no server session) | n/a |

**Finding (Medium):** missing / invalid / expired tokens return **403**
(Spring Security's default entry point), while `docs/05_API_CONTRACT.md` §2.6
promises **401**. The frontend's 401 response-interceptor in `services/api.js`
(clear auth + redirect to `/login`) is therefore **dead code in practice** —
an expired token yields a generic 403 instead of the intended login redirect.
Recommendation: register an `AuthenticationEntryPoint` returning
`401 + WWW-Authenticate: Bearer`; then the existing interceptor works as
designed and the API contract becomes accurate.

## 5. Farmer Flow

Verified end-to-end via the live E2E suite (backend 218-check run), the
browser suite, integration tests, and targeted probes:

| Step | Evidence |
|---|---|
| Register | ✅ UI + API (200), welcome email hook fired |
| Login | ✅ 200 + JWT |
| Profile | ✅ create / get / update |
| Verification submission | ✅ multipart submit → PENDING (docs + approve gate) |
| Admin approval / rejection | ✅ approve → APPROVED; reject-with-reason → REJECTED (reason stored) |
| Login after approval | ✅ |
| Add / Edit / Delete product | ✅ with ownership checks + 403 gate until APPROVED |
| View / Accept / Reject / Complete orders | ✅ state machine PENDING→ACCEPTED→COMPLETED / REJECTED with stock restore |
| Buyer visibility | ✅ only APPROVED farmers' products visible |

One harness note: the browser suite's farmer section depends on a
**hardcoded account** (`qa/uitest.js` line 15) that a prior soft-delete QA run
had deactivated. The farmer was restored via the real admin reactivate API
and the full suite then passed 56/56 — the product behaved correctly in every
step (see §8 for the harness defect).

## 6. Buyer Flow

| Step | Evidence |
|---|---|
| Register / Login | ✅ UI flows + redirects |
| Browse Products | ✅ grid renders (20 cards asserted) |
| Search | ✅ 'Rice' filters 20 → 1 |
| Filter (category) | ✅ category endpoint + UI |
| Wishlist | ✅ add / list / remove / empty state |
| **Cart** | ⚠️ Not implemented — **by design** (documented backlog item). Buyers order directly from the product-details checkout modal. |
| Checkout / Place Order | ✅ stock validation + deduction, total price, notification + email to farmer |
| Review Product | ✅ purchased-only, one per product, author-only edit/delete, rating aggregation |
| Notifications | ✅ in-app list, read/unread, clear-all + dashboard |

## 7. Admin Flow

| Workflow | Evidence |
|---|---|
| Login | ✅ |
| Dashboard + Analytics | ✅ 13 cards / 6 charts; 218-check suite incl. analytics consistency (status sum == orders) |
| Approve / Reject Farmer | ✅ approve + reject-with-reason dialogs (UI) & endpoints |
| Manage Users | ✅ list / update / role & status filters |
| Soft Delete / Reactivate User | ✅ deactivate → 403 everywhere → reactivate → restored (11 integration tests + live checks) |
| Announcements | ✅ send + history, audience filtering, admin-only 403 enforced |
| Notifications | ✅ |
| **Reports** | ⚠️ No dedicated "reports" module — analytics dashboards + Postman/Swagger + `farmbridge-orders-*.csv` sample serve this role today (acceptable at this scale). |

## 8. Email System

Verified by `EmailNotificationFlowIntegrationTest` (13 tests, mocked
`JavaMailSender` with argument capture) — all 9 flows:

- ✅ Welcome (registration)
- ✅ Verification approved / rejected (reason + resubmit button)
- ✅ Order placed → farmer; order accepted / rejected (reason) / completed → buyer
- ✅ Password reset (HTML, 15-minute expiry, reset button)
- ✅ Announcement (ALL / BUYERS / FARMERS filtering)
- ✅ **SMTP failure never rolls back business logic** (fail-safe verified)
- ✅ HTML template, branding (logo/header/footer), escaping of user content
- ✅ No duplicate sends; test DB cleanup

**Live SMTP delivery was not exercised** — mail credentials are
environment-variable placeholders (`${MAIL_USERNAME:}`, `${MAIL_PASSWORD:}`)
and no SMTP account is configured locally, exactly as designed. Subject /
recipient / template correctness is asserted at the mock layer. Re-run the
email tests or configure real SMTP in Phase 12 to verify live delivery.

## 9. Soft Delete Flow

Verified by `SoftDeleteFlowIntegrationTest` (11 tests) + live E2E checks +
a manual live round-trip during this audit:

- ✅ Deactivate buyer → login blocked (403), no JWT
- ✅ Existing JWT rejected on every secured endpoint (filter gate + `flushBuffer`)
- ✅ **Orders, reviews, notifications, products, analytics preserved** (record + history intact; admin still lists the user)
- ✅ Reactivate → login + full access restored (verified live: user id 67 reactivated → login 200 → dashboard flows)
- ✅ Deactivated farmer: products hidden from buyers (list/search/details/wishlist) but visible to admins
- ✅ Analytics unchanged in design (read-only aggregations over preserved data)
- ✅ Admin self-deactivation blocked (400); last-active-admin protected (400)

## 10. Security Audit

| Check | Result |
|---|---|
| JWT (HS256, 1 h expiry, email + role claims, signature verified) | ✅ |
| Expired / tampered token rejected | ✅ (403 gate) |
| RBAC (ADMIN / FARMER / BUYER matchers + service-layer re-checks) | ✅ defense in depth — UI gating is not the boundary |
| ADMIN self-registration | ✅ blocked (400) |
| Enumeration-safe login & forgot-password | ✅ identical generic messages |
| Bean validation on all request DTOs | ✅ (400 with field errors) |
| Centralized exception handling, generic 500s (no stack traces leaked) | ✅ |
| Soft-delete gate in the JWT filter | ✅ |
| Upload validation (magic bytes, ≤5 MB, UUID filenames) | ✅ |
| BCrypt password hashing | ✅ |
| **Sensitive data in config** | ⚠️ `spring.datasource.password` and `jwt.secret` are **hardcoded** in `src/main/resources/application.properties` (and test resources). Documented Phase-12 item — **must become env vars before any shared/cloud deployment**. Also present in the QA helper `qa/DbTool.java`. |
| JWT stored in `localStorage`/`sessionStorage` | ⚠️ XSS-exposure surface (common trade-off; HttpOnly cookies would be stronger — note for Phase 12+) |
| Swagger UI / api-docs public | ⚠️ fine for dev; disable or secure in production (SpringDoc logs a WARN on boot) |

## 11. Documentation Audit

| Check | Result |
|---|---|
| All 11 ADF docs present | ✅ |
| `docs/reports/` complete (9 reports incl. this one) | ✅ |
| Broken relative links in docs | ✅ none (automated check) |
| **README screenshot links** | ⚠️ **13 broken** — README references `screenshots/*.png` at repo root; those files do not exist (actual captures live in `qa/screenshots/`) |
| Test-count accuracy | ✅ resolved — docs corrected from 60 to **50/50** in the Pre-Docker Cleanup Sprint |
| API contract accuracy | ⚠️ 3 mismatches: 401 vs 403 (§2.6), duplicate email 200 vs **409** (§3.1.1), null role 500 vs **400** (§3.1.1) |
| `09_TESTING.md` "Last full run 203" | ✅ resolved — updated to the **218**-check RC validation run |
| Duplicate information | ✅ timeline (`07_TASKS.md`) is concise; detail lives in `docs/reports/` |
| Day 16–24 report numbering & cross-references | ✅ consistent after the Day-24 documentation refactor |

## 12. Code Quality (reported only — nothing fixed)

| # | Finding | Severity |
|---|---|---|
| 1 | `qa/uitest.js` hardcodes `qa_farmer1_1785918721@test.com` (line 15) — a backend-suite account that gets a fresh timestamp each run and can be soft-deleted by other QA runs. **Suite breaks until the account is restored** (demonstrated live). Fix: have the UI suite seed/derive its own farmer, or read the account from the backend suite output. | Medium (QA) |
| 2 | Dead frontend code: `components/Navbar.jsx` — **0 importers** (superseded by `AppLayout`/`TopNavbar` in Day 18). *(Correction: `NotificationBell.jsx` + `.css` were initially flagged too, but it is **still used** by `TopNavbar.jsx` via a relative import — kept.)* | Low |
| 3 | `PasswordGenerator.java` — unused utility containing `System.out.println`. | Low |
| 4 | Frontend 401 interceptor is effectively dead (backend never returns 401 — see §4). | Low-Medium |
| 5 | No orphan CSS files; all 20 `ui/` components exported via barrel; no unused DTOs; no `TODO/FIXME/HACK` in backend or frontend source; no `console.log` in `frontend/src`; no `@Deprecated`; no empty catch blocks; no hardcoded URLs in the frontend (uses Vite `/api` proxy + relative `uploads` paths). | ✅ clean |
| 6 | `TestController` (`/api/test`) and the auth greeting stubs remain — intentional QA/health endpoints. | Info |
| 7 | "Magic numbers" are limited and documented (1 h JWT expiry, 5 MB/6 MB upload limits, page sizes). | ✅ |

## 13. Known Limitations (pre-existing, documented)

1. No load/performance testing yet (NFR-PERF <500 ms, ~100 users unverified).
2. Product search by name — repository support exists, no controller endpoint (documented gap).
3. DB password + JWT secret hardcoded in `application.properties` (env-var hardening planned for Phase 12).
4. No CI/CD pipeline yet — tests run manually/locally.
5. Email delivery is best-effort (fail-safe by design; no retry queue).
6. Notifications use REST polling, not websockets.
7. No migration tool — `ddl-auto=update` (Flyway planned for Phase 12).
8. No shopping cart or payment processing (backlog).

## 14. Production Readiness Score

| Dimension | Score / Notes |
|---|---|
| Functional correctness (all flows) | 30/30 — 3 green suites + live probes |
| Security posture | 22/25 — strong RBAC/auth; −3 for hardcoded secrets, token storage, public Swagger |
| Build & test integrity | 13/15 — clean builds; −2 for doc test-count overstatement |
| Documentation accuracy | 8/10 — −2 for API-contract mismatches, README links |
| Code quality | 9/10 — −1 for dead components/util |
| QA infrastructure | 8/10 — −2 for the hardcoded-account harness defect |
| **Total** | **90 / 100** |

## 15. Recommendations Before Docker (Phase 12)

1. **Harden secrets** (Phase-12 step 1): move `spring.datasource.password`
   and `jwt.secret` to environment variables with no committed defaults —
   for main *and* test resources.
2. **Fix the 401 contract**: add an `AuthenticationEntryPoint` returning
   401 + `WWW-Authenticate` for missing/invalid/expired tokens; the frontend
   interceptor then handles expired sessions correctly. Update
   `05_API_CONTRACT.md` §2.6 and §3.1.1 (duplicate email 409, null role 400).
3. **Fix the QA harness**: make `qa/uitest.js` seed its own farmer (or read
   the backend suite's generated account) so the suite is self-contained.
4. **Correct documentation counts**: 50 tests (not 60), 218 live checks
   (not 203), per-class counts in `09_TESTING.md`.
5. **Fix README screenshots** — point at `qa/screenshots/` or add the images.
6. **Remove dead code** (`Navbar.jsx`, `NotificationBell.jsx`,
   `PasswordGenerator.java`) and the dead 401 interceptor path.
7. Disable or secure Swagger for production; consider HttpOnly-cookie token
   storage as a hardening follow-up.

---

## Verdict

All verification layers are green, no blocking functional defects were
found, and every open item is already tracked in the Phase 12–14 plan or is a
low-risk cleanup.

> **FarmBridge v1.0 is approved for Phase 12 (Docker & Docker Compose).**

---

*End of Release Candidate Validation Report*
