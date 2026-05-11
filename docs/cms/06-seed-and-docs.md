# Passe 06 — Seed des pages d'exemple + documentation

## Objectif de cette passe

Permettre à n'importe quel dev (ou à toi-même dans 6 mois) de cloner le projet,
lancer une commande, et avoir tout de suite un environnement avec des pages
d'exemple pour tester. Plus la doc qui explique tout.

C'est une passe courte mais critique pour la maintenabilité.

---

## PROMPT À COPIER-COLLER

```
Passe 06 : Seed de pages d'exemple + documentation complète du module.

## Périmètre

- Script de seed qui crée 4-5 pages d'exemple réalistes
- README détaillé du module dans `src/modules/pages/README.md`
- Mise à jour du README racine du backend pour documenter le module
- Mise à jour du README du storefront pour la partie revalidation
- Diagramme d'architecture (mermaid) du flux complet
- Guide de troubleshooting

## Script de seed

Crée `src/scripts/seed-pages.ts` qui peut être lancé via :
```
npx medusa exec ./src/scripts/seed-pages.ts
```

Comportement :
- Vérifie si des pages existent déjà avec un slug donné. Si oui, skip
  (idempotent — on peut relancer sans tout casser)
- Crée les pages suivantes avec du contenu TipTap réaliste (titres, paragraphes,
  listes, au moins une image, au moins un lien) :

1. **À propos** (`/a-propos`)
   - Status : published
   - Excerpt : "Découvrez l'histoire et les valeurs de notre boutique"
   - Contenu : présentation de la marque, mission, valeurs, équipe (3-4
     paragraphes structurés avec h2 et h3)

2. **FAQ** (`/faq`)
   - Status : published
   - Excerpt : "Réponses aux questions fréquentes"
   - Contenu : 5-6 questions avec h3 + réponse paragraphe

3. **Livraison & retours** (`/livraison-et-retours`)
   - Status : published
   - Contenu : zones de livraison (liste), délais (liste), procédure de retour
     (liste numérotée), contact

4. **Mentions légales** (`/mentions-legales`)
   - Status : published
   - Contenu : structure standard FR (éditeur, hébergement, propriété
     intellectuelle, données personnelles)

5. **Notre prochaine collection** (`/notre-prochaine-collection`)
   - Status : draft (volontairement, pour tester l'affichage des drafts)
   - Contenu : teaser court avec image

Le contenu TipTap doit être en JSON bien formé. Génère des objets `JSONContent`
réalistes, pas des stubs vides.

Variables d'env optionnelles pour le seed :
- `SEED_LOCALE` (défaut 'fr')
- `SEED_FORCE` : si 'true', supprime les pages existantes avant de re-seed

## README du module (`src/modules/pages/README.md`)

Structure :

```markdown
# Module Pages

Module Medusa v2 pour la gestion de pages éditoriales (À propos, FAQ, etc.)
avec éditeur TipTap riche et publication contrôlée.

## Fonctionnalités

- ...

## Architecture

[Diagramme mermaid du flux]

## Modèle de données

[Table des champs avec types et descriptions]

## API

### Routes admin
[Tableau des endpoints]

### Routes store
[Tableau des endpoints]

## Workflows

[Liste avec description courte de chaque workflow]

## Events émis

[Liste des events et quand ils sont émis]

## Variables d'environnement

[Tableau env var → description → requis ou non]

## Installation

[Étapes : npm install, migrations, env vars, seed]

## Développement

### Lancer en local
### Lancer les tests
### Ajouter une extension TipTap
### Customiser le renderer storefront

## Tests

[Comment lancer + couverture actuelle]

## Limites connues

- Le module ne gère pas encore le versioning (pas d'historique de révisions)
- Le multilingue est basique : un champ locale par row, pas de liaison entre
  versions traduites
- Les CGV / Mentions légales sont éditables comme n'importe quelle page —
  pour de la conformité juridique stricte, considère les hardcoder
```

## Diagramme d'architecture (mermaid)

À inclure dans le README du module. Représente :
- Le client final qui édite dans le Medusa Admin
- Les routes API admin
- Le service Pages
- Les workflows
- Le subscriber qui appelle le storefront
- Le storefront qui revalide
- Le visiteur final qui voit la page

Style sequence diagram pour le flux "publier une page" et flowchart pour
l'architecture générale.

## Guide de troubleshooting

Section dédiée dans le README du module, avec les problèmes typiques :

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| La revalidation ne se déclenche pas | Secret différent entre backend et storefront | Vérifier `REVALIDATE_SECRET` dans les deux `.env` |
| L'éditeur affiche une page blanche | Mismatch de versions TipTap | `npm ls @tiptap/core` doit retourner une seule version |
| Les images ne s'affichent pas côté storefront | Domaine pas dans next.config.js | Ajouter le hostname dans `images.remotePatterns` |
| Erreur "Unique constraint slug" | Slug en conflit (peut-être soft-deleted) | Vérifier en base avec `deleted_at IS NOT NULL` |
| Le mode preview affiche 404 | Token de preview expiré ou mauvais secret | Régénérer depuis l'admin |
| L'auto-save fait des requêtes en boucle | Effet React mal mémoïsé | Vérifier les deps de `useAutoSave` |

## README racine du backend

Ajoute une section "Modules custom" qui mentionne le module Pages avec un lien
vers son README. Ne réécris pas tout le README, ajoute juste une section.

## README racine du storefront

Ajoute une section "Pages éditoriales" qui explique :
- Comment fonctionne le rendu (route [slug] + renderer TipTap)
- Comment fonctionne la revalidation (route api/revalidate + secret)
- Comment fonctionne le mode preview
- Lien vers le README backend pour les détails du module

## Tests du seed

Test manuel :
1. Drop la base, re-migrate
2. Lance le seed → 5 pages créées
3. Relance le seed → 0 nouvelle page (idempotent), pas d'erreur
4. Lance avec `SEED_FORCE=true` → supprime puis recrée
5. Va sur le storefront → toutes les pages publiées sont visibles
6. Va sur l'admin → toutes les pages sont listées avec le bon status

## Procédure d'exécution

1. Crée le seed. Lance-le. Vérifie que les 5 pages sont créées en base.
2. Vérifie sur le storefront que les pages publiées s'affichent correctement
   (formatage, images si présentes, liens, etc.).
3. Crée le README du module avec toutes les sections listées.
4. Crée le diagramme mermaid (flux + architecture).
5. Mets à jour les README racine.
6. Relis tout : tu dois pouvoir, en lisant juste le README, comprendre
   comment installer et utiliser le module sans aucun autre contexte.
7. Commit : `docs(pages): add seed and full module documentation`

## Critères de succès

- `npx medusa exec ./src/scripts/seed-pages.ts` crée les pages d'exemple
- Le seed est idempotent
- Le README du module est complet, à jour, et utilisable par un dev qui
  débarque sur le projet
- Le diagramme mermaid est lisible
- Le troubleshooting couvre les cas réels rencontrés pendant les passes
  précédentes
- Les README racine pointent correctement vers la doc du module

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Le seed marche et est idempotent
- [ ] Les pages d'exemple s'affichent correctement sur le storefront
- [ ] Le README du module est exhaustif
- [ ] Le diagramme mermaid est clair
- [ ] La section troubleshooting reflète les vrais problèmes rencontrés
- [ ] Les README racine ont été mis à jour

C'est la passe la plus simple mais celle qui sauvera ta vie (ou celle d'un
collègue) dans 6 mois quand il faudra revenir dessus.
