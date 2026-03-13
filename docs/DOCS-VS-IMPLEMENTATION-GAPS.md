# Documentation vs Implementation — Gap Analysis

**Generated:** 2026-03-07  
**Purpose:** Identify requirements and standards from docs that are not yet implemented or addressed.

---

## 1. Executive Summary

This document cross-references the project documentation against the current implementation. Items listed are **required or specified in docs** but **not yet implemented** or only partially addressed.

**Recent (2026-03-07):** Product archive/unarchive, bulk upload, filtering/sorting confirmed implemented, ERD done, test status updated (289 pass, 2 fail). RBAC: AdminGuard + 2FA; ADMIN_EMAILS fallback.

---

## 2. Requirements Gaps (project-overview.md, foundation-requirements.md)

### 2.1 Foundation — Not Implemented

| Doc Requirement                                 | Status      | Notes                                                                                                                                               |
| ----------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERD creation**                                | ✅ DONE     | DB-001: `docs/ERD.md` — auth + catalog; Mermaid format.                                                                                             |
| **Product catalog schema**                      | ✅ DONE     | DB-003 to DB-006: category, product, product_image in `apps/backend/src/catalog/schema.ts`.                                                         |
| **Product attributes**                          | ✅ DONE     | description, stock_quantity, dimensions/weight in schema; API returns full product.                                                                 |
| **Category browsing API**                       | ✅ DONE     | CAT-002: CategoriesController list + getById.                                                                                                       |
| **Faceted search**                              | ✅ DONE     | CAT-004: Filter by price, brand.                                                                                                                    |
| **Dynamic search suggestions**                  | ✅ DONE     | CAT-006: Autocomplete on shop search.                                                                                                               |
| **Sorting options**                             | ✅ DONE     | CAT-005: newest, price-asc, price-desc, name-asc, name-desc.                                                                                        |
| **OAuth login**                                 | ⚠️ PARTIAL  | AUTH-007: Google OAuth done; Facebook not configured.                                                                                               |
| **CAPTCHA during registration**                 | ⚠️ PARTIAL  | AUTH-008: Optional for dev; not enforced in production config.                                                                                      |
| **Unit tests (JWT, validation, product model)** | ✅ DONE     | TEST-001 to TEST-003.                                                                                                                               |
| **API integration tests**                       | ⚠️ PARTIAL  | catalog-api, admin, review, bulk-upload pass; catalog-api.spec.ts: 2 tests fail (getById NotFound — mock both getProductById and getProductBySlug). |
| **Security tests**                              | ⚠️ PARTIAL  | Input sanitization/validation implemented and tested in DTO specs; dedicated adversarial test suite not yet created.                                |

### 2.2 Commerce — Implemented

Cart, Checkout, Stripe payment (PAY-001–004), Orders (ORD-001–005) are implemented. Coupons supported. Complete payment for pending orders. Cancel order with confirmation.

### 2.3 Experience — Not Implemented

| Doc Requirement             | Status      | Notes                                                     |
| --------------------------- | ----------- | --------------------------------------------------------- |
| **Order confirmation page** | ✅ DONE     | `/checkout/confirmation`; Complete payment, Cancel order. |
| **Search results page**     | ✅ DONE     | Shop page with search, filters, sort.                     |
| **Contact page**            | ❌ NOT DONE | Required per project-overview.                            |
| **About page**              | ❌ NOT DONE | Required per project-overview.                            |
| **Error page**              | ❌ NOT DONE | Required per project-overview.                            |
| **Reviews system**          | ✅ DONE     | Star rating, text reviews, helpful voting (REV-001–004).  |
| **Admin dashboard**         | ✅ DONE     | Products, orders, users, reviews, refunds.                |
| **Admin 2FA requirement**   | ✅ DONE     | AdminGuard enforces 2FA for admin access.                 |

---

## 3. Domain Model Gaps (domain-modules.md)

The domain-modules doc defines models. Current status:

| Domain Model          | Status | Notes                                                            |
| --------------------- | ------ | ---------------------------------------------------------------- |
| **Address**           | ❌     | Schema not defined.                                              |
| **Category**          | ✅     | In `catalog/schema.ts`.                                          |
| **Product**           | ✅     | In `catalog/schema.ts`.                                          |
| **ProductImage**      | ✅     | In `catalog/schema.ts` as product_image.                         |
| **Cart**              | ✅     | cart, cart_item in `cart/schema.ts`.                             |
| **CartItem**          | ✅     | cart_item.                                                       |
| **Order**             | ✅     | order, order_item in `order/schema.ts`; stripeSessionId, paidAt. |
| **OrderItem**         | ✅     | order_item.                                                      |
| **Payment**           | ⚠️     | No dedicated payment table; Stripe session ID stored on order.   |
| **Review**            | ✅     | review, review_helpful_vote in `review/schema.ts`.               |
| **ReviewHelpfulVote** | ✅     | review_helpful_vote.                                             |
| **AdminAuditLog**     | ❌     | Schema not defined.                                              |

**User model:** Partially exists via better-auth tables; `role` (USER | ADMIN | SUPPORT | SALES) and `Address` not in schema.

---

## 4. API Guidelines Gaps (api-guidelines.md)

| API Standard                       | Status | Notes                                                                                                             |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| **Version prefix**                 | ✅     | Catalog uses `/api/v1/products`, `/api/v1/categories`.                                                            |
| **Standard response format**       | ✅     | Catalog: `{ success, data, message }`; pagination on list.                                                        |
| **Error response format**          | ✅     | Catalog: `{ success: false, error: { code, message } }` on 404/validation.                                        |
| **Pagination**                     | ✅     | Products list returns `pagination: { page, limit, total }`.                                                       |
| **Filtering/sorting query params** | ✅     | Implemented: category, brand, minPrice, maxPrice, sort (price-asc, price-desc, name-asc, name-desc, rating-desc). |
| **Rate limiting**                  | ❌     | Not implemented per security-standards.                                                                           |
| **Documentation**                  | ❌     | No OpenAPI/Swagger or endpoint docs.                                                                              |

---

## 5. Testing Standards Gaps (testing-standards.md)

| Test Type             | Doc Requirement                      | Status                                                                                        |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Unit tests**        | JWT, validation, product model       | DONE (auth, catalog DTOs, order DTOs, review).                                                |
| **Integration tests** | API endpoints, DB ops                | Partial: catalog-api, admin, review pass; catalog.service.spec.ts fails (ReviewService mock). |
| **E2E tests**         | Registration, search, cart, checkout | Not implemented                                                                               |
| **Security tests**    | Injection, sanitization, guards      | Partial: sanitization + HTML injection checks in all DTO specs; control-char, phone digit count tests in checkout DTO spec. No dedicated adversarial suite. |
| **Performance tests** | Load, concurrent users               | Not implemented                                                                               |
| **Coverage target**   | 80% unit                             | Not measured                                                                                  |
| **Tests in CI**       | Run during builds                    | Not verified                                                                                  |

---

## 6. Security Standards Gaps (security-standards.md)

| Security Requirement        | Status  | Notes                                                                                                                                                                                                           |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TLS/HTTPS**               | ❌      | Not configured for local; deployment may differ.                                                                                                                                                                |
| **Encryption at rest**      | ❌      | PII encryption not verified.                                                                                                                                                                                    |
| **Rate limiting**           | ❌      | Login, password reset, payment endpoints.                                                                                                                                                                       |
| **RBAC**                    | ⚠️      | AdminGuard enforces role + 2FA; ADMIN_EMAILS fallback for bootstrap. No fine-grained roles (USER/ADMIN/SUPPORT/SALES).                                                                                          |
| **Input sanitization**      | ✅ DONE | `common/sanitize.ts` — centralized utility; all 6 DTOs enhanced with control-char stripping, HTML injection detection, semantic bounds, whitelisting. Frontend `lib/validation.ts` mirrors rules. SEC-003 DONE. |
| **Protection vs XSS, CSRF** | ✅ DONE | HTML injection detection in all DTOs; React auto-escapes JSX output; `containsHtml()` rejects `<script>` etc. in user inputs.                                                                                   |
| **Secure logging**          | ⚠️      | No sensitive data in logs — not verified.                                                                                                                                                                       |

---

## 7. SEO & Accessibility Gaps (project-overview.md)

| Requirement                 | Status | Notes                                                |
| --------------------------- | ------ | ---------------------------------------------------- |
| **Proper title tags**       | ⚠️     | Layout has title; per-page metadata not verified.    |
| **Meta descriptions**       | ⚠️     | Layout has description; per-page not verified.       |
| **Structured headings**     | ⚠️     | Mockup uses h1/h2; full audit not done.              |
| **Unique page metadata**    | ❌     | Not implemented per page.                            |
| **WCAG 2.1 Level A**        | ⚠️     | Semantic HTML, keyboard nav, ARIA — not audited.     |
| **Color contrast**          | ⚠️     | Dark theme; contrast not verified.                   |
| **Alt text for images**     | ⚠️     | Product images have alt; hero video has aria-hidden. |
| **Responsive text scaling** | ⚠️     | Responsive implemented; scaling not verified.        |

---

## 8. DevOps Gaps (project-overview.md, environment-setup.md)

| Requirement                     | Status | Notes                              |
| ------------------------------- | ------ | ---------------------------------- |
| **Dockerfiles**                 | ❌     | FND-006: Not implemented.          |
| **Single command startup**      | ❌     | Not possible without Docker.       |
| **Docker as only prerequisite** | ❌     | Node, PostgreSQL, Docker required. |

---

## 9. Final Deliverables Gaps (project-overview.md)

| Deliverable                 | Status                         |
| --------------------------- | ------------------------------ |
| Complete source code        | In progress                    |
| ERD documentation           | ✅ DONE (`docs/ERD.md`)        |
| Setup instructions          | ✅ environment-setup.md exists |
| Usage guide                 | ❌ Not found                   |
| Performance analysis report | ❌ NOT DONE                    |
| Demonstration readiness     | ⚠️ Partial (mockup only)       |

---

## 10. Doc Inconsistencies

| Issue                    | Location      | Notes                                                                                |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------ |
| **Project name**         | Multiple docs | Docs say "tshirtshop"; website branded "Darkloom". Consider updating doc references. |
| **domain-modules.md**    | Last Updated  | Shows "YYYY-MM-DD" placeholder.                                                      |
| **testing-standards.md** | Empty file?   | File has content; testing-standards.md was previously empty per audit.               |

---

## 11. Prioritized Action List

### Critical (Blocks full test pass)

1. **Fix catalog-api.spec.ts** — ProductsController.getById tries both getProductById and getProductBySlug; tests for NotFound must mock both to return null.

### High (Doc compliance)

2. **ADMIN_EMAILS** — Add to `apps/backend/.env.example` (documented in CHANGELOG_CONFIG but not in example).
3. **master-task-board.md** — Update PAY-001–004 to DONE.

### Medium (Phase 2/3)

4. **FND-006:** Docker setup.
5. **SEC-002:** Rate limiting on login, password reset, payment endpoints.
6. **Missing UI pages:** Contact, About, Error (optional per project-overview).

### Lower (Phase 3)

7. **OpenAPI/Swagger** — No API documentation.
8. **data-privacy.md** — Empty; add GDPR/privacy policy content if required.
9. **experience-requirements.md** — Empty.

---

_End of gap analysis_
