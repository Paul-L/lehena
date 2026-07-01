#!/usr/bin/env bash
#
# restore.sh — Restauration d'un snapshot restic.
#
# Usage :
#   bash restore.sh --dry-run              # liste les snapshots dispo
#   bash restore.sh <snapshot-id>          # restaure vers /tmp/lehena-restore
#   bash restore.sh <snapshot-id> --commit # restaure + réinjecte les données
#                                          # (ARRÊTE LES CONTAINERS)
#
# EN CAS D'INCIDENT MAJEUR : suivre docs/refonte/infra/disaster-recovery.md

set -euo pipefail

BACKUP_ENV=/srv/lehena/scripts/.backup-env

log()  { echo -e "\033[1;34m[restore]\033[0m $*"; }
warn() { echo -e "\033[1;33m[restore]\033[0m $*"; }
die()  { echo -e "\033[1;31m[restore ERROR]\033[0m $*" >&2; exit 1; }

[[ -f "$BACKUP_ENV" ]] || die "Fichier $BACKUP_ENV manquant."
# shellcheck source=/dev/null
source "$BACKUP_ENV"
export RESTIC_CACHE_DIR=/srv/lehena/backups/restic-cache

if [[ "${1:-}" == "--dry-run" ]]; then
    log "Snapshots disponibles :"
    restic snapshots --compact
    exit 0
fi

SNAPSHOT_ID="${1:-}"
COMMIT=0
[[ "${2:-}" == "--commit" ]] && COMMIT=1

[[ -n "$SNAPSHOT_ID" ]] || die "Passe un snapshot-id (bash restore.sh --dry-run pour lister)"

RESTORE_DIR=/tmp/lehena-restore-$(date +%s)

log "Restauration snapshot $SNAPSHOT_ID vers $RESTORE_DIR"
mkdir -p "$RESTORE_DIR"
restic restore "$SNAPSHOT_ID" --target "$RESTORE_DIR"

log "Contenu restauré :"
find "$RESTORE_DIR/srv/lehena" -maxdepth 3 -type d

if [[ $COMMIT -eq 0 ]]; then
    warn "Mode dry-run : les données sont dans $RESTORE_DIR mais PAS injectées."
    warn "Pour réellement réinjecter : bash restore.sh $SNAPSHOT_ID --commit"
    exit 0
fi

warn "!!  MODE COMMIT — les données actuelles vont être ÉCRASÉES  !!"
read -r -p "Tape 'RESTORE' pour confirmer : " confirm
[[ "$confirm" == "RESTORE" ]] || die "Annulé."

log "Arrêt des services"
cd /srv/lehena/medusa && docker compose down
cd /srv/lehena/watchtower && docker compose down || true

log "Backup de sécurité des données actuelles (au cas où)"
SAFETY_DIR=/tmp/lehena-safety-$(date +%s)
mkdir -p "$SAFETY_DIR"
mv /srv/lehena/medusa/data "$SAFETY_DIR/"
mv /srv/lehena/medusa/.env "$SAFETY_DIR/"
mv /srv/lehena/traefik/acme "$SAFETY_DIR/"
warn "Données actuelles sauvegardées dans $SAFETY_DIR (rm quand tout est OK)"

log "Injection des données restaurées"
cp -a "$RESTORE_DIR/srv/lehena/medusa/data" /srv/lehena/medusa/
cp -a "$RESTORE_DIR/srv/lehena/medusa/.env" /srv/lehena/medusa/
cp -a "$RESTORE_DIR/srv/lehena/traefik/acme" /srv/lehena/traefik/

log "Redémarrage des services"
cd /srv/lehena/medusa && docker compose up -d
cd /srv/lehena/watchtower && docker compose up -d

log "Attente healthchecks…"
sleep 10
docker ps

log "Restauration terminée. Vérifie manuellement le fonctionnement du site."
warn "Une fois validé, tu peux supprimer $SAFETY_DIR et $RESTORE_DIR"
