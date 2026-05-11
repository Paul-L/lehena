# Phase 13 — DevOps, CI/CD, tests E2E

## Objectif de cette passe

Industrialiser : Dockerfiles backend + storefront, CI complète (lint +
typecheck + tests + build + scan dépendances + Lighthouse CI), déploiement
automatisé (preview Vercel + staging Railway), backups Postgres, tests E2E
Playwright sur le parcours critique.

C'est la phase qui rend la prod **opérable** par l'équipe sans avoir à
maintenir des scripts bash improvisés.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 13 — DevOps & tests** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 13 § 3)
2. `docs/refonte/branching.md` (Phase 0 si rédigé)
3. Doc Playwright : https://playwright.dev/

Confirme avoir lu.

## Étape 1 — Reconnaissance

- État actuel de la CI (`.github/workflows/` créé en Phase 0) : que fait-elle ?
- Y a-t-il des Dockerfiles ? Si oui, à quel stade.
- Quel est l'historique de déploiement actuel (manuel ? Vercel auto ?).
- Y a-t-il des tests E2E ?

## Étape 2 — Choix techniques à valider

a. **Dockerfiles** :
   - Backend : multi-stage avec `node:20-alpine`, install pnpm, build Medusa,
     image finale `< 500 Mo`. Health check Docker.
   - Storefront : multi-stage avec `node:20-alpine`, build Next, output
     standalone, image finale `< 200 Mo`.
   - `.dockerignore` strict.

b. **Hébergement (arbitrage final)** :
   - Storefront → **Vercel** (déploiement direct git, edge, preview par PR).
   - Backend → **Railway** (rapide à brancher, autoscale Postgres + Redis +
     backend dans un projet unique) ou **Hetzner + Coolify** (moins cher mais
     plus de maintenance). Choix à valider avec Paul selon préférence
     infra et budget.
   - Stockage médias : Scaleway Object Storage (déjà calé Phase 0).

c. **CI complète** (`.github/workflows/`) :
   - `ci.yml` (déjà Phase 0, à étoffer) :
     - Install pnpm
     - Typecheck
     - Lint
     - Tests unitaires backend (`pnpm test:unit`)
     - Build backend
     - Build storefront
     - `pnpm audit` (audit deps, échec si CVE critique)
   - `e2e.yml` :
     - Run Playwright sur preview Vercel deployée.
     - Skip si seuls les docs sont modifiés.
   - `lighthouse.yml` :
     - Run Lighthouse CI sur 5 templates clés (home, catégorie, PDP, article,
       atelier).
     - Seuils Phase 9.

d. **Déploiement** :
   - Vercel : connecté à `main` (prod) et `develop` (preview staging).
   - Railway : déploiement auto sur push `develop` (staging) et `main` (prod
     avec approval manuel).
   - Migrations Medusa : exécutées en step pre-deploy.

e. **Backups Postgres** :
   - Railway : backup automatique quotidien, rétention 7 jours. Activé +
     vérifier un restore test.
   - Snapshot manuel en plus avant chaque déploiement prod risqué.
   - Test de restauration trimestriel documenté.

f. **Tests E2E Playwright** :
   - Parcours critique : home → catégorie → PDP → ajout panier → checkout
     (Stripe test) → confirmation.
   - 1 test "happy path", 1 test "carte refusée".
   - Run en CI sur preview Vercel.
   - Captures d'écran sauvegardées en artifact en cas d'échec.

g. **Tests d'intégration backend** :
   - Étoffer ceux du starter Medusa : un test par route admin / store
     critique (auth, checkout, wishlist, reviews, redirects, subscriptions).

h. **Secrets management** :
   - GitHub Secrets pour la CI.
   - Vercel env variables : prod / preview / dev séparés.
   - Railway env variables idem.
   - **Rotation** : documenter dans `docs/refonte/secrets-rotation.md` quand
     et comment tourner chaque secret.

## Étape 3 — Plan détaillé

7-9 sous-passes :

- A : Dockerfile backend + Dockerfile storefront + .dockerignore.
- B : CI étoffée (typecheck + lint + tests + build + audit).
- C : Lighthouse CI workflow.
- D : Playwright E2E (happy path + carte refusée).
- E : Configuration Vercel (prod + preview).
- F : Configuration Railway/Hetzner (selon arbitrage).
- G : Backups + test restore documentés.
- H : Secrets documentés + rotation.
- I : Documentation déploiement dans `docs/refonte/deploy.md`.

## Étape 4 — Implémentation

- Branche `feat/phase-13-devops`.
- Tester chaque pipeline en lançant manuellement sur une PR test.
- Tester un déploiement complet de bout en bout sur staging.

## Contraintes (rappel)

- Aucun secret commité.
- Build reproductible (lockfile pnpm respecté).
- Migrations idempotentes obligatoires.
- Restauration de backup testée AU MOINS UNE FOIS sur staging.

## Ce que tu NE fais PAS

- Pas de Kubernetes (overkill V1).
- Pas de canary deployment (V2).
- Pas de blue/green (V2 — sauf si on bascule prod avec un risque élevé en
  Phase 14, à arbitrer).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] CI verte sur une PR test, tous les jobs passent.
- [ ] Lighthouse CI bloque une PR qui dégrade un seuil.
- [ ] Playwright happy path passe sur preview Vercel.
- [ ] Playwright carte refusée passe (gestion d'erreur correcte).
- [ ] Un push sur `develop` déploie automatiquement sur staging Vercel +
      Railway.
- [ ] Un push sur `main` déclenche le déploiement prod (avec approval manuel).
- [ ] Backup Postgres quotidien actif. Test restore documenté avec
      timestamps.
- [ ] `docs/refonte/deploy.md` rédigé et suivable par un humain non technique.
- [ ] `docs/refonte/secrets-rotation.md` rédigé.

## Pièges courants

- **pnpm dans Docker** : `corepack enable` avant `pnpm install` sinon
  pnpm pas disponible.
- **Vercel + monorepo pnpm** : configurer le "Root Directory" sur
  `apps/storefront` et les commandes build/install adaptées.
- **Sentry sourcemaps en CI** : oublier l'auth token Sentry casse le build.
- **Playwright en CI** : besoin de Chromium + worker count à régler selon
  CPU GH Actions.
- **Backups testés ? ** : un backup non testé n'est PAS un backup.
- **Migrations Medusa au déploiement** : si elles échouent, le déploiement
  doit rollback automatiquement, pas continuer.

## Commit final

Branche : `feat/phase-13-devops`.
Commit : `feat(devops): dockerfiles, ci/cd, playwright e2e, backups, secrets docs`.
