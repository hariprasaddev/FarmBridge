# FarmBridge API Documentation

FarmBridge is a full-stack digital marketplace that connects farmers directly
with buyers. This document describes every REST endpoint exposed by the
backend.

## Base URL

```
http://localhost:8080
```

## Authentication

Most endpoints require a **Bearer JWT** obtained from `POST /api/auth/login`.

```
Authorization: Bearer <token>
```

- Tokens expire after **1 hour**.
- Roles: `FARMER`, `BUYER`, `ADMIN`.
- Public endpoints (no token): Register, Login, Forgot Password, Reset Password.
- On a 401 the client should re-authenticate.

## Interactive Docs

| Resource | URL |
|---|---|
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

## Postman

A complete Postman collection is available at
`docs/FarmBridge_API.postman_collection.json` (with
`docs/FarmBridge_Environment.postman_environment.json`). Import both into
Postman, run **Login** to auto-capture the JWT into the `token` variable, then
call any protected endpoint.

---

## Common Responses

Errors use a consistent shape:

```json
{
  "status": 400,
  "message": "Human readable message",
  "errors": { "field": "validation message" },
  "timestamp": "2026-08-04T10:00:00.000+00:00"
}
```

| HTTP | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation / business rule failure |
| 401 | Missing / invalid token |
| 403 | Authenticated but not allowed |
| 404 | Resource not found |
| 409 | Duplicate / conflict |
| 500 | Unexpected server error |

---

# 1. Authentication

### POST /api/auth/register — *Public*
Register a new `FARMER` or `BUYER` account.

```json
{ "name": "John Farmer", "email": "john@example.com", "password": "Password123!", "role": "FARMER" }
```

**Response 200:** `"User Registered Successfully"` · 409 on duplicate email · 400 if role is `ADMIN`.

### POST /api/auth/login — *Public*
Authenticate and receive a JWT.

```json
{ "email": "john@example.com", "password": "Password123!" }
```

**Response 200:**
```json
{ "message": "Login successful", "token": "<jwt>", "email": "john@example.com", "role": "FARMER" }
```
400 on invalid credentials.

### POST /api/auth/forgot-password — *Public*
Request a password reset link. Response is identical whether or not the email exists.

```json
{ "email": "john@example.com" }
```

**Response 200:** `"If the email exists, a password reset link has been sent."`

### POST /api/auth/reset-password — *Public*
Reset the password with a valid, unused, unexpired token (15-minute expiry).

```json
{ "token": "<uuid>", "newPassword": "NewPassword123!" }
```

**Response 200:** `"Password reset successful."` · 400 for invalid/expired/used token or weak password.

---

# 2. Admin *(Bearer — role ADMIN)*

### GET /api/admin/stats
Dashboard counts. **Response 200:**
```json
{ "totalUsers": 10, "totalFarmers": 4, "totalBuyers": 5, "totalProducts": 20, "totalOrders": 8, "pendingVerifications": 1 }
```

### GET /api/admin/users · GET /api/admin/users/{id}
List / fetch users. **200:** `[ { "id":1, "name":"...", "email":"...", "role":"FARMER" } ]`

### PUT /api/admin/users/{id}
Update a user.
```json
{ "name": "John Farmer", "email": "john@example.com", "role": "FARMER" }
```
**200:** updated user · 409 if email already in use.

### DELETE /api/admin/users/{id}
Delete a user (fails with 400 if the user has related records).

### GET /api/admin/farmers · GET /api/admin/buyers
Role-filtered user lists.

### GET /api/admin/products · GET /api/admin/orders
Platform-wide product and order lists.

### GET /api/admin/farmers/unverified
List farmer profiles awaiting verification.

### PUT /api/admin/farmers/{profileId}/verify
Mark a farmer profile as verified. **200:** verification response.

---

# 3. Farmer *(Bearer — role FARMER)*

### Products

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/farmer/products` | `{ "name", "description", "price", "quantity", "category" }` | 201 product |
| GET | `/api/farmer/products/my-products` | — | 200 list |
| GET | `/api/farmer/products/{id}` | — | 200 product / 404 |
| PUT | `/api/farmer/products/{id}` | full product object | 200 product |
| DELETE | `/api/farmer/products/{id}` | — | 200 message |
| POST | `/api/farmer/products/{id}/image` | `multipart/form-data` file (JPG/PNG/WEBP/GIF, ≤5 MB) | 200 product |
| DELETE | `/api/farmer/products/{id}/image` | — | 200 product |

Only the owning farmer can update/delete/upload for their products (403 otherwise).

### Orders

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/farmer/orders` | — | 200 list of orders received |
| PUT | `/api/farmer/orders/{orderId}/status` | `{ "status": "ACCEPTED" \| "REJECTED" \| "COMPLETED" }` | 200 order |

State machine: `PENDING → ACCEPTED/REJECTED`, `ACCEPTED → COMPLETED`. Rejecting restores stock.

### Profile

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/farmer/profile` | — | 200 profile / 404 |
| POST | `/api/farmer/profile` | `{ "farmName", "location", "landSize", "cultivationMethod", "cropsCultivated", "farmingType" }` | 200 profile |
| PUT | `/api/farmer/profile` | same as create | 200 profile |

### Reviews

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/farmer/products/{productId}/reviews` | 200 reviews of the farmer's own product |

---

# 4. Buyer *(Bearer — role BUYER)*

### Products

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/buyer/products` | 200 list (with rating stats) |
| GET | `/api/buyer/products/{id}` | 200 product + seller farm info / 404 |
| GET | `/api/buyer/products/category/{category}` | 200 list filtered by category |

### Orders

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/buyer/orders` | `{ "productId": 1, "quantity": 2 }` | 201 order |
| GET | `/api/buyer/orders` | — | 200 list of my orders |

### Reviews

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/buyer/products/{productId}/reviews` | — | 200 list (newest first) |
| GET | `/api/buyer/products/{productId}/reviews/mine` | — | 200 my review or empty body |
| POST | `/api/buyer/products/{productId}/reviews` | `{ "rating": 1-5, "comment": "..." }` | 201 review |
| PUT | `/api/buyer/reviews/{reviewId}` | `{ "rating", "comment" }` | 200 review |
| DELETE | `/api/buyer/reviews/{reviewId}` | — | 200 message |

Reviewing requires a purchased order (`ACCEPTED` or `COMPLETED`); one review per buyer per product; only the author can edit/delete.

### Wishlist

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/buyer/wishlist` | 200 products, newest first |
| POST | `/api/buyer/wishlist/{productId}` | 201 entry / 409 duplicate |
| DELETE | `/api/buyer/wishlist/{productId}` | 200 message (idempotent) |
| GET | `/api/buyer/wishlist/check/{productId}` | 200 `true`/`false` |

---

# 5. Notifications *(Bearer — any authenticated user)*

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/notifications` | 200 list, newest first |
| GET | `/api/notifications/unread` | 200 unread list |
| GET | `/api/notifications/unread/count` | 200 count |
| PUT | `/api/notifications/{id}/read` | 200 notification |
| PUT | `/api/notifications/read-all` | 200 message |
| DELETE | `/api/notifications/{id}` | 200 message |
| DELETE | `/api/notifications` | 200 message |

Users only ever see their own notifications (404 unknown id, 403 another user's notification).

---

# 6. Common — User Management *(Bearer — role ADMIN)*

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/users` | — | 200 list |
| GET | `/api/users/{id}` | — | 200 user / 404 |
| PUT | `/api/users/{id}` | `{ "name", "email", "role" }` | 200 user |
| DELETE | `/api/users/{id}` | — | 200 message |

---

# 7. Analytics Dashboards — *(Bearer, role-scoped)*

Single-payload dashboard endpoints — each dashboard loads everything it needs
with **one** request (no fan-out of 20 calls). Revenue is defined as the value
of **COMPLETED** orders only; order *counts* include every status.

## Admin — `/api/admin/analytics` *(role ADMIN)*

| Endpoint | Response |
|---|---|
| `GET /api/admin/analytics` | `AdminAnalyticsResponse` — full dashboard payload |
| `GET /api/admin/analytics/revenue` | `List<MonthlyMetric>` — revenue per month (line chart) |
| `GET /api/admin/analytics/orders` | `List<MonthlyMetric>` — orders per month (bar chart) |
| `GET /api/admin/top-products` | `List<ProductMetric>` — top sellers (value + qty + count) |
| `GET /api/admin/top-farmers` | `List<UserMetric>` — top farmers by revenue |
| `GET /api/admin/top-buyers` | `List<UserMetric>` — top buyers by spend |

`AdminAnalyticsResponse` fields:

| Field | Meaning |
|---|---|
| `totalUsers`, `totalFarmers`, `verifiedFarmers`, `pendingVerification`, `totalBuyers` | account counts |
| `totalProducts`, `totalOrders`, `monthlyOrders` | catalogue & order counts (monthly = current month) |
| `platformRevenue`, `monthlyRevenue` | revenue (COMPLETED orders) |
| `completedOrders`, `cancelledOrders`, `activeFarmers` | status & activity counts |
| `revenuePerMonth`, `ordersPerMonth`, `farmerRegistrations` | chart series (`MonthlyMetric`) |
| `productCategories` | pie chart (`CategoryMetric`) |
| `orderStatus` | donut chart (`StatusMetric`) |
| `topSellingCategories` | horizontal bar (`CategoryMetric` by revenue) |
| `latestOrders` | `List<OrderMetric>` |
| `latestFarmers` | `List<UserResponse>` |
| `pendingVerificationList` | `List<FarmerVerificationResponse>` |
| `topBuyers`, `topFarmers`, `topProducts` | `List<UserMetric>` / `List<ProductMetric>` |
| `lowStockProducts` | `List<LowStockProduct>` (≤ 10 units) |
| `latestReviews` | `List<ReviewMetric>` |

## Farmer — `/api/farmer/analytics` *(role FARMER)*

| Endpoint | Response |
|---|---|
| `GET /api/farmer/analytics` | `FarmerAnalyticsResponse` — full dashboard payload |
| `GET /api/farmer/analytics/sales` | `List<ProductMetric>` — sales per product |

`FarmerAnalyticsResponse` fields: `todayOrders`, `pendingOrders`, `acceptedOrders`,
`completedOrders`, `rejectedOrders`, `monthlyRevenue`, `totalRevenue`, `products`,
`averageRating`, `reviews`, `customers`, `revenueTrend`, `ordersTrend`,
`salesPerProduct`, `salesPerMonth`, `ratingTrend`, `categorySales`,
`bestSellingProduct`, `lowStockProducts`, `recentReviews`, `recentOrders`,
`topCustomers`, `verified` (bool).

## Buyer — `/api/buyer/analytics` *(role BUYER)*

| Endpoint | Response |
|---|---|
| `GET /api/buyer/analytics` | `BuyerAnalyticsResponse` — full dashboard payload |
| `GET /api/buyer/analytics/spending` | `List<MonthlyMetric>` — monthly spend series |

`BuyerAnalyticsResponse` fields: `orders`, `wishlist`, `reviews`, `moneySpent`,
`favoriteCategory`, `purchasedProducts`, `pendingOrders`, `completedOrders`,
`monthlySpending`, `purchasesByCategory`, `ordersTimeline`,
`recentlyViewed`, `recommendedProducts`, `latestOrders`, `favoriteFarmers`.

**Authorization matrix** (all verified by integration tests):

| Endpoint | ADMIN | FARMER | BUYER |
|---|---|---|---|
| `/api/admin/analytics*`, `/api/admin/top-*` | ✅ | 403 | 403 |
| `/api/farmer/analytics*` | 403 | ✅ | 403 |
| `/api/buyer/analytics*` | 403 | 403 | ✅ |

---

## Environment Variables

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

> The current `application.properties` reads mail settings and the reset URL
> from these variables (with safe defaults). For production, the database
> credentials and JWT secret should also be moved to environment variables.
