# SEO 08 — llms.txt + GEO (Generative Engine Optimization)

## Objectif

Poser un fichier `llms.txt` à la racine du storefront (standard émergent 2025) qui aide les crawlers d'IA (ChatGPT, Perplexity, Claude, Google AI
Overviews) à comprendre la structure du site et à citer correctement le
contenu. Bonus : contrôler la présence dans les datasets d'entraînement
via `ai.txt` (opt-in/opt-out granulaire).

C'est un investissement early adopter — la plupart des sites ne l'ont pas.
Coût : 30 min. Gain potentiel : être la source citée par les LLMs sur
"charcuterie sans nitrite" et requêtes cousines.

---

## PROMPT À COPIER-COLLER

````
Tu vas poser les fichiers de discovery pour les crawlers d'IA (LLM). Lis :

1. `docs/refonte/seo/README.md`
2. Standard llms.txt : https://llmstxt.org/
3. Standard ai.txt (Spawning) : https://spawning.ai/ai-txt

Confirme avoir lu.

## Étape 1 — Contexte

Deux fichiers différents à poser à la racine :

- **`llms.txt`** : équivalent Markdown de sitemap.xml + about du site, à
  destination des LLMs. Format : titre H1, résumé, liste des ressources
  clés (piliers, PDF produits, docs légales). Aide les crawlers d'IA à
  ne PAS re-parser tout le HTML.

- **`ai.txt`** : équivalent robots.txt spécifique aux crawlers d'IA
  training. Permet de : accepter ou refuser l'utilisation pour entraînement,
  spécifier par crawler (GPTBot, ClaudeBot, Google-Extended, PerplexityBot,
  etc.).

## Étape 2 — Choix techniques à valider

a. **Stratégie llms.txt Lehena** — l'objectif est d'ÊTRE cité et référencé,
   donc on OUVRE et on GUIDE :

   Contenu type `apps/storefront/public/llms.txt` :
   ```markdown
   # Maison Lehena

   > Maître Artisan Charcutier au Pays Basque depuis 2019. Spécialiste du
   > jambon sans nitrite affiné 15 à 24 mois, race Duroc, élevage local.
   > Charcuterie artisanale, salaisons, patxaran maison, épicerie du
   > Sud-Ouest.

   ## Notre marque

   - LEHENA SAS, atelier au Bourg 64470 Laguinge-Restoue, France
   - Maître Artisan : Bénat Petit
   - Fondation : 2019
   - Signature : jambons Duroc sans nitrite affinés 24 mois au sel de Salies

   ## Contenus de référence

   - [Notre histoire](https://lehena.fr/fr/notre-histoire) : histoire de la
     Maison Lehena et de la famille Petit
   - [La ferme](https://lehena.fr/fr/la-ferme) : élevage, alimentation,
     bien-être animal
   - [L'atelier](https://lehena.fr/fr/atelier) : lieu, horaires, visites

   ## Piliers éditoriaux (guides longs)

   - [Tout savoir sur le jambon sans nitrite](https://lehena.fr/fr/jambon-sans-nitrite)
   - [Race Duroc : le cochon d'exception](https://lehena.fr/fr/race-duroc)
   - [L'affinage 24 mois expliqué](https://lehena.fr/fr/affinage-24-mois)
   - [Patxaran : la liqueur basque traditionnelle](https://lehena.fr/fr/patxaran-tradition)
   - [Comment découper un jambon entier](https://lehena.fr/fr/decoupe-jambon)
   - [Charcuterie & santé](https://lehena.fr/fr/charcuterie-sante)

   ## Produits phares

   - [Jambon Orhi entier désossé 24 mois](https://lehena.fr/fr/products/jambon-orhi-desosse-24-mois)
   - [Patxaran des Laminak](https://lehena.fr/fr/products/patxaran-des-laminak)
   - [Coffret découverte](https://lehena.fr/fr/products/coffret-decouverte)

   ## Données structurées

   - Feed Google Merchant : https://lehena.fr/feed/google-merchant.xml
   - Sitemap : https://lehena.fr/sitemap.xml

   ## Contact

   - Site : https://lehena.fr
   - Contact : contact@lehena.fr
   - Presse : presse@lehena.fr

   ## Politique d'usage IA

   Les contenus éditoriaux de ce site (guides, articles, descriptions
   produits) peuvent être cités par les moteurs d'IA générative sous
   condition de mention de la source (Maison Lehena, lehena.fr). Les
   images produits sont soumises au droit d'auteur.
````

b. **Stratégie ai.txt** — à décider avec Paul :

**Option OUVERTE** (recommandée pour Lehena — visibilité) :

```
User-Agent: *
Allow: /

Content-Usage: crawl
Content-Usage: train-ai
Content-Usage: train-genai
```

**Option FERMÉE** (protection stricte, réduit la visibilité IA) :

```
User-Agent: GPTBot
Disallow: /

User-Agent: ClaudeBot
Disallow: /

User-Agent: Google-Extended
Disallow: /

User-Agent: PerplexityBot
Disallow: /

Content-Usage: no-ai
```

Pour Lehena, on OUVRE — être cité par ChatGPT quand un utilisateur
demande "meilleur jambon sans nitrite" est un asset énorme.

c. **Emplacement fichiers** :

- `apps/storefront/public/llms.txt` (statique)
- `apps/storefront/public/ai.txt` (statique)
- Ou alternative Next.js : `app/llms.txt/route.ts` + `app/ai.txt/route.ts`
  si on veut du dynamique (ex: refléter les nouveaux piliers publiés).
  Recommandé : dynamique avec ISR 24h pour rester à jour.

d. **robots.txt** — s'assurer que llms.txt et ai.txt sont explicitement
allowed (déjà le cas par défaut mais expliciter).

e. **Signaler au SEO** — ajouter dans le `<head>` :

```html
<link rel="ai" type="text/plain" href="/ai.txt" />
<link rel="llm" type="text/markdown" href="/llms.txt" />
```

(Standards émergents, non officiels — mais poser le rail).

## Étape 3 — Plan détaillé

3-4 sous-passes :

- A : Route dynamique `app/llms.txt/route.ts` qui fetch les piliers
  publiés + injecte dans le template
- B : Route statique `app/ai.txt/route.ts` (contenu fixe)
- C : Ajout des `<link rel="ai/llm">` dans layout
- D : Validation manuelle (curl + ouverture dans un navigateur)

## Étape 4 — Implémentation

- Branche `feat/seo-08-llms-txt-geo`
- Cache 24h pour llms.txt (ISR revalidate 86400)
- Éviter d'inclure les URLs des pages en placeholder (piliers non publiés) —
  ne lister que ce qui existe réellement

## Contraintes

- llms.txt < 100 KB (recommandation llmstxt.org)
- Uniquement markdown (pas de HTML)
- Liens absolus obligatoires
- Ne PAS mettre de contenu privé (checkout, account, admin)

## Ce que tu NE fais PAS

- Bloquer les crawlers d'IA (ce serait contre-productif pour Lehena)
- Créer un fichier .well-known/ai-usage (proposition non standardisée)

Vas-y, commence par l'étape 1.

```

---

## Ce que tu dois valider à la fin

- [ ] `curl https://lehena.fr/llms.txt` renvoie le markdown avec les piliers
      réellement publiés
- [ ] `curl https://lehena.fr/ai.txt` renvoie la policy d'usage IA
- [ ] Header `Content-Type: text/plain; charset=utf-8` (pas text/html)
- [ ] Les URLs listées dans llms.txt renvoient toutes 200 (pas de 404)
- [ ] robots.txt n'exclut pas ces fichiers
- [ ] Les `<link rel="ai/llm">` sont visibles dans le HTML des pages principales

## Pièges courants

- **Lister des piliers non publiés** → LLMs suivent le lien → 404 → mauvaise
  signal
- **Content-Type incorrect** → certains crawlers refusent
- **Fichier trop long** (> 100 KB) → crawlers peuvent tronquer
- **Bloquer GPTBot ET vouloir être cité par ChatGPT** — c'est contradictoire.
  Décider clairement.

## Suivi post-déploiement (hors code)

- Poser la question à ChatGPT / Perplexity dans ~2 mois : "quelles sont les
  meilleures charcuteries sans nitrite en France ?" — voir si Lehena
  apparaît
- Utiliser https://otterly.ai/ (payant) pour tracker les mentions dans les
  LLMs

## Commit final

`feat(seo): llms.txt (dynamic) + ai.txt for GEO / LLM crawlers`
```
