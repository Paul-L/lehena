# Passe 09 — UI Chat dans le Medusa Admin

## Objectif

Construire l'interface conversationnelle qui consomme tout ce qu'on a fait
dans les passes précédentes :
- Chat panel intégré au Medusa Admin
- Streaming en temps réel des réponses
- Affichage propre des tool calls et résultats
- Gestion des pending actions (preview + confirm/reject)
- Historique des conversations
- Switch d'agents visible (l'utilisateur sait quel sous-agent répond)

C'est la passe qui rend le produit **réellement utilisable** par le client.
Soigne particulièrement l'UX.

---

## PROMPT À COPIER-COLLER

```
Passe 09 : UI Chat de l'assistant dans le Medusa Admin.

## Périmètre

- Bouton flottant "Assistant IA" présent sur toutes les pages du Medusa Admin
- Panel chat coulissant depuis la droite
- Mode plein écran pour les conversations longues
- Streaming SSE depuis la route `/admin/assistant/chat`
- Affichage différencié des messages user / agents / tool calls
- Composant de pending action avec preview embed et boutons confirm/reject
- Historique consultable et reprise de conversation
- Sélecteur de modèle accessible (par défaut le modèle config)
- Compteur de tokens visible discrètement

## Composants à créer

### `<AssistantLauncher />`
Le bouton flottant en bas à droite de toutes les pages admin.
- Position fixed, ne se superpose pas aux modales
- Si non configuré (pas de clé API) : icône grisée, tooltip "Configure
  l'assistant dans Settings"
- Si dispo : icône de chat, badge si nouvelle réponse en attente

### `<AssistantPanel />`
Le panel principal qui s'ouvre.
- Largeur 480px en mode panel, 100vw en mode fullscreen
- Header :
  - Titre "Assistant IA" + sous-titre dynamique avec le nom de l'agent en
    cours ("Orchestrateur" / "Sous-agent SEO" / etc.)
  - Boutons : Historique, Nouvelle conv, Plein écran, Fermer
- Body : zone de messages scrollable
- Footer : input + bouton envoyer + sélecteur de modèle (compact)

### `<MessageList />`
Affiche les messages d'une conversation.
- Auto-scroll vers le bas sur nouveau message (sauf si l'user a scrollé up)
- Loading skeleton pour les messages en cours de streaming

### `<UserMessage />` / `<AssistantMessage />` / `<ToolCallMessage />` / `<ToolResultMessage />` / `<HandoffMessage />`

Composants spécialisés par type de message :

- **UserMessage** : bulle alignée à droite, texte simple
- **AssistantMessage** : bulle alignée à gauche, support markdown (tables,
  listes, code, liens). Avatar avec icône qui change selon l'agent
  (orchestrateur, SEO, etc.)
- **ToolCallMessage** : bandeau collapsé "🔧 [Agent SEO] Appel de
  `analyze_product_seo`" — cliquable pour voir le détail (input)
- **ToolResultMessage** : bandeau "✅ Résultat reçu" / "❌ Erreur :
  ..." — collapsé par défaut, expand sur clic
- **HandoffMessage** : "🔄 Bascule vers le sous-agent Marketing" — visuel
  léger, pas une vraie bulle

### `<PendingActionCard />`

C'est le composant clé. Quand une pending_action est créée, l'agent insère
une carte spéciale dans la conversation :

```
┌────────────────────────────────────────────────┐
│ 📝 Action proposée : Mise à jour SEO         │
├────────────────────────────────────────────────┤
│ Produit : T-shirt Coton Bio Noir              │
│                                                │
│ Title actuel : "T-shirt noir"                 │
│ Title proposé : "T-shirt Coton Bio Noir       │
│                  Premium - Made in France"    │
│                                                │
│ [Voir tous les changements ▼]                 │
│                                                │
│ Expire dans 1 h                                │
│                                                │
│ [Modifier dans le Medusa Admin] [✗ Rejeter]   │
│ [✓ Confirmer l'application]                    │
└────────────────────────────────────────────────┘
```

Comportement :
- "Voir tous les changements" affiche un diff avant/après pour chaque champ
- Pour les actions Site Content : un iframe ou un lien vers la preview
- Boutons :
  - **Confirmer** : appelle `POST /admin/assistant/pending-actions/:id/confirm`,
    affiche un loader, puis remplace la carte par "✅ Action appliquée"
  - **Rejeter** : appelle `reject`, remplace par "❌ Action annulée"
  - **Modifier dans le Medusa Admin** : ouvre la page d'édition de la
    ressource concernée (ex: page produit) dans un nouvel onglet — l'user
    peut affiner manuellement

### `<MessageInput />`
- Textarea auto-grow (max 200px de hauteur)
- Bouton envoyer (Cmd/Ctrl+Enter raccourci)
- Indication visuelle si l'agent est en train de répondre ("Assistant en
  train d'écrire...")
- Désactivé pendant qu'une réponse est streamée (l'user ne peut pas envoyer
  un nouveau message tant que l'actuel n'est pas terminé — sinon ça mélange
  les contextes)
- Petit tooltip d'aide : "Astuce : tu peux demander 'Optimise le SEO de mon
  produit X', 'Crée une promo SWEATS20 -20%', etc."

### `<ConversationHistory />`
- Liste des conversations passées (titre auto-généré + date)
- Cliquer charge la conv dans le panel
- Actions par item : renommer, archiver
- Filtre par agent (toutes / orchestrateur / SEO / ...)

### `<ModelSelector />`
- Dropdown compact dans le footer
- Options : claude-sonnet-4-6 (par défaut), claude-opus-4-7, claude-haiku-4-5
- Affichage : nom + estimation coût relatif (€ / €€ / €€€)
- Le choix s'applique à la conversation courante uniquement (pas global)

### `<TokenCounter />`
- Compteur compact dans le footer : "12,3k tokens utilisés ce mois"
- Couleur : neutre par défaut, jaune > 80% de la limite, rouge à 100%
- Click → ouvre Settings > Assistant IA > Usage

## Streaming SSE côté client

Crée `src/admin/lib/chat-stream-client.ts` :

```typescript
export async function streamChatResponse(
  params: { message: string; conversationId?: string; model?: string },
  callbacks: {
    onAgentSwitch?: (agentName: string) => void;
    onTextDelta?: (delta: string) => void;
    onToolCallStart?: (toolCall: ToolCall) => void;
    onToolResult?: (result: ToolResult) => void;
    onPendingAction?: (action: PendingAction) => void;
    onDone?: (final: ChatDoneEvent) => void;
    onError?: (error: Error) => void;
  }
): Promise<void>;
```

Utilise `fetch` avec body POST + lecture du stream via
`response.body.getReader()`. Parse les events SSE ligne par ligne.

Gère :
- Reconnexion automatique en cas de coupure réseau (avec exponential backoff,
  3 tentatives max)
- Annulation : si l'user ferme le panel ou clic "Stop", `AbortController`
  pour interrompre la requête côté serveur
- Erreurs : affichage clair dans le chat avec possibilité de retry

## Markdown rendering

Pour les messages de l'assistant : utilise `react-markdown` + `remark-gfm`
+ syntax highlighting via `rehype-highlight`.

Composants à customiser :
- `<a>` : `target="_blank" rel="noopener"` automatiquement
- `<table>` : style propre avec bordures
- `<code>` inline et `<pre>` avec coloration

Ne pas utiliser `dangerouslySetInnerHTML`. Sécurité = `react-markdown` qui
sanitise par défaut.

## Reconnaissance contextuelle

Astuce UX : quand l'user ouvre le panel sur une page produit (URL
`/app/products/:id`), pré-remplir l'input avec un placeholder contextuel
intelligent :
- "Demande à l'assistant d'optimiser ce produit..." si on est sur une page
  produit
- "Demande à l'assistant de créer une promo..." si on est sur la page promotions
- "Demande à l'assistant d'analyser tes ventes..." si on est sur la page
  orders/analytics

Pour aller plus loin : un bouton "Analyser cette page" qui envoie
automatiquement "Analyse [type de ressource] [id] et donne-moi tes
recommandations".

## Persistance UI

L'état du panel (ouvert/fermé, conversation courante) est persisté dans
`localStorage` sous la clé `assistant_panel_state` :
- `isOpen`, `currentConversationId`, `mode` (panel | fullscreen)

Sur reload de page, le panel reprend son état.

## Accessibilité

- Tous les boutons ont `aria-label`
- Le focus revient sur l'input après chaque envoi
- Le panel est trappable (Esc pour fermer, Tab pour naviguer)
- Annoncer les nouveaux messages via `aria-live="polite"`

## Notifications

Si l'user ferme le panel pendant que l'agent répond encore :
- Continuer à recevoir le stream en background
- Afficher un badge sur le launcher quand la réponse est terminée
- Sur clic du launcher, scroll auto au dernier message

## Rate limiting UX

Quand l'utilisateur déclenche un rate limit (trop d'appels par minute) :
- Toast d'avertissement clair
- Bouton "envoyer" disabled avec compte à rebours

## Erreurs courantes à bien gérer

- Pas de clé API configurée → modal qui invite à aller dans Settings
- Clé invalide → toast + lien direct vers Settings
- Limite mensuelle atteinte → message permanent en haut du chat avec lien
  vers la modification de la limite
- Erreur réseau → retry button
- Réponse trop longue (timeout) → "L'agent a mis trop de temps. Réessaie
  avec une demande plus précise."

## Structure de fichiers attendue

```
src/admin/
├── widgets/                            # injection points Medusa Admin
│   └── assistant-launcher.tsx          # injecté globalement
├── components/assistant/
│   ├── assistant-panel.tsx
│   ├── assistant-launcher.tsx
│   ├── messages/
│   │   ├── message-list.tsx
│   │   ├── user-message.tsx
│   │   ├── assistant-message.tsx
│   │   ├── tool-call-message.tsx
│   │   ├── tool-result-message.tsx
│   │   ├── handoff-message.tsx
│   │   └── markdown-renderer.tsx
│   ├── pending-action-card.tsx
│   ├── pending-action-diff.tsx
│   ├── message-input.tsx
│   ├── conversation-history.tsx
│   ├── model-selector.tsx
│   ├── token-counter.tsx
│   └── empty-state.tsx
├── hooks/assistant/
│   ├── use-chat-stream.ts
│   ├── use-conversations.ts
│   ├── use-pending-actions.ts
│   ├── use-page-context.ts
│   └── use-panel-state.ts
└── lib/
    ├── chat-stream-client.ts
    └── pending-actions-client.ts
```

## Procédure d'exécution

1. Crée la structure et le launcher minimal injecté globalement. Vérifie
   qu'il s'affiche sur toutes les pages admin. Stop.
2. Crée le panel vide avec ouvert/fermé. Stop.
3. Crée les composants de messages (user, assistant, tool call, tool result).
   Stop.
4. Implémente `chat-stream-client.ts`. Test isolément avec un mock SSE.
   Stop.
5. Branche le panel sur le streaming réel. Test : "Bonjour" → réponse en
   live caractère par caractère. Stop.
6. Ajoute le markdown rendering. Test avec un message contenant table,
   liste, code, lien. Stop.
7. Crée le `<PendingActionCard />`. Test avec une action SEO en cours.
   Vérifie le confirm et le reject. Stop.
8. Crée le `<ConversationHistory />`. Test reprise de conversation.
9. Crée le `<ModelSelector />` et `<TokenCounter />`.
10. Implémente la reconnaissance contextuelle (placeholder selon page).
11. Ajoute la persistance localStorage.
12. Tests d'accessibilité au clavier.
13. Test end-to-end complet : "Optimise le SEO de mon produit X".
    L'assistant doit s'ouvrir, router vers SEO, faire ses analyses, créer
    une pending action, et tu valides. Le produit doit être MAJ en base.
14. Commit : `feat: assistant chat UI with streaming and pending actions`

## Critères de succès

- Le launcher est présent sur toutes les pages admin
- Le streaming fonctionne en temps réel (caractère par caractère visible)
- Les changements d'agent sont signalés visuellement
- Les pending actions s'affichent comme des cartes interactives avec diff
- La confirmation d'une action met à jour le backend et l'UI
- L'historique des conversations est consultable et reprenable
- Le compteur de tokens reflète l'usage réel
- L'UI ne crashe pas en cas de coupure réseau pendant le streaming
- Accessibilité clavier OK

Vas-y. C'est une grosse passe — n'hésite pas à me proposer un découpage en
sous-passes (UI structurelle / streaming / pending actions / polish) si ça
te facilite la vie.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Le chat est utilisable dans des conditions réelles
- [ ] Streaming smooth, sans flash blanc ni glitch
- [ ] Pending actions affichent le diff de manière claire
- [ ] Erreurs réseau gérées proprement
- [ ] Accessibilité au clavier OK (test à la souris désactivée)
- [ ] L'UI tourne sans bug pendant 30 minutes d'usage continu
- [ ] Tests sur Chrome, Firefox et Safari (les comportements SSE varient)

C'est la passe la plus visible pour le client. Investis du temps en
polishing : transitions, micro-interactions, états de chargement soignés.
La perception de qualité du produit se joue énormément ici.
