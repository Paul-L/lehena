#!/usr/bin/env bash
#
# 30-stack.sh — Installation de la stack Medusa (Postgres + Redis + MeiliSearch + backend).
#
# À exécuter en tant qu'utilisateur DEPLOY_USER (paul), après 20-traefik.sh.
# Idempotent.
#
# Cette passe démarre TOUT sauf le backend Medusa (l'image ne sera disponible
# qu'après le premier build de la CI). Un `deploy.sh` final démarre le backend.

set -euo pipefail

# ==== À CONFIGURER ====================================================
DEPLOY_HOSTNAME="backend.lehena.fr"
GHCR_IMAGE="ghcr.io/paul-l/lehena-backend"
STOREFRONT_URLS="https://lehena.fr,https://www.lehena.fr"
# ======================================================================

log()  { echo -e "\033[1;34m[stack]\033[0m $*"; }
die()  { echo -e "\033[1;31m[stack ERROR]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && die "Ce script doit être exécuté en $USER, pas root."
command -v docker &>/dev/null || die "Docker n'est pas installé."

INSTALL_DIR=/srv/lehena/medusa
mkdir -p "$INSTALL_DIR/data"/{postgres,redis,meilisearch}

ENV_FILE="$INSTALL_DIR/.env"

# --- Génération des secrets si .env absent -----------------------------
if [[ ! -f "$ENV_FILE" ]]; then
    log "Génération des secrets"

    POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/=+' | cut -c1-32)"
    REDIS_PASSWORD="$(openssl rand -base64 24 | tr -d '/=+' | cut -c1-32)"
    MEILI_MASTER_KEY="$(openssl rand -base64 32 | tr -d '/=+' | cut -c1-48)"
    JWT_SECRET="$(openssl rand -base64 32 | tr -d '/=+' | cut -c1-48)"
    COOKIE_SECRET="$(openssl rand -base64 32 | tr -d '/=+' | cut -c1-48)"

    cat > "$ENV_FILE" <<EOF
# =============================================================
# .env généré par 30-stack.sh — $(date -Iseconds)
# NE JAMAIS COMMITER. Sauvegardé par backup.sh.
# =============================================================

# --- Postgres ---
POSTGRES_USER=medusa
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=medusa
DATABASE_URL=postgres://medusa:$POSTGRES_PASSWORD@postgres:5432/medusa

# --- Redis ---
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379

# --- MeiliSearch ---
MEILI_MASTER_KEY=$MEILI_MASTER_KEY
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_API_KEY=$MEILI_MASTER_KEY

# --- Medusa ---
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

STORE_CORS=$STOREFRONT_URLS
ADMIN_CORS=https://$DEPLOY_HOSTNAME
AUTH_CORS=$STOREFRONT_URLS,https://$DEPLOY_HOSTNAME

MEDUSA_BACKEND_URL=https://$DEPLOY_HOSTNAME

# --- Providers externes (à remplir au fur et à mesure des phases) ---
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
ALMA_API_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=

BREVO_API_KEY=

S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_REGION=fr-par
S3_BUCKET=lehena-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

CHRONOFRESH_API_KEY=
COLISSIMO_API_KEY=

SENTRY_DSN_BACKEND=
EOF

    chmod 600 "$ENV_FILE"

    echo
    echo "==================================================================="
    echo "  Secrets Medusa générés — À SAUVEGARDER TOUT DE SUITE (1Password) :"
    echo "==================================================================="
    grep -E '^(POSTGRES_PASSWORD|REDIS_PASSWORD|MEILI_MASTER_KEY|JWT_SECRET|COOKIE_SECRET)=' "$ENV_FILE"
    echo "==================================================================="
    echo
    read -r -p "Presse Entrée quand tu les as sauvegardés..."
else
    log ".env existant — pas de régénération"
fi

# --- docker-compose.yml -----------------------------------------------
log "Génération docker-compose.yml"
cat > "$INSTALL_DIR/docker-compose.yml" <<EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: medusa-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \$\${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: medusa-redis
    restart: unless-stopped
    command: redis-server --requirepass \${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \$\${REDIS_PASSWORD} ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.10
    container_name: medusa-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: \${MEILI_MASTER_KEY}
      MEILI_ENV: production
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - ./data/meilisearch:/meili_data
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: $GHCR_IMAGE:latest
    container_name: medusa-backend
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.medusa.rule=Host(\`$DEPLOY_HOSTNAME\`)"
      - "traefik.http.routers.medusa.entryPoints=websecure"
      - "traefik.http.routers.medusa.tls.certResolver=letsencrypt"
      - "traefik.http.routers.medusa.middlewares=default-security-headers@file,rate-limit@file"
      - "traefik.http.services.medusa.loadbalancer.server.port=9000"
      # Marqueur pour Watchtower
      - "com.centurylinklabs.watchtower.enable=true"
    networks:
      - default
      - web

networks:
  web:
    external: true
EOF

# --- Démarrage des dépendances (pas encore le backend) -----------------
log "Démarrage Postgres + Redis + MeiliSearch"
cd "$INSTALL_DIR"
docker compose up -d postgres redis meilisearch

log "Attente des healthchecks…"
for i in {1..30}; do
    if docker compose ps --format json postgres 2>/dev/null | grep -q '"Health":"healthy"'; then
        log "Postgres healthy"
        break
    fi
    sleep 2
done

docker compose ps

log "Dépendances up. Le backend démarrera après le premier build CI (voir deploy.sh)."
echo
echo "Prochaines étapes :"
echo "  1. Configurer la CI GitHub Actions (voir templates/github-actions-build.yml)"
echo "  2. Push sur main → l'image sera publiée sur GHCR"
echo "  3. bash 40-watchtower.sh"
echo "  4. bash deploy.sh"
