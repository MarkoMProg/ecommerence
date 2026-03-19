---
name: ecom-environment-setup
description: Local dev setup for tshirtshop. Use when setting up environment, running migrations, troubleshooting DB/auth/env issues, or onboarding.
---

# Ecom Environment Setup

## Quick Start

```bash
cd ecom/tshirtshop
npm install
# Create apps/backend/.env and apps/web/.env.local (see .env.example)
cd apps/backend && npm run db:push
cd ../.. && npm run dev
```

## Required Env (apps/backend/.env)

| Var | Purpose |
|-----|----------|
| DATABASE_URL | PostgreSQL connection |
| BETTER_AUTH_SECRET | Cookie/token signing |
| ENCRYPTION_KEY | 64-char hex for email/name encryption |
| BLIND_INDEX_SECRET | Deterministic email lookups (user creation fails without it) |

Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Database

- `npm run db:push` — sync schema (from apps/backend)
- `npm run db:generate` — generate migration
- `npx drizzle-kit migrate` — run migrations

## Troubleshooting

**BLIND_INDEX_SECRET / unable_to_create_user:** Add BLIND_INDEX_SECRET and ENCRYPTION_KEY to .env, restart backend.

**Missing tables:** Run `npm run db:push` from apps/backend.

**Orphaned refresh tokens:** `node scripts/clean-orphaned-refresh-tokens.mjs`

## Full Reference

See [docs/07-DEVOPS/environment-setup.md](../../docs/07-DEVOPS/environment-setup.md)
