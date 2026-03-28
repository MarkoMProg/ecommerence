# Playwright E2E (`apps/web`)

End-to-end tests for the Next.js storefront.

## How to run the tests

1. **Install the browser** (once per machine):

   ```bash
   cd apps/web
   npx playwright install chromium
   ```

2. **From the monorepo root** (`ecom/tshirtshop`):

   ```bash
   npm run test:e2e
   ```

   This runs Turbo with `--filter=web`, which executes `playwright test` in `apps/web`.

3. **Or from `apps/web` directly:**

   ```bash
   cd apps/web
   npm run test:e2e
   ```

4. **Other modes:**

   | Command | Purpose |
   |--------|---------|
   | `npm run test:e2e` | Default headless run |
   | `npm run test:e2e:stripe-full` | Opt-in: full Stripe Elements flow (test card 4242…) — see [Checkout / Stripe](#prerequisites-full-green-run) |
   | `npm run test:e2e:ui` | Playwright UI mode (debug, time travel) |
   | `npm run test:e2e:headed` | Visible Chromium |

5. **After a run**, open the HTML report:

   ```bash
   cd apps/web
   npx playwright show-report
   ```

`playwright.config.ts` loads **`apps/web/.env.local`** so Playwright sees `E2E_USER_*` and related vars without exporting them in the shell.

## Configure the E2E test account (authenticated tests)

The spec **`e2e/authenticated.spec.ts`** signs in via **`POST /api/auth/sign-in/email`** in a `beforeEach` hook. It needs a real Better Auth user.

1. Create or use an account that is:

   - **Email verified**
   - **No 2FA** (two-factor would break the API sign-in used in the test)

2. Add credentials to **`apps/web/.env.local`** (do not commit real passwords):

   ```env
   E2E_USER_EMAIL=your-verified-user@example.com
   E2E_USER_PASSWORD=your-secure-password
   ```

3. If the password contains special characters (e.g. `%`), quote the value:

   ```env
   E2E_USER_PASSWORD='your%password'
   ```

4. **CI:** set the same variables as secrets in your pipeline.

If **`E2E_USER_EMAIL`** or **`E2E_USER_PASSWORD`** is missing, **`authenticated.spec.ts` is skipped** (not failed) so the rest of the suite can still pass.

## Why the sign-up / reCAPTCHA test might be skipped

The spec **`e2e/signup.spec.ts`** calls **`POST /api/auth/sign-up/email`** (no browser reCAPTCHA widget).

- **If the backend does not require reCAPTCHA** on that route (e.g. no **`RECAPTCHA_SECRET_KEY`** in `apps/backend/.env` for local dev), the API can succeed and the test **passes**.

- **If `RECAPTCHA_SECRET_KEY` is set**, the server typically requires a captcha token on sign-up. The test does not send one, so the API returns an error the test treats as “CAPTCHA required,” and the spec **`test.skip`s** with a message like *“Sign-up requires CAPTCHA…”*. That is intentional: driving real reCAPTCHA in CI is flaky, so default E2E skips instead of failing.

**To run the sign-up test green** with CAPTCHA disabled for E2E only: use a local backend **without** `RECAPTCHA_SECRET_KEY`, or a dedicated test environment where sign-up does not enforce CAPTCHA on that endpoint.

See also the **Environment variables** table below for reCAPTCHA-related Playwright overrides.

---

## Prerequisites (full green run)

1. **Chromium:** `npx playwright install chromium`
2. **Stack:** Postgres, Redis, backend + Next at `PLAYWRIGHT_BASE_URL` (default `https://localhost:3001`).
3. **Catalog:** At least one product (e.g. `npm run db:seed` in `apps/backend`).
4. **Schema:** Run **`npm run db:push`** in `apps/backend` so delivery tables (e.g. `shop_delivery_config`, `delivery_option`) exist — checkout **500**s if they are missing.
5. **Checkout / Stripe:** Checkout uses **Stripe Elements** (PaymentIntent) on `/checkout`, not hosted Checkout (`checkout.stripe.com`). When Playwright starts `npm run dev`, it sets **`E2E_SKIP_STRIPE_CHECKOUT=1`** (dev only, ignored in production) so `StripeService.isConfigured()` is false and the backend does not create a PaymentIntent — the client redirects to **`/checkout/confirmation`**. That avoids 500s from invalid keys during default E2E. If you use **`PLAYWRIGHT_SKIP_WEBSERVER=1`**, set `E2E_SKIP_STRIPE_CHECKOUT=1` in `apps/backend/.env` so the backend matches Playwright’s default behavior.
6. **Full Stripe Elements payment (optional):** Run **`npm run test:e2e:stripe-full`** from the repo root (or `apps/web`). That sets **`E2E_FULL_STRIPE_CHECKOUT=1`** so Playwright does **not** inject `E2E_SKIP_STRIPE_CHECKOUT` for the dev server. **Remove or unset `E2E_SKIP_STRIPE_CHECKOUT` in `apps/backend/.env`** (Nest loads it). Set **`STRIPE_SECRET_KEY`** (`sk_test_…`) and **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** (`pk_test_…`). The spec **`e2e/checkout-stripe-full.spec.ts`** fills test card **4242424242424242** and expects **`/checkout/confirmation`**. Iframe selectors may need updates if Stripe.js changes.
7. **Auth tests (`authenticated.spec.ts`):** Configure **`E2E_USER_EMAIL`** and **`E2E_USER_PASSWORD`** as in [Configure the E2E test account](#configure-the-e2e-test-account-authenticated-tests) above.
8. **Sign-up test:** See [Why the sign-up / reCAPTCHA test might be skipped](#why-the-sign-up--recaptcha-test-might-be-skipped) above.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | Override default `https://localhost:3001` |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` = you already run `npm run dev` from monorepo root |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | **Required** for `authenticated.spec.ts` (API sign-in in `beforeEach`) |
| `E2E_RECAPTCHA_SITEKEY` | Override **site** key for the Playwright process (e.g. Google test key) |
| `E2E_STRIP_RECAPTCHA` | `1` = clear `NEXT_PUBLIC_RECAPTCHA_SITEKEY` unless `E2E_RECAPTCHA_SITEKEY` is set (default: preserve `.env.local`) |
| `E2E_KEEP_RECAPTCHA` | `1` = legacy: keep `.env.local` recaptcha as loaded (advanced) |
| `E2E_SKIP_STRIPE_CHECKOUT` | `1` on **backend** (dev): skip PaymentIntent; confirmation page only. Playwright’s `webServer` sets this unless `E2E_FULL_STRIPE_CHECKOUT=1`. |
| `E2E_FULL_STRIPE_CHECKOUT` | `1` when running **`test:e2e:stripe-full`**: do not inject skip; backend needs test keys and no `E2E_SKIP_STRIPE_CHECKOUT` in `.env`. |

Tests **fail** when the catalog is empty, checkout never reaches confirmation or the payment step, sign-up API fails unexpectedly, or the auth page fails to load. **Auth** tests are **skipped** when `E2E_USER_*` are unset. **Sign-up** is **skipped** when the server requires CAPTCHA (see above). **`checkout-stripe-full.spec.ts`** is **skipped** unless `E2E_FULL_STRIPE_CHECKOUT=1`.

## CI (pipelines)

For a **stable** default checkout E2E without Stripe keys in CI, set **`E2E_SKIP_STRIPE_CHECKOUT: "1"`** on the **backend** job (or process env). Pass **`E2E_FULL_STRIPE_CHECKOUT`** only if you run `test:e2e:stripe-full` and provide Stripe test keys; omit **`E2E_SKIP_STRIPE_CHECKOUT`** from `apps/backend/.env` in that job. **`turbo.json`** lists `E2E_SKIP_STRIPE_CHECKOUT` and `E2E_FULL_STRIPE_CHECKOUT` in `globalEnv` for Turbo.

## What is covered

- Smoke, catalog, guest cart (any product), checkout (guest → confirmation or Elements step), optional full Stripe card flow (`test:e2e:stripe-full`), registration, authenticated home header
