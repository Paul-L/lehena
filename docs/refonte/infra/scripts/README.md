# Bundle scripts — VPS Lehena

Scripts idempotents pour provisionner un VPS Debian 12 vierge et le faire
tourner Medusa en auto-update, sans Coolify ni orchestrateur.

**Flow d'update** : `git push main` → GitHub Actions build l'image et la
publie sur GHCR → **Watchtower** sur le VPS détecte la nouvelle image et
redémarre le container. Aucun secret SSH côté CI.

---

## Assumptions

Modifie ces valeurs avant d'exécuter les scripts (elles sont en tête de
chaque fichier concerné, cherche `# ==== À CONFIGURER`) :

| Variable             | Valeur exemple                            |
| -------------------- | ----------------------------------------- |
| `DEPLOY_USER`        | `paul`                                    |
| `DEPLOY_HOSTNAME`    | `backend.lehena.fr`                       |
| `TRAEFIK_HOSTNAME`   | `traefik.lehena.fr`                       |
| `TRAEFIK_ACME_EMAIL` | `paul@groupemilestone.com`                |
| `GHCR_IMAGE`         | `ghcr.io/paul-l/lehena-backend`           |
| `STOREFRONT_URLS`    | `https://lehena.fr,https://www.lehena.fr` |
| `S3_BACKUP_BUCKET`   | `lehena-backups`                          |
| `S3_BACKUP_ENDPOINT` | `https://s3.fr-par.scw.cloud`             |

Le domaine `backend.lehena.fr` doit **déjà pointer** (record A) sur l'IP du
VPS avant `20-traefik.sh` (sinon Let's Encrypt échoue).

---

## Ordre d'exécution (première install)

Tous les scripts sont dans ce dossier. Copie-les sur le VPS (`scp`, `git clone`,
ou copie manuelle) puis exécute dans l'ordre :

```bash
# En root (première session SSH)
bash 00-bootstrap.sh          # user paul, ssh, ufw, fail2ban, swap
bash 10-docker.sh             # Docker + compose

# Reconnexion en tant que paul (pour que le groupe docker soit actif)
exit
ssh paul@<vps-ip>

# Suite (en paul)
bash 20-traefik.sh            # Traefik + SSL Let's Encrypt
bash 30-stack.sh              # Postgres + Redis + MeiliSearch (backend viendra après premier build CI)
bash 40-watchtower.sh         # auto-update quand la CI publie une nouvelle image

# Une fois la CI a publié la première image
bash deploy.sh                # démarre le backend Medusa
```

---

## Ordre d'exécution (opérations courantes)

```bash
# Voir l'état
bash health.sh

# Backup manuel immédiat
bash backup.sh

# Redéploiement forcé (rare — Watchtower le fait auto)
bash deploy.sh

# Test de restauration (dry-run)
bash restore.sh --dry-run

# Restauration réelle (grave incident uniquement)
bash restore.sh <snapshot-id>
```

---

## Structure produite sur le VPS

```
/srv/lehena/
├── traefik/
│   ├── docker-compose.yml
│   ├── traefik.yml
│   ├── dynamic.yml
│   └── acme/               # certificats Let's Encrypt (700)
├── medusa/
│   ├── docker-compose.yml
│   ├── .env                # secrets (600, jamais commité)
│   └── data/
│       ├── postgres/
│       ├── redis/
│       └── meilisearch/
├── watchtower/
│   └── docker-compose.yml
├── backups/
│   ├── backup.sh
│   ├── pg-dumps/
│   └── restic-cache/
└── scripts/                # ces scripts, copie de travail
```

---

## Le flow d'auto-update en détail

1. Tu push sur `main` dans le repo Lehena.
2. GitHub Actions (`templates/github-actions-build.yml`) déclenche :
   - Build l'image backend (Dockerfile fourni en `apps/backend/Dockerfile`).
   - Tag `latest` + tag `<sha>` (traçabilité).
   - Push sur `ghcr.io/<owner>/lehena-backend`.
3. **Watchtower** sur le VPS poll GHCR toutes les 5 min.
4. Détection d'une nouvelle image `latest` → pull + arrêt propre du container
   backend + démarrage du nouveau.
5. Le script `deploy.sh` interne du container démarre : `medusa db:migrate`
   puis `medusa start`.
6. Traefik continue de router pendant la bascule (downtime typique < 30 s).

Pour redéployer manuellement sans attendre les 5 min :

```bash
bash deploy.sh
```

Pour désactiver l'auto-update temporairement (freeze prod) :

```bash
cd /srv/lehena/watchtower
docker compose down
```

---

## Secrets à conserver précieusement (password manager)

Après `30-stack.sh`, le script imprime les secrets générés. **Sauvegarde-les
tout de suite** dans 1Password / Bitwarden. Ils sont dans
`/srv/lehena/medusa/.env` mais si ce fichier est perdu (et non backupé),
c'est game over.

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `MEILI_MASTER_KEY`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `RESTIC_PASSWORD` (généré par `20-traefik.sh` ? non, par toi, à mettre dans backup.sh — voir en tête du script)

---

## Points de vigilance

- **Le repo GHCR doit être privé** (par défaut oui). Watchtower a besoin
  d'un token pour pull → `40-watchtower.sh` te demande de créer un token
  GitHub avec scope `read:packages`.
- **`acme.json` de Traefik** : les certificats Let's Encrypt sont dedans.
  Sauvegardé par `backup.sh`. Sans lui, régénérer les certs (limite : 5/semaine
  par domaine).
- **Migrations Medusa** : lancées au start du container. Si elles échouent,
  le container ne boot pas → Watchtower rollback ? Non, Watchtower ne
  rollback pas. Si tu as un doute sur une migration, désactive Watchtower
  temporairement.
- **Firewall** : `00-bootstrap.sh` ouvre uniquement SSH + HTTP + HTTPS. Si
  tu ajoutes un service exposé (Dozzle par ex.), il passe par Traefik →
  pas de port supplémentaire à ouvrir.

---

## Troubleshooting connu

### `ln -s` place le symlink dans le mauvais dossier

Symptôme :

```
/srv/lehena/scripts/scripts -> /opt/lehena/repo/docs/refonte/infra/scripts
```

Cause : `/srv/lehena/scripts/` existait déjà en tant que dossier, donc `ln`
a placé le lien à l'intérieur.

Fix :

```bash
rm /srv/lehena/scripts/scripts
rmdir /srv/lehena/scripts
ln -s /opt/lehena/repo/docs/refonte/infra/scripts /srv/lehena/scripts
```

Le patch de `00-bootstrap.sh` ne crée plus ce dossier à l'avance.

### Traefik : `client version 1.24 is too old`

Symptôme (logs Traefik) :

```
ERR Failed to retrieve information of the docker client and server host
   error="Error response from daemon: client version 1.24 is too old.
   Minimum supported API version is 1.40"
```

Cause : Docker Engine récent (≥ 28) refuse les vieilles versions d'API que
la SDK Go de Traefik peut demander en fallback.

Fix (déjà dans `20-traefik.sh` patché) :

- image `traefik:v3` (dernière v3.x)
- env var `DOCKER_API_VERSION=1.44`

Si tu as déjà lancé la version pré-patch, édite manuellement
`/srv/lehena/traefik/docker-compose.yml` puis :

```bash
cd /srv/lehena/traefik
docker compose down && docker compose pull && docker compose up -d
```

### Docker legacy (docker.io Debian) pré-installé

Certains providers livrent Debian 12 avec `docker.io` (version ~20.10)
qui ne supporte pas l'API 1.40. `10-docker.sh` patché détecte et purge
automatiquement.

Si tu as fait le setup avant le patch : refais manuellement la purge :

```bash
sudo systemctl stop docker docker.socket containerd 2>/dev/null || true
sudo apt purge -y docker docker.io containerd runc containerd.io 2>/dev/null
sudo apt autoremove -y
sudo rm -rf /var/lib/docker /var/lib/containerd
sudo bash /srv/lehena/scripts/10-docker.sh
```
