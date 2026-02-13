
# System Architecture

Architecture style: Modular Monolith.

Layers:
Controllers — handle HTTP
Services — business logic
Repositories — database access
Entities — schema definitions

Primary infrastructure:
NestJS API + PostgreSQL database.

Design principles:
- API‑first development
- Stateless authentication
- Domain isolation
- Horizontal scalability readiness
