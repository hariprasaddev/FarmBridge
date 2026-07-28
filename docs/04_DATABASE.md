# FarmBridge - Database Design

## 1. Database Technology

FarmBridge uses MySQL as the relational database.

The backend uses:

- Spring Data JPA
- Hibernate
- Jakarta Persistence API (JPA)

Database tables are mapped to Java entities using JPA annotations.

---

## 2. Database Tables

The current system contains the following main entities:

- users
- farmer_profiles
- products
- orders

---

## 3. Users Table

The `users` table stores information about all registered users.

### Columns

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR | User's name |
| email | VARCHAR | Unique user email |
| password | VARCHAR | Encrypted password |
| role | VARCHAR | User role |

### Roles

The supported roles are:

- ADMIN
- FARMER
- BUYER

The role is stored as a string using JPA EnumType.STRING.

---

## 4. Farmer Profiles Table

The `farmer_profiles` table stores additional information about farmers.

### Columns

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| farmName | VARCHAR | Name of the farm |
| location | VARCHAR | Farm location |
| landSize | DOUBLE | Size of agricultural land |
| cultivationMethod | VARCHAR | Method used for cultivation |
| cropsCultivated | VARCHAR | Crops cultivated by the farmer |
| farmingType | VARCHAR | Type of farming |
| user_id | BIGINT | Reference to users table |

### Relationship

A FarmerProfile has a one-to-one relationship with User.

Relationship:

User
1
│
│
1
│
FarmerProfile

The `user_id` column connects the farmer profile with the corresponding user.

---

## 5. Products Table

The `products` table stores agricultural products listed by farmers.

### Columns

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR | Product name |
| description | VARCHAR | Product description |
| price | DOUBLE | Product price |
| quantity | INTEGER | Available quantity |
| category | VARCHAR | Product category |
| farmer_id | BIGINT | Farmer who owns the product |

### Relationship

Many products can belong to one farmer.

Relationship:

Farmer
1
│
│
├── Product
├── Product
└── Product

The `farmer_id` column connects each product to the farmer who created it.

---

## 6. Orders Table

The `orders` table stores orders placed by buyers.

### Columns

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| product_id | BIGINT | Product being ordered |
| buyer_id | BIGINT | Buyer who placed the order |
| farmer_id | BIGINT | Farmer who owns the product |
| quantity | INTEGER | Quantity ordered |
| totalPrice | DOUBLE | Total order price |
| status | VARCHAR | Current order status |

---

## 7. Order Status

The order status is stored as a string enum.

Available statuses:

- PENDING
- ACCEPTED
- REJECTED
- COMPLETED

Order flow:

PENDING
│
├── ACCEPTED
│      │
│      ▼
│   COMPLETED
│
└── REJECTED

---

## 8. Entity Relationships

### User and FarmerProfile

Relationship:

One User
↓
One FarmerProfile

Purpose:

Stores additional farmer information for a farmer user.

---

### User and Product

Relationship:

One Farmer
↓
Many Products

Purpose:

A farmer can create and manage multiple agricultural products.

---

### Product and Order

Relationship:

One Product
↓
Many Orders

Purpose:

A product can be ordered by buyers through multiple orders.

---

### User and Order - Buyer

Relationship:

One Buyer
↓
Many Orders

Purpose:

A buyer can place multiple orders.

---

### User and Order - Farmer

Relationship:

One Farmer
↓
Many Orders

Purpose:

A farmer can receive multiple orders for products they own.

---

## 9. Overall Entity Relationship

The overall relationship is:

User
│
├── FarmerProfile
│
├── Products (when User is a Farmer)
│
└── Orders (when User is a Buyer or Farmer)

Product
│
└── Orders

Order
│
├── Buyer → User
├── Farmer → User
└── Product → Product

---

## 10. Foreign Keys

The main foreign key relationships are:

### Farmer Profile

farmer_profiles.user_id
→ users.id

### Product

products.farmer_id
→ users.id

### Order Product

orders.product_id
→ products.id

### Order Buyer

orders.buyer_id
→ users.id

### Order Farmer

orders.farmer_id
→ users.id

---

## 11. Database Constraints

The current entity design includes:

- User email must be unique.
- User name is required.
- User email is required.
- User password is required.
- User role is required.
- Farmer profile must have a user reference.
- Order product is required.
- Order buyer is required.
- Order farmer is required.
- Order quantity is required.
- Order total price is required.
- Order status is required.

---

## 12. Database Flow

### Farmer Product Flow

Farmer registers
↓
User record created
↓
Farmer logs in
↓
JWT generated
↓
Farmer creates product
↓
Product is linked to farmer
↓
Product stored in products table

---

### Buyer Order Flow

Buyer logs in
↓
Buyer views products
↓
Buyer selects product
↓
Buyer places order
↓
Order is linked to:
- Buyer
- Product
- Farmer
  ↓
  Order stored in orders table
  ↓
  Status = PENDING

---

### Farmer Order Management

Farmer logs in
↓
Farmer views received orders
↓
Farmer updates order status
↓
ACCEPTED / REJECTED
↓
If accepted
↓
COMPLETED

---

## 13. Current Database Status

Completed:

- Users table
- Farmer profiles table
- Products table
- Orders table
- User roles
- Farmer-product relationship
- Farmer profile relationship
- Buyer-order relationship
- Farmer-order relationship
- Product-order relationship
- Order status management

Planned database changes may be required for future modules such as:

- Admin management
- Farmer verification
- Cart
- Wishlist
- Payment
- Notifications

These tables should only be added when the corresponding features are approved
as part of the FarmBridge requirements.next