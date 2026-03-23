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
5. **Checkout / Stripe:** When Playwright starts `npm run dev`, it sets **`E2E_SKIP_STRIPE_CHECKOUT=1`** for the monorepo (dev only, ignored in production) so the backend skips creating a Stripe Checkout session and the browser goes to **`/checkout/confirmation`**—avoids 500s from bad Stripe keys during E2E. To test the real Stripe redirect, unset that variable on the backend process and use valid [Stripe test keys](https://stripe.com/docs/keys). If you use **`PLAYWRIGHT_SKIP_WEBSERVER=1`**, set `E2E_SKIP_STRIPE_CHECKOUT=1` in `apps/backend/.env` or your shell so the backend skips Stripe the same way.
6. **Auth tests (`authenticated.spec.ts`):** Configure **`E2E_USER_EMAIL`** and **`E2E_USER_PASSWORD`** as in [Configure the E2E test account](#configure-the-e2e-test-account-authenticated-tests) above.
7. **Sign-up test:** See [Why the sign-up / reCAPTCHA test might be skipped](#why-the-sign-up--recaptcha-test-might-be-skipped) above.

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

Tests **fail** when the catalog is empty, checkout never redirects after place order, sign-up API fails unexpectedly, or the auth page fails to load. **Auth** tests are **skipped** when `E2E_USER_*` are unset. **Sign-up** is **skipped** when the server requires CAPTCHA (see above).

## What is covered

- Smoke, catalog, guest cart (any product), checkout (guest), registration, authenticated home header
