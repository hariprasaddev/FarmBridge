# Day 18 — Enterprise UI/UX Redesign · Phase 1 (Global Design System)

**Scope:** Create a production-grade, reusable design system and a unified
enterprise app shell (sidebar + top navbar) — **without touching any backend
code, any API, any business logic, or any page content.** Individual page
redesigns are deferred to Phase 2; this phase only builds the foundation.

---

## 1. Files Created

### Design-system components — `FarmBridge/frontend/src/components/ui/`

| Component | Description |
|---|---|
| `AppLayout.jsx` / `.css` | Global authenticated shell: TopNavbar + optional Sidebar + content area |
| `Sidebar.jsx` / `.css` | Enterprise sidebar — active highlight, collapse/expand (persisted), mobile drawer + backdrop, icons, user profile section, logout |
| `TopNavbar.jsx` / `.css` | Sticky top bar — hamburger (mobile) / collapse toggle (desktop), brand, breadcrumb, search, notification bell, profile dropdown |
| `PageHeader.jsx` / `.css` | Title + subtitle + breadcrumb + primary-action slot (canonical page header) |
| `Breadcrumb.jsx` / `.css` | Trailing breadcrumb with react-icons separators |
| `Card.jsx` / `.css` | Card + `Card.Header` / `Card.Body` / `Card.Footer` sub-components, hover variant |
| `StatCard.jsx` / `.css` | KPI card — icon, accent colors, animated counter (reuses `AnimatedNumber`), trend indicator |
| `Button.jsx` / `.css` | 7 variants (primary/secondary/outline/ghost/danger/success/link), 3 sizes, loading, block, icon slot |
| `Badge.jsx` / `.css` | 6 variants + solid, optional icon |
| `Avatar.jsx` / `.css` | Initials avatar (4 sizes, ring, image support) + exported `getInitials` helper |
| `EmptyState.jsx` / `.css` | Icon + title + description + optional action |
| `SearchBar.jsx` / `.css` | Debounced search input with icon + clear button, compact variant |
| `FilterPanel.jsx` / `.css` | Collapsible filter panel with `Field` sub-component, apply/clear, active count |
| `DataTable.jsx` / `.css` | Column-config table — sortable headers, loading skeleton, empty state |
| `Pagination.jsx` / `.css` | Page numbers, prev/next, ellipsis, item-range info |
| `Modal.jsx` / `.css` | Accessible modal — ESC / backdrop close, focus trap, body scroll lock, 4 sizes |
| `ConfirmDialog.jsx` | Danger/warning/success/info confirm built on Modal with async loading confirm |
| `Skeleton.jsx` / `.css` | text/rect/circle/card/table shimmer variants |
| `Loader.jsx` / `.css` | Spinner with label, block/inline/light variants |
| `ProfileDropdown.jsx` / `.css` | Avatar + name + role badge menu — profile / notifications / logout (keeps legacy `.btn-logout`) |
| `index.js` | Barrel export — `import { Button, Card, … } from '../components/ui'` |

### Other new files

| File | Purpose |
|---|---|
| `src/config/navigation.jsx` | Role-based nav config (FARMER/BUYER/ADMIN) with react-icons + active matchers + common items |

## 2. Files Modified

| File | Change |
|---|---|
| `src/index.css` | **Additive** enterprise theme tokens: full `--fb-*` palette (brand/semantic/gray scales), typography, spacing, radius, shadow, layout metrics, z-index scale, motion, `prefers-reduced-motion` support, global `fb-*` focus ring |
| `src/App.jsx` | Old top `Navbar` replaced with the new `AppLayout` shell; auth-hydration splash guard (fixes a full-reload redirect race); **routing paths untouched** |
| `src/components/Toast.jsx` / `Toast.css` | Same API — now react-icons, 4 variants (success/error/warning/info), bottom-right placement so toasts never cover the topbar |
| `qa/uitest.js` | Logout helper updated for the new profile-dropdown UI (DOM-level clicks + legacy fallbacks) |

## 3. Components Created

21 design-system components (listed above) — every one self-contained
(component + own CSS), consuming only the new `--fb-*` tokens.

## 4. Icons Used (react-icons)

| Menu / action | Icon |
|---|---|
| Dashboard (farmer) | `FaTachometerAlt` |
| Dashboard (admin) | `LuChartBar` |
| Dashboard (buyer) | `MdDashboard` |
| Products / Browse | `FaBoxOpen` / `HiOutlineViewGrid` |
| Orders | `FaShoppingCart` |
| Verification | `FaUserCheck` |
| Wishlist | `FaHeart` |
| Profile | `FaUserCircle` |
| Users | `FaUsers` |
| Notifications | `FaBell` |
| Logout | `FaSignOutAlt` |
| Search / Clear | `FaSearch` / `FaTimes` |
| Filter / Chevrons | `FaFilter` / `FaChevronUp/Down/Left/Right` |
| Modal close / Sort | `FaTimes` / `FaSort`, `FaSortUp`, `FaSortDown` |
| Empty states | `FaInbox` |
| Toast icons | `FaCheckCircle`, `FaExclamationCircle`, `FaExclamationTriangle`, `FaInfoCircle` |
| Brand / misc | `FaLeaf`, `FaBars`, `FaArrowUp/Down`, `FaMinus` |

## 5. Responsive Improvements

- **Sidebar**: fixed 248px desktop rail → collapses to a 76px icon rail
  (smooth `cubic-bezier` width transition, persisted to localStorage) → becomes
  an overlay **drawer with backdrop** below 1024px.
- **TopNavbar**: hamburger on mobile (opens drawer), collapse chevron on
  desktop; search + breadcrumb hide on small screens; brand always visible.
- **Modals** cap at `88vh` with internal scroll; toasts move to bottom-right
  (never block the topbar).
- **Tables** scroll horizontally in a wrapper; stat grids/pagination wrap.
- Global `prefers-reduced-motion` support.

## 6. Accessibility

- Focus trap + ESC + backdrop close + `aria-modal`/`aria-label` + focus
  restore in `Modal`; `aria-expanded`/`aria-haspopup` on dropdowns; `role`
  semantics (`dialog`, `menu`, `menuitem`, `navigation`, `status`, `alert`).
- `aria-current="page"` on active nav items; visible `focus-visible` ring on
  every `fb-*` control; color tokens keep WCAG AA contrast on primary actions.
- Keyboard-friendly (all interactive elements are real buttons/links).

## 7. Shell integration (no routing changes)

- **Buyer pages & farmer sub-pages** now use the new TopNavbar + Sidebar.
- **Admin pages** keep their existing `AdminLayout` shell (own sidebar) and
  gain the new TopNavbar above it — same stacking as before (both shells use
  `margin-top: -1rem` + z-index 90 under the new z-120 topbar).
- **Farmer Dashboard** keeps its own sidebar; gets the new TopNavbar.
- Every old nav label is preserved (Dashboard, My Products, Browse Products,
  My Orders, Wishlist, Verification, Users, …) so existing flows keep working.

## 8. Build Result

- `npm run build` — **success, 0 errors, 0 warnings** (`✓ built in 4.15s`).
- No new dependencies — `react-icons` was already installed (Day 17).

## 9. Verification (regression)

| Suite | Result |
|---|---|
| `npm run build` | ✅ clean |
| Full UI E2E (`qa/uitest.js`, all roles + verification + analytics) | ✅ **54 PASS / 0 FAIL** |
| Protected-route redirect | ✅ |
| Browser check: sidebar collapse, mobile drawer, topbar elements (brand/bell/profile/breadcrumb/search) | ✅ |
| Backend | untouched — no changes |

Screenshots: `qa/screenshots/day18-enterprise-shell.png`,
`day18-sidebar-collapsed.png`, `day18-mobile-topbar.png`, `day18-mobile-drawer.png`
(plus all pre-existing dashboard/flow screenshots re-captured during the suite).

## 10. Bugs found & fixed

| Bug | Fix |
|---|---|
| Full reload on a protected URL (e.g. `/buyer/products`) bounced to `/login` → dashboard | Auth-hydration splash guard in `App.jsx` — wait for `loading` before choosing the route tree |
| QA logout stalled (20s) after creating a product — toast (top-right, z-700) covered the profile trigger | Toasts moved to **bottom-right**; QA logout helper now uses DOM-level clicks |
| Brand invisible on sidebar layouts (topbar z-120 covered sidebar logo row; brand only rendered when sidebar hidden) | Brand now always rendered in the TopNavbar |
| Dead nav item: BUYER "My Reviews" → `/buyer/reviews` (no route; bounced users) | Removed from `NAV_CONFIG` |
| Dead prop `onToggleCollapse` on Sidebar (toggle lives in TopNavbar) | Removed |
| Sidebar user chip was a `<button>` with no action | Now a `<div>` |
| Dead "Settings" menu item in ProfileDropdown (navigated to `/` → redirect loop) | Removed |
| `LuBarChart3` / `FaSprout` not exported by installed react-icons | `LuChartBar` / `FaLeaf` |

## 11. Phase 2 ready

All pages can now be migrated incrementally onto the design system
(`PageHeader`, `Card`, `StatCard`, `DataTable`, `Button`, `Badge`, `Modal`,
`ConfirmDialog`, `EmptyState`, `Skeleton`, `Loader`, `FilterPanel`,
`Pagination`, `SearchBar`) without architectural changes.
