# Project Status Audit — tshirtshop

**Generated:** 2026-02-18 (current state audit)  
**Previous:** 2026-02-18  
**Purpose:** Correlate implementation with documentation and provide recommended next steps.

---

## 1. Executive Summary

The **Darkloom** (tshirtshop) B2C e-commerce platform is in **Phase 1 (Foundation)** with **Phase 3 (Experience)** partially started. Authentication and core infrastructure are implemented. **Product catalog** (DB-003, DB-004, DB-006, CAT-001–CAT-005) is implemented: schema, CRUD API, category browsing, **search**, **faceted filtering** (brand, price range), **sorting** (newest, price, name), seed script, and **frontend wired to live API**. Homepage, shop (search, filters, sort), and product detail pages fetch from the backend. Commerce workflows (cart, checkout, payments) remain to be built.

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 — Foundation | In Progress | ~92% |
| Phase 2 — Commerce | Not Started | 0% |
| Phase 3 — Experience | In Progress | ~25% |

---

## 2. Documentation vs Implementation

### 2.1 Docs Structure (Reference)

| Doc | Purpose |
|-----|---------|
| `START-HERE.md` | Entry point, tech stack, rules |
| `01-REQUIREMENTS/project-overview.md` | Full spec, deliverables |
| `03-ARCHITECTURE/system-architecture.md` | Modular monolith, layers |
| `03-ARCHITECTURE/authentication-architecture.md` | Auth flows, tokens, 2FA |
| `04-TASKS/master-task-board.md` | Task tracking |
| `07-DEVOPS/environment-setup.md` | Local setup, env vars |
| `DESIGN-SPEC.md` | Premium DnD Apparel visual design, brand, layout |

### 2.2 Alignment

- **Architecture:** Implementation follows modular monolith (NestJS modules, Drizzle, better-auth).
- **Auth:** Matches auth architecture (better-auth, JWT, 2FA, password reset).
- **Design:** Frontend mockup implements `DESIGN-SPEC.md` (dark mode, brand colors, typography, layout).
- **Task Board:** Some task statuses are outdated; see Section 4.

---

## 3. Current Implementation Status

### 3.1 Infrastructure (FND-001 to FND-006)

| Task | Doc Status | Actual Status | Notes |
|------|------------|----------------|-------|
| FND-001 | DONE | DONE | Monorepo (Turborepo, npm workspaces) |
| FND-002 | DONE | DONE | NestJS backend configured |
| FND-003 | DONE | DONE | Next.js 16, App Router |
| FND-004 | DONE | DONE | PostgreSQL + Drizzle |
| FND-005 | DONE | DONE | Drizzle ORM; schema in `auth/schema.ts` + `catalog/schema.ts` |
| FND-006 | NOT STARTED | NOT STARTED | No Dockerfiles |

### 3.2 Authentication (AUTH-001 to AUTH-010)

| Task | Doc Status | Actual Status | Notes |
|------|------------|----------------|-------|
| AUTH-001 | DONE | DONE | better-auth + NestJS adapter |
| AUTH-002 | DONE | DONE | Email/password registration |
| AUTH-003 | DONE | DONE | Login |
| AUTH-004 | DONE | DONE | JWT via better-auth |
| AUTH-005 | DONE | DONE | Refresh token rotation |
| AUTH-006 | DONE | DONE | Token revocation (logout) |
| AUTH-007 | NOT STARTED | NOT STARTED | OAuth (Google/Facebook) wired but empty credentials |
| AUTH-008 | NOT STARTED | **PARTIAL** | CAPTCHA optional for dev; works when keys set |
| AUTH-009 | DONE | DONE | Password reset flow implemented |
| AUTH-010 | DONE | DONE | 2FA (TOTP) setup page exists |

**Recent changes (2026-02-14):**

- `RESEND_API_KEY`, `UI_URL`, `RECAPTCHA_SECRET_KEY` made optional for local dev.
- Frontend ReCAPTCHA only renders when `NEXT_PUBLIC_RECAPTCHA_SITEKEY` is set.

**2026-02-18:** Auth forms moved from homepage to `/auth/login`. Homepage now serves e-commerce content. OAuth providers (Google/Facebook) only registered when credentials are set — avoids CLIENT_ID_AND_SECRET_REQUIRED in dev. Middleware route updated to `api/v1/*path` (path-to-regexp v7).

### 3.3 Database Design (DB-001 to DB-007)

| Task | Doc Status | Actual Status | Notes |
|------|------------|----------------|-------|
| DB-001 | **DONE** | **DONE** | ERD in `docs/ERD.md` (auth + catalog) |
| DB-002 | DONE | DONE | Users schema (better-auth: user, session, account, verification, two_factor) |
| DB-003 | DONE | DONE | Products table in `apps/backend/src/catalog/schema.ts` |
| DB-004 | DONE | DONE | Categories table in same file |
| DB-005 | NOT STARTED | **PARTIAL** | Brand as column on product; no separate brands table |
| DB-006 | DONE | DONE | product_image table in catalog schema |
| DB-007 | NOT STARTED | NOT STARTED | No extra indexes on catalog tables yet |

**Current schema:** `apps/backend/src/auth/schema.ts` (auth) + `apps/backend/src/catalog/schema.ts` (category, product, product_image). Drizzle config and DatabaseModule include both. **Run `npx drizzle-kit push` from apps/backend to create catalog tables** if not yet applied.

### 3.4 Product Catalog (CAT-001 to CAT-006)

| Task | Status | Notes |
|------|--------|-------|
| CAT-001 | **DONE** | Product CRUD API: `ProductsController`, `CatalogService`, DTOs; list, getById, create, update, delete |
| CAT-002 | **DONE** | Category browsing: `CategoriesController` list + getById |
| CAT-003 | **DONE** | ILIKE search on name + description; `q` query param; shop page search form |
| CAT-004 | **DONE** | Faceted filtering: brand (distinct brands API), minPrice, maxPrice; shop page filter form; URL params preserved |
| CAT-005 | **DONE** | Sort options: newest (default), price-asc, price-desc, name-asc, name-desc; sort dropdown on shop page |
| CAT-006 | **DONE** | Search suggestions: `GET /api/v1/products/suggestions?q=`; autocomplete dropdown on shop search (products, categories, brands) |

**Implementation:** `apps/backend/src/catalog/` — CatalogModule, ProductsController, CategoriesController, CatalogService, DTOs. `GET /api/v1/products/brands` for distinct brands. Catalog routes use `@AllowAnonymous()` (public). Seed: `npm run db:seed` from apps/backend. **Frontend** uses `lib/api/catalog.ts` (fetchProducts, fetchCategories, fetchProduct, fetchBrands) with absolute URLs for RSC.

### 3.5 Frontend Pages

| Page | Status | Location | Notes |
|------|--------|----------|-------|
| Home | **DONE (API)** | `/` | Hero video (dragon-hero.webm), Featured Drops (API), Editorial, Category nav (API) |
| Product listing | **DONE (API)** | `/shop` | Search form, category filter, product grid; fetches from `/api/v1/products`, `/api/v1/categories` |
| Product detail | **DONE (API)** | `/shop/[id]` | Gallery, size selector, accordion, related products; fetches from API |
| Cart | NOT STARTED | — | — |
| Checkout | NOT STARTED | — | — |
| User account | Partial | `/auth/login` when logged in | Profile card; no dedicated account page |
| Admin dashboard | NOT STARTED | — | — |
| Auth flows | Done | `/auth/login`, `/auth/forgot-password`, etc. | Login, signup, forgot, reset, 2FA setup, verify-email, callback |

**Layout components:** `Header`, `Footer`, `SiteLayout` — responsive, mobile hamburger menu. **Branding:** Darkloom. **API client:** `lib/api/catalog.ts` — uses `API_URL` (default `http://localhost:3000`) for server-side fetch; Next.js rewrites `/api/v1/*` for client.

### 3.6 Design & UX (New)

| Item | Status | Notes |
|------|--------|-------|
| DESIGN-SPEC.md | DONE | Premium DnD Apparel design document |
| Design tokens | DONE | Colors (#0A0A0A, #FF4D00, #7A5FFF, #E6C068), typography (Inter, Space Grotesk) |
| Responsive layout | DONE | Mobile-first, hamburger nav, touch targets (min 44px), small-screen optimizations |
| Dark mode | DONE | Default; design spec compliant |

### 3.7 Commerce & Experience

- **Cart, Checkout, Payments, Orders, Reviews, Admin:** All NOT STARTED.
- **Tests:** Auth unit tests (`jwt-auth.guard`, `auth.controller`, `auth.service`, `dto`). Catalog tests: DTO validation, CatalogService, ProductsController, CategoriesController. All 87 tests pass.
- **Build:** Production build passes (auth-provider type fix, Suspense for useSearchParams).

---

## 4. Environment & Configuration

### 4.1 Required for Full Auth (Production)

| Variable | Required | Default (Dev) |
|----------|----------|---------------|
| `DATABASE_URL` | Yes | — |
| `BETTER_AUTH_SECRET` | Yes | — |
| `UI_URL` | No | `http://localhost:3001` |
| `RESEND_API_KEY` | No (email fails) | — |
| `RECAPTCHA_SECRET_KEY` | No (captcha disabled) | — |
| `NEXT_PUBLIC_RECAPTCHA_SITEKEY` | No (captcha hidden) | — |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For OAuth | — |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | For OAuth | — |

### 4.2 Minimal Dev Setup

- `DATABASE_URL` and `BETTER_AUTH_SECRET` are required.
- Backend and frontend can run without Resend, reCAPTCHA, or OAuth.
- **Catalog:** Run `npm run db:seed` from apps/backend to populate products/categories.
- **Frontend API:** Set `API_URL` in `apps/web/.env.local` if backend runs on a different port (default: `http://localhost:3000`).

---

## 5. Recommended Next Steps

### 5.1 Immediate (Unblock Phase 1 Completion)

1. ~~**Fix auth-provider type error**~~ **DONE** — `twoFactorEnabled?: boolean | null`; Suspense for useSearchParams pages; API error types.

2. ~~**DB-001: ERD**~~ **DONE** — `docs/ERD.md` (Mermaid; auth + catalog; future tables noted).

3. ~~**Optional: Remove `lib/mock-data.ts`**~~ **DONE** — Deleted; homepage, shop, product detail use API.

### 5.2 Short-Term (Complete Phase 1)

4. ~~**CAT-004, CAT-005, CAT-006**~~ **DONE** — Faceted filtering, sorting, and search suggestions (autocomplete dropdown).

5. ~~**TEST-001 to TEST-004**~~ **DONE** — JWT (jwt-auth.guard), validation (auth + catalog DTOs), product model (CatalogService), API integration (products + categories controllers).

6. **AUTH-007:** OAuth (Google/Facebook) — credentials in `.env.example` are placeholders.

7. **FND-006:** Docker setup (per project-overview DevOps requirements).

### 5.3 Medium-Term (Phase 2)

8. **CART-001 to CART-006:** Cart schema and APIs.

9. **ORD-001 to ORD-005:** Order schema and lifecycle.

10. **CHK-001 to CHK-004:** Checkout flow.

11. **PAY-001 to PAY-004:** Payment simulation (Stripe/PayPal sandbox).

### 5.4 Long-Term (Phase 3)

12. **UI-004 to UI-007:** Cart page, checkout page, user account page, admin dashboard.

13. **REV-001 to REV-004:** Reviews system.

14. **ADM-001 to ADM-004:** Admin RBAC and tools.

15. **SEC-001 to SEC-003, PERF-001 to PERF-002:** Security and performance hardening.

---

## 6. Risk & Compliance Notes

| Area | Status | Action |
|------|--------|--------|
| Security | Auth follows best practices | Add rate limiting (SEC-002) when needed |
| Data | No card storage | Maintain as-is |
| Tests | Auth only | Add tests before new features |
| Docker | Not implemented | Required for final deliverable |
| Build | Fixed | Auth-provider type, Suspense, API types — production build passes |
| OAuth | Conditional registration | Providers only added when credentials set; no CLIENT_ID_AND_SECRET_REQUIRED in dev |

---

## 7. Document References

- [START-HERE.md](./START-HERE.md) — Entry point
- [project-overview.md](./01-REQUIREMENTS/project-overview.md) — Requirements
- [master-task-board.md](./04-TASKS/master-task-board.md) — Task tracking
- [system-architecture.md](./03-ARCHITECTURE/system-architecture.md) — Architecture
- [authentication-architecture.md](./03-ARCHITECTURE/authentication-architecture.md) — Auth design
- [environment-setup.md](./07-DEVOPS/environment-setup.md) — Setup guide
- [DESIGN-SPEC.md](./DESIGN-SPEC.md) — Premium DnD Apparel design spec
- [DOCS-VS-IMPLEMENTATION-GAPS.md](./DOCS-VS-IMPLEMENTATION-GAPS.md) — Gap analysis (docs vs code)
- [ERD.md](./ERD.md) — Entity relationship diagram (auth + catalog)

---

## 8. Summary

**Current state:** Phase 1 authentication and infrastructure are largely done. **Catalog** is implemented: schema (DB-003, DB-004, DB-006), CRUD API (CAT-001), category browsing (CAT-002), **search** (CAT-003), **faceted filtering + sorting** (CAT-004, CAT-005), **search suggestions** (CAT-006), seed script, and **frontend wired to live API**. Homepage, shop (search with autocomplete, category, brand, price, sort), and product detail fetch from `/api/v1/products`, `/api/v1/categories`, `/api/v1/products/brands`, `/api/v1/products/suggestions`. Catalog routes use `@AllowAnonymous()`. OAuth providers only registered when credentials are set (avoids CLIENT_ID_AND_SECRET_REQUIRED). Phase 2 (cart, checkout, payments) and most of Phase 3 are not started.

**Recommended next step:** **TEST-001 to TEST-004** (catalog/auth tests) or **Phase 2** (cart, checkout).

---

## 9. Changelog (Audit Updates)

| Date | Changes |
|------|---------|
| 2026-02-18 (current) | CAT-006 DONE (search suggestions, autocomplete); Phase 1 catalog complete; recommended next: tests or Phase 2 |
| 2026-02-18 | CAT-003 DONE (search); forRoutes path fix (api/v1/*path); OAuth providers conditional; Phase 1 ~88% |
| 2026-02-18 | Added frontend mockup status (UI-001, UI-002, UI-003); DESIGN-SPEC.md; responsive design; auth moved to /auth/login; updated phase completion estimates; added Design & UX section; build note (auth-provider type error) |
| 2026-02-14 | Initial audit |

---

*End of audit document*
