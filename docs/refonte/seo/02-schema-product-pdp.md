# SEO 02 — Product schema enrichi sur PDP

## Objectif

Enrichir le schema JSON-LD `Product` sur chaque page produit avec **tous** les
champs qui donnent des rich results Google : `Offer` complet, `Brand` en
`Organization`, `AggregateRating` + `Review`, `hasMerchantReturnPolicy`,
`shippingDetails`, GTIN/MPN si dispo, `nutrition` schema si custom fields
alimentaires renseignés.

Objectif secondaire : les LLMs (ChatGPT, Perplexity, Google AI Overviews)
prennent le schema comme source de vérité factuelle → tes produits sont
cités correctement (prix, dispo, marque, note).

---

## PROMPT À COPIER-COLLER

```
Tu vas enrichir le schema JSON-LD Product déjà en place sur les PDP du
storefront Lehena. Avant tout, lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 4 schemas par template)
3. `apps/storefront/src/lib/seo/schemas/` — les helpers déjà existants
4. `apps/storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx` — où
   le schema est injecté
5. Doc Google Product : https://developers.google.com/search/docs/appearance/structured-data/product

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Quel helper schema Product existe déjà ? (probablement
  `lib/seo/schemas/product.ts`). Décris ce qu'il émet actuellement.
- Quelle est la source de données pour le produit dans la page PDP —
  server component ou getStaticProps ?
- Y a-t-il déjà un système de reviews en place (cf. `apps/backend/src/modules/review/`) ?
  Comment on récupère `average_rating` et `review_count` pour un produit ?
- Les custom fields Lehena (aging_months, ingredients, allergens, weight_grams,
  nutritional) sont-ils déjà dans le payload retourné par `/store/products/:handle` ?

## Étape 2 — Choix techniques à valider

a. **Champs Product à ajouter/enrichir** :
   - `@type: "Product"` ✅
   - `name`, `description`, `image[]` (min 3 images high-res 1200x1200+)
   - `sku`, `mpn` = variant.sku (fallback product.sku)
   - `gtin` si dispo (probablement non pour l'artisanal — omettre)
   - `brand`: { `@type: "Brand"`, `name: "Maison Lehena"` }
     OU mieux : `brand`: { `@type: "Organization"`, `name`, `logo`, `url` }
     pour connecter au Knowledge Panel
   - `manufacturer` : idem Organization Lehena
   - `category` = catégorie principale (breadcrumb text)
   - `offers`:
     - `@type: "Offer"` (ou `AggregateOffer` si N variantes)
     - `url` = URL PDP absolue
     - `priceCurrency`, `price`
     - `priceValidUntil` = 1 an dans le futur (obligatoire pour rich results)
     - `availability` (InStock, OutOfStock, PreOrder)
     - `itemCondition: "NewCondition"`
     - `seller` = Organization Lehena
     - `hasMerchantReturnPolicy` : link vers CGV ou objet inline (14 jours
       de rétractation par défaut FR)
     - `shippingDetails` : freeShippingThreshold 50 € + délai 24-48h
       Chronofresh (via customs field `conservation_temp`)
   - `aggregateRating` (si reviews module actif ET au moins 1 avis) :
     - `@type: "AggregateRating"`, `ratingValue`, `reviewCount`, `bestRating: 5`
   - `review` (top 3 avis approuvés)
   - **Champs alimentaires Lehena** : ajouter en `additionalProperty[]`
     - aging_months → { name: "Affinage", value: "24 mois" }
     - origin → { name: "Origine", value: "Pays Basque" }
     - breed → { name: "Race", value: "Duroc" }
     - nitrite_free → { name: "Sans nitrite", value: true }
     - ingredients → texte
     - allergens → liste

b. **Nutrition schema** (bonus rich result "Nutrition Facts") :
   Si `custom_fields.nutritional` est renseigné, injecter aussi
   `nutrition: { @type: "NutritionInformation", calories, fatContent,
   saturatedFatContent, sodiumContent, proteinContent, carbohydrateContent,
   servingSize }`. Format Google : nombres + unité `"12 g"`.

c. **Multi-variantes** — comment gérer plusieurs variantes ?
   - Option A : un seul Product avec `offers: AggregateOffer` (lowPrice /
     highPrice). Simple mais perd la granularité par variante.
   - Option B : un Product par variante (côté SEO = 5 URLs distinctes). Plus
     lourd, préféré si les variantes ont des noms distincts (ex: Jambon
     entier vs demi vs quart).
   - Recommande selon le catalogue Lehena.

d. **hasMerchantReturnPolicy** — champ obligatoire pour les rich results
   depuis 2023. Format :
```

{
"@type": "MerchantReturnPolicy",
"applicableCountry": "FR",
"returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
"merchantReturnDays": 14,
"returnMethod": "https://schema.org/ReturnByMail",
"returnFees": "https://schema.org/FreeReturn"
}

```

e. **shippingDetails** — également requis :
```

{
"@type": "OfferShippingDetails",
"shippingRate": {
"@type": "MonetaryAmount",
"value": "0.00", // free si > 50€
"currency": "EUR"
},
"shippingDestination": { "@type": "DefinedRegion", "addressCountry": "FR" },
"deliveryTime": {
"@type": "ShippingDeliveryTime",
"handlingTime": { "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
"transitTime": { "minValue": 1, "maxValue": 2, "unitCode": "DAY" }
}
}

```

## Étape 3 — Plan détaillé

4-6 sous-passes :

- A : Étendre le helper `lib/seo/schemas/product.ts` avec tous les nouveaux
champs (Brand → Organization, hasMerchantReturnPolicy, shippingDetails,
additionalProperty pour custom fields)
- B : Ajouter `lib/seo/schemas/nutrition.ts` (helper NutritionInformation)
- C : Ajouter `lib/seo/schemas/return-policy.ts` (MerchantReturnPolicy réutilisable)
- D : Ajouter `lib/seo/schemas/shipping.ts` (OfferShippingDetails réutilisable)
- E : Brancher les reviews (aggregateRating + top 3 reviews) — dépend du prompt 11
- F : Test Rich Results sur 3 PDP différentes (jambon, patxaran, coffret)

## Étape 4 — Implémentation

- Branche `feat/seo-02-product-schema-enriched`
- Le helper reste pur : reçoit un Product Medusa + optionnel reviews[], retourne l'objet JSON-LD
- Injection via le composant `<JsonLd>` déjà en place

## Contraintes

- TypeScript strict — typer les shapes JSON-LD (interfaces exportées)
- Ne JAMAIS émettre `null` / `undefined` dans le JSON-LD (Google warn)
- Escape correct des characters spéciaux (déjà fait par JSON.stringify)
- Ne pas exploser la taille de la page — le schema PDP peut peser 3-5 kB max, OK

## Ce que tu NE fais PAS

- Implémenter le module reviews (c'est le prompt 11)
- Toucher aux schemas Organization / WebSite (c'est le prompt 03)
- Modifier le layout global

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr/fr/products/jambon-orhi-desosse-24-mois | grep -A100 "application/ld+json"` renvoie un Product schema avec tous les champs
- [ ] Rich Results Test (https://search.google.com/test/rich-results) : 0 erreur, 0 warning bloquant sur 3 PDP différentes
- [ ] Schema.org Validator (https://validator.schema.org) : passe sur les mêmes 3 PDP
- [ ] Le schema contient `hasMerchantReturnPolicy` et `shippingDetails`
- [ ] Si reviews présents : `aggregateRating` avec `ratingValue`, `reviewCount`, `bestRating`
- [ ] `additionalProperty` contient les custom fields Lehena (aging_months, breed, etc.)
- [ ] Si `nutritional` renseigné : `nutrition` object valide

## Pièges courants

- **`priceValidUntil` manquant** → warning bloquant (rich result perdu)
- **Prix en `24,90`** au lieu de `24.90` → invalide (schema.org attend point décimal)
- **`image` en URL relative** → invalide (schema.org exige URL absolue)
- **`availability` sans le préfixe schema.org** → `"InStock"` KO, `"https://schema.org/InStock"` OK
  (les deux formats sont tolérés par Google mais préférer le préfixé)
- **`aggregateRating` avec 0 reviews** → warning. Ne PAS émettre si count = 0.

## Commit final

`feat(seo): enrich Product schema with Offer complete, MerchantReturnPolicy, shippingDetails, additionalProperty, nutrition`
