# SEO 01 — Google Merchant Center Feed

## Objectif

Exposer sur le storefront une URL `https://lehena.fr/feed/google-merchant.xml`
qui sérialise TOUS les produits publiés au format Google Merchant Feed. Cette
URL sera pointée depuis Merchant Center → Free Listings apparaissent sur
Google Shopping (tab gratuit) → **~20-40% de trafic ecommerce supplémentaire
non payé**.

C'est le levier SEO le plus rentable pour un catalogue niche premium
comme Lehena.

---

## PROMPT À COPIER-COLLER

```
Tu vas implémenter le feed Google Merchant Center pour le storefront Lehena.
Avant tout, lis :

1. `docs/refonte/seo/README.md` — la série SEO globale
2. `docs/refonte/strategie-seo.md` — la doctrine SEO
3. `apps/storefront/src/lib/data/products.ts` — comment fetch les produits
4. Spec Google Merchant XML (RSS 2.0 avec namespace g:) :
   https://support.google.com/merchants/answer/7052112

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Comment fetch la liste complète des produits publiés (avec pagination
  si > 250) depuis le SDK Medusa côté server ?
- Quels champs custom sont disponibles sur nos produits Lehena
  (aging_months, origin, breed, nitrite_free, allergens, weight_grams,
  ddm_days, etc.) ? Cf. `apps/backend/src/modules/catalog/`.
- Comment les variantes sont structurées et exposent-elles GTIN / SKU ?
- Quelle URL absolue pour chaque produit côté storefront
  (base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://lehena.fr") ?

## Étape 2 — Choix techniques à valider

a. **Route Next.js** — `apps/storefront/src/app/feed/google-merchant.xml/route.ts`
   qui répond en `application/xml`. ISR revalidation 1h (produits ne changent
   pas si vite, on économise du Medusa).

b. **Format Google Merchant XML** : RSS 2.0 avec namespace `xmlns:g`. Chaque
   `<item>` doit contenir au minimum :
   - `<g:id>` = variant.id (ou product.id si mono-variant)
   - `<g:title>` = product.title (max 150 chars)
   - `<g:description>` = product.description (max 5000, strip HTML)
   - `<g:link>` = URL absolue PDP
   - `<g:image_link>` = image principale absolue (min 100x100, recommandé 800x800+)
   - `<g:additional_image_link>` = jusqu'à 10 images sup
   - `<g:availability>` = "in_stock" | "out_of_stock" | "preorder"
   - `<g:price>` = "24.90 EUR" (format 2 décimales + code devise)
   - `<g:brand>` = "Maison Lehena"
   - `<g:condition>` = "new"
   - `<g:google_product_category>` = "Food, Beverages & Tobacco > Food Items >
     Meat & Seafood > Meat" (pour jambons) ; à mapper selon catégorie Medusa
   - `<g:product_type>` = arbo interne "Charcuterie > Jambon Orhi"
   - `<g:gtin>` = si dispo (EAN13 sur les produits industriels — à défaut
     omettre, Google accepte pour l'artisanal)
   - `<g:mpn>` = SKU produit (fallback si pas de GTIN)
   - `<g:identifier_exists>` = "no" si pas de GTIN/MPN

c. **Custom fields Lehena spécifiques** à ajouter :
   - `<g:shipping_weight>` en grammes → converti selon `weight_grams`
   - `<g:material>` non applicable, mais `<g:size_type>` "regular"
   - Attributs libres via `<g:custom_label_N>` (0-4) pour taguer
     "sans_nitrite", "affinage_24_mois", "duroc" etc. — utile pour
     segmenter les campagnes Google Ads plus tard.

d. **Multi-variantes** : chaque variante = un `<item>` distinct (Google exige
   ça pour les tailles/couleurs). Utiliser `<g:item_group_id>` = product.id
   pour lier les variantes d'un même produit parent.

e. **Filtrage** : ne pas inclure les produits :
   - Non publiés (`status !== "published"`)
   - Sans image
   - Sans prix ou prix 0
   - Sans stock (à débattre — mettre `out_of_stock` plutôt qu'omettre)

f. **Cache & perf** :
   - `revalidate` Next.js à 3600 (1h)
   - Header `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
   - Compression gzip par Traefik (activée par défaut)

g. **URL de découverte** : ajouter `<link rel="alternate" type="application/xml"
   title="Google Merchant Feed" href="/feed/google-merchant.xml" />` dans
   le `<head>` global du storefront.

## Étape 3 — Plan détaillé

3-5 sous-passes :

- A : Helper `buildMerchantFeed(products): string` dans `lib/seo/merchant-feed.ts`
  pur, testable, sans dépendance Next
- B : Route `app/feed/google-merchant.xml/route.ts` qui fetch les produits et
  appelle le helper
- C : Mapping catégorie Medusa → `google_product_category` dans
  `lib/seo/google-product-category.ts` (dictionnaire)
- D : Header `<link rel="alternate">` global
- E : Tests unitaires du helper (snapshot XML + 3-5 cas de figure)
- F : Validation Merchant Center Diagnostic tool

## Étape 4 — Implémentation

- Branche `feat/seo-01-merchant-feed`
- Type strict, sanitisation XML (échapper `&`, `<`, `>`, `'`, `"`)
- Le helper de sérialisation ne fait AUCUN fetch — reçoit des Products en
  paramètre, retourne une string XML

## Contraintes

- Zéro dépendance npm supplémentaire pour parser XML (concat de strings avec
  helper `xmlEscape`)
- Pas de HTML dans les descriptions Google — strip via une fonction propre
- Pas plus de 20 000 items par feed (limite Google) — pour Lehena on est
  très loin
- Réponse < 200 Mo (idem, loin)

## Ce que tu NE fais PAS

- La création du compte Merchant Center (manuel côté Paul)
- La verification du domaine (DNS TXT record côté Cloudflare/registrar,
  manuel)
- La configuration de "Free Listings" dans Merchant Center (manuel)
- Le suivi des impressions/clics (viendra plus tard via Merchant Center API
  ou GA4)

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr/feed/google-merchant.xml | head -50` renvoie du XML valide
- [ ] Le feed contient tous les produits publiés (compter les `<item>` vs count DB)
- [ ] Chaque item a bien : id, title, description, link (absolue), image_link (absolue), price, availability, brand, condition
- [ ] Prix formatés `XX.XX EUR` (pas `XX,XX` ni `XX EUR`)
- [ ] `google_product_category` mappé pour toutes les catégories Lehena
- [ ] Header `<link rel="alternate" type="application/xml">` visible dans le HTML de la home
- [ ] Cache-Control renvoie `s-maxage=3600`
- [ ] Feed uploadé dans Google Merchant Center → Products → Feeds → Add feed → "Scheduled fetch" quotidien
- [ ] Diagnostic Merchant Center 0 erreur, 0 warning bloquant

## Pièges courants

- **Prix avec virgule** au lieu de point → refusé. `24,90 EUR` NON, `24.90 EUR` OUI.
- **URL images non HTTPS** → refusé.
- **Description contient `&` non échappé** → XML invalide.
- **`google_product_category`** mal formaté → warning MC mais non bloquant, à corriger.
- **GTIN vide** sans `identifier_exists=no` → warning.
- **Multi-devise** : notre feed est mono-devise EUR pour l'instant. Si tu
  ajoutes GBP/USD plus tard, il faut un feed par devise.
- **Robots.txt** : ne PAS bloquer `/feed/*` ! Merchant crawler doit pouvoir
  le lire.

## Commit final

Branche : `feat/seo-01-merchant-feed`.
Commit : `feat(seo): google merchant center feed at /feed/google-merchant.xml`.
