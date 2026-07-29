# FarmBridge - Architecture Document

## 1. Architecture Overview

FarmBridge follows a layered architecture using Spring Boot.

The application consists of:

- Frontend
- Spring Boot Backend
- MySQL Database

The backend follows a layered structure:

Client
→ Controller
→ Service
→ Repository
→ Database

The response follows:

Database
→ Repository
→ Service
→ Controller
→ Client

---

## 2. High-Level Architecture

The planned system architecture is:

User
│
├── Admin
├── Farmer
└── Buyer
│
▼
React Frontend
│
▼
Spring Boot REST API
│
├── Authentication & Authorization
│
├── User Management
│
├── Farmer Management
│
├── Product Management
│
└── Order Management
│
▼
MySQL Database

The React frontend is planned for integration with the existing Spring Boot
REST APIs.

---

## 3. Backend Layered Architecture

### Controller Layer

The Controller layer receives HTTP requests from clients and returns HTTP
responses.

Responsibilities:

- Handle HTTP requests
- Validate request input
- Call service methods
- Return appropriate responses

Controllers should not contain business logic.

---

### Service Layer

The Service layer contains the business logic of the application.

Responsibilities:

- Implement business rules
- Process application data
- Coordinate repositories
- Perform authorization-related business checks where required

Examples:

- Creating products
- Placing orders
- Updating order status
- Validating farmer ownership of products
- Calculating order totals

---

### Repository Layer

The Repository layer communicates with the MySQL database using Spring Data JPA.

Responsibilities:

- Save data
- Retrieve data
- Update data
- Delete data
- Execute database queries

---

### Entity Layer

The Entity layer represents database tables using JPA entities.

Current domain entities include concepts for:

- User
- Farmer Profile
- Product
- Order

---

### DTO Layer

DTOs are used to transfer data between the client and backend.

DTOs help avoid directly exposing database entities through REST APIs.

Examples include:

- Registration request
- Login request
- Login response
- Product request
- Product response
- Order request
- Order response
- Order status request

---

### Security Layer

The security layer manages authentication and authorization.

FarmBridge uses:

- Spring Security
- JWT Authentication
- Role-Based Authorization

Supported roles:

- ADMIN
- FARMER
- BUYER

---

### Configuration Layer

The configuration layer contains application-level security and configuration
classes.

Examples include:

- Security configuration
- Password encoder configuration

---

## 4. Authentication Flow

The FarmBridge authentication flow is:

1. User registers using the registration API.
2. User logs in using email and password.
3. Backend validates the credentials.
4. Password is verified using BCrypt password encoding.
5. Backend generates a JWT token.
6. Client receives the JWT token.
7. Client sends the token in the Authorization header.
8. JWT authentication filter extracts the token.
9. JWT token is validated.
10. User email and role are extracted from the token.
11. Spring Security creates an authenticated user context.
12. Role-based authorization determines whether the user can access the API.

Example:

Authorization: Bearer <JWT_TOKEN>

---

## 5. Role-Based Access

FarmBridge uses role-based access control.

### Admin

Admin APIs:

/api/admin/**

Required role:

ADMIN

---

### Farmer

Farmer APIs:

/api/farmer/**

Required role:

FARMER

---

### Buyer

Buyer APIs:

/api/buyer/**

Required role:

BUYER

---

### Authentication

Authentication APIs:

/api/auth/**

These APIs are publicly accessible for registration and login.

---

## 6. Product Flow

The product flow is:

Farmer
→ Login
→ Receive JWT
→ Create Product
→ Product Controller
→ Product Service
→ Product Repository
→ MySQL

The product is associated with the authenticated farmer.

Buyers can then:

Buyer
→ Login
→ Receive JWT
→ Browse Products (all products listed by all farmers)
→ View Products

> ⚠️ **Planned:** Product search by name and category filtering are **not yet exposed** as buyer API endpoints. The repository supports `findByNameContainingIgnoreCase()` and the service supports `getProductsByCategory()`, but no controller endpoint calls either feature. These are pending controller integration.

---

## 7. Order Flow

The order flow is:

Buyer
→ Select Product
→ Place Order
→ Order Service
→ Create Order
→ Associate Buyer
→ Associate Farmer
→ Associate Product
→ Calculate Total Price
→ Reduce Product Quantity
→ Save Order

The order initially has:

PENDING

The farmer can then update the order:

PENDING
→ ACCEPTED
→ COMPLETED

or:

PENDING
→ REJECTED

---

## 8. Current System Components

The current backend project contains the following main packages:

com.farmbridge
│
├── config
├── controller
├── dto
├── entity
├── repository
├── security
└── service

---

## 9. Service Responsibilities

### Authentication Service

Responsibilities:

- User registration
- User login
- Password encryption
- JWT generation

---

### Farmer Profile Service

Responsibilities:

- Farmer profile management
- Farmer information management

---

### Product Service

Responsibilities:

- Create products
- Retrieve products
- Update products
- Delete products
- Filter products by category (service method `getProductsByCategory()` exists — controller endpoint pending)
- Search products by name (⚠️ **only repository support** — no service method or controller endpoint exists yet)

---

### Order Service

Responsibilities:

- Place orders
- Associate buyers with orders
- Associate farmers with orders
- Associate products with orders
- Calculate total price
- Reduce product quantity
- Retrieve orders
- Update order status

---

## 10. Security Architecture

The security flow is:

Client
│
│ JWT Token
▼
JwtAuthFilter
│
▼
JwtUtil
│
├── Validate Token
├── Extract Email
└── Extract Role
│
▼
SecurityContext
│
▼
Role-Based Authorization
│
▼
Protected API

---

## 11. Current Architecture Status

### Completed

- Spring Boot backend
- Layered architecture
- Controller layer
- Service layer
- Repository layer
- Entity layer
- DTO layer
- JWT authentication
- Role-based authorization
- MySQL integration
- Farmer product management
- Buyer product access
- Order management

### Planned

- React frontend
- Admin management module
- Farmer verification
- Swagger API documentation
- Postman collection
- Unit testing
- Integration testing
- Docker containerization
- CI/CD pipeline
- Cloud deployment

---

## 12. Deployment Architecture

The current application runs in a local development environment.

The planned production architecture is:

React Frontend
│
▼
Cloud Hosting Platform
│
▼
Spring Boot Backend
│
▼
Cloud MySQL Database

Docker and CI/CD will be configured as part of the deployment process.