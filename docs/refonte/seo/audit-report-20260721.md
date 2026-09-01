# Audit SEO Lehena — Rapport d'implémentation (2026-07-21)

Rapport post-implémentation de la série de prompts SEO 01–12
(`docs/refonte/seo/`), exécutée en batch sur la branche `feat/seo-batch`.

> ⚠️ Les validations **live** (Rich Results Test, Search Console, Lighthouse
> sur `https://lehena.fr`, Merchant Center) exigent le déploiement en prod.
> Ce rapport couvre l'état **code** (implémenté / vérifié en build local) et
> liste précisément ce qu'il reste à faire côté prod + données réelles.

## Résumé exécutif

L'infrastructure SEO technique est **en place et compile** (typecheck backend

- storefront verts, `next build` OK). 10 des 12 prompts sont livrés côté code ;
  2 (05, 07) sont livrés en infra mais **bloqués par des données réelles** à
  fournir par Paul (téléphone/horaires atelier, CID GBP, bio/photo Bénat Petit) ;
  le contenu des piliers (06) et des FAQ reste à rédiger (copywriter). Aucune
  action n'est « production-ready » tant que le déploiement + les validators live
- les données manquantes ne sont pas traités.

## Résultats par prompt

| #   | Prompt               | État code                   | Bloqueur / reste à faire                                      |
| --- | -------------------- | --------------------------- | ------------------------------------------------------------- |
| 01  | Merchant feed        | ✅ Livré                    | Upload + compte Merchant Center (manuel Paul)                 |
| 02  | Product schema       | ✅ Livré                    | Validation Rich Results en prod                               |
| 03  | Org + WebSite + BC   | ✅ Livré                    | — (NAP corrigé, vatID/knowsAbout ajoutés)                     |
| 04  | Sitemap + robots     | ✅ Existant + feed autorisé | Soumission GSC/Bing (manuel)                                  |
| 05  | LocalBusiness        | ⚠️ Infra                    | **Téléphone, horaires, CID GBP, photos atelier**              |
| 06  | FAQ piliers          | ⚠️ Infra + brief            | **Rédaction des 60 réponses + pages piliers**                 |
| 07  | Article + Person     | ⚠️ Infra                    | **Bio + photo Bénat Petit ; assigner author_id aux articles** |
| 08  | llms.txt + ai.txt    | ✅ Livré                    | —                                                             |
| 09  | Meta + OG dynamiques | ✅ Livré (hors catégories)  | OG catégorie non supportée (catch-all Next)                   |
| 10  | Images + Web Vitals  | ✅ Livré                    | Renseigner `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` en prod             |
| 11  | Reviews aggregate    | ✅ Livré                    | Migration DB (aucune) — pur applicatif                        |
| 12  | Audit final          | ✅ Ce doc                   | Validations live post-déploiement                             |

## Détail des livrables

### 01 — Google Merchant Feed

- `apps/storefront/src/app/feed/google-merchant.xml/route.ts` (ISR 1h, `application/xml`).
- Helper pur `lib/seo/merchant-feed.ts` (un `<item>`/variante, `item_group_id`,
  strip HTML, prix `24.90 EUR`, `identifier_exists=no` faute de GTIN).
- Mapping catégorie → `google_product_category` : `lib/seo/google-product-category.ts`.
- `robots.ts` autorise explicitement `/feed/`.
- **Manuel** : création compte MC, vérif domaine (DNS TXT), Free Listings,
  scheduled fetch. Vérifier `NEXT_PUBLIC_BASE_URL=https://lehena.fr` en prod
  (URLs images/PDP doivent être HTTPS absolues).

### 02 — Product schema enrichi

- `productSchema` : brand→Organization (@id), `manufacturer`, `itemCondition`,
  `mpn`, `hasMerchantReturnPolicy`, `shippingDetails`, `additionalProperty`
  (+ allergens/ingredients), `nutrition`, top-3 `review`.
- Helpers réutilisables : `schemas/return-policy.ts`, `schemas/shipping.ts`,
  `schemas/nutrition.ts`.
- **Note** : le modèle catalog a `salt`, pas `sodium` → mappé sur
  `sodiumContent` (approximation, commentée).

### 03 — Organization + WebSite + Breadcrumb

- NAP corrigé (`Le Bourg` / `Laguinge-Restoue`), aligné sur `company.ts`.
- Ajout `alternateName` (LEHENA), `legalName` (LEHENA SAS), `vatID`,
  `areaServed`, `knowsAbout`. WebSite SearchAction + Breadcrumb : déjà en place.

### 04 — Sitemaps + robots

- Déjà en place (index + pages/articles/products/categories/collections).
- Ajout : autorisation `/feed/` dans robots.

### 05 — LocalBusiness (⚠️ données réelles)

- LocalBusiness (`FoodStore`) désormais **unique**, sur `/atelier` uniquement
  (retiré de l'accueil — évite la confusion Google).
- GPS réels via Nominatim : **43.0972755, -0.8484849** (Laguinge-Restoue).
- Enrichi : `parentOrganization`, `areaServed`, `servesCuisine`,
  `paymentAccepted`, `currenciesAccepted`.
- **À fournir par Paul** : téléphone E.164, horaires réelles, CID GBP
  (`hasMap`/`sameAs`), ≥3 photos atelier dans `public/images/`.

### 06 — FAQPage (⚠️ contenu)

- Champ `faq` (jsonb) ajouté au modèle Page (migration **additive**).
- Composant accessible `<FaqAccordion>` (Radix, clavier).
- Schema FAQPage injecté sur `[slug]` si `faq` non vide, **placeholders filtrés**.
- Brief livré : `docs/refonte/seo/faq-templates.md` (60 questions, 6 piliers).
- **À faire** : rédiger les réponses + créer les pages piliers.

### 07 — Article + Person EEAT (⚠️ données réelles)

- Modèle author étendu (`role_title`, `credentials`, `email` — migration additive).
- Seed `seed-authors.ts` (Bénat Petit, **bio placeholder à valider**).
- Route store `/store/authors/[slug]` + page storefront `/auteurs/[slug]`.
- Composant `<ArticleByline>` + schema Article enrichi (author Person @id,
  `worksFor`, dates réelles).
- **À faire** : bio 100+ mots + portrait (candidat existant :
  `/images/home-artisan-portrait.webp`) ; **assigner `author_id`** aux pages
  articles/piliers (sinon page auteur vide = ignorée par Google).
- **Lancer le seed** : `medusa exec ./src/scripts/seed-authors.ts`.

### 08 — llms.txt + ai.txt

- `/llms.txt` dynamique (ISR 24h) — liste **uniquement** pages/produits publiés.
- `/ai.txt` statique (politique ouverte : crawl + train-ai + train-genai).
- `<link rel="ai"/"llm">` ajoutés au head global.

### 09 — Meta + OG dynamiques

- `buildMetadata` enrichi : twitter site/creator, robots
  `max-image-preview:large`, `og:url`=canonical, `theme-color`, `og:type`
  élargi à `product`.
- OG images dynamiques (`next/og`, 1200×630) : **produit** + **CMS/article**.
- ⚠️ **Catégorie retirée** : `opengraph-image` interdit dans un segment
  catch-all `[...category]` (limitation Next.js). Fallback = OG global.
- Fonts : défaut Satori embarqué (aucune font locale dans le repo).

### 10 — Images + Web Vitals RUM

- `next.config.js` : formats AVIF+WebP, deviceSizes/imageSizes, cache 1 an.
- `web-vitals@5` (via **pnpm**, monorepo) + `<WebVitalsReporter>` monté dans le
  layout → events Plausible `WebVital:*`.
- `<img>` natif de `/recherche` migré vers `next/image` (les 4 `<img>` de
  `tiptap-renderer` restent : HTML CMS arbitraire).
- Preconnect backend + dns-prefetch Plausible ajoutés.
- **Prod** : renseigner `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` sinon aucun event.

### 11 — Reviews aggregate

- Service `getProductStats` / `getProductsStats` (avg + count + distribution,
  approved only).
- Route `/store/products/:id/reviews-stats` + enrichissement inline
  `products-faceted` (avg_rating/review_count, une requête batch/page).
- `<StarRating>` réutilisable + affichage sur `LehenaProductCard`.
- AggregateRating + top-3 Review dans le schema PDP (jamais si count 0).

## Erreurs bloquantes avant « production-ready »

Aucune erreur de code bloquante (build + typecheck verts). Bloqueurs **non-code** :

1. **Données atelier** (05) : téléphone, horaires, CID GBP, photos.
2. **Bio + photo Bénat Petit** (07) ; assignation `author_id`.
3. **Contenu FAQ + pages piliers** (06).
4. **Déploiement** puis validations live (voir ci-dessous).
5. **Migrations backend** (author, page.faq) à appliquer :
   `medusa db:migrate` — les deux sont **additives** (ADD COLUMN nullable),
   vérifiées, aucun drop. Puis `seed-authors`.

## Validations live à exécuter après déploiement

- **Rich Results Test** + **Schema Validator** sur : home, PDP jambon,
  `/atelier`, `/auteurs/benat-petit`, un article (quand author_id assigné).
- **Merchant feed** : `curl https://lehena.fr/feed/google-merchant.xml | head`
  → XML valide ; diagnostic Merchant Center 0 erreur.
- **llms.txt / ai.txt** : `curl` → `text/plain; charset=utf-8`, liens 200.
- **Lighthouse** (incognito/CLI) sur home/catégorie/PDP/atelier : Perf ≥ 90,
  SEO 100, A11y ≥ 95.
- **Sitemap** soumis GSC + Bing → statut Success.
- **Plausible** : events `WebVital:LCP/INP/CLS` reçus, filtrables par path.

## KPIs à suivre mensuellement (owner : Paul)

| KPI                                         | Source                      | Cadence         |
| ------------------------------------------- | --------------------------- | --------------- |
| Impressions / clics / position moyenne      | Google Search Console       | mensuel         |
| Produits approuvés / Free Listings          | Merchant Center             | mensuel         |
| Median LCP / INP / CLS par template         | Plausible (WebVital:\*)     | hebdo → mensuel |
| Avis Google (cible ≥ 20 à 6 mois)           | Google Business Profile     | mensuel         |
| Backlinks / referring domains               | Ahrefs / Ubersuggest (démo) | mensuel         |
| Mentions LLM (« charcuterie sans nitrite ») | ChatGPT/Perplexity manuel   | trimestriel     |

## Backlog SEO 6 mois

1. Rédiger + publier les 6 piliers (2000-4000 mots) et assigner `author_id`.
2. Remplir les 60 réponses FAQ (brief `faq-templates.md`).
3. Compléter la fiche Google Business Profile + récolter les avis.
4. Fournir les données atelier réelles (05) et publier la bio/photo Bénat (07).
5. Peupler GTIN/EAN produits si disponibles (améliore Merchant + Product schema).
6. OG catégorie via route API dédiée (contourner la limite catch-all Next).
7. Outreach backlinks presse/blogs Pays Basque.
8. Suivre les templates « poor » Web Vitals et optimiser au cas par cas.
