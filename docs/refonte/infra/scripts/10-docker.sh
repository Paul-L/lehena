#!/usr/bin/env bash
#
# 10-docker.sh — Installation Docker Engine + Compose plugin sur Debian 12.
#
# À exécuter en ROOT après 00-bootstrap.sh.
# Idempotent.

set -euo pipefail

# ==== À CONFIGURER ====================================================
DEPLOY_USER="paul"
# ======================================================================

log()  { echo -e "\033[1;34m[docker]\033[0m $*"; }
die()  { echo -e "\033[1;31m[docker ERROR]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Ce script doit être exécuté en root."

install_docker_ce() {
    log "Installation Docker CE depuis le repo officiel Docker"

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
        gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
}

# --- Detection Docker existant ----------------------------------------
# Certains VPS providers pré-installent une vieille version de Docker
# (docker.io Debian, ou legacy manuel). Traefik v3+ exige API ≥ 1.40.
# On force la réinstallation si :
#   - docker existe mais API < 1.40
#   - docker existe mais n'est PAS le paquet docker-ce (ex: docker.io Debian)
NEED_INSTALL=0

if ! command -v docker &>/dev/null; then
    log "Docker absent → installation"
    NEED_INSTALL=1
else
    if dpkg -l | grep -q '^ii\s*docker\.io\s'; then
        log "docker.io (Debian) détecté — purge nécessaire pour installer Docker CE"
        systemctl stop docker docker.socket containerd 2>/dev/null || true
        apt-get purge -y -qq docker docker.io docker-doc docker-compose \
            docker-compose-v2 podman-docker containerd runc 2>/dev/null || true
        apt-get autoremove -y -qq
        NEED_INSTALL=1
    else
        # docker-ce probable, mais vérifions l'API
        API_MAJ=$(docker version --format '{{.Server.APIVersion}}' 2>/dev/null | cut -d. -f1)
        API_MIN=$(docker version --format '{{.Server.APIVersion}}' 2>/dev/null | cut -d. -f2)
        if [[ -z "$API_MAJ" ]]; then
            log "Impossible de lire la version API du daemon Docker existant"
            NEED_INSTALL=1
        elif [[ "$API_MAJ" -lt 1 ]] || { [[ "$API_MAJ" -eq 1 ]] && [[ "$API_MIN" -lt 40 ]]; }; then
            log "Docker existant trop vieux (API ${API_MAJ}.${API_MIN} < 1.40)"
            NEED_INSTALL=1
        else
            log "Docker CE présent et API OK ($(docker --version))"
        fi
    fi
fi

if [[ $NEED_INSTALL -eq 1 ]]; then
    install_docker_ce
fi

# --- Config daemon (logs rotation + live-restore) ---------------------
log "Config daemon Docker"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "default-address-pools": [
    { "base": "172.20.0.0/16", "size": 24 }
  ]
}
EOF

systemctl enable docker
systemctl restart docker

# --- Groupe docker pour l'utilisateur ---------------------------------
usermod -aG docker "$DEPLOY_USER"

# --- Réseau shared -----------------------------------------------------
if ! docker network ls --format '{{.Name}}' | grep -q '^web$'; then
    log "Création du réseau Docker 'web'"
    docker network create web
else
    log "Réseau 'web' existant"
fi

# --- Vérification -----------------------------------------------------
docker version >/dev/null
docker compose version >/dev/null

log "Docker installé et prêt."
echo
echo "Prochaines étapes :"
echo "  1. Reconnecte-toi en $DEPLOY_USER (pour que le groupe docker soit effectif) :"
echo "       ssh $DEPLOY_USER@\$(hostname -I | awk '{print \$1}')"
echo "  2. Puis :  bash 20-traefik.sh"
