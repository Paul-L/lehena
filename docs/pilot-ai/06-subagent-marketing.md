# Passe 06 — Sous-agent Marketing & promotions

## Objectif

Sous-agent qui aide à concevoir, planifier et créer des promotions cohérentes
avec la performance passée.

Particulièrement sensible : il manipule les promotions Medusa (codes promo,
règles de prix, mises en avant). Garde-fous renforcés : **TOUJOURS via
pending_action**, **JAMAIS de publish direct**.

---

## PROMPT À COPIER-COLLER

```
Passe 06 : Sous-agent "Marketing" — promotions et stratégie commerciale.

## Périmètre

- Agent `MarketingAgent` avec system prompt dédié
- Tools spécifiques marketing (6-8 tools)
- Action handlers pour créer/modifier promotions et règles de prix
- Garde-fous renforcés (limites de remise, validation des dates, anti-cannibalisation)

## Cas d'usage cibles

1. "Je veux faire une promo -20% sur les sweats jusqu'à dimanche soir" →
   l'agent vérifie le catalogue, propose un code promo + règle, suggère
   complémentairement un bandeau de site (qu'il délègue au Site Content agent
   via une note dans la réponse)
2. "Quelle promo a le mieux marché ces 3 derniers mois ?" → analyse historique
3. "Je voudrais déstocker mes t-shirts noirs taille S" → propose une mécanique
   ciblée (promo nominative ou bundle)
4. "Prépare-moi un Black Friday : suggestions de mécaniques" → génère 2-3
   scénarios avec impact estimé qualitatif
5. "Désactive toutes les promos qui se chevauchent avec celle que je viens
   de créer" → audit et propose une dépublication

## Tools spécifiques marketing

À placer dans `src/tools/marketing/`.

### `read_promotion_history`
- Catégorie : `read`
- Input : `{ months?: number (default 6, max 24) }`
- Retourne pour chaque promo passée : code, type, valeur, période, nombre
  d'utilisations, CA généré (approximation : sum des orders avec ce code),
  panier moyen, ratio comparé à la période hors promo

### `analyze_promotion_performance`
- Catégorie : `read`
- Input : `{ promotionId: string }`
- Diagnostic d'une promo : performance, cannibalisation détectée
  (drop des ventes hors promo), taux d'utilisation vs estimation initiale

### `find_destocking_candidates`
- Catégorie : `read`
- Input : `{ minStock?: number (default 20), salesThresholdDays?: number
  (default 90), categoryId?: string }`
- Retourne les variantes avec stock élevé ET ventes faibles sur la période

### `propose_promotion`
- Catégorie : `write` (via pending_action)
- Input :
  ```
  {
    name: string,
    code?: string (auto-generated if not provided),
    type: 'percentage' | 'fixed' | 'free_shipping',
    value: number,
    appliesTo: 'all' | { productIds: string[] } | { categoryIds: string[] },
    minOrderValue?: number,
    startsAt: ISO date,
    endsAt: ISO date,
    usageLimit?: number,
    usageLimitPerCustomer?: number
  }
  ```
- Crée une pending_action `create_promotion` avec preview_data détaillée
- VALIDATIONS strictes :
  - value <= 70 (pas de remise > 70% par sécurité, override possible avec
    confirmation explicite supplémentaire)
  - endsAt > startsAt
  - endsAt <= startsAt + 90 jours (pas de promo > 3 mois sans confirmation)
  - Si appliesTo cible des produits : vérifier qu'ils existent
  - Si code fourni : vérifier qu'il n'est pas déjà utilisé

### `propose_promotion_update`
- Catégorie : `write` (via pending_action)
- Input : `{ promotionId, updates: Partial<PromotionInput> }`
- Mise à jour d'une promo existante (changer dates, remise, scope)

### `propose_promotion_disable`
- Catégorie : `write` (via pending_action)
- Input : `{ promotionId: string, reason?: string }`
- Désactive une promo

### `find_overlapping_promotions`
- Catégorie : `read`
- Input : `{ promotionId?: string, productIds?: string[] }`
- Détecte les promos qui se chevauchent (mêmes produits + dates qui
  overlappent)
- Crucial pour anti-cannibalisation

### `estimate_promotion_impact`
- Catégorie : `read`
- Input : `{ proposalPayload: PromotionInput }`
- Estimation QUALITATIVE basée sur :
  - Performance des promos similaires passées
  - Volume de produits ciblés
  - Saisonnalité (basée sur l'historique)
- Retourne : `{ confidenceLevel: 'low' | 'medium' | 'high', expectedRange:
  string (texte explicatif), historicalReference: string }`
- IMPORTANT : pas de chiffres précis, jamais de "ça va générer 4200 €". Juste
  des comparaisons qualitatives type "comparable à la promo X de mai 2025
  qui avait généré une hausse modérée des ventes pendant 5 jours".

## Action handlers

### `create_promotion` handler
- Appelle le workflow Medusa de création de promotion
- Si succès : retourne `{ promotionId, code, viewUrl }`

### `update_promotion` handler
- Update via workflow Medusa

### `disable_promotion` handler
- Marque la promo comme inactive (ne supprime pas — historique préservé)

## System prompt du MarketingAgent

```
Tu es un consultant marketing e-commerce francophone, spécialisé dans la
stratégie promotionnelle.

Ton rôle : aider le commerçant à concevoir et lancer des promotions
cohérentes, basées sur les données réelles de sa boutique.

Compétences :
- Conception de mécaniques promotionnelles (remise %, montant fixe,
  bundle, free shipping, déstockage ciblé)
- Analyse historique des promotions et de leurs performances
- Détection de cannibalisation et de chevauchements
- Anti-suroffre : tu freines les promos excessives qui abîmeraient la marque

Règles de fonctionnement :
1. Avant toute proposition de promotion, tu CONSULTES :
   - Les promos actives via `list_active_promotions`
   - L'historique récent via `read_promotion_history` (derniers 3-6 mois)
   pour comprendre ce qui a marché.
2. Tu détectes les chevauchements via `find_overlapping_promotions` AVANT
   de proposer.
3. Tu utilises `propose_promotion` qui crée une pending_action. JAMAIS de
   création directe.
4. Tu présentes toujours :
   - La mécanique (type, valeur, scope)
   - La période
   - La justification (pourquoi cette promo, basée sur quel constat)
   - Les éventuels risques (cannibalisation, marge faible, fréquence trop
     élevée)
   - Une suggestion complémentaire pour la mise en avant (bandeau, hero) en
     précisant qu'il faut basculer vers le sous-agent Site Content pour
     l'implémenter
5. Tu n'inventes JAMAIS de chiffres prédictifs. Si tu donnes une estimation,
   tu utilises `estimate_promotion_impact` qui donne du qualitatif.
6. Tu refuses ou alertes si :
   - Plus de 3 promos actives en simultané
   - Une promo > 50% de remise sans justification claire (déstockage massif,
     fin de série...)
   - Une promo dont la période chevauche une promo similaire active
   - Une promo dont les produits ont une marge probable insuffisante
     (l'agent ne connaît pas les marges, mais peut alerter sur le principe)
7. Pour les codes promo : style court, mémorisable, cohérent avec la marque
   (pas de PROMO123). Ex : SWEATS20, BLACKFRIDAY24, SOLDES.

Ton de réponse :
- Conseil stratégique d'abord, exécution ensuite
- Tu es un partenaire qui pose des questions, pas un exécutant aveugle
- Si une demande te semble peu réfléchie, tu poses une question avant
  de proposer

Cas où tu refuses :
- Promotion frauduleuse (faux prix barré, etc.)
- Pratiques contraires aux règles commerciales (ventes à perte hors
  réglementation soldes, etc.)
- Demande d'automatiser la création de promos sans validation user

Tu n'as accès qu'aux tools listés dans tes outils. Tu n'as pas accès aux
marges, aux coûts d'acquisition, aux données concurrentielles externes.
```

## Workflows à créer

### `createPromotionWorkflow`
- Wrap autour du workflow Medusa natif de création de promotion
- Émet `assistant.promotion.created` après création

### `updatePromotionWorkflow`
- Idem pour update

### `disablePromotionWorkflow`
- Marque la promo `is_active = false` (ou équivalent v2)

## Garde-fous spécifiques

- Limite de **3 propositions de promo par conversation** (anti-spam)
- Limite de **2 confirmations de promo par jour par user** (anti-erreur)
  → si dépassé, l'action handler retourne une erreur "Limite quotidienne
  atteinte, contactez l'admin"
- Toute promo > 50% nécessite une **deuxième étape de confirmation** dans la
  pending_action (l'utilisateur doit cocher "je confirme que je veux une
  remise > 50%")

## Tests

- `read_promotion_history` sur une boutique avec et sans historique
- `find_overlapping_promotions` détecte bien les chevauchements
- `propose_promotion` rejette une remise > 70%
- Workflow integration : conversation complète "Promo -20% sweats jusqu'à
  dimanche" → diagnostic, proposition, confirmation, création en base

## Structure de fichiers

```
src/
├── agents/
│   └── marketing-agent.ts
├── tools/marketing/
│   ├── read-promotion-history.ts
│   ├── analyze-promotion-performance.ts
│   ├── find-destocking-candidates.ts
│   ├── propose-promotion.ts
│   ├── propose-promotion-update.ts
│   ├── propose-promotion-disable.ts
│   ├── find-overlapping-promotions.ts
│   ├── estimate-promotion-impact.ts
│   └── index.ts
└── workflows/marketing/
    ├── create-promotion.ts
    ├── update-promotion.ts
    └── disable-promotion.ts

tests/integration/agents/
└── marketing-agent.test.ts
```

## Procédure d'exécution

1. Étudie la doc Medusa v2 sur le module Promotion (entités, types,
   workflows natifs). Stop, présente-moi la synthèse.
2. Crée les workflows wrappers. Stop.
3. Crée les tools `read` (history, performance, find_destocking,
   find_overlapping, estimate_impact). Stop.
4. Crée les tools `write` (propose_*) avec validations strictes. Stop.
5. Crée les action handlers. Enregistre-les. Stop.
6. Crée le `MarketingAgent`. Remplace le stub. Stop.
7. Test integration : conversation complète. Vérifie que tous les garde-fous
   se déclenchent (test une demande -90% → l'agent doit refuser ou demander
   confirmation explicite renforcée).
8. Commit : `feat: marketing subagent with promotion tools`

## Critères de succès

- L'agent route bien depuis l'orchestrateur
- L'agent appelle systématiquement `list_active_promotions` et
  `read_promotion_history` avant de proposer
- Les chevauchements sont détectés et signalés
- Les promos sont toujours créées via pending_action
- Les seuils de garde-fous se déclenchent (>70%, plus de 2/jour, >3 actives)
- L'agent suggère bien le passage vers Site Content pour la mise en avant
  visuelle
- Aucune création de promo directe sans confirmation user

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Le sous-agent fait son diagnostic AVANT de proposer
- [ ] Détection des promos en cours et chevauchements
- [ ] Garde-fous remise élevée et fréquence
- [ ] Workflow Medusa de création promo fonctionne en bout de chaîne
- [ ] L'agent renvoie vers Site Content pour la mise en avant visuelle
- [ ] Pas d'invention de chiffres (vérifie 5-10 conversations)

Le test critique : **demande à l'agent de te créer une promo "à la
mitraillette" sans contexte**. Il doit te poser des questions, pas
exécuter aveuglément.
