# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /repo

# 1. Restore dependencies – cached until package files change
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
# Use `npm install` (not `npm ci`) so npm can resolve platform-specific optional
# packages for the current OS/architecture.  `npm ci` strictly reproduces the
# lockfile which was generated on Windows and therefore only contains the
# Windows binary for @tailwindcss/oxide; on Linux it would miss the
# linux-x64-musl variant needed by Alpine.
RUN npm install
# The lockfile was generated on Windows and has no entry for the Alpine Linux
# (musl) native binding of @tailwindcss/oxide.  Installing it explicitly here
# ensures Turbopack/PostCSS can load TailwindCSS during `next build`.
RUN npm install --no-save @tailwindcss/oxide-linux-x64-musl@4.1.18

# 2. Copy source
COPY apps/web/ ./apps/web/

# NEXT_PUBLIC_* vars must be present at build time so Next.js can inline them
# into the client bundle.  Pass via docker-compose build.args.
ARG NEXT_PUBLIC_RECAPTCHA_SITEKEY
ENV NEXT_PUBLIC_RECAPTCHA_SITEKEY=$NEXT_PUBLIC_RECAPTCHA_SITEKEY

# Placeholder URL so the build doesn't crash if a route tries to fetch at
# static-generation time.  The real value is injected at runtime via env_file.
ENV API_URL=http://placeholder
ENV NODE_ENV=production

RUN npm run build -w apps/web

# ─── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output mirrors the monorepo layout relative to
# outputFileTracingRoot (repo root).  The generated entry point is therefore
# apps/web/server.js inside the standalone directory.
COPY --from=builder /repo/apps/web/.next/standalone     ./
COPY --from=builder /repo/apps/web/.next/static         ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public               ./apps/web/public

# certs/ is bind-mounted at /app/certs at runtime (docker-compose.yml) so
# NODE_EXTRA_CA_CERTS can trust the backend's self-signed cert.

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
