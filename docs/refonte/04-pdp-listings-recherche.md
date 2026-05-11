# Phase 3 — PDP Lehena, listings avec filtres facettes, recherche MeiliSearch

## Objectif de cette passe

Refondre complètement la PDP (sur la base de `lehena-pdp/` amorcé), retravailler
les pages catégorie avec filtres facettes propres + description SEO + texte
d'autorité, et brancher la recherche **MeiliSearch** (autocomplete header +
page `/recherche`). Schemas SEO complets (`Product`, `Offer`, `Brand`,
`AggregateRating`, `BreadcrumbList`, `ItemList`, `FAQPage`).

L'ancien site a une PDP plate (1 image, description simple, 0 avis, pas de
FAQ, pas de schema) et des catégories sans facettes (cf. `audit-site-actuel.md`
§ 4 et § 5). On corrige tout ça.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 3 — PDP, listings, recherche** de la refonte Lehena.
Lis avant tout :

1. `docs/refonte/00-PLAN.md` (Phase 3 § 3)
2. `docs/refonte/audit-site-actuel.md` (§ 4 et § 5) — défauts catégorie et PDP actuels
3. `docs/refonte/strategie-seo.md` (§ 3, § 4, § 5, § 11→Phase 3)

Confirme-moi avoir lu avant de commencer.

## Étape 1 — Reconnaissance

- Quels fichiers existent déjà dans `modules/products/components/lehena-pdp/` ?
  Décris brièvement ce que fait chacun.
- Quelle est la structure actuelle de la route `app/[countryCode]/(main)/products/[handle]/page.tsx` ?
- État du composant `lehena-product-card` et de `lehena-controls` (page store) ?
- Quelle lib UI sert pour les filtres (Headless UI, Radix, custom) ?
- Quels custom fields produits sont disponibles dans le payload `/store/products`
  (cf. Phase 1) ?

## Étape 2 — Choix techniques à valider avec moi

a. **PDP — sections finales** (en partant des composants `lehena-pdp/`) :
   1. Galerie multi-images + zoom + vidéo optionnelle. Quelle lib pour le zoom ?
      (yet-another-react-lightbox, ou custom léger ?)
   2. Sélecteur de variantes (`format`). Comment représenter visuellement
      5 formats (entier os / désossé / demi / quart / tranches) ? Boutons-tags
      avec prix, ou dropdown ?
   3. Bloc "Le geste" : storytelling de la fabrication, déjà amorcé.
   4. Bloc accords / pairings : produits associés tirés via la taxonomie
      `tags` (`pairing:patxaran`, `pairing:fromage`) ou via un champ relation
      M2M explicite (`product.suggested_pairings`) ? Recommande.
   5. Bloc conservation + dégustation (text + icônes).
   6. Bloc ingrédients + valeurs nutritionnelles + allergènes (depuis custom
      fields).
   7. Bloc FAQ produit : où vivent les questions/réponses ? Custom field
      `faq[]` (jsonb) sur Product, ou module CMS dédié ? Recommande la solution
      qui marche bien pour l'édito et reste indexable côté SEO.
   8. Bloc avis : placeholder Phase 3 (data mock), branchement réel en Phase 10.
   9. Réassurance livraison : un widget "Livré le <date estimée> si commandé
      avant <heure>". Calcul côté client basé sur jour/heure courant + zone.
   10. Trust badges (cf. la home).
   11. Cross-sell "Vous aimerez aussi" (collection ou tags).

b. **PDP — Schema.org** :
   - `Product` avec `Offer` complet (`price`, `priceCurrency`, `availability`,
     `priceValidUntil`), `Brand` ("Maison Lehena"), `AggregateRating` (mock en
     Phase 3, réel en Phase 10).
   - `BreadcrumbList`.
   - `FAQPage` si bloc FAQ présent.
   - Tous injectés via le helper `<JsonLd>` de Phase 2.

c. **Page catégorie** :
   - Header de catégorie : titre + description SEO (depuis custom field
     `category.seo_description` de Phase 1) sur 150-300 mots, avec un "voir
     plus" pour les longues mais HTML servi entier (SEO).
   - Filtres facettes : type, terroir, durée d'affinage, prix, sans nitrite,
     allergènes, format. Côté Medusa → on filtre par custom field, comment ?
     Recommande : query params `?aging_min=24&nitrite_free=true&...` parsés
     côté server, requête `/store/products` avec params correspondants.
   - **SEO-safe** : on indexe la catégorie de base, pas chaque combinaison de
     filtres. `noindex, follow` sur les pages filtrées via meta dynamique.
   - Tri : pertinence, prix, nouveauté, popularité.
   - Pagination : `/page/2/` pas `?page=2` (SEO).
   - Texte SEO complémentaire ~200 mots **sous la grille** : maillage interne
     vers piliers + autres catégories.
   - Schema `BreadcrumbList` + `ItemList` (top 10 produits visibles).

d. **Page recherche** :
   - Route `/recherche?q=<query>`.
   - MeiliSearch index `products` : champs indexés `title`, `description`,
     `category_names`, `tags`, custom fields searchable (`origin`, `breed`).
   - Filtres facettes côté Meili (`facetSearch`) similaires à la catégorie.
   - Autocomplete dans le header drawer : top 5 produits + top 3 catégories +
     top 3 articles (les articles existeront Phase 9, prévoir le hook).
   - **Subscriber Medusa** qui (re)indexe au create/update/delete produit.
   - `noindex` sur la page recherche (cf. doctrine SEO).

e. **`lehena-product-card`** :
   - À enrichir avec : badge "Best-seller" / "Nouveau" / "Sans nitrite" /
     "Affinage X mois", étoile + nombre d'avis, mention `[format]` si plusieurs
     variantes, prix barré si promo, ajout panier rapide.

## Étape 3 — Plan détaillé (à valider)

Propose 6-8 sous-passes. Mon attendu minimum :

- A : Setup MeiliSearch côté backend (Docker compose dev déjà OK depuis Phase 0)
  + subscriber d'indexation + SDK côté Next.
- B : Page catégorie refondue avec filtres + description SEO + schemas.
- C : Page recherche + autocomplete header.
- D : PDP — finaliser galerie + sélecteur variantes + sections existantes.
- E : PDP — sections manquantes (pairings, FAQ, valeurs nutri, avis mock,
  réassurance livraison, cross-sell).
- F : PDP — schemas complets.
- G : `lehena-product-card` enrichi.
- H : Lighthouse audit sur PDP + catégorie + recherche, corrections perf si
  besoin.

## Étape 4 — Implémentation

- Branche `feat/phase-3-pdp-listings-recherche`.
- Server Components pour le rendu page ; Client Components pour filtres
  facettes + autocomplete + galerie zoom + sélecteur variantes.
- Cache : ISR avec `revalidate` 1h sur catégorie et PDP (subscriber Medusa
  invalide via `revalidateTag` lors d'un update produit).
- Tests : pour chaque page, un test snapshot du JSON-LD émis (`Product`,
  `BreadcrumbList`).

## Contraintes (rappel)

- TypeScript strict.
- Schemas SEO validés (`validator.schema.org`) en local avant PR.
- Pas de CLS sur PDP (réserver l'espace galerie + sélecteur variantes).
- Filtres facettes : URLs canoniques sans paramètres pour la version `noindex`,
  query params propres pour le partage.

## Ce que tu NE fais PAS

- Pas de système d'avis réel (Phase 10).
- Pas de wishlist (Phase 6).
- Pas de checkout au-delà du "ajouter au panier".
- Pas d'articles SEO (Phase 9) — mais on prépare les hooks autocomplete.

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] PDP Jambon Orhi avec ses 5 variantes, switch fluide entre formats (prix
      et stock mis à jour sans rechargement).
- [ ] Galerie multi-images + zoom fonctionnels au clavier et tactile.
- [ ] FAQ produit affichée + schema `FAQPage` valide.
- [ ] Page catégorie "Jambons" affiche les filtres facettes,
      tous fonctionnels, URL propre.
- [ ] Description SEO catégorie visible above the fold (truncate avec "voir plus").
- [ ] Recherche MeiliSearch : taper "jambon orhi" depuis le header retourne
      le produit + suggestions catégorie pertinentes en < 100 ms.
- [ ] Reindex automatique au save d'un produit (test : créer un produit
      depuis l'admin, vérifier qu'il apparaît dans la recherche).
- [ ] Schemas validés : `validator.schema.org` passe sur PDP, catégorie, recherche.
- [ ] Lighthouse PDP en local : Performance ≥ 90, LCP < 2s, CLS < 0.05.
- [ ] Pages filtrées en `noindex, follow` (vérifier dans le HTML).

## Pièges courants

- **MeiliSearch indexation initiale** : si on n'a pas un job de
  réindexation full, on peut se retrouver avec un index décalé en cas de
  panne. Prévoir une commande `pnpm meili:reindex`.
- **PDP variant change** : tentation d'un Client Component géant. Garder
  la page Server, ne mettre Client que sur le sélecteur (qui met à jour
  une URL `?variant=xxx` pour preserver le partage).
- **Schema Product `priceValidUntil`** : si on l'omet, Google warn. À
  défaut, mettre 1 an dans le futur.
- **Filtres facettes URL** : si on combine multi-valeurs (`?aging=15,24`)
  il faut un parsing robuste.

## Commit final

Branche : `feat/phase-3-pdp-listings-recherche`.
Commit : `feat(catalog): pdp, faceted listings, meilisearch — full SEO schemas`.
