# FarmBridge - UI Flow Document

> **Document Version:** 1.0  
> **Last Updated:** 2026-07-29  
> **Framework:** TrainingMug ADF v1.0  
> **Status:** ✅ Based on actual backend APIs (34 implemented) and requirements/docs 01–05

---

## 1. Introduction

This document defines the UI flow, screen layouts, navigation structure, and
component hierarchy for the **FarmBridge React frontend**. It serves as the
blueprint for implementing the UI layer that consumes the existing Spring Boot
REST APIs.

All features described herein are derived from the current backend
implementation and the documented requirements (docs 01–05). Any UI feature
whose backend API does **not** yet exist is explicitly marked as
**⚠️ Planned**.

### 1.1 Design Principles

- **Role-based views:** The UI adapts based on the authenticated user's role
  (ADMIN, FARMER, BUYER).
- **JWT-first:** All protected pages require a valid JWT stored in
  `localStorage` or `sessionStorage`.
- **Mobile-responsive:** The layout must be usable on both desktop and mobile
  viewports (minimum target: 320 px width).
- **Progressive disclosure:** Complex actions (create/edit product, place
  order) use modals or dedicated pages rather than inline forms.

---

## 2. Authentication Flow

### 2.1 Entry Points

The application has two public (unauthenticated) entry points:

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Existing user sign-in |
| Register | `/register` | New user sign-up |

All other routes redirect to `/login` when no valid JWT exists.

### 2.2 Registration Flow

```
User opens /
├── Clicks "Register"
│
✔ Registration page at /register
│
├── User fills: name, email, password, role (FARMER | BUYER)
│   (ADMIN role is not presented — admins are created manually)
│
├── POST /api/auth/register
│
├── Success → Navigate to /login with success toast "Registration successful"
│
└── Error
    ├── "Email already exists" → Show inline error on email field
    └── Validation errors → Show inline field-level messages
```

**Backend API used:** `POST /api/auth/register` (✅ Implemented)

### 2.3 Login Flow

```
Login page at /login
│
├── User fills: email, password
│
├── POST /api/auth/login
│
├── Success
│   ├── Store JWT, email, and role in localStorage
│   ├── Redirect to role-based dashboard:
│   │   ├── FARMER → /farmer/dashboard
│   │   ├── BUYER  → /buyer/products
│   │   └── ADMIN  → /admin/dashboard
│   └── Show success toast
│
└── Error ("Invalid email or password")
    └── Show inline error message above the form
```

**Backend API used:** `POST /api/auth/login` (✅ Implemented)

### 2.4 Logout Flow

```
Any authenticated page
│
├── User clicks "Logout" (in navigation header)
├── Clear JWT and user data from localStorage
├── Redirect to /login
└── Show toast "Logged out successfully"
```

### 2.5 JWT Expiry Handling

- Before each API call, check if the stored JWT is expired (decode `exp`
  claim client-side).
- On 401 response → clear localStorage and redirect to `/login`.
- Show toast "Session expired, please log in again."

---

## 3. Navigation Flow

### 3.1 Unauthenticated Navigation

```
Anonymous User
├── /login
│   └── Link to /register
└── /register
    └── Link to /login
```

### 3.2 Farmer Navigation

```
Farmer (after login)
├── Header
│   ├── App logo / name → /farmer/dashboard
│   ├── Navigation links
│   │   ├── Dashboard          → /farmer/dashboard
│   │   ├── My Products        → /farmer/products
│   │   ├── Orders Received    → /farmer/orders
│   │   └── My Profile         → /farmer/profile          ⚠️ Planned
│   └── User dropdown
│       ├── Profile settings   → /farmer/profile          ⚠️ Planned
│       └── Logout
│
└── Footer (optional)
    ├── App copyright
    └── Contact / support link
```

### 3.3 Buyer Navigation

```
Buyer (after login)
├── Header
│   ├── App logo / name → /buyer/products
│   ├── Navigation links
│   │   ├── Browse Products   → /buyer/products
│   │   ├── My Orders         → /buyer/orders
│   │   └── Search Products   → /buyer/products?search=   ⚠️ Planned
│   └── User dropdown
│       ├── Profile           → /buyer/profile            ⚠️ Planned
│       └── Logout
│
└── Footer (optional)
```

### 3.4 Admin Navigation

```
Admin (after login)
├── Header
│   ├── App logo / name → /admin/dashboard
│   ├── Navigation links
│   │   ├── Dashboard        → /admin/dashboard          ✅ Implemented
│   │   ├── Manage Users     → /admin/users              ✅ Implemented
│   │   ├── All Products     → /admin/products           ✅ Implemented
│   │   ├── All Orders       → /admin/orders             ✅ Implemented
│   │   └── Farmer Verification → /admin/verification    ✅ Implemented
│   └── User dropdown
│       └── Logout
│
└── Footer (optional)
```

---

## 4. Screen / Page List

| # | Page | Route | Role | Backend API Status | Description |
|---|---|---|---|---|---|
| 1 | Login | `/login` | Public | ✅ Implemented | Email + password authentication |
| 2 | Register | `/register` | Public | ✅ Implemented | Create new account (FARMER / BUYER) |
| 3 | Farmer Dashboard | `/farmer/dashboard` | FARMER | ✅ Stub | Overview with stats and shortcuts |
| 4 | My Products | `/farmer/products` | FARMER | ✅ Implemented | CRUD for farmer's own products |
| 5 | Create Product | `/farmer/products/new` | FARMER | ✅ Implemented | Form to add a new product |
| 6 | Edit Product | `/farmer/products/:id/edit` | FARMER | ✅ Implemented | Form to edit existing product |
| 7 | Orders Received | `/farmer/orders` | FARMER | ✅ Implemented | List of received orders with status actions |
| 8 | Farmer Profile | `/farmer/profile` | FARMER | ⚠️ Planned | View / update farmer profile |
| 9 | Browse Products | `/buyer/products` | BUYER | ✅ Implemented | All products with search/filter |
| 10 | Product Detail | `/buyer/products/:id` | BUYER | ⚠️ Partial (no dedicated API) | Single product view + place order (data extracted from list) |
| 11 | Place Order | `/buyer/orders/new` | BUYER | ✅ Implemented | Order form (modal or page) |
| 12 | My Orders | `/buyer/orders` | BUYER | ✅ Implemented | Order history with status tracking |
| 13 | Admin Dashboard | `/admin/dashboard` | ADMIN | ✅ Implemented | Admin overview and KPIs (from `GET /api/admin/stats`) |
| 14 | Manage Users | `/admin/users` | ADMIN | ✅ Implemented | View, edit, and delete all users |
| 15 | All Products | `/admin/products` | ADMIN | ✅ Implemented | View all products across platform |
| 16 | All Orders | `/admin/orders` | ADMIN | ✅ Implemented | View all orders across platform |
| 17 | Farmer Verification | `/admin/verification` | ADMIN | ✅ Implemented | Verify farmer identities |
| 18 | Health / Test | `/test` | Any Auth | ✅ Implemented | Simple JWT verification page |

---

## 5. Dashboard Layouts

### 5.1 Farmer Dashboard Layout (`/farmer/dashboard`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Logo]  Dashboard | My Products | Orders | Profile  │ [User ▼]
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Products   │  │   Orders    │  │   Profile   │          │
│  │   Listed: 12 │  │  Pending: 3 │  │   Status:   │          │
│  │              │  │  Accepted:2 │  │  Not Set    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌───────────────────────────────────────────────┐            │
│  │  Recent Orders (Last 5)                        │            │
│  │  ┌──────┬────────────┬────────┬────────┬─────┐ │            │
│  │  │  #   │  Product   │ Buyer  │ Amount │Status│ │            │
│  │  ├──────┼────────────┼────────┼────────┼─────┤ │            │
│  │  │  101 │ Organic    │ Jane   │ ₹250   │ PEND│ │            │
│  │  │  102 │ Fresh      │ Mark   │ ₹120   │ ACCP│ │            │
│  │  └──────┴────────────┴────────┴────────┴─────┘ │            │
│  └───────────────────────────────────────────────┘            │
│                                                              │
│  Quick Actions: [+ Add Product] [View All Orders]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> ⚠️ **Note:** The dashboard stub (`GET /api/farmer`) returns plain text
> "Welcome Farmer!" — the UI should **ignore** this endpoint rather than parse
> it as JSON. The stat cards (Products Listed, Orders Pending) are fully
> achievable by client-side aggregation of `GET /api/farmer/products/my-products`
> and `GET /api/farmer/orders`, so they can be **implemented** in the frontend
> without awaiting a new backend endpoint.

### 5.2 Buyer Dashboard Layout (`/buyer/products`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Logo]  Browse Products | My Orders                 │ [User ▼]
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Search Bar: [🔍 Search products...]                         │ ⚠️ Planned
│                                                              │
│  Category Filter: [All] [Grains] [Fruits] [Vegetables] ...   │ ⚠️ Planned
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Organic Rice │  │  Fresh Wheat │  │  Red Apples  │       │
│  │  ₹50/kg       │  │  ₹35/kg      │  │  ₹120/kg     │       │
│  │  Qty: 100     │  │  Qty: 200    │  │  Qty: 50     │       │
│  │  Farmer: John │  │  Farmer:John │  │  Farmer:Sarah│       │
│  │  [Buy Now]    │  │  [Buy Now]   │  │  [Buy Now]   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Fresh Milk  │  │  Green Veg   │  │  Honey       │       │
│  │  ₹60/L       │  │  ₹40/kg      │  │  ₹250/kg     │       │
│  │  Qty: 30     │  │  Qty: 75     │  │  Qty: 20     │       │
│  │  Farmer:Sarah│  │  Farmer:John │  │  Farmer:Sarah│       │
│  │  [Buy Now]   │  │  [Buy Now]   │  │  [Buy Now]   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> ⚠️ Search bar and category filter chips are **Planned** — the backend
> repository and service support these features, but no controller endpoint
> exposes them yet.

### 5.3 Admin Dashboard Layout (`/admin/dashboard`) — Implemented

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Logo]  Dashboard | Users | Products | Orders | Verif│ [User ▼]
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │  Total    │  │  Farmers  │  │  Buyers   │  │  Orders   ││
│  │  Users:50 │  │  30       │  │  20       │  │  45       ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                              │
│  Recent Activity Feed                                         │
│  ┌─────────────────────────────────────────────────┐         │
│  │ • New farmer registered: Green Valley Farm      │         │
│  │ • Order #105 marked as COMPLETED                │         │
│  │ • New product: Organic Honey by Sarah           │         │
│  │ • Buyer Jane Doe placed order #106              │         │
│  └─────────────────────────────────────────────────┘         │
│                                                              │
│  Pending Verifications: [3 farmers awaiting review]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> ✅ Admin dashboard is **Implemented** — KPI cards are populated from
> `GET /api/admin/stats` (total users, farmers, buyers, products, orders,
> pending verifications).

---

## 6. User Journeys

### 6.1 Farmer User Journey

#### Step 1: Registration & Login

```
Farmer visits `/register`
├── Selects role "FARMER"
├── Fills name, email, password
├── Clicks "Create Account"
├── Redirected to `/login`
├── Fills credentials
├── Clicks "Login"
├── JWT stored
└── Redirected to `/farmer/dashboard`
```

#### Step 2: Create Farmer Profile

```
Farmer clicks "My Profile" → `/farmer/profile`      ⚠️ Planned
├── Sees "No profile yet" message
├── Clicks "Create Profile"
├── Fills form: farm name, location, land size,
│   cultivation method, crops cultivated, farming type
├── POST /api/farmer/profile
├── Success → Profile displayed
└── Error → Inline validation messages
```

> ⚠️ Only `POST /api/farmer/profile` exists. **GET and PUT for profile
> are Planned.** The current UI can show a one-time create form only.

#### Step 3: Add Products

```
Farmer clicks "My Products" → `/farmer/products`
├── Sees empty state "No products yet"
├── Clicks "Add Product"
├── Fills: name, description (optional), price,
│   quantity, category
├── POST /api/farmer/products
├── Success → Product appears in list
└── Error → Inline validation
```

#### Step 4: Manage Products

```
Farmer on `/farmer/products`
├── Sees product cards/table with all listed products
│
├── Edit: Clicks "Edit" on a product card
│   ├── Pre-filled form at `/farmer/products/:id/edit`
│   ├── Updates fields
│   ├── PUT /api/farmer/products/:id
│   └── Product updated in list
│
└── Delete: Clicks "Delete"
    ├── Confirmation dialog "Are you sure?"
    ├── DELETE /api/farmer/products/:id
    └── Product removed from list
```

#### Step 5: Manage Orders

```
Farmer clicks "Orders Received" → `/farmer/orders`
├── Sees table of orders with columns:
│   Order #, Product, Buyer, Qty, Total, Status, Actions
│
├── PENDING order:
│   ├── Actions: [Accept] [Reject]
│   ├── Accept  → PUT /api/farmer/orders/:id/status {status: "ACCEPTED"}
│   ├── Reject  → PUT /api/farmer/orders/:id/status {status: "REJECTED"}
│   └── Status updates in real-time
│
└── ACCEPTED order:
    ├── Action: [Mark Completed]
    ├── PUT /api/farmer/orders/:id/status {status: "COMPLETED"}
    └── Status updates
```

> All order management APIs are ✅ Implemented.

### 6.2 Buyer User Journey

#### Step 1: Registration & Login

```
Buyer visits `/register`
├── Selects role "BUYER"
├── Fills name, email, password
├── Clicks "Create Account"
├── Redirected to `/login`
├── Fills credentials
├── Clicks "Login"
├── JWT stored
└── Redirected to `/buyer/products`
```

#### Step 2: Browse Products

```
Buyer on `/buyer/products`
├── Sees grid of all product cards (image placeholder, name,
│   price, quantity, farmer name)
├── GET /api/buyer/products → Array of ProductResponse
├── Optional: Search by name   ⚠️ Planned (no controller endpoint)
├── Optional: Filter by category  ⚠️ Planned (no controller endpoint)
└── Clicks on a product card to view details
```

#### Step 3: Place Order

```
Buyer on product detail or from product card
├── Clicks "Buy Now" or "Place Order"
├── Modal or page with:
│   ├── Product summary (name, price, available quantity)
│   ├── Quantity input (validated against stock)
│   ├── Calculated total price displayed
│   └── [Place Order] button
│
├── POST /api/buyer/orders {productId, quantity}
├── Success
│   ├── Order confirmation toast
│   ├── Stock decremented
│   └── Redirect to `/buyer/orders` or show confirmation
│
└── Error "Insufficient product quantity"
    └── Show error on quantity field
```

#### Step 4: Track Orders

```
Buyer on `/buyer/orders`
├── Sees table of all orders
│   Order #, Product, Farmer, Qty, Total, Status
│
├── Status badges with color coding:
│   ├── PENDING    → Yellow/Orange
│   ├── ACCEPTED   → Blue
│   ├── REJECTED   → Red
│   └── COMPLETED  → Green
│
└── Auto-refresh or pull-to-refresh for status updates
```

### 6.3 Admin User Journey — Implemented

```
Admin logs in → /admin/dashboard      ✅ Implemented
├── Overview stats (total users, farmers, buyers, orders,
│   products, pending verifications) from GET /api/admin/stats
│
├── Manage Users `/admin/users`          ✅ Implemented
│   ├── Table of all users
│   ├── Filter by role
│   └── Actions: Edit (modal), Delete
│
├── All Products `/admin/products`       ✅ Implemented
│   ├── Table of all products
│   └── Category, price, quantity, farmer columns
│
├── All Orders `/admin/orders`           ✅ Implemented
│   ├── Table of all orders
│   └── Filter by status
│
└── Farmer Verification                  ✅ Implemented
    `/admin/verification`
    ├── List of unverified farmers
    └── [Verify] button per farmer
```

---

## 7. Component Hierarchy

The following is the planned React component tree.

### 7.1 Shared / Common Components

```
App
├── AuthProvider (context: JWT, user info, role)
│   └── Router
│       ├── PublicRoute (redirects if authenticated)
│       │   ├── LoginPage
│       │   └── RegisterPage
│       │
│       └── ProtectedRoute (redirects if not authenticated)
│           ├── AppLayout
│           │   ├── Navbar
│           │   │   ├── Logo
│           │   │   ├── NavLinks (role-based)
│           │   │   └── UserMenu (dropdown with logout)
│           │   ├── PageHeader (title, breadcrumbs, actions)
│           │   ├── MainContent (renders child route)
│           │   └── Footer
│           │
│           ├── FarmerRoutes
│           │   ├── FarmerDashboardPage
│           │   │   ├── StatCard (reusable)
│           │   │   └── RecentOrdersTable
│           │   ├── FarmerProductsPage
│           │   │   ├── ProductCard
│           │   │   ├── ProductTable
│           │   │   └── EmptyState
│           │   ├── ProductFormPage (create/edit)
│           │   └── FarmerOrdersPage
│           │       ├── OrderTable
│           │       └── OrderStatusBadge
│           │
│           ├── BuyerRoutes
│           │   ├── BuyerProductsPage
│           │   │   ├── ProductGrid
│           │   │   ├── ProductCard
│           │   │   ├── SearchBar          ⚠️ Planned
│           │   │   └── CategoryFilter    ⚠️ Planned
│           │   ├── ProductDetailPage
│           │   │   ├── ProductInfo
│           │   │   ├── OrderForm / BuyNowModal
│           │   │   └── PriceCalculator
│           │   └── BuyerOrdersPage
│           │       ├── OrderTable
│           │       └── OrderStatusBadge
│           │
│           └── AdminRoutes              ✅ Implemented
│               ├── AdminDashboardPage    ✅ Implemented
│               ├── UsersPage             ✅ Implemented
│               ├── AdminProductsPage     ✅ Implemented
│               ├── AdminOrdersPage       ✅ Implemented
│               └── VerificationPage      ✅ Implemented
```

### 7.2 Reusable UI Components

| Component | Props | Used By |
|---|---|---|
| `StatCard` | `title`, `value`, `icon`, `color` | Dashboard pages |
| `ProductCard` | `product` (ProductResponse) | Buyer Browse, Farmer Products |
| `ProductTable` | `products[]`, `onEdit`, `onDelete` | Farmer Products |
| `OrderTable` | `orders[]`, `onStatusChange` | Farmer Orders, Buyer Orders |
| `OrderStatusBadge` | `status` (PENDING\|ACCEPTED\|REJECTED\|COMPLETED) | All order tables |
| `SearchBar` | `onSearch`, `placeholder` | Buyer Products ⚠️ Planned |
| `CategoryFilter` | `categories[]`, `selected`, `onChange` | Buyer Products ⚠️ Planned |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Confirm delete, place order |
| `Toast` | `message`, `type` (success\|error\|info) | Global |
| `EmptyState` | `title`, `description`, `actionLabel`, `onAction` | Product/order lists |
| `ConfirmDialog` | `message`, `onConfirm`, `onCancel` | Delete actions |
| `LoadingSpinner` | — | Loading states |
| `ErrorBoundary` | — | Route-level error catching |
| `Pagination` | `page`, `totalPages`, `onPageChange` | Large data sets |

---

## 8. API-to-UI Mapping

This table maps each **implemented** backend API to its corresponding UI
element.

| # | Backend API | Method | UI Page / Component | UI Action |
|---|---|---|---|---|
| 1 | `/api/auth/register` | POST | Register Page | Submit registration form |
| 2 | `/api/auth/login` | POST | Login Page | Submit login form |
| 3 | `GET /api/farmer` | GET | Farmer Dashboard | **Stub** — returns plain text; do not parse as JSON. Use `/api/farmer/products/my-products` and `/api/farmer/orders` for stat aggregation instead |
| 4 | `GET /api/buyer` | GET | Buyer Dashboard | **Stub** — currently redirects to products |
| 5 | `GET /api/admin/stats` | GET | Admin Dashboard | KPI stat cards (users, farmers, buyers, products, orders, pending verifications) |
| 6 | `POST /api/farmer/profile` | POST | Farmer Profile Page | Create profile form |
| 7 | `POST /api/farmer/products` | POST | Create Product Page | Create product form |
| 8 | `GET /api/farmer/products/my-products` | GET | My Products Page | List all farmer's products |
| 9 | `PUT /api/farmer/products/{id}` | PUT | Edit Product Page | Update product form |
| 10 | `DELETE /api/farmer/products/{id}` | DELETE | My Products Page | Delete button + confirm |
| 11 | `GET /api/buyer/products` | GET | Browse Products Page | Product grid/cards |
| 12 | `POST /api/buyer/orders` | POST | Place Order | Order form/modal |
| 13 | `GET /api/buyer/orders` | GET | My Orders Page | Order history table |
| 14 | `GET /api/farmer/orders` | GET | Orders Received Page | Received orders table |
| 15 | `PUT /api/farmer/orders/{orderId}/status` | PUT | Orders Received Page | Accept/Reject/Complete buttons |
| 16 | `GET /api/test` | GET | Health Check Page | Show JWT status |

### 8.1 Planned API-to-UI Mapping

| # | Backend API | Status | UI Page / Component |
|---|---|---|---|
| 1 | `GET /api/farmer/profile` | ✅ Implemented | Farmer Profile — View section |
| 2 | `PUT /api/farmer/profile` | ✅ Implemented | Farmer Profile — Edit section |
| 3 | `GET /api/buyer/products/search?name=` | ⚠️ Service exists, no endpoint | SearchBar on Browse Products |
| 4 | `GET /api/buyer/products/category/{cat}` | ⚠️ Service exists, no endpoint | CategoryFilter on Browse Products |
| 5 | `GET /api/admin/users` | ✅ Implemented | Manage Users page |
| 6 | `GET /api/admin/farmers` | ✅ Implemented | Farmers list |
| 7 | `GET /api/admin/buyers` | ✅ Implemented | Buyers list |
| 8 | `GET /api/admin/products` | ✅ Implemented | All Products (admin) |
| 9 | `GET /api/admin/orders` | ✅ Implemented | All Orders (admin) |
| 10 | `PUT /api/admin/farmers/{profileId}/verify` | ✅ Implemented | Farmer Verification page |

---

## 9. Current Implemented Features

The following UI features can be fully built using the existing backend APIs:

| # | Feature | Route(s) | APIs Used |
|---|---|---|---|
| 1 | **User Registration** | `/register` | `POST /api/auth/register` |
| 2 | **User Login** | `/login` | `POST /api/auth/login` |
| 3 | **Farmer Dashboard (basic)** | `/farmer/dashboard` | `GET /api/farmer` (stub) |
| 4 | **Farmer — Create Profile** | `/farmer/profile` | `POST /api/farmer/profile` |
| 5 | **Farmer — List My Products** | `/farmer/products` | `GET /api/farmer/products/my-products` |
| 6 | **Farmer — Create Product** | `/farmer/products/new` | `POST /api/farmer/products` |
| 7 | **Farmer — Edit Product** | `/farmer/products/:id/edit` | `PUT /api/farmer/products/{id}` |
| 8 | **Farmer — Delete Product** | `/farmer/products` | `DELETE /api/farmer/products/{id}` |
| 9 | **Farmer — View Received Orders** | `/farmer/orders` | `GET /api/farmer/orders` |
| 10 | **Farmer — Accept / Reject / Complete** | `/farmer/orders` | `PUT /api/farmer/orders/{id}/status` |
| 11 | **Buyer — Browse Products** | `/buyer/products` | `GET /api/buyer/products` |
| 12 | **Buyer — Place Order** | `/buyer/orders/new` | `POST /api/buyer/orders` |
| 13 | **Buyer — View My Orders** | `/buyer/orders` | `GET /api/buyer/orders` |

---

## 10. Planned Features (Requiring Backend Work)

The following UI features **cannot be fully implemented** until the
corresponding backend APIs are built:

| # | Feature | UI Page | Missing Backend |
|---|---|---|---|
| 1 | **Farmer — View Profile** | `/farmer/profile` | `GET /api/farmer/profile` endpoint |
| 2 | **Farmer — Edit Profile** | `/farmer/profile` | `PUT /api/farmer/profile` endpoint |
| 3 | **Buyer — Search Products** | `/buyer/products` | Controller endpoint for `ProductRepository.findByNameContainingIgnoreCase()` |
| 4 | **Buyer — Filter by Category** | `/buyer/products` | Controller endpoint for `ProductService.getProductsByCategory()` |
| 5 | **Admin — Full Dashboard** | `/admin/dashboard` | ✅ Implemented — `GET /api/admin/stats` |
| 6 | **Admin — Manage Users** | `/admin/users` | ✅ Implemented — `GET /api/admin/users`, role filters |
| 7 | **Admin — All Products** | `/admin/products` | ✅ Implemented — `GET /api/admin/products` |
| 8 | **Admin — All Orders** | `/admin/orders` | ✅ Implemented — `GET /api/admin/orders` |
| 9 | **Admin — Farmer Verification** | `/admin/verification` | ✅ Implemented — `GET /api/admin/farmers/unverified` + `PUT /api/admin/farmers/{profileId}/verify` |
| 10 | **Farmer Dashboard Stats** | `/farmer/dashboard` | Dashboard aggregation API or client-side computation |
| 11 | **Global Exception Handling** | All pages | `@ControllerAdvice` for consistent error responses |
| 12 | **Environment Variable Configuration** | Build-time | Move hardcoded DB/JWT credentials to environment variables |

---

## 11. Color Palette & Status Indicators

### 11.1 Order Status Colors

| Status | Color | Hex |
|---|---|---|
| PENDING | Amber / Yellow | `#F59E0B` |
| ACCEPTED | Blue | `#3B82F6` |
| REJECTED | Red | `#EF4444` |
| COMPLETED | Green | `#10B981` |

### 11.2 Role Badge Colors

| Role | Color | Hex |
|---|---|---|
| ADMIN | Purple | `#8B5CF6` |
| FARMER | Green | `#10B981` |
| BUYER | Blue | `#3B82F6` |

---

## 12. Global UI States

Every data-fetching page should handle these states:

| State | UI Treatment |
|---|---|
| **Loading** | Skeleton loader or centered spinner |
| **Empty** | Empty state illustration + message + CTA button |
| **Error** | Error alert with retry button |
| **Success** | Data displayed with toast notification on mutations |
| **Offline** | Banner "You appear to be offline" with retry |

---

## 13. Frontend Tech Stack (Planned)

| Technology | Purpose |
|---|---|
| React 18+ | UI framework |
| React Router v6 | Client-side routing |
| Axios | HTTP client for API calls |
| Context API or Zustand | State management (auth context) |
| Tailwind CSS or CSS Modules | Styling |
| React Hot Toast or Sonner | Toast notifications |

---

*End of UI Flow Document*
