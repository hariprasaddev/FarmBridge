# FarmBridge — UI Flow Document

> **Document Version:** 2.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Aligned with the implemented React frontend (23 pages, design-system shell)

---

## 1. Introduction

This document defines the UI flows, page inventory, navigation structure, and
user journeys for the **FarmBridge React frontend**. The frontend is fully
implemented on top of the Spring Boot REST APIs (74 endpoints — see
[`05_API_CONTRACT.md`](05_API_CONTRACT.md)).

### 1.1 Design Principles

- **Role-based views:** the app shell (TopNavbar + Sidebar) adapts to the
  authenticated role via `config/navigation.jsx`.
- **JWT-first:** protected routes require a valid JWT; role mismatches are
  blocked by `ProtectedRoute`.
- **Design system:** every page reuses `components/ui/` (Button, Card,
  StatCard, Badge, Modal, ConfirmDialog, DataTable, Pagination, SearchBar,
  FilterPanel, EmptyState, Skeleton, Loader, PageHeader, Breadcrumb).
- **Enterprise polish:** `--fb-*` design tokens, glass cards, sticky table
  headers, floating-label forms, status pills.
- **Accessible & responsive:** focus traps, ARIA roles, `prefers-reduced-motion`,
  mobile sidebar drawer, responsive grids.
- **Progressive disclosure:** complex actions (place order, edit product,
  approve verification, reject order) use modals/dialogs.

---

## 2. Authentication Flow

### 2.1 Entry Points

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Existing user sign-in |
| Register | `/register` | New user sign-up (FARMER / BUYER only) |
| Forgot Password | `/forgot-password` | Request reset email |
| Reset Password | `/reset-password` | Enter token + new password |

All other routes are protected; unauthenticated users are redirected to
`/login`. An auth-hydration splash prevents full-reload redirect races.

### 2.2 Registration Flow

```
/register
├── Fields: name, email, password, role (FARMER | BUYER — no ADMIN option)
├── POST /api/auth/register
├── Success → toast → redirect /login
└── Errors → inline field messages ("Email already exists", validation)
```

### 2.3 Login Flow

```
/login
├── Fields: email, password (+ "Forgot password?" link → /forgot-password)
├── POST /api/auth/login
├── Success → store JWT + role → redirect by role:
│     FARMER → /farmer/dashboard · BUYER → /buyer/dashboard · ADMIN → /admin/dashboard
└── Error → inline message ("Invalid email or password")
```

### 2.4 Password Reset Flow

```
/forgot-password → POST /api/auth/forgot-password → generic success message
  → email contains reset link → /reset-password?token=…
/reset-password → POST /api/auth/reset-password (token + new password)
  → success → redirect /login
```

### 2.5 Logout & Session Expiry

- Logout (ProfileDropdown) clears storage → `/login`.
- 401 responses clear session and redirect to `/login` with a
  "Session expired" toast.
- Deactivated accounts receive 403 on any request and are logged out.

---

## 3. Navigation Flow

### 3.1 Shell Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TopNavbar  [☰|◀]  Brand  ·  Breadcrumb  ·  Search  · 🔔  ·  Profile▼ │
├──────┬──────────────────────────────────────────────────────┤
│Sidebar│                                                      │
│• Dashboard │              Page content                       │
│• Products  │          (page header + cards/tables/forms)     │
│• Orders    │                                                 │
│• …         │                                                 │
└──────┴──────────────────────────────────────────────────────┘
```

- **Sidebar:** fixed rail → collapsible icon rail (persisted) → mobile drawer
  with backdrop below 1024 px.
- **TopNavbar:** brand always visible, search + breadcrumb hide on small
  screens; notification bell (unread badge) + profile dropdown.
- **ProfileDropdown:** profile link, notifications, logout.

### 3.2 Role Navigation (from `config/navigation.jsx`)

| FARMER | BUYER | ADMIN | Common |
|---|---|---|---|
| Dashboard `/farmer/dashboard` | Dashboard `/buyer/dashboard` | Dashboard `/admin/dashboard` | Notifications `/notifications` |
| My Products `/farmer/products` | Browse Products `/buyer/products` | Users `/admin/users` | |
| Orders `/farmer/orders` | My Orders `/buyer/orders` | Products `/admin/products` | |
| Verification `/farmer/verification` | Wishlist `/buyer/wishlist` | Orders `/admin/orders` | |
| My Profile `/farmer/profile` | | Verification `/admin/verification` | |
| | | Announcements `/admin/announcements` | |

---

## 4. Screen / Page Inventory (23 pages)

| # | Page | Route | Role |
|---|---|---|---|
| 1 | Login | `/login` | Public |
| 2 | Register | `/register` | Public |
| 3 | Forgot Password | `/forgot-password` | Public |
| 4 | Reset Password | `/reset-password` | Public |
| 5 | Farmer Dashboard (analytics) | `/farmer/dashboard` | FARMER |
| 6 | Farmer Products | `/farmer/products` | FARMER |
| 7 | Add Product | `/farmer/products/add` | FARMER |
| 8 | Edit Product | `/farmer/products/edit/:id` | FARMER |
| 9 | Farmer Orders | `/farmer/orders` | FARMER |
| 10 | Farmer Verification | `/farmer/verification` | FARMER |
| 11 | Farmer Profile | `/farmer/profile` | FARMER |
| 12 | Buyer Dashboard (analytics) | `/buyer/dashboard` | BUYER |
| 13 | Browse Products | `/buyer/products` | BUYER |
| 14 | Product Details | `/buyer/products/:id` | BUYER |
| 15 | Buyer Orders | `/buyer/orders` | BUYER |
| 16 | Buyer Wishlist | `/buyer/wishlist` | BUYER |
| 17 | Notifications | `/notifications` | Any role |
| 18 | Admin Dashboard (analytics) | `/admin/dashboard` | ADMIN |
| 19 | Admin Users | `/admin/users` | ADMIN |
| 20 | Admin Products | `/admin/products` | ADMIN |
| 21 | Admin Orders | `/admin/orders` | ADMIN |
| 22 | Admin Verification | `/admin/verification` | ADMIN |
| 23 | Admin Announcements | `/admin/announcements` | ADMIN |

---

## 5. Dashboard Flows

All dashboards load a **single analytics payload** and render real data.

### 5.1 Admin Dashboard (`/admin/dashboard`)

```
GET /api/admin/analytics
├── 17 stat cards (users, farmers, verified, pending, buyers, products, orders,
│    monthly orders, revenue ×2, completed/cancelled, active/inactive ×2, selling farmers)
├── 6 charts: Revenue/month (line), Orders/month (bar), Farmer registrations (line),
│    Product categories (pie), Order status (donut), Top categories (hbar)
└── 7 tables: latest orders, latest farmers, pending verifications,
     top buyers, top farmers, top products, low stock, latest reviews
```

### 5.2 Farmer Dashboard (`/farmer/dashboard`)

```
GET /api/farmer/analytics
├── Verification banner/pill (PENDING/REJECTED/APPROVED/not submitted)
├── 11 stat cards (today/pending/accepted/completed/rejected orders,
│    monthly & total revenue, products, avg rating, reviews, customers)
├── 6 charts: revenue trend, orders trend, sales/product, sales/month,
│    rating trend, category sales
└── sections: best-selling product, low stock, recent reviews, recent orders, top customers
Quick action "Add New Product" is locked until verification is APPROVED.
```

### 5.3 Buyer Dashboard (`/buyer/dashboard`)

```
GET /api/buyer/analytics
├── 8 stat cards (orders, wishlist, reviews, money spent, favorite category,
│    purchased products, pending/completed orders)
├── 3 charts: monthly spending (area), purchases by category (pie), orders timeline (bar)
└── sections: recommended products, latest orders, favourite farmers
   (recently-viewed products tracked client-side in localStorage)
```

---

## 6. Buyer Journey

1. **Discover:** Browse Products grid → cards show image, name, price, stock,
   farmer, **Verified Farmer badge**, rating. Filter chips by category; view
   recently-viewed products.
2. **Details:** Product Details page — gallery, description, farm info,
   rating breakdown (5★…1★), reviews list, wishlist toggle, quantity stepper.
3. **Checkout:** "Place Order" opens the design-system **Modal** — quantity
   validated against stock, live total, confirm → `POST /api/buyer/orders` →
   toast + redirect to My Orders.
4. **Track:** My Orders table with status pills; details modal; notifications
   (bell + page) and emails keep the buyer informed.
5. **Engage:** write/edit/delete reviews for purchased products; add/remove
   wishlist items; view personal dashboard analytics.

## 7. Farmer Journey

1. **Register & login** → `/farmer/dashboard` with verification banner.
2. **Profile** `/farmer/profile` — create/view/update farm profile.
3. **Verification** `/farmer/verification` — multi-section form
   (personal/farm/cultivation + document uploads). States:
   - *Not submitted* → form
   - *PENDING* → "under review" screen
   - *REJECTED* → reason shown + edit & resubmit (keeps documents)
   - *APPROVED* → "Verified Farmer" badge
4. **Products** `/farmer/products` — list with images, add/edit/delete
   (ConfirmDialog), image upload with preview. Locked (with warning banner)
   until APPROVED.
5. **Orders** `/farmer/orders` — accept / reject (modal with optional reason)
   / complete; status pills; stock-restore feedback on rejection.
6. **Dashboard analytics** — revenue, sales, customers, low stock.

## 8. Admin Journey

1. **Dashboard** — platform KPIs + charts + tables.
2. **Users** `/admin/users` — table with ACTIVE/INACTIVE badges, role & status
   filters, edit modal, **Deactivate** (ConfirmDialog) / **Reactivate**,
   dimmed inactive rows.
3. **Products** / **Orders** — unfiltered oversight tables.
4. **Verification** `/admin/verification` — pending list with village/
   district/cultivation/submission date; details dialog with documents;
   **Approve** (ConfirmDialog) and **Reject with reason** dialog.
5. **Announcements** `/admin/announcements` — compose form (audience,
   subject, message, optional button) with **live HTML preview**, send with
   loading state, and history table with recipient counts.

## 9. Checkout Flow (detailed)

```
ProductDetailsPage (or Browse modal)
├── select quantity (1..stock, stepper)
├── total = price × quantity (live)
├── click "Place Order" → Checkout Modal
│   ├── product summary + quantity + total
│   ├── confirm → POST /api/buyer/orders
│   ├── success → toast "Order placed" → redirect /buyer/orders
│   └── failure → inline error ("Insufficient product quantity", etc.)
└── after order: farmer notified in-app + by email
```

## 10. Verification Flow (detailed)

```
FarmerDashboard → Verification banner → /farmer/verification
├── form: fullName, mobile, address parts, farm info, cultivation, main crops,
│         experience + uploads (farmerPhoto, landCertificate, farmPhoto,
│         organicCertificate optional) — floating labels + previews
├── POST /api/farmer/profile/verification (multipart)
├── PENDING screen ("Your verification request is under review")
│     └─ product actions locked
├── admin: /admin/verification → details → Approve / Reject(reason)
│     └─ farmer receives email + in-app notification
├── APPROVED → Verified Farmer badge across UI, selling unlocked
└── REJECTED → reason banner + "Update & Resubmit" (documents kept)
```

## 11. Notification Flow

- NotificationBell in the TopNavbar polls `GET /api/notifications/unread/count`
  for the badge and `GET /api/notifications/unread` for the dropdown.
- `/notifications` page: full list, unread first, mark one/all read, delete,
  clear all (ConfirmDialog).

## 12. Global UI States

| State | Treatment |
|---|---|
| Loading | Skeleton loaders / spinner |
| Empty | EmptyState illustration + CTA |
| Error | Inline alert + retry where applicable |
| Success | Toast (bottom-right) after mutations |
| Offline | Error state with retry |

## 13. Status Colors

| Status | Color |
|---|---|
| PENDING | Amber `#F59E0B` |
| ACCEPTED | Blue `#3B82F6` |
| REJECTED | Red `#EF4444` |
| COMPLETED | Green `#10B981` |
| APPROVED (verification) | Green |
| ACTIVE / INACTIVE (user) | Green / Gray |

---

*End of UI Flow Document*
