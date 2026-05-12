# Runbook — Migration WP → Medusa (Phase 8)

Procédure opérateur **jour-J** pour basculer le catalogue, les clients et
les redirections SEO de `lehena.fr` (WordPress / WooCommerce) vers le nouveau
backend Medusa.

> ⚠️ **Pré-requis bloquant** : accès lecture à l'API WooCommerce REST v3
> (consumer key / secret), validés par l'agence Inovesign.

---

## 0. Pré-vol (J-7 → J-1)

- [ ] **Credentials WC API** validés en lecture + saisis dans
      `.env.production` du backend :
  - `WC_API_URL=https://lehena.fr`
  - `WC_API_CONSUMER_KEY=ck_…`
  - `WC_API_CONSUMER_SECRET=cs_…`
- [ ] **Backup Postgres** de l'environnement cible (`pg_dump`)
      stocké hors-site.
- [ ] **Backup MinIO / Scaleway** Objects Storage (rsync incrémental).
- [ ] **Resend** : `RESEND_API_KEY` en prod, domaine `mail.lehena.fr`
      vérifié + DKIM ok (cf. `dns-emails.md`).
- [ ] **Storefront** déployé sur staging avec la table `redirects` peuplée
      depuis `--source=fixtures` pour valider le middleware.

## 1. Dry-run complet (J-3, sur staging)

Tous les scripts par défaut sont en dry-run — ils écrivent un rapport
JSON dans `apps/backend/migration-reports/`. Aucune mutation prod.

```sh
cd apps/backend

# 1) Produits — exerce le mapper, écrit le rapport, ne crée RIEN.
pnpm medusa exec ./src/scripts/migrate-products.ts

# 2) Clients — dry-run.
pnpm medusa exec ./src/scripts/migrate-customers.ts

# 3) Redirects — dry-run.
pnpm medusa exec ./src/scripts/build-redirects.ts

# 4) Médias — dry-run (download skip, listing only).
pnpm medusa exec ./src/scripts/migrate-media.ts
```

Vérifier chaque rapport :

- `migrate-products` : `totals.failed === 0`. Inspecter les `notes` des
  rows `skipped` (souvent des produits brouillons ou sans variant).
- `migrate-customers` : pas de doublon d'email.
- `build-redirects` : 100 % des produits actifs ont une entrée
  `/produit/<slug>/` → `/fr/products/<slug>`.
- `migrate-media` : nombre d'URLs uniques ≈ nb produits × 2-3.

## 2. Run réel (J-day, sur prod, hors-trafic)

```sh
cd apps/backend
export WC_API_URL=… WC_API_CONSUMER_KEY=… WC_API_CONSUMER_SECRET=…

# Ordre critique : médias → produits → clients → redirects → emails

# 2a) Médias d'abord (sinon les produits référencent des URLs WP qui mourront).
pnpm medusa exec ./src/scripts/migrate-media.ts -- --commit

# 2b) Produits — V1 reste dry-run. Le `createProductsWorkflow` n'est
# branché qu'après revue manuelle du dry-run sur 50 produits.
pnpm medusa exec ./src/scripts/migrate-products.ts
# (Décommenter l'appel workflow dans le script + relancer --commit
#  après validation manuelle.)

# 2c) Clients.
pnpm medusa exec ./src/scripts/migrate-customers.ts -- --commit

# 2d) Redirects 301.
pnpm medusa exec ./src/scripts/build-redirects.ts -- --commit

# 2e) Emails de bienvenue (warm-up : 500/h pendant la 1ère heure).
pnpm medusa exec ./src/scripts/send-migration-emails.ts -- --commit --limit=500
# Attendre 1h, vérifier le dashboard Resend (bounce < 1%, complaints = 0).
# Puis envoyer le reste par batches de 1000 :
pnpm medusa exec ./src/scripts/send-migration-emails.ts -- --commit --batch-size=1000 --delay-ms=500
```

## 3. Validation post-run

- [ ] Page d'accueil + 5 PDP random rendent bien.
- [ ] Recherche MeiliSearch trouve les produits migrés (lancer
      `pnpm reindex` si besoin).
- [ ] **Test redirects** : `curl -I https://lehena.fr/produit/jambon-orhi-18-mois/`
      → `HTTP/2 301`, `location: /fr/products/jambon-orhi-18-mois`.
- [ ] **Test redirects accentués** : `curl -I "https://lehena.fr/categorie-produit/jambon-d-iparralde-sans-nitrite/"`
      → `301`.
- [ ] Sample de 20 anciennes URLs random → toutes en 301.
- [ ] Resend dashboard : taux de bounce < 1 %.
- [ ] Compte Lehena admin : `Reports → Migration` (à brancher Phase 12)
      affiche les compteurs.

## 4. Rollback (en cas de gros pépin)

- Tous les scripts inscrivent `metadata.migrated_from = "lehena-wp"` et
  `migrated_at`. Pour purger :

  ```sql
  -- Suppression de masse — N'EXÉCUTER QU'EN ROLLBACK CONTRÔLÉ.
  DELETE FROM customer WHERE metadata->>'migrated_from' = 'lehena-wp';
  DELETE FROM redirect WHERE source IN ('product', 'category')
    OR (source = 'page' AND note LIKE 'auto-%');
  -- Pas de DELETE produits en V1 (le script n'en crée pas encore).
  ```

- Restaurer le dump Postgres pré-migration si la corruption est sévère.
- Désactiver les redirects en supprimant `MEDUSA_BACKEND_URL` côté
  storefront → middleware fait pass-through par défaut.

## 5. Annexes

- **Format CSV fixtures** : `apps/backend/fixtures/migration/{products,customers}.csv`.
  Le `CsvFixtureReader` (`apps/backend/src/migration/readers/csv-fixture.ts`)
  documente le shape exact.
- **Reader WC API** : `apps/backend/src/migration/readers/woocommerce-api.ts`.
  Pagine via `per_page=100`, lit `X-WP-TotalPages`.
- **Mappers** : `apps/backend/src/migration/mappers/{product,customer,redirect}.ts`.
- **Subscriber email migration** : `apps/backend/src/subscribers/customer-migrated.ts`.
  Émet un JWT 30j.

## 6. Hors scope Phase 8

- ❌ Import des commandes historiques (décision Phase 0).
- ❌ Import du blog WP "Actualités" (journal SEO from scratch Phase 9).
- ❌ Migration des avis (n'existent pas sur l'ancien site, cf. audit § 5).
- ❌ A/B test du subject line de l'email migration (V2).
