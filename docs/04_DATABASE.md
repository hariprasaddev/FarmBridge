# FarmBridge — Database Design

> **Document Version:** 2.0
> **Last Updated:** 2026-08-06
> **Framework:** TrainingMug ADF v1.0
> **Status:** ✅ Aligned with the current JPA entities (9 tables)

---

## 1. Database Technology

- **MySQL 8+** relational database (`farmbridge` schema, local dev).
- **Spring Data JPA + Hibernate**; schema managed by JPA entities with
  `spring.jpa.hibernate.ddl-auto=update`.
- All entity relationships are JPA-mapped; foreign keys are enforced by
  Hibernate-generated DDL.

> **Note on table naming:** FarmBridge has **no** separate `order_items` or
> `farmer_verification` tables. Orders reference a single product directly
> (`orders.product_id`), and all verification data lives on the
> `farmer_profiles` row. The tables below are the complete set.

---

## 2. Table Inventory

| # | Table | Purpose | Mapped entity |
|---|---|---|---|
| 1 | `users` | Registered accounts (all roles) | `User` |
| 2 | `farmer_profiles` | Farmer details + verification data | `FarmerProfile` |
| 3 | `products` | Product listings (incl. image) | `Product` |
| 4 | `orders` | Buyer orders | `Order` |
| 5 | `reviews` | Product reviews & ratings | `Review` |
| 6 | `wishlist` | Saved products per buyer | `Wishlist` |
| 7 | `notifications` | In-app notifications | `Notification` |
| 8 | `password_reset_tokens` | Password-reset tokens | `PasswordResetToken` |
| 9 | `announcements` | Admin email-announcement history | `Announcement` |

Enums (stored as strings, `EnumType.STRING`):

- `Role`: `ADMIN`, `FARMER`, `BUYER`
- `OrderStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`
- `VerificationStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `NotificationType`: `NEW_ORDER`, `ORDER_ACCEPTED`, `ORDER_REJECTED`,
  `ORDER_COMPLETED`, `ADMIN_MESSAGE`
- `AnnouncementAudience`: `ALL`, `BUYERS`, `FARMERS`

---

## 3. users

**Purpose:** Every registered account — admin, farmer, and buyer. Includes the
enterprise soft-delete flag.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK, IDENTITY) | No | Primary key |
| `name` | VARCHAR(255) | No | Display name |
| `email` | VARCHAR(255) | No | Login email — **unique** |
| `password` | VARCHAR(255) | No | BCrypt hash |
| `role` | VARCHAR (enum) | No | `ADMIN` / `FARMER` / `BUYER` |
| `created_at` | DATETIME | Yes | Registration time (`@PrePersist`); legacy rows NULL |
| `active` | BOOLEAN | No | Soft-delete flag; default `TRUE` (`BOOLEAN DEFAULT TRUE`) |

**Indexes:** unique index on `email`.

**Constraints:** `name`, `email`, `password`, `role`, `active` NOT NULL; email
unique.

**Relationships:** 1:1 → `farmer_profiles` (via `user_id`); 1:N → `products`
(farmer), `orders` (buyer & farmer), `reviews` (buyer), `wishlist` (buyer),
`notifications` (recipient), `password_reset_tokens` (user).

**Used by:** Authentication, admin user management, analytics (registration
trends, active/inactive counts), soft delete.

---

## 4. farmer_profiles

**Purpose:** Additional farmer information and the full verification workflow
(personal, farm, cultivation details, documents, status).

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `full_name` | VARCHAR(255) | Yes | Verified full name |
| `mobile_number` | VARCHAR(255) | Yes | 10-digit mobile |
| `aadhaar_number` | VARCHAR(255) | Yes | Optional Aadhaar |
| `village`, `mandal`, `district`, `state` | VARCHAR(255) | Yes | Address parts |
| `farm_name` | VARCHAR(255) | Yes | Farm display name |
| `location` | VARCHAR(255) | Yes | Human-readable location (compat) |
| `farm_address` | VARCHAR(255) | Yes | Farm address |
| `land_size` | DOUBLE | Yes | Farm size (acres; legacy name kept) |
| `survey_number` | VARCHAR(255) | Yes | Optional survey number |
| `cultivation_method` | VARCHAR(255) | Yes | `ORGANIC`/`NATURAL`/`CHEMICAL`/`MIXED` |
| `crops_cultivated` | VARCHAR(255) | Yes | Main crops (legacy name kept) |
| `farming_experience` | VARCHAR(255) | Yes | Years of experience |
| `farming_type` | VARCHAR(255) | Yes | Farming type (legacy) |
| `farmer_photo_url`, `land_certificate_url`, `farm_photo_url`, `organic_certificate_url` | VARCHAR(255) | Yes | Public `/uploads/...` document URLs |
| `verified` | BOOLEAN | Yes | `TRUE` only when APPROVED (kept in sync) |
| `verification_status` | VARCHAR (enum) | No | `PENDING`/`APPROVED`/`REJECTED`; default PENDING |
| `rejection_reason` | VARCHAR(1000) | Yes | Admin reason (only when REJECTED) |
| `submitted_at` | DATETIME | Yes | Last (re)submission time |
| `user_id` | BIGINT (FK) | No | → `users.id` (1:1) |

**Indexes:** FK index on `user_id`.

**Constraints:** `user_id` NOT NULL + unique (1:1); `verification_status` NOT
NULL.

**Relationships:** 1:1 with `users`.

**Used by:** Farmer profile pages, verification workflow (submit/get/approve/
reject), product responses (verified flag), analytics (verified farmers,
pending list).

---

## 5. products

**Purpose:** Agricultural product listings created by farmers.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `name` | VARCHAR(255) | Yes | Product name |
| `description` | VARCHAR(255) | Yes | Description |
| `price` | DOUBLE | Yes | Unit price |
| `quantity` | INTEGER | Yes | Available stock |
| `category` | VARCHAR(255) | Yes | Category (e.g. Grains) |
| `image_url` | VARCHAR(255) | Yes | Public image URL |
| `farmer_id` | BIGINT (FK) | Yes | → `users.id` (owner) |

**Indexes:** FK index on `farmer_id`.

**Constraints:** logical NOT NULL via service/DTO validation (name, price ≥ 1,
quantity ≥ 1, category).

**Relationships:** N:1 → `users` (farmer); 1:N → `orders`, `reviews`,
`wishlist`.

**Used by:** Farmer product CRUD + images, buyer browse/details/category,
admin oversight, wishlist, reviews, analytics (top products, low stock,
category counts, sales per product).

---

## 6. orders

**Purpose:** Buyer orders; each order references one product, one buyer, and
one farmer, with the order status lifecycle.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `product_id` | BIGINT (FK) | No | → `products.id` |
| `buyer_id` | BIGINT (FK) | No | → `users.id` |
| `farmer_id` | BIGINT (FK) | No | → `users.id` |
| `quantity` | INTEGER | No | Quantity ordered |
| `total_price` | DOUBLE | No | price × quantity |
| `status` | VARCHAR (enum) | No | `PENDING`/`ACCEPTED`/`REJECTED`/`COMPLETED` |
| `created_at` | DATETIME | Yes | Placed time (`@PrePersist`); legacy rows NULL |

**Indexes:** FK indexes on `product_id`, `buyer_id`, `farmer_id`.

**Constraints:** all FKs NOT NULL; `quantity`, `total_price`, `status` NOT NULL.

**Relationships:** N:1 → `products`, N:1 → `users` (buyer), N:1 → `users`
(farmer).

**Used by:** Order placement/status management, buyer & farmer order lists,
admin oversight, notifications/emails, analytics (revenue, status donut,
monthly series, top products/farmers/buyers).

---

## 7. reviews

**Purpose:** Buyer reviews (1–5 stars + optional comment) for purchased
products.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `rating` | INTEGER | No | 1–5 (DTO-validated) |
| `comment` | VARCHAR(1000) | Yes | Optional text |
| `product_id` | BIGINT (FK) | No | → `products.id` |
| `buyer_id` | BIGINT (FK) | No | → `users.id` |
| `created_at` | DATETIME | No | Creation time (`@PrePersist`) |
| `updated_at` | DATETIME | Yes | Last edit (`@PreUpdate`) |

**Indexes:** unique constraint `uk_reviews_buyer_product` (`buyer_id`,
`product_id`) → one review per buyer per product.

**Constraints:** rating/product/buyer NOT NULL; unique buyer+product pair.

**Relationships:** N:1 → `products`, N:1 → `users` (buyer).

**Used by:** Product rating display (avg + star counts), review CRUD, farmer
review lists, analytics (rating trend, latest reviews).

---

## 8. wishlist

**Purpose:** Products a buyer saves for later.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `buyer_id` | BIGINT (FK) | No | → `users.id` |
| `product_id` | BIGINT (FK) | No | → `products.id` |
| `created_at` | DATETIME | No | Creation time (`@PrePersist`) |

**Indexes:** unique constraint `uk_wishlist_buyer_product` (`buyer_id`,
`product_id`).

**Constraints:** buyer/product NOT NULL; unique buyer+product pair.

**Relationships:** N:1 → `users` (buyer), N:1 → `products`.

**Used by:** Wishlist page, wishlist badge/check, buyer analytics (wishlist
count), product "add to wishlist" flow.

---

## 9. notifications

**Purpose:** In-app notifications per recipient.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `recipient_id` | BIGINT (FK, LAZY) | No | → `users.id` |
| `title` | VARCHAR(255) | No | Short title ("New Order") |
| `message` | VARCHAR(1000) | No | Full message |
| `type` | VARCHAR (enum) | No | `NEW_ORDER`, `ORDER_ACCEPTED`, `ORDER_REJECTED`, `ORDER_COMPLETED`, `ADMIN_MESSAGE` |
| `is_read` | BOOLEAN | No | Read state; default `false` |
| `reference_id` | BIGINT | Yes | Related record id (e.g. order id) |
| `created_at` | DATETIME | No | Creation time (`@PrePersist`) |

**Indexes:** FK index on `recipient_id`.

**Constraints:** recipient/title/message/type/is_read NOT NULL.

**Relationships:** N:1 → `users` (recipient, lazy-loaded inside transactions).

**Used by:** Notification bell + page (list/unread/count/read/delete), order &
announcement event flows.

---

## 10. password_reset_tokens

**Purpose:** Single-use, 15-minute password-reset tokens.

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `token` | VARCHAR(64) | No | UUID — **unique** |
| `user_id` | BIGINT (FK, LAZY) | No | → `users.id` |
| `expiry_time` | DATETIME | No | now + 15 minutes |
| `used` | BOOLEAN | No | Consumed flag; default `false` |
| `created_at` | DATETIME | No | Creation time (`@PrePersist`) |

**Indexes:** unique index on `token`.

**Constraints:** token/user/expiry/used NOT NULL; token unique.

**Relationships:** N:1 → `users`.

**Used by:** Forgot-password + reset-password flows.

---

## 11. announcements

**Purpose:** History of admin email announcements (emails themselves are sent
via SMTP; this is the audit record).

**Columns**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | No | Primary key |
| `audience` | VARCHAR (enum) | No | `ALL` / `BUYERS` / `FARMERS` |
| `subject` | VARCHAR(255) | No | Email subject |
| `message` | VARCHAR(5000) | No | Email body |
| `button_text` | VARCHAR(255) | Yes | Optional CTA label |
| `button_url` | VARCHAR(1000) | Yes | Optional CTA URL (validated `^https?://`) |
| `recipient_count` | INTEGER | No | Addressed recipients |
| `sent_by` | VARCHAR(255) | No | Admin email |
| `created_at` | DATETIME | No | Sent time (`@PrePersist`) |

**Indexes:** none beyond the PK.

**Constraints:** audience/subject/message/recipient_count/sent_by NOT NULL.

**Relationships:** none (standalone audit table).

**Used by:** Admin announcement compose + history page.

---

## 12. Entity Relationship Overview

```
users ──1:1── farmer_profiles
  │
  ├──1:N── products (farmer)
  ├──1:N── orders (buyer)        ──N:1── products
  ├──1:N── orders (farmer)
  ├──1:N── reviews (buyer)       ──N:1── products
  ├──1:N── wishlist (buyer)      ──N:1── products
  ├──1:N── notifications (recipient)
  └──1:N── password_reset_tokens

announcements  (standalone)
```

### Key flows

- **Farmer product flow:** register → profile → verification → APPROVED →
  create product (`products.farmer_id` = user).
- **Buyer order flow:** browse → place order → `orders` row links buyer,
  product, farmer; stock deducted; status PENDING.
- **Order management:** farmer transitions status; REJECTED restores stock.
- **Soft delete:** `users.active = false`; no rows are ever removed.

---

*End of Database Document*
