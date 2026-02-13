# System Architecture

## 1. Architecture Overview

The system follows a **modular monolith architecture** using:

- **NestJS** as the core application framework
- **PostgreSQL** as the primary database
- **Drizzle ORM** for database access
- **Better Auth** for authentication and session management

Redis is planned for caching and rate limiting but not yet integrated.

The architecture is designed to:

- Support future microservice extraction
- Maintain clear module boundaries
- Ensure security and auditability
- Allow horizontal scalability

---

## 2. High-Level Architecture Diagram

            ┌───────────────────────┐
            │       Frontend       │
            │   (NextJS / React)   │
            │   port 3001          │
            └───────────┬───────────┘
                        │ HTTPS
                        ▼
            ┌───────────────────────┐
            │       API Gateway     │
            │        NestJS         │
            │   port 3000           │
            └───────────┬───────────┘
                        │
  ┌─────────────────────┼─────────────────────┐
  ▼                     ▼                     ▼
┌──────────────┐ ┌────────────────┐ ┌────────────────┐
│ Auth Module  │ │ Business Logic  │ │ Infrastructure  │
│ (BetterAuth) │ │    Modules      │ │     Modules     │
└──────┬───────┘ └───────┬────────┘ └────────┬───────┘
                         │                    │
       ▼                 ▼                    ▼
┌──────────────┐ ┌────────────────┐ ┌──────────────────┐
│  PostgreSQL  │ │ External Svc   │ │ (Redis planned)  │
└──────────────┘ └────────────────┘ └──────────────────┘

---

## 3. Core Architectural Principles

### 3.1 Modular Monolith

Each domain is implemented as an independent NestJS module:

- Own controllers
- Own services
- Own database models
- Own validation logic

Modules communicate via:

- Service injection
- Domain events (future)

---

### 3.2 Separation of Concerns

New modules should strictly separate:

| Layer | Responsibility |
|------|----------------|
| Controller | HTTP handling only |
| Service | Business logic |
| Repository | Data access |
| DTO | Input/output validation |
| Entity | Database schema |

The auth module delegates to better-auth and does not use a separate repository layer.

---

### 3.3 Security First Design

Security is integrated at all levels:

- JWT authentication middleware
- Role-based access guards
- Input validation (DTO validation, custom validators, or schema libraries)
- Password hashing via better-auth
- Token revocation support

Redis-backed rate limiting is planned but not yet implemented.

---

### 3.4 Stateless API Design

The API must be stateless:

- No session storage in memory
- All auth via tokens
- Horizontal scaling ready

---

## 4. Application Layers

### 4.1 Presentation Layer

**Components:**

- REST Controllers
- Validation Pipes
- Authentication Guards
- Exception Filters

Responsibilities:

- Handle HTTP requests
- Validate input
- Return standardized responses

---

### 4.2 Application Layer

Contains:

- Business logic services
- Workflow orchestration
- Permission checks

This layer MUST NOT:

- Access database directly
- Contain HTTP logic

---

### 4.3 Domain Layer

Contains:

- Entities
- Domain rules
- Core logic

This layer should be framework-independent.

---

### 4.4 Infrastructure Layer

Includes:

- Database access (Drizzle ORM)
- External integrations (Resend, hCaptcha)
- Auth adapters (better-auth)

Redis caching is planned for future implementation.

---

## 5. Database Architecture

### 5.1 Primary Database

PostgreSQL is used for:

- Users
- Sessions
- Permissions
- Audit logs
- Business data

---

### 5.2 ORM Strategy

Drizzle ORM is used because it provides:

- Type safety
- SQL control
- Migration management
- Performance optimization

---

### 5.3 Migration Strategy

All schema changes must:

- Be tracked via migrations
- Be version controlled
- Never be applied manually

---

## 6. Caching Architecture

Redis is planned for:

- Rate limiting
- Token blacklisting
- Session caching
- Temporary data storage

Redis is not yet integrated. When implemented, it must NOT store:

- Sensitive permanent data
- Business records

---

## 7. Authentication Architecture

Authentication is handled by:

- Better Auth core engine
- NestJS adapter integration
- Drizzle PostgreSQL adapter

Features include:

- JWT access tokens
- Refresh token rotation
- Token revocation
- 2FA support
- Email verification
- Password reset flows

---

## 8. Logging & Monitoring

Logging must include:

- Request logs
- Error logs
- Authentication events
- Security violations

Future integration:

- Observability dashboards
- Metrics collection
- Alerting system

---

## 9. Scalability Strategy

The system supports scaling via:

- Stateless API design
- Database connection pooling
- Modular service boundaries

Future scaling path:

- Redis shared cache
- Extract modules into microservices
- Introduce message queues
- Implement API gateway layer

---

## 10. Non-Goals

The system does NOT include:

- GraphQL API
- Real-time WebSocket architecture
- Distributed microservices (initial phase)

---

## 11. Architecture Review Checklist

Before implementation begins, confirm:

- Module boundaries defined
- Security requirements integrated
- Data ownership per module clear
- No cross-module database access
