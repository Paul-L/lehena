# Passe 04 — Couche Tools partagée

## Objectif

Créer la **couche Tools réutilisable** entre tous les sous-agents. Plutôt que
chaque agent réinvente ses tools, on factorise :
- Les patterns communs (read-only data fetch, draft creation, validation)
- Le contrat ToolDefinition standardisé
- Les helpers Medusa (query, workflow execution, container resolution)
- Le système de "actions à confirmer" qui demande validation user avant
  toute écriture

À la fin de cette passe, on a un **catalogue de tools de base** que les
sous-agents (passes 05-08) vont enrichir avec des tools métier.

---

## PROMPT À COPIER-COLLER

```
Passe 04 : Couche Tools partagée pour les agents IA.

## Contexte rappel

Les agents IA appellent des "tools" (function calling Anthropic) pour :
- Lire des données Medusa (produits, commandes, stock, promos, etc.)
- Modifier des données (mais TOUJOURS en draft, jamais publié direct)
- Demander confirmation à l'utilisateur avant action critique
- Générer des previews

## Périmètre de cette passe

- Système de définition de tools (typés et validés)
- Catalogue de **tools de base** réutilisables
- Mécanisme "demande de confirmation" (l'agent propose, le user confirme via UI)
- Module `pending_action` pour stocker les actions en attente de confirmation

PAS de tools métier spécifiques dans cette passe (SEO, marketing, etc.) —
ils viendront avec leurs sous-agents respectifs.

## Système de définition de tools

Crée `src/tools/types.ts` :

```typescript
export type ToolCategory = 'read' | 'write' | 'action_request';

export type ToolDefinition<TInput = unknown, TOutput = unknown> = {
  // Identifiant unique du tool
  name: string;

  // Catégorie (impact sur les permissions et l'audit)
  category: ToolCategory;

  // Quel sous-agent (ou 'shared') possède ce tool
  agent: string;

  // Description pour le modèle (sera vue par Claude)
  description: string;

  // Schema d'entrée pour le modèle (JSON Schema, format Anthropic)
  inputSchema: Record<string, unknown>;

  // Schema zod pour validation runtime
  zodSchema: ZodSchema<TInput>;

  // Handler qui exécute le tool
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>;

  // Si true : le résultat doit être confirmé par l'utilisateur avant
  // d'avoir un effet réel. L'output est alors une "pending_action" et
  // non l'effet final.
  requiresConfirmation: boolean;

  // Limite de fréquence (par minute, par user) — anti-abus
  rateLimitPerMinute?: number;
};

export type ToolContext = {
  userId: string;
  conversationId: string;
  messageId: string;
  medusaContainer: MedusaContainer;
  logger: Logger;
};
```

## Tools de base (`shared`)

Ces tools sont disponibles pour TOUS les sous-agents. À placer dans
`src/tools/shared/`.

### `request_user_confirmation`
- Catégorie : `action_request`
- Description : "Demande à l'utilisateur de confirmer une action proposée
  avant de l'exécuter. À utiliser quand l'agent veut modifier des données."
- Input : `{ summary: string, details: object, confirmationLabel?: string }`
- Crée une row `pending_action` avec status='pending', associée au message
- Retour : `{ pendingActionId: string, expiresAt: Date }` (l'agent peut
  expliquer ensuite à l'user "j'ai préparé ceci, valide pour appliquer")

### `read_product`
- Catégorie : `read`
- Input : `{ productId: string }` ou `{ handle: string }`
- Retourne la fiche produit complète (title, description, variants, prix,
  stock cumulé, status)

### `search_products`
- Catégorie : `read`
- Input : `{ query?: string, categoryId?: string, status?: string,
  limit?: number, offset?: number }`
- Retourne une liste paginée

### `read_category`
- Catégorie : `read`
- Input : `{ categoryId: string }` ou `{ handle: string }`
- Retourne les infos catégorie + nombre de produits

### `list_categories`
- Catégorie : `read`
- Input : `{}`
- Retourne l'arbre des catégories

### `read_recent_orders`
- Catégorie : `read`
- Input : `{ days?: number (default 30), limit?: number, status?: string }`
- Retourne les commandes récentes (sans données personnelles client : juste
  ID, items, total, status, date)

### `get_sales_metrics`
- Catégorie : `read`
- Input : `{ period: 'last_7_days' | 'last_30_days' | 'last_90_days' |
  'last_12_months' }`
- Retourne : total CA, nombre de commandes, panier moyen, top 10 produits
  par CA, breakdown par catégorie

### `get_product_performance`
- Catégorie : `read`
- Input : `{ productId: string, period: 'last_30_days' | 'last_90_days' }`
- Retourne : ventes, CA, conversion (si on a la donnée trafic), positions
  dans les recherches internes (si applicable)

### `list_active_promotions`
- Catégorie : `read`
- Input : `{}`
- Retourne les promos actives + à venir

## Module `pending_action`

Entité pour stocker les actions en attente de confirmation utilisateur :

```
- id
- conversation_id (FK)
- message_id (FK) — le message agent qui a proposé l'action
- user_id
- agent_name
- action_type (string, ex: 'update_product_seo', 'create_promotion')
- summary (string) — résumé human-readable de l'action
- payload (json) — données nécessaires à l'exécution
- preview_data (json, nullable) — données pour afficher une preview à l'user
- status (enum: 'pending' | 'confirmed' | 'rejected' | 'expired')
- expires_at (date) — par défaut 1h
- created_at
- confirmed_at, rejected_at (dates, nullable)
```

Service `PendingActionService` :
- `create(input)` : crée une row pending
- `confirm(id, userId)` : marque confirmed, déclenche l'exécution réelle
  via le handler associé
- `reject(id, userId)` : marque rejected
- `expire()` : job cron qui passe les > expires_at en 'expired'
- `getPendingForConversation(convId)` : utile pour l'UI

## Handler de confirmation

Quand une pending_action est confirmée, il faut savoir quoi exécuter. Pattern
choisi : registry de handlers indexés par `action_type`.

```typescript
export class ActionHandlerRegistry {
  register(actionType: string, handler: ActionHandler): void;
  async execute(action: PendingAction, context: ActionContext): Promise<ActionResult>;
}

export type ActionHandler = (payload: unknown, context: ActionContext) => Promise<ActionResult>;
```

Pour cette passe, on enregistre un handler de test `noop` :
```typescript
registry.register('noop', async (payload, ctx) => ({ success: true, message: 'noop executed' }));
```

Les vrais handlers métier viennent dans les passes des sous-agents.

## Routes API admin pour les pending actions

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/assistant/pending-actions` | Liste des pending actions actives de l'utilisateur courant |
| GET | `/admin/assistant/pending-actions/:id` | Détail (avec preview_data) |
| POST | `/admin/assistant/pending-actions/:id/confirm` | Confirme et déclenche l'exécution |
| POST | `/admin/assistant/pending-actions/:id/reject` | Rejette |

## Job cron d'expiration

Crée `src/jobs/expire-pending-actions.ts` :
- Tourne toutes les 15 minutes
- Passe en 'expired' toutes les pending_actions avec `expires_at < now()`
  et status = 'pending'

## Helpers Medusa pour les tools

Crée `src/tools/helpers/medusa-helpers.ts` avec des fonctions utilitaires que
les tools pourront utiliser :

```typescript
// Wrap autour du Query API de Medusa v2
export async function queryProducts(container, filters): Promise<Product[]>;
export async function queryOrders(container, filters): Promise<Order[]>;
export async function executeWorkflow(container, workflowName, input): Promise<unknown>;

// Helpers de formatage : convertir des objets Medusa volumineux en JSON
// compact pour ne pas exploser le contexte du modèle
export function summarizeProduct(product): ProductSummary;
export function summarizeOrder(order): OrderSummary;
```

L'idée : les tools doivent retourner du JSON compact et exploitable par le
modèle, pas des objets Medusa bruts qui peuvent contenir 50 champs inutiles.

## Rate limiting des tools

Implémente un rate limiter en mémoire (Map<userId-toolName, count> avec
TTL 60s). Si dépassé : retourne une erreur claire au modèle "Rate limit
exceeded for tool X (max N per minute)".

Documenter qu'en multi-instance Medusa il faudra Redis pour partager le
compteur — c'est une todo pour plus tard.

## Tests

Pour chaque tool de base, un test :
- Input valide → output attendu
- Input invalide (zod fail) → erreur structurée
- Sans données en base → comportement gracieux (ex: liste vide pas crash)

Pour le système pending_action :
- Création → status pending
- Confirm → handler exécuté → status confirmed
- Reject → status rejected
- Expiration auto

## Structure de fichiers attendue

```
src/
├── tools/
│   ├── types.ts
│   ├── registry.ts                    # registry global de tools
│   ├── shared/
│   │   ├── request-user-confirmation.ts
│   │   ├── read-product.ts
│   │   ├── search-products.ts
│   │   ├── read-category.ts
│   │   ├── list-categories.ts
│   │   ├── read-recent-orders.ts
│   │   ├── get-sales-metrics.ts
│   │   ├── get-product-performance.ts
│   │   ├── list-active-promotions.ts
│   │   └── index.ts (export all + registration helper)
│   └── helpers/
│       ├── medusa-helpers.ts
│       ├── rate-limiter.ts
│       └── formatting.ts
├── modules/pending-action/
│   ├── models/pending-action.ts
│   ├── migrations/
│   ├── service.ts
│   ├── index.ts
│   └── action-handler-registry.ts
├── api/admin/assistant/pending-actions/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── [id]/confirm/route.ts
│   └── [id]/reject/route.ts
└── jobs/
    └── expire-pending-actions.ts

tests/integration/tools/
├── shared-tools.test.ts
└── pending-actions.test.ts
```

## Procédure d'exécution

1. Crée les types `tools/types.ts` et le registry `tools/registry.ts`. Stop.
2. Crée les helpers Medusa. Stop.
3. Crée tous les tools shared. Stop entre chaque ou par batch de 3 selon
   la complexité. Pour chacun : zod schema, handler, test minimal.
4. Crée le module `pending-action`. Migration. Stop.
5. Crée `ActionHandlerRegistry`. Enregistre le handler `noop` test. Stop.
6. Crée les routes API pending-actions. Test via curl. Stop.
7. Crée le job d'expiration.
8. Connecte le ToolExecutor de la passe 03 au registry des tools de cette
   passe (l'orchestrateur peut maintenant accéder aux tools shared via
   un mécanisme — décide si l'orchestrateur a accès direct ou pas. Suggéré :
   l'orchestrateur n'a accès QU'À `invoke_subagent`. Les tools shared sont
   pour les sous-agents.)
9. Test integration : invoque manuellement le tool `read_product` sur un
   produit existant, vérifie le retour. Vérifie l'audit log. Vérifie le
   rate limit (11 appels rapides → 11ème refusé).
10. Commit : `feat: shared tools layer with pending actions system`

## Critères de succès

- Tous les tools shared marchent contre des données réelles Medusa
- Le système pending_action fonctionne end-to-end (create → confirm → exécution)
- Le rate limit kicke quand on dépasse
- L'audit log enregistre chaque tool call avec succès/échec
- Les tools retournent du JSON compact (pas des objets Medusa bruts massifs)
- Le job d'expiration tourne et nettoie les pending expirées

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Catalogue de 9 tools shared fonctionnels
- [ ] Pending actions : création, confirmation, rejet, expiration
- [ ] Rate limiter actif
- [ ] Audit log complet
- [ ] Helpers Medusa testés
- [ ] Pas de fuite de données sensibles (RGPD : les commandes ne contiennent
      pas l'email/nom du client dans le retour des tools)

C'est une passe technique mais sans IA dedans — pas de hallucination
possible, juste de la rigueur d'ingénierie.
