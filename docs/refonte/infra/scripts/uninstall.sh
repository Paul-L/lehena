#!/usr/bin/env bash
#
# uninstall.sh — Désinstalle proprement toute la stack Lehena du VPS.
#
# ATTENTION : détruit les containers, réseaux, volumes locaux.
# NE TOUCHE PAS aux backups S3 (restic reste intact).
#
# Utilise ce script uniquement pour :
#   - Repartir de zéro sur le même VPS
#   - Faire une passation (le client réinstalle proprement ensuite)

set -euo pipefail

warn() { echo -e "\033[1;33m[uninstall]\033[0m $*"; }
die()  { echo -e "\033[1;31m[uninstall ERROR]\033[0m $*" >&2; exit 1; }

warn "!! Ce script va SUPPRIMER toute la stack Lehena de ce VPS !!"
warn "   - Containers Docker (traefik, medusa, watchtower)"
warn "   - Volumes locaux (/srv/lehena/medusa/data)"
warn "   - Fichiers .env, acme.json, dashboard-auth"
warn "   - Watchtower et son config docker-config"
warn ""
warn "Les BACKUPS S3 (restic) ne sont PAS touchés — ils restent récupérables."

read -r -p "Tape 'DELETE' pour confirmer : " confirm
[[ "$confirm" == "DELETE" ]] || die "Annulé."

for dir in watchtower medusa traefik; do
    if [[ -d "/srv/lehena/$dir" ]]; then
        warn "Arrêt & suppression : $dir"
        (cd "/srv/lehena/$dir" && docker compose down --volumes --remove-orphans) || true
        rm -rf "/srv/lehena/$dir"
    fi
done

if docker network ls --format '{{.Name}}' | grep -q '^web$'; then
    docker network rm web || true
fi

warn "Nettoyage images inutilisées"
docker system prune -af --volumes || true

warn "Stack désinstallée. Backups restic S3 intacts."
warn "Pour tout ré-installer : bash 00-bootstrap.sh (mais l'hardening OS reste appliqué)"
