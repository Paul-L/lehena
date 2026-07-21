# SEO 11 — Reviews aggregation + AggregateRating exposé

## Objectif

Compléter le module reviews (déjà en place, cf. Phase 10 du plan) pour :

1. Exposer `average_rating` + `review_count` sur chaque produit via l'API
2. Injecter `AggregateRating` + `Review` (top 3) dans le schema JSON-LD PDP
3. Afficher les étoiles ★ sur les cards produit dans les grilles catégorie
4. Débloquer le rich result "Product with stars" dans Google SERP

Un produit avec étoiles dans les résultats Google → +20 à +40% de CTR vs
le même produit sans étoiles.

---

## PROMPT À COPIER-COLLER

```
Tu vas exposer les reviews en agrégat pour qu'elles alimentent le schema
Product et l'UI storefront. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/seo/02-schema-product-pdp.md` — dépend de ce prompt
3. `apps/backend/src/modules/review/` — module review actuel
4. `apps/backend/src/api/store/reviews/` (ou équivalent) — routes existantes
5. Doc Google Review snippet : https://developers.google.com/search/docs/appearance/structured-data/review-snippet

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Structure du module review : entités, service, workflows d'approbation
- Comment sont stockés les avis (product_id, customer_id, rating,
  title, body, status: pending|approved|rejected) ?
- Route API GET pour lister les avis d'un produit ?
- Y a-t-il déjà un calcul d'agrégat (moyenne, count) exposé ?
- Le service review a-t-il déjà des méthodes de type `getProductStats(product_id)` ?
- Côté storefront, les étoiles sont-elles déjà affichées sur les cards
  produit et PDP ? Depuis quelle source ?

## Étape 2 — Choix techniques à valider

a. **Calcul agrégat** — deux stratégies :

   **A. À la volée** dans le service (`SUM/AVG` SQL en direct)
   Simple, toujours frais. OK pour < 10k reviews.

   **B. Denormalisé sur Product** (custom fields `avg_rating` +
   `review_count` mis à jour au create/update/delete d'un review)
   Perf max. Complexe (event bus + subscribers).

   Pour Lehena, aller sur **A** pour l'instant (volume faible), on
   passera en B si le volume devient un souci.

b. **Nouvelle route store API** :
```

GET /store/products/:handle/reviews-stats
→ {
average_rating: 4.7, // 1 décimale
review_count: 42,
distribution: {
5: 30, 4: 8, 3: 3, 2: 1, 1: 0
}
}

```

Et :
```

GET /store/products/:handle/reviews?limit=10&offset=0&sort=recent
→ { reviews: [...], count: 42 }

```

Seuls les avis `status = approved` sont exposés.

c. **Extension du payload `/store/products`** — pour éviter un fetch par
produit sur les listes, agrémenter la réponse de chaque product avec :
```

{
...product,
stats: {
avg_rating: 4.7,
review_count: 42
}
}

```
Via un middleware/hook custom Medusa qui enrichit la réponse.

d. **Storefront : affichage étoiles sur cards produit**

Composant `<StarRating value={4.7} count={42} />` :
- 5 étoiles SVG (rouges Lehena) — remplies proportionnellement
- Chiffre décimal "(4.7)"
- Count avec pluriel "42 avis"
- Accessibilité : `aria-label="Note 4.7 sur 5, basée sur 42 avis"`

À ajouter dans `LehenaProductCard`.

e. **PDP** — bloc reviews détaillé :
- Résumé en haut : étoiles moyennes + count + distribution graphique
  (barres 5★/4★/3★/2★/1★)
- Liste des avis (paginée ou "voir plus") : nom (initiales seulement
  pour RGPD si pas de consentement), date, note, titre, body
- Bouton "Laisser un avis" (visible si customer connecté ET a acheté
  ce produit)

f. **Schema.org AggregateRating + Review** dans le Product JSON-LD PDP :
```

"aggregateRating": {
"@type": "AggregateRating",
"ratingValue": "4.7",
"reviewCount": 42,
"bestRating": "5",
"worstRating": "1"
},
"review": [
{
"@type": "Review",
"author": { "@type": "Person", "name": "Marie L." },
"datePublished": "2026-06-15",
"reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
"reviewBody": "Excellent jambon, ..."
}
// top 3 max
]

```

⚠️ Ne PAS émettre `aggregateRating` si `review_count === 0` (Google warn).

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Service `reviewService.getProductStats(product_id)` (avg + count +
distribution)
- B : Routes store `/store/products/:handle/reviews-stats` + `/reviews`
- C : Middleware ou hook Medusa qui injecte `stats` sur `/store/products`
- D : Composant `<StarRating>` (SVG accessible, animation subtile)
- E : Intégration sur `LehenaProductCard` (grilles) + PDP (bloc détaillé)
- F : Extension helper `lib/seo/schemas/product.ts` pour inclure
`aggregateRating` + top 3 reviews
- G : Test Rich Results Test — le badge étoiles apparaît dans la preview

## Étape 4 — Implémentation

- Branche `feat/seo-11-reviews-aggregate`
- Cache `stats` avec `revalidateTag("product-reviews:{id}")` invalidé
par subscriber au CRUD reviews approved
- RGPD : n'exposer que "Prénom + initiale nom" par défaut, sauf si le
reviewer a coché "afficher mon nom complet"

## Contraintes

- Zéro fake reviews (Google détecte les patterns statistiques et
déclasse durement)
- Modération manuelle stricte (workflow admin déjà en place)
- Anti-fraude : 1 review par customer par produit, uniquement si produit
acheté (vérif via order history)

## Ce que tu NE fais PAS

- Auto-approuver les reviews (spam ++)
- Afficher les noms complets par défaut (RGPD)
- Toucher au module review lui-même (déjà fait Phase 10), juste étendre
l'API et l'UI

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://backend.lehena.fr/store/products/jambon-orhi/reviews-stats`
      renvoie avg + count + distribution
- [ ] `/store/products` inclut `stats` sur chaque product
- [ ] Composant `<StarRating>` visible sur toutes les cards produit
- [ ] Bloc reviews détaillé visible sur PDP
- [ ] Rich Results Test sur PDP : bloc "Review snippet" éligible avec ★
- [ ] Un produit sans review n'a PAS `aggregateRating` dans son schema
- [ ] Seuls les customers ayant acheté peuvent laisser un avis

## Pièges courants

- **`ratingValue` en number sans string** — Google accepte, mais schema.org
  spec exige string. Utiliser `"4.7"`.
- **Émettre `aggregateRating` avec `count: 0`** → warning bloquant rich
  result
- **`review` avec plus de 10 items** → Google ignore, alourdit le payload
  → top 3-5 max
- **Noms complets** sans consentement → risque RGPD
- **Distribution ne somme pas au count total** → soit corriger le calcul
  soit omettre

## Commit final

`feat(seo): reviews aggregate stats + AggregateRating in schema + star UI`
