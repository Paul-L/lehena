# SEO 09 — Meta + OG helpers + dynamic OG images

## Objectif

Centraliser tous les meta tags SEO via un helper `generateMetadata` unique
avec defaults Lehena, et générer dynamiquement les images Open Graph
(OG) par template : produit affiché avec titre + prix, article avec titre

- auteur, catégorie avec titre + N produits. Fini les partages Facebook
  / WhatsApp / LinkedIn / Twitter avec un logo générique.

Une OG image bien faite fait **+30 à +80% de taux de clic** sur les
partages sociaux.

---

## PROMPT À COPIER-COLLER

```
Tu vas centraliser la gestion des meta tags SEO et implémenter la génération
d'OG images dynamiques par template. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 3 métadonnées)
3. `apps/storefront/src/lib/seo/metadata.ts` (helper existant)
4. Next.js opengraph-image API : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Comment `generateMetadata` est-il actuellement utilisé (chaque page a son
  propre bloc, ou factorisé via helper) ?
- Un helper `buildMetadata()` existe déjà dans `lib/seo/metadata.ts` —
  décris ce qu'il expose et ce qu'il génère.
- Y a-t-il déjà une image OG statique (`app/opengraph-image.jpg`) ? De
  quelle qualité ?

## Étape 2 — Choix techniques à valider

a. **Helper `buildMetadata` enrichi** — champs à couvrir par défaut sur
   toutes les pages :
```

{
title: <template: "{title} · Maison Lehena">,
description: <150 chars max, fallback description Lehena>,
openGraph: {
title, description,
url: <canonical absolue>,
siteName: "Maison Lehena",
images: [<ogImage 1200x630>],
locale: "fr_FR",
type: "website" | "article" | "product",
},
twitter: {
card: "summary_large_image",
title, description, images,
creator: "@maisonlehena", // si compte Twitter/X
site: "@maisonlehena",
},
alternates: {
canonical: <URL absolue>,
languages: { fr, es, en } (si multilingue actif),
},
robots: { index, follow, "max-image-preview": "large" },
other: {
"theme-color": "#a83925", // rouge Lehena
}
}

```

b. **OG images dynamiques** — Next.js supporte les OG images générées via
`opengraph-image.tsx` (React → PNG au build/runtime). Créer une image
par template :

- **Home** : logo + baseline "Maître Artisan Charcutier au Pays Basque"
  sur fond crème
- **Product** (`products/[handle]/opengraph-image.tsx`) : image produit
  principal en cutout + titre + prix + badge "Sans nitrite" si applicable
- **Category** (`categories/[...category]/opengraph-image.tsx`) : titre
  catégorie + 4 miniatures produits en mosaïque + total produits
- **Article** / pilier : titre + sous-titre + photo auteur en médaillon
  + logo
- **Atelier** : photo atelier + adresse + horaires
- **Fallback layout.tsx** : logo + baseline

Format : 1200x630 (ratio 1.91:1 recommandé Facebook, aussi bon Twitter,
LinkedIn, WhatsApp).

c. **Assets image** : la génération runtime OG images Next.js utilise
Satori (SVG in-runtime) + Resvg (PNG output). Contraintes :
- Fonts : les charger via `next/font` ou embed WOFF2 dans `public/fonts/`
- Images externes : doivent être encodable en base64 au build (petites)
  ou fetchable en runtime (HTTPS + CORS OK)
- Pas de JS dans les OG components — juste JSX statique

d. **Fallback** : si la génération dynamique échoue (produit sans image,
fetch fails), retomber sur `app/opengraph-image.jpg` par défaut. Ne
JAMAIS renvoyer 404 sur une OG image (les scrapers Facebook/Twitter
caching ferait péter le partage pendant 24h).

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Enrichir `lib/seo/metadata.ts` avec tous les champs OG/Twitter/alternates
+ fonction `buildMetadata({...overrides})`
- B : Créer `app/opengraph-image.tsx` (fallback global)
- C : Créer `app/[countryCode]/(main)/products/[handle]/opengraph-image.tsx`
- D : Créer `app/[countryCode]/(main)/categories/[...category]/opengraph-image.tsx`
- E : Template Article OG pour les pages piliers
- F : Vérifier chaque page `generateMetadata` appelle bien le helper (grep
et refactor si besoin)
- G : Test partage réel sur Facebook / LinkedIn / Twitter (avec debugger
Facebook Sharing Debugger)

## Étape 4 — Implémentation

- Branche `feat/seo-09-meta-og-generator`
- Générer les OG images en runtime avec cache 1 semaine (dépendantes du
contenu, changent rarement)
- Ne pas dépendre de fonts externes (embed local)

## Contraintes

- Image finale ≤ 5 MB (limite Facebook)
- Dimensions 1200x630 (retina non nécessaire pour OG)
- Format PNG (JPG accepté aussi, mais PNG plus safe pour transparency)
- Texte lisible sur miniature ~600x315 (donc font size min 36pt pour titres)

## Ce que tu NE fais PAS

- Utiliser des services externes payants (Bannerbear, Cloudinary) — la
génération runtime Next.js suffit
- Charger des fonts Google en runtime (perf ✗)
- Toucher aux schemas JSON-LD (autres prompts)

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] Chaque template a une OG image dynamique fonctionnelle (test via
      Facebook Sharing Debugger : https://developers.facebook.com/tools/debug/)
- [ ] `curl https://lehena.fr/fr/products/jambon-orhi/opengraph-image` renvoie
      un PNG 1200x630 avec le titre + prix + image produit
- [ ] Twitter Card Validator : https://cards-dev.twitter.com/validator montre
      le rendu attendu
- [ ] LinkedIn Post Inspector : https://www.linkedin.com/post-inspector/ idem
- [ ] `generateMetadata` de toutes les pages appelle `buildMetadata()`
      (grep : plus aucun `export const metadata` en dur avec title/desc)
- [ ] Fallback global fonctionne (si scraper accède à une page sans OG
      spécifique)

## Pièges courants

- **Font non embarquée** → texte non rendu, OG image vide ou générique
- **Image produit HTTP au lieu de HTTPS** → refusée par Satori
- **CORS bloqué** sur image externe → OG image blanche
- **Facebook cache** : après une modif OG, refresh via Facebook Sharing
  Debugger sinon le vieux OG reste jusqu'à 30 jours
- **Twitter card manquante** — sans `twitter:card` explicite, Twitter ne
  génère aucune preview riche

## Commit final

`feat(seo): centralized buildMetadata + dynamic OG images per template`
