# Playwright E2E (`apps/web`)

End-to-end tests for the Next.js storefront. Run from **`apps/web`** (or `npm run test:e2e` from the **tshirtshop monorepo root**).

## Better Auth + Playwright (session without the login form)

This repo follows the same idea as [E2E Testing with Better Auth](https://nelsonlai.dev/blog/e2e-testing-with-better-auth): persist **cookies** into a Playwright **storage state** file and point a Playwright project at it.

**Difference:** Nelson Lai’s post builds a signed cookie from `BETTER_AUTH_SECRET` and inserts rows with SQLite. Here, users use **blinded/encrypted emails** in Postgres, so we **sign in via HTTP** instead:

1. **`auth.setup.ts`** — `POST /api/auth/sign-in/email` with `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` (same-origin proxy to Nest + Better Auth).
2. Saves state to **`e2e/.auth/user.json`** (gitignored).
3. **`chromium-authenticated`** project depends on **`setup`** and uses `storageState` for **`authenticated.spec.ts`**.

`playwright.config.ts` only registers the **`setup`** + **`chromium-authenticated`** projects when both `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are set (after loading `.env.local`). Otherwise Playwright would try to read a missing `e2e/.auth/user.json` and fail.

## Prerequisites

- **Chromium:** `npx playwright install chromium` (once per machine/CI image).
- **Stack:** Postgres, Redis, backend API, and Next dev server reachable at the Playwright `baseURL` (default `https://localhost:3001`). HTTPS uses the repo’s dev certs; `ignoreHTTPSErrors` is enabled in config.

## Commands

| Command | Purpose |
|--------|---------|
| `npm run test:e2e` | Default run (HTML report on failure locally). |
| `npm run test:e2e:ui` | Playwright UI mode. |
| `npm run test:e2e:headed` | Headed Chromium. |

Monorepo root: `npm run test:e2e` runs Playwright via `turbo run test:e2e --filter=web`. Backend Jest E2E: `npm run test:e2e -w backend`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | Override default `https://localhost:3001`. |
| `PLAYWRIGHT_SKIP_WEBSERVER` | Set to `1` if you already run `npm run dev` from the monorepo root (skips Playwright’s `webServer` block). |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Enables **`auth.setup.ts`** + **`authenticated.spec.ts`**. Use a **non-2FA** account with a verified email. |
| `NEXT_PUBLIC_RECAPTCHA_SITEKEY` | If set (e.g. in `.env.local`), the **registration** test is skipped so CAPTCHA does not block automation. `playwright.config.ts` loads `.env.local` so this matches your Next app. |

CI: omit or unset `NEXT_PUBLIC_RECAPTCHA_SITEKEY` if you want the registration flow to run without CAPTCHA.

## What is covered

- Smoke (home, shop, login page, contact)
- Catalog / search
- Guest cart (posters category when products exist)
- Checkout (guest): address + country + place order → Stripe host or `/checkout/confirmation`
- **Authenticated session** (storage state) when `E2E_USER_*` are set
- Sign-up → “Check your email” (when CAPTCHA is not required)

Some tests **skip** when data or env is missing (no poster products, no E2E user, CAPTCHA enabled).
