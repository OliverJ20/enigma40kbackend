# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for the wh40k-lists-backend Hono service.
# Optimised for Cloud Run: small image, non-root user, single PORT
# env variable, fast cold start.
# ──────────────────────────────────────────────────────────────

# ── Stage 1: deps ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm via corepack — smaller than npm install -g
RUN corepack enable
RUN corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: build ────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml* tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN pnpm run build
# Prune to production-only deps for the runtime image
RUN pnpm prune --prod

# ── Stage 3: runtime ──────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Cloud Run sets PORT; default to 8080 for local docker run.
ENV NODE_ENV=production \
    PORT=8080

# Non-root user for the runtime
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json

USER app
EXPOSE 8080

# Use exec form so SIGTERM propagates to node and Cloud Run can shut
# the container down cleanly.
CMD ["node", "dist/server.js"]
