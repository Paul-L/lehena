# SEO 10 — Images optimisées + Core Web Vitals monitoring

## Objectif

Auditer l'usage de `next/image` sur tout le storefront (dimensions, priority,
alt text, formats AVIF/WebP), et instrumenter les Core Web Vitals en RUM
(Real User Monitoring) via Plausible custom events pour tracker LCP / INP /
CLS en production réelle.

Depuis 2024 les Core Web Vitals sont un signal de ranking direct — un
LCP > 2.5s te fait perdre 5-15 positions sur les requêtes concurrentielles.

---

## PROMPT À COPIER-COLLER

````
Tu vas auditer et optimiser les images + instrumenter les Core Web Vitals
en RUM. Lis :

1. `docs/refonte/seo/README.md`
2. `docs/refonte/strategie-seo.md` (§ 3 perf, cibles LCP/INP/CLS)
3. `apps/storefront/next.config.js` — config images actuelle
4. Doc web-vitals : https://github.com/GoogleChrome/web-vitals
5. Doc Plausible custom events : https://plausible.io/docs/custom-event-goals

Confirme avoir lu.

## Étape 1 — Reconnaissance

- `next.config.js` — quelle config images actuelle (formats, remotePatterns,
  qualityPolicy) ?
- Grep : combien d'usages de `<img>` HTML natif restent (au lieu de
  `next/image`) ? Ils sont autant de LCP saboteurs.
- Grep : combien d'`<Image>` sans `sizes` prop ? Sans `sizes`, next/image
  charge la version max = LCP dégradé.
- Grep : combien d'`<Image>` sans `alt=""` explicite ? A11y + SEO.
- Grep : combien de LCP images sans `priority` prop ? Ces images sont
  lazy-loaded → LCP catastrophique.
- Plausible est-il déjà installé ? Snippet chargé ?

## Étape 2 — Choix techniques à valider

a. **Audit et fix des images**

   Actions systématiques :

   1. **Remplacer tous les `<img>` par `<Image>` next/image** — grep global :
      ```
      grep -rn "<img" src/ --include="*.tsx" --include="*.jsx"
      ```
      Sauf cas où c'est intentionnel (email templates React Email — mais
      ceux-là ne sont pas dans le storefront).

   2. **`priority` sur toutes les images LCP** — hero home, hero PDP,
      image principale catégorie visible above-the-fold. Ajouter
      `priority` prop.

   3. **`sizes` prop obligatoire sur les grands `<Image fill>`** :
      - Hero fullscreen : `sizes="100vw"`
      - Image produit PDP : `sizes="(min-width: 1024px) 50vw, 100vw"`
      - Card produit grille : `sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"`

   4. **Alt text par défaut** — Component wrapper ou lint pour forcer
      `alt=""` (image décorative) ou `alt="<description>"` (image informative).
      Pas d'`alt` = crash a11y + warning SEO.

   5. **Config `next.config.js` formats AVIF + WebP** :
      ```js
      images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 31536000, // 1 year for immutable
      }
      ```

   6. **`loading="lazy"` par défaut sur les images below-the-fold** —
      `next/image` fait ça auto sauf si `priority` set. À vérifier.

   7. **`fetchpriority="high"` sur le LCP** — pour aider le navigateur à
      prioriser le download. `next/image` le fait avec `priority`.

b. **Web Vitals RUM via Plausible**

   Créer un composant client `<WebVitalsReporter>` dans le layout root qui :
   ```typescript
   "use client"
   import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals"

   const report = (metric: Metric) => {
     window.plausible?.(`WebVital:${metric.name}`, {
       props: {
         value: Math.round(metric.value),
         rating: metric.rating,  // "good" | "needs-improvement" | "poor"
         path: window.location.pathname,
         template: window.__NEXT_DATA__?.page ?? "unknown",
       },
     })
   }

   onCLS(report); onINP(report); onLCP(report)
   onFCP(report); onTTFB(report)
````

→ Dashboard Plausible → Custom Events → `WebVital:LCP`, `WebVital:CLS`,
etc. Filtrer par template pour identifier quelle page a un problème.

c. **Preconnect / DNS prefetch** dans layout root :

```html
<link rel="preconnect" href="https://backend.lehena.fr" />
<link rel="dns-prefetch" href="https://plausible.io" />
```

Économise 100-300 ms sur le premier fetch backend.

d. **Preload du hero image** — pour le LCP absolu, ajouter dans le
`<head>` de la home :

```html
<link
  rel="preload"
  as="image"
  href="https://backend.lehena.fr/static/hero-jambon-cutout.webp"
  fetchpriority="high"
  imagesrcset="..."
  imagesizes="..."
/>
```

Attention : à faire uniquement si l'image est vraiment le LCP,
sinon on ralentit le reste.

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Audit exhaustif images (grep + rapport)
- B : Fix `<img>` → `<Image>` avec `sizes` + `alt` + `priority` selon
  contexte
- C : Config `next.config.js` formats + deviceSizes
- D : Composant `<WebVitalsReporter>` + intégration dans layout
- E : Preconnect / DNS prefetch dans layout
- F : Preload hero home
- G : Test Lighthouse CI local pour valider LCP < 2s, CLS < 0.05

## Étape 4 — Implémentation

- Branche `feat/seo-10-images-webvitals`
- Rapport final : `docs/refonte/seo/lighthouse-report-before-after.md`
  (avant / après)

## Contraintes

- Ne PAS régresser sur les images actuellement bien configurées
- Composant `<WebVitalsReporter>` doit être `"use client"` mais **ne pas
  dégrader le SSR**
- Éviter d'ajouter des dépendances lourdes (`web-vitals` fait ~3 KB gzip)

## Ce que tu NE fais PAS

- Compresser manuellement les images (next/image le fait à la volée)
- Migrer vers un CDN externe (Cloudinary, Imgix) — pas nécessaire, on
  sert depuis `backend.lehena.fr/static/`
- Ajouter Google Tag Manager (Plausible suffit et est plus léger)

Vas-y, commence par l'étape 1.

```

---

## Ce que tu dois valider à la fin

- [ ] Grep `<img` retourne 0 résultat (hors emails backend, hors README)
- [ ] Tous les `<Image fill>` ont un `sizes` prop
- [ ] Toutes les images ont `alt=""` explicite (même vide pour décoratives)
- [ ] LCP hero home est en `priority` + preload
- [ ] Lighthouse local : LCP < 2s, CLS < 0.05, INP < 200 ms sur home + PDP
- [ ] Plausible reçoit les events `WebVital:LCP`, `WebVital:CLS`, `WebVital:INP`
- [ ] Filtre par template disponible dans Plausible

## Pièges courants

- **`<Image src="..." fill>` sans conteneur `position: relative`** →
  layout cassé silencieusement
- **Preload sur trop d'images** → contreproductif, le navigateur télécharge
  trop en parallèle → LCP dégradé
- **`priority` sur toutes les images** → équivaut à priority sur aucune
- **`sizes` mensonger** (ex: `sizes="100vw"` sur une thumbnail 200px) →
  next/image télécharge une trop grosse image
- **Web Vitals reportés mais Plausible pas activé** → events perdus

## Suivi post-déploiement

- Semaine 1 : regarder les median LCP par template dans Plausible
- Semaine 2 : identifier les 3 pages qui remontent le plus souvent en
  "poor" ou "needs-improvement" → optimisation ciblée

## Commit final

`feat(seo): image audit + priority/sizes/alt + Web Vitals RUM via Plausible`
```
