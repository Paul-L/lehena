# Passe 05 — Storefront Next.js : rendu des pages + revalidation ISR

## Objectif de cette passe

Brancher le storefront Next.js sur les routes `/store/pages` du backend pour
afficher les pages publiées, gérer le SEO, le mode preview, et la
revalidation à la demande déclenchée par le backend.

---

## PROMPT À COPIER-COLLER

```
Passe 05 : Rendu des pages éditoriales côté storefront Next.js + revalidation ISR.

On consomme les routes API store créées en passe 02. Le backend appelle
déjà `/api/revalidate` du storefront via le subscriber — on va maintenant
implémenter cette route et tout le rendu.

## Périmètre

- Helpers de fetching `lib/medusa-pages.ts`
- Renderer TipTap JSON → React (pour SSR + SEO)
- Route dynamique `app/[slug]/page.tsx`
- Route `app/api/revalidate/route.ts`
- Mode preview avec token
- Sitemap des pages publiées
- Tests de rendu basiques

## Helpers de fetching

Crée `src/lib/medusa-pages.ts` :

```typescript
export type Page = {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  locale: string;
};

export async function getPageBySlug(
  slug: string,
  options?: { previewToken?: string }
): Promise<Page | null>;

export async function getAllPublishedPages(): Promise<Page[]>;
```

- Utilise `fetch` natif avec `next.revalidate` configuré
- `getPageBySlug` : revalidate de 3600s (1h) en plus de la revalidation à la demande
- `getAllPublishedPages` : utilisé pour `generateStaticParams` et le sitemap
- Gère les erreurs proprement (retourne `null` si 404, throw sinon)
- Si `previewToken` fourni, l'envoie en header `x-preview-token`

## Renderer TipTap JSON → React

C'est le point délicat. On veut du HTML statique côté serveur pour le SEO,
pas une hydratation client-side.

Crée `src/lib/tiptap-renderer.tsx` :

```typescript
import { JSONContent } from '@tiptap/core';

type Props = {
  content: JSONContent;
  className?: string;
};

export function TiptapContent({ content, className }: Props): JSX.Element;
```

Implémentation :
- Parcours récursif de l'arbre JSON
- Map chaque type de node vers un composant React :
  - `doc` → fragment
  - `paragraph` → `<p>`
  - `heading` → `<h2>` / `<h3>` / `<h4>` selon `attrs.level`
  - `bulletList` → `<ul>`, `orderedList` → `<ol>`, `listItem` → `<li>`
  - `blockquote` → `<blockquote>`
  - `codeBlock` → `<pre><code>` (avec class si language)
  - `horizontalRule` → `<hr>`
  - `hardBreak` → `<br>`
  - `image` → `<Image>` de next/image (avec width/height auto si dispo, sinon
    composant image custom qui gère le sizing)
  - `text` → texte avec marks appliquées :
    - `bold` → `<strong>`
    - `italic` → `<em>`
    - `strike` → `<s>`
    - `code` → `<code>`
    - `link` → `<a href={attrs.href} target={attrs.target} rel={attrs.rel}>`

- Wrap le tout dans `<div className={cn('prose prose-lg max-w-none', className)}>`
- Pour les images : utilise `next/image` si l'URL est sur un domaine connu
  (ajouter le domaine de Medusa dans `next.config.js` `images.remotePatterns`)
- Gère gracieusement les types inconnus (skip, log warning en dev)

Approche alternative recommandée : utiliser `@tiptap/html` avec `generateHTML`
côté serveur. Mais ça oblige à inclure les extensions ProseMirror dans le
storefront, ce qui alourdit le bundle. Le renderer custom est plus léger et
plus flexible. Choisis selon le contexte (la passe 01 doit avoir tranché).

## Route dynamique `app/[slug]/page.tsx`

```typescript
type Params = { slug: string };
type SearchParams = { preview?: string };

export async function generateStaticParams() {
  // Fetch toutes les pages publiées et retourne [{ slug }]
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  // Utilise meta_title (fallback title), meta_description, og_image_url
  // Gère le canonical URL
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  // 1. Récupère le slug et le preview token (si présent)
  // 2. Fetch la page (avec preview token si fourni)
  // 3. Si null, appelle notFound()
  // 4. Render :
  //    - <article>
  //    - Bandeau "Mode preview" en haut si previewToken et page draft
  //    - <h1>{title}</h1>
  //    - <TiptapContent content={page.content} />
}

export const revalidate = 3600; // ISR fallback de 1h
```

### Bandeau preview
Si on est en mode preview ET la page est en draft :
- Bandeau jaune fixe en haut : "🔍 Mode preview — cette page est un brouillon
  non visible publiquement"
- Bouton "Quitter le preview" qui supprime le query param

### Conflits de slugs
Attention : la route `[slug]` peut entrer en conflit avec les routes Medusa
existantes (`/products/[handle]`, `/categories/[handle]`, etc.).

- Place la route `[slug]` à la racine de l'app router
- Vérifie que les slugs réservés du backend incluent toutes les premières
  paths utilisées par le storefront (cart, checkout, account, products, etc.)
- Si malgré ça un conflit existe (ex: `/about` et `/about-us` peuvent matcher
  d'autres choses), documente clairement dans le README

## Route `app/api/revalidate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Vérifie le header x-revalidate-secret
  // 2. Si invalide → 401
  // 3. Parse le body : { slug?: string, paths?: string[] }
  // 4. Pour chaque slug : revalidatePath('/' + slug)
  // 5. Pour chaque path additionnel : revalidatePath(path)
  // 6. Retourne 200 avec { revalidated: true, paths: [...] }
}
```

- Utilise `revalidatePath` de `next/cache`
- Log chaque revalidation
- Gère les erreurs : si `revalidatePath` throw, retourne 500 avec le détail

## Sitemap

Crée `app/sitemap.ts` qui inclut les pages publiées :

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getAllPublishedPages();
  return [
    { url: SITE_URL, lastModified: new Date(), priority: 1.0 },
    ...pages.map(p => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: new Date(p.published_at!),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // ... autres routes existantes du sitemap
  ];
}
```

Si un sitemap existe déjà, fusionne plutôt que d'écraser.

## Configuration next.config.js

Ajoute le domaine du backend Medusa (et de tout CDN d'images utilisé) dans
`images.remotePatterns` :

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'http', // ou https en prod
      hostname: 'localhost',
      port: '9000',
      pathname: '/static/**',
    },
    // + le bucket S3/MinIO si configuré
  ],
}
```

## Variables d'environnement

À ajouter dans `.env.local` du storefront :
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
REVALIDATE_SECRET=le-meme-secret-que-backend
PREVIEW_SECRET=le-meme-secret-que-backend
NEXT_PUBLIC_SITE_URL=http://localhost:8000
```

## Tests

- Test du renderer TipTap : pour chaque type de node, vérifier que le rendu
  HTML est correct (utilise `@testing-library/react` ou `vitest`)
- Test de la route revalidate : 401 sans secret, 200 avec secret valide
- Pas besoin de tester `app/[slug]/page.tsx` (test e2e en passe 07)

## Structure de fichiers attendue

```
storefront/src/
├── app/
│   ├── [slug]/page.tsx
│   ├── api/revalidate/route.ts
│   └── sitemap.ts
├── lib/
│   ├── medusa-pages.ts
│   └── tiptap-renderer.tsx
├── components/
│   └── preview-banner.tsx
└── __tests__/
    ├── tiptap-renderer.test.tsx
    └── revalidate-route.test.ts
```

## Procédure d'exécution

1. Crée le helper `medusa-pages.ts`. Stop, montre-moi.
2. Crée le renderer `tiptap-renderer.tsx`. Crée des tests unitaires pour
   chaque type de node. Lance les tests. Stop, montre-moi.
3. Crée la route `app/[slug]/page.tsx` (sans preview pour l'instant). Lance
   le storefront, va sur `/test-page` (la page créée en passe 02), vérifie
   que ça s'affiche. Stop.
4. Ajoute `generateStaticParams` et `generateMetadata`. Vérifie le rendu HTML
   (View Source) : le contenu doit être présent dans le HTML, pas juste après
   hydratation. Stop.
5. Ajoute le mode preview + le bandeau. Test : ouvre une page draft via
   l'URL preview du Medusa Admin (passe 04). Stop.
6. Crée la route `api/revalidate`. Test manuel : modifie une page dans
   l'admin, vérifie dans les logs Next.js que la revalidation a bien été reçue
   et exécutée. Stop.
7. Ajoute le sitemap. Vérifie sur `/sitemap.xml`.
8. Configure `next.config.js` pour les images. Vérifie qu'une page avec image
   s'affiche correctement.
9. Commit : `feat(pages): add storefront rendering with ISR revalidation`

## Critères de succès

À la fin de cette passe :
- Une page publiée est accessible sur `https://monsite.com/[slug]`
- Le contenu TipTap est rendu en HTML statique (vérifiable via View Source)
- Les balises meta `<title>`, `<meta description>`, `og:image` sont correctes
- Modifier la page dans l'admin déclenche la revalidation immédiate (visible
  côté front sans attendre 1h)
- Le mode preview fonctionne pour voir les drafts
- `/sitemap.xml` liste les pages publiées
- Les images s'affichent correctement (avec next/image)
- Pas d'erreur d'hydratation dans la console

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Page publiée visible sur le storefront
- [ ] HTML statique côté serveur (View Source contient le contenu)
- [ ] SEO meta correctes
- [ ] Revalidation à la demande fonctionnelle (modif admin → page MAJ immédiate)
- [ ] Mode preview fonctionne pour les drafts
- [ ] Sitemap inclut les pages
- [ ] Pas d'erreur d'hydratation
- [ ] Tests du renderer passent

Si la revalidation ne marche pas, c'est probablement un souci de secret entre
backend et storefront — c'est l'erreur la plus fréquente, vérifie d'abord ça.
