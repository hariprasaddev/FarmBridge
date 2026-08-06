# Enterprise Soft Delete — Milestone Report

> **Day:** Day 21 · **Date:** 2026-08-06
> **Report:** `docs/reports/SoftDelete.md`
> **Master timeline:** [`docs/07_TASKS.md`](../07_TASKS.md) — Day 21

## Overview

FarmBridge now uses **enterprise soft delete**: deactivating a user **never removes the database record**. Setting `active=false` blocks login and every secured endpoint while **all historical data — orders, reviews, wishlist, notifications, products, analytics — is fully preserved**. Admins can reactivate an account at any time, instantly restoring full access. The feature spans Entity → Repository → Service → Controller → Security Filter → Frontend, and is verified by a dedicated 11-test integration suite plus expanded live QA checks.

**Admin self-protection (review-driven addition):** an admin can never deactivate their own account, and the **last active ADMIN** can never be deactivated — the platform can never be permanently locked out of `/admin`.

---

## 1. Files Created

| File | Purpose |
|---|---|
| `src/test/java/com/farmbridge/SoftDeleteFlowIntegrationTest.java` | 11 end-to-end tests proving the full lifecycle: deactivate → blocked everywhere → reactivate → access restored (see §6) |
| `docs/reports/SoftDelete.md` | This report |

---

## 2. Files Modified

### Backend
| File | Change |
|---|---|
| `entity/User.java` | New `active` boolean (default `TRUE`, backfills existing rows via `columnDefinition`) |
| `repository/UserRepository.java` | `countByActive`, `countByRoleAndActive` (status breakdown + admin-guard math) |
| `security/JwtAuthFilter.java` | **Deactivation gate on every secured request** — a still-valid JWT from a deactivated account returns 403 JSON (`active` checked per request); added `flushBuffer()` |
| `service/AuthServiceImpl.java` | Login rejects deactivated accounts with the 403 message (no JWT minted) |
| `service/UserService.java` + `UserServiceImpl.java` | `deleteUser` → soft delete (`active=false`); new `deleteUser(id, actingEmail)` with **self-deactivation guard** + **last-active-admin guard**; `activateUser` |
| `service/AdminService.java` + `AdminServiceImpl.java` | `deleteUser(id, actingEmail)` (passes the acting admin's email through); dashboard stats include the new status counts |
| `controller/AdminController.java` | `DELETE /api/admin/users/{id}` now soft-deletes (message updated); `PUT /api/admin/users/{id}/reactivate`; both resolve the acting admin from the JWT |
| `controller/UserController.java` | Same soft-delete + reactivate contract on `/api/users/{id}` |
| `dto/UserResponse.java` | New `active` flag (5-arg constructor; 4-arg defaults to `true` for backward compatibility) |
| `dto/AdminDashboardResponse.java` | `activeUsers`, `inactiveUsers`, `activeFarmers`, `inactiveFarmers` |
| `dto/AdminAnalyticsResponse.java` | `sellingFarmers`, `activeUsers`, `inactiveUsers`, `activeFarmers`, `inactiveFarmers` |
| `service/AnalyticsServiceImpl.java` | Computes all five new fields; `mapLatestFarmers` now reports the real `active` flag |
| `service/OrderServiceImpl.java` | Deactivated buyers cannot place orders; deactivated farmers cannot receive/manage orders (`assertFarmerApproved`) |
| `service/ProductServiceImpl.java` | Deactivated farmers cannot create/edit/delete products or upload images; **products of deactivated farmers vanish from every buyer-visible surface** (list, search, category, details, wishlist) but stay visible to admins |
| `service/ReviewServiceImpl.java` | Deactivated buyers cannot submit reviews |
| `service/WishlistServiceImpl.java` | Deactivated buyers cannot add to wishlist |
| `service/FarmerProfileService.java` | Deactivated farmers cannot create/update profiles or (re)submit verification |
| `service/PasswordResetServiceImpl.java` | Forgot-password stays **enumeration-safe**: inactive accounts get the identical generic response and no reset token |
| `exception/GlobalExceptionHandler.java` | Messages containing `deactivated` → **403 Forbidden** |
| `resources/application.properties` | Mail credentials **reverted to `${MAIL_USERNAME:}` / `${MAIL_PASSWORD:}` env-var placeholders** (the review found a live Gmail app password had been hardcoded) |

### Frontend
| File | Change |
|---|---|
| `services/api.js` | `reactivateUser` (PUT `/admin/users/{id}/reactivate`); delete message contract updated |
| `pages/AdminUsersPage.jsx` | Status column (ACTIVE/INACTIVE badges), Status + Role filter pills, Deactivate (with confirm dialog) / Reactivate actions, dimmed inactive rows + muted avatars, silent refresh after actions |
| `pages/AdminPages.css` | Restore-button styles, inactive-row/avatar styles |
| `pages/AdminDashboardPage.jsx` | 5 new stat cards — Selling Farmers, Active Users, Inactive Users, Active Farmers, Inactive Farmers (17 cards total, skeleton grid updated) |

### QA
| File | Change |
|---|---|
| `qa/backend_test.sh` | Soft-delete lifecycle section: deactivate user with relations → record preserved → JWT rejected (403) on login + secured endpoints → historical data intact → reactivate → full access restored; **admin self-deactivation → 400 guard check** |

---

## 3. Behavior Matrix

| Actor / Data | Deactivated state |
|---|---|
| Login | ❌ blocked (`403` message, no JWT) |
| Existing JWT (any secured endpoint) | ❌ rejected by `JwtAuthFilter` with 403 JSON |
| Place order / add to wishlist / submit review / update profile / submit verification / manage products | ❌ blocked (service-level guards, same 403 message) |
| Buyer-visible product surfaces | ❌ deactivated farmer's products hidden (list/search/category/details/wishlist) |
| Admin product oversight | ✅ still sees every product |
| Admin user list / dashboard analytics | ✅ record + status reported (`active:false`) |
| Order / review / revenue history | ✅ **fully preserved** |
| Forgot password | 🔒 enumeration-safe — identical generic response, no token |
| Reactivation (admin) | ✅ login + every capability restored instantly |
| Admin deactivating themselves | ❌ blocked (400) |
| Deactivating the last active ADMIN | ❌ blocked (400) |

---

## 4. Admin Self-Protection Guard (review-driven)

`UserServiceImpl.deleteUser(id, actingEmail)` enforces:

1. **Self-deactivation is impossible** — `actingEmail` comes from the JWT; target email matching it throws `You cannot deactivate your own account`.
2. **The last active ADMIN is untouchable** — if the target is an active `ADMIN` and `countByRoleAndActive(ADMIN, true) <= 1`, the operation throws `Cannot deactivate the last active admin account`.

Both surface as HTTP 400 via `GlobalExceptionHandler`. The frontend error toast reports them naturally — no extra UI state needed.

---

## 5. SMTP Configuration (environment variables only — nothing hardcoded)

```
MAIL_HOST          spring.mail.host
MAIL_PORT          spring.mail.port
MAIL_USERNAME      spring.mail.username
MAIL_PASSWORD      spring.mail.password
APP_BASE_URL       app.base-url
```

The review flagged that a live Gmail app password had been committed in `application.properties`; it is **reverted to env-var placeholders** — set `MAIL_USERNAME` / `MAIL_PASSWORD` locally, never in git.

---

## 6. Test Results (backend)

`SoftDeleteFlowIntegrationTest` — 11 ordered tests against the real stack:

✔ Historical data exists before deactivation (order + review + revenue)
✔ Deactivated buyer cannot log in (403 message, no JWT) — record still exists
✔ Deactivated buyer cannot place orders
✔ Reactivated buyer can log in and order again
✔ Deactivated farmer cannot log in or create products
✔ Deactivated farmer's products hidden from buyers (list/details/search) but visible to admins
✔ Historical orders, reviews, product and user records survive deactivation
✔ Reactivated farmer can log in and create products (visible to buyers again)
✔ Forgot password — identical generic response for inactive users vs unknown emails
✔ Admin user list reports the `active` flag correctly
✔ **Admin guard** — self-deactivation blocked; last active admin protected (count-based, deterministic in any DB state)

```
Tests run: 50, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Full suite: 8 analytics + 13 email + 10 verification + 1 context + 7 password-reset + **11 soft-delete**.

---

## 7. QA Script Additions

The live `qa/backend_test.sh` now verifies (after app restart):

```
DELETE /api/admin/users/{id}                     → 200 "deactivated successfully"   (user WITH relations)
GET  /api/admin/users/{id}                       → 200 "active":false               (record preserved)
POST /api/auth/login (deactivated buyer)         → 403 "deactivated"
GET  /api/buyer/products (old JWT)               → 403 "deactivated"                (filter gate)
POST /api/buyer/orders (old JWT)                 → 403 "deactivated"
GET  /api/admin/users                            → buyer still listed               (data preserved)
PUT  /api/admin/users/{id}/reactivate            → 200 "activated successfully"
POST /api/auth/login (reactivated)               → 200 "Login successful"           (access restored)
GET  /api/buyer/orders (new JWT)                 → 200 order history intact
DELETE /api/admin/users/{adminId} (self)         → 400 "own account"                (guard)
```

---

## 8. Build Results

| Check | Result |
|---|---|
| `./mvnw test` | **BUILD SUCCESS** — 50/50 (8 analytics + 13 email + 10 verification + 1 context + 7 password-reset + 11 soft-delete) |
| `./mvnw compile` | Success |
| `npm run build` | Success — 792 modules, 0 errors / 0 warnings |

---

## 9. Review-Fix Verification

| # | Fix | Status |
|---|---|---|
| 1 | **Last-admin / self-deactivation lockout risk** → `deleteUser(id, actingEmail)` guards added (backend only — the only safe enforcement point); QA self-deactivation check added | ✔ |
| 2 | **Hardcoded Gmail app password in `application.properties`** → reverted to `${MAIL_USERNAME:}` / `${MAIL_PASSWORD:}` env-var placeholders | ✔ |
| 3 | `AnalyticsServiceImpl.mapLatestFarmers` reported deactivated farmers as `active=true` → now uses the 5-arg `UserResponse` constructor with `user.isActive()` | ✔ |
| 4 | `JwtAuthFilter.writeForbidden` → added `flushBuffer()` | ✔ |
| 5 | `SoftDeleteFlowIntegrationTest` compile: ambiguous `Order` (JUnit `@Order` vs entity) → entity references fully qualified | ✔ |
| 6 | Test cleanup: `notifications` FK blocked user deletion → `deleteByRecipientEmail` + `TransactionTemplate` (matches `EmailNotificationFlowIntegrationTest` convention) | ✔ |

---

## 10. End-to-End Flow

```
Admin deactivates user ──► active=false ──► login blocked ──► every secured endpoint 403
     │                                        (JWT filter + service guards)
     ├── buyer  : cannot order / wishlist / review
     ├── farmer : cannot sell; products hidden from buyers (visible to admins)
     └── data   : orders, reviews, revenue, analytics — untouched
Admin reactivates user ──► active=true ──► login restored ──► full access restored
```

## 11. Final Verification

All review points green: self/last-admin guard, SMTP credentials reverted to env placeholders, correct `active` flag on the Latest Farmers table, filter 403 flushed, test compiles and cleans up cleanly. **No existing feature or API regressed** — all 50 backend tests pass and the frontend production build succeeds.
