# FarmBridge — Coding Standards

> **Document Version:** 1.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Derived from the actual conventions used throughout the FarmBridge codebase

---

## 1. Purpose

These standards keep FarmBridge consistent, maintainable, and reviewable.
They are enforced by convention and by code review; the backend and frontend
each follow the conventions below.

---

## 2. Naming Conventions

### Backend (Java)

| Item | Convention | Example |
|---|---|---|
| Classes | PascalCase | `ProductServiceImpl`, `JwtAuthFilter` |
| Interfaces | PascalCase (no `I` prefix) | `ProductService`, `OrderRepository` |
| Methods | camelCase | `placeOrder`, `getFarmerOrders` |
| Fields / locals | camelCase | `farmerEmail`, `totalPrice` |
| Constants / enums | UPPER_SNAKE | `OrderStatus.PENDING` |
| DTOs | `<Entity>Request` / `<Entity>Response` | `OrderRequest`, `OrderResponse` |
| Controllers | `<Domain>Controller` | `NotificationController` |
| Services | interface `XService` + impl `XServiceImpl` | `OrderService` / `OrderServiceImpl` |
| Packages | lowercase (`com.farmbridge.<layer>`) | `com.farmbridge.service` |
| Test classes | `<Flow>IntegrationTest` | `SoftDeleteFlowIntegrationTest` |

### Frontend (JavaScript/React)

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `BuyerDashboardPage`, `StatCard` |
| Files | PascalCase for components, camelCase for utilities | `Button.jsx`, `relativeTime.js` |
| Hooks/context | camelCase, `use`/`Context` suffixes | `useAuth`, `AuthContext` |
| CSS | Component-scoped `.css` + `fb-` / page prefix classes | `.fb-btn-primary`, `.fv-field` |
| API functions | grouped modules in `services/api.js` | `authAPI.login`, `adminAPI.verifyFarmer` |

---

## 3. Layered Architecture (Backend)

Strict layering — dependency flows one way only:

```
Controller → Service → Repository → Database
     ↓          ↓          ↓
   DTOs    (business)   (JPA)
```

- **Controllers** are thin: HTTP + validation + delegate. No business logic,
  no direct repository access (the buyer product controller was refactored
  onto `ProductService` to comply).
- **Services** contain all business rules (ownership, state machines,
  verification/activation gates, notifications/emails).
- **Repositories** are Spring Data interfaces; complex aggregations are
  written as JPQL (`COUNT`/`SUM`/`AVG`/`GROUP BY`) — no in-Java aggregation
  of large result sets, no N+1 loops.
- **Entities** are persistence models only — never serialized directly.

---

## 4. DTO Pattern

- Every API boundary uses request/response DTOs; entities are never exposed.
- Requests carry Jakarta validation annotations; responses carry only what
  the client needs.
- Response fields are plain `String`/`Double`/`Long`/`Boolean`/enum (never
  lazy-loaded entities).

---

## 5. Repository Pattern

- One repository per aggregate root (`UserRepository`, `OrderRepository`, …).
- Derived queries for simple lookups (`findByBuyerEmail`, `existsByEmail`).
- JPQL with constructor projections for metrics/DTOs (e.g. `MonthlyMetric`,
  `CategoryMetric`).
- Batch loading with `findByEmailIn` / `findByIdIn` to avoid N+1.

---

## 6. Service Layer Rules

- Interface + implementation (`XService` / `XServiceImpl`) per module.
- Constructor injection only (Spring). **No field injection.**
- `@Transactional` where multiple writes must be atomic (e.g. document
  upload + profile save).
- Side effects that must never roll back the main transaction (email sends)
  are wrapped so exceptions are caught and logged.
- Service methods throw `RuntimeException` subclasses with human-readable
  messages; `GlobalExceptionHandler` maps them to HTTP statuses.

---

## 7. Controller Rules

- `@RestController` + class-level `@RequestMapping("/api/<domain>")`.
- `Authentication authentication` parameter used to get the caller's email
  (`authentication.getName()`) — never trust IDs from the body for identity.
- `ResponseEntity.ok(...)` for 200; `ResponseEntity.status(HttpStatus.CREATED)`
  for 201 creations (orders, products, reviews, wishlist).
- Swagger annotations (`@Tag`, `@Operation`, `@SecurityRequirement`) on
  controllers and important endpoints.

---

## 8. Validation Rules

- All request DTOs validated with Jakarta Bean Validation: `@NotBlank`,
  `@Email`, `@NotNull`, `@Min`, `@Max`, `@Size`, `@Pattern`.
- `@Valid @RequestBody` / `@Valid @ModelAttribute` on every controller method.
- Business validation (ownership, stock, state machine, verification status)
  lives in the service layer.
- Multipart uploads validated for content type (magic bytes) and size
  (≤ 5 MB per file, 6 MB request).

---

## 9. Exception Handling

Centralized in `exception/GlobalExceptionHandler` (`@RestControllerAdvice`):

| Exception | Status |
|---|---|
| `MethodArgumentNotValidException` | 400 with field-level error map |
| `RuntimeException` (message-based) | 403 (`"not been verified"`, `"deactivated"`), 404 (`"not found"`), 409 (`"already exists"` / `"already in use"`), else 400 |
| `DataIntegrityViolationException` | 400 friendly message |
| `NoResourceFoundException` | 404 (missing static files / product images) |
| any other exception | 500 generic message (no stack traces) |

Structured error body: `ErrorResponse`. Custom exception types used where a
domain needs dedicated handling (e.g. `NotificationAccessDeniedException`).

---

## 10. Logging

- `SLF4J`/`logback` (Spring Boot default) via `LoggerFactory.getLogger(...)`.
- Business milestones and failures logged at `INFO`/`WARN`.
- Email failures are logged at `WARN` and swallowed — **never rethrown**.
- Sensitive data (passwords, tokens, SMTP credentials) is never logged.

---

## 11. Security Guidelines

- BCrypt for passwords; stateless JWT (1 h expiry) with `sub` = email and a
  `role` claim.
- `SecurityConfig`: CSRF off, `SessionCreationPolicy.STATELESS`, public
  matchers for `/api/auth/**`, `/uploads/**`, Swagger; role matchers for
  `/api/admin/**`, `/api/users/**`, `/api/farmer/**`, `/api/buyer/**`.
- `JwtAuthFilter` validates the token **and** the account `active` flag every
  request (deactivated → 403 JSON).
- **Defense in depth:** UI gating is UX only; services re-check ownership,
  verification status, and activation.
- Enumeration-safe forgot-password (identical generic response).
- Uploads: UUID filenames, magic-byte validation, public `/uploads/**`.
- Admin self-deactivation and last-active-admin deactivation are blocked.

---

## 12. Testing Rules

- Backend: Spring Boot integration tests under `src/test/java/com/farmbridge/`,
  one class per flow (`*FlowIntegrationTest`), named assertions, deterministic
  DB cleanup (`TransactionTemplate`, `@AfterAll` cleanup).
- Mocking: `@MockBean` (e.g. mocked `JavaMailSender`) only where infrastructure
  must not be hit; everything else runs against the real stack.
- QA: `qa/backend_test.sh` (live HTTP E2E, assert + note based) and
  `qa/uitest.js` (Puppeteer browser E2E with screenshots).
- New features are not "done" until backend tests + QA suites + `npm run build`
  are green and the milestone report is written in `docs/reports/`.

---

## 13. Git Commit Style

- Conventional prefixes: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`,
  `chore:`.
- Messages describe the what/why in the imperative mood.
- One milestone per commit where possible; documentation updates included
  with the feature commit.
- Examples from history:
  - `feat: implement product image upload with frontend integration`
  - `docs: update project context`
  - `test: add order service tests`
  - `fix: resolve JWT validation issue`

---

*End of Coding Standards*
