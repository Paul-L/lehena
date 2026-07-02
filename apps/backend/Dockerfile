# À placer dans le repo Lehena : apps/backend/Dockerfile
#
# Pattern "workspace preserved" : on garde la structure monorepo dans
# l'image finale, node_modules hoisté à /app/node_modules (via .npmrc
# node-linker=hoisted), et on démarre depuis apps/backend/ où `medusa
# start` trouve .medusa/server/public/admin/ automatiquement.
#
# Pattern plus lourd que le standalone (~150 Mo de plus) mais fiable et
# aligné sur le pnpm workspace du monorepo.

# ============================================================
# Stage 1 : builder
# ============================================================
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Manifestes du monorepo (cache-friendly)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY .npmrc* ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/.npmrc* apps/backend/
# Storefront manifest requis par pnpm-workspace
COPY apps/storefront/package.json apps/storefront/

# Install ALL les deps du workspace (dashboard transitive hoistée)
RUN pnpm install --frozen-lockfile

# Copie du code backend uniquement
COPY apps/backend/ apps/backend/

# Build : produit apps/backend/.medusa/server/ (avec public/admin/)
RUN cd apps/backend && pnpm build

# Assertion défensive : si medusa build s'est terminé sans .medusa/server/,
# on fait planter le build ici plutôt que de publier une image cassée.
RUN test -d /app/apps/backend/.medusa/server \
    && test -f /app/apps/backend/.medusa/server/package.json \
    && test -f /app/apps/backend/.medusa/server/public/admin/index.html \
    || (echo "FATAL: medusa build did not produce a valid .medusa/server/ directory" && ls -la /app/apps/backend/.medusa/ 2>&1 && exit 1)

# ============================================================
# Stage 2 : runner
# ============================================================
FROM node:22-alpine AS runner

RUN corepack enable && apk add --no-cache curl tini

WORKDIR /app

# node_modules hoisté du workspace root (via .npmrc hoisted)
COPY --from=builder /app/node_modules ./node_modules
# Manifestes du workspace (pour que pnpm exec les trouve)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc* ./
# Backend complet (avec .medusa/server/ dedans)
COPY --from=builder /app/apps/backend ./apps/backend

# User non-root
RUN addgroup -S medusa && adduser -S -G medusa medusa && \
    chown -R medusa:medusa /app

USER medusa
WORKDIR /app/apps/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

# medusa start lit .medusa/server/ automatiquement pour l'admin bundle.
CMD ["sh", "-c", "pnpm exec medusa db:migrate && pnpm exec medusa start"]
