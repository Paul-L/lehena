# Recette fonctionnelle — checklist exhaustive

À cocher avant tout passage en bêta privée. Faire 2 passages
indépendants : un par Paul, un par le dev. Toute case décochée = ticket.

> Mode : tester sur **staging** (≈ identique à prod). Cartes Stripe
> en mode test (cf. https://stripe.com/docs/testing).

---

## 1. Catalogue & recherche

### Catégories

- [ ] /fr/store affiche les 30+ produits seedés
- [ ] Les 7 catégories cibles sont navigables (`jambons-iparralde`, `salaisons`, `patxaran-spiritueux`, `coffrets-cadeaux`, `accessoires`, `epicerie-basque`, `fromage`)
- [ ] Tri (prix asc/desc, nouveauté) fonctionne sans rechargement
- [ ] Filtres facettes (race, origine, format, allergène, mois d'affinage) actualisent la grille avec URL
- [ ] Pagination ou infinite scroll OK
- [ ] Breadcrumb correct sur chaque catégorie

### PDP

- [ ] PDP charge < 2 s sur connexion 3G simulée (Chrome DevTools)
- [ ] Galerie multi-images + zoom (clavier + tactile)
- [ ] Sélecteur de variant met à jour prix + stock sans refresh (URL `?v=...`)
- [ ] Badges (sans nitrite, X mois) affichés correctement
- [ ] FAQ produit (Phase 4 module FAQ) cliquable accordion
- [ ] Onglets (Description, Origine, Affinage, Conservation, Ingrédients) tous remplis
- [ ] Cross-sell affiché et pertinent
- [ ] JSON-LD Product valide ([validator.schema.org](https://validator.schema.org/))
- [ ] AggregateRating apparaît UNIQUEMENT si avis approuvés (sinon omis du schema)

### Recherche

- [ ] Recherche typo-tolérante ("jamon" → "jambon")
- [ ] Autocomplete header < 200 ms perçu
- [ ] `/fr/recherche?q=X` rend des résultats même sans JS (SSR)
- [ ] `/recherche` est `noindex`

## 2. Cart & checkout

### Cart

- [ ] Ajout depuis : PDP, card catégorie, mini-cart drawer
- [ ] Quantité modifiable sans rechargement
- [ ] Suppression d'un item
- [ ] Code promo : valide → remise appliquée, invalide → erreur claire
- [ ] Message cadeau par ligne enregistré
- [ ] Persistance panier 30 j (cookie)
- [ ] Affichage TVA détaillée (5,5 % / 20 %)

### Checkout

- [ ] Tunnel 4 étapes (address → delivery → payment → review)
- [ ] StepBreadcrumb cliquable sur étapes validées
- [ ] Adresse autocomplete (si Google Places branché — V1.5 sinon)
- [ ] Sélection profil livraison auto si mono-profile
- [ ] **Panier mixte fresh+ambient** → bandeau "expédition cold-chain forcée" + options Colissimo masquées
- [ ] **Frais offerts > 50 € TTC** affichage "Offerte" + bandeau "encore X € pour la livraison offerte" en dessous
- [ ] Stripe CB OK (carte `4242 4242 4242 4242`)
- [ ] Stripe 3DS OK (carte `4000 0027 6000 3184`)
- [ ] Stripe refusée OK (carte `4000 0000 0000 0002`) → erreur inline, panier conservé
- [ ] CGV checkbox obligatoire avant payment intent
- [ ] Redirection /order/[id]/confirmed après succès
- [ ] Email order-confirmation reçu (vérifier Resend dashboard ou stub log)

### Édition livraison

- [ ] Frais Chronofresh FR / Corse / EU calculés selon grille (`pricing.ts`)
- [ ] Frais Colissimo idem pour ambient
- [ ] OUT_OF_RANGE country → option masquée

## 3. Comptes client

### Auth

- [ ] Inscription email/password → welcome email
- [ ] Login email/password
- [ ] Reset password (lien email 15 min)
- [ ] Magic link (lien email 15 min, single-use)
- [ ] Logout

### Espace client

- [ ] /account dashboard accessible
- [ ] /account/profile édite nom/prénom/téléphone
- [ ] /account/addresses CRUD adresses
- [ ] /account/orders liste paginée
- [ ] /account/orders/details/[id] détail complet
- [ ] **Re-order** ajoute items au panier + signale indispos via toast
- [ ] /account/wishlist liste + retrait
- [ ] /account/preferences toggles newsletter
- [ ] /account/subscriptions (si Phase 11)
- [ ] /account/data export RGPD JSON
- [ ] /account/data delete-request → email confirmation 1 h
- [ ] /account/data/delete-confirm anonymise (email = `deleted-<id>@lehena.fr`)

### Wishlist invité

- [ ] Ajouter au cœur depuis PDP non connecté → localStorage
- [ ] Login → migration vers server-side wishlist
- [ ] localStorage vidé après migration

## 4. CMS éditorial

- [ ] /fr/notre-histoire publiée + JSON-LD Article
- [ ] /fr/la-ferme publiée
- [ ] /fr/engagements publiée
- [ ] /fr/presse publiée
- [ ] /fr/atelier publiée + JSON-LD LocalBusiness (validator.schema.org)
- [ ] /fr/contact formulaire fonctionnel → admin contact-submissions
- [ ] /fr/cgv publiée
- [ ] /fr/mentions-legales publiée
- [ ] /fr/politique-confidentialite publiée
- [ ] /fr/faq publiée

### Articles

- [ ] Créer un article admin (type=article, author_id) → publié sur /fr/[slug]
- [ ] JSON-LD BlogPosting valide
- [ ] Inclus dans /sitemap-articles.xml

### Recettes

- [ ] Créer une recette (type=recipe) → publié sur /fr/recettes/[slug]
- [ ] JSON-LD Recipe valide (validator + Google Rich Results Test)

## 5. Multilingue

- [ ] /fr / /es / /gb basculent via la map countryCode → locale
- [ ] hreflang dans le `<head>` de chaque page traduite
- [ ] Sitemap multilingue avec xhtml:link
- [ ] Page non traduite → fallback FR + `noindex` correct

## 6. Emails (Phase 7)

Avec `RESEND_API_KEY` test ou `RESEND_DEV_MODE=true`, déclencher chaque flow et vérifier réception :

- [ ] welcome (signup)
- [ ] password-reset
- [ ] magic-link
- [ ] order-confirmation
- [ ] order-shipped
- [ ] order-delivered
- [ ] abandoned-cart J+1 (laisser un cart 24 h)
- [ ] abandoned-cart J+3 (laisser 72 h)
- [ ] invoice (PDF en pièce jointe)
- [ ] contact-form (forwardé contact@lehena.fr)
- [ ] newsletter-double-opt-in (si Brevo branché V1.5)
- [ ] account-deletion-confirmation
- [ ] migration-welcome (post-import Phase 8)
- [ ] review-request J+10
- [ ] subscription-welcome (Phase 11)
- [ ] subscription-payment-failed

Rendu testé sur :

- [ ] Gmail web
- [ ] Outlook web
- [ ] Apple Mail
- [ ] Dark mode iOS

## 7. Admin (Phase 10)

- [ ] /admin/reviews : list + filter pending + approve/reject
- [ ] /admin/contact-submissions : list + détail
- [ ] /admin/pages : list + créer page/article/recipe
- [ ] /admin/exports/orders → CSV ouvre proprement Excel FR
- [ ] Cron stock-low-alert (07:00) → email à atelier@lehena.fr
- [ ] Cron ddm-short-alert (07:30) → email
- [ ] Cron abandoned-cart (09:00)
- [ ] Cron review-request (10:00)

## 8. SEO

- [ ] /sitemap.xml retourne sitemapindex avec 4 sub-sitemaps
- [ ] /sitemap-products.xml lis les 30+ produits
- [ ] /robots.txt disallow /api, /account, /checkout, /cart, /preferences, /recherche
- [ ] **JSON-LD validés** sur validator.schema.org :
  - [ ] Product (PDP)
  - [ ] BreadcrumbList (PDP + catégorie)
  - [ ] Organization (toutes pages)
  - [ ] WebSite (toutes pages)
  - [ ] FAQPage (PDP avec FAQ)
  - [ ] LocalBusiness (/atelier)
  - [ ] Article (articles éditoriaux)
  - [ ] Recipe (recettes)
- [ ] Lighthouse CI passe les seuils (Perf ≥ 90, SEO 100, A11y ≥ 95) sur 5 templates

## 9. Migration WP → Medusa (dry-run final)

- [ ] migrate-products dry-run → rapport JSON, 0 failed
- [ ] migrate-customers dry-run → rapport, 0 failed
- [ ] migrate-media dry-run → URLs uniques cohérent
- [ ] build-redirects dry-run → tous les anciens slugs présents
- [ ] curl test sur 20 anciennes URLs random → 301 vers les bonnes destinations

## 10. Observabilité (Phase 12)

- [ ] Plausible reçoit `view_item`, `add_to_cart`, `begin_checkout`, `purchase` (avec revenue)
- [ ] Sentry reçoit une erreur test depuis storefront + backend
- [ ] Pino logs JSON visibles sur Railway / Hetzner avec `request_id`
- [ ] /health backend retourne 200 + `checks` détaillés
- [ ] /api/health storefront retourne 200
- [ ] UptimeRobot (ou Better Stack) configuré sur /api/health, alerte Slack/email reçue sur down test

## 11. Cas limites

- [ ] Site accessible sans JS (SSR check) sur home + catégorie + PDP
- [ ] /fr/404 (page inexistante) → 404 + design Lehena
- [ ] /fr/500 (forcer une erreur) → 500 + design Lehena
- [ ] /fr/api/\* → 404 (jamais exposé)
- [ ] Charset UTF-8 (caractères accentués FR partout : ê, ç, à, é…)
- [ ] Aucun "Lorem ipsum" en ligne (recherche grep dans le HTML rendu)

---

## Synthèse

Le mode opératoire est :

1. Faire un passage complet (3-4 h)
2. Cocher tout ce qui est OK
3. Lister les KO dans un Google Doc (`recette-bugs-YYYY-MM-DD.md`)
4. Triage : P0 (bloquant), P1 (majeur), P2 (mineur)
5. P0 + P1 fixés AVANT bêta privée
6. P2 partent en backlog V1.1

Si > 5 P0 ou > 15 P1 : on retarde la bascule.
