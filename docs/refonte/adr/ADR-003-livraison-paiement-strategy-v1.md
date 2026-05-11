# ADR-003 — Livraison Chronofresh & paiement Alma : stratégie V1

- **Status** : Accepted
- **Date** : 2026-05-11
- **Décideurs** : Paul
- **Phase concernée** : Phase 5 — Checkout & paiement (impacts Phase 0/1 sur scope)
- **Supersede partiellement** : ADR-001 § Providers et services

## Contexte

ADR-001 plaçait Chronofresh et Alma comme deux briques exigeant du code custom non négligeable :

- **Chronofresh** : custom fulfillment provider Medusa (API B2B Chronopost, calcul de prix temps réel par poids/zone, génération d'étiquettes, tracking) — estimé 3-5 jours dev + délai d'obtention de l'accès B2B Chronopost (risque P2 du plan global).
- **Alma** : aucun module Medusa v2 publié, donc soit custom provider (3-4 jours), soit fallback hosted-link en redirection post-checkout.

L'ancien site `lehena.fr` tourne sous WooCommerce et y résout les deux questions de manière plus simple :

- **Chronofresh** est configuré côté boutique avec des **tranches de prix manuelles selon le poids du panier** (pas d'appel API temps réel). L'expédition réelle se fait ensuite chez Chronopost mais via un workflow opérationnel hors-ligne (étiquettes générées séparément).
- **Alma** est aujourd'hui pas activé.

## Décision

### 1. Chronofresh V1 = tranches de prix manuelles, pas d'intégration API

On reproduit l'approche WooCommerce existante :

- Plusieurs **shipping options** sous le profil `fresh_chronofresh`, chacune restreinte à une plage de poids du panier via les `rules` natives Medusa (`attribute: total_weight`).
- Prix fixes par tranche, calibrés sur la grille Chronofresh actuelle (que Paul nous fournira en Phase 5 — actuellement stub à 15 €/29 € pour FR/UE).
- Pas de provider Chronofresh custom en V1. Le provider reste `manual_manual` ; le label "Chronofresh (24-48h frais)" est purement informatif côté UX.
- L'opérateur Lehena dépose les colis chez Chronopost et génère les étiquettes en interne, comme aujourd'hui sur WooCommerce.

Idem pour **Colissimo** sous `ambient_colissimo` (tranches manuelles).

### 2. Alma V1 = infrastructure préparée, activation reportée

On déclare et on prépare tout côté code mais sans publier le bouton de paiement :

- Variables `ALMA_API_KEY`, `ALMA_MERCHANT_ID`, `ALMA_MODE` conservées dans `.env.example`.
- Pas de provider Alma intégré en Phase 5. On code le checkout autour de Stripe uniquement.
- À l'activation : on choisira entre custom provider Medusa v2 ou hosted-link, en fonction du compte Alma de Paul à ce moment-là.

### 3. Ce qu'on garde de ADR-001

- Tout le reste de la stack (Stripe, MeiliSearch, Resend, S3 Scaleway, Sentry, Plausible) reste inchangé.
- L'infrastructure des 2 shipping profiles (`fresh_chronofresh` / `ambient_colissimo`) déjà seedée en Phase 1 reste valide. Les options stub flat-price seront remplacées par les tranches manuelles en Phase 5.

## Alternatives considérées

### Chronofresh

- **API temps réel** (option ADR-001 d'origine) — écarté V1 : délai d'obtention des accès B2B + ROI faible vu que l'opérationnel actuel marche déjà avec un calcul manuel. Reportable V2 si le volume justifie l'automatisation (étiquettes + tracking auto).
- **Forfait unique** (un seul prix Chronofresh) — écarté : un envoi de 7,5 kg vs 1 kg ne peut pas avoir le même prix sans rogner les marges ou facturer trop cher les petits paniers.

### Alma

- **Activer dès V1** — écarté : Paul préfère valider la conversion Stripe-seule d'abord, puis ajouter Alma s'il observe des paniers > 200 € abandonnés.
- **Hosted-link en V1 directement** — écarté pour la même raison : on garde le checkout simple, on ajoute Alma quand on aura le signal commercial.

## Conséquences

### Positives

- **~5-7 jours de dev économisés** en Phase 5 (pas de provider Chronofresh, pas de provider Alma).
- **Pas de dépendance** sur l'obtention du compte API Chronofresh B2B — on peut livrer Phase 5 quand on veut.
- **UX identique** côté client : prix de livraison affiché clairement au checkout, transporteur indiqué, pas de différence perceptible avec une intégration API.
- Continuité opérationnelle : l'équipe Lehena conserve son workflow Chronopost actuel.

### Négatives / dettes

- Pas d'étiquettes générées automatiquement en V1 — gestion manuelle côté admin (cf. workflow opérationnel existant).
- Pas de tracking temps réel poussé au client par notre backend (le client recevra son numéro de suivi Chronofresh par mail séparé après dépôt). À automatiser V2 si volume justifie.
- Variables `CHRONOFRESH_API_URL/ACCOUNT/PASSWORD` restent déclarées mais inutilisées en V1 — clair pour l'opérateur, pas de dette technique.
- Alma : code non testé en V1 (puisque non activé), risque de bug latent à découvrir lors de l'activation. À tester quand on l'allumera.

### Suivi

- **Phase 5** : Paul transmet la grille Chronofresh actuelle (poids → prix par zone) au moment du démarrage. On seed les shipping options correspondantes.
- **V1 +6 mois** : revue de la pertinence d'une intégration API Chronofresh selon volume + retours opérationnels.
- **V1 +3 mois** : revue Alma. Si paniers > 200 € abandonnés > X %, on active.
