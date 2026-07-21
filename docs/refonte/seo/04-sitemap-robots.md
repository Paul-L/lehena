# SEO 04 — Sitemap segmenté + robots.txt propre

## Objectif

Produire un `sitemap.xml` index qui pointe vers 5 sitemaps segmentés
(`sitemap-products.xml`, `sitemap-categories.xml`, `sitemap-pages.xml`,
`sitemap-articles.xml`, `sitemap-recipes.xml`). Et un `robots.txt` qui
autorise les crawlers utiles, bloque les pages inutiles (`/checkout`,
`/account`, `/api`) et référence les sitemaps.

Le sitemap segmenté aide Google à prioriser le crawl et à voir rapidement
les mises à jour catalogue (au lieu de re-crawler un sitemap monolithique).

---

## PROMPT À COPIER-COLLER

````
Tu vas implémenter le sitemap segmenté + robots.txt du storefront Lehena.
Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 3 → sitemap, robots)
3. `apps/storefront/next-sitemap.js` (si présent) ou `next-sitemap.config.js`
4. Doc next-sitemap : https://github.com/iamvishnusankar/next-sitemap

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Est-ce que `next-sitemap` est déjà installé et configuré ?
- Y a-t-il un `robots.txt` existant (statique dans public/ ou généré) ?
- Comment fetch la liste des slugs pour chaque type de contenu :
  - products : `/store/products` (public)
  - categories : `/store/product-categories`
  - pages CMS : `/store/pages`
  - articles : `/store/articles` (si module créé, sinon subset des pages
    filtré par type)
  - recipes : `/store/recipes` (si module recipes actif)

## Étape 2 — Choix techniques à valider

a. **Approche : sitemap dynamique via Next.js App Router**
   Next.js 13+ supporte `app/sitemap.ts` (statique) et
   `app/[type]/sitemap.ts` (multiple sitemaps). Plus propre que
   `next-sitemap`.

   Alternative : garder `next-sitemap` si déjà en place. Confirme.

b. **Index sitemap** — `app/sitemap.xml/route.ts` renvoie un XML index :
   ```xml
   <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <sitemap>
       <loc>https://lehena.fr/sitemap-static.xml</loc>
       <lastmod>2026-07-09</lastmod>
     </sitemap>
     <sitemap>
       <loc>https://lehena.fr/sitemap-products.xml</loc>
       <lastmod>2026-07-09</lastmod>
     </sitemap>
     ...
   </sitemapindex>
````

c. **Segments** :

- `sitemap-static.xml` : home, /notre-histoire, /la-ferme, /engagements,
  /atelier, /contact, /faq, /cgv, /mentions-legales, /confidentialite,
  /recherche (avec `noindex` ne pas mettre)
- `sitemap-products.xml` : tous les produits publiés
- `sitemap-categories.xml` : toutes les catégories actives
- `sitemap-pages.xml` : pages CMS type "page"
- `sitemap-articles.xml` : pages CMS type "article" + piliers SEO
- `sitemap-recipes.xml` : si module recipes actif, sinon ignorer

d. **Format URL** — chaque `<url>` :

```xml
<url>
  <loc>https://lehena.fr/fr/products/jambon-orhi</loc>
  <lastmod>2026-07-08</lastmod>
  <changefreq>weekly</changefreq>  <!-- optionnel, Google ignore souvent -->
  <priority>0.8</priority>  <!-- optionnel, Google ignore souvent -->
</url>
```

Google **ignore désormais** `changefreq` et `priority` — les omettre pour
alléger. Garder juste `loc` et `lastmod`.

e. **Multilingue** (si FR/ES/EN activés) — ajouter les alternates :

```xml
<url xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <loc>https://lehena.fr/fr/products/jambon-orhi</loc>
  <xhtml:link rel="alternate" hreflang="fr" href="https://lehena.fr/fr/products/jambon-orhi" />
  <xhtml:link rel="alternate" hreflang="es" href="https://lehena.fr/es/productos/jambon-orhi" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://lehena.fr/fr/products/jambon-orhi" />
  <lastmod>2026-07-08</lastmod>
</url>
```

f. **robots.txt** — `app/robots.ts` :

```
User-agent: *
Allow: /
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /api
Disallow: /*?*
Allow: /feed/google-merchant.xml
Sitemap: https://lehena.fr/sitemap.xml
```

Note : `Disallow: /*?*` bloque les URLs avec query params (filtres facettes
dynamiques) — évite l'index de milliers de variantes SEO-inutiles. À
nuancer : la page `/recherche?q=...` sera bloquée (voulu, `noindex` de
toute façon).

g. **Cache** : ISR revalidate 1h sur les sitemaps.

## Étape 3 — Plan détaillé

4-6 sous-passes :

- A : Router `app/sitemap.xml/route.ts` (index)
- B : Routes `app/sitemap-<segment>.xml/route.ts` pour chaque segment
- C : Helper `lib/seo/sitemap-utils.ts` (build sitemap URL, escape, format
  lastmod ISO)
- D : `app/robots.ts` (ou fichier statique si Next < 13.3)
- E : Retirer `next-sitemap` si présent (redondant)
- F : Soumission sitemap dans Google Search Console + Bing Webmaster

## Étape 4 — Implémentation

- Branche `feat/seo-04-sitemap-robots`
- Cache-Control 1h côté serveur
- Aucune dépendance npm supplémentaire

## Contraintes

- Max 50 000 URLs par sitemap segmenté (limite Google)
- Max 50 MB par sitemap non compressé
- Pour Lehena on est très loin des limites — mais garder la segmentation
  pour la scalabilité et la lecture par Google

## Ce que tu NE fais PAS

- Mettre les pages `noindex` dans le sitemap (checkout, account, filtres)
- Bloquer `/static/` (images produits — le Google Image crawler doit
  passer)
- Bloquer `/feed/google-merchant.xml` (le crawler Merchant doit y accéder)

Vas-y, commence par l'étape 1.

```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr/sitemap.xml` renvoie un index XML valide
- [ ] Chaque `sitemap-*.xml` référencé renvoie du XML valide
- [ ] `curl https://lehena.fr/robots.txt` renvoie le robots avec la ref sitemap
- [ ] Aucun 404 sur les URLs listées dans les sitemaps (sample de 20)
- [ ] Sitemap soumis dans Google Search Console → statut "Success"
- [ ] Sitemap soumis dans Bing Webmaster Tools

## Pièges courants

- **`lastmod` mal formaté** (pas ISO 8601 `YYYY-MM-DD` ou avec fuseau) →
  invalide.
- **URLs avec query params** dans le sitemap → Google warn.
- **URL avec `#anchor`** → à supprimer, Google ignore.
- **hreflang alternates sans `x-default`** → warning Search Console.
- **`priority` à 1.0 partout** → aucun effet (Google ignore), autant retirer.

## Commit final

`feat(seo): segmented sitemap (products/categories/pages/articles) + robots.txt`
```
