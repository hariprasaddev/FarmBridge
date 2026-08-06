# FarmBridge — Project Context

> **Document Version:** 2.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug AI Development Framework (ADF) v1.0
> **Status:** ✅ Fully aligned with the current source code (Day 22 ADF compliance pass — see [reports/ADFCompliance.md](reports/ADFCompliance.md))

---

## 1. Project Name

**FarmBridge**

---

## 2. Project Vision

FarmBridge's vision is to become the trusted direct digital marketplace that
connects farmers with buyers — eliminating unnecessary intermediaries, giving
farmers a fair share of the selling price, and giving buyers transparent,
traceable access to fresh agricultural produce straight from the source.

The platform is built as an **enterprise-grade** web application: role-based
dashboards, farmer identity verification, analytics, in-app and email
notifications, and a professional UI — ready to be containerized and deployed
to the cloud (the next ADF phase).

---

## 3. Problem Statement

Farmers often depend on intermediaries to sell their agricultural products.
This can reduce the farmer's profit margin and make it difficult for buyers to
directly identify the farmer and understand the source of the products.

FarmBridge addresses this by providing a direct digital marketplace that
connects farmers with buyers without unnecessary middlemen, supported by:

- Direct farmer-to-buyer connections
- Transparent product sourcing information (farmer profiles, verification)
- Role-specific features for farmers, buyers, and administrators
- Simple, secure JWT-based authentication and authorization

---

## 4. Business Objective

The main objective of FarmBridge is to:

1. Connect farmers directly with buyers.
2. Allow farmers to list their agricultural products and manage incoming orders.
3. Allow buyers to discover, search, and purchase agricultural products.
4. Improve trust through **farmer verification** (admin-approved identity and
   farm documents) and transparent product information.
5. Provide a secure platform with role-based access control (ADMIN, FARMER,
   BUYER).
6. Provide **data-driven dashboards** (analytics) so admins, farmers, and
   buyers can make informed decisions.
7. Keep all parties informed through **in-app notifications** and
   **professional email notifications** (orders, verification, announcements,
   password reset).
8. Preserve all historical data through **enterprise soft delete**
   (deactivation/reactivation) — never lose data.

---

## 5. Project Scope

### Currently Implemented (complete and tested)

- User registration and login with JWT-based authentication
- Role-based authorization (ADMIN, FARMER, BUYER) via Spring Security
- Farmer profile management (create / view / update)
- **Farmer verification workflow** (submit/resubmit documents → admin approve
  / reject-with-reason → verified badge → gated selling)
- Product management (create / view / update / delete / image upload)
- Buyer product browsing, **category filtering**, and product details
- Order placement with stock validation and deduction, plus order status
  lifecycle (PENDING → ACCEPTED → COMPLETED / REJECTED)
- **Reviews & ratings** (buyer reviews purchased products; star aggregation)
- **Wishlist** (save / remove / check products)
- **In-app notifications** (read/unread, mark read, delete, clear all)
- **Email notification system** (welcome, verification approved/rejected,
  order events, password reset, admin announcements — all fail-safe)
- **Password reset** (forgot password + token-based reset, enumeration-safe)
- **Analytics dashboards** for ADMIN / FARMER / BUYER (server-side aggregation)
- **Enterprise soft delete** (deactivate/reactivate accounts, data preserved)
- **Enterprise UI** — design-system components, role-based app shell, analytics
  charts, floating-label forms, responsive and accessible
- Swagger/OpenAPI documentation, Postman collection, unit + integration tests,
  QA scripts (backend E2E + browser E2E)

### Planned for Future

- Docker & Docker Compose (next phase)
- CI/CD pipeline
- Cloud deployment (Azure / Vercel)
- Payment processing
- Product search by name (backend support exists; controller endpoint pending)
- Shopping cart

---

## 6. User Roles

| Role | Description |
|---|---|
| **ADMIN** | Platform administrator — manages users (incl. soft delete/reactivate), products, orders, farmer verification, sends email announcements, views platform analytics |
| **FARMER** | Lists agricultural products, manages received orders, submits verification to become a "Verified Farmer" |
| **BUYER** | Browses products, places orders, writes reviews, builds a wishlist, tracks orders, views personal analytics |

Self-registration cannot create ADMIN accounts (admins are seeded manually).

---

## 7. Technology Stack

### Backend

| Technology | Version / Detail |
|---|---|
| Java | 25 |
| Spring Boot | 4.1.0 |
| Spring Web, Data JPA, Security, Validation, Mail | Boot starters |
| JWT (jjwt) | 0.12.6 (api / impl / jackson) |
| Hibernate / Jakarta Persistence | ORM, `ddl-auto=update` |
| Maven | Build tool (`./mvnw`) |
| springdoc-openapi | 3.0.3 (Swagger UI at `/swagger-ui`), OpenAPI version 1.2.0 |

### Database

- **MySQL 8+** — schema managed by JPA entities (`ddl-auto=update`)

### Frontend

| Technology | Version / Detail |
|---|---|
| React | 18.3 |
| React Router | 6.26 |
| Axios | 1.7 |
| Vite | 5.4 (dev server on `:5173`, proxy → backend `:8080`) |
| react-icons | 5.7 |
| recharts | 3.10 (analytics charts) |
| CSS | Custom design-system tokens (`--fb-*`), CSS Modules per component |

### Development & QA Tools

- IntelliJ IDEA, MySQL Workbench, Postman, Git / GitHub
- `qa/backend_test.sh` (live backend E2E suite)
- `qa/uitest.js` (Puppeteer browser E2E suite + screenshots)
- Swagger UI

---

## 8. Folder Structure

```
FarmBridge/
├── docs/                          # ADF documentation (01–11)
│   └── reports/                   # Milestone reports (Day 16 → latest)
├── qa/                            # QA scripts, results, screenshots
├── FarmBridge/                    # Backend (Spring Boot / Maven)
│   ├── src/main/java/com/farmbridge/
│   │   ├── config/                # SecurityConfig, OpenApiConfig, WebConfig
│   │   ├── controller/            # REST controllers (15)
│   │   ├── dto/                   # Request/response DTOs (30+)
│   │   ├── entity/                # JPA entities + enums (9 tables)
│   │   ├── exception/             # GlobalExceptionHandler + ErrorResponse
│   │   ├── repository/            # Spring Data JPA repositories (9)
│   │   ├── security/              # JwtAuthFilter, JwtUtil
│   │   ├── service/               # Business logic (interface + impl per module)
│   │   └── FarmBridgeApplication.java
│   ├── src/main/resources/application.properties
│   ├── src/test/java/com/farmbridge/   # 6 test classes (50 test methods)
│   ├── pom.xml
│   └── frontend/                  # React SPA (Vite)
│       └── src/
│           ├── components/        # Shared components + ui/ design system
│           ├── config/navigation.jsx  # Role-based nav config
│           ├── context/           # AuthContext, NotificationContext, WishlistContext
│           ├── pages/             # 23 pages (role-scoped)
│           ├── services/api.js    # Axios API layer
│           ├── styles/phase2.css  # Global polish layer
│           ├── utils/             # notifications, productImages, recentlyViewed, …
│           ├── App.jsx            # Routing (role-protected)
│           └── main.jsx
├── farmbridge-orders-2026-08-03.csv   # Sample analytics export
└── README.md
```

---

## 9. Coding Standards

FarmBridge follows the conventions documented in
**[`08_CODING_STANDARDS.md`](08_CODING_STANDARDS.md)**:

- Layered architecture: Controller → Service (interface + impl) → Repository → DB
- DTO pattern for all API requests/responses (entities never exposed)
- Constructor injection everywhere (no field injection)
- Jakarta Bean Validation on all request DTOs
- Centralized exception handling via `GlobalExceptionHandler`
- Enum-based statuses stored as strings (`EnumType.STRING`)
- BCrypt password hashing; JWT stateless security
- Meaningful conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`)

---

## 10. Git Workflow

- Repository hosted on **GitHub**; default branch **`main`**.
- Milestones committed on `main` with meaningful messages; larger features
  should use feature branches:

```
feature/admin
feature/farmer-verification
feature/analytics
feature/frontend-ui
feature/email-notifications
feature/docker        # upcoming
```

- Commit message style: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- Every milestone includes documentation updates + test/QA verification before
  commit.

---

## 11. Deployment Strategy

Current state: the application runs in a **local development environment**
(backend `:8080`, frontend `:5173`).

Planned production strategy (documented in detail in
[`10_DEPLOYMENT.md`](10_DEPLOYMENT.md) — **documentation only**, no
implementation yet):

```
React Frontend (Vercel)   →   Spring Boot Backend (Azure)   →   MySQL (managed cloud)
```

- **Docker** images for backend + frontend, orchestrated with **Docker Compose**.
- Environment-variable configuration for all secrets (DB credentials, JWT
  secret, SMTP).
- **CI/CD** via GitHub Actions (build → test → QA → deploy).
- Health checks and a documented rollback strategy.
- Docker & Docker Compose are the next ADF phase (Phase 12).

---

## 12. Development Process

FarmBridge follows the **TrainingMug AI Development Framework (ADF)**:

```
Understand Requirement
→ Design
→ Document
→ Create Task
→ Develop
→ Test
→ Update Documentation
→ Commit
→ Push to GitHub
→ Review
→ Merge
→ Deploy
```

AI tools are used as engineering assistants. All AI-generated code is
reviewed, understood, tested, and verified before inclusion. Each working day
ends with a milestone report in `docs/reports/` capturing files
created/modified, business rules, test results, and bugs found & fixed.

---

## 13. Current Project Status

- **Backend:** complete — all major modules implemented, `./mvnw compile` and
  `./mvnw test` green (50 test methods across 6 classes).
- **Frontend:** complete — production build clean (`npm run build`), browser
  E2E suite green (56 checks).
- **QA:** `qa/backend_test.sh` E2E suite green (218+ checks), `qa/uitest.js`
  green (56 checks).
- **Documentation:** ADF docs 01–11 present and aligned (this compliance pass).
- **Remaining:** Docker & Docker Compose (Phase 12), CI/CD, cloud deployment,
  optional product-search endpoint.
