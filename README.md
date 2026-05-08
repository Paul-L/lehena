# Lehena

Monorepo ecommerce **Medusa v2** + **Next.js**.

## Structure

```
lehena/
├── apps/
│   ├── backend/      # Serveur Medusa v2 (API + admin sur :9000)
│   └── storefront/   # Storefront Next.js 15 (App Router, sur :8000)
├── packages/         # (vide pour l'instant — packages partagés)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 10
- PostgreSQL (local ou distant) — Medusa ne supporte plus SQLite en v2
- Redis (optionnel mais recommandé en prod)

## Installation

```bash
pnpm install
```

## Configuration

### Backend

```bash
cp apps/backend/.env.template apps/backend/.env
# édite apps/backend/.env : DATABASE_URL, JWT_SECRET, COOKIE_SECRET, *_CORS
```

Initialise la base et crée un admin :

```bash
pnpm --filter @lehena/backend exec medusa db:create
pnpm --filter @lehena/backend exec medusa db:migrate
pnpm seed
pnpm --filter @lehena/backend exec medusa user -e admin@lehena.com -p supersecret
```

Récupère ensuite une **publishable API key** depuis l'admin (Settings → Publishable API Keys) pour la connecter au storefront.

### Storefront

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
# édite apps/storefront/.env.local :
#   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
#   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

## Lancement

Tout en parallèle (Turborepo) :

```bash
pnpm dev
```

Individuellement :

```bash
pnpm dev:backend     # http://localhost:9000  (admin: /app)
pnpm dev:storefront  # http://localhost:8000
```

## Build production

```bash
pnpm build
pnpm start
```

## Scripts utiles

| Commande              | Description                        |
| --------------------- | ---------------------------------- |
| `pnpm dev`            | Dev backend + storefront           |
| `pnpm build`          | Build de toutes les apps           |
| `pnpm seed`           | Seed la base Medusa                |
| `pnpm lint`           | Lint de toutes les apps            |
| `pnpm clean`          | Nettoie les builds et node_modules |
