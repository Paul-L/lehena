# Refonte Lehena — Série de prompts Claude Code

Cette série découpe la refonte complète de [lehena.fr](https://lehena.fr)
vers Medusa v2 + Next.js 15 en passes indépendantes et vérifiables, à
copier-coller dans Claude Code une par une.

> Avant de copier le moindre prompt, **lis** dans l'ordre :
> 1. [`00-PLAN.md`](./00-PLAN.md) — le plan global et les fils rouges transverses
> 2. [`audit-site-actuel.md`](./audit-site-actuel.md) — l'état des lieux objectif de l'ancien site
> 3. [`strategie-seo.md`](./strategie-seo.md) — la doctrine SEO transverse
>
> Ces 3 documents sont **référencés en tête de chaque prompt**. Claude Code les
> lira systématiquement. Ne les modifie pas sans répercuter dans les prompts.

---

## Pourquoi découper ?

Un seul gros prompt qui demande "fais-moi la refonte" donne du code mou,
sans focus, non testé. En découpant en passes :

- Claude Code garde le focus sur **un livrable testable** à la fois.
- Tu valides chaque brique avant d'enchaîner.
- Si une passe part en vrille, tu corriges *avant* qu'elle pollue les suivantes.
- Tu peux mettre la refonte en pause / reprendre sans perdre de contexte.

---

## Ordre d'exécution

| # | Fichier | Phase | Objectif | Durée estimée |
|---|---------|-------|----------|---------------|
| 0 | [`README.md`](./README.md) | — | Ce fichier | — |
| 1 | [`01-fondations.md`](./01-fondations.md) | Phase 0 | Audit, stack, docker-compose dev, CI, ADRs | ~5 j |
| 2 | [`02-modele-metier.md`](./02-modele-metier.md) | Phase 1 | Modélisation catalogue charcuterie + custom fields + régions/taxes/livraison | ~8 j |
| 3 | [`03-storefront-ossature.md`](./03-storefront-ossature.md) | Phase 2 | Header/footer/design-system + complétion home + brief copywriting + SEO embarqué | ~8 j |
| 4 | [`04-pdp-listings-recherche.md`](./04-pdp-listings-recherche.md) | Phase 3 | PDP Lehena, catégories avec filtres facettes, MeiliSearch, schemas SEO | ~10 j |
| 5 | [`05-cms-finalisation.md`](./05-cms-finalisation.md) | Phase 4 | Termine la série CMS, étend nodes TipTap, embed produit, multilingue | ~6 j |
| 6 | [`06-checkout-paiement.md`](./06-checkout-paiement.md) | Phase 5 | Tunnel checkout 3 étapes, Stripe + Alma, Chronofresh + Colissimo | ~8 j |
| 7 | [`07-comptes-client.md`](./07-comptes-client.md) | Phase 6 | Auth (password + magic link), espace client, wishlist, RGPD | ~5 j |
| 8 | [`08-emails.md`](./08-emails.md) | Phase 7 | Templates React Email Resend + sync Brevo | ~4 j |
| 9 | [`09-migration.md`](./09-migration.md) | Phase 8 | Scripts d'import produits/médias/clients, table redirects 301 | ~6 j |
| 10 | [`10-seo-content-local.md`](./10-seo-content-local.md) | Phase 9 | Audit SEO final + 6 pages piliers + ~30 articles + page atelier + GBP | ~8 j |
| 11 | [`11-admin-metier.md`](./11-admin-metier.md) | Phase 10 | Widgets admin Lehena, module recettes, module avis, alerte DDM/stock | ~5 j |
| 12 | [`12-abonnements.md`](./12-abonnements.md) | Phase 11 (opt) | Module subscription, paiement récurrent Stripe, espace client | ~6 j |
| 13 | [`13-analytics-monitoring.md`](./13-analytics-monitoring.md) | Phase 12 | Plausible events, Sentry, logs structurés, healthchecks | ~3 j |
| 14 | [`14-devops-tests.md`](./14-devops-tests.md) | Phase 13 | Dockerfiles, CI/CD complète, Playwright E2E, backups | ~5 j |
| 15 | [`15-recette-bascule.md`](./15-recette-bascule.md) | Phase 14 | Recette QA, bêta privée, bascule DNS, monitoring J0/J+7 | ~5 j |

**Effort total estimé** : ~92 j-h (sans Phase 11) ou ~98 j-h (avec).

---

## Prérequis avant la première passe

1. Tu as lu `00-PLAN.md`, `audit-site-actuel.md`, `strategie-seo.md`.
2. Tu disposes des accès :
   - Repo Git (Github/Gitlab)
   - Compte Vercel (storefront) + compte Railway/Hetzner (backend)
   - Compte Stripe (mode test au minimum)
   - Compte Resend (transactionnel)
   - Compte Scaleway (S3 + DB Postgres si on choisit cette option)
   - Accès au site actuel : Search Console, Google Analytics, GBP, hébergeur
   - Contact agence Inovesign pour récupérer les exports si possible
3. Tu as une grille tarifaire **Chronofresh** (tarifs réels par poids/zone) — cf. risque P5.
4. Tu as identifié un **copywriter** (interne ou freelance) pour produire les piliers et articles SEO en parallèle du dev.
5. Claude Code installé et configuré sur le workspace `/Users/paul/Apps/Lehena`.

---

## Comment utiliser chaque prompt

1. Ouvre Claude Code dans le workspace Lehena.
2. **Vérifie d'abord** que tu es sur la bonne branche Git (`feat/phase-XX-...`).
3. Copie-colle le contenu du prompt en commençant par `01-fondations.md`.
4. **Laisse Claude poser ses questions de clarification** avant qu'il code — chaque prompt est conçu pour qu'il en pose, ne le bypass pas.
5. Valide ses choix techniques, puis dis-lui de procéder.
6. À la fin de la passe, **teste** ce qu'il a livré (la passe contient une checklist).
7. Si quelque chose cloche, demande-lui de corriger AVANT d'enchaîner.
8. Commit conventionnel de fin de passe (`feat(phase-XX): ...`).

---

## Conventions globales (rappelées dans chaque prompt)

- **TypeScript strict** partout, zéro `any`, types exhaustifs.
- **Validation zod** sur TOUS les inputs API (admin et store).
- **Erreurs** : `MedusaError` avec les bons types côté backend, `notFound()` / `redirect()` Next côté front.
- **Workflows Medusa** pour toute opération à effets de bord (publication, paiement, expédition, etc.).
- **Pas de logique métier dans les routes API** : tout passe par service ou workflow.
- **Server Components** par défaut côté Next, Client uniquement si interactif.
- **SEO embarqué dès la conception** (cf. checklist par phase dans `strategie-seo.md` § 11).
- **Accessibilité** vérifiée à chaque PR (axe-core en CI à partir de Phase 13).
- **Commits conventionnels** : `feat(scope): ...`, `fix(scope): ...`.
- **Branches** : `feat/phase-XX-<slug>` → PR vers `develop` → merge `main` après recette.
- **README** à jour à chaque phase qui ajoute une fonctionnalité majeure.
- **ADRs** dans `docs/refonte/adr/` pour les choix structurants.

---

## Variables d'environnement

À maintenir dans `.env.example` au fur et à mesure des passes. Les passes
qui ajoutent une dépendance externe (Stripe, Resend, MeiliSearch, etc.)
sont responsables d'ajouter leurs variables et de les documenter.

Liste tenue à jour dans `apps/backend/.env.example` et
`apps/storefront/.env.example` — référence canonique.

---

## Si Claude Code part en vrille sur une passe

1. **Stoppe-le.**
2. Demande : "Résume ce que tu as fait, ce qui ne marche pas, et pourquoi tu penses que ça ne marche pas."
3. Reformule la passe avec plus de contraintes (`ne touche pas aux fichiers X et Y, focus uniquement sur Z`).
4. Au pire, reset la passe (`git reset --hard <hash>`) et recommence avec un prompt affiné.
5. Si tu reformules, **écris ton ajout dans le fichier de prompt** : la prochaine fois que tu lances la passe (ou si quelqu'un d'autre le fait), il bénéficiera de ta correction.
