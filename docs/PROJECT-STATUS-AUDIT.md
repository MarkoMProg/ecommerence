# Project Status Audit — tshirtshop

**Generated:** 2026-02-18 (current state audit)  
**Previous:** 2026-02-18  
**Purpose:** Correlate implementation with documentation and provide recommended next steps.

---

## 1. Executive Summary

The **Darkloom** (tshirtshop) B2C e-commerce platform is in **Phase 1 (Foundation)** with **Phase 3 (Experience)** partially started. Authentication and core infrastructure are implemented. **Product catalog schema** (DB-003, DB-004, DB-006) is implemented in the backend; catalog APIs (CAT-001) are not yet built. A **frontend mockup** (homepage with hero video, shop, product detail) is complete with mock data and responsive layout. Commerce workflows and real API integration remain to be built.

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 — Foundation | In Progress | ~75% |
| Phase 2 — Commerce | Not Started | 0% |
| Phase 3 — Experience | In Progress | ~20% |

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
| AUTH-009 | IN PROGRESS | **DONE** | Password reset flow implemented |
| AUTH-010 | IN PROGRESS | **DONE** | 2FA (TOTP) setup page exists |

**Recent changes (2026-02-14):**

- `RESEND_API_KEY`, `UI_URL`, `RECAPTCHA_SECRET_KEY` made optional for local dev.
- Frontend ReCAPTCHA only renders when `NEXT_PUBLIC_RECAPTCHA_SITEKEY` is set.

**2026-02-18:** Auth forms moved from homepage to `/auth/login`. Homepage now serves e-commerce content.

### 3.3 Database Design (DB-001 to DB-007)

| Task | Doc Status | Actual Status | Notes |
|------|------------|----------------|-------|
| DB-001 | NOT STARTED | NOT STARTED | No ERD |
| DB-002 | DONE | DONE | Users schema (better-auth: user, session, account, verification, two_factor) |
| DB-003 | NOT STARTED | **DONE** | Products table in `apps/backend/src/catalog/schema.ts` |
| DB-004 | NOT STARTED | **DONE** | Categories table in same file |
| DB-005 | NOT STARTED | **PARTIAL** | Brand as column on product; no separate brands table |
| DB-006 | NOT STARTED | **DONE** | product_image table in catalog schema |
| DB-007 | NOT STARTED | NOT STARTED | No extra indexes on catalog tables yet |

**Current schema:** `apps/backend/src/auth/schema.ts` (auth) + `apps/backend/src/catalog/schema.ts` (category, product, product_image). Drizzle config and DatabaseModule include both. **Run `npx drizzle-kit push` from apps/backend to create catalog tables** if not yet applied.

### 3.4 Product Catalog (CAT-001 to CAT-006)

| Task | Status | Notes |
|------|--------|-------|
| CAT-001 | NOT STARTED | No product CRUD API |
| CAT-002 | NOT STARTED | No category browsing API |
| CAT-003 | NOT STARTED | No search |
| CAT-004 | NOT STARTED | No faceted filtering |
| CAT-005 | NOT STARTED | No sorting |
| CAT-006 | NOT STARTED | No suggestions |

**Note:** Frontend mockup uses `lib/mock-data.ts` for products/categories. Replace with API calls when CAT-001+ are implemented.

### 3.5 Frontend Pages

| Page | Status | Location | Notes |
|------|--------|----------|-------|
| Home | **DONE (mockup)** | `/` | Hero video (dragon-hero.webm), Featured Drops, Editorial, Category nav |
| Product listing | **DONE (mockup)** | `/shop` | Filters, product grid, mock data |
| Product detail | **DONE (mockup)** | `/shop/[id]` | Gallery, size selector, accordion, related products |
| Cart | NOT STARTED | — | — |
| Checkout | NOT STARTED | — | — |
| User account | Partial | `/auth/login` when logged in | Profile card; no dedicated account page |
| Admin dashboard | NOT STARTED | — | — |
| Auth flows | Done | `/auth/login`, `/auth/forgot-password`, etc. | Login, signup, forgot, reset, 2FA setup, verify-email, callback |

**Layout components:** `Header`, `Footer`, `SiteLayout` — responsive, mobile hamburger menu. **Branding:** Darkloom (site name in header, footer, layout title).

### 3.6 Design & UX (New)

| Item | Status | Notes |
|------|--------|-------|
| DESIGN-SPEC.md | DONE | Premium DnD Apparel design document |
| Design tokens | DONE | Colors (#0A0A0A, #FF4D00, #7A5FFF, #E6C068), typography (Inter, Space Grotesk) |
| Responsive layout | DONE | Mobile-first, hamburger nav, touch targets (min 44px), small-screen optimizations |
| Dark mode | DONE | Default; design spec compliant |

### 3.7 Commerce & Experience

- **Cart, Checkout, Payments, Orders, Reviews, Admin:** All NOT STARTED.
- **Tests:** Auth unit tests exist (`jwt-auth.guard`, `auth.controller`, `auth.service`, `dto`). No product/catalog tests.
- **Build:** Known type error in `auth-provider.tsx` (twoFactorEnabled: `null` vs `boolean | undefined`) prevents full production build. Dev server runs.

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

---

## 5. Recommended Next Steps

### 5.1 Immediate (Unblock Phase 1 Completion)

1. **Apply catalog schema to database**
   - From `apps/backend`: run `npx drizzle-kit push` (or `npm run db:push`) to create category, product, product_image tables.

2. **CAT-001: Product CRUD API**
   - Create `CatalogModule` with products (and categories) controller/service.
   - Implement create, read, update, delete for products; list categories.
   - Follow `docs/06-STANDARDS/api-guidelines.md`.

3. **Wire frontend mockup to API**
   - Replace `lib/mock-data.ts` with API calls when CAT-001 is done.
   - Add loading/error states.

4. **Fix auth-provider type error**
   - Resolve `twoFactorEnabled` type mismatch to unblock production build.

5. **DB-001: ERD**
   - Create ERD for auth + catalog (and future cart/orders).
   - Store in `docs/` or a dedicated diagrams folder.

6. **Update master-task-board.md**
   - DB-003, DB-004, DB-006: DONE; DB-005: PARTIAL
   - AUTH-008: PARTIAL (CAPTCHA optional)
   - AUTH-009: DONE
   - AUTH-010: DONE
   - UI-001: DONE (mockup)
   - UI-002: DONE (mockup)
   - UI-003: DONE (mockup)

### 5.2 Short-Term (Complete Phase 1)

7. **CAT-002 to CAT-006:** Category browsing, search, faceted filtering, sorting, suggestions.

8. **TEST-001 to TEST-004:** JWT, validation, product model, API integration tests.

9. **AUTH-007:** OAuth (Google/Facebook) — credentials in `.env.example` are placeholders.

10. **FND-006:** Docker setup (per project-overview DevOps requirements).

### 5.3 Medium-Term (Phase 2)

11. **CART-001 to CART-006:** Cart schema and APIs.

12. **ORD-001 to ORD-005:** Order schema and lifecycle.

13. **CHK-001 to CHK-004:** Checkout flow.

14. **PAY-001 to PAY-004:** Payment simulation (Stripe/PayPal sandbox).

### 5.4 Long-Term (Phase 3)

15. **UI-004 to UI-007:** Cart page, checkout page, user account page, admin dashboard.

16. **REV-001 to REV-004:** Reviews system.

17. **ADM-001 to ADM-004:** Admin RBAC and tools.

18. **SEC-001 to SEC-003, PERF-001 to PERF-002:** Security and performance hardening.

---

## 6. Risk & Compliance Notes

| Area | Status | Action |
|------|--------|--------|
| Security | Auth follows best practices | Add rate limiting (SEC-002) when needed |
| Data | No card storage | Maintain as-is |
| Tests | Auth only | Add tests before new features |
| Docker | Not implemented | Required for final deliverable |
| Build | Type error in auth-provider | Fix before production deploy |

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

---

## 8. Summary

**Current state:** Phase 1 authentication and infrastructure are largely done. **Catalog schema (DB-003, DB-004, DB-006)** is implemented in code (`apps/backend/src/catalog/schema.ts`); run `db:push` to create tables. A **frontend mockup** (homepage with hero video, shop, product detail) is implemented per DESIGN-SPEC.md with responsive layout, Darkloom branding, and mock data. **CAT-001 (Product CRUD API)** is the main gap to wire real data. Phase 2 and most of Phase 3 are not started.

**Recommended next step:** Run **`npx drizzle-kit push`** from apps/backend to apply catalog tables, then implement **CAT-001 (Product CRUD API)** and wire the frontend to it.

---

## 9. Changelog (Audit Updates)

| Date | Changes |
|------|---------|
| 2026-02-18 (current) | DB-003, DB-004, DB-006 DONE (catalog schema); DB-005 PARTIAL (brand on product); FND-005 note (dual schema); hero video + Darkloom branding; recommended steps reordered (db:push, then CAT-001) |
| 2026-02-18 | Added frontend mockup status (UI-001, UI-002, UI-003); DESIGN-SPEC.md; responsive design; auth moved to /auth/login; updated phase completion estimates; added Design & UX section; build note (auth-provider type error) |
| 2026-02-14 | Initial audit |

---

*End of audit document*
