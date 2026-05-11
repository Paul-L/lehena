# Passe 02 — Backend : module Medusa Pages

## Objectif de cette passe

Créer toute la couche backend du module : entité, service, migrations,
routes API admin et store, workflows, subscriber de revalidation.

**Aucune UI dans cette passe.** On testera tout via curl / Postman.

---

## PROMPT À COPIER-COLLER

```
Passe 02 : Création du module backend "pages" pour Medusa v2.

On reste cohérents avec les choix validés en passe 01.

## Périmètre de cette passe

- Module Medusa custom `pages` (entité + service + migrations)
- Routes API admin (CRUD complet + publish/unpublish)
- Routes API store (lecture publique des pages publiées)
- Workflows pour les opérations à effets de bord
- Subscriber qui appelle la revalidation Next.js sur publish/update
- Tests minimaux (un par route API)

## Spécifications de l'entité Page

Champs :
- `id` (généré par Medusa)
- `slug` (string, unique, kebab-case, requis, indexé)
- `title` (string, requis, max 200 chars)
- `content` (json, contenu TipTap au format JSON)
- `excerpt` (string, optionnel, max 300 chars)
- `meta_title` (string, optionnel, max 70 chars)
- `meta_description` (string, optionnel, max 160 chars)
- `og_image_url` (string, optionnel, URL valide)
- `status` (enum: 'draft' | 'published', défaut 'draft', indexé)
- `published_at` (date, nullable)
- `locale` (string, défaut 'fr', indexé)
- `created_at`, `updated_at`, `deleted_at` (auto, soft delete)

Validation slug — interdire ces valeurs réservées :
`cart, checkout, products, product, account, admin, api, store, collections,
categories, search, login, register, orders, _next, static`

Forcer le format kebab-case via regex : `^[a-z0-9]+(?:-[a-z0-9]+)*$`

## Routes API admin (`/admin/pages`)

Toutes protégées par le middleware admin auth de Medusa.

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/pages` | Liste paginée. Query params : `limit`, `offset`, `status`, `locale`, `q` (recherche sur title et slug) |
| GET | `/admin/pages/:id` | Détail complet |
| POST | `/admin/pages` | Création (status par défaut = draft) |
| POST | `/admin/pages/:id` | Update partiel |
| DELETE | `/admin/pages/:id` | Soft delete |
| POST | `/admin/pages/:id/publish` | Passe status à published, set published_at si null, déclenche revalidation |
| POST | `/admin/pages/:id/unpublish` | Repasse en draft, déclenche revalidation |

Réponse standard : `{ page: Page }` ou `{ pages: Page[], count, limit, offset }`.

## Routes API store (`/store/pages`)

Pas d'auth, mais ne renvoyer que les pages publiées (sauf preview).

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/store/pages` | Liste des publiées (champs : id, slug, title, excerpt, meta_title, meta_description, og_image_url, locale, published_at). PAS de content. |
| GET | `/store/pages/:slug` | Page complète par slug |

Headers :
- `x-preview-token` : si présent et égal à `PREVIEW_SECRET` (env), autorise
  l'accès aux drafts. Sinon 404 si la page est en draft.

Si pas trouvé : 404 avec `{ message: "Page not found" }`.

## Workflows

Créer les workflows suivants dans `src/workflows/pages/` :

1. `createPageWorkflow` : valide les inputs, crée la page, émet
   l'event `page.created`
2. `updatePageWorkflow` : valide, update, émet `page.updated`
3. `publishPageWorkflow` : update status + published_at, émet `page.published`
4. `unpublishPageWorkflow` : update status, émet `page.unpublished`
5. `deletePageWorkflow` : soft delete, émet `page.deleted`

Les routes API appellent ces workflows, jamais le service directement.

## Subscriber de revalidation

Fichier `src/subscribers/revalidate-page.ts`.

Écoute les events : `page.published`, `page.updated`, `page.unpublished`,
`page.deleted`.

Pour chaque event :
1. Récupère le slug de la page
2. POST vers `${STOREFRONT_URL}/api/revalidate` avec :
   - Header `x-revalidate-secret: ${REVALIDATE_SECRET}`
   - Body : `{ slug: string, paths: ['/'] }` (on revalide aussi la home au cas où)
3. Log le résultat (success/failure), ne pas faire échouer le workflow si la
   revalidation échoue (le storefront peut être down sans bloquer l'admin)
4. Timeout de 5s sur le fetch

## Variables d'environnement

À ajouter dans `.env.example` du backend :
```
STOREFRONT_URL=http://localhost:8000
REVALIDATE_SECRET=change-me-to-a-long-random-string
PREVIEW_SECRET=change-me-too
```

## Validation zod

Dans `src/api/admin/pages/validators.ts` :
- `createPageSchema`
- `updatePageSchema` (partial)
- `listPagesQuerySchema`

Utiliser `zod` (déjà dans Medusa v2). Validation au niveau de la route via le
middleware `validateAndTransformBody` / `validateAndTransformQuery` de Medusa.

## Tests

Pour chaque route admin et store, un test minimal qui :
- Setup une page de test (helper `createTestPage`)
- Appelle la route avec un token admin valide (ou sans pour les routes store)
- Vérifie le code HTTP et la shape de la réponse

Pas besoin de couvrir 100%, juste les happy paths + les 404 / 401 / 400 évidents.

## Structure de fichiers attendue

```
backend/src/
├── modules/pages/
│   ├── models/page.ts
│   ├── migrations/Migration<timestamp>.ts
│   ├── service.ts
│   ├── index.ts
│   └── types.ts
├── api/
│   ├── admin/pages/
│   │   ├── validators.ts
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   ├── [id]/publish/route.ts
│   │   └── [id]/unpublish/route.ts
│   ├── store/pages/
│   │   ├── route.ts
│   │   └── [slug]/route.ts
│   └── middlewares.ts (registration des middlewares)
├── workflows/pages/
│   ├── create-page.ts
│   ├── update-page.ts
│   ├── publish-page.ts
│   ├── unpublish-page.ts
│   ├── delete-page.ts
│   └── index.ts
├── subscribers/
│   └── revalidate-page.ts
└── __tests__/api/pages/
    ├── admin-pages.test.ts
    └── store-pages.test.ts
```

## Procédure d'exécution

1. Crée d'abord la structure de fichiers vide (`mkdir`/`touch`) et
   présente-la moi pour validation
2. Code le module (model + service + migration). Stop. Lance la migration.
   Confirme que ça compile.
3. Code les workflows. Stop. Confirme que ça compile.
4. Code les routes API admin. Stop. Lance le serveur, teste un `POST` et un
   `GET` via curl, montre-moi la réponse.
5. Code les routes API store. Stop. Test via curl.
6. Code le subscriber. Stop.
7. Code les tests. Lance-les, montre-moi le résultat.
8. Commit final : `feat(pages): add backend module with admin and store APIs`

## Ce que tu NE fais PAS dans cette passe

- Aucun fichier dans `src/admin/` (UI = passe 03 et 04)
- Aucun fichier dans le storefront (= passe 05)
- Pas de seed (= passe 06)

## Critères de succès

À la fin de cette passe, je dois pouvoir :
- Créer une page via `POST /admin/pages` avec un body JSON
- La récupérer via `GET /admin/pages/:id`
- La publier via `POST /admin/pages/:id/publish`
- La voir via `GET /store/pages/:slug` (et pas la voir si elle est en draft)
- Voir le subscriber tenter d'appeler le storefront (qui répondra 404 pour
  l'instant, c'est normal)

Si quelque chose te bloque (ambiguïté, conflit avec l'existant), arrête-toi
et demande-moi.

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] La migration tourne sans erreur
- [ ] `curl POST` admin crée bien une page
- [ ] `curl GET` admin la récupère
- [ ] `curl POST publish` la passe en published
- [ ] `curl GET` store la renvoie quand publiée, 404 quand en draft
- [ ] `curl GET` store avec header `x-preview-token` valide renvoie aussi les drafts
- [ ] Les tests passent
- [ ] Le commit est propre

Si l'un de ces points fail, fais corriger avant de passer à la passe 03.
