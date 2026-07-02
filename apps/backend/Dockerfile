# À placer dans le repo Lehena : apps/backend/Dockerfile
#
# Multi-stage build Medusa v2 (pattern "standalone").
# `medusa build` produit apps/backend/.medusa/server/ = un serveur autonome
# avec son propre package.json. On copie CE dossier dans le stage runner,
# on y install les deps prod, on lance depuis là.
#
# Publié sur GHCR par la CI, pull auto par Watchtower sur le VPS.

# ============================================================
# Stage 1 : builder
# ============================================================
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copie des manifestes du monorepo (cache-friendly)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc* ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/.npmrc* apps/backend/
# Storefront manifest requis car pnpm-workspace le référence
COPY apps/storefront/package.json apps/storefront/

# Install ALL les deps (pas de --filter : @medusajs/dashboard est transitive
# et doit être hoistée pour que Vite la trouve au build admin)
RUN pnpm install --frozen-lockfile

# Copie du code backend uniquement
COPY apps/backend/ apps/backend/

# Build : produit apps/backend/.medusa/server/ (serveur standalone)
RUN cd apps/backend && pnpm build

# Install les deps prod DU standalone
WORKDIR /app/apps/backend/.medusa/server
RUN pnpm install --prod --no-frozen-lockfile

# ============================================================
# Stage 2 : runner
# ============================================================
FROM node:22-alpine AS runner

RUN corepack enable && apk add --no-cache curl tini

WORKDIR /app

# Copie du standalone avec ses node_modules
COPY --from=builder /app/apps/backend/.medusa/server ./

# User non-root
RUN addgroup -S medusa && adduser -S -G medusa medusa && \
    chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

# Migrations puis start. Si migrations foirent → container ne boot pas → alerte.
# Pour éviter le crash-loop en cas de migration cassée, déplacer ce hook en step CI.
CMD ["sh", "-c", "pnpm exec medusa db:migrate && pnpm exec medusa start"]
