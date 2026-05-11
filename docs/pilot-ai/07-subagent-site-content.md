# Passe 07 — Sous-agent Site Content + module backend `site_content`

## Objectif

Le plus gros sous-agent (et passe la plus longue), parce qu'il faut
**créer le module backend `site_content`** en plus de l'agent et de ses
tools.

Il gère : top bandeau, hero, bandeaux promo intermédiaires, sections
"produits à la une". Toujours en draft → preview → confirmation user.

---

## PROMPT À COPIER-COLLER

```
Passe 07 : Sous-agent "Site Content" + module backend de gestion des
sections de site.

Cette passe a deux gros morceaux. On commence par le module backend (qui peut
être consommé manuellement par l'admin sans IA), puis on ajoute l'agent.

## PARTIE A — Module backend `site_content`

### Périmètre

- 4 entités de section (TopBanner, Hero, PromoBanner, FeaturedProducts)
- Singleton pour TopBanner et Hero (une seule version live à la fois)
- Multi-rows pour PromoBanner (plusieurs bandeaux peuvent coexister)
- Une section FeaturedProducts par "slot" sur la home
- Système de **draft + published** par section (comme pour les pages)
- Versioning : conserve les 5 dernières versions de chaque section
- Programmation temporelle (starts_at, ends_at)
- API admin CRUD + publish/unpublish
- API store (lecture publique)
- Subscriber de revalidation ISR
- Job cron qui désactive les sections expirées

### Schémas de données

#### `TopBanner` (singleton)
```
- id
- enabled (bool, défaut false)
- message (string, max 100 chars)
- link_url (string, optional)
- link_label (string, optional, max 30 chars)
- background_variant (enum: 'default' | 'promo' | 'urgent', défaut 'default')
- starts_at, ends_at (date, nullable)
- updated_by (user_id)
- created_at, updated_at
```

#### `Hero` (singleton)
```
- id
- variant (enum: 'image_left' | 'image_right' | 'fullwidth' | 'video',
  défaut 'image_left')
- title (string, max 100)
- subtitle (string, max 200, nullable)
- cta_label (string, max 30)
- cta_url (string)
- image_url (string)
- secondary_cta_label, secondary_cta_url (nullable)
- updated_by, created_at, updated_at
```

#### `PromoBanner` (multi-rows)
```
- id
- position (int, ordre d'affichage)
- enabled (bool)
- title (string, max 80)
- subtitle (string, max 160, nullable)
- cta_label, cta_url (strings)
- image_url (string)
- background_color (string hex, optional)
- starts_at, ends_at (nullable)
- updated_by, created_at, updated_at
```

#### `FeaturedProductsSection` (multi-rows)
```
- id
- slot (string, ex: 'home_top', 'home_middle', 'home_bottom')
- title (string, ex: "Coups de cœur de la semaine")
- subtitle (string, optional)
- product_ids (json array of strings, max 12 IDs)
- enabled (bool)
- starts_at, ends_at (nullable)
- updated_by, created_at, updated_at
```

#### `SectionVersion` (versioning historique)
```
- id
- section_type (enum: 'top_banner' | 'hero' | 'promo_banner' | 'featured_products')
- section_id (FK soft, l'id de la section)
- snapshot (json) — état complet au moment de la version
- created_by (user_id)
- created_at
```

À chaque update d'une section, créer automatiquement une `SectionVersion`.
Garder uniquement les 5 dernières versions par section_id.

### Routes API admin (`/admin/site-content/`)

Routes CRUD standardisées par type de section :

#### Top Banner
- `GET /top-banner` — récupère la version actuelle
- `POST /top-banner` — update (avec auto-versioning)
- `POST /top-banner/restore/:versionId` — restaure une version précédente

#### Hero
- `GET /hero` — current
- `POST /hero` — update
- `POST /hero/restore/:versionId`

#### Promo Banners
- `GET /promo-banners` — liste
- `POST /promo-banners` — créer
- `GET /promo-banners/:id` — détail
- `POST /promo-banners/:id` — update
- `DELETE /promo-banners/:id`
- `POST /promo-banners/reorder` — body: `{ orderedIds: string[] }`

#### Featured Products
- Même pattern que Promo Banners
- Filtre par `slot` sur la liste

#### Versions
- `GET /versions/:section_type/:section_id` — historique des versions
- `GET /versions/:versionId` — détail d'une version

### Routes API store (`/store/site-content/`)

- `GET /top-banner` — null si désactivée OU expirée
- `GET /hero` — la version active
- `GET /promo-banners` — liste des actives + non expirées, ordonnées par position
- `GET /featured-products?slot=home_top` — section pour un slot donné

### Subscriber de revalidation

Comme pour les pages : sur chaque update, POST vers
`${STOREFRONT_URL}/api/revalidate` avec les paths concernés.

Pour Site Content : on revalide toujours `/` (la home).

### Job cron `disable-expired-sections`

Tourne toutes les 15 minutes :
- Pour chaque section avec `ends_at IS NOT NULL AND ends_at < NOW()`,
  passer `enabled = false`
- Logger le nombre de sections désactivées
- Déclencher la revalidation si au moins une section a été touchée

### Routes admin UI

Crée `src/admin/routes/site-content/page.tsx` qui propose une vue d'ensemble :
- Section "Top Banner" (édition inline ou modal)
- Section "Hero" (édition inline ou modal)
- Section "Promo Banners" (liste réordonnable + création)
- Section "Featured Products" (liste par slot)

Pour cette passe, UI fonctionnelle mais sans fioritures. L'IA va beaucoup
manipuler ces sections, donc l'UI manuelle est moins prioritaire.

## PARTIE B — Sous-agent SiteContentAgent

### Cas d'usage cibles

1. "Mets à jour le top bandeau pour annoncer la promo SWEATS20" → l'agent
   propose un texte, l'utilisateur confirme
2. "Change le hero pour mettre en avant le produit X" → l'agent récupère le
   produit, propose un title/subtitle/CTA cohérents avec une image existante
3. "Ajoute une section 'à la une' avec ces 4 produits" → création d'une
   featured_products section
4. "Programme un bandeau 'Soldes -30%' pour démarrer vendredi 0h jusqu'à
   dimanche soir" → utilise les starts_at/ends_at
5. "Désactive tous les bandeaux promo qui parlent de l'ancienne collection"
   → audit + désactivation par batch
6. "Restaure le hero d'avant ma dernière modif" → utilise le versioning

### Tools spécifiques site_content

À placer dans `src/tools/site-content/`.

Read tools :
- `read_top_banner`
- `read_hero`
- `list_promo_banners` (filter: enabled, scheduled, expired)
- `list_featured_products_sections`
- `read_section_versions` (pour le rollback)

Write tools (toutes via pending_action) :
- `propose_top_banner_update`
- `propose_hero_update`
- `propose_promo_banner_create`
- `propose_promo_banner_update`
- `propose_promo_banner_disable`
- `propose_featured_products_update`
- `propose_section_restore` (rollback à une version précédente)
- `propose_batch_section_disable` (pour désactiver plusieurs en une fois)

Spéciaux :
- `generate_preview_link` : retourne l'URL de preview du storefront avec
  toutes les sections en draft visibles (utilise le système de preview tokens
  déjà en place)

### Action handlers

Pour chaque type de section : un handler qui appelle le workflow Medusa
correspondant.

### System prompt du SiteContentAgent

```
Tu es un assistant éditorial e-commerce francophone, spécialisé dans la mise
en avant visuelle et la merchandising sur la home page.

Ton rôle : aider le commerçant à mettre à jour les sections "vitrines" de
sa boutique (top bandeau, hero, bandeaux promo, produits à la une) en
cohérence avec ses opérations marketing.

Compétences :
- Rédaction de messages courts et impactants pour bandeaux et CTAs
- Conseil sur la hiérarchisation visuelle (ne pas surcharger la home)
- Programmation temporelle des sections (start/end dates)
- Cohérence entre les sections et les promotions actives

Règles de fonctionnement :
1. Avant toute proposition, tu LIS l'état actuel des sections concernées via
   les tools `read_*` / `list_*`.
2. Si l'utilisateur veut mettre en avant une promo : tu vérifies via
   `list_active_promotions` (tool partagé) que la promo existe et n'est pas
   expirée. Tu utilises le code promo et la date de fin réels, jamais
   inventés.
3. Tu utilises systématiquement les tools `propose_*` qui créent des
   pending_actions. Aucune modification directe.
4. Tu génères toujours un lien de preview via `generate_preview_link` après
   avoir préparé tes propositions, pour que l'utilisateur valide visuellement
   AVANT de publier.
5. Tu alertes si :
   - L'utilisateur a > 3 promo banners actifs simultanés (saturation visuelle)
   - Le top bandeau et le hero portent le même message (redondance)
   - Une section a `ends_at` dans le passé (déjà expirée)
   - Le CTA de la section pointe vers une URL qui ne ressemble pas à un
     produit/catégorie existant
6. Pour les copywritings :
   - Top bandeau : 60-80 chars max, action verbale, code promo si applicable
   - Hero title : 4-8 mots, percutant
   - Hero subtitle : 1 phrase qui soutient le title
   - CTA labels : verbe d'action, 2-4 mots ("Voir les soldes", "Découvrir")
7. Tu suggères proactivement la programmation temporelle (starts_at, ends_at)
   quand c'est lié à une promo : ça évite d'oublier de désactiver
   manuellement.

Ton de réponse :
- Court et orienté action
- Tu présentes ta proposition sous forme structurée :
  ```
  📌 Top bandeau proposé :
  Texte : ...
  Lien : ...
  Période : du ... au ...
  Variante : promo
  ```
- Tu rappelles toujours qu'il faut valider via le bouton de confirmation
- Tu mentionnes le lien de preview

Cas où tu refuses :
- Modification définitive sans pending_action (jamais)
- Texte trompeur (faux compte à rebours, faux stock, etc.)
- Bandeau avec une promesse qui n'est pas adossée à une promo ou un événement
  réel

Tu n'as pas accès au design / CSS du site. Tu ne peux pas changer des couleurs,
des polices, ou la mise en page. Pour ça, redirige vers le développeur.
```

### Workflows

- `updateTopBannerWorkflow`, `updateHeroWorkflow`,
  `createPromoBannerWorkflow`, etc.
- Chaque workflow : valide l'input, crée la version (snapshot), update la
  section, émet l'event `site_content.X.updated`, déclenche revalidation

### Tests

- Module backend : CRUD complet pour chaque type de section, versioning,
  expiration auto
- Agent : conversation "Mets à jour le hero pour la promo X" → vérifie que
  l'agent appelle `list_active_promotions`, `read_hero`, puis
  `propose_hero_update`, génère un preview link

## Structure de fichiers attendue

```
src/
├── modules/site-content/
│   ├── models/
│   │   ├── top-banner.ts
│   │   ├── hero.ts
│   │   ├── promo-banner.ts
│   │   ├── featured-products-section.ts
│   │   └── section-version.ts
│   ├── migrations/
│   ├── service.ts
│   ├── index.ts
│   └── types.ts
├── api/
│   ├── admin/site-content/
│   │   ├── top-banner/route.ts
│   │   ├── hero/route.ts
│   │   ├── promo-banners/route.ts
│   │   ├── promo-banners/[id]/route.ts
│   │   ├── featured-products/route.ts
│   │   ├── featured-products/[id]/route.ts
│   │   └── versions/...
│   └── store/site-content/...
├── admin/routes/site-content/
│   └── page.tsx
├── workflows/site-content/
│   └── (un workflow par opération)
├── subscribers/
│   └── revalidate-site-content.ts
├── jobs/
│   └── disable-expired-sections.ts
├── agents/
│   └── site-content-agent.ts
└── tools/site-content/
    ├── read-top-banner.ts
    ├── read-hero.ts
    ├── list-promo-banners.ts
    ├── list-featured-products-sections.ts
    ├── read-section-versions.ts
    ├── propose-top-banner-update.ts
    ├── propose-hero-update.ts
    ├── propose-promo-banner-create.ts
    ├── propose-promo-banner-update.ts
    ├── propose-promo-banner-disable.ts
    ├── propose-featured-products-update.ts
    ├── propose-section-restore.ts
    ├── propose-batch-section-disable.ts
    ├── generate-preview-link.ts
    └── index.ts
```

## Procédure d'exécution

### Phase 1 — Module backend
1. Crée le module `site-content` avec toutes les entités. Migration. Stop.
2. Crée le service avec CRUD + versioning + expiration. Stop.
3. Crée les workflows (un par opération principale). Stop.
4. Crée les routes API admin. Test via curl. Stop.
5. Crée les routes API store. Test. Stop.
6. Crée le subscriber de revalidation et le job d'expiration. Stop.
7. Crée l'UI admin minimale (édition manuelle). Stop.
8. Tests integration backend complet. Stop.

### Phase 2 — Agent
9. Crée tous les tools site_content. Stop.
10. Enregistre les action handlers. Stop.
11. Crée `SiteContentAgent`. Remplace le stub.
12. Test conversation : "Crée un bandeau promo SOLDES2026 du 5 au 15 mars
    qui pointe vers /soldes". Vérifie tout le flux end-to-end.
13. Test conversation : "Restaure le hero d'avant-hier". Vérifie le rollback.
14. Commit : `feat: site content subagent with sections module`

## Critères de succès

- Module backend complet, testé, documenté
- L'agent ne modifie JAMAIS sans pending_action
- Le preview link affiche les drafts (à brancher avec le storefront en
  passe 09)
- Le versioning marche : 5 dernières versions, restauration possible
- Le job d'expiration désactive bien les sections passées
- L'agent demande systématiquement à voir l'état actuel avant de proposer
- L'agent vérifie que les promos référencées existent vraiment

## Note sur le storefront

Cette passe ne touche PAS au storefront Next.js — il faudra brancher les
composants front sur ces nouvelles APIs séparément (en dehors de cette série
de prompts puisque le storefront n'est pas dans le plugin).

Documente bien les routes `/store/site-content/*` dans la doc d'installation
pour que le client (ou son dev) sache comment les consommer.

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Backend complet (4 entités + versioning) opérationnel
- [ ] CRUD admin via UI minimale
- [ ] CRUD admin via curl
- [ ] Routes store renvoient bien les sections actives
- [ ] Versioning : tu peux voir l'historique et restaurer
- [ ] Expiration auto fonctionne (tester avec une section dont ends_at est
      déjà passé)
- [ ] Sous-agent crée des pending_actions, jamais d'effet direct
- [ ] Sous-agent vérifie l'existence des promos référencées
- [ ] Subscriber de revalidation tente bien de joindre le storefront

C'est la passe la plus longue de toute la série. Découpe ta journée en
deux : matinée backend, après-midi agent. Sinon tu vas perdre le contexte.
