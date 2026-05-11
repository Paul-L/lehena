# Phase 4 — CMS Pages : finalisation, extensions TipTap, multilingue

## Objectif de cette passe

Terminer la série CMS amorcée dans `docs/cms/`, **étendre** les nodes TipTap
pour les besoins éditoriaux Lehena (citations presse, galeries terroir,
**embed produit**), et passer le module en multilingue propre (FR/ES/EN
avec `translation_group_id` + hreflang dans le storefront).

Cette phase prépare aussi le terrain pour la Phase 9 (pages piliers et
articles SEO) — sans le contenu lui-même, qui sera produit en parallèle
par le copywriter.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 4 — CMS finalisation** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 4 § 3)
2. `docs/cms/00-README.md` à `docs/cms/07-test-and-validate.md` — la série CMS
   d'origine, dont l'état d'avancement est à auditer
3. `docs/refonte/strategie-seo.md` (§ 5, § 6, § 11→Phase 4)

Confirme-moi avoir lu avant de commencer.

## Étape 1 — Audit de l'avancement CMS

- Quelles passes de la série `docs/cms/` (01→07) ont été effectivement réalisées
  dans le repo ? Identifie pour chaque passe : "fait", "partiel", "à faire".
- État de l'entité `Page` (cf. `apps/backend/src/modules/pages/`) :
  champs, migrations, indices. Liste exacte des colonnes.
- État de l'éditeur TipTap admin (`apps/backend/src/admin/components/tiptap-editor/`) :
  quelles extensions sont chargées (cf. `extensions.ts`) ?
- État du rendu storefront : la route `/[countryCode]/(main)/[slug]/page.tsx`
  existe-t-elle ? Que fait-elle ? Sinon, où va vivre le rendu des pages
  éditoriales (et comment éviter les collisions de route avec produits / catégories) ?
- API admin et store pour les pages : routes existantes, validators, workflows.

## Étape 2 — Choix techniques à valider

a. **Reste-à-faire pour finaliser la série CMS originelle** :
   À partir de l'audit, propose-moi la liste exhaustive des passes à terminer
   parmi 04 (admin UI), 05 (storefront rendering), 06 (seed et docs), 07
   (test et validate). On reprend les conventions de la série originelle.

b. **Extensions TipTap à ajouter pour Lehena** :
   - `BlockQuotePress` — citation presse avec auteur + média (logo).
   - `GalleryTerroir` — galerie horizontale avec lazy + lightbox.
   - `ProductEmbed` — embed produit : sélecteur de produit côté admin, rendu
     côté front en mini-carte (image + titre + prix + CTA). Comment représenter
     en JSON TipTap : un node custom `{type: "product-embed", attrs: {handle: "..."}}` ?
   - `RecipeStep` — étape de recette (optionnel, utile pour les articles
     recettes en Phase 9/10).
   - `Callout` — encadré "Le saviez-vous ?" / "À noter" avec icône.
   Pour chaque extension : propose la définition TipTap (NodeSpec) + un mock
   du JSON émis + le composant React de rendu côté storefront.

c. **Multilingue** :
   - Stratégie : ajouter `locale` (enum: fr|es|en) + `translation_group_id`
     (uuid nullable) sur Page. Une "page" en réalité = N rows, une par locale,
     reliées par même `translation_group_id`. Confirme.
   - Admin : sélecteur de langue dans la liste, "Créer une traduction" depuis
     une page existante (duplique avec mêmes structure + `translation_group_id`).
   - Storefront : routes `/fr/<slug>`, `/es/<slug>`, `/en/<slug>` ; fallback
     vers langue par défaut (FR) si traduction manquante avec `noindex` sur
     le fallback ; `<link rel="alternate" hreflang="...">` pour chaque traduction.
   - Sitemap multilingue.

d. **Champs SEO sur Page** (à vérifier déjà présents ; sinon ajouter) :
   `seo_title`, `seo_description`, `og_image`, `noindex`, `canonical_override`.

e. **Pages éditoriales seedées en V1** :
   - `/fr/notre-histoire`
   - `/fr/la-ferme` (de-la-ferme-a-lassiette)
   - `/fr/engagements`
   - `/fr/presse`
   - `/fr/atelier` (placeholder, sera complétée Phase 9)
   - `/fr/contact` (formulaire de contact)
   - `/fr/faq`
   - `/fr/cgv`, `/fr/mentions-legales`, `/fr/politique-confidentialite`
   Toutes seedées avec contenu placeholder à amender ensuite par le copywriter.

f. **Page contact** : formulaire qui envoie un email à `contact@lehena.fr`
   (via Resend en Phase 7 ; ici on logue).

## Étape 3 — Plan détaillé

Propose 4-6 sous-passes :

- A : Finir les passes CMS originelles non terminées.
- B : Extensions TipTap Lehena (admin + rendu storefront couplés).
- C : Multilingue (migration `locale` + `translation_group_id`, admin, routes,
  hreflang, sitemap).
- D : Seed des 9 pages éditoriales clés.
- E : Formulaire contact + page contact branchée (email stub).
- F : Audit + tests.

## Étape 4 — Implémentation

- Branche `feat/phase-4-cms-finalisation`.
- Migrations Mikro-ORM générées + idempotentes (multilingue).
- Tests : pour chaque extension TipTap, snapshot du JSON parsé + snapshot du
  rendu React.
- Documentation : `docs/refonte/cms-extensions.md` qui décrit chaque extension
  et son JSON. Utile pour le copywriter.

## Contraintes (rappel)

- TypeScript strict, schemas zod pour les inputs admin.
- Le **rendu storefront** est un Server Component qui mappe les nodes TipTap
  vers des composants React Lehena. Pas de `dangerouslySetInnerHTML`
  généralisé (cf. série CMS originelle).
- Schemas SEO : injecter `Article` sur les pages éditoriales (sauf CGV /
  mentions / etc. qui restent `WebPage` simple).
- Revalidation Next.js : un subscriber Medusa déclenche `revalidatePath` ou
  `revalidateTag` au publish/update (déjà en place dans la série CMS, à
  vérifier).

## Ce que tu NE fais PAS

- Pas de rédaction de contenu réel (juste placeholders) — c'est le job du
  copywriter en parallèle de Phase 9.
- Pas d'envoi d'email contact réel (Phase 7).
- Pas de connecteur traduction auto type DeepL — la traduction est manuelle
  ou faite par un humain pro.

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Une page "Notre histoire" est publiable depuis l'admin, multilingue
      (FR + brouillon ES), visible sur `/fr/notre-histoire` et `/es/nuestra-historia`.
- [ ] hreflang dans le `<head>` des pages traduites, sans erreur Search Console.
- [ ] Embed produit fonctionne : depuis l'admin, j'insère un produit dans
      un article, il s'affiche en mini-carte cliquable côté storefront avec
      données fraîches Medusa.
- [ ] Citation presse, galerie, callout, recipe step : rendus visuellement
      cohérents avec le design Lehena.
- [ ] Sitemap inclut les pages éditoriales avec les variantes de langue.
- [ ] Schema `Article` valide sur "Notre histoire" (test `validator.schema.org`).
- [ ] Formulaire contact soumis logue correctement (sera branché Resend Phase 7).
- [ ] Toutes les pages légales (CGV, mentions, conf) seedées avec placeholder
      explicite à amender par Paul ("CONTENU À FOURNIR").
- [ ] `docs/refonte/cms-extensions.md` rédigé et exemples copiables.

## Pièges courants

- **`translation_group_id` nullable** : oublier le nullable rend impossible
  la création d'une première page (pas encore de groupe). Mettre nullable
  avec génération à la création de la 2e traduction.
- **Routes multilingues vs starter Medusa `[countryCode]`** : le starter
  utilise `countryCode` pour la région commerce. Ne pas confondre langue et
  pays. Recommandation : ajouter `[locale]` distinct, ou décider d'un mapping
  pays→langue par défaut.
- **TipTap node custom** : oublier d'enregistrer le `parseDOM` côté
  storefront empêche la roundtrip.
- **Sitemap multilingue** : 1 entrée par langue par URL, avec `xhtml:link`.

## Commit final

Branche : `feat/phase-4-cms-finalisation`.
Commit : `feat(cms): finalize pages, custom tiptap nodes, multilingual support`.
