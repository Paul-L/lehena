# SEO 12 — Audit final : validators, crawl, rich results, dashboard

## Objectif

Audit complet post-implémentation des 11 prompts précédents pour
confirmer que tout est en place et fonctionnel. Livrable : un rapport
d'audit `docs/refonte/seo/audit-report-<date>.md` avec les preuves
(captures, exports, validators) et le suivi des KPIs SEO à instrumenter.

Ce prompt est le "gatekeeper" avant de considérer le SEO comme
production-ready.

---

## PROMPT À COPIER-COLLER

```
Tu vas conduire un audit SEO complet du storefront + backend Lehena après
implémentation des prompts 01-11. Lis :

1. `docs/refonte/seo/README.md`
2. Tous les autres prompts 01-11 (checklists finales de chaque)
3. `docs/refonte/strategie-seo.md` (§ 11 checklists par phase)

Confirme avoir lu.

## Étape 1 — Validation schémas (validators.schema.org + Rich Results Test)

Pour chacune des URLs suivantes, exécute :

a. **Schema Validator** — https://validator.schema.org?url=<URL>
b. **Rich Results Test** — https://search.google.com/test/rich-results?url=<URL>

URLs à tester :
- Home : `https://lehena.fr/`
- PDP jambon : `https://lehena.fr/fr/products/jambon-orhi-desosse-24-mois`
- Catégorie jambons : `https://lehena.fr/fr/categories/jambons`
- Pilier : `https://lehena.fr/fr/jambon-sans-nitrite`
- Article support : `https://lehena.fr/fr/journal/<slug-recent>`
- Atelier : `https://lehena.fr/fr/atelier`
- Auteur : `https://lehena.fr/fr/auteurs/benat-petit`

Pour chaque URL, capture le résultat (nombre d'erreurs, warnings, rich
results éligibles) dans le rapport.

## Étape 2 — Crawl technique (Screaming Frog ou équivalent)

Idéalement : télécharger Screaming Frog SEO Spider (gratuit jusqu'à 500 URLs,
suffit pour Lehena) et crawler `https://lehena.fr`.

Extraire dans le rapport :
- Nombre total d'URLs crawlées
- 4xx errors internes (doit être 0)
- 5xx errors (doit être 0)
- Redirect chains > 1 (doit être 0)
- Meta title dupliqués (doit être 0)
- Meta description dupliqués ou manquants
- H1 manquants ou multiples par page
- Images sans alt (audit)
- Pages orphelines (aucun lien interne pointant dessus)
- Canonical incohérents

Alternative si pas d'accès Screaming Frog : utiliser `wget --spider -r
https://lehena.fr` puis grep sur les codes retour.

## Étape 3 — Sitemap + robots + Search Console

- Sitemap.xml accessible ? Toutes les sous-sitemaps répondent ?
- robots.txt cohérent avec ce qu'on veut bloquer (checkout, account, api) ?
- Sitemap soumis dans Google Search Console → statut "Success" avec
  nombre d'URLs indexées
- Idem Bing Webmaster Tools
- Search Console → onglet "Couverture" — aucune erreur type "Redirect
  error", "Server error", "URL blocked by robots"

## Étape 4 — Lighthouse CI

Lancer Lighthouse (Chrome DevTools ou CLI) sur 5 templates clés :
- Home
- Catégorie
- PDP
- Article pilier
- Page atelier

Cibles :
- Performance ≥ 90
- SEO 100
- Accessibility ≥ 95
- Best Practices ≥ 95

Extraire dans le rapport : les scores + les Core Web Vitals (LCP, INP,
CLS) par template.

## Étape 5 — Web Vitals RUM (Plausible)

- Dashboard Plausible → Custom events → `WebVital:LCP`, `WebVital:CLS`,
  `WebVital:INP` reçoivent bien des events
- Extraire les median par template sur les 7 derniers jours
- Signaler les templates > seuils "poor" (LCP > 2.5s, INP > 500ms,
  CLS > 0.25)

## Étape 6 — LLM / GEO

- `llms.txt` accessible et à jour ?
- `ai.txt` accessible ?
- Test dans ChatGPT : "meilleure charcuterie sans nitrite Pays Basque"
  → Lehena apparaît-il ? (peut prendre 2-3 mois d'indexation)
- Test dans Perplexity : idem
- Test dans Google Search "quelle charcuterie sans nitrite" → SGE / AI
  Overview cite-t-il Lehena ?

## Étape 7 — Merchant Center

- Feed https://lehena.fr/feed/google-merchant.xml valide et complet
- Merchant Center Dashboard → 0 disapproved products
- Free Listings → produits éligibles Google Shopping
- Screenshot du diagnostic dans le rapport

## Étape 8 — Local SEO / GBP

- Fiche Google Business Profile complète (adresse, horaires, photos,
  posts récents)
- NAP cohérent (Name, Address, Phone) entre : GBP, footer storefront,
  page /atelier, LocalBusiness schema, emails
- Avis Google : cible ≥ 20 avis à 6 mois post-launch

## Étape 9 — Backlinks + citations (Ahrefs / Ubersuggest gratuit)

- Nombre de backlinks (référent domains)
- Nouveaux backlinks depuis lancement
- Ancres majoritaires (naturel = "lehena.fr", "maison lehena", pas
  "jambon sans nitrite pas cher")
- Domaines citations : presse, blogs, forums cuisine

## Étape 10 — Livrable final

Produis `docs/refonte/seo/audit-report-YYYYMMDD.md` avec :

1. **Résumé exécutif** (1 paragraphe) : "SEO en place / partiellement en
   place / à améliorer" + KPI clés
2. **Résultats par prompt** (01-11) : ✅ OK / ⚠️ Partial / ❌ KO avec la
   preuve pour chaque
3. **Erreurs bloquantes** à corriger avant considération "production-ready"
4. **KPIs à suivre mensuellement** — dashboard Plausible + Search Console
   + Merchant Center + Ahrefs (si abonnement)
5. **Backlog SEO 6 mois** — les 5-10 chantiers d'amélioration continue

## Contraintes

- Pas de compte payant obligatoire (Screaming Frog gratuit suffit, Ahrefs
  démo aussi)
- Screenshots à intégrer dans le rapport (ou liens vers captures Notion /
  Drive)
- Rapport lisible par un humain non-technique (Paul + copywriter)

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin

- [ ] Rapport `docs/refonte/seo/audit-report-YYYYMMDD.md` livré
- [ ] Tous les schemas validators OK (0 erreur, warnings acceptables)
- [ ] Rich Results Test : au moins 1 rich result éligible par template
      (Product avec étoiles, FAQ, Article, LocalBusiness)
- [ ] Screaming Frog : 0 erreur 4xx/5xx interne
- [ ] Lighthouse : cibles atteintes sur 5 templates
- [ ] Sitemap soumis + statut Success
- [ ] Merchant Center : 0 disapproved
- [ ] KPIs à suivre listés avec source de vérité et cadence

## Pièges courants

- **Test sans invalider le cache CDN** — les modifs récentes peuvent
  encore être en cache. `curl -H "Cache-Control: no-cache"` ou attendre
  15 min
- **Lighthouse en local avec des extensions Chrome actives** → scores
  faussés. Utiliser fenêtre incognito ou Lighthouse CLI headless
- **Test rich results sur URL preview Vercel** — les résultats ne sont
  pas transposables à la prod (URLs différentes)
- **Rapport enterré sans owner** — désigner Paul comme owner du suivi
  SEO mensuel dès le rapport

## Commit final

`docs(seo): audit report post-implementation + KPIs backlog for monthly review`
