# FarmBridge - Requirements Document

## 1. Purpose

The purpose of this document is to define the complete set of requirements
for the FarmBridge application. FarmBridge is a direct digital agricultural
marketplace that connects farmers with buyers, reducing the need for
unnecessary intermediaries.

This document serves as the single source of truth for what the system must
do, how it must behave, and what is explicitly out of scope. It is aligned
with the existing source code, architecture, database design, and project
context documents.

---

## 2. Problem Statement

Farmers often depend on intermediaries to sell their agricultural products.
This reliance on middlemen can reduce the farmer's profit margin and make it
difficult for buyers to directly identify the farmer, verify the source of
the products, and establish a transparent trust relationship.

Existing agricultural marketplaces may not provide:
- Direct farmer-to-buyer connections
- Transparent product sourcing information
- Role-specific features tailored to farmers and buyers
- Simple, secure authentication and authorization

FarmBridge aims to solve these problems by providing a direct digital
marketplace platform.

---

## 3. Business Objective

The main business objectives of FarmBridge are:

1. Connect farmers directly with buyers without unnecessary middlemen.
2. Allow farmers to list their agricultural products and manage orders.
3. Allow buyers to discover, search, and purchase agricultural products.
4. Improve trust between farmers and buyers through farmer profiles and
   transparent product information.
5. Provide a secure platform with role-based access control.
6. Build a foundation that can be extended with future features such as
   farmer verification, admin management, and payment processing.

---

## 4. Scope

### In Scope

The FarmBridge project includes:

#### Currently Implemented (Backend)

- User registration and login with JWT-based authentication
- Role-based authorization with three roles: ADMIN, FARMER, BUYER
- Farmer profile creation (farm name, location, land size, cultivation
  method, crops cultivated, farming type)
- Product management for farmers (create, read, update, delete owned
  products)
- Product browsing for buyers (view all listed products)
- Order placement by buyers with stock validation and quantity deduction
- Order viewing for both buyers (their orders) and farmers (received
  orders)
- Order status management by farmers (PENDING → ACCEPTED → COMPLETED,
  or PENDING → REJECTED)
- MySQL database with JPA/Hibernate ORM
- Layered architecture: Controller → Service → Repository → Database
- Input validation on all API request DTOs
- Password encryption using BCrypt

#### Required for MVP

- Global exception handling with meaningful error responses
- Expose product search by name API for buyers
- Expose product category filtering API for buyers
- Refactor BuyerProductController to use Service layer
- Farmer profile retrieval and update endpoints
- Prevent duplicate farmer profile creation per user
- Move hardcoded database credentials and JWT secret to environment
  variables
- React frontend with authentication, farmer dashboard, buyer product
  browsing, and order management
- Swagger/OpenAPI documentation
- Unit and integration tests for backend services and controllers
- Admin module with user and product management
- Postman collection for API testing

#### Planned for Future

- Farmer verification (verified badge/status)
- Shopping cart functionality
- Wishlist functionality
- Payment processing integration
- Order notifications (email or in-app)
- Docker containerization
- CI/CD pipeline
- Cloud deployment
- Advanced admin analytics and reporting

### Out of Scope

The following features are explicitly out of scope for the current project:

- Mobile native applications (iOS/Android) — only web-based React
  frontend
- Real-time chat or messaging between farmers and buyers
- Multi-language support
- Product rating and review system
- Shipping and logistics management
- Returns and refunds processing
- Subscription or membership models
- Integration with external agricultural databases or APIs
- Machine learning or recommendation engine
- Digital wallet or cryptocurrency payments

---

## 5. User Roles

### 5.1 Farmer

A farmer is a user who registers with the FARMER role to list agricultural
products and manage orders.

**Responsibilities:**
- Register and login to the platform
- Create and manage a farmer profile with farm details
- List agricultural products with pricing and quantity
- Update and delete their own products
- View orders received from buyers
- Accept, reject, and complete orders

**Permissions:**
- Access to `/api/farmer/**` endpoints
- Can only modify their own products and profiles
- Can only manage orders that belong to their products

### 5.2 Buyer

A buyer is a user who registers with the BUYER role to discover and
purchase agricultural products.

**Responsibilities:**
- Register and login to the platform
- Browse all available products
- Search products by name
- Filter products by category
- Place orders for products
- View their order history
- Track order status

**Permissions:**
- Access to `/api/buyer/**` endpoints
- Can only view their own orders
- Cannot modify products or manage other users' orders

### 5.3 Admin

An admin is a user with the ADMIN role who manages the platform.

**Responsibilities:**
- View all registered users
- Manage farmer and buyer accounts
- Oversee all products listed on the platform
- Monitor all orders across the platform
- Verify farmer profiles and identities

**Permissions:**
- Access to `/api/admin/**` endpoints
- Can view and manage all users, products, and orders

---

## 6. Functional Requirements

### 6.1 Authentication (FR-AUTH)

| ID | Requirement | Status | Verified in Code |
|---|---|---|---|
| FR-AUTH-01 | The system shall allow a user to register with name, email, password, and role. | ✅ Implemented | `AuthController.register()`, `AuthServiceImpl.register()` |
| FR-AUTH-02 | The system shall reject registration with an already-existing email. | ✅ Implemented | `userRepository.existsByEmail()` check in `AuthServiceImpl` |
| FR-AUTH-03 | The system shall encrypt passwords using BCrypt before storing. | ✅ Implemented | `BCryptPasswordEncoder` in `AuthServiceImpl` |
| FR-AUTH-04 | The system shall allow a user to login with email and password. | ✅ Implemented | `AuthController.login()`, `AuthServiceImpl.login()` |
| FR-AUTH-05 | The system shall return a JWT token on successful login. | ✅ Implemented | `JwtUtil.generateToken()` with 1-hour expiry |
| FR-AUTH-06 | The JWT token shall contain the user's email and role. | ✅ Implemented | `JwtUtil.generateToken()` includes `subject=email` and claim `role` |
| FR-AUTH-07 | The system shall validate JWT tokens on protected API requests. | ✅ Implemented | `JwtAuthFilter.doFilterInternal()` |
| FR-AUTH-08 | The system shall return 401 for invalid or expired JWT tokens. | ✅ Implemented | `JwtAuthFilter` does not set authentication for invalid tokens |
| FR-AUTH-09 | The system shall return meaningful error messages for invalid login. | ✅ Implemented | `RuntimeException("Invalid email or password")` |
| FR-AUTH-10 | The system shall validate request inputs (email format, required fields). | ✅ Implemented | Jakarta validation annotations on `LoginRequest` and `RegisterRequest` |

### 6.2 Farmer Features (FR-FARMER)

| ID | Requirement | Status | Verified in Code |
|---|---|---|---|
| FR-FARMER-01 | A farmer shall be able to create a farmer profile with farm details. | ✅ Implemented | `FarmerProfileController.createProfile()`, `FarmerProfileService.createProfile()` |
| FR-FARMER-02 | The farmer profile shall include farm name, location, land size, cultivation method, crops cultivated, and farming type. | ✅ Implemented | `FarmerProfileRequest` DTO with all fields |
| FR-FARMER-03 | A farmer shall be able to retrieve their own profile. | ❌ Missing | No `GET` endpoint exists for farmer profile |
| FR-FARMER-04 | A farmer shall be able to update their own profile. | ❌ Missing | No `PUT` endpoint exists for farmer profile |
| FR-FARMER-05 | A farmer shall not be able to create multiple profiles. | ❌ Missing | No check for existing profile in `FarmerProfileService` |
| FR-FARMER-06 | A farmer shall be able to create a product with name, description, price, quantity, and category. | ✅ Implemented | `ProductController.createProduct()`, `ProductService.createProduct()` |
| FR-FARMER-07 | A farmer shall be able to view all their own products. | ✅ Implemented | `ProductController.getMyProducts()` |
| FR-FARMER-08 | A farmer shall be able to update their own products. | ✅ Implemented | `ProductController.updateProduct()` with ownership check |
| FR-FARMER-09 | A farmer shall be able to delete their own products. | ✅ Implemented | `ProductController.deleteProduct()` with ownership check |
| FR-FARMER-10 | A farmer shall not be able to update or delete another farmer's products. | ✅ Implemented | Ownership verification via email match in `ProductService` |
| FR-FARMER-11 | A farmer shall be able to view orders received for their products. | ✅ Implemented | `OrderController.getFarmerOrders()` |
| FR-FARMER-12 | A farmer shall be able to change order status. | ✅ Implemented | `OrderController.updateOrderStatus()` |
| FR-FARMER-13 | A farmer shall only be able to change status of orders belonging to their products. | ✅ Implemented | Ownership check in `OrderService.updateOrderStatus()` |
| FR-FARMER-14 | The order status flow shall be: PENDING → ACCEPTED/REJECTED, ACCEPTED → COMPLETED. REJECTED and COMPLETED orders shall not be changed. | ✅ Implemented | State machine validation in `OrderService.updateOrderStatus()` |

### 6.3 Buyer Features (FR-BUYER)

| ID | Requirement | Status | Verified in Code |
|---|---|---|---|
| FR-BUYER-01 | A buyer shall be able to browse all available products. | ✅ Implemented | `BuyerProductController.getAllProducts()` |
| FR-BUYER-02 | A buyer shall be able to search products by name. | ⚠️ Partially Implemented | Logic exists in `ProductRepository.findByNameContainingIgnoreCase()` but no controller endpoint exposes it |
| FR-BUYER-03 | A buyer shall be able to filter products by category. | ⚠️ Partially Implemented | Logic exists in `ProductService.getProductsByCategory()` but no controller endpoint exposes it |
| FR-BUYER-04 | A buyer shall be able to place an order for a product. | ✅ Implemented | `OrderController.placeOrder()` |
| FR-BUYER-05 | The system shall validate product stock before placing an order. | ✅ Implemented | Quantity check in `OrderService.placeOrder()` |
| FR-BUYER-06 | The system shall reduce product quantity when an order is placed. | ✅ Implemented | `product.setQuantity(product.getQuantity() - request.getQuantity())` |
| FR-BUYER-07 | The system shall calculate the total order price. | ✅ Implemented | `totalPrice = product.getPrice() * request.getQuantity()` |
| FR-BUYER-08 | A buyer shall be able to view all their own orders. | ✅ Implemented | `OrderController.getMyOrders()` |
| FR-BUYER-09 | A buyer shall be able to track the status of their orders. | ✅ Implemented | Status is included in `OrderResponse` |
| FR-BUYER-10 | A buyer shall not be able to view other buyers' orders. | ✅ Implemented | `OrderRepository.findByBuyerEmail()` filters by authenticated user |

### 6.4 Admin Features (FR-ADMIN)

| ID | Requirement | Status | Verified in Code |
|---|---|---|---|
| FR-ADMIN-01 | An admin shall be able to view a dashboard. | ⚠️ Stub Only | `AdminController.adminDashboard()` returns plain text string |
| FR-ADMIN-02 | An admin shall be able to view all registered users. | ❌ Missing | No endpoint or service exists |
| FR-ADMIN-03 | An admin shall be able to manage farmer accounts. | ❌ Missing | No endpoint or service exists |
| FR-ADMIN-04 | An admin shall be able to manage buyer accounts. | ❌ Missing | No endpoint or service exists |
| FR-ADMIN-05 | An admin shall be able to view all products. | ❌ Missing | No endpoint or service exists |
| FR-ADMIN-06 | An admin shall be able to view all orders. | ❌ Missing | No endpoint or service exists |
| FR-ADMIN-07 | An admin shall be able to verify farmers. | ❌ Missing | No verification system exists |

### 6.5 System Features (FR-SYS)

| ID | Requirement | Status | Verified in Code |
|---|---|---|---|
| FR-SYS-01 | The system shall use a layered architecture (Controller → Service → Repository → Database). | ✅ Implemented | All modules follow this pattern except `BuyerProductController` |
| FR-SYS-02 | The system shall use DTOs for API requests and responses, not entities. | ✅ Implemented | 8 DTOs used across all endpoints |
| FR-SYS-03 | The system shall use constructor injection. | ✅ Implemented | All services and controllers use constructor injection |
| FR-SYS-04 | The system shall validate all API request inputs. | ✅ Implemented | Jakarta `@Valid` + validation annotations on all request DTOs |
| FR-SYS-05 | The system shall return appropriate HTTP status codes. | ⚠️ Partial | Returns 200 OK for all success cases; errors throw exceptions (no `@ControllerAdvice`) |
| FR-SYS-06 | The system shall provide meaningful error messages for validation failures. | ❌ Missing | No global exception handler; validation errors return default Spring error structure |
| FR-SYS-07 | The system shall use environment variables for sensitive configuration. | ❌ Missing | Database password and JWT secret are hardcoded in `application.properties` |
| FR-SYS-08 | The system shall have a health-check endpoint. | ✅ Implemented | `TestController` at `GET /api/test` |

---

## 7. Non-Functional Requirements

### 7.1 Security (NFR-SEC)

| ID | Requirement | Status |
|---|---|---|
| NFR-SEC-01 | All passwords must be hashed using BCrypt before storage. | ✅ Implemented |
| NFR-SEC-02 | All API endpoints except authentication must require a valid JWT token. | ✅ Implemented |
| NFR-SEC-03 | JWT tokens must expire after a configured period. | ✅ Implemented (1 hour) |
| NFR-SEC-04 | Role-based access must be enforced on all protected endpoints. | ✅ Implemented |
| NFR-SEC-05 | Users must only be able to access their own data (products, orders, profile). | ✅ Implemented (ownership checks) |
| NFR-SEC-06 | Sensitive credentials (database password, JWT secret) must not be hardcoded in source code. | ❌ Not Implemented |
| NFR-SEC-07 | Cross-Site Request Forgery (CSRF) protection must be disabled for REST APIs. | ✅ Implemented (`.csrf(csrf -> csrf.disable())`) |
| NFR-SEC-08 | The server must not expose stack traces to clients on errors. | ❌ Not Implemented |

### 7.2 Performance (NFR-PERF)

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | API response time should be under 500ms for typical requests. | Not tested |
| NFR-PERF-02 | The system should support up to 100 concurrent users. | Not tested |
| NFR-PERF-03 | Database queries should use indexes for frequently searched columns. | Partially (email indexed via `unique = true`) |

### 7.3 Scalability (NFR-SCAL)

| ID | Requirement |
|---|---|
| NFR-SCAL-01 | The backend should be stateless to allow horizontal scaling. (JWT tokens are stateless) |
| NFR-SCAL-02 | The database should be the only stateful component. |
| NFR-SCAL-03 | New backend instances should be addable without reconfiguration. |

### 7.4 Availability (NFR-AVAIL)

| ID | Requirement | Notes |
|---|---|---|
| NFR-AVAIL-01 | The system should have 99.9% uptime during business hours. | Target for production |
| NFR-AVAIL-02 | Scheduled maintenance should be communicated in advance. | Future operational requirement |

### 7.5 Maintainability (NFR-MAINT)

| ID | Requirement | Status |
|---|---|---|
| NFR-MAINT-01 | The codebase must follow a consistent layered architecture. | ✅ Implemented |
| NFR-MAINT-02 | Business logic must reside in Service layer, not Controllers. | ⚠️ Violated by `BuyerProductController` |
| NFR-MAINT-03 | All API inputs must be validated at the DTO level. | ✅ Implemented |
| NFR-MAINT-04 | The project must have unit and integration tests. | ❌ Not Implemented |
| NFR-MAINT-05 | The project must have API documentation. | ❌ Not Implemented (truncated draft exists) |
| NFR-MAINT-06 | Database schema must be managed through JPA entities with `ddl-auto`. | ✅ Implemented |

---

## 8. User Stories

### 8.1 Farmer User Stories

| ID | Story |
|---|---|
| US-FARMER-01 | As a farmer, I want to register an account so that I can access the platform. |
| US-FARMER-02 | As a registered farmer, I want to log in so that I can manage my products and orders. |
| US-FARMER-03 | As a farmer, I want to create my farmer profile with farm details so that buyers can learn about my farm. |
| US-FARMER-04 | As a farmer, I want to view and update my profile so that my information stays current. |
| US-FARMER-05 | As a farmer, I want to add new products so that buyers can discover and purchase them. |
| US-FARMER-06 | As a farmer, I want to view all my listed products so that I can manage my inventory. |
| US-FARMER-07 | As a farmer, I want to update my product details so that I can change prices or descriptions. |
| US-FARMER-08 | As a farmer, I want to remove products that are no longer available. |
| US-FARMER-09 | As a farmer, I want to view orders placed for my products so that I can fulfill them. |
| US-FARMER-10 | As a farmer, I want to accept or reject pending orders so that buyers know the status. |
| US-FARMER-11 | As a farmer, I want to mark accepted orders as completed after fulfillment. |

### 8.2 Buyer User Stories

| ID | Story |
|---|---|
| US-BUYER-01 | As a buyer, I want to register an account so that I can purchase products. |
| US-BUYER-02 | As a registered buyer, I want to log in so that I can browse and order products. |
| US-BUYER-03 | As a buyer, I want to browse all available products so that I can see what farmers are offering. |
| US-BUYER-04 | As a buyer, I want to search products by name so that I can quickly find specific items. |
| US-BUYER-05 | As a buyer, I want to filter products by category so that I can find relevant products. |
| US-BUYER-06 | As a buyer, I want to place an order for a product with a specific quantity. |
| US-BUYER-07 | As a buyer, I want to see the total price before confirming my order. |
| US-BUYER-08 | As a buyer, I want to view my order history so that I can track my purchases. |
| US-BUYER-09 | As a buyer, I want to see the status of my orders so that I know if they are accepted or completed. |

### 8.3 Admin User Stories

| ID | Story |
|---|---|
| US-ADMIN-01 | As an admin, I want to view all users so that I can manage the platform. |
| US-ADMIN-02 | As an admin, I want to view all products so that I can monitor listings. |
| US-ADMIN-03 | As an admin, I want to view all orders so that I can oversee transactions. |
| US-ADMIN-04 | As an admin, I want to verify farmers so that buyers can trust listings. |

---

## 9. Acceptance Criteria

### 9.1 Authentication

| ID | Criteria |
|---|---|
| AC-AUTH-01 | A user can register with a valid name, email, password, and role. |
| AC-AUTH-02 | Registration with an existing email returns an error message. |
| AC-AUTH-03 | A user can log in with valid credentials and receive a JWT token. |
| AC-AUTH-04 | Login with invalid credentials returns an error. |
| AC-AUTH-05 | Accessing a protected endpoint without a JWT returns 401. |
| AC-AUTH-06 | Accessing a protected endpoint with an expired JWT returns 401. |
| AC-AUTH-07 | Accessing a farmer endpoint with a buyer JWT returns 403. |
| AC-AUTH-08 | Accessing a buyer endpoint with a farmer JWT returns 403. |

### 9.2 Farmer Profile

| ID | Criteria |
|---|---|
| AC-FP-01 | A farmer can create a profile with all required fields. |
| AC-FP-02 | A farmer cannot create more than one profile. |
| AC-FP-03 | A farmer can view their own profile. |
| AC-FP-04 | A farmer can update their own profile. |

### 9.3 Products

| ID | Criteria |
|---|---|
| AC-PROD-01 | A farmer can create a product with name, description, price, quantity, and category. |
| AC-PROD-02 | A farmer can view all their own products. |
| AC-PROD-03 | A farmer can update their own products. |
| AC-PROD-04 | A farmer can delete their own products. |
| AC-PROD-05 | A farmer cannot update or delete another farmer's products. |
| AC-PROD-06 | A buyer can view all available products. |
| AC-PROD-07 | A buyer can search products by name. |
| AC-PROD-08 | A buyer can filter products by category. |

### 9.4 Orders

| ID | Criteria |
|---|---|
| AC-ORD-01 | A buyer can place an order for a product with a valid quantity. |
| AC-ORD-02 | Placing an order for more than available stock returns an error. |
| AC-ORD-03 | Product quantity decreases after a successful order. |
| AC-ORD-04 | A new order has status PENDING. |
| AC-ORD-05 | A buyer can view all their own orders. |
| AC-ORD-06 | A farmer can view orders for their products. |
| AC-ORD-07 | A farmer can change a PENDING order to ACCEPTED. |
| AC-ORD-08 | A farmer can change a PENDING order to REJECTED. |
| AC-ORD-09 | A farmer can change an ACCEPTED order to COMPLETED. |
| AC-ORD-10 | A farmer cannot change REJECTED or COMPLETED orders. |
| AC-ORD-11 | A farmer cannot change orders for another farmer's products. |

---

## 10. MVP Features

The Minimum Viable Product (MVP) includes all currently implemented features
plus the following additions to make the system complete and usable:

### Backend MVP Requirements

| Priority | Feature | Current Status |
|---|---|---|
| P0 | Authentication (Register, Login, JWT) | ✅ Implemented |
| P0 | Role-based authorization | ✅ Implemented |
| P0 | Farmer profile creation | ✅ Implemented |
| P0 | Product CRUD (Create, Read, Update, Delete) | ✅ Implemented |
| P0 | Order placement with stock validation | ✅ Implemented |
| P0 | Order status management | ✅ Implemented |
| P0 | Product browsing for buyers | ✅ Implemented |
| P1 | Global exception handler | ❌ Missing |
| P1 | Product search by name (expose API) | ⚠️ Partially done |
| P1 | Product category filter (expose API) | ⚠️ Partially done |
| P1 | Farmer profile get/update endpoints | ❌ Missing |
| P1 | Prevent duplicate farmer profiles | ❌ Missing |
| P1 | Environment variables for credentials | ❌ Missing |
| P1 | Refactor BuyerProductController to use Service layer | ❌ Missing |
| P2 | Admin user management | ❌ Missing |
| P2 | Admin product and order oversight | ❌ Missing |

### Frontend MVP Requirements

| Priority | Feature |
|---|---|
| P0 | Login and Registration pages |
| P0 | Farmer Dashboard |
| P0 | Farmer product management UI (list, create, edit, delete) |
| P0 | Buyer product browsing UI |
| P0 | Buyer order placement flow |
| P1 | Order tracking for buyers |
| P1 | Farmer order management UI |
| P2 | Admin dashboard |

---

## 11. Future Features

The following features are planned for post-MVP releases:

| Feature | Description | Priority |
|---|---|---|
| Farmer Verification | Verified badge for farmers who have passed identity verification | Medium |
| Shopping Cart | Allow buyers to collect multiple items before placing an order | Medium |
| Wishlist | Allow buyers to save products for future purchase | Low |
| Payment Integration | Online payment processing (credit card, UPI, etc.) | High |
| Order Notifications | Email or in-app notifications when order status changes | Medium |
| Swagger Documentation | Interactive API documentation | High (pre-MVP) |
| Postman Collection | Curated API test collection | Medium |
| Docker Configuration | Containerize the application for consistent deployment | High |
| CI/CD Pipeline | Automated testing and deployment | Medium |
| Cloud Deployment | Host the application on a cloud platform | High |

---

## 12. Out of Scope

The following features are explicitly excluded from the FarmBridge project:

- Mobile native applications (iOS/Android)
- Real-time messaging or chat between users
- Multi-language / internationalization support
- Product ratings and reviews
- Shipping and logistics management
- Returns and refunds processing
- Subscription or membership models
- Integration with external agricultural databases
- Machine learning or recommendation systems
- Cryptocurrency or digital wallet payments
- Social features (follow, share, comment)

---

## 13. Assumptions

1. **Technical Assumptions:**
   - Java 25 is available and configured (per `pom.xml` properties).
   - MySQL 8+ is installed and running locally for development.
   - Maven is available for building the project.
   - The development environment has IntelliJ IDEA (or equivalent IDE).
   - Node.js and npm will be available for React frontend development.

2. **Business Assumptions:**
   - Farmers have basic digital literacy to use the platform.
   - Buyers are interested in purchasing directly from farmers.
   - Products are priced in a single currency (no multi-currency support).
   - Farmers are responsible for product availability and accuracy of
     listings.
   - The platform does not handle physical delivery of products.

3. **Operational Assumptions:**
   - The database will be backed up regularly in production.
   - SSL/TLS will be configured for the production deployment.
   - Admin users will be manually created (no self-registration for ADMIN
     role).
   - The `ddl-auto=update` setting is acceptable for development but a
     migration tool (like Flyway) would be preferred for production.

---

## 14. Constraints

1. **Technology Constraints:**
   - Backend must use Java with Spring Boot 4.1.0.
   - Database must be MySQL with JPA/Hibernate.
   - Frontend must use React.
   - Authentication must use JWT (no OAuth2, no session-based auth).
   - The project uses Maven for build management.

2. **Design Constraints:**
   - Must follow layered architecture (Controller → Service → Repository).
   - Must use DTOs for API communication.
   - Must use constructor injection (no field injection).
   - Must use role-based authorization via Spring Security.
   - API endpoints must follow RESTful conventions.

3. **Development Constraints:**
   - Must follow the TrainingMug ADF v1.0 development lifecycle.
   - All AI-generated code must be reviewed before inclusion.
   - Feature branches should be used for development.

4. **Deployment Constraints:**
   - Frontend will be deployed separately from the backend.
   - Database will be a managed MySQL service in production.
   - Docker and CI/CD must be configured before production deployment.

---

## 15. Dependencies

### External Dependencies (Already Configured)

| Dependency | Version | Purpose |
|---|---|---|
| Spring Boot Starter Web | 4.1.0 (managed) | REST API framework |
| Spring Boot Starter Data JPA | 4.1.0 (managed) | Database access |
| Spring Boot Starter Security | 4.1.0 (managed) | Authentication and authorization |
| Spring Boot Starter Validation | 4.1.0 (managed) | Input validation |
| MySQL Connector-J | Runtime | MySQL database driver |
| Project Lombok | Optional | Boilerplate code reduction |
| jjwt-api | 0.12.6 | JWT token creation and parsing |
| jjwt-impl | 0.12.6 (runtime) | JWT implementation |
| jjwt-jackson | 0.12.6 (runtime) | JWT JSON serialization |
| Spring Boot Starter Test | 4.1.0 (test) | Testing framework |

### External Dependencies (Needed for Future)

| Dependency | Purpose |
|---|---|
| springdoc-openapi-starter-webmvc-ui | Swagger/OpenAPI documentation |
| React + React Router | Frontend UI framework |
| Axios or Fetch | Frontend HTTP client |
| Docker + docker-compose | Containerization |

### Internal Dependencies

| Component | Depends On |
|---|---|
| Controllers | Services |
| Services | Repositories |
| Repositories | Entities and Database |
| Security Config | JwtAuthFilter, JwtUtil |
| Frontend | All backend APIs |

---

*Document Version: 1.0*
*Last Updated: 2026-07-28*
*Framework: TrainingMug ADF v1.0*
