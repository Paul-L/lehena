#!/usr/bin/env bash
#
# health.sh — Vérifie l'état de toute la stack Lehena.
#
# Exit code :
#   0 = tout OK
#   1 = au moins un service dégradé

set -uo pipefail

log()  { echo -e "\033[1;34m[health]\033[0m $*"; }
ok()   { echo -e "  \033[1;32m✓\033[0m $*"; }
ko()   { echo -e "  \033[1;31m✗\033[0m $*"; ERRORS=$((ERRORS+1)); }

ERRORS=0

log "=== Conteneurs Docker ==="
for svc in traefik medusa-postgres medusa-redis medusa-meilisearch medusa-backend watchtower; do
    status=$(docker inspect -f '{{.State.Status}}' "$svc" 2>/dev/null || echo "missing")
    health=$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "n/a")
    if [[ "$status" == "running" ]]; then
        if [[ "$health" == "healthy" || "$health" == "n/a" ]]; then
            ok "$svc ($status, health=$health)"
        else
            ko "$svc ($status, health=$health)"
        fi
    else
        ko "$svc ($status)"
    fi
done

log "=== Endpoints HTTPS ==="
for url in "https://traefik.lehena.fr" "https://backend.lehena.fr/health"; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" -m 5 "$url" || echo "000")
    if [[ "$code" =~ ^(200|401|301|302)$ ]]; then
        ok "$url → HTTP $code"
    else
        ko "$url → HTTP $code"
    fi
done

log "=== Ressources système ==="
MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
DISK_PCT=$(df -P /srv | awk 'NR==2 {print $5}' | tr -d '%')
LOAD_1M=$(awk '{print $1}' /proc/loadavg)
CPU_COUNT=$(nproc)

if [[ $MEM_PCT -gt 90 ]]; then ko "RAM utilisée : $MEM_PCT %"; else ok "RAM utilisée : $MEM_PCT %"; fi
if [[ $DISK_PCT -gt 80 ]]; then ko "Disque /srv utilisé : $DISK_PCT %"; else ok "Disque /srv utilisé : $DISK_PCT %"; fi
ok "Load 1min : $LOAD_1M (sur $CPU_COUNT cores)"

log "=== Certificats Let's Encrypt ==="
if [[ -f /srv/lehena/traefik/acme/acme.json ]]; then
    expiry=$(docker exec traefik sh -c "cat /acme/acme.json 2>/dev/null" \
        | grep -oE '"NotAfter":"[^"]+"' | head -1 | cut -d'"' -f4 || echo "unknown")
    ok "acme.json présent, expiration prochaine : $expiry"
else
    ko "acme.json manquant !"
fi

log "=== Watchtower ==="
last_scan=$(docker logs watchtower --tail 100 2>&1 | grep "Session done" | tail -1 || echo "aucun scan visible")
ok "Dernier scan : $last_scan"

echo
if [[ $ERRORS -eq 0 ]]; then
    log "✓ Tout est OK."
    exit 0
else
    log "✗ $ERRORS problème(s) détecté(s)."
    exit 1
fi
