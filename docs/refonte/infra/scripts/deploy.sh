#!/usr/bin/env bash
#
# deploy.sh — Déploiement manuel du backend Medusa.
#
# Usage :
#   bash deploy.sh                # pull dernière image + up + migrations
#   bash deploy.sh --no-migrate   # skip migrations (utile en debug)
#   bash deploy.sh <sha>          # deploy une image tagguée avec un sha spécifique
#
# Utilisé :
#   - Manuellement (déploiement forcé sans attendre Watchtower)
#   - Par la CI via SSH si tu préfères ce flow au poll Watchtower (voir README)
#   - En rollback (spécifie un sha connu bon)

set -euo pipefail

# ==== À CONFIGURER ====================================================
GHCR_IMAGE="ghcr.io/paul-l/lehena-backend"
# ======================================================================

log()  { echo -e "\033[1;34m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[deploy]\033[0m $*"; }
die()  { echo -e "\033[1;31m[deploy ERROR]\033[0m $*" >&2; exit 1; }

STACK_DIR=/srv/lehena/medusa
[[ -d "$STACK_DIR" ]] || die "Stack pas encore installée. Exécute 30-stack.sh d'abord."

RUN_MIGRATE=1
TAG="latest"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-migrate) RUN_MIGRATE=0; shift ;;
        --*) die "Option inconnue : $1" ;;
        *) TAG="$1"; shift ;;
    esac
done

cd "$STACK_DIR"

log "Pull de $GHCR_IMAGE:$TAG"
# Update le tag dans docker-compose.yml de façon transitoire si != latest
if [[ "$TAG" != "latest" ]]; then
    warn "Deploy d'un tag spécifique : $TAG"
    # Génère une version override temporaire
    cat > docker-compose.override.yml <<EOF
services:
  backend:
    image: $GHCR_IMAGE:$TAG
EOF
    trap "rm -f docker-compose.override.yml" EXIT
fi

docker compose pull backend

if [[ $RUN_MIGRATE -eq 1 ]]; then
    log "Exécution des migrations Medusa"
    # On lance dans un container éphémère (pas via le service qui va up)
    docker compose run --rm --no-deps backend \
        pnpm exec medusa db:migrate || die "Migration échouée. Deploy avorté."
fi

log "Redémarrage backend (rolling)"
docker compose up -d --no-deps backend

log "Attente healthcheck…"
for i in {1..30}; do
    if docker compose ps --format json backend 2>/dev/null | grep -q '"Health":"healthy"'; then
        log "Backend healthy ✓"
        break
    fi
    if [[ $i -eq 30 ]]; then
        warn "Backend pas healthy après 60s. Vérifie les logs :"
        docker compose logs --tail=100 backend
        exit 1
    fi
    sleep 2
done

log "Cleanup images orphelines"
docker image prune -f

log "Deploy terminé."
docker compose ps
