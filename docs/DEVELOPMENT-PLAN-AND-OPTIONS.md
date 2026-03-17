# Development Plan and Options — Partial & Missing Features

**Date:** 2026-03-17  
**Purpose:** Plan fixes for partial/missing features from testing.md, correlated with task.md, PROJECT-STATUS-AUDIT.md, and full codebase audit.  
**Use:** Request development by option number or phase.

---

## 1. Codebase Audit Summary

### 1.1 Current State

| Area | Status | Tests | Notes |
|------|--------|-------|-------|
| **Auth** | ~98% | Pass | Email/password, Google OAuth, 2FA, password reset. Facebook OAuth not configured. CAPTCHA optional. |
| **Catalog** | 100% | Pass | CRUD, search, filters, sort, suggestions, weight/dimensions. |
| **Cart** | 100% | Pass | Guest + persistent, recommendations, 399 tests. |
| **Checkout** | 100% | Pass | Address validation, coupons, Stripe, order creation. |
| **Orders** | 100% | Pass | Lifecycle, cancel, refund, BullMQ queue, success/failed emails. |
| **Reviews** | 100% | Pass | Star rating, helpful voting. |
| **Admin** | 100% | Pass | Products, orders, users, reviews, bulk upload, 2FA required. |
| **Docker** | 0% | — | FND-006 NOT STARTED. |
| **CI/CD** | 0% | — | No `.github/workflows`. |
| **Observability** | 0% | — | No dashboards, metrics, alerts. |
| **E2E** | Blocked | — | Tests exist; better-auth ESM prevents Jest from running. |

### 1.2 task.md Correlation

| task.md Section | Completion | Gaps |
|-----------------|------------|------|
| Project 1 (Foundation) | ~98% | AUTH-007 (Facebook), AUTH-008 (CAPTCHA enforcement), FND-006 (Docker) |
| Project 2 (Commerce) | ~90% | Message queue: BullMQ used (not RabbitMQ/Kafka); order confirmation email ✅ |
| Project 3 (Experience) | ~70% | Contact form backend, Terms/FAQ, admin categories CRUD, product images multiple sizes |
| Extra — Docker | 0% | FND-006 |
| Integrator | 0% | Full CI/CD pipeline |
| Observability | 0% | Dashboards, metrics, alerts |

### 1.3 master-task-board.md Status

| Task | Status |
|------|--------|
| FND-006 | NOT STARTED |
| AUTH-007 | IN PROGRESS (Google done) |
| AUTH-008 | NOT STARTED |
| DB-005 | NOT STARTED (brand as column) |
| DB-007 | NOT STARTED (indexes) |
| PERF-001 | NOT STARTED (caching) |

---

## 2. Partial & Missing Features — Prioritized

### 2.1 High Priority (Mandatory Gaps)

| # | Feature | testing.md | task.md | Effort | Notes |
|---|---------|------------|---------|--------|-------|
| **H1** | Docker | All phases | FND-006, Extra | Medium | Dockerfiles for backend + web; docker-compose; one-command startup |
| **H2** | README consolidation | 1/3, 2/3, 3/3 | Deliverables | Low | Add ERD link, performance report link to main README |
| **H3** | Contact form backend | 3/3 #19 | Contact/Support page | Low | `POST /api/v1/contact`; persist or email; wire ContactForm |
| **H4** | E2E tests unblock | 2/3 #32, 3/3 #35 | Critical User Flow | Medium | Fix better-auth ESM (transformIgnorePatterns, or Playwright) |
| **H5** | CAPTCHA enforcement | 1/3 #4 | AUTH-008 | Low | Require RECAPTCHA in production; document in .env.example |
| **H6** | Facebook OAuth | 1/3 #3 | AUTH-007 | Low | Add FACEBOOK_CLIENT_ID/SECRET; register provider in better-auth |

### 2.2 Medium Priority (Verify / Partial)

| # | Feature | testing.md | Effort | Notes |
|---|---------|------------|--------|-------|
| **M1** | Checkout error tests | 2/3 #15 | Low | Add tests for missing required fields, invalid email/phone/address |
| **M2** | Product images multiple sizes | 3/3 #24 | Medium | Currently: single URL per image; Next.js `sizes` for responsive. Option: add thumbnail generation on upload |
| **M3** | Responsive viewports | 3/3 #25 | Low | Verify 320, 768, 1024, 1440; add viewport tests or manual checklist |
| **M4** | SEO audit | 3/3 #30 | Low | Title <60 chars, H2–H6 hierarchy, alt text on all images |
| **M5** | Admin categories CRUD | 3/3 #7 | Medium | Add categories admin page; currently categories from public API only |
| **M6** | Self-signed TLS default | 3/3 #26 | Low | Document as default for local; LOCAL-HTTPS-SETUP.md exists |

### 2.3 Low Priority (Optional / Later)

| # | Feature | testing.md | Effort | Notes |
|---|---------|------------|--------|-------|
| **L1** | Terms & FAQ pages | task.md | Low | Terms of service, Privacy policy, FAQ (shipping, payment, returns) |
| **L2** | CI/CD pipeline | Integrator | High | GitHub Actions: build, test, SAST, deploy |
| **L3** | Observability | Observability | High | 4 dashboards, metrics, alerts per spec |

---

## 3. Development Options (Request by Number)

### Option A: Quick Wins (1–2 days)

**Scope:** H2, H3, H5, M4, M6

| Action | Files |
|--------|-------|
| H2 README | Add links to ERD, performance report, LOCAL-HTTPS-SETUP |
| H3 Contact | `POST /api/v1/contact`; ContactController, ContactService; wire ContactForm |
| H5 CAPTCHA | Add `RECAPTCHA_REQUIRED=1` for prod; document in .env.example |
| M4 SEO | Audit metadata, titles, alt text; fix where needed |
| M6 TLS | Add note to README Quick Start about HTTPS |

**Deliverables:** README updated, contact form functional, CAPTCHA documented, SEO improved.

---

### Option B: Docker (FND-006) — 2–3 days

**Scope:** H1

| Action | Files |
|--------|-------|
| Backend Dockerfile | `apps/backend/Dockerfile` — Node, build, run |
| Web Dockerfile | `apps/web/Dockerfile` — Node, build, run |
| docker-compose | `ecom/tshirtshop/docker-compose.yml` — db, backend, web |
| Startup script | `docker-compose up --build` or `./scripts/start.sh` |
| .dockerignore | Exclude node_modules, .env |

**Deliverables:** `docker-compose up` runs full stack; Docker is only prerequisite.

---

### Option C: E2E Unblock — 1–2 days

**Scope:** H4

| Action | Option A | Option B |
|--------|----------|----------|
| **Approach** | Jest transform | Playwright |
| **Changes** | Add `transformIgnorePatterns` to include `better-auth`; Babel config | New E2E suite with Playwright; no Jest import of app |
| **Pros** | Reuses existing tests | No ESM issues; browser-based |
| **Cons** | Transform complexity | New tooling |

**Deliverables:** Critical user flow tests run (registration, checkout, cart).

---

### Option D: Auth Completion — 1 day

**Scope:** H5, H6

| Action | Files |
|--------|-------|
| H5 CAPTCHA | better-auth-core.module.ts — require RECAPTCHA when NODE_ENV=production |
| H6 Facebook | Add Facebook provider; .env.example FACEBOOK_CLIENT_ID/SECRET |

**Deliverables:** CAPTCHA enforced in prod; Facebook OAuth available when configured.

---

### Option E: Contact + Terms/FAQ — 1 day

**Scope:** H3, L1

| Action | Files |
|--------|-------|
| Contact POST | ContactController, ContactService; email or DB store |
| Terms page | `app/terms/page.tsx` — placeholder or policy |
| FAQ page | `app/faq/page.tsx` — shipping, payment, returns |
| Footer links | Add Terms, FAQ to footer |

**Deliverables:** Contact persists; Terms and FAQ pages exist.

---

### Option F: Admin Categories — 1 day

**Scope:** M5

| Action | Files |
|--------|-------|
| Categories CRUD | `GET/POST/PATCH/DELETE /api/v1/admin/categories` |
| Admin UI | `app/admin/categories/page.tsx` — list, add, edit, delete |
| CategoriesController | Extend or new admin endpoint |

**Deliverables:** Admin can manage categories.

---

### Option G: Full Phase 1–3 Completion — 1–2 weeks

**Scope:** Combine A + B + C + D + E + F + M1–M4

| Phase | Options |
|-------|---------|
| Week 1 | A, B, C, D, E |
| Week 2 | F, M1–M4 |

**Deliverables:** All testing.md 1/3–3/3 mandatory items addressed except Integrator/Observability.

---

### Option H: CI/CD Pipeline — 2–3 days

**Scope:** L2 (Integrator)

| Action | Files |
|--------|-------|
| Build & Test | `.github/workflows/ci.yml` — npm install, build, test |
| Lint | ESLint in pipeline |
| SAST | Add Snyk or OWASP dependency check |
| Secret scan | Gitleaks or similar |
| Deploy | Optional: Vercel/Railway deploy |

**Deliverables:** Push-to-main triggers build, test, security scan.

---

### Option I: Observability — 3–5 days

**Scope:** L3 (Observability)

| Action | Notes |
|--------|-------|
| Stack | Grafana, InfluxDB, Prometheus (or Grafana Cloud) |
| 4 Dashboards | BI, Product & Customer, Technical, Security |
| Metrics | Request rate, errors, latency, orders, revenue |
| Alerts | 2+ rules; email/Slack |
| Traffic simulation | Extend load tests |

**Deliverables:** Dashboards, metrics, alerts per spec.

---

## 4. Recommended Order

1. **Option A (Quick Wins)** — Low effort, high impact for checklist.
2. **Option B (Docker)** — Required for all phases; unblocks reviewers.
3. **Option C (E2E)** — Unblocks critical user flow verification.
4. **Option D (Auth)** — Completes Foundation auth requirements.
5. **Option E (Contact + Terms/FAQ)** — Completes Experience pages.
6. **Option F (Admin Categories)** — If checklist requires categories CRUD.
7. **Option H (CI/CD)** — If Integrator phase is in scope.
8. **Option I (Observability)** — If Observability phase is in scope.

---

## 5. Request Format

To request development, specify:

- **Option letter:** e.g. "Implement Option A"
- **Or specific items:** e.g. "Implement H1, H2, H3"
- **Or phase:** e.g. "Complete all Phase 3 partial items"

---

## 6. Document References

- [TESTING-CHECKLIST-EVALUATION.md](./TESTING-CHECKLIST-EVALUATION.md) — testing.md evaluation
- [PROJECT-STATUS-AUDIT.md](./PROJECT-STATUS-AUDIT.md) — Implementation status
- [task.md](./task.md) — Full requirements
- [master-task-board.md](./04-TASKS/master-task-board.md) — Task tracking
- [DOCS-VS-IMPLEMENTATION-GAPS.md](./DOCS-VS-IMPLEMENTATION-GAPS.md) — Doc vs code gaps
