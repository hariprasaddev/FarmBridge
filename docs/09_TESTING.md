# FarmBridge — Testing & QA Document

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Counts audited against the repository on 2026-08-06

---

## 1. Testing Strategy

Four complementary layers:

1. **Backend integration tests** (`./mvnw test`) — real Spring context,
   real MySQL stack, mock only for SMTP.
2. **Backend live E2E** (`qa/backend_test.sh`) — boots against the running
   app on `:8080`, exercises every API contract over HTTP.
3. **Frontend browser E2E** (`qa/uitest.js`, Puppeteer) — full user journeys
   in Chrome against `:5173`, with screenshots.
4. **Builds & static verification** — `./mvnw compile` / `./mvnw package` and
   `npm run build` (clean output required).

---

## 2. Backend Unit & Integration Tests (`./mvnw test`)

**Current count: 78 test methods across 9 classes** (verified via `./mvnw test`).

| Test class | Methods | Coverage |
|---|---|---|
| `AnalyticsFlowIntegrationTest` | 11 | Admin/farmer/buyer analytics values + authorization matrix (403s, JWT-scoped) |
| `AnalyticsServiceImplTest` | 11 | Analytics service aggregation edge cases (unit) |
| `EmailNotificationFlowIntegrationTest` | 13 | All email flows (mocked `JavaMailSender`), audience filtering, SMTP-failure non-rollback, cleanup |
| `FarmerVerificationFlowIntegrationTest` | 10 | Submit/resubmit, approve/reject-with-reason, 403 gates, document rules, buyer visibility |
| `PasswordResetFlowIntegrationTest` | 7 | Forgot/reset lifecycle, enumeration safety, expiry, single-use tokens |
| `ProductSearchIntegrationTest` | 6 | Search API: partial match, case-insensitivity, empty results, approval filtering, 403s |
| `ProductPaginationIntegrationTest` | 8 | Server-side pagination/sorting: page metadata, size, sort, category filter, exact totals, 403s |
| `SoftDeleteFlowIntegrationTest` | 11 | Deactivate → blocked everywhere → reactivate → restored; data preserved; admin guards |
| `FarmBridgeApplicationTests` | 1 | Spring context loads |

Historical progression (from the milestone reports in `docs/reports/`):
18 → 26 → 39 → 50 → 70 (search added) → **78** (pagination added).

---

## 3. Backend Live E2E Suite (`qa/backend_test.sh`)

- Runs against the running backend (`:8080`); asserts status codes, business
  rules, and data integrity via HTTP + DB reads.
- **Last full run: 218 PASS / 0 FAIL** (Release Candidate validation run, 2026-08-06 —
  [reports/ReleaseCandidateValidation.md](reports/ReleaseCandidateValidation.md));
  the Day 17 run recorded 203 PASS / 0 FAIL
  ([reports/AnalyticsDashboard.md](reports/AnalyticsDashboard.md)). The Day 16–21
  milestones added more checks (verification +24, analytics +16,
  email/announcements, soft-delete lifecycle) — the suite has only grown.
- Covers: authentication (21), farmer profile (6), farmer verification (25),
  products & images (25), orders (23), reviews (17), wishlist (11),
  notifications (17), password reset (15), admin (23), analytics (28).
- Historical results archived in `qa/backend_test_results*.txt`.

---

## 4. Frontend Browser E2E Suite (`qa/uitest.js`)

- Puppeteer browser automation against `:5173` (backend proxied to `:8080`).
- **Last reported run: 56 PASS / 0 FAIL** (Day 20 — [reports/EmailNotificationSystem.md](reports/EmailNotificationSystem.md)).
  Captures screenshots into `qa/screenshots/`.
- Covers: auth flows, buyer flows (browse, order, wishlist, reviews, dashboard),
  farmer flows (products, orders, verification), admin flows (users, products,
  orders, verification, announcements), analytics dashboards, protected routes.

---

## 5. Manual QA Checklist

- Register FARMER + BUYER (duplicate email → friendly message; no ADMIN via UI).
- Login → role-based redirect; wrong-role access → 403; invalid token → 401.
- Farmer: profile → verification (PENDING) → admin approve → create product +
  image → buyer sees Verified badge.
- Admin: reject without reason → 400; reject with reason → farmer sees it.
- Orders: place → farmer accepts → completes; buyer receives notification +
  email; stock deducted; rejection restores stock.
- Soft delete: deactivate buyer → login blocked (403); reactivate → access
  restored; self-deactivation blocked (400).
- Notifications: unread badge, mark read, clear all.
- Announcements: send to BUYERS → buyers receive email; history recorded;
  non-admin → 403.

---

## 6. Swagger Verification

- UI: `http://localhost:8080/swagger-ui` — all 73 endpoints listed, grouped
  by `@Tag` (Admin, Farmer Products, Orders, Reviews, Wishlist, Notifications,
  Analytics, Password Reset, …).
- JSON: `http://localhost:8080/v3/api-docs`.
- Use the **Authorize** button with a JWT from `POST /api/auth/login` to test
  protected endpoints interactively.

## 7. Postman Testing

- Collection: `docs/FarmBridge_API.postman_collection.json` (**41 requests**)
  with environment `docs/FarmBridge_Environment.postman_environment.json`
  (base URL + tokens).
- Covers auth, profiles, products, orders, reviews, wishlist, notifications,
  password reset, admin, verification, analytics, announcements.

## 8. Frontend Build

- `npm run build` (Vite) — clean, 0 errors / 0 warnings.
- Vendor chunk splitting (`vendor-react`, `vendor-charts` [recharts],
  `vendor-icons`) keeps the main bundle small (~211 kB after split).

## 9. Backend Build

- `./mvnw compile` — BUILD SUCCESS.
- `./mvnw package -DskipTests` — jar built and runnable on `:8080`.
- `./mvnw test` — 50/50 green (see §2).

---

## 10. Known Limitations

| # | Limitation | Impact / Note |
|---|---|---|
| 1 | No load/performance testing yet | NFR-PERF targets (<500 ms, ~100 users) unverified |
| 2 | ~~Product search has no endpoint~~ | **Resolved** — `GET /api/buyer/products/search` + debounced UI + tests |
| 3 | ~~DB password + JWT secret hardcoded~~ | **Resolved** — env-only placeholders (`${DB_PASSWORD:}` / `${JWT_SECRET:}`) |
| 4 | ~~No CI/CD pipeline~~ | **Resolved** — GitHub Actions CI/CD with Docker Hub publish
| 5 | Email delivery is best-effort (no retry queue) | Fail-safe by design; deliveries depend on SMTP provider |
| 6 | No dedicated unit tests for every service method | Integration + E2E suites cover the main paths |
| 7 | Notifications use REST polling, not websockets | Acceptable for the current scale |
| 8 | No migration tool (Flyway) | `ddl-auto=update` used; production migration planned |

---

*End of Testing Document*
