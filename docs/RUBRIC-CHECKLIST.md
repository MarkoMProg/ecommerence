# Course rubric checklist (task.md & testing.md)

**Sources:** [`task.md`](task.md), [`testing.md`](testing.md)  
**Project:** Darkloom (tshirtshop) — `ecom/tshirtshop`  
**Last reviewed:** 2026-03-21 (E2E/Playwright + rubric alignment; verify before submission)

**Legend**

| Mark | Meaning |
|------|---------|
| `[x]` | Implemented / present in repo (re-verify for your branch) |
| `[ ]` | Missing, partial, or needs manual demo evidence |
| `*` | Oral / documentation at review (explain to evaluator) |

---

## README & deliverables

- [x] Project overview in root [`README.md`](../README.md)
- [x] Entity relationship diagram ([`ERD.md`](ERD.md) + README)
- [x] Setup and installation instructions
- [x] Usage guide
- [x] Additional features / bonus section
- [x] Load testing / performance discussion (embedded in README)
- [ ] Link [`07-DEVOPS/performance-analysis-report.md`](07-DEVOPS/performance-analysis-report.md) from README “Documentation” table *(optional polish)*

---

## I love shopping 1/3 (Foundation) — `testing.md` mandatory

### Platform & README

- [x] B2C e-commerce model
- [x] README: overview, ERD, setup, usage *(see table above)*

### Authentication & security

- [x] Email–password authentication
- [x] OAuth (e.g. Google; configure Facebook if rubric insists on “Facebook” by name)
- [x] CAPTCHA on registration (reCAPTCHA)
- [x] *Student can explain JWT (header, payload, signature)* — Better Auth / session model maps to concepts
- [x] Access token not stored in `localStorage` / `sessionStorage` (typical Better Auth cookie flow)
- [x] Refresh token rotation & session invalidation (Better Auth)
- [x] Token revocation (logout / session tables)
- [x] Password reset via email
- [x] Optional user-enabled 2FA (TOTP)
- [x] Client + server validation on auth-related inputs

### Database

- [x] PostgreSQL + relational schema (Drizzle)
- [x] *Explain scalability + ACID at review*
- [x] ERD with entities, PK/FK, relationships ([`ERD.md`](ERD.md))

### Product catalog

- [x] Product fields: id, name, description, price, stock, category, brand, images, weight/dimensions (metric & imperial where modeled)
- [x] Categories + browse
- [x] Faceted search (e.g. price, brand, category)
- [x] Search suggestions (typeahead)
- [x] Sorting: price, rating, relevance/name as implemented
- [x] Images uploaded/served (`/uploads/...`)

### Automated testing (rubric)

- [x] Backend: unit tests (Jest) — auth, DTOs, catalog, cart, security-oriented cases
- [x] Backend: API integration style tests
- [x] **Frontend (`apps/web`): automated tests** — Playwright E2E (`apps/web/e2e/`, `npm run test:e2e` in `apps/web`)
- [x] **Critical user flows automated** — smoke, catalog, guest cart, checkout (guest), Better Auth session via Playwright `storageState` ([pattern](https://nelsonlai.dev/blog/e2e-testing-with-better-auth); API sign-in + `auth.setup.ts`), registration (no CAPTCHA)

### Architecture

- [x] *Explain modular monolith / Nest + Next at review*

### Docker (`testing.md` extra)

- [x] `Dockerfile` (backend + web) and `docker-compose.yml` under `ecom/tshirtshop`
- [ ] *“Docker is the only host prerequisite”* — README still documents `npm install`; add a **Docker-only** quickstart if evaluators require it

---

## I love shopping 2/3 (Commerce) — `testing.md` mandatory

### README

- [x] README covers commerce (cart, checkout, orders, payments)

### Shopping cart

- [x] DB supports guest + logged-in carts
- [x] Line items show name, price, thumbnail
- [x] Add/remove/update qty + live totals
- [x] Guest cart (temporary)
- [x] Persistent cart for logged-in users
- [x] Out-of-stock handling on add/checkout
- [x] **Related / recommended products** — `CartRecommendations` in [`cart-drawer.tsx`](../ecom/tshirtshop/apps/web/components/cart-drawer.tsx) (compact “You might also like” after add-to-cart) and [`CartClient.tsx`](../ecom/tshirtshop/apps/web/app/cart/CartClient.tsx) on `/cart` (full grid); API [`fetchCartRecommendations`](../ecom/tshirtshop/apps/web/lib/api/cart.ts) → `/api/v1/cart/recommendations`

### Checkout

- [x] Single-page checkout UI → Stripe Checkout when configured
- [x] Address + contact fields; prefill for logged-in users where implemented
- [x] Address validation (server + UX)
- [x] Order summary before pay
- [x] Confirmation page + email on success (queue)
- [x] Error handling for invalid input / failed payment paths

### Payments

- [x] Stripe sandbox integration (Checkout Session)
- [ ] PayPal or second provider *(not required if “Stripe or similar” accepted)*
- [x] No raw card data on your servers (Stripe-hosted)
- [x] Card validation effectively on Stripe’s UI *(rubric “front-end validation” — document that)*
- [x] Order status: pending → paid (via webhook) / failure paths
- [x] **Message queue** for payment notifications — **BullMQ/Redis** (not RabbitMQ; acceptable alternative)
- [x] Emails for success; failed-payment notification path (queue)
- [ ] *Specific decline scenarios* — use Stripe test cards; document in manual test notes

### Orders & inventory

- [x] Order list: filter by status + sort by date (account orders)
- [x] Order detail page
- [x] Cancel / refund flows (incl. Stripe refund for admin — verify after deploy)
- [x] Stock decrement on pay; restore on cancel/refund where applicable
- [ ] *Encryption at rest for all “order & payment records”* — confirm which columns are encrypted vs. plaintext snapshots; align README wording

### Automated testing (rubric)

- [x] Backend unit tests (cart, order logic, calculations where covered)
- [x] **Automated critical flows: registration + checkout** — Playwright (`apps/web/e2e/`: `signup.spec.ts`, `checkout-flow.spec.ts`, etc.; `npm run test:e2e` from `ecom/tshirtshop`)

### Docker (extra)

- [x] Containerization artifacts present
- [ ] Strict “Docker + payment CLI only” host story — document if required

---

## I love shopping 3/3 (Experience + polish) — `testing.md` mandatory

### README & performance

- [x] README with overview, setup, usage
- [x] Performance / load narrative (README + [`performance-analysis-report.md`](07-DEVOPS/performance-analysis-report.md))
- [ ] Re-run k6 and refresh numbers if backend changed significantly

### Reviews

- [x] Star ratings + text reviews
- [x] Average rating on products *(verify aggregation in API)*
- [x] Helpful votes + sort by helpfulness *(verify UI/API)*

### Admin

- [x] **2FA required for admin** (guard enforces)
- [x] Product CRUD + categories + orders + refunds + bulk JSON/CSV
- [x] **Configurable “delivery options”** — admin [`/admin/delivery`](../ecom/tshirtshop/apps/web/app/admin/delivery/page.tsx); API `GET/PUT /api/v1/admin/delivery`; checkout reads `GET /api/v1/checkout/delivery` + `deliveryOptionId` on order

### Storefront pages (`testing.md` list)

- [x] Home / featured
- [x] PLP: filters, search, sort, pagination
- [ ] **PLP: explicit grid vs list view toggle** — likely missing
- [x] PDP: detail, images, reviews, CTA, related products *(verify related)*
- [x] Cart page
- [x] Checkout + confirmation (order ref, summary)
- [x] Search results: filters, sort, count, pagination
- [x] Admin area (products, orders, users, reviews, bulk)
- [x] Contact page + form
- [x] About page
- [x] 404 page
- [x] Quick cart (drawer)
- [x] Quick search with suggestions
- [ ] **Multiple image sizes** (thumb vs full) — may rely on Next/Image; add explicit assets if evaluators require
- [x] Responsive layouts (mobile → desktop breakpoints)

### Security & compliance

- [x] Local HTTPS / TLS setup documented
- [x] Sensitive PII encrypted at rest (addresses, etc.)
- [ ] *Session tokens encrypted at rest* — sessions stored per Better Auth; clarify hashed vs encrypted for review
- [x] Token-bucket / rate limiting on sensitive routes
- [x] *Explain CIA triad at review*

### SEO & accessibility

- [x] Metadata / titles on major routes *(spot-check length & uniqueness)*
- [ ] **Every meaningful image: descriptive `alt`** — audit pages
- [ ] **Zoom to 200%** — spot-check critical flows

### Automated testing (rubric)

- [x] Backend: unit + integration + security-flavored tests
- [x] Frontend automated tests — Playwright E2E in `ecom/tshirtshop/apps/web/e2e/` (`npm run test:e2e` at monorepo root runs `--filter=web`)
- [x] **User-flow + security tests** — critical storefront flows covered by E2E (smoke, catalog, cart, checkout, optional auth via `auth.setup.ts` + `storageState`); auth/security edge cases still primarily in backend Jest

### Load testing (`testing.md`)

- [x] Report: max concurrent users before p95 > 5s *(see report; update if stale)*
- [x] Throughput documented
- [x] Bottlenecks + mitigations discussed (README / report)

---

## `task.md` cross-cutting (all phases)

### Security (task “Security” section)

- [x] TLS in dev (self-signed) / HTTPS story
- [x] Encryption in transit (HTTPS) + selective encryption at rest
- [x] Rate limiting
- [x] Input validation (client + server); whitelist where applicable
- [ ] *Formal GDPR/compliance docs* — optional unless required

### Integrator module (`task.md` — if in scope)

- [ ] CI/CD pipeline (trigger, build, test, failure stops)
- [ ] Security / dependency scan stage
- [ ] SAST / secrets scan *(no `.github/workflows` in repo at last audit)*
- [ ] DB migration automation + backup story in pipeline
- [ ] Deploy + rollback demo

### Observability module (`task.md` — if in scope)

- [ ] Four dashboards (BI, product/customer, technical, security)
- [ ] Two+ alerts + notification channel
- [ ] Correlated metrics (2+)
- [ ] Seed + traffic scripts for demo

---

## Quick “before submission” actions

1. [ ] Walk through [`testing.md`](testing.md) line-by-line and tick items you will demo orally.
2. [ ] Run `npm test` in `apps/backend` (from `ecom/tshirtshop`); run `npm run test:e2e` for Playwright (stack up or rely on `webServer` in `playwright.config.ts`).
3. [ ] Manual: CAPTCHA, OAuth, 2FA, Stripe success/decline cards, admin refund in Stripe Dashboard.
4. [ ] Update performance numbers if you changed hot paths (DB, catalog queries).
5. [ ] Add README link to [`07-DEVOPS/performance-analysis-report.md`](07-DEVOPS/performance-analysis-report.md) if evaluators expect a single canonical PDF/MD path.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`task.md`](task.md) | Full functional spec (all phases) |
| [`testing.md`](testing.md) | Evaluation checklist |
| [`ERD.md`](ERD.md) | Database ERD |
| [`07-DEVOPS/performance-analysis-report.md`](07-DEVOPS/performance-analysis-report.md) | Load test report |
| [`PROJECT-STATUS-AUDIT.md`](PROJECT-STATUS-AUDIT.md) | Historical implementation status *(if maintained)* |
| [`../ecom/tshirtshop/apps/web/e2e/README.md`](../ecom/tshirtshop/apps/web/e2e/README.md) | Playwright E2E: commands, env vars, Better Auth `storageState` setup |
