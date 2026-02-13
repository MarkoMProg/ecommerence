# Deployment Architecture

## 1. Purpose of This Document

This document defines the **deployment architecture** for the `tshirtshop` platform.

It explains:

* How the system is containerized
* How services are configured
* How environments are structured
* How the application is started and managed

All deployments must follow this architecture.

---

# 2. Deployment Goals

The deployment strategy must ensure:

* Environment consistency
* Secure configuration handling
* Scalability readiness
* Easy local development

---

# 3. Current Deployment State

**As of now, the project does not include Dockerfiles or docker-compose.** Services run via:

* `npm run dev` from monorepo root (Turborepo runs both apps)
* Or run backend (`apps/backend`) and frontend (`apps/web`) separately

PostgreSQL must be available externally (local install or your own container). Redis is not yet integrated.

---

# 4. Target Containerization Strategy (Planned)

The system will be containerized using **Docker** (FND-006). Each major component will run in its own container.

---

## Planned Core Containers

1. Backend API container
2. Frontend web container
3. PostgreSQL database container
4. Redis cache container (optional, for rate limiting and caching)

---

# 5. Service Architecture Diagram (Current)

```
             ┌──────────────────────┐
             │   Next.js Frontend   │
             │   (port 3001)        │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │    NestJS Backend    │
             │    (port 3000)       │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │     PostgreSQL       │
             └──────────────────────┘
```

---

# 6. Docker Requirements (Planned)

The project will include:

* Dockerfiles for each service
* A Docker Compose configuration
* A single command to start the entire system

Example startup command (when implemented):

```
docker-compose up --build
```

---

# 7. Backend Container Configuration (Planned)

The backend container will include:

* Node.js runtime
* NestJS application build
* Environment variable configuration

The backend will connect to:

* PostgreSQL container
* Redis container (when implemented)

---

# 8. Frontend Container Configuration (Planned)

The frontend container will include:

* Node.js runtime
* Next.js application build
* API URL configuration

The frontend communicates with the backend via internal Docker networking.

---

# 9. Database Container Configuration (Planned)

The PostgreSQL container will:

* Use persistent storage volumes
* Support automatic initialization
* Be accessible only within the internal network

Database credentials must be stored in environment variables.

---

# 10. Environment Configuration

The system must support multiple environments.

---

## Required Environments

* Development
* Testing
* Production

Each environment must have separate configuration files.

---

## Environment Variables

Sensitive data must be stored in environment variables, including:

* Database credentials
* JWT secrets
* OAuth keys
* Email service keys

---

# 11. Secure Configuration Practices

The system must ensure:

* Secrets are never committed to source control
* Environment files are properly ignored
* Sensitive values are encrypted when possible

---

# 12. Deployment Workflow

When Docker is implemented, the deployment process will follow:

1. Build Docker images
2. Configure environment variables
3. Start containers
4. Run database migrations via `drizzle-kit`
5. Verify system health

Currently, deploy by building each app (`turbo run build`) and running with Node.js.

---

# 13. Database Migration Strategy

All database schema changes must:

* Use Drizzle migration scripts
* Be executed during deployment
* Be version-controlled

---

# 14. Logging and Monitoring

Deployment must include:

* Application logs
* Error logs
* Authentication logs

Logs should be accessible via container output.

---

# 15. Scalability Considerations

The deployment architecture must support future scaling:

* Horizontal backend scaling
* Load balancing
* External caching layers
* Message queue integration

---

# 16. Local Development Setup

Developers start the system with:

```
npm run dev
```

From the monorepo root (`tshirtshop`). This runs backend and frontend via Turborepo. PostgreSQL must be running separately.

When Docker is implemented (FND-006), a single `docker-compose up` will initialize database, backend, and frontend.
