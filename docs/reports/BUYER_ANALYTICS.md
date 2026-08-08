# Buyer Analytics + Product Recommendations — Feature Report

> **Date:** 2026-08-08
> **Report:** `docs/reports/BUYER_ANALYTICS.md`
> **Master timeline:** [`docs/07_TASKS.md`](../07_TASKS.md) — Phase 13 (Buyer Analytics & Product Recommendations)

**Feature:** End-to-end review, hardening and verification of the buyer
analytics dashboard and its personalized product recommendations. The
dashboard was already implemented; this pass closed the recommendation
gaps (category fallback, in-stock filtering, deterministic tests) and
proved the feature end-to-end: unit → integration → HTTP/security →
Docker → browser.

---

## 1. Architecture

```
React Buyer Dashboard (BuyerDashboardPage.jsx)
        ↓  GET /api/buyer/analytics   (JWT Bearer — identity from token only)
AnalyticsController.getBuyerAnalytics(Authentication)
        ↓  authentication.getName()  ← the JWT subject (email)
AnalyticsService.getBuyerAnalytics(email)
        ↓
AnalyticsServiceImpl
  ├── OrderRepository      counts / completed-spend / monthly series /
  │                        category purchases / timeline / recent orders /
  │                        favourite farmers / purchased product ids
  ├── WishlistRepository   wishlist count
  ├── ReviewRepository     review count
  └── ProductService       buyer-visible product pool (APPROVED + active
                           farmers only, rating stats batched)
        ↓
BuyerAnalyticsResponse  →  JSON →  React rendering
```

One payload per page load; every number is aggregated server-side via
grouped JPQL (`COUNT` / `SUM` / `AVG` / `GROUP BY YEAR·MONTH`) — no
client-side math, no per-row lazy loading.

## 2. API Flow

| Endpoint | Role | Purpose |
|---|---|---|
| `GET /api/buyer/analytics` | BUYER | Full dashboard payload (cards, charts, sections) |
| `GET /api/buyer/analytics/spending` | BUYER | Monthly completed-order spend series |

- The endpoint derives the buyer **exclusively from the JWT subject**
  (`authentication.getName()`). It accepts no email parameter and never
  trusts one — an attacker cannot read another buyer's dashboard.
- SecurityConfig gates `/api/buyer/**` to `ROLE_BUYER` only.

## 3. Database Flow

All queries are read-only JPQL aggregations over the existing schema
(`users`, `farmer_profiles`, `products`, `orders`, `reviews`,
`wishlist_items`, `notifications`). No schema change was required.

| Query | Produces |
|---|---|
| `countByBuyerEmail` | Orders card |
| `countByBuyerEmailAndStatus(PENDING / COMPLETED)` | Pending / Completed cards |
| `sumBuyerCompletedSpend` | Money Spent (COMPLETED only) |
| `countBuyerDistinctProducts` | Purchased Products card |
| `findBuyerMonthlySpending` | Monthly Spending area chart (COMPLETED only) |
| `findBuyerOrdersTimeline` | Orders Timeline bar chart (all statuses) |
| `findBuyerCategoryPurchases` | Purchases by Category pie + favourite category |
| `findBuyerRecentOrders` | Latest Orders table (all statuses) |
| `findBuyerFavoriteFarmers` | Favorite Farmers table |
| `findBuyerProductIds` | Recommendation exclusion set (any order status) |

## 4. Analytics Logic (status semantics)

| Metric | Status rule | Notes |
|---|---|---|
| `orders` | all statuses | total orders placed |
| `completedOrders` | `COMPLETED` | |
| `pendingOrders` | `PENDING` | |
| `moneySpent` | **`COMPLETED` only** | PENDING/ACCEPTED/REJECTED never count |
| `monthlySpending` | **`COMPLETED` only** | |
| `ordersTimeline` | all statuses | "orders placed per month" |
| `purchasesByCategory` / `favoriteCategory` | all statuses | "quantity ordered by category" |
| `purchasedProducts` | all statuses | distinct products the buyer ordered |
| `latestOrders` / `favoriteFarmers` | all statuses | history tables |

Design decision (documented, unchanged): the purchase-based metrics count
all order statuses — they answer "what did this buyer order", while the
spend metrics answer "what did the buyer pay for" and are strictly
COMPLETED-only. The integration test locks this in: a PENDING order bumps
`pendingOrders` but leaves `moneySpent` untouched.

## 5. Recommendation Logic

`AnalyticsServiceImpl.buildRecommendations(email, favoriteCategory)`:

1. **One buyer-visible pool** — `ProductService.getAllProducts()`, the same
   source as the marketplace listing. It already restricts the list to
   products of **ACTIVE + APPROVED farmers** and attaches rating stats in a
   single batched query. This is the single source of truth — no second,
   less-strict rule exists.
2. **Exclude already-ordered** — any product id in `findBuyerProductIds`
   (any order status) is removed.
3. **Exclude out-of-stock** — `quantity <= 0` products are removed; they
   cannot be ordered (`OrderServiceImpl` rejects with "Insufficient product
   quantity"), so recommending them would be a dead end. (The marketplace
   listing still shows them; recommendations only surface orderable items.)
4. **Favourite-category preference** — eligible products are partitioned
   once: the buyer's most-ordered category first, everything else as
   fallback.
5. **Fallback** — if the favourite category yields fewer than 6 eligible
   products, the remaining slots are filled from the rest of the
   marketplace. The category is a preference, not a hard limit.
6. **Ranking** — within each group: average rating descending (unrated
   products last), then newest product id as a deterministic tie-breaker.
7. **Cap** — at most `RECOMMENDED_N = 6` products (the favourite-category
   group itself is capped, so an overflowing category never exceeds the
   limit).
8. **Empty cases** — empty pool, no orders, or everything purchased all
   return an empty list without errors.

**Complexity:** 1 product query (+1 batched rating-stats query, +1 batched
profile query inside ProductService) and 1 purchased-ids query. No N+1.

## 6. Farmer Verification Rule (traced, not assumed)

The **actual** buyer-visibility rule, as enforced by
`ProductServiceImpl.isFromApprovedFarmer` (used by `getAllProducts`,
`getProductsByCategory`, `getBuyerProductById`, `getProductsByIds`):

> A product is buyer-visible iff its farmer's **`FarmerProfile.verificationStatus == APPROVED`**
> **AND** the farmer's `User.active == true` (soft-delete gate).

The legacy `FarmerProfile.verified` boolean is kept in sync by the
verification workflow but is **not** what the visibility code checks.
Recommendations reuse this exact rule by delegating to ProductService —
they never re-implement it. Products of `PENDING`/`REJECTED`/deactivated
farmers are invisible everywhere buyers look (browse, details, wishlist,
recommendations). An integration test seeds a PENDING farmer's product and
asserts it never appears in recommendations.

## 7. Security Rules

- **Identity:** the controller uses the JWT subject; no email request
  parameter is accepted or trusted.
- **Roles:** `GET /api/buyer/analytics` requires `ROLE_BUYER` (SecurityConfig).
  FARMER and ADMIN get 403. A missing/invalid token gets 403 (the
  project's documented default — no custom `AuthenticationEntryPoint`).
- **Deactivated accounts:** `JwtAuthFilter` rejects any account with
  `active == false` on every secured endpoint, analytics included.
- **Data exposure:** the payload exposes only the buyer's own aggregates;
  recommendation rows are standard `ProductResponse` objects (name, price,
  category, rating, farm name) — no private farmer data, no Aadhaar, no
  contact details, no passwords.

## 8. Test Results

### New unit tests — `AnalyticsServiceImplTest` (10, Mockito, no DB)

| Test | Verifies |
|---|---|
| `favouriteCategoryProductsComeFirst` | favourite-category products rank first, then the marketplace |
| `insufficientFavouriteCategoryFallsBackToMarketplace` | fallback when the category has too few products |
| `noOrdersRecommendsTopRatedMarketplace` | no-orders buyer gets top-rated picks, unrated last |
| `equalRatingsBreakTieByNewestId` | rating tie → newest id first |
| `recommendationsAreCapped` | never more than 6 |
| `purchasedProductsAreExcluded` | already-ordered products never appear |
| `outOfStockProductsAreExcluded` | quantity ≤ 0 never recommended |
| `onlyBuyerVisibleProductsSurface` | single buyer-visible pool, one `getAllProducts()` call |
| `emptyMarketplaceReturnsEmpty` | empty pool → empty list, no crash |
| `allProductsPurchasedReturnsEmpty` | everything purchased → empty list, no crash |

### New integration tests — `AnalyticsFlowIntegrationTest` (3 added, 11 total)

| Test | Verifies |
|---|---|
| `buyerPendingOrder_notCountedAsSpend` | PENDING order bumps `pendingOrders` but never `moneySpent` |
| `unapprovedFarmerProducts_neverRecommended` | PENDING-farmer products invisible in recommendations |
| `buyerAnalytics_endpointScopedByJwt` | MockMvc + real JWTs: `?email=` param ignored, each buyer sees only their own data, FARMER/ADMIN/no-token → 403 |

### Full suite

```
Tests run: 63, Failures: 0, Errors: 0, Skipped: 0   → BUILD SUCCESS
```

(50 pre-existing + 13 new — all other modules untouched and green.)

## 9. Frontend Flow

- `services/api.js` → `analyticsAPI.buyerAnalytics()` → `GET
  /buyer/analytics` (JWT attached by the axios interceptor).
- `BuyerDashboardPage.jsx` renders 8 stat cards (Favorite Category shows
  `data.favoriteCategory || '—'`), 3 chart panels (empty states when no
  data), "Recommended For You" product tiles, Recently Viewed, Latest
  Orders and Favorite Farmers tables.
- The recommendations subtitle now matches the fallback engine:
  "Based on your favourite category (X) and top-rated picks", or
  "Top-rated, in-stock picks from verified farmers" for buyers with no
  orders.
- Every section guards nulls (`data?.x || []`); empty recommendations
  render a friendly note; API errors show the error banner + Retry;
  loading shows skeletons. **No crash on empty/null payloads.**
- Browser-verified: 8 cards, charts, 6 recommendation tiles and all empty
  states rendered with **zero console errors**.

## 10. Docker Verification

Rebuilt both images (`docker compose build backend frontend`) with the new
code and restarted the stack — **no volumes touched**:

| Check | Result |
|---|---|
| mysql / backend / frontend healthy | ✅ |
| Register + login a fresh buyer (JWT) | ✅ |
| No-orders buyer: 6 top-rated, in-stock, verified-farmer recommendations | ✅ |
| Place a PENDING order → `moneySpent` stays 0, `pendingOrders` = 1 | ✅ |
| Ordered product disappears from recommendations | ✅ |
| FARMER token on `/api/buyer/analytics` → 403 | ✅ |
| Recommendations render in the browser (subtitle, tiles) | ✅ |

All temporary verification accounts were removed from the compose MySQL
afterwards (seed/QA data untouched).

## 11. CI/CD Compatibility

- No changes to `.github/workflows/ci-cd.yml` are required.
- The new tests run inside the existing `build-and-test` job
  (Java 25 + Maven + MySQL 8 service container).
- **One dependency addition:** `spring-boot-webmvc-test` (test scope) was
  added to `pom.xml` — Spring Boot 4.1 moved `@AutoConfigureMockMvc` out
  of `spring-boot-starter-test` into this module. It is resolved by the
  existing Maven build from the Spring Boot BOM; the runtime image is
  unaffected (`-DskipTests` build).
- Backend Dockerfile already skips tests during image builds; the frontend
  Dockerfile runs `npm ci && npm run build`, which passes.

## 12. Known Limitations

- **Recommendations are global, not collaborative** — no "buyers also
  bought"; the model is favourite-category + rating.
- **Out-of-stock vs. hidden:** the marketplace listing still shows
  quantity-0 products; only recommendations filter them. Aligning the
  listing would change buyer browse behaviour and is out of scope.
- **No pagination on recommendations** (capped at 6 by design).
- **403 instead of 401** for missing/invalid tokens — pre-existing,
  documented as a production hardening item.
- **Purchased-count semantics** count all order statuses (documented in
  §4); a future refinement could exclude REJECTED orders from
  purchase-based metrics.

---

*End of Buyer Analytics + Product Recommendations report.*
