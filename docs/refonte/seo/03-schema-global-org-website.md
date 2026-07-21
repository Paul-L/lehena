# SEO 03 — Schemas globaux Organization + WebSite + Breadcrumb

## Objectif

Injecter dans le `<head>` global du storefront les schemas fondamentaux qui
alimentent le Knowledge Panel Google et débloquent la sitelinks searchbox :
`Organization` (identité complète Lehena) + `WebSite` (avec `SearchAction`)

- composant réutilisable `<Breadcrumb>` couplé à `BreadcrumbList` JSON-LD.

C'est le premier signal EEAT que Google lit sur ton site — sans lui, tes
autres schemas restent orphelins.

---

## PROMPT À COPIER-COLLER

```
Tu vas implémenter les schemas JSON-LD globaux du storefront Lehena. Lis :

1. `docs/refonte/seo/README.md`
2. `apps/storefront/src/app/layout.tsx` — layout racine où injecter Organization + WebSite
3. `apps/storefront/src/lib/company.ts` — source de vérité société
4. Doc Google Organization : https://developers.google.com/search/docs/appearance/structured-data/organization
5. Doc Google SearchAction : https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Où est le layout racine du storefront et qu'injecte-t-il actuellement en
  JSON-LD ? (probablement déjà Organization + WebSite basiques)
- Quel composant `<JsonLd>` est utilisé pour l'injection ?
- Est-ce qu'un composant `<Breadcrumb>` existe déjà ? Où ?

## Étape 2 — Choix techniques à valider

a. **Organization schema** — enrichir avec tous les signaux EEAT :
```

{
"@context": "https://schema.org",
"@type": "Organization",
"@id": "https://lehena.fr/#organization",
"name": "Maison Lehena",
"alternateName": "LEHENA",
"legalName": "LEHENA SAS",
"url": "https://lehena.fr",
"logo": {
"@type": "ImageObject",
"url": "https://lehena.fr/logo-organization.png",
"width": 512, "height": 512
},
"foundingDate": "2019",
"founder": { "@type": "Person", "name": "..." }, // à confirmer
"description": "Maître Artisan Charcutier au Pays Basque depuis 2019...",
"email": "contact@lehena.fr",
"telephone": "...",
"address": {
"@type": "PostalAddress",
"streetAddress": "Le Bourg",
"postalCode": "64470",
"addressLocality": "Laguinge-Restoue",
"addressRegion": "Pyrénées-Atlantiques",
"addressCountry": "FR"
},
"vatID": "FR29849613435",
"sameAs": [
"https://www.facebook.com/maisonLehena",
"https://www.instagram.com/maisonlehena/"
// Ajouter LinkedIn, TripAdvisor si présent, page GBP
],
"areaServed": { "@type": "Country", "name": "France" },
"knowsAbout": [
"Charcuterie artisanale", "Jambon sans nitrite",
"Race Duroc", "Pays Basque", "Salaisons", "Patxaran"
],
"hasCredential": [
// Award, certifications, labels — à renseigner si Lehena en a
// Ex: label bio, prix concours agricole, Slow Food, etc.
]
}

```

b. **WebSite schema** avec `SearchAction` pour débloquer la sitelinks
searchbox (bar de recherche dans le SERP Google Lehena) :
```

{
"@context": "https://schema.org",
"@type": "WebSite",
"@id": "https://lehena.fr/#website",
"url": "https://lehena.fr",
"name": "Maison Lehena",
"publisher": { "@id": "https://lehena.fr/#organization" },
"inLanguage": "fr-FR",
"potentialAction": {
"@type": "SearchAction",
"target": {
"@type": "EntryPoint",
"urlTemplate": "https://lehena.fr/fr/recherche?q={search_term_string}"
},
"query-input": "required name=search_term_string"
}
}

````

c. **Breadcrumb réutilisable** — composant `<Breadcrumb items={...}>` qui
rend :
- Rendu HTML visuel accessible (nav aria-label + ol/li)
- JSON-LD `BreadcrumbList` couplé
Signature :
```typescript
interface BreadcrumbItem { name: string; href: string }
<Breadcrumb items={[
  { name: "Accueil", href: "/fr" },
  { name: "Jambons", href: "/fr/categories/jambons" },
  { name: "Jambon Orhi", href: "/fr/products/jambon-orhi-24-mois" }
]} />
````

Emplacement : `apps/storefront/src/components/breadcrumb.tsx`

d. **Global vs page-specific** :

- Organization + WebSite : injectés dans `app/layout.tsx` (une seule fois par page)
- Breadcrumb : injecté par chaque page qui en a besoin (PDP, catégorie,
  article)

## Étape 3 — Plan détaillé

3-5 sous-passes :

- A : Enrichir `lib/seo/schemas/organization.ts` avec vatID, sameAs complet,
  knowsAbout, hasCredential (placeholders si vide)
- B : Enrichir `lib/seo/schemas/website.ts` avec `SearchAction`
- C : Créer `components/breadcrumb.tsx` (visuel + JSON-LD)
- D : Ajouter le helper `lib/seo/schemas/breadcrumb.ts`
- E : Intégrer le composant sur PDP + catégorie + article (au minimum)

## Étape 4 — Implémentation

- Branche `feat/seo-03-global-schemas`
- Utiliser `@id` avec URL pour lier les schemas entre eux (Organization
  référencée par WebSite via publisher, par Product via brand/seller)

## Contraintes

- Pas de doublon d'Organization sur les pages (une seule fois par page rendue)
- `logo` doit exister (recommandé 512x512 PNG carré). Fallback texte OK si
  pas de logo — mais dis-moi ce que tu observes.
- `telephone` au format E.164 (`+33 5 59 XX XX XX`) — si vide, omettre plutôt
  que d'inventer.

## Ce que tu NE fais PAS

- Toucher aux schemas Product / LocalBusiness / Article (autres prompts)
- Créer le logo PNG (à faire côté design, hors code)

Vas-y, commence par l'étape 1.

```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr | grep -A200 "application/ld+json"` renvoie Organization + WebSite
- [ ] Schema Validator passe sur Organization + WebSite
- [ ] Rich Results Test montre "Sitelinks searchbox" éligible
- [ ] Composant `<Breadcrumb>` utilisé sur PDP + catégorie, avec JSON-LD couplé
- [ ] `vatID`, `sameAs` (au moins Facebook + Instagram) présents
- [ ] `@id` cohérent partout (Organization référencée par publisher/brand/seller)

## Pièges courants

- **`SearchAction` avec mauvais `urlTemplate`** → sitelinks searchbox ne
  s'active pas. Tester en tapant "site:lehena.fr" dans Google après
  quelques jours d'indexation.
- **`logo` URL relative** → invalide.
- **Doubloner Organization dans plusieurs pages** avec des `@id` différents →
  Google confusion.
- **`sameAs` avec des URLs mortes** (compte Facebook fermé, etc.) → warning.

## Commit final

`feat(seo): global Organization + WebSite (SearchAction) + reusable Breadcrumb component`
```
