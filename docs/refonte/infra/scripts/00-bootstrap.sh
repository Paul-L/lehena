#!/usr/bin/env bash
#
# 00-bootstrap.sh — Hardening initial d'un VPS Debian 12 vierge.
#
# À exécuter en ROOT sur la première session SSH d'une machine neuve.
# Idempotent : re-run sans effets de bord.
#
# Actions :
#   - Créer l'utilisateur de déploiement avec sudo + SSH keys
#   - Durcir SSH (root off, password off)
#   - Firewall UFW (SSH + HTTP + HTTPS)
#   - Fail2ban
#   - Mises à jour de sécurité auto
#   - Timezone Europe/Paris + NTP
#   - Swap 4 Go
#   - Structure /srv/lehena/

set -euo pipefail

# ==== À CONFIGURER ====================================================
DEPLOY_USER="paul"
SSH_PORT=22
TIMEZONE="Europe/Paris"
SWAP_SIZE_GB=4
# ======================================================================

log()  { echo -e "\033[1;34m[bootstrap]\033[0m $*"; }
warn() { echo -e "\033[1;33m[bootstrap]\033[0m $*"; }
die()  { echo -e "\033[1;31m[bootstrap ERROR]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Ce script doit être exécuté en root."

log "Mise à jour APT"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    ca-certificates curl gnupg lsb-release \
    ufw fail2ban unattended-upgrades \
    sudo htop vim git jq openssl \
    systemd-timesyncd

# --- Utilisateur de déploiement ---------------------------------------
if id "$DEPLOY_USER" &>/dev/null; then
    log "Utilisateur $DEPLOY_USER existe déjà"
else
    log "Création de l'utilisateur $DEPLOY_USER"
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

usermod -aG sudo "$DEPLOY_USER"

# Copie de la clef SSH root vers l'utilisateur, si pas déjà fait
if [[ -f /root/.ssh/authorized_keys ]]; then
    mkdir -p "/home/$DEPLOY_USER/.ssh"
    if ! diff -q /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys" &>/dev/null; then
        log "Copie des clefs SSH de root vers $DEPLOY_USER"
        cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
    fi
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    chmod 700 "/home/$DEPLOY_USER/.ssh"
    chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
else
    warn "Pas de /root/.ssh/authorized_keys — configure les clefs de $DEPLOY_USER manuellement avant de désactiver root."
fi

# Sudo sans mot de passe pour le déploiement (optionnel — commenter si tu préfères)
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-$DEPLOY_USER
chmod 440 /etc/sudoers.d/90-$DEPLOY_USER

# --- Durcissement SSH -------------------------------------------------
log "Durcissement SSH"
SSH_CFG=/etc/ssh/sshd_config
cp "$SSH_CFG" "$SSH_CFG.bak.$(date +%s)"

sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "$SSH_CFG"
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CFG"
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CFG"
sed -i "s/^#*Port .*/Port $SSH_PORT/" "$SSH_CFG"

systemctl reload sshd

# --- Firewall UFW -----------------------------------------------------
log "Configuration UFW"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT"/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Traefik)'
ufw allow 443/tcp comment 'HTTPS (Traefik)'
ufw --force enable

# --- Fail2ban ---------------------------------------------------------
log "Activation Fail2ban"
systemctl enable --now fail2ban

# --- Mises à jour de sécurité auto ------------------------------------
log "Activation unattended-upgrades"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# --- Timezone + NTP ---------------------------------------------------
log "Timezone $TIMEZONE + NTP"
timedatectl set-timezone "$TIMEZONE"
systemctl enable --now systemd-timesyncd

# --- Swap -------------------------------------------------------------
if [[ ! -f /swapfile ]]; then
    log "Création du swap ${SWAP_SIZE_GB}G"
    fallocate -l "${SWAP_SIZE_GB}G" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
    log "Swap déjà présent"
fi

# --- Structure de dossiers --------------------------------------------
log "Création de /srv/lehena/"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 755 /srv/lehena
# NE PAS créer /srv/lehena/scripts : ce dossier sera un symlink vers
# /opt/lehena/repo/docs/refonte/infra/scripts (cf. README étape "git").
# Si on le pré-crée, `ln -s <src> /srv/lehena/scripts` place le lien À
# L'INTÉRIEUR au lieu de le créer à sa place.

# --- Récap ------------------------------------------------------------
log "Bootstrap terminé."
echo
echo "Prochaines étapes :"
echo "  1. Tester la connexion avec l'utilisateur $DEPLOY_USER dans un AUTRE terminal :"
echo "       ssh $DEPLOY_USER@\$(hostname -I | awk '{print \$1}')"
echo "  2. Si OK, tu peux fermer cette session root."
echo "  3. Puis exécuter (en root) :  bash 10-docker.sh"
