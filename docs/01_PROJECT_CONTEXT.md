# FarmBridge - Project Context

## 1. Project Name

FarmBridge

## 2. Problem Statement

Farmers often depend on intermediaries to sell their agricultural products.
This can reduce the farmer's profit and make it difficult for buyers to
directly identify the farmer and understand the source of the products.

FarmBridge aims to provide a direct digital marketplace that connects farmers
with buyers without unnecessary middlemen.

## 3. Business Objective

The main objective of FarmBridge is to connect farmers directly with buyers,
allow farmers to list their agricultural products, and allow buyers to
discover and purchase products through the platform.

The project also aims to improve trust between farmers and buyers through
farmer profiles, verification, and product information.

## 4. Project Scope

FarmBridge currently focuses on:

- User registration and login
- JWT-based authentication
- Role-based authorization
- Farmer profiles
- Product management
- Product search
- Product category filtering
- Buyer order placement
- Farmer order management
- Order status management

Planned features include:

- Admin management
- Farmer verification
- Frontend integration
- API documentation
- Automated testing
- Containerization
- CI/CD
- Cloud deployment

## 5. User Roles

### Farmer

A farmer can:

- Register and login
- Create a farmer profile
- Create products
- View products
- Update products
- Delete products
- View received orders
- Accept orders
- Reject orders
- Complete orders

### Buyer

A buyer can:

- Register and login
- Browse products
- Search products
- Filter products by category
- Place orders
- View orders
- Track order status

### Admin

The Admin role is planned for platform management.

Planned responsibilities include:

- View users
- Manage farmers
- Manage buyers
- Manage products
- Manage orders
- Verify farmers

## 6. Technology Stack

### Backend

- Java
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA
- Hibernate
- Maven

### Database

- MySQL

### Frontend

- React

Frontend development is planned and will be integrated with the Spring Boot
REST APIs.

### Development Tools

- IntelliJ IDEA
- MySQL Workbench
- Postman
- Git
- GitHub

## 7. Backend Architecture

FarmBridge follows a layered architecture.

The main layers are:

- Controller
- Service
- Repository
- Entity
- DTO
- Security
- Configuration

The general request flow is:

Client
→ Controller
→ Service
→ Repository
→ MySQL Database

The response follows the reverse flow:

MySQL Database
→ Repository
→ Service
→ Controller
→ Client

## 8. Authentication and Authorization

FarmBridge uses JWT-based authentication.

The supported roles are:

- ADMIN
- FARMER
- BUYER

Authentication flow:

1. User registers.
2. User logs in.
3. Server validates the credentials.
4. Server generates a JWT token.
5. Client sends the JWT token with protected API requests.
6. JWT authentication filter validates the token.
7. Spring Security checks the user's role.
8. The user can access authorized endpoints.

## 9. Current Backend Modules

The current backend includes:

### Authentication

- Registration
- Login
- Password encryption
- JWT token generation
- JWT validation

### Farmer

- Farmer profile
- Product management
- Farmer order management

### Buyer

- Product browsing
- Product search
- Category filtering
- Order placement
- Order viewing

### Orders

- Order creation
- Product and farmer association
- Buyer association
- Quantity management
- Total price
- Order status management

### Order Status

The current order lifecycle supports:

PENDING
→ ACCEPTED
→ COMPLETED

or

PENDING
→ REJECTED

## 10. Current Project Status

The core Spring Boot backend is currently functional.

Completed areas include:

- Authentication
- JWT security
- Role-based authorization
- Farmer profile
- Product management
- Product search
- Product category filtering
- Buyer order placement
- Farmer order management
- Order status management
- MySQL database integration
- GitHub repository

Remaining project work includes:

- Admin module
- Farmer verification
- React frontend
- Postman collection
- Swagger API documentation
- Unit testing
- Integration testing
- Docker configuration
- CI/CD pipeline
- Cloud deployment
- Final project documentation

## 11. Coding Approach

The project follows a layered architecture and uses:

- DTO Pattern
- Repository Pattern
- Service Layer
- Constructor Injection
- Role-based Security
- JWT Authentication

Business logic should be maintained in service classes rather than controllers.

## 12. Git Strategy

The project source code is maintained in GitHub.

The main branch is:

main

Feature development should use separate feature branches where possible.

Example:

feature/admin
feature/farmer-verification
feature/frontend
feature/swagger
feature/docker

Meaningful commit messages should be used.

Examples:

feat: add admin user management
feat: add farmer verification
docs: update project context
test: add order service tests
fix: resolve JWT validation issue

## 13. Deployment Strategy

The application is currently running in a local development environment.

The planned deployment strategy is:

Frontend
→ Cloud deployment platform

Backend
→ Cloud deployment platform

Database
→ Cloud MySQL

Docker and CI/CD will be configured before production deployment.

## 14. Development Methodology

FarmBridge follows the TrainingMug AI Development Framework (ADF) approach.

The development process is:

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

AI tools are used as engineering assistants.

All AI-generated code must be reviewed, understood, tested, and verified before
being included in the project.