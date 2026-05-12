# Déploiement — guide opérateur

Pipeline et procédures de déploiement Lehena. Tient sur une page,
lisible par un humain non technique.

> **Stack cible** : Vercel (storefront) + Railway (backend + Postgres +
> Redis) + Scaleway Object Storage (médias). Validée Phase 13.

---

## 1. Topologie

```
       ┌──────────────────────────┐
       │  GitHub: Paul-L/lehena   │
       │  ─────────────────────── │
       │  main    → prod          │
       │  develop → staging       │
       │  feat/*  → preview       │
       └─────────┬────────────────┘
                 │
         ┌───────┴────────────────────┐
         │                            │
  ┌──────▼────────┐         ┌─────────▼────────┐
  │  Vercel       │         │  Railway         │
  │  storefront   │ ◄───────│  medusa-backend  │
  │               │  API    │  + postgres-db   │
  │               │         │  + redis         │
  └──────┬────────┘         └─────────┬────────┘
         │                            │
         │ médias                     │ files
         └────────────► Scaleway OS ◄─┘
```

## 2. Branches → environnements

| Branch    | Vercel  | Railway                  | URL                                           |
| --------- | ------- | ------------------------ | --------------------------------------------- |
| `main`    | prod    | prod (manual approval)   | `https://lehena.fr`                           |
| `develop` | staging | staging (auto)           | `https://staging.lehena.fr`                   |
| `feat/*`  | preview | — (uses staging backend) | `https://lehena-storefront-<hash>.vercel.app` |

## 3. Première mise en place (one-time)

### Vercel

1. **Settings → General → Root Directory** : `apps/storefront`
2. **Build Command** : `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @lehena/backend build && pnpm --filter @lehena/storefront build`
   (le backend build génère `.medusa/types/`, indispensable au typecheck du storefront)
3. **Install Command** : laisser vide (le build command gère)
4. **Output Directory** : `.next`
5. **Production Branch** : `main`
6. **Preview Deployments** : `develop` + toutes les `feat/*`
7. **Environment Variables** (per environment) :
   - `MEDUSA_BACKEND_URL` (prod: `https://api.lehena.fr`, staging: `https://staging-api.lehena.fr`)
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_DEFAULT_REGION=fr`
   - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=lehena.fr` (prod only)
   - `NEXT_PUBLIC_SENTRY_DSN` (prod + staging)
   - `SENTRY_AUTH_TOKEN` (build secret, pour upload sourcemaps)

### Railway

1. Nouveau projet "lehena-backend"
2. Service `postgres` (template), config 1 vCPU / 2 GB RAM en prod
3. Service `redis` (template)
4. Service `backend` :
   - **Source** : connect to GitHub repo, root path `apps/backend`
   - **Build** : `pnpm install --frozen-lockfile && pnpm --filter @lehena/backend build`
   - **Start** : `pnpm --filter @lehena/backend start`
   - **Healthcheck** : `/health`
   - **Auto-deploy** : `develop` (staging), `main` (prod with approval)
5. Variables d'environnement à pousser (rotation : cf. `secrets-rotation.md`) :
   - Base : `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `PREVIEW_SECRET`, `REVALIDATE_SECRET`
   - S3 : `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FILE_URL`, `S3_FORCE_PATH_STYLE=true`
   - Stripe : `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`, `STRIPE_PRICE_SUBSCRIPTION_DECOUVERTE`, `STRIPE_PRICE_SUBSCRIPTION_GOURMET`
   - MeiliSearch : `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`, `MEILISEARCH_SEARCH_KEY`
   - Resend : `RESEND_API_KEY`, `RESEND_FROM_EMAIL=hello@mail.lehena.fr`, `RESEND_WEBHOOK_SECRET`
   - Sentry : `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
   - Alertes : `STOCK_ALERTS_TO=atelier@lehena.fr`, `STOCK_LOW_THRESHOLD=5`, `DDM_SHORT_THRESHOLD=30`
   - Storefront : `STOREFRONT_URL=https://lehena.fr`

### Scaleway Object Storage

1. Créer un bucket `lehena-media` en région `fr-par`
2. Configurer CORS pour autoriser les origines `https://lehena.fr` + `https://staging.lehena.fr`
3. Générer une access key + secret key, les coller dans Railway env

### GitHub Actions secrets

Repository Settings → Secrets and variables → Actions :

- `VERCEL_TOKEN` (pour la lecture des Preview URLs depuis les workflows lighthouse / e2e)
- `LH_CI_GITHUB_APP_TOKEN` (Lighthouse — optionnel)
- (Tous les secrets backend/storefront vivent dans Vercel / Railway, pas ici.)

## 4. Déploiement courant

### Workflow normal

1. Branche `feat/xxx` créée depuis `develop`.
2. PR vers `develop`. CI lance : typecheck + lint + tests + build backend + audit.
3. Vercel build automatiquement la preview du storefront. Le bot Vercel ajoute un commentaire avec l'URL preview.
4. Lighthouse + E2E workflows tournent contre la preview URL.
5. Review humaine → merge develop.
6. Railway déploie staging automatiquement. Vérifier `/health`.
7. Test manuel sur staging → tag `vX.Y.Z` sur main → PR develop → main.
8. CI re-run. Merge main → Railway prod déploie avec approval manuel.

### Migrations DB

Les migrations Mikro-ORM tournent dans le startup script Medusa
(`medusa db:migrate` avant `medusa start`). Si une migration échoue, le
container se met en `restart-loop` — Railway sonne l'alerte healthcheck.

**Rollback de migration** : pas d'auto. À faire manuellement via
`railway run pnpm --filter @lehena/backend medusa migration:revert`.

## 5. Backups

### Postgres (Railway)

- Backup automatique quotidien, rétention 7 jours (paramètre Railway).
- Snapshot manuel **avant** chaque migration risquée :
  ```sh
  railway run pg_dump $DATABASE_URL > backups/lehena-$(date +%F).sql
  ```
- **Test de restauration** : trimestriel obligatoire sur staging.
  Procédure :
  ```sh
  railway run -e staging psql < backups/lehena-2026-01-15.sql
  # Lancer le storefront staging, vérifier que les pages se chargent.
  ```

### Médias (Scaleway)

- Versioning Object Storage activé (rétention 30 jours sur les anciennes
  versions).
- Pas de snapshot complet — la liste de produits + l'admin permettent de
  remonter le coup en cas de suppression accidentelle.

## 6. Procédure d'incident

1. **Page Statuspage / Better Stack** mise à jour (si configuré).
2. Vérifier `/health` storefront + backend.
3. Vérifier Sentry pour les erreurs in-flight.
4. Si data corruption suspectée : `pg_dump` avant toute action.
5. Rollback : Vercel UI → Deployments → "Promote to Production" sur le dernier déploiement vert. Railway : idem dans le UI.

## 7. Rotation des secrets

Cf. [`secrets-rotation.md`](./secrets-rotation.md).

## 8. Coûts mensuels indicatifs

| Service                              | Estimation V1                              |
| ------------------------------------ | ------------------------------------------ |
| Vercel Hobby/Pro                     | 0-20 €/mo                                  |
| Railway (backend + postgres + redis) | 30-60 €/mo                                 |
| Scaleway Object Storage              | 5-10 €/mo (premier 75 Go gratuit)          |
| Resend                               | 0-20 €/mo (gratuit jusqu'à 3000 emails/mo) |
| Sentry                               | 0-26 €/mo                                  |
| Plausible                            | 9 €/mo (SaaS) ou 0 € (auto-hébergé)        |
| **Total V1**                         | **~80-150 €/mo**                           |
