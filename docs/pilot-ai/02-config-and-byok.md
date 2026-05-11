# Passe 02 — Configuration et BYOK (Bring Your Own Key)

## Objectif

Permettre au client final d'entrer sa propre clé API Anthropic, la stocker
de façon sécurisée (chiffrée en base), et fournir une UI dans le Medusa
Admin pour configurer le plugin.

C'est la fondation BYOK : tu n'as jamais accès aux clés de tes clients,
elles ne quittent jamais leur backend.

---

## PROMPT À COPIER-COLLER

```
Passe 02 : Configuration BYOK et UI de settings du plugin.

## Périmètre

- Module Medusa `assistant_config` avec entité unique de configuration
- Service de chiffrement/déchiffrement de la clé API (AES-256-GCM)
- Routes admin pour lire/écrire la config (avec masquage de la clé)
- UI admin "Réglages > Assistant IA" dans le Medusa Admin
- Test de validité de la clé (ping API Anthropic)
- Variables d'environnement documentées

## Modèle de données

Entité `AssistantConfig` (singleton — une seule row par installation Medusa) :

```
- id (généré, mais on enforce singleton)
- encrypted_api_key (text, nullable) — clé Anthropic chiffrée
- api_key_hint (string, nullable) — derniers 4 chars en clair, ex: "...abcd"
- api_key_validated_at (date, nullable) — dernière validation réussie
- default_model (string, défaut 'claude-sonnet-4-6')
- max_tokens (int, défaut 4096)
- enabled_subagents (json array of strings, ex: ['seo', 'marketing']) — pour
  désactiver des sous-agents
- audit_retention_days (int, défaut 90)
- monthly_token_limit (int, nullable) — soft limit pour éviter facture
  surprise, l'admin reçoit un warning à 80%
- monthly_tokens_used (int, défaut 0) — reset mensuel via job cron
- last_reset_at (date)
- created_at, updated_at
```

Pourquoi singleton : une installation Medusa = une config. Pas de besoin
multi-config en v1.

## Chiffrement de la clé API

Crée `src/lib/crypto.ts` avec :

```typescript
export function encryptApiKey(plaintext: string, encryptionKey: string): string;
export function decryptApiKey(ciphertext: string, encryptionKey: string): string;
```

Implémentation :
- AES-256-GCM via `node:crypto` (pas de dépendance externe)
- IV aléatoire de 12 bytes par chiffrement, prepended au ciphertext
- Auth tag de 16 bytes
- Format de stockage : `base64(iv || ciphertext || authTag)`
- `encryptionKey` doit faire au moins 32 chars (validé)

Source de la `encryptionKey` :
- Lue depuis `process.env.ENCRYPTION_KEY`
- Si absente au démarrage du module : log un warning bien visible et désactive
  l'assistant (ne crash pas Medusa)
- Documenter dans INSTALLATION.md comment générer une clé robuste :
  `openssl rand -base64 32`

ATTENTION : si la `ENCRYPTION_KEY` change, toutes les clés API deviennent
illisibles. Documenter ça en gros dans la doc.

## Service AssistantConfigService

Méthodes :

```typescript
class AssistantConfigService {
  // Récupère la config actuelle, crée la row par défaut si absente
  async getConfig(): Promise<AssistantConfig>;

  // Update partiel
  async updateConfig(input: UpdateConfigInput): Promise<AssistantConfig>;

  // Set/replace l'API key (chiffre, stocke, met à jour le hint)
  async setApiKey(plainKey: string): Promise<void>;

  // Récupère la clé déchiffrée (utilisée par le client Anthropic en interne)
  // À usage interne uniquement — JAMAIS exposée via une route API
  async getApiKey(): Promise<string | null>;

  // Supprime la clé (passer enabled à false implicitement)
  async clearApiKey(): Promise<void>;

  // Teste la validité de la clé via une requête minimale à l'API Anthropic
  async validateApiKey(): Promise<{ valid: boolean; error?: string }>;

  // Compteur de tokens
  async incrementTokensUsed(input: number, output: number): Promise<void>;
  async getMonthlyUsage(): Promise<{ used: number; limit: number | null; percent: number }>;
  async resetMonthlyUsage(): Promise<void>;
}
```

Rule absolue : `getApiKey()` est marqué `@internal` dans la JSDoc et ne doit
JAMAIS être appelé depuis une route API exposée — uniquement depuis le code
des agents IA.

## Routes API admin

`/admin/assistant-config` :

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/assistant-config` | Récupère la config (api_key NEVER in response, juste api_key_hint et api_key_validated_at) |
| POST | `/admin/assistant-config` | Update config (sauf clé) |
| POST | `/admin/assistant-config/api-key` | Set la clé. Body: `{ apiKey: string }`. Le serveur valide via Anthropic puis stocke |
| DELETE | `/admin/assistant-config/api-key` | Clear la clé |
| POST | `/admin/assistant-config/test` | Re-test la validité de la clé existante |
| GET | `/admin/assistant-config/usage` | Renvoie l'usage mensuel courant |

Validation zod sur tous les inputs.

Toutes ces routes nécessitent l'auth admin Medusa standard.

## Job cron : reset mensuel des tokens

Crée `src/jobs/reset-monthly-usage.ts` :
- Tourne le 1er de chaque mois à 00:05
- Reset `monthly_tokens_used` à 0
- Met à jour `last_reset_at`

Utilise le système de jobs de Medusa v2.

## UI admin : page Settings

Crée `src/admin/routes/settings/assistant-ai/page.tsx` (Medusa permet d'ajouter
des sections custom dans Settings).

Layout :

### Section "Connexion API Anthropic"
- Si pas de clé configurée : input "Coller votre clé API" + bouton "Enregistrer"
  + lien "Comment obtenir une clé Anthropic" (vers https://console.anthropic.com)
- Si clé configurée : affiche le hint (`...abcd`), date de dernière validation,
  bouton "Tester la connexion", bouton "Remplacer la clé", bouton "Supprimer"
- Toast vert si test OK, toast rouge avec message clair si KO

### Section "Modèle et limites"
- Select default_model (claude-sonnet-4-6, claude-opus-4-7, claude-haiku-4-5)
- Tooltip explicatif sur chaque modèle (vitesse, qualité, coût relatif)
- Input max_tokens (slider 1024 → 8192)
- Input monthly_token_limit (optionnel, "Ne pas définir de limite" si vide)

### Section "Sous-agents activés"
- Liste de toggles pour chaque sous-agent disponible (SEO, Marketing,
  Site Content, Analytics)
- Description courte de chaque sous-agent
- Au moins un sous-agent doit rester activé (validation côté UI)

### Section "Audit et conformité"
- Input audit_retention_days
- Bouton "Télécharger les logs des 30 derniers jours" (CSV) — sera implémenté
  en passe 03, pour l'instant juste l'UI désactivée avec tooltip "Bientôt disponible"

### Section "Consommation mensuelle"
- Compteur visuel (progress bar) : `12 345 / 100 000 tokens (12%)`
- Estimation coût en € basée sur le modèle par défaut (formule simple,
  documenter qu'elle est indicative)
- Date du prochain reset
- Bouton "Réinitialiser maintenant" (avec confirmation modal)

### Bandeau d'info en haut
Si la clé n'est pas configurée :
"⚠️ L'assistant IA n'est pas configuré. Renseignez votre clé API Anthropic
ci-dessous pour l'activer."

Si la clé n'a jamais été validée OU validée il y a > 30 jours :
"ℹ️ Pensez à tester la connexion régulièrement pour vous assurer que la clé
est toujours active."

## Sécurité — vérifications obligatoires

- [ ] La clé API n'apparaît JAMAIS dans une réponse HTTP, JAMAIS dans les logs
- [ ] La clé est chiffrée en base, jamais en clair
- [ ] Les routes admin sont protégées par l'auth Medusa
- [ ] La validation zod du body POST de la clé : min length, format
  (commence par `sk-ant-`), max length raisonnable
- [ ] Le hint affiché ne montre QUE les 4 derniers chars
- [ ] Si `ENCRYPTION_KEY` n'est pas définie, l'UI affiche un message clair
  expliquant que l'admin doit la configurer côté serveur

## Variables d'environnement à ajouter dans docs/CONFIGURATION.md

```
# Obligatoire — clé de chiffrement pour la clé API Anthropic en base
# Générer avec : openssl rand -base64 32
ENCRYPTION_KEY=

# Optionnel — modèle par défaut si pas configuré via UI
ASSISTANT_DEFAULT_MODEL=claude-sonnet-4-6

# Optionnel — max tokens par requête
ASSISTANT_MAX_TOKENS=4096
```

## Tests

- Test unitaire : encrypt/decrypt round-trip
- Test unitaire : encrypt avec mauvaise key → erreur
- Test integration : POST de la clé → validation Anthropic → stockage
- Test integration : GET config → la clé n'apparaît pas dans la réponse
- Test : si ENCRYPTION_KEY absente, l'opération de set échoue gracieusement

## Structure de fichiers attendue

```
src/
├── modules/assistant-config/
│   ├── models/assistant-config.ts
│   ├── migrations/
│   ├── service.ts
│   ├── index.ts
│   └── types.ts
├── api/admin/assistant-config/
│   ├── validators.ts
│   ├── route.ts
│   ├── api-key/route.ts
│   ├── test/route.ts
│   └── usage/route.ts
├── admin/
│   └── routes/settings/assistant-ai/
│       ├── page.tsx
│       └── components/
│           ├── api-key-section.tsx
│           ├── model-section.tsx
│           ├── subagents-section.tsx
│           ├── audit-section.tsx
│           └── usage-section.tsx
├── lib/
│   └── crypto.ts
├── jobs/
│   └── reset-monthly-usage.ts
└── index.ts (mise à jour pour exporter le module)

tests/
├── unit/crypto.test.ts
└── integration/assistant-config.test.ts
```

## Procédure d'exécution

1. Crée le module `assistant-config` (model + service + migration). Lance la
   migration. Stop.
2. Crée `src/lib/crypto.ts` + tests unitaires. Lance les tests. Stop.
3. Implémente `setApiKey`, `getApiKey`, `validateApiKey` dans le service.
   Test integration avec une vraie clé Anthropic. Stop.
4. Crée les routes API admin. Test via curl. Stop.
5. Crée l'UI admin section par section. Stop entre chaque section pour me
   montrer.
6. Crée le job cron de reset mensuel.
7. Documente les env vars dans CONFIGURATION.md.
8. Crée tous les tests.
9. Commit : `feat: BYOK config with encrypted API key storage`

## Critères de succès

- Je peux ouvrir Settings > Assistant IA dans le Medusa Admin
- Je peux entrer ma clé API Anthropic
- Le système la valide via un ping à l'API
- La clé est chiffrée en base (vérifier directement avec un SELECT)
- La clé n'apparaît JAMAIS dans les réponses API ni dans les logs
- Je peux changer de modèle, définir une limite mensuelle, désactiver un
  sous-agent
- L'usage mensuel s'affiche (à 0 pour l'instant — sera incrémenté en passe 03)

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] UI Settings > Assistant IA fonctionnelle
- [ ] Clé API stockée chiffrée (vérifier en base)
- [ ] Test de validité fonctionne contre l'API Anthropic
- [ ] Aucune fuite de la clé en réponse HTTP ni dans les logs
- [ ] Le job cron de reset est enregistré
- [ ] Doc CONFIGURATION.md à jour avec les env vars

Si la clé fuite quelque part (logs, response, console), CORRIGE
immédiatement avant de continuer. C'est le risque sécu le plus important
de tout le plugin.
