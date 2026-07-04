# Récap du parcours de déploiement VPS Lehena

> Contexte pour toute personne (humain ou Claude Code) qui reprend le
> déploiement du **backend Medusa + storefront Next.js** sur le VPS Hetzner
> Debian 12. Documente **tous** les pièges rencontrés (blockers #1→#18), **ce
> qui marche**, et le runbook de déploiement.
>
> État au 2026-07-04 : **boutique en ligne et fonctionnelle** (cf. §9).

---

## 1. Cible technique visée

- **Backend Medusa v2.14.2** hébergé sur VPS Debian 12 (Hetzner CX32 : 4 vCore / 8 Go RAM / 80 Go SSD)
- **Storefront Next.js 15** hébergé **sur le même VPS** (Docker, image standalone),
  **PAS sur Vercel** (décision 2026-07-04). Même chaîne GHCR + Watchtower que le backend.
- **Auto-update via GHCR + Watchtower** : push sur `main` → GitHub Actions build & push image → Watchtower détecte + redéploie
- **Domaines** (tous en prod, cert Let's Encrypt valide) :
  - `backend.lehena.fr` → API + admin Medusa
  - `traefik.lehena.fr` → dashboard Traefik (basic auth)
  - `lehena.fr` → storefront ; `www.lehena.fr` → **301 vers l'apex**

## 2. Stack déployée sur le VPS

Structure de fichiers :

```
/opt/lehena/repo/                    # clone git (deploy key GitHub read-only)
/srv/lehena/
├── traefik/
│   ├── docker-compose.yml
│   ├── traefik.yml
│   ├── dynamic.yml
│   ├── .dashboard-auth              # basic auth hash pour dashboard
│   └── acme/acme.json               # certificats Let's Encrypt
├── medusa/
│   ├── docker-compose.yml           # postgres/redis/meili + backend + storefront
│   ├── .env                         # secrets Postgres/Redis/Meili + Medusa (dont MEDUSA_BACKEND_URL, FILE_UPLOAD_DIR)
│   ├── .env.storefront              # runtime storefront (MEDUSA_BACKEND_URL, REVALIDATE_SECRET)
│   └── data/
│       ├── postgres/
│       ├── redis/
│       ├── meilisearch/
│       └── uploads/                 # volume images produits (file module local, cf. #16)
├── watchtower/
│   └── docker-compose.yml
├── backups/
│   └── .backup-env                  # (à créer, restic → Scaleway)
└── scripts → /opt/lehena/repo/docs/refonte/infra/scripts/  (symlink)
```

Containers actifs :

- `traefik` (v3, reverse proxy + Let's Encrypt)
- `medusa-postgres` (postgres:16-alpine, healthy)
- `medusa-redis` (redis:7-alpine, "unhealthy" — healthcheck cosmétique foiré mais service OK)
- `medusa-meilisearch` (v1.10, idem "unhealthy" cosmétique)
- `medusa-backend` (✅ **healthy** — API + admin servis, cf. §4)
- `lehena-storefront` (✅ **healthy** — Next.js 15 standalone, port 3000, cf. §9)
- `watchtower` (auto-update GHCR toutes les 5 min)

## 3. Ce qui marche

- ✅ Bootstrap OS Debian (user `debian`, SSH durci, UFW, fail2ban, swap, timezone)
- ✅ Docker CE 29.6.1 installé après purge du docker.io legacy
- ✅ Traefik en HTTPS avec cert Let's Encrypt valide sur `traefik.lehena.fr`
- ✅ Traefik voit les containers via `DOCKER_API_VERSION=1.44` (Docker 29 refuse API < 1.40)
- ✅ Watchtower actif (avec le même env var)
- ✅ Postgres/Redis/MeiliSearch UP et fonctionnels (tests directs OK, seuls les healthchecks sont mal écrits)
- ✅ `.env` généré avec secrets aléatoires (sauvegardés dans 1Password)
- ✅ Repo git cloné dans `/opt/lehena/repo` via SSH deploy key read-only
- ✅ Image GHCR privée avec workflow GitHub Actions qui build & push sur push `develop`
- ✅ Backend Medusa se **pull** depuis GHCR sans erreur
- ✅ **Backend UP et fonctionnel** (2026-07-03) : container `healthy`, migrations
  runtime OK, admin servi
  - `https://backend.lehena.fr/health` → **HTTP 200**, cert Let's Encrypt valide
  - `https://backend.lehena.fr/app` → **back-office Medusa** (HTTP 200)
- ✅ Chaîne CI/CD complète validée : push `main` → build GHCR vert → Watchtower
  redéploie → migrations → serveur healthy → Traefik + Let's Encrypt
- ✅ **Storefront UP et fonctionnel** (2026-07-04), cf. §9 : `https://lehena.fr`
  et toutes les pages (accueil, store, catégories, produits) → **200**, images
  produits servies (`https://backend.lehena.fr/static/…`, HTTP 200), cert
  Let's Encrypt, `www` → 301 apex. Seed exécuté (16 produits, 3 régions,
  publishable key). Compte admin créé.

## 4. Blocker principal — RÉSOLU (2026-07-03)

Le déploiement backend est **débloqué**. Le crash-loop initial masquait en
réalité **deux couches** de problèmes distinctes (cf. #11 et #13 dans le
tableau §5), résolues l'une après l'autre :

1. **Image vide → `[ERR_PNPM_NO_PKG_MANIFEST]`** : `medusa build` sortait sans
   produire `.medusa/server/` parce que `.dockerignore` exclut `.env`, donc
   dans le stage builder `requireEnv()` (medusa-config.ts) throwait au
   load-time → config `null` → `Cannot read properties of null (reading
'admin')`. **Fix** : passer des env vars **placeholder** au `pnpm build` du
   builder (jetables, aucune connexion réseau ; le runtime reçoit les vrais
   secrets via le `.env` monté sur le VPS).

2. **Crash-loop `Could not find index.html in the admin build directory`**
   (RestartCount > 1900) : la CMD lançait `medusa start` depuis
   `/app/apps/backend`. Medusa résout `rootDirectory = cwd` et cherche l'admin
   à `<cwd>/public/admin/index.html`, alors que le bundle est écrit dans
   `.medusa/server/public/admin/`. **Fix** : `cd .medusa/server` avant
   `medusa start` (le bundle compilé est auto-suffisant). `db:migrate` reste à
   la racine où il fonctionne.

L'**assertion défensive** du Dockerfile (ci-dessous) a rempli son rôle : elle a
fait planter la CI tant que `.medusa/server/` n'était pas produit, ce qui a
isolé le blocker #1. Elle est conservée comme garde-fou.

```dockerfile
RUN test -d /app/apps/backend/.medusa/server \
    && test -f /app/apps/backend/.medusa/server/package.json \
    && test -f /app/apps/backend/.medusa/server/public/admin/index.html \
    || (echo "FATAL: medusa build did not produce a valid .medusa/server/ directory" \
        && ls -la /app/apps/backend/.medusa/ 2>&1 && exit 1)
```

### Reste à faire (hors blocker back)

- **Storefront Next.js non déployé** (Vercel, hors scope de ce deploy back) —
  `lehena.fr` / `www.lehena.fr` ne répondent pas encore, c'est attendu.
- Créer un utilisateur admin Medusa si pas encore fait (`medusa user`) pour se
  connecter à `/app`.

## 5. Historique des blockers résolus (chronologique)

| #   | Blocker                                                                                      | Cause                                                                                                                                               | Fix                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ln -s scripts` place le lien dans le mauvais dossier                                        | `00-bootstrap.sh` pré-créait `/srv/lehena/scripts`                                                                                                  | Retiré du script                                                                                                                                                                                            |
| 2   | Docker daemon "client version 1.24 is too old"                                               | `docker.io` legacy Debian pré-installé, mon `10-docker.sh` skip car docker existe                                                                   | Purge + reinstall Docker CE, check API ≥ 1.40 dans le script                                                                                                                                                |
| 3   | Traefik en boucle "client version 1.25 is too old"                                           | Traefik v3.1 SDK trop vieille pour Docker 29                                                                                                        | Passage à `traefik:v3` (latest v3) + env `DOCKER_API_VERSION=1.44`                                                                                                                                          |
| 4   | `[ERR_PNPM_NO_PKG_MANIFEST]` sur yalc-linked plugin                                          | `medusa-ai-assistant` en `file:.yalc/...` mais dossier gitignoré                                                                                    | Suppression complète des références yalc / anthropic                                                                                                                                                        |
| 5   | Postgres SSL "The server does not support SSL connections"                                   | Driver `pg` tente SSL par défaut                                                                                                                    | Ajout `?sslmode=disable` à `DATABASE_URL`                                                                                                                                                                   |
| 6   | Typo `sslmode=disabled` → KnexTimeoutError                                                   | Valeur invalide, retombe sur mode `prefer`                                                                                                          | Typo `disabled` → `disable`                                                                                                                                                                                 |
| 7   | Container crash "Could not find index.html in the admin build"                               | `.medusa/server/` pas produit par le premier Dockerfile                                                                                             | Nouveau Dockerfile "workspace-preserved"                                                                                                                                                                    |
| 8   | `Cannot find module '@medusajs/dashboard'` au build admin                                    | `pnpm install --filter` ne hoiste pas la transitive dep                                                                                             | Drop du `--filter`, install workspace complet                                                                                                                                                               |
| 9   | 13 erreurs TS `service is of type 'unknown'` sur module `migration`                          | `container.resolve(MIGRATION_MODULE)` sans generic                                                                                                  | Export du type + `resolve<MigrationModuleService>(MIGRATION_MODULE)`                                                                                                                                        |
| 10  | Erreurs lint storefront                                                                      | Code stub avec `any`, args unused, ReadonlyArray                                                                                                    | Nettoyage, helper `str()` pour formData                                                                                                                                                                     |
| 11  | `[ERR_PNPM_NO_PKG_MANIFEST]` / `/app` vide : `medusa build` ne produit pas `.medusa/server/` | `.dockerignore` exclut `.env` → `requireEnv()` throw au load-time dans Docker → config null                                                         | Env vars **placeholder** passées au `pnpm build` du builder (commit `3b56159`)                                                                                                                              |
| 12  | 58 erreurs TS `resolve() → 'unknown'` cassent `ci.yml`                                       | `container.resolve(X_MODULE)` sans generic (pattern #9 étendu à 11 modules)                                                                         | `export type { default as … }` + `resolve<T>()` sur ~46 fichiers (commit `31da181`)                                                                                                                         |
| 13  | Crash-loop `Could not find index.html in the admin build directory` (RestartCount > 1900)    | `medusa start` lancé depuis la racine → cherche l'admin à `<cwd>/public/admin` au lieu de `.medusa/server/public/admin`                             | `cd .medusa/server` avant `medusa start` (commit `8bdeba6`)                                                                                                                                                 |
| 14  | Storefront Docker build : `Module not found: Can't resolve 'lucide-react'`                   | `lucide-react` importé mais non déclaré dans `apps/storefront/package.json` (résolu en local par hoisting ; le Docker fait `pnpm install --filter`) | Déclarer `lucide-react@^1.14.0` (commit `53f19ea`)                                                                                                                                                          |
| 15  | Storefront Docker : `COPY .next/standalone` échoue (dossier absent)                          | `output: "standalone"` absent de `next.config.js`                                                                                                   | Ajout `output: "standalone"` + `outputFileTracingRoot` (monorepo) (commit `0a6e9fe`)                                                                                                                        |
| 16  | Images produits cassées (404, `http://localhost:9000/static/private-…`)                      | Provider fichier local par défaut : URL `localhost:9000`, fichiers `private`, stockage éphémère ; seed écrit dans un `static` ≠ celui servi (cwd)   | Module `file` explicite (`backend_url`=`${MEDUSA_BACKEND_URL}/static`, `upload_dir`=`FILE_UPLOAD_DIR` absolu) + volume + seed `access:"public"` + reset & re-seed (commits `1b5be40`, `ff0ee9e`, `4ffab95`) |
| 17  | Storefront 500 sur pages listing/produit (`digest: DYNAMIC_SERVER_USAGE`)                    | `generateStaticParams` + data functions lisant `cookies()` (getCacheOptions) dans un `fetch force-cache` → conflit à la génération statique         | `export const dynamic = "force-dynamic"` sur category/collections/products (commit `85d91c7`)                                                                                                               |
| 18  | Cert Let's Encrypt échoue pour `lehena.fr` (`Cannot negotiate ALPN acme-tls/1` sur `www`)    | Enregistrement **AAAA (IPv6) parasite** sur `www.lehena.fr` → LE privilégie l'IPv6 et tape un host sans Traefik ; le cert SAN combiné échoue        | Supprimer l'AAAA de `www` (côté DNS) → challenge repasse en IPv4                                                                                                                                            |

## 6. État actuel des workflows GitHub

Trois workflows de build/CI :

1. **`build-backend.yml`** — build Docker backend + push GHCR. Trigger sur `apps/backend/**`, `pnpm-lock.yaml`, `package.json`, `apps/backend/Dockerfile`.
2. **`build-storefront.yml`** — build Docker storefront + push GHCR. Trigger sur `apps/storefront/**`, `pnpm-lock.yaml`, `package.json`. Passe les `NEXT_PUBLIC_*` + `MEDUSA_BACKEND_HOSTNAME` en **build-args** depuis les _repository variables_ GitHub (inlinés dans le bundle client).
3. **`ci.yml`** — install + typecheck + lint + build monorepo. Trigger sur tout push.

État actuel (2026-07-04) : **tous verts**. Images `ghcr.io/paul-l/lehena-backend`
et `ghcr.io/paul-l/lehena-storefront` publiées et redéployées par Watchtower.

⚠️ Les trois workflows se déclenchent sur **`main`** (pas `develop`). Tout le
déploiement s'est fait sur `main`.

### Repository variables GitHub (build-args storefront)

`NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://backend.lehena.fr`,
`NEXT_PUBLIC_BASE_URL=https://lehena.fr`, `NEXT_PUBLIC_DEFAULT_REGION=fr`,
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_…` (publishable key **Medusa**, ≠ Stripe),
`MEDUSA_BACKEND_HOSTNAME=backend.lehena.fr`, `MEDUSA_BACKEND_PROTOCOL=https`.

## 7. Configuration importante

### `.npmrc` racine

```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
node-linker=hoisted
```

Le hoisting est déjà en place → `@medusajs/dashboard` devrait être disponible via `node_modules/@medusajs/dashboard/`.

### `apps/backend/package.json` (extraits)

```json
"scripts": {
  "build": "medusa build",
  "start": "medusa start"
}
"dependencies": {
  "@medusajs/admin-sdk": "2.14.2",
  "@medusajs/cli": "2.14.2",
  "@medusajs/framework": "2.14.2",
  "@medusajs/js-sdk": "2.14.2",
  "@medusajs/medusa": "2.14.2",
  ...
}
```

### `apps/backend/Dockerfile` (version actuelle simplifiée)

```dockerfile
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc* ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/.npmrc* apps/backend/
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --frozen-lockfile
COPY apps/backend/ apps/backend/
RUN cd apps/backend && pnpm build
RUN test -d /app/apps/backend/.medusa/server \
    && test -f /app/apps/backend/.medusa/server/package.json \
    && test -f /app/apps/backend/.medusa/server/public/admin/index.html \
    || (echo "FATAL: ..." && ls -la /app/apps/backend/.medusa/ && exit 1)

FROM node:22-alpine AS runner
RUN corepack enable && apk add --no-cache curl tini
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc* ./
COPY --from=builder /app/apps/backend ./apps/backend
RUN addgroup -S medusa && adduser -S -G medusa medusa && chown -R medusa:medusa /app
USER medusa
WORKDIR /app/apps/backend
EXPOSE 9000
# start DOIT tourner depuis .medusa/server/ (sinon admin index.html introuvable, cf. #13)
CMD ["sh", "-c", "pnpm exec medusa db:migrate && cd .medusa/server && pnpm exec medusa start"]
```

> Note : l'extrait `RUN cd apps/backend && pnpm build` ci-dessus est simplifié.
> Le Dockerfile réel passe des env vars **placeholder** au build (cf. #11).

## 8. Questions ouvertes — RÉSOLUES

Toutes tranchées lors de la passe du 2026-07-03 :

1. ~~`medusa build` produit-il `.medusa/server/` en local ?~~ **Oui** — le
   `.env` local fournit les vars via `loadEnv()`, donc `requireEnv()` passe.
2. ~~Pourquoi le CI n'y arrivait pas ?~~ Pas de `.env` dans Docker
   (`.dockerignore`) → `requireEnv()` throw → cf. blocker #11.
3. ~~Vraie erreur masquée ?~~ `Cannot read properties of null (reading
'admin')` au load-time de la config. Reproduite en local en retirant le `.env`.
4. ~~Un module custom crashe-t-il la config ?~~ **Non** — aucun module ne
   throw ; le crash venait uniquement des env vars manquantes.
5. ~~Erreurs TS `Cannot find module '@medusajs/types'` sur les fulfillment
   providers ?~~ **Disparues** — plus aucune erreur `@medusajs/types` au
   typecheck. Les 58 erreurs restantes étaient le pattern `resolve() → unknown`
   (blocker #12), désormais corrigé.

Toutes résolues. Le storefront a finalement été déployé **sur le VPS** (cf. §9),
pas sur Vercel.

## 9. Storefront Next.js sur le VPS (2026-07-04)

Décision : héberger le storefront sur le **même VPS** que le backend (Docker +
GHCR + Watchtower), pas sur Vercel. Blockers #14→#18 résolus lors de cette passe.

### Architecture

- Image `ghcr.io/paul-l/lehena-storefront:latest`, Next.js 15 **standalone**,
  port **3000**, healthcheck `/api/health`.
- Build via `build-storefront.yml` : les `NEXT_PUBLIC_*` sont **inlinés au build**
  (repository variables GitHub) ; `MEDUSA_BACKEND_HOSTNAME` whiteliste le host
  des images dans `next/image`.
- Runtime : `.env.storefront` fournit `MEDUSA_BACKEND_URL` (SDK côté serveur,
  utilisé par le middleware pour fetcher les régions) + `REVALIDATE_SECRET`.
- Router Traefik `Host(lehena.fr) || Host(www.lehena.fr)`, middleware
  `www-redirect` (301 www→apex), cert Let's Encrypt.

### Images produits (file module local)

- Module `file` explicite dans `medusa-config.ts` : `backend_url` public +
  `upload_dir` piloté par `FILE_UPLOAD_DIR` (absolu, aligné sur ce que sert
  Express : `<cwd>/static` = `.medusa/server/static`).
- **Volume** `./data/uploads:/app/apps/backend/.medusa/server/static` → images
  persistantes (sinon perdues à chaque recréation du container ⚠️).
- Seed uploade en `access:"public"`. Le seed **skippe les produits existants** →
  pour réécrire les URLs il faut d'abord `reset-products.ts`
  (`CONFIRM_RESET_PRODUCTS=true`) puis re-seed.

### Séquence de déploiement / réamorçage (runbook)

```bash
cd /srv/lehena/medusa
# backend (nouvelle image + volume + env)
docker compose pull backend && docker compose up -d --no-deps --force-recreate backend
# admin + données
docker exec -it medusa-backend sh -c 'cd /app/apps/backend && pnpm exec medusa user -e <email> -p <pass>'
docker exec -e CONFIRM_RESET_PRODUCTS=true medusa-backend sh -c 'cd /app/apps/backend && pnpm exec medusa exec ./src/scripts/reset-products.ts'
docker exec medusa-backend sh -c 'cd /app/apps/backend && pnpm exec medusa exec ./src/scripts/seed.ts'
# storefront
docker compose pull storefront && docker compose up -d --no-deps --force-recreate storefront
```

### ⚠️ Pièges opérationnels confirmés

- **`--no-deps` obligatoire** sur `docker compose up` : le `depends_on:
condition: service_healthy` de redis/meili bloque sinon le démarrage (leurs
  healthchecks sont cosmétiquement cassés). Fix propre à faire : passer ces
  `condition` à `service_started` dans le compose.
- **Watchtower peut détacher le réseau `web`** en recréant un container →
  Traefik perd le router (404 par défaut). Remède : `docker compose up -d
--force-recreate <service>` (réattache les réseaux du compose).
- **Publishable key** : celle du storefront est la clé **Medusa** (`pk_` + 64
  hex, table `api_key`), à ne pas confondre avec la clé **Stripe** (`pk_live_51…`).
- **DNS** : pas d'AAAA parasite sur les sous-domaines (cf. #18).

### État final (checkup 2026-07-04)

Tout **vert** : backend (`/health`, `/app`, store API) + storefront (accueil,
store, catégories, produits → 200) + images produits servies (200) + `next/image`
OK + TLS Let's Encrypt sur les deux domaines + `www` → 301 apex. **Boutique en
ligne et fonctionnelle.**
