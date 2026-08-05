# Day 17 — Professional Analytics Dashboards (End-to-End)

**Milestone:** Convert the CRUD dashboards into production-grade business
dashboards — every card, chart, and table fed by **real backend data** via
aggregated, single-payload analytics APIs. No dummy values, no fake charts.

---

## 1. Files Created

### Backend — `FarmBridge/src/main/java/com/farmbridge/`

| File | Purpose |
|---|---|
| `dto/MonthlyMetric.java` | `(year, month, value, count)` projection — revenue/orders/registrations/spending series |
| `dto/CategoryMetric.java` | `(category, count, value)` — category pie chart + top-selling horizontal bars |
| `dto/StatusMetric.java` | `(status, count)` — order-status donut chart |
| `dto/ProductMetric.java` | `(id, name, category, qtySold, revenue, orderCount)` — top products / farmer sales |
| `dto/UserMetric.java` | `(id, name, email, count, revenue)` — top buyers / top farmers |
| `dto/OrderMetric.java` | `(id, productName, buyerName, qty, total, status, createdAt)` — latest-orders tables |
| `dto/ReviewMetric.java` | `(id, productName, reviewer, rating, comment, createdAt)` — rating trend + recent reviews |
| `dto/LowStockProduct.java` | `(id, name, category, quantity, price, farmerName)` — low-stock table |
| `dto/AdminAnalyticsResponse.java` | Full admin dashboard payload |
| `dto/FarmerAnalyticsResponse.java` | Full farmer dashboard payload |
| `dto/BuyerAnalyticsResponse.java` | Full buyer dashboard payload |
| `service/AnalyticsService.java` | Service interface |
| `service/AnalyticsServiceImpl.java` | Aggregation orchestration (sort/limit in Java, batch loads, N+1-free) |
| `controller/AnalyticsController.java` | 10 role-scoped endpoints |

### Frontend — `FarmBridge/frontend/src/`

| File | Purpose |
|---|---|
| `components/AnimatedNumber.jsx` | Animated count-up display for stat cards |
| `utils/recentlyViewed.js` | localStorage-based recently-viewed tracking |
| `pages/BuyerDashboardPage.jsx` | New buyer dashboard page |
| `pages/BuyerDashboardPage.css` | Buyer dashboard styles |
| `pages/FarmerDashboardAnalytics.css` | Farmer analytics styles (kept separate) |

### Tests / QA / Docs

| File | Purpose |
|---|---|
| `src/test/java/com/farmbridge/AnalyticsFlowIntegrationTest.java` | 8 integration tests — values + authorization matrix |
| `qa/backend_test.sh` *(extended)* | +16 backend E2E analytics checks |
| `qa/uitest.js` *(extended)* | +13 browser E2E dashboard checks + 3 screenshots |
| `docs/DAY17_ANALYTICS_DASHBOARD_REPORT.md` | This report |

---

## 2. Files Modified

### Backend

| File | Change |
|---|---|
| `entity/Order.java` | Added nullable `createdAt` + `@PrePersist` (legacy rows stay NULL; new rows stamped) |
| `entity/User.java` | Added nullable `createdAt` + `@PrePersist` (registration timestamp) |
| `repository/OrderRepository.java` | Grouped JPQL: monthly revenue/orders, revenue sums, status counts, latest orders, top products/farmers/buyers, buyer/farmer scoped queries |
| `repository/UserRepository.java` | Monthly farmer registrations (grouped), top-5 newest farmers |
| `repository/ProductRepository.java` | Category counts, low stock (global + per farmer), active farmers, sales-per-product |
| `repository/ReviewRepository.java` | Monthly rating trend, recent reviews, average rating |
| `repository/WishlistRepository.java` | Wishlist item count for a buyer |
| `config/OpenApiConfig.java` | OpenAPI version bump |

### Frontend

| File | Change |
|---|---|
| `services/api.js` | +11 analytics endpoint functions |
| `pages/AdminDashboardPage.jsx` + `.css` | Complete redesign — 13 stat cards, 6 charts, 7 tables |
| `pages/FarmerDashboard.jsx` | Analytics layer added (verification shell preserved) |
| `pages/ProductDetailsPage.jsx` | Records product view for "recently viewed" |
| `pages/App.jsx` | `/buyer/dashboard` route |
| `components/Navbar.jsx` | Buyer "Dashboard" nav item |
| `context/AuthContext.jsx` | Buyer post-login redirect → `/buyer/dashboard` |
| `vite.config.js` | Manual chunk split (recharts/react-icons vendor) |

### Docs

| File | Change |
|---|---|
| `docs/05_API_CONTRACT.md` | v1.2 — analytics endpoints + DTO schemas + auth matrix |
| `docs/API_DOCUMENTATION.md` | §7 Analytics Dashboards section |
| `README.md` | Features, tech stack, API modules, screenshots, analytics table |
| `docs/FarmBridge_API.postman_collection.json` | +10 requests in new Analytics folder (41 total) |

---

## 3. APIs Added

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/api/admin/analytics` | ADMIN | Full admin dashboard payload |
| GET | `/api/admin/analytics/revenue` | ADMIN | Revenue per month (line chart) |
| GET | `/api/admin/analytics/orders` | ADMIN | Orders per month (bar chart) |
| GET | `/api/admin/top-products` | ADMIN | Top selling products |
| GET | `/api/admin/top-farmers` | ADMIN | Top farmers by revenue |
| GET | `/api/admin/top-buyers` | ADMIN | Top buyers by spend |
| GET | `/api/farmer/analytics` | FARMER | Full farmer dashboard payload |
| GET | `/api/farmer/analytics/sales` | FARMER | Sales per product |
| GET | `/api/buyer/analytics` | BUYER | Full buyer dashboard payload |
| GET | `/api/buyer/analytics/spending` | BUYER | Monthly spend series |

---

## 4. Database Changes

- **No schema change required** — `createdAt` columns are nullable and added
  via `ddl-auto=update`; existing rows simply have `NULL` (excluded from
  time-series). New rows are stamped by `@PrePersist`.
- All analytics read paths are read-only `SELECT` aggregations.

---

## 5. Repository Queries Added

| Repository | Query | Aggregation |
|---|---|---|
| `OrderRepository` | `sumCompletedRevenue` | SUM over COMPLETED |
| `OrderRepository` | `findMonthlyRevenue` / `findMonthlyOrderCounts` | SUM/COUNT + YEAR/MONTH GROUP BY |
| `OrderRepository` | `countByStatus` × 4 | COUNT per status |
| `OrderRepository` | `countByCreatedAtGreaterThanEqual` | COUNT current month |
| `OrderRepository` | `findTopProducts` | GROUP BY product, SUM qty + revenue |
| `OrderRepository` | `findTopFarmers` / `findTopBuyers` | GROUP BY farmer/buyer, SUM revenue |
| `OrderRepository` | `findLatestOrders` | ORDER BY id DESC, Pageable |
| `OrderRepository` | buyer/farmer scoped monthly + status counts, buyer product ids | COUNT/GROUP BY scoped |
| `UserRepository` | `findMonthlyFarmerRegistrations` | COUNT + YEAR/MONTH GROUP BY |
| `ProductRepository` | `countActiveFarmers`, `countProductsByCategory`, `findLowStock*`, `findSalesPerProduct*` | COUNT DISTINCT / GROUP BY |
| `ReviewRepository` | `findMonthlyRatingTrend`, `findLatestReviews`, `findAverageRating*` | AVG + MONTH |
| `WishlistRepository` | `countByBuyerEmail` | COUNT |

All grouped queries avoid N+1 — dashboard lists use batched `IN` lookups
(`findByEmailIn`), and top-5 limits are applied in Java over sorted results.

---

## 6. Charts Implemented

### Admin (6)
1. Revenue Per Month — **Line** (Recharts `LineChart`)
2. Orders Per Month — **Bar** (`BarChart`)
3. Farmer Registrations — **Line** (dual axis with revenue)
4. Product Categories — **Pie**
5. Order Status — **Donut** (`PieChart` innerRadius)
6. Top Selling Categories — **Horizontal Bar** (layout="vertical")

### Farmer (6)
1. Revenue Trend — **Line**
2. Orders Trend — **Bar**
3. Sales Per Product — **Horizontal Bar**
4. Sales Per Month — **Line**
5. Rating Trend — **Line**
6. Category Sales — **Pie**

### Buyer (3)
1. Monthly Spending — **Area** (`AreaChart`)
2. Purchases by Category — **Pie**
3. Orders Timeline — **Bar**

---

## 7. Dashboard Cards

| Admin (13) | Farmer (11) | Buyer (8) |
|---|---|---|
| Total Users | Today's Orders | Orders |
| Total Farmers | Pending Orders | Wishlist |
| Verified Farmers | Accepted Orders | Reviews |
| Pending Verification | Completed Orders | Money Spent |
| Buyers | Rejected Orders | Favorite Category |
| Products | Monthly Revenue | Purchased Products |
| Orders | Total Revenue | Pending Orders |
| Monthly Orders | Products | Completed Orders |
| Platform Revenue | Average Rating | |
| Monthly Revenue | Reviews | |
| Completed Orders | Customers | |
| Cancelled Orders | | |
| Active Farmers | | |

---

## 8. Backend Tests

`AnalyticsFlowIntegrationTest` — **8 tests**, all passing:

| Test | Verifies |
|---|---|
| `adminAnalytics_returnsCounts` | admin-only access + user/product/order counts |
| `adminAnalytics_revenueAndMonthly` | COMPLETED-revenue math, monthly series |
| `adminAnalytics_chartsAndTables` | categories, status donut, top lists, latest orders |
| `adminAnalytics_rejectedForFarmerAndBuyer` | 403 for FARMER / BUYER |
| `farmerAnalytics_scopedToFarmer` | FARMER-only, values scoped to own account |
| `farmerAnalytics_rejectedForAdminAndBuyer` | 403 for ADMIN / BUYER |
| `buyerAnalytics_scopedToBuyer` | BUYER-only, spend + scoped charts |
| `buyerAnalytics_rejectedForAdminAndFarmer` | 403 for ADMIN / FARMER |

Full suite: **`./mvnw test` — 26/26 PASS** (18 pre-existing + 8 new).
Backend E2E (`qa/backend_test.sh`): **203 PASS / 0 FAIL** (16 new analytics checks
covering auth, values, and revenue consistency). UI E2E (`qa/uitest.js`):
**54 PASS / 0 FAIL** (13 new dashboard checks + 3 screenshots).

---

## 9. Frontend Build

- `npm run build` — **success** (clean).
- Bundle split via `vite.config.js` manual chunks: `main` dropped from
  **855 kB → 211 kB**; recharts (502 kB) + react-icons (64 kB) moved to
  vendor chunks that load on demand for dashboard pages.

---

## 10. Backend Build

- `./mvnw compile` — clean.
- `./mvnw package -DskipTests` — jar rebuilt, backend restarted on :8080.

---

## 11. Screenshots

Captured by the UI suite (`qa/screenshots/`):

- `admin-analytics.png` — admin dashboard: stat cards, revenue/orders charts
- `farmer-analytics.png` — farmer dashboard: revenue trend, sales charts
- `buyer-analytics.png` — buyer dashboard: spending area chart, category pie

---

## 12. Performance Improvements

- **One payload per dashboard** — Admin/Farmer/Buyer each load their entire
  page from a single `.../analytics` endpoint (replaces ~20 individual calls).
- **JPQL aggregation** — COUNT/SUM/AVG/GROUP BY/YEAR/MONTH run in the database.
- **No N+1** — farmer/profile/order lookups use batched `IN` queries; chart
  series limited to the last 6 months; top lists capped at 5.
- **Frontend** — vendor chunk splitting; skeletons while loading; memoized
  recharts (no animation replays on re-render).

---

## 13. Final Verification Report

| Check | Result |
|---|---|
| Backend compile | ✅ |
| Backend unit/integration tests (`./mvnw test`) | ✅ 26/26 |
| Backend E2E suite (qa/backend_test.sh) | ✅ 203/203 |
| Frontend build (`npm run build`) | ✅ |
| UI E2E suite (qa/uitest.js) | ✅ 54/54 |
| Admin analytics 403 for FARMER/BUYER | ✅ |
| Farmer analytics 403 for ADMIN/BUYER | ✅ |
| Buyer analytics 403 for ADMIN/FARMER | ✅ |
| Real data only (no dummy/placeholder values) | ✅ |
| Existing modules unaffected (auth, products, orders, reviews, wishlist, notifications, verification) | ✅ 203 backend + 54 UI regressions all green |
| Code review (3 issues found & fixed) | ✅ dead code removed, farmer dashboard recent-orders fields aligned, buyer favorite-category null-safety |
| Servers running final build | ✅ backend :8080, frontend :5173 |

**Bugs found & fixed during this milestone**

| Bug | Fix |
|---|---|
| Buyer post-login hardcoded to `/buyer/products` | Redirect now → `/buyer/dashboard` |
| JPQL constructor couldn't map enum→String (`o.status`) | `CAST(o.status AS string)` in projections |
| `Order` import shadowed `@Order` annotation in test | Removed unused import |
| Shared-DB legacy data dominated top-5 rankings | Assert ordering instead of membership |
| Test cleanup failed outside transaction | Wrapped cleanup in `TransactionTemplate` |
| Truncated CSS heredoc append | Re-written via `write_file` (avoid long basher heredocs) |
