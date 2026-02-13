# AI System Context

## 1. Purpose of This Document

This document provides **essential context** for AI coding agents working on the `tshirtshop` project.

It ensures AI systems:

* Understand the system domain
* Follow correct architecture rules
* Avoid generating invalid or out-of-scope code
* Respect project requirements

All AI agents MUST read this before generating code.

---

# 2. Project Domain Context

## System Type

This project is a **B2C E-commerce Platform**.

It is NOT:

* A financial system
* A marketplace for multiple vendors
* A real-time trading platform

It is a **single-store online retail application**.

---

## Core Capabilities

The system must support:

* Secure user authentication
* Product browsing and search
* Shopping cart management
* Checkout and payment simulation
* Order tracking
* Product reviews
* Administrative management

---

# 3. Technology Context

AI agents must generate code compatible with the existing stack.

---

## Backend Stack

* NestJS framework
* PostgreSQL database
* Drizzle ORM
* better-auth authentication system
* JWT token strategy

---

## Frontend Stack

* Next.js App Router
* React components
* Tailwind CSS
* shadcn/ui components
* better-auth client integration

---

## Monorepo Structure

The project uses:

* Turborepo
* npm workspaces
* Shared TypeScript configurations

AI agents must respect monorepo boundaries.

---

# 4. System Architecture Context

The system follows a **Modular Monolith Architecture**.

Key rules:

* Each domain is a separate module
* Modules must not have circular dependencies
* Controllers handle HTTP only
* Services handle business logic
* Repositories handle database access (auth delegates to better-auth; no separate repository)

Redis and Docker are not yet implemented.

---

# 5. Authentication Context

Authentication is implemented using **better-auth**.

AI agents must NOT:

* Implement custom JWT systems from scratch
* Store authentication tokens insecurely
* Bypass token validation mechanisms

Instead, agents must:

* Use better-auth APIs
* Follow refresh token rotation rules
* Respect token expiration logic

---

# 6. Data Handling Context

All persistent data must be stored in PostgreSQL.

AI agents must:

* Use Drizzle ORM for all database interactions
* Avoid direct SQL queries outside repositories
* Maintain ACID-compliant transaction logic

---

# 7. Security Context

Security is a critical requirement.

AI agents must enforce:

* Input validation for all endpoints
* Proper authentication guards
* Role-based access controls
* No storage of sensitive payment data

Payment card details must NEVER be stored.

---

# 8. Feature Scope Context

AI agents must only implement features that exist in the official requirements.

Examples of allowed features:

* Product catalog functionality
* Cart operations
* Order processing
* Review systems

Examples of forbidden features:

* Real payment processing
* Multi-vendor marketplace logic
* Cryptocurrency integrations

---

# 9. Coding Context

AI-generated code must:

* Follow TypeScript best practices
* Respect existing module structure
* Use consistent naming conventions
* Include validation and error handling

---

# 10. Testing Context

All generated features must include:

* Unit tests for core logic
* Integration tests for APIs
* Validation tests for input handling

AI agents must not generate untested code.

---

# 11. Performance Context

AI agents must:

* Use pagination for large datasets
* Avoid inefficient database queries
* Implement caching where appropriate

---

# 12. Documentation Context

When generating new features, AI agents must:

* Update task tracking documentation
* Add relevant comments to code
* Follow documentation templates

---

# 13. AI Agent Workflow

Before generating code, AI agents must:

1. Review system requirements
2. Check dependency graph
3. Confirm task status
4. Validate module ownership
5. Ensure compliance with architecture rules

---

# 14. Common AI Mistakes to Avoid

AI agents must avoid:

* Mixing business logic into controllers
* Skipping input validation
* Creating redundant modules
* Violating dependency rules
* Ignoring authentication requirements