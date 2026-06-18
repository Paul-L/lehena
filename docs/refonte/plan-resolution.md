# Plan de résolution — Refonte Lehena (WooCommerce → Medusa)

> Établi le 2026-06-18, après comparaison du WooCommerce live (`lehena.fr`) avec le storefront Medusa local (`localhost:8000` / API `localhost:9000`).

## Décisions cadres (verrouillées)

1. **Catalogue cible = Import fidèle WooCommerce.** Le catalogue Medusa actuel (16 produits) est une ré-écriture éditoriale curatée (seed démo) — il est **abandonné**. On exécute le pipeline de migration contre le WC live → 18 produits publiés repris tels quels, puis nettoyage. **Conséquence assumée :** perte du storytelling terroir / affinages / races AOC / structure « Format » curatée du seed.
2. **Périmètre V1 = France d'abord.** Vente et livraison France uniquement (parité avec l'actuel). UE (26 pays) + Monde (9 pays) → **backlog Phase 2** (TVA OSS/IOSS, API transporteurs internationales).

## Constat de départ (rappel)

- WooCommerce : **18 produits publiés** (+21 brouillons abandonnés), **France/EUR uniquement**, 3 comptes (tous admins → checkout invité, pas de base clients), **981 articles + 18 pages** (Avada), Stripe **déconnecté**.
- Medusa : **16 produits de seed démo** servis par l'API → **la vraie migration n'a jamais été exécutée**. Infra par ailleurs avancée (module CMS Pages, blog/recettes scaffoldé, i18n FR/ES/EN, framework Promotions, stub newsletter, provider pickup `manual_manual` déjà lié).

---

# Phases du plan

Priorités : **P0** = bloquant lancement · **P1** = fast-follow (jours qui suivent) · **P2** = ultérieur.

---

## Phase 0 — Prérequis & accès (P0)

**Objectif :** réunir tout ce qui débloque l'exécution.

**Actions**

- [ ] **Clés API WooCommerce REST** (lecture) : WP-admin → WooCommerce → Avancé → API REST → créer une clé. Récupérer `consumer_key` / `consumer_secret`.
- [ ] **Compte Stripe** opérationnel (le WC actuel est déconnecté) : clé secrète live + webhook secret.
- [ ] **Accès rôle administrateur complet** sur WP : le compte « technique » utilisé est **refusé sur Commandes et Utilisateurs** → indispensable pour chiffrer/reprendre l'historique commandes.
- [ ] **Accès prod Medusa** : DB Postgres + bucket S3 (Scaleway/MinIO), `.env.production`.
- [ ] **Sauvegarde** Postgres + S3 avant toute écriture.

**Variables d'environnement à renseigner** (`apps/backend/.env.production`)

```bash
WC_API_URL=https://lehena.fr
WC_API_CONSUMER_KEY=ck_xxx
WC_API_CONSUMER_SECRET=cs_xxx
# S3 / médias
S3_ENDPOINT=...   S3_REGION=...   S3_BUCKET=...   S3_FILE_URL=...
S3_ACCESS_KEY_ID=...   S3_SECRET_ACCESS_KEY=...   S3_FORCE_PATH_STYLE=true
# Paiement
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> ⚠️ Confirmer les noms exacts des variables et les flags CLI dans `docs/refonte/migration-runbook.md`, `apps/backend/.env.example` et `apps/backend/package.json` avant exécution.

**Critère d'acceptation :** `curl -u "$KEY:$SECRET" "https://lehena.fr/wp-json/wc/v3/products?per_page=1"` renvoie un produit (pas de 401).

---

## Phase 1 — Catalogue : import fidèle (P0) — _cœur du chantier_

**Objectif :** remplacer les 16 produits démo par les 18 produits WC réels.

### 1a. Purger le seed démo

- [ ] Supprimer les 16 produits de seed (sinon coexistence 16 + 18 = doublons ; l'idempotence se fait par `handle`, pas d'upsert).
- Pas de script de purge fourni → SQL ciblé sur les handles du seed (`src/scripts/seed/products/data.ts`), cascade sur variantes/inventaire. **À faire sur une DB sauvegardée.**

### 1b. Dry-run (obligatoire avant commit)

Tous les scripts sont **dry-run par défaut** ; `--commit` déclenche les écritures. Rapports → `apps/backend/migration-reports/`.

```bash
cd apps/backend
pnpm medusa exec ./src/scripts/migrate-media.ts     -- --source=api
pnpm medusa exec ./src/scripts/migrate-products.ts  -- --source=api
pnpm medusa exec ./src/scripts/build-redirects.ts   -- --source=api
```

- [ ] **Valider le rapport produits** : `totals.created = 18`, `failed = 0`.
- [ ] **Vérifier le mapping catégories** (règles regex dans `src/migration/mappers/product.ts`). Points de vigilance connus :
  - « Notre épicerie » (Navarin/Tajine/Saucisses = **plats**) risque de tomber dans la catégorie par défaut au lieu de **Plats cuisinés**.
  - « Aérateur pour vin ou patxaran » (un **accessoire**) contient « patxaran » → risque de mapping vers Patxaran. À reclasser.
  - Planche / Support → bien forcés en **Accessoires**.

### 1c. Commit (ordre impératif : Médias → Produits)

```bash
pnpm medusa exec ./src/scripts/migrate-media.ts    -- --source=api --commit
pnpm medusa exec ./src/scripts/migrate-products.ts -- --source=api --commit
```

> Note technique : le mapper conserve les URLs légales dans `legacy_image_sources`. Vérifier que les images produits pointent bien vers le **S3** après coup (sinon étape de réécriture d'URL à prévoir).

### 1d. Nettoyage post-import (manuel, P0/P1)

L'import fidèle reprend les **défauts** de WC → passe de nettoyage :

- [ ] **Titres** : retirer les mentions parasites (« (promo: tranchage et sous vide gratuits) », « (environ 3,0kg) », « (Copie) »…).
- [ ] **Catégories** mal mappées (cf. 1b).
- [ ] **Brouillons** : décider lesquels publier (Piment d'Espelette, moutarde, miel, Pimientos, tomates séchées, Axoa, vins Domaine Guillemas…). Tant qu'ils restent brouillons, **la catégorie « Épicerie fine » du storefront reste vide**.
- [ ] **Filtres storefront** (Affinage / Race / Origine / Format) : alimentés par `product_details`/`variant_details`. Les produits WC n'ont probablement **pas** ces champs ACF → filtres quasi vides après import. **Enrichissement éditorial à planifier** (P1) si l'on veut conserver ces filtres, sinon les masquer.

**Critère d'acceptation :** 18 fiches produits accessibles, prix justes (= WC), images sur S3, catégories cohérentes, panier → checkout fonctionnel sur un produit frais et un ambiant.

---

## Phase 2 — Paiement Stripe (P0)

**Objectif :** encaisser des CB (Stripe est le seul moyen de paiement, cassé partout aujourd'hui).

**Actions**

- [ ] Renseigner `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` (le provider Stripe est déjà câblé conditionnellement dans `medusa-config.ts`, `capture: true`).
- [ ] Configurer l'endpoint webhook Stripe vers le backend Medusa.
- [ ] Test bout-en-bout : commande réelle en mode test, puis 1 transaction live de validation (puis remboursement).

**Critère d'acceptation :** une commande CB aboutit, paiement capturé, webhook reçu, statut commande OK.

---

## Phase 3 — Transport (P0 + P1)

**Objectif :** parité France + ajout du retrait sur place.

**État :** Chronofresh + Colissimo configurés (grilles au poids, franco 50€) en **mode mock V1**. Stock location « Boutique Lehena » (Laguinge 64470). Provider `manual_manual` **déjà lié** mais aucune option pickup créée.

**Actions**

- [ ] **P0 — Ajouter l'option « Retrait au séchoir »** (présente en WC, absente en Medusa) : nouvelle shipping option `price_type: fixed`/0€, provider `manual_manual`, zone FR — dans `src/scripts/seed/fulfillment.ts` (suivre le pattern des options existantes), + **UI storefront** séparant retrait et livraison.
- [ ] **P0 — Vérifier les grilles tarifaires** Chronofresh/Colissimo France vs réalité commerciale (cf. `src/modules/fulfillment-*/pricing.ts`).
- [ ] **P1 — Brancher les vraies API transporteurs** (génération d'étiquettes/tracking) : `CHRONOFRESH_*` / `COLISSIMO_*`. Sinon traitement manuel des expéditions au lancement (acceptable V1).

**Critère d'acceptation :** au checkout FR, un panier ambiant propose Colissimo + Retrait ; un panier frais/mixte propose Chronofresh ; franco 50€ appliqué.

---

## Phase 4 — TVA & périmètre France-only (P0)

**Objectif :** verrouiller le périmètre France pour V1.

**État :** TVA FR **déjà faite** (5,5% alimentaire / 20% accessoire, par `product_type`). Régions FR + UE + Monde existent ; **UE/Monde sans taux** (0% / défaut système).

**Actions (France d'abord)**

- [ ] **Restreindre la vente à la France** : ne pas exposer les régions UE/Monde au storefront pour V1 (garder uniquement `/fr` ; différer `/es` et `/en`).
- [ ] Confirmer que la TVA FR s'applique correctement aux 18 produits importés (les accessoires — planche, support, couteau, aérateur — doivent être en `product_type = accessoire` → 20%).
- [ ] _(Backlog Phase 2)_ taux TVA UE/Monde + OSS/IOSS.

**Critère d'acceptation :** TVA correcte sur facture pour un produit alimentaire et un accessoire ; checkout hors-France indisponible.

---

## Phase 5 — Contenu & mentions légales (P0 + P1)

**Objectif :** pages légales valides et infos société réelles.

**État :** module CMS **Pages** opérationnel ; pages seedées (Notre histoire, Atelier, FAQ, Livraison, CGV, Mentions légales, Confidentialité, Contact). **CGV et Confidentialité = placeholders.** Footer affiche « SIRET à venir · TVA FR à venir » (en dur : `apps/storefront/src/modules/layout/templates/footer/index.tsx`).

**Actions**

- [ ] **P0 — CGV** : contenu juridique réel (obligatoire pour vendre).
- [ ] **P0 — Politique de confidentialité** : contenu réel (RGPD).
- [ ] **P0 — Infos société** : remplacer les placeholders (SIRET, TVA FR, raison sociale, capital, RCS) dans le footer + page Mentions légales (`apps/backend/src/scripts/seed-pages.ts`). Recommandé : créer un fichier de constantes société piloté par env plutôt que des chaînes en dur.
- [ ] **P1 — Relecture** des autres pages (Notre histoire, Atelier, Livraison & retours, FAQ).

**Critère d'acceptation :** CGV + Confidentialité complètes ; aucune mention « à venir » ; SIRET/TVA réels affichés.

---

## Phase 6 — SEO & redirections / blog (P1)

**Objectif :** préserver le référencement (gros actif : 981 articles).

**État :** `build-redirects.ts` génère les 301 (pages statiques + produits + catégories). Le storefront a l'infra blog (types `article`/`recipe`/`news`, routes `/recettes/[slug]`, sitemap articles) mais **0 article importé**.

**Actions**

- [ ] **P0/P1 — Lancer les redirections** : `pnpm medusa exec ./src/scripts/build-redirects.ts -- --source=api --commit` puis vérifier un échantillon (301 OK).
- [ ] **P1 — Stratégie 981 articles** : décider import (vers le module Pages, type `article`/`recipe`) **ou** redirections 301 vers les pages équivalentes. Un blog vide = perte de trafic SEO → trancher avant/juste après bascule.
- [ ] **P1 — Vérifier** sitemaps + balises hreflang (FR uniquement en V1).

**Critère d'acceptation :** anciennes URLs produits/catégories → 301 vers les nouvelles ; plan d'action documenté pour les articles.

---

## Phase 7 — Newsletter / ESP (P1)

**État :** formulaire footer fonctionnel mais l'API `/api/newsletter` **ne fait que logguer** (stub V1) ; intégration **Brevo prévue Phase 7** (cf. ADR-001). WP utilisait MailPoet.

**Actions**

- [ ] Brancher l'ESP (Brevo) : persistance + double opt-in.
- [ ] **Importer/migrer la liste d'abonnés** MailPoet (export WP → import ESP), avec base légale RGPD.

**Critère d'acceptation :** une inscription crée bien un contact ESP ; liste historique reprise.

---

## Phase 8 — Promotions / codes promo (P2)

**État :** module Promotions Medusa présent, **0 promo seedée** ; checkout storefront supporte déjà les codes (`discount-code`). WC avait les codes promo activés.

**Actions**

- [ ] Recréer les codes promo actifs en cours (le cas échéant) via l'admin Medusa.
- [ ] Définir la politique promo de lancement (ex. code de bienvenue).

**Critère d'acceptation :** un code promo s'applique au panier.

---

## Phase 9 — Clients & historique commandes (P1)

**État :** WP = 3 comptes admins seulement (checkout invité) → **pas de base de comptes clients à migrer**. La donnée client réelle vit dans les **commandes** (accès refusé au rôle « technique »).

**Actions**

- [ ] **P0 (prérequis) — Accès admin complet WP** pour quantifier commandes/clients.
- [ ] `migrate-customers.ts` : utile surtout si l'on reprend les contacts depuis l'export commandes/clients WC (dry-run puis `--commit`). Idempotent par email ; opt-in marketing repris prudemment.
- [ ] **Décider du sort de l'historique commandes** : reprise (compta, clients récurrents) ou archivage hors-ligne. Medusa ne migre pas les commandes par défaut (scripts orientés produits/clients/redirections).

**Critère d'acceptation :** stratégie commandes/clients arrêtée ; contacts repris si pertinent.

---

## Phase 10 — Recette & bascule (P0)

**Objectif :** mise en ligne maîtrisée (suivre `docs/refonte/migration-runbook.md`).

**Ordre de bascule (jour J, heures creuses) :** Médias → Produits → (Clients) → Redirections → (Emails de migration, warm-up 500/h).

**Recette pré-bascule**

- [ ] 18 fiches OK (prix, images, TVA, stock).
- [ ] Checkout CB Stripe live OK (frais + ambiant + mixte + retrait).
- [ ] 301 vérifiées sur échantillon d'anciennes URLs.
- [ ] CGV/Confidentialité/SIRET en place.
- [ ] Page maintenance WP pendant la bascule ; bascule DNS ; **rollback documenté** (SQL `metadata.migrated_from = 'lehena-wp'` + restauration DB).

---

## Backlog Phase 2 — International (UE + Monde)

- Taux TVA UE/Monde + **OSS/IOSS**.
- Grilles + **API transporteurs internationales** (Chronofresh/Colissimo intl).
- **Traductions ES/EN** des pages (i18n déjà scaffoldé, contenu FR seul aujourd'hui).
- Mentions légales export.

---

# Chemin critique (résumé P0 — bloquant lancement)

1. **Phase 0** — Clés WC + Stripe + accès admin WP + sauvegardes.
2. **Phase 1** — Purge seed → dry-run → import 18 produits → nettoyage titres/catégories.
3. **Phase 2** — Stripe live + webhook + test transaction.
4. **Phase 3** — Option « Retrait sur place » + validation grilles FR.
5. **Phase 4** — Verrouiller périmètre France (masquer UE/Monde) + TVA OK.
6. **Phase 5** — CGV + Confidentialité + SIRET/TVA réels.
7. **Phase 10** — Recette complète + bascule + rollback prêt.

**Fast-follow (P1) :** redirections 301 & stratégie blog (Phase 6), newsletter/ESP + abonnés (Phase 7), clients/commandes (Phase 9), enrichissement filtres produits (Phase 1d).

**Ultérieur (P2) :** promotions (Phase 8), international UE/Monde (Backlog Phase 2).
