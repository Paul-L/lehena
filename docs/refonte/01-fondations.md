# Phase 0 — Fondations

## Objectif de cette passe

Verrouiller la stack, préparer l'environnement de travail (Docker, CI, ADRs)
**sans** écrire de code applicatif. C'est de l'audit + de la mise en place
infra-projet. À la fin, `pnpm dev` boot l'ensemble (backend + storefront +
Postgres + Redis + S3 local + MeiliSearch) et la CI passe sur une PR vide.

> Cette passe ne livre **aucune feature utilisateur**. Si tu es pressé de
> voir du résultat visuel, c'est normal de trouver ça frustrant — résiste à
> l'envie de skipper. Ce qui se joue ici conditionne la propreté de tout
> le reste.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 0 — Fondations** de la refonte Lehena. Avant tout,
lis dans cet ordre :

1. `docs/refonte/00-PLAN.md` (sections 1 à 3) — le plan global et les fils rouges transverses
2. `docs/refonte/audit-site-actuel.md` — l'état de l'ancien site
3. `docs/refonte/strategie-seo.md` (sections 1 à 4) — la doctrine SEO

Confirme-moi que tu as lu ces 3 documents avant de commencer.

## Étape 1 — Reconnaissance du repo

Explore le monorepo et réponds par un tableau récapitulatif :
- Versions installées : Medusa, Next.js, React, TypeScript, pnpm, Turbo.
- Liste des modules custom déjà présents dans `apps/backend/src/modules/`.
- Liste des composants Lehena déjà présents côté storefront
  (`apps/storefront/src/modules/**/lehena*`, `**/lehena-*`).
- État du fichier `apps/backend/medusa-config.ts` : modules activés,
  providers (file, payment, fulfillment, notification) déjà configurés ou non.
- Est-ce qu'il y a déjà : un `docker-compose.yml` ? un `.env.example` ? une CI
  GitHub Actions / Gitlab CI ? un `.husky/` ? une config ESLint / Prettier
  partagée ?

## Étape 2 — Validation de la stack (à valider avec moi avant tout code)

Le plan propose la stack suivante (cf. `00-PLAN.md` § 2). Pour chaque ligne,
confirme la faisabilité et flagge tout point qui pose problème (module
indisponible, version, complexité de mise en œuvre) :

- Paiement : Stripe (officiel Medusa) + Alma (module communautaire — vérifie
  qu'il existe bien pour Medusa v2.14, et identifie le repo).
- Livraison : Chronofresh + Colissimo (probablement à coder en custom
  fulfillment provider — vérifie ce qui existe).
- Recherche : MeiliSearch self-hosted (existe-t-il un plugin Medusa officiel
  ou faut-il indexer manuellement via subscriber ?).
- Email transac : Resend (pas de module officiel Medusa AFAIK, à coder en
  notification provider custom).
- Stockage médias : Scaleway Object Storage via le module Medusa S3.
- Cache/Queue : Redis (Upstash hébergé pour la prod, local en Docker pour le dev).
- Analytics : Plausible (script léger, snippet à placer dans le layout Next).
- Erreurs : Sentry (front + back).
- Hébergement : Vercel (front) + Railway ou Hetzner+Coolify (back) à
  arbitrer en Phase 13.

Pour chaque point bloquant, propose une alternative.

## Étape 3 — Plan de la Phase 0 (à valider)

Sur la base de tes findings, propose-moi le plan détaillé des livrables de
cette phase (ne code rien encore). Mon attendu minimal :

a. **Docker Compose dev local** (`docker-compose.dev.yml` à la racine) :
   - Postgres 16
   - Redis 7
   - MinIO (S3 local)
   - MeiliSearch
   - Volumes persistants nommés
   - Healthchecks
   - Variables alignées sur `.env.example`

b. **`.env.example` exhaustifs** :
   - `apps/backend/.env.example` : DATABASE_URL, REDIS_URL, S3_*, MEILISEARCH_*,
     STRIPE_*, RESEND_*, JWT_SECRET, COOKIE_SECRET, *_CORS, etc.
   - `apps/storefront/.env.example` : NEXT_PUBLIC_*, secrets serveur.
   - Chaque variable a un commentaire d'une ligne expliquant son rôle.

c. **Tooling commun** :
   - ESLint + Prettier partagés à la racine (config héritée par chaque app).
   - lint-staged + Husky pour pre-commit.
   - `commitlint` pour les commits conventionnels.
   - Script `pnpm typecheck` qui couvre les deux apps.

d. **CI minimum** (`.github/workflows/ci.yml`) :
   - Trigger : PR vers `main` et `develop`.
   - Jobs : install + typecheck + lint + build (backend + storefront).
   - Cache pnpm.
   - **Pas** de tests E2E ici (Phase 13).

e. **Branching model documenté** dans `docs/refonte/branching.md` :
   - `main` = prod, `develop` = staging, `feat/phase-XX-<slug>` = features.
   - PR template `.github/pull_request_template.md`.

f. **ADR template + 2 premiers ADRs** dans `docs/refonte/adr/` :
   - `ADR-001-stack-technique.md` (résumé des choix Phase 0)
   - `ADR-002-monorepo-pnpm-turborepo.md` (pourquoi conserver ce setup)

g. **README projet à jour** : ajouter une section "Setup dev local" qui pointe
   sur `docker-compose.dev.yml`.

Une fois ce plan validé par moi, tu peux commencer à coder.

## Étape 4 — Implémentation (après validation du plan)

- Travaille sur la branche `feat/phase-0-fondations`.
- Commits conventionnels granulaires :
  `chore(infra): add docker-compose dev`,
  `chore(ci): add github actions baseline`,
  `chore(lint): add eslint+prettier shared config`,
  `docs(refonte): add ADRs 001 and 002`, etc.
- À la fin, ouvre une PR avec une description claire et la checklist
  ci-dessous cochée.

## Contraintes globales (rappel)

- TypeScript strict, zéro `any`.
- Aucun secret en clair dans les fichiers commités.
- Documentation à jour à chaque commit qui ajoute une dépendance externe.
- Aucun code applicatif (controllers, services, composants) dans cette phase :
  uniquement infra + tooling + docs.

## Ce que tu NE fais PAS dans cette phase

- Pas de modèle de données.
- Pas de modification de modules existants (CMS Pages reste tel quel).
- Pas de configuration Stripe/Resend/etc. en mode "ça marche" — on déclare
  juste les variables, on les branche en Phase 1+.
- Pas de déploiement production / staging — c'est la Phase 13.

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Tableau récapitulatif du repo livré et compris (étape 1).
- [ ] Stack confirmée ligne à ligne, alternatives identifiées si bloquant (étape 2).
- [ ] `docker-compose.dev.yml` boot proprement les 5 services :
      `docker compose -f docker-compose.dev.yml up` puis `curl` sur chaque healthcheck.
- [ ] `.env.example` exhaustifs côté backend ET storefront, avec commentaires.
- [ ] `pnpm install && pnpm dev` boot backend + storefront sans erreur.
- [ ] `pnpm typecheck` et `pnpm lint` passent sur le repo entier.
- [ ] CI verte sur une PR vide (créer une PR de validation après le merge de cette phase).
- [ ] Husky + lint-staged + commitlint actifs (test : tenter un commit non conventionnel doit échouer).
- [ ] ADRs 001 et 002 rédigés et lisibles.
- [ ] PR template présent.
- [ ] README mis à jour, section "Setup dev local" fonctionnelle.

## Pièges courants

- **`.env.example` qui dérive de `.env` réel** : vérifie qu'aucun vrai
  secret n'a fuité (regarde le diff).
- **Husky qui ne s'installe pas en monorepo pnpm** : il faut un `prepare`
  script dans le `package.json` racine.
- **MeiliSearch v1.x vs v1.10+** : la v1.10 est plus stable pour les facettes,
  vérifier la version utilisée.
- **MinIO et Medusa S3** : MinIO en local impose `MINIO_USE_PATH_STYLE=true`
  côté config S3, sinon les uploads échouent silencieusement.

## Commit final

Branche : `feat/phase-0-fondations`.
Commit de fin :
`chore(phase-0): foundations — docker compose dev, CI, lint, husky, ADRs`.
PR vers `develop`.
