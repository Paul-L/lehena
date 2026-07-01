#!/usr/bin/env bash
#
# backup.sh — Backup Postgres + volumes + .env + acme.json via restic vers S3.
#
# À lancer manuellement ou via cron (recommandé : quotidien à 3h).
# Cron : 0 3 * * * /srv/lehena/scripts/backup.sh >> /var/log/lehena-backup.log 2>&1
#
# Prérequis :
#   - restic installé (sudo apt install restic)
#   - Bucket S3 créé
#   - Repo restic initialisé une seule fois via :
#       source /srv/lehena/scripts/.backup-env && restic init

set -euo pipefail

# ==== À CONFIGURER ====================================================
BACKUP_ENV=/srv/lehena/scripts/.backup-env
# Fichier à créer manuellement, contenant :
#   export AWS_ACCESS_KEY_ID=<scaleway-access-key>
#   export AWS_SECRET_ACCESS_KEY=<scaleway-secret-key>
#   export RESTIC_REPOSITORY=s3:https://s3.fr-par.scw.cloud/lehena-backups
#   export RESTIC_PASSWORD=<mot-de-passe-restic-fort>
# chmod 600
# ======================================================================

log()  { echo -e "\033[1;34m[backup $(date -Iseconds)]\033[0m $*"; }
die()  { echo -e "\033[1;31m[backup ERROR]\033[0m $*" >&2; exit 1; }

[[ -f "$BACKUP_ENV" ]] || die "Fichier $BACKUP_ENV manquant. Voir en-tête du script."

# shellcheck source=/dev/null
source "$BACKUP_ENV"
export RESTIC_CACHE_DIR=/srv/lehena/backups/restic-cache

command -v restic &>/dev/null || die "restic non installé. sudo apt install restic"

STAMP=$(date +%Y%m%d-%H%M%S)
DUMP_DIR=/srv/lehena/backups/pg-dumps
mkdir -p "$DUMP_DIR"

# --- 1. Dump Postgres -------------------------------------------------
log "Dump Postgres"
docker exec medusa-postgres pg_dump -U medusa medusa \
    | gzip > "$DUMP_DIR/medusa-$STAMP.sql.gz"

DUMP_SIZE=$(du -h "$DUMP_DIR/medusa-$STAMP.sql.gz" | cut -f1)
log "Dump : $DUMP_SIZE"

# --- 2. Backup restic ------------------------------------------------
log "Backup restic → $RESTIC_REPOSITORY"
restic backup \
    --tag "auto-$STAMP" \
    --exclude-caches \
    /srv/lehena/medusa/data \
    /srv/lehena/medusa/.env \
    /srv/lehena/traefik/acme \
    /srv/lehena/traefik/.dashboard-auth \
    /srv/lehena/watchtower/docker-config \
    "$DUMP_DIR"

# --- 3. Rotation locale (dumps > 7j supprimés) -----------------------
log "Nettoyage dumps locaux > 7j"
find "$DUMP_DIR" -name "*.sql.gz" -mtime +7 -delete

# --- 4. Rotation snapshots restic ------------------------------------
log "Rotation restic (7 quotidiens, 4 hebdo, 6 mensuels)"
restic forget --prune \
    --keep-daily 7 \
    --keep-weekly 4 \
    --keep-monthly 6

log "Backup terminé."
restic stats --mode raw-data | tail -5
