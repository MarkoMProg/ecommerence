---
name: ecom-system-context
description: B2C e-commerce platform context. Use when understanding project domain, tech stack (NestJS, Drizzle, better-auth), monorepo structure, or feature scope.
---

# Ecom System Context

## Project Type

**tshirtshop** — B2C E-commerce Platform (single-store retail). NOT: financial system, multi-vendor marketplace, real-time trading.

## Stack

- **Backend:** NestJS, PostgreSQL, Drizzle ORM, better-auth, JWT
- **Frontend:** Next.js App Router, React, Tailwind, shadcn/ui, better-auth client
- **Monorepo:** Turborepo, npm workspaces

## Core Capabilities

Auth, product browse/search, cart, checkout, order tracking, reviews, admin.

## Architecture

Modular monolith. Each domain = separate NestJS module. No circular dependencies. Redis planned but not yet integrated.

## Auth

better-auth only. No custom JWT from scratch. Follow refresh token rotation. Never store tokens insecurely.

## Data

PostgreSQL via Drizzle. No direct SQL outside repositories. ACID transactions.

## Feature Scope

Allowed: catalog, cart, orders, reviews. Forbidden: real payment processing, multi-vendor, crypto.

## Full Reference

See [docs/05-AI-CONTEXT/system-context.md](../../docs/05-AI-CONTEXT/system-context.md)
