# Day 16 — Farmer Verification Workflow (End-to-End) — Milestone Report

> **Date:** 2026-08-05
> **Module:** Farmer Verification (registration → submission → admin approval → selling)
> **Status:** ✅ Complete — all builds and test suites green

---

## 1. Files Created

### Backend (`FarmBridge/src/main/java/com/farmbridge/`)
| File | Purpose |
|---|---|
| `entity/VerificationStatus.java` | Enum `PENDING` / `APPROVED` / `REJECTED` |
| `dto/FarmerVerificationRequest.java` | Multipart form fields with bean validation (incl. `ORGANIC/NATURAL/CHEMICAL/MIXED` pattern) |
| `dto/RejectVerificationRequest.java` | Admin rejection body (`reason` @NotBlank, ≤1000 chars) |

### Frontend (`FarmBridge/frontend/src/`)
| File | Purpose |
|---|---|
| `pages/FarmerVerificationPage.jsx` | Verification form (personal/farm/cultivation/docs) + PENDING / REJECTED / APPROVED screens with resubmit |
| `pages/FarmerVerificationPage.css` | Styles for the verification page (scoped `fv-` prefix) |

### Tests & QA
| File | Purpose |
|---|---|
| `FarmBridge/src/test/java/com/farmbridge/FarmerVerificationFlowIntegrationTest.java` | 10-test Spring integration suite for the full workflow |
| `qa/FixLegacyVerification.java` | One-time migration: legacy `verified=true` profiles → `APPROVED` (kept for reference) |

---

## 2. Files Modified

### Backend
| File | Change |
|---|---|
| `entity/FarmerProfile.java` | Added personal (fullName, mobileNumber, aadhaarNumber, village, mandal, district, state), farm (farmAddress, surveyNumber), cultivation (farmingExperience), documents (farmerPhoto/landCertificate/farmPhoto/organicCertificate URLs), `verificationStatus`, `rejectionReason`, `submittedAt`; `verified` boolean kept in sync; helpers `isApproved()`/`isPending()` |
| `dto/FarmerProfileResponse.java` | Added `verified`, `verificationStatus`, `rejectionReason`, `submittedAt`, `fullName`; removed unused legacy constructor |
| `dto/FarmerVerificationResponse.java` | Expanded to the full verification profile (27 fields) |
| `repository/FarmerProfileRepository.java` | Added `findByVerificationStatus`, `countByVerificationStatus` |
| `service/FarmerProfileService.java` | Added `submitVerification` (multipart docs, required-doc checks, keeps existing docs on resubmit, cleans replaced/orphaned files, `@Transactional`) and `getVerification` |
| `service/AdminService.java` / `AdminServiceImpl.java` | Added `rejectFarmer`; `verifyFarmer` → APPROVED; pending lists/stats now use `PENDING` status; full response mapping; guard against rejecting approved farmers |
| `service/ProductService.java` / `ProductServiceImpl.java` | `assertFarmerVerified` on create/update/delete/image ops (403); buyer lists filtered to APPROVED farmers; `getBuyerProductById` (404 for hidden); `getAllProductsForAdmin` (unfiltered oversight); `farmerVerified` derived from status |
| `service/OrderServiceImpl.java` | `placeOrder` and `updateOrderStatus` require an APPROVED farmer (403) |
| `controller/FarmerProfileController.java` | Added `GET/POST /api/farmer/profile/verification` (multipart `@ModelAttribute` + `@RequestPart`), Swagger `@Tag/@Operation/@SecurityRequirement` |
| `controller/AdminController.java` | Added `PUT /api/admin/farmers/{profileId}/reject` |
| `controller/BuyerProductController.java` | Product details now uses `getBuyerProductById` |
| `exception/GlobalExceptionHandler.java` | `"not been verified"` → **403** in the message-based status mapper |

### Frontend
| File | Change |
|---|---|
| `services/api.js` | Added `farmerVerificationAPI` (GET/POST) and `adminAPI.rejectFarmer` |
| `App.jsx` | Added `/farmer/verification` route |
| `pages/FarmerDashboard.jsx` + css | Verification banner (PENDING/REJECTED/not-submitted), "Verification" stat card + nav item, hero CTA + pill driven by status, Add-Product quick action locked until APPROVED |
| `pages/ProductsPage.jsx` + css | Gated Add/Edit/Delete behind approval; locked tiles/buttons + warning banner |
| `components/ProductCard.jsx` | `locked` prop — hides edit/delete and shows a lock note |
| `pages/AdminVerificationPage.jsx` + css | Rewritten: pending list with village/district/cultivation/submission date, View-Details dialog with documents, Approve, Reject-with-reason dialog |
| `pages/BuyerProductsPage.jsx` + css | **Verified Farmer** badge on product cards |
| `index.css` | Added `.alert-warning` utility |

### Docs & QA
| File | Change |
|---|---|
| `docs/05_API_CONTRACT.md` | v1.1 — new endpoints 3.2.9/3.2.10/3.4.13, DTO schemas 5.11–5.13, 403 business note, endpoint summary 34 → 37 |
| `qa/backend_test.sh` | 24 new verification checks (submit, 403 gates, reject/resubmit, missing/invalid docs, admin flow); admin seeding moved earlier; fixed order-isolation substring-match flake |
| `qa/uitest.js` | 14 new UI checks: register → submit → admin approve/reject → resubmit → approved → create product → buyer badge |

---

## 3. Business Rules

1. **Registration is unchanged** — a farmer account is created with `verified = false` and `verificationStatus = PENDING`; it **cannot sell** until approved.
2. **Submission** requires: full name, 10-digit mobile, village/mandal/district/state, farm name/address/size, cultivation method (one of ORGANIC/NATURAL/CHEMICAL/MIXED), main crops, farming experience + **3 required documents** (farmer photo, land certificate, farm photo) and an optional organic certificate.
3. **PENDING** → farmer sees *"Your verification request is under review"*; product Create/Update/Delete are hidden in the UI **and** blocked by the backend with **403** `"Your farmer account has not been verified yet."`
4. **REJECTED** → farmer sees *"Verification rejected. Reason: \<reason\>. Please update your information and resubmit."*; editing + resubmitting is allowed and resets the request to PENDING (already-uploaded documents are kept).
5. **APPROVED** → farmer is a *"Verified Farmer"*; all product features and order receiving are unlocked.
6. **Receiving orders** also requires approval: `POST /api/buyer/orders` and `PUT /api/farmer/orders/{id}/status` check the seller's status.
7. **Buyer visibility** — only products of APPROVED farmers appear in listings, category/search results, product details and wishlists.
8. **Admin rejection** requires a non-blank reason (≤1000 chars); only PENDING requests can be rejected.
9. **Admin product oversight** (`GET /api/admin/products`) remains unfiltered — admins see every product regardless of verification status.
10. **N+1 avoidance** — buyer filters batch-load farmer profiles (`findByUserEmailIn`) and rating stats in single queries.

---

## 4. Backend Endpoints (new/changed)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/farmer/profile/verification` | FARMER | My verification status + full profile (404 if none) |
| `POST` | `/api/farmer/profile/verification` | FARMER | Submit / resubmit verification (multipart fields + 3–4 documents) |
| `PUT` | `/api/admin/farmers/{profileId}/verify` | ADMIN | Approve → APPROVED (was: boolean verify) |
| `PUT` | `/api/admin/farmers/{profileId}/reject` | ADMIN | Reject with mandatory reason → REJECTED |
| `GET` | `/api/admin/farmers/unverified` | ADMIN | Now returns only PENDING requests with full details |
| `GET` | `/api/admin/products` | ADMIN | Unfiltered (all products) |
| `POST/PUT/DELETE` | `/api/farmer/products/**` | FARMER | 403 until APPROVED |
| `POST` | `/api/buyer/orders` | BUYER | 403 when the seller is not APPROVED |
| `PUT` | `/api/farmer/orders/{id}/status` | FARMER | 403 until APPROVED |
| `GET` | `/api/buyer/products` & `/{id}` & `/category/{c}` | BUYER | Filtered to APPROVED farmers |

---

## 5. Frontend Pages

| Page | Change |
|---|---|
| `/farmer/verification` (new) | Multi-section form with document uploads; PENDING / REJECTED (reason + resubmit) / APPROVED screens |
| `/farmer/dashboard` | Status banner, status pill/CTA, locked "Add New Product", Verification nav item + stat card |
| `/farmer/products` | Add/Edit/Delete gated; locked tiles and warning banner until approved |
| `/admin/verification` | Pending list + details dialog (documents/photos/submission date) + Approve + Reject-with-reason dialog |
| `/buyer/products` | **Verified Farmer** badge on cards; only approved farmers' products |
| `/buyer/products/:id` | Verified badge (existing) now reflects the approval status |

---

## 6. Security Rules

- Only **FARMER** can submit/get verification (`/api/farmer/**` → ROLE_FARMER).
- Only **ADMIN** can approve/reject (`/api/admin/**` → ROLE_ADMIN).
- **BUYER** cannot access any verification endpoint (403 via role matchers).
- Document uploads reuse the existing magic-byte image validation (JPG/PNG/WEBP/GIF, ≤5 MB) and UUID filenames (no path traversal).
- Unverified/rejected farmers are blocked from selling at the **service layer** (403), so UI gating is a UX layer, not the security boundary.
- Self-registration still cannot create ADMIN accounts.

---

## 7. Build Results

| Command | Result |
|---|---|
| `./mvnw compile` | ✅ BUILD SUCCESS |
| `./mvnw test` | ✅ 18 tests, 0 failures (10 verification + 7 password-reset + 1 context) |
| `npm run build` | ✅ 148 modules, built in ~1.2s, no warnings |

---

## 8. End-to-End Testing Results

### Backend API suite (`qa/backend_test.sh`)
- **TOTAL PASS: 179 — TOTAL FAIL: 0** (was 154 before this milestone; +24 verification checks)
- Covered: register → submit verification (PENDING) → 403 on product create/update → BUYER/anonymous blocked → missing documents 400 → invalid upload 400 → bad mobile 400 → admin lists pending → approve → reject with reason → reject without reason 400 → farmer sees reason → rejected farmer blocked → resubmit (keeps docs) → PENDING → approve → create/delete product → buyer visibility & verified flag.

### UI E2E suite (`qa/uitest.js`, puppeteer)
- **PASS: 41 — FAIL: 0**
- Covered end-to-end in the browser: farmer registers → dashboard pending banner + locked action → submits form with 3 uploaded documents → PENDING screen → admin rejects farmer #2 with reason → admin approves farmer #1 → rejected farmer sees reason → resubmits → PENDING → approved farmer sees **Verified Farmer** → creates a product → buyer sees the **Verified Farmer** badge on that product card.
- 14 screenshots captured in `qa/screenshots/` (pending / rejected / approved / admin actions / buyer badge).

---

## 9. Bugs Found

| # | Bug | Severity | Where |
|---|---|---|---|
| 1 | Wishlist response could contain `null` entries when a wishlisted product's farmer was no longer APPROVED (products filtered out by `getProductsByIds` but entries mapped 1:1) | Medium | `WishlistServiceImpl.getWishlist` |
| 2 | Orphaned files on disk if a later document upload failed mid-submission (earlier stored files were only cleaned on DB-save failure) | Low | `FarmerProfileService.submitVerification` |
| 3 | `cultivationMethod` accepted any string at the API (business rule not enforced server-side) | Low | `FarmerVerificationRequest` |
| 4 | Admin endpoint could reject an already-APPROVED farmer (workflow state machine not enforced) | Low | `AdminServiceImpl.rejectFarmer` |
| 5 | Dead code: no-op `setVerification(prev => prev)` in resubmit handler; unused legacy 7-arg `FarmerProfileResponse` constructor | Info | Frontend/backend |
| 6 | QA flake: order-isolation check used substring grep on order IDs (`66` matched `661`) | Test | `qa/backend_test.sh` |
| 7 | (Found in earlier milestone, verified here) Missing static product images returned HTTP 500 instead of 404 | — | `GlobalExceptionHandler` (fixed previously) |

---

## 10. Bugs Fixed

- **Fixed #1** — `WishlistServiceImpl` filters out null entries (`.filter(Objects::nonNull)`).
- **Fixed #2** — document storage wrapped in try/catch; already-written files are deleted when a later upload fails; replaced documents deleted only when actually replaced.
- **Fixed #3** — `@Pattern("^(ORGANIC|NATURAL|CHEMICAL|MIXED)$")` on `cultivationMethod`.
- **Fixed #4** — reject guard: `"Only pending verification requests can be rejected"`.
- **Fixed #5** — removed the no-op and the unused constructor.
- **Fixed #6** — exact order-ID match via JSON parsing in the QA script.
- **Fixed #7 (carried)** — `NoResourceFoundException` handler returns 404 so the frontend image fallback works.

All fixes re-verified: backend suite **179/179**, `./mvnw test` **18/18**, UI suite **41/41**.

---

## 11. Final Verification Report

| Requirement | Status |
|---|---|
| Farmer registers (verified=false, status=PENDING by default) | ✅ |
| Farmer submits verification (personal/farm/cultivation + documents) | ✅ |
| PENDING screen: "Your verification request is under review" + product actions hidden/blocked (403) | ✅ |
| REJECTED screen: reason shown + edit & resubmit allowed | ✅ |
| APPROVED: "Verified Farmer" + all product features unlocked | ✅ |
| Admin module: pending list, details (farm/village/district/cultivation/documents/submission date) | ✅ |
| Admin actions: Approve; Reject with mandatory stored reason | ✅ |
| 403 `"Your farmer account has not been verified yet."` on Create/Update/Delete product + order receiving | ✅ |
| Buyer sees only APPROVED farmers' products | ✅ |
| **Verified Farmer** badge on product cards and product details | ✅ |
| Only FARMER submits; only ADMIN approves/rejects; BUYER blocked | ✅ |
| Swagger documentation + structured error handling | ✅ |
| Transactions, N+1 avoidance, existing layered architecture | ✅ |
| `./mvnw compile` / `./mvnw test` / `npm run build` | ✅ |
| E2E: register → submit → admin view → approve → create product → buyer sees badge; reject + resubmit; unauthorized access; missing documents; invalid uploads | ✅ |

**Overall: PASS — Farmer Verification Workflow is complete and fully tested.**
