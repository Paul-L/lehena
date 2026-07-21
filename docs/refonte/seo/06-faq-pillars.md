# SEO 06 — FAQPage schema sur les pages piliers

## Objectif

Ajouter un schema `FAQPage` massif (10-15 Q&A) sur chaque page pilier + sur
les PDP pertinentes. C'est le levier n°1 pour :

- Décrocher des featured snippets Google ("People Also Ask")
- Être cité par ChatGPT / Perplexity / Google AI Overviews (les LLMs
  extraient les Q&A comme sources factuelles)
- Occuper plus de surface dans les SERP

Chaque bloc FAQ répond à une intention de recherche précise et est
indexé indépendamment.

---

## PROMPT À COPIER-COLLER

```
Tu vas ajouter le schema FAQPage sur les pages piliers Lehena. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 2 pages piliers + § 4 schemas)
3. `apps/backend/src/modules/pages/` — modèle Page CMS
4. `apps/backend/src/scripts/seed-pages.ts` — contenu actuel des piliers
5. Doc Google FAQPage : https://developers.google.com/search/docs/appearance/structured-data/faqpage

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Combien de pages piliers sont publiées actuellement ? Cf.
  `seed-pages.ts` et la table `page` en DB.
- Y a-t-il déjà un système de bloc FAQ dans l'éditeur TipTap admin
  (cf. cms-extensions.md) ? Comment sont stockées les FAQ dans la struct
  Page ?
- Le CMS Page expose-t-il un champ `faq` (json array) ou faut-il l'ajouter
  au module ?

## Étape 2 — Choix techniques à valider

a. **Modèle de données** — deux approches :

   **Option A : champ `faq` sur Page**
   Ajouter un champ nullable `faq: FaqItem[]` (jsonb) sur l'entité Page.
   Édité via un composant admin custom (liste d'inputs question/réponse).
   Le rendu storefront lit ce champ et injecte automatiquement le schema.

   **Option B : bloc TipTap `<FaqAccordion>`**
   Un node TipTap custom qui contient N couples question/réponse. Édité
   inline dans le contenu principal. Le rendu storefront extrait les
   Q&A du JSON TipTap.

   Recommande selon ce qui existe déjà. Option B est mieux si l'éditeur
   TipTap est bien fait, sinon A.

b. **Schema FAQPage** injecté sur la page :
```

{
"@context": "https://schema.org",
"@type": "FAQPage",
"mainEntity": [
{
"@type": "Question",
"name": "Qu'est-ce qu'un jambon sans nitrite ?",
"acceptedAnswer": {
"@type": "Answer",
"text": "<p>Un jambon sans nitrite est ...</p>"
}
},
{
"@type": "Question",
"name": "Pourquoi le nitrite est-il utilisé habituellement ?",
"acceptedAnswer": {
"@type": "Answer",
"text": "<p>Le nitrite ...</p>"
}
}
// ... 8-15 questions par pilier
]
}

```

c. **Contenu des Q&A** — 6 piliers × 10 questions = 60 Q&A à rédiger.
Ne PAS tenter d'inventer les réponses (risque factuel + hallucination).
Fournir un TEMPLATE de questions par pilier — le contenu des réponses
sera à rédiger par Paul / copywriter.

Piliers cibles (cf. strategie-seo.md § 2) et question templates :

**Pilier 1 — Jambon sans nitrite** :
1. Qu'est-ce qu'un jambon sans nitrite ?
2. Pourquoi le nitrite est-il ajouté habituellement dans la charcuterie ?
3. Le jambon sans nitrite est-il vraiment plus sain ?
4. Comment reconnaître un vrai jambon sans nitrite ?
5. Combien de temps se conserve un jambon sans nitrite ?
6. Le jambon sans nitrite a-t-il le même goût ?
7. Pourquoi la couleur est-elle différente ?
8. Quelle est la différence entre "sans nitrite ajouté" et "sans nitrite" ?
9. Un jambon Lehena est-il certifié bio ?
10. Combien coûte un jambon artisanal sans nitrite ?

**Pilier 2 — Race Duroc** : origine, comparaison ibérique, alimentation,
élevage, gras persillé, différence Bigorre, etc.

**Pilier 3 — Affinage 24 mois** : étapes, sel Salies, différence 15 vs
24 mois, séchoir, taux d'humidité, comment savoir si un jambon est affiné
assez longtemps, etc.

**Pilier 4 — Patxaran** : origine, recette traditionnelle, degré,
accords, quelle prunelle, service.

**Pilier 5 — Découpe jambon** : matériel, technique, sens de coupe,
conservation après entame, os utilisation, portions par personne.

**Pilier 6 — Charcuterie & santé** : sodium, gras saturés, portions
raisonnables, alternatives sans nitrite, ANSES, comparaison avec autres
protéines.

Livre les 60 questions templates dans un doc annexe
`docs/refonte/seo/faq-templates.md` que le copywriter/Paul pourra
remplir.

d. **Extension aux PDP** — les PDP peuvent aussi avoir 4-6 Q&A spécifiques
au produit (comment le déguster, avec quoi, conservation, poids réel,
nombre de personnes). À implémenter via `product.faq` custom field ou
dérivé de la catégorie.

e. **Rendu HTML** — obligatoire : les Q&A DOIVENT être visibles côté HTML
(Google refuse le FAQPage schema si les Q&A ne sont pas rendues dans
la page). Prévoir un composant `<FaqAccordion>` avec titres/contenus
accessibles au clavier.

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Choix modèle A ou B + migration DB (si option A) ou extension TipTap
(si option B)
- B : Composant storefront `<FaqAccordion>` visuel + JSON-LD couplé
- C : Helper `lib/seo/schemas/faq-page.ts` typé
- D : Intégration sur les 6 pages piliers (avec Q&A placeholder + livrable
`faq-templates.md`)
- E : Intégration sur PDP (custom field ou dérivé)
- F : Validation Rich Results Test

## Étape 4 — Implémentation

- Branche `feat/seo-06-faq-pillars`
- Ne PAS remplir les réponses avec du contenu inventé — mettre "À rédiger
par Paul/copywriter" comme placeholder visible dans le CMS admin, PAS
publier tant que vide.

## Contraintes

- Q&A DOIVENT être dans le HTML visible (sinon Google warn)
- Chaque `Answer.text` peut contenir du HTML léger (`<p>`, `<a>`, `<ul>`,
`<strong>`) — pas de JS
- Longueur : 40-300 mots par réponse. Trop court = pas de valeur, trop
long = clic Google plutôt que featured snippet.
- Pas de doublon de question entre pages (Google déduplique)

## Ce que tu NE fais PAS

- Rédiger le contenu final des réponses — livrer le template et laisser
Paul/copywriter remplir
- Toucher aux autres schemas des piliers (Article schema = prompt 07)

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] 6 pages piliers ont un bloc FAQ visible + schema FAQPage
- [ ] Rich Results Test passe sur au moins 3 piliers (FAQ éligible)
- [ ] Composant `<FaqAccordion>` accessible au clavier (Enter / Space pour
      ouvrir/fermer, aria-expanded)
- [ ] `docs/refonte/seo/faq-templates.md` livré avec les 60 questions
      templates réparties par pilier
- [ ] Aucune FAQ publiée avec `text: "À rédiger"` (protection au niveau
      publication)
- [ ] PDP a également un bloc FAQ pertinent (produit-spécifique)

## Pièges courants

- **Q&A non visible côté HTML** → Google marque le schema comme "invalide"
- **Contenu répétitif entre piliers** → Google déduplique et n'affiche que
  la meilleure
- **Réponse trop longue** (> 500 mots) → moins de chance de featured snippet
- **HTML riche dans `Answer.text`** avec `<script>` ou attributs `on*` →
  rejeté

## Commit final

`feat(seo): FAQPage schema on pillars + accessible <FaqAccordion> component

- faq-templates.md brief`
