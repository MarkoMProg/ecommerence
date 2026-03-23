# ─── Stage 1: Install ALL deps (cached layer shared by all subsequent stages) ──
FROM node:22-alpine AS deps-all
WORKDIR /repo
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/
RUN npm ci

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM deps-all AS builder
# Copy backend source and compile NestJS → dist/
COPY apps/backend/ ./apps/backend/
RUN npm run build -w apps/backend

# ─── Stage 3: Migrator ─────────────────────────────────────────────────────────
# One-shot container that runs `drizzle-kit push` to apply the schema.
# Uses the full (untuned) node_modules so drizzle-kit is available.
# Mirrors the monorepo layout so db-push.mjs path resolution works:
#   __dirname       = /repo/apps/backend/scripts
#   backendDir      = /repo/apps/backend
#   drizzlePath     = /repo/node_modules/drizzle-kit/bin.cjs  ✓
FROM node:22-alpine AS migrator
WORKDIR /repo/apps/backend
# Full node_modules (includes drizzle-kit)
COPY --from=deps-all /repo/node_modules        /repo/node_modules
# Migration scripts + schema source that drizzle-kit needs to read
COPY --from=builder  /repo/apps/backend/scripts          ./scripts
COPY --from=builder  /repo/apps/backend/drizzle.config.ts ./
COPY --from=builder  /repo/apps/backend/src               ./src
# DATABASE_URL is injected via env_file in docker-compose.
# db-push.mjs also tries to load .env with dotenv (silently skipped if absent).
CMD ["node", "scripts/db-push.mjs"]

# ─── Stage 4: Seeder (one-shot database population) ─────────────────────────────
# Runs seed + populate + create-load-test-user + bootstrap-admin in order.
# docker compose run --rm seeder
FROM node:22-alpine AS seeder
WORKDIR /repo/apps/backend
COPY --from=deps-all /repo/node_modules                    /repo/node_modules
COPY --from=deps-all /repo/apps/backend/node_modules       ./node_modules
COPY --from=builder  /repo/apps/backend/package.json       ./package.json
COPY --from=builder  /repo/apps/backend/scripts            ./scripts
# Product catalog JSON + images — copied to a staging dir so the seed script
# can move them into the uploads volume at runtime.
COPY apps/backend/public/uploads/products/ ./seed-products/
CMD ["node", "scripts/docker-seed-all.mjs"]

# ─── Stage 5: Production runner (pruned deps) ──────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prod-only node_modules (strip devDeps in a throwaway layer)
COPY --from=deps-all /repo/node_modules              /repo/node_modules
COPY --from=deps-all /repo/apps/backend/package.json /repo/apps/backend/package.json
RUN cd /repo && npm prune --omit=dev

# Compiled application
COPY --from=builder /repo/apps/backend/dist         ./dist
# Pruned node_modules (workspace root – hoisted by npm workspaces)
COPY --from=deps-all /repo/node_modules              ./node_modules
# package.json is required for module-specifier resolution at runtime
COPY --from=builder /repo/apps/backend/package.json ./

# Ensure the uploads directory exists; the named volume in compose overlays it
RUN mkdir -p ./public/uploads

# certs/ is bind-mounted read-only at runtime (see docker-compose.yml)
EXPOSE 3000
# NestJS compiles src/ → dist/src/ because no rootDir is set in tsconfig;
# tsc preserves the folder structure relative to the project root.
CMD ["node", "dist/src/main"]
