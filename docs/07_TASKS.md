# FarmBridge — Task Breakdown & Project History

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
>
> Days 1–15 are **reconstructed from the git history** and the commit
> sequence (commit messages preserved verbatim where available).
> Days 16–21 are documented by their official DAY reports in `docs/`.

---

## Milestone History

| Day | Milestone | Status | Evidence |
|---|---|---|---|
| Day 1 | Project setup — Spring Boot skeleton, Maven, MySQL connection, base entities | ✅ | git: *"Stable Build"* |
| Day 2 | Core entities + repositories — User, FarmerProfile, Product, Order | ✅ | git history |
| Day 3 | Authentication — registration (name/email/password/role), duplicate-email guard, BCrypt | ✅ | `AuthController`, `AuthServiceImpl` |
| Day 4 | Login + **JWT** — token issuance (email + role claims, 1 h expiry) | ✅ | `JwtUtil`, `AuthServiceImpl.login` |
| Day 5 | Spring Security — stateless config, CSRF off, `JwtAuthFilter`, role matchers (`/api/admin`, `/api/farmer`, `/api/buyer`) | ✅ | `SecurityConfig` |
| Day 6 | Farmer profiles — create / get / update, duplicate-profile guard | ✅ | `FarmerProfileController` |
| Day 7 | Product management — farmer CRUD with ownership checks | ✅ | `ProductController`, `ProductServiceImpl` |
| Day 8 | Buyer browsing — all products, details, **category filtering**, search repository support | ✅ | `BuyerProductController` |
| Day 9 | Orders — place order (stock validation + deduction, total price), buyer order list | ✅ | `OrderServiceImpl.placeOrder` |
| Day 10 | Order status management — PENDING→ACCEPTED→COMPLETED / REJECTED state machine, stock restore on rejection | ✅ | `updateOrderStatus` |
| Day 11 | Admin module — stats, user CRUD, farmer/buyer lists, product & order oversight | ✅ | `AdminController` |
| Day 12 | **Reviews** — purchased-only reviews, uniqueness, author-only edit/delete, rating aggregation | ✅ | `ReviewServiceImpl`, git: *"Complete Reviews"* |
| Day 13 | **Wishlist** — add/remove/list/check | ✅ | `WishlistController` |
| Day 14 | **In-app notifications** — order events, read/unread, delete/clear | ✅ | `NotificationServiceImpl` |
| Day 15 | **Forgot / reset password** — token lifecycle, enumeration-safe | ✅ | `PasswordResetServiceImpl` |
| Day 16 | **Farmer verification workflow** — submit/resubmit, approve/reject-with-reason, 403 selling gate, buyer visibility filter | ✅ | `DAY16_FARMER_VERIFICATION_REPORT.md` |
| Day 17 | **Analytics dashboards** — 10 role-scoped endpoints, server-side aggregation, charts | ✅ | `DAY17_ANALYTICS_DASHBOARD_REPORT.md` |
| Day 18 | **Enterprise UI · Phase 1** — design system + app shell (sidebar, top navbar, 21 components) | ✅ | `DAY18_UI_REDESIGN_PHASE1_REPORT.md` |
| Day 19 | **Enterprise UI · Phase 2** — every page redesigned on the design system, floating labels, dialogs | ✅ | `DAY19_UI_REDESIGN_PHASE2_REPORT.md` |
| Day 20 | **Email notification system** — 9 HTML email flows, announcements, fail-safe SMTP | ✅ | `DAY20_EMAIL_NOTIFICATION_SYSTEM_REPORT.md`, git: *"Day 20: Implement Enterprise Email Notification System"* |
| Day 21 | **Enterprise soft delete** — deactivate/reactivate, self & last-admin guards, data preserved | ✅ | `DAY21_SOFT_DELETE_REPORT.md`, git: *"updated admin features with soft lock"* |
| Day 22 | **ADF documentation compliance** — docs 01–11 aligned, API contract audit (74 endpoints), report | ✅ | `DAY22_ADF_COMPLIANCE_REPORT.md` |

---

## Committed Milestones (git log, newest first)

```
updated admin features with soft lock                    → Day 21
Day 20: Implement Enterprise Email Notification System   → Day 20
created farmer verifaction for backend and frontend      → Day 16
completed testing                                        → test suite completed
completed API Documentation                              → Swagger + Postman
Complete FarmBridge project with wishlist, notifications,
  forgot password, and reviews                            → Days 12–15
Complete Reviews                                          → Day 12
feat: implement product image upload with frontend
  integration                                             → product images
Complete FarmBridge v1.0 with premium UI and admin module → Days 1–11
Stable Build                                              → Day 1
```

## Completed Workstreams

- ✅ Authentication & JWT
- ✅ Role-based access
- ✅ Farmer profiles & verification
- ✅ Product management & images
- ✅ Orders & order status lifecycle
- ✅ Reviews, wishlist, notifications
- ✅ Password reset & email system
- ✅ Analytics dashboards
- ✅ Enterprise UI (design system + page redesign)
- ✅ Soft delete
- ✅ Swagger, Postman, unit/integration/E2E tests

## Remaining / Upcoming (planned)

| Task | Phase |
|---|---|
| Docker images + Docker Compose | Phase 12 (next) |
| Environment-variable hardening (DB password, JWT secret) | Phase 12 |
| CI/CD pipeline (GitHub Actions) | Phase 13 |
| Cloud deployment (Azure backend, Vercel frontend, managed MySQL) | Phase 14 |
| Health checks + rollback strategy | Phase 14 |
| Product search by name endpoint | Optional backlog |
| Payment integration, shopping cart | Backlog |

---

*End of Task Breakdown*
