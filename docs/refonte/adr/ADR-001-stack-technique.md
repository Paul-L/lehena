# ADR-001 — Stack technique de la refonte Lehena

- **Status** : Accepted
- **Date** : 2026-05-11
- **Décideurs** : Paul (validation), Claude Code (proposition)
- **Phase concernée** : Phase 0 — Fondations

## Contexte

Le plan global (`docs/refonte/00-PLAN.md` § 2) propose une stack ;
elle doit être verrouillée formellement avant la Phase 1 (modèle métier).
Cet ADR cristallise les choix faits en Phase 0, leurs justifications et
les bloquants identifiés à débloquer en parallèle.

L'ancien site est WordPress + WooCommerce (audit dans `audit-site-actuel.md`),
sous-optimisé techniquement et éditorialement. La cible est une refonte
complète avec Medusa v2 + Next.js 15 (App Router) + React 19, sur ~3-4 mois.

## Décision

On retient la stack ci-dessous, sans surprise par rapport au plan.

### Cœur applicatif

| Domaine    | Choix                                  | Version visée          | Justification courte                                     |
| ---------- | -------------------------------------- | ---------------------- | -------------------------------------------------------- |
| Backend    | **Medusa v2**                          | 2.14.x                 | Headless, modulaire, communauté FR active, déjà installé |
| Storefront | **Next.js 15 (App Router) + React 19** | 15.3.9 / 19.0.5        | RSC, ISR, perf SEO. Déjà installé                        |
| Monorepo   | **pnpm 10 workspaces + Turborepo**     | pnpm 10.12.4 / turbo 2 | Cf. ADR-002                                              |
| TypeScript | strict, `any` proscrit                 | ^5.6                   | Cf. tsconfig de chaque app                               |

### Providers et services

| Domaine                             | Choix                                                                    | État côté Medusa v2.14                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Paiement principal                  | **Stripe** (`@medusajs/payment-stripe`)                                  | ✅ Officiel, intégré                                                                               |
| Paiement 3x                         | **Alma**                                                                 | ❌ Pas de module v2 publié. Fallback en Phase 5 : custom provider OU lien hosted                   |
| Livraison réfrigérée                | **Chronofresh**                                                          | ❌ Custom fulfillment provider. **Bloquant** : accès API + grille tarifaire à demander (risque P2) |
| Livraison sèche                     | **Colissimo**                                                            | ❌ Pas de plugin v2 stable. API publique → custom provider                                         |
| File / Médias                       | **Scaleway Object Storage** (S3-compatible) via `@medusajs/file-s3`      | ✅ Officiel                                                                                        |
| Recherche                           | **MeiliSearch** via `@rokmohar/medusa-plugin-meilisearch`                | ✅ Communautaire actif, v2 only                                                                    |
| Email transac                       | **Resend + React Email**                                                 | ✅ Notification provider custom (guide officiel)                                                   |
| Email marketing                     | **Brevo**                                                                | Sync via API depuis backend                                                                        |
| Cache / Event bus / Workflow engine | **Redis 7**                                                              | ✅ Adaptateurs Medusa officiels                                                                    |
| Analytics                           | **Plausible**                                                            | Script JS, RGPD-friendly, sans bandeau                                                             |
| Erreurs                             | **Sentry**                                                               | `@sentry/nextjs` + `@sentry/node`                                                                  |
| Hébergement                         | Storefront → **Vercel** ; Backend → **Railway** ou **Hetzner + Coolify** | À arbitrer Phase 13                                                                                |
| CMS additionnel                     | Aucun (le module `pages` interne suffit)                                 | Évite Sanity/Strapi qui doublonneraient                                                            |

### Outillage Phase 0

- **Docker Compose dev** : `postgres:16-alpine`, `redis:7-alpine`, `minio` (S3 local sur :9100/:9101), `meilisearch:v1.11`.
- **ESLint flat config** strict (typescript-eslint strict + import-x + jsx-a11y + react + react-hooks + @next/eslint-plugin-next), partagée à la racine.
- **Prettier** racine (`arrowParens: always`, `semi: false`, double quotes — préférences héritées du storefront).
- **Husky** + **lint-staged** + **commitlint** : pre-commit auto-format + lint, commit-msg conventional.
- **CI GitHub Actions** baseline : install + typecheck + lint + build.

### Plugin Pilot AI (`medusa-ai-assistant`) — projet isolé

Le plugin Pilot AI est développé dans un **workspace séparé** (cf. `docs/pilot-ai/` pour la vision produit). Il **n'est pas** dépendance du backend Lehena en refonte. Aucune référence à `medusa-ai-assistant`, `yalc`, ou `@anthropic-ai/sdk` ne subsiste dans ce repo. Quand le plugin sera prêt pour usage réel, il sera publié comme package npm (privé sur GHCR ou public) et ajouté proprement en dépendance — pas via yalc.

## Alternatives considérées

### Paiement

- **Stripe-only sans Alma** — écarté : l'épicerie premium FR convertit beaucoup mieux avec un paiement 3x sans frais. Alma est la norme. On accepte le custom dev.
- **Mollie** au lieu de Stripe — écarté : Stripe est plus stable côté Apple/Google Pay et la communauté Medusa v2 a plus de retours.

### Recherche

- **Algolia** — meilleur produit mais facture vite (~80€/mois dès 100k requêtes/mois). MeiliSearch couvre 95% du besoin pour 0€ self-hosted.
- **Postgres `pg_trgm`** seul — pas de typo-tolérance solide, pas de facettes performantes. Écarté.

### Email

- **SendGrid / Mailgun** — historique, deliverability OK. Resend gagne en DX (React Email), meilleur prix sur le volume Lehena projeté (<10k mails/mois).
- **Mailpit local** au lieu de Resend en dev — pas en Phase 0 ; Medusa a un `local notification provider` qui logue, suffisant pour Phase 0-6.

### Multilingue

- **next-intl** vs **next-i18next** — décision reportée à Phase 4 (CMS multi-locale). Pas de choix en Phase 0.

## Conséquences

### Positives

- Stack 100 % open-source ou avec free tiers, RGPD-friendly (Plausible, Scaleway, Resend, Brevo, hébergement FR).
- Trajet bien balisé : tous les composants officiels ou communautaires sont identifiés.
- Aucun lock-in fort (Stripe étant l'exception bénigne).

### Négatives / dettes

- **Alma / Chronofresh / Colissimo / Resend** nécessitent du code custom. ~4-6 jours dev cumulés en Phase 5 et 7.
- **Plugin Pilot AI** maintient une dépendance non-publique → friction CI tant qu'il n'est pas publié (mitigée par le stub).

### Suivi

- **Avant Phase 5** : Paul confirme l'accès API Chronofresh ; on tranche Alma custom vs hosted link.
- **Avant Phase 14** : SLO hébergement choisi ; cible Lighthouse atteinte ou plan B.
- Cet ADR est **revisité à 6 mois post-mise en ligne** ; renumérote en super-ADR si la stack change matériellement.
