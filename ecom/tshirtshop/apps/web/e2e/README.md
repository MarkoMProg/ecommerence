# Playwright E2E (`apps/web`)

End-to-end tests for the Next.js storefront. Run from **`apps/web`** (or `npm run test:e2e` from the **tshirtshop monorepo root**).

## Prerequisites (full green run)

1. **Chromium:** `npx playwright install chromium`
2. **Stack:** Postgres, Redis, backend + Next at `PLAYWRIGHT_BASE_URL` (default `https://localhost:3001`).
3. **Catalog:** At least one product (e.g. `npm run db:seed` in `apps/backend`).
4. **Checkout / Stripe:** Guest checkout `POST /api/v1/checkout` creates an order, then the browser goes to Stripe Checkout (if `STRIPE_SECRET_KEY` is set) or `/checkout/confirmation`. If Stripe is configured with an invalid key, the API errors—use a valid [Stripe test key](https://stripe.com/docs/keys) or unset `STRIPE_SECRET_KEY` locally so checkout completes without a hosted payment page.
5. **Auth tests (`authenticated.spec.ts`):** Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` for a **verified, non-2FA** account in `apps/web/.env.local` (or CI secrets). If they are unset, that spec is **skipped** (not failed) so the rest of the suite can run green.
6. **Sign-up test:** It first calls `POST /api/auth/sign-up/email` (Better Auth). If the backend has **no** `RECAPTCHA_SECRET_KEY`, that completes without a CAPTCHA widget. If the API returns a CAPTCHA error, the test continues with the **browser** sign-up form and `waitForRecaptchaTokenIfPresent` **only when** `E2E_RECAPTCHA_SITEKEY` is set; otherwise the test is **skipped** (set Google test keys together, or unset `RECAPTCHA_SECRET_KEY` for local E2E). **If Playwright’s `webServer` reuses an already-running dev server**, stop it so Next picks up `E2E_RECAPTCHA_SITEKEY`, or use `PLAYWRIGHT_SKIP_WEBSERVER=1` and align keys yourself.

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
| `E2E_RECAPTCHA_SITEKEY` | Optional test **site** key when the backend enforces CAPTCHA (pairs with Google test secret) |
| `E2E_KEEP_RECAPTCHA` | `1` = do not clear `NEXT_PUBLIC_RECAPTCHA_SITEKEY` from `.env.local` before applying `E2E_RECAPTCHA_SITEKEY` (advanced) |

Tests **fail** when the catalog is empty, checkout never redirects after place order, sign-up API and UI both fail, or the auth page fails to load. **Auth** tests are **skipped** when `E2E_USER_*` are unset (see above).

## What is covered

- Smoke, catalog, guest cart (any product), checkout (guest), registration, authenticated home header
