# Phase 5 — Checkout & paiement (Stripe + Alma + Chronofresh + Colissimo)

## Objectif de cette passe

Refondre le cart, construire un tunnel de checkout 3 étapes (livraison →
paiement → récap), brancher Stripe Elements (CB + Apple/Google Pay) et Alma
(3x), implémenter les fulfillment providers Chronofresh et Colissimo avec
des règles de tarifs par poids/zone, gérer cartes cadeaux + codes promo +
message cadeau + emballage cadeau.

C'est la phase la plus risquée du projet : elle bloque la bascule prod
(Phase 14). Dépendances externes : grille tarifaire Chronofresh + statut
module Alma.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 5 — Checkout & paiement** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 5 § 3 et § 5 Risques)
2. `docs/refonte/audit-site-actuel.md` (mention Chronofresh ancien site, frais offerts dès 50 €)
3. `docs/refonte/strategie-seo.md` (§ 11→Phase 5)

Confirme-moi avoir lu avant de commencer.

## Étape 1 — Reconnaissance

- Quel est l'état du cart actuel côté storefront
  (`app/[countryCode]/(main)/cart/page.tsx`, `lib/data/cart.ts`,
  `modules/cart/`) ?
- Quelle est la route checkout actuelle (`app/[countryCode]/(checkout)/checkout/page.tsx`) ?
- Quel provider de paiement est configuré côté backend (`medusa-config.ts`) ?
  J'attends "aucun".
- Quels profils de livraison existent (Phase 1 : `fresh_chronofresh`,
  `ambient_colissimo`) ?
- Y a-t-il des modules custom de paiement ou livraison amorcés ?
- Disponibilité du module **Alma pour Medusa v2** : cherche dans
  https://github.com/getalma et dans npm. Signale-moi si bloquant.

## Étape 2 — Choix techniques à valider

a. **Cart** :
   - Page panier + drawer mini-cart (déjà en Phase 2) cohérents : même data,
     même actions.
   - Custom fields line item : `gift_message` (string nullable),
     `gift_wrap` (bool — produit "papier cadeau" en cross-sell automatique).
   - Mise à jour quantité + suppression + sauvegarde panier 30 jours.
   - Affichage TVA détaillée (HT + TVA 5,5 / 20 % séparés).
   - Codes promo : champ visible, validation côté Medusa.

b. **Tunnel checkout 3 étapes** :
   1. **Livraison** : adresse (autocomplete via Google Places ou
      adresses.data.gouv.fr — privilégier ce dernier, gratuit FR), choix
      profil livraison (auto si panier mono-profile, choix forcé si mixte),
      date d'expédition estimée affichée.
   2. **Paiement** : Stripe Elements (CB, Apple Pay, Google Pay) + Alma 3x
      conditionné (panier > 50 €, < 3000 €).
   3. **Récapitulatif** : récap commande + CGV à cocher + bouton "Payer".
   - UX : breadcrumb du tunnel, étapes cliquables si validées, bouton "Retour".
   - Accessibilité : tunnel intégralement navigable au clavier, ARIA-live
     sur les erreurs.

c. **Stripe** :
   - Module officiel `@medusajs/payment-stripe` Medusa v2.
   - Stripe Elements côté Next : `@stripe/react-stripe-js` (déjà en deps).
   - Webhooks : `payment_intent.succeeded`, `payment_intent.payment_failed`
     branchés sur Medusa workflows.

d. **Alma** :
   - Si module communautaire fonctionnel : l'intégrer.
   - Sinon : implémenter un payment provider custom Medusa qui appelle l'API
     Alma (création de payment, redirection, webhook de validation). Garde
     ça mince et bien testé.

e. **Fulfillment providers** :
   - `chronofresh` : provider custom Medusa. Calcule le tarif à partir de
     {poids total panier, zone destination, jour de la semaine}. Grille
     tarifaire chargée depuis un seed (cf. risque P5). Génère une
     étiquette via API Chronofresh à la création de la fulfillment.
   - `colissimo` : idem, plus simple (tarifs publics, pas de chaîne du froid).
   - **Frais offerts > 50 €** (ou seuil configurable) :
     règle métier dans le calcul de tarif. Faut-il appliquer au seuil HT ou
     TTC ? Recommande.
   - **Panier mixte** : si le panier contient `fresh` ET `ambient`, on
     impose-t-il `chronofresh` pour tout (simple, sûr) ou bien on autorise
     2 envois séparés (complexe, conversion ++) ? Recommande.

f. **Cartes cadeaux** : utiliser le module natif Medusa.

g. **Emballage cadeau / message** :
   - Produit "Emballage cadeau" cross-sellé en panier (12-15 €) ou checkbox
     gratuite/payante au checkout ?
   - Message cadeau : textarea (max 200 caractères), imprimé sur carton
     (workflow d'impression à brancher avec atelier).

h. **CGV + email confirmation** :
   - Checkbox CGV obligatoire avant payment intent.
   - Email confirmation envoyé via Resend (Phase 7) — ici on logue le payload.

## Étape 3 — Plan détaillé

7-9 sous-passes :

- A : Refonte cart + custom fields gift_message / gift_wrap + UX page panier.
- B : Tunnel checkout 3 étapes + composants (Adress form, Shipping select,
  Order summary).
- C : Provider Stripe + Elements + webhooks.
- D : Provider Alma (custom ou module).
- E : Provider Chronofresh (custom).
- F : Provider Colissimo (custom).
- G : Règles métier (frais offerts, panier mixte, TVA détaillée).
- H : Tests E2E manuels documentés + un test Playwright minimum (Phase 13
  ajoutera le reste).

## Étape 4 — Implémentation

- Branche `feat/phase-5-checkout-paiement`.
- Cards Stripe en mode **test** (clés `pk_test_` / `sk_test_`).
- Alma en mode **sandbox** si possible, sinon mocké derrière un toggle env.
- Chronofresh / Colissimo en **mode mock** par défaut (clé env
  `FULFILLMENT_MOCK=true`) : retourne un tarif calculé localement sans appeler
  l'API. À débrancher manuellement quand les contrats commerciaux sont signés.

## Contraintes (rappel)

- TypeScript strict.
- Validation zod sur tous les payloads checkout.
- Workflows Medusa pour create/update payment, create fulfillment.
- Pas de manipulation de cart depuis un Client Component sans passer par
  les actions Next (RSC actions).
- Idempotence : retentes de webhook doivent être safe.
- Logs structurés (préparation Phase 12) sur chaque étape critique du tunnel.

## Ce que tu NE fais PAS

- Pas d'envoi d'email réel (Phase 7).
- Pas de subscription/abonnement (Phase 11).
- Pas de génération de PDF facture (Phase 6 ou Phase 10).
- Pas de tests E2E complets (juste le squelette ; complétés Phase 13).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Une commande complète en CB Stripe test va de panier → checkout →
      confirmation, avec email logué.
- [ ] Une commande en Alma (sandbox ou mock) idem.
- [ ] Frais offerts > 50 € appliqués correctement.
- [ ] Panier mixte (fresh + ambient) déclenche le comportement choisi.
- [ ] TVA 5,5 / 20 % correctement séparée dans le récap.
- [ ] Webhook Stripe `payment_intent.succeeded` met bien la commande à
      `captured` côté Medusa.
- [ ] Webhook Stripe `payment_intent.payment_failed` : commande reste
      `awaiting` et l'utilisateur peut retenter.
- [ ] Tunnel accessible 100% au clavier.
- [ ] Code promo invalide → message d'erreur clair, pas de crash.
- [ ] Message cadeau et emballage cadeau remontent dans l'admin Medusa.

## Pièges courants

- **Stripe 3DS** : tester explicitement une carte qui déclenche 3DS
  (`4000002760003184`). Le flow Stripe Elements gère le retour, mais le
  webhook côté Medusa doit bien gérer le statut `requires_action`.
- **Webhook signature** : vérifier la signature Stripe sinon faille de sécu.
- **Panier mixte** : si on choisit "1 seul profil le plus contraignant",
  bien le COMMUNIQUER au client (message visible).
- **Chronofresh = chaîne du froid** : pas de livraison samedi-dimanche
  facilement, à intégrer dans le calcul de date d'expédition affichée.
- **Alma scope** : Alma n'est pas un "vrai" provider de paiement au sens
  Stripe, c'est un crédit consommateur. Bien gérer la séparation des montants
  et des statuts. Lire la doc Alma Pay attentivement.

## Commit final

Branche : `feat/phase-5-checkout-paiement`.
Commit : `feat(checkout): cart, 3-steps tunnel, stripe + alma, chronofresh + colissimo`.
