# Passe 07 — Test end-to-end et validation

## Objectif de cette passe

Plan de test manuel complet pour valider que tout marche ensemble dans des
conditions proches du réel. À faire AVANT de mettre en prod ou de livrer
au client.

C'est aussi un excellent test de recette à faire valider par le client final
pour qu'il signe la livraison du module.

---

## PROMPT À COPIER-COLLER (optionnel — surtout pour aider à corriger les bugs trouvés)

```
Passe 07 : Validation end-to-end du module Pages.

Je vais exécuter le plan de test ci-dessous manuellement. À chaque bug
trouvé, je te le décris (symptôme, étapes pour reproduire, comportement
attendu vs observé) et tu me proposes un fix ciblé sans casser le reste.

Avant de commencer, lance les vérifications automatiques suivantes et
dis-moi si quelque chose ne passe pas :

1. Backend :
   - `npm run build` (pas d'erreur TypeScript)
   - `npm test` (tous les tests passent)
   - `npx medusa db:migrate` (pas de migration en attente)

2. Storefront :
   - `npm run build` (pas d'erreur TypeScript ni de Next.js)
   - `npm test` (tests passent)

Si tout est vert, je commence le plan de test manuel et te reviens avec
les résultats.
```

---

## Plan de test manuel

### Phase 1 — Setup propre

- [ ] Drop la base de données et relance la migration
- [ ] Lance le seed (`npx medusa exec ./src/scripts/seed-pages.ts`)
- [ ] Vérifie que 5 pages sont visibles dans le Medusa Admin

### Phase 2 — Backend / API

À faire avec curl ou Postman, pas via l'UI.

#### Routes admin
- [ ] `POST /admin/pages` avec body valide → 201 + page créée
- [ ] `POST /admin/pages` avec slug invalide ("Cart" majuscule, "checkout" réservé, "abc def" espace) → 400 avec message clair
- [ ] `POST /admin/pages` avec slug déjà existant → 400 / 409
- [ ] `POST /admin/pages` sans token admin → 401
- [ ] `GET /admin/pages` → liste paginée
- [ ] `GET /admin/pages?status=draft` → uniquement les drafts
- [ ] `GET /admin/pages?q=propos` → trouve la page "À propos"
- [ ] `POST /admin/pages/:id` avec update partiel → 200 + page MAJ
- [ ] `POST /admin/pages/:id/publish` → 200 + status=published + published_at set
- [ ] `POST /admin/pages/:id/unpublish` → 200 + status=draft (mais published_at reste set)
- [ ] `DELETE /admin/pages/:id` → 200 + page soft-deleted
- [ ] Tenter de re-créer une page avec un slug soft-deleted → fonctionne ou erreur claire

#### Routes store
- [ ] `GET /store/pages` → seulement les publiées, sans le contenu détaillé
- [ ] `GET /store/pages/a-propos` → page complète
- [ ] `GET /store/pages/notre-prochaine-collection` → 404 (page draft)
- [ ] `GET /store/pages/notre-prochaine-collection` avec header `x-preview-token: <secret>` → 200
- [ ] `GET /store/pages/inexistant` → 404
- [ ] `GET /store/pages/Cart` (slug réservé) → 404 ou 400

### Phase 3 — Admin UI

- [ ] L'entrée "Pages" est visible dans le menu de gauche
- [ ] La liste affiche les 5 pages d'exemple
- [ ] Recherche "FAQ" filtre correctement
- [ ] Filtre status "Brouillons" affiche uniquement la page draft
- [ ] Tri / pagination si applicable
- [ ] Click sur une page ouvre l'éditeur

#### Création
- [ ] Bouton "Créer une page" → page vide
- [ ] Tape un title → le slug se génère automatiquement
- [ ] Modifie le slug manuellement → cadenas se ferme, slug ne change plus avec le title
- [ ] Tape un slug invalide → message d'erreur immédiat
- [ ] Tape un slug existant → message "déjà utilisé"
- [ ] Auto-save crée la page (vérifie en base que la row existe avant le premier "save" manuel)
- [ ] Redirection vers `/app/pages/:id` après première save

#### Édition de contenu (TipTap)
- [ ] Tape du texte → s'affiche normalement
- [ ] Sélectionne du texte → bubble menu apparaît
- [ ] Bold via toolbar / raccourci / bubble menu → texte gras
- [ ] Italic, Strike, Code inline : idem
- [ ] H2, H3, H4 → titres avec bonne hiérarchie
- [ ] Liste à puces → puces visibles
- [ ] Liste numérotée → numéros corrects
- [ ] Blockquote → blockquote stylé
- [ ] Code block → mono + fond gris
- [ ] Horizontal rule → ligne
- [ ] Link via toolbar → popover s'ouvre, applique le lien
- [ ] Link via raccourci Cmd/Ctrl+K → popover s'ouvre
- [ ] Sur un lien existant → le popover affiche l'URL actuelle
- [ ] Suppression de lien depuis le popover → texte conservé sans lien
- [ ] Image via bouton toolbar → input file s'ouvre, upload, image insérée
- [ ] Image via drag & drop sur l'éditeur → upload + insertion
- [ ] Image via paste depuis presse-papier → upload + insertion
- [ ] Erreur réseau pendant upload → toast d'erreur
- [ ] Undo / Redo → fonctionnent correctement
- [ ] Compteur de caractères s'incrémente
- [ ] Le contenu survit à un refresh de page (sauvegardé)

#### Settings panel
- [ ] Section SEO : meta_title, meta_description, og_image
- [ ] Compteurs SEO mettent à jour en temps réel
- [ ] Aperçu Google se met à jour quand on tape
- [ ] Upload og_image fonctionne, preview affiché
- [ ] Section Localisation : select locale fonctionne

#### Publication
- [ ] Bouton "Publier" sur une page draft → status passe à published
- [ ] Indicateur status MAJ immédiatement
- [ ] Bouton "Dépublier" sur published → status passe à draft
- [ ] Bouton "Voir le site" ouvre le storefront dans un nouvel onglet
- [ ] L'URL contient le preview token

#### Suppression
- [ ] Action "Supprimer" depuis la liste → modal de confirmation
- [ ] Modal demande de retaper le slug
- [ ] Confirmation → page supprimée, liste rafraîchie
- [ ] Toast de confirmation

#### Auto-save
- [ ] Modifie un champ, attends 30s sans rien faire → indicateur passe à "Enregistrement..."
- [ ] Puis "Enregistré il y a Xs"
- [ ] Modifie en continu → l'auto-save attend bien la pause de 30s
- [ ] Tente de fermer l'onglet avec modifs non sauvées → alerte navigateur

### Phase 4 — Storefront

- [ ] `https://localhost:8000/a-propos` → page s'affiche
- [ ] View Source : le contenu est dans le HTML statique (pas seulement après JS)
- [ ] Title de l'onglet = meta_title (ou title si pas de meta_title)
- [ ] `<meta name="description">` correct
- [ ] `<meta property="og:image">` correct si og_image_url set
- [ ] `<link rel="canonical">` correct
- [ ] Mise en forme : titres, paragraphes, listes, citations, code, images
- [ ] Liens : `target="_blank"` et `rel="noopener noreferrer"` présents
- [ ] Images : utilisation de next/image, lazy loading, dimensions correctes
- [ ] `https://localhost:8000/notre-prochaine-collection` (draft) → 404
- [ ] Avec `?preview=<token>` → page visible + bandeau preview en haut
- [ ] Bouton "Quitter le preview" supprime le query param
- [ ] `https://localhost:8000/page-inexistante` → 404 propre
- [ ] `https://localhost:8000/sitemap.xml` → liste les pages publiées avec lastmod

### Phase 5 — Revalidation à la demande

- [ ] Modifier le title d'une page publiée dans l'admin
- [ ] Recharger le storefront immédiatement → la modification est visible
  (sans attendre le revalidate de 1h)
- [ ] Vérifier dans les logs Next.js qu'un appel POST /api/revalidate a été reçu
- [ ] Couper le storefront, modifier une page dans l'admin → l'admin ne crashe
  pas, juste un log de warning côté backend (subscriber tolérant)
- [ ] Modifier le `REVALIDATE_SECRET` côté storefront seulement → la modif admin
  ne déclenche plus rien sur le front (pas de regression admin)

### Phase 6 — Cas limites & robustesse

- [ ] Créer une page avec un titre de 1 caractère → OK
- [ ] Créer une page avec un titre vide → erreur claire
- [ ] Créer une page avec un titre de 200+ chars → erreur claire
- [ ] Coller dans l'éditeur un gros bloc de texte (10 000 caractères) → pas de
  freeze, pas de crash
- [ ] Insérer 10 images dans un seul article → pas de souci de perf
- [ ] Connexion internet coupée pendant l'auto-save → indicateur passe en erreur,
  pas de perte de contenu
- [ ] Deux onglets ouverts sur la même page → le second qui save écrase le
  premier (last-write-wins, à confirmer comme comportement souhaité)
- [ ] Réouvrir une page sauvée 3 fois pour vérifier qu'on ne perd jamais de
  contenu

### Phase 7 — Performance

- [ ] Lighthouse sur une page éditoriale → score Performance > 90, SEO 100
- [ ] First Contentful Paint < 1.5s
- [ ] Bundle size storefront avant/après ajout du module → différentiel
  raisonnable (le renderer ne devrait ajouter que quelques ko)
- [ ] Pas de hydration mismatch dans la console

### Phase 8 — Sécurité

- [ ] Routes admin sans token → 401
- [ ] Routes admin avec token customer (non-admin) → 401/403
- [ ] Tenter d'uploader un fichier non-image dans le bouton image → rejeté
- [ ] Tenter d'uploader un fichier > 10 MB → rejeté
- [ ] Insérer un script `<script>alert(1)</script>` dans le contenu via paste
  HTML → pas exécuté côté front (TipTap sanitise + le renderer ne fait pas
  `dangerouslySetInnerHTML`)
- [ ] Insérer un lien `javascript:alert(1)` → pas exécuté (link extension de
  TipTap rejette les protocoles dangereux)

---

## Critères de validation finale

Tu peux livrer / mettre en prod si :

- [ ] Tous les tests automatiques passent
- [ ] Toutes les sections du plan manuel sont cochées (ou les manquements sont
      documentés et acceptés comme non-bloquants)
- [ ] Aucun bug bloquant ouvert
- [ ] Le client final a fait sa propre recette sur les Phases 3 et 4 et signé
- [ ] Le README du module permet à un nouveau dev de tout comprendre

## Si tu trouves des bugs

Pour chaque bug :
1. Note : symptôme, étapes pour reproduire, comportement attendu vs observé
2. Donne-le à Claude Code avec ce format : "Bug trouvé en passe 07 phase X
   point Y : [détails]. Propose un fix sans casser le reste, et teste-le."
3. Re-teste UNIQUEMENT le point concerné après le fix (puis re-teste les
   points adjacents par sécurité)
