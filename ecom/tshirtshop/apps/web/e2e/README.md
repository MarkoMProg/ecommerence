# Playwright E2E (`apps/web`)

End-to-end tests for the Next.js storefront. Run from **`apps/web`** (or `npm run test:e2e` from the **tshirtshop monorepo root**).

## Prerequisites (full green run)

1. **Chromium:** `npx playwright install chromium`
2. **Stack:** Postgres, Redis, backend + Next at `PLAYWRIGHT_BASE_URL` (default `https://localhost:3001`).
3. **Catalog:** At least one product (e.g. `npm run db:seed` in `apps/backend`).
4. **Schema:** Run **`npm run db:push`** in `apps/backend` so delivery tables (e.g. `shop_delivery_config`, `delivery_option`) exist — checkout **500**s if they are missing.
5. **Checkout / Stripe:** When Playwright starts `npm run dev`, it sets **`E2E_SKIP_STRIPE_CHECKOUT=1`** for the monorepo (dev only, ignored in production) so the backend skips creating a Stripe Checkout session and the browser goes to **`/checkout/confirmation`**—avoids 500s from bad Stripe keys during E2E. To test the real Stripe redirect, unset that variable on the backend process and use valid [Stripe test keys](https://stripe.com/docs/keys). If you use **`PLAYWRIGHT_SKIP_WEBSERVER=1`**, set `E2E_SKIP_STRIPE_CHECKOUT=1` in `apps/backend/.env` or your shell so the backend skips Stripe the same way.
6. **Auth tests (`authenticated.spec.ts`):** Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` for a **verified, non-2FA** account in `apps/web/.env.local` (or CI secrets). If they are unset, that spec is **skipped** (not failed) so the rest of the suite can run green.
7. **Sign-up test:** Calls `POST /api/auth/sign-up/email` (Better Auth). If the backend has **no** `RECAPTCHA_SECRET_KEY`, that succeeds and the test **passes**. If the API returns a CAPTCHA error, the test is **skipped** (browser CAPTCHA + Resend are too flaky for default E2E). For a **green** sign-up test with CAPTCHA enabled in production config, use a **local** backend without `RECAPTCHA_SECRET_KEY` or a dedicated test database.

## Commands

| Command | Purpose |
|--------|---------|
| `npm run test:e2e` | Default run |
| `npm run test:e2e:ui` | Playwright UI |
| `npm run test:e2e:headed` | Headed Chromium |

Monorepo root: `npm run test:e2e` → `turbo run test:e2e --filter=web`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | Override default `https://localhost:3001` |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` = you already run `npm run dev` from monorepo root |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | **Required** for `authenticated.spec.ts` (API sign-in in `beforeEach`) |
| `E2E_RECAPTCHA_SITEKEY` | Override **site** key for the Playwright process (e.g. Google test key) |
| `E2E_STRIP_RECAPTCHA` | `1` = clear `NEXT_PUBLIC_RECAPTCHA_SITEKEY` unless `E2E_RECAPTCHA_SITEKEY` is set (default: preserve `.env.local`) |
| `E2E_KEEP_RECAPTCHA` | `1` = legacy: keep `.env.local` recaptcha as loaded (advanced) |
| `E2E_SKIP_STRIPE_CHECKOUT` | `1` on **backend** (dev): skip Stripe session; confirmation page only. Playwright’s `webServer` sets this automatically. |

Tests **fail** when the catalog is empty, checkout never redirects after place order, sign-up API fails unexpectedly, or the auth page fails to load. **Auth** tests are **skipped** when `E2E_USER_*` are unset (see above). **Sign-up** is **skipped** when the server requires CAPTCHA (see above).

## What is covered

- Smoke, catalog, guest cart (any product), checkout (guest), registration, authenticated home header
