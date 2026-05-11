# Stratégie SEO — Refonte Lehena

> Doctrine SEO transverse à appliquer sur **toutes** les phases de la refonte.
> Le SEO n'est pas une phase à part : c'est un fil rouge intégré à chaque
> livrable. La phase 9 du plan global est un audit final + finition, pas
> une "rattrapage SEO de fin de projet".

---

## 1. Cibles et indicateurs

### Cibles de trafic
- **+150 % de trafic organique en 12 mois** (réaliste vu le faible niveau
  actuel de l'ancien site).
- **Top 3 sur les requêtes longue traîne suivantes** sous 6 mois :
  - "jambon sans nitrite [pays basque]"
  - "jambon affiné 24 mois"
  - "patxaran maison"
  - "charcuterie artisanale pays basque en ligne"
- **Top 10 sur les requêtes head** sous 12 mois :
  - "jambon sans nitrite"
  - "charcuterie sans nitrite"
  - "jambon basque"

### Indicateurs de mesure
- Position moyenne (Search Console).
- Trafic organique (Plausible, segmenté par pays/langue).
- CTR par page indexée.
- Pages indexées vs pages soumises.
- Core Web Vitals par template (home, PDP, catégorie, article, page éditoriale).
- Backlinks net (Ahrefs/Semrush).

---

## 2. Architecture sémantique

### Silos thématiques

```
Jambon sans nitrite (page pilier)
├── Race Duroc (article support)
├── Affinage (15 mois / 24 mois) — article support
├── Sel de Salies de Béarn (article support)
├── Découpe & dégustation (article support)
├── Conservation (article support)
└── Produits :
    ├── Jambon Orhi entier avec os
    ├── Jambon Orhi entier désossé
    ├── Demi-jambon
    ├── Quart
    └── Tranches

Salaisons Pays Basque (page pilier)
├── Ventrêche (article support)
├── Saucisson (article support)
├── Coppa, lonzo… (article support)
└── Produits

Patxaran (page pilier)
├── Histoire & origine (article support)
├── Recette traditionnelle (article support)
├── Comment déguster (article support)
└── Produits

Épicerie Pays Basque (page pilier)
├── Sauces & condiments
├── Conserves
├── Coffrets cadeaux
└── Produits

Recettes (silo croisé)
├── Recette → produits utilisés (M2M)
└── Recette → ingrédients (taxonomie)

Notre univers (silo identité)
├── Notre histoire
├── La ferme (de la ferme à l'assiette)
├── Engagements (sans nitrite, race Duroc, bien-être animal, environnement)
├── Notre atelier au Pays Basque
└── Presse & récompenses
```

### Pages piliers à produire

Une page pilier = 2000-4000 mots, structurée H1/H2/H3, avec :
- Sommaire ancré.
- FAQ schema en bas.
- Liens vers tous les articles supports du silo.
- Liens vers les produits du silo.
- Image hero + 3-5 illustrations.
- CTA contextuel (catégorie ou produit).

Liste minimum à produire :
1. **Tout savoir sur le jambon sans nitrite** — pourquoi, dangers du nitrite,
   méthode Lehena, comparatif, FAQ.
2. **Race Duroc : le cochon d'exception** — origine, élevage Pays Basque,
   nutrition céréalière, persillage, comparatif Bellota / Bigorre.
3. **L'affinage 24 mois expliqué** — étapes, sel de Salies, séchage,
   différence entre 15 mois et 24 mois, vocabulaire.
4. **Patxaran : la liqueur basque traditionnelle** — origine, recette,
   dégustation, accords.
5. **Comment découper un jambon entier** — matériel, technique, schémas,
   conservation après ouverture.
6. **Charcuterie & santé : ce qu'il faut savoir** — nitrites, sodium, gras,
   portions raisonnables, alternatives.

### Articles supports

Pour chaque pilier, **5-8 articles supports** de 800-1500 mots qui :
- Répondent à une intention de recherche précise (1 mot-clé principal +
  3-5 secondaires).
- Pointent vers la page pilier (lien remontant).
- Pointent vers 1-2 produits pertinents.
- Ne se cannibalisent pas entre eux.

---

## 3. SEO technique — règles non négociables

### Côté Next.js / storefront

| Règle | Implémentation |
|---|---|
| `generateMetadata` exhaustif sur **chaque** route | title, description, canonical, OG (title/desc/image/type/locale), Twitter card, alternates hreflang |
| 1 seul H1 par page, sémantique forte | Validé en revue PR via lint custom |
| Hiérarchie H2/H3 cohérente | Pas de saut de niveau |
| Breadcrumb visuel + JSON-LD `BreadcrumbList` | Composant commun + injection SD |
| Schema.org systématique selon template | Cf. tableau § 4 ci-dessous |
| `<title>` < 60 caractères, `<meta description>` < 155 | Validation au build |
| URLs propres, en kebab-case, sans paramètres pour les pages indexables | Pas de `?page=2&filter=…` indexable, paginer via `/page/2/` ou ISR |
| `next-sitemap` configuré, segmenté (sitemap-products, sitemap-categories, sitemap-pages, sitemap-articles) | Build-time |
| `robots.txt` autorisant `/`, bloquant `/checkout`, `/account`, `/cart`, `/api` | Statique |
| `next/image` avec dimensions explicites + `priority` sur les LCP | Pas de CLS |
| Lazy-load JS non critique | Server components partout où possible |
| Pas de bloc client-only sur les pages indexables (PDP, catégories, articles) | RSC + streaming |
| Préchargement DNS / preconnect pour CDN images, Stripe, Plausible | `app/layout.tsx` |
| `lang` HTML attribut + `dir` cohérent par locale | Provider i18n |
| 404 utile (recommandations + recherche) | Plutôt que dead-end |

### Côté backend Medusa

| Règle | Implémentation |
|---|---|
| Slugs produits / catégories / pages éditables et uniques | Validation backend + URL conflict check |
| Champs SEO dédiés sur Page, Product, Category : `seo_title`, `seo_description`, `og_image`, `noindex` | Custom fields module |
| Webhook revalidation Next.js sur publish/update | Subscriber Medusa → POST `/api/revalidate` (déjà prévu CMS) |
| Image hero produit en 4 tailles servies via S3 + Next/Image | Pré-upload pipeline ou Next.js loader |
| Historique des slugs (pour générer redirects auto en cas de rename) | Module `redirects` custom |

### Performance — cibles Lighthouse / CWV

| Métrique | Cible PDP | Cible home | Cible article |
|---|---|---|---|
| LCP | < 2.0 s | < 1.8 s | < 1.8 s |
| INP | < 200 ms | < 200 ms | < 200 ms |
| CLS | < 0.05 | < 0.05 | < 0.05 |
| Performance score | ≥ 90 | ≥ 90 | ≥ 95 |
| SEO score | 100 | 100 | 100 |
| Accessibility | ≥ 95 | ≥ 95 | ≥ 95 |

Mesure en CI sur PR (Lighthouse CI ou unlighthouse), seuil bloquant.

---

## 4. Schema.org par template

| Template | Schemas obligatoires |
|---|---|
| `app/layout.tsx` (global) | `Organization`, `WebSite` (+ `SearchAction`) |
| Home | + `BreadcrumbList` |
| Catégorie | `BreadcrumbList`, `ItemList` (top produits) |
| PDP | `BreadcrumbList`, `Product` (avec `Offer`, `Brand`, `AggregateRating` si avis), `Review` si avis |
| Page éditoriale | `BreadcrumbList`, `Article` ou `WebPage` |
| Article (recette) | `Recipe` complet (ingrédients, étapes, durée, nutrition, image) |
| FAQ (sur page pilier ou PDP) | `FAQPage` |
| Page atelier | `LocalBusiness` (`FoodStore`) avec adresse, horaires, géo |
| Pages d'auteur (si journal) | `Person` |

Helpers TypeScript dans `lib/seo/schemas/` : un fichier par schéma, sortie
JSON sérialisée injectée via `<script type="application/ld+json">`.

---

## 5. SEO sémantique & contenu — règles éditoriales

### Pour chaque PDP
- **Titre H1** : nom produit clair (pas de promo dedans).
- **Titre SEO (`seo_title`)** : `<Nom produit> | <USP courte> | Lehena`
  ex: `Jambon Orhi entier désossé 24 mois | Sans nitrite | Lehena`.
- **Meta description** : 130-155 caractères, intègre 1 mot-clé principal +
  1 secondaire + 1 USP + 1 réassurance livraison.
  ex: `Jambon Orhi désossé, race Duroc, affiné 24 mois au sel de Salies, garanti
  sans nitrite. Élevé au Pays Basque. Livraison Chronofresh dès 24h.`
- **Description produit** : 250-500 mots minimum, structurée :
  - Histoire / origine (1 paragraphe)
  - Caractéristiques produit (liste à puces)
  - Méthode de fabrication (1 paragraphe)
  - À déguster avec (cross-sell intégré)
  - Conservation (1 paragraphe)
- **FAQ produit** : 4-6 questions minimum, schema `FAQPage`.
- **Avis** : visibles + schema `AggregateRating`.

### Pour chaque catégorie
- Description SEO 150-300 mots **au-dessus** de la grille (visible avec
  un "voir plus" si trop long, mais HTML servi entier).
- Description complémentaire ~200 mots **sous** la grille (FAQ + maillage
  vers piliers / autres catégories).

### Pour chaque page pilier
- 2000-4000 mots structurés.
- Sommaire ancré (`#anchor` cliquables).
- Au moins 5 liens internes vers articles supports du silo.
- Au moins 3 liens vers produits du silo.
- 1-2 liens externes vers sources d'autorité (ANSES, INRAE, presse) — bon pour
  la confiance Google.
- FAQ schema en bas.
- CTA contextuel discret (newsletter ou produit phare du silo).

### Pour chaque article support
- 800-1500 mots.
- 1 mot-clé principal + 3-5 mots-clés secondaires identifiés à l'avance.
- Lien remontant vers la page pilier dans les 200 premiers mots.
- 1-3 liens vers produits.
- Image hero unique optimisée (pas de stock photo générique).
- Auteur signé (`Person` schema).
- Date de publication ET date de mise à jour.

---

## 6. Multilingue & hreflang

### Périmètre
- **FR (par défaut)** : prioritaire.
- **ES** : naturel vu marché Pays Basque + Espagne voisine ; à activer en V1.
- **EN** : pour le tourisme international ; à activer en V1 ou V1.5 selon
  budget de traduction.

### Implémentation
- Routes : `/fr/...`, `/es/...`, `/en/...` (le starter actuel utilise
  `[countryCode]` mais on devra arbitrer pays vs langue).
- `hreflang` dans `<head>` pour **chaque** page traduite, plus `x-default`.
- Sitemaps séparés par langue.
- Traduction **pro** des pages piliers et PDP des best-sellers ; auto-traduction
  acceptable seulement pour PDP en queue de catalogue, avec relecture humaine.
- Prix par devise (EUR partout en V1, GBP/USD en V2).

---

## 7. Local SEO

- Page **`/atelier`** dédiée : adresse, photos atelier, horaires, plan
  d'accès, parking, contact.
- Schema `LocalBusiness` (subtype `FoodStore`) sur cette page.
- Optimiser **Google Business Profile** : photos régulières atelier, posts
  hebdo (nouvelle salaison, événement, etc.), réponses systématiques aux avis.
- NAP cohérent (Name, Address, Phone) : footer + page atelier + GBP +
  schemas → strictement identique partout.
- Citations locales : Pages Jaunes, Yelp, TripAdvisor (si visiteurs), guides
  cuisine Pays Basque.
- **Backlinks locaux** : office de tourisme du Pays Basque, Sud-Ouest
  Gourmand, blogs cuisine régionaux.

---

## 8. Acquisition et linkbuilding

### Sources d'autorité prioritaires
- Presse cuisine FR (Régal, Cuisine et Vins de France, Saveurs).
- Presse régionale (Sud-Ouest, La République des Pyrénées, Le Journal du Pays
  Basque).
- Blogs cuisine / chef (Chef Simon, Marmiton — si possible — Cuisine Actuelle).
- Comparateurs jambon / charcuterie (60 millions de consommateurs, UFC Que
  Choisir si test).
- Associations : Slow Food, Bleu-Blanc-Cœur, label Pays Basque.

### Format à pousser
- **Story "atelier"** filmée pour Instagram → repris en pages presse.
- Témoignages chefs partenaires.
- "Test sans nitrite" comparatif (transparent, pas marketing pur).

### Mesure
- Suivi mensuel des nouveaux backlinks (Ahrefs ou Ubersuggest free).
- Disavow file maintenu si spam.

---

## 9. Tracking, attribution, RGPD

- **Plausible** = analytics par défaut, sans cookies, sans bandeau.
- Si pression marketing pour Meta Pixel / GA4 → bandeau de consentement
  granulaire (analytics / marketing / personnalisation séparés).
- Search Console connectée à Plausible.
- Bing Webmaster Tools également (Bing pèse 5-10 % du trafic FR, négligé par
  beaucoup).
- Suivi positionnement : Ahrefs (si budget) ou MyPositeo / SEObserver (FR).

---

## 10. Ce que CE document n'est pas

- Pas une stratégie de contenu détaillée article par article : ça vivra dans
  un calendrier éditorial annexe (`docs/refonte/calendrier-editorial.md` à
  produire en Phase 4).
- Pas un guide de copywriting : un brief séparé fournira le ton de voix
  (à produire avec le client en Phase 2).
- Pas figé : à relire à 6 mois post-mise en ligne, ajuster selon ce que dit
  Search Console.

---

## 11. Checklist SEO par phase

À cocher avant de marquer une phase comme "terminée" :

### Phase 1 (catalogue)
- [ ] Slugs produits / catégories propres et stables.
- [ ] Custom fields SEO sur produits et catégories (`seo_title`, `seo_description`, `og_image`, `noindex`).
- [ ] Module `redirects` opérationnel.

### Phase 2 (storefront ossature)
- [ ] `generateMetadata` global + helpers réutilisables.
- [ ] `Organization` + `WebSite` schemas dans le layout.
- [ ] Composant `Breadcrumb` + JSON-LD.
- [ ] `lang` + `dir` corrects par locale.
- [ ] 404 utile.

### Phase 3 (PDP / catégories)
- [ ] Schema `Product` + `Offer` + `Brand` sur PDP.
- [ ] Schema `BreadcrumbList` + `ItemList` sur catégories.
- [ ] Description SEO catégorie (above + below grid).
- [ ] FAQ produit sur PDP avec schema.
- [ ] Filtres facettes : SEO-safe (pas indexer toutes les combinaisons).

### Phase 4 (CMS)
- [ ] Champs SEO sur Page (déjà fait via passes CMS, à vérifier).
- [ ] Schema `Article` sur pages éditoriales.
- [ ] Schema `Recipe` sur recettes.
- [ ] Multilingue + hreflang opérationnels.

### Phase 5 (checkout)
- [ ] Pages checkout en `noindex`.

### Phase 7 (emails)
- [ ] Liens de tracking ne polluent pas Search Console.

### Phase 8 (migration)
- [ ] Table de redirects 301 complète, testée page par page.
- [ ] Sitemap soumis à Search Console **avant** la bascule DNS.
- [ ] Inventaire backlinks (Ahrefs) → ceux qui pointent vers des URLs qui
      changent doivent être prioritaires dans la table redirects.

### Phase 9 (audit final SEO)
- [ ] Audit Screaming Frog complet, 0 erreur 4xx/5xx interne.
- [ ] Lighthouse CI en place sur 5 templates clés.
- [ ] Schema.org validé via [validator.schema.org](https://validator.schema.org).
- [ ] Rich Results Test passé sur PDP, Article, Recipe, FAQ.
- [ ] Pages piliers publiées et liées.
- [ ] Multilingue testé (hreflang sans erreur dans Search Console).
- [ ] Sitemaps soumis, indexation OK.
- [ ] Local SEO : page atelier publiée, GBP optimisé, schema LocalBusiness validé.

### Phase 14 (bascule)
- [ ] Search Console nouvelle propriété ajoutée et vérifiée AVANT bascule.
- [ ] Bing Webmaster Tools idem.
- [ ] J+1 : monitorer dans Search Console les erreurs et les redirects.
- [ ] J+7 : audit positions critiques (best-sellers + page pilier principale).
- [ ] J+30 : revue trafic + corrections.
