#!/usr/bin/env bash
#
# 20-traefik.sh — Installation de Traefik (reverse proxy + Let's Encrypt).
#
# À exécuter en tant qu'utilisateur DEPLOY_USER (paul), après 10-docker.sh.
# Idempotent.

set -euo pipefail

# ==== À CONFIGURER ====================================================
TRAEFIK_HOSTNAME="traefik.lehena.fr"
TRAEFIK_ACME_EMAIL="paul@groupemilestone.com"
# Basic auth pour le dashboard : sera généré à la première run et affiché.
# ======================================================================

log()  { echo -e "\033[1;34m[traefik]\033[0m $*"; }
die()  { echo -e "\033[1;31m[traefik ERROR]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && die "Ce script doit être exécuté en $USER, pas root."

command -v docker &>/dev/null || die "Docker n'est pas installé. Exécute 10-docker.sh d'abord."

INSTALL_DIR=/srv/lehena/traefik
mkdir -p "$INSTALL_DIR/acme"
chmod 700 "$INSTALL_DIR/acme"

# --- Basic auth pour le dashboard --------------------------------------
if [[ ! -f "$INSTALL_DIR/.dashboard-auth" ]]; then
    log "Génération du password admin pour le dashboard Traefik"
    ADMIN_PASSWORD="$(openssl rand -base64 24)"
    # htpasswd non installé par défaut, on utilise openssl (bcrypt-like via APR1)
    HASHED=$(docker run --rm httpd:2.4-alpine htpasswd -nbB admin "$ADMIN_PASSWORD" | sed -e 's/\$/\$\$/g')
    echo "$HASHED" > "$INSTALL_DIR/.dashboard-auth"
    chmod 600 "$INSTALL_DIR/.dashboard-auth"

    echo
    echo "==================================================================="
    echo "  Dashboard Traefik admin credentials (À NOTER DÈS MAINTENANT) :"
    echo "  URL       : https://$TRAEFIK_HOSTNAME"
    echo "  User      : admin"
    echo "  Password  : $ADMIN_PASSWORD"
    echo "==================================================================="
    echo
else
    HASHED=$(cat "$INSTALL_DIR/.dashboard-auth")
    log "Basic auth dashboard déjà généré (voir 1Password)"
fi

# --- traefik.yml ------------------------------------------------------
log "Génération traefik.yml"
cat > "$INSTALL_DIR/traefik.yml" <<EOF
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: web
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: $TRAEFIK_ACME_EMAIL
      storage: /acme/acme.json
      tlsChallenge: {}

log:
  level: INFO

accessLog:
  filePath: /var/log/traefik/access.log
  bufferingSize: 100
EOF

# --- dynamic.yml (middlewares réutilisables) --------------------------
log "Génération dynamic.yml"
cat > "$INSTALL_DIR/dynamic.yml" <<EOF
http:
  middlewares:
    default-security-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        frameDeny: true
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"
    rate-limit:
      rateLimit:
        average: 100
        burst: 200
    dashboard-auth:
      basicAuth:
        users:
          - "$HASHED"
EOF

# --- docker-compose.yml -----------------------------------------------
log "Génération docker-compose.yml"
cat > "$INSTALL_DIR/docker-compose.yml" <<EOF
services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./dynamic.yml:/etc/traefik/dynamic.yml:ro
      - ./acme:/acme
      - traefik_logs:/var/log/traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(\`$TRAEFIK_HOSTNAME\`)"
      - "traefik.http.routers.dashboard.entryPoints=websecure"
      - "traefik.http.routers.dashboard.tls.certResolver=letsencrypt"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=dashboard-auth@file,default-security-headers@file"
    networks:
      - web

volumes:
  traefik_logs:

networks:
  web:
    external: true
EOF

# --- acme.json --------------------------------------------------------
touch "$INSTALL_DIR/acme/acme.json"
chmod 600 "$INSTALL_DIR/acme/acme.json"

# --- Démarrage --------------------------------------------------------
log "Démarrage Traefik"
cd "$INSTALL_DIR"
docker compose up -d
sleep 3
docker compose ps

log "Traefik démarré. Vérifie https://$TRAEFIK_HOSTNAME dans 30 s."
log "Certificat Let's Encrypt en cours d'obtention — surveille : docker compose logs -f traefik"

echo
echo "Prochaine étape :  bash 30-stack.sh"
