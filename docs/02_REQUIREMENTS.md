# FarmBridge — Requirements Document

> **Document Version:** 2.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Aligned with the current source code (all features implemented)

---

## 1. Purpose

This document defines the complete set of requirements for the FarmBridge
application — a direct digital agricultural marketplace that connects farmers
with buyers, reducing the need for unnecessary intermediaries.

It serves as the single source of truth for what the system must do, how it
must behave, and what is explicitly out of scope. It is aligned with the
source code, architecture, database design, API contract, and UI flow
documents (docs 01, 03–06).

---

## 2. Problem Statement

Farmers often depend on intermediaries to sell their agricultural products.
This reliance on middlemen can reduce the farmer's profit margin and make it
difficult for buyers to directly identify the farmer, verify the source of the
products, and establish a transparent trust relationship.

FarmBridge solves this by providing a direct digital marketplace platform
with verified farmers, transparent product information, and role-specific
features for farmers, buyers, and administrators.

---

## 3. Business Objective

1. Connect farmers directly with buyers without unnecessary middlemen.
2. Allow farmers to list their agricultural products and manage orders.
3. Allow buyers to discover, search, and purchase agricultural products.
4. Improve trust through farmer verification and transparent product
   information.
5. Provide a secure platform with role-based access control.
6. Provide data-driven analytics dashboards for all roles.
7. Keep users informed via in-app + email notifications.
8. Never lose historical data (soft delete).

---

## 4. Scope

### In Scope (all implemented)

- Authentication & JWT-based authorization (ADMIN, FARMER, BUYER)
- Farmer profiles + farmer verification workflow
- Product management (CRUD + image upload) and buyer browsing / category filter
- Orders with stock validation and status lifecycle
- Reviews & ratings, wishlist, in-app notifications
- Email notifications, password reset, admin announcements
- Analytics dashboards (admin / farmer / buyer)
- Enterprise soft delete (deactivate / reactivate)
- Enterprise UI, Swagger, Postman, unit + integration + E2E tests

### Out of Scope

See §12.

---

## 5. User Roles

### 5.1 Farmer

A farmer registers with the FARMER role to list agricultural products and
manage orders.

**Responsibilities:** register/login, create & manage farmer profile, submit
verification documents, list/update/delete products, upload product images,
manage received orders (accept / reject / complete), view reviews of own
products, view analytics.

**Permissions:** `/api/farmer/**`; may only modify own products/profile/orders.
**Selling is gated** until verification is APPROVED.

### 5.2 Buyer

A buyer registers with the BUYER role to discover and purchase products.

**Responsibilities:** browse products, filter by category, view product
details, place orders, track order status, write reviews for purchased
products, manage a wishlist, view analytics.

**Permissions:** `/api/buyer/**`; may only view own orders and manage own
reviews/wishlist.

### 5.3 Admin

An admin has the ADMIN role and manages the platform.

**Responsibilities:** view users/products/orders, update users, soft-delete and
reactivate users, verify/reject farmer verification requests, send email
announcements, view platform analytics.

**Permissions:** `/api/admin/**` and `/api/users/**`. Self-registration of
ADMIN is blocked; admins are seeded manually. An admin cannot deactivate
their own account or the last active ADMIN.

---

## 6. Functional Requirements

Legend: ✅ Implemented · ⚠️ Partial · ❌ Missing

### 6.1 Authentication & Accounts (FR-AUTH)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-AUTH-01 | Register with name, email, password, role (ADMIN/FARMER/BUYER) | ✅ | `AuthController.register()` |
| FR-AUTH-02 | Duplicate email handled ("Email already exists", 200) | ✅ | `userRepository.existsByEmail()` |
| FR-AUTH-03 | Passwords hashed with BCrypt | ✅ | `BCryptPasswordEncoder` |
| FR-AUTH-04 | Login with email + password returns JWT | ✅ | `AuthController.login()` |
| FR-AUTH-05 | JWT contains email + role, expires after 1 hour | ✅ | `JwtUtil.generateToken()` |
| FR-AUTH-06 | Invalid/expired JWT → 401 | ✅ | `JwtAuthFilter` |
| FR-AUTH-07 | Self-registration of ADMIN blocked | ✅ | `AuthServiceImpl` |
| FR-AUTH-08 | Forgot password → enumeration-safe generic response + reset email | ✅ | `PasswordResetService` |
| FR-AUTH-09 | Reset password with single-use 15-minute token | ✅ | `PasswordResetServiceImpl` |
| FR-AUTH-10 | Deactivated account cannot log in (403) | ✅ | `AuthServiceImpl.login()` |

### 6.2 Farmer Profile & Verification (FR-FARMER)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-FARMER-01 | Create / view / update farmer profile (GET/POST/PUT `/api/farmer/profile`) | ✅ | `FarmerProfileController` |
| FR-FARMER-02 | No duplicate profiles per user | ✅ | "Farmer profile already exists" |
| FR-FARMER-03 | Submit verification with personal/farm/cultivation details + 3 required documents (multipart) | ✅ | `POST /api/farmer/profile/verification` |
| FR-FARMER-04 | See own verification status + rejection reason | ✅ | `GET /api/farmer/profile/verification` |
| FR-FARMER-05 | Resubmit after rejection resets to PENDING and keeps documents | ✅ | `submitVerification()` |
| FR-FARMER-06 | Product create/update/delete + order receiving blocked (403) until APPROVED | ✅ | `ProductServiceImpl`, `OrderServiceImpl` |
| FR-FARMER-07 | Only image uploads (JPG/PNG/WEBP/GIF, ≤5 MB) accepted | ✅ | `FileStorageService` |

### 6.3 Products & Images (FR-PROD)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-PROD-01 | Farmer CRUD on own products (`/api/farmer/products`) | ✅ | `ProductController` |
| FR-PROD-02 | Ownership enforced (cannot edit/delete another's product) | ✅ | `ProductServiceImpl` |
| FR-PROD-03 | Upload / delete product image (owner only) | ✅ | `POST/DELETE /{id}/image` |
| FR-PROD-04 | Buyers browse all products of APPROVED farmers | ✅ | `GET /api/buyer/products` |
| FR-PROD-05 | Product details with rating + farm info | ✅ | `GET /api/buyer/products/{id}` |
| FR-PROD-06 | Category filter (case-insensitive) | ✅ | `GET /api/buyer/products/category/{c}` |
| FR-PROD-07 | Search by name | ⚠️ | Repository support exists; no controller endpoint yet |
| FR-PROD-08 | Products of unverified / deactivated farmers hidden from buyers, visible to admins | ✅ | `ProductServiceImpl` |

### 6.4 Orders (FR-ORD)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-ORD-01 | Buyer places order with stock validation + deduction | ✅ | `OrderServiceImpl.placeOrder()` |
| FR-ORD-02 | Total price = price × quantity; new order is PENDING | ✅ | `placeOrder()` |
| FR-ORD-03 | Buyers see only own orders | ✅ | `findByBuyerEmail` |
| FR-ORD-04 | Farmers see orders for own products | ✅ | `getFarmerOrders()` |
| FR-ORD-05 | State machine PENDING→ACCEPTED/REJECTED, ACCEPTED→COMPLETED; REJECTED/COMPLETED locked | ✅ | `updateOrderStatus()` |
| FR-ORD-06 | Rejecting a PENDING order restores reserved stock | ✅ | `updateOrderStatus()` |
| FR-ORD-07 | Order events fire in-app notifications + emails | ✅ | `NotificationService`, `EmailService` |

### 6.5 Reviews & Wishlist (FR-ENGAGE)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-ENGAGE-01 | Buyer reviews only purchased products (order ACCEPTED/COMPLETED), 1–5 stars | ✅ | `ReviewServiceImpl` |
| FR-ENGAGE-02 | One review per buyer per product (unique constraint + 409) | ✅ | `uk_reviews_buyer_product` |
| FR-ENGAGE-03 | Review update/delete by author only | ✅ | `ReviewServiceImpl` |
| FR-ENGAGE-04 | Product rating aggregation (avg + star counts) in responses | ✅ | `RatingStats` |
| FR-ENGAGE-05 | Wishlist add / remove / list / check | ✅ | `WishlistController` |
| FR-ENGAGE-06 | Duplicate wishlist entry → 409 | ✅ | `uk_wishlist_buyer_product` |

### 6.6 Notifications (FR-NOTIF)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-NOTIF-01 | In-app notifications for NEW_ORDER, ORDER_ACCEPTED, ORDER_REJECTED, ORDER_COMPLETED, ADMIN_MESSAGE | ✅ | `NotificationType`, `NotificationServiceImpl` |
| FR-NOTIF-02 | List, unread list, unread count | ✅ | `GET /api/notifications…` |
| FR-NOTIF-03 | Mark one / all as read | ✅ | `PUT /{id}/read`, `PUT /read-all` |
| FR-NOTIF-04 | Delete one / clear all | ✅ | `DELETE /{id}`, `DELETE /api/notifications` |
| FR-NOTIF-05 | Users only see own notifications (403 otherwise) | ✅ | `NotificationServiceImpl` |

### 6.7 Email Notifications (FR-EMAIL)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-EMAIL-01 | Welcome email on registration | ✅ | `EmailService.sendWelcomeEmail` |
| FR-EMAIL-02 | Verification approved / rejected (+reason + resubmit button) | ✅ | `AdminServiceImpl` |
| FR-EMAIL-03 | New order → farmer; accepted/rejected/completed → buyer | ✅ | `OrderServiceImpl` |
| FR-EMAIL-04 | HTML password-reset email (15-min expiry) | ✅ | `PasswordResetServiceImpl` |
| FR-EMAIL-05 | Admin announcements to ALL/BUYERS/FARMERS + history | ✅ | `AnnouncementServiceImpl` |
| FR-EMAIL-06 | Fail-safe: SMTP failure never rolls back business logic | ✅ | `EmailService.sendHtml()` catches all |
| FR-EMAIL-07 | All user content HTML-escaped; `buttonUrl` validated `^https?://` | ✅ | `EmailService`, `AnnouncementRequest` |

### 6.8 Admin Management (FR-ADMIN)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-ADMIN-01 | Dashboard stats (`/api/admin/stats`) | ✅ | `AdminController` |
| FR-ADMIN-02 | List/get/update users; role-filtered farmer/buyer lists | ✅ | `AdminController` |
| FR-ADMIN-03 | Soft-delete (deactivate) user; record + history preserved | ✅ | `UserServiceImpl.deleteUser()` |
| FR-ADMIN-04 | Reactivate user | ✅ | `PUT /{id}/reactivate` |
| FR-ADMIN-05 | Self-deactivation + last-active-admin protected (400) | ✅ | `UserServiceImpl` guards |
| FR-ADMIN-06 | Oversee all products/orders (unfiltered) | ✅ | `AdminController` |
| FR-ADMIN-07 | Approve / reject pending verification requests | ✅ | `PUT /farmers/{id}/verify`, `/reject` |
| FR-ADMIN-08 | Send announcements + view history | ✅ | `AdminController` |

### 6.9 Analytics (FR-ANALYTICS)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-ANALYTICS-01 | Admin dashboard payload (13 cards, 6 charts, 7 tables) | ✅ | `GET /api/admin/analytics` |
| FR-ANALYTICS-02 | Farmer dashboard payload, scoped to own data | ✅ | `GET /api/farmer/analytics` |
| FR-ANALYTICS-03 | Buyer dashboard payload, scoped to own data | ✅ | `GET /api/buyer/analytics` |
| FR-ANALYTICS-04 | Drill-down series endpoints (revenue/orders/sales/spending/top-*) | ✅ | `AnalyticsController` |
| FR-ANALYTICS-05 | Revenue = COMPLETED-order value; aggregation in DB (no N+1) | ✅ | `AnalyticsServiceImpl` |
| FR-ANALYTICS-06 | Role-scoped access (403 for wrong role) | ✅ | SecurityConfig + tests |

### 6.10 System (FR-SYS)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-SYS-01 | Layered architecture, DTOs, constructor injection | ✅ | All modules |
| FR-SYS-02 | Jakarta validation on all request DTOs | ✅ | `@Valid` everywhere |
| FR-SYS-03 | Structured error responses | ✅ | `GlobalExceptionHandler` |
| FR-SYS-04 | Health/test endpoint | ✅ | `GET /api/test` |
| FR-SYS-05 | Sensitive config via env vars | ⚠️ | SMTP fully env-based; DB password + JWT secret still hardcoded |
| FR-SYS-06 | Swagger/OpenAPI docs | ✅ | `/swagger-ui`, `/v3/api-docs` |

---

## 7. Non-Functional Requirements

### 7.1 Security (NFR-SEC)

| ID | Requirement | Status |
|---|---|---|
| NFR-SEC-01 | BCrypt password hashing | ✅ |
| NFR-SEC-02 | All endpoints except auth/static/swagger require JWT | ✅ |
| NFR-SEC-03 | JWT expiry (1 hour) | ✅ |
| NFR-SEC-04 | Role-based access on `/api/admin`, `/api/farmer`, `/api/buyer` | ✅ |
| NFR-SEC-05 | Ownership checks on own data (products, orders, reviews, notifications) | ✅ |
| NFR-SEC-06 | CSRF disabled for stateless REST | ✅ |
| NFR-SEC-07 | No stack traces exposed to clients | ✅ (generic 500 via handler) |
| NFR-SEC-08 | Enumeration-safe forgot-password | ✅ |
| NFR-SEC-09 | Admin self/last-admin lockout protection | ✅ |
| NFR-SEC-10 | Credentials not hardcoded | ⚠️ SMTP ✅; DB password + JWT secret hardcoded locally |

### 7.2 Performance (NFR-PERF)

| ID | Requirement | Status |
|---|---|---|
| NFR-PERF-01 | <500 ms typical API response | Not load-tested |
| NFR-PERF-02 | Support ~100 concurrent users | Not load-tested |
| NFR-PERF-03 | Indexed frequently-queried columns | ✅ unique email, token; unique review/wishlist pairs |
| NFR-PERF-04 | No N+1 in dashboards/lists | ✅ batched `IN` queries, JPQL aggregation |

### 7.3 Scalability (NFR-SCAL)

- Stateless backend (JWT) → horizontal scaling possible ✅
- Database is the only stateful component ✅

### 7.4 Availability (NFR-AVAIL)

- 99.9% uptime target for production (operational, not yet measured)
- Fail-safe email sends (never break business flows) ✅

### 7.5 Maintainability (NFR-MAINT)

| ID | Requirement | Status |
|---|---|---|
| NFR-MAINT-01 | Consistent layered architecture | ✅ |
| NFR-MAINT-02 | Business logic in services, not controllers | ✅ |
| NFR-MAINT-03 | DTO-level validation | ✅ |
| NFR-MAINT-04 | Unit + integration tests | ✅ 60 backend test methods |
| NFR-MAINT-05 | API documentation (Swagger + docs) | ✅ |
| NFR-MAINT-06 | Schema managed via JPA `ddl-auto` | ✅ |

---

## 8. User Stories

### 8.1 Farmer

| ID | Story |
|---|---|
| US-FARMER-01 | As a farmer, I want to register and log in so that I can access the platform. |
| US-FARMER-02 | As a farmer, I want to create my profile so buyers can learn about my farm. |
| US-FARMER-03 | As a farmer, I want to submit verification documents and see my status so I can become a Verified Farmer. |
| US-FARMER-04 | As a verified farmer, I want to add/update/delete products and upload images. |
| US-FARMER-05 | As a farmer, I want to accept, reject (with reason), or complete received orders. |
| US-FARMER-06 | As a farmer, I want email + in-app notifications when orders arrive and to see reviews of my products. |
| US-FARMER-07 | As a farmer, I want analytics of my revenue, sales, and customers. |

### 8.2 Buyer

| ID | Story |
|---|---|
| US-BUYER-01 | As a buyer, I want to register and log in so that I can shop. |
| US-BUYER-02 | As a buyer, I want to browse products, filter by category, and view details (incl. verified badge). |
| US-BUYER-03 | As a buyer, I want to place an order and track its status. |
| US-BUYER-04 | As a buyer, I want to review purchased products and save products to my wishlist. |
| US-BUYER-05 | As a buyer, I want email + in-app notifications for order status changes. |
| US-BUYER-06 | As a buyer, I want a dashboard showing my spending, orders, and recommendations. |

### 8.3 Admin

| ID | Story |
|---|---|
| US-ADMIN-01 | As an admin, I want dashboard analytics across users, products, orders, and revenue. |
| US-ADMIN-02 | As an admin, I want to manage users (update, deactivate, reactivate). |
| US-ADMIN-03 | As an admin, I want to approve or reject farmer verification with a reason. |
| US-ADMIN-04 | As an admin, I want to send announcements to selected audiences. |

---

## 9. Acceptance Criteria

| ID | Criteria |
|---|---|
| AC-AUTH-01 | User registers and logs in with a JWT; wrong credentials rejected; wrong role → 403. |
| AC-AUTH-02 | Deactivated user cannot log in; reactivated user can. |
| AC-VER-01 | Farmer submits verification → PENDING; admin approve → APPROVED; reject stores reason → REJECTED; resubmit → PENDING. |
| AC-VER-02 | Unverified farmer blocked (403) from product CRUD, image upload, and order receiving. |
| AC-PROD-01 | Farmer CRUD own products + images; buyer sees only APPROVED farmers' products; category filter works; details show ratings. |
| AC-ORD-01 | Order placed deducts stock; exceeding stock → 400; rejection restores stock; status transitions follow the state machine. |
| AC-ORD-02 | New-order email → farmer; status-change emails → buyer; notification records created. |
| AC-REV-01 | Only purchased buyers can review; one review per product; author-only edit/delete; rating aggregates in product responses. |
| AC-WL-01 | Wishlist add/remove/list/check; duplicate → 409; FARMER → 403. |
| AC-NOTIF-01 | Notifications appear on order events; read/unread, mark-read, delete, clear-all work; isolation enforced. |
| AC-ADMIN-01 | Admin stats, user/product/order lists, verification approve/reject, announcements, and soft-delete/reactivate all work; self/last-admin protection returns 400. |
| AC-ANALYTICS-01 | Each role sees only its own analytics payload; 403 for wrong roles; revenue = COMPLETED orders. |
| AC-SYS-01 | `./mvnw test` green (60 methods); `npm run build` clean; `qa/backend_test.sh` and `qa/uitest.js` green. |

---

## 10. Out of Scope

- Mobile native applications (web-only React SPA)
- Real-time chat/messaging between users
- Multi-language / internationalization
- Shipping, logistics, returns, refunds
- Payment processing (credit card / UPI / wallet / crypto)
- Subscription or membership models
- External agricultural databases / ML recommendations
- Social features (follow, share, comment)
- Real-time websockets (notifications are polled via REST)

---

## 11. Assumptions & Constraints

- Java 25 + Spring Boot 4.1.0, MySQL 8+, Maven; React 18 + Vite for frontend.
- `ddl-auto=update` acceptable for development; a migration tool (e.g.
  Flyway) is preferred before production (noted in `10_DEPLOYMENT.md`).
- Admin accounts are seeded manually; no ADMIN self-registration.
- Single currency; physical delivery handled by farmers off-platform.
- Sensitive config must be provided through environment variables in any
  non-local environment.

---

## 12. Dependencies (summary)

**Backend:** Spring Boot 4.1.0 starters (web, data-jpa, security, validation,
mail), jjwt 0.12.6, MySQL connector, Lombok (optional), springdoc-openapi
3.0.3, spring-boot-starter-test.

**Frontend:** react 18.3, react-router-dom 6.26, axios, react-icons, recharts,
vite 5.4.

**Tools:** Postman collection (`docs/FarmBridge_API.postman_collection.json`,
41 requests), Swagger UI, `qa/backend_test.sh`, `qa/uitest.js`.

---

*End of Requirements Document*
