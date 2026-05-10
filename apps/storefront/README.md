# Lehena Storefront (Next.js 15)

> Avertissement : le squelette ci-dessous reprend le starter Medusa Next.js
> upstream (déprécié). Lehena s'appuie dessus mais ajoute des routes et
> helpers spécifiques.

## Pages éditoriales

Le storefront consomme le **module `pages`** du backend
([README backend](../backend/src/modules/pages/README.md)) pour rendre des
pages éditoriales (À propos, FAQ, Livraison, etc.) à l'URL `/{locale}/{slug}`.

### Pièces

| Fichier | Rôle |
|---|---|
| `src/lib/data/pages.ts` | Fetch helpers (`getPageBySlug`, `getAllPublishedPages`) avec ISR (`next.tags`, `revalidate: 3600`) |
| `src/lib/tiptap-renderer.tsx` | Renderer custom JSON TipTap → React, server-rendered, **zero deps TipTap** dans le bundle |
| `src/app/[countryCode]/(main)/[slug]/page.tsx` | Route dynamique : `generateStaticParams`, `generateMetadata` (canonical, OG, Twitter, robots), notFound() si slug inconnu |
| `src/components/preview-banner.tsx` | Bandeau jaune sticky quand `?preview=` est présent |
| `src/app/api/revalidate/route.ts` | Webhook appelé par le subscriber backend après chaque mutation. Vérifie `x-revalidate-secret` et flush les tags/paths |
| `src/app/sitemap.ts` | Sitemap App Router natif qui liste les pages publiées |

### Variables d'environnement

Dans `apps/storefront/.env.local` :

```
MEDUSA_BACKEND_URL=http://localhost:9100         # ou 9000 selon ton dev
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_…
REVALIDATE_SECRET=<même valeur que backend>
PREVIEW_SECRET=<même valeur que backend>
```

> Ces deux secrets **doivent être identiques** côté backend (`apps/backend/.env`)
> et storefront (`apps/storefront/.env.local`). C'est l'erreur de config la plus
> fréquente quand la revalidation ne marche pas.

### Mode preview

Quand on clique "Voir le site" depuis le Medusa Admin, l'admin appelle
`GET /admin/pages/preview-token` (JWT 1 h, scope `preview`, signé avec
`PREVIEW_SECRET`) puis ouvre un nouvel onglet sur
`/{locale}/{slug}?preview=<jwt>`. Le storefront forwarde le token vers le
backend en header `x-preview-token`, ce qui autorise l'accès aux drafts.

Le bandeau jaune en haut de page indique le mode preview ; un clic sur
"Quitter le preview" strip le query param.

### Revalidation à la demande

À chaque `page.published / updated / unpublished / deleted`, le subscriber
backend (`src/subscribers/revalidate-page.ts`) POST `/api/revalidate` du
storefront avec `{ slug, locale, paths }` + header `x-revalidate-secret`.
La route flush `revalidateTag('pages')`, `revalidateTag('page-${slug}')` et
`revalidatePath('/${locale}/${slug}')`.

### Customiser le rendu

Pour ajouter un nouveau type de node TipTap (ex : `productCard`), voir la
section "Customiser le renderer storefront" du
[README du module backend](../backend/src/modules/pages/README.md#customiser-le-renderer-storefront).

---

<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>

<h1 align="center">
  Medusa Next.js Starter Template
</h1>

<p align="center">
Combine Medusa's modules for your commerce backend with the newest Next.js 15 features for a performant storefront.</p>

<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

### Prerequisites

To use the [Next.js Starter Template](https://medusajs.com/nextjs-commerce/), you should have a Medusa server running locally on port 9000.
For a quick setup, run:

```shell
npx create-medusa-app@latest
```

Check out [create-medusa-app docs](https://docs.medusajs.com/learn/installation) for more details and troubleshooting.

# Overview

The Medusa Next.js Starter is built with:

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Typescript](https://www.typescriptlang.org/)
- [Medusa](https://medusajs.com/)

Features include:

- Full ecommerce support:
  - Product Detail Page
  - Product Overview Page
  - Product Collections
  - Cart
  - Checkout with Stripe
  - User Accounts
  - Order Details
- Full Next.js 15 support:
  - App Router
  - Next fetching/caching
  - Server Components
  - Server Actions
  - Streaming
  - Static Pre-Rendering

# Quickstart

### Setting up the environment variables

Navigate into your projects directory and get your environment variables ready:

```shell
cd nextjs-starter-medusa/
mv .env.template .env.local
```

### Install dependencies

Use Yarn to install all dependencies.

```shell
yarn
```

### Start developing

You are now ready to start up your project.

```shell
yarn dev
```

### Open the code and start customizing

Your site is now running at http://localhost:8000!

# Payment integrations

By default this starter supports the following payment integrations

- [Stripe](https://stripe.com/)

To enable the integrations you need to add the following to your `.env.local` file:

```shell
NEXT_PUBLIC_STRIPE_KEY=<your-stripe-public-key>
```

You'll also need to setup the integrations in your Medusa server. See the [Medusa documentation](https://docs.medusajs.com) for more information on how to configure [Stripe](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe#main).

# Resources

## Learn more about Medusa

- [Website](https://www.medusajs.com/)
- [GitHub](https://github.com/medusajs)
- [Documentation](https://docs.medusajs.com/)

## Learn more about Next.js

- [Website](https://nextjs.org/)
- [GitHub](https://github.com/vercel/next.js)
- [Documentation](https://nextjs.org/docs)
