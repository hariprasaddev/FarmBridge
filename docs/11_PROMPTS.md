# FarmBridge — AI Prompt History

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
>
> This log records the **category and intent** of the AI prompts that drove
> each milestone. Days 1–15 are reconstructed from the git history and commit
> messages; Days 16–21 are summarized from the official DAY reports (which
> were themselves produced with AI assistance). Exact prompt text is not
> preserved; each entry states the goal, the main constraints given to the
> AI, and the acceptance criteria requested.

---

## Day 1–2 — Foundation & Database

- **Goal:** Initialize a Spring Boot 4.1.0 + MySQL project with layered
  packages (controller/service/repository/entity/dto/config/security).
- **Constraints given to AI:** Maven, Java 25, constructor injection, DTO
  pattern, `ddl-auto=update`, role enums ADMIN/FARMER/BUYER.
- **Acceptance:** project compiles, context loads, database connects.

## Day 3–5 — Authentication & Security

- **Goal:** Registration, login, JWT issuance/validation, role-based access.
- **Prompts:** "Implement registration with BCrypt and duplicate-email guard";
  "Issue a JWT with email + role claims on login"; "Add a stateless
  SecurityConfig with a JwtAuthFilter and role matchers for
  /api/admin, /api/farmer, /api/buyer"; "Return 401 for invalid tokens and
  403 for wrong roles".
- **Acceptance:** end-to-end register → login → protected call with token.

## Day 6–8 — Farmer, Products, Buyer Browse

- **Goal:** Farmer profiles; product CRUD with ownership checks; buyer
  browsing with category filtering.
- **Prompts:** "Add farmer profile create/get/update with duplicate-profile
  prevention"; "Implement product create/read/update/delete so a farmer can
  only touch their own products"; "Add buyer endpoints to list all products,
  view details, and filter by category".
- **Acceptance:** ownership violations rejected; category filter works.

## Day 9–10 — Orders

- **Goal:** Order placement with stock management and a status state machine.
- **Prompts:** "Place an order: validate stock, deduct quantity, compute
  totalPrice, link buyer/product/farmer"; "Add order status transitions
  PENDING→ACCEPTED→COMPLETED and PENDING→REJECTED with locked terminal
  states; restore stock on rejection".
- **Acceptance:** stock math verified; illegal transitions rejected.

## Day 11 — Admin Module

- **Goal:** Admin dashboard stats, user CRUD, role-filtered lists, product
  and order oversight.
- **Prompts:** "Create admin endpoints for stats, users, farmers, buyers,
  products and orders, ADMIN-only".
- **Acceptance:** role matchers enforce ADMIN; stats consistent with lists.

## Day 12 — Reviews

- **Goal:** Purchased-only product reviews with rating aggregation.
- **Prompts:** "Allow only buyers with an ACCEPTED/COMPLETED order to review,
  one review per product, author-only update/delete"; "Expose average rating
  and star counts on product responses".
- **Acceptance:** duplicate review blocked; ratings aggregate correctly.

## Day 13–14 — Wishlist & Notifications

- **Goal:** Wishlist save/remove; in-app notifications for order events.
- **Prompts:** "Add buyer wishlist with unique buyer+product constraint";
  "Create a notifications module (NEW_ORDER, ORDER_ACCEPTED, …) with
  read/unread, delete and clear-all, strictly scoped to the owner".
- **Acceptance:** isolation (403 for another user's notification); unique
  wishlist entries (409).

## Day 15 — Password Reset

- **Goal:** Forgot/reset with single-use, expiring tokens and no account
  enumeration.
- **Prompts:** "Implement forgot-password returning an identical generic
  response for known and unknown emails"; "Reset password with a 15-minute
  single-use token stored hashed/unhashed in a tokens table".
- **Acceptance:** enumeration-safe responses; expired/used tokens rejected.

## Day 16 — Farmer Verification (see DAY16 report)

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

## Day 17 — Analytics Dashboards (see DAY17 report)

- **Goal:** Production analytics for admin/farmer/buyer with real data only.
- **Prompts:** "Build server-side analytics endpoints returning full dashboard
  payloads (cards, chart series, tables) via grouped JPQL — no client-side
  math, no N+1"; "Scope farmer/buyer analytics to the authenticated user and
  enforce 403s"; "Define revenue as COMPLETED-order value and add drill-down
  series endpoints".
- **Acceptance:** 8 integration tests; 16 live checks; dashboards 100% real
  data; frontend charts with recharts.

## Day 18–19 — Enterprise UI (see DAY18/19 reports)

- **Goal:** Design system + app shell (Phase 1), then redesign every page
  (Phase 2) — zero backend/API/route changes.
- **Prompts:** "Create a reusable design-system component library with `--fb-*`
  tokens (Sidebar, TopNavbar, DataTable, Modal, ConfirmDialog, StatCard, …)";
  "Redesign all pages on the design system with floating labels, status pills,
  sticky tables and accessible dialogs"; "Keep every existing route and flow
  working; preserve `prefers-reduced-motion`".
- **Acceptance:** clean `npm run build`; full UI E2E suite stays green.

## Day 20 — Email Notification System (see DAY20 report)

- **Goal:** One reusable HTML email template powering 9 flows, fail-safe.
- **Prompts:** "Rewrite EmailService with a single responsive template and
  event methods (welcome, verification approved/rejected, order events,
  password reset)"; "Make every send fail-safe — never roll back business
  logic"; "Add admin announcements with audience filtering, HTML-escaped
  content, and validated button URLs".
- **Acceptance:** 13 integration tests incl. SMTP-failure non-rollback; live
  announcement send; UI page with live HTML preview.

## Day 21 — Enterprise Soft Delete (see DAY21 report)

- **Goal:** Deactivate/reactivate users preserving all data, with admin
  lockout protection.
- **Prompts:** "Implement soft delete — flipping active=false — blocking
  login and every secured endpoint while preserving orders/reviews/analytics";
  "Prevent self-deactivation and last-active-admin deactivation"; "Hide
  deactivated farmers' products from buyers but keep admin oversight;
  keep forgot-password enumeration-safe".
- **Acceptance:** 11 integration tests; live QA lifecycle; 50/50 suite at the
  time, 60/60 today.

## Day 22 — ADF Documentation Compliance (this task)

- **Goal:** Bring the documentation into ADF compliance — audit, align docs
  01–06, create docs 07–11, produce this history and the compliance report.
- **Prompts:** "Audit the project against the ADF documentation process";
  "Update/create the 01–11 documentation set without changing code, APIs, or
  schema"; "Document every table, every REST endpoint (74), all flows, the
  task history, coding standards, testing, deployment plan and prompt log".
- **Acceptance:** documentation-only diff; git status shows no code changes;
  DAY22 report delivered.

---

*End of Prompt History*
