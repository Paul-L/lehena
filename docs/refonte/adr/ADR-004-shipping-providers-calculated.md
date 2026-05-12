# ADR-004 — Shipping : custom providers Chronofresh / Colissimo avec prix calculés

- **Status** : Accepted
- **Date** : 2026-05-11
- **Décideurs** : Paul
- **Phase concernée** : Phase 5 — Checkout & paiement
- **Supersede partiellement** : [ADR-003](./ADR-003-livraison-paiement-strategy-v1.md) § 1 (Chronofresh V1)

## Contexte

ADR-003 avait choisi pour V1 de :

- garder `manual_manual` comme provider de fulfillment
- exprimer les tranches de prix Chronofresh / Colissimo via des **shipping options en `price_type: "flat"`** avec une option par tranche de poids, restreinte par les `rules` natives Medusa (`attribute: total_weight`).

Au moment d'implémenter Phase 5, deux constats ont fait évoluer la décision :

1. **Lisibilité côté boutique** : multiplier les shipping options (une par tranche de poids × par zone × par profil) revient à exposer une trentaine d'options dans le checkout. Le storefront doit donc filtrer agressivement par poids, et un changement de tarif demande de revoir toutes les lignes.
2. **Mixed-cart logic** (fresh + ambient → forcer chronofresh) : oblige à dupliquer des options Chronofresh sur le profil ambient. Avec des options flat, ça veut dire dupliquer toutes les tranches de poids une seconde fois. Insoutenable.

La solution alternative — un **fulfillment provider custom avec `price_type: "calculated"`** — coûte ~150 lignes (service + grille tarifaire + index) et résout les deux problèmes simultanément :

- Une seule option visible par zone, par profil
- Une seule source de vérité pour la grille (un objet TypeScript versionné)
- Les règles métier (free shipping, mixed cart) restent en un seul endroit

## Décision

### 1. Implémentation custom providers en V1, sans API externe

- Module `apps/backend/src/modules/fulfillment-chronofresh/` : service étend `AbstractFulfillmentProviderService`, identifier `chronofresh`. Méthodes `getFulfillmentOptions`, `calculatePrice`, `canCalculate` implémentées. `createFulfillment` / `cancelFulfillment` retournent `{ data: {}, labels: [] }` — pas d'appel API.
- Idem pour `apps/backend/src/modules/fulfillment-colissimo/`.
- Pricing dans `pricing.ts` au format `cents EUR` (cf. règle Medusa `data-price-format`).
- Free shipping > 50 € TTC géré dans `calculatePrice`, configurable via `FREE_SHIPPING_THRESHOLD_CENTS`.

### 2. Mixed cart → cold chain forcée

- Le seed déclare des options **Chronofresh (mixed)** sur le profil `ambient_colissimo` (zones FR + EU). Quand le cart contient à la fois fresh et ambient, le storefront masque les options Colissimo et ne montre que les options Chronofresh — pour les deux profils. La grille de prix Chronofresh s'applique au poids total.
- Détection mixed cart côté storefront via `classifyCartProfiles(items)` (regarde `product.shipping_profile.name`).
- Banner UX explicite (`MixedCartNotice`) au-dessus du picker de livraison.

### 3. Wiring API réelles = post-launch

Les variables d'environnement `CHRONOFRESH_API_*` / `COLISSIMO_API_*` restent déclarées dans `.env.example` mais ne sont pas lues en V1. Quand Paul obtient les contrats commerciaux signés, on remplit ces variables et on connecte :

- `createFulfillment` → appel API pour générer l'étiquette PDF et récupérer le tracking_number
- `cancelFulfillment` → annulation côté transporteur
- `calculatePrice` peut rester sur la grille locale (cohérent avec ce que paie le client) OU bascule sur l'API si nécessaire

C'est un changement de quelques dizaines de lignes par provider, isolé dans `service.ts`.

## Conséquences

**Pro** :

- UX boutique propre (une option par zone/profil) au lieu de la matrice tranche × zone.
- Free shipping et mixed cart en deux endroits, pas trente.
- Migration vers les APIs réelles devient un changement chirurgical, sans toucher au schéma DB.

**Contre** :

- ~150 lignes de provider custom par transporteur. Tests unit indispensables sur la grille.
- Le provider doit rester capable de fonctionner sans API (sinon le checkout casse). On dépend de l'objet `context` Medusa pour récupérer le poids du cart — testé avec mocks dans les unit tests.

## Alma

Inchangé par rapport à ADR-003 : **infrastructure préparée, activation reportée**. Skip explicite décidé en Phase 5 (cf. réponse Paul). Notes backlog dans `docs/refonte/00-PLAN.md` (Phase 11 ou post-bascule).
