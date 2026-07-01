# Flow d'installation VPS Debian (alternative Coolify)

> Setup self-hosted "Coolify-like" pour héberger le **backend Medusa** de
> Lehena sur un VPS Debian 12, sans installer Coolify.
>
> Cible matérielle : Hetzner CX32 (4 vCore / 8 Go RAM / 80 Go SSD) ou équivalent.
> Storefront Next.js : reste sur Vercel (cf. `../00-PLAN.md` § 2).

---

## Hypothèses de départ

- **OS** : Debian 12 (Bookworm) fresh install, accès SSH root ou sudo.
- **Domaine** : `backend.lehena.fr` pointe (record A) vers l'IP du VPS.
  Prévoir aussi `traefik.lehena.fr` pour l'UI Traefik (protégé par basic auth).
- **CI** : GitHub Actions.
- **Registry Docker** : GHCR (github container registry, gratuit pour repos privés).
- **Stockage backups** : Scaleway Object Storage (ou R2 si tu bascules
  comme discuté). Bucket dédié `lehena-backups`.
- **Storefront** : sur Vercel, appelle `backend.lehena.fr` via CORS.

Si l'un de ces choix change, le flow se réajuste facilement, mais je pose
le rail sur ceux-là.

---

## Vue d'ensemble de l'archi finale

```
                     Cloudflare (DNS + WAF + Proxy)
                              │
                              ▼
                     ┌────────────────────┐
                     │  VPS Debian 12     │
                     │  (Hetzner CX32)    │
                     │                    │
                     │  ┌──────────────┐  │
                     │  │  Traefik     │  │  ← reverse proxy + SSL Let's Encrypt
                     │  └──────┬───────┘  │
                     │         │          │
                     │  ┌──────▼───────┐  │
                     │  │  Medusa      │  │  ← container pull depuis GHCR
                     │  │  backend     │  │
                     │  └──────┬───────┘  │
                     │         │          │
                     │    ┌────┴─────┐    │
                     │    ▼    ▼     ▼    │
                     │  Postgres Redis    │
                     │           MeiliSrch│
                     │                    │
                     │  ┌──────────────┐  │
                     │  │  restic      │  │  ← backup cron
                     │  │  (backups)   │──┼──→ Scaleway Object Storage
                     │  └──────────────┘  │
                     └────────────────────┘
```

---

## Étape 1 — Hardening Debian de base

Objectif : sécuriser la machine avant d'y mettre quoi que ce soit.

### 1.1 — Créer un utilisateur non-root

```bash
adduser paul
usermod -aG sudo paul
mkdir -p /home/paul/.ssh
cp /root/.ssh/authorized_keys /home/paul/.ssh/
chown -R paul:paul /home/paul/.ssh
chmod 700 /home/paul/.ssh
chmod 600 /home/paul/.ssh/authorized_keys
```

### 1.2 — Sécuriser SSH

Éditer `/etc/ssh/sshd_config` :

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22   # ou un port custom si tu tiens à réduire le bruit fail2ban
```

Puis :

```bash
systemctl restart sshd
```

**Test avant de fermer la session** : ouvre un second terminal et vérifie
que `ssh paul@ip` marche. Si ok, tu peux fermer le premier.

### 1.3 — Firewall (UFW)

```bash
apt update && apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (Traefik → redirect HTTPS)
ufw allow 443/tcp    # HTTPS
ufw enable
```

### 1.4 — Fail2ban

```bash
apt install -y fail2ban
systemctl enable --now fail2ban
```

Config par défaut suffit pour SSH. Optionnel : ajouter un jail pour Traefik.

### 1.5 — Mises à jour auto (sécurité)

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 1.6 — Time zone + NTP

```bash
timedatectl set-timezone Europe/Paris
apt install -y systemd-timesyncd
systemctl enable --now systemd-timesyncd
```

### 1.7 — Swap (utile même avec 8 Go)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Étape 2 — Docker + Compose

### 2.1 — Installation

```bash
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Autoriser paul à utiliser docker sans sudo
usermod -aG docker paul
```

Reconnecte-toi en `paul` pour que le groupe soit pris en compte.

### 2.2 — Vérification

```bash
docker version
docker compose version
docker run --rm hello-world
```

### 2.3 — Docker daemon config (limites logs + livraison rotation)

`/etc/docker/daemon.json` :

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
```

Puis :

```bash
systemctl restart docker
```

---

## Étape 3 — Structure des répertoires

Choix simple, prévisible :

```
/srv/lehena/
├── traefik/
│   ├── docker-compose.yml
│   ├── traefik.yml
│   └── acme/               # certificats Let's Encrypt (600, restic-backupé)
├── medusa/
│   ├── docker-compose.yml
│   ├── .env                # secrets (600, restic-backupé, jamais commité)
│   └── data/
│       ├── postgres/
│       ├── redis/
│       └── meilisearch/
└── backups/
    └── restic-cache/
```

```bash
sudo mkdir -p /srv/lehena/{traefik/acme,medusa/data/{postgres,redis,meilisearch},backups/restic-cache}
sudo chown -R paul:paul /srv/lehena
chmod 700 /srv/lehena/traefik/acme
```

---

## Étape 4 — Traefik (reverse proxy + SSL auto)

C'est le cœur du "Coolify light" : Traefik lit les labels des containers
Docker, route les requêtes, obtient un certificat Let's Encrypt à la volée.

### 4.1 — Réseau Docker partagé

```bash
docker network create web
```

Tous les services exposés publiquement seront dans ce réseau.

### 4.2 — `/srv/lehena/traefik/traefik.yml` (config statique)

```yaml
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
      email: paul@groupemilestone.com
      storage: /acme/acme.json
      tlsChallenge: {}

log:
  level: INFO

accessLog:
  filePath: /var/log/traefik/access.log
  bufferingSize: 100
```

### 4.3 — `/srv/lehena/traefik/dynamic.yml` (middlewares réutilisables)

```yaml
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
          # généré par : htpasswd -nb admin 'ton_mdp'
          - "admin:$$apr1$$XXXXXX$$XXXXXX"
```

### 4.4 — `/srv/lehena/traefik/docker-compose.yml`

```yaml
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
      - "traefik.http.routers.dashboard.rule=Host(`traefik.lehena.fr`)"
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
```

### 4.5 — Démarrer Traefik

```bash
touch /srv/lehena/traefik/acme/acme.json
chmod 600 /srv/lehena/traefik/acme/acme.json
cd /srv/lehena/traefik
docker compose up -d
docker compose logs -f traefik
```

Attends la ligne `Register... Retrieving CA certificate...` puis un
`certificate obtained successfully` sur `traefik.lehena.fr`. Vérifie
depuis un navigateur.

---

## Étape 5 — Stack Medusa (Postgres + Redis + MeiliSearch + backend)

### 5.1 — `/srv/lehena/medusa/.env`

À créer manuellement (jamais commité). Template :

```env
# Postgres
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<mot-de-passe-fort-genere>
POSTGRES_DB=medusa

# Redis
REDIS_PASSWORD=<mot-de-passe-fort>

# MeiliSearch
MEILI_MASTER_KEY=<clef-longue-aleatoire>

# Medusa
DATABASE_URL=postgres://medusa:<pwd>@postgres:5432/medusa
REDIS_URL=redis://:<pwd>@redis:6379
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_API_KEY=<meme-que-master-key>

JWT_SECRET=<32-caracteres-aleatoires>
COOKIE_SECRET=<32-caracteres-aleatoires>

STORE_CORS=https://lehena.fr,https://www.lehena.fr,https://lehena.vercel.app
ADMIN_CORS=https://backend.lehena.fr
AUTH_CORS=https://lehena.fr,https://backend.lehena.fr

# Providers externes (rempli en Phase 5-8)
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_BUCKET=lehena-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=fr-par
```

```bash
chmod 600 /srv/lehena/medusa/.env
```

Générer des secrets robustes :

```bash
openssl rand -base64 32
```

### 5.2 — `/srv/lehena/medusa/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: medusa-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: medusa-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.10
    container_name: medusa-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - ./data/meilisearch:/meili_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/paul-l/lehena-backend:latest
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
      - "traefik.http.routers.medusa.rule=Host(`backend.lehena.fr`)"
      - "traefik.http.routers.medusa.entryPoints=websecure"
      - "traefik.http.routers.medusa.tls.certResolver=letsencrypt"
      - "traefik.http.routers.medusa.middlewares=default-security-headers@file,rate-limit@file"
      - "traefik.http.services.medusa.loadbalancer.server.port=9000"
    networks:
      - default
      - web

networks:
  web:
    external: true
```

### 5.3 — Premier démarrage

```bash
cd /srv/lehena/medusa

# Pull des images (backend n'existe pas encore → skip warning)
docker compose pull postgres redis meilisearch

# Démarrer d'abord les dépendances
docker compose up -d postgres redis meilisearch

# Vérifier les healthchecks
docker compose ps
```

Le container `backend` échouera tant que l'image n'est pas construite par
la CI (étape 6).

---

## Étape 6 — CI/CD via GitHub Actions

Le flow : push sur `main` → CI build l'image Medusa → push sur GHCR →
SSH vers VPS → `docker compose pull backend && docker compose up -d backend`.

### 6.1 — Dockerfile Medusa

`apps/backend/Dockerfile` (dans le repo Lehena) :

```dockerfile
# ---------- Stage 1: builder ----------
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copie du monorepo minimal pour installer les deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile

COPY apps/backend/ apps/backend/

WORKDIR /app/apps/backend
RUN pnpm build

# ---------- Stage 2: runner ----------
FROM node:20-alpine AS runner

RUN corepack enable && apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

WORKDIR /app/apps/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:9000/health || exit 1

# Run migrations puis start
CMD ["sh", "-c", "pnpm exec medusa db:migrate && pnpm start"]
```

### 6.2 — GitHub Actions

`.github/workflows/deploy-backend.yml` :

```yaml
name: Deploy backend

on:
  push:
    branches: [main]
    paths:
      - "apps/backend/**"
      - "pnpm-lock.yaml"
      - ".github/workflows/deploy-backend.yml"
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build & push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/backend/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/lehena-backend:latest
            ghcr.io/${{ github.repository_owner }}/lehena-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -euo pipefail
            cd /srv/lehena/medusa
            docker compose pull backend
            docker compose up -d backend
            docker image prune -f
```

### 6.3 — Secrets à ajouter dans GitHub

Repo → Settings → Secrets and variables → Actions :

- `VPS_HOST` : IP ou hostname du VPS
- `VPS_USER` : `paul`
- `VPS_SSH_KEY` : contenu de la clef privée dédiée déploiement (générer une paire distincte de ta clef perso)

### 6.4 — Clef SSH dédiée déploiement

Sur ta machine :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/lehena_deploy -C "github-actions-deploy"
```

Puis sur le VPS :

```bash
cat >> /home/paul/.ssh/authorized_keys <<'EOF'
ssh-ed25519 AAAA... github-actions-deploy
EOF
```

Colle la clef privée dans le secret `VPS_SSH_KEY`.

---

## Étape 7 — Backups automatiques (restic → Scaleway)

### 7.1 — Installer restic

```bash
apt install -y restic
```

### 7.2 — Init du repo backup

```bash
export AWS_ACCESS_KEY_ID=<scaleway-access-key>
export AWS_SECRET_ACCESS_KEY=<scaleway-secret-key>
export RESTIC_REPOSITORY=s3:https://s3.fr-par.scw.cloud/lehena-backups
export RESTIC_PASSWORD=<mot-de-passe-restic-fort>

restic init
```

Note bien le `RESTIC_PASSWORD` dans un password manager — sans lui, les
backups sont irrécupérables.

### 7.3 — Script backup `/srv/lehena/backups/backup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

export AWS_ACCESS_KEY_ID=<...>
export AWS_SECRET_ACCESS_KEY=<...>
export RESTIC_REPOSITORY=s3:https://s3.fr-par.scw.cloud/lehena-backups
export RESTIC_PASSWORD=<...>
export RESTIC_CACHE_DIR=/srv/lehena/backups/restic-cache

STAMP=$(date +%Y%m%d-%H%M%S)
DUMP_DIR=/srv/lehena/backups/pg-dumps
mkdir -p "$DUMP_DIR"

# 1. Dump Postgres
docker exec medusa-postgres pg_dump -U medusa medusa | \
    gzip > "$DUMP_DIR/medusa-$STAMP.sql.gz"

# 2. Backup restic (data volumes + dumps + .env + traefik/acme)
restic backup \
    --tag "auto-$STAMP" \
    /srv/lehena/medusa/data \
    /srv/lehena/medusa/.env \
    /srv/lehena/traefik/acme \
    "$DUMP_DIR"

# 3. Nettoyer dumps locaux > 7 jours
find "$DUMP_DIR" -name "*.sql.gz" -mtime +7 -delete

# 4. Rotation restic
restic forget --prune \
    --keep-daily 7 \
    --keep-weekly 4 \
    --keep-monthly 6
```

```bash
chmod 700 /srv/lehena/backups/backup.sh
chmod 600 /srv/lehena/backups/backup.sh  # secrets dedans
```

**Alternative propre** : mettre les secrets dans `/root/.restic.env` et
`source` dans le script.

### 7.4 — Cron quotidien

```bash
sudo crontab -e
```

Ajouter :

```
0 3 * * * /srv/lehena/backups/backup.sh >> /var/log/restic-backup.log 2>&1
```

### 7.5 — Test restauration (à faire au moins une fois)

```bash
# Lister snapshots
restic snapshots

# Restaurer un snapshot dans /tmp/restore
restic restore <snapshot-id> --target /tmp/restore

# Vérifier le contenu
ls /tmp/restore/srv/lehena/medusa/data/postgres
```

Documenter la procédure de restore complète dans
`docs/refonte/infra/disaster-recovery.md` (à produire séparément).

---

## Étape 8 — Monitoring simple

### 8.1 — Uptime (externe)

Compte gratuit sur **UptimeRobot** ou **Better Stack** :

- Monitor 1 : `https://backend.lehena.fr/health` (à créer côté Medusa,
  cf. Phase 12 du plan)
- Monitor 2 : `https://lehena.fr` (front)
- Alerte : email + Slack webhook si down > 2 min

### 8.2 — Logs

Traefik : accès + erreurs dans le volume `traefik_logs`.
Docker containers : `docker compose logs -f <service>`.

Pour un vrai tableau de bord :

- **Dozzle** (Docker log viewer web) : 1 container léger, UI accessible via
  Traefik derrière basic auth. Utile pour l'équipe non-tech.

`/srv/lehena/dozzle/docker-compose.yml` :

```yaml
services:
  dozzle:
    image: amir20/dozzle:latest
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      DOZZLE_NO_ANALYTICS: "true"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dozzle.rule=Host(`logs.lehena.fr`)"
      - "traefik.http.routers.dozzle.entryPoints=websecure"
      - "traefik.http.routers.dozzle.tls.certResolver=letsencrypt"
      - "traefik.http.routers.dozzle.middlewares=dashboard-auth@file"
      - "traefik.http.services.dozzle.loadbalancer.server.port=8080"
    networks:
      - web

networks:
  web:
    external: true
```

### 8.3 — Métriques serveur (optionnel)

**Netdata** en 1 container : dashboard temps réel CPU/RAM/disque/net.
Ou plus léger : `htop` + `docker stats` en SSH quand tu veux vérifier.

---

## Étape 9 — Récap des commandes utiles au quotidien

```bash
# Voir l'état des services
cd /srv/lehena/medusa && docker compose ps

# Voir les logs backend
docker compose logs -f --tail=200 backend

# Redémarrer un service
docker compose restart backend

# Forcer un pull + restart (comme le fait la CI)
docker compose pull backend && docker compose up -d backend

# Passer une migration manuellement
docker exec -it medusa-backend pnpm exec medusa db:migrate

# Créer un admin
docker exec -it medusa-backend pnpm exec medusa user \
    -e admin@lehena.fr -p <password>

# Ouvrir un shell dans le container
docker exec -it medusa-backend sh

# Backup manuel immédiat
/srv/lehena/backups/backup.sh

# Voir espace disque
df -h
docker system df

# Nettoyer images / volumes orphelins
docker image prune -f
docker volume prune -f
```

---

## Comparatif avec Coolify

| Fonction                         | Coolify         | Ce setup                      |
| -------------------------------- | --------------- | ----------------------------- |
| Déploiement Git-based auto       | UI clic         | GitHub Actions + SSH          |
| Reverse proxy + SSL auto         | Traefik inclus  | Traefik installé manuellement |
| Env vars UI                      | Oui             | Fichier `.env` en SSH         |
| Backups DB                       | UI + S3         | Cron restic                   |
| Preview deployments par PR       | Oui             | Non (à ajouter si besoin)     |
| Logs UI                          | Oui             | Dozzle (optionnel)            |
| Monitoring                       | Basique intégré | UptimeRobot externe           |
| RAM consommée par la couche mgmt | ~500 Mo         | ~50 Mo (Traefik)              |
| Courbe apprentissage             | 1 h             | 3-4 h                         |

Tu perds surtout le **click-ops** de Coolify. Tu gagnes de la RAM, de la
transparence, et un setup 100 % reproductible via ces fichiers.

---

## Prochaines étapes concrètes après première install

1. Faire pointer `backend.lehena.fr` et `traefik.lehena.fr` vers l'IP VPS.
2. Faire les étapes 1 → 4, vérifier que le dashboard Traefik est accessible en HTTPS.
3. Créer le repo GHCR (public/private).
4. Ajouter le Dockerfile Medusa + workflow GitHub, déclencher un premier build.
5. Sur le VPS, `docker compose up -d backend` une fois l'image dispo.
6. Créer un admin Medusa, valider l'accès à `backend.lehena.fr/app`.
7. Mettre en place les backups (étape 7) et tester une restauration.
8. Configurer les monitors UptimeRobot.
9. Ajouter les env variables Stripe / Resend / S3 au fur et à mesure des phases (5, 7, etc.).

---

## Points de vigilance

- **`.env` sur le VPS** : fichier critique, sauvegardé par restic, jamais commité.
- **`acme.json`** : perdu = perte des certificats (5 obtentions/semaine max sur Let's Encrypt). Sauvegardé aussi.
- **Migrations Medusa au deploy** : la commande `medusa db:migrate` dans le `CMD` du Dockerfile s'exécute au start. Si elle échoue, le container ne démarre pas → downtime. Alternative : lancer les migrations dans un job séparé de la CI (`docker compose run --rm backend pnpm exec medusa db:migrate`) puis démarrer le service.
- **Cloudflare devant** : si tu mets Cloudflare Proxy activé (nuage orange), attention au SSL — Traefik gère Let's Encrypt en direct, il faut Cloudflare en mode "Full (strict)" côté SSL/TLS.
- **Rate limit Traefik** : les 100 req/s configurés sont larges. À affiner selon trafic réel.
- **Fail2ban et Docker** : par défaut, fail2ban ne voit pas les IPs derrière Docker. Pour bannir les brute-forces sur l'admin Medusa, il faut soit lire les logs Traefik, soit mettre CrowdSec (plus adapté aux stacks Docker).
