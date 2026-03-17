# Darkloom — B2C E-Commerce Platform

Full-stack e-commerce platform (codename **tshirtshop**) for browsing products, cart, checkout, Stripe payments, and order management. Includes an admin dashboard for store management.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Monorepo** | Turborepo, npm workspaces, TypeScript |
| **Backend** | NestJS, PostgreSQL, Drizzle ORM, better-auth |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui |

## Project Structure

```
ecommerence/
├── docs/                    # Project documentation
│   ├── START-HERE.md        # Entry point for developers
│   ├── PROJECT-STATUS-AUDIT.md
│   ├── 01-REQUIREMENTS/
│   ├── 03-ARCHITECTURE/
│   ├── 04-TASKS/
│   └── 07-DEVOPS/
└── ecom/tshirtshop/         # Monorepo root
    ├── apps/
    │   ├── backend/         # NestJS API (port 3000)
    │   └── web/             # Next.js storefront (port 3001)
    └── packages/
        ├── eslint-config/
        └── typescript-config/
```

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL
- `DATABASE_URL` and `BETTER_AUTH_SECRET` in environment

### Run Development

```bash
cd ecom/tshirtshop
npm install
npm run dev
```

- **Frontend:** http://localhost:3001  
- **Backend:** http://localhost:3000  

For HTTPS locally, see [Local HTTPS Setup](docs/LOCAL-HTTPS-SETUP.md). Set `USE_HTTPS=1` and generate certs with `node scripts/generate-tls-cert.mjs` (or use mkcert for trusted certs).  

### Seed Database

```bash
cd ecom/tshirtshop/apps/backend
npm run db:push    # Apply schema
npm run db:seed    # Populate products/categories
```

### Run Tests

```bash
cd ecom/tshirtshop/apps/backend
npm test
```

### Build

```bash
cd ecom/tshirtshop
npm run build
```

## Features

- **Auth:** Email/password, OAuth (Google), 2FA (TOTP), password reset
- **Catalog:** Products, categories, search, filters, sort, autocomplete
- **Cart:** Guest cart (cookie), user cart (session), merge on login, slide-out drawer
- **Checkout:** Address form, coupon codes (e.g. FRESHP100), Stripe payment
- **Orders:** Create, status lifecycle, cancel, refund, confirmation page
- **Reviews:** Product reviews, rating aggregation, helpful voting
- **Admin:** Products (CRUD, bulk upload, archive), orders, users, reviews

## Documentation

| Document | Purpose |
|----------|---------|
| [START-HERE.md](docs/START-HERE.md) | Developer entry point, rules, architecture |
| [PROJECT-STATUS-AUDIT.md](docs/PROJECT-STATUS-AUDIT.md) | Current implementation status |
| [ERD.md](docs/ERD.md) | Entity relationship diagram (entities, attributes, relationships, PKs, FKs) |
| [Performance Analysis Report](docs/07-DEVOPS/performance-analysis-report.md) | Load test results, throughput, bottlenecks |
| [Local HTTPS Setup](docs/LOCAL-HTTPS-SETUP.md) | Self-signed TLS for local development |
| [docs/README.md](docs/README.md) | Documentation structure |

## Status

- **Phase 1 (Foundation):** ~98% complete  
- **Phase 2 (Commerce):** ~90% complete  
- **Phase 3 (Experience):** ~70% complete  
- **Tests:** 339 pass  
- **Docker:** Not yet implemented (FND-006)
