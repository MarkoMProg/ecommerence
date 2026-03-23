# Darkloom — B2C E-Commerce Platform

**Darkloom** (monorepo codename **tshirtshop**) is a B2C e-commerce stack: accounts, catalog, cart, Stripe checkout, orders, and admin tools.

| Layer        | Technologies                                  |
| ------------ | ----------------------------------------------- |
| **Monorepo** | Turborepo, npm workspaces, TypeScript           |
| **Backend**  | NestJS, PostgreSQL, Drizzle ORM, Better Auth    |
| **Frontend** | Next.js (App Router), React, Tailwind, shadcn/ui |

The runnable application lives under **`ecom/tshirtshop`**. All commands below assume that path unless noted.

---

## Prerequisites

- **Node.js** 18+
- **npm** (workspaces; see `ecom/tshirtshop/package.json` for `packageManager`)
- **PostgreSQL** 14+
- **Redis** (BullMQ / payment events) — e.g. `docker run -d -p 6379:6379 redis:7-alpine`

---

## Quick start

```bash
cd ecom/tshirtshop
npm install
```

### 1. Backend environment

Create **`ecom/tshirtshop/apps/backend/.env`** from **`apps/backend/.env.example`**.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Cookie / token signing |
| `ENCRYPTION_KEY` | Yes | 64-character hex for PII encryption |
| `BLIND_INDEX_SECRET` | Yes | Deterministic email lookups (user creation) |
| `REDIS_URL` | Yes for full stack | e.g. `redis://localhost:6379` |
| `UI_URL` | Recommended | Storefront origin (e.g. `http://localhost:3001`) |
| `RESEND_API_KEY` | For email flows | Verification, password reset |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | For real payments | Use [Stripe test keys](https://stripe.com/docs/keys) in development |

Generate random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Web environment

Create **`ecom/tshirtshop/apps/web/.env.local`** from **`apps/web/.env.example`**.

- Set **`API_URL`** to your backend (default is often `http://127.0.0.1:3000` — on Windows, `127.0.0.1` avoids some `localhost` resolution issues).
- Set **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** to your Stripe **test** publishable key when exercising checkout.

### 3. Database

From **`ecom/tshirtshop/apps/backend`**:

```bash
npm run db:push
npm run db:seed
```

`db:push` applies the schema; `db:seed` loads categories and sample products so the storefront and E2E tests have data.

### 4. Run the stack

From **`ecom/tshirtshop`**:

```bash
npm run dev
```

Typical local URLs:

- **Storefront (Next.js):** http://localhost:3001  
- **API (NestJS):** http://localhost:3000  

Ports match **`PORT`** / **`UI_URL`** in your env files if you change them.

### Build (production bundle)

```bash
cd ecom/tshirtshop
npm run build
```

### Unit / integration tests (backend)

```bash
cd ecom/tshirtshop/apps/backend
npm test
```

Or from the monorepo root:

```bash
cd ecom/tshirtshop
npm test
```

---

## End-to-end tests (Playwright)

E2E tests live in **`ecom/tshirtshop/apps/web/e2e`**. They drive the real storefront against **`PLAYWRIGHT_BASE_URL`** (default **`https://localhost:3001`** in config — align TLS or override the URL; see below).

### Install the browser (once per machine)

```bash
cd ecom/tshirtshop/apps/web
npx playwright install chromium
```

### Run E2E

From **`ecom/tshirtshop`** (runs Turbo with `--filter=web`):

```bash
npm run test:e2e
```

From **`ecom/tshirtshop/apps/web`**:

```bash
npm run test:e2e
```

| Command | Purpose |
| ------- | ------- |
| `npm run test:e2e` | Default headless run |
| `npm run test:e2e:ui` | Playwright UI mode (debug, time travel) |
| `npm run test:e2e:headed` | Visible Chromium |

After a run, open the HTML report:

```bash
cd ecom/tshirtshop/apps/web
npx playwright show-report
```

**`playwright.config.ts`** loads **`apps/web/.env.local`**, so `E2E_USER_*` and related variables apply without exporting them in the shell.

### Configure the E2E test account (authenticated tests)

The spec **`e2e/authenticated.spec.ts`** signs in via **`POST /api/auth/sign-in/email`** in a `beforeEach` hook. It needs a real Better Auth user.

1. Use an account that is **email verified** and has **no 2FA** (2FA breaks the API sign-in used in the test).
2. Add to **`ecom/tshirtshop/apps/web/.env.local`** (do not commit real passwords):

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

### Why the sign-up / reCAPTCHA test might be skipped

The spec **`e2e/signup.spec.ts`** calls **`POST /api/auth/sign-up/email`** (no browser reCAPTCHA widget).

- If the backend **does not require reCAPTCHA** on that route (e.g. no **`RECAPTCHA_SECRET_KEY`** in `apps/backend/.env` for local dev), the API can succeed and the test **passes**.
- If **`RECAPTCHA_SECRET_KEY`** is set, the server typically requires a captcha token on sign-up. The test does not send one, so the API returns an error the test treats as “CAPTCHA required,” and the spec **`test.skip`s** with a message like *“Sign-up requires CAPTCHA…”*. That is intentional: automating real reCAPTCHA in CI is flaky, so the default E2E path **skips** instead of failing.

**To run the sign-up test green:** use a local backend **without** `RECAPTCHA_SECRET_KEY`, or an environment where sign-up does not enforce CAPTCHA on that endpoint.

### Prerequisites for a full green E2E run

1. **Chromium:** `npx playwright install chromium`
2. **Stack running:** Postgres, Redis, backend + Next at **`PLAYWRIGHT_BASE_URL`** (default in config is often **`https://localhost:3001`** — use HTTPS dev certs or set **`PLAYWRIGHT_BASE_URL=http://localhost:3001`** if your dev server is HTTP-only).
3. **Catalog:** At least one product (e.g. after **`npm run db:seed`** in `apps/backend`).
4. **Schema:** Run **`npm run db:push`** in `apps/backend` so delivery-related tables exist — checkout can error if they are missing.
5. **Checkout / Stripe in E2E:** When Playwright starts `npm run dev`, it can set **`E2E_SKIP_STRIPE_CHECKOUT=1`** for the monorepo (dev-only; ignored in production) so the backend skips creating a Stripe Checkout session and the browser reaches **`/checkout/confirmation`** without valid Stripe keys. To exercise the real Stripe redirect, unset that on the backend and use valid Stripe test keys. If you use **`PLAYWRIGHT_SKIP_WEBSERVER=1`**, set **`E2E_SKIP_STRIPE_CHECKOUT=1`** in `apps/backend/.env` or your shell so behavior matches.
6. **Auth tests:** Set **`E2E_USER_EMAIL`** and **`E2E_USER_PASSWORD`** as above.
7. **Sign-up test:** See the reCAPTCHA section above.

### E2E environment variables (reference)

| Variable | Purpose |
| -------- | ------- |
| `PLAYWRIGHT_BASE_URL` | Override default base URL (must match how you run the app: `http` vs `https`) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` = you already run `npm run dev` from the monorepo root |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Required for **`authenticated.spec.ts`** |
| `E2E_RECAPTCHA_SITEKEY` | Override site key for the Playwright process (e.g. Google test key) |
| `E2E_STRIP_RECAPTCHA` | `1` = clear `NEXT_PUBLIC_RECAPTCHA_SITEKEY` unless `E2E_RECAPTCHA_SITEKEY` is set |
| `E2E_KEEP_RECAPTCHA` | `1` = legacy: keep `.env.local` reCAPTCHA as loaded (advanced) |
| `E2E_SKIP_STRIPE_CHECKOUT` | `1` on **backend** (dev): skip Stripe session; confirmation page only. Playwright’s `webServer` may set this automatically. |

Tests **fail** when the catalog is empty, checkout never reaches confirmation, sign-up fails unexpectedly, or the auth page fails to load. **Auth** tests are **skipped** when `E2E_USER_*` are unset. **Sign-up** is **skipped** when the server requires CAPTCHA (see above).

### What E2E covers (high level)

Smoke, catalog, guest cart, checkout (guest), registration, authenticated header — see specs under **`apps/web/e2e`**.

---

## Project layout

```
ecommerence/
└── ecom/tshirtshop/          # Monorepo root (npm workspaces + Turbo)
    ├── apps/
    │   ├── backend/          # NestJS API
    │   └── web/              # Next.js storefront + Playwright E2E
    └── packages/
        ├── eslint-config/
        └── typescript-config/
```

---

## Usage (high level)

- **Browse & search** — Categories, products, faceted search.
- **Cart** — Guest or signed-in; user carts persist.
- **Checkout** — Address, coupons, Stripe-hosted payment (when not using E2E Stripe skip).
- **Account** — Register, email verification, sign-in, optional 2FA, password reset.
- **Admin** — `/admin` for catalog, orders, users (requires admin role).

---

## License

See repository metadata or `LICENSE` if present.
