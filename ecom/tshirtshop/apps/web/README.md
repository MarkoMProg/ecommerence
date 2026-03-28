# Web (Next.js storefront)

Next.js App Router app for the Darkloom storefront (catalog, cart, checkout with Stripe Elements, Better Auth).

## Development

From the monorepo root, `npm run dev` starts this app alongside other packages. To run only the web app:

```bash
cd apps/web
npm run dev
```

The dev server listens on **`https://localhost:3001`** (HTTPS using certificates from `apps/backend/certs/`). Trust the local cert in your browser if prompted.

## End-to-end tests (Playwright)

See **[e2e/README.md](./e2e/README.md)** for:

- Installing Chromium and running `npm run test:e2e` (from the monorepo root or this folder)
- **`E2E_USER_EMAIL`** / **`E2E_USER_PASSWORD`** for authenticated tests
- Why the **sign-up** test may be **skipped** when the backend enforces **reCAPTCHA**

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Project root README](../../README.md) for the full monorepo
