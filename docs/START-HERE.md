# 🚀 START HERE — PROJECT ENTRY GUIDE

## 1. Purpose of This Document

This document is the **entry point** for anyone working on the `tshirtshop` project.

It provides a quick understanding of:

* What the project is
* What technology is used
* How the system is structured
* Where to begin development
* What rules must always be followed

This file MUST be read before writing any code.

---

# 2. What This Project Is

## Project Name

**tshirtshop**

## System Type

This is a:

👉 **Full-Stack B2C E-Commerce Platform**

It allows customers to:

* Register securely
* Browse products
* Search and filter items
* Add items to cart
* Complete checkout
* Simulate payments
* Manage orders
* Leave product reviews

It also provides an **admin dashboard** to manage the store.

---

# 3. Project Architecture Overview

The system follows a:

👉 **Modular Monolith Architecture**

Meaning:

* One backend application
* Separate domain modules
* Clear boundaries between features
* Future microservice readiness

---

# 4. Tech Stack (Authoritative)

## Monorepo

* Turborepo
* npm workspaces
* TypeScript

---

## Backend Stack

* **NestJS** — API framework
* **PostgreSQL** — primary database
* **Drizzle ORM** — database layer
* **better-auth** — authentication system
* **JWT** — access & refresh tokens

Docker is planned (FND-006) but not yet implemented.

---

## Frontend Stack

* **Next.js (App Router)**
* **React**
* **Tailwind CSS**
* **shadcn/ui** (planned; not yet implemented)
* **better-auth client**

---

# 5. Authentication System (IMPORTANT)

Authentication is implemented using:

## ✅ better-auth

This is the **ONLY** authentication system used.

It handles:

* Email/password login
* OAuth login
* JWT access tokens
* Refresh token rotation
* Token revocation
* Password reset flows
* 2FA (TOTP)
* CAPTCHA integration

---

## What Must NEVER Be Done

❌ Do NOT build custom JWT logic
❌ Do NOT store tokens insecurely
❌ Do NOT store passwords or card data

Always use **better-auth APIs**.

---

# 6. System Modules Overview

The backend is divided into domain modules.

---

## Core Infrastructure

* Config
* Database
* Common utilities

---

## Authentication Domain

* Auth module (better-auth integration)

---

## Business Domains

* Users
* Catalog
* Cart
* Orders
* Payments
* Reviews
* Admin

Each module must remain isolated.

---

# 7. Development Phases

The project is built in three phases.

---

## Phase 1 — Foundation

Build core infrastructure:

* Authentication
* Database schema
* Product catalog
* Search functionality

---

## Phase 2 — Commerce

Build purchasing workflows:

* Cart
* Checkout
* Payment simulation
* Order management

---

## Phase 3 — Experience

Build full UI and advanced features:

* Frontend pages
* Reviews
* Admin dashboard
* Security hardening

---

# 8. Most Important Development Rules

These rules override all others.

---

## Rule #1 — Follow Architecture

* Controllers = HTTP only
* Services = Business logic
* Repositories = Database access

---

## Rule #2 — Respect Dependencies

Do NOT build:

* Orders before cart
* Cart before catalog
* Reviews before users

---

## Rule #3 — Security First

All code must include:

* Input validation
* Auth guards
* Role checks
* Safe error handling

---

## Rule #4 — Test Everything

Every feature must include:

* Unit tests
* Integration tests
* Validation tests

---

# 9. Where to Start Development

Follow this exact order:

---

## Step 1

Read:

* Requirements docs
* Architecture docs
* Dependency graph

---

## Step 2

Confirm local setup works:

* PostgreSQL is running (local or your own container)
* `npm run dev` from monorepo root starts backend and frontend
* Frontend at `http://localhost:3001`, backend at `http://localhost:3000`

---

## Step 3

Begin with:

👉 Authentication integration (better-auth)

Then continue in roadmap order.

---

# 10. Documentation Navigation Map

Start reading documentation in this order:

1️⃣ Requirements
2️⃣ Architecture
3️⃣ Authentication Architecture
4️⃣ Task Board
5️⃣ Development Roadmap

---

# 11. AI Agent Instructions

AI agents MUST:

* Read AI context docs first
* Follow coding rules
* Verify task board before coding
* Respect module boundaries

AI agents must NOT generate code outside scope.

---

# 12. Quick System Mental Model

Think of the system as:

```
Users → Browse Products → Add to Cart → Checkout → Payment → Order → Review
```

Everything else supports this flow.

---

# 13. Final Reminder

This project prioritizes:

* Security
* Clean architecture
* Scalability
* Maintainability

Speed of development must NEVER compromise these goals.

---

END OF DOCUMENT
