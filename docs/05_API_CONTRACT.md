# FarmBridge - API Contract

> **Document Version:** 1.0  
> **Last Updated:** 2026-07-28  
> **Framework:** TrainingMug ADF v1.0  
> **Status:** ✅ Based on actual source code inspection

---

## 1. Base URL

**Local Development:**

```
http://localhost:8080
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Method

FarmBridge uses **JWT (JSON Web Token)** based authentication.

### 2.2 How JWT Works

1. User registers via `POST /api/auth/register`.
2. User logs in via `POST /api/auth/login`.
3. Server validates credentials, generates a JWT token, and returns it.
4. Client must send the JWT token in the `Authorization` header for all protected API requests.

**Header Format:**

```
Authorization: Bearer <JWT_TOKEN>
```

### 2.3 JWT Token Contents

The JWT token contains:

| Field | Description |
|---|---|
| `sub` (subject) | User's email address |
| `role` | User's role (ADMIN, FARMER, or BUYER) |
| `iat` | Token issued at timestamp |
| `exp` | Token expiration timestamp (1 hour from issuance) |

### 2.4 User Roles

| Role | Prefix in Security | Description |
|---|---|---|
| `ADMIN` | `ROLE_ADMIN` | Platform administrator |
| `FARMER` | `ROLE_FARMER` | Farmer who lists products |
| `BUYER` | `ROLE_BUYER` | Buyer who purchases products |

### 2.5 Authorization Rules

| URL Pattern | Role Required |
|---|---|
| `/api/auth/**` | Public (no authentication) |
| `/api/admin/**` | ADMIN |
| `/api/farmer/**` | FARMER |
| `/api/buyer/**` | BUYER |
| All other endpoints | Authenticated (any role) |

### 2.6 HTTP Status Codes Reference

| Status Code | Meaning |
|---|---|
| `200 OK` | Request succeeded |
| `400 Bad Request` | Validation failed (missing or invalid fields) |
| `401 Unauthorized` | No JWT or invalid/expired JWT |
| `403 Forbidden` | Authenticated but wrong role |
| `500 Internal Server Error` | Server-side error (exception thrown) |

> **Note:** Currently there is **no global exception handler** (`@ControllerAdvice`). When services throw `RuntimeException`, the client receives a default Spring Boot error response with status 500. Validation errors (Jakarta `@Valid`) return a default 400 error response from Spring.

---

## 3. Currently Implemented APIs

This section documents every REST endpoint that is actually implemented in the source code as of July 2026.

---

### 3.1 Authentication APIs

#### 3.1.1 Register User

| Property | Value |
|---|---|
| **Endpoint** | `/api/auth/register` |
| **HTTP Method** | `POST` |
| **Description** | Creates a new user account. Supports ADMIN, FARMER, and BUYER roles. |
| **Authentication** | Public (no JWT required) |

**Request Body:**

```json
{
  "name": "John Farmer",
  "email": "john@farm.com",
  "password": "securePassword123",
  "role": "FARMER"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ Yes | Cannot be blank |
| `email` | String | ✅ Yes | Valid email format, cannot be blank |
| `password` | String | ✅ Yes | Cannot be blank |
| `role` | String (enum) | No | `ADMIN`, `FARMER`, or `BUYER`. If omitted, defaults to `null` (will cause DB error) |

**Success Response (200 OK):**

```
User Registered Successfully
```

**Error Responses:**

- **400 Bad Request** — Validation errors (missing fields, invalid email)
- **500 Internal Server Error** — Email already exists (returns `RuntimeException` message), or role is null

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Farmer",
    "email": "john@farm.com",
    "password": "securePassword123",
    "role": "FARMER"
  }'
```

---

#### 3.1.2 Login User

| Property | Value |
|---|---|
| **Endpoint** | `/api/auth/login` |
| **HTTP Method** | `POST` |
| **Description** | Authenticates a user and returns a JWT token. |
| **Authentication** | Public (no JWT required) |

**Request Body:**

```json
{
  "email": "john@farm.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | String | ✅ Yes | Valid email format, cannot be blank |
| `password` | String | ✅ Yes | Cannot be blank |

**Success Response (200 OK):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huQGZhcm0uY29tIiwicm9sZSI6IkZBUk1FUiIsImlhdCI6MTcyMjE2MDAwMCwiZXhwIjoxNzIyMTYzNjAwfQ.example",
  "email": "john@farm.com",
  "role": "FARMER"
}
```

| Field | Type | Description |
|---|---|---|
| `message` | String | Success message |
| `token` | String | JWT token (expires in 1 hour) |
| `email` | String | User's email |
| `role` | String | User's role (`ADMIN`, `FARMER`, or `BUYER`) |

**Error Responses:**

- **400 Bad Request** — Validation errors
- **500 Internal Server Error** — Invalid email or password (returns `RuntimeException` message)

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@farm.com",
    "password": "securePassword123"
  }'
```

---

### 3.2 Farmer APIs

#### 3.2.1 Farmer Dashboard (Stub)

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer` |
| **HTTP Method** | `GET` |
| **Description** | Simple greeting endpoint to verify farmer authentication works. Returns a plain text welcome message. This is a stub and will be replaced with a proper dashboard. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Success Response (200 OK):**

```
Welcome Farmer!
```

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/farmer \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.2.2 Create Farmer Profile

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/profile` |
| **HTTP Method** | `POST` |
| **Description** | Creates a farmer profile for the logged-in farmer. The profile is linked to the authenticated user. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Request Body:**

```json
{
  "farmName": "Green Valley Farm",
  "location": "Rural District, Farmville",
  "landSize": 15.5,
  "cultivationMethod": "Organic",
  "cropsCultivated": "Rice, Wheat, Vegetables",
  "farmingType": "Subsistence"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `farmName` | String | ✅ Yes | Cannot be blank |
| `location` | String | ✅ Yes | Cannot be blank |
| `landSize` | Double | ✅ Yes | Cannot be null |
| `cultivationMethod` | String | ✅ Yes | Cannot be blank |
| `cropsCultivated` | String | ✅ Yes | Cannot be blank |
| `farmingType` | String | ✅ Yes | Cannot be blank |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "farmName": "Green Valley Farm",
  "location": "Rural District, Farmville",
  "landSize": 15.5,
  "cultivationMethod": "Organic",
  "cropsCultivated": "Rice, Wheat, Vegetables",
  "farmingType": "Subsistence"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | Long | Auto-generated profile ID |
| `farmName` | String | Name of the farm |
| `location` | String | Farm location |
| `landSize` | Double | Size of agricultural land |
| `cultivationMethod` | String | Cultivation method used |
| `cropsCultivated` | String | Crops cultivated |
| `farmingType` | String | Type of farming |

> ⚠️ **Known Limitation:** Currently there is **no duplicate profile check**. A farmer can create multiple profiles. This will be fixed in a future update.

> ❌ **Missing Endpoints:** GET (retrieve profile) and PUT (update profile) endpoints are **not yet implemented**.

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/farmer/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "farmName": "Green Valley Farm",
    "location": "Rural District, Farmville",
    "landSize": 15.5,
    "cultivationMethod": "Organic",
    "cropsCultivated": "Rice, Wheat, Vegetables",
    "farmingType": "Subsistence"
  }'
```

---

#### 3.2.3 Create Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/products` |
| **HTTP Method** | `POST` |
| **Description** | Creates a new product listing for the logged-in farmer. The product is automatically linked to the authenticated farmer. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Request Body:**

```json
{
  "name": "Organic Rice",
  "description": "High-quality organic rice from Green Valley Farm",
  "price": 50.00,
  "quantity": 100,
  "category": "Grains"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ Yes | Cannot be blank |
| `description` | String | No | Optional |
| `price` | Double | ✅ Yes | Must be ≥ 1 |
| `quantity` | Integer | ✅ Yes | Must be ≥ 1 |
| `category` | String | ✅ Yes | Cannot be blank |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Organic Rice",
  "description": "High-quality organic rice from Green Valley Farm",
  "price": 50.00,
  "quantity": 100,
  "category": "Grains",
  "farmerName": "John Farmer"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | Long | Auto-generated product ID |
| `name` | String | Product name |
| `description` | String | Product description |
| `price` | Double | Product price |
| `quantity` | Integer | Available stock quantity |
| `category` | String | Product category |
| `farmerName` | String | Name of the farmer who listed the product |

**Error Responses:**

- **400 Bad Request** — Validation errors (missing name, price < 1, quantity < 1, etc.)

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/farmer/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Rice",
    "description": "High-quality organic rice from Green Valley Farm",
    "price": 50.00,
    "quantity": 100,
    "category": "Grains"
  }'
```

---

#### 3.2.4 Get My Products

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/products/my-products` |
| **HTTP Method** | `GET` |
| **Description** | Retrieves all products belonging to the logged-in farmer. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Organic Rice",
    "description": "High-quality organic rice from Green Valley Farm",
    "price": 50.00,
    "quantity": 100,
    "category": "Grains",
    "farmerName": "John Farmer"
  },
  {
    "id": 2,
    "name": "Fresh Wheat",
    "description": "Freshly harvested wheat",
    "price": 35.00,
    "quantity": 200,
    "category": "Grains",
    "farmerName": "John Farmer"
  }
]
```

> Returns empty array `[]` if the farmer has no products.

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/farmer/products/my-products \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.2.5 Update Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/products/{id}` |
| **HTTP Method** | `PUT` |
| **Description** | Updates a product by its ID. Only the farmer who owns the product can update it. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Path Variables:**

| Variable | Type | Description |
|---|---|---|
| `id` | Long | Product ID to update |

**Request Body:**

```json
{
  "name": "Organic Basmati Rice",
  "description": "Premium quality organic Basmati rice",
  "price": 65.00,
  "quantity": 80,
  "category": "Grains"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ Yes | Cannot be blank |
| `description` | String | No | Optional |
| `price` | Double | ✅ Yes | Must be ≥ 1 |
| `quantity` | Integer | ✅ Yes | Must be ≥ 1 |
| `category` | String | ✅ Yes | Cannot be blank |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Organic Basmati Rice",
  "description": "Premium quality organic Basmati rice",
  "price": 65.00,
  "quantity": 80,
  "category": "Grains",
  "farmerName": "John Farmer"
}
```

**Error Responses:**

- **400 Bad Request** — Validation errors
- **500 Internal Server Error** — Product not found, or "You are not allowed to update this product"

**Sample cURL:**

```bash
curl -X PUT http://localhost:8080/api/farmer/products/1 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Basmati Rice",
    "description": "Premium quality organic Basmati rice",
    "price": 65.00,
    "quantity": 80,
    "category": "Grains"
  }'
```

---

#### 3.2.6 Delete Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/products/{id}` |
| **HTTP Method** | `DELETE` |
| **Description** | Deletes a product by its ID. Only the farmer who owns the product can delete it. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Path Variables:**

| Variable | Type | Description |
|---|---|---|
| `id` | Long | Product ID to delete |

**Success Response (200 OK):**

```
Product deleted successfully
```

**Error Responses:**

- **500 Internal Server Error** — Product not found, or "You are not allowed to delete this product"

**Sample cURL:**

```bash
curl -X DELETE http://localhost:8080/api/farmer/products/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.2.7 Get Farmer Orders

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/orders` |
| **HTTP Method** | `GET` |
| **Description** | Retrieves all orders received by the logged-in farmer (orders for products they own). |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "productId": 1,
    "productName": "Organic Rice",
    "buyerName": "Jane Buyer",
    "farmerName": "John Farmer",
    "quantity": 5,
    "totalPrice": 250.00,
    "status": "PENDING"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | Long | Order ID |
| `productId` | Long | Product ID |
| `productName` | String | Name of the product ordered |
| `buyerName` | String | Name of the buyer who placed the order |
| `farmerName` | String | Name of the farmer who owns the product |
| `quantity` | Integer | Quantity ordered |
| `totalPrice` | Double | Total price (price × quantity) |
| `status` | String | Order status: `PENDING`, `ACCEPTED`, `REJECTED`, or `COMPLETED` |

> Returns empty array `[]` if the farmer has no orders.

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/farmer/orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.2.8 Update Order Status

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/orders/{orderId}/status` |
| **HTTP Method** | `PUT` |
| **Description** | Updates the status of an order. Only the farmer who owns the product in the order can update the status. Follows a strict state machine. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Path Variables:**

| Variable | Type | Description |
|---|---|---|
| `orderId` | Long | Order ID to update |

**Order Status State Machine:**

```
PENDING
  ├── ACCEPTED  (farmer accepts the order)
  │      └── COMPLETED  (farmer marks order as fulfilled)
  └── REJECTED  (farmer rejects the order)
```

| Current Status | Allowed New Statuses |
|---|---|
| `PENDING` | `ACCEPTED`, `REJECTED` |
| `ACCEPTED` | `COMPLETED` |
| `REJECTED` | None (locked) |
| `COMPLETED` | None (locked) |

**Request Body:**

```json
{
  "status": "ACCEPTED"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `status` | String (enum) | ✅ Yes | Must be one of: `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`. Must follow state machine rules. |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "productId": 1,
  "productName": "Organic Rice",
  "buyerName": "Jane Buyer",
  "farmerName": "John Farmer",
  "quantity": 5,
  "totalPrice": 250.00,
  "status": "ACCEPTED"
}
```

**Error Responses:**

- **400 Bad Request** — Validation errors (null status)
- **500 Internal Server Error** — Order not found, "You are not allowed to update this order", or invalid status transition

**Sample cURL:**

```bash
# Accept an order
curl -X PUT http://localhost:8080/api/farmer/orders/1/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}'

# Reject an order
curl -X PUT http://localhost:8080/api/farmer/orders/1/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "REJECTED"}'

# Complete an accepted order
curl -X PUT http://localhost:8080/api/farmer/orders/1/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

---

### 3.3 Buyer APIs

#### 3.3.1 Buyer Dashboard (Stub)

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer` |
| **HTTP Method** | `GET` |
| **Description** | Simple greeting endpoint to verify buyer authentication works. Returns a plain text welcome message. This is a stub and will be replaced with a proper dashboard. |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

**Success Response (200 OK):**

```
Welcome Buyer!
```

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/buyer \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.3.2 Get All Products (Buyer Browse)

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/products` |
| **HTTP Method** | `GET` |
| **Description** | Retrieves all products listed by all farmers. Buyers can browse all available products. |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Organic Rice",
    "description": "High-quality organic rice from Green Valley Farm",
    "price": 50.00,
    "quantity": 100,
    "category": "Grains",
    "farmerName": "John Farmer"
  },
  {
    "id": 2,
    "name": "Fresh Apples",
    "description": "Crisp and sweet apples from orchard",
    "price": 120.00,
    "quantity": 50,
    "category": "Fruits",
    "farmerName": "Sarah Farmer"
  }
]
```

> Returns empty array `[]` if no products exist.

> ⚠️ **Known Issue:** `BuyerProductController` directly uses `ProductRepository` instead of `ProductService`, breaking the layered architecture pattern. This will be refactored.

> ❌ **Missing Endpoints:** Product search by name and category filtering are **not exposed** through any buyer API endpoint, even though the logic exists in `ProductService` and `ProductRepository`.

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/buyer/products \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.3.3 Place Order

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/orders` |
| **HTTP Method** | `POST` |
| **Description** | Places an order for a product. The order is linked to the authenticated buyer, the product, and the product's farmer. Stock is validated and quantity is reduced upon successful order. |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

**Request Body:**

```json
{
  "productId": 1,
  "quantity": 5
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `productId` | Long | ✅ Yes | Cannot be null |
| `quantity` | Integer | ✅ Yes | Must be at least 1 |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "productId": 1,
  "productName": "Organic Rice",
  "buyerName": "Jane Buyer",
  "farmerName": "John Farmer",
  "quantity": 5,
  "totalPrice": 250.00,
  "status": "PENDING"
}
```

**Error Responses:**

- **400 Bad Request** — Validation errors
- **500 Internal Server Error** — Product not found, or "Insufficient product quantity"

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/buyer/orders \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 5
  }'
```

---

#### 3.3.4 Get My Orders (Buyer)

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/orders` |
| **HTTP Method** | `GET` |
| **Description** | Retrieves all orders placed by the logged-in buyer. |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "productId": 1,
    "productName": "Organic Rice",
    "buyerName": "Jane Buyer",
    "farmerName": "John Farmer",
    "quantity": 5,
    "totalPrice": 250.00,
    "status": "PENDING"
  },
  {
    "id": 2,
    "productId": 2,
    "productName": "Fresh Apples",
    "buyerName": "Jane Buyer",
    "farmerName": "Sarah Farmer",
    "quantity": 10,
    "totalPrice": 1200.00,
    "status": "ACCEPTED"
  }
]
```

> Returns empty array `[]` if the buyer has no orders.

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/buyer/orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

### 3.4 Admin APIs

#### 3.4.1 Admin Dashboard (Stub)

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin` |
| **HTTP Method** | `GET` |
| **Description** | Simple greeting endpoint to verify admin authentication works. Returns a plain text welcome message. This is a stub and the entire admin module needs to be built. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK):**

```
Welcome Admin!
```

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/admin \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

> ❌ **Missing Admin APIs:** There are currently NO implemented admin management endpoints. The following are needed:
> - View all users
> - Manage farmers
> - Manage buyers
> - View all products
> - View all orders
> - Verify farmers

---

### 3.5 System APIs

#### 3.5.1 Health Check / Test

| Property | Value |
|---|---|
| **Endpoint** | `/api/test` |
| **HTTP Method** | `GET` |
| **Description** | Simple health check endpoint to verify that JWT authentication is working correctly. Any authenticated user (any role) can access it. |
| **Authentication** | JWT required |
| **Required Role** | Any authenticated role (ADMIN, FARMER, or BUYER) |

**Success Response (200 OK):**

```
JWT Authentication is working!
```

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/test \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 4. Complete API Endpoint Summary

| # | Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | `POST` | `/api/auth/register` | Public | — | Register a new user |
| 2 | `POST` | `/api/auth/login` | Public | — | Login and get JWT token |
| 3 | `GET` | `/api/farmer` | JWT | FARMER | Farmer dashboard (stub) |
| 4 | `GET` | `/api/buyer` | JWT | BUYER | Buyer dashboard (stub) |
| 5 | `GET` | `/api/admin` | JWT | ADMIN | Admin dashboard (stub) |
| 6 | `POST` | `/api/farmer/profile` | JWT | FARMER | Create farmer profile |
| 7 | `POST` | `/api/farmer/products` | JWT | FARMER | Create a new product |
| 8 | `GET` | `/api/farmer/products/my-products` | JWT | FARMER | Get my products |
| 9 | `PUT` | `/api/farmer/products/{id}` | JWT | FARMER | Update my product |
| 10 | `DELETE` | `/api/farmer/products/{id}` | JWT | FARMER | Delete my product |
| 11 | `GET` | `/api/buyer/products` | JWT | BUYER | Browse all products |
| 12 | `POST` | `/api/buyer/orders` | JWT | BUYER | Place an order |
| 13 | `GET` | `/api/buyer/orders` | JWT | BUYER | Get my orders |
| 14 | `GET` | `/api/farmer/orders` | JWT | FARMER | Get received orders |
| 15 | `PUT` | `/api/farmer/orders/{orderId}/status` | JWT | FARMER | Update order status |
| 16 | `GET` | `/api/test` | JWT | Any | Health check / test |

**Total Implemented Endpoints: 16**

---

## 5. Request/Response DTO Schemas

### 5.1 RegisterRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ | NotBlank |
| `email` | String | ✅ | NotBlank, Email |
| `password` | String | ✅ | NotBlank |
| `role` | String (enum) | ❌ | Valid values: `ADMIN`, `FARMER`, `BUYER` |

### 5.2 LoginRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | String | ✅ | NotBlank, Email |
| `password` | String | ✅ | NotBlank |

### 5.3 LoginResponse

| Field | Type | Description |
|---|---|---|
| `message` | String | "Login successful" |
| `token` | String | JWT token |
| `email` | String | User's email |
| `role` | String | User's role |

### 5.4 FarmerProfileRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `farmName` | String | ✅ | NotBlank |
| `location` | String | ✅ | NotBlank |
| `landSize` | Double | ✅ | NotNull |
| `cultivationMethod` | String | ✅ | NotBlank |
| `cropsCultivated` | String | ✅ | NotBlank |
| `farmingType` | String | ✅ | NotBlank |

### 5.5 FarmerProfileResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Profile ID |
| `farmName` | String | Farm name |
| `location` | String | Location |
| `landSize` | Double | Land size |
| `cultivationMethod` | String | Cultivation method |
| `cropsCultivated` | String | Crops cultivated |
| `farmingType` | String | Farming type |

### 5.6 ProductRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ | NotBlank |
| `description` | String | ❌ | Optional |
| `price` | Double | ✅ | NotNull, Min(1) |
| `quantity` | Integer | ✅ | NotNull, Min(1) |
| `category` | String | ✅ | NotBlank |

### 5.7 ProductResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Product ID |
| `name` | String | Product name |
| `description` | String | Product description |
| `price` | Double | Product price |
| `quantity` | Integer | Available quantity |
| `category` | String | Product category |
| `farmerName` | String | Farmer's name |

### 5.8 OrderRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `productId` | Long | ✅ | NotNull |
| `quantity` | Integer | ✅ | NotNull, Min(1) |

### 5.9 OrderResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Order ID |
| `productId` | Long | Product ID |
| `productName` | String | Product name |
| `buyerName` | String | Buyer's name |
| `farmerName` | String | Farmer's name |
| `quantity` | Integer | Quantity ordered |
| `totalPrice` | Double | Total price |
| `status` | String | Order status |

### 5.10 OrderStatusRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `status` | String (enum) | ✅ | NotNull. Valid values: `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED` |

---

## 6. Planned APIs (Not Yet Implemented)

The following APIs are planned but **not yet implemented**. They are documented here for future reference.

### 6.1 Farmer Profile (Planned)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/farmer/profile` | Retrieve the logged-in farmer's profile |
| `PUT` | `/api/farmer/profile` | Update the logged-in farmer's profile |

### 6.2 Buyer Product Search & Filter (Planned)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buyer/products/search?name={name}` | Search products by name (logic exists in `ProductRepository` but no controller endpoint) |
| `GET` | `/api/buyer/products/category/{category}` | Filter products by category (logic exists in `ProductService` but no controller endpoint) |

### 6.3 Admin Management (Planned)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | View all registered users |
| `GET` | `/api/admin/farmers` | View all farmers |
| `GET` | `/api/admin/buyers` | View all buyers |
| `GET` | `/api/admin/products` | View all products |
| `GET` | `/api/admin/orders` | View all orders |
| `PUT` | `/api/admin/farmers/{id}/verify` | Verify a farmer's identity |

### 6.4 System (Planned)

| Method | Endpoint | Description |
|---|---|---|
| Various | `/v3/api-docs` | Swagger/OpenAPI documentation |
| Various | `/swagger-ui/**` | Swagger UI |

---

## 7. Error Response Format

### 7.1 Validation Errors (400 Bad Request)

When request validation fails (Jakarta `@Valid`), Spring Boot returns a default error structure:

```json
{
  "timestamp": "2026-07-28T12:00:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "path": "/api/auth/register"
}
```

> ⚠️ Currently there is **no global exception handler** (`@ControllerAdvice`), so:
> - Validation errors return Spring's default 400 response (field-specific errors are not shown)
> - Business logic errors (e.g., "Email already exists", "Invalid email or password") throw `RuntimeException` and return a 500 error with the exception message

### 7.2 Authentication Errors (401 Unauthorized)

```json
{
  "timestamp": "2026-07-28T12:00:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "path": "/api/farmer/products"
}
```

### 7.3 Authorization Errors (403 Forbidden)

```json
{
  "timestamp": "2026-07-28T12:00:00.000+00:00",
  "status": 403,
  "error": "Forbidden",
  "path": "/api/farmer/products"
}
```

---

## 8. Cross-Cutting Concerns

### 8.1 Security Configuration Summary

| Concern | Configuration |
|---|---|
| CSRF | Disabled (`.csrf(csrf -> csrf.disable())`) |
| Session Management | Stateless (no HTTP sessions) |
| Password Encoding | BCrypt (`BCryptPasswordEncoder`) |
| JWT Expiration | 1 hour from issuance |
| JWT Secret | Configured in `application.properties` (`jwt.secret`) |

### 8.2 Current Hardcoded Configuration

The following values are currently **hardcoded** in `application.properties` and should be moved to environment variables:

| Key | Current Value |
|---|---|
| `spring.datasource.password` | `Hari@1849` |
| `jwt.secret` | `FarmTrustSuperSecretKeyForJwtAuthentication2026Secure` |

---

*End of API Contract Document*
