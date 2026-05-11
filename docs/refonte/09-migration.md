# Phase 8 — Migration depuis l'ancien Lehena.fr

## Objectif de cette passe

Importer le catalogue (produits + médias) et les comptes clients de
l'ancien Lehena.fr (WordPress + WooCommerce, cf. audit) vers Medusa, sans
perdre de référencement (redirects 301 exhaustifs), sans perdre de clients
(email de reset password pour tous).

**Pré-requis bloquant** : avoir négocié avec l'agence Inovesign un export
de la base WooCommerce, ou pouvoir consommer l'API WooCommerce REST. À
caler avant le démarrage de cette phase.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 8 — Migration** depuis l'ancien Lehena.fr. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 8 § 3 et § 5 Risques)
2. `docs/refonte/audit-site-actuel.md` (intégralité) — c'est ta référence
3. `docs/refonte/strategie-seo.md` (§ 11→Phase 8)

L'ancien site = WordPress + WooCommerce (cf. audit § 1). À confirmer
avant de coder : avons-nous l'API WooCommerce REST accessible ?
Un dump SQL ? Un export CSV ? Demande-le-moi explicitement.

## Étape 1 — Reconnaissance

- Liste tous les modules / scripts custom déjà présents dans
  `apps/backend/src/scripts/`.
- État du module `redirects` (Phase 1) : ce qu'il offre, comment il s'intègre.
- État du middleware Next.js (`apps/storefront/src/middleware.ts`) :
  est-il déjà capable de gérer des redirects custom ?

## Étape 2 — Audit de la source (à faire avec moi)

À me demander avant de coder :
- Quelle source pour la migration : API WooCommerce REST ? dump SQL ? export
  CSV ? Si on a accès admin WP, on peut utiliser le plugin "WooCommerce
  Customer / Order / Coupon Export" pour générer un CSV propre.
- Combien de produits exactement (catégorie / non publiés / brouillons) ?
- Combien de clients (actifs, inactifs) ?
- Y a-t-il des champs custom produit dans WP (ACF) ?
- Médias hébergés où exactement (`wp-content/uploads`) et tailles disponibles ?
- Anciennes URLs vivantes à conserver via redirect : produits, catégories,
  pages éditoriales, articles "Actualités", URLs de blog, sitemaps WP.

Une fois ces points résolus, on passe à l'étape 3.

## Étape 3 — Plan détaillé (à valider)

Mon attendu :

a. **Mapping produits WooCommerce → Medusa** :
   - WooCommerce product → Medusa product + variants.
   - Si WooCommerce "Variable Product" : merger les variations en variantes.
   - Si WooCommerce "Simple Product" + accessoire (Os, Planche, etc.) :
     produit Medusa simple.
   - **Re-groupement** : aplatir les produits actuellement scindés en un seul
     produit + variantes (ex: Jambon entier os / désossé / demi / quart →
     1 produit "Jambon Orhi" + 5 variantes).
   - Custom fields : mapper les ACF / catégories vers `aging_months`, `origin`,
     `breed`, `nitrite_free`, etc.
   - SEO : copier `seo_title` et `seo_description` (Yoast / Site Kit) vers
     `product.seo_title` et `product.seo_description`. Si meta date périmée
     détectée (ex: "Offre jusqu'au 1 mai 2025"), nettoyer.

b. **Mapping catégories** :
   - Aplatir la hiérarchie WooCommerce vers nos 7 catégories cibles (cf. Phase 1).
   - **Séparer les accessoires** (planche, support, couteau) des Jambons.

c. **Mapping clients** :
   - Email + nom + prénom + adresses → Medusa Customer.
   - **Pas** d'import de mot de passe (hash incompatibles). Envoi d'un email
     "ton compte a été migré, réinitialise ton mot de passe" à tous les
     clients avec lien signé valide 30 jours.
   - Champ `migrated_from: "lehena-wp"`, `migrated_at: timestamp` pour
     traçabilité.

d. **Médias** :
   - Download depuis l'ancien CDN (`wp-content/uploads`).
   - Re-upload vers Scaleway Object Storage via le module file Medusa.
   - Préserver l'EXIF / les alt text.
   - Génération de 4 tailles (1600 / 1200 / 800 / 400) via Next/Image
     (au runtime) ou pré-traitement (preferred).

e. **Scripts** :
   - `apps/backend/src/scripts/migrate-products.ts` — input : CSV / API, dry-run
     par défaut, `--commit` pour exécuter.
   - `apps/backend/src/scripts/migrate-customers.ts` — idem.
   - `apps/backend/src/scripts/migrate-media.ts` — download + upload.
   - `apps/backend/src/scripts/build-redirects.ts` — produit une liste de
     redirects 301 à partir des anciens slugs → nouveaux slugs.
   - Tous idempotents (rerun safe).

f. **Redirects 301** :
   - Table `redirects` (module Phase 1) peuplée par `build-redirects.ts`.
   - Middleware Next.js qui lit cette table (cache 5 min) et redirige.
   - Anciens schemas d'URL à mapper :
     - `/produit/<slug>/` → `/fr/produits/<slug>/`
     - `/categorie-produit/<slug>/` → `/fr/categories/<slug>/`
     - `/notre-histoire/` → `/fr/notre-histoire/`
     - `/de-la-ferme-a-lassiette/` → `/fr/la-ferme/`
     - `/contactez-nous/` → `/fr/contact/`
     - `/actualites/` → `/fr/journal/`
     - `/cgv/`, `/mentions-legales/`, `/privacy-policy/` → équivalents nouveau site
     - `/mon-compte-2/` → `/fr/account/`
   - Pour les produits aplatis (5 anciennes URLs → 1 nouvelle + variante) :
     redirect vers la PDP avec param variant (`?variant=demi`).

g. **Email migration**: campagne unique envoyée via Resend, contenu :
   "Bonjour [prénom], nous avons modernisé Lehena. Ton compte a été migré.
   Pour le retrouver, cliquer pour réinitialiser ton mot de passe. Lien valide
   30 jours."

h. **Tests sous-set représentatif** :
   - 50 produits, 100 clients sélectionnés à la main pour couvrir tous les
     cas de figure (produit simple, variable, custom fields, plusieurs
     adresses, etc.).
   - Migration exécutée sur env staging.
   - Validation manuelle exhaustive avant migration full.

## Étape 4 — Implémentation

- Branche `feat/phase-8-migration`.
- Scripts en TypeScript pur (pas de bash).
- Logs structurés (préparation Phase 12).
- Mode dry-run par défaut : print ce qui sera fait, sans toucher la DB.
- Mode `--commit` : exécute pour de vrai, avec confirmation interactive.
- Rapport de migration : pour chaque script, à la fin, fichier
  `migration-report-<timestamp>.json` avec : nb traité, nb succès, nb erreur,
  détail erreurs.

## Contraintes (rappel)

- Idempotence absolue : rerun n'importe quel script → état stable.
- Backup PostgreSQL **avant** chaque commit massif.
- Pas de hard delete : les rows en doublon sont marquées `migration_status:
  "skipped_duplicate"`.

## Ce que tu NE fais PAS

- Pas d'import d'historique de commandes (décision Phase 0 : hors scope).
- Pas d'import de blog WordPress en l'état (si "Actualités" pauvres, on
  ne les ressort pas ; on attaque le journal SEO from scratch en Phase 9).
- Pas de migration des avis (ils n'existent pas, cf. audit § 5).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] 100 % des produits actifs migrés et visibles côté storefront.
- [ ] Accessoires séparés en catégorie "Accessoires" (plus dans Jambons).
- [ ] Jambon Orhi consolidé : 1 produit avec 5 variantes (avant : 5 produits
      distincts).
- [ ] 100 % des clients actifs migrés.
- [ ] Email de migration envoyé à tous, taux de bounce surveillé.
- [ ] Toutes les anciennes URLs renvoient un 301 vers la nouvelle URL.
- [ ] Test curl sur 20 URLs aléatoires de l'ancien site → toutes en 301
      vers la bonne destination.
- [ ] Médias migrés vers Scaleway, accessibles via CDN.
- [ ] Rapport de migration disponible et lisible.
- [ ] Aucun produit avec meta description périmée (audit "Offre jusqu'au
      1 mai 2025" en ligne actuellement).

## Pièges courants

- **WooCommerce variations** : le mapping vers Medusa variants est souvent
  pénible. Toujours faire un dry-run + revue manuelle.
- **Médias** : alt text vide sur WP par défaut. À enrichir manuellement
  (a11y + SEO).
- **Slugs en doublon** : WP autorise des slugs identiques entre produits et
  pages. Trancher via préfixe namespace si conflit.
- **Email migration** : NE PAS envoyer en masse sans warm-up. Échelonner sur
  3-5 jours, par batch de 500.
- **Anciennes URLs avec accents / encoding** : tester explicitement
  `/categorie-produit/jambon-d-iparralde-sans-nitrite/`.

## Commit final

Branche : `feat/phase-8-migration`.
Commit : `feat(migration): import products, customers, media + 301 redirects + reset email`.
