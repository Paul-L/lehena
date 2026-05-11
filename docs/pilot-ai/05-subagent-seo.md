# Passe 05 — Sous-agent SEO & contenu produit

## Objectif

Premier sous-agent métier : optimisation SEO et rédaction de contenu produit.

C'est le sous-agent à plus haute valeur perçue immédiate (le client voit
tout de suite l'amélioration). C'est aussi le moins risqué (pas de modif de
prix, de promo, de visuel).

---

## PROMPT À COPIER-COLLER

```
Passe 05 : Sous-agent "SEO" — optimisation SEO et rédaction produit.

## Périmètre

- Agent `SEOAgent` avec son system prompt dédié
- Tools spécifiques SEO (5-7 tools)
- Action handlers pour appliquer les modifications
- Tests des cas d'usage clés

## Cas d'usage cibles (à garder en tête en codant)

1. "Optimise la fiche produit X pour le SEO" → l'agent lit la fiche, propose
   un nouveau title, meta description, description longue restructurée, alt
   text des images, et demande confirmation
2. "Cette fiche a un problème SEO ?" → l'agent diagnostique (longueur title,
   meta, structure des H, alt manquants, etc.) et propose un plan d'action
3. "Réécris cette description dans un ton plus jeune / plus premium / plus
   factuel" → réécriture avec contrôle de ton
4. "Suggère-moi des mots-clés pour ce produit" → analyse + suggestions de
   keywords FR pertinents
5. "Génère le contenu SEO pour ces 10 nouveaux produits que je viens de
   créer" → traitement batch (avec limite raisonnable)

## Tools spécifiques SEO

À placer dans `src/tools/seo/`.

### `analyze_product_seo`
- Catégorie : `read`
- Input : `{ productId: string }`
- Audit la fiche produit et retourne :
  ```
  {
    score: 0-100,
    issues: [
      { severity: 'high' | 'medium' | 'low', code: string, message: string }
    ],
    metrics: {
      title_length, meta_description_length,
      description_word_count,
      headings_structure: { h1: n, h2: n, h3: n },
      images_with_alt: n, images_total: n,
      internal_links: n
    }
  }
  ```
- Codes d'issues à détecter : `title_too_short`, `title_too_long`,
  `meta_missing`, `meta_too_short`, `meta_too_long`, `description_too_short`,
  `no_h2`, `images_missing_alt`, `duplicate_title_with_other_product`,
  `slug_not_seo_friendly`

### `propose_product_seo_update`
- Catégorie : `write` (mais via pending_action)
- Input : `{ productId: string, instructions?: string }`
  - `instructions` optionnelles : "ton plus premium", "cible mot-clé X",
    "longueur 200 mots", etc.
- L'agent (côté handler) génère via un prompt interne :
  - title (30-60 chars)
  - meta_title (50-65 chars)
  - meta_description (140-160 chars)
  - description (markdown ou HTML selon ce que Medusa stocke nativement,
    structurée avec H2/H3, 150-300 mots)
  - alt text suggérés pour chaque image
- Crée une `pending_action` de type `update_product_seo` avec preview_data
- Retourne le pendingActionId

### `propose_alt_texts`
- Comme propose_product_seo_update mais uniquement pour les alt texts
- Pour les produits avec beaucoup d'images dont les alts sont vides

### `suggest_keywords_for_product`
- Catégorie : `read`
- Input : `{ productId: string, market?: string (default 'fr-FR') }`
- Retourne 10-15 mots-clés suggérés avec une justification courte par mot-clé
- ATTENTION : pas d'accès à un outil SEO réel (pas de Google Keyword Planner) —
  l'agent suggère sur la base du contenu produit + intuition. Documenter dans
  la description du tool que c'est indicatif.

### `audit_catalog_seo`
- Catégorie : `read`
- Input : `{ limit?: number (default 50, max 200), categoryId?: string }`
- Retourne pour chaque produit son score SEO + 3 issues majeures
- Permet à l'agent de proposer "voici tes 10 produits avec le plus mauvais SEO"

### `propose_batch_seo_update`
- Catégorie : `write` (via pending_action)
- Input : `{ productIds: string[] (max 20), instructions?: string }`
- Génère les updates pour chaque produit, crée UNE pending_action qui contient
  un batch d'updates, l'utilisateur valide le tout d'un bloc

## Action handlers

Enregistrer dans `ActionHandlerRegistry` :

### `update_product_seo` handler
```typescript
async (payload: { productId, title?, metaTitle?, metaDescription?,
  description?, imageAltTexts?: Array<{imageId, alt}> }, ctx) => {
  // Appelle le workflow Medusa updateProductsWorkflow
  // Retourne { success, updatedFields: [...] }
}
```

### `batch_update_products_seo` handler
- Traite plusieurs updates dans la même transaction
- Si un produit fail, continue avec les autres mais reporte les échecs

## System prompt du SEOAgent

```
Tu es un expert SEO e-commerce francophone, spécialisé dans l'optimisation
de fiches produits pour le SEO et la conversion.

Ton rôle est d'aider le commerçant à améliorer la visibilité et le taux de
conversion de ses fiches produits.

Domaines de compétence :
- Audit SEO de fiches produits (title, meta, structure, alt, mots-clés)
- Rédaction de descriptions produits orientées vente ET SEO
- Suggestion de mots-clés pertinents
- Optimisation des balises et structure HTML

Règles de fonctionnement :
1. Avant toute proposition d'optimisation, tu LIS la fiche produit existante
   via `read_product`. Tu ne fais aucune supposition.
2. Pour les diagnostics SEO, tu utilises `analyze_product_seo` qui te donne
   les métriques objectives.
3. Pour proposer des changements, tu utilises `propose_product_seo_update`
   qui crée une pending_action. L'utilisateur DOIT confirmer avant
   application.
4. Tu ne modifies JAMAIS un produit directement sans passer par une pending_action.
5. Tu adaptes le ton de la description en fonction du positionnement de la
   marque (que tu déduis du catalogue ou que tu demandes au commerçant si pas
   évident).
6. Tu structures les descriptions longues avec des H2/H3 : Présentation,
   Caractéristiques, Utilisation/Conseils, Points forts.
7. Pour les meta description : 140-160 chars, action verbale en début, USP du
   produit, appel à l'action subtil.
8. Pour les titles SEO : 50-65 chars, mot-clé principal en début, marque en fin.
9. Tu n'inventes JAMAIS de chiffres, certifications, garanties, ou
   caractéristiques qui ne sont pas dans la fiche source.
10. Si la fiche source manque d'infos pour rédiger correctement, tu poses des
    questions précises au commerçant plutôt que d'inventer.
11. Pour les alt texts : descriptifs, courts (max 125 chars), incluent un
    mot-clé pertinent quand c'est naturel, JAMAIS "image de" ou "photo de".

Ton de réponse :
- Professionnel mais accessible
- Évite le jargon SEO non-expliqué (parle de "balise titre" plutôt que "balise
  title", explique "meta description" la première fois)
- Concis : pas de longs préambules, va à l'essentiel

Cas où tu refuses :
- Demandes de "bourrer" la fiche de mots-clés (keyword stuffing) → refuse
  poliment et explique que ça pénalise le référencement aujourd'hui
- Demandes d'inventer des certifications, garanties, ou propriétés non vérifiées
- Génération de contenu pour des produits qui contreviennent aux conditions
  d'utilisation Anthropic (armes, drogues, etc.)

Tu n'as accès qu'aux tools listés dans tes outils. Tu ne peux pas accéder aux
emails clients, aux statistiques de trafic externe, ou à des outils tiers.
```

## Workflow d'application

Crée le workflow `updateProductSEOWorkflow` dans `src/workflows/seo/` :

```typescript
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

export const updateProductSEOWorkflow = createWorkflow(
  "update-product-seo",
  function (input: UpdateProductSEOInput) {
    // Étape 1 : valider que le produit existe
    // Étape 2 : appliquer les updates via updateProductsWorkflow
    // Étape 3 : émettre l'event 'product.seo_updated'
    // Étape 4 : retourner le produit MAJ
  }
);
```

## Tests

### Tests unitaires
- `analyze_product_seo` : sur un produit avec différents profils (parfait,
  manque de meta, title trop court, etc.) → vérifie les issues détectées
- Format des prompts internes pour la génération SEO (snapshot tests)

### Tests integration
- Conversation : "Audit le SEO de mes 5 derniers produits" → l'agent appelle
  `audit_catalog_seo`, retourne un résumé
- Conversation : "Optimise le SEO du produit X" →
  - Appelle `read_product`
  - Appelle `analyze_product_seo`
  - Appelle `propose_product_seo_update`
  - Crée la pending_action
  - Retourne un message qui décrit la proposition + indique de valider
- Confirmation de la pending_action → produit MAJ en base

## Structure de fichiers attendue

```
src/
├── agents/
│   └── seo-agent.ts
├── tools/seo/
│   ├── analyze-product-seo.ts
│   ├── propose-product-seo-update.ts
│   ├── propose-alt-texts.ts
│   ├── suggest-keywords-for-product.ts
│   ├── audit-catalog-seo.ts
│   ├── propose-batch-seo-update.ts
│   ├── prompts/                    # prompts internes pour génération
│   │   ├── product-description.ts
│   │   ├── meta-description.ts
│   │   └── alt-text.ts
│   └── index.ts
└── workflows/seo/
    ├── update-product-seo.ts
    └── batch-update-products-seo.ts

tests/
├── unit/tools/seo/
│   └── analyze-product-seo.test.ts
└── integration/agents/
    └── seo-agent.test.ts
```

## Procédure d'exécution

1. Lis bien la doc Medusa v2 sur les workflows produits — assure-toi que
   tu sais exactement quels champs Medusa stocke pour le SEO produit
   (title, handle, description, metadata pour les champs custom). Stop.
2. Crée le workflow `updateProductSEOWorkflow`. Stop.
3. Crée le tool `analyze_product_seo` + son test. Stop.
4. Crée les autres tools de read (`audit_catalog_seo`,
   `suggest_keywords_for_product`). Stop.
5. Crée les prompts internes (génération description, meta, alt). Stop.
6. Crée `propose_product_seo_update` et `propose_alt_texts` qui utilisent
   les prompts internes. Stop.
7. Crée `propose_batch_seo_update`.
8. Crée l'action handler `update_product_seo` et `batch_update_products_seo`.
   Enregistre-les. Stop.
9. Crée le `SEOAgent` avec system prompt + binding des tools.
10. Remplace le stub SEO de la passe 03 par le vrai `SEOAgent`.
11. Test conversation end-to-end (cf. tests integration).
12. Commit : `feat: SEO subagent with content optimization tools`

## Critères de succès

- Conversation "Audit le SEO de mon produit X" donne un diagnostic clair
- Conversation "Optimise-le" génère une proposition complète (title, meta,
  description, alts), créée comme pending_action
- Confirmation de la pending_action met à jour le produit en base
- Le rejet ne touche rien
- L'agent ne modifie JAMAIS un produit sans pending_action
- L'agent refuse poliment le keyword stuffing
- Les descriptions générées sont structurées (H2, H3), respectent les
  longueurs cibles, ne contiennent pas d'invention factuelle

## Notes pour le tuning du prompt

Après tes premiers tests, tu vas probablement constater :
- L'agent est trop verbeux → ajouter "Réponses courtes, max 200 mots sauf
  si question complexe"
- L'agent invente des certifications → renforcer la règle 9
- L'agent ne demande pas confirmation → renforcer la règle 4 + ajouter
  un exemple
- L'agent appelle `propose_*` sans avoir lu d'abord → ajouter la règle
  "TOUJOURS read_product en premier"

Itère sur le prompt par petits ajouts ciblés. Garde un changelog des versions
de prompt dans un fichier `src/agents/prompts-changelog.md`.

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] L'orchestrateur route correctement les demandes SEO vers cet agent
- [ ] L'agent fait toujours `read_product` avant de proposer
- [ ] Les pending_actions sont bien créées avec preview_data exploitable
- [ ] La confirmation applique vraiment les changements en base
- [ ] L'agent refuse les demandes problématiques (stuffing, invention)
- [ ] Les descriptions générées sont de qualité (relire 3-5 exemples
      manuellement)
- [ ] Les coûts en tokens sont raisonnables (note la conso pour 5
      conversations test)

C'est probablement le sous-agent que tu vas le plus itérer — la qualité de
sortie dépend énormément du tuning du prompt et des prompts internes.
Prévois 2-3 sessions de tuning après la première version.
