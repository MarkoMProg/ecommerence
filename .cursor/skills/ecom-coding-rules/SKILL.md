---
name: ecom-coding-rules
description: Coding rules for tshirtshop. Use when writing or reviewing code: controllers, services, Drizzle ORM, auth, security-sensitive code, or validation.
---

# Ecom Coding Rules

## Architecture Layers

| Layer | Responsibility | Must NOT |
|-------|----------------|----------|
| Controller | HTTP only, input validation, call services | Business logic, DB access, data transforms |
| Service | Business logic, domain rules, workflows | HTTP handling, direct DB queries |
| Repository | DB access via Drizzle | Business logic, validation |

Auth delegates to better-auth; no separate repository.

## Database

- Use Drizzle ORM exclusively
- Drizzle schema definitions for all tables
- Transactions for multi-step operations
- Never raw SQL without necessity; never bypass repository; never modify schema outside migrations

## Auth & Security

- Use better-auth for all auth logic
- Input validation on all endpoints
- Never store payment card data, expose passwords, or bypass auth checks
- Sensitive data: never logged, never plaintext, never in API responses

## Naming

- Backend: `PascalCaseService`, `PascalCaseController`, `PascalCaseDto`
- DB: `snake_case` tables/columns, `<entity>_id` for FKs
- Frontend: `PascalCase` components, `useCamelCase` hooks, `kebab-case` files

## Forbidden

- Store payment card data
- Expose passwords
- Bypass authentication
- Modify unrelated modules
- Introduce circular dependencies

## Full Reference

See [docs/05-AI-CONTEXT/coding-rules.md](../../docs/05-AI-CONTEXT/coding-rules.md)
