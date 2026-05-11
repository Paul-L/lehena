# Passe 08 — Sous-agent Analytics & diagnostic

## Objectif

Sous-agent **read-only** : il analyse, diagnostique, recommande, mais ne
modifie rien lui-même. S'il détecte une action à faire, il suggère de
basculer vers le sous-agent compétent.

C'est le sous-agent le plus simple à implémenter (pas d'écriture, pas de
pending_action complexes), mais celui qui demande **le plus de soin sur les
prompts** : c'est lui qui doit poser les bonnes questions et raisonner sur
les chiffres sans halluciner.

---

## PROMPT À COPIER-COLLER

```
Passe 08 : Sous-agent "Analytics" — diagnostic et recommandations.

## Périmètre

- Agent `AnalyticsAgent` 100% read-only
- Tools spécifiques d'analyse (réutilise massivement les tools shared +
  ajouts ciblés)
- Pas de write tools, pas d'action handlers
- Pas de pending_actions
- Garde-fous : raisonnement transparent, sources des chiffres explicites

## Cas d'usage cibles

1. "Pourquoi ce produit ne se vend pas ?" → analyse fiche, prix, position
   catalogue, comparaison avec produits similaires qui marchent
2. "Quels sont mes 10 meilleurs produits ce mois-ci ?" → analyse simple
3. "Mon CA a baissé la semaine dernière, pourquoi ?" → diagnostic
   multi-facteurs (pas une seule cause supposée)
4. "Quelles catégories sous-performent par rapport au mois dernier ?" →
   comparaison période sur période
5. "Quels produits devrais-je mettre en avant cette semaine ?" → croisement
   stock disponible, marge probable, actualité saisonnière
6. "Suggère-moi des cross-sells pour le produit X" → analyse des paniers
7. "Montre-moi l'évolution de mon panier moyen sur 6 mois" → visualisation
   textuelle (l'agent ne génère pas de graphiques)

## Tools spécifiques analytics

À placer dans `src/tools/analytics/`. La plupart sont des read additionnels
qui complètent les tools shared.

### `compare_periods`
- Catégorie : `read`
- Input : `{ metric: 'revenue' | 'orders' | 'avg_order_value' |
  'unique_customers', period: 'week' | 'month' | 'quarter',
  comparison: 'previous_period' | 'previous_year' }`
- Retourne : valeur période actuelle, valeur période comparaison, delta absolu,
  delta %, breakdown jour par jour (ou semaine par semaine selon période)

### `analyze_product_underperformance`
- Catégorie : `read`
- Input : `{ productId: string }`
- Diagnostic multi-facteurs :
  - Prix vs catégorie (surprix ?)
  - Position du produit dans le catalogue
  - Présence dans des collections / mises en avant
  - Stock disponible
  - Qualité de la fiche (réutilise `analyze_product_seo`)
  - Comparaison avec 3 produits similaires de la même catégorie
- Retourne une liste d'hypothèses ordonnées par probabilité, chacune avec
  une suggestion d'action et le sous-agent à appeler

### `find_top_movers`
- Catégorie : `read`
- Input : `{ direction: 'up' | 'down', period: 'week' | 'month',
  limit?: number (default 10) }`
- Retourne les produits avec la plus forte variation (ventes ou CA) sur la
  période vs période précédente

### `analyze_basket_associations`
- Catégorie : `read`
- Input : `{ productId?: string, minSupport?: number (default 0.05) }`
- Retourne les associations fréquentes : "X est acheté avec Y dans Z%
  des paniers"
- Si `productId` fourni : associations pour ce produit
- Sinon : top 20 associations toutes catégories
- IMPORTANT : algorithme simple (apriori basique), documenter que c'est
  indicatif, pas du machine learning

### `analyze_category_performance`
- Catégorie : `read`
- Input : `{ categoryId: string, period: 'last_30_days' | 'last_90_days' }`
- Retourne : CA, nombre de commandes, top produits, produits qui sous-performent

### `forecast_stock_runout`
- Catégorie : `read`
- Input : `{ thresholdDays?: number (default 30) }`
- Pour chaque variante : calcule la vélocité moyenne (ventes/jour sur 30j)
  et estime quand le stock arrivera à 0
- Retourne les variantes qui vont être en rupture sous `thresholdDays` jours
- Pratique : "Quels produits dois-je réapprovisionner ce mois-ci ?"

### `suggest_products_to_feature`
- Catégorie : `read`
- Input : `{ count?: number (default 4), criteria?: 'best_sellers' |
  'high_margin_estimate' | 'overstocked' | 'new_arrivals' | 'mixed' }`
- Suggère des produits à mettre en avant sur la home, selon le critère
- IMPORTANT : pour `high_margin_estimate`, l'agent ne connaît pas les
  marges réelles — il utilise un proxy (prix élevé + bonne rotation = candidat
  probable). Documenter et expliquer dans la réponse.

## System prompt du AnalyticsAgent

```
Tu es un consultant analytics e-commerce francophone, spécialisé dans le
diagnostic et la recommandation basée sur les données.

Ton rôle : aider le commerçant à comprendre ce qui se passe dans sa boutique
et à identifier les leviers d'amélioration.

Compétences :
- Analyse de performances (CA, commandes, panier moyen, conversions)
- Diagnostic de produits qui sous-performent
- Identification des tendances (top movers up/down)
- Suggestions de mise en avant et de cross-sell
- Forecasting simple (rupture stock, saisonnalité)

Règles de fonctionnement :
1. Tu ne donnes JAMAIS un chiffre sans l'avoir récupéré via un tool. Si le
   tool n'existe pas, tu le dis explicitement et tu ne fabriques pas la
   donnée.
2. Quand tu donnes un chiffre, tu cites toujours sa source : période,
   méthode, tool utilisé. Ex : "Sur les 30 derniers jours (calcul à partir
   des commandes confirmées via `get_sales_metrics`)".
3. Pour les diagnostics : tu donnes plusieurs hypothèses ordonnées par
   probabilité, jamais une seule cause "certaine". Format :
   "Hypothèse 1 (probable) : ... | Hypothèse 2 (possible) : ... |
    Hypothèse 3 (à exclure) : ..."
4. Quand tu identifies un problème actionnable, tu rediriges vers le bon
   sous-agent : "Pour optimiser la fiche, demande-moi de basculer vers le
   sous-agent SEO" / "Pour créer une promo de déstockage, je peux basculer
   vers le sous-agent Marketing".
5. Tu ne FAIS rien toi-même : tu n'as pas de tools d'écriture. Tu observes,
   diagnostiques, recommandes.
6. Pour les comparaisons de périodes : tu rappelles toujours qu'une variation
   peut s'expliquer par la saisonnalité ou par un événement ponctuel
   (jour férié, opération marketing, etc.). Tu invites à vérifier le contexte.
7. Pour les forecasts : tu utilises des termes prudents ("probablement",
   "à confirmer", "tendance observée"). Pas de "ça va arriver".
8. Si tu n'as pas assez de données pour répondre (ex: une boutique récente
   avec peu d'historique), tu le dis clairement et tu suggères une période
   d'attente.

Ton de réponse :
- Structuré : utilise des sections (Constat, Diagnostic, Recommandation)
- Chiffré quand pertinent, mais sans surcharger
- Pédagogique : explique brièvement la méthode quand c'est utile

Tu n'as PAS accès :
- Aux marges réelles des produits (l'agent ne connaît que les prix de vente)
- Aux données de trafic externe (Google Analytics, sources, mots-clés)
- Aux avis clients
- Aux données concurrentielles
Si on te demande quelque chose qui requiert ces données, tu le dis
explicitement.

Cas où tu refuses :
- Prédiction de chiffres précis ("tu vas faire X € le mois prochain")
- Conseils financiers / d'investissement
- Analyses qui requièrent des données personnelles clients (RGPD)
```

## Tests

- Conversation "Quel est mon CA ce mois-ci ?" → l'agent appelle
  `get_sales_metrics`, donne le chiffre avec la source
- Conversation "Pourquoi ce produit ne se vend pas ?" → appelle
  `analyze_product_underperformance`, donne 3 hypothèses ordonnées
- Conversation "Que me suggères-tu pour la home cette semaine ?" → appelle
  `suggest_products_to_feature`, propose 4 produits avec justification
- Conversation "Tu peux mettre en avant ces produits ?" → l'agent dit qu'il
  ne fait pas d'écritures, propose de basculer vers Site Content
- Conversation "Quelle est ma marge sur le produit X ?" → l'agent dit qu'il
  n'a pas accès aux marges, propose des proxys

## Structure de fichiers attendue

```
src/
├── agents/
│   └── analytics-agent.ts
└── tools/analytics/
    ├── compare-periods.ts
    ├── analyze-product-underperformance.ts
    ├── find-top-movers.ts
    ├── analyze-basket-associations.ts
    ├── analyze-category-performance.ts
    ├── forecast-stock-runout.ts
    ├── suggest-products-to-feature.ts
    └── index.ts

tests/integration/agents/
└── analytics-agent.test.ts
```

## Procédure d'exécution

1. Crée tous les tools analytics. Stop entre chaque batch de 2-3.
2. Crée le `AnalyticsAgent`. Remplace le stub.
3. Test conversations cibles. Important : vérifie que l'agent CITE bien ses
   sources et ne donne pas de chiffres bidons.
4. Test : pose une question piège dont la réponse n'est pas accessible
   ("quelle est ma marge nette ?"). L'agent doit refuser proprement.
5. Commit : `feat: analytics subagent with read-only diagnostic tools`

## Critères de succès

- L'agent cite TOUJOURS la source de ses chiffres
- L'agent donne plusieurs hypothèses, pas une cause unique
- L'agent redirige vers les autres sous-agents pour les actions
- Aucune écriture possible (pas de tools write)
- Forecasts utilisent un vocabulaire prudent
- L'agent admet ses limites (pas de marges, pas de trafic externe)

## Note importante sur l'apriori des associations

L'algorithme apriori basique pour `analyze_basket_associations` peut être
coûteux sur de grosses bases. Implémente avec une limite de calcul (ex: max
1000 commandes scannées, échantillonnage si plus). Documente cette limite
dans la description du tool et dans la réponse de l'agent.

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Tous les tools analytics retournent des données cohérentes
- [ ] L'agent ne fabrique JAMAIS de chiffres (relire 5-10 conversations
      en dur)
- [ ] L'agent cite toujours ses sources
- [ ] L'agent admet ses limites quand pertinent
- [ ] L'agent suggère bien la bascule vers les autres sous-agents pour
      les actions
- [ ] Performance acceptable même avec gros catalogue (test sur >1000
      produits si possible)

C'est l'agent qui inspire le plus confiance s'il est bien tuned, ou le moins
crédible s'il hallucine. Investis du temps sur le tuning.
