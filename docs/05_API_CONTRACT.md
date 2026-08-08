# FarmBridge - API Contract

> **Document Version:** 1.3  
> **Last Updated:** 2026-08-06  
> **Framework:** TrainingMug ADF v1.0  
> **Status:** ✅ Based on actual source code inspection (Day 22 ADF compliance pass — [reports/ADFCompliance.md](reports/ADFCompliance.md))  
> **Day 16 update:** Added the Farmer Verification Workflow (submit / resubmit, approve, reject-with-reason, product gating, buyer visibility filtering) — [reports/FarmerVerification.md](reports/FarmerVerification.md).  
> **Day 17 update:** Added the Analytics module — 10 role-scoped dashboard endpoints with server-side aggregation (cards, charts and tables) for ADMIN, FARMER and BUYER dashboards. Revenue is defined as COMPLETED-order value — [reports/AnalyticsDashboard.md](reports/AnalyticsDashboard.md).  
> **Day 20 update:** Added the Email Notification System — admin announcements (send + history) and the optional `reason` on order status updates — [reports/EmailNotificationSystem.md](reports/EmailNotificationSystem.md).  
> **Day 21 update:** Added Enterprise Soft Delete — `DELETE /api/admin/users/{id}` / `/api/users/{id}` now deactivate (`active=false`) and `PUT .../reactivate` restores — [reports/SoftDelete.md](reports/SoftDelete.md).  
> **Day 22 update:** Full audit — every endpoint in the source code is now documented (74 total), including Reviews, Wishlist, Notifications, Password Reset, Product Images and category filtering.

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
| `403 Forbidden` | Missing, invalid, or expired JWT; authenticated but wrong role |
| `409 Conflict` | Duplicate / already-in-use (e.g. duplicate email, duplicate wishlist entry) |
| `500 Internal Server Error` | Server-side error (exception thrown) |

> **Note on missing / invalid / expired JWTs:** these currently return **403**
> (Spring Security's default entry point — no `AuthenticationEntryPoint` is
> configured). Returning **401** with a `WWW-Authenticate: Bearer` header is
> documented as a **Docker / Production hardening task** and is deliberately
> not implemented in this sprint.

> **Note:** A global exception handler (`@ControllerAdvice` via `GlobalExceptionHandler`) maps business errors and validation failures to structured `ErrorResponse` bodies — see [§7 Error Response Format](#7-error-response-format).

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
| **Description** | Creates a new user account. FARMER and BUYER roles only — ADMIN self-registration is blocked (400). |
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
| `role` | String (enum) | No | `FARMER` or `BUYER`. If omitted (or set to `ADMIN`), registration is rejected with **400** `"Only FARMER and BUYER accounts can be created through registration"` |

**Success Response (200 OK):**

```
User Registered Successfully
```

**Error Responses:**

- **400 Bad Request** — Validation errors (missing fields, invalid email), or role omitted / set to `ADMIN`
- **409 Conflict** — `"Email already exists"` when the email is already registered (structured `ErrorResponse` body)
- **500 Internal Server Error** — Other server errors

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

- **400 Bad Request** — Validation errors, or invalid email/password (identical `"Invalid email or password"` for unknown email and wrong password — no account enumeration)
- **403 Forbidden** — Account deactivated (soft delete): `"Your account has been deactivated…"`
- **500 Internal Server Error** — Other server errors

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

> ✅ **Implemented:** A duplicate profile check exists — creating a second profile for the same farmer throws `"Farmer profile already exists"`.

> ✅ **Implemented:** GET (retrieve profile) and PUT (update profile) endpoints are implemented — see rows 16–17 in the endpoint summary.

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

> **Stock behavior:** Placing an order deducts the product quantity immediately.
> Rejecting a `PENDING` order automatically **restores** the reserved quantity back to the product.
> Accepted and completed orders keep the deduction.

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

#### 3.2.9 Get My Verification Status

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/profile/verification` |
| **HTTP Method** | `GET` |
| **Description** | Returns the logged-in farmer's full verification profile, current status (`PENDING` / `APPROVED` / `REJECTED`), and the stored rejection reason when present. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Success Response (200 OK):** `FarmerVerificationResponse` (see §5.12).

**Error Responses:**

- **404 Not Found** — `"Farmer profile not found"` (no profile / no submission yet)

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/farmer/profile/verification \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.2.10 Submit / Resubmit Verification

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/profile/verification` |
| **HTTP Method** | `POST` |
| **Content-Type** | `multipart/form-data` |
| **Description** | Submits (or resubmits) the farmer's verification request: personal, farm and cultivation details plus the required documents. A resubmission resets the request to `PENDING` and keeps previously uploaded documents that are not replaced. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Form Fields (multipart):**

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | String | ✅ | NotBlank |
| `mobileNumber` | String | ✅ | Exactly 10 digits |
| `aadhaarNumber` | String | ❌ | Optional |
| `village` / `mandal` / `district` / `state` | String | ✅ | NotBlank |
| `farmName` / `farmAddress` | String | ✅ | NotBlank |
| `farmSize` | Double | ✅ | NotNull |
| `surveyNumber` | String | ❌ | Optional |
| `cultivationMethod` | String | ✅ | One of `ORGANIC`, `NATURAL`, `CHEMICAL`, `MIXED` |
| `mainCrops` / `farmingExperience` | String | ✅ | NotBlank |

**File Parts:**

| Part | Required | Description |
|---|---|---|
| `farmerPhoto` | ✅ (new submissions) | Farmer's photo (image, ≤ 5 MB) |
| `landCertificate` | ✅ (new submissions) | Land ownership certificate (image, ≤ 5 MB) |
| `farmPhoto` | ✅ (new submissions) | Farm photo (image, ≤ 5 MB) |
| `organicCertificate` | ❌ | Organic certificate (image, ≤ 5 MB) |

> On resubmission the three required documents may be omitted — the previously uploaded files are kept.

**Success Response (200 OK):** `FarmerVerificationResponse` with `verificationStatus: "PENDING"`.

**Error Responses:**

- **400 Bad Request** — `"Validation failed"` (bean validation) or missing document (`"Farmer photo is required"`) or non-image upload (`"Only image files (JPG, PNG, WEBP, GIF) are allowed"`)

**Sample cURL:**

```bash
curl -X POST http://localhost:8080/api/farmer/profile/verification \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "fullName=John Farmer" -F "mobileNumber=9876543210" \
  -F "village=Pedda" -F "mandal=Nizamabad" -F "district=Nizamabad" -F "state=Telangana" \
  -F "farmName=Green Valley Farm" -F "farmAddress=Survey 45" -F "farmSize=5.5" \
  -F "cultivationMethod=ORGANIC" -F "mainCrops=Rice, Chillies" -F "farmingExperience=10 years" \
  -F "farmerPhoto=@photo.png" -F "landCertificate=@land.png" -F "farmPhoto=@farm.png"
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

> ✅ **Category filtering is implemented** — see §3.11 (`GET /api/buyer/products/category/{category}`).
> ❌ **Remaining gap:** Product search by name is still **not exposed** as an endpoint (repository support exists) — see §6.1.

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

**Success Response (201 Created):**

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
- **500 Internal Server Error** — Product not found, "Insufficient product quantity", or "You cannot order your own product"

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

#### 3.4.1 Admin Dashboard (Greeting)

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin` |
| **HTTP Method** | `GET` |
| **Description** | Simple greeting endpoint to verify admin authentication works. Returns a plain text welcome message. |
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

---

#### 3.4.2 Get Dashboard Stats

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/stats` |
| **HTTP Method** | `GET` |
| **Description** | Returns platform-wide counts: total users, farmers, buyers, products, orders, and pending verifications. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK):**

```json
{
  "totalUsers": 50,
  "totalFarmers": 30,
  "totalBuyers": 19,
  "totalProducts": 45,
  "totalOrders": 120,
  "pendingVerifications": 3
}
```

| Field | Type | Description |
|---|---|---|
| `totalUsers` | Long | Total registered users |
| `totalFarmers` | Long | Users with FARMER role |
| `totalBuyers` | Long | Users with BUYER role |
| `totalProducts` | Long | Total product listings |
| `totalOrders` | Long | Total orders placed |
| `pendingVerifications` | Long | Farmer profiles not yet verified |

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/admin/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.4.3 Get All Users

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/users` |
| **HTTP Method** | `GET` |
| **Description** | Lists every registered user across all roles. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "John Farmer",
    "email": "john@farm.com",
    "role": "FARMER"
  }
]
```

**Sample cURL:**

```bash
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.4.4 Get User by ID

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/users/{id}` |
| **HTTP Method** | `GET` |
| **Description** | Fetches a single user by their ID. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Error Responses:**

- **404 Not Found** — "User not found with id: {id}"

---

#### 3.4.5 Update User

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/users/{id}` |
| **HTTP Method** | `PUT` |
| **Description** | Admin updates a user's name, email, or role. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Request Body:**

```json
{
  "name": "John Farmer",
  "email": "john@farm.com",
  "role": "FARMER"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ Yes | Cannot be blank |
| `email` | String | ✅ Yes | Valid email format |
| `role` | String (enum) | ✅ Yes | `ADMIN`, `FARMER`, or `BUYER` |

**Error Responses:**

- **404 Not Found** — "User not found with id: {id}"
- **409 Conflict** — "Email already in use: {email}"

---

#### 3.4.6 Delete User

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/users/{id}` |
| **HTTP Method** | `DELETE` |
| **Description** | Deletes a user account. Fails if the user has related records (products, orders, or profile). |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK):**

```
User deleted successfully
```

**Error Responses:**

- **404 Not Found** — "User not found with id: {id}"
- **400 Bad Request** — "Cannot delete this record because it has related data" (FK constraint)

---

#### 3.4.7 Get All Farmers

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/farmers` |
| **HTTP Method** | `GET` |
| **Description** | Lists all users with the FARMER role. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

---

#### 3.4.8 Get All Buyers

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/buyers` |
| **HTTP Method** | `GET` |
| **Description** | Lists all users with the BUYER role. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

---

#### 3.4.9 Get All Products (Admin)

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/products` |
| **HTTP Method** | `GET` |
| **Description** | Lists every product listed across the platform. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

---

#### 3.4.10 Get All Orders (Admin)

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/orders` |
| **HTTP Method** | `GET` |
| **Description** | Lists every order placed across the platform. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

---

#### 3.4.11 Get Unverified Farmers

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/farmers/unverified` |
| **HTTP Method** | `GET` |
| **Description** | Lists farmer profiles that have not been verified yet. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK):**

```json
[
  {
    "profileId": 3,
    "userId": 7,
    "farmerName": "Sarah Farmer",
    "email": "sarah@farm.com",
    "farmName": "Green Acres",
    "location": "Rural District",
    "verified": false
  }
]
```

---

#### 3.4.12 Verify Farmer

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/farmers/{profileId}/verify` |
| **HTTP Method** | `PUT` |
| **Description** | Marks a farmer profile as verified. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Path Variables:**

| Variable | Type | Description |
|---|---|---|
| `profileId` | Long | ID of the farmer profile to verify |

**Success Response (200 OK):** Same shape as `FarmerVerificationResponse` with `verified: true`.

**Error Responses:**

- **404 Not Found** — "Farmer profile not found"

**Sample cURL:**

```bash
curl -X PUT http://localhost:8080/api/admin/farmers/3/verify \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

#### 3.4.13 Reject Farmer Verification

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/farmers/{profileId}/reject` |
| **HTTP Method** | `PUT` |
| **Description** | Rejects a **pending** verification request. The mandatory reason is stored on the profile and shown to the farmer, who may then update and resubmit. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Request Body:**

```json
{
  "reason": "Land certificate is illegible — please re-upload"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | String | ✅ | NotBlank, max 1000 chars |

**Success Response (200 OK):** `FarmerVerificationResponse` with `verificationStatus: "REJECTED"` and the stored `rejectionReason`.

**Error Responses:**

- **400 Bad Request** — `"Validation failed"` (blank reason) or `"Only pending verification requests can be rejected"`
- **404 Not Found** — `"Farmer profile not found"`

**Sample cURL:**

```bash
curl -X PUT http://localhost:8080/api/admin/farmers/3/reject \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Land certificate is illegible — please re-upload"}'
```

---

### 3.6 Analytics APIs

Every analytics dashboard fetches its **full payload from a single endpoint**; the dedicated series endpoints (`revenue`, `orders`, `sales`, `spending`, `top-*`) support drill-down without additional dashboard calls. All values are computed server-side via grouped JPQL queries (`COUNT` / `SUM` / `AVG` / `GROUP BY YEAR·MONTH`) — the browser never computes numbers and no per-row lazy loading is used.

> **Revenue definition:** every `*Revenue` / `*Spending` value counts only **COMPLETED** orders (money actually earned). Order-value series (e.g. sales per month) include all statuses.

---

#### 3.6.1 Get Admin Analytics

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/analytics` |
| **HTTP Method** | `GET` |
| **Description** | Full admin dashboard payload: 13 cards, 6 chart series and 7 tables in one response. |
| **Authentication** | JWT required |
| **Required Role** | ADMIN |

**Success Response (200 OK)** — `AdminAnalyticsResponse` (see §5.14):

```json
{
  "totalUsers": 50, "totalFarmers": 30, "verifiedFarmers": 24,
  "pendingVerifications": 2, "buyers": 19, "products": 45,
  "orders": 120, "monthlyOrders": 14, "platformRevenue": 48500.0,
  "monthlyRevenue": 6200.0, "completedOrders": 80, "cancelledOrders": 12,
  "activeFarmers": 22,
  "revenuePerMonth": [ { "year": 2026, "month": 7, "value": 4100.0, "count": 9 } ],
  "ordersPerMonth": [ { "year": 2026, "month": 7, "value": 14.0, "count": 14 } ],
  "farmerRegistrations": [ { "year": 2026, "month": 7, "value": 3.0, "count": 3 } ],
  "productCategories": [ { "category": "Grains", "count": 18, "quantity": 0 } ],
  "orderStatus": [ { "status": "PENDING", "count": 28 } ],
  "topSellingCategories": [ { "category": "Grains", "count": 40, "quantity": 320 } ],
  "latestOrders": [ { "id": 120, "productName": "Rice", "buyerName": "Jane", "farmerName": "John", "quantity": 2, "totalPrice": 100.0, "status": "PENDING", "createdAt": "2026-08-05T10:00:00" } ],
  "latestFarmers": [ { "id": 7, "name": "Sarah Farmer", "email": "sarah@farm.com", "role": "FARMER" } ],
  "pendingVerificationList": [ { "profileId": 3, "farmName": "Green Acres", "verificationStatus": "PENDING", "...": "..." } ],
  "topBuyers": [ { "userId": 5, "name": "Jane", "email": "jane@mail.com", "orderCount": 22, "totalAmount": 15600.0 } ],
  "topFarmers": [ { "userId": 2, "name": "John", "email": "john@farm.com", "orderCount": 60, "totalAmount": 41000.0 } ],
  "topProducts": [ { "productId": 1, "productName": "Rice", "category": "Grains", "quantity": 340, "revenue": 17000.0 } ],
  "lowStockProducts": [ { "id": 9, "name": "Wheat", "category": "Grains", "quantity": 3, "price": 40.0, "farmerName": "John" } ],
  "latestReviews": [ { "id": 4, "productName": "Rice", "buyerName": "Jane", "rating": 5, "comment": "Great!", "createdAt": "2026-08-05T09:00:00" } ]
}
```

---

#### 3.6.2 Admin Revenue / Orders Per Month

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/analytics/revenue` | Monthly COMPLETED-order revenue series `[MonthlyMetric]` |
| `GET` | `/api/admin/analytics/orders` | Monthly order-count series `[MonthlyMetric]` |

**Role:** ADMIN · **Authentication:** JWT

---

#### 3.6.3 Admin Top-* Lists

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/top-products` | Top products by total ordered quantity — `[ProductMetric]` |
| `GET` | `/api/admin/top-farmers` | Top farmers by total order value — `[UserMetric]` |
| `GET` | `/api/admin/top-buyers` | Top buyers by total order value — `[UserMetric]` |

**Role:** ADMIN · **Authentication:** JWT

---

#### 3.6.4 Get Farmer Analytics

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/analytics` |
| **HTTP Method** | `GET` |
| **Description** | Full farmer dashboard payload: 11 cards, 6 chart series and 5 sections — scoped to the logged-in farmer only. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

**Success Response (200 OK)** — `FarmerAnalyticsResponse` (see §5.15):

```json
{
  "todayOrders": 2, "pendingOrders": 1, "acceptedOrders": 2,
  "completedOrders": 9, "rejectedOrders": 1, "monthlyRevenue": 3200.0,
  "totalRevenue": 18400.0, "products": 5, "averageRating": 4.6,
  "reviews": 12, "customers": 6,
  "revenueTrend": [ { "year": 2026, "month": 7, "value": 3200.0, "count": 9 } ],
  "ordersTrend": [ { "year": 2026, "month": 7, "value": 4400.0, "count": 13 } ],
  "salesPerProduct": [ { "productId": 1, "productName": "Rice", "category": "Grains", "quantity": 340, "revenue": 17000.0 } ],
  "salesPerMonth": [ { "year": 2026, "month": 7, "value": 4400.0, "count": 13 } ],
  "ratingTrend": [ { "year": 2026, "month": 7, "value": 4.6, "count": 12 } ],
  "categorySales": [ { "category": "Grains", "count": 60, "quantity": 340 } ],
  "bestSellingProduct": { "productId": 1, "productName": "Rice", "category": "Grains", "quantity": 340, "revenue": 17000.0 },
  "lowStockProducts": [ { "id": 9, "name": "Wheat", "category": "Grains", "quantity": 3, "price": 40.0, "farmerName": "John" } ],
  "recentReviews": [ { "id": 4, "productName": "Rice", "buyerName": "Jane", "rating": 5, "comment": "Great!", "createdAt": "2026-08-05T09:00:00" } ],
  "recentOrders": [ { "id": 120, "productName": "Rice", "buyerName": "Jane", "farmerName": "John", "quantity": 2, "totalPrice": 100.0, "status": "PENDING", "createdAt": "2026-08-05T10:00:00" } ],
  "topCustomers": [ { "userId": 5, "name": "Jane", "email": "jane@mail.com", "orderCount": 9, "totalAmount": 4300.0 } ]
}
```

---

#### 3.6.5 Farmer Sales Per Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/analytics/sales` |
| **HTTP Method** | `GET` |
| **Description** | Sales of the logged-in farmer's products ranked by quantity — `[ProductMetric]`. |
| **Authentication** | JWT required |
| **Required Role** | FARMER |

---

#### 3.6.6 Get Buyer Analytics

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/analytics` |
| **HTTP Method** | `GET` |
| **Description** | Full buyer dashboard payload: 8 cards, 3 chart series and 4 sections (recommendations, latest orders, favourite farmers; recently-viewed is tracked client-side). |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

**Success Response (200 OK)** — `BuyerAnalyticsResponse` (see §5.16):

```json
{
  "orders": 4, "wishlist": 2, "reviews": 1, "moneySpent": 1250.0,
  "favoriteCategory": "Grains", "purchasedProducts": 3,
  "pendingOrders": 1, "completedOrders": 3,
  "monthlySpending": [ { "year": 2026, "month": 7, "value": 1250.0, "count": 4 } ],
  "purchasesByCategory": [ { "category": "Grains", "count": 4, "quantity": 9 } ],
  "ordersTimeline": [ { "year": 2026, "month": 7, "value": 4.0, "count": 4 } ],
  "recommendedProducts": [ /* ProductResponse[] — in-stock, APPROVED-farmer products; favourite category first with marketplace fallback, excludes already-ordered (max 6) */ ],
  "latestOrders": [ { "id": 120, "productName": "Rice", "buyerName": "Jane", "farmerName": "John", "quantity": 2, "totalPrice": 100.0, "status": "PENDING", "createdAt": "2026-08-05T10:00:00" } ],
  "favoriteFarmers": [ { "userId": 2, "name": "John", "email": "john@farm.com", "orderCount": 4, "totalAmount": 1250.0 } ]
}
```

---

#### 3.6.7 Buyer Monthly Spending

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/analytics/spending` |
| **HTTP Method** | `GET` |
| **Description** | Monthly COMPLETED-order spending series of the logged-in buyer — `[MonthlyMetric]`. |
| **Authentication** | JWT required |
| **Required Role** | BUYER |

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

### 3.7 Reviews & Ratings

#### 3.7.1 Submit a Review

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/products/{productId}/reviews` |
| **HTTP Method** | `POST` |
| **Description** | Buyer reviews a product they purchased (their order for it is `ACCEPTED` or `COMPLETED`). One review per buyer per product — a duplicate returns an error. |
| **Authentication** | JWT required · Role BUYER |

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Excellent quality rice!"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `rating` | Integer | ✅ | Must be 1–5 |
| `comment` | String | ❌ | Optional, max 1000 chars |

**Success (201 Created):** `ReviewResponse` (see §5.19).

**Errors:** 400 validation / not purchased · 409 duplicate review · 404 product not found.

---

#### 3.7.2 Get Reviews of a Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/products/{productId}/reviews` | `GET` |
| **Description** | All reviews for a product, newest first. |
| **Authentication** | JWT required · Role BUYER |

**Success (200 OK):** `[ReviewResponse]` (empty array when none).

---

#### 3.7.3 Get My Review of a Product

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/products/{productId}/reviews/mine` | `GET` |
| **Description** | The logged-in buyer's own review of the product; empty body if they have not reviewed it. |
| **Authentication** | JWT required · Role BUYER |

---

#### 3.7.4 Update My Review

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/reviews/{reviewId}` |
| **HTTP Method** | `PUT` |
| **Description** | Buyer edits their own review. Only the author can update. |
| **Authentication** | JWT required · Role BUYER |

**Request body:** same as 3.7.1. **Errors:** 400 validation · 403 not the author · 404 not found.

---

#### 3.7.5 Delete My Review

| Property | Value |
|---|---|
| **Endpoint** | `/api/buyer/reviews/{reviewId}` |
| **HTTP Method** | `DELETE` |
| **Description** | Buyer deletes their own review. |
| **Authentication** | JWT required · Role BUYER |

**Success:** `"Review deleted successfully"` · **Errors:** 403 not the author · 404 not found.

---

#### 3.7.6 Get Reviews of My Product (Farmer)

| Property | Value |
|---|---|
| **Endpoint** | `/api/farmer/products/{productId}/reviews` |
| **HTTP Method** | `GET` |
| **Description** | Reviews for one of the farmer's own products. Only the product owner can view. |
| **Authentication** | JWT required · Role FARMER |

**Success:** `[ReviewResponse]` · **Errors:** 403 not the owner · 404 product not found.

---

### 3.8 Wishlist

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/buyer/wishlist/{productId}` | Add a product to the wishlist → **201** `WishlistResponse`; duplicate → 409; missing product → 404 | JWT · BUYER |
| `DELETE` | `/api/buyer/wishlist/{productId}` | Remove from wishlist (idempotent) → `"Product removed from wishlist"` | JWT · BUYER |
| `GET` | `/api/buyer/wishlist` | List the buyer's saved products (newest first) → `[ProductResponse]` | JWT · BUYER |
| `GET` | `/api/buyer/wishlist/check/{productId}` | `true`/`false` whether the product is wishlisted | JWT · BUYER |

**Example — add:** `POST /api/buyer/wishlist/1` → **201**

```json
{
  "id": 4,
  "productId": 1,
  "productName": "Organic Rice",
  "buyerName": "Jane Buyer",
  "createdAt": "2026-08-05T10:00:00"
}
```

---

### 3.9 Notifications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | All notifications of the logged-in user, newest first → `[NotificationResponse]` | JWT · any role |
| `GET` | `/api/notifications/unread` | Only unread notifications → `[NotificationResponse]` | JWT · any role |
| `GET` | `/api/notifications/unread/count` | Unread count (badge) → number | JWT · any role |
| `PUT` | `/api/notifications/{id}/read` | Mark one notification as read → `NotificationResponse` (403 if another user's, 404 if missing) | JWT · any role |
| `PUT` | `/api/notifications/read-all` | Mark all as read → number marked | JWT · any role |
| `DELETE` | `/api/notifications/{id}` | Delete one notification → `"Notification deleted successfully"` | JWT · any role |
| `DELETE` | `/api/notifications` | Delete all of the user's notifications → number deleted | JWT · any role |

**Example notification:**

```json
{
  "id": 12,
  "title": "New Order",
  "message": "Jane Buyer placed an order for Organic Rice",
  "type": "NEW_ORDER",
  "isRead": false,
  "referenceId": 1,
  "createdAt": "2026-08-05T10:00:00"
}
```

---

### 3.10 Password Reset

#### 3.10.1 Forgot Password

| Property | Value |
|---|---|
| **Endpoint** | `/api/auth/forgot-password` | `POST` · **Public** |
| **Description** | Sends an HTML reset link if the email exists. Always returns the same generic response whether or not the email exists (enumeration-safe). Inactive accounts receive the identical response and no token. |

**Request:**

```json
{
  "email": "john@farm.com"
}
```

**Success (200 OK):** `"Password reset link sent to your email if the account exists."`
**Errors:** 400 invalid email format.

---

#### 3.10.2 Reset Password

| Property | Value |
|---|---|
| **Endpoint** | `/api/auth/reset-password` | `POST` · **Public** |
| **Description** | Validates the token (exists, unexpired, unused) and updates the password with BCrypt. The token is then consumed (cannot be reused). |

**Request:**

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "newPassword": "NewSecurePassword123"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `token` | String | ✅ | NotBlank |
| `newPassword` | String | ✅ | Min 6 chars |

**Success (200 OK):** `"Password reset successfully"` · **Errors:** 400 invalid/expired/used token or short password.

---

### 3.11 Product Details, Category & Images

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/buyer/products/{id}` | Full product details (buyer view) — seller farm info, rating breakdown, verified flag; 404 when the seller is not APPROVED | JWT · BUYER |
| `GET` | `/api/buyer/products/category/{category}` | Products in a category, case-insensitive (related products) → `[ProductResponse]` | JWT · BUYER |
| `GET` | `/api/farmer/products/{id}` | A farmer fetches one of their own products by ID | JWT · FARMER |
| `POST` | `/api/farmer/products/{id}/image` | Upload/replace product image. `multipart/form-data`, part name `file` (JPG/PNG/WEBP/GIF ≤ 5 MB). Owner only → updated `ProductResponse` | JWT · FARMER |
| `DELETE` | `/api/farmer/products/{id}/image` | Remove the product image → updated `ProductResponse` | JWT · FARMER |

**Example — category filter:** `GET /api/buyer/products/category/Grains` →

```json
[
  {
    "id": 1, "name": "Organic Rice", "price": 50.0, "quantity": 100,
    "category": "Grains", "farmerName": "John Farmer",
    "imageUrl": "/uploads/products/abc.png", "farmerVerified": true,
    "averageRating": 4.5, "reviewCount": 8
  }
]
```

---

### 3.12 Announcements

#### 3.12.1 Send Announcement

| Property | Value |
|---|---|
| **Endpoint** | `/api/admin/announcements` | `POST` |
| **Description** | Emails every user matching the audience (`ALL` / `BUYERS` / `FARMERS`). A delivery failure for one recipient never stops the rest; the announcement is stored in history. |
| **Authentication** | JWT required · Role ADMIN |

**Request Body:**

```json
{
  "audience": "FARMERS",
  "subject": "New harvest season update",
  "message": "<p>Dear farmers, please update your crop listings.</p>",
  "buttonText": "Visit Dashboard",
  "buttonUrl": "https://farmbridge.app/farmer/dashboard"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `audience` | String (enum) | ✅ | `ALL`, `BUYERS`, or `FARMERS` |
| `subject` | String | ✅ | NotBlank, max 255 |
| `message` | String | ✅ | NotBlank, max 5000 |
| `buttonText` | String | ❌ | Optional |
| `buttonUrl` | String | ❌ | Must match `^https?://` when present |

**Success (200 OK):** `AnnouncementResponse` (id, audience, subject, message, buttonText, buttonUrl, sentBy, recipientCount, createdAt).
**Errors:** 400 validation (e.g. `javascript:` URL rejected).

---

#### 3.12.2 Get Announcement History

| **Endpoint** | `/api/admin/announcements` | `GET` |
|---|---|---|
| **Description** | Every announcement sent, newest first → `[AnnouncementResponse]`. |
| **Authentication** | JWT required · Role ADMIN |

---

### 3.13 Soft Delete & Reactivate

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `DELETE` | `/api/admin/users/{id}` | **Soft delete** — sets `active=false`. The record and all historical data are preserved. Guards: an admin cannot deactivate their own account; the last active ADMIN can never be deactivated (400). → `"User deactivated successfully"` | JWT · ADMIN |
| `PUT` | `/api/admin/users/{id}/reactivate` | Sets `active=true`, restoring login and full access → `"User activated successfully"` | JWT · ADMIN |
| `DELETE` | `/api/users/{id}` | Same soft-delete contract via the User module | JWT · ADMIN |
| `PUT` | `/api/users/{id}/reactivate` | Same reactivate contract via the User module | JWT · ADMIN |

**Errors (both routes):** 400 self-deactivation / last-active-admin · 404 user not found.

---

## 4. Complete API Endpoint Summary

| # | Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | `POST` | `/api/auth/register` | Public | — | Register a new user |
| 2 | `POST` | `/api/auth/login` | Public | — | Login and get JWT token |
| 3 | `POST` | `/api/auth/forgot-password` | Public | — | Request a password reset email |
| 4 | `POST` | `/api/auth/reset-password` | Public | — | Reset password with token |
| 5 | `GET` | `/api/farmer` | JWT | FARMER | Farmer dashboard (stub) |
| 6 | `GET` | `/api/buyer` | JWT | BUYER | Buyer dashboard (stub) |
| 7 | `GET` | `/api/admin` | JWT | ADMIN | Admin dashboard (stub) |
| 8 | `POST` | `/api/farmer/profile` | JWT | FARMER | Create farmer profile |
| 9 | `GET` | `/api/farmer/profile` | JWT | FARMER | Get my farmer profile |
| 10 | `PUT` | `/api/farmer/profile` | JWT | FARMER | Update my farmer profile |
| 11 | `GET` | `/api/farmer/profile/verification` | JWT | FARMER | Get my verification status |
| 12 | `POST` | `/api/farmer/profile/verification` | JWT | FARMER | Submit / resubmit verification (multipart) |
| 13 | `POST` | `/api/farmer/products` | JWT | FARMER | Create a new product (201 Created) |
| 14 | `GET` | `/api/farmer/products/my-products` | JWT | FARMER | Get my products |
| 15 | `GET` | `/api/farmer/products/{id}` | JWT | FARMER | Get one of my products |
| 16 | `PUT` | `/api/farmer/products/{id}` | JWT | FARMER | Update my product |
| 17 | `DELETE` | `/api/farmer/products/{id}` | JWT | FARMER | Delete my product |
| 18 | `POST` | `/api/farmer/products/{id}/image` | JWT | FARMER | Upload / replace product image (multipart) |
| 19 | `DELETE` | `/api/farmer/products/{id}/image` | JWT | FARMER | Delete product image |
| 20 | `GET` | `/api/buyer/products` | JWT | BUYER | Browse all products |
| 21 | `GET` | `/api/buyer/products/{id}` | JWT | BUYER | Product details (buyer view) |
| 22 | `GET` | `/api/buyer/products/category/{category}` | JWT | BUYER | Filter products by category |
| 23 | `POST` | `/api/buyer/orders` | JWT | BUYER | Place an order (201 Created) |
| 24 | `GET` | `/api/buyer/orders` | JWT | BUYER | Get my orders |
| 25 | `GET` | `/api/farmer/orders` | JWT | FARMER | Get received orders |
| 26 | `PUT` | `/api/farmer/orders/{orderId}/status` | JWT | FARMER | Update order status |
| 27 | `POST` | `/api/buyer/wishlist/{productId}` | JWT | BUYER | Add to wishlist (201 Created) |
| 28 | `DELETE` | `/api/buyer/wishlist/{productId}` | JWT | BUYER | Remove from wishlist |
| 29 | `GET` | `/api/buyer/wishlist` | JWT | BUYER | Get my wishlist |
| 30 | `GET` | `/api/buyer/wishlist/check/{productId}` | JWT | BUYER | Check if a product is wishlisted |
| 31 | `POST` | `/api/buyer/products/{productId}/reviews` | JWT | BUYER | Submit a review (201 Created) |
| 32 | `GET` | `/api/buyer/products/{productId}/reviews` | JWT | BUYER | Get product reviews |
| 33 | `GET` | `/api/buyer/products/{productId}/reviews/mine` | JWT | BUYER | Get my review of a product |
| 34 | `PUT` | `/api/buyer/reviews/{reviewId}` | JWT | BUYER | Update my review |
| 35 | `DELETE` | `/api/buyer/reviews/{reviewId}` | JWT | BUYER | Delete my review |
| 36 | `GET` | `/api/farmer/products/{productId}/reviews` | JWT | FARMER | Get reviews of my product |
| 37 | `GET` | `/api/notifications` | JWT | Any | Get my notifications |
| 38 | `GET` | `/api/notifications/unread` | JWT | Any | Get unread notifications |
| 39 | `GET` | `/api/notifications/unread/count` | JWT | Any | Get unread count |
| 40 | `PUT` | `/api/notifications/{id}/read` | JWT | Any | Mark one notification as read |
| 41 | `PUT` | `/api/notifications/read-all` | JWT | Any | Mark all notifications as read |
| 42 | `DELETE` | `/api/notifications/{id}` | JWT | Any | Delete one notification |
| 43 | `DELETE` | `/api/notifications` | JWT | Any | Clear all notifications |
| 44 | `GET` | `/api/admin/stats` | JWT | ADMIN | Get dashboard stats |
| 45 | `GET` | `/api/admin/users` | JWT | ADMIN | Get all users |
| 46 | `GET` | `/api/admin/users/{id}` | JWT | ADMIN | Get user by ID |
| 47 | `PUT` | `/api/admin/users/{id}` | JWT | ADMIN | Update user |
| 48 | `DELETE` | `/api/admin/users/{id}` | JWT | ADMIN | Deactivate user (soft delete) |
| 49 | `PUT` | `/api/admin/users/{id}/reactivate` | JWT | ADMIN | Reactivate user |
| 50 | `GET` | `/api/admin/farmers` | JWT | ADMIN | Get all farmers |
| 51 | `GET` | `/api/admin/buyers` | JWT | ADMIN | Get all buyers |
| 52 | `GET` | `/api/admin/products` | JWT | ADMIN | Get all products (unfiltered) |
| 53 | `GET` | `/api/admin/orders` | JWT | ADMIN | Get all orders |
| 54 | `GET` | `/api/admin/farmers/unverified` | JWT | ADMIN | Get unverified farmers (PENDING) |
| 55 | `PUT` | `/api/admin/farmers/{profileId}/verify` | JWT | ADMIN | Approve farmer verification |
| 56 | `PUT` | `/api/admin/farmers/{profileId}/reject` | JWT | ADMIN | Reject verification with reason |
| 57 | `POST` | `/api/admin/announcements` | JWT | ADMIN | Send announcement email |
| 58 | `GET` | `/api/admin/announcements` | JWT | ADMIN | Get announcement history |
| 59 | `GET` | `/api/users` | JWT | ADMIN | Get all users (User module) |
| 60 | `GET` | `/api/users/{id}` | JWT | ADMIN | Get user by ID (User module) |
| 61 | `PUT` | `/api/users/{id}` | JWT | ADMIN | Update user (User module) |
| 62 | `DELETE` | `/api/users/{id}` | JWT | ADMIN | Deactivate user (soft delete, User module) |
| 63 | `PUT` | `/api/users/{id}/reactivate` | JWT | ADMIN | Reactivate user (User module) |
| 64 | `GET` | `/api/admin/analytics` | JWT | ADMIN | Full admin analytics dashboard |
| 65 | `GET` | `/api/admin/analytics/revenue` | JWT | ADMIN | Revenue per month series |
| 66 | `GET` | `/api/admin/analytics/orders` | JWT | ADMIN | Orders per month series |
| 67 | `GET` | `/api/admin/top-products` | JWT | ADMIN | Top selling products |
| 68 | `GET` | `/api/admin/top-farmers` | JWT | ADMIN | Top farmers by order value |
| 69 | `GET` | `/api/admin/top-buyers` | JWT | ADMIN | Top buyers by order value |
| 70 | `GET` | `/api/farmer/analytics` | JWT | FARMER | Full farmer analytics dashboard |
| 71 | `GET` | `/api/farmer/analytics/sales` | JWT | FARMER | Sales per product |
| 72 | `GET` | `/api/buyer/analytics` | JWT | BUYER | Full buyer analytics dashboard |
| 73 | `GET` | `/api/buyer/analytics/spending` | JWT | BUYER | Monthly spending series |
| 74 | `GET` | `/api/test` | JWT | Any | Health check / test |

**Total Implemented Endpoints: 74** (audited against controllers on 2026-08-06)

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
| `reason` | String | ❌ | Optional (Day 20) — flows into the rejection email when rejecting an order; max 500 chars |

### 5.11 FarmerVerificationRequest (multipart form fields)

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | String | ✅ | NotBlank |
| `mobileNumber` | String | ✅ | Pattern `^[0-9]{10}$` |
| `aadhaarNumber` | String | ❌ | Optional |
| `village`, `mandal`, `district`, `state` | String | ✅ | NotBlank |
| `farmName`, `farmAddress` | String | ✅ | NotBlank |
| `farmSize` | Double | ✅ | NotNull |
| `surveyNumber` | String | ❌ | Optional |
| `cultivationMethod` | String | ✅ | Pattern `^(ORGANIC|NATURAL|CHEMICAL|MIXED)$` |
| `mainCrops`, `farmingExperience` | String | ✅ | NotBlank |

### 5.12 FarmerVerificationResponse

| Field | Type | Description |
|---|---|---|
| `profileId` | Long | Profile ID |
| `userId` | Long | Linked user ID |
| `farmerName`, `email` | String | Account name / email |
| `fullName`, `mobileNumber`, `aadhaarNumber` | String | Personal info |
| `village`, `mandal`, `district`, `state` | String | Address parts |
| `farmName`, `location`, `farmAddress`, `farmSize`, `surveyNumber` | String/Double | Farm info |
| `cultivationMethod`, `mainCrops`, `farmingExperience` | String | Cultivation info |
| `farmerPhotoUrl`, `landCertificateUrl`, `farmPhotoUrl`, `organicCertificateUrl` | String | Public `/uploads/...` document URLs |
| `verified` | Boolean | True only when `APPROVED` |
| `verificationStatus` | String | `PENDING`, `APPROVED`, or `REJECTED` |
| `rejectionReason` | String | Stored admin reason (only when rejected) |
| `submittedAt` | String (ISO datetime) | Submission timestamp |

### 5.13 RejectVerificationRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | String | ✅ | NotBlank, max 1000 chars |

### 5.14 AdminAnalyticsResponse

| Field | Type | Description |
|---|---|---|
| `totalUsers`, `totalFarmers`, `verifiedFarmers`, `pendingVerifications`, `buyers`, `products`, `orders`, `monthlyOrders`, `completedOrders`, `cancelledOrders`, `activeFarmers` | Long | Stat cards |
| `platformRevenue`, `monthlyRevenue` | Double | COMPLETED-order revenue (all-time / current month) |
| `revenuePerMonth`, `ordersPerMonth`, `farmerRegistrations` | `MonthlyMetric[]` | Monthly series (`value` + `count`) |
| `productCategories`, `topSellingCategories` | `CategoryMetric[]` | Category breakdowns |
| `orderStatus` | `StatusMetric[]` | Per-status counts |
| `latestOrders` | `OrderMetric[]` | Latest 5 orders (joined names) |
| `latestFarmers` | `UserResponse[]` | Latest 5 farmer accounts |
| `pendingVerificationList` | `FarmerVerificationResponse[]` | Latest 5 pending requests |
| `topBuyers`, `topFarmers` | `UserMetric[]` | Top 5 by order value |
| `topProducts` | `ProductMetric[]` | Top 5 by quantity |
| `lowStockProducts` | `LowStockProduct[]` | Quantity ≤ 5, ascending |
| `latestReviews` | `ReviewMetric[]` | Latest 5 reviews |

### 5.15 FarmerAnalyticsResponse

| Field | Type | Description |
|---|---|---|
| `todayOrders`, `pendingOrders`, `acceptedOrders`, `completedOrders`, `rejectedOrders`, `products`, `reviews`, `customers` | Long | Stat cards (customers = distinct buyers) |
| `monthlyRevenue`, `totalRevenue` | Double | COMPLETED-order revenue (current month / all-time) |
| `averageRating` | Double | Average rating of the farmer's products (1 decimal) |
| `revenueTrend`, `ordersTrend`, `salesPerMonth`, `ratingTrend` | `MonthlyMetric[]` | Monthly series |
| `salesPerProduct` | `ProductMetric[]` | Quantity + revenue per product |
| `categorySales` | `CategoryMetric[]` | Quantity per category |
| `bestSellingProduct` | `ProductMetric` | Top product by quantity (null when no sales) |
| `lowStockProducts` | `LowStockProduct[]` | Farmer's own low-stock products |
| `recentReviews` | `ReviewMetric[]` | Latest 5 reviews of the farmer's products |
| `recentOrders` | `OrderMetric[]` | Latest 5 orders received |
| `topCustomers` | `UserMetric[]` | Top 5 customers by spend |

### 5.16 BuyerAnalyticsResponse

| Field | Type | Description |
|---|---|---|
| `orders`, `wishlist`, `reviews`, `purchasedProducts`, `pendingOrders`, `completedOrders` | Long | Stat cards |
| `moneySpent` | Double | COMPLETED-order spend |
| `favoriteCategory` | String | Most-purchased category (null when no orders) |
| `monthlySpending`, `ordersTimeline` | `MonthlyMetric[]` | Monthly series |
| `purchasesByCategory` | `CategoryMetric[]` | Quantity per category |
| `recommendedProducts` | `ProductResponse[]` | In-stock products of APPROVED (active) farmers — favourite category first, topped up from the rest of the marketplace; excludes already-ordered products; capped at 6 |
| `latestOrders` | `OrderMetric[]` | Latest 5 orders |
| `favoriteFarmers` | `UserMetric[]` | Top 5 farmers by spend |

### 5.17 ReviewRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `rating` | Integer | ✅ | NotNull, Min(1), Max(5) |
| `comment` | String | ❌ | Max 1000 chars |

### 5.18 ReviewResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Review ID |
| `productId` | Long | Reviewed product |
| `productName` | String | Product name |
| `buyerName` | String | Reviewer name |
| `rating` | Integer | 1–5 stars |
| `comment` | String | Optional text |
| `createdAt`, `updatedAt` | String (ISO datetime) | Timestamps |

### 5.19 WishlistResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Wishlist row ID |
| `productId` | Long | Saved product |
| `productName` | String | Product name |
| `buyerName` | String | Buyer name |
| `createdAt` | String (ISO datetime) | When saved |

### 5.20 NotificationResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Notification ID |
| `title` | String | Short title |
| `message` | String | Full message |
| `type` | String | `NEW_ORDER`, `ORDER_ACCEPTED`, `ORDER_REJECTED`, `ORDER_COMPLETED`, `ADMIN_MESSAGE` |
| `isRead` | Boolean | Read state |
| `referenceId` | Long | Related record id (e.g. order) |
| `createdAt` | String (ISO datetime) | Created time |

### 5.21 ForgotPasswordRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | String | ✅ | NotBlank, Email |

### 5.22 ResetPasswordRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `token` | String | ✅ | NotBlank |
| `newPassword` | String | ✅ | NotBlank, Min(6) |

### 5.23 AnnouncementRequest

| Field | Type | Required | Validation |
|---|---|---|---|
| `audience` | String (enum) | ✅ | `ALL`, `BUYERS`, or `FARMERS` |
| `subject` | String | ✅ | NotBlank, max 255 |
| `message` | String | ✅ | NotBlank, max 5000 |
| `buttonText` | String | ❌ | Optional |
| `buttonUrl` | String | ❌ | Pattern `^https?://` |

### 5.24 AnnouncementResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | Announcement ID |
| `audience` | String | `ALL` / `BUYERS` / `FARMERS` |
| `subject` | String | Subject |
| `message` | String | Body |
| `buttonText`, `buttonUrl` | String | Optional CTA |
| `sentBy` | String | Admin email |
| `recipientCount` | Integer | Addressed recipients |
| `createdAt` | String (ISO datetime) | Sent time |

### 5.25 UserResponse

| Field | Type | Description |
|---|---|---|
| `id` | Long | User ID |
| `name` | String | Name |
| `email` | String | Email |
| `role` | String | `ADMIN`/`FARMER`/`BUYER` |
| `active` | Boolean | Soft-delete status (`true` = active) |

> **ProductResponse** (used by browse/details/wishlist/category) additionally exposes `imageUrl`, `farmName`, `location`, `farmerVerified`, `averageRating`, `reviewCount`, and `fiveStarCount`…`oneStarCount` — see §3.11 example.

---

### 5.26 Analytics metric DTOs

| DTO | Fields | Used by |
|---|---|---|
| `MonthlyMetric` | `year` int, `month` int, `value` double, `count` long | All monthly series |
| `CategoryMetric` | `category` String, `count` long, `quantity` double | Category charts |
| `StatusMetric` | `status` String, `count` long | Order-status donut |
| `ProductMetric` | `productId`, `productName`, `category`, `quantity` double, `revenue` double | Top products / sales per product |
| `UserMetric` | `userId`, `name`, `email`, `orderCount` long, `totalAmount` double | Top buyers / farmers / customers |
| `OrderMetric` | `id`, `productName`, `buyerName`, `farmerName`, `quantity`, `totalPrice`, `status`, `createdAt` | Latest-orders tables |
| `ReviewMetric` | `id`, `productName`, `buyerName`, `rating`, `comment`, `createdAt` | Latest-reviews tables |
| `LowStockProduct` | `id`, `name`, `category`, `quantity`, `price`, `farmerName` | Low-stock tables |

---

## 6. Remaining Planned APIs

Almost every API is implemented (74 endpoints — see §4). The only remaining gap:

### 6.1 Buyer Product Search by Name (Not Yet Implemented)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buyer/products/search?name={name}` | Search products by name. Repository support exists (`ProductRepository.findByNameContainingIgnoreCase()`) but no controller endpoint exposes it yet. |

> ✅ Category filtering **is** implemented — `GET /api/buyer/products/category/{category}` (see §3.11).

### 6.2 Tooling (Implemented)

| Tool | Location | Status |
|---|---|---|
| Swagger UI | `/swagger-ui` (backend :8080) | ✅ Implemented |
| OpenAPI JSON | `/v3/api-docs` | ✅ Implemented |
| Postman collection | `docs/FarmBridge_API.postman_collection.json` (41 requests) | ✅ |

> **Cross-reference:** the interactive Swagger UI is the canonical, live API
> reference; this document is the human-maintained contract. Keep the two in
> sync when endpoints change.

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

> ✅ **Implemented:** `GlobalExceptionHandler` (`@RestControllerAdvice`) handles:
> - `MethodArgumentNotValidException` → 400 with field-specific error map
> - `RuntimeException` → status mapped from the message (403 for "not been verified" and "deactivated", 404 for "not found", 409 for "already exists"/"already in use", else 400)
> - `DataIntegrityViolationException` → 400 with a friendly message
> - `NoResourceFoundException` → 404 (missing static files, e.g. deleted product images)
> - Any other exception → 500 with a generic message

**Business-level 403 (verification gate):** until a farmer's profile is `APPROVED`, product mutations (`POST/PUT/DELETE /api/farmer/products/**`) and order actions (`POST /api/buyer/orders`, `PUT /api/farmer/orders/{id}/status`) return **403** with `"Your farmer account has not been verified yet."`

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

### 8.2 Configuration Sources

**Environment variables (already in use):** SMTP (MAIL_HOST / MAIL_PORT /
MAIL_USERNAME / MAIL_PASSWORD), `APP_BASE_URL`, `APP_RESET_PASSWORD_URL`,
`APP_SUPPORT_EMAIL` — nothing sensitive for email is hardcoded.

**Still hardcoded in `application.properties` (local dev):**

| Key | Current Value | Recommendation |
|---|---|---|
| `spring.datasource.password` | `Hari@1849` | Move to `DB_PASSWORD` env var (planned for the Docker phase) |
| `jwt.secret` | `FarmTrustSuperSecretKeyForJwtAuthentication2026Secure` | Move to `JWT_SECRET` env var (planned for the Docker phase) |

> These will be converted to `${DB_PASSWORD:}` / `${JWT_SECRET:}` placeholders as part of Phase 12 (Docker & deployment).

---

*End of API Contract Document*
