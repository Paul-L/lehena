# Passe 04 — Admin UI : routes Pages (liste + édition)

## Objectif de cette passe

Intégrer le composant TipTap (passe 03) dans une vraie UI métier pour gérer
les pages depuis le Medusa Admin : liste, création, édition, publication.

Le client final ne touchera qu'à cette UI. Elle doit être propre, intuitive
et résistante aux erreurs.

---

## PROMPT À COPIER-COLLER

```
Passe 04 : UI admin pour la gestion des pages éditoriales.

On consomme :
- Les routes API admin créées en passe 02
- Le composant TiptapEditor créé en passe 03

## Périmètre

- Page liste : `src/admin/routes/pages/page.tsx`
- Page d'édition : `src/admin/routes/pages/[id]/page.tsx`
- Page de création : `src/admin/routes/pages/new/page.tsx`
- Composants partagés : formulaire, sections du panneau settings
- Hooks de fetching (utilise `@tanstack/react-query` qui est déjà dans Medusa Admin)
- Suppression de la page playground créée en passe 03

## Configuration de la route admin

Enregistre la nouvelle entrée de menu via le `defineRouteConfig` :
- Label : "Pages"
- Icône : `FileText` de lucide-react
- Position : après "Categories" dans le menu

## Page liste (`/app/pages`)

### Layout
- Header : titre "Pages éditoriales", bouton CTA "Créer une page" en haut à droite
- Barre de filtres :
  - Input recherche (debounce 300ms, query param `q`)
  - Select status (Tous / Brouillons / Publiées)
  - Select locale (Tous / FR / EN... — dynamique selon les locales détectées)
- Table avec colonnes :
  - Title (cliquable, mène vers édition)
  - Slug (en monospace, gris)
  - Status (badge coloré : gris pour draft, vert pour published)
  - Locale (badge)
  - Updated at (format relatif "il y a 2h")
  - Actions (menu kebab : Voir sur le site / Dupliquer / Supprimer)
- Pagination en bas (limit 20, offset)
- État vide : illustration + texte "Aucune page pour l'instant" + CTA "Créer la première"
- État loading : skeleton de 5 lignes

### Composant à utiliser
Réutiliser le DataTable de Medusa Admin si disponible, sinon une table custom
avec Tailwind (toujours simple et lisible).

### Action "Supprimer"
- Modal de confirmation avec input texte qui demande de retaper le slug
  (protection contre clic accidentel)
- À la confirmation, DELETE puis refresh de la liste

### Action "Dupliquer"
- POST une nouvelle page avec :
  - title = `${original.title} (copie)`
  - slug = `${original.slug}-copie` (ou `-copie-2` si déjà pris)
  - content = même contenu
  - status = draft
- Redirige vers la page d'édition de la copie

## Page d'édition (`/app/pages/:id`)

### Layout deux colonnes
- Gauche (2/3 width) : éditeur TipTap pleine largeur, avec le title en input
  large au-dessus
- Droite (1/3 width) : panneau settings sticky avec sections collapsibles

### Header de la page
- Breadcrumb : Pages > [Title de la page]
- À droite : badge Status + boutons d'action :
  - Si draft : "Enregistrer le brouillon" + "Publier" (CTA principal)
  - Si published : "Enregistrer" + "Dépublier" (secondaire) + "Voir le site"
  - Toujours : indicateur d'auto-save ("Enregistré il y a 5s" / "Modifications non enregistrées" / "Enregistrement..." avec spinner)

### Colonne gauche : zone d'édition

**Bloc Title**
- Input grand format (text-2xl, pas de bordure visible, focus ring discret)
- Placeholder : "Titre de la page"
- Validation : requis, max 200 chars
- Compteur sous l'input : `123 / 200`

**Bloc Slug** (sous le title, plus petit)
- Préfixe : `monsite.com/`
- Input qui auto-génère depuis le title (slugify) tant que pas modifié manuellement
- Bouton cadenas : si fermé, le slug ne se régénère plus automatiquement
- Validation live : montre une icône verte si valide, rouge si invalide,
  avec message d'erreur ("Format invalide" / "Slug déjà utilisé" / "Slug réservé")
- Vérifier l'unicité via un endpoint `GET /admin/pages?slug=xxx` (debounce 500ms)

**Éditeur TipTap**
- Le composant créé en passe 03
- Hauteur min 600px
- maxCharacters : pas de limite

### Colonne droite : panneau settings

**Section "Statut" (toujours ouverte)**
- Affiche le status actuel sous forme de badge
- Si published : montre "Publié le [date]" en gris

**Section "SEO" (collapsible, fermée par défaut)**
- Input meta_title (max 70 chars + compteur, conseil affiché : "60-70 chars idéal")
- Textarea meta_description (max 160 chars + compteur, "150-160 chars idéal")
- Upload og_image_url (input file qui upload via le file service, avec preview)
- Aperçu Google : montre comment la page apparaîtra dans les résultats de recherche

**Section "Localisation" (collapsible)**
- Select locale
- (futur) liens vers les autres traductions de la page

### Comportements

**Auto-save**
- Debounce 30s sur les changements de title, slug, content, et tous les autres
  champs du form
- Sauvegarde en arrière-plan (PATCH `/admin/pages/:id`)
- Indicateur d'état dans le header
- Si erreur de save : toast d'erreur, garde les changements en mémoire

**Sauvegarde manuelle**
- Bouton "Enregistrer le brouillon" fait un PATCH immédiat (sans changer status)
- Bouton "Publier" fait un PATCH puis un POST publish
- Bouton "Dépublier" fait un POST unpublish

**Confirmation avant de quitter**
- Si modifications non sauvegardées et l'utilisateur navigue ailleurs :
  alert "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?"

**Bouton "Voir le site"**
- Ouvre `${STOREFRONT_URL}/${slug}?preview=${PREVIEW_TOKEN}` dans un nouvel onglet
- Le PREVIEW_TOKEN est récupéré via une route admin custom
  `GET /admin/pages/preview-token` qui retourne un JWT court (1h, scope=preview)
- Le storefront vérifiera ce token (sera implémenté en passe 05)

## Page de création (`/app/pages/new`)

Mêmes composants que l'édition, mais :
- Pas de bouton "Publier" tant que la page n'est pas créée (POST initial = draft)
- Au premier save (auto ou manuel), redirige vers `/app/pages/:id` avec l'ID
- L'auto-save attend que le title soit rempli avant de déclencher la première
  création (sinon on créerait des pages "Sans titre" en pagaille)

## Hooks React Query

Crée un fichier `src/admin/hooks/use-pages.ts` avec :
- `usePages(query)` — liste paginée avec filtres
- `usePage(id)` — une page
- `useCreatePage()` — mutation
- `useUpdatePage(id)` — mutation
- `useDeletePage()` — mutation avec invalidation de la liste
- `usePublishPage(id)` — mutation
- `useUnpublishPage(id)` — mutation
- `useCheckSlugAvailability(slug, excludeId?)` — query debounced

Toutes les mutations invalident les bons keys pour rafraîchir l'UI.

## Validation côté client

Utilise `react-hook-form` + `zod` (déjà dans Medusa Admin).

Schema partagé entre client et serveur si possible (re-exporter depuis le
backend, ou dupliquer en restant aligné).

## Toasts

Utilise le système de toast de Medusa Admin. Cas à couvrir :
- Page créée : "Page créée avec succès"
- Page publiée : "Page publiée"
- Page dépubliée : "Page dépubliée"
- Page supprimée : "Page supprimée"
- Erreur réseau : "Une erreur est survenue. Réessayez."
- Erreur de validation : "Vérifiez les champs en erreur."

## Ménage

À la fin de cette passe, supprime :
- `src/admin/routes/tiptap-playground/page.tsx`
- Tout fichier de la passe 03 qui n'est plus référencé

## Structure de fichiers attendue

```
backend/src/admin/
├── routes/pages/
│   ├── page.tsx                    # liste
│   ├── new/page.tsx                # création
│   └── [id]/page.tsx               # édition
├── components/pages/
│   ├── pages-table.tsx
│   ├── page-form.tsx               # form principal (réutilisé new + edit)
│   ├── page-header.tsx             # header avec actions
│   ├── title-input.tsx
│   ├── slug-input.tsx
│   ├── status-badge.tsx
│   ├── delete-page-modal.tsx
│   ├── settings-panel/
│   │   ├── index.tsx
│   │   ├── status-section.tsx
│   │   ├── seo-section.tsx
│   │   ├── seo-google-preview.tsx
│   │   └── locale-section.tsx
│   └── auto-save-indicator.tsx
├── hooks/
│   ├── use-pages.ts                # tous les hooks React Query
│   └── use-auto-save.ts            # hook réutilisable de debounced save
└── lib/
    ├── slugify.ts
    └── api-client.ts               # wrapper fetch typé
```

## Procédure d'exécution

1. Crée les hooks React Query. Stop, montre-moi.
2. Crée la page liste (sans actions encore). Vérifie qu'elle affiche les
   pages créées en passe 02. Stop.
3. Ajoute les filtres et la pagination. Stop.
4. Ajoute les actions (delete, dupliquer). Stop.
5. Crée la page d'édition avec le form complet (sans auto-save). Vérifie
   qu'on peut éditer + sauver manuellement. Stop.
6. Ajoute le panneau settings (toutes les sections). Stop.
7. Ajoute l'auto-save. Stop.
8. Ajoute la création (page new). Stop.
9. Ajoute le bouton preview + la route admin du token. Stop.
10. Supprime la playground.
11. Test end-to-end : créer une page, écrire du contenu, sauver, publier,
    voir l'indicateur de save, dépublier, supprimer.
12. Commit : `feat(pages): add admin UI for page management`

## Critères de succès

À la fin de cette passe :
- L'entrée "Pages" apparaît dans le menu du Medusa Admin
- Je peux créer une page depuis l'admin
- Je peux écrire dans l'éditeur, formater, ajouter une image
- L'auto-save fonctionne (visible dans l'indicateur)
- Le slug se génère depuis le title et peut être verrouillé
- La validation slug live fonctionne (réservés, format, unicité)
- Je peux publier et dépublier
- Je peux supprimer (avec confirmation par retape du slug)
- Je peux dupliquer une page
- Le bouton preview ouvre le storefront (qui n'affichera rien encore — la passe 05 le branchera)

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Menu "Pages" visible dans le Medusa Admin
- [ ] CRUD complet fonctionnel via l'UI
- [ ] Éditeur TipTap intégré et stable
- [ ] Auto-save visible et fiable
- [ ] Validation slug en temps réel
- [ ] Pas de régression sur les routes API de la passe 02
- [ ] Playground supprimée

Si l'UX te paraît rugueuse, n'hésite pas à demander des affinages ciblés
("le compteur du title est mal placé", "l'auto-save indicator clignote trop")
plutôt que de tout relancer.
