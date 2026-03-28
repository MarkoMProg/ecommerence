# Tshirtshop (Darkloom)

Monorepo for the B2C e-commerce storefront: a **Next.js** web app, a **NestJS** API, and shared tooling (Turborepo).

## Repository layout

| Path | Description |
|------|-------------|
| [`apps/web`](apps/web) | Storefront (App Router, Better Auth, Stripe Elements, Playwright E2E) |
| [`apps/backend`](apps/backend) | REST API, Drizzle ORM, payments, catalog |
| [`packages/eslint-config`](packages/eslint-config) | Shared ESLint config |
| [`packages/typescript-config`](packages/typescript-config) | Shared TypeScript bases |

## Prerequisites

- **Node.js** ≥ 18 (see root `package.json` `engines`)
- **PostgreSQL** and **Redis** for local API usage

## Quick start

From this directory (`ecom/tshirtshop`):

```bash
npm install
```

Create environment files from each app’s `.env.example` (e.g. `apps/backend/.env`, `apps/web/.env.local`). Apply the database schema, then start everything:

```bash
cd apps/backend && npm run db:push && cd ../..
npm run dev
```

- **Storefront:** `https://localhost:3001` (Next.js dev server uses HTTPS with certs under `apps/backend/certs/`)
- **API:** `http://localhost:3000` by default (`PORT` in `apps/backend/.env`), or HTTPS when `USE_HTTPS` and certs are configured

For a fuller onboarding checklist (required env vars, troubleshooting), see **[docs/07-DEVOPS/environment-setup.md](../../docs/07-DEVOPS/environment-setup.md)** (repo root) and each app’s `.env.example`.

**Catalog data:** seed or load products from the backend, e.g. `npm run db:seed` or `npm run db:populate-from-json` in `apps/backend` (see that package’s scripts).

## Root scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run all `dev` tasks via Turbo (web + backend, etc.) |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run test` | Unit tests (e.g. backend Jest) |
| `npm run test:e2e` | Playwright E2E for `apps/web` |
| `npm run test:e2e:stripe-full` | Opt-in full Stripe Elements checkout E2E |
| `npm run format` | Prettier |
| `npm run check-types` | Typecheck |

Build or develop a single app: `npx turbo dev --filter=web` / `npx turbo build --filter=backend` (see [Turborepo filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)).

## Tests

- **Unit:** `npm run test` from the repo root (runs configured packages, e.g. `apps/backend`).
- **Storefront E2E (Playwright):** `npm run test:e2e` — prerequisites, env vars, Stripe skip mode, and optional full Stripe run are documented in **[apps/web/e2e/README.md](apps/web/e2e/README.md)**.

## Turborepo

This repo uses [Turborepo](https://turborepo.dev/) for task orchestration and caching. Remote caching is optional (e.g. [linking a Vercel account](https://turborepo.dev/docs/core-concepts/remote-caching)); local caching works out of the box.
