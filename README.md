# FarmBridge

FarmBridge is a full-stack digital marketplace that connects farmers directly
with buyers, removing unnecessary intermediaries. Farmers can list their
produce and manage incoming orders, buyers can browse products and place
orders, and administrators can manage users, products, and farmer
verifications. The platform is built with a Spring Boot REST API secured by
JWT and a responsive React frontend.

## Features

- JWT Authentication
- Role-Based Access Control
- Farmer Module
- Buyer Module
- Admin Module
- Product Management
- Order Management
- Farmer Verification
- Swagger API Documentation
- Responsive React Frontend

## Tech Stack

### Frontend

- React
- JavaScript
- CSS

### Backend

- Java
- Spring Boot
- Spring Security
- Hibernate
- JPA

### Database

- MySQL

### Tools

- Git
- GitHub
- Swagger
- Postman

## Project Architecture

The application follows a layered architecture on the backend.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
MySQL
```

- **Controller** — Handles HTTP requests and routes them to services.
- **Service** — Contains the application's business logic.
- **Repository** — Data access layer built on Spring Data JPA.
- **MySQL** — Relational database storing all application data.

The frontend is a React single-page application that communicates with the
backend through a REST API secured with JWT tokens.

## Folder Structure

```text
FarmBridge/                      # Repository root
├── docs/                        # Project documentation
└── FarmBridge/                  # Application (backend + frontend)
    ├── src/                     # Spring Boot backend
    │   ├── main/
    │   │   ├── java/com/farmbridge/
    │   │   │   ├── config/      # Security, OpenAPI config
    │   │   │   ├── controller/  # REST controllers
    │   │   │   ├── dto/         # Request/response DTOs
    │   │   │   ├── entity/      # JPA entities
    │   │   │   ├── exception/   # Global exception handling
    │   │   │   ├── repository/  # Spring Data JPA repositories
    │   │   │   ├── security/    # JWT auth and filters
    │   │   │   └── service/     # Business logic
    │   │   └── resources/
    │   │       └── application.properties
    │   └── test/                # Backend tests
    ├── frontend/                # React frontend
    │   └── src/
    │       ├── components/      # Reusable UI components
    │       ├── context/         # Auth context and providers
    │       ├── pages/           # Route-level pages
    │       └── services/        # API service layer
    ├── pom.xml                  # Maven build configuration
    ├── mvnw                     # Maven wrapper (Unix)
    └── mvnw.cmd                 # Maven wrapper (Windows)
```

## API Modules

- **Authentication** — User registration and login, JWT token generation.
- **User** — User account management and profile data.
- **Farmer Profile** — Create, read, and update farmer profile information.
- **Products** — Product listing, browsing, and admin overview.
- **Orders** — Order placement, tracking, and management.
- **Admin** — Statistics, user management, and farmer verification.

Interactive API documentation is available through Swagger UI
(`http://localhost:8080/swagger-ui.html`) once the backend is running.

## Installation Steps

### Backend Setup

1. Clone the repository.

   ```bash
   git clone https://github.com/hariprasaddev/FarmBridge.git
   ```

2. Open the project in IntelliJ IDEA.

3. Configure MySQL.

   - Create a database named `farmbridge`.
   - Update the MySQL credentials in the application config
     (`src/main/resources/application.properties`).

4. Run the Spring Boot application.

   ```bash
   ./mvnw spring-boot:run
   ```

   The backend starts at `http://localhost:8080`. Swagger UI is available
   at `http://localhost:8080/swagger-ui.html`.

### Frontend Setup

1. Navigate to the frontend directory.

   ```bash
   cd frontend
   ```

2. Install the dependencies.

   ```bash
   npm install
   ```

3. Start the development server.

   ```bash
   npm run dev
   ```

   The frontend runs at `http://localhost:5173`.

## Screenshots

### Login Page

![Login Page](screenshots/login-page.png)

### Register Page

![Register Page](screenshots/register-page.png)

### Farmer Dashboard

![Farmer Dashboard](screenshots/farmer-dashboard.png)

### Buyer Products

![Buyer Products](screenshots/buyer-products.png)

### Add Product

![Add Product](screenshots/add-product.png)

### Buyer Orders

![Buyer Orders](screenshots/buyer-orders.png)

### Farmer Orders

![Farmer Orders](screenshots/farmer-orders.png)

### Admin Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)

### Admin Users

![Admin Users](screenshots/admin-users.png)

### Swagger UI

![Swagger UI](screenshots/swagger-ui.png)

## Future Enhancements

- Payment Gateway
- Email Notifications
- Image Upload
- Reviews & Ratings
- AI Crop Recommendation

## Author

Mukkera Hariprasad

GitHub: [https://github.com/hariprasaddev](https://github.com/hariprasaddev)

---

## API Documentation

### Project Overview

FarmBridge exposes a REST API secured with **JWT Bearer tokens**. The API
covers Authentication, Admin, Farmer, Buyer, Reviews, Wishlist, Notifications,
and Forgot/Reset Password modules. Full interactive documentation is available
through Swagger UI.

### Technologies

- **Backend:** Java, Spring Boot, Spring Security, Spring Data JPA, Hibernate,
  MySQL, Spring Mail, JWT (jjwt), Springdoc OpenAPI (Swagger)
- **Frontend:** React, JavaScript, CSS, Vite

### Swagger UI

- **Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs
- **API documentation:** [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

### Postman Collection

A complete Postman collection with every endpoint is provided:

- **Collection:** [`docs/FarmBridge_API.postman_collection.json`](docs/FarmBridge_API.postman_collection.json)
- **Environment:** [`docs/FarmBridge_Environment.postman_environment.json`](docs/FarmBridge_Environment.postman_environment.json)

Import both into Postman, run **Login** (Authentication folder) to auto-capture
the JWT into the `token` environment variable, then call any protected endpoint.

### Environment Variables

The backend reads configuration from environment variables. Create a `.env`
or export them in your shell before starting the application:

| Variable | Purpose |
|---|---|
| `DB_URL` | MySQL JDBC URL (e.g. `jdbc:mysql://localhost:3306/farmbridge`) |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | HMAC key used to sign JWTs (≥ 32 characters) |
| `MAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `MAIL_PORT` | SMTP port (e.g. `587`) |
| `MAIL_USERNAME` | SMTP username (e.g. Gmail address) |
| `MAIL_PASSWORD` | SMTP password / Google App Password |
| `APP_RESET_PASSWORD_URL` | Frontend reset-page URL used in reset emails |

Example:

```bash
export DB_URL=jdbc:mysql://localhost:3306/farmbridge
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=ChangeMeToALongRandomSecretForProduction
```
