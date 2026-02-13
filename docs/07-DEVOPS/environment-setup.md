# Environment Setup

## 1. Purpose of This Document

This document provides instructions for setting up the **local development environment** for the `tshirtshop` platform.

It ensures:

* Consistent development setup
* Minimal onboarding time
* Proper configuration of dependencies
* Successful system startup

All developers must follow this guide before working on the project.

---

# 2. System Requirements

The following tools must be installed on the local machine.

---

## Required Software

| Tool       | Minimum Version |
| ---------- | --------------- |
| Node.js   | 18+             |
| npm       | 11+             |
| Git       | Latest stable   |
| PostgreSQL| 14+ (local or via Docker) |

Docker is optional; PostgreSQL can run locally or in your own container. The project does not yet include Dockerfiles or docker-compose.

---

# 3. Project Setup Steps

Follow these steps to set up the project locally.

---

## Step 1 — Clone the Repository

```
git clone <repository-url>
cd tshirtshop
```

---

## Step 2 — Install Dependencies

Install all monorepo dependencies:

```
npm install
```

This installs dependencies for:

* Backend
* Frontend
* Shared packages

---

## Step 3 — Configure Environment Variables

Create environment files for local development.

---

### Backend Environment File

Create:

```
apps/backend/.env
```

Include:

* Database connection string
* JWT secret
* OAuth credentials
* Email service keys

---

### Frontend Environment File

Create:

```
apps/web/.env.local
```

Include:

* Backend API URL
* Public authentication keys

---

# 4. Database Setup

PostgreSQL must be available. Run it locally or via your own Docker setup.

---

## Run Database Migrations

From the backend directory:

```
cd apps/backend
npx drizzle-kit push
```

Or generate and run migrations:

```
npx drizzle-kit generate
npx drizzle-kit migrate
```

Ensure `DATABASE_URL` is set in `apps/backend/.env` before running.

---

# 5. Running the Application

The project uses Turborepo. Start all apps from the monorepo root:

```
cd tshirtshop
npm run dev
```

This runs both backend and frontend in watch mode.

---

## Accessing the Application

After startup:

* Frontend: `http://localhost:3001`
* Backend API: `http://localhost:3000` (or `PORT` env var)

---

# 6. Development Mode

To run apps individually:

---

## Backend Only

```
cd apps/backend
npm run dev
```

---

## Frontend Only

```
cd apps/web
npm run dev
```

The frontend proxies `/api/*` and `/api/v1/*` to the backend. Set `API_URL` in `apps/web/.env.local` to point to the backend (e.g. `http://localhost:3000`).

---

# 7. Common Setup Issues

---

## Port Conflicts

If ports are already in use:

* Update Docker configuration
* Modify local environment variables

---

## Database Connection Errors

Verify:

* PostgreSQL is running (local or container)
* `DATABASE_URL` in `apps/backend/.env` is correct
* Migrations have been applied via `drizzle-kit`

---

## Dependency Installation Errors

Ensure:

* Correct Node.js version
* Clean install performed (`rm -rf node_modules`)

---

# 8. Environment Setup Checklist

Before starting development, confirm:

* PostgreSQL is available
* Dependencies installed (`npm install` from monorepo root)
* Environment variables configured (`apps/backend/.env`, `apps/web/.env.local`)
* Database migrations applied
* `npm run dev` starts both services successfully

---

# 9. Next Document

Proceed to:

`docs/07-DEVOPS/ci-cd-guidelines.md`

This document defines:

* Continuous integration practices
* Automated testing workflows
* Build and deployment pipelines

---

END OF DOCUMENT
