# SEO 05 — LocalBusiness schema sur /atelier

## Objectif

Ajouter le schema `LocalBusiness` (subtype `FoodStore`) complet sur la page
`/atelier` pour connecter le site à Google Maps / Google Business Profile
et débloquer les rich results locaux (encart carte + horaires + avis sur
les recherches locales "charcutier Pays Basque").

C'est le levier #1 pour capturer les requêtes locales et connecter le SEO
au trafic physique.

---

## PROMPT À COPIER-COLLER

```
Tu vas ajouter le schema LocalBusiness sur la page /atelier. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 7 Local SEO)
3. `apps/storefront/src/lib/company.ts` — source de vérité société
4. `apps/backend/src/scripts/seed-pages.ts` — contenu page /atelier
5. Doc Google LocalBusiness : https://developers.google.com/search/docs/appearance/structured-data/local-business
6. Doc schema.org FoodStore : https://schema.org/FoodStore

Confirme avoir lu.

## Étape 1 — Reconnaissance

- La page `/atelier` (ou `/fr/atelier`) existe-t-elle côté storefront ?
  Comment est-elle rendue (CMS Page ou route Next statique) ?
- Est-ce que le schema Organization actuel contient déjà une adresse ?
  Il faudra soit factoriser, soit dupliquer prudemment.
- Le fichier `company.ts` contient-il des `geo` coordinates (latitude,
  longitude) pour Le Bourg 64470 Laguinge-Restoue ? Sinon les récupérer
  via `https://nominatim.openstreetmap.org/search?q=Le+Bourg+64470+Laguinge-Restoue&format=json`
  et les hardcoder dans le schema.

## Étape 2 — Choix techniques à valider

a. **LocalBusiness schema** (subtype `FoodStore`) sur `/atelier` :
```

{
"@context": "https://schema.org",
"@type": "FoodStore",
"@id": "https://lehena.fr/atelier#localbusiness",
"name": "Maison Lehena — Atelier",
"image": [
"https://lehena.fr/images/atelier-facade.webp",
"https://lehena.fr/images/atelier-interieur.webp",
"https://lehena.fr/images/atelier-jambons.webp"
],
"url": "https://lehena.fr/atelier",
"telephone": "+33559XXXXXX", // à confirmer avec Paul
"email": "contact@lehena.fr",
"priceRange": "€€€",
"address": {
"@type": "PostalAddress",
"streetAddress": "Le Bourg",
"postalCode": "64470",
"addressLocality": "Laguinge-Restoue",
"addressRegion": "Pyrénées-Atlantiques",
"addressCountry": "FR"
},
"geo": {
"@type": "GeoCoordinates",
"latitude": 43.15XXX, // à récupérer via Nominatim
"longitude": -0.98XXX
},
"openingHoursSpecification": [
{
"@type": "OpeningHoursSpecification",
"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
"opens": "09:00",
"closes": "12:30"
},
{
"@type": "OpeningHoursSpecification",
"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
"opens": "14:00",
"closes": "18:00"
},
{
"@type": "OpeningHoursSpecification",
"dayOfWeek": "Saturday",
"opens": "09:00",
"closes": "12:30"
}
// → à confirmer avec Paul les vraies horaires
],
"parentOrganization": { "@id": "https://lehena.fr/#organization" },
"sameAs": [
"https://www.facebook.com/maisonLehena",
"https://www.instagram.com/maisonlehena/",
"https://maps.google.com/?cid=<CID_GBP>" // Google Business Profile
],
"hasMap": "https://maps.google.com/?cid=<CID_GBP>",
"areaServed": [
{ "@type": "AdministrativeArea", "name": "Pays Basque" },
{ "@type": "AdministrativeArea", "name": "Béarn" },
{ "@type": "Country", "name": "France" }
],
"servesCuisine": ["Charcuterie", "Basque", "Sud-Ouest"],
"acceptsReservations": false,
"paymentAccepted": "Cash, Credit Card, Contactless",
"currenciesAccepted": "EUR"
}

```

b. **Champs à valider avec Paul (dépendent du business)** :
- Téléphone public exact (E.164 format)
- Horaires atelier / vente directe (probablement pas ouvert tous les jours)
- CID Google Business Profile (à récupérer via URL de la fiche GBP)
- Coordinates GPS précises (Nominatim ou Maps)
- Photos réelles atelier à héberger dans `apps/storefront/public/images/`

c. **Contenu page atelier** — à vérifier côté seed CMS que la page contient
bien les infos NAP (Name/Address/Phone) affichées visiblement (le
schema JSON-LD doit refléter le contenu visible pour Google).

d. **Placement du schema** — injecter uniquement sur `/atelier`, PAS sur
toutes les pages (sinon Google confusion). Utiliser
`<JsonLd id="lehena-localbusiness" schema={...} />` dans la page.

## Étape 3 — Plan détaillé

3 sous-passes :

- A : Helper `lib/seo/schemas/local-business.ts` (typed, avec params override)
- B : Extension `apps/backend/src/lib/company.ts` avec les infos nécessaires
(téléphone, horaires structurées, geo coords, cid GBP)
- C : Injection du schema dans la page `/atelier` (côté rendu storefront —
route Next.js ou page CMS avec bloc SEO custom)

## Étape 4 — Implémentation

- Branche `feat/seo-05-local-business-atelier`
- Si Paul n'a pas encore fourni horaires / téléphone / CID GBP, mettre
des placeholders CLAIRS (`"TODO_PHONE"`) et signaler dans le commit.
NE PAS inventer.

## Contraintes

- Placement unique (pas sur toutes les pages)
- Cohérence NAP : les mêmes infos exactes doivent apparaître dans le HTML
visible ET dans le schema JSON-LD ET dans le GBP Google
- Format E.164 obligatoire pour telephone

## Ce que tu NE fais PAS

- Toucher au schema Organization global (c'est le prompt 03)
- Créer la page /atelier si elle n'existe pas — signaler à Paul de la seed
d'abord

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr/fr/atelier | grep -A100 "LocalBusiness"` renvoie le schema
- [ ] Rich Results Test passe sur `/fr/atelier` (rich result "Local Business" éligible)
- [ ] Schema Validator OK
- [ ] Horaires et téléphone visibles sur la page HTML (pas juste dans le schema)
- [ ] NAP identique entre : HTML page, JSON-LD schema, Google Business Profile,
      footer email (`company.ts`)
- [ ] `geo` avec vraies coordonnées (pas 0,0)

## Pièges courants

- **`openingHoursSpecification` avec les jours en français** → invalide. Utiliser
  les noms anglais (`Monday`, etc.).
- **Fermetures / vacances** — utiliser `SpecialOpeningHoursSpecification` pour
  Noël, congés, jours fériés
- **Téléphone sans `+33`** → warning
- **`priceRange` fantaisiste** — `"€"` à `"€€€€"` acceptés, souvent `"€€€"`
  pour une charcuterie premium
- **Multiplier les schemas LocalBusiness** (un sur home, un sur atelier, un
  sur contact) → Google confusion. UN SEUL, sur `/atelier`.

## Commit final

`feat(seo): LocalBusiness (FoodStore) schema on /atelier for local SEO`
