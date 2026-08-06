# FarmBridge — AI Prompt History

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
>
> This log records the **category and intent** of the AI prompts that drove
> each milestone. Days 1–15 are reconstructed from the git history and commit
> messages (July 24 – August 5, 2026); Days 16–21 are summarized from the
> official milestone reports in `docs/reports/` (which were themselves produced
> with AI assistance),
> and Day 22 records the ADF documentation-compliance task. Exact prompt text
> is not preserved; each entry states the goal, the main constraints given to
> the AI, and the  acceptance criteria requested.
>
> Day numbers match `07_TASKS.md` (ADF working-day labels; several work
> streams ran in parallel, so one calendar date can carry more than one day).

---

## Day 1 — Project Idea & Foundation

- **Goal:** FarmBridge concept — a direct digital marketplace connecting
  farmers with buyers, eliminating unnecessary intermediaries; problem
  statement; technology selection; repository creation.
- **Constraints given to AI:** Java 25, Spring Boot 4.1.0, MySQL 8, React 18 +
  Vite, Maven, Git/GitHub.
- **Acceptance:** repository initialized; project skeleton compiles; context
  loads; database connects.

## Day 2 — Requirements Analysis & Scope

- **Goal:** Requirements analysis, user roles (ADMIN/FARMER/BUYER), in/out of
  scope for the first release; backend + frontend scaffolding.
- **Prompts:** "List the functional requirements and user stories for
  farmers, buyers and admins"; "Define the in-scope and out-of-scope items
  for v1"; "Initialize the Spring Boot backend with layered packages and the
  Vite React frontend".
- **Acceptance:** role matrix and scope agreed; both projects build.

## Day 3 — Architecture, Database & API Planning

- **Goal:** Layered architecture, entity/repository design, REST API
  planning; requirements + API contract documented.
- **Prompts:** "Design the package structure and the database schema for
  users, farmer_profiles, products and orders"; "Draft the API contract for
  authentication, products and orders".
- **Acceptance:** requirements + API contract docs committed (git
  "docs: complete requirements and API contract").

## Day 4 — Authentication Module

- **Goal:** Registration, login, JWT issuance/validation, role-based access;
  farmer profile create/get/update with duplicate-profile prevention; user
  profile validation (backend + frontend).
- **Prompts:** "Implement registration with BCrypt and duplicate-email guard";
  "Issue a JWT with email + role claims on login"; "Add a stateless
  SecurityConfig with a JwtAuthFilter and role matchers for
  /api/admin, /api/farmer, /api/buyer"; "Return 401 for invalid tokens and
  403 for wrong roles"; "Add farmer profile create/get/update".
- **Acceptance:** end-to-end register → login → protected call with token;
  profile validation green.

## Day 5 — Product Module

- **Goal:** Farmer product CRUD with ownership checks; buyer browsing with
  category filtering.
- **Prompts:** "Implement product create/read/update/delete so a farmer can
  only touch their own products"; "Add buyer endpoints to list all products,
  view details, and filter by category".
- **Acceptance:** ownership violations rejected; category filter works.

## Day 6 — Order Module

- **Goal:** Order placement with stock management and a status state machine.
- **Prompts:** "Place an order: validate stock, deduct quantity, compute
  totalPrice, link buyer/product/farmer"; "Add order status transitions
  PENDING→ACCEPTED→COMPLETED and PENDING→REJECTED with locked terminal
  states; restore stock on rejection".
- **Acceptance:** stock math verified; illegal transitions rejected.

## Day 7 — Admin Module & Frontend Integration

- **Goal:** Admin dashboard stats, user CRUD, role-filtered lists, product
  and order oversight; full frontend wired to the APIs.
- **Prompts:** "Create admin endpoints for stats, users, farmers, buyers,
  products and orders, ADMIN-only"; "Connect the React app to all APIs with
  role-based routing and protected routes".
- **Acceptance:** role matchers enforce ADMIN; full frontend integration
  green.

## Day 8 — Stable Build (FarmBridge v1.0)

- **Goal:** Premium UI + admin module polish; stable release build.
- **Prompts:** "Polish the admin module and UI for a v1.0 release"; "Verify a
  clean production build for both backend and frontend".
- **Acceptance:** `npm run build` clean; backend compiles; v1.0 committed.

## Day 9 — Enterprise Improvements Begin: Product Images

- **Goal:** Product image upload/delete with frontend integration.
- **Prompts:** "Add product image upload and delete with UUID filenames and
  magic-byte validation (JPG/PNG/WEBP/GIF, ≤5 MB)"; "Integrate image
  previews into the product add/edit forms".
- **Acceptance:** uploads verified; invalid files rejected.

## Day 10 — Reviews

- **Goal:** Purchased-only product reviews with rating aggregation.
- **Prompts:** "Allow only buyers with an ACCEPTED/COMPLETED order to review,
  one review per product, author-only update/delete"; "Expose average rating
  and star counts on product responses".
- **Acceptance:** duplicate review blocked; ratings aggregate correctly.

## Day 11 — Wishlist

- **Goal:** Buyer wishlist save/remove/list/check.
- **Prompts:** "Add buyer wishlist with unique buyer+product constraint".
- **Acceptance:** unique wishlist entries enforced (409 on duplicate).

## Day 12 — In-App Notifications

- **Goal:** In-app notifications for order events, strictly scoped to the
  owner.
- **Prompts:** "Create a notifications module (NEW_ORDER, ORDER_ACCEPTED, …)
  with read/unread, delete and clear-all, strictly scoped to the owner".
- **Acceptance:** isolation (403 for another user's notification).

## Day 13 — Password Reset

- **Goal:** Forgot/reset with single-use, expiring tokens and no account
  enumeration.
- **Prompts:** "Implement forgot-password returning an identical generic
  response for known and unknown emails"; "Reset password with a 15-minute
  single-use token stored in a tokens table".
- **Acceptance:** enumeration-safe responses; expired/used tokens rejected.

## Day 14 — API Documentation

- **Goal:** Swagger/OpenAPI polish + Postman collection.
- **Prompts:** "Polish the OpenAPI annotations and Swagger UI grouping";
  "Build a Postman collection covering all endpoints".
- **Acceptance:** Swagger lists every endpoint; Postman collection runnable
  (41 requests).

## Day 15 — Testing & QA

- **Goal:** Backend integration tests + live E2E QA suites.
- **Prompts:** "Add Spring Boot integration tests for the core flows";
  "Extend qa/backend_test.sh and qa/uitest.js to cover auth, profiles,
  products, orders and admin".
- **Acceptance:** `./mvnw test` green; both QA suites pass.

## Day 16 — Farmer Verification (see [reports/FarmerVerification.md](reports/FarmerVerification.md))

- **Goal:** End-to-end verification: submit/resubmit documents, admin
  approve/reject-with-reason, 403 selling gate, buyer visibility filter.
- **Prompts (representative):** "Design a farmer verification workflow with
  PENDING/APPROVED/REJECTED status and multipart document upload"; "Block
  product CRUD and order receiving for unverified farmers at the service
  layer"; "Filter buyer product listings to approved farmers and show a
  Verified badge"; "Add reject-with-reason and resubmit keeping existing
  documents".
- **Acceptance:** 10 integration tests + 24 live checks; UI E2E registers →
  submits → admin approves → farmer sells → buyer sees badge.

## Day 17 — Analytics Dashboards (see [reports/AnalyticsDashboard.md](reports/AnalyticsDashboard.md))

- **Goal:** Production analytics for admin/farmer/buyer with real data only.
- **Prompts:** "Build server-side analytics endpoints returning full dashboard
  payloads (cards, chart series, tables) via grouped JPQL — no client-side
  math, no N+1"; "Scope farmer/buyer analytics to the authenticated user and
  enforce 403s"; "Define revenue as COMPLETED-order value and add drill-down
  series endpoints".
- **Acceptance:** 8 integration tests; 16 live checks; dashboards 100% real
  data; frontend charts with recharts.

## Day 18–19 — Enterprise UI (see [reports/EnterpriseUIPhase1.md](reports/EnterpriseUIPhase1.md) / [reports/EnterpriseUIPhase2.md](reports/EnterpriseUIPhase2.md))

- **Goal:** Design system + app shell (Phase 1), then redesign every page
  (Phase 2) — zero backend/API/route changes.
- **Prompts:** "Create a reusable design-system component library with `--fb-*`
  tokens (Sidebar, TopNavbar, DataTable, Modal, ConfirmDialog, StatCard, …)";
  "Redesign all pages on the design system with floating labels, status pills,
  sticky tables and accessible dialogs"; "Keep every existing route and flow
  working; preserve `prefers-reduced-motion`".
- **Acceptance:** clean `npm run build`; full UI E2E suite stays green.

## Day 20 — Email Notification System (see [reports/EmailNotificationSystem.md](reports/EmailNotificationSystem.md))

- **Goal:** One reusable HTML email template powering 9 flows, fail-safe.
- **Prompts:** "Rewrite EmailService with a single responsive template and
  event methods (welcome, verification approved/rejected, order events,
  password reset)"; "Make every send fail-safe — never roll back business
  logic"; "Add admin announcements with audience filtering, HTML-escaped
  content, and validated button URLs".
- **Acceptance:** 13 integration tests incl. SMTP-failure non-rollback; live
  announcement send; UI page with live HTML preview.

## Day 21 — Enterprise Soft Delete (see [reports/SoftDelete.md](reports/SoftDelete.md))

- **Goal:** Deactivate/reactivate users preserving all data, with admin
  lockout protection.
- **Prompts:** "Implement soft delete — flipping active=false — blocking
  login and every secured endpoint while preserving orders/reviews/analytics";
  "Prevent self-deactivation and last-active-admin deactivation"; "Hide
  deactivated farmers' products from buyers but keep admin oversight;
  keep forgot-password enumeration-safe".
- **Acceptance:** 11 integration tests; live QA lifecycle; 50/50 suite.

## Day 22 — ADF Documentation Compliance (see [reports/ADFCompliance.md](reports/ADFCompliance.md))

- **Goal:** Bring the documentation into ADF compliance — audit, align docs
  01–06, create docs 07–11, produce this history and the compliance report.
- **Prompts:** "Audit the project against the ADF documentation process";
  "Update/create the 01–11 documentation set without changing code, APIs, or
  schema"; "Document every table, every REST endpoint (74), all flows, the
  task history, coding standards, testing, deployment plan and prompt log".
- **Acceptance:** documentation-only diff; git status shows no code changes;
  the Day 22 report ([reports/ADFCompliance.md](reports/ADFCompliance.md)) was delivered.

---

*End of Prompt History*
