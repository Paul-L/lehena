# À placer dans le repo Lehena : apps/backend/Dockerfile
#
# Multi-stage build pour le backend Medusa v2 dans un monorepo pnpm.
# Publié sur GHCR par la CI, pull automatiquement par Watchtower sur le VPS.

# ============================================================
# Stage 1 : builder
# ============================================================
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Cache : d'abord les manifestes pnpm pour un install cacheable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/

# Install à froid
RUN pnpm install --frozen-lockfile --filter=@lehena/backend...

# Copie du code
COPY apps/backend/ apps/backend/

# Build
WORKDIR /app/apps/backend
RUN pnpm build

# ============================================================
# Stage 2 : runner (image finale)
# ============================================================
FROM node:20-alpine AS runner

RUN corepack enable && apk add --no-cache curl tini

WORKDIR /app

# Copie des artefacts build + node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Utilisateur non-root
RUN addgroup -S medusa && adduser -S -G medusa medusa && \
    chown -R medusa:medusa /app

USER medusa
WORKDIR /app/apps/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Tini comme init pour gérer proprement SIGTERM
ENTRYPOINT ["/sbin/tini", "--"]

# Migrations au démarrage puis start
# → si les migrations échouent, le container ne boot pas
# → à toi de décider si tu veux ce comportement ou de déplacer les migrations
#   en step CI dédiée (recommandé si tes migrations sont sensibles)
CMD ["sh", "-c", "pnpm exec medusa db:migrate && pnpm start"]
