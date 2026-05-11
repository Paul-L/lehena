# Refonte Lehena — Plan de développement

> Refonte complète de [lehena.fr](https://lehena.fr) vers une stack moderne
> **Medusa v2 + Next.js 15 (App Router) + React 19**, avec le nouveau design
> Lehena (éditorial × terroir × premium chaleureux).
>
> Hors scope de ce plan : plugin **Pilot AI** (traité dans `docs/pilot-ai/`).

---

## 1. Contexte de départ

### Ce qui est déjà en place
- Monorepo `pnpm` + Turborepo (`apps/backend` Medusa v2.14.2, `apps/storefront` Next.js 15.3.9 / React 19).
- Module CMS **Pages éditoriales** : entité, service, API, workflows, subscribers (cf. `docs/cms/`). Admin TipTap + rendu storefront amorcés.
- Design Lehena intégré sur la **home** (`modules/home/components/lehena/*`) avec design system CSS (`globals.css` :root variables : palette terroir, typo Cormorant + Fraunces + Inter, échelle fluide).
- Amorces design Lehena ailleurs : `lehena-pdp/`, `lehena-product-card/`, `lehena-controls/`, `common/lehena/`.
- Stripe déclaré côté storefront (pas branché côté backend).
- Internationalisation par segment de route `[countryCode]` (héritée du starter Medusa).

### Ce qui n'existe pas encore
- Tout ce qui n'est pas la home côté design (PDP, listes, panier, checkout, compte client, footer, header) n'est pas finalisé.
- Aucun module métier custom hors `pages` (pas de recettes, pas d'avis, pas de wishlist).
- Aucun fournisseur de paiement, livraison, fichiers, recherche n'est configuré côté backend.
- Aucune migration depuis l'ancien site.
- CI / déploiement / monitoring inexistants.

### Décisions cadrées avec Paul
- Cible : **refonte + nouvelles features**, ~3-4 mois.
- Migration : **catalogue produits + médias + comptes clients** (sans mots de passe → reset obligé).
- **Pilot AI exclu** de ce plan (projet packagé séparé).
- Stack : pas de préférences arrêtées → propositions dans la section suivante.
- **Travail SEO lourd attendu** : l'ancien site est sous-optimisé (cf. `audit-site-actuel.md`), le SEO devient un fil rouge transverse de toutes les phases (cf. `strategie-seo.md`).
- **Complétion du contenu** (hero, CTA, sections home, copy PDP, pages piliers) à intégrer en plus du portage : on ne se contente pas de reproduire l'existant, on enrichit.

### Documents annexes (à lire en parallèle)
- [`audit-site-actuel.md`](./audit-site-actuel.md) — état des lieux objectif de l'ancien Lehena.fr (catalogue, home, PDP, SEO, UX) avec recommandations rattachées à chaque phase.
- [`strategie-seo.md`](./strategie-seo.md) — doctrine SEO transverse : architecture sémantique, schemas, performance, multilingue, local SEO, checklist par phase.

---

## 2. Stack proposée (à valider avant Phase 0)

| Domaine | Choix proposé | Pourquoi |
|---|---|---|
| Paiement | **Stripe** + **Alma** (3x sans frais) | Stripe couvre CB + Apple/Google Pay. Alma est devenu standard sur l'épicerie premium FR. Module Medusa Alma communautaire dispo. |
| Livraison | **Chronofresh** (frais réfrigéré) + **Colissimo** (sec) | Charcuterie = chaîne du froid obligatoire. Pas de Mondial Relay sur frais. |
| Recherche | **MeiliSearch** self-hosted | Typo-tolérant, FR-friendly, simple à opérer. Algolia est génial mais facture vite sur catalogue + recherches. |
| Email transac | **Resend + React Email** | DX Next.js + React, peu cher, deliverability correcte. |
| Email marketing | Connecteur **Brevo** (ex-Sendinblue) | Hébergé en France, intègre formulaires + automations. |
| Stockage médias | **Scaleway Object Storage** (S3-compatible) | RGPD + données en France. Module S3 Medusa standard fonctionne. |
| Cache / Queue | **Redis** (Upstash en hébergé, ou self) | Requis par Medusa pour les workflows + cache. |
| Analytics | **Plausible** | RGPD-friendly, pas de bandeau cookies obligatoire. GA4 optionnel via GTM si campagnes. |
| Erreurs | **Sentry** (front + back) | Standard. |
| Hébergement | Storefront → **Vercel** ; Backend → **Railway** ou **Hetzner + Coolify** | Vercel = best-in-class Next.js. Backend Medusa gourmand en RAM, mieux dédié. |
| CMS additionnel | Aucun (module **Pages** suffit) | Évite d'introduire Sanity/Strapi qui doublonnerait. |

---

## 2 bis. Fils rouges transverses (à appliquer dans CHAQUE phase)

Ces engagements ne sont pas des phases : ce sont des règles que chaque phase
respecte. Ils sont rappelés dans la *checklist de fin de phase*.

### Fil rouge SEO
Le SEO est intégré dès la conception de chaque phase, pas rattrapé en fin de
projet. Cf. `strategie-seo.md` pour le détail. Synthèse :
- **Phase 1** : slugs propres, custom fields SEO sur produits/catégories, module redirects.
- **Phase 2** : helpers `generateMetadata`, schemas globaux (Organization, WebSite), Breadcrumb réutilisable.
- **Phase 3** : schema Product/Offer/Brand, FAQ produit, description SEO catégorie, filtres SEO-safe.
- **Phase 4** : schema Article + Recipe, hreflang multilingue.
- **Phase 5** : checkout en `noindex`.
- **Phase 8** : table de redirects 301 complète, sitemap soumis avant bascule.
- **Phase 9** : audit final + pages piliers + local SEO.
- **Phase 14** : Search Console + Bing + monitoring J0/J+7/J+30.

### Fil rouge contenu
On ne porte pas l'existant : on **complète** et on **réécrit**. Cf.
`audit-site-actuel.md` pour la base, et la Phase 2 pour le brief copywriting.
- Ton de voix éditorial, ancré, sensoriel — défini en Phase 2.
- Glossaire Lehena (Orhi, Iparralde, Laminak, Duroc, Salies-de-Béarn, etc.).
- Description produit minimum 250-500 mots structurée (histoire, caractéristiques, méthode, accords, conservation).
- Pages piliers + articles supports planifiés dans le calendrier éditorial.
- Brief copy validé par Paul avant chaque livraison majeure de contenu.

### Fil rouge accessibilité
- Cible Lighthouse a11y ≥ 95 sur tous les templates.
- Test clavier avant chaque PR de page.
- Contrastes WCAG AA minimum (vérifier la palette terroir Lehena).
- ARIA correctement employé (pas par défaut sur tous les divs).

### Fil rouge perf
- Cibles Core Web Vitals définies par template (cf. `strategie-seo.md` § 3).
- Server Components par défaut, Client uniquement si interactif.
- Pas de lib JS de plus de 30 ko gzip ajoutée sans justification.

---

## 3. Découpage en phases

Chaque phase produit un livrable testable. La numérotation suit l'ordre
recommandé d'exécution. Plusieurs phases peuvent se chevaucher si tu travailles
en parallèle (cf. § dépendances).

### Phase 0 — Fondations (semaine 1)
**Objectif :** verrouiller la stack et préparer l'environnement de travail.

- Confirmer / amender la stack proposée ci-dessus.
- `docker-compose.yml` dev local (Postgres 16 + Redis 7 + MinIO + MeiliSearch).
- Configuration backend : provider S3, provider email Resend, MeiliSearch indexer (squelette).
- ESLint + Prettier + lint-staged + Husky alignés sur les deux apps.
- CI GitHub Actions : install + typecheck + lint + build sur PR.
- ADRs pour les choix structurants (`docs/refonte/adr/`).
- Variables d'env documentées dans un `.env.example` exhaustif.

**Livrable :** `pnpm dev` qui boot tout le monde, CI verte sur une PR vide.

---

### Phase 1 — Modèle métier & catalogue (semaines 2-3)
**Objectif :** modéliser correctement la charcuterie + épicerie Lehena dans Medusa.

- Cartographie des typologies : produits frais (chaîne froid), conserves, épicerie sèche, coffrets, **abonnements** (futur Phase 11).
- **Custom fields produit** via module Medusa custom : `aging_months`, `origin`, `allergens[]`, `conservation_temp`, `ddm_days`, `cure_method`, `nitrite_free: bool`, `terroir`, `tags[]`.
- Catégories + collections (Jambons, Salaisons, Conserves, Épicerie, Coffrets, Cadeaux…).
- Régions / devises / taxes : France, UE, Monde — avec règles de TVA correctes (5,5 % alimentaire vs 20 % épicerie autre).
- Profils de livraison : **réfrigéré** (Chronofresh) vs **sec** (Colissimo) — un produit ne peut être expédié que par le bon profil.
- Stock simple mono-emplacement (la boutique). Multi-emplacement reporté à plus tard.
- Seed riche : 30 produits réalistes pour pouvoir bosser le storefront sans dépendre de la migration.

**Livrable :** admin Medusa avec catalogue jouable, exposé sur `/store/products` côté API.

---

### Phase 2 — Storefront : ossature, design system, **contenu home & copy** (semaines 3-4)
**Objectif :** terminer l'ossature commune **et compléter / réécrire** tout le contenu de la home et des sections clés. L'ancien site a un hero pauvre et un copy à plat (cf. audit) — on en profite pour redresser tout ça.

#### 2a. Ossature technique
- Header Lehena : logo, nav (catégories), bouton compte, panier, sélecteur langue, recherche dans un drawer.
- Footer Lehena : navigation, mentions, paiements acceptés, badges (artisan, Pays Basque), newsletter brandée (zéro Lorem ipsum…).
- Mini-cart drawer redesigné.
- `design-system/` : tokens CSS centralisés, composants atoms (Button, Input, Badge, Tag, Tabs, Accordion, Modal, Drawer) en cohérence avec `globals.css` Lehena.
- Pages 404 / 500 / loading skeletons à la sauce Lehena (404 utile = recommandations + recherche, pas dead-end).

#### 2b. Complétion de la home et copy
À la lumière de `audit-site-actuel.md` § 3 et § 8, on retravaille / complète :
- **Hero éditorial** : 1 promesse forte (ex: *"Charcuterie d'exception au Pays Basque, sans nitrite, depuis 1974"*), 2 CTA hiérarchisés (primaire "Découvrir le Jambon Orhi" / secondaire "Notre histoire"), 1 visuel produit/atelier fort.
- **Bandeau réassurance** structuré : Sans nitrite / Race Duroc Pays Basque / Affinage 24 mois / Livraison Chronofresh / Frais offerts dès X €.
- **Section "Notre signature"** : Jambon Orhi 24 mois en grand, storytelling court + CTA PDP.
- **Section best-sellers** (4-6 produits, cards Lehena, badges).
- **Section "L'atelier en images"** : carrousel ferme + lien vers `/la-ferme`.
- **Engagements chiffrés** (4-6 piliers) : sans nitrite, race Duroc, affinage 24 mois, sel Salies de Béarn, élevage Pays Basque, bien-être animal.
- **Social proof** : 2-3 avis clients vedettes, logos presse si disponibles, étoiles globales.
- **Section coffrets / cadeaux** (manque commercial flagrant aujourd'hui).
- **Carte / "Où nous trouver"** : Lehena est physique au Pays Basque, on l'exploite (favorise local SEO + lien vers `/atelier`).
- **Newsletter brandée** : promesse claire (recettes + nouveautés saisonnières), pas Lorem ipsum, double opt-in.

#### 2c. Brief copywriting (livrable séparé)
- Ton de voix : éditorial, ancré, sensoriel, sans buzzword (à valider avec Paul).
- Glossaire des termes Lehena : *Orhi, Iparralde, patxaran, Laminak, Salies-de-Béarn, Duroc, Iberico, ventrêche…*
- Style bilingue de transition (FR principal, ES/EN réservé phase 4).

#### 2d. SEO embarqué dès cette phase
- `generateMetadata` partagé (helper `lib/seo/metadata.ts`) avec defaults + overrides par page.
- Schemas globaux : `Organization`, `WebSite` (+ `SearchAction`) injectés dans le layout.
- Composant `<Breadcrumb>` + JSON-LD `BreadcrumbList` réutilisable.
- Cf. checklist détaillée `strategie-seo.md` § 11 → Phase 2.

**Livrable :** navigation complète + home riche, copy validé, design cohérent partout sauf PDP/listings.

---

### Phase 3 — Storefront : listings, PDP, recherche (semaines 4-5)
**Objectif :** parcours d'achat visuellement et fonctionnellement complet.

- **Page collection / catégorie** : grid Lehena, filtres custom (terroir, sans nitrite, durée affinage, prix, allergènes).
- **PDP Lehena** : finaliser et brancher tout `lehena-pdp/` (gallery zoom, "Le geste", pairings, reviews, tabs détail, trust-badges) sur les vraies données Medusa + custom fields Phase 1.
- **Page recherche** + autocomplete header : MeiliSearch, indexation au save produit (subscriber Medusa).
- Cross-sell / upsell sur PDP (pairings basés sur tags).
- Récently viewed (localStorage).

**Livrable :** parcours catalogue → PDP → ajout panier complet et beau.

---

### Phase 4 — CMS Pages : finalisation (semaine 4 en parallèle Phase 3)
**Objectif :** terminer la série `docs/cms/` qui est en cours.

- Compléter passes 04 (admin pages UI) → 07 (test & validate).
- Étendre les nodes TipTap : citations presse, blocs galerie terroir, **embed produit** dans le contenu éditorial (pour pousser un produit depuis un article).
- Multi-locale FR / EN / ES sur les pages : `translation_group_id` (cf. doc CMS §1).
- Pages éditoriales clés à créer en seed : `/notre-histoire`, `/la-ferme`, `/engagements`, `/presse`.

**Livrable :** stack CMS complète, pages publiables et indexées.

---

### Phase 5 — Checkout & paiement (semaines 5-6)
**Objectif :** convertir.

- Refonte cart : design Lehena, codes promo, message cadeau, emballage cadeau (custom_field sur line item).
- **Tunnel checkout 3 étapes** : livraison → paiement → récapitulatif. Accessible (clavier + ARIA).
- Stripe Elements (CB + Apple/Google Pay) côté backend (provider Medusa officiel).
- **Alma** (paiement 3x) — provider communautaire ou implém maison.
- Tarifs livraison : règles par poids + zone, gratuit au-delà de seuil, surcoût Chronofresh.
- Cartes cadeaux Medusa natif.
- Préparation cadeau : message + carte papier (option payante).

**Livrable :** une commande test full Stripe + une test Alma vont jusqu'à confirmation.

---

### Phase 6 — Comptes & espace client (semaines 6-7)
**Objectif :** rétention + RGPD.

- Inscription / login email + **magic link** (Resend) en plus du password.
- Espace client : commandes (avec détails + tracking expédition), factures PDF (workflow Medusa), adresses, profil, préférences newsletter.
- **Re-order** en 1 clic depuis l'historique.
- **Wishlist** : module Medusa custom (entité minimale `wishlist_item` linkée au customer + product).
- RGPD : export données (JSON) + suppression de compte + journalisation.

**Livrable :** un client peut tout faire sans contacter le SAV.

---

### Phase 7 — Emails transactionnels & marketing (semaine 7)
**Objectif :** communications cohérentes.

- Templates React Email brandés Lehena : confirmation commande, expédition, livraison, abandon panier, reset password, magic link, facture, retour.
- Subscribers Medusa qui déclenchent l'envoi via Resend.
- Connecteur **Brevo** : sync clients + segments (achète frais / achète sec / VIP).
- Popup newsletter avec double opt-in.
- Page de gestion des consentements.

**Livrable :** chaque action déclenche un email beau, et la newsletter pousse vers Brevo.

---

### Phase 8 — Migration depuis l'ancien Lehena.fr (semaines 7-8)
**Objectif :** ne pas perdre les clients ni le SEO.

- Audit de la source actuelle (Prestashop ? WooCommerce ? Shopify ? autre ?) → à confirmer avant la phase.
- Scripts d'import sous `apps/backend/src/scripts/import-*` :
  - Produits : titres, descriptions, variantes, prix, custom fields → mapping vers nouveau modèle.
  - Médias : download depuis l'ancien CDN → ré-upload vers Scaleway + URLs propres.
  - Catégories : mapping ancienne arbo → nouvelle.
  - Clients : email + nom + adresses → import sans mot de passe.
- Email "ton compte a été migré, réinitialise ton mot de passe" envoyé à tous via Resend (avec window de 30 jours avant désactivation).
- **Plan de redirections 301** : table `redirects` (ancienne URL → nouvelle URL), middleware Next.js qui les applique, sitemap d'archive pour aider Google.
- Sous-set représentatif (50 produits + 100 clients) testé avant le run final.

**Livrable :** dataset complet importé sur l'env staging, redirects testés.

---

### Phase 9 — SEO : audit final + content marketing + local (semaines 8-9)
**Objectif :** aller bien au-delà du SEO technique de base — c'est la phase
où on capitalise sur tout ce qu'on a posé en amont (cf. `strategie-seo.md`).
Le SEO étant un fil rouge transverse, à ce stade le technique est *déjà* en
place ; cette phase finalise, audite, et produit le contenu d'autorité.

#### 9a. Finition SEO technique
- Sitemaps segmentés : `sitemap-products`, `sitemap-categories`, `sitemap-pages`, `sitemap-articles`, `sitemap-recipes`. Index sitemap global.
- `robots.txt` final (autorise `/`, bloque `/checkout`, `/account`, `/cart`, `/api`, `/admin`).
- Audit Screaming Frog complet : 0 erreur 4xx/5xx interne, 0 chaîne de redirects > 1 saut.
- Validation `validator.schema.org` sur tous les templates (Product, Article, Recipe, FAQ, BreadcrumbList, LocalBusiness, Organization).
- Rich Results Test sur PDP, Article, Recipe, FAQ — tous passent.
- hreflang opérationnel sur les pages multilingues, sans erreur Search Console.
- `next-sitemap` configuré, sitemap soumis à Search Console **avant** la bascule.

#### 9b. Contenu d'autorité — pages piliers
Production des **6 pages piliers** définies dans `strategie-seo.md` § 2 :
1. Tout savoir sur le jambon sans nitrite
2. Race Duroc : le cochon d'exception
3. L'affinage 24 mois expliqué
4. Patxaran : la liqueur basque traditionnelle
5. Comment découper un jambon entier
6. Charcuterie & santé

Chaque pilier : 2000-4000 mots, sommaire ancré, FAQ schema, liens vers articles supports + produits, image hero unique.

#### 9c. Articles supports — calendrier éditorial
Production minimale : **5 articles par pilier** = ~30 articles publiés ou planifiés à la mise en ligne. Ceux non publiés : planifiés dans le `calendrier-editorial.md` (livrable de cette phase) avec pondération SEO (volume × concurrence × intent).

#### 9d. Local SEO
- Page `/atelier` complète : adresse, photos, horaires, plan, contact, schema `LocalBusiness` (subtype `FoodStore`).
- Audit + optimisation **Google Business Profile** : photos, posts hebdo, réponses aux avis, attributs (parking, livraison sur place, etc.).
- NAP cohérent (Name / Address / Phone) : footer + page atelier + GBP + schema → strictement identique.
- Inscription Bing Webmaster Tools (négligé en France, ~5-10 % du trafic).
- Citations locales : Pages Jaunes, TripAdvisor, office de tourisme Pays Basque.

#### 9e. Performance & accessibilité (mesure finale)
- Audit **Lighthouse CI** sur 5 templates clés : home, catégorie, PDP, article, page éditoriale. Cible ≥ 90 partout, ≥ 95 SEO + a11y. Seuil bloquant en CI.
- Cibles Core Web Vitals (cf. `strategie-seo.md` § 3) : LCP < 2.0 s, INP < 200 ms, CLS < 0.05.
- Optimisation images : `next/image` AVIF, dimensions explicites, `priority` sur LCP.
- Audit axe-core : focus, contrastes, ARIA, navigation clavier. Cible ≥ 95.
- Cache ISR + revalidation par tags (déjà branché via subscribers Pages — à étendre aux Products / Categories / Articles).

#### 9f. Tracking SEO
- Search Console FR + ES + EN configurées et vérifiées.
- Bing Webmaster Tools idem.
- Outil de suivi positionnement : Ahrefs si budget, sinon MyPositeo / SEObserver (FR).
- Dashboard Plausible avec funnel acquisition (organique → PDP → checkout → purchase).

**Livrables :**
- Rapports Lighthouse CI, axe-core, Screaming Frog, Rich Results.
- 6 pages piliers publiées + ≥ 30 articles produits ou planifiés.
- Page atelier + GBP optimisé.
- `calendrier-editorial.md` 12 mois.
- Dashboard SEO opérationnel.

---

### Phase 10 — Admin custom & outillage métier (semaine 10)
**Objectif :** rendre l'admin utile au quotidien Lehena.

- Widgets admin : ventes du jour, commandes en cours, stock bas, **alerte DDM courte** (< 30j).
- Module **Recettes** : entité `recipe`, admin de création, lien M2M vers produits, rendu storefront `/recettes/[slug]` + pairings PDP.
- Module **Avis** simple : entité `review`, modération admin, affichage PDP, tri par note + récence (pas Trustpilot tant qu'on n'a pas le volume).
- Workflows : alerte stock bas (email manager), alerte DDM courte (admin badge + email).
- Export CSV commandes pour le comptable (filtres par période).

**Livrable :** l'équipe Lehena peut piloter sans toucher la base.

---

### Phase 11 — Abonnements (semaines 10-11) — *optionnel, à arbitrer*
**Objectif :** revenu récurrent type "box mensuelle Pays Basque".

- Module `subscription` custom : plan, fréquence, statut, prochaine livraison.
- Provider paiement récurrent Stripe.
- Tunnel d'abonnement dédié.
- Espace client : pause, skip, modification, annulation.

À garder en option : si on est juste sur le délai, on coupe et on le fait en V2.

---

### Phase 12 — Analytics, monitoring, observabilité (semaine 11)
- Plausible : events e-commerce (view_item, add_to_cart, begin_checkout, purchase) + funnels.
- Sentry front + back, sourcemaps activés.
- Logs structurés (pino) côté backend, dashboard simple (Better Stack ou Grafana Cloud free).
- Healthchecks + alertes uptime (UptimeRobot ou Better Stack).
- Optionnel : GTM pour campagnes Meta/Google Ads.

**Livrable :** un dashboard "santé du site" pour le monitoring quotidien.

---

### Phase 13 — DevOps, CI/CD, tests (semaine 11-12)
- Dockerfiles backend + storefront, multi-stage build.
- Pipeline complète : lint + typecheck + tests unitaires + build + scan deps (`pnpm audit`).
- Déploiement automatisé : preview Vercel sur chaque PR storefront, staging Railway sur `develop`.
- Backups Postgres automatisés (quotidien + rétention 30j).
- Tests E2E **Playwright** : home → catégorie → PDP → ajout panier → checkout (Stripe test) → confirmation. Lancés en CI sur main.

**Livrable :** un push `main` part en prod sans intervention manuelle (avec garde-fou approval manuel sur le déploiement).

---

### Phase 14 — Recette & bascule (semaine 12+)
- Recette fonctionnelle complète (checklist par module).
- Recette responsive : iPhone SE / iPhone 15 / iPad / desktop 1280 / desktop 1920.
- Bêta privée 1 semaine avec ~10 clients fidèles : retours intégrés.
- Préparation bascule : freeze code, dry-run migration avec dump prod ancien site, plan de rollback documenté.
- Bascule DNS, monitoring renforcé J0 → J+7.
- Post-mortem rapide, backlog V1.1.

**Livrable :** site en ligne, plan de remédiation prêt si pépin.

---

## 4. Dépendances et chemin critique

```
Phase 0 ─► Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 5 ─► Phase 14
                                  ▲          ▲
                       Phase 4 ───┘          │
                                  Phase 6 ───┤
                                  Phase 7 ───┤
                                  Phase 8 ───┤  (peut commencer dès Phase 1 stable)
                                  Phase 9 ───┤
                                  Phase 10 ──┤
                                  Phase 12 ──┤
                                  Phase 13 ──┘
```

- **Phases 1 et 4** doivent être stables avant **Phase 8** (migration) — sinon mapping incertain.
- **Phase 5** (checkout) bloque **Phase 14** (bascule).
- **Phase 9** (redirections + sitemap) doit être prête **avant** la bascule, sous peine de perdre du SEO.
- **Phase 11** (abonnements) est isolée : à arbitrer en milieu de parcours selon avance.

---

## 5. Risques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Qualité des données de l'ancien site (médias HD manquants, descriptions inégales) | Migration ralentie, contenu storefront pauvre | Audit source dès Phase 0, prévoir une passe rédaction/photo en parallèle |
| Intégration Chronofresh (API + tarifs réels par poids/zone) | Bloque Phase 5 | Demander accès API + grille tarifaire dès semaine 2 |
| Module Alma communautaire pas à jour Medusa v2 | Bloque Phase 5 | Évaluer dès Phase 0, prévoir fallback : Alma uniquement via lien hosted |
| Volume catalogue inconnu | Sous-estime de Phase 8 | Scope de la migration confirmé après audit Phase 0 |
| Charcuterie = produit régulé (étiquetage, allergènes) | Risque conformité | Custom fields obligatoires dès Phase 1, validation par un opérationnel Lehena |

---

## 6. Estimation effort

- **Total :** ~55-70 j-h sur ~12 semaines.
- Hypothèse : 1 dev senior temps plein, ou 2 mid-level mi-temps.
- Marge de 15 % à prévoir pour les imprévus (typique sur ce type de refonte).

---

## 7. Suite : série de prompts

Une fois ce plan validé, on prépare une série de prompts (un par phase, sur le
modèle des séries `cms/` et `pilot-ai/`) que tu pourras copier-coller dans
Claude Code au fur et à mesure. Chaque prompt :

- rappellera le contexte projet et la phase ;
- listera les contraintes (TypeScript strict, validation zod, workflows Medusa, etc.) ;
- demandera à Claude Code de poser ses questions de clarification avant de coder ;
- définira un livrable testable + une checklist de validation.

Les prompts vivront dans `docs/refonte/01-*.md` à `docs/refonte/14-*.md`.
