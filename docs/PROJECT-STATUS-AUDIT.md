# Project Status Audit — tshirtshop

**Generated:** 2026-02-14  
**Purpose:** Correlate implementation with documentation and provide recommended next steps.

---

## 1. Executive Summary

The **tshirtshop** B2C e-commerce platform is in **Phase 1 (Foundation)**. Authentication and core infrastructure are largely implemented. Product catalog, commerce workflows, and most frontend pages are not yet built.

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 — Foundation | In Progress | ~60% |
| Phase 2 — Commerce | Not Started | 0% |
| Phase 3 — Experience | Not Started | 0% |

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

### 2.2 Alignment

- **Architecture:** Implementation follows modular monolith (NestJS modules, Drizzle, better-auth).
- **Auth:** Matches auth architecture (better-auth, JWT, 2FA, password reset).
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
| FND-005 | DONE | DONE | Drizzle ORM, schema in `auth/schema.ts` |
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

### 3.3 Database Design (DB-001 to DB-007)

| Task | Doc Status | Actual Status | Notes |
|------|------------|----------------|-------|
| DB-001 | NOT STARTED | NOT STARTED | No ERD |
| DB-002 | DONE | DONE | Users schema (better-auth: user, session, account, verification, two_factor) |
| DB-003 | NOT STARTED | NOT STARTED | No products table |
| DB-004 | NOT STARTED | NOT STARTED | No categories |
| DB-005 | NOT STARTED | NOT STARTED | No brands |
| DB-006 | NOT STARTED | NOT STARTED | No images table |
| DB-007 | NOT STARTED | NOT STARTED | No indexes beyond auth |

**Current schema:** `apps/backend/src/auth/schema.ts` — auth-only. Drizzle config points only to this file.

### 3.4 Product Catalog (CAT-001 to CAT-006)

| Task | Status | Notes |
|------|--------|-------|
| CAT-001 | NOT STARTED | No product CRUD |
| CAT-002 | NOT STARTED | No category browsing |
| CAT-003 | NOT STARTED | No search |
| CAT-004 | NOT STARTED | No faceted filtering |
| CAT-005 | NOT STARTED | No sorting |
| CAT-006 | NOT STARTED | No suggestions |

### 3.5 Frontend Pages

| Page | Status | Location |
|------|--------|----------|
| Home | Partial | Auth-focused (login/signup/forgot) |
| Product listing | NOT STARTED | — |
| Product detail | NOT STARTED | — |
| Cart | NOT STARTED | — |
| Checkout | NOT STARTED | — |
| User account | Partial | `/users/profile` API, no dedicated page |
| Admin dashboard | NOT STARTED | — |
| Auth flows | Done | Login, signup, forgot, reset, 2FA setup, verify-email, callback |

### 3.6 Commerce & Experience

- **Cart, Checkout, Payments, Orders, Reviews, Admin:** All NOT STARTED.
- **Tests:** Auth unit tests exist (`jwt-auth.guard`, `auth.controller`, `auth.service`, `dto`). No product/catalog tests.

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

1. **DB-003: Products schema**
   - Add `product`, `category`, `brand`, `image` tables per project-overview.
   - Extend `drizzle.config.ts` to include new schema files.
   - Run `db:push` or migrations.

2. **DB-001: ERD**
   - Create ERD for auth + catalog (and future cart/orders).
   - Store in `docs/` or a dedicated diagrams folder.

3. **CAT-001: Product CRUD API**
   - Create `CatalogModule` with products controller/service.
   - Implement create, read, update, delete for products.
   - Follow `docs/06-STANDARDS/api-guidelines.md`.

4. **Update master-task-board.md**
   - AUTH-008: PARTIAL (CAPTCHA optional)
   - AUTH-009: DONE
   - AUTH-010: DONE

### 5.2 Short-Term (Complete Phase 1)

5. **CAT-002 to CAT-006:** Category browsing, search, faceted filtering, sorting, suggestions.

6. **TEST-001 to TEST-004:** JWT, validation, product model, API integration tests.

7. **AUTH-007:** OAuth (Google/Facebook) — credentials in `.env.example` are placeholders.

8. **FND-006:** Docker setup (per project-overview DevOps requirements).

### 5.3 Medium-Term (Phase 2)

9. **CART-001 to CART-006:** Cart schema and APIs.

10. **ORD-001 to ORD-005:** Order schema and lifecycle.

11. **CHK-001 to CHK-004:** Checkout flow.

12. **PAY-001 to PAY-004:** Payment simulation (Stripe/PayPal sandbox).

### 5.4 Long-Term (Phase 3)

13. **UI-001 to UI-007:** Full frontend pages (product listing, detail, cart, checkout, account, admin).

14. **REV-001 to REV-004:** Reviews system.

15. **ADM-001 to ADM-004:** Admin RBAC and tools.

16. **SEC-001 to SEC-003, PERF-001 to PERF-002:** Security and performance hardening.

---

## 6. Risk & Compliance Notes

| Area | Status | Action |
|------|--------|--------|
| Security | Auth follows best practices | Add rate limiting (SEC-002) when needed |
| Data | No card storage | Maintain as-is |
| Tests | Auth only | Add tests before new features |
| Docker | Not implemented | Required for final deliverable |

---

## 7. Document References

- [START-HERE.md](./START-HERE.md) — Entry point
- [project-overview.md](./01-REQUIREMENTS/project-overview.md) — Requirements
- [master-task-board.md](./04-TASKS/master-task-board.md) — Task tracking
- [system-architecture.md](./03-ARCHITECTURE/system-architecture.md) — Architecture
- [authentication-architecture.md](./03-ARCHITECTURE/authentication-architecture.md) — Auth design
- [environment-setup.md](./07-DEVOPS/environment-setup.md) — Setup guide

---

## 8. Summary

**Current state:** Phase 1 authentication and infrastructure are largely done. Product catalog and database schema are the main gaps. Phase 2 and 3 are not started.

**Recommended next step:** Implement **DB-003 (Products schema)** and **CAT-001 (Product CRUD API)** to unblock catalog and frontend product pages.

---

*End of audit document*
