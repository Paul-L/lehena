# Passe 03 — Orchestrateur et infrastructure multi-agents

## Objectif

Construire la base technique des agents IA :
- Module `assistant_conversation` qui stocke conversations + messages + audit
- Client Anthropic configuré (utilise la clé chiffrée de la passe 02)
- Boucle d'agent générique (envoi message, traitement tool calls, streaming)
- **Agent Orchestrateur** qui route les demandes vers le bon sous-agent
- Système d'audit log pour tracer chaque interaction
- Pas encore de sous-agents métier (passes 05-08), juste l'orchestrateur qui
  retourne "Sous-agent X non implémenté" pour le moment

C'est la passe la plus dense techniquement. Lis bien tout avant de lancer.

---

## PROMPT À COPIER-COLLER

```
Passe 03 : Infrastructure multi-agents et agent Orchestrateur.

## Périmètre

- Module `assistant_conversation` : conversations + messages + audit
- Wrapper du SDK Anthropic configuré avec la clé chiffrée
- Classe abstraite `BaseAgent` avec la conversation loop
- Agent `OrchestratorAgent` qui décide quel sous-agent invoquer
- Stub de chaque sous-agent (qui retourne "non implémenté")
- Routes API admin pour démarrer/continuer une conversation (avec streaming SSE)
- Helpers de comptage de tokens et de billing

## Modèles de données

### Entité `Conversation`
```
- id
- user_id (admin user qui a créé la conv)
- title (string, généré automatiquement à partir du premier message)
- status (enum: 'active' | 'archived')
- created_at, updated_at
```

### Entité `Message`
```
- id
- conversation_id (FK)
- role (enum: 'user' | 'assistant' | 'system' | 'tool')
- content (json) — peut être text + tool_use + tool_result
- agent_name (string, nullable) — quel agent a produit ce message ('orchestrator', 'seo', etc.)
- input_tokens (int, nullable)
- output_tokens (int, nullable)
- model (string, nullable) — quel modèle a été utilisé
- tool_calls (json, nullable) — si l'assistant a appelé des tools
- created_at
```

### Entité `AuditLog`
```
- id
- conversation_id (FK, nullable)
- message_id (FK, nullable)
- user_id
- action (string, ex: 'tool_call', 'config_change', 'data_modification')
- agent_name (string, nullable)
- tool_name (string, nullable)
- tool_input (json, nullable)
- tool_output_summary (string, nullable) — résumé court, pas tout le payload
- success (bool)
- error_message (string, nullable)
- created_at
```

L'audit log est ce qui nous permet de répondre à "qui a fait quoi quand" et
de respecter le RGPD.

## Wrapper Anthropic Client

Crée `src/lib/anthropic-client.ts` :

```typescript
export class AnthropicClient {
  constructor(
    private configService: AssistantConfigService,
    private logger: Logger
  ) {}

  async createMessage(params: CreateMessageParams): Promise<MessageResponse>;
  async streamMessage(params: CreateMessageParams): AsyncIterable<StreamEvent>;

  // Compte les tokens d'un message avant envoi (utile pour estimer les coûts)
  async countTokens(messages: Message[]): Promise<number>;
}
```

Comportement :
- Récupère la clé via `configService.getApiKey()` au début de chaque appel
  (ne cache pas — comme ça si la clé est mise à jour, le prochain call l'utilise)
- Si pas de clé : throw `ConfigurationError('API key not configured')`
- Si la clé est invalide : throw `AuthenticationError`, marque
  `validated_at = null` dans la config
- Gère les rate limits avec retry exponentiel (max 3 tentatives)
- Après chaque réponse : appelle `configService.incrementTokensUsed(input, output)`
- Si la limite mensuelle est dépassée : throw `RateLimitError('Monthly limit reached')`
- Tous les appels sont loggés (sans le contenu, juste métadonnées : model,
  tokens, durée)

## BaseAgent (classe abstraite)

Crée `src/agents/base-agent.ts` :

```typescript
export abstract class BaseAgent {
  abstract name: string;
  abstract systemPrompt: string;
  abstract availableTools: ToolDefinition[];

  constructor(
    protected anthropic: AnthropicClient,
    protected toolExecutor: ToolExecutor,
    protected auditLogger: AuditLogger,
    protected logger: Logger
  ) {}

  /**
   * Lance la conversation loop : envoie au modèle, traite les tool calls,
   * boucle jusqu'à obtenir une réponse text finale.
   */
  async *run(
    messages: Message[],
    context: AgentContext
  ): AsyncIterable<AgentEvent>;

  /**
   * Hook que les sous-classes peuvent override pour customiser le contexte
   * système (ex: injecter le user_id, les locales actives, etc.)
   */
  protected buildSystemPrompt(context: AgentContext): string;
}
```

Events streamés :
- `text_delta` : nouveau token de texte
- `tool_call_start` : un tool call commence
- `tool_call_result` : un tool call s'est terminé
- `agent_handoff` : l'orchestrateur passe la main à un sous-agent (event spécial)
- `done` : conversation terminée
- `error` : erreur

La conversation loop :
1. Envoie les messages + system prompt + tools au modèle
2. Stream la réponse
3. Si la réponse contient des tool_use : exécute via toolExecutor, log dans
   l'audit, ajoute le tool_result au contexte, recommence
4. Si la réponse est text seul : termine
5. Limite : max 10 itérations (sinon throw — protection contre boucles infinies)

## OrchestratorAgent

Crée `src/agents/orchestrator-agent.ts` :

```typescript
export class OrchestratorAgent extends BaseAgent {
  name = 'orchestrator';

  systemPrompt = `Tu es l'assistant IA principal d'une boutique e-commerce
construite sur Medusa.

Ton rôle est d'analyser les demandes de l'utilisateur (le commerçant qui gère
la boutique) et de les router vers le bon sous-agent spécialisé :

- 'seo' : optimisation SEO, rédaction de descriptions produits, balises meta,
  alt text, mots-clés
- 'marketing' : promotions, codes promo, mises en avant, stratégies
  promotionnelles, planification campagnes
- 'site_content' : édition du hero, des bandeaux, des sections de la home page
- 'analytics' : diagnostic de performance, analyse des ventes, identification
  des produits qui sous-performent, recommandations basées sur les données

Pour router : utilise le tool 'invoke_subagent' avec le nom du sous-agent
approprié et la question reformulée pour ce sous-agent.

Si la demande est ambiguë ou couvre plusieurs domaines : pose UNE question
de clarification courte avant de router.

Si la demande est simple et conversationnelle (salutation, remerciement, demande
de help) : réponds directement sans appeler de sous-agent.

Tu ne donnes JAMAIS de chiffres, statistiques, ou informations spécifiques sur
la boutique sans avoir invoqué un sous-agent. Pas d'invention.

Style : professionnel, concis, factuel. Pas d'emojis sauf si l'utilisateur en
utilise. Tutoie l'utilisateur. Réponds en français par défaut, sauf si
l'utilisateur écrit dans une autre langue.

Tu n'as pas accès direct aux données de la boutique — tu dois passer par les
sous-agents.`;

  availableTools = [INVOKE_SUBAGENT_TOOL];
}
```

Le tool `invoke_subagent` :

```typescript
{
  name: 'invoke_subagent',
  description: 'Délègue la demande à un sous-agent spécialisé...',
  input_schema: {
    type: 'object',
    properties: {
      subagent: {
        type: 'string',
        enum: ['seo', 'marketing', 'site_content', 'analytics'],
        description: 'Le sous-agent à invoquer'
      },
      task: {
        type: 'string',
        description: 'La tâche reformulée pour le sous-agent, avec tout le contexte nécessaire'
      }
    },
    required: ['subagent', 'task']
  }
}
```

Implémentation : quand `invoke_subagent` est appelé, l'orchestrateur :
1. Vérifie que le sous-agent est activé dans la config
2. Si désactivé : retourne un tool_result `"Sous-agent X désactivé dans la
   configuration"`
3. Sinon : instancie le sous-agent, lance sa loop avec `task` comme premier
   message user, stream les events vers l'utilisateur (avec un préfixe visuel
   "🤖 Agent SEO ...")
4. Quand le sous-agent termine, l'orchestrateur reçoit le résultat final et
   peut soit le passer tel quel, soit le synthétiser

Pour cette passe, les sous-agents sont des stubs :

```typescript
export class StubSubagent extends BaseAgent {
  constructor(private subagentName: string, ...) { super(...); }
  name = `stub-${this.subagentName}`;
  systemPrompt = `Stub sous-agent ${this.subagentName}`;
  availableTools = [];
  async *run(messages, context) {
    yield { type: 'text_delta', delta: `Sous-agent '${this.subagentName}' pas encore implémenté.` };
    yield { type: 'done' };
  }
}
```

## ToolExecutor

Crée `src/lib/tool-executor.ts` :

```typescript
export class ToolExecutor {
  constructor(
    private auditLogger: AuditLogger,
    private medusaContainer: MedusaContainer,
    private logger: Logger
  ) {}

  registerTool(tool: ToolDefinition, handler: ToolHandler): void;
  async execute(name: string, input: unknown, context: ToolContext): Promise<ToolResult>;
}
```

Comportement :
- Vérifie que le tool est enregistré
- Valide l'input via le zod schema du tool
- Log dans l'audit avant exécution
- Exécute le handler avec un timeout (30s par défaut)
- Log le résultat (success ou error) dans l'audit
- Retourne `{ success: true, content: string }` ou `{ success: false, error: string }`
- Gère les erreurs proprement : un tool qui crash ne doit pas crash l'agent

Pour cette passe, on enregistre uniquement le tool `invoke_subagent`.
Les vrais tools métier viennent en passe 04 et après.

## AuditLogger

Crée `src/lib/audit-logger.ts` :

```typescript
export class AuditLogger {
  async logToolCall(params: { ... }): Promise<void>;
  async logMessage(params: { ... }): Promise<void>;
  async logDataModification(params: { ... }): Promise<void>;
  async getRecentLogs(filters: AuditLogFilters): Promise<AuditLog[]>;
  async exportLogsCSV(period: { from: Date; to: Date }): Promise<string>;
}
```

Le bouton "Télécharger les logs" de la passe 02 va consommer
`exportLogsCSV()` — peut maintenant être activé.

## Routes API admin

`/admin/assistant/conversations` :

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/assistant/conversations` | Liste paginée |
| GET | `/admin/assistant/conversations/:id` | Détail avec messages |
| POST | `/admin/assistant/conversations` | Crée une nouvelle conv |
| DELETE | `/admin/assistant/conversations/:id` | Archive |

`/admin/assistant/chat` :

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/admin/assistant/chat` | Envoie un message. Body: `{ conversationId?, message }`. **Réponse en SSE streaming.** |

`/admin/assistant/audit` :

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/assistant/audit` | Liste paginée des logs avec filtres |
| GET | `/admin/assistant/audit/export` | CSV download |

## SSE streaming

Pour la route `/admin/assistant/chat`, utilise les Server-Sent Events :
- Headers : `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
  `Connection: keep-alive`
- Format : `data: {"type": "text_delta", "delta": "Hello"}\n\n`
- Event de fin : `data: {"type": "done"}\n\n` puis `[DONE]`

Côté Node, garde la connexion ouverte tant que l'agent loop tourne, flush
après chaque event.

## Test sans UI

Pour cette passe, on test via curl + un petit script Node.

Crée `tests/integration/orchestrator.test.ts` qui :
1. Setup une conv
2. Envoie "Bonjour" → l'orchestrateur répond directement (pas de tool call)
3. Envoie "J'aimerais optimiser le SEO de mon produit X" → l'orchestrateur
   appelle `invoke_subagent('seo', ...)` → reçoit le stub "non implémenté"
4. Envoie "Tu es là ?" → réponse text simple
5. Vérifie que tous les events sont bien dans l'audit log

## Garde-fous techniques

- Limite du nombre d'itérations dans la loop : 10 (sinon throw)
- Timeout par requête Anthropic : 60s
- Timeout par tool call : 30s
- Limite de tokens par conversation : 100k input cumulés (sinon force un nouveau)
- Si l'utilisateur envoie >50 messages dans la même conv, suggérer d'en démarrer
  une nouvelle (overflow de contexte)

## Structure de fichiers attendue

```
src/
├── modules/assistant-conversation/
│   ├── models/
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   └── audit-log.ts
│   ├── migrations/
│   ├── service.ts
│   ├── index.ts
│   └── types.ts
├── api/admin/assistant/
│   ├── conversations/route.ts
│   ├── conversations/[id]/route.ts
│   ├── chat/route.ts
│   ├── audit/route.ts
│   └── audit/export/route.ts
├── agents/
│   ├── base-agent.ts
│   ├── orchestrator-agent.ts
│   ├── stub-subagent.ts
│   └── types.ts
├── lib/
│   ├── anthropic-client.ts
│   ├── tool-executor.ts
│   └── audit-logger.ts
└── index.ts (export du module)

tests/
├── integration/
│   ├── anthropic-client.test.ts
│   ├── orchestrator.test.ts
│   └── audit-logger.test.ts
```

## Procédure d'exécution

1. Crée le module `assistant-conversation` (3 entités). Migration. Stop.
2. Crée `AnthropicClient`. Test integration : un simple "ping" message
   à Claude, vérifie que la clé est bien récupérée et utilisée. Stop.
3. Crée `AuditLogger`. Stop.
4. Crée `ToolExecutor`. Crée le tool `invoke_subagent` registry-side. Stop.
5. Crée `BaseAgent` abstract. Stop.
6. Crée `OrchestratorAgent` + `StubSubagent`. Stop.
7. Crée la route `/admin/assistant/chat` avec SSE. Test via curl :
   `curl -N -X POST .../chat -d '{"message":"Bonjour"}' -H "Authorization: ..."`
   Vérifie que tu vois le streaming en live. Stop.
8. Crée les autres routes API.
9. Lance le test integration `orchestrator.test.ts`. Stop.
10. Active le bouton "Télécharger les logs" de la passe 02 et test.
11. Commit : `feat: orchestrator agent and multi-agent infrastructure`

## Critères de succès

- `curl POST /admin/assistant/chat` avec un message text retourne un
  stream SSE
- Pour "Bonjour" : réponse text directe, pas de tool call
- Pour une demande SEO : tool call `invoke_subagent('seo')`, retour stub
- Tous les messages sont en base avec leurs tokens count
- L'usage mensuel s'incrémente après chaque appel
- L'audit log contient les tool calls
- Aucune fuite de la clé API dans les logs

Vas-y. C'est la passe la plus complexe — n'hésite pas à me poser des
questions de clarification AVANT de coder si quelque chose est ambigu.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] L'orchestrateur répond aux messages simples
- [ ] L'orchestrateur route vers les sous-agents stubs correctement
- [ ] Le streaming SSE fonctionne (visible en temps réel)
- [ ] Les tokens sont comptabilisés et incrémentés dans la config
- [ ] L'audit log contient les bonnes entrées
- [ ] Les conversations et messages sont bien en base
- [ ] Pas de boucle infinie possible
- [ ] Pas de fuite de la clé API

Si quelque chose ne marche pas dans cette passe, NE LANCE PAS la passe 04.
Tout repose sur cette infrastructure.
