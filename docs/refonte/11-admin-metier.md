# Phase 10 — Admin custom & outillage métier

## Objectif de cette passe

Rendre l'admin Medusa utile au quotidien de l'équipe Lehena : widgets
dashboard (ventes du jour, alertes DDM courte, stock bas), module **Recettes**
(lié aux produits), module **Avis** (modération + affichage PDP), workflows
d'alerte (stock bas, DDM courte), export CSV commandes pour la comptabilité.

L'ancien site n'avait rien de tout ça — l'équipe pilotait depuis l'admin
WooCommerce nu. On lève le niveau.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 10 — Admin custom & métier** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 10 § 3)
2. `docs/refonte/audit-site-actuel.md` (mention 0 avis client visible, manque
   recettes, manque alertes)
3. Doc Medusa Admin SDK : pour les widgets et routes admin custom

Confirme avoir lu.

## Étape 1 — Reconnaissance

- État de l'admin Medusa : quels widgets / routes custom existent déjà
  (`apps/backend/src/admin/`) ?
- Module Recettes : amorcé ? À créer ?
- Module Avis : amorcé ? À créer ?
- Quels custom fields produits exposent `ddm_days` (Phase 1) ?
- Y a-t-il des workflows déjà existants (`apps/backend/src/workflows/`) ?

## Étape 2 — Choix techniques à valider

a. **Widgets admin dashboard** :
   - "Ventes du jour" : nombre de commandes, CA, panier moyen, comparaison
     vs hier / vs J-7.
   - "Commandes à expédier" : count des commandes status `captured` non
     `shipped`, lien vers la liste filtrée.
   - "Stock bas" : produits avec stock < 5 unités sur au moins une variante.
   - "Alerte DDM courte" : produits avec `ddm_days` < 30 (à arbitrer).
   - "Top produits 30j" : liste top 5.
   - Tous récupèrent leurs données via une API admin custom dédiée (pas via
     une libe externe), avec cache 60s côté admin.

b. **Module Recettes** :
   - Entité `recipe` : id, title, slug, hero_image, content (TipTap), prep_time,
     cook_time, difficulty, servings, ingredients (jsonb), steps (jsonb),
     nutritional (jsonb), published_at, author_id, locale, translation_group_id.
   - Relation M2M `recipe_product` : une recette peut mettre en avant 1-N produits.
   - Admin : liste + édition (réutiliser l'éditeur TipTap Phase 4).
   - Storefront : route `/[locale]/recettes/[slug]`, schema `Recipe` complet
     (cf. doctrine SEO § 4).
   - Côté PDP : section "Recettes avec ce produit" (M2M inverse).

c. **Module Avis** :
   - Entité `review` : id, product_id, customer_id, rating (1-5), title, body,
     status (`pending` | `approved` | `rejected`), created_at, approved_at,
     approved_by.
   - Admin : liste de modération, filtre par status, bouton approve/reject
     en bulk.
   - Storefront : PDP affiche les avis approuvés avec pagination, formulaire
     d'ajout pour customers connectés ayant commandé le produit (vérification
     via order history).
   - Schema `Review` + `AggregateRating` sur PDP (vrais maintenant, fini les mocks).
   - Workflow : email J+10 après livraison demandant un avis (déjà câblé en
     Phase 9, on raffine ici).

d. **Workflows alertes** :
   - Stock bas : daily cron qui compte les variantes < seuil, envoie un email
     à `atelier@lehena.fr` + un Slack si webhook configuré (env optional).
   - DDM courte : daily cron qui liste les produits dont la prochaine
     fournée arrive à `ddm_days` < seuil, email + badge admin.

e. **Export CSV commandes** :
   - Route admin `POST /admin/exports/orders` qui prend `{ from, to, status[] }`
     et génère un CSV avec colonnes : date, numéro commande, client, email,
     items, montant HT, TVA détaillée, montant TTC, mode paiement, statut.
   - Download via signed URL (stockage S3 temporaire 24h).
   - Test : exporter 1 mois de commandes, ouvrir dans Excel, vérifier mise
     en forme française (`;` séparateur, `,` décimal).

f. **i18n de l'admin** : le starter Medusa supporte FR ? Si oui, traduire les
   widgets custom. Sinon, garder en anglais avec libellés courts.

## Étape 3 — Plan détaillé

6-8 sous-passes :

- A : Widgets dashboard (5 widgets + API custom).
- B : Module Recettes (backend + admin + storefront).
- C : Module Avis (backend + admin + storefront PDP).
- D : Workflow demande d'avis automatisé (raffine Phase 9).
- E : Workflows alertes stock + DDM.
- F : Export CSV commandes.
- G : Tests + docs.

## Étape 4 — Implémentation

- Branche `feat/phase-10-admin-metier`.
- Migrations Mikro-ORM pour `recipe`, `recipe_product`, `review`.
- Tests : un test par route admin custom (export, modération avis).
- Documentation utilisateur dans `docs/refonte/admin-guide.md` :
  comment l'équipe Lehena utilise chaque widget et module.

## Contraintes (rappel)

- TypeScript strict.
- Validation zod sur tous les inputs admin.
- Workflows Medusa pour les opérations (approve avis, etc.).
- Pas d'accès direct DB depuis l'admin UI : tout via les routes API.

## Ce que tu NE fais PAS

- Pas de programme de fidélité (V2).
- Pas de gestion multi-magasins (V2).
- Pas de planning de production atelier (V2 si besoin métier).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Dashboard admin : les 5 widgets sont fonctionnels avec données réelles.
- [ ] Module Recettes : je peux créer une recette, la lier à un produit, la
      publier, la consulter sur `/fr/recettes/<slug>`, schema `Recipe` valide.
- [ ] Module Avis : un client connecté ayant commandé peut laisser un avis,
      il apparaît `pending`, je l'approuve depuis l'admin, il s'affiche
      sur la PDP, le schema `AggregateRating` reflète la note.
- [ ] Workflow demande d'avis J+10 envoie bien l'email.
- [ ] Alerte stock bas reçue par email + Slack (si configuré).
- [ ] Export CSV commandes ouvre correctement dans Excel FR.
- [ ] `docs/refonte/admin-guide.md` rédigé.

## Pièges courants

- **Widget Medusa** : limite de surface — un widget admin est petit, ne pas y
  mettre une page complète. Pour ça, utiliser une route admin custom.
- **Modération avis** : ne pas auto-approuver. Spam fréquent.
- **CSV avec `;` séparateur** : Excel FR attend ce séparateur. Si on génère
  avec `,` Excel mettra tout en colonne A.
- **Recipe schema** : très contraint. Tous les champs (`recipeIngredient`,
  `recipeInstructions`, `nutrition`) doivent suivre le format Google.

## Commit final

Branche : `feat/phase-10-admin-metier`.
Commit : `feat(admin): dashboard widgets, recipes, reviews, stock alerts, csv export`.
