# FarmBridge — Master Project Timeline

> **Document Version:** 2.0 (master timeline)
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
>
> This document is the **single source of truth for the project timeline**:
> every ADF working day, its date, goal, key deliverables, and status.
> Detailed implementation reports live separately in
> [`docs/reports/`](reports/) and are linked from the relevant days — this
> timeline deliberately does **not** duplicate report content.
>
> Day numbers are ADF **working-day labels**, not calendar dates: multiple
> work streams ran in parallel, so a single calendar date can carry more than
> one day label (for example, August 4 produced three milestone commits).
> The journey runs from repository creation (**July 24, 2026**) through the
> latest milestone (**August 6, 2026**).
>
> **Timeline in one line:** planning began late July; the core marketplace
> was built gradually through the v1.0 stable build (August 2); the
> enterprise improvements — verification, analytics, UI redesign, email,
> soft delete, documentation — followed August 3–6.

---

## Phase 1 — Planning & Foundation (Days 1–3)

### Day 1 — Jul 24 · Project Idea & Foundation

**Goal:** Project idea, problem statement, technology selection, repository creation.

**Completed:**
- Project idea finalized — direct farmer↔buyer marketplace without intermediaries
- Technology stack selected (Java 25, Spring Boot 4.1, MySQL 8, React 18, Vite, Maven)
- Repository created

**Status:** ✅ Complete

### Day 2 — Jul 25–27 · Requirements Engineering

**Goal:** Requirements analysis, user roles and scope; backend + frontend scaffolding.

**Completed:**
- Functional requirements and user stories (FARMER / BUYER / ADMIN)
- In-scope / out-of-scope for v1 agreed
- Spring Boot backend + Vite React frontend scaffolded

**Status:** ✅ Complete

### Day 3 — Jul 27–28 · Architecture & API Planning

**Goal:** Layered architecture, database design, REST API planning.

**Completed:**
- Layered package structure (controller / service / repository / entity / dto / config / security)
- Database schema for users, farmer profiles, products, orders
- API contract drafted; requirements + API contract docs committed

**Status:** ✅ Complete

---

## Phase 2 — Core Marketplace v1.0 (Days 4–8)

### Day 4 — Jul 25–29 · Authentication Module

**Goal:** Registration, login, JWT, role-based access, farmer profile.

**Completed:**
- Registration with BCrypt + duplicate-email guard
- JWT issuance (email + role claims, 1 h expiry) + role-based authorization
- Farmer profile create / get / update; user-module profile validation (backend + frontend)

**Status:** ✅ Complete

### Day 5 — Jul 27–30 · Product Module

**Goal:** Farmer product CRUD with ownership checks; buyer browsing.

**Completed:**
- Farmer product create / read / update / delete with ownership checks
- Buyer browse, product details + category filtering

**Status:** ✅ Complete

### Day 6 — Jul 27–31 · Order Module

**Goal:** Order placement with stock management and a status state machine.

**Completed:**
- Place order: stock validation + deduction, total price
- Status state machine PENDING → ACCEPTED → COMPLETED / REJECTED (stock restore)

**Status:** ✅ Complete

### Day 7 — Jul 31–Aug 1 · Admin Module & Frontend Integration

**Goal:** Admin oversight; full React frontend wired to the APIs.

**Completed:**
- Admin stats, user CRUD, role-filtered lists, product & order oversight
- React frontend integration with role-based routing and protected routes

**Status:** ✅ Complete

### Day 8 — Aug 2 · Stable Build (FarmBridge v1.0)

**Goal:** Premium UI + admin module polish; stable release build.

**Completed:**
- Premium UI + admin module polished
- Clean production build; v1.0 committed

**Status:** ✅ Complete

---

## Phase 3 — Enterprise Improvements (Days 9–15)

### Day 9 — Aug 3 · Product Images

**Goal:** Product image upload/delete with frontend integration.

**Completed:**
- Upload/delete with UUID filenames + magic-byte validation (JPG/PNG/WEBP/GIF, ≤ 5 MB)
- Image previews in the add/edit forms

**Status:** ✅ Complete

### Day 10 — Aug 4 · Reviews & Ratings

**Goal:** Purchased-only product reviews with rating aggregation.

**Completed:**
- Review module (purchased-only, one per product, author-only edit/delete)
- Rating aggregation on product responses

**Status:** ✅ Complete

### Day 11 — Aug 4 · Wishlist

**Goal:** Buyer wishlist save / remove / list / check.

**Completed:**
- Wishlist endpoints with unique buyer+product constraint

**Status:** ✅ Complete

### Day 12 — Aug 4 · In-App Notifications

**Goal:** Order-event notifications, strictly scoped to the owner.

**Completed:**
- Notification module (NEW_ORDER, ORDER_ACCEPTED, …) — read/unread, delete, clear-all

**Status:** ✅ Complete

### Day 13 — Aug 4 · Password Reset

**Goal:** Enumeration-safe forgot / reset password.

**Completed:**
- Single-use 15-minute tokens; identical generic responses for known and unknown emails

**Status:** ✅ Complete

### Day 14 — Aug 4–5 · API Documentation

**Goal:** Swagger/OpenAPI polish + Postman collection.

**Completed:**
- Swagger UI grouping + Postman collection (41 requests)

**Status:** ✅ Complete

### Day 15 — Aug 5 · Testing & QA Foundation

**Goal:** Backend integration tests + live E2E QA suites.

**Completed:**
- Backend integration test classes (Spring context, real stack)
- `qa/backend_test.sh` live HTTP E2E + `qa/uitest.js` browser E2E suites

**Status:** ✅ Complete

---

## Phase 4 — Enterprise Milestones (Days 16–22)

### Day 16 — Aug 5 · Farmer Verification

**Goal:** End-to-end verification workflow (submit → admin approve/reject → selling).

**Completed:**
- Submit/resubmit with documents; approve / reject-with-reason
- 403 selling gate (service layer) + buyer visibility filter
- 10 integration tests, 24 live checks, 14 UI checks

**Status:** ✅ Complete · **Detailed report:** [FarmerVerification.md](reports/FarmerVerification.md)

### Day 17 — Aug 5–6 · Analytics Dashboards

**Goal:** Production dashboards fed by real, aggregated backend data.

**Completed:**
- 10 role-scoped analytics endpoints (single-payload, grouped JPQL, no N+1)
- Admin/farmer/buyer dashboards — cards, charts, tables
- 8 integration tests, 16 live checks, 13 UI checks

**Status:** ✅ Complete · **Detailed report:** [AnalyticsDashboard.md](reports/AnalyticsDashboard.md)

### Day 18 — Aug 5–6 · Enterprise UI · Phase 1

**Goal:** Reusable design system + enterprise app shell.

**Completed:**
- 21 design-system components + `--fb-*` design tokens
- Sidebar + top navbar app shell — responsive and accessible

**Status:** ✅ Complete · **Detailed report:** [EnterpriseUIPhase1.md](reports/EnterpriseUIPhase1.md)

### Day 19 — Aug 5–6 · Enterprise UI · Phase 2

**Goal:** Redesign every application page on the design system.

**Completed:**
- All pages migrated (sticky tables, glass cards, status pills)
- Floating-label forms + design-system dialogs (ConfirmDialog / Modal)

**Status:** ✅ Complete · **Detailed report:** [EnterpriseUIPhase2.md](reports/EnterpriseUIPhase2.md)

### Day 20 — Aug 6 · Email Notification System

**Goal:** Professional HTML emails for all business events, fail-safe.

**Completed:**
- One reusable template powering 9 flows + admin announcements
- Fail-safe sends — email failures never roll back business logic
- 13 integration tests incl. SMTP-failure non-rollback

**Status:** ✅ Complete · **Detailed report:** [EmailNotificationSystem.md](reports/EmailNotificationSystem.md)

### Day 21 — Aug 6 · Enterprise Soft Delete

**Goal:** Deactivate/reactivate users preserving all historical data.

**Completed:**
- Soft delete (`active=false`) — login + secured endpoints blocked, data preserved
- Self-deactivation + last-active-admin guards
- 11 integration tests; live QA lifecycle

**Status:** ✅ Complete · **Detailed report:** [SoftDelete.md](reports/SoftDelete.md)

### Day 22 — Aug 6 · ADF Documentation Compliance

**Goal:** Bring the documentation into ADF compliance; create docs 07–11.

**Completed:**
- Docs 01–06 aligned; docs 07–11 created
- API contract audit (74 endpoints), readiness scoring

**Status:** ✅ Complete · **Detailed report:** [ADFCompliance.md](reports/ADFCompliance.md)

---

## Phase 5 — Documentation Stewardship (Days 23–24)

### Day 23 — Aug 6 · Documentation Alignment

**Goal:** Realign the documentation timeline with the real git history.

**Completed:**
- `07_TASKS.md` rebuilt around real commit dates (Jul 24 → Aug 6)
- `11_PROMPTS.md` Days 1–15 rewritten to match

**Status:** ✅ Complete · **Detailed report:** [DocumentationAlignment.md](reports/DocumentationAlignment.md)

### Day 24 — Aug 6 · Documentation Refactor

**Goal:** Separate the timeline from the implementation reports; professional structure.

**Completed:**
- Feature reports moved to `docs/reports/` under professional names
- `07_TASKS.md` rebuilt as this concise master timeline
- Cross-references updated across all documents

**Status:** ✅ Complete · **Detailed report:** [DocumentationRefactor.md](reports/DocumentationRefactor.md)

---

## Upcoming / Planned

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

*End of Master Project Timeline*
