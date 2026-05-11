# Passe 01 — Bootstrap du plugin Medusa

## Objectif

Créer la structure d'un **plugin Medusa v2 distribuable** dans un repo
GitHub privé. Le client final pourra `git clone` puis l'installer dans son
projet Medusa via npm/yarn local.

Aucune logique métier dans cette passe. On pose les fondations.

---

## PROMPT À COPIER-COLLER

```
Passe 01 : Bootstrap du plugin Medusa "ai-assistant".

## Contexte

Je crée un plugin Medusa v2 que je vais distribuer via un repo GitHub privé.
Mes clients cloneront ce repo et l'installeront localement dans leur projet
Medusa. Pas de publication npm publique.

Le plugin ajoutera plus tard :
- Un assistant IA conversationnel intégré au Medusa Admin
- Une architecture orchestrateur + 4 sous-agents spécialisés (SEO, Marketing,
  Site Content, Analytics)
- Une couche d'outils qui interagit avec les API Medusa
- Un système de configuration BYOK (le client entre sa propre clé Anthropic)

## Périmètre de cette passe

UNIQUEMENT la structure et les fondations. Pas de logique métier.

## Recherche préalable

1. Va sur https://docs.medusajs.com et trouve la doc actuelle sur la création
   de plugins Medusa v2. Lis-la attentivement avant de coder.
2. Identifie les conventions actuelles : structure attendue, fichiers
   obligatoires, comment un plugin enregistre des modules, des middlewares,
   des routes API admin, des extensions admin UI.
3. Note les différences entre un projet Medusa standard et un plugin (un
   plugin ne s'auto-héberge pas, il est consommé par un projet).

Présente-moi ta synthèse en quelques bullets avant de continuer.

## Structure de fichiers attendue

```
medusa-ai-assistant/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + test sur PR
│       └── release.yml               # tag et changelog sur main
├── src/
│   ├── modules/                      # modules Medusa (ajoutés en passes suivantes)
│   ├── api/                          # routes API (ajoutées en passes suivantes)
│   ├── admin/                        # extensions admin (ajoutées en passes suivantes)
│   ├── workflows/                    # workflows Medusa
│   ├── subscribers/                  # subscribers
│   ├── jobs/                         # cron jobs
│   ├── lib/                          # utilitaires partagés
│   │   ├── logger.ts                 # wrapper de logging contextualisé
│   │   └── errors.ts                 # classes d'erreurs custom du plugin
│   ├── types/                        # types partagés (DTOs, etc.)
│   └── index.ts                      # entrypoint du plugin
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── docs/
│   ├── INSTALLATION.md               # comment installer dans un projet client
│   ├── CONFIGURATION.md              # comment configurer (sera détaillé en passe 02)
│   └── ARCHITECTURE.md               # vue d'ensemble pour devs qui reprennent
├── .gitignore
├── .npmignore
├── .editorconfig
├── .prettierrc
├── .eslintrc.cjs
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE                           # licence commerciale custom (template à fournir)
└── medusa-config.example.ts          # exemple de config pour le projet client
```

## package.json — points clés

- `name` : `medusa-ai-assistant`
- `version` : `0.1.0` (semver)
- `private` : true (repo privé, pas de publication npm)
- `main` : `dist/index.js`
- `types` : `dist/index.d.ts`
- `files` : ne pack que `dist`, `docs`, `LICENSE`, `README.md`, `CHANGELOG.md`
- `scripts` :
  - `build` : compile TS via tsconfig.build.json
  - `dev` : watch mode pour dev
  - `lint` : eslint
  - `format` : prettier
  - `test` : jest ou vitest (à déterminer selon ce que Medusa v2 utilise)
  - `test:watch`
  - `clean` : rm -rf dist
  - `prepublishOnly` : clean + build (filet de sécurité même en privé)
- `peerDependencies` :
  - `@medusajs/medusa` (version range compatible v2)
  - `@medusajs/framework`
  - `@medusajs/types`
  - `react`, `react-dom` (pour les extensions admin)
- `dependencies` :
  - `@anthropic-ai/sdk` (dernière version stable)
  - `zod` (pour validation)
  - `crypto-js` ou équivalent (pour chiffrement de la clé API en passe 02)
- `devDependencies` :
  - TypeScript, types Node, eslint, prettier, jest/vitest, etc.
- `engines` : node >=20

## tsconfig.json

- `strict` : true
- `target` : ES2022
- `module` : NodeNext
- `moduleResolution` : NodeNext
- `esModuleInterop` : true
- `declaration` : true
- `outDir` : ./dist
- `rootDir` : ./src

## tsconfig.build.json

- Hérite de tsconfig.json
- Exclut `tests/**/*`, `**/*.test.ts`

## .gitignore

Standard Node + dist/ + .env* + couverture des tests + .DS_Store + IDEs.

## .npmignore

Tout sauf dist, docs, LICENSE, README, CHANGELOG, package.json.

## src/index.ts (entrypoint)

Pour un plugin Medusa v2, l'entrypoint exporte ce que Medusa va consommer :
les modules, les workflows, etc.

Crée un index.ts vide pour l'instant qui exporte un type `PluginVersion` et
un export par défaut `{ version: "0.1.0" }`. On l'enrichira au fur et à mesure.

## src/lib/logger.ts

Wrapper minimal autour du logger de Medusa pour préfixer les logs avec
`[ai-assistant]` :

```typescript
export function createLogger(context: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => {...},
    warn: (msg: string, meta?: Record<string, unknown>) => {...},
    error: (msg: string, error?: unknown, meta?: Record<string, unknown>) => {...},
    debug: (msg: string, meta?: Record<string, unknown>) => {...},
  };
}
```

## src/lib/errors.ts

Crée une hiérarchie d'erreurs typées :

```typescript
export class AIAssistantError extends Error { ... }
export class ConfigurationError extends AIAssistantError { ... }
export class AuthenticationError extends AIAssistantError { ... }
export class ToolExecutionError extends AIAssistantError { ... }
export class AnthropicAPIError extends AIAssistantError { ... }
export class RateLimitError extends AnthropicAPIError { ... }
```

Chaque erreur a un `code` (string identifiant), un `userMessage` (message safe
à afficher au client final), et conserve la cause originale via `cause`.

## docs/INSTALLATION.md (squelette à remplir)

```markdown
# Installation

## Prérequis
- Medusa v2.x.x ou supérieur
- Node.js 20+
- Une clé API Anthropic (https://console.anthropic.com)

## Installation locale via clone

[étapes : clone, install deps, build, link]

## Configuration dans le projet Medusa

Dans `medusa-config.ts`, ajouter le plugin aux modules :

[exemple de code à compléter en passe 02]

## Variables d'environnement

[à compléter en passe 02]

## Vérification

[comment vérifier que le plugin est bien installé]
```

## docs/ARCHITECTURE.md (squelette)

Vue d'ensemble en quelques sections : modules backend, agents IA,
couche tools, UI admin, flux de données. Sera enrichi au fil des passes.

## CI minimal (.github/workflows/ci.yml)

Sur PR vers main :
- Setup Node 20
- Install deps (npm ci)
- Lint
- Type check (tsc --noEmit)
- Tests
- Build

## medusa-config.example.ts

Exemple complet et commenté de comment un client doit configurer le plugin
dans son `medusa-config.ts`. Sera enrichi au fil des passes.

## README.md du plugin

Concis, orienté décideur :
- Tagline (1 phrase)
- 3-5 features clés en bullets
- Capture d'écran ou GIF (placeholder pour l'instant)
- Lien vers docs/INSTALLATION.md
- Licence et contact

## Procédure d'exécution

1. Recherche la doc Medusa v2 sur les plugins, présente la synthèse. Stop.
2. Crée la structure de fichiers vide. Présente-la moi pour validation. Stop.
3. Crée package.json, tsconfig, .gitignore, .npmignore, configs lint/format. Stop.
4. Crée src/index.ts, src/lib/logger.ts, src/lib/errors.ts. Stop.
5. Crée la CI .github/workflows/ci.yml. Stop.
6. Crée les squelettes de docs (INSTALLATION, CONFIGURATION, ARCHITECTURE).
7. Crée README.md, CHANGELOG.md (avec entrée 0.1.0 - Initial structure), LICENSE.
8. Lance `npm install` puis `npm run build` puis `npm test` (les tests sont vides
   mais le runner doit démarrer). Tout doit passer au vert.
9. Initialise Git, commit : `chore: initial plugin structure`

## Critères de succès

- Le repo est clonable
- `npm install && npm run build` réussit sans erreur
- `npm run lint` passe
- `npm test` passe (même avec zéro test)
- La structure de dossiers est claire et conforme aux conventions Medusa v2
- Les types Medusa sont bien en peerDependencies (pas dependencies)

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Build réussit
- [ ] Lint passe
- [ ] Tests (vides) tournent sans erreur
- [ ] Structure de dossiers conforme au cahier des charges
- [ ] Repo Git initialisé et premier commit propre
- [ ] Tu peux `git clone` ailleurs et tout marche

Cette passe est rapide mais critique : si la base est mal posée, les passes
suivantes vont accumuler de la dette technique.
