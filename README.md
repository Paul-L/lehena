# Lehena

Monorepo ecommerce **Medusa v2** + **Next.js 15** pour [lehena.fr](https://lehena.fr).

> Refonte en cours. Le plan complet et les prompts par phase sont dans
> [`docs/refonte/`](./docs/refonte/) — commencer par
> [`docs/refonte/README.md`](./docs/refonte/README.md).

## Structure

```
lehena/
├── apps/
│   ├── backend/      # Serveur Medusa v2 (API + admin sur :9000)
│   └── storefront/   # Storefront Next.js 15 (App Router, :8000)
├── packages/         # (vide — packages partagés à venir)
├── docs/
│   ├── cms/          # Série prompts module CMS Pages (livré)
│   ├── pilot-ai/     # Plugin Pilot AI (hors-scope refonte)
│   └── refonte/      # Plan + 15 phases + ADRs + stratégie SEO
├── docker-compose.dev.yml
├── eslint.config.mjs
├── .prettierrc.mjs
├── commitlint.config.mjs
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prérequis

- **Node.js ≥ 20**
- **pnpm 10.12.4** (pinné via `packageManager`)
- **Docker** (pour le compose dev local)

## Setup dev local

### 1. Cloner et installer

```bash
pnpm install
```

### 2. Booter l'infra locale

```bash
docker compose -f docker-compose.dev.yml up -d
```

Services exposés :

- Postgres → `localhost:5432` (`medusa` / `medusa` / db `lehena_dev`)
- Redis → `localhost:6379`
- MinIO (S3) → `localhost:9100` API / `localhost:9101` console (`minioadmin` / `minioadmin`). Bucket `lehena-media` créé automatiquement.
- MeiliSearch → `localhost:7700`

### 3. Variables d'environnement

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/storefront/.env.example apps/storefront/.env.local
```

Remplir au minimum côté backend : `JWT_SECRET`, `COOKIE_SECRET` (générés via `openssl rand -base64 64`), et les credentials MinIO si tu veux uploader des médias en dev.

Côté storefront : `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (à créer dans l'admin une fois le backend booté).

### 4. Initialiser la base

```bash
pnpm --filter @lehena/backend exec medusa db:create
pnpm --filter @lehena/backend exec medusa db:migrate
pnpm --filter @lehena/backend exec medusa user -e admin@lehena.com -p <un-mdp-fort>
pnpm seed
```

### 5. Lancer

```bash
pnpm dev
```

- Backend (admin + API) : http://localhost:9000 — admin sur `/app`
- Storefront : http://localhost:8000

## Scripts utiles

| Commande              | Description                       |
| --------------------- | --------------------------------- |
| `pnpm dev`            | Backend + storefront en parallèle |
| `pnpm dev:backend`    | Backend uniquement                |
| `pnpm dev:storefront` | Storefront uniquement             |
| `pnpm build`          | Build des deux apps               |
| `pnpm typecheck`      | `tsc --noEmit` sur chaque app     |
| `pnpm lint`           | ESLint sur chaque app             |
| `pnpm lint:fix`       | ESLint auto-fix                   |
| `pnpm format`         | Prettier write                    |
| `pnpm format:check`   | Prettier check (utilisé en CI)    |
| `pnpm seed`           | Seed Medusa                       |
| `pnpm clean`          | Supprime builds + node_modules    |

## Tooling

- **ESLint flat config** strict (typescript-eslint strict + import + a11y + react/next) — `eslint.config.mjs`.
- **Prettier** au root — `.prettierrc.mjs`.
- **Husky** + **lint-staged** : pre-commit auto-format + lint.
- **commitlint** Conventional Commits sur `commit-msg` (cf. [`docs/refonte/branching.md`](./docs/refonte/branching.md)).
- **Turborepo** : cache local, tâches `dev` / `build` / `lint` / `typecheck`.
- **CI** GitHub Actions : install + typecheck + lint + build sur PR vers `main` / `develop`.

## Branches

| Branche               | Rôle                            |
| --------------------- | ------------------------------- |
| `main`                | Production                      |
| `develop`             | Intégration / staging           |
| `feat/phase-N-<slug>` | Travail par phase de la refonte |

Détails et conventions de commit : [`docs/refonte/branching.md`](./docs/refonte/branching.md).
