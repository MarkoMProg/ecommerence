# AI Coding Rules

## 1. Purpose of This Document

This document defines the **mandatory coding rules** that AI agents must follow when generating code for the `tshirtshop` project.

These rules ensure:

* Consistency across the codebase
* Security compliance
* Architectural integrity
* Maintainability

AI-generated code that violates these rules must be considered invalid.

---

# 2. General Coding Principles

AI agents must generate code that is:

* Type-safe
* Readable
* Consistent
* Modular
* Fully validated
* Secure by default

All code must follow **TypeScript strict mode**.

---

# 3. Architecture Compliance Rules

AI agents must respect the layered architecture.

---

## 3.1 Controller Rules

Controllers must:

* Only handle HTTP requests
* Perform input validation
* Call services for logic

Controllers must NOT:

* Contain business logic
* Access the database directly
* Perform data transformations

---

## 3.2 Service Rules

Services must:

* Contain business logic
* Enforce domain rules
* Coordinate workflows

Services must NOT:

* Handle HTTP responses
* Perform direct database queries

---

## 3.3 Repository Rules

Repositories must:

* Contain all database access logic
* Use Drizzle ORM exclusively
* Implement query optimization

Repositories must NOT:

* Contain business logic
* Perform validation

---

# 4. Database Rules

AI agents must:

* Use Drizzle schema definitions
* Respect foreign key constraints
* Use transactions for multi-step operations

AI agents must NOT:

* Execute raw SQL without necessity
* Bypass repository layer
* Modify schema outside migrations

---

# 5. Authentication Rules

AI agents must:

* Use better-auth for all authentication logic
* Respect JWT lifecycle rules
* Implement refresh token rotation

AI agents must NOT:

* Build custom authentication systems
* Store tokens insecurely
* Expose sensitive user data

---

# 6. Security Rules

All generated code must enforce:

* Input validation
* Proper error handling
* Authorization checks
* Secure data handling

Sensitive data must never be:

* Logged
* Stored in plaintext
* Exposed in API responses

---

# 7. API Design Rules

AI-generated APIs must:

* Follow REST conventions
* Use proper HTTP status codes
* Return consistent response formats
* Provide clear error messages

---

# 8. Naming Conventions

AI agents must use consistent naming.

---

## Backend Naming

* Modules: `PascalCase`
* Services: `PascalCaseService`
* Controllers: `PascalCaseController`
* DTOs: `PascalCaseDto`

---

## Database Naming

* Tables: `snake_case`
* Columns: `snake_case`
* Foreign keys: `<entity>_id`

---

## Frontend Naming

* Components: `PascalCase`
* Hooks: `useCamelCase`
* Files: `kebab-case`

---

# 9. Validation Rules

All inputs must be validated using:

* DTO validation
* Schema validation libraries (e.g. Zod) or custom validation functions

The auth module uses custom validation functions in `auth/dto/auth.dto.ts`. New modules may use Zod or similar.

AI agents must NOT:

* Trust client-provided data
* Accept unvalidated input

---

# 10. Error Handling Rules

All generated code must:

* Use centralized exception handling
* Return structured error responses
* Avoid exposing internal system details

---

# 11. Testing Rules

Every generated feature must include:

* Unit tests for business logic
* Integration tests for APIs
* Validation tests for input handling

AI agents must not generate untested functionality.

---

# 12. Performance Rules

AI agents must:

* Implement pagination for lists
* Avoid N+1 query problems
* Optimize database queries
* Use caching where appropriate

---

# 13. Forbidden Actions

AI agents must NEVER:

* Store payment card data
* Expose passwords
* Bypass authentication checks
* Modify unrelated modules
* Introduce circular dependencies

---

# 14. Code Documentation Rules

AI-generated code must include:

* Clear function descriptions
* Inline comments for complex logic
* Proper typing for all parameters

---

# 15. AI Task Execution Workflow

Before generating code, AI agents must:

1. Confirm task exists in task board
2. Verify dependencies are satisfied
3. Identify target module
4. Follow architecture rules
5. Generate tests alongside implementation
