# Config Changes Log

Documents configuration additions and changes. Do not modify .env files directly here.

---

## 2026-02-18 — ADMIN_EMAILS (UI-007)

**Added:** `ADMIN_EMAILS` (backend)

**Purpose:** Comma-separated list of email addresses with admin access. Used by AdminGuard to allow access to /admin and admin APIs.

**Format:** `ADMIN_EMAILS=admin@example.com,other@example.com`

**Default:** When unset or empty, no user has admin access. Admin routes return 403.

**Where:** `apps/backend/.env` (or environment)

**Example:**
```
ADMIN_EMAILS=your-email@example.com
```

**Impact:** Product create/update/delete (POST/PATCH/DELETE /api/v1/products) and admin endpoints (GET /api/v1/admin/*) require admin. Add your email to test the admin dashboard.

---

## 2026-02-21 — Stripe (PAY-001)

**Added:** Stripe test keys for payment sandbox

**Backend** (`apps/backend/.env`):
- `STRIPE_SECRET_KEY` — Secret key (sk_test_...) for server-side Stripe API calls
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret (whsec_...); optional for local dev

**Frontend** (`apps/web/.env.local`):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Publishable key (pk_test_...) for Stripe.js / Elements

**Default:** When unset, payment integration is disabled. Checkout creates order as pending without payment.

**Impact:** Required for PAY-001 Stripe sandbox integration. Get keys from Stripe Dashboard → Developers → API keys (Test mode).

**PAY-001 Implementation (2026-02-21):** When `STRIPE_SECRET_KEY` is set (sk_test_...), checkout creates a Stripe Checkout Session and returns `checkoutUrl`. Frontend redirects to Stripe; on success Stripe redirects to `/checkout/confirmation?orderId=X&session_id=Y`. Confirmation page calls `POST /api/v1/checkout/verify-payment` to verify payment and mark order as paid.

**PAY-002 Implementation (2026-02-21):** Payment validation flow. `STRIPE_WEBHOOK_SECRET` required for webhooks. Configure Stripe Dashboard → Webhooks → Add endpoint: `https://your-backend/webhooks/stripe`, event `checkout.session.completed`. Webhook marks order as paid (authoritative server-to-server). Verify-payment endpoint validates session amount matches order total; idempotent when order already paid. Local dev: use Stripe CLI `stripe listen --forward-to localhost:3000/webhooks/stripe`.
