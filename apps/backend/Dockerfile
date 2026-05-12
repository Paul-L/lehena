# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────
# Lehena backend (Medusa v2) production image.
# Multi-stage: deps → builder → runner. Final image runs as a non-root
# user, exposes 9000, and ships a HEALTHCHECK pointed at /health.
# ─────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

# ───── deps ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable
WORKDIR /app

# Workspace skeleton — the lockfile + manifests are enough for pnpm
# to resolve the dependency graph for `apps/backend` and its workspace
# siblings. We copy only what we need so a sibling-app change doesn't
# bust the deps layer cache.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/

# Yalc-linked `medusa-ai-assistant` (cf. ADR-001). Stubbed in this image
# the same way CI stubs it — out-of-tree plugin lands on a future image
# once published.
RUN mkdir -p apps/backend/.yalc/medusa-ai-assistant \
  && printf '{"name":"medusa-ai-assistant","version":"0.0.0-ci-stub","main":"index.js"}\n' \
    > apps/backend/.yalc/medusa-ai-assistant/package.json \
  && printf 'module.exports = {};\n' \
    > apps/backend/.yalc/medusa-ai-assistant/index.js

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @lehena/backend...

# ───── builder ───────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app /app
COPY apps/backend/ apps/backend/

# `medusa build` outputs to apps/backend/.medusa/server.
WORKDIR /app/apps/backend
RUN pnpm build

# ───── runner ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
RUN corepack enable && apk add --no-cache curl
WORKDIR /app

# Non-root user. Medusa doesn't require any privileged operations.
RUN addgroup -S medusa && adduser -S medusa -G medusa
USER medusa

ENV NODE_ENV=production
ENV PORT=9000

COPY --from=builder --chown=medusa:medusa /app /app

WORKDIR /app/apps/backend

# /health (Phase 12) is the canonical liveness probe — covers Postgres +
# event bus. 15s timeout because the first invocation might still be
# warming the connection pool.
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/health || exit 1

EXPOSE 9000
CMD ["pnpm", "start"]
