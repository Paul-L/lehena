# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────
# Lehena storefront (Next.js 15) production image.
# Multi-stage: deps → builder → runner. Standalone output keeps the
# final image well under 200 MB.
# ─────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

# ───── deps ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/storefront/package.json apps/storefront/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @lehena/storefront...

# ───── builder ───────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app /app
COPY apps/storefront/ apps/storefront/

# Next reads NEXT_PUBLIC_* at build time (statically inlined into the
# bundle). These ARGs let the deployment pipeline pass them through
# without leaking secrets — keep them prefix-free for vars that aren't
# really secrets, surface SENTRY_AUTH_TOKEN via --secret for sourcemap
# upload (Phase 13 / Sentry CLI integration).
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN
ARG NEXT_PUBLIC_SENTRY_DSN
# next.config.js whitelists this host in images.remotePatterns (/static/**)
# so next/image can load product images served by the Medusa backend.
ARG MEDUSA_BACKEND_HOSTNAME
ARG MEDUSA_BACKEND_PROTOCOL

WORKDIR /app/apps/storefront
RUN pnpm build

# ───── runner ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js 15 standalone output: the .next/standalone/ directory carries
# everything (server.js + minimal node_modules). Copy only what we need.
COPY --from=builder --chown=nextjs:nextjs /app/apps/storefront/.next/standalone /app
COPY --from=builder --chown=nextjs:nextjs /app/apps/storefront/.next/static /app/apps/storefront/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/storefront/public /app/apps/storefront/public

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/api/health || exit 1

EXPOSE 3000
CMD ["node", "apps/storefront/server.js"]
