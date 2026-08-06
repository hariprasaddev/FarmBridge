# FarmBridge — Architecture Document

> **Document Version:** 2.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Aligned with the current source code

---

## 1. High-Level Architecture

FarmBridge is a full-stack web application with three tiers:

```
┌──────────────────────────────────────────────────────────────┐
│                        USERS                                   │
│              Admin │ Farmer │ Buyer                           │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
                 ┌───────────────────┐
                 │   React SPA        │   Vite dev server :5173
                 │   (Vite + Axios)   │   /api + /uploads proxied
                 └─────────┬─────────┘
                           │ HTTP (JSON / multipart)
                           ▼
                 ┌───────────────────┐
                 │ Spring Boot REST  │   :8080
                 │  API (layered)    │
                 │  + Security (JWT) │
                 │  + EmailService   │
                 └─────────┬─────────┘
                           │ JPA / Hibernate
                           ▼
                 ┌───────────────────┐
                 │  MySQL database    │   farmbridge schema
                 │  (9 tables)        │
                 └───────────────────┘
```

Supporting components:

```
Uploaded files (/uploads/…)     Swagger UI (/swagger-ui)     SMTP (emails)
        │                              │                          │
        ▼                              ▼                          ▼
  Local disk (uploads/products)   springdoc-openapi          JavaMailSender
```

---

## 2. Backend Architecture

FarmBridge follows a strict layered architecture:

```
Client → Controller → Service (interface + impl) → Repository → MySQL
         (HTTP,      (no business logic)           (Spring Data JPA)
          validation)
```

Package layout (`com.farmbridge`):

```
config/        SecurityConfig, OpenApiConfig, WebConfig
controller/    15 REST controllers
dto/           Request/response DTOs (entities never exposed)
entity/        9 JPA entities + 5 enums
exception/     GlobalExceptionHandler, ErrorResponse
repository/    Spring Data JPA repositories (query methods + JPQL)
security/      JwtAuthFilter, JwtUtil
service/       One interface + implementation per module
```

**Key rules (enforced across the codebase):**

- Controllers only handle HTTP concerns and delegate to services.
- Services own all business rules (ownership, state machines, gating).
- Repositories own all persistence; complex aggregations use JPQL
  (`COUNT`/`SUM`/`AVG`/`GROUP BY`) to avoid N+1.
- Constructor injection only.
- All requests validated at the DTO boundary (Jakarta `@Valid`).

### Service modules

| Service | Responsibilities |
|---|---|
| `AuthService` | Register, login, JWT issuance, welcome email, deactivation gate |
| `FarmerProfileService` | Profile CRUD, verification submit/get, document handling |
| `ProductService` | Product CRUD, image upload, verification + active gates, buyer visibility |
| `OrderService` | Place orders, stock deduction/restore, status state machine, notifications + emails |
| `ReviewService` | Review CRUD (purchase check, uniqueness, ownership) |
| `WishlistService` | Wishlist add/remove/list/check |
| `NotificationService` | In-app notification CRUD + read state |
| `AnnouncementService` | Announcement broadcast + history |
| `PasswordResetService` | Token lifecycle (15 min, single-use, enumeration-safe) |
| `AdminService` / `UserService` | User management, soft delete/reactivate, verification admin actions |
| `AnalyticsService` | Server-side dashboard aggregation for all three roles |
| `EmailService` | One reusable HTML template + 9 event methods (fail-safe) |

---

## 3. Frontend Architecture

React SPA built with Vite, React Router, and Axios.

```
App.jsx (auth-hydration guard)
└── AuthContext (token, role, loading)
    └── Router
        ├── Public routes   /login /register /forgot-password /reset-password
        └── Protected routes (AppLayout: TopNavbar + Sidebar + content)
            ├── Farmer routes   /farmer/dashboard /farmer/products[/add|/edit/:id]
            │                   /farmer/orders /farmer/verification /farmer/profile
            ├── Buyer routes    /buyer/dashboard /buyer/products[/:id]
            │                   /buyer/orders /buyer/wishlist
            ├── Admin routes    /admin/dashboard /admin/users /admin/products
            │                   /admin/orders /admin/verification /admin/announcements
            └── Common          /notifications
```

Key frontend layers:

- **Design system** (`components/ui/`): Button, Card, StatCard, Badge, Modal,
  ConfirmDialog, DataTable, Pagination, SearchBar, FilterPanel, EmptyState,
  Skeleton, Loader, Avatar, Breadcrumb, PageHeader, AppLayout, Sidebar,
  TopNavbar, ProfileDropdown — all styled with `--fb-*` design tokens.
- **State/context**: `AuthContext`, `NotificationContext`, `WishlistContext`;
  localStorage persistence for JWT, role, sidebar state, recently-viewed.
- **API layer**: `services/api.js` — one Axios module per domain
  (authAPI, productAPI, orderAPI, reviewAPI, wishlistAPI, notificationAPI,
  adminAPI, analyticsAPI, farmerVerificationAPI…).
- **Charts**: recharts, lazy-loaded vendor chunks (main bundle split).
- **Vite proxy**: `/api` and `/uploads` → `http://localhost:8080`.

---

## 4. Authentication Flow

```
1. User registers via  POST /api/auth/register   (name, email, password, role)
2. User logs in via    POST /api/auth/login
3. AuthService validates credentials (BCrypt) + account is active
4. Server issues JWT (subject=email, claim=role, exp=1h)
5. Client stores token + role (localStorage/sessionStorage)
6. Client sends  Authorization: Bearer <JWT>
7. JwtAuthFilter parses + validates the token (JwtUtil)
   └─ deactivated account → 403 JSON immediately (filter gate)
8. SecurityContext populated with email + role
9. Role matchers enforce access: /api/admin/** → ADMIN, etc.
10. Unauthorized → 401 · Wrong role → 403
```

Password reset flow:

```
POST /api/auth/forgot-password (email)
  → generic response for both known & unknown emails (enumeration-safe)
  → if user exists & active: create 15-min single-use token
  → HTML email with reset link (app.reset-password-url)
POST /api/auth/reset-password (token + new password)
  → validates existence / expiry / not-used → BCrypt update → mark used
```

---

## 5. Role-Based Access

| URL pattern | Role required |
|---|---|
| `/api/auth/**` | Public |
| `/uploads/**`, `/swagger-ui/**`, `/v3/api-docs/**` | Public |
| `/api/admin/**` | ADMIN |
| `/api/users/**` | ADMIN |
| `/api/farmer/**` | FARMER |
| `/api/buyer/**` | BUYER |
| everything else (e.g. `/api/test`) | Any authenticated role |

Two-layer enforcement:

1. **Filter/URL layer** — role matchers in `SecurityConfig`.
2. **Service layer** — ownership + business gates (product ownership, order
   ownership, verification `APPROVED` requirement, `active` flag) so the UI
   is never the security boundary.

---

## 6. Farmer Verification Flow

```
Farmer registers (verificationStatus = PENDING, cannot sell yet)
  │
  ▼
POST /api/farmer/profile/verification  (multipart: personal/farm/cultivation
                                        + farmerPhoto + landCertificate + farmPhoto
                                        + optional organicCertificate)
  │
  ▼
PENDING ──► Admin reviews in /admin/verification (details incl. documents)
  │
  ├── PUT /api/admin/farmers/{id}/verify  → APPROVED
  │        └─ email "verification approved" + Verified Farmer badge + selling unlocked
  └── PUT /api/admin/farmers/{id}/reject (reason required, ≤1000 chars)
           → REJECTED
           └─ email with reason + resubmit button; farmer edits & resubmits → PENDING
```

**Gating:** until APPROVED, product CRUD, image upload, and order receiving
return **403** `"Your farmer account has not been verified yet."` Buyer-visible
product surfaces only show products from APPROVED farmers.

---

## 7. Order Flow

```
Buyer selects product → POST /api/buyer/orders {productId, quantity}
  → validate: product exists, seller APPROVED + active, quantity ≥ 1, stock OK
  → create order (PENDING) linked to buyer/product/farmer
  → deduct stock, compute totalPrice = price × quantity
  → in-app notification + email → farmer ("New Order Received")
  │
  ▼
Farmer actions (PUT /api/farmer/orders/{orderId}/status)
  PENDING ──► ACCEPTED ──► COMPLETED
  PENDING ──► REJECTED  (stock restored; optional reason → email)
  REJECTED / COMPLETED = locked
  Each transition fires a notification + email to the buyer.
```

---

## 8. Email Flow

```
Event (service layer)
  → EmailService.<eventMethod>()  (e.g. sendNewOrderEmail)
  → buildTemplate(): single responsive HTML template
      (logo, header, title, escaped message, optional CTA button, footer)
  → sendHtml(): JavaMailSender via SMTP (env-configured)
      └─ catches Exception → WARN log → NEVER rethrows
         (email failure never rolls back the business transaction)
```

| Event | Recipient | Subject |
|---|---|---|
| Registration | new user | Welcome to FarmBridge |
| Verification approved | farmer | Your FarmBridge account has been approved |
| Verification rejected | farmer | Farmer Verification Rejected |
| New order | farmer | New Order Received |
| Order accepted / rejected / completed | buyer | Order Accepted / Rejected / Completed |
| Forgot password | user | Reset your FarmBridge password |
| Admin announcement | ALL/BUYERS/FARMERS | custom |

---

## 9. Notification Flow

```
Business event (order placed / status changed / admin message)
  → NotificationService.create(...)  type ∈ {NEW_ORDER, ORDER_ACCEPTED,
                                           ORDER_REJECTED, ORDER_COMPLETED,
                                           ADMIN_MESSAGE}
  → row in notifications (recipient_id, title, message, type, isRead=false,
                          referenceId)
  → frontend NotificationBell polls GET /api/notifications/unread/count
    (badge) and GET /api/notifications/unread (dropdown)
  → user actions: mark read (PUT /{id}/read), mark-all (PUT /read-all),
                  delete (DELETE /{id}), clear-all (DELETE)
  Isolation: every query is scoped to the authenticated user; accessing
  another user's notification → 403.
```

---

## 10. Analytics Flow

```
Frontend dashboard mounts
  → single request to role endpoint:
      ADMIN  GET /api/admin/analytics      (13 cards, 6 chart series, 7 tables)
      FARMER GET /api/farmer/analytics     (11 cards, 6 chart series, 5 sections)
      BUYER  GET /api/buyer/analytics      (8 cards, 3 chart series, 4 sections)
  → AnalyticsServiceImpl orchestrates grouped JPQL queries
      (COUNT / SUM / AVG / GROUP BY YEAR·MONTH)
  → revenue/spending counts only COMPLETED orders
  → top-5 lists sorted in Java; batch IN-loads avoid N+1
  → drill-down endpoints (revenue / orders / sales / spending / top-*) available
  → charts rendered with recharts (lazy vendor chunk)
```

---

## 11. Soft Delete Flow

```
Admin deactivates user  PUT /api/admin/users/{id} (or /api/users/{id})
  → User.active = false   (record NEVER removed)
  → guards: cannot deactivate self; cannot deactivate the last active ADMIN
  Effects:
    ├─ login → 403 (no JWT)
    ├─ existing JWT on any secured endpoint → 403 (filter gate)
    ├─ buyer: cannot order / review / wishlist / update profile
    ├─ farmer: cannot sell; products hidden from buyers (visible to admins)
    └─ data: orders, reviews, revenue, analytics fully preserved
Admin reactivates        PUT /api/admin/users/{id}/reactivate
  → User.active = true → login + all capabilities restored instantly
```

---

## 12. Future Docker Architecture (planned — not implemented)

Documented here for the next phase (Phase 12). No Docker files exist yet.

```
┌────────────────────────────────────────────────────────────┐
│  docker-compose.yml                                         │
│                                                            │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐ │
│  │ frontend      │──►│ backend       │──►│ mysql         │ │
│  │ node:20-alpine│   │ eclipse-temurin│   │ mysql:8       │ │
│  │ Nginx serves  │   │ 25-jdk-alpine  │   │ volume for    │ │
│  │ built SPA     │   │ + spring-boot  │   │ data + init   │ │
│  └───────────────┘   └───────────────┘   └───────────────┘ │
│      :5173/:80            :8080              :3306         │
│  networks: bridge-network across all services              │
└────────────────────────────────────────────────────────────┘
```

- Backend image: multi-stage Maven build → JRE runtime, healthcheck on
  `/actuator/health` (planned).
- Frontend image: `npm run build` → Nginx static hosting + `/api` reverse
  proxy to the backend service.
- MySQL image with a named volume for persistence and an init script for the
  admin seed.
- All secrets injected via `.env`/environment variables.
- See [`10_DEPLOYMENT.md`](10_DEPLOYMENT.md) for the full plan.

---

*End of Architecture Document*
