#!/usr/bin/env bash
#
# 40-watchtower.sh — Auto-update du backend Medusa.
#
# Watchtower poll GHCR toutes les 5 min, pull l'image `latest`, redémarre
# proprement le container backend si l'image a changé.
#
# À exécuter en $DEPLOY_USER après 30-stack.sh.

set -euo pipefail

# ==== À CONFIGURER ====================================================
# Poll interval (secondes). 300 = 5 min. Mets 60 pour du dev.
POLL_INTERVAL=300

# GitHub Personal Access Token avec scope read:packages.
# Créer sur https://github.com/settings/tokens?type=beta
# Watchtower en a besoin pour pull depuis un repo GHCR privé.
GHCR_USERNAME="Paul-L"   # ton login GitHub
GHCR_TOKEN=""            # ton PAT ; sera demandé en interactif si vide
# ======================================================================

log()  { echo -e "\033[1;34m[watchtower]\033[0m $*"; }
die()  { echo -e "\033[1;31m[watchtower ERROR]\033[0m $*" >&2; exit 1; }

INSTALL_DIR=/srv/lehena/watchtower
mkdir -p "$INSTALL_DIR"

# --- GHCR credentials -------------------------------------------------
if [[ -z "$GHCR_USERNAME" ]]; then
    read -r -p "Ton login GitHub : " GHCR_USERNAME
fi
if [[ -z "$GHCR_TOKEN" ]]; then
    read -r -s -p "PAT GitHub (read:packages) : " GHCR_TOKEN
    echo
fi

# Écrire le config Docker pour l'auth registry (accessible à Watchtower)
mkdir -p "$INSTALL_DIR/docker-config"
cat > "$INSTALL_DIR/docker-config/config.json" <<EOF
{
    "auths": {
        "ghcr.io": {
            "auth": "$(echo -n "$GHCR_USERNAME:$GHCR_TOKEN" | base64 -w 0)"
        }
    }
}
EOF
chmod 600 "$INSTALL_DIR/docker-config/config.json"

# --- docker-compose.yml -----------------------------------------------
log "Génération docker-compose.yml"
cat > "$INSTALL_DIR/docker-compose.yml" <<EOF
services:
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./docker-config:/config
    environment:
      # Force la version d'API Docker parlée par la SDK Go de Watchtower.
      # Sans ça, sur Docker Engine récent (≥ 28), la SDK retombe sur API 1.25
      # qui est refusée. Même piège que Traefik (cf. 20-traefik.sh).
      DOCKER_API_VERSION: "1.44"
      # Auth GHCR
      DOCKER_CONFIG: /config
      # Ne watch que les containers avec le label enable=true (cf. 30-stack.sh)
      WATCHTOWER_LABEL_ENABLE: "true"
      # Interval de polling
      WATCHTOWER_POLL_INTERVAL: $POLL_INTERVAL
      # Suppression des vieilles images après update
      WATCHTOWER_CLEANUP: "true"
      # Rolling restart (attend la fin du drain avant de restart)
      WATCHTOWER_ROLLING_RESTART: "true"
      # Réduit le bruit dans les logs
      WATCHTOWER_NO_STARTUP_MESSAGE: "true"
      # Timezone
      TZ: Europe/Paris
      # Notifications (optionnel — Slack webhook)
      # WATCHTOWER_NOTIFICATIONS: slack
      # WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL: "https://hooks.slack.com/..."
EOF

# --- Démarrage --------------------------------------------------------
cd "$INSTALL_DIR"
docker compose up -d
docker compose ps

log "Watchtower actif. Poll GHCR toutes les ${POLL_INTERVAL}s."
log "Il ne watchera QUE les containers avec le label com.centurylinklabs.watchtower.enable=true"
log "(le backend Medusa a ce label, cf. 30-stack.sh)"

echo
echo "Prochaine étape (une fois la première image publiée par la CI) :"
echo "  bash deploy.sh"
