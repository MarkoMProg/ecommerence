---
name: ecom-architecture
description: Architecture docs for tshirtshop. Use when discussing auth, payments, system design, layered architecture, or module boundaries.
---

# Ecom Architecture

## Overview

Modular monolith: NestJS, PostgreSQL, Drizzle, Better Auth. Redis planned, not yet integrated.

## Layers

| Layer | Contains |
|-------|----------|
| Presentation | REST controllers, validation pipes, auth guards, exception filters |
| Application | Business logic services, workflows, permission checks (no DB, no HTTP) |
| Domain | Entities, domain rules (framework-independent) |
| Infrastructure | Drizzle, Resend, better-auth adapters |

## Module Rules

- Each domain = independent NestJS module
- Own controllers, services, models, validation
- Communicate via service injection
- No circular dependencies
- No cross-module DB access

## Auth

Better Auth: JWT, refresh rotation, 2FA, email verification, password reset. Drizzle PostgreSQL adapter.

## Database

PostgreSQL. Drizzle ORM. All schema changes via migrations, version controlled.

## Non-Goals

No GraphQL, no WebSockets, no distributed microservices (initial phase).

## Full Reference

- [docs/03-ARCHITECTURE/system-architecture.md](../../docs/03-ARCHITECTURE/system-architecture.md)
- [docs/03-ARCHITECTURE/authentication-architecture.md](../../docs/03-ARCHITECTURE/authentication-architecture.md)
- [docs/03-ARCHITECTURE/payment-flow-and-message-queue.md](../../docs/03-ARCHITECTURE/payment-flow-and-message-queue.md)
