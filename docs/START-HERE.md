
# START HERE — PROJECT ENTRY GUIDE

## System Overview

tshirtshop is a full‑stack B2C e‑commerce platform.

Core capabilities:
- Secure authentication using better-auth
- Product catalog browsing
- Shopping cart management
- Checkout and payment simulation
- Order lifecycle tracking
- Product reviews
- Admin management dashboard

## Tech Stack

Backend:
NestJS + PostgreSQL + Drizzle ORM + better-auth

Frontend:
Next.js App Router + React + Tailwind + shadcn/ui

Architecture:
Modular monolith with strict domain boundaries.

## Authentication

Auth is implemented using better-auth ONLY.

Features:
- Email/password login
- OAuth providers
- JWT access tokens
- Refresh token rotation
- Token revocation
- Password reset
- 2FA TOTP support
- CAPTCHA protection

Never implement custom auth logic.

## Development Phases

1. Foundation
2. Commerce
3. Experience

Follow documentation order before coding.
