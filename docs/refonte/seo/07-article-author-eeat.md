# SEO 07 — Article schema + Person schema (author bylines EEAT)

## Objectif

Ajouter le schema `Article` (ou `BlogPosting` pour les articles piliers) et
`Person` schema pour la byline auteur sur chaque page de contenu éditorial.

C'est le signal EEAT le plus important pour du contenu YMYL (Your Money
Your Life) — l'alimentaire en fait partie (santé, sécurité). Sans byline
auteur signée avec bio + expertise, Google déclasse le contenu comme
"anonyme" et refuse l'AI Overview.

---

## PROMPT À COPIER-COLLER

```
Tu vas implémenter Article + Person schemas pour les bylines auteur des
pages éditoriales Lehena. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 2, § 4)
3. `apps/backend/src/modules/author/` — module author existant
4. `apps/backend/src/modules/pages/` — structure des pages CMS
5. Doc Google Article : https://developers.google.com/search/docs/appearance/structured-data/article

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Le module `author` existe-t-il dans `apps/backend/src/modules/`? Quels
  champs contient l'entité (nom, slug, bio, photo, credentials, sameAs) ?
- Les pages CMS ont-elles un lien avec un author (relation ou champ) ?
- Y a-t-il une page auteur côté storefront (`/auteurs/[slug]`) ?
- Les articles ont-ils un champ `published_at` (date de publication) et
  `updated_at` (date de modification) séparés ?

## Étape 2 — Choix techniques à valider

a. **Modèle Person / Author** — l'entité doit contenir :
   - `id`, `slug`, `name` (obligatoire)
   - `bio` (RichText, 150-500 mots)
   - `photo_url` (portrait, min 500x500, carré ou 4:5)
   - `role_title` (ex: "Maître Artisan Charcutier")
   - `credentials[]` (formations, diplômes, prix)
   - `same_as[]` (LinkedIn perso, Instagram, X, etc.)
   - `email` (optionnel, souvent omis pour éviter le spam)

   Si le module author n'a pas tous ces champs, l'étendre (migration).

b. **Author "Bénat Petit"** — c'est le maître artisan Lehena, à créer via
   seed :
```

{
name: "Bénat Petit",
slug: "benat-petit",
role_title: "Maître Artisan Charcutier",
bio: "Bénat Petit est le maître artisan charcutier de la Maison Lehena
depuis... Formé à... Expert en salaison Duroc et affinage long...",
photo_url: "https://backend.lehena.fr/static/authors/benat-petit.jpg",
credentials: ["Maître Artisan", "Confédération française de la
boucherie-charcuterie"],
same_as: ["https://www.instagram.com/maisonlehena/"]
}

```

c. **Article schema** sur chaque page pilier + article :
```

{
"@context": "https://schema.org",
"@type": "Article",
"@id": "https://lehena.fr/fr/jambon-sans-nitrite#article",
"headline": "Tout savoir sur le jambon sans nitrite",
"description": "...",
"image": ["https://lehena.fr/images/pillar-nitrite-hero.webp"],
"datePublished": "2026-01-15T10:00:00+01:00",
"dateModified": "2026-07-08T14:30:00+02:00",
"author": {
"@type": "Person",
"@id": "https://lehena.fr/auteurs/benat-petit#person",
"name": "Bénat Petit",
"url": "https://lehena.fr/auteurs/benat-petit",
"image": "https://lehena.fr/images/authors/benat-petit.jpg",
"jobTitle": "Maître Artisan Charcutier",
"worksFor": { "@id": "https://lehena.fr/#organization" },
"sameAs": ["https://www.instagram.com/maisonlehena/"]
},
"publisher": { "@id": "https://lehena.fr/#organization" },
"mainEntityOfPage": {
"@type": "WebPage",
"@id": "https://lehena.fr/fr/jambon-sans-nitrite"
},
"articleSection": "Charcuterie",
"keywords": ["jambon sans nitrite", "charcuterie", "affinage",
"Pays Basque", "artisan"],
"inLanguage": "fr-FR"
}

```

d. **Person schema standalone** sur la page `/auteurs/[slug]` — page dédiée
qui liste toutes les publications de l'auteur (crée un profil crawlable
par Google pour EEAT).

e. **Byline visible côté HTML** — au-dessus ou en dessous du titre H1 :
```

Par [Bénat Petit] · Maître Artisan Charcutier · Publié le X · Mis à jour le Y

```
Avec photo miniature + lien vers la page auteur.

f. **Pages concernées** — appliquer sur :
- 6 pages piliers (`type: "article"` ou dédié)
- Articles supports (30+ en cible, cf. strategie-seo.md)
- Pas les pages transactionnelles (CGV, mentions, contact)
- Pas les PDP (elles ont Product schema à la place)

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Étendre le module `author` avec les champs manquants (migration)
- B : Seed de l'auteur "Bénat Petit"
- C : Extension du module `pages` pour lier `author_id` (foreign key nullable)
- D : Route storefront `/auteurs/[slug]` + rendu
- E : Composant `<ArticleByline>` (photo + nom + rôle + dates)
- F : Helpers `lib/seo/schemas/article.ts` + `lib/seo/schemas/person.ts`
- G : Intégration sur toutes les pages type article

## Étape 4 — Implémentation

- Branche `feat/seo-07-article-author-eeat`
- Photo Bénat Petit : demander à Paul un portrait pro (min 500x500)
- Si photo pas encore fournie, utiliser un placeholder + signaler

## Contraintes

- L'auteur DOIT être une personne réelle (Google détecte les fakes via
Knowledge Graph)
- `datePublished` ≤ `dateModified` (Google warn sinon)
- Page auteur `/auteurs/[slug]` doit lister au moins 1 article publié
(page vide = Google ignore)
- `worksFor` doit référencer l'Organization via `@id`
- Un article ne doit avoir QU'UN seul auteur principal (sinon
`author` en tableau)

## Ce que tu NE fais PAS

- Rédiger la bio de Bénat Petit — placeholder à valider avec Paul
- Créer des auteurs fictifs
- Toucher au schema Organization (prompt 03)

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] Module `author` a tous les champs (bio, photo_url, credentials, sameAs)
- [ ] Auteur "Bénat Petit" seedé avec bio validée par Paul
- [ ] Page `/fr/auteurs/benat-petit` accessible, liste les articles
- [ ] Composant `<ArticleByline>` visible sur toutes les pages type article
- [ ] Rich Results Test passe sur au moins 3 articles (Article éligible)
- [ ] Person schema valide sur la page auteur
- [ ] `worksFor` référence bien `Organization` via `@id`
- [ ] `dateModified` ≥ `datePublished`

## Pièges courants

- **Author "Admin" ou "Lehena"** (raison sociale au lieu de personne réelle)
  → Google déclasse EEAT
- **Bio générique 2 phrases** → pas de signal EEAT. Minimum 100 mots avec
  expertise détaillée.
- **Photo stock/vide** → warning. Vraie photo obligatoire.
- **`author` en string au lieu d'objet Person** → warning, EEAT faible

## Commit final

`feat(seo): Article + Person schemas with author bylines for EEAT signals`
