# Phase 1 — Modèle métier & catalogue

## Objectif de cette passe

Modéliser correctement la charcuterie + épicerie Lehena dans Medusa :
custom fields produit (affinage, allergènes, conservation…), variantes
propres (1 produit = N formats), catégories, régions/devises/taxes (TVA
alimentaire 5,5 % vs autres), profils de livraison (réfrigéré vs sec),
seed riche pour pouvoir bosser le storefront sans attendre la migration.

L'ancien site mélange produits et accessoires dans les catégories et crée
3 produits séparés là où on devrait avoir 1 produit + 3 variantes
(cf. `audit-site-actuel.md` § 2). On corrige.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 1 — Modèle métier & catalogue** de la refonte Lehena.
Avant tout, relis :

1. `docs/refonte/00-PLAN.md` (Phase 1 § 3) — les attentes de la phase
2. `docs/refonte/audit-site-actuel.md` (§ 2 et § 8) — les défauts du modèle actuel
3. `docs/refonte/strategie-seo.md` (§ 11 → Phase 1) — checklist SEO de cette phase

Confirme-moi avoir lu avant de commencer.

## Étape 1 — Reconnaissance

- Quels modules Medusa custom sont déjà déclarés dans `medusa-config.ts` ?
- Quel est l'état du module `pages` (entités, services, API) ? On ne le casse pas.
- Y a-t-il déjà des produits / catégories / régions seedés (`apps/backend/src/scripts/seed.ts`) ? Que fait le seed actuel ?
- Quels file/payment/fulfillment providers sont configurés (probable : aucun) ?

## Étape 2 — Choix techniques à valider avec moi

a. **Custom fields produit** — propose-moi la liste exhaustive avec, pour
   chaque champ : nom, type, requis ?, valeurs possibles si enum, à afficher
   sur PDP (oui/non), pertinent pour filtre catégorie (oui/non). Mon attendu
   minimum :
   - `aging_months` (int, nullable) — affinage
   - `origin` (string) — terroir : "Pays Basque", "Iparralde", "Sud-Ouest"...
   - `breed` (string) — race : "Duroc", "Bigorre", "Kintoa"...
   - `allergens` (string[]) — liste contrôlée
   - `nitrite_free` (bool)
   - `conservation_temp` (enum: "ambient", "fresh", "frozen")
   - `conservation_days_after_opening` (int)
   - `ddm_days` (int) — durée minimum de garantie après réception
   - `cure_method` (string nullable)
   - `weight_grams` (int) — pour le calcul livraison
   - `nutritional` (jsonb) — table valeurs nutritionnelles
   - `ingredients` (text) — liste légale ingrédients
   - Recommandations : utiliser le mécanisme Medusa v2 `additional_data` /
     extension du model `Product` plutôt qu'un module séparé. Justifie.

b. **Stratégie variantes** — un Jambon Orhi est aujourd'hui scindé en 5
   produits (entier os, entier désossé, demi, quart, tranches). Propose une
   refonte : produit unique avec 5 variantes (`format` = enum), prix
   différenciés par variante, stock par variante. Confirme la faisabilité.

c. **Catégories + collections** : propose l'arborescence cible. Mon brouillon
   à amender :
   - Jambons d'Iparralde
   - Salaisons
   - Patxaran & spiritueux
   - Épicerie fine
   - Plats cuisinés
   - Coffrets & cadeaux
   - Accessoires (planche, support, couteau) — séparée des Jambons
   Pour chaque catégorie, propose : slug FR, slug EN (préparation Phase 4),
   description SEO (~150 mots) et 3 mots-clés cibles.

d. **Régions / devises / taxes** :
   - Région France : TVA 5,5 % sur alimentaire, 20 % sur accessoires
     non-alimentaires (planche). Comment Medusa gère ça : tax rates par
     `product_type` ou par tag ? Recommande la solution la plus propre.
   - Région UE (hors FR) : TVA 0 % pour ventes intracommunautaires B2B
     (futur), TVA française pour B2C jusqu'à seuil OSS. À aborder en V1 ou V2 ?
   - Région Monde : pas de TVA mais frais douaniers à la charge du destinataire,
     mention claire en checkout.

e. **Profils de livraison** :
   - `fresh_chronofresh` : profil pour produits `conservation_temp = "fresh"`,
     surcoût, délai 24-48 h, livraison ouvrable uniquement.
   - `ambient_colissimo` : profil pour `conservation_temp = "ambient"`, tarifs
     standards, livraison sur RDV ou Mondial Relay possible.
   - Question : un panier mixte (fresh + ambient) doit-il déclencher 2 envois
     séparés ou être contraint au profil le plus contraignant ? Recommande.

f. **Stock** : mono-emplacement (la boutique Lehena) en V1. Confirme que
   c'est suffisant.

g. **Slugs et SEO** : règles de génération slug produit
   (`<nom-produit>-<format>` ? `<nom-produit>` simple ?), unicité, historique
   pour redirects auto (cf. module `redirects` à créer en Phase 8 mais à
   prévoir dès maintenant).

## Étape 3 — Plan détaillé (à valider)

Sur la base de mes réponses, propose-moi un plan en 4-6 sous-passes avec,
pour chaque : objectif, fichiers créés, livrable testable. Mon attendu :

- Sous-passe A : Custom fields produits — module ou extension `additional_data`.
- Sous-passe B : Régions / devises / taxes / profils de livraison configurés
  via seed Medusa.
- Sous-passe C : Catégories + collections seedées avec descriptions SEO.
- Sous-passe D : 30 produits réalistes seedés (vrais noms, vrais prix
  approximatifs, vraies images placeholder ou tirées de l'ancien site avec
  permission), variantes correctes (Jambon Orhi en 5 variantes par exemple).
- Sous-passe E : Module `redirects` minimal (entité + service + admin route),
  utilisé en Phase 8 mais structurellement posé maintenant.
- Sous-passe F : Validation — `pnpm seed` + `pnpm test` (un test par entité
  custom).

## Étape 4 — Implémentation (après validation du plan)

- Branche `feat/phase-1-modele-metier`.
- Commits granulaires par sous-passe.
- Migrations Mikro-ORM générées et committées.
- Tests unitaires des services custom (Jest, comme dans le starter Medusa).
- README backend à jour : section "Modèle de données" avec un schéma ER
  textuel des entités custom.

## Contraintes (rappel)

- TypeScript strict, zéro `any`.
- Validation zod sur tous les inputs admin et store des nouvelles routes API.
- Workflows Medusa pour toute mutation côté write.
- Pas de logique métier dans les routes API.
- Slugs et URLs **immuables et historisées** (pour préparer redirects).

## Ce que tu NE fais PAS dans cette phase

- Pas de UI storefront (Phase 3).
- Pas de UI admin custom au-delà des `additional_data` natifs (widgets en Phase 10).
- Pas de configuration de provider de paiement / livraison réel (Phase 5).
- Pas de migration depuis l'ancien site (Phase 8).
- Pas de page-pilier ni article SEO (Phase 9) — mais les descriptions
  catégorie SEO sont écrites maintenant.

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] `pnpm seed` recrée la base from scratch sans erreur.
- [ ] Admin Medusa : un produit "Jambon Orhi" est visible avec ses 5 variantes
      et tous les custom fields renseignés.
- [ ] API `/store/products` renvoie les custom fields dans la réponse JSON
      (sinon le storefront ne pourra pas les afficher).
- [ ] Les catégories ont des descriptions SEO renseignées (champ custom
      `seo_description`).
- [ ] Les 2 profils de livraison sont créés et un produit "fresh" ne peut
      pas être expédié via `ambient_colissimo`.
- [ ] TVA différenciée fonctionne : un Jambon (5,5 %) et une planche (20 %)
      dans le même panier produisent un total correct.
- [ ] Tests unitaires des services custom passent (`pnpm test:unit`).
- [ ] Migrations Mikro-ORM committées et idempotentes.
- [ ] Documentation README backend mise à jour avec le schéma ER.

## Pièges courants

- **Medusa v2 additional_data** : la syntaxe est récente, vérifier la version
  exacte 2.14.x et la doc.
- **Tax rates** : si tu utilises `product_type` pour différencier 5,5 % / 20 %,
  attention à bien tagger tous les produits — un produit sans type prend la
  TVA par défaut de la région.
- **Profils de livraison** : Medusa exige qu'un produit appartienne à un
  shipping profile. Si on en crée 2, il faut un fallback explicite.
- **Slugs uniques** : pas d'unique constraint au niveau DB par défaut sur
  certaines versions Medusa, à ajouter via migration.

## Commit final

Branche : `feat/phase-1-modele-metier`.
Commit final : `feat(catalog): metier model — custom fields, variants, regions, taxes, shipping profiles, seed`.
PR vers `develop`.
