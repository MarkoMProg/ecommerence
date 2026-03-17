# Audit Report — To-Do Progress & Test Status

**Date:** 2026-03-17  
**Scope:** 7 planned items from teammate test feedback; full test suite verification.

---

## 1. Executive Summary

| Metric | Result |
|--------|--------|
| Planned items | 7 |
| Completed | 7 (100%) |
| Unit/Integration tests | **399 passed** |
| E2E tests | **Blocked** (better-auth ESM) |
| Web lint | Passed |

All planned deliverables are implemented. Unit and integration tests pass. E2E tests cannot run due to Jest not transforming the ESM `better-auth` package.

---

## 2. To-Do Progress

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Document queue flow, success email, filter/sort | ✅ Done | `docs/03-ARCHITECTURE/payment-flow-and-message-queue.md` |
| 2 | Payment failure scenarios — map Stripe errors | ✅ Done | `src/order/stripe-error.util.ts` + spec |
| 3 | Order details — timeline and payment metadata | ✅ Done | Frontend + API changes |
| 4 | Failed payment email flow | ✅ Done | `email.service.ts` `sendPaymentFailedEmail`, `payment.failed` job |
| 5 | Encryption policy documentation | ✅ Done | `docs/08-COMPLIANCE/ENCRYPTION-POLICY.md` |
| 6 | Cart automated tests | ✅ Done | `src/cart/__tests__/dto.spec.ts`, `cart-api.spec.ts` |
| 7 | E2E critical flow tests | ⚠️ Written, blocked | `test/app.e2e-spec.ts` — infra issue |

---

## 3. Test Results

### 3.1 Unit & Integration Tests

```
Test Suites: 23 passed, 23 total
Tests:       399 passed, 399 total
Time:        ~15 s
```

**Command:** `cd apps/backend && npm test` or `npm test` (workspace root)

**Suites include:**
- `order-filters.spec.ts`, `stripe-error.util.spec.ts`, `order.encryption.spec.ts`
- `cart-api.spec.ts`, `cart/dto.spec.ts`
- `admin.controller.spec.ts`, `admin.guard.spec.ts`, `bulk-upload.spec.ts`
- `auth.service.spec.ts`, `auth.controller.spec.ts`, `jwt-auth.guard.spec.ts`
- `catalog.service.spec.ts`, `catalog-api.spec.ts`
- `review-api.spec.ts`, `review.service.spec.ts`
- `address.encryption.spec.ts`, `upload.controller.spec.ts`
- `crypto.util.spec.ts`

### 3.2 E2E Tests — Blocked

**Command:** `cd apps/backend && npm run test:e2e`

**Error:**
```
SyntaxError: Cannot use import statement outside a module
  at better-auth/dist/integrations/node.mjs
```

**Root cause:** `better-auth` is ESM (`.mjs`). Jest’s default `transformIgnorePatterns` skips `node_modules`, so ESM is not transformed.

**E2E coverage (when unblocked):**
- Catalog: `GET /api/v1/products`, `GET /api/v1/categories`
- Critical flow: add to cart → get cart → checkout summary → create order → fetch order

**Options to fix:**
1. Add `transformIgnorePatterns` to include `better-auth` and configure a transform (e.g. Babel)
2. Enable Jest experimental ESM support
3. Use a different E2E runner (e.g. Playwright) that does not need to transform `better-auth`

### 3.3 Web Lint

**Command:** `cd apps/web && npm run lint`  
**Result:** Passed (ESLint, max-warnings 50)

---

## 4. Deliverable Verification

### 4.1 Queue Flow & Success Email (Item 1)

- **Doc:** `docs/03-ARCHITECTURE/payment-flow-and-message-queue.md`
- **Flow:** Stripe webhook → `payment.success` job → `markOrderPaidIfPending` → `payment.notify` → `sendOrderConfirmationEmail`
- **Filter/sort:** `GET /api/v1/orders?status=paid&sort=date-desc` documented

### 4.2 Stripe Error Mapping (Item 2)

- **File:** `src/order/stripe-error.util.ts`
- **Tests:** `stripe-error.util.spec.ts` — maps card_declined, insufficient_funds, expired_card, invalid_cvc, etc.
- **Usage:** Checkout controller, verify-payment, refund flows

### 4.3 Order Details Timeline & Payment Metadata (Item 3)

- **Frontend:** `ConfirmationClient.tsx`, `CheckoutClient.tsx`, `lib/api/orders.ts`
- **Backend:** Order DTO includes `paidAt`, `stripeSessionId`, status timeline

### 4.4 Failed Payment Email (Item 4)

- **Service:** `EmailService.sendPaymentFailedEmail()` — HTML + text templates
- **Queue:** `payment.failed` job in `payment-events.processor.ts`
- **Trigger:** `checkout.controller.ts` when user returns from Stripe without completing payment
- **Flow:** `enqueuePaymentFailedNotification` → `triggerPaymentFailedNotification` → email

### 4.5 Encryption Policy (Item 5)

- **Doc:** `docs/08-COMPLIANCE/ENCRYPTION-POLICY.md`
- **Content:** AES-256-GCM, encrypted fields (order shipping, user addresses), plaintext fields, card data never stored

### 4.6 Cart Tests (Item 6)

- **Files:** `src/cart/__tests__/dto.spec.ts`, `src/cart/__tests__/cart-api.spec.ts`
- **Coverage:** DTO validation, controller endpoints (get cart, add item, remove item, update quantity, merge guest cart)

### 4.7 E2E Critical Flow (Item 7)

- **File:** `test/app.e2e-spec.ts`
- **Status:** Implemented but not runnable due to E2E infra issue

---

## 5. Recommendations

1. **E2E:** Resolve `better-auth` ESM compatibility (transform or alternate runner) so critical flow E2E tests can run.
2. **CI:** Ensure `npm test` runs on every PR; add `npm run test:e2e` once E2E is fixed.
3. **Docs:** Keep `payment-flow-and-message-queue.md` and `ENCRYPTION-POLICY.md` updated when flows or encryption change.

---

## 6. Files Modified (Reference)

**Backend:** `stripe-error.util.ts`, `stripe-error.util.spec.ts`, `checkout.controller.ts`, `stripe.service.ts`, `order.service.ts`, `payment-events.processor.ts`, `email.service.ts`, `cart/__tests__/dto.spec.ts`, `cart/__tests__/cart-api.spec.ts`  
**Frontend:** `ConfirmationClient.tsx`, `CheckoutClient.tsx`, `checkout/page.tsx`, `lib/api/checkout.ts`, `lib/api/orders.ts`  
**Docs:** `payment-flow-and-message-queue.md`, `ENCRYPTION-POLICY.md`, `security-standards.md`  
**E2E:** `test/app.e2e-spec.ts`
